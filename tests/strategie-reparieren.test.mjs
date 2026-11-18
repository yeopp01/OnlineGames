// Reparieren (bauen AC-45) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md). Die Oberflaeche dazu:
// e2e/tests/strategie-reparieren.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, REPARATUR } = require('../server/spiele/strategie/daten.js');

const DREI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }, { id: 'c', name: 'Carla' }];
const sekunden = (welt, s) => { for (let t = 0; t < s * TAKTE_PRO_SEKUNDE; t++) welt.takten(); };

/**
 * Anna und Bert im Buendnis gegen Carla, Anna satt, und ein freier Platz von
 * elf mal elf Feldern neben ihrem Dorf, weit weg von allen Einheiten. `x0`,
 * `y0` ist seine Ecke.
 */
function weltMitPlatz() {
  const welt = new Welt(DREI, 7, { sicht: 'aufgedeckt', teams: { a: 1, b: 1, c: 2 } });
  const anna = welt.spielerVon('a');
  Object.assign(anna, { nahrung: 2000, holz: 2000, gold: 2000, stein: 500 });
  for (let r = 6; r < 40; r++) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r], [r, r], [-r, r], [r, -r], [-r, -r]]) {
      const x0 = anna.basis.x + dx;
      const y0 = anna.basis.y + dy;
      let frei = true;
      for (let y = y0; y < y0 + 11 && frei; y++) {
        for (let x = x0; x < x0 + 11 && frei; x++) frei = welt.platzPruefen('haus', x, y) && welt.platzPruefen('haus', x + 1, y + 1);
      }
      if (frei && ![...welt.einheiten.values()].some((e) => e.x >= x0 - 6 && e.x <= x0 + 16 && e.y >= y0 - 6 && e.y <= y0 + 16)) {
        return { welt, anna, x0, y0 };
      }
    }
  }
  throw new Error('kein freier Platz');
}

/** Eine Kaserne mitten auf dem Platz, der `fehlt` Leben fehlen, und `n` Dorfbewohner daneben. */
function beschaedigteKaserne(fehlt, n = 1, besitzer = 'a') {
  const lage = weltMitPlatz();
  const { welt, x0, y0 } = lage;
  const kaserne = welt.gebaeudeAnlegen(besitzer, 'kaserne', x0 + 4, y0 + 4);
  kaserne.leben -= fehlt;
  const leute = [];
  for (let i = 0; i < n; i++) leute.push(welt.einheitAnlegen('a', x0 + 3, y0 + 4 + i, 'dorfbewohner'));
  return { ...lage, kaserne, leute };
}
const befehl = (welt, leute, gebaeude, spieler = 'a') => welt.nachricht(spieler, {
  auftrag: 'befehl', einheiten: leute.map((e) => e.id), ziel: { x: gebaeude.x, y: gebaeude.y },
});
/** So lange takten, bis der erste arbeitet - hoechstens zehn Sekunden. */
function bisErArbeitet(welt, einheit) {
  for (let t = 0; t < 10 * TAKTE_PRO_SEKUNDE && !einheit.baut; t++) welt.takten();
  assert.ok(einheit.baut, 'er steht am Gebaeude und repariert');
}

test('bauen AC-45: ein Dorfbewohner repariert ein beschaedigtes Gebaeude - 12,5 Leben je Sekunde, zum halben Baupreis', () => {
  assert.deepEqual(REPARATUR, { lebenJeSekunde: 12.5, weitere: 0.5, kostenanteil: 0.5 });
  const { welt, anna, kaserne, leute } = beschaedigteKaserne(600);
  const voll = welt.gebaeudewert('a', 'kaserne', 'leben');
  assert.equal(voll, 1200);
  assert.equal(befehl(welt, leute, kaserne)?.fehler, undefined);
  assert.equal(leute[0].auftrag.art, 'reparieren');
  bisErArbeitet(welt, leute[0]);

  // Zehn Sekunden: 125 Leben - und das Leben bleibt eine ganze Zahl.
  const leben = kaserne.leben;
  const holz = anna.holz;
  for (let s = 0; s < 10; s++) {
    sekunden(welt, 1);
    assert.ok(Number.isInteger(kaserne.leben), `nach ${s + 1} s ist das Leben ${kaserne.leben}`);
  }
  assert.ok(Math.abs(kaserne.leben - leben - 125) <= 1, `in zehn Sekunden ${kaserne.leben - leben} Leben`);
  // 125 von 1200 Leben kosten 125/1200 vom halben Preis: 9,1 Holz.
  const anteil = (kaserne.leben - leben) / voll * GEBAEUDE.kaserne.kosten.holz * REPARATUR.kostenanteil;
  assert.ok(Math.abs(holz - anna.holz - anteil) <= 1, `bezahlt ${holz - anna.holz} Holz, gerechnet ${anteil.toFixed(1)}`);

  // Bis es ganz ist: 600 Leben kosten 43,75 Holz, kein anderer Rohstoff.
  const vorher = { nahrung: anna.nahrung, gold: anna.gold, stein: anna.stein };
  sekunden(welt, 45);
  assert.equal(kaserne.leben, voll, 'nach knapp fuenfzig Sekunden ist sie ganz');
  assert.equal(leute[0].auftrag, null, 'der Auftrag ist erledigt');
  assert.equal(leute[0].baut, false);
  const bezahlt = 2000 - anna.holz;
  assert.ok(bezahlt === 43 || bezahlt === 44, `600 Leben haben ${bezahlt} Holz gekostet`);
  assert.deepEqual({ nahrung: anna.nahrung, gold: anna.gold, stein: anna.stein }, vorher);
  // Und nicht darueber hinaus.
  sekunden(welt, 3);
  assert.equal(kaserne.leben, voll);
  assert.equal(2000 - anna.holz, bezahlt);
});

test('bauen AC-45: der zweite am selben Gebaeude schafft die Haelfte', () => {
  const einer = beschaedigteKaserne(1000, 1);
  befehl(einer.welt, einer.leute, einer.kaserne);
  bisErArbeitet(einer.welt, einer.leute[0]);
  const zwei = beschaedigteKaserne(1000, 2);
  befehl(zwei.welt, zwei.leute, zwei.kaserne);
  bisErArbeitet(zwei.welt, zwei.leute[0]);
  bisErArbeitet(zwei.welt, zwei.leute[1]);
  const a = einer.kaserne.leben;
  const b = zwei.kaserne.leben;
  sekunden(einer.welt, 20);
  sekunden(zwei.welt, 20);
  const allein = einer.kaserne.leben - a;
  const zuZweit = zwei.kaserne.leben - b;
  assert.ok(Math.abs(allein - 250) <= 1, `allein ${allein} Leben in zwanzig Sekunden`);
  assert.ok(Math.abs(zuZweit - 375) <= 1, `zu zweit ${zuZweit}`);
});

test('bauen AC-45: ohne den Rohstoff geht niemand los - und geht er unterwegs aus, ruht die Reparatur, bis wieder etwas da ist', () => {
  const { welt, anna, kaserne, leute } = beschaedigteKaserne(600);
  anna.holz = 0;
  assert.equal(befehl(welt, leute, kaserne).fehler, 'Zu wenig Holz für die Reparatur.');
  assert.equal(leute[0].auftrag, null, 'niemand ist losgegangen');

  anna.holz = 3;
  assert.equal(befehl(welt, leute, kaserne)?.fehler, undefined);
  bisErArbeitet(welt, leute[0]);
  sekunden(welt, 60);
  assert.equal(anna.holz, 0, 'die drei Holz sind verbaut');
  const stand = kaserne.leben;
  assert.ok(stand > 600 && stand < 700, `mit drei Holz bis ${stand} Leben`);
  sekunden(welt, 10);
  assert.equal(kaserne.leben, stand, 'ohne Holz geht es nicht weiter');
  assert.equal(leute[0].baut, false, 'er arbeitet sichtbar nicht');
  assert.equal(leute[0].auftrag.art, 'reparieren', 'aber er bleibt dabei');

  anna.holz = 100;
  sekunden(welt, 10);
  assert.ok(kaserne.leben > stand + 100, 'mit neuem Holz geht es weiter');
  assert.equal(leute[0].baut, true);
});

test('bauen AC-45: auch das Gebaeude eines Verbuendeten - es zahlt, wer repariert; das eines Gegners wird angegriffen', () => {
  const { welt, anna, kaserne, leute } = beschaedigteKaserne(300, 1, 'b');
  const bert = welt.spielerVon('b');
  const bertHolz = bert.holz;
  assert.equal(befehl(welt, leute, kaserne)?.fehler, undefined);
  assert.equal(leute[0].auftrag.art, 'reparieren');
  bisErArbeitet(welt, leute[0]);
  sekunden(welt, 30);
  assert.equal(kaserne.leben, 1200);
  assert.equal(bert.holz, bertHolz, 'Bert zahlt nichts');
  assert.ok(2000 - anna.holz >= 21 && 2000 - anna.holz <= 22, `Anna zahlt ${2000 - anna.holz} Holz`);

  const fremd = beschaedigteKaserne(300, 1, 'c');
  befehl(fremd.welt, fremd.leute, fremd.kaserne);
  assert.equal(fremd.leute[0].auftrag.art, 'angreifen');
});

test('bauen AC-45: was ganz ist, eine Baustelle, eine Farm und ein Lager fuer den, der traegt, bleiben, was sie waren', () => {
  const { welt, x0, y0, kaserne, leute } = beschaedigteKaserne(0);
  befehl(welt, leute, kaserne);
  assert.equal(leute[0].auftrag.art, 'gehen', 'ein ganzes Gebaeude: ein Gang');

  const baustelle = welt.gebaeudeAnlegen('a', 'haus', x0 + 8, y0 + 1, false);
  befehl(welt, leute, baustelle);
  assert.equal(leute[0].auftrag.art, 'bauen', 'eine Baustelle wird gebaut');

  const farm = welt.gebaeudeAnlegen('a', 'farm', x0, y0 + 8);
  farm.leben -= 100;
  befehl(welt, leute, farm);
  assert.equal(leute[0].auftrag.art, 'farm', 'eine Farm wird bestellt, nicht repariert');
  sekunden(welt, 15);
  assert.equal(farm.leben, GEBAEUDE.farm.leben - 100);

  // Wer Holz traegt, laedt am beschaedigten Holzfaellerlager zuerst ab
  // (einheiten AC-56); ohne Ladung repariert er es.
  const lager = welt.gebaeudeAnlegen('a', 'holzfaellerlager', x0 + 8, y0 + 8);
  lager.leben -= 100;
  const traeger = welt.einheitAnlegen('a', x0 + 7, y0 + 7, 'dorfbewohner');
  traeger.ladung = 5;
  traeger.ladungsart = 'holz';
  befehl(welt, [traeger], lager);
  assert.equal(traeger.auftrag.art, 'abgeben');
  const leer = welt.einheitAnlegen('a', x0 + 7, y0 + 8, 'dorfbewohner');
  befehl(welt, [leer], lager);
  assert.equal(leer.auftrag.art, 'reparieren');

  // Wer nicht bauen kann, geht nur hin - auch in derselben Auswahl.
  const schaden = beschaedigteKaserne(200);
  const soldat = schaden.welt.einheitAnlegen('a', schaden.x0 + 2, schaden.y0 + 2, 'miliz');
  befehl(schaden.welt, [soldat, ...schaden.leute], schaden.kaserne);
  assert.equal(soldat.auftrag.art, 'gehen');
  assert.equal(schaden.leute[0].auftrag.art, 'reparieren');
});

test('bauen AC-45: faellt das Gebaeude, endet der Auftrag - und ein neuer Befehl beendet die Arbeit sofort', () => {
  const { welt, x0, y0, kaserne, leute } = beschaedigteKaserne(600, 2);
  befehl(welt, leute, kaserne);
  bisErArbeitet(welt, leute[0]);
  bisErArbeitet(welt, leute[1]);

  // Der zweite wird weggeschickt: er arbeitet nicht mehr, und der erste
  // schafft weiter seine volle Rate.
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [leute[1].id], ziel: { x: x0 + 9, y: y0 + 9 } });
  assert.equal(leute[1].baut, false);
  assert.equal(leute[1].auftrag.art, 'gehen');
  const leben = kaserne.leben;
  sekunden(welt, 10);
  assert.ok(Math.abs(kaserne.leben - leben - 125) <= 1, `der erste allein: ${kaserne.leben - leben} in zehn Sekunden`);

  welt.gebaeudeZerstoeren(kaserne);
  sekunden(welt, 1);
  assert.equal(leute[0].auftrag, null);
  assert.equal(leute[0].baut, false);
});

test('bauen AC-45: wer repariert, arbeitet sichtbar und haemmert - der Zustand traegt `w` und `rp`, das Gebaeude sein neues Leben', () => {
  const { welt, kaserne, leute } = beschaedigteKaserne(600);
  befehl(welt, leute, kaserne);
  const unterwegs = welt.zustand().einheiten.find((e) => e.i === leute[0].id);
  bisErArbeitet(welt, leute[0]);
  welt.zustand();
  const leben = kaserne.leben;
  sekunden(welt, 1);
  const zustand = welt.zustand();
  const dabei = zustand.einheiten.find((e) => e.i === leute[0].id);
  assert.deepEqual([dabei.w, dabei.rp], [1, 1]);
  assert.ok(!unterwegs.rp || leute[0].baut, 'unterwegs haemmert er nicht');
  const draht = (zustand.gebaeude || []).find((g) => g.i === kaserne.id);
  assert.ok(draht && draht.h > leben, 'das neue Leben geht an den Browser');
  sekunden(welt, 60);
  const danach = welt.zustand().einheiten.find((e) => e.i === leute[0].id);
  assert.deepEqual([danach.w, danach.rp], [undefined, undefined]);
});
