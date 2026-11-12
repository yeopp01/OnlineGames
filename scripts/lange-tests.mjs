// Lange Tests im ersten Abschnitt von `npm test` finden (Rueckschau nach
// Runde 173).
//
// `npm test` laeuft in zwei Abschnitten: erst `tests/*.test.mjs` und
// `scripts/**`, danach `tests/partien/`. `node --test` rechnet Dateien
// nebeneinander, Tests einer Datei nacheinander - der erste Abschnitt dauert
// also so lange wie seine laengste Datei, und neben ihr laufen die
// Zeitmessungen (einheiten AC-31). Die Regel "ueber eine Minute je Datei
// kommt nach tests/partien/" stand seit Runde 152 in der Anweisung, und
// trotzdem lag dort ein Test mit 171 s, zwanzig ganze Partien hintereinander:
// er allein bestimmte die 205 s des ersten Abschnitts. Gesehen hat das
// niemand, weil `check:kurz` die Dauer einzelner Tests verschweigt.
//
// Gelesen wird die Ausgabe des Berichterstatters `spec`: Tests der obersten
// Ebene stehen ohne Einrueckung und enden auf "(<ms>ms)", jeder Abschnitt
// schliesst mit "duration_ms <zahl>". Das Zeichen vorn (Haken oder Kreuz)
// haengt an der Kodierung, deshalb wird nur "kein Leerraum" verlangt.

const OBERSTER_TEST = /^\S+ (.+) \((\d+(?:\.\d+)?)ms\)\s*$/;
const ABSCHNITTSENDE = /duration_ms \d/;

/**
 * Die Tests der obersten Ebene im ersten Abschnitt, die laenger als
 * `grenzeMs` rechneten, laengster zuerst: [{ name, ms }].
 */
export function langeImErstenAbschnitt(text, grenzeMs) {
  const lang = [];
  for (const zeile of text.split(/\r?\n/)) {
    if (ABSCHNITTSENDE.test(zeile)) break;
    const treffer = OBERSTER_TEST.exec(zeile);
    if (treffer && Number(treffer[2]) > grenzeMs) lang.push({ name: treffer[1], ms: Number(treffer[2]) });
  }
  return lang.sort((a, b) => b.ms - a.ms);
}

// Ueber anderthalb Minuten. Gemessen unter Last (Blender auf allen Kernen,
// Runde 173): die laengsten, die bleiben, rechnen 64 bis 74 s - ki AC-12,
// ki AC-21, ki AC-26, je ueber zwanzig oder sechzehn Partien. Ohne Last
// etwa die Haelfte. Ein Test darueber ist kein Ausreisser mehr, sondern
// eine Partienreihe am falschen Ort.
export const GRENZE_MS = 90_000;
