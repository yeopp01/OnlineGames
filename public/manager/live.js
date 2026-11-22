// @ts-check
// Das eigene Spiel live (oberflaeche AC-19 bis AC-21): Anzeigetafel,
// Verlaufsband, Ticker, Eingreifen und die Kabine zur Halbzeit - nach dem
// Spieltag-Entwurf (docs/manager/entwurf/spieltag.html).
//
// Der Browser rechnet nichts. Er bittet den Server um den naechsten
// Abschnitt (fuenf Minuten, Zug `spiel` mit `bis`) und zeigt ihn Minute fuer
// Minute; was der Server noch nicht gerechnet hat, kennt er nicht
// (karriere AC-32). Ein Eingriff geht sofort hinaus und wirkt ab der Minute
// nach der, bis zu der gerechnet ist - das steht so im Bild.
import {
  $, alle, ansicht, inhalt, lage, zeichnen, zug,
} from './kern.js';
import { text } from './teile.js';

/** Millisekunden je Spielminute: Normal rund 90 Sekunden je Spiel, Schnell rund 25. */
const TEMPO = { normal: 1000, schnell: 280 };
const TEMPI = [['pause', 'Pause'], ['normal', 'Normal'], ['schnell', 'Schnell'], ['sofort', 'Sofort']];
const ABSCHNITT = 5;

const ARTNAME = {
  konter: 'Konter',
  flanke: 'Flanke',
  steilpass: 'Steilpass',
  fernschuss: 'Fernschuss',
  ecke: 'Ecke',
  freistoss: 'Freistoß',
  elfmeter: 'Elfmeter',
  einzelaktion: 'Einzelaktion',
  abstauber: 'Abstauber',
};

// Was die Ansprachen tun, so wie der Server sie rechnet (spieltag AC-30,
// `ansprechen()`): laut weckt bei Rueckstand und kostet bei Fuehrung,
// aufbauen hilft nur, wer an sich zweifelt, ruhig festigt eine Fuehrung.
const ANSPRACHEN = [
  ['ruhig', 'Ruhig bleiben', 'Festigt eine Führung. Sonst ändert es nichts.'],
  ['aufbauen', 'Aufbauen', 'Hilft, wer an sich zweifelt. Wer schon an sich glaubt, merkt nichts.'],
  ['laut', 'Laut werden', 'Weckt bei Rückstand. Bei Führung kostet es Moral.'],
];

const live = {
  /** @type {any} der letzte Stand des Spiels vom Server */
  daten: null,
  /** @type {any} der Bericht, sobald abgepfiffen ist */
  bericht: null,
  tempo: 'normal',
  gezeigt: 0,
  holt: false,
  kabineVorbei: false,
  /** @type {string|null} wer raus soll */
  raus: null,
  /** @type {{was: string, ab: number}[]} */
  aenderungen: [],
  grund: '',
  /** @type {{heim: string, gast: string}|null} die Zeile unter den Vereinsnamen, beim Anpfiff gemerkt */
  zeilen: null,
  /** @type {number|undefined} */
  uhr: undefined,
};

const ende = (d) => (d.verlaengerung ? 120 : 90);
const seiteVon = (d, vereinId) => (vereinId === d.heim.id ? 'heim' : 'gast');
const amEnde = () => live.daten && live.daten.vorbei && live.gezeigt >= ende(live.daten);
const inDerKabine = () => {
  const d = live.daten;
  return d && !d.vorbei && !d.verlaengerung && d.minute === d.halbzeit && live.gezeigt >= d.halbzeit && !live.kabineVorbei;
};

// ------------------------------------------------------------ Ablauf

/** Den Termin rechnen und das eigene Spiel am Anpfiff anhalten. */
async function anpfeifen() {
  if (lage.laeuft || !lage.stand || lage.stand.laufend) return;
  lage.laeuft = true;
  const antwort = await zug('anpfeifen');
  lage.laeuft = false;
  if (antwort.fehler || !antwort.laufend) {
    zeichnen();
    return;
  }
  neu(antwort.laufend);
  zeichnen();
}

/** Ein neues Spiel - oder dasselbe nach dem Neuladen der Seite. */
function neu(daten) {
  Object.assign(live, {
    daten, bericht: null, tempo: 'normal', gezeigt: daten.minute, holt: false, kabineVorbei: false, raus: null, aenderungen: [], grund: '',
  });
  live.zeilen = zeilenMerken(daten);
}

// Die Lage beider Vereine aus der Vorschau - sie zeigt bis zum Abpfiff genau
// dieses Spiel, danach schon das naechste; deshalb einmal beim Anpfiff gemerkt.
function zeilenMerken(d) {
  const v = lage.stand.vorschau;
  if (!v) return null;
  const zeile = (s) => `${s.platz ? `${s.platz}. der ${s.liga}. Liga` : `${s.liga}. Liga`}, ${s.system}`;
  const eigen = zeile(v.eigen);
  const fremd = zeile(v.gegner);
  return d.seite === 'heim' ? { heim: eigen, gast: fremd } : { heim: fremd, gast: eigen };
}

function uhrStellen() {
  clearInterval(live.uhr);
  live.uhr = undefined;
  const ms = TEMPO[live.tempo];
  if (ms) live.uhr = setInterval(schritt, ms);
}

/** Eine Minute weiter - oder den naechsten Abschnitt holen, wenn die gezeigte die gerechnete erreicht. */
async function schritt() {
  const d = live.daten;
  if (!d || live.holt || !$('liveTafel')) {
    if (!$('liveTafel')) clearInterval(live.uhr);
    return;
  }
  if (live.gezeigt < d.minute) {
    live.gezeigt += 1;
    // Zur Pause haelt das Spiel von selbst an (AC-21).
    if (inDerKabine()) clearInterval(live.uhr);
    laufendMalen();
    return;
  }
  if (d.vorbei) {
    clearInterval(live.uhr);
    laufendMalen();
    return;
  }
  if (inDerKabine()) {
    clearInterval(live.uhr);
    return;
  }
  await holen({ bis: d.minute + ABSCHNITT });
}

/**
 * Ein Zug `spiel` - mit `bis` rechnet er weiter, ohne nur den Eingriff.
 * @param {object} koerper
 * @returns {Promise<boolean>} ob der Server angenommen hat
 */
async function holen(koerper) {
  live.holt = true;
  const antwort = await zug('spiel', koerper);
  live.holt = false;
  if (antwort.fehler) {
    live.grund = antwort.fehler;
    randMalen();
    return false;
  }
  live.grund = '';
  if (antwort.laufend) live.daten = antwort.laufend;
  if (antwort.bericht) {
    // Abgepfiffen: der Termin ist geschlossen, der Zustand hat kein laufendes
    // Spiel mehr. Gezeigt wird trotzdem zu Ende, was noch fehlt.
    live.bericht = antwort.bericht;
    lage.nachspiel = true;
  }
  laufendMalen();
  randMalen();
  return true;
}

async function tempoWaehlen(tempo) {
  if (!live.daten) return;
  if (tempo === 'sofort') {
    clearInterval(live.uhr);
    live.tempo = 'sofort';
    if (!live.daten.vorbei) await holen({ bis: 999 });
    live.gezeigt = ende(live.daten);
    live.kabineVorbei = true;
    laufendMalen();
    return;
  }
  // Pause in der Kabine laesst sie stehen; jedes andere Tempo pfeift an.
  if (inDerKabine() && tempo !== 'pause') live.kabineVorbei = true;
  live.tempo = tempo;
  uhrStellen();
  laufendMalen();
}

function zumBericht() {
  clearInterval(live.uhr);
  live.daten = null;
  lage.nachspiel = false;
  lage.blatt = 'spieltag';
  ansicht.spieltag = 'bericht';
  zeichnen();
}

// ------------------------------------------------------------ Bild

/**
 * Heim und Gast in ihren Trikots (bedienung AC-22). Die Farben rechnet der
 * Server, auch, ob der Gast im Ausweichtrikot spielt. Ohne Trikot (ein Stand
 * von vorher) bleibt die Vorgabe aus manager.css.
 * @param {any} d  das laufende Spiel
 */
function trikotStil(d) {
  const hex = (wert) => (/^#[0-9a-f]{6}$/i.test(wert || '') ? wert : null);
  return [['heim', d.heim.trikot], ['gast', d.gast.trikot]]
    .filter(([, t]) => t && hex(t.grund) && hex(t.akzent) && hex(t.schrift))
    .map(([seite, t]) => `--${seite}-1:${t.grund};--${seite}-2:${t.akzent};--${seite}-schrift:${t.schrift}`)
    .join(';');
}

export function blattLive() {
  const stand = lage.stand;
  if (stand.laufend && (!live.daten || live.bericht)) neu(stand.laufend);
  const d = live.daten;
  if (!d) return;
  inhalt.innerHTML = `<div class="live eigen-${d.seite}" style="${trikotStil(d)}"${d.gast.trikot?.ausweich ? ' data-ausweich="gast"' : ''}>
    <header class="tafel" id="liveTafel"></header>
    <section class="spielverlauf" aria-label="Spielverlauf in Abschnitten von fünf Minuten">
      <small>${text(d.heim.name)} drückt</small>
      <div class="bandrahmen" id="liveBand"></div>
      <small>${text(d.gast.name)} drückt</small>
    </section>
    <div class="livespiel">
      <section class="liveticker" aria-live="polite">
        <div id="liveOben"></div>
        <ol class="zeilen" id="liveZeilen"></ol>
      </section>
      <aside class="rand" id="liveRand"></aside>
    </div>
    <footer class="livefuss">
      <div class="tempowahl" role="group" aria-label="Tempo" id="liveTempo">${TEMPI
    .map(([wert, name]) => `<button type="button" data-tempo="${wert}" aria-pressed="false">${name}</button>`).join('')}</div>
      <span id="liveLage"></span>
    </footer>
  </div>`;
  $('liveTempo').addEventListener('click', (e) => {
    const knopf = /** @type {HTMLElement|null} */ (/** @type {Element} */ (e.target).closest('[data-tempo]'));
    if (knopf) tempoWaehlen(knopf.dataset.tempo);
  });
  laufendMalen();
  randMalen();
  if (!amEnde() && !inDerKabine()) uhrStellen();
}

/** Alles, was sich mit der gezeigten Minute aendert: Tafel, Band, Ticker, Tempo. */
function laufendMalen() {
  const d = live.daten;
  if (!d || !$('liveTafel')) return;
  const bis = Math.min(live.gezeigt, ende(d));
  const zeilen = tickerZeilen(d, amEnde() ? Infinity : bis);
  const tore = [0, 0];
  for (const e of d.ereignisse) if (e.art === 'tor' && e.minute <= bis) tore[seiteVon(d, e.verein) === 'heim' ? 0 : 1] += 1;
  const elfer = amEnde() && d.elfmeter;

  let uhr = `<b>${bis}.</b> Minute`;
  if (bis === 0) uhr = 'Vor dem Anpfiff';
  if (inDerKabine()) uhr = '<b>Halbzeit</b>';
  if (d.verlaengerung && bis > 90) uhr = `Verlängerung, <b>${bis}.</b> Minute`;
  if (amEnde()) uhr = elfer ? `<b>Abpfiff</b>, ${d.elfmeter[0]}:${d.elfmeter[1]} im Elfmeterschießen` : '<b>Abpfiff</b>';
  const lageZeile = (seite) => (live.zeilen ? `<div class="lage">${text(live.zeilen[seite])}</div>` : '');
  $('liveTafel').innerHTML = `
    <div class="seite heim"><div class="verein">${text(d.heim.name)}</div>${lageZeile('heim')}</div>
    <div class="stand" aria-label="Spielstand ${tore[0]} zu ${tore[1]}">
      <div class="platte" id="liveTorHeim">${tore[0]}</div><div class="doppelpunkt">:</div><div class="platte" id="liveTorGast">${tore[1]}</div>
      <div class="uhr" id="liveUhr">${uhr}</div>
    </div>
    <div class="seite gast"><div class="verein">${text(d.gast.name)}</div>${lageZeile('gast')}</div>`;

  bandMalen(d, bis);

  const oben = $('liveOben');
  // Die juengste Szene steht gross oben - und dann nicht noch einmal in der Liste.
  const grossOben = !inDerKabine() && !amEnde() && zeilen.length > 0 && !zeilen[0].marke;
  if (inDerKabine()) oben.innerHTML = kabine(d, tore);
  else if (amEnde()) {
    oben.innerHTML = `<div class="abpfiff">
      <h2>Abpfiff. ${text(d.heim.name)} ${tore[0]}:${tore[1]} ${text(d.gast.name)}${elfer ? `, ${d.elfmeter[0]}:${d.elfmeter[1]} im Elfmeterschießen` : d.verlaengerung ? ' nach Verlängerung' : ''}</h2>
      <button class="haupt" id="liveBericht">Zum Spielbericht</button>
    </div>`;
  } else if (grossOben) oben.innerHTML = laufendeSzene(zeilen[0]);
  else oben.innerHTML = '';
  $('liveZeilen').innerHTML = (grossOben ? zeilen.slice(1) : zeilen).map(zeileMalen).join('');
  $('liveBericht')?.addEventListener('click', zumBericht);
  alle('[data-ansprache]').forEach((k) => k.addEventListener('click', async () => {
    if (await holen({ ansprache: k.dataset.ansprache })) laufendMalen();
  }));
  $('liveZweite')?.addEventListener('click', () => tempoWaehlen(live.tempo === 'schnell' ? 'schnell' : 'normal'));

  // Die Knoepfe bleiben dieselben, nur ihr Zustand wechselt - ein Klick soll
  // nicht auf einen Knopf fallen, den die Minute eben ersetzt hat.
  const steht = live.tempo === 'pause' || inDerKabine() || amEnde();
  alle('[data-tempo]', $('liveTempo')).forEach((k) => {
    const wert = k.dataset.tempo;
    k.setAttribute('aria-pressed', String(wert === 'pause' ? steht : !steht && live.tempo === wert));
    /** @type {HTMLButtonElement} */ (k).disabled = amEnde();
  });
  $('liveLage').textContent = amEnde() ? 'Das Spiel ist aus.' : inDerKabine() ? 'Halbzeit - das Spiel steht, bis du anpfeifst.'
    : steht ? 'Das Spiel steht. Eingreifen geht auch jetzt.' : `Gerechnet bis Minute ${d.minute}.`;
}

/** Ein Abschnitt je fuenf Minuten; Ausschlag nach oben, wer drueckt. Tore mit Minute und Schuetze. */
function bandMalen(d, bis) {
  const anzahl = d.verlaengerung ? 24 : 18;
  const gezeigt = Math.min(d.anteile.length, Math.floor(bis / ABSCHNITT));
  const zelleVon = (minute) => Math.max(0, Math.min(anzahl - 1, Math.floor((minute - 1) / ABSCHNITT)));
  /** @type {Record<string, number[]>} */
  const chancen = { heim: [], gast: [] };
  /** @type {Record<string, number[]>} */
  const treffer = { heim: [], gast: [] };
  for (const s of d.szenen) if (s.minute <= bis && chancen[s.seite]) chancen[s.seite][zelleVon(s.minute)] = (chancen[s.seite][zelleVon(s.minute)] || 0) + 1;
  for (const e of d.ereignisse) {
    if (e.art !== 'tor' || e.minute > bis) continue;
    const seite = seiteVon(d, e.verein);
    treffer[seite][zelleVon(e.minute)] = (treffer[seite][zelleVon(e.minute)] || 0) + 1;
  }
  const zellen = [];
  for (let i = 0; i < anzahl; i++) {
    const klassen = ['abschnitt'];
    if (i === 8 || i === 17) klassen.push('pause');
    if (i >= gezeigt) klassen.push('offen');
    if (i === gezeigt - 1 && !amEnde()) klassen.push('jetzt');
    let innen = '';
    if (i < gezeigt) {
      // Wer drueckt, zeigt sich in den Chancen: je Chance im Abschnitt ein
      // halber Ausschlag, ein Tor noch einen halben dazu. Der Spielanteil ist
      // nur die Grundlinie - er folgt aus dem Mittelfeld und bewegt sich im
      // Spiel kaum (gemessen ueber 1968 Abschnitte: im Median 4 Punkte von der
      // Mitte, nie mehr als 16).
      const druck = (seite) => 0.5 * (chancen[seite][i] || 0) + 0.5 * (treffer[seite][i] || 0);
      const wert = Math.max(-1, Math.min(1, (d.anteile[i] - 50) / 16 + druck('heim') - druck('gast')));
      const hoehe = Math.max(4, Math.round(Math.abs(wert) * 50));
      innen = `<i class="${wert >= 0 ? 'heim' : 'gast'}" style="height:${hoehe}%"></i>`;
    }
    zellen.push(`<div class="${klassen.join(' ')}" data-abschnitt="${i}">${innen}</div>`);
  }
  const torzeile = (seite) => {
    const jeZelle = new Map();
    for (const e of d.ereignisse) {
      if (e.art !== 'tor' || e.minute > bis || seiteVon(d, e.verein) !== seite) continue;
      const zelle = Math.min(anzahl - 1, Math.floor((e.minute - 1) / ABSCHNITT));
      jeZelle.set(zelle, [...(jeZelle.get(zelle) || []), `${e.minute}. ${text(e.spieler)}`]);
    }
    return `<div class="torzeile ${seite}" style="grid-template-columns: repeat(${anzahl}, 1fr)">${[...jeZelle]
      .map(([zelle, namen]) => `<span class="torname" style="grid-column:${zelle + 1}">${namen.join('<br>')}</span>`).join('')}</div>`;
  };
  $('liveBand').innerHTML = `${torzeile('heim')}
    <div class="band" style="grid-template-columns: repeat(${anzahl}, 1fr)">${zellen.join('')}</div>
    ${torzeile('gast')}`;
  // Ein Punkt je Tor im Abschnitt, oben fuer Heim, unten fuer Gast.
  for (const e of d.ereignisse) {
    if (e.art !== 'tor' || e.minute > bis) continue;
    const zelle = /** @type {HTMLElement|null} */ ($('liveBand').querySelector(`[data-abschnitt="${Math.min(anzahl - 1, Math.floor((e.minute - 1) / ABSCHNITT))}"]`));
    zelle?.insertAdjacentHTML('beforeend', `<span class="tor ${seiteVon(d, e.verein)}"></span>`);
  }
}

/**
 * Die Zeilen des Tickers, die juengste zuerst: Szenen mit ihrem Satz vom
 * Server, dazu Tore, Karten, Wechsel und Verletzungen aus den Ereignissen.
 */
function tickerZeilen(d, bis) {
  /** @type {any[]} */
  const zeilen = [{ minute: 0, art: 'Anpfiff', satz: `${d.heim.name} gegen ${d.gast.name}.`, reihe: 0 }];
  const tore = [0, 0];
  const verein = (id) => (id === d.heim.id ? d.heim.name : d.gast.name);
  const torszenen = d.szenen.filter((s) => s.ausgang === 'tor');
  const folge = [
    ...d.szenen.filter((s) => s.ausgang !== 'tor').map((s) => ({ minute: s.minute, szene: s })),
    ...d.ereignisse.map((e) => ({ minute: e.minute, ereignis: e })),
  ].filter((x) => x.minute <= bis).sort((a, b) => a.minute - b.minute);
  let reihe = 1;
  let pause = false;
  let nachNeunzig = false;
  let elfer = false;
  const marken = (minute) => {
    if (!pause && minute > d.halbzeit) {
      zeilen.push({ minute: d.halbzeit, marke: 'Halbzeit', satz: `${d.heim.name} ${tore[0]}, ${d.gast.name} ${tore[1]}.`, reihe: reihe++ });
      pause = true;
    }
    if (d.verlaengerung && !nachNeunzig && minute > 90) {
      zeilen.push({ minute: 90, marke: 'Nach 90 Minuten', satz: `${tore[0]}:${tore[1]} - es geht in die Verlängerung.`, reihe: reihe++ });
      nachNeunzig = true;
    }
  };
  for (const x of folge) {
    marken(x.minute);
    const s = x.szene;
    if (s) {
      zeilen.push({ minute: s.minute, art: ARTNAME[s.art] || s.art, satz: s.satz, seite: s.seite, reihe: reihe++ });
      continue;
    }
    const e = x.ereignis;
    const seite = seiteVon(d, e.verein);
    if (e.minute > 120) {
      if (!elfer) zeilen.push({ minute: 120, marke: 'Elfmeterschießen', satz: '', reihe: reihe++ });
      elfer = true;
      zeilen.push({
        minute: 121, art: 'Elfmeter', seite, reihe: reihe++, satz: `${e.spieler} (${verein(e.verein)}) ${e.art === 'elfmeter' ? 'trifft' : 'vergibt'}.`,
      });
      continue;
    }
    if (e.art === 'tor') {
      tore[seite === 'heim' ? 0 : 1] += 1;
      const szene = torszenen.find((t) => t.minute === e.minute && t.seite === seite);
      zeilen.push({
        minute: e.minute,
        art: szene ? ARTNAME[szene.art] || szene.art : 'Tor',
        tor: `${tore[0]}:${tore[1]} durch ${e.spieler}${e.vorlage ? `, Vorlage ${e.vorlage}` : ''}`,
        satz: szene ? szene.satz : '',
        seite,
        reihe: reihe++,
      });
    } else if (e.art === 'gelb' || e.art === 'gelbrot' || e.art === 'rot') {
      const name = { gelb: 'Gelb', gelbrot: 'Gelb-Rot', rot: 'Rot' }[e.art];
      zeilen.push({ minute: e.minute, art: 'Karte', karte: e.art, satz: `${name} für ${e.spieler} (${verein(e.verein)}).`, seite, reihe: reihe++ });
    } else if (e.art === 'wechsel') {
      zeilen.push({
        minute: e.minute, art: 'Wechsel', seite, reihe: reihe++,
        satz: `${verein(e.verein)} bringt ${e.rein} für ${e.spieler}${e.grund === 'verletzung' ? ', der verletzt raus muss' : ''}.`,
      });
    } else if (e.art === 'verletzung') {
      zeilen.push({
        minute: e.minute, art: 'Verletzung', seite, reihe: reihe++,
        satz: `${e.spieler} (${verein(e.verein)}) verletzt sich, ${e.dauer === 1 ? 'eine Woche' : `${e.dauer} Wochen`} Pause.`,
      });
    }
  }
  if (bis >= d.halbzeit) marken(d.halbzeit + 1);
  return zeilen.sort((a, b) => b.reihe - a.reihe);
}

function zeileMalen(z) {
  const minute = z.minute > 120 ? '' : `${z.minute}.`;
  if (z.marke) {
    return `<li class="ruhezeile"><span class="minute">${minute}</span><span class="art">${text(z.marke)}</span><p>${text(z.satz)}</p></li>`;
  }
  const karte = z.karte ? `<i class="kartenzeichen ${z.karte === 'gelb' ? 'gelb' : 'rot'}"></i> ` : '';
  const satz = z.tor ? `${text(z.tor)}${z.satz ? `<span>${text(z.satz)}</span>` : ''}` : `${karte}${text(z.satz)}`;
  return `<li class="${z.tor ? `tor ${z.seite}` : ''}"><span class="minute">${minute}</span><span class="art">${text(z.art)}</span><p>${satz}</p></li>`;
}

function laufendeSzene(z) {
  return `<div class="laufend ${z.seite || ''}">
    <div class="minute">${z.minute}.</div>
    <div><div class="art">${text(z.art)}</div><p>${z.tor ? `${text(z.tor)}. ` : ''}${text(z.satz)}</p></div>
  </div>`;
}

function kabine(d, tore) {
  const eigen = d.seite === 'heim' ? 0 : 1;
  const [wir, sie] = [tore[eigen], tore[1 - eigen]];
  const lage = wir > sie ? `Ihr führt ${wir}:${sie}.` : wir < sie ? `Ihr liegt ${wir}:${sie} zurück.` : `Es steht ${wir}:${sie}.`;
  const haelfte = d.anteile.slice(0, d.halbzeit / ABSCHNITT);
  const anteil = haelfte.length ? Math.round(haelfte.reduce((a, b) => a + b, 0) / haelfte.length) : 50;
  const karten = [0, 0];
  for (const e of d.ereignisse) {
    if (['gelb', 'gelbrot', 'rot'].includes(e.art) && e.minute <= d.halbzeit) karten[seiteVon(d, e.verein) === 'heim' ? 0 : 1] += 1;
  }
  const gesagt = d.eigene.ansprache;
  const knoepfe = ANSPRACHEN.map(([art, name, was]) => `<button type="button" data-ansprache="${art}" ${gesagt ? 'disabled' : ''}
      aria-pressed="${gesagt === art}"><strong>${name}</strong><span>${was}</span></button>`).join('');
  return `<div class="kabine" id="liveKabine">
    <h2>Halbzeit. Was sagst du in der Kabine?</h2>
    <p>${lage} ${gesagt ? `Gesagt ist gesagt: ${text(ANSPRACHEN.find(([a]) => a === gesagt)[1])}.` : 'Eine Ansprache, oder keine. Rechts kannst du wechseln und umstellen.'}</p>
    <div class="ansprachen">${knoepfe}</div>
    <div class="kabinefuss">
      <dl class="haelfte" aria-label="Die erste Hälfte">
        <dd class="h">${d.chancen[0]}</dd><dt>Chancen</dt><dd class="g">${d.chancen[1]}</dd>
        <dd class="h">${anteil} %</dd><dt>Spielanteil</dt><dd class="g">${100 - anteil} %</dd>
        <dd class="h">${karten[0]}</dd><dt>Karten</dt><dd class="g">${karten[1]}</dd>
      </dl>
      <button class="haupt" id="liveZweite">Zweite Hälfte anpfeifen</button>
    </div>
  </div>`;
}

// ------------------------------------------------------------ Eingreifen

/** Die rechte Spalte - nur neu, wenn sich am Spiel etwas aendert, damit kein Knopf unter der Maus verschwindet. */
function randMalen() {
  const d = live.daten;
  const rand = $('liveRand');
  if (!d || !rand) return;
  const e = d.eigene;
  const zu = d.vorbei;
  const ab = d.minute + 1;
  const abText = `${zu ? 'Das Spiel ist aus.' : `Was du jetzt änderst, <b>wirkt ab Minute ${ab}</b>.`} ${e.wechsel} von ${e.wechselMax} Wechseln gemacht.`;
  // Hat sich nur die Minute bewegt, bleibt die Spalte stehen - sonst verschwaende
  // der Knopf, den man gerade druecken will, alle fuenf Sekunden unter der Maus.
  // Frische und Staerke sinken jeden Abschnitt - sie gehen nicht ins Merkmal,
  // sondern werden an Ort und Stelle nachgezogen.
  const wer = (liste) => liste.map((s) => [s.id, s.platz || s.position, s.gelb || false]);
  const merkmal = JSON.stringify([wer(e.auf), wer(e.bank), e.wechsel, e.taktik, e.ansprache, live.raus, live.grund, live.aenderungen.length, zu]);
  if (merkmal === randMalen.zuletzt && $('liveAb')) {
    $('liveAb').innerHTML = abText;
    for (const s of [...e.auf, ...e.bank]) {
      const zeile = rand.querySelector(`tr[data-spieler="${s.id}"]`);
      if (!zeile) continue;
      /** @type {HTMLElement} */ (zeile.querySelector('.frischebalken i')).style.width = `${s.frische}%`;
      /** @type {HTMLElement} */ (zeile.querySelector('.frischebalken')).title = `Frische ${s.frische}`;
      zeile.querySelector('td.zahl').textContent = String(s.staerke);
      zeile.classList.toggle('muede', s.frische < 60);
    }
    return;
  }
  randMalen.zuletzt = merkmal;
  const stufen = (feld, namen) => `<div class="stufen" role="group" aria-label="${feld}">${namen.map((name, i) => `<button type="button"
      data-regler="${feld}" data-wert="${i + 1}" aria-pressed="${e.taktik[feld] === i + 1}" ${zu ? 'disabled' : ''}>${text(name)}</button>`).join('')}</div>`;
  const frische = (s) => `<span class="frischebalken" title="Frische ${s.frische}"><i style="width:${s.frische}%"></i></span>`;
  const muede = (s) => (s.frische < 60 ? 'muede' : '');
  const auf = e.auf.map((s) => `<tr data-spieler="${s.id}" class="${muede(s)} ${live.raus === s.id ? 'gewaehlt' : ''}">
      <td>${text(s.platz)}</td><td><button type="button" class="namelink" data-raus="${s.id}" ${zu ? 'disabled' : ''}>${text(s.name)}</button>${s.gelb ? ' <i class="kartenzeichen gelb" title="verwarnt"></i>' : ''}</td>
      <td class="zahl">${s.staerke}</td><td class="frische">${frische(s)}</td></tr>`).join('');
  const bank = e.bank.map((s) => `<tr data-spieler="${s.id}" class="${muede(s)}">
      <td>${text(s.position)}</td><td><button type="button" class="namelink" data-rein="${s.id}" ${zu || !live.raus ? 'disabled' : ''}>${text(s.name)}</button></td>
      <td class="zahl">${s.staerke}</td><td class="frische">${frische(s)}</td></tr>`).join('');
  const gewaehlt = e.auf.find((s) => s.id === live.raus);
  rand.innerHTML = `<div class="eingriff">
    <h2>Eingreifen</h2>
    <p class="ab" id="liveAb">${abText}</p>
    ${live.grund ? `<p class="grund" id="liveGrund" role="alert">${text(live.grund)}</p>` : ''}
    ${live.aenderungen.length ? `<ul class="geaendert" id="liveGeaendert">${live.aenderungen.slice(-3).reverse()
    .map((a) => `<li>${text(a.was)} <span>wirkt ab Minute ${a.ab}</span></li>`).join('')}</ul>` : ''}
    <div class="stellwerk">
      <span>Ausrichtung</span>${stufen('ausrichtung', lage.stand.ausrichtungen)}
      <span>Pressing</span>${stufen('pressing', ['1', '2', '3', '4', '5'])}
      <span>Härte</span>${stufen('haerte', ['1', '2', '3', '4', '5'])}
    </div>
    <div class="aufbank">
      <table><caption>Auf dem Platz <small>Stärke, Frische</small></caption>${auf}</table>
      <table><caption>Bank <small>${gewaehlt ? `für ${text(gewaehlt.name)}` : 'erst links wählen'}</small></caption>${bank || '<tr><td colspan="4" class="leise">niemand</td></tr>'}</table>
    </div>
  </div>`;
  alle('[data-regler]', rand).forEach((k) => k.addEventListener('click', () => taktikSetzen(k.dataset.regler, Number(k.dataset.wert))));
  alle('[data-raus]', rand).forEach((k) => k.addEventListener('click', () => {
    live.raus = live.raus === k.dataset.raus ? null : k.dataset.raus;
    randMalen();
  }));
  alle('[data-rein]', rand).forEach((k) => k.addEventListener('click', () => wechseln(k.dataset.rein)));
}

/** @type {string} */
randMalen.zuletzt = '';

const REGLERNAME ={ ausrichtung: 'Ausrichtung', pressing: 'Pressing', haerte: 'Härte' };

async function taktikSetzen(feld, wert) {
  const d = live.daten;
  if (!d || d.eigene.taktik[feld] === wert) return;
  const ab = d.minute + 1;
  if (await holen({ taktik: { [feld]: wert } })) {
    const name = feld === 'ausrichtung' ? lage.stand.ausrichtungen[wert - 1] : String(wert);
    live.aenderungen.push({ was: `${REGLERNAME[feld]}: ${name}`, ab });
    randMalen();
  }
}

async function wechseln(rein) {
  const d = live.daten;
  const raus = d && d.eigene.auf.find((s) => s.id === live.raus);
  const fuer = d && d.eigene.bank.find((s) => s.id === rein);
  if (!raus || !fuer) return;
  const ab = d.minute + 1;
  const angenommen = await holen({ wechsel: { raus: raus.id, rein } });
  if (angenommen) live.aenderungen.push({ was: `${fuer.name} für ${raus.name}`, ab });
  // Auch nach einer Absage ist niemand mehr gewaehlt - sonst hebt der naechste
  // Klick auf denselben Spieler die Wahl auf, statt sie zu treffen.
  live.raus = null;
  randMalen();
}

// ------------------------------------------------------------ Einstieg

$('live').addEventListener('click', anpfeifen);

// Die Leertaste haelt an und laesst weiterlaufen - "Weiter" gibt es im Spiel nicht.
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || !live.daten || !$('liveTafel') || amEnde()) return;
  const ziel = e.target instanceof Element ? e.target : null;
  if (ziel?.matches('input, select, textarea, button')) return;
  e.preventDefault();
  if (inDerKabine()) return;
  tempoWaehlen(live.tempo === 'pause' ? 'normal' : 'pause');
});
