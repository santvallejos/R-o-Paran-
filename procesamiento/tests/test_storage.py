"""Subida de public/data/relieve/<id> al bucket `relieve` de Storage, sin red (urlopen simulado)."""
import io
import urllib.error

import pytest

from relieve import supabase


@pytest.fixture
def carpeta(tmp_path):
    """Carpeta con la misma forma que la salida de procesar.py, más un archivo que no se sube."""
    (tmp_path / "terreno" / "12" / "1393").mkdir(parents=True)
    (tmp_path / "escena").mkdir()
    (tmp_path / "modelo.json").write_text("{}")
    (tmp_path / "elev.png").write_bytes(b"png")
    (tmp_path / "terreno" / "12" / "1393" / "2232.png").write_bytes(b"tile")
    (tmp_path / "escena" / "arboles.bin").write_bytes(b"\x00\x01")
    (tmp_path / "notas.txt").write_text("no va al bucket")
    return tmp_path


@pytest.fixture
def entorno(monkeypatch):
    """Credenciales falsas y sin esperas entre reintentos."""
    monkeypatch.setenv("SUPABASE_URL", "https://abc.supabase.co/")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "clave-servicio")
    monkeypatch.setattr(supabase.time, "sleep", lambda s: None)


class _Respuesta(io.BytesIO):
    """Imita el objeto que devuelve urlopen (usable con `with`)."""

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def test_rutas_y_tipos(carpeta):
    lista = {ruta: tipo for _, ruta, tipo in supabase.archivos_a_subir("paso", carpeta)}
    assert lista == {
        "paso/elev.png": "image/png",
        "paso/escena/arboles.bin": "application/octet-stream",
        "paso/modelo.json": "application/json",
        "paso/terreno/12/1393/2232.png": "image/png",
    }


def test_subir_arma_las_peticiones(carpeta, entorno, monkeypatch):
    pedidos = []

    def urlopen(req, timeout):
        pedidos.append(req)
        return _Respuesta(b'{"Key": "ok"}')

    monkeypatch.setattr(supabase.urllib.request, "urlopen", urlopen)
    n, total = supabase.subir_archivos("paso", carpeta)

    assert (n, total) == (4, 2 + 3 + 4 + 2)
    por_url = {r.full_url: r for r in pedidos}
    base = "https://abc.supabase.co/storage/v1/object/relieve/paso"
    assert set(por_url) == {f"{base}/modelo.json", f"{base}/elev.png", f"{base}/terreno/12/1393/2232.png", f"{base}/escena/arboles.bin"}
    r = por_url[f"{base}/modelo.json"]
    # urllib guarda los nombres de header con mayúscula inicial.
    assert r.get_method() == "POST"
    assert r.get_header("Content-type") == "application/json"
    assert r.get_header("X-upsert") == "true"
    assert r.get_header("Cache-control") == supabase.CACHE_CONTROL
    assert r.get_header("Authorization") == "Bearer clave-servicio"
    assert por_url[f"{base}/escena/arboles.bin"].data == b"\x00\x01"


def test_reintenta_errores_transitorios(carpeta, entorno, monkeypatch):
    intentos = []

    def urlopen(req, timeout):
        intentos.append(req.full_url)
        if len(intentos) == 1:
            raise urllib.error.URLError("sin conexión")
        if len(intentos) == 2:
            raise urllib.error.HTTPError(req.full_url, 503, "ocupado", {}, io.BytesIO(b""))
        return _Respuesta(b"{}")

    monkeypatch.setattr(supabase.urllib.request, "urlopen", urlopen)
    archivo, ruta, tipo = supabase.archivos_a_subir("paso", carpeta)[0]
    assert supabase._subir_uno("https://abc.supabase.co", "k", archivo, ruta, tipo) == archivo.stat().st_size
    assert len(intentos) == 3


def test_no_reintenta_errores_del_cliente(carpeta, entorno, monkeypatch):
    intentos = []

    def urlopen(req, timeout):
        intentos.append(1)
        raise urllib.error.HTTPError(req.full_url, 403, "prohibido", {}, io.BytesIO(b"sin permiso"))

    monkeypatch.setattr(supabase.urllib.request, "urlopen", urlopen)
    archivo, ruta, tipo = supabase.archivos_a_subir("paso", carpeta)[0]
    with pytest.raises(RuntimeError, match="403"):
        supabase._subir_uno("https://abc.supabase.co", "k", archivo, ruta, tipo)
    assert len(intentos) == 1


def test_sin_credenciales(carpeta, monkeypatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)
    with pytest.raises(RuntimeError, match="SUPABASE_URL"):
        supabase.subir_archivos("paso", carpeta)
