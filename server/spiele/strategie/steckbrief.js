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
  reihenfolge: 1,
};
