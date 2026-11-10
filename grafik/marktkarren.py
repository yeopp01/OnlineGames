# Der Marktkarren: ein Zugpferd vor einem zweiraedrigen Karren mit Ladung.
#
# Gebaut in Metern und als Ganzes auf Spielgroesse gebracht, im selben
# Massstab wie der Dorfbewohner - ein Mensch reicht dem Pferd bis an den
# Widerrist. Das Gespann schaut nach -Y; die Mitte zwischen Pferd und Karren
# steht auf (0, 0, 0).
#
# Das Pferd ist ein Gliedertier wie der Dorfbewohner ein Gliedermann: ein
# Leib, vier Beine mit je zwei Stuecken und einem Huf, Hals, Kopf, Schweif.
# Der Karren: Boden, Bordwaende aus Planken, Rungen, zwei Speichenraeder mit
# Eisenreifen, eine Gabeldeichsel. Vorn steht die Ladung offen (Fass, Saecke,
# Kiste), hinten liegt sie unter einer verzurrten Plane.
#
# Spielerfarbe tragen die Plane und die Decke unter dem Geschirr.
#
# Die Tafel: je Zeile eine Blickrichtung wie beim Dorfbewohner, je Spalte ein
# Bild - erst Stehen, dann acht Bilder Gehen. Im Gehen laeuft das Pferd im
# Schritt (vier Takte: hinten links, vorn links, hinten rechts, vorn rechts),
# und die Raeder drehen sich.

import math
import os

from formen import drehkoerper, glied, kugel, leer, netz, quader, strang
from kette import Tafel, szene_leeren
from stoffe import einfarbig, gemustert

GROESSE = 1.06 / 1.75     # Felder je Meter, wie beim Dorfbewohner
RICHTUNGEN = 8
SCHRITTE = 8

# Das Pferd.
PFERD_Y = -0.68           # Mitte des Leibs
PFERD_MASS = 1.1          # ein Zugpferd, kein Reitpferd
VORN_OBEN, VORN_UNTEN = 0.43, 0.38
HINTEN_OBEN, HINTEN_UNTEN = 0.46, 0.42
HUF = 0.08
VORN_DZ, HINTEN_DZ = -0.12, -0.08      # Gelenke unter der Leibmitte
HINTEN_RUHE = (0.3, -0.3)              # Unterschenkel schraeg zurueck, Roehre senkrecht

# Der Karren.
BODEN_VORN = 0.38
BODEN_LAENGE = 1.45
BODEN_BREITE = 0.95
BODEN_Z = 0.64
BORD = 0.28               # Hoehe der Bordwand ueber dem Boden
ACHSE_Y = BODEN_VORN + 0.78
RAD = 0.5
SPEICHEN = 8
# Je Schritt des Pferdes drehen die Raeder drei Speichen weiter. Mehr saehe
# in acht Bildern aus, als liefen sie rueckwaerts.
RAD_JE_ABLAUF = 3 * 2 * math.pi / SPEICHEN
PLANE_VORN = BODEN_VORN + 0.62
PLANE_HINTEN = BODEN_VORN + BODEN_LAENGE + 0.06
PLANE_HALB = 0.62


def stoffe():
    return {
        'fell': gemustert('fell', ('#38220f', '#52341c', '#664425'), groesse=4, detail=5, relief=0.12,
                          fugen=0.65, rau=0.55),
        'bein': gemustert('bein', ('#1d1611', '#33261b'), groesse=9, detail=3, relief=0.1, fugen=0.4, rau=0.6),
        'haar': gemustert('haar', ('#15100c', '#2a2019'), massstab=(14, 14, 1.5), groesse=5, relief=0.6,
                          fugen=0.4, rau=0.75),
        'maul': einfarbig('maul', '#3b2a1e', rau=0.6),
        'huf': einfarbig('huf', '#241d17', rau=0.5),
        'auge': einfarbig('auge', '#0d0a08', rau=0.25),
        'leder': gemustert('leder', ('#2f2015', '#4c3522', '#5e4329'), groesse=14, detail=4, relief=0.5,
                           fugen=0.5, rau=0.65),
        'decke': gemustert('decke', ('#7e7e7e', '#b4b4b4'), groesse=40, detail=3, relief=0.3, fugen=0.5,
                           rau=0.95, spieler=True),
        'plane': gemustert('plane', ('#808080', '#b6b6b6'), groesse=7, detail=6, relief=0.55, fugen=0.6,
                           rau=0.95, spieler=True),
        'planke': gemustert('planke', ('#5a4129', '#7a5a39', '#917047'), massstab=(8, 1.2, 8), groesse=3,
                            detail=4, relief=0.7, fugen=0.7),
        'quer': gemustert('quer', ('#5a4129', '#7a5a39', '#917047'), massstab=(1.2, 8, 8), groesse=3,
                          detail=4, relief=0.7, fugen=0.7),
        'balken': gemustert('balken', ('#3d2a1b', '#5c4028', '#73522f'), massstab=(6, 6, 6), groesse=3,
                            detail=5, relief=0.6, fugen=0.6),
        'daube': gemustert('daube', ('#6b4c2d', '#8a6539', '#9c7646'), massstab=(9, 9, 1.2), groesse=3,
                           detail=4, relief=0.7, fugen=0.6),
        'speiche': gemustert('speiche', ('#6b4a2c', '#8c6638'), groesse=6, detail=4, relief=0.4, fugen=0.6),
        'eisen': gemustert('eisen', ('#4f5357', '#878c91'), groesse=20, detail=2, relief=0.15, rau=0.4,
                           metall=0.85),
        'sack': gemustert('sack', ('#8d7f5c', '#a99a72', '#b9ab84'), groesse=45, detail=2, relief=0.35,
                          fugen=0.6, rau=0.95),
        'seil': gemustert('seil', ('#6f5d3a', '#94804f'), groesse=60, detail=2, relief=0.4, rau=0.9),
    }


def _ring(name, halbmesser, staerke, breite, stoff, **wo):
    """Ein Reif um die Hochachse: Gurt, Kummet, Felge, Fassreifen."""
    r, s, b = halbmesser, staerke / 2, breite / 2
    profil = [(-b, r - s), (-b, r + s), (b, r + s), (b, r - s), (-b, r - s)]
    return drehkoerper(name, profil, stoff, glatt=False, **wo)


def _pferd(s, g, figur):
    g['pferd'] = leer('pferd', (0, PFERD_Y, 0), figur)
    g['pferd'].scale = (PFERD_MASS, PFERD_MASS, PFERD_MASS)
    g['leib'] = leer('leib', (0, 0, 1.01), g['pferd'])
    leib = g['leib']
    laengs = (math.pi / 2, 0, 0)        # die Hochachse eines Drehkoerpers zeigt dann nach vorn

    # Der Leib: eine Tonne, vorn die Brust, hinten die Kruppe.
    drehkoerper('tonne', [(-0.6, 0), (-0.57, 0.17), (-0.45, 0.29), (-0.2, 0.32), (0.1, 0.315), (0.33, 0.295),
                          (0.48, 0.24), (0.58, 0.13), (0.61, 0)], s['fell'], drehung=laengs, eltern=leib,
                streckung=(0.88, 1.0), teile=20)
    kugel('kruppe', 0.33, s['fell'], ort=(0, 0.35, 0.04), eltern=leib, streckung=(0.9, 1.0, 0.97))
    kugel('brust', 0.295, s['fell'], ort=(0, -0.4, -0.02), eltern=leib, streckung=(0.86, 1.0, 1.08))
    kugel('widerrist', 0.17, s['fell'], ort=(0, -0.3, 0.23), eltern=leib, streckung=(0.6, 1.5, 0.8))

    # Hals und Kopf.
    g['hals'] = leer('hals', (0, -0.46, 0.17), leib)
    hals = g['hals']
    drehkoerper('halsstueck', [(-0.18, 0), (-0.14, 0.23), (0.0, 0.235), (0.26, 0.175), (0.5, 0.13),
                               (0.6, 0.11), (0.64, 0)], s['fell'], eltern=hals, streckung=(0.6, 1.0), teile=16)
    quader('maehne', (0.05, 0.12, 0.6), s['haar'], ort=(0, 0.17, 0.3), drehung=(0.19, 0, 0), eltern=hals, fase=0.02)
    g['kopf'] = leer('kopf', (0, -0.02, 0.58), hals)
    kopf = g['kopf']
    kopf.scale = (1.1, 1.1, 1.1)
    drehkoerper('schaedel', [(-0.07, 0), (-0.05, 0.105), (0.05, 0.136), (0.18, 0.118), (0.31, 0.096),
                             (0.4, 0.092), (0.45, 0.074), (0.475, 0)], s['fell'], eltern=kopf,
                streckung=(0.72, 1.0), teile=14)
    kugel('ganasche', 0.1, s['fell'], ort=(0, -0.07, 0.08), eltern=kopf, streckung=(0.7, 1.0, 1.2), teile=12, ringe=8)
    kugel('maul', 0.086, s['maul'], ort=(0, -0.004, 0.41), eltern=kopf, streckung=(0.8, 1.02, 0.85), teile=12, ringe=8)
    kugel('schopf', 0.06, s['haar'], ort=(0, 0.09, 0.03), eltern=kopf, streckung=(0.7, 0.8, 1.6), teile=10, ringe=6)
    for x in (-0.066, 0.066):
        drehkoerper('ohr', [(0, 0.036), (0.07, 0.03), (0.14, 0)], s['fell'], ort=(x, 0.07, -0.02),
                    drehung=(-math.pi / 2 + 0.25, 0, 0), eltern=kopf, streckung=(1, 0.5), teile=8)
        kugel('auge', 0.022, s['auge'], ort=(x * 1.3, 0.03, 0.12), eltern=kopf, teile=8, ringe=6)
    # Das Halfter.
    drehkoerper('nasenriemen', [(0.27, 0.102), (0.27, 0.11), (0.305, 0.108), (0.305, 0.1), (0.27, 0.102)],
                s['leder'], eltern=kopf, streckung=(0.72, 1.0), teile=14, glatt=False)
    drehkoerper('genickriemen', [(0.03, 0.134), (0.03, 0.143), (0.065, 0.141), (0.065, 0.132), (0.03, 0.134)],
                s['leder'], eltern=kopf, streckung=(0.72, 1.0), teile=14, glatt=False)

    # Der Schweif.
    g['schweif'] = leer('schweif', (0, 0.6, 0.12), leib)
    glied('schweifhaar', 0.7, 0.085, 0.05, s['haar'], eltern=g['schweif'])

    # Vier Beine: oben Fell, unten dunkel wie bei einem Braunen, der Huf.
    for seite, x in (('l', 0.15), ('r', -0.15)):
        g['v' + seite] = leer('v' + seite, (x, -0.4, VORN_DZ), leib)
        glied('vorarm', VORN_OBEN, 0.115, 0.068, s['fell'], eltern=g['v' + seite])
        g['vk' + seite] = leer('vk' + seite, (0, 0, -VORN_OBEN), g['v' + seite])
        glied('vorderroehre', VORN_UNTEN, 0.062, 0.054, s['bein'], eltern=g['vk' + seite])
        g['vf' + seite] = leer('vf' + seite, (0, 0, -VORN_UNTEN), g['vk' + seite])
        g['h' + seite] = leer('h' + seite, (x * 1.08, 0.42, HINTEN_DZ), leib)
        glied('schenkel', HINTEN_OBEN, 0.16, 0.078, s['fell'], eltern=g['h' + seite])
        g['hk' + seite] = leer('hk' + seite, (0, 0, -HINTEN_OBEN), g['h' + seite])
        glied('hinterroehre', HINTEN_UNTEN, 0.064, 0.054, s['bein'], eltern=g['hk' + seite])
        g['hf' + seite] = leer('hf' + seite, (0, 0, -HINTEN_UNTEN), g['hk' + seite])
        for bein in ('vf', 'hf'):
            drehkoerper('huf', [(0.02, 0), (0.02, 0.06), (-HUF, 0.08), (-HUF, 0)], s['huf'],
                        ort=(0, -0.012, 0), eltern=g[bein + seite], streckung=(0.95, 1.1), teile=12)

    # Das Geschirr: Kummet auf den Schultern, Decke und Gurt um den Leib.
    kummet = (math.pi / 2 - 0.42, 0, 0)
    drehkoerper('kummet', [(-0.05, 0.285), (0.0, 0.34), (0.05, 0.285), (0.0, 0.24), (-0.05, 0.285)], s['leder'],
                ort=(0, -0.47, 0.06), drehung=kummet, eltern=leib, streckung=(0.84, 1.18), teile=20)
    for x in (-0.05, 0.05):
        quader('kumtholz', (0.03, 0.035, 0.17), s['balken'], ort=(x, -0.35, 0.47), drehung=(-0.42, 0, 0),
               eltern=leib, fase=0.008)
    _ring('decke', 0.322, 0.014, 0.28, s['decke'], ort=(0, -0.08, 0), drehung=laengs, eltern=leib,
          streckung=(0.88, 1.0), teile=24)
    _ring('gurt', 0.331, 0.014, 0.07, s['leder'], ort=(0, -0.08, 0), drehung=laengs, eltern=leib,
          streckung=(0.88, 1.0), teile=24)
    quader('kammdeckel', (0.2, 0.16, 0.04), s['leder'], ort=(0, -0.08, 0.33), eltern=leib, fase=0.015)
    for x in (-1, 1):
        # Der Tragriemen zur Deichsel und der Zugstrang vom Kummet nach hinten.
        quader('tragriemen', (0.17, 0.045, 0.02), s['leder'], ort=(x * 0.35, -0.08, -0.05), eltern=leib, fase=0.004)
        quader('zugstrang', (0.02, 0.62, 0.04), s['leder'], ort=(x * 0.292, -0.14, -0.06), drehung=(0.04, 0, 0),
               eltern=leib, fase=0.004)


def _rad(s, g, seite, x, karren):
    g['rad_' + seite] = leer('rad_' + seite, (x, ACHSE_Y, RAD), karren)
    scheibe = leer('scheibe', (0, 0, 0), g['rad_' + seite])
    scheibe.rotation_euler = (0, math.pi / 2, 0)   # die Hochachse der Teile wird zur Radachse
    _ring('felge', RAD - 0.045, 0.07, 0.07, s['speiche'], eltern=scheibe, teile=32)
    _ring('reifen', RAD - 0.004, 0.012, 0.064, s['eisen'], eltern=scheibe, teile=32)
    drehkoerper('nabe', [(-0.11, 0), (-0.11, 0.055), (-0.05, 0.095), (0.05, 0.095), (0.11, 0.055), (0.11, 0)],
                s['balken'], eltern=scheibe, teile=14, glatt=False)
    _ring('nabenring', 0.06, 0.012, 0.03, s['eisen'], ort=(0, 0, 0.1 if x > 0 else -0.1), eltern=scheibe, teile=14)
    innen, aussen = 0.08, RAD - 0.07
    for i in range(SPEICHEN):
        w = 2 * math.pi * i / SPEICHEN
        mitte = (innen + aussen) / 2
        quader('speiche', (aussen - innen, 0.042, 0.036), s['speiche'],
               ort=(math.cos(w) * mitte, math.sin(w) * mitte, 0), drehung=(0, 0, w), eltern=scheibe, fase=0.008)


def _plane_hoehe(x, y):
    """Die Plane ueber der hinteren Ladung: ein Bogen quer, Buckel von dem,
    was darunter liegt, an den Seiten und hinten haengt sie ueber die Wand."""
    u = max(-1.0, min(1.0, x / PLANE_HALB))
    w = (y - PLANE_VORN) / (PLANE_HINTEN - PLANE_VORN)
    bogen = max(0.0, math.cos(u * math.pi / 2)) ** 0.55
    buckel = (0.11 * math.exp(-((x + 0.16) ** 2 + (y - PLANE_VORN - 0.28) ** 2) / 0.03)
              + 0.08 * math.exp(-((x - 0.2) ** 2 + (y - PLANE_VORN - 0.58) ** 2) / 0.035))
    rand = 1.0
    if w > 0.88:
        t = (w - 0.88) / 0.12
        rand = 1.0 - 0.95 * t * t * (3 - 2 * t)
    elif w < 0.12:
        rand = 0.82 + 0.18 * w / 0.12
    return 0.8 + (0.36 * bogen + buckel * (1 - u * u)) * rand


def _karren(s, g, figur):
    g['karren'] = leer('karren', (0, 0, 0), figur)
    k = g['karren']
    mitte_y = BODEN_VORN + BODEN_LAENGE / 2
    halb = BODEN_BREITE / 2

    # Der Boden aus fuenf Bohlen, darunter zwei Laengstraeger und die Achse.
    for i in range(5):
        x = -halb + (i + 0.5) * BODEN_BREITE / 5
        quader('bohle', (BODEN_BREITE / 5 - 0.008, BODEN_LAENGE, 0.045), s['planke'], ort=(x, mitte_y, BODEN_Z),
               eltern=k, fase=0.006)
    for x in (-0.3, 0.3):
        quader('traeger', (0.07, BODEN_LAENGE + 0.1, 0.08), s['balken'], ort=(x, mitte_y, BODEN_Z - 0.06), eltern=k)
        quader('achsstock', (0.1, 0.2, 0.09), s['balken'], ort=(x, ACHSE_Y, RAD + 0.055), eltern=k)
    quader('achse', (1.5, 0.075, 0.075), s['balken'], ort=(0, ACHSE_Y, RAD), eltern=k, fase=0.02)

    # Bordwaende: zwei Planken uebereinander, gehalten von Rungen.
    for stufe in range(2):
        z = BODEN_Z + 0.03 + (stufe + 0.5) * BORD / 2
        for x in (-halb, halb):
            quader('seitenplanke', (0.028, BODEN_LAENGE, BORD / 2 - 0.01), s['planke'], ort=(x, mitte_y, z),
                   eltern=k, fase=0.006)
        for y in (BODEN_VORN + 0.014, BODEN_VORN + BODEN_LAENGE - 0.014):
            quader('stirnplanke', (BODEN_BREITE, 0.028, BORD / 2 - 0.01), s['quer'], ort=(0, y, z), eltern=k, fase=0.006)
    for x in (-halb - 0.035, halb + 0.035):
        for y in (BODEN_VORN + 0.07, mitte_y, BODEN_VORN + BODEN_LAENGE - 0.07):
            quader('runge', (0.045, 0.055, BORD + 0.13), s['balken'], ort=(x, y, BODEN_Z + BORD / 2 - 0.035), eltern=k,
                   fase=0.01)

    # Die Gabeldeichsel: zwei Stangen vom Boden nach vorn bis an die Schultern.
    vorn_y, vorn_z = PFERD_Y - 0.6, 1.04
    hinten_y, hinten_z = BODEN_VORN + 0.25, BODEN_Z - 0.04
    laenge = math.hypot(vorn_y - hinten_y, vorn_z - hinten_z)
    steigung = math.atan2(vorn_z - hinten_z, hinten_y - vorn_y)
    for x in (-0.42, 0.42):
        quader('deichsel', (0.05, laenge, 0.055), s['balken'], ort=(x, (vorn_y + hinten_y) / 2, (vorn_z + hinten_z) / 2),
               drehung=(-steigung, 0, 0), eltern=k, fase=0.015)
        _ring('deichselring', 0.034, 0.012, 0.03, s['eisen'], ort=(x, vorn_y + 0.05, vorn_z - 0.012),
              drehung=(math.pi / 2 - steigung, 0, 0), eltern=k, teile=10)
    quader('querholz', (0.85, 0.05, 0.05), s['balken'], ort=(0, BODEN_VORN - 0.1, BODEN_Z - 0.01), eltern=k, fase=0.012)

    _rad(s, g, 'l', halb + 0.2, k)
    _rad(s, g, 'r', -halb - 0.2, k)

    # Die offene Ladung vorn: ein Fass, drei Saecke, eine Kiste.
    boden = BODEN_Z + 0.024
    fass = leer('fass', (-0.2, BODEN_VORN + 0.27, boden), k)
    drehkoerper('fasskoerper', [(0, 0), (0, 0.165), (0.12, 0.195), (0.26, 0.205), (0.4, 0.195), (0.52, 0.165),
                                (0.52, 0.14), (0.5, 0.14), (0.5, 0)], s['daube'], eltern=fass, teile=18)
    for z, r in ((0.07, 0.186), (0.19, 0.204), (0.33, 0.204), (0.45, 0.186)):
        _ring('fassreifen', r, 0.008, 0.03, s['eisen'], ort=(0, 0, z), eltern=fass, teile=18)
    for x, y, z, r, hoch in ((0.2, 0.2, 0.13, 0.19, 0.72), (0.23, 0.5, 0.12, 0.18, 0.7), (0.17, 0.36, 0.34, 0.165, 0.7)):
        kugel('sack', r, s['sack'], ort=(x, BODEN_VORN + y, boden + z), eltern=k, streckung=(1.0, 1.12, hoch), teile=14,
              ringe=9)
        kugel('zipfel', 0.035, s['sack'], ort=(x + 0.02, BODEN_VORN + y - r * 0.95, boden + z + 0.05), eltern=k,
              teile=8, ringe=5)
    quader('kiste', (0.3, 0.26, 0.24), s['quer'], ort=(-0.21, BODEN_VORN + 0.6, boden + 0.12), eltern=k, fase=0.01)
    for z in (0.03, 0.21):
        quader('kistenleiste', (0.31, 0.27, 0.03), s['balken'], ort=(-0.21, BODEN_VORN + 0.6, boden + z), eltern=k, fase=0.006)

    # Die Plane, mit zwei Seilen verzurrt.
    spalten, reihen = 18, 14
    ecken, seiten = [], []
    for j in range(reihen + 1):
        y = PLANE_VORN + (PLANE_HINTEN - PLANE_VORN) * j / reihen
        for i in range(spalten + 1):
            x = -PLANE_HALB + 2 * PLANE_HALB * i / spalten
            ecken.append((x, y, _plane_hoehe(x, y)))
    for j in range(reihen):
        for i in range(spalten):
            a = j * (spalten + 1) + i
            seiten.append((a, a + 1, a + spalten + 2, a + spalten + 1))
    netz('plane', ecken, seiten, s['plane'], eltern=k, glatt=True, dicke=0.014)
    for versatz in (0.2, 0.52):
        y = PLANE_VORN + versatz
        punkte = [(-halb - 0.06, y, BODEN_Z - 0.02, 0.011)]
        for i in range(13):
            x = -PLANE_HALB + 2 * PLANE_HALB * i / 12
            punkte.append((x, y, _plane_hoehe(x, y) + 0.012, 0.011))
        punkte.append((halb + 0.06, y, BODEN_Z - 0.02, 0.011))
        strang('seil', punkte, s['seil'], eltern=k)


def bauen():
    """Baut das Gespann und gibt seine Gelenke zurueck."""
    s = stoffe()
    g = {}
    g['figur'] = leer('figur')
    g['figur'].scale = (GROESSE, GROESSE, GROESSE)
    _pferd(s, g, g['figur'])
    _karren(s, g, g['figur'])
    return g


def stellen(g, ablauf, t=0.0):
    """Bringt das Gespann in ein Bild eines Ablaufs; t laeuft von 0 bis 1."""
    p = 2 * math.pi * t
    # (Gelenk oben, Gelenk unten), vor ist negativ - wie beim Dorfbewohner.
    beine = {'vl': (0.0, 0.02), 'vr': (0.0, 0.02), 'hl': HINTEN_RUHE, 'hr': HINTEN_RUHE}
    hals, kopf, schweif, rad = 0.95, 1.15, (0.3, 0, 0), 0.0
    if ablauf == 'gehen':
        for bein, versatz in (('hl', 0.0), ('vl', 0.25), ('hr', 0.5), ('vr', 0.75)):
            q = p - 2 * math.pi * versatz
            heben = max(0.0, math.cos(q)) ** 1.3
            if bein[0] == 'v':
                beine[bein] = (-0.3 * math.sin(q) + 0.02, 0.85 * heben + 0.03)
            else:
                beine[bein] = (HINTEN_RUHE[0] - 0.28 * math.sin(q), HINTEN_RUHE[1] - 0.55 * heben)
        # Der Kopf nickt zweimal je Schritt, der Schweif pendelt einmal.
        hals = 1.0 + 0.06 * math.sin(2 * p + 0.6)
        kopf = 1.1 - 0.05 * math.sin(2 * p + 0.6)
        schweif = (0.34, 0.09 * math.sin(p), 0)
        rad = RAD_JE_ABLAUF * t
    else:
        # Im Stand ruht ein Hinterbein auf der Hufspitze.
        beine['hr'] = (HINTEN_RUHE[0] - 0.1, HINTEN_RUHE[1] - 0.14)
        hals, kopf = 1.0, 1.12

    # Der Leib steht so hoch, dass das tiefste Bein den Boden beruehrt.
    hoch = 0.0
    for bein, (oben, unten) in beine.items():
        vorn = bein[0] == 'v'
        g[bein].rotation_euler = (oben, 0, 0)
        g[bein[0] + 'k' + bein[1]].rotation_euler = (unten, 0, 0)
        g[bein[0] + 'f' + bein[1]].rotation_euler = (-(oben + unten) * 0.85, 0, 0)
        l1, l2, dz = (VORN_OBEN, VORN_UNTEN, VORN_DZ) if vorn else (HINTEN_OBEN, HINTEN_UNTEN, HINTEN_DZ)
        hoch = max(hoch, l1 * math.cos(oben) + l2 * math.cos(oben + unten) + HUF - dz)
    g['leib'].location.z = hoch
    g['hals'].rotation_euler = (hals, 0, 0)
    g['kopf'].rotation_euler = (kopf, 0, 0)
    g['schweif'].rotation_euler = schweif
    for seite in ('l', 'r'):
        g['rad_' + seite].rotation_euler = (rad, 0, 0)


def tafel(ziel):
    szene_leeren()
    g = bauen()
    blatt = Tafel('marktkarren', zelle=(384, 252), fuss=(160, 162), ziel=ziel)
    probe = os.environ.get('BILDER_PROBE')
    # Zum Ansehen beim Bauen: '1' nur drei Spalten, '2' und '3' je vier Richtungen.
    richtungen = {'2': [1, 3, 5, 7], '3': [0, 2, 4, 6]}.get(probe, list(range(RICHTUNGEN)))
    schritte = [1] if probe in ('2', '3') else [0, 2] if probe == '1' else list(range(SCHRITTE))
    for richtung in richtungen:
        g['figur'].rotation_euler = (0, 0, math.radians(45 + 45 * richtung))
        stellen(g, 'stehen')
        blatt.bild(richtung, 0)
        for spalte, schritt in enumerate(schritte):
            stellen(g, 'gehen', schritt / SCHRITTE)
            blatt.bild(richtung, 1 + spalte)
    return blatt.schreiben({
        'art': 'figur',
        'richtungen': RICHTUNGEN,
        'ablaeufe': {'stehen': {'spalte': 0, 'bilder': 1}, 'gehen': {'spalte': 1, 'bilder': len(schritte)}},
    })
