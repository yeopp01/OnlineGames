// Wer satt ist, verkauft nicht (transfer AC-30, → docs/manager/dynamik/plan.md,
// Schritt 6): ein Verein des Servers mit mehr als dreimal so viel auf dem
// Konto, wie er im Jahr erwartet einzunehmen (transfer.MARKT.sattAb), gibt
// niemanden ab, der nicht auf seiner Liste steht - dem Menschen nicht und
// den anderen Vereinen nicht. Dieselbe Regel fuer beide.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Karriere } = require('../server/spiele/manager/karriere.js');
const kader = require('../server/spiele/manager/kader.js');
const transfer = require('../server/spiele/manager/transfer.js');
const finanzen = require('../server/spiele/manager/finanzen.js');
const vertraege = require('../server/spiele/manager/vertraege.js');

const STARTWERT = 4711;

/** Eine Karriere beim staerksten Verein der ersten Liga, mit Geld fuer alles. */
function karriere() {
  const probe = Karriere.neu({ startwert: STARTWERT, vereinId: null });
  const bester = probe.vereine.filter((v) => v.liga === 1).sort((a, b) => kader.niveau(b) - kader.niveau(a))[0];
  const k = Karriere.neu({ startwert: STARTWERT, vereinId: bester.id, name: 'Anna' });
  const mensch = k.vereinVon(k.manager[0].vereinId);
  mensch.konto = 500000;
  return { k, mensch };
}

const sattGrenze = (verein) => transfer.MARKT.sattAb * finanzen.erwarteteEinnahmen(verein);

test('transfer AC-30: ein satter Verein verkauft dem Menschen nur, wer auf seiner Liste steht', () => {
  const { k, mensch } = karriere();
  const verkaeufer = k.vereine.find((v) => v !== mensch && v.liga === 1);
  const spieler = verkaeufer.spieler.find((s) => transfer.bestandNachAbgang(verkaeufer, s) >= kader.MINDESTBESTAND[s.position]
    && vertraege.wechselbereit(s, mensch).ok && !s.karriereende);
  assert.ok(spieler, 'im Verkaeufer steht ein Spieler, der wechseln wuerde');
  const gebot = 2 * transfer.forderung(verkaeufer, spieler, k.saison);
  const laufzeit = Math.min(2, vertraege.laufzeitMax(spieler));

  verkaeufer.konto = sattGrenze(verkaeufer) + 1000;
  const abgelehnt = transfer.kaufPruefen(k, mensch, spieler.id, gebot, laufzeit);
  assert.match(abgelehnt.fehler || '', /muss nicht verkaufen/);
  assert.ok(abgelehnt.fehler.includes(spieler.name), `die Absage nennt den Spieler: ${abgelehnt.fehler}`);

  spieler.transferliste = true;
  assert.ok(transfer.kaufPruefen(k, mensch, spieler.id, gebot, laufzeit).ok, 'auf der Liste ist er zu haben');

  spieler.transferliste = null;
  verkaeufer.konto = sattGrenze(verkaeufer) - 1000;
  assert.ok(transfer.kaufPruefen(k, mensch, spieler.id, gebot, laufzeit).ok, 'knapp unter der Grenze verkauft er');

  verkaeufer.konto = sattGrenze(verkaeufer) + 1000;
  const r = k.kaufen('m1', spieler.id, gebot, laufzeit);
  assert.match(r.fehler || '', /muss nicht verkaufen/, 'auch ueber den Weg des Menschen');
  assert.ok(verkaeufer.spieler.includes(spieler));
});

test('transfer AC-30: ein satter Verein verkauft auch den anderen Vereinen nur von seiner Liste', () => {
  const { k, mensch } = karriere();
  const andere = k.vereine.filter((v) => v !== mensch);
  const kaeufer = andere.find((v) => v.liga === 2);
  kaeufer.konto = 400000;
  k.freie = [];
  const zugaenge = () => kader.POSITIONEN.map((p) => transfer.besterZugang(k, kaeufer, p, false)).filter(Boolean);

  for (const v of andere) if (v !== kaeufer) v.konto = 0.5 * finanzen.erwarteteEinnahmen(v);
  const vorher = zugaenge();
  assert.ok(vorher.some((z) => z.verkaeufer), 'ohne satte Vereine findet der Kaeufer jemanden bei einem anderen Verein');

  for (const v of andere) if (v !== kaeufer) v.konto = sattGrenze(v) + 1000;
  assert.deepEqual(zugaenge(), [], 'sind alle satt und niemand steht auf einer Liste, gibt es niemanden');

  const gelistet = vorher.find((z) => z.verkaeufer).spieler;
  gelistet.transferliste = true;
  const nachher = zugaenge();
  assert.ok(nachher.some((z) => z.spieler === gelistet), 'wer auf der Liste steht, ist auch bei einem satten Verein zu haben');
  assert.ok(nachher.every((z) => z.spieler.transferliste), 'sonst niemand');
});
