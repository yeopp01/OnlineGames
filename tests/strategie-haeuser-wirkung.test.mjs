// Jeder Bonus wirkt (→ specs/10-strategie/spielziel.md AC-26, ADR-0014).
//
// `tests/strategie-haeuser.test.mjs` fragt die Lesestellen (spielziel
// AC-17): `einheitenwert`, `sammelrate`, `farmNahrung`. Hier wird gespielt:
// je Bonus jedes Hauses dieselbe Lage zweimal, einmal hat Anna das Haus,
// einmal keins, und gemessen wird, was im Spiel geschieht - wie lange die
// Arbeit am Baum dauert, mit wie viel Leben eine Einheit aus dem Stall kommt,
// von wie weit der erste Pfeil fliegt, wie viel ein Schlag nimmt, wie viel
// Gold ein Verkauf und eine Fahrt bringen.
//
// Die Boni kommen aus den Daten, nicht aus einer Liste im Testkopf. Fuer
// jede Form und jeden Wert gibt es eine Messung; ein Bonus, fuer den es keine
// gibt, bricht den Test - so kommt ein neuer Bonus nicht ungemessen herein.
// Die Ausbildungszeit ist ein Mannschaftsbonus und gehoert zu spielziel AC-25.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE, HAEUSER, HANDEL, SAMMELN } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
// Anna mit dem Haus oder ohne eins, Bert immer ohne.
const weltMit = (haus, einstellungen = {}) => new Welt(ZWEI, 7, {
  sicht: 'aufgedeckt', ...(haus ? { haeuser: { a: haus } } : {}), ...einstellungen,
});
const ROHSTOFFE = ['holz', 'nahrung', 'gold', 'stein'];
const reich = (spieler) => { for (const r of ROHSTOFFE) spieler[r] = 5000; };
const bauerVon = (welt) => [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');

/** Takt fuer Takt, bis `bedingung` gilt, hoechstens `s` Sekunden; die Takte bis dahin. */
function bis(welt, bedingung, s = 300) {
  for (let t = 0; t < s * TAKTE_PRO_SEKUNDE; t++) {
    welt.takten();
    if (bedingung()) return t + 1;
  }
  throw new Error(`nach ${s} Sekunden nicht erreicht`);
}

// Ein freier Bauplatz fuer `art`, ringweise um `um`, mindestens `ab` Felder weg.
function platz(welt, art, um, ab = 6) {
  for (let r = ab; r < ab + 30; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (const dy of [-r, r]) {
        if (welt.platzPruefen(art, um.x + dx, um.y + dy)) return { x: um.x + dx, y: um.y + dy };
        if (welt.platzPruefen(art, um.x + dy, um.y + dx)) return { x: um.x + dy, y: um.y + dx };
      }
    }
  }
  throw new Error(`kein Platz fuer ${art}`);
}

// Eine freie Reihe von `laenge` Feldern nach rechts, fuer Schuetze und Ziel.
// Gefragt wird mit einem Gebaeude von einem Feld, also: kein Baum, kein
// Wasser, kein Gebaeude dazwischen.
const EIN_FELD = Object.keys(GEBAEUDE).find((art) => GEBAEUDE[art].groesse === 1);
function reihe(welt, um, laenge, ab = 8) {
  for (let r = ab; r < ab + 40; r++) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r], [r, r], [-r, r], [r, -r], [-r, -r]]) {
      const x = um.x + dx;
      const y = um.y + dy;
      let frei = true;
      for (let i = 0; i <= laenge && frei; i++) frei = welt.platzPruefen(EIN_FELD, x + i, y);
      if (frei) return { x, y };
    }
  }
  throw new Error(`keine freie Reihe von ${laenge} Feldern`);
}

// Eine Einheitenart, auf die ein Schluessel aus `wirkung` greift: die Art
// selbst oder die erste mit dieser Klasse.
function artFuer(schluessel) {
  if (EINHEITEN[schluessel]) return schluessel;
  return Object.keys(EINHEITEN).find((art) => EINHEITEN[art].klassen?.includes(schluessel));
}

// ---- die Messungen, je Form und Wert ------------------------------------

/** Takte vom ersten Schlag am Vorrat bis zur vollen Ladung - ohne den Weg dorthin. */
function arbeitBisVoll(haus, rohstoff) {
  const welt = weltMit(haus);
  const anna = welt.spielerVon('a');
  const feldart = Number(Object.keys(SAMMELN).find((k) => SAMMELN[k].rohstoff === rohstoff));
  const bauer = bauerVon(welt);
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [bauer.id], ziel: welt.naechsterVorrat(anna.basis, feldart) });
  bis(welt, () => bauer.sammelt);
  return bis(welt, () => bauer.ladung >= EINHEITEN.dorfbewohner.tragkraft);
}

/** Die Einheit, die das Gebaeude ausbildet - so wie sie aus der Tuer kommt. */
function ausgebildet(haus, art) {
  const welt = weltMit(haus);
  const anna = welt.spielerVon('a');
  const gebaeudeArt = Object.keys(GEBAEUDE).find((g) => GEBAEUDE[g].bildetAus?.includes(art));
  anna.zeitalter = Math.max(EINHEITEN[art].zeitalter || 0, GEBAEUDE[gebaeudeArt].zeitalter || 0);
  reich(anna);
  const p = platz(welt, gebaeudeArt, anna.basis);
  const gebaeude = welt.gebaeudeAnlegen('a', gebaeudeArt, p.x, p.y);
  const vorher = new Set(welt.einheiten.keys());
  assert.deepEqual(welt.ausbilden('a', gebaeude.id, art), {});
  let neu = null;
  bis(welt, () => (neu = [...welt.einheiten.values()].find((e) => !vorher.has(e.id) && e.art === art)));
  return neu;
}

/** Wie viele Felder rechts der Einheit Anna im Nebel sieht, am Stueck. */
function sichtNachRechts(haus, art) {
  const welt = weltMit(haus, { sicht: 'nebel' });
  const anna = welt.spielerVon('a');
  // Weit weg vom eigenen Dorf: dort sieht sonst nichts hin.
  const mitte = { x: Math.floor(welt.karte.groesse / 2), y: Math.floor(welt.karte.groesse / 2) };
  const p = reihe(welt, mitte, 1, 0);
  assert.ok(Math.hypot(p.x - anna.basis.x, p.y - anna.basis.y) > 30, 'fern vom Dorf');
  welt.einheitAnlegen('a', p.x, p.y, art);
  // Die Sicht rechnet nicht jeden Takt neu (`SICHT_TAKTE`) - eine Sekunde reicht.
  for (let t = 0; t < TAKTE_PRO_SEKUNDE; t++) welt.takten();
  let weit = 0;
  while (welt.sieht('a', p.x + weit + 1, p.y)) weit += 1;
  return weit;
}

/**
 * Von wie weit der erste Pfeil fliegt: das Ziel steht ein Feld hinter der
 * Reichweite ohne Bonus. Wer weiter reicht, schiesst vom Platz; wer nicht,
 * geht erst heran.
 */
function ersterSchuss(haus, art) {
  const welt = weltMit(haus);
  const anna = welt.spielerVon('a');
  const abstand = EINHEITEN[art].reichweite + 1;
  const p = reihe(welt, anna.basis, abstand);
  const schuetze = welt.einheitAnlegen('a', p.x, p.y, art);
  const ziel = welt.einheitAnlegen('b', p.x + abstand, p.y, 'dorfbewohner');
  welt.schuesse = [];
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [schuetze.id], ziel: { x: ziel.x, y: ziel.y } });
  bis(welt, () => welt.schuesse.length > 0, 30);
  const [x0, y0, x1, y1] = welt.schuesse[0];
  return Math.hypot(x1 - x0, y1 - y0);
}

/**
 * Was der erste Schlag nimmt: Bert greift Annas Einheit an, im Nahkampf mit
 * der staerksten Nahkampfeinheit, im Fernkampf mit dem staerksten Schuetzen
 * (Belagerung ausgenommen) - so stark, dass ein Punkt Ruestung nicht unter
 * den Mindestschaden faellt.
 */
function ersterTreffer(haus, art, feld) {
  const fern = feld === 'fernruestung';
  const angreiferArt = Object.keys(EINHEITEN)
    .filter((a) => EINHEITEN[a].angriff > 0 && (EINHEITEN[a].reichweite > 0) === fern)
    .filter((a) => !EINHEITEN[a].klassen?.includes('belagerung') && !EINHEITEN[a].nurGebaeude)
    .sort((x, y) => EINHEITEN[y].angriff - EINHEITEN[x].angriff)[0];
  const welt = weltMit(haus);
  const anna = welt.spielerVon('a');
  const abstand = fern ? EINHEITEN[angreiferArt].reichweite : 1;
  const p = reihe(welt, anna.basis, abstand);
  const ziel = welt.einheitAnlegen('a', p.x, p.y, art);
  const angreifer = welt.einheitAnlegen('b', p.x + abstand, p.y, angreiferArt);
  const leben = ziel.leben;
  welt.nachricht('b', { auftrag: 'befehl', einheiten: [angreifer.id], ziel: { x: ziel.x, y: ziel.y } });
  bis(welt, () => ziel.leben < leben, 30);
  return leben - ziel.leben;
}

/** Ein Gebaeude, das ein Dorfbewohner baut - so wie es fertig dasteht. */
function gebaut(haus, art) {
  const welt = weltMit(haus);
  const anna = welt.spielerVon('a');
  reich(anna);
  const p = platz(welt, art, anna.basis, 5);
  const bauer = bauerVon(welt);
  assert.ok(!welt.nachricht('a', { auftrag: 'bauen', einheiten: [bauer.id], art, ziel: p })?.fehler);
  let fertig = null;
  bis(welt, () => (fertig = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === art && g.fertig && g.x === p.x && g.y === p.y)));
  return fertig;
}

/**
 * Trifft ein schiessendes Gebaeude eine Einheit ein Feld hinter seiner
 * Reichweite ohne Bonus? Gemessen vom Rand der Grundflaeche wie im Spiel.
 */
function trifftHinterDerReichweite(haus, art) {
  const welt = weltMit(haus);
  const anna = welt.spielerVon('a');
  const p = platz(welt, art, anna.basis, 8);
  const turm = welt.gebaeudeAnlegen('a', art, p.x, p.y);
  const { x1, y0 } = welt.grundflaeche(art, turm.x, turm.y);
  const abstand = GEBAEUDE[art].reichweite + 1;
  assert.ok(welt.platzPruefen(EIN_FELD, x1 + abstand, y0), 'das Feld des Ziels ist frei');
  const ziel = welt.einheitAnlegen('b', x1 + abstand, y0, 'dorfbewohner');
  const leben = ziel.leben;
  for (let t = 0; t < 5 * TAKTE_PRO_SEKUNDE; t++) welt.takten();
  return ziel.leben < leben;
}

/** Gold aus einem Verkauf und Gold fuer einen Kauf von `HANDEL.menge` Holz. */
function amMarkt(haus) {
  const welt = weltMit(haus);
  const anna = welt.spielerVon('a');
  anna.zeitalter = GEBAEUDE.markt.zeitalter || 0;
  reich(anna);
  const p = platz(welt, 'markt', anna.basis);
  const markt = welt.gebaeudeAnlegen('a', 'markt', p.x, p.y);
  let gold = anna.gold;
  assert.deepEqual(welt.nachricht('a', { auftrag: 'handeln', gebaeude: markt.id, ware: 'holz', richtung: 'verkaufen' }), {});
  const verkauf = anna.gold - gold;
  gold = anna.gold;
  assert.deepEqual(welt.nachricht('a', { auftrag: 'handeln', gebaeude: markt.id, ware: 'holz', richtung: 'kaufen' }), {});
  return { verkauf, kauf: gold - anna.gold };
}

/** Gold, das die erste Fahrt eines Karrens zwischen zwei eigenen Maerkten heimbringt. */
function ersteFahrt(haus) {
  const welt = weltMit(haus);
  const anna = welt.spielerVon('a');
  anna.zeitalter = EINHEITEN.marktkarren.zeitalter || 0;
  const p = platz(welt, 'markt', anna.basis);
  const heimat = welt.gebaeudeAnlegen('a', 'markt', p.x, p.y);
  const q = platz(welt, 'markt', heimat, 35);
  welt.gebaeudeAnlegen('a', 'markt', q.x, q.y);
  const karren = welt.einheitAnlegen('a', heimat.x + 3, heimat.y, 'marktkarren');
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [karren.id], ziel: q });
  assert.equal(karren.auftrag?.art, 'handel');
  const gold = anna.gold;
  bis(welt, () => anna.gold > gold, 900);
  return anna.gold - gold;
}

// Je Form ein Pruefer: (Haus, Schluessel, Feld, Wert) -> misst mit und ohne
// Haus und sagt, was er gemessen hat. Ein Feld ohne Messung bricht.
const OHNE_MESSUNG = (form, feld) => assert.fail(`Fuer ${form}.${feld} gibt es noch keine Messung - eine neue Form braucht eine (spielziel AC-26).`);

const PRUEFER = {
  sammeln(haus, rohstoff, faktor) {
    const mit = arbeitBisVoll(haus, rohstoff);
    const ohne = arbeitBisVoll(null, rohstoff);
    // Die Arbeit dauert den Kehrwert des Faktors: 1,15 macht aus 10 Takten
    // 8,7. Gerundet wird je Takt, deshalb auf drei Hundertstel.
    assert.ok(Math.abs(mit / ohne - 1 / faktor) < 0.03, `${haus}: ${rohstoff} ${mit} gegen ${ohne} Takte am Vorrat`);
    return `${rohstoff}: ${mit} statt ${ohne} Takte bis zur vollen Ladung`;
  },
  wirkung(haus, schluessel, feld, wert) {
    const art = artFuer(schluessel);
    assert.ok(art, `${haus}: "${schluessel}" trifft keine Einheit`);
    if (feld === 'leben') {
      const mit = ausgebildet(haus, art);
      const ohne = ausgebildet(null, art);
      assert.equal(mit.leben - ohne.leben, wert, `${haus}: ${art} kommt mit mehr Leben aus der Ausbildung`);
      return `${art}: ${mit.leben} statt ${ohne.leben} Leben ab der Ausbildung`;
    }
    if (feld === 'sicht') {
      const mit = sichtNachRechts(haus, art);
      const ohne = sichtNachRechts(null, art);
      assert.equal(mit - ohne, wert, `${haus}: ${art} sieht weiter`);
      return `${art}: sieht ${mit} statt ${ohne} Felder weit`;
    }
    if (feld === 'reichweite') {
      const mit = ersterSchuss(haus, art);
      const ohne = ersterSchuss(null, art);
      // Das Ziel steht ein Feld hinter der Reichweite ohne Bonus. Geschossen
      // wird mit einem Schlagrand ueber die Reichweite hinaus (4,4 bei 4) -
      // gemessen wird deshalb nicht eine Zahl, sondern ob der Schuetze vom
      // Platz schiesst oder erst herangeht.
      const abstand = EINHEITEN[art].reichweite + 1;
      assert.ok(ohne < abstand - 0.1, `${haus}: ohne Haus geht ${art} erst heran (${ohne})`);
      assert.ok(Math.abs(mit - abstand) < 1e-9, `${haus}: ${art} schiesst vom Platz (${mit})`);
      return `${art}: erster Pfeil ueber ${mit.toFixed(1)} statt ${ohne.toFixed(1)} Felder`;
    }
    if (feld === 'nahruestung' || feld === 'fernruestung') {
      const mit = ersterTreffer(haus, art, feld);
      const ohne = ersterTreffer(null, art, feld);
      assert.equal(ohne - mit, wert, `${haus}: ${art} verliert je Schlag weniger (${feld})`);
      return `${art}: ein Schlag nimmt ${mit} statt ${ohne} (${feld})`;
    }
    return OHNE_MESSUNG('wirkung', feld);
  },
  farm(haus, feld, wert) {
    if (feld !== 'nahrung') return OHNE_MESSUNG('farm', feld);
    const mit = gebaut(haus, 'farm');
    const ohne = gebaut(null, 'farm');
    assert.equal(mit.nahrung - ohne.nahrung, wert, `${haus}: die gebaute Farm traegt mehr`);
    return `Farm: ${mit.nahrung} statt ${ohne.nahrung} Nahrung`;
  },
  gebaeude(haus, feld, wert) {
    if (feld === 'lebenAnteil') {
      const mit = gebaut(haus, 'haus');
      const ohne = gebaut(null, 'haus');
      assert.equal(mit.leben, Math.round(ohne.leben * (1 + wert)), `${haus}: das gebaute Haus steht mit mehr Leben`);
      return `Haus: ${mit.leben} statt ${ohne.leben} Leben`;
    }
    if (feld === 'reichweite') {
      // Jedes Gebaeude, das schiesst - "Turm und Burg" -, keins mehr.
      const schiessende = Object.keys(GEBAEUDE).filter((art) => GEBAEUDE[art].angriff > 0);
      assert.ok(schiessende.length >= 2);
      for (const art of schiessende) {
        assert.equal(trifftHinterDerReichweite(haus, art), true, `${haus}: ${art} trifft ein Feld weiter`);
        assert.equal(trifftHinterDerReichweite(null, art), false, `${art} ohne Haus nicht`);
      }
      return `${schiessende.join(' und ')} treffen ${wert} Feld weiter`;
    }
    return OHNE_MESSUNG('gebaeude', feld);
  },
  handel(haus, feld, wert) {
    if (feld === 'gebuehr') {
      const mit = amMarkt(haus);
      const ohne = amMarkt(null);
      const gebuehr = HANDEL.gebuehr + wert;
      const grund = HANDEL.waren.holz;
      assert.equal(mit.verkauf, Math.round(grund * (1 - gebuehr)), `${haus}: Verkauf`);
      assert.equal(ohne.verkauf, Math.round(grund * (1 - HANDEL.gebuehr)));
      // Gekauft wird nach dem Verkauf, also zum gesenkten Grundpreis - fuer
      // beide derselbe.
      const gesenkt = grund - HANDEL.schritt;
      assert.equal(mit.kauf, Math.round(gesenkt * (1 + gebuehr)), `${haus}: Kauf`);
      assert.equal(ohne.kauf, Math.round(gesenkt * (1 + HANDEL.gebuehr)));
      return `Holz: ${mit.verkauf} statt ${ohne.verkauf} Gold je Verkauf, ${mit.kauf} statt ${ohne.kauf} je Kauf`;
    }
    if (feld === 'karrenAnteil') {
      const mit = ersteFahrt(haus);
      const ohne = ersteFahrt(null);
      // Gerundet wird je Fahrt, deshalb auf ein Gold genau.
      // Und mehr muss es sein: bei einem kleinen Anteil laege ein wirkungsloser
      // Bonus sonst innerhalb des einen Golds (Durchsicht Runde 170).
      assert.ok(Math.abs(mit - ohne * (1 + wert)) <= 1 && mit > ohne, `${haus}: ${mit} gegen ${ohne} Gold je Fahrt`);
      return `Karren: ${mit} statt ${ohne} Gold je Fahrt`;
    }
    return OHNE_MESSUNG('handel', feld);
  },
};

// Die Blaetter der Boni eines Hauses: [Form, ...Weg zum Wert, Wert].
function blaetter(boni) {
  const liste = [];
  for (const [form, inhalt] of Object.entries(boni)) {
    for (const [a, b] of Object.entries(inhalt)) {
      if (typeof b === 'object') for (const [feld, wert] of Object.entries(b)) liste.push([form, a, feld, wert]);
      else liste.push([form, a, b]);
    }
  }
  return liste;
}

test('spielziel AC-26: jeder Bonus jedes Hauses wirkt im Spiel - dieselbe Lage mit und ohne Haus, ein Wert verschieden', () => {
  const gemessen = [];
  for (const [haus, eintrag] of Object.entries(HAEUSER)) {
    for (const [form, ...rest] of blaetter(eintrag.boni)) {
      const pruefer = PRUEFER[form];
      assert.ok(pruefer, `${haus}: Bonus in der Form "${form}" ohne Messung`);
      gemessen.push(`${haus} - ${pruefer(haus, ...rest)}`);
    }
  }
  // Gegenprobe des Aufbaus: gemessen ist jedes Blatt, und es sind welche -
  // heute zwoelf in fuenf Haeusern, jedes Haus mit mindestens einem.
  const alle = Object.values(HAEUSER).reduce((n, h) => n + blaetter(h.boni).length, 0);
  assert.equal(gemessen.length, alle);
  assert.ok(alle >= 12, `Boni: ${alle}`);
  for (const [haus, eintrag] of Object.entries(HAEUSER)) assert.ok(blaetter(eintrag.boni).length > 0, `${haus} hat keinen Bonus`);
  console.log(gemessen.join('\n'));
});

test('spielziel AC-26: der Reichweitenbonus fuer Gebaeude gilt nur fuer die, die schiessen', () => {
  // "Turm und Burg +1 Reichweite": ein Haus mit Reichweite 1 waere in der
  // Leiste Unsinn, und schiessen wuerde es ohnehin nicht. Gelesen wird ueber
  // die Tafel fuer den Browser, die dieselbe Stelle fragt wie der Turm.
  for (const [haus, eintrag] of Object.entries(HAEUSER)) {
    if (!eintrag.boni.gebaeude?.reichweite) continue;
    const tafel = weltMit(haus).kampfwerte('a');
    for (const art of Object.keys(GEBAEUDE)) {
      const erwartet = (GEBAEUDE[art].reichweite || 0) + (GEBAEUDE[art].angriff > 0 ? eintrag.boni.gebaeude.reichweite : 0);
      assert.equal(tafel[art].reichweite, erwartet, `${haus}: ${art}`);
    }
  }
});

test('spielziel AC-26: die Marktpreise fuer den Browser kommen mit der Gebuehr des Hauses', () => {
  // Was die Leiste am Markt zeigt, ist, was der Handel bucht: `hp` im
  // Zustand kommt aus `handelspreise()`, der Browser rechnet nichts nach.
  for (const [haus, eintrag] of Object.entries(HAEUSER)) {
    const welt = weltMit(haus);
    const gebuehr = Math.max(0, HANDEL.gebuehr + (eintrag.boni.handel?.gebuehr || 0));
    const [kauf, verkauf] = welt.handelspreise('a').holz;
    assert.deepEqual([kauf, verkauf], [Math.round(HANDEL.waren.holz * (1 + gebuehr)), Math.round(HANDEL.waren.holz * (1 - gebuehr))], haus);
  }
});
