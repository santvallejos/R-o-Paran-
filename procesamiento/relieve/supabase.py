"""Lectura de defensas y carga de versiones de relieve vía la API REST de Supabase."""
from __future__ import annotations

import json
import os
import urllib.request


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
