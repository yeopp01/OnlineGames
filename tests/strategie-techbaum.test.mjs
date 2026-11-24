// Der Technologiebaum (→ specs/10-strategie/bedienung.md AC-81 bis AC-83):
// die Daten der Seite, gerechnet auf dem Server aus denselben Tabellen wie
// das Spiel, und der Weg, auf dem sie in den Browser kommen.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beenden } from './hilfe.mjs';

const require = createRequire(import.meta.url);
const { techbaum, OHNE } = require('../server/spiele/strategie/techbaum.js');
const { EINHEITEN, GEBAEUDE, VERBESSERUNGEN, AUFSTIEGE, HAEUSER, ZEITALTER } = require('../server/spiele/strategie/daten.js');
const { bringt, hausBringt } = require('../server/spiele/strategie/bringt.js');
const { GEBAEUDE_NAMEN, EINHEIT_NAMEN } = require('../server/spiele/strategie/welt.js');
const verzeichnis = require('../server/spiele/verzeichnis.js');
const { starten } = require('../server/index.js');

const HAFEN = 4298;
const ordner = mkdtempSync(join(tmpdir(), 'techbaum-'));
let laufend;

before(async () => {
  laufend = await starten(HAFEN, { konten: { datei: join(ordner, 'konten.sqlite'), geheimnis: 's'.repeat(48) } });
});

after(() => {
  if (laufend) beenden(laufend);
  try {
    rmSync(ordner, { recursive: true, force: true });
  } catch { /* Windows haelt die Datei gelegentlich noch einen Moment */ }
});

const baum = techbaum();
const linien = baum.seiten.flatMap((s) => s.gruppen.flatMap((g) => g.linien));
const knoten = linien.flat();

/** Wie oft etwas im Baum steht. */
function zaehlen(liste) {
  const n = new Map();
  for (const art of liste) n.set(art, (n.get(art) || 0) + 1);
  return n;
}

test('bedienung AC-81: jede Einheit, jede Verbesserung und jedes Gebaeude steht genau einmal im Baum', () => {
  // Einheiten: was ausgebildet oder gerufen wird, und was eine Stufe aus ihr macht.
  const einheiten = zaehlen(knoten.flatMap((k) => {
    if (k.typ === 'einheit' || k.typ === 'gerufen') return [k.art];
    if (k.typ === 'stufe' && VERBESSERUNGEN[k.art].wandelt) return [k.einheit];
    return [];
  }));
  for (const art of Object.keys(EINHEITEN)) assert.equal(einheiten.get(art), 1, `Einheit ${art}`);
  assert.equal(einheiten.size, Object.keys(EINHEITEN).length);

  const verbesserungen = zaehlen(knoten.filter((k) => k.typ === 'stufe' || k.typ === 'verbesserung').map((k) => k.art));
  for (const art of Object.keys(VERBESSERUNGEN)) assert.equal(verbesserungen.get(art), 1, `Verbesserung ${art}`);
  assert.equal(verbesserungen.size, Object.keys(VERBESSERUNGEN).length);

  const gebaeude = zaehlen([
    ...baum.seiten.flatMap((s) => s.gruppen.map((g) => g.gebaeude).filter(Boolean)),
    ...knoten.filter((k) => k.typ === 'gebaeude').map((k) => k.art),
  ]);
  for (const art of Object.keys(GEBAEUDE)) assert.equal(gebaeude.get(art), 1, `Gebäude ${art}`);

  // Jeder Eintrag in dem Zeitalter, das die Daten nennen, und auf der Seite
  // seines Gebaeudes im Baumenue (bedienung AC-64).
  for (const k of knoten) {
    const daten = k.typ === 'gebaeude' ? GEBAEUDE[k.art] : (VERBESSERUNGEN[k.art] || EINHEITEN[k.art]);
    assert.equal(k.zeitalter, daten.zeitalter || 0, `Zeitalter von ${k.art}`);
  }
  baum.seiten.forEach((seite, nummer) => {
    for (const g of seite.gruppen) if (g.gebaeude) assert.equal(GEBAEUDE[g.gebaeude].seite || 0, nummer, g.gebaeude);
  });
  // Was ein Gebaeude ausbildet und erforscht, steht in seiner Gruppe.
  for (const seite of baum.seiten) {
    for (const g of seite.gruppen) {
      if (!g.gebaeude) continue;
      const hier = new Set(g.linien.flat().filter((k) => k.typ !== 'gerufen').map((k) => k.art));
      const soll = GEBAEUDE[g.gebaeude].bildetAus.filter((a) => !AUFSTIEGE[a]);
      assert.deepEqual([...hier].sort(), [...soll].sort(), g.gebaeude);
    }
  }
  // Der Drache wird gerufen, im Kloster, und der Weg dorthin steht dabei.
  const drache = knoten.find((k) => k.art === 'drache');
  assert.equal(drache.typ, 'gerufen');
  assert.ok(baum.seiten[0].gruppen.find((g) => g.gebaeude === 'kloster').linien.flat().includes(drache));
  assert.ok(drache.hinweis.some((z) => z.includes('Drachenei')));
});

test('bedienung AC-81: die Zeitalter heissen wie im Spiel, je mit ihrem Aufstieg', () => {
  assert.deepEqual(baum.zeitalter.map((z) => z.name), ['Landsitz', 'Lehen', 'Fürstentum', 'Krone']);
  assert.deepEqual(baum.zeitalter.map((z) => z.ab), ZEITALTER.map((z) => z.ab));
  assert.deepEqual(baum.zeitalter.map((z) => z.aufstieg), [null, 'feudalzeit', 'ritterzeit', 'imperialzeit']);
  for (const [art, a] of Object.entries(AUFSTIEGE)) {
    assert.deepEqual(baum.werte.aufstiege[art].kosten, a.kosten, art);
    assert.ok(Array.isArray(baum.werte.aufstiege[art].staerkt), `${art}: was der Aufstieg staerkt, in Worten`);
  }
});

test('bedienung AC-81: was eine Verbesserung bringt, sagt der Server in Worten', () => {
  for (const [art, v] of Object.entries(VERBESSERUNGEN)) {
    assert.deepEqual(baum.werte.verbesserungen[art].bringt, bringt(v, GEBAEUDE_NAMEN), art);
  }
  // Die Schmiede bringt etwas, das man lesen kann - nicht nur Zahlen ohne Ziel.
  assert.ok(baum.werte.verbesserungen.schmiedeangriff.bringt.length > 0);
});

test('bedienung AC-82: jede Linie zeigt auf ihre Vorstufe und auf die Einheit, die ausgetauscht wird', () => {
  let stufen = 0;
  for (const linie of linien) {
    linie.forEach((k, i) => {
      const davor = linie[i - 1];
      if (i > 0) assert.equal(k.vor, davor.art, `${k.art} zeigt auf den Eintrag davor`);
      if (k.typ === 'verbesserung') {
        assert.equal(k.vor, VERBESSERUNGEN[k.art].vorstufe || null, `${k.art}: Vorstufe`);
      }
      if (k.typ === 'stufe') {
        stufen += 1;
        const v = VERBESSERUNGEN[k.art];
        const von = v.wandelt ? Object.keys(v.wandelt)[0] : v.hebt;
        const gezeigt = davor.typ === 'einheit' ? davor.art : davor.einheit;
        assert.equal(gezeigt, von, `${k.art} folgt auf ${von}`);
        if (v.vorstufe) assert.equal(k.vor, v.vorstufe, `${k.art}: Vorstufe`);
        assert.equal(k.einheit, v.wandelt ? Object.values(v.wandelt)[0] : v.hebt);
      }
      // Nie zurueck in ein frueheres Zeitalter.
      if (davor) assert.ok(k.zeitalter >= davor.zeitalter, `${k.art} nach ${davor.art}`);
    });
  }
  // Jede Verbesserung, die austauscht oder hebt, ist eine Stufe in einer Linie.
  const soll = Object.values(VERBESSERUNGEN).filter((v) => v.wandelt || v.hebt).length;
  assert.equal(stufen, soll);
  // Stichproben aus dem Original: Speer, Pike, Hellebarde; Ritter, Kavalier, Paladin.
  const linieVon = (art) => linien.find((l) => l[0].art === art).map((k) => k.einheit || k.art);
  assert.deepEqual(linieVon('speerkaempfer'), ['speerkaempfer', 'pikenier', 'hellebardier']);
  assert.deepEqual(linieVon('ritter'), ['ritter', 'kavalier', 'paladin']);
  assert.deepEqual(linieVon('miliz'), ['miliz', 'soldat', 'langschwertkaempfer', 'zweihandkaempfer']);
  assert.deepEqual(linien.find((l) => l[0].art === 'schmiedeangriff').map((k) => k.art), ['schmiedeangriff', 'eisenguss', 'hochofen']);
});

test('bedienung AC-83: jedes Haus bekommt genau seine eigenen Einheiten, und was es staerkt', () => {
  for (const haus of baum.haeuser) {
    const soll = [
      ...Object.keys(EINHEITEN).filter((a) => EINHEITEN[a].haeuser?.includes(haus.art)),
      ...Object.keys(VERBESSERUNGEN).filter((a) => VERBESSERUNGEN[a].haeuser?.includes(haus.art)),
    ];
    assert.deepEqual([...haus.eigene].sort(), soll.sort(), haus.art);
    assert.equal(haus.name, HAEUSER[haus.art].name);
    assert.deepEqual(haus.bringt, hausBringt(HAEUSER[haus.art], GEBAEUDE_NAMEN, EINHEIT_NAMEN).bringt);
    // Was es staerkt, bildet es auch aus.
    for (const art of haus.gestaerkt) assert.ok(!EINHEITEN[art]?.haeuser || EINHEITEN[art].haeuser.includes(haus.art), `${haus.art}: ${art}`);
  }
  assert.deepEqual(baum.haeuser.map((h) => h.art), Object.keys(HAEUSER));
  const haus = Object.fromEntries(baum.haeuser.map((h) => [h.art, h]));
  // Die Burgeinheit je Haus samt ihrer Elitestufe, und die Schuetzen der Schiessanlage.
  assert.deepEqual(haus.eschenbruch.eigene.sort(), ['eibenschuetze', 'elitekriegswolf', 'kriegswolf']);
  assert.deepEqual(haus.wehrstein.eigene.sort(), ['eliteriese', 'pavesenschuetze', 'riese']);
  assert.ok(!haus.rappenstein.eigene.includes('kriegswolf'));
  // In den Knoten selbst: der Kriegswolf gehoert nur Eschenbruch.
  assert.deepEqual(knoten.find((k) => k.art === 'kriegswolf').haeuser, ['eschenbruch']);
  assert.equal(knoten.find((k) => k.art === 'miliz').haeuser, null);
  // Was ein Bonus trifft: Rappensteins Reiter, Distelhags Infanterie.
  assert.ok(haus.rappenstein.gestaerkt.includes('ritter'));
  assert.ok(haus.distelhag.gestaerkt.includes('miliz'));
  assert.ok(!haus.distelhag.gestaerkt.includes('riese'), 'den Riesen bildet Distelhag nicht aus');
});

test('bedienung AC-83: die Werte je Haus gelten ab dem Zeitalter, in dem es die Einheit gibt', () => {
  const { jeHaus } = baum;
  assert.ok(jeHaus[OHNE]);
  // Silberfurt bekommt den Soeldner billiger (spielziel AC-17).
  assert.ok(jeHaus.silberfurt.soeldner.kosten.gold < EINHEITEN.soeldner.kosten.gold);
  assert.equal(jeHaus[OHNE].soeldner.kosten, undefined, 'ohne Haus der Preis der Daten');
  // Eschenbruchs Reichweite kommt mit dem Fuerstentum: die Armbrust gibt es
  // erst dort, der Bogenschuetze des Lehens schiesst so weit wie bei allen.
  assert.equal(jeHaus.eschenbruch.armbrustschuetze.reichweite, jeHaus[OHNE].armbrustschuetze.reichweite + 1);
  assert.equal(jeHaus.eschenbruch.bogenschuetze.reichweite, jeHaus[OHNE].bogenschuetze.reichweite);
  // Rappensteins Reiter haben mehr Leben, auch die Stufen.
  assert.equal(jeHaus.rappenstein.paladin.leben, jeHaus[OHNE].paladin.leben + 15);
  // Ohne Haus gelten die Grundwerte der Daten.
  assert.equal(jeHaus[OHNE].miliz.leben, EINHEITEN.miliz.leben);
});

test('bedienung AC-81: der Server liefert den Baum unter dem Spiel, die Plattform kennt nur den Titel', async () => {
  const { spiele } = await (await fetch(`http://localhost:${HAFEN}/api/spiele`)).json();
  assert.deepEqual(spiele.find((s) => s.art === 'strategie').nachschlagen, { titel: 'Technologiebaum' });
  assert.equal(spiele.find((s) => s.art === 'manager').nachschlagen, undefined);

  const antwort = await fetch(`http://localhost:${HAFEN}/api/spiele/strategie/nachschlagen`);
  assert.equal(antwort.status, 200);
  assert.match(antwort.headers.get('content-type'), /json/);
  assert.deepEqual(await antwort.json(), JSON.parse(JSON.stringify(baum)));
  // Ein zweites Mal aus dem Gedaechtnis, dasselbe.
  assert.deepEqual(await (await fetch(`http://localhost:${HAFEN}/api/spiele/strategie/nachschlagen`)).json(), JSON.parse(JSON.stringify(baum)));
  assert.equal((await fetch(`http://localhost:${HAFEN}/api/spiele/manager/nachschlagen`)).status, 404);
  assert.equal((await fetch(`http://localhost:${HAFEN}/api/spiele/gibtsnicht/nachschlagen`)).status, 404);

  // Ein Steckbrief mit kaputtem Nachschlagen faellt beim Start auf.
  const wurzel = mkdtempSync(join(ordner, 'spiele-'));
  mkdirSync(join(wurzel, 'raetsel'));
  writeFileSync(join(wurzel, 'raetsel', 'steckbrief.js'), `module.exports = ${JSON.stringify({
    art: 'raetsel', name: 'Raetsel', beschreibung: 'Ein Raetsel.', spieler: { von: 1, bis: 1 }, stand: 'gesperrt', einstieg: { art: 'raum' }, nachschlagen: { titel: 'Hilfe' },
  })};`);
  assert.throws(() => verzeichnis.lesen(wurzel), /nachschlagen/);
});
