#!/usr/bin/env node
// Vorher und nachher im Pruefstand (Rueckschau nach Runde 92): derselbe Satz
// Partien mit dem Arbeitsstand und mit einem eingecheckten Stand, Zeile neben
// Zeile.
//
//   npm run pruefstand:vergleich                          Arbeitsstand gegen HEAD, 20 Partien, 22 min
//   npm run pruefstand:vergleich -- --gegen HEAD~3 --minuten 30 --partien 20
//   npm run pruefstand:vergleich -- --minuten 90 --saetze 2      Startwerte 1-20 und 21-40
//   npm run pruefstand:vergleich -- --probe <datei.cjs> --saetze 3   eine Austauschprobe auf 60 Startwerten
//   npm run pruefstand:vergleich -- --teams 1,1,2,2 --minuten 90     zwei gegen zwei, KI 1 und 2 gegen 3 und 4
//
// **Teams** (Rueckschau nach Runde 152): `--teams` nennt je Spieler sein
// Team, die Zahl der Spieler folgt daraus (sonst `--spieler`, Vorgabe 2).
// Zu viert liegen die Doerfer im Quadrat - KI 1 und 2 sind Nachbarn, KI 1
// und 3 uebers Eck. Wer eine Regel fuer Verbuendete misst, macht sie zu
// Nachbarn: mit Verbuendeten uebers Eck ist der naechste Nachbar ohnehin ein
// Gegner, und HEAD rechnete in Runde 151 Takt fuer Takt dieselben Partien.
// In jener Runde entstanden dafuer ein Wegwerfskript und eine Kopie von HEAD
// von Hand. Gewonnen hat eine Partie, wenn `ende.gewinner` jemanden nennt -
// ein Team sind zwei.
//
// **Austauschprobe** (Rueckschau nach Runde 147): `--probe` laedt eine
// CommonJS-Datei, die eine Funktion ausfuehrt, bevor gerechnet wird. Sie
// bekommt `laden(datei)` und ersetzt damit etwas **nur im Arbeitsstand** -
// der andere Stand hat eigene Module. So fragt man "liegt es an dieser
// Methode?", ohne den Code zu aendern:
//
//   module.exports = (laden) => {
//     const { Ki } = laden('ki.js');
//     const alt = Ki.prototype.ueberlegen;
//     Ki.prototype.ueberlegen = function () { /* Variante */ return alt.call(this); };
//   };
//
// In Runde 144 entstanden dafuer drei Wegwerfskripte, jedes mit eigener
// Ausgabe und eigener Schleife ueber die Startwerte. Und: eine Variante
// gegen eine andere streut auf 20 Startwerten um +-2 Partien - erst
// `--saetze 3` (60 Startwerte) trennte dort Wirkung von Zufall.
//
// Zwei Saetze, wenn die Aenderung jede Partie verschiebt (Bewegung, Kampf):
// in Runde 100 zeigte erst der zweite Satz, dass die Partien systematisch
// laenger wurden und dass fahrplan AC-11 auch mit HEAD nur 19 von 20 schafft
// (Rueckschau nach Runde 103).
//
// Warum es das gibt: in den Runden 89 bis 92 wurde jede Wirkung von Hand
// verglichen - mit `git stash`, mit Kopien des Ordners im Temp-Verzeichnis, mit
// Wegwerfskripten. Drei Abhilfen fuer die Beeren, eine groessere Ruecklage und
// zwei Hebel fuer fahrplan AC-11 zeigten so, dass sie nichts bringen. Das
// Werkzeug macht den Vergleich zu einem Befehl.
//
// Der eingecheckte Stand wird aus Git in einen eigenen Ordner geschrieben
// (nur server/spiele/strategie/) und dort geladen; der Arbeitsstand bleibt,
// wie er ist.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const WURZEL = fileURLToPath(new URL('../', import.meta.url));
const ORDNER = 'server/spiele/strategie';

const argumente = process.argv.slice(2);
const wert = (name, vorgabe) => {
  const i = argumente.indexOf(`--${name}`);
  return i >= 0 ? argumente[i + 1] : vorgabe;
};
const gegen = wert('gegen', 'HEAD');
const minuten = Number(wert('minuten', 22));
const partien = Number(wert('partien', 20));
const erster = Number(wert('startwert', 1));
const saetze = Number(wert('saetze', 1));
const probe = wert('probe', null);
const teamListe = wert('teams', null)?.split(',').map(Number) || null;
if (teamListe && !teamListe.every((t) => Number.isInteger(t) && t >= 1 && t <= 4)) {
  console.error('--teams braucht Zahlen von 1 bis 4, durch Kommas getrennt: --teams 1,1,2,2');
  process.exit(2);
}
const spieler = teamListe ? teamListe.length : Number(wert('spieler', 2));
const einstellungen = teamListe ? { teams: Object.fromEntries(teamListe.map((t, i) => [`ki${i + 1}`, t])) } : {};
const partie = (stand, startwert, m) => stand.pruefstand.partieSpielen({ startwert, minuten: m, spieler, einstellungen });
if (spieler !== 2 || teamListe) console.log(`${spieler} Spieler${teamListe ? `, Teams ${teamListe.join(',')}` : ''}`);

// Den Stand `gegen` in einen Temp-Ordner schreiben.
const git = (...a) => execFileSync('git', a, { cwd: WURZEL, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const ziel = mkdtempSync(join(tmpdir(), 'pruefstand-vergleich-'));
for (const datei of git('ls-tree', '-r', '--name-only', gegen, ORDNER).split('\n').filter(Boolean)) {
  const pfad = join(ziel, datei);
  mkdirSync(join(pfad, '..'), { recursive: true });
  writeFileSync(pfad, git('show', `${gegen}:${datei}`));
}

const laden = (wurzel) => createRequire(pathToFileURL(join(wurzel, 'x.mjs')).href)(`./${ORDNER}/pruefstand.js`);
const staende = [
  { name: gegen, pruefstand: laden(ziel) },
  { name: 'Arbeitsstand', pruefstand: laden(WURZEL) },
];
if (probe) {
  const ausArbeitsstand = createRequire(pathToFileURL(join(WURZEL, 'x.mjs')).href);
  const anwenden = createRequire(import.meta.url)(resolve(probe));
  anwenden((datei) => ausArbeitsstand(`./${ORDNER}/${datei}`));
  staende[1].name = 'mit Probe';
}

const median = (a) => {
  const z = a.filter((x) => x !== null && Number.isFinite(x)).sort((x, y) => x - y);
  return z.length ? z[Math.floor(z.length / 2)] : null;
};
const zahl = (x, stellen = 1) => (x === null ? '-' : x.toFixed(stellen));

// Aufwaermen, bevor gemessen wird (Rueckschau nach Runde 108): sonst bezahlt
// der erste Stand das Uebersetzen von V8, und die Rechenzeiten waren "nur
// innerhalb eines Standes vergleichbar". In Runde 104 machte die Sicht eine
// Partie um 55 % langsamer, und erst ein Wegwerfskript zeigte es.
for (const stand of staende) partie(stand, erster, Math.min(minuten, 5));

for (let satz = 0; satz < saetze; satz++) {
  const von = erster + satz * partien;
  if (saetze > 1) console.log(`== Startwerte ${von} bis ${von + partien - 1}`);
  const leer = () => ({ feudal: [], angriff: [], dorf: [], kampf: [], angriffe: [], untaetig: [], sieger: 0, ende: [], je: [], ms: 0, takte: 0, widerspruch: null });
  const werteJe = staende.map(leer);
  // Abwechselnd: jede Partie erst mit dem einen, dann mit dem anderen Stand,
  // und die Reihenfolge wechselt von Partie zu Partie. Erst alle des einen,
  // dann alle des anderen liess den zuerst gemessenen um 8 % langsamer
  // aussehen, bei gleicher Arbeit (Rueckschau nach Runde 108).
  for (let startwert = von; startwert < von + partien; startwert++) {
    const reihe = startwert % 2 ? [0, 1] : [1, 0];
    for (const k of reihe) {
      const werte = werteJe[k];
      if (werte.widerspruch) continue;
      try {
        const r = partie(staende[k], startwert, minuten);
        // Rechenzeit je Takt: Partien sind verschieden lang, die Summe allein
        // vergliche Laengen statt Kosten.
        werte.ms += r.dauerMs;
        werte.takte += r.gespielt;
        // `gewinner` seit spielziel AC-20 (Runde 150); ein aelterer Stand
        // kennt nur `sieger`.
        if (r.ende?.gewinner?.length || r.ende?.sieger) {
          werte.sieger += 1;
          werte.ende.push(r.ende.takt / 600);
          werte.je.push({ startwert, ende: r.ende.takt / 600 });
        }
        for (const p of r.spieler) {
          werte.feudal.push(p.feudalMinute);
          werte.angriff.push(p.angriffMinute);
          werte.dorf.push(p.dorfbewohner);
          werte.kampf.push(p.kampf);
          werte.angriffe.push(p.angriffe);
          werte.untaetig.push(p.untaetigMax);
        }
      } catch (fehler) {
        werte.widerspruch = fehler.message;
      }
    }
  }
  staende.forEach((stand, k) => {
    const werte = werteJe[k];
    // Nach dem Aufwaermen und abwechselnd gemessen vergleichbar: die
    // Rechenzeit je tausend Takte.
    const jeTausend = werte.takte ? (werte.ms / werte.takte) * 1000 : null;
    console.log(`${stand.name.padEnd(13)} ${partien} Partien, ${minuten} min, ${zahl(werte.ms / 1000)} s, ${zahl(jeTausend, 0)} ms je 1000 Takte`
      + (werte.widerspruch ? `
  WIDERSPRUCH: ${werte.widerspruch}` : '')
      + `
  Feudalzeit Median ${zahl(median(werte.feudal))} min, erstes Heer Median ${zahl(median(werte.angriff))} min`
      + `
  Dorfbewohner am Ende ${Math.min(...werte.dorf)} bis ${Math.max(...werte.dorf)}, Median ${median(werte.dorf)}`
      + `; Kampfeinheiten Median ${median(werte.kampf)}; Angriffe Median ${median(werte.angriffe)}`
      + `
  laengste Untaetigkeit ${zahl(Math.max(...werte.untaetig))} s`
      + `; mit Sieger ${werte.sieger}/${partien}${werte.ende.length ? `, Ende Median ${zahl(median(werte.ende))} min` : ''}`
      // fahrplan AC-11 fragt nach dieser Zahl: entschieden vor Spielminute 60.
      + `, vor Minute 60: ${werte.ende.filter((m) => m < 60).length}/${partien}`
      // Die Enden mit ihrem Startwert (Ende@Startwert), damit die langen gleich
      // mit pruefstand:verlauf angesehen werden koennen.
      + (werte.je.length ? `
  Enden ${[...werte.je].sort((a, b) => a.ende - b.ende).map((q) => `${q.ende.toFixed(1)}@${q.startwert}`).join(' ')}` : ''));
  });
}
rmSync(ziel, { recursive: true, force: true });
