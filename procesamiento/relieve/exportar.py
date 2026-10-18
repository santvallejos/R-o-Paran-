"""Salidas: modelo para la app, tiles de relieve 3D y zonas inundables por nivel."""
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import rasterio
from PIL import Image
from rasterio import features
from rasterio.enums import Resampling
from rasterio.warp import reproject, transform_geom
from shapely.geometry import mapping, shape
from shapely.ops import unary_union

from .grilla import Grilla

SIN_DATO = 9000.0  # umbral de celdas que nunca se conectan con el río


def a_terrarium(v: np.ndarray, paso: float | None = None) -> np.ndarray:
    """Codificación Terrarium (la misma que usa MapLibre): v = R*256 + G + B/256 - 32768."""
    v = np.where(np.isfinite(v), v, SIN_DATO).astype(np.float64)
    if paso:
        v = np.round(v / paso) * paso
    v = np.clip(v + 32768, 0, 65535.99)
    r = np.floor(v / 256)
    g = np.floor(v - r * 256)
    b = np.floor((v - r * 256 - g) * 256)
    return np.stack([r, g, b], axis=-1).astype(np.uint8)


def de_terrarium(rgb: np.ndarray) -> np.ndarray:
    rgb = rgb.astype(np.float64)
    return (rgb[..., 0] * 256 + rgb[..., 1] + rgb[..., 2] / 256 - 32768).astype(np.float32)


def guardar_png(rgb: np.ndarray, ruta: Path) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgb, "RGB").save(ruta, optimize=True)


def modelo_para_app(destino: Path, grilla: Grilla, elev: np.ndarray, umbral: np.ndarray, cauce: np.ndarray, cota_cauce: float, meta: dict) -> None:
    guardar_png(a_terrarium(elev), destino / "elev.png")
    guardar_png(a_terrarium(umbral), destino / "umbral.png")
    # Agua permanente (río y lagunas): no se pinta ni se cuenta como inundación.
    Image.fromarray(np.where(cauce, 255, 0).astype(np.uint8), "L").save(destino / "cauce.png", optimize=True)
    (destino / "modelo.json").write_text(
        json.dumps(
            {
                "ancho": grilla.ancho,
                "alto": grilla.alto,
                "esquinas": grilla.esquinas,
                "celda_m": round(grilla.celda_m, 3),
                "cotaCauce": round(float(cota_cauce), 3),
                "sinDato": SIN_DATO,
                **meta,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


def tiles_terreno(destino: Path, grilla_fuente: Grilla, elev: np.ndarray, bbox: list[float], zooms: range) -> int:
    """Tiles terrain-RGB del DEM corregido para el relieve 3D. Devuelve la cantidad escrita."""
    total = 0
    for z in zooms:
        for tx, ty in Grilla.desde_bbox(bbox, z, alinear_a_tiles=True).tiles():
            g = Grilla.de_tile(z, tx, ty)
            salida = np.full((g.alto, g.ancho), np.nan, np.float32)
            reproject(
                source=elev,
                destination=salida,
                src_transform=grilla_fuente.transform,
                src_crs="EPSG:3857",
                dst_transform=g.transform,
                dst_crs="EPSG:3857",
                dst_nodata=np.nan,
                resampling=Resampling.bilinear if z >= grilla_fuente.z else Resampling.average,
            )
            if np.isnan(salida).all():
                continue
            # Bordes fuera de los datos: se rellenan con el valor más cercano para no crear paredes.
            if np.isnan(salida).any():
                from scipy import ndimage

                faltan = np.isnan(salida)
                _, (fi, ci) = ndimage.distance_transform_edt(faltan, return_indices=True)
                salida = salida[fi, ci]
            guardar_png(a_terrarium(salida, paso=0.125), destino / str(z) / str(tx) / f"{ty}.png")
            total += 1
    return total


def zonas_por_nivel(
    grilla: Grilla, umbral: np.ndarray, cauce: np.ndarray, cota_cero: float, niveles: list[float], simplificar_m: float, min_ha: float = 0.5
) -> list[dict]:
    """Polígonos (EPSG:4326) de lo inundado fuera del cauce para cada altura del hidrómetro."""
    celda_ha = grilla.celda_m**2 / 10_000
    min_px = max(1, int(math.ceil(min_ha / celda_ha)))
    # Las distancias en Web Mercator están infladas por 1/cos(lat).
    tolerancia = simplificar_m / math.cos(math.radians(grilla.lat_media))
    zonas = []
    for h in niveles:
        cota = h + cota_cero
        mascara = ((umbral <= cota) & ~cauce).astype(np.uint8)
        if mascara.any():
            mascara = features.sieve(mascara, size=min_px, connectivity=4)
        sup_ha = float(mascara.sum() * celda_ha)
        poligonos = [shape(g) for g, v in features.shapes(mascara, mask=mascara.astype(bool), transform=grilla.transform, connectivity=4) if v]
        if not poligonos:
            continue
        geom = unary_union(poligonos).simplify(tolerancia, preserve_topology=True)
        if geom.is_empty:
            continue
        geo = transform_geom("EPSG:3857", "EPSG:4326", mapping(geom), precision=6)
        if geo["type"] == "Polygon":
            geo = {"type": "MultiPolygon", "coordinates": [geo["coordinates"]]}
        zonas.append({"altura_m": round(h, 2), "cota_m": round(cota, 3), "superficie_ha": round(sup_ha, 2), "geom": geo})
    return zonas


def geojson_zonas(zonas: list[dict], ruta: Path, localidad: str) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    fc = {
        "type": "FeatureCollection",
        "features": [
            {"type": "Feature", "geometry": z["geom"], "properties": {"localidad": localidad, **{k: v for k, v in z.items() if k != "geom"}}}
            for z in zonas
        ],
    }
    ruta.write_text(json.dumps(fc, separators=(",", ":")))


def rasterizar_lineas(grilla: Grilla, lineas: list[dict], ancho_px: int = 2) -> tuple[np.ndarray, np.ndarray]:
    """Devuelve (máscara, cotas) de defensas. Sin cota conocida = barrera infranqueable."""
    mascara = np.zeros((grilla.alto, grilla.ancho), bool)
    cotas = np.zeros((grilla.alto, grilla.ancho), np.float32)
    for l in lineas:
        geom = transform_geom("EPSG:4326", "EPSG:3857", l["geom"])
        geom = mapping(shape(geom).buffer(grilla.resolucion * ancho_px / 2))
        m = features.rasterize([(geom, 1)], out_shape=mascara.shape, transform=grilla.transform, all_touched=True).astype(bool)
        cotas[m] = np.maximum(cotas[m], l.get("cota_m") or SIN_DATO)
        mascara |= m
    return mascara, cotas


def guardar_geotiff(ruta: Path, grilla: Grilla, datos: np.ndarray) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    with rasterio.open(
        ruta, "w", driver="GTiff", height=grilla.alto, width=grilla.ancho, count=1, dtype="float32",
        crs="EPSG:3857", transform=grilla.transform, compress="deflate", nodata=np.nan,
    ) as d:
        d.write(np.where(np.isfinite(datos), datos, np.nan).astype(np.float32), 1)
