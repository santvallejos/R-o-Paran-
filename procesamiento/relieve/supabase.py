"""Lectura de defensas, carga de versiones de relieve (API REST) y subida de los archivos
de la app al bucket `relieve` de Supabase Storage."""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

# Bucket público de Storage (supabase/migrations/20261020130000_storage_relieve.sql).
BUCKET = "relieve"
# Content-Type por extensión: el bucket sólo acepta estos tipos y la app valida que
# modelo.json y terreno.json lleguen como JSON. Otras extensiones no se suben.
TIPOS = {".png": "image/png", ".json": "application/json", ".bin": "application/octet-stream"}
# Un día de caché en el navegador/CDN: cada corrida de procesar.py pisa los mismos nombres.
CACHE_CONTROL = "max-age=86400"


def _config() -> tuple[str, str] | None:
    url = os.environ.get("SUPABASE_URL")
    clave = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    return (url.rstrip("/"), clave) if url and clave else None


def _pedir(metodo: str, ruta: str, cuerpo: dict | None = None):
    cfg = _config()
    if not cfg:
        raise RuntimeError("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.")
    url, clave = cfg
    req = urllib.request.Request(
        f"{url}{ruta}",
        method=metodo,
        data=json.dumps(cuerpo).encode() if cuerpo is not None else None,
        headers={"apikey": clave, "authorization": f"Bearer {clave}", "content-type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read() or "null")


def disponible() -> bool:
    return _config() is not None


def defensas(localidad: str) -> list[dict]:
    filas = _pedir("GET", f"/rest/v1/defensas?localidad_id=eq.{localidad}&select=nombre,cota_coronamiento_m,geom")
    return [{"nombre": f["nombre"], "cota_m": f["cota_coronamiento_m"], "geom": f["geom"]} for f in filas]


def cargar_version(payload: dict) -> int:
    return _pedir("POST", "/rest/v1/rpc/cargar_version_relieve", {"p": payload})


def archivos_a_subir(localidad_id: str, carpeta: Path) -> list[tuple[Path, str, str]]:
    """(archivo local, ruta del objeto dentro del bucket, Content-Type) de cada archivo de la
    carpeta, recursivo. La ruta replica la estructura local: `<id>/terreno/12/1393/2232.png`."""
    carpeta = Path(carpeta)
    return [
        (f, f"{localidad_id}/{f.relative_to(carpeta).as_posix()}", TIPOS[f.suffix.lower()])
        for f in sorted(carpeta.rglob("*"))
        if f.is_file() and f.suffix.lower() in TIPOS
    ]


def _subir_uno(url: str, clave: str, archivo: Path, ruta: str, tipo: str, intentos: int = 4) -> int:
    """Sube un archivo con upsert (pisa el anterior). Reintenta errores de red, 429 y 5xx
    con espera creciente; otro 4xx (permiso, tipo no permitido) falla enseguida."""
    datos = archivo.read_bytes()
    req = urllib.request.Request(
        f"{url}/storage/v1/object/{BUCKET}/{urllib.parse.quote(ruta)}",
        method="POST",
        data=datos,
        headers={
            "apikey": clave,
            "authorization": f"Bearer {clave}",
            "content-type": tipo,
            "cache-control": CACHE_CONTROL,
            "x-upsert": "true",
        },
    )
    for intento in range(intentos):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                r.read()
            return len(datos)
        except urllib.error.HTTPError as e:
            reintentable = e.code == 429 or e.code >= 500
            if not reintentable or intento == intentos - 1:
                raise RuntimeError(f"No se pudo subir {ruta} ({e.code}): {e.read()[:300]!r}") from e
        except urllib.error.URLError as e:
            if intento == intentos - 1:
                raise RuntimeError(f"No se pudo subir {ruta}: {e.reason}") from e
        # Espera 1, 2, 4… segundos antes del próximo intento.
        time.sleep(2**intento)
    raise AssertionError("inalcanzable")


def subir_archivos(localidad_id: str, carpeta: Path, hilos: int = 8) -> tuple[int, int]:
    """Sube recursivamente `carpeta` (public/data/relieve/<id>) a `relieve/<id>/…` en Storage.
    Devuelve (cantidad de archivos, bytes subidos)."""
    cfg = _config()
    if not cfg:
        raise RuntimeError("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.")
    url, clave = cfg
    lista = archivos_a_subir(localidad_id, carpeta)
    # Concurrencia moderada: cientos de tiles chicos sin saturar la API de Storage.
    with ThreadPoolExecutor(max_workers=hilos) as ex:
        tamanios = list(ex.map(lambda a: _subir_uno(url, clave, *a), lista))
    return len(lista), sum(tamanios)
