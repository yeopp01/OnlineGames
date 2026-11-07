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
  Ki, ENTSCHEIDEN_ALLE, ZIEL_DORFBEWOHNER, FEUDALZEIT_NAHRUNG, AN_SCHAFEN, AN_BEEREN, MILITAER, HEER, WACHE, HEER_ABSTAND, plan,
} = require('../server/spiele/strategie/ki.js');
const { TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, SAMMELN } = require('../server/spiele/strategie/daten.js');
const { partieSpielen, pruefen, Widerspruch } = require('../server/spiele/strategie/pruefstand.js');

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
        const r = e.auftrag?.art === 'tier' || e.auftrag?.art === 'farm' ? 'nahrung'
          : e.auftrag?.art === 'sammeln' ? SAMMELN[welt.karte.felder[e.auftrag.feld.y * welt.karte.groesse + e.auftrag.feld.x]]?.rohstoff : 'sonst';
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
test('ki AC-11: ueber zwanzig Startwerte bricht jede KI mindestens einmal zum Gegner auf', () => {
  for (let startwert = 1; startwert <= 20; startwert++) {
    const { spieler } = partieSpielen({ startwert, minuten: 22 });
    for (const p of spieler) {
      assert.ok(p.angriffe >= 1, `${startwert} ${p.name}: ${p.angriffe} Angriffe`);
      // Nicht vor der Feudalzeit - vorher hat sie keine zehn Kampfeinheiten.
      assert.ok(p.angriffMinute > p.feudalMinute, `${startwert} ${p.name}: Angriff ab ${p.angriffMinute} min, Feudalzeit ab ${p.feudalMinute} min`);
      assert.ok(p.angriffMinute <= 22, `${startwert} ${p.name}: Angriff ab ${p.angriffMinute} min`);
    }
  }
});
