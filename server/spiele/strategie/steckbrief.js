// @ts-check
'use strict';

const { Welt, TAKTE_PRO_SEKUNDE, GESCHWINDIGKEITEN } = require('./welt');
const { Ki } = require('./ki');
const { HAEUSER } = require('./daten');
const { zufallAus, VORKOMMEN_VORGABE } = require('./karte');
const stand = require('./stand');

// Computergegner (spielauswahl AC-18, AC-19): sie sitzen auf eigenen Plaetzen
// und spielen nur ueber welt.nachricht, wie ein Mensch (ki AC-1). Ihre Ids
// haben ein "k" - Menschen bekommen acht Hexziffern (raeume.js), also nie
// dieselbe.
function mitKi(spieler, einstellungen) {
  const kis = Array.from({ length: einstellungen.ki || 0 }, (_, i) => ({ id: `ki${i + 1}`, name: `KI ${i + 1}` }));
  const welt = new Welt([...spieler, ...kis], einstellungen.startwert, {
    ...einstellungen,
    teams: teamsAus(einstellungen, spieler, kis),
    haeuser: haeuserAus(einstellungen, spieler, kis),
  });
  if (!kis.length) return welt;
  return kisAnhaengen(welt, kis.map((k) => new Ki(welt, k.id)));
}

// Vor jedem Takt entscheiden die KIs - so wie im Pruefstand (fahrplan AC-4).
// Und sie gehoeren zum Stand (ADR-0017): gesichert wird die Welt samt ihrem
// Gedaechtnis, in einem Zug, damit erhalten bleibt, wer auf dasselbe zeigt.
function kisAnhaengen(welt, lenker) {
  const takten = welt.takten.bind(welt);
  welt.takten = () => {
    for (const ki of lenker) ki.takt();
    takten();
  };
  welt.sichern = () => stand.schreiben({ welt: welt.alsWert(), kis: lenker.map((ki) => ki.alsWert()) });
  return welt;
}

// Eine Partie aus ihrem Stand (speichern AC-1, AC-2): dieselbe Welt, dieselben
// KIs, und sie laeuft Takt fuer Takt weiter wie die, die gesichert wurde.
// Ein Stand einer anderen Fassung wird abgelehnt (AC-17) - `stand.lesen`
// wirft einen `StandFehler` mit dem Satz fuer den Bildschirm.
function laden(bytes) {
  const inhalt = stand.lesen(bytes);
  const welt = Welt.ausWert(inhalt.welt);
  if (!inhalt.kis.length) return welt;
  return kisAnhaengen(welt, inhalt.kis.map((wert) => Ki.ausWert(welt, wert)));
}

// Spielzeit und Karte fuer die Liste im Vorraum - als fertige Saetze, der
// Browser rechnet nichts davon nach.
const KARTEN = { klein: 'klein', normal: 'normal', gross: 'groß' };
/** @param {{ takt: number }} welt @param {Record<string, any>} einstellungen */
function angaben(welt, einstellungen = {}) {
  const sekunden = Math.floor((welt.takt || 0) / TAKTE_PRO_SEKUNDE);
  const uhr = `${Math.floor(sekunden / 60)}:${String(sekunden % 60).padStart(2, '0')}`;
  return [
    { name: 'Spielzeit', wert: uhr },
    { name: 'Karte', wert: KARTEN[einstellungen.kartengroesse] || KARTEN.normal },
  ];
}

// Die Teams aus der Wahl je Platz (spielauswahl AC-22): der Raum reicht sie
// unter `jePlatz` durch, Menschen unter ihrer Id, die KIs als `platz1` ...
// (raeume.js `spielplatz`) - hier wird daraus `ki1` ... Die Welt liest
// `teams = { <id>: 1..4 }`, alles andere ist kein Team (spielziel AC-14).
// Kommen die Teams schon fertig (Tests, Pruefstand), gelten die.
function teamsAus(einstellungen, spieler, kis) {
  if (einstellungen.teams) return einstellungen.teams;
  const je = einstellungen.jePlatz;
  if (!je) return undefined;
  const teams = {};
  for (const s of spieler) if (je[s.id]?.team) teams[s.id] = je[s.id].team;
  kis.forEach((k, i) => {
    const team = je[`platz${i + 1}`]?.team;
    if (team) teams[k.id] = team;
  });
  return teams;
}

// Die Haeuser aus der Wahl je Platz (spielauswahl AC-24), wie die Teams.
// "Zufall" wird hier aufgeloest, aus dem Startwert der Partie: dieselbe
// Partie ergibt dieselben Haeuser. Jeder Platz zieht der Reihe nach - erst
// die Menschen, dann die KIs -, auch wer gewaehlt hat; so haengt das Haus
// eines Platzes nicht davon ab, was die anderen waehlen. Zwei duerfen
// dasselbe Haus haben. Kommen die Haeuser schon fertig (Tests, Pruefstand),
// gelten die; ohne Wahl je Platz spielt niemand ein Haus.
function haeuserAus(einstellungen, spieler, kis) {
  if (einstellungen.haeuser) return einstellungen.haeuser;
  const je = einstellungen.jePlatz;
  if (!je) return undefined;
  const namen = Object.keys(HAEUSER);
  const zufall = zufallAus(((einstellungen.startwert || 0) * 7919 + 29) >>> 0);
  const plaetze = [...spieler.map((s) => [s.id, s.id]), ...kis.map((k, i) => [k.id, `platz${i + 1}`])];
  const haeuser = {};
  for (const [id, platz] of plaetze) {
    const gezogen = namen[Math.floor(zufall() * namen.length)];
    const gewaehlt = je[platz]?.haus;
    haeuser[id] = Object.hasOwn(HAEUSER, gewaehlt ?? '') ? gewaehlt : gezogen;
  }
  return haeuser;
}

// Je Haus ein Eintrag: Name und Wahlspruch, damit alle vor dem Start lesen,
// wofuer ein Haus steht (spielauswahl AC-24). Das Wappen kommt mit den
// Figuren (bedienung AC-46).
const HAUSWAHL = [
  { wert: 'zufall', name: 'Haus: Zufall' },
  ...Object.entries(HAEUSER).map(([wert, haus]) => ({ wert, name: `${haus.name} – ${haus.wahlspruch}` })),
];

const TEAMWAHL = [{ wert: 0, name: 'ohne Team' }, ...[1, 2, 3, 4].map((n) => ({ wert: n, name: `Team ${n}` }))];

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
    // Wie viel man sieht (kampf AC-16): wie im Original Nebel, eine von Anfang
    // an bekannte Karte, oder alles aufgedeckt.
    {
      schluessel: 'sicht', name: 'Sicht', art: 'wahl', vorgabe: 'nebel',
      werte: [
        { wert: 'nebel', name: 'Nebel' },
        { wert: 'erkundet', name: 'Erkundet (Karte bekannt)' },
        { wert: 'aufgedeckt', name: 'Aufgedeckt' },
      ],
    },
    {
      schluessel: 'vorrat', name: 'Startvorrat', art: 'wahl', vorgabe: 'wenig',
      werte: [
        { wert: 'wenig', name: 'wenig (200 Holz, 200 Nahrung, 100 Gold, 200 Stein)' },
        { wert: 'mittel', name: 'mittel (je 500)' },
        { wert: 'viel', name: 'viel (je 1000)' },
      ],
    },
    // Wie viel Gold und Stein auf der Karte liegt (karte AC-19) - die Stufen
    // stehen als VORKOMMEN in der Karte.
    {
      schluessel: 'vorkommen', name: 'Gold und Stein', art: 'wahl', vorgabe: VORKOMMEN_VORGABE,
      werte: [
        { wert: 'wenig', name: 'wenig (nur im Dorf)' },
        { wert: 'mittel', name: 'mittel (dazu umkämpfte Vorkommen)' },
        { wert: 'viel', name: 'viel (dazu eigene vor dem Dorf)' },
      ],
    },
    // Der Drache statt des Trebuchets (ADR-0014, einheiten AC-52): abgeschaltet
    // liegen keine Eier auf der Karte, und kein Kloster ruft ihn.
    {
      schluessel: 'drache', name: 'Drache', art: 'wahl', vorgabe: 'an',
      werte: [{ wert: 'an', name: 'an' }, { wert: 'aus', name: 'aus' }],
    },
    // Ob ein Buendnis waehrend der Partie geloest werden kann (ADR-0013,
    // spielauswahl AC-22). Gelesen wird es erst mit dem Loesen (spielziel AC-21).
    {
      schluessel: 'buendnisse', name: 'Bündnisse', art: 'wahl', vorgabe: 'loesbar',
      werte: [{ wert: 'loesbar', name: 'lösbar' }, { wert: 'fest', name: 'fest' }],
    },
    // Wie lange eine Partie hoechstens dauert (spielziel AC-22, ADR-0013):
    // "wenn ich mit echten spiele, dann soll das auch länger dauern dürfen".
    // Danach unentschieden. 0 heisst keine Grenze.
    {
      schluessel: 'zeitgrenze', name: 'Zeitgrenze', art: 'wahl', vorgabe: 0,
      werte: [
        { wert: 0, name: 'keine' },
        { wert: 90, name: '90 Spielminuten' },
        { wert: 120, name: '120 Spielminuten' },
      ],
    },
    // Wie schnell die Partie laeuft (spielziel AC-23, ADR-0013). Die Werte
    // kommen aus GESCHWINDIGKEITEN in der Welt, damit beide dieselbe Liste
    // kennen. Vorgabe 1,5 (Benutzer, 2026-11-22: nach dem ersten Spiel auf
    // dem Server war 1,0 zaeh); das Formular waehlt sie vor, deshalb steht
    // an keinem Wert ein Zusatz wie "normal".
    {
      schluessel: 'tempo', name: 'Spielgeschwindigkeit', art: 'wahl', vorgabe: 1.5,
      werte: GESCHWINDIGKEITEN.map((wert) => ({ wert, name: wert.toFixed(1).replace('.', ',') })),
    },
  ],
  // Je Platz ein Team oder keins (spielauswahl AC-22). Wer im selben Team
  // ist, ist verbuendet (spielziel AC-14).
  // Und je Platz ein Haus, Vorgabe Zufall (spielauswahl AC-24, ADR-0014).
  jePlatz: [
    { schluessel: 'team', name: 'Team', art: 'wahl', vorgabe: 0, werte: TEAMWAHL },
    { schluessel: 'haus', name: 'Haus', art: 'wahl', vorgabe: 'zufall', werte: HAUSWAHL },
  ],
  // Wie die Plaetze heissen, die das Spiel besetzt - dieselben Namen wie in
  // der Partie (mitKi).
  platzname: (nummer) => `KI ${nummer}`,
  // Was der Raum von diesem Spiel braucht (→ specs/00-plattform/raeume.md AC-16):
  // Takte je echte Sekunde. Eine Spielsekunde bleibt TAKTE_PRO_SEKUNDE
  // Takte; die Spielgeschwindigkeit rechnet mehr davon in derselben Zeit
  // (spielziel AC-23) - 10, 15 oder 20.
  takte: (einstellungen = {}) => Math.round(
    TAKTE_PRO_SEKUNDE * (GESCHWINDIGKEITEN.includes(einstellungen.tempo) ? einstellungen.tempo : 1),
  ),
  // Wie viele Plaetze das Spiel selbst besetzt (raeume.js, spielauswahl AC-19).
  plaetze: (einstellungen) => einstellungen.ki || 0,
  erzeugen: mitKi,
  // Fortsetzen (ADR-0017): der Raum fragt die Welt nach `sichern()` und den
  // Steckbrief nach `laden(bytes)` - mehr weiss er vom Stand nicht (ADR-0006).
  laden,
  // Die Fassung des Stands (speichern AC-17) - die Ablage schreibt sie in die
  // Liste, damit ein Stand, der nicht mehr passt, schon dort zu erkennen ist.
  standFassung: stand.FASSUNG,
  // Was die Liste "Deine Partien" zu einem Stand zeigt (speichern AC-9): der
  // Raum legt es beim Sichern daneben, ohne zu wissen, was es heisst.
  angaben,
  // Der Technologiebaum (bedienung AC-81): erst geladen, wenn ihn jemand
  // aufschlaegt - er baut dafuer eine Welt.
  nachschlagen: { titel: 'Technologiebaum', daten: () => require('./techbaum').techbaum() },
  reihenfolge: 1,
};
