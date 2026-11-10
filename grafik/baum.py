# Baeume in vier Arten: Eiche, Birke, Fichte, Kiefer (darstellung AC-23).
#
# Stamm und Aeste sind Rohre, das Laub besteht aus einzelnen Blaettern: einige
# zehntausend kleine Flaechen je Baum, jede mit eigener Richtung und eigenem
# Gruen - Licht und Schatten darin rechnet die Sonne. Eine Art ist eine Zeile
# der Tafel, ihre Gestalten (aus verschiedenen Startwerten) stehen
# nebeneinander.
#
# Woran man die Arten im Spiel auseinanderhaelt: die Eiche ist breit und
# dunkel, die Birke schmal, hell und hat einen weissen Stamm, die Fichte ist
# ein dunkler Kegel bis zum Boden, die Kiefer ein kahler roter Stamm mit
# einem flachen Schirm obenauf.

import math
import os
import random

import bpy

from formen import kugel, netz, strang
from kette import Tafel, szene_leeren
from stoffe import aus_merkmal, einfarbig, farbe, gemustert

MASS = 0.8     # der ganze Baum, nach dem Bauen - im Wald steht einer je Feld
ARTEN = ('eiche', 'birke', 'fichte', 'kiefer')
GESTALTEN = 4


def _einheit(zufall):
    while True:
        v = (zufall.uniform(-1, 1), zufall.uniform(-1, 1), zufall.uniform(-1, 1))
        l = math.sqrt(sum(c * c for c in v))
        if 0.1 < l <= 1:
            return tuple(c / l for c in v)


def _kreuz(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def _norm(v):
    l = math.sqrt(sum(c * c for c in v)) or 1
    return tuple(c / l for c in v)


class Laub:
    """Sammelt Blaetter und legt sie am Ende als ein Netz ab."""

    def __init__(self, toene, zufall):
        self.toene = [farbe(g) for g in toene]
        self.zufall = zufall
        self.ecken, self.seiten, self.farben = [], [], []

    def blatt(self, ort, senkrecht, lang, breit, hell, laengs=None):
        """Eine Raute: `senkrecht` ist ihre Flaechenrichtung, `laengs` (wenn
        gegeben) die Richtung ihrer langen Achse - so liegen Nadeln am Zweig."""
        n = _norm(senkrecht)
        if laengs is None:
            t = _norm(_kreuz(n, _einheit(self.zufall)))
        else:
            schraeg = sum(laengs[k] * n[k] for k in range(3))
            t = _norm(tuple(laengs[k] - n[k] * schraeg for k in range(3)))
        b = _kreuz(n, t)
        a = len(self.ecken)
        for st, sb in ((-1, 0), (0, -1), (1, 0), (0, 1)):
            self.ecken.append(tuple(ort[k] + t[k] * lang * st + b[k] * breit * sb for k in range(3)))
        self.seiten.append((a, a + 1, a + 2, a + 3))
        hell = max(0.0, min(0.999, hell)) * (len(self.toene) - 1)
        i = int(hell)
        f = hell - i
        ton = tuple(self.toene[i][k] * (1 - f) + self.toene[i + 1][k] * f for k in range(3)) + (1.0,)
        self.farben.extend([ton] * 4)

    def ballen(self, mitte, halbmesser, kern, dichte=3600, strecke=(1, 1, 0.82), lang=(0.026, 0.044),
               schmal=(0.5, 0.75)):
        """Eine Wolke aus Blaettern um einen dunklen Kern: aussen und oben
        heller, innen und unten dunkler."""
        zufall = self.zufall
        kugel('kern', halbmesser * 0.55, kern, ort=mitte,
              streckung=(strecke[0], strecke[1], strecke[2] * 0.97), teile=10, ringe=6)
        for _ in range(int(dichte * (halbmesser / 0.4) ** 2)):
            d = _einheit(zufall)
            weit = halbmesser * zufall.uniform(0.6, 1.0) * (1 + 0.12 * math.sin(d[0] * 9 + d[1] * 7 + d[2] * 5))
            p = tuple(mitte[k] + d[k] * weit * strecke[k] for k in range(3))
            schief = _einheit(zufall)
            n = (d[0] + schief[0] * 0.7, d[1] + schief[1] * 0.7, d[2] + schief[2] * 0.7 + 0.35)
            laenge = zufall.uniform(*lang)
            hell = 0.45 + 0.3 * d[2] + 0.25 * (weit / halbmesser - 0.8) / 0.2 + zufall.uniform(-0.3, 0.3)
            self.blatt(p, n, laenge, laenge * zufall.uniform(*schmal), hell)

    def ablegen(self, stoff):
        netz('laub', self.ecken, self.seiten, stoff, farben=self.farben)


def _stamm(zufall, rinde, hoehe, unten, oben, neigung=0.06, stuecke=4, fuss=1.6):
    """Ein Stamm, der sich leicht neigt; gibt die Punkte zurueck."""
    schief = (zufall.uniform(-neigung, neigung), zufall.uniform(-neigung, neigung))
    punkte = [(0, 0, 0, unten * fuss), (0, 0, hoehe * 0.04, unten)]
    for i in range(1, stuecke + 1):
        t = i / stuecke
        punkte.append((schief[0] * t * 4 + zufall.uniform(-0.02, 0.02), schief[1] * t * 4 + zufall.uniform(-0.02, 0.02),
                       hoehe * t, unten + (oben - unten) * t))
    strang('stamm', punkte, rinde)
    return punkte


def _am_stamm(punkte, z):
    """Wo der Stamm in der Hoehe z steht."""
    for a, b in zip(punkte[1:], punkte[2:]):
        if z <= b[2]:
            t = (z - a[2]) / max(b[2] - a[2], 1e-6)
            return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, z)
    return (punkte[-1][0], punkte[-1][1], z)


def eiche(zufall):
    hoehe = 2.5
    rinde = gemustert('rinde', ('#33281e', '#514032', '#695643'), massstab=(9, 9, 1.1), groesse=3,
                      detail=6, relief=1.0, fugen=0.5)
    kern = einfarbig('laubkern', '#1e3018', rau=1.0)
    laub = Laub(('#1c2e16', '#2a4120', '#3b5527', '#516a30'), zufall)

    stamm_hoehe = hoehe * zufall.uniform(0.42, 0.5)
    stamm = _stamm(zufall, rinde, stamm_hoehe, 0.125, 0.065, fuss=1.6)
    spitze = stamm[-1]
    ballen = [((spitze[0], spitze[1], hoehe * 0.78), 0.5)]
    aeste = zufall.randint(5, 7)
    for i in range(aeste):
        w = 2 * math.pi * (i + zufall.uniform(-0.3, 0.3)) / aeste
        ab = stamm_hoehe * zufall.uniform(0.62, 0.95)
        weit = zufall.uniform(0.45, 0.8)
        hoch = hoehe * zufall.uniform(0.5, 0.72)
        anfang = _am_stamm(stamm, ab)
        ende = (math.cos(w) * weit, math.sin(w) * weit, hoch)
        mitte = (ende[0] * 0.55, ende[1] * 0.55, ab + (hoch - ab) * 0.4)
        strang('ast', [(*anfang, 0.06), (*mitte, 0.04), (*ende, 0.016)], rinde, rund=2)
        ballen.append((ende, zufall.uniform(0.26, 0.46)))
    for _ in range(4):
        w = zufall.uniform(0, 2 * math.pi)
        r = zufall.uniform(0.15, 0.5)
        ballen.append(((math.cos(w) * r, math.sin(w) * r, hoehe * zufall.uniform(0.68, 0.9)), zufall.uniform(0.22, 0.38)))
    for mitte, halbmesser in ballen:
        laub.ballen(mitte, halbmesser, kern)
    laub.ablegen(aus_merkmal('laub', rau=0.55))


def birke(zufall):
    hoehe = 2.75
    # Weisse Rinde mit dunklen Querstrichen: das Rauschen ist laengs gestaucht.
    rinde = gemustert('birkenrinde', ('#cfccc0', '#e6e3d8', '#3a342c'), massstab=(2.2, 2.2, 13), groesse=3.2,
                      detail=4, relief=0.5, fugen=0.25, kontrast=(0.42, 0.7))
    zweig = einfarbig('birkenzweig', '#3b3128', rau=0.9)
    kern = einfarbig('laubkern', '#2c4018', rau=1.0)
    laub = Laub(('#2f4a1c', '#4a6a26', '#6b8a32', '#8fa544'), zufall)

    stamm = _stamm(zufall, rinde, hoehe * 0.9, 0.07, 0.014, neigung=0.045, stuecke=5, fuss=1.35)
    ballen = []
    aeste = zufall.randint(9, 12)
    for i in range(aeste):
        t = (i + zufall.uniform(0, 0.6)) / aeste
        ab = hoehe * (0.36 + 0.5 * t)
        w = 2.4 * i + zufall.uniform(-0.5, 0.5)
        weit = (0.2 + 0.36 * math.sin(math.pi * (0.15 + 0.8 * t))) * zufall.uniform(0.8, 1.15)
        anfang = _am_stamm(stamm, ab)
        hoch = ab + weit * zufall.uniform(0.5, 0.9)
        ende = (anfang[0] + math.cos(w) * weit, anfang[1] + math.sin(w) * weit, hoch)
        mitte = (anfang[0] + math.cos(w) * weit * 0.5, anfang[1] + math.sin(w) * weit * 0.5, ab + (hoch - ab) * 0.65)
        strang('ast', [(*anfang, 0.022), (*mitte, 0.014), (*ende, 0.006)], zweig, rund=2)
        ballen.append((ende, zufall.uniform(0.17, 0.26)))
        # Die Zweigspitzen haengen: ein kleinerer Ballen darunter, nach aussen.
        ballen.append(((ende[0] + math.cos(w) * 0.1, ende[1] + math.sin(w) * 0.1, hoch - zufall.uniform(0.18, 0.3)),
                       zufall.uniform(0.12, 0.18)))
    spitze = stamm[-1]
    ballen.append(((spitze[0], spitze[1], hoehe * 0.93), 0.2))
    for mitte, halbmesser in ballen:
        laub.ballen(mitte, halbmesser, kern, dichte=2300, strecke=(0.9, 0.9, 1.25), lang=(0.02, 0.032),
                    schmal=(0.6, 0.85))
    laub.ablegen(aus_merkmal('laub', rau=0.5))


def fichte(zufall):
    hoehe = 2.75
    rinde = gemustert('fichtenrinde', ('#2a2019', '#43342a', '#5a493b'), massstab=(8, 8, 1.4), groesse=3.5,
                      detail=6, relief=0.9, fugen=0.5)
    laub = Laub(('#101f16', '#1a3122', '#27452e', '#3b5e3c'), zufall)
    stamm = _stamm(zufall, rinde, hoehe * 0.97, 0.095, 0.012, neigung=0.02, stuecke=5, fuss=1.5)

    # Aeste in Quirlen, von unten breit nach oben schmal. Jeder Ast ist ein
    # flacher Wedel: Nadeln links und rechts des Zweigs, zur Spitze schmaler,
    # die Raender haengen.
    stufen = 13
    for stufe in range(stufen):
        t = stufe / (stufen - 1)
        z = hoehe * (0.13 + 0.8 * t)
        weit = 0.86 * (1 - t) ** 0.85 + 0.07
        anzahl = max(4, int(round(8 - 3 * t)))
        versatz = zufall.uniform(0, 2 * math.pi)
        for i in range(anzahl):
            w = versatz + 2 * math.pi * (i + zufall.uniform(-0.25, 0.25)) / anzahl
            laenge = weit * zufall.uniform(0.82, 1.1)
            aus = (math.cos(w), math.sin(w), 0)
            quer = (-math.sin(w), math.cos(w), 0)
            anfang = _am_stamm(stamm, z + zufall.uniform(-0.04, 0.04))
            haengt = laenge * (0.34 - 0.2 * t)          # unten haengen die Aeste staerker
            hebt = laenge * 0.1                         # die Spitze biegt wieder auf

            def am_ast(s):
                return (anfang[0] + aus[0] * laenge * s, anfang[1] + aus[1] * laenge * s,
                        anfang[2] - haengt * math.sin(s * math.pi * 0.62) + hebt * s * s)

            strang('ast', [(*am_ast(0), 0.02 * (1 - t) + 0.006), (*am_ast(0.5), 0.011), (*am_ast(1), 0.004)],
                   rinde, rund=1)
            for _ in range(int(60 + 330 * laenge)):
                s = zufall.uniform(0.12, 1.0) ** 0.8
                seite = zufall.uniform(-1, 1)
                breite = laenge * 0.3 * (1 - s) ** 0.55 + 0.035
                ast = am_ast(s)
                p = (ast[0] + quer[0] * seite * breite, ast[1] + quer[1] * seite * breite,
                     ast[2] - abs(seite) * breite * 0.5 - zufall.uniform(0, 0.05))
                n = (aus[0] * 0.25 + quer[0] * seite * 0.5 + zufall.uniform(-0.35, 0.35),
                     aus[1] * 0.25 + quer[1] * seite * 0.5 + zufall.uniform(-0.35, 0.35), 1.0)
                richtung = (aus[0] * 0.7 + quer[0] * seite, aus[1] * 0.7 + quer[1] * seite, -0.25)
                # Frische Triebe an den Spitzen sind heller.
                hell = 0.18 + 0.55 * s * s + 0.25 * abs(seite) * s + zufall.uniform(-0.2, 0.2)
                lang = zufall.uniform(0.035, 0.06)
                laub.blatt(p, n, lang, lang * zufall.uniform(0.28, 0.42), hell, laengs=richtung)
    # Der Wipfel: ein schmaler Kegel aus aufrechten Nadeln.
    spitze = stamm[-1]
    for _ in range(420):
        s = zufall.uniform(0, 1)
        w = zufall.uniform(0, 2 * math.pi)
        r = 0.11 * (1 - s) + 0.01
        p = (spitze[0] + math.cos(w) * r, spitze[1] + math.sin(w) * r, hoehe * (0.9 + 0.11 * s))
        laub.blatt(p, (math.cos(w), math.sin(w), 0.5), zufall.uniform(0.03, 0.05), 0.014,
                   0.35 + 0.5 * s + zufall.uniform(-0.15, 0.15), laengs=(math.cos(w) * 0.5, math.sin(w) * 0.5, 1))
    laub.ablegen(aus_merkmal('nadeln', rau=0.5))


def kiefer(zufall):
    hoehe = 2.85
    # Rotbraune Rinde - kraeftiger als die der Eiche, aber kein Orange.
    rinde = gemustert('kiefernrinde', ('#46352b', '#6b4d38', '#8a6347'), massstab=(7, 7, 1.2), groesse=3.2,
                      detail=6, relief=1.0, fugen=0.45)
    kern = einfarbig('nadelkern', '#16261a', rau=1.0)
    laub = Laub(('#16271a', '#243a24', '#35502f', '#4e6a3c'), zufall)
    stamm_hoehe = hoehe * zufall.uniform(0.74, 0.8)
    stamm = _stamm(zufall, rinde, stamm_hoehe, 0.1, 0.05, neigung=0.07, stuecke=5, fuss=1.45)
    spitze = stamm[-1]

    # Ein, zwei tote Aststummel am kahlen Stamm.
    for _ in range(zufall.randint(1, 2)):
        ab = stamm_hoehe * zufall.uniform(0.4, 0.62)
        w = zufall.uniform(0, 2 * math.pi)
        anfang = _am_stamm(stamm, ab)
        ende = (anfang[0] + math.cos(w) * 0.2, anfang[1] + math.sin(w) * 0.2, ab + 0.06)
        strang('stummel', [(*anfang, 0.022), (*ende, 0.008)], rinde, rund=1)

    # Der Schirm: wenige krumme Aeste, die fast waagrecht ausgreifen, darauf
    # flache Nadelpolster.
    polster = [((spitze[0], spitze[1], hoehe * 0.9), 0.4), ((spitze[0], spitze[1], hoehe * 0.99), 0.24)]
    aeste = zufall.randint(5, 7)
    for i in range(aeste):
        w = 2 * math.pi * (i + zufall.uniform(-0.35, 0.35)) / aeste
        ab = stamm_hoehe * zufall.uniform(0.8, 0.98)
        weit = zufall.uniform(0.42, 0.78)
        hoch = hoehe * zufall.uniform(0.8, 0.92)
        anfang = _am_stamm(stamm, ab)
        ende = (spitze[0] + math.cos(w) * weit, spitze[1] + math.sin(w) * weit, hoch)
        knick = (spitze[0] + math.cos(w + 0.3) * weit * 0.55, spitze[1] + math.sin(w + 0.3) * weit * 0.55,
                 ab + (hoch - ab) * 0.25)
        strang('ast', [(*anfang, 0.04), (*knick, 0.026), (*ende, 0.01)], rinde, rund=2)
        polster.append((ende, zufall.uniform(0.24, 0.36)))
        polster.append((((ende[0] + knick[0]) / 2, (ende[1] + knick[1]) / 2, hoch + zufall.uniform(0.02, 0.16)),
                        zufall.uniform(0.2, 0.3)))
    for mitte, halbmesser in polster:
        laub.ballen(mitte, halbmesser, kern, dichte=4200, strecke=(1.1, 1.1, zufall.uniform(0.6, 0.78)),
                    lang=(0.035, 0.055), schmal=(0.22, 0.34))
    laub.ablegen(aus_merkmal('nadeln', rau=0.5))


BAUEN = {'eiche': eiche, 'birke': birke, 'fichte': fichte, 'kiefer': kiefer}


def bauen(art, startwert):
    BAUEN[art](random.Random(startwert))
    for koerper in bpy.context.scene.objects:
        if koerper.type in ('MESH', 'CURVE') and not koerper.get('kulisse'):
            koerper.location = [c * MASS for c in koerper.location]
            koerper.scale = (MASS, MASS, MASS)


def tafel(ziel):
    from kette import kamera_setzen
    zelle, fuss = (350, 292), (95, 246)
    gestalten = 1 if os.environ.get('BILDER_PROBE') else GESTALTEN
    blatt = None
    for zeile, art in enumerate(ARTEN):
        for gestalt in range(gestalten):
            szene_leeren()
            bauen(art, 101 + gestalt * 17 + zeile * 1000)
            if blatt is None:
                blatt = Tafel('baum', zelle=zelle, fuss=fuss, ziel=ziel)
            else:
                kamera_setzen(zelle[0], zelle[1], fuss)
            blatt.bild(zeile, gestalt, maske=False)
    return blatt.schreiben({'art': 'ding', 'arten': list(ARTEN), 'gestalten': gestalten})
