# Die Kaserne: ein wehrhafter Kasten, drei mal drei Felder.
#
# Unten Haustein, darauf ein Stockwerk aus dunklem Holz, das vorkragt, oben
# kein Dach, sondern eine Plattform mit Zinnenkranz - das flache Ende
# unterscheidet sie von allem, was ein Dach traegt. Hinten ein steinerner
# Eckturm mit der Fahne. Davor der Waffenstaender mit Speeren und Schilden und
# eine Uebungspuppe: hier wird gekaempft, nicht gewohnt.

import random

from bauteile import (RECHTS, VORN, banner, bodenfleck, einzeltafel, fachwerk, fahne, rahmen, schild, schlitz, speer,
                      stoffe, tuer, zinnen)
from formen import kugel, quader
from stoffe import gemustert

FELDER = 3
MITTE = (-0.14, 0.26)
LAENGE = 2.25
BREITE = 1.9
UNTEN = 1.0
OBEN = 0.62
KRAGEN = 0.1
TURM = 2.4


def bauen():
    s = stoffe()
    zufall = random.Random(51)
    dunkelholz = gemustert('dunkelholz', ('#2e2018', '#463224', '#5a412c'), massstab=(9, 9, 1.2), groesse=3, detail=4,
                           relief=0.7, fugen=0.7)
    mx, my = MITTE
    vorn = my - BREITE / 2
    rechts = mx + LAENGE / 2
    bodenfleck('hof', (0.0, 0.0), 2.86, 2.86, s['erde'], zufall, rund=0.25)

    quader('sockel', (LAENGE + 0.1, BREITE + 0.1, 0.16), s['stein'], ort=(mx, my, 0.08), fase=0.03)
    quader('erdgeschoss', (LAENGE, BREITE, UNTEN), s['haustein'], ort=(mx, my, UNTEN / 2), fase=0.01)
    v = rahmen((mx, vorn, 0), VORN)
    r = rahmen((rechts, my, 0), RECHTS)
    tuer(v, -0.45, s, breite=0.52, hoehe=0.84, fluegel=2)
    for x in (0.3, 0.75):
        schlitz(v, x, 0.62, s)
    for x in (-0.55, 0.0, 0.55):
        schlitz(r, x, 0.62, s)

    # Das Obergeschoss aus dunklem Holz steht auf Balkenkoepfen.
    z = UNTEN
    for i in range(8):
        x = mx - LAENGE / 2 + 0.08 + i * (LAENGE - 0.16) / 7
        quader('balkenkopf', (0.09, BREITE + 2 * KRAGEN + 0.08, 0.09), s['balken'], ort=(x, my, z + 0.03))
    lang, breit = LAENGE + 2 * KRAGEN, BREITE + 2 * KRAGEN
    boden = z + 0.075
    quader('obergeschoss', (lang - 0.03, breit - 0.03, OBEN), dunkelholz, ort=(mx, my, boden + OBEN / 2), fase=0)
    v2 = rahmen((mx, my - breit / 2, boden), VORN)
    r2 = rahmen((mx + lang / 2, my, boden), RECHTS)
    fachwerk(v2, lang, OBEN, s, felder=7, riegel=())
    fachwerk(r2, breit, OBEN, s, felder=6, riegel=())
    for x in (-0.87, -0.17, 0.17, 0.87):
        schlitz(v2, x, 0.32, s, hoehe=0.22, breite=0.06)
    for x in (-0.52, 0.17, 0.52):
        schlitz(r2, x, 0.32, s, hoehe=0.22, breite=0.06)

    # Oben die Plattform mit Zinnen aus Bohlen.
    krone = boden + OBEN
    quader('plattform', (lang + 0.08, breit + 0.08, 0.07), s['balken'], ort=(mx, my, krone + 0.035), fase=0.01)
    zinnen(MITTE, lang + 0.08, breit + 0.08, krone + 0.07, dunkelholz, hoch=0.16, tief=0.07, zahn=0.2, brust=0.11)
    quader('boden', (lang - 0.1, breit - 0.1, 0.02), s['bohle'], ort=(mx, my, krone + 0.08), fase=0)

    # Der Eckturm hinten links: Stein bis ueber die Plattform, Zinnen, Fahne.
    tx, ty = mx - LAENGE / 2 + 0.3, my + BREITE / 2 - 0.3
    quader('turm', (0.86, 0.86, TURM), s['haustein'], ort=(tx, ty, TURM / 2), fase=0.012)
    quader('turmkragen', (0.96, 0.96, 0.1), s['haustein'], ort=(tx, ty, TURM - 0.02), fase=0.015)
    zinnen((tx, ty), 0.96, 0.96, TURM + 0.03, s['haustein'], hoch=0.15, tief=0.09, zahn=0.17)
    schlitz(rahmen((tx, ty - 0.43, 0), VORN), 0, 2.05, s, hoehe=0.22)
    schlitz(rahmen((tx + 0.43, ty, 0), RECHTS), 0, 2.05, s, hoehe=0.22)
    fahne((tx, ty, TURM + 0.03), 0.8, s, lang=0.52, hoch=0.32)

    # Banner an der Holzwand: eins ueber dem Tor, eins rechts.
    banner((mx - 0.45, my - breit / 2 - 0.05, boden + OBEN - 0.1), s, breit=0.34, lang=0.5, richtung=(1, 0, 0))
    banner((mx + lang / 2 + 0.05, my - 0.18, boden + OBEN - 0.1), s, breit=0.34, lang=0.5, richtung=(0, 1, 0))

    # Der Waffenstaender: zwei Pfosten, zwei Holme, Speere daran, Schilde davor.
    wx, wy = mx + 0.62, vorn - 0.4
    for dx in (-0.45, 0.45):
        quader('staenderpfosten', (0.055, 0.055, 0.66), s['balken'], ort=(wx + dx, wy, 0.33))
    for hoch in (0.26, 0.62):
        quader('staenderholm', (1.0, 0.04, 0.045), s['balken'], ort=(wx, wy, hoch))
    for i in range(6):
        x = wx - 0.36 + i * 0.145
        speer((x, wy - 0.17, 0.02), (x + zufall.uniform(-0.02, 0.02), wy + 0.035, 1.02), s)
    for dx in (-0.3, 0.02, 0.33):
        schild((wx + dx, wy - 0.23, 0.14), s, r=0.14)

    # Die Uebungspuppe: ein Pfahl mit Querholz, Strohleib und altem Schild.
    px, py = mx - 1.0, vorn - 0.45
    quader('puppenpfahl', (0.06, 0.06, 0.95), s['balken'], ort=(px, py, 0.475))
    quader('puppenarm', (0.5, 0.045, 0.045), s['balken'], ort=(px, py, 0.72), drehung=(0, 0, 0.785))
    kugel('puppenleib', 0.15, s['heu'], ort=(px, py, 0.55), streckung=(1, 1, 1.5), teile=12, ringe=8)
    kugel('puppenkopf', 0.085, s['leinen'], ort=(px, py, 0.9), teile=10, ringe=8)


def tafel(ziel):
    return einzeltafel('kaserne', FELDER, 3.5, ziel, bauen)
