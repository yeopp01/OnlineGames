// Ein PNG in rohe Bildpunkte lesen - ohne Abhaengigkeit.
//
// Gebraucht wird das nur zum Vergleichen zweier Bildnachweise
// (scripts/qa-abweichung.mjs). Dafuer ein Paket aufzunehmen waere zu viel:
// die Bilder kommen alle aus Playwright, also 8 Bit, RGB oder RGBA, nicht
// verschraenkt. Was darueber hinausgeht, sagt deutlich, dass es das nicht
// kann, statt still Unsinn zu rechnen.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const MARKE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Bytes je Bildpunkt, nach Farbart des PNG. */
const KANAELE = { 0: 1, 2: 3, 4: 2, 6: 4 };

/** Der Paeth-Vorhersager aus der PNG-Norm. */
function paeth(links, oben, schraeg) {
  const geschaetzt = links + oben - schraeg;
  const a = Math.abs(geschaetzt - links);
  const b = Math.abs(geschaetzt - oben);
  const c = Math.abs(geschaetzt - schraeg);
  if (a <= b && a <= c) return links;
  if (b <= c) return oben;
  return schraeg;
}

/**
 * Liest ein PNG und gibt die Bildpunkte Zeile fuer Zeile zurueck.
 *
 * @param {string|Buffer} quelle Pfad oder der Inhalt der Datei
 * @returns {{breite: number, hoehe: number, kanaele: number, daten: Buffer}}
 */
export function pngLesen(quelle) {
  const roh = Buffer.isBuffer(quelle) ? quelle : readFileSync(quelle);
  if (roh.length < 8 || !roh.subarray(0, 8).equals(MARKE)) {
    throw new Error('kein PNG: die Marke am Anfang fehlt');
  }

  let breite = 0;
  let hoehe = 0;
  let kanaele = 0;
  const stuecke = [];

  let stelle = 8;
  while (stelle + 8 <= roh.length) {
    const laenge = roh.readUInt32BE(stelle);
    const art = roh.toString('ascii', stelle + 4, stelle + 8);
    const inhalt = roh.subarray(stelle + 8, stelle + 8 + laenge);
    stelle += 12 + laenge; // Laenge, Art, Inhalt, Pruefsumme

    if (art === 'IHDR') {
      breite = inhalt.readUInt32BE(0);
      hoehe = inhalt.readUInt32BE(4);
      const tiefe = inhalt[8];
      const farbart = inhalt[9];
      const verschraenkt = inhalt[12];
      if (tiefe !== 8) throw new Error(`nur 8 Bit je Kanal, nicht ${tiefe}`);
      if (!KANAELE[farbart]) throw new Error(`Farbart ${farbart} wird nicht gelesen`);
      if (verschraenkt) throw new Error('verschraenkte PNG werden nicht gelesen');
      kanaele = KANAELE[farbart];
    } else if (art === 'IDAT') {
      stuecke.push(inhalt);
    } else if (art === 'IEND') {
      break;
    }
  }

  if (!breite || !hoehe || !kanaele) throw new Error('PNG ohne brauchbaren Kopf');

  const gepackt = inflateSync(Buffer.concat(stuecke));
  const zeile = breite * kanaele;
  if (gepackt.length < (zeile + 1) * hoehe) {
    throw new Error('PNG kuerzer als sein Kopf verspricht');
  }

  const daten = Buffer.allocUnsafe(zeile * hoehe);
  for (let y = 0; y < hoehe; y++) {
    const filter = gepackt[y * (zeile + 1)];
    const quell = (y * (zeile + 1)) + 1;
    const ziel = y * zeile;
    const vorige = ziel - zeile;
    for (let i = 0; i < zeile; i++) {
      const wert = gepackt[quell + i];
      const links = i >= kanaele ? daten[ziel + i - kanaele] : 0;
      const oben = y > 0 ? daten[vorige + i] : 0;
      const schraeg = (y > 0 && i >= kanaele) ? daten[vorige + i - kanaele] : 0;
      let davor = 0;
      if (filter === 1) davor = links;
      else if (filter === 2) davor = oben;
      else if (filter === 3) davor = (links + oben) >> 1;
      else if (filter === 4) davor = paeth(links, oben, schraeg);
      else if (filter !== 0) throw new Error(`Filter ${filter} gibt es nicht`);
      daten[ziel + i] = (wert + davor) & 0xff;
    }
  }

  return { breite, hoehe, kanaele, daten };
}

/**
 * Der Anteil der Bildpunkte, in denen sich zwei Bilder unterscheiden - 0 bis 1.
 * Verschieden grosse Bilder gelten als ganz verschieden. Verglichen werden die
 * Farben, nicht die Deckkraft: ein Bildschirmbild ist ueberall deckend, und so
 * laesst sich ein RGB- mit einem RGBA-Bild vergleichen.
 */
export function bildAbweichung(eines, anderes) {
  const a = Buffer.isBuffer(eines) || typeof eines === 'string' ? pngLesen(eines) : eines;
  const b = Buffer.isBuffer(anderes) || typeof anderes === 'string' ? pngLesen(anderes) : anderes;
  if (a.breite !== b.breite || a.hoehe !== b.hoehe) return 1;

  const punkte = a.breite * a.hoehe;
  let anders = 0;
  for (let p = 0; p < punkte; p++) {
    const ia = p * a.kanaele;
    const ib = p * b.kanaele;
    for (let k = 0; k < 3; k++) {
      const wa = a.kanaele === 1 ? a.daten[ia] : a.daten[ia + Math.min(k, a.kanaele - 1)];
      const wb = b.kanaele === 1 ? b.daten[ib] : b.daten[ib + Math.min(k, b.kanaele - 1)];
      if (wa !== wb) { anders += 1; break; }
    }
  }
  return anders / punkte;
}
