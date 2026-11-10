# Einstieg der Renderkette (ADR-0016).
#
#   blender -b -P grafik/bilder.py -- haus baum dorfbewohner
#   npm run bilder -- haus
#
# Ohne Namen rendert sie alles, was in grafik/verzeichnis.json steht. Die
# Bilder landen in public/bilder/.

import importlib
import json
import os
import sys
import time

HIER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HIER)

# Welche Modelle es gibt, steht im Verzeichnis der Kette (darstellung AC-18) -
# dieselbe Datei, an der `npm run check` die Bilder prueft.
with open(os.path.join(HIER, 'verzeichnis.json'), encoding='utf-8') as datei:
    MODELLE = [m['name'] for m in json.load(datei)['modelle']]


def main():
    argumente = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    ziel = os.path.join(HIER, '..', 'public', 'bilder')
    schalter = [a for a in argumente if a.startswith('--')]
    namen = [a for a in argumente if not a.startswith('--')] or MODELLE
    for schalter_wert in schalter:
        if schalter_wert.startswith('--ziel='):
            ziel = schalter_wert.split('=', 1)[1]
    for name in namen:
        if name not in MODELLE:
            raise SystemExit(f'Kein Modell "{name}" - es gibt: {", ".join(MODELLE)}')
        beginn = time.time()
        modell = importlib.import_module(name)
        angaben = modell.tafel(os.path.abspath(ziel))
        print(f'BILD {name}: {angaben["spalten"]} x {angaben["zeilen"]} Bilder zu '
              f'{angaben["zelle"][0]} x {angaben["zelle"][1]}, {time.time() - beginn:.1f} s')
        if '--vorschau' in schalter:
            import kette
            kette.vorschau(os.path.abspath(ziel), name)


main()
