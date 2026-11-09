# Der Dorfbewohner: ein Gliedermann aus Gelenken und gerundeten Stuecken.
#
# Gebaut in Metern (1,75 gross) und als Ganzes auf Spielgroesse gebracht - im
# Spiel ist ein Mensch gut ein Feld hoch, wie in der Vorlage. Er schaut nach
# -Y; seine rechte Hand ist bei -X.
#
# Kleidung: helle Tunika mit Guertel, dunkle Beinlinge, Stiefel - und eine
# Gugel (Kapuze mit Schulterkragen) in der Farbe des Spielers. Von schraeg
# oben sieht man Kopf und Schultern am besten; dort steht die Farbe.
#
# Die Tafel: je Zeile eine Blickrichtung (0 schaut zum Betrachter, dann gegen
# den Uhrzeigersinn von oben gesehen: 2 nach rechts, 4 weg, 6 nach links), je
# Spalte ein Bild - erst Stehen, dann acht Bilder Gehen.

import math
import os

from formen import drehkoerper, glied, kugel, leer, quader
from kette import Tafel, szene_leeren
from stoffe import einfarbig, gemustert

GROESSE = 1.06 / 1.75     # Felder je Meter
RICHTUNGEN = 8
SCHRITTE = 8

OBERSCHENKEL = 0.42
UNTERSCHENKEL = 0.4
KNOECHEL = 0.08
HUEFTE_TIEFER = 0.03      # die Hueftgelenke sitzen etwas unter dem Becken


def stoffe():
    return {
        'tunika': gemustert('tunika', ('#75633f', '#8a7650', '#9a865c'), groesse=16, detail=2, relief=0.3,
                            fugen=0.6, rau=0.95),
        'leinen': gemustert('leinen', ('#8f8468', '#aba083'), groesse=40, detail=2, relief=0.25, fugen=0.5),
        'hose': gemustert('hose', ('#3a3026', '#52453a'), groesse=30, detail=3, relief=0.3, fugen=0.5),
        'leder': gemustert('leder', ('#3f2c1d', '#5e432b', '#70522f'), groesse=14, detail=4, relief=0.5,
                           fugen=0.5, rau=0.7),
        'haut': einfarbig('haut', '#c08d68', rau=0.65),
        'bart': einfarbig('bart', '#3f2a1c', rau=0.95),
        'auge': einfarbig('auge', '#1c1612', rau=0.4),
        'gugel': gemustert('gugel', ('#7e7e7e', '#b4b4b4'), groesse=36, detail=3, relief=0.35, fugen=0.55,
                           rau=0.95, spieler=True),
        'holz': gemustert('stiel', ('#6b4a2c', '#8c6638'), massstab=(8, 1, 8), groesse=4, relief=0.5),
        'eisen': gemustert('eisen', ('#6d7176', '#a3a8ad'), groesse=20, detail=2, relief=0.15, rau=0.38,
                           metall=0.85),
    }


def bauen():
    """Baut die Figur und gibt ihre Gelenke zurueck."""
    s = stoffe()
    g = {}
    g['figur'] = leer('figur')
    g['figur'].scale = (GROESSE, GROESSE, GROESSE)
    g['becken'] = leer('becken', (0, 0, 0.93), g['figur'])
    g['rumpf'] = leer('rumpf', (0, 0, 0), g['becken'])
    rumpf = g['rumpf']

    # Die Tunika: Schultern, Taille, ein Rock bis ueber die Knie.
    drehkoerper('tunika', [(0.55, 0), (0.54, 0.085), (0.51, 0.17), (0.47, 0.228), (0.35, 0.222), (0.15, 0.198),
                           (0.07, 0.202), (-0.08, 0.24), (-0.27, 0.285), (-0.25, 0.23), (-0.18, 0)],
                s['tunika'], eltern=rumpf, streckung=(1, 0.7), teile=18)
    drehkoerper('guertel', [(0.115, 0.198), (0.115, 0.213), (0.065, 0.217), (0.065, 0.202)], s['leder'],
                eltern=rumpf, streckung=(1, 0.7), teile=18)
    quader('schnalle', (0.04, 0.012, 0.045), s['eisen'], ort=(0, -0.152, 0.09), eltern=rumpf, fase=0.004)
    quader('tasche', (0.085, 0.05, 0.1), s['leder'], ort=(0.13, -0.14, 0.02), eltern=rumpf, fase=0.02)

    # Kopf und Gugel.
    g['kopf'] = leer('kopf', (0, 0, 0.57), rumpf)
    kopf = g['kopf']
    glied('hals', 0.08, 0.05, 0.055, s['haut'], eltern=kopf, ort=(0, 0, 0.03))
    kugel('schaedel', 0.118, s['haut'], ort=(0, 0, 0.125), eltern=kopf, streckung=(0.9, 1.0, 1.14))
    kugel('nase', 0.022, s['haut'], ort=(0, -0.118, 0.115), eltern=kopf, teile=8, ringe=6)
    for x in (-0.04, 0.04):
        kugel('auge', 0.014, s['auge'], ort=(x, -0.104, 0.148), eltern=kopf, teile=8, ringe=6)
    kugel('bart', 0.078, s['bart'], ort=(0, -0.058, 0.058), eltern=kopf, streckung=(1.05, 0.85, 0.75), teile=12, ringe=8)
    kugel('kapuze', 0.14, s['gugel'], ort=(0, 0.014, 0.132), eltern=kopf, streckung=(0.95, 1.02, 1.12),
          weglassen=lambda x, y, z: y < -0.42 and -0.8 < z < 0.52)
    quader('zipfel', (0.05, 0.05, 0.2), s['gugel'], ort=(0, 0.15, 0.07), drehung=(0.35, 0, 0), eltern=kopf, fase=0.02)
    drehkoerper('kragen', [(0.62, 0.08), (0.57, 0.125), (0.5, 0.255), (0.4, 0.292), (0.34, 0.288), (0.36, 0.22), (0.42, 0)],
                s['gugel'], eltern=rumpf, streckung=(1, 0.76), teile=18)

    # Arme: Aermel der Tunika, darunter Leinen, die Hand.
    for seite, x in (('l', 0.238), ('r', -0.238)):
        g['schulter_' + seite] = leer('schulter_' + seite, (x, 0, 0.45), rumpf)
        glied('oberarm', 0.27, 0.076, 0.064, s['tunika'], eltern=g['schulter_' + seite])
        g['ellbogen_' + seite] = leer('ellbogen_' + seite, (0, 0, -0.27), g['schulter_' + seite])
        glied('unterarm', 0.24, 0.058, 0.046, s['leinen'], eltern=g['ellbogen_' + seite])
        g['hand_' + seite] = leer('hand_' + seite, (0, 0, -0.25), g['ellbogen_' + seite])
        kugel('hand', 0.054, s['haut'], ort=(0, 0, -0.035), eltern=g['hand_' + seite], streckung=(0.7, 1.0, 1.3),
              teile=10, ringe=6)

    # Die Axt in der Rechten, kurz unter dem Kopf gefasst; der Stiel haengt.
    achse = leer('axt', (0, -0.01, -0.04), g['hand_r'])
    achse.rotation_euler = (0.55, 0, 0)
    quader('stiel', (0.034, 0.034, 0.62), s['holz'], ort=(0, 0, -0.2), eltern=achse, fase=0.008)
    quader('axtkopf', (0.036, 0.2, 0.11), s['eisen'], ort=(0, -0.085, 0.07), eltern=achse, fase=0.014)

    # Beine: Beinlinge, Stiefel bis zur halben Wade.
    for seite, x in (('l', 0.1), ('r', -0.1)):
        g['huefte_' + seite] = leer('huefte_' + seite, (x, 0, -HUEFTE_TIEFER), g['becken'])
        glied('oberschenkel', OBERSCHENKEL, 0.105, 0.078, s['hose'], eltern=g['huefte_' + seite])
        g['knie_' + seite] = leer('knie_' + seite, (0, 0, -OBERSCHENKEL), g['huefte_' + seite])
        glied('unterschenkel', UNTERSCHENKEL, 0.075, 0.056, s['hose'], eltern=g['knie_' + seite])
        glied('stiefelschaft', 0.2, 0.076, 0.066, s['leder'], eltern=g['knie_' + seite], ort=(0, 0, -UNTERSCHENKEL + 0.2))
        g['knoechel_' + seite] = leer('knoechel_' + seite, (0, 0, -UNTERSCHENKEL), g['knie_' + seite])
        quader('stiefel', (0.12, 0.28, 0.095), s['leder'], ort=(0, -0.06, -KNOECHEL + 0.0475),
               eltern=g['knoechel_' + seite], fase=0.03)
    return g


def stellen(g, ablauf, t=0.0):
    """Bringt die Figur in ein Bild eines Ablaufs; t laeuft von 0 bis 1."""
    for name, gelenk in g.items():
        if name != 'figur':
            gelenk.rotation_euler = (0, 0, 0)
    beine = {'l': (0.0, 0.0), 'r': (0.0, 0.0)}   # (Huefte, Knie), vor ist negativ
    if ablauf == 'gehen':
        p = 2 * math.pi * t
        for seite, versatz in (('l', 0.0), ('r', math.pi)):
            q = p + versatz
            huefte = -0.44 * math.sin(q) + 0.04
            knie = 1.0 * max(0.0, math.cos(q)) ** 1.3 + 0.08
            beine[seite] = (huefte, knie)
        g['schulter_l'].rotation_euler = (0.42 * math.sin(p), -0.1, 0)
        g['ellbogen_l'].rotation_euler = (-0.3 - 0.15 * max(0.0, -math.sin(p)), 0, 0)
        g['schulter_r'].rotation_euler = (-0.24 * math.sin(p), 0.12, 0)
        g['ellbogen_r'].rotation_euler = (-0.28, 0, 0)
        g['rumpf'].rotation_euler = (0.07, 0, 0.09 * math.sin(p))
        g['kopf'].rotation_euler = (-0.04, 0, -0.06 * math.sin(p))
    else:
        beine = {'l': (-0.03, 0.04), 'r': (0.02, 0.03)}
        g['huefte_l'].rotation_euler.y = -0.05
        g['huefte_r'].rotation_euler.y = 0.05
        g['schulter_l'].rotation_euler = (0.03, -0.14, 0)
        g['ellbogen_l'].rotation_euler = (-0.2, 0, 0)
        g['schulter_r'].rotation_euler = (0.0, 0.14, 0)
        g['ellbogen_r'].rotation_euler = (-0.22, 0, 0)
        g['rumpf'].rotation_euler = (0.02, 0, 0)

    # Das Becken steht so hoch, dass das tiefere Bein genau den Boden beruehrt
    # - sonst schwebt die Figur im weiten Schritt.
    tiefe = 0.0
    for seite, (huefte, knie) in beine.items():
        g['huefte_' + seite].rotation_euler.x = huefte
        g['knie_' + seite].rotation_euler.x = knie
        g['knoechel_' + seite].rotation_euler.x = -(huefte + knie) * 0.75
        tiefe = max(tiefe, OBERSCHENKEL * math.cos(huefte) + UNTERSCHENKEL * math.cos(huefte + knie))
    g['becken'].location.z = HUEFTE_TIEFER + tiefe + KNOECHEL


def tafel(ziel):
    szene_leeren()
    g = bauen()
    blatt = Tafel('dorfbewohner', zelle=(144, 128), fuss=(56, 102), ziel=ziel)
    probe = os.environ.get('BILDER_PROBE') == '1'
    schritte = [0, 2] if probe else list(range(SCHRITTE))
    for richtung in range(RICHTUNGEN):
        g['figur'].rotation_euler = (0, 0, math.radians(45 + 45 * richtung))
        stellen(g, 'stehen')
        blatt.bild(richtung, 0)
        for spalte, schritt in enumerate(schritte):
            stellen(g, 'gehen', schritt / SCHRITTE)
            blatt.bild(richtung, 1 + spalte)
    return blatt.schreiben({
        'art': 'figur',
        'richtungen': RICHTUNGEN,
        'hoehe': round(1.06 * math.cos(math.radians(30)) / math.sqrt(2) * 132),
        'ablaeufe': {'stehen': {'spalte': 0, 'bilder': 1}, 'gehen': {'spalte': 1, 'bilder': len(schritte)}},
    })
