// Die Form eines Spielstands der Strategiepartie (speichern AC-16, ADR-0017
// Punkt 7): welche Felder die Welt, ihre Spieler, Einheiten, Gebaeude, Tiere,
// Eier, Sichten, die Karte und die KI tragen koennen. Gesichert wird jedes
// eigene Feld (`welt.alsWert()`, `ki.alsWert()`) - ein neues faellt also nie
// aus dem Stand. Aber ein **alter** Stand kennt es nicht: wer ihn laedt,
// bekaeme eine Welt, der ein Feld fehlt, das der Code voraussetzt. Deshalb
// steigt mit jeder neuen Form die Fassung (`FASSUNG` in
// `server/spiele/strategie/stand.js`): ein Stand einer neueren Fassung wird
// abgelehnt (AC-17), einer aelteren ueber `SCHRITTE` hochgezogen (AC-18).
//
// `tests/waechter-stand.test.mjs` vergleicht die Form mit dem Abbild in
// `server/spiele/strategie/stand-abbild.json`. Dort steht je Fassung die
// Form, die sie hatte - auch die alten, damit nachzulesen bleibt, was ein
// alter Stand bedeutet.
//
//   npm run stand:abbild              zeigt, was sich gegen das Abbild geaendert hat
//   npm run stand:abbild -- --schreiben  traegt die Form der laufenden Fassung ein -
//                                        nur, wenn es sie dort noch nicht gibt - und
//                                        legt ihren Probestand unter tests/staende/ ab
//
// Woher die Form kommt: eine Partie KI gegen KI bis Minute 12, jede Minute
// angesehen; dazu jedes Gebaeude und jede Einheit aus den Daten einmal
// aufgestellt, das Tor quer (`quer` gehoert zur Form), und eine Welt zu viert
// in zwei Teams. Fuer Welt und KI zaehlt ausserdem jedes Feld, das der
// Quelltext als `this.<feld> =` setzt - auch eines, das die Partie nie
// erreicht. Was eine Einheit nur in seltenen Lagen bekommt und die Partie
// nicht erreicht, sieht dieser Abgleich nicht; ein solches Feld ist aber
// ohnehin eines, das fehlen darf.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const steckbrief = require('../server/spiele/strategie/steckbrief.js');
const stand = require('../server/spiele/strategie/stand.js');
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, GEMERKT, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE } = require('../server/spiele/strategie/daten.js');

export const ABBILD = fileURLToPath(new URL('../server/spiele/strategie/stand-abbild.json', import.meta.url));

// Je Fassung ein Probestand, geschrieben vom Code **dieser** Fassung und nie
// neu (speichern AC-18): an ihm zeigt `tests/strategie-hochziehen.test.mjs`,
// dass ein alter Stand hochgezogen laedt und weiterlaeuft. Er entsteht mit
// `npm run stand:abbild -- --schreiben`, zusammen mit dem Abbild der Fassung -
// also bevor die naechste Fassung den Code aendert.
export const STAENDE = fileURLToPath(new URL('../tests/staende/', import.meta.url));
export const probestandPfad = (fassung) => `${STAENDE}strategie-${fassung}.fast`;

const ARTEN = ['welt', 'karte', 'spieler', 'einheit', 'gebaeude', 'tier', 'ei', 'sicht', 'ki'];

function quelltext(pfad) {
  return readFileSync(new URL(`../${pfad}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
}

/** Jedes Feld, das eine Klasse an sich selbst setzt. */
function gesetzteFelder(pfad) {
  return new Set([...quelltext(pfad).matchAll(/\bthis\.([A-Za-z_]\w*)\s*(?:=|\?\?=|\|\|=)(?!=)/g)].map((m) => m[1]));
}

/** Ein freies Feld fuer ein Gebaeude, vom Dorf aus ringweise gesucht. */
function freierPlatz(welt, art, um, quer = false) {
  for (let r = 6; r < 40; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (welt.platzPruefen(art, um.x + dx, um.y + dy, null, quer)) return { x: um.x + dx, y: um.y + dy };
      }
    }
  }
  return null;
}

/**
 * Die Form, wie sie der Code heute schreibt: je Art die sortierten Felder.
 * @returns {Record<string, string[]>}
 */
export function formErmitteln() {
  const felder = Object.fromEntries(ARTEN.map((art) => [art, new Set()]));
  const dazu = (art, ding) => {
    if (ding && typeof ding === 'object') for (const feld of Object.keys(ding)) felder[art].add(feld);
  };
  const ansehen = (welt) => {
    const { welt: wert, kis } = stand.lesen(welt.sichern());
    dazu('welt', wert);
    dazu('karte', wert.karte);
    for (const s of wert.spieler) dazu('spieler', s);
    for (const e of wert.einheiten.values()) dazu('einheit', e);
    for (const g of wert.gebaeude.values()) {
      dazu('gebaeude', g);
      // Wer einquartiert ist, steht nicht in `einheiten` (bauen AC-58).
      for (const e of g.insassen || []) dazu('einheit', e);
    }
    for (const t of wert.tiere.values()) dazu('tier', t);
    for (const ei of wert.eier?.values() || []) dazu('ei', ei);
    for (const sicht of wert.sichten.values()) dazu('sicht', sicht);
    for (const ki of kis) dazu('ki', ki);
  };

  const partie = steckbrief.erzeugen([], { ki: 2, startwert: 5 });
  const ids = partie.spieler.map((s) => s.id);
  ansehen(partie);
  for (let minute = 1; minute <= 12; minute++) {
    for (let i = 0; i < 60 * TAKTE_PRO_SEKUNDE; i++) {
      partie.takten();
      partie.zustandJeSpieler(ids);
    }
    ansehen(partie);
  }

  // Jedes Gebaeude und jede Einheit aus den Daten, das Tor quer.
  const [erster] = partie.spieler;
  for (const art of Object.keys(GEBAEUDE)) {
    const quer = Boolean(GEBAEUDE[art].laenge);
    const platz = freierPlatz(partie, art, erster.basis, quer);
    if (platz) partie.gebaeudeAnlegen(erster.id, art, platz.x, platz.y, true, quer);
  }
  for (const art of Object.keys(EINHEITEN)) {
    const platz = freierPlatz(partie, 'haus', erster.basis);
    if (platz) partie.einheitAnlegen(erster.id, platz.x, platz.y, art);
  }
  partie.takten();
  partie.zustandJeSpieler(ids);
  ansehen(partie);

  // Die Partie des Probestands: dort kaempfen Einheiten, die sonst nur
  // dastehen - erst ein Schlag setzt `nachladen`, erst der Drache `hungert`.
  ansehen(probepartie());

  const vier = steckbrief.erzeugen([], { ki: 4, startwert: 8, teams: { ki1: 1, ki2: 1, ki3: 2, ki4: 2 } });
  for (let i = 0; i < 100; i++) vier.takten();
  ansehen(vier);

  // Was der Quelltext setzt, auch wenn die Partie es nie erreicht.
  for (const feld of gesetzteFelder('server/spiele/strategie/welt.js')) if (!GEMERKT.includes(feld)) felder.welt.add(feld);
  for (const feld of gesetzteFelder('server/spiele/strategie/ki.js')) if (feld !== 'welt') felder.ki.add(feld);

  return Object.fromEntries(ARTEN.map((art) => [art, [...felder[art]].sort()]));
}

/**
 * Der Probestand der laufenden Fassung: ein Mensch, der nichts tut, gegen
 * zwei KIs bis Minute 12, dann jedes Gebaeude und jede Einheit aus den Daten
 * beim Menschen aufgestellt (das Tor quer) und noch eine Minute gerechnet -
 * so traegt der Stand moeglichst viele Arten von Dingen, an denen ein Schritt
 * etwas aendern muss.
 * @returns {Buffer}
 */
export function probestandErzeugen() {
  return probepartie().sichern();
}

/** Die Partie hinter dem Probestand - auch die Form liest an ihr. */
function probepartie() {
  const partie = steckbrief.erzeugen([{ id: 'a1b2c3d4', name: 'Anna' }], { ki: 2, startwert: 5 });
  const ids = partie.spieler.map((s) => s.id);
  const takten = (takte) => {
    for (let i = 0; i < takte && !partie.ende; i++) {
      partie.takten();
      partie.zustandJeSpieler(ids);
    }
  };
  takten(12 * 60 * TAKTE_PRO_SEKUNDE);
  const mensch = partie.spieler.find((s) => s.id === 'a1b2c3d4');
  for (const art of Object.keys(GEBAEUDE)) {
    const quer = Boolean(GEBAEUDE[art].laenge);
    const platz = freierPlatz(partie, art, mensch.basis, quer);
    if (platz) partie.gebaeudeAnlegen(mensch.id, art, platz.x, platz.y, true, quer);
  }
  for (const art of Object.keys(EINHEITEN)) {
    const platz = freierPlatz(partie, 'haus', mensch.basis);
    if (platz) partie.einheitAnlegen(mensch.id, platz.x, platz.y, art);
  }
  takten(60 * TAKTE_PRO_SEKUNDE);
  // Die Glocke laeutet, einige sind schon drin, andere unterwegs, und die
  // Kampfeinheiten halten Stellung (bauen AC-58, AC-61, kampf AC-30).
  const dz = [...partie.gebaeude.values()].find((g) => g.besitzer === mensch.id && g.art === 'dorfzentrum' && g.fertig);
  if (dz) partie.glocke(mensch.id, dz.id);
  const kaempfer = [...partie.einheiten.values()].filter((e) => e.besitzer === mensch.id && partie.haltungMoeglich(e));
  partie.haltungSetzen(mensch.id, kaempfer.map((e) => e.id), 'stellung');
  takten(3 * TAKTE_PRO_SEKUNDE);
  return partie;
}

/** Den Probestand der laufenden Fassung ablegen, wenn es ihn noch nicht gibt. */
function probestandAblegen() {
  const pfad = probestandPfad(stand.FASSUNG);
  if (existsSync(pfad)) return console.log(`Probestand der Fassung ${stand.FASSUNG} liegt schon da.`);
  mkdirSync(STAENDE, { recursive: true });
  writeFileSync(pfad, probestandErzeugen());
  console.log(`Probestand der Fassung ${stand.FASSUNG} abgelegt: tests/staende/strategie-${stand.FASSUNG}.fast`);
}

export function abbildLesen() {
  try {
    return JSON.parse(readFileSync(ABBILD, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Was sich zwischen zwei Formen unterscheidet, je Art: dazugekommen und weggefallen.
 * @param {Record<string, string[]>} alt
 * @param {Record<string, string[]>} neu
 */
export function formUnterschied(alt, neu) {
  const raus = [];
  for (const art of new Set([...Object.keys(alt || {}), ...Object.keys(neu)])) {
    const a = new Set(alt?.[art] || []);
    const n = new Set(neu[art] || []);
    const dazu = [...n].filter((f) => !a.has(f));
    const weg = [...a].filter((f) => !n.has(f));
    if (dazu.length) raus.push(`${art}: neu ${dazu.join(', ')}`);
    if (weg.length) raus.push(`${art}: weggefallen ${weg.join(', ')}`);
  }
  return raus;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const abbild = abbildLesen();
  const form = formErmitteln();
  const eingetragen = abbild[stand.FASSUNG];
  const unterschied = formUnterschied(eingetragen, form);
  if (!process.argv.includes('--schreiben')) {
    console.log(eingetragen ? `Fassung ${stand.FASSUNG} steht im Abbild.` : `Fassung ${stand.FASSUNG} fehlt im Abbild.`);
    console.log(unterschied.length ? unterschied.join('\n') : 'Die Form ist dieselbe.');
  } else if (eingetragen && unterschied.length) {
    console.error(`Fassung ${stand.FASSUNG} steht schon im Abbild, mit einer anderen Form:\n${unterschied.join('\n')}`);
    console.error(`Erst FASSUNG in server/spiele/strategie/stand.js auf ${stand.FASSUNG + 1} setzen - eine Fassung behaelt ihre Form.`);
    process.exitCode = 1;
  } else if (eingetragen) {
    console.log(`Fassung ${stand.FASSUNG} steht schon so im Abbild.`);
    probestandAblegen();
  } else {
    abbild[stand.FASSUNG] = form;
    writeFileSync(ABBILD, `${JSON.stringify(abbild, null, 2)}\n`);
    console.log(`Fassung ${stand.FASSUNG} eingetragen.`);
    probestandAblegen();
  }
}
