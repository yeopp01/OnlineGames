# Das Pferd: ein Gliedertier, wie der Dorfbewohner ein Gliedermann ist.
#
# Ein Leib, vier Beine mit je zwei Stuecken und einem Huf, Hals, Kopf,
# Schweif - gebaut in Metern, es schaut nach -Y. Wer es braucht, haengt es an
# sein eigenes Gelenk und legt auf, was es traegt: der Marktkarren das
# Geschirr, die Reiter Sattel und Decke (reiter.py).
#
# Kein Modell fuer sich: im Verzeichnis der Kette steht es nicht, eine Tafel
# schreibt es nicht.
#
# Die Ablaeufe:
#   stehen   ein Hinterbein ruht auf der Hufspitze
#   gehen    Schritt, vier Takte: hinten links, vorn links, hinten rechts, vorn rechts
#   traben   zwei Takte: die Beine ueber Kreuz zusammen, dazwischen schwebt es
#   kampf    es steht, scharrt mit einem Vorderbein und wirft den Kopf
#   sterben  es knickt ein und faellt auf die rechte Seite (t von 0 bis 1, einmal)

import math

from formen import aufsetzen, drehkoerper, glied, kugel, leer, quader
from stoffe import einfarbig, gemustert

VORN_OBEN, VORN_UNTEN = 0.43, 0.38
HINTEN_OBEN, HINTEN_UNTEN = 0.46, 0.42
HUF = 0.08
VORN_DZ, HINTEN_DZ = -0.12, -0.08      # Gelenke unter der Leibmitte
HINTEN_RUHE = (0.3, -0.3)              # Unterschenkel schraeg zurueck, Roehre senkrecht
LEIB_HOCH = 1.01                       # Mitte des Leibs ueber dem Boden, bevor es steht
LEIB_HALB = 0.32                       # Halbmesser des Leibs an der dicksten Stelle
BREITE = 0.88                          # der Leib ist schmaler als hoch

# Das Fell: (Leib in drei Toenen, Beine in zwei, Langhaar in zwei, Maul).
FELLE = {
    'braun': (('#38220f', '#52341c', '#664425'), ('#1d1611', '#33261b'), ('#15100c', '#2a2019'), '#3b2a1e'),
    'schimmel': (('#77736b', '#99958b', '#b5b0a5'), ('#4b4843', '#6d6962'), ('#3a3733', '#5b5751'), '#5a4f48'),
    # Der Falbe der leichten Kavallerie: sandfarben, Beine, Maehne und Schweif
    # dunkel. Ein Fuchs stand hier zuerst - leuchtend war er zu grell,
    # zurueckgenommen vom Braunen des Spaehers nicht zu unterscheiden
    # (darstellung AC-14: 0,26 statt einem Drittel).
    'falbe': (('#8a744e', '#a48c60', '#b9a172'), ('#2a2018', '#44362a'), ('#1b1510', '#30261d'), '#3f3128'),
    # Der Rappe des Reiterschuetzen (einheiten AC-46): Rappenstein fuehrt ihn im
    # Namen. Nicht ganz schwarz - sonst waere er auf dunklem Boden ein Loch.
    'rappe': (('#14110f', '#231f1c', '#34302c'), ('#0c0a09', '#1a1715'), ('#090807', '#151210'), '#2b2420'),
    # Die Pferde der Krone (einheiten AC-66). Der Lichtfuchs des Husaren:
    # ein helles Rotbraun bis in die Beine, Maehne und Schweif hell wie
    # Flachs. Der Leib ist heller als beim Braunen des Spaehers - Rappe und
    # Brauner lagen im Bild zu nah beieinander (darstellung AC-14: 0,15), das
    # soll dem Fuchs nicht auch geschehen.
    'lichtfuchs': (('#7a4424', '#93582f', '#a96b3c'), ('#6a3a1e', '#84502a'), ('#a08a5e', '#c2ad80'), '#3a2a20'),
    # Der Schwarzbraune des Kavaliers: dunkler als der Braune, waermer als der Rappe.
    'schwarzbraun': (('#241711', '#35231a', '#463024'), ('#120d0a', '#1f1713'), ('#0d0a08', '#1a1512'), '#33261f'),
    # Der Weisse des Paladins: heller als der Schimmel des Ritters, auch im Langhaar.
    'weiss': (('#a8a59c', '#c6c2b8', '#dedad0'), ('#8a877f', '#a9a59c'), ('#cfcabd', '#e6e1d4'), '#77695f'),
}


def stoffe(fell='braun'):
    leib, bein, haar, maul = FELLE[fell]
    return {
        'fell': gemustert('fell', leib, groesse=4, detail=5, relief=0.12, fugen=0.65, rau=0.55),
        'bein': gemustert('bein', bein, groesse=9, detail=3, relief=0.1, fugen=0.4, rau=0.6),
        'haar': gemustert('haar', haar, massstab=(14, 14, 1.5), groesse=5, relief=0.6, fugen=0.4, rau=0.75),
        'maul': einfarbig('maul', maul, rau=0.6),
        'huf': einfarbig('huf', '#241d17', rau=0.5),
        'auge': einfarbig('auge', '#0d0a08', rau=0.25),
        'leder': gemustert('leder', ('#2f2015', '#4c3522', '#5e4329'), groesse=14, detail=4, relief=0.5,
                           fugen=0.5, rau=0.65),
    }


def ring(name, halbmesser, staerke, breite, stoff, **wo):
    """Ein Reif um die Hochachse: Gurt, Kummet, Felge, Fassreifen."""
    r, s, b = halbmesser, staerke / 2, breite / 2
    profil = [(-b, r - s), (-b, r + s), (b, r + s), (b, r - s), (-b, r - s)]
    return drehkoerper(name, profil, stoff, glatt=False, **wo)


# Das Profil des Leibs: (wie weit vorn, Halbmesser). Die Decken der Reiter
# lesen es mit, damit sie aufliegen.
TONNE = [(-0.6, 0), (-0.57, 0.17), (-0.45, 0.29), (-0.2, 0.32), (0.1, 0.315), (0.33, 0.295),
         (0.48, 0.24), (0.58, 0.13), (0.61, 0)]
KRUPPE = (0.35, 0.04, 0.33)     # (wie weit hinten, wie hoch, Halbmesser)
BRUST = (-0.4, -0.02, 0.295)


def huelle(y):
    """Wie dick der Leib an der Stelle y ist (hinten ist positiv)."""
    vorn = -y
    r = 0.0
    for (h0, r0), (h1, r1) in zip(TONNE, TONNE[1:]):
        if h0 <= vorn <= h1:
            r = r0 + (r1 - r0) * (vorn - h0) / (h1 - h0)
    for mitte, _, halb in (KRUPPE, BRUST):
        if abs(y - mitte) < halb:
            r = max(r, math.sqrt(halb * halb - (y - mitte) ** 2))
    return r


def bauen(s, g, eltern, ort=(0, 0, 0), mass=1.0, breite=BREITE):
    """Baut das Pferd an `eltern` und legt seine Gelenke in `g`."""
    b = breite / BREITE
    g['pferd'] = leer('pferd', ort, eltern)
    g['pferd'].scale = (mass, mass, mass)
    g['leib'] = leer('leib', (0, 0, LEIB_HOCH), g['pferd'])
    leib = g['leib']
    laengs = (math.pi / 2, 0, 0)        # die Hochachse eines Drehkoerpers zeigt dann nach vorn

    # Der Leib: eine Tonne, vorn die Brust, hinten die Kruppe.
    drehkoerper('tonne', TONNE, s['fell'], drehung=laengs, eltern=leib, streckung=(breite, 1.0), teile=20)
    kugel('kruppe', KRUPPE[2], s['fell'], ort=(0, KRUPPE[0], KRUPPE[1]), eltern=leib, streckung=(0.9 * b, 1.0, 0.97))
    kugel('brust', BRUST[2], s['fell'], ort=(0, BRUST[0], BRUST[1]), eltern=leib, streckung=(0.86 * b, 1.0, 1.08))
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
    for seite, x in (('l', 0.15 * b), ('r', -0.15 * b)):
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


def _glatt(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def _zwischen(a, b, t):
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def stellen(g, ablauf, t=0.0):
    """Bringt das Pferd in ein Bild eines Ablaufs; t laeuft von 0 bis 1.

    Gibt zurueck, wie hoch die Mitte des Leibs steht (im Mass des Pferdes).
    """
    p = 2 * math.pi * t
    # (Gelenk oben, Gelenk unten), vor ist negativ - wie beim Dorfbewohner.
    ruhe = {'vl': (0.0, 0.02), 'vr': (0.0, 0.02), 'hl': HINTEN_RUHE, 'hr': HINTEN_RUHE}
    beine = dict(ruhe)
    hals, kopf, schweif = 0.95, 1.15, (0.3, 0, 0)
    rollen, schweben = 0.0, 0.0
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
    elif ablauf == 'traben':
        # Ueber Kreuz: hinten links mit vorn rechts, dann die anderen zwei. Der
        # Ausschlag ist so gross, dass ein Trabschritt gut 1,4 m traegt - so
        # weit kommt ein Reiter im Spiel in einem Ablauf (0,7 s bei 1,2 bis
        # 1,35 Feldern je Sekunde), sonst rutschten die Hufe.
        for bein, versatz in (('hl', 0.0), ('vr', 0.0), ('hr', 0.5), ('vl', 0.5)):
            q = p - 2 * math.pi * versatz
            heben = max(0.0, math.cos(q)) ** 1.2
            if bein[0] == 'v':
                beine[bein] = (-0.42 * math.sin(q) + 0.02, 1.05 * heben + 0.03)
            else:
                beine[bein] = (HINTEN_RUHE[0] - 0.36 * math.sin(q), HINTEN_RUHE[1] - 0.7 * heben)
        # Zwischen den zwei Tritten schwebt das Pferd; ohne das saenke der Leib
        # dort ab, wo er im Trab am hoechsten ist.
        schweben = 0.07 * math.sin(p) ** 2
        hals = 0.86 + 0.03 * math.sin(2 * p)
        kopf = 1.22 - 0.03 * math.sin(2 * p)
        schweif = (0.62, 0.12 * math.sin(p), 0)
    elif ablauf == 'kampf':
        scharren = math.sin(math.pi * t) ** 2
        beine['vl'] = (-0.42 * scharren, 1.1 * scharren + 0.02)
        hals = 0.92 - 0.14 * math.sin(p)
        kopf = 1.12 + 0.12 * math.sin(p + 0.5)
        schweif = (0.36, 0.22 * math.sin(2 * p), 0)
    elif ablauf == 'sterben':
        knicken = _glatt(t / 0.4)
        rollen = -1.48 * _glatt((t - 0.2) / 0.6)
        liegen = _glatt((t - 0.5) / 0.5)
        geknickt = {'vl': (-0.6, 1.9), 'vr': (-0.5, 1.8), 'hl': (0.75, -1.3), 'hr': (0.7, -1.25)}
        gestreckt = {'vl': (-0.3, 0.55), 'vr': (-0.5, 0.75), 'hl': (0.45, -0.7), 'hr': (0.6, -0.85)}
        for bein in beine:
            beine[bein] = _zwischen(_zwischen(ruhe[bein], geknickt[bein], knicken), gestreckt[bein], liegen)
        hals = 1.0 + 0.3 * knicken + 0.2 * liegen
        kopf = 1.12 - 0.4 * knicken - 0.35 * liegen
        schweif = (0.3 + 0.5 * liegen, 0, 0)
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
    hoch += schweben
    g['leib'].location.z = hoch
    g['leib'].rotation_euler = (0, rollen, 0)
    g['hals'].rotation_euler = (hals, 0, 0)
    g['kopf'].rotation_euler = (kopf, 0, 0)
    g['schweif'].rotation_euler = schweif
    if ablauf == 'sterben':
        # Wer faellt, liegt auf, womit er eben aufliegt: gerechnet aus den
        # Ecken der Koerper statt aus den Beinen.
        hoch = aufsetzen(g['pferd'], g['leib'])
    return hoch
