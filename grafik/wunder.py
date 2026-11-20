# Das Wunder (bauen AC-51, darstellung AC-32): das groesste Bauwerk des Spiels,
# fuenf mal fuenf Felder - wer es vollendet und haelt, gewinnt.
#
# Ein Turm in drei Stufen aus hellem Stein, jede schmaler als die darunter,
# und obenauf eine Kuppel aus Gold: auf einem Sockel aus drei Stufen die
# Halle mit Bogenfenstern und vier schlanken Ecktuermen, darueber ein
# Saeulenkranz, darueber die Trommel mit der Kuppel und ihrer Laterne. Nichts
# anderes im Spiel ist golden, nichts ist so hoch: man erkennt es auch am
# Bildrand und auf den ersten Blick von Burg (grau, kantig, Zinnen), Kloster
# (schmaler Turm) und Universitaet (gruene Kuppel).
#
# Wem es gehoert, zeigen vier lange Banner an den zwei Waenden, die man sieht,
# und die Fahne auf der Spitze. Vor den Portalen brennen Feuerschalen.

import math
import random

from bauteile import (RECHTS, VORN, banner, bodenfleck, bogen, bogenfenster, einzeltafel, fahne, rahmen, schlitz, stoffe,
                      zinnen)
from formen import drehkoerper, kugel, prisma, quader
from stoffe import gemustert, glut

FELDER = 5
SOCKEL = 0.36             # drei Stufen
HALLE = 3.0               # Seitenlaenge der Halle
HALLENHOCH = 1.0
KRANZ = 1.0               # Halbmesser des Saeulenkranzes
KRANZHOCH = 0.95
TROMMEL = 0.64
TROMMELHOCH = 0.5
ECKTURM = 1.95            # Hoehe der vier Ecktuerme ueber dem Boden


def _gold():
    return gemustert('blattgold', ('#a97a12', '#d9a62c', '#f0cd62'), groesse=7, detail=4, relief=0.2, fugen=0.3,
                     rau=0.32, metall=0.85)


def _wand(s, r, portal):
    """Eine Wand der Halle am Rahmen `r`: Pilaster, Bogenfenster, in der
    Mitte das Portal oder ein hohes Fenster, dazu zwei Banner."""
    for x in (-1.14, -0.52, 0.52, 1.14):
        quader('pilaster', (0.11, 0.07, HALLENHOCH - 0.02), s['haustein'], ort=(x, -0.03, HALLENHOCH / 2), eltern=r,
               fase=0.01)
    for x in (-0.83, 0.83):
        bogenfenster(r, x, 0.2, s, breite=0.26, hoehe=0.6, rand='haustein')
    if portal:
        prisma('portalbogen', bogen(0.8, 0.92), 0.07, s['haustein'], ort=(0, -0.02, 0), eltern=r)
        prisma('portal', bogen(0.62, 0.82), 0.07, s['bohle'], ort=(0, -0.04, 0), eltern=r)
        quader('portalspalt', (0.016, 0.02, 0.78), s['dunkel'], ort=(0, -0.078, 0.39), fase=0, eltern=r)
        for hoch in (0.2, 0.5):
            quader('portalband', (0.58, 0.02, 0.05), s['gold'], ort=(0, -0.08, hoch), fase=0.004, eltern=r)
        # Zwei Stufen mehr vor dem Portal.
        quader('schwelle', (1.1, 0.26, 0.05), s['haustein'], ort=(0, -0.13, 0.025), fase=0.01, eltern=r)
    else:
        prisma('hochfenster', bogen(0.5, 0.82), 0.06, s['haustein'], ort=(0, -0.015, 0.1), eltern=r)
        prisma('hochfensterloch', bogen(0.36, 0.72), 0.06, s['dunkel'], ort=(0, -0.03, 0.14), eltern=r)
        quader('fensterkreuz', (0.03, 0.02, 0.7), s['haustein'], ort=(0, -0.062, 0.49), fase=0, eltern=r)


def _feuerschale(s, x, y):
    drehkoerper('feuerschale', [(0, 0), (0, 0.11), (0.03, 0.06), (0.3, 0.04), (0.36, 0.13), (0.41, 0.15), (0.41, 0.12),
                                (0.37, 0.1), (0.37, 0)], s['eisen'], ort=(x, y, 0.03), teile=14)
    # Aussen rote Glut, darin die gelbe Flamme - mit kleiner Staerke, sonst steht beides gelb-weiss im Bild.
    kugel('feuer', 0.1, s['schalenglut'], ort=(x, y, 0.45), streckung=(1, 1, 0.7), teile=10, ringe=6)
    kugel('flamme', 0.06, s['schalenflamme'], ort=(x + 0.01, y, 0.55), streckung=(1, 1, 1.9), teile=8, ringe=6)


def bauen():
    s = stoffe()
    s['gold'] = _gold()
    s['schalenglut'] = glut('schalenglut', '#ff4a0c', 1.4)
    s['schalenflamme'] = glut('schalenflamme', '#ffcf4a', 1.5)
    zufall = random.Random(151)
    bodenfleck('platz', (0.0, 0.0), 4.92, 4.92, s['pflaster'], zufall, hoch=0.03, rund=0.12, zacken=0.012)

    # Der Sockel: drei Stufen ringsum.
    for i, breit in enumerate((4.5, 4.12, 3.74)):
        quader('stufe', (breit, breit, 0.12), s['hellstein'], ort=(0, 0, 0.03 + 0.06 + 0.11 * i), fase=0.012)
    z0 = SOCKEL

    # Die Halle.
    halb = HALLE / 2
    quader('halle', (HALLE, HALLE, HALLENHOCH), s['hellstein'], ort=(0, 0, z0 + HALLENHOCH / 2), fase=0.01)
    quader('hallenfuss', (HALLE + 0.1, HALLE + 0.1, 0.12), s['haustein'], ort=(0, 0, z0 + 0.06), fase=0.02)
    _wand(s, rahmen((0, -halb, z0), VORN), portal=False)
    _wand(s, rahmen((halb, 0, z0), RECHTS), portal=True)
    dach = z0 + HALLENHOCH
    quader('gesims', (HALLE + 0.2, HALLE + 0.2, 0.1), s['haustein'], ort=(0, 0, dach + 0.03), fase=0.02)
    dach += 0.08
    zinnen((0, 0), HALLE + 0.2, HALLE + 0.2, dach, s['hellstein'], hoch=0.07, tief=0.07, zahn=0.09, brust=0.09)
    # Vier lange Banner neben Portal und Hochfenster.
    for x in (-0.5, 0.5):
        banner((x * 1.04 + 0.0, -halb - 0.06, z0 + 0.93), s, breit=0.3, lang=0.7, richtung=(1, 0, 0))
        banner((halb + 0.06, x * 1.04, z0 + 0.93), s, breit=0.3, lang=0.7, richtung=(0, 1, 0))

    # Die vier Ecktuerme: schlank, mit goldenem Helm.
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * halb, sy * halb
            drehkoerper('eckturm', [(0, 0), (0, 0.33), (0.2, 0.29), (ECKTURM - z0, 0.29), (ECKTURM - z0, 0)],
                        s['hellstein'], ort=(x, y, z0), teile=20)
            drehkoerper('turmkranz', [(0, 0.29), (0.05, 0.35), (0.11, 0.35), (0.11, 0)], s['haustein'],
                        ort=(x, y, ECKTURM - 0.06), teile=20)
            drehkoerper('turmhelm', [(0, 0.33), (0.1, 0.3), (0.42, 0.1), (0.62, 0.03), (0.66, 0.05), (0.7, 0.0)], s['gold'],
                        ort=(x, y, ECKTURM + 0.05), teile=16)
            if sx > 0 or sy < 0:
                for hoch in (z0 + 0.5, z0 + 1.2):
                    quader('scharte', (0.045, 0.045, 0.22), s['dunkel'], ort=(x + 0.2, y - 0.2, hoch),
                           drehung=(0, 0, math.pi / 4), fase=0)

    # Der Saeulenkranz: eine runde Mauer mit Bogenfenstern, davor sechzehn Saeulen.
    drehkoerper('kranzfuss', [(0, 0), (0, KRANZ + 0.12), (0.1, KRANZ + 0.12), (0.1, 0)], s['haustein'], ort=(0, 0, dach),
                teile=32)
    k0 = dach + 0.1
    drehkoerper('kranzmauer', [(0, 0), (0, KRANZ - 0.16), (KRANZHOCH, KRANZ - 0.16), (KRANZHOCH, 0)], s['hellstein'],
                ort=(0, 0, k0), teile=32)
    for i in range(16):
        w = 2 * math.pi * i / 16
        drehkoerper('saeule', [(0, 0), (0, 0.075), (0.05, 0.075), (0.08, 0.052), (KRANZHOCH - 0.24, 0.046),
                               (KRANZHOCH - 0.2, 0.075), (KRANZHOCH - 0.14, 0.075), (KRANZHOCH - 0.14, 0)], s['hellstein'],
                    ort=(math.cos(w) * KRANZ, math.sin(w) * KRANZ, k0), teile=10)
        mitte = w + math.pi / 16
        # Nur was zur Kamera schaut, bekommt ein Fenster.
        if math.cos(mitte + math.pi / 4) > -0.2:
            r = rahmen((math.cos(mitte) * (KRANZ - 0.165), math.sin(mitte) * (KRANZ - 0.165), k0), mitte + math.pi / 2)
            bogenfenster(r, 0, 0.14, s, breite=0.15, hoehe=0.5, rand='haustein')
    drehkoerper('gebaelk', [(0, 0), (0, KRANZ + 0.09), (0.05, KRANZ + 0.09), (0.09, KRANZ + 0.14), (0.16, KRANZ + 0.14),
                            (0.16, 0)], s['haustein'], ort=(0, 0, k0 + KRANZHOCH - 0.14), teile=32)
    k1 = k0 + KRANZHOCH + 0.02

    # Die Trommel mit der Kuppel.
    drehkoerper('trommel', [(0, 0), (0, TROMMEL + 0.08), (0.08, TROMMEL), (TROMMELHOCH, TROMMEL), (TROMMELHOCH, 0)],
                s['hellstein'], ort=(0, 0, k1), teile=28)
    for i in range(12):
        w = 2 * math.pi * (i + 0.5) / 12
        if math.cos(w + math.pi / 4) > -0.2:
            r = rahmen((math.cos(w) * (TROMMEL - 0.005), math.sin(w) * (TROMMEL - 0.005), k1), w + math.pi / 2)
            schlitz(r, 0, 0.28, s, hoehe=0.26, breite=0.07)
    k2 = k1 + TROMMELHOCH
    drehkoerper('kuppelkranz', [(0, TROMMEL), (0.04, TROMMEL + 0.08), (0.1, TROMMEL + 0.08), (0.1, 0)], s['haustein'],
                ort=(0, 0, k2 - 0.06), teile=28)
    k2 += 0.04
    kugel('kuppel', TROMMEL + 0.03, s['gold'], ort=(0, 0, k2), streckung=(1, 1, 1.12), teile=28, ringe=16,
          weglassen=lambda x, y, z: z < -0.05)
    scheitel = k2 + (TROMMEL + 0.03) * 1.12
    # Acht Rippen laufen ueber die Kuppel zur Laterne.
    for i in range(8):
        w = 2 * math.pi * i / 8
        for j in range(8):
            a, b = math.pi / 2 * j / 8.6, math.pi / 2 * (j + 1) / 8.6
            ra, rb = (TROMMEL + 0.045) * math.cos(a), (TROMMEL + 0.045) * math.cos(b)
            za, zb = (TROMMEL + 0.045) * 1.12 * math.sin(a), (TROMMEL + 0.045) * 1.12 * math.sin(b)
            lang = math.hypot(rb - ra, zb - za)
            quader('rippe', (lang + 0.01, 0.04, 0.025), s['gold'],
                   ort=(math.cos(w) * (ra + rb) / 2, math.sin(w) * (ra + rb) / 2, k2 + (za + zb) / 2),
                   drehung=(0, -math.atan2(zb - za, rb - ra), w), fase=0.004)
    drehkoerper('laterne', [(0, 0), (0, 0.17), (0.04, 0.13), (0.26, 0.13), (0.3, 0.17), (0.33, 0.17), (0.33, 0)],
                s['hellstein'], ort=(0, 0, scheitel - 0.05), teile=14)
    for i in range(6):
        w = 2 * math.pi * i / 6 - math.pi / 4
        quader('laternenfenster', (0.03, 0.05, 0.16), s['dunkel'], ort=(math.cos(w) * 0.125, math.sin(w) * 0.125, scheitel + 0.1),
               drehung=(0, 0, w), fase=0)
    drehkoerper('spitze', [(0, 0.19), (0.08, 0.16), (0.3, 0.05), (0.42, 0.025), (0.46, 0.06), (0.52, 0.06), (0.56, 0.0)],
                s['gold'], ort=(0, 0, scheitel + 0.28), teile=14)
    fahne((0, 0, scheitel + 0.8), 0.62, s, lang=0.66, hoch=0.4, mast=0.028)

    # Feuerschalen vor dem Portal und vor dem Hochfenster.
    for d in (-0.62, 0.62):
        _feuerschale(s, 2.36, d)
        _feuerschale(s, d, -2.36)


def tafel(ziel):
    return einzeltafel('wunder', FELDER, 5.6, ziel, bauen)
