# Das Bergbaulager: ein Satteldach aus Schiefer auf Pfosten, der Giebel schaut
# nach vorn; halbhohe Mauern aus Bruchstein, darunter Kisten mit Erz, davor
# behauene Bloecke, eine Schubkarre und die Spitzhacke.
#
# Zwei mal zwei Felder. Vom Holzfaellerlager unterscheidet es der Giebel, der
# Stein und das Dunkel des Schiefers.

import math
import random

from bauteile import (VORN, balken, banner, bodenfleck, einzeltafel, giebel, kiste, rahmen, satteldach, spitzhacke,
                      stoffe, wimpel)
from fels import brocken
from formen import drehkoerper, quader
from stoffe import einfarbig, erz, gemustert

FELDER = 2
MITTE = (-0.15, 0.3)
BREIT = 1.3           # laengs X, quer zum First
TIEF = 1.15           # laengs Y, der First
TRAUFE = 0.85
FIRST = 0.5


def bauen():
    s = stoffe()
    zufall = random.Random(37)
    gold = erz('golderz', ('#3d342b', '#584b3c', '#74644f'), '#d9a93f', anteil=0.4, groesse=5, rau_metall=0.32)
    klumpen = einfarbig('goldklumpen', '#d9a93f', rau=0.28, metall=1.0)
    kalk = gemustert('kalkstein', ('#5c5a54', '#7a7770', '#979489'), groesse=5, detail=7, relief=1.0, fugen=0.6,
                     rau=0.92)
    mx, my = MITTE
    bodenfleck('hof', (0.0, 0.0), 1.9, 1.9, s['erde'], zufall, rund=0.5)

    for sx in (-1, 1):
        for sy in (-1, 1):
            quader('pfosten', (0.11, 0.11, TRAUFE), s['balken'],
                   ort=(mx + sx * (BREIT / 2 - 0.055), my + sy * (TIEF / 2 - 0.055), TRAUFE / 2))
        quader('pfette', (0.09, TIEF + 0.12, 0.09), s['balken'], ort=(mx + sx * (BREIT / 2 - 0.055), my, TRAUFE - 0.045))
    for sy in (-1, 1):
        quader('binder', (BREIT, 0.08, 0.08), s['balken'], ort=(mx, my + sy * (TIEF / 2 - 0.055), TRAUFE - 0.04))
    # Halbhohe Mauern aus Bruchstein hinten und links.
    quader('mauer', (BREIT - 0.1, 0.16, 0.5), s['stein'], ort=(mx, my + TIEF / 2 - 0.06, 0.25), fase=0.03)
    quader('mauer', (0.16, TIEF - 0.1, 0.5), s['stein'], ort=(mx - BREIT / 2 + 0.06, my, 0.25), fase=0.03)
    satteldach(MITTE, TIEF + 0.1, BREIT, TRAUFE, FIRST, s['schiefer'], achse='y', ueber=0.14, ortgang=0.08, lagen=6,
               firststoff=s['schiefer'], zufall=zufall, ziegel=0.09)
    # Der Giebel vorn: Bretter und ein Koenigspfosten.
    g = rahmen((mx, my - TIEF / 2 + 0.02, TRAUFE), VORN)
    giebel(g, BREIT - 0.06, FIRST - 0.03, s, stoff='brett', fachwerk=False)
    quader('koenig', (0.07, 0.06, FIRST - 0.1), s['balken'], ort=(0, -0.01, (FIRST - 0.1) / 2), eltern=g)

    # Unter dem Dach: zwei Kisten, eine mit Erz, eine mit Stein.
    kiste((mx - 0.2, my + 0.1, 0.02), s, mass=(0.42, 0.34, 0.2))
    for i in range(7):
        brocken('erz', zufall, zufall.uniform(0.05, 0.075), gold if i % 3 else klumpen,
                (mx - 0.2 + zufall.uniform(-0.13, 0.13), my + 0.1 + zufall.uniform(-0.09, 0.09), 0.24),
                kantig=0.3, teile=5, ringe=4)
    kiste((mx + 0.3, my + 0.18, 0.02), s, mass=(0.36, 0.3, 0.18), drehung=0.2)
    for i in range(6):
        brocken('stein', zufall, zufall.uniform(0.05, 0.07), kalk,
                (mx + 0.3 + zufall.uniform(-0.1, 0.1), my + 0.18 + zufall.uniform(-0.08, 0.08), 0.21),
                kantig=0.3, teile=5, ringe=4)

    # Davor: behauene Bloecke, gestapelt, und rohes Erz.
    for x, y, z, dreh in ((0.55, -0.55, 0, 0.1), (0.82, -0.42, 0, -0.2), (0.66, -0.47, 0.17, 0.35)):
        quader('block', (0.3, 0.22, 0.17), kalk, ort=(mx + x, my + y, 0.105 + z), drehung=(0, 0, dreh), fase=0.018)
    for i in range(5):
        brocken('brocken', zufall, zufall.uniform(0.07, 0.12), gold,
                (mx - 0.62 + i * 0.13 + zufall.uniform(-0.03, 0.03), my - 0.92 + zufall.uniform(-0.1, 0.1), 0.06),
                kantig=0.3)
    # Die Schubkarre.
    kx, ky = mx + 0.25, my - 1.05
    quader('karre', (0.42, 0.28, 0.14), s['brett'], ort=(kx, ky, 0.22), drehung=(0, -0.12, 0), fase=0.01)
    drehkoerper('rad', [(-0.02, 0), (-0.02, 0.1), (0.02, 0.1), (0.02, 0)], s['balken'], ort=(kx + 0.3, ky, 0.1),
                drehung=(math.pi / 2, 0, 0), teile=14)
    for sy in (-1, 1):
        balken('holm', (kx + 0.3, ky + sy * 0.06, 0.1), (kx - 0.48, ky + sy * 0.15, 0.3), 0.03, s['hellholz'])
        quader('stuetze', (0.03, 0.03, 0.2), s['hellholz'], ort=(kx - 0.15, ky + sy * 0.12, 0.1))
    for i in range(4):
        brocken('ladung', zufall, zufall.uniform(0.06, 0.08), kalk,
                (kx + zufall.uniform(-0.12, 0.12), ky + zufall.uniform(-0.06, 0.06), 0.32), kantig=0.3, teile=5, ringe=4)
    spitzhacke((mx + BREIT / 2 + 0.14, my - 0.1, 0.02), (mx + BREIT / 2 + 0.0, my - 0.2, 0.62), s)

    banner((mx + BREIT / 2 + 0.02, my + 0.25, TRAUFE - 0.12), s, breit=0.26, lang=0.4, richtung=(0, 1, 0))
    wimpel((mx, my - TIEF / 2 - 0.05, TRAUFE + FIRST), 0.4, s)


def tafel(ziel):
    return einzeltafel('bergbaulager', FELDER, 1.9, ziel, bauen)
