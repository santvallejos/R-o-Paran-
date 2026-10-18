"""Grillas Web Mercator alineadas a los píxeles de tiles (mismo esquema que MapLibre y la app)."""
from __future__ import annotations

import math
from dataclasses import dataclass

from rasterio.transform import Affine

R = 6378137.0
MUNDO = 2 * math.pi * R
TILE = 256


def lonlat_a_pixel(lon: float, lat: float, z: int) -> tuple[float, float]:
    n = TILE * 2**z
    r = math.radians(lat)
    return (lon + 180) / 360 * n, (1 - math.asinh(math.tan(r)) / math.pi) / 2 * n


def pixel_a_lonlat(x: float, y: float, z: int) -> tuple[float, float]:
    n = TILE * 2**z
    lon = x / n * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lon, lat


def metros_por_pixel(lat: float, z: int) -> float:
    return MUNDO * math.cos(math.radians(lat)) / (TILE * 2**z)


@dataclass(frozen=True)
class Grilla:
    z: int
    x0: int
    y0: int
    ancho: int
    alto: int

    @classmethod
    def desde_bbox(cls, bbox: list[float], z: int, alinear_a_tiles: bool = False) -> "Grilla":
        oeste, sur, este, norte = bbox
        x0, y0 = lonlat_a_pixel(oeste, norte, z)
        x1, y1 = lonlat_a_pixel(este, sur, z)
        x0, y0, x1, y1 = math.floor(x0), math.floor(y0), math.ceil(x1), math.ceil(y1)
        if alinear_a_tiles:
            x0, y0 = x0 // TILE * TILE, y0 // TILE * TILE
            x1, y1 = -(-x1 // TILE) * TILE, -(-y1 // TILE) * TILE
        return cls(z, x0, y0, x1 - x0, y1 - y0)

    @classmethod
    def de_tile(cls, z: int, tx: int, ty: int) -> "Grilla":
        return cls(z, tx * TILE, ty * TILE, TILE, TILE)

    @property
    def resolucion(self) -> float:
        """Tamaño de píxel en metros Mercator (no reales)."""
        return MUNDO / (TILE * 2**self.z)

    @property
    def transform(self) -> Affine:
        r = self.resolucion
        return Affine(r, 0, -MUNDO / 2 + self.x0 * r, 0, -r, MUNDO / 2 - self.y0 * r)

    @property
    def esquinas(self) -> list[list[float]]:
        """NO, NE, SE, SO en lon/lat (formato de ImageSource de MapLibre)."""
        no = pixel_a_lonlat(self.x0, self.y0, self.z)
        se = pixel_a_lonlat(self.x0 + self.ancho, self.y0 + self.alto, self.z)
        return [[no[0], no[1]], [se[0], no[1]], [se[0], se[1]], [no[0], se[1]]]

    @property
    def bounds_lonlat(self) -> list[float]:
        no, _, se, _ = self.esquinas
        return [no[0], se[1], se[0], no[1]]

    @property
    def lat_media(self) -> float:
        return (self.esquinas[0][1] + self.esquinas[2][1]) / 2

    @property
    def celda_m(self) -> float:
        return metros_por_pixel(self.lat_media, self.z)

    def ventana_de(self, otra: "Grilla") -> tuple[slice, slice]:
        """Filas/columnas de `otra` (contenida, mismo zoom) dentro de esta grilla."""
        assert otra.z == self.z
        f0, c0 = otra.y0 - self.y0, otra.x0 - self.x0
        assert f0 >= 0 and c0 >= 0 and f0 + otra.alto <= self.alto and c0 + otra.ancho <= self.ancho
        return slice(f0, f0 + otra.alto), slice(c0, c0 + otra.ancho)

    def tiles(self) -> list[tuple[int, int]]:
        return [
            (tx, ty)
            for ty in range(self.y0 // TILE, (self.y0 + self.alto - 1) // TILE + 1)
            for tx in range(self.x0 // TILE, (self.x0 + self.ancho - 1) // TILE + 1)
        ]
