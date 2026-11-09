# Stoffe: Oberflaechen als Knotennetze, ohne eine einzige Bilddatei.
#
# Jede Oberflaeche ist Rauschen in den Farben des Materials, dazu ein Relief
# aus demselben Rauschen und Dunkel in den Fugen. Was Spielerfarbe traegt,
# ist hell und unbunt und bekommt das Kennzeichen `spielerfarbe` - die Kette
# rendert daraus die Maske, der Browser faerbt ein.

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


def einfarbig(name, hex_wert, rau=0.7, metall=0.0, spieler=False):
    stoff, netz, flaeche = _grund(name)
    flaeche.inputs['Base Color'].default_value = farbe(hex_wert)
    flaeche.inputs['Roughness'].default_value = rau
    flaeche.inputs['Metallic'].default_value = metall
    if spieler:
        stoff['spielerfarbe'] = True
    return stoff
