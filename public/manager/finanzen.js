// @ts-check
// Die Finanzen: die Saison nach Posten, das Buch, Sponsor, Eintritt und Stadion.
import {
  $, alle, inhalt, lage, melden, wertVon, zeichnen, zug,
} from './kern.js';
import { geld, nachTermin, text, zahl } from './teile.js';

const POSTEN = {
  zuschauer: 'Zuschauer',
  fernsehen: 'Fernsehgeld',
  sponsor: 'Sponsor',
  praemien: 'Prämien',
  transfers: 'Transfers',
  gehaelter: 'Gehälter',
  stadion: 'Stadionausbau',
  abfindungen: 'Abfindungen',
  zinsen: 'Zinsen',
};

export function blattFinanzen() {
  const { stand } = lage;
  const v = stand.verein;
  const jetzt = stand.kasse ? stand.kasse.posten : {};
  const vorjahr = stand.vorjahr ? stand.vorjahr.posten : null;
  const netto = (p) => (p ? p.ein - p.aus : 0);
  const summe = (posten, feld) => Object.values(posten).reduce((s, p) => s + p[feld], 0);

  inhalt.innerHTML = `
    <div class="zweispalten">
      <section>
        <h2>Saison ${stand.saison} nach Posten</h2>
        <table id="posten"><thead><tr><th class="links">Posten</th><th>Einnahmen</th><th>Ausgaben</th>${vorjahr ? '<th>Vorsaison</th>' : ''}</tr></thead>
        <tbody>${Object.entries(POSTEN).map(([schluessel, name]) => `<tr data-posten="${schluessel}">
          <td class="links">${name}</td>
          <td class="gut">${jetzt[schluessel] && jetzt[schluessel].ein ? geld(jetzt[schluessel].ein) : ''}</td>
          <td class="schlecht">${jetzt[schluessel] && jetzt[schluessel].aus ? geld(-jetzt[schluessel].aus) : ''}</td>
          ${vorjahr ? `<td class="leise">${vorjahr[schluessel] ? geld(netto(vorjahr[schluessel])) : ''}</td>` : ''}</tr>`).join('')}
          <tr><td class="links"><b>Summe</b></td><td class="gut"><b>${geld(summe(jetzt, 'ein'))}</b></td>
            <td class="schlecht"><b>${geld(-summe(jetzt, 'aus'))}</b></td>
            ${vorjahr ? `<td class="leise">${geld(summe(vorjahr, 'ein') - summe(vorjahr, 'aus'))}</td>` : ''}</tr>
        </tbody></table>
        <p class="unterzeile">Konto ${geld(v.konto)} · Gehälter ${geld(v.gehaltJahr)} im Jahr, ${geld(v.gehaltJeTermin)} je Termin ·
          Fernsehgeld ${geld(v.fernsehgeld)} je Ligaspiel. Unter -3 Mio kostet es zur Winterpause und vor der Saison 6 Punkte.</p>

        <h2 style="margin-top:1.5rem">Buch</h2>
        <div id="buch">${nachTermin(stand.buch.slice(0, 60)).map((g) => {
    const saldo = g.eintraege.reduce((s, b) => s + b.betrag, 0);
    const vorzeichen = (betrag) => `<span class="betrag ${betrag >= 0 ? 'gut' : 'schlecht'}">${betrag >= 0 ? '+' : ''}${geld(betrag)}</span>`;
    return `<div class="termingruppe"><div class="datum"><span>${text(g.datum)}</span>${vorzeichen(saldo)}</div>
      ${g.eintraege.map((b) => `<div class="buchzeile">${vorzeichen(b.betrag)} ${text(b.zweck)}</div>`).join('')}</div>`;
  }).join('') || '<p class="unterzeile">Noch nichts gebucht.</p>'}</div>
      </section>

      <section>
        <div class="karte" id="sponsor">
          <h2>Sponsor</h2>
          ${v.sponsor ? `<p><b>${text(v.sponsor.name)}</b> (${text(v.sponsor.art)}): ${geld(v.sponsor.jeSpiel)} je Ligaspiel, ${geld(v.sponsor.jeSieg)} je Sieg.</p>`
            : stand.sponsorAngebote.length ? `<p class="unterzeile">Drei Angebote für die Saison ${stand.saison}. Wer nicht wählt, bekommt den ausgewogenen.</p>
              <div class="vereinsliste" id="sponsorAngebote">${stand.sponsorAngebote.map((a) => `<button class="vereinskarte" data-sponsor="${a.id}">
                <b>${text(a.name)} · ${text(a.art)}</b><small>${geld(a.jeSpiel)} je Ligaspiel · ${geld(a.jeSieg)} je Sieg · über 34 Spiele ${geld(a.jeSpiel * 34)} sicher</small>
              </button>`).join('')}</div>` : '<p class="unterzeile">Kein Sponsor.</p>'}
        </div>

        <div class="karte" id="eintrittKarte">
          <h2>Eintritt</h2>
          <div class="regler"><label><span>Preis je Karte</span>
            <input type="range" id="eintritt" min="5" max="80" value="${v.eintritt}" />
            <b id="eintrittWert">${v.eintritt} Euro</b></label></div>
          <p class="unterzeile">Mehr Geld je Karte, weniger Zuschauer. Die Liga nimmt im Schnitt ${v.liga === 1 ? 22 : 14} Euro.</p>
        </div>

        <div class="karte" id="stadion">
          <h2>Stadion</h2>
          <p>${zahl(v.stadion.plaetze)} Plätze.
            ${v.stadion.ausbau ? `Im Bau: ${zahl(v.stadion.ausbau.plaetze)} Plätze, fertig in ${v.stadion.ausbau.rest} ${v.stadion.ausbau.rest === 1 ? 'Woche' : 'Wochen'}.` : ''}</p>
          ${v.stadion.ausbau ? '' : `<div class="reihe">${stand.ausbau.map((a) => `<button data-ausbau="${a.stufe}" ${v.konto < a.kosten ? 'disabled title="Zu teuer."' : ''}>
            +${zahl(a.plaetze)} Plätze · ${geld(a.kosten)} · ${a.termine} Wochen</button>`).join('')}</div>
            ${v.konto < Math.min(...stand.ausbau.map((a) => a.kosten))
    ? `<p class="unterzeile">Für den kleinsten Ausbau fehlen ${geld(Math.min(...stand.ausbau.map((a) => a.kosten)) - v.konto)}.</p>` : ''}`}
        </div>
      </section>
    </div>`;

  alle('[data-sponsor]').forEach((knopf) => {
    knopf.addEventListener('click', async () => {
      const daten = await zug('sponsor', { id: knopf.dataset.sponsor });
      if (daten.ok) melden(`${daten.sponsor.name} ist Sponsor.`);
      zeichnen();
    });
  });
  $('eintritt').addEventListener('input', (e) => { $('eintrittWert').textContent = `${wertVon(e)} Euro`; });
  $('eintritt').addEventListener('change', (e) => zug('eintritt', { preis: Number(wertVon(e)) }).then(zeichnen));
  alle('[data-ausbau]').forEach((knopf) => {
    knopf.addEventListener('click', async () => {
      const daten = await zug('stadion', { stufe: Number(knopf.dataset.ausbau) });
      if (daten.ok) melden('Der Ausbau beginnt.');
      zeichnen();
    });
  });
}
