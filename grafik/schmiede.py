# Die Schmiede: ein gedrungener Bau aus Bruchstein, davor die offene Esse mit
# dem hohen Schornstein - drei mal drei Felder.
#
# Der Schornstein ueberragt alles am Haus, in der Esse glueht die Kohle: an
# beidem erkennt man sie. Davor der Amboss auf dem Klotz, das Loeschfass, ein
# Haufen Kohle.

import random

from bauteile import (RECHTS, VORN, banner, bodenfleck, einzeltafel, fass, fenster, giebel, rahmen, rundholz,
                      satteldach, stoffe, stumpf, tuer, wimpel)
from formen import drehkoerper, kugel, quader

FELDER = 3
MITTE = (-0.25, 0.4)
LAENGE = 2.0
BREITE = 1.6
WAND = 0.92
FIRST = 0.6
SCHLOT = 2.75


def bauen():
    s = stoffe()
    zufall = random.Random(59)
    mx, my = MITTE
    vorn = my - BREITE / 2
    rechts = mx + LAENGE / 2
    bodenfleck('hof', (0.0, 0.0), 2.86, 2.86, s['erde'], zufall, rund=0.25)

    quader('haus', (LAENGE, BREITE, WAND), s['stein'], ort=(mx, my, WAND / 2), fase=0.03)
    for sx in (-1, 1):
        for sy in (-1, 1):
            quader('eckstein', (0.16, 0.16, WAND + 0.02), s['haustein'],
                   ort=(mx + sx * (LAENGE / 2 - 0.06), my + sy * (BREITE / 2 - 0.06), WAND / 2 + 0.01), fase=0.015)
    satteldach(MITTE, LAENGE, BREITE, WAND, FIRST, s['schiefer'], achse='x', ueber=0.12, ortgang=0.1, lagen=7,
               firststoff=s['schiefer'], zufall=zufall, ziegel=0.1)
    r = rahmen((rechts, my, 0), RECHTS)
    giebel(rahmen((rechts, my, WAND), RECHTS), BREITE - 0.04, FIRST - 0.03, s, stoff='stein', fachwerk=False)
    fenster(r, 0.0, 0.55, s, breite=0.24, hoehe=0.24)
    v = rahmen((mx, vorn, 0), VORN)
    tuer(v, -0.6, s, breite=0.36, hoehe=0.76)

    # Die Esse vor der Wand: ein gemauerter Herd zwischen zwei Wangen, darueber
    # der Rauchfang, der sich zum Schornstein verjuengt.
    ex, tief = mx + 0.42, 0.58
    ey = vorn - tief / 2
    quader('herd', (0.74, tief, 0.42), s['haustein'], ort=(ex, ey, 0.21), fase=0.015)
    quader('rueckwand', (0.74, 0.06, 0.6), s['russ'], ort=(ex, vorn - 0.03, 0.72), fase=0)
    for seite in (-1, 1):
        quader('wange', (0.12, tief, 1.0), s['haustein'], ort=(ex + seite * 0.37, ey, 0.5), fase=0.015)
    kugel('kohle', 0.22, s['russ'], ort=(ex, ey + 0.04, 0.43), streckung=(1.15, 0.85, 0.3), teile=14, ringe=8)
    kugel('glut', 0.15, s['glut'], ort=(ex, ey + 0.0, 0.45), streckung=(1.1, 0.85, 0.34), teile=12, ringe=8)
    stumpf('rauchfang', (ex, ey), (0.86, tief + 0.04), (0.44, 0.4), 1.0, 1.5, s['haustein'], versatz=(0, tief / 2 - 0.2))
    sx_, sy_ = ex, vorn - 0.2
    quader('schornstein', (0.44, 0.4, SCHLOT - 1.5), s['haustein'], ort=(sx_, sy_, (SCHLOT + 1.5) / 2), fase=0.012)
    quader('schlotkranz', (0.54, 0.5, 0.1), s['haustein'], ort=(sx_, sy_, SCHLOT - 0.02), fase=0.015)
    quader('schlotruss', (0.46, 0.42, 0.18), s['russ'], ort=(sx_, sy_, SCHLOT + 0.1), fase=0.02)
    quader('schlotloch', (0.3, 0.26, 0.02), s['dunkel'], ort=(sx_, sy_, SCHLOT + 0.195), fase=0)
    # Der Blasebalg links an der Wange.
    balg = (ex - 0.62, ey + 0.05, 0.5)
    drehkoerper('blasebalg', [(0, 0.02), (0.05, 0.12), (0.26, 0.14), (0.3, 0.03)], s['brett'], ort=balg,
                drehung=(0, 1.5708, 0), streckung=(0.5, 1.0), teile=12)
    for dy in (-0.1, 0.1):
        quader('balgbock', (0.05, 0.05, 0.42), s['balken'], ort=(ex - 0.56, ey + 0.05 + dy, 0.21))

    # Der Amboss auf dem Klotz, daran der Hammer.
    ax, ay = ex - 0.1, vorn - 1.05
    drehkoerper('klotz', [(0, 0), (0, 0.15), (0.3, 0.14), (0.3, 0)], s['rinde'], ort=(ax, ay, 0), teile=12)
    quader('ambossfuss', (0.16, 0.12, 0.06), s['eisen'], ort=(ax, ay, 0.33), fase=0.01)
    quader('ambosshals', (0.1, 0.08, 0.07), s['eisen'], ort=(ax, ay, 0.39), fase=0.01)
    quader('ambossbahn', (0.26, 0.11, 0.07), s['eisen'], ort=(ax, ay, 0.455), fase=0.012)
    rundholz('ambosshorn', (ax + 0.12, ay, 0.455), (ax + 0.27, ay, 0.465), 0.035, s['eisen'], teile=8, spitz=0.15)
    rundholz('hammerstiel', (ax - 0.22, ay - 0.12, 0.3), (ax - 0.02, ay - 0.02, 0.5), 0.012, s['hellholz'], teile=6)
    quader('hammerkopf', (0.1, 0.045, 0.045), s['eisen'], ort=(ax - 0.02, ay - 0.02, 0.51), drehung=(0, 0, 1.1),
           fase=0.006)
    # Das Loeschfass, die Kohle, Eisenstangen an der Wand.
    fass((ex + 0.62, vorn - 0.72, 0.0), s, r=0.14, h=0.34)
    kugel('kohlehaufen', 0.3, s['russ'], ort=(mx - 0.1, vorn - 0.35, 0.0), streckung=(1.2, 0.8, 0.55), teile=14,
          ringe=8)
    for i in range(9):
        kugel('kohlestueck', zufall.uniform(0.035, 0.06), s['russ'],
              ort=(mx - 0.1 + zufall.uniform(-0.4, 0.4), vorn - 0.35 + zufall.uniform(-0.3, 0.2), 0.04), teile=6,
              ringe=4)
    for i in range(4):
        rundholz('stange', (rechts + 0.1 + i * 0.03, my - 0.5 + i * 0.07, 0.0),
                 (rechts + 0.02, my - 0.52 + i * 0.07, 0.8 + i * 0.05), 0.012, s['eisen'], teile=5)
    # Ein Wagenrad, das auf den Reifen wartet.
    drehkoerper('rad', [(-0.02, 0.2), (-0.02, 0.25), (0.02, 0.25), (0.02, 0.2), (-0.02, 0.2)], s['hellholz'],
                ort=(rechts + 0.08, my + 0.5, 0.25), drehung=(0.2, 1.5708, 0), teile=18)
    for i in range(4):
        w = i * 0.785
        quader('speiche', (0.02, 0.42, 0.025), s['hellholz'], ort=(rechts + 0.08, my + 0.5, 0.25), drehung=(w, 0, 0),
               fase=0)

    banner((mx - 0.05, vorn - 0.04, WAND - 0.1), s, breit=0.28, lang=0.46, richtung=(1, 0, 0))
    wimpel((rechts + 0.05, my, WAND + FIRST), 0.45, s)


def tafel(ziel):
    return einzeltafel('schmiede', FELDER, 3.1, ziel, bauen)
