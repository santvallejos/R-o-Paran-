"""
Datos para la vista 3D de la app: cobertura del suelo, árboles y edificios en coordenadas
locales de la grilla del modelo (metros desde la esquina noroeste; x = este, z = sur).

Formatos (pensados para bajar poco en el celular):
  cobertura.png   clase de ESA WorldCover por celda (escala de grises = código de clase)
  arboles.bin     Uint16 [x, z, escala·100] por árbol; x, z en cuartos de metro
  edificios.json  {"unidad_m": 0.25, "e": [[cota_agua_cm | null, altura_dm, base_cm, x0, z0, x1, z1, …], …]}
                  cota_agua = cota absoluta a la que el agua llega al edificio (independiente del cero)
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
from PIL import Image
from shapely.geometry import shape

from .fuentes import WC_ARBOLES, WC_MANGLAR
from .grilla import Grilla, lonlat_a_pixel

UNIDAD = 0.25  # m por unidad en arboles.bin y edificios.json
ALTURA_DEFECTO_M = 3.5


def cobertura_png(destino: Path, cobertura: np.ndarray) -> None:
    Image.fromarray(cobertura.astype(np.uint8), "L").save(destino / "cobertura.png", optimize=True)


def arboles(destino: Path, grilla: Grilla, cobertura: np.ndarray, cauce: np.ndarray, densidad: float, maximo: int, semilla: int = 1) -> int:
    """Un árbol por celda de monte con probabilidad `densidad`, con posición y tamaño al azar."""
    rng = np.random.default_rng(semilla)
    f, c = np.nonzero(np.isin(cobertura, (WC_ARBOLES, WC_MANGLAR)) & ~cauce)
    elegidas = rng.random(f.size) < densidad
    f, c = f[elegidas], c[elegidas]
    if f.size > maximo:
        idx = rng.choice(f.size, maximo, replace=False)
        f, c = f[idx], c[idx]
    # orden aleatorio: la app puede tomar los primeros N según la calidad y queda parejo
    orden = rng.permutation(f.size)
    f, c = f[orden], c[orden]
    cel = grilla.celda_m
    x = np.round((c + rng.random(c.size)) * cel / UNIDAD)
    z = np.round((f + rng.random(f.size)) * cel / UNIDAD)
    s = np.round((0.6 + rng.random(f.size) * 0.8) * 100)
    np.stack([x, z, s], 1).astype(np.uint16).tofile(destino / "arboles.bin")
    return int(f.size)


def edificios(destino: Path, grilla: Grilla, geojson: Path, elev: np.ndarray, umbral: np.ndarray) -> dict:
    datos = json.loads(geojson.read_text())
    cel = grilla.celda_m
    sin_dato = 9000.0
    salida = []
    for f in datos["features"]:
        geo = shape(f["geometry"])
        if geo.geom_type == "MultiPolygon":
            geo = max(geo.geoms, key=lambda p: p.area)
        if geo.geom_type != "Polygon" or geo.is_empty:
            continue
        pts = []
        for lon, lat in list(geo.exterior.coords)[:-1]:
            px, py = lonlat_a_pixel(lon, lat, grilla.z)
            pts.append(((px - grilla.x0) * cel, (py - grilla.y0) * cel))
        cx = sum(p[0] for p in pts) / len(pts)
        cz = sum(p[1] for p in pts) / len(pts)
        col, fil = int(cx / cel), int(cz / cel)
        if not (0 <= col < grilla.ancho and 0 <= fil < grilla.alto) or len(pts) < 3:
            continue
        v = (slice(max(0, fil - 1), fil + 2), slice(max(0, col - 1), col + 2))
        # El agua llega al edificio cuando alcanza la celda más baja de su entorno.
        u = float(np.min(umbral[v]))
        p = f["properties"]
        altura = p.get("altura_m") or ((p.get("pisos") or 0) * 3.0) or ALTURA_DEFECTO_M
        salida.append(
            [None if not math.isfinite(u) or u >= sin_dato else round(u * 100), round(min(altura, 60) * 10), round(float(np.min(elev[v])) * 100)]
            + [round(val / UNIDAD) for xy in pts for val in xy]
        )
    (destino / "edificios.json").write_text(json.dumps({"unidad_m": UNIDAD, "release": datos.get("release"), "e": salida}, separators=(",", ":")))
    return {"edificios": len(salida), "release_overture": datos.get("release")}
