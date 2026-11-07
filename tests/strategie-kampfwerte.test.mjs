// Die Kampfwerte an der Auswahl (bedienung AC-35) - Rechenteil, direkt
// geprueft (→ docs/adr/0004-teststrategie.md).
//
// Warum der Server das rechnet und nicht der Browser: eine Verbesserung
// wirkt ueber die **Klasse** einer Einheit, nicht ueber ihre Art
// (`wirkungsschluessel`). Wer das im Browser nachbaut, hat die Summierung
// zweimal - und die zweite veraltet. Deshalb schickt der Server eine fertige
// Tafel je Spieler, gerechnet allein ueber `welt.einheitenwert()`.
//
// Die Oberflaeche dazu steht in e2e/tests/strategie-verbesserungen.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, KLASSEN, VERBESSERUNGEN } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const FELDER = ['leben', 'angriff', 'nahruestung', 'fernruestung', 'reichweite'];

test('bedienung AC-35: der Aufbau traegt fuer jeden Spieler die Werte jeder Einheitenart', () => {
  const welt = new Welt(ZWEI, 7);
  const aufbau = welt.aufbau('a');

  for (const s of aufbau.spieler) {
    assert.ok(s.kw, `Spieler ${s.id} bekommt keine Kampfwerte`);
    // Keine Gleichheit auf der ganzen Tafel: EINHEITEN waechst mit den Stufen.
    for (const art of Object.keys(EINHEITEN)) {
      for (const feld of FELDER) {
        assert.equal(s.kw[art]?.[feld], welt.einheitenwert(s.id, art, feld), `${art}.${feld} fuer ${s.id}`);
      }
    }
  }
});

test('bedienung AC-35: eine Verbesserung steht sofort in der Tafel - der Browser summiert nicht selbst', () => {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  // Der Schmiedeangriff wirkt auf die Klasse `infanterie`, nicht auf die Art
  // `speerkaempfer` - genau deshalb darf der Browser es nicht nachrechnen.
  assert.ok(VERBESSERUNGEN.schmiedeangriff.wirkung.infanterie?.angriff > 0, 'der Schmiedeangriff wirkt ueber die Klasse');
  assert.ok(EINHEITEN.speerkaempfer.klassen.includes('infanterie'), 'der Speerkaempfer ist Infanterie');

  const vorher = welt.aufbau('a').spieler.find((s) => s.id === 'a').kw.speerkaempfer.angriff;
  assert.equal(vorher, EINHEITEN.speerkaempfer.angriff, 'ohne Verbesserung der rohe Wert');

  welt.erforschen(anna, 'schmiedeangriff');
  assert.equal(
    welt.aufbau('a').spieler.find((s) => s.id === 'a').kw.speerkaempfer.angriff,
    vorher + VERBESSERUNGEN.schmiedeangriff.wirkung.infanterie.angriff,
    'nach dem Schmiedeangriff steht der verbesserte Wert in der Tafel',
  );
  // Der Dorfbewohner ist keine Infanterie und bleibt, wo er war.
  assert.equal(
    welt.aufbau('a').spieler.find((s) => s.id === 'a').kw.dorfbewohner.angriff,
    welt.einheitenwert('a', 'dorfbewohner', 'angriff'),
  );
});

test('bedienung AC-35: die Tafel kommt im Zustand nur, wenn sie sich geaendert hat', () => {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  const meins = (z) => z.spieler.find((s) => s.id === 'a');

  welt.takten();
  assert.equal(meins(welt.zustand('a')).kw, undefined, 'ohne Aenderung keine Tafel im Zustand');

  welt.erforschen(anna, 'schmiedeangriff');
  const nach = meins(welt.zustand('a'));
  assert.ok(nach.kw, 'nach dem Erforschen kommt die Tafel einmal');
  assert.equal(nach.kw.speerkaempfer.angriff, welt.einheitenwert('a', 'speerkaempfer', 'angriff'));

  assert.equal(meins(welt.zustand('a')).kw, undefined, 'und danach nicht wieder');
});

test('bedienung AC-35: der Bonus steht mit seiner Klasse in den Werten', () => {
  const welt = new Welt(ZWEI, 7);
  const werte = welt.aufbau('a').werte;

  // Der Bonus eines Speerkaempfers zielt auf eine Klasse; damit die Leiste
  // "+15 gegen Kavallerie" schreiben kann, braucht sie deren Namen.
  const bonus = werte.einheiten.speerkaempfer.bonus;
  assert.equal(bonus.kavallerie, EINHEITEN.speerkaempfer.bonus.kavallerie);
  assert.equal(werte.klassen.kavallerie.name, KLASSEN.kavallerie.name);

  // Jede Klasse, die irgendwo als Bonusziel oder an einer Einheit steht, hat
  // einen Namen - sonst stuende in der Leiste ein Bezeichner.
  for (const [art, w] of Object.entries(werte.einheiten)) {
    for (const k of [...(w.klassen || []), ...Object.keys(w.bonus || {})]) {
      assert.ok(werte.klassen[k]?.name, `die Klasse ${k} (${art}) hat keinen Namen`);
    }
  }
});
