// @ts-check
'use strict';

// Aus jeder Chance eine Szene (spieltag AC-27 bis AC-29). In M1 ist die
// Szene Kleidung, keine Rechnung: ob eine Chance ein Tor wird, hat
// `abschnitt()` schon entschieden. Art, Zone, die Beteiligten eines
// Fehlschusses, sein Ausgang und der Satz kommen danach aus einer eigenen
// Quelle (`spiel.szenen.zufall`) - der Zufall des Spiels wird nicht
// angeruehrt, deshalb aendert eine Szene kein Ergebnis (AC-28).
//
// Erst M2 laesst Faehigkeiten an den Gewichten drehen
// (→ docs/manager/plan.md, M1).

const { ziehen } = require('./zufall');
const { SAETZE, einsetzen } = require('./texte');

/** @typedef {import('./daten').Spiel} Spiel */
/** @typedef {import('./daten').Platzspieler} Platzspieler */
/** @typedef {import('./daten').Seite} Seite */
/** @typedef {import('./daten').Ereignis} Ereignis */
/** @typedef {import('./daten').Szene} Szene */
/** @typedef {import('./daten').Szenenstand} Szenenstand */

/**
 * Eine Chance, wie `abschnitt()` sie sich merkt: wer auf dem Platz stand, als
 * der Abschnitt begann, und ob es ein Tor war.
 * @typedef {object} Rohchance
 * @property {0|1} seite
 * @property {number} von          erste Minute des Abschnitts
 * @property {Platzspieler[]} auf  die eigene Elf zu Beginn des Abschnitts
 * @property {Platzspieler[]} gegen die des Gegners
 * @property {Ereignis|null} tor
 */

const ARTEN = ['konter', 'flanke', 'steilpass', 'fernschuss', 'ecke', 'freistoss', 'elfmeter', 'einzelaktion', 'abstauber'];

/** Arten, in denen ein Mitspieler den Ball auflegt - die anderen kommen ohne aus. */
const MIT_VORLAGE = new Set(['konter', 'flanke', 'steilpass', 'ecke', 'abstauber']);

/** Wie oft eine Art vorkommt; Konter mehr, wer mauert, Flanke und Steilpass mehr, wer stuermt. */
const ART_GEWICHT = {
  konter: 14, flanke: 22, steilpass: 16, fernschuss: 16, ecke: 10, freistoss: 6, elfmeter: 2, einzelaktion: 8, abstauber: 6,
};

/** Wie eine Chance ohne Tor endet, je Art. Was fehlt, gibt es bei dieser Art nicht. */
const AUSGANG_GEWICHT = {
  konter: { gehalten: 34, vorbei: 30, pfosten: 5, geblockt: 16, abseits: 15 },
  flanke: { gehalten: 28, vorbei: 40, pfosten: 5, geblockt: 19, abseits: 8 },
  steilpass: { gehalten: 32, vorbei: 26, pfosten: 5, geblockt: 15, abseits: 22 },
  fernschuss: { gehalten: 35, vorbei: 40, pfosten: 7, geblockt: 18 },
  ecke: { gehalten: 30, vorbei: 35, pfosten: 5, geblockt: 30 },
  freistoss: { gehalten: 35, vorbei: 30, pfosten: 7, geblockt: 28 },
  elfmeter: { gehalten: 60, vorbei: 30, pfosten: 10 },
  einzelaktion: { gehalten: 32, vorbei: 34, pfosten: 6, geblockt: 28 },
  abstauber: { gehalten: 40, vorbei: 30, pfosten: 6, geblockt: 24 },
};

/** Wo eine Art spielt: Tiefe und Seite, aus Sicht des Angreifers. */
const ZONE_JE_ART = {
  konter: [['strafraum', 'links'], ['strafraum', 'mitte'], ['strafraum', 'rechts']],
  flanke: [['strafraum', 'links'], ['strafraum', 'rechts']],
  steilpass: [['strafraum', 'links'], ['strafraum', 'mitte'], ['strafraum', 'rechts']],
  fernschuss: [['vorfeld', 'links'], ['vorfeld', 'mitte'], ['vorfeld', 'rechts']],
  ecke: [['strafraum', 'links'], ['strafraum', 'rechts']],
  freistoss: [['vorfeld', 'links'], ['vorfeld', 'mitte'], ['vorfeld', 'rechts']],
  elfmeter: [['strafraum', 'mitte']],
  einzelaktion: [['strafraum', 'links'], ['strafraum', 'mitte'], ['strafraum', 'rechts'], ['vorfeld', 'mitte']],
  abstauber: [['strafraum', 'mitte']],
};

/** Wer abschliesst und wer auflegt, nach der Reihe seines Platzes. Ein Torwart nie. */
const ABSCHLUSS = { TOR: 0, ABW: 1, MIT: 3, ANG: 6 };
const VORLAGE = { TOR: 0, ABW: 2, MIT: 4, ANG: 3 };

const nachname = (name) => name.split(' ').pop();

/**
 * Was eine Szene braucht, damit `kleiden()` zieht - beim Anpfiff angelegt.
 * Genannt wird der Nachname; kommt er in dieser Begegnung zweimal vor, der
 * ganze Name (die Welt hat 60 Nachnamen fuer 720 Spieler).
 * @param {import('./daten').Zufallsstand} stand
 * @param {[string, string]} vereine  Heim, Gast
 * @param {Seite[]} seiten
 */
function szenenAnlegen(stand, vereine, seiten) {
  if (!stand || !Number.isInteger(stand.a)) throw new Error('Szenen brauchen eine eigene Quelle aus zufallAus() oder ihren Stand.');
  const alle = seiten.flatMap((s) => [...s.auf, ...s.bank]);
  const wieOft = {};
  for (const s of alle) wieOft[nachname(s.name)] = (wieOft[nachname(s.name)] || 0) + 1;
  /** @type {Object<string, string>} */
  const genannt = {};
  for (const s of alle) genannt[s.id] = wieOft[nachname(s.name)] > 1 ? s.name : nachname(s.name);
  /** @type {Szenenstand} */
  const szenen = { zufall: { a: stand.a }, namen: vereine, genannt, liste: [], benutzt: [] };
  return szenen;
}

function gewichtet(eintraege, zufall) {
  const summe = eintraege.reduce((s, [, g]) => s + g, 0);
  if (summe <= 0) return null;
  let wurf = zufall() * summe;
  for (const [wert, g] of eintraege) {
    wurf -= g;
    if (wurf < 0) return wert;
  }
  return eintraege[eintraege.length - 1][0];
}

/** Stand er in dieser Minute auf dem Platz? Nach `minuten` der Seite, wie AC-17 es prueft. */
function aufDemPlatz(seite, id, minute) {
  const m = seite.minuten[id];
  return !!m && m.von <= minute && (m.bis == null || m.bis >= minute);
}

/** Der Torwart des Gegners in dieser Minute - ist keiner mehr da, steht ein Feldspieler im Tor. */
function torwartIn(seite, gegen, minute) {
  const da = gegen.filter((s) => aufDemPlatz(seite, s.id, minute));
  const jetzt = seite.auf.filter((s) => aufDemPlatz(seite, s.id, minute));
  return da.find((s) => s.platz === 'TW') || jetzt.find((s) => s.platz === 'TW') || da[0] || jetzt[0] || null;
}

/**
 * Ein Satz, der in diesem Spiel noch nicht kam. Sind alle eines Paars
 * verbraucht, nimmt sie einen anderen Ausgang derselben Art (nur ohne Tor)
 * und dann eine andere Art - ein Tor bleibt ein Tor.
 */
function satzWaehlen(szenen, art, ausgang, mitVorlage, zufall) {
  const versuche = [[art, ausgang]];
  if (ausgang !== 'tor') for (const anders of Object.keys(AUSGANG_GEWICHT[art])) versuche.push([art, anders]);
  for (const andere of ARTEN) {
    if (andere === art || MIT_VORLAGE.has(andere) !== mitVorlage) continue;
    if (ausgang === 'tor') versuche.push([andere, 'tor']);
    else for (const anders of Object.keys(AUSGANG_GEWICHT[andere])) versuche.push([andere, anders]);
  }
  for (const [a, g] of versuche) {
    const frei = SAETZE[a][g].map((_, i) => i).filter((i) => !szenen.benutzt.includes(`${a}/${g}/${i}`));
    if (!frei.length) continue;
    const i = frei[Math.floor(zufall() * frei.length)];
    szenen.benutzt.push(`${a}/${g}/${i}`);
    return { art: a, ausgang: g, satz: SAETZE[a][g][i] };
  }
  throw new Error('Alle Sätze verbraucht - texte.js braucht mehr.');
}

/**
 * Kleidet die Chancen eines Abschnitts in Szenen. Liest den Abschnitt erst,
 * wenn er gerechnet ist: wer in diesem Abschnitt vom Platz flog, schiesst
 * nach seiner Minute nicht mehr.
 * @param {Spiel} spiel
 * @param {Rohchance[]} roh
 */
function kleiden(spiel, roh) {
  const szenen = spiel.szenen;
  if (!szenen || !roh.length) return;
  const zufall = () => ziehen(szenen.zufall);
  const neu = [];
  for (const chance of roh) {
    const seite = spiel.seiten[chance.seite];
    const gegner = spiel.seiten[1 - chance.seite];
    let minute;
    let abschluss;
    let vorlage = null;
    let art;
    if (chance.tor) {
      minute = chance.tor.minute;
      abschluss = chance.auf.find((s) => s.id === chance.tor.spielerId);
      vorlage = chance.tor.vorlageId ? chance.auf.find((s) => s.id === chance.tor.vorlageId) || null : null;
      const passend = ARTEN.filter((a) => MIT_VORLAGE.has(a) === !!vorlage);
      art = gewichtet(passend.map((a) => [a, artGewicht(a, seite)]), zufall);
    } else {
      minute = chance.von + Math.floor(zufall() * 5);
      const da = chance.auf.filter((s) => aufDemPlatz(seite, s.id, minute));
      if (!da.length) continue;
      abschluss = gewichtet(da.map((s) => [s, ABSCHLUSS[s.position] || 0]), zufall) || da[0];
      art = gewichtet(ARTEN.map((a) => [a, artGewicht(a, seite)]), zufall);
      if (MIT_VORLAGE.has(art)) {
        const andere = da.filter((s) => s.id !== abschluss.id);
        vorlage = gewichtet(andere.map((s) => [s, VORLAGE[s.position] || 0.5]), zufall);
        if (!vorlage) art = 'fernschuss';
      }
    }
    const torwart = torwartIn(gegner, chance.gegen, minute);
    const ausgang = chance.tor ? 'tor' : gewichtet(Object.entries(AUSGANG_GEWICHT[art]), zufall);
    const gewaehlt = satzWaehlen(szenen, art, ausgang, MIT_VORLAGE.has(art), zufall);
    const zonen = ZONE_JE_ART[gewaehlt.art];
    const [tiefe, flanke] = zonen[Math.floor(zufall() * zonen.length)];
    const genannt = (s) => szenen.genannt[s.id] || nachname(s.name);
    const namen = {
      abschluss: genannt(abschluss),
      vorlage: vorlage ? genannt(vorlage) : null,
      torwart: torwart ? genannt(torwart) : 'der Torwart',
      verein: szenen.namen[chance.seite],
      gegner: szenen.namen[1 - chance.seite],
    };
    /** @type {Szene} */
    const szene = {
      minute,
      seite: chance.seite === 0 ? 'heim' : 'gast',
      verein: seite.id,
      art: gewaehlt.art,
      zone: `${tiefe}-${flanke}`,
      beteiligte: { abschluss: abschluss.id, vorlage: vorlage ? vorlage.id : null, torwart: torwart ? torwart.id : null },
      ausgang: gewaehlt.ausgang,
      satz: einsetzen(gewaehlt.satz, namen),
    };
    neu.push(szene);
  }
  neu.sort((a, b) => a.minute - b.minute);
  szenen.liste.push(...neu);
}

function artGewicht(art, seite) {
  const ausrichtung = seite.taktik.ausrichtung;
  if (art === 'konter') return ART_GEWICHT.konter * (6 - ausrichtung) / 3;
  if (art === 'flanke' || art === 'steilpass') return ART_GEWICHT[art] * (ausrichtung + 3) / 6;
  return ART_GEWICHT[art];
}

module.exports = { kleiden, szenenAnlegen, ARTEN, MIT_VORLAGE, AUSGANG_GEWICHT, ZONE_JE_ART };
