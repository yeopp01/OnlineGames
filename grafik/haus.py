# Das Haus der Dunklen Zeit: Fachwerk auf Bruchstein, Strohdach.
#
# Grundflaeche zwei mal zwei Felder, die Mitte steht auf (0, 0, 0). Der First
# laeuft laengs X. Im Bild sieht man die lange Wand mit der Tuer (-Y, im
# Licht) und den Giebel (+X, im eigenen Schatten).

import math
import random

from formen import drehkoerper, netz, prisma, quader
from kette import Tafel, szene_leeren
from stoffe import einfarbig, feldstein, gemustert

LAENGE = 1.74
BREITE = 1.36
WAND = 1.05
SOCKEL = 0.14
FIRST = 0.8           # Hoehe des Dachs ueber der Wand
UEBERSTAND = 0.11     # das Dach ragt ueber die Traufe
ORTGANG = 0.13        # und ueber den Giebel


def stoffe():
    return {
        'putz': gemustert('putz', ('#b9a988', '#d6c9a8', '#e2d7ba'), groesse=5, detail=8, relief=0.35, fugen=0.75),
        'balken': gemustert('balken', ('#3d2a1b', '#5c4028', '#73522f'), massstab=(6, 6, 6), groesse=3,
                            detail=5, relief=0.6, fugen=0.6),
        'brett': gemustert('brett', ('#4f3924', '#6f5033', '#86633f'), massstab=(8, 8, 1.2), groesse=3,
                           detail=4, relief=0.7, fugen=0.7),
        'stroh': gemustert('stroh', ('#6f5f3e', '#96824f', '#b3a06c'), massstab=(46, 1.6, 1), groesse=1,
                           detail=3, relief=1.0, fugen=0.55, koordinaten='UV', kontrast=(0.25, 0.75)),
        'stein': feldstein('stein'),
        'scheit': gemustert('scheit', ('#7a5a38', '#a07a4c', '#c09a66'), massstab=(3, 3, 9), groesse=4,
                            relief=0.5, fugen=0.6),
        'eisen': einfarbig('eisen', '#4a4a4c', rau=0.45, metall=0.9),
        'dunkel': einfarbig('dunkel', '#15110d', rau=1.0),
        'tuch': gemustert('tuch', ('#8a8a8a', '#c2c2c2'), groesse=60, detail=2, relief=0.25, rau=0.9,
                          spieler=True),
    }


def _dachseite(name, s, seite, von, bis, heben, zufall):
    """Eine Lage Stroh auf einer Dachseite, von Anteil `von` bis `bis` der
    Schraege (0 ist der First). Jede Lage liegt etwas hoeher als die darunter
    und endet in einer ausgefransten Kante."""
    spalten, reihen = 30, 7
    halb = LAENGE / 2 + ORTGANG
    traufe_y = BREITE / 2 + UEBERSTAND
    oben_z = SOCKEL + WAND + FIRST
    unten_z = SOCKEL + WAND - UEBERSTAND * FIRST / (BREITE / 2)
    schraege = math.hypot(traufe_y, oben_z - unten_z)
    # Die Flaeche steht senkrecht dazu nach aussen.
    ny, nz = (oben_z - unten_z) / schraege, traufe_y / schraege
    ecken, uv = [], []
    for i in range(spalten + 1):
        x = -halb + 2 * halb * i / spalten
        franse = zufall.uniform(-0.035, 0.035)
        for j in range(reihen + 1):
            t = von + (bis - von) * j / reihen
            if j == reihen:
                t += franse / schraege
            bauch = 0.035 * math.sin(math.pi * t) + heben + zufall.uniform(-0.008, 0.008)
            y = traufe_y * t + ny * bauch
            z = oben_z - (oben_z - unten_z) * t + nz * bauch
            rand = zufall.uniform(-0.02, 0.02) if i in (0, spalten) else 0
            ecken.append((x + rand, seite * y, z))
            uv.append((x, t * schraege))
    seiten = []
    for i in range(spalten):
        for j in range(reihen):
            a = i * (reihen + 1) + j
            b = a + reihen + 1
            viereck = (a, b, b + 1, a + 1) if seite < 0 else (a, a + 1, b + 1, b)
            seiten.append(viereck)
    return netz(name, ecken, seiten, s['stroh'], glatt=True, dicke=0.09, uv=uv)


def bauen():
    s = stoffe()
    zufall = random.Random(7)
    vorn = -BREITE / 2
    giebel = LAENGE / 2
    wandmitte = SOCKEL + WAND / 2

    quader('sockel', (LAENGE + 0.1, BREITE + 0.1, SOCKEL), s['stein'], ort=(0, 0, SOCKEL / 2), fase=0.03)
    quader('wand', (LAENGE - 0.03, BREITE - 0.03, WAND), s['putz'], ort=(0, 0, wandmitte), fase=0)
    for seite in (-1, 1):
        prisma('giebel', [(-BREITE / 2 + 0.015, 0), (BREITE / 2 - 0.015, 0), (0, FIRST - 0.02)], 0.03,
               s['putz'], ort=(seite * (giebel - 0.03), 0, SOCKEL + WAND), drehung=(0, 0, math.pi / 2))

    # Fachwerk der langen Wand: Schwelle, Raehm, Staender, Riegel, Streben.
    b = 0.075
    quader('schwelle', (LAENGE + 0.04, b, b), s['balken'], ort=(0, vorn, SOCKEL + b / 2))
    quader('raehm', (LAENGE + 0.16, b + 0.01, b + 0.01), s['balken'], ort=(0, vorn, SOCKEL + WAND - b / 2))
    staender = [-giebel + b / 2, -0.6, -0.2, 0.34, giebel - b / 2]
    for x in staender:
        quader('staender', (b, b + 0.005, WAND), s['balken'], ort=(x, vorn, wandmitte))
    riegel_z = SOCKEL + 0.56
    for links, rechts in ((staender[0], staender[1]), (staender[2], staender[3]), (staender[3], staender[4])):
        quader('riegel', (rechts - links, b * 0.85, b * 0.85), s['balken'],
               ort=((links + rechts) / 2, vorn, riegel_z))
    # Zwei Streben im rechten Gefach, von der Schwelle zum Staender.
    for x, neigung in ((0.55, -0.62), (0.07, 0.5)):
        quader('strebe', (b * 0.8, b * 0.8, 0.56), s['balken'],
               ort=(x, vorn - 0.003, SOCKEL + 0.3), drehung=(0, neigung, 0))

    # Der Giebel: Eckstaender, Mittelstaender, Riegel, Kehlbalken, Sparren.
    quader('schwelle', (b, BREITE + 0.04, b), s['balken'], ort=(giebel, 0, SOCKEL + b / 2))
    quader('balken', (b + 0.01, BREITE + 0.2, b + 0.01), s['balken'], ort=(giebel, 0, SOCKEL + WAND - b / 2))
    for y in (vorn + b / 2, 0, -vorn - b / 2):
        quader('staender', (b + 0.005, b, WAND), s['balken'], ort=(giebel, y, wandmitte))
    quader('riegel', (b * 0.85, BREITE, b * 0.85), s['balken'], ort=(giebel, 0, riegel_z))
    quader('koenig', (b, b, FIRST - 0.12), s['balken'], ort=(giebel, 0, SOCKEL + WAND + (FIRST - 0.12) / 2))
    quader('kehlbalken', (b * 0.85, BREITE * 0.5, b * 0.85), s['balken'], ort=(giebel, 0, SOCKEL + WAND + FIRST * 0.48))
    schraege = math.hypot(BREITE / 2 + UEBERSTAND, FIRST * (1 + UEBERSTAND / (BREITE / 2)))
    winkel = math.atan2(FIRST, BREITE / 2)
    for seite in (-1, 1):
        quader('sparren', (b, schraege, b), s['balken'],
               ort=(giebel + ORTGANG - 0.03, seite * (BREITE / 2 + UEBERSTAND) / 2,
                    SOCKEL + WAND + FIRST / 2 - UEBERSTAND * FIRST / BREITE - 0.03),
               drehung=(-seite * winkel, 0, 0))

    # Die Tuer zwischen dem zweiten und dritten Staender: Bretter, zwei
    # Querleisten, ein Ring.
    tuer_x, tuer_b, tuer_h = -0.4, 0.3, 0.82
    quader('tuersturz', (tuer_b + 0.09, b, b * 0.9), s['balken'], ort=(tuer_x, vorn, SOCKEL + b + tuer_h + 0.02))
    quader('tuerloch', (tuer_b + 0.02, 0.03, tuer_h + 0.02), s['dunkel'], ort=(tuer_x, vorn + 0.02, SOCKEL + b + tuer_h / 2), fase=0)
    for i in range(4):
        x = tuer_x - tuer_b / 2 + (i + 0.5) * tuer_b / 4
        quader('tuerbrett', (tuer_b / 4 - 0.008, 0.025, tuer_h - zufall.uniform(0, 0.015)), s['brett'],
               ort=(x, vorn + 0.005, SOCKEL + b + tuer_h / 2), fase=0.006)
    for z in (0.18, 0.62):
        quader('leiste', (tuer_b, 0.02, 0.05), s['balken'], ort=(tuer_x, vorn - 0.012, SOCKEL + b + z), fase=0.005)
    drehkoerper('ring', [(-0.006, 0.018), (0.006, 0.018), (0.006, 0.03), (-0.006, 0.03), (-0.006, 0.018)], s['eisen'],
                ort=(tuer_x + 0.09, vorn - 0.03, SOCKEL + b + 0.4), drehung=(math.pi / 2, 0, 0), teile=10)
    quader('stufe', (tuer_b + 0.2, 0.2, 0.05), s['stein'], ort=(tuer_x, vorn - 0.13, 0.025), fase=0.02)

    # Ein Fenster in der langen Wand, eines im Giebel, je mit Laden.
    def fenster(ort, laengs):
        breit, hoch = 0.2, 0.22
        mass_loch = (breit, 0.03, hoch) if laengs else (0.03, breit, hoch)
        quader('fensterloch', mass_loch, s['dunkel'], ort=ort, fase=0)
        for dz in (-hoch / 2 - 0.02, hoch / 2 + 0.02):
            mass = (breit + 0.09, 0.05, 0.04) if laengs else (0.05, breit + 0.09, 0.04)
            quader('fensterrahmen', mass, s['balken'], ort=(ort[0], ort[1], ort[2] + dz), fase=0.006)
        for d in (-breit / 2 - 0.02, breit / 2 + 0.02):
            mass = (0.04, 0.05, hoch) if laengs else (0.05, 0.04, hoch)
            wo = (ort[0] + d, ort[1], ort[2]) if laengs else (ort[0], ort[1] + d, ort[2])
            quader('fensterrahmen', mass, s['balken'], ort=wo, fase=0.006)
        # Kreuz im Fenster
        mass = (0.018, 0.02, hoch) if laengs else (0.02, 0.018, hoch)
        quader('sprosse', mass, s['balken'], ort=ort, fase=0)
        # Der Laden steht offen, an der Wand.
        if laengs:
            quader('laden', (breit * 0.62, 0.02, hoch + 0.03), s['brett'],
                   ort=(ort[0] + breit * 0.86, ort[1] - 0.02, ort[2]), fase=0.005)
        else:
            quader('laden', (0.02, breit * 0.62, hoch + 0.03), s['brett'],
                   ort=(ort[0] + 0.02, ort[1] + breit * 0.86, ort[2]), fase=0.005)

    fenster((0.07, vorn - 0.002, SOCKEL + 0.82), True)
    fenster((giebel + 0.002, -0.34, SOCKEL + 0.82), False)

    # Das Banner des Besitzers: ein Tuch am Querholz einer Stange vor dem
    # Haus - frei im Licht, damit man den Besitz auch klein erkennt.
    mast = (0.8, vorn - 0.2)
    hoch = 1.5
    quader('bannermast', (0.035, 0.035, hoch), s['balken'], ort=(mast[0], mast[1], hoch / 2), fase=0.006)
    quader('bannerholz', (0.34, 0.028, 0.028), s['balken'], ort=(mast[0], mast[1] - 0.02, hoch - 0.08), fase=0.006)
    spalten, reihen = 8, 12
    ecken, seiten = [], []
    for i in range(spalten + 1):
        for j in range(reihen + 1):
            u, v = i / spalten, j / reihen
            welle = 0.02 * math.sin(u * 6 + v * 4) * v
            spitze = 0.09 * (1 - abs(u - 0.5) * 2) if j == reihen else 0
            ecken.append((mast[0] - 0.15 + 0.3 * u, mast[1] - 0.04 - welle, hoch - 0.09 - 0.5 * v - spitze))
    for i in range(spalten):
        for j in range(reihen):
            a = i * (reihen + 1) + j
            seiten.append((a, a + reihen + 1, a + reihen + 2, a + 1))
    netz('banner', ecken, seiten, s['tuch'], glatt=True, dicke=0.008)

    # Das Dach: drei Lagen Stroh je Seite, die oberen kuerzer.
    for seite in (-1, 1):
        _dachseite('stroh-unten', s, seite, 0.0, 1.0, 0.0, zufall)
        _dachseite('stroh-mitte', s, seite, 0.0, 0.62, 0.035, zufall)
        _dachseite('stroh-first', s, seite, 0.0, 0.2, 0.07, zufall)
    # Firstreiter: gekreuzte Stangen halten das Stroh am First.
    oben = SOCKEL + WAND + FIRST
    for i in range(5):
        x = -LAENGE / 2 + 0.1 + i * (LAENGE - 0.2) / 4
        for seite in (-1, 1):
            quader('reiter', (0.03, 0.03, 0.46), s['balken'],
                   ort=(x + seite * 0.016, seite * 0.07, oben + 0.02), drehung=(seite * 0.62, 0, 0), fase=0.005)

    # Was vor einem Haus liegt: ein Stapel Scheite und ein Fass.
    r, lang = 0.05, 0.3
    for reihe, anzahl in enumerate((4, 3, 2)):
        for i in range(anzahl):
            x = -0.02 + (i - (anzahl - 1) / 2) * r * 2.05 + zufall.uniform(-0.004, 0.004)
            drehkoerper('scheit', [(-lang / 2, 0), (-lang / 2, r * 0.95), (lang / 2, r), (lang / 2, 0)], s['scheit'],
                        ort=(x + 0.02, vorn - 0.06 - lang / 2 + zufall.uniform(-0.02, 0.02), r + reihe * r * 1.75),
                        drehung=(math.pi / 2, 0, zufall.uniform(-0.05, 0.05)), teile=10, glatt=False)
    fass = (giebel + 0.2, 0.33, 0)
    drehkoerper('fass', [(0, 0), (0, 0.085), (0.1, 0.105), (0.2, 0.105), (0.3, 0.085), (0.3, 0.07), (0.28, 0.07), (0.28, 0)],
                s['brett'], ort=fass, teile=14)
    for z in (0.05, 0.25):
        drehkoerper('reifen', [(z - 0.012, 0.09), (z - 0.012, 0.101), (z + 0.012, 0.101), (z + 0.012, 0.09)], s['eisen'],
                    ort=fass, teile=14)


def tafel(ziel):
    szene_leeren()
    bauen()
    blatt = Tafel('haus', zelle=(400, 330), fuss=(170, 215), ziel=ziel)
    blatt.bild(0, 0)
    return blatt.schreiben({'art': 'gebaeude', 'felder': 2})
