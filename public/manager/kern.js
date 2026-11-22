// @ts-check
// Der Kern der Oberflaeche des Managerspiels: der Zustand, die Anfragen an den
// Server, der Wechsel der Blaetter, Tasten, Dialog und Meldungen. Sie zeigt
// und fragt - gerechnet wird auf dem Server (→ docs/adr/0001-server-rechnet.md).
// Jede Antwort bringt den ganzen Zustand mit, deshalb haelt der Browser nichts
// nach, was der Server nicht bestaetigt hat.
//
// Die Blaetter stehen je in einem eigenen Modul und tragen sich beim Einstieg
// (start.js) in `BLAETTER` ein - so kennt der Kern keines von ihnen.

import { geld } from './teile.js';

/**
 * @param {string} id
 * @returns {HTMLElement}
 */
export const $ = (id) => document.getElementById(id);

export const inhalt = $('inhalt');

/**
 * Alle Elemente zu einer Auswahl als Liste - mit `dataset`, das `Element` nicht kennt.
 * @param {string} wahl
 * @param {ParentNode} [wurzel]
 * @returns {HTMLElement[]}
 */
export const alle = (wahl, wurzel = inhalt) => /** @type {HTMLElement[]} */ ([...wurzel.querySelectorAll(wahl)]);

/**
 * Der Wert des Feldes, an dem ein Ereignis hing.
 * @param {Event} e
 * @returns {string}
 */
export const wertVon = (e) => /** @type {HTMLInputElement} */ (e.target).value;

/**
 * Ein Eingabefeld der Seite.
 * @param {string} id
 * @returns {HTMLInputElement}
 */
export const feld = (id) => /** @type {HTMLInputElement} */ ($(id));

/** Was die Oberflaeche gerade hat - in einem Gegenstand, damit jedes Modul daran schreiben kann. */
export const lage = {
  kennung: null, // Kennung des offenen Spielstands
  stand: null, // letzter Zustand vom Server
  blatt: 'buero',
  elfLokal: null, // die Elf, an der gerade gearbeitet wird
  markt: null, // die Marktliste, nur bei Bedarf geholt
  laeuft: false, // waehrend eines Termins: keine zweite Anfrage
  tickerUhr: undefined, // die Uhr des laufenden Tickers
};

export const ansicht = {
  liga: null,
  markt: { position: '', liga: '', maxAlter: '', minStaerke: '', bezahlbar: false, sortierung: 'staerke', anzahl: 60 },
  // Vorschau auf das naechste Spiel oder Bericht vom letzten - nach "Weiter" der Bericht.
  spieltag: 'vorschau',
  // Welcher der letzten Entwicklungsberichte im Kaderblatt steht - 0 ist der neueste.
  entwicklung: 0,
};

/**
 * Die Blaetter, je Name eine Zeichenfunktion - eingetragen vom Einstieg.
 * @type {Record<string, () => void>}
 */
export const BLAETTER = {};

export const spielerVon = (id) => lage.stand.verein.spieler.find((s) => s.id === id);

/** Nach Rolle, wie der Server sie ordnet, und darin nach Staerke. */
export const nachPosition = (a, b) => lage.stand.rollen.indexOf(a.rolle) - lage.stand.rollen.indexOf(b.rolle) || b.staerke - a.staerke;

// Die beste Elf rechnet der Server - dieselbe, die er ohne Abgabe spielen liesse.
export const besteElf = () => [...lage.stand.verein.besteElf];

export function melden(nachricht, schlimm = false) {
  const kasten = $('meldung');
  kasten.textContent = nachricht;
  kasten.classList.toggle('schlimm', schlimm);
  kasten.hidden = false;
  clearTimeout(melden.uhr);
  melden.uhr = setTimeout(() => { kasten.hidden = true; }, schlimm ? 7000 : 4000);
}
/** @type {number | undefined} */
melden.uhr = undefined;

export function zeigen(welcher) {
  for (const teil of ['anmeldung', 'start', 'spiel']) $(teil).hidden = teil !== welcher;
}

/**
 * @param {string} pfad
 * @param {{ methode?: string, koerper?: any }} [wie]
 * @returns {Promise<any>}
 */
export async function anfragen(pfad, { methode = 'GET', koerper } = {}) {
  let antwort;
  try {
    antwort = await fetch(pfad, {
      method: methode,
      headers: koerper === undefined ? {} : { 'Content-Type': 'application/json' },
      body: koerper === undefined ? undefined : JSON.stringify(koerper),
    });
  } catch {
    melden('Der Server antwortet nicht.', true);
    return { fehler: 'Der Server antwortet nicht.' };
  }
  const daten = await antwort.json().catch(() => ({ fehler: 'Unverständliche Antwort.' }));
  if (antwort.status === 401) {
    zeigen('anmeldung');
    return daten;
  }
  if (daten.zustand) uebernehmen(daten.zustand);
  if (daten.fehler) melden(daten.fehler, true);
  return daten;
}

/**
 * Ein Zug im offenen Spielstand.
 * @param {string} was
 * @param {object} [koerper]
 */
export const zug = (was, koerper = {}) => anfragen(`/api/manager/spielstaende/${lage.kennung}/${was}`, { methode: 'POST', koerper });

export function uebernehmen(neu) {
  const vorher = lage.stand;
  lage.stand = neu;
  const stand = neu;
  if (!stand.verein) return;
  const merk = stand.verein.aufstellung;
  const anderer = !vorher || vorher.termin.index !== stand.termin.index || vorher.saison !== stand.saison
    || vorher.verein?.id !== stand.verein.id;
  if (anderer || !lage.elfLokal || lage.elfLokal.some((id) => !spielerVon(id))) {
    lage.elfLokal = merk ? [...merk.ids] : besteElf();
  }
}

/**
 * @param {string} html
 * @param {(huelle: HTMLElement) => void} [binden]
 */
export function dialog(html, binden) {
  const huelle = $('dialog');
  huelle.querySelector('.dialog-inhalt').innerHTML = html;
  huelle.hidden = false;
  if (binden) binden(huelle);
}

export function dialogZu() {
  $('dialog').hidden = true;
}

// ------------------------------------------------------------ Weiter

async function weiter() {
  if (lage.laeuft || !lage.stand || lage.stand.status !== 'laeuft') return;
  lage.laeuft = true;
  kopfZeichnen();
  $('lauf').textContent = 'rechnet ...';
  const begonnen = performance.now();
  const daten = await zug('weiter');
  lage.laeuft = false;
  $('lauf').textContent = daten.fehler ? '' : `${Math.round(performance.now() - begonnen)} ms`;
  lage.markt = null;
  if (daten.bericht) {
    if (['winterpause', 'saisonende'].includes(daten.bericht.art)) ansicht.entwicklung = 0;
    if (daten.bericht.art === 'saisonende') lage.blatt = 'buero';
    else if (daten.bericht.eigenes) {
      lage.blatt = 'spieltag';
      ansicht.spieltag = 'bericht';
    }
  }
  if (lage.stand.status === 'entlassen') {
    lage.blatt = 'buero';
    melden('Der Vorstand hat dich entlassen. Im Büro warten drei Angebote.', true);
  }
  zeichnen();
}

async function vorspulen(bis) {
  if (lage.laeuft || !lage.stand || lage.stand.status !== 'laeuft') return;
  lage.laeuft = true;
  kopfZeichnen();
  $('lauf').textContent = 'rechnet ...';
  const begonnen = performance.now();
  const daten = await zug('vorspulen', { bis });
  lage.laeuft = false;
  $('lauf').textContent = daten.fehler ? '' : `${daten.gerechnet} Termine in ${Math.round(performance.now() - begonnen)} ms`;
  lage.markt = null;
  lage.blatt = 'buero';
  if (lage.stand.status === 'entlassen') melden('Der Vorstand hat dich entlassen. Im Büro warten drei Angebote.', true);
  zeichnen();
}

$('weiter').addEventListener('click', weiter);
$('vorWinter').addEventListener('click', () => vorspulen('winterpause'));
$('vorEnde').addEventListener('click', () => vorspulen('saisonende'));

// -------------------------------------------------------------- Rahmen

/** @param {string} id */
const knopfVon = (id) => /** @type {HTMLButtonElement} */ ($(id));

export function kopfZeichnen() {
  const { stand } = lage;
  const v = stand.verein;
  const n = stand.naechster;
  $('vereinName').textContent = v.name;
  let gegner = '';
  if (n.spiel && n.spiel.gegner) gegner = `: ${n.spiel.daheim ? 'daheim gegen' : 'auswärts bei'} ${n.spiel.gegner}`;
  else if (n.spiel && n.spiel.frei) gegner = ': ohne dich';
  $('kopfLage').textContent = `${v.liga}. Liga · Saison ${stand.saison} · als Nächstes ${n.titel}${gegner}`;
  const zeile = stand.tabellen[v.liga].find((z) => z.eigenes);
  $('kopfPlatz').textContent = zeile && zeile.spiele ? zeile.platz : '–';
  $('kopfKonto').textContent = geld(v.konto);
  $('kopfKonto').className = v.konto < 0 ? 'schlecht' : '';
  const vertrauen = Math.round(stand.vorstand.vertrauen);
  $('kopfVertrauen').textContent = String(vertrauen);
  $('kopfVertrauen').className = vertrauen < 30 ? 'schlecht' : '';

  const knopf = knopfVon('weiter');
  if (stand.status === 'entlassen') {
    knopf.textContent = 'Entlassen';
    knopf.disabled = true;
  } else {
    knopf.textContent = n.art === 'saisonende' ? 'Saison abschließen' : n.art === 'vorbereitung' ? `Saison ${stand.saison} starten` : `Weiter: ${n.titel}`;
    knopf.disabled = lage.laeuft;
  }
  const winter = stand.kalender.findIndex((t) => t.art === 'winterpause');
  knopfVon('vorWinter').disabled = lage.laeuft || stand.status !== 'laeuft' || stand.termin.index >= winter;
  knopfVon('vorEnde').disabled = lage.laeuft || stand.status !== 'laeuft' || n.art === 'saisonende';

  alle('#reiter .reiterKnopf', document).forEach((k) => {
    k.setAttribute('aria-pressed', String(k.dataset.blatt === lage.blatt));
  });
  const transfer = document.querySelector('#reiter [data-blatt="transfer"]');
  transfer.innerHTML = `Transfer${stand.angebote.length ? `<span class="zaehler">${stand.angebote.length}</span>` : ''}`;
}

export function zeichnen() {
  if (!lage.stand || !lage.stand.verein) return;
  clearInterval(lage.tickerUhr);
  kopfZeichnen();
  BLAETTER[lage.blatt]();
  // Verweise zwischen den Blaettern, gleich auf welchem Blatt sie stehen.
  alle('[data-gehe]').forEach((knopf) => knopf.addEventListener('click', () => {
    lage.blatt = knopf.dataset.gehe;
    if (knopf.dataset.spieltag) ansicht.spieltag = knopf.dataset.spieltag;
    const anker = knopf.dataset.anker;
    zeichnen();
    if (anker) $(anker)?.scrollIntoView({ block: 'start' });
  }));
}

$('reiter').addEventListener('click', (e) => {
  const knopf = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('.reiterKnopf'));
  if (!knopf) return;
  lage.blatt = knopf.dataset.blatt;
  if (lage.blatt === 'liga') ansicht.liga = null;
  zeichnen();
});

$('tempo').addEventListener('change', () => {
  if (lage.blatt === 'spieltag') zeichnen();
});

$('dialogZu').addEventListener('click', dialogZu);
$('dialog').addEventListener('click', (e) => {
  if (e.target === $('dialog')) dialogZu();
});

// Tastatur: die Leertaste rechnet den naechsten Termin, Escape schliesst.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') return dialogZu();
  // Das Ziel eines Tastendrucks ist nicht immer ein Element - liegt der Fokus
  // nirgends, ist es das Dokument selbst, und das kennt kein `matches()`.
  const ziel = e.target instanceof Element ? e.target : null;
  if ($('spiel').hidden || !$('dialog').hidden || ziel?.matches('input, select, textarea')) return;
  if (e.code === 'Space') {
    e.preventDefault();
    weiter();
  }
});
