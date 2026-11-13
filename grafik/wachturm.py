# Der Wachturm: ein gemauerter Turm auf einem Feld, oben ein vorkragender
# Wehrgang mit Zinnen.
#
# Haustein von unten bis oben, Scharten, eine kleine Tuer; das lange Banner an
# der rechten Wand und die Fahne tragen die Farbe des Besitzers. Vom
# Aussenposten unterscheidet ihn, dass man nicht durch ihn hindurchsieht.

import random

from bauteile import RECHTS, VORN, banner, bodenfleck, einzeltafel, fahne, rahmen, schlitz, stoffe, stumpf, tuer, zinnen
from formen import quader

FELDER = 1
BREIT = 0.74
SCHAFT = 1.85             # bis unter den Wehrgang
GANG = 0.96


def bauen():
    s = stoffe()
    zufall = random.Random(91)
    bodenfleck('fleck', (0.0, 0.0), 0.98, 0.98, s['erde'], zufall, rund=0.4)
    stumpf('turmfuss', (0, 0), (BREIT + 0.14, BREIT + 0.14), (BREIT, BREIT), 0.0, 0.34, s['haustein'])
    quader('turm', (BREIT, BREIT, SCHAFT), s['haustein'], ort=(0, 0, SCHAFT / 2), fase=0.012)
    v = rahmen((0, -BREIT / 2, 0), VORN)
    r = rahmen((BREIT / 2, 0, 0), RECHTS)
    tuer(rahmen((0, -BREIT / 2 - 0.045, 0), VORN), 0, s, breite=0.24, hoehe=0.56, sturz=False)
    quader('tuersturz', (0.36, 0.06, 0.07), s['hellstein'], ort=(0, -0.05, 0.6), eltern=v, fase=0.01)
    schlitz(v, 0, 1.2, s, hoehe=0.26)
    schlitz(r, 0, 0.75, s, hoehe=0.26)

    # Kragsteine tragen den Wehrgang, der ueber den Schaft hinausragt.
    for i in range(4):
        d = -BREIT / 2 + 0.08 + i * (BREIT - 0.16) / 3
        for seite in (-1, 1):
            quader('kragstein', (0.08, 0.12, 0.14), s['haustein'], ort=(d, seite * (BREIT / 2 + 0.03), SCHAFT - 0.06),
                   fase=0.01)
            quader('kragstein', (0.12, 0.08, 0.14), s['haustein'], ort=(seite * (BREIT / 2 + 0.03), d, SCHAFT - 0.06),
                   fase=0.01)
    quader('wehrgang', (GANG, GANG, 0.13), s['haustein'], ort=(0, 0, SCHAFT + 0.065), fase=0.012)
    krone = SCHAFT + 0.13
    zinnen((0, 0), GANG, GANG, krone, s['haustein'], hoch=0.16, tief=0.09, zahn=0.18, brust=0.07)
    quader('boden', (GANG - 0.16, GANG - 0.16, 0.02), s['bohle'], ort=(0, 0, krone + 0.01), fase=0)

    fahne((0, 0, krone), 0.8, s, lang=0.46, hoch=0.28)
    # 0,46 lang statt 0,6: mit dem langen Banner trug der Turm die Spielerfarbe
    # auf genau einem Zehntel seiner Flaeche (darstellung AC-4: darunter).
    banner((BREIT / 2 + 0.04, 0, SCHAFT - 0.22), s, breit=0.3, lang=0.46, richtung=(0, 1, 0))


def tafel(ziel):
    return einzeltafel('wachturm', FELDER, 3.1, ziel, bauen)
