// Die Uebersicht der Spiele: was der Server aus den Steckbriefen macht
// (→ specs/00-plattform/spielauswahl.md). Das Verzeichnis selbst ist ein
// Rechenteil; was der Browser bekommt, geht ueber den echten Anfrageweg.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beenden, istTyp, konto, kunde } from './hilfe.mjs';

const require = createRequire(import.meta.url);
const { starten } = require('../server/index.js');
const verzeichnis = require('../server/spiele/verzeichnis.js');
const einstellungen = require('../server/spiele/einstellungen.js');

const HAFEN = 4285;
const ordner = mkdtempSync(join(tmpdir(), 'spielauswahl-'));

let laufend;
let kekse;

before(async () => {
  laufend = await starten(HAFEN, {
    schutz: { verbindungenJeAdresse: 100, verbindungenJeMinute: 500, raeumeGesamt: 100, raeumeJeAdresse: 50 },
    konten: { datei: join(ordner, 'konten.sqlite'), geheimnis: 's'.repeat(48) },
  });
  kekse = (await konto(HAFEN, laufend, { name: 'Anna' })).kekse;
});

after(() => {
  if (laufend) beenden(laufend);
  try {
    rmSync(ordner, { recursive: true, force: true });
  } catch { /* Windows haelt die Datei gelegentlich noch einen Moment */ }
});

function steckbriefAblegen(wurzel, art, inhalt) {
  mkdirSync(join(wurzel, art), { recursive: true });
  writeFileSync(join(wurzel, art, 'steckbrief.js'), `module.exports = ${JSON.stringify(inhalt)};`);
}

test('auswahl AC-1: der Server nennt jedes Spiel mit Name, Satz und Spielerzahl', async () => {
  const antwort = await fetch(`http://localhost:${HAFEN}/api/spiele`);
  assert.equal(antwort.status, 200);
  const { spiele } = await antwort.json();
  assert.deepEqual(spiele.map((s) => s.art), ['strategie', 'manager']);
  for (const spiel of spiele) {
    assert.ok(spiel.name.length > 0, `${spiel.art} ohne Namen`);
    assert.ok(spiel.beschreibung.endsWith('.'), `${spiel.art}: die Beschreibung ist ein Satz`);
    assert.ok(spiel.spieler.von >= 1 && spiel.spieler.bis >= spiel.spieler.von);
  }
});

test('auswahl AC-2: ein neuer Steckbrief erscheint, ohne dass das Verzeichnis angefasst wird', () => {
  const wurzel = mkdtempSync(join(ordner, 'spiele-'));
  steckbriefAblegen(wurzel, 'hausbau', {
    art: 'hausbau',
    name: 'Hausbau',
    beschreibung: 'Ein Haus waechst Zimmer um Zimmer.',
    spieler: { von: 1, bis: 4 },
    stand: 'gesperrt',
    einstieg: { art: 'raum' },
  });
  // Ordner ohne Steckbrief sind kein Spiel.
  mkdirSync(join(wurzel, 'werkzeug'));

  const spiele = verzeichnis.lesen(wurzel);
  assert.deepEqual(spiele.map((s) => s.art), ['hausbau']);
  assert.equal(spiele[0].name, 'Hausbau');
});

test('auswahl AC-2: ein kaputter Steckbrief faellt beim Start auf, nicht erst im Browser', () => {
  const wurzel = mkdtempSync(join(ordner, 'kaputt-'));
  steckbriefAblegen(wurzel, 'halb', { art: 'halb', name: 'Halb', beschreibung: 'Fehlt was.', spieler: { von: 3, bis: 2 }, stand: 'spielbar', einstieg: { art: 'raum' } });
  assert.throws(() => verzeichnis.lesen(wurzel), /spieler/);
});

test('auswahl AC-3: der Stand eines Spiels kommt mit, und nur die drei bekannten', async () => {
  const { spiele } = await (await fetch(`http://localhost:${HAFEN}/api/spiele`)).json();
  const stand = Object.fromEntries(spiele.map((s) => [s.art, s.stand]));
  assert.deepEqual(stand, { strategie: 'im-bau', manager: 'spielbar' });

  const wurzel = mkdtempSync(join(ordner, 'stand-'));
  steckbriefAblegen(wurzel, 'raetsel', { art: 'raetsel', name: 'Raetsel', beschreibung: 'Unklar.', spieler: { von: 1, bis: 1 }, stand: 'bald', einstieg: { art: 'raum' } });
  assert.throws(() => verzeichnis.lesen(wurzel), /stand/);
});

// ---- Einstellungen -------------------------------------------------------

const LISTE = [
  { schluessel: 'spieler', name: 'Hoechstens Spieler', art: 'zahl', von: 2, bis: 6, vorgabe: 6 },
  { schluessel: 'tempo', name: 'Tempo', art: 'wahl', werte: [{ wert: 'ruhig', name: 'ruhig' }, { wert: 'schnell', name: 'schnell' }], vorgabe: 'ruhig' },
  { schluessel: 'startwert', name: 'Startwert', art: 'startwert', vorgabe: null },
];

// Eroeffnen ueber den echten Weg; liefert die erste Antwort: du oder fehler.
async function eroeffnen(nachricht) {
  const gast = kunde(HAFEN, kekse);
  await gast.offen();
  gast.senden({ typ: 'erstellen', ...nachricht });
  const antwort = await gast.warteAuf((n) => n.typ === 'du' || n.typ === 'fehler');
  return { gast, antwort };
}

test('auswahl AC-4: das Spiel liefert seine Einstellungen als Liste mit Name, Art, Vorgabe und Grenzen', async () => {
  const { spiele } = await (await fetch(`http://localhost:${HAFEN}/api/spiele`)).json();
  const strategie = spiele.find((s) => s.art === 'strategie');
  assert.deepEqual(strategie.einstellungen.map((e) => [e.schluessel, e.art]), [['spieler', 'zahl'], ['startwert', 'startwert']]);
  const zahl = strategie.einstellungen[0];
  assert.equal(typeof zahl.name, 'string');
  assert.deepEqual([zahl.von, zahl.bis, zahl.vorgabe], [2, 6, 6]);

  // Die Plattform kennt die Einstellungen nicht - nur die Arten. Eine Wahl,
  // die kein bestehendes Spiel hat, wird genauso geprueft.
  assert.deepEqual(einstellungen.pruefen(LISTE, { tempo: 'schnell' }).werte, { spieler: 6, tempo: 'schnell', startwert: null });
  assert.throws(() => einstellungen.listePruefen([{ schluessel: 'x', name: 'X', art: 'farbe' }], 'Test'), /art/);
  assert.throws(() => einstellungen.listePruefen([{ ...LISTE[0], vorgabe: 9 }], 'Test'), /vorgabe/);
});

test('auswahl AC-5: wer nichts einstellt, eroeffnet mit den Vorgaben und kann spielen', async () => {
  const { gast, antwort } = await eroeffnen({ art: 'strategie' });
  assert.equal(antwort.typ, 'du');
  const raum = await gast.warteAuf(istTyp('raum'));
  assert.deepEqual(raum.einstellungen, { spieler: 6, startwert: null });
  assert.equal(raum.art, 'strategie');

  const bert = kunde(HAFEN);
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: antwort.code, name: 'Bert' });
  await bert.warteAuf((n) => n.typ === 'raum' && n.spieler.length === 2);
  gast.senden({ typ: 'start' });
  const aufbau = await bert.warteAuf(istTyp('aufbau'));
  assert.ok(aufbau.karte, 'die Partie laeuft mit einer Karte');
  gast.zu();
  bert.zu();

  // Auch eine Seite, die noch gar keine Einstellungen schickt, eroeffnet.
  const alt = await eroeffnen({});
  assert.equal(alt.antwort.typ, 'du');
  alt.gast.zu();
});

test('auswahl AC-5: die eingestellte Spielerzahl begrenzt den Raum', async () => {
  const { gast, antwort } = await eroeffnen({ art: 'strategie', einstellungen: { spieler: 2 } });
  const bert = kunde(HAFEN);
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: antwort.code, name: 'Bert' });
  await bert.warteAuf(istTyp('du'));
  const carla = kunde(HAFEN);
  await carla.offen();
  carla.senden({ typ: 'beitreten', code: antwort.code, name: 'Carla' });
  assert.equal((await carla.warteAuf(istTyp('fehler'))).text, 'Der Raum ist voll.');
  for (const k of [gast, bert, carla]) k.zu();
});

test('auswahl AC-8: ungueltige Einstellungen weist der Server ab, bevor ein Raum entsteht', async () => {
  // Raeume frueherer Tests schliessen nebenher - gezaehlt wird, was neu ist.
  const vorher = new Set(laufend.raeume.nachCode.keys());
  const faelle = [
    [{ spieler: 9 }, /Hoechstens Spieler: erlaubt sind ganze Zahlen von 2 bis 6/],
    [{ spieler: 2.5 }, /Hoechstens Spieler/],
    [{ spieler: '4' }, /Hoechstens Spieler/],
    [{ startwert: 'abc' }, /Startwert der Karte/],
    [{ startwert: -1 }, /Startwert der Karte/],
    [{ startwert: 1e12 }, /Startwert der Karte/],
    [{ geheim: true }, /Diese Einstellung gibt es nicht/],
    [[1, 2], /unverstaendlich/],
    ['spieler=2', /unverstaendlich/],
  ];
  for (const [werte, meldung] of faelle) {
    const { gast, antwort } = await eroeffnen({ art: 'strategie', einstellungen: werte });
    assert.equal(antwort.typ, 'fehler', JSON.stringify(werte));
    assert.match(antwort.text, meldung);
    gast.zu();
  }
  for (const art of ['manager', 'hausbau', 42]) {
    const { gast, antwort } = await eroeffnen({ art });
    assert.equal(antwort.text, 'Dieses Spiel laesst sich nicht eroeffnen.');
    gast.zu();
  }
  const neu = [...laufend.raeume.nachCode.keys()].filter((code) => !vorher.has(code));
  assert.deepEqual(neu, [], 'kein Raum ist entstanden');

  // Und im Rechenteil: was fehlt, bekommt die Vorgabe; was passt, bleibt.
  assert.deepEqual(einstellungen.pruefen(LISTE, { spieler: 3, startwert: 4711 }).werte, { spieler: 3, tempo: 'ruhig', startwert: 4711 });
  assert.match(einstellungen.pruefen(LISTE, { tempo: 'rasend' }).fehler, /Tempo: erlaubt ist ruhig, schnell/);
});

test('auswahl AC-8: ein eingestellter Startwert gilt beim Start, nicht der aus der Nachricht', async () => {
  const karten = [];
  for (const nachricht of [42, 99]) {
    const { gast, antwort } = await eroeffnen({ art: 'strategie', einstellungen: { startwert: 4711 } });
    const bert = kunde(HAFEN);
    await bert.offen();
    bert.senden({ typ: 'beitreten', code: antwort.code, name: 'Bert' });
    await bert.warteAuf((n) => n.typ === 'raum' && n.spieler.length === 2);
    gast.senden({ typ: 'start', startwert: nachricht });
    karten.push(JSON.stringify((await gast.warteAuf(istTyp('aufbau'))).karte));
    gast.zu();
    bert.zu();
  }
  assert.equal(karten[0], karten[1]);
});
