// Gebaeude, die schiessen (bauen AC-29, kampf AC-20) - Rechenteile, direkt
// geprueft (→ docs/adr/0004-teststrategie.md). Die Oberflaeche dazu:
// e2e/tests/strategie-tuerme.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

/**
 * Eine Welt mit Annas fertigem Turm in der Kartenmitte - weit weg von beiden
 * Doerfern, damit keine Starteinheit dazwischenlaeuft. Der Platz kommt aus
 * `platzPruefen`, nicht aus einer eigenen Regel.
 */
function mitTurm(art = 'wachturm', fertig = true) {
  const welt = new Welt(ZWEI, 7);
  const mitte = Math.floor(welt.karte.groesse / 2);
  let platz = null;
  for (let r = 0; r < 20 && !platz; r++) {
    for (let dy = -r; dy <= r && !platz; dy++) {
      for (let dx = -r; dx <= r && !platz; dx++) {
        // Rechts daneben muessen zehn Felder frei sein: dort stehen die Ziele.
        const frei = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].every((d) => welt.platzPruefen('haus', mitte + dx + d, mitte + dy));
        if (frei && welt.platzPruefen(art, mitte + dx, mitte + dy)) platz = { x: mitte + dx, y: mitte + dy };
      }
    }
  }
  assert.ok(platz, 'ein freier Platz in der Mitte');
  const turm = welt.gebaeudeAnlegen('a', art, platz.x, platz.y, fertig);
  return { welt, turm };
}

/** Eine Einheit von Bert, `abstand` Felder rechts vom Turm. */
const fremd = (welt, turm, abstand, art = 'miliz', besitzer = 'b') => welt.einheitAnlegen(besitzer, turm.x + abstand, turm.y, art);

function sekunden(welt, s) {
  for (let t = 0; t < Math.round(s * TAKTE_PRO_SEKUNDE); t++) welt.takten();
}

test('bauen AC-29: der Wachturm mit den Werten der Vorlage - ab der Feudalzeit, vom Dorfbewohner gebaut', () => {
  const t = GEBAEUDE.wachturm;
  assert.deepEqual(t.kosten, { holz: 25, stein: 125 });
  assert.equal(t.bauzeit, 80);
  assert.equal(t.leben, 1020);
  assert.equal(t.groesse, 1);
  assert.equal(t.zeitalter, 1, 'ab der Feudalzeit wie im Original');
  assert.equal(t.angriff, 5);
  assert.equal(t.reichweite, 8);
  assert.equal(t.nachladen, 2);
  assert.equal(t.fernruestung, 7, 'Mauerwerk wie jedes Gebaeude');
  // Er sieht, worauf er schiesst - die Sicht reicht ueber die Reichweite.
  assert.ok(t.sicht > t.reichweite, `Sicht ${t.sicht}, Reichweite ${t.reichweite}`);
  assert.ok(EINHEITEN.dorfbewohner.baut.includes('wachturm'));
});

test('bauen AC-29: ein fertiger Turm schiesst von selbst, der erste Pfeil sofort, dann alle zwei Sekunden', () => {
  const { welt, turm } = mitTurm();
  const miliz = fremd(welt, turm, 6);
  welt.takten();
  // Miliz 40 Leben, Fernruestung 1: ein Pfeil nimmt 5 - 1 = 4.
  assert.equal(miliz.leben, 36, 'der erste Pfeil im ersten Takt');
  // Zehn Sekunden: Pfeile bei 0, 2, 4, 6 und 8 Sekunden - fuenf.
  sekunden(welt, 10 - 1 / TAKTE_PRO_SEKUNDE);
  assert.equal(miliz.leben, 40 - 5 * 4, 'fuenf Pfeile in zehn Sekunden');
  assert.equal(miliz.auftrag, null, 'die Miliz hat keinen Befehl bekommen - der Turm schoss von selbst');
});

test('bauen AC-29: die Reichweite ist acht Felder vom Rand des Turms, keines mehr', () => {
  const { welt, turm } = mitTurm();
  const nah = fremd(welt, turm, 8);
  welt.takten();
  assert.equal(nah.leben, 36, 'auf acht Feldern getroffen');
  const zweite = mitTurm();
  const fern = fremd(zweite.welt, zweite.turm, 8.6);
  sekunden(zweite.welt, 5);
  assert.equal(fern.leben, 40, 'auf achteinhalb Feldern nicht');
});

test('bauen AC-29: zuerst auf den Naechsten, und er bleibt dabei, solange das Ziel in Reichweite lebt', () => {
  const { welt, turm } = mitTurm();
  const weiter = fremd(welt, turm, 7);
  const naeher = fremd(welt, turm, 3);
  welt.takten();
  assert.equal(naeher.leben, 36, 'der Naehere zuerst');
  assert.equal(weiter.leben, 40);
  // Ein Dritter kommt noch naeher: der Turm bleibt bei seinem Ziel.
  const ganzNah = fremd(welt, turm, 2);
  sekunden(welt, 2);
  assert.equal(naeher.leben, 32, 'beim alten Ziel geblieben');
  assert.equal(ganzNah.leben, 40);
});

test('bauen AC-29: Gegenprobe - kein Pfeil auf Eigene, aus einer Baustelle oder aus einem Gebaeude ohne Angriff', () => {
  const eigen = mitTurm();
  const annas = fremd(eigen.welt, eigen.turm, 4, 'miliz', 'a');
  sekunden(eigen.welt, 4);
  assert.equal(annas.leben, 40, 'auf Eigene schiesst er nicht');

  const baustelle = mitTurm('wachturm', false);
  const vorDerBaustelle = fremd(baustelle.welt, baustelle.turm, 4);
  sekunden(baustelle.welt, 4);
  assert.equal(vorDerBaustelle.leben, 40, 'eine Baustelle schiesst nicht');

  // Der Aussenposten sieht zehn Felder, hat aber keinen Angriff.
  assert.ok(!GEBAEUDE.aussenposten.angriff);
  const posten = mitTurm('aussenposten');
  const vorDemPosten = fremd(posten.welt, posten.turm, 4);
  sekunden(posten.welt, 4);
  assert.equal(vorDemPosten.leben, 40, 'ein Gebaeude ohne Angriff schiesst nicht');
});

test('kampf AC-20: der Turm trifft nach derselben Formel wie eine Einheit - Pfeil gegen Fernruestung plus Bonus', () => {
  const { welt, turm } = mitTurm();
  // Gezaehlt aus den Daten, nicht aus dem Gedaechtnis: jede Einheit, die es gibt.
  for (const art of Object.keys(EINHEITEN)) {
    const ziel = fremd(welt, turm, 5, art);
    const erwartet = Math.max(1, 5 - welt.einheitenwert('b', art, 'fernruestung'));
    assert.equal(welt.schaden(turm, ziel, false), erwartet, art);
  }
  // Zwei Zahlen zum Nachrechnen: Dorfbewohner 0 Fernruestung, Plaenkler 3.
  assert.equal(welt.schaden(turm, fremd(welt, turm, 5, 'dorfbewohner'), false), 5);
  assert.equal(welt.schaden(turm, fremd(welt, turm, 5, 'plaenkler'), false), 2);
  // Der Webstuhl gibt dem Dorfbewohner +2 Fernruestung - auch gegen den Turm.
  welt.spielerVon('b').verbesserungen.push('webstuhl');
  assert.equal(welt.schaden(turm, fremd(welt, turm, 5, 'dorfbewohner'), false), 3, 'mit Webstuhl');
});

test('kampf AC-20: Pfeile treffen Mauerwerk kaum - ein Turm richtet an einem Gebaeude nur 1 aus', () => {
  const { welt, turm } = mitTurm();
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'b' && g.art === 'dorfzentrum');
  assert.equal(welt.schaden(turm, zentrum, true), 1, '5 Angriff gegen 7 Fernruestung');
  // Und Gebaeude beschiesst er nicht von selbst: das Zentrum steht weit weg,
  // aber auch ein fremdes Haus neben dem Turm bleibt heil.
  const haus = welt.gebaeudeAnlegen('b', 'haus', turm.x + 3, turm.y);
  sekunden(welt, 4);
  assert.equal(haus.leben, GEBAEUDE.haus.leben, 'kein Pfeil auf das Haus');
});

test('kampf AC-20: der Pfeil fliegt aus dem Turm, und wer getroffen wird, laesst die Arbeit nicht liegen', () => {
  const { welt, turm } = mitTurm();
  const bauer = fremd(welt, turm, 5, 'dorfbewohner');
  bauer.auftrag = { art: 'gehen', feld: { x: bauer.x, y: bauer.y + 30 } };
  welt.schuesse = [];
  welt.takten();
  assert.equal(bauer.leben, 20, 'getroffen');
  const pfeil = welt.schuesse.at(-1);
  assert.deepEqual(pfeil.slice(0, 2), [turm.x, turm.y], 'der Pfeil beginnt in der Mitte des Turms');
  // Mit der Axt auf 1020 Leben Stein loszugehen, waere der schnellste Tod.
  assert.notEqual(bauer.auftrag?.art, 'angreifen', 'kein Gegenangriff auf den Turm');
});
