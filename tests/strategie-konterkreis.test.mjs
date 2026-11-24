// Das Gleichgewicht der Feudalzeit (→ specs/10-strategie/fahrplan.md AC-9,
// AC-10) und der Ritterzeit (AC-23). Geprueft wird im Gefechtsstand: zwei
// Heere gleicher Kosten stehen sich gegenueber, laufen mit Angriffslauf
// aufeinander zu, und danach rechnet nur noch die Simulation. Kein Server,
// kein Browser.
//
// Zum Nachsehen von Hand: `npm run konterkreis:strategie` gibt dieselben
// Paarungen in beiden Richtungen aus, mit Dauer und Ueberlebenden.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { gefechtSpielen, kostenSumme } = require('../server/spiele/strategie/pruefstand.js');
const { Welt } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, VERBESSERUNGEN } = require('../server/spiele/strategie/daten.js');

// Links schlaegt rechts - der Konterkreis der Feudalzeit aus der Vorlage
// (docs/strategie/vorlage-aoe2.md).
const KREIS = [
  ['speerkaempfer', 'spaeherreiter'],
  ['plaenkler', 'bogenschuetze'],
  ['bogenschuetze', 'speerkaempfer'],
  ['spaeherreiter', 'bogenschuetze'],
];

const STARTWERTE = 20;
// 600 Rohstoffe je Seite: sieben bis zehn Einheiten, je nach Preis. Genug,
// dass die Aufstellung zaehlt, klein genug fuer 0,2 s ueber alle Paarungen.
const BUDGET = 600;

test('fahrplan AC-9: bei gleichen Kosten gewinnt der Konter in mindestens 80 % der Gefechte', () => {
  // Die Schwelle steht im Kriterium: 80 %. Gemessen in Runde 71 gewinnt jeder
  // Konter 20 von 20 und verliert umgekehrt 0 von 20 - der Kreis ist also
  // deutlich schaerfer als verlangt. Geprueft wird die Schwelle, nicht der
  // Messwert: ein Konter, der auf 17 von 20 faellt, ist noch in Ordnung.
  const schwelle = Math.ceil(STARTWERTE * 0.8);
  const bericht = [];
  for (const [konter, ziel] of KREIS) {
    // Gleiche Kosten heisst gleiches Budget, nicht gleiche Stueckzahl: der
    // Reiter kostet 80, der Speerkaempfer 60.
    assert.ok(kostenSumme(konter) > 0 && kostenSumme(ziel) > 0);
    let siege = 0;
    let ohneEnde = 0;
    for (let startwert = 1; startwert <= STARTWERTE; startwert++) {
      const ergebnis = gefechtSpielen({ links: konter, rechts: ziel, startwert, budget: BUDGET });
      if (ergebnis.sieger === 'links') siege += 1;
      if (!ergebnis.sieger) ohneEnde += 1;
    }
    bericht.push(`${konter} gegen ${ziel}: ${siege}/${STARTWERTE}, ohne Ende ${ohneEnde}`);
    assert.ok(
      siege >= schwelle,
      `${konter} soll ${ziel} kontern, gewinnt aber nur ${siege} von ${STARTWERTE} (verlangt ${schwelle}).\n${bericht.join('\n')}`,
    );
    // Ein Gefecht, das in zehn Spielminuten nicht endet, ist kein Sieg des
    // Konters - es ist eine Messung, die nichts sagt. Deshalb hier mit.
    assert.equal(ohneEnde, 0, `${konter} gegen ${ziel}: ${ohneEnde} Gefechte ohne Ende`);
  }
});

test('fahrplan AC-9: umgekehrt gewinnt der Gekonterte so gut wie nie', () => {
  // Die Gegenprobe. Ohne sie wuerde der Test auch dann gruen sein, wenn
  // einfach immer die linke Seite gewinnt - etwa weil sie zuerst anlegt oder
  // zuerst befiehlt. Gemessen in Runde 71: 0 von 20 in allen vier Paarungen.
  for (const [konter, ziel] of KREIS) {
    let siege = 0;
    for (let startwert = 1; startwert <= STARTWERTE; startwert++) {
      const ergebnis = gefechtSpielen({ links: ziel, rechts: konter, startwert, budget: BUDGET });
      if (ergebnis.sieger === 'links') siege += 1;
    }
    assert.ok(
      siege <= STARTWERTE - Math.ceil(STARTWERTE * 0.8),
      `${ziel} wird von ${konter} gekontert, gewinnt als linke Seite aber ${siege} von ${STARTWERTE}`,
    );
  }
});

test('fahrplan AC-10: dasselbe Gefecht zweimal gerechnet verlaeuft Takt fuer Takt gleich', () => {
  // Die Spur ist je Takt eine Zahl aus Kennung, Leben und Ort aller Einheiten
  // (`gefechtSpielen` mit `spurFuehren`). Zwei Laeufe gleich heisst: gleiche
  // Tote, gleiche Wege, gleiche Treffer - nicht nur gleicher Sieger.
  for (const [links, rechts] of KREIS) {
    const eins = gefechtSpielen({ links, rechts, startwert: 7, budget: BUDGET, spurFuehren: true });
    const zwei = gefechtSpielen({ links, rechts, startwert: 7, budget: BUDGET, spurFuehren: true });
    assert.ok(eins.spur.length > 50, `zu kurze Spur: ${eins.spur.length} Takte`);
    assert.deepEqual(zwei.spur, eins.spur, `${links} gegen ${rechts}: der zweite Lauf weicht ab`);
    assert.equal(zwei.sieger, eins.sieger);
    assert.equal(zwei.takte, eins.takte);
  }
});

test('fahrplan AC-10: ein anderer Startwert ergibt ein anderes Gefecht', () => {
  // Die Gegenprobe zur Gleichheit: waere jedes Gefecht dasselbe, waere die
  // Pruefung oben wertlos. Der Startwert verschiebt die Heere quer zur
  // Laufrichtung (bis zu drei Felder je Seite), also treffen sie anders
  // aufeinander. Gemessen in Runde 71: Speer gegen Reiter dauert 65 bis 133
  // Takte, Reiter gegen Bogen 319 bis 416.
  const [links, rechts] = KREIS[0];
  const spuren = new Set();
  for (const startwert of [1, 2, 3, 4, 5]) {
    const { spur } = gefechtSpielen({ links, rechts, startwert, budget: BUDGET, spurFuehren: true });
    spuren.add(spur.join(','));
  }
  assert.ok(spuren.size >= 4, `fuenf Startwerte ergaben nur ${spuren.size} verschiedene Verlaeufe`);
});

// Der Konterkreis der Ritterzeit (fahrplan AC-23): Speer gegen Ritter,
// Mangonel gegen einen Haufen Bogenschuetzen, Ritter gegen Mangonel.
const KREIS_RITTERZEIT = [
  ['speerkaempfer', 'ritter'],
  ['mangonel', 'bogenschuetze'],
  ['ritter', 'mangonel'],
];
// 1200 statt 600: der Mangonel kostet 295, fuer 600 gaebe es zwei - und
// zwei Steine gegen acht Bogenschuetzen sind kein Haufen. Bei 1200 stehen
// vier Mangonels gegen siebzehn Bogenschuetzen (1180 gegen 1190), zwanzig
// Speerkaempfer gegen acht Ritter. Gemessen in Runde 138 bei 600, 900 und
// 1200: jeder Konter 20 von 20, umgekehrt 0 von 20.
const BUDGET_RITTERZEIT = 1200;

function siegeLinks(links, rechts) {
  let siege = 0;
  let ohneEnde = 0;
  for (let startwert = 1; startwert <= STARTWERTE; startwert++) {
    const ergebnis = gefechtSpielen({ links, rechts, startwert, budget: BUDGET_RITTERZEIT, minuten: 10 });
    if (ergebnis.sieger === 'links') siege += 1;
    if (!ergebnis.sieger) ohneEnde += 1;
  }
  return { siege, ohneEnde };
}

test('fahrplan AC-23: in der Ritterzeit gewinnt der Konter bei gleichen Kosten in mindestens 80 %', () => {
  // Schwelle aus dem Kriterium wie bei AC-9. Gemessen in Runde 138: 20 von
  // 20 in allen drei Paarungen, Gefechte von 76 bis 224 Takten.
  const schwelle = Math.ceil(STARTWERTE * 0.8);
  for (const [konter, ziel] of KREIS_RITTERZEIT) {
    const { siege, ohneEnde } = siegeLinks(konter, ziel);
    assert.ok(siege >= schwelle, `${konter} soll ${ziel} kontern, gewinnt aber nur ${siege} von ${STARTWERTE}`);
    assert.equal(ohneEnde, 0, `${konter} gegen ${ziel}: ${ohneEnde} Gefechte ohne Ende`);
  }
});

test('fahrplan AC-23: umgekehrt gewinnt der Gekonterte in der Ritterzeit so gut wie nie', () => {
  // Die Gegenprobe gegen "links gewinnt immer". Gemessen in Runde 138: 0 von
  // 20 in allen drei Paarungen.
  for (const [konter, ziel] of KREIS_RITTERZEIT) {
    const { siege } = siegeLinks(ziel, konter);
    assert.ok(
      siege <= STARTWERTE - Math.ceil(STARTWERTE * 0.8),
      `${ziel} wird von ${konter} gekontert, gewinnt als linke Seite aber ${siege} von ${STARTWERTE}`,
    );
  }
});

// Der Konterkreis mit den Stufen des Fuerstentums (fahrplan AC-25): jede
// Stufe behaelt, was ihre Vorstufe schlug - und die zwei Schuetzenlinien
// fallen beide vor den Reitern (Benutzer, 2026-11-13). Gemessen am
// 2026-11-13: jede Paarung 20 von 20, umgekehrt 0 von 20.
const KREIS_STUFEN = [
  ['pikenier', 'ritter'],
  ['pikenier', 'leichtekavallerie'],
  ['eliteplaenkler', 'bogenschuetze2'],
  ['eliteplaenkler', 'armbrustschuetze'],
  ['bogenschuetze2', 'pikenier'],
  ['ritter', 'bogenschuetze2'],
  ['ritter', 'armbrustschuetze'],
  ['leichtekavallerie', 'bogenschuetze2'],
  ['leichtekavallerie', 'armbrustschuetze'],
];

test('fahrplan AC-25: die Stufen des Fuerstentums halten den Konterkreis - und Reiter schlagen beide Schuetzenlinien', () => {
  const schwelle = Math.ceil(STARTWERTE * 0.8);
  for (const [konter, ziel] of KREIS_STUFEN) {
    const hin = siegeLinks(konter, ziel);
    assert.ok(hin.siege >= schwelle, `${konter} soll ${ziel} kontern, gewinnt aber nur ${hin.siege} von ${STARTWERTE}`);
    assert.equal(hin.ohneEnde, 0, `${konter} gegen ${ziel}: ${hin.ohneEnde} Gefechte ohne Ende`);
    // Die Gegenprobe gegen "links gewinnt immer".
    const her = siegeLinks(ziel, konter);
    assert.ok(her.siege <= STARTWERTE - schwelle, `${ziel} wird von ${konter} gekontert, gewinnt als linke Seite aber ${her.siege} von ${STARTWERTE}`);
  }
});

test('fahrplan AC-25: die Armbrust ist die Antwort auf Ruestung - gegen geruestete Schuetzen schlaegt sie den Bogen, ohne Ruestung nicht', () => {
  // Wofuer es zwei Linien gibt (einheiten AC-34): der Bolzen trifft mit 9
  // alle 3,5 s, der Pfeil mit 5 alle 2 s. Ohne Ruestung ist das je Sekunde
  // gleich und der Bogen billiger - gemessen 6 von 20 fuer die Armbrust. Mit
  // beiden Schuetzenruestungen der Schmiede auf beiden Seiten bleiben vom
  // Pfeil 3, vom Bolzen 7: 20 von 20.
  const gegenBogen = (erforscht) => {
    let siege = 0;
    for (let startwert = 1; startwert <= STARTWERTE; startwert++) {
      const ergebnis = gefechtSpielen({
        links: 'armbrustschuetze', rechts: 'bogenschuetze2', startwert, budget: BUDGET_RITTERZEIT, minuten: 10,
        erforscht: { links: erforscht, rechts: erforscht },
      });
      if (ergebnis.sieger === 'links') siege += 1;
    }
    return siege;
  };
  const ohne = gegenBogen([]);
  const mit = gegenBogen(['polsterruestung', 'lederruestung']);
  assert.ok(ohne <= STARTWERTE / 2, `ohne Ruestung gewinnt die Armbrust ${ohne} von ${STARTWERTE} - sie soll den Bogen nicht ersetzen`);
  assert.ok(mit >= Math.ceil(STARTWERTE * 0.8), `gegen geruestete Schuetzen gewinnt die Armbrust nur ${mit} von ${STARTWERTE}`);
});

// Der Konterkreis in der Krone (fahrplan AC-26): dieselben neun Paarungen wie
// AC-25, an jeder Stelle die Stufe der Krone, beide Seiten mit der vollen
// Schmiede (bauen AC-48), Budget 2000. Gemessen am 2026-11-18: jede Paarung
// 20 von 20, umgekehrt 0 - auch ohne Schmiede behaelt jede ihre Richtung.
const SCHMIEDE_VOLL = ['schmiedeangriff', 'befiedertePfeile', 'eisenguss', 'bodkinpfeil', 'schuppenpanzer', 'kettenpanzer',
  'schuppenharnisch', 'kettenharnisch', 'polsterruestung', 'lederruestung', 'hochofen', 'armschiene', 'plattenpanzer',
  'plattenharnisch', 'ringpanzer'];
const BUDGET_KRONE = 2000;
const KREIS_KRONE = [
  ['hellebardier', 'kavalier'],
  ['hellebardier', 'husar'],
  ['eliteplaenkler', 'langbogenschuetze'],
  ['eliteplaenkler', 'schwerearmbrust'],
  ['langbogenschuetze', 'hellebardier'],
  ['kavalier', 'langbogenschuetze'],
  ['kavalier', 'schwerearmbrust'],
  ['husar', 'langbogenschuetze'],
  ['husar', 'schwerearmbrust'],
];

// Die eine Ausnahme (Benutzer, 2026-11-22, Entscheidung 1 zum Regelpaket):
// seit kampf AC-26 und AC-27 gewinnt der Hellebardier als linke Seite gegen den
// Langbogen einmal (Startwert 10), der Langbogen weiter 20 von 20. Jede andere
// Paarung bleibt bei 0.
const AUSNAHME_KRONE = { 'hellebardier:langbogenschuetze': 1 };

function siegeInDerKrone(links, rechts) {
  let siege = 0;
  let ohneEnde = 0;
  for (let startwert = 1; startwert <= STARTWERTE; startwert++) {
    const ergebnis = gefechtSpielen({
      links, rechts, startwert, budget: BUDGET_KRONE, minuten: 10, erforscht: { links: SCHMIEDE_VOLL, rechts: SCHMIEDE_VOLL },
    });
    if (ergebnis.sieger === 'links') siege += 1;
    if (!ergebnis.sieger) ohneEnde += 1;
  }
  return { siege, ohneEnde };
}

test('fahrplan AC-26: der Konterkreis haelt in der Krone - jede der neun Paarungen mit der Stufe der Krone und voller Schmiede', () => {
  for (const art of SCHMIEDE_VOLL) assert.ok(VERBESSERUNGEN[art], `${art} steht in den Daten`);
  for (const [konter, ziel] of KREIS_KRONE) {
    const hin = siegeInDerKrone(konter, ziel);
    assert.equal(hin.siege, STARTWERTE, `${konter} soll ${ziel} kontern, gewinnt aber nur ${hin.siege} von ${STARTWERTE}`);
    assert.equal(hin.ohneEnde, 0, `${konter} gegen ${ziel}: ${hin.ohneEnde} Gefechte ohne Ende`);
    const her = siegeInDerKrone(ziel, konter);
    const erlaubt = AUSNAHME_KRONE[`${ziel}:${konter}`] || 0;
    assert.ok(her.siege <= erlaubt, `${ziel} wird von ${konter} gekontert, gewinnt als linke Seite aber ${her.siege} von ${STARTWERTE}`);
  }
});

test('fahrplan AC-26: der Paladin faellt vor dem Hellebardier und schlaegt beide Schuetzenlinien - und gegen das Schwert hilft die Armbrust, nicht der Bogen', () => {
  // Die zweite Stufe des Ritters (einheiten AC-66) steht an derselben Stelle
  // im Kreis wie die erste. Gemessen: je 20 von 20, umgekehrt 0.
  for (const [konter, ziel] of [['hellebardier', 'paladin'], ['paladin', 'langbogenschuetze'], ['paladin', 'schwerearmbrust']]) {
    assert.equal(siegeInDerKrone(konter, ziel).siege, STARTWERTE, `${konter} gegen ${ziel}`);
    assert.equal(siegeInDerKrone(ziel, konter).siege, 0, `${ziel} gegen ${konter}`);
  }
  // Wofuer es zwei Schuetzenlinien gibt, gilt auch in der Krone: der
  // Zweihandkaempfer mit Plattenpanzer laeuft durch die Pfeile (gemessen 20
  // von 20, wie der Langschwertkaempfer durch die des Fuerstentums), vor den
  // Bolzen faellt er (gemessen 19 von 20, als linke Seite gewinnt er 3).
  const schwelle = Math.ceil(STARTWERTE * 0.8);
  assert.ok(siegeInDerKrone('zweihandkaempfer', 'langbogenschuetze').siege >= schwelle, 'das Schwert schlaegt den Bogen');
  assert.ok(siegeInDerKrone('langbogenschuetze', 'zweihandkaempfer').siege <= STARTWERTE - schwelle);
  assert.ok(siegeInDerKrone('schwerearmbrust', 'zweihandkaempfer').siege >= schwelle, 'die schwere Armbrust schlaegt das Schwert');
  assert.ok(siegeInDerKrone('zweihandkaempfer', 'schwerearmbrust').siege <= STARTWERTE - schwelle);
});

/** Wie viele Gegner ein Stein des Mangonels im Mittel trifft, ueber alle Startwerte. */
function trefferJeStein() {
  const urform = Welt.prototype.einschlaegeTakten;
  let steine = 0;
  let treffer = 0;
  Welt.prototype.einschlaegeTakten = function zaehlen() {
    const vorher = this.schlaege.length;
    steine += this.einschlaege.filter((stein) => stein.takte === 1).length;
    urform.call(this);
    // Nur Steine: seit kampf AC-27 landen hier auch die Pfeile der Bogenschuetzen.
    treffer += this.schlaege.slice(vorher)
      .filter((s) => EINHEITEN[s.angreifer.art]?.geschoss && !s.gebaeude && s.ziel.besitzer !== s.angreifer.besitzer).length;
  };
  try {
    const { siege } = siegeLinks('mangonel', 'bogenschuetze');
    return { siege, steine, mittel: treffer / steine };
  } finally {
    Welt.prototype.einschlaegeTakten = urform;
  }
}

test('fahrplan AC-23: der Mangonel schlaegt den Haufen mit der Flaeche - ein Stein trifft im Mittel mehr als einen', () => {
  // Gewaenne der Mangonel nur wegen seiner Fernruestung (6 gegen den
  // Bogenangriff 4: ein Punkt je Pfeil), waeren die Tests oben auch gruen,
  // und "gegen einen Haufen" stuende umsonst im Kriterium. Gemessen in Runde
  // 138: ohne Flaeche gewinnt er ebenso 20 von 20 - der Sieg allein belegt
  // die Flaeche also nicht. Deshalb hier, was nur die Flaeche kann: mehr als
  // ein Getroffener je Stein. Gemessen 1,66 (je Startwert 1,40 bis 2,81),
  // mit Flaeche 0,05 statt 1 nur 0,65, und das Gefecht dauert doppelt so
  // lange (Median 225 statt 95 Takte). Die Grenze "mehr als einer" ist,
  // was ein Stein ohne Flaeche hoechstens schafft.
  const mit = trefferJeStein();
  assert.ok(mit.steine >= 40, `nur ${mit.steine} Steine in zwanzig Gefechten`);
  assert.ok(mit.mittel > 1, `ein Stein trifft im Mittel nur ${mit.mittel.toFixed(2)} Gegner`);

  // Gegenprobe: dieselbe Zaehlung ohne Flaeche liegt unter eins - sonst
  // zaehlte sie etwas anderes als die Flaeche.
  const urflaeche = EINHEITEN.mangonel.flaeche;
  EINHEITEN.mangonel.flaeche = 0.05;
  try {
    const ohne = trefferJeStein();
    assert.ok(ohne.mittel <= 1, `ohne Flaeche trifft ein Stein im Mittel ${ohne.mittel.toFixed(2)} Gegner`);
  } finally {
    EINHEITEN.mangonel.flaeche = urflaeche;
  }
});
