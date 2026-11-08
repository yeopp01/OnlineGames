'use strict';

const { Welt, TAKTE_PRO_SEKUNDE } = require('./welt');
const { Ki } = require('./ki');

// Computergegner (spielauswahl AC-18, AC-19): sie sitzen auf eigenen Plaetzen
// und spielen nur ueber welt.nachricht, wie ein Mensch (ki AC-1). Ihre Ids
// haben ein "k" - Menschen bekommen acht Hexziffern (raeume.js), also nie
// dieselbe.
function mitKi(spieler, einstellungen) {
  const kis = Array.from({ length: einstellungen.ki || 0 }, (_, i) => ({ id: `ki${i + 1}`, name: `KI ${i + 1}` }));
  const welt = new Welt([...spieler, ...kis], einstellungen.startwert, einstellungen);
  if (!kis.length) return welt;
  const lenker = kis.map((k) => new Ki(welt, k.id));
  const takten = welt.takten.bind(welt);
  // Vor jedem Takt entscheiden die KIs - so wie im Pruefstand (fahrplan AC-4).
  welt.takten = () => {
    for (const ki of lenker) ki.takt();
    takten();
  };
  return welt;
}

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
    // Sie zaehlen zu den Spielern: zwei Plaetze, ein Mensch und eine KI, sind
    // eine Partie (spielauswahl AC-19).
    { schluessel: 'ki', name: 'KI-Gegner', art: 'zahl', von: 0, bis: 5, vorgabe: 0 },
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
  // Wie viele Plaetze das Spiel selbst besetzt (raeume.js, spielauswahl AC-19).
  plaetze: (einstellungen) => einstellungen.ki || 0,
  erzeugen: mitKi,
  reihenfolge: 1,
};
