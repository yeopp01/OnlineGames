# Die Renderkette (ADR-0014): eine Szene, eine Kamera, ein Licht fuer alles.
#
# Laeuft in Blender, ohne Oberflaeche:
#   blender -b -P grafik/bilder.py -- haus baum dorfbewohner
#
# Ein Modell baut seine Koerper in die leere Szene, die Kette rendert je Bild
# zwei Fassungen - das Bild selbst und die Maske der Spielerfarbe - und setzt
# die Einzelbilder zu einer Tafel zusammen. Neben der Tafel liegt eine
# JSON-Datei, die dem Browser sagt, wo welches Bild steht.

import json
import math
import os
import tempfile

import bpy
import numpy as np
from mathutils import Vector

# Bildpunkte je Feldbreite (die Raute von Ecke zu Ecke). Im Spiel sind es 44
# bei Zoom 1; gerendert wird fuer Zoom 3, das Rad geht bis 2,5 - der Browser
# verkleinert also immer und vergroessert nie.
FELD_BREITE = 132
WURZEL2 = math.sqrt(2)

# Die Kamera schaut 30 Grad ueber dem Boden und 45 Grad gedreht: ein Feld
# wird zur Raute, doppelt so breit wie hoch (darstellung AC-1).
KAMERA_DREHUNG = (math.radians(60), 0, math.radians(45))

# Die Sonne: von links und von der Seite des Betrachters. Im Bild ist die
# linke Wand hell, die rechte liegt im eigenen Schatten, der Schlagschatten
# faellt nach rechts hinten.
SONNE_RICHTUNG = math.radians(65)   # wohin das Licht am Boden laeuft, von +X aus
SONNE_HOEHE = math.radians(50)

PROBEN = 96


def szene_leeren():
    """Eine leere Szene mit Himmel, Sonne, Schattenfaenger und Kamera."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    szene = bpy.context.scene
    r = szene.render
    r.engine = 'CYCLES'
    szene.cycles.device = 'CPU'
    szene.cycles.samples = PROBEN
    szene.cycles.use_denoising = False
    szene.cycles.max_bounces = 4
    r.film_transparent = True
    r.resolution_percentage = 100
    r.image_settings.file_format = 'PNG'
    r.image_settings.color_mode = 'RGBA'
    r.image_settings.color_depth = '8'
    r.image_settings.compression = 60
    szene.view_settings.view_transform = 'Standard'
    szene.view_settings.look = 'None'
    r.use_persistent_data = True

    welt = bpy.data.worlds.new('himmel')
    welt.use_nodes = True
    hintergrund = welt.node_tree.nodes.get('Background')
    if hintergrund is None:
        welt.node_tree.nodes.clear()
        hintergrund = welt.node_tree.nodes.new('ShaderNodeBackground')
        aus = welt.node_tree.nodes.new('ShaderNodeOutputWorld')
        welt.node_tree.links.new(hintergrund.outputs[0], aus.inputs[0])
    hintergrund.inputs[0].default_value = (0.62, 0.72, 0.9, 1)
    hintergrund.inputs[1].default_value = 0.8
    szene.world = welt

    licht = bpy.data.lights.new('sonne', 'SUN')
    licht.energy = 3.8
    licht.color = (1.0, 0.95, 0.86)
    licht.angle = math.radians(6)
    sonne = bpy.data.objects.new('sonne', licht)
    szene.collection.objects.link(sonne)
    lauf = Vector((
        math.cos(SONNE_RICHTUNG) * math.cos(SONNE_HOEHE),
        math.sin(SONNE_RICHTUNG) * math.cos(SONNE_HOEHE),
        -math.sin(SONNE_HOEHE),
    ))
    sonne.rotation_euler = lauf.to_track_quat('-Z', 'Y').to_euler()

    # Der Boden faengt nur Schatten: im Bild steht dort Durchsicht mit dem
    # Schatten als Dunkel - der Browser legt es ueber sein Gras.
    netz = bpy.data.meshes.new('boden')
    g = 30
    netz.from_pydata([(-g, -g, 0), (g, -g, 0), (g, g, 0), (-g, g, 0)], [], [(0, 1, 2, 3)])
    boden = bpy.data.objects.new('boden', netz)
    szene.collection.objects.link(boden)
    boden.is_shadow_catcher = True
    boden['kulisse'] = True

    daten = bpy.data.cameras.new('kamera')
    daten.type = 'ORTHO'
    daten.sensor_fit = 'HORIZONTAL'
    daten.clip_start = 0.5
    daten.clip_end = 200
    kamera = bpy.data.objects.new('kamera', daten)
    szene.collection.objects.link(kamera)
    kamera.rotation_euler = KAMERA_DREHUNG
    szene.camera = kamera
    return szene


def kamera_setzen(breite, hoehe, fuss):
    """Der Punkt (0, 0, 0) der Welt steht im Bild auf `fuss` (von links oben)."""
    szene = bpy.context.scene
    kamera = szene.camera
    szene.render.resolution_x = breite
    szene.render.resolution_y = hoehe
    kamera.data.ortho_scale = breite / FELD_BREITE * WURZEL2
    je_punkt = WURZEL2 / FELD_BREITE
    drehung = kamera.rotation_euler.to_matrix()
    rechts = drehung @ Vector((1, 0, 0))
    oben = drehung @ Vector((0, 1, 0))
    vor = drehung @ Vector((0, 0, -1))
    dx = (breite / 2 - fuss[0]) * je_punkt
    dy = (fuss[1] - hoehe / 2) * je_punkt
    kamera.location = rechts * dx + oben * dy - vor * 60


def _maske_stoffe():
    weiss = bpy.data.materials.get('maske-weiss')
    if weiss is None:
        weiss = bpy.data.materials.new('maske-weiss')
        weiss.use_nodes = True
        k = weiss.node_tree
        k.nodes.clear()
        leuchten = k.nodes.new('ShaderNodeEmission')
        leuchten.inputs[0].default_value = (1, 1, 1, 1)
        aus = k.nodes.new('ShaderNodeOutputMaterial')
        k.links.new(leuchten.outputs[0], aus.inputs[0])
    loch = bpy.data.materials.get('maske-loch')
    if loch is None:
        loch = bpy.data.materials.new('maske-loch')
        loch.use_nodes = True
        k = loch.node_tree
        k.nodes.clear()
        aussparung = k.nodes.new('ShaderNodeHoldout')
        aus = k.nodes.new('ShaderNodeOutputMaterial')
        k.links.new(aussparung.outputs[0], aus.inputs[0])
    return weiss, loch


def _koerper():
    return [o for o in bpy.context.scene.objects
            if o.type in ('MESH', 'CURVE') and not o.get('kulisse')]


def _durchgang(pfad, stoff_fuer):
    """Ein Hilfsbild ohne Licht und ohne Boden: jeder Koerper bekommt den
    Stoff, den `stoff_fuer` zu seinem eigenen nennt."""
    szene = bpy.context.scene
    vorher = []
    for o in _koerper():
        plaetze = o.data.materials
        if len(plaetze) == 0:
            plaetze.append(None)
        vorher.append((o, [m for m in plaetze]))
        for i, m in enumerate(plaetze):
            plaetze[i] = stoff_fuer(m)
    boden = bpy.data.objects['boden']
    boden.hide_render = True
    proben = szene.cycles.samples
    szene.cycles.samples = 24
    szene.render.filepath = pfad
    bpy.ops.render.render(write_still=True)
    szene.cycles.samples = proben
    boden.hide_render = False
    for o, stoffe in vorher:
        for i, m in enumerate(stoffe):
            o.data.materials[i] = m


def rendern(stamm, maske=True):
    """Ein Bild in bis zu drei Fassungen: das Bild selbst, die Deckung (wo
    ein Koerper steht - der Rest des Bildes ist Schatten) und die Maske der
    Spielerfarbe."""
    szene = bpy.context.scene
    szene.render.filepath = stamm + '.png'
    bpy.ops.render.render(write_still=True)
    weiss, loch = _maske_stoffe()
    _durchgang(stamm + '-deckung.png', lambda m: weiss)
    if maske:
        # Was Spielerfarbe traegt, leuchtet weiss, alles andere ist ein Loch
        # - es verdeckt, ohne selbst im Bild zu stehen.
        _durchgang(stamm + '-maske.png', lambda m: weiss if (m is not None and m.get('spielerfarbe')) else loch)


# Wie dunkel der Schlagschatten im Bild steht. Voll gerendert ist er fast
# schwarz - auf dem Gras des Spiels zu schwer.
SCHATTEN = 0.6


def _schatten_daempfen(bild, deckung):
    """Trennt Koerper und Schatten und schwaecht nur den Schatten ab.

    Im gerenderten Bild ist die Deckung a = o + (1 - o) * s: o der Koerper,
    s der Schatten daneben. Ganz schwacher Schatten faellt weg - der
    Schattenfaenger nimmt auch das Himmelslicht mit und legte sonst einen
    Schleier ueber die ganze Zelle.
    """
    o = deckung[:, :, 3]
    a = bild[:, :, 3]
    s = np.clip((a - o) / np.maximum(1 - o, 1e-4), 0, 1)
    s = s * np.clip((s - 0.05) / 0.12, 0, 1) * SCHATTEN
    neu = o + (1 - o) * s
    aus = bild.copy()
    aus[:, :, :3] = bild[:, :, :3] * (a / np.maximum(neu, 1e-4))[:, :, None]
    aus[:, :, :3] = np.clip(aus[:, :, :3], 0, 1)
    aus[:, :, 3] = neu
    # Wo nichts steht, steht auch keine Farbe: sonst bleibt dort hochgerechnetes
    # Rauschen, unsichtbar, aber es blaeht die Datei auf.
    aus[neu < 1 / 255] = 0
    return aus


def _lesen(pfad):
    bild = bpy.data.images.load(pfad)
    b, h = bild.size
    feld = np.empty(b * h * 4, dtype=np.float32)
    bild.pixels.foreach_get(feld)
    bpy.data.images.remove(bild)
    return feld.reshape(h, b, 4)[::-1]


def _schreiben(pfad, feld):
    h, b, _ = feld.shape
    bild = bpy.data.images.new('tafel', b, h, alpha=True)
    bild.alpha_mode = 'STRAIGHT'
    bild.pixels.foreach_set(np.ascontiguousarray(feld[::-1]).ravel())
    bild.filepath_raw = pfad
    bild.file_format = 'PNG'
    bild.save()
    bpy.data.images.remove(bild)


class Tafel:
    """Sammelt Einzelbilder gleicher Groesse und schreibt sie als Raster."""

    def __init__(self, name, zelle, fuss, ziel):
        self.name = name
        self.zelle = zelle
        self.fuss = fuss
        self.ziel = ziel
        self.ordner = tempfile.mkdtemp(prefix=f'bilder-{name}-')
        self.bilder = {}   # (zeile, spalte) -> Pfad ohne Endung
        self.maske = False
        kamera_setzen(zelle[0], zelle[1], fuss)

    def bild(self, zeile, spalte, maske=True):
        stamm = os.path.join(self.ordner, f'{zeile:02d}-{spalte:02d}')
        rendern(stamm, maske)
        self.bilder[(zeile, spalte)] = stamm
        self.maske = self.maske or maske

    def schreiben(self, beschreibung):
        zeilen = 1 + max(z for z, _ in self.bilder)
        spalten = 1 + max(s for _, s in self.bilder)
        b, h = self.zelle
        os.makedirs(self.ziel, exist_ok=True)
        dateien = [('', f'{self.name}.png')]
        if self.maske:
            dateien.append(('-maske', f'{self.name}-maske.png'))
        for endung, datei in dateien:
            feld = np.zeros((zeilen * h, spalten * b, 4), dtype=np.float32)
            for (z, s), stamm in self.bilder.items():
                pfad = stamm + endung + '.png'
                if not os.path.exists(pfad):
                    continue
                zelle = _lesen(pfad)
                if endung == '':
                    zelle = _schatten_daempfen(zelle, _lesen(stamm + '-deckung.png'))
                feld[z * h:(z + 1) * h, s * b:(s + 1) * b] = zelle
            _schreiben(os.path.join(self.ziel, datei), feld)
        angaben = {
            'bild': f'{self.name}.png',
            'maske': f'{self.name}-maske.png' if self.maske else None,
            'zelle': list(self.zelle),
            'fuss': list(self.fuss),
            'feldbreite': FELD_BREITE,
            'zeilen': zeilen,
            'spalten': spalten,
        }
        angaben.update(beschreibung)
        with open(os.path.join(self.ziel, f'{self.name}.json'), 'w', encoding='utf-8') as f:
            json.dump(angaben, f, indent=2, ensure_ascii=False)
            f.write('\n')
        return angaben


def vorschau(ziel, name, spielerfarbe=(0.29, 0.565, 0.85), gras=(0.33, 0.40, 0.22)):
    """Ein Wegwerfbild zum Ansehen: die Tafel auf Gras, die Maske eingefaerbt,
    daneben dasselbe in halber Groesse - so gross wie beim Start einer Partie."""
    bild = _lesen(os.path.join(ziel, f'{name}.png'))
    pfad_maske = os.path.join(ziel, f'{name}-maske.png')
    farbe = bild[:, :, :3].copy()
    if os.path.exists(pfad_maske):
        m = _lesen(pfad_maske)[:, :, 3:4]
        farbe = farbe * (1 - m) + farbe * np.array(spielerfarbe, dtype=np.float32) * m
    a = bild[:, :, 3:4]
    voll = farbe * a + np.array(gras, dtype=np.float32) * (1 - a)
    h, b, _ = voll.shape
    h2, b2 = h // 2 * 2, b // 2 * 2
    klein = voll[:h2, :b2].reshape(h2 // 2, 2, b2 // 2, 2, 3).mean(axis=(1, 3))
    aus = np.empty((h, b + b2 // 2, 4), dtype=np.float32)
    aus[:, :, :3] = np.array(gras, dtype=np.float32)
    aus[:, :, 3] = 1
    aus[:, :b, :3] = voll
    aus[:h2 // 2, b:, :3] = klein
    _schreiben(os.path.join(ziel, f'{name}-vorschau.png'), aus)
