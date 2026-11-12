# Das Kloster: ein Schiff aus hellem Haustein unter steilem Schiefer, hinten
# links der hohe Glockenturm mit spitzem Helm - drei mal drei Felder.
#
# Der Turm ist das Merkmal: nichts anderes im Dorf ist so schmal und so hoch.
# Rundbogenfenster und Strebepfeiler an der langen Wand, das Portal im Giebel,
# davor ein Kraeutergarten hinter einer niedrigen Mauer.

import math
import random

from bauteile import (RECHTS, VORN, banner, bodenfleck, bogen, bogenfenster, einzeltafel, giebel, rahmen, satteldach,
                      schlitz, stoffe, stumpf, walmdach)
from formen import drehkoerper, kugel, prisma, quader
from stoffe import einfarbig

FELDER = 3
SCHIFF = (0.22, -0.1)
LAENGE = 2.05
BREITE = 1.2
WAND = 1.1
FIRST = 0.95
TURM = (-0.86, 0.78)
TURMBREITE = 0.88
TURMHOEHE = 2.6
HELM = 0.9


def bauen():
    s = stoffe()
    zufall = random.Random(73)
    gold = einfarbig('gold', '#c9a03a', rau=0.35, metall=1.0)
    kraut = einfarbig('kraut', '#4f6e30', rau=0.9)
    sx, sy = SCHIFF
    vorn = sy - BREITE / 2
    rechts = sx + LAENGE / 2
    bodenfleck('hof', (0.0, 0.0), 2.86, 2.86, s['erde'], zufall, rund=0.25)

    # Das Schiff.
    quader('sockel', (LAENGE + 0.1, BREITE + 0.1, 0.14), s['haustein'], ort=(sx, sy, 0.07), fase=0.025)
    quader('schiff', (LAENGE, BREITE, WAND), s['hellstein'], ort=(sx, sy, WAND / 2), fase=0.008)
    quader('gesims', (LAENGE + 0.06, BREITE + 0.06, 0.06), s['haustein'], ort=(sx, sy, WAND - 0.03), fase=0.012)
    v = rahmen((sx, vorn, 0), VORN)
    for i in range(4):
        bogenfenster(v, -0.72 + i * 0.48, 0.38, s, breite=0.2, hoehe=0.5)
    for i in range(5):
        x = sx - 0.96 + i * 0.48
        stumpf('strebepfeiler', (x, vorn - 0.09), (0.13, 0.2), (0.13, 0.06), 0.0, 0.95, s['haustein'], versatz=(0, 0.07))
    satteldach(SCHIFF, LAENGE, BREITE, WAND, FIRST, s['schiefer'], ueber=0.1, ortgang=0.07, lagen=11,
               firststoff=s['schiefer'], zufall=zufall, ziegel=0.09)
    # Der Giebel rechts mit dem Portal und dem runden Fenster.
    giebel(rahmen((rechts, sy, WAND), RECHTS), BREITE - 0.04, FIRST - 0.03, s, stoff='hellstein', fachwerk=False)
    r = rahmen((rechts, sy, 0), RECHTS)
    prisma('portalrahmen', bogen(0.56, 0.92), 0.08, s['haustein'], ort=(0, -0.02, 0), eltern=r)
    prisma('portal', bogen(0.42, 0.82), 0.05, s['brett'], ort=(0, -0.05, 0), eltern=r)
    quader('portalspalt', (0.012, 0.02, 0.78), s['dunkel'], ort=(0, -0.078, 0.39), fase=0, eltern=r)
    for hoch in (0.2, 0.52):
        quader('portalband', (0.4, 0.02, 0.035), s['eisen'], ort=(0, -0.08, hoch), fase=0.004, eltern=r)
    quader('portalstufe', (0.8, 0.26, 0.06), s['haustein'], ort=(0, -0.15, 0.03), fase=0.02, eltern=r)
    drehkoerper('rundfenster', [(0, 0), (0, 0.2), (0.05, 0.2), (0.05, 0.14), (0.02, 0.14), (0.02, 0)], s['haustein'],
                ort=(rechts + 0.0, sy, WAND + 0.3), drehung=(0, math.pi / 2, 0), teile=20)
    drehkoerper('rundglas', [(0.02, 0), (0.02, 0.14), (0.026, 0.14), (0.026, 0)], s['dunkel'],
                ort=(rechts + 0.0, sy, WAND + 0.3), drehung=(0, math.pi / 2, 0), teile=20)

    # Der Turm: Schlitze unten, oben die Schalloeffnungen, darauf der Helm.
    tx, ty = TURM
    quader('turm', (TURMBREITE, TURMBREITE, TURMHOEHE), s['hellstein'], ort=(tx, ty, TURMHOEHE / 2), fase=0.01)
    for hoch in (1.75, TURMHOEHE - 0.02):
        quader('turmgesims', (TURMBREITE + 0.08, TURMBREITE + 0.08, 0.07), s['haustein'], ort=(tx, ty, hoch), fase=0.012)
    tv = rahmen((tx, ty - TURMBREITE / 2, 0), VORN)
    tr = rahmen((tx + TURMBREITE / 2, ty, 0), RECHTS)
    for wand in (tv, tr):
        bogenfenster(wand, 0, 1.95, s, breite=0.3, hoehe=0.48, rand='haustein')
        schlitz(wand, 0, 1.4, s, hoehe=0.24)
    schlitz(tv, 0, 0.7, s, hoehe=0.24)
    # Die Glocke haengt in der vorderen Oeffnung.
    drehkoerper('glocke', [(0, 0.085), (0.02, 0.08), (0.1, 0.05), (0.13, 0.02), (0.14, 0)], gold,
                ort=(tx, ty - TURMBREITE / 2 - 0.0, 2.08), teile=12)
    walmdach(TURM, TURMBREITE, TURMBREITE, TURMHOEHE + 0.02, HELM, s['schiefer'], firstlaenge=0, ueber=0.09, lagen=8,
             zufall=zufall, ziegel=0.09)
    spitze = TURMHOEHE + HELM
    kugel('knauf', 0.045, gold, ort=(tx, ty, spitze + 0.02), teile=10, ringe=8)
    quader('kreuz', (0.03, 0.03, 0.3), gold, ort=(tx, ty, spitze + 0.2), drehung=(0, 0, math.pi / 4), fase=0.004)
    quader('kreuz', (0.17, 0.03, 0.03), gold, ort=(tx, ty, spitze + 0.25), drehung=(0, 0, math.pi / 4), fase=0.004)

    # Die Farbe des Besitzers: ein langes Banner am Turm, zwei neben dem Portal.
    banner((tx, ty - TURMBREITE / 2 - 0.05, 1.3), s, breit=0.34, lang=0.72, richtung=(1, 0, 0))
    for seite in (-1, 1):
        banner((rechts + 0.05, sy + seite * 0.44, WAND - 0.1), s, breit=0.18, lang=0.5, richtung=(0, 1, 0))

    # Der Garten vorn links: eine niedrige Mauer, Beete in Reihen.
    quader('gartenmauer', (0.12, 1.5, 0.22), s['stein'], ort=(-1.36, -0.6, 0.11), fase=0.03)
    quader('gartenmauer', (1.5, 0.12, 0.22), s['stein'], ort=(-0.67, -1.36, 0.11), fase=0.03)
    for bx, by, lang in ((-1.05, -0.3, 0.9), (-1.05, -0.95, 0.5), (-0.45, -1.02, 0.5), (0.1, -1.02, 0.5)):
        laengs_y = lang > 0.6
        mass = (0.34, lang, 0.05) if laengs_y else (lang, 0.36, 0.05)
        quader('beet', mass, s['erde'], ort=(bx, by, 0.04), fase=0.02)
        zahl = round(lang / 0.13)
        for i in range(zahl):
            for quer in (-0.08, 0.08):
                d = -lang / 2 + 0.07 + i * (lang - 0.14) / max(1, zahl - 1)
                x, y = (bx + quer, by + d) if laengs_y else (bx + d, by + quer)
                kugel('kraut', zufall.uniform(0.04, 0.06), kraut, ort=(x, y, 0.09), streckung=(1, 1, 0.8), teile=7,
                      ringe=5)


def tafel(ziel):
    return einzeltafel('kloster', FELDER, 3.9, ziel, bauen)
