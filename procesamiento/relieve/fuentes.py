"""Descarga de relieve y capas auxiliares (con caché local)."""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.merge import merge
from rasterio.warp import reproject

from .grilla import Grilla

COPERNICUS = "https://copernicus-dem-30m.s3.amazonaws.com"
WORLDCOVER = "https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map"

# Clases de ESA WorldCover 2021
WC_ARBOLES, WC_ARBUSTOS, WC_EDIFICADO, WC_MANGLAR = 10, 20, 50, 95
# Clases de la máscara de agua de Copernicus (WBM)
WBM_LAGO, WBM_RIO = 2, 3


def _hemi(v: int, pos: str, neg: str, ancho: int) -> str:
    return f"{pos if v >= 0 else neg}{abs(v):0{ancho}d}"


def _tiles_copernicus(bounds: list[float]) -> list[str]:
    oeste, sur, este, norte = bounds
    nombres = []
    for lat in range(math.floor(sur), math.floor(norte) + 1):
        for lon in range(math.floor(oeste), math.floor(este) + 1):
            nombres.append(f"Copernicus_DSM_COG_10_{_hemi(lat, 'N', 'S', 2)}_00_{_hemi(lon, 'E', 'W', 3)}_00_DEM")
    return nombres


def _tiles_worldcover(bounds: list[float]) -> list[str]:
    oeste, sur, este, norte = bounds
    nombres = set()
    for lat in range(math.floor(sur / 3) * 3, math.floor(norte / 3) * 3 + 1, 3):
        for lon in range(math.floor(oeste / 3) * 3, math.floor(este / 3) * 3 + 1, 3):
            nombres.add(f"ESA_WorldCover_10m_2021_v200_{_hemi(lat, 'N', 'S', 2)}{_hemi(lon, 'E', 'W', 3)}_Map.tif")
    return sorted(nombres)


def _mosaico(urls: list[str], bounds: list[float], destino: Path) -> Path:
    """Recorta y une rasters remotos (COG) al área pedida y lo guarda en caché."""
    if destino.exists():
        return destino
    destino.parent.mkdir(parents=True, exist_ok=True)
    fuentes = [rasterio.open(f"/vsicurl/{u}") for u in urls]
    try:
        datos, transform = merge(fuentes, bounds=bounds)
        perfil = fuentes[0].profile | {
            "driver": "GTiff", "height": datos.shape[1], "width": datos.shape[2],
            "transform": transform, "count": 1, "compress": "deflate", "tiled": False,
        }
        perfil.pop("blockxsize", None)
        perfil.pop("blockysize", None)
        with rasterio.open(destino, "w", **perfil) as d:
            d.write(datos[:1])
    finally:
        for f in fuentes:
            f.close()
    return destino


def _con_margen(bounds: list[float], m: float = 0.01) -> list[float]:
    return [bounds[0] - m, bounds[1] - m, bounds[2] + m, bounds[3] + m]


def copernicus_dem(bounds: list[float], cache: Path) -> Path:
    b = _con_margen(bounds)
    urls = [f"{COPERNICUS}/{n}/{n}.tif" for n in _tiles_copernicus(b)]
    return _mosaico(urls, b, cache / "copernicus_dem.tif")


def copernicus_agua(bounds: list[float], cache: Path) -> Path:
    b = _con_margen(bounds)
    urls = [f"{COPERNICUS}/{n}/AUXFILES/{n.removesuffix('_DEM')}_WBM.tif" for n in _tiles_copernicus(b)]
    return _mosaico(urls, b, cache / "copernicus_wbm.tif")


def worldcover(bounds: list[float], cache: Path) -> Path:
    b = _con_margen(bounds)
    urls = [f"{WORLDCOVER}/{n}" for n in _tiles_worldcover(b)]
    return _mosaico(urls, b, cache / "worldcover.tif")


def a_grilla(ruta: Path, grilla: Grilla, resampling: Resampling, dtype=np.float32, nodata=None) -> np.ndarray:
    """Reproyecta un raster a la grilla Web Mercator."""
    salida = np.zeros((grilla.alto, grilla.ancho), dtype=dtype)
    with rasterio.open(ruta) as s:
        reproject(
            source=rasterio.band(s, 1),
            destination=salida,
            src_nodata=s.nodata if nodata is None else nodata,
            dst_transform=grilla.transform,
            dst_crs="EPSG:3857",
            resampling=resampling,
        )
    return salida
