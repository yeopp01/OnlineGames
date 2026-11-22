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
// Das Managerspiel baut seine Blaetter aus Vorlagen mit HTML darin
// (`<h2>Als Naechstes …</h2>`) - dort greift keines der Muster oben. Seine
// Dateien stehen deshalb unter STRENG und werden ganz gelesen: jede
// Zeichenkette, auch die Stuecke einer Vorlage zwischen `${…}`, ohne Tags.
// Bildschirmtext ist, was ein Leerzeichen hat, mit einem Grossbuchstaben
// beginnt oder zwischen zwei Tags steht; ein einzelnes kleines Wort ist ein
// Schluessel (`'verlaengern'`) und bleibt umschrieben (Plan M0.1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const WURZEL = fileURLToPath(new URL('../', import.meta.url));

const DATEIEN = [
  'public/index.html', 'public/schautafel.html',
  'public/app.js', 'public/ansicht.js', 'public/auswahlleiste.js', 'public/tasten.js', 'public/uebersicht.js',
  'public/figuren.js', 'public/gebaeude.js', 'public/schautafel.js',
  'public/bildprobe.html', 'public/bildprobe.js',
  'server/raeume.js', 'server/index.js', 'server/schutz.js', 'server/konten.js',
  'server/spiele/verzeichnis.js', 'server/spiele/einstellungen.js',
  'server/spiele/strategie/steckbrief.js', 'server/spiele/manager/steckbrief.js',
  'server/spiele/strategie/welt.js', 'server/spiele/strategie/daten.js',
];

const STRENG = [
  'public/manager.html',
  ...readdirSync(new URL('../server/spiele/manager/', import.meta.url)).map((name) => `server/spiele/manager/${name}`),
  ...(() => {
    try {
      return readdirSync(new URL('../public/manager/', import.meta.url)).map((name) => `public/manager/${name}`);
    } catch {
      return [];
    }
  })(),
].filter((datei) => /\.(js|html)$/.test(datei));

// Anfaenge richtig geschriebener Woerter mit ae, oe oder ue ("aktuellen",
// "Dauer"). Die Liste waechst, wenn ein neues Wort sie braucht - das ist
// billiger als eine schlauere Regel.
const RICHTIG = ['dauer', 'bau', 'mauer', 'neue', 'feuer', 'aktuell', 'quelle', 'steuer', 'abenteuer',
  'treue', 'sauer', 'trauer', 'schaue', 'steinmauer',
  // aus dem Managerspiel
  'zuschauer', 'vertrau', 'zuerst', 'teuer', 'quell', 'value', 'true', 'query', 'blue', 'queue',
  // aus den Saetzen des Spieltags (texte.js)
  'quer', 'lauer',
  // die Ansprache zur Halbzeit (spieltag AC-30)
  'aufbau'];
const richtig = (wort) => RICHTIG.some((stamm) => wort.toLowerCase().startsWith(stamm));

// Umschriebenes ß laesst sich nicht an Buchstaben erkennen ("Klasse" ist
// richtig) - deshalb die Wortstaemme, die vorkamen.
const SZ = /\b(ausser\w*|gross\w*|grosse\w*|\w*schiess\w*|heisst|weiss|\w*schliess\w*|strasse\w*|fuss\w*)\b/gi;

const JS_MUSTER = [
  /\bfehler\s*[:(]\s*(['`])((?:(?!\1).)*)\1/g,
  /\.(?:textContent|placeholder|title|innerText)\s*=\s*(['`])((?:(?!\1).)*)\1/g,
  /\bmelden\(\s*(['`])((?:(?!\1).)*)\1/g,
  /\b(?:name|beschreibung|titel|text|hinweis)\s*:\s*(['`])((?:(?!\1).)*)\1/g,
  // Der dritte Wert von `element(tag, klasse, text)` - so baut die
  // Auswahlleiste ihre Zeilen. Bis zur Rueckschau zur Stufe D las der Waechter
  // ihn nicht, und "Bevoelkerung voll" und "traegt nichts" standen seit Stufe A
  // im Bild.
  /\belement\(\s*'[^']*'\s*,\s*(?:null|'[^']*'|`[^`]*`)\s*,\s*(['`])((?:(?!\1).)*)\1/g,
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

/**
 * Alle Zeichenketten einer JavaScript-Datei, Vorlagen als ein Stueck mit
 * `\u0000` an der Stelle jedes `${…}` - die Ausdruecke darin werden selbst
 * wieder gelesen. Kommentare und regulaere Ausdruecke zaehlen nicht.
 */
function zeichenketten(quelle) {
  const stuecke = [];
  let i = 0;
  let letztes = '';
  const regexDavor = (z) => !z || /[(,=:[!&|?{};+\-*%<>~^]/.test(z);

  function vorlage() {
    // i steht hinter dem oeffnenden Backtick
    let text = '';
    while (i < quelle.length) {
      const z = quelle[i];
      if (z === '\\') { text += quelle.slice(i, i + 2); i += 2; continue; }
      if (z === '`') { i++; break; }
      if (z === '$' && quelle[i + 1] === '{') {
        i += 2;
        text += '\u0000';
        code(1);
        continue;
      }
      text += z;
      i++;
    }
    stuecke.push(text);
  }

  function code(tiefe) {
    while (i < quelle.length) {
      const z = quelle[i];
      const n = quelle[i + 1];
      if (z === '/' && n === '/') { while (i < quelle.length && quelle[i] !== '\n') i++; continue; }
      if (z === '/' && n === '*') { i = quelle.indexOf('*/', i + 2); i = i < 0 ? quelle.length : i + 2; continue; }
      if (z === '/' && regexDavor(letztes)) {
        i++;
        let klasse = false;
        while (i < quelle.length && (quelle[i] !== '/' || klasse)) {
          if (quelle[i] === '\\') i++;
          else if (quelle[i] === '[') klasse = true;
          else if (quelle[i] === ']') klasse = false;
          i++;
        }
        i++;
        while (/[a-z]/.test(quelle[i] || '')) i++;
        letztes = 'x';
        continue;
      }
      if (z === '"' || z === "'") {
        let text = '';
        i++;
        while (i < quelle.length && quelle[i] !== z) {
          if (quelle[i] === '\\') { text += quelle.slice(i, i + 2); i += 2; continue; }
          text += quelle[i++];
        }
        i++;
        stuecke.push(text);
        letztes = 'x';
        continue;
      }
      if (z === '`') { i++; vorlage(); letztes = 'x'; continue; }
      if (z === '{') tiefe++;
      if (z === '}') {
        tiefe--;
        if (tiefe === 0) { i++; return; }
      }
      if (!/\s/.test(z)) letztes = /[\w$)\]]/.test(z) ? 'x' : z;
      // `return /x/` - nach einem Schluesselwort beginnt ein Ausdruck
      if (/\breturn$|\btypeof$/.test(quelle.slice(Math.max(0, i - 6), i + 1))) letztes = '(';
      i++;
    }
  }

  code(Infinity);
  return stuecke;
}

/** Was aus einer Datei des Managerspiels auf den Bildschirm kommen kann. */
function texteStreng(inhalt, html) {
  const texte = [];
  for (const stueck of html ? [inhalt] : zeichenketten(inhalt)) {
    const ohneSkript = stueck.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '');
    for (const m of ohneSkript.matchAll(/(?:title|aria-label|placeholder|alt)="([^"\u0000]*)"/g)) texte.push(m[1]);
    const hatTags = /<\/?[a-z][^>]*>/i.test(ohneSkript);
    const ohneTags = ohneSkript.replace(/<[^>]*>/g, '\u0000').replace(/<[^>\u0000]*$/, '').replace(/^[^<\u0000]*>/, '');
    for (const teil of ohneTags.split('\u0000')) {
      if (!teil.trim()) continue;
      // Leerzeichen am Rand zaehlen: ` fuer ` zwischen zwei Ausdruecken ist Text.
      if (hatTags || /\s/.test(teil) || /^[A-ZÄÖÜ]/.test(teil.trim())) texte.push(teil);
    }
  }
  if (!html) texte.push(...zweigeEinerWahl(inhalt));
  return texte;
}

/**
 * Ein einzelnes kleines Wort ist sonst ein Schluessel - ausser es steht in
 * einer Kette `a ? 'x' : b ? 'y' : 'z'` neben einem Zweig, der Text ist
 * ('neutraler Platz' : ... : 'auswaerts'). Gelesen je Zeile.
 */
function zweigeEinerWahl(inhalt) {
  const texte = [];
  for (const zeile of inhalt.split('\n')) {
    if (/^\s*(\/\/|\*)/.test(zeile)) continue;
    const zweige = [...zeile.matchAll(/[?:]\s*'([^'\\]*)'/g)].map((m) => m[1]);
    if (zweige.length < 2) continue;
    if (zweige.some((z) => /\s/.test(z.trim()) || /^[A-ZÄÖÜ]/.test(z))) texte.push(...zweige);
  }
  return texte;
}

test('manager AC-16: kein Text des Managerspiels umschreibt einen Umlaut (Waechter, streng)', () => {
  const treffer = [];
  for (const datei of STRENG) {
    const inhalt = readFileSync(WURZEL + datei, 'utf8');
    for (const text of texteStreng(inhalt, datei.endsWith('.html'))) {
      const woerter = umschrieben(text);
      if (woerter.length) treffer.push(`${datei}: ${woerter.join(', ')} - «${text.trim().slice(0, 80)}»`);
    }
  }
  assert.deepEqual(treffer, [], [
    'Diese Texte des Managerspiels umschreiben Umlaute oder ß.',
    'Ist ein Wort richtig geschrieben, gehoert es in RICHTIG; ist es ein Schluessel, schreibt man es klein und ohne Leerzeichen.',
    '', ...treffer,
  ].join('\n'));
});

test('manager AC-16: die strenge Lesart findet Text in Vorlagen und laesst Schluessel stehen', () => {
  const lesen = (q) => texteStreng(q, false).flatMap(umschrieben);
  assert.deepEqual(lesen('x = `<h2>Als Naechstes: ${text(n.titel)}</h2>`;'), ['Naechstes']);
  assert.deepEqual(lesen("x = `${v ? `Naechster Gegner` : 'Als Naechstes nichts'}`;"), ['Naechster', 'Naechstes']);
  assert.deepEqual(lesen('x = `<button data-loeschen="${s.id}" class="leise">Loeschen</button>`;'), ['Loeschen']);
  assert.deepEqual(lesen("zug('verlaengern', { id });"), []);
  assert.deepEqual(lesen('x = `${a} bietet ${b} fuer ${c}`;'), ['fuer']);
  assert.deepEqual(lesen("const wo = v.neutral ? 'neutraler Platz' : v.daheim ? 'daheim' : 'auswaerts';"), ['auswaerts']);
  assert.deepEqual(lesen("const art = heim ? 'naechster' : 'erledigt';"), []);
  assert.deepEqual(lesen("const r = /aeh|oeh/g; const t = 'Fuer dich';"), ['Fuer']);
  assert.deepEqual(lesen("// Kommentar mit Naechstes\nconst a = 'gut';"), []);
  assert.deepEqual(lesen("db.prepare('INSERT INTO t VALUES (?)');"), []);
});

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
  // Und er liest den Text aus element(), auch hinter einer Klasse mit ${...}.
  assert.deepEqual(texteAusJs("x.append(element('p', 'wartegrund', 'Bevoelkerung voll'));"), ['Bevoelkerung voll']);
  assert.deepEqual(texteAusJs("element('span', `ware ware-${a}`, `traegt ${l}`)"), ['traegt ${l}']);
  assert.deepEqual(texteAusJs("    if (x) return { fehler: 'Das ist nicht dein Gebaeude.' };"), ['Das ist nicht dein Gebaeude.']);
  assert.deepEqual(texteAusHtml('<h2>Spiel waehlen</h2><svg><text>x</text></svg>'), ['Spiel waehlen']);
});
