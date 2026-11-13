# Das Tor: ein Torhaus ueber vier Felder der Mauer (bauen AC-37) - zwei Tuerme
# an den Enden, dazwischen die Wand mit einem Rundbogen quer zur Mauer, zwei
# Felder breit. Bis 2026-11-13 war es ein Feld ("Das Tor muss breiter sein").
#
# Zwei Zeilen fuer die zwei Richtungen, in denen die Mauer laufen kann
# (Zeile 0: laengs x des Spiels, Zeile 1: laengs y), zwei Spalten fuer zu und
# offen. Zu stehen zwei beschlagene Fluegel im Bogen, offen sieht man in die
# dunkle Durchfahrt, oben haengt das Fallgitter. Die Tuerme fuellen ihr Feld
# laengs der Mauer ganz: die Arme der Nachbarfelder stossen an ihre Stirn.
#
# Der Fuss des Bildes ist die Mitte der vier Felder. Der Browser zeichnet das
# Bild in vier senkrechten Streifen, je Feld einen, damit eine Figur vor dem
# einen Ende nicht hinter dem anderen verschwindet.
#
# Wie bei der Mauer steht der Schlagschatten in einer eigenen Tafel
# (tor-schatten.webp, eine Spalte: er ist fuer zu und offen derselbe).

import math

from bauteile import banner, bogen, kasten, rahmen, stoffe, wimpel
from formen import prisma, quader
from kette import SCHATTEN, Tafel, kamera_setzen, szene_leeren

FELDER = 4
LAENGE = 4.0              # laengs der Mauer
TURM = 1.0                # so lang ist jeder der zwei Tuerme
TIEFE = 0.62              # die Wand zwischen den Tuermen
TURM_TIEFE = 0.86
WEIT = 1.5                # die lichte Weite des Bogens
BOGEN = 1.05              # sein Scheitel
HOCH = 1.5                # die Wand
TURM_HOCH = 1.85
ZELLE = (760, 440)
FUSS = (240, 330)


def _krone(r, s, l0, l1, halb, z, enden):
    """Gesims, Brustwehr und Zinnen auf einem Kasten von l0 bis l1, `halb`
    tief nach jeder Seite. `enden`: auch an den Stirnseiten (ein Turm)."""
    kasten('gesims', (l0 - (0.03 if enden else 0), -halb - 0.03, z - 0.07), (l1 + (0.03 if enden else 0), halb + 0.03, z),
           s['haustein'], eltern=r)
    lang = l1 - l0
    zahl = max(2, round(lang / 0.3))
    schritt = (lang - 0.15) / (zahl - 1)
    for seite in (-1, 1):
        q0, q1 = sorted((seite * (halb + 0.03), seite * (halb - 0.06)))
        kasten('brustwehr', (l0, q0, z), (l1, q1, z + 0.07), s['haustein'], eltern=r)
        for i in range(zahl):
            a = l0 + i * schritt
            kasten('zinne', (a, q0, z + 0.07), (a + 0.15, q1, z + 0.23), s['haustein'], eltern=r)
    if not enden:
        return
    for a, b in ((l0, l0 + 0.09), (l1 - 0.09, l1)):
        kasten('brustwehr', (a, -halb + 0.06, z), (b, halb - 0.06, z + 0.07), s['haustein'], eltern=r)
        for mitte in (-0.2, 0.2):
            kasten('zinne', (a, mitte - 0.075, z + 0.07), (b, mitte + 0.075, z + 0.23), s['haustein'], eltern=r)


def bauen(achse='x', offen=False):
    """achse: laengs welcher Achse der Szene die Mauer laeuft. Gebaut wird im
    Rahmen der Mauer - X laengs, -Y die Seite, die man sieht."""
    s = stoffe()
    winkel = 0.0 if achse == 'x' else math.pi / 2
    r = rahmen((0, 0, 0), winkel)
    hl, ht, tt = LAENGE / 2, TIEFE / 2, TURM_TIEFE / 2
    innen = hl - TURM      # wo die Tuerme an die Wand stossen
    sturz = BOGEN + 0.05

    def szene(l, q, z):
        """Ein Punkt des Rahmens in den Massen der Szene - fuer Tuch, das nach
        der Szene faellt und nicht nach der Mauer."""
        return (l * math.cos(winkel) - q * math.sin(winkel), l * math.sin(winkel) + q * math.cos(winkel), z)

    # Die zwei Tuerme.
    for seite in (-1, 1):
        l0, l1 = sorted((seite * hl, seite * innen))
        kasten('torturm', (l0, -tt, 0), (l1, tt, TURM_HOCH - 0.07), s['haustein'], eltern=r)
        _krone(r, s, l0, l1, tt, TURM_HOCH, True)
        mitte = (l0 + l1) / 2
        for hoch in (0.72, 1.36):
            quader('scharte', (0.05, 0.02, 0.26), s['dunkel'], ort=(mitte, -tt - 0.004, hoch), fase=0, eltern=r)
        quader('scharte', (0.02, 0.05, 0.26), s['dunkel'], ort=(seite * (hl + 0.004), 0, 1.36), fase=0, eltern=r)

    # Die Wand dazwischen: Leibungen, Zwickel ueber dem Bogen, Oberbau.
    for seite in (-1, 1):
        l0, l1 = sorted((seite * innen, seite * WEIT / 2))
        kasten('leibung', (l0, -ht, 0), (l1, ht, sturz), s['haustein'], eltern=r)
    rund = bogen(WEIT, BOGEN)[1:-1]
    prisma('zwickel', rund + [(WEIT / 2, sturz), (-WEIT / 2, sturz)], TIEFE, s['haustein'], eltern=r)
    # Der Oberbau endet unter dem Gesims: zwei Deckflaechen auf einer Hoehe
    # rendert Cycles schwarz.
    kasten('oberbau', (-innen, -ht, sturz), (innen, ht, HOCH - 0.07), s['haustein'], eltern=r)
    _krone(r, s, -innen, innen, ht, HOCH, False)
    # Die Steine des Bogens, heller, auf der Seite, die man sieht.
    aussen = bogen(WEIT + 0.2, BOGEN + 0.1)
    kern = bogen(WEIT, BOGEN)
    prisma('bogensteine', aussen + kern[::-1], 0.04, s['hellstein'], ort=(0, -ht - 0.012, 0), eltern=r)
    kasten('durchfahrt', (-WEIT / 2, -tt - 0.1, 0), (WEIT / 2, tt + 0.1, 0.025), s['pflaster'], eltern=r)

    if offen:
        # Das Fallgitter ist hochgezogen: seine Spitzen schauen aus dem Bogen.
        for i in range(9):
            l = -0.6 + i * 0.15
            quader('gitterstab', (0.03, 0.03, 0.42), s['eisen'], ort=(l, -ht + 0.1, BOGEN - 0.2), fase=0.004, eltern=r)
        quader('gitterholm', (WEIT - 0.3, 0.03, 0.035), s['eisen'], ort=(0, -ht + 0.1, BOGEN - 0.24), fase=0.004,
               eltern=r)
    else:
        prisma('torblatt', bogen(WEIT, BOGEN), 0.06, s['bohle'], ort=(0, -ht + 0.1, 0), eltern=r)
        for hoch in (0.18, 0.5):
            quader('torband', (WEIT - 0.04, 0.02, 0.055), s['eisen'], ort=(0, -ht + 0.062, hoch), fase=0.004, eltern=r)
        quader('torspalt', (0.02, 0.02, BOGEN - 0.04), s['dunkel'], ort=(0, -ht + 0.066, (BOGEN - 0.04) / 2), fase=0,
               eltern=r)

    # Die Farbe des Besitzers: das Banner ueber dem Bogen, ein Wimpel auf
    # jedem Turm.
    richtung = szene(1, 0, 0)
    banner(szene(0, -ht - 0.045, HOCH - 0.1), s, breit=0.42, lang=0.36, richtung=richtung)
    for seite in (-1, 1):
        wimpel(szene(seite * (hl - TURM / 2), 0, TURM_HOCH), 0.5, s)


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
