// Pfeile fliegen sichtbar (→ specs/10-strategie/bedienung.md AC-40) - der Teil
// auf dem Server: jeder Schuss eines Fernkaempfers kommt mit Start und Ziel in
// den naechsten Zustand, ein Schlag im Nahkampf nicht. Im Nebel nur, wenn man
// ein Ende sieht.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

// Takte, bis ein Zustand Pfeile traegt; zurueck kommen die Pfeile.
function bisPfeil(welt, zustand, hoechstens) {
  for (let t = 0; t < hoechstens; t++) {
    welt.takten();
    const z = zustand();
    if (z.p?.length) return z.p;
  }
  return null;
}

test('bedienung AC-40: ein Bogenschuetze schiesst einen Pfeil von sich zum Ziel - ein Nahkaempfer nicht', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const basis = welt.spielerVon('a').basis;
  const schuetze = welt.einheitAnlegen('a', basis.x, basis.y + 8, 'bogenschuetze');
  const ziel = welt.einheitAnlegen('b', basis.x + 3, basis.y + 8, 'miliz');
  welt.zustand();
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [schuetze.id], ziel: { x: ziel.x, y: ziel.y } });
  const pfeile = bisPfeil(welt, () => welt.zustand(), 10 * TAKTE_PRO_SEKUNDE);
  assert.ok(pfeile, 'ein Pfeil');
  const [x0, y0, x1, y1] = pfeile[0];
  assert.ok(Math.hypot(x0 - schuetze.x, y0 - schuetze.y) < 1, 'vom Schuetzen');
  assert.ok(Math.hypot(x1 - ziel.x, y1 - ziel.y) < 1, 'zum Ziel');
  // Gegenprobe: zwei Milizen schlagen sich - kein Pfeil.
  const nah = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const b2 = nah.spielerVon('a').basis;
  nah.einheitAnlegen('a', b2.x, b2.y + 8, 'miliz');
  const opfer = nah.einheitAnlegen('b', b2.x + 1, b2.y + 8, 'miliz');
  nah.zustand();
  assert.equal(bisPfeil(nah, () => nah.zustand(), 6 * TAKTE_PRO_SEKUNDE), null, 'Nahkampf: kein Pfeil');
  assert.ok(opfer.leben < 40, 'obwohl geschlagen wurde');
});

test('bedienung AC-40: im Nebel sieht den Pfeil nur, wer ein Ende sieht', () => {
  const welt = new Welt(ZWEI, 4711);
  const basis = welt.spielerVon('a').basis;
  // Weit draussen, wo keiner hinsieht: Annas Bogenschuetze gegen Berts Miliz.
  const x = basis.x;
  const y = basis.y + 25;
  const schuetze = welt.einheitAnlegen('a', x, y, 'bogenschuetze');
  const ziel = welt.einheitAnlegen('b', x + 3, y, 'miliz');
  welt.aufbauFuer('a');
  welt.aufbauFuer('b');
  welt.sichtAktualisieren();
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [schuetze.id], ziel: { x: ziel.x, y: ziel.y } });
  let fuerAnna = null;
  let fuerBert = null;
  for (let t = 0; t < 10 * TAKTE_PRO_SEKUNDE && !fuerAnna; t++) {
    welt.takten();
    const je = welt.zustandJeSpieler(['a', 'b']);
    fuerAnna = je.get('a').p || null;
    fuerBert = fuerBert || je.get('b').p || null;
  }
  assert.ok(fuerAnna, 'Anna sieht ihren Schuetzen - und den Pfeil');
  // Bert sieht seine Miliz, also das Ziel: auch er sieht den Pfeil kommen.
  assert.ok(fuerBert, 'Bert sieht das Ziel - und den Pfeil');
  // Ein Dritter, der weder Schuetzen noch Ziel sieht, bekommt nichts.
  const drei = [...ZWEI, { id: 'c', name: 'Clara' }];
  const w3 = new Welt(drei, 4711);
  // In der Kartenmitte: die Startplaetze liegen auf einem Ring weit draussen,
  // dort sieht keiner hin. (Annas Startplatz plus 25 lag bei dreien neben
  // einem anderen Dorf.)
  const m = Math.floor(w3.karte.groesse / 2);
  const s3 = w3.einheitAnlegen('a', m, m, 'bogenschuetze');
  const z3 = w3.einheitAnlegen('b', m + 3, m, 'miliz');
  w3.sichtAktualisieren();
  w3.nachricht('a', { auftrag: 'befehl', einheiten: [s3.id], ziel: { x: z3.x, y: z3.y } });
  let fuerClara = null;
  let gesehen = false;
  for (let t = 0; t < 10 * TAKTE_PRO_SEKUNDE && !gesehen; t++) {
    w3.takten();
    const je = w3.zustandJeSpieler(['a', 'c']);
    gesehen = Boolean(je.get('a').p);
    fuerClara = fuerClara || je.get('c').p || null;
  }
  assert.ok(gesehen, 'geschossen wurde');
  assert.equal(fuerClara, null, 'Clara sieht nichts davon');
});

test('bedienung AC-40: ohne Zustand - im Pruefstand - waechst die Liste der Pfeile nicht ohne Grenze', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const basis = welt.spielerVon('a').basis;
  // Viele Bogenschuetzen gegen ein Ziel, das lange haelt.
  for (let i = 0; i < 30; i++) welt.einheitAnlegen('a', basis.x - 3 + (i % 6), basis.y + 8 + Math.floor(i / 6), 'bogenschuetze');
  const ziel = welt.einheitAnlegen('b', basis.x + 2, basis.y + 15, 'miliz');
  let geschossen = 0;
  for (let t = 0; t < 120 * TAKTE_PRO_SEKUNDE; t++) {
    ziel.leben = 40;
    const vorher = welt.schuesse?.length || 0;
    welt.takten();
    geschossen += Math.max(0, (welt.schuesse?.length || 0) - vorher);
  }
  assert.ok(geschossen > 100, `geschossen wurde viel (${geschossen})`);
  assert.ok(welt.schuesse.length <= 400, `gemerkt: ${welt.schuesse.length}`);
});
