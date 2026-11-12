# Das Schaf: helle Wolle aus Buckeln, dunkler Kopf und dunkle Beine. Kleiner
# als ein Mensch - der Ruecken reicht ihm bis an die Huefte.
#
# Wem es gehoert, zeigen ein Farbzeichen auf dem Ruecken, wie Schaefer es mit
# Farbe auf die Wolle setzen, und das Halsband (karte AC-16): beide in
# Spielerfarbe, das Zeichen sieht man auch von oben und von hinten.
#
# Gebaut in Metern; das Tier schaut nach -Y.
#
# Die Tafel: je Zeile eine Blickrichtung, je Spalte ein Bild - Stehen, dann
# acht Bilder Gehen. In einer eigenen Tafel der Kadaver in vier Stufen
# (einheiten AC-17): das geschlachtete Schaf liegt auf der Seite, und je
# weniger Nahrung uebrig ist, desto mehr ist davon offen.

import math
import os

from dorfbewohner import GROESSE
from formen import aufsetzen, glied, kugel, leer, quader, strang
from kette import Tafel, szene_leeren
from pferd import ring
from stoffe import einfarbig, gemustert

RICHTUNGEN = 8
BILDER = 8
STUFEN = 4                # der Kadaver: ganz, angeschnitten, halb, fast nur noch Knochen

TUCH = ('#7e7e7e', '#b4b4b4')
WEG = (0.001, 0.001, 0.001)

LEIB_HOCH = 0.56
OBEN_BEIN = 0.21
UNTEN_BEIN = 0.2
HUF = 0.035
# Wo die Beine am Leib sitzen: (x, y, z), vorn die Schultern, hinten die Hueften.
BEINE = {'vl': (0.11, -0.3, -0.1), 'vr': (-0.11, -0.3, -0.1), 'hl': (0.12, 0.3, -0.1), 'hr': (-0.12, 0.3, -0.1)}

ARTEN = {'schaf': {'zelle': (160, 112), 'fuss': (70, 70)}}


def stoffe():
    return {
        'wolle': gemustert('wolle', ('#a39a86', '#c9c1ae', '#dcd5c5'), groesse=11, detail=5, relief=1.0, fugen=0.6,
                           rau=1.0),
        'fell': gemustert('fell', ('#40372f', '#5a4f45'), groesse=30, detail=3, relief=0.3, fugen=0.5, rau=0.9),
        'huf': einfarbig('huf', '#2c2620', rau=0.6),
        'auge': einfarbig('auge', '#14100c', rau=0.3),
        'zeichen': gemustert('zeichen', TUCH, groesse=11, detail=5, relief=1.0, fugen=0.6, rau=1.0, spieler=True),
        'band': einfarbig('band', '#a0a0a0', rau=0.8, spieler=True),
        'fleisch': gemustert('fleisch', ('#7c2a2c', '#a8403f', '#bf5a52'), groesse=14, detail=4, relief=0.6,
                             fugen=0.5, rau=0.55),
        'knochen': einfarbig('knochen', '#d9d2bd', rau=0.7),
    }


def bauen(art='schaf'):
    s = stoffe()
    g = {}
    g['figur'] = leer('figur')
    g['figur'].scale = (GROESSE, GROESSE, GROESSE)
    # Wer faellt, kippt um seine Hufe: dafuer ein Gelenk am Boden.
    g['koerper'] = leer('koerper', (0, 0, 0), g['figur'])
    g['leib'] = leer('leib', (0, 0, LEIB_HOCH), g['koerper'])
    leib = g['leib']
    # Die Wolle: ein Leib und Buckel darauf.
    g['wolle'] = leer('wolle', (0, 0, 0), leib)
    kugel('wollleib', 0.27, s['wolle'], eltern=g['wolle'], streckung=(0.92, 1.7, 0.92), teile=18, ringe=12)
    for x, y, z, r in ((0.1, -0.3, 0.1, 0.17), (-0.1, -0.28, 0.11, 0.17), (0.13, 0.0, 0.1, 0.19), (-0.13, 0.03, 0.1, 0.19),
                       (0.1, 0.3, 0.08, 0.18), (-0.1, 0.31, 0.08, 0.18), (0.0, -0.14, 0.17, 0.16), (0.0, 0.42, 0.0, 0.16),
                       (0.17, -0.16, -0.06, 0.15), (-0.17, -0.16, -0.06, 0.15), (0.17, 0.18, -0.06, 0.16),
                       (-0.17, 0.18, -0.06, 0.16), (0.0, -0.4, 0.02, 0.17)):
        kugel('buckel', r, s['wolle'], ort=(x, y, z), eltern=g['wolle'], teile=10, ringe=7)
    # Das Farbzeichen: zwei Buckel auf dem Ruecken in Spielerfarbe.
    for y, r in ((0.12, 0.185), (0.31, 0.16)):
        kugel('farbzeichen', r, s['zeichen'], ort=(0, y, 0.165), eltern=g['wolle'], streckung=(1.15, 1, 0.8), teile=10,
              ringe=7)
    kugel('schwanz', 0.06, s['wolle'], ort=(0, 0.5, -0.02), eltern=g['wolle'], streckung=(0.8, 0.8, 1.5), teile=8, ringe=6)
    # Hals und Kopf, dunkel und ohne Wolle.
    g['hals'] = leer('hals', (0, -0.4, 0.1), leib)
    glied('hals', 0.16, 0.085, 0.07, s['fell'], eltern=g['hals'])
    ring('halsband', 0.085, 0.025, 0.05, s['band'], ort=(0, 0, -0.06), eltern=g['hals'], teile=12)
    g['kopf'] = leer('kopf', (0, 0, -0.17), g['hals'])
    kugel('schaedel', 0.085, s['fell'], ort=(0, 0, -0.06), eltern=g['kopf'], streckung=(0.85, 0.9, 1.6), teile=12, ringe=8)
    for x in (-1, 1):
        kugel('ohr', 0.05, s['fell'], ort=(x * 0.1, 0.02, 0.03), eltern=g['kopf'], streckung=(1.3, 0.35, 0.6), teile=8,
              ringe=5)
        kugel('auge', 0.014, s['auge'], ort=(x * 0.062, -0.05, -0.02), eltern=g['kopf'], teile=6, ringe=4)
    # Vier Beine: oben und unten ein Glied, darunter der Huf.
    for name, ort in BEINE.items():
        g['bein_' + name] = leer('bein_' + name, ort, leib)
        glied('oberbein', OBEN_BEIN, 0.05, 0.035, s['fell'], eltern=g['bein_' + name], teile=8)
        g['knie_' + name] = leer('knie_' + name, (0, 0, -OBEN_BEIN), g['bein_' + name])
        glied('unterbein', UNTEN_BEIN, 0.032, 0.026, s['fell'], eltern=g['knie_' + name], teile=8)
        quader('huf', (0.06, 0.07, HUF), s['huf'], ort=(0, -0.008, -UNTEN_BEIN - HUF / 2), eltern=g['knie_' + name],
               fase=0.01)
    # Was erst am Kadaver zu sehen ist: das offene Fleisch an der Flanke, die
    # oben liegt, und die Rippen.
    g['fleisch'] = leer('fleisch', (0.13, 0.02, 0.0), leib)
    kugel('fleisch', 0.2, s['fleisch'], eltern=g['fleisch'], streckung=(0.75, 1.5, 1.0), teile=12, ringe=8)
    # Die Rippen liegen als Boegen auf dem Fleisch und wachsen mit ihm.
    g['rippen'] = leer('rippen', (0, 0, 0), g['fleisch'])
    for y in (-0.19, -0.115, -0.04, 0.035, 0.11, 0.185):
        schmal = math.sqrt(1 - (y / 0.3) ** 2)
        bogen = [(0.15 * schmal * math.cos(w) + 0.004, y, 0.2 * schmal * math.sin(w), 0.012)
                 for w in (math.radians(grad) for grad in (-75, -50, -25, 0, 25, 50, 75))]
        strang('rippe', bogen, s['knochen'], eltern=g['rippen'])
    return g


def _glatt(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def stellen(g, art='schaf', ablauf='stehen', t=0.0):
    """Bringt das Schaf in ein Bild eines Ablaufs; t laeuft von 0 bis 1.

    `kadaver`: t ist die Stufe von 0 (eben geschlachtet) bis 1 (fast nichts mehr da).
    """
    p = 2 * math.pi * t
    liegen = 1.0 if ablauf == 'kadaver' else _glatt(t / 0.8) if ablauf == 'sterben' else 0.0
    beine = {}
    for name in BEINE:
        vorn = name[0] == 'v'
        if ablauf == 'gehen':
            # Schritt: schraeg gegenueber gehen die Beine zusammen.
            q = p + (0 if name in ('vl', 'hr') else math.pi)
            beine[name] = (-0.4 * math.sin(q), (0.55 if vorn else -0.5) * max(0.0, math.cos(q)))
        else:
            beine[name] = (0.0, 0.0)
        # Wer liegt, streckt die Beine steif von sich.
        steif = (-0.35 if vorn else 0.35, 0.0)
        beine[name] = tuple(a + (b - a) * liegen for a, b in zip(beine[name], steif))
    tiefe = 0.0
    for name, (huefte, knie) in beine.items():
        g['bein_' + name].rotation_euler = (huefte, 0, 0)
        g['knie_' + name].rotation_euler = (knie, 0, 0)
        tiefe = max(tiefe, OBEN_BEIN * math.cos(huefte) + UNTEN_BEIN * math.cos(huefte + knie))
    g['leib'].location.z = -BEINE['vl'][2] + tiefe + HUF
    nicken = 0.07 * math.sin(2 * p) if ablauf == 'gehen' else 0.0
    # Der Hals haengt nach vorn unten, der Kopf nach vorn.
    g['hals'].rotation_euler = (-2.2 + nicken + 0.5 * liegen, 0, 0)
    g['kopf'].rotation_euler = (1.25 - 0.4 * liegen, 0, 0)
    g['leib'].rotation_euler = (0, 0, 0.04 * math.sin(p) if ablauf == 'gehen' else 0)
    # Es faellt auf die rechte Seite; die linke Flanke liegt dann oben.
    g['koerper'].rotation_euler = (0, -math.pi / 2 * liegen, 0)
    g['koerper'].location = (-0.25 * liegen, 0, 0)
    if liegen > 0:
        aufsetzen(g['koerper'], g['koerper'])
    stufe = t if ablauf == 'kadaver' else 0.0
    # Je weniger Nahrung, desto weniger Wolle und desto mehr offen.
    wolle = 1 - 0.3 * stufe
    g['wolle'].scale = (wolle, 1 - 0.12 * stufe, wolle)
    offen = 0.55 + 0.75 * stufe
    g['fleisch'].scale = (offen, offen, offen) if stufe > 0 else WEG
    g['rippen'].scale = (1, 1, 1) if stufe > 0.5 else WEG


def tafel(ziel):
    szene_leeren()
    g = bauen()
    blatt = Tafel('schaf', zelle=ARTEN['schaf']['zelle'], fuss=ARTEN['schaf']['fuss'], ziel=ziel, knapp=True)
    probe = os.environ.get('BILDER_PROBE')
    richtungen = {'1': [1, 3, 6], '2': [1]}.get(probe, list(range(RICHTUNGEN)))
    bilder = [0, 3, 4, 7] if probe == '1' else list(range(BILDER))
    for zeile, richtung in enumerate(richtungen):
        g['figur'].rotation_euler = (0, 0, math.radians(45 + 45 * richtung))
        stellen(g, 'schaf', 'stehen')
        blatt.bild(zeile, 0)
        for spalte, bild in enumerate(bilder):
            stellen(g, 'schaf', 'gehen', bild / BILDER)
            blatt.bild(zeile, 1 + spalte)
        for stufe in range(STUFEN):
            stellen(g, 'schaf', 'kadaver', stufe / (STUFEN - 1))
            blatt.bild(zeile, stufe, teil='kadaver')
    return blatt.schreiben({
        'art': 'figur',
        'richtungen': len(richtungen),
        # Im Spiel ist ein Schaf mit 0,9 statt 1,3 halben Rautenbreiten
        # angesetzt; die Hoehe hier haelt den Massstab der Menschen.
        'hoehe': round(1.06 * math.cos(math.radians(30)) / math.sqrt(2) * 132 * 0.9 / 1.3),
        'ablaeufe': {
            'stehen': {'spalte': 0, 'bilder': 1},
            'gehen': {'spalte': 1, 'bilder': len(bilder)},
            'kadaver': {'spalte': 0, 'bilder': STUFEN, 'einmal': True},
        },
    })
