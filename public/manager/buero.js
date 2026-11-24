// @ts-check
// Das Buero: der naechste Termin, Vorstand, Postfach, Kalender, Chronik -
// und nach einer Entlassung die Stellen, nach dem Saisonende die Bilanz.
import {
  alle, inhalt, lage, melden, uebernehmen, zeichnen, zug,
} from './kern.js';
import {
  balken, eigenesErgebnis, eigenesSpielText, nachTermin, text,
} from './teile.js';

export function blattBuero() {
  const { stand } = lage;
  const v = stand.verein;
  const n = stand.naechster;
  const vorstand = stand.vorstand;
  const vertrauen = Math.round(vorstand.vertrauen);
  const zeile = stand.tabellen[v.liga].find((z) => z.eigenes);
  const h = stand.historie[0];
  const bilanz = stand.termin.index === 0 && stand.zuletzt && stand.zuletzt.art === 'saisonende' && h;

  const stellen = stand.status === 'entlassen' ? `
    <section id="stellen" class="karte warnung">
      <h2>Entlassen</h2>
      <p>Der Vorstand hat sich von dir getrennt. Drei Vereine suchen einen Manager:</p>
      <div class="vereinsliste">${stand.stellen.map((s) => `
        <button class="vereinskarte" data-stelle="${s.id}">
          <b>${text(s.name)}</b>
          <small>${s.liga}. Liga · Kader ${s.niveau} · Ruf ${s.reputation}</small>
        </button>`).join('')}</div>
    </section>` : '';

  const bilanzHtml = bilanz ? `
    <section id="bilanz" class="karte">
      <h2>Saison ${h.saison} ist vorbei</h2>
      <p>Meister: <b>${text(h.meister[1])}</b> · 2. Liga: <b>${text(h.meister[2])}</b> · Pokal: <b>${text(h.pokalsieger || '–')}</b></p>
      <p class="unterzeile">Aufsteiger: ${h.aufsteiger.map(text).join(', ')} · Absteiger: ${h.absteiger.map(text).join(', ')}</p>
      ${h.eigener ? `<p id="eigeneBilanz" class="${h.eigener.erreicht ? 'gut' : 'schlecht'}">${text(h.eigener.verein)}: Platz ${h.eigener.platz} in der
        ${h.eigener.liga}. Liga, Ziel war Platz ${h.eigener.ziel.platz} - ${h.eigener.erreicht ? 'erreicht' : 'verfehlt'}.
        ${h.eigener.aufgestiegen ? 'Aufgestiegen!' : ''}${h.eigener.abgestiegen ? 'Abgestiegen.' : ''}</p>` : ''}
      ${h.eigener && h.tabellen ? `<div class="tabellenrahmen"><table><thead><tr><th>#</th><th class="links">Verein</th><th>Tore</th><th>Pkt</th></tr></thead>
        <tbody>${h.tabellen[h.eigener.liga].map((z, i) => `<tr class="${z.name === h.eigener.verein ? 'ich' : ''}">
          <td>${i + 1}</td><td class="links">${text(z.name)}</td><td>${z.tore}:${z.gegentore}</td><td><b>${z.punkte}</b></td></tr>`).join('')}</tbody></table></div>` : ''}
    </section>` : '';

  const hinweise = [];
  if (stand.termin.index === 0 && !v.sponsor && stand.sponsorAngebote.length) {
    hinweise.push('<p class="warnung-text">Noch kein Sponsor für diese Saison - <button class="klein" data-gehe="finanzen">zu den Finanzen</button></p>');
  }
  const entwicklung = (stand.entwicklungen || [])[0];
  if (entwicklung && stand.zuletzt && ['winterpause', 'saisonende'].includes(stand.zuletzt.art)) {
    const zaehlen = (passt) => entwicklung.spieler.filter(passt).length;
    hinweise.push(`<p id="entwicklungHinweis">Entwicklung zur ${entwicklung.anlass === 'Winterpause' ? 'Winterpause' : 'Saisonende'}:
      <span class="gut">${zaehlen((e) => e.nachher > e.vorher)} besser</span>, <span class="schlecht">${zaehlen((e) => e.nachher < e.vorher)} schlechter</span>
      - <button class="klein" data-gehe="kader" data-anker="entwicklung">ansehen</button></p>`);
  }
  if (stand.angebote.length) {
    hinweise.push(`<p>${stand.angebote.length} ${stand.angebote.length === 1 ? 'Angebot' : 'Angebote'} für deine Spieler - <button class="klein" data-gehe="transfer">ansehen</button></p>`);
  }

  inhalt.innerHTML = `
    ${stellen}
    ${bilanzHtml}
    <div class="zweispalten">
      <div>
        <section class="karte" id="naechsterTermin">
          <h2>Als Nächstes: ${text(n.titel)}</h2>
          <p>${n.spiel && n.spiel.gegner ? `${n.spiel.daheim ? 'Daheim gegen' : 'Auswärts bei'} <b>${text(n.spiel.gegner)}</b>`
            : n.spiel && n.spiel.frei ? 'Ohne dich - du bist nicht mehr dabei.' : n.art === 'saisonende' ? 'Die Saison wird abgeschlossen: Prämien, Auf- und Abstieg, Verträge, Jugend.'
              : n.art === 'vorbereitung' ? 'Die Saison beginnt mit dem Trainingslager.' : n.art === 'winterpause' ? 'Winterpause: frische Beine, und der Markt öffnet.' : ''}</p>
          <p class="unterzeile">${text(stand.fenster.text)}</p>
          ${stand.vorschau ? '<p><button class="klein" data-gehe="spieltag" data-spieltag="vorschau">Vorschau auf den Gegner</button></p>' : ''}
          ${hinweise.join('')}
        </section>

        <section class="karte" id="vorstand">
          <h2>Vorstand</h2>
          <p>Ziel: <b>${text(vorstand.ziel.text)}</b> - Platz ${vorstand.ziel.platz} oder besser.
            ${zeile && zeile.spiele ? `Heute Platz <b>${zeile.platz}</b>.` : ''}</p>
          ${balken(vertrauen, vertrauen < 30 ? 'tief' : vertrauen < 50 ? 'mittel' : '')}
          <p class="unterzeile">Vertrauen <b id="vertrauenWert">${vertrauen}</b> von 100. Unter 15 ist ab dem 8. Spieltag Schluss.</p>
        </section>

        <section id="postfach">
          <h2>Postfach</h2>
          ${nachTermin(stand.nachrichten.slice(0, 40)).map((g) => `<div class="termingruppe"><div class="datum">${text(g.datum)}</div>
            ${g.eintraege.map((m) => `<div class="nachricht nachricht-${m.art}">${text(m.text)}</div>`).join('')}</div>`).join('')
            || '<p class="unterzeile">Noch keine Post.</p>'}
        </section>
      </div>

      <div>
        <section>
          <h2>Kalender der Saison ${stand.saison}</h2>
          <div class="tabellenrahmen"><table id="kalender"><tbody>
            ${stand.kalender.map((t) => {
              const ergebnis = eigenesErgebnis(t.spiel);
              return `<tr data-termin="${t.index}" class="${t.index === stand.termin.index ? 'naechster' : t.erledigt ? 'erledigt' : ''}">
                <td class="links">${text(t.titel)}</td><td class="links">${eigenesSpielText(t.spiel)}</td>
                <td class="${ergebnis.klasse}">${ergebnis.text}</td></tr>`;
            }).join('')}
          </tbody></table></div>
        </section>

        ${stand.historie.length ? `<section id="chronik">
          <h2>Chronik</h2>
          <ul class="liste-einfach">${stand.historie.map((c) => `<li>Saison ${c.saison}: Meister ${text(c.meister[1])}, Pokal ${text(c.pokalsieger || '–')}
            ${c.eigener ? `<span class="leise"> · ${text(c.eigener.verein)} ${c.eigener.platz}. in Liga ${c.eigener.liga}</span>` : ''}</li>`).join('')}</ul>
        </section>` : ''}
      </div>
    </div>`;

  alle('[data-stelle]').forEach((knopf) => {
    knopf.addEventListener('click', async () => {
      const daten = await zug('stelle', { vereinId: knopf.dataset.stelle });
      if (daten.ok) {
        lage.elfLokal = null;
        uebernehmen(lage.stand);
        melden(`Neue Stelle bei ${lage.stand.verein.name}.`);
        zeichnen();
      }
    });
  });
}
