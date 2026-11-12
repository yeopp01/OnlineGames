# Die Baustelle: was auf dem Bauplatz steht, solange ein Gebaeude waechst -
# je Grundflaeche (1, 2, 3 und 4 Felder im Quadrat) eine Tafel mit vier
# Spalten, von abgesteckt bis fast fertig.
#
#   Spalte 0  abgesteckt: Pfloecke und Schnur, das Fundament hinten begonnen,
#             Bretter und Steine liegen bereit
#   Spalte 1  das Fundament steht ringsum, die Staender bis zur halben Hoehe,
#             davor das erste Geruest
#   Spalte 2  das Gebaelk steht, die Waende sind halb verbrettert
#   Spalte 3  die Waende fast zu, darueber die offenen Sparren
#
# Die Tafeln heissen baustelle-1 bis baustelle-4; die vier Skripte dieses
# Namens rufen nur tafel_fuer() hier. Der Wimpel an der vorderen Ecke traegt in
# jeder Spalte die Farbe des Besitzers.

import random

from bauteile import balken, bodenfleck, leiter, reihentafel, rundholz, stoffe, wimpel
from formen import kugel, quader

STUFEN = 4
# Wie hoch die Waende der fertigen Baustelle stehen, je Grundflaeche.
HOCH = {1: 0.8, 2: 0.85, 3: 1.05, 4: 1.25}
SOCKEL = 0.11


def _wandachse(felder):
    """Halbe Seitenlaenge der Waende - innen genug Platz fuer das Geruest."""
    return felder / 2 - (0.2 if felder == 1 else 0.32)


def _fundament(s, halb, ganz):
    """Ein Sockel aus Feldstein; `ganz` False: erst die zwei hinteren Seiten."""
    breit = 0.13
    quader('fundament', (2 * halb + breit, breit, SOCKEL), s['stein'], ort=(0, halb, SOCKEL / 2), fase=0.015)
    quader('fundament', (breit, 2 * halb - breit, SOCKEL), s['stein'], ort=(-halb, 0, SOCKEL / 2), fase=0.015)
    if ganz:
        quader('fundament', (2 * halb + breit, breit, SOCKEL), s['stein'], ort=(0, -halb, SOCKEL / 2), fase=0.015)
        quader('fundament', (breit, 2 * halb - breit, SOCKEL), s['stein'], ort=(halb, 0, SOCKEL / 2), fase=0.015)


def _abstecken(s, halb):
    """Vier Pfloecke, um die vorderen zwei Seiten eine Schnur."""
    aussen = halb + 0.06
    ecken = [(-aussen, -aussen), (aussen, -aussen), (aussen, aussen), (-aussen, aussen)]
    for x, y in ecken:
        rundholz('pflock', (x, y, 0), (x, y, 0.2), 0.02, s['hellholz'], teile=6, spitz=0.8)
    for (x0, y0), (x1, y1) in zip(ecken, ecken[1:3]):
        rundholz('schnur', (x0, y0, 0.16), (x1, y1, 0.16), 0.006, s['seil'], teile=4)


def _vorrat(s, felder, voll):
    """Bretter und Steine in der Mitte des Platzes - voll: der ganze Stapel."""
    zufall = random.Random(310 + felder)
    lang = min(1.0, 0.42 * felder + 0.1)
    lagen = (3 if felder > 1 else 2) if voll else 1
    je = 4 if felder > 1 else 2
    mx, my = (0.0, 0.05) if felder == 1 else (-0.12 * felder, 0.1 * felder)
    for lage in range(lagen):
        for i in range(je):
            quader('brett', (lang, 0.1, 0.03), s['hellholz'],
                   ort=(mx + zufall.uniform(-0.02, 0.02), my + (i - (je - 1) / 2) * 0.11, 0.035 + lage * 0.032),
                   drehung=(0, 0, zufall.uniform(-0.04, 0.04)), fase=0.004)
    if felder == 1:
        return
    steine = 9 if voll else 4
    sx, sy = 0.16 * felder, -0.12 * felder
    for i in range(steine):
        r = zufall.uniform(0.045, 0.075)
        kugel('stein', r, s['stein'],
              ort=(sx + zufall.uniform(-0.16, 0.16), sy + zufall.uniform(-0.13, 0.13), r * 0.55 + (0.06 if i > 5 else 0)),
              streckung=(1.2, 1.0, 0.7), teile=8, ringe=6)


def _punkte(halb):
    """Wo an einer Seite ein Staender steht: an den Enden und dazwischen
    etwa alle 0,8 Felder."""
    zahl = max(1, round(2 * halb / 0.8))
    return [-halb + 2 * halb * i / zahl for i in range(zahl + 1)]


def _gebaelk(s, halb, hoch, anteil, raehm):
    """Die Staender auf dem Fundament - `anteil` ihrer Hoehe -, mit `raehm`
    die Balken obenauf und der Riegel auf halber Hoehe."""
    punkte = _punkte(halb)
    orte = {(x, y) for x in punkte for y in (-halb, halb)} | {(x, y) for y in punkte for x in (-halb, halb)}
    for x, y in sorted(orte):
        quader('staender', (0.08, 0.08, hoch * anteil), s['balken'], ort=(x, y, SOCKEL + hoch * anteil / 2))
    if not raehm:
        return
    for z, dicke in ((SOCKEL + hoch + 0.035, 0.07), (SOCKEL + hoch * 0.5, 0.05)):
        for seite in (-1, 1):
            balken('riegel', (-halb - 0.04, seite * halb, z), (halb + 0.04, seite * halb, z), dicke, s['balken'])
            balken('riegel', (seite * halb, -halb + 0.04, z), (seite * halb, halb - 0.04, z), dicke, s['balken'])


def _bretterwand(s, felder, halb, bis):
    """Stehende Bretter an allen vier Seiten, bis zur Hoehe `bis` - oben
    ungleich, wie eine Wand, an der noch gearbeitet wird."""
    zufall = random.Random(330 + felder)
    zahl = max(3, round(2 * halb / 0.115))
    breit = 2 * halb / zahl
    for seite in (-1, 1):
        for laengs_x in (True, False):
            for i in range(zahl):
                d = -halb + (i + 0.5) * breit
                h = bis * (0.72 + 0.28 * zufall.random())
                if laengs_x:
                    quader('wandbrett', (breit - 0.012, 0.026, h), s['hellholz'], ort=(d, seite * halb, SOCKEL + h / 2),
                           fase=0.004)
                else:
                    quader('wandbrett', (0.026, breit - 0.012, h), s['hellholz'], ort=(seite * halb, d, SOCKEL + h / 2),
                           fase=0.004)


def _sparren(s, halb, hoch):
    """Die offenen Sparren ueber dem Raehm, darauf die Firstpfette."""
    traufe = SOCKEL + hoch + 0.07
    first = traufe + 0.2 + 0.32 * halb
    for x in _punkte(halb):
        for seite in (-1, 1):
            balken('sparren', (x, seite * (halb + 0.07), traufe - 0.02), (x, 0, first), 0.055, s['hellholz'])
    balken('firstpfette', (-halb - 0.06, 0, first + 0.02), (halb + 0.06, 0, first + 0.02), 0.06, s['hellholz'])


def _geruest(s, felder, halb, stangen, lauf):
    """Das Geruest vor den zwei Seiten, die man sieht: Stangen, ein Laufbrett
    auf Querhoelzern, Streben - und an der linken Seite die Leiter."""
    ab = halb + 0.15
    punkte = _punkte(halb)
    # Vorn links (-Y): die Stangen stehen laengs X.
    for i, x in enumerate(punkte[:-1] if felder > 1 else punkte):
        rundholz('stange', (x, -ab, 0), (x, -ab, stangen), 0.02, s['hellholz'], teile=6)
        balken('querholz', (x, -ab - 0.03, lauf - 0.03), (x, -halb, lauf - 0.03), 0.035, s['hellholz'])
    quader('laufbrett', (2 * halb + 0.1, 0.13, 0.025), s['bohle'], ort=(0, -halb - 0.085, lauf), fase=0.004)
    for a, b in zip(punkte, punkte[1:]):
        balken('strebe', (a, -ab, 0.06), (b if felder > 1 else a + (b - a) * 0.95, -ab, lauf - 0.06), 0.025,
               s['hellholz'], fase=0.003)
    # Vorn rechts (+X): laengs Y.
    for y in punkte[1:]:
        rundholz('stange', (ab, y, 0), (ab, y, stangen), 0.02, s['hellholz'], teile=6)
        balken('querholz', (ab + 0.03, y, lauf - 0.03), (halb, y, lauf - 0.03), 0.035, s['hellholz'])
    quader('laufbrett', (0.13, 2 * halb + 0.1, 0.025), s['brett'], ort=(halb + 0.085, 0, lauf), fase=0.004)
    for a, b in zip(punkte, punkte[1:]):
        balken('strebe', (ab, b, 0.06), (ab, a, lauf - 0.06), 0.025, s['hellholz'], fase=0.003)
    if felder > 1:
        x = punkte[0] + 0.3
        leiter((x, -ab - 0.2, 0.0), (x, -ab - 0.03, lauf + 0.16), s, breit=0.17, sprossen=max(4, round(lauf / 0.1)))


def bauen(felder=2, stufe=2):
    s = stoffe()
    halb = _wandachse(felder)
    hoch = HOCH[felder]
    bodenfleck('bauplatz', (0.0, 0.0), felder - 0.04, felder - 0.04, s['erde'], random.Random(300 + felder), rund=0.3)
    _fundament(s, halb, ganz=stufe > 0)
    ecke = halb + 0.15
    # Der Wimpel waechst mit dem Bauplatz - auf vier mal vier Feldern saehe man
    # einen kleinen nicht mehr.
    tuch = (0.14 + 0.1 * felder, 0.08 + 0.05 * felder)
    if stufe == 0:
        _abstecken(s, halb)
        _vorrat(s, felder, voll=True)
        wimpel((ecke, -ecke, 0), 0.5, s, lang=tuch[0], hoch=tuch[1])
        return
    stangen = hoch * (0.55, 0.85, 1.0)[stufe - 1] + 0.32
    lauf = SOCKEL + hoch * (0.3, 0.5, 0.74)[stufe - 1]
    _gebaelk(s, halb, hoch, anteil=0.45 if stufe == 1 else 1.0, raehm=stufe > 1)
    if stufe == 1:
        _vorrat(s, felder, voll=False)
    else:
        _bretterwand(s, felder, halb, hoch * (0.5 if stufe == 2 else 0.9))
    if stufe == 3:
        _sparren(s, halb, hoch)
    _geruest(s, felder, halb, stangen, lauf)
    # Die Eckstange vorn traegt den Wimpel.
    wimpel((ecke, -ecke, 0), stangen + 0.1 + tuch[1], s, lang=tuch[0], hoch=tuch[1], mast=0.02)


def tafel_fuer(felder, ziel):
    zellen = [(0, stufe, {'felder': felder, 'stufe': stufe}, {}) for stufe in range(STUFEN)]
    return reihentafel(f'baustelle-{felder}', felder, HOCH[felder] + 1.0, ziel, bauen, zellen, stufen=STUFEN)
