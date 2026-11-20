# Das Drachenei (einheiten AC-51, AC-53, darstellung AC-32): es liegt auf der
# Karte, bis ein Dorfbewohner es heimtraegt - und wo ein Drache faellt, liegt
# wieder eines.
#
# So dunkel wie der Drache selbst: eine Schale aus basaltgrauen Schuppen, durch
# deren Risse es glueht. Es liegt schraeg in einer verbrannten Mulde, um die
# ein Kranz geschwaerzter Steine liegt - das Gras wuechse dort nicht. Die Glut
# ist das Merkmal: nichts anderes am Boden leuchtet, und man findet es auch im
# gedaempften Nebel wieder.
#
# Eine Zeile, zwei Spalten:
#   Spalte 0  das Ei in seiner Mulde - so liegt es auf der Karte
#   Spalte 1  das Ei allein, mit seinem Schatten - fuer die Stelle, an der ein
#             Traeger gefallen ist, und fuer das Knopfbild
#
# Gebaut in Feldern wie alles, was am Boden liegt. Das Ei ist 0,44 Felder hoch
# (ein Dorfbewohner 1,06): gross genug, dass man es bei Zoom 1 sieht, und klein
# genug, dass ein Mensch es auf dem Ruecken traegt. Dieselbe Form in Metern
# traegt der Dorfbewohner als Ladung `e` (dorfbewohner.py ruft ei() hier).

import math
import random

from bauteile import bodenfleck, rundholz
from fels import brocken
from formen import drehkoerper, leer, strang
from kette import Tafel, kamera_setzen, szene_leeren
from stoffe import einfarbig, gemustert, glut

HOCH = 0.44
# Der Umriss, auf die Hoehe 1 gerechnet: (Hoehe, Halbmesser). Unten breit,
# oben spitz - ein Ei, kein Ball.
UMRISS = [(0.0, 0.0), (0.03, 0.14), (0.1, 0.25), (0.22, 0.33), (0.36, 0.355), (0.52, 0.33), (0.68, 0.27),
          (0.82, 0.19), (0.93, 0.1), (0.985, 0.04), (1.0, 0.0)]


def stoffe():
    return {
        'schale': gemustert('eischale', ('#2b2726', '#473d38', '#6a5a4c'), groesse=30, detail=5, relief=0.9, fugen=0.7,
                            rau=0.5),
        'riss': glut('eiriss', '#ff7a1e', 2.2),
        'russ': gemustert('eiruss', ('#1f1b18', '#2e2924', '#3d362f'), groesse=10, detail=6, relief=0.7, fugen=0.4,
                          rau=0.95),
        'asche': gemustert('eiasche', ('#4b4640', '#6a645b', '#857e72'), groesse=14, detail=5, relief=0.5, fugen=0.3,
                           rau=0.95),
        'brandstein': gemustert('brandstein', ('#34302c', '#4d4841', '#676158'), groesse=7, detail=6, relief=0.8,
                                fugen=0.4, rau=0.92),
        'kohle': einfarbig('kohle', '#1c1815', rau=0.9),
    }


def _halbmesser(h):
    """Der Halbmesser der Schale auf der Hoehe h (0 bis 1)."""
    for (h0, r0), (h1, r1) in zip(UMRISS, UMRISS[1:]):
        if h0 <= h <= h1:
            return r0 + (r1 - r0) * (h - h0) / (h1 - h0)
    return 0.0


def ei(s, eltern=None, ort=(0, 0, 0), hoch=HOCH, neigung=(0.0, 0.0, 0.0), startwert=5):
    """Die Schale mit ihren gluehenden Rissen. `hoch` ist ihre Hoehe in den
    Massen des Rahmens `eltern` - Felder am Boden, Meter am Ruecken."""
    zufall = random.Random(startwert)
    rahmen = leer('ei', ort, eltern)
    rahmen.rotation_euler = neigung
    drehkoerper('schale', [(h * hoch, r * hoch) for h, r in UMRISS], s['schale'], eltern=rahmen, teile=20)
    # Die Risse: von einem Punkt unter der Spitze laufen sie im Zickzack
    # hinab und verzweigen sich einmal. Knapp ueber der Schale, damit die Glut
    # nicht in ihr verschwindet.
    def punkt(h, w, dick):
        r = (_halbmesser(h) + 0.006) * hoch
        return (math.cos(w) * r, math.sin(w) * r, h * hoch, dick * hoch)

    for i in range(6):
        w = 2 * math.pi * (i + zufall.uniform(-0.2, 0.2)) / 6
        h = zufall.uniform(0.8, 0.9)
        linie = [punkt(h, w, 0.008)]
        ast = None
        while h > 0.2:
            h -= zufall.uniform(0.08, 0.14)
            w += zufall.uniform(-0.3, 0.3)
            linie.append(punkt(h, w, 0.014 if h > 0.3 else 0.008))
            if ast is None and h < 0.62:
                ast = [linie[-1], punkt(h - 0.1, w + 0.38, 0.011), punkt(h - 0.22, w + 0.5, 0.006)]
        strang('riss', linie, s['riss'], eltern=rahmen, rund=1)
        if ast:
            strang('riss', ast, s['riss'], eltern=rahmen, rund=1)
    return rahmen


def bauen(mulde=True):
    s = stoffe()
    zufall = random.Random(53)
    if not mulde:
        ei(s, ort=(0, 0, -0.012), neigung=(0.12, 0.1, 0.0))
        return
    bodenfleck('brand', (0.0, 0.0), 1.0, 0.92, s['russ'], zufall, hoch=0.022, rund=0.5, zacken=0.07)
    bodenfleck('asche', (0.02, -0.02), 0.56, 0.5, s['asche'], zufall, hoch=0.04, rund=0.5, zacken=0.04)
    # Ein Kranz geschwaerzter Steine, vorn offener als hinten.
    for i in range(11):
        w = 2 * math.pi * (i + zufall.uniform(-0.25, 0.25)) / 11
        weit = zufall.uniform(0.34, 0.41)
        r = zufall.uniform(0.045, 0.085)
        brocken('brandstein', zufall, r, s['brandstein'], ort=(math.cos(w) * weit, math.sin(w) * weit, r * 0.45),
                streckung=(1.1, 0.95, 0.75), kantig=0.3)
    # Verkohltes Holz, wie von einem Nest, das gebrannt hat.
    for _ in range(7):
        w = zufall.uniform(0, 2 * math.pi)
        a, lang = zufall.uniform(0.16, 0.3), zufall.uniform(0.16, 0.26)
        quer = w + zufall.uniform(1.0, 2.1)
        x, y = math.cos(w) * a, math.sin(w) * a
        rundholz('kohle', (x, y, 0.045), (x + math.cos(quer) * lang, y + math.sin(quer) * lang, 0.05 + zufall.uniform(0, 0.03)),
                 zufall.uniform(0.012, 0.02), s['kohle'], teile=6, spitz=0.6)
    # Das Ei liegt schraeg in der Mulde, die Spitze nach hinten links.
    ei(s, ort=(0.0, 0.0, 0.01), neigung=(0.3, 0.22, 0.0))


def tafel(ziel):
    zelle, fuss = (240, 170), (96, 112)
    blatt = None
    for spalte, mulde in enumerate((True, False)):
        szene_leeren()
        bauen(mulde)
        if blatt is None:
            blatt = Tafel('drachenei', zelle=zelle, fuss=fuss, ziel=ziel)
        else:
            kamera_setzen(zelle[0], zelle[1], fuss)
        blatt.bild(0, spalte, maske=False)
    return blatt.schreiben({'art': 'ei', 'liegt': 0, 'allein': 1})
