// Der Aufstieg in die Feudalzeit (bauen AC-23) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md). Die Oberflaeche dazu: bedienung AC-33 in
// e2e/tests/strategie-zeitalter.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { AUFSTIEGE, ZEITALTER } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

/** Eine Welt, in der Anna satt ist und ein zweites Gebaeude hat. */
function bereit({ muehle = true, nahrung = 600 } = {}) {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  anna.nahrung = nahrung;
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === 'dorfzentrum');
  if (muehle) {
    // Ein Stueck weg vom Dorfzentrum, damit sich die Grundflaechen nicht stoeren.
    welt.gebaeudeAnlegen('a', 'muehle', anna.basis.x + 6, anna.basis.y + 6);
  }
  return { welt, anna, zentrum };
}

const aufsteigen = (welt, zentrum) => welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: zentrum.id, einheit: 'feudalzeit' });
const sekunden = (welt, s) => { for (let t = 0; t < s * TAKTE_PRO_SEKUNDE; t++) welt.takten(); };

test('bauen AC-23: der Aufstieg kostet 500 Nahrung und dauert 130 Sekunden', () => {
  assert.deepEqual(AUFSTIEGE.feudalzeit.kosten, { nahrung: 500 }, 'Werte der Vorlage');
  assert.equal(AUFSTIEGE.feudalzeit.zeit, 130);

  const { welt, anna, zentrum } = bereit();
  assert.equal(anna.zeitalter, 0, 'jede Partie beginnt in der Dunklen Zeit');
  assert.deepEqual(aufsteigen(welt, zentrum), {});
  assert.equal(anna.nahrung, 100, 'beim Einreihen bezahlt');
  assert.deepEqual(zentrum.schlange, ['feudalzeit']);

  // Eine Sekunde vor der Zeit ist noch die Dunkle Zeit.
  sekunden(welt, 129);
  assert.equal(anna.zeitalter, 0, 'nach 129 Sekunden noch nicht');
  sekunden(welt, 1);
  assert.equal(anna.zeitalter, 1, 'nach 130 Sekunden Feudalzeit');
  assert.deepEqual(zentrum.schlange, [], 'der Auftrag ist weg');
  assert.equal(ZEITALTER[anna.zeitalter].name, 'Feudalzeit');
});

test('bauen AC-23: Voraussetzung sind zwei fertige Gebaeude der Dunklen Zeit ausser Haeusern', () => {
  const { welt, anna, zentrum } = bereit({ muehle: false });
  // Nur das Dorfzentrum: eines fehlt.
  const absage = aufsteigen(welt, zentrum).fehler;
  assert.match(absage, /2 fertige Gebäude der Dunklen Zeit außer Häusern/);
  assert.match(absage, /vorhanden: 1/);
  assert.equal(anna.nahrung, 600, 'eine Absage kostet nichts');

  // Ein Haus zaehlt nicht.
  welt.gebaeudeAnlegen('a', 'haus', anna.basis.x + 6, anna.basis.y + 6);
  assert.match(aufsteigen(welt, zentrum).fehler, /vorhanden: 1/, 'Haeuser zaehlen nicht');

  // Eine Baustelle zaehlt auch nicht.
  const baustelle = welt.gebaeudeAnlegen('a', 'muehle', anna.basis.x + 9, anna.basis.y + 9, false);
  assert.match(aufsteigen(welt, zentrum).fehler, /vorhanden: 1/, 'eine Baustelle zaehlt nicht');

  // Fertig gebaut: jetzt geht es.
  baustelle.fertig = true;
  baustelle.bau = 1;
  assert.deepEqual(aufsteigen(welt, zentrum), {});
});

test('bauen AC-23: zu wenig Nahrung, zweimal einreihen und das falsche Zeitalter werden abgewiesen', () => {
  const { welt, anna, zentrum } = bereit({ nahrung: 499 });
  assert.equal(aufsteigen(welt, zentrum).fehler, 'Zu wenig Nahrung.');

  anna.nahrung = 1200;
  assert.deepEqual(aufsteigen(welt, zentrum), {});
  assert.match(aufsteigen(welt, zentrum).fehler, /läuft schon/, 'nur einmal');

  // Die Ritterzeit ist noch nicht an der Reihe.
  const spaeter = welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: zentrum.id, einheit: 'ritterzeit' });
  assert.equal(spaeter.fehler, 'Erst die Feudalzeit, dann die Ritterzeit.');

  // Und nach dem Aufstieg gibt es die Feudalzeit nicht noch einmal.
  sekunden(welt, 130);
  assert.equal(anna.zeitalter, 1);
  assert.equal(aufsteigen(welt, zentrum).fehler, 'Die Feudalzeit ist schon erreicht.');
  // Jetzt zaehlen die Gebaeude der Feudalzeit - davon gibt es noch keines.
  const ritter = welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: zentrum.id, einheit: 'ritterzeit' });
  assert.match(ritter.fehler, /Gebäude der Feudalzeit/, 'die Voraussetzung waechst mit');
});

test('bauen AC-23: waehrend des Aufstiegs bildet das Dorfzentrum nichts anderes aus', () => {
  const { welt, zentrum } = bereit({ nahrung: 1000 });
  assert.deepEqual(aufsteigen(welt, zentrum), {});
  // Ein Dorfbewohner darf eingereiht werden - anfangen darf er nicht.
  assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: zentrum.id, einheit: 'dorfbewohner' }), {});
  const vorher = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a').length;
  sekunden(welt, 60);
  assert.deepEqual(zentrum.schlange, ['feudalzeit', 'dorfbewohner'], 'der Aufstieg ist vorn');
  assert.equal([...welt.einheiten.values()].filter((e) => e.besitzer === 'a').length, vorher, 'kein neuer Dorfbewohner');

  // Erst nach dem Aufstieg laeuft der Dorfbewohner an. Im Takt des Aufstiegs
  // steht der Fortschritt wieder auf null - er zaehlt vom naechsten an.
  sekunden(welt, 70);
  assert.equal(welt.spielerVon('a').zeitalter, 1);
  assert.deepEqual(zentrum.schlange, ['dorfbewohner']);
  assert.equal(zentrum.fortschritt, 0, 'der Dorfbewohner faengt bei null an');
  sekunden(welt, 2);
  assert.ok(zentrum.fortschritt > 0, 'jetzt geht es weiter');
});

test('bauen AC-23: ein Abbruch erstattet die Nahrung, auch mitten im Aufstieg', () => {
  const { welt, anna, zentrum } = bereit();
  assert.deepEqual(aufsteigen(welt, zentrum), {});
  sekunden(welt, 60);
  assert.ok(zentrum.fortschritt > 0);
  assert.deepEqual(welt.nachricht('a', { auftrag: 'abbrechen', gebaeude: zentrum.id, platz: 0 }), {});
  assert.equal(anna.nahrung, 600, 'die 500 Nahrung sind zurueck');
  assert.equal(zentrum.fortschritt, 0, 'und der Fortschritt ist weg');
  assert.equal(anna.zeitalter, 0, 'die Dunkle Zeit bleibt');
  // Danach geht es wieder von vorn.
  assert.deepEqual(aufsteigen(welt, zentrum), {});
  sekunden(welt, 130);
  assert.equal(anna.zeitalter, 1);
});

test('bauen AC-23: der Aufstieg laeuft auch bei voller Bevoelkerung weiter', () => {
  const { welt, anna, zentrum } = bereit();
  // Alle Plaetze belegen: so viele Einheiten wie Wohnraum.
  while ((welt.bevoelkerung().get('a') || 0) < welt.wohnraum(anna)) {
    welt.einheitAnlegen('a', anna.basis.x + 3, anna.basis.y + 3);
  }
  assert.deepEqual(aufsteigen(welt, zentrum), {});
  sekunden(welt, 130);
  assert.equal(zentrum.wartet, false, 'ein Aufstieg braucht keinen Platz');
  assert.equal(anna.zeitalter, 1);
});

test('bedienung AC-33: das Zeitalter steht im Zustand, der Fortschritt am Dorfzentrum', () => {
  const { welt, anna, zentrum } = bereit();
  const meine = () => welt.zustand().spieler.find((s) => s.id === 'a');
  assert.equal(meine().z, undefined, 'die Dunkle Zeit wird nicht mitgeschickt');
  assert.deepEqual(aufsteigen(welt, zentrum), {});

  sekunden(welt, 65);
  const draht = welt.gebaeudeFuerDraht(zentrum.id);
  assert.deepEqual(draht.s, ['feudalzeit'], 'der Auftrag steht in der Schlange');
  assert.ok(draht.f > 0.45 && draht.f < 0.55, `rund die Haelfte: ${draht.f}`);

  sekunden(welt, 65);
  assert.equal(meine().z, 1, 'die Feudalzeit steht im Zustand');
  assert.equal(anna.zeitalter, 1);

  // Der Browser bekommt die Namen und die Kosten mit dem Aufbau.
  const aufbau = welt.aufbau();
  assert.deepEqual(aufbau.werte.zeitalter.map((z) => z.name), ['Dunkle Zeit', 'Feudalzeit', 'Ritterzeit', 'Imperialzeit']);
  assert.equal(aufbau.werte.aufstiege.feudalzeit.zeit, 130);
  assert.ok(aufbau.werte.gebaeude.dorfzentrum.bildetAus.includes('feudalzeit'));
});

test('bauen AC-23: fremde Spieler steigen getrennt auf', () => {
  const { welt, anna, zentrum } = bereit();
  const bert = welt.spielerVon('b');
  assert.deepEqual(aufsteigen(welt, zentrum), {});
  sekunden(welt, 130);
  assert.equal(anna.zeitalter, 1);
  assert.equal(bert.zeitalter, 0, 'Bert bleibt in der Dunklen Zeit');
  // Und Bert kann das Dorfzentrum von Anna nicht beauftragen.
  assert.equal(welt.nachricht('b', { auftrag: 'ausbilden', gebaeude: zentrum.id, einheit: 'ritterzeit' }).fehler,
    'Das ist nicht dein Gebäude.');
});
