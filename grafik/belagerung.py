# Das Belagerungsgeraet: Ramme und Mangonel, und ihre Stufen in der Krone.
#
# Gebaut in Metern und als Ganzes auf Spielgroesse gebracht, im selben Massstab
# wie der Dorfbewohner. Das Geraet schaut nach -Y.
#
#   Ramme     ein Gehaeuse aus Bohlen auf vier Scheibenraedern, darueber ein
#             Satteldach aus Haeuten; darin haengt an zwei Seilen der Rammbock
#             mit eiserner Kappe und ragt vorn heraus. Spielerfarbe: das Tuch
#             ueber der vorderen Haelfte des Firsts und im vorderen Giebel -
#             daran sieht man, wohin sie faehrt, sonst gleicht links rechts.
#   Mangonel  ein offener Rahmen auf vier Raedern, in der Mitte das Seilbuendel,
#             das den Wurfarm spannt, vorn der Bock mit dem Polster als
#             Anschlag. Spielerfarbe: Seilbuendel, Polster, Seitenbohlen.
#
#   Belagerungsramme  laenger und hoeher, auf sechs Raedern. An den Waenden
#             haengen Schilde in Spielerfarbe, ueber die Haeute laufen
#             Eisenbaender, der Bock traegt einen Widderkopf mit Hoernern.
#   Onager    schwerer als der Mangonel und nach vorn geschlossen: eine
#             Schutzwand aus Bohlen mit einem Band in Spielerfarbe. Der Arm ist
#             mit Eisen gebunden, die Schale groesser, die Winde hat Speichen.
#
# Keine Figur, kein Pferd: die zwei einzigen Umrisse im Spiel, die Raeder haben
# und niemanden, der zieht (darstellung AC-14). Die Ramme ist zu, der Mangonel
# ein Gestell, durch das man hindurchsieht.
#
# Die Tafel: je Zeile eine Blickrichtung, je Spalte ein Bild. Stehen und Gehen
# liegen in der Haupttafel, Angreifen und Sterben je in einer eigenen. Gehen:
# die Raeder drehen sich. Angreifen: der Bock schwingt zurueck und stoesst;
# der Mangonel windet, laedt, wirft und windet wieder - ein Kreis ohne
# Stillstand, kein Bild steht doppelt da. Sterben: das Geraet bricht zusammen.
#
# Kein Modell fuer sich: ramme.py und mangonel.py rufen tafel().

import math
import os

from dorfbewohner import GROESSE
from formen import drehkoerper, kugel, leer, netz, quader, strang, tiefster_punkt
from kette import Tafel, szene_leeren
from pferd import ring
from stoffe import einfarbig, gemustert

RICHTUNGEN = 8
BILDER = 8

TUCH = ('#7e7e7e', '#b4b4b4')
QUER = (math.pi / 2, 0, 0)         # die Hochachse eines Teils zeigt dann nach vorn (-Y)
SEITE = (0, math.pi / 2, 0)        # die Hochachse eines Teils zeigt dann zur Seite

ARTEN = {
    'ramme': {'zelle': (336, 224), 'fuss': (143, 153), 'rad': 0.34, 'achsen': (-0.72, 0.72), 'spur': 0.76},
    'mangonel': {'zelle': (256, 192), 'fuss': (102, 138), 'rad': 0.32, 'achsen': (-0.72, 0.72), 'spur': 0.72},
    'belagerungsramme': {'zelle': (400, 272), 'fuss': (170, 186), 'rad': 0.36, 'achsen': (-1.02, 0, 1.02),
                         'spur': 0.86},
    'onager': {'zelle': (320, 248), 'fuss': (128, 176), 'rad': 0.38, 'achsen': (-0.86, 0.86), 'spur': 0.84},
}

# Die Ramme.
SEIL = 0.86               # so lang haengt der Bock unter dem First
BOCK_Z = 0.98
# Der Mangonel: der Arm dreht um das Seilbuendel.
DREH = (-0.12, 0.66)      # (y, z)
ARM = 1.45
GESPANNT = 0.2            # der Arm flach nach hinten
OBEN = 1.74               # am Polster


def stoffe():
    return {
        'balken': gemustert('balken', ('#3d2a1b', '#5c4028', '#73522f'), massstab=(6, 6, 6), groesse=3, detail=5,
                            relief=0.6, fugen=0.6),
        'bohle': gemustert('bohle', ('#5a4129', '#7a5a39', '#917047'), massstab=(8, 1.2, 8), groesse=3, detail=4,
                           relief=0.7, fugen=0.7),
        'stamm': gemustert('stamm', ('#5e4126', '#80603a', '#93713f'), massstab=(9, 1, 9), groesse=3, detail=4,
                           relief=0.7, fugen=0.6),
        'scheibe': gemustert('scheibe', ('#57402a', '#74583a', '#866845'), massstab=(1.2, 8, 8), groesse=3, detail=4,
                             relief=0.7, fugen=0.7),
        'haut': gemustert('haut', ('#4f3b28', '#6d5337', '#806344'), groesse=5, detail=5, relief=0.8, fugen=0.75,
                          rau=0.9),
        'eisen': gemustert('eisen', ('#4f5357', '#878c91'), groesse=20, detail=2, relief=0.15, rau=0.4, metall=0.85),
        'seil': gemustert('seil', ('#6f5d3a', '#94804f'), groesse=60, detail=2, relief=0.4, rau=0.9),
        'stein': gemustert('stein', ('#6f6a62', '#8f8a80', '#a39d90'), groesse=9, detail=5, relief=0.8, fugen=0.5),
        'tuch': gemustert('tuch', TUCH, groesse=30, detail=3, relief=0.4, fugen=0.55, rau=0.95, spieler=True),
        'buendel': gemustert('buendel', TUCH, massstab=(1, 30, 30), groesse=4, detail=2, relief=0.9, fugen=0.7,
                             rau=0.9, spieler=True),
        'bemalt': gemustert('bemalt', TUCH, massstab=(8, 1.2, 8), groesse=3, detail=4, relief=0.6, fugen=0.7,
                            rau=0.8, spieler=True),
    }


def _rad(s, g, nummer, ort, halbmesser, eltern):
    """Ein Scheibenrad aus Bohlen mit zwei Leisten und einem Eisenreifen."""
    g['rad'].append(leer(f'rad_{nummer}', ort, eltern))
    g['rad_ort'].append(ort)
    scheibe = leer('scheibe', (0, 0, 0), g['rad'][-1])
    scheibe.rotation_euler = SEITE
    aussen = 1 if ort[0] > 0 else -1
    drehkoerper('radscheibe', [(-0.045, 0), (-0.045, halbmesser - 0.01), (0.045, halbmesser - 0.01), (0.045, 0)],
                s['scheibe'], eltern=scheibe, teile=24, glatt=False)
    ring('reifen', halbmesser, 0.016, 0.1, s['eisen'], eltern=scheibe, teile=24)
    for y in (-halbmesser * 0.42, halbmesser * 0.42):
        quader('leiste', (halbmesser * 1.5, 0.07, 0.03), s['balken'], ort=(0, y, aussen * 0.055), eltern=scheibe,
               fase=0.008)
    drehkoerper('nabe', [(-0.1, 0), (-0.1, 0.05), (-0.05, 0.075), (0.05, 0.075), (0.1, 0.05), (0.1, 0)], s['balken'],
                eltern=scheibe, teile=12, glatt=False)


def _fahrgestell(s, g, art, laenge, halb):
    """Zwei Laengsbalken, zwei Achsen, vier Raeder. Gibt den Aufbau zurueck."""
    k = ARTEN[art]
    g['figur'] = leer('figur')
    g['figur'].scale = (GROESSE, GROESSE, GROESSE)
    g['aufbau'] = leer('aufbau', (0, 0, 0), g['figur'])
    a = g['aufbau']
    g['rad'], g['rad_ort'] = [], []
    z = k['rad']
    for y in k['achsen']:
        quader('achse', (2 * k['spur'] + 0.1, 0.085, 0.085), s['balken'], ort=(0, y, z), eltern=a, fase=0.02)
        for x in (-k['spur'], k['spur']):
            _rad(s, g, len(g['rad']), (x, y, z), k['rad'], g['figur'])
    for x in (-halb, halb):
        quader('laengsbalken', (0.13, laenge, 0.15), s['balken'], ort=(x, 0, z + 0.115), eltern=a, fase=0.02)
    return a


def _ramme(s):
    g = {}
    a = _fahrgestell(s, g, 'ramme', 2.3, 0.56)
    unten = ARTEN['ramme']['rad'] + 0.19
    for y in (-1.08, 1.08):
        quader('querbalken', (1.25, 0.13, 0.14), s['balken'], ort=(0, y, unten - 0.07), eltern=a, fase=0.02)
    # Das Gehaeuse: vier Pfosten, an den Seiten drei Bohlen, oben das Raehm.
    for x in (-0.56, 0.56):
        for y in (-1.05, 1.05):
            quader('pfosten', (0.12, 0.12, 0.86), s['balken'], ort=(x, y, unten + 0.43), eltern=a, fase=0.015)
        for stufe in range(3):
            quader('wandbohle', (0.045, 2.0, 0.21), s['bohle'], ort=(x * 1.05, 0, unten + 0.16 + stufe * 0.235), eltern=a,
                   fase=0.008)
        quader('raehm', (0.12, 2.36, 0.1), s['balken'], ort=(x, 0, unten + 0.9), eltern=a, fase=0.015)
    traufe, first, weit = unten + 0.88, unten + 1.56, 0.86
    quader('firstbalken', (0.1, 2.6, 0.12), s['balken'], ort=(0, 0, first - 0.09), eltern=a, fase=0.015)
    schraege = math.atan2(first - traufe, weit)
    lang = math.hypot(first - traufe, weit)
    for y in (-1.12, 0, 1.12):
        for x in (-1, 1):
            quader('sparren', (lang, 0.07, 0.07), s['balken'], ort=(x * weit / 2, y, (first + traufe) / 2 - 0.06),
                   drehung=(0, x * schraege, 0), eltern=a, fase=0.01)
    # Das Dach aus Haeuten - und was faellt, wenn die Ramme bricht.
    g['dach'] = leer('dach', (0, 0, first), a)

    def flaeche(name, stoff, halb_x, vorn, hinten, hoch, dicke):
        ecken = []
        for y in (vorn, hinten):
            for x in (-halb_x, 0, halb_x):
                ecken.append((x, y, hoch - abs(x) * (first - traufe) / weit))
        netz(name, ecken, [(0, 1, 4, 3), (1, 2, 5, 4)], stoff, eltern=g['dach'], dicke=dicke)

    flaeche('haeute', s['haut'], weit + 0.06, -1.3, 1.3, 0.0, 0.035)
    # Das Tuch ueber dem First: die Spielerfarbe, von oben und von jeder Seite
    # zu sehen. Es liegt ueber der vorderen Haelfte und haengt im vorderen
    # Giebel - so sieht man auch von der Seite, wohin die Ramme faehrt.
    flaeche('firsttuch', s['tuch'], 0.47, -1.22, 0.2, 0.04, 0.02)
    neigung = (first - traufe) / weit
    netz('giebeltuch', [(-0.52, -1.31, -0.52 * neigung), (0.52, -1.31, -0.52 * neigung), (0, -1.31, 0.02)],
         [(0, 1, 2)], s['tuch'], eltern=g['dach'], dicke=0.02)
    # Der Rammbock haengt an zwei Seilen und schwingt.
    g['bock'] = leer('bock', (0, 0, BOCK_Z), a)
    drehkoerper('stamm', [(-1.25, 0), (-1.25, 0.125), (1.42, 0.135), (1.42, 0)], s['stamm'], drehung=QUER,
                eltern=g['bock'], teile=14)
    drehkoerper('kappe', [(1.38, 0), (1.38, 0.158), (1.66, 0.158), (1.9, 0.0)], s['eisen'], drehung=QUER,
                eltern=g['bock'], teile=14, glatt=False)
    for h in (-0.9, 0.2, 1.1):
        ring('stammreif', 0.137, 0.014, 0.06, s['eisen'], ort=(0, -h, 0), drehung=QUER, eltern=g['bock'], teile=14)
    g['seile'] = []
    for y in (-0.62, 0.62):
        halter = leer('seil', (0, y, first - 0.15), a)
        drehkoerper('haengeseil', [(-SEIL, 0), (-SEIL, 0.022), (0, 0.022), (0, 0)], s['seil'], eltern=halter, teile=8)
        g['seile'].append(halter)
    return g


def _mangonel(s):
    g = {}
    a = _fahrgestell(s, g, 'mangonel', 2.2, 0.5)
    unten = ARTEN['mangonel']['rad'] + 0.19
    for y in (-1.03, 0.2, 1.03):
        quader('querbalken', (1.13, 0.13, 0.14), s['balken'], ort=(0, y, unten - 0.07), eltern=a, fase=0.02)
    # Die bemalten Seitenbohlen.
    for x in (-0.585, 0.585):
        quader('seitenbohle', (0.04, 2.0, 0.24), s['bemalt'], ort=(x, 0, unten - 0.06), eltern=a, fase=0.008)
        for y in (-0.9, 0.9):
            quader('beschlag', (0.05, 0.07, 0.26), s['eisen'], ort=(x, y, unten - 0.06), eltern=a, fase=0.006)
    # Der Bock vorn: zwei Pfosten, schraeg abgestuetzt, darauf der Querbalken mit dem Polster.
    oben = unten + 0.98
    for x in (-0.5, 0.5):
        quader('pfosten', (0.12, 0.12, 1.0), s['balken'], ort=(x, -0.42, unten + 0.48), eltern=a, fase=0.015)
        lang = math.hypot(0.95, 0.85)
        quader('strebe', (0.09, lang, 0.09), s['balken'], ort=(x, 0.06, unten + 0.45),
               drehung=(-math.atan2(0.85, 0.95), 0, 0), eltern=a, fase=0.012)
    quader('anschlag', (1.2, 0.13, 0.14), s['balken'], ort=(0, -0.42, oben), eltern=a, fase=0.02)
    drehkoerper('polster', [(-0.3, 0), (-0.3, 0.12), (-0.2, 0.15), (0.2, 0.15), (0.3, 0.12), (0.3, 0)], s['tuch'],
                ort=(0, -0.37, oben), drehung=SEITE, eltern=a, teile=12)
    # Das Seilbuendel quer durch den Rahmen, an beiden Enden ein Eisenring.
    drehkoerper('seilbuendel', [(-0.6, 0), (-0.6, 0.12), (0.6, 0.12), (0.6, 0)], s['buendel'],
                ort=(0, DREH[0], DREH[1]), drehung=SEITE, eltern=a, teile=12)
    for x in (-0.61, 0.61):
        ring('buendelring', 0.13, 0.03, 0.05, s['eisen'], ort=(x, DREH[0], DREH[1]), drehung=SEITE, eltern=a, teile=12)
    # Die Winde hinten.
    drehkoerper('winde', [(-0.55, 0), (-0.55, 0.06), (0.55, 0.06), (0.55, 0)], s['balken'], ort=(0, 0.95, unten + 0.14),
                drehung=SEITE, eltern=a, teile=10)
    for x in (-0.6, 0.6):
        quader('kurbel', (0.04, 0.05, 0.34), s['balken'], ort=(x, 0.95, unten + 0.14), drehung=(0.6, 0, 0), eltern=a,
               fase=0.01)
    # Der Wurfarm: liegt flach nach hinten, am Ende die Schale mit dem Stein.
    g['arm'] = leer('arm', (0, DREH[0], DREH[1]), a)
    drehkoerper('wurfarm', [(0.1, 0), (0.1, 0.07), (-ARM, 0.05), (-ARM, 0)], s['stamm'], drehung=QUER, eltern=g['arm'],
                teile=10)
    kugel('schale', 0.19, s['balken'], ort=(0, ARM + 0.08, 0.04), eltern=g['arm'], streckung=(1, 1, 0.55),
          weglassen=lambda x, y, z: z > 0.1)
    g['stein'] = leer('stein', (0, ARM + 0.08, 0.1), g['arm'])
    kugel('wurfstein', 0.13, s['stein'], eltern=g['stein'], streckung=(1, 0.92, 0.85), teile=10, ringe=7)
    return g


def _belagerungsramme(s):
    """Die Belagerungsramme: laenger, hoeher, auf sechs Raedern. An den
    Waenden haengen Schilde in Spielerfarbe, ueber die Haeute laufen
    Eisenbaender, und der Bock traegt einen Widderkopf."""
    g = {}
    a = _fahrgestell(s, g, 'belagerungsramme', 2.9, 0.66)
    unten = ARTEN['belagerungsramme']['rad'] + 0.19
    for y in (-1.36, 0, 1.36):
        quader('querbalken', (1.45, 0.14, 0.15), s['balken'], ort=(0, y, unten - 0.07), eltern=a, fase=0.02)
    # Das Gehaeuse: sechs Pfosten, an den Seiten vier Bohlen, oben das Raehm.
    for x in (-0.66, 0.66):
        aussen = 1 if x > 0 else -1
        for y in (-1.32, 0, 1.32):
            quader('pfosten', (0.13, 0.13, 1.0), s['balken'], ort=(x, y, unten + 0.5), eltern=a, fase=0.015)
        for stufe in range(4):
            quader('wandbohle', (0.05, 2.54, 0.215), s['bohle'], ort=(x * 1.05, 0, unten + 0.15 + stufe * 0.235),
                   eltern=a, fase=0.008)
        quader('raehm', (0.13, 2.96, 0.11), s['balken'], ort=(x, 0, unten + 1.04), eltern=a, fase=0.015)
        # Vier Schilde je Wand: die Spielerfarbe, von jeder Seite zu sehen.
        for y in (-0.96, -0.32, 0.32, 0.96):
            quader('wandschild', (0.035, 0.44, 0.56), s['bemalt'], ort=(x * 1.05 + aussen * 0.045, y, unten + 0.5),
                   eltern=a, fase=0.012)
            kugel('schildbuckel', 0.06, s['eisen'], ort=(x * 1.05 + aussen * 0.07, y, unten + 0.54), eltern=a,
                  streckung=(0.5, 1, 1), teile=8, ringe=6)
    traufe, first, weit = unten + 1.02, unten + 1.8, 0.98
    quader('firstbalken', (0.11, 3.2, 0.13), s['balken'], ort=(0, 0, first - 0.09), eltern=a, fase=0.015)
    schraege = math.atan2(first - traufe, weit)
    lang = math.hypot(first - traufe, weit)
    for y in (-1.4, -0.47, 0.47, 1.4):
        for x in (-1, 1):
            quader('sparren', (lang, 0.08, 0.08), s['balken'], ort=(x * weit / 2, y, (first + traufe) / 2 - 0.06),
                   drehung=(0, x * schraege, 0), eltern=a, fase=0.01)
    # Das Dach aus Haeuten - und was faellt, wenn die Ramme bricht.
    g['dach'] = leer('dach', (0, 0, first), a)

    def flaeche(name, stoff, halb_x, vorn, hinten, hoch, dicke):
        ecken = []
        for y in (vorn, hinten):
            for x in (-halb_x, 0, halb_x):
                ecken.append((x, y, hoch - abs(x) * (first - traufe) / weit))
        netz(name, ecken, [(0, 1, 4, 3), (1, 2, 5, 4)], stoff, eltern=g['dach'], dicke=dicke)

    flaeche('haeute', s['haut'], weit + 0.07, -1.6, 1.6, 0.0, 0.04)
    # Drei Eisenbaender quer ueber die Haeute: Brandpfeile finden keinen Halt.
    for y in (-1.05, 0.0, 1.05):
        flaeche('dachband', s['eisen'], weit + 0.085, y - 0.06, y + 0.06, 0.026, 0.02)
    # Das Tuch ueber der vorderen Haelfte des Firsts und im vorderen Giebel.
    flaeche('firsttuch', s['tuch'], 0.54, -1.5, 0.25, 0.055, 0.02)
    neigung = (first - traufe) / weit
    netz('giebeltuch', [(-0.6, -1.61, -0.6 * neigung), (0.6, -1.61, -0.6 * neigung), (0, -1.61, 0.02)],
         [(0, 1, 2)], s['tuch'], eltern=g['dach'], dicke=0.02)
    # Der Rammbock: staerker, laenger, vorn der Widderkopf.
    g['bock_z'], g['seil_lang'] = 1.12, 0.95
    g['bock'] = leer('bock', (0, 0, g['bock_z']), a)
    drehkoerper('stamm', [(-1.5, 0), (-1.5, 0.15), (1.7, 0.16), (1.7, 0)], s['stamm'], drehung=QUER,
                eltern=g['bock'], teile=14)
    drehkoerper('kappe', [(1.64, 0), (1.64, 0.19), (1.9, 0.2), (2.08, 0.15), (2.2, 0.0)], s['eisen'], drehung=QUER,
                eltern=g['bock'], teile=14, glatt=False)
    for x in (-1, 1):
        # Die Hoerner: vom Scheitel nach aussen, hinab und wieder nach vorn gerollt.
        strang('horn', [(x * 0.12, -1.86, 0.14, 0.05), (x * 0.27, -1.72, 0.2, 0.05), (x * 0.34, -1.7, 0.04, 0.042),
                        (x * 0.31, -1.88, -0.07, 0.032), (x * 0.23, -1.98, 0.02, 0.018)], s['eisen'],
               eltern=g['bock'], rund=2)
    for h in (-1.1, -0.2, 0.7, 1.4):
        ring('stammreif', 0.166, 0.016, 0.07, s['eisen'], ort=(0, -h, 0), drehung=QUER, eltern=g['bock'], teile=14)
    g['seile'] = []
    for y in (-0.8, 0.8):
        halter = leer('seil', (0, y, first - 0.16), a)
        drehkoerper('haengeseil', [(-g['seil_lang'], 0), (-g['seil_lang'], 0.026), (0, 0.026), (0, 0)], s['seil'],
                    eltern=halter, teile=8)
        g['seile'].append(halter)
    return g


def _onager(s):
    """Der Onager: schwerer als der Mangonel und nach vorn geschlossen - eine
    Schutzwand aus Bohlen deckt die Mannschaft. Der Arm ist mit Eisen
    gebunden und wirft einen groesseren Stein. Die Winkel des Arms sind die
    des Mangonels: Drehpunkt und Polster liegen im selben Verhaeltnis."""
    g = {}
    a = _fahrgestell(s, g, 'onager', 2.64, 0.6)
    unten = ARTEN['onager']['rad'] + 0.19
    dreh = (-0.14, unten + 0.18)       # (y, z) des Seilbuendels
    arm = 1.74
    for y in (-1.24, 0.24, 1.24):
        quader('querbalken', (1.35, 0.15, 0.16), s['balken'], ort=(0, y, unten - 0.08), eltern=a, fase=0.02)
    # Die bemalten Seitenbohlen, dreimal beschlagen.
    for x in (-0.7, 0.7):
        quader('seitenbohle', (0.05, 2.4, 0.3), s['bemalt'], ort=(x, 0, unten - 0.05), eltern=a, fase=0.008)
        for y in (-1.08, 0, 1.08):
            quader('beschlag', (0.06, 0.08, 0.32), s['eisen'], ort=(x, y, unten - 0.05), eltern=a, fase=0.006)
    # Der Bock vorn: zwei Pfosten, schraeg abgestuetzt, darauf der Querbalken mit dem Polster.
    oben = unten + 1.18
    for x in (-0.6, 0.6):
        quader('pfosten', (0.14, 0.14, 1.2), s['balken'], ort=(x, -0.5, unten + 0.58), eltern=a, fase=0.015)
        lang = math.hypot(1.14, 1.02)
        quader('strebe', (0.1, lang, 0.1), s['balken'], ort=(x, 0.07, unten + 0.54),
               drehung=(-math.atan2(1.02, 1.14), 0, 0), eltern=a, fase=0.012)
    quader('anschlag', (1.44, 0.15, 0.16), s['balken'], ort=(0, -0.5, oben), eltern=a, fase=0.02)
    drehkoerper('polster', [(-0.36, 0), (-0.36, 0.14), (-0.24, 0.18), (0.24, 0.18), (0.36, 0.14), (0.36, 0)], s['tuch'],
                ort=(0, -0.44, oben), drehung=SEITE, eltern=a, teile=12)
    # Die Schutzwand vor dem Bock: sieben Bohlen, in der Mitte am hoechsten,
    # zwei Eisenriegel und dazwischen ein breites Band in Spielerfarbe.
    for i in range(7):
        hoch = 1.5 - 0.08 * abs(i - 3)
        quader('schutzbohle', (0.19, 0.05, hoch), s['bohle'], ort=((i - 3) * 0.2, -0.62, unten - 0.1 + hoch / 2),
               eltern=a, fase=0.01)
    for z in (unten + 0.2, unten + 0.92):
        quader('wandriegel', (1.42, 0.035, 0.09), s['eisen'], ort=(0, -0.655, z), eltern=a, fase=0.008)
    quader('wandband', (1.38, 0.02, 0.4), s['bemalt'], ort=(0, -0.652, unten + 0.56), eltern=a, fase=0.006)
    # Das Seilbuendel quer durch den Rahmen, an beiden Enden ein Eisenring.
    drehkoerper('seilbuendel', [(-0.72, 0), (-0.72, 0.145), (0.72, 0.145), (0.72, 0)], s['buendel'],
                ort=(0, dreh[0], dreh[1]), drehung=SEITE, eltern=a, teile=12)
    for x in (-0.73, 0.73):
        ring('buendelring', 0.155, 0.035, 0.06, s['eisen'], ort=(x, dreh[0], dreh[1]), drehung=SEITE, eltern=a,
             teile=12)
    # Die Winde hinten: an jedem Ende ein Kreuz aus Speichen zum Greifen.
    drehkoerper('winde', [(-0.66, 0), (-0.66, 0.075), (0.66, 0.075), (0.66, 0)], s['balken'],
                ort=(0, 1.14, unten + 0.17), drehung=SEITE, eltern=a, teile=10)
    for x in (-0.745, 0.745):
        for w in (0.6, 0.6 + math.pi / 2):
            quader('speiche', (0.04, 0.05, 0.46), s['balken'], ort=(x, 1.14, unten + 0.17), drehung=(w, 0, 0),
                   eltern=a, fase=0.01)
    # Der Wurfarm: dreimal mit Eisen gebunden, am Ende die Schale mit Eisenrand.
    g['arm'] = leer('arm', (0, dreh[0], dreh[1]), a)
    drehkoerper('wurfarm', [(0.12, 0), (0.12, 0.085), (-arm, 0.06), (-arm, 0)], s['stamm'], drehung=QUER,
                eltern=g['arm'], teile=10)
    for h in (0.3, 0.75, 1.2):
        ring('armreif', 0.089 - 0.025 * (h + 0.12) / (arm + 0.12), 0.014, 0.06, s['eisen'], ort=(0, h, 0),
             drehung=QUER, eltern=g['arm'], teile=10)
    kugel('schale', 0.23, s['balken'], ort=(0, arm + 0.1, 0.05), eltern=g['arm'], streckung=(1, 1, 0.55),
          weglassen=lambda x, y, z: z > 0.1)
    ring('schalenrand', 0.229, 0.02, 0.03, s['eisen'], ort=(0, arm + 0.1, 0.063), eltern=g['arm'], teile=14)
    g['stein'] = leer('stein', (0, arm + 0.1, 0.13), g['arm'])
    kugel('wurfstein', 0.165, s['stein'], eltern=g['stein'], streckung=(1, 0.92, 0.85), teile=10, ringe=7)
    return g


BAU = {'ramme': _ramme, 'mangonel': _mangonel, 'belagerungsramme': _belagerungsramme, 'onager': _onager}


def bauen(art):
    return BAU[art](stoffe())


def _glatt(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def _stueck(t, punkte):
    """Zwischen Stationen (wann, Wert) weich hin und her."""
    for (t0, a), (t1, b) in zip(punkte, punkte[1:]):
        if t <= t1:
            return a + (b - a) * _glatt((t - t0) / (t1 - t0))
    return punkte[-1][1]


def stellen(g, art, ablauf, t=0.0):
    """Bringt das Geraet in ein Bild eines Ablaufs; t laeuft von 0 bis 1."""
    k = ARTEN[art]
    # Die Raeder: eine halbe Drehung je Ablauf - die zwei Leisten stehen danach wieder gleich.
    drehung = math.pi * t if ablauf == 'gehen' else 0.0
    # Der Zusammenbruch reicht bis zum letzten Bild und wird schneller, wie
    # alles, was faellt.
    fall = t * (0.5 + 0.5 * t) if ablauf == 'sterben' else 0.0
    for rad, ort in zip(g['rad'], g['rad_ort']):
        aussen = 1 if ort[0] > 0 else -1
        # Wer bricht, verliert die Raeder: sie kippen nach aussen und liegen flach.
        rad.rotation_euler = (drehung, aussen * fall * (math.pi / 2 - 0.12), 0)
        rad.location = (ort[0] + aussen * 0.3 * fall, ort[1] * (1 + 0.12 * fall),
                        0.07 + (k['rad'] - 0.07) * math.cos(fall * math.pi / 2))
    a = g['aufbau']
    a.rotation_euler = (0.1 * fall, 0.26 * fall, 0)
    a.location = (0, 0, 0)
    if fall > 0:
        # Der Aufbau sinkt, bis er am Boden liegt.
        a.location.z = -tiefster_punkt(a) / GROESSE * _glatt(t / 0.75)

    if 'bock' in g:
        lang, bock_z = g.get('seil_lang', SEIL), g.get('bock_z', BOCK_Z)
        schwung = 0.0
        if ablauf == 'gehen':
            schwung = 0.05 * math.sin(2 * math.pi * t)
        elif ablauf == 'angreifen':
            schwung = _stueck(t, [(0.0, 0.0), (0.36, 0.42), (0.5, -0.5), (0.62, -0.3), (1.0, 0.0)])
        elif ablauf == 'sterben':
            schwung = 0.3 * fall
        for seil in g['seile']:
            seil.rotation_euler = (schwung, 0, 0)
        g['bock'].location = (0, lang * math.sin(schwung), bock_z + lang * (1 - math.cos(schwung)))
        g['bock'].rotation_euler = (0, 0, 0)
        # Das Dach rutscht ab.
        g['dach'].rotation_euler = (0, 0.3 * fall, 0.12 * fall)
        g['dach'].location.x = 0.3 * fall
    else:
        arm, geladen = GESPANNT, True
        if ablauf == 'angreifen':
            # Ein Kreis ohne Stillstand: der Arm wird das letzte Stueck
            # heruntergewunden, der Stein kommt in die Schale, der Wurf, und
            # vom Polster an wird wieder gewunden.
            arm = _stueck(t, [(0.0, GESPANNT + 0.34), (0.3, GESPANNT), (0.4, GESPANNT), (0.5, OBEN),
                              (1.0, GESPANNT + 0.34)])
            geladen = 0.3 <= t < 0.44
        elif ablauf == 'sterben':
            arm = GESPANNT - 0.2 * fall
        g['arm'].rotation_euler = (arm, 0.5 * fall, 0)
        g['stein'].scale = (1, 1, 1) if geladen else (0.001, 0.001, 0.001)


def tafel(ziel, art):
    szene_leeren()
    g = bauen(art)
    blatt = Tafel(art, zelle=ARTEN[art]['zelle'], fuss=ARTEN[art]['fuss'], ziel=ziel, knapp=True)
    # Zum Ansehen beim Bauen: '1' drei Richtungen und vier Bilder je Ablauf,
    # '2' eine Richtung mit allen Bildern.
    probe = os.environ.get('BILDER_PROBE')
    richtungen = {'1': [1, 3, 6], '2': [1]}.get(probe, list(range(RICHTUNGEN)))
    bilder = [0, 3, 4, 7] if probe == '1' else list(range(BILDER))
    for zeile, richtung in enumerate(richtungen):
        g['figur'].rotation_euler = (0, 0, math.radians(45 + 45 * richtung))
        stellen(g, art, 'stehen')
        blatt.bild(zeile, 0)
        for spalte, bild in enumerate(bilder):
            stellen(g, art, 'gehen', bild / BILDER)
            blatt.bild(zeile, 1 + spalte)
        for spalte, bild in enumerate(bilder):
            stellen(g, art, 'angreifen', bild / BILDER)
            blatt.bild(zeile, spalte, teil='angreifen')
        for spalte, bild in enumerate(bilder):
            stellen(g, art, 'sterben', bild / (BILDER - 1))
            blatt.bild(zeile, spalte, teil='sterben')
    return blatt.schreiben({
        'art': 'figur',
        'richtungen': len(richtungen),
        'hoehe': round(1.06 * math.cos(math.radians(30)) / math.sqrt(2) * 132),
        'ablaeufe': {
            'stehen': {'spalte': 0, 'bilder': 1},
            'gehen': {'spalte': 1, 'bilder': len(bilder)},
            'angreifen': {'spalte': 0, 'bilder': len(bilder)},
            'sterben': {'spalte': 0, 'bilder': len(bilder), 'einmal': True},
        },
    })
