# Der Boden (darstellung AC-23): fuenf Texturen, die sich ohne Naht
# wiederholen - Gras, Erde, Waldboden, Sand und Wasser.
#
# Eine Kachel ist ein Stueck Boden, von derselben Kamera gesehen wie alles
# andere: acht Felder breit. Damit ihr rechter Rand an ihren linken passt und
# ihr oberer an ihren unteren, wiederholt sich alles nach derselben Strecke -
# das Rauschen der Stoffe laeuft im Kreis (stoffe.gekachelt), und was auf dem
# Boden liegt oder steht, liegt am gegenueberliegenden Rand noch einmal.
#
# Der Browser legt die Kacheln als Muster aus und mischt sie mit Masken aus
# der Karte: Erde, wo gebaut ist, Waldboden unter den Baeumen, Sand am Ufer.
# Die grossen Flecken - trocken, saftig - kommen weiter aus seinem Rauschen
# ueber die ganze Karte; die Kachel bringt, was man aus der Naehe sieht.

import math
import os
import random
import time

import bpy
import numpy as np

from baum import Laub
from formen import netz
from kette import FELD_BREITE, WURZEL2, Tafel, kamera_setzen, szene_leeren
from stoffe import aus_merkmal, farbe, gekachelt, wasser

ZELLE = (1056, 528)
PERIODE = ZELLE[0] / FELD_BREITE * WURZEL2    # so lang ist eine Kachel am Boden
ARTEN = ('gras', 'erde', 'waldboden', 'sand', 'wasser')


class Feld:
    """Streut ueber die Kachel. Was nah am Rand liegt, kommt am Rand
    gegenueber noch einmal - sonst endete sein Schatten an der Naht."""

    def __init__(self, zufall, rand=0.6):
        self.zufall = zufall
        self.rand = rand
        # Drei Wellen mit ganzen Zahlen je Kachel: ein Muster fuer "hier
        # dichter, dort lichter", das sich mit der Kachel wiederholt.
        self.wellen = [[(zufall.choice((-2, -1, 1, 2)), zufall.choice((-2, -1, 1, 2, 3)), zufall.uniform(0, 2 * math.pi))
                        for _ in range(3)] for _ in range(4)]

    def welle(self, u, v, welche=0):
        """0 bis 1, glatt und ohne Naht."""
        summe = sum(math.sin(2 * math.pi * (a * u + b * v) / PERIODE + phase) for a, b, phase in self.wellen[welche])
        return 0.5 + summe / 6

    def streuen(self, anzahl, dichte=None):
        """Liefert je Stueck (Saat, Wert der Dichte, Orte): die Orte sind das
        Stueck selbst und seine Wiederholungen am Rand, in Weltkoordinaten."""
        zufall = self.zufall
        for _ in range(anzahl):
            u, v = zufall.uniform(0, PERIODE), zufall.uniform(0, PERIODE)
            saat = zufall.getrandbits(32)
            wert = 1.0
            if dichte is not None:
                wert = dichte(u, v)
                if zufall.random() > wert:
                    continue
            orte = []
            for du in (-PERIODE, 0, PERIODE):
                for dv in (-PERIODE, 0, PERIODE):
                    a, b = u + du, v + dv
                    if -self.rand <= a <= PERIODE + self.rand and -self.rand <= b <= PERIODE + self.rand:
                        a -= PERIODE / 2
                        b -= PERIODE / 2
                        orte.append(((a - b) / WURZEL2, (a + b) / WURZEL2))
            yield saat, wert, orte


class Haufwerk:
    """Kiesel und Steinchen als ein Netz, jeder in seinem eigenen Ton."""

    def __init__(self, toene):
        self.toene = [farbe(t) for t in toene]
        self.ecken, self.seiten, self.farben = [], [], []

    def stein(self, zufall, ort, halbmesser, flach=0.6):
        teile, ringe = 6, 4
        a = len(self.ecken)
        drehung = zufall.uniform(0, 2 * math.pi)
        lang = zufall.uniform(0.75, 1.3)
        roh = [(0, 0, 1)]
        for i in range(1, ringe):
            w = math.pi * i / ringe
            for j in range(teile):
                d = drehung + 2 * math.pi * (j + 0.5 * (i % 2)) / teile
                roh.append((math.sin(w) * math.cos(d), math.sin(w) * math.sin(d), math.cos(w)))
        roh.append((0, 0, -1))
        hell = zufall.random() * (len(self.toene) - 1)
        i = min(int(hell), len(self.toene) - 2)
        f = hell - i
        ton = tuple(self.toene[i][k] * (1 - f) + self.toene[i + 1][k] * f for k in range(3)) + (1.0,)
        for x, y, z in roh:
            weit = halbmesser * zufall.uniform(0.75, 1.15)
            self.ecken.append((ort[0] + x * weit * lang, ort[1] + y * weit / lang,
                               ort[2] + halbmesser * flach * 0.35 + z * weit * flach))
            self.farben.append(ton)
        letzte = a + len(roh) - 1
        for j in range(teile):
            k = (j + 1) % teile
            self.seiten.append((a, a + 1 + j, a + 1 + k))
            for r in range(ringe - 2):
                o = a + 1 + r * teile
                u = o + teile
                self.seiten.append((o + j, u + j, u + k, o + k))
            o = a + 1 + (ringe - 2) * teile
            self.seiten.append((o + j, letzte, o + k))

    def ablegen(self, stoff):
        if self.ecken:
            netz('kiesel', self.ecken, self.seiten, stoff, farben=self.farben)


def _ebene(stoff):
    """Der Boden selbst. Der Schattenfaenger der Kette weicht ihm."""
    for koerper in list(bpy.context.scene.objects):
        if koerper.get('kulisse') and koerper.type == 'MESH':
            bpy.data.objects.remove(koerper)
    g = PERIODE * 1.5
    netz('boden', [(-g, -g, 0), (g, -g, 0), (g, g, 0), (-g, g, 0)], [(0, 1, 2, 3)], stoff)


def _halme(laub, zufall, x, y, anzahl, hoehe, breite, hell, streu=0.05, schief=0.45):
    """Ein Bueschel: aufrechte, schmale Blaetter, jedes ein wenig geneigt."""
    for _ in range(anzahl):
        w = zufall.uniform(0, 2 * math.pi)
        h = zufall.uniform(*hoehe)
        neigung = zufall.uniform(0, schief)
        wohin = zufall.uniform(0, 2 * math.pi)
        laengs = (math.cos(wohin) * neigung, math.sin(wohin) * neigung, 1.0)
        fuss = (x + zufall.uniform(-streu, streu), y + zufall.uniform(-streu, streu))
        mitte = (fuss[0] + laengs[0] * h * 0.5, fuss[1] + laengs[1] * h * 0.5, h * 0.5)
        laub.blatt(mitte, (math.cos(w), math.sin(w), 0.25), h * 0.5, zufall.uniform(*breite),
                   hell + zufall.uniform(-0.22, 0.22), laengs=laengs)


def gras(zufall):
    feld = Feld(zufall)
    _ebene(gekachelt('grasgrund', ('#414a1f', '#4c5824', '#566226', '#63682d'), PERIODE, groesse=1.7, fein=8,
                     koernung=0.25, relief=0.6))
    laub = Laub(('#34481c', '#455c20', '#587026', '#6f8030', '#8f8c44'), zufall)
    flaeche = PERIODE * PERIODE
    # Der Rasen: kurze Bueschel, dicht an dicht, mit wenig Unterschied von
    # Stelle zu Stelle. Grosse Flecken in der Kachel sah man als Rautenmuster
    # wiederkehren (Probe, R3) - trocken und saftig im Grossen legt der Browser
    # aus seinem Rauschen ueber die ganze Karte darueber.
    for saat, wert, orte in feld.streuen(int(flaeche * 150), dichte=lambda u, v: 0.75 + 0.25 * feld.welle(u, v, 0)):
        for x, y in orte:
            eigen = random.Random(saat)
            _halme(laub, eigen, x, y, eigen.randint(3, 6), (0.05, 0.13), (0.006, 0.011), 0.3 + 0.6 * (1 - wert))
    # Hoehere Horste, dunkler - sie geben der Flaeche ihr Korn.
    for saat, wert, orte in feld.streuen(int(flaeche * 9), dichte=lambda u, v: 0.6 + 0.4 * feld.welle(u, v, 1)):
        for x, y in orte:
            eigen = random.Random(saat)
            _halme(laub, eigen, x, y, eigen.randint(7, 12), (0.12, 0.24), (0.008, 0.013), 0.25, streu=0.07, schief=0.6)
    # Trockene, helle Halme dazwischen.
    for saat, wert, orte in feld.streuen(int(flaeche * 14), dichte=lambda u, v: 0.8 - 0.3 * feld.welle(u, v, 0)):
        for x, y in orte:
            eigen = random.Random(saat)
            _halme(laub, eigen, x, y, eigen.randint(2, 4), (0.08, 0.18), (0.004, 0.008), 0.9, streu=0.04, schief=0.7)
    laub.ablegen(aus_merkmal('halme', rau=0.6))


def erde(zufall):
    feld = Feld(zufall)
    _ebene(gekachelt('erdgrund', ('#614728', '#6b5030', '#765935', '#80623b'), PERIODE, groesse=2.2, fein=11,
                     koernung=0.2, relief=0.9))
    flaeche = PERIODE * PERIODE
    kiesel = Haufwerk(('#5c5246', '#7a6f5f', '#8f8676', '#a39a88'))
    for saat, wert, orte in feld.streuen(int(flaeche * 16), dichte=lambda u, v: 0.3 + 0.7 * feld.welle(u, v, 0)):
        for x, y in orte:
            eigen = random.Random(saat)
            kiesel.stein(eigen, (x, y, 0), eigen.uniform(0.008, 0.028) * (1 + 1.2 * eigen.random() ** 6))
    kiesel.ablegen(aus_merkmal('kiesel', rau=0.9))
    # Ein paar duerre Bueschel - festgetretene Erde ist nicht kahl.
    laub = Laub(('#4a4a26', '#62602f', '#7c7440', '#96894f'), zufall)
    for saat, wert, orte in feld.streuen(int(flaeche * 12), dichte=lambda u, v: feld.welle(u, v, 1) ** 2):
        for x, y in orte:
            eigen = random.Random(saat)
            _halme(laub, eigen, x, y, eigen.randint(3, 6), (0.04, 0.11), (0.005, 0.009), 0.5, streu=0.04, schief=0.7)
    laub.ablegen(aus_merkmal('halme', rau=0.7))


def waldboden(zufall):
    feld = Feld(zufall)
    _ebene(gekachelt('waldgrund', ('#1f1a0f', '#272011', '#232a13', '#2e2615'), PERIODE, groesse=2.0, fein=9,
                     koernung=0.25, relief=0.8))
    flaeche = PERIODE * PERIODE
    # Laubstreu: flach liegende Blaetter in Braun und Ocker, hier und da Moos.
    streu = Laub(('#231b10', '#2f2414', '#3d2e19', '#4c3a1f', '#5d4a27'), zufall)
    for saat, wert, orte in feld.streuen(int(flaeche * 520), dichte=lambda u, v: 0.7 + 0.3 * feld.welle(u, v, 0)):
        for x, y in orte:
            eigen = random.Random(saat)
            lang = eigen.uniform(0.022, 0.042)
            kipp = (eigen.uniform(-0.5, 0.5), eigen.uniform(-0.5, 0.5), 1.0)
            streu.blatt((x, y, eigen.uniform(0.004, 0.02)), kipp, lang, lang * eigen.uniform(0.45, 0.7), eigen.random() ** 2)
    # Reisig: lange, duenne Staebchen.
    for saat, wert, orte in feld.streuen(int(flaeche * 7)):
        for x, y in orte:
            eigen = random.Random(saat)
            w = eigen.uniform(0, math.pi)
            streu.blatt((x, y, 0.02), (eigen.uniform(-0.2, 0.2), eigen.uniform(-0.2, 0.2), 1.0), eigen.uniform(0.05, 0.14),
                        eigen.uniform(0.004, 0.007), 0.1 + eigen.random() * 0.3, laengs=(math.cos(w), math.sin(w), 0))
    streu.ablegen(aus_merkmal('streu', rau=0.85))
    moos = Laub(('#1a2610', '#243214', '#2f3f19', '#3c4c1f'), zufall)
    for saat, wert, orte in feld.streuen(int(flaeche * 40), dichte=lambda u, v: max(0.0, feld.welle(u, v, 1) - 0.45) * 2.2):
        for x, y in orte:
            eigen = random.Random(saat)
            _halme(moos, eigen, x, y, eigen.randint(4, 8), (0.03, 0.09), (0.006, 0.012), 0.5, streu=0.06, schief=0.8)
    moos.ablegen(aus_merkmal('moos', rau=0.7))


def sand(zufall):
    feld = Feld(zufall)
    _ebene(gekachelt('sandgrund', ('#8a7a57', '#93835d', '#9b8a63', '#a39269'), PERIODE, groesse=2.4, fein=14,
                     koernung=0.13, relief=0.7))
    flaeche = PERIODE * PERIODE
    kiesel = Haufwerk(('#6f685c', '#8c8474', '#a39b8a', '#bdb5a2', '#7c6a52'))
    for saat, wert, orte in feld.streuen(int(flaeche * 22), dichte=lambda u, v: 0.2 + 0.8 * feld.welle(u, v, 0) ** 2):
        for x, y in orte:
            eigen = random.Random(saat)
            kiesel.stein(eigen, (x, y, 0), eigen.uniform(0.007, 0.022) * (1 + 1.5 * eigen.random() ** 8), flach=0.5)
    kiesel.ablegen(aus_merkmal('kiesel', rau=0.85))


def see(zufall):
    _ebene(wasser('wasser', PERIODE, saat=zufall.randint(0, 9)))


BAUEN = {'gras': gras, 'erde': erde, 'waldboden': waldboden, 'sand': sand, 'wasser': see}


def _naht(bild):
    """Wie stark sich der Rand vom gegenueberliegenden unterscheidet, gemessen
    am Unterschied zweier Nachbarn mitten im Bild. Um 1 heisst: keine Naht."""
    farben = bild[:, :, :3]
    quer = np.abs(farben[:, 0] - farben[:, -1]).mean() / np.abs(farben[:, 1:] - farben[:, :-1]).mean()
    hoch = np.abs(farben[0] - farben[-1]).mean() / np.abs(farben[1:] - farben[:-1]).mean()
    return round(float(max(quer, hoch)), 2)


# Die Kacheln liegen in der Tafel untereinander: oben und unten ein Saum von
# einem Block der Bildkodierung (16 Bildpunkte), sonst glaettet WebP die
# Nachbarkachel hinein (gemessen 2026-11-10, Rand gegen Rand im Verhaeltnis zu
# zwei Nachbarn: ohne Saum bis 1,95, mit 0,94 bis 1,10). Links und rechts
# bringt ein Saum nichts - probiert: quer 1,10 bis 1,35 mit wie ohne. Der Rest
# steckt im Render: zwei Nachbarn teilen sich Proben des Bildfilters, das Paar
# ueber den Rand nicht. Er bleibt unter dem Unterschied zweier Bildpunkte im
# Abstand 2 und ist am Bild nicht zu sehen.
SAUM = (0, 16)


def tafel(ziel):
    nur = os.environ.get('BODEN_NUR')
    arten = [a for a in ARTEN if not nur or a in nur.split(',')]
    fuss = (ZELLE[0] // 2, ZELLE[1] // 2)
    blatt = None
    mittel, naht = {}, {}
    for zeile, art in enumerate(arten):
        szene_leeren()
        BAUEN[art](random.Random(4001 + ARTEN.index(art) * 37))
        if blatt is None:
            blatt = Tafel('boden', zelle=ZELLE, fuss=fuss, ziel=ziel, randlos=True, saum=SAUM)
        else:
            kamera_setzen(ZELLE[0], ZELLE[1], fuss)
        beginn = time.time()
        blatt.bild(zeile, 0, maske=False)
        bild = blatt.bilder[(zeile, 0)][0]
        mittel[art] = [int(round(float(c) * 255)) for c in bild[:, :, :3].mean(axis=(0, 1))]
        naht[art] = _naht(bild)
        print(f'TON {art}: {mittel[art]}, Naht {naht[art]}, {time.time() - beginn:.0f} s')
    return blatt.schreiben({'art': 'boden', 'arten': arten, 'mittel': mittel, 'naht': naht})
