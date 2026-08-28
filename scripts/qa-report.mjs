#!/usr/bin/env node
// Erzeugt qa/report/index.html: dieselben Daten wie specs/BOARD.md, aber als
// Seite zum Filtern, Suchen und Herzeigen. Eine Datei ohne fremde Quellen -
// sie muss sich per Doppelklick oeffnen lassen.
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { lesen, testtext, belegt, zaehlen, STATUS, ANZEIGE, WURZEL } from './specs-lesen.mjs';

const ZIEL = join(WURZEL, 'qa', 'report');

const FARBE = {
  fertig: '#3fa66a',
  'in qa': '#4a90d9',
  'in arbeit': '#d9a13f',
  geplant: '#8a7fd9',
  offen: '#7d8794',
  zurueckgestellt: '#4d545e',
};

const schuetzen = (text) => String(text)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// Sehr kleine Auszeichnung: **fett**, `code`, _kursiv_. Mehr steht in den
// Kriterientexten nicht drin.
function auszeichnen(text) {
  return schuetzen(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/_([^_]+)_/g, '<em>$1</em>');
}

const specs = await lesen();
const fehler = specs.flatMap((s) => s.fehler);
if (fehler.length) {
  for (const f of fehler) console.error(`Fehler: ${f}`);
  process.exit(1);
}

const text = await testtext();
const gesamt = zaehlen(specs.flatMap((s) => s.kriterien));
const anzahl = specs.reduce((summe, s) => summe + s.kriterien.length, 0);
const erledigt = gesamt.fertig;
const anteil = anzahl ? Math.round((erledigt / anzahl) * 100) : 0;
const stand = new Date().toLocaleString('de-DE', { dateStyle: 'long', timeStyle: 'short' });

const bereiche = [...new Set(specs.map((s) => s.bereich))];

const balken = STATUS.filter((s) => gesamt[s] > 0).map((s) => `
        <span class="stueck" style="width:${(gesamt[s] / anzahl) * 100}%;background:${FARBE[s]}"
              title="${ANZEIGE[s]}: ${gesamt[s]}"></span>`).join('');

const marken = STATUS.map((s) => `
        <button class="marke" data-status="${s}" aria-pressed="false">
          <span class="punkt" style="background:${FARBE[s]}"></span>${ANZEIGE[s]}
          <span class="zahl">${gesamt[s]}</span>
        </button>`).join('');

const abschnitte = specs.map((spec) => {
  const zahlen = zaehlen(spec.kriterien);
  const specFertig = zahlen.fertig;
  const kriterien = spec.kriterien.map((k) => {
    const nachweis = k.status === 'fertig'
      ? (belegt(text, spec.kuerzel, k.nummer)
        ? '<span class="beleg ja" title="Ein Test nennt dieses Kriterium">belegt</span>'
        : '<span class="beleg nein" title="Kein Test nennt dieses Kriterium">ohne Beleg</span>')
      : '';
    return `
        <li class="kriterium" data-status="${k.status}"
            data-suche="${schuetzen(`${k.nummer} ${k.kurz} ${k.text} ${spec.titel}`.toLowerCase())}">
          <span class="nummer">${k.nummer}</span>
          <span class="status" style="--farbe:${FARBE[k.status]}">${ANZEIGE[k.status]}</span>
          <div class="inhalt">
            <div class="kopf"><strong>${schuetzen(k.kurz)}</strong>${nachweis}</div>
            <p>${auszeichnen(k.text)}</p>
            <span class="abschnitt">${schuetzen(k.abschnitt)}</span>
          </div>
        </li>`;
  }).join('');

  return `
      <section class="spec" data-bereich="${schuetzen(spec.bereich)}">
        <header>
          <h2><a href="../../specs/${spec.ziel}">${schuetzen(spec.titel)}</a></h2>
          <div class="specmeta">
            <span class="bereich">${schuetzen(spec.bereich)}</span>
            <code>${schuetzen(spec.kuerzel)}</code>
            <span class="fortschritt">${specFertig} / ${spec.kriterien.length} fertig</span>
          </div>
          <div class="leiste klein">${STATUS.filter((s) => zahlen[s] > 0).map((s) =>
    `<span class="stueck" style="width:${(zahlen[s] / spec.kriterien.length) * 100}%;background:${FARBE[s]}" title="${ANZEIGE[s]}: ${zahlen[s]}"></span>`).join('')}</div>
        </header>
        <ul class="kriterien">${kriterien}</ul>
      </section>`;
}).join('');

const seite = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OnlineGames — Abnahmekriterien</title>
<style>
  :root {
    --grund: #f7f8fa; --tafel: #fff; --rand: #e2e6ec;
    --schrift: #1c2027; --leise: #6b7482; --betont: #2f6fb5;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --grund: #14171c; --tafel: #1d222a; --rand: #2c333d;
      --schrift: #e6e9ee; --leise: #97a1b0; --betont: #6aa6e6;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 2rem 1.25rem 4rem; background: var(--grund); color: var(--schrift);
    font: 15px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  .blatt { max-width: 1000px; margin: 0 auto; }
  h1 { margin: 0 0 .25rem; font-size: 1.7rem; letter-spacing: -.02em; }
  .unterzeile { margin: 0 0 1.5rem; color: var(--leise); font-size: .9rem; }
  .leiste {
    display: flex; height: 12px; border-radius: 6px; overflow: hidden;
    background: var(--rand); margin-bottom: .6rem;
  }
  .leiste.klein { height: 5px; margin: .5rem 0 0; }
  .stueck { display: block; height: 100%; }
  .summe { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }
  .gross { font-size: 2rem; font-weight: 650; letter-spacing: -.02em; }
  .werkzeug {
    display: flex; flex-wrap: wrap; gap: .5rem; align-items: center;
    margin: 1.5rem 0; padding: 1rem; background: var(--tafel);
    border: 1px solid var(--rand); border-radius: 12px; position: sticky; top: 0; z-index: 2;
  }
  input[type=search], select {
    padding: .5rem .7rem; background: var(--grund); color: var(--schrift);
    border: 1px solid var(--rand); border-radius: 8px; font: inherit;
  }
  input[type=search] { flex: 1; min-width: 200px; }
  .marke {
    display: inline-flex; align-items: center; gap: .4rem; padding: .4rem .7rem;
    background: var(--grund); color: var(--schrift); border: 1px solid var(--rand);
    border-radius: 999px; font: inherit; font-size: .85rem; cursor: pointer;
  }
  .marke[aria-pressed=true] { border-color: var(--betont); background: color-mix(in srgb, var(--betont) 14%, transparent); }
  .punkt { width: 9px; height: 9px; border-radius: 50%; }
  .zahl { color: var(--leise); font-variant-numeric: tabular-nums; }
  .spec {
    margin-bottom: 1.25rem; background: var(--tafel);
    border: 1px solid var(--rand); border-radius: 12px; overflow: hidden;
  }
  .spec > header { padding: 1rem 1.25rem; border-bottom: 1px solid var(--rand); }
  .spec h2 { margin: 0; font-size: 1.1rem; }
  .spec h2 a { color: inherit; text-decoration: none; }
  .spec h2 a:hover { color: var(--betont); text-decoration: underline; }
  .specmeta {
    display: flex; flex-wrap: wrap; gap: .75rem; align-items: center;
    margin-top: .3rem; color: var(--leise); font-size: .82rem;
  }
  .specmeta code { background: var(--grund); padding: .1rem .4rem; border-radius: 4px; }
  .kriterien { margin: 0; padding: 0; list-style: none; }
  .kriterium {
    display: grid; grid-template-columns: 4.5rem 8.5rem 1fr; gap: .75rem;
    padding: .7rem 1.25rem; border-top: 1px solid var(--rand); align-items: start;
  }
  .kriterium:first-child { border-top: none; }
  .nummer { color: var(--leise); font-variant-numeric: tabular-nums; font-size: .85rem; padding-top: .1rem; }
  .status {
    font-size: .78rem; font-weight: 600; color: var(--farbe);
    border: 1px solid var(--farbe); border-radius: 999px;
    padding: .05rem .5rem; text-align: center; white-space: nowrap;
  }
  .inhalt p { margin: .15rem 0 0; color: var(--leise); font-size: .9rem; }
  .inhalt code { background: var(--grund); padding: .05rem .3rem; border-radius: 4px; font-size: .85em; }
  .kopf { display: flex; flex-wrap: wrap; gap: .5rem; align-items: baseline; }
  .abschnitt { display: inline-block; margin-top: .35rem; color: var(--leise); font-size: .75rem; opacity: .75; }
  .beleg { font-size: .72rem; padding: .05rem .4rem; border-radius: 4px; }
  .beleg.ja { background: color-mix(in srgb, #3fa66a 20%, transparent); color: #3fa66a; }
  .beleg.nein { background: color-mix(in srgb, #d9534a 20%, transparent); color: #d9534a; }
  .leer { padding: 2rem; text-align: center; color: var(--leise); }
  .fuss { margin-top: 2rem; color: var(--leise); font-size: .82rem; }
  @media (max-width: 720px) {
    .kriterium { grid-template-columns: 1fr; gap: .25rem; }
    .status { justify-self: start; }
    .werkzeug { position: static; }
  }
</style>
</head>
<body>
<div class="blatt">
  <h1>Abnahmekriterien</h1>
  <p class="unterzeile">OnlineGames · Stand ${stand} · erzeugt aus <code>specs/</code> mit <code>npm run qa:report</code></p>

  <div class="summe">
    <span class="gross">${anteil}&nbsp;%</span>
    <span class="unterzeile" style="margin:0">${erledigt} von ${anzahl} Kriterien fertig</span>
  </div>
  <div class="leiste">${balken}</div>

  <div class="werkzeug">
    <input type="search" id="suche" placeholder="Suchen in Titel und Text …" aria-label="Suchen">
    <select id="bereich" aria-label="Bereich">
      <option value="">Alle Bereiche</option>
      ${bereiche.map((b) => `<option value="${schuetzen(b)}">${schuetzen(b)}</option>`).join('')}
    </select>
    ${marken}
  </div>

  <div id="liste">${abschnitte}</div>
  <p class="leer" id="leer" hidden>Nichts gefunden.</p>

  <p class="fuss">
    <strong>fertig</strong> heisst: gebaut <em>und</em> von einem Test belegt, der das Kriterium
    mit seiner Nummer nennt — geprueft von <code>npm run specs:belege</code>.
    <strong>in qa</strong> heisst: gebaut, aber noch nicht belegt.
  </p>
</div>

<script>
  const suche = document.getElementById('suche');
  const bereich = document.getElementById('bereich');
  const marken = [...document.querySelectorAll('.marke')];
  const specs = [...document.querySelectorAll('.spec')];
  const leer = document.getElementById('leer');

  for (const marke of marken) {
    marke.addEventListener('click', () => {
      marke.setAttribute('aria-pressed', marke.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      filtern();
    });
  }
  suche.addEventListener('input', filtern);
  bereich.addEventListener('change', filtern);

  function filtern() {
    const wort = suche.value.trim().toLowerCase();
    const nurBereich = bereich.value;
    const stati = marken.filter((m) => m.getAttribute('aria-pressed') === 'true')
      .map((m) => m.dataset.status);
    let sichtbar = 0;

    for (const spec of specs) {
      let treffer = 0;
      const passtBereich = !nurBereich || spec.dataset.bereich === nurBereich;
      for (const k of spec.querySelectorAll('.kriterium')) {
        const passt = passtBereich
          && (!stati.length || stati.includes(k.dataset.status))
          && (!wort || k.dataset.suche.includes(wort));
        k.hidden = !passt;
        if (passt) treffer++;
      }
      spec.hidden = treffer === 0;
      sichtbar += treffer;
    }
    leer.hidden = sichtbar > 0;
  }
</script>
</body>
</html>
`;

await mkdir(ZIEL, { recursive: true });
await writeFile(join(ZIEL, 'index.html'), seite);
console.log(`Report geschrieben: qa/report/index.html (${erledigt}/${anzahl} fertig, ${anteil} %)`);
