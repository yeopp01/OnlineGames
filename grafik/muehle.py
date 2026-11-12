# Die Muehle: ein runder Turm aus Haustein mit spitzer Schindelhaube und vier
# grossen Fluegeln - die Fluegel unterscheiden sie von allem anderen.
#
# Zwei mal zwei Felder. Die Fluegel stehen zur Kamera, damit man das Kreuz
# ganz sieht; der Wimpel auf der Haube traegt die Spielerfarbe.

import math
import random

from mathutils import Vector

from bauteile import (QUER, VORN, ZUR_KAMERA, balken, banner, bodenfleck, einzeltafel, kegeldach, rahmen, rundholz,
                      sack, stoffe, tuer, wimpel)
from formen import drehkoerper, netz, quader

FELDER = 2
MITTE = (-0.14, 0.16)
FUSS_R = 0.6
KOPF_R = 0.46
TURM = 1.42
HAUBE = 0.58
NABE = 1.3            # Hoehe der Fluegelwelle
FLUEGEL = 0.9


def _fluegel(s, nabe, winkel):
    """Ein Fluegel: die Rute von der Nabe nach aussen, daran ein Gatter aus
    Sprossen und dahinter das Segel."""
    aus = QUER * math.cos(winkel) + Vector((0, 0, 1)) * math.sin(winkel)
    seit = QUER * -math.sin(winkel) + Vector((0, 0, 1)) * math.cos(winkel)
    balken('rute', tuple(nabe), tuple(nabe + aus * FLUEGEL), 0.04, s['balken'])
    innen, breit = 0.2, 0.2
    balken('saum', tuple(nabe + aus * innen + seit * breit), tuple(nabe + aus * FLUEGEL + seit * breit), 0.022,
           s['hellholz'])
    for i in range(8):
        weit = innen + (FLUEGEL - innen) * i / 7
        balken('sprosse', tuple(nabe + aus * weit - seit * 0.03), tuple(nabe + aus * weit + seit * breit), 0.018,
               s['hellholz'])
    hinter = -ZUR_KAMERA * 0.012
    ecken = [tuple(nabe + aus * (innen + 0.03) + seit * 0.01 + hinter),
             tuple(nabe + aus * (FLUEGEL - 0.02) + seit * 0.01 + hinter),
             tuple(nabe + aus * (FLUEGEL - 0.02) + seit * (breit - 0.01) + hinter),
             tuple(nabe + aus * (innen + 0.03) + seit * (breit - 0.01) + hinter)]
    netz('segel', ecken, [(0, 1, 2, 3)], s['leinen'], dicke=0.006)


def bauen():
    s = stoffe()
    zufall = random.Random(23)
    mx, my = MITTE
    bodenfleck('hof', (0.0, -0.05), 1.85, 1.8, s['erde'], zufall, rund=0.6)
    drehkoerper('turm', [(0, 0), (0, FUSS_R + 0.04), (0.12, FUSS_R + 0.03), (0.14, FUSS_R), (TURM, KOPF_R), (TURM, 0)],
                s['haustein'], ort=(mx, my, 0), teile=28)
    drehkoerper('kranz', [(TURM - 0.03, KOPF_R - 0.02), (TURM - 0.03, KOPF_R + 0.05), (TURM + 0.05, KOPF_R + 0.05),
                          (TURM + 0.05, KOPF_R - 0.02)], s['balken'], ort=(mx, my, 0), teile=28)
    kegeldach(MITTE, KOPF_R + 0.13, TURM + 0.04, HAUBE, s['schindel'], ecken=10, lagen=6, zufall=zufall)
    wimpel((mx, my, TURM + HAUBE), 0.42, s, lang=0.4, hoch=0.2)

    # Die Tuer in einem kleinen steinernen Vorbau, links im Licht.
    vor = FUSS_R - 0.05
    quader('vorbau', (0.46, 0.2, 0.86), s['haustein'], ort=(mx - 0.05, my - vor, 0.43), fase=0.015)
    tuer(rahmen((mx - 0.05, my - vor - 0.1, 0), VORN), 0, s, breite=0.26, hoehe=0.7, sturz=False)
    quader('stufe', (0.5, 0.16, 0.05), s['stein'], ort=(mx - 0.05, my - vor - 0.2, 0.025), fase=0.02)
    # Ein Fenster rechts, im Schatten.
    quader('fenster', (0.06, 0.16, 0.2), s['dunkel'], ort=(mx + FUSS_R - 0.12, my + 0.05, 0.75), fase=0)
    quader('fensterbank', (0.1, 0.22, 0.03), s['balken'], ort=(mx + FUSS_R - 0.1, my + 0.05, 0.63))

    # Die Welle und die vier Fluegel.
    mitte = Vector((mx, my, NABE))
    nabe = mitte + ZUR_KAMERA * (KOPF_R + 0.16)
    rundholz('welle', tuple(mitte), tuple(nabe + ZUR_KAMERA * 0.05), 0.045, s['balken'], teile=10)
    rundholz('nabe', tuple(nabe - ZUR_KAMERA * 0.04), tuple(nabe + ZUR_KAMERA * 0.06), 0.08, s['eisen'], teile=10)
    for i in range(4):
        _fluegel(s, nabe, math.radians(24) + i * math.pi / 2)

    # Was an einer Muehle liegt: Saecke und ein Muehlstein.
    sack((mx - 0.55, my - 0.62, 0.02), s)
    sack((mx - 0.36, my - 0.74, 0.02), s, gross=0.9)
    sack((mx - 0.6, my - 0.86, 0.02), s, liegt=True)
    drehkoerper('muehlstein', [(-0.035, 0.03), (-0.035, 0.17), (0.035, 0.17), (0.035, 0.03)], s['stein'],
                ort=(mx + 0.72, my - 0.52, 0.16), drehung=(math.radians(72), 0, math.radians(-40)), teile=18)
    banner((mx + 0.5, my - 0.47, 1.0), s, breit=0.2, lang=0.34, holz=True)


def tafel(ziel):
    return einzeltafel('muehle', FELDER, 2.7, ziel, bauen)
