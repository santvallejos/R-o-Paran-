#!/usr/bin/env python3
"""
Procesa el relieve de una localidad y genera todo lo que usa la app.

    python procesar.py paso-de-la-patria                # Copernicus GLO-30 + correcciones
    python procesar.py paso-de-la-patria --dem mde.tif  # DEM propio (IGN, FABDEM, drone…)
    python procesar.py paso-de-la-patria --subir        # además, carga las zonas en Supabase
    python procesar.py paso-de-la-patria --subir-archivos       # y sube public/data/relieve/<id> a Storage
    python procesar.py paso-de-la-patria --solo-subir-archivos  # sólo sube lo ya generado, sin reprocesar

Salidas:
    public/data/relieve/<id>/modelo.json, elev.png, umbral.png   modelo precalculado para la app
    public/data/relieve/<id>/terreno/{z}/{x}/{y}.png             relieve 3D (terrain-RGB)
    procesamiento/salida/<id>/zonas.geojson, version.json         zonas inundables por nivel
    procesamiento/salida/<id>/dem_corregido.tif, umbral.tif       para revisar en QGIS
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from rasterio.enums import Resampling

from relieve import correcciones, escena3d, exportar, fuentes, supabase
from relieve.grilla import Grilla, lonlat_a_pixel
from relieve.inundacion import calcular_umbrales

RAIZ = Path(__file__).resolve().parent.parent

# La consola de Windows usa cp1252 y no puede imprimir caracteres como "≈": forzamos UTF-8
# y reemplazamos lo que igual no se pueda mostrar, para que un log no corte el procesamiento.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def log(msg: str) -> None:
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def niveles(cfg: dict) -> list[float]:
    n = cfg["nivelesZonas_m"]
    pasos = int(round((n["hasta"] - n["desde"]) / n["paso"]))
    return [round(n["desde"] + i * n["paso"], 2) for i in range(pasos + 1)]


def cargar_defensas(localidad: str) -> list[dict]:
    lineas = []
    local = RAIZ / "procesamiento" / "datos" / localidad / "defensas.geojson"
    if local.exists():
        for f in json.loads(local.read_text())["features"]:
            lineas.append({"nombre": f["properties"].get("nombre"), "cota_m": f["properties"].get("cota_m"), "geom": f["geometry"]})
    if supabase.disponible():
        lineas += supabase.defensas(localidad)
    return lineas


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("localidad")
    ap.add_argument("--dem", type=Path, help="GeoTIFF propio en lugar de Copernicus GLO-30")
    ap.add_argument("--nombre-dem", help="Nombre de la fuente del DEM propio (para mostrar en la app)")
    ap.add_argument("--sin-correccion-cobertura", action="store_true")
    ap.add_argument("--sin-tiles", action="store_true", help="No regenerar los tiles de relieve 3D")
    ap.add_argument("--sin-escena3d", action="store_true", help="No generar árboles, edificios y cobertura para la vista 3D")
    ap.add_argument("--subir", action="store_true", help="Cargar la versión y sus zonas en Supabase")
    ap.add_argument("--subir-archivos", action="store_true",
                    help="Al terminar, subir public/data/relieve/<id> al bucket `relieve` de Supabase Storage")
    ap.add_argument("--solo-subir-archivos", action="store_true",
                    help="No reprocesar: sólo subir a Storage la carpeta public/data/relieve/<id> existente "
                         "(con --subir, también carga salida/<id>/version.json)")
    args = ap.parse_args()

    publico = RAIZ / "public" / "data" / "relieve" / args.localidad
    # Modo sólo subida: no hace falta la configuración de procesamiento ni bajar nada.
    if args.solo_subir_archivos:
        if not (publico / "modelo.json").exists():
            log(f"No hay modelo en {publico.relative_to(RAIZ)}: procesá la localidad primero.")
            return 1
        # Con --subir, también carga las zonas ya calculadas (salida/<id>/version.json).
        if args.subir:
            ruta_version = RAIZ / "procesamiento" / "salida" / args.localidad / "version.json"
            vid = supabase.cargar_version(json.loads(ruta_version.read_text()))
            log(f"Versión de relieve {vid} cargada en Supabase desde {ruta_version.relative_to(RAIZ)}")
        subir_archivos(args.localidad, publico)
        return 0

    loc = json.loads((RAIZ / "shared" / "localidades" / f"{args.localidad}.json").read_text())
    p = loc["procesamiento"]
    cota_cero = loc["hidrometro"]["cotaCero_m"]
    z = loc["dem"]["zoomModelo"]
    cache = RAIZ / "procesamiento" / "cache" / args.localidad
    salida = RAIZ / "procesamiento" / "salida" / args.localidad

    # Área de tiles = área de estudio + margen; la grilla grande está alineada a tiles.
    m = p["margenTiles_grados"]
    bbox = loc["bbox"]
    bbox_tiles = [bbox[0] - m, bbox[1] - m, bbox[2] + m, bbox[3] + m]
    grande = Grilla.desde_bbox(bbox_tiles, z, alinear_a_tiles=True)
    modelo = Grilla.desde_bbox(bbox, z)
    fil, col = grande.ventana_de(modelo)
    lectura_bounds = grande.bounds_lonlat
    log(f"Grilla {grande.ancho}x{grande.alto} (z{z}, {grande.celda_m:.1f} m/px); modelo {modelo.ancho}x{modelo.alto}")

    # 1. Relieve y capas auxiliares
    if args.dem:
        fuente_dem = args.nombre_dem or args.dem.stem
        ruta_dem = args.dem
    else:
        fuente_dem = "Copernicus GLO-30"
        log("Bajando Copernicus GLO-30…")
        ruta_dem = fuentes.copernicus_dem(lectura_bounds, cache)
    elev = fuentes.a_grilla(ruta_dem, grande, Resampling.bilinear)
    log("Bajando máscara de agua (Copernicus WBM)…")
    wbm = fuentes.a_grilla(fuentes.copernicus_agua(lectura_bounds, cache), grande, Resampling.nearest, np.uint8, nodata=255)
    agua = np.isin(wbm, (fuentes.WBM_LAGO, fuentes.WBM_RIO))
    rio = wbm == fuentes.WBM_RIO

    rio_modelo = rio[fil, col]
    if not rio_modelo.any():
        log("La máscara no marca río en el área: uso las semillas de la configuración.")
        rio_modelo = np.zeros(rio_modelo.shape, bool)
        for lon, lat in loc["semillasRio"]:
            x, y = lonlat_a_pixel(lon, lat, z)
            rio_modelo[int(y) - modelo.y0, int(x) - modelo.x0] = True
    cota_agua = float(np.median(elev[fil, col][rio_modelo]))
    log(f"Pelo de agua del DEM: {cota_agua:.2f} m (≈ {cota_agua - cota_cero:.2f} m en el hidrómetro)")

    # 2. Correcciones
    pasos = []
    log("Bajando cobertura del suelo (ESA WorldCover 10 m)…")
    cob = fuentes.a_grilla(fuentes.worldcover(lectura_bounds, cache), grande, Resampling.mode, np.uint8, nodata=0)
    if not args.sin_correccion_cobertura:
        elev = correcciones.corregir_cobertura(elev, cob, agua, p["correccionCobertura_m"])
        pasos.append({"correccion_cobertura": p["correccionCobertura_m"], "fuente": "ESA WorldCover 2021"})
    elev = correcciones.filtrar_ruido(elev, agua, p["filtroMediana_px"])
    pasos.append({"filtro_mediana_px": p["filtroMediana_px"]})
    elev = correcciones.piso_en_agua(elev, agua, cota_agua)

    defensas = cargar_defensas(args.localidad)
    if defensas:
        mascara, cotas = exportar.rasterizar_lineas(grande, defensas)
        elev = correcciones.quemar_barreras(elev, mascara, cotas)
        log(f"Defensas aplicadas como barreras: {len(defensas)}")
    pasos.append({"defensas": len(defensas)})

    # 3. Modelo de inundación
    log("Calculando umbrales de inundación (Priority-Flood)…")
    t = time.time()
    elev_m = elev[fil, col]
    umbral = calcular_umbrales(elev_m, rio_modelo)
    log(f"  listo en {time.time() - t:.1f} s")
    cauce = agua[fil, col]
    # Respaldo para apps viejas sin cauce.png: todo lo que está al nivel del río.
    cota_cauce = cota_agua + 0.25

    procesado = datetime.now(timezone.utc).isoformat(timespec="seconds")
    meta = {
        "localidad": args.localidad,
        "fuenteDem": fuente_dem,
        "procesadoEn": procesado,
        "cotaCero_m": cota_cero,
        "pasos": pasos,
    }

    # 4. Salidas
    exportar.modelo_para_app(publico, modelo, elev_m, umbral, cauce, cota_cauce, meta)
    exportar.guardar_geotiff(salida / "dem_corregido.tif", grande, elev)
    exportar.guardar_geotiff(salida / "umbral.tif", modelo, umbral)
    log(f"Modelo para la app en {publico.relative_to(RAIZ)}")

    if not args.sin_escena3d:
        e3 = publico / "escena"
        e3.mkdir(parents=True, exist_ok=True)
        cfg3 = p.get("escena3d", {})
        escena3d.cobertura_png(e3, cob[fil, col])
        n_arb = escena3d.arboles(e3, modelo, cob[fil, col], cauce, cfg3.get("densidadArboles", 0.55), cfg3.get("maxArboles", 25000))
        log("Bajando edificios (Overture Maps)…")
        info = escena3d.edificios(e3, modelo, fuentes.edificios_overture(loc["bbox"], cache), elev_m, umbral)
        log(f"Escena 3D: {n_arb} árboles, {info['edificios']} edificios (Overture {info['release_overture']})")
        meta["escena3d"] = {"arboles": n_arb, **info}
        (publico / "modelo.json").write_text(json.dumps({**json.loads((publico / "modelo.json").read_text()), "escena3d": meta["escena3d"]}, ensure_ascii=False, indent=2))

    if not args.sin_tiles:
        zmin, zmax = p["zoomTiles"]
        n = exportar.tiles_terreno(publico / "terreno", grande, elev, bbox_tiles, range(zmin, zmax + 1))
        # `tiles` relativo a la carpeta de la localidad: la app lo resuelve contra /data/relieve/<id>
        # o contra el bucket de Storage (src/lib/relieve.ts), según dónde estén los archivos.
        (publico / "terreno.json").write_text(
            json.dumps({"tiles": "terreno/{z}/{x}/{y}.png", "minzoom": zmin, "maxzoom": zmax,
                        "bounds": [round(v, 5) for v in grande.bounds_lonlat], "encoding": "terrarium", "fuente": fuente_dem}, indent=2)
        )
        log(f"Tiles de relieve: {n}")

    log("Generando zonas inundables por nivel…")
    zonas = exportar.zonas_por_nivel(modelo, umbral, cauce, cota_cero, niveles(p), p["simplificarZonas_m"])
    exportar.geojson_zonas(zonas, salida / "zonas.geojson", args.localidad)
    version = {
        "localidad_id": args.localidad,
        "fuente_dem": fuente_dem,
        "resolucion_m": round(modelo.celda_m, 2),
        "cota_cero_m": cota_cero,
        "parametros": {"pasos": pasos, "cota_agua_dem_m": round(cota_agua, 3)},
        "procesado_en": procesado,
        "activar": True,
        "zonas": zonas,
    }
    (salida / "version.json").write_text(json.dumps(version, separators=(",", ":")))
    for zz in zonas[:: max(1, len(zonas) // 6)]:
        log(f"  {zz['altura_m']:.2f} m → {zz['superficie_ha']:.0f} ha")

    if args.subir:
        vid = supabase.cargar_version(version)
        log(f"Versión de relieve {vid} cargada en Supabase con {len(zonas)} zonas")
    if args.subir_archivos:
        subir_archivos(args.localidad, publico)
    return 0


def subir_archivos(localidad: str, publico: Path) -> None:
    """Sube la carpeta del modelo, los tiles y la escena al bucket `relieve` de Storage."""
    log(f"Subiendo {publico.relative_to(RAIZ)} a Supabase Storage (bucket {supabase.BUCKET})…")
    n, total = supabase.subir_archivos(localidad, publico)
    log(f"Storage: {n} archivos, {total / 1e6:.1f} MB en {supabase.BUCKET}/{localidad}/")


if __name__ == "__main__":
    sys.exit(main())
