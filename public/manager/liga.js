// @ts-check
// Die Liga: Tabelle und Torjaeger beider Ligen, der eigene Spielplan - und
// der Kader eines anderen Vereins, den ein Klick auf seine Zeile zeigt.
import {
  alle, anfragen, ansicht, dialog, inhalt, lage, zeichnen,
} from './kern.js';
import {
  eigenesErgebnis, eigenesSpielText, geld, namensknopf, rolleText, text, zahl,
} from './teile.js';

export function blattLiga() {
  const { stand } = lage;
  const nummer = ansicht.liga || stand.verein.liga;
  const tabelle = stand.tabellen[nummer];
  const eigeneLiga = nummer === stand.verein.liga;
  inhalt.innerHTML = `
    <div class="umschalter">${[1, 2].map((n) => `<button class="reiterKnopf" data-liga-wahl="${n}" aria-pressed="${n === nummer}">${n}. Liga</button>`).join('')}</div>
    <div class="zweispalten">
      <section>
        <h2>Tabelle ${nummer}. Liga</h2>
        <div class="tabellenrahmen"><table id="tabelle"><thead><tr><th>#</th><th class="links">Verein</th><th>Sp</th>
          <th>S</th><th>U</th><th>N</th><th>Tore</th><th>Diff</th><th>Pkt</th></tr></thead>
        <tbody>${tabelle.map((z) => `<tr data-verein="${z.id}" class="${z.eigenes ? 'ich' : ''} ${z.zone || ''}">
          <td>${z.platz}</td><td class="links">${text(z.name)}${z.abzug ? ` <small class="schlecht">-${z.abzug} Pkt</small>` : ''}</td>
          <td>${z.spiele}</td><td>${z.siege}</td><td>${z.unentschieden}</td><td>${z.niederlagen}</td>
          <td>${z.tore}:${z.gegentore}</td><td>${z.tore - z.gegentore > 0 ? '+' : ''}${z.tore - z.gegentore}</td>
          <td><b>${z.wertung}</b></td></tr>`).join('')}</tbody></table></div>
        <p class="unterzeile">${nummer === 1 ? 'Grün: Meister · Rot: die drei Absteiger' : 'Grün: die drei Aufsteiger'} · Ein Klick auf einen Verein zeigt seinen Kader.</p>
      </section>
      <section>
        <h2>Torjäger ${nummer}. Liga</h2>
        ${stand.torjaeger[nummer].length ? `<table id="torjaeger"><thead><tr><th>#</th><th class="links">Spieler</th><th class="links">Verein</th><th>Tore</th></tr></thead>
          <tbody>${stand.torjaeger[nummer].map((t, i) => `<tr><td>${i + 1}</td><td class="links">${text(t.name)}</td>
            <td class="links leise">${text(t.verein)}</td><td><b>${t.tore}</b></td></tr>`).join('')}</tbody></table>`
          : '<p class="unterzeile">Noch kein Tor gefallen.</p>'}
        ${eigeneLiga ? `<h2 style="margin-top:1.5rem">Spielplan ${text(stand.verein.name)}</h2>
          <table id="spielplan"><tbody>${stand.kalender.filter((t) => t.art === 'liga').map((t) => {
            const ergebnis = eigenesErgebnis(t.spiel);
            return `<tr class="${t.index === stand.termin.index ? 'naechster' : ''}"><td class="links">${text(t.titel)}</td>
              <td class="links">${eigenesSpielText(t.spiel)}</td><td class="${ergebnis.klasse}">${ergebnis.text}</td></tr>`;
          }).join('')}</tbody></table>` : ''}
      </section>
    </div>`;

  alle('[data-liga-wahl]').forEach((knopf) => {
    knopf.addEventListener('click', () => { ansicht.liga = Number(knopf.dataset.ligaWahl); zeichnen(); });
  });
  alle('tr[data-verein]').forEach((zeile) => {
    zeile.addEventListener('click', () => vereinAnsehen(zeile.dataset.verein));
  });
}

/** Ein anderer Verein, wie ihn ein Beobachter sieht: Kader, Werte, Preise. */
export async function vereinAnsehen(id) {
  const daten = await anfragen(`/api/manager/spielstaende/${lage.kennung}/verein/${id}`);
  const v = daten.verein;
  if (!v) return;
  dialog(`
    <h2 id="vereinsansicht">${text(v.name)}</h2>
    <p class="unterzeile">${v.liga}. Liga · Platz ${v.platz} · Kader ${v.niveau} · Ruf ${v.reputation} · ${zahl(v.plaetze)} Plätze · spielt ${v.system}</p>
    <div class="tabellenrahmen"><table><thead><tr><th class="links">Pos</th><th class="links">Spieler</th><th>Alt</th><th>St</th>
      <th>Sp</th><th>T</th><th>Wert</th><th>Forderung</th><th>Vertrag</th></tr></thead>
    <tbody>${v.spieler.map((s) => `<tr><td class="links">${rolleText(s)}</td>
      <td class="links">${namensknopf(s.id, s.name)}${s.ausfall ? ` <small class="schlecht">${text(s.ausfall)}</small>` : ''}${s.karriereende ? ' <small class="marke ende">hört auf</small>' : ''}</td>
      <td>${s.alter}</td><td><b>${s.staerke}</b></td><td>${s.spiele}</td><td>${s.tore}</td><td>${geld(s.wert)}</td>
      <td>${s.forderung === null ? '–' : s.verkaeuflich ? geld(s.forderung) : '<span class="leise">unverkäuflich</span>'}</td>
      <td>${s.vertragBis ?? '–'}</td></tr>`).join('')}</tbody></table></div>
    <p class="unterzeile">Kaufen geht im Transfermarkt, solange das Fenster offen ist.</p>`);
}
