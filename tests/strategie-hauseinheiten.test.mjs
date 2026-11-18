// Die Einheiten der Haeuser (→ specs/10-strategie/einheiten-und-befehle.md
// AC-42 bis AC-49, ADR-0014): Eibenschuetze, Pavesenschuetze, Soeldner - und
// aus der Burg Kriegswolf, Reiterschuetze, Riese, Meuchler, Wiedergaenger.
// Dazu die Tarnung (→ specs/10-strategie/kampf.md AC-22).
// Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md); die
// Entscheidungen misst der Gefechtsstand - zwei Heere gleicher Kosten.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, EINHEITEN, HAEUSER, VERBESSERUNGEN, KLASSEN } = require('../server/spiele/strategie/daten.js');
const { gefechtSpielen, kostenSumme } = require('../server/spiele/strategie/pruefstand.js');
const { Ki } = require('../server/spiele/strategie/ki.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const sekunden = (welt, s) => { for (let t = 0; t < s * TAKTE_PRO_SEKUNDE; t++) welt.takten(); };

/** Eine Welt im Fuerstentum: Anna mit `haus` (oder keinem), reich, mit einem fertigen Gebaeude dieser Art. */
function mitGebaeude(art, haus, zeitalter = 2) {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt', ...(haus ? { haeuser: { a: haus } } : {}) });
  const anna = welt.spielerVon('a');
  anna.zeitalter = zeitalter;
  Object.assign(anna, { nahrung: 3000, holz: 3000, gold: 3000, stein: 1000 });
  const gebaeude = welt.gebaeudeAnlegen('a', art, ...platz(welt, anna, art));
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

/**
 * Zwei Heere gleicher Kosten, zwanzig Startwerte, **beide Seiten**: der
 * Gefechtsstand ist nicht seitengleich - von zwei gleichen Heeren gewinnt das
 * rechte vier von fuenf. Wer nahe 50 % messen will, laesst deshalb jede Art
 * einmal links und einmal rechts antreten. Zurueck: Siege von `eins` aus 40.
 */
function beideSeiten(eins, zwei, budget = 1200) {
  let siege = 0;
  for (let startwert = 1; startwert <= 20; startwert++) {
    if (gefechtSpielen({ links: eins, rechts: zwei, startwert, budget, minuten: 10 }).sieger === 'links') siege += 1;
    if (gefechtSpielen({ links: zwei, rechts: eins, startwert, budget, minuten: 10 }).sieger === 'rechts') siege += 1;
  }
  return siege;
}
/** Siege von `links` aus zwanzig Startwerten. */
function siegeVon(links, rechts, budget = 1200) {
  let siege = 0;
  for (let startwert = 1; startwert <= 20; startwert++) {
    if (gefechtSpielen({ links, rechts, startwert, budget, minuten: 10 }).sieger === 'links') siege += 1;
  }
  return siege;
}

// ---- Wer sie ausbildet ---------------------------------------------------------

test('einheiten AC-42: den Eibenschuetzen bildet nur Haus Eschenbruch aus, in der Schiessanlage ab dem Fuerstentum', () => {
  const e = EINHEITEN.eibenschuetze;
  assert.deepEqual(e.kosten, { holz: 35, gold: 40 });
  assert.deepEqual([e.leben, e.angriff, e.reichweite, e.nahruestung, e.fernruestung, e.tempo, e.nachladen], [35, 6, 6, 0, 0, 0.96, 2]);
  assert.deepEqual(e.haeuser, ['eschenbruch']);
  assert.ok(GEBAEUDE.schiessanlage.bildetAus.includes('eibenschuetze'));
  // Ein Feld weiter als jeder andere Schuetze der Schiessanlage.
  for (const art of GEBAEUDE.schiessanlage.bildetAus) {
    if (EINHEITEN[art] && art !== 'eibenschuetze') assert.ok(EINHEITEN[art].reichweite < e.reichweite, art);
  }

  // Ein anderes Haus und kein Haus: abgesagt, mit einem Satz, der das Haus nennt.
  for (const haus of ['wehrstein', null]) {
    const { welt, anna, gebaeude } = mitGebaeude('schiessanlage', haus);
    const gold = anna.gold;
    assert.match(bestellen(welt, gebaeude, 'eibenschuetze').fehler, /Den Eibenschützen bildet nur Haus Eschenbruch aus/);
    assert.equal(anna.gold, gold, 'nichts bezahlt');
    assert.deepEqual(gebaeude.schlange, []);
  }
  // Eschenbruch im Lehen: noch nicht.
  const lehen = mitGebaeude('schiessanlage', 'eschenbruch', 1);
  assert.match(bestellen(lehen.welt, lehen.gebaeude, 'eibenschuetze').fehler, /ab dem Fürstentum/);
  // Eschenbruch im Fuerstentum: bezahlt, ausgebildet.
  const { welt, anna, gebaeude } = mitGebaeude('schiessanlage', 'eschenbruch');
  assert.deepEqual(bestellen(welt, gebaeude, 'eibenschuetze'), {});
  assert.equal(anna.holz, 3000 - 35);
  assert.equal(anna.gold, 3000 - 40);
  sekunden(welt, e.zeit + 2);
  assert.equal(zaehlen(welt, 'eibenschuetze'), 1);
});

test('einheiten AC-42: der Eibenschuetze schlaegt die Armbrust bei gleichen Kosten und faellt gegen Ritter', () => {
  assert.equal(siegeVon('eibenschuetze', 'armbrustschuetze'), 20);
  assert.equal(siegeVon('armbrustschuetze', 'eibenschuetze'), 0);
  assert.equal(siegeVon('eibenschuetze', 'ritter'), 0);
  assert.equal(siegeVon('ritter', 'eibenschuetze'), 20);
});

test('einheiten AC-42: voll erforscht reicht der Eibenschuetze im Fuerstentum ein Feld weiter als die Burg', () => {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt', haeuser: { a: 'eschenbruch' } });
  const anna = welt.spielerVon('a');
  // Alles, was es bis zum Fuerstentum gibt - und das Zeitalter selbst, an dem
  // der Bonus des Hauses haengt (`boniAb`).
  for (let stufe = 1; stufe <= 2; stufe++) {
    anna.zeitalter = stufe;
    welt.zeitalterWirkungen?.(anna);
  }
  for (const [art, v] of Object.entries(VERBESSERUNGEN)) if ((v.zeitalter || 0) <= 2) anna.verbesserungen.push(art);
  const weit = welt.einheitenwert('a', 'eibenschuetze', 'reichweite');
  const burg = welt.gebaeudewert('a', 'burg', 'reichweite');
  assert.ok(weit <= burg + 1, `Eibenschuetze ${weit}, Burg ${burg}`);
  assert.ok(weit > EINHEITEN.eibenschuetze.reichweite, 'die Forschung und das Haus tragen');
});

test('einheiten AC-43: den Pavesenschuetzen bildet nur Haus Wehrstein aus - langsam, kurz, und Pfeile ritzen ihn', () => {
  const p = EINHEITEN.pavesenschuetze;
  assert.deepEqual(p.kosten, { holz: 30, gold: 45 });
  assert.deepEqual([p.leben, p.angriff, p.reichweite, p.nahruestung, p.fernruestung, p.tempo], [45, 4, 4, 1, 4, 0.85]);
  assert.deepEqual(p.haeuser, ['wehrstein']);
  assert.ok(p.tempo < EINHEITEN.armbrustschuetze.tempo && p.reichweite < EINHEITEN.armbrustschuetze.reichweite);

  const fremd = mitGebaeude('schiessanlage', 'eschenbruch');
  assert.match(bestellen(fremd.welt, fremd.gebaeude, 'pavesenschuetze').fehler, /Den Pavesenschützen bildet nur Haus Wehrstein aus/);
  const { welt, gebaeude } = mitGebaeude('schiessanlage', 'wehrstein');
  assert.deepEqual(bestellen(welt, gebaeude, 'pavesenschuetze'), {});
  sekunden(welt, p.zeit + 2);
  assert.equal(zaehlen(welt, 'pavesenschuetze'), 1);

  // Ein Pfeil des Bogenschuetzen nimmt ihm ein Leben, ein Bolzen fuenf.
  const schild = [...welt.einheiten.values()].find((e) => e.art === 'pavesenschuetze');
  const bert = welt.spielerVon('b');
  const bogen = welt.einheitAnlegen('b', bert.basis.x + 2, bert.basis.y + 3, 'bogenschuetze2');
  const armbrust = welt.einheitAnlegen('b', bert.basis.x + 3, bert.basis.y + 3, 'armbrustschuetze');
  assert.equal(welt.schaden(bogen, schild), 1);
  assert.equal(welt.schaden(armbrust, schild), EINHEITEN.armbrustschuetze.angriff - 4);
});

test('einheiten AC-43: der Pavesenschuetze schlaegt die Armbrust bei gleichen Kosten und faellt gegen Ritter und Mangonel', () => {
  assert.equal(siegeVon('pavesenschuetze', 'armbrustschuetze'), 20);
  assert.equal(siegeVon('armbrustschuetze', 'pavesenschuetze'), 0);
  assert.equal(siegeVon('pavesenschuetze', 'ritter'), 0);
  assert.equal(siegeVon('pavesenschuetze', 'mangonel'), 0);
});

test('einheiten AC-44: der Soeldner kostet nur Gold, jedes Haus bildet ihn aus, Silberfurt fuer 64 statt 80', () => {
  const s = EINHEITEN.soeldner;
  assert.deepEqual(s.kosten, { gold: 80 });
  assert.equal(s.haeuser, undefined, 'jedes Haus');
  assert.equal(s.zeit, 18);
  assert.ok(s.zeit < EINHEITEN.langschwertkaempfer.zeit, 'schnell da');
  assert.ok(GEBAEUDE.kaserne.bildetAus.includes('soeldner'));
  // Der Nachlass steht in den Daten des Hauses, nicht im Code.
  assert.equal(HAEUSER.silberfurt.boni.preis.soeldner, 0.8);

  const lehen = mitGebaeude('kaserne', null, 1);
  assert.match(bestellen(lehen.welt, lehen.gebaeude, 'soeldner').fehler, /Den Söldner gibt es erst ab dem Fürstentum/);

  for (const [haus, preis] of [[null, 80], ['eschenbruch', 80], ['silberfurt', 64]]) {
    const { welt, anna, gebaeude } = mitGebaeude('kaserne', haus);
    assert.deepEqual(welt.auftragKosten('a', 'soeldner'), { gold: preis }, String(haus));
    // Der Preis reist mit den Werten je Spieler - nur, wo er abweicht.
    assert.deepEqual(welt.kampfwerte('a').soeldner.kosten, preis === 80 ? undefined : { gold: 64 }, String(haus));
    assert.equal(welt.kampfwerte('b').soeldner.kosten, undefined, 'Bert zahlt den vollen Preis');
    const vorher = { ...anna };
    assert.deepEqual(bestellen(welt, gebaeude, 'soeldner'), {});
    assert.equal(anna.gold, vorher.gold - preis, `bezahlt ${haus}`);
    assert.equal(anna.nahrung, vorher.nahrung, 'keine Nahrung');
    assert.equal(anna.holz, vorher.holz, 'kein Holz');
    // Abgesagt kommt zurueck, was bezahlt wurde - nicht mehr.
    assert.deepEqual(welt.abbrechen('a', gebaeude.id, 0), {});
    assert.equal(anna.gold, vorher.gold, `erstattet ${haus}`);
    // Und fertig ausgebildet zaehlt, was er gekostet hat.
    assert.deepEqual(bestellen(welt, gebaeude, 'soeldner'), {});
    const wert = anna.ausgebildetWert;
    sekunden(welt, s.zeit + 2);
    assert.equal(zaehlen(welt, 'soeldner'), 1);
    assert.equal(anna.ausgebildetWert - wert, preis, `gezaehlt ${haus}`);
  }

  // Zu wenig Gold fuer den vollen Preis, genug fuer den des Hauses.
  const knapp = mitGebaeude('kaserne', 'silberfurt');
  knapp.anna.gold = 70;
  assert.deepEqual(bestellen(knapp.welt, knapp.gebaeude, 'soeldner'), {});
  const ohne = mitGebaeude('kaserne', null);
  ohne.anna.gold = 70;
  assert.match(bestellen(ohne.welt, ohne.gebaeude, 'soeldner').fehler, /Zu wenig Gold/);
});

test('einheiten AC-44: das Haus sagt in Worten, dass es den Soeldner billiger bekommt', () => {
  const welt = new Welt(ZWEI, 7, { haeuser: { a: 'silberfurt' } });
  const haeuser = welt.aufbauFuer('a').werte.haeuser;
  assert.ok(haeuser.silberfurt.bringt.includes('Den Söldner gibt es 20 % billiger'), haeuser.silberfurt.bringt.join(' | '));
  assert.ok(!haeuser.eschenbruch.bringt.some((zeile) => /Söldner/.test(zeile)));
  // Und welche Haeuser eine Einheit ausbilden, steht in den Werten fuer das Menue.
  const einheiten = welt.aufbauFuer('a').werte.einheiten;
  assert.deepEqual(einheiten.eibenschuetze.haeuser, ['eschenbruch']);
  assert.equal(einheiten.soeldner.haeuser, null);
});

test('einheiten AC-44: gegen den Langschwertkaempfer gleicher Kosten gewinnt keiner von beiden mehr als 60 %', () => {
  assert.equal(kostenSumme('soeldner'), kostenSumme('langschwertkaempfer'));
  const siege = beideSeiten('soeldner', 'langschwertkaempfer');
  assert.ok(siege >= 16 && siege <= 24, `Soeldner gewinnt ${siege} von 40`);
});

// ---- Aus der Burg ---------------------------------------------------------------

/** Zwei Einheiten bei Bert, nur um einen Schlag zu rechnen. */
function paar(welt, wer, ziel) {
  const bert = welt.spielerVon('b');
  return [welt.einheitAnlegen('a', bert.basis.x + 2, bert.basis.y + 4, wer), welt.einheitAnlegen('b', bert.basis.x + 3, bert.basis.y + 4, ziel)];
}
/** Alles erforscht, was es bis zum Fuerstentum gibt. */
function allesErforscht(welt) {
  const anna = welt.spielerVon('a');
  for (const [art, v] of Object.entries(VERBESSERUNGEN)) if ((v.zeitalter || 0) <= 2) anna.verbesserungen.push(art);
  welt.werteGemerkt.clear();
}

test('einheiten AC-45: den Kriegswolf bildet nur Haus Eschenbruch aus, in der Burg - schnell wie ein Ritter, aber kein Reiter', () => {
  const w = EINHEITEN.kriegswolf;
  assert.deepEqual(w.kosten, { nahrung: 60, gold: 30 });
  assert.deepEqual([w.zeit, w.leben, w.angriff, w.nahruestung, w.fernruestung, w.tempo, w.nachladen], [20, 55, 7, 0, 1, 1.35, 1.5]);
  assert.deepEqual(w.klassen, ['tier']);
  assert.ok(KLASSEN.tier, 'die Klasse hat einen Namen fuer die Leiste');
  assert.equal(w.tempo, EINHEITEN.ritter.tempo);
  assert.deepEqual(w.haeuser, ['eschenbruch']);
  assert.ok(GEBAEUDE.burg.bildetAus.includes('kriegswolf'));

  const fremd = mitGebaeude('burg', 'rappenstein');
  assert.match(bestellen(fremd.welt, fremd.gebaeude, 'kriegswolf').fehler, /Den Kriegswolf bildet nur Haus Eschenbruch aus/);
  const { welt, anna, gebaeude } = mitGebaeude('burg', 'eschenbruch');
  assert.deepEqual(bestellen(welt, gebaeude, 'kriegswolf'), {});
  assert.equal(anna.nahrung, 3000 - 60);
  assert.equal(anna.gold, 3000 - 30);
  sekunden(welt, w.zeit + 2);
  assert.equal(zaehlen(welt, 'kriegswolf'), 1);

  // Der Speer hat gegen ihn keinen Bonus - gegen den Ritter schon.
  const [speer, wolf] = paar(welt, 'speerkaempfer', 'kriegswolf');
  assert.equal(welt.schaden(speer, wolf), EINHEITEN.speerkaempfer.angriff - w.nahruestung);
  const [speer2, ritter] = paar(welt, 'speerkaempfer', 'ritter');
  assert.equal(welt.schaden(speer2, ritter), EINHEITEN.speerkaempfer.angriff + EINHEITEN.speerkaempfer.bonus.kavallerie - EINHEITEN.ritter.nahruestung);
  // Und keine Verbesserung staerkt ihn: weder Schmiede noch Stall.
  allesErforscht(welt);
  for (const feld of ['angriff', 'nahruestung', 'fernruestung', 'tempo', 'leben']) assert.equal(welt.einheitenwert('a', 'kriegswolf', feld), w[feld], feld);
});

test('einheiten AC-45: Kriegswoelfe schlagen Speerkaempfer und Pikeniere gleicher Kosten, wo der Ritter verliert, und fallen gegen Langschwertkaempfer', () => {
  assert.equal(beideSeiten('kriegswolf', 'speerkaempfer'), 40);
  assert.equal(beideSeiten('kriegswolf', 'pikenier'), 40);
  assert.equal(beideSeiten('ritter', 'pikenier'), 0);
  assert.equal(beideSeiten('kriegswolf', 'langschwertkaempfer'), 0);
});

test('einheiten AC-46: den Reiterschuetzen bildet nur Haus Rappenstein aus - getroffen als Reiter und als Schuetze', () => {
  const r = EINHEITEN.reiterschuetze;
  assert.deepEqual(r.kosten, { holz: 40, gold: 70 });
  assert.deepEqual([r.zeit, r.leben, r.angriff, r.reichweite, r.nahruestung, r.fernruestung, r.tempo], [34, 60, 5, 5, 0, 2, 1.4]);
  assert.deepEqual(r.klassen, ['kavallerie', 'bogenschuetze']);
  assert.deepEqual(r.haeuser, ['rappenstein']);
  assert.ok(GEBAEUDE.burg.bildetAus.includes('reiterschuetze'));

  const fremd = mitGebaeude('burg', 'eschenbruch');
  assert.match(bestellen(fremd.welt, fremd.gebaeude, 'reiterschuetze').fehler, /Den Reiterschützen bildet nur Haus Rappenstein aus/);
  const { welt, gebaeude } = mitGebaeude('burg', 'rappenstein');
  assert.deepEqual(bestellen(welt, gebaeude, 'reiterschuetze'), {});
  sekunden(welt, r.zeit + 2);
  const neu = [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'reiterschuetze');
  // Er ist ein Reiter seines Hauses: dessen Leben traegt er.
  assert.equal(neu.leben, r.leben + HAEUSER.rappenstein.boni.wirkung.kavallerie.leben);

  // Beide Boni greifen: der des Speers gegen Reiter, der des Plaenklers gegen Schuetzen.
  const [speer, a] = paar(welt, 'speerkaempfer', 'reiterschuetze');
  assert.equal(welt.schaden(speer, a), EINHEITEN.speerkaempfer.angriff + EINHEITEN.speerkaempfer.bonus.kavallerie - r.nahruestung);
  const [plaenkler, b] = paar(welt, 'plaenkler', 'reiterschuetze');
  assert.equal(welt.schaden(plaenkler, b), Math.max(1, EINHEITEN.plaenkler.angriff + EINHEITEN.plaenkler.bonus.bogenschuetze - r.fernruestung));
  // Mit zwei Klassen bekommt er beide Linien der Schmiede und die Pferdezucht.
  const vorher = { angriff: welt.einheitenwert('a', 'reiterschuetze', 'angriff'), tempo: welt.einheitenwert('a', 'reiterschuetze', 'tempo') };
  welt.spielerVon('a').verbesserungen.push('schmiedeangriff', 'befiedertePfeile', 'pferdezucht');
  welt.werteGemerkt.clear();
  assert.equal(welt.einheitenwert('a', 'reiterschuetze', 'angriff'), vorher.angriff + 2);
  assert.ok(welt.einheitenwert('a', 'reiterschuetze', 'tempo') > vorher.tempo);
});

test('einheiten AC-46: der Reiterschuetze schlaegt Armbrustschuetzen gleicher Kosten und faellt gegen Plaenkler und Speerkaempfer', () => {
  const armbrust = beideSeiten('reiterschuetze', 'armbrustschuetze');
  assert.ok(armbrust >= 36, `gegen Armbrustschuetzen ${armbrust} von 40`);
  assert.equal(beideSeiten('reiterschuetze', 'plaenkler'), 0);
  assert.equal(beideSeiten('reiterschuetze', 'eliteplaenkler'), 0);
  assert.equal(beideSeiten('reiterschuetze', 'speerkaempfer'), 0);
});

test('einheiten AC-47: den Riesen bildet nur Haus Wehrstein aus - zwei Drittel einer Ramme gegen Gebaeude, und er schlaegt auch Einheiten', () => {
  const r = EINHEITEN.riese;
  assert.deepEqual(r.kosten, { nahrung: 120, gold: 100 });
  assert.deepEqual([r.zeit, r.leben, r.angriff, r.nahruestung, r.fernruestung, r.tempo, r.nachladen], [40, 180, 10, 2, 0, 0.6, 3]);
  assert.deepEqual(r.bonus, { gebaeude: 40 });
  assert.deepEqual(r.haeuser, ['wehrstein']);
  assert.ok(!r.nurGebaeude, 'er wehrt sich');
  assert.ok(GEBAEUDE.burg.bildetAus.includes('riese'));

  const fremd = mitGebaeude('burg', 'silberfurt');
  assert.match(bestellen(fremd.welt, fremd.gebaeude, 'riese').fehler, /Den Riesen bildet nur Haus Wehrstein aus/);
  const { welt, gebaeude } = mitGebaeude('burg', 'wehrstein');
  assert.deepEqual(bestellen(welt, gebaeude, 'riese'), {});
  sekunden(welt, r.zeit + 2);
  assert.equal(zaehlen(welt, 'riese'), 1);

  // Gegen ein Gebaeude 50 je Schlag alle drei Sekunden, die Ramme 127 alle fuenf.
  const riese = [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'riese');
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'b' && g.art === 'dorfzentrum');
  const jeSchlag = welt.schaden(riese, zentrum, true);
  assert.equal(jeSchlag, r.angriff + r.bonus.gebaeude - welt.gebaeudewert('b', 'dorfzentrum', 'nahruestung'));
  const ramme = welt.einheitAnlegen('a', riese.x + 1, riese.y, 'ramme');
  const anteil = (jeSchlag / r.nachladen) / (welt.schaden(ramme, zentrum, true) / EINHEITEN.ramme.nachladen);
  assert.ok(anteil > 0.55 && anteil < 0.75, `Riese zu Ramme ${anteil.toFixed(2)}`);
  // Eine Einheit schlaegt er ohne den Bonus.
  const [, soldat] = paar(welt, 'riese', 'soldat');
  assert.equal(welt.schaden(riese, soldat), r.angriff - EINHEITEN.soldat.nahruestung);
});

test('einheiten AC-47: der Riese haelt Speerkaempfer und Pikeniere auf und verliert gegen Armbrustschuetzen gleicher Kosten', () => {
  assert.equal(beideSeiten('riese', 'armbrustschuetze'), 0);
  assert.equal(beideSeiten('riese', 'speerkaempfer'), 40);
  assert.equal(beideSeiten('riese', 'pikenier'), 40);
  assert.equal(beideSeiten('riese', 'langschwertkaempfer'), 0);
});

test('einheiten AC-45 bis AC-49: jedes der fuenf Haeuser hat in der Burg genau seine eine Einheit, wer kein Haus hat, keine', () => {
  const welt = new Welt(ZWEI, 7, {});
  const eigene = [['eschenbruch', 'kriegswolf'], ['rappenstein', 'reiterschuetze'], ['wehrstein', 'riese'], ['silberfurt', 'meuchler'], ['distelhag', 'wiedergaenger'], [undefined, null]];
  assert.deepEqual(Object.keys(HAEUSER).sort(), eigene.map(([haus]) => haus).filter(Boolean).sort());
  for (const [haus, art] of eigene) {
    const darf = GEBAEUDE.burg.bildetAus.filter((e) => welt.hausBildetAus({ haus }, e));
    assert.deepEqual(darf, art ? [art] : [], String(haus));
  }
});

// ---- Meuchler und Tarnung ------------------------------------------------------

const DREI = [...ZWEI, { id: 'c', name: 'Cem' }];

/**
 * Ein freier Streifen mitten auf der Karte, acht Felder breit, fern von
 * beiden Doerfern: `x0` ist sein linkes Feld, `y` seine Zeile. Dort sieht
 * niemand hin, bis der Test jemanden hinstellt.
 */
function streifen(welt) {
  const mitte = Math.floor(welt.karte.groesse / 2);
  for (let r = 0; r < 20; r++) {
    for (const [dx, dy] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r], [r, -r], [-r, r]]) {
      const x = mitte + dx;
      const y = mitte + dy;
      if (welt.platzPruefen('burg', x, y) && welt.platzPruefen('burg', x + 4, y)) return { x0: x - 2, y };
    }
  }
  throw new Error('kein freier Streifen');
}
const dabei = (welt, fuer, einheit) => welt.zustandJeSpieler(['a', 'b', 'c']).get(fuer).einheiten.some((e) => e.i === einheit.id);

test('einheiten AC-48: den Meuchler bildet nur Haus Silberfurt aus, in der Burg - zwei Stiche fuer einen Dorfbewohner, und von selbst sticht er nicht', () => {
  const m = EINHEITEN.meuchler;
  assert.deepEqual(m.kosten, { nahrung: 40, gold: 60 });
  assert.deepEqual([m.zeit, m.leben, m.angriff, m.nahruestung, m.fernruestung, m.tempo, m.nachladen], [25, 35, 6, 0, 0, 1.1, 1.5]);
  assert.deepEqual(m.bonus, { dorf: 10, moench: 10 });
  assert.deepEqual(m.haeuser, ['silberfurt']);
  assert.ok(GEBAEUDE.burg.bildetAus.includes('meuchler'));

  const fremd = mitGebaeude('burg', 'distelhag');
  assert.match(bestellen(fremd.welt, fremd.gebaeude, 'meuchler').fehler, /Den Meuchler bildet nur Haus Silberfurt aus/);
  const { welt, anna, gebaeude } = mitGebaeude('burg', 'silberfurt');
  assert.deepEqual(bestellen(welt, gebaeude, 'meuchler'), {});
  assert.equal(anna.nahrung, 3000 - 40);
  assert.equal(anna.gold, 3000 - 60);
  sekunden(welt, m.zeit + 2);
  assert.equal(zaehlen(welt, 'meuchler'), 1);

  // Zwei Stiche: 16 je Stich gegen 25 Leben - und gegen den Moench (30) auch.
  const [meuchler, bauer] = paar(welt, 'meuchler', 'dorfbewohner');
  assert.equal(welt.schaden(meuchler, bauer), m.angriff + m.bonus.dorf - EINHEITEN.dorfbewohner.nahruestung);
  assert.equal(Math.ceil(EINHEITEN.dorfbewohner.leben / welt.schaden(meuchler, bauer)), 2);
  const moench = welt.einheitAnlegen('b', bauer.x + 1, bauer.y, 'moench');
  assert.equal(Math.ceil(EINHEITEN.moench.leben / welt.schaden(meuchler, moench)), 2);
  // Einen Soldaten sticht er ohne Bonus.
  const soldat = welt.einheitAnlegen('b', bauer.x + 8, bauer.y, 'soldat');
  assert.equal(welt.schaden(meuchler, soldat), m.angriff - EINHEITEN.soldat.nahruestung);
  welt.einheiten.delete(soldat.id);
  welt.einheiten.delete(moench.id);

  // Von selbst sticht er nicht (`wacht: false`): wer neben ihm arbeitet, lebt.
  assert.equal(m.wacht, false);
  sekunden(welt, 4);
  assert.equal(bauer.leben, EINHEITEN.dorfbewohner.leben);
  assert.equal(meuchler.auftrag, null);
  // Auf Befehl faellt der Dorfbewohner nach zwei Stichen - in weniger als vier Sekunden.
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [meuchler.id], ziel: { x: bauer.x, y: bauer.y } });
  sekunden(welt, 4);
  assert.ok(bauer.tot, `Dorfbewohner hat noch ${bauer.leben}`);
});

test('einheiten AC-48: gegen Soldaten und Langschwertkaempfer gleicher Kosten verliert der Meuchler', () => {
  assert.equal(beideSeiten('meuchler', 'soldat'), 0);
  assert.equal(beideSeiten('meuchler', 'langschwertkaempfer'), 0);
});

test('kampf AC-22: einen Getarnten sieht der Gegner nicht in seiner Sicht, sondern erst auf zwei Felder', () => {
  // Nur der Meuchler ist getarnt, und wie nah man sein muss, steht in den Daten.
  assert.deepEqual(Object.keys(EINHEITEN).filter((art) => EINHEITEN[art].getarnt), ['meuchler']);
  assert.equal(EINHEITEN.meuchler.getarnt, 2);

  const welt = new Welt(DREI, 7, { teams: { a: 1, c: 1, b: 2 } });
  assert.equal(welt.sichtArt, 'nebel');
  const { x0, y } = streifen(welt);
  const meuchler = welt.einheitAnlegen('a', x0, y, 'meuchler');
  // Zum Vergleich ein Soldat von Anna daneben: den sieht Bert wie jeden.
  const offen = welt.einheitAnlegen('a', x0 + 1, y + 1, 'soldat');
  const waechter = welt.einheitAnlegen('b', x0 + 3, y, 'dorfbewohner');
  welt.sichtAktualisieren();

  // Das Feld liegt in Berts Sicht - der Meuchler darauf nicht.
  assert.ok(welt.sieht('b', x0, y));
  assert.ok(welt.siehtEinheit('b', offen));
  assert.ok(!welt.siehtEinheit('b', meuchler));
  assert.ok(welt.verborgen('b', meuchler));
  // Was er nicht sieht, schickt der Server ihm nicht (kampf AC-13) ...
  assert.ok(dabei(welt, 'b', offen));
  assert.ok(!dabei(welt, 'b', meuchler));
  // ... und ein Klick auf das Feld ist ein Gang, kein Angriff.
  assert.equal(welt.feindAn('b', meuchler.x, meuchler.y), null);
  // Anna sieht ihn, und ihr Verbuendeter Cem auch - wie jede Einheit.
  assert.ok(dabei(welt, 'a', meuchler));
  assert.ok(welt.siehtEinheit('c', meuchler));
  assert.ok(dabei(welt, 'c', meuchler));

  // Zwei Felder: gesehen. Gerechnet wird mit der Sicht, zweimal je Sekunde.
  waechter.x = x0 + 2;
  welt.sichtAktualisieren();
  assert.ok(welt.siehtEinheit('b', meuchler));
  assert.ok(dabei(welt, 'b', meuchler));
  assert.equal(welt.feindAn('b', meuchler.x, meuchler.y), meuchler);
  // Und wieder drei: verborgen.
  waechter.x = x0 + 3;
  welt.sichtAktualisieren();
  assert.ok(!dabei(welt, 'b', meuchler));

  // Ein fertiges Gebaeude entdeckt ihn auch - gemessen vom Rand seiner Grundflaeche.
  welt.einheiten.delete(waechter.id);
  welt.gebaeudeAnlegen('b', 'haus', x0 + 4, y);
  welt.sichtAktualisieren();
  const rand = welt.grundflaeche('haus', x0 + 4, y).x0;
  assert.equal(welt.siehtEinheit('b', meuchler), rand - x0 <= 2, `Rand bei ${rand - x0} Feldern`);
});

test('kampf AC-22: Wache, Turm und laufender Angriff lassen einen Getarnten stehen, bis er entdeckt ist', () => {
  const welt = new Welt(ZWEI, 7, {});
  const { x0, y } = streifen(welt);
  const meuchler = welt.einheitAnlegen('a', x0, y, 'meuchler');
  const voll = EINHEITEN.meuchler.leben;

  // Die Wache auf drei Felder: er steht in ihrer Sichtweite (4), sie greift nicht an.
  const wache = welt.einheitAnlegen('b', x0 + 3, y, 'soldat');
  sekunden(welt, 4);
  assert.equal(wache.auftrag, null);
  assert.equal(meuchler.leben, voll);
  // Ein offener Gegner an derselben Stelle wird sofort angegriffen.
  const offen = welt.einheitAnlegen('a', x0, y + 1, 'plaenkler');
  sekunden(welt, 1);
  assert.equal(wache.auftrag?.art, 'angreifen');
  assert.equal(wache.auftrag.ziel, offen.id);
  welt.einheitSterben(offen);
  sekunden(welt, 3);

  // Auf zwei Felder ist er entdeckt: die Wache stellt ihn, und er wehrt sich.
  wache.auftrag = null;
  wache.weg = [];
  wache.x = x0 + 2;
  wache.y = y;
  sekunden(welt, 5);
  assert.ok(meuchler.leben < voll, 'die Wache hat ihn gestellt');
  assert.ok(wache.leben < EINHEITEN.soldat.leben, 'getroffen schlaegt er zurueck');

  // Entkommt er auf drei Felder, endet der Angriff: die Wache verfolgt nicht, was sie nicht sieht.
  meuchler.leben = voll;
  meuchler.auftrag = null;
  meuchler.weg = [];
  meuchler.x = x0 + 6;
  meuchler.y = y;
  wache.x = x0 + 3;
  wache.y = y;
  sekunden(welt, 3);
  assert.notEqual(wache.auftrag?.art, 'angreifen');
  assert.equal(meuchler.leben, voll);
  welt.einheitSterben(wache);
  sekunden(welt, 3);

  // Ein Turm auf fuenf Felder schiesst nicht auf ihn - auf einen Offenen daneben schon.
  meuchler.x = x0;
  const turm = welt.gebaeudeAnlegen('b', 'wachturm', x0 + 5, y);
  sekunden(welt, 6);
  assert.equal(meuchler.leben, voll);
  const ziel = welt.einheitAnlegen('a', x0, y + 1, 'soldat');
  sekunden(welt, 6);
  assert.ok(ziel.leben < EINHEITEN.soldat.leben, 'der Turm schiesst');
  assert.equal(meuchler.leben, voll);
  welt.einheitSterben(ziel);
  // Auf zwei Felder am Turm ist er entdeckt und wird beschossen.
  meuchler.x = turm.x - 2;
  sekunden(welt, 6);
  assert.ok(meuchler.leben < voll, 'der Turm stellt ihn');
});

test('kampf AC-22: ein Moench bekehrt einen Getarnten nur, solange sein Spieler ihn sieht', () => {
  // Entdeckt bleibt er: Berts Dorfbewohner steht zwei Felder neben ihm, der
  // Moench sechs Felder weit - in seiner Reichweite (9), aber zu weit, um
  // selbst zu entdecken.
  const stellen = () => {
    const welt = new Welt(ZWEI, 7, {});
    const { x0, y } = streifen(welt);
    const meuchler = welt.einheitAnlegen('a', x0, y, 'meuchler');
    const spaeher = welt.einheitAnlegen('b', x0 + 2, y, 'dorfbewohner');
    const moench = welt.einheitAnlegen('b', x0 + 6, y, 'moench');
    welt.sichtAktualisieren();
    assert.ok(welt.siehtEinheit('b', meuchler));
    welt.bekehrenBeginnen(moench, meuchler);
    assert.equal(moench.auftrag?.art, 'bekehren');
    return { welt, meuchler, spaeher, moench };
  };

  const offen = stellen();
  sekunden(offen.welt, EINHEITEN.moench.bekehren.spaet + 1);
  assert.equal(offen.meuchler.besitzer, 'b', 'wer entdeckt bleibt, wird bekehrt');

  // Geht der Entdecker, ist der Meuchler wieder verborgen - und der Moench
  // laesst ab, bevor die kuerzeste Dauer um ist.
  const fort = stellen();
  fort.welt.einheiten.delete(fort.spaeher.id);
  sekunden(fort.welt, 1);
  assert.ok(fort.welt.verborgen('b', fort.meuchler));
  assert.equal(fort.moench.auftrag, null);
  sekunden(fort.welt, EINHEITEN.moench.bekehren.spaet + 1);
  assert.equal(fort.meuchler.besitzer, 'a', 'im Verborgenen wird niemand bekehrt');
});

test('kampf AC-22: bei der Sicht "Aufgedeckt" gibt es keine Tarnung', () => {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  const { x0, y } = streifen(welt);
  const meuchler = welt.einheitAnlegen('a', x0, y, 'meuchler');
  welt.sichtAktualisieren();
  assert.ok(welt.siehtEinheit('b', meuchler));
  assert.ok(!welt.verborgen('b', meuchler));
  assert.equal(welt.feindAn('b', meuchler.x, meuchler.y), meuchler);
});

// ---- Wiedergaenger -------------------------------------------------------------

test('einheiten AC-49: ein Wiedergaenger kostet 30 Gold und einen Gefallenen - gezaehlt nur fuer das Haus, das damit bezahlt', () => {
  const w = EINHEITEN.wiedergaenger;
  assert.deepEqual(w.kosten, { gold: 30, gefallene: 1 });
  assert.deepEqual([w.zeit, w.leben, w.angriff, w.nahruestung, w.fernruestung, w.tempo, w.nachladen], [10, 60, 6, 1, 0, 0.7, 2]);
  assert.deepEqual(w.klassen, ['infanterie', 'untot']);
  assert.ok(KLASSEN.untot, 'die Klasse hat einen Namen fuer die Leiste');
  assert.deepEqual(w.haeuser, ['distelhag']);
  assert.ok(GEBAEUDE.burg.bildetAus.includes('wiedergaenger'));
  // Im Vergleich der Kosten zaehlt nur, was ein Rohstoff ist.
  assert.equal(kostenSumme('wiedergaenger'), 31);

  // Ein anderes Haus: abgesagt - und wer dort stirbt, wird nicht gezaehlt.
  const fremd = mitGebaeude('burg', 'silberfurt');
  assert.match(bestellen(fremd.welt, fremd.gebaeude, 'wiedergaenger').fehler, /Den Wiedergänger bildet nur Haus Distelhag aus/);
  fremd.welt.einheitSterben([...fremd.welt.einheiten.values()].find((e) => e.besitzer === 'a'));
  assert.equal(fremd.anna.gefallene, 0);

  const { welt, anna, gebaeude } = mitGebaeude('burg', 'distelhag');
  assert.equal(anna.gefallene, 0);
  const vorher = { ...anna };
  assert.match(bestellen(welt, gebaeude, 'wiedergaenger').fehler, /Zu wenig Gefallene/);
  assert.equal(anna.gold, vorher.gold);

  // Zwei fallen: einer im Kampf, einer entlassen - beide zaehlen.
  const eigene = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  welt.einheitSterben(eigene[0]);
  assert.deepEqual(welt.nachricht('a', { auftrag: 'entlassen', einheit: eigene[1].id }), {});
  assert.equal(anna.gefallene, 2);
  // Ein gefallener Gegner zaehlt nicht fuer Anna.
  welt.einheitSterben([...welt.einheiten.values()].find((e) => e.besitzer === 'b'));
  assert.equal(anna.gefallene, 2);
  assert.equal(welt.spielerVon('b').gefallene, 0);

  // Bezahlt ueber denselben Weg wie Gold; Nahrung kostet er nicht.
  assert.deepEqual(bestellen(welt, gebaeude, 'wiedergaenger'), {});
  assert.deepEqual(bestellen(welt, gebaeude, 'wiedergaenger'), {});
  assert.equal(anna.gefallene, 0);
  assert.equal(anna.gold, vorher.gold - 60);
  assert.equal(anna.nahrung, vorher.nahrung);
  assert.match(bestellen(welt, gebaeude, 'wiedergaenger').fehler, /Zu wenig Gefallene/);
  // Abgesagt kommt beides zurueck.
  assert.deepEqual(welt.nachricht('a', { auftrag: 'abbrechen', gebaeude: gebaeude.id, platz: 1 }), {});
  assert.equal(anna.gefallene, 1);
  assert.equal(anna.gold, vorher.gold - 30);

  // Nach zehn Sekunden steht er an der Burg - nicht dort, wo jemand fiel.
  sekunden(welt, w.zeit + 2);
  assert.equal(zaehlen(welt, 'wiedergaenger'), 1);
  const untoter = [...welt.einheiten.values()].find((e) => e.art === 'wiedergaenger');
  assert.ok(Math.hypot(untoter.x - gebaeude.x, untoter.y - gebaeude.y) < 5);
  assert.ok(Number.isFinite(welt.punkte(anna)), 'die Punkte rechnen den Gefallenen nicht als Rohstoff');

  // Ein gefallener Wiedergaenger zaehlt nicht noch einmal.
  welt.einheitSterben(untoter);
  assert.equal(anna.gefallene, 1);
});

test('einheiten AC-49: der Wiedergaenger bekommt Schmiede und Hausbonus, und kein Moench heilt oder bekehrt ihn', () => {
  const w = EINHEITEN.wiedergaenger;
  const { welt } = mitGebaeude('burg', 'distelhag');
  const bert = welt.spielerVon('b');
  // Der Hausbonus fuer Fussvolk gilt auch ihm.
  assert.equal(welt.einheitenwert('a', 'wiedergaenger', 'nahruestung'), w.nahruestung + HAEUSER.distelhag.boni.wirkung.infanterie.nahruestung);
  const untoter = welt.einheitAnlegen('a', bert.basis.x + 2, bert.basis.y + 4, 'wiedergaenger');
  const soldat = welt.einheitAnlegen('a', bert.basis.x + 2, bert.basis.y + 5, 'soldat');
  const fremder = welt.einheitAnlegen('b', bert.basis.x + 3, bert.basis.y + 4, 'moench');
  const eigener = welt.einheitAnlegen('a', bert.basis.x + 1, bert.basis.y + 4, 'moench');
  // Bekehren: den Soldaten ja, den Untoten nicht.
  assert.ok(welt.kannBekehren(fremder, soldat));
  assert.ok(!welt.kannBekehren(fremder, untoter));
  // Heilen: den verletzten Soldaten ja, den verletzten Untoten nicht - auch nicht auf Befehl.
  untoter.leben -= 20;
  soldat.leben -= 20;
  assert.ok(welt.kannHeilen(eigener, soldat));
  assert.ok(!welt.kannHeilen(eigener, untoter));
  soldat.leben = welt.einheitenwert('a', 'soldat', 'leben');
  assert.equal(welt.verletzterAn('a', untoter.x, untoter.y), null);
  // Die Schmiede staerkt ihn wie jedes Fussvolk.
  const angriff = welt.einheitenwert('a', 'wiedergaenger', 'angriff');
  allesErforscht(welt);
  assert.ok(welt.einheitenwert('a', 'wiedergaenger', 'angriff') > angriff);
});

test('einheiten AC-49: die eigenen Gefallenen stehen im eigenen Zustand, beim Gegner nicht', () => {
  const welt = new Welt(ZWEI, 7, { haeuser: { a: 'distelhag', b: 'distelhag' } });
  const zustand = (fuer, von) => welt.zustandJeSpieler(['a', 'b']).get(fuer).spieler.find((s) => s.id === von);
  assert.equal(zustand('a', 'a').gf, undefined);
  welt.einheitSterben([...welt.einheiten.values()].find((e) => e.besitzer === 'a'));
  assert.equal(zustand('a', 'a').gf, 1);
  assert.equal(zustand('b', 'a').gf, undefined);
});

test('einheiten AC-49: gegen Schuetzen des Fuerstentums verliert der Wiedergaenger, wenn der Gefallene mitgerechnet wird', () => {
  // "Gleiche Kosten" gibt es fuer ihn nicht von selbst: 30 Gold und ein
  // Gefallener. Gerechnet wird der Gefallene mit dem billigsten Kaempfer,
  // dem Speerkaempfer - also 90 je Wiedergaenger, 13 fuer 1200.
  const je = kostenSumme('wiedergaenger') - 1 + kostenSumme('speerkaempfer');
  assert.equal(je, 90);
  const anzahl = Math.floor(1200 / je);
  const siege = (gegner) => {
    let n = 0;
    for (let startwert = 1; startwert <= 20; startwert++) {
      if (gefechtSpielen({ links: 'wiedergaenger', rechts: gegner, startwert, budget: 1200, minuten: 10, anzahl: { links: anzahl } }).sieger === 'links') n += 1;
      if (gefechtSpielen({ links: gegner, rechts: 'wiedergaenger', startwert, budget: 1200, minuten: 10, anzahl: { rechts: anzahl } }).sieger === 'rechts') n += 1;
    }
    return n;
  };
  assert.equal(siege('bogenschuetze2'), 0);
  assert.equal(siege('armbrustschuetze'), 0);
  // Nur nach dem Gold gerechnet - 38 Stueck - ueberrennt er jeden: deshalb zaehlt der Gefallene mit.
  assert.equal(beideSeiten('wiedergaenger', 'armbrustschuetze'), 40);
});

// ---- Die KI --------------------------------------------------------------------

test('einheiten AC-42: die KI bildet nicht aus, was nur ein anderes Haus ausbildet - und die Einheiten der Haeuser vorerst gar nicht', () => {
  const besonders = Object.keys(EINHEITEN).filter((art) => EINHEITEN[art].haeuser);
  assert.ok(besonders.length >= 5, String(besonders));
  for (const [haus, art] of [['eschenbruch', 'schiessanlage'], ['wehrstein', 'schiessanlage'], [null, 'schiessanlage'], ['silberfurt', 'kaserne'], ['rappenstein', 'burg']]) {
    const { welt, gebaeude } = mitGebaeude(art, haus);
    const ki = new Ki(welt, 'a');
    // Mit viel und mit wenig Gold: die KI geht ihre Liste durch und nennt
    // nie, was nur ein anderes Haus ausbildet - und bis ki AC-28 auch die
    // eigene Hauseinheit und den Soeldner nicht (im Nebel 97 und 102 statt
    // 111 von 120 Partien vor Minute 60, gemessen 2026-11-18).
    const arten = new Set();
    for (const gold of [3000, 80, 60, 45, 40]) {
      welt.spielerVon('a').gold = gold;
      const gewaehlt = ki.naechsteKampfeinheit(gebaeude, {});
      if (gewaehlt) arten.add(gewaehlt);
    }
    for (const verboten of [...besonders, 'soeldner']) assert.ok(!arten.has(verboten), `${haus}: ${[...arten]}`);
    if (art !== 'burg') assert.ok(arten.size > 0, `${haus} bildet in ${art} weiter aus`);
  }
});
