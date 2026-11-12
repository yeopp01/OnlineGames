# Das Tor: ein Torhaus, das ein Feld der Mauer ersetzt - hoeher als sie, mit
# einem Rundbogen quer zur Mauer.
#
# Zwei Zeilen fuer die zwei Richtungen, in denen die Mauer laufen kann
# (Zeile 0: laengs x des Spiels, Zeile 1: laengs y), zwei Spalten fuer zu und
# offen. Zu steht ein beschlagenes Holztor im Bogen, offen sieht man in die
# dunkle Durchfahrt, oben haengt das Fallgitter. Das Torhaus fuellt das Feld
# laengs der Mauer ganz: die Arme der Nachbarfelder stossen an seine Stirn.
#
# Wie bei der Mauer steht der Schlagschatten in einer eigenen Tafel
# (tor-schatten.webp, eine Spalte: er ist fuer zu und offen derselbe).

import math

from bauteile import banner, bogen, kasten, rahmen, stoffe, wimpel
from formen import prisma, quader
from kette import SCHATTEN, Tafel, kamera_setzen, szene_leeren

FELDER = 1
LAENGE = 1.0              # laengs der Mauer
TIEFE = 0.62
PFEILER = 0.26
KAEMPFER = 0.5            # wo der Bogen ansetzt
BOGEN = 0.74              # sein Scheitel
HOCH = 1.5
ZELLE = (360, 292)
FUSS = (100, 232)


def bauen(achse='x', offen=False):
    """achse: laengs welcher Achse der Szene die Mauer laeuft. Gebaut wird im
    Rahmen der Mauer - X laengs, -Y die Seite, die man sieht."""
    s = stoffe()
    r = rahmen((0, 0, 0), 0.0 if achse == 'x' else math.pi / 2)
    hl, ht = LAENGE / 2, TIEFE / 2
    weit = LAENGE - 2 * PFEILER
    sturz = BOGEN + 0.04

    for seite in (-1, 1):
        l0, l1 = sorted((seite * hl, seite * weit / 2))
        kasten('torpfeiler', (l0, -ht, 0), (l1, ht, sturz), s['haustein'], eltern=r)
    rund = bogen(weit, BOGEN)[1:-1]
    prisma('zwickel', rund + [(weit / 2, sturz), (-weit / 2, sturz)], TIEFE, s['haustein'], eltern=r)
    # Der Oberbau endet unter dem Gesims: zwei Deckflaechen auf einer Hoehe
    # rendert Cycles schwarz.
    kasten('oberbau', (-hl, -ht, sturz), (hl, ht, HOCH - 0.07), s['haustein'], eltern=r)
    # Die Steine des Bogens, heller, auf der Seite, die man sieht.
    aussen = bogen(weit + 0.16, BOGEN + 0.08)
    innen = bogen(weit, BOGEN)
    prisma('bogensteine', aussen + innen[::-1], 0.04, s['hellstein'], ort=(0, -ht - 0.012, 0), eltern=r)
    kasten('durchfahrt', (-weit / 2, -ht - 0.06, 0), (weit / 2, ht + 0.06, 0.025), s['pflaster'], eltern=r)

    if offen:
        # Das Fallgitter ist hochgezogen: seine Spitzen schauen aus dem Bogen.
        for i in range(5):
            l = -0.16 + i * 0.08
            quader('gitterstab', (0.024, 0.024, 0.24), s['eisen'], ort=(l, -ht + 0.1, KAEMPFER + 0.14), fase=0.004,
                   eltern=r)
        quader('gitterholm', (weit - 0.06, 0.024, 0.03), s['eisen'], ort=(0, -ht + 0.1, KAEMPFER + 0.12), fase=0.004,
               eltern=r)
    else:
        prisma('torblatt', bogen(weit, BOGEN), 0.05, s['bohle'], ort=(0, -ht + 0.09, 0), eltern=r)
        for hoch in (0.16, 0.42):
            quader('torband', (weit - 0.02, 0.02, 0.045), s['eisen'], ort=(0, -ht + 0.058, hoch), fase=0.004, eltern=r)
        quader('torspalt', (0.014, 0.02, BOGEN - 0.03), s['dunkel'], ort=(0, -ht + 0.06, (BOGEN - 0.03) / 2), fase=0,
               eltern=r)

    # Die Krone: ein Gesims, darauf Brustwehr und Zinnen an beiden Laengsseiten.
    kasten('gesims', (-hl, -ht - 0.03, HOCH - 0.07), (hl, ht + 0.03, HOCH), s['haustein'], eltern=r)
    for seite in (-1, 1):
        q0, q1 = sorted((seite * (ht + 0.03), seite * (ht - 0.06)))
        kasten('brustwehr', (-hl, q0, HOCH), (hl, q1, HOCH + 0.07), s['haustein'], eltern=r)
        for mitte in (-0.4, -0.125, 0.125, 0.4):
            kasten('zinne', (mitte - 0.075, q0, HOCH + 0.07), (mitte + 0.075, q1, HOCH + 0.23), s['haustein'], eltern=r)
        l0, l1 = sorted((seite * hl, seite * (hl - 0.08)))
        kasten('brustwehr', (l0, -ht + 0.06, HOCH), (l1, ht - 0.06, HOCH + 0.07), s['haustein'], eltern=r)
    for l in (-0.34, 0.34):
        quader('scharte', (0.045, 0.02, 0.22), s['dunkel'], ort=(l, -ht - 0.004, 1.12), fase=0, eltern=r)

    # Die Farbe des Besitzers: das Banner ueber dem Bogen, ein Wimpel oben.
    if achse == 'x':
        banner((0, -ht - 0.04, HOCH - 0.14), s, breit=0.3, lang=0.4, richtung=(1, 0, 0))
        wimpel((-0.36, 0.16, HOCH + 0.05), 0.48, s)
    else:
        banner((ht + 0.04, 0, HOCH - 0.14), s, breit=0.3, lang=0.4, richtung=(0, 1, 0))
        wimpel((-0.16, -0.36, HOCH + 0.05), 0.48, s)


def tafel(ziel):
    blatt = None
    for zeile, achse in enumerate(('x', 'y')):
        for spalte, offen, schatten in ((0, False, 'ohne'), (1, True, 'ohne'), (0, False, 'nur')):
            szene_leeren()
            bauen(achse, offen)
            if blatt is None:
                blatt = Tafel('tor', zelle=ZELLE, fuss=FUSS, ziel=ziel, knapp=True)
            else:
                kamera_setzen(ZELLE[0], ZELLE[1], FUSS)
            if schatten == 'nur':
                blatt.bild(zeile, spalte, teil='schatten', schatten='nur')
            else:
                blatt.bild(zeile, spalte, schatten='ohne')
    return blatt.schreiben({
        'art': 'gebaeude',
        'felder': FELDER,
        'ausrichtungen': ['x', 'y'],
        'zustaende': ['zu', 'offen'],
        'ablaeufe': {'schatten': {'spalte': 0, 'bilder': 1}},
        'schattenDeckung': SCHATTEN,
    })
