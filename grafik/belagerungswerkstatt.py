# Die Belagerungswerkstatt: eine offene Halle aus schweren Balken unter einem
# Schindeldach, drei mal drei Felder.
#
# Man sieht durch sie hindurch auf das, was darin entsteht. Davor der
# Rammbalken auf zwei Boecken und ein grosses Rad, daneben der Kran, dessen
# Ausleger ueber das Dach ragt - Rad und Kran sind das Merkmal.

import math
import random

from mathutils import Vector

from bauteile import (balken, banner, bodenfleck, einzeltafel, rundholz, satteldach, stammstapel, stoffe, wagenrad,
                      wimpel)
from formen import drehkoerper, quader

FELDER = 3
MITTE = (-0.3, 0.42)
LAENGE = 2.15
TIEFE = 1.55
TRAUFE = 1.2
FIRST = 0.62


def _bock(s, x, y, hoch=0.42, breit=0.4):
    """Ein Bock quer zum Balken, der auf ihm liegt."""
    for sy in (-1, 1):
        balken('bockbein', (x - 0.1, y + sy * breit / 2, 0.0), (x, y + sy * 0.06, hoch), 0.05, s['balken'])
        balken('bockbein', (x + 0.1, y + sy * breit / 2, 0.0), (x, y + sy * 0.06, hoch), 0.05, s['balken'])
    quader('bockholm', (0.08, breit * 0.7, 0.07), s['balken'], ort=(x, y, hoch))


def bauen():
    s = stoffe()
    zufall = random.Random(83)
    mx, my = MITTE
    vorn = my - TIEFE / 2
    rechts = mx + LAENGE / 2
    bodenfleck('hof', (0.0, 0.0), 2.86, 2.86, s['erde'], zufall, rund=0.25)

    # Die Halle: sechs Pfosten, Pfetten, Binder, Kopfbaender.
    for i in range(3):
        x = mx + (i - 1) * (LAENGE / 2 - 0.07)
        for sy in (-1, 1):
            y = my + sy * (TIEFE / 2 - 0.07)
            quader('pfosten', (0.14, 0.14, TRAUFE), s['balken'], ort=(x, y, TRAUFE / 2))
            for seite in (-1, 1):
                if (i == 0 and seite < 0) or (i == 2 and seite > 0):
                    continue
                balken('kopfband', (x, y, TRAUFE - 0.42), (x + seite * 0.32, y, TRAUFE - 0.07), 0.07, s['balken'])
        quader('binder', (0.1, TIEFE, 0.1), s['balken'], ort=(x, my, TRAUFE - 0.05))
        # Das offene Gespaerre: zwei Sparren, ein Stiel.
        quader('firststiel', (0.08, 0.08, FIRST - 0.06), s['balken'], ort=(x, my, TRAUFE + (FIRST - 0.06) / 2))
        for sy in (-1, 1):
            balken('sparren', (x, my + sy * TIEFE / 2, TRAUFE), (x, my, TRAUFE + FIRST - 0.04), 0.07, s['balken'])
    for sy in (-1, 1):
        quader('pfette', (LAENGE + 0.16, 0.11, 0.11), s['balken'], ort=(mx, my + sy * (TIEFE / 2 - 0.07), TRAUFE))
    satteldach(MITTE, LAENGE, TIEFE, TRAUFE + 0.05, FIRST, s['schindel'], ueber=0.16, ortgang=0.16, lagen=8,
               firststoff=s['schindel'], zufall=zufall)
    # Die Rueckwand: halbhoch, aus Bohlen.
    for i in range(10):
        x = mx - LAENGE / 2 + 0.16 + (i + 0.5) * (LAENGE - 0.32) / 10
        quader('bohle', ((LAENGE - 0.32) / 10 - 0.012, 0.035, 0.72 - 0.04 * (i % 2)), s['brett'],
               ort=(x, my + TIEFE / 2 - 0.06, 0.36), fase=0.006)

    # In der Halle: das Gestell einer Ramme, halb fertig.
    gx, gy = mx - 0.3, my + 0.1
    for dx in (-0.5, 0.5):
        for sy in (-1, 1):
            balken('gestell', (gx + dx, gy + sy * 0.34, 0.0), (gx + dx, gy + sy * 0.06, 0.78), 0.07, s['hellholz'])
    balken('gestellfirst', (gx - 0.62, gy, 0.78), (gx + 0.62, gy, 0.78), 0.08, s['hellholz'])
    for sy in (-1, 1):
        balken('gestellschwelle', (gx - 0.6, gy + sy * 0.34, 0.05), (gx + 0.6, gy + sy * 0.34, 0.05), 0.08, s['hellholz'])
    # Die Werkbank rechts hinten.
    quader('werkbank', (0.6, 0.28, 0.06), s['bohle'], ort=(mx + 0.7, my + 0.4, 0.42), fase=0.01)
    for dx in (-0.24, 0.24):
        quader('werkbankbein', (0.06, 0.24, 0.4), s['balken'], ort=(mx + 0.7 + dx, my + 0.4, 0.2))

    # Davor der Rammbalken auf zwei Boecken: ein Stamm mit eisernem Kopf.
    ry = vorn - 0.42
    _bock(s, mx - 0.55, ry)
    _bock(s, mx + 0.45, ry)
    rundholz('rammbalken', (mx - 1.0, ry, 0.55), (mx + 0.8, ry, 0.55), 0.1, s['rinde'], teile=12)
    rundholz('rammstirn', (mx - 1.004, ry, 0.55), (mx - 0.996, ry, 0.55), 0.085, s['scheit'], teile=12)
    drehkoerper('rammkopf', [(0, 0), (0, 0.115), (0.2, 0.115), (0.34, 0.05), (0.36, 0)], s['eisen'],
                ort=(mx + 0.72, ry, 0.55), drehung=(0, math.pi / 2, 0), teile=12)
    for x in (mx - 0.2, mx + 0.25):
        drehkoerper('rammband', [(-0.02, 0.1), (-0.02, 0.112), (0.02, 0.112), (0.02, 0.1)], s['eisen'],
                    ort=(x, ry, 0.55), drehung=(0, math.pi / 2, 0), teile=12)

    # Das grosse Rad lehnt am vorderen Eckpfosten und schaut zur Kamera.
    wagenrad((rechts + 0.2, vorn - 0.2, 0.45), s, r=0.45, richtung=(0.25, -1.0, 0.22), speichen=10, breit=0.07)
    # Ein zweites liegt flach daneben, noch ohne Reifen.
    wagenrad((rechts + 0.25, vorn - 0.95, 0.07), s, r=0.3, richtung=(0.0, 0.0, 1.0), speichen=8, breit=0.06, eisen=False)

    # Der Kran rechts hinter der Halle: Staender, Strebe, Ausleger, Seil und Haken.
    kx, ky = rechts + 0.32, my + 0.55
    quader('kranfuss', (0.5, 0.12, 0.1), s['balken'], ort=(kx, ky, 0.05))
    quader('kranfuss', (0.12, 0.5, 0.1), s['balken'], ort=(kx, ky, 0.05))
    quader('kranstaender', (0.12, 0.12, 2.25), s['balken'], ort=(kx, ky, 1.125))
    spitze = Vector((kx + 0.12, ky - 0.95, 2.62))
    balken('ausleger', (kx, ky, 1.7), tuple(spitze), 0.09, s['balken'])
    balken('kranstrebe', (kx, ky, 2.2), tuple(Vector((kx, ky, 1.7)).lerp(spitze, 0.6)), 0.05, s['balken'])
    for d in ((0.22, 0.0), (-0.22, 0.0), (0.0, 0.22)):
        balken('kranstuetze', (kx + d[0], ky + d[1], 0.08), (kx, ky, 0.6), 0.05, s['balken'])
    rundholz('kranseil', tuple(spitze), (spitze.x, spitze.y, 1.25), 0.01, s['seil'], teile=5)
    quader('kranlast', (0.7, 0.1, 0.1), s['hellholz'], ort=(spitze.x, spitze.y, 1.2), drehung=(0, 0.06, 0.5))
    wimpel((kx, ky, 2.25), 0.4, s)

    # Bauholz, ein Seil, der Besitzer.
    stammstapel((mx - 0.62, vorn - 0.98, 0.02), s, zufall, reihen=(3, 2), lang=0.85, r=0.06, stoff='scheit')
    drehkoerper('seilrolle', [(0, 0.07), (0, 0.15), (0.07, 0.15), (0.07, 0.07), (0, 0.07)], s['seil'],
                ort=(mx + 0.25, vorn - 1.0, 0.02), teile=14)
    banner((mx - 0.2, vorn - 0.02, TRAUFE - 0.1), s, breit=0.34, lang=0.5, richtung=(1, 0, 0))


def tafel(ziel):
    return einzeltafel('belagerungswerkstatt', FELDER, 3.3, ziel, bauen)
