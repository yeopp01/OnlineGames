// Der Bildspeicher (→ specs/10-strategie/darstellung.md AC-27).
//
// Figuren, Gebaeude, Vorraete und Bodenkacheln liegen je Zoomstufe als fertige
// Bilder im Speicher. Was hier ohne Browser pruefbar ist: er zaehlt Bildpunkte
// statt Stuecke, wirft hinaus, was am laengsten nicht gebraucht wurde, und
// gibt nach Ablauf der Frist eines Bildes das Stueck in der Groesse von eben
// heraus. Dass das Zoomen damit nicht mehr stockt, misst der Browserlauf
// (e2e/tests/strategie-zoom.spec.mjs).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const quelle = readFileSync(new URL('../public/bildspeicher.js', import.meta.url));
const { Bildspeicher } = await import(`data:text/javascript;base64,${quelle.toString('base64')}`);

const bild = (breite, hoehe, name) => ({ width: breite, height: hoehe, name });

test('darstellung AC-27: der Bildspeicher zaehlt Bildpunkte, nicht Stuecke', () => {
  const speicher = new Bildspeicher('probe-punkte', 1000);
  speicher.legen('a', bild(10, 10));
  speicher.legen('b', bild(20, 20));
  speicher.legen('c', bild(20, 20));
  assert.equal(speicher.zahl, 3);
  assert.equal(speicher.punkte, 900);
  // Ein grosses Bild verdraengt mehrere kleine.
  speicher.legen('d', bild(30, 20));
  assert.equal(speicher.punkte, 1000, 'a und b sind gegangen: 400 + 600');
  assert.deepEqual([...speicher.bilder.keys()], ['c', 'd']);
  assert.equal(speicher.verworfen, 2);
  assert.equal(speicher.abgelegt, 4);
});

test('darstellung AC-27: hinaus geht, was am laengsten nicht gebraucht wurde - nicht, was zuerst gezeichnet wurde', () => {
  const speicher = new Bildspeicher('probe-reihe', 300);
  speicher.legen('alt', bild(10, 10));
  speicher.legen('mittel', bild(10, 10));
  speicher.legen('jung', bild(10, 10));
  // Das aelteste wird gebraucht - damit ist es das juengste.
  assert.equal(speicher.holen('alt').width, 10);
  speicher.legen('neu', bild(10, 10));
  assert.deepEqual([...speicher.bilder.keys()], ['jung', 'alt', 'neu']);
  // Nachsehen zaehlt nicht als Gebrauch.
  assert.ok(speicher.ansehen('jung'));
  speicher.legen('neuer', bild(10, 10));
  assert.deepEqual([...speicher.bilder.keys()], ['alt', 'neu', 'neuer']);
});

test('darstellung AC-27: das eben abgelegte Bild bleibt, auch wenn es allein die Grenze sprengt', () => {
  const speicher = new Bildspeicher('probe-gross', 100);
  speicher.legen('klein', bild(5, 5));
  speicher.legen('riese', bild(50, 50));
  assert.deepEqual([...speicher.bilder.keys()], ['riese']);
  assert.equal(speicher.punkte, 2500);
  // Derselbe Schluessel noch einmal: das alte Bild zaehlt nicht doppelt.
  speicher.legen('riese', bild(4, 4));
  assert.equal(speicher.punkte, 16);
  speicher.loeschen('riese');
  assert.equal(speicher.punkte, 0);
  assert.equal(speicher.zahl, 0);
});

test('darstellung AC-27: ist die Frist eines Bildes um, steht das Stueck in der Groesse von eben da - vorher nicht', () => {
  const speicher = new Bildspeicher('probe-ersatz', 1_000_000);
  const gemalt = [];
  const stift = { drawImage: (...werte) => gemalt.push(werte) };
  const klein = bild(10, 20, 'klein');
  speicher.legen('1.00|baum', klein, 'baum');

  // Ohne Beginn eines Bildes gilt keine Frist: nie Ersatz.
  Bildspeicher.frist = Infinity;
  Bildspeicher.verbraucht = 1000;
  assert.equal(speicher.ersatzZeichnen(stift, 'baum', 0, 0, 20, 40), false);

  // Ein Bild beginnt: solange die Frist nicht um ist, wird neu gezeichnet.
  Bildspeicher.bildBeginn(5);
  assert.equal(speicher.ersatzZeichnen(stift, 'baum', 0, 0, 20, 40), false);
  assert.equal(gemalt.length, 0);

  // Ein neues Stueck hat zehn Millisekunden gekostet - die Frist ist um.
  speicher.legen('2.00|haus', bild(40, 40), 'haus', performance.now() - 10);
  assert.ok(Bildspeicher.verbraucht >= 10);
  assert.equal(speicher.ersatzZeichnen(stift, 'baum', 3, 4, 20, 40), true);
  assert.deepEqual(gemalt, [[klein, 3, 4, 20, 40]], 'das kleine Bild, gestreckt auf den Platz des grossen');
  assert.equal(Bildspeicher.ersetzt, 1);
  // Was es in keiner Groesse gibt, muss gezeichnet werden.
  assert.equal(speicher.ersatzZeichnen(stift, 'turm', 0, 0, 20, 40), false);

  // Das naechste Bild beginnt von vorn.
  Bildspeicher.bildBeginn(5);
  assert.equal(Bildspeicher.ersetzt, 0);
  assert.equal(speicher.ersatzZeichnen(stift, 'baum', 0, 0, 20, 40), false);
  Bildspeicher.frist = Infinity;
});

test('darstellung AC-27: Ersatz ist die Groesse, die zuletzt gebraucht wurde', () => {
  const speicher = new Bildspeicher('probe-familie', 1_000_000);
  const gemalt = [];
  const stift = { drawImage: (b) => gemalt.push(b.name) };
  speicher.legen('1|baum', bild(10, 10, 'eins'), 'baum');
  speicher.legen('2|baum', bild(20, 20, 'zwei'), 'baum');
  speicher.holen('1|baum', 'baum');
  Bildspeicher.bildBeginn(0);
  Bildspeicher.verbraucht = 1;
  speicher.ersatzZeichnen(stift, 'baum', 0, 0, 30, 30);
  // Ist genau diese Groesse inzwischen hinausgeflogen, gibt es keinen Ersatz.
  speicher.loeschen('1|baum');
  assert.equal(speicher.ersatzZeichnen(stift, 'baum', 0, 0, 30, 30), false);
  assert.deepEqual(gemalt, ['eins']);
  Bildspeicher.frist = Infinity;
});
