# Der Wehrturm: was aus dem Wachturm wird, wenn die Universitaet ihn
# verstaerkt hat (bauen AC-38).
#
# Derselbe Platz, ein Feld - aber hoeher, auf einem geboeschten Fuss, mit einem
# hellen Gesims, zwei Reihen Scharten und einem Schieferhelm ueber dem
# Wehrgang. Den Wachturm erkennt man an der offenen Plattform, den Wehrturm am
# Dach: das sieht man auch klein und von weitem.

import random

from bauteile import RECHTS, VORN, banner, bodenfleck, einzeltafel, fahne, rahmen, schlitz, stoffe, stumpf, tuer, walmdach, zinnen
from formen import quader

FELDER = 1
BREIT = 0.8
SOCKEL = 0.6              # so hoch reicht die Boeschung
SCHAFT = 2.25             # bis unter den Wehrgang
GANG = 1.02
PFOSTEN = 0.4             # zwischen Wehrgang und Traufe


def bauen():
    s = stoffe()
    zufall = random.Random(131)
    bodenfleck('fleck', (0.0, 0.0), 0.98, 0.98, s['erde'], zufall, rund=0.4)
    # Der geboeschte Fuss: unten ein Stueck breiter, damit eine Ramme schlechter ansetzt.
    stumpf('turmfuss', (0, 0), (BREIT + 0.16, BREIT + 0.16), (BREIT, BREIT), 0.0, SOCKEL, s['haustein'])
    quader('turm', (BREIT, BREIT, SCHAFT), s['haustein'], ort=(0, 0, SCHAFT / 2), fase=0.012)
    # Ein Gesims aus hellem Stein teilt den Schaft.
    quader('gesims', (BREIT + 0.05, BREIT + 0.05, 0.06), s['hellstein'], ort=(0, 0, 1.42), fase=0.012)
    v = rahmen((0, -BREIT / 2, 0), VORN)
    r = rahmen((BREIT / 2, 0, 0), RECHTS)
    tuer(rahmen((0, -BREIT / 2 - 0.075, 0), VORN), 0, s, breite=0.24, hoehe=0.56, sturz=False)
    quader('tuersturz', (0.36, 0.1, 0.07), s['hellstein'], ort=(0, -0.05, 0.6), eltern=v, fase=0.01)
    # Zwei Reihen Scharten: unter dem Gesims eine, darueber zwei.
    schlitz(v, 0, 1.08, s, hoehe=0.26)
    schlitz(r, 0, 0.95, s, hoehe=0.26)
    for wand in (v, r):
        for x in (-0.18, 0.18):
            schlitz(wand, x, 1.78, s, hoehe=0.28)

    # Kragsteine tragen den Wehrgang, der ueber den Schaft hinausragt.
    for i in range(4):
        d = -BREIT / 2 + 0.08 + i * (BREIT - 0.16) / 3
        for seite in (-1, 1):
            quader('kragstein', (0.08, 0.14, 0.16), s['haustein'], ort=(d, seite * (BREIT / 2 + 0.04), SCHAFT - 0.07),
                   fase=0.01)
            quader('kragstein', (0.14, 0.08, 0.16), s['haustein'], ort=(seite * (BREIT / 2 + 0.04), d, SCHAFT - 0.07),
                   fase=0.01)
    quader('wehrgang', (GANG, GANG, 0.13), s['haustein'], ort=(0, 0, SCHAFT + 0.065), fase=0.012)
    krone = SCHAFT + 0.13
    zinnen((0, 0), GANG, GANG, krone, s['haustein'], hoch=0.16, tief=0.09, zahn=0.18, brust=0.07)
    quader('boden', (GANG - 0.16, GANG - 0.16, 0.02), s['bohle'], ort=(0, 0, krone + 0.01), fase=0)

    # Der Helm: vier Pfosten hinter den Zinnen, darauf ein Zeltdach aus Schiefer.
    innen = GANG / 2 - 0.14
    traufe = krone + PFOSTEN
    for sx in (-1, 1):
        for sy in (-1, 1):
            quader('pfosten', (0.06, 0.06, PFOSTEN), s['balken'], ort=(sx * innen, sy * innen, krone + PFOSTEN / 2),
                   fase=0.008)
    for seite in (-1, 1):
        quader('raehm', (2 * innen + 0.1, 0.06, 0.06), s['balken'], ort=(0, seite * innen, traufe - 0.03), fase=0.008)
        quader('raehm', (0.06, 2 * innen - 0.02, 0.06), s['balken'], ort=(seite * innen, 0, traufe - 0.03), fase=0.008)
    walmdach((0, 0), 2 * innen + 0.06, 2 * innen + 0.06, traufe, 0.62, s['schiefer'], firstlaenge=0, ueber=0.14,
             lagen=6, zufall=zufall, ziegel=0.09)

    fahne((0, 0, traufe + 0.56), 0.5, s, lang=0.42, hoch=0.26)
    banner((BREIT / 2 + 0.04, 0, SCHAFT - 0.24), s, breit=0.3, lang=0.5, richtung=(0, 1, 0))
    banner((0, -BREIT / 2 - 0.04, SCHAFT - 0.24), s, breit=0.28, lang=0.32, richtung=(1, 0, 0))


def tafel(ziel):
    return einzeltafel('wehrturm', FELDER, 4.1, ziel, bauen)
