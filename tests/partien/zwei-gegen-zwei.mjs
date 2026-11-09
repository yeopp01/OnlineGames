// Zwei gegen zwei im Pruefstand (ki AC-25, fahrplan AC-24) - geteilt auf
// mehrere Testdateien, je fuenf Startwerte. `node --test` rechnet Dateien
// nebeneinander, Tests einer Datei nacheinander: zwanzig Partien zu viert
// rechnen rund zwei Minuten, in einer Datei verlaengerten sie `npm run check`
// um ebenso viel (Runde 151, gemessen; vgl. Runde 97).
//
// **Ein eigener Ordner, ein eigener Abschnitt von `npm test`** (Rueckschau
// nach Runde 152): neben diesen vier Prozessen riss einheiten AC-31 (800
// Angreifer unter 1 ms) - 1,389 und 1,156 ms im Lauf, 0,28 ms allein. Ein
// niedrigerer Vorrang half nicht (einer von zwei Laeufen rot): die Maschine
// hat acht logische Kerne, und zwei Prozesse auf einem Kern teilen sich
// Rechenwerk und Zwischenspeicher, gleich wer Vorrang hat. Deshalb laeuft
// `tests/partien/` nach allen anderen Tests, untereinander nebeneinander.
// Die Grenzen bleiben. Hier keine Zeitmessung hinlegen.
//
// Die Teams sind **Nachbarn**: KI 1 und KI 2 gegen KI 3 und KI 4. Zu viert
// liegen die Doerfer im Quadrat, KI 1 und KI 3 uebers Eck. Waeren die
// Verbuendeten uebers Eck, laege der naechste Nachbar jeder KI ohnehin im
// anderen Team - dann waere die Messung auch mit einer KI gruen, die nicht
// nach Teams fragt (Runde 151: mit HEAD gemessen, Takt fuer Takt dieselben
// Enden). Neben dem Verbuendeten zieht eine solche KI zuerst zu ihm.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { partieSpielen } = require('../../server/spiele/strategie/pruefstand.js');
const { TAKTE_PRO_SEKUNDE } = require('../../server/spiele/strategie/welt.js');

export const TEAMS = { ki1: 1, ki2: 1, ki3: 2, ki4: 2 };
export const MINUTEN = 90;

/**
 * Eine Partie zu viert, und was dabei zwischen den Spielern geschah:
 * jeder Schaden nach Besitzern, jeder Angriffslauf nach dem Dorf, auf das er
 * zielt - das, dessen Basis dem Marschziel am naechsten liegt, wenn es naeher
 * liegt als die eigene (sonst ist es ein Marsch nach Hause, ki AC-14).
 */
export function zweiGegenZwei(startwert) {
  const z = { verbuendet: 0, fremd: 0, laeufeVerbuendet: 0, laeufeFremd: 0 };
  let beobachtet = false;
  const r = partieSpielen({
    startwert,
    spieler: 4,
    minuten: MINUTEN,
    einstellungen: { teams: TEAMS },
    eingriff(welt) {
      if (beobachtet) return;
      beobachtet = true;
      // Jeder Schlag, jeder Pfeil, jeder Stein rechnet hier seinen Schaden
      // (welt.schlagen, welt.einschlaegeTakten) - auch der Turm.
      const schaden = welt.schaden.bind(welt);
      welt.schaden = (angreifer, ziel, gebaeude) => {
        if (angreifer.besitzer !== ziel.besitzer) {
          if (welt.feindlich(angreifer.besitzer, ziel.besitzer)) z.fremd++;
          else z.verbuendet++;
        }
        return schaden(angreifer, ziel, gebaeude);
      };
      const nachricht = welt.nachricht.bind(welt);
      welt.nachricht = (id, n) => {
        if (n?.auftrag === 'befehl' && n.angriffslauf && n.ziel) {
          const weit = (b) => Math.hypot(b.x - n.ziel.x, b.y - n.ziel.y);
          const andere = welt.spieler.filter((s) => s.id !== id).sort((a, b) => weit(a.basis) - weit(b.basis));
          if (andere.length && weit(andere[0].basis) < weit(welt.spielerVon(id).basis)) {
            if (welt.feindlich(id, andere[0].id)) z.laeufeFremd++;
            else z.laeufeVerbuendet++;
          }
        }
        return nachricht(id, n);
      };
    },
  });
  return { ...z, ende: r.ende, sieger: r.sieger };
}

/** Die Tests fuer die Startwerte `von` bis `bis`. */
export function satz(von, bis) {
  const gespielt = new Map();
  const partie = (startwert) => {
    if (!gespielt.has(startwert)) gespielt.set(startwert, zweiGegenZwei(startwert));
    return gespielt.get(startwert);
  };

  test(`ki AC-25: zwei gegen zwei, Startwerte ${von} bis ${bis} - kein Schaden zwischen Verbuendeten, kein Angriffslauf zu ihnen`, () => {
    // Gemessen in Runde 151 ueber die Startwerte 1 bis 20: null Schlaege
    // zwischen Verbuendeten bei 5.900 bis 23.300 zwischen Gegnern, null
    // Angriffslaeufe zu Verbuendeten bei 48 bis 136 zu Gegnern. Mit der KI
    // von Runde 150, die nicht nach Teams fragte, waren es 255 bis 314
    // Angriffslaeufe zum verbuendeten Nachbarn je Partie (Startwerte 1 bis 3)
    // - geschadet haben auch sie nicht, das verhindert die Welt (spielziel
    // AC-14). Die Schlaege belegen also die Welt, die Laeufe die KI.
    for (let startwert = von; startwert <= bis; startwert++) {
      const r = partie(startwert);
      assert.equal(r.verbuendet, 0, `Startwert ${startwert}: ${r.verbuendet} Schlaege zwischen Verbuendeten`);
      assert.equal(r.laeufeVerbuendet, 0, `Startwert ${startwert}: ${r.laeufeVerbuendet} Angriffslaeufe zu Verbuendeten`);
      // Gegenprobe: es wurde gekaempft - sonst hiesse null nichts.
      assert.ok(r.fremd > 1000, `Startwert ${startwert}: nur ${r.fremd} Schlaege zwischen Gegnern`);
      assert.ok(r.laeufeFremd > 10, `Startwert ${startwert}: nur ${r.laeufeFremd} Angriffslaeufe zu Gegnern`);
    }
  });

  test(`fahrplan AC-24: zwei gegen zwei, Startwerte ${von} bis ${bis} - jede Partie endet vor Minute ${MINUTEN} mit einem siegreichen Team`, () => {
    // Gemessen in Runde 151: 20 von 20 entschieden, Minute 35,4 bis 52,4,
    // Median 39,6; jedes Team gewinnt mal (KI 1 + KI 2 achtmal). Mit der KI
    // von Runde 150 endeten die Startwerte 1 bis 3 nach 90 Minuten
    // unentschieden - ihr Heer zog zum Nachbarn, der ein Verbuendeter war.
    for (let startwert = von; startwert <= bis; startwert++) {
      const { ende } = partie(startwert);
      assert.ok(ende, `Startwert ${startwert}: bis Minute ${MINUTEN} nicht entschieden`);
      assert.equal(ende.grund, 'eroberung', `Startwert ${startwert}: ${ende.grund}`);
      assert.ok(ende.team, `Startwert ${startwert}: ein Team hat gewonnen`);
      assert.equal(ende.gewinner.length, 2, `Startwert ${startwert}: beide des Teams`);
      assert.ok(ende.takt < MINUTEN * 60 * TAKTE_PRO_SEKUNDE, `Startwert ${startwert}: vor Minute ${MINUTEN}`);
    }
  });
}
