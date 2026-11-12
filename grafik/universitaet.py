# Die Universitaet: heller Putz, eine Saeulenhalle vor dem Eingang und darueber
# die gruene Kuppel aus Kupfer - drei mal drei Felder.
#
# Die Kuppel ist das Merkmal: das einzige runde Dach im Dorf, und das einzige
# gruene. Der Bau ist streng und gleichmaessig, mit Rundbogenfenstern und
# einem flachen Ziegeldach.

import math
import random

from bauteile import (RECHTS, VORN, bannermast, bodenfleck, bogen, bogenfenster, einzeltafel, rahmen, stoffe, walmdach,
                      wimpel)
from formen import drehkoerper, kugel, prisma, quader
from stoffe import einfarbig

FELDER = 3
MITTE = (-0.08, 0.3)
LAENGE = 2.3
BREITE = 1.8
SOCKEL = 0.14
WAND = 1.2
DACH = 0.36
TROMMEL = 0.56            # Halbmesser unter der Kuppel


def bauen():
    s = stoffe()
    zufall = random.Random(79)
    gold = einfarbig('gold', '#c9a03a', rau=0.35, metall=1.0)
    mx, my = MITTE
    vorn = my - BREITE / 2
    rechts = mx + LAENGE / 2
    bodenfleck('hof', (0.0, 0.0), 2.86, 2.86, s['pflaster'], zufall, hoch=0.03, rund=0.15, zacken=0.015)

    quader('sockel', (LAENGE + 0.12, BREITE + 0.12, SOCKEL), s['hellstein'], ort=(mx, my, SOCKEL / 2), fase=0.02)
    quader('bau', (LAENGE, BREITE, WAND), s['kalk'], ort=(mx, my, SOCKEL + WAND / 2), fase=0.006)
    krone = SOCKEL + WAND
    quader('gesims', (LAENGE + 0.12, BREITE + 0.12, 0.09), s['hellstein'], ort=(mx, my, krone), fase=0.015)
    for sx in (-1, 1):
        for sy in (-1, 1):
            quader('lisene', (0.14, 0.14, WAND), s['hellstein'],
                   ort=(mx + sx * (LAENGE / 2 - 0.05), my + sy * (BREITE / 2 - 0.05), SOCKEL + WAND / 2), fase=0.01)
    r = rahmen((rechts, my, SOCKEL), RECHTS)
    for x in (-0.55, 0.0, 0.55):
        bogenfenster(r, x, 0.42, s, breite=0.2, hoehe=0.52)
    v = rahmen((mx, vorn, SOCKEL), VORN)
    for x in (-0.98, 0.98):
        bogenfenster(v, x, 0.42, s, breite=0.18, hoehe=0.5)
    prisma('portalrahmen', bogen(0.5, 0.92), 0.06, s['hellstein'], ort=(-0.1, -0.02, 0), eltern=v)
    prisma('portal', bogen(0.38, 0.84), 0.05, s['brett'], ort=(-0.1, -0.04, 0), eltern=v)
    quader('portalspalt', (0.012, 0.02, 0.8), s['dunkel'], ort=(-0.1, -0.068, 0.4), fase=0, eltern=v)
    for x in (-0.55, 0.35):
        bogenfenster(v, x, 0.42, s, breite=0.16, hoehe=0.46)

    walmdach(MITTE, LAENGE, BREITE, krone + 0.04, DACH, s['ziegel'], firstlaenge=0.5, ueber=0.1, lagen=6,
             zufall=zufall)

    # Die Trommel mit kleinen Fenstern, darauf die Kuppel und die Laterne.
    fuss = krone + 0.16
    hoch = 0.46
    drehkoerper('trommel', [(0, 0), (0, TROMMEL), (hoch, TROMMEL), (hoch, 0)], s['kalk'], ort=(mx, my, fuss), teile=28)
    drehkoerper('trommelkranz', [(hoch - 0.03, TROMMEL - 0.02), (hoch - 0.03, TROMMEL + 0.05), (hoch + 0.04, TROMMEL + 0.05),
                                 (hoch + 0.04, TROMMEL - 0.02)], s['hellstein'], ort=(mx, my, fuss), teile=28)
    for i in range(12):
        w = 2 * math.pi * (i + 0.5) / 12
        quader('trommelfenster', (0.03, 0.1, 0.2), s['dunkel'],
               ort=(mx + math.cos(w) * TROMMEL, my + math.sin(w) * TROMMEL, fuss + hoch * 0.58), drehung=(0, 0, w), fase=0)
    kuppel = fuss + hoch + 0.04
    kugel('kuppel', TROMMEL - 0.01, s['kupfer'], ort=(mx, my, kuppel), streckung=(1, 1, 0.92), teile=28, ringe=16)
    # Rippen aus dunklerem Kupfer, vom Kranz zur Laterne.
    for i in range(8):
        w = 2 * math.pi * i / 8
        punkte = []
        for k in range(9):
            a = math.pi / 2 * k / 8 * 0.94
            rr = (TROMMEL + 0.005) * math.cos(a)
            punkte.append((mx + math.cos(w) * rr, my + math.sin(w) * rr, kuppel + (TROMMEL + 0.005) * 0.92 * math.sin(a)))
        for a, b in zip(punkte, punkte[1:]):
            quader('rippe', (math.dist(a, b) + 0.01, 0.035, 0.02), s['kupfer'],
                   ort=tuple((p + q) / 2 for p, q in zip(a, b)),
                   drehung=(0, -math.atan2(b[2] - a[2], math.hypot(b[0] - a[0], b[1] - a[1])), w + math.pi), fase=0.004)
    scheitel = kuppel + (TROMMEL - 0.01) * 0.92
    drehkoerper('laterne', [(-0.04, 0), (-0.04, 0.11), (0.14, 0.1), (0.14, 0.13), (0.17, 0.13), (0.3, 0.0)], s['kalk'],
                ort=(mx, my, scheitel), teile=12)
    drehkoerper('laternenhaube', [(0.17, 0.135), (0.31, 0.0)], s['kupfer'], ort=(mx, my, scheitel), teile=12)
    kugel('knauf', 0.045, gold, ort=(mx, my, scheitel + 0.33), teile=10, ringe=8)
    wimpel((mx, my, scheitel + 0.35), 0.4, s, lang=0.36, hoch=0.17)

    # Die Saeulenhalle vor dem Eingang: Stufen, fuenf Saeulen, Gebaelk, Giebel.
    px, weit, tief = mx - 0.1, 1.62, 0.52
    py = vorn - tief / 2
    quader('stufe', (weit + 0.34, tief + 0.3, SOCKEL / 2), s['hellstein'], ort=(px, py - 0.06, SOCKEL / 4), fase=0.015)
    quader('podest', (weit + 0.1, tief + 0.06, SOCKEL), s['hellstein'], ort=(px, py, SOCKEL / 2), fase=0.015)
    saeule = 0.92
    for i in range(5):
        x = px - weit / 2 + 0.1 + i * (weit - 0.2) / 4
        drehkoerper('saeule', [(0, 0), (0, 0.08), (0.04, 0.08), (0.06, 0.06), (saeule - 0.07, 0.05), (saeule - 0.05, 0.075),
                               (saeule, 0.075), (saeule, 0)], s['hellstein'], ort=(x, vorn - tief + 0.1, SOCKEL), teile=14)
    gebaelk = SOCKEL + saeule
    quader('gebaelk', (weit, tief, 0.13), s['hellstein'], ort=(px, py, gebaelk + 0.065), fase=0.012)
    quader('gebaelkrand', (weit + 0.08, tief + 0.06, 0.04), s['hellstein'], ort=(px, py, gebaelk + 0.14), fase=0.01)
    g = rahmen((px, py, gebaelk + 0.16), VORN)
    prisma('halbgiebel', [(-weit / 2 - 0.04, 0), (weit / 2 + 0.04, 0), (0, 0.36)], tief + 0.04, s['kalk'], eltern=g)
    for seite in (-1, 1):
        quader('giebelrand', (math.hypot(weit / 2 + 0.06, 0.36) + 0.04, tief + 0.1, 0.045), s['hellstein'],
               ort=(seite * (weit / 4 + 0.02), 0, 0.2), drehung=(0, seite * math.atan2(0.36, weit / 2 + 0.04), 0),
               fase=0.01, eltern=g)
    drehkoerper('giebelscheibe', [(0, 0), (0, 0.09), (0.02, 0.09), (0.02, 0)], gold, ort=(0, -tief / 2 - 0.02, 0.14),
                drehung=(math.pi / 2, 0, 0), teile=14, eltern=g)

    # Zwei Banner rahmen die Stufen.
    for seite in (-1, 1):
        bannermast((px + seite * (weit / 2 + 0.32), vorn - tief - 0.25), 1.3, s, breit=0.26, lang=0.5)


def tafel(ziel):
    return einzeltafel('universitaet', FELDER, 3.3, ziel, bauen)
