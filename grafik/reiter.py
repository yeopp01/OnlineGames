# Die Reiter: Spaeherreiter und Ritter - ein Mensch im Sattel auf dem Pferd
# aus pferd.py.
#
# Der Mensch ist derselbe Gliedermann wie der Dorfbewohner (gleiche Masse,
# gleiche Gelenke), nur anders gekleidet und sitzend. Gebaut in Metern; das
# Pferd schaut nach -Y, die rechte Hand des Reiters ist bei -X.
#
#   Spaeherreiter  ein Brauner, leicht gesattelt; der Reiter im gesteppten
#                  Wams mit Nasalhelm, Rundschild und Schwert. Spielerfarbe:
#                  Wams und Satteldecke.
#   Ritter         ein Schimmel unter einer langen Decke; der Reiter im
#                  Kettenhemd mit Topfhelm, Wappenschild und Lanze.
#                  Spielerfarbe: Waffenrock, Schild, Wimpel und der Saum der
#                  Decke - nicht die ganze Decke, sonst waere die Figur zur
#                  Haelfte Farbe (darstellung AC-21: hoechstens ein Drittel).
#
# Die Tafel: je Zeile eine Blickrichtung, je Spalte ein Bild. Stehen und
# Gehen (ein Trab) liegen in der Haupttafel, Angreifen und Sterben je in
# einer eigenen - der Browser holt sie erst, wenn jemand kaempft.
#
# Kein Modell fuer sich: spaeherreiter.py und ritter.py rufen tafel().

import math
import os

import pferd
from dorfbewohner import GROESSE, KNOECHEL, OBERSCHENKEL, UNTERSCHENKEL
from formen import aufsetzen, drehkoerper, glied, kugel, leer, netz, quader, strang
from kette import Tafel, szene_leeren
from stoffe import einfarbig, gemustert

RICHTUNGEN = 8
BILDER = 8                # je Ablauf

PFERD_Y = 0.12            # der Leib steht etwas hinter der Mitte: vorn ragen Hals und Kopf
SITZ = (-0.05, 0.47)      # das Becken des Reiters ueber der Mitte des Leibs: (nach hinten, nach oben)

ARTEN = {
    # spreiz: wie weit die Schenkel um den Leib greifen (kippen, drehen).
    # zelle, fuss: die Lanze des Ritters braucht mehr Platz als ein Schwert.
    'spaeherreiter': {'fell': 'braun', 'mass': 1.0, 'breite': 0.84, 'spreiz': (0.25, 0.5),
                      'zelle': (288, 240), 'fuss': (128, 176)},
    'ritter': {'fell': 'schimmel', 'mass': 1.07, 'breite': 0.9, 'spreiz': (0.32, 0.62),
               'zelle': (352, 304), 'fuss': (160, 224)},
}

TUCH = ('#7e7e7e', '#b4b4b4')      # hell und unbunt: der Browser faerbt es ein


def stoffe(art):
    s = pferd.stoffe(ARTEN[art]['fell'])
    s.update({
        'haut': einfarbig('haut', '#c08d68', rau=0.65),
        'bart': einfarbig('bart', '#3f2a1c', rau=0.95),
        'auge_m': einfarbig('auge_m', '#1c1612', rau=0.4),
        'hose': gemustert('hose', ('#3a3026', '#52453a'), groesse=30, detail=3, relief=0.3, fugen=0.5),
        'stiefel': gemustert('stiefel', ('#3f2c1d', '#5e432b', '#70522f'), groesse=14, detail=4, relief=0.5,
                             fugen=0.5, rau=0.7),
        'holz': gemustert('holz', ('#6b4a2c', '#8c6638'), massstab=(8, 8, 1), groesse=4, relief=0.5),
        'eisen': gemustert('eisen', ('#6d7176', '#a3a8ad'), groesse=20, detail=2, relief=0.15, rau=0.38,
                           metall=0.85),
        'klinge': gemustert('klinge', ('#8b9096', '#c3c8cd'), groesse=12, detail=2, relief=0.05, rau=0.28,
                            metall=0.9),
        'dunkel': einfarbig('dunkel', '#0e0d0c', rau=0.9),
        # Das Tuch in Spielerfarbe: Wams oder Waffenrock, Decke, Schild, Wimpel.
        'tuch': gemustert('tuch', TUCH, groesse=36, detail=3, relief=0.35, fugen=0.55, rau=0.95, spieler=True),
        'steppung': gemustert('steppung', TUCH, massstab=(1, 1, 9), groesse=7, detail=2, relief=0.8, fugen=0.6,
                              rau=0.95, spieler=True),
    })
    if art == 'ritter':
        s.update({
            # Kettengeflecht: feines, hartes Korn in dunklem Eisen.
            'kette': gemustert('kette', ('#3f4347', '#73787d'), groesse=120, detail=2, relief=0.7, fugen=0.5,
                               rau=0.5, metall=0.75),
            # Die Decke des Schlachtrosses: ungefaerbtes, schweres Leinen.
            'leinen': gemustert('leinen', ('#9c937c', '#aaa189', '#b6ad95'), groesse=70, detail=3, relief=0.25,
                                fugen=0.55, rau=0.95),
        })
    else:
        s.update({
            'aermel': gemustert('aermel', ('#5a4a35', '#77644a'), massstab=(1, 1, 8), groesse=8, detail=2,
                                relief=0.7, fugen=0.6, rau=0.95),
            'schildleder': gemustert('schildleder', ('#5b4630', '#7b6244', '#8d7352'), groesse=9, detail=4,
                                     relief=0.4, fugen=0.5, rau=0.8),
        })
    return s


# ---- das Sattelzeug -----------------------------------------------------------

def _decke(name, stoff, saum, leib, breite, vorn, hinten, tiefe, band=0.0, welle=0.0, auftrag=0.028):
    """Ein Tuch ueber dem Leib: oben liegt es auf, an den Seiten haengt es bis
    `tiefe` unter die Mitte. `saum` faerbt die untersten `band` Meter anders."""
    bogen = 6
    reihen = max(4, round((hinten - vorn) / 0.06))
    je_seite = bogen + 3
    ecken, haupt, rand = [], [], []
    for j in range(reihen + 1):
        y = vorn + (hinten - vorn) * j / reihen
        r = max(0.06, pferd.huelle(y) + auftrag)
        t = tiefe + welle * math.sin(y * 11)
        unten = max(band, 0.02)
        for seite in (1, -1):
            for k in range(bogen + 1):
                w = math.pi / 2 * k / bogen
                ecken.append((seite * r * breite * math.sin(w), y, r * math.cos(w)))
            ecken.append((seite * (r * breite + 0.012), y, -(t - unten)))
            ecken.append((seite * (r * breite + 0.022), y, -t))
    for j in range(reihen):
        for h in range(2):
            for k in range(bogen + 2):
                a = j * 2 * je_seite + h * je_seite + k
                b = a + 2 * je_seite
                (rand if k == bogen + 1 and saum is not None else haupt).append((a, a + 1, b + 1, b))
    netz(name, ecken, haupt, stoff, eltern=leib, glatt=True, dicke=0.012)
    if rand:
        netz(name + '_saum', ecken, rand, saum, eltern=leib, glatt=True, dicke=0.012)


def _sattel(s, g, art):
    leib = g['leib']
    breite = ARTEN[art]['breite']
    laengs = (math.pi / 2, 0, 0)
    if art == 'ritter':
        _decke('schabracke', s['leinen'], s['tuch'], leib, breite, -0.6, 0.64, tiefe=0.5, band=0.14, welle=0.025)
        # Die Rossstirn: eine Eisenplatte auf dem Nasenruecken.
        quader('rossstirn', (0.13, 0.022, 0.3), s['eisen'], ort=(0, 0.128, 0.2), drehung=(-0.06, 0, 0),
               eltern=g['kopf'], fase=0.008)
        hoch = 0.028
    else:
        _decke('satteldecke', s['tuch'], None, leib, breite, -0.3, 0.24, tiefe=0.15)
        pferd.ring('gurt', pferd.LEIB_HALB + 0.012, 0.012, 0.06, s['leder'], ort=(0, -0.1, 0), drehung=laengs,
                   eltern=leib, streckung=(breite, 1.0), teile=24)
        # Das Vorderzeug: ein Riemen um die Brust haelt den Sattel.
        pferd.ring('vorderzeug', 0.3, 0.012, 0.045, s['leder'], ort=(0, -0.44, -0.02), drehung=(math.pi / 2 - 0.5, 0, 0),
                   eltern=leib, streckung=(breite, 1.0), teile=20)
        hoch = 0.028
    oben = pferd.LEIB_HALB + hoch
    kugel('sattel', 0.21, s['leder'], ort=(0, SITZ[0], oben), eltern=leib, streckung=(0.78, 1.25, 0.3))
    kugel('zwiesel', 0.075, s['leder'], ort=(0, SITZ[0] - 0.24, oben + 0.06), eltern=leib, streckung=(1.2, 0.6, 1.0),
          teile=10, ringe=6)
    kugel('efter', 0.1, s['leder'], ort=(0, SITZ[0] + 0.24, oben + 0.07), eltern=leib, streckung=(1.5, 0.5, 1.0),
          teile=10, ringe=6)
    # Die Zuegel: vom Maul zu den Haenden ueber dem Widerrist. Sie haengen am
    # Hals - nickt der Kopf, bleiben sie nah genug am Maul.
    g['zuegel'] = leer('zuegel', (0, 0, 0), g['hals'])
    for x in (-1, 1):
        strang('zuegel', [(x * 0.06, -0.4, 0.76, 0.009), (x * 0.075, -0.02, 0.4, 0.009), (x * 0.05, 0.36, 0.05, 0.009)],
               s['leder'], eltern=g['zuegel'], rund=2)


# ---- der Mensch ---------------------------------------------------------------

def _mensch(s, m, eltern, art):
    ritter = art == 'ritter'
    m['reiter'] = leer('reiter', (0, 0, 0), eltern)
    m['becken'] = leer('becken', (0, 0, 0), m['reiter'])
    m['rumpf'] = leer('rumpf', (0, 0, 0), m['becken'])
    rumpf = m['rumpf']
    arm = s['kette'] if ritter else s['aermel']
    bein = s['kette'] if ritter else s['hose']
    schuh = s['eisen'] if ritter else s['stiefel']

    # Der Rumpf: kurz, wer sitzt, hat keinen Rock unter sich.
    drehkoerper('rock', [(0.55, 0), (0.54, 0.085), (0.51, 0.17), (0.47, 0.232), (0.35, 0.226), (0.15, 0.204),
                         (0.05, 0.21), (-0.07, 0.232), (-0.15, 0.2), (-0.12, 0)],
                s['tuch'] if ritter else s['steppung'], eltern=rumpf, streckung=(1, 0.7), teile=18)
    drehkoerper('guertel', [(0.115, 0.204), (0.115, 0.219), (0.065, 0.223), (0.065, 0.208)], s['leder'],
                eltern=rumpf, streckung=(1, 0.7), teile=18)
    if ritter:
        # Das Kettenhemd schaut unter dem Waffenrock hervor und liegt als
        # Kragen auf den Schultern.
        drehkoerper('hemdsaum', [(-0.05, 0.236), (-0.2, 0.25), (-0.2, 0.2), (-0.1, 0)], s['kette'], eltern=rumpf,
                    streckung=(1, 0.72), teile=18)
        drehkoerper('kragen', [(0.64, 0.085), (0.58, 0.13), (0.5, 0.25), (0.44, 0.262), (0.44, 0.2), (0.46, 0)],
                    s['kette'], eltern=rumpf, streckung=(1, 0.76), teile=18)

    # Der Kopf.
    m['kopf'] = leer('kopf', (0, 0, 0.57), rumpf)
    kopf = m['kopf']
    glied('hals', 0.08, 0.05, 0.055, s['kette'] if ritter else s['haut'], eltern=kopf, ort=(0, 0, 0.03))
    kugel('schaedel', 0.118, s['haut'], ort=(0, 0, 0.125), eltern=kopf, streckung=(0.9, 1.0, 1.14))
    if ritter:
        # Der Topfhelm: oben flach, vorn ein Sehschlitz und ein Grat.
        drehkoerper('topfhelm', [(-0.035, 0), (-0.035, 0.12), (0.0, 0.13), (0.2, 0.134), (0.262, 0.128),
                                 (0.284, 0.095), (0.29, 0)], s['eisen'], eltern=kopf, streckung=(0.92, 1.0),
                    teile=18)
        quader('sehschlitz', (0.19, 0.03, 0.02), s['dunkel'], ort=(0, -0.122, 0.155), eltern=kopf, fase=0.004)
        quader('grat', (0.022, 0.03, 0.24), s['eisen'], ort=(0, -0.128, 0.12), eltern=kopf, fase=0.006)
    else:
        kugel('nase', 0.022, s['haut'], ort=(0, -0.118, 0.115), eltern=kopf, teile=8, ringe=6)
        for x in (-0.04, 0.04):
            kugel('auge', 0.014, s['auge_m'], ort=(x, -0.104, 0.148), eltern=kopf, teile=8, ringe=6)
        kugel('bart', 0.078, s['bart'], ort=(0, -0.058, 0.058), eltern=kopf, streckung=(1.05, 0.85, 0.75),
              teile=12, ringe=8)
        # Der Nasalhelm: eine spitze Haube mit Stirnreif und Nasenschutz.
        drehkoerper('helm', [(0.15, 0.129), (0.2, 0.128), (0.27, 0.098), (0.32, 0.05), (0.345, 0)], s['eisen'],
                    eltern=kopf, streckung=(0.94, 1.02), teile=16)
        pferd.ring('stirnreif', 0.127, 0.012, 0.035, s['eisen'], ort=(0, 0, 0.165), eltern=kopf,
                   streckung=(0.94, 1.02), teile=16)
        quader('nasal', (0.03, 0.016, 0.1), s['eisen'], ort=(0, -0.13, 0.11), eltern=kopf, fase=0.005)
        # Unter dem Helm eine lederne Haube ueber Nacken und Ohren.
        kugel('haube', 0.132, s['leder'], ort=(0, 0.012, 0.12), eltern=kopf, streckung=(0.95, 1.0, 1.1),
              weglassen=lambda x, y, z: y < -0.3 or z > 0.55)

    # Arme.
    for seite, x in (('l', 0.238), ('r', -0.238)):
        m['schulter_' + seite] = leer('schulter_' + seite, (x, 0, 0.45), rumpf)
        glied('oberarm', 0.27, 0.078, 0.066, arm, eltern=m['schulter_' + seite])
        m['ellbogen_' + seite] = leer('ellbogen_' + seite, (0, 0, -0.27), m['schulter_' + seite])
        glied('unterarm', 0.24, 0.06, 0.05, arm if ritter else s['leder'], eltern=m['ellbogen_' + seite])
        m['hand_' + seite] = leer('hand_' + seite, (0, 0, -0.25), m['ellbogen_' + seite])
        kugel('hand', 0.054, s['eisen'] if ritter else s['haut'], ort=(0, 0, -0.035), eltern=m['hand_' + seite],
              streckung=(0.7, 1.0, 1.3), teile=10, ringe=6)

    # Beine.
    for seite, x in (('l', 0.13), ('r', -0.13)):
        m['huefte_' + seite] = leer('huefte_' + seite, (x, 0, -0.03), m['becken'])
        glied('oberschenkel', OBERSCHENKEL, 0.105, 0.08, bein, eltern=m['huefte_' + seite])
        m['knie_' + seite] = leer('knie_' + seite, (0, 0, -OBERSCHENKEL), m['huefte_' + seite])
        glied('unterschenkel', UNTERSCHENKEL, 0.076, 0.058, bein, eltern=m['knie_' + seite])
        if not ritter:
            glied('stiefelschaft', 0.24, 0.08, 0.068, schuh, eltern=m['knie_' + seite], ort=(0, 0, -UNTERSCHENKEL + 0.24))
        m['knoechel_' + seite] = leer('knoechel_' + seite, (0, 0, -UNTERSCHENKEL), m['knie_' + seite])
        quader('schuh', (0.12, 0.28, 0.095), schuh, ort=(0, -0.06, -KNOECHEL + 0.0475),
               eltern=m['knoechel_' + seite], fase=0.03)

    # Die Waffe in der Rechten. `griff` dreht sie im Handgelenk: bei 0 steht
    # sie quer zum Unterarm, bei einem Viertelkreis verlaengert sie ihn.
    m['griff'] = leer('griff', (0, -0.01, -0.045), m['hand_r'])
    griff = m['griff']
    quer = (math.pi / 2, 0, 0)      # die Hochachse eines Teils zeigt dann nach vorn (-Y)
    if ritter:
        # Die Lanze: gut zwei Meter, gefasst ein Stueck hinter der Mitte.
        drehkoerper('schaft', [(-0.62, 0), (-0.62, 0.021), (-0.1, 0.024), (0.9, 0.02), (1.42, 0.015), (1.42, 0)],
                    s['holz'], drehung=quer, eltern=griff, teile=10)
        drehkoerper('spitze', [(1.4, 0), (1.4, 0.026), (1.47, 0.03), (1.66, 0)], s['klinge'], drehung=quer,
                    eltern=griff, teile=8, glatt=False)
        drehkoerper('handschutz', [(-0.02, 0.022), (0.04, 0.06), (0.06, 0.022)], s['eisen'], drehung=quer,
                    eltern=griff, teile=12)
        # Der Wimpel: ein Dreieck unter der Spitze.
        netz('wimpel', [(0, -1.36, 0.012), (0, -1.14, 0.012), (0, -1.21, -0.3)], [(0, 1, 2)], s['tuch'],
             eltern=griff, dicke=0.012)
    else:
        # Das Schwert: Klinge, Parierstange, Knauf.
        quader('klinge', (0.012, 0.74, 0.05), s['klinge'], ort=(0, -0.45, 0), eltern=griff, fase=0.004)
        quader('parierstange', (0.03, 0.03, 0.2), s['eisen'], ort=(0, -0.07, 0), eltern=griff, fase=0.008)
        quader('heft', (0.026, 0.13, 0.03), s['leder'], ort=(0, 0, 0), eltern=griff, fase=0.008)
        kugel('knauf', 0.028, s['eisen'], ort=(0, 0.08, 0), eltern=griff, teile=8, ringe=6)

    # Der Schild am linken Unterarm: steht der Unterarm waagerecht, haengt der
    # Schild senkrecht daran.
    m['schild'] = leer('schild', (0.085, -0.02, -0.12), m['ellbogen_l'])
    schild = m['schild']
    if ritter:
        # Ein Wappenschild: oben gerade, unten spitz. (wie breit, wie hoch).
        umriss = [(-0.21, 0.3), (0.21, 0.3), (0.22, 0.05), (0.13, -0.2), (0.0, -0.36), (-0.13, -0.2), (-0.22, 0.05)]
        n = len(umriss)
        ecken = [(d, -hoch, weit) for d in (-0.014, 0.014) for weit, hoch in umriss]
        seiten = [tuple(range(n)), tuple(range(n, 2 * n))]
        seiten += [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
        netz('wappenschild', ecken, seiten, s['tuch'], eltern=schild, glatt=False)
        quader('schildrand', (0.036, 0.03, 0.44), s['eisen'], ort=(0, -0.3, 0), eltern=schild, fase=0.006)
    else:
        scheibe = (0, math.pi / 2, 0)   # die Hochachse der Scheibe zeigt dann zur Seite
        drehkoerper('rundschild', [(-0.012, 0), (-0.012, 0.27), (0.012, 0.27), (0.02, 0.2), (0.03, 0)],
                    s['schildleder'], drehung=scheibe, eltern=schild, teile=20)
        pferd.ring('schildreif', 0.27, 0.014, 0.03, s['eisen'], drehung=scheibe, eltern=schild, teile=20)
        kugel('schildbuckel', 0.06, s['eisen'], ort=(0.03, 0, 0), eltern=schild, streckung=(0.6, 1, 1), teile=10, ringe=6)


def bauen(art):
    """Baut Pferd und Reiter. Gibt die Gelenke des Pferdes und die des
    Menschen zurueck - `kopf` und `hals` gibt es in beiden."""
    k = ARTEN[art]
    s = stoffe(art)
    g, m = {}, {}
    g['figur'] = leer('figur')
    g['figur'].scale = (GROESSE, GROESSE, GROESSE)
    pferd.bauen(s, g, g['figur'], ort=(0, PFERD_Y, 0), mass=k['mass'], breite=k['breite'])
    _sattel(s, g, art)
    _mensch(s, m, g['figur'], art)
    return g, m


def _glatt(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def _weg(stationen, t):
    """Zwischen Haltungen: `stationen` ist eine Liste (wann, Werte), t liegt
    dazwischen. Weich von einer zur naechsten."""
    for (t0, a), (t1, b) in zip(stationen, stationen[1:]):
        if t <= t1:
            u = _glatt((t - t0) / (t1 - t0))
            return tuple(x + (y - x) * u for x, y in zip(a, b))
    return stationen[-1][1]


# Der rechte Arm je Haltung: (Schulter vor, Schulter ab, Ellbogen, Griff).
ARM = {
    'spaeherreiter': {
        'ruhe': (-0.35, 0.15, -1.45, 0.1),       # Unterarm vor, die Klinge steht
        'aushol': (-2.35, 0.25, -1.15, 0.35),    # ueber dem Kopf, die Klinge nach hinten
        'treffer': (-0.85, 0.5, -0.2, 1.35),     # rechts neben dem Pferd nach unten
        'liegt': (0.15, 0.55, -0.1, 1.5),
    },
    'ritter': {
        'ruhe': (-0.3, 0.12, -1.4, 0.62),        # die Lanze schraeg nach vorn oben
        # Der Griff gleicht aus, dass sich der Oberkoerper in den Stoss legt:
        # die Lanze bleibt fast waagerecht, auf Brusthoehe eines Mannes zu Fuss.
        'aushol': (0.15, 0.2, -1.6, 1.36),       # eingelegt, der Arm zurueck
        'treffer': (-0.95, 0.25, -0.55, 1.24),   # gestreckt nach vorn, die Spitze leicht gesenkt
        'liegt': (0.15, 0.5, -0.1, 1.47),
    },
}


def stellen(g, m, art, ablauf, t=0.0):
    """Bringt Pferd und Reiter in ein Bild eines Ablaufs; t laeuft von 0 bis 1."""
    k = ARTEN[art]
    mass = k['mass']
    gang = {'stehen': 'stehen', 'gehen': 'traben', 'angreifen': 'kampf', 'sterben': 'sterben'}[ablauf]
    hoch = pferd.stellen(g, gang, t)
    for name, gelenk in m.items():
        if name not in ('reiter', 'griff', 'schild'):
            gelenk.rotation_euler = (0, 0, 0)
    p = 2 * math.pi * t
    arme = ARM[art]

    # Im Sattel: die Schenkel nach vorn und um den Leib, die Unterschenkel haengen.
    kippen, drehen = k['spreiz']
    sitz = {'huefte': (-1.15, kippen, drehen), 'knie': 1.2, 'fuss': -0.05}
    rumpf, kopf = (0.08, 0, 0), (0.0, 0, 0)
    links = (-0.35, -0.2, -1.3)          # Schulter vor, Schulter ab, Ellbogen: Zuegel und Schild
    rechts = arme['ruhe']
    heben = 0.0
    ort = None
    kippe = (0, 0, 0)
    liegt = 0.0
    if ablauf == 'gehen':
        # Der Reiter geht mit: er hebt sich zweimal je Ablauf aus dem Sattel.
        heben = 0.035 * math.sin(p) ** 2
        rumpf = (0.16 + 0.03 * math.sin(2 * p), 0, 0.03 * math.sin(p))
        kopf = (-0.1, 0, 0)
        links = (-0.42 + 0.04 * math.sin(2 * p), -0.2, -1.2)
        rechts = (arme['ruhe'][0] + 0.05 * math.sin(2 * p),) + arme['ruhe'][1:]
    elif ablauf == 'angreifen':
        # Ausholen, zuschlagen, zurueck: der Schlag faellt bei 0,5.
        rechts = _weg([(0.0, arme['ruhe']), (0.34, arme['aushol']), (0.52, arme['treffer']),
                       (0.66, arme['treffer']), (1.0, arme['ruhe'])], t)
        wucht = _weg([(0.0, (0.0,)), (0.34, (-0.6,)), (0.52, (1.0,)), (0.66, (0.9,)), (1.0, (0.0,))], t)[0]
        if art == 'ritter':
            # Der Stoss kommt aus dem ganzen Oberkoerper.
            rumpf = (0.08 + 0.3 * max(0.0, wucht) - 0.08 * min(0.0, wucht), 0, 0.12 * wucht)
        else:
            rumpf = (0.08 + 0.2 * max(0.0, wucht), 0.12 * max(0.0, wucht), 0.3 * wucht)
        kopf = (-0.1 * max(0.0, wucht), 0, -0.15 * wucht)
    elif ablauf == 'sterben':
        # Der Reiter kippt mit dem Pferd nach rechts und bleibt hinter dessen
        # Ruecken liegen, auf dem Ruecken, den Kopf zum Schweif.
        liegt = _glatt((t - 0.12) / 0.62)
        kippe = (-math.pi / 2 * liegt, -0.55 * math.sin(math.pi * liegt), 0)
        sitz = {
            'huefte': (-1.15 + 1.0 * liegt, kippen * (1 - liegt) + 0.08 * liegt, drehen * (1 - liegt) + 0.1 * liegt),
            'knie': 1.2 - 0.85 * liegt, 'fuss': -0.05 - 0.4 * liegt,
        }
        rumpf = (0.08 - 0.08 * liegt, 0, 0)
        kopf = (0.25 * liegt, 0, 0.3 * liegt)
        links = (-0.35 + 0.45 * liegt, -0.2 - 0.45 * liegt, -1.3 + 1.2 * liegt)
        rechts = tuple(a + (b - a) * liegt for a, b in zip(arme['ruhe'], arme['liegt']))

    for seite, z in (('l', 1), ('r', -1)):
        vor, kipp, dreh = sitz['huefte']
        m['huefte_' + seite].rotation_euler = (vor, -z * kipp, z * dreh)
        m['knie_' + seite].rotation_euler = (sitz['knie'], 0, 0)
        m['knoechel_' + seite].rotation_euler = (sitz['fuss'], 0, -z * 0.3)
    m['rumpf'].rotation_euler = rumpf
    m['kopf'].rotation_euler = kopf
    m['schulter_l'].rotation_euler = (links[0], links[1], 0)
    # Im Liegen dreht sich der Unterarm, bis der Schild flach auf dem Boden liegt.
    m['ellbogen_l'].rotation_euler = (links[2], 0, math.pi / 2 * liegt)
    m['schulter_r'].rotation_euler = (rechts[0], rechts[1], 0)
    m['ellbogen_r'].rotation_euler = (rechts[2], 0, 0)
    m['griff'].rotation_euler = (rechts[3], 0, 0)
    g['zuegel'].scale = (1, 1, 1) if liegt < 0.05 else (0.001, 0.001, 0.001)

    # Wo der Reiter ist: im Sattel - das Pferd misst in seinem eigenen Mass -,
    # oder auf dem Weg von dort auf den Boden hinter dem Ruecken des Pferdes.
    sattel = (0.0, PFERD_Y + mass * SITZ[0], mass * (hoch + SITZ[1]) + heben)
    if ablauf == 'sterben':
        # Der Sattel faellt mit dem Pferd; der Reiter loest sich und faellt
        # schneller, je laenger er faellt.
        oben = (0.0, PFERD_Y + mass * SITZ[0], mass * (pferd.LEIB_HOCH + SITZ[1]))
        unten = (-(mass * pferd.LEIB_HALB + 0.42), PFERD_Y + 0.1, 0.2)
        ort = (oben[0] + (unten[0] - oben[0]) * liegt,
               oben[1] + (unten[1] - oben[1]) * liegt,
               oben[2] + (unten[2] - oben[2]) * liegt * liegt)
    m['reiter'].location = ort or sattel
    m['reiter'].rotation_euler = kippe
    if ablauf == 'sterben':
        aufsetzen(m['reiter'], m['reiter'], nur_heben=liegt < 0.98)


def tafel(ziel, art):
    szene_leeren()
    g, m = bauen(art)
    blatt = Tafel(art, zelle=ARTEN[art]['zelle'], fuss=ARTEN[art]['fuss'], ziel=ziel, knapp=True)
    # Zum Ansehen beim Bauen: '1' drei Richtungen und vier Bilder je Ablauf,
    # '2' eine Richtung mit allen Bildern.
    probe = os.environ.get('BILDER_PROBE')
    richtungen = {'1': [1, 3, 6], '2': [1]}.get(probe, list(range(RICHTUNGEN)))
    bilder = [0, 3, 5, 7] if probe == '1' else list(range(BILDER))
    for zeile, richtung in enumerate(richtungen):
        g['figur'].rotation_euler = (0, 0, math.radians(45 + 45 * richtung))
        stellen(g, m, art, 'stehen')
        blatt.bild(zeile, 0)
        for spalte, bild in enumerate(bilder):
            stellen(g, m, art, 'gehen', bild / BILDER)
            blatt.bild(zeile, 1 + spalte)
        for spalte, bild in enumerate(bilder):
            stellen(g, m, art, 'angreifen', bild / BILDER)
            blatt.bild(zeile, spalte, teil='angreifen')
        for spalte, bild in enumerate(bilder):
            # Sterben laeuft einmal: das letzte Bild ist das Ende.
            stellen(g, m, art, 'sterben', bild / (BILDER - 1))
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
