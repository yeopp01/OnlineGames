// Abruesten (→ specs/10-strategie/einheiten-und-befehle.md AC-50, ADR-0014):
// eine Einheit der Klassen Infanterie, Schuetzen und Reiter legt die Waffen
// ab und wird Dorfbewohner - 40 Nahrung, 20 Sekunden Lehrzeit, in denen sie
// steht und nicht arbeitet. Erstattet wird nur, was ein neuer Befehl
// abbricht (Benutzer, 2026-11-25). Untote, Belagerung, Moench
// und Karren nicht, und nie umgekehrt.
//
// Die Messung, die AC-50 vor `fertig` verlangt (eine KI, die ihre
// Dorfbewohner ueber Kasernen holt, gewinnt nicht mehr als 60 %), steht
// nicht hier: das ist eine Austauschprobe am Pruefstand.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, ABRUESTEN, ruestetAb } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const neueWelt = () => new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
const takten = (welt, sekunden) => {
  for (let t = 0; t < sekunden * TAKTE_PRO_SEKUNDE; t++) welt.takten();
};

test('einheiten AC-50: wer abruesten darf, sagen die Klassen - Fussvolk, Schuetzen, Reiter; Untote, Belagerung, Moench, Karren und Dorfbewohner nicht', () => {
  for (const art of ['miliz', 'speerkaempfer', 'bogenschuetze', 'plaenkler', 'ritter', 'spaeherreiter', 'armbrustschuetze', 'paladin', 'reiterschuetze', 'soeldner']) {
    assert.equal(ruestetAb(art), true, `${art} ruestet ab`);
  }
  for (const art of ['dorfbewohner', 'wiedergaenger', 'ramme', 'mangonel', 'onager', 'moench', 'marktkarren', 'kriegswolf']) {
    assert.equal(ruestetAb(art), false, `${art} ruestet nicht ab`);
  }
  // Jede Art, die abruesten darf, hat eine der drei Klassen und keine der vier.
  for (const art of Object.keys(EINHEITEN).filter(ruestetAb)) {
    const k = EINHEITEN[art].klassen;
    assert.ok(k.some((x) => ABRUESTEN.klassen.includes(x)) && !k.some((x) => ABRUESTEN.nie.includes(x)), art);
  }
  assert.deepEqual(ABRUESTEN.kosten, { nahrung: 40 });
  assert.equal(ABRUESTEN.sekunden, 20);
});

test('einheiten AC-50: ein Ritter ruestet ab - 40 Nahrung beim Befehl, 20 Sekunden steht er, dann ist er Dorfbewohner mit seinem Anteil am Leben', () => {
  const welt = neueWelt();
  const basis = welt.spielerVon('a').basis;
  const ritter = welt.einheitAnlegen('a', basis.x + 5, basis.y + 5, 'ritter');
  ritter.leben = welt.lebenMax('a', 'ritter') / 2;
  const nahrung = welt.spielerVon('a').nahrung;
  const bevoelkerung = welt.bevoelkerung().get('a');

  assert.equal(welt.nachricht('a', { auftrag: 'abruesten', einheiten: [ritter.id] }).fehler, undefined);
  assert.equal(welt.spielerVon('a').nahrung, nahrung - 40, 'bezahlt beim Befehl');
  const gemeldet = () => welt.zustand().einheiten.find((e) => e.i === ritter.id);
  assert.equal(gemeldet().ab, 20, 'der Zustand nennt die Lehrzeit in Sekunden');

  // Ein zweiter Befehl derselben Art kostet nichts noch einmal.
  welt.nachricht('a', { auftrag: 'abruesten', einheiten: [ritter.id] });
  assert.equal(welt.spielerVon('a').nahrung, nahrung - 40, 'nicht zweimal bezahlt');

  const ort = { x: ritter.x, y: ritter.y };
  takten(welt, 19.9);
  assert.equal(ritter.art, 'ritter', 'nach 19,9 Sekunden noch Ritter');
  assert.deepEqual({ x: ritter.x, y: ritter.y }, ort, 'er hat sich nicht bewegt');
  assert.equal(gemeldet().ab, 1);
  takten(welt, 0.2);
  assert.equal(ritter.art, 'dorfbewohner', 'nach 20 Sekunden Dorfbewohner');
  assert.equal(ritter.leben, Math.round(welt.lebenMax('a', 'dorfbewohner') / 2), 'halb tot bleibt halb tot');
  assert.equal(ritter.auftrag, null);
  assert.equal(gemeldet().ab, undefined);
  assert.equal(gemeldet().k, EINHEITEN.dorfbewohner.kuerzel);
  assert.equal(welt.bevoelkerung().get('a'), bevoelkerung, 'die Bevoelkerung bleibt dieselbe');
  assert.equal(welt.spielerVon('a').nahrung, nahrung - 40, 'erstattet wird nichts');
});

test('einheiten AC-50: in der Lehrzeit wacht er nicht und schlaegt nicht zurueck; ein neuer Befehl bricht sie ab, und die Nahrung kommt zurueck', () => {
  const welt = neueWelt();
  const basis = welt.spielerVon('a').basis;
  const miliz = welt.einheitAnlegen('a', basis.x + 5, basis.y + 5, 'miliz');
  const feind = welt.einheitAnlegen('b', basis.x + 7, basis.y + 5, 'miliz');
  welt.sichtAktualisieren();
  const nahrung = welt.spielerVon('a').nahrung;
  welt.nachricht('a', { auftrag: 'abruesten', einheiten: [miliz.id] });
  // Bert greift an; Annas Miliz steht.
  welt.nachricht('b', { einheiten: [feind.id], ziel: { x: miliz.x, y: miliz.y } });
  takten(welt, 5);
  assert.ok(miliz.leben < welt.lebenMax('a', 'miliz'), 'sie wird getroffen');
  assert.equal(miliz.auftrag?.art, 'abruesten', 'und lernt weiter');
  assert.equal(feind.leben, welt.lebenMax('b', 'miliz'), 'sie schlaegt nicht zurueck');

  // Ein Gang bricht die Lehrzeit ab - die 40 Nahrung kommen zurueck
  // (Benutzer, 2026-11-25), wie beim Abbrechen einer Ausbildung.
  assert.equal(welt.spielerVon('a').nahrung, nahrung - 40, 'bezahlt beim Befehl');
  welt.nachricht('a', { einheiten: [miliz.id], ziel: { x: basis.x + 2, y: basis.y + 8 } });
  assert.notEqual(miliz.auftrag?.art, 'abruesten');
  assert.equal(miliz.art, 'miliz');
  assert.equal(welt.spielerVon('a').nahrung, nahrung, 'erstattet');
});

test('einheiten AC-50: erstattet wird nur, wer abbricht - nicht ein zweites Abruesten, nicht Unbeteiligte, nicht wer entlassen wird, nicht nach der Lehrzeit', () => {
  const welt = neueWelt();
  const basis = welt.spielerVon('a').basis;
  const [eins, zwei, drei] = [0, 1, 2].map((i) => welt.einheitAnlegen('a', basis.x + 5 + i, basis.y + 5, 'speerkaempfer'));
  const nichtDabei = welt.einheitAnlegen('a', basis.x + 5, basis.y + 7, 'speerkaempfer');
  const spieler = welt.spielerVon('a');
  spieler.nahrung = 500;
  welt.nachricht('a', { auftrag: 'abruesten', einheiten: [eins.id, zwei.id, drei.id] });
  assert.equal(spieler.nahrung, 380);
  // Noch einmal abruesten: kein Abbruch, kein zweites Bezahlen.
  welt.nachricht('a', { auftrag: 'abruesten', einheiten: [eins.id, zwei.id] });
  assert.equal(spieler.nahrung, 380);
  // Ein Gang fuer einen Lehrling und einen, der nicht lernt: 40 zurueck.
  welt.nachricht('a', { einheiten: [eins.id, nichtDabei.id], ziel: { x: basis.x + 2, y: basis.y + 9 } });
  assert.equal(spieler.nahrung, 420);
  // Entlassen ist kein Abbruch, den man erstattet.
  assert.equal(welt.nachricht('a', { auftrag: 'entlassen', einheit: zwei.id }).fehler, undefined);
  assert.ok(zwei.tot, 'entlassen');
  assert.equal(spieler.nahrung, 420);
  // Nach der Lehrzeit ist er Dorfbewohner; ein Befehl erstattet nichts mehr.
  takten(welt, ABRUESTEN.sekunden + 1);
  assert.equal(drei.art, 'dorfbewohner');
  welt.nachricht('a', { einheiten: [drei.id], ziel: { x: basis.x + 3, y: basis.y + 9 } });
  assert.equal(spieler.nahrung, 420);
});

test('einheiten AC-50: wer nicht darf, wird abgewiesen - Fremde, Moench, Ramme, Dorfbewohner; ohne Nahrung ruestet keiner ab, mit Nahrung fuer zwei ruesten zwei ab', () => {
  const welt = neueWelt();
  const basis = welt.spielerVon('a').basis;
  const moench = welt.einheitAnlegen('a', basis.x + 5, basis.y + 5, 'moench');
  const ramme = welt.einheitAnlegen('a', basis.x + 6, basis.y + 5, 'ramme');
  const dorf = [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  const fremd = welt.einheitAnlegen('b', basis.x + 7, basis.y + 5, 'miliz');
  for (const e of [moench, ramme, dorf, fremd]) {
    assert.match(welt.nachricht('a', { auftrag: 'abruesten', einheiten: [e.id] }).fehler, /Fußvolk, Schützen und Reiter/, e.art);
    assert.notEqual(e.auftrag?.art, 'abruesten');
  }
  assert.match(welt.nachricht('a', { auftrag: 'abruesten' }).fehler, /Wer soll/);

  const drei = [0, 1, 2].map((i) => welt.einheitAnlegen('a', basis.x + 5 + i, basis.y + 7, 'speerkaempfer'));
  welt.spielerVon('a').nahrung = 30;
  assert.match(welt.nachricht('a', { auftrag: 'abruesten', einheiten: drei.map((e) => e.id) }).fehler, /Zu wenig Nahrung/);
  assert.ok(drei.every((e) => e.auftrag?.art !== 'abruesten'));
  welt.spielerVon('a').nahrung = 85;
  assert.equal(welt.nachricht('a', { auftrag: 'abruesten', einheiten: drei.map((e) => e.id) }).fehler, undefined);
  assert.deepEqual(drei.map((e) => e.auftrag?.art === 'abruesten'), [true, true, false], 'zwei bezahlt, der dritte nicht');
  assert.equal(welt.spielerVon('a').nahrung, 5);
});

test('einheiten AC-50: nie umgekehrt - ein Dorfbewohner hat keinen Weg zur Waffe ausser der Ausbildung', () => {
  // Es gibt keine Nachricht, die aus einem Dorfbewohner etwas anderes macht:
  // `abruesten` ist die einzige Wandlung einer stehenden Einheit ausserhalb
  // der Verbesserungen, und sie fuehrt nur zum Dorfbewohner.
  assert.equal(ABRUESTEN.wird, 'dorfbewohner');
  assert.equal(ruestetAb('dorfbewohner'), false);
});
