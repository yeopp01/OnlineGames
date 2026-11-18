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
#   Leichte Kavallerie  die Stufe des Spaeherreiters (einheiten AC-62): ein
#                  Fuchs, der Reiter mit Kettenkragen und Eisenhut, ein
#                  eisenbeschlagener Schild und eine kurze Lanze mit Wimpel.
#   Reiterschuetze Rappensteins Eigener aus der Burg (einheiten AC-46): ein
#                  Rappe unter einer grossen Decke aus hellem Filz, der Saum
#                  in Spielerfarbe; der Reiter im hellen Filzmantel mit einem
#                  Schoss in Spielerfarbe und Pelzmuetze, ohne Schild und
#                  Schwert - in der Linken der kurze Bogen, auf dem Ruecken
#                  der Koecher. Im Schuss dreht er sich im Sattel und schiesst
#                  links am Hals des Pferdes vorbei. Hell ist er, weil Rappe
#                  und Brauner im Bild fast gleich dunkel sind: im Wams des
#                  Spaehers war er von ihm nicht zu unterscheiden
#                  (darstellung AC-14: 0,15 statt einem Drittel).
#
# Die Tafel: je Zeile eine Blickrichtung, je Spalte ein Bild. Stehen und
# Gehen (ein Trab) liegen in der Haupttafel, Angreifen und Sterben je in
# einer eigenen - der Browser holt sie erst, wenn jemand kaempft.
#
# Kein Modell fuer sich: spaeherreiter.py, ritter.py und die anderen rufen tafel().

import math
import os

import bpy

import fussvolk
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
    'leichtekavallerie': {'fell': 'falbe', 'mass': 1.03, 'breite': 0.86, 'spreiz': (0.27, 0.54),
                          'zelle': (352, 304), 'fuss': (160, 224)},
    # Der Bogen steht im Schuss ueber dem Kopf des Reiters: die Zelle des Ritters.
    'reiterschuetze': {'fell': 'rappe', 'mass': 1.0, 'breite': 0.84, 'spreiz': (0.25, 0.5),
                       'zelle': (352, 304), 'fuss': (160, 224)},
    # Die Reiter der Krone (einheiten AC-66) - jeder am Umriss zu erkennen:
    #
    #   Husar      die Stufe der leichten Kavallerie: ein Lichtfuchs mit heller
    #              Maehne, ein geflecktes Fell unter dem Sattel; der Reiter mit
    #              spitzem Helm, einem Fell ueber der Schulter und dem krummen
    #              Saebel - und auf dem Ruecken zwei Fluegel aus weissen
    #              Federn, hoeher als sein Kopf.
    #   Kavalier   die Stufe des Ritters: ein Schwarzbrauner, die Decke in zwei
    #              Teilen, Kette um den Hals; der Reiter mit Brustplatte und
    #              Schienen ueber dem Kettenhemd, die Beckenhaube mit spitzem
    #              Visier, darum ein Wulst in Spielerfarbe, die Lanze laenger,
    #              der Wimpel mit zwei Zipfeln.
    #   Paladin    die Stufe des Kavaliers: ein Weisser, ganz gepanzert - eine
    #              Decke aus Kette, darauf Platten an Stirn, Hals, Brust und
    #              Kruppe; der Reiter in blankem Harnisch mit geschlossenem
    #              Helm, Federbusch und Umhang in Spielerfarbe, die schwere
    #              Lanze mit Brechscheibe und langem Banner.
    #
    # Die Fluegel stehen ueber dem Kopf, die Lanzen sind laenger, die Pferde
    # groesser: jede Zelle ist reichlich - geschrieben wird die Tafel ohnehin
    # knapp um das, was im Bild steht.
    'husar': {'fell': 'lichtfuchs', 'mass': 1.04, 'breite': 0.86, 'spreiz': (0.27, 0.54),
              'zelle': (416, 384), 'fuss': (192, 288)},
    'kavalier': {'fell': 'schwarzbraun', 'mass': 1.09, 'breite': 0.9, 'spreiz': (0.33, 0.64),
                 'zelle': (448, 384), 'fuss': (208, 280)},
    'paladin': {'fell': 'weiss', 'mass': 1.12, 'breite': 0.92, 'spreiz': (0.35, 0.66),
                'zelle': (512, 432), 'fuss': (240, 312)},
}

# Wer ganz in Eisen sitzt, das Gesicht hinter dem Helm, und die Lanze eingelegt
# fuehrt: gestossen wird aus dem ganzen Oberkoerper.
SCHWER = ('ritter', 'kavalier', 'paladin')
# Wer das Kettenhemd nur an Armen und Schultern traegt.
LEICHT = ('leichtekavallerie', 'husar')

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
    if art in LEICHT:
        s['kette'] = gemustert('kette', ('#3f4347', '#73787d'), groesse=120, detail=2, relief=0.7, fugen=0.5,
                               rau=0.5, metall=0.75)
    if art in ('husar', 'kavalier', 'paladin'):
        s['messing'] = einfarbig('messing', '#a8842f', rau=0.35, metall=0.9)
    if art == 'husar':
        s.update({
            'feder': einfarbig('feder', '#d8d3c4', rau=0.9),
            # Das Fell einer grossen Katze: sandfarben mit dunklen Flecken.
            'pelz': gemustert('pelz', ('#2e2114', '#a07a42', '#bf9a5a'), groesse=26, detail=2, relief=0.6, fugen=0.4,
                              rau=0.95, kontrast=(0.36, 0.5)),
        })
    if art == 'paladin':
        # Blanker Harnisch: heller und glatter als das Eisen der anderen.
        s['stahl'] = gemustert('stahl', ('#8d9399', '#cdd2d7'), groesse=14, detail=2, relief=0.08, rau=0.26,
                               metall=0.92)
    if art == 'reiterschuetze':
        s.update({
            'sehne': einfarbig('sehne', '#d8d0b8', rau=0.8),
            'feder': einfarbig('feder', '#cfc9b8', rau=0.9),
            'pelz': gemustert('pelz', ('#4a3a28', '#6b563a', '#83694a'), groesse=70, detail=4, relief=0.9, fugen=0.5,
                              rau=0.95),
            # Gewalkter Filz, ungefaerbt: Mantel und Satteldecke.
            'filz': gemustert('filz', ('#a39a80', '#b9b097', '#c8c0a8'), groesse=30, detail=3, relief=0.3, fugen=0.55,
                              rau=0.95),
        })
    if art in SCHWER:
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
    elif art == 'kavalier':
        # Die Decke in zwei Teilen, der Saum gewellt: vorn ueber Brust und
        # Schulter, hinten ueber die Kruppe; dazwischen liegt das Sattelblatt.
        _decke('schabracke_vorn', s['leinen'], s['tuch'], leib, breite, -0.6, -0.16, tiefe=0.46, band=0.13, welle=0.05)
        _decke('schabracke_hinten', s['leinen'], s['tuch'], leib, breite, 0.14, 0.64, tiefe=0.46, band=0.13, welle=0.05)
        _decke('sattelblatt', s['leder'], None, leib, breite, -0.22, 0.2, tiefe=0.22, auftrag=0.022)
        _rossstirn(s, g['kopf'], s['eisen'], dorn=False)
        # Kette um den Hals, vom Widerrist bis hinter die Ohren.
        drehkoerper('kanz', [(0.0, 0.252), (0.26, 0.191), (0.5, 0.146), (0.58, 0.128)], s['kette'], eltern=g['hals'],
                    streckung=(0.6, 1.0), teile=16)
        hoch = 0.03
    elif art == 'paladin':
        b = breite / pferd.BREITE
        # Die Decke aus Kette bis unter den Bauch, der Saum in Spielerfarbe.
        _decke('rossdecke', s['kette'], s['tuch'], leib, breite, -0.6, 0.64, tiefe=0.44, band=0.12, auftrag=0.03)
        _rossstirn(s, g['kopf'], s['stahl'], dorn=True)
        # Der Kanz: sechs Reifen den Hals hinauf, jeder liegt ueber dem naechsten.
        hals = [(0.0, 0.235), (0.26, 0.175), (0.5, 0.13), (0.6, 0.11)]

        def dick(z):
            for (z0, r0), (z1, r1) in zip(hals, hals[1:]):
                if z0 <= z <= z1:
                    return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
            return hals[-1][1]
        for i in range(6):
            unten, oben = 0.02 + 0.092 * i, 0.02 + 0.092 * (i + 1) + 0.02
            drehkoerper('kanzreif', [(unten, dick(unten) + 0.014), (unten, dick(unten) + 0.04), (oben, dick(oben) + 0.022),
                                     (oben, dick(oben) + 0.012)], s['stahl'], eltern=g['hals'], streckung=(0.6, 1.0),
                        teile=16)
        # Der Fuerbug: eine Schale vor der Brust, in der Mitte ein Buckel. Oben
        # laesst sie den Hals frei, unten die Beine.
        halb = pferd.BRUST[2] + 0.052
        kugel('fuerbug', halb, s['stahl'], ort=(0, pferd.BRUST[0], pferd.BRUST[1]), eltern=leib,
              streckung=(0.86 * b, 1.0, 1.08), teile=20, ringe=14,
              weglassen=lambda x, y, z: y > -0.08 or z > 0.62 or z < -0.45)
        kugel('fuerbugbuckel', 0.05, s['messing'], ort=(0, pferd.BRUST[0] - halb + 0.005, pferd.BRUST[1] - 0.02),
              eltern=leib, streckung=(1, 0.6, 1), teile=10, ringe=6)
        # Das Kruppenstueck: eine Schale ueber Kruppe und Hinterhand, der
        # Schweif kommt darunter hervor.
        halb = pferd.KRUPPE[2] + 0.05
        kugel('kruppenstueck', halb, s['stahl'], ort=(0, pferd.KRUPPE[0], pferd.KRUPPE[1]), eltern=leib,
              streckung=(0.9 * b, 1.0, 0.97), teile=20, ringe=14, weglassen=lambda x, y, z: y < 0.12 or z < -0.3)
        for x in (-1, 1):
            kugel('kruppenbuckel', 0.04, s['messing'],
                  ort=(x * halb * 0.9 * b * 0.72, pferd.KRUPPE[0] + halb * 0.5, pferd.KRUPPE[1] + halb * 0.42),
                  eltern=leib, streckung=(0.6, 1, 1), teile=10, ringe=6)
        hoch = 0.032
    elif art == 'husar':
        # Eine lange Decke in Spielerfarbe, hinten bis auf die Kruppe, darueber
        # ein geflecktes Fell unter dem Sattel.
        _decke('satteldecke', s['tuch'], None, leib, breite, -0.34, 0.44, tiefe=0.22)
        _decke('sattelfell', s['pelz'], None, leib, breite, -0.24, 0.22, tiefe=0.06, auftrag=0.038)
        pferd.ring('gurt', pferd.LEIB_HALB + 0.012, 0.012, 0.06, s['leder'], ort=(0, -0.1, 0), drehung=laengs,
                   eltern=leib, streckung=(breite, 1.0), teile=24)
        pferd.ring('vorderzeug', 0.3, 0.012, 0.045, s['leder'], ort=(0, -0.44, -0.02), drehung=(math.pi / 2 - 0.5, 0, 0),
                   eltern=leib, streckung=(breite, 1.0), teile=20)
        # Ein Messingbuckel auf der Brust, wo sich die Riemen treffen.
        kugel('brustbuckel', 0.045, s['messing'], ort=(0, -0.7, -0.06), eltern=leib, streckung=(1, 0.5, 1), teile=10,
              ringe=6)
        hoch = 0.04
    elif art == 'reiterschuetze':
        # Eine grosse Decke aus Filz, von der Schulter bis auf die Kruppe und
        # tief ueber die Flanke, der Saum in Spielerfarbe.
        # Der Saum ist breit: auf der Schautafel trug er sonst unter einem
        # Zehntel Spielerfarbe (gemessen 0,092).
        _decke('satteldecke', s['filz'], s['tuch'], leib, breite, -0.36, 0.5, tiefe=0.38, band=0.2)
        pferd.ring('gurt', pferd.LEIB_HALB + 0.034, 0.012, 0.06, s['leder'], ort=(0, -0.1, 0), drehung=laengs,
                   eltern=leib, streckung=(breite, 1.0), teile=24)
        pferd.ring('vorderzeug', 0.3, 0.012, 0.045, s['leder'], ort=(0, -0.44, -0.02), drehung=(math.pi / 2 - 0.5, 0, 0),
                   eltern=leib, streckung=(breite, 1.0), teile=20)
        hoch = 0.032
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


def _rossstirn(s, kopf, stoff, dorn):
    """Die Rossstirn: eine Platte auf dem Nasenruecken, oben und unten ein
    Band aus Messing, ueber den Augen zwei Schalen - und beim Paladin ein Dorn
    auf der Stirn. Am Kopf des Pferdes zeigt z zum Maul, y aus der Stirn."""
    neigung = 0.1       # die Platte folgt dem Schaedel, der zum Maul hin schmaler wird
    quader('rossstirn', (0.135, 0.024, 0.32), stoff, ort=(0, 0.127, 0.2), drehung=(neigung, 0, 0), eltern=kopf,
           fase=0.008)
    for z in (0.055, 0.345):
        quader('stirnband', (0.15, 0.03, 0.03), s['messing'], ort=(0, 0.127 - (z - 0.2) * math.sin(neigung), z),
               drehung=(neigung, 0, 0), eltern=kopf, fase=0.006)
    for x in (-0.075, 0.075):
        kugel('augenschale', 0.034, stoff, ort=(x, 0.085, 0.12), eltern=kopf, streckung=(0.6, 1, 1.25), teile=8,
              ringe=6)
    if dorn:
        drehkoerper('stirndorn', [(0.0, 0.026), (0.02, 0.022), (0.14, 0)], s['messing'], ort=(0, 0.135, 0.1),
                    drehung=(-math.pi / 2, 0, 0), eltern=kopf, teile=8, glatt=False)


def _fahne(name, stoff, griff, vorn, lang, tief):
    """Ein Wimpel mit zwei Zipfeln unter der Lanzenspitze: am Schaft `lang`
    breit, die Zipfel haengen `tief` herab."""
    ecken = [(0, -vorn, 0.014), (0, -(vorn - lang), 0.014), (0, -(vorn - lang) + 0.03, -tief),
             (0, -(vorn - lang / 2), -tief * 0.6), (0, -vorn - 0.03, -tief)]
    netz(name, ecken, [(0, 1, 3), (1, 2, 3), (0, 3, 4)], stoff, eltern=griff, dicke=0.012)


def _wappenschild(schild, rand, feld, breit=0.21, hoch=0.3):
    """Ein Wappenschild mit Rand: oben gerade, unten spitz. Aussen ist +x."""
    umriss = [(-breit, hoch), (breit, hoch), (breit + 0.01, 0.05), (0.62 * breit, -0.2), (0.0, -hoch - 0.06),
              (-0.62 * breit, -0.2), (-breit - 0.01, 0.05)]
    n = len(umriss)
    seiten = [tuple(range(n)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    netz('schildrand', [(d, -h, w) for d in (-0.016, 0.016) for w, h in umriss], seiten, rand, eltern=schild,
         glatt=False)
    netz('schildfeld', [(d, -(h * 0.84 + 0.006), w * 0.84) for d in (0.014, 0.023) for w, h in umriss], seiten, feld,
         eltern=schild, glatt=False)


def _fluegel(s, m, rumpf):
    """Die Fluegel des Husaren: zwei gebogene Holme auf dem Ruecken, hoeher als
    der Kopf, jeder mit einer Reihe weisser Federn nach hinten."""
    m['fluegel'] = leer('fluegel', (0, 0, 0), rumpf)
    # Der Holm in der Ebene laengs: (nach hinten, nach oben).
    holm = [(0.2, 0.12), (0.245, 0.45), (0.25, 0.78), (0.2, 1.04), (0.07, 1.2), (-0.1, 1.24)]
    for x in (-0.13, 0.13):
        strang('holm', [(x, y, z, 0.016) for y, z in holm], s['holz'], eltern=m['fluegel'], rund=2)
        # Die Federn stehen quer zum Holm: unten zeigen sie nach hinten, oben
        # nach hinten oben.
        for (y0, z0), (y1, z1) in zip(holm[1:], holm[2:]):
            lang = math.hypot(y1 - y0, z1 - z0)
            # Die Senkrechte auf den Holm, nach hinten.
            ny, nz = (z1 - z0) / lang, -(y1 - y0) / lang
            for u in (0.0, 0.34, 0.67):
                y, z = y0 + (y1 - y0) * u, z0 + (z1 - z0) * u
                feder = 0.2 + 0.05 * math.sin(3.1 * (z - 0.4))
                quader('feder', (0.012, feder, 0.062), s['feder'],
                       ort=(x, y + ny * feder * 0.52, z + nz * feder * 0.52), drehung=(math.atan2(nz, ny), 0, 0),
                       eltern=m['fluegel'], fase=0.004)
        # Ein Riemen haelt den Holm an der Schulter.
        strang('fluegelriemen', [(x, 0.2, 0.14, 0.012), (x * 1.3, 0.05, 0.5, 0.012), (x * 1.2, -0.15, 0.44, 0.012)],
               s['leder'], eltern=m['fluegel'], rund=2)


# ---- der Mensch ---------------------------------------------------------------

def _mensch(s, m, eltern, art):
    ritter = art in SCHWER
    leicht = art in LEICHT
    schuetze = art == 'reiterschuetze'
    kavalier, paladin, husar = art == 'kavalier', art == 'paladin', art == 'husar'
    platte = kavalier or paladin
    m['reiter'] = leer('reiter', (0, 0, 0), eltern)
    m['becken'] = leer('becken', (0, 0, 0), m['reiter'])
    m['rumpf'] = leer('rumpf', (0, 0, 0), m['becken'])
    rumpf = m['rumpf']
    # Woraus die Platten sind: der Paladin traegt blanken Stahl.
    blech = s['stahl'] if paladin else s['eisen']
    arm = blech if paladin else s['kette'] if ritter or leicht else s['filz'] if schuetze else s['aermel']
    bein = blech if paladin else s['kette'] if ritter else s['hose']
    schuh = blech if ritter else s['stiefel']

    # Der Rumpf: kurz, wer sitzt, hat keinen Rock unter sich.
    drehkoerper('rock', [(0.55, 0), (0.54, 0.085), (0.51, 0.17), (0.47, 0.232), (0.35, 0.226), (0.15, 0.204),
                         (0.05, 0.21), (-0.07, 0.232), (-0.15, 0.2), (-0.12, 0)],
                blech if paladin else s['tuch'] if ritter else s['filz'] if schuetze else s['steppung'], eltern=rumpf,
                streckung=(1, 0.7), teile=18)
    if schuetze:
        # Der Mantel ist aus Filz; in Spielerfarbe sind der Schoss unter dem
        # Guertel und ein Aufschlag am Hals.
        drehkoerper('schoss', [(0.066, 0.212), (0.05, 0.218), (-0.07, 0.24), (-0.152, 0.208), (-0.152, 0.19)],
                    s['tuch'], eltern=rumpf, streckung=(1, 0.7), teile=18)
        drehkoerper('aufschlag', [(0.44, 0.236), (0.475, 0.238), (0.515, 0.176), (0.5, 0.168)], s['tuch'],
                    eltern=rumpf, streckung=(1, 0.7), teile=18)
        # Und eine breite Leibbinde ueber dem Guertel, zweimal um den Leib
        # geschlungen - von jeder Seite zu sehen.
        drehkoerper('leibbinde', [(0.215, 0.204), (0.215, 0.23), (0.165, 0.236), (0.12, 0.232), (0.12, 0.204)],
                    s['tuch'], eltern=rumpf, streckung=(1, 0.7), teile=18)
    drehkoerper('guertel', [(0.115, 0.204), (0.115, 0.219), (0.065, 0.223), (0.065, 0.208)], s['leder'],
                eltern=rumpf, streckung=(1, 0.7), teile=18)
    if kavalier:
        # Die Brustplatte ueber dem Waffenrock: von der Schulter bis ueber die
        # Rippen, darunter bleibt der Rock in Spielerfarbe.
        drehkoerper('brustplatte', [(0.52, 0), (0.515, 0.12), (0.5, 0.2), (0.47, 0.254), (0.36, 0.252), (0.26, 0.238),
                                    (0.2, 0.222), (0.19, 0.19), (0.19, 0)], blech, eltern=rumpf, streckung=(1, 0.72),
                    teile=18)
        quader('brustgrat', (0.026, 0.026, 0.24), blech, ort=(0, -0.176, 0.345), drehung=(0.08, 0, 0), eltern=rumpf,
               fase=0.008)
    if paladin:
        # Der Harnisch: ein Grat ueber die Brust, eine Schaerpe in Spielerfarbe
        # um die Taille, darunter die Bauchreifen.
        quader('brustgrat', (0.03, 0.03, 0.3), blech, ort=(0, -0.158, 0.33), drehung=(0.1, 0, 0), eltern=rumpf,
               fase=0.01)
        drehkoerper('schaerpe', [(0.17, 0.21), (0.17, 0.232), (0.07, 0.236), (0.07, 0.212)], s['tuch'], eltern=rumpf,
                    streckung=(1, 0.72), teile=18)
        for z, halb in ((0.03, 0.238), (-0.04, 0.248), (-0.11, 0.24)):
            pferd.ring('bauchreif', halb, 0.012, 0.075, blech, ort=(0, 0, z), eltern=rumpf, streckung=(1, 0.72),
                       teile=18)
        pferd.ring('harnischsaum', 0.236, 0.012, 0.022, s['messing'], ort=(0, 0, -0.15), eltern=rumpf,
                   streckung=(1, 0.72), teile=18)
        # Der Umhang: von den Schultern nach hinten ueber Sattel und Kruppe.
        m['umhang'] = leer('umhang', (0, 0, 0), rumpf)
        fussvolk.bahn('umhang', s['tuch'], m['umhang'],
                      [(0.5, 0.21), (0.38, 0.27), (0.24, 0.33), (0.12, 0.4), (0.0, 0.47), (-0.05, 0.53)], 90, 55,
                      dick=0.03, teile=8)
        for x in (-0.15, 0.15):
            kugel('umhangspange', 0.03, s['messing'], ort=(x, 0.1, 0.5), eltern=rumpf, teile=8, ringe=6)
    if husar:
        # Das Fell einer grossen Katze: ueber die linke Schulter und den Ruecken.
        fussvolk.bahn('fellumhang', s['pelz'], rumpf, [(0.52, 0.2), (0.42, 0.25), (0.28, 0.25), (0.14, 0.23)],
                      70, 62, dick=0.03, teile=6)
        kugel('fellschulter', 0.115, s['pelz'], ort=(0.19, 0.02, 0.47), eltern=rumpf, streckung=(1.15, 1.0, 0.7),
              teile=12, ringe=8)
        _fluegel(s, m, rumpf)
    if ritter and not paladin:
        # Das Kettenhemd schaut unter dem Waffenrock hervor und liegt als
        # Kragen auf den Schultern.
        drehkoerper('hemdsaum', [(-0.05, 0.236), (-0.2, 0.25), (-0.2, 0.2), (-0.1, 0)], s['kette'], eltern=rumpf,
                    streckung=(1, 0.72), teile=18)
    if ritter or leicht:
        drehkoerper('kragen', [(0.64, 0.085), (0.58, 0.13), (0.5, 0.25), (0.44, 0.262), (0.44, 0.2), (0.46, 0)],
                    blech if paladin else s['kette'], eltern=rumpf, streckung=(1, 0.76), teile=18)

    # Der Kopf.
    m['kopf'] = leer('kopf', (0, 0, 0.57), rumpf)
    kopf = m['kopf']
    glied('hals', 0.08, 0.05, 0.055, s['kette'] if ritter else s['haut'], eltern=kopf, ort=(0, 0, 0.03))
    kugel('schaedel', 0.118, s['haut'], ort=(0, 0, 0.125), eltern=kopf, streckung=(0.9, 1.0, 1.14))
    if kavalier:
        # Die Beckenhaube mit der Hundsgugel: eine spitze Glocke, davor das
        # Visier als Schnauze, darueber der Sehschlitz.
        drehkoerper('beckenhaube', [(-0.03, 0.118), (0.05, 0.134), (0.2, 0.134), (0.28, 0.108), (0.34, 0.058),
                                    (0.385, 0)], blech, eltern=kopf, streckung=(0.94, 1.03), teile=18)
        drehkoerper('visier', [(0.05, 0.096), (0.14, 0.082), (0.225, 0.034), (0.25, 0)], blech, ort=(0, 0, 0.115),
                    drehung=(math.pi / 2, 0, 0), eltern=kopf, streckung=(1.0, 0.9), teile=12)
        quader('sehschlitz', (0.16, 0.024, 0.016), s['dunkel'], ort=(0, -0.132, 0.2), eltern=kopf, fase=0.004)
        for x in (-0.118, 0.118):
            kugel('visierbolzen', 0.022, s['messing'], ort=(x, -0.02, 0.15), eltern=kopf, teile=8, ringe=6)
        # Der Wulst: ein gedrehtes Tuch in Spielerfarbe um die Glocke.
        pferd.ring('wulst', 0.118, 0.034, 0.04, s['tuch'], ort=(0, 0, 0.262), eltern=kopf, streckung=(0.94, 1.03),
                   teile=16)
    elif paladin:
        # Der geschlossene Helm: rund, mit einem Kamm aus Messing, das Visier
        # stumpf; dahinter weht der Federbusch in Spielerfarbe.
        drehkoerper('helm', [(-0.035, 0.108), (0.02, 0.13), (0.12, 0.14), (0.2, 0.138), (0.27, 0.114),
                             (0.315, 0.062), (0.332, 0)], blech, eltern=kopf, streckung=(0.94, 1.03), teile=18)
        drehkoerper('visier', [(0.06, 0.104), (0.14, 0.09), (0.19, 0.045), (0.205, 0)], blech, ort=(0, 0, 0.11),
                    drehung=(math.pi / 2, 0, 0), eltern=kopf, streckung=(1.0, 0.82), teile=12)
        quader('sehschlitz', (0.17, 0.024, 0.014), s['dunkel'], ort=(0, -0.14, 0.192), eltern=kopf, fase=0.004)
        quader('helmkamm', (0.022, 0.27, 0.05), s['messing'], ort=(0, 0.015, 0.318), eltern=kopf, fase=0.012)
        pferd.ring('halsreif', 0.112, 0.012, 0.03, s['messing'], ort=(0, 0, -0.02), eltern=kopf, streckung=(0.94, 1.03),
                   teile=16)
        for x, lang in ((0.0, 1.0), (-0.055, 0.82), (0.055, 0.82)):
            strang('federbusch', [(x, 0.03, 0.33, 0.03), (x * 1.3, 0.1 * lang, 0.33 + 0.2 * lang, 0.052),
                                  (x * 1.6, 0.25 * lang, 0.33 + 0.23 * lang, 0.05),
                                  (x * 1.8, 0.4 * lang, 0.33 + 0.1 * lang, 0.022)], s['tuch'], eltern=kopf, rund=2)
    elif ritter:
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
    if husar:
        # Der spitze Helm: eine hohe Glocke mit Stirnreif aus Messing,
        # Nasenschutz, Wangenklappen und einem Schirm im Nacken.
        drehkoerper('helm', [(0.15, 0.129), (0.2, 0.128), (0.28, 0.1), (0.34, 0.056), (0.4, 0.014), (0.44, 0)],
                    s['eisen'], eltern=kopf, streckung=(0.94, 1.02), teile=16)
        pferd.ring('stirnreif', 0.128, 0.014, 0.04, s['messing'], ort=(0, 0, 0.165), eltern=kopf,
                   streckung=(0.94, 1.02), teile=16)
        quader('nasal', (0.03, 0.016, 0.11), s['eisen'], ort=(0, -0.13, 0.105), eltern=kopf, fase=0.005)
        for x in (-0.108, 0.108):
            quader('wangenklappe', (0.016, 0.075, 0.11), s['eisen'], ort=(x, -0.035, 0.09), eltern=kopf, fase=0.006)
        for i in range(3):
            quader('nackenschirm', (0.2 - 0.02 * i, 0.02, 0.05), s['eisen'],
                   ort=(0, 0.118 + 0.014 * i, 0.12 - 0.04 * i), drehung=(0.3 + 0.12 * i, 0, 0), eltern=kopf, fase=0.006)
    elif leicht:
        # Der Eisenhut: eine flache Glocke mit breiter Krempe.
        drehkoerper('eisenhut', [(0.15, 0.225), (0.165, 0.228), (0.185, 0.135), (0.25, 0.122), (0.3, 0.075),
                                 (0.315, 0)], s['eisen'], eltern=kopf, streckung=(0.96, 1.0), teile=18)
        drehkoerper('krempe', [(0.15, 0.225), (0.15, 0.1)], s['eisen'], eltern=kopf, streckung=(0.96, 1.0), teile=18)
    elif schuetze:
        # Die Pelzmuetze: eine spitze Kappe in Spielerfarbe ueber einem Rand aus Fell.
        drehkoerper('muetze', [(0.17, 0.13), (0.24, 0.122), (0.31, 0.075), (0.36, 0.03), (0.38, 0)], s['tuch'],
                    eltern=kopf, streckung=(0.94, 1.02), teile=16)
        pferd.ring('pelzrand', 0.127, 0.03, 0.07, s['pelz'], ort=(0, 0, 0.175), eltern=kopf,
                   streckung=(0.94, 1.02), teile=16)
    elif not ritter:
        # Der Nasalhelm: eine spitze Haube mit Stirnreif und Nasenschutz.
        drehkoerper('helm', [(0.15, 0.129), (0.2, 0.128), (0.27, 0.098), (0.32, 0.05), (0.345, 0)], s['eisen'],
                    eltern=kopf, streckung=(0.94, 1.02), teile=16)
        pferd.ring('stirnreif', 0.127, 0.012, 0.035, s['eisen'], ort=(0, 0, 0.165), eltern=kopf,
                   streckung=(0.94, 1.02), teile=16)
        quader('nasal', (0.03, 0.016, 0.1), s['eisen'], ort=(0, -0.13, 0.11), eltern=kopf, fase=0.005)
    if not ritter:
        # Unter dem Helm eine lederne Haube ueber Nacken und Ohren.
        kugel('haube', 0.132, s['leder'], ort=(0, 0.012, 0.12), eltern=kopf, streckung=(0.95, 1.0, 1.1),
              weglassen=lambda x, y, z: y < -0.3 or z > 0.55)

    # Arme.
    for seite, x in (('l', 0.238), ('r', -0.238)):
        m['schulter_' + seite] = leer('schulter_' + seite, (x, 0, 0.45), rumpf)
        glied('oberarm', 0.27, 0.078, 0.066, arm, eltern=m['schulter_' + seite])
        m['ellbogen_' + seite] = leer('ellbogen_' + seite, (0, 0, -0.27), m['schulter_' + seite])
        glied('unterarm', 0.24, 0.06, 0.05, blech if platte else arm if ritter else s['leder'],
              eltern=m['ellbogen_' + seite])
        m['hand_' + seite] = leer('hand_' + seite, (0, 0, -0.25), m['ellbogen_' + seite])
        kugel('hand', 0.054, blech if ritter else s['haut'], ort=(0, 0, -0.035), eltern=m['hand_' + seite],
              streckung=(0.7, 1.0, 1.3), teile=10, ringe=6)
        if platte:
            # Schulterkachel und Ellbogenkachel: sie gehen mit dem Arm.
            kugel('schulterkachel', 0.1 if paladin else 0.092, blech, eltern=m['schulter_' + seite],
                  streckung=(1.0, 1.08, 0.86), teile=12, ringe=8)
            kugel('ellbogenkachel', 0.062, blech, eltern=m['ellbogen_' + seite], streckung=(1.0, 1.15, 1.0), teile=10,
                  ringe=6)
        if paladin:
            pferd.ring('schulterreif', 0.086, 0.012, 0.03, s['messing'], ort=(0, 0, -0.07),
                       eltern=m['schulter_' + seite], teile=12)

    # Beine.
    for seite, x in (('l', 0.13), ('r', -0.13)):
        m['huefte_' + seite] = leer('huefte_' + seite, (x, 0, -0.03), m['becken'])
        glied('oberschenkel', OBERSCHENKEL, 0.105, 0.08, bein, eltern=m['huefte_' + seite])
        m['knie_' + seite] = leer('knie_' + seite, (0, 0, -OBERSCHENKEL), m['huefte_' + seite])
        glied('unterschenkel', UNTERSCHENKEL, 0.076, 0.058, blech if platte else bein, eltern=m['knie_' + seite])
        if platte:
            kugel('kniekachel', 0.086, blech, ort=(0, -0.012, 0), eltern=m['knie_' + seite], streckung=(1.0, 1.1, 1.0),
                  teile=10, ringe=6)
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
    if schuetze:
        # Kein Schwert, kein Schild: in der Linken der kurze Reiterbogen, auf
        # dem Ruecken der Koecher. Die Rechte fuehrt die Zuegel und zieht die
        # Sehne. Bogen, Sehne und Pfeil sind die des Schuetzen zu Fuss.
        m['griff_l'] = leer('griff_l', (0, -0.01, -0.045), m['hand_l'])
        fussvolk._bogen(s, m, halb=0.62, dick=1.1)
        fussvolk.koecher(s, rumpf, (-0.09, 0.2, 0.3), (-0.25, 0.35, 0))
        return
    if kavalier:
        # Die Lanze des Kavaliers: zwei Handbreit laenger, der Wimpel mit zwei Zipfeln.
        drehkoerper('schaft', [(-0.66, 0), (-0.66, 0.022), (-0.1, 0.025), (0.95, 0.021), (1.62, 0.015), (1.62, 0)],
                    s['holz'], drehung=quer, eltern=griff, teile=10)
        drehkoerper('spitze', [(1.6, 0), (1.6, 0.027), (1.67, 0.031), (1.88, 0)], s['klinge'], drehung=quer,
                    eltern=griff, teile=8, glatt=False)
        drehkoerper('handschutz', [(-0.02, 0.022), (0.05, 0.07), (0.07, 0.022)], blech, drehung=quer, eltern=griff,
                    teile=12)
        _fahne('wimpel', s['tuch'], griff, 1.56, 0.3, 0.34)
    elif paladin:
        # Die schwere Lanze: vor der Hand die Brechscheibe - ein Trichter, die
        # weite Seite zur Hand -, unter der Spitze ein langes Banner.
        drehkoerper('schaft', [(-0.72, 0), (-0.72, 0.026), (-0.14, 0.034), (-0.05, 0.022), (0.05, 0.022), (0.2, 0.032),
                               (1.0, 0.026), (1.72, 0.016), (1.72, 0)], s['holz'], drehung=quer, eltern=griff, teile=10)
        drehkoerper('spitze', [(1.7, 0), (1.7, 0.028), (1.78, 0.033), (2.0, 0)], s['klinge'], drehung=quer,
                    eltern=griff, teile=8, glatt=False)
        drehkoerper('brechscheibe', [(0.04, 0.03), (0.045, 0.115), (0.06, 0.115), (0.18, 0.03)], blech, drehung=quer,
                    eltern=griff, teile=14)
        pferd.ring('scheibenrand', 0.115, 0.014, 0.02, s['messing'], ort=(0, -0.052, 0), drehung=quer, eltern=griff,
                   teile=14)
        _fahne('banner', s['tuch'], griff, 1.66, 0.34, 0.54)
    elif ritter:
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
    elif husar:
        # Der Saebel: die Klinge krumm, vorn breiter, das Heft mit einem Buegel aus Messing.
        teile = 7
        ecken = []
        for i in range(teile + 1):
            u = i / teile
            bogen = 0.13 * u * u
            breit = 0.002 if i == teile else 0.024 + 0.012 * math.sin(math.pi * min(1.0, u * 1.25))
            ecken += [(0, -0.07 - 0.74 * u, bogen - breit), (0, -0.07 - 0.74 * u, bogen + breit)]
        netz('saebel', ecken, [(2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2) for i in range(teile)], s['klinge'],
             eltern=griff, dicke=0.012)
        quader('parierstange', (0.03, 0.03, 0.16), s['messing'], ort=(0, -0.07, 0), eltern=griff, fase=0.008)
        quader('heft', (0.026, 0.13, 0.03), s['leder'], ort=(0, 0, 0), eltern=griff, fase=0.008)
        strang('buegel', [(0, -0.07, -0.07, 0.008), (0, 0.0, -0.075, 0.008), (0, 0.075, -0.03, 0.008)], s['messing'],
               eltern=griff, rund=2)
        kugel('knauf', 0.028, s['messing'], ort=(0, 0.08, 0), eltern=griff, teile=8, ringe=6)
    elif leicht:
        # Die kurze Lanze: getragen steht sie, gestossen wird von oben.
        drehkoerper('schaft', [(-0.5, 0), (-0.5, 0.019), (1.1, 0.016), (1.1, 0)], s['holz'], drehung=quer,
                    eltern=griff, teile=8)
        drehkoerper('spitze', [(1.08, 0), (1.08, 0.024), (1.14, 0.03), (1.32, 0)], s['klinge'], drehung=quer,
                    eltern=griff, teile=8, glatt=False)
        netz('wimpel', [(0, -1.04, 0.012), (0, -0.84, 0.012), (0, -0.9, -0.26)], [(0, 1, 2)], s['tuch'],
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
    if kavalier:
        # Der Rand aus Eisen, das Feld in Spielerfarbe, in der Mitte ein Buckel aus Messing.
        _wappenschild(schild, blech, s['tuch'])
        kugel('schildbuckel', 0.055, s['messing'], ort=(0.028, -0.06, 0), eltern=schild, streckung=(0.6, 1, 1),
              teile=10, ringe=6)
    elif paladin:
        # Der Rand aus Messing, das Feld in Spielerfarbe, darauf Pfahl und Balken aus Stahl.
        _wappenschild(schild, s['messing'], s['tuch'], breit=0.2)
        quader('schildpfahl', (0.012, 0.5, 0.05), blech, ort=(0.026, 0.02, 0), eltern=schild, fase=0.004)
        quader('schildbalken', (0.012, 0.05, 0.3), blech, ort=(0.026, -0.14, 0), eltern=schild, fase=0.004)
    elif ritter:
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
        # Der Husar traegt einen kleineren Schild aus Leder mit Messing.
        halb = 0.22 if husar else 0.27
        beschlag = s['messing'] if husar else s['eisen']
        drehkoerper('rundschild', [(-0.012, 0), (-0.012, halb), (0.012, halb), (0.02, halb * 0.74), (0.03, 0)],
                    s['eisen'] if leicht and not husar else s['schildleder'], drehung=scheibe, eltern=schild, teile=20)
        pferd.ring('schildreif', halb, 0.014, 0.03, beschlag, drehung=scheibe, eltern=schild, teile=20)
        kugel('schildbuckel', 0.06, beschlag, ort=(0.03, 0, 0), eltern=schild, streckung=(0.6, 1, 1), teile=10, ringe=6)


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
    # Die kurze Lanze wird gefuehrt wie das Schwert: sie steht, holt ueber dem
    # Kopf aus und stoesst rechts neben dem Pferd nach unten.
    'leichtekavallerie': {
        'ruhe': (-0.35, 0.15, -1.45, 0.1),
        'aushol': (-2.35, 0.25, -1.15, 0.35),
        'treffer': (-0.85, 0.5, -0.2, 1.35),
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
    # Die Rechte fuehrt die Zuegel; im Schuss gilt SCHUSS.
    'reiterschuetze': {
        'ruhe': (-0.35, 0.2, -1.3, 0.0),
        'liegt': (0.15, 0.55, -0.1, 0.0),
    },
}

# Die Reiter der Krone fuehren ihre Waffe wie ihre Vorstufe: der Husar den
# Saebel wie der Spaeher das Schwert, Kavalier und Paladin die Lanze des Ritters.
ARM['husar'] = ARM['spaeherreiter']
ARM['kavalier'] = ARM['ritter']
ARM['paladin'] = ARM['ritter']

# Der Bogenarm des Reiterschuetzen: (Schulter, Ellbogen, Griff). Getragen steht
# der Bogen in der Linken vor dem Knie, die Wurfarme auf und ab; im Schuss
# zeigt der gestreckte Arm aufs Ziel; liegt der Reiter, liegt der Bogen flach
# neben ihm.
BOGENARM = {
    'ruhe': ((-0.3, -0.35, 0), (-1.1, 0, 0), (0, 0, -math.pi / 2)),
    'schuss': ((0, -1.5, 0), (-0.08, 0, 0), (0, 0, 0)),
    'liegt': ((0.1, -0.6, 0), (-0.1, 0, 0), (0, math.pi / 2, 0)),
}

# Der Zugarm im Schuss: (wann, Schulter, Ellbogen) - die Stationen des
# Bogenschuetzen zu Fuss. Geloest wird bei 0,5.
SCHUSS = [
    (0.0, (-2.9, 0.2, 0), (-2.3, 0, 0)),         # die Hand am Koecher
    (0.2, (-1.5, 0, 1.0), (-0.4, 0, 0.3)),       # der Pfeil an der Sehne
    (0.45, (-0.1, 1.45, 0), (-2.4, 0, 0)),       # ausgezogen
    (0.52, (-0.05, 1.48, 0), (-2.3, 0, 0)),      # geloest
    (0.7, (0.1, 1.5, 0), (-1.8, 0, 0)),
    (1.0, (-2.9, 0.2, 0), (-2.3, 0, 0)),
]


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
    schuetze = 'griff_l' in m
    bogenarm = BOGENARM['ruhe'] if schuetze else None
    zugarm = None

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
        if schuetze:
            (vor, ab, dreh), ellbogen, griff = bogenarm
            bogenarm = ((vor + 0.04 * math.sin(2 * p), ab, dreh), ellbogen, griff)
    elif ablauf == 'angreifen' and schuetze:
        # Er dreht sich im Sattel, die linke Schulter zum Ziel, und schiesst
        # links am Hals des Pferdes vorbei. So bleibt er den ganzen Ablauf.
        rumpf = (0.05, 0, -1.0)
        kopf = (0, 0, 0.85)
        bogenarm = BOGENARM['schuss']
        zug = _weg([(wann, schulter + ellbogen) for wann, schulter, ellbogen in SCHUSS], t)
        zugarm = (zug[:3], zug[3:])
    elif ablauf == 'angreifen':
        # Ausholen, zuschlagen, zurueck: der Schlag faellt bei 0,5.
        rechts = _weg([(0.0, arme['ruhe']), (0.34, arme['aushol']), (0.52, arme['treffer']),
                       (0.66, arme['treffer']), (1.0, arme['ruhe'])], t)
        wucht = _weg([(0.0, (0.0,)), (0.34, (-0.6,)), (0.52, (1.0,)), (0.66, (0.9,)), (1.0, (0.0,))], t)[0]
        if art in SCHWER:
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
        if schuetze:
            bogenarm = tuple(tuple(a + (b - a) * liegt for a, b in zip(von, nach))
                             for von, nach in zip(BOGENARM['ruhe'], BOGENARM['liegt']))

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
    if bogenarm:
        m['schulter_l'].rotation_euler, m['ellbogen_l'].rotation_euler, m['griff_l'].rotation_euler = bogenarm
    if zugarm:
        m['schulter_r'].rotation_euler, m['ellbogen_r'].rotation_euler = zugarm
    g['zuegel'].scale = (1, 1, 1) if liegt < 0.05 else (0.001, 0.001, 0.001)
    # Wer auf dem Ruecken liegt, liegt auf Fluegeln und Umhang: sie werden
    # flach, sonst schwebte er eine Federlaenge ueber dem Boden.
    for name, rest in (('fluegel', 0.2), ('umhang', 0.45)):
        if name in m:
            m[name].scale = (1, 1 - (1 - rest) * liegt, 1)

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

    if schuetze:
        # Was an keinem Gelenk haengt: die Mitte der Sehne wandert mit der
        # Zughand, der Pfeil liegt zwischen den Haenden und ist mit dem Loesen fort.
        bpy.context.view_layer.update()
        mitte = m['sehne'].data.splines[0].points[1]
        if ablauf == 'angreifen' and 0.19 <= t <= 0.47:
            ort = m['bogen'].matrix_world.inverted() @ m['griff'].matrix_world.translation
            mitte.co = (ort.x, ort.y, ort.z, 1)
        else:
            mitte.co = (0, 0, 0.2, 1)
        if ablauf == 'angreifen' and 0.1 <= t <= 0.47:
            fussvolk.zwischen(m['pfeil'], m['griff'], m['griff_l'])
        else:
            m['pfeil'].scale = fussvolk.WEG


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
