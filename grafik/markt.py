# Der Markt: ein gepflasterter Platz, vier mal vier Felder.
#
# Hinten die Markthalle - Fachwerk, vorn offen, unter Ziegeln -, davor drei
# Staende mit gestreiften Planen und Waren, dazwischen Faesser, Saecke und
# Kisten. Viel Platz, wenig Haus: so sieht kein anderes Gebaeude aus. Die
# Streifen der Planen und die Fahne am Mast tragen die Farbe des Besitzers.

import random

from bauteile import (RECHTS, balken, bodenfleck, einzeltafel, fachwerk, fahne, fass, fenster, giebel, kiste, rahmen,
                      sack, satteldach, stoffe, wimpel)
from formen import kugel, netz, quader
from stoffe import einfarbig

FELDER = 4
HALLE = (-0.12, 1.08)
LAENGE = 3.1
BREITE = 1.35
BODEN = 0.1
WAND = 1.0
FIRST = 0.8


def _stand(s, waren, ort, zufall, breit=0.9, tief=0.62, winkel=0.0, plane='tuch'):
    """Ein Marktstand: vier Pfosten, ein Tisch, darueber die gestreifte Plane,
    die nach vorn abfaellt. Vorn ist -Y des Rahmens. `plane` ist der Stoff der
    farbigen Streifen."""
    r = rahmen((ort[0], ort[1], 0), winkel)
    for sx in (-1, 1):
        quader('standpfosten', (0.045, 0.045, 0.82), s['hellholz'], ort=(sx * breit / 2, -tief / 2, 0.41), eltern=r)
        quader('standpfosten', (0.045, 0.045, 1.08), s['hellholz'], ort=(sx * breit / 2, tief / 2, 0.54), eltern=r)
        quader('tischbein', (0.04, tief * 0.7, 0.4), s['hellholz'], ort=(sx * (breit / 2 - 0.06), -0.02, 0.2), eltern=r)
    quader('tisch', (breit + 0.08, tief * 0.8, 0.04), s['bohle'], ort=(0, -0.03, 0.42), eltern=r, fase=0.008)
    streifen = 7
    weit = breit + 0.2
    for i in range(streifen):
        x0 = -weit / 2 + i * weit / streifen
        x1 = x0 + weit / streifen
        stoff = s[plane] if i % 2 == 0 else s['kalk']
        vorn, hinten = -tief / 2 - 0.2, tief / 2 + 0.06
        netz('plane', [(x0, vorn, 0.76), (x1, vorn, 0.76), (x1, hinten, 1.1), (x0, hinten, 1.1)], [(0, 1, 2, 3)], stoff,
             dicke=0.012, eltern=r)
        netz('volant', [(x0, vorn, 0.76), (x1, vorn, 0.76), (x1, vorn - 0.012, 0.66), (x0, vorn - 0.012, 0.66)],
             [(3, 2, 1, 0)], stoff, dicke=0.01, eltern=r)
    # Die Waren: je Sorte ein flacher Korb voll.
    for i, farbe in enumerate(waren):
        bx = -breit / 2 + 0.17 + i * (breit - 0.34) / max(1, len(waren) - 1)
        quader('korb', (0.22, 0.24, 0.07), s['hellholz'], ort=(bx, -0.04, 0.475), eltern=r, fase=0.012)
        for k in range(9):
            kugel('ware', 0.036, farbe,
                  ort=(bx + zufall.uniform(-0.07, 0.07), -0.04 + zufall.uniform(-0.08, 0.08), 0.52 + zufall.uniform(0, 0.03)),
                  eltern=r, teile=8, ringe=6)


def bauen():
    s = stoffe()
    zufall = random.Random(71)
    rot = einfarbig('aepfel', '#9c3324', rau=0.5)
    gruen = einfarbig('kohl', '#6f8a3c', rau=0.7)
    gelb = einfarbig('kaese', '#c9a549', rau=0.6)
    braun = einfarbig('brot', '#9a6a36', rau=0.8)
    hx, hy = HALLE
    vorn = hy - BREITE / 2
    rechts = hx + LAENGE / 2
    bodenfleck('pflaster', (0.0, 0.0), 3.88, 3.88, s['pflaster'], zufall, hoch=0.03, rund=0.12, zacken=0.012)

    # Die Markthalle: hinten und an den Seiten Fachwerk, vorn offen auf Pfosten.
    quader('hallenboden', (LAENGE + 0.12, BREITE + 0.12, BODEN), s['stein'], ort=(hx, hy, BODEN / 2), fase=0.025)
    quader('rueckwand', (LAENGE, 0.08, WAND), s['putz'], ort=(hx, hy + BREITE / 2 - 0.04, BODEN + WAND / 2), fase=0)
    for seite in (-1, 1):
        quader('seitenwand', (0.08, BREITE, WAND), s['putz'], ort=(hx + seite * (LAENGE / 2 - 0.04), hy, BODEN + WAND / 2),
               fase=0)
    r = rahmen((rechts, hy, BODEN), RECHTS)
    fachwerk(r, BREITE, WAND, s, felder=3, streben=((-BREITE / 3, 0.45), (BREITE / 3, -0.45)))
    fenster(r, 0, 0.75, s, breite=0.2, hoehe=0.2, laden=False)
    pfosten = 6
    for i in range(pfosten):
        x = hx - LAENGE / 2 + 0.06 + i * (LAENGE - 0.12) / (pfosten - 1)
        y = vorn + 0.06
        quader('hallenpfosten', (0.12, 0.12, WAND), s['balken'], ort=(x, y, BODEN + WAND / 2))
        for seite in (-1, 1):
            if (i == 0 and seite < 0) or (i == pfosten - 1 and seite > 0):
                continue
            balken('kopfband', (x, y, BODEN + WAND - 0.36), (x + seite * 0.26, y, BODEN + WAND - 0.06), 0.06,
                   s['balken'])
    quader('raehm', (LAENGE + 0.08, 0.11, 0.11), s['balken'], ort=(hx, vorn + 0.06, BODEN + WAND - 0.03))
    satteldach(HALLE, LAENGE, BREITE, BODEN + WAND, FIRST, s['ziegel'], ueber=0.18, ortgang=0.12, lagen=9,
               firststoff=s['ziegel'], zufall=zufall)
    giebel(rahmen((rechts, hy, BODEN + WAND), RECHTS), BREITE - 0.04, FIRST - 0.03, s)
    # Was in der Halle lagert.
    for i in range(4):
        fass((hx - 1.2 + i * 0.27, hy + 0.3, BODEN), s, r=0.11, h=0.32)
    kiste((hx - 0.1, hy + 0.25, BODEN), s, mass=(0.4, 0.3, 0.24))
    kiste((hx - 0.06, hy + 0.22, BODEN + 0.24), s, mass=(0.3, 0.24, 0.18), drehung=0.2)
    kiste((hx + 0.45, hy + 0.2, BODEN), s, mass=(0.34, 0.3, 0.2), drehung=-0.1)
    for i in range(5):
        sack((hx + 0.85 + (i % 3) * 0.2, hy + 0.3 - (i // 3) * 0.2, BODEN), s, gross=1.05)

    # Die drei Staende auf dem Platz. Nur der mittlere traegt die Farbe des
    # Besitzers, die aeusseren ungefaerbtes Leinen: mit drei farbigen Planen
    # trug der Markt die Spielerfarbe auf 18 % seiner Flaeche - eine Flaeche,
    # kein Akzent (darstellung AC-4: unter einem Zehntel).
    _stand(s, (rot, gruen, gelb), (-1.15, -0.25), zufall, plane='leinen')
    _stand(s, (braun, rot, gruen), (0.1, -0.75), zufall, winkel=0.12)
    _stand(s, (gelb, braun), (1.2, -0.1), zufall, breit=0.8, winkel=-0.1, plane='leinen')
    wimpel((-1.15 - 0.45, -0.25 + 0.31, 1.08), 0.3, s)
    wimpel((1.2 + 0.4, -0.1 + 0.27, 1.08), 0.3, s)

    # Dazwischen: Faesser, Saecke, Kisten, eine Waage auf ihrem Bock.
    fass((-0.45, -1.45, 0.03), s, r=0.12, h=0.34)
    fass((-0.72, -1.38, 0.03), s, r=0.11, h=0.3)
    sack((0.95, -1.2, 0.03), s)
    sack((1.15, -1.28, 0.03), s, gross=0.9)
    sack((1.05, -1.42, 0.03), s, liegt=True)
    kiste((-1.6, -1.2, 0.03), s, mass=(0.34, 0.26, 0.2), drehung=0.4)
    kiste((1.62, -0.95, 0.03), s, drehung=-0.2)
    wx, wy = 0.25, -1.5
    quader('waagenfuss', (0.2, 0.2, 0.04), s['balken'], ort=(wx, wy, 0.05))
    quader('waagenpfosten', (0.04, 0.04, 0.62), s['balken'], ort=(wx, wy, 0.34))
    balken('waagebalken', (wx - 0.2, wy - 0.2, 0.6), (wx + 0.2, wy + 0.2, 0.66), 0.025, s['eisen'])
    for seite, hoch in ((-1, 0.6), (1, 0.66)):
        px, py = wx + seite * 0.2, wy + seite * 0.2
        balken('waagschnur', (px, py, hoch), (px, py, hoch - 0.22), 0.008, s['seil'])
        quader('waagschale', (0.15, 0.15, 0.02), s['eisen'], ort=(px, py, hoch - 0.23), drehung=(0, 0, 0.785), fase=0.005)

    # Der Marktmast mit der Fahne des Besitzers, auf einem steinernen Fuss.
    mx, my = -1.55, -0.95
    quader('mastfuss', (0.34, 0.34, 0.12), s['haustein'], ort=(mx, my, 0.09), fase=0.02)
    quader('mastfuss', (0.22, 0.22, 0.12), s['haustein'], ort=(mx, my, 0.2), fase=0.02)
    fahne((mx, my, 0.24), 2.0, s, lang=0.6, hoch=0.38, mast=0.026)


def tafel(ziel):
    return einzeltafel('markt', FELDER, 2.5, ziel, bauen)
