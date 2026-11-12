# Der Stall: eine Bretterscheune mit weitem Tor, daneben die Koppel -
# drei mal drei Felder.
#
# Der Giebel mit dem offenen Tor schaut nach vorn, das Schindeldach ist steil.
# Rechts die Koppel: der Zaun ist das Merkmal, dazu Heu und der Trog. Ueber
# dem Zaun haengt eine Pferdedecke in der Farbe des Besitzers.

import math
import random

from bauteile import (VORN, balken, banner, bodenfleck, einzeltafel, giebel, heuhaufen, rahmen, satteldach, stoffe,
                      tuer, wimpel, zaun)
from formen import netz, quader
from stoffe import einfarbig

FELDER = 3
MITTE = (-0.52, 0.3)      # die Scheune
BREIT = 1.62              # laengs X, quer zum First
LANG = 2.0                # laengs Y, der First
TRAUFE = 0.98
FIRST = 0.82


def _decke(s, x, y, hoch, lang=0.4):
    """Eine Decke ueber dem Zaun, der laengs Y laeuft: haengt auf beiden
    Seiten herab."""
    ecken = [(x - 0.03, y - lang / 2, hoch - 0.3), (x - 0.03, y + lang / 2, hoch - 0.3),
             (x - 0.02, y - lang / 2, hoch + 0.02), (x - 0.02, y + lang / 2, hoch + 0.02),
             (x + 0.02, y - lang / 2, hoch + 0.02), (x + 0.02, y + lang / 2, hoch + 0.02),
             (x + 0.035, y - lang / 2, hoch - 0.26), (x + 0.035, y + lang / 2, hoch - 0.26)]
    netz('decke', ecken, [(0, 1, 3, 2), (2, 3, 5, 4), (4, 5, 7, 6)], s['tuch'], dicke=0.012)


def bauen():
    s = stoffe()
    zufall = random.Random(57)
    wasser = einfarbig('wasser', '#2c3a40', rau=0.15)
    mx, my = MITTE
    vorn = my - LANG / 2
    rechts = mx + BREIT / 2
    bodenfleck('hof', (0.0, 0.0), 2.86, 2.86, s['erde'], zufall, rund=0.22)

    # Die Scheune: Schwelle aus Stein, Bretterwaende, Balken an den Ecken.
    quader('schwelle', (BREIT + 0.08, LANG + 0.08, 0.12), s['stein'], ort=(mx, my, 0.06), fase=0.03)
    quader('wand', (BREIT, LANG, TRAUFE), s['brett'], ort=(mx, my, TRAUFE / 2), fase=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            quader('eckpfosten', (0.1, 0.1, TRAUFE), s['balken'],
                   ort=(mx + sx * (BREIT / 2 - 0.03), my + sy * (LANG / 2 - 0.03), TRAUFE / 2))
    for i in range(1, 4):
        y = my - LANG / 2 + i * LANG / 4
        quader('staender', (0.05, 0.08, TRAUFE), s['balken'], ort=(rechts + 0.01, y, TRAUFE / 2))
    for hoch in (0.08, 0.52, TRAUFE - 0.04):
        quader('riegel', (0.05, LANG, 0.07), s['balken'], ort=(rechts + 0.012, my, hoch))
    quader('raehm', (BREIT + 0.06, 0.08, 0.08), s['balken'], ort=(mx, vorn - 0.01, TRAUFE - 0.04))
    # Eine halbe Tuer zur Koppel hin, oben offen.
    quader('klappe', (0.03, 0.34, 0.4), s['dunkel'], ort=(rechts + 0.006, my + 0.45, 0.72), fase=0)
    quader('klappentuer', (0.035, 0.34, 0.5), s['bohle'], ort=(rechts + 0.02, my + 0.45, 0.27), fase=0.006)

    satteldach(MITTE, LANG, BREIT, TRAUFE, FIRST, s['schindel'], achse='y', ueber=0.14, ortgang=0.12, lagen=9,
               firststoff=s['schindel'], zufall=zufall)
    g = rahmen((mx, vorn, TRAUFE), VORN)
    giebel(g, BREIT - 0.04, FIRST - 0.03, s, stoff='brett', fachwerk=False)
    for seite in (-1, 1):
        balken('ortbalken', (seite * (BREIT / 2 - 0.02), -0.03, 0.0), (0, -0.03, FIRST - 0.05), 0.07, s['balken'], eltern=g)
    # Die Luke zum Heuboden, darueber der Balken fuer den Flaschenzug.
    quader('luke', (0.3, 0.03, 0.3), s['dunkel'], ort=(0, -0.02, 0.22), fase=0, eltern=g)
    quader('heu', (0.26, 0.08, 0.12), s['heu'], ort=(0, -0.03, 0.13), fase=0.03, eltern=g)
    quader('kranbalken', (0.07, 0.34, 0.07), s['balken'], ort=(0, -0.15, 0.5), eltern=g)

    # Das Tor: weit, offen, beide Fluegel nach aussen geschlagen.
    v = rahmen((mx, vorn, 0.12), VORN)
    weit, hoch = 0.84, 0.8
    tuer(v, 0, s, breite=weit, hoehe=hoch, offen=True)
    for seite, winkel in ((-1, math.radians(108)), (1, math.radians(72))):
        c, si = math.cos(winkel), -math.sin(winkel)
        ax = seite * (weit / 2 + 0.02)
        quader('torfluegel', (weit / 2, 0.035, hoch - 0.02), s['bohle'],
               ort=(ax + c * weit / 4, -0.03 + si * weit / 4, hoch / 2), drehung=(0, 0, math.atan2(si, c)), fase=0.006,
               eltern=v)
        for anteil in (0.22, 0.78):
            quader('torband', (weit / 2, 0.045, 0.04), s['eisen'],
                   ort=(ax + c * weit / 4, -0.03 + si * weit / 4, hoch * anteil), drehung=(0, 0, math.atan2(si, c)),
                   fase=0.004, eltern=v)
    banner((mx - 0.6, vorn - 0.04, TRAUFE - 0.14), s, breit=0.24, lang=0.4, richtung=(1, 0, 0))
    wimpel((mx, vorn - 0.1, TRAUFE + FIRST), 0.42, s)

    # Die Koppel rechts: Zaun rundum, eine Luecke am Tor der Scheune.
    kx0, kx1, ky0, ky1 = rechts + 0.14, 1.36, -1.36, 1.3
    zaun([(kx0, ky1), (kx1, ky1), (kx1, ky0), (kx0, ky0), (kx0, vorn - 0.2)], s, hoch=0.36, latten=3, abstand=0.44)
    _decke(s, kx1, -0.35, 0.37)
    heuhaufen(((kx0 + kx1) / 2 + 0.05, 0.75, 0.0), s, r=0.3, hoch=0.95)
    heuhaufen((kx0 + 0.22, 0.42, 0.0), s, r=0.18, hoch=0.8)
    # Der Trog: ein ausgehoehlter Stamm voll Wasser.
    tx, ty = (kx0 + kx1) / 2, -0.95
    quader('trog', (0.66, 0.24, 0.17), s['bohle'], ort=(tx, ty, 0.14), fase=0.02)
    quader('trogwasser', (0.58, 0.16, 0.02), wasser, ort=(tx, ty, 0.222), fase=0)
    for dx in (-0.24, 0.24):
        quader('trogfuss', (0.07, 0.28, 0.08), s['balken'], ort=(tx + dx, ty, 0.04))
    # Eine Heugabel am Zaun, ein Eimer.
    balken('gabel', (kx0 + 0.08, -0.25, 0.0), (kx0 + 0.02, -0.2, 0.75), 0.022, s['hellholz'])
    for d in (-0.035, 0.0, 0.035):
        balken('zinke', (kx0 + 0.02 + d, -0.2, 0.74), (kx0 + 0.015 + d, -0.19, 0.92), 0.012, s['eisen'])
    quader('eimer', (0.13, 0.13, 0.14), s['brett'], ort=(mx + 0.62, vorn - 0.4, 0.07), fase=0.02)


def tafel(ziel):
    return einzeltafel('stall', FELDER, 2.4, ziel, bauen)
