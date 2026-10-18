"""
Modelo tipo "bañera" con conectividad (igual que src/lib/inundacion.ts, para que la app
y el procesamiento den lo mismo). Para cada celda calcula la cota mínima del agua a la
que queda conectada con el río: inundada(celda) ⇔ umbral <= cota_agua.
"""
from __future__ import annotations

import heapq
from collections import deque

import numpy as np


def calcular_umbrales(elev: np.ndarray, semillas: np.ndarray) -> np.ndarray:
    """Priority-Flood con cola FIFO para celdas planas o en pozo (mucho más rápido en llanuras)."""
    alto, ancho = elev.shape
    e = elev.astype(np.float64).ravel()
    n = e.size
    umbral = np.full(n, np.inf)
    cerrada = np.zeros(n, dtype=bool)

    idx = np.flatnonzero(semillas.ravel())
    umbral[idx] = e[idx]
    heap = [(float(e[i]), int(i)) for i in idx]
    heapq.heapify(heap)
    llano: deque[tuple[float, int]] = deque()

    while heap or llano:
        c, i = llano.popleft() if llano else heapq.heappop(heap)
        if cerrada[i]:
            continue
        cerrada[i] = True
        x = i % ancho
        # 4-vecinos: más conservador que 8, evita filtraciones por diagonales.
        for j, valido in ((i - 1, x > 0), (i + 1, x < ancho - 1), (i - ancho, i >= ancho), (i + ancho, i < n - ancho)):
            if not valido or cerrada[j]:
                continue
            ej = e[j]
            if ej <= c:
                if c < umbral[j]:
                    umbral[j] = c
                    llano.append((c, j))
            elif ej < umbral[j]:
                umbral[j] = ej
                heapq.heappush(heap, (ej, j))
    return umbral.reshape(alto, ancho).astype(np.float32)
