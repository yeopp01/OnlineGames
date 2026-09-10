'use strict';

// Die Liga: Spielplan, Tabelle, Auf- und Abstieg. Ohne eigenen Zustand -
// die Karriere reicht hinein, was sie hat.

const SIEG = 3;
const UNENTSCHIEDEN = 1;
const AUF_UND_AB = 3;

/**
 * Spielplan nach dem Kreisverfahren: einer bleibt stehen, die anderen
 * ruecken auf. Jeder gegen jeden, hin und zurueck; in der Rueckrunde dreht
 * sich das Heimrecht.
 *
 * @param {string[]} ids  Vereine in der Reihenfolge, die der Zufall vorgibt
 */
function spielplan(ids) {
  const feldStart = ids.slice();
  if (feldStart.length % 2) feldStart.push(null);
  const anzahl = feldStart.length;
  const hinrunde = [];
  let feld = feldStart;
  for (let runde = 0; runde < anzahl - 1; runde++) {
    const spieltag = [];
    for (let i = 0; i < anzahl / 2; i++) {
      const a = feld[i];
      const b = feld[anzahl - 1 - i];
      if (a === null || b === null) continue;
      spieltag.push(runde % 2 === 0 ? { heim: a, gast: b } : { heim: b, gast: a });
    }
    hinrunde.push(spieltag);
    feld = [feld[0], feld[anzahl - 1], ...feld.slice(1, anzahl - 1)];
  }
  const rueckrunde = hinrunde.map((tag) => tag.map((p) => ({ heim: p.gast, gast: p.heim })));
  return [...hinrunde, ...rueckrunde];
}

function leereTabelle(vereine) {
  return vereine.map((v) => ({
    id: v.id, name: v.name, spiele: 0, siege: 0, unentschieden: 0, niederlagen: 0,
    tore: 0, gegentore: 0, punkte: 0, abzug: v.abzug || 0,
  }));
}

function verbuchen(tabelle, ergebnis) {
  const heim = tabelle.find((z) => z.id === ergebnis.heim);
  const gast = tabelle.find((z) => z.id === ergebnis.gast);
  const [th, tg] = ergebnis.tore;
  heim.spiele += 1;
  gast.spiele += 1;
  heim.tore += th;
  heim.gegentore += tg;
  gast.tore += tg;
  gast.gegentore += th;
  if (th > tg) {
    heim.siege += 1; gast.niederlagen += 1; heim.punkte += SIEG;
  } else if (th < tg) {
    gast.siege += 1; heim.niederlagen += 1; gast.punkte += SIEG;
  } else {
    heim.unentschieden += 1; gast.unentschieden += 1; heim.punkte += UNENTSCHIEDEN; gast.punkte += UNENTSCHIEDEN;
  }
}

/** Die Punkte, die zaehlen: erspielt minus Abzug. */
const wertung = (zeile) => zeile.punkte - (zeile.abzug || 0);

// Punkte, dann Tordifferenz, dann Tore, dann Name - die Reihenfolge steht
// auch bei voelliger Gleichheit fest.
function sortiert(tabelle) {
  return tabelle.slice().sort((a, b) => (
    wertung(b) - wertung(a)
    || (b.tore - b.gegentore) - (a.tore - a.gegentore)
    || b.tore - a.tore
    || a.name.localeCompare(b.name)
  ));
}

/** Die letzten drei der ersten Liga steigen ab, die ersten drei der zweiten auf. */
function aufUndAbstieg(tabelleErste, tabelleZweite) {
  return {
    absteiger: sortiert(tabelleErste).slice(-AUF_UND_AB).map((z) => z.id),
    aufsteiger: sortiert(tabelleZweite).slice(0, AUF_UND_AB).map((z) => z.id),
  };
}

module.exports = {
  SIEG, UNENTSCHIEDEN, AUF_UND_AB,
  spielplan, leereTabelle, verbuchen, sortiert, wertung, aufUndAbstieg,
};
