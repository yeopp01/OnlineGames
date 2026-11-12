# Bauteile: woraus die Gebaeude gesetzt sind (ADR-0016, Schritt R4).
#
# Das Haus (haus.py) war das Muster; hier steht, was sich daran wiederholt -
# Waende mit Fachwerk, Daecher in Lagen, Tueren, Fenster, Zinnen, Fahnen und
# das, was vor einem Gebaeude liegt. Ein Gebaeude ist danach ein kurzes Skript,
# das diese Teile setzt.
#
# Die Grundflaeche aus n mal n Feldern liegt um (0, 0, 0), von -n/2 bis n/2.
# Im Bild sieht man die Seiten -Y (links, im Licht) und +X (rechts, im eigenen
# Schatten); die naechste Ecke ist (+X, -Y). Was man erkennen soll, steht
# deshalb an diesen beiden Seiten oder oben.

import math
import random

from mathutils import Vector

from formen import drehkoerper, kugel, leer, netz, prisma, quader
from kette import Tafel, kamera_setzen, szene_leeren
from stoffe import aus_merkmal, einfarbig, feldstein, gefugt, gemustert, glut
from stoffe import farbe as linear

# Wohin eine Wand schaut: der Winkel ihres Rahmens.
VORN = 0.0                 # nach -Y, links im Bild
RECHTS = math.pi / 2       # nach +X, rechts im Bild
HINTEN = math.pi           # nach +Y
LINKS = -math.pi / 2       # nach -X

# Zur Kamera hin und quer zu ihr, am Boden.
ZUR_KAMERA = Vector((1, -1, 0)).normalized()
QUER = Vector((1, 1, 0)).normalized()       # im Bild nach rechts


def stoffe():
    """Die Oberflaechen, aus denen alle Gebaeude sind - eine Palette, damit
    ein Dorf zusammenpasst."""
    return {
        'putz': gemustert('putz', ('#b9a988', '#d6c9a8', '#e2d7ba'), groesse=5, detail=8, relief=0.35, fugen=0.75),
        'kalk': gemustert('kalk', ('#c9c0a8', '#ddd5bf', '#ebe5d2'), groesse=4, detail=8, relief=0.3, fugen=0.7),
        'balken': gemustert('balken', ('#3d2a1b', '#5c4028', '#73522f'), massstab=(6, 6, 6), groesse=3,
                            detail=5, relief=0.6, fugen=0.6),
        'brett': gemustert('brett', ('#4f3924', '#6f5033', '#86633f'), massstab=(8, 8, 1.2), groesse=3,
                           detail=4, relief=0.7, fugen=0.7),
        # Bretter, die liegen: die Maserung laeuft laengs X.
        'bohle': gemustert('bohle', ('#5a4229', '#7a5a38', '#927048'), massstab=(1.2, 9, 9), groesse=3,
                           detail=4, relief=0.7, fugen=0.7),
        'hellholz': gemustert('hellholz', ('#8a6a44', '#a98556', '#c2a06e'), massstab=(5, 5, 5), groesse=3,
                              detail=4, relief=0.5, fugen=0.6),
        'scheit': gemustert('scheit', ('#7a5a38', '#a07a4c', '#c09a66'), massstab=(3, 3, 9), groesse=4,
                            relief=0.5, fugen=0.6),
        'rinde': gemustert('rinde', ('#3a2c1e', '#54402b', '#6a5238'), massstab=(9, 9, 2), groesse=4,
                           detail=5, relief=0.9, fugen=0.5),
        'stroh': gemustert('stroh', ('#6f5f3e', '#96824f', '#b3a06c'), massstab=(5, 0.5, 1), groesse=1,
                           detail=3, relief=1.0, fugen=0.55, koordinaten='UV', kontrast=(0.25, 0.75)),
        'heu': gemustert('heu', ('#8a7a42', '#b09c58', '#c9b672'), groesse=14, detail=4, relief=0.9, fugen=0.5),
        'ziegel': gefugt('ziegel', ('#7b4433', '#96573c'), stein=(1.0, 1.0), fuge=0.09, fugenfarbe='#3f241a',
                         koordinaten='UV', relief=0.8, toenung=0.22, rau=0.8),
        'schindel': gefugt('schindel', ('#5c4a36', '#7b6548'), stein=(1.0, 1.0), fuge=0.08, fugenfarbe='#2f251a',
                           koordinaten='UV', relief=0.8, toenung=0.25, rau=0.95),
        'schiefer': gefugt('schiefer', ('#474c55', '#5d636e'), stein=(1.0, 1.0), fuge=0.07, fugenfarbe='#26292e',
                           koordinaten='UV', relief=0.7, toenung=0.18, rau=0.6),
        'stein': feldstein('stein'),
        'haustein': gefugt('haustein', ('#8d877b', '#aaa497'), stein=(0.26, 0.125), fuge=0.012, relief=0.8),
        'hellstein': gefugt('hellstein', ('#b3aa96', '#cbc3b0'), stein=(0.3, 0.14), fuge=0.01, fugenfarbe='#6f6858',
                            relief=0.6, toenung=0.12),
        'pflaster': feldstein('pflaster', farben=('#857f73', '#a09a8c', '#6a655c'), groesse=13.0),
        'erde': gemustert('erde', ('#4a3a26', '#65503a', '#7a6448'), groesse=9, detail=6, relief=0.8, fugen=0.3,
                          rau=0.95),
        'sand': gemustert('sand', ('#a08a60', '#b9a478', '#c9b68c'), groesse=12, detail=6, relief=0.5, fugen=0.2,
                          rau=0.95),
        'eisen': einfarbig('eisen', '#4a4a4c', rau=0.45, metall=0.9),
        'dunkel': einfarbig('dunkel', '#15110d', rau=1.0),
        'russ': gemustert('russ', ('#2a2622', '#3d3832', '#4a443c'), groesse=8, relief=0.5, fugen=0.5),
        'leinen': gemustert('leinen', ('#8a7f64', '#a59a7d', '#b9ae92'), groesse=40, detail=2, relief=0.3, rau=0.9),
        'kupfer': gemustert('kupfer', ('#4f7f6a', '#6b9d84', '#86b39a'), groesse=6, detail=6, relief=0.3, rau=0.55,
                            fugen=0.4),
        'seil': gemustert('seil', ('#7a6a48', '#9a8860'), groesse=30, relief=0.6),
        'glut': glut('glut'),
        'tuch': gemustert('tuch', ('#8a8a8a', '#c2c2c2'), groesse=60, detail=2, relief=0.25, rau=0.9,
                          spieler=True),
    }


# ---- Platz im Bild -----------------------------------------------------------

def platz(felder, hoehe, schatten=None):
    """Zelle und Fusspunkt fuer ein Gebaeude auf `felder` mal `felder` Feldern,
    das `hoehe` Felder hoch ist. Grosszuegig - geschrieben wird knapp."""
    halb = felder * 66
    links = halb + 24
    rechts = halb + 24 + round(76 * (hoehe if schatten is None else schatten))
    oben = felder * 33 + round(82 * hoehe) + 20
    unten = felder * 33 + 24
    return (links + rechts, oben + unten), (links, oben)


def einzeltafel(name, felder, hoehe, ziel, bauen, **angaben):
    """Ein Gebaeude, ein Bild - in der Form des Hauses."""
    szene_leeren()
    bauen()
    zelle, fuss = platz(felder, hoehe)
    blatt = Tafel(name, zelle=zelle, fuss=fuss, ziel=ziel, knapp=True)
    blatt.bild(0, 0)
    return blatt.schreiben({'art': 'gebaeude', 'felder': felder, **angaben})


# ---- Grundlagen --------------------------------------------------------------

def rahmen(ort, winkel=0.0, eltern=None):
    """Der Rahmen einer Wand: sein X laeuft die Wand entlang, -Y zeigt nach
    aussen, Z nach oben. Was daran haengt, wird in diesen Massen gesetzt."""
    g = leer('rahmen', ort=ort, eltern=eltern)
    g.rotation_euler = (0, 0, winkel)
    return g


def balken(name, von, bis, dicke, stoff, eltern=None, breit=None, fase=0.008):
    """Ein Kantholz von Punkt zu Punkt."""
    a, b = Vector(von), Vector(bis)
    lang = (b - a).length
    drehung = (b - a).to_track_quat('X', 'Z').to_euler()
    return quader(name, (lang, breit or dicke, dicke), stoff, ort=tuple((a + b) / 2), drehung=tuple(drehung),
                  eltern=eltern, fase=fase)


def rundholz(name, von, bis, halbmesser, stoff, eltern=None, teile=10, spitz=1.0):
    """Eine Stange, ein Stamm von Punkt zu Punkt. `spitz` < 1 verjuengt ihn."""
    a, b = Vector(von), Vector(bis)
    lang = (b - a).length
    drehung = (b - a).to_track_quat('Z', 'Y').to_euler()
    return drehkoerper(name, [(0, 0), (0, halbmesser), (lang, halbmesser * spitz), (lang, 0)], stoff,
                       ort=tuple(a), drehung=tuple(drehung), eltern=eltern, teile=teile)


def bodenfleck(name, mitte, laenge, breite, stoff, zufall, hoch=0.02, rund=0.35, zacken=0.04):
    """Ein Stueck anderer Boden unter einem Gebaeude: gestampfte Erde, Sand,
    Pflaster. Der Rand ist unregelmaessig, in der Mitte woelbt er sich kaum."""
    n = 40
    ecken = [(mitte[0], mitte[1], hoch)]
    for i in range(n):
        w = 2 * math.pi * i / n
        c, s = math.cos(w), math.sin(w)
        # Ein Rechteck mit runden Ecken: zwischen Kreis und Kasten.
        kasten = 1 / max(abs(c), abs(s))
        r = 1 + (kasten - 1) * (1 - rund)
        r *= 1 + zufall.uniform(-zacken, zacken)
        ecken.append((mitte[0] + c * r * laenge / 2, mitte[1] + s * r * breite / 2, 0.0))
    for i in range(n):
        w = 2 * math.pi * i / n
        c, s = math.cos(w), math.sin(w)
        kasten = 1 / max(abs(c), abs(s))
        r = (1 + (kasten - 1) * (1 - rund)) * 0.9
        ecken.append((mitte[0] + c * r * laenge / 2, mitte[1] + s * r * breite / 2, hoch))
    seiten = []
    for i in range(n):
        j = (i + 1) % n
        seiten.append((1 + i, 1 + j, 1 + n + j, 1 + n + i))
        seiten.append((0, 1 + n + i, 1 + n + j))
    return netz(name, ecken, seiten, stoff, glatt=True)


# ---- Daecher -----------------------------------------------------------------

def dachflaeche(name, traufe_a, traufe_b, first_b, first_a, stoff, lagen=8, stufe=0.022, dicke=0.05,
                ziegel=0.11, zufall=None, franse=0.0, glatt=False):
    """Eine Dachflaeche in Lagen, von der Traufe (a nach b) zum First.

    Jede Lage ist ein eigener Streifen, dessen untere Kante um `stufe` ueber
    der Lage darunter liegt - so wirft jede Reihe Ziegel ihren Schatten. Fallen
    die beiden Firstpunkte zusammen, wird es ein Dreieck (Walm, Zeltdach).
    Das Netz nennt je Lage eine Reihe und je `ziegel` Breite einen Stein.
    """
    ta, tb, fa, fb = Vector(traufe_a), Vector(traufe_b), Vector(first_a), Vector(first_b)
    n = (tb - ta).cross(fa - ta).normalized()
    gedreht = n.z < 0
    if gedreht:
        n = -n
    laengs = (tb - ta).normalized()
    hang = (fa - ta) - laengs * (fa - ta).dot(laengs)
    hang.normalize()
    spalten = max(2, round((tb - ta).length / 0.2))
    ecken, uv, seiten = [], [], []
    for lage in range(lagen):
        t0, t1 = lage / lagen, (lage + 1) / lagen
        anfang = len(ecken)
        for i in range(spalten + 1):
            u = i / spalten
            fuss, spitze = ta.lerp(tb, u), fa.lerp(fb, u)
            unten = fuss.lerp(spitze, t0)
            oben = fuss.lerp(spitze, t1)
            heben = stufe * (1 + (zufall.uniform(-0.25, 0.25) if zufall else 0))
            zupf = zufall.uniform(-franse, franse) if (zufall and franse) else 0.0
            unten = unten + n * heben - hang * zupf
            ecken.append(tuple(unten))
            ecken.append(tuple(oben))
            quer = (unten - ta).dot(laengs) / ziegel
            uv.append((quer, lage + 0.02))
            uv.append((quer, lage + 0.98))
        for i in range(spalten):
            a = anfang + 2 * i
            viereck = (a, a + 2, a + 3, a + 1)
            seiten.append(viereck[::-1] if gedreht else viereck)
    return netz(name, ecken, seiten, stoff, glatt=glatt, dicke=dicke, uv=uv)


def _lage(mitte, achse):
    """Rechnet (laengs, quer, hoch) eines Dachs in die Welt: der First laeuft
    laengs X oder laengs Y."""
    if achse == 'x':
        return lambda l, q, z: (mitte[0] + l, mitte[1] + q, z)
    return lambda l, q, z: (mitte[0] + q, mitte[1] + l, z)


def satteldach(mitte, laenge, breite, traufe, first, stoff, ueber=0.1, ortgang=0.1, achse='x', firststoff=None,
               **mehr):
    """Zwei Flaechen, ein First. `traufe` ist die Hoehe der Wandkrone, `first`
    die Hoehe des Firsts darueber; `breite` misst quer zum First."""
    p = _lage(mitte, achse)
    halb = laenge / 2 + ortgang
    neigung = first / (breite / 2)
    aussen = breite / 2 + ueber
    unten = traufe - ueber * neigung
    oben = traufe + first
    for seite in (-1, 1):
        dachflaeche('dach', p(-halb, seite * aussen, unten), p(halb, seite * aussen, unten),
                    p(halb, 0, oben), p(-halb, 0, oben), stoff, **mehr)
    if firststoff is not None:
        mass = (2 * halb + 0.02, 0.1, 0.06) if achse == 'x' else (0.1, 2 * halb + 0.02, 0.06)
        quader('first', mass, firststoff, ort=p(0, 0, oben + 0.02), fase=0.02)


def walmdach(mitte, laenge, breite, traufe, first, stoff, firstlaenge=None, ueber=0.1, achse='x', firststoff=None,
             **mehr):
    """Vier Flaechen. Ohne Firstlaenge laufen die Walme unter 45 Grad; mit 0
    wird es ein Zeltdach."""
    p = _lage(mitte, achse)
    hl, hb = laenge / 2 + ueber, breite / 2 + ueber
    unten = traufe - ueber * first / (breite / 2)
    oben = traufe + first
    f = (max(0.0, laenge - breite) if firstlaenge is None else firstlaenge) / 2
    dachflaeche('dach', p(-hl, -hb, unten), p(hl, -hb, unten), p(f, 0, oben), p(-f, 0, oben), stoff, **mehr)
    dachflaeche('dach', p(hl, hb, unten), p(-hl, hb, unten), p(-f, 0, oben), p(f, 0, oben), stoff, **mehr)
    dachflaeche('walm', p(hl, -hb, unten), p(hl, hb, unten), p(f, 0, oben), p(f, 0, oben), stoff, **mehr)
    dachflaeche('walm', p(-hl, hb, unten), p(-hl, -hb, unten), p(-f, 0, oben), p(-f, 0, oben), stoff, **mehr)
    if firststoff is not None and f > 0:
        mass = (2 * f + 0.1, 0.1, 0.06) if achse == 'x' else (0.1, 2 * f + 0.1, 0.06)
        quader('first', mass, firststoff, ort=p(0, 0, oben + 0.02), fase=0.02)


def pultdach(mitte, laenge, breite, tief, hoch, stoff, ueber=0.1, achse='x', **mehr):
    """Eine Flaeche: an der Seite -quer `tief` hoch, an der Seite +quer `hoch`."""
    p = _lage(mitte, achse)
    hl, hb = laenge / 2 + ueber, breite / 2 + ueber
    neigung = (hoch - tief) / breite
    dachflaeche('dach', p(-hl, -hb, tief - ueber * neigung), p(hl, -hb, tief - ueber * neigung),
                p(hl, hb, hoch + ueber * neigung), p(-hl, hb, hoch + ueber * neigung), stoff, **mehr)


def giebel(r, breite, hoehe, s, stoff='putz', fachwerk=True, dicke=0.04, b=0.07):
    """Das Dreieck unter einem Satteldach, am Rahmen `r` (seine Hoehe 0 ist die
    Wandkrone). Mit Fachwerk: Koenig, Kehlbalken, Sparren."""
    prisma('giebel', [(-breite / 2, 0), (breite / 2, 0), (0, hoehe)], dicke, s[stoff], ort=(0, dicke / 2, 0),
           eltern=r)
    if not fachwerk:
        return
    quader('koenig', (b, b, hoehe - 0.1), s['balken'], ort=(0, 0, (hoehe - 0.1) / 2), eltern=r)
    quader('kehlbalken', (breite * 0.5, b * 0.85, b * 0.85), s['balken'], ort=(0, 0, hoehe * 0.48), eltern=r)
    for seite in (-1, 1):
        balken('sparren', (seite * breite / 2, -0.005, 0.0), (0, -0.005, hoehe - 0.02), b * 0.9, s['balken'],
               eltern=r)


# ---- Waende ------------------------------------------------------------------

def fachwerk(r, laenge, hoehe, s, staender=None, riegel=(0.55,), streben=(), b=0.075, felder=4):
    """Schwelle, Raehm, Staender, Riegel und Streben auf einer Wand. Der Rahmen
    `r` sitzt mitten auf der Wandflaeche am Fuss der Wand.

    streben: (x, Neigung) - eine Strebe um x, nach links oder rechts geneigt.
    """
    quader('schwelle', (laenge + 0.03, b, b), s['balken'], ort=(0, 0, b / 2), eltern=r)
    quader('raehm', (laenge + 0.1, b + 0.01, b + 0.01), s['balken'], ort=(0, 0, hoehe - b / 2), eltern=r)
    if staender is None:
        staender = [-laenge / 2 + b / 2 + i * (laenge - b) / felder for i in range(felder + 1)]
    for x in staender:
        quader('staender', (b, b + 0.005, hoehe), s['balken'], ort=(x, 0, hoehe / 2), eltern=r)
    for anteil in riegel:
        quader('riegel', (laenge, b * 0.85, b * 0.85), s['balken'], ort=(0, 0, hoehe * anteil), eltern=r)
    for x, neigung in streben:
        lang = hoehe * (riegel[0] if riegel else 1.0)
        quader('strebe', (b * 0.8, b * 0.8, lang / math.cos(neigung) - 0.02), s['balken'],
               ort=(x, -0.003, lang / 2), drehung=(0, neigung, 0), eltern=r)


def tuer(r, x, s, breite=0.3, hoehe=0.82, z=0.0, stoff='brett', fluegel=1, sturz=True, offen=False):
    """Eine Brettertuer im Rahmen `r`: Loch, Bretter, zwei Querleisten, ein Ring."""
    if sturz:
        quader('tuersturz', (breite + 0.1, 0.08, 0.07), s['balken'], ort=(x, -0.005, z + hoehe + 0.035), eltern=r)
        for seite in (-1, 1):
            quader('tuerpfosten', (0.06, 0.08, hoehe), s['balken'],
                   ort=(x + seite * (breite / 2 + 0.03), -0.005, z + hoehe / 2), eltern=r)
    quader('tuerloch', (breite, 0.03, hoehe), s['dunkel'], ort=(x, -0.012, z + hoehe / 2), fase=0, eltern=r)
    if offen:
        return
    bretter = max(3, round(breite / 0.075))
    for i in range(bretter):
        bx = x - breite / 2 + (i + 0.5) * breite / bretter
        quader('tuerbrett', (breite / bretter - 0.008, 0.025, hoehe - 0.015 * (i % 2)), s[stoff],
               ort=(bx, -0.03, z + hoehe / 2), fase=0.006, eltern=r)
    for anteil in (0.22, 0.76):
        quader('leiste', (breite, 0.02, 0.05), s['eisen'] if fluegel > 1 else s['balken'],
               ort=(x, -0.046, z + hoehe * anteil), fase=0.005, eltern=r)
    if fluegel > 1:
        quader('spalt', (0.012, 0.03, hoehe), s['dunkel'], ort=(x, -0.034, z + hoehe / 2), fase=0, eltern=r)
    drehkoerper('ring', [(-0.006, 0.018), (0.006, 0.018), (0.006, 0.03), (-0.006, 0.03), (-0.006, 0.018)], s['eisen'],
                ort=(x + breite * 0.28, -0.06, z + hoehe * 0.5), drehung=(math.pi / 2, 0, 0), teile=10, eltern=r)


def bogen(breite, hoehe, n=10, x=0.0, z=0.0):
    """Der Umriss eines Rundbogens: gerade Leibung, oben ein Halbkreis."""
    r = breite / 2
    punkte = [(x - r, z)]
    for i in range(n + 1):
        w = math.pi * i / n
        punkte.append((x - r * math.cos(w), z + hoehe - r + r * math.sin(w)))
    punkte.append((x + r, z))
    return punkte


def bogenfenster(r, x, z, s, breite=0.18, hoehe=0.42, rand='hellstein'):
    """Ein Rundbogenfenster mit steinerner Einfassung."""
    prisma('fenstereinfassung', bogen(breite + 0.08, hoehe + 0.05, x=x, z=z - 0.02), 0.05, s[rand],
           ort=(0, -0.01, 0), eltern=r)
    prisma('fensterloch', bogen(breite, hoehe, x=x, z=z), 0.06, s['dunkel'], ort=(0, -0.02, 0), eltern=r)
    quader('fensterbank', (breite + 0.12, 0.08, 0.035), s[rand], ort=(x, -0.03, z - 0.03), eltern=r)


def fenster(r, x, z, s, breite=0.2, hoehe=0.22, laden=True):
    """Ein Fenster mit Holzrahmen, Kreuz und einem offenen Laden."""
    quader('fensterloch', (breite, 0.03, hoehe), s['dunkel'], ort=(x, -0.012, z), fase=0, eltern=r)
    for dz in (-hoehe / 2 - 0.02, hoehe / 2 + 0.02):
        quader('fensterrahmen', (breite + 0.09, 0.05, 0.04), s['balken'], ort=(x, -0.012, z + dz), fase=0.006, eltern=r)
    for d in (-breite / 2 - 0.02, breite / 2 + 0.02):
        quader('fensterrahmen', (0.04, 0.05, hoehe), s['balken'], ort=(x + d, -0.012, z), fase=0.006, eltern=r)
    quader('sprosse', (0.018, 0.02, hoehe), s['balken'], ort=(x, -0.02, z), fase=0, eltern=r)
    if laden:
        quader('laden', (breite * 0.62, 0.02, hoehe + 0.03), s['brett'], ort=(x + breite * 0.86, -0.03, z),
               fase=0.005, eltern=r)


def schlitz(r, x, z, s, hoehe=0.3, breite=0.045):
    """Eine Schiessscharte."""
    quader('scharte', (breite, 0.03, hoehe), s['dunkel'], ort=(x, -0.006, z), fase=0, eltern=r)


def zinnen(mitte, laenge, breite, z, stoff, hoch=0.17, tief=0.09, zahn=0.16, brust=0.08):
    """Ein Zinnenkranz um ein Rechteck: eine niedrige Brustwehr, darauf die
    Zinnen. `z` ist die Hoehe der Krone, auf der er steht."""
    for achse, lang, quer in (('x', laenge, breite), ('y', breite, laenge)):
        zahl = max(2, round((lang + zahn) / (2 * zahn)))
        schritt = (lang - zahn) / (zahl - 1) if zahl > 1 else 0
        for seite in (-1, 1):
            rand = seite * (quer / 2 - tief / 2)
            mass = (lang, tief, brust) if achse == 'x' else (tief, lang, brust)
            ort = (mitte[0], mitte[1] + rand, z + brust / 2) if achse == 'x' else (mitte[0] + rand, mitte[1], z + brust / 2)
            quader('brustwehr', mass, stoff, ort=ort, fase=0.01)
            for i in range(zahl):
                d = -lang / 2 + zahn / 2 + i * schritt
                mass = (zahn, tief, hoch) if achse == 'x' else (tief, zahn, hoch)
                ort = ((mitte[0] + d, mitte[1] + rand, z + brust + hoch / 2) if achse == 'x'
                       else (mitte[0] + rand, mitte[1] + d, z + brust + hoch / 2))
                quader('zinne', mass, stoff, ort=ort, fase=0.012)


def rundzinnen(mitte, halbmesser, z, stoff, zahl=10, hoch=0.17, tief=0.09, brust=0.08):
    """Ein Zinnenkranz um einen runden Turm."""
    drehkoerper('brustwehr', [(0, halbmesser - tief), (0, halbmesser), (brust, halbmesser), (brust, halbmesser - tief)],
                stoff, ort=(mitte[0], mitte[1], z), teile=24)
    breit = 2 * math.pi * (halbmesser - tief / 2) / zahl * 0.52
    for i in range(zahl):
        w = 2 * math.pi * (i + 0.5) / zahl
        quader('zinne', (tief, breit, hoch), stoff,
               ort=(mitte[0] + math.cos(w) * (halbmesser - tief / 2), mitte[1] + math.sin(w) * (halbmesser - tief / 2),
                    z + brust + hoch / 2), drehung=(0, 0, w), fase=0.012)


# ---- Tuch: Fahne, Banner, Wimpel ------------------------------------------

def _tuch(name, ecke, laengs, lang, hoch, s, spalten=10, reihen=8, form='fahne', welle=0.035, stoff='tuch'):
    """Ein Tuch, das von `ecke` aus `lang` weit weht und `hoch` herabhaengt.
    Es steht quer zur Kamera, damit man die Farbe sieht."""
    laengs = Vector(laengs).normalized()
    quer = Vector((laengs.y, -laengs.x, 0))
    if quer.dot(ZUR_KAMERA) < 0:
        quer = -quer
    ecke = Vector(ecke)
    ecken, seiten = [], []
    for i in range(spalten + 1):
        u = i / spalten
        for j in range(reihen + 1):
            v = j / reihen
            if form == 'wimpel':
                # Ein Dreieck: zur Spitze hin laufen beide Kanten zusammen.
                v = 0.5 + (v - 0.5) * (1 - u * 0.96)
                frei = u
            elif form == 'banner':
                # Haengt an einem Querholz: unten frei, mit einer Spitze.
                frei = v
            else:
                frei = u
            bauch = welle * math.sin(u * 5.5 + v * 2.5) * frei
            p = ecke + laengs * (lang * u) + quer * bauch
            fall = hoch * v
            if form == 'banner':
                fall += 0.16 * hoch * (1 - abs(u - 0.5) * 2) if j == reihen else 0
            else:
                fall += 0.12 * lang * u * u
            p.z -= fall
            ecken.append(tuple(p))
    for i in range(spalten):
        for j in range(reihen):
            a = i * (reihen + 1) + j
            seiten.append((a, a + reihen + 1, a + reihen + 2, a + 1))
    return netz(name, ecken, seiten, s[stoff], glatt=True, dicke=0.008)


def fahne(ort, hoehe, s, lang=0.42, hoch=0.26, mast=0.022, fuss=0.0):
    """Ein Mast mit einer wehenden Fahne in Spielerfarbe. `ort` ist der Fuss
    des Masts, `hoehe` seine Laenge."""
    x, y = ort[0], ort[1]
    z = ort[2] if len(ort) > 2 else fuss
    rundholz('mast', (x, y, z), (x, y, z + hoehe), mast, s['balken'], teile=8)
    kugel('mastknauf', mast * 1.7, s['eisen'], ort=(x, y, z + hoehe + mast), teile=8, ringe=6)
    _tuch('fahne', (x + QUER.x * mast, y + QUER.y * mast, z + hoehe - 0.02), QUER, lang, hoch, s)


def wimpel(ort, hoehe, s, lang=0.32, hoch=0.15, mast=0.016):
    """Ein kurzer Mast mit einem dreieckigen Wimpel."""
    x, y, z = ort
    rundholz('mast', (x, y, z), (x, y, z + hoehe), mast, s['balken'], teile=8)
    _tuch('wimpel', (x + QUER.x * mast, y + QUER.y * mast, z + hoehe - 0.01), QUER, lang, hoch, s,
          form='wimpel', reihen=4)


def banner(ort, s, breit=0.3, lang=0.5, richtung=QUER, holz=True):
    """Ein Tuch, das an einem Querholz herabhaengt. `ort` ist die Mitte des
    Querholzes."""
    richtung = Vector(richtung).normalized()
    mitte = Vector(ort)
    a = mitte - richtung * (breit / 2)
    if holz:
        rundholz('bannerholz', tuple(mitte - richtung * (breit / 2 + 0.03)), tuple(mitte + richtung * (breit / 2 + 0.03)),
                 0.014, s['balken'], teile=8)
    _tuch('banner', tuple(a - Vector((0, 0, 0.012))), richtung, breit, lang, s, form='banner', welle=0.02,
          spalten=8, reihen=12)


def bannermast(ort, hoehe, s, breit=0.3, lang=0.5):
    """Eine Stange mit Querholz und Banner, frei vor dem Gebaeude - so wie am
    Haus: den Besitz erkennt man auch klein."""
    x, y = ort[0], ort[1]
    quader('bannermast', (0.035, 0.035, hoehe), s['balken'], ort=(x, y, hoehe / 2), fase=0.006)
    vor = ZUR_KAMERA * 0.03
    banner((x + vor.x, y + vor.y, hoehe - 0.08), s, breit=breit, lang=lang)


# ---- Was herumsteht ----------------------------------------------------------

def fass(ort, s, r=0.1, h=0.3):
    drehkoerper('fass', [(0, 0), (0, r * 0.82), (h / 3, r), (2 * h / 3, r), (h, r * 0.82), (h, r * 0.68),
                         (h - 0.02, r * 0.68), (h - 0.02, 0)], s['brett'], ort=ort, teile=14)
    for z in (h * 0.17, h * 0.83):
        drehkoerper('reifen', [(z - 0.012, r * 0.86), (z - 0.012, r * 0.97), (z + 0.012, r * 0.97), (z + 0.012, r * 0.86)],
                    s['eisen'], ort=ort, teile=14)


def sack(ort, s, gross=1.0, stoff='leinen', liegt=False):
    x, y, z = ort
    if liegt:
        kugel('sack', 0.1 * gross, s[stoff], ort=(x, y, z + 0.06 * gross), streckung=(1.5, 0.9, 0.6), teile=12, ringe=8)
        return
    kugel('sack', 0.1 * gross, s[stoff], ort=(x, y, z + 0.11 * gross), streckung=(0.9, 0.85, 1.15), teile=12, ringe=8)
    kugel('sackzipfel', 0.035 * gross, s[stoff], ort=(x, y, z + 0.235 * gross), streckung=(1, 1, 0.8), teile=8, ringe=6)


def kiste(ort, s, mass=(0.26, 0.2, 0.16), drehung=0.0, stoff='brett'):
    x, y, z = ort
    quader('kiste', mass, s[stoff], ort=(x, y, z + mass[2] / 2), drehung=(0, 0, drehung), fase=0.008)
    for anteil in (0.2, 0.8):
        quader('kistenleiste', (mass[0] + 0.012, mass[1] + 0.012, 0.025), s['balken'],
               ort=(x, y, z + mass[2] * anteil), drehung=(0, 0, drehung), fase=0.004)


def stammstapel(ort, s, zufall, reihen=(4, 3, 2), lang=0.7, r=0.07, laengs='x', stoff='rinde'):
    """Staemme, zur Pyramide gelegt. Die Enden zeigen laengs der Achse."""
    x, y, z = ort
    for reihe, anzahl in enumerate(reihen):
        for i in range(anzahl):
            quer = (i - (anzahl - 1) / 2) * r * 2.05 + zufall.uniform(-0.005, 0.005)
            versatz = zufall.uniform(-0.03, 0.03)
            hoch = z + r + reihe * r * 1.75
            if laengs == 'x':
                a, b = (x - lang / 2 + versatz, y + quer, hoch), (x + lang / 2 + versatz, y + quer, hoch)
            else:
                a, b = (x + quer, y - lang / 2 + versatz, hoch), (x + quer, y + lang / 2 + versatz, hoch)
            rundholz('stamm', a, b, r * zufall.uniform(0.88, 1.0), s[stoff], teile=10)
            # Das helle Stirnholz an beiden Enden.
            for ende, innen in ((a, b), (b, a)):
                d = (Vector(innen) - Vector(ende)).normalized() * 0.004
                rundholz('stirn', tuple(Vector(ende) - d), tuple(Vector(ende) + d), r * 0.82, s['scheit'], teile=10)


def zaun(punkte, s, hoch=0.3, latten=2, pfosten=0.04, stoff='hellholz', abstand=0.45):
    """Ein Lattenzaun entlang der Punkte (x, y): Pfosten und Querlatten."""
    for (x0, y0), (x1, y1) in zip(punkte, punkte[1:]):
        lang = math.hypot(x1 - x0, y1 - y0)
        teile = max(1, round(lang / abstand))
        for i in range(teile + 1):
            t = i / teile
            quader('zaunpfosten', (pfosten, pfosten, hoch + 0.04), s[stoff],
                   ort=(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, (hoch + 0.04) / 2), fase=0.008)
        for k in range(latten):
            z = hoch * (k + 0.75) / (latten + 0.3)
            balken('zaunlatte', (x0, y0, z), (x1, y1, z), 0.03, s[stoff], breit=0.02)


def heuhaufen(ort, s, r=0.2, hoch=0.9):
    kugel('heu', r, s['heu'], ort=(ort[0], ort[1], ort[2] + r * hoch * 0.45), streckung=(1, 1, hoch), teile=14, ringe=8)


def stufe(r, x, s, breite=0.5, tief=0.2, hoch=0.05, stoff='stein'):
    quader('stufe', (breite, tief, hoch), s[stoff], ort=(x, -tief / 2 - 0.02, hoch / 2), fase=0.02, eltern=r)


def schild(ort, s, r=0.11, richtung=ZUR_KAMERA, neigung=0.25):
    """Ein runder Schild in Spielerfarbe, an etwas gelehnt."""
    richtung = Vector(richtung).normalized()
    drehung = (richtung + Vector((0, 0, neigung))).to_track_quat('Z', 'Y').to_euler()
    drehkoerper('schild', [(0, 0), (0, r), (0.012, r), (0.03, r * 0.5), (0.036, 0)], s['tuch'], ort=ort,
                drehung=tuple(drehung), teile=16)
    drehkoerper('schildrand', [(-0.004, r * 0.92), (-0.004, r * 1.04), (0.016, r * 1.04), (0.016, r * 0.92)], s['eisen'],
                ort=ort, drehung=tuple(drehung), teile=16)
    drehkoerper('schildbuckel', [(0.02, 0), (0.02, r * 0.26), (0.045, r * 0.14), (0.052, 0)], s['eisen'], ort=ort,
                drehung=tuple(drehung), teile=10)


def speer(von, bis, s, r=0.011):
    rundholz('speer', von, bis, r, s['hellholz'], teile=6)
    a, b = Vector(von), Vector(bis)
    d = (b - a).normalized()
    rundholz('speerspitze', tuple(b), tuple(b + d * 0.09), r * 1.9, s['eisen'], teile=6, spitz=0.05)


def geschoss(mitte, laenge, breite, z, hoehe, s, stoff='putz', felder=(5, 4), riegel=(0.55,), streben=True, b=0.075):
    """Ein Stockwerk aus Fachwerk: der Kasten, dazu Balken auf den beiden
    Waenden, die man sieht. Gibt die Rahmen der vorderen und der rechten Wand
    zurueck - fuer Tueren und Fenster."""
    mx, my = mitte
    quader('wand', (laenge - 0.03, breite - 0.03, hoehe), s[stoff], ort=(mx, my, z + hoehe / 2), fase=0)
    vorn = rahmen((mx, my - breite / 2, z), VORN)
    rechts = rahmen((mx + laenge / 2, my, z), RECHTS)
    for r, lang, n in ((vorn, laenge, felder[0]), (rechts, breite, felder[1])):
        schraeg = [(-lang / 2 + lang / n * 0.5, 0.5), (lang / 2 - lang / n * 0.5, -0.5)] if streben else ()
        fachwerk(r, lang, hoehe, s, felder=n, riegel=riegel, streben=schraeg, b=b)
    return vorn, rechts


def reihentafel(name, felder, hoehe, ziel, bauen, zellen, schatten=None, **angaben):
    """Ein Gebaeude in mehreren Zustaenden: je Zelle wird neu gebaut.

    zellen: (Zeile, Spalte, Angaben fuer bauen(), Angaben fuer Tafel.bild()).
    """
    zelle, fuss = platz(felder, hoehe, schatten)
    blatt = None
    for zeile, spalte, wie, bild in zellen:
        szene_leeren()
        bauen(**wie)
        if blatt is None:
            blatt = Tafel(name, zelle=zelle, fuss=fuss, ziel=ziel, knapp=True)
        else:
            kamera_setzen(zelle[0], zelle[1], fuss)
        blatt.bild(zeile, spalte, **bild)
    return blatt.schreiben({'art': 'gebaeude', 'felder': felder, **angaben})


def kegeldach(mitte, halbmesser, traufe, hoehe, stoff, ecken=8, drehung=0.0, **mehr):
    """Ein spitzes Dach ueber einem runden oder vieleckigen Turm."""
    x, y = mitte
    spitze = (x, y, traufe + hoehe)
    for i in range(ecken):
        a = drehung + 2 * math.pi * i / ecken
        b = drehung + 2 * math.pi * (i + 1) / ecken
        dachflaeche('kegel', (x + math.cos(a) * halbmesser, y + math.sin(a) * halbmesser, traufe),
                    (x + math.cos(b) * halbmesser, y + math.sin(b) * halbmesser, traufe), spitze, spitze, stoff, **mehr)


def _quer_zu(d):
    quer = d.cross(Vector((0, 1, 0)))
    if quer.length < 0.1:
        quer = d.cross(Vector((1, 0, 0)))
    return quer.normalized()


def axt(von, bis, s):
    """Eine Axt: der Stiel von `von` nach `bis`, das Blatt am Ende."""
    a, b = Vector(von), Vector(bis)
    rundholz('axtstiel', von, bis, 0.012, s['hellholz'], teile=6)
    d = (b - a).normalized()
    quer = _quer_zu(d)
    balken('axtblatt', tuple(b - d * 0.03 - quer * 0.015), tuple(b - d * 0.03 + quer * 0.085), 0.07, s['eisen'],
           breit=0.018)


def spitzhacke(von, bis, s):
    a, b = Vector(von), Vector(bis)
    rundholz('hackenstiel', von, bis, 0.012, s['hellholz'], teile=6)
    d = (b - a).normalized()
    quer = _quer_zu(d)
    for seite in (-1, 1):
        rundholz('hacke', tuple(b - d * 0.02), tuple(b - d * 0.05 + quer * seite * 0.13), 0.016, s['eisen'], teile=6,
                 spitz=0.2)


def halme(name, zufall, reihen, s, hoch=0.3, dicht=0.03, farben=('#b89a48', '#d1b45c', '#a58a3e'), breit=0.035):
    """Getreide: je Reihe (x0, x1, y) viele Halme als gekreuzte Blaetter, jeder
    etwas anders in Hoehe, Neigung und Farbe. Ein Netz fuer das ganze Feld."""
    toene = [linear(f) for f in farben]
    ecken, seiten, farbwerte = [], [], []
    for x0, x1, y in reihen:
        x = x0
        while x < x1:
            for dy in (-0.035, 0.0, 0.035):
                px, py = x + zufall.uniform(-0.01, 0.01), y + dy + zufall.uniform(-0.012, 0.012)
                h = hoch * zufall.uniform(0.8, 1.12)
                nx, ny = zufall.uniform(-0.04, 0.04), zufall.uniform(-0.04, 0.04)
                ton = toene[zufall.randrange(len(toene))]
                hell = zufall.uniform(0.8, 1.15)
                w = zufall.uniform(0, math.pi)
                for k in range(2):
                    c, si = math.cos(w + k * math.pi / 2) * breit / 2, math.sin(w + k * math.pi / 2) * breit / 2
                    a = len(ecken)
                    ecken.extend([(px - c, py - si, 0.02), (px + c, py + si, 0.02),
                                  (px + c * 1.5 + nx, py + si * 1.5 + ny, h), (px - c * 1.5 + nx, py - si * 1.5 + ny, h)])
                    seiten.append((a, a + 1, a + 2, a + 3))
                    for anteil in (0.55, 0.55, 1.0, 1.0):
                        farbwerte.append((ton[0] * hell * anteil, ton[1] * hell * anteil, ton[2] * hell * anteil, 1.0))
            x += dicht * zufall.uniform(0.8, 1.2)
    if not ecken:
        return None
    return netz(name, ecken, seiten, aus_merkmal(name, rau=0.8), farben=farbwerte)


def stumpf(name, mitte, unten, oben, z0, z1, stoff, versatz=(0.0, 0.0)):
    """Ein Kasten, der sich nach oben verjuengt: unten (Laenge, Breite) auf
    Hoehe z0, oben auf z1 - Rauchfang, Turmfuss, Sockel. `versatz` schiebt
    die obere Flaeche."""
    x, y = mitte
    ecken = []
    for (l, b), z, (dx, dy) in ((unten, z0, (0.0, 0.0)), (oben, z1, versatz)):
        for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            ecken.append((x + dx + sx * l / 2, y + dy + sy * b / 2, z))
    seiten = [(3, 2, 1, 0), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    return netz(name, ecken, seiten, stoff)


def leiter(von, bis, s, breit=0.2, sprossen=7, stoff='hellholz'):
    """Eine Leiter von unten (`von`) nach oben (`bis`)."""
    a, b = Vector(von), Vector(bis)
    d = (b - a).normalized()
    quer = d.cross(Vector((0, 0, 1)))
    if quer.length < 0.1:
        quer = Vector((1, 0, 0))
    quer = quer.normalized() * (breit / 2)
    for seite in (-1, 1):
        balken('holm', tuple(a + quer * seite), tuple(b + quer * seite), 0.028, s[stoff])
    for i in range(sprossen):
        p = a.lerp(b, (i + 0.7) / (sprossen + 0.4))
        balken('sprosse', tuple(p - quer), tuple(p + quer), 0.02, s[stoff])


def wagenrad(ort, s, r=0.3, richtung=ZUR_KAMERA, speichen=8, stoff='hellholz', breit=0.05, eisen=True):
    """Ein Speichenrad um `ort`, die Achse zeigt nach `richtung`."""
    n = Vector(richtung).normalized()
    mitte = Vector(ort)
    drehung = tuple(n.to_track_quat('Z', 'Y').to_euler())
    h = breit / 2
    drehkoerper('felge', [(-h, r * 0.84), (-h, r * 0.97), (h, r * 0.97), (h, r * 0.84), (-h, r * 0.84)], s[stoff],
                ort=ort, drehung=drehung, teile=24)
    if eisen:
        drehkoerper('radreifen', [(-h * 0.9, r * 0.96), (-h * 0.9, r), (h * 0.9, r), (h * 0.9, r * 0.96)], s['eisen'],
                    ort=ort, drehung=drehung, teile=24)
    drehkoerper('nabe', [(-h * 1.6, 0), (-h * 1.6, r * 0.16), (h * 1.6, r * 0.16), (h * 1.6, 0)], s['balken'], ort=ort,
                drehung=drehung, teile=10)
    u = n.cross(Vector((0, 0, 1)))
    if u.length < 0.1:
        u = Vector((1, 0, 0))
    u.normalize()
    v = n.cross(u)
    for i in range(speichen):
        w = 2 * math.pi * i / speichen
        d = u * math.cos(w) + v * math.sin(w)
        balken('speiche', tuple(mitte + d * r * 0.1), tuple(mitte + d * r * 0.88), r * 0.09, s[stoff], fase=0.003)
