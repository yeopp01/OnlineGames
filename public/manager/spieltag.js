// @ts-check
// Der Spieltag: die Vorschau auf das naechste eigene Spiel und der Bericht
// vom letzten Termin, mit dem Ticker des eigenen Spiels.
import {
  $, alle, ansicht, inhalt, lage, zeichnen,
} from './kern.js';
import {
  EINSCHAETZUNG, note, text, zahl,
} from './teile.js';
import { vereinAnsehen } from './liga.js';

// Zeichen für den Ticker als kleine Formen statt Emoji: Emoji sehen auf jedem
// System anders aus, unter Windows wird aus dem Ball ein Globus.
const BALL = '<svg class="ball" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#fbfbf8" stroke="#1c2128" stroke-width="2"/>'
  + '<path d="M16 8l6 4.4-2.3 7H12.3l-2.3-7z" fill="#1c2128"/></svg>';
const ZEICHEN = {
  tor: BALL,
  gelb: '<i class="kartenzeichen gelb"></i>',
  gelbrot: '<i class="kartenzeichen gelb"></i><i class="kartenzeichen rot dahinter"></i>',
  rot: '<i class="kartenzeichen rot"></i>',
  verletzung: '<b class="kreuz">+</b>',
  wechsel: '<b class="pfeile">⇄</b>',
  elfmeter: '<b class="gut">✓</b>',
  'elfmeter-vergeben': '<b class="schlecht">✗</b>',
};

function paarungZeile(p) {
  let zusatz = '';
  if (p.elfmeter) zusatz = ` <small>i.E. ${p.elfmeter[0]}:${p.elfmeter[1]}</small>`;
  else if (p.verlaengerung) zusatz = ' <small>n.V.</small>';
  return `<div class="paarung ${p.eigenes ? 'eigenes' : ''}">
    <span class="heim ${p.sieger && p.sieger === p.heim ? 'sieger' : ''}">${text(p.heimName)}</span>
    <span class="stand">${p.tore ? `${p.tore[0]} : ${p.tore[1]}` : '–'}${zusatz}</span>
    <span class="${p.sieger && p.sieger === p.gast ? 'sieger' : ''}">${text(p.gastName)}</span>
  </div>`;
}

function tickerZeile(e, spiel) {
  if (e.marke) return `<div class="t-marke"><span class="minute"></span>${text(e.marke)}</div>`;
  const verein = e.verein === spiel.heim.id ? spiel.heim.name : spiel.gast.name;
  let was = text(e.spieler);
  if (e.art === 'tor' && e.vorlage) was += ` <span class="leise">Vorlage ${text(e.vorlage)}</span>`;
  if (e.art === 'wechsel') {
    was = `${text(e.rein)} <span class="leise">für</span> ${text(e.spieler)}${e.grund === 'verletzung' ? ' <span class="leise">(verletzt)</span>' : ''}`;
  }
  if (e.art === 'verletzung') was += ` <span class="leise">${e.dauer === 1 ? 'eine Woche' : `${e.dauer} Wochen`}</span>`;
  const minute = e.minute > 120 ? '' : `${e.minute}'`;
  return `<div class="t-${e.art}"><span class="minute">${minute}</span><span class="zeichen">${ZEICHEN[e.art] || '•'}</span>${was}
    <span class="leise">(${text(verein)})</span></div>`;
}

// Anpfiff, Halbzeit und Abpfiff zwischen die Ereignisse, mit dem Stand zu dem Zeitpunkt.
function tickerFolge(spiel) {
  const folge = [{ marke: 'Anpfiff' }];
  const stand = [0, 0];
  const mitStand = (marke) => ({ marke: `${marke} · ${stand[0]} : ${stand[1]}` });
  const schritte = [
    { ab: 46, marke: () => mitStand('Halbzeit') },
    { ab: 91, marke: () => mitStand(spiel.verlaengerung ? 'Nach 90 Minuten' : 'Abpfiff') },
    { ab: 121, marke: () => mitStand(spiel.elfmeter ? 'Nach Verlängerung' : 'Abpfiff nach Verlängerung') },
  ].slice(0, spiel.verlaengerung ? 3 : 2);
  let naechster = 0;
  const bis = (minute) => {
    while (naechster < schritte.length && minute >= schritte[naechster].ab) folge.push(schritte[naechster++].marke());
  };
  let elfer = false;
  for (const e of spiel.ereignisse || []) {
    bis(e.minute);
    if (e.minute > 120 && !elfer) {
      folge.push({ marke: 'Elfmeterschießen' });
      elfer = true;
    }
    folge.push(e);
    if (e.art === 'tor') stand[e.verein === spiel.heim.id ? 0 : 1] += 1;
  }
  bis(Infinity);
  if (spiel.elfmeter) folge.push({ marke: `Abpfiff · ${spiel.elfmeter[0]} : ${spiel.elfmeter[1]} im Elfmeterschießen` });
  return folge;
}

function berichtZeigen(b) {
  const e = b.eigenes;
  let html = `<h2>${text(b.titel)}</h2>`;
  if (b.art === 'vorbereitung' || b.art === 'winterpause') html += `<p class="unterzeile">${text(b.text)}</p>`;
  if (b.art === 'saisonende') html += '<p class="unterzeile">Die Saison ist vorbei - die Bilanz steht im Büro.</p>';
  if (b.art === 'pokal' && !e) html += '<p class="unterzeile">Ohne dich.</p>';
  if (e) {
    let zusatz = '';
    if (e.elfmeter) zusatz = `n.V., ${e.elfmeter[0]}:${e.elfmeter[1]} im Elfmeterschießen · `;
    else if (e.verlaengerung) zusatz = 'nach Verlängerung · ';
    html += `
      <div class="ergebnis">
        <div class="leise">${e.wettbewerb === 'pokal' ? 'Pokal' : 'Liga'} · ${e.zuschauer ? `${zahl(e.zuschauer)} Zuschauer` : 'neutraler Platz'}</div>
        <div class="wer">
          <strong>${text(e.heim.name)}</strong>
          <span class="stand" id="standAnzeige">${e.tore[0]} : ${e.tore[1]}</span>
          <strong>${text(e.gast.name)}</strong>
        </div>
        <div class="leise">${zusatz}Chancen ${e.chancen[0]} : ${e.chancen[1]} · Besitz ${e.besitz[0]} % : ${e.besitz[1]} %</div>
        <div class="ticker" id="ticker"></div>
      </div>
      <div class="zweispalten aufstellungen">
        ${['heim', 'gast'].map((seite) => `<section>
          <h2>${text(e[seite].name)} <span class="leise">${e.taktik[seite].system}</span></h2>
          <table><thead><tr><th class="links">Pos</th><th class="links">Spieler</th><th>Min</th><th>Note</th></tr></thead>
          <tbody>${[...e.aufstellung[seite].elf, ...e.aufstellung[seite].bank.filter((p) => p.minuten > 0)].map((p) => `<tr>
            <td class="links">${p.platz || p.position}${p.platz && p.rolle && p.rolle !== p.platz ? ` <small class="leise">${p.rolle}</small>` : ''}</td>
            <td class="links">${text(p.name)}</td><td>${p.minuten}</td>
            <td class="${p.note !== null && p.note <= 2 ? 'gut' : p.note >= 5 ? 'schlecht' : ''}">${note(p.note)}</td></tr>`).join('')}</tbody></table>
        </section>`).join('')}
      </div>`;
  }
  if (b.art === 'liga') {
    html += `<div class="zweispalten">${[1, 2].map((n) => `<section><h2>${n}. Liga</h2>${b.ligen[n].map(paarungZeile).join('')}</section>`).join('')}</div>`;
  }
  if (b.art === 'pokal') html += `<section class="abstand"><h2>Pokal, ${text(b.name)}</h2>${b.paarungen.map(paarungZeile).join('')}</section>`;
  return html;
}

const TEILE = [['torwart', 'Torwart'], ['abwehr', 'Abwehr'], ['mittelfeld', 'Mittelfeld'], ['angriff', 'Angriff']];
const AUSGANG = { S: 'Sieg', U: 'Unentschieden', N: 'Niederlage' };

function vorschauZeigen(v) {
  const wo = v.neutral ? 'neutraler Platz' : v.daheim ? 'daheim' : 'auswärts';
  const verein = (s, seite) => `<div class="verein ${seite}">
      <b>${text(s.name)}</b>
      <small>${s.platz ? `Platz ${s.platz} · ${s.punkte} Pkt` : `${s.liga}. Liga`} · Kader ${s.niveau} · ${s.system}</small>
      ${s.form.length ? `<span class="form" title="die letzten Ligaspiele, das jüngste rechts">${s.form.map((f) => `<i class="form-${f}" title="${AUSGANG[f]}">${f}</i>`).join('')}</span>`
    : '<small class="leise">noch kein Ligaspiel</small>'}
    </div>`;
  // Die Balken beginnen bei 40: darunter spielt niemand, und fuenf Punkte Unterschied sollen zu sehen sein.
  const breite = (wert) => Math.max(4, Math.min(100, ((wert - 40) / 50) * 100));
  const vergleich = TEILE.map(([teil, name]) => {
    const [a, b] = [v.eigen.teile[teil], v.gegner.teile[teil]];
    return `<div class="zeile" data-teil="${teil}">
      <b class="${a > b ? 'gut' : ''}">${a}</b>
      <div class="balken-links"><div class="${a >= b ? 'vorn' : ''}" style="width:${breite(a)}%"></div></div>
      <span>${name}</span>
      <div class="balken-rechts"><div class="${b >= a ? 'vorn' : ''}" style="width:${breite(b)}%"></div></div>
      <b class="${b > a ? 'schlecht' : ''}">${b}</b>
    </div>`;
  }).join('');
  const ausfaelle = (s) => (s.ausfaelle.length
    ? s.ausfaelle.map((x) => `${text(x.name)} <span class="leise">(${x.rolle || x.position}, ${text(x.grund)})</span>`).join(', ')
    : '<span class="leise">niemand</span>');
  const bisher = v.bisher.map((b) => `${text(b.titel)} ${b.daheim ? 'H' : 'A'}
    <b class="${b.ausgang === 'S' ? 'gut' : b.ausgang === 'N' ? 'schlecht' : ''}">${b.tore[0]}:${b.tore[1]}${b.elfmeter ? ` i.E. ${b.elfmeter[0]}:${b.elfmeter[1]}` : b.verlaengerung ? ' n.V.' : ''}</b>`).join(' · ');
  return `<section id="vorschau" class="karte vorschau">
    <h2>${text(v.titel)} <span class="leise">· ${wo}</span></h2>
    <div class="gegenueber">${verein(v.eigen, 'links')}<div class="einschaetzung ${v.einschaetzung}">${EINSCHAETZUNG[v.einschaetzung]}</div>${verein(v.gegner, 'rechts')}</div>
    <div class="vergleich">${vergleich}</div>
    <p class="unterzeile">Die Elf, die heute spielen würde - mit Tagesform, System und Eingeübtem, ohne Heimvorteil und Taktik.
      Das Mittelfeld teilt die Chancen, Angriff gegen Abwehr und Torwart entscheidet, was daraus wird.</p>
    <p id="bisher">${v.bisher.length ? `Bisher: ${bisher}` : '<span class="leise">In dieser Saison noch nicht gegeneinander gespielt.</span>'}</p>
    <p class="ausfaelle">Es fehlen bei dir: ${ausfaelle(v.eigen)}<br />bei ${text(v.gegner.name)}: ${ausfaelle(v.gegner)}</p>
    <div class="reihe">
      <button class="klein" data-gehe="mannschaft">zur Aufstellung</button>
      <button class="klein" data-verein-ansehen="${v.gegner.id}">Kader von ${text(v.gegner.name)}</button>
    </div>
  </section>`;
}

export function blattSpieltag() {
  const b = lage.stand.zuletzt;
  const v = lage.stand.vorschau;
  if (!b && !v) {
    inhalt.innerHTML = '<p class="unterzeile">Noch nichts gespielt. Oben auf Weiter.</p>';
    return;
  }
  const zeigt = !b ? 'vorschau' : !v ? 'bericht' : ansicht.spieltag;
  const umschalter = b && v ? `<div class="umschalter breit">
      <button class="reiterKnopf" data-spieltag-wahl="vorschau" aria-pressed="${zeigt === 'vorschau'}">Vorschau · ${text(v.titel)}</button>
      <button class="reiterKnopf" data-spieltag-wahl="bericht" aria-pressed="${zeigt === 'bericht'}">Bericht · ${text(b.titel)}</button>
    </div>` : '';
  inhalt.innerHTML = umschalter + (zeigt === 'vorschau' ? vorschauZeigen(v) : berichtZeigen(b));
  alle('[data-spieltag-wahl]').forEach((knopf) => {
    knopf.addEventListener('click', () => { ansicht.spieltag = knopf.dataset.spieltagWahl; zeichnen(); });
  });
  alle('[data-verein-ansehen]').forEach((knopf) => {
    knopf.addEventListener('click', () => vereinAnsehen(knopf.dataset.vereinAnsehen));
  });
  if (zeigt === 'bericht' && b.eigenes) tickerZeigen(b.eigenes, Number(/** @type {HTMLSelectElement} */ ($('tempo')).value));
}

// Der Ticker laeuft die Ereignisse des eigenen Spiels ab. Er ist Zierde, keine
// Rechnung - das Ergebnis steht laengst fest, deshalb darf man ihn jederzeit
// abbrechen.
function tickerZeigen(spiel, tempo) {
  const kasten = $('ticker');
  if (!kasten) return;
  const ereignisse = tickerFolge(spiel);
  clearInterval(lage.tickerUhr);
  const anzeige = () => document.getElementById('standAnzeige');
  const schreiben = (was) => { const el = anzeige(); if (el) el.textContent = was; };
  if (!tempo) {
    kasten.innerHTML = ereignisse.map((e) => tickerZeile(e, spiel)).join('');
    schreiben(`${spiel.tore[0]} : ${spiel.tore[1]}`);
    return;
  }
  kasten.innerHTML = '';
  let i = 0;
  let stehen = [0, 0];
  schreiben('0 : 0');
  lage.tickerUhr = setInterval(() => {
    if (!kasten.isConnected || !anzeige() || i >= ereignisse.length) {
      clearInterval(lage.tickerUhr);
      schreiben(`${spiel.tore[0]} : ${spiel.tore[1]}`);
      return;
    }
    const e = ereignisse[i++];
    if (e.art === 'tor') {
      stehen = e.verein === spiel.heim.id ? [stehen[0] + 1, stehen[1]] : [stehen[0], stehen[1] + 1];
      schreiben(`${stehen[0]} : ${stehen[1]}`);
    }
    kasten.insertAdjacentHTML('beforeend', tickerZeile(e, spiel));
  }, tempo / Math.max(4, ereignisse.length));
}
