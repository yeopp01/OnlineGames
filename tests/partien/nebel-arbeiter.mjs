// Rechnet ganze Partien KI gegen KI fuer `ki-im-nebel.test.mjs` in einem
// eigenen Faden - vier davon nebeneinander statt vierzig Partien
// hintereinander. Bekommt Startwerte, schickt je Partie das Ende zurueck.
import { parentPort, workerData } from 'node:worker_threads';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { partieSpielen } = require('../../server/spiele/strategie/pruefstand.js');

const enden = workerData.startwerte.map((startwert) => {
  const { ende, spieler } = partieSpielen({ startwert, minuten: workerData.minuten });
  // Wann jede KI zum ersten Mal ein Gebaeude eines Gegners sah (ki AC-13).
  const gegnerMinuten = spieler.map((p) => p.gegnerMinute);
  return { startwert, takt: ende ? ende.takt : null, sieger: ende ? ende.sieger : null, gegnerMinuten };
});
parentPort.postMessage(enden);
