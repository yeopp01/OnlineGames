// Waechter: die Zeitalter heissen am Bildschirm nach dem Rang des Hauses
// (→ specs/10-strategie/bedienung.md AC-45, docs/adr/0014-haeuser-statt-voelker.md
// Punkt 9) - Landsitz, Lehen, Fuerstentum, Krone.
//
// Warum es diesen Waechter gibt: die alten Namen standen vor Runde 166 an
// 324 Stellen, die meisten in Kommentaren, Testnamen und Bezeichnern - dort
// duerfen sie bleiben, sie sind die Arbeitsnamen der Stufen. Auf den
// Bildschirm kommen Texte aus Zeichenketten im Browser und aus den Daten und
// Absagen des Servers. Eine neue Absage, die "in der Feudalzeit" von Hand
// schreibt statt `ZEITALTER[n].ab` zu fragen, faende sonst erst das Auge.
//
// Was er liest: in JavaScript jede Zeichenkette ausserhalb von Kommentaren
// (eine Zeichenkette, die ueber mehrere Zeilen geht, nur in ihrer ersten
// Zeile), in HTML den Text ohne Kommentare, Skripte und Stile. Bezeichner
// (`feudalzeit`) sind klein und treffen das Muster nicht.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { quelltext } from './quelltext.mjs';
import { ZEITALTER, AUFSTIEGE } from '../server/spiele/strategie/daten.js';

const ALT = /Dunkle[nr]? Zeit|Feudalzeit|Ritterzeit|Imperialzeit/;

// Alles, was im Browser laeuft, und die Teile des Servers, deren Texte der
// Browser zeigt (Daten, Absagen, Steckbrief). Die KI und der Pruefstand
// schreiben nichts auf den Bildschirm.
const DATEIEN = [
  ...readdirSync(new URL('../public/', import.meta.url))
    .filter((d) => /\.(js|html)$/.test(d) && !d.startsWith('manager'))
    .map((d) => `public/${d}`),
  'server/spiele/strategie/welt.js', 'server/spiele/strategie/daten.js', 'server/spiele/strategie/steckbrief.js',
];

function zeichenkettenAusJs(inhalt) {
  const texte = [];
  const ohneBlock = inhalt.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const zeile of ohneBlock.split('\n')) {
    if (/^\s*(\/\/|\*)/.test(zeile)) continue;
    for (const m of zeile.matchAll(/(['"`])((?:\\.|(?!\1).)*)\1/g)) texte.push(m[2]);
  }
  return texte;
}

function texteAusHtml(inhalt) {
  return [inhalt.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')];
}

test('bedienung AC-45: kein Text, der auf den Bildschirm kommt, nennt ein Zeitalter beim alten Namen (Waechter)', () => {
  const treffer = [];
  for (const datei of DATEIEN) {
    const inhalt = quelltext(datei);
    const texte = datei.endsWith('.html') ? texteAusHtml(inhalt) : zeichenkettenAusJs(inhalt);
    for (const text of texte) {
      const m = text.match(ALT);
      if (m) treffer.push(`${datei}: ${m[0]} - «${text.slice(Math.max(0, m.index - 40), m.index + 40).trim()}»`);
    }
  }
  assert.deepEqual(treffer, [], [
    'Diese Texte kommen auf den Bildschirm und nennen ein Zeitalter beim alten Namen.',
    'Am Bildschirm heissen sie Landsitz, Lehen, Fürstentum, Krone - die Formen stehen in ZEITALTER (daten.js).',
    '', ...treffer,
  ].join('\n'));
});

// Gegenprobe: er findet den alten Namen in einer Zeichenkette und laesst
// Kommentare und Bezeichner stehen.
test('bedienung AC-45: der Waechter findet alte Namen in Zeichenketten, nicht in Kommentaren', () => {
  const finde = (js) => zeichenkettenAusJs(js).filter((t) => ALT.test(t));
  assert.deepEqual(finde("return { fehler: `${wer} gibt es erst in der Feudalzeit.` };"), ['${wer} gibt es erst in der Feudalzeit.']);
  assert.deepEqual(finde("    return this.werte?.zeitalter?.[stufe]?.name || 'Dunkle Zeit';"), ['Dunkle Zeit']);
  assert.deepEqual(finde('// die Ritterzeit kommt spaeter\n  /* Imperialzeit */\n * Feudalzeit'), []);
  assert.deepEqual(finde("const art = 'feudalzeit';"), []);
  assert.ok(ALT.test(texteAusHtml('<b>Dunkle Zeit</b><!-- Feudalzeit -->')[0]));
  assert.ok(!ALT.test(texteAusHtml('<b>Landsitz</b><!-- Feudalzeit -->')[0]));
});

test('bedienung AC-45: die vier Stufen heissen Landsitz, Lehen, Fürstentum und Krone, die Formen stehen in den Daten', () => {
  assert.deepEqual(ZEITALTER.map((z) => z.name), ['Landsitz', 'Lehen', 'Fürstentum', 'Krone']);
  // Jede Form nennt den Namen - keine ist von Hand abgeschrieben und vergessen.
  for (const z of ZEITALTER) {
    for (const form of ['artikel', 'genitiv', 'ab', 'zum']) {
      assert.ok(z[form] && z[form].includes(z.name.slice(0, 4)), `${z.name}: ${form} = ${z[form]}`);
    }
  }
  // Der Knopf zum Aufstieg liest seinen Titel aus derselben Stelle.
  for (const a of Object.values(AUFSTIEGE)) {
    assert.equal(a.name, ZEITALTER[a.stufe].name);
    assert.equal(a.titel, `Aufstieg ${ZEITALTER[a.stufe].zum}`);
  }
  assert.equal(AUFSTIEGE.imperialzeit.titel, 'Aufstieg zur Krone', 'die Krone ist weiblich');
});
