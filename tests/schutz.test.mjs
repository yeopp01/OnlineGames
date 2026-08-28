// Grenzen gegen Fremdnutzung. Hier laufen die Werte absichtlich winzig,
// damit sie in einem Test ausloesen statt erst nach Minuten.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import WebSocket from 'ws';
import { konto } from './hilfe.mjs';

const require = createRequire(import.meta.url);
const { starten } = require('../server/index.js');
const { Schutz, Eimer } = require('../server/schutz.js');

const HAFEN = 4198;
let laufend;
let kekse;

before(async () => {
  laufend = await starten(HAFEN, {
    schutz: {
      verbindungenJeAdresse: 4,
      verbindungenJeMinute: 100,
      fehlversucheJeMinute: 3,
      raeumeGesamt: 100,
      raeumeJeAdresse: 2,
    },
    konten: { datei: ':memory:', geheimnis: 'p'.repeat(48) },
  });
  const angelegt = await konto(HAFEN, laufend, { name: 'Anna' });
  kekse = angelegt.kekse;
});

after(() => {
  laufend.zugang.schliessen();
  laufend.schutz.halt();
  laufend.raeume.halt();
  laufend.wss.close();
  laufend.server.close();
});

function verbinde(angemeldet = false) {
  const draht = new WebSocket(`ws://localhost:${HAFEN}`, {
    headers: angemeldet ? { cookie: kekse } : {},
  });
  const eingang = [];
  draht.on('message', (roh) => eingang.push(JSON.parse(roh.toString())));
  return {
    draht,
    eingang,
    senden: (n) => draht.send(JSON.stringify(n)),
    offen: () => new Promise((fertig, scheitern) => {
      draht.on('open', fertig);
      draht.on('error', scheitern);
    }),
    zuende: () => new Promise((fertig) => draht.on('close', (code) => fertig(code))),
    zu: () => draht.close(),
  };
}

const warte = (ms) => new Promise((fertig) => setTimeout(fertig, ms));

test('schutz AC-1: der tropfende Eimer laeuft nach und begrenzt die Spitze', () => {
  let jetzt = 0;
  const eimer = new Eimer(10, 3, jetzt); // 10 je Sekunde, hoechstens 3 auf Vorrat

  assert.equal(eimer.nimm(jetzt), true);
  assert.equal(eimer.nimm(jetzt), true);
  assert.equal(eimer.nimm(jetzt), true);
  assert.equal(eimer.nimm(jetzt), false, 'der Vorrat ist aufgebraucht');

  jetzt += 100; // eine Zehntelsekunde: genau ein Tropfen
  assert.equal(eimer.nimm(jetzt), true);
  assert.equal(eimer.nimm(jetzt), false);

  jetzt += 10_000; // lange Pause fuellt nicht ueber die Spitze hinaus
  assert.equal(eimer.nimm(jetzt), true);
  assert.equal(eimer.nimm(jetzt), true);
  assert.equal(eimer.nimm(jetzt), true);
  assert.equal(eimer.nimm(jetzt), false, 'hoechstens die Spitze, nicht mehr');
});

test('schutz AC-2: zu viele gleichzeitige Verbindungen einer Adresse werden abgewiesen', async () => {
  const offene = [];
  for (let i = 0; i < 4; i++) {
    const k = verbinde();
    await k.offen();
    offene.push(k);
  }

  const zuviel = verbinde();
  await assert.rejects(zuviel.offen(), /Unexpected server response: 429/);

  for (const k of offene) k.zu();
  await warte(100);
});

test('schutz AC-3: nach zu vielen falschen Raumcodes wird getrennt', async () => {
  const k = verbinde();
  await k.offen();

  for (let i = 0; i < 3; i++) k.senden({ typ: 'beitreten', code: 'ZZZZZZ', name: 'Fremd' });
  await warte(150);
  assert.equal(k.draht.readyState, WebSocket.OPEN, 'drei Versuche sind noch erlaubt');

  k.senden({ typ: 'beitreten', code: 'ZZZZZZ', name: 'Fremd' });
  const code = await k.zuende();
  assert.equal(code, 1008, 'der vierte Versuch trennt die Verbindung');

  // Und die Meldung verraet nie, ob es den Raum gibt.
  const meldungen = k.eingang.filter((n) => n.typ === 'fehler').map((n) => n.text);
  assert.ok(meldungen.every((t) => t === 'Diesen Raumcode gibt es nicht.'));
  await warte(100);
});

test('schutz AC-4: eine Adresse haelt nur begrenzt viele Partien offen', async () => {
  const eroeffner = [];
  for (let i = 0; i < 2; i++) {
    const k = verbinde(true);
    await k.offen();
    k.senden({ typ: 'erstellen', name: `Anna${i}` });
    await warte(80);
    assert.ok(k.eingang.some((n) => n.typ === 'du'), `Partie ${i + 1} wurde eroeffnet`);
    eroeffner.push(k);
  }

  const dritter = verbinde(true);
  await dritter.offen();
  dritter.senden({ typ: 'erstellen', name: 'Anna3' });
  await warte(80);
  const abgelehnt = dritter.eingang.find((n) => n.typ === 'fehler');
  assert.ok(abgelehnt, 'die dritte Partie wird abgelehnt');
  assert.match(abgelehnt.text, /Zu viele offene Partien/);
  assert.equal(dritter.eingang.some((n) => n.typ === 'du'), false);

  // Wird eine Partie geschlossen, ist der Platz wieder frei.
  eroeffner[0].zu();
  await warte(200);
  const vierter = verbinde(true);
  await vierter.offen();
  vierter.senden({ typ: 'erstellen', name: 'Anna4' });
  await warte(80);
  assert.ok(vierter.eingang.some((n) => n.typ === 'du'), 'der frei gewordene Platz wird genutzt');

  dritter.zu();
  vierter.zu();
  eroeffner[1].zu();
  await warte(100);
});

test('schutz AC-5: ein ausgelasteter Server nimmt keine neuen Partien an', () => {
  const schutz = new Schutz({ raeumeGesamt: 2, raeumeJeAdresse: 99 });
  assert.equal(schutz.raumErlaubt('a').ok, true);
  schutz.raumAuf('a');
  schutz.raumAuf('b');

  const urteil = schutz.raumErlaubt('c');
  assert.equal(urteil.ok, false);
  assert.match(urteil.grund, /ausgelastet/);

  schutz.raumZu('a');
  assert.equal(schutz.raumErlaubt('c').ok, true, 'nach dem Ende ist wieder Platz');
  schutz.halt();
});

test('schutz AC-6: die Adressliste waechst nicht unbegrenzt', () => {
  let jetzt = 0;
  const schutz = new Schutz({}, () => jetzt);

  for (let i = 0; i < 100; i++) schutz.verbindungErlaubt(`10.0.0.${i}`);
  assert.equal(schutz.adressen.size, 100);

  jetzt += 5 * 60 * 1000; // die Eimer laufen wieder voll
  schutz.aufraeumen();
  assert.equal(schutz.adressen.size, 0, 'stille Adressen werden vergessen');

  // Eine Adresse mit offener Verbindung bleibt dagegen stehen.
  schutz.verbindungErlaubt('10.0.0.1');
  schutz.verbindungOffen('10.0.0.1');
  jetzt += 5 * 60 * 1000;
  schutz.aufraeumen();
  assert.equal(schutz.adressen.size, 1);
  schutz.halt();
});

test('schutz AC-8: der weitergereichte Kopf wird nur hinter einem Proxy geglaubt', () => {
  const { adresseVon } = require('../server/schutz.js');
  const anfrage = {
    headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' },
    socket: { remoteAddress: '127.0.0.1' },
  };
  assert.equal(adresseVon(anfrage, false), '127.0.0.1', 'ohne Proxy zaehlt nur die echte Adresse');
  assert.equal(adresseVon(anfrage, true), '203.0.113.9', 'hinter dem Proxy der erste Eintrag');
});
