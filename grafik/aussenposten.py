# Der Aussenposten: ein hoelzerner Ausguck auf vier Pfosten - ein Feld.
#
# Vier schraege Pfosten, Kreuzstreben, oben die Plattform mit Gelaender und
# ein spitzes Dach aus Schindeln, daran der Wimpel. Duenn und hoch: man sieht
# durch ihn hindurch - das unterscheidet ihn vom steinernen Wachturm.

import random

from bauteile import balken, bodenfleck, einzeltafel, leiter, schild, stoffe, walmdach, wimpel
from formen import quader

FELDER = 1
FUSS = 0.36               # halber Abstand der Pfosten am Boden
KOPF = 0.27               # und an der Plattform
BODEN = 1.5               # Hoehe der Plattform
TRAUFE = 2.1
SPITZE = 0.5


def bauen():
    s = stoffe()
    zufall = random.Random(61)
    bodenfleck('fleck', (0.0, 0.0), 0.96, 0.96, s['erde'], zufall, rund=0.5)
    ecken = [(sx, sy) for sx in (-1, 1) for sy in (-1, 1)]
    for sx, sy in ecken:
        balken('pfosten', (sx * FUSS, sy * FUSS, 0.0), (sx * KOPF, sy * KOPF, TRAUFE), 0.075, s['balken'])
    # Riegel und Kreuzstreben auf allen vier Seiten.
    def auf(anteil, sx, sy):
        r = FUSS + (KOPF - FUSS) * anteil / TRAUFE
        return (sx * r, sy * r, anteil)
    for (ax, ay), (bx, by) in (((-1, -1), (1, -1)), ((1, -1), (1, 1)), ((1, 1), (-1, 1)), ((-1, 1), (-1, -1))):
        for hoch in (0.55, 1.1):
            balken('riegel', auf(hoch, ax, ay), auf(hoch, bx, by), 0.05, s['balken'])
        balken('strebe', auf(0.08, ax, ay), auf(0.55, bx, by), 0.04, s['hellholz'])
        balken('strebe', auf(0.55, bx, by), auf(1.1, ax, ay), 0.04, s['hellholz'])

    # Die Plattform ragt ueber die Pfosten, darum das Gelaender.
    halb = 0.4
    quader('plattform', (2 * halb, 2 * halb, 0.06), s['bohle'], ort=(0, 0, BODEN), fase=0.01)
    for sx, sy in ecken:
        quader('unterzug', (0.06, 0.06, 0.3), s['balken'], ort=(sx * 0.31, sy * 0.31, BODEN - 0.13),
               drehung=(sy * 0.5, -sx * 0.5, 0))
    for (ax, ay), (bx, by) in (((-1, -1), (1, -1)), ((1, -1), (1, 1)), ((1, 1), (-1, 1)), ((-1, 1), (-1, -1))):
        for hoch in (0.16, 0.3):
            balken('gelaender', (ax * (halb - 0.03), ay * (halb - 0.03), BODEN + hoch),
                   (bx * (halb - 0.03), by * (halb - 0.03), BODEN + hoch), 0.035, s['hellholz'])
        for t in (0.0, 0.33, 0.67):
            x = (ax + (bx - ax) * t) * (halb - 0.03)
            y = (ay + (by - ay) * t) * (halb - 0.03)
            quader('gelaenderpfosten', (0.035, 0.035, 0.32), s['hellholz'], ort=(x, y, BODEN + 0.16))
    walmdach((0, 0), 0.62, 0.62, TRAUFE, SPITZE, s['schindel'], firstlaenge=0, ueber=0.14, lagen=5, zufall=zufall,
             ziegel=0.09)
    wimpel((0, 0, TRAUFE + SPITZE - 0.03), 0.42, s, lang=0.36, hoch=0.17)

    # Die Leiter vorn, ein Schild am Gelaender - der Besitzer auch unten.
    leiter((-0.12, -0.47, 0.0), (-0.12, -0.4, BODEN + 0.02), s, breit=0.2, sprossen=9)
    schild((0.42, -0.2, BODEN + 0.2), s, r=0.12, richtung=(1, 0, 0), neigung=0.0)
    schild((0.12, -0.42, BODEN + 0.2), s, r=0.12, richtung=(0, -1, 0), neigung=0.0)


def tafel(ziel):
    return einzeltafel('aussenposten', FELDER, 3.1, ziel, bauen)
