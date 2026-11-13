// Die Truppenstufen des Fuerstentums (einheiten AC-34, AC-58 bis AC-62), der
// Wehrturm (bauen AC-38) und die Ruestungen der Schmiede (bauen AC-39) -
// Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md). Die
// Oberflaeche dazu: e2e/tests/strategie-truppenstufen.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, EINHEITEN, VERBESSERUNGEN } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const sekunden = (welt, s) => { for (let t = 0; t < s * TAKTE_PRO_SEKUNDE; t++) welt.takten(); };

/** Eine Welt, in der Anna genug hat und ein fertiges Gebaeude dieser Art. */
function mitGebaeude(art, zeitalter = 2) {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  anna.zeitalter = zeitalter;
  Object.assign(anna, { nahrung: 3000, holz: 3000, gold: 3000, stein: 1000 });
  const gebaeude = welt.gebaeudeAnlegen('a', art, ...platz(welt, anna, art));
  // Wohnraum, damit keine Ausbildung auf ein Haus wartet.
  welt.gebaeudeAnlegen('a', 'haus', ...platz(welt, anna, 'haus', 13));
  return { welt, anna, gebaeude };
}
function platz(welt, spieler, art, ab = 6) {
  for (let r = ab; r < 30; r++) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r], [r, r], [-r, r]]) {
      if (welt.platzPruefen(art, spieler.basis.x + dx, spieler.basis.y + dy)) return [spieler.basis.x + dx, spieler.basis.y + dy];
    }
  }
  throw new Error(`kein Platz fuer ${art}`);
}
const bestellen = (welt, gebaeude, art) => welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: gebaeude.id, einheit: art });
const zaehlen = (welt, art) => [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === art && !e.tot).length;
const neben = (welt, anna, i, art) => welt.einheitAnlegen('a', anna.basis.x + 2 + i, anna.basis.y + 3, art);

// ---- Die zwei Schuetzenlinien ------------------------------------------------

test('einheiten AC-34: der Armbrustschuetze ist eine eigene Einheit der Schiessanlage ab dem Fuerstentum - neben dem Bogen, nicht statt seiner', () => {
  const a = EINHEITEN.armbrustschuetze;
  assert.deepEqual([a.leben, a.angriff, a.reichweite, a.nachladen], [35, 9, 5, 3.5], 'schwerer Bolzen, langsam');
  assert.deepEqual(a.kosten, { holz: 35, gold: 55 });
  assert.equal(a.stufeVon, undefined, 'keine Stufe des Bogenschuetzen mehr');
  assert.equal(VERBESSERUNGEN.armbrust, undefined, 'die Verbesserung, die jeden Bogenschuetzen austauschte, gibt es nicht mehr');
  assert.ok(GEBAEUDE.schiessanlage.bildetAus.includes('armbrustschuetze'));
  // Im Lehen abgewiesen.
  const lehen = mitGebaeude('schiessanlage', 1);
  assert.match(bestellen(lehen.welt, lehen.gebaeude, 'armbrustschuetze').fehler, /ab dem Fürstentum/);
  // Im Fuerstentum ausgebildet - und der Bogenschuetze daneben bleibt, was er ist.
  const { welt, anna, gebaeude } = mitGebaeude('schiessanlage', 2);
  const bogen = neben(welt, anna, 0, 'bogenschuetze');
  assert.deepEqual(bestellen(welt, gebaeude, 'armbrustschuetze'), {});
  assert.equal(anna.holz, 3000 - 35);
  assert.equal(anna.gold, 3000 - 55);
  sekunden(welt, a.zeit);
  assert.equal(zaehlen(welt, 'armbrustschuetze'), 1, 'ein Armbrustschuetze');
  assert.equal(welt.einheiten.get(bogen.id).art, 'bogenschuetze', 'der Bogenschuetze bleibt');
  // Wofuer es zwei Linien gibt: gegen Geruestete schlaegt der Bolzen haerter,
  // als er langsamer ist. Ritter mit 2 Fernruestung: 7 in 3,5 s gegen 3 in 2 s.
  const armbrust = [...welt.einheiten.values()].find((e) => e.art === 'armbrustschuetze');
  const zweiter = neben(welt, anna, 1, 'bogenschuetze2');
  const ritter = welt.einheitAnlegen('b', anna.basis.x + 4, anna.basis.y + 5, 'ritter');
  const jeSekunde = (wer) => welt.schaden(wer, ritter, false) / EINHEITEN[wer.art].nachladen;
  assert.equal(welt.schaden(armbrust, ritter, false), 7);
  assert.equal(welt.schaden(zweiter, ritter, false), 3);
  assert.ok(jeSekunde(armbrust) > jeSekunde(zweiter), 'gegen den Ritter schlaegt die Armbrust mehr je Sekunde');
  // Gegen Ungeruestete liegt der Bogen nicht zurueck - und ist billiger.
  const miliz = welt.einheitAnlegen('b', anna.basis.x + 5, anna.basis.y + 5, 'dorfbewohner');
  const jeSekundeWeich = (wer) => welt.schaden(wer, miliz, false) / EINHEITEN[wer.art].nachladen;
  assert.ok(Math.abs(jeSekundeWeich(armbrust) - jeSekundeWeich(zweiter)) < 0.2, 'gegen Ungeruestete gleich');
  assert.ok(EINHEITEN.bogenschuetze2.kosten.gold < a.kosten.gold);
});

test('einheiten AC-58: die Bogenstufe macht jeden Kurzbogenschuetzen zum Bogenschuetzen, und die Schiessanlage bildet danach nur noch ihn aus', () => {
  const b = EINHEITEN.bogenschuetze2;
  assert.deepEqual([b.leben, b.angriff, b.reichweite, b.nachladen], [35, 5, 5, 2]);
  assert.deepEqual(b.kosten, EINHEITEN.bogenschuetze.kosten, 'kostet dasselbe wie der Kurzbogenschuetze');
  assert.equal(b.stufeVon, 'bogenschuetze');
  assert.deepEqual(VERBESSERUNGEN.bogenstufe.kosten, { nahrung: 125, gold: 75 });
  assert.deepEqual(VERBESSERUNGEN.bogenstufe.wandelt, { bogenschuetze: 'bogenschuetze2' });
  const lehen = mitGebaeude('schiessanlage', 1);
  assert.match(bestellen(lehen.welt, lehen.gebaeude, 'bogenstufe').fehler, /ab dem Fürstentum/);
  const { welt, anna, gebaeude } = mitGebaeude('schiessanlage', 2);
  const boegen = [0, 1].map((i) => neben(welt, anna, i, 'bogenschuetze'));
  const armbrust = neben(welt, anna, 2, 'armbrustschuetze');
  boegen[0].leben -= 10;
  assert.deepEqual(bestellen(welt, gebaeude, 'bogenstufe'), {});
  sekunden(welt, VERBESSERUNGEN.bogenstufe.zeit);
  assert.equal(zaehlen(welt, 'bogenschuetze'), 0, 'kein Kurzbogenschuetze mehr');
  assert.deepEqual(boegen.map((e) => welt.einheiten.get(e.id).art), ['bogenschuetze2', 'bogenschuetze2'], 'dieselben Einheiten');
  assert.equal(boegen[0].leben, b.leben - 10, 'der Schaden bleibt stehen');
  assert.equal(welt.einheiten.get(armbrust.id).art, 'armbrustschuetze', 'die Armbrust ist eine andere Linie');
  // Der Browser schickt weiter "bogenschuetze", der Server bildet die Stufe aus.
  assert.deepEqual(bestellen(welt, gebaeude, 'bogenschuetze'), {});
  assert.deepEqual(gebaeude.schlange, ['bogenschuetze2']);
});

// ---- Die Stufen der Kaserne, der Schiessanlage und des Stalls ----------------

test('einheiten AC-59: nach Soldat kommt Langschwertkaempfer - erst nach der Soldatenstufe, und die Kaserne bildet danach nur noch ihn aus', () => {
  const l = EINHEITEN.langschwertkaempfer;
  assert.deepEqual([l.leben, l.angriff, `${l.nahruestung}/${l.fernruestung}`], [60, 9, '1/1']);
  assert.deepEqual(l.kosten, EINHEITEN.miliz.kosten, 'kostet dasselbe wie die Miliz');
  assert.deepEqual(VERBESSERUNGEN.langschwertstufe.kosten, { nahrung: 150, gold: 65 });
  assert.equal(VERBESSERUNGEN.langschwertstufe.vorstufe, 'soldatenstufe');
  const { welt, anna, gebaeude } = mitGebaeude('kaserne', 2);
  const miliz = neben(welt, anna, 0, 'miliz');
  // Ohne die Soldatenstufe: Absage mit ihrem Namen.
  assert.match(bestellen(welt, gebaeude, 'langschwertstufe').fehler, /Soldat/);
  // Wer die dritte Stufe bestellt, bevor er sie hat, bekommt eine Absage.
  assert.match(bestellen(welt, gebaeude, 'langschwertkaempfer').fehler, /Langschwertkämpfer/);
  assert.deepEqual(bestellen(welt, gebaeude, 'soldatenstufe'), {});
  sekunden(welt, VERBESSERUNGEN.soldatenstufe.zeit);
  assert.equal(welt.einheiten.get(miliz.id).art, 'soldat');
  miliz.leben -= 20;
  assert.deepEqual(bestellen(welt, gebaeude, 'langschwertstufe'), {});
  // Eine Miliz in der Schlange dahinter wird als Langschwertkaempfer fertig.
  assert.deepEqual(bestellen(welt, gebaeude, 'miliz'), {});
  assert.deepEqual(gebaeude.schlange, ['langschwertstufe', 'soldat']);
  sekunden(welt, VERBESSERUNGEN.langschwertstufe.zeit);
  assert.equal(welt.einheiten.get(miliz.id).art, 'langschwertkaempfer', 'dieselbe Einheit, zwei Stufen weiter');
  assert.equal(miliz.leben, l.leben - 20, 'der Schaden bleibt stehen');
  assert.deepEqual(gebaeude.schlange, ['langschwertkaempfer']);
  // Jede fruehere Stufe, die der Browser nennt, ist jetzt diese.
  for (const art of ['miliz', 'soldat', 'langschwertkaempfer']) {
    assert.deepEqual(bestellen(welt, gebaeude, art), {}, art);
    assert.equal(gebaeude.schlange.at(-1), 'langschwertkaempfer', art);
  }
});

test('einheiten AC-60: der Pikenier schlaegt Reiter haerter als der Speerkaempfer', () => {
  const p = EINHEITEN.pikenier;
  assert.deepEqual([p.leben, p.angriff, p.bonus.kavallerie, p.nachladen], [55, 4, 22, 3]);
  assert.deepEqual(p.kosten, EINHEITEN.speerkaempfer.kosten);
  assert.deepEqual(p.klassen, EINHEITEN.speerkaempfer.klassen, 'Infanterie und Speer - der Bogen behaelt seinen Bonus');
  assert.deepEqual(VERBESSERUNGEN.pikenierstufe.kosten, { nahrung: 160, gold: 90 });
  const lehen = mitGebaeude('kaserne', 1);
  assert.match(bestellen(lehen.welt, lehen.gebaeude, 'pikenierstufe').fehler, /ab dem Fürstentum/);
  const { welt, anna, gebaeude } = mitGebaeude('kaserne', 2);
  const speer = neben(welt, anna, 0, 'speerkaempfer');
  // Der Ritter steht daheim bei Bert: gerechnet wird der Schlag, gekaempft nicht.
  const bert = welt.spielerVon('b');
  const ritter = welt.einheitAnlegen('b', bert.basis.x + 2, bert.basis.y + 3, 'ritter');
  assert.equal(welt.schaden(speer, ritter, false), 3 - 2 + 15);
  assert.deepEqual(bestellen(welt, gebaeude, 'pikenierstufe'), {});
  sekunden(welt, VERBESSERUNGEN.pikenierstufe.zeit);
  assert.equal(welt.einheiten.get(speer.id).art, 'pikenier');
  assert.equal(welt.schaden(speer, ritter, false), 4 - 2 + 22);
  assert.deepEqual(bestellen(welt, gebaeude, 'speerkaempfer'), {});
  assert.deepEqual(gebaeude.schlange, ['pikenier']);
});

test('einheiten AC-61: der Eliteplaenkler schiesst weiter, haelt mehr Pfeile aus und trifft Schuetzen haerter', () => {
  const e = EINHEITEN.eliteplaenkler;
  assert.deepEqual([e.leben, e.angriff, e.fernruestung, e.reichweite, e.bonus.bogenschuetze], [35, 3, 4, 5, 4]);
  assert.deepEqual(e.kosten, EINHEITEN.plaenkler.kosten);
  assert.deepEqual(VERBESSERUNGEN.eliteplaenklerstufe.kosten, { holz: 230, gold: 130 });
  const { welt, anna, gebaeude } = mitGebaeude('schiessanlage', 2);
  const plaenkler = neben(welt, anna, 0, 'plaenkler');
  const bert = welt.spielerVon('b');
  const bogen = welt.einheitAnlegen('b', bert.basis.x + 2, bert.basis.y + 3, 'bogenschuetze2');
  assert.equal(welt.schaden(plaenkler, bogen, false), 2 + 3);
  assert.equal(welt.schaden(bogen, plaenkler, false), 5 - 3);
  assert.deepEqual(bestellen(welt, gebaeude, 'eliteplaenklerstufe'), {});
  sekunden(welt, VERBESSERUNGEN.eliteplaenklerstufe.zeit);
  assert.equal(welt.einheiten.get(plaenkler.id).art, 'eliteplaenkler');
  assert.equal(welt.schaden(plaenkler, bogen, false), 3 + 4);
  assert.equal(welt.schaden(bogen, plaenkler, false), 5 - 4);
});

test('einheiten AC-62: aus dem Spaeherreiter wird leichte Kavallerie - staerker und nicht langsamer', () => {
  const k = EINHEITEN.leichtekavallerie;
  assert.deepEqual([k.leben, k.angriff, `${k.nahruestung}/${k.fernruestung}`], [60, 7, '0/2']);
  assert.deepEqual(k.kosten, EINHEITEN.spaeherreiter.kosten);
  assert.deepEqual(VERBESSERUNGEN.kavalleriestufe.kosten, { nahrung: 150, gold: 50 });
  assert.ok(GEBAEUDE.stall.bildetAus.includes('kavalleriestufe'));
  const { welt, anna, gebaeude } = mitGebaeude('stall', 2);
  const reiter = [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'spaeherreiter');
  const tempoVorher = welt.einheitenwert('a', 'spaeherreiter', 'tempo');
  assert.deepEqual(bestellen(welt, gebaeude, 'kavalleriestufe'), {});
  sekunden(welt, VERBESSERUNGEN.kavalleriestufe.zeit);
  assert.equal(welt.einheiten.get(reiter.id).art, 'leichtekavallerie', 'auch der Reiter vom Beginn');
  assert.equal(reiter.leben, k.leben, 'das Leben waechst mit');
  assert.ok(welt.einheitenwert('a', 'leichtekavallerie', 'tempo') >= tempoVorher, 'nicht langsamer als der Spaeherreiter des Lehens');
  assert.deepEqual(bestellen(welt, gebaeude, 'spaeherreiter'), {});
  assert.deepEqual(gebaeude.schlange, ['leichtekavallerie']);
});

test('einheiten AC-59: jede Stufe erbt, was ihre Klasse erforscht hat - die Schmiede gilt allen Stufen', () => {
  const { welt, anna } = mitGebaeude('schmiede', 2);
  anna.verbesserungen.push('schmiedeangriff', 'befiedertePfeile');
  for (const art of ['langschwertkaempfer', 'pikenier', 'leichtekavallerie']) {
    assert.equal(welt.einheitenwert('a', art, 'angriff'), EINHEITEN[art].angriff + 1, art);
  }
  for (const art of ['bogenschuetze2', 'armbrustschuetze', 'eliteplaenkler']) {
    assert.equal(welt.einheitenwert('a', art, 'angriff'), EINHEITEN[art].angriff + 1, art);
    assert.equal(welt.einheitenwert('a', art, 'reichweite'), EINHEITEN[art].reichweite + 1, art);
  }
});

// ---- Wehrturm ---------------------------------------------------------------

test('bauen AC-38: der Wehrturm - die Universitaet staerkt jeden Wachturm, auch den, der schon steht', () => {
  const w = VERBESSERUNGEN.wehrturm;
  assert.deepEqual(w.kosten, { nahrung: 100, holz: 250 });
  assert.equal(w.zeit, 30);
  assert.deepEqual(w.bauwerk, { wachturm: { leben: 480, angriff: 2, nahruestung: 1, fernruestung: 1 } });
  assert.ok(GEBAEUDE.universitaet.bildetAus.includes('wehrturm'));
  const { welt, anna, gebaeude: uni } = mitGebaeude('universitaet', 2);
  const turm = welt.gebaeudeAnlegen('a', 'wachturm', ...platz(welt, anna, 'wachturm', 9));
  const haus = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === 'haus');
  const bert = welt.spielerVon('b');
  const fremder = welt.gebaeudeAnlegen('b', 'wachturm', ...platz(welt, bert, 'wachturm', 9));
  turm.leben -= 300; // beschaedigt: der Schaden bleibt stehen
  const wert = (feld, wer = 'a') => welt.gebaeudewert(wer, 'wachturm', feld);
  const vorher = { leben: wert('leben'), angriff: wert('angriff'), nah: wert('nahruestung'), fern: wert('fernruestung'), weit: wert('reichweite') };
  assert.equal(welt.kampfwerte('a').wachturm.name, undefined, 'vorher heisst er, wie er heisst');
  assert.deepEqual(bestellen(welt, uni, 'wehrturm'), {});
  sekunden(welt, w.zeit);
  assert.ok(anna.verbesserungen.includes('wehrturm'));
  assert.equal(wert('leben'), vorher.leben + 480);
  assert.equal(wert('angriff'), vorher.angriff + 2);
  assert.equal(wert('nahruestung'), vorher.nah + 1);
  assert.equal(wert('fernruestung'), vorher.fern + 1);
  assert.equal(wert('reichweite'), vorher.weit, 'die Reichweite bleibt');
  assert.equal(turm.leben, vorher.leben + 480 - 300, 'dem stehenden Turm waechst das Leben nach');
  assert.equal(haus.leben, GEBAEUDE.haus.leben, 'das Haus daneben nicht');
  assert.equal(welt.gebaeudewert('a', 'burg', 'angriff'), GEBAEUDE.burg.angriff, 'die Burg auch nicht');
  // Berts Turm bleibt ein Wachturm.
  assert.equal(wert('leben', 'b'), GEBAEUDE.wachturm.leben);
  assert.equal(fremder.leben, GEBAEUDE.wachturm.leben);
  // Wie er heisst, sagt der Server je Spieler - auch dem Gegner, der ihn ansieht.
  assert.equal(welt.kampfwerte('a').wachturm.name, 'Wehrturm');
  assert.equal(welt.kampfwerte('b').wachturm.name, undefined);
  // Er trifft haerter: 7 statt 5 gegen 1 Fernruestung der Miliz.
  const miliz = welt.einheitAnlegen('b', turm.x + 3, turm.y, 'miliz');
  assert.equal(welt.schaden(turm, miliz, false), 7 - 1);
  assert.equal(welt.schaden(fremder, miliz, false), 5 - 1);
  // Und haelt mehr aus: die Miliz schlaegt mit 4 gegen 2 Nahruestung.
  assert.equal(welt.schaden(miliz, turm, true), 4 - 2);
});

test('bauen AC-38: das Mauerwerk rechnet auf den Wehrturm, nicht nur auf den Wachturm darunter', () => {
  const { welt, anna } = mitGebaeude('universitaet', 2);
  const turm = welt.gebaeudeAnlegen('a', 'wachturm', ...platz(welt, anna, 'wachturm', 9));
  welt.erforschen(anna, 'mauerwerk');
  assert.equal(turm.leben, Math.round(1020 * 1.1));
  welt.erforschen(anna, 'wehrturm');
  assert.equal(welt.gebaeudewert('a', 'wachturm', 'leben'), Math.round(1500 * 1.1));
  assert.equal(turm.leben, Math.round(1500 * 1.1), 'voll vorher, voll danach');
});

// ---- Ruestungen der Schmiede -------------------------------------------------

const RUESTUNGEN = [
  ['schuppenpanzer', 'kettenpanzer', 'infanterie', ['miliz', 'speerkaempfer', 'langschwertkaempfer', 'pikenier']],
  ['schuppenharnisch', 'kettenharnisch', 'kavallerie', ['spaeherreiter', 'ritter', 'leichtekavallerie']],
  ['polsterruestung', 'lederruestung', 'bogenschuetze', ['bogenschuetze', 'bogenschuetze2', 'armbrustschuetze', 'plaenkler']],
];

test('bauen AC-39: die Schmiede erforscht je Waffengattung zwei Ruestungen - die zweite erst im Fuerstentum und nach der ersten', () => {
  assert.deepEqual(VERBESSERUNGEN.schuppenpanzer.kosten, { nahrung: 100 });
  assert.deepEqual(VERBESSERUNGEN.kettenpanzer.kosten, { nahrung: 200, gold: 100 });
  assert.deepEqual(VERBESSERUNGEN.schuppenharnisch.kosten, { nahrung: 150 });
  assert.deepEqual(VERBESSERUNGEN.kettenharnisch.kosten, { nahrung: 250, gold: 150 });
  assert.deepEqual(VERBESSERUNGEN.polsterruestung.kosten, { nahrung: 100 });
  assert.deepEqual(VERBESSERUNGEN.lederruestung.kosten, { nahrung: 150, gold: 150 });
  for (const [erste, zweite, klasse] of RUESTUNGEN) {
    assert.ok(GEBAEUDE.schmiede.bildetAus.includes(erste) && GEBAEUDE.schmiede.bildetAus.includes(zweite), `${erste}, ${zweite} in der Schmiede`);
    assert.equal(VERBESSERUNGEN[erste].zeitalter, 1, `${erste}: Lehen`);
    assert.equal(VERBESSERUNGEN[zweite].zeitalter, 2, `${zweite}: Fuerstentum`);
    assert.equal(VERBESSERUNGEN[zweite].vorstufe, erste);
    for (const art of [erste, zweite]) assert.deepEqual(VERBESSERUNGEN[art].wirkung, { [klasse]: { nahruestung: 1, fernruestung: 1 } }, art);
  }
  // Im Lehen: die erste geht, die zweite nicht.
  const lehen = mitGebaeude('schmiede', 1);
  assert.deepEqual(bestellen(lehen.welt, lehen.gebaeude, 'schuppenpanzer'), {});
  assert.match(bestellen(lehen.welt, lehen.gebaeude, 'kettenpanzer').fehler, /ab dem Fürstentum/);
  // Im Fuerstentum: die zweite erst, wenn die erste erforscht ist.
  const { welt, gebaeude } = mitGebaeude('schmiede', 2);
  assert.match(bestellen(welt, gebaeude, 'kettenharnisch').fehler, /Schuppenrossharnisch/);
  assert.deepEqual(bestellen(welt, gebaeude, 'schuppenharnisch'), {});
  sekunden(welt, VERBESSERUNGEN.schuppenharnisch.zeit);
  assert.deepEqual(bestellen(welt, gebaeude, 'kettenharnisch'), {});
});

test('bauen AC-39: jede Ruestung gibt ihrer Gattung +1 / +1 - jeder Stufe, und niemandem sonst', () => {
  const { welt, anna } = mitGebaeude('schmiede', 2);
  const ruestung = (art) => [welt.einheitenwert('a', art, 'nahruestung'), welt.einheitenwert('a', art, 'fernruestung')];
  const alle = Object.keys(EINHEITEN);
  let erwartet = Object.fromEntries(alle.map((art) => [art, ruestung(art)]));
  for (const [erste, zweite, , arten] of RUESTUNGEN) {
    for (const verbesserung of [erste, zweite]) {
      welt.erforschen(anna, verbesserung);
      erwartet = Object.fromEntries(alle.map((art) => {
        const [nah, fern] = erwartet[art];
        return [art, EINHEITEN[art].klassen.includes(Object.keys(VERBESSERUNGEN[verbesserung].wirkung)[0]) ? [nah + 1, fern + 1] : [nah, fern]];
      }));
      for (const art of alle) assert.deepEqual(ruestung(art), erwartet[art], `${art} nach ${verbesserung}`);
    }
    for (const art of arten) {
      assert.deepEqual(ruestung(art), [EINHEITEN[art].nahruestung + 2, EINHEITEN[art].fernruestung + 2], `${art} nach beiden Stufen`);
    }
  }
  assert.deepEqual(ruestung('dorfbewohner'), [0, 0], 'der Dorfbewohner bleibt aussen vor');
  assert.deepEqual(ruestung('ramme'), [EINHEITEN.ramme.nahruestung, EINHEITEN.ramme.fernruestung], 'die Belagerung auch');
  // Im Kampf: ein Soldat schlaegt den geruesteten Speerkaempfer um zwei schwaecher.
  const speer = welt.einheitAnlegen('a', anna.basis.x + 2, anna.basis.y + 3, 'speerkaempfer');
  const soldat = welt.einheitAnlegen('b', anna.basis.x + 3, anna.basis.y + 3, 'soldat');
  assert.equal(welt.schaden(soldat, speer, false), EINHEITEN.soldat.angriff - 2);
});
