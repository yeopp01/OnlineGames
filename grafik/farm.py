# Die Farm: ein bestelltes Feld, drei mal drei Felder, flach und begehbar.
#
# Furchen in dunkler Erde, darauf Getreide, das mit der Nahrung weniger wird -
# vier Stufen als Zeilen, wie bei den Vorraeten: Zeile 0 ist das volle Feld,
# die letzte das abgeerntete. Geerntet wird von vorn nach hinten, damit das,
# was hoch ist, hinten steht: wer auf dem Feld arbeitet, steht davor.
# Deshalb stehen auch der Zaun und die Vogelscheuche an den hinteren Kanten.
# Das Hemd der Vogelscheuche traegt die Spielerfarbe.

import random

from bauteile import balken, bodenfleck, halme, reihentafel, rundholz, stoffe, zaun
from formen import drehkoerper, kugel, quader

FELDER = 3
STUFEN = 4
ACKER = 2.78
FURCHEN = 12


def bauen(stufe=0):
    """stufe 0: volles Feld - bis 3: abgeerntet."""
    s = stoffe()
    zufall = random.Random(41)
    halb = ACKER / 2
    bodenfleck('acker', (0, 0), ACKER + 0.06, ACKER + 0.06, s['erde'], zufall, hoch=0.025, rund=0.12, zacken=0.012)
    stehend = round(FURCHEN * (STUFEN - 1 - stufe) / (STUFEN - 1))
    reihen, stoppeln = [], []
    for i in range(FURCHEN):
        y = -halb + 0.14 + i * (ACKER - 0.28) / (FURCHEN - 1)
        quader('furche', (ACKER - 0.2, 0.13, 0.05), s['erde'], ort=(zufall.uniform(-0.02, 0.02), y, 0.03), fase=0.02)
        # Hinten (grosses y) steht das Korn am laengsten.
        (reihen if i >= FURCHEN - stehend else stoppeln).append((-halb + 0.14, halb - 0.14, y))
    halme('korn', zufall, reihen, s, hoch=0.3)
    halme('stoppeln', zufall, stoppeln, s, hoch=0.045, dicht=0.05, farben=('#8a7440', '#9c8448'), breit=0.025)
    # Was schon geschnitten ist, steht in Garben auf den Stoppeln.
    if stoppeln and stufe < STUFEN - 1:
        for i in range(min(4, len(stoppeln) // 2)):
            x = -halb + 0.5 + i * 0.62 + zufall.uniform(-0.08, 0.08)
            y = stoppeln[-1][2] - zufall.uniform(0.05, 0.3)
            drehkoerper('garbe', [(0, 0), (0, 0.075), (0.13, 0.045), (0.26, 0.085), (0.27, 0)], s['heu'], ort=(x, y, 0.04),
                        teile=10)
            drehkoerper('garbenband', [(0.115, 0.047), (0.115, 0.054), (0.145, 0.054), (0.145, 0.047)], s['seil'],
                        ort=(x, y, 0.04), teile=10)

    # Der Zaun an den beiden hinteren Kanten.
    zaun([(-halb - 0.02, -halb), (-halb - 0.02, halb + 0.02), (halb, halb + 0.02)], s, hoch=0.26, abstand=0.5)

    # Die Vogelscheuche in der hinteren Ecke.
    x, y = -halb + 0.3, halb - 0.28
    rundholz('scheuchenpfahl', (x, y, 0), (x, y, 0.8), 0.022, s['hellholz'], teile=6)
    balken('scheuchenarme', (x - 0.24, y - 0.24, 0.6), (x + 0.24, y + 0.24, 0.6), 0.03, s['hellholz'])
    # Das Hemd: ein Kittel, quer zur Kamera, mit zwei Aermeln.
    quader('hemd', (0.2, 0.2, 0.3), s['tuch'], ort=(x, y, 0.52), drehung=(0, 0, 0.785), fase=0.03)
    balken('aermel', (x - 0.2, y - 0.2, 0.6), (x + 0.2, y + 0.2, 0.6), 0.075, s['tuch'], fase=0.02)
    kugel('scheuchenkopf', 0.075, s['leinen'], ort=(x, y, 0.77), teile=10, ringe=8)
    drehkoerper('strohhut', [(0, 0.15), (0.012, 0.15), (0.03, 0.07), (0.09, 0.02), (0.1, 0)], s['heu'], ort=(x, y, 0.81),
                teile=12)


def tafel(ziel):
    zellen = [(stufe, 0, {'stufe': stufe}, {}) for stufe in range(STUFEN)]
    return reihentafel('farm', FELDER, 1.0, ziel, bauen, zellen, schatten=1.2, stufen=STUFEN, flach=True)
