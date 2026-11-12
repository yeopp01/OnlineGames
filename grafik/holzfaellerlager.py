# Das Holzfaellerlager: ein offener Unterstand mit Pultdach aus Schindeln,
# hinten hoeher, darunter und davor gestapelte Staemme, ein Hackklotz mit Axt.
#
# Zwei mal zwei Felder. Was darunter liegt, sagt, was hierher gebracht wird.

import random

from bauteile import axt, balken, banner, bodenfleck, einzeltafel, pultdach, rundholz, stammstapel, stoffe, wimpel
from formen import drehkoerper, quader

FELDER = 2
MITTE = (-0.12, 0.28)
LAENGE = 1.45
TIEFE = 1.05
VORN_H = 0.82
HINTEN_H = 1.3


def bauen():
    s = stoffe()
    zufall = random.Random(31)
    mx, my = MITTE
    bodenfleck('hof', (0.0, 0.0), 1.9, 1.9, s['erde'], zufall, rund=0.5)
    # Vier Pfosten, vorn kurz, hinten lang; darauf Pfetten und Sparren.
    for sx in (-1, 1):
        x = mx + sx * (LAENGE / 2 - 0.05)
        for sy, hoch in ((-1, VORN_H), (1, HINTEN_H)):
            quader('pfosten', (0.1, 0.1, hoch), s['balken'], ort=(x, my + sy * (TIEFE / 2 - 0.05), hoch / 2))
        balken('sparren', (x, my - TIEFE / 2 - 0.08, VORN_H - 0.045), (x, my + TIEFE / 2 + 0.08, HINTEN_H + 0.02), 0.08,
               s['balken'])
        balken('strebe', (x - sx * 0.3, my - TIEFE / 2 + 0.05, VORN_H - 0.06), (x, my - TIEFE / 2 + 0.05, VORN_H - 0.36),
               0.05, s['balken'])
    for y, hoch in ((my - TIEFE / 2 + 0.05, VORN_H), (my + TIEFE / 2 - 0.05, HINTEN_H)):
        quader('pfette', (LAENGE + 0.1, 0.08, 0.08), s['balken'], ort=(mx, y, hoch - 0.04))
    # Die Rueckwand aus Brettern.
    for i in range(7):
        x = mx - LAENGE / 2 + 0.1 + (i + 0.5) * (LAENGE - 0.2) / 7
        quader('brett', ((LAENGE - 0.2) / 7 - 0.012, 0.03, 0.95 - 0.03 * (i % 2)), s['brett'],
               ort=(x, my + TIEFE / 2 - 0.04, 0.475), fase=0.006)
    pultdach(MITTE, LAENGE + 0.1, TIEFE + 0.16, VORN_H + 0.03, HINTEN_H + 0.07, s['schindel'], ueber=0.1, lagen=7,
             zufall=zufall, stufe=0.028)

    # Unter dem Dach die Staemme, daneben gespaltene Scheite.
    stammstapel((mx - 0.08, my + 0.08, 0.02), s, zufall, reihen=(5, 4, 3), lang=1.0, r=0.085)
    stammstapel((mx + 0.95, my - 0.15, 0.02), s, zufall, reihen=(4, 3, 2), lang=0.34, r=0.05, laengs='y',
                stoff='scheit')
    # Ein einzelner Stamm quer davor, noch nicht zerlegt.
    rundholz('stamm', (mx - 0.75, my - 0.95, 0.105), (mx + 0.25, my - 1.1, 0.105), 0.085, s['rinde'], teile=10)
    rundholz('stirn', (mx + 0.247, my - 1.0995, 0.105), (mx + 0.254, my - 1.1006, 0.105), 0.072, s['scheit'], teile=10)
    # Der Hackklotz mit der Axt.
    kx, ky = mx + 0.62, my - 0.82
    drehkoerper('hackklotz', [(0, 0), (0, 0.13), (0.2, 0.125), (0.2, 0)], s['rinde'], ort=(kx, ky, 0.02), teile=12)
    drehkoerper('schnitt', [(0.2, 0), (0.2, 0.115), (0.205, 0.11), (0.205, 0)], s['scheit'], ort=(kx, ky, 0.02),
                teile=12)
    axt((kx - 0.24, ky - 0.1, 0.5), (kx + 0.01, ky, 0.25), s)
    for dx, dy, dreh in ((0.2, -0.12, 0.4), (0.26, 0.06, 1.3), (-0.02, -0.24, 2.2)):
        quader('scheit', (0.22, 0.06, 0.05), s['scheit'], ort=(kx + dx, ky + dy, 0.045), drehung=(0.1, 0, dreh),
               fase=0.01)

    # Die Farbe des Besitzers: ein Tuch an der vorderen Pfette, ein Wimpel am Eck.
    banner((mx + 0.38, my - TIEFE / 2 - 0.02, VORN_H - 0.1), s, breit=0.26, lang=0.4, richtung=(1, 0, 0))
    wimpel((mx + LAENGE / 2 - 0.05, my + TIEFE / 2 - 0.05, HINTEN_H), 0.45, s)


def tafel(ziel):
    return einzeltafel('holzfaellerlager', FELDER, 1.9, ziel, bauen)
