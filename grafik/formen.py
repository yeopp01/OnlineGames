# Formen: die wenigen Grundkoerper, aus denen jedes Modell gebaut ist.
#
# Ein Modell ist ein Skript. Es ruft diese Funktionen und speichert nichts
# von Hand - wer das Skript hat, hat das Modell (ADR-0016, Punkt 2).

import math

import bmesh
import bpy


def _ablegen(name, daten, stoff, eltern, ort, drehung):
    koerper = bpy.data.objects.new(name, daten)
    bpy.context.scene.collection.objects.link(koerper)
    koerper.location = ort
    koerper.rotation_euler = drehung
    if eltern is not None:
        koerper.parent = eltern
    if stoff is not None:
        daten.materials.append(stoff)
    return koerper


def _fertig(netz, glatt):
    b = bmesh.new()
    b.from_mesh(netz)
    bmesh.ops.recalc_face_normals(b, faces=b.faces[:])
    b.to_mesh(netz)
    b.free()
    if glatt:
        netz.polygons.foreach_set('use_smooth', [True] * len(netz.polygons))
    netz.update()


def leer(name, ort=(0, 0, 0), eltern=None):
    """Ein Gelenk: nichts zu sehen, aber alles darunter dreht sich mit."""
    gelenk = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(gelenk)
    gelenk.location = ort
    if eltern is not None:
        gelenk.parent = eltern
    return gelenk


def tiefster_punkt(wurzel):
    """Die tiefste Ecke von allem, was an `wurzel` haengt - in der Welt."""
    bpy.context.view_layer.update()
    tief = None
    stapel = [wurzel]
    while stapel:
        o = stapel.pop()
        stapel.extend(o.children)
        if o.type != 'MESH' or not o.data.vertices:
            continue
        # Nur die Hoehe: die dritte Zeile der Lage genuegt.
        zx, zy, zz, zw = o.matrix_world[2]
        unten = min(zx * v.co.x + zy * v.co.y + zz * v.co.z + zw for v in o.data.vertices)
        tief = unten if tief is None else min(tief, unten)
    return 0.0 if tief is None else tief


def aufsetzen(wurzel, gelenk, nur_heben=False):
    """Hebt oder senkt `gelenk`, bis das Tiefste unter `wurzel` den Boden
    beruehrt. Fuer alles, was faellt und liegt: dort laesst sich die Hoehe
    nicht mehr aus den Beinen rechnen. Gibt die neue Hoehe des Gelenks zurueck.
    """
    tief = tiefster_punkt(wurzel)
    if nur_heben and tief >= 0:
        return gelenk.location.z
    # Das Gelenk misst in seinem eigenen Mass: Weltmeter durch die Streckung
    # dessen, woran es haengt.
    mass = gelenk.parent.matrix_world.to_scale().z if gelenk.parent else 1.0
    gelenk.location.z -= tief / mass
    bpy.context.view_layer.update()
    return gelenk.location.z


def quader(name, mass, stoff, ort=(0, 0, 0), drehung=(0, 0, 0), eltern=None, fase=0.012):
    """Ein Balken, ein Brett, ein Stein. `mass` ist Breite, Tiefe, Hoehe."""
    x, y, z = mass[0] / 2, mass[1] / 2, mass[2] / 2
    ecken = [(-x, -y, -z), (x, -y, -z), (x, y, -z), (-x, y, -z),
             (-x, -y, z), (x, -y, z), (x, y, z), (-x, y, z)]
    seiten = [(0, 1, 2, 3), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    netz = bpy.data.meshes.new(name)
    netz.from_pydata(ecken, [], seiten)
    _fertig(netz, False)
    koerper = _ablegen(name, netz, stoff, eltern, ort, drehung)
    if fase > 0:
        kante = koerper.modifiers.new('fase', 'BEVEL')
        kante.width = min(fase, min(mass) * 0.35)
        kante.segments = 2
    return koerper


def drehkoerper(name, profil, stoff, ort=(0, 0, 0), drehung=(0, 0, 0), eltern=None,
                teile=16, streckung=(1, 1), glatt=True):
    """Ein Profil aus (Hoehe, Halbmesser) um die Hochachse gedreht.

    Halbmesser 0 schliesst den Koerper mit einer Spitze. `streckung` macht
    aus dem Kreis ein Oval - ein Rumpf ist breiter als tief.
    """
    ecken = []
    ringe = []
    for z, r in profil:
        if r <= 0:
            ringe.append([len(ecken)])
            ecken.append((0, 0, z))
        else:
            ring = []
            for i in range(teile):
                w = 2 * math.pi * i / teile
                ring.append(len(ecken))
                ecken.append((math.cos(w) * r * streckung[0], math.sin(w) * r * streckung[1], z))
            ringe.append(ring)
    seiten = []
    for a, b in zip(ringe, ringe[1:]):
        for i in range(teile):
            j = (i + 1) % teile
            if len(a) == 1 and len(b) == 1:
                continue
            if len(a) == 1:
                seiten.append((a[0], b[i], b[j]))
            elif len(b) == 1:
                seiten.append((a[i], a[j], b[0]))
            else:
                seiten.append((a[i], a[j], b[j], b[i]))
    netz = bpy.data.meshes.new(name)
    netz.from_pydata(ecken, [], seiten)
    _fertig(netz, glatt)
    return _ablegen(name, netz, stoff, eltern, ort, drehung)


def glied(name, laenge, oben, unten, stoff, eltern=None, ort=(0, 0, 0), teile=12):
    """Ein Arm- oder Beinstueck: haengt vom Gelenk nach unten, an beiden
    Enden gerundet, damit es im Knick nicht aufklafft."""
    profil = [(oben * 0.9, 0), (oben * 0.55, oben * 0.75), (0, oben),
              (-laenge, unten), (-laenge - unten * 0.55, unten * 0.75), (-laenge - unten * 0.9, 0)]
    return drehkoerper(name, profil, stoff, ort=ort, eltern=eltern, teile=teile)


def kugel(name, halbmesser, stoff, ort=(0, 0, 0), eltern=None, streckung=(1, 1, 1),
          teile=16, ringe=10, weglassen=None):
    """Eine Kugel, auf Wunsch gestreckt. `weglassen(x, y, z)` schneidet ein
    Stueck heraus - so wird aus einer Kugel eine Kapuze mit Gesichtsfeld."""
    ecken = [(0, 0, 1)]
    for i in range(1, ringe):
        v = math.pi * i / ringe
        for j in range(teile):
            w = 2 * math.pi * j / teile
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
    if weglassen is not None:
        def bleibt(seite):
            m = [sum(ecken[e][achse] for e in seite) / len(seite) for achse in range(3)]
            return not weglassen(*m)
        seiten = [s for s in seiten if bleibt(s)]
    ecken = [(x * halbmesser * streckung[0], y * halbmesser * streckung[1], z * halbmesser * streckung[2])
             for x, y, z in ecken]
    netz = bpy.data.meshes.new(name)
    netz.from_pydata(ecken, [], seiten)
    _fertig(netz, True)
    koerper = _ablegen(name, netz, stoff, eltern, ort, (0, 0, 0))
    if weglassen is not None:
        dicke = koerper.modifiers.new('dicke', 'SOLIDIFY')
        dicke.thickness = halbmesser * 0.12
        dicke.offset = 1
    return koerper


def prisma(name, umriss, dicke, stoff, ort=(0, 0, 0), drehung=(0, 0, 0), eltern=None, fase=0.0):
    """Ein Umriss in der Ebene X-Z, um `dicke` entlang Y gezogen - Giebel."""
    n = len(umriss)
    ecken = [(x, -dicke / 2, z) for x, z in umriss] + [(x, dicke / 2, z) for x, z in umriss]
    seiten = [tuple(range(n)), tuple(range(n, 2 * n))]
    for i in range(n):
        j = (i + 1) % n
        seiten.append((i, j, n + j, n + i))
    netz = bpy.data.meshes.new(name)
    netz.from_pydata(ecken, [], seiten)
    _fertig(netz, False)
    koerper = _ablegen(name, netz, stoff, eltern, ort, drehung)
    if fase > 0:
        kante = koerper.modifiers.new('fase', 'BEVEL')
        kante.width = fase
        kante.segments = 2
    return koerper


def netz(name, ecken, seiten, stoff, ort=(0, 0, 0), drehung=(0, 0, 0), eltern=None,
         glatt=False, dicke=0.0, uv=None, farben=None):
    """Ein freies Netz - fuer alles, was kein Grundkoerper ist."""
    daten = bpy.data.meshes.new(name)
    daten.from_pydata(ecken, [], seiten)
    if uv is not None:
        lage = daten.uv_layers.new(name='uv')
        for schleife in daten.loops:
            lage.data[schleife.index].uv = uv[schleife.vertex_index]
    if farben is not None:
        merkmal = daten.color_attributes.new('farbe', 'FLOAT_COLOR', 'POINT')
        merkmal.data.foreach_set('color', [c for f in farben for c in f])
    if uv is None and farben is None:
        _fertig(daten, glatt)
    else:
        if glatt:
            daten.polygons.foreach_set('use_smooth', [True] * len(daten.polygons))
        daten.update()
    koerper = _ablegen(name, daten, stoff, eltern, ort, drehung)
    if dicke > 0:
        staerke = koerper.modifiers.new('dicke', 'SOLIDIFY')
        staerke.thickness = dicke
        staerke.offset = -1
    return koerper


def strang(name, punkte, stoff, eltern=None, ort=(0, 0, 0), rund=4):
    """Ein Rohr entlang von Punkten (x, y, z, Halbmesser) - Stamm, Ast, Stiel."""
    kurve = bpy.data.curves.new(name, 'CURVE')
    kurve.dimensions = '3D'
    kurve.bevel_depth = 1.0
    kurve.bevel_resolution = rund
    kurve.use_fill_caps = True
    zug = kurve.splines.new('BEZIER')
    zug.bezier_points.add(len(punkte) - 1)
    for punkt, (x, y, z, r) in zip(zug.bezier_points, punkte):
        punkt.co = (x, y, z)
        punkt.radius = r
        punkt.handle_left_type = 'AUTO'
        punkt.handle_right_type = 'AUTO'
    return _ablegen(name, kurve, stoff, eltern, ort, (0, 0, 0))
