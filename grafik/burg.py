# Die Burg: eine Ringmauer mit vier runden Ecktuermen, darin der hohe
# Bergfried - vier mal vier Felder.
#
# Alles aus Haustein, alles mit Zinnen; das Tor sitzt in einem Torhaus vorn
# rechts. Der Bergfried ueberragt jedes andere Gebaeude, an ihm haengen die
# langen Banner, auf ihm weht die Fahne.

import math
import random

from bauteile import (RECHTS, VORN, banner, bodenfleck, bogen, bogenfenster, einzeltafel, fahne, fass, kegeldach, rahmen,
                      rundzinnen, schlitz, stoffe, zinnen)
from formen import drehkoerper, prisma, quader

FELDER = 4
ECKE = 1.5                # Mitte der Ecktuerme
MAUER = 1.05
STARK = 0.3
ECKTURM = 1.6
FRIED = (-0.22, 0.22)     # Mitte des Bergfrieds
FRIEDBREIT = 1.5
FRIEDHOCH = 2.55


def _zinnenreihe(s, von, bis, z, tief=0.09, zahn=0.17, hoch=0.16, brust=0.06):
    """Brustwehr und Zinnen auf einer Mauerkrone, von Punkt zu Punkt (laengs
    X oder laengs Y)."""
    (x0, y0), (x1, y1) = von, bis
    lang = math.hypot(x1 - x0, y1 - y0)
    laengs_x = abs(x1 - x0) > abs(y1 - y0)
    mitte = ((x0 + x1) / 2, (y0 + y1) / 2)
    quader('brustwehr', (lang, tief, brust) if laengs_x else (tief, lang, brust), s['haustein'],
           ort=(mitte[0], mitte[1], z + brust / 2), fase=0.01)
    zahl = max(2, round(lang / (2 * zahn)))
    for i in range(zahl):
        t = (i + 0.5) / zahl
        quader('zinne', (zahn, tief, hoch) if laengs_x else (tief, zahn, hoch), s['haustein'],
               ort=(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z + brust + hoch / 2), fase=0.012)


def bauen():
    s = stoffe()
    zufall = random.Random(97)
    bodenfleck('hof', (0.0, 0.0), 3.9, 3.9, s['erde'], zufall, rund=0.2)
    bodenfleck('pflaster', (0.0, 0.0), 2.9, 2.9, s['pflaster'], zufall, hoch=0.035, rund=0.1, zacken=0.01)

    # Die Ringmauer: vier Mauern zwischen den Tuermen, Zinnen an der Aussenkante.
    aussen = ECKE + STARK / 2
    for sy in (-1, 1):
        quader('mauer', (2 * ECKE, STARK, MAUER), s['haustein'], ort=(0, sy * ECKE, MAUER / 2), fase=0.008)
        _zinnenreihe(s, (-ECKE + 0.4, sy * (aussen - 0.045)), (ECKE - 0.4, sy * (aussen - 0.045)), MAUER)
    for sx in (-1, 1):
        quader('mauer', (STARK, 2 * ECKE, MAUER), s['haustein'], ort=(sx * ECKE, 0, MAUER / 2), fase=0.008)
        _zinnenreihe(s, (sx * (aussen - 0.045), -ECKE + 0.4), (sx * (aussen - 0.045), ECKE - 0.4), MAUER)
    v = rahmen((0, -aussen, 0), VORN)
    for x in (-0.9, -0.3, 0.3, 0.9):
        schlitz(v, x, 0.62, s, hoehe=0.26)

    # Die vier Ecktuerme: rund, unten etwas dicker, oben ein Zinnenkranz.
    for sx in (-1, 1):
        for sy in (-1, 1):
            ort = (sx * ECKE, sy * ECKE)
            drehkoerper('eckturm', [(0, 0), (0, 0.5), (0.3, 0.44), (ECKTURM, 0.44), (ECKTURM, 0)], s['haustein'],
                        ort=(ort[0], ort[1], 0), teile=24)
            drehkoerper('turmkragen', [(ECKTURM - 0.1, 0.44), (ECKTURM - 0.04, 0.49), (ECKTURM + 0.02, 0.49),
                                       (ECKTURM + 0.02, 0.0)], s['haustein'], ort=(ort[0], ort[1], 0), teile=24)
            rundzinnen(ort, 0.49, ECKTURM + 0.02, s['haustein'], zahl=9, hoch=0.15, tief=0.08, brust=0.06)
            if sx > 0 or sy < 0:
                quader('scharte', (0.05, 0.05, 0.24), s['dunkel'],
                       ort=(ort[0] + 0.3, ort[1] - 0.3, 1.05), drehung=(0, 0, math.pi / 4), fase=0)

    # Das Torhaus in der rechten Mauer: hoeher als sie, mit Rundbogen und Tor.
    quader('torhaus', (STARK + 0.34, 1.0, 1.42), s['haustein'], ort=(ECKE + 0.07, 0, 0.71), fase=0.01)
    tor = ECKE + 0.07 + (STARK + 0.34) / 2    # die Stirn des Torhauses
    zinnen((ECKE + 0.07, 0), STARK + 0.4, 1.06, 1.42, s['haustein'], hoch=0.15, tief=0.08, zahn=0.17, brust=0.06)
    r = rahmen((tor, 0, 0), RECHTS)
    prisma('torbogen', bogen(0.62, 0.92), 0.05, s['hellstein'], ort=(0, -0.015, 0), eltern=r)
    prisma('tor', bogen(0.48, 0.84), 0.05, s['bohle'], ort=(0, -0.03, 0), eltern=r)
    quader('torspalt', (0.014, 0.02, 0.8), s['dunkel'], ort=(0, -0.058, 0.4), fase=0, eltern=r)
    for hoch in (0.2, 0.52):
        quader('torband', (0.46, 0.02, 0.045), s['eisen'], ort=(0, -0.06, hoch), fase=0.004, eltern=r)
    banner((tor + 0.04, 0, 1.36), s, breit=0.3, lang=0.36, richtung=(0, 1, 0))

    # Der Bergfried: ein Kasten aus Stein, oben ein vorkragender Kranz.
    fx, fy = FRIED
    h = FRIEDBREIT / 2
    quader('friedsockel', (FRIEDBREIT + 0.12, FRIEDBREIT + 0.12, 0.3), s['haustein'], ort=(fx, fy, 0.15), fase=0.03)
    quader('bergfried', (FRIEDBREIT, FRIEDBREIT, FRIEDHOCH), s['haustein'], ort=(fx, fy, FRIEDHOCH / 2), fase=0.012)
    quader('friedkragen', (FRIEDBREIT + 0.14, FRIEDBREIT + 0.14, 0.14), s['haustein'], ort=(fx, fy, FRIEDHOCH - 0.02),
           fase=0.015)
    krone = FRIEDHOCH + 0.05
    zinnen(FRIED, FRIEDBREIT + 0.14, FRIEDBREIT + 0.14, krone, s['haustein'], hoch=0.17, tief=0.1, zahn=0.19, brust=0.07)
    quader('frieddach', (FRIEDBREIT - 0.1, FRIEDBREIT - 0.1, 0.02), s['bohle'], ort=(fx, fy, krone + 0.01), fase=0)
    fv = rahmen((fx, fy - h, 0), VORN)
    fr = rahmen((fx + h, fy, 0), RECHTS)
    for wand in (fv, fr):
        for x in (-0.38, 0.38):
            bogenfenster(wand, x, 1.85, s, breite=0.16, hoehe=0.36, rand='hellstein')
            schlitz(wand, x, 1.25, s, hoehe=0.26)
    banner((fx - 0.0, fy - h - 0.05, 2.1), s, breit=0.34, lang=0.85, richtung=(1, 0, 0))
    banner((fx + h + 0.05, fy, 2.1), s, breit=0.34, lang=0.85, richtung=(0, 1, 0))
    # Der Treppenturm an der hinteren Ecke, mit spitzem Schieferhelm.
    tx, ty = fx - h + 0.12, fy + h - 0.12
    drehkoerper('treppenturm', [(0, 0), (0, 0.3), (FRIEDHOCH + 0.62, 0.3), (FRIEDHOCH + 0.62, 0)], s['haustein'],
                ort=(tx, ty, 0), teile=18)
    kegeldach((tx, ty), 0.37, FRIEDHOCH + 0.6, 0.6, s['schiefer'], ecken=10, lagen=5, zufall=zufall, ziegel=0.08)
    quader('turmfenster', (0.05, 0.05, 0.2), s['dunkel'], ort=(tx + 0.2, ty - 0.2, FRIEDHOCH + 0.36),
           drehung=(0, 0, math.pi / 4), fase=0)
    fahne((fx + 0.2, fy - 0.2, krone), 1.0, s, lang=0.66, hoch=0.4, mast=0.026)

    # Im Hof, was eine Besatzung braucht.
    fass((1.0, -1.0, 0.035), s, r=0.12, h=0.34)
    fass((0.76, -1.08, 0.035), s, r=0.11, h=0.3)


def tafel(ziel):
    return einzeltafel('burg', FELDER, 4.3, ziel, bauen)
