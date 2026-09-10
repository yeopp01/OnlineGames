// FORTSCHRITT: Codezeilen und Abnahmekriterien zu Stichtagen.
//
// Zwei Fragen, eine Zeitachse: Wie viel ist gebaut (Zeilen), und wie viel von
// dem, was wir kennen, ist abgenommen (Abnahmekriterien)? Beides kommt aus der
// Git-Historie, damit die Reihe nicht gepflegt werden muss und nicht luegen
// kann. Stichtag ist jeweils der letzte Commit des Zeitraums.
//
// Die Zeilen zaehlt `git log --numstat` mit (hinzugefuegt minus geloescht,
// kumuliert). Binaerdateien meldet Git dort als "-" und fallen heraus;
// Bildnachweise, Lockfile und das erzeugte Board zaehlen nicht mit.
//
// Ist der Arbeitsbaum nicht sauber, kommt ein letzter Punkt "jetzt" dazu -
// sonst zeigte der Bericht bei ungesicherter Arbeit einen Stand, der
// Stunden alt ist, und keiner merkte es.
//
// Der Takt ist der Tag. Unter zwei Tagen Historie waere ein Tag ein einziger
// Punkt und damit keine Reihe - dann sind es Stunden.
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { STATUS, WURZEL, specLesen, specsLesen } from './specs-lesen.mjs';

const lauf = promisify(execFile);
const git = async (...argumente) => (await lauf('git', argumente, { cwd: WURZEL, maxBuffer: 256 * 1024 * 1024 })).stdout;

/** Zeilenklassen in der Reihenfolge, in der sie gestapelt werden. */
export const KLASSEN = [
  { id: 'code', name: 'Code' },
  { id: 'tests', name: 'Tests' },
  { id: 'doku', name: 'Doku' },
  { id: 'werkzeug', name: 'Werkzeug' },
];

const AUSSEN = [
  /^qa\/bildnachweise\//,
  /^qa\/report\//,
  /(^|\/)package-lock\.json$/,
  /^specs\/BOARD\.md$/,
  /(^|\/)node_modules\//,
];
const BINAER = /\.(png|jpe?g|gif|ico|webp|sqlite|db|woff2?)$/i;

/** Einordnung einer Datei. Die Reihenfolge zaehlt: Doku vor Test vor Code. */
export function klasse(pfad) {
  if (AUSSEN.some((muster) => muster.test(pfad))) return null;
  if (/\.md$/.test(pfad)) return 'doku';
  if (/^(tests|e2e)\//.test(pfad) || /\.(test|spec)\.m?js$/.test(pfad)) return 'tests';
  if (/^(server|public)\//.test(pfad)) return 'code';
  return 'werkzeug';
}

/** Die Takte, je mit Eimerschluessel und Anzeige eines Stichtags. */
export const TAKTE = {
  stunde: {
    name: 'Stunde',
    eimer: (iso) => `${iso.slice(0, 13)}:00`,
    zeige: (s) => `${s.slice(8, 10)}.${s.slice(5, 7)}. ${s.slice(11)} Uhr`,
    kurz: (s) => s.slice(11),
  },
  tag: {
    name: 'Tag',
    eimer: (iso) => iso.slice(0, 10),
    zeige: (s) => `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}`,
    kurz: (s) => `${s.slice(8, 10)}.${s.slice(5, 7)}.`,
  },
};

function zeilenZaehlen(numstat, stand) {
  for (const zeile of numstat.split('\n')) {
    const treffer = zeile.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
    if (!treffer || treffer[1] === '-') continue;
    const art = klasse(treffer[3]);
    if (art) stand[art] += Number(treffer[1]) - Number(treffer[2]);
  }
}

const leereStatus = () => Object.fromEntries(STATUS.map((s) => [s, 0]));

async function kriterienZu(sha) {
  const pfade = (await git('ls-tree', '-r', '--name-only', sha, '--', 'specs'))
    .split('\n')
    .filter((p) => p.endsWith('.md') && !/(^|\/)(README|BOARD)\.md$/.test(p));
  const status = leereStatus();
  for (const pfad of pfade) {
    const { kriterien } = specLesen(await git('show', `${sha}:${pfad}`), pfad, { nachsichtig: true });
    for (const k of kriterien) if (k.status in status) status[k.status] += 1;
  }
  return { status, specs: pfade.length };
}

async function kriterienJetzt() {
  const specs = await specsLesen();
  const status = leereStatus();
  for (const spec of specs) for (const k of spec.kriterien) if (k.status in status) status[k.status] += 1;
  return { status, specs: specs.length };
}

function jetztIso() {
  const d = new Date();
  const zwei = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}T${zwei(d.getHours())}:${zwei(d.getMinutes())}`;
}

/**
 * @param {{ takt?: 'tag' | 'stunde' }} [optionen]
 * @returns {Promise<{ takt: string, taktName: string, punkte: object[] } | null>}
 */
export async function fortschritt({ takt } = {}) {
  const roh = await git('log', '--reverse', '--no-renames', '--numstat', '--format=@@%H|%cI');
  const staende = [];
  const zeilen = { code: 0, tests: 0, doku: 0, werkzeug: 0 };
  for (const block of roh.split('@@').filter((b) => b.trim())) {
    const [kopf, ...rest] = block.split('\n');
    const [sha, zeit] = kopf.split('|');
    zeilenZaehlen(rest.join('\n'), zeilen);
    staende.push({ sha, zeit, zeilen: { ...zeilen } });
  }
  if (!staende.length) return null;

  if ((await git('status', '--porcelain')).trim()) {
    const jetzt = { ...zeilen };
    zeilenZaehlen(await git('diff', 'HEAD', '--no-renames', '--numstat'), jetzt);
    for (const pfad of (await git('ls-files', '--others', '--exclude-standard')).split('\n').filter(Boolean)) {
      const art = klasse(pfad);
      if (!art || BINAER.test(pfad)) continue;
      const text = await readFile(join(WURZEL, pfad), 'utf8').catch(() => '');
      if (text) jetzt[art] += text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
    }
    staende.push({ sha: null, zeit: jetztIso(), zeilen: jetzt });
  }

  const tage = (Date.parse(staende.at(-1).zeit.slice(0, 10)) - Date.parse(staende[0].zeit.slice(0, 10))) / 86400000;
  const gewaehlt = TAKTE[takt] ? takt : tage < 2 ? 'stunde' : 'tag';
  const form = TAKTE[gewaehlt];

  // Je Eimer der letzte Commit; der Arbeitsbaum bleibt ein eigener Punkt.
  const eimer = new Map();
  for (const stand of staende.filter((s) => s.sha)) eimer.set(form.eimer(stand.zeit), stand);
  const auswahl = [...eimer.entries()].map(([schluessel, stand]) => ({ ...stand, schluessel }));
  const arbeitsbaum = staende.find((s) => !s.sha);
  if (arbeitsbaum) auswahl.push({ ...arbeitsbaum, schluessel: form.eimer(arbeitsbaum.zeit) });

  const punkte = [];
  for (const stand of auswahl) {
    const { status, specs } = stand.sha ? await kriterienZu(stand.sha) : await kriterienJetzt();
    const gesamt = Object.values(status).reduce((a, b) => a + b, 0);
    const zeilenGesamt = Object.values(stand.zeilen).reduce((a, b) => a + b, 0);
    punkte.push({
      schluessel: stand.schluessel,
      anzeige: stand.sha ? form.zeige(stand.schluessel) : `jetzt, ${form.zeige(TAKTE.tag.eimer(stand.zeit))}`,
      kurz: stand.sha ? form.kurz(stand.schluessel) : 'jetzt',
      sha: stand.sha ? stand.sha.slice(0, 7) : null,
      zeilen: { ...stand.zeilen, gesamt: zeilenGesamt },
      status,
      gesamt,
      specs,
      quote: gesamt ? Math.round((status.fertig / gesamt) * 100) : 0,
    });
  }
  punkte.forEach((punkt, i) => {
    punkt.zuwachs = punkt.zeilen.gesamt - (i ? punkte[i - 1].zeilen.gesamt : 0);
  });
  return { takt: gewaehlt, taktName: form.name, punkte };
}
