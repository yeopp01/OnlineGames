# Der Kriegswolf: die eigene Einheit des Hauses Eschenbruch (einheiten AC-45) -
# ein grosser grauer Wolf im Geschirr, schneller Nahkaempfer, der beisst.
#
# Groesser als ein echter Wolf, damit er neben den Menschen als gefaehrliches
# Tier zu lesen ist: die Schulter 0,95 m hoch, von der Nase bis zur Rute rund
# 1,9 m - der Ruecken reicht einem Mann bis ueber die Huefte, ein Pferd bleibt
# deutlich groesser. Woran man ihn erkennt: tiefe Brust und eingezogene Flanke,
# der dunkle Fellkragen im Nacken, der keilfoermige Kopf mit langer Schnauze
# und zwei stehenden Ohren, die buschige Rute. Das Fell in drei Toenen: der
# Ruecken dunkel, die Flanken grau, Bauch, Laeufe und Schnauze hell.
#
# Wem er gehoert, zeigen das breite Halsband, die kurze Schabracke ueber dem
# Ruecken und der Brustgurt davor: alle drei in Spielerfarbe und zusammen von
# jeder Seite zu sehen. Bauchgurt, Riemen und Schnallen sind Leder und Eisen.
#
# Gebaut in Metern; das Tier schaut nach -Y, rechts ist bei -X.
#
# Die Beine stehen nicht nach Winkeln, sondern nach Pfoten: jeder Ablauf sagt,
# wo der Leib ist und wo die vier Pfoten stehen, die Gelenke werden daraus
# gerechnet (_greifen). So rutscht keine Pfote, die steht, und keine steckt im
# Boden oder schwebt - auch wenn der Leib sich duckt, neigt oder vorschnellt.
#
# Die Ablaeufe:
#   stehen     ruhig, der Kopf gesenkt und vorgestreckt, die Rute haengt
#   gehen      ein schneller Trab: die Beine ueber Kreuz zusammen, dazwischen
#              schwebt er; der Leib tief, die Rute nach hinten gestreckt
#   angreifen  der Biss als Sprung: geduckt, ausholen, vorschnellen und
#              zuschnappen (bei 0,5 - dort faellt im Spiel der Schaden), halten,
#              zurueck. Die Hinterpfoten bleiben stehen.
#   sterben    er knickt ein, faellt auf die rechte Seite und bleibt liegen
#              (t von 0 bis 1, einmal)
#
# Die Tafel: je Zeile eine Blickrichtung, je Spalte ein Bild. Stehen und Gehen
# liegen in der Haupttafel, Angreifen und Sterben je in einer eigenen - der
# Browser holt sie erst, wenn jemand kaempft.

import math
import os

from dorfbewohner import GROESSE
from formen import aufsetzen, drehkoerper, glied, kugel, leer, netz, quader, strang
from kette import Tafel, szene_leeren
from pferd import ring
from stoffe import einfarbig, gemustert

RICHTUNGEN = 8
BILDER = 8                # je Ablauf

# Die Zelle: im Biss reicht die Nase 1,25 m vor den Fusspunkt, das sind 0,76
# Felder oder 71 Bildpunkte quer; liegend und mit gestreckter Rute bleibt er
# darunter. Der Schatten faellt nach rechts hinten, bei 0,95 m Hoehe bis 40
# Bildpunkte weit - rechts ist deshalb mehr Platz als links. Nach oben braucht
# er halb so viel wie ein Reiter. Geschrieben wird jede Tafel knapp.
#
# Das alles mal MASS: der Kriegswolf ist kein Wolf aus dem Wald, er steht
# einem Mann bis ueber die Huefte. In echter Groesse war er im Bild kleiner
# als ein Schaf - 241 Bildpunkte auf der Schautafel, die Grenze, ab der eine
# Figur als gezeichnet gilt, liegt bei 250 (darstellung AC-13).
MASS = 1.3
ZELLE = (376, 272)
FUSS = (162, 188)

TUCH = ('#7e7e7e', '#b4b4b4')      # hell und unbunt: der Browser faerbt es ein

BEINE = ('vl', 'vr', 'hl', 'hr')
VORN_OBEN, VORN_UNTEN = 0.31, 0.27
HINTEN_OBEN, HINTEN_UNTEN = 0.38, 0.30
PFOTE = 0.06                       # das Pfotengelenk ueber dem Boden
# Wo die Beine am Leib sitzen: (x, y, z), vorn die Schultern, hinten die Hueften.
SCHULTER = (0.105, -0.30, -0.08)
HUEFTE = (0.10, 0.28, -0.03)

STAND_HOCH = 0.715                 # Mitte des Leibs ueber dem Boden, wenn er steht
LEIB_Y = 0.05                      # der Leib steht etwas hinter der Mitte: vorn ragen Hals und Kopf
VORN_STAND = LEIB_Y + SCHULTER[1] - 0.02     # die Vorderpfoten knapp vor der Schulter
HINTEN_STAND = LEIB_Y + HUEFTE[1] + 0.15     # die Hinterpfoten hinter der Huefte: daher das Sprunggelenk

# Der Trab. Ein Gehablauf dauert im Spiel rund 0,7 s, der Wolf laeuft 1,35
# Felder je Sekunde: so weit muss ihn ein Ablauf tragen, sonst rutschen die
# Pfoten. Die Laeufe sind dafuer zu kurz, wenn immer zwei am Boden stehen -
# also steht jede Pfote nur drei Zehntel des Ablaufs, dazwischen schwebt er.
LAUFWEITE = 0.7 * 1.35 / (GROESSE * MASS)   # in Metern der Figur: knapp 1,2
AUFSATZ = 0.3                      # Anteil des Ablaufs, den eine Pfote am Boden steht
SCHRITT = LAUFWEITE * AUFSATZ      # so weit wandert sie dabei unter dem Leib nach hinten
LAUF_HOCH = 0.66                   # der Leib laeuft tiefer, als er steht: so reichen die Laeufe weit genug

# Der Biss, Station um Station: (Leib nach hinten, Leib hoch, Neigung - positiv
# senkt die Brust -, Hals, Kopf, Rute). Hals und Kopf gegen die Senkrechte in
# der Welt: 1,57 ist waagerecht nach vorn.
GEDUCKT = (0.06, 0.60, 0.20, 1.75, 1.62, 0.6)
BISS = [
    (0.0, GEDUCKT),
    (0.3, (0.16, 0.60, -0.08, 1.05, 1.5, 0.35)),      # ausholen: das Gewicht zurueck, der Kopf zurueckgenommen
    (0.5, (-0.25, 0.66, -0.30, 1.5, 1.55, 1.5)),      # der Treffer: vor und hoch, der Hals gestreckt
    (0.65, (-0.23, 0.64, -0.24, 1.58, 1.65, 1.2)),    # gehalten
    (1.0, GEDUCKT),
]
# Der Kiefer oeffnet sich im Ausholen, steht im Sprung weit offen und schnappt beim Treffer zu.
KIEFER = [(0.0, (0.05,)), (0.3, (0.5,)), (0.42, (0.85,)), (0.5, (0.3,)), (0.56, (0.1,)), (0.65, (0.1,)),
          (1.0, (0.05,))]
# Wie weit die Vorderpfoten vom Boden geloest sind und nach vorn greifen.
FREI = [(0.0, (0.0,)), (0.3, (0.0,)), (0.5, (1.0,)), (0.65, (1.0,)), (0.85, (0.0,)), (1.0, (0.0,))]
GRIFF = 0.55                       # so weit vor der Schulter liegen die Pfoten im Sprung

# Sterben: (Gelenk oben, Gelenk unten) je Bein - erst knicken alle vier ein,
# dann liegen sie locker von ihm weg.
GEKNICKT = {'vl': (0.8, -1.7), 'vr': (0.7, -1.6), 'hl': (1.0, -1.7), 'hr': (0.95, -1.6)}
LIEGT = {'vl': (-0.3, -0.5), 'vr': (-0.6, -0.2), 'hl': (0.55, -0.9), 'hr': (0.85, -0.65)}

# Der Rumpf in Spanten von vorn nach hinten: (y, halbe Breite, oben, unten).
# Vorn die tiefe Brust, dahinter steigt der Bauch zur eingezogenen Flanke.
# Alles, was auf dem Rumpf aufliegt, liest sie mit (huelle).
SPANTEN = [
    (-0.52, 0.0, 0.0, 0.0), (-0.50, 0.07, 0.08, -0.10), (-0.46, 0.115, 0.15, -0.17), (-0.40, 0.14, 0.19, -0.23),
    (-0.28, 0.16, 0.21, -0.27), (-0.12, 0.155, 0.20, -0.25), (0.05, 0.135, 0.185, -0.17),
    (0.20, 0.125, 0.18, -0.11), (0.33, 0.145, 0.185, -0.13), (0.43, 0.12, 0.165, -0.10),
    (0.49, 0.06, 0.11, -0.02), (0.52, 0.0, 0.05, 0.05),
]


def stoffe():
    return {
        'fell': gemustert('fell', ('#55575a', '#6d6f72', '#85878a'), groesse=16, detail=5, relief=0.45, fugen=0.6,
                          rau=0.9),
        'dunkel': gemustert('dunkel', ('#292a2c', '#3b3d40', '#4f5154'), groesse=20, detail=4, relief=0.7,
                            fugen=0.5, rau=0.95),
        'hell': gemustert('hell', ('#8d8a82', '#a5a299', '#bab6ab'), groesse=18, detail=4, relief=0.35, fugen=0.55,
                          rau=0.9),
        'nase': einfarbig('nase', '#17130f', rau=0.35),
        'auge': einfarbig('auge', '#d9b23c', rau=0.3),
        'zahn': einfarbig('zahn', '#e8e1cd', rau=0.4),
        'rachen': einfarbig('rachen', '#742a2c', rau=0.5),
        'leder': gemustert('leder', ('#2f2015', '#4c3522', '#5e4329'), groesse=14, detail=4, relief=0.5,
                           fugen=0.5, rau=0.65),
        'eisen': gemustert('eisen', ('#6d7176', '#a3a8ad'), groesse=20, detail=2, relief=0.15, rau=0.38,
                           metall=0.85),
        # Die Spielerfarbe: Schabracke und Brustgurt aus Tuch, das Halsband glatt.
        'tuch': gemustert('tuch', TUCH, groesse=36, detail=3, relief=0.35, fugen=0.55, rau=0.95, spieler=True),
        'band': einfarbig('band', '#a0a0a0', rau=0.8, spieler=True),
    }


def huelle(y):
    """Der Querschnitt des Rumpfs an der Stelle y (hinten ist positiv):
    (halbe Breite, Mitte, halbe Hoehe) - ein Oval um die Mitte."""
    for (y0, b0, o0, u0), (y1, b1, o1, u1) in zip(SPANTEN, SPANTEN[1:]):
        if y0 <= y <= y1:
            f = (y - y0) / (y1 - y0)
            oben, unten = o0 + (o1 - o0) * f, u0 + (u1 - u0) * f
            return b0 + (b1 - b0) * f, (oben + unten) / 2, (oben - unten) / 2
    return 0.0, 0.0, 0.0


def _rumpf(stoff, leib):
    """Der Rumpf als ein Netz ueber die Spanten, vorn und hinten eine Spitze."""
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
    netz('rumpf', ecken, seiten, stoff, eltern=leib, glatt=True)


def _auflage(name, stoff, leib, vorn, hinten, winkel, auftrag, unten=False, dicke=0.0):
    """Was auf dem Rumpf aufliegt, von `vorn` bis `hinten`: vom Ruecken aus (mit
    `unten` vom Bauch aus) je `winkel` nach beiden Seiten, `auftrag` ueber dem
    Fell. Mit dem Winkel pi wird daraus ein Gurt ganz herum."""
    bogen = max(8, round(2 * winkel / 0.2))
    reihen = max(2, round((hinten - vorn) / 0.05))
    ecken, seiten = [], []
    for j in range(reihen + 1):
        y = vorn + (hinten - vorn) * j / reihen
        halb, mitte, hoch = huelle(y)
        for k in range(bogen + 1):
            w = (math.pi if unten else 0.0) + winkel * (2 * k / bogen - 1)
            ecken.append(((halb + auftrag) * math.sin(w), y, mitte + (hoch + auftrag) * math.cos(w)))
    for j in range(reihen):
        for k in range(bogen):
            a = j * (bogen + 1) + k
            seiten.append((a, a + 1, a + bogen + 2, a + bogen + 1))
    netz(name, ecken, seiten, stoff, eltern=leib, glatt=True, dicke=dicke)


def _geschirr(s, leib):
    """Schabracke, Brustgurt und Bauchgurt - alles haengt am Leib."""
    # Die Schabracke: kurz, damit die Keulen frei bleiben und die Figur nicht
    # zur Haelfte Farbe ist (darstellung AC-21: hoechstens ein Drittel).
    _auflage('schabracke', s['tuch'], leib, -0.16, 0.17, winkel=1.75, auftrag=0.032, dicke=0.012)
    _auflage('vorderriemen', s['leder'], leib, -0.185, -0.15, winkel=1.75, auftrag=0.042, dicke=0.01)
    _auflage('bauchgurt', s['leder'], leib, -0.11, -0.05, winkel=math.pi, auftrag=0.05, dicke=0.01)
    # Je Flanke eine Schnalle auf dem Gurt, flach am Leib.
    halb, mitte, hoch = huelle(-0.08)
    w = 1.2
    for seite in (1, -1):
        quader('schnalle', (0.02, 0.08, 0.065), s['eisen'],
               ort=(seite * (halb + 0.054) * math.sin(w), -0.08, mitte + (hoch + 0.054) * math.cos(w)),
               drehung=(0, seite * (w - math.pi / 2), 0), eltern=leib, fase=0.006)
    # Der Brustgurt: von der Schabracke ueber die Schultern vor die Brust,
    # unter der Kehle durch. Er haelt die Decke, wenn der Wolf springt.
    halber = [(0.168, -0.17, 0.02), (0.172, -0.30, -0.01), (0.145, -0.42, -0.04), (0.09, -0.495, -0.055)]
    zug = halber + [(0.0, -0.535, -0.06)] + [(-x, y, z) for x, y, z in reversed(halber)]
    strang('brustgurt', [(x, y, z, 0.024) for x, y, z in zug], s['tuch'], eltern=leib)


def bauen():
    s = stoffe()
    g = {}
    g['figur'] = leer('figur')
    g['figur'].scale = (GROESSE * MASS,) * 3
    # Wer faellt, kippt um seine Pfoten: dafuer ein Gelenk am Boden.
    g['koerper'] = leer('koerper', (0, 0, 0), g['figur'])
    g['leib'] = leer('leib', (0, LEIB_Y, STAND_HOCH), g['koerper'])
    leib = g['leib']

    # Der Rumpf: grau, darueber der dunkle Ruecken, darunter der helle Bauch.
    _rumpf(s['fell'], leib)
    _auflage('rueckenfell', s['dunkel'], leib, -0.46, 0.5, winkel=0.8, auftrag=0.012)
    _auflage('bauchfell', s['hell'], leib, -0.46, 0.46, winkel=1.0, auftrag=0.01, unten=True)
    kugel('widerrist', 0.13, s['dunkel'], ort=(0, -0.30, 0.135), eltern=leib, streckung=(0.85, 1.5, 0.78), teile=12,
          ringe=8)
    _geschirr(s, leib)

    # Der Hals: kraeftig, nach vorn getragen. Seine Hochachse zeigt zum Kopf,
    # +Y ist der Nacken, -Y die Kehle.
    g['hals'] = leer('hals', (0, -0.38, 0.09), leib)
    hals = g['hals']
    drehkoerper('halsstueck', [(-0.12, 0), (-0.08, 0.12), (0.0, 0.15), (0.12, 0.13), (0.24, 0.105), (0.31, 0.092),
                               (0.34, 0)], s['fell'], eltern=hals, streckung=(0.78, 1.0), teile=16)
    # Der Fellkragen: dunkel im Nacken, grau an den Seiten. Er endet vor dem
    # Halsband, sonst laege die Spielerfarbe darunter.
    kugel('kragen', 0.13, s['dunkel'], ort=(0, 0.055, 0.03), eltern=hals, streckung=(1.05, 0.95, 1.25), teile=12,
          ringe=8)
    kugel('kragen', 0.1, s['dunkel'], ort=(0, 0.07, 0.11), eltern=hals, streckung=(1.0, 0.95, 1.0), teile=12, ringe=8)
    for x in (-0.06, 0.06):
        kugel('kragen', 0.09, s['fell'], ort=(x, -0.01, 0.06), eltern=hals, streckung=(1.0, 1.0, 1.2), teile=10,
              ringe=7)
    ring('halsband', 0.118, 0.026, 0.08, s['band'], ort=(0, 0, 0.235), eltern=hals, streckung=(0.78, 1.0), teile=16)

    # Der Kopf: ein Keil. Seine Hochachse zeigt zur Nase, +Y ist die Stirn.
    g['kopf'] = leer('kopf', (0, 0, 0.30), hals)
    kopf = g['kopf']
    drehkoerper('schaedel', [(-0.09, 0), (-0.06, 0.08), (0.0, 0.105), (0.07, 0.1), (0.13, 0.075), (0.17, 0.055),
                             (0.2, 0)], s['fell'], eltern=kopf, streckung=(0.95, 0.85), teile=14)
    drehkoerper('fang', [(0.1, 0), (0.12, 0.058), (0.2, 0.05), (0.3, 0.042), (0.35, 0.036), (0.37, 0)], s['hell'],
                ort=(0, 0.004, 0), eltern=kopf, streckung=(0.85, 0.7), teile=12)
    kugel('nase', 0.024, s['nase'], ort=(0, 0.014, 0.368), eltern=kopf, streckung=(1.1, 0.9, 0.8), teile=8, ringe=6)
    for seite in (1, -1):
        # Das Ohr steht auf dem Schaedel, flach nach vorn offen und leicht nach aussen geneigt.
        drehkoerper('ohr', [(-0.02, 0.05), (0.05, 0.042), (0.15, 0)], s['dunkel'], ort=(seite * 0.06, 0.055, -0.01),
                    drehung=(-math.pi / 2 - 0.2, 0, -seite * 0.25), eltern=kopf, streckung=(1.0, 0.35), teile=8)
        kugel('auge', 0.016, s['auge'], ort=(seite * 0.058, 0.057, 0.09), eltern=kopf, teile=8, ringe=6)
        # Die Fangzaehne stehen aussen neben dem Unterkiefer, auch bei geschlossenem Maul.
        drehkoerper('fangzahn', [(0, 0.009), (0.04, 0)], s['zahn'], ort=(seite * 0.028, -0.012, 0.32),
                    drehung=(math.pi / 2, 0, 0), eltern=kopf, teile=6)
    # Der Unterkiefer: geschlossen liegt er knapp im Fang, die Zunge ganz.
    g['kiefer'] = leer('kiefer', (0, -0.03, 0.09), kopf)
    drehkoerper('unterkiefer', [(-0.03, 0), (0.0, 0.04), (0.1, 0.034), (0.21, 0.026), (0.245, 0)], s['hell'],
                ort=(0, -0.014, 0), eltern=g['kiefer'], streckung=(0.85, 0.5), teile=10)
    kugel('zunge', 0.03, s['rachen'], ort=(0, 0.006, 0.12), eltern=g['kiefer'], streckung=(0.6, 0.3, 2.6), teile=8,
          ringe=6)

    # Die Rute: buschig, in der Mitte am dicksten, die Spitze dunkel.
    g['rute'] = leer('rute', (0, 0.49, 0.06), leib)
    drehkoerper('rute', [(0.04, 0), (0.0, 0.045), (-0.14, 0.075), (-0.32, 0.088), (-0.46, 0.062), (-0.56, 0)],
                s['fell'], eltern=g['rute'], teile=12)
    kugel('rutenspitze', 0.06, s['dunkel'], ort=(0, 0, -0.48), eltern=g['rute'], streckung=(1, 1, 1.5), teile=10,
          ringe=7)

    # Vier Laeufe: oben grau, unten hell, darunter die Pfote.
    for seite, x in (('l', 1), ('r', -1)):
        g['v' + seite] = leer('v' + seite, (x * SCHULTER[0], SCHULTER[1], SCHULTER[2]), leib)
        glied('oberarm', VORN_OBEN, 0.07, 0.044, s['fell'], eltern=g['v' + seite])
        g['vk' + seite] = leer('vk' + seite, (0, 0, -VORN_OBEN), g['v' + seite])
        glied('unterarm', VORN_UNTEN, 0.042, 0.032, s['hell'], eltern=g['vk' + seite])
        g['vf' + seite] = leer('vf' + seite, (0, 0, -VORN_UNTEN), g['vk' + seite])
        g['h' + seite] = leer('h' + seite, (x * HUEFTE[0], HUEFTE[1], HUEFTE[2]), leib)
        glied('keule', HINTEN_OBEN, 0.105, 0.045, s['fell'], eltern=g['h' + seite])
        g['hk' + seite] = leer('hk' + seite, (0, 0, -HINTEN_OBEN), g['h' + seite])
        glied('lauf', HINTEN_UNTEN, 0.04, 0.032, s['hell'], eltern=g['hk' + seite])
        g['hf' + seite] = leer('hf' + seite, (0, 0, -HINTEN_UNTEN), g['hk' + seite])
        for bein in ('vf', 'hf'):
            # Die Sohle liegt genau PFOTE unter dem Gelenk.
            kugel('pfote', 0.062, s['hell'], ort=(0, -0.028, -0.026), eltern=g[bein + seite],
                  streckung=(0.95, 1.35, 0.55), teile=10, ringe=6)
    return g


def _glatt(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def _zwischen(a, b, t):
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def _weg(stationen, t):
    """Zwischen Haltungen: `stationen` ist eine Liste (wann, Werte), t liegt
    dazwischen. Weich von einer zur naechsten."""
    for (t0, a), (t1, b) in zip(stationen, stationen[1:]):
        if t <= t1:
            return _zwischen(a, b, _glatt((t - t0) / (t1 - t0)))
    return stationen[-1][1]


def _gelenk(vorn, ly, lz, neigen):
    """Wo Schulter oder Huefte liegt, wenn der Leib bei (ly, lz) steht und um
    `neigen` geneigt ist: (wie weit hinten, wie hoch)."""
    _, y, z = SCHULTER if vorn else HUEFTE
    return ly + y * math.cos(neigen) - z * math.sin(neigen), lz + y * math.sin(neigen) + z * math.cos(neigen)


def _greifen(vorn, dy, dz):
    """Die Winkel (oben, unten) eines Beins, dessen Pfotengelenk um `dy` nach
    hinten und `dz` nach oben vom Gelenk am Leib entfernt liegt - gemessen im
    Leib. Das mittlere Gelenk zeigt nach hinten: vorn der Ellbogen, hinten das
    Sprunggelenk. Was zu weit weg liegt, erreicht das gestreckte Bein nicht
    ganz; die Pfote bleibt dann ueber dem Ziel, nie darunter."""
    l1, l2 = (VORN_OBEN, VORN_UNTEN) if vorn else (HINTEN_OBEN, HINTEN_UNTEN)
    weit = max((l1 - l2) * 1.05, min(math.hypot(dy, dz), (l1 + l2) * 0.998))
    richtung = math.atan2(dy, -dz)
    a = math.acos((l1 * l1 + weit * weit - l2 * l2) / (2 * l1 * weit))
    b = math.acos((l2 * l2 + weit * weit - l1 * l1) / (2 * l2 * weit))
    return richtung + a, -(a + b)


def stellen(g, ablauf='stehen', t=0.0):
    """Bringt den Wolf in ein Bild eines Ablaufs; t laeuft von 0 bis 1."""
    p = 2 * math.pi * t
    # Der Leib: wie weit hinten, wie hoch, wie geneigt (positiv senkt die Brust).
    ly, lz, neigen = LEIB_Y, STAND_HOCH, 0.0
    # Die Pfotengelenke: (wie weit hinten, wie hoch ueber ihrem Platz am Boden).
    pfoten = {bein: (VORN_STAND if bein[0] == 'v' else HINTEN_STAND, 0.0) for bein in BEINE}
    # Hals und Kopf gegen die Senkrechte, der Kiefer gegen den Kopf.
    hals, kopf, kiefer = 1.4, 1.85, 0.03
    rute = (0.7, 0.0)                 # nach hinten, zur Seite
    knicken, liegen = 0.0, 0.0
    if ablauf == 'gehen':
        for bein in BEINE:
            vorn = bein[0] == 'v'
            # Ueber Kreuz: hinten links mit vorn rechts, dann die anderen zwei.
            # Bei t = 0 steht das erste Paar mitten im Tritt; die Bilder 2 und
            # 6 fallen in die Schwebe.
            takt = (t + (0.0 if bein in ('hl', 'vr') else 0.5) + AUFSATZ / 2) % 1.0
            mitte = VORN_STAND if vorn else HINTEN_STAND - 0.09
            if takt < AUFSATZ:
                # Am Boden wandert die Pfote so schnell nach hinten, wie der Wolf laeuft.
                pfoten[bein] = (mitte + SCHRITT * (takt / AUFSATZ - 0.5), 0.0)
            else:
                schwung = (takt - AUFSATZ) / (1 - AUFSATZ)
                pfoten[bein] = (mitte + SCHRITT / 2 * math.cos(math.pi * schwung),
                                (0.13 if vorn else 0.1) * math.sin(math.pi * schwung))
        # Der Ruecken federt: am tiefsten mitten im Tritt, am hoechsten in der Schwebe.
        lz = LAUF_HOCH - 0.012 * math.cos(2 * p)
        neigen = 0.02 * math.sin(2 * p + 0.6)
        hals, kopf = 1.52 + 0.03 * math.sin(2 * p), 1.78
        rute = (1.3 + 0.06 * math.sin(2 * p), 0.1 * math.sin(p))
    elif ablauf == 'angreifen':
        ly, lz, neigen, hals, kopf, schweif = _weg(BISS, t)
        ly += LEIB_Y
        kiefer = _weg(KIEFER, t)[0]
        frei = _weg(FREI, t)[0]
        rute = (schweif, 0.0)
        # Die Hinterpfoten bleiben stehen, eine halbe Pfote versetzt: aus
        # ihnen schnellt er vor, und dorthin kommt er zurueck.
        pfoten['hl'] = (HINTEN_STAND + 0.025, 0.0)
        pfoten['hr'] = (HINTEN_STAND - 0.025, 0.0)
        schulter_y, schulter_z = _gelenk(True, ly, lz, neigen)
        for bein, steht, vor in (('vl', VORN_STAND - 0.02, 1.15), ('vr', VORN_STAND + 0.02, 0.95)):
            # Im Sprung greifen die Vorderbeine gestreckt nach vorn - `vor`
            # gegen die Senkrechte -, sonst stehen die Pfoten fest.
            y = schulter_y - GRIFF * math.sin(vor)
            hub = schulter_z - GRIFF * math.cos(vor) - PFOTE
            pfoten[bein] = (steht + (y - steht) * frei, hub * frei)
    elif ablauf == 'sterben':
        # Der Fall reicht bis zum letzten Bild: ein Bild, in dem er schon
        # liegt, stuende sonst doppelt auf der Tafel.
        knicken = _glatt(t / 0.4)
        liegen = _glatt((t - 0.15) / 0.85)
        hals, kopf, kiefer = 1.4 + 0.25 * knicken + 0.1 * liegen, 1.85 + 0.25 * knicken, 0.03 + 0.25 * liegen
        rute = (0.7 + 0.4 * liegen, 0.2 * liegen)
    else:
        # Im Stand stehen die Pfoten nicht in Reih und Glied.
        pfoten['vl'] = (VORN_STAND - 0.03, 0.0)
        pfoten['hr'] = (HINTEN_STAND + 0.06, 0.0)

    for bein, (y, hub) in pfoten.items():
        vorn = bein[0] == 'v'
        gelenk_y, gelenk_z = _gelenk(vorn, ly, lz, neigen)
        # Vom Gelenk zur Pfote: erst in der Welt, dann im geneigten Leib.
        wy, wz = y - gelenk_y, PFOTE + hub - gelenk_z
        oben, unten = _greifen(vorn, wy * math.cos(neigen) + wz * math.sin(neigen),
                               -wy * math.sin(neigen) + wz * math.cos(neigen))
        if ablauf == 'sterben':
            oben, unten = _zwischen(_zwischen((oben, unten), GEKNICKT[bein], knicken), LIEGT[bein], liegen)
        g[bein].rotation_euler = (oben, 0, 0)
        g[bein[0] + 'k' + bein[1]].rotation_euler = (unten, 0, 0)
        # Die Pfote liegt flach, wie auch Bein und Leib stehen; gehoben oder
        # tot haengt sie mit den Zehen nach unten.
        haengen = 0.6 * min(1.0, hub / 0.1) + 0.4 * liegen
        g[bein[0] + 'f' + bein[1]].rotation_euler = (haengen - (oben + unten + neigen), 0, 0)

    g['leib'].location = (0, ly, lz)
    g['leib'].rotation_euler = (neigen, 0, 0)
    # Liegt er, sinken Kopf und Rute zur Seite auf den Boden.
    g['hals'].rotation_euler = (hals - neigen, 0, -0.25 * liegen)
    g['kopf'].rotation_euler = (kopf - hals, 0, 0)
    g['kiefer'].rotation_euler = (kiefer, 0, 0)
    g['rute'].rotation_euler = (rute[0], 0, rute[1])
    # Er faellt auf die rechte Seite, um seine Pfoten; der Versatz haelt ihn
    # dabei ueber dem Fusspunkt.
    g['koerper'].rotation_euler = (0, -math.pi / 2 * liegen, 0)
    g['koerper'].location = (0.3 * liegen, 0, 0)
    if ablauf == 'sterben':
        # Wer einknickt und faellt, liegt auf, womit er eben aufliegt.
        aufsetzen(g['koerper'], g['koerper'])


def tafel(ziel):
    szene_leeren()
    g = bauen()
    blatt = Tafel('kriegswolf', zelle=ZELLE, fuss=FUSS, ziel=ziel, knapp=True)
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
    return blatt.schreiben({
        'art': 'figur',
        'richtungen': len(richtungen),
        # Die Hoehe eines Menschen, nicht die des Wolfs: der Browser bringt
        # jede Figurentafel damit auf dasselbe Mass - wie bei den Reitern.
        'hoehe': round(1.06 * math.cos(math.radians(30)) / math.sqrt(2) * 132),
        'ablaeufe': {
            'stehen': {'spalte': 0, 'bilder': 1},
            'gehen': {'spalte': 1, 'bilder': len(bilder)},
            'angreifen': {'spalte': 0, 'bilder': len(bilder)},
            'sterben': {'spalte': 0, 'bilder': len(bilder), 'einmal': True},
        },
    })
