// Die HTML-Vorlage des Berichts qa/report/index.html.
//
// Nur Darstellung: was hier steht, entscheidet nichts. Geprueft und gezaehlt
// wird in scripts/qa-report.mjs; die Vorlage bekommt das Ergebnis und setzt es
// in Markup. Aussehen und Verhalten stehen in qa-bericht-stil.mjs und
// qa-bericht-skript.mjs.
import { KLASSEN } from './fortschritt.mjs';
import { skript } from './qa-bericht-skript.mjs';
import { stil } from './qa-bericht-stil.mjs';
import { ANZEIGE, BOARDFOLGE, KLEIN } from './specs-lesen.mjs';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const zahl = (n) => new Intl.NumberFormat('de-DE').format(n);

/** Fett, kursiv und Code aus dem Spec-Text. Verweise bleiben nur als Text stehen. */
function markdown(text) {
  return esc(text)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])_([^_]+)_/g, '$1<em>$2</em>');
}

const NACHWEIS = { belegt: 'mit Bild', 'ohne-bild': 'kein Bild noetig', offen: 'ohne Nachweis' };
/** Gestapelt von unten nach oben - fertig liegt unten. */
const STAPEL = ['fertig', 'in-qa', 'in-arbeit', 'geplant', 'offen', 'zurueckgestellt'];

const haken = '<span class="haken" title="vollstaendig umgesetzt">✓<span class="nurlesbar"> vollstaendig umgesetzt</span></span>';

/** Eine Spec gilt als vollstaendig, wenn sie Kriterien nennt und jedes davon fertig ist. */
const vollstaendig = (spec) => spec.zeilen.length > 0 && spec.zeilen.every((z) => z.status === 'fertig');
const fertige = (spec) => spec.zeilen.filter((z) => z.status === 'fertig').length;

const knopf = (art, wert, beschriftung, anzahl, klasse = '') => `
        <button type="button" data-art="${art}" data-wert="${wert}" aria-pressed="${wert === 'alle'}" class="${klasse}">${
  klasse ? '<span class="punkt" aria-hidden="true"></span>' : ''
}${esc(beschriftung)} <b>${anzahl}</b></button>`;

/* ---------------------------------------------------------- Kriterien -- */

function acZeile(z) {
  const bilder = z.bilder.map((b) => `
                <figure>
                  <a href="${esc(b.src)}" target="_blank" rel="noopener"><img src="${esc(b.src)}" alt="${esc(b.titel)}" loading="lazy" /></a>
                  <figcaption>${esc(b.titel)} · ${b.stand ? esc(b.stand) : 'noch nicht eingecheckt'}</figcaption>
                </figure>`).join('');

  const hinweise = [];
  if (z.grund) hinweise.push(`<p class="grund"><b>Zurueckgestellt:</b> ${markdown(z.grund)}</p>`);
  if (z.tests.length) {
    hinweise.push(`<p class="beleg"><b>Test:</b> ${z.tests
      .map((t) => `<code>${esc(t.name)}</code> <span class="meta">${esc(t.datei)}</span>`)
      .join('<br />')}</p>`);
  } else if (z.status === 'in-qa' || z.status === 'in-arbeit') {
    hinweise.push(`<p class="beleg">Kein Testname nennt ${esc(z.id)} - deshalb nicht <code>fertig</code>.</p>`);
  }
  if (z.begruendung) {
    hinweise.push(`<p class="grund"><b>Kein Bild verlangt:</b> ${markdown(z.begruendung)}</p>`);
  } else if (!z.bilder.length && (z.status === 'fertig' || z.status === 'in-qa')) {
    hinweise.push('<p class="grund">Noch kein Bildnachweis. Entweder fehlt der Playwright-Beleg, oder das Kriterium '
      + 'gehoert mit Begruendung nach <code>qa/ohne-bild.json</code>.</p>');
  }

  // Gesucht wird in allem, was die Zeile zeigt - auch in Bildunterschrift und
  // Begruendung, sonst findet "Kader ist voll" das Bild nicht, das es zeigt.
  const suchtext = [
    z.id, z.titel, z.text, z.gruppe, KLEIN[z.status], z.begruendung,
    ...z.tests.map((t) => t.name), ...z.bilder.map((b) => b.titel),
  ].join(' ').toLowerCase();
  return `
            <tr class="zeile" data-status="${esc(z.status)}" data-nachweis="${z.zustand}" data-suche="${esc(suchtext)}">
              <td class="ac">
                <span class="id">${esc(z.id)}</span>
                <span class="marke f-${esc(z.status)}">${esc(KLEIN[z.status] ?? z.status)}</span>
                <span class="nachweis">${NACHWEIS[z.zustand]}</span>
              </td>
              <td>
                ${z.gruppe ? `<p class="gruppe">${esc(z.gruppe)}</p>` : ''}
                <p class="titel">${markdown(z.titel)}</p>
                <p class="text">${markdown(z.text)}</p>
                ${hinweise.join('\n                ')}
                ${bilder ? `<div class="bilder">${bilder}</div>` : ''}
              </td>
            </tr>`;
}

function specBlock(spec) {
  const inQa = spec.zeilen.filter((z) => z.status === 'in-qa').length;
  return `
        <section class="spec" id="${esc(spec.pfad)}">
          <h3>${vollstaendig(spec) ? haken : ''}<a href="../../specs/${esc(spec.pfad)}">${esc(spec.titel)}</a></h3>
          <span class="meta">specs/${esc(spec.pfad)} · Kuerzel <code>${esc(spec.kuerzel ?? '?')}</code> · ${fertige(spec)}/${spec.zeilen.length} fertig${
  inQa ? ` · ${inQa} in QA` : ''
}</span>
          ${spec.zeilen.length
    ? `<table class="kriterien">${spec.zeilen.map(acZeile).join('')}
          </table>`
    : '<p class="grund">Diese Spec nennt keine Abnahmekriterien.</p>'}
        </section>`;
}

/** Der Balken im Inhaltsverzeichnis: ein Streifen je Status, breit nach Anzahl. */
function balken(zeilen) {
  const teile = STAPEL.map((s) => ({ s, n: zeilen.filter((z) => z.status === s).length })).filter((t) => t.n);
  if (!teile.length) return '';
  return `<span class="balken" aria-hidden="true">${teile
    .map((t) => `<i class="f-${t.s}" style="flex:${t.n}" title="${t.n} ${KLEIN[t.s]}"></i>`)
    .join('')}</span>`;
}

/* --------------------------------------------------------- Fortschritt -- */

/** Naechster runder Wert oberhalb von max - damit die Achse lesbar bleibt. */
function decke(max) {
  if (max <= 0) return 1;
  const stufe = 10 ** Math.floor(Math.log10(max));
  for (const faktor of [1, 2, 2.5, 5, 10]) if (faktor * stufe >= max) return faktor * stufe;
  return 10 * stufe;
}

/** Gestapelte Saeulen als SVG, fertig im HTML - kein JavaScript noetig. */
function saeulen(punkte, reihen, wert, klasse) {
  const saeule = 30;
  const luecke = 12;
  const hoehe = 170;
  const oben = 18;
  const unten = 22;
  const summen = punkte.map((p) => reihen.reduce((s, r) => s + Math.max(0, wert(p, r.id)), 0));
  const d = decke(Math.max(...summen));
  const breite = Math.max(luecke + punkte.length * (saeule + luecke), 340);

  let inhalt = '';
  for (const anteil of [0, 0.5, 1]) {
    const y = oben + hoehe - anteil * hoehe;
    inhalt += `<line class="linie" x1="0" x2="${breite}" y1="${y}" y2="${y}" />`;
  }
  punkte.forEach((p, i) => {
    const x = luecke + i * (saeule + luecke);
    let y = oben + hoehe;
    for (const r of reihen) {
      const v = Math.max(0, wert(p, r.id));
      if (!v) continue;
      const h = (v / d) * hoehe;
      y -= h;
      inhalt += `<rect class="${klasse(r.id)}" fill="currentColor" x="${x}" y="${y.toFixed(1)}" width="${saeule}" height="${h.toFixed(1)}"><title>${esc(p.anzeige)}: ${esc(r.name)} ${zahl(v)}</title></rect>`;
    }
    inhalt += `<text x="${x + saeule / 2}" y="${oben + hoehe + 15}" text-anchor="middle">${esc(p.kurz)}</text>`;
  });
  inhalt += `<text x="${breite - 4}" y="12" text-anchor="end">bis ${zahl(d)}</text>`;
  return `<div class="rolle"><svg width="${breite}" height="${oben + hoehe + unten}" viewBox="0 0 ${breite} ${oben + hoehe + unten}" role="img" aria-label="Saeulendiagramm">${inhalt}</svg></div>`;
}

const kachel = (name, wert, unter) => `
            <div class="kachel"><div class="name">${esc(name)}</div><div class="zahl">${wert}</div><div class="unter">${unter}</div></div>`;

function fortschrittBlock(verlauf, specsGesamt, vollSpecs) {
  const { punkte } = verlauf;
  const jetzt = punkte.at(-1);
  const statusReihen = STAPEL.map((id) => ({ id, name: ANZEIGE[id] }));

  const zeilen = [...punkte].reverse().map((p) => `
              <tr${p.sha ? '' : ' class="jetzt"'}>
                <td class="links">${esc(p.anzeige)} ${p.sha ? `<code>${esc(p.sha)}</code>` : '<span class="meta">nicht eingecheckt</span>'}</td>
                <td>${zahl(p.zeilen.gesamt)}</td>
                <td class="${p.zuwachs >= 0 ? 'f-fertig' : 'f-zurueckgestellt'}">${p.zuwachs >= 0 ? '+' : ''}${zahl(p.zuwachs)}</td>
                ${KLASSEN.map((k) => `<td>${zahl(p.zeilen[k.id])}</td>`).join('')}
                <td>${p.specs}</td>
                <td>${zahl(p.gesamt)}</td>
                <td class="f-fertig">${zahl(p.status.fertig)}</td>
                <td class="f-in-qa">${zahl(p.status['in-qa'])}</td>
                <td>${p.quote} %</td>
              </tr>`).join('');

  return `
        <section class="block" id="fortschritt">
          <h3>Stand zu Stichtagen</h3>
          <span class="meta">Takt: ${esc(verlauf.taktName)} · aus der Git-Historie, je Stichtag der letzte Commit · Zeilen ohne Bildnachweise, Lockfile und Board</span>
          <div class="kacheln">${kachel('Zeilen', zahl(jetzt.zeilen.gesamt), 'Code · Tests · Doku · Werkzeug')}${
  kachel('Abnahmekriterien', zahl(jetzt.gesamt), `in ${jetzt.specs} Specs, davon ${vollSpecs}/${specsGesamt} vollstaendig`)}${
  kachel('Fertig', zahl(jetzt.status.fertig), `${jetzt.quote} % aller bekannten Kriterien`)}${
  kachel('In QA', zahl(jetzt.status['in-qa']), 'gebaut, aber noch nicht belegt')}
          </div>
          <div class="diagramme">
            <div class="diagramm">
              <h4>Codezeilen je Klasse</h4>
              ${saeulen(punkte, KLASSEN, (p, id) => p.zeilen[id], (id) => `k-${id}`)}
              <div class="legende">${KLASSEN.map((k) => `<span class="k-${k.id}">${esc(k.name)}</span>`).join('')}</div>
            </div>
            <div class="diagramm">
              <h4>Abnahmekriterien je Status</h4>
              ${saeulen(punkte, statusReihen, (p, id) => p.status[id], (id) => `f-${id}`)}
              <div class="legende">${statusReihen.map((r) => `<span class="f-${r.id}">${esc(r.name)}</span>`).join('')}</div>
            </div>
          </div>
          <div class="rahmen">
            <table class="zahlen">
              <thead><tr>
                <th class="links">Stichtag</th><th>Zeilen</th><th>Zuwachs</th>
                ${KLASSEN.map((k) => `<th>${esc(k.name)}</th>`).join('')}
                <th>Specs</th><th>ACs</th><th>Fertig</th><th>In QA</th><th>Grad</th>
              </tr></thead>
              <tbody>${zeilen}
              </tbody>
            </table>
          </div>
        </section>`;
}

function pruefungenBlock(pruef) {
  const zeilen = pruef.arten.map((a) => `
              <tr>
                <td class="links"><b>${esc(a.name)}</b><br /><span class="meta">${esc(a.was)}</span></td>
                <td class="links"><code>${esc(a.lauf)}</code></td>
                <td>${zahl(a.dateien)}</td>
                <td><b>${zahl(a.faelle)}</b></td>
              </tr>`).join('');
  return `
        <section class="block" id="pruefungen">
          <h3>Pruefungen</h3>
          <span class="meta">Bestand im Arbeitsbaum, getrennt nach Art · eine Zahl hier ist ein Bestand, kein Wirksamkeitsnachweis</span>
          <div class="kacheln">${kachel('Testfaelle', zahl(pruef.faelle), `in ${pruef.dateien} Dateien, ${pruef.arten.length} Arten`)}${
  kachel('Waechter', zahl(pruef.waechter.length), 'Skripte in <code>npm run check</code>')}
          </div>
          <div class="rahmen">
            <table class="zahlen">
              <thead><tr><th class="links">Art</th><th class="links">Lauf</th><th>Dateien</th><th>Faelle</th></tr></thead>
              <tbody>${zeilen}
                <tr><td class="links"><b>Summe</b></td><td></td><td>${zahl(pruef.dateien)}</td><td><b>${zahl(pruef.faelle)}</b></td></tr>
              </tbody>
            </table>
          </div>
          <p class="grund"><b>Waechter in <code>npm run check</code>:</b> ${pruef.waechter.map((w) => `<code>${esc(w)}</code>`).join(', ')}</p>
        </section>`;
}

/* --------------------------------------------------------------- Seite -- */

/**
 * @param {{ specs: object[], zaehler: object, verlauf?: object | null, pruefungen?: object | null, erzeugt: string }} daten
 */
export function bericht({ specs, zaehler, verlauf, pruefungen, erzeugt }) {
  const bereiche = new Map();
  for (const spec of specs) {
    const bereich = spec.pfad.split('/')[0];
    if (!bereiche.has(bereich)) bereiche.set(bereich, []);
    bereiche.get(bereich).push(spec);
  }
  const gesamt = zaehler.belegt + zaehler.ohneBild + zaehler.offen;
  const vollSpecs = specs.filter(vollstaendig).length;

  const abschnitte = [...bereiche.entries()].map(([bereich, liste]) => `
      <section class="bereich">
        <h2>${esc(bereich)} · ${esc(liste[0].bereich)}</h2>
        ${liste.map(specBlock).join('')}
      </section>`).join('');

  const inhaltsverzeichnis = [...bereiche.entries()].map(([bereich, liste]) => {
    const voll = liste.filter(vollstaendig).length;
    return `
          <div class="navgruppe">
          <h2><span>${esc(bereich)}</span><span class="meta">${voll === liste.length ? haken : ''}${voll}/${liste.length}</span></h2>${liste
  .map((spec) => `
          <a href="#${esc(spec.pfad)}" data-ziel="${esc(spec.pfad)}" data-spec>
            <span>${esc(spec.titel)}</span>
            <span class="meta">${vollstaendig(spec) ? haken : ''}${fertige(spec)}/${spec.zeilen.length}</span>
          </a>
          ${balken(spec.zeilen)}`)
  .join('')}
          </div>`;
  }).join('');

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OnlineGames — Arbeitsvorrat und Bildnachweise</title>
    <style>${stil}    </style>
  </head>
  <body>
    <header class="kopf">
      <h1><span>OnlineGames</span> — Arbeitsvorrat und Bildnachweise</h1>
      <p class="meta"><span id="stand">${gesamt} Abnahmekriterien in ${specs.length} Specs</span> · erzeugt ${esc(erzeugt)}</p>
      <div class="werkzeug">
        <input id="suche" type="search" placeholder="Suchen (Taste /) — Titel, Text, AC-Nummer, Testname" aria-label="Abnahmekriterien durchsuchen" />
        ${knopf('status', 'alle', 'alle', gesamt)}
        ${BOARDFOLGE.map((s) => knopf('status', s, KLEIN[s], zaehler.status[s] ?? 0, `f-${s}`)).join('')}
        <span class="trenner" aria-hidden="true"></span>
        ${knopf('nachweis', 'belegt', 'mit Bild', zaehler.belegt)}
        ${knopf('nachweis', 'ohne-bild', 'kein Bild noetig', zaehler.ohneBild)}
        ${knopf('nachweis', 'offen', 'ohne Nachweis', zaehler.offen)}
      </div>
    </header>
    <div class="rumpf">
      <nav aria-label="Spezifikationen">
        <h2><span>Ueberblick</span></h2>
        ${verlauf ? `<a href="#fortschritt" data-ziel="fortschritt"><span>Fortschritt</span><span class="meta" title="vollstaendig umgesetzte Specs">${vollSpecs}/${specs.length}</span></a>` : ''}
        ${pruefungen ? `<a href="#pruefungen" data-ziel="pruefungen"><span>Pruefungen</span><span class="meta" title="Testfaelle">${zahl(pruefungen.faelle)}</span></a>` : ''}
        ${inhaltsverzeichnis}
      </nav>
      <main>
        ${verlauf?.punkte.length ? fortschrittBlock(verlauf, specs.length, vollSpecs) : ''}
        ${pruefungen ? pruefungenBlock(pruefungen) : ''}
        ${abschnitte || '<p class="leer">Keine Specs gefunden.</p>'}
        <p class="leer" id="nichts" hidden>Kein Abnahmekriterium passt zu dieser Auswahl.</p>
      </main>
    </div>
    <script>${skript}    </script>
  </body>
</html>
`;
}
