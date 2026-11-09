# Ein Laubbaum: Stamm und Aeste als Rohre, das Laub aus einzelnen Blaettern.
#
# Die Krone ist keine Kugel, sondern einige tausend kleine Flaechen, jede mit
# eigener Richtung und eigenem Gruen - Licht und Schatten darin rechnet die
# Sonne. Vier Gestalten aus vier Startwerten stehen nebeneinander in der Tafel.

import math
import random

import bpy

from formen import kugel, netz, strang
from kette import Tafel, szene_leeren
from stoffe import aus_merkmal, einfarbig, farbe, gemustert

HOEHE = 2.5
MASS = 0.8     # der ganze Baum, nach dem Bauen - im Wald steht einer je Feld
GESTALTEN = 4
GRUEN = ('#1c2e16', '#2a4120', '#3b5527', '#516a30')


def _einheit(zufall):
    while True:
        v = (zufall.uniform(-1, 1), zufall.uniform(-1, 1), zufall.uniform(-1, 1))
        l = math.sqrt(sum(c * c for c in v))
        if 0.1 < l <= 1:
            return tuple(c / l for c in v)


def _kreuz(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def _norm(v):
    l = math.sqrt(sum(c * c for c in v)) or 1
    return tuple(c / l for c in v)


def bauen(startwert):
    zufall = random.Random(startwert)
    rinde = gemustert('rinde', ('#33281e', '#514032', '#695643'), massstab=(9, 9, 1.1), groesse=3,
                      detail=6, relief=1.0, fugen=0.5)
    laub = aus_merkmal('laub', rau=0.55)
    kern = einfarbig('laubkern', '#1e3018', rau=1.0)

    neigung = (zufall.uniform(-0.06, 0.06), zufall.uniform(-0.06, 0.06))
    stamm_hoehe = HOEHE * zufall.uniform(0.42, 0.5)
    stamm = [(0, 0, 0, 0.2), (0, 0, 0.09, 0.13)]
    for i in range(1, 5):
        t = i / 4
        stamm.append((neigung[0] * t * 4 + zufall.uniform(-0.02, 0.02), neigung[1] * t * 4 + zufall.uniform(-0.02, 0.02),
                      stamm_hoehe * t, 0.12 - 0.055 * t))
    strang('stamm', stamm, rinde)
    spitze = stamm[-1]

    # Aeste: vom oberen Stamm nach aussen und oben; an jedem Ende sitzt Laub.
    ballen = [((spitze[0], spitze[1], HOEHE * 0.78), 0.5)]
    aeste = zufall.randint(5, 7)
    for i in range(aeste):
        w = 2 * math.pi * (i + zufall.uniform(-0.3, 0.3)) / aeste
        ab = stamm_hoehe * zufall.uniform(0.62, 0.95)
        weit = zufall.uniform(0.45, 0.8)
        hoch = HOEHE * zufall.uniform(0.5, 0.72)
        anfang = (neigung[0] * 4 * ab / stamm_hoehe, neigung[1] * 4 * ab / stamm_hoehe, ab)
        ende = (math.cos(w) * weit, math.sin(w) * weit, hoch)
        mitte = (ende[0] * 0.55, ende[1] * 0.55, ab + (hoch - ab) * 0.4)
        strang('ast', [(*anfang, 0.06), (*mitte, 0.04), (*ende, 0.016)], rinde, rund=2)
        ballen.append((ende, zufall.uniform(0.26, 0.46)))
    for _ in range(4):
        w = zufall.uniform(0, 2 * math.pi)
        r = zufall.uniform(0.15, 0.5)
        ballen.append(((math.cos(w) * r, math.sin(w) * r, HOEHE * zufall.uniform(0.68, 0.9)), zufall.uniform(0.22, 0.38)))

    toene = [farbe(g) for g in GRUEN]
    ecken, seiten, farben = [], [], []
    for mitte, halbmesser in ballen:
        kugel('kern', halbmesser * 0.55, kern, ort=mitte, streckung=(1, 1, 0.8), teile=10, ringe=6)
        for _ in range(int(3600 * (halbmesser / 0.4) ** 2)):
            d = _einheit(zufall)
            weit = halbmesser * zufall.uniform(0.6, 1.0) * (1 + 0.12 * math.sin(d[0] * 9 + d[1] * 7 + d[2] * 5))
            p = (mitte[0] + d[0] * weit, mitte[1] + d[1] * weit, mitte[2] + d[2] * weit * 0.82)
            schief = _einheit(zufall)
            n = _norm((d[0] + schief[0] * 0.7, d[1] + schief[1] * 0.7, d[2] + schief[2] * 0.7 + 0.35))
            t = _norm(_kreuz(n, _einheit(zufall)))
            b = _kreuz(n, t)
            lang = zufall.uniform(0.026, 0.044)
            breit = lang * zufall.uniform(0.5, 0.75)
            a = len(ecken)
            for st, sb in ((-1, 0), (0, -1), (1, 0), (0, 1)):
                ecken.append(tuple(p[k] + t[k] * lang * st + b[k] * breit * sb for k in range(3)))
            seiten.append((a, a + 1, a + 2, a + 3))
            # Aussen und oben heller, innen und unten dunkler, dazu Streuung.
            hell = 0.45 + 0.3 * d[2] + 0.25 * (weit / halbmesser - 0.8) / 0.2 + zufall.uniform(-0.3, 0.3)
            hell = max(0.0, min(0.999, hell)) * (len(toene) - 1)
            i = int(hell)
            f = hell - i
            ton = tuple(toene[i][k] * (1 - f) + toene[i + 1][k] * f for k in range(3)) + (1.0,)
            farben.extend([ton] * 4)
    netz('laub', ecken, seiten, laub, farben=farben)


def tafel(ziel):
    from kette import kamera_setzen
    zelle, fuss = (300, 240), (95, 206)
    blatt = None
    for gestalt in range(GESTALTEN):
        szene_leeren()
        bauen(101 + gestalt * 17)
        for koerper in bpy.context.scene.objects:
            if koerper.type in ('MESH', 'CURVE') and not koerper.get('kulisse'):
                koerper.location = [c * MASS for c in koerper.location]
                koerper.scale = (MASS, MASS, MASS)
        if blatt is None:
            blatt = Tafel('baum', zelle=zelle, fuss=fuss, ziel=ziel)
        else:
            kamera_setzen(zelle[0], zelle[1], fuss)
        blatt.bild(0, gestalt, maske=False)
    return blatt.schreiben({'art': 'ding', 'gestalten': GESTALTEN})
