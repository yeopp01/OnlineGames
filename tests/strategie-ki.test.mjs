// Die KI und der Pruefstand (→ specs/10-strategie/ki.md, fahrplan AC-4) -
// Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt } = require('../server/spiele/strategie/welt.js');
const {
  Ki, ENTSCHEIDEN_ALLE, ZIEL_DORFBEWOHNER, FEUDALZEIT_NAHRUNG, AN_SCHAFEN, AN_BEEREN, MILITAER,
  HEER, WACHE, HEER_ABSTAND, WACHE_NAH, FEIND_FERN, VERGEBEN_ABSTAND, MILITAER_HOLZ, UEBERSCHUSS, MANGEL, UNERREICHBAR_SEKUNDEN, plan,
} = require('../server/spiele/strategie/ki.js');
const { TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, SAMMELN } = require('../server/spiele/strategie/daten.js');
const { partieSpielen, pruefen, Widerspruch } = require('../server/spiele/strategie/pruefstand.js');
const { suchen } = require('../server/spiele/strategie/wege.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

// Was sich in der Welt aendern kann, als Text - zum Vergleichen.
const abbild = (welt) => JSON.stringify({
  takt: welt.takt,
  spieler: welt.spieler,
  einheiten: [...welt.einheiten.values()],
  gebaeude: [...welt.gebaeude.values()],
  tiere: [...welt.tiere.values()],
  felder: Array.from(welt.karte.felder),
});

test('ki AC-1: die KI aendert die Welt nie selbst, nur ueber Nachrichten wie der Browser', () => {
  const welt = new Welt(ZWEI, 7);
  const ki = new Ki(welt, 'a');
  const echt = welt.nachricht.bind(welt);
  const gesendet = [];
  for (let runde = 0; runde < 40; runde++) {
    // Waehrend die KI entscheidet, kommen Nachrichten nur an und wirken nicht.
    welt.nachricht = (spielerId, nachricht) => { gesendet.push({ spielerId, nachricht }); return {}; };
    const vorher = abbild(welt);
    ki.entscheiden();
    assert.equal(abbild(welt), vorher, `Runde ${runde}: die KI hat die Welt ohne Nachricht veraendert`);
    // Dann wirken sie, und die Welt laeuft weiter.
    welt.nachricht = echt;
    for (const { nachricht } of gesendet.splice(0)) welt.nachricht('a', nachricht);
    for (let t = 0; t < 5; t++) welt.takten();
  }
  assert.ok(welt.einheiten.size > 0);
  // Sie hat tatsaechlich etwas gewollt - sonst waere die Pruefung leer.
  assert.ok([...welt.einheiten.values()].some((e) => e.besitzer === 'a' && (e.auftrag || e.sammelt)), 'die KI hat Dorfbewohner losgeschickt');
});

test('ki AC-1: was einem Menschen abgewiesen wird, wird der KI genauso abgewiesen', () => {
  const welt = new Welt(ZWEI, 7);
  const ki = new Ki(welt, 'a');
  const bauer = [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a');
  const fremdes = [...welt.gebaeude.values()].find((g) => g.besitzer === 'b');
  const befehle = [
    // Auf das eigene Dorfzentrum bauen.
    { auftrag: 'bauen', einheiten: [bauer.id], art: 'haus', ziel: { x: zentrum.x, y: zentrum.y } },
    // Im fremden Dorfzentrum ausbilden.
    { auftrag: 'ausbilden', gebaeude: fremdes.id, einheit: 'dorfbewohner' },
    // Eine Burg, die es nicht gibt.
    { auftrag: 'bauen', einheiten: [bauer.id], art: 'burg', ziel: { x: 1, y: 1 } },
  ];
  for (const befehl of befehle) {
    const mensch = new Welt(ZWEI, 7).nachricht('a', befehl);
    const vorher = abbild(welt);
    const antwort = ki.senden(befehl);
    assert.ok(antwort.fehler, `abgewiesen: ${JSON.stringify(befehl)}`);
    assert.equal(antwort.fehler, mensch.fehler, 'mit derselben Absage wie fuer einen Menschen');
    assert.equal(abbild(welt), vorher, 'und ohne Wirkung');
  }
  assert.equal(ki.abgewiesen, befehle.length, 'die KI zaehlt ihre Absagen');
});

test('ki AC-2: zwei Partien KI gegen KI mit demselben Startwert enden gleich, ein anderer Startwert anders', () => {
  const a = partieSpielen({ startwert: 31, minuten: 3 });
  const b = partieSpielen({ startwert: 31, minuten: 3 });
  const c = partieSpielen({ startwert: 32, minuten: 3 });
  assert.equal(abbild(a.welt), abbild(b.welt), 'Takt fuer Takt gleich - am Ende derselbe Zustand');
  assert.deepEqual(a.spieler, b.spieler);
  assert.notEqual(abbild(a.welt), abbild(c.welt), 'ein anderer Startwert gibt eine andere Partie');
});

test('ki AC-7: npm run pruefstand:strategie spielt Partien ohne Server und Browser und schreibt Kennzahlen', () => {
  const skript = fileURLToPath(new URL('../scripts/pruefstand-strategie.mjs', import.meta.url));
  const ausgabe = execFileSync(process.execPath, [skript, '--partien', '2', '--minuten', '1', '--startwert', '5'], { encoding: 'utf8' });
  // Je Partie Startwert und Dauer, je Spieler Kennzahlen.
  assert.match(ausgabe, /^Startwert 5 · \d+ ms · 600 Takte · [\d.]+ ms je Takt$/m);
  assert.match(ausgabe, /^Startwert 6 · \d+ ms · 600 Takte · [\d.]+ ms je Takt$/m);
  const zeilen = ausgabe.split('\n').filter((z) => /^ {2}KI \d: \d+ Dorfbewohner/.test(z));
  assert.equal(zeilen.length, 4, 'zwei Partien mal zwei Spieler');
  for (const zeile of zeilen) assert.match(zeile, /Holz \d+, Nahrung \d+, Gold \d+, Stein \d+/);
  assert.match(ausgabe, /keine Widersprueche/);
});

test('ki AC-8 / fahrplan AC-4: der Pruefstand prueft jeden Takt und bricht mit Startwert und Takt ab', () => {
  // Ein negativer Vorrat mitten in der Partie.
  assert.throws(
    () => partieSpielen({ startwert: 9, minuten: 1, eingriff: (welt, takt) => { if (takt === 37) welt.spieler[1].holz = -5; } }),
    (fehler) => fehler instanceof Widerspruch && fehler.startwert === 9 && fehler.takt === 37 && /KI 2: holz ist -5/.test(fehler.message),
  );

  // Jede Art von Widerspruch wird erkannt.
  const welt = new Welt(ZWEI, 7);
  assert.deepEqual(pruefen(welt), [], 'eine frische Welt ist in Ordnung');
  const einheit = [...welt.einheiten.values()][0];
  const g = welt.karte.groesse;
  const baum = welt.karte.felder.findIndex((f) => f === karten.WALD);
  einheit.x = baum % g;
  einheit.y = Math.floor(baum / g);
  assert.match(pruefen(welt).join(), /in einem Hindernis/);
  einheit.x = welt.spielerVon('a').basis.x + 3;
  einheit.y = welt.spielerVon('a').basis.y + 3;

  const zentrum = [...welt.gebaeude.values()].find((x) => x.besitzer === 'a');
  welt.gebaeude.set(9999, { ...zentrum, id: 9999, x: zentrum.x + 1 });
  assert.match(pruefen(welt).join(), /ueberlappen/);
  welt.gebaeude.delete(9999);

  for (let i = 0; i < 201; i++) welt.einheiten.set(10000 + i, { ...einheit, id: 10000 + i });
  assert.match(pruefen(welt).join(), /Bevoelkerung 20\d ueber 200/);
});

test('fahrplan AC-4: zehn Spielminuten KI gegen KI ohne Widerspruch, ueber mehrere Startwerte', () => {
  for (const startwert of [1, 4711, 20260917]) {
    const ergebnis = partieSpielen({ startwert, minuten: 10 });
    assert.equal(ergebnis.takte, 6000);
    for (const spieler of ergebnis.spieler) assert.ok(spieler.dorfbewohner > 3, `${startwert}: ${spieler.name} hat ausgebildet`);
  }
});

// Eine Partie beobachten, ohne einzugreifen: was die KIs bauen und wie lange
// das Dorfzentrum ohne Grund stillsteht.
function beobachten(startwert) {
  const beobachtet = { stillstand: new Map(), laengsterStillstand: new Map(), wartet: new Map(), neu: [] };
  const bekannt = new Set();
  const ergebnis = partieSpielen({
    startwert,
    minuten: 10,
    eingriff: (welt) => {
      for (const spieler of welt.spieler) {
        const eigene = [...welt.einheiten.values()].filter((e) => e.besitzer === spieler.id);
        const dorfbewohner = eigene.filter((e) => e.art === 'dorfbewohner');
        const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === spieler.id && g.art === 'dorfzentrum');
        // Stillstand: leere Schlange, obwohl Nahrung da ist und das Ziel nicht erreicht.
        const still = zentrum.schlange.length === 0 && spieler.nahrung >= EINHEITEN.dorfbewohner.kosten.nahrung
          && dorfbewohner.length < ZIEL_DORFBEWOHNER;
        const n = still ? (beobachtet.stillstand.get(spieler.id) || 0) + 1 : 0;
        beobachtet.stillstand.set(spieler.id, n);
        beobachtet.laengsterStillstand.set(spieler.id, Math.max(n, beobachtet.laengsterStillstand.get(spieler.id) || 0));
        if (zentrum.wartet) beobachtet.wartet.set(spieler.id, (beobachtet.wartet.get(spieler.id) || 0) + 1);
      }
      for (const g of welt.gebaeude.values()) {
        if (bekannt.has(g.id)) continue;
        bekannt.add(g.id);
        if (g.art === 'dorfzentrum') continue;
        const besitzer = welt.spielerVon(g.besitzer);
        const nahe = (art) => {
          let bestes = Infinity;
          for (const index of welt.karte.vorrat.keys()) {
            if (welt.karte.felder[index] !== art) continue;
            bestes = Math.min(bestes, Math.hypot(index % welt.karte.groesse - g.x, ((index / welt.karte.groesse) | 0) - g.y));
          }
          return bestes;
        };
        const schafe = [...welt.tiere.values()].filter((t) => t.besitzer === g.besitzer && t.nahrung > 0).length;
        const dorfbewohner = [...welt.einheiten.values()].filter((e) => e.besitzer === g.besitzer && e.art === 'dorfbewohner').length;
        const farmen = [...welt.gebaeude.values()].filter((x) => x.besitzer === g.besitzer && x.art === 'farm' && x.id !== g.id).length;
        const anSchafen = [...welt.einheiten.values()].filter((e) => e.besitzer === g.besitzer && e.auftrag?.art === 'tier').length;
        const anBeeren = [...welt.einheiten.values()].filter((e) => e.besitzer === g.besitzer && e.auftrag?.art === 'sammeln'
          && SAMMELN[welt.karte.felder[e.auftrag.feld.y * welt.karte.groesse + e.auftrag.feld.x]]?.rohstoff === 'nahrung').length;
        beobachtet.neu.push({
          art: g.art, spieler: besitzer.name, takt: welt.takt,
          wald: nahe(karten.WALD), gold: nahe(karten.GOLD), beere: nahe(karten.BEERE), schafe, anSchafen, anBeeren, dorfbewohner, farmen,
        });
      }
    },
  });
  return { ergebnis, beobachtet };
}

const STARTWERTE = [1, 2, 3, 4, 5];
let beobachtungen = null;
const alleBeobachtungen = () => {
  beobachtungen ??= STARTWERTE.map((startwert) => ({ startwert, ...beobachten(startwert) }));
  return beobachtungen;
};

test('ki AC-3: die KI entscheidet alle halbe Sekunde und rechnet im Mittel unter 1 ms je Takt', () => {
  const welt = new Welt(ZWEI, 11);
  const ki = new Ki(welt, 'a');
  let entscheidungen = 0;
  const echt = ki.entscheiden.bind(ki);
  ki.entscheiden = () => { entscheidungen += 1; echt(); };
  const takte = 6000;
  let zeit = 0n;
  for (let t = 0; t < takte; t++) {
    const vorher = process.hrtime.bigint();
    ki.takt();
    zeit += process.hrtime.bigint() - vorher;
    welt.takten();
  }
  assert.equal(ENTSCHEIDEN_ALLE, TAKTE_PRO_SEKUNDE / 2, 'eine halbe Sekunde');
  assert.equal(entscheidungen, takte / ENTSCHEIDEN_ALLE, 'nicht in jedem Takt');
  const jeTakt = Number(zeit) / 1e6 / takte;
  assert.ok(jeTakt < 1, `im Mittel ${jeTakt.toFixed(3)} ms je Takt`);
});

test('ki AC-4: bildet ohne Pause aus, baut Haeuser rechtzeitig und verteilt nach dem Plan', () => {
  for (const { startwert, ergebnis, beobachtet } of alleBeobachtungen()) {
    for (const spieler of ergebnis.welt.spieler) {
      // Ohne Pause: das Dorfzentrum steht nie laenger als eine Entscheidung still.
      const still = beobachtet.laengsterStillstand.get(spieler.id) || 0;
      assert.ok(still <= ENTSCHEIDEN_ALLE, `${startwert} ${spieler.name}: ${still} Takte Stillstand`);
      // Haeuser vorher: das Dorfzentrum wartet in der ganzen Partie hoechstens
      // fuenf Sekunden auf Wohnraum - so lange brauchen Bauer zum Platz. Vor
      // Runde 44 waren es bis zu 11 s, weil das erste Haus einer allein baute.
      const wartet = beobachtet.wartet.get(spieler.id) || 0;
      assert.ok(wartet <= 5 * TAKTE_PRO_SEKUNDE, `${startwert} ${spieler.name}: ${wartet / TAKTE_PRO_SEKUNDE} s ohne Wohnraum`);
    }
    for (const p of ergebnis.spieler) {
      assert.equal(p.dorfbewohner, ZIEL_DORFBEWOHNER, `${startwert} ${p.name}: das Ziel steht`);
      assert.ok((p.gebaeude.haus || 0) >= 4, `${startwert} ${p.name}: Haeuser gebaut`);
    }
    // Der Plan: Nahrung, Holz und Gold, kein Stein in der Dunklen Zeit.
    const welt = ergebnis.welt;
    for (const spieler of welt.spieler) {
      const rollen = {};
      for (const e of welt.einheiten.values()) {
        if (e.besitzer !== spieler.id || e.art !== 'dorfbewohner') continue;
        // Ist sein Feld eben leer geworden, zaehlt er nach seiner Ladung oder
        // dem, was er zuletzt sammelte - so wie `Ki.rolle()` es tut. In Runde 91
        // standen beim Startwert 4 vier Holzfaeller mit leerem Baum als
        // "undefined" in der Liste, weil ihr Weg zum Lager laenger geworden war.
        const r = e.auftrag?.art === 'tier' || e.auftrag?.art === 'farm' ? 'nahrung'
          : e.auftrag?.art === 'sammeln'
            ? SAMMELN[welt.karte.felder[e.auftrag.feld.y * welt.karte.groesse + e.auftrag.feld.x]]?.rohstoff
              || e.ladungsart || SAMMELN[e.zuletztGesammelt]?.rohstoff || 'sonst'
            : 'sonst';
        rollen[r] = (rollen[r] || 0) + 1;
      }
      // Am Ende gegen den Plan: je Rohstoff hoechstens drei daneben - wer gerade
      // baut, abliefert oder nach einem leeren Feld umzieht, zaehlt anders.
      const soll = plan(ZIEL_DORFBEWOHNER);
      for (const r of ['nahrung', 'holz', 'gold']) {
        assert.ok(Math.abs((rollen[r] || 0) - soll[r]) <= 3, `${startwert} ${spieler.name}: ${r} ${JSON.stringify(rollen)} gegen ${JSON.stringify(soll)}`);
      }
      assert.ok(!rollen.stein, `${startwert} ${spieler.name}: kein Stein ${JSON.stringify(rollen)}`);
    }
  }
});

test('ki AC-5: Lager an Wald, Gold und Beeren, Farmen erst, wenn Schafe und Beeren nicht reichen', () => {
  for (const { startwert, beobachtet } of alleBeobachtungen()) {
    const von = (art) => beobachtet.neu.filter((n) => n.art === art);
    for (const name of ['KI 1', 'KI 2']) {
      const eigen = (art) => von(art).filter((n) => n.spieler === name);
      assert.ok(eigen('holzfaellerlager').length >= 1, `${startwert} ${name}: Holzfaellerlager`);
      assert.ok(eigen('bergbaulager').length >= 1, `${startwert} ${name}: Bergbaulager`);
      assert.ok(eigen('muehle').length >= 1, `${startwert} ${name}: Muehle`);
      assert.ok(eigen('farm').length >= 1, `${startwert} ${name}: Farmen`);
    }
    // Am Vorrat: hoechstens drei Felder vom naechsten Feld dieser Art, als der Bau begann.
    for (const n of von('holzfaellerlager')) assert.ok(n.wald <= 3, `${startwert}: Holzfaellerlager ${n.wald} vom Wald`);
    for (const n of von('bergbaulager')) assert.ok(n.gold <= 3, `${startwert}: Bergbaulager ${n.gold} vom Gold`);
    for (const n of von('muehle')) assert.ok(n.beere <= 3, `${startwert}: Muehle ${n.beere} von den Beeren`);
    // Eine Farm nur, wenn der Plan mehr Leute an der Nahrung will, als an
    // Schafen und Beeren Platz haben (je sechs, solange etwas da ist).
    for (const n of von('farm')) {
      const platz = (n.schafe > 0 ? AN_SCHAFEN : 0) + (n.beere < Infinity ? AN_BEEREN : 0) + n.farmen;
      const soll = plan(n.dorfbewohner).nahrung;
      assert.ok(soll > platz, `${startwert} ${n.spieler} Takt ${n.takt}: Farm, obwohl ${soll} Nahrung geplant und ${platz} Plaetze`);
    }
    assert.ok(von('farm').some((n) => n.schafe === 0), `${startwert}: spaetestens ohne Schafe entstehen Farmen`);
  }
});

test('ki AC-6: kein Dorfbewohner der KI steht laenger als 20 Sekunden herum', () => {
  for (const { startwert, ergebnis } of alleBeobachtungen()) {
    for (const p of ergebnis.spieler) assert.ok(p.untaetigMax <= 20, `${startwert} ${p.name}: ${p.untaetigMax} s`);
  }
});

test('fahrplan AC-5: nach zehn Spielminuten 20 bis 30 Dorfbewohner und Nahrung fuer die Feudalzeit, ueber zwanzig Startwerte', () => {
  for (let startwert = 1; startwert <= 20; startwert++) {
    // Seit ki AC-9 gibt die KI die 500 Nahrung aus, sobald sie sie hat - der
    // Aufstieg wird kurz vor der zehnten Minute bestellt, danach steht der
    // Vorrat wieder bei 70. Der Vorrat am Ende belegt das Kriterium also nicht
    // mehr; gemessen wird, dass sie in den zehn Minuten einmal genug hatte
    // (Runde 69). "Genug Nahrung fuer die Feudalzeit" heisst das Kriterium,
    // nicht "Nahrung uebrig".
    const hoechste = [];
    const { spieler } = partieSpielen({
      startwert,
      minuten: 10,
      eingriff: (welt) => welt.spieler.forEach((p, i) => { hoechste[i] = Math.max(hoechste[i] || 0, p.nahrung); }),
    });
    spieler.forEach((p, i) => {
      assert.ok(p.dorfbewohner >= 20 && p.dorfbewohner <= 30, `${startwert} ${p.name}: ${p.dorfbewohner} Dorfbewohner`);
      assert.ok(hoechste[i] >= FEUDALZEIT_NAHRUNG, `${startwert} ${p.name}: hoechstens ${hoechste[i]} Nahrung`);
    });
  }
});

// Gemessen in Runde 69 ueber die Startwerte 1 bis 20, je zwei KIs: die
// Feudalzeit stand nach 11,1 bis 11,9 Spielminuten, im Mittel nach 11,6; jeder
// hatte am Ende eine Schiessanlage und 3 bis 7 Kampfeinheiten (die eine davon
// ist der Spaeher vom Anfang). Die Grenzen 11 und 16 kommen aus dem Kriterium,
// nicht aus dieser Messung.
test('ki AC-9: die KI steigt nach 11 bis 16 Spielminuten in die Feudalzeit auf und baut Militaer', () => {
  for (let startwert = 1; startwert <= 20; startwert++) {
    const { spieler } = partieSpielen({ startwert, minuten: 16 });
    for (const p of spieler) {
      assert.equal(p.zeitalter, 1, `${startwert} ${p.name}: Zeitalter`);
      assert.ok(p.feudalMinute >= 11 && p.feudalMinute <= 16, `${startwert} ${p.name}: Feudalzeit ab ${p.feudalMinute} min`);
      // Ein Gebaeude, in dem Kampfeinheiten entstehen - welches, waehlt sie
      // nach ihrem Gold.
      const militaer = MILITAER.filter((art) => p.gebaeude[art]);
      assert.ok(militaer.length, `${startwert} ${p.name}: ${Object.keys(p.gebaeude).join(', ')}`);
      // Und ausgebildet hat sie darin: mehr Kampfeinheiten als den Spaeher,
      // mit dem jeder beginnt.
      assert.ok(p.kampf >= 3, `${startwert} ${p.name}: ${p.kampf} Kampfeinheiten`);
    }
  }
});

test('ki AC-9: ohne 500 Nahrung oder ohne zwei Gebaeude der Dunklen Zeit steigt sie nicht auf', () => {
  const welt = new Welt(ZWEI, 3);
  const ki = new Ki(welt, 'a');
  const spieler = welt.spielerVon('a');
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a');
  const dorfbewohner = Array.from({ length: ZIEL_DORFBEWOHNER }, (unbenutzt, i) => ({ id: i }));

  // Nur das Dorfzentrum steht: die Voraussetzung des Aufstiegs fehlt.
  spieler.nahrung = FEUDALZEIT_NAHRUNG * 2;
  ki.feudalzeitPruefen(zentrum, dorfbewohner);
  assert.deepEqual(zentrum.schlange, [], 'ein Gebaeude zu wenig - kein Aufstieg');
  assert.equal(ki.abgewiesen, 0, 'und sie versucht es nicht einmal');

  // Mit einem zweiten Gebaeude, aber ohne Nahrung: auch nicht.
  welt.nachricht('a', { auftrag: 'bauen', art: 'haus', x: spieler.basis.x + 6, y: spieler.basis.y, einheiten: [] });
  spieler.nahrung = FEUDALZEIT_NAHRUNG - 1;
  ki.feudalzeitPruefen(zentrum, dorfbewohner);
  assert.deepEqual(zentrum.schlange, [], 'zu wenig Nahrung - kein Aufstieg');
});

// Kampfeinheiten auf freien Feldern um einen Punkt anlegen - dasselbe
// ringweise Suchen wie im Pruefgriff `einheiten` (e2e/server.mjs).
function kampfeinheitenAnlegen(welt, spielerId, um, anzahl, art = 'miliz') {
  const belegt = new Set([...welt.einheiten.values()].map((e) => `${Math.round(e.x)},${Math.round(e.y)}`));
  const angelegt = [];
  for (let r = 1; angelegt.length < anzahl && r < 30; r++) {
    for (let dy = -r; dy <= r && angelegt.length < anzahl; dy++) {
      for (let dx = -r; dx <= r && angelegt.length < anzahl; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = Math.round(um.x) + dx;
        const y = Math.round(um.y) + dy;
        if (belegt.has(`${x},${y}`) || !karten.begehbar(welt.karte, x, y) || welt.gebaeudeAn(x, y)) continue;
        belegt.add(`${x},${y}`);
        angelegt.push(welt.einheitAnlegen(spielerId, x, y, art));
      }
    }
  }
  assert.equal(angelegt.length, anzahl, 'genug Platz fuer die Einheiten');
  return angelegt;
}

const eigeneVon = (welt, spielerId) => [...welt.einheiten.values()].filter((e) => e.besitzer === spielerId);
const kampfVon = (welt, spielerId) => eigeneVon(welt, spielerId)
  .filter((e) => !(EINHEITEN[e.art].klassen || []).includes('dorf'));

test('ki AC-11: acht brechen auf, zwei bleiben als Wache - und unter zehn Kampfeinheiten niemand', () => {
  const welt = new Welt(ZWEI, 5);
  const ki = new Ki(welt, 'a');
  const a = welt.spielerVon('a');
  const zentrumB = [...welt.gebaeude.values()].find((g) => g.besitzer === 'b' && g.art === 'dorfzentrum');

  // Einer steht schon da: der Spaeherreiter aus der Startaufstellung.
  const schon = kampfVon(welt, 'a').length;
  assert.ok(schon >= 1, 'der Spaeher zaehlt als Kampfeinheit');

  // Eine unter zehn: niemand marschiert. Nicht neun fest hinschreiben - was
  // in der Startaufstellung steht, kann sich aendern (HEER und WACHE sind die
  // Zahlen, die das Kriterium nennt).
  kampfeinheitenAnlegen(welt, 'a', a.basis, HEER + WACHE - 1 - schon);
  assert.equal(kampfVon(welt, 'a').length, HEER + WACHE - 1);
  ki.heerPruefen(eigeneVon(welt, 'a'));
  assert.equal(ki.angriffe, 0, 'eine zu wenig - kein Aufbruch');
  assert.equal(ki.heer.size, 0);
  assert.equal(kampfVon(welt, 'a').filter((e) => e.angriffslauf).length, 0, 'und niemand im Angriffslauf');

  // Die zehnte: acht brechen auf.
  kampfeinheitenAnlegen(welt, 'a', a.basis, 1);
  ki.heerPruefen(eigeneVon(welt, 'a'));
  assert.equal(ki.angriffe, 1, 'ein Heer ist aufgebrochen');
  assert.equal(ki.angriffTakt, welt.takt, 'und der Takt ist vermerkt');
  assert.equal(ki.heer.size, HEER, 'acht marschieren');

  // Gegenprobe: dass acht einen Befehl haben, genuegt nicht - sie muessen im
  // **Angriffslauf** zum Gegner gehen. Sonst waere der Test auch gruen, wenn
  // die KI acht Leute irgendwohin schickt.
  const marschierend = kampfVon(welt, 'a').filter((e) => e.angriffslauf);
  assert.equal(marschierend.length, HEER, 'acht im Angriffslauf (kampf AC-4)');
  for (const e of marschierend) {
    assert.ok(ki.heer.has(e.id), `${e.id} gehoert zum Heer`);
    assert.ok(e.weg.length, `${e.id} ist unterwegs`);
    const weit = Math.hypot(e.angriffslauf.x - zentrumB.x, e.angriffslauf.y - zentrumB.y);
    assert.ok(weit <= HEER_ABSTAND + 2, `${e.id}: Marschziel ${weit.toFixed(1)} Felder vom fremden Dorfzentrum`);
  }

  // Die Wache bleibt, und zwar die, die der eigenen Basis am naechsten steht.
  const daheim = kampfVon(welt, 'a').filter((e) => !ki.heer.has(e.id));
  assert.equal(daheim.length, WACHE, 'zwei bleiben zu Hause');
  const weiteste = Math.max(...daheim.map((e) => Math.hypot(e.x - a.basis.x, e.y - a.basis.y)));
  const naechste = Math.min(...marschierend.map((e) => Math.hypot(e.x - a.basis.x, e.y - a.basis.y)));
  assert.ok(weiteste <= naechste, `die Wache steht naeher an der Basis (${weiteste.toFixed(1)} <= ${naechste.toFixed(1)})`);
});

test('ki AC-11: am Marschziel greift das Heer das Dorfzentrum an', () => {
  const welt = new Welt(ZWEI, 5);
  const ki = new Ki(welt, 'a');
  const b = welt.spielerVon('b');
  const zentrumB = [...welt.gebaeude.values()].find((g) => g.besitzer === 'b' && g.art === 'dorfzentrum');

  // Das Heer steht schon beim Gegner - so wie es nach dem Marsch dasteht.
  const heer = kampfeinheitenAnlegen(welt, 'a', { x: zentrumB.x + HEER_ABSTAND, y: zentrumB.y }, HEER + WACHE);
  ki.heerPruefen(eigeneVon(welt, 'a'));
  assert.equal(ki.angriffe, 1);
  // Jetzt sind sie da und stehen: der Angriffslauf sieht nur Einheiten
  // (welt.wacheTakten), das Dorfzentrum muesste er stehen lassen. Die KI setzt
  // nach - wie ein Mensch, der noch einmal darauf klickt.
  for (const e of heer) {
    e.angriffslauf = null;
    e.auftrag = null;
    e.weg = [];
  }
  ki.heerPruefen(eigeneVon(welt, 'a'));
  const angreifend = [...ki.heer].map((id) => welt.einheiten.get(id))
    .filter((e) => e.auftrag?.art === 'angreifen' && e.auftrag.gebaeude && e.auftrag.ziel === zentrumB.id);
  assert.equal(angreifend.length, HEER, 'alle acht gehen auf das Dorfzentrum');

  // Und sie schlagen es wirklich: nach einer halben Spielminute hat es Schaden.
  const vorher = zentrumB.leben;
  for (let t = 0; t < 30 * TAKTE_PRO_SEKUNDE; t++) welt.takten();
  assert.ok(zentrumB.leben < vorher, `Dorfzentrum ${zentrumB.leben} statt ${vorher} Leben`);
  assert.ok(!b.aus, 'ausgeschieden ist er davon noch nicht');
});

// Gemessen in Runde 85 ueber die Startwerte 1 bis 20, je zwei KIs, 22
// Spielminuten: jede der vierzig KIs brach auf, die erste nach 17,5, die
// letzte nach 19,8 Spielminuten - zehn Kampfeinheiten stehen rund sechs
// Minuten nach dem Aufstieg bereit (ki AC-9: Feudalzeit nach 11 bis 12). Die
// 22 Minuten kommen daher: 19,8 plus Spielraum. Rechenzeit 17 s.
//
// Seit die KI sich wehrt (ki AC-14, Runde 86) kann eine KI, die selbst unter
// Angriff steht, nie auf zehn Kampfeinheiten kommen - im ersten Stand der
// Runde war es Startwert 13, KI 2: kein Angriff, 40 Verteidigungen, weil ihre
// Wache jede halbe Sekunde ein neues Ziel bekam und nie ankam. Seit das Ziel
// haelt, sind es wieder 40 von 40 (Startwert 13, KI 2: 9 Verteidigungen,
// Angriff ab 20,3 min). Trotzdem steht hier keine Quote, sondern der Grund:
// **wer nicht angreift, verteidigt**, und in jeder Partie greift jemand an.
test('ki AC-11: ueber zwanzig Startwerte greift in jeder Partie eine KI an - und wer nicht angreift, verteidigt (ki AC-14)', () => {
  for (let startwert = 1; startwert <= 20; startwert++) {
    const { spieler } = partieSpielen({ startwert, minuten: 22 });
    assert.ok(spieler.some((p) => p.angriffe >= 1), `${startwert}: niemand greift an`);
    for (const p of spieler) {
      assert.ok(p.angriffe >= 1 || p.verteidigungen >= 1,
        `${startwert} ${p.name}: ${p.angriffe} Angriffe, ${p.verteidigungen} Verteidigungen`);
      if (p.angriffe < 1) continue;
      // Nicht vor der Feudalzeit - vorher hat sie keine zehn Kampfeinheiten.
      assert.ok(p.angriffMinute > p.feudalMinute, `${startwert} ${p.name}: Angriff ab ${p.angriffMinute} min, Feudalzeit ab ${p.feudalMinute} min`);
      assert.ok(p.angriffMinute <= 22, `${startwert} ${p.name}: Angriff ab ${p.angriffMinute} min`);
    }
  }
});

// ---- Die Verteidigung zu Hause (ki AC-14) ----------------------------------

const gebaeudeVon = (welt, spielerId) => [...welt.gebaeude.values()].filter((g) => g.besitzer === spielerId);
const zentrumVon = (welt, spielerId) => gebaeudeVon(welt, spielerId).find((g) => g.art === 'dorfzentrum');

/** Der Rechtsklick eines Menschen: auf das Feld, nicht auf die Nummer. */
const rechtsklick = (welt, spielerId, einheiten, auf) => welt.nachricht(spielerId, {
  auftrag: 'befehl', einheiten: einheiten.map((e) => e.id), ziel: { x: auf.x, y: auf.y },
});

const takten = (welt, takte) => { for (let t = 0; t < takte; t++) welt.takten(); };

const taktenBis = (welt, bedingung, grenze) => {
  for (let t = 0; t < grenze; t++) {
    welt.takten();
    if (bedingung()) return t + 1;
  }
  throw new Error('nicht eingetreten in ' + grenze + ' Takten');
};

test('ki AC-14: wird ein Gebaeude angegriffen, zieht die Wache hin und schlaegt den Angreifer', () => {
  const welt = new Welt(ZWEI, 13);
  const ki = new Ki(welt, 'b');
  const b = welt.spielerVon('b');
  const zentrum = zentrumVon(welt, 'b');
  const vollLeben = zentrum.leben;

  // Zwei Wachen, zwanzig Felder vom Dorfzentrum weg - stuenden sie daneben,
  // zeigte der Test nicht, dass sie **hinziehen**.
  const wache = kampfeinheitenAnlegen(welt, 'b', { x: b.basis.x, y: b.basis.y - 20 }, 2);
  for (const e of wache) {
    const d = Math.hypot(e.x - zentrum.x, e.y - zentrum.y);
    assert.ok(d > WACHE_NAH + 10, `die Wache steht weit weg: ${d.toFixed(1)} Felder`);
  }

  // Gegenprobe zuerst: ohne Angriff schickt die KI niemanden. Sonst zeigte der
  // Test nur, dass sie ueberhaupt Befehle gibt.
  const eigene = () => eigeneVon(welt, 'b');
  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'b'), zentrum);
  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'b'), zentrum);
  assert.equal(ki.verteidigungen, 0, 'ohne Angriff zieht niemand');
  assert.ok(wache.every((e) => !e.weg.length), 'und niemand laeuft');

  // Annas Miliz schlaegt auf das Dorfzentrum ein.
  const angreifer = welt.einheitAnlegen('a', zentrum.x + 3, zentrum.y + 3, 'miliz');
  rechtsklick(welt, 'a', [angreifer], zentrum);
  taktenBis(welt, () => zentrum.leben < vollLeben, 600);

  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'b'), zentrum);
  assert.equal(ki.verteidigungen, 1, 'die Wache ist losgeschickt');
  for (const e of wache) {
    assert.ok(e.angriffslauf, 'sie zieht im Angriffslauf');
    assert.ok(e.weg.length, 'und ist unterwegs');
  }

  // Und sie kommt an. Zwei Milizen gegen eine: der Angreifer faellt.
  taktenBis(welt, () => angreifer.tot, 120 * TAKTE_PRO_SEKUNDE);
  for (const e of wache) {
    const d = Math.hypot(e.x - zentrum.x, e.y - zentrum.y);
    assert.ok(d < 12, `die Wache steht beim Dorfzentrum: ${d.toFixed(1)} Felder`);
  }
});

// Runde 86, im Browser gefunden, waehrend die drei Tests darueber gruen waren:
// Dort kam die Wache aus **derselben Richtung** wie der Angreifer, und das
// naechste freie Feld am Angriffsort war das Feld neben ihm. `feindAn` zieht
// einen Feind im Umkreis von 1,01 Feldern unter den Klick (kampf AC-1) - aus
// dem Angriffslauf wurde ein Angriff auf genau diese Einheit. Sie fiel
// unterwegs, der Auftrag war erfuellt, und die Wache stand zwoelf Felder vom
// Dorf still, waehrend der Gegner weiter auf das Dorfzentrum einschlug.
test('ki AC-14: das Marschziel der Wache haelt Abstand von jedem Feind', () => {
  const welt = new Welt(ZWEI, 4711);
  const ki = new Ki(welt, 'b');
  const zentrum = zentrumVon(welt, 'b');
  const eigene = () => eigeneVon(welt, 'b');

  // Wache und Angreifer auf **derselben** Seite des Dorfzentrums: nur so faellt
  // die Wahl des Marschziels ueberhaupt auf das Feld beim Angreifer.
  const wache = [];
  for (const dx of [0, 1]) {
    const x = zentrum.x + 16 + dx;
    const y = zentrum.y + 16;
    assert.ok(karten.begehbar(welt.karte, x, y), `${x},${y} ist begehbar`);
    wache.push(welt.einheitAnlegen('b', x, y, 'miliz'));
  }
  const angreifer = welt.einheitAnlegen('a', zentrum.x + 3, zentrum.y + 3, 'miliz');
  assert.ok(Math.hypot(angreifer.x - wache[0].x, angreifer.y - wache[0].y) > 15,
    'der Angreifer steht weit von der Wache, aber in ihrer Richtung');

  const voll = zentrum.leben;
  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'b'), zentrum);
  rechtsklick(welt, 'a', [angreifer], zentrum);
  taktenBis(welt, () => zentrum.leben < voll, 600);
  // Wo der Angreifer **im Augenblick des Befehls** steht: danach laeuft er
  // weiter, und ein spaeter gemessener Abstand sagt nichts ueber die Wahl.
  const stand = { x: angreifer.x, y: angreifer.y };
  // Die Wahl selbst, ohne die Gruppenaufstellung, und ihre Gegenprobe - beide
  // im Augenblick der Entscheidung: danach laeuft die Wache, und ihr eigenes
  // Ziel zaehlt als belegt. `e.angriffslauf` ist das Feld, das die Aufstellung
  // dieser **einen** Einheit um das Marschziel herum zuteilt (einheiten AC-20)
  // - das darf neben dem Angreifer liegen. Was Abstand halten muss, ist das
  // Marschziel der KI.
  const gewaehlt = ki.freiesFeldUm(zentrum, wache[0], { feindFern: FEIND_FERN });
  const ohne = ki.freiesFeldUm(zentrum, wache[0]);
  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'b'), zentrum);

  assert.equal(ki.verteidigungen, 1, 'die Wache ist losgeschickt');
  for (const e of wache) {
    // Ein Marsch, kein Angriff auf eine einzelne Einheit. Genau hier stand
    // vorher `angreifen` und `angriffslauf: false`.
    assert.equal(e.auftrag?.art, 'gehen', 'sie marschiert');
    assert.ok(e.angriffslauf, 'und zwar im Angriffslauf');
  }
  const abstand = Math.hypot(gewaehlt.x - stand.x, gewaehlt.y - stand.y);
  assert.ok(abstand > FEIND_FERN, `das Marschziel liegt nicht am Angreifer: ${abstand.toFixed(2)} Felder`);
  // Gegenprobe: ohne die Regel waehlt dieselbe Suche ein Nachbarfeld des
  // Angreifers - gerade oder schraeg daneben. Gemessen: 1,00 Felder, seit
  // Annas Miliz am Dorfzentrum keinem Schlachter mehr auf dem Feld steht
  // (Runde 86) 1,41.
  const ohneAbstand = Math.hypot(ohne.x - stand.x, ohne.y - stand.y);
  assert.ok(ohneAbstand <= FEIND_FERN,
    `ohne Abstandsregel liegt das Feld am Angreifer (${ohneAbstand.toFixed(2)} Felder) - sonst zeigt der Test nichts`);

  // Und sie kommt an, auch nachdem der Angreifer gefallen ist: der
  // Angriffslauf greift ihn unterwegs selbst an (kampf AC-8) und geht danach
  // weiter. Gemessen: 22,6 Felder vom Dorfzentrum beim Aufbruch, nach 30 s
  // 3,2 - und mit einem Angriffsbefehl statt des Laufs blieb sie bei 12,9
  // stehen, sobald der Angreifer fiel.
  taktenBis(welt, () => angreifer.tot, 120 * TAKTE_PRO_SEKUNDE);
  takten(welt, 20 * TAKTE_PRO_SEKUNDE);
  for (const e of wache) {
    const d = Math.hypot(e.x - zentrum.x, e.y - zentrum.y);
    assert.ok(d < 8, `die Wache steht beim Dorfzentrum: ${d.toFixed(1)} Felder`);
  }
});

test('ki AC-14: ein getroffener Dorfbewohner laeuft zum Dorfzentrum, statt zurueckzuschlagen', () => {
  const welt = new Welt(ZWEI, 17);
  const ki = new Ki(welt, 'b');
  const zentrum = zentrumVon(welt, 'b');
  const eigene = () => eigeneVon(welt, 'b');

  // Einer von Berts Dorfbewohnern arbeitet weit draussen im Holz - weit, damit
  // die Flucht eine Strecke ist und nicht zwei Schritte.
  const opfer = eigene().find((e) => e.art === 'dorfbewohner');
  const { groesse, felder } = welt.karte;
  let wald = null;
  for (let r = 12; !wald && r < 30; r++) {
    for (let dy = -r; dy <= r && !wald; dy++) {
      for (let dx = -r; dx <= r && !wald; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = Math.round(zentrum.x) + dx;
        const y = Math.round(zentrum.y) + dy;
        if (felder[y * groesse + x] === karten.WALD) wald = { x, y };
      }
    }
  }
  assert.ok(wald, 'Wald mindestens zwoelf Felder vom Dorfzentrum');
  rechtsklick(welt, 'b', [opfer], wald);
  taktenBis(welt, () => opfer.sammelt, 240 * TAKTE_PRO_SEKUNDE);
  const beiDerArbeit = Math.hypot(opfer.x - zentrum.x, opfer.y - zentrum.y);
  assert.ok(beiDerArbeit > 10, `er arbeitet weit vom Dorfzentrum: ${beiDerArbeit.toFixed(1)} Felder`);
  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'b'), zentrum);

  // Annas Miliz schlaegt zu. Die Welt gibt ihm dafuer die Gegenwehr
  // (kampf AC-2) - genau die soll die KI ihm wieder abnehmen.
  const angreifer = welt.einheitAnlegen('a', Math.round(opfer.x) + 1, Math.round(opfer.y), 'miliz');
  rechtsklick(welt, 'a', [angreifer], opfer);
  taktenBis(welt, () => opfer.auftrag?.art === 'angreifen', 60 * TAKTE_PRO_SEKUNDE);
  assert.equal(opfer.sammelt, false, 'gesammelt wird dabei nicht mehr');

  // Damit die Flucht gemessen werden kann und nicht der Tod: der Angreifer
  // laesst von ihm ab - wie ein Mensch, der weiterzieht.
  rechtsklick(welt, 'a', [angreifer], { x: angreifer.x + 10, y: angreifer.y });

  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'b'), zentrum);
  assert.notEqual(opfer.auftrag?.art, 'angreifen', 'die KI nimmt ihm die Gegenwehr');
  assert.ok(opfer.weg.length, 'und schickt ihn weg');
  const vorher = Math.hypot(opfer.x - zentrum.x, opfer.y - zentrum.y);
  takten(welt, 30 * TAKTE_PRO_SEKUNDE);
  const nachher = Math.hypot(opfer.x - zentrum.x, opfer.y - zentrum.y);
  assert.ok(!opfer.tot, 'er lebt noch');
  // Naeher als an das Feld neben dem Dorfzentrum kommt er nicht: das Gebaeude
  // belegt die Mitte. Gemessen: von 11,2 auf 2,8 Felder in 30 Sekunden.
  assert.ok(nachher < vorher - 5, `er laeuft heim: ${vorher.toFixed(1)} auf ${nachher.toFixed(1)} Felder`);
  assert.ok(nachher < 5, `und steht am Dorfzentrum: ${nachher.toFixed(1)} Felder`);
});

test('ki AC-14: Schlaege gegen das marschierende Heer holen die Wache nicht nach Hause', () => {
  const welt = new Welt(ZWEI, 19);
  const ki = new Ki(welt, 'a');
  const a = welt.spielerVon('a');
  const zentrum = zentrumVon(welt, 'a');
  const eigene = () => eigeneVon(welt, 'a');

  kampfeinheitenAnlegen(welt, 'a', a.basis, HEER + WACHE - kampfVon(welt, 'a').length);
  ki.heerPruefen(eigene());
  assert.equal(ki.heer.size, HEER, 'das Heer ist unterwegs');
  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'a'), zentrum);

  // Einem Marschierenden wird Leben abgezogen, als haette ihn jemand
  // getroffen: die KI liest nur den Zustand, ein Schlag sieht fuer sie genau
  // so aus. Das Heer steht in diesem Augenblick weit vom Dorf.
  const marschierend = welt.einheiten.get([...ki.heer][0]);
  marschierend.leben -= 5;
  const wache = kampfVon(welt, 'a').filter((e) => !ki.heer.has(e.id));
  assert.equal(wache.length, WACHE, 'zwei sind zu Hause geblieben');
  const standen = wache.map((e) => ({ x: e.x, y: e.y }));

  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'a'), zentrum);
  assert.equal(ki.verteidigungen, 0, 'das ist kein Angriff auf das Dorf');
  for (const [i, e] of wache.entries()) {
    assert.deepEqual({ x: e.x, y: e.y }, standen[i], 'die Wache steht, wo sie stand');
    assert.ok(!e.angriffslauf, 'und niemand laeuft los');
  }
});

// ---- Wohin die Getroffenen laufen (ki AC-14, Runde 86) ---------------------
//
// Alle drei folgenden Faelle hat das Bild zu ki AC-14 gefunden: `figurenFrei`
// meldete Figuren von Bert auf **0,00 Feldern** - ein Geflohener auf einem
// anderen Geflohenen, ein Geflohener auf der Wache, die Wache auf einem
// Schlachter. Jede Entscheidung waehlte "das naechste freie Feld", ohne zu
// wissen, was sie selbst eben vergeben hatte.

const zielVon = (e) => (e.weg.length ? e.weg[e.weg.length - 1] : null);

test('ki AC-14: zwei nacheinander Getroffene fliehen auf verschiedene Felder', () => {
  const welt = new Welt(ZWEI, 4711);
  const ki = new Ki(welt, 'b');
  const zentrum = zentrumVon(welt, 'b');
  const eigene = () => eigeneVon(welt, 'b');
  const erster = welt.einheitAnlegen('b', zentrum.x + 10, zentrum.y + 6, 'dorfbewohner');
  const zweiter = welt.einheitAnlegen('b', zentrum.x + 11, zentrum.y + 6, 'dorfbewohner');
  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'b'), zentrum);

  // Der erste wird getroffen und flieht. Die KI sieht nur fehlendes Leben -
  // woher es fehlt, ist fuer sie gleich, deshalb hier ohne Angreifer.
  erster.leben -= 2;
  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'b'), zentrum);
  const fluchtErster = zielVon(erster);
  assert.ok(fluchtErster, 'der erste flieht');

  // Eine halbe Sekunde spaeter der zweite. Gegenprobe vorher: ohne den Weg des
  // ersten waere sein Feld wieder "frei". Gemessen: beide 62/104.
  welt.takten();
  zweiter.leben -= 2;
  const weg = erster.weg;
  erster.weg = [];
  const ohne = ki.freiesFeldUm(zentrum, { x: zweiter.x, y: zweiter.y }, { feindFern: FEIND_FERN });
  erster.weg = weg;
  assert.deepEqual(ohne, fluchtErster, 'ohne die Regel bekaeme der zweite dasselbe Feld - sonst zeigt der Test nichts');

  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'b'), zentrum);
  const fluchtZweiter = zielVon(zweiter);
  assert.ok(fluchtZweiter, 'der zweite flieht auch');
  assert.notDeepEqual(fluchtZweiter, fluchtErster, 'aber auf ein anderes Feld');
});

test('ki AC-14: das Ziel einer Gruppe hat freie Nachbarfelder', () => {
  const welt = new Welt(ZWEI, 4711);
  const ki = new Ki(welt, 'b');
  const zentrum = zentrumVon(welt, 'b');
  const von = { x: zentrum.x + 16, y: zentrum.y + 16 };
  // Ein Dorfbewohner steht neben dem Feld, das eine einzelne Wache bekaeme.
  const allein = ki.freiesFeldUm(zentrum, von, { feindFern: FEIND_FERN });
  welt.einheitAnlegen('b', allein.x + 1, allein.y, 'dorfbewohner');
  const ohne = ki.freiesFeldUm(zentrum, von, { feindFern: FEIND_FERN });
  const nachbar = (f) => [...welt.einheiten.values()]
    .some((e) => Math.max(Math.abs(Math.round(e.x) - f.x), Math.abs(Math.round(e.y) - f.y)) === 1);
  // Gegenprobe: fuer einen allein ist das Feld neben dem Stehenden recht.
  assert.ok(nachbar(ohne), 'ohne die Regel liegt das Ziel neben dem Stehenden - sonst zeigt der Test nichts');
  // Fuer eine Gruppe nicht: der Server stellt sie einen Ring um ihr Ziel auf
  // (einheiten AC-20), und einer stuende danach auf dem Dorfbewohner.
  const gruppe = ki.freiesFeldUm(zentrum, von, { feindFern: FEIND_FERN, rundumFrei: true });
  assert.ok(!nachbar(gruppe), `das Gruppenziel ${gruppe.x}/${gruppe.y} hat freie Nachbarfelder`);
});

test('ki AC-14: Wache und Gefluechtete derselben Entscheidung bekommen getrennte Ziele', () => {
  const welt = new Welt(ZWEI, 4711);
  const ki = new Ki(welt, 'b');
  const zentrum = zentrumVon(welt, 'b');
  const eigene = () => eigeneVon(welt, 'b');
  // Der Spaeherreiter der Startaufstellung steht am Dorfzentrum und zoege mit;
  // dann waere die Wache eine Gruppe mit anderem Ziel. Hier geht es um genau
  // eine Wache und einen Dorfbewohner.
  for (const e of eigene()) if (e.art === 'spaeherreiter') welt.einheiten.delete(e.id);
  const wache = welt.einheitAnlegen('b', zentrum.x + 16, zentrum.y + 16, 'miliz');
  const dorf = welt.einheitAnlegen('b', zentrum.x + 4, zentrum.y + 3, 'dorfbewohner');
  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'b'), zentrum);

  // Dorfzentrum und Dorfbewohner verlieren in derselben halben Sekunde Leben.
  zentrum.leben -= 5;
  dorf.leben -= 2;
  // Gegenprobe vorher, gemessen: beide suchten 62/104.
  const fuerWache = ki.freiesFeldUm(zentrum, wache, { feindFern: FEIND_FERN });
  const fuerDorf = ki.freiesFeldUm(zentrum, dorf, { feindFern: FEIND_FERN });
  assert.ok(Math.hypot(fuerWache.x - fuerDorf.x, fuerWache.y - fuerDorf.y) <= VERGEBEN_ABSTAND,
    'ohne die Regel laegen beide Ziele beieinander - sonst zeigt der Test nichts');

  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'b'), zentrum);
  const w = zielVon(wache);
  const d = zielVon(dorf);
  assert.ok(w && d, 'beide sind unterwegs');
  const abstand = Math.hypot(w.x - d.x, w.y - d.y);
  assert.ok(abstand > VERGEBEN_ABSTAND, `die Ziele liegen ${abstand.toFixed(2)} Felder auseinander`);
});

// Gefunden in der Durchsicht der Runde 86 (ein Pruefer ohne Kenntnis meiner
// Schluesse): seit die Ziele eigener Laeufer als belegt gelten, sperrte eine
// Wache, die schon unterwegs ist, beim naechsten Treffer ihr eigenes Ziel.
test('ki AC-14: bei jedem weiteren Treffer behaelt die Wache ihr Ziel', () => {
  const welt = new Welt(ZWEI, 4711);
  const ki = new Ki(welt, 'b');
  const zentrum = zentrumVon(welt, 'b');
  const eigene = () => eigeneVon(welt, 'b');
  // Ohne den Spaeherreiter der Startaufstellung: er stuende als Erster der
  // Gruppe am Dorfzentrum, und die Suche ginge von ihm aus statt von der Wache.
  for (const e of eigene()) if (e.art === 'spaeherreiter') welt.einheiten.delete(e.id);
  const wache = [0, 1].map((dx) => welt.einheitAnlegen('b', zentrum.x + 16 + dx, zentrum.y + 16, 'miliz'));
  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'b'), zentrum);

  zentrum.leben -= 5;
  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'b'), zentrum);
  const ziele = () => wache.map((e) => JSON.stringify(e.angriffslauf));
  const erstes = ziele();
  assert.ok(wache.every((e) => e.angriffslauf), 'die Wache ist unterwegs');

  // Gegenprobe: zaehlte ihr eigener Weg als belegt, suchte die KI jetzt ein
  // anderes Feld.
  takten(welt, ENTSCHEIDEN_ALLE);
  const mitEigenem = ki.freiesFeldUm(zentrum, wache[0], { feindFern: FEIND_FERN, rundumFrei: true });
  const ohneEigenen = ki.freiesFeldUm(zentrum, wache[0],
    { feindFern: FEIND_FERN, rundumFrei: true, ausser: new Set(wache.map((e) => e.id)) });
  assert.notDeepEqual(mitEigenem, ohneEigenen, 'ohne die Regel spraenge das Ziel - sonst zeigt der Test nichts');

  // Noch zwei Treffer, je eine halbe Sekunde auseinander.
  for (let n = 0; n < 2; n++) {
    zentrum.leben -= 5;
    ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'b'), zentrum);
    assert.deepEqual(ziele(), erstes, `nach dem ${n + 2}. Treffer dasselbe Ziel`);
    takten(welt, ENTSCHEIDEN_ALLE);
  }
});

test('ki AC-14: steht das Dorf voll, zieht die Wache trotzdem', () => {
  const welt = new Welt(ZWEI, 4711);
  const ki = new Ki(welt, 'b');
  const zentrum = zentrumVon(welt, 'b');
  const eigene = () => eigeneVon(welt, 'b');
  // Jedes zweite Feld um das Dorfzentrum ist besetzt: dann hat kein freies
  // Feld acht freie Nachbarn, und die Suche fuer eine Gruppe findet nichts.
  for (let dy = -9; dy <= 9; dy++) {
    for (let dx = -9; dx <= 9; dx++) {
      const x = zentrum.x + dx;
      const y = zentrum.y + dy;
      if ((x + y) % 2 || !karten.begehbar(welt.karte, x, y) || welt.gebaeudeAn(x, y)) continue;
      welt.einheitAnlegen('b', x, y, 'dorfbewohner');
    }
  }
  const wache = [0, 1].map((dx) => welt.einheitAnlegen('b', zentrum.x + 20 + dx, zentrum.y + 14, 'miliz'));
  assert.equal(ki.freiesFeldUm(zentrum, wache[0], { feindFern: FEIND_FERN, rundumFrei: true }), null,
    'mit freien Nachbarfeldern findet sich nichts - sonst zeigt der Test nichts');

  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'b'), zentrum);
  zentrum.leben -= 5;
  ki.verteidigenPruefen(eigene(), gebaeudeVon(welt, 'b'), zentrum);
  assert.equal(ki.verteidigungen, 1, 'die Wache ist trotzdem losgeschickt');
  assert.ok(wache.every((e) => e.angriffslauf && e.weg.length), 'und unterwegs');
});

// Runde 89: dieselbe Ruecklage wie vor der Farm (Runde 69) gilt vor jedem
// Lager. Beim Startwert 4 baute die KI in der Feudalzeit erst ein
// Holzfaellerlager und eine Muehle, und die Schiessanlage kam 2,3 Minuten
// spaeter.
test('ki AC-9: nach dem Aufstieg kommt das Militaergebaeude vor dem naechsten Lager', () => {
  const lagerBestellt = (zeitalter, holz) => {
    const welt = new Welt(ZWEI, 4);
    const ki = new Ki(welt, 'a');
    const a = welt.spielerVon('a');
    // Vier Holzfaeller an einem Wald, weit weg von jedem Lager.
    const wald = ki.naechstesFeld({ x: a.basis.x + 14, y: a.basis.y + 14 }, [karten.WALD]);
    assert.ok(Math.hypot(wald.x - a.basis.x, wald.y - a.basis.y) > 8, 'der Wald liegt weit weg');
    const faeller = [0, 1, 2, 3].map(() => welt.einheitAnlegen('a', wald.x, wald.y + 1, 'dorfbewohner'));
    for (const e of faeller) welt.nachricht('a', { auftrag: 'befehl', einheiten: [e.id], ziel: wald });
    a.zeitalter = zeitalter;
    a.holz = holz;
    const gesendet = [];
    ki.senden = (n) => { gesendet.push(n); return {}; };
    const gebaeude = [...welt.gebaeude.values()].filter((g) => g.besitzer === 'a');
    const dorf = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
    ki.lagerPruefen('holz', { holz: faeller.length }, gebaeude, dorf);
    return gesendet.some((n) => n.auftrag === 'bauen' && n.art === 'holzfaellerlager');
  };
  // Gegenprobe zuerst: in der Dunklen Zeit baut sie das Lager.
  assert.ok(lagerBestellt(0, 200), 'in der Dunklen Zeit baut sie das Lager');
  // In der Feudalzeit ohne Militaergebaeude haelt sie das Holz zurueck ...
  assert.ok(!lagerBestellt(1, 200), 'in der Feudalzeit wartet das Lager auf die Schiessanlage');
  // ... ausser es reicht fuer beides.
  assert.ok(lagerBestellt(1, MILITAER_HOLZ + 100), 'reicht das Holz fuer beides, baut sie es');
});

// ---- Nachschub (ki AC-12, Runde 90) -----------------------------------------
//
// Gemessen in Runde 90 ueber die Startwerte 1 bis 20, je zwei KIs, 30
// Spielminuten: 4 bis 9 Angriffe je KI, im Median 14 Kampfeinheiten; vor der
// Runde im Median 6 - die KI hatte ein Militaergebaeude, verteilte nach dem
// Aufstieg nicht um und schickte Untaetige an unerreichbare Beeren.
//
// Bei Minute 30 hatten 37 KIs 20 bis 22 Dorfbewohner samt Ausbildung. Drei
// hatten 11 bis 18 - alle drei in dem Augenblick ueberrannt, 9 bis 23 Feinde
// im Dorf gegen zwei bis drei eigene Kampfeinheiten, und alle drei hatten
// zwischen Minute 20 und 30 ihre 22. Fuenf weitere wurden gerade angegriffen
// und hielten trotzdem 21 bis 22. Die Klausel prueft, dass die KI ihre
// Wirtschaft nicht fuer das Heer opfert - nicht, dass keine KI einen Krieg
// verliert: dass Partien entschieden werden, ist der Sinn des Nachschubs
// (fahrplan AC-11). Wer unter 20 liegt, muss deshalb gerade ueberrannt
// werden und vorher die 20 gehabt haben. Rechenzeit rund 12 s.
// ki AC-10 haengt an denselben Partien: bis Minute 30 steht kein Dorfbewohner
// laenger als 20 Sekunden still. Gemessen in Runde 91: hoechstens 12,9 s.
// Vor Runde 90 bis 655 s (Untaetige an unerreichbaren Beeren), vor Runde 91
// noch 39 und 53 s (Holzfaeller mit voller Ladung, deren naechstes Lager nur
// ueber einen zugewachsenen Rand zu erreichen war).
test('ki AC-12 und ki AC-10: ueber zwanzig Startwerte greift jede KI wieder an, bei Minute 30 hat sie 20 Dorfbewohner, und keiner steht laenger als 20 Sekunden', () => {
  let ueberrannt = 0;
  for (let startwert = 1; startwert <= 20; startwert++) {
    const hoechste = new Map();
    // Wann welcher Dorfbewohner gefallen ist - je Spieler die Takte.
    const gefallen = new Map();
    const { spieler } = partieSpielen({
      startwert,
      minuten: 30,
      eingriff: (welt) => {
        if (!welt.gefallenGezaehlt) {
          welt.gefallenGezaehlt = true;
          const sterben = welt.einheitSterben.bind(welt);
          welt.einheitSterben = (e) => {
            if (e.art === 'dorfbewohner' && !e.tot) {
              const name = welt.spielerVon(e.besitzer).name;
              if (!gefallen.has(name)) gefallen.set(name, []);
              gefallen.get(name).push(welt.takt);
            }
            sterben(e);
          };
        }
        if (welt.takt < 20 * 60 * TAKTE_PRO_SEKUNDE) return;
        for (const s of welt.spieler) {
          const n = [...welt.einheiten.values()].filter((e) => e.besitzer === s.id && e.art === 'dorfbewohner' && !e.tot).length;
          hoechste.set(s.name, Math.max(hoechste.get(s.name) || 0, n));
        }
      },
    });
    for (const p of spieler) {
      // Nachschub: nach dem ersten Heer noch eines.
      assert.ok(p.angriffe >= 2, `${startwert} ${p.name}: ${p.angriffe} Angriffe`);
      // Auch spaet steht niemand herum (ki AC-10).
      assert.ok(p.untaetigMax <= 20, `${startwert} ${p.name}: ${p.untaetigMax} s untaetig`);
      assert.ok(hoechste.get(p.name) >= 20, `${startwert} ${p.name}: nach Minute 20 hoechstens ${hoechste.get(p.name)} Dorfbewohner`);
      // Die Wirtschaft laeuft weiter. Wer bezahlt in der Ausbildung steht,
      // zaehlt mit: faellt der Messpunkt in einen Ueberfall, ersetzt das
      // Dorfzentrum die Gefallenen schon.
      const dorf = p.dorfbewohner + p.dorfbewohnerInAusbildung;
      if (dorf >= 20) continue;
      // Ueberrannt: gerade jetzt mehr Feinde am Dorf als eigene Kampfeinheiten,
      // oder der Fehlbetrag erklaert sich durch Gefallene, die das Dorfzentrum
      // noch nicht ersetzen konnte - in fuenf Minuten bildet es zwoelf aus (25 s
      // je Dorfbewohner). Startwert 6, KI 2: 27 Gefallene zwischen Minute 24 und
      // 28, bei Minute 30 der Angriff abgewehrt - die Wirtschaft war
      // zerschlagen, nicht vernachlaessigt (Runde 91).
      const zuletzt = (gefallen.get(p.name) || []).filter((t) => t >= 25 * 60 * TAKTE_PRO_SEKUNDE).length;
      assert.ok(p.feindeAmDorf > p.kampf || zuletzt >= 20 - dorf,
        `${startwert} ${p.name}: ${p.dorfbewohner} Dorfbewohner, ${p.dorfbewohnerInAusbildung} in Ausbildung - und nicht ueberrannt (${p.feindeAmDorf} Feinde, ${p.kampf} eigene Kampfeinheiten, ${zuletzt} Gefallene in fuenf Minuten)`);
      ueberrannt += 1;
    }
  }
  // Gegenprobe: die Ausnahme bleibt eine Ausnahme - hoechstens ein Viertel.
  // Sonst pruefte der Test nur noch, dass Kriege verloren werden.
  assert.ok(ueberrannt <= 10, `${ueberrannt} von 40 KIs unter 20, weil ueberrannt`);
});

const dorfVon = (welt, id) => [...welt.einheiten.values()].filter((e) => e.besitzer === id && e.art === 'dorfbewohner');

test('ki AC-12: nach dem Aufstieg geht ein Sammler vom Ueberfluss zum Mangel - hoechstens einer je zehn Sekunden', () => {
  const lauf = (zeitalter) => {
    const welt = new Welt(ZWEI, 4711);
    const ki = new Ki(welt, 'a');
    const a = welt.spielerVon('a');
    for (const e of dorfVon(welt, 'a')) ki.schicken(e, 'nahrung', dorfVon(welt, 'a'));
    // Umverteilt wird, wer arbeitet, nicht wer gerade laeuft - also erst ankommen.
    takten(welt, 30 * TAKTE_PRO_SEKUNDE);
    assert.ok(dorfVon(welt, 'a').some((e) => !e.weg.length && ki.rolle(e) === 'nahrung'), 'sie sammeln Nahrung');
    a.zeitalter = zeitalter;
    a.nahrung = UEBERSCHUSS + 400;
    a.holz = MANGEL - 100;
    a.gold = MANGEL + 100;
    ki.umverteilen(dorfVon(welt, 'a'));
    const nachEinem = ki.rollen(dorfVon(welt, 'a'));
    ki.umverteilen(dorfVon(welt, 'a'));
    return { nachEinem, nachZwei: ki.rollen(dorfVon(welt, 'a')), ki };
  };
  // Gegenprobe: in der Dunklen Zeit gilt der feste Plan.
  const dunkel = lauf(0);
  assert.equal(dunkel.nachEinem.holz || 0, 0, 'in der Dunklen Zeit zieht niemand um');
  const feudal = lauf(1);
  assert.equal(feudal.nachEinem.holz, 1, 'einer geht zum Holz');
  assert.equal(feudal.nachZwei.holz, 1, 'und in derselben halben Sekunde nicht noch einer');
  assert.equal(feudal.ki.umverteilt, 1);
});

test('ki AC-12: sind alle Militaergebaeude beschaeftigt und ist Holz uebrig, baut die KI ein weiteres', () => {
  const bestellt = (schlange, holz) => {
    const welt = new Welt(ZWEI, 4711);
    const ki = new Ki(welt, 'a');
    const a = welt.spielerVon('a');
    a.zeitalter = 1;
    const platz = ki.platzBeiBasis('schiessanlage');
    const anlage = welt.gebaeudeAnlegen('a', 'schiessanlage', platz.x, platz.y, true);
    anlage.schlange = Array(schlange).fill('bogenschuetze');
    a.holz = holz;
    a.gold = 0;
    a.nahrung = 0;
    const gesendet = [];
    ki.senden = (n) => { gesendet.push(n); return {}; };
    ki.militaerPruefen([...welt.gebaeude.values()].filter((g) => g.besitzer === 'a'), dorfVon(welt, 'a'));
    return gesendet.some((n) => n.auftrag === 'bauen' && MILITAER.includes(n.art));
  };
  // Gegenprobe: ist die Schlange nicht voll, reicht das eine.
  assert.ok(!bestellt(1, 1000), 'mit Platz in der Schlange kein zweites');
  assert.ok(!bestellt(2, 100), 'ohne Holz kein zweites');
  assert.ok(bestellt(2, 1000), 'voll beschaeftigt und Holz da: ein zweites');
});

test('ki AC-12: fehlen Dorfbewohner, gibt das Militaer Nahrung nur aus, wenn danach noch einer bezahlt ist', () => {
  const ausgebildet = (dorfbewohner, nahrung) => {
    const welt = new Welt(ZWEI, 4711);
    const ki = new Ki(welt, 'a');
    const a = welt.spielerVon('a');
    a.zeitalter = 1;
    const basis = a.basis;
    while (dorfVon(welt, 'a').length < dorfbewohner) welt.einheitAnlegen('a', basis.x + 6, basis.y + 6, 'dorfbewohner');
    const platz = ki.platzBeiBasis('stall');
    welt.gebaeudeAnlegen('a', 'stall', platz.x, platz.y, true);
    a.nahrung = nahrung;
    a.holz = 0;
    const gesendet = [];
    ki.senden = (n) => { gesendet.push(n); return {}; };
    ki.militaerPruefen([...welt.gebaeude.values()].filter((g) => g.besitzer === 'a'), dorfVon(welt, 'a'));
    return gesendet.some((n) => n.auftrag === 'ausbilden');
  };
  const reiter = EINHEITEN.spaeherreiter.kosten.nahrung;
  const dorf = EINHEITEN.dorfbewohner.kosten.nahrung;
  assert.ok(!ausgebildet(3, reiter + dorf - 1), 'drei Dorfbewohner: der Reiter wartet, solange danach keiner bezahlt waere');
  assert.ok(ausgebildet(3, reiter + dorf), 'reicht es fuer beide, kommt der Reiter');
  // Gegenprobe: mit vollem Dorf keine Ruecklage.
  assert.ok(ausgebildet(ZIEL_DORFBEWOHNER, reiter), 'mit vollem Dorf reicht der Preis des Reiters');
});

test('ki AC-12: fuehrt kein Weg zum Vorrat, geht der Dorfbewohner zur naechsten Moeglichkeit', () => {
  // Beim Startwert 14 schickte die KI ab Minute 20 jeden Untaetigen an einen
  // Beerenbusch, zu dem kein Weg fuehrte, und die Nahrung stand sechs Minuten
  // bei 10 - die freie Farm daneben kam nie an die Reihe (Runde 90).
  const welt = new Welt(ZWEI, 4711);
  const ki = new Ki(welt, 'a');
  const a = welt.spielerVon('a');
  const g = welt.karte.groesse;
  welt.tiere.clear();
  const [erster, zweiter] = dorfVon(welt, 'a');
  // Das naechste Beerenfeld rundum einmauern: Wald auf jedes begehbare Nachbarfeld.
  const beere = ki.naechstesFeld(erster, [karten.BEERE]);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const i = (beere.y + dy) * g + beere.x + dx;
      if ((dx || dy) && karten.begehbar(welt.karte, beere.x + dx, beere.y + dy)) welt.karte.felder[i] = karten.WALD;
    }
  }
  const platz = ki.platzBeiBasis('farm');
  const farm = welt.gebaeudeAnlegen('a', 'farm', platz.x, platz.y, true);
  // Gegenprobe: zu diesem Busch fuehrt kein Weg - wer allein dorthin soll,
  // bleibt stehen.
  ki.befehl(zweiter, beere);
  assert.ok(!ki.unterwegs(zweiter), 'zum eingemauerten Busch kommt niemand');
  // Die KI versucht den Busch, merkt es und nimmt die Farm.
  assert.ok(ki.schicken(erster, 'nahrung', dorfVon(welt, 'a')), 'geschickt');
  assert.ok(ki.unterwegs(erster), 'und unterwegs');
  assert.equal(erster.auftrag?.art === 'farm' || farm.arbeiter === erster.id || erster.weg.length > 0, true, 'zur Farm');
  assert.ok(ki.gesperrt(beere.y * g + beere.x), 'den Busch schlaegt sie nicht wieder vor');
  assert.notDeepEqual(ki.naechstesFeld(erster, [karten.BEERE]), beere, 'naechstesFeld laesst ihn aus');
  // Die Sperre laeuft ab - ein Weg kann kurz zugestellt gewesen sein
  // (Durchsicht Runde 90).
  takten(welt, UNERREICHBAR_SEKUNDEN * TAKTE_PRO_SEKUNDE);
  assert.ok(!ki.gesperrt(beere.y * g + beere.x), 'nach zwei Minuten versucht sie es wieder');
});

test('ki AC-12: auch ein gescheiterter Umverteilungsversuch sperrt zehn Sekunden', () => {
  // Durchsicht Runde 90: der Befehl nimmt dem Sammler seine Arbeit, auch wenn
  // zum neuen Vorrat kein Weg fuehrt. Ohne Sperre risse die naechste halbe
  // Sekunde den naechsten heraus.
  const welt = new Welt(ZWEI, 4711);
  const ki = new Ki(welt, 'a');
  const a = welt.spielerVon('a');
  for (const e of dorfVon(welt, 'a')) ki.schicken(e, 'nahrung', dorfVon(welt, 'a'));
  takten(welt, 30 * TAKTE_PRO_SEKUNDE);
  a.zeitalter = 1;
  a.nahrung = UEBERSCHUSS + 400;
  a.gold = MANGEL - 100;
  a.holz = MANGEL + 100;
  // Kein Gold, zu dem ein Weg fuehrt: jedes Goldfeld ist gemerkt.
  for (const index of welt.karte.vorrat.keys()) {
    if (welt.karte.felder[index] === karten.GOLD) ki.unerreichbar.set(index, welt.takt);
  }
  let versuche = 0;
  ki.schicken = () => { versuche += 1; return false; };
  for (let n = 0; n < 4; n++) {
    ki.umverteilen(dorfVon(welt, 'a'));
    takten(welt, ENTSCHEIDEN_ALLE);
  }
  assert.equal(versuche, 1, 'in zwei Sekunden ein Versuch, nicht vier');
});

test('ki AC-12: fehlt nach dem Aufstieg Nahrung und ist keine Farm frei, baut die KI eine', () => {
  // Beim Startwert 11 hungerte KI 1 ab Minute 22 neben 640 Gold: Schafe und
  // Beeren voll, alle Farmen besetzt, und der feste Plan wollte keine weitere
  // (Runde 90).
  const farmBestellt = (zeitalter, nahrung) => {
    const welt = new Welt(ZWEI, 4711);
    const ki = new Ki(welt, 'a');
    const a = welt.spielerVon('a');
    a.zeitalter = zeitalter;
    a.nahrung = nahrung;
    a.holz = 1000;
    // Ein Militaergebaeude steht, sonst haelt die Ruecklage das Holz zurueck.
    const platz = ki.platzBeiBasis('schiessanlage');
    welt.gebaeudeAnlegen('a', 'schiessanlage', platz.x, platz.y, true);
    const gesendet = [];
    ki.senden = (n) => { gesendet.push(n); return {}; };
    const dorf = dorfVon(welt, 'a');
    // Zu Beginn tragen Schafe und Beeren den Plan: keine Farm noetig.
    ki.farmenPruefen(ki.rollen(dorf), [...welt.gebaeude.values()].filter((g) => g.besitzer === 'a'), dorf);
    return gesendet.some((n) => n.auftrag === 'bauen' && n.art === 'farm');
  };
  // Gegenprobe: in der Dunklen Zeit gilt der Plan, und er will keine.
  assert.ok(!farmBestellt(0, 50), 'in der Dunklen Zeit keine Farm ueber den Plan hinaus');
  assert.ok(!farmBestellt(1, MANGEL + 100), 'mit genug Nahrung keine');
  assert.ok(farmBestellt(1, 50), 'nach dem Aufstieg, hungrig und ohne freie Farm: eine Farm');
});

test('ki AC-10: fuehrt kein Weg zum naechsten Rand des Lagers, liefert der Holzfaeller anderswo ab', () => {
  // Runde 91: die KI stellte ein Holzfaellerlager in eine Waldluecke, und das
  // Randfeld zum Holzfaeller hin war rundum zugewachsen. Drei Holzfaeller
  // standen beim Startwert 17 mit voller Ladung 45 bis 53 Sekunden am Wald.
  const welt = new Welt(ZWEI, 4711);
  const g = welt.karte.groesse;
  const ki = new Ki(welt, 'a');
  const platz = ki.platzBeiBasis('holzfaellerlager');
  const lager = welt.gebaeudeAnlegen('a', 'holzfaellerlager', platz.x, platz.y, true);
  // Ein Randfeld nordwestlich des Lagers, rundum Wald ausser zum Lager hin.
  const { x0, y0 } = welt.grundflaeche('holzfaellerlager', lager.x, lager.y);
  const tasche = { x: Math.floor(x0) - 1, y: Math.floor(y0) - 1 };
  for (let dy = -2; dy <= 1; dy++) {
    for (let dx = -2; dx <= 1; dx++) {
      const x = tasche.x + dx;
      const y = tasche.y + dy;
      if ((x === tasche.x && y === tasche.y) || welt.gebaeudeAn(x, y)) continue;
      welt.karte.felder[y * g + x] = karten.WALD;
    }
  }
  // Der Holzfaeller steht jenseits des Waldriegels, mit voller Ladung.
  const faeller = welt.einheitAnlegen('a', tasche.x - 3, tasche.y - 3, 'dorfbewohner');
  faeller.ladung = 10;
  faeller.ladungsart = 'holz';
  // Gegenprobe: das naechste Randfeld ist die Tasche, und zu ihr fuehrt kein Weg.
  const naechstes = welt.randfeld(lager, faeller);
  assert.deepEqual(naechstes, tasche, 'das naechste Randfeld ist die Tasche');
  assert.equal(suchen(welt.karte, welt.feldVon(faeller), naechstes).length, 0, 'zu ihr fuehrt kein Weg');
  welt.wegZumLager(faeller);
  assert.ok(faeller.weg.length, 'er findet einen anderen Weg');
  const ziel = faeller.weg[faeller.weg.length - 1];
  const dorthin = welt.lagerFuer(faeller);
  assert.ok(welt.abstandZu(ziel, dorthin) <= 1.2 || [...welt.gebaeude.values()].some((b) => b.besitzer === 'a' && welt.abstandZu(ziel, b) <= 1.2),
    'und steht am Ende an einem Lager');
});

test('ki AC-10: wer kein Lager erreicht, sucht nicht in jedem Takt - 30 Holzfaeller vor abgeschnittenem Lager kosten im Mittel unter 10 ms je Takt', () => {
  // Durchsicht Runde 91: eine vergebliche Wegsuche durchflutet das ganze
  // erreichbare Gebiet, und wer festsitzt, suchte in jedem Takt neu. Gemessen:
  // 47 ms je Takt im Mittel, schon vor Runde 91; mit gestreuter Pause von
  // fuenf Sekunden 1,2 ms, Spitze 6,9 ms. Die Grenze ist das Budget eines
  // Taktes aus fahrplan AC-6, nicht die Messung.
  const welt = new Welt(ZWEI, 4711);
  const g = welt.karte.groesse;
  // Jedes Gebaeude von Anna hinter eine Mauer aus Wald, der Ring direkt am
  // Gebaeude bleibt frei - so gibt es Randfelder, aber keinen Weg dorthin.
  for (const geb of welt.gebaeude.values()) {
    if (geb.besitzer !== 'a') continue;
    const { x0, y0, x1, y1 } = welt.grundflaeche(geb.art, geb.x, geb.y);
    for (let y = y0 - 3; y <= y1 + 3; y++) {
      for (let x = x0 - 3; x <= x1 + 3; x++) {
        if (x >= x0 - 1 && x <= x1 + 1 && y >= y0 - 1 && y <= y1 + 1) continue;
        welt.karte.felder[y * g + x] = karten.WALD;
      }
    }
  }
  const b = welt.spielerVon('b').basis;
  const faeller = [];
  for (let i = 0; i < 30; i++) {
    const e = welt.einheitAnlegen('a', b.x + 10 + (i % 6), b.y - 10 - Math.floor(i / 6), 'dorfbewohner');
    e.ladung = 10;
    e.ladungsart = 'holz';
    e.auftrag = { art: 'sammeln', feld: { x: e.x + 1, y: e.y } };
    faeller.push(e);
  }
  takten(welt, 20);
  // Gegenprobe: sie erreichen wirklich kein Lager.
  assert.ok(faeller.every((e) => !e.weg.length && e.ladung === 10), 'alle stehen mit voller Ladung');
  const t0 = performance.now();
  takten(welt, 300);
  const mittel = (performance.now() - t0) / 300;
  assert.ok(mittel < 10, `${mittel.toFixed(2)} ms je Takt im Mittel`);
});
