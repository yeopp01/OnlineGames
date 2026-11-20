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
#
# Dazu je eine eigene Tafel: Arbeiten (er holt mit der Axt aus und schlaegt zu -
# ein Ablauf fuer Holz, Stein, Gold, Bauen und den Kampf), Sterben, und fuer
# jede der vier Waren Stehen und Gehen mit der Ladung auf dem Ruecken
# (bedienung AC-16): ein verschnuertes Buendel Holz, ein Korb Beeren, eine
# Kiepe mit Gold oder mit Stein. Wer traegt, hat die Axt weggesteckt.

import math
import os

import drachenei
from formen import aufsetzen, drehkoerper, glied, kugel, leer, quader
from kette import Tafel, szene_leeren
from stoffe import einfarbig, gemustert

GROESSE = 1.06 / 1.75     # Felder je Meter
RICHTUNGEN = 8
SCHRITTE = 8
BILDER = 8                # je Ablauf, der eine eigene Tafel hat
WAREN = ('h', 'n', 'g', 's', 'e')
ZELLE = (224, 176)        # fuer den Hieb und den Sturz; geschrieben wird jede Tafel knapp
FUSS = (90, 130)
WEG = (0.001, 0.001, 0.001)   # so klein, dass es im Bild fehlt

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
        # Was er traegt.
        'scheit': gemustert('scheit', ('#4d3722', '#6f5233', '#84643f'), massstab=(1, 9, 9), groesse=3, detail=4,
                            relief=0.8, fugen=0.7),
        'schnitt': einfarbig('schnitt', '#c9a56c', rau=0.8),
        'seil': einfarbig('seil', '#a8966a', rau=0.9),
        'geflecht': gemustert('geflecht', ('#7a6238', '#9b8250', '#ab9462'), massstab=(1, 1, 14), groesse=6,
                              relief=0.9, fugen=0.6, rau=0.9),
        'beere': einfarbig('beere', '#b02a3e', rau=0.35),
        'blatt': einfarbig('blatt', '#3f6a2c', rau=0.8),
        'gold': gemustert('gold', ('#b8891f', '#e6c046', '#f3d868'), groesse=18, detail=3, relief=0.6, rau=0.3,
                          metall=0.9),
        'stein': gemustert('stein', ('#6f6a62', '#8f8a80', '#a39d90'), groesse=14, detail=5, relief=0.8, fugen=0.5),
    }


def _kiepe(s, eltern, stoff):
    """Ein Tragkorb auf dem Ruecken, oben offen."""
    drehkoerper('kiepe', [(-0.16, 0), (-0.16, 0.11), (0.14, 0.165), (0.16, 0.16), (0.13, 0.14), (-0.12, 0.09), (-0.12, 0)],
                s[stoff], eltern=eltern, streckung=(1.15, 0.85), teile=14)
    for x in (-0.11, 0.11):
        quader('tragriemen', (0.035, 0.26, 0.02), s['leder'], ort=(x, -0.21, 0.2), drehung=(-0.5, 0, 0), eltern=eltern,
               fase=0.006)


def _ladungen(s, g, rumpf):
    """Die fuenf Ladungen, alle am Ruecken; zu sehen ist je Bild hoechstens eine."""
    quer = (0, math.pi / 2, 0)
    g['ladung'] = {}
    # Holz: drei Scheite quer, zweimal verschnuert.
    h = g['ladung']['h'] = leer('ladung_h', (0, 0.25, 0.32), rumpf)
    for y, z, lang in ((0, -0.05, 0.62), (0.01, 0.075, 0.56), (0.105, 0.012, 0.6)):
        drehkoerper('scheit', [(-lang / 2, 0), (-lang / 2, 0.06), (lang / 2, 0.062), (lang / 2, 0)], s['scheit'],
                    ort=(0, y, z), drehung=quer, eltern=h, teile=10)
        for x in (-lang / 2 - 0.002, lang / 2 + 0.002):
            drehkoerper('schnittflaeche', [(-0.002, 0), (-0.002, 0.052), (0.002, 0.052), (0.002, 0)], s['schnitt'],
                        ort=(x, y, z), drehung=quer, eltern=h, teile=10)
    for x in (-0.17, 0.17):
        drehkoerper('schnur', [(-0.012, 0.125), (-0.012, 0.14), (0.012, 0.14), (0.012, 0.125), (-0.012, 0.125)], s['seil'],
                    ort=(x, 0.04, 0.01), drehung=quer, eltern=h, streckung=(1.05, 1.0), teile=12, glatt=False)
    # Nahrung: ein Korb aus Weide, gehaeuft mit Beeren.
    n = g['ladung']['n'] = leer('ladung_n', (0, 0.27, 0.27), rumpf)
    _kiepe(s, n, 'geflecht')
    for x, y, z, r in ((0, 0, 0.15, 0.085), (0.08, 0.02, 0.14, 0.06), (-0.08, -0.01, 0.14, 0.065), (0.02, 0.07, 0.14, 0.055),
                       (-0.03, -0.06, 0.15, 0.055), (0.07, -0.05, 0.14, 0.05)):
        kugel('beeren', r, s['beere'], ort=(x, y, z), eltern=n, teile=8, ringe=6)
    kugel('laub', 0.05, s['blatt'], ort=(-0.09, 0.06, 0.15), eltern=n, streckung=(1.4, 1, 0.4), teile=8, ringe=5)
    # Gold und Stein: eine Kiepe aus Leder, darin die Brocken.
    for ware, stoff in (('g', 'gold'), ('s', 'stein')):
        k = g['ladung'][ware] = leer('ladung_' + ware, (0, 0.27, 0.27), rumpf)
        _kiepe(s, k, 'leder')
        for x, y, z, r in ((0.01, 0, 0.15, 0.09), (0.085, 0.03, 0.13, 0.065), (-0.08, -0.02, 0.13, 0.07),
                           (0, 0.075, 0.13, 0.06), (-0.02, -0.07, 0.14, 0.055)):
            kugel('brocken', r, s[stoff], ort=(x, y, z), eltern=k, streckung=(1.1, 0.9, 0.8), teile=6, ringe=4)
    # Das Drachenei (einheiten AC-51): es steht in der Kiepe und ragt weit
    # heraus - dieselbe Schale mit denselben gluehenden Rissen wie am Boden.
    e = g['ladung']['e'] = leer('ladung_e', (0, 0.27, 0.27), rumpf)
    _kiepe(s, e, 'leder')
    drachenei.ei(drachenei.stoffe(), eltern=e, ort=(0, 0, -0.03), hoch=0.4, neigung=(-0.08, 0.05, 0))


def bauen():
    """Baut die Figur und gibt ihre Gelenke zurueck."""
    s = stoffe()
    g = {}
    g['figur'] = leer('figur')
    g['figur'].scale = (GROESSE, GROESSE, GROESSE)
    # Wer faellt, kippt um seine Fuesse: dafuer ein Gelenk am Boden.
    g['koerper'] = leer('koerper', (0, 0, 0), g['figur'])
    g['becken'] = leer('becken', (0, 0, 0.93), g['koerper'])
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
    drehkoerper('kragen', [(0.62, 0.08), (0.57, 0.125), (0.52, 0.225), (0.47, 0.25), (0.44, 0.246), (0.455, 0.19), (0.49, 0)],
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
    # Zum Schlagen fasst er sie am Ende: der Schaft rutscht dann durch die Hand.
    g['axt'] = leer('axt', (0, -0.01, -0.04), g['hand_r'])
    g['schaft'] = leer('schaft', (0, 0, 0), g['axt'])
    quader('stiel', (0.034, 0.034, 0.62), s['holz'], ort=(0, 0, -0.2), eltern=g['schaft'], fase=0.008)
    quader('axtkopf', (0.036, 0.2, 0.11), s['eisen'], ort=(0, -0.085, 0.07), eltern=g['schaft'], fase=0.014)
    _ladungen(s, g, rumpf)

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


GELENKE = ('becken', 'rumpf', 'kopf', 'schulter_l', 'ellbogen_l', 'hand_l', 'schulter_r', 'ellbogen_r', 'hand_r',
           'huefte_l', 'knie_l', 'knoechel_l', 'huefte_r', 'knie_r', 'knoechel_r')

# Arbeiten: bereit, ausgeholt, geschlagen. Je Gelenk drei Winkel; `axt` ist
# die Neigung der Axt an der Figur: 0 zeigt nach vorn, -pi/2 nach oben.
BEREIT = {'rumpf': (0.08, 0, -0.2), 'kopf': (0, 0, 0.15), 'schulter_r': (-0.5, 0.15, 0), 'ellbogen_r': (-1.3, 0, 0),
          'schulter_l': (-0.5, -0.1, 0), 'ellbogen_l': (-1.2, 0, -0.5), 'axt': (-1.1,)}
AUSGEHOLT = {'rumpf': (-0.12, 0, -0.35), 'kopf': (0.1, 0, 0.2), 'schulter_r': (-2.5, 0.2, 0), 'ellbogen_r': (-1.1, 0, 0),
             'schulter_l': (-1.4, -0.1, 0), 'ellbogen_l': (-1.2, 0, -0.5), 'axt': (-2.5,)}
GESCHLAGEN = {'rumpf': (0.38, 0, 0.25), 'kopf': (-0.15, 0, -0.1), 'schulter_r': (-0.95, 0.1, 0), 'ellbogen_r': (-0.35, 0, 0),
              'schulter_l': (-0.7, -0.15, 0), 'ellbogen_l': (-0.8, 0, -0.4), 'axt': (0.55,)}
# Nach dem Hieb drueckt er nach - bliebe er stehen, stuende ein Bild doppelt auf der Tafel.
NACHGESETZT = {**GESCHLAGEN, 'rumpf': (0.45, 0, 0.3), 'kopf': (-0.2, 0, -0.1), 'schulter_r': (-0.82, 0.1, 0),
               'axt': (0.72,)}
SCHLAG = [(0.0, BEREIT), (0.36, AUSGEHOLT), (0.5, GESCHLAGEN), (0.64, NACHGESETZT), (1.0, BEREIT)]
# Am Boden, auf dem Ruecken.
LIEGT = {'rumpf': (0, 0, 0), 'kopf': (0.1, 0, 0.5), 'schulter_l': (0.1, -1.15, 0), 'ellbogen_l': (-0.4, 0, 0),
         'schulter_r': (0.1, 1.0, 0), 'ellbogen_r': (-0.5, 0, 0)}


def _glatt(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def _mischen(a, b, u):
    return {name: tuple(x + (y - x) * u for x, y in zip(a[name], b[name])) for name in a}


def stellen(g, ablauf, t=0.0, ladung=None):
    """Bringt die Figur in ein Bild eines Ablaufs; t laeuft von 0 bis 1.

    `ladung`: 'h', 'n', 'g', 's' oder 'e' (das Drachenei) - dann traegt er sie und hat keine Axt.
    """
    for name in GELENKE:
        g[name].rotation_euler = (0, 0, 0)
    g['axt'].rotation_euler = (0.55, 0, 0)
    g['axt'].scale = WEG if ladung else (1, 1, 1)
    g['schaft'].location.z = 0
    for ware, halter in g['ladung'].items():
        halter.scale = (1, 1, 1) if ware == ladung else WEG
    g['koerper'].rotation_euler = (0, 0, 0)
    g['koerper'].location = (0, 0, 0)
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
    elif ablauf in ('arbeiten', 'angreifen'):
        # Das linke Bein steht vor, im Schlag geht er in die Knie.
        haltung = SCHLAG[-1][1]
        for (t0, a), (t1, b) in zip(SCHLAG, SCHLAG[1:]):
            if t <= t1:
                haltung = _mischen(a, b, _glatt((t - t0) / (t1 - t0)))
                break
        for name in ('rumpf', 'kopf', 'schulter_l', 'ellbogen_l', 'schulter_r', 'ellbogen_r'):
            g[name].rotation_euler = haltung[name]
        tief = max(0.0, haltung['rumpf'][0] - 0.08) / 0.3
        beine = {'l': (-0.3 - 0.2 * tief, 0.32 + 0.25 * tief), 'r': (0.26 + 0.1 * tief, 0.12)}
        # Am Ende gefasst; die Neigung der Axt rechnet heraus, was Rumpf und Arm schon gekippt haben.
        g['schaft'].location.z = 0.42
        g['axt'].rotation_euler = (math.pi / 2 + haltung['axt'][0] - haltung['rumpf'][0] - haltung['schulter_r'][0]
                                   - haltung['ellbogen_r'][0], 0, 0)
    else:
        beine = {'l': (-0.03, 0.04), 'r': (0.02, 0.03)}
        g['huefte_l'].rotation_euler.y = -0.05
        g['huefte_r'].rotation_euler.y = 0.05
        g['schulter_l'].rotation_euler = (0.03, -0.14, 0)
        g['ellbogen_l'].rotation_euler = (-0.2, 0, 0)
        g['schulter_r'].rotation_euler = (0.0, 0.14, 0)
        g['ellbogen_r'].rotation_euler = (-0.22, 0, 0)
        g['rumpf'].rotation_euler = (0.02, 0, 0)
    if ladung and ablauf in ('stehen', 'gehen'):
        # Unter der Last geht er vorgebeugt, die Haende an den Riemen.
        g['rumpf'].rotation_euler.x += 0.14
        g['kopf'].rotation_euler.x -= 0.1
        for seite, aussen in (('l', -1), ('r', 1)):
            schwung = g['schulter_' + seite].rotation_euler.x * 0.3
            g['schulter_' + seite].rotation_euler = (-0.35 + schwung, aussen * 0.1, 0)
            g['ellbogen_' + seite].rotation_euler = (-2.0, 0, aussen * 0.35)
    liegen = 0.0
    if ablauf == 'sterben':
        # Getroffen knickt er ein, kippt nach hinten und bleibt auf dem Ruecken liegen.
        # Der Fall reicht bis zum letzten Bild (wie beim Fussvolk).
        liegen = _glatt((t - 0.1) / 0.9)
        knick = math.sin(math.pi * min(1.0, t / 0.7))
        steht = {name: tuple(g[name].rotation_euler) for name in LIEGT}
        for name, winkel in _mischen(steht, LIEGT, liegen).items():
            g[name].rotation_euler = winkel
        g['rumpf'].rotation_euler.x -= 0.3 * knick
        beine = {'l': (-0.03 * (1 - liegen) - 0.06 * liegen - 0.45 * knick, 0.04 + 0.08 * liegen + knick),
                 'r': (0.02 * (1 - liegen) - 0.3 * liegen - 0.45 * knick, 0.03 + 0.57 * liegen + knick)}
        g['koerper'].rotation_euler = (-math.pi / 2 * liegen, 0, 0)
        g['koerper'].location = (0, -0.4 * liegen, 0)

    # Das Becken steht so hoch, dass das tiefere Bein genau den Boden beruehrt
    # - sonst schwebt die Figur im weiten Schritt.
    tiefe = 0.0
    for seite, (huefte, knie) in beine.items():
        g['huefte_' + seite].rotation_euler.x = huefte
        g['knie_' + seite].rotation_euler.x = knie
        g['knoechel_' + seite].rotation_euler.x = -(huefte + knie) * 0.75
        tiefe = max(tiefe, OBERSCHENKEL * math.cos(huefte) + UNTERSCHENKEL * math.cos(huefte + knie))
    g['becken'].location.z = HUEFTE_TIEFER + tiefe + KNOECHEL
    if ablauf == 'sterben':
        aufsetzen(g['koerper'], g['koerper'])


def tafel(ziel):
    szene_leeren()
    g = bauen()
    blatt = Tafel('dorfbewohner', zelle=ZELLE, fuss=FUSS, ziel=ziel, knapp=True)
    # Zum Ansehen beim Bauen: '1' drei Richtungen und vier Bilder je Ablauf,
    # '2' eine Richtung mit allen Bildern.
    probe = os.environ.get('BILDER_PROBE')
    richtungen = {'1': [1, 3, 6], '2': [1]}.get(probe, list(range(RICHTUNGEN)))
    schritte = [0, 3, 4, 7] if probe == '1' else list(range(SCHRITTE))
    for zeile, richtung in enumerate(richtungen):
        g['figur'].rotation_euler = (0, 0, math.radians(45 + 45 * richtung))
        stellen(g, 'stehen')
        blatt.bild(zeile, 0)
        for spalte, schritt in enumerate(schritte):
            stellen(g, 'gehen', schritt / SCHRITTE)
            blatt.bild(zeile, 1 + spalte)
        for spalte, bild in enumerate(schritte):
            stellen(g, 'arbeiten', bild / BILDER)
            blatt.bild(zeile, spalte, teil='arbeiten')
        for spalte, bild in enumerate(schritte):
            # Sterben laeuft einmal: das letzte Bild ist das Ende.
            stellen(g, 'sterben', bild / (BILDER - 1))
            blatt.bild(zeile, spalte, teil='sterben')
        for ware in WAREN:
            stellen(g, 'stehen', ladung=ware)
            blatt.bild(zeile, 0, teil=ware)
            for spalte, schritt in enumerate(schritte):
                stellen(g, 'gehen', schritt / SCHRITTE, ladung=ware)
                blatt.bild(zeile, 1 + spalte, teil=ware)
    ablaeufe = {
        'stehen': {'spalte': 0, 'bilder': 1},
        'gehen': {'spalte': 1, 'bilder': len(schritte)},
        'arbeiten': {'spalte': 0, 'bilder': len(schritte)},
        'sterben': {'spalte': 0, 'bilder': len(schritte), 'einmal': True},
    }
    # Mit Ladung: Stehen und Gehen teilen sich eine Tafel je Ware.
    for ware in WAREN:
        ablaeufe['stehen_' + ware] = {'spalte': 0, 'bilder': 1, 'teil': ware}
        ablaeufe['gehen_' + ware] = {'spalte': 1, 'bilder': len(schritte), 'teil': ware}
    return blatt.schreiben({
        'art': 'figur',
        'richtungen': len(richtungen),
        'hoehe': round(1.06 * math.cos(math.radians(30)) / math.sqrt(2) * 132),
        'ablaeufe': ablaeufe,
    })
