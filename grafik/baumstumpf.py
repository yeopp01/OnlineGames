# Der gefaellte Baum (darstellung AC-31): ein Stumpf mit heller Schnittflaeche,
# daneben der Stamm - und je weniger Holz noch da ist, desto mehr davon ist
# zersaegt, gespalten und fortgetragen.
#
# Ein Baum, an dem noch niemand war, kommt aus `baum.py`. Mit dem ersten Stueck
# Holz liegt er: der Stamm mit zwei Aststummeln und einem Rest der Krone
# (Stufe 4). Dann ist die Krone fort und das duenne Ende abgesaegt (3), dann
# liegt nur noch ein kurzes Stueck neben Rollen und Scheiten (2), am Ende
# bleiben der Stumpf, eine Rolle und ein paar Scheite (1).
#
# Die Tafel: eine Zeile je Baumart, in der Reihenfolge von `baum.ARTEN` - der
# Browser nimmt dieselbe Zeile wie fuer den stehenden Baum, eine gefaellte
# Birke bleibt also eine Birke. Die Spalten sind die vier Stufen, voll zuerst,
# je Stufe die Gestalten nebeneinander.
#
# Alle Zufallswerte werden fuer den eben gefaellten Baum gezogen und dann nach
# der Stufe gekuerzt (wie beim Steinhaufen in `fels.py`): Stufe 2 ist derselbe
# Baum wie Stufe 4, nur weiter verarbeitet.

import math
import os
import random

from baum import ARTEN, Laub
from formen import drehkoerper, prisma, quader, strang
from kette import Tafel, kamera_setzen, szene_leeren
from stoffe import aus_merkmal, einfarbig, gemustert

GESTALTEN = 3
STUFEN = 4

# Je Art: Halbmesser des Stamms am Boden (in Feldern - kraeftiger als am
# stehenden Baum, sonst waere eine liegende Birke bei Zoom 1 ein Strich),
# Hoehe des Stumpfs, Rinde, Schnittholz, Laub. Die Rinden sind die aus
# `baum.py`.
WERTE = {
    'eiche': {
        'dick': 0.125, 'hoch': 0.17,
        'rinde': dict(farben=('#33281e', '#514032', '#695643'), massstab=(9, 9, 1.1), groesse=3, detail=6, relief=1.0,
                      fugen=0.5),
        'schnitt': ('#9a7242', '#c0965e', '#d8b682'),
        'laub': ('#1c2e16', '#2a4120', '#3b5527', '#516a30'), 'kern': '#1e3018',
        'ballen': dict(dichte=3600),
    },
    'birke': {
        'dick': 0.09, 'hoch': 0.15,
        # Etwas dunkler als am stehenden Baum und mit mehr Strichen: liegend
        # trifft die Sonne die Rinde voll, und sie waere eine weisse Flaeche.
        'rinde': dict(farben=('#b4b1a5', '#d3d0c4', '#39332b'), massstab=(2.2, 2.2, 13), groesse=3.2, detail=4,
                      relief=0.5, fugen=0.25, kontrast=(0.36, 0.62)),
        'schnitt': ('#c9aa7c', '#dfc79c', '#eedcb6'),
        'laub': ('#2f4a1c', '#4a6a26', '#6b8a32', '#8fa544'), 'kern': '#2c4018',
        'ballen': dict(dichte=2300, lang=(0.02, 0.032), schmal=(0.6, 0.85)),
    },
    'fichte': {
        'dick': 0.1, 'hoch': 0.15,
        'rinde': dict(farben=('#2a2019', '#43342a', '#5a493b'), massstab=(8, 8, 1.4), groesse=3.5, detail=6, relief=0.9,
                      fugen=0.5),
        'schnitt': ('#bb955e', '#d6b47c', '#e6cd9a'),
        'laub': ('#101f16', '#1a3122', '#27452e', '#3b5e3c'), 'kern': '#16261a',
        'ballen': dict(dichte=4200, lang=(0.035, 0.055), schmal=(0.22, 0.34)),
    },
    'kiefer': {
        'dick': 0.105, 'hoch': 0.16,
        'rinde': dict(farben=('#46352b', '#6b4d38', '#8a6347'), massstab=(7, 7, 1.2), groesse=3.2, detail=6, relief=1.0,
                      fugen=0.45),
        'schnitt': ('#b07c48', '#cf9c62', '#e1b880'),
        'laub': ('#16271a', '#243a24', '#35502f', '#4e6a3c'), 'kern': '#16261a',
        'ballen': dict(dichte=4200, lang=(0.035, 0.055), schmal=(0.22, 0.34)),
    },
}


def _walze(name, anfang, winkel, laenge, r1, r2, rinde, schnitt, hoehe=0.0, teile=14):
    """Ein liegendes Rundholz: beginnt bei `anfang` (x, y), zeigt nach `winkel`
    und liegt auf dem Boden - das duenne Ende senkt sich, bis es aufliegt.
    Beide Enden tragen eine helle Schnittflaeche."""
    neigung = math.atan2(r1 - r2, laenge)
    drehung = (0, math.pi / 2 + neigung, winkel)
    ort = (anfang[0], anfang[1], r1 + hoehe)
    mitte = (r1 + r2) / 2
    drehkoerper(name, [(0, r1), (laenge * 0.5, mitte * 1.02), (laenge, r2)], rinde, ort=ort, drehung=drehung,
                teile=teile)
    drehkoerper(f'{name}-vorn', [(-0.002, 0), (-0.002, r1 * 0.97), (0.004, r1 * 0.995)], schnitt, ort=ort,
                drehung=drehung, teile=teile, glatt=False)
    drehkoerper(f'{name}-hinten', [(laenge - 0.004, r2 * 0.995), (laenge + 0.002, r2 * 0.97), (laenge + 0.002, 0)],
                schnitt, ort=ort, drehung=drehung, teile=teile, glatt=False)


def _scheit(name, ort, winkel, laenge, staerke, schnitt, hoehe=0.0):
    """Ein gespaltenes Stueck: ein Keil, der auf seiner breiten Seite liegt."""
    umriss = [(-staerke, 0), (staerke, 0), (staerke * 0.15, staerke * 1.25), (-staerke * 0.3, staerke * 1.1)]
    prisma(name, umriss, laenge, schnitt, ort=(ort[0], ort[1], hoehe), drehung=(0, 0, winkel), fase=0.004)


def bauen(art, startwert, stufe):
    """Der gefaellte Baum einer Art in der Fuellstufe 4 (eben gefaellt) bis 1."""
    zufall = random.Random(startwert)
    w = WERTE[art]
    rinde = gemustert('rinde', w['rinde']['farben'], **{k: v for k, v in w['rinde'].items() if k != 'farben'})
    schnitt = gemustert('schnittholz', w['schnitt'], massstab=(7, 7, 7), groesse=5, detail=5, relief=0.25, fugen=0.2,
                        rau=0.8)
    dick, hoch = w['dick'], w['hoch']

    # --- der Plan, immer ganz gezogen ------------------------------------
    winkel = zufall.uniform(0, 2 * math.pi)
    vor = (math.cos(winkel), math.sin(winkel))
    quer = (-vor[1], vor[0])

    def an(laengs, seitlich=0.0):
        return (vor[0] * laengs + quer[0] * seitlich, vor[1] * laengs + quer[1] * seitlich)

    stumpf = an(-0.2)
    laenge = zufall.uniform(0.6, 0.68)
    seite = zufall.choice((-1, 1)) * zufall.uniform(0.02, 0.05)
    schief = zufall.uniform(-0.12, 0.12)
    anfang = an(-0.04, seite)
    stummel = [(zufall.uniform(0.3, 0.5), zufall.uniform(0.5, 1.2) * zufall.choice((-1, 1))),
               (zufall.uniform(0.6, 0.85), zufall.uniform(0.5, 1.2) * zufall.choice((-1, 1)))]
    krone = [(zufall.uniform(0.84, 1.04), zufall.uniform(-0.12, 0.12), zufall.uniform(0.13, 0.18)) for _ in range(4)]
    rollen = [(zufall.uniform(0.34, 0.52), zufall.uniform(0.1, 0.17) * zufall.choice((-1, 1)),
               zufall.uniform(0, math.pi), zufall.uniform(0.12, 0.16)) for _ in range(2)]
    scheite = [(zufall.uniform(0.08, 0.3), zufall.uniform(0.1, 0.2) * zufall.choice((-1, 1)),
                zufall.uniform(0, math.pi), zufall.uniform(0.15, 0.2)) for _ in range(4)]
    spaene = [(zufall.uniform(0, 2 * math.pi), zufall.uniform(0.02, 0.26), zufall.uniform(0, math.pi),
               zufall.uniform(0.7, 1.3)) for _ in range(22)]
    splitter = [(zufall.uniform(-0.6, 0.6), zufall.uniform(0.03, 0.06)) for _ in range(3)]

    # --- der Stumpf: bleibt bis zum Schluss --------------------------------
    drehkoerper('stumpf', [(0, dick * 1.6), (0.025, dick * 1.3), (0.07, dick * 1.08), (hoch, dick)], rinde,
                ort=(stumpf[0], stumpf[1], 0), teile=16)
    drehkoerper('schnittflaeche', [(hoch - 0.004, dick * 0.995), (hoch + 0.004, dick * 0.95), (hoch + 0.004, 0)],
                schnitt, ort=(stumpf[0], stumpf[1], 0), teile=16, glatt=False)
    # Die Bruchleiste: wo der Stamm abriss, stehen Splitter - auf der Seite,
    # von der er wegfiel.
    for i, (versatz, lang) in enumerate(splitter):
        ecke = winkel + math.pi + versatz
        quader(f'splitter{i}', (0.014, 0.028, lang), schnitt,
               ort=(stumpf[0] + math.cos(ecke) * dick * 0.72, stumpf[1] + math.sin(ecke) * dick * 0.72,
                    hoch + lang / 2),
               drehung=(0.08, 0.06, ecke), fase=0.003)
    # Zwei Wurzelanlaeufe.
    for i in range(3):
        ecke = winkel + 0.9 + i * 2.1
        strang(f'wurzel{i}', [(stumpf[0] + math.cos(ecke) * dick * 0.8, stumpf[1] + math.sin(ecke) * dick * 0.8,
                               0.06, dick * 0.36),
                              (stumpf[0] + math.cos(ecke) * dick * 1.7, stumpf[1] + math.sin(ecke) * dick * 1.7,
                               0.008, dick * 0.2),
                              (stumpf[0] + math.cos(ecke) * dick * 2.3, stumpf[1] + math.sin(ecke) * dick * 2.3,
                               -0.02, dick * 0.1)], rinde, rund=2)

    # --- der Stamm: je Stufe kuerzer, am Ende fort --------------------------
    anteil = {4: 1.0, 3: 0.68, 2: 0.4, 1: 0.0}[stufe]
    duenn = dick * 0.62
    if anteil > 0:
        ende = dick * 0.9 + (duenn - dick * 0.9) * anteil
        _walze('stamm', anfang, winkel + schief, laenge * anteil, dick * 0.9, ende, rinde, schnitt)
    richtung = (math.cos(winkel + schief), math.sin(winkel + schief))
    seitwaerts = (-richtung[1], richtung[0])

    def am_stamm(t, hoehe=None):
        r = dick * 0.9 + (duenn - dick * 0.9) * t
        return (anfang[0] + richtung[0] * laenge * t, anfang[1] + richtung[1] * laenge * t, r if hoehe is None else hoehe), r

    if stufe == 4:
        # Aststummel und ein Rest der Krone am duennen Ende.
        for i, (t, schwung) in enumerate(stummel):
            fuss, r = am_stamm(t)
            spitze = (fuss[0] + seitwaerts[0] * schwung * 0.11 + richtung[0] * 0.05,
                      fuss[1] + seitwaerts[1] * schwung * 0.11 + richtung[1] * 0.05, fuss[2] + r + 0.07)
            strang(f'stummel{i}', [(*fuss, r * 0.42), (*spitze, r * 0.2)], rinde, rund=2)
        laub = Laub(w['laub'], zufall)
        kern = einfarbig('laubkern', w['kern'], rau=1.0)
        for t, quer_ab, halbmesser in krone:
            fuss, _ = am_stamm(t)
            mitte = (fuss[0] + seitwaerts[0] * quer_ab, fuss[1] + seitwaerts[1] * quer_ab, halbmesser * 0.62)
            strang('zweig', [(*am_stamm(0.8)[0], 0.016), (*mitte, 0.006)], rinde, rund=1)
            laub.ballen(mitte, halbmesser, kern, strecke=(1.05, 1.05, 0.62), **w['ballen'])
        laub.ablegen(aus_merkmal('laub', rau=0.55))

    # --- was aus dem Stamm geworden ist -------------------------------------
    # Rollen: abgesaegte Stuecke, noch rund. Scheite: gespalten.
    for i, (t, ab, dreh, lang) in enumerate(rollen[:{4: 0, 3: 1, 2: 2, 1: 1}[stufe]]):
        ort = an(-0.04 + laenge * (t if stufe > 1 else t * 0.45), ab)
        r = dick * 0.78
        _walze(f'rolle{i}', ort, dreh, lang, r, r * 0.96, rinde, schnitt)
    for i, (t, ab, dreh, lang) in enumerate(scheite[:{4: 0, 3: 0, 2: 2, 1: 4}[stufe]]):
        ort = an(0.12 + laenge * t, ab * 0.8)
        # Das vierte liegt quer auf den ersten beiden.
        if i == 3:
            erster = an(0.12 + laenge * scheite[0][0], scheite[0][1] * 0.8)
            _scheit(f'scheit{i}', (erster[0] + 0.02, erster[1] + 0.02), scheite[0][2] + 1.3, lang, dick * 0.42, schnitt,
                    hoehe=dick * 0.5)
        else:
            _scheit(f'scheit{i}', ort, dreh, lang, dick * 0.46, schnitt)
    # Spaene um den Stumpf: je weiter die Arbeit, desto mehr.
    for i, (ecke, weit, dreh, mass) in enumerate(spaene[:6 + (4 - stufe) * 5]):
        quader(f'span{i}', (0.034 * mass, 0.014 * mass, 0.005), schnitt,
               ort=(stumpf[0] + math.cos(ecke) * (dick * 1.2 + weit), stumpf[1] + math.sin(ecke) * (dick * 1.2 + weit),
                    0.004),
               drehung=(0, zufall.uniform(-0.15, 0.15), dreh), fase=0)


def tafel(ziel):
    zelle, fuss = (250, 164), (125, 100)
    gestalten = 1 if os.environ.get('BILDER_PROBE') else GESTALTEN
    blatt = None
    for zeile, art in enumerate(ARTEN):
        for stufe in range(STUFEN, 0, -1):
            for gestalt in range(gestalten):
                szene_leeren()
                bauen(art, 307 + gestalt * 41 + zeile * 1000, stufe)
                if blatt is None:
                    blatt = Tafel('baumstumpf', zelle=zelle, fuss=fuss, ziel=ziel, knapp=True)
                else:
                    kamera_setzen(zelle[0], zelle[1], fuss)
                blatt.bild(zeile, (STUFEN - stufe) * gestalten + gestalt, maske=False)
    # Spalte 0 ist der eben gefaellte Baum, die letzte der fast verbrauchte.
    return blatt.schreiben({'art': 'ding', 'arten': list(ARTEN), 'gestalten': gestalten, 'stufen': STUFEN})
