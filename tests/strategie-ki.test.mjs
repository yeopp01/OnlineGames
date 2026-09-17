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
  Ki, ENTSCHEIDEN_ALLE, ZIEL_DORFBEWOHNER, FEUDALZEIT_NAHRUNG, AN_SCHAFEN, AN_BEEREN, plan,
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
    const { spieler } = partieSpielen({ startwert, minuten: 10 });
    for (const p of spieler) {
      assert.ok(p.dorfbewohner >= 20 && p.dorfbewohner <= 30, `${startwert} ${p.name}: ${p.dorfbewohner} Dorfbewohner`);
      assert.ok(p.nahrung >= FEUDALZEIT_NAHRUNG, `${startwert} ${p.name}: ${p.nahrung} Nahrung`);
    }
  }
});
