// Rechnet ganze Partien KI gegen KI fuer `ki-im-nebel.test.mjs` in einem
// eigenen Faden - vier davon nebeneinander statt vierzig Partien
// hintereinander. Bekommt Startwerte und je Startwert die Haeuser, schickt je
// Partie das Ende zurueck und je Spieler, was neu entstanden ist (ki AC-27).
import { parentPort, workerData } from 'node:worker_threads';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { partieSpielen } = require('../../server/spiele/strategie/pruefstand.js');
const { EINHEITEN } = require('../../server/spiele/strategie/daten.js');

// Die Art am Anfang einer Linie: der Pikenier zaehlt als Speerkaempfer.
const grundart = (art) => {
  while (EINHEITEN[art]?.stufeVon) art = EINHEITEN[art].stufeVon;
  return art;
};

const TAKTE_JE_MINUTE = 600;
// Unter so vielen Dorfbewohnern ist ein Dorf geschlagen (ki AC-35), vom Test gesetzt.
const BRUCH = workerData.bruch;

const enden = workerData.startwerte.map((startwert) => {
  const haeuser = workerData.haeuser[startwert];
  // Jede Einheit, die nach dem ersten Takt zum ersten Mal da ist, nach Art -
  // also ausgebildet; die Startaufstellung zaehlt nicht. Eine bekehrte behaelt
  // ihre Kennung und zaehlt nicht neu, eine verbesserte (Miliz zum Soldaten)
  // bleibt unter der Art, mit der sie kam. Eine, die nach einer Stufe kommt,
  // zaehlt unter der Art am Anfang ihrer Linie - ausgebildet wird sie im
  // selben Gebaeude (ki AC-35: sonst bildete Distelhag nach dem Pikenier
  // scheinbar nichts mehr aus der Kaserne aus).
  const gesehen = new Set();
  const neu = {};
  // Ebenso jedes Gebaeude, sobald es fertig ist, nach Art (ki AC-30) - die
  // Startgebaeude zaehlen nicht.
  const fertig = new Set();
  const gebaut = {};
  let erster = true;
  // Je KI (ki AC-35): wann sie das Fuerstentum erreichte, wann danach ihr
  // Dorf zusammenbrach - zum ersten Mal weniger als `BRUCH` Dorfbewohner,
  // gezaehlt zu jeder vollen Spielminute -, und was sie erforscht hat.
  const forschung = {};
  let welt0 = null;
  const eingriff = (welt) => {
    welt0 = welt;
    if (welt.takt % TAKTE_JE_MINUTE === 0) {
      for (const s of welt.spieler) {
        const f = (forschung[s.id] ??= { fuerst: null, krone: null, bruch: null, verbesserungen: [] });
        if (f.fuerst === null && s.zeitalter >= 2) f.fuerst = welt.takt;
        // Wann sie die Krone erreichte (ki AC-39), zur vollen Spielminute.
        if (f.krone === null && s.zeitalter >= 3) f.krone = welt.takt;
        if (f.fuerst === null || f.bruch !== null) continue;
        let dorf = 0;
        for (const e of welt.einheiten.values()) if (e.besitzer === s.id && !e.tot && e.art === 'dorfbewohner') dorf += 1;
        if (dorf < BRUCH) f.bruch = welt.takt;
      }
    }
    // Der Drache (ki AC-29, einheiten AC-52): wann ein Ei zum ersten Mal in
    // ihrem Kloster lag, wann sie zum ersten Mal rief und wann ihr Drache
    // zum ersten Mal stand - alle sechs Spielsekunden nachgesehen.
    if (welt.drachenAn && welt.takt % 60 === 0) {
      for (const s of welt.spieler) {
        const f = (forschung[s.id] ??= { fuerst: null, krone: null, bruch: null, verbesserungen: [] });
        f.ei ??= null;
        f.ruf ??= null;
        f.drache ??= null;
        if (f.ei === null) {
          for (const ei of welt.eier.values()) if (ei.kloster !== null && welt.gebaeude.get(ei.kloster)?.besitzer === s.id) f.ei = welt.takt;
        }
        if (f.ruf === null && welt.rufVon(s.id)) f.ruf = welt.takt;
        if (f.drache === null && welt.dracheVon(s.id)) f.drache = welt.takt;
      }
    }
    for (const g of welt.gebaeude.values()) {
      if (!g.fertig || fertig.has(g.id)) continue;
      fertig.add(g.id);
      if (erster) continue;
      // Wann ihre erste Burg fertig war (ki AC-28: danach die Einheit des Hauses).
      if (g.art === 'burg') {
        const f = (forschung[g.besitzer] ??= { fuerst: null, krone: null, bruch: null, verbesserungen: [] });
        f.burg ??= welt.takt;
      }
      gebaut[g.besitzer] ??= {};
      gebaut[g.besitzer][g.art] = (gebaut[g.besitzer][g.art] || 0) + 1;
    }
    for (const e of welt.einheiten.values()) {
      if (gesehen.has(e.id)) continue;
      gesehen.add(e.id);
      if (erster) continue;
      neu[e.besitzer] ??= {};
      const art = grundart(e.art);
      neu[e.besitzer][art] = (neu[e.besitzer][art] || 0) + 1;
    }
    erster = false;
  };
  const { ende, spieler } = partieSpielen({ startwert, minuten: workerData.minuten, einstellungen: { haeuser }, eingriff });
  // Wann jede KI zum ersten Mal ein Gebaeude eines Gegners sah (ki AC-13).
  const gegnerMinuten = spieler.map((p) => p.gegnerMinute);
  // Wie oft jede KI ein Heer losgeschickt hat (ki AC-30: Tuerme erst danach).
  const angriffe = Object.fromEntries(spieler.map((p, i) => [`ki${i + 1}`, p.angriffe]));
  for (const s of welt0.spieler) if (forschung[s.id]) forschung[s.id].verbesserungen = [...s.verbesserungen];
  return { startwert, haeuser, takt: ende ? ende.takt : null, sieger: ende ? ende.sieger : null, gegnerMinuten, neu, gebaut, angriffe, forschung };
});
parentPort.postMessage(enden);
