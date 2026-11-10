# Der Beerenstrauch (darstellung AC-23): ein niedriger, breiter Busch, an dem
# dunkelrote Beeren in Trauben haengen. Vier Fuellstufen als Zeilen - je
# leerer, desto weniger Beeren, und der Busch ist etwas kleiner.
#
# Niedrig mit Absicht: hoechstens doppelt so hoch wie ein Schaf, sonst
# verdeckt er, was dahinter steht.

import math
import os
import random

from baum import Laub
from formen import kugel, strang
from kette import Tafel, kamera_setzen, szene_leeren
from stoffe import aus_merkmal, einfarbig

GESTALTEN = 3
STUFEN = 4
BEEREN = (0, 9, 30, 60, 95)       # je Fuellstufe 1 bis 4
# Der volle Busch bei 0,85: gemessen 2026-11-10 war er bei 1,0 je nach Gestalt
# 68 bis 76 Bildpunkte hoch, das Schaf in derselben Groesse 34.
GROESSE = (0, 0.68, 0.74, 0.80, 0.85)


def bauen(startwert, stufe):
    zufall = random.Random(startwert)
    laub = Laub(('#1d3016', '#2c471f', '#3f5f28', '#577632'), zufall)
    kern = einfarbig('laubkern', '#1b2c15', rau=1.0)
    zweig = einfarbig('zweig', '#3a2c20', rau=0.9)
    beere = einfarbig('beere', '#8f1d2a', rau=0.3)
    mass = GROESSE[stufe]

    ballen = [((0.0, 0.0, 0.3), 0.3)]
    rund = zufall.randint(5, 6)
    versatz = zufall.uniform(0, 2 * math.pi)
    for i in range(rund):
        w = versatz + 2 * math.pi * (i + zufall.uniform(-0.25, 0.25)) / rund
        weit = zufall.uniform(0.25, 0.36)
        ballen.append(((math.cos(w) * weit, math.sin(w) * weit, zufall.uniform(0.17, 0.26)), zufall.uniform(0.19, 0.25)))
    ballen.append(((zufall.uniform(-0.08, 0.08), zufall.uniform(-0.08, 0.08), 0.47), 0.2))
    # Beeren: in Trauben auf der Aussenseite der Ballen. Fuer den vollen
    # Busch gezogen und nach der Stufe gekuerzt - so ist der halbleere Busch
    # derselbe wie der volle, nur abgeerntet.
    plaetze = []
    while len(plaetze) < BEEREN[4]:
        mitte, halbmesser = ballen[zufall.randrange(len(ballen))]
        w = zufall.uniform(0, 2 * math.pi)
        hoch = zufall.uniform(-0.1, 0.95)
        flach = math.sqrt(1 - hoch * hoch)
        d = (math.cos(w) * flach, math.sin(w) * flach, hoch * 0.8)
        for _ in range(zufall.randint(3, 5)):
            p = tuple(mitte[k] + d[k] * halbmesser * 0.98 + zufall.uniform(-0.035, 0.035) for k in range(3))
            plaetze.append((p, zufall.uniform(0.019, 0.026)))
    zufall.shuffle(plaetze)
    laubzufall = random.Random(startwert + 1)
    laub.zufall = laubzufall

    for mitte, halbmesser in ballen:
        ort = tuple(c * mass for c in mitte)
        strang('zweig', [(0, 0, 0, 0.022), (ort[0] * 0.5, ort[1] * 0.5, ort[2] * 0.6, 0.014), (*ort, 0.006)], zweig, rund=1)
        laub.ballen(ort, halbmesser * mass, kern, dichte=3000, strecke=(1, 1, 0.8), lang=(0.022, 0.036),
                    schmal=(0.55, 0.8))
    laub.ablegen(aus_merkmal('laub', rau=0.5))
    for p, r in plaetze[:BEEREN[stufe]]:
        kugel('beere', r, beere, ort=tuple(c * mass for c in p), teile=8, ringe=6)


def tafel(ziel):
    zelle, fuss = (220, 150), (86, 106)
    gestalten = 1 if os.environ.get('BILDER_PROBE') else GESTALTEN
    blatt = None
    for zeile in range(STUFEN):
        for gestalt in range(gestalten):
            szene_leeren()
            bauen(307 + gestalt * 23, STUFEN - zeile)
            if blatt is None:
                blatt = Tafel('beere', zelle=zelle, fuss=fuss, ziel=ziel)
            else:
                kamera_setzen(zelle[0], zelle[1], fuss)
            blatt.bild(zeile, gestalt, maske=False)
    return blatt.schreiben({'art': 'vorrat', 'gestalten': gestalten, 'stufen': STUFEN})
