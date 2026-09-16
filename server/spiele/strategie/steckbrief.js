'use strict';

// Wie das Strategiespiel in der Uebersicht steht (→ server/spiele/verzeichnis.js).
// Ein eigener Name fehlt noch (docs/strategie/erkenntnisse.md).
module.exports = {
  art: 'strategie',
  name: 'Strategie',
  beschreibung: 'Baut eine Siedlung auf, steigt durch die Zeitalter auf und erobert die anderen.',
  // Bis MAX_SPIELER in raeume.js; acht erst mit Stufe A (fahrplan).
  spieler: { von: 2, bis: 6 },
  stand: 'im-bau',
  einstieg: { art: 'raum' },
  // Die Vorgaben ergeben eine spielbare Partie (auswahl AC-5). Kartengroesse
  // und Vorratsmenge kommen mit dem Umbau der Karte in Stufe A.
  einstellungen: [
    { schluessel: 'spieler', name: 'Hoechstens Spieler', art: 'zahl', von: 2, bis: 6, vorgabe: 6 },
    { schluessel: 'startwert', name: 'Startwert der Karte', art: 'startwert', vorgabe: null },
  ],
  reihenfolge: 1,
};
