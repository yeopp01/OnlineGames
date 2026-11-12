// Zerstoerung (→ specs/10-strategie/bauen.md AC-17, AC-18, AC-19) -
// Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md).
//
// Gebaut war das alles seit dem Kampf (B5) und dem Partieende (C2); diese
// Datei belegt es unter den Nummern aus der Spec (Rueckschau nach Runde 198:
// alte offene Kriterien vor neuen).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

// Ein freies Viereck neben Annas Basis: Mitte und Halbmesser r frei.
function freiesViereck(welt, r, ab = 9) {
  const a = welt.spielerVon('a');
  for (let d = ab; d < 40; d++) {
    for (const [dx, dy] of [[d, 0], [0, d], [d, d], [-d, d], [d, -d]]) {
      const x = a.basis.x + dx;
      const y = a.basis.y + dy;
      let frei = true;
      for (let oy = -r; oy <= r && frei; oy++) {
        for (let ox = -r; ox <= r && frei; ox++) {
          if (!karten.begehbar(welt.karte, x + ox, y + oy) || welt.gebaeudeAn(x + ox, y + oy)) frei = false;
        }
      }
      if (frei) return { x, y };
    }
  }
  throw new Error('kein freies Viereck');
}

// Laeuft, bis die Bedingung gilt - hoechstens `sekunden` Spielzeit.
function bis(welt, bedingung, sekunden) {
  for (let t = 0; t < sekunden * TAKTE_PRO_SEKUNDE; t++) {
    if (bedingung()) return true;
    welt.takten();
  }
  return bedingung();
}

// Ein Name aus der Spec als Schluessel in den Daten: klein, Umlaute
// umschrieben ("Schießanlage" → schiessanlage).
const schluessel = (name) => name.toLowerCase()
  .replaceAll('ä', 'ae').replaceAll('ö', 'oe').replaceAll('ü', 'ue').replaceAll('ß', 'ss');

// Jede Tabelle in bauen.md mit einer Spalte "Leben": Name und Wert je Zeile.
function lebenAusDerSpec() {
  const zeilen = readFileSync(new URL('../specs/10-strategie/bauen.md', import.meta.url), 'utf8').split(/\r?\n/);
  const gefunden = [];
  let spalte = -1;
  for (const zeile of zeilen) {
    if (!zeile.startsWith('|')) { spalte = -1; continue; }
    const zellen = zeile.split('|').slice(1, -1).map((z) => z.trim());
    if (zellen.includes('Leben')) { spalte = zellen.indexOf('Leben'); continue; }
    if (spalte < 0 || /^-+$/.test(zellen[0])) continue;
    gefunden.push({ name: zellen[0].replaceAll('*', ''), leben: Number(zellen[spalte]) });
  }
  return gefunden;
}

test('bauen AC-17: jedes Gebaeude der Tabellen hat das Leben aus der Spec - in den Daten und in der Welt', () => {
  const tabelle = lebenAusDerSpec();
  // Drei Tabellen: Dunkle Zeit, Feudalzeit, Ritterzeit - gezaehlt, nicht
  // aufgezaehlt; jede Zeile muss ein Gebaeude der Daten treffen.
  assert.ok(tabelle.length >= 15, `${tabelle.length} Zeilen mit Leben in bauen.md`);
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const m = freiesViereck(welt, 3);
  for (const { name, leben } of tabelle) {
    const art = schluessel(name);
    assert.ok(GEBAEUDE[art], `${name} steht in den Daten (als ${art})`);
    assert.equal(GEBAEUDE[art].leben, leben, `${name}: Leben in daten.js wie in der Spec`);
    // Ohne Verbesserung traegt ein fertiges Gebaeude genau dieses Leben.
    assert.equal(welt.gebaeudewert('a', art, 'leben'), leben, `${name}: so liest es die Welt`);
  }
  const haus = welt.gebaeudeAnlegen('a', 'haus', m.x, m.y, true);
  assert.equal(haus.leben, GEBAEUDE.haus.leben, 'ein fertiges Haus steht mit vollem Leben da');
});

test('bauen AC-18: faellt ein Haus, sinkt die Grenze - niemand stirbt, es kommt nur keiner dazu, bis wieder Platz ist', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const anna = welt.spielerVon('a');
  const m = freiesViereck(welt, 4, 14);
  const haus = welt.gebaeudeAnlegen('a', 'haus', m.x, m.y, true);
  // Bis an die Grenze auffuellen, mit Dorfbewohnern daheim.
  while ((welt.bevoelkerung().get('a') || 0) < welt.wohnraum(anna)) {
    welt.einheitAnlegen('a', anna.basis.x - 3, anna.basis.y + 3, 'dorfbewohner');
  }
  const vorher = { raum: welt.wohnraum(anna), leute: welt.bevoelkerung().get('a') };
  assert.ok(vorher.raum > GEBAEUDE.haus.wohnraum, 'das Haus ist nicht der einzige Wohnraum');

  // Berts Miliz reisst das Haus ein.
  haus.leben = 1;
  const miliz = welt.einheitAnlegen('b', m.x - 2, m.y, 'miliz');
  welt.nachricht('b', { auftrag: 'befehl', einheiten: [miliz.id], ziel: { x: m.x, y: m.y } });
  assert.ok(bis(welt, () => !welt.gebaeude.has(haus.id), 30), 'das Haus ist gefallen');
  welt.einheitSterben(miliz);
  assert.equal(welt.wohnraum(anna), vorher.raum - GEBAEUDE.haus.wohnraum, 'die Grenze ist um das Haus gesunken');
  assert.equal(welt.bevoelkerung().get('a'), vorher.leute, 'niemand ist gestorben - jetzt ueber der Grenze');

  // Ein Dorfbewohner wartet, statt zu kommen (bauen AC-15).
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === 'dorfzentrum');
  anna.nahrung = 500;
  welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: zentrum.id, einheit: 'dorfbewohner' });
  assert.equal(zentrum.schlange.length, 1, 'bestellt');
  bis(welt, () => false, 40);
  assert.equal(welt.bevoelkerung().get('a'), vorher.leute, 'vierzig Sekunden spaeter: keiner dazu');
  assert.equal(zentrum.wartet, true, 'der Auftrag wartet auf Platz');

  // Erst wenn wieder Platz ist - zwei Haeuser, denn die Leute stehen jetzt
  // fuenf ueber der Grenze -, kommt er.
  const p = freiesViereck(welt, 4, 20);
  welt.gebaeudeAnlegen('a', 'haus', p.x - 2, p.y, true);
  welt.gebaeudeAnlegen('a', 'haus', p.x + 1, p.y, true);
  assert.ok(bis(welt, () => welt.bevoelkerung().get('a') > vorher.leute, 40), 'mit neuem Wohnraum kommt er');
});

test('bauen AC-19: reisst Anna Berts letztes Gebaeude ein, ist Bert draussen und die Partie in demselben Takt vorbei - die Farm haelt ihn nicht', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  // Bert hat nichts mehr ausser einem Haus und einer Farm daneben.
  for (const e of [...welt.einheiten.values()]) if (e.besitzer === 'b') welt.einheitSterben(e);
  for (const g of [...welt.gebaeude.values()]) if (g.besitzer === 'b') welt.gebaeudeZerstoeren(g);
  const m = freiesViereck(welt, 5, 12);
  const haus = welt.gebaeudeAnlegen('b', 'haus', m.x, m.y, true);
  const farm = welt.gebaeudeAnlegen('b', 'farm', m.x + 3, m.y - 1, true);
  haus.leben = 1;
  bis(welt, () => false, 3);
  assert.equal(welt.vorbei, false, 'solange das Haus steht, ist Bert dabei');

  const miliz = welt.einheitAnlegen('a', m.x - 2, m.y, 'miliz');
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [miliz.id], ziel: { x: m.x, y: m.y } });
  let gefallen = null;
  bis(welt, () => {
    if (gefallen === null && !welt.gebaeude.has(haus.id)) gefallen = welt.takt;
    return welt.vorbei;
  }, 30);
  assert.ok(gefallen !== null, 'das Haus ist gefallen');
  assert.equal(welt.vorbei, true, 'die Partie ist vorbei');
  // `takten()` zaehlt den Takt zu Beginn hoch: `gefallen` ist der Takt, in
  // dem das Haus fiel, und das Ende traegt denselben.
  assert.equal(welt.ende.takt, gefallen, 'in demselben Takt');
  assert.deepEqual(welt.ende.gewinner, ['a']);
  assert.equal(welt.ende.grund, 'eroberung');
  assert.ok(welt.gebaeude.has(farm.id), 'die Farm steht noch und hat Bert nicht gehalten');
  assert.equal(welt.spielerVon('b').aus, true);
});
