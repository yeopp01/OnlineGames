# Der Steinvorrat: ein Haufen heller, kantiger Kalksteinbloecke
# (darstellung AC-23). Vier Fuellstufen als Zeilen, drei Gestalten als Spalten.

import os
import random

from fels import haufen
from kette import Tafel, kamera_setzen, szene_leeren
from stoffe import gemustert

GESTALTEN = 3
STUFEN = 4


def bauen(startwert, stufe):
    gestein = gemustert('kalkstein', ('#5c5a54', '#7a7770', '#979489'), groesse=5, detail=7, relief=1.0, fugen=0.6,
                        rau=0.92)
    schutt = gemustert('steinschutt', ('#56534d', '#74716a', '#8b8880'), groesse=9, detail=4, relief=0.6, fugen=0.4,
                       rau=0.95)
    haufen(random.Random(startwert), stufe, gestein, schutt, block=1.08)


def tafel(ziel, name='stein', bauen_mit=None):
    bauen_mit = bauen_mit or bauen
    zelle, fuss = (220, 170), (86, 118)
    gestalten = 1 if os.environ.get('BILDER_PROBE') else GESTALTEN
    blatt = None
    for zeile in range(STUFEN):
        for gestalt in range(gestalten):
            szene_leeren()
            bauen_mit(211 + gestalt * 29, STUFEN - zeile)
            if blatt is None:
                blatt = Tafel(name, zelle=zelle, fuss=fuss, ziel=ziel)
            else:
                kamera_setzen(zelle[0], zelle[1], fuss)
            blatt.bild(zeile, gestalt, maske=False)
    # Zeile 0 ist der volle Vorrat, die letzte der fast leere.
    return blatt.schreiben({'art': 'vorrat', 'gestalten': gestalten, 'stufen': STUFEN})
