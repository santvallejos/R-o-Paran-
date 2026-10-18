import numpy as np

from relieve.exportar import a_terrarium, de_terrarium
from relieve.grilla import Grilla, lonlat_a_pixel, pixel_a_lonlat
from relieve.inundacion import calcular_umbrales

# Mismo caso que src/lib/inundacion.test.ts: la app y el procesamiento deben coincidir.
ELEV = np.array([[0, 2, 5, 1], [0, 3, 5, 1]], np.float32)
SEMILLAS = np.zeros_like(ELEV, bool)
SEMILLAS[0, 0] = True


def test_umbrales_igual_que_la_app():
    u = calcular_umbrales(ELEV, SEMILLAS)
    assert u.tolist() == [[0, 2, 5, 5], [0, 3, 5, 5]]


def test_sin_semillas_no_se_inunda():
    assert np.isinf(calcular_umbrales(ELEV, np.zeros_like(SEMILLAS))).all()


def test_pozo_rodeado_toma_la_cota_del_borde():
    elev = np.full((5, 5), 10, np.float32)
    elev[2, 2] = 1
    elev[0, 0] = 0
    sem = np.zeros_like(elev, bool)
    sem[0, 0] = True
    assert calcular_umbrales(elev, sem)[2, 2] == 10


def test_terrarium_ida_y_vuelta():
    v = np.array([[45.0, 52.37], [-3.5, np.inf]], np.float32)
    out = de_terrarium(a_terrarium(v))
    assert abs(out[0, 1] - 52.37) < 1 / 256 + 1e-6
    assert out[1, 1] == 9000


def test_grilla_y_pixeles():
    lon, lat = pixel_a_lonlat(*lonlat_a_pixel(-58.57, -27.31, 14), 14)
    assert abs(lon + 58.57) < 1e-9 and abs(lat + 27.31) < 1e-9
    g = Grilla.desde_bbox([-58.63, -27.345, -58.52, -27.285], 14, alinear_a_tiles=True)
    assert g.x0 % 256 == 0 and g.ancho % 256 == 0
    chica = Grilla.desde_bbox([-58.63, -27.345, -58.52, -27.285], 14)
    f, c = g.ventana_de(chica)
    assert f.stop - f.start == chica.alto


def test_arboles_y_edificios_en_coordenadas_locales(tmp_path):
    import json

    from relieve import escena3d
    from relieve.grilla import pixel_a_lonlat

    g = Grilla(14, 1000 * 256, 2000 * 256, 8, 6)
    cob = np.full((6, 8), 30, np.uint8)
    cob[2:4, 2:4] = 10  # cuatro celdas de monte
    cauce = np.zeros((6, 8), bool)
    n = escena3d.arboles(tmp_path, g, cob, cauce, densidad=1.0, maximo=100)
    arb = np.fromfile(tmp_path / "arboles.bin", np.uint16).reshape(-1, 3)
    assert n == 4 and arb.shape == (4, 3)
    x_m, z_m = arb[:, 0] * escena3d.UNIDAD, arb[:, 1] * escena3d.UNIDAD
    assert ((x_m >= 2 * g.celda_m) & (x_m <= 4 * g.celda_m)).all() and ((z_m >= 2 * g.celda_m) & (z_m <= 4 * g.celda_m)).all()

    # un edificio cuadrado en las celdas (fila 1-2, columna 5-6)
    esq = [pixel_a_lonlat(g.x0 + c, g.y0 + f, 14) for c, f in ((5, 1), (7, 1), (7, 3), (5, 3), (5, 1))]
    gj = tmp_path / "e.geojson"
    gj.write_text(json.dumps({"type": "FeatureCollection", "features": [
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [esq]}, "properties": {"altura_m": None, "pisos": 2}}]}))
    elev = np.full((6, 8), 50.0, np.float32)
    umbral = np.full((6, 8), 51.0, np.float32)
    umbral[2, 6] = 50.4
    info = escena3d.edificios(tmp_path, g, gj, elev, umbral)
    e = json.loads((tmp_path / "edificios.json").read_text())["e"][0]
    assert info["edificios"] == 1
    assert e[0] == 5040 and e[1] == 60 and e[2] == 5000  # cota del agua (cm), altura (dm), base (cm)
    assert abs(e[3] * escena3d.UNIDAD - 5 * g.celda_m) < 0.3
