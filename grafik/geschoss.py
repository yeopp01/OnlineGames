# Die Geschosse (darstellung AC-28): ein Pfeil, der Stein des Mangonels und
# das Feuer des Drachen (einheiten AC-52).
#
# Rueckmeldung des Benutzers aus dem ersten Spiel auf dem Server: "Pfeile sind
# noch nicht gerendert, da brauchen wir noch was". Bis dahin zog der Browser
# einen Strich mit zwei Federn und fuer den Stein einen grauen Kreis.
#
# Eine Zeile: in Spalte 0 der Pfeil, danach der Stein in sechs Lagen seiner
# Drehung, danach das Feuer in vier Gestalten - nacheinander gezeigt, flackert
# es. Wie der Pfeil liegt es waagrecht, der Kopf rechts auf dem Fusspunkt, der
# Schweif nach links; es leuchtet selbst und wird deshalb im Nebel nicht grau. Der Pfeil liegt waagrecht im Bild, die Spitze rechts auf dem
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
from formen import drehkoerper, kugel, leer, quader, strang
from kette import Tafel, kamera_setzen, szene_leeren
from stoffe import einfarbig, flammenhuelle, gemustert, glut

STEINE = 6
FEUER = 4
LAENGE = 0.46
FEUERLAENGE = 0.62
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


def feuer_bauen(gestalt):
    zufall = random.Random(211 + 17 * gestalt)
    saum = flammenhuelle('feuersaum', '#ff4a0c', 1.3)
    kern = glut('feuerkern', '#ffcf4a', 1.5)
    feuer = leer('feuer')
    feuer.rotation_euler = NACH_RECHTS

    def flackern():
        return zufall.uniform(0.82, 1.12)

    lang = FEUERLAENGE * zufall.uniform(0.86, 1.0)
    # Der Saum: vorn ein runder Kopf, nach hinten laeuft er aus. Von ihm sieht
    # man nur die Innenseite - davor steht der helle Kern.
    drehkoerper('saum', [(-lang, 0.0), (-lang * 0.72, 0.03 * flackern()), (-lang * 0.45, 0.07 * flackern()),
                         (-0.14, 0.11 * flackern()), (-0.05, 0.1), (-0.012, 0.055), (0.0, 0.0)], saum, eltern=feuer,
                streckung=(1.0, flackern()), teile=12)
    drehkoerper('kern', [(-lang * 0.55, 0.0), (-0.2, 0.035 * flackern()), (-0.1, 0.062), (-0.04, 0.05), (-0.018, 0.0)],
                kern, eltern=feuer, teile=10)
    # Zungen, die sich hinten vom Schweif loesen.
    for _ in range(3):
        z = -lang * zufall.uniform(0.35, 0.95)
        w = zufall.uniform(0, 2 * math.pi)
        weit = zufall.uniform(0.04, 0.09)
        kugel('zunge', zufall.uniform(0.022, 0.04), saum, ort=(math.cos(w) * weit, math.sin(w) * weit, z), eltern=feuer,
              streckung=(1, 1, 2.2), teile=8, ringe=6)


def tafel(ziel):
    zelle, fuss = (116, 72), (88, 36)
    blatt = None
    for spalte in range(1 + STEINE + FEUER):
        szene_leeren()
        if spalte == 0:
            pfeil_bauen()
        elif spalte <= STEINE:
            stein_bauen(spalte - 1)
        else:
            feuer_bauen(spalte - 1 - STEINE)
        bpy.data.objects['boden'].hide_render = True
        if blatt is None:
            blatt = Tafel('geschoss', zelle=zelle, fuss=fuss, ziel=ziel)
        else:
            kamera_setzen(zelle[0], zelle[1], fuss)
        blatt.bild(0, spalte, maske=False, schatten='ohne')
    return blatt.schreiben({
        'art': 'geschoss', 'pfeil': 0, 'steine': list(range(1, 1 + STEINE)), 'laenge': LAENGE,
        'feuer': list(range(1 + STEINE, 1 + STEINE + FEUER)), 'feuerlaenge': FEUERLAENGE,
    })
