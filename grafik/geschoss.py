# Die Geschosse (darstellung AC-28): ein Pfeil und der Stein des Mangonels.
#
# Rueckmeldung des Benutzers aus dem ersten Spiel auf dem Server: "Pfeile sind
# noch nicht gerendert, da brauchen wir noch was". Bis dahin zog der Browser
# einen Strich mit zwei Federn und fuer den Stein einen grauen Kreis.
#
# Eine Zeile: in Spalte 0 der Pfeil, danach der Stein in sechs Lagen seiner
# Drehung. Der Pfeil liegt waagrecht im Bild, die Spitze rechts auf dem
# Fusspunkt - der Browser dreht ihn in die Flugrichtung. Er ist dicker als
# ein echter: bei Zoom 1 bleibt von 132 Bildpunkten je Feld ein Drittel, und
# ein massstabsgetreuer Schaft waere dann ein Viertel Bildpunkt breit.
#
# Ohne Schlagschatten und ohne den Schattenfaenger: ein Geschoss fliegt, sein
# Schatten laege je nach Hoehe woanders.

import math
import random

import bpy

from fels import brocken
from formen import drehkoerper, leer, quader, strang
from kette import Tafel, kamera_setzen, szene_leeren
from stoffe import einfarbig, gemustert

STEINE = 6
LAENGE = 0.46
# Die Richtung, die im Bild nach rechts zeigt: die Kamera ist 45 Grad gedreht.
NACH_RECHTS = (0, math.pi / 2, math.pi / 4)


def pfeil_bauen():
    # Helles Eschenholz: ein dunkler Schaft verschwand vor dem Gras, und von
    # dem Pfeil blieb nur die Fiederung zu sehen.
    holz = einfarbig('pfeilholz', '#a8875a', rau=0.8)
    eisen = einfarbig('pfeileisen', '#b4b9c0', rau=0.45, metall=0.6)
    feder = einfarbig('pfeilfeder', '#cfc8b4', rau=0.9)
    # Die Hochachse des Gelenks zeigt im Bild nach rechts; die Spitze sitzt
    # im Ursprung, der Schaft laeuft nach hinten.
    pfeil = leer('pfeil')
    pfeil.rotation_euler = NACH_RECHTS
    strang('schaft', [(0, 0, -LAENGE, 0.019), (0, 0, -0.09, 0.019)], holz, eltern=pfeil)
    drehkoerper('spitze', [(-0.13, 0.0), (-0.115, 0.045), (0.0, 0.0)], eisen, eltern=pfeil, teile=6, glatt=False)
    # Drei Federn, jede in zwei Stufen: hinten breit, nach vorn schmal.
    for i in range(3):
        w = 2 * math.pi * i / 3 + 0.5
        for breite, lang, vor in ((0.05, 0.06, 0.04), (0.028, 0.05, 0.095)):
            quader('feder', (breite, 0.008, lang), feder,
                   ort=(math.cos(w) * breite / 2, math.sin(w) * breite / 2, -LAENGE + vor),
                   drehung=(0, 0, w), eltern=pfeil, fase=0.002)


def stein_bauen(lage):
    gestein = gemustert('wurfstein', ('#5c5a54', '#7a7770', '#979489'), groesse=7, detail=6, relief=0.8, fugen=0.4, rau=0.92)
    stein = brocken('stein', random.Random(97), 0.15, gestein, ort=(0, 0, 0), streckung=(1, 0.9, 0.82), kantig=0.32)
    # Er ueberschlaegt sich um eine Achse quer zum Bild.
    w = 2 * math.pi * lage / STEINE
    stein.rotation_euler = (w * math.sqrt(0.5), -w * math.sqrt(0.5), 0.3)


def tafel(ziel):
    zelle, fuss = (116, 72), (88, 36)
    blatt = None
    for spalte in range(1 + STEINE):
        szene_leeren()
        if spalte == 0:
            pfeil_bauen()
        else:
            stein_bauen(spalte - 1)
        bpy.data.objects['boden'].hide_render = True
        if blatt is None:
            blatt = Tafel('geschoss', zelle=zelle, fuss=fuss, ziel=ziel)
        else:
            kamera_setzen(zelle[0], zelle[1], fuss)
        blatt.bild(0, spalte, maske=False, schatten='ohne')
    return blatt.schreiben({'art': 'geschoss', 'pfeil': 0, 'steine': list(range(1, 1 + STEINE)), 'laenge': LAENGE})
