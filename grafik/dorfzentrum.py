# Das Dorfzentrum: das groesste Haus im Dorf, vier mal vier Felder.
#
# Steinsockel, zwei Stockwerke Fachwerk - das obere kragt vor -, ein Walmdach
# aus Ziegeln mit einem Dachreiter, an dem die Fahne des Besitzers weht. Vorn
# ein Vorbau mit zweifluegeliger Tuer: hierher bringen die Dorfbewohner alles.
# Der First laeuft laengs X.

import random

from bauteile import (RECHTS, VORN, bannermast, fahne, fass, fenster, geschoss, giebel, kiste, rahmen, sack,
                      satteldach, stoffe, tuer, walmdach, einzeltafel)
from formen import quader

FELDER = 4
MITTE = (-0.1, 0.27)
LAENGE = 3.3
BREITE = 2.5
SOCKEL = 0.3
UNTEN = 0.95
OBEN = 0.72
KRAGEN = 0.09
FIRST = 0.95


def bauen():
    s = stoffe()
    zufall = random.Random(11)
    mx, my = MITTE
    vorn = my - BREITE / 2
    rechts = mx + LAENGE / 2

    quader('sockel', (LAENGE + 0.12, BREITE + 0.12, SOCKEL), s['stein'], ort=(mx, my, SOCKEL / 2), fase=0.03)
    v, r = geschoss(MITTE, LAENGE, BREITE, SOCKEL, UNTEN, s, felder=(7, 5))
    for x in (0.55, 1.05):
        fenster(v, x, 0.58, s)
    fenster(r, -0.45, 0.58, s)
    tuer(r, 0.5, s, breite=0.32, hoehe=0.8)

    z = SOCKEL + UNTEN
    # Das Obergeschoss steht auf Balkenkoepfen, die unter ihm hervorschauen.
    for i in range(9):
        x = mx - LAENGE / 2 + 0.1 + i * (LAENGE - 0.2) / 8
        quader('balkenkopf', (0.08, BREITE + 2 * KRAGEN + 0.06, 0.08), s['balken'], ort=(x, my, z + 0.02))
    v2, r2 = geschoss(MITTE, LAENGE + 2 * KRAGEN, BREITE + 2 * KRAGEN, z + 0.06, OBEN, s, felder=(8, 6),
                      riegel=(0.5,))
    for x in (-1.15, -0.4, 0.4, 1.15):
        fenster(v2, x, 0.42, s, breite=0.18, hoehe=0.2, laden=False)
    for x in (-0.6, 0.6):
        fenster(r2, x, 0.42, s, breite=0.18, hoehe=0.2, laden=False)

    traufe = z + 0.06 + OBEN
    walmdach(MITTE, LAENGE + 2 * KRAGEN, BREITE + 2 * KRAGEN, traufe, FIRST, s['ziegel'], firstlaenge=1.5,
             ueber=0.16, lagen=11, firststoff=s['ziegel'], zufall=zufall)

    # Der Dachreiter mitten auf dem First, darauf die Fahne.
    oben = traufe + FIRST
    quader('dachreiter', (0.34, 0.34, 0.42), s['brett'], ort=(mx, my, oben + 0.1), fase=0.01)
    for seite in (-1, 1):
        quader('schallloch', (0.14, 0.02, 0.16), s['dunkel'], ort=(mx, my + seite * 0.17, oben + 0.18), fase=0)
        quader('schallloch', (0.02, 0.14, 0.16), s['dunkel'], ort=(mx + seite * 0.17, my, oben + 0.18), fase=0)
    walmdach(MITTE, 0.34, 0.34, oben + 0.31, 0.3, s['ziegel'], firstlaenge=0, ueber=0.07, lagen=4)
    fahne((mx, my, oben + 0.56), 0.75, s, lang=0.6, hoch=0.36, mast=0.022)

    # Der Vorbau vor der langen Wand: zwei Pfosten, ein kleines Satteldach.
    tx = mx - 0.55
    tief = 0.62
    tr = rahmen((tx, vorn, SOCKEL), VORN)
    tuer(tr, 0, s, breite=0.56, hoehe=0.84, fluegel=2)
    quader('podest', (1.1, tief + 0.1, SOCKEL * 0.7), s['stein'], ort=(tx, vorn - tief / 2, SOCKEL * 0.35), fase=0.03)
    quader('stufe', (0.8, 0.22, SOCKEL * 0.35), s['stein'], ort=(tx, vorn - tief - 0.12, SOCKEL * 0.175), fase=0.03)
    for seite in (-1, 1):
        quader('vorbaupfosten', (0.09, 0.09, 1.05), s['balken'],
               ort=(tx + seite * 0.46, vorn - tief + 0.05, SOCKEL * 0.7 + 0.525))
        quader('vorbaupfette', (0.08, tief, 0.08), s['balken'], ort=(tx + seite * 0.46, vorn - tief / 2, SOCKEL * 0.7 + 1.05))
    satteldach((tx, vorn - tief / 2 + 0.02), tief + 0.04, 1.06, SOCKEL * 0.7 + 1.09, 0.4, s['ziegel'], achse='y',
               ueber=0.08, ortgang=0.06, lagen=5, firststoff=s['ziegel'], zufall=zufall)
    gr = rahmen((tx, vorn - tief + 0.02, SOCKEL * 0.7 + 1.09), VORN)
    giebel(gr, 1.0, 0.38, s, stoff='brett', fachwerk=False)

    # Was am Dorfzentrum liegt: Faesser, Saecke, eine Kiste - und das Banner.
    fass((rechts + 0.22, my + 0.5, 0), s, r=0.12, h=0.34)
    fass((rechts + 0.24, my + 0.22, 0), s, r=0.11, h=0.32)
    kiste((rechts + 0.24, my - 0.75, 0), s, drehung=0.3)
    sack((mx + 0.6, vorn - 0.2, 0), s)
    sack((mx + 0.82, vorn - 0.17, 0), s, gross=0.9)
    sack((mx + 0.72, vorn - 0.36, 0), s, liegt=True)
    bannermast((mx + 1.35, vorn - 0.5), 1.75, s, breit=0.36, lang=0.6)


def tafel(ziel):
    return einzeltafel('dorfzentrum', FELDER, 4.2, ziel, bauen)
