// Gerenderte Bilder (ADR-0014, darstellung AC-17).
//
// Die Bilder entstehen vor dem Spiel aus eigenen 3D-Modellen (grafik/*.py,
// `npm run bilder`) und liegen als Tafeln unter /bilder/: ein Raster gleich
// grosser Zellen, daneben eine JSON-Datei, die sagt, wo welches Bild steht,
// und - wo es Spielerfarbe gibt - eine zweite Tafel als Maske.
//
// Solange der Umbau eine Probe ist, sind sie abgeschaltet. Eingeschaltet
// werden sie mit `?bilder=1` in der Adresse oder mit bilderEin(). Was dann
// noch kein gerendertes Bild hat, wird weiter gezeichnet.

const NAMEN = ['dorfbewohner', 'haus', 'baum', 'marktkarren'];
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
      tafeln.set(name, { ...angaben, name, tafel, maskenbild: maske, gefaerbt: new Map() });
    })).then(() => true);
  }
  return laden;
}

export function bilderEin(wert = true) {
  an = wert;
  return an ? bilderLaden() : Promise.resolve(false);
}

/** Die Tafel zu einem Namen - oder null, wenn abgeschaltet oder nicht da. */
export function gerendert(name) {
  return an ? tafeln.get(name) || null : null;
}

// Die Tafel in einer Spielerfarbe: wo die Maske deckt, wird das helle,
// unbunte Tuch mit der Farbe malgenommen - Falten und Schatten bleiben.
// Einmal je Farbe, danach wird nur kopiert.
function inFarbe(tafel, farbe) {
  if (!tafel.maskenbild || !farbe) return tafel.tafel;
  let fertig = tafel.gefaerbt.get(farbe);
  if (!fertig) {
    const breite = tafel.tafel.width;
    const hoehe = tafel.tafel.height;
    const schicht = document.createElement('canvas');
    schicht.width = breite;
    schicht.height = hoehe;
    const s = schicht.getContext('2d');
    s.drawImage(tafel.tafel, 0, 0);
    s.globalCompositeOperation = 'multiply';
    s.fillStyle = farbe;
    s.fillRect(0, 0, breite, hoehe);
    s.globalCompositeOperation = 'destination-in';
    s.drawImage(tafel.maskenbild, 0, 0);
    fertig = document.createElement('canvas');
    fertig.width = breite;
    fertig.height = hoehe;
    const f = fertig.getContext('2d');
    f.drawImage(tafel.tafel, 0, 0);
    f.drawImage(schicht, 0, 0);
    tafel.gefaerbt.set(farbe, fertig);
  }
  return fertig;
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
  stift.drawImage(
    inFarbe(tafel, farbe), spalte * breite, zeile * hoehe, breite, hoehe,
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
 * Blickrichtung aus einer Bewegung im Bild (dx nach rechts, dy nach unten):
 * 0 schaut zum Betrachter, 2 nach rechts, 4 weg, 6 nach links. Die Hoehe
 * zaehlt doppelt, weil das Bild den Boden auf die Haelfte staucht.
 */
export function richtungAus(dx, dy) {
  const winkel = Math.atan2(dy * 2, dx) * 180 / Math.PI;
  return ((Math.round((90 - winkel) / 45) % 8) + 8) % 8;
}

if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('bilder')) bilderEin();
