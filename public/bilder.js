// Gerenderte Bilder (ADR-0016, darstellung AC-17).
//
// Die Bilder entstehen vor dem Spiel aus eigenen 3D-Modellen (grafik/*.py,
// `npm run bilder`) und liegen als Tafeln unter /bilder/: ein Raster gleich
// grosser Zellen, daneben eine JSON-Datei, die sagt, wo welches Bild steht,
// und - wo es Spielerfarbe gibt - eine zweite Tafel als Maske.
//
// Sie sind die Vorgabe (Benutzer, 2026-11-12). Abgeschaltet werden sie mit
// `?bilder=0` in der Adresse oder mit bilderEin(false) - dann zeichnet das
// Spiel wie vor dem Umbau. Was noch kein gerendertes Bild hat oder dessen
// Tafel fehlt, wird weiter gezeichnet.

const NAMEN = [
  'dorfbewohner', 'baum', 'marktkarren', 'spaeherreiter', 'ritter', 'miliz', 'soldat', 'speerkaempfer', 'bogenschuetze', 'plaenkler',
  'armbrustschuetze', 'moench', 'ramme', 'mangonel', 'schaf', 'beere', 'gold', 'stein', 'boden',
  // Gebaeude (R4): jedes eine Tafel; die Baustelle je Grundflaeche eine.
  'haus', 'dorfzentrum', 'muehle', 'holzfaellerlager', 'bergbaulager', 'farm', 'kaserne', 'schiessanlage', 'stall', 'schmiede',
  'aussenposten', 'markt', 'kloster', 'universitaet', 'belagerungswerkstatt', 'wachturm', 'burg', 'steinmauer', 'tor',
  'baustelle-1', 'baustelle-2', 'baustelle-3', 'baustelle-4',
];
const tafeln = new Map();
const fehlend = [];
let an = false;
let laden = null;
let da = false;

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
    // Fehlt eine Tafel, fehlt nur sie: das Stueck wird gezeichnet wie bisher,
    // und die Partie wartet nicht ewig auf ein Bild, das nicht kommt.
    laden = Promise.all(NAMEN.map(async (name) => {
      try {
        const angaben = await (await fetch(`/bilder/${name}.json`)).json();
        const tafel = await bildLaden(`/bilder/${angaben.bild}`);
        const maske = angaben.maske ? await bildLaden(`/bilder/${angaben.maske}`) : null;
        // Mauer und Tor haben ihren Schlagschatten in einer eigenen Tafel: er
        // liegt als Schicht unter allen Mauern, sonst wuerde es doppelt dunkel,
        // wo sich zwei ueberdecken.
        const wurf = angaben.art === 'gebaeude' ? angaben.ablaeufe?.schatten : null;
        const schatten = wurf ? {
          name: `${name}-schatten`, zelle: wurf.zelle, fuss: wurf.fuss, feldbreite: angaben.feldbreite,
          tafel: await bildLaden(`/bilder/${wurf.bild}`), maskenbild: null, gezeichnet: 0, deckung: angaben.schattenDeckung ?? 0.6,
        } : null;
        // `teile` heisst in den Angaben der Mauer, aus welchen Stuecken sie
        // sich setzt; hier ist es der Speicher der nachgeladenen Ablaeufe.
        tafeln.set(name, { ...angaben, name, tafel, maskenbild: maske, gezeichnet: 0, teile: new Map(), stuecke: angaben.teile || null, schatten });
      } catch {
        fehlend.push(name);
      }
    })).then(() => {
      da = true;
      return true;
    });
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

/** Erfuellt sich, wenn gezeichnet werden kann - sofort, wenn abgeschaltet. */
export function bilderWarten() {
  return an ? bilderLaden() : Promise.resolve(true);
}

/** Kann gezeichnet werden? Ja, wenn abgeschaltet oder alle Tafeln da sind. */
export function bilderBereit() {
  return !an || da;
}

/** Welche Tafeln nicht kamen - leer, wenn alles da ist. */
export function bilderFehlend() {
  return [...fehlend];
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

// Wo eine Zelle deckt: ein grobes Raster ihrer Deckkraft, einmal gelesen. Der
// Schlagschatten im Bild ist halb durchsichtig und zaehlt nicht - gemessen an
// den Tafeln: der Koerper deckt mit 255, der Schatten unter 200.
const RASTER = 4;

function deckung(tafel, zeile, spalte) {
  if (!tafel.deckend) tafel.deckend = new Map();
  const schluessel = zeile * 1000 + spalte;
  let d = tafel.deckend.get(schluessel);
  if (d === undefined) {
    d = null;
    try {
      const [breite, hoehe] = tafel.zelle;
      const b = Math.ceil(breite / RASTER);
      const h = Math.ceil(hoehe / RASTER);
      const leinwand = document.createElement('canvas');
      leinwand.width = b;
      leinwand.height = h;
      const s = leinwand.getContext('2d', { willReadFrequently: true });
      s.drawImage(tafel.tafel, spalte * breite, zeile * hoehe, breite, hoehe, 0, 0, b, h);
      const daten = s.getImageData(0, 0, b, h).data;
      const voll = new Uint8Array(b * h);
      let oben = h;
      let unten = -1;
      let links = b;
      let rechts = -1;
      for (let i = 0; i < b * h; i++) {
        if (daten[i * 4 + 3] < 200) continue;
        voll[i] = 1;
        const y = (i / b) | 0;
        const x = i % b;
        oben = Math.min(oben, y);
        unten = Math.max(unten, y);
        links = Math.min(links, x);
        rechts = Math.max(rechts, x);
      }
      d = { b, h, voll, oben: oben * RASTER, unten: (unten + 1) * RASTER, links: links * RASTER, rechts: (rechts + 1) * RASTER };
    } catch {
      d = null;
    }
    tafel.deckend.set(schluessel, d);
  }
  return d;
}

/** Trifft ein Punkt (relativ zum Fusspunkt, im Massstab) das Bild der Zelle? */
export function zelleGetroffen(tafel, zeile, spalte, dx, dy, massstab) {
  const x = dx / massstab + tafel.fuss[0];
  const y = dy / massstab + tafel.fuss[1];
  if (x < 0 || y < 0 || x >= tafel.zelle[0] || y >= tafel.zelle[1]) return false;
  const d = deckung(tafel, zeile, spalte);
  if (!d) return true;
  return d.voll[((y / RASTER) | 0) * d.b + ((x / RASTER) | 0)] === 1;
}

/**
 * Zeichnet eine Zelle so gross wie moeglich in ein Quadrat der Kantenlaenge
 * `groesse` - gemessen an dem, was deckt, ohne den Schlagschatten: fuer die
 * Bilder auf den Knoepfen. `rand` ist der freie Rand als Anteil.
 */
export function zelleEinpassen(stift, tafel, zeile, spalte, groesse, farbe, rand = 0.06) {
  const d = deckung(tafel, zeile, spalte);
  const [breite, hoehe] = tafel.zelle;
  const k = d && d.rechts > d.links ? d : { links: 0, rechts: breite, oben: 0, unten: hoehe };
  const innen = groesse * (1 - 2 * rand);
  const massstab = Math.min(innen / (k.rechts - k.links), innen / (k.unten - k.oben));
  // Waagrecht in die Mitte, senkrecht auf den Boden des Knopfs.
  const x = groesse / 2 - ((k.links + k.rechts) / 2 - tafel.fuss[0]) * massstab;
  const y = groesse * (1 - rand) - (k.unten - tafel.fuss[1]) * massstab;
  zelleZeichnen(stift, tafel, zeile, spalte, x, y, massstab, farbe);
}

/** Wie hoch das Bild einer Zelle ueber seinem Fusspunkt steht, in Bildpunkten der Tafel. */
export function zellenHoehe(tafel, zeile = 0, spalte = 0) {
  const d = deckung(tafel, zeile, spalte);
  return tafel.fuss[1] - (d ? d.oben : 0);
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

if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('bilder') !== '0') bilderEin();
