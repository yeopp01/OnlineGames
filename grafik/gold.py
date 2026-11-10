# Der Goldvorrat: dunkles Gestein mit Adern aus Gold, obenauf einzelne
# Klumpen (darstellung AC-23).
#
# Das Gold ist Metall, keine gelbe Farbe: es spiegelt Himmel und Sonne. Im
# Schatten ist es dunkel, in der Sonne blitzt es - "glaenzt, ohne gelb zu
# leuchten".

import math
import random

import stein
from fels import brocken, haufen
from stoffe import einfarbig, erz, gemustert

GOLD = '#d9a93f'


def bauen(startwert, stufe):
    gestein = erz('golderz', ('#3d342b', '#584b3c', '#74644f'), GOLD, anteil=0.36, groesse=4.5, rau_metall=0.32)
    schutt = gemustert('erzschutt', ('#40372d', '#5c4f3f', '#75664f'), groesse=9, detail=4, relief=0.6, fugen=0.4,
                       rau=0.95)
    klumpen = einfarbig('goldklumpen', GOLD, rau=0.28, metall=1.0)

    def obenauf(zufall, ort, halbmesser):
        # Ein bis drei Klumpen, die aus dem Brocken ragen.
        for _ in range(zufall.randint(1, 3)):
            w = zufall.uniform(0, 2 * math.pi)
            hoch = zufall.uniform(0.2, 0.75)
            r = halbmesser * zufall.uniform(0.16, 0.26)
            weit = halbmesser * (1 - hoch * 0.45) * 0.85
            brocken('klumpen', zufall, r, klumpen,
                    (ort[0] + math.cos(w) * weit, ort[1] + math.sin(w) * weit, ort[2] + halbmesser * hoch * 0.7),
                    streckung=(1, 1, 0.85), kantig=0.35, teile=5, ringe=4)

    haufen(random.Random(startwert), stufe, gestein, schutt, obenauf=obenauf)


def tafel(ziel):
    return stein.tafel(ziel, name='gold', bauen_mit=bauen)
