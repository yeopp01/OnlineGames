# Das Fussvolk: alle, die zu Fuss kaempfen - und der Moench.
#
# Derselbe Gliedermann wie der Dorfbewohner (gleiche Masse, gleiche Gelenke),
# nur anders gekleidet, bewaffnet und bewegt. Gebaut in Metern; die Figur
# schaut nach -Y, ihre rechte Hand ist bei -X.
#
#   Miliz             Lederkappe, Wappenrock in Spielerfarbe, Bretterschild, Schwert
#   Soldat            Kettenhemd, Nasalhelm, Ueberwurf in Spielerfarbe, Axt in beiden Haenden
#   Speerkaempfer     heller Stepprock, Hirnhaube, Rundschild, langer Speer mit Wimpel
#   Bogenschuetze     Wams in Spielerfarbe, gruene Kapuze, Koecher, Langbogen
#   Plaenkler         Kittel in Spielerfarbe unter einer Fellweste, Flechtschild, Wurfspiess
#   Armbrustschuetze  Eisenhut, Stepprock in Spielerfarbe, Armbrust, Bolzentasche
#   Moench            Kutte bis zum Boden, Skapulier in Spielerfarbe, Strick, Stab
#
# Die Stufen des Fuerstentums (einheiten AC-58 bis AC-61) - jede so anders
# gekleidet als ihre Vorstufe, dass man sieht, wer aufgeruestet hat:
#
#   Bogenschuetze        Lederkoller ueber einem Rock in Spielerfarbe, helle Hose,
#                        gruener Filzhut mit Feder, ein groesserer Bogen
#   Langschwertkaempfer  Brustplatte ueber dem Kettenhemd, Waffenrock in Spielerfarbe
#                        darunter, Beckenhaube, Dreieckschild, langes Schwert
#   Pikenier             Brustplatte, Sturmhaube mit Kamm, Hose in Spielerfarbe,
#                        die Pike in beiden Haenden - kein Schild
#   Eliteplaenkler       heller Kittel, Weste in Spielerfarbe, Kettenhaube,
#                        eisenbeschlagener Schild, Wurfspiess
#
# Die Eigenen der Haeuser (einheiten AC-42 bis AC-49) - jede an einem Stueck
# zu erkennen, das sonst keiner traegt:
#
#   Eibenschuetze     Gugel in Spielerfarbe, gruener Umhang bis ans Knie, ein
#                     mannshoher Bogen aus dunkler Eibe (Eschenbruch)
#   Pavesenschuetze   die Pavese auf dem Ruecken: ein helles Brett mit einem Pfahl
#                     in Spielerfarbe, breiter als er selbst; Armbrust (Wehrstein)
#   Soeldner          breiter schwarzer Hut mit Federn, Aermel in Spielerfarbe,
#                     Streitkolben und ein kleiner Faustschild (jedes Haus)
#   Riese             anderthalbmal so gross wie ein Mann, Fell, nackte Arme, eine
#                     Keule in beiden Haenden (Wehrstein)
#   Meuchler          dunkel von Kopf bis Fuss, das Gesicht verhuellt, in jeder
#                     Hand ein Dolch (Silberfurt)
#   Wiedergaenger     fahle Haut, Fetzen eines Wappenrocks, rostiges Eisen; er
#                     geht gebeugt, die Linke voraus (Distelhag)
#
# Die Stufen der Krone (einheiten AC-66) - schwerer geruestet als alles davor,
# und jede mit einer Waffe, die kein anderer fuehrt:
#
#   Zweihandkaempfer  Harnisch mit Beintaschen ueber einem Lederkoller, gepuffte
#                     Aermel und das linke Hosenbein in Spielerfarbe, Schaller mit
#                     Federbusch - und ein Schwert, so lang wie er selbst, auf
#                     der Schulter. Kein Schild.
#   Hellebardier      Brigantine in Spielerfarbe ueber dem langen Kettenhemd,
#                     Arme und Beine in Platten, der Schaller mit Kinnreff - vom
#                     Gesicht ist nichts zu sehen. Die Hellebarde lehnt an der
#                     Schulter: Beil, Haken und Stossklinge an einem Schaft.
#
# Die Spielerfarbe steht bei jedem am Rumpf - von dort sieht man sie aus jeder
# Richtung -, und bei keinem an mehr als einem Drittel der Figur (darstellung
# AC-21). Auseinander haelt man sie am Umriss: Schild, Waffe, Kopfbedeckung
# (darstellung AC-14).
#
# Die Tafel: je Zeile eine Blickrichtung, je Spalte ein Bild. Stehen und Gehen
# liegen in der Haupttafel, Angreifen und Sterben je in einer eigenen.
#
# Kein Modell fuer sich: miliz.py, soldat.py und die anderen rufen tafel().
#
# Wie eine Haltung beschrieben ist: je Gelenk drei Winkel (kippen, neigen,
# drehen); bei Armen und Beinen ist vor negativ. `waffe` ist die Neigung der
# Waffe in der Rechten, gemessen an der Figur und nicht am Arm: 0 zeigt sie
# waagerecht nach vorn, -pi/2 nach oben, -pi nach hinten, +pi/2 nach unten. Der
# Griff im Handgelenk wird daraus gerechnet - so bleibt ein Speer waagerecht,
# waehrend der Arm darunter ausholt.

import math
import os

import bpy
from mathutils import Matrix

from dorfbewohner import GROESSE, HUEFTE_TIEFER, KNOECHEL, OBERSCHENKEL, UNTERSCHENKEL
from formen import aufsetzen, drehkoerper, glied, kugel, leer, netz, quader, strang
from kette import Tafel, szene_leeren
from pferd import ring
from stoffe import einfarbig, gemustert

RICHTUNGEN = 8
BILDER = 8                # je Ablauf
ZELLE = (304, 224)
FUSS = (130, 160)

TUCH = ('#7e7e7e', '#b4b4b4')      # hell und unbunt: der Browser faerbt es ein
QUER = (math.pi / 2, 0, 0)         # die Hochachse eines Teils zeigt dann nach vorn (-Y)
SEITE = (0, math.pi / 2, 0)        # die Hochachse eines Teils zeigt dann zur Seite
# Was in einem Bild fehlt (der verschossene Pfeil, der geworfene Spiess), wird
# an seinem Platz winzig: ein Teil aus- und einzublenden bekommt der Renderer,
# der die Szene zwischen zwei Bildern behaelt, nicht immer mit.
WEG = (0.001, 0.001, 0.001)


def stoffe():
    return {
        'haut': einfarbig('haut', '#c08d68', rau=0.65),
        'bart': einfarbig('bart', '#3f2a1c', rau=0.95),
        'haar': einfarbig('haar', '#4a3421', rau=0.95),
        'auge': einfarbig('auge', '#1c1612', rau=0.4),
        'hose': gemustert('hose', ('#3a3026', '#52453a'), groesse=30, detail=3, relief=0.3, fugen=0.5),
        'leder': gemustert('leder', ('#3f2c1d', '#5e432b', '#70522f'), groesse=14, detail=4, relief=0.5,
                           fugen=0.5, rau=0.7),
        'wolle': gemustert('wolle', ('#5d5138', '#75674a', '#857655'), groesse=16, detail=2, relief=0.3,
                           fugen=0.6, rau=0.95),
        'leinen': gemustert('leinen', ('#8f8468', '#aba083'), groesse=40, detail=2, relief=0.25, fugen=0.5),
        # Der Stepprock des Speerkaempfers: heller als alles andere im Spiel.
        'stepp': gemustert('stepp', ('#9a8f73', '#b3a88a', '#c2b798'), massstab=(1, 1, 9), groesse=7, detail=2,
                           relief=0.8, fugen=0.6, rau=0.95),
        'gruen': gemustert('gruen', ('#3d4a2c', '#55633d'), groesse=30, detail=3, relief=0.35, fugen=0.55, rau=0.95),
        'fell': gemustert('fell', ('#4a3a28', '#6b563a', '#83694a'), groesse=70, detail=4, relief=0.9, fugen=0.5,
                          rau=0.95),
        'kutte': gemustert('kutte', ('#4a3828', '#5e4833', '#6b533b'), groesse=22, detail=3, relief=0.35,
                           fugen=0.6, rau=0.95),
        'strick': einfarbig('strick', '#b7a67c', rau=0.9),
        'holz': gemustert('holz', ('#6b4a2c', '#8c6638'), massstab=(8, 8, 1), groesse=4, relief=0.5),
        'bretter': gemustert('bretter', ('#6a4d2f', '#86663e', '#96764a'), massstab=(1, 14, 1), groesse=5,
                             relief=0.6, fugen=0.5),
        'geflecht': gemustert('geflecht', ('#7a6238', '#9b8250', '#ab9462'), massstab=(1, 3, 22), groesse=6,
                              relief=0.9, fugen=0.6, rau=0.9),
        'eisen': gemustert('eisen', ('#6d7176', '#a3a8ad'), groesse=20, detail=2, relief=0.15, rau=0.38,
                           metall=0.85),
        'klinge': gemustert('klinge', ('#8b9096', '#c3c8cd'), groesse=12, detail=2, relief=0.05, rau=0.28,
                            metall=0.9),
        'kette': gemustert('kette', ('#3f4347', '#73787d'), groesse=120, detail=2, relief=0.7, fugen=0.5,
                           rau=0.5, metall=0.75),
        'messing': einfarbig('messing', '#a8842f', rau=0.35, metall=0.9),
        'sehne': einfarbig('sehne', '#d8d0b8', rau=0.8),
        'feder': einfarbig('feder', '#cfc9b8', rau=0.9),
        # Fuer die Eigenen der Haeuser: das rotbraune Holz der Eibe, das dunkle
        # Tuch des Meuchlers, der helle Grund der Pavese, die fahle Haut und
        # das rostige Eisen des Wiedergaengers.
        'eibe': gemustert('eibe', ('#4a2716', '#6b3a1f'), massstab=(8, 8, 1), groesse=4, relief=0.5),
        'nacht': gemustert('nacht', ('#1d1f24', '#30333a'), groesse=30, detail=3, relief=0.35, fugen=0.55, rau=0.95),
        'bemalt': gemustert('bemalt', ('#b9ae90', '#cdc3a6'), massstab=(1, 14, 1), groesse=5, relief=0.3, fugen=0.5),
        'fahl': einfarbig('fahl', '#9aa08e', rau=0.8),
        'rost': gemustert('rost', ('#4a3122', '#75462a', '#5a5651'), groesse=9, detail=4, relief=0.45, fugen=0.5,
                          rau=0.75, metall=0.45),
        # Das Tuch in Spielerfarbe, glatt und gesteppt.
        'tuch': gemustert('tuch', TUCH, groesse=36, detail=3, relief=0.35, fugen=0.55, rau=0.95, spieler=True),
        'steppung': gemustert('steppung', TUCH, massstab=(1, 1, 9), groesse=7, detail=2, relief=0.8, fugen=0.6,
                              rau=0.95, spieler=True),
    }


# ---- der Koerper ----------------------------------------------------------------

def skelett(s, kleid):
    """Gelenke, Arme und Beine. `kleid` nennt die Stoffe: oberarm, unterarm,
    hand, bein, schaft (oder None), schuh."""
    g = {}
    g['figur'] = leer('figur')
    g['figur'].scale = (GROESSE, GROESSE, GROESSE)
    # Wer faellt, kippt um seine Fuesse: dafuer ein Gelenk am Boden.
    g['koerper'] = leer('koerper', (0, 0, 0), g['figur'])
    g['becken'] = leer('becken', (0, 0, 0.93), g['koerper'])
    g['rumpf'] = leer('rumpf', (0, 0, 0), g['becken'])
    g['kopf'] = leer('kopf', (0, 0, 0.57), g['rumpf'])
    for seite, x in (('l', 0.238), ('r', -0.238)):
        g['schulter_' + seite] = leer('schulter_' + seite, (x, 0, 0.45), g['rumpf'])
        glied('oberarm', 0.27, 0.076, 0.064, s[kleid['oberarm']], eltern=g['schulter_' + seite])
        g['ellbogen_' + seite] = leer('ellbogen_' + seite, (0, 0, -0.27), g['schulter_' + seite])
        glied('unterarm', 0.24, 0.058, 0.046, s[kleid['unterarm']], eltern=g['ellbogen_' + seite])
        g['hand_' + seite] = leer('hand_' + seite, (0, 0, -0.25), g['ellbogen_' + seite])
        kugel('hand', 0.054, s[kleid['hand']], ort=(0, 0, -0.035), eltern=g['hand_' + seite],
              streckung=(0.7, 1.0, 1.3), teile=10, ringe=6)
        g['griff_' + seite] = leer('griff_' + seite, (0, -0.01, -0.045), g['hand_' + seite])
    for seite, x in (('l', 0.1), ('r', -0.1)):
        g['huefte_' + seite] = leer('huefte_' + seite, (x, 0, -HUEFTE_TIEFER), g['becken'])
        glied('oberschenkel', OBERSCHENKEL, 0.105, 0.078, s[kleid['bein']], eltern=g['huefte_' + seite])
        g['knie_' + seite] = leer('knie_' + seite, (0, 0, -OBERSCHENKEL), g['huefte_' + seite])
        glied('unterschenkel', UNTERSCHENKEL, 0.075, 0.056, s[kleid['bein']], eltern=g['knie_' + seite])
        if kleid.get('schaft'):
            glied('stiefelschaft', 0.2, 0.076, 0.066, s[kleid['schaft']], eltern=g['knie_' + seite],
                  ort=(0, 0, -UNTERSCHENKEL + 0.2))
        g['knoechel_' + seite] = leer('knoechel_' + seite, (0, 0, -UNTERSCHENKEL), g['knie_' + seite])
        quader('schuh', (0.12, 0.28, 0.095), s[kleid['schuh']], ort=(0, -0.06, -KNOECHEL + 0.0475),
               eltern=g['knoechel_' + seite], fase=0.03)
    # Der Schild sitzt am linken Unterarm: steht der Unterarm waagerecht,
    # haengt der Schild senkrecht daran.
    g['schild'] = leer('schild', (0.085, -0.02, -0.12), g['ellbogen_l'])
    g['frei'] = []
    return g


def gesicht(s, kopf, bart=True, hals='haut'):
    glied('hals', 0.08, 0.05, 0.055, s[hals], eltern=kopf, ort=(0, 0, 0.03))
    kugel('schaedel', 0.118, s['haut'], ort=(0, 0, 0.125), eltern=kopf, streckung=(0.9, 1.0, 1.14))
    kugel('nase', 0.022, s['haut'], ort=(0, -0.118, 0.115), eltern=kopf, teile=8, ringe=6)
    for x in (-0.04, 0.04):
        kugel('auge', 0.014, s['auge'], ort=(x, -0.104, 0.148), eltern=kopf, teile=8, ringe=6)
    if bart:
        kugel('bart', 0.078, s['bart'], ort=(0, -0.058, 0.058), eltern=kopf, streckung=(1.05, 0.85, 0.75),
              teile=12, ringe=8)


# Der Rumpf als Profil (Hoehe ueber dem Becken, Halbmesser): Schultern, Taille,
# Huefte. Jedes Kleidungsstueck liest es und traegt etwas auf.
def torso(saum=-0.27, weite=0.285):
    profil = [(0.51, 0.17), (0.47, 0.228), (0.35, 0.222), (0.15, 0.198), (0.07, 0.202)]
    if saum < -0.14:
        profil.append((-0.08, 0.24))
    profil.append((saum, weite))
    return profil


def ausschnitt(profil, oben, unten):
    """Das Stueck des Profils zwischen zwei Hoehen, mit sauberen Enden."""
    def bei(z):
        for (z0, r0), (z1, r1) in zip(profil, profil[1:]):
            if z1 <= z <= z0:
                return r0 + (r1 - r0) * (z0 - z) / (z0 - z1)
        return profil[0][1] if z > profil[0][0] else profil[-1][1]
    mitte = [(z, r) for z, r in profil if unten < z < oben]
    return [(oben, bei(oben))] + mitte + [(unten, bei(unten))]


def rock(name, stoff, rumpf, saum=-0.27, weite=0.285, dick=0.0):
    """Ein Kleid um den ganzen Rumpf, von den Schultern bis zum Saum."""
    profil = [(0.55, 0), (0.54, 0.085)] + [(z, r + dick) for z, r in torso(saum, weite)]
    profil += [(saum + 0.02, max(0.05, weite + dick - 0.055)), (saum + 0.09, 0)]
    return drehkoerper(name, profil, stoff, eltern=rumpf, streckung=(1, 0.7), teile=18)


def band(name, stoff, rumpf, profil, dick=0.012):
    """Ein Stueck Kleid ohne Schultern: Guertel, Leibbinde, Kettenschurz."""
    aussen = [(z, r + dick) for z, r in profil]
    innen = [(z, r) for z, r in reversed(profil)]
    return drehkoerper(name, aussen + innen + [aussen[0]], stoff, eltern=rumpf, streckung=(1, 0.7), teile=18)


def bahn(name, stoff, rumpf, profil, mitte, halb, dick=0.016, teile=6):
    """Eine Stoffbahn, die nur einen Teil des Umfangs deckt: Ueberwurf,
    Skapulier, Weste. `mitte` ist der Winkel (vorn -90 Grad), `halb` die halbe
    Breite."""
    ecken = []
    for z, r in profil:
        for i in range(teile + 1):
            w = math.radians(mitte - halb + 2 * halb * i / teile)
            ecken.append((math.cos(w) * (r + dick), math.sin(w) * (r + dick) * 0.7, z))
    seiten = []
    for j in range(len(profil) - 1):
        for i in range(teile):
            a = j * (teile + 1) + i
            seiten.append((a, a + 1, a + teile + 2, a + teile + 1))
    return netz(name, ecken, seiten, stoff, eltern=rumpf, glatt=True, dicke=0.014)


def guertel(s, rumpf, dick=0.0, stoff='leder'):
    drehkoerper('guertel', [(0.115, 0.198 + dick), (0.115, 0.213 + dick), (0.065, 0.217 + dick), (0.065, 0.202 + dick)],
                s[stoff], eltern=rumpf, streckung=(1, 0.7), teile=18)


def kragen(name, stoff, rumpf):
    """Ein Schulterkragen: Kapuze, Kettenhaube."""
    drehkoerper(name, [(0.62, 0.08), (0.57, 0.125), (0.5, 0.255), (0.4, 0.292), (0.34, 0.288), (0.36, 0.22), (0.42, 0)],
                stoff, eltern=rumpf, streckung=(1, 0.76), teile=18)


# ---- Kopfbedeckungen --------------------------------------------------------------

def haube(name, stoff, kopf, frei=-0.3, oben=0.55):
    """Eine Haube, die das Gesicht frei laesst: Leder, Kette, Stoff.

    Unter einem Helm bleibt sie am Scheitel offen; wer nichts darueber traegt,
    schliesst sie mit `oben=None` - sonst sieht man die Kopfhaut.
    """
    kugel(name, 0.132, stoff, ort=(0, 0.012, 0.12), eltern=kopf, streckung=(0.95, 1.0, 1.1),
          weglassen=lambda x, y, z: y < frei or (oben is not None and z > oben))


def lederkappe(s, kopf):
    kugel('kappe', 0.128, s['leder'], ort=(0, 0.006, 0.15), eltern=kopf, streckung=(0.95, 1.02, 0.95),
          weglassen=lambda x, y, z: z < -0.05)
    quader('kappenriemen', (0.02, 0.2, 0.02), s['leder'], ort=(0, 0, 0.27), eltern=kopf, fase=0.006)


def hirnhaube(s, kopf):
    """Eine runde Eisenkappe ohne Rand."""
    drehkoerper('hirnhaube', [(0.165, 0.128), (0.21, 0.124), (0.26, 0.095), (0.287, 0.05), (0.295, 0)], s['eisen'],
                eltern=kopf, streckung=(0.94, 1.02), teile=16)


def nasalhelm(s, kopf):
    drehkoerper('helm', [(0.15, 0.129), (0.2, 0.128), (0.27, 0.098), (0.32, 0.05), (0.345, 0)], s['eisen'],
                eltern=kopf, streckung=(0.94, 1.02), teile=16)
    ring('stirnreif', 0.127, 0.012, 0.035, s['eisen'], ort=(0, 0, 0.165), eltern=kopf, streckung=(0.94, 1.02), teile=16)
    quader('nasal', (0.03, 0.016, 0.1), s['eisen'], ort=(0, -0.13, 0.11), eltern=kopf, fase=0.005)


def eisenhut(s, kopf):
    """Der Eisenhut: eine flache Glocke mit breiter Krempe."""
    drehkoerper('eisenhut', [(0.15, 0.225), (0.165, 0.228), (0.185, 0.135), (0.25, 0.122), (0.3, 0.075), (0.315, 0)],
                s['eisen'], eltern=kopf, streckung=(0.96, 1.0), teile=18)
    drehkoerper('krempe', [(0.15, 0.225), (0.15, 0.1)], s['eisen'], eltern=kopf, streckung=(0.96, 1.0), teile=18)


def kapuze(s, kopf, rumpf, stoff):
    kugel('kapuze', 0.14, stoff, ort=(0, 0.014, 0.132), eltern=kopf, streckung=(0.95, 1.02, 1.12),
          weglassen=lambda x, y, z: y < -0.42 and -0.8 < z < 0.52)
    quader('zipfel', (0.05, 0.05, 0.2), stoff, ort=(0, 0.15, 0.07), drehung=(0.35, 0, 0), eltern=kopf, fase=0.02)
    kragen('kapuzenkragen', stoff, rumpf)


def beckenhaube(s, kopf):
    """Die Beckenhaube: hoch und spitz, bis in den Nacken - das Gesicht bleibt frei."""
    haube('helmglocke', s['eisen'], kopf)
    drehkoerper('helmspitze', [(0.17, 0.134), (0.24, 0.126), (0.31, 0.09), (0.37, 0.04), (0.4, 0)], s['eisen'],
                eltern=kopf, streckung=(0.95, 1.03), teile=16)


def sturmhaube(s, kopf):
    """Die Sturmhaube: eine runde Glocke mit einem Kamm von der Stirn zum Nacken."""
    drehkoerper('sturmhaube', [(0.15, 0.131), (0.2, 0.129), (0.27, 0.1), (0.305, 0.05), (0.315, 0)], s['eisen'],
                eltern=kopf, streckung=(0.94, 1.02), teile=16)
    quader('kamm', (0.026, 0.34, 0.09), s['eisen'], ort=(0, 0.01, 0.31), eltern=kopf, fase=0.012)
    ring('helmreif', 0.129, 0.014, 0.04, s['messing'], ort=(0, 0, 0.165), eltern=kopf, streckung=(0.94, 1.02), teile=16)


def federhut(s, kopf, stoff):
    """Ein Filzhut: die Krempe vorn lang und spitz, an der Seite eine Feder."""
    drehkoerper('hutkopf', [(0.17, 0.127), (0.24, 0.12), (0.3, 0.085), (0.33, 0)], stoff, eltern=kopf,
                streckung=(0.95, 1.02), teile=14)
    drehkoerper('hutkrempe', [(0.168, 0.1), (0.168, 0.19), (0.19, 0.195), (0.19, 0.1)], stoff, ort=(0, -0.045, 0),
                eltern=kopf, streckung=(0.88, 1.3), teile=14)
    quader('hutfeder', (0.014, 0.06, 0.3), s['feder'], ort=(0.11, 0.05, 0.36), drehung=(0.55, 0.2, 0), eltern=kopf,
           fase=0.005)


# ---- Waffen und Schilde -----------------------------------------------------------

def schwert(s, griff):
    quader('klinge', (0.012, 0.7, 0.05), s['klinge'], ort=(0, -0.43, 0), eltern=griff, fase=0.004)
    quader('parierstange', (0.03, 0.03, 0.2), s['eisen'], ort=(0, -0.07, 0), eltern=griff, fase=0.008)
    quader('heft', (0.026, 0.13, 0.03), s['leder'], ort=(0, 0, 0), eltern=griff, fase=0.008)
    kugel('knauf', 0.028, s['eisen'], ort=(0, 0.08, 0), eltern=griff, teile=8, ringe=6)


def langschwert(s, griff):
    """Das lange Schwert: eine Handbreit laenger als ein Mann breit ist."""
    quader('klinge', (0.012, 0.98, 0.058), s['klinge'], ort=(0, -0.59, 0), eltern=griff, fase=0.004)
    quader('parierstange', (0.03, 0.03, 0.28), s['eisen'], ort=(0, -0.085, 0), eltern=griff, fase=0.008)
    quader('heft', (0.026, 0.2, 0.03), s['leder'], ort=(0, 0.02, 0), eltern=griff, fase=0.008)
    kugel('knauf', 0.034, s['messing'], ort=(0, 0.135, 0), eltern=griff, teile=8, ringe=6)


def axt(s, griff):
    """Die grosse Axt: ein langer Stiel, oben das Blatt mit einer Spitze."""
    drehkoerper('stiel', [(-0.3, 0), (-0.3, 0.02), (0.95, 0.019), (0.95, 0)], s['holz'], drehung=QUER, eltern=griff,
                teile=8)
    # Das Blatt steht nach unten: so faellt es beim Hieb voran.
    umriss = [(-0.02, -0.76), (-0.02, -0.9), (-0.16, -0.96), (-0.21, -0.83), (-0.16, -0.7)]
    n = len(umriss)
    ecken = [(d, y, z) for d in (-0.012, 0.012) for z, y in umriss]
    seiten = [tuple(range(n)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    netz('blatt', ecken, seiten, s['eisen'], eltern=griff, glatt=False)
    quader('tuelle', (0.05, 0.2, 0.05), s['eisen'], ort=(0, -0.83, 0), eltern=griff, fase=0.01)
    drehkoerper('dorn', [(0.93, 0.016), (1.07, 0)], s['eisen'], drehung=QUER, eltern=griff, teile=6, glatt=False)


def speer(s, griff, hinten=0.8, vorn=1.15, wimpel=None):
    drehkoerper('schaft', [(-hinten, 0), (-hinten, 0.017), (vorn, 0.015), (vorn, 0)], s['holz'], drehung=QUER,
                eltern=griff, teile=8)
    drehkoerper('spitze', [(vorn - 0.02, 0), (vorn - 0.02, 0.024), (vorn + 0.05, 0.03), (vorn + 0.24, 0)], s['klinge'],
                drehung=QUER, eltern=griff, teile=8, glatt=False)
    if wimpel is not None:
        netz('wimpel', [(0, -(vorn - 0.04), 0.012), (0, -(vorn - 0.24), 0.012), (0, -(vorn - 0.17), -0.27)], [(0, 1, 2)],
             wimpel, eltern=griff, dicke=0.012)


def stab(s, griff):
    """Der Stab des Moenchs: oben ein Kreuz aus Messing."""
    drehkoerper('stab', [(-1.05, 0), (-1.05, 0.019), (0.62, 0.017), (0.62, 0)], s['holz'], drehung=QUER, eltern=griff,
                teile=8)
    quader('kreuz_laengs', (0.026, 0.26, 0.026), s['messing'], ort=(0, -0.74, 0), eltern=griff, fase=0.006)
    quader('kreuz_quer', (0.16, 0.026, 0.026), s['messing'], ort=(0, -0.78, 0), eltern=griff, fase=0.006)
    kugel('knoten', 0.03, s['messing'], ort=(0, -0.61, 0), eltern=griff, teile=8, ringe=6)


def armbrust(s, griff):
    """Die Armbrust: der Schaft nach vorn, vorn der kurze Bogen quer."""
    quader('saeule', (0.05, 0.78, 0.055), s['holz'], ort=(0, -0.24, 0.02), eltern=griff, fase=0.012)
    strang('bogen', [(-0.34, -0.5, 0.03, 0.014), (-0.2, -0.59, 0.03, 0.02), (0, -0.62, 0.03, 0.024),
                     (0.2, -0.59, 0.03, 0.02), (0.34, -0.5, 0.03, 0.014)], s['eisen'], eltern=griff, rund=2)
    for x in (-1, 1):
        strang('sehne', [(x * 0.34, -0.5, 0.045, 0.005), (x * 0.16, -0.34, 0.05, 0.005), (0, -0.2, 0.052, 0.005)],
               s['sehne'], eltern=griff, rund=1)
    quader('bolzen', (0.014, 0.4, 0.014), s['holz'], ort=(0, -0.42, 0.058), eltern=griff, fase=0.003)
    quader('steigbuegel', (0.1, 0.07, 0.02), s['eisen'], ort=(0, -0.66, 0.03), eltern=griff, fase=0.006)


def rundschild(s, schild, halb, stoff, feld=None):
    drehkoerper('rundschild', [(-0.012, 0), (-0.012, halb), (0.012, halb), (0.02, halb * 0.75), (0.03, 0)], s[stoff],
                drehung=SEITE, eltern=schild, teile=20)
    if feld:
        # Ein bemaltes Feld um den Buckel, ringsum bleibt der Schild, wie er ist.
        drehkoerper('schildfeld', [(0.016, 0), (0.016, halb * 0.62), (0.026, halb * 0.62), (0.035, 0)], s[feld],
                    drehung=SEITE, eltern=schild, teile=20)
    ring('schildreif', halb, 0.014, 0.03, s['eisen'], drehung=SEITE, eltern=schild, teile=20)
    kugel('schildbuckel', 0.06, s['eisen'], ort=(0.03, 0, 0), eltern=schild, streckung=(0.6, 1, 1), teile=10, ringe=6)


def langschild(s, schild):
    """Der Schild der Miliz: Bretter, oben rund, unten spitz, bis zum Knie."""
    umriss = [(-0.2, 0.26), (-0.12, 0.36), (0.12, 0.36), (0.2, 0.26), (0.21, 0.0), (0.13, -0.32), (0.0, -0.56),
              (-0.13, -0.32), (-0.21, 0.0)]
    n = len(umriss)
    ecken = [(d, -hoch, weit) for d in (-0.016, 0.016) for weit, hoch in umriss]
    seiten = [tuple(range(n)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    netz('langschild', ecken, seiten, s['bretter'], eltern=schild, glatt=False)
    # Das Schildhaupt ist in Spielerfarbe bemalt: von links und von hinten
    # links verdeckt der Schild den Wappenrock, und ohne das staende die
    # Miliz dort ohne Farbe da (gemessen 2 % des Koerpers).
    haupt = [(-0.19, 0.25), (-0.11, 0.34), (0.11, 0.34), (0.19, 0.25), (0.2, 0.13), (-0.2, 0.13)]
    m = len(haupt)
    netz('schildhaupt', [(d, -hoch, weit) for d in (0.014, 0.021) for weit, hoch in haupt],
         [tuple(range(m)), tuple(range(m, 2 * m))] + [(i, (i + 1) % m, m + (i + 1) % m, m + i) for i in range(m)],
         s['tuch'], eltern=schild, glatt=False)
    quader('schildleiste', (0.04, 0.84, 0.035), s['eisen'], ort=(0, 0.1, 0), eltern=schild, fase=0.006)
    kugel('schildbuckel', 0.065, s['eisen'], ort=(0.03, -0.05, 0), eltern=schild, streckung=(0.6, 1, 1), teile=10, ringe=6)


def dreieckschild(s, schild):
    """Der Schild des Langschwertkaempfers: oben gerade, unten spitz, aus
    Eisen - das Feld in der Mitte traegt die Spielerfarbe."""
    umriss = [(-0.21, 0.3), (0.21, 0.3), (0.22, 0.05), (0.13, -0.2), (0.0, -0.36), (-0.13, -0.2), (-0.22, 0.05)]
    n = len(umriss)
    seiten = [tuple(range(n)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    netz('dreieckschild', [(d, -hoch, weit) for d in (-0.016, 0.016) for weit, hoch in umriss], seiten, s['eisen'],
         eltern=schild, glatt=False)
    # Das Feld: derselbe Umriss, kleiner und ein Stueck nach oben - ringsum bleibt Eisen.
    feld = [(weit * 0.7, hoch * 0.7 + 0.02) for weit, hoch in umriss]
    netz('schildfeld', [(d, -hoch, weit) for d in (0.014, 0.022) for weit, hoch in feld], seiten, s['tuch'],
         eltern=schild, glatt=False)
    kugel('schildbuckel', 0.05, s['messing'], ort=(0.03, -0.04, 0), eltern=schild, streckung=(0.6, 1, 1), teile=10,
          ringe=6)


def koecher(s, rumpf, ort, drehung, pfeile=5):
    """Ein Koecher mit Pfeilen - oder eine Bolzentasche."""
    halter = leer('koecher', ort, rumpf)
    halter.rotation_euler = drehung
    drehkoerper('koecherleib', [(-0.28, 0), (-0.28, 0.05), (0.2, 0.062), (0.2, 0.05), (0.18, 0)], s['leder'],
                eltern=halter, teile=10)
    for i in range(pfeile):
        w = 2 * math.pi * i / pfeile
        x, y = 0.028 * math.cos(w), 0.028 * math.sin(w)
        quader('pfeilende', (0.01, 0.01, 0.2), s['holz'], ort=(x, y, 0.28), eltern=halter, fase=0.002)
        quader('befiederung', (0.035, 0.012, 0.09), s['feder'], ort=(x, y, 0.33), eltern=halter, fase=0.004)


def streitkolben(s, griff):
    """Der Streitkolben: ein kurzer Stiel, vorn ein Kopf aus sechs Schlagblaettern."""
    drehkoerper('kolbenstiel', [(-0.12, 0), (-0.12, 0.02), (0.5, 0.018), (0.5, 0)], s['holz'], drehung=QUER,
                eltern=griff, teile=8)
    kugel('kolbenkern', 0.05, s['eisen'], ort=(0, -0.56, 0), eltern=griff, teile=8, ringe=6)
    # Drei Platten ueber Kreuz sind sechs Blaetter.
    for i in range(3):
        quader('schlagblatt', (0.2, 0.15, 0.014), s['eisen'], ort=(0, -0.56, 0), drehung=(0, i * math.pi / 3, 0),
               eltern=griff, fase=0.004)
    drehkoerper('kolbendorn', [(0.62, 0.02), (0.7, 0)], s['eisen'], drehung=QUER, eltern=griff, teile=6, glatt=False)


def keule(s, griff):
    """Die Keule des Riesen: ein Stamm, vorn dick, mit zwei Eisenreifen und Naegeln."""
    drehkoerper('keule', [(-0.3, 0), (-0.3, 0.032), (0.25, 0.036), (0.7, 0.075), (0.98, 0.095), (1.08, 0.075),
                          (1.12, 0)], s['holz'], drehung=QUER, eltern=griff, teile=10)
    for vorn, halb in ((0.74, 0.084), (1.0, 0.1)):
        ring('keulenreif', halb, 0.012, 0.05, s['eisen'], ort=(0, -vorn, 0), drehung=QUER, eltern=griff, teile=10)
    # Vier Staebe quer durch den Kopf: acht Naegel, die herausstehen.
    for i in range(4):
        quader('nagel', (0.27, 0.026, 0.026), s['eisen'], ort=(0, -0.87, 0), drehung=(0, i * math.pi / 4, 0),
               eltern=griff, fase=0.006)


def dolch(s, griff):
    quader('dolchklinge', (0.012, 0.36, 0.05), s['klinge'], ort=(0, -0.24, 0), eltern=griff, fase=0.004)
    quader('dolchstange', (0.028, 0.024, 0.12), s['eisen'], ort=(0, -0.055, 0), eltern=griff, fase=0.006)
    quader('dolchheft', (0.024, 0.1, 0.028), s['leder'], eltern=griff, fase=0.008)


def pavese(s, rumpf):
    """Die Pavese auf dem Ruecken: ein Brett, breiter als der Mann und vom Knie
    bis ueber die Augen. Im Feld stellt er sie vor sich - getragen wird sie so."""
    halter = leer('pavese', (0, 0.225, 0.2), rumpf)
    halter.rotation_euler = (0.05, 0, 0)
    quader('pavesenbrett', (0.66, 0.04, 1.1), s['bemalt'], eltern=halter, fase=0.03)
    # Der Grat in der Mitte, und darauf der Pfahl in Spielerfarbe: von hinten
    # verdeckt das Brett alles andere, was Farbe traegt.
    quader('pavesengrat', (0.13, 0.03, 1.08), s['bemalt'], ort=(0, 0.03, 0), eltern=halter, fase=0.012)
    quader('pavesenpfahl', (0.18, 0.012, 1.0), s['tuch'], ort=(0, 0.05, 0), eltern=halter, fase=0.003)
    for z in (-0.535, 0.535):
        quader('pavesenrand', (0.68, 0.05, 0.035), s['eisen'], ort=(0, 0, z), eltern=halter, fase=0.008)


def schlapphut(s, kopf):
    """Ein breiter Hut aus schwarzem Filz, daran zwei Federn in Spielerfarbe."""
    drehkoerper('hutkopf', [(0.17, 0.128), (0.25, 0.122), (0.31, 0.09), (0.335, 0)], s['nacht'], eltern=kopf,
                streckung=(0.95, 1.02), teile=14)
    drehkoerper('hutkrempe', [(0.178, 0.1), (0.162, 0.25), (0.18, 0.255), (0.198, 0.1)], s['nacht'], eltern=kopf,
                teile=18)
    for i, (neigung, lang) in enumerate(((0.75, 0.34), (1.05, 0.28))):
        quader('hutfeder', (0.024, 0.085, lang), s['tuch'], ort=(0.12, 0.1 + 0.03 * i, 0.3 + lang * 0.3),
               drehung=(neigung, 0.2, 0), eltern=kopf, fase=0.008)


# ---- die sieben ---------------------------------------------------------------------

# ---- was erst die Krone traegt --------------------------------------------------------

def schaller(s, kopf, kinnreff=False):
    """Der Schaller: eine glatte Glocke bis ueber die Augen, davor ein
    Sehschlitz, hinten ein Schirm ueber dem Nacken. Mit `kinnreff` deckt eine
    Platte Kinn und Mund - vom Gesicht bleibt dann nichts zu sehen."""
    kugel('schaller', 0.142, s['eisen'], ort=(0, 0.01, 0.17), eltern=kopf, streckung=(0.95, 1.06, 0.92), teile=18,
          weglassen=lambda x, y, z: z < -0.28)
    # Der Rand der Glocke: ein Wulst ringsum - daran sieht man, wo sie endet.
    ring('schallerrand', 0.137, 0.009, 0.012, s['eisen'], ort=(0, 0.01, 0.136), eltern=kopf, streckung=(0.95, 1.06),
         teile=18)
    quader('sehschlitz', (0.11, 0.02, 0.016), s['auge'], ort=(0, -0.136, 0.16), eltern=kopf, fase=0.004)
    # Der Nackenschirm: eine flache Schale, die hinten weit ueber den Kragen steht.
    kugel('nackenschirm', 0.15, s['eisen'], ort=(0, 0.07, 0.15), eltern=kopf, streckung=(0.92, 1.3, 0.5), teile=18,
          weglassen=lambda x, y, z: y < 0.25 or z > 0.35)
    if kinnreff:
        kugel('kinnreff', 0.128, s['eisen'], ort=(0, -0.016, 0.06), eltern=kopf, streckung=(0.95, 1.0, 0.95), teile=14,
              weglassen=lambda x, y, z: y > 0.3 or z > 0.55)
        # Der Kragen des Kinnreffs liegt auf der Brust auf.
        drehkoerper('reffkragen', [(-0.04, 0.1), (-0.075, 0.135), (-0.085, 0.13), (-0.055, 0.09)], s['eisen'],
                    ort=(0, -0.016, 0.06), eltern=kopf, streckung=(0.95, 1.0), teile=14)


def federbusch(s, kopf, mitte):
    """Drei Federn vom Scheitel nach hinten, die mittlere in Spielerfarbe."""
    for x, stoff, hoch in ((-0.055, s['feder'], 0.0), (0.0, mitte, 0.045), (0.055, s['feder'], 0.0)):
        strang('feder', [(x * 0.3, 0.05, 0.275, 0.012), (x * 0.7, 0.11, 0.39 + hoch, 0.032),
                         (x, 0.23, 0.455 + hoch, 0.04), (x * 1.3, 0.35, 0.4 + hoch, 0.024),
                         (x * 1.5, 0.42, 0.31 + hoch, 0.008)], stoff, eltern=kopf, rund=2)
    kugel('federhuelse', 0.024, s['messing'], ort=(0, 0.045, 0.285), eltern=kopf, teile=8, ringe=6)


def halsberge(s, rumpf):
    """Ein Kragen aus Platten um Hals und Schluesselbein - schmaler als der Kettenkragen."""
    drehkoerper('halsberge', [(0.61, 0.082), (0.56, 0.115), (0.505, 0.205), (0.47, 0.222), (0.465, 0.21), (0.5, 0.1)],
                s['eisen'], eltern=rumpf, streckung=(1, 0.76), teile=18)


def platte(name, umriss, stoff, griff, dick=0.012):
    """Ein flaches Stueck Eisen an einer Waffe. `umriss` nennt die Ecken
    ringsum als (quer, laengs) am Griff - ohne Einbuchtung, sonst reisst die
    Flaeche."""
    n = len(umriss)
    ecken = [(d, y, z) for d in (-dick, dick) for z, y in umriss]
    seiten = [tuple(range(n)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    return netz(name, ecken, seiten, stoff, eltern=griff, glatt=False)


def zweihaender(s, griff):
    """Der Zweihaender: so lang wie sein Traeger. Ueber der Parierstange ein
    Stueck ohne Schneide, mit Leder umwickelt und von zwei Parierhaken gedeckt
    - dort greift die zweite Hand, wenn es eng wird."""
    # Die Klinge: breit an der Wurzel, die letzte Handbreit laeuft spitz zu.
    platte('klinge', [(-0.036, -0.27), (-0.03, -1.27), (0.0, -1.44), (0.03, -1.27), (0.036, -0.27)], s['klinge'], griff,
           dick=0.007)
    # Der Grat in der Mitte der Klinge faengt das Licht.
    quader('grat', (0.022, 0.92, 0.014), s['klinge'], ort=(0, -0.74, 0), eltern=griff, fase=0.005)
    quader('fehlschaerfe', (0.022, 0.18, 0.05), s['leder'], ort=(0, -0.19, 0), eltern=griff, fase=0.006)
    for z in (-1, 1):
        platte('parierhaken', [(z * 0.02, -0.262), (z * 0.02, -0.31), (z * 0.105, -0.325)], s['eisen'], griff, dick=0.01)
        kugel('stangenknopf', 0.026, s['messing'], ort=(0, -0.1, z * 0.225), eltern=griff, teile=8, ringe=6)
    quader('parierstange', (0.032, 0.032, 0.44), s['eisen'], ort=(0, -0.1, 0), eltern=griff, fase=0.01)
    # Das Heft fuer zwei Haende, in der Mitte ein Bund, am Ende der Knauf.
    drehkoerper('heft', [(-0.3, 0), (-0.3, 0.017), (-0.1, 0.022), (0.08, 0.018), (0.08, 0)], s['leder'], drehung=QUER,
                eltern=griff, teile=10)
    ring('heftbund', 0.022, 0.006, 0.01, s['messing'], ort=(0, 0.1, 0), drehung=QUER, eltern=griff, teile=10)
    kugel('knauf', 0.04, s['messing'], ort=(0, 0.33, 0), eltern=griff, streckung=(1, 1.3, 1), teile=10, ringe=6)


def hellebarde(s, griff, quaste):
    """Die Hellebarde: am langen Schaft ein Beil mit breiter Schneide,
    gegenueber ein Haken, obenauf eine lange Stossklinge - darunter eine
    Quaste in Spielerfarbe."""
    hinten, vorn = 0.9, 1.22
    drehkoerper('schaft', [(-hinten, 0), (-hinten, 0.019), (vorn, 0.017), (vorn, 0)], s['holz'], drehung=QUER,
                eltern=griff, teile=8)
    drehkoerper('schaftschuh', [(-hinten - 0.05, 0), (-hinten, 0.022), (-hinten + 0.08, 0.022), (-hinten + 0.08, 0.019)],
                s['eisen'], drehung=QUER, eltern=griff, teile=8)
    # Zwei Schaftfedern halten den Kopf: Eisenbaender, die den Schaft hinablaufen.
    quader('schaftfedern', (0.014, 0.5, 0.046), s['eisen'], ort=(0, -(vorn - 0.22), 0), eltern=griff, fase=0.004)
    quader('tuelle', (0.054, 0.24, 0.054), s['eisen'], ort=(0, -(vorn - 0.06), 0), eltern=griff, fase=0.01)
    # Das Beil steht nach unten wie das Blatt der Axt: so faellt es beim Hieb voran.
    platte('beil', [(-0.02, -(vorn - 0.17)), (-0.02, -(vorn + 0.04)), (-0.2, -(vorn + 0.13)), (-0.26, -(vorn - 0.04)),
                    (-0.2, -(vorn - 0.21))], s['eisen'], griff)
    # Die Schneide: der aeussere Keil des Beils, blank geschliffen.
    platte('schneide', [(-0.2, -(vorn + 0.13)), (-0.26, -(vorn - 0.04)), (-0.2, -(vorn - 0.21))], s['klinge'], griff,
           dick=0.014)
    platte('haken', [(0.02, -(vorn - 0.13)), (0.02, -(vorn + 0.02)), (0.16, -(vorn - 0.1))], s['eisen'], griff)
    drehkoerper('stossklinge', [(vorn - 0.02, 0), (vorn - 0.02, 0.022), (vorn + 0.07, 0.027), (vorn + 0.36, 0)],
                s['klinge'], drehung=QUER, eltern=griff, teile=6, glatt=False)
    drehkoerper('quaste', [(vorn - 0.46, 0.019), (vorn - 0.45, 0.058), (vorn - 0.37, 0.046), (vorn - 0.345, 0.019)],
                quaste, drehung=QUER, eltern=griff, teile=10)


def _zweihandkaempfer(s):
    g = skelett(s, {'oberarm': 'tuch', 'unterarm': 'eisen', 'hand': 'leder', 'bein': 'leinen', 'schaft': 'leder',
                    'schuh': 'leder'})
    rumpf, kopf = g['rumpf'], g['kopf']
    # Der Koller: ein Lederrock bis ueber die Huefte. Darueber der Harnisch,
    # an dem vorn zwei Beintaschen haengen.
    rock('koller', s['leder'], rumpf, saum=-0.24, weite=0.29)
    rock('harnisch', s['eisen'], rumpf, saum=0.1, weite=0.215, dick=0.022)
    quader('brustgrat', (0.024, 0.026, 0.27), s['eisen'], ort=(0, -0.168, 0.33), drehung=(0.07, 0, 0), eltern=rumpf,
           fase=0.008)
    tasche = ausschnitt(torso(-0.24, 0.29), 0.09, -0.21)
    bahn('beintasche_l', s['eisen'], rumpf, tasche, -52, 30, dick=0.03)
    bahn('beintasche_r', s['eisen'], rumpf, tasche, -128, 30, dick=0.03)
    guertel(s, rumpf, dick=0.036)
    halsberge(s, rumpf)
    # Die Aermel: zwei Puffen in Spielerfarbe, dazwischen ein Band aus hellem
    # Leinen - so sieht man die Farbe auch von der Seite und von hinten.
    for seite in ('l', 'r'):
        schulter = g['schulter_' + seite]
        kugel('puffe', 0.108, s['tuch'], ort=(0, 0, -0.04), eltern=schulter, streckung=(1.0, 1.0, 1.05), teile=12,
              ringe=8)
        kugel('puffe', 0.092, s['tuch'], ort=(0, 0, -0.2), eltern=schulter, streckung=(1.0, 1.0, 0.9), teile=12, ringe=8)
        ring('aermelband', 0.072, 0.01, 0.014, s['leinen'], ort=(0, 0, -0.125), eltern=schulter, teile=12)
        kugel('ellbogenkachel', 0.058, s['eisen'], eltern=g['ellbogen_' + seite], streckung=(1.0, 1.15, 1.0), teile=10,
              ringe=6)
    # Geteilte Hose: das linke Bein in Spielerfarbe, das rechte in Leinen.
    glied('hosenbein', OBERSCHENKEL, 0.108, 0.081, s['tuch'], eltern=g['huefte_l'])
    glied('hosenbein', UNTERSCHENKEL, 0.078, 0.059, s['tuch'], eltern=g['knie_l'])
    for seite in ('l', 'r'):
        ring('kniebund', 0.079, 0.008, 0.016, s['leder'], ort=(0, 0, -0.045), eltern=g['knie_' + seite], teile=12)
    # An der linken Huefte das kurze Schwert fuer das Gedraenge.
    quader('scheide', (0.03, 0.05, 0.46), s['leder'], ort=(0.26, 0.06, -0.16), drehung=(0.45, 0, 0), eltern=rumpf,
           fase=0.01)
    quader('kurzheft', (0.03, 0.03, 0.13), s['messing'], ort=(0.26, -0.067, 0.105), drehung=(0.45, 0, 0), eltern=rumpf,
           fase=0.008)
    quader('kurzstange', (0.03, 0.15, 0.03), s['eisen'], ort=(0.26, -0.041, 0.052), drehung=(0.45, 0, 0), eltern=rumpf,
           fase=0.008)
    gesicht(s, kopf)
    schaller(s, kopf)
    federbusch(s, kopf, s['tuch'])
    zweihaender(s, g['griff_r'])
    return g


def _hellebardier(s):
    g = skelett(s, {'oberarm': 'kette', 'unterarm': 'eisen', 'hand': 'leder', 'bein': 'eisen', 'schaft': None,
                    'schuh': 'eisen'})
    rumpf, kopf = g['rumpf'], g['kopf']
    # Das Kettenhemd reicht bis ans Knie. Darueber die Brigantine: Tuch in
    # Spielerfarbe ueber Eisenplaettchen, in Reihen vernietet.
    rock('kettenhemd', s['kette'], rumpf, saum=-0.36, weite=0.3)
    rock('brigantine', s['steppung'], rumpf, saum=-0.1, weite=0.25, dick=0.022)
    for z, halb in ((0.4, 0.25), (0.28, 0.24), (0.16, 0.226), (0.0, 0.243)):
        ring('nieten', halb, 0.007, 0.014, s['messing'], ort=(0, 0, z), eltern=rumpf, streckung=(1, 0.7), teile=18)
    guertel(s, rumpf, dick=0.028)
    halsberge(s, rumpf)
    for seite in ('l', 'r'):
        kugel('schulterkachel', 0.096, s['eisen'], eltern=g['schulter_' + seite], streckung=(1.0, 1.08, 0.86), teile=12,
              ringe=8)
        kugel('ellbogenkachel', 0.06, s['eisen'], eltern=g['ellbogen_' + seite], streckung=(1.0, 1.15, 1.0), teile=10,
              ringe=6)
        kugel('kniekachel', 0.086, s['eisen'], ort=(0, -0.012, 0), eltern=g['knie_' + seite], streckung=(1.0, 1.1, 1.0),
              teile=10, ringe=6)
        # Ein Riemen haelt die Beinschiene in der Kniekehle.
        ring('schienenriemen', 0.079, 0.006, 0.012, s['leder'], ort=(0, 0, -0.11), eltern=g['knie_' + seite], teile=12)
    gesicht(s, kopf, bart=False, hals='kette')
    schaller(s, kopf, kinnreff=True)
    hellebarde(s, g['griff_r'], s['tuch'])
    return g


def windenarmbrust(s, griff):
    """Die schwere Armbrust: ein Stahlbogen, fast so breit wie der Schuetze
    hoch bis zur Brust, am Kolben die Winde mit zwei Kurbeln, die ihn spannt."""
    quader('saeule', (0.06, 0.92, 0.065), s['holz'], ort=(0, -0.24, 0.02), eltern=griff, fase=0.014)
    # Der Stahlbogen: breit, stark und blank.
    strang('bogen', [(-0.5, -0.5, 0.03, 0.016), (-0.32, -0.63, 0.03, 0.026), (0, -0.69, 0.03, 0.032),
                     (0.32, -0.63, 0.03, 0.026), (0.5, -0.5, 0.03, 0.016)], s['klinge'], eltern=griff, rund=2)
    # Die Bindung: Hanf haelt den Bogen im Kopf der Saeule.
    quader('bindung', (0.085, 0.07, 0.085), s['strick'], ort=(0, -0.66, 0.03), eltern=griff, fase=0.015)
    for x in (-1, 1):
        strang('sehne', [(x * 0.5, -0.5, 0.05, 0.007), (x * 0.24, -0.33, 0.056, 0.007), (0, -0.16, 0.058, 0.007)],
               s['sehne'], eltern=griff, rund=1)
    quader('bolzen', (0.018, 0.46, 0.018), s['holz'], ort=(0, -0.42, 0.066), eltern=griff, fase=0.004)
    drehkoerper('bolzenspitze', [(0.64, 0.02), (0.72, 0)], s['eisen'], ort=(0, 0, 0.066), drehung=QUER, eltern=griff,
                teile=6, glatt=False)
    quader('steigbuegel', (0.13, 0.09, 0.022), s['eisen'], ort=(0, -0.75, 0.03), eltern=griff, fase=0.006)
    # Die Winde am Kolben: ein Eisenkasten mit Welle, links und rechts eine Kurbel.
    quader('windenkasten', (0.1, 0.11, 0.1), s['eisen'], ort=(0, 0.2, 0.03), eltern=griff, fase=0.012)
    quader('welle', (0.34, 0.024, 0.024), s['eisen'], ort=(0, 0.2, 0.03), eltern=griff, fase=0.006)
    for x in (-1, 1):
        quader('kurbel', (0.022, 0.022, 0.15), s['eisen'], ort=(x * 0.17, 0.2, 0.03 - x * 0.06), eltern=griff,
               fase=0.005)
        quader('kurbelgriff', (0.08, 0.03, 0.03), s['holz'], ort=(x * 0.2, 0.2, 0.03 - x * 0.13), eltern=griff,
               fase=0.008)
    # Zwei Seile laufen von der Winde zur Sehne.
    for x in (-0.035, 0.035):
        quader('windenseil', (0.008, 0.34, 0.008), s['strick'], ort=(x, 0.0, 0.07), eltern=griff, fase=0.002)


def pfeilsack(s, rumpf):
    """Der Pfeilsack hinter der rechten Huefte: helles Leinen, oben gebunden,
    die Befiederung von einem Buendel Pfeile schaut heraus."""
    halter = leer('pfeilsack', (-0.19, 0.15, -0.04), rumpf)
    halter.rotation_euler = (-0.45, -0.15, 0)
    drehkoerper('sackleib', [(-0.36, 0), (-0.36, 0.05), (-0.1, 0.075), (0.12, 0.07), (0.17, 0.05), (0.15, 0)],
                s['leinen'], eltern=halter, teile=10)
    ring('sackbund', 0.058, 0.01, 0.02, s['leder'], ort=(0, 0, 0.14), eltern=halter, teile=10)
    for i in range(8):
        w = 2 * math.pi * i / 8
        r = 0.036 if i % 2 else 0.018
        x, y = r * math.cos(w), r * math.sin(w)
        quader('pfeilende', (0.01, 0.01, 0.22), s['holz'], ort=(x, y, 0.26), eltern=halter, fase=0.002)
        quader('befiederung', (0.04, 0.012, 0.1), s['feder'], ort=(x, y, 0.32), drehung=(0, 0, w), eltern=halter,
               fase=0.004)


def _langbogenschuetze(s):
    g = skelett(s, {'oberarm': 'stepp', 'unterarm': 'leder', 'hand': 'haut', 'bein': 'hose', 'schaft': 'leder',
                    'schuh': 'leder'})
    rumpf, kopf = g['rumpf'], g['kopf']
    # Die Jacke: gesteppt, hell, bis auf den halben Schenkel - und der Laenge
    # nach geteilt. Die linke Haelfte traegt die Spielerfarbe, dafuer der
    # rechte Aermel: so sieht man sie aus jeder Richtung, und keiner im Spiel
    # ist sonst zweifarbig.
    rock('jacke', s['stepp'], rumpf, saum=-0.3, weite=0.29, dick=0.012)
    bahn('farbhaelfte', s['steppung'], rumpf, torso(-0.3, 0.29), 0, 90, dick=0.03, teile=10)
    glied('farbaermel', 0.27, 0.084, 0.072, s['steppung'], eltern=g['schulter_r'])
    guertel(s, rumpf, dick=0.04)
    ring('stehkragen', 0.09, 0.014, 0.07, s['stepp'], ort=(0, 0, 0.56), eltern=rumpf, streckung=(1, 0.85), teile=12)
    # Der Armschutz aus Horn am Bogenarm: dort schlaegt die Sehne an.
    ring('armschutz', 0.057, 0.01, 0.13, s['feder'], ort=(0, 0, -0.12), eltern=g['ellbogen_l'], teile=10)
    # An der linken Huefte das Schwert, ueber dem Heft der Faustschild.
    quader('scheide', (0.03, 0.05, 0.5), s['leder'], ort=(0.3, 0.07, -0.2), drehung=(0.45, 0, 0), eltern=rumpf,
           fase=0.01)
    quader('kurzheft', (0.03, 0.03, 0.13), s['messing'], ort=(0.3, -0.066, 0.085), drehung=(0.45, 0, 0), eltern=rumpf,
           fase=0.008)
    quader('kurzstange', (0.03, 0.15, 0.03), s['eisen'], ort=(0.3, -0.04, 0.032), drehung=(0.45, 0, 0), eltern=rumpf,
           fase=0.008)
    drehkoerper('faustschild', [(0.0, 0.125), (0.014, 0.125), (0.02, 0.05), (0.06, 0.03), (0.07, 0)], s['eisen'],
                ort=(0.325, 0.0, -0.06), drehung=SEITE, eltern=rumpf, teile=14)
    pfeilsack(s, rumpf)
    gesicht(s, kopf)
    schaller(s, kopf)
    # Der Bogen: fast mannshoch, die Enden aus hellem Horn, der Griff umwickelt.
    _bogen(s, g, halb=1.0, dick=1.3)
    for x in (-1.0, 1.0):
        kugel('hornspitze', 0.02, s['feder'], ort=(x, 0, 0.2), eltern=g['bogen'], streckung=(1.8, 1, 1), teile=8,
              ringe=6)
    drehkoerper('wicklung', [(-0.08, 0), (-0.08, 0.032), (0.08, 0.032), (0.08, 0)], s['leder'], ort=(0, 0, -0.02),
                drehung=SEITE, eltern=g['bogen'], teile=8)
    return g


def _schwerearmbrust(s):
    g = skelett(s, {'oberarm': 'tuch', 'unterarm': 'eisen', 'hand': 'leder', 'bein': 'leinen', 'schaft': 'leder',
                    'schuh': 'leder'})
    rumpf, kopf = g['rumpf'], g['kopf']
    # Der Kettenschurz reicht bis ans Knie. Darueber der Harnisch: Brust und
    # Ruecken blank, darunter drei Bauchreifen, die sich beim Buecken schieben.
    band('kettenschurz', s['kette'], rumpf, ausschnitt(torso(-0.34, 0.3), 0.0, -0.34))
    rock('harnisch', s['eisen'], rumpf, saum=0.08, weite=0.218, dick=0.024)
    quader('brustgrat', (0.024, 0.026, 0.27), s['eisen'], ort=(0, -0.17, 0.33), drehung=(0.07, 0, 0), eltern=rumpf,
           fase=0.008)
    for z, halb in ((0.03, 0.236), (-0.04, 0.253), (-0.11, 0.27)):
        ring('bauchreifen', halb, 0.012, 0.078, s['eisen'], ort=(0, 0, z), eltern=rumpf, streckung=(1, 0.7), teile=18)
    guertel(s, rumpf, dick=0.052)
    # Der Schulterkragen in Spielerfarbe liegt ueber dem Harnisch: von oben -
    # und so sieht das Spiel - ist er das Breiteste an der Figur.
    kragen('schulterkragen', s['tuch'], rumpf)
    for seite in ('l', 'r'):
        kugel('ellbogenkachel', 0.06, s['eisen'], eltern=g['ellbogen_' + seite], streckung=(1.0, 1.15, 1.0), teile=10,
              ringe=6)
        kugel('kniekachel', 0.086, s['eisen'], ort=(0, -0.012, 0), eltern=g['knie_' + seite], streckung=(1.0, 1.1, 1.0),
              teile=10, ringe=6)
    # Die Bolzentasche hinter der rechten Huefte.
    koecher(s, rumpf, (-0.21, 0.1, -0.04), (0.25, 0.1, 0), pfeile=6)
    gesicht(s, kopf)
    haube('polsterhaube', s['leder'], kopf)
    eisenhut(s, kopf)
    ring('hutreif', 0.138, 0.01, 0.022, s['messing'], ort=(0, 0, 0.19), eltern=kopf, streckung=(0.96, 1.0), teile=18)
    windenarmbrust(s, g['griff_r'])
    return g


def _miliz(s):
    g = skelett(s, {'oberarm': 'wolle', 'unterarm': 'leinen', 'hand': 'haut', 'bein': 'hose', 'schaft': 'leder',
                    'schuh': 'leder'})
    rumpf, kopf = g['rumpf'], g['kopf']
    rock('tunika', s['wolle'], rumpf)
    # Der Wappenrock: eine Bahn vorn, eine hinten, bis ueber die Huefte - an
    # den Seiten schaut die Tunika hervor.
    profil = ausschnitt(torso(), 0.49, -0.17)
    bahn('wappenrock_vorn', s['tuch'], rumpf, profil, -90, 44)
    bahn('wappenrock_hinten', s['tuch'], rumpf, profil, 90, 44)
    guertel(s, rumpf, dick=0.02)
    gesicht(s, kopf)
    lederkappe(s, kopf)
    schwert(s, g['griff_r'])
    langschild(s, g['schild'])
    return g


def _soldat(s):
    g = skelett(s, {'oberarm': 'kette', 'unterarm': 'kette', 'hand': 'leder', 'bein': 'kette', 'schaft': None,
                    'schuh': 'eisen'})
    rumpf, kopf = g['rumpf'], g['kopf']
    rock('kettenhemd', s['kette'], rumpf, saum=-0.3, weite=0.3)
    # Der Ueberwurf: eine Bahn vorn, eine hinten, an den Seiten offen.
    profil = ausschnitt(torso(-0.3, 0.3), 0.49, -0.24)
    bahn('ueberwurf_vorn', s['tuch'], rumpf, profil, -90, 48)
    bahn('ueberwurf_hinten', s['tuch'], rumpf, profil, 90, 48)
    guertel(s, rumpf, dick=0.02)
    kragen('kettenkragen', s['kette'], rumpf)
    gesicht(s, kopf, hals='kette')
    haube('kettenhaube', s['kette'], kopf)
    nasalhelm(s, kopf)
    axt(s, g['griff_r'])
    return g


def _speerkaempfer(s):
    g = skelett(s, {'oberarm': 'stepp', 'unterarm': 'leinen', 'hand': 'haut', 'bein': 'hose', 'schaft': 'leder',
                    'schuh': 'leder'})
    rumpf, kopf = g['rumpf'], g['kopf']
    rock('stepprock', s['stepp'], rumpf, saum=-0.3, weite=0.3, dick=0.012)
    # Der Wappenstreifen: schmal, vorn und hinten, von der Schulter bis zum Saum.
    profil = ausschnitt(torso(-0.3, 0.3), 0.49, -0.27)
    bahn('streifen_vorn', s['tuch'], rumpf, profil, -90, 26, dick=0.026)
    bahn('streifen_hinten', s['tuch'], rumpf, profil, 90, 26, dick=0.026)
    guertel(s, rumpf, dick=0.03)
    gesicht(s, kopf)
    haube('polsterhaube', s['stepp'], kopf)
    hirnhaube(s, kopf)
    speer(s, g['griff_r'], wimpel=s['tuch'])
    rundschild(s, g['schild'], 0.25, 'leder')
    return g


def _bogenschuetze(s):
    g = skelett(s, {'oberarm': 'leinen', 'unterarm': 'leder', 'hand': 'haut', 'bein': 'hose', 'schaft': 'leder',
                    'schuh': 'leder'})
    rumpf, kopf = g['rumpf'], g['kopf']
    # Ein schmales Wams ohne Aermel: kein Schild, keine Ruestung.
    rock('wams', s['tuch'], rumpf, saum=-0.17, weite=0.255, dick=0.004)
    guertel(s, rumpf, dick=0.006)
    gesicht(s, kopf)
    kapuze(s, kopf, rumpf, s['gruen'])
    koecher(s, rumpf, (-0.09, 0.19, 0.3), (-0.25, 0.35, 0))
    _bogen(s, g)
    return g


def _bogen(s, g, halb=0.8, dick=1.0, stoff='holz'):
    """Bogen, Sehne und der Pfeil auf der Sehne. `halb` ist die halbe Laenge
    des Bogens, `dick` macht das Holz staerker."""
    # Der Bogen in der Linken: die Wurfarme laengs der X-Achse des Griffs, der
    # Bauch vom Schuetzen weg.
    g['bogen'] = leer('bogen', (0, 0, 0), g['griff_l'])
    knie = halb * 0.5625
    strang('bogenholz', [(-halb, 0, 0.2, 0.01 * dick), (-knie, 0, 0.05, 0.016 * dick), (0, 0, -0.02, 0.02 * dick),
                         (knie, 0, 0.05, 0.016 * dick), (halb, 0, 0.2, 0.01 * dick)], s[stoff], eltern=g['bogen'],
           rund=2)
    # Die Sehne: drei Punkte, der mittlere wandert mit der Zughand.
    kurve = bpy.data.curves.new('sehne', 'CURVE')
    kurve.dimensions = '3D'
    kurve.bevel_depth = 0.006
    kurve.bevel_resolution = 1
    zug = kurve.splines.new('POLY')
    zug.points.add(2)
    for punkt, ort in zip(zug.points, ((-halb, 0, 0.2), (0, 0, 0.2), (halb, 0, 0.2))):
        punkt.co = (*ort, 1)
    sehne = bpy.data.objects.new('sehne', kurve)
    bpy.context.scene.collection.objects.link(sehne)
    sehne.parent = g['bogen']
    kurve.materials.append(s['sehne'])
    g['sehne'] = sehne
    # Der Pfeil auf der Sehne: frei, je Bild zwischen die Haende gelegt.
    pfeil = leer('pfeil')
    quader('pfeilschaft', (0.012, 0.74, 0.012), s['holz'], ort=(0, -0.37, 0), eltern=pfeil, fase=0.002)
    drehkoerper('pfeilspitze', [(0.72, 0.016), (0.8, 0)], s['eisen'], drehung=QUER, eltern=pfeil, teile=6, glatt=False)
    quader('pfeilfeder', (0.04, 0.1, 0.012), s['feder'], ort=(0, -0.07, 0), eltern=pfeil, fase=0.003)
    g['pfeil'] = pfeil


def _bogenschuetze2(s):
    g = skelett(s, {'oberarm': 'tuch', 'unterarm': 'leder', 'hand': 'haut', 'bein': 'leinen', 'schaft': 'leder',
                    'schuh': 'leder'})
    rumpf, kopf = g['rumpf'], g['kopf']
    # Der Rock in Spielerfarbe schaut unter dem Lederkoller hervor: an den
    # Aermeln und als Schoss ueber der Huefte.
    rock('rock', s['tuch'], rumpf, saum=-0.27, weite=0.275)
    rock('koller', s['leder'], rumpf, saum=-0.08, weite=0.24, dick=0.022)
    guertel(s, rumpf, dick=0.04, stoff='strick')
    gesicht(s, kopf)
    federhut(s, kopf, s['gruen'])
    koecher(s, rumpf, (-0.09, 0.19, 0.3), (-0.25, 0.35, 0), pfeile=7)
    _bogen(s, g, halb=0.96, dick=1.25)
    return g


def _langschwertkaempfer(s):
    g = skelett(s, {'oberarm': 'kette', 'unterarm': 'eisen', 'hand': 'leder', 'bein': 'kette', 'schaft': 'eisen',
                    'schuh': 'eisen'})
    rumpf, kopf = g['rumpf'], g['kopf']
    # Das Kettenhemd reicht bis ueber die Knie, der Waffenrock in Spielerfarbe
    # endet eine Handbreit darueber - bis zum Saum war er mehr als ein Drittel
    # der Figur (darstellung AC-21). Darueber liegt die Brustplatte.
    rock('kettenhemd', s['kette'], rumpf, saum=-0.4, weite=0.3)
    rock('waffenrock', s['tuch'], rumpf, saum=-0.27, weite=0.31, dick=0.006)
    rock('brustplatte', s['eisen'], rumpf, saum=0.1, weite=0.215, dick=0.02)
    guertel(s, rumpf, dick=0.03)
    kragen('kettenkragen', s['kette'], rumpf)
    gesicht(s, kopf, hals='kette')
    beckenhaube(s, kopf)
    langschwert(s, g['griff_r'])
    dreieckschild(s, g['schild'])
    return g


def _pikenier(s):
    g = skelett(s, {'oberarm': 'stepp', 'unterarm': 'leder', 'hand': 'leder', 'bein': 'tuch', 'schaft': 'leder',
                    'schuh': 'leder'})
    rumpf, kopf = g['rumpf'], g['kopf']
    # Ein kurzes Kettenhemd, darueber die Brustplatte - und die Hose in
    # Spielerfarbe: kein anderer traegt sie an den Beinen.
    rock('kettenhemd', s['kette'], rumpf, saum=-0.2, weite=0.27)
    rock('brustplatte', s['eisen'], rumpf, saum=0.1, weite=0.215, dick=0.02)
    guertel(s, rumpf, dick=0.03)
    gesicht(s, kopf)
    haube('polsterhaube', s['stepp'], kopf)
    sturmhaube(s, kopf)
    # Die Pike: gut anderthalbmal so lang wie der Speer, ohne Wimpel.
    speer(s, g['griff_r'], hinten=1.0, vorn=1.62)
    return g


def _eliteplaenkler(s):
    g = skelett(s, {'oberarm': 'leinen', 'unterarm': 'leder', 'hand': 'haut', 'bein': 'leinen', 'schaft': 'leder',
                    'schuh': 'leder'})
    rumpf, kopf = g['rumpf'], g['kopf']
    rock('kittel', s['leinen'], rumpf, saum=-0.26, weite=0.28)
    # Die Weste in Spielerfarbe: vorn und hinten eine Bahn, an den Seiten der helle Kittel.
    profil = ausschnitt(torso(-0.26, 0.28), 0.5, -0.12)
    bahn('weste_vorn', s['steppung'], rumpf, profil, -90, 50, dick=0.03)
    bahn('weste_hinten', s['steppung'], rumpf, profil, 90, 50, dick=0.03)
    guertel(s, rumpf, dick=0.034)
    kragen('kettenkragen', s['kette'], rumpf)
    gesicht(s, kopf, hals='kette')
    haube('kettenhaube', s['kette'], kopf, oben=None)
    ring('stirnreif', 0.134, 0.014, 0.045, s['eisen'], ort=(0, 0.01, 0.2), eltern=kopf, streckung=(0.95, 1.02), teile=16)
    # Der Wurfspiess in der Rechten, zwei weitere hinter dem Schild.
    g['spiess'] = leer('spiess', (0, 0, 0), g['griff_r'])
    speer(s, g['spiess'], hinten=0.5, vorn=0.66)
    # Das Feld des Schilds traegt die Spielerfarbe: von links verdeckt er die
    # Weste, und ohne das stuende die Figur dort ohne Farbe (darstellung AC-21).
    rundschild(s, g['schild'], 0.27, 'eisen', feld='tuch')
    for z in (-0.05, 0.05):
        vorrat = leer('vorrat', (-0.04, 0.1, z), g['schild'])
        vorrat.rotation_euler = (0.2, 0, 0)
        speer(s, vorrat, hinten=0.5, vorn=0.66)
    return g


def _plaenkler(s):
    g = skelett(s, {'oberarm': 'tuch', 'unterarm': 'haut', 'hand': 'haut', 'bein': 'hose', 'schaft': None,
                    'schuh': 'leder'})
    rumpf, kopf = g['rumpf'], g['kopf']
    rock('kittel', s['tuch'], rumpf, saum=-0.2, weite=0.265)
    # Die Fellweste laesst links und rechts einen Streifen Kittel frei.
    profil = ausschnitt(torso(-0.2, 0.265), 0.5, -0.1)
    bahn('weste_vorn', s['fell'], rumpf, profil, -90, 62, dick=0.03)
    bahn('weste_hinten', s['fell'], rumpf, profil, 90, 62, dick=0.03)
    guertel(s, rumpf, dick=0.034)
    gesicht(s, kopf)
    kugel('haar', 0.126, s['haar'], ort=(0, 0.012, 0.14), eltern=kopf, streckung=(0.95, 1.0, 1.05),
          weglassen=lambda x, y, z: y < -0.25 and z < 0.5)
    ring('stirnband', 0.118, 0.012, 0.03, s['leder'], ort=(0, 0.004, 0.19), eltern=kopf, streckung=(0.93, 1.02), teile=16)
    # Der Wurfspiess in der Rechten, zwei weitere hinter dem Schild.
    g['spiess'] = leer('spiess', (0, 0, 0), g['griff_r'])
    speer(s, g['spiess'], hinten=0.5, vorn=0.62)
    rundschild(s, g['schild'], 0.23, 'geflecht')
    for z in (-0.05, 0.05):
        vorrat = leer('vorrat', (-0.04, 0.1, z), g['schild'])
        vorrat.rotation_euler = (0.2, 0, 0)
        speer(s, vorrat, hinten=0.5, vorn=0.62)
    return g


def _armbrustschuetze(s):
    g = skelett(s, {'oberarm': 'kette', 'unterarm': 'leder', 'hand': 'haut', 'bein': 'hose', 'schaft': 'leder',
                    'schuh': 'leder'})
    rumpf, kopf = g['rumpf'], g['kopf']
    # Unter dem Stepprock schaut ein Schurz aus Kette hervor.
    band('kettenschurz', s['kette'], rumpf, ausschnitt(torso(-0.3, 0.29), 0.0, -0.3))
    rock('stepprock', s['steppung'], rumpf, saum=-0.14, weite=0.262, dick=0.016)
    guertel(s, rumpf, dick=0.02)
    # Ein Kragen aus Kette ueber den Schultern - und weniger Spielerfarbe:
    # ohne ihn war mehr als ein Drittel der Gestalt gefaerbt (darstellung AC-21).
    kragen('kettenkragen', s['kette'], rumpf)
    koecher(s, rumpf, (-0.2, 0.08, -0.02), (0.25, 0.1, 0), pfeile=4)
    gesicht(s, kopf)
    haube('polsterhaube', s['leder'], kopf)
    eisenhut(s, kopf)
    armbrust(s, g['griff_r'])
    return g


def _moench(s):
    g = skelett(s, {'oberarm': 'kutte', 'unterarm': 'kutte', 'hand': 'haut', 'bein': 'kutte', 'schaft': None,
                    'schuh': 'leder'})
    rumpf, kopf = g['rumpf'], g['kopf']
    # Die Kutte: bis knapp ueber den Boden, unten weit wie eine Glocke.
    rock('kutte', s['kutte'], rumpf, saum=-0.84, weite=0.37)
    # Weite Aermel bis ueber die Handgelenke.
    for seite in ('l', 'r'):
        drehkoerper('aermel', [(0.02, 0.07), (-0.2, 0.085), (-0.26, 0.1), (-0.25, 0.06)], s['kutte'],
                    eltern=g['ellbogen_' + seite], teile=10)
    # Das Skapulier: eine Bahn vorn und hinten, von den Schultern fast bis zum Saum.
    profil = ausschnitt(torso(-0.84, 0.37), 0.5, -0.72)
    bahn('skapulier_vorn', s['tuch'], rumpf, profil, -90, 28)
    bahn('skapulier_hinten', s['tuch'], rumpf, profil, 90, 28)
    guertel(s, rumpf, dick=0.02, stoff='strick')
    strang('strickende', [(0.1, -0.165, 0.09, 0.012), (0.12, -0.2, -0.1, 0.012), (0.11, -0.22, -0.3, 0.014)], s['strick'],
           eltern=rumpf, rund=2)
    kragen('kapuzenkragen', s['kutte'], rumpf)
    kugel('kapuze', 0.1, s['kutte'], ort=(0, 0.13, 0.5), eltern=rumpf, streckung=(1.2, 0.8, 1.1), teile=10, ringe=6)
    gesicht(s, kopf, bart=False)
    # Die Tonsur: ein Haarkranz, der Scheitel bleibt frei.
    kugel('haarkranz', 0.124, s['haar'], ort=(0, 0.01, 0.13), eltern=kopf, streckung=(0.95, 1.0, 1.0),
          weglassen=lambda x, y, z: z > 0.62 or z < -0.2 or (y < -0.35 and z < 0.45))
    stab(s, g['griff_r'])
    return g


# ---- die Eigenen der Haeuser -----------------------------------------------------------

def _eibenschuetze(s):
    g = skelett(s, {'oberarm': 'gruen', 'unterarm': 'leder', 'hand': 'haut', 'bein': 'hose', 'schaft': 'leder',
                    'schuh': 'leder'})
    rumpf, kopf = g['rumpf'], g['kopf']
    rock('wams', s['leder'], rumpf, saum=-0.2, weite=0.262, dick=0.006)
    # Der Umhang: eine breite Bahn im Ruecken, von den Schultern bis ans Knie -
    # laenger, und die Wade traete beim Gehen hindurch.
    bahn('umhang', s['gruen'], rumpf, ausschnitt(torso(-0.48, 0.36), 0.5, -0.46), 90, 60, dick=0.034, teile=8)
    guertel(s, rumpf, dick=0.012)
    gesicht(s, kopf)
    # Die Gugel in Spielerfarbe: beim Bogenschuetzen ist sie gruen und das Wams gefaerbt.
    kapuze(s, kopf, rumpf, s['tuch'])
    koecher(s, rumpf, (-0.09, 0.26, 0.3), (-0.25, 0.35, 0), pfeile=7)
    # Der Bogen ist so lang, wie der Mann hoch ist.
    _bogen(s, g, halb=1.04, dick=1.35, stoff='eibe')
    return g


def _pavesenschuetze(s):
    g = skelett(s, {'oberarm': 'tuch', 'unterarm': 'leder', 'hand': 'haut', 'bein': 'hose', 'schaft': 'leder',
                    'schuh': 'leder'})
    rumpf, kopf = g['rumpf'], g['kopf']
    rock('stepprock', s['stepp'], rumpf, saum=-0.24, weite=0.28, dick=0.014)
    # Der Schoss des Rocks in Spielerfarbe: von vorn tragen sie sonst nur die Oberarme.
    band('schoss', s['tuch'], rumpf, ausschnitt(torso(-0.24, 0.28), -0.02, -0.24), dick=0.03)
    guertel(s, rumpf, dick=0.03)
    koecher(s, rumpf, (-0.2, 0.08, -0.02), (0.25, 0.1, 0), pfeile=4)
    gesicht(s, kopf, hals='kette')
    haube('kettenhaube', s['kette'], kopf)
    hirnhaube(s, kopf)
    pavese(s, rumpf)
    armbrust(s, g['griff_r'])
    return g


def _soeldner(s):
    g = skelett(s, {'oberarm': 'tuch', 'unterarm': 'leder', 'hand': 'leder', 'bein': 'hose', 'schaft': 'leder',
                    'schuh': 'leder'})
    rumpf, kopf = g['rumpf'], g['kopf']
    rock('rock', s['wolle'], rumpf, saum=-0.25, weite=0.275)
    # Die Brigantine: Leder ueber Eisenplaettchen, in drei Reihen vernietet.
    rock('brigantine', s['leder'], rumpf, saum=-0.1, weite=0.245, dick=0.022)
    for z, halb in ((0.4, 0.25), (0.28, 0.24), (0.16, 0.226)):
        ring('nieten', halb, 0.008, 0.018, s['messing'], ort=(0, 0, z), eltern=rumpf, streckung=(1, 0.7), teile=18)
    guertel(s, rumpf, dick=0.026)
    gesicht(s, kopf)
    kugel('haar', 0.126, s['haar'], ort=(0, 0.012, 0.14), eltern=kopf, streckung=(0.95, 1.0, 1.05),
          weglassen=lambda x, y, z: y < -0.25 and z < 0.5)
    schlapphut(s, kopf)
    streitkolben(s, g['griff_r'])
    rundschild(s, g['schild'], 0.16, 'eisen')
    return g


def _riese(s):
    g = skelett(s, {'oberarm': 'haut', 'unterarm': 'haut', 'hand': 'haut', 'bein': 'hose', 'schaft': 'fell',
                    'schuh': 'leder'})
    rumpf, kopf = g['rumpf'], g['kopf']
    rock('fellrock', s['fell'], rumpf, saum=-0.24, weite=0.3, dick=0.03)
    # Das Lendentuch in Spielerfarbe: vorn und hinten eine Bahn vom Guertel
    # bis ans Knie, darueber die Leibbinde ringsum - die sieht man auch von der Seite.
    profil = ausschnitt(torso(-0.42, 0.32), 0.08, -0.4)
    bahn('lendentuch_vorn', s['tuch'], rumpf, profil, -90, 30, dick=0.05)
    bahn('lendentuch_hinten', s['tuch'], rumpf, profil, 90, 30, dick=0.05)
    band('leibbinde', s['tuch'], rumpf, ausschnitt(torso(), 0.18, 0.07), dick=0.05)
    guertel(s, rumpf, dick=0.062)
    kragen('fellkragen', s['fell'], rumpf)
    for seite in ('l', 'r'):
        ring('armreif', 0.058, 0.012, 0.07, s['eisen'], ort=(0, 0, -0.19), eltern=g['ellbogen_' + seite], teile=10)
    gesicht(s, kopf)
    # Kahl, schwere Brauen, der Bart bis auf die Brust.
    quader('braue', (0.14, 0.03, 0.03), s['haut'], ort=(0, -0.102, 0.176), eltern=kopf, fase=0.01)
    kugel('langbart', 0.07, s['bart'], ort=(0, -0.08, -0.02), eltern=kopf, streckung=(0.9, 0.7, 1.3), teile=10,
          ringe=6)
    keule(s, g['griff_r'])
    return g


def _meuchler(s):
    g = skelett(s, {'oberarm': 'nacht', 'unterarm': 'leder', 'hand': 'leder', 'bein': 'nacht', 'schaft': 'leder',
                    'schuh': 'leder'})
    rumpf, kopf = g['rumpf'], g['kopf']
    rock('rock', s['nacht'], rumpf, saum=-0.3, weite=0.275)
    guertel(s, rumpf, dick=0.006)
    # Der Schulterkragen und das Tuch vor dem Gesicht tragen die Spielerfarbe,
    # alles andere ist dunkel.
    kragen('schulterkragen', s['tuch'], rumpf)
    gesicht(s, kopf, bart=False)
    kugel('gesichtstuch', 0.126, s['tuch'], ort=(0, -0.004, 0.1), eltern=kopf, streckung=(0.92, 1.0, 1.1), ringe=14,
          weglassen=lambda x, y, z: z > 0.15 or y > 0.2)
    kugel('kapuze', 0.14, s['nacht'], ort=(0, 0.014, 0.132), eltern=kopf, streckung=(0.95, 1.02, 1.12),
          weglassen=lambda x, y, z: y < -0.42 and -0.8 < z < 0.52)
    quader('zipfel', (0.05, 0.05, 0.24), s['nacht'], ort=(0, 0.16, 0.05), drehung=(0.45, 0, 0), eltern=kopf, fase=0.02)
    dolch(s, g['griff_r'])
    dolch(s, g['griff_l'])
    return g


def _wiedergaenger(s):
    # Fahl statt Haut, Rost statt Eisen: derselbe Bau, andere Stoffe.
    s = {**s, 'haut': s['fahl'], 'eisen': s['rost'], 'klinge': s['rost']}
    g = skelett(s, {'oberarm': 'leinen', 'unterarm': 'haut', 'hand': 'haut', 'bein': 'hose', 'schaft': None,
                    'schuh': 'haut'})
    rumpf, kopf = g['rumpf'], g['kopf']
    rock('hemd', s['leinen'], rumpf, saum=-0.22, weite=0.265)
    # Was vom Wappenrock blieb: vorn ein kurzer Fetzen, hinten ein schmaler
    # langer, beide schief.
    bahn('fetzen_vorn', s['tuch'], rumpf, ausschnitt(torso(-0.3, 0.29), 0.49, -0.05), -96, 40)
    bahn('fetzen_hinten', s['tuch'], rumpf, ausschnitt(torso(-0.34, 0.3), 0.49, -0.3), 84, 28)
    guertel(s, rumpf, dick=0.02, stoff='strick')
    gesicht(s, kopf, bart=False)
    # Die Augen liegen tief in dunklen Hoehlen.
    for x in (-0.04, 0.04):
        kugel('hoehle', 0.027, s['auge'], ort=(x, -0.094, 0.148), eltern=kopf, teile=8, ringe=6)
    hirnhaube(s, kopf)
    schwert(s, g['griff_r'])
    return g


# ---- Haltungen ------------------------------------------------------------------------

GRUND = {
    'rumpf': (0.02, 0, 0), 'kopf': (0, 0, 0),
    'schulter_l': (0.03, -0.14, 0), 'ellbogen_l': (-0.2, 0, 0),
    'schulter_r': (0.0, 0.14, 0), 'ellbogen_r': (-0.22, 0, 0),
    'griff_l': (0, 0, 0), 'waffe': (0.0,),
    'bein_l': (-0.03, 0.04), 'bein_r': (0.02, 0.03),     # (Huefte, Knie)
}
# Im Kampf steht das linke Bein vor.
STAND = {'bein_l': (-0.28, 0.3), 'bein_r': (0.26, 0.12)}
AUSFALL = {'bein_l': (-0.5, 0.55), 'bein_r': (0.38, 0.1)}
SCHILDARM = {'schulter_l': (-0.32, -0.22, 0), 'ellbogen_l': (-1.25, 0, -0.5)}
# Am Boden, auf dem Ruecken: die Arme zur Seite, ein Knie angezogen, die
# Waffe laengs neben dem Kopf.
LIEGT = {
    'rumpf': (0, 0, 0), 'kopf': (0.1, 0, 0.5),
    # Der linke Unterarm gedreht: so liegt ein Schild flach, den Buckel nach oben.
    'schulter_l': (0.1, -1.15, 0), 'ellbogen_l': (-0.4, 0, -math.pi / 2),
    'schulter_r': (0.1, 1.0, 0), 'ellbogen_r': (-0.5, 0, 0),
    'griff_l': (0, math.pi / 2, 0), 'waffe': (-1.45,),
    'bein_l': (-0.06, 0.12), 'bein_r': (-0.3, 0.6),
}

ARTEN = {
    'miliz': {
        'bauen': _miliz, 'schritt': 1.0, 'schwung': (0.2, 0.25),
        'trage': {**SCHILDARM, 'schulter_r': (-0.25, 0.15, 0), 'ellbogen_r': (-1.2, 0, 0), 'waffe': (-1.25,)},
        'angriff': [
            (0.0, {**STAND}),
            (0.32, {**STAND, 'schulter_r': (-2.35, 0.25, 0), 'ellbogen_r': (-1.15, 0, 0), 'waffe': (-3.1,),
                    'rumpf': (-0.05, 0, -0.28)}),
            (0.5, {**AUSFALL, 'schulter_r': (-1.0, 0.1, 0), 'ellbogen_r': (-0.3, 0, 0), 'waffe': (0.3,),
                   'rumpf': (0.28, 0, 0.3), 'schulter_l': (-0.2, -0.4, 0)}),
            (0.64, {**AUSFALL, 'schulter_r': (-0.9, 0.1, 0), 'ellbogen_r': (-0.3, 0, 0), 'waffe': (0.45,),
                    'rumpf': (0.3, 0, 0.32), 'schulter_l': (-0.2, -0.4, 0)}),
        ],
    },
    'soldat': {
        'bauen': _soldat, 'schritt': 0.95, 'schwung': (0.0, 0.0),
        # Die Axt quer vor dem Leib: die Rechte unten am Stiel, die Linke darueber.
        'trage': {'schulter_r': (-0.2, 0.1, 0), 'ellbogen_r': (-0.9, 0, 0.6), 'waffe': (-1.2,),
                  'schulter_l': (-0.9, -0.05, 0), 'ellbogen_l': (-1.3, 0, -0.9)},
        'angriff': [
            (0.0, {**STAND}),
            (0.34, {**STAND, 'schulter_r': (-2.6, 0.1, 0), 'ellbogen_r': (-1.1, 0, 0.4), 'waffe': (-3.35,),
                    'schulter_l': (-2.7, -0.1, 0), 'ellbogen_l': (-1.0, 0, -0.4), 'rumpf': (-0.16, 0, 0)}),
            (0.5, {**AUSFALL, 'schulter_r': (-0.9, 0.1, 0), 'ellbogen_r': (-0.5, 0, 0.5), 'waffe': (0.5,),
                   'schulter_l': (-1.1, -0.1, 0), 'ellbogen_l': (-0.4, 0, -0.5), 'rumpf': (0.42, 0, 0)}),
            (0.66, {**AUSFALL, 'schulter_r': (-0.8, 0.1, 0), 'ellbogen_r': (-0.5, 0, 0.5), 'waffe': (0.62,),
                    'schulter_l': (-1.0, -0.1, 0), 'ellbogen_l': (-0.4, 0, -0.5), 'rumpf': (0.45, 0, 0)}),
        ],
    },
    'speerkaempfer': {
        'bauen': _speerkaempfer, 'schritt': 1.0, 'schwung': (0.2, 0.0),
        # Der Speer steht: der Schuh knapp ueber dem Boden, die Spitze weit ueber dem Kopf.
        'trage': {**SCHILDARM, 'schulter_r': (-0.15, 0.2, 0), 'ellbogen_r': (-0.6, 0, 0), 'waffe': (-1.52,)},
        # Im Kampf liegt er eingelegt unter dem Arm und stoesst von dort.
        'angriff': [
            (0.0, {**STAND, 'schulter_r': (0.35, 0.25, 0), 'ellbogen_r': (-1.85, 0, 0), 'waffe': (0.04,),
                   'rumpf': (0.1, 0, -0.35)}),
            (0.3, {**STAND, 'schulter_r': (0.62, 0.3, 0), 'ellbogen_r': (-2.0, 0, 0), 'waffe': (0.0,),
                   'rumpf': (0.02, 0, -0.5)}),
            (0.5, {**AUSFALL, 'schulter_r': (-1.15, 0.1, 0), 'ellbogen_r': (-0.35, 0, 0), 'waffe': (0.08,),
                   'rumpf': (0.3, 0, 0.35)}),
            (0.62, {**AUSFALL, 'schulter_r': (-1.15, 0.1, 0), 'ellbogen_r': (-0.35, 0, 0), 'waffe': (0.1,),
                    'rumpf': (0.3, 0, 0.35)}),
        ],
    },
    'bogenschuetze': {
        'bauen': _bogenschuetze, 'schritt': 1.0, 'schwung': (0.25, 1.0),
        # Der Bogen haengt in der Linken, die Wurfarme auf und ab.
        'trage': {'schulter_l': (-0.2, -0.18, 0), 'ellbogen_l': (-0.45, 0, 0), 'griff_l': (0.35, math.pi / 2, 0)},
        # Er steht seitlich: die linke Schulter zum Ziel, der Kopf dorthin gedreht.
        'immer': {'rumpf': (0.0, 0, -1.15), 'kopf': (0, 0, 1.0), 'schulter_l': (0, -1.5, 0),
                  'ellbogen_l': (-0.08, 0, 0), 'griff_l': (0, 0, 0), 'bein_l': (-0.2, 0.1), 'bein_r': (0.2, 0.1)},
        'angriff': [
            (0.0, {'schulter_r': (-2.9, 0.2, 0), 'ellbogen_r': (-2.3, 0, 0)}),       # die Hand am Koecher
            (0.2, {'schulter_r': (-1.5, 0, 1.0), 'ellbogen_r': (-0.4, 0, 0.3)}),     # der Pfeil an der Sehne
            (0.45, {'schulter_r': (-0.1, 1.45, 0), 'ellbogen_r': (-2.4, 0, 0)}),     # ausgezogen
            (0.52, {'schulter_r': (-0.05, 1.48, 0), 'ellbogen_r': (-2.3, 0, 0)}),    # geloest
            (0.7, {'schulter_r': (0.1, 1.5, 0), 'ellbogen_r': (-1.8, 0, 0)}),
        ],
    },
    'plaenkler': {
        'bauen': _plaenkler, 'schritt': 1.1, 'schwung': (0.2, 0.15),
        'trage': {**SCHILDARM, 'schulter_r': (-0.2, 0.15, 0), 'ellbogen_r': (-1.2, 0, 0), 'waffe': (-0.45,)},
        'angriff': [
            (0.0, {**STAND}),
            (0.3, {**STAND, 'schulter_r': (-2.6, 0.5, 0), 'ellbogen_r': (-1.4, 0, 0), 'waffe': (-0.3,),
                   'rumpf': (-0.15, 0, -0.4)}),
            (0.5, {**AUSFALL, 'schulter_r': (-1.3, 0.2, 0), 'ellbogen_r': (-0.3, 0, 0), 'waffe': (0.05,),
                   'rumpf': (0.3, 0, 0.35)}),
            (0.64, {**AUSFALL, 'schulter_r': (-0.7, 0.2, 0), 'ellbogen_r': (-0.3, 0, 0), 'waffe': (0.3,),
                    'rumpf': (0.34, 0, 0.4)}),
        ],
    },
    'armbrustschuetze': {
        'bauen': _armbrustschuetze, 'schritt': 0.95, 'schwung': (0.0, 0.0),
        # Die Armbrust gesenkt vor dem Leib, die Linke unter dem Schaft.
        # Zum Schuss hebt er sie an die Wange.
        'trage': {'schulter_r': (-0.2, 0.15, 0), 'ellbogen_r': (-1.1, 0, 0.5), 'waffe': (0.5,),
                  'schulter_l': (-0.7, -0.05, 0), 'ellbogen_l': (-0.9, 0, -0.7)},
        'angriff': [
            (0.0, {**STAND, 'rumpf': (0.1, 0, -0.3)}),
            # Gehoben, noch nicht angelegt: die Spitze zeigt abwaerts.
            (0.26, {**STAND, 'schulter_r': (-0.8, 0.3, 0), 'ellbogen_r': (-1.6, 0, 0.5), 'waffe': (0.22,),
                    'schulter_l': (-1.25, 0, 0), 'ellbogen_l': (-0.4, 0, -0.5), 'rumpf': (0.08, 0, -0.2),
                    'kopf': (0.0, 0, 0.15)}),
            # Angelegt, die Wange am Schaft.
            (0.48, {**STAND, 'schulter_r': (-0.95, 0.3, 0), 'ellbogen_r': (-1.75, 0, 0.5), 'waffe': (0.0,),
                    'schulter_l': (-1.45, 0, 0), 'ellbogen_l': (-0.3, 0, -0.5), 'rumpf': (0.05, 0, -0.35),
                    'kopf': (0.1, 0, 0.25)}),
            # Der Schuss: ein Ruck nach hinten.
            (0.56, {**STAND, 'schulter_r': (-0.85, 0.3, 0), 'ellbogen_r': (-1.85, 0, 0.5), 'waffe': (-0.26,),
                    'schulter_l': (-1.35, 0, 0), 'ellbogen_l': (-0.4, 0, -0.5), 'rumpf': (-0.1, 0, -0.35),
                    'kopf': (0.0, 0, 0.25)}),
            # Abgesetzt.
            (0.74, {**STAND, 'schulter_r': (-0.6, 0.25, 0), 'ellbogen_r': (-1.5, 0, 0.5), 'waffe': (0.25,),
                    'schulter_l': (-1.1, -0.02, 0), 'ellbogen_l': (-0.6, 0, -0.6), 'rumpf': (0.08, 0, -0.32),
                    'kopf': (0.05, 0, 0.1)}),
        ],
    },
    # Die Stufen des Fuerstentums. Bewegt wird jede wie ihre Vorstufe - nur der
    # Pikenier fuehrt die Pike in beiden Haenden - und unten nachgetragen.
    'moench': {
        'bauen': _moench, 'schritt': 0.42, 'schwung': (0.0, 0.8), 'stab': 0.2,
        # Der Stab steht neben ihm, die Linke liegt am Strick.
        'trage': {'schulter_r': (-0.45, 0.15, 0), 'ellbogen_r': (-0.9, 0, 0), 'waffe': (-1.53,),
                  'schulter_l': (-0.15, -0.1, 0), 'ellbogen_l': (-1.0, 0, -0.55)},
        # Heilen und Bekehren: der Stab hebt sich, die Linke geht hoch und
        # schlaegt das Zeichen. Vier Stationen, damit Hin- und Rueckweg nicht
        # dieselben Bilder sind.
        'angriff': [
            (0.0, {}),
            (0.25, {'schulter_r': (-1.3, 0.25, 0), 'ellbogen_r': (-0.8, 0, 0), 'waffe': (-1.4,),
                    'rumpf': (-0.04, 0, 0), 'kopf': (-0.1, 0, 0)}),
            (0.5, {'schulter_r': (-1.5, 0.25, 0), 'ellbogen_r': (-0.6, 0, 0), 'waffe': (-1.15,),
                   'schulter_l': (-2.2, -0.4, 0), 'ellbogen_l': (-0.5, 0, 0), 'rumpf': (-0.06, 0, 0),
                   'kopf': (-0.25, 0, 0)}),
            (0.75, {'schulter_r': (-1.5, 0.25, 0), 'ellbogen_r': (-0.6, 0, 0), 'waffe': (-1.3,),
                    'schulter_l': (-1.3, -0.2, 0), 'ellbogen_l': (-0.3, 0, 0), 'rumpf': (0.08, 0, 0),
                    'kopf': (0.05, 0, 0)}),
        ],
    },
}


ARTEN['bogenschuetze2'] = {**ARTEN['bogenschuetze'], 'bauen': _bogenschuetze2}
ARTEN['langschwertkaempfer'] = {**ARTEN['miliz'], 'bauen': _langschwertkaempfer, 'schritt': 0.95}
ARTEN['eliteplaenkler'] = {**ARTEN['plaenkler'], 'bauen': _eliteplaenkler}
ARTEN['pikenier'] = {
    'bauen': _pikenier, 'schritt': 0.95, 'schwung': (0.0, 0.0),
    # Die Pike steht: die Rechte unten am Schaft, die Linke darueber.
    'trage': {'schulter_r': (-0.15, 0.2, 0), 'ellbogen_r': (-0.6, 0, 0), 'waffe': (-1.5,),
              'schulter_l': (-1.0, 0.3, 0), 'ellbogen_l': (-1.2, 0, -0.9)},
    # Gefaellt in beiden Haenden, dann der Stoss aus dem ganzen Leib.
    'angriff': [
        (0.0, {**STAND, 'schulter_r': (0.4, 0.25, 0), 'ellbogen_r': (-1.7, 0, 0), 'waffe': (0.02,),
               'schulter_l': (-0.9, 0.1, 0), 'ellbogen_l': (-0.6, 0, -0.5), 'rumpf': (0.1, 0, -0.4)}),
        (0.3, {**STAND, 'schulter_r': (0.7, 0.3, 0), 'ellbogen_r': (-1.9, 0, 0), 'waffe': (-0.03,),
               'schulter_l': (-0.6, 0.1, 0), 'ellbogen_l': (-1.0, 0, -0.5), 'rumpf': (0.0, 0, -0.55)}),
        (0.5, {**AUSFALL, 'schulter_r': (-1.0, 0.1, 0), 'ellbogen_r': (-0.4, 0, 0), 'waffe': (0.07,),
               'schulter_l': (-1.3, 0.1, 0), 'ellbogen_l': (-0.2, 0, -0.4), 'rumpf': (0.32, 0, 0.3)}),
        (0.62, {**AUSFALL, 'schulter_r': (-1.0, 0.1, 0), 'ellbogen_r': (-0.4, 0, 0), 'waffe': (0.09,),
                'schulter_l': (-1.3, 0.1, 0), 'ellbogen_l': (-0.2, 0, -0.4), 'rumpf': (0.32, 0, 0.3)}),
    ],
    # Die Pike ragt weit ueber den Kopf und im Stoss weit nach vorn.
    'zelle': (400, 288), 'fuss': (176, 216),
}

# Die Eigenen der Haeuser. Geschnitten wird jede Tafel knapp um das, was im
# Bild steht - eine grosse Zelle kostet deshalb nichts.
ARTEN['eibenschuetze'] = {**ARTEN['bogenschuetze'], 'bauen': _eibenschuetze, 'zelle': (336, 256), 'fuss': (150, 190)}
ARTEN['pavesenschuetze'] = {**ARTEN['armbrustschuetze'], 'bauen': _pavesenschuetze, 'schritt': 0.85}
ARTEN['soeldner'] = {**ARTEN['miliz'], 'bauen': _soeldner}
# Der Riese schlaegt wie der Soldat mit beiden Haenden, nur langsamer - und er
# ist derselbe Gliedermann, anderthalbmal so gross (`mass`).
ARTEN['riese'] = {**ARTEN['soldat'], 'bauen': _riese, 'schritt': 0.8, 'mass': 1.45,
                  'zelle': (520, 400), 'fuss': (260, 300)}
ARTEN['meuchler'] = {
    'bauen': _meuchler, 'schritt': 1.15, 'schwung': (0.3, 0.3),
    # Geduckt, beide Dolche vor dem Leib.
    'trage': {'rumpf': (0.2, 0, 0), 'kopf': (-0.12, 0, 0),
              'schulter_r': (-0.3, 0.2, 0), 'ellbogen_r': (-1.1, 0, 0), 'waffe': (-0.2,),
              'schulter_l': (-0.3, -0.2, 0), 'ellbogen_l': (-1.1, 0, 0), 'griff_l': (1.0, 0, 0)},
    # Der Stich von oben mit der Rechten, die Klinge nach unten; die Linke deckt.
    'angriff': [
        (0.0, {**STAND}),
        (0.3, {**STAND, 'schulter_r': (-2.3, 0.3, 0), 'ellbogen_r': (-1.3, 0, 0), 'waffe': (1.1,),
               'rumpf': (0.0, 0, -0.35)}),
        (0.5, {**AUSFALL, 'schulter_r': (-1.1, 0.1, 0), 'ellbogen_r': (-0.4, 0, 0), 'waffe': (0.9,),
               'rumpf': (0.4, 0, 0.35), 'schulter_l': (-0.9, -0.3, 0)}),
        (0.64, {**AUSFALL, 'schulter_r': (-1.0, 0.1, 0), 'ellbogen_r': (-0.4, 0, 0), 'waffe': (1.0,),
                'rumpf': (0.42, 0, 0.38), 'schulter_l': (-0.9, -0.3, 0)}),
    ],
}
ARTEN['wiedergaenger'] = {
    'bauen': _wiedergaenger, 'schritt': 0.6, 'schwung': (0.0, 0.5),
    # Gebeugt, der Kopf schief, die Linke tastet voraus, das Schwert schleift nach.
    'trage': {'rumpf': (0.32, 0, 0), 'kopf': (-0.15, 0.2, 0.25),
              'schulter_l': (-1.2, -0.1, 0), 'ellbogen_l': (-0.3, 0, 0),
              'schulter_r': (0.1, 0.18, 0), 'ellbogen_r': (-0.25, 0, 0), 'waffe': (1.0,)},
    # Ein weiter, schwerer Hieb aus der Schulter - er faellt dem Schwert hinterher.
    'angriff': [
        (0.0, {**STAND}),
        (0.34, {**STAND, 'schulter_r': (-2.5, 0.3, 0), 'ellbogen_r': (-0.9, 0, 0), 'waffe': (-2.9,),
                'rumpf': (0.05, 0, -0.3)}),
        (0.5, {**AUSFALL, 'schulter_r': (-0.9, 0.1, 0), 'ellbogen_r': (-0.2, 0, 0), 'waffe': (0.5,),
               'rumpf': (0.5, 0, 0.3)}),
        (0.66, {**AUSFALL, 'schulter_r': (-0.8, 0.1, 0), 'ellbogen_r': (-0.2, 0, 0), 'waffe': (0.65,),
                'rumpf': (0.52, 0, 0.3)}),
    ],
}

# Die Stufen der Krone. Beide schlagen wie der Soldat mit beiden Haenden von
# oben - getragen wird anders: die langen Waffen ragen weit ueber den Kopf
# und im Hieb weit nach vorn, deshalb die grossen Zellen.
ARTEN['zweihandkaempfer'] = {
    'bauen': _zweihandkaempfer, 'schritt': 0.95, 'schwung': (0.25, 0.0),
    # Das Schwert liegt auf der rechten Schulter, die Spitze nach hinten
    # oben; die Linke geht frei mit.
    'trage': {'schulter_r': (-0.5, 0.15, 0), 'ellbogen_r': (-1.6, 0, 0), 'waffe': (-2.6,)},
    'angriff': ARTEN['soldat']['angriff'],
    'zelle': (432, 368), 'fuss': (192, 290),
}
ARTEN['hellebardier'] = {
    'bauen': _hellebardier, 'schritt': 0.92, 'schwung': (0.22, 0.0),
    # Die Hellebarde lehnt an der rechten Schulter, der Schuh knapp ueber
    # dem Boden; die Linke geht frei mit.
    'trage': {'schulter_r': (-0.15, 0.2, 0), 'ellbogen_r': (-0.6, 0, 0), 'waffe': (-1.95,)},
    'angriff': ARTEN['soldat']['angriff'],
    'zelle': (432, 368), 'fuss': (192, 290),
}


# Die Schuetzen der Krone (einheiten AC-67): bewegt wie ihre Vorstufen. Der
# Bogen ist fast mannshoch und die Armbrust breit - beide brauchen die grosse Zelle.
ARTEN['langbogenschuetze'] = {**ARTEN['bogenschuetze'], 'bauen': _langbogenschuetze, 'zelle': (336, 256),
                              'fuss': (150, 190)}
ARTEN['schwerearmbrust'] = {**ARTEN['armbrustschuetze'], 'bauen': _schwerearmbrust, 'schritt': 0.9,
                            'zelle': (336, 256), 'fuss': (150, 190)}


def bauen(art):
    g = ARTEN[art]['bauen'](stoffe())
    mass = GROESSE * ARTEN[art].get('mass', 1.0)
    g['figur'].scale = (mass, mass, mass)
    return g


def _glatt(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def _mischen(a, b, u):
    return {name: tuple(x + (y - x) * u for x, y in zip(a[name], b[name])) for name in a}


def _voll(art, stueck=None):
    haltung = dict(GRUND)
    haltung.update(ARTEN[art]['trage'])
    if stueck is not None:
        haltung.update(ARTEN[art].get('immer', {}))
        haltung.update(stueck)
    return haltung


def _angriff(art, t):
    """Die Haltung im Angriff: zwischen den Stationen weich, am Ende wieder die erste."""
    stationen = [(wann, _voll(art, stueck)) for wann, stueck in ARTEN[art]['angriff']]
    stationen.append((1.0, stationen[0][1]))
    for (t0, a), (t1, b) in zip(stationen, stationen[1:]):
        if t <= t1:
            return _mischen(a, b, _glatt((t - t0) / (t1 - t0)))
    return stationen[-1][1]


def zwischen(ding, von, nach, mass=GROESSE):
    """Legt ein freies Ding an die Stelle von `von`, seine Achse -Y auf `nach` zu."""
    bpy.context.view_layer.update()
    a = von.matrix_world.translation.copy()
    richtung = nach.matrix_world.translation - a
    if richtung.length < 1e-5:
        return
    ding.matrix_world = Matrix.LocRotScale(a, richtung.to_track_quat('-Y', 'Z'), (mass, mass, mass))


def stellen(g, art, ablauf, t=0.0):
    """Bringt die Figur in ein Bild eines Ablaufs; t laeuft von 0 bis 1."""
    k = ARTEN[art]
    p = 2 * math.pi * t
    haltung = _voll(art)
    kippen, versatz = 0.0, 0.0
    if ablauf == 'gehen':
        for seite, phase in (('l', 0.0), ('r', math.pi)):
            q = p + phase
            haltung['bein_' + seite] = (k['schritt'] * (-0.44 * math.sin(q)) + 0.04,
                                        k['schritt'] * 0.85 * max(0.0, math.cos(q)) ** 1.3 + 0.08)
        links, rechts = k['schwung']
        sl, sr, r, kopf = haltung['schulter_l'], haltung['schulter_r'], haltung['rumpf'], haltung['kopf']
        haltung['schulter_l'] = (sl[0] + links * 0.42 * math.sin(p), sl[1], sl[2])
        haltung['schulter_r'] = (sr[0] - rechts * 0.24 * math.sin(p), sr[1], sr[2])
        dreh = 0.09 * k['schritt'] * math.sin(p)
        haltung['rumpf'] = (r[0] + 0.05, r[1], r[2] + dreh)
        haltung['kopf'] = (kopf[0] - 0.04, kopf[1], kopf[2] - dreh * 0.7)
        if 'stab' in k:
            # Der Stab wird einmal je Doppelschritt vorgesetzt. Unter der Kutte
            # sieht man die Beine nicht - ohne ihn waeren der linke und der
            # rechte Schritt dasselbe Bild.
            haltung['waffe'] = (haltung['waffe'][0] + k['stab'] * math.cos(p),)
    elif ablauf == 'angreifen':
        haltung = _angriff(art, t)
    elif ablauf == 'sterben':
        # Getroffen knickt er ein, kippt nach hinten und bleibt auf dem Ruecken liegen.
        # Der Fall reicht bis zum letzten Bild: ein Bild, in dem er schon
        # liegt, stuende sonst doppelt auf der Tafel. Das Spielbild spielt ihn in
        # STERBEN_MS ab (ansicht.js), danach bleibt das letzte Bild liegen.
        liegen = _glatt((t - 0.1) / 0.9)
        knick = math.sin(math.pi * min(1.0, t / 0.7))
        haltung = _mischen(haltung, {**_voll(art), **LIEGT, **k.get('liegt', {})}, liegen)
        for seite in ('l', 'r'):
            huefte, knie = haltung['bein_' + seite]
            haltung['bein_' + seite] = (huefte - 0.45 * knick, knie + 1.0 * knick)
        r = haltung['rumpf']
        haltung['rumpf'] = (r[0] - 0.3 * knick, r[1], r[2])
        kippen = -math.pi / 2 * liegen
        versatz = -0.4 * liegen

    for name in ('rumpf', 'kopf', 'schulter_l', 'ellbogen_l', 'schulter_r', 'ellbogen_r', 'griff_l'):
        g[name].rotation_euler = haltung[name]
    # Der Griff der Rechten aus der Neigung der Waffe: was Rumpf, Schulter und
    # Ellbogen schon gekippt haben, zieht er ab.
    g['griff_r'].rotation_euler = (haltung['waffe'][0] - haltung['rumpf'][0] - haltung['schulter_r'][0]
                                   - haltung['ellbogen_r'][0], 0, 0)
    # Das Becken steht so hoch, dass das tiefere Bein den Boden beruehrt.
    tiefe = 0.0
    for seite, z in (('l', 1), ('r', -1)):
        huefte, knie = haltung['bein_' + seite]
        g['huefte_' + seite].rotation_euler = (huefte, -z * 0.05, 0)
        g['knie_' + seite].rotation_euler = (knie, 0, 0)
        g['knoechel_' + seite].rotation_euler = (-(huefte + knie) * 0.75, 0, 0)
        tiefe = max(tiefe, OBERSCHENKEL * math.cos(huefte) + UNTERSCHENKEL * math.cos(huefte + knie))
    g['becken'].location.z = HUEFTE_TIEFER + tiefe + KNOECHEL
    g['koerper'].rotation_euler = (kippen, 0, 0)
    g['koerper'].location = (0, versatz, 0)
    if ablauf == 'sterben':
        aufsetzen(g['koerper'], g['koerper'])

    # Was nicht an einem Gelenk haengt: Sehne und Pfeil des Bogens, der
    # geworfene Spiess.
    if 'sehne' in g:
        bpy.context.view_layer.update()
        gespannt = ablauf == 'angreifen' and 0.19 <= t <= 0.47
        mitte = g['sehne'].data.splines[0].points[1]
        if gespannt:
            ort = g['bogen'].matrix_world.inverted() @ g['griff_r'].matrix_world.translation
            mitte.co = (ort.x, ort.y, ort.z, 1)
        else:
            mitte.co = (0, 0, 0.2, 1)
        # Der Pfeil liegt auf, sobald die Hand vom Koecher kommt, und ist mit dem Loesen fort.
        if ablauf == 'angreifen' and 0.1 <= t <= 0.47:
            zwischen(g['pfeil'], g['griff_r'], g['griff_l'])
        else:
            g['pfeil'].scale = WEG
    if 'spiess' in g:
        # Geworfen ist die Hand leer, bis sie den naechsten Spiess hat.
        fort = ablauf == 'angreifen' and 0.5 <= t < 0.82
        g['spiess'].scale = WEG if fort else (1, 1, 1)


def tafel(ziel, art):
    szene_leeren()
    g = bauen(art)
    blatt = Tafel(art, zelle=ARTEN[art].get('zelle', ZELLE), fuss=ARTEN[art].get('fuss', FUSS), ziel=ziel, knapp=True)
    # Zum Ansehen beim Bauen: '1' drei Richtungen und vier Bilder je Ablauf,
    # '2' eine Richtung mit allen Bildern.
    probe = os.environ.get('BILDER_PROBE')
    richtungen = {'1': [1, 3, 6], '2': [1]}.get(probe, list(range(RICHTUNGEN)))
    bilder = [0, 3, 4, 7] if probe == '1' else list(range(BILDER))
    for zeile, richtung in enumerate(richtungen):
        g['figur'].rotation_euler = (0, 0, math.radians(45 + 45 * richtung))
        stellen(g, art, 'stehen')
        blatt.bild(zeile, 0)
        for spalte, bild in enumerate(bilder):
            stellen(g, art, 'gehen', bild / BILDER)
            blatt.bild(zeile, 1 + spalte)
        for spalte, bild in enumerate(bilder):
            stellen(g, art, 'angreifen', bild / BILDER)
            blatt.bild(zeile, spalte, teil='angreifen')
        for spalte, bild in enumerate(bilder):
            # Sterben laeuft einmal: das letzte Bild ist das Ende.
            stellen(g, art, 'sterben', bild / (BILDER - 1))
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
