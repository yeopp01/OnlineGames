// Rechnet ganze Partien KI gegen KI fuer `ki-im-nebel.test.mjs` in einem
// eigenen Faden - vier davon nebeneinander statt vierzig Partien
// hintereinander. Bekommt Startwerte und je Startwert die Haeuser, schickt je
// Partie das Ende zurueck und je Spieler, was neu entstanden ist (ki AC-27).
import { parentPort, workerData } from 'node:worker_threads';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { partieSpielen } = require('../../server/spiele/strategie/pruefstand.js');

const enden = workerData.startwerte.map((startwert) => {
  const haeuser = workerData.haeuser[startwert];
  // Jede Einheit, die nach dem ersten Takt zum ersten Mal da ist, nach Art -
  // also ausgebildet; die Startaufstellung zaehlt nicht. Eine bekehrte behaelt
  // ihre Kennung und zaehlt nicht neu, eine verbesserte (Miliz zum Soldaten)
  // bleibt unter der Art, mit der sie kam.
  const gesehen = new Set();
  const neu = {};
  // Ebenso jedes Gebaeude, sobald es fertig ist, nach Art (ki AC-30) - die
  // Startgebaeude zaehlen nicht.
  const fertig = new Set();
  const gebaut = {};
  let erster = true;
  const eingriff = (welt) => {
    for (const g of welt.gebaeude.values()) {
      if (!g.fertig || fertig.has(g.id)) continue;
      fertig.add(g.id);
      if (erster) continue;
      gebaut[g.besitzer] ??= {};
      gebaut[g.besitzer][g.art] = (gebaut[g.besitzer][g.art] || 0) + 1;
    }
    for (const e of welt.einheiten.values()) {
      if (gesehen.has(e.id)) continue;
      gesehen.add(e.id);
      if (erster) continue;
      neu[e.besitzer] ??= {};
      neu[e.besitzer][e.art] = (neu[e.besitzer][e.art] || 0) + 1;
    }
    erster = false;
  };
  const { ende, spieler } = partieSpielen({ startwert, minuten: workerData.minuten, einstellungen: { haeuser }, eingriff });
  // Wann jede KI zum ersten Mal ein Gebaeude eines Gegners sah (ki AC-13).
  const gegnerMinuten = spieler.map((p) => p.gegnerMinute);
  return { startwert, haeuser, takt: ende ? ende.takt : null, sieger: ende ? ende.sieger : null, gegnerMinuten, neu, gebaut };
});
parentPort.postMessage(enden);
