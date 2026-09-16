'use strict';

// Wie das Managerspiel in der Uebersicht steht (→ server/spiele/verzeichnis.js).
module.exports = {
  art: 'manager',
  name: 'Fussballmanager',
  beschreibung: 'Fuehrt einen Verein ueber viele Saisons: Aufstellung, Transfers, Finanzen.',
  spieler: { von: 1, bis: 1 },
  stand: 'spielbar',
  einstieg: { art: 'seite', adresse: '/manager.html' },
  reihenfolge: 2,
};
