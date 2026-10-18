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
