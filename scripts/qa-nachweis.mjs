// Bildnachweis aus einem Playwright-Test (→ docs/adr/0011-bildnachweise.md).
//
//   import { nachweis } from '../../scripts/qa-nachweis.mjs';
//
//   test('karriere AC-1: die Vereinswahl zeigt alle Vereine', async ({ page }, info) => {
//     await page.goto('/manager.html');
//     await nachweis(page, {
//       spec: '15-manager/karriere.md',
//       ac: 'AC-1',
//       titel: 'Die Vereinswahl zeigt alle achtzehn Vereine',
//       test: info,
//     });
//   });
//
// Legt ab: qa/bildnachweise/<spec ohne .md>/AC-01--<titel>.png und daneben
// eine gleichnamige .json mit dem Bezug. Beides gehoert ins Repository - der
// Bericht (scripts/qa-report.mjs) liest genau diese beiden Dateien.
//
// DAS BILD WIRD NICHT BEI JEDEM LAUF NEU GESCHRIEBEN. Es entsteht, wenn es
// fehlt - ein neues Kriterium, ein geaenderter Titel -, und sonst nur auf
// Ansage (`npm run qa:nachweis`). Ein Nachweis belegt ein Kriterium, keinen
// Lauf. Neu geschrieben haette jeder Lauf Bilddiffs erzeugt, die aus nichts
// bestehen als einer anderen Millisekundenzahl in der Kopfzeile.
//
// Die Bezugsdatei entsteht immer: sie ist Text, und an ihr haengt die
// Pruefung der Herkunft.
//
// Die Zuordnung wird sofort geprueft: eine unbekannte Spec oder ein
// unbekanntes Kriterium laesst den TEST scheitern, nicht erst den Bericht.
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { BILDER, SPECS, WURZEL, pfadNetz } from './specs-lesen.mjs';

/**
 * Wird das Bild geschrieben? Die reine Regel, getrennt von der Platte, damit
 * sie sich ohne Browser pruefen laesst.
 */
export const sollBildSchreiben = (vorhanden, umgebung = process.env) => !vorhanden || umgebung.QA_NACHWEIS === '1';

/** Der Dateiname aus dem Titel - Umlaute umschrieben, hoechstens 60 Zeichen. */
export function kurzform(text) {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
    .replace(/-$/, '');
}

/**
 * Datei und Titelpfad des erzeugenden Tests. `titlePath` beginnt bei
 * Playwright mit dem Dateinamen; der steht schon in `datei`.
 */
export function herkunft(test) {
  if (!test?.file || !Array.isArray(test.titlePath)) {
    throw new Error('nachweis: "test" fehlt - ohne TestInfo hat der Nachweis keinen Erzeuger.');
  }
  return {
    datei: pfadNetz(relative(WURZEL, test.file)),
    pfad: test.titlePath.filter((stueck) => stueck && !stueck.endsWith('.mjs')),
  };
}

/**
 * @param {{ screenshot: Function }} ziel  Page oder Locator
 * @param {object} bezug
 * @param {string} bezug.spec    Pfad unter specs/, etwa "15-manager/karriere.md"
 * @param {string} bezug.ac      etwa "AC-1"
 * @param {string} bezug.titel   Was auf dem Bild zu sehen ist, in einem Satz.
 *   Steht als ganze Zeichenkette im Test - daran haengt die Herkunftspruefung.
 * @param {object} bezug.test    TestInfo von Playwright
 * @param {boolean} [bezug.ganzeSeite=false]  nur fuer Page: ueber das Fenster hinaus
 * @returns {Promise<string>} Pfad des Bildes - neu geschrieben oder vorgefunden
 */
export async function nachweis(ziel, { spec, ac, titel, test, ganzeSeite = false }) {
  if (!spec?.endsWith('.md')) throw new Error(`nachweis: "spec" muss ein Pfad unter specs/ sein, war: ${spec}`);
  if (!/^AC-\d+$/.test(ac ?? '')) throw new Error(`nachweis: "ac" muss wie "AC-7" aussehen, war: ${ac}`);
  if (!titel?.trim()) throw new Error('nachweis: "titel" fehlt - ohne Bildunterschrift ist ein Screenshot Ballast.');

  const specDatei = join(SPECS, spec);
  if (!existsSync(specDatei)) throw new Error(`nachweis: specs/${spec} gibt es nicht.`);
  if (!new RegExp(`\\*\\*${ac}\\*\\*`).test(await readFile(specDatei, 'utf8'))) {
    throw new Error(`nachweis: specs/${spec} nennt kein ${ac}.`);
  }

  const bezug = { spec, ac, titel: titel.trim(), ...herkunft(test) };
  const nummer = String(Number(ac.slice(3))).padStart(2, '0');
  const ordner = join(BILDER, spec.replace(/\.md$/, ''));
  const name = `AC-${nummer}--${kurzform(titel)}`;
  await mkdir(ordner, { recursive: true });

  const bild = join(ordner, `${name}.png`);
  if (sollBildSchreiben(existsSync(bild))) {
    const optionen = { path: bild, animations: 'disabled', caret: 'hide' };
    if (typeof ziel.goto === 'function') optionen.fullPage = ganzeSeite;
    await ziel.screenshot(optionen);
  }
  await writeFile(join(ordner, `${name}.json`), `${JSON.stringify(bezug, null, 2)}\n`, 'utf8');
  return bild;
}
