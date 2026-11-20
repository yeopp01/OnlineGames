# Stoffe: Oberflaechen als Knotennetze, ohne eine einzige Bilddatei.
#
# Jede Oberflaeche ist Rauschen in den Farben des Materials, dazu ein Relief
# aus demselben Rauschen und Dunkel in den Fugen. Was Spielerfarbe traegt,
# ist hell und unbunt und bekommt das Kennzeichen `spielerfarbe` - die Kette
# rendert daraus die Maske, der Browser faerbt ein.

import math

import bpy


def farbe(hex_wert):
    """'#8a5a2b' -> lineare Werte, wie Blender sie rechnet."""
    h = hex_wert.lstrip('#')
    werte = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        werte.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*werte, 1.0)


def _grund(name):
    stoff = bpy.data.materials.new(name)
    stoff.use_nodes = True
    netz = stoff.node_tree
    netz.nodes.clear()
    flaeche = netz.nodes.new('ShaderNodeBsdfPrincipled')
    aus = netz.nodes.new('ShaderNodeOutputMaterial')
    netz.links.new(flaeche.outputs[0], aus.inputs[0])
    return stoff, netz, flaeche


def _mischen(netz, anteil, a, b, art='MIX'):
    k = netz.nodes.new('ShaderNodeMix')
    k.data_type = 'RGBA'
    k.blend_type = art
    for eingang, wert in ((0, anteil), (6, a), (7, b)):
        if hasattr(wert, 'links') or hasattr(wert, 'is_linked'):
            netz.links.new(wert, k.inputs[eingang])
        else:
            k.inputs[eingang].default_value = wert
    return k.outputs[2]


def gemustert(name, farben, massstab=(1, 1, 1), groesse=8.0, detail=6.0, rau=0.85,
              relief=0.4, fugen=0.0, koordinaten='Object', spieler=False, glanz=None,
              metall=0.0, kontrast=(0.3, 0.7)):
    """Rauschen zwischen zwei oder drei Farben, mit Relief.

    massstab  streckt das Muster je Achse - (1, 1, 12) gibt Fasern laengs Z
    fugen     wie stark Ritzen und Ecken nachdunkeln (0 bis 1)
    """
    stoff, netz, flaeche = _grund(name)
    k = netz.nodes
    ort = k.new('ShaderNodeTexCoord')
    lage = k.new('ShaderNodeMapping')
    lage.inputs['Scale'].default_value = massstab
    netz.links.new(ort.outputs[koordinaten], lage.inputs['Vector'])

    rauschen = k.new('ShaderNodeTexNoise')
    rauschen.inputs['Scale'].default_value = groesse
    rauschen.inputs['Detail'].default_value = detail
    netz.links.new(lage.outputs[0], rauschen.inputs['Vector'])

    verlauf = k.new('ShaderNodeValToRGB')
    stufen = verlauf.color_ramp.elements
    stufen[0].position = kontrast[0]
    stufen[0].color = farbe(farben[0])
    stufen[1].position = kontrast[1]
    stufen[1].color = farbe(farben[-1])
    if len(farben) == 3:
        mitte = stufen.new((kontrast[0] + kontrast[1]) / 2)
        mitte.color = farbe(farben[1])
    netz.links.new(rauschen.outputs[0], verlauf.inputs[0])
    ton = verlauf.outputs[0]

    if fugen > 0:
        enge = k.new('ShaderNodeAmbientOcclusion')
        enge.inputs['Distance'].default_value = 0.12
        enge.samples = 8
        dunkel = _mischen(netz, fugen, ton, enge.outputs[0], 'MULTIPLY')
        ton = dunkel
    netz.links.new(ton, flaeche.inputs['Base Color'])

    flaeche.inputs['Roughness'].default_value = rau if glanz is None else glanz
    flaeche.inputs['Metallic'].default_value = metall
    if relief > 0:
        hoehe = k.new('ShaderNodeBump')
        hoehe.inputs['Strength'].default_value = relief
        hoehe.inputs['Distance'].default_value = 0.02
        netz.links.new(rauschen.outputs[0], hoehe.inputs['Height'])
        netz.links.new(hoehe.outputs[0], flaeche.inputs['Normal'])
    if spieler:
        stoff['spielerfarbe'] = True
    return stoff


def feldstein(name, farben=('#8f8a80', '#b3ada0', '#6f6a62'), groesse=9.0):
    """Bruchstein: Zellen in drei Grautoenen, dunkle Fugen dazwischen."""
    stoff, netz, flaeche = _grund(name)
    k = netz.nodes
    ort = k.new('ShaderNodeTexCoord')
    zellen = k.new('ShaderNodeTexVoronoi')
    zellen.inputs['Scale'].default_value = groesse
    netz.links.new(ort.outputs['Object'], zellen.inputs['Vector'])
    kanten = k.new('ShaderNodeTexVoronoi')
    kanten.feature = 'DISTANCE_TO_EDGE'
    kanten.inputs['Scale'].default_value = groesse
    netz.links.new(ort.outputs['Object'], kanten.inputs['Vector'])

    verlauf = k.new('ShaderNodeValToRGB')
    stufen = verlauf.color_ramp.elements
    stufen[0].position = 0.15
    stufen[0].color = farbe(farben[2])
    stufen[1].position = 0.85
    stufen[1].color = farbe(farben[1])
    mitte = stufen.new(0.5)
    mitte.color = farbe(farben[0])
    netz.links.new(zellen.outputs[1], verlauf.inputs[0])

    fuge = k.new('ShaderNodeValToRGB')
    fuge.color_ramp.elements[0].position = 0.0
    fuge.color_ramp.elements[0].color = (0.05, 0.045, 0.04, 1)
    fuge.color_ramp.elements[1].position = 0.08
    fuge.color_ramp.elements[1].color = (1, 1, 1, 1)
    netz.links.new(kanten.outputs[0], fuge.inputs[0])
    ton = _mischen(netz, 1.0, verlauf.outputs[0], fuge.outputs[0], 'MULTIPLY')
    netz.links.new(ton, flaeche.inputs['Base Color'])
    flaeche.inputs['Roughness'].default_value = 0.9
    hoehe = k.new('ShaderNodeBump')
    hoehe.inputs['Strength'].default_value = 0.8
    hoehe.inputs['Distance'].default_value = 0.03
    netz.links.new(fuge.outputs[0], hoehe.inputs['Height'])
    netz.links.new(hoehe.outputs[0], flaeche.inputs['Normal'])
    return stoff


def aus_merkmal(name, merkmal='farbe', rau=0.6, durchschein=0.0):
    """Die Farbe kommt je Ecke aus dem Netz - fuer Laub, jedes Blatt anders."""
    stoff, netz, flaeche = _grund(name)
    lesen = netz.nodes.new('ShaderNodeAttribute')
    lesen.attribute_name = merkmal
    netz.links.new(lesen.outputs[0], flaeche.inputs['Base Color'])
    flaeche.inputs['Roughness'].default_value = rau
    return stoff


def erz(name, gestein, metall_farbe, anteil=0.4, groesse=5.0, rau_metall=0.3, relief=0.9, fugen=0.5):
    """Gestein mit Adern aus Metall: wo das zweite Rauschen ueber der Schwelle
    liegt, ist die Flaeche Metall - sie spiegelt Himmel und Sonne, statt in
    ihrer Farbe zu leuchten."""
    stoff, netz, flaeche = _grund(name)
    k = netz.nodes
    ort = k.new('ShaderNodeTexCoord')
    rauschen = k.new('ShaderNodeTexNoise')
    rauschen.inputs['Scale'].default_value = groesse * 1.8
    rauschen.inputs['Detail'].default_value = 6
    netz.links.new(ort.outputs['Object'], rauschen.inputs['Vector'])
    verlauf = k.new('ShaderNodeValToRGB')
    stufen = verlauf.color_ramp.elements
    stufen[0].position = 0.3
    stufen[0].color = farbe(gestein[0])
    stufen[1].position = 0.7
    stufen[1].color = farbe(gestein[-1])
    if len(gestein) == 3:
        stufen.new(0.5).color = farbe(gestein[1])
    netz.links.new(rauschen.outputs[0], verlauf.inputs[0])

    adern = k.new('ShaderNodeTexNoise')
    adern.inputs['Scale'].default_value = groesse
    adern.inputs['Detail'].default_value = 3
    adern.inputs['Distortion'].default_value = 1.2
    netz.links.new(ort.outputs['Object'], adern.inputs['Vector'])
    schwelle = k.new('ShaderNodeValToRGB')
    schwelle.color_ramp.elements[0].position = 1 - anteil - 0.03
    schwelle.color_ramp.elements[0].color = (0, 0, 0, 1)
    schwelle.color_ramp.elements[1].position = 1 - anteil + 0.03
    schwelle.color_ramp.elements[1].color = (1, 1, 1, 1)
    netz.links.new(adern.outputs[0], schwelle.inputs[0])

    ton = verlauf.outputs[0]
    if fugen > 0:
        enge = k.new('ShaderNodeAmbientOcclusion')
        enge.inputs['Distance'].default_value = 0.1
        enge.samples = 8
        ton = _mischen(netz, fugen, ton, enge.outputs[0], 'MULTIPLY')
    netz.links.new(_mischen(netz, schwelle.outputs[0], ton, farbe(metall_farbe)), flaeche.inputs['Base Color'])
    netz.links.new(schwelle.outputs[0], flaeche.inputs['Metallic'])
    rau = k.new('ShaderNodeMapRange')
    rau.inputs['To Min'].default_value = 0.9
    rau.inputs['To Max'].default_value = rau_metall
    netz.links.new(schwelle.outputs[0], rau.inputs['Value'])
    netz.links.new(rau.outputs[0], flaeche.inputs['Roughness'])
    hoehe = k.new('ShaderNodeBump')
    hoehe.inputs['Strength'].default_value = relief
    hoehe.inputs['Distance'].default_value = 0.02
    netz.links.new(rauschen.outputs[0], hoehe.inputs['Height'])
    netz.links.new(hoehe.outputs[0], flaeche.inputs['Normal'])
    return stoff


def _ring(netz, periode):
    """Ein Ort, der sich nach `periode` wiederholt - laengs der zwei Achsen
    des Bildes am Boden (nach rechts und nach hinten).

    Rauschen an diesem Ort hat keine Naht: jede Achse laeuft einen Kreis ab,
    zwei Kreise brauchen vier Werte, also Rauschen in vier Richtungen. Der
    Halbmesser ist so gewaehlt, dass ein Schritt am Boden ein gleich langer
    Schritt auf dem Kreis ist - `groesse` bedeutet dasselbe wie sonst.
    """
    k = netz.nodes
    ort = k.new('ShaderNodeNewGeometry')
    halbmesser = periode / (2 * math.pi)
    werte = []
    for achse in ((1, 1, 0), (-1, 1, 0)):
        entlang = k.new('ShaderNodeVectorMath')
        entlang.operation = 'DOT_PRODUCT'
        netz.links.new(ort.outputs['Position'], entlang.inputs[0])
        entlang.inputs[1].default_value = tuple(c / math.sqrt(2) for c in achse)
        winkel = k.new('ShaderNodeMath')
        winkel.operation = 'MULTIPLY'
        winkel.inputs[1].default_value = 1 / halbmesser
        netz.links.new(entlang.outputs['Value'], winkel.inputs[0])
        for art in ('COSINE', 'SINE'):
            kreis = k.new('ShaderNodeMath')
            kreis.operation = art
            netz.links.new(winkel.outputs[0], kreis.inputs[0])
            weit = k.new('ShaderNodeMath')
            weit.operation = 'MULTIPLY'
            weit.inputs[1].default_value = halbmesser
            netz.links.new(kreis.outputs[0], weit.inputs[0])
            werte.append(weit.outputs[0])
    return werte


def _ringrauschen(netz, ring, groesse, detail, saat, verzerrt=0.0):
    k = netz.nodes
    vektor = k.new('ShaderNodeCombineXYZ')
    for i in range(3):
        versetzt = k.new('ShaderNodeMath')
        versetzt.operation = 'ADD'
        versetzt.inputs[1].default_value = saat * 17.3 + i * 5.1
        netz.links.new(ring[i], versetzt.inputs[0])
        netz.links.new(versetzt.outputs[0], vektor.inputs[i])
    rauschen = k.new('ShaderNodeTexNoise')
    rauschen.noise_dimensions = '4D'
    rauschen.inputs['Scale'].default_value = groesse
    rauschen.inputs['Detail'].default_value = detail
    rauschen.inputs['Distortion'].default_value = verzerrt
    netz.links.new(vektor.outputs[0], rauschen.inputs['Vector'])
    netz.links.new(ring[3], rauschen.inputs['W'])
    return rauschen.outputs[0]


def gekachelt(name, farben, periode, groesse=0.6, fein=7.0, koernung=0.22, rau=0.95, relief=0.5,
              kontrast=(0.3, 0.7), saat=0):
    """Ein Boden ohne Naht: grosse Flecken zwischen den Farben, darueber eine
    feine Koernung, die heller und dunkler macht und das Relief gibt."""
    stoff, netz, flaeche = _grund(name)
    k = netz.nodes
    ring = _ring(netz, periode)
    flecken = _ringrauschen(netz, ring, groesse, 5.0, saat, verzerrt=0.6)
    korn = _ringrauschen(netz, ring, fein, 4.0, saat + 1)

    verlauf = k.new('ShaderNodeValToRGB')
    stufen = verlauf.color_ramp.elements
    stufen[0].position = kontrast[0]
    stufen[0].color = farbe(farben[0])
    stufen[1].position = kontrast[1]
    stufen[1].color = farbe(farben[-1])
    innen = farben[1:-1]
    for i, ton in enumerate(innen):
        stufen.new(kontrast[0] + (kontrast[1] - kontrast[0]) * (i + 1) / (len(innen) + 1)).color = farbe(ton)
    netz.links.new(flecken, verlauf.inputs[0])

    hell = k.new('ShaderNodeMapRange')
    hell.inputs['From Min'].default_value = 0.3
    hell.inputs['From Max'].default_value = 0.7
    hell.inputs['To Min'].default_value = 1 - koernung
    hell.inputs['To Max'].default_value = 1 + koernung
    netz.links.new(korn, hell.inputs['Value'])
    mal = k.new('ShaderNodeVectorMath')
    mal.operation = 'SCALE'
    netz.links.new(verlauf.outputs[0], mal.inputs[0])
    netz.links.new(hell.outputs[0], mal.inputs['Scale'])
    netz.links.new(mal.outputs[0], flaeche.inputs['Base Color'])
    flaeche.inputs['Roughness'].default_value = rau
    # Boden glaenzt kaum: sonst legt der Himmel einen grauen Schleier ueber
    # alles Dunkle (Waldboden, Probe R3).
    flaeche.inputs['Specular IOR Level'].default_value = 0.2
    if relief > 0:
        hoehe = k.new('ShaderNodeBump')
        hoehe.inputs['Strength'].default_value = relief
        hoehe.inputs['Distance'].default_value = 0.03
        netz.links.new(korn, hoehe.inputs['Height'])
        netz.links.new(hoehe.outputs[0], flaeche.inputs['Normal'])
    return stoff


def wasser(name, periode, grund='#1c3b40', saat=0):
    """Stehendes Wasser ohne Naht: eine dunkle, glatte Flaeche, die den Himmel
    spiegelt; zwei Lagen flacher Wellen brechen die Spiegelung."""
    stoff, netz, flaeche = _grund(name)
    k = netz.nodes
    ring = _ring(netz, periode)
    gross = _ringrauschen(netz, ring, 2.2, 2.0, saat, verzerrt=0.4)
    klein = _ringrauschen(netz, ring, 9.0, 3.0, saat + 1, verzerrt=0.8)
    summe = k.new('ShaderNodeMath')
    summe.operation = 'MULTIPLY_ADD'
    summe.inputs[1].default_value = 0.45
    netz.links.new(klein, summe.inputs[0])
    netz.links.new(gross, summe.inputs[2])
    # Tiefer und flacher: dasselbe grosse Rauschen toent den Grund.
    verlauf = k.new('ShaderNodeValToRGB')
    verlauf.color_ramp.elements[0].position = 0.3
    verlauf.color_ramp.elements[0].color = tuple(c * 0.75 for c in farbe(grund)[:3]) + (1.0,)
    verlauf.color_ramp.elements[1].position = 0.7
    verlauf.color_ramp.elements[1].color = tuple(min(1.0, c * 1.3) for c in farbe(grund)[:3]) + (1.0,)
    netz.links.new(gross, verlauf.inputs[0])
    netz.links.new(verlauf.outputs[0], flaeche.inputs['Base Color'])
    flaeche.inputs['Roughness'].default_value = 0.1
    hoehe = k.new('ShaderNodeBump')
    hoehe.inputs['Strength'].default_value = 1.0
    hoehe.inputs['Distance'].default_value = 0.12
    netz.links.new(summe.outputs[0], hoehe.inputs['Height'])
    netz.links.new(hoehe.outputs[0], flaeche.inputs['Normal'])
    return stoff


def einfarbig(name, hex_wert, rau=0.7, metall=0.0, spieler=False):
    stoff, netz, flaeche = _grund(name)
    flaeche.inputs['Base Color'].default_value = farbe(hex_wert)
    flaeche.inputs['Roughness'].default_value = rau
    flaeche.inputs['Metallic'].default_value = metall
    if spieler:
        stoff['spielerfarbe'] = True
    return stoff


def gefugt(name, farben, stein=(0.24, 0.12), fuge=0.012, fugenfarbe='#3a352e', koordinaten='wand',
           rau=0.9, relief=0.7, versatz=0.5, toenung=0.18, enge=0.5, glatt=0.1):
    """Steine in Reihen mit Fugen: Hausteinmauer, Dachziegel, Schindeln, Pflaster.

    stein         Breite und Hoehe eines Steins
    koordinaten   'wand': am Koerper - auf stehenden Flaechen laufen die Reihen
                  waagerecht, auf liegenden wird daraus ein Pflaster;
                  'UV': aus dem Netz (ein Dach nennt je Lage eine Reihe)
    toenung       wie stark ein Rauschen die Steine heller und dunkler macht
    """
    stoff, netz, flaeche = _grund(name)
    k = netz.nodes
    ort = k.new('ShaderNodeTexCoord')
    if koordinaten == 'UV':
        vektor = ort.outputs['UV']
    else:
        teile = k.new('ShaderNodeSeparateXYZ')
        netz.links.new(ort.outputs['Object'], teile.inputs[0])
        quer = k.new('ShaderNodeMath')
        quer.operation = 'ADD'
        netz.links.new(teile.outputs['X'], quer.inputs[0])
        netz.links.new(teile.outputs['Y'], quer.inputs[1])
        stehend = k.new('ShaderNodeCombineXYZ')
        netz.links.new(quer.outputs[0], stehend.inputs['X'])
        netz.links.new(teile.outputs['Z'], stehend.inputs['Y'])
        # Wo die Flaeche liegt (Mauerkrone, Platz), zaehlt der Grundriss.
        lage = k.new('ShaderNodeNewGeometry')
        normale = k.new('ShaderNodeVectorTransform')
        normale.vector_type = 'NORMAL'
        normale.convert_from = 'WORLD'
        normale.convert_to = 'OBJECT'
        netz.links.new(lage.outputs['Normal'], normale.inputs[0])
        hoch = k.new('ShaderNodeSeparateXYZ')
        netz.links.new(normale.outputs[0], hoch.inputs[0])
        betrag = k.new('ShaderNodeMath')
        betrag.operation = 'ABSOLUTE'
        netz.links.new(hoch.outputs['Z'], betrag.inputs[0])
        liegt = k.new('ShaderNodeMath')
        liegt.operation = 'GREATER_THAN'
        liegt.inputs[1].default_value = 0.7
        netz.links.new(betrag.outputs[0], liegt.inputs[0])
        vektor = _mischen(netz, liegt.outputs[0], stehend.outputs[0], ort.outputs['Object'])

    steine = k.new('ShaderNodeTexBrick')
    steine.offset = versatz
    steine.inputs['Scale'].default_value = 1.0
    steine.inputs['Brick Width'].default_value = stein[0]
    steine.inputs['Row Height'].default_value = stein[1]
    steine.inputs['Mortar Size'].default_value = fuge
    steine.inputs['Mortar Smooth'].default_value = glatt
    steine.inputs['Bias'].default_value = 0.0
    steine.inputs['Color1'].default_value = farbe(farben[0])
    steine.inputs['Color2'].default_value = farbe(farben[-1])
    steine.inputs['Mortar'].default_value = farbe(fugenfarbe)
    netz.links.new(vektor, steine.inputs['Vector'])
    ton = steine.outputs['Color']

    if toenung > 0:
        rauschen = k.new('ShaderNodeTexNoise')
        rauschen.inputs['Scale'].default_value = 7.0
        rauschen.inputs['Detail'].default_value = 6.0
        netz.links.new(ort.outputs['Object'], rauschen.inputs['Vector'])
        hell = k.new('ShaderNodeMapRange')
        hell.inputs['From Min'].default_value = 0.3
        hell.inputs['From Max'].default_value = 0.7
        hell.inputs['To Min'].default_value = 1 - toenung
        hell.inputs['To Max'].default_value = 1 + toenung
        netz.links.new(rauschen.outputs[0], hell.inputs['Value'])
        mal = k.new('ShaderNodeVectorMath')
        mal.operation = 'SCALE'
        netz.links.new(ton, mal.inputs[0])
        netz.links.new(hell.outputs[0], mal.inputs['Scale'])
        ton = mal.outputs[0]
    if enge > 0:
        ecke = k.new('ShaderNodeAmbientOcclusion')
        ecke.inputs['Distance'].default_value = 0.12
        ecke.samples = 8
        ton = _mischen(netz, enge, ton, ecke.outputs[0], 'MULTIPLY')
    netz.links.new(ton, flaeche.inputs['Base Color'])
    flaeche.inputs['Roughness'].default_value = rau
    if relief > 0:
        um = k.new('ShaderNodeMath')
        um.operation = 'SUBTRACT'
        um.inputs[0].default_value = 1.0
        netz.links.new(steine.outputs['Fac'], um.inputs[1])
        hoehe = k.new('ShaderNodeBump')
        hoehe.inputs['Strength'].default_value = relief
        hoehe.inputs['Distance'].default_value = 0.02
        netz.links.new(um.outputs[0], hoehe.inputs['Height'])
        netz.links.new(hoehe.outputs[0], flaeche.inputs['Normal'])
    return stoff


def glut(name, hex_wert='#ff7a1e', staerke=6.0):
    """Was von selbst leuchtet: die Esse der Schmiede, ein Feuer."""
    stoff, netz, flaeche = _grund(name)
    flaeche.inputs['Base Color'].default_value = farbe(hex_wert)
    flaeche.inputs['Emission Color'].default_value = farbe(hex_wert)
    flaeche.inputs['Emission Strength'].default_value = staerke
    flaeche.inputs['Roughness'].default_value = 0.8
    return stoff


def flammenhuelle(name, hex_wert='#ff4a0c', staerke=1.3):
    """Der Saum einer Flamme: eine Huelle, von der man nur die Innenseite
    sieht. Von vorn schaut man durch sie auf den hellen Kern, dahinter und
    am Rand steht ihre Rueckwand - so hat das Feuer aus jeder Richtung einen
    gelben Kern und einen roten Saum, ohne dass etwas durchscheinen muss.

    Die Staerke bleibt klein: in der Ansicht 'Standard' wird jeder Kanal bei 1
    gekappt, und ein Rot mit Staerke 6 steht als Gelb im Bild."""
    stoff = glut(name, hex_wert, staerke)
    netz = stoff.node_tree
    aus = next(k for k in netz.nodes if k.type == 'OUTPUT_MATERIAL')
    flaeche = aus.inputs['Surface'].links[0].from_node
    durch = netz.nodes.new('ShaderNodeBsdfTransparent')
    lage = netz.nodes.new('ShaderNodeNewGeometry')
    wahl = netz.nodes.new('ShaderNodeMixShader')
    netz.links.new(lage.outputs['Backfacing'], wahl.inputs['Fac'])
    netz.links.new(durch.outputs['BSDF'], wahl.inputs[1])
    netz.links.new(flaeche.outputs[0], wahl.inputs[2])
    netz.links.new(wahl.outputs['Shader'], aus.inputs['Surface'])
    return stoff
