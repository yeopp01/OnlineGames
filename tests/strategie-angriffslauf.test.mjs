// Der Angriffslauf (kampf AC-4) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md). Ein Befehl auf ein leeres Feld, bei dem
// unterwegs angegriffen wird, was im Weg steht; danach geht der Marsch weiter.
// Die Oberflaeche dazu steht in e2e/tests/strategie-angriffslauf.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

/** Der Rechtsklick des Browsers, wahlweise als Angriffslauf. */
function rechtsklick(welt, spielerId, einheiten, auf, angriffslauf = false) {
  return welt.nachricht(spielerId, {
    auftrag: 'befehl',
    einheiten: einheiten.map((e) => e.id),
    ziel: { x: auf.x, y: auf.y },
    ...(angriffslauf ? { angriffslauf: true } : {}),
  });
}

function taktenBis(welt, bedingung, grenze = 3000) {
  for (let t = 0; t < grenze; t++) {
    welt.takten();
    if (bedingung()) return t + 1;
  }
  throw new Error('nicht eingetreten in ' + grenze + ' Takten');
}

/**
 * Annas Soldat links, Berts Miliz in der Mitte, das Marschziel rechts - alle
 * auf einer Zeile. Wer stumpf laeuft, geht an der Miliz vorbei; wer im
 * Angriffslauf ist, bleibt stehen und schlaegt zu.
 */
function reiheAuf({ abstandZumFeind = 8, abstandZumZiel = 20 } = {}) {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('a').basis;
  const start = { x: basis.x + 3, y: basis.y + 6 };
  const soldat = welt.einheitAnlegen('a', start.x, start.y, 'soldat');
  const feind = welt.einheitAnlegen('b', start.x + abstandZumFeind, start.y, 'miliz');
  return { welt, soldat, feind, ziel: { x: start.x + abstandZumZiel, y: start.y }, start };
}

test('kampf AC-4: im Angriffslauf wird angegriffen, was im Weg steht - ohne Angriffslauf nicht', () => {
  // Ohne: er laeuft an der fremden Miliz vorbei zum Ziel und ruehrt sie nicht an.
  const ohne = reiheAuf();
  rechtsklick(ohne.welt, 'a', [ohne.soldat], ohne.ziel);
  taktenBis(ohne.welt, () => !ohne.soldat.weg.length);
  assert.equal(ohne.feind.leben, EINHEITEN.miliz.leben, 'unbehelligt');
  assert.ok(Math.hypot(ohne.soldat.x - ohne.ziel.x, ohne.soldat.y - ohne.ziel.y) < 2, 'am Marschziel');

  // Mit: dieselbe Lage, derselbe Klick - die Miliz faellt unterwegs.
  const mit = reiheAuf();
  rechtsklick(mit.welt, 'a', [mit.soldat], mit.ziel, true);
  assert.equal(mit.soldat.auftrag.art, 'gehen', 'es ist ein Marsch, kein Angriffsbefehl');
  assert.ok(mit.soldat.angriffslauf, 'das Marschziel ist gemerkt');
  taktenBis(mit.welt, () => mit.feind.tot);
  assert.equal(mit.feind.tot, true, 'die Miliz im Weg faellt');
});

test('kampf AC-4: nach dem Gefecht geht der Marsch weiter bis ans Ziel', () => {
  const { welt, soldat, feind, ziel } = reiheAuf();
  rechtsklick(welt, 'a', [soldat], ziel, true);
  taktenBis(welt, () => feind.tot);
  // Nicht stehenbleiben, wo gekaempft wurde: der Befehl galt dem Marschziel.
  const beimGefecht = { x: soldat.x, y: soldat.y };
  assert.ok(Math.hypot(beimGefecht.x - ziel.x, beimGefecht.y - ziel.y) > 5, 'das Gefecht war unterwegs');
  taktenBis(welt, () => Math.hypot(soldat.x - ziel.x, soldat.y - ziel.y) < 2);
  // Angekommen ist der Angriffslauf zu Ende - sonst wuerde er ewig weiter suchen.
  taktenBis(welt, () => !soldat.auftrag && !soldat.weg.length);
  assert.equal(soldat.angriffslauf, null, 'am Ziel ist der Lauf zu Ende');
});

test('kampf AC-4: ein Angriffslauf sammelt nicht und baut nicht', () => {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('a').basis;
  const [bauer] = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  const wald = welt.naechsterVorrat(basis, require('../server/spiele/strategie/karte.js').WALD);
  assert.ok(wald, 'es gibt Wald in der Naehe');

  // Derselbe Klick auf denselben Baum: einmal sammelt er, einmal laeuft er nur.
  rechtsklick(welt, 'a', [bauer], wald);
  assert.equal(bauer.auftrag.art, 'sammeln');
  rechtsklick(welt, 'a', [bauer], wald, true);
  assert.equal(bauer.auftrag.art, 'gehen', 'im Angriffslauf wird nicht gesammelt');
  for (let t = 0; t < 60 * TAKTE_PRO_SEKUNDE && !bauer.sammelt; t++) welt.takten();
  assert.equal(bauer.sammelt, false, 'und er faengt auch unterwegs nicht an');
});

test('kampf AC-4: ein neuer Befehl beendet den Angriffslauf', () => {
  const { welt, soldat, ziel, start } = reiheAuf();
  rechtsklick(welt, 'a', [soldat], ziel, true);
  assert.ok(soldat.angriffslauf);
  rechtsklick(welt, 'a', [soldat], { x: start.x, y: start.y + 3 });
  assert.equal(soldat.angriffslauf, null);
});

test('kampf AC-2: wer angekommen ist, wehrt sich wieder - der Gehauftrag bleibt nicht liegen', () => {
  // Gefunden beim Bau des Angriffslaufs (Runde 67): ein erledigter Gehauftrag
  // blieb an der Einheit haengen, und die Wache ueberspringt jede Einheit mit
  // Auftrag. Wer einmal irgendwohin geschickt wurde, wehrte sich nie mehr.
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('a').basis;
  const posten = welt.einheitAnlegen('a', basis.x + 3, basis.y + 6, 'miliz');
  const ziel = { x: basis.x + 6, y: basis.y + 6 };
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [posten.id], ziel });
  taktenBis(welt, () => !posten.weg.length && !posten.auftrag);
  assert.equal(posten.auftrag, null, 'angekommen heisst: kein Auftrag mehr');

  // Jetzt kommt ein Feind in Sichtweite - und die Miliz greift von selbst an.
  const feind = welt.einheitAnlegen('b', Math.round(posten.x) + 2, Math.round(posten.y), 'miliz');
  taktenBis(welt, () => posten.auftrag?.art === 'angreifen', 20);
  assert.equal(posten.auftrag.ziel, feind.id);
});

test('kampf AC-2: zwei Waechter desselben Ziels stehen nicht uebereinander', () => {
  // Gefunden am Bild zu AC-4 (Runde 67): zwei Milizen, zusammen losgeschickt,
  // standen 0,00 Felder auseinander - eine Figur mit zwei Schwertern. Die
  // Wache hat ihren Platz mit `nachbarfeld` gesucht, und das fragt die Karte,
  // nicht die Einheiten. Jetzt stellt sie alle Angreifer eines Ziels auf.
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('a').basis;
  const start = { x: basis.x + 3, y: basis.y + 6 };
  const eins = welt.einheitAnlegen('a', start.x, start.y, 'miliz');
  const zwei = welt.einheitAnlegen('a', start.x, start.y, 'miliz');
  const ziel = { x: start.x + 12, y: start.y };
  rechtsklick(welt, 'a', [eins, zwei], ziel, true);
  const opfer = welt.einheitAnlegen('b', start.x + 6, start.y, 'dorfbewohner');

  taktenBis(welt, () => eins.auftrag?.art === 'angreifen' && zwei.auftrag?.art === 'angreifen');
  assert.notDeepEqual(eins.auftrag.platz, zwei.auftrag.platz, 'zwei Plaetze, nicht einer'); // gleichheit-ok
  // Erst messen, wenn beide an ihrem Platz stehen - unterwegs sind sie noch
  // auf einer Linie, der erste Schlag faellt vor der Ankunft des zweiten.
  taktenBis(welt, () => !eins.weg.length && !zwei.weg.length && opfer.leben < EINHEITEN.dorfbewohner.leben);
  const abstand = Math.hypot(eins.x - zwei.x, eins.y - zwei.y);
  assert.ok(abstand > 0.5, 'im Gefecht ein halbes Feld auseinander, war ' + abstand.toFixed(2));
});
