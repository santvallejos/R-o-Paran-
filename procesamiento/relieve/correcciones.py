"""Correcciones del DEM para que represente mejor el suelo (no la copa de los árboles)."""
from __future__ import annotations

import numpy as np
from scipy import ndimage

from .fuentes import WC_ARBOLES, WC_ARBUSTOS, WC_EDIFICADO, WC_MANGLAR


def corregir_cobertura(elev: np.ndarray, cobertura: np.ndarray, agua: np.ndarray, offsets: dict[str, float]) -> np.ndarray:
    """
    Copernicus es un modelo de superficie: mide arriba de árboles y techos (el radar
    penetra en parte). Se resta un valor típico por clase de cobertura (ESA WorldCover),
    suavizado para no crear escalones en los bordes entre clases.
    """
    off = np.zeros(elev.shape, np.float32)
    off[np.isin(cobertura, (WC_ARBOLES, WC_MANGLAR))] = offsets.get("arboles", 0.0)
    off[cobertura == WC_ARBUSTOS] = offsets.get("arbustos", 0.0)
    off[cobertura == WC_EDIFICADO] = offsets.get("edificado", 0.0)
    off = ndimage.gaussian_filter(off, sigma=1.5)
    return np.where(agua, elev, elev - off).astype(np.float32)


def filtrar_ruido(elev: np.ndarray, agua: np.ndarray, tam_px: int) -> np.ndarray:
    """Mediana sobre tierra: saca el "moteado" típico del radar sin correr bordes."""
    if tam_px <= 1:
        return elev
    return np.where(agua, elev, ndimage.median_filter(elev, size=tam_px)).astype(np.float32)


def piso_en_agua(elev: np.ndarray, agua: np.ndarray, cota_agua: float, margen: float = 0.05) -> np.ndarray:
    """
    En tierra no puede haber cotas por debajo del pelo de agua del DEM (serían artefactos
    de la corrección). Se fija el piso apenas arriba.
    """
    return np.where(agua, elev, np.maximum(elev, cota_agua + margen)).astype(np.float32)


def quemar_barreras(elev: np.ndarray, mascara: np.ndarray, cotas: np.ndarray) -> np.ndarray:
    """Defensas y terraplenes: celdas que el agua no cruza hasta su cota de coronamiento."""
    return np.where(mascara, np.maximum(elev, cotas), elev).astype(np.float32)
