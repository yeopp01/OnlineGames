# Die Steinmauer: ein Feld Mauer, zerlegt in die Teile, aus denen der Browser
# jede Linie setzt - gerade, schraeg, um die Ecke, als Kreuz.
#
# Spalte 0 ist der Pfeiler. Die Spalten 1 bis 8 sind die Arme: je ein Stueck
# Mauer von der Feldmitte bis an den Rand des Feldes, in jede der acht
# Richtungen, in denen ein Nachbar liegen kann. Die Spalten 9 bis 12 sind die
# Laeufe: die Mauer quer durch das ganze Feld, ohne Pfeiler - laengs x, laengs
# y und die zwei Schraegen.
#
# Ein Mauerfeld mit genau zwei Nachbarn, die sich gegenueberliegen, ist ein
# Lauf. Jedes andere ist der Pfeiler und dazu ein Arm je Nachbar, der Mauer
# oder Tor ist (ohne Nachbar: der Pfeiler allein). Arme und Laeufe benachbarter
# Felder treffen sich an der Feldgrenze und sind dort gleich geschnitten.
#
# Die Arme sind MIT dem Pfeiler gerendert, der Pfeiler aber als Aussparung:
# wo er einen Arm verdeckt, hat das Bild des Arms ein Loch. Deshalb genuegt im
# Spiel eine Regel - erst der Pfeiler, dann die Arme, gleich in welcher Folge.
#
# Koerper und Schlagschatten stehen in zwei Tafeln (steinmauer.webp und
# steinmauer-schatten.webp, dieselben Spalten): der Schatten eines Teils laege
# sonst ueber dem Nachbarn, der hinter ihm steht, und wo sich zwei Schatten
# ueberdecken, wuerde es doppelt dunkel. Der Schatten ist voll gedeckt
# geschrieben; `schattenDeckung` in der Beschreibung nennt, wie stark er im
# Spiel stehen soll.

import math

from mathutils import Vector

from bauteile import aussparen, bestand, kasten, stoffe, stumpf, zinnen
from formen import netz
from kette import SCHATTEN, Tafel, kamera_setzen, szene_leeren

FELDER = 1
DICKE = 0.38
GANG = 0.9                # Hoehe des Wehrgangs
BRUST = 0.07
ZINNE = 0.15
PFEILER = 0.54
KOPF = 1.02               # Hoehe des Pfeilers unter seinen Zinnen
# Die acht Nachbarn (dx, dy) in den Feldern des Spiels - y waechst im Spiel
# nach vorn links, in der Szene ist das -Y.
ARME = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)]
# Ein Lauf geht zu (dx, dy) und zum Nachbarn gegenueber.
LAEUFE = [(1, 0), (0, 1), (1, 1), (1, -1)]
ZELLE = (346, 250)
FUSS = (124, 176)


def _riegel(name, richtung, a0, a1, q0, q1, z0, z1, stoff):
    """Ein Kasten laengs `richtung`: von a0 bis a1 entlang, von q0 bis q1 quer.
    Sein Netz steht in den Massen der Szene - die Lagen der Steine laufen von
    Teil zu Teil durch."""
    d = Vector((richtung[0], richtung[1], 0)).normalized()
    quer = Vector((-d.y, d.x, 0))
    ecken = []
    for z in (z0, z1):
        for a, q in ((a0, q0), (a1, q0), (a1, q1), (a0, q1)):
            p = d * a + quer * q
            ecken.append((p.x, p.y, z))
    seiten = [(3, 2, 1, 0), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    return netz(name, ecken, seiten, stoff)


def pfeiler(s):
    """Der Pfeiler in der Feldmitte: etwas dicker und hoeher als die Mauer, mit
    eigenem Zinnenkranz. Unter der Krone ein Band in der Farbe des Besitzers."""
    h = PFEILER / 2
    stumpf('pfeilerfuss', (0, 0), (PFEILER + 0.1, PFEILER + 0.1), (PFEILER, PFEILER), 0.0, 0.18, s['haustein'])
    # Der Pfeiler endet unter dem Kragen: zwei Deckflaechen auf einer Hoehe
    # rendert Cycles schwarz.
    kasten('pfeiler', (-h, -h, 0), (h, h, KOPF - 0.03), s['haustein'])
    b = h + 0.012
    kasten('band', (-b, -b, KOPF - 0.2), (b, b, KOPF - 0.11), s['tuch'])
    k = h + 0.04
    kasten('kragen', (-k, -k, KOPF - 0.07), (k, k, KOPF), s['haustein'])
    zinnen((0, 0), 2 * k, 2 * k, KOPF, s['haustein'], hoch=0.14, tief=0.08, zahn=0.17, brust=0.06)


def _stueck(s, richtung, von, bis, zinnen_ab):
    """Mauer laengs `richtung` von `von` bis `bis` (in Feldern ab der
    Feldmitte), mit Brustwehr und Zinnen an beiden Kanten. Die Zinnen stehen
    in einem Takt, der an der Feldgrenze aufgeht: Arm an Arm und Arm an Lauf
    gibt dieselbe Reihe."""
    h = DICKE / 2
    lang = max(abs(von), abs(bis))
    _riegel('mauer', richtung, von, bis, -h, h, 0.0, GANG, s['haustein'])
    zahl = round(lang / 0.25)
    takt = lang / zahl
    mitten = [(i + 0.5) * takt for i in range(zinnen_ab, zahl)]
    if von < 0:
        mitten += [-m for m in mitten]
    for seite in (-1, 1):
        q0, q1 = sorted((seite * h, seite * (h - 0.08)))
        _riegel('brustwehr', richtung, von, bis, q0, q1, GANG, GANG + BRUST, s['haustein'])
        for m in mitten:
            _riegel('zinne', richtung, m - 0.26 * takt, m + 0.26 * takt, q0, q1, GANG + BRUST, GANG + BRUST + ZINNE,
                    s['haustein'])


def arm(s, dx, dy):
    """Ein Stueck Mauer von der Feldmitte zum Nachbarn (dx, dy) - bis an die
    Feldgrenze, schraeg bis in die Ecke. Die erste Zinne steckte im Pfeiler
    und fehlt."""
    _stueck(s, (dx, -dy), 0.0, math.hypot(dx, dy) / 2, 1)


def lauf(s, dx, dy):
    """Die Mauer quer durch das ganze Feld, von einem Nachbarn zum
    gegenueberliegenden."""
    lang = math.hypot(dx, dy) / 2
    _stueck(s, (dx, -dy), -lang, lang, 0)


def bauen():
    """Zum Ansehen: ein Feld mit Pfeiler und zwei Armen."""
    s = stoffe()
    pfeiler(s)
    arm(s, 1, 0)
    arm(s, -1, 0)


def tafel(ziel):
    blatt = None
    teile = [('pfeiler', None)] + [('arm', a) for a in ARME] + [('lauf', l) for l in LAEUFE]
    for spalte, (art, nachbar) in enumerate(teile):
        for durchgang in ('koerper', 'schatten'):
            szene_leeren()
            s = stoffe()
            if art == 'pfeiler':
                pfeiler(s)
            elif art == 'lauf':
                lauf(s, *nachbar)
            else:
                if durchgang == 'koerper':
                    vorher = bestand()
                    pfeiler(s)
                    aussparen(vorher)
                arm(s, *nachbar)
            if blatt is None:
                blatt = Tafel('steinmauer', zelle=ZELLE, fuss=FUSS, ziel=ziel, knapp=True)
            else:
                kamera_setzen(ZELLE[0], ZELLE[1], FUSS)
            if durchgang == 'koerper':
                blatt.bild(0, spalte, schatten='ohne')
            else:
                blatt.bild(0, spalte, teil='schatten', schatten='nur')
    return blatt.schreiben({
        'art': 'gebaeude',
        'felder': FELDER,
        'teile': {
            'pfeiler': 0,
            'arme': [{'dx': dx, 'dy': dy, 'spalte': 1 + i} for i, (dx, dy) in enumerate(ARME)],
            'laeufe': [{'dx': dx, 'dy': dy, 'spalte': 1 + len(ARME) + i} for i, (dx, dy) in enumerate(LAEUFE)],
        },
        'ablaeufe': {'schatten': {'spalte': 0, 'bilder': len(teile)}},
        'schattenDeckung': SCHATTEN,
    })
