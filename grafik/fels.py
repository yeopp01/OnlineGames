# Felsbrocken und Haufen daraus - die gemeinsame Form von Gold und Stein
# (darstellung AC-23).
#
# Ein Brocken ist eine grobe Kugel, deren Ecken einzeln verschoben sind, mit
# harten Flaechen und gebrochenen Kanten. Ein Haufen ist ein Dutzend davon:
# grosse in der Mitte, kleinere darum, Schutt am Rand. Der Vorrat hat vier
# Fuellstufen - je leerer, desto weniger Brocken und desto mehr Schutt.

import math
import random

from formen import netz


def brocken(name, zufall, halbmesser, stoff, ort, streckung=(1, 1, 0.8), kantig=0.3, teile=7, ringe=5):
    """Ein unregelmaessiger Stein. `kantig` ist, wie weit die Ecken streuen."""
    drehung = zufall.uniform(0, 2 * math.pi)
    ecken = [(0, 0, 1)]
    for i in range(1, ringe):
        v = math.pi * i / ringe
        for j in range(teile):
            w = 2 * math.pi * (j + 0.5 * (i % 2)) / teile + drehung
            ecken.append((math.sin(v) * math.cos(w), math.sin(v) * math.sin(w), math.cos(v)))
    ecken.append((0, 0, -1))
    letzte = len(ecken) - 1
    seiten = []
    for j in range(teile):
        k = (j + 1) % teile
        seiten.append((0, 1 + j, 1 + k))
        for i in range(ringe - 2):
            a = 1 + i * teile
            b = a + teile
            seiten.append((a + j, b + j, b + k, a + k))
        a = 1 + (ringe - 2) * teile
        seiten.append((a + j, letzte, a + k))
    verschoben = []
    for x, y, z in ecken:
        weit = halbmesser * (1 + zufall.uniform(-kantig, kantig * 0.6))
        verschoben.append((x * weit * streckung[0], y * weit * streckung[1], z * weit * streckung[2]))
    koerper = netz(name, verschoben, seiten, stoff, ort=ort,
                   drehung=(zufall.uniform(-0.25, 0.25), zufall.uniform(-0.25, 0.25), 0))
    kante = koerper.modifiers.new('fase', 'BEVEL')
    kante.width = halbmesser * 0.06
    kante.segments = 2
    return koerper


def haufen(zufall, stufe, gestein, schutt, obenauf=None, mass=1.0, block=1.0):
    """Ein Haufen in der Fuellstufe 4 (voll) bis 1 (fast leer).

    Alle Zufallswerte werden fuer den vollen Haufen gezogen und dann nach der
    Stufe gefiltert - so ist Stufe 2 derselbe Haufen wie Stufe 4, nur
    abgetragen, und nicht ein anderer.

    obenauf(zufall, ort, halbmesser)  setzt etwas auf einen Brocken (Goldklumpen)
    block                             > 1 macht die Brocken groesser
    """
    # Die Mitte zuerst - sie bleibt am laengsten. Abgetragen wird von oben
    # und von aussen: die Liste ist so sortiert, dass ihr Ende zuerst geht.
    plan = [(0.0, 0.0, 0.0, 0.3 * block)]
    ring = 5
    versatz = zufall.uniform(0, 2 * math.pi)
    for i in range(ring):
        w = versatz + 2 * math.pi * (i + zufall.uniform(-0.2, 0.2)) / ring
        weit = zufall.uniform(0.3, 0.4)
        plan.append((math.cos(w) * weit, math.sin(w) * weit, 0.0, zufall.uniform(0.16, 0.24) * block))
    for _ in range(3):
        w = zufall.uniform(0, 2 * math.pi)
        weit = zufall.uniform(0.05, 0.2)
        plan.append((math.cos(w) * weit, math.sin(w) * weit, zufall.uniform(0.26, 0.36) * block,
                     zufall.uniform(0.14, 0.2) * block))
    formen = [((zufall.uniform(0.85, 1.15), zufall.uniform(0.85, 1.15), zufall.uniform(0.7, 0.95)),
               zufall.getrandbits(32)) for _ in plan]
    kiesel = [(zufall.uniform(0, 2 * math.pi), zufall.uniform(0.12, 0.56), zufall.uniform(0.025, 0.06),
               zufall.getrandbits(32)) for _ in range(30)]

    bleiben = max(2, round(len(plan) * stufe / 4))
    schrumpf = 0.8 + 0.2 * stufe / 4
    for (x, y, z, r), (streckung, saat) in list(zip(plan, formen))[:bleiben]:
        eigen = random.Random(saat)
        r *= schrumpf * mass
        ort = (x * mass, y * mass, z * mass + r * streckung[2] * 0.55)
        brocken('brocken', eigen, r, gestein, ort, streckung=streckung)
        if obenauf is not None:
            obenauf(eigen, ort, r)
    # Schutt: je leerer, desto mehr.
    for w, weit, r, saat in kiesel[:10 + (4 - stufe) * 6]:
        eigen = random.Random(saat)
        brocken('kiesel', eigen, r * mass, schutt,
                (math.cos(w) * weit * mass, math.sin(w) * weit * mass, r * mass * 0.4),
                streckung=(1, 1, 0.7), teile=5, ringe=3)
