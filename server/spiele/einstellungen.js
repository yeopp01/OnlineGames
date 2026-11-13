// @ts-check
'use strict';

// Einstellungen einer Partie (→ specs/00-plattform/spielauswahl.md AC-4, AC-5, AC-8).
//
// Jedes Spiel liefert in seinem Steckbrief eine Liste. Die Plattform kennt
// keine einzelne Einstellung, nur die Arten:
//
//   zahl       ganze Zahl zwischen von und bis
//   wahl       einer der Werte aus `werte` ([{ wert, name }])
//   startwert  ganze Zahl von 0 bis STARTWERT_MAX, oder null fuer "zufaellig"
//
// Geprueft wird hier, auf dem Server. Was der Browser vorher abfaengt, ist
// Bequemlichkeit, keine Sicherung.

const ARTEN = ['zahl', 'wahl', 'startwert'];
const STARTWERT_MAX = 999_999_999;

// Die Liste selbst - ein Fehler hier ist ein Fehler im Steckbrief und faellt
// beim Start des Servers auf.
function listePruefen(liste, wo) {
  if (liste === undefined) return;
  if (!Array.isArray(liste)) throw new Error(`${wo}: einstellungen muss eine Liste sein.`);
  const gesehen = new Set();
  for (const e of liste) {
    const hier = `${wo}, Einstellung ${e && e.schluessel}`;
    if (!e || typeof e.schluessel !== 'string' || !/^[a-z]+$/.test(e.schluessel)) throw new Error(`${wo}: jede Einstellung braucht einen kleinen schluessel.`);
    if (gesehen.has(e.schluessel)) throw new Error(`${hier}: doppelt.`);
    gesehen.add(e.schluessel);
    if (typeof e.name !== 'string' || !e.name) throw new Error(`${hier}: name fehlt.`);
    if (!ARTEN.includes(e.art)) throw new Error(`${hier}: art muss eine sein aus ${ARTEN.join(', ')}.`);
    if (e.art === 'zahl') {
      if (!Number.isInteger(e.von) || !Number.isInteger(e.bis) || e.von > e.bis) throw new Error(`${hier}: von und bis fehlen.`);
      if (!Number.isInteger(e.vorgabe) || e.vorgabe < e.von || e.vorgabe > e.bis) throw new Error(`${hier}: vorgabe liegt nicht zwischen von und bis.`);
    }
    if (e.art === 'wahl') {
      if (!Array.isArray(e.werte) || e.werte.length < 2) throw new Error(`${hier}: eine Wahl braucht mindestens zwei werte.`);
      if (!e.werte.some((w) => w.wert === e.vorgabe)) throw new Error(`${hier}: vorgabe ist keiner der werte.`);
    }
    if (e.art === 'startwert' && e.vorgabe !== null) throw new Error(`${hier}: ein Startwert hat die vorgabe null (zufaellig).`);
  }
}

function einzeln(e, roh) {
  if (e.art === 'zahl') {
    if (!Number.isInteger(roh) || roh < e.von || roh > e.bis) {
      return { fehler: `${e.name}: erlaubt sind ganze Zahlen von ${e.von} bis ${e.bis}.` };
    }
    return { wert: roh };
  }
  if (e.art === 'wahl') {
    const treffer = e.werte.find((w) => w.wert === roh);
    if (!treffer) return { fehler: `${e.name}: erlaubt ist ${e.werte.map((w) => w.name).join(', ')}.` };
    return { wert: treffer.wert };
  }
  // startwert
  if (roh === null) return { wert: null };
  if (!Number.isInteger(roh) || roh < 0 || roh > STARTWERT_MAX) {
    return { fehler: `${e.name}: eine ganze Zahl von 0 bis ${STARTWERT_MAX}, oder leer für zufällig.` };
  }
  return { wert: roh };
}

// Aus dem, was der Browser schickt, die Werte der Partie. Was fehlt, bekommt
// die Vorgabe (AC-5); was nicht passt oder unbekannt ist, wird abgewiesen (AC-8).
function pruefen(liste = [], eingabe = {}) {
  if (eingabe === undefined || eingabe === null) eingabe = {};
  if (typeof eingabe !== 'object' || Array.isArray(eingabe)) return { fehler: 'Die Einstellungen sind unverständlich.' };
  const bekannt = new Map(liste.map((e) => [e.schluessel, e]));
  for (const schluessel of Object.keys(eingabe)) {
    if (!bekannt.has(schluessel)) return { fehler: `Diese Einstellung gibt es nicht: ${String(schluessel).slice(0, 30)}.` };
  }
  const werte = {};
  for (const e of liste) {
    if (!(e.schluessel in eingabe)) {
      werte[e.schluessel] = e.vorgabe;
      continue;
    }
    const ergebnis = einzeln(e, eingabe[e.schluessel]);
    if (ergebnis.fehler) return { fehler: ergebnis.fehler };
    werte[e.schluessel] = ergebnis.wert;
  }
  return { werte };
}

module.exports = { listePruefen, pruefen, ARTEN, STARTWERT_MAX };
