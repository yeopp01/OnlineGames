// @ts-check
// Der Kader: die Staerke auf einen Blick, alle Spieler mit Vertrag und Wert,
// die Entwicklungsberichte - und die Akte eines Spielers, die ein Klick auf
// seinen Namen oeffnet, gleich auf welchem Blatt.
import {
  alle, anfragen, ansicht, dialog, dialogZu, inhalt, lage, melden, nachPosition, spielerVon, zeichnen, zug,
} from './kern.js';
import {
  EINSCHAETZUNG, STUFEN, geld, jahre, namensknopf, note, rolleText, text, veraenderung,
} from './teile.js';

/** Die Stärke über die Saisons als kleine Linie, jeder Punkt mit Wert und Saison. */
function verlaufZeichnen(werte, saisons) {
  const breite = 320;
  const hoehe = 76;
  const rand = 18;
  const tief = Math.min(...werte) - 3;
  const hoch = Math.max(...werte) + 3;
  const x = (i) => rand + (i * (breite - 2 * rand)) / Math.max(1, werte.length - 1);
  const y = (w) => hoehe - 16 - ((w - tief) / (hoch - tief)) * (hoehe - 32);
  return `<svg class="verlauf" viewBox="0 0 ${breite} ${hoehe}" role="img" aria-label="Stärke über die Saisons">
    <polyline points="${werte.map((w, i) => `${x(i).toFixed(1)},${y(w).toFixed(1)}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="2" />
    ${werte.map((w, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(w).toFixed(1)}" r="3" fill="currentColor" />
      <text x="${x(i).toFixed(1)}" y="${(y(w) - 7).toFixed(1)}" text-anchor="middle">${w}</text>
      <text class="achse" x="${x(i).toFixed(1)}" y="${hoehe - 2}" text-anchor="middle">S${saisons[i]}</text>`).join('')}
  </svg>`;
}

/** Die Akte eines Spielers: Saison für Saison, jeder Wechsel, die laufende Saison. */
async function akteZeigen(id) {
  const daten = await anfragen(`/api/manager/spielstaende/${lage.kennung}/spieler/${id}`);
  const a = daten.spieler;
  if (!a) return;
  const summe = (feld) => a.stationen.reduce((s, x) => s + x[feld], 0) + a.saison[feld];
  const zeile = (x, laufend) => `<tr class="${laufend ? 'laufend' : ''}"><td>${x.saison}</td>
    <td class="links">${text(x.verein)}${laufend ? ' <small class="leise">laufend</small>' : ''}</td><td>${x.liga ?? '–'}</td>
    <td>${x.spiele}</td><td>${x.tore}</td><td>${x.vorlagen}</td><td>${note(x.note)}</td><td>${x.staerke}</td><td>${x.alter}</td></tr>`;
  dialog(`
    <h2 id="spielerakte">${text(a.name)}</h2>
    <p class="unterzeile">${rolleText(a)} · ${a.alter} Jahre · Stärke ${a.staerke} · Talent ${a.talent} · ${text(a.verein)}${a.liga ? ` (${a.liga}. Liga)` : ''}
      · Wert ${geld(a.wert)}${a.vertragBis ? ` · Vertrag bis Saison ${a.vertragBis}` : ''}${a.karriereende ? ' · <span class="schlecht">hört zum Saisonende auf</span>' : ''}</p>
    ${a.stationen.length ? verlaufZeichnen([...a.stationen.map((x) => x.staerke), a.staerke], [...a.stationen.map((x) => x.saison), a.saison.saison]) : ''}
    <div class="tabellenrahmen"><table id="stationen"><thead><tr><th>Saison</th><th class="links">Verein</th><th>Liga</th>
      <th>Sp</th><th>T</th><th>V</th><th>Note</th><th>St</th><th>Alt</th></tr></thead>
    <tbody>
      ${zeile({ ...a.saison, verein: a.verein, liga: a.liga, staerke: a.staerke, alter: a.alter }, true)}
      ${[...a.stationen].reverse().map((x) => zeile(x, false)).join('')}
    </tbody>
    <tfoot><tr><td></td><td class="links"><b>Zusammen</b></td><td></td><td><b>${summe('spiele')}</b></td><td><b>${summe('tore')}</b></td>
      <td><b>${summe('vorlagen')}</b></td><td></td><td></td><td></td></tr></tfoot></table></div>
    <h2 class="abstand">Wechsel</h2>
    ${a.wechsel.length ? `<ul class="liste-einfach" id="wechselAkte">${[...a.wechsel].reverse().map((w) => `<li>Saison ${w.saison} · ${text(w.datum)}:
      ${text(w.von)} → ${text(w.zu)}${w.abloese ? ` · ${geld(w.abloese)}` : ''}</li>`).join('')}</ul>`
    : '<p class="unterzeile" id="wechselAkte">Kein Wechsel aufgezeichnet.</p>'}
    <p class="unterzeile">Aufgezeichnet wird Saison für Saison seit dieser Fassung des Spiels. Wer in einer Saison wechselt, dessen Saison
      steht bei dem Verein, bei dem er sie beendet.</p>`);
}

// Ein Klick auf einen Namen zeigt die Akte - im Kader, im Markt, in der Vereinsansicht, in der Entwicklung.
document.addEventListener('click', (e) => {
  const knopf = e.target instanceof Element ? /** @type {HTMLElement | null} */ (e.target.closest('[data-akte]')) : null;
  if (knopf) akteZeigen(knopf.dataset.akte);
});

/** Die eigene Stärke auf einen Blick - und die des naechsten Gegners, wenn ein eigenes Spiel ansteht. */
function staerkeZeigen() {
  const { stand } = lage;
  const s = stand.verein.staerke;
  const v = stand.vorschau;
  const spalten = [['niveau', 'Kader'], ['torwart', 'Tor'], ['abwehr', 'Abwehr'], ['mittelfeld', 'Mittelfeld'], ['angriff', 'Angriff']];
  const werte = (niveau, teile) => spalten.map(([teil]) => (teil === 'niveau' ? niveau : teile[teil]));
  const eigen = werte(s.niveau, s.teile);
  const gegner = v ? werte(v.gegner.niveau, v.gegner.teile) : null;
  const zeile = (name, zellen) => `<tr><td class="links">${name}</td>${zellen.map((z) => `<td>${z}</td>`).join('')}</tr>`;
  const wo = v ? (v.neutral ? 'neutraler Platz' : v.daheim ? 'daheim' : 'auswärts') : '';
  return `<section id="staerke" class="karte">
    <h2>Stärke <span class="leise">Kader ${s.niveau} · Platz ${s.rang} von ${s.vereine} in der ${stand.verein.liga}. Liga</span></h2>
    <div class="tabellenrahmen"><table id="staerkeTabelle">
      <thead><tr><th class="links"></th>${spalten.map(([, name]) => `<th>${name}</th>`).join('')}</tr></thead>
      <tbody>
        ${zeile(`<b>${text(stand.verein.name)}</b>`, eigen.map((z) => `<b>${z}</b>`))}
        ${gegner ? zeile(text(v.gegner.name), gegner) : ''}
        ${gegner ? zeile('<span class="leise">Vorteil</span>', eigen.map((z, i) => veraenderung(z - gegner[i]))) : ''}
      </tbody>
    </table></div>
    <p class="unterzeile">${v ? `Nächster Gegner: ${text(v.titel)}, ${wo} - ${EINSCHAETZUNG[v.einschaetzung]}.
      <button class="klein" data-gehe="spieltag" data-spieltag="vorschau">zur Vorschau</button><br />` : 'Als Nächstes steht kein eigenes Spiel an. '}
      Kader ist der Schnitt der fünfzehn Besten; Tor bis Angriff bringt die Elf, die heute spielen würde - mit Tagesform, System
      und Eingeübtem, gerechnet wie im Spiel.</p>
  </section>`;
}

/** Die letzten Entwicklungsberichte: wer wie viel besser oder schlechter wurde, und nach welcher Regel. */
function entwicklungZeigen(berichte) {
  if (!berichte.length) {
    return `<section id="entwicklung" class="abstand"><h2>Entwicklung</h2>
      <p class="unterzeile">Zur Winterpause und am Saisonende entwickeln sich die Spieler. Dann steht hier, wer wie viel besser
        oder schlechter wurde - und warum.</p></section>`;
  }
  const wahl = Math.min(ansicht.entwicklung, berichte.length - 1);
  const b = berichte[wahl];
  const zaehlen = (passt) => b.spieler.filter(passt).length;
  return `<section id="entwicklung" class="abstand">
    <h2>Entwicklung <span class="leise">${text(b.anlass)} Saison ${b.saison} · Techniktraining ${b.technik} %</span></h2>
    ${berichte.length > 1 ? `<div class="umschalter breit">${berichte.map((x, i) => `<button class="reiterKnopf" data-entwicklung="${i}"
      aria-pressed="${i === wahl}">${text(x.anlass)} S${x.saison}</button>`).join('')}</div>` : ''}
    <p><span class="gut">${zaehlen((e) => e.nachher > e.vorher)} besser</span> · <span class="schlecht">${zaehlen((e) => e.nachher < e.vorher)} schlechter</span>
      · ${zaehlen((e) => e.nachher === e.vorher)} unverändert</p>
    <div class="tabellenrahmen"><table id="entwicklungsliste"><thead><tr>
      <th class="links">Pos</th><th class="links">Spieler</th><th>Alt</th><th>Tal</th><th title="Anteil an den möglichen Minuten">Spielzeit</th>
      <th>vorher</th><th>nachher</th><th>±</th><th class="links">Regel</th>
    </tr></thead><tbody>
    ${b.spieler.map((e) => `<tr data-entwickelt="${e.id}" class="${spielerVon(e.id) ? '' : 'leise'}">
      <td class="links">${text(e.rolle || '')}</td>
      <td class="links">${spielerVon(e.id) ? namensknopf(e.id, e.name) : `${text(e.name)} <small class="marke">nicht mehr da</small>`}</td>
      <td>${e.alter}</td><td class="leise">${e.talent}</td><td>${e.spielanteil} %</td>
      <td>${e.vorher}</td><td><b>${e.nachher}</b></td><td>${veraenderung(e.nachher - e.vorher)}</td>
      <td class="links leise">${STUFEN[e.stufe] || ''}</td>
    </tr>`).join('')}
    </tbody></table></div>
    <p class="unterzeile">So wird gerechnet: bis 20 wächst ein Spieler um 20 bis 50 % des Abstands zu seinem Talent - je mehr er spielt und
      je mehr Technik trainiert wird, desto mehr; von 21 bis 24 um 10 bis 32 %. Von 25 bis 28 bleibt er etwa, wie er ist, mit viel
      Techniktraining und Luft zum Talent einen Punkt besser. Von 29 bis 31 verliert er 1 bis 3 Punkte, ab 32 2 bis 5. Zur Winterpause
      kommen 40 % davon, am Saisonende der Rest; über sein Talent wächst keiner. Spielzeit zählt voll ab 60 % der möglichen Minuten.
      Das Alter ist das während der Saison - danach ist jeder ein Jahr älter, und ab 29 sinkt das Talent um zwei.</p>
  </section>`;
}

export function blattKader() {
  const { stand } = lage;
  const v = stand.verein;
  const spieler = v.spieler.slice().sort(nachPosition);
  const berichte = stand.entwicklungen || [];
  const zuletzt = new Map((berichte[0]?.spieler || []).map((e) => [e.id, e.nachher - e.vorher]));
  inhalt.innerHTML = `
    ${staerkeZeigen()}
    <section>
      <h2>Kader <span class="leise">${v.spieler.length} Spieler · Gehälter ${geld(v.gehaltJahr)} im Jahr ·
        Kaderwert ${geld(v.spieler.reduce((s, x) => s + x.wert, 0))}</span></h2>
      <div class="tabellenrahmen">
        <table id="kader"><thead><tr>
          <th class="links">Pos</th><th class="links">Spieler</th><th>Alt</th><th>St</th>
          <th title="Veränderung bei der letzten Entwicklung">±</th><th>Tal</th><th>Kon</th><th>Mor</th>
          <th>Sp</th><th>T</th><th>V</th><th>Note</th><th>Vertrag</th><th>Gehalt</th><th>Wert</th><th class="links"></th>
        </tr></thead><tbody>
        ${spieler.map((s) => `<tr data-spieler="${s.id}" class="${s.bereit ? '' : 'leise'}">
          <td class="links">${rolleText(s)}</td>
          <td class="links">${namensknopf(s.id, s.name)}${s.ausfall ? ` <small class="schlecht">${text(s.ausfall)}</small>` : ''}${s.jugend && s.alter <= 19 ? ' <small class="marke">Jugend</small>' : ''}${s.transferliste ? ' <small class="marke">Liste</small>' : ''}${s.karriereende ? ' <small class="marke ende">hört auf</small>' : ''}</td>
          <td>${s.alter}</td><td><b>${s.staerke}</b></td><td>${zuletzt.has(s.id) ? veraenderung(zuletzt.get(s.id)) : ''}</td>
          <td class="leise">${s.talent}</td>
          <td class="${s.kondition < 70 ? 'schlecht' : ''}">${s.kondition}</td><td>${s.moral}</td>
          <td>${s.saison.spiele}</td><td>${s.saison.tore}</td><td>${s.saison.vorlagen}</td><td>${note(s.saison.note)}</td>
          <td class="vertrag ${s.vertrag && s.vertrag.bis <= stand.saison ? 'schlecht' : ''}">${s.vertrag ? `bis ${s.vertrag.bis}` : '–'}</td>
          <td>${geld(s.vertrag ? s.vertrag.gehalt : 0)}</td><td>${geld(s.wert)}</td>
          <td class="aktionen">
            <button data-liste="${s.id}" class="${s.transferliste ? 'an' : ''}">${s.transferliste ? 'von der Liste' : 'auf die Liste'}</button>
            <button data-freistellen="${s.id}" class="leise">freistellen</button>
            ${s.verlaengerbar ? `<button data-verlaengern="${s.id}">verlängern</button>` : ''}
          </td>
        </tr>`).join('')}
        </tbody></table>
      </div>
      <p class="unterzeile">Rot: der Vertrag endet mit dieser Saison, danach ist der Spieler weg. Verlängert wird ab dem vorletzten Jahr,
        zum Gehalt, das der Spieler nennt. Wer auf der Liste steht, bekommt öfter Angebote. Freistellen kostet die Hälfte der restlichen Gehälter.
        ± ist die Veränderung bei der letzten Entwicklung.</p>
    </section>
    ${entwicklungZeigen(berichte)}`;

  alle('[data-entwicklung]').forEach((knopf) => {
    knopf.addEventListener('click', () => { ansicht.entwicklung = Number(knopf.dataset.entwicklung); zeichnen(); });
  });

  alle('[data-verlaengern]').forEach((knopf) => {
    knopf.addEventListener('click', () => verlaengernDialog(spielerVon(knopf.dataset.verlaengern)));
  });
  alle('[data-liste]').forEach((knopf) => {
    knopf.addEventListener('click', async () => {
      const s = spielerVon(knopf.dataset.liste);
      await zug('transferliste', { spielerId: s.id, an: !s.transferliste });
      zeichnen();
    });
  });
  alle('[data-freistellen]').forEach((knopf) => {
    knopf.addEventListener('click', async () => {
      const s = spielerVon(knopf.dataset.freistellen);
      if (!knopf.classList.contains('warnung')) {
        knopf.classList.add('warnung');
        knopf.textContent = `wirklich? ${geld(s.abfindung)} Abfindung`;
        return;
      }
      const daten = await zug('freistellen', { spielerId: s.id });
      if (daten.ok) melden(`${s.name} ist freigestellt.`);
      zeichnen();
    });
  });
}

function verlaengernDialog(s) {
  const ab = Math.max(s.vertrag.bis, lage.stand.saison);
  dialog(`
    <h2>${text(s.name)} verlängern</h2>
    <p>${rolleText(s)}, ${s.alter} Jahre, Stärke ${s.staerke}. Vertrag bis Saison ${s.vertrag.bis}, bisher ${geld(s.vertrag.gehalt)} im Jahr.</p>
    <p>Er will <b>${geld(s.gehaltswunsch)}</b> im Jahr. Wie lange?</p>
    <div class="reihe">${Array.from({ length: s.laufzeitMax }, (_, i) => i + 1)
      .map((j) => `<button class="haupt" data-laufzeit="${j}">${jahre(j)} · bis Saison ${ab + j}</button>`).join('')}</div>`,
  (huelle) => alle('[data-laufzeit]', huelle).forEach((knopf) => knopf.addEventListener('click', async () => {
    const daten = await zug('verlaengern', { spielerId: s.id, laufzeit: Number(knopf.dataset.laufzeit) });
    if (!daten.ok) return;
    dialogZu();
    melden(`${s.name} verlängert bis Saison ${daten.bis}.`);
    zeichnen();
  })));
}
