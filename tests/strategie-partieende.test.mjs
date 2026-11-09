// Partieende: ausgeschieden, Sieger, Aufgeben, unentschieden
// (→ specs/10-strategie/spielziel.md AC-5, AC-6).
//
// Geprueft wird gegen die Welt, nicht ueber das Netz: die Entscheidung faellt
// im Takt des Servers und ist ein reiner Rechenteil (ADR-0004). Was ueber die
// Leitung geht - die Nachricht `aufgeben` und das Ende im Zustand -, prueft
// `tests/raeume-spiel.test.mjs`.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE, ZEITGRENZEN } = require('../server/spiele/strategie/welt.js');
const STECKBRIEF = require('../server/spiele/strategie/steckbrief.js');

const ZWEI = [{ id: 'a1', name: 'Anna' }, { id: 'b1', name: 'Bert' }];

function welt(startwert = 4711, liste = ZWEI, einstellungen = {}) {
  return new Welt(liste, startwert, einstellungen);
}

/** Die Uhr auf eine Spielminute stellen und das Ende pruefen. */
function bei(w, minuten) {
  w.takt = Math.round(minuten * 60 * TAKTE_PRO_SEKUNDE);
  w.endePruefen();
  return w.ende;
}

/** Alles wegnehmen, was diesem Spieler gehoert - wie ein verlorener Kampf. */
function allesVerlieren(w, spielerId) {
  for (const e of w.einheiten.values()) if (e.besitzer === spielerId) w.einheitSterben(e);
  for (const g of [...w.gebaeude.values()]) if (g.besitzer === spielerId) w.gebaeudeZerstoeren(g);
}

test('spielziel AC-5: wer keine Einheit und kein Gebaeude mehr hat, ist ausgeschieden', () => {
  const w = welt();
  assert.equal(w.imBestand('b1'), true, 'zu Beginn hat jeder Dorfzentrum und Dorfbewohner');
  allesVerlieren(w, 'b1');
  assert.equal(w.imBestand('b1'), false);
  w.takten();
  assert.equal(w.spielerVon('b1').aus, true);
  assert.equal(w.spielerVon('a1').aus, false, 'Anna hat nichts verloren');
});

test('spielziel AC-5: eine Farm allein haelt niemanden im Spiel, ein Haus schon', () => {
  const w = welt();
  allesVerlieren(w, 'b1');
  // Die Farm zaehlt nicht zum Bestand (`bestand: false` an den Daten), das
  // Haus schon - obwohl beide nichts ausbilden. Die Gegenprobe gehoert dazu:
  // sonst wuerde der Test auch halten, wenn gar kein Gebaeude zaehlte.
  w.gebaeudeAnlegen('b1', 'farm', w.spielerVon('b1').basis.x + 6, w.spielerVon('b1').basis.y + 6);
  const farm = [...w.gebaeude.values()].find((g) => g.besitzer === 'b1' && g.art === 'farm');
  assert.ok(farm, 'die Farm steht - sonst prueft der Rest nichts');
  assert.equal(w.imBestand('b1'), false, 'eine Farm haelt niemanden im Spiel');
  w.gebaeudeZerstoeren(farm);
  w.gebaeudeAnlegen('b1', 'haus', w.spielerVon('b1').basis.x + 6, w.spielerVon('b1').basis.y + 6);
  assert.equal(w.imBestand('b1'), true, 'ein Haus schon');
});

test('spielziel AC-5: ein Toter haelt nicht im Spiel, er liegt nur noch da', () => {
  const w = welt();
  for (const g of [...w.gebaeude.values()]) if (g.besitzer === 'b1') w.gebaeudeZerstoeren(g);
  const seine = [...w.einheiten.values()].filter((e) => e.besitzer === 'b1');
  assert.ok(seine.length >= 3, `Bert beginnt mit Dorfbewohnern, hat ${seine.length}`);
  for (const e of seine) w.einheitSterben(e);
  // Die Toten liegen noch zwei Sekunden im Bild (kampf AC-10) - sie stehen
  // also noch in `welt.einheiten`, zaehlen aber nicht mehr.
  assert.ok([...w.einheiten.values()].some((e) => e.besitzer === 'b1' && e.tot));
  assert.equal(w.imBestand('b1'), false);
});

test('spielziel AC-5: bleibt einer uebrig, endet die Partie in demselben Takt', () => {
  const w = welt();
  w.takten();
  assert.equal(w.ende, null, 'solange beide etwas haben, laeuft sie');
  allesVerlieren(w, 'b1');
  const vorher = w.takt;
  w.takten();
  assert.deepEqual(
    { sieger: w.ende.sieger, grund: w.ende.grund, takt: w.ende.takt },
    { sieger: 'a1', grund: 'eroberung', takt: vorher + 1 },
  );
  assert.equal(w.vorbei, true, 'daran haelt der Raum seine Uhr an');
});

test('spielziel AC-5: eine entschiedene Partie rechnet nicht weiter', () => {
  const w = welt();
  allesVerlieren(w, 'b1');
  w.takten();
  const takt = w.takt;
  for (let i = 0; i < 20; i++) w.takten();
  assert.equal(w.takt, takt, 'der Takt steht');
});

test('spielziel AC-5: nach 90 Spielminuten endet die Partie unentschieden', () => {
  // Die 90 Minuten sind seit spielziel AC-22 eine Einstellung - hier
  // ausdruecklich mitgegeben.
  const w = welt(4711, ZWEI, { zeitgrenze: 90 });
  // Nicht 54.000 Takte rechnen, sondern die Uhr vorstellen: geprueft wird die
  // Grenze, nicht der Weg dorthin. Eine Sekunde davor steht sie noch.
  w.takt = (90 * 60 - 1) * TAKTE_PRO_SEKUNDE;
  w.endePruefen();
  assert.equal(w.ende, null, 'eine Sekunde vor der Grenze laeuft sie noch');
  w.takt = 90 * 60 * TAKTE_PRO_SEKUNDE;
  w.endePruefen();
  assert.deepEqual({ sieger: w.ende.sieger, grund: w.ende.grund }, { sieger: null, grund: 'zeit' });
  assert.equal(w.spielerVon('a1').aus, false, 'unentschieden heisst: keiner ist ausgeschieden');
});

test('spielziel AC-6: wer aufgibt, verliert alles und gilt als ausgeschieden', () => {
  const w = welt(4711, [...ZWEI, { id: 'c1', name: 'Cora' }]);
  const seine = [...w.einheiten.values()].filter((e) => e.besitzer === 'b1').length;
  assert.ok(seine > 0 && [...w.gebaeude.values()].some((g) => g.besitzer === 'b1'));
  assert.deepEqual(w.aufgeben('b1'), {});
  assert.equal(w.spielerVon('b1').aus, true);
  assert.equal([...w.gebaeude.values()].filter((g) => g.besitzer === 'b1').length, 0, 'kein Gebaeude mehr');
  assert.equal([...w.einheiten.values()].filter((e) => e.besitzer === 'b1' && !e.tot).length, 0, 'keine lebende Einheit mehr');
  // Gefallen, nicht verschwunden: die anderen sollen sehen, was passiert ist.
  assert.equal([...w.einheiten.values()].filter((e) => e.besitzer === 'b1' && e.tot).length, seine);
  assert.equal(w.ende, null, 'zu dritt laeuft die Partie fuer die anderen weiter');
});

test('spielziel AC-6: gibt der Vorletzte auf, gewinnt der Letzte', () => {
  const w = welt(4711, [...ZWEI, { id: 'c1', name: 'Cora' }]);
  w.aufgeben('c1');
  assert.equal(w.ende, null);
  w.aufgeben('b1');
  assert.deepEqual({ sieger: w.ende.sieger, grund: w.ende.grund }, { sieger: 'a1', grund: 'eroberung' });
});

test('spielziel AC-6: zweimal aufgeben und Aufgeben nach dem Ende sagen ab', () => {
  const w = welt();
  assert.deepEqual(w.aufgeben('b1'), {});
  // Bert hat aufgegeben, damit ist die Partie entschieden - beide Absagen
  // zeigen, dass danach nichts mehr geht.
  assert.match(w.aufgeben('b1').fehler, /zu Ende/);
  assert.match(w.aufgeben('a1').fehler, /zu Ende/);
  assert.match(w.aufgeben('gibtesnicht').fehler, /nicht/);
});

test('spielziel AC-6: aufgeben kommt ueber dieselbe Nachricht wie jeder Auftrag', () => {
  const w = welt();
  assert.deepEqual(w.nachricht('b1', { auftrag: 'aufgeben' }), {});
  assert.equal(w.spielerVon('b1').aus, true);
});

test('spielziel AC-5: das Ende steht im Zustand und im Aufbau', () => {
  const w = welt();
  assert.equal(w.zustand().ende, undefined, 'solange sie laeuft, steht nichts da');
  w.aufgeben('b1');
  const zustand = w.zustand();
  assert.equal(zustand.ende.sieger, 'a1');
  assert.equal(zustand.spieler.find((s) => s.id === 'b1').aus, 1);
  assert.equal(zustand.spieler.find((s) => s.id === 'a1').aus, undefined);
  // Wer nach dem Ende zurueckkommt, bekommt es im Aufbau (raeume AC-12).
  assert.equal(w.aufbau().ende.sieger, 'a1');
});

test('spielziel AC-7: wer ausgeschieden ist, bekommt weiter den ganzen Zustand', () => {
  const w = welt(4711, [...ZWEI, { id: 'c1', name: 'Cora' }]);
  w.aufgeben('c1');
  // Die Partie laeuft: der Takt steigt, obwohl einer ausgeschieden ist.
  const vorher = w.takt;
  for (let i = 0; i < 20; i++) w.takten();
  assert.equal(w.takt, vorher + 20, 'eine Partie zu dritt rechnet nach einem Ausscheiden weiter');

  // Und Cora sieht sie: der Zustand ist fuer sie derselbe wie fuer die
  // anderen - mit den Einheiten und Gebaeuden, die noch im Spiel sind.
  const zustand = w.zustand();
  assert.equal(zustand.ende, undefined, 'kein Ende, solange zwei spielen');
  assert.equal(zustand.spieler.find((s) => s.id === 'c1').aus, 1, 'sie weiss, dass sie draussen ist');
  const fremde = zustand.einheiten.filter((e) => e.b !== 'c1' && !e.s).length;
  const fremdeGebaeude = (zustand.gebaeude || []).filter((g) => g.b !== 'c1').length;
  assert.ok(fremde > 0, `fremde lebende Einheiten im Zustand, gezaehlt ${fremde}`);
  assert.ok(fremdeGebaeude > 0, `fremde Gebaeude im Zustand, gezaehlt ${fremdeGebaeude}`);
  assert.equal(zustand.einheiten.filter((e) => e.b === 'c1' && !e.s).length, 0, 'von ihr lebt nichts');
});

// ---- Die Tafel am Ende (spielziel AC-8) ----------------------------------

test('spielziel AC-8: gesammelt wird gezaehlt, wenn abgeladen wird - nicht, was zurueckkommt', () => {
  const w = welt();
  const spieler = w.spielerVon('a1');
  assert.deepEqual(spieler.gesammelt, { holz: 0, nahrung: 0, gold: 0, stein: 0 });

  // Einen Dorfbewohner mit Ladung an sein Dorfzentrum stellen und abladen
  // lassen - derselbe Weg, den das Sammeln nimmt.
  const einheit = [...w.einheiten.values()].find((e) => e.besitzer === 'a1');
  const lager = [...w.gebaeude.values()].find((g) => g.besitzer === 'a1');
  einheit.x = lager.x;
  einheit.y = lager.y;
  einheit.ladung = 10;
  einheit.ladungsart = 'holz';
  // Mit Auftrag, denn `abladen` schickt danach zurueck an die Arbeit: im
  // Spiel kommt es nur aus dem Takt eines Sammelauftrags, nie ohne.
  einheit.auftrag = { art: 'sammeln', feld: [...w.karte.vorrat.keys()][0] };
  const vorrat = spieler.holz;
  w.abladen(einheit);
  assert.equal(spieler.holz, vorrat + 10, 'der Vorrat steigt');
  assert.equal(spieler.gesammelt.holz, 10, 'und es ist mitgezaehlt');

  // Ein abgebrochener Auftrag gibt Rohstoffe zurueck. Gesammelt ist das
  // nicht: sonst liesse sich die Tafel durch Bestellen und Abbrechen fuellen.
  const vorHolz = spieler.gesammelt.holz;
  const vorNahrung = spieler.gesammelt.nahrung;
  w.nachricht('a1', { typ: 'befehl', auftrag: 'ausbilden', gebaeude: lager.id, einheit: 'dorfbewohner' });
  w.nachricht('a1', { typ: 'befehl', auftrag: 'abbrechen', gebaeude: lager.id, platz: 0 });
  assert.equal(spieler.gesammelt.holz, vorHolz);
  assert.equal(spieler.gesammelt.nahrung, vorNahrung);
});

test('spielziel AC-8: ausgebildet zaehlt nur, wer aus einem Gebaeude kommt', () => {
  const w = welt();
  const spieler = w.spielerVon('a1');
  const amAnfang = [...w.einheiten.values()].filter((e) => e.besitzer === 'a1').length;
  assert.ok(amAnfang > 0, 'die Partie beginnt mit Dorfbewohnern');
  assert.equal(spieler.ausgebildet, 0, 'die vom Anfang hat niemand ausgebildet');

  const lager = [...w.gebaeude.values()].find((g) => g.besitzer === 'a1' && g.art === 'dorfzentrum');
  spieler.nahrung += 1000;
  assert.deepEqual(w.nachricht('a1', { typ: 'befehl', auftrag: 'ausbilden', gebaeude: lager.id, einheit: 'dorfbewohner' }), {});
  // Bis der Dorfbewohner fertig ist, dauert es - so lange takten.
  for (let i = 0; i < 30 * TAKTE_PRO_SEKUNDE && spieler.ausgebildet === 0; i++) w.takten();
  assert.equal(spieler.ausgebildet, 1, 'genau einer ist dazugekommen');
  assert.equal([...w.einheiten.values()].filter((e) => e.besitzer === 'a1').length, amAnfang + 1);
});

test('spielziel AC-8: verloren zaehlt jede eigene gefallene Einheit', () => {
  const w = welt();
  const spieler = w.spielerVon('b1');
  const seine = [...w.einheiten.values()].filter((e) => e.besitzer === 'b1').length;
  assert.equal(spieler.verloren, 0);
  // Wer aufgibt, verliert alles auf einmal - gefallen ist gefallen.
  w.aufgeben('b1');
  assert.equal(spieler.verloren, seine);
  assert.equal(w.spielerVon('a1').verloren, 0, 'der andere hat nichts verloren');
});

test('spielziel AC-8: die Tafel steht im Ende, mit Zahlen fuer jeden', () => {
  const w = welt();
  const anna = w.spielerVon('a1');
  anna.gesammelt = { holz: 120, nahrung: 80, gold: 0, stein: 40 };
  anna.ausgebildet = 3;
  anna.zeitalter = 1;
  const seine = [...w.einheiten.values()].filter((e) => e.besitzer === 'b1').length;

  w.aufgeben('b1');
  const tafel = w.ende.tafel;
  assert.equal(tafel.length, 2, 'eine Zeile je Spieler');
  const ihre = tafel.find((z) => z.id === 'a1');
  assert.deepEqual(ihre.gesammelt, { holz: 120, nahrung: 80, gold: 0, stein: 40 });
  assert.equal(ihre.ausgebildet, 3);
  assert.equal(ihre.zeitalter, 1);
  assert.equal(ihre.aus, undefined, 'sie ist nicht ausgeschieden');

  // Und die des Ausgeschiedenen: seine Zahlen bleiben stehen, obwohl von ihm
  // nichts mehr auf der Karte ist. Genau dafuer wird mitgezaehlt.
  const berts = tafel.find((z) => z.id === 'b1');
  assert.equal(berts.verloren, seine);
  assert.equal(berts.aus, 1);

  // Die Tafel ist eine Abschrift, kein Verweis: was danach geschieht, aendert
  // sie nicht mehr.
  anna.ausgebildet = 99;
  assert.equal(w.ende.tafel.find((z) => z.id === 'a1').ausgebildet, 3);
});

test('spielziel AC-8: die Tafel kommt im Zustand und im Aufbau mit', () => {
  const w = welt();
  w.aufgeben('b1');
  assert.equal(w.zustand().ende.tafel.length, 2);
  assert.equal(w.aufbau().ende.tafel.length, 2, 'auch fuer einen, der zurueckkommt');
  // Die Dauer steht als Takt daran - der Browser macht daraus die Spielzeit.
  assert.equal(Number.isInteger(w.ende.takt), true);
});

// ---- Die Zeitgrenze als Einstellung (spielziel AC-22, Runde 157) --------------

test('spielziel AC-22: beim Eroeffnen keine, 90 oder 120 Spielminuten, Vorgabe keine', () => {
  const e = STECKBRIEF.einstellungen.find((x) => x.schluessel === 'zeitgrenze');
  assert.ok(e, 'die Einstellung steht im Steckbrief');
  assert.equal(e.art, 'wahl');
  assert.equal(e.vorgabe, 0, 'Vorgabe: keine Grenze');
  // Was die Welt kennt, steht zur Wahl - und umgekehrt.
  assert.deepEqual(e.werte.map((w) => w.wert).filter((w) => w > 0), ZEITGRENZEN);
  assert.equal(e.werte.find((w) => w.wert === e.vorgabe).name, 'keine');
});

test('spielziel AC-22: ohne Grenze laeuft die Partie auch nach 200 Minuten weiter', () => {
  // Die Vorgabe des Steckbriefs (0) und gar keine Angabe heissen dasselbe.
  for (const einstellungen of [{}, { zeitgrenze: 0 }]) {
    const w = welt(4711, ZWEI, einstellungen);
    assert.equal(w.zeitgrenze, null);
    assert.equal(bei(w, 90), null, '90 Minuten sind keine Grenze mehr');
    assert.equal(bei(w, 200), null, 'auch 200 nicht');
  }
});

test('spielziel AC-22: mit 120 Minuten endet sie nach 120 unentschieden, nicht nach 90', () => {
  const w = welt(4711, ZWEI, { zeitgrenze: 120 });
  assert.equal(bei(w, 90), null, 'nach 90 laeuft sie noch');
  assert.equal(bei(w, 120 - 1 / 60), null, 'eine Sekunde vor 120 auch');
  const ende = bei(w, 120);
  assert.deepEqual({ sieger: ende.sieger, grund: ende.grund }, { sieger: null, grund: 'zeit' });
});

test('spielziel AC-22: eine Grenze, die es nicht zur Wahl gibt, heisst keine', () => {
  // Der Raum prueft die Wahl gegen den Steckbrief (spielauswahl AC-8); die
  // Welt verlaesst sich nicht darauf und erfindet keine Grenze.
  for (const zeitgrenze of [1, 45, '90', -90, null]) {
    assert.equal(welt(4711, ZWEI, { zeitgrenze }).zeitgrenze, null, String(zeitgrenze));
  }
});

test('spielziel AC-22: die Grenze geht mit dem Aufbau an den Browser', () => {
  assert.equal(welt(4711, ZWEI, { zeitgrenze: 90 }).aufbau('a1').zeitgrenze, 90);
  assert.equal(welt(4711, ZWEI, {}).aufbau('a1').zeitgrenze, null);
});
