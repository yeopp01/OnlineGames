# Der Drache (einheiten AC-52, ADR-0014): das eine teure Stueck der Krone. Er
# fliegt - ueber Mauern, Wald und Wasser - und brennt.
#
# Ein Tier, kein Reittier: basaltdunkle Schuppen, der Bauch von der Kehle bis
# zur Schwanzspitze in Ocker, zwei lange Hoerner nach hinten, ein Kamm aus
# Hornplatten ueber Hals, Ruecken und Schwanz, am Schwanzende ein Spaten.
# Fluegel wie eine Fledermaus: Oberarm, Unterarm, drei lange Finger, dazwischen
# die Flughaut. Die Spannweite sind 5,5 m, von der Nase bis zum Schwanz 4,7 m -
# mit ausgebreiteten Fluegeln ist er so breit wie ein Dorfzentrum.
#
# Wem er gehoert, zeigt die Flughaut zwischen den Fingern: die aeussere Haelfte
# jedes Fluegels traegt die Spielerfarbe, von oben wie von der Seite zu sehen.
# Die innere Haut zwischen Arm und Leib ist dunkles Leder - sonst waere die
# Figur zu mehr als einem Drittel Farbe (darstellung AC-21).
#
# Gebaut in Metern; er schaut nach -Y, rechts ist bei -X. Der Fusspunkt liegt
# am Boden unter ihm: im Flug haengt der Leib FLUG_HOCH darueber, und der
# Schlagschatten faellt dorthin, wo er ueber dem Boden steht.
#
# Hals, Schwanz, Fluegelknochen und Flughaut sind keine starren Teile an
# Gelenken: ihre Netze werden in jedem Bild neu gerechnet (_setzen). So biegt
# sich der Hals ohne Knick, und die Haut spannt sich zwischen den Fingern, wie
# auch immer der Fluegel steht.
#
# Die Ablaeufe:
#   stehen     er steht in der Luft: die Brust aufgerichtet, die Fluegel halb
#              gehoben, der Schwanz haengt (ein Bild - wer ihn ruhen laesst,
#              spielt besser `gehen` weiter, sonst friert er ein)
#   gehen      der Flug: ein voller Fluegelschlag, im Aufschlag halb gefaltet,
#              die Spitzen laufen dem Arm nach, der Leib hebt und senkt sich
#   angreifen  das Feuer: der Hals holt zurueck und hoch aus, stoesst nach vorn
#              unten und speit (bei 0,5 - dort faellt im Spiel der Schaden),
#              haelt, kehrt zurueck. Die Fluegel schlagen dabei weiter.
#   sterben    getroffen wirft er Hals und Fluegel hoch, stuerzt, schlaegt auf
#              und bleibt liegen, die Fluegel am Boden (t von 0 bis 1, einmal)
#
# Die Tafel: je Zeile eine Blickrichtung, je Spalte ein Bild. Stehen und Gehen
# liegen in der Haupttafel, Angreifen und Sterben je in einer eigenen.

import math
import os

from dorfbewohner import GROESSE
from formen import aufsetzen, drehkoerper, glied, kugel, leer, netz
from kette import Tafel, szene_leeren
from stoffe import einfarbig, flammenhuelle, gemustert, glut

RICHTUNGEN = 8
BILDER = 8                # je Ablauf
MASS = 1.0

# Die Zelle: die Fluegelspitzen reichen 2,8 m zur Seite (1,7 Felder, quer im
# Bild 158 Bildpunkte) und im Aufschlag 3,4 m ueber den Boden; der Schatten
# liegt bei 1,6 m Flughoehe rund 80 Bildpunkte rechts vom Fusspunkt. Grosszuegig
# - geschrieben wird jede Tafel knapp.
ZELLE = (620, 420)
FUSS = (255, 315)
WEG = (0.001, 0.001, 0.001)   # so klein, dass es im Bild fehlt

FLUG_HOCH = 1.6           # Mitte des Leibs ueber dem Boden, wenn er fliegt
LIEG_HOCH = 0.30          # ... und wenn er liegt
LEIB_Y = -0.3             # der Leib sitzt vor dem Fusspunkt: der Schwanz ist laenger als Hals und Kopf

# Der Rumpf in Spanten von vorn nach hinten: (y, halbe Breite, oben, unten).
SPANTEN = [
    (-0.62, 0.0, 0.02, 0.02), (-0.58, 0.10, 0.12, -0.10), (-0.48, 0.19, 0.21, -0.20), (-0.30, 0.25, 0.27, -0.28),
    (-0.10, 0.25, 0.27, -0.27), (0.12, 0.22, 0.25, -0.22), (0.34, 0.18, 0.22, -0.16), (0.52, 0.14, 0.18, -0.12),
    (0.66, 0.11, 0.14, -0.09), (0.76, 0.0, 0.03, 0.03),
]

HALS_AN = (0.0, -0.50, 0.05)
HALS_GLIEDER, HALS_GLIED = 8, 0.13
SCHWANZ_AN = (0.0, 0.62, 0.03)
SCHWANZ_GLIEDER, SCHWANZ_GLIED = 12, 0.17

# Der Fluegel, links (x positiv); der rechte ist sein Spiegelbild.
SCHULTER = (0.2, -0.26, 0.17)
OBERARM, UNTERARM = 0.65, 0.8
FINGER = (1.25, 1.3, 1.1)
# Wohin die Finger vom Handgelenk zeigen, gegen "quer hinaus" nach hinten
# gedreht: (gestreckt, zusaetzlich wenn gefaltet).
FAECHER = ((0.12, 1.0), (0.72, 0.75), (1.3, 0.45))
FLANKE = (0.19, 0.0, 0.1)         # wo die innere Haut am Leib ansetzt ...
LENDE = (0.13, 0.52, 0.02)        # ... und wo sie endet
HAUT_U, HAUT_V = 5, 5             # Maschen je Feld der Haut
BOGEN = 0.2                       # wie tief der Rand der Haut zwischen zwei Fingern einzieht

BEINE = ('vl', 'vr', 'hl', 'hr')
VORN_OBEN, VORN_UNTEN = 0.30, 0.28
HINTEN_OBEN, HINTEN_UNTEN = 0.40, 0.38


def stoffe():
    return {
        'schuppe': gemustert('schuppe', ('#2b2726', '#463c37', '#655649'), groesse=22, detail=5, relief=0.8,
                             fugen=0.6, rau=0.55),
        'arm': gemustert('arm', ('#221f1e', '#3a322f', '#514540'), groesse=20, detail=4, relief=0.6, fugen=0.5,
                         rau=0.6),
        'bauch': gemustert('bauch', ('#8a5b2c', '#b17e3f', '#cfa35a'), groesse=14, detail=3, relief=0.5, fugen=0.5,
                           rau=0.6),
        'horn': gemustert('horn', ('#b3a585', '#d9ceb1'), groesse=10, detail=3, relief=0.3, rau=0.5),
        'kralle': einfarbig('kralle', '#1d1a18', rau=0.35),
        'leder': gemustert('leder', ('#3a2622', '#55352c', '#6e4636'), groesse=9, detail=4, relief=0.4, fugen=0.5,
                           rau=0.75),
        # Die Spielerfarbe: hell und unbunt, der Browser faerbt sie ein.
        'haut': gemustert('haut', ('#6e6e6e', '#a9a9a9'), groesse=9, detail=4, relief=0.3, fugen=0.4, rau=0.8,
                          spieler=True),
        'auge': glut('auge', '#ffb52e', 4.0),
        'rachen': einfarbig('rachen', '#7d2420', rau=0.5),
        'zahn': einfarbig('zahn', '#e8e1cd', rau=0.4),
        'nase': einfarbig('nase', '#151211', rau=0.4),
        'feuer_aussen': flammenhuelle('feuer_aussen', '#ff4a0c', 1.3),
        'feuer_innen': glut('feuer_innen', '#ffcf4a', 1.5),
    }


# ---- Rechnen ------------------------------------------------------------------

def _plus(a, b):
    return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


def _minus(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def _mal(a, f):
    return (a[0] * f, a[1] * f, a[2] * f)


def _kreuz(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def _einheit(a, sonst=(1.0, 0.0, 0.0)):
    lang = math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2])
    return sonst if lang < 1e-6 else (a[0] / lang, a[1] / lang, a[2] / lang)


def _zwischen(a, b, t):
    if isinstance(a, tuple):
        return tuple(_zwischen(x, y, t) for x, y in zip(a, b))
    return a + (b - a) * t


def _glatt(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def _weg(stationen, t):
    """Zwischen Haltungen: `stationen` ist eine Liste (wann, Wert oder Werte)."""
    if t <= stationen[0][0]:
        return stationen[0][1]
    for (t0, a), (t1, b) in zip(stationen, stationen[1:]):
        if t <= t1:
            return _zwischen(a, b, _glatt((t - t0) / (t1 - t0)))
    return stationen[-1][1]


def _rahmen(punkte, i):
    """Quer und hoch an der Stelle i einer Mittellinie: quer liegt waagerecht,
    hoch steht darauf - beim Hals der Nacken, beim Schwanz der Ruecken."""
    a, b = punkte[max(0, i - 1)], punkte[min(len(punkte) - 1, i + 1)]
    laengs = _einheit(_minus(b, a), (0.0, 1.0, 0.0))
    quer = _einheit(_kreuz((0.0, 0.0, 1.0), laengs))
    return quer, _kreuz(laengs, quer)


def _rohr_ecken(punkte, masse, teile):
    """Ein Schlauch um eine Mittellinie; masse: (halbe Breite, halbe Hoehe) je
    Punkt. Am Ende zwei Ecken, die ihn vorn und hinten schliessen."""
    ecken = []
    for i, p in enumerate(punkte):
        quer, hoch = _rahmen(punkte, i)
        breit, hoehe = masse[i]
        for k in range(teile):
            w = 2 * math.pi * k / teile
            ecken.append(_plus(p, _plus(_mal(quer, breit * math.sin(w)), _mal(hoch, hoehe * math.cos(w)))))
    return ecken + [punkte[0], punkte[-1]]


def _rohr_seiten(zahl, teile):
    seiten = []
    for i in range(zahl - 1):
        for k in range(teile):
            j = (k + 1) % teile
            seiten.append((i * teile + k, i * teile + j, (i + 1) * teile + j, (i + 1) * teile + k))
    vorn, hinten = zahl * teile, zahl * teile + 1
    for k in range(teile):
        j = (k + 1) % teile
        seiten.append((vorn, j, k))
        seiten.append((hinten, (zahl - 1) * teile + k, (zahl - 1) * teile + j))
    return seiten


def _streifen_ecken(punkte, masse, winkel, auftrag, bogen=4):
    """Die Bauchschilde: ein Streifen an der Unterseite eines Schlauchs."""
    ecken = []
    for i, p in enumerate(punkte):
        quer, hoch = _rahmen(punkte, i)
        breit, hoehe = masse[i]
        for k in range(bogen + 1):
            w = math.pi + winkel * (2 * k / bogen - 1)
            ecken.append(_plus(p, _plus(_mal(quer, (breit + auftrag) * math.sin(w)),
                                        _mal(hoch, (hoehe + auftrag) * math.cos(w)))))
    return ecken


def _gitter_seiten(reihen, spalten):
    """Vierecke eines Gitters aus (reihen + 1) mal (spalten + 1) Ecken."""
    seiten = []
    for j in range(reihen):
        for k in range(spalten):
            a = j * (spalten + 1) + k
            seiten.append((a, a + 1, a + spalten + 2, a + spalten + 1))
    return seiten


def _setzen(koerper, ecken):
    """Legt die Ecken eines Netzes neu - dieselben Flaechen, eine neue Haltung."""
    koerper.data.vertices.foreach_set('co', [c for ecke in ecken for c in ecke])
    koerper.data.update()


# ---- Hals und Schwanz -----------------------------------------------------------

HALS_MASSE = [(0.15 - 0.07 * i / HALS_GLIEDER, 0.17 - 0.075 * i / HALS_GLIEDER) for i in range(HALS_GLIEDER + 1)]
SCHWANZ_MASSE = [(0.115 * (1 - i / SCHWANZ_GLIEDER) ** 0.8 + 0.012, 0.13 * (1 - i / SCHWANZ_GLIEDER) ** 0.8 + 0.012)
                 for i in range(SCHWANZ_GLIEDER + 1)]


def _bogenwinkel(werte, s):
    """Die Steigung an der Stelle s (0 bis 1) eines Bogens, der mit werte[0]
    beginnt, in der Mitte werte[1] hat und mit werte[2] endet."""
    anfang, mitte, ende = werte
    lenker = 2 * mitte - (anfang + ende) / 2
    return (1 - s) ** 2 * anfang + 2 * s * (1 - s) * lenker + s * s * ende


def _hals_linie(steigung, boden=None):
    """Die Mittellinie des Halses im Leib: von der Brust nach vorn. Mit
    `boden` liegt nichts tiefer als der Boden - so liegt der Hals, wenn er
    liegt, auf der Erde statt darin."""
    p = HALS_AN
    punkte = [p]
    for i in range(HALS_GLIEDER):
        e = _bogenwinkel(steigung, (i + 0.5) / HALS_GLIEDER)
        p = (0.0, p[1] - HALS_GLIED * math.cos(e), p[2] + HALS_GLIED * math.sin(e))
        if boden is not None:
            p = (p[0], p[1], max(p[2], boden + HALS_MASSE[i + 1][1]))
        punkte.append(p)
    return punkte


def _schwanz_linie(steigung, schwung, phase, boden=None):
    """Die Mittellinie des Schwanzes: vom Becken nach hinten, mit einem
    Schwung zur Seite, der nach hinten zunimmt."""
    p = SCHWANZ_AN
    punkte = [p]
    for i in range(SCHWANZ_GLIEDER):
        s = (i + 1) / SCHWANZ_GLIEDER
        e = _bogenwinkel(steigung, (i + 0.5) / SCHWANZ_GLIEDER)
        p = (schwung * math.sin(phase + 3.0 * s) * s, p[1] + SCHWANZ_GLIED * math.cos(e),
             p[2] + SCHWANZ_GLIED * math.sin(e))
        if boden is not None:
            p = (p[0], p[1], max(p[2], boden + SCHWANZ_MASSE[i + 1][1]))
        punkte.append(p)
    return punkte


# ---- Der Fluegel ----------------------------------------------------------------

def _hinaus(hebung, pfeilung, lang):
    """Ein Knochen der Laenge `lang`: quer hinaus, um `hebung` gehoben und um
    `pfeilung` nach hinten gedreht."""
    return (math.cos(hebung) * math.cos(pfeilung) * lang, math.sin(pfeilung) * lang,
            math.sin(hebung) * math.cos(pfeilung) * lang)


def _fluegel(schlag, falten, bauch, seite, boden=None):
    """Alle Punkte eines Fluegels im Leib.

    schlag   (Oberarm, Unterarm, Finger): wie weit jedes Stueck gehoben ist
    falten   0 gestreckt bis 1 angelegt
    bauch    wie weit sich die Haut woelbt (nach oben positiv)
    """
    oben, unten, finger = schlag
    ellbogen = _plus(SCHULTER, _hinaus(oben, 0.35 + 0.75 * falten, OBERARM))
    hand = _plus(ellbogen, _hinaus(unten, -0.5 - 0.55 * falten, UNTERARM))
    spitzen = []
    for nummer, (lang, (offen, zu)) in enumerate(zip(FINGER, FAECHER)):
        # Der hintere Finger haengt am Unterarm, der vordere schlaegt am weitesten aus.
        hebung = finger + (unten - finger) * (nummer / 3)
        spitzen.append(_plus(hand, _hinaus(hebung, offen + zu * falten, lang)))

    def senken(p):
        return p if boden is None else (p[0], p[1], max(p[2], boden))

    def spiegeln(p):
        p = senken(p)
        return (p[0] * seite, p[1], p[2])

    # Die Haut zwischen den Fingern: zwei Felder, vom Handgelenk aufgefaechert.
    aussen = []
    u0 = 0.04
    lot = [_einheit(_kreuz(_minus(spitzen[n], hand), _minus(spitzen[n + 1], hand)), (0.0, 0.0, 1.0)) for n in (0, 1)]
    for j in range(HAUT_U + 1):
        u = u0 + (1 - u0) * j / HAUT_U
        for k in range(2 * HAUT_V + 1):
            feld = min(1, k // HAUT_V)
            v = k / HAUT_V - feld
            rand = _zwischen(_minus(spitzen[feld], hand), _minus(spitzen[feld + 1], hand), v)
            p = _plus(hand, _mal(rand, u * (1 - BOGEN * 4 * v * (1 - v) * u)))
            aussen.append(_plus(p, _mal(lot[feld], bauch * math.sin(math.pi * v) * u)))
    # Die Haut zwischen Arm und Leib: vom Arm (Hand, Ellbogen, Flanke) zum
    # Rand zwischen dem hinteren Finger und der Lende.
    innen = []
    lot_innen = _einheit(_kreuz(_minus(spitzen[2], hand), _minus(LENDE, hand)), (0.0, 0.0, 1.0))
    for j in range(HAUT_U + 1):
        u = j / HAUT_U
        for k in range(2 * HAUT_V + 1):
            v = k / (2 * HAUT_V)
            am_arm = _zwischen(hand, ellbogen, 2 * v) if v < 0.5 else _zwischen(ellbogen, FLANKE, 2 * v - 1)
            am_rand = _zwischen(spitzen[2], LENDE, v)
            p = _plus(am_arm, _mal(_minus(am_rand, am_arm), u * (1 - BOGEN * 4 * v * (1 - v) * u)))
            innen.append(_plus(p, _mal(lot_innen, 1.4 * bauch * math.sin(math.pi * v) * math.sin(math.pi * u))))
    # Die Finger sind leicht durchgebogen, wie die Haut sie zieht.
    finger_linien = []
    for nummer, spitze in enumerate(spitzen):
        mitte = _plus(_zwischen(hand, spitze, 0.5), (0.0, 0.03 + 0.02 * nummer, 0.5 * bauch))
        finger_linien.append([spiegeln(hand), spiegeln(mitte), spiegeln(spitze)])
    return {
        'arm': [spiegeln(SCHULTER), spiegeln(ellbogen), spiegeln(hand)],
        'finger': finger_linien,
        'aussen': [spiegeln(p) for p in aussen],
        'innen': [spiegeln(p) for p in innen],
        'hand': spiegeln(hand),
    }


ARM_MASSE = [(0.075, 0.075), (0.055, 0.055), (0.04, 0.04)]
FINGER_MASSE = [(0.032, 0.032), (0.02, 0.02), (0.006, 0.006)]
RUHE = {'schlag': (0.35, 0.45, 0.5), 'falten': 0.15, 'bauch': 0.05}


# ---- Bauen ----------------------------------------------------------------------

def huelle(y):
    """Der Querschnitt des Rumpfs an der Stelle y: (halbe Breite, Mitte, halbe Hoehe)."""
    for (y0, b0, o0, u0), (y1, b1, o1, u1) in zip(SPANTEN, SPANTEN[1:]):
        if y0 <= y <= y1:
            f = (y - y0) / (y1 - y0)
            oben, unten = o0 + (o1 - o0) * f, u0 + (u1 - u0) * f
            return b0 + (b1 - b0) * f, (oben + unten) / 2, (oben - unten) / 2
    return 0.0, 0.0, 0.0


def _rumpf(s, leib):
    """Der Rumpf als ein Netz ueber die Spanten, darunter die Bauchschilde."""
    teile = 20
    ecken, ringe = [], []
    for y, halb, oben, unten in SPANTEN:
        mitte, hoch = (oben + unten) / 2, (oben - unten) / 2
        if halb <= 0:
            ringe.append([len(ecken)])
            ecken.append((0, y, mitte))
            continue
        reif = []
        for i in range(teile):
            w = 2 * math.pi * i / teile
            reif.append(len(ecken))
            ecken.append((halb * math.sin(w), y, mitte + hoch * math.cos(w)))
        ringe.append(reif)
    seiten = []
    for a, b in zip(ringe, ringe[1:]):
        for i in range(teile):
            j = (i + 1) % teile
            if len(a) == 1:
                seiten.append((a[0], b[i], b[j]))
            elif len(b) == 1:
                seiten.append((a[i], a[j], b[0]))
            else:
                seiten.append((a[i], a[j], b[j], b[i]))
    netz('rumpf', ecken, seiten, s['schuppe'], eltern=leib, glatt=True)
    # Die Bauchschilde: von der Brust bis zum Becken, ein Stueck ueber den Schuppen.
    reihen, bogen, winkel = 14, 8, 0.95
    ecken = []
    for j in range(reihen + 1):
        y = -0.56 + 1.2 * j / reihen
        halb, mitte, hoch = huelle(y)
        for k in range(bogen + 1):
            w = math.pi + winkel * (2 * k / bogen - 1)
            ecken.append(((halb + 0.012) * math.sin(w), y, mitte + (hoch + 0.012) * math.cos(w)))
    netz('bauchschild', ecken, _gitter_seiten(reihen, bogen), s['bauch'], eltern=leib, glatt=True)
    # Die Schultern: zwei Muskelpakete, aus denen die Fluegel kommen.
    for seite in (1, -1):
        kugel('schulter', 0.17, s['schuppe'], ort=(seite * 0.17, -0.27, 0.13), eltern=leib,
              streckung=(0.9, 1.5, 0.85), teile=12, ringe=8)


def _zacke(s, eltern, hoch, breit):
    """Eine Hornplatte des Kamms: schmal, nach hinten geneigt."""
    return drehkoerper('zacke', [(-0.03, breit), (hoch * 0.45, breit * 0.7), (hoch, 0)], s['horn'], eltern=eltern,
                       streckung=(0.4, 1.0), teile=8)


def _kopf(s, g, leib):
    """Der Kopf: seine Hochachse zeigt zur Schnauze, +Y ist die Stirn."""
    kopf = g['kopf'] = leer('kopf', (0, 0, 0), leib)
    drehkoerper('schaedel', [(-0.13, 0), (-0.09, 0.10), (0.0, 0.135), (0.10, 0.125), (0.2, 0.09), (0.25, 0)],
                s['schuppe'], eltern=kopf, streckung=(1.0, 0.8), teile=14)
    drehkoerper('schnauze', [(0.13, 0), (0.16, 0.088), (0.3, 0.078), (0.44, 0.062), (0.52, 0.05), (0.56, 0)],
                s['schuppe'], ort=(0, 0.012, 0), eltern=kopf, streckung=(0.9, 0.62), teile=12)
    # Der Nasenruecken: eine Reihe Hoecker bis zur Stirn.
    for z, r in ((0.48, 0.022), (0.4, 0.026), (0.32, 0.03), (0.24, 0.034)):
        kugel('hoecker', r, s['arm'], ort=(0, 0.052 + (0.5 - z) * 0.05, z), eltern=kopf, teile=8, ringe=6)
    for seite in (1, -1):
        kugel('nuester', 0.016, s['nase'], ort=(seite * 0.03, 0.035, 0.53), eltern=kopf, teile=8, ringe=6)
        kugel('braue', 0.05, s['arm'], ort=(seite * 0.095, 0.078, 0.11), eltern=kopf, streckung=(0.8, 0.6, 1.6),
              teile=10, ringe=6)
        kugel('auge', 0.024, s['auge'], ort=(seite * 0.112, 0.046, 0.125), eltern=kopf, teile=8, ringe=6)
        # Zwei lange Hoerner nach hinten oben, nach aussen gespreizt.
        drehkoerper('hornstueck', [(-0.03, 0.05), (0.2, 0.036), (0.42, 0.018), (0.56, 0)], s['horn'],
                    ort=(seite * 0.075, 0.07, -0.04), drehung=(math.pi + 0.55, 0, -seite * 0.45), eltern=kopf, teile=8)
        # Darunter je ein Wangenstachel, flacher und kuerzer.
        drehkoerper('wangenstachel', [(-0.02, 0.032), (0.14, 0.018), (0.26, 0)], s['horn'],
                    ort=(seite * 0.105, -0.01, -0.03), drehung=(math.pi + 0.15, 0, -seite * 0.75), eltern=kopf, teile=6)
        # Die Fangzaehne des Oberkiefers stehen aussen, auch bei geschlossenem Maul.
        for z, lang in ((0.5, 0.05), (0.42, 0.06), (0.33, 0.045)):
            drehkoerper('zahn', [(0, 0.012), (lang, 0)], s['zahn'], ort=(seite * 0.042, -0.02, z),
                        drehung=(math.pi / 2, 0, 0), eltern=kopf, teile=6)
    kugel('gaumen', 0.05, s['rachen'], ort=(0, -0.012, 0.3), eltern=kopf, streckung=(0.75, 0.3, 4.2), teile=8, ringe=6)
    # Der Unterkiefer: geschlossen liegt er knapp unter der Schnauze.
    kiefer = g['kiefer'] = leer('kiefer', (0, -0.04, 0.04), kopf)
    drehkoerper('unterkiefer', [(-0.03, 0), (0.02, 0.072), (0.2, 0.062), (0.38, 0.046), (0.47, 0)], s['schuppe'],
                ort=(0, -0.022, 0), eltern=kiefer, streckung=(0.85, 0.42), teile=10)
    drehkoerper('kinn', [(0.0, 0), (0.05, 0.055), (0.3, 0.04), (0.44, 0)], s['bauch'], ort=(0, -0.034, 0),
                eltern=kiefer, streckung=(0.8, 0.35), teile=10)
    kugel('zunge', 0.035, s['rachen'], ort=(0, 0.004, 0.2), eltern=kiefer, streckung=(0.6, 0.3, 4.6), teile=8, ringe=6)
    for seite in (1, -1):
        for z in (0.43, 0.34):
            drehkoerper('zahn', [(0, 0.01), (0.04, 0)], s['zahn'], ort=(seite * 0.034, 0.0, z),
                        drehung=(-math.pi / 2, 0, 0), eltern=kiefer, teile=6)
    # Das Feuer: ein Strahl aus dem Maul, aussen rot, innen gelb. Im Stand ist es weg.
    flamme = g['flamme'] = leer('flamme', (0, -0.035, 0.5), kopf)
    flamme.rotation_euler = (0.18, 0, 0)
    drehkoerper('feuer', [(0.0, 0.03), (0.3, 0.13), (0.8, 0.24), (1.15, 0.22), (1.4, 0.12), (1.55, 0)],
                s['feuer_aussen'], eltern=flamme, streckung=(1.0, 0.8), teile=12)
    drehkoerper('feuerkern', [(-0.02, 0.02), (0.3, 0.075), (0.75, 0.13), (1.05, 0.08), (1.2, 0)], s['feuer_innen'],
                ort=(0, 0.015, 0), eltern=flamme, streckung=(1.0, 0.8), teile=10)
    for x, y, z, r in ((0.13, 0.05, 1.05, 0.11), (-0.12, -0.03, 1.2, 0.1), (0.03, 0.1, 1.38, 0.085),
                       (-0.05, -0.08, 0.85, 0.09)):
        kugel('lohe', r, s['feuer_aussen'], ort=(x, y, z), eltern=flamme, streckung=(1, 1, 1.5), teile=8, ringe=6)
    for teil in flamme.children:
        # Feuer wirft keinen Schatten.
        teil.visible_shadow = False
    flamme.scale = WEG


def _bein(s, g, leib, name, ort, oben, unten, dick):
    """Ein Bein aus zwei Stuecken mit einem Fuss und drei Krallen."""
    seite = name[1]
    g[name] = leer(name, ort, leib)
    glied('schenkel', oben, dick, dick * 0.6, s['schuppe'], eltern=g[name])
    g[name[0] + 'k' + seite] = leer(name + 'k', (0, 0, -oben), g[name])
    glied('lauf', unten, dick * 0.55, dick * 0.38, s['schuppe'], eltern=g[name[0] + 'k' + seite])
    fuss = g[name[0] + 'f' + seite] = leer(name + 'f', (0, 0, -unten), g[name[0] + 'k' + seite])
    kugel('fuss', dick * 0.55, s['arm'], ort=(0, -0.03, -0.02), eltern=fuss, streckung=(1.0, 1.5, 0.6), teile=10,
          ringe=6)
    for x in (-0.045, 0.0, 0.045):
        # Die Krallen zeigen nach vorn unten.
        drehkoerper('kralle', [(0, 0.022), (0.07, 0.014), (0.13, 0)], s['kralle'], ort=(x, -0.09, -0.03),
                    drehung=(math.pi / 2 + 0.5, 0, x * 5), eltern=fuss, teile=6)


def _fluegel_bauen(s, g, leib, seite):
    """Die Netze eines Fluegels - ihre Ecken setzt stellen() in jedem Bild neu."""
    punkte = _fluegel(RUHE['schlag'], RUHE['falten'], RUHE['bauch'], seite)
    name = 'l' if seite > 0 else 'r'
    g['arm_' + name] = netz('fluegelarm', _rohr_ecken(punkte['arm'], ARM_MASSE, 10), _rohr_seiten(3, 10), s['arm'],
                            eltern=leib, glatt=True)
    for nummer, linie in enumerate(punkte['finger']):
        g[f'finger_{name}{nummer}'] = netz('finger', _rohr_ecken(linie, FINGER_MASSE, 8), _rohr_seiten(3, 8),
                                           s['arm'], eltern=leib, glatt=True)
    g['aussen_' + name] = netz('flughaut', punkte['aussen'], _gitter_seiten(HAUT_U, 2 * HAUT_V), s['haut'],
                               eltern=leib, glatt=True, dicke=0.012)
    g['innen_' + name] = netz('armhaut', punkte['innen'], _gitter_seiten(HAUT_U, 2 * HAUT_V), s['leder'],
                              eltern=leib, glatt=True, dicke=0.012)
    # Am Handgelenk der Daumen: eine Kralle nach vorn.
    g['hand_' + name] = leer('hand', punkte['hand'], leib)
    kugel('handgelenk', 0.05, s['arm'], eltern=g['hand_' + name], teile=8, ringe=6)
    drehkoerper('daumen', [(0, 0.03), (0.12, 0.018), (0.22, 0)], s['kralle'], drehung=(math.pi / 2 - 0.3, 0, 0),
                eltern=g['hand_' + name], teile=6)


def bauen():
    s = stoffe()
    g = {}
    g['figur'] = leer('figur')
    g['figur'].scale = (GROESSE * MASS,) * 3
    # Wer stuerzt, liegt am Ende am Boden: dafuer ein Gelenk dort.
    g['koerper'] = leer('koerper', (0, 0, 0), g['figur'])
    leib = g['leib'] = leer('leib', (0, LEIB_Y, FLUG_HOCH), g['koerper'])
    _rumpf(s, leib)

    # Hals und Schwanz: je ein Schlauch mit Bauchschilden darunter.
    hals = _hals_linie((0.55, 0.3, -0.05))
    g['hals'] = netz('hals', _rohr_ecken(hals, HALS_MASSE, 12), _rohr_seiten(len(hals), 12), s['schuppe'],
                     eltern=leib, glatt=True)
    g['kehle'] = netz('kehle', _streifen_ecken(hals, HALS_MASSE, 0.85, 0.01), _gitter_seiten(len(hals) - 1, 4),
                      s['bauch'], eltern=leib, glatt=True)
    schwanz = _schwanz_linie((-0.1, -0.12, 0.0), 0.0, 0.0)
    g['schwanz'] = netz('schwanz', _rohr_ecken(schwanz, SCHWANZ_MASSE, 12), _rohr_seiten(len(schwanz), 12),
                        s['schuppe'], eltern=leib, glatt=True)
    g['schwanzbauch'] = netz('schwanzbauch', _streifen_ecken(schwanz, SCHWANZ_MASSE, 0.8, 0.008),
                             _gitter_seiten(len(schwanz) - 1, 4), s['bauch'], eltern=leib, glatt=True)
    g['spaten'] = leer('spaten', schwanz[-1], leib)
    drehkoerper('schwanzspaten', [(-0.04, 0.02), (0.1, 0.11), (0.2, 0.07), (0.34, 0)], s['horn'], eltern=g['spaten'],
                streckung=(1.0, 0.22), teile=10)

    # Der Kamm: Hornplatten auf Hals, Ruecken und Schwanz.
    g['halszacken'] = [(i, _zacke(s, leib, 0.14 + 0.012 * i if i < 5 else 0.16 - 0.02 * (i - 5), 0.05))
                       for i in range(2, HALS_GLIEDER)]
    for y, hoch in ((-0.4, 0.2), (-0.2, 0.22), (0.0, 0.2), (0.2, 0.18), (0.4, 0.16), (0.56, 0.14)):
        halb, mitte, halbhoch = huelle(y)
        platte = _zacke(s, leib, hoch, 0.065)
        platte.location = (0, y, mitte + halbhoch - 0.02)
        platte.rotation_euler = (-0.4, 0, 0)
    g['schwanzzacken'] = [(i, _zacke(s, leib, 0.14 - 0.011 * i, 0.05 - 0.003 * i)) for i in range(1, 10)]

    _kopf(s, g, leib)
    for seite, x in (('l', 1), ('r', -1)):
        _bein(s, g, leib, 'v' + seite, (x * 0.2, -0.38, -0.17), VORN_OBEN, VORN_UNTEN, 0.085)
        _bein(s, g, leib, 'h' + seite, (x * 0.2, 0.3, -0.1), HINTEN_OBEN, HINTEN_UNTEN, 0.125)
        _fluegel_bauen(s, g, leib, x)
    return g


# ---- Stellen --------------------------------------------------------------------

# Das Feuer, Station um Station: (Neigung des Leibs - negativ hebt die Brust -,
# der Bogen des Halses, der Kopf gegen die Waagerechte, das Maul, die Flamme).
BEREIT = (-0.2, (0.75, 0.45, -0.1), -0.2, 0.04, 0.0)
FEUER = [
    (0.0, BEREIT),
    (0.3, (-0.38, (1.25, 1.0, 0.0), -0.1, 0.25, 0.0)),        # ausholen: der Hals zurueck und hoch
    (0.44, (-0.2, (0.5, 0.2, -0.4), -0.55, 0.7, 0.25)),        # er stoesst vor, das Maul reisst auf
    (0.5, (-0.12, (0.25, -0.1, -0.55), -0.72, 0.8, 1.0)),      # der Treffer: das Feuer steht
    (0.68, (-0.12, (0.25, -0.1, -0.55), -0.7, 0.75, 0.9)),     # gehalten
    (0.82, (-0.18, (0.55, 0.25, -0.3), -0.4, 0.3, 0.0)),
    (1.0, BEREIT),
]

# Der Sturz.
STURZ_NEIGEN = [(0.0, -0.2), (0.25, 0.45), (0.6, 0.3), (0.78, 0.0), (1.0, 0.0)]
STURZ_ROLLEN = [(0.0, 0.0), (0.3, 0.25), (0.7, 0.3), (1.0, 0.1)]
STURZ_SCHLAG = [(0.0, RUHE['schlag']), (0.22, (0.95, 1.15, 1.25)), (0.66, (1.0, 1.25, 1.4)),
                (0.84, (0.25, 0.1, 0.0)), (1.0, (0.02, -0.12, -0.2))]
STURZ_FALTEN = [(0.0, 0.15), (0.3, 0.5), (0.7, 0.55), (1.0, 0.36)]
STURZ_HALS = [(0.0, (0.75, 0.45, -0.1)), (0.25, (0.9, 0.9, 0.6)), (0.65, (0.7, 0.8, 0.9)), (0.85, (0.1, -0.1, -0.1)),
              (1.0, (0.0, -0.05, 0.0))]
STURZ_KOPF = [(0.0, -0.2), (0.25, 0.7), (0.65, 0.9), (0.85, 0.0), (1.0, -0.05)]
STURZ_KIEFER = [(0.0, 0.04), (0.25, 0.6), (0.7, 0.5), (1.0, 0.3)]
STURZ_SCHWANZ = [(0.0, (-0.35, -0.5, -0.2)), (0.3, (0.3, 0.6, 0.9)), (0.68, (0.4, 0.7, 1.0)), (0.86, (0.0, -0.05, 0.0)),
                 (1.0, (0.0, 0.0, 0.0))]
# Die Beine: (oben, unten, Fuss, wie weit zur Seite gespreizt).
HAENGEN = {'v': (0.5, -1.5, 0.9, 0.2), 'h': (0.5, -1.0, 0.7, 0.25)}
ANGELEGT = {'v': (0.75, -1.7, 0.8, 0.2), 'h': (1.05, -1.5, 0.9, 0.25)}
GEKRALLT = {'v': (0.1, -1.0, 0.5, 0.3), 'h': (0.4, -0.9, 0.6, 0.3)}
GEFALLEN = {'v': (1.0, -2.0, 0.5, 1.25), 'h': (1.3, -2.2, 0.5, 1.3)}


def stellen(g, ablauf='stehen', t=0.0):
    """Bringt den Drachen in ein Bild eines Ablaufs; t laeuft von 0 bis 1."""
    p = 2 * math.pi * t
    lz, neigen, rollen = FLUG_HOCH, -0.2, 0.0
    hals, kopf, kiefer, flamme = (0.75, 0.45, -0.1), -0.2, 0.04, 0.0
    schwanz, schwung, phase = (-0.35, -0.5, -0.2), 0.08, 0.6
    schlag, falten, bauch = RUHE['schlag'], RUHE['falten'], RUHE['bauch']
    beine = HAENGEN
    boden = None
    if ablauf == 'gehen':
        # Die Spitzen laufen dem Arm nach; im Aufschlag ist der Fluegel halb
        # gefaltet, im Abschlag blaeht die Luft die Haut.
        schlag = (0.08 + 0.5 * math.sin(p), 0.08 + 0.62 * math.sin(p - 0.45), 0.1 + 0.8 * math.sin(p - 0.9))
        falten = 0.1 + 0.28 * max(0.0, math.cos(p - 0.3))
        bauch = 0.05 - 0.07 * math.cos(p - 0.5)
        lz = FLUG_HOCH - 0.07 * math.sin(p - 0.6)
        neigen = 0.06 + 0.03 * math.sin(p)
        hals, kopf = (0.45 + 0.05 * math.sin(p), 0.2, -0.1), -0.15
        schwanz, schwung, phase = (-0.08, -0.05 + 0.06 * math.sin(p - 1.0), 0.05), 0.14, p
        beine = ANGELEGT
    elif ablauf == 'angreifen':
        neigen, hals, kopf, kiefer, flamme = _weg(FEUER, t)
        # Er steht dabei in der Luft und schlaegt einmal durch.
        schlag = (0.2 + 0.45 * math.sin(p), 0.25 + 0.55 * math.sin(p - 0.45), 0.3 + 0.7 * math.sin(p - 0.9))
        falten = 0.12 + 0.25 * max(0.0, math.cos(p - 0.3))
        bauch = 0.05 - 0.07 * math.cos(p - 0.5)
        lz = FLUG_HOCH - 0.06 * math.sin(p - 0.6)
        schwanz, schwung, phase = (-0.3, -0.35 + 0.1 * math.sin(p), 0.1), 0.1, p
        beine = GEKRALLT
    elif ablauf == 'sterben':
        fall = max(0.0, min(1.0, (t - 0.12) / 0.6)) ** 2
        lz = FLUG_HOCH - (FLUG_HOCH - LIEG_HOCH) * fall
        neigen, rollen = _weg(STURZ_NEIGEN, t), _weg(STURZ_ROLLEN, t)
        schlag, falten, bauch = _weg(STURZ_SCHLAG, t), _weg(STURZ_FALTEN, t), 0.03
        hals, kopf, kiefer = _weg(STURZ_HALS, t), _weg(STURZ_KOPF, t), _weg(STURZ_KIEFER, t)
        schwanz, schwung, phase = _weg(STURZ_SCHWANZ, t), 0.08 + 0.3 * _glatt((t - 0.6) / 0.4), 0.6
        liegen = _glatt((t - 0.55) / 0.35)
        beine = {art: _zwischen(HAENGEN[art], GEFALLEN[art], liegen) for art in 'vh'}
        if t > 0.5:
            # Ab hier liegt nichts mehr tiefer als die Erde.
            boden = -lz + 0.02

    g['koerper'].location = (0, 0, 0)
    g['leib'].location = (0, LEIB_Y, lz)
    g['leib'].rotation_euler = (neigen, rollen, 0)

    linie = _hals_linie(hals, boden)
    _setzen(g['hals'], _rohr_ecken(linie, HALS_MASSE, 12))
    _setzen(g['kehle'], _streifen_ecken(linie, HALS_MASSE, 0.85, 0.01))
    for i, zacke in g['halszacken']:
        quer, hoch = _rahmen(linie, i)
        zacke.location = _plus(linie[i], _mal(hoch, HALS_MASSE[i][1] - 0.02))
        zacke.rotation_euler = (math.atan2(-hoch[1], hoch[2]) - 0.4, 0, 0)
    kopf_ort = linie[-1]
    if boden is not None:
        kopf_ort = (kopf_ort[0], kopf_ort[1], max(kopf_ort[2], boden + 0.11))
    g['kopf'].location = kopf_ort
    g['kopf'].rotation_euler = (math.pi / 2 - kopf, 0, 0)
    g['kiefer'].rotation_euler = (kiefer, 0, 0)
    g['flamme'].scale = WEG if flamme < 0.02 else (0.55 + 0.45 * flamme, 0.55 + 0.45 * flamme, flamme)

    linie = _schwanz_linie(schwanz, schwung, phase, boden)
    _setzen(g['schwanz'], _rohr_ecken(linie, SCHWANZ_MASSE, 12))
    _setzen(g['schwanzbauch'], _streifen_ecken(linie, SCHWANZ_MASSE, 0.8, 0.008))
    for i, zacke in g['schwanzzacken']:
        quer, hoch = _rahmen(linie, i)
        zacke.location = _plus(linie[i], _mal(hoch, SCHWANZ_MASSE[i][1] - 0.02))
        zacke.rotation_euler = (math.atan2(-hoch[1], hoch[2]) - 0.4, 0, 0)
    ende = _minus(linie[-1], linie[-2])
    g['spaten'].location = linie[-1]
    g['spaten'].rotation_euler = (math.atan2(ende[2], ende[1]) - math.pi / 2, 0, 0)

    for seite, name in ((1, 'l'), (-1, 'r')):
        punkte = _fluegel(schlag, falten, bauch, seite, boden)
        _setzen(g['arm_' + name], _rohr_ecken(punkte['arm'], ARM_MASSE, 10))
        for nummer, finger in enumerate(punkte['finger']):
            _setzen(g[f'finger_{name}{nummer}'], _rohr_ecken(finger, FINGER_MASSE, 8))
        _setzen(g['aussen_' + name], punkte['aussen'])
        _setzen(g['innen_' + name], punkte['innen'])
        g['hand_' + name].location = punkte['hand']
        for art in 'vh':
            oben, unten, fuss, spreiz = beine[art]
            g[art + name].rotation_euler = (oben, -seite * spreiz, 0)
            g[art + 'k' + name].rotation_euler = (unten, 0, 0)
            g[art + 'f' + name].rotation_euler = (fuss, 0, 0)

    if ablauf == 'sterben':
        # Was nach dem Sturz noch unter der Erde laege, hebt ihn so weit an.
        aufsetzen(g['koerper'], g['koerper'], nur_heben=True)


def tafel(ziel):
    szene_leeren()
    g = bauen()
    blatt = Tafel('drache', zelle=ZELLE, fuss=FUSS, ziel=ziel, knapp=True)
    # Zum Ansehen beim Bauen: '1' drei Richtungen und vier Bilder je Ablauf,
    # '2' eine Richtung mit allen Bildern.
    probe = os.environ.get('BILDER_PROBE')
    richtungen = {'1': [1, 3, 6], '2': [1]}.get(probe, list(range(RICHTUNGEN)))
    bilder = [0, 3, 4, 7] if probe == '1' else list(range(BILDER))
    for zeile, richtung in enumerate(richtungen):
        g['figur'].rotation_euler = (0, 0, math.radians(45 + 45 * richtung))
        stellen(g, 'stehen')
        blatt.bild(zeile, 0)
        for spalte, bild in enumerate(bilder):
            stellen(g, 'gehen', bild / BILDER)
            blatt.bild(zeile, 1 + spalte)
        for spalte, bild in enumerate(bilder):
            stellen(g, 'angreifen', bild / BILDER)
            blatt.bild(zeile, spalte, teil='angreifen')
        for spalte, bild in enumerate(bilder):
            # Sterben laeuft einmal: das letzte Bild ist das Ende.
            stellen(g, 'sterben', bild / (BILDER - 1))
            blatt.bild(zeile, spalte, teil='sterben')
    je_meter = GROESSE * MASS * math.cos(math.radians(30)) / math.sqrt(2) * 132
    return blatt.schreiben({
        'art': 'figur',
        'richtungen': len(richtungen),
        # Die Hoehe eines Menschen, nicht die des Drachen: der Browser bringt
        # jede Figurentafel damit auf dasselbe Mass - wie bei den Reitern.
        'hoehe': round(1.06 * math.cos(math.radians(30)) / math.sqrt(2) * 132),
        # Er fliegt: so viele Bildpunkte der Tafel haengt die Mitte des Leibs
        # ueber dem Fusspunkt. Lebensbalken und Klick gehoeren dorthin, nicht
        # an den Schatten.
        'flughoehe': round(FLUG_HOCH * je_meter),
        'ablaeufe': {
            'stehen': {'spalte': 0, 'bilder': 1},
            'gehen': {'spalte': 1, 'bilder': len(bilder)},
            'angreifen': {'spalte': 0, 'bilder': len(bilder)},
            'sterben': {'spalte': 0, 'bilder': len(bilder), 'einmal': True},
        },
    })
