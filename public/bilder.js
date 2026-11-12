// Gerenderte Bilder (ADR-0016, darstellung AC-17).
//
// Die Bilder entstehen vor dem Spiel aus eigenen 3D-Modellen (grafik/*.py,
// `npm run bilder`) und liegen als Tafeln unter /bilder/: ein Raster gleich
// grosser Zellen, daneben eine JSON-Datei, die sagt, wo welches Bild steht,
// und - wo es Spielerfarbe gibt - eine zweite Tafel als Maske.
//
// Solange der Umbau eine Probe ist, sind sie abgeschaltet. Eingeschaltet
// werden sie mit `?bilder=1` in der Adresse oder mit bilderEin(). Was dann
// noch kein gerendertes Bild hat, wird weiter gezeichnet.

const NAMEN = ['dorfbewohner', 'haus', 'baum', 'marktkarren', 'spaeherreiter', 'ritter', 'miliz', 'soldat', 'speerkaempfer', 'bogenschuetze', 'plaenkler', 'armbrustschuetze', 'moench', 'ramme', 'mangonel', 'schaf', 'beere', 'gold', 'stein', 'boden'];
const tafeln = new Map();
let an = false;
let laden = null;

function bildLaden(pfad) {
  return new Promise((fertig, fehler) => {
    const bild = new Image();
    bild.onload = () => fertig(bild);
    bild.onerror = () => fehler(new Error(`Bild fehlt: ${pfad}`));
    bild.src = pfad;
  });
}

/** Holt alle Tafeln. Das Versprechen erfuellt sich, wenn sie da sind. */
export function bilderLaden() {
  if (!laden) {
    laden = Promise.all(NAMEN.map(async (name) => {
      const angaben = await (await fetch(`/bilder/${name}.json`)).json();
      const tafel = await bildLaden(`/bilder/${angaben.bild}`);
      const maske = angaben.maske ? await bildLaden(`/bilder/${angaben.maske}`) : null;
      tafeln.set(name, { ...angaben, name, tafel, maskenbild: maske, gezeichnet: 0, teile: new Map() });
    })).then(() => true);
  }
  return laden;
}

/**
 * Ein Ablauf mit eigener Tafel (Angreifen, Sterben): geholt wird sie erst,
 * wenn jemand sie braucht - wer nur Dorfbewohner hat, laedt keinen Kampf.
 * Gibt die Tafel des Ablaufs zurueck oder null, solange sie unterwegs ist.
 * Gemerkt wird je Bilddatei: Stehen und Gehen mit Holz teilen sich eine.
 */
function teilHolen(tafel, name) {
  const ablauf = tafel.ablaeufe[name];
  if (!ablauf.bild) return tafel;
  let teil = tafel.teile.get(ablauf.bild);
  if (!teil) {
    teil = { bereit: null };
    tafel.teile.set(ablauf.bild, teil);
    teil.laden = Promise.all([bildLaden(`/bilder/${ablauf.bild}`), ablauf.maske ? bildLaden(`/bilder/${ablauf.maske}`) : null])
      .then(([bild, maske]) => {
        // Ein anderes Bild - und, wo die Tafel knapp geschnitten ist, ihre
        // eigene Zelle mit ihrem eigenen Fusspunkt: ein Hieb braucht mehr
        // Platz als das Stehen.
        teil.bereit = { ...tafel, tafel: bild, maskenbild: maske, haupt: tafel, zelle: ablauf.zelle || tafel.zelle, fuss: ablauf.fuss || tafel.fuss };
        return true;
      })
      // Fehlt die Tafel, bleibt die Figur im Stand - besser als ein Loch.
      .catch(() => false);
  }
  return teil.bereit;
}

/** Holt die Tafeln der Ablaeufe einer Figur vorab - fuer Seiten, die alles zeigen. */
export function ablaeufeLaden(name) {
  const tafel = tafeln.get(name);
  if (!tafel?.ablaeufe) return Promise.resolve(false);
  return Promise.all(Object.keys(tafel.ablaeufe).filter((a) => tafel.ablaeufe[a].bild).map((a) => {
    teilHolen(tafel, a);
    return tafel.teile.get(tafel.ablaeufe[a].bild).laden;
  })).then(() => true);
}

export function bilderEin(wert = true) {
  an = wert;
  return an ? bilderLaden() : Promise.resolve(false);
}

/** Die Tafel zu einem Namen - oder null, wenn abgeschaltet oder nicht da. */
export function gerendert(name) {
  return an ? tafeln.get(name) || null : null;
}

// Eine Zelle in einer Spielerfarbe: wo die Maske deckt, wird das helle,
// unbunte Tuch mit der Farbe malgenommen - Falten und Schatten bleiben.
//
// Gefaerbt wird die eine Zelle, die gebraucht wird, auf einer Werkbank, die so
// gross ist wie die groesste Zelle bisher. Bis R1 wurde die ganze Tafel je
// Farbe einmal kopiert: fuer den Dorfbewohner 5,3 MB je Farbe, fuer den
// Marktkarren 27,9 - gemessen 11,1 MB bei zwei Farben, von denen drei Zellen
// gebraucht wurden. Wer oft dieselbe Zelle braucht, haelt sie selbst vor,
// wie figurBildZeichnen es tut.
let werkbank = null;

function zelleInFarbe(tafel, sx, sy, breite, hoehe, farbe) {
  if (!werkbank) werkbank = document.createElement('canvas');
  if (werkbank.width < breite || werkbank.height < hoehe) {
    werkbank.width = Math.max(werkbank.width, breite);
    werkbank.height = Math.max(werkbank.height, hoehe);
  }
  const s = werkbank.getContext('2d');
  // Die Maske, dann die Farbe hinein: Farbe, so weit das Tuch reicht.
  s.globalCompositeOperation = 'copy';
  s.drawImage(tafel.maskenbild, sx, sy, breite, hoehe, 0, 0, breite, hoehe);
  s.globalCompositeOperation = 'source-in';
  s.fillStyle = farbe;
  s.fillRect(0, 0, breite, hoehe);
  // Das Bild malgenommen darueber: auf der Farbe wird es gefaerbt, daneben
  // bleibt es, wie es ist.
  s.globalCompositeOperation = 'multiply';
  s.drawImage(tafel.tafel, sx, sy, breite, hoehe, 0, 0, breite, hoehe);
  return werkbank;
}

/** Wie viele Byte die eigenen Leinwaende dieses Moduls belegen (vier je Bildpunkt). */
export function leinwandSpeicher() {
  return werkbank ? werkbank.width * werkbank.height * 4 : 0;
}

/** Wie viel Platz eine Zelle um ihren Fusspunkt braucht, im Massstab. */
export function zellenRand(tafel, massstab) {
  const [breite, hoehe] = tafel.zelle;
  const [fx, fy] = tafel.fuss;
  return {
    halb: Math.max(fx, breite - fx) * massstab,
    oben: fy * massstab,
    unten: (hoehe - fy) * massstab,
  };
}

/** Zeichnet eine Zelle so, dass ihr Fusspunkt auf (x, y) steht. */
export function zelleZeichnen(stift, tafel, zeile, spalte, x, y, massstab, farbe) {
  const [breite, hoehe] = tafel.zelle;
  const [fx, fy] = tafel.fuss;
  stift.imageSmoothingEnabled = true;
  stift.imageSmoothingQuality = 'high';
  (tafel.haupt || tafel).gezeichnet += 1;
  const gefaerbt = tafel.maskenbild && farbe;
  const quelle = gefaerbt ? zelleInFarbe(tafel, spalte * breite, zeile * hoehe, breite, hoehe, farbe) : tafel.tafel;
  stift.drawImage(
    quelle, gefaerbt ? 0 : spalte * breite, gefaerbt ? 0 : zeile * hoehe, breite, hoehe,
    x - fx * massstab, y - fy * massstab, breite * massstab, hoehe * massstab,
  );
}

/** Welche Zelle eine Figur zeigt: Zeile ist die Blickrichtung, Spalte das Bild. */
export function figurZelle(tafel, richtung, schrittStufe, stufen) {
  const zeile = (((richtung ?? 1) % tafel.richtungen) + tafel.richtungen) % tafel.richtungen;
  if (schrittStufe < 0) return { zeile, spalte: tafel.ablaeufe.stehen.spalte };
  const gehen = tafel.ablaeufe.gehen;
  return { zeile, spalte: gehen.spalte + Math.floor((schrittStufe / stufen) * gehen.bilder) % gehen.bilder };
}

/**
 * Welche Zelle eine Figur in einem Ablauf zeigt. `anteil` laeuft von 0 bis 1
 * durch den Ablauf; ein Ablauf, der einmal laeuft (Sterben), bleibt auf dem
 * letzten Bild stehen. Gibt es den Ablauf nicht oder ist seine Tafel noch
 * unterwegs, steht die Figur. `quelle` ist die Tafel, aus der gezeichnet wird.
 */
export function ablaufZelle(tafel, richtung, name, anteil = 0) {
  const zeile = (((richtung ?? 1) % tafel.richtungen) + tafel.richtungen) % tafel.richtungen;
  const ablauf = tafel.ablaeufe[name];
  const quelle = ablauf ? teilHolen(tafel, name) : null;
  if (!quelle) return { quelle: tafel, zeile, spalte: tafel.ablaeufe.stehen.spalte, ablauf: 'stehen' };
  const bild = ablauf.einmal
    ? Math.min(ablauf.bilder - 1, Math.max(0, Math.floor(anteil * ablauf.bilder)))
    : ((Math.floor(anteil * ablauf.bilder) % ablauf.bilder) + ablauf.bilder) % ablauf.bilder;
  return { quelle, zeile, spalte: ablauf.spalte + bild, ablauf: name };
}

/**
 * Blickrichtung aus einer Bewegung im Bild (dx nach rechts, dy nach unten):
 * 0 schaut zum Betrachter, 2 nach rechts, 4 weg, 6 nach links. Die Hoehe
 * zaehlt doppelt, weil das Bild den Boden auf die Haelfte staucht.
 */
export function richtungAus(dx, dy) {
  const winkel = Math.atan2(dy * 2, dx) * 180 / Math.PI;
  return ((Math.round((90 - winkel) / 45) % 8) + 8) % 8;
}

if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('bilder')) bilderEin();
