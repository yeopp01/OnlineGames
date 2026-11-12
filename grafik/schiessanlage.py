# Die Schiessanlage: ein weiter, niedriger Unterstand unter Stroh ueber einem
# Platz aus Sand, davor die Zielscheiben - drei mal drei Felder.
#
# Die Scheiben mit den roten Ringen stehen frei im Licht und schauen zur
# Kamera: an ihnen erkennt man die Anlage, auch klein. Unter dem Dach haengen
# die Boegen, dahinter liegen Strohballen als Pfeilfang.

import math
import random

from mathutils import Vector

from bauteile import (bannermast, bodenfleck, dachflaeche, einzeltafel, fass, quader, rundholz, stoffe, wimpel)
from formen import drehkoerper, strang
from stoffe import einfarbig

FELDER = 3
DACH = (0.0, 0.82)        # Mitte des Unterstands
LAENGE = 2.5
TIEFE = 1.0
TRAUFE = 0.82
FIRST = 0.42


def _scheibe(s, farben, ort, r=0.3, schau=(0.3, -1.0, 0.12)):
    """Eine Strohscheibe auf einem Dreibein, die Ringe zur Kamera."""
    rot, weiss = farben
    n = Vector(schau).normalized()
    drehung = tuple(n.to_track_quat('Z', 'Y').to_euler())
    mitte = Vector(ort)
    drehkoerper('scheibe', [(0, 0), (0, r), (0.09, r), (0.09, 0)], s['heu'], ort=ort, drehung=drehung, teile=20)
    for i, (anteil, stoff) in enumerate(((0.9, weiss), (0.68, rot), (0.44, weiss), (0.2, rot))):
        z = 0.092 + i * 0.004
        drehkoerper('ring', [(z, 0), (z, r * anteil), (z + 0.004, r * anteil), (z + 0.004, 0)], stoff, ort=ort,
                    drehung=drehung, teile=20)
    # Das Dreibein: zwei Beine vorn, eine Stuetze nach hinten.
    seit = n.cross(Vector((0, 0, 1))).normalized()
    oben = mitte + Vector((0, 0, r * 0.7))
    for fuss in (mitte + seit * r * 0.9 + n * 0.1, mitte - seit * r * 0.9 + n * 0.1, mitte - n * r * 1.6):
        rundholz('bein', (fuss.x, fuss.y, 0.0), tuple(oben - n * 0.03), 0.018, s['hellholz'], teile=6)


def _bogen(s, ort, hoch=0.62):
    """Ein Bogen, aufrecht an den Holm gehaengt."""
    x, y, z = ort
    strang('bogen', [(x, y, z, 0.008), (x, y - 0.09, z + hoch * 0.25, 0.013), (x, y - 0.12, z + hoch * 0.5, 0.016),
                     (x, y - 0.09, z + hoch * 0.75, 0.013), (x, y, z + hoch, 0.008)], s['hellholz'])
    rundholz('sehne', (x, y, z), (x, y, z + hoch), 0.003, s['leinen'], teile=4)


def bauen():
    s = stoffe()
    zufall = random.Random(53)
    farben = (einfarbig('scheibenrot', '#a8281d', rau=0.8), einfarbig('scheibenweiss', '#d9d3c0', rau=0.8))
    mx, my = DACH
    bodenfleck('platz', (0.0, 0.0), 2.86, 2.86, s['sand'], zufall, rund=0.22, zacken=0.02)

    # Der Unterstand: zwei Reihen Pfosten, darauf ein niedriges Strohdach.
    for i in range(4):
        x = mx - LAENGE / 2 + 0.07 + i * (LAENGE - 0.14) / 3
        for sy in (-1, 1):
            quader('pfosten', (0.1, 0.1, TRAUFE), s['balken'], ort=(x, my + sy * (TIEFE / 2 - 0.06), TRAUFE / 2))
        quader('binder', (0.08, TIEFE, 0.08), s['balken'], ort=(x, my, TRAUFE - 0.04))
    for sy in (-1, 1):
        quader('pfette', (LAENGE + 0.1, 0.09, 0.09), s['balken'], ort=(mx, my + sy * (TIEFE / 2 - 0.06), TRAUFE))
    halb, aussen = LAENGE / 2 + 0.12, TIEFE / 2 + 0.14
    unten = TRAUFE - 0.14 * FIRST / (TIEFE / 2) + 0.05
    for sy in (-1, 1):
        for heben, bis in ((0.0, 1.0), (0.035, 0.55)):
            dachflaeche('stroh', (mx - halb, my + sy * aussen, unten + heben), (mx + halb, my + sy * aussen, unten + heben),
                        (mx + halb, my + sy * aussen * (1 - bis), unten + heben + (TRAUFE + FIRST + 0.05 - unten) * bis),
                        (mx - halb, my + sy * aussen * (1 - bis), unten + heben + (TRAUFE + FIRST + 0.05 - unten) * bis),
                        s['stroh'], lagen=5 if bis == 1.0 else 3, stufe=0.02, dicke=0.07, zufall=zufall, franse=0.03,
                        glatt=True)
    rundholz('firststange', (mx - halb, my, TRAUFE + FIRST + 0.08), (mx + halb, my, TRAUFE + FIRST + 0.08), 0.035,
             s['balken'], teile=8)
    # Die Rueckwand: halbhoch, aus Brettern.
    for i in range(12):
        x = mx - LAENGE / 2 + 0.12 + (i + 0.5) * (LAENGE - 0.24) / 12
        quader('brett', ((LAENGE - 0.24) / 12 - 0.012, 0.03, 0.6 - 0.03 * (i % 2)), s['brett'],
               ort=(x, my + TIEFE / 2 - 0.05, 0.3), fase=0.006)

    # Links unter dem Dach der Bogenstaender, daneben ein Fass voll Pfeile.
    hy = my + 0.12
    for x in (mx - 1.1, mx - 0.25):
        quader('staenderpfosten', (0.05, 0.05, 0.72), s['balken'], ort=(x, hy, 0.36))
    quader('holm', (0.95, 0.04, 0.04), s['balken'], ort=(mx - 0.675, hy, 0.7))
    quader('holm', (0.95, 0.04, 0.04), s['balken'], ort=(mx - 0.675, hy, 0.1))
    for i in range(5):
        _bogen(s, (mx - 1.0 + i * 0.165, hy - 0.035, 0.1))
    fx, fy = mx - 0.05, my - 0.2
    fass((fx, fy, 0.0), s, r=0.1, h=0.28)
    for i in range(7):
        w = i * 0.9
        px, py = fx + math.cos(w) * 0.045, fy + math.sin(w) * 0.045
        rundholz('pfeil', (px, py, 0.15), (px + math.cos(w) * 0.03, py + math.sin(w) * 0.03, 0.5), 0.006, s['hellholz'],
                 teile=4)
        quader('feder', (0.03, 0.03, 0.07), s['kalk'], ort=(px + math.cos(w) * 0.028, py + math.sin(w) * 0.028, 0.47),
               fase=0)
    # Rechts unter dem Dach die Strohballen, der Pfeilfang.
    for reihe, anzahl in enumerate((3, 2)):
        for i in range(anzahl):
            quader('ballen', (0.42, 0.3, 0.27), s['heu'],
                   ort=(mx + 0.38 + (i + reihe * 0.5) * 0.44, my + 0.1, 0.135 + reihe * 0.27),
                   drehung=(0, 0, zufall.uniform(-0.06, 0.06)), fase=0.04)

    # Die Scheiben: zwei vor den Ballen, eine weiter vorn rechts.
    _scheibe(s, farben, (mx + 0.5, my - 0.62, 0.52), r=0.27)
    _scheibe(s, farben, (mx + 1.02, my - 0.72, 0.5), r=0.27)
    _scheibe(s, farben, (0.78, -0.62, 0.56), r=0.34, schau=(0.45, -1.0, 0.12))

    # Die Linie, von der geschossen wird, und ein Koecherstaender.
    quader('linie', (1.1, 0.07, 0.03), s['hellholz'], ort=(-0.55, -1.02, 0.03), drehung=(0, 0, 0.04), fase=0.008)
    for dx in (-0.12, 0.12):
        rundholz('pflock', (-1.05 + dx, -0.72, 0.0), (-1.05 + dx, -0.72, 0.34), 0.02, s['balken'], teile=6)
    rundholz('pflockholm', (-1.2, -0.72, 0.32), (-0.9, -0.72, 0.32), 0.016, s['balken'], teile=6)
    for i in range(4):
        rundholz('pfeil', (-1.14 + i * 0.06, -0.78, 0.0), (-1.14 + i * 0.06, -0.72, 0.45), 0.006, s['hellholz'], teile=4)
        quader('feder', (0.03, 0.03, 0.07), s['kalk'], ort=(-1.14 + i * 0.06, -0.723, 0.42), fase=0)

    bannermast((-1.22, -1.2), 1.25, s, breit=0.3, lang=0.5)
    wimpel((mx + LAENGE / 2, my, TRAUFE + FIRST + 0.05), 0.42, s)


def tafel(ziel):
    return einzeltafel('schiessanlage', FELDER, 1.9, ziel, bauen)
