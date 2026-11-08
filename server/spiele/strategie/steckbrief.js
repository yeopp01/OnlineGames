'use strict';

const { Welt, TAKTE_PRO_SEKUNDE } = require('./welt');

// Wie das Strategiespiel in der Uebersicht steht (→ server/spiele/verzeichnis.js).
// Der Name ist entschieden (Benutzer, 2026-11-08; spielauswahl AC-20).
module.exports = {
  art: 'strategie',
  name: 'Fading Allies',
  beschreibung: 'Baut eine Siedlung auf, steigt durch die Zeitalter auf und erobert die anderen.',
  // Bis MAX_SPIELER in raeume.js; acht erst mit Stufe A (fahrplan).
  spieler: { von: 2, bis: 6 },
  stand: 'im-bau',
  einstieg: { art: 'raum' },
  // Die Vorgaben ergeben eine spielbare Partie (auswahl AC-5). Kartengroesse
  // und Vorratsmenge kommen mit dem Umbau der Karte in Stufe A.
  einstellungen: [
    { schluessel: 'spieler', name: 'Höchstens Spieler', art: 'zahl', von: 2, bis: 6, vorgabe: 6 },
    { schluessel: 'startwert', name: 'Startwert der Karte', art: 'startwert', vorgabe: null },
    {
      schluessel: 'kartengroesse', name: 'Kartengröße', art: 'wahl', vorgabe: 'normal',
      werte: [{ wert: 'klein', name: 'klein' }, { wert: 'normal', name: 'normal' }, { wert: 'gross', name: 'groß' }],
    },
    {
      schluessel: 'vorrat', name: 'Startvorrat', art: 'wahl', vorgabe: 'wenig',
      werte: [
        { wert: 'wenig', name: 'wenig (200 Holz, 200 Nahrung, 100 Gold, 200 Stein)' },
        { wert: 'mittel', name: 'mittel (je 500)' },
        { wert: 'viel', name: 'viel (je 1000)' },
      ],
    },
  ],
  // Was der Raum von diesem Spiel braucht (→ specs/00-plattform/raeume.md AC-16).
  takte: TAKTE_PRO_SEKUNDE,
  erzeugen: (spieler, einstellungen) => new Welt(spieler, einstellungen.startwert, einstellungen),
  reihenfolge: 1,
};
