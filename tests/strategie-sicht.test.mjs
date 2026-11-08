// Was jeder Spieler sieht (→ specs/10-strategie/kampf.md AC-15) - Rechenteile,
// direkt geprueft (→ docs/adr/0004-teststrategie.md).
//
// Der Server rechnet je Spieler zweimal je Sekunde, welche Felder seine
// Einheiten und Gebaeude jetzt sehen und welche je gesehen wurden. Das ist die
// Grundlage fuer den Nebel (kampf AC-11 bis AC-13, darstellung AC-15); hier
// wird nur gerechnet, noch nichts gezeigt oder weggelassen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

// Ein Feld, um das herum 14 Felder lang nichts von Anna steht - so sieht dort
// nur, was der Test hinstellt.
function abseits(welt) {
  const g = welt.karte.groesse;
  const annas = [...welt.einheiten.values(), ...welt.gebaeude.values()].filter((d) => d.besitzer === 'a');
  for (let y = 20; y < g - 20; y++) {
    for (let x = 20; x < g - 20; x++) {
      if (!karten.begehbar(welt.karte, x, y)) continue;
      if (annas.every((d) => Math.hypot(d.x - x, d.y - y) > 25)) return { x, y };
    }
  }
  throw new Error('kein Feld abseits');
}

test('kampf AC-15: eine Einheit sieht so weit, wie ihre Daten sagen - nicht weiter', () => {
  for (const art of ['dorfbewohner', 'bogenschuetze']) {
    const welt = new Welt(ZWEI, 4711);
    const p = abseits(welt);
    welt.einheitAnlegen('a', p.x, p.y, art);
    welt.sichtAktualisieren();
    const r = welt.einheitenwert('a', art, 'sicht');
    assert.equal(r, EINHEITEN[art].sicht, `${art}: Sichtweite aus den Daten`);
    // Gegenprobe zur Zahl: gerade noch, und eins weiter nicht mehr.
    assert.equal(welt.sieht('a', p.x + r, p.y), true, `${art}: ${r} Felder weit`);
    assert.equal(welt.sieht('a', p.x + r + 1, p.y), false, `${art}: nicht ${r + 1}`);
    assert.equal(welt.sieht('a', p.x, p.y - r), true);
    // Und Bert sieht dort nichts - jeder hat seine eigene Sicht.
    assert.equal(welt.sieht('b', p.x, p.y), false, `${art}: Bert sieht Annas Feld nicht`);
  }
});

test('kampf AC-15: ein Gebaeude sieht acht Felder ueber seinen Rand', () => {
  const welt = new Welt(ZWEI, 4711);
  const p = abseits(welt);
  const haus = welt.gebaeudeAnlegen('a', 'haus', p.x, p.y, true);
  welt.sichtAktualisieren();
  const { x1, y0 } = welt.grundflaeche('haus', haus.x, haus.y);
  const weit = GEBAEUDE.haus.sicht;
  assert.equal(weit, 8);
  assert.equal(welt.sieht('a', x1 + weit, y0), true, 'acht Felder rechts vom Rand');
  assert.equal(welt.sieht('a', x1 + weit + 2, y0), false, 'zehn nicht');
});

test('kampf AC-15: was einmal gesehen war, bleibt erkundet - gesehen wird es nur, solange jemand dort ist', () => {
  const welt = new Welt(ZWEI, 4711);
  const p = abseits(welt);
  // Vorher: nie gesehen.
  assert.equal(welt.erkundet('a', p.x, p.y), false, 'vorher unbekannt');
  const spaeher = welt.einheitAnlegen('a', p.x, p.y, 'dorfbewohner');
  welt.sichtAktualisieren();
  assert.equal(welt.sieht('a', p.x, p.y), true);
  assert.equal(welt.erkundet('a', p.x, p.y), true);
  // Er geht (hier: faellt weg) - das Feld bleibt erkundet, gesehen wird es nicht mehr.
  welt.einheiten.delete(spaeher.id);
  welt.sichtAktualisieren();
  assert.equal(welt.sieht('a', p.x, p.y), false, 'jetzt unbeobachtet');
  assert.equal(welt.erkundet('a', p.x, p.y), true, 'aber erinnert');
});

test('kampf AC-15: zweimal je Sekunde neu gerechnet, waehrend die Partie laeuft', () => {
  const welt = new Welt(ZWEI, 4711);
  const p = abseits(welt);
  const e = welt.einheitAnlegen('a', p.x, p.y, 'dorfbewohner');
  const ziel = { x: p.x + 10, y: p.y };
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [e.id], ziel });
  for (let t = 0; t < 20 * TAKTE_PRO_SEKUNDE && e.weg.length; t++) welt.takten();
  for (let t = 0; t < TAKTE_PRO_SEKUNDE; t++) welt.takten();
  assert.equal(welt.sieht('a', ziel.x, ziel.y), true, 'am Ziel sieht sie');
  assert.equal(welt.sieht('a', p.x - 3, p.y), false, 'der Start liegt ausser Sicht');
  assert.equal(welt.erkundet('a', p.x - 3, p.y), true, 'ist aber erkundet');
});

test('kampf AC-15: acht Spieler mit 800 Einheiten kosten je Rechnung unter 1 ms', () => {
  // Die Grenze kommt aus dem Budget eines Taktes (einheiten AC-21): die Sicht
  // wird alle fuenf Takte gerechnet, darf aber auch dann den Takt nicht
  // sprengen.
  const acht = Array.from({ length: 8 }, (_, i) => ({ id: `s${i}`, name: `S${i}` }));
  const welt = new Welt(acht, 4711);
  for (let i = 0; i < 800; i++) {
    const s = welt.spieler[i % 8];
    welt.einheitAnlegen(s.id, s.basis.x + (i % 7) - 3, s.basis.y + ((i >> 3) % 7) - 3, i % 2 ? 'bogenschuetze' : 'miliz');
  }
  for (let n = 0; n < 5; n++) welt.sichtAktualisieren();
  let bestes = Infinity;
  for (let d = 0; d < 5; d++) {
    const t0 = performance.now();
    for (let n = 0; n < 10; n++) welt.sichtAktualisieren();
    bestes = Math.min(bestes, (performance.now() - t0) / 10);
  }
  assert.ok(bestes < 1, `${bestes.toFixed(3)} ms je Rechnung`);
});

test('kampf AC-15: faellt ein Gebaeude, sieht es nichts mehr - erkundet bleibt', () => {
  // Die Sicht der Gebaeude wird nur neu gerechnet, wenn eines entsteht oder
  // faellt (Runde 104: sonst kostete die Sicht die Haelfte mehr Rechenzeit je
  // Partie). Dieser Test haelt die zweite Haelfte fest.
  const welt = new Welt(ZWEI, 4711);
  const p = abseits(welt);
  const haus = welt.gebaeudeAnlegen('a', 'haus', p.x, p.y, true);
  welt.sichtAktualisieren();
  const { x1, y0 } = welt.grundflaeche('haus', haus.x, haus.y);
  assert.equal(welt.sieht('a', x1 + 5, y0), true, 'das Haus sieht');
  welt.gebaeudeZerstoeren(haus);
  welt.sichtAktualisieren();
  assert.equal(welt.sieht('a', x1 + 5, y0), false, 'gefallen, sieht es nichts mehr');
  assert.equal(welt.erkundet('a', x1 + 5, y0), true, 'das Feld bleibt erkundet');
});

test('kampf AC-15: ausserhalb der Karte sieht niemand', () => {
  // Durchsicht Runde 104: ohne Grenze griff x = -1 in die Nachbarreihe.
  const welt = new Welt(ZWEI, 4711);
  const g = welt.karte.groesse;
  const e = welt.einheitAnlegen('a', 0, 10, 'dorfbewohner');
  welt.sichtAktualisieren();
  assert.equal(welt.sieht('a', 0, 10), true, 'am Rand sieht sie');
  // Gegenprobe: das Feld, auf das x = -1 frueher fiel (Reihe 9, ganz
  // rechts), wird gesehen - die Antwort fuer x = -1 muss trotzdem nein sein.
  welt.einheitAnlegen('a', g - 1, 9, 'dorfbewohner');
  welt.sichtAktualisieren();
  assert.equal(welt.sieht('a', g - 1, 9), true, 'das Nachbarfeld der Reihe darueber ist gesehen');
  assert.equal(welt.sieht('a', -1, 10), false);
  assert.equal(welt.erkundet('a', -1, 10), false);
  assert.equal(welt.sieht('a', g, 10), false);
  assert.equal(e.besitzer, 'a');
});

test('kampf AC-16: die Sicht ist eine Einstellung - Nebel, Erkundet oder Aufgedeckt', () => {
  const lauf = (sicht) => {
    const welt = new Welt(ZWEI, 4711, sicht ? { sicht } : {});
    return { welt, p: abseits(welt) };
  };
  // Vorgabe: Nebel - weit draussen weder gesehen noch erkundet.
  const nebel = lauf(undefined);
  assert.equal(nebel.welt.sichtArt, 'nebel');
  assert.equal(nebel.welt.erkundet('a', nebel.p.x, nebel.p.y), false);
  assert.equal(nebel.welt.sieht('a', nebel.p.x, nebel.p.y), false);
  // Erkundet: die Karte ist bekannt, gesehen wird nur, was in Sicht ist.
  const erkundet = lauf('erkundet');
  assert.equal(erkundet.welt.erkundet('a', erkundet.p.x, erkundet.p.y), true, 'erkundet von Anfang an');
  assert.equal(erkundet.welt.sieht('a', erkundet.p.x, erkundet.p.y), false, 'aber nicht beobachtet');
  // Aufgedeckt: alles gesehen - aber nur auf der Karte.
  const offen = lauf('aufgedeckt');
  assert.equal(offen.welt.sieht('a', offen.p.x, offen.p.y), true, 'aufgedeckt sieht alles');
  assert.equal(offen.welt.sieht('a', -1, 0), false);
  // Der Browser erfaehrt es mit dem Aufbau.
  assert.equal(offen.welt.aufbau().sicht, 'aufgedeckt');
});

test('kampf AC-17: die Stadtwache gibt jedem eigenen Gebaeude vier Felder mehr Sicht', () => {
  const { VERBESSERUNGEN } = require('../server/spiele/strategie/daten.js');
  const welt = new Welt(ZWEI, 4711);
  const a = welt.spielerVon('a');
  const p = abseits(welt);
  const haus = welt.gebaeudeAnlegen('a', 'haus', p.x, p.y, true);
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === 'dorfzentrum');
  welt.sichtAktualisieren();
  const { x1, y0 } = welt.grundflaeche('haus', haus.x, haus.y);
  const weiter = GEBAEUDE.haus.sicht + VERBESSERUNGEN.stadtwache.gebaeude.sicht;
  assert.equal(weiter, 12, 'acht und vier');
  assert.equal(welt.sieht('a', x1 + weiter, y0), false, 'vorher sieht das Haus zwoelf Felder nicht');
  // Gegenprobe zur Regel: in der Dunklen Zeit gibt es sie nicht.
  a.nahrung = 1000;
  assert.ok(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: zentrum.id, einheit: 'stadtwache' }).fehler, 'Dunkle Zeit: abgewiesen');
  a.zeitalter = 1;
  assert.equal(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: zentrum.id, einheit: 'stadtwache' }).fehler, undefined, 'Feudalzeit: bestellt');
  assert.equal(a.nahrung, 1000 - VERBESSERUNGEN.stadtwache.kosten.nahrung, 'bezahlt');
  for (let t = 0; t < (VERBESSERUNGEN.stadtwache.zeit + 1) * TAKTE_PRO_SEKUNDE; t++) welt.takten();
  assert.ok(a.verbesserungen.includes('stadtwache'), 'erforscht');
  assert.equal(welt.sieht('a', x1 + weiter, y0), true, 'jetzt sieht das Haus zwoelf Felder');
  assert.equal(welt.sieht('a', x1 + weiter + 2, y0), false, 'aber nicht vierzehn');
  // Und Bert hat nichts davon.
  assert.equal(welt.gebaeudeSicht('b', 'haus'), GEBAEUDE.haus.sicht);
});

test('kampf AC-18: ein Aussenposten sieht zehn Felder - weiter als jedes andere Gebaeude', () => {
  const welt = new Welt(ZWEI, 4711);
  const a = welt.spielerVon('a');
  const p = abseits(welt);
  // Gegenprobe zur Zahl: alle anderen Gebaeude sehen weniger weit.
  for (const [art, w] of Object.entries(GEBAEUDE)) {
    if (art !== 'aussenposten') assert.ok(w.sicht < GEBAEUDE.aussenposten.sicht, `${art} sieht weniger weit`);
  }
  assert.deepEqual(
    [GEBAEUDE.aussenposten.groesse, GEBAEUDE.aussenposten.kosten.holz, GEBAEUDE.aussenposten.kosten.stein, GEBAEUDE.aussenposten.leben],
    [1, 25, 25, 500], 'Vorlage: ein Feld, 25 Holz, 25 Stein, 500 Leben',
  );
  // Gebaut wie jedes Gebaeude - ein Dorfbewohner baut ihn, Holz und Stein gehen ab.
  a.holz = 100;
  a.stein = 100;
  const bauer = welt.einheitAnlegen('a', p.x + 1, p.y, 'dorfbewohner');
  assert.equal(welt.nachricht('a', { auftrag: 'bauen', art: 'aussenposten', ziel: { x: p.x, y: p.y }, einheiten: [bauer.id] }).fehler, undefined);
  assert.deepEqual([a.holz, a.stein], [75, 75]);
  for (let t = 0; t < (GEBAEUDE.aussenposten.bauzeit + 5) * TAKTE_PRO_SEKUNDE; t++) welt.takten();
  const posten = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === 'aussenposten');
  assert.ok(posten?.fertig, 'fertig gebaut');
  welt.einheiten.delete(bauer.id);
  welt.sichtAktualisieren();
  assert.equal(welt.sieht('a', p.x + 10, p.y), true, 'zehn Felder weit');
  assert.equal(welt.sieht('a', p.x + 11, p.y), false, 'elf nicht');
});

test('kampf AC-13: ein fremdes Gebaeude kommt, wenn man es sieht - sein Verschwinden erst, wenn man wieder hinsieht', () => {
  const welt = new Welt(ZWEI, 4711);
  const p = abseits(welt);
  const zustand = () => welt.zustandJeSpieler(['a']).get('a');
  welt.aufbauFuer('a');
  zustand();
  // Bert baut abseits: Anna sieht es nicht, also bekommt sie es nicht.
  const haus = welt.gebaeudeAnlegen('b', 'haus', p.x, p.y, true);
  welt.sichtAktualisieren();
  assert.ok(!(zustand().gebaeude || []).some((g) => g.i === haus.id), 'ungesehen: nicht geschickt');
  // Annas Spaeher kommt hin: jetzt kommt es.
  const spaeher = welt.einheitAnlegen('a', p.x + 3, p.y, 'spaeherreiter');
  welt.sichtAktualisieren();
  assert.ok((zustand().gebaeude || []).some((g) => g.i === haus.id && !g.weg), 'gesehen: geschickt');
  // Er geht, und im Nebel faellt das Haus - Anna erfaehrt es nicht.
  welt.einheiten.delete(spaeher.id);
  welt.sichtAktualisieren();
  welt.gebaeudeZerstoeren(haus);
  welt.sichtAktualisieren();
  assert.ok(!(zustand().gebaeude || []).some((g) => g.i === haus.id), 'im Nebel gefallen: kein Wort');
  // Er kommt wieder: jetzt erfaehrt sie, dass es weg ist.
  welt.einheitAnlegen('a', p.x + 3, p.y, 'spaeherreiter');
  welt.sichtAktualisieren();
  assert.ok((zustand().gebaeude || []).some((g) => g.i === haus.id && g.weg), 'wieder gesehen: es ist weg');
  // Gegenprobe: aufgedeckt bekommt sie alles, wie es ist.
  const offen = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const zentrumBert = [...offen.gebaeude.values()].find((g) => g.besitzer === 'b');
  assert.ok(offen.aufbauFuer('a').gebaeude.some((g) => g.i === zentrumBert.id), 'aufgedeckt: Berts Dorfzentrum im Aufbau');
});

test('kampf AC-13: was im Nebel fertig wird oder faellt, kommt beim naechsten Hinsehen - Felder ebenso', () => {
  const welt = new Welt(ZWEI, 4711);
  const p = abseits(welt);
  const g = welt.karte.groesse;
  const zustand = () => welt.zustandJeSpieler(['a']).get('a');
  welt.aufbauFuer('a');
  zustand();
  // Anna sieht Berts Baustelle.
  const haus = welt.gebaeudeAnlegen('b', 'haus', p.x, p.y, false);
  const spaeher = welt.einheitAnlegen('a', p.x + 3, p.y, 'spaeherreiter');
  welt.sichtAktualisieren();
  assert.ok((zustand().gebaeude || []).some((x) => x.i === haus.id && x.u !== undefined), 'gesehen als Baustelle');
  // Sie geht; im Nebel wird das Haus fertig, und ein Feld daneben aendert sich.
  welt.einheiten.delete(spaeher.id);
  welt.sichtAktualisieren();
  haus.fertig = true;
  haus.bau = 1;
  welt.gebaeudeAenderungen.add(haus.id);
  const feld = (p.y + 1) * g + p.x + 3;
  welt.feldAenderungen.push({ i: feld, a: 0 });
  const imNebel = zustand();
  assert.ok(!(imNebel.gebaeude || []).some((x) => x.i === haus.id), 'im Nebel fertig: kein Wort');
  assert.ok(!imNebel.felder.some((f) => f.i === feld), 'Feld im Nebel: kein Wort');
  // Sie kommt wieder: das Haus kommt fertig, das Feld mit seinem Stand.
  welt.einheitAnlegen('a', p.x + 3, p.y, 'spaeherreiter');
  welt.sichtAktualisieren();
  const wieder = zustand();
  const gesehen = (wieder.gebaeude || []).find((x) => x.i === haus.id);
  assert.ok(gesehen && gesehen.u === undefined, 'wieder gesehen: fertig');
  assert.ok(wieder.felder.some((f) => f.i === feld), 'wieder gesehen: das Feld');
});

test('kampf AC-13: wer ausscheidet, bekommt einmal alle Gebaeude - sein Browser zeigt jetzt alles', () => {
  const welt = new Welt(ZWEI, 4711);
  const zustand = () => welt.zustandJeSpieler(['a']).get('a');
  const zentrumBert = [...welt.gebaeude.values()].find((x) => x.besitzer === 'b');
  assert.ok(!welt.aufbauFuer('a').gebaeude.some((x) => x.i === zentrumBert.id), 'im Nebel: nicht im Aufbau');
  zustand();
  welt.spielerVon('a').aus = true;
  assert.ok((zustand().gebaeude || []).some((x) => x.i === zentrumBert.id), 'ausgeschieden: Berts Dorfzentrum kommt');
  // Nur einmal - danach wieder nur Aenderungen.
  assert.ok(!(zustand().gebaeude || []).some((x) => x.i === zentrumBert.id), 'danach nicht jedes Mal');
});
