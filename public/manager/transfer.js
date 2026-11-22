// @ts-check
// Der Transfer: Angebote fuer die eigenen Spieler, der Markt mit Filtern,
// das Holen eines Spielers und die Wechsel der Liga.
import {
  $, alle, anfragen, ansicht, dialog, dialogZu, feld, inhalt, lage, melden, wertVon, zeichnen, zug,
} from './kern.js';
import {
  geld, jahre, namensknopf, rolleText, text,
} from './teile.js';

const POSITIONEN = ['TOR', 'ABW', 'MIT', 'ANG'];
const TEILNAMEN = { TOR: 'Torwart', ABW: 'Abwehr', MIT: 'Mittelfeld', ANG: 'Angriff' };

async function marktHolen() {
  const f = ansicht.markt;
  const suche = new URLSearchParams({ sortierung: f.sortierung, anzahl: String(f.anzahl) });
  if (f.position) suche.set('position', f.position);
  if (f.liga) suche.set('liga', f.liga);
  if (f.maxAlter) suche.set('maxAlter', f.maxAlter);
  if (f.minStaerke) suche.set('minStaerke', f.minStaerke);
  if (f.bezahlbar) suche.set('maxPreis', String(Math.max(0, lage.stand.verein.konto)));
  const daten = await anfragen(`/api/manager/spielstaende/${lage.kennung}/markt?${suche}`);
  lage.markt = daten.markt || { liste: [], gesamt: 0, fenster: lage.stand.fenster };
}

const laufzeitMax = (alter) => (alter >= 33 ? 1 : alter >= 31 ? 2 : 4);

export function blattTransfer() {
  if (!lage.markt) {
    inhalt.innerHTML = '<p class="unterzeile">Markt wird geladen ...</p>';
    marktHolen().then(() => { if (lage.blatt === 'transfer') zeichnen(); });
    return;
  }
  const { stand, markt } = lage;
  const konto = stand.verein.konto;
  const f = ansicht.markt;
  const gesperrt = (s) => {
    if (!s.bereit) return s.grund;
    if (s.vereinId && !markt.fenster.offen) return 'Das Transferfenster ist geschlossen.';
    if (konto <= 0) return 'Mit leerem Konto unterschreibt niemand.';
    if (s.forderung > konto) return 'Zu teuer.';
    return '';
  };

  inhalt.innerHTML = `
    <p id="fensterStatus" class="${markt.fenster.offen ? 'gut' : 'leise'}">${text(markt.fenster.text)}</p>
    ${stand.angebote.length ? `<section id="angebote"><h2>Angebote für deine Spieler</h2>
      ${stand.angebote.map((a) => `<div class="angebot">
        <span><strong>${text(a.verein)}</strong> (${a.liga}. Liga) bietet <strong>${geld(a.gebot)}</strong>
          für ${namensknopf(a.spielerId, a.spieler)} (${a.rolle || a.position}, Stärke ${a.staerke}, Wert ${geld(a.wert)})</span>
        <button data-annehmen="${a.id}" class="haupt">Annehmen</button>
        <button data-ablehnen="${a.id}" class="leise">Ablehnen</button>
      </div>`).join('')}</section>` : ''}

    <section>
      <h2>Transfermarkt <span class="leise">${markt.gesamt} passende Spieler · Konto ${geld(konto)}</span></h2>
      <div class="marktfilter">
        <label class="feld"><span>Position</span><select id="filterPosition"><option value="">alle</option>
          ${POSITIONEN.map((p) => `<option value="${p}"${f.position === p ? ' selected' : ''}>${TEILNAMEN[p]}</option>`).join('')}</select></label>
        <label class="feld"><span>Liga</span><select id="filterLiga">
          ${[['', 'alle'], ['1', '1. Liga'], ['2', '2. Liga'], ['frei', 'vereinslos']].map(([wert, name]) => `<option value="${wert}"${f.liga === wert ? ' selected' : ''}>${name}</option>`).join('')}
        </select></label>
        <label class="feld"><span>höchstens Alter</span><input id="filterAlter" inputmode="numeric" value="${text(f.maxAlter)}" /></label>
        <label class="feld"><span>mindestens Stärke</span><input id="filterStaerke" inputmode="numeric" value="${text(f.minStaerke)}" /></label>
        <label class="feld"><span>Sortierung</span><select id="filterSortierung">
          ${[['staerke', 'Stärke'], ['preis', 'Preis'], ['alter', 'Alter'], ['talent', 'Talent']].map(([wert, name]) => `<option value="${wert}"${f.sortierung === wert ? ' selected' : ''}>${name}</option>`).join('')}
        </select></label>
        <button id="filterBezahlbar" class="${f.bezahlbar ? 'an' : ''}">${f.bezahlbar ? '✓ ' : ''}nur bezahlbare</button>
      </div>
      <div class="tabellenrahmen"><table id="markt"><thead><tr>
        <th class="links">Pos</th><th class="links">Spieler</th><th class="links">Verein</th><th>Alt</th><th>St</th><th>Tal</th>
        <th>Gehalt</th><th>Wert</th><th>Forderung</th><th>Vertrag</th><th></th>
      </tr></thead><tbody>
      ${markt.liste.map((s) => {
        const grund = gesperrt(s);
        return `<tr data-markt="${s.id}">
          <td class="links">${rolleText(s)}</td>
          <td class="links">${namensknopf(s.id, s.name)}${s.transferliste ? ' <small class="marke">Liste</small>' : ''}${s.karriereende ? ' <small class="marke ende">hört auf</small>' : ''}</td>
          <td class="links leise">${text(s.verein)}${s.liga ? ` <small>(${s.liga}.)</small>` : ''}</td>
          <td>${s.alter}</td><td><b>${s.staerke}</b></td><td class="leise">${s.talent}</td>
          <td>${geld(s.gehalt)}</td><td>${geld(s.wert)}</td>
          <td class="${s.forderung > konto ? 'schlecht' : 'gut'}">${geld(s.forderung)}</td>
          <td>${s.vertragBis ?? '–'}</td>
          <td><button data-kaufen="${s.id}" ${grund ? `disabled title="${text(grund)}"` : ''}>holen</button></td>
        </tr>`;
      }).join('')}
      </tbody></table></div>
      ${markt.gesamt > markt.liste.length && markt.liste.length < 200
    ? `<p><button id="mehrMarkt">weitere zeigen <span class="leise">· ${markt.liste.length} von ${markt.gesamt}</span></button></p>` : ''}
      <p class="unterzeile">Die Forderung ist der Preis, zu dem der Verein abgibt; weniger bringt eine Absage. Vereinslose kosten keine
        Ablöse, nur Gehalt. Nicht jeder will zu jedem Verein - wer nicht will, lässt sich nicht holen.</p>
    </section>

    <section>
      <h2>Wechsel</h2>
      <ul class="liste-einfach" id="wechselTicker">${stand.ticker.map((t) => `<li>S${t.saison}: <b>${text(t.spieler)}</b> (${t.rolle || t.position}, ${t.staerke})
        <span class="leise">${text(t.von)} → ${text(t.zu)}</span> · ${t.abloese ? geld(t.abloese) : 'ablösefrei'}</li>`).join('')
        || '<li class="leise">Noch kein Wechsel.</li>'}</ul>
    </section>`;

  const neuLaden = () => { lage.markt = null; f.anzahl = 60; zeichnen(); };
  // Mehr laden, ohne die Liste erst zu leeren - sonst springt die Seite nach oben.
  $('mehrMarkt')?.addEventListener('click', async () => { f.anzahl += 60; await marktHolen(); zeichnen(); });
  $('filterPosition').addEventListener('change', (e) => { f.position = wertVon(e); neuLaden(); });
  $('filterLiga').addEventListener('change', (e) => { f.liga = wertVon(e); neuLaden(); });
  $('filterSortierung').addEventListener('change', (e) => { f.sortierung = wertVon(e); neuLaden(); });
  $('filterAlter').addEventListener('change', (e) => { f.maxAlter = wertVon(e).trim(); neuLaden(); });
  $('filterStaerke').addEventListener('change', (e) => { f.minStaerke = wertVon(e).trim(); neuLaden(); });
  $('filterBezahlbar').addEventListener('click', () => { f.bezahlbar = !f.bezahlbar; neuLaden(); });
  alle('[data-kaufen]').forEach((knopf) => {
    knopf.addEventListener('click', () => kaufDialog(lage.markt.liste.find((s) => s.id === knopf.dataset.kaufen)));
  });
  alle('[data-annehmen]').forEach((knopf) => {
    knopf.addEventListener('click', async () => {
      const daten = await zug('annehmen', { angebotId: knopf.dataset.annehmen });
      if (daten.ok) melden(`Verkauft - ${geld(daten.erloes)} in der Kasse.`);
      neuLaden();
    });
  });
  alle('[data-ablehnen]').forEach((knopf) => {
    knopf.addEventListener('click', () => zug('ablehnen', { angebotId: knopf.dataset.ablehnen }).then(zeichnen));
  });
}

function kaufDialog(s) {
  dialog(`
    <h2>${text(s.name)} holen</h2>
    <p>${rolleText(s)}, ${s.alter} Jahre, Stärke ${s.staerke}, Talent ${s.talent} · ${text(s.verein)}</p>
    <p>${s.vereinId ? `${text(s.verein)} verlangt <b>${geld(s.forderung)}</b>.` : 'Vereinslos - keine Ablöse.'}
      Er will <b>${geld(s.gehalt)}</b> im Jahr.</p>
    ${s.vereinId ? `<label class="feld klein"><span>Gebot in Tausend</span><input id="gebot" inputmode="numeric" value="${s.forderung}" /></label>` : ''}
    <p class="unterzeile">Wie lange soll der Vertrag laufen?</p>
    <div class="reihe">${Array.from({ length: laufzeitMax(s.alter) }, (_, i) => i + 1)
      .map((j) => `<button class="haupt" data-laufzeit="${j}">${jahre(j)}</button>`).join('')}</div>`,
  (huelle) => alle('[data-laufzeit]', huelle).forEach((knopf) => knopf.addEventListener('click', async () => {
    const gebot = s.vereinId ? Number(feld('gebot').value) : 0;
    const daten = await zug('kaufen', { spielerId: s.id, gebot, laufzeit: Number(knopf.dataset.laufzeit) });
    if (!daten.ok) return;
    dialogZu();
    melden(`${daten.spieler.name} ist da - ${geld(daten.abloese)} Ablöse.`);
    lage.markt = null;
    zeichnen();
  })));
}
