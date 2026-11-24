// Angebote an einen Menschen, der nichts auf die Liste setzt (transfer
// AC-31, → docs/manager/dynamik/plan.md, "Angebote an den Menschen").
// Seit Schritt 6 prueft ein Gebot die Gehaltsgrenze, und die Vereine stehen
// im Median knapp ueber ihr - ein solcher Mensch bekam in der Mitte der
// zweiten Liga 0,25 Angebote je Saison. Der Bot ist derselbe wie in
// docs/manager/dynamik/angebote.cjs: er verlaengert, was im letzten
// Vertragsjahr steht und hoechstens 31 ist, und nimmt kein Angebot an.
// Gezaehlt wird jedes neue Angebot im Postfach. Das Skript misst alle acht
// Startwerte, der Test die drei mit den kleinsten Zahlen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Karriere } = require('../server/spiele/manager/karriere.js');
const kader = require('../server/spiele/manager/kader.js');
const vertraege = require('../server/spiele/manager/vertraege.js');
const { fensterOffen } = require('../server/spiele/manager/kalender.js');
const { TERMINE } = require('../server/spiele/manager/welt.js');

const SAISONS = 10;
const STARTWERTE = [4711, 1234, 31337];
// Gesetzt, kein Wert aus Anstoss 3: so viel bekam derselbe Mensch vor
// Schritt 6 an jedem der acht Startwerte (4afef8e: kleinster Wert 2,4 /
// 2,1 / 1,5).
const MINDESTENS = { 1: 2, 2: 1 };

/** Der Verein auf Rang `rang` (0 = der staerkste) der Liga beim Start. */
function vereinAufRang(startwert, liga, rang) {
  const probe = Karriere.neu({ startwert, vereinId: null });
  return probe.vereine.filter((v) => v.liga === liga).sort((a, b) => kader.niveau(b) - kader.niveau(a))[rang].id;
}

/**
 * Neue Angebote je Saison an einen Menschen, der nur verlaengert - und wie
 * oft ein Verein im selben Fenster ein zweites Mal auf denselben Spieler bot.
 */
function verwalten(startwert, liga, rang) {
  const k = Karriere.neu({ startwert, vereinId: vereinAufRang(startwert, liga, rang), name: 'Bot' });
  const m = k.manager[0];
  const gesehen = new Set();
  let imFenster = new Set();
  let doppelt = 0;
  while (k.saison <= SAISONS) {
    if (m.status === 'entlassen') k.stelleAntreten('m1', m.stellen[0]);
    const verein = k.vereinVon(m.vereinId);
    for (const s of verein.spieler) {
      if (!s.vertrag || s.vertrag.bis > k.saison || s.alter > 31 || s.karriereende) continue;
      if (k.termin >= 30) k.verlaengern('m1', s.id, Math.min(2, vertraege.laufzeitMax(s)));
    }
    const r = k.weiter();
    assert.ok(!r.fehler, r.fehler);
    if (!fensterOffen(TERMINE[k.termin])) imFenster = new Set();
    for (const a of m.angebote) {
      if (gesehen.has(a.id)) continue;
      gesehen.add(a.id);
      const paar = `${a.vereinId}:${a.spielerId}`;
      if (imFenster.has(paar)) doppelt += 1;
      imFenster.add(paar);
    }
  }
  return { jeSaison: gesehen.size / SAISONS, doppelt };
}

function pruefen(liga, rang) {
  for (const startwert of STARTWERTE) {
    const { jeSaison } = verwalten(startwert, liga, rang);
    assert.ok(jeSaison >= MINDESTENS[liga],
      `Startwert ${startwert}: ${jeSaison.toFixed(2)} Angebote je Saison, verlangt ${MINDESTENS[liga]}`);
  }
}

// Die Namen stehen ausgeschrieben: scripts/check-belege.mjs liest keine
// Namen mit Platzhaltern.
test('transfer AC-31: wer nichts auf die Liste setzt, bekommt Angebote - der beste der ersten Liga', () => pruefen(1, 0));
test('transfer AC-31: wer nichts auf die Liste setzt, bekommt Angebote - die Mitte der ersten Liga', () => pruefen(1, 8));
test('transfer AC-31: wer nichts auf die Liste setzt, bekommt Angebote - die Mitte der zweiten Liga', () => pruefen(2, 8));

// Der Fall mit den meisten Angeboten (4711, bester Verein der ersten Liga).
// Heute verhindern es schon die Gueltigkeit von zwei Terminen und "wessen
// Angebot gilt, bietet nicht neu"; die Regel haelt es, auch wenn sich das
// aendert (m.geboten in ablauf.js).
test('transfer AC-31: ein Verein bietet je Fenster hoechstens einmal auf denselben Spieler', () => {
  const { jeSaison, doppelt } = verwalten(4711, 1, 0);
  assert.ok(jeSaison > 0, 'kein Angebot - der Test prueft nichts');
  assert.equal(doppelt, 0);
});
