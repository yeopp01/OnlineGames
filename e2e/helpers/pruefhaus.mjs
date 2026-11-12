// Ein Haus ohne Boni, nur im Browserlauf (spielziel AC-26, Runde 170).
//
// Browsertests, die nicht von Haeusern handeln, spielen ein Haus ohne Boni -
// wie wer nicht vom Nebel handelt, aufgedeckt eroeffnet. Bis Runde 169 war
// das Silberfurt; seit seine Boni gebaut sind, hat keins der fuenf Haeuser
// mehr keine. Statt einem echten Haus die Boni zu nehmen, legt der Browserlauf
// ein sechstes an - in beiden Prozessen: `e2e/server.mjs` importiert diese
// Datei, bevor es den Server laedt (der Steckbrief liest die Haeuser beim
// Laden), und `e2e/helpers/seite.mjs`, damit jeder Test dieselben Haeuser
// sieht wie der Server, auch die, die im Warteraum auf Zufall ziehen.
//
// Die Simulation kennt kein einzelnes Haus (spielziel AC-17): ein Eintrag in
// `HAEUSER` mit leeren `boni` genuegt, `tests/strategie-haeuser.test.mjs`
// prueft dasselbe fuer ein sechstes Haus (fahrplan AC-17).
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { HAEUSER } = require('../../server/spiele/strategie/daten.js');

export const PRUEFHAUS = 'pruefhaus';

HAEUSER[PRUEFHAUS] ??= { name: 'Prüfhaus', sitz: 'Browserlauf', wahlspruch: 'Ohne Boni.', boni: {} };
