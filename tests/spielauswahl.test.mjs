// Die Uebersicht der Spiele: was der Server aus den Steckbriefen macht
// (→ specs/00-plattform/spielauswahl.md). Das Verzeichnis selbst ist ein
// Rechenteil; was der Browser bekommt, geht ueber den echten Anfrageweg.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beenden } from './hilfe.mjs';

const require = createRequire(import.meta.url);
const { starten } = require('../server/index.js');
const verzeichnis = require('../server/spiele/verzeichnis.js');

const HAFEN = 4285;
const ordner = mkdtempSync(join(tmpdir(), 'spielauswahl-'));

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
