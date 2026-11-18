# Der Bergfried: was aus dem Wehrturm wird, wenn die Universitaet ihn in der
# Krone ein zweites Mal verstaerkt hat (bauen AC-50).
#
# Derselbe Platz, ein Feld - aber noch einmal hoeher, auf einem hohen
# geboeschten Fuss, mit zwei Gesimsen, einer hoelzernen Hurde, die ueber den
# Schaft hinausragt, vier Ecktuermchen und einem steilen Schieferhelm. Den
# Wachturm erkennt man an der offenen Plattform, den Wehrturm am Dach, den
# Bergfried an den fuenf Spitzen: das sieht man auch klein und von weitem.

import random

from bauteile import RECHTS, VORN, banner, bodenfleck, einzeltafel, fahne, kegeldach, rahmen, schlitz, stoffe, stumpf, tuer, walmdach
from formen import quader

FELDER = 1
BREIT = 0.84
SOCKEL = 0.85             # so hoch reicht die Boeschung
SCHAFT = 2.85             # bis unter die Hurde
HURDE = 1.12              # so breit ist der hoelzerne Umgang
WAND = 0.4                # so hoch seine Bretterwand
ERKER = 0.2               # die Ecktuermchen im Grundriss


def bauen():
    s = stoffe()
    zufall = random.Random(151)
    bodenfleck('fleck', (0.0, 0.0), 0.98, 0.98, s['erde'], zufall, rund=0.4)
    # Der hohe geboeschte Fuss, darunter eine Stufe aus hellem Stein.
    quader('plinthe', (BREIT + 0.14, BREIT + 0.14, 0.08), s['hellstein'], ort=(0, 0, 0.04), fase=0.012)
    stumpf('turmfuss', (0, 0), (BREIT + 0.12, BREIT + 0.12), (BREIT, BREIT), 0.08, SOCKEL, s['haustein'])
    quader('turm', (BREIT, BREIT, SCHAFT), s['haustein'], ort=(0, 0, SCHAFT / 2), fase=0.012)
    # Zwei Gesimse aus hellem Stein teilen den Schaft in drei Geschosse.
    for z in (1.3, 2.12):
        quader('gesims', (BREIT + 0.05, BREIT + 0.05, 0.06), s['hellstein'], ort=(0, 0, z), fase=0.012)
    # Eckquader: helle Steine im Wechsel an den zwei Kanten, die man sieht.
    for i in range(9):
        z = 0.95 + i * 0.2
        if abs(z - 1.3) < 0.08 or abs(z - 2.12) < 0.08:
            continue
        lang = 0.16 if i % 2 else 0.1
        quader('eckstein', (lang, 0.03, 0.1), s['hellstein'], ort=(BREIT / 2 - lang / 2, -BREIT / 2 - 0.004, z), fase=0.006)
        quader('eckstein', (0.03, lang, 0.1), s['hellstein'], ort=(BREIT / 2 + 0.004, -BREIT / 2 + lang / 2, z), fase=0.006)
        quader('eckstein', (lang, 0.03, 0.1), s['hellstein'], ort=(-BREIT / 2 + lang / 2, -BREIT / 2 - 0.004, z), fase=0.006)

    v = rahmen((0, -BREIT / 2, 0), VORN)
    r = rahmen((BREIT / 2, 0, 0), RECHTS)
    # Der Eingang liegt hoch, wie bei jedem Bergfried: eine Tuer ueber der
    # Boeschung, davor ein Podest auf zwei Kragsteinen.
    tuer(rahmen((0, -BREIT / 2 - 0.02, 0), VORN), 0, s, breite=0.22, hoehe=0.44, z=SOCKEL + 0.02, sturz=False)
    quader('tuersturz', (0.34, 0.08, 0.07), s['hellstein'], ort=(0, -0.03, SOCKEL + 0.5), eltern=v, fase=0.01)
    quader('podest', (0.4, 0.16, 0.04), s['bohle'], ort=(0, -BREIT / 2 - 0.1, SOCKEL), fase=0.006)
    for x in (-0.14, 0.14):
        quader('podeststein', (0.07, 0.14, 0.1), s['haustein'], ort=(x, -BREIT / 2 - 0.06, SOCKEL - 0.07), fase=0.008)
    # Drei Reihen Scharten: je Geschoss eine, nach oben mehr.
    schlitz(r, 0, 1.0, s, hoehe=0.24)
    for wand in (v, r):
        for x in (-0.2, 0.2):
            schlitz(wand, x, 1.72, s, hoehe=0.28)
        for x in (-0.24, 0.0, 0.24):
            schlitz(wand, x, 2.46, s, hoehe=0.26)

    # Die Hurde: ein hoelzerner Umgang auf Kragbalken, der ueber den Schaft
    # hinausragt - von dort wirft und schiesst man senkrecht hinab.
    for i in range(5):
        d = -BREIT / 2 + 0.07 + i * (BREIT - 0.14) / 4
        for seite in (-1, 1):
            quader('kragbalken', (0.06, HURDE - BREIT + 0.1, 0.07), s['balken'],
                   ort=(d, seite * (BREIT / 2 + (HURDE - BREIT) / 4), SCHAFT - 0.04), fase=0.006)
            quader('kragbalken', (HURDE - BREIT + 0.1, 0.06, 0.07), s['balken'],
                   ort=(seite * (BREIT / 2 + (HURDE - BREIT) / 4), d, SCHAFT - 0.04), fase=0.006)
            # Eine Strebe unter jedem zweiten Balken.
            if i % 2 == 0:
                quader('strebe', (0.045, 0.045, 0.3), s['balken'], ort=(d, seite * (BREIT / 2 + 0.07), SCHAFT - 0.2),
                       drehung=(-seite * 0.5, 0, 0), fase=0.004)
                quader('strebe', (0.045, 0.045, 0.3), s['balken'], ort=(seite * (BREIT / 2 + 0.07), d, SCHAFT - 0.2),
                       drehung=(0, seite * 0.5, 0), fase=0.004)
    quader('hurdenboden', (HURDE, HURDE, 0.05), s['bohle'], ort=(0, 0, SCHAFT + 0.025), fase=0.008)
    quader('kern', (BREIT, BREIT, WAND + 0.05), s['haustein'], ort=(0, 0, SCHAFT + 0.05 + WAND / 2), fase=0.01)
    unten = SCHAFT + 0.05
    # Die Bretterwand: stehende Bohlen, dazwischen Luken.
    bretter = 9
    for i in range(bretter):
        d = -HURDE / 2 + (i + 0.5) * HURDE / bretter
        hoch = WAND - (0.12 if i in (2, 6) else 0.0)
        stoff = s['bohle'] if i % 2 else s['brett']
        for seite in (-1, 1):
            quader('hurdenbrett', (HURDE / bretter - 0.008, 0.035, hoch), stoff, ort=(d, seite * (HURDE / 2 - 0.018), unten + hoch / 2),
                   fase=0.004)
            quader('hurdenbrett', (0.035, HURDE / bretter - 0.008, hoch), stoff, ort=(seite * (HURDE / 2 - 0.018), d, unten + hoch / 2),
                   fase=0.004)
    for seite in (-1, 1):
        quader('hurdenholm', (HURDE + 0.02, 0.05, 0.045), s['balken'], ort=(0, seite * (HURDE / 2 - 0.018), unten + WAND + 0.02), fase=0.006)
        quader('hurdenholm', (0.05, HURDE + 0.02, 0.045), s['balken'], ort=(seite * (HURDE / 2 - 0.018), 0, unten + WAND + 0.02), fase=0.006)
    traufe = unten + WAND + 0.045

    # Vier Ecktuermchen mit spitzen Hueten, hoeher als die Traufe.
    for sx in (-1, 1):
        for sy in (-1, 1):
            ort = (sx * (HURDE / 2 - 0.03), sy * (HURDE / 2 - 0.03))
            quader('erker', (ERKER, ERKER, WAND + 0.5), s['haustein'], ort=(ort[0], ort[1], SCHAFT - 0.16 + (WAND + 0.5) / 2),
                   fase=0.012)
            stumpf('erkerfuss', ort, (0.06, 0.06), (ERKER, ERKER), SCHAFT - 0.36, SCHAFT - 0.16, s['haustein'])
            quader('erkersims', (ERKER + 0.04, ERKER + 0.04, 0.04), s['hellstein'], ort=(ort[0], ort[1], SCHAFT + WAND + 0.34),
                   fase=0.008)
            kegeldach(ort, ERKER * 0.78, SCHAFT + WAND + 0.36, 0.4, s['schiefer'], ecken=4, drehung=0.785398)
    for sx, sy, wand in ((1, -1, VORN), (-1, -1, VORN), (1, -1, RECHTS), (1, 1, RECHTS)):
        if wand == VORN:
            schlitz(rahmen((sx * (HURDE / 2 - 0.03), -HURDE / 2 + 0.03 - ERKER / 2, 0), VORN), 0, SCHAFT + 0.3, s, hoehe=0.2, breite=0.035)
        else:
            schlitz(rahmen((HURDE / 2 - 0.03 + ERKER / 2, sy * (HURDE / 2 - 0.03), 0), RECHTS), 0, SCHAFT + 0.3, s, hoehe=0.2, breite=0.035)

    # Der Helm: steil, aus Schiefer, mit einem Knauf unter der Fahne.
    walmdach((0, 0), HURDE - 0.1, HURDE - 0.1, traufe, 0.95, s['schiefer'], firstlaenge=0, ueber=0.05,
             lagen=9, zufall=zufall, ziegel=0.09)
    quader('knauf', (0.07, 0.07, 0.07), s['eisen'], ort=(0, 0, traufe + 0.95), fase=0.02)

    fahne((0, 0, traufe + 0.9), 0.56, s, lang=0.46, hoch=0.28)
    banner((BREIT / 2 + 0.04, 0, SCHAFT - 0.5), s, breit=0.32, lang=0.62, richtung=(0, 1, 0))
    banner((0, -BREIT / 2 - 0.04, SCHAFT - 0.5), s, breit=0.3, lang=0.5, richtung=(1, 0, 0))


def tafel(ziel):
    return einzeltafel('bergfried', FELDER, 4.95, ziel, bauen)
