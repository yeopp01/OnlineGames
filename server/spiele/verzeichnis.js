// @ts-check
'use strict';

// Welche Spiele es gibt (→ specs/00-plattform/spielauswahl.md AC-1 bis AC-3).
//
// Jedes Spiel legt in seinem Ordner unter server/spiele/<art>/ einen
// `steckbrief.js` ab. Das Verzeichnis sammelt sie ein - ein neues Spiel taucht
// in der Uebersicht auf, ohne dass hier oder im Browser jemand etwas aendert
// (AC-2). Die Plattform kennt nur die Form des Steckbriefs, nicht die Spiele.

const fs = require('node:fs');
const path = require('node:path');
const einstellungen = require('./einstellungen');

const STAENDE = ['spielbar', 'im-bau', 'gesperrt'];
const EINSTIEGE = ['raum', 'seite'];

// Ein kaputter Steckbrief soll beim Start auffallen, nicht erst im Browser.
function pruefen(steckbrief, ordner) {
  const wo = `Steckbrief in ${ordner}`;
  const { art, name, beschreibung, spieler, stand, einstieg } = steckbrief;
  if (typeof art !== 'string' || !/^[a-z]+$/.test(art)) throw new Error(`${wo}: art fehlt oder ist nicht klein geschrieben.`);
  if (typeof name !== 'string' || !name) throw new Error(`${wo}: name fehlt.`);
  if (typeof beschreibung !== 'string' || !beschreibung) throw new Error(`${wo}: beschreibung fehlt.`);
  if (!spieler || !Number.isInteger(spieler.von) || !Number.isInteger(spieler.bis) || spieler.von < 1 || spieler.bis < spieler.von) {
    throw new Error(`${wo}: spieler braucht von und bis, 1 <= von <= bis.`);
  }
  if (!STAENDE.includes(stand)) throw new Error(`${wo}: stand muss einer sein aus ${STAENDE.join(', ')}.`);
  if (!einstieg || !EINSTIEGE.includes(einstieg.art)) throw new Error(`${wo}: einstieg.art muss einer sein aus ${EINSTIEGE.join(', ')}.`);
  if (einstieg.art === 'seite' && !/^\/[\w.-]+$/.test(einstieg.adresse || '')) {
    throw new Error(`${wo}: einstieg.adresse muss eine Seite wie /manager.html sein.`);
  }
  // Ein Spiel, das ueber einen Raum laeuft, erzeugt seine Welt selbst
  // (→ specs/00-plattform/raeume.md AC-16). Gesperrte duerfen es noch nicht koennen.
  if (einstieg.art === 'raum' && stand !== 'gesperrt') {
    if (typeof steckbrief.erzeugen !== 'function') throw new Error(`${wo}: erzeugen(spieler, einstellungen) fehlt.`);
    // Eine Zahl, oder eine Funktion der Einstellungen (spielziel AC-23:
    // die Spielgeschwindigkeit). Geprueft wird die Funktion an den Vorgaben.
    const vorgaben = Object.fromEntries((steckbrief.einstellungen || []).map((e) => [e.schluessel, e.vorgabe]));
    const takte = typeof steckbrief.takte === 'function' ? steckbrief.takte(vorgaben) : steckbrief.takte;
    if (!Number.isInteger(takte) || takte < 1 || takte > 60) {
      throw new Error(`${wo}: takte muss eine ganze Zahl von 1 bis 60 sein (oder eine Funktion, die eine liefert).`);
    }
  }
  // Wie viele Plaetze das Spiel selbst besetzt, etwa mit Computergegnern
  // (→ specs/00-plattform/spielauswahl.md AC-19). Freiwillig.
  if (steckbrief.plaetze !== undefined && typeof steckbrief.plaetze !== 'function') {
    throw new Error(`${wo}: plaetze muss eine Funktion (einstellungen) => Zahl sein.`);
  }
  einstellungen.listePruefen(steckbrief.einstellungen, wo);
  // Was je Platz gewaehlt wird (spielauswahl AC-22) - dieselben Arten wie die
  // Einstellungen. Freiwillig, ebenso der Name der Plaetze, die das Spiel
  // besetzt.
  einstellungen.listePruefen(steckbrief.jePlatz, `${wo}, jePlatz`);
  if (steckbrief.platzname !== undefined && typeof steckbrief.platzname !== 'function') {
    throw new Error(`${wo}: platzname muss eine Funktion (nummer) => Text sein.`);
  }
}

function lesen(wurzel = __dirname) {
  const spiele = [];
  for (const eintrag of fs.readdirSync(wurzel, { withFileTypes: true })) {
    if (!eintrag.isDirectory()) continue;
    const datei = path.join(wurzel, eintrag.name, 'steckbrief.js');
    if (!fs.existsSync(datei)) continue;
    const steckbrief = require(datei);
    pruefen(steckbrief, eintrag.name);
    spiele.push({
      art: steckbrief.art,
      name: steckbrief.name,
      beschreibung: steckbrief.beschreibung,
      spieler: { von: steckbrief.spieler.von, bis: steckbrief.spieler.bis },
      stand: steckbrief.stand,
      einstieg: { ...steckbrief.einstieg },
      einstellungen: steckbrief.einstellungen || [],
      // Fuer den Raum; beim Ausliefern an den Browser faellt die Funktion weg.
      erzeugen: steckbrief.erzeugen,
      takte: steckbrief.takte,
      ...(steckbrief.plaetze ? { plaetze: steckbrief.plaetze } : {}),
      ...(steckbrief.jePlatz ? { jePlatz: steckbrief.jePlatz } : {}),
      ...(steckbrief.platzname ? { platzname: steckbrief.platzname } : {}),
      reihenfolge: Number.isInteger(steckbrief.reihenfolge) ? steckbrief.reihenfolge : 100,
    });
  }
  return spiele.sort((a, b) => a.reihenfolge - b.reihenfolge || a.name.localeCompare(b.name, 'de'));
}

// Nur Spiele, die ueber einen Raum laufen und nicht gesperrt sind, lassen sich
// eroeffnen.
function eroeffenbar(spiele, art) {
  return spiele.find((s) => s.art === art && s.einstieg.art === 'raum' && s.stand !== 'gesperrt') || null;
}

module.exports = { lesen, eroeffenbar, STAENDE };
