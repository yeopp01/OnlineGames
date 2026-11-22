// Waechter: TypeScript prueft die JavaScript-Dateien (`npm run typen`), und
// es meldet nichts.
//
// Warum es diesen Waechter gibt: bis hierher fing nur ein Test einen
// vertippten Feldnamen - und oft erst der Browserlauf nach zwanzig Minuten
// (Runde 60: `zeitalter` stand in den Daten und fehlte im Aufbau; `e.id`
// statt des Schluessels der Map waehlte nichts aus). Die Dateien bleiben
// JavaScript, gebaut wird nichts: der Pruefer liest die Typangaben in den
// Kommentaren und die Formen der Tabellen in `daten.js`.
//
// Geprueft wird nur, was in der ersten Zeile `// @ts-check` traegt. Damit
// das nicht still zurueckfaellt, haelt dieser Waechter zwei Listen fest: im
// Server fehlt die Marke nur den Dateien unter `OFFEN_SERVER`, im Browser
// denen unter `OFFEN` - je mit dem Grund, warum sie noch fehlen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = fileURLToPath(new URL('..', import.meta.url));
const TSC = join(WURZEL, 'node_modules', 'typescript', 'bin', 'tsc');
const MARKE = '// @ts-check';

// Im Browser noch ohne Marke. Wer eine Datei hier streicht, setzt ihr die
// Marke - und umgekehrt; beides prueft der Fall unten.
const OFFEN = {
  // Warten auf das Zusammenfuehren von `strategie-bildumbau`: dort sind diese
  // Dateien stark veraendert, jede Zeile hier waere ein Konflikt. Gemessen am
  // 2026-11-13 auf `strategie`: ansicht.js 24 Meldungen, app.js 26,
  // tasten.js 3, gelaende.js 3, boden.js 1.
  'ansicht.js': 'nach dem Zusammenfuehren',
  'app.js': 'nach dem Zusammenfuehren',
  'tasten.js': 'nach dem Zusammenfuehren',
  'gelaende.js': 'nach dem Zusammenfuehren',
  'boden.js': 'nach dem Zusammenfuehren',
  // Auf `strategie-bildumbau` entstanden, bevor es den Pruefer gab - noch
  // nicht durchgesehen.
  'bilder.js': 'neu vom Bildumbau, noch nicht durchgesehen',
  'bildprobe.js': 'neu vom Bildumbau, noch nicht durchgesehen',
  'ton.js': 'neu vom Bildumbau, noch nicht durchgesehen',
  // Der Zeichencode gehoert der Blender-Sitzung und wird von den gerenderten
  // Bildern abgeloest (ADR-0016).
  'figuren.js': 'Zeichencode, wird abgeloest',
  'gebaeude.js': 'Zeichencode, wird abgeloest',
  'schautafel.js': 'Zeichencode, wird abgeloest',
  // Wird in M0.7 in Module zerlegt (docs/manager/plan.md) - dann je Modul.
  'manager.js': 'wird in M0.7 zerlegt',
};

// Im Server noch ohne Marke: die vier Teile der Karriere. Sie sind Klassen,
// deren Methoden karriere.js auf eine zusammensetzt - in jedem Teil kennt der
// Pruefer `this` nur als diesen Teil, nicht als die ganze Karriere (gezaehlt
// am 2026-11-22: rund 250 Meldungen, fast alle "Property ... does not
// exist"). Wer eine Karriere von aussen bekommt, ist geprueft: `GanzeKarriere`
// in karriere.js setzt Zustand und Teile zusammen.
const OFFEN_SERVER = {
  'server/spiele/manager/welt.js': 'Teil der Karriere, `this` ungeprueft',
  'server/spiele/manager/ablauf.js': 'Teil der Karriere, `this` ungeprueft',
  'server/spiele/manager/zuege.js': 'Teil der Karriere, `this` ungeprueft',
  'server/spiele/manager/sicht.js': 'Teil der Karriere, `this` ungeprueft',
  'server/spiele/manager/live.js': 'Teil der Karriere, `this` ungeprueft',
};

function pruefen(...argumente) {
  const lauf = spawnSync(process.execPath, [TSC, ...argumente, '--pretty', 'false'], { cwd: WURZEL, encoding: 'utf8' });
  return { ausgang: lauf.status, text: `${lauf.stdout}${lauf.stderr}`.trim() };
}

function dateien(ordner) {
  const raus = [];
  for (const eintrag of readdirSync(ordner)) {
    const pfad = join(ordner, eintrag);
    if (statSync(pfad).isDirectory()) raus.push(...dateien(pfad));
    else if (pfad.endsWith('.js')) raus.push(pfad);
  }
  return raus;
}

const traegtMarke = (pfad) => readFileSync(pfad, 'utf8').startsWith(MARKE);
const kurz = (pfad) => relative(WURZEL, pfad).split(sep).join('/');

test('waechter: der Pruefer meldet im Server nichts', () => {
  const { ausgang, text } = pruefen('-p', 'tsconfig.json');
  assert.equal(text, '');
  assert.equal(ausgang, 0);
});

test('waechter: der Pruefer meldet im Browser nichts', () => {
  const { ausgang, text } = pruefen('-p', 'public/tsconfig.json');
  assert.equal(text, '');
  assert.equal(ausgang, 0);
});

test('waechter: im Server fehlt die Marke nur den Dateien unter OFFEN_SERVER', () => {
  const alle = dateien(join(WURZEL, 'server'));
  assert.ok(alle.length >= 30, `nur ${alle.length} Dateien gefunden`);
  assert.deepEqual(alle.filter((pfad) => !traegtMarke(pfad)).map(kurz).sort(), Object.keys(OFFEN_SERVER).sort());
});

test('waechter: im Browser fehlt die Marke nur den Dateien unter OFFEN', () => {
  const alle = readdirSync(join(WURZEL, 'public')).filter((name) => name.endsWith('.js'));
  const ohne = alle.filter((name) => !traegtMarke(join(WURZEL, 'public', name)));
  assert.deepEqual(ohne.sort(), Object.keys(OFFEN).filter((name) => alle.includes(name)).sort());
});

test('waechter: der Pruefer findet einen vertippten Feldnamen - aber nur mit Marke', () => {
  // Gegenprobe: dieselbe Datei mit und ohne Marke. Ohne sie bleibt der
  // Tippfehler stehen - deshalb die zwei Listen oben.
  const ordner = mkdtempSync(join(tmpdir(), 'typen-'));
  try {
    const rumpf = 'const einheit = { leben: 25 };\neinheit.lebn = 30;\n';
    writeFileSync(join(ordner, 'mit.js'), `${MARKE}\n${rumpf}`);
    writeFileSync(join(ordner, 'ohne.js'), rumpf);
    // `--ignoreConfig`: die Datei steht auf der Befehlszeile, die
    // `tsconfig.json` des Projekts gilt fuer sie nicht.
    const schalter = ['--ignoreConfig', '--allowJs', '--noEmit'];
    const mit = pruefen(...schalter, join(ordner, 'mit.js'));
    assert.match(mit.text, /mit\.js\(3,9\): error TS2551: .*'lebn'.*'leben'/);
    assert.notEqual(mit.ausgang, 0);
    const ohne = pruefen(...schalter, join(ordner, 'ohne.js'));
    assert.equal(ohne.text, '');
    assert.equal(ohne.ausgang, 0);
  } finally {
    rmSync(ordner, { recursive: true, force: true });
  }
});
