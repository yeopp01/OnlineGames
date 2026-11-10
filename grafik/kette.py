# Die Renderkette (ADR-0014): eine Szene, eine Kamera, ein Licht fuer alles.
#
# Laeuft in Blender, ohne Oberflaeche:
#   blender -b -P grafik/bilder.py -- haus baum dorfbewohner
#
# Ein Modell baut seine Koerper in die leere Szene, die Kette rendert jedes
# Bild einmal und liest daraus drei Dinge - das Bild selbst, die Deckung (wo
# ein Koerper steht) und die Maske der Spielerfarbe - und setzt die
# Einzelbilder zu einer Tafel zusammen. Neben der Tafel liegt eine
# JSON-Datei, die dem Browser sagt, wo welches Bild steht.

import json
import math
import os
import tempfile

import bpy
import numpy as np
import OpenImageIO as oiio
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

# Zwei Nebenkanaele, die jeder Stoff beim Rendern mitschreibt: `deckung` ist 1,
# wo ein Koerper steht, `spieler` ist 1, wo er Spielerfarbe traegt. Beide
# entstehen im selben Durchgang wie das Bild und sind an den Kanten ebenso
# geglaettet.
KANAL_DECKUNG = 'deckung'
KANAL_SPIELER = 'spieler'


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
    r.image_settings.media_type = 'MULTI_LAYER_IMAGE'
    r.image_settings.file_format = 'OPEN_EXR_MULTILAYER'
    r.image_settings.color_mode = 'RGBA'
    r.image_settings.color_depth = '32'
    for name in (KANAL_DECKUNG, KANAL_SPIELER):
        kanal = szene.view_layers[0].aovs.add()
        kanal.name = name
        kanal.type = 'VALUE'
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


def _koerper():
    return [o for o in bpy.context.scene.objects
            if o.type in ('MESH', 'CURVE') and not o.get('kulisse')]


def _kennzeichnen():
    """Jeder Stoff eines Koerpers schreibt die zwei Nebenkanaele mit.

    Frueher wurden dafuer die Stoffe getauscht und das Bild dreimal gerendert.
    Das war dreimal so langsam - und beim Marktkarren standen danach in jedem
    dritten Bild ganze Stoffe schwarz: der Renderer behaelt die Szene zwischen
    zwei Bildern und bekam den Ruecktausch nicht immer mit.
    """
    for o in _koerper():
        if len(o.data.materials) == 0 or any(m is None for m in o.data.materials):
            raise SystemExit(f'{o.name} hat keinen Stoff - die Deckung liesse ihn aus')
        for m in o.data.materials:
            if m.get('kanaele'):
                continue
            for name, wert in ((KANAL_DECKUNG, 1.0), (KANAL_SPIELER, 1.0 if m.get('spielerfarbe') else 0.0)):
                knoten = m.node_tree.nodes.new('ShaderNodeOutputAOV')
                knoten.aov_name = name
                knoten.inputs['Value'].default_value = wert
            m['kanaele'] = True


def _ansicht(linear):
    """Vom gerechneten Bild (linear, Farbe mal Deckung) zu dem, was eine
    Bilddatei haelt: Farbe fuer sich, in sRGB."""
    a = np.clip(linear[:, :, 3:4], 0, 1)
    farbe = np.clip(np.where(a > 1e-6, linear[:, :, :3] / np.maximum(a, 1e-6), 0), 0, 1)
    farbe = np.where(farbe <= 0.0031308, farbe * 12.92, 1.055 * np.power(farbe, 1 / 2.4) - 0.055)
    return np.concatenate([farbe, a], axis=2).astype(np.float32)


def _kanaele_lesen(pfad):
    """Liest alle Kanaele der gerenderten Datei. Blender legt das Bild und
    jeden Nebenkanal in einen eigenen Teil der Datei."""
    ein = oiio.ImageInput.open(pfad)
    if ein is None:
        raise SystemExit(f'{pfad} laesst sich nicht lesen: {oiio.geterror()}')
    kanaele = {}
    teil = 0
    while ein.seek_subimage(teil, 0):
        angaben = ein.spec()
        feld = np.asarray(ein.read_image(teil, 0, 0, angaben.nchannels, 'float'))
        feld = feld.reshape(angaben.height, angaben.width, angaben.nchannels)
        for i, name in enumerate(angaben.channelnames):
            kanaele[tuple(name.split('.')[-2:])] = feld[:, :, i]
        teil += 1
    ein.close()
    fehlt = [k for k in [('Combined', e) for e in 'RGBA'] + [(KANAL_DECKUNG, 'X'), (KANAL_SPIELER, 'X')]
             if k not in kanaele]
    if fehlt:
        raise SystemExit(f'In {pfad} fehlen {fehlt} - da sind {sorted(kanaele)}')
    bild = np.stack([kanaele[('Combined', e)] for e in 'RGBA'], axis=2)
    return (_ansicht(bild), np.clip(kanaele[(KANAL_DECKUNG, 'X')], 0, 1),
            np.clip(kanaele[(KANAL_SPIELER, 'X')], 0, 1))


def rendern(pfad):
    """Rendert ein Bild und gibt es dreifach zurueck: das Bild, die Deckung
    (wo ein Koerper steht - der Rest des Bildes ist Schatten) und die Maske
    der Spielerfarbe."""
    _kennzeichnen()
    szene = bpy.context.scene
    szene.render.filepath = pfad
    bpy.ops.render.render(write_still=True)
    return _kanaele_lesen(pfad)


# Ein Koerper, der im Bild rein schwarz steht, ist kein tiefer Schatten,
# sondern ein Stoff, den der Renderer verloren hat: mit drei Durchgaengen und
# getauschten Stoffen stand so in 27 von 72 Bildern des Marktkarrens ein Loch,
# und gesehen hat es erst, wer die Tafel vergroessert ansah. Gemessen an den
# vier Tafeln von heute: kein Bild ueber 0,5 %.
SCHWARZ_GRENZE = 0.02


def _schwarz_anteil(bild, deckung):
    """Anteil des Koerpers, der im Bild rein schwarz ist."""
    koerper = deckung > 0.99
    if not koerper.any():
        return 0.0
    schwarz = koerper & (bild[:, :, :3].sum(axis=2) < 12 / 255)
    return float(schwarz.sum() / koerper.sum())


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
    o = deckung
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
        self.bilder = {}   # (zeile, spalte) -> (Bild, Maske oder None)
        self.maske = False
        kamera_setzen(zelle[0], zelle[1], fuss)

    def bild(self, zeile, spalte, maske=True):
        bild, deckung, spieler = rendern(os.path.join(self.ordner, 'bild.exr'))
        anteil = _schwarz_anteil(bild, deckung)
        if anteil > SCHWARZ_GRENZE:
            raise SystemExit(f'{self.name}, Zeile {zeile}, Spalte {spalte}: {anteil:.0%} des Koerpers sind schwarz - ein Stoff ist beim Rendern verloren gegangen')
        self.bilder[(zeile, spalte)] = (_schatten_daempfen(bild, deckung), spieler if maske else None)
        self.maske = self.maske or maske

    def schreiben(self, beschreibung):
        zeilen = 1 + max(z for z, _ in self.bilder)
        spalten = 1 + max(s for _, s in self.bilder)
        b, h = self.zelle
        os.makedirs(self.ziel, exist_ok=True)
        feld = np.zeros((zeilen * h, spalten * b, 4), dtype=np.float32)
        maske = np.zeros((zeilen * h, spalten * b, 4), dtype=np.float32)
        for (z, s), (zelle, spieler) in self.bilder.items():
            feld[z * h:(z + 1) * h, s * b:(s + 1) * b] = zelle
            if spieler is not None:
                # Weiss, so weit die Spielerfarbe deckt - der Browser nimmt
                # nur die Deckung.
                maske[z * h:(z + 1) * h, s * b:(s + 1) * b] = np.where(spieler[:, :, None] >= 1 / 255, 1.0, 0.0)
                maske[z * h:(z + 1) * h, s * b:(s + 1) * b, 3] = np.where(spieler >= 1 / 255, spieler, 0.0)
        _schreiben(os.path.join(self.ziel, f'{self.name}.png'), feld)
        if self.maske:
            _schreiben(os.path.join(self.ziel, f'{self.name}-maske.png'), maske)
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
