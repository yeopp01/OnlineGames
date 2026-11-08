// Waechter: was auf dem Bildschirm steht, hat echte Umlaute
// (→ specs/00-plattform/spielauswahl.md AC-21, CLAUDE.md "Sprache").
//
// Warum es diesen Waechter gibt: Bezeichner, Dateinamen und Testnamen werden
// umschrieben (`kartengroesse`), Texte auf dem Bildschirm nicht („Kartengröße").
// Die Regel stand von Anfang an in CLAUDE.md - als Fettdruck. Bis Runde 87
// standen trotzdem rund vierzig Texte umschrieben im Bild, vom Knopf
// „Eroeffnen" (genau dem Beispiel aus CLAUDE.md) bis zur Absage „Das ist nicht
// dein Gebaeude.". Der Waechter liest die Stellen, aus denen Bildschirmtext
// kommt, und beanstandet umschriebene Woerter.
//
// Was er liest: Text in `index.html` und `schautafel.html` (ausserhalb der
// Tags, dazu title/aria-label/placeholder/alt), und in JavaScript die
// Zeichenketten hinter `fehler`, `textContent =`, `placeholder =`, `title =`,
// `melden(` und den Feldern `name`, `beschreibung`, `titel`, `text`,
// `hinweis`. Ausdruecke in `${...}` zaehlen nicht - das sind Bezeichner.
//
// Das Managerspiel ruht: `manager.js` und `manager.html` liest er nicht. Wer
// dort wieder arbeitet, nimmt sie in DATEIEN auf.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const WURZEL = fileURLToPath(new URL('../', import.meta.url));

const DATEIEN = [
  'public/index.html', 'public/schautafel.html',
  'public/app.js', 'public/ansicht.js', 'public/auswahlleiste.js', 'public/tasten.js', 'public/uebersicht.js',
  'public/figuren.js', 'public/gebaeude.js', 'public/schautafel.js',
  'server/raeume.js', 'server/index.js', 'server/schutz.js', 'server/konten.js',
  'server/spiele/verzeichnis.js', 'server/spiele/einstellungen.js',
  'server/spiele/strategie/steckbrief.js', 'server/spiele/manager/steckbrief.js',
  'server/spiele/strategie/welt.js', 'server/spiele/strategie/daten.js',
];

// Anfaenge richtig geschriebener Woerter mit ae, oe oder ue ("aktuellen",
// "Dauer"). Die Liste waechst, wenn ein neues Wort sie braucht - das ist
// billiger als eine schlauere Regel.
const RICHTIG = ['dauer', 'bau', 'mauer', 'neue', 'feuer', 'aktuell', 'quelle', 'steuer', 'abenteuer',
  'treue', 'sauer', 'trauer', 'schaue'];
const richtig = (wort) => RICHTIG.some((stamm) => wort.toLowerCase().startsWith(stamm));

// Umschriebenes ß laesst sich nicht an Buchstaben erkennen ("Klasse" ist
// richtig) - deshalb die Wortstaemme, die vorkamen.
const SZ = /\b(ausser\w*|gross\w*|grosse\w*|\w*schiess\w*|heisst|weiss|\w*schliess\w*|strasse\w*|fuss\w*)\b/gi;

const JS_MUSTER = [
  /\bfehler\s*[:(]\s*(['`])((?:(?!\1).)*)\1/g,
  /\.(?:textContent|placeholder|title|innerText)\s*=\s*(['`])((?:(?!\1).)*)\1/g,
  /\bmelden\(\s*(['`])((?:(?!\1).)*)\1/g,
  /\b(?:name|beschreibung|titel|text|hinweis)\s*:\s*(['`])((?:(?!\1).)*)\1/g,
];

function umschrieben(text) {
  const ohneAusdruck = text.replace(/\$\{[^}]*\}/g, ' ');
  const woerter = [];
  for (const wort of ohneAusdruck.match(/[A-Za-zÄÖÜäöüß]+/g) || []) {
    if (/(ae|oe|ue)/i.test(wort) && !richtig(wort)) woerter.push(wort);
  }
  for (const wort of ohneAusdruck.match(SZ) || []) woerter.push(wort);
  return woerter;
}

function texteAusHtml(inhalt) {
  const texte = [];
  const ohneSkript = inhalt.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  for (const m of ohneSkript.matchAll(/(?:title|aria-label|placeholder|alt)="([^"]*)"/g)) texte.push(m[1]);
  for (const m of ohneSkript.matchAll(/>([^<]+)</g)) if (m[1].trim()) texte.push(m[1]);
  return texte;
}

function texteAusJs(inhalt) {
  const texte = [];
  inhalt.split('\n').forEach((zeile) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(zeile)) return;
    for (const muster of JS_MUSTER) for (const m of zeile.matchAll(muster)) texte.push(m[2]);
  });
  return texte;
}

test('auswahl AC-21: kein Text auf dem Bildschirm umschreibt einen Umlaut (Waechter)', () => {
  const treffer = [];
  for (const datei of DATEIEN) {
    const inhalt = readFileSync(WURZEL + datei, 'utf8');
    const texte = datei.endsWith('.html') ? texteAusHtml(inhalt) : texteAusJs(inhalt);
    for (const text of texte) {
      const woerter = umschrieben(text);
      if (woerter.length) treffer.push(`${datei}: ${woerter.join(', ')} - «${text.trim().slice(0, 80)}»`);
    }
  }
  assert.deepEqual(treffer, [], [
    'Diese Texte stehen auf dem Bildschirm und umschreiben Umlaute oder ß.',
    'Bezeichner bleiben umschrieben, Bildschirmtext bekommt echte Umlaute (CLAUDE.md).',
    'Ist ein Wort richtig geschrieben (etwa "Dauer"), gehoert es in RICHTIG.',
    '', ...treffer,
  ].join('\n'));
});

// Gegenprobe: findet der Waechter, was er finden soll - und laesst er stehen,
// was richtig ist?
test('auswahl AC-21: der Waechter erkennt Umschriebenes und laesst Richtiges stehen', () => {
  assert.deepEqual(umschrieben('Die Partie laeuft schon.'), ['laeuft']);
  assert.deepEqual(umschrieben('Kartengroesse'), ['Kartengroesse']);
  assert.deepEqual(umschrieben('Ein Raumcode, kein Konto — ausser du eröffnest.'), ['ausser']);
  assert.deepEqual(umschrieben('Schiessanlage'), ['Schiessanlage']);
  assert.deepEqual(umschrieben('Dauer ${ansicht.abschlussdauer()}'), []);
  assert.deepEqual(umschrieben('Niemand in der Auswahl kann das bauen.'), []);
  assert.deepEqual(umschrieben('Die Klasse der Schützen'), []);
  assert.deepEqual(texteAusJs("    if (x) return { fehler: 'Das ist nicht dein Gebaeude.' };"), ['Das ist nicht dein Gebaeude.']);
  assert.deepEqual(texteAusHtml('<h2>Spiel waehlen</h2><svg><text>x</text></svg>'), ['Spiel waehlen']);
});
