// Der Betrieb (specs/20-betrieb): was der Server aus seiner Umgebung liest.
// Gestartet wird er hier so wie auf dem Server - als eigener Prozess mit
// `node server/index.js`, eingestellt nur ueber die Umgebung.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HAFEN = 4193;
const ADRESSE = 'https://spiel.example';
const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'onlinegames-betrieb-'));
const kontendatei = path.join(ordner, 'konten.sqlite');
let dienst;

before(async () => {
  dienst = spawn(process.execPath, ['server/index.js'], {
    cwd: wurzel,
    env: {
      ...process.env,
      PORT: String(HAFEN),
      HINTER_PROXY: '1',
      KONTEN_DATEI: kontendatei,
      KONTEN_GEHEIMNIS: 'b'.repeat(48),
      OEFFENTLICHE_ADRESSE: ADRESSE,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((bereit, gescheitert) => {
    let ausgabe = '';
    const uhr = setTimeout(() => gescheitert(new Error(`Der Server meldet sich nicht: ${ausgabe}`)), 20000);
    const lesen = (stueck) => {
      ausgabe += stueck;
      if (ausgabe.includes('laeuft auf')) { clearTimeout(uhr); bereit(); }
    };
    dienst.stdout.on('data', lesen);
    dienst.stderr.on('data', lesen);
    dienst.on('exit', (ende) => { clearTimeout(uhr); gescheitert(new Error(`Der Server endet mit ${ende}: ${ausgabe}`)); });
  });
});

after(async () => {
  if (dienst && dienst.exitCode === null) {
    const zu = new Promise((fertig) => dienst.on('exit', fertig));
    dienst.kill();
    await zu;
  }
  fs.rmSync(ordner, { recursive: true, force: true });
});

const holen = (pfad, mehr = {}) => fetch(`http://127.0.0.1:${HAFEN}${pfad}`, mehr);

test('betrieb AC-4: der Hafen kommt aus PORT, ohne Aenderung am Code', async () => {
  const antwort = await holen('/api/spiele');
  assert.equal(antwort.status, 200);
  const { spiele } = await antwort.json();
  assert.ok(spiele.length >= 1, 'der Server nennt seine Spiele');
});

test('betrieb AC-7: die Konten liegen, wo KONTEN_DATEI hinzeigt - ausserhalb des Programmordners', () => {
  assert.ok(fs.existsSync(kontendatei), 'die Kontendatei ist am genannten Ort angelegt');
  assert.ok(!path.resolve(kontendatei).startsWith(path.resolve(wurzel) + path.sep), 'sie liegt nicht im Programmordner');
});

test('betrieb AC-1: hinter dem Proxy gilt die oeffentliche Adresse - eine fremde Herkunft meldet niemanden an', async () => {
  const anmelden = (herkunft) => holen('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: herkunft, 'X-Forwarded-For': '203.0.113.7', Cookie: 'onlinegames.x=1' },
    body: JSON.stringify({ email: 'niemand@example.com', password: 'falsch-und-lang-genug' }),
  });
  const fremd = await anmelden('https://boese.example');
  assert.equal(fremd.status, 403, 'eine fremde Herkunft wird abgewiesen');
  const eigen = await anmelden(ADRESSE);
  assert.equal(eigen.status, 401, 'von der eigenen Adresse kommt die Anfrage bis zur Kennwortpruefung');
});

test('betrieb AC-8: die Zahlen des Betriebs gibt es nur vom Rechner selbst, nie ueber den Proxy', async () => {
  const oertlich = await holen('/betrieb/zahlen');
  assert.equal(oertlich.status, 200);
  const zahlen = await oertlich.json();
  assert.deepEqual(Object.keys(zahlen).sort(), ['partien', 'raeume', 'verbunden']);
  assert.equal(zahlen.partien, 0);
  assert.equal(zahlen.raeume, 0);
  // Was ueber den Proxy kommt, traegt die Adresse des Fragenden im Kopf.
  const durchProxy = await holen('/betrieb/zahlen', { headers: { 'X-Forwarded-For': '203.0.113.7' } });
  assert.equal(durchProxy.status, 404);
});

test('betrieb AC-2: die Betriebsdatei schaltet HINTER_PROXY ein und legt die Konten nach /daten', () => {
  const datei = fs.readFileSync(path.join(wurzel, 'betrieb', 'docker-compose.yml'), 'utf8');
  assert.match(datei, /HINTER_PROXY:\s*"1"/);
  assert.match(datei, /KONTEN_DATEI:\s*\/daten\/konten\.sqlite/);
  assert.match(datei, /-\s*\.\/daten:\/daten/);
  // Nach Absturz und nach Neustart der Maschine von selbst (betrieb AC-3).
  assert.match(datei, /restart:\s*unless-stopped/);
  // Adressen stehen nicht im Repository.
  assert.doesNotMatch(datei, /https?:\/\/[a-z0-9]/i);
});
