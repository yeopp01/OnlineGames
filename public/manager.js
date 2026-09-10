'use strict';

// Die Oberflaeche des Managerspiels. Sie zeigt und fragt - gerechnet wird auf
// dem Server (→ docs/adr/0001-server-rechnet.md). Jede Antwort bringt den
// ganzen Zustand mit, deshalb haelt der Browser nichts nach, was der Server
// nicht bestaetigt hat.

const $ = (id) => document.getElementById(id);
const inhalt = $('inhalt');

const POSITIONEN = ['TOR', 'ABW', 'MIT', 'ANG'];
const TEILNAMEN = { TOR: 'Torwart', ABW: 'Abwehr', MIT: 'Mittelfeld', ANG: 'Angriff' };
// Zu welchem Mannschaftsteil ein Platz gehoert - dieselbe Zuordnung wie auf dem Server.
const TEIL = {
  TW: 'TOR', LV: 'ABW', IV: 'ABW', RV: 'ABW', DM: 'MIT', LM: 'MIT', ZM: 'MIT', RM: 'MIT', OM: 'MIT', LA: 'ANG', ST: 'ANG', RA: 'ANG',
};
const SCHWERPUNKTE = {
  keiner: 'kein Schwerpunkt',
  system: 'System einspielen',
  pressing: 'Pressing ueben',
  abwehr: 'Abwehr ueben',
  angriff: 'Angriff ueben',
};
const POSTEN = {
  zuschauer: 'Zuschauer',
  fernsehen: 'Fernsehgeld',
  sponsor: 'Sponsor',
  praemien: 'Praemien',
  transfers: 'Transfers',
  gehaelter: 'Gehaelter',
  stadion: 'Stadionausbau',
  abfindungen: 'Abfindungen',
  zinsen: 'Zinsen',
};

let kennung = null;     // Kennung des offenen Spielstands
let stand = null;       // letzter Zustand vom Server
let blatt = 'buero';
let elfLokal = null;    // die Elf, an der gerade gearbeitet wird
let markt = null;       // die Marktliste, nur bei Bedarf geholt
let laeuft = false;     // waehrend eines Termins: keine zweite Anfrage
const ansicht = {
  liga: null,
  markt: { position: '', liga: '', maxAlter: '', minStaerke: '', bezahlbar: false, sortierung: 'staerke', anzahl: 60 },
  // Vorschau auf das naechste Spiel oder Bericht vom letzten - nach "Weiter" der Bericht.
  spieltag: 'vorschau',
  // Welcher der letzten Entwicklungsberichte im Kaderblatt steht - 0 ist der neueste.
  entwicklung: 0,
};

// Nach welcher Regel ein Spieler sich entwickelt hat - dieselben Stufen wie kader.entwickeln.
const STUFEN = {
  jung: 'bis 20: waechst auf sein Talent zu',
  reifend: '21 bis 24: waechst noch, langsamer',
  bestes: '25 bis 28: bleibt, wie er ist',
  nachlassend: '29 bis 31: baut ab',
  alt: 'ab 32: baut deutlich ab',
};

// --------------------------------------------------------------- Werkzeug

function text(wert) {
  return String(wert ?? '').replace(/[&<>"]/g, (z) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
  }[z]));
}

// Betraege stehen in Tausend. Ueber tausend wird daraus eine Million -
// "12,4 Mio" liest sich schneller als "12400".
function geld(tausend) {
  if (tausend === null || tausend === undefined) return '–';
  const zahl = Math.round(tausend);
  if (Math.abs(zahl) >= 1000) return `${(zahl / 1000).toFixed(1).replace('.', ',')} Mio`;
  return `${zahl} T`;
}

const zahl = (wert) => Number(wert).toLocaleString('de-DE');
const note = (wert) => (wert === null || wert === undefined ? '–' : Number(wert).toFixed(1).replace('.', ','));
const jahre = (anzahl) => `${anzahl} ${anzahl === 1 ? 'Jahr' : 'Jahre'}`;

function melden(nachricht, schlimm = false) {
  const kasten = $('meldung');
  kasten.textContent = nachricht;
  kasten.classList.toggle('schlimm', schlimm);
  kasten.hidden = false;
  clearTimeout(melden.uhr);
  melden.uhr = setTimeout(() => { kasten.hidden = true; }, schlimm ? 7000 : 4000);
}

function zeigen(welcher) {
  for (const teil of ['anmeldung', 'start', 'spiel']) $(teil).hidden = teil !== welcher;
}

async function anfragen(pfad, { methode = 'GET', koerper } = {}) {
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
  const daten = await antwort.json().catch(() => ({ fehler: 'Unverstaendliche Antwort.' }));
  if (antwort.status === 401) {
    zeigen('anmeldung');
    return daten;
  }
  if (daten.zustand) uebernehmen(daten.zustand);
  if (daten.fehler) melden(daten.fehler, true);
  return daten;
}

const zug = (was, koerper = {}) => anfragen(`/api/manager/spielstaende/${kennung}/${was}`, { methode: 'POST', koerper });

function uebernehmen(neu) {
  const vorher = stand;
  stand = neu;
  if (!stand.verein) return;
  const merk = stand.verein.aufstellung;
  const anderer = !vorher || vorher.termin.index !== stand.termin.index || vorher.saison !== stand.saison
    || vorher.verein?.id !== stand.verein.id;
  if (anderer || !elfLokal || elfLokal.some((id) => !spielerVon(id))) {
    elfLokal = merk ? [...merk.ids] : besteElf();
  }
}

function dialog(html, binden) {
  const huelle = $('dialog');
  huelle.querySelector('.dialog-inhalt').innerHTML = html;
  huelle.hidden = false;
  if (binden) binden(huelle);
}

function dialogZu() {
  $('dialog').hidden = true;
}

// ---------------------------------------------------------- Anmeldung

$('formAnmelden').addEventListener('submit', async (e) => {
  e.preventDefault();
  const hinweis = $('anmeldeMeldung');
  hinweis.hidden = true;
  const antwort = await fetch('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: $('anEmail').value.trim(), password: $('anKennwort').value }),
  }).catch(() => null);
  if (!antwort || !antwort.ok) {
    const daten = antwort ? await antwort.json().catch(() => ({})) : {};
    // Nie verraten, welcher Teil falsch war.
    hinweis.textContent = daten.message || 'Mailadresse oder Kennwort stimmen nicht.';
    hinweis.hidden = false;
    return;
  }
  await startseite();
});

$('abmelden').addEventListener('click', async () => {
  await fetch('/api/auth/sign-out', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => null);
  zeigen('anmeldung');
});

// ---------------------------------------------------------- Startseite

// Wer angemeldet ist, bekommt seine Spielstaende samt Namen; wer nicht, eine
// 401 - dann zeigt `anfragen` die Anmeldemaske. Eine eigene Frage nach der
// Sitzung braeuchte es nicht, und sie zaehlte gegen die Grenzen der Anmeldung.
async function startseite() {
  kennung = null;
  stand = null;
  const daten = await anfragen('/api/manager/spielstaende');
  if (!daten.spielstaende) return;
  $('werName').textContent = daten.konto.name;
  zeigen('start');
  const liste = daten.spielstaende;
  $('spielstaende').innerHTML = liste.length
    ? liste.map((s) => `
      <div class="spielstand" data-spielstand="${s.id}">
        <div><b>${text(s.name)}</b>
          <small>${text(s.verein)} · ${s.liga}. Liga · Saison ${s.saison} · ${text(s.datum)}
            ${s.ladbar ? '' : ' · <span class="schlecht">aus einer anderen Fassung</span>'}</small></div>
        <button data-fortsetzen="${s.id}" class="haupt" ${s.ladbar ? '' : 'disabled'}>Fortsetzen</button>
        <button data-loeschen="${s.id}" class="leise">Loeschen</button>
      </div>`).join('')
    : '<p class="unterzeile">Noch kein Spielstand. Unten faengt eine Karriere an.</p>';
  $('spielstaende').querySelectorAll('[data-fortsetzen]').forEach((knopf) => {
    knopf.addEventListener('click', () => oeffnen(knopf.dataset.fortsetzen));
  });
  $('spielstaende').querySelectorAll('[data-loeschen]').forEach((knopf) => {
    knopf.addEventListener('click', async () => {
      // Zweimal klicken statt eines Browser-Dialogs: der blockiert die Seite.
      if (!knopf.classList.contains('warnung')) {
        knopf.classList.add('warnung');
        knopf.textContent = 'Wirklich loeschen?';
        return;
      }
      await anfragen(`/api/manager/spielstaende/${knopf.dataset.loeschen}`, { methode: 'DELETE' });
      startseite();
    });
  });
  $('neuHinweis').textContent = liste.length >= 5 ? 'Fuenf Spielstaende sind das Hoechste - loesche einen, um neu anzufangen.' : '';
  if (!$('vereinswahl').children.length) vereineZeigen();
}

async function vereineZeigen() {
  const startwert = Number($('startwert').value.trim());
  if (!Number.isInteger(startwert)) return melden('Der Startwert muss eine ganze Zahl sein.', true);
  const daten = await anfragen(`/api/manager/vereine?startwert=${startwert}`);
  if (!daten.vereine) return;
  const karte = (v) => `
    <button class="vereinskarte" data-verein="${v.id}">
      <b>${text(v.name)}</b>
      <small>Kader ${v.niveau} · erwartet Platz ${v.erwartet}</small>
      <small>Konto ${geld(v.konto)} · ${zahl(v.plaetze)} Plaetze · Kaderwert ${geld(v.kaderwert)}</small>
    </button>`;
  $('vereinswahl').innerHTML = [1, 2].map((nummer) => `
    <section>
      <h2>${nummer}. Liga</h2>
      <div class="vereinsliste">${daten.vereine.filter((v) => v.liga === nummer).sort((a, b) => a.erwartet - b.erwartet).map(karte).join('')}</div>
    </section>`).join('');
  $('vereinswahl').querySelectorAll('[data-verein]').forEach((knopf) => {
    knopf.addEventListener('click', () => anlegen(startwert, knopf.dataset.verein));
  });
}

async function anlegen(startwert, vereinId) {
  const daten = await anfragen('/api/manager/spielstaende', {
    methode: 'POST', koerper: { startwert, vereinId, name: $('neuName').value.trim() },
  });
  if (!daten.id) return;
  kennung = daten.id;
  blatt = 'buero';
  markt = null;
  zeigen('spiel');
  zeichnen();
}

async function oeffnen(id) {
  kennung = id;
  stand = null;
  elfLokal = null;
  markt = null;
  blatt = 'buero';
  const daten = await anfragen(`/api/manager/spielstaende/${id}`);
  if (!daten.zustand) {
    kennung = null;
    return startseite();
  }
  zeigen('spiel');
  zeichnen();
}

$('vereineLaden').addEventListener('click', vereineZeigen);
$('zurStart').addEventListener('click', startseite);

// ------------------------------------------------------------ Weiter

async function weiter() {
  if (laeuft || !stand || stand.status !== 'laeuft') return;
  laeuft = true;
  kopfZeichnen();
  $('lauf').textContent = 'rechnet ...';
  const begonnen = performance.now();
  const daten = await zug('weiter');
  laeuft = false;
  $('lauf').textContent = daten.fehler ? '' : `${Math.round(performance.now() - begonnen)} ms`;
  markt = null;
  if (daten.bericht) {
    if (['winterpause', 'saisonende'].includes(daten.bericht.art)) ansicht.entwicklung = 0;
    if (daten.bericht.art === 'saisonende') blatt = 'buero';
    else if (daten.bericht.eigenes) {
      blatt = 'spieltag';
      ansicht.spieltag = 'bericht';
    }
  }
  if (stand.status === 'entlassen') {
    blatt = 'buero';
    melden('Der Vorstand hat dich entlassen. Im Buero warten drei Angebote.', true);
  }
  zeichnen();
}

async function vorspulen(bis) {
  if (laeuft || !stand || stand.status !== 'laeuft') return;
  laeuft = true;
  kopfZeichnen();
  $('lauf').textContent = 'rechnet ...';
  const begonnen = performance.now();
  const daten = await zug('vorspulen', { bis });
  laeuft = false;
  $('lauf').textContent = daten.fehler ? '' : `${daten.gerechnet} Termine in ${Math.round(performance.now() - begonnen)} ms`;
  markt = null;
  blatt = 'buero';
  if (stand.status === 'entlassen') melden('Der Vorstand hat dich entlassen. Im Buero warten drei Angebote.', true);
  zeichnen();
}

$('weiter').addEventListener('click', weiter);
$('vorWinter').addEventListener('click', () => vorspulen('winterpause'));
$('vorEnde').addEventListener('click', () => vorspulen('saisonende'));

// ---------------------------------------------------------------- Buero

function eigenesSpielText(spiel) {
  if (!spiel) return '–';
  if (spiel.offen) return 'noch nicht ausgelost';
  if (spiel.frei) return 'nicht dabei';
  return `${spiel.daheim ? 'H' : 'A'} · ${text(spiel.gegner)}`;
}

// Postfach und Buch nach Termin: das Datum einmal als Zwischenzeile statt vor jeder Zeile.
function nachTermin(liste) {
  const gruppen = [];
  for (const eintrag of liste) {
    const datum = `Saison ${eintrag.saison} · ${eintrag.datum}`;
    if (gruppen.at(-1)?.datum === datum) gruppen.at(-1).eintraege.push(eintrag);
    else gruppen.push({ datum, eintraege: [eintrag] });
  }
  return gruppen;
}

function eigenesErgebnis(spiel) {
  if (!spiel || !spiel.tore) return { text: '', klasse: '' };
  const [eigene, fremde] = spiel.daheim ? spiel.tore : [spiel.tore[1], spiel.tore[0]];
  let zusatz = spiel.verlaengerung ? ' n.V.' : '';
  if (spiel.elfmeter) {
    const [ie, ifr] = spiel.daheim ? spiel.elfmeter : [spiel.elfmeter[1], spiel.elfmeter[0]];
    zusatz = ` i.E. ${ie}:${ifr}`;
  }
  const gewonnen = spiel.sieger ? spiel.sieger !== spiel.gegnerId : eigene > fremde;
  const verloren = spiel.sieger ? spiel.sieger === spiel.gegnerId : eigene < fremde;
  return { text: `${eigene}:${fremde}${zusatz}`, klasse: gewonnen ? 'gut' : verloren ? 'schlecht' : '' };
}

function blattBuero() {
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
    hinweise.push('<p class="warnung-text">Noch kein Sponsor fuer diese Saison - <button class="klein" data-gehe="finanzen">zu den Finanzen</button></p>');
  }
  const entwicklung = (stand.entwicklungen || [])[0];
  if (entwicklung && stand.zuletzt && ['winterpause', 'saisonende'].includes(stand.zuletzt.art)) {
    const zaehlen = (passt) => entwicklung.spieler.filter(passt).length;
    hinweise.push(`<p id="entwicklungHinweis">Entwicklung zur ${entwicklung.anlass === 'Winterpause' ? 'Winterpause' : 'Saisonende'}:
      <span class="gut">${zaehlen((e) => e.nachher > e.vorher)} besser</span>, <span class="schlecht">${zaehlen((e) => e.nachher < e.vorher)} schlechter</span>
      - <button class="klein" data-gehe="kader" data-anker="entwicklung">ansehen</button></p>`);
  }
  if (stand.angebote.length) {
    hinweise.push(`<p>${stand.angebote.length} ${stand.angebote.length === 1 ? 'Angebot' : 'Angebote'} fuer deine Spieler - <button class="klein" data-gehe="transfer">ansehen</button></p>`);
  }

  inhalt.innerHTML = `
    ${stellen}
    ${bilanzHtml}
    <div class="zweispalten">
      <div>
        <section class="karte" id="naechsterTermin">
          <h2>Als Naechstes: ${text(n.titel)}</h2>
          <p>${n.spiel && n.spiel.gegner ? `${n.spiel.daheim ? 'Daheim gegen' : 'Auswaerts bei'} <b>${text(n.spiel.gegner)}</b>`
            : n.spiel && n.spiel.frei ? 'Ohne dich - du bist nicht mehr dabei.' : n.art === 'saisonende' ? 'Die Saison wird abgeschlossen: Praemien, Auf- und Abstieg, Vertraege, Jugend.'
              : n.art === 'vorbereitung' ? 'Die Saison beginnt mit dem Trainingslager.' : n.art === 'winterpause' ? 'Winterpause: frische Beine, und der Markt oeffnet.' : ''}</p>
          <p class="unterzeile">${text(stand.fenster.text)}</p>
          ${stand.vorschau ? '<p><button class="klein" data-gehe="spieltag" data-spieltag="vorschau">Vorschau auf den Gegner</button></p>' : ''}
          ${hinweise.join('')}
        </section>

        <section class="karte" id="vorstand">
          <h2>Vorstand</h2>
          <p>Ziel: <b>${text(vorstand.ziel.text)}</b> - Platz ${vorstand.ziel.platz} oder besser.
            ${zeile && zeile.spiele ? `Heute Platz <b>${zeile.platz}</b>.` : ''}</p>
          <div class="balken-rahmen"><div class="balken ${vertrauen < 30 ? 'tief' : vertrauen < 50 ? 'mittel' : ''}" style="width:${vertrauen}%"></div></div>
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

  inhalt.querySelectorAll('[data-stelle]').forEach((knopf) => {
    knopf.addEventListener('click', async () => {
      const daten = await zug('stelle', { vereinId: knopf.dataset.stelle });
      if (daten.ok) {
        elfLokal = null;
        uebernehmen(stand);
        melden(`Neue Stelle bei ${stand.verein.name}.`);
        zeichnen();
      }
    });
  });
}

// ---------------------------------------------------------- Mannschaft

const spielerVon = (id) => stand.verein.spieler.find((s) => s.id === id);
const form = (s) => s.staerke * (0.6 + (s.kondition / 100) * 0.4) * (0.9 + (s.moral / 100) * 0.2);
const nachPosition = (a, b) => stand.rollen.indexOf(a.rolle) - stand.rollen.indexOf(b.rolle) || b.staerke - a.staerke;
const rolleText = (s) => (s.rolle ? `${s.rolle}${s.nebenrolle ? `/${s.nebenrolle}` : ''}` : s.position);

// Wie gut einer auf einem Platz ist - die Tabelle kommt vom Server, gerechnet wird dort.
const eignung = (s, platz) => (s.rolle === platz ? 1 : s.nebenrolle === platz ? stand.eignung.neben : stand.eignung.tabelle[s.rolle][platz]);
const passtInsFach = (s, platz) => (platz === 'TW') === (s.position === 'TOR');
const wertAuf = (s, platz) => form(s) * eignung(s, platz);
const plaetzeJetzt = () => stand.plaetze[stand.verein.taktik.system];
const FACH = 'Ins Tor gehoert ein Torwart, ins Feld keiner.';

// Die beste Elf rechnet der Server - dieselbe, die er ohne Abgabe spielen liesse.
const besteElf = () => [...stand.verein.besteElf];

/**
 * Ein Spieler auf einen Platz. Steht er schon in der Elf, tauscht er mit dem,
 * der dort steht; kommt er von der Bank, setzt sich der andere auf die Bank.
 */
function aufPlatz(id, index) {
  const spieler = spielerVon(id);
  const plaetze = plaetzeJetzt();
  if (!spieler.bereit) return melden(`${spieler.name} ist ${spieler.ausfall}.`, true);
  const bisher = elfLokal.indexOf(id);
  if (bisher === index) return undefined;
  if (!passtInsFach(spieler, plaetze[index])) return melden(FACH, true);
  if (bisher >= 0) {
    const anderer = spielerVon(elfLokal[index]);
    if (anderer && !passtInsFach(anderer, plaetze[bisher])) return melden(FACH, true);
    [elfLokal[bisher], elfLokal[index]] = [elfLokal[index], elfLokal[bisher]];
  } else {
    elfLokal[index] = id;
  }
  return zeichnen();
}

/**
 * Ein Klick genuegt: von der Bank kommt ein Spieler auf den Platz, auf dem er
 * gegenueber dem, der dort steht, am meisten bringt; aus der Elf weicht er
 * dem Besten von der Bank fuer seinen Platz.
 */
function tauschen(id) {
  const spieler = spielerVon(id);
  if (!spieler.bereit) return melden(`${spieler.name} ist ${spieler.ausfall}.`, true);
  const plaetze = plaetzeJetzt();
  const index = elfLokal.indexOf(id);
  if (index >= 0) {
    const platz = plaetze[index];
    const ersatz = stand.verein.spieler
      .filter((s) => s.bereit && !elfLokal.includes(s.id) && passtInsFach(s, platz))
      .sort((a, b) => wertAuf(b, platz) - wertAuf(a, platz))[0];
    if (!ersatz) return melden(`Fuer ${platz} sitzt niemand mehr auf der Bank.`);
    elfLokal[index] = ersatz.id;
    return zeichnen();
  }
  const gewinn = (platz, i) => {
    if (!passtInsFach(spieler, platz)) return -Infinity;
    const dort = spielerVon(elfLokal[i]);
    return wertAuf(spieler, platz) - (dort ? wertAuf(dort, platz) : 0);
  };
  const ziel = plaetze.map((platz, i) => ({ i, wert: gewinn(platz, i) })).sort((a, b) => b.wert - a.wert)[0];
  return aufPlatz(id, ziel.i);
}

// Ziehen und Ablegen mit Zeigerereignissen statt HTML-Drag-and-Drop: das geht
// mit Maus, Stift und Finger gleich. Wer nicht zieht, klickt - dann gilt `tauschen`.
let gezogen = null;
let klickSchlucken = false;

const zielUnter = (x, y) => document.elementFromPoint(x, y)?.closest('[data-platz], #bankBereich') || null;

function ziehenBeginnen(e) {
  const quelle = e.currentTarget;
  if (e.button !== 0) return;
  // Mit dem Finger wird nur auf dem Spielfeld gezogen - in der Bankliste scrollt er.
  if (e.pointerType === 'touch' && !quelle.classList.contains('trikot')) return;
  gezogen = {
    id: quelle.dataset.spieler, x: e.clientX, y: e.clientY, quelle, geist: null, ziel: null,
  };
}

document.addEventListener('pointermove', (e) => {
  if (!gezogen) return;
  if (!gezogen.geist) {
    if (Math.hypot(e.clientX - gezogen.x, e.clientY - gezogen.y) < 6) return;
    const s = spielerVon(gezogen.id);
    gezogen.geist = document.createElement('div');
    gezogen.geist.className = 'geist';
    gezogen.geist.textContent = `${s.name} · ${rolleText(s)}`;
    document.body.append(gezogen.geist);
    gezogen.quelle.classList.add('wird-gezogen');
  }
  gezogen.geist.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 10}px)`;
  const ziel = zielUnter(e.clientX, e.clientY);
  if (ziel !== gezogen.ziel) {
    gezogen.ziel?.classList.remove('ziel');
    ziel?.classList.add('ziel');
    gezogen.ziel = ziel;
  }
});

function ziehenEnden(e) {
  if (!gezogen) return;
  const {
    id, geist, quelle, ziel,
  } = gezogen;
  gezogen = null;
  if (!geist) return;
  geist.remove();
  quelle.classList.remove('wird-gezogen');
  ziel?.classList.remove('ziel');
  // Der Klick, den der Browser nach dem Loslassen schickt, ist kein Klick.
  klickSchlucken = true;
  setTimeout(() => { klickSchlucken = false; }, 0);
  if (!ziel || e.type === 'pointercancel') return;
  if (ziel.dataset.platz !== undefined) aufPlatz(id, Number(ziel.dataset.platz));
  else if (elfLokal.includes(id)) tauschen(id);
}

document.addEventListener('pointerup', ziehenEnden);
document.addEventListener('pointercancel', ziehenEnden);

function blattMannschaft() {
  const v = stand.verein;
  const merk = v.aufstellung;
  const plaetze = plaetzeJetzt();
  const gleich = merk && merk.system === v.taktik.system && merk.ids.length === elfLokal.length && merk.ids.every((id, i) => id === elfLokal[i]);
  const vonHand = !merk && elfLokal.join() !== besteElf().join();
  const status = gleich ? '<span class="gut">abgegeben · gilt bis zum Widerruf</span>'
    : merk || vonHand ? '<span class="schlecht">geaendert, noch nicht abgegeben</span>'
      : '<span class="leise">keine feste Elf · vor jedem Spiel stellt der Rechner die beste</span>';

  // Je Mannschaftsteil eine Reihe, darin die Plaetze von links nach rechts.
  const reihen = ['ANG', 'MIT', 'ABW', 'TOR']
    .map((teil) => plaetze.map((platz, i) => ({ platz, i })).filter(({ platz }) => TEIL[platz] === teil));
  const platzfeld = ({ platz, i }) => {
    const s = spielerVon(elfLokal[i]);
    if (!s) return `<div class="platzfeld" data-platz="${i}"><span class="platzname">${platz}</span><span class="leer">frei</span></div>`;
    const e = eignung(s, platz);
    return `<div class="platzfeld lage-${platz.toLowerCase()}" data-platz="${i}">
      <span class="platzname">${platz}</span>
      <button class="trikot ${s.kondition < 70 ? 'muede' : ''} ${e < 1 ? 'fremd' : ''}" data-spieler="${s.id}" data-ziehbar
        title="${text(s.name)}, ${rolleText(s)} auf ${platz}: ${Math.round(e * 100)} % · Kondition ${s.kondition}, Moral ${s.moral}">
        <b>${text(s.name.split(' ').at(-1))}</b>
        <span class="bringt ${e < 0.9 ? 'schlecht' : e < 1 ? 'mau' : ''}">${Math.round(s.staerke * e)}${e < 1 ? ` <small>von ${s.staerke}</small>` : ''}</span>
        <span class="wert">${rolleText(s)} · K ${s.kondition}</span>
      </button>
    </div>`;
  };
  const bank = v.spieler.filter((s) => !elfLokal.includes(s.id)).sort(nachPosition);

  inhalt.innerHTML = `
    <div class="zweispalten">
      <section>
        <h2>Aufstellung ${v.taktik.system} <small id="aufstellungStatus">${status}</small></h2>
        <div class="platz">
          ${reihen.map((reihe) => `<div class="reihe-elf">${reihe.map(platzfeld).join('')}</div>`).join('')}
        </div>
        <div class="reihe" style="margin-top:.85rem">
          <label class="feld klein"><span>System</span>
            <select id="system">${stand.systeme.map((s) => `<option${s === v.taktik.system ? ' selected' : ''}>${s}</option>`).join('')}</select>
          </label>
          <button id="besteElf">Beste Elf</button>
          <button id="abgeben" class="haupt">Aufstellung abgeben</button>
          <button id="freigeben" class="leise" ${merk ? '' : 'disabled'}>freigeben</button>
        </div>
        <p class="unterzeile">Ziehe einen Spieler von der Bank auf einen Platz oder von Platz zu Platz - oder klicke ihn an: von der Bank
          kommt er dorthin, wo er am meisten bringt, aus der Elf weicht er dem Besten fuer seinen Platz. Auf einer fremden Position bringt
          ein Spieler weniger; die Zahl im Trikot ist, was er dort bringt. Eine abgegebene Elf gilt, bis du sie aenderst; faellt einer aus,
          rueckt auf seinen Platz, wer dort am meisten bringt.</p>

        <div class="regler">
          <label><span>Ausrichtung</span><input type="range" id="ausrichtung" min="1" max="5" value="${v.taktik.ausrichtung}" />
            <span>${text(stand.ausrichtungen[v.taktik.ausrichtung - 1])}</span></label>
          <label><span>Haerte</span><input type="range" id="haerte" min="1" max="5" value="${v.taktik.haerte}" /><span>${v.taktik.haerte} / 5</span></label>
          <label><span>Pressing</span><input type="range" id="pressing" min="1" max="5" value="${v.taktik.pressing}" /><span>${v.taktik.pressing} / 5</span></label>
          <label><span>Training</span><input type="range" id="training" min="0" max="100" step="10" value="${v.training}" />
            <span>${v.training < 34 ? 'Kondition' : v.training > 66 ? 'Technik' : 'gemischt'}</span></label>
          <label><span>Schwerpunkt</span>
            <select id="schwerpunkt">${stand.schwerpunkte.map((s) => `<option value="${s}"${s === v.schwerpunkt ? ' selected' : ''}>${SCHWERPUNKTE[s]}</option>`).join('')}</select><span></span></label>
          <label><span>Wechsel</span>
            <select id="wechselregel">
              <option value="auto"${v.wechselregel === 'auto' ? ' selected' : ''}>automatisch</option>
              <option value="verletzung"${v.wechselregel === 'verletzung' ? ' selected' : ''}>nur bei Verletzung</option>
            </select><span></span></label>
        </div>
        <p class="unterzeile">Offensiv oeffnet das Spiel fuer beide Seiten - das hilft dem Staerkeren; Mauern verriegelt es - das hilft dem
          Schwaecheren. Pressing staerkt das Mittelfeld und kostet Kondition, geuebtes Pressing weniger. Haerte staerkt die Abwehr und kostet
          Karten. Training entscheidet zwischen frischen Beinen jede Woche und besseren Spielern zur Winterpause und am Saisonende; ein
          Schwerpunkt kostet davon ein Viertel. Automatisch gewechselt wird nach 60, 70 und 80 Minuten, wer muede ist.</p>

        <div class="karte" id="einstudiert">
          <h2>Eingeuebt</h2>
          ${[[`System ${v.taktik.system}`, v.einstudiert.systeme[v.taktik.system] ?? 0], ['Pressing', v.einstudiert.pressing],
    ['Abwehr', v.einstudiert.abwehr], ['Angriff', v.einstudiert.angriff]].map(([name, wert]) => `<div class="uebung" data-uebung="${name.split(' ')[0].toLowerCase()}">
            <span>${text(name)}</span>
            <div class="balken-rahmen"><div class="balken ${wert < 40 ? 'tief' : wert < 70 ? 'mittel' : ''}" style="width:${Math.round(wert)}%"></div></div>
            <b>${Math.round(wert)} %</b></div>`).join('')}
          <p class="unterzeile">Ein System, das nicht sitzt, kostet bis zu sieben Prozent. Jedes Spiel darin und der Schwerpunkt "System einspielen"
            bringen es naeher; was nicht geuebt wird, verblasst.</p>
        </div>
      </section>

      <section id="bankBereich">
        <h2>Bank und Tribuene <span class="leise">${bank.length} Spieler</span></h2>
        <div class="tabellenrahmen">
          <table id="bank"><thead><tr><th class="links">Pos</th><th class="links">Spieler</th><th>Alt</th><th>St</th><th>Kon</th><th>Mor</th><th>Note</th></tr></thead>
          <tbody>${bank.map((s) => `<tr data-spieler="${s.id}" data-ziehbar class="bankzeile ${s.bereit ? '' : 'leise'}">
            <td class="links">${rolleText(s)}</td>
            <td class="links">${text(s.name)}${s.ausfall ? ` <small class="schlecht">${text(s.ausfall)}</small>` : ''}</td>
            <td>${s.alter}</td><td><b>${s.staerke}</b></td>
            <td class="${s.kondition < 70 ? 'schlecht' : ''}">${s.kondition}</td><td>${s.moral}</td><td>${note(s.saison.note)}</td>
          </tr>`).join('')}</tbody></table>
        </div>
      </section>
    </div>`;

  inhalt.querySelectorAll('[data-spieler]').forEach((el) => el.addEventListener('click', () => {
    if (!klickSchlucken) tauschen(el.dataset.spieler);
  }));
  inhalt.querySelectorAll('[data-ziehbar]').forEach((el) => el.addEventListener('pointerdown', ziehenBeginnen));
  $('system').addEventListener('change', async (e) => {
    const daten = await zug('taktik', { system: e.target.value });
    const eingespielt = Math.round(stand.verein.einstudiert.systeme[e.target.value] ?? 0);
    if (daten.aufstellungVerworfen) melden(`Die abgegebene Aufstellung passte zum alten System und ist verworfen. ${e.target.value} ist zu ${eingespielt} % eingespielt.`);
    else if (daten.ok) melden(`${e.target.value} ist zu ${eingespielt} % eingespielt.`);
    elfLokal = besteElf();
    zeichnen();
  });
  $('besteElf').addEventListener('click', () => { elfLokal = besteElf(); zeichnen(); });
  $('abgeben').addEventListener('click', async () => {
    const daten = await zug('aufstellung', { ids: elfLokal, system: stand.verein.taktik.system });
    if (daten.ok) melden('Aufstellung steht - sie gilt bis zum Widerruf.');
    zeichnen();
  });
  $('freigeben').addEventListener('click', async () => {
    const daten = await zug('aufstellung', { frei: true });
    if (daten.ok) {
      elfLokal = besteElf();
      melden('Keine feste Elf mehr - vor jedem Spiel stellt der Rechner die beste.');
    }
    zeichnen();
  });
  for (const regler of ['ausrichtung', 'haerte', 'pressing']) {
    $(regler).addEventListener('change', (e) => zug('taktik', { [regler]: Number(e.target.value) }).then(zeichnen));
  }
  $('schwerpunkt').addEventListener('change', (e) => zug('schwerpunkt', { schwerpunkt: e.target.value }).then(zeichnen));
  $('training').addEventListener('change', (e) => zug('training', { wert: Number(e.target.value) }).then(zeichnen));
  $('wechselregel').addEventListener('change', (e) => zug('wechselregel', { regel: e.target.value }).then(zeichnen));
}

// --------------------------------------------------------------- Kader

// Ein Name, der die Akte des Spielers oeffnet.
const namensknopf = (id, name) => `<button class="namelink" data-akte="${id}">${text(name)}</button>`;

/** Die Staerke ueber die Saisons als kleine Linie, jeder Punkt mit Wert und Saison. */
function verlaufZeichnen(werte, saisons) {
  const breite = 320;
  const hoehe = 76;
  const rand = 18;
  const tief = Math.min(...werte) - 3;
  const hoch = Math.max(...werte) + 3;
  const x = (i) => rand + (i * (breite - 2 * rand)) / Math.max(1, werte.length - 1);
  const y = (w) => hoehe - 16 - ((w - tief) / (hoch - tief)) * (hoehe - 32);
  return `<svg class="verlauf" viewBox="0 0 ${breite} ${hoehe}" role="img" aria-label="Staerke ueber die Saisons">
    <polyline points="${werte.map((w, i) => `${x(i).toFixed(1)},${y(w).toFixed(1)}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="2" />
    ${werte.map((w, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(w).toFixed(1)}" r="3" fill="currentColor" />
      <text x="${x(i).toFixed(1)}" y="${(y(w) - 7).toFixed(1)}" text-anchor="middle">${w}</text>
      <text class="achse" x="${x(i).toFixed(1)}" y="${hoehe - 2}" text-anchor="middle">S${saisons[i]}</text>`).join('')}
  </svg>`;
}

/** Die Akte eines Spielers: Saison fuer Saison, jeder Wechsel, die laufende Saison. */
async function akteZeigen(id) {
  const daten = await anfragen(`/api/manager/spielstaende/${kennung}/spieler/${id}`);
  const a = daten.spieler;
  if (!a) return;
  const summe = (feld) => a.stationen.reduce((s, x) => s + x[feld], 0) + a.saison[feld];
  const zeile = (x, laufend) => `<tr class="${laufend ? 'laufend' : ''}"><td>${x.saison}</td>
    <td class="links">${text(x.verein)}${laufend ? ' <small class="leise">laufend</small>' : ''}</td><td>${x.liga ?? '–'}</td>
    <td>${x.spiele}</td><td>${x.tore}</td><td>${x.vorlagen}</td><td>${note(x.note)}</td><td>${x.staerke}</td><td>${x.alter}</td></tr>`;
  dialog(`
    <h2 id="spielerakte">${text(a.name)}</h2>
    <p class="unterzeile">${rolleText(a)} · ${a.alter} Jahre · Staerke ${a.staerke} · Talent ${a.talent} · ${text(a.verein)}${a.liga ? ` (${a.liga}. Liga)` : ''}
      · Wert ${geld(a.wert)}${a.vertragBis ? ` · Vertrag bis Saison ${a.vertragBis}` : ''}${a.karriereende ? ' · <span class="schlecht">hoert zum Saisonende auf</span>' : ''}</p>
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
    <p class="unterzeile">Aufgezeichnet wird Saison fuer Saison seit dieser Fassung des Spiels. Wer in einer Saison wechselt, dessen Saison
      steht bei dem Verein, bei dem er sie beendet.</p>`);
}

// Ein Klick auf einen Namen zeigt die Akte - im Kader, im Markt, in der Vereinsansicht, in der Entwicklung.
document.addEventListener('click', (e) => {
  const knopf = e.target instanceof Element ? e.target.closest('[data-akte]') : null;
  if (knopf) akteZeigen(knopf.dataset.akte);
});

const veraenderung = (d) => (d > 0 ? `<span class="gut">+${d}</span>` : d < 0 ? `<span class="schlecht">-${-d}</span>` : '<span class="leise">0</span>');

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
      · ${zaehlen((e) => e.nachher === e.vorher)} unveraendert</p>
    <div class="tabellenrahmen"><table id="entwicklungsliste"><thead><tr>
      <th class="links">Pos</th><th class="links">Spieler</th><th>Alt</th><th>Tal</th><th title="Anteil an den moeglichen Minuten">Spielzeit</th>
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
    <p class="unterzeile">So wird gerechnet: bis 20 waechst ein Spieler um 20 bis 50 % des Abstands zu seinem Talent - je mehr er spielt und
      je mehr Technik trainiert wird, desto mehr; von 21 bis 24 um 10 bis 32 %. Von 25 bis 28 bleibt er etwa, wie er ist, mit viel
      Techniktraining und Luft zum Talent einen Punkt besser. Von 29 bis 31 verliert er 1 bis 3 Punkte, ab 32 2 bis 5. Zur Winterpause
      kommen 40 % davon, am Saisonende der Rest; ueber sein Talent waechst keiner. Spielzeit zaehlt voll ab 60 % der moeglichen Minuten.
      Das Alter ist das waehrend der Saison - danach ist jeder ein Jahr aelter, und ab 29 sinkt das Talent um zwei.</p>
  </section>`;
}

function blattKader() {
  const v = stand.verein;
  const spieler = v.spieler.slice().sort(nachPosition);
  const berichte = stand.entwicklungen || [];
  const zuletzt = new Map((berichte[0]?.spieler || []).map((e) => [e.id, e.nachher - e.vorher]));
  inhalt.innerHTML = `
    <section>
      <h2>Kader <span class="leise">${v.spieler.length} Spieler · Gehaelter ${geld(v.gehaltJahr)} im Jahr ·
        Kaderwert ${geld(v.spieler.reduce((s, x) => s + x.wert, 0))}</span></h2>
      <div class="tabellenrahmen">
        <table id="kader"><thead><tr>
          <th class="links">Pos</th><th class="links">Spieler</th><th>Alt</th><th>St</th>
          <th title="Veraenderung bei der letzten Entwicklung">±</th><th>Tal</th><th>Kon</th><th>Mor</th>
          <th>Sp</th><th>T</th><th>V</th><th>Note</th><th>Vertrag</th><th>Gehalt</th><th>Wert</th><th class="links"></th>
        </tr></thead><tbody>
        ${spieler.map((s) => `<tr data-spieler="${s.id}" class="${s.bereit ? '' : 'leise'}">
          <td class="links">${rolleText(s)}</td>
          <td class="links">${namensknopf(s.id, s.name)}${s.ausfall ? ` <small class="schlecht">${text(s.ausfall)}</small>` : ''}${s.jugend && s.alter <= 19 ? ' <small class="marke">Jugend</small>' : ''}${s.transferliste ? ' <small class="marke">Liste</small>' : ''}${s.karriereende ? ' <small class="marke ende">hoert auf</small>' : ''}</td>
          <td>${s.alter}</td><td><b>${s.staerke}</b></td><td>${zuletzt.has(s.id) ? veraenderung(zuletzt.get(s.id)) : ''}</td>
          <td class="leise">${s.talent}</td>
          <td class="${s.kondition < 70 ? 'schlecht' : ''}">${s.kondition}</td><td>${s.moral}</td>
          <td>${s.saison.spiele}</td><td>${s.saison.tore}</td><td>${s.saison.vorlagen}</td><td>${note(s.saison.note)}</td>
          <td class="vertrag ${s.vertrag && s.vertrag.bis <= stand.saison ? 'schlecht' : ''}">${s.vertrag ? `bis ${s.vertrag.bis}` : '–'}</td>
          <td>${geld(s.vertrag ? s.vertrag.gehalt : 0)}</td><td>${geld(s.wert)}</td>
          <td class="aktionen">
            <button data-liste="${s.id}" class="${s.transferliste ? 'an' : ''}">${s.transferliste ? 'von der Liste' : 'auf die Liste'}</button>
            <button data-freistellen="${s.id}" class="leise">freistellen</button>
            ${s.verlaengerbar ? `<button data-verlaengern="${s.id}">verlaengern</button>` : ''}
          </td>
        </tr>`).join('')}
        </tbody></table>
      </div>
      <p class="unterzeile">Rot: der Vertrag endet mit dieser Saison, danach ist der Spieler weg. Verlaengert wird ab dem vorletzten Jahr,
        zum Gehalt, das der Spieler nennt. Wer auf der Liste steht, bekommt oefter Angebote. Freistellen kostet die Haelfte der restlichen Gehaelter.
        ± ist die Veraenderung bei der letzten Entwicklung.</p>
    </section>
    ${entwicklungZeigen(berichte)}`;

  inhalt.querySelectorAll('[data-entwicklung]').forEach((knopf) => {
    knopf.addEventListener('click', () => { ansicht.entwicklung = Number(knopf.dataset.entwicklung); zeichnen(); });
  });

  inhalt.querySelectorAll('[data-verlaengern]').forEach((knopf) => {
    knopf.addEventListener('click', () => verlaengernDialog(spielerVon(knopf.dataset.verlaengern)));
  });
  inhalt.querySelectorAll('[data-liste]').forEach((knopf) => {
    knopf.addEventListener('click', async () => {
      const s = spielerVon(knopf.dataset.liste);
      await zug('transferliste', { spielerId: s.id, an: !s.transferliste });
      zeichnen();
    });
  });
  inhalt.querySelectorAll('[data-freistellen]').forEach((knopf) => {
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
  const ab = Math.max(s.vertrag.bis, stand.saison);
  dialog(`
    <h2>${text(s.name)} verlaengern</h2>
    <p>${rolleText(s)}, ${s.alter} Jahre, Staerke ${s.staerke}. Vertrag bis Saison ${s.vertrag.bis}, bisher ${geld(s.vertrag.gehalt)} im Jahr.</p>
    <p>Er will <b>${geld(s.gehaltswunsch)}</b> im Jahr. Wie lange?</p>
    <div class="reihe">${Array.from({ length: s.laufzeitMax }, (_, i) => i + 1)
      .map((j) => `<button class="haupt" data-laufzeit="${j}">${jahre(j)} · bis Saison ${ab + j}</button>`).join('')}</div>`,
  (huelle) => huelle.querySelectorAll('[data-laufzeit]').forEach((knopf) => knopf.addEventListener('click', async () => {
    const daten = await zug('verlaengern', { spielerId: s.id, laufzeit: Number(knopf.dataset.laufzeit) });
    if (!daten.ok) return;
    dialogZu();
    melden(`${s.name} verlaengert bis Saison ${daten.bis}.`);
    zeichnen();
  })));
}

// ------------------------------------------------------------ Spieltag

// Zeichen fuer den Ticker als kleine Formen statt Emoji: Emoji sehen auf jedem
// System anders aus, unter Windows wird aus dem Ball ein Globus.
const BALL = '<svg class="ball" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#e6e9ee"/>'
  + '<path d="M16 8l6 4.4-2.3 7H12.3l-2.3-7z" fill="#14171c"/></svg>';
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

// Im Pokal zwei Zeilen je Paarung wie auf einem Turnierbaum: drei Runden
// nebeneinander lassen fuer eine Zeile je Paarung zu wenig Platz fuer die Namen.
function pokalPaarung(p) {
  const seite = (id, name, tore) => `<div class="seite ${p.sieger && p.sieger === id ? 'sieger' : ''}">
    <span class="name">${text(name)}</span><span class="tore">${p.tore ? tore : ''}</span></div>`;
  const zusatz = p.elfmeter ? `i.E. ${p.elfmeter[0]}:${p.elfmeter[1]}` : p.verlaengerung ? 'n.V.' : '';
  return `<div class="paarung pokalpaarung ${p.eigenes ? 'eigenes' : ''}">
    ${seite(p.heim, p.heimName, p.tore?.[0])}${seite(p.gast, p.gastName, p.tore?.[1])}
    ${zusatz ? `<small class="zusatz">${zusatz}</small>` : ''}
  </div>`;
}

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
    was = `${text(e.rein)} <span class="leise">fuer</span> ${text(e.spieler)}${e.grund === 'verletzung' ? ' <span class="leise">(verletzt)</span>' : ''}`;
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
    { ab: 121, marke: () => mitStand(spiel.elfmeter ? 'Nach Verlaengerung' : 'Abpfiff nach Verlaengerung') },
  ].slice(0, spiel.verlaengerung ? 3 : 2);
  let naechster = 0;
  const bis = (minute) => {
    while (naechster < schritte.length && minute >= schritte[naechster].ab) folge.push(schritte[naechster++].marke());
  };
  let elfer = false;
  for (const e of spiel.ereignisse || []) {
    bis(e.minute);
    if (e.minute > 120 && !elfer) {
      folge.push({ marke: 'Elfmeterschiessen' });
      elfer = true;
    }
    folge.push(e);
    if (e.art === 'tor') stand[e.verein === spiel.heim.id ? 0 : 1] += 1;
  }
  bis(Infinity);
  if (spiel.elfmeter) folge.push({ marke: `Abpfiff · ${spiel.elfmeter[0]} : ${spiel.elfmeter[1]} im Elfmeterschiessen` });
  return folge;
}

function berichtZeigen(b) {
  const e = b.eigenes;
  let html = `<h2>${text(b.titel)}</h2>`;
  if (b.art === 'vorbereitung' || b.art === 'winterpause') html += `<p class="unterzeile">${text(b.text)}</p>`;
  if (b.art === 'saisonende') html += '<p class="unterzeile">Die Saison ist vorbei - die Bilanz steht im Buero.</p>';
  if (b.art === 'pokal' && !e) html += '<p class="unterzeile">Ohne dich.</p>';
  if (e) {
    let zusatz = '';
    if (e.elfmeter) zusatz = `n.V., ${e.elfmeter[0]}:${e.elfmeter[1]} im Elfmeterschiessen · `;
    else if (e.verlaengerung) zusatz = 'nach Verlaengerung · ';
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

const EINSCHAETZUNG = { favorit: 'Du bist Favorit', offen: 'Offenes Spiel', aussenseiter: 'Du bist Aussenseiter' };
const TEILE = [['torwart', 'Torwart'], ['abwehr', 'Abwehr'], ['mittelfeld', 'Mittelfeld'], ['angriff', 'Angriff']];
const AUSGANG = { S: 'Sieg', U: 'Unentschieden', N: 'Niederlage' };

function vorschauZeigen(v) {
  const wo = v.neutral ? 'neutraler Platz' : v.daheim ? 'daheim' : 'auswaerts';
  const verein = (s, seite) => `<div class="verein ${seite}">
      <b>${text(s.name)}</b>
      <small>${s.platz ? `Platz ${s.platz} · ${s.punkte} Pkt` : `${s.liga}. Liga`} · Kader ${s.niveau} · ${s.system}</small>
      ${s.form.length ? `<span class="form" title="die letzten Ligaspiele, das juengste rechts">${s.form.map((f) => `<i class="form-${f}" title="${AUSGANG[f]}">${f}</i>`).join('')}</span>`
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
    <p class="unterzeile">Die Elf, die heute spielen wuerde - mit Tagesform, System und Eingeuebtem, ohne Heimvorteil und Taktik.
      Das Mittelfeld teilt die Chancen, Angriff gegen Abwehr und Torwart entscheidet, was daraus wird.</p>
    <p id="bisher">${v.bisher.length ? `Bisher: ${bisher}` : '<span class="leise">In dieser Saison noch nicht gegeneinander gespielt.</span>'}</p>
    <p class="ausfaelle">Es fehlen bei dir: ${ausfaelle(v.eigen)}<br />bei ${text(v.gegner.name)}: ${ausfaelle(v.gegner)}</p>
    <div class="reihe">
      <button class="klein" data-gehe="mannschaft">zur Aufstellung</button>
      <button class="klein" data-verein-ansehen="${v.gegner.id}">Kader von ${text(v.gegner.name)}</button>
    </div>
  </section>`;
}

function blattSpieltag() {
  const b = stand.zuletzt;
  const v = stand.vorschau;
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
  inhalt.querySelectorAll('[data-spieltag-wahl]').forEach((knopf) => {
    knopf.addEventListener('click', () => { ansicht.spieltag = knopf.dataset.spieltagWahl; zeichnen(); });
  });
  if (zeigt === 'bericht' && b.eigenes) tickerZeigen(b.eigenes, Number($('tempo').value));
}

// Der Ticker laeuft die Ereignisse des eigenen Spiels ab. Er ist Zierde, keine
// Rechnung - das Ergebnis steht laengst fest, deshalb darf man ihn jederzeit
// abbrechen.
function tickerZeigen(spiel, tempo) {
  const kasten = $('ticker');
  if (!kasten) return;
  const ereignisse = tickerFolge(spiel);
  clearInterval(tickerZeigen.uhr);
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
  tickerZeigen.uhr = setInterval(() => {
    if (!kasten.isConnected || !anzeige() || i >= ereignisse.length) {
      clearInterval(tickerZeigen.uhr);
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

// ---------------------------------------------------------------- Liga

function blattLiga() {
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
        <p class="unterzeile">${nummer === 1 ? 'Gruen: Meister · Rot: die drei Absteiger' : 'Gruen: die drei Aufsteiger'} · Ein Klick auf einen Verein zeigt seinen Kader.</p>
      </section>
      <section>
        <h2>Torjaeger ${nummer}. Liga</h2>
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

  inhalt.querySelectorAll('[data-liga-wahl]').forEach((knopf) => {
    knopf.addEventListener('click', () => { ansicht.liga = Number(knopf.dataset.ligaWahl); zeichnen(); });
  });
  inhalt.querySelectorAll('tr[data-verein]').forEach((zeile) => {
    zeile.addEventListener('click', () => vereinAnsehen(zeile.dataset.verein));
  });
}

async function vereinAnsehen(id) {
  const daten = await anfragen(`/api/manager/spielstaende/${kennung}/verein/${id}`);
  const v = daten.verein;
  if (!v) return;
  dialog(`
    <h2 id="vereinsansicht">${text(v.name)}</h2>
    <p class="unterzeile">${v.liga}. Liga · Platz ${v.platz} · Kader ${v.niveau} · Ruf ${v.reputation} · ${zahl(v.plaetze)} Plaetze · spielt ${v.system}</p>
    <div class="tabellenrahmen"><table><thead><tr><th class="links">Pos</th><th class="links">Spieler</th><th>Alt</th><th>St</th>
      <th>Sp</th><th>T</th><th>Wert</th><th>Forderung</th><th>Vertrag</th></tr></thead>
    <tbody>${v.spieler.map((s) => `<tr><td class="links">${rolleText(s)}</td>
      <td class="links">${namensknopf(s.id, s.name)}${s.ausfall ? ` <small class="schlecht">${text(s.ausfall)}</small>` : ''}${s.karriereende ? ' <small class="marke ende">hoert auf</small>' : ''}</td>
      <td>${s.alter}</td><td><b>${s.staerke}</b></td><td>${s.spiele}</td><td>${s.tore}</td><td>${geld(s.wert)}</td>
      <td>${s.forderung === null ? '–' : s.verkaeuflich ? geld(s.forderung) : '<span class="leise">unverkaeuflich</span>'}</td>
      <td>${s.vertragBis ?? '–'}</td></tr>`).join('')}</tbody></table></div>
    <p class="unterzeile">Kaufen geht im Transfermarkt, solange das Fenster offen ist.</p>`);
}

// --------------------------------------------------------------- Pokal

function blattPokal() {
  const p = stand.pokal;
  const eigen = stand.verein.id;
  const eigene = p.runden.flatMap((r) => r.paarungen.filter((x) => x.eigenes).map((x) => ({ ...x, runde: r.name })));
  const letzte = eigene.at(-1);
  let lage = 'Dein Verein ist in diesem Jahr nicht im Pokal.';
  if (p.sieger) lage = `Pokalsieger: ${text(p.sieger)}.`;
  else if (letzte && letzte.tore && letzte.sieger !== eigen) lage = `Ausgeschieden: ${text(letzte.runde)}.`;
  else if (letzte) lage = `Noch dabei - ${text(letzte.runde)}.`;
  inhalt.innerHTML = `
    <p class="unterzeile" id="pokalLage">${lage}</p>
    <div class="pokal">${p.runden.map((r) => `<section class="pokalrunde">
      <h2>${text(r.name)}</h2>
      ${r.paarungen.length ? r.paarungen.map(pokalPaarung).join('') : '<p class="unterzeile">noch nicht ausgelost</p>'}
    </section>`).join('')}</div>`;
}

// ------------------------------------------------------------ Transfer

async function marktHolen() {
  const f = ansicht.markt;
  const suche = new URLSearchParams({ sortierung: f.sortierung, anzahl: String(f.anzahl) });
  if (f.position) suche.set('position', f.position);
  if (f.liga) suche.set('liga', f.liga);
  if (f.maxAlter) suche.set('maxAlter', f.maxAlter);
  if (f.minStaerke) suche.set('minStaerke', f.minStaerke);
  if (f.bezahlbar) suche.set('maxPreis', String(Math.max(0, stand.verein.konto)));
  const daten = await anfragen(`/api/manager/spielstaende/${kennung}/markt?${suche}`);
  markt = daten.markt || { liste: [], gesamt: 0, fenster: stand.fenster };
}

const laufzeitMax = (alter) => (alter >= 33 ? 1 : alter >= 31 ? 2 : 4);

function blattTransfer() {
  if (!markt) {
    inhalt.innerHTML = '<p class="unterzeile">Markt wird geladen ...</p>';
    marktHolen().then(() => { if (blatt === 'transfer') zeichnen(); });
    return;
  }
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
    ${stand.angebote.length ? `<section id="angebote"><h2>Angebote fuer deine Spieler</h2>
      ${stand.angebote.map((a) => `<div class="angebot">
        <span><strong>${text(a.verein)}</strong> (${a.liga}. Liga) bietet <strong>${geld(a.gebot)}</strong>
          fuer ${namensknopf(a.spielerId, a.spieler)} (${a.rolle || a.position}, Staerke ${a.staerke}, Wert ${geld(a.wert)})</span>
        <button data-annehmen="${a.id}" class="haupt">Annehmen</button>
        <button data-ablehnen="${a.id}" class="leise">Ablehnen</button>
      </div>`).join('')}</section>` : ''}

    <section>
      <h2>Transfermarkt <span class="leise">${markt.gesamt} passende Spieler · Konto ${geld(konto)}</span></h2>
      <div class="marktfilter">
        <label class="feld"><span>Position</span><select id="filterPosition"><option value="">alle</option>
          ${POSITIONEN.map((p) => `<option value="${p}"${f.position === p ? ' selected' : ''}>${TEILNAMEN[p]}</option>`).join('')}</select>
        <label class="feld"><span>Liga</span><select id="filterLiga">
          ${[['', 'alle'], ['1', '1. Liga'], ['2', '2. Liga'], ['frei', 'vereinslos']].map(([wert, name]) => `<option value="${wert}"${f.liga === wert ? ' selected' : ''}>${name}</option>`).join('')}
        </select></label>
        <label class="feld"><span>hoechstens Alter</span><input id="filterAlter" inputmode="numeric" value="${text(f.maxAlter)}" /></label>
        <label class="feld"><span>mindestens Staerke</span><input id="filterStaerke" inputmode="numeric" value="${text(f.minStaerke)}" /></label>
        <label class="feld"><span>Sortierung</span><select id="filterSortierung">
          ${[['staerke', 'Staerke'], ['preis', 'Preis'], ['alter', 'Alter'], ['talent', 'Talent']].map(([wert, name]) => `<option value="${wert}"${f.sortierung === wert ? ' selected' : ''}>${name}</option>`).join('')}
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
          <td class="links">${namensknopf(s.id, s.name)}${s.transferliste ? ' <small class="marke">Liste</small>' : ''}${s.karriereende ? ' <small class="marke ende">hoert auf</small>' : ''}</td>
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
        Abloese, nur Gehalt. Nicht jeder will zu jedem Verein - wer nicht will, laesst sich nicht holen.</p>
    </section>

    <section>
      <h2>Wechsel</h2>
      <ul class="liste-einfach" id="wechselTicker">${stand.ticker.map((t) => `<li>S${t.saison}: <b>${text(t.spieler)}</b> (${t.rolle || t.position}, ${t.staerke})
        <span class="leise">${text(t.von)} → ${text(t.zu)}</span> · ${t.abloese ? geld(t.abloese) : 'ablosefrei'}</li>`).join('')
        || '<li class="leise">Noch kein Wechsel.</li>'}</ul>
    </section>`;

  const neuLaden = () => { markt = null; f.anzahl = 60; zeichnen(); };
  // Mehr laden, ohne die Liste erst zu leeren - sonst springt die Seite nach oben.
  $('mehrMarkt')?.addEventListener('click', async () => { f.anzahl += 60; await marktHolen(); zeichnen(); });
  $('filterPosition').addEventListener('change', (e) => { f.position = e.target.value; neuLaden(); });
  $('filterLiga').addEventListener('change', (e) => { f.liga = e.target.value; neuLaden(); });
  $('filterSortierung').addEventListener('change', (e) => { f.sortierung = e.target.value; neuLaden(); });
  $('filterAlter').addEventListener('change', (e) => { f.maxAlter = e.target.value.trim(); neuLaden(); });
  $('filterStaerke').addEventListener('change', (e) => { f.minStaerke = e.target.value.trim(); neuLaden(); });
  $('filterBezahlbar').addEventListener('click', () => { f.bezahlbar = !f.bezahlbar; neuLaden(); });
  inhalt.querySelectorAll('[data-kaufen]').forEach((knopf) => {
    knopf.addEventListener('click', () => kaufDialog(markt.liste.find((s) => s.id === knopf.dataset.kaufen)));
  });
  inhalt.querySelectorAll('[data-annehmen]').forEach((knopf) => {
    knopf.addEventListener('click', async () => {
      const daten = await zug('annehmen', { angebotId: knopf.dataset.annehmen });
      if (daten.ok) melden(`Verkauft - ${geld(daten.erloes)} in der Kasse.`);
      neuLaden();
    });
  });
  inhalt.querySelectorAll('[data-ablehnen]').forEach((knopf) => {
    knopf.addEventListener('click', () => zug('ablehnen', { angebotId: knopf.dataset.ablehnen }).then(zeichnen));
  });
}

function kaufDialog(s) {
  dialog(`
    <h2>${text(s.name)} holen</h2>
    <p>${rolleText(s)}, ${s.alter} Jahre, Staerke ${s.staerke}, Talent ${s.talent} · ${text(s.verein)}</p>
    <p>${s.vereinId ? `${text(s.verein)} verlangt <b>${geld(s.forderung)}</b>.` : 'Vereinslos - keine Abloese.'}
      Er will <b>${geld(s.gehalt)}</b> im Jahr.</p>
    ${s.vereinId ? `<label class="feld klein"><span>Gebot in Tausend</span><input id="gebot" inputmode="numeric" value="${s.forderung}" /></label>` : ''}
    <p class="unterzeile">Wie lange soll der Vertrag laufen?</p>
    <div class="reihe">${Array.from({ length: laufzeitMax(s.alter) }, (_, i) => i + 1)
      .map((j) => `<button class="haupt" data-laufzeit="${j}">${jahre(j)}</button>`).join('')}</div>`,
  (huelle) => huelle.querySelectorAll('[data-laufzeit]').forEach((knopf) => knopf.addEventListener('click', async () => {
    const gebot = s.vereinId ? Number($('gebot').value) : 0;
    const daten = await zug('kaufen', { spielerId: s.id, gebot, laufzeit: Number(knopf.dataset.laufzeit) });
    if (!daten.ok) return;
    dialogZu();
    melden(`${daten.spieler.name} ist da - ${geld(daten.abloese)} Abloese.`);
    markt = null;
    zeichnen();
  })));
}

// ------------------------------------------------------------ Finanzen

function blattFinanzen() {
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
        <p class="unterzeile">Konto ${geld(v.konto)} · Gehaelter ${geld(v.gehaltJahr)} im Jahr, ${geld(v.gehaltJeTermin)} je Termin ·
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
            : stand.sponsorAngebote.length ? `<p class="unterzeile">Drei Angebote fuer die Saison ${stand.saison}. Wer nicht waehlt, bekommt den ausgewogenen.</p>
              <div class="vereinsliste" id="sponsorAngebote">${stand.sponsorAngebote.map((a) => `<button class="vereinskarte" data-sponsor="${a.id}">
                <b>${text(a.name)} · ${text(a.art)}</b><small>${geld(a.jeSpiel)} je Ligaspiel · ${geld(a.jeSieg)} je Sieg · ueber 34 Spiele ${geld(a.jeSpiel * 34)} sicher</small>
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
          <p>${zahl(v.stadion.plaetze)} Plaetze.
            ${v.stadion.ausbau ? `Im Bau: ${zahl(v.stadion.ausbau.plaetze)} Plaetze, fertig in ${v.stadion.ausbau.rest} ${v.stadion.ausbau.rest === 1 ? 'Woche' : 'Wochen'}.` : ''}</p>
          ${v.stadion.ausbau ? '' : `<div class="reihe">${stand.ausbau.map((a) => `<button data-ausbau="${a.stufe}" ${v.konto < a.kosten ? 'disabled title="Zu teuer."' : ''}>
            +${zahl(a.plaetze)} Plaetze · ${geld(a.kosten)} · ${a.termine} Wochen</button>`).join('')}</div>
            ${v.konto < Math.min(...stand.ausbau.map((a) => a.kosten))
    ? `<p class="unterzeile">Fuer den kleinsten Ausbau fehlen ${geld(Math.min(...stand.ausbau.map((a) => a.kosten)) - v.konto)}.</p>` : ''}`}
        </div>
      </section>
    </div>`;

  inhalt.querySelectorAll('[data-sponsor]').forEach((knopf) => {
    knopf.addEventListener('click', async () => {
      const daten = await zug('sponsor', { id: knopf.dataset.sponsor });
      if (daten.ok) melden(`${daten.sponsor.name} ist Sponsor.`);
      zeichnen();
    });
  });
  $('eintritt').addEventListener('input', (e) => { $('eintrittWert').textContent = `${e.target.value} Euro`; });
  $('eintritt').addEventListener('change', (e) => zug('eintritt', { preis: Number(e.target.value) }).then(zeichnen));
  inhalt.querySelectorAll('[data-ausbau]').forEach((knopf) => {
    knopf.addEventListener('click', async () => {
      const daten = await zug('stadion', { stufe: Number(knopf.dataset.ausbau) });
      if (daten.ok) melden('Der Ausbau beginnt.');
      zeichnen();
    });
  });
}

// -------------------------------------------------------------- Rahmen

function kopfZeichnen() {
  const v = stand.verein;
  const n = stand.naechster;
  $('vereinName').textContent = v.name;
  let gegner = '';
  if (n.spiel && n.spiel.gegner) gegner = `: ${n.spiel.daheim ? 'daheim gegen' : 'auswaerts bei'} ${n.spiel.gegner}`;
  else if (n.spiel && n.spiel.frei) gegner = ': ohne dich';
  $('kopfLage').textContent = `${v.liga}. Liga · Saison ${stand.saison} · als Naechstes ${n.titel}${gegner}`;
  const zeile = stand.tabellen[v.liga].find((z) => z.eigenes);
  $('kopfPlatz').textContent = zeile && zeile.spiele ? zeile.platz : '–';
  $('kopfKonto').textContent = geld(v.konto);
  $('kopfKonto').className = v.konto < 0 ? 'schlecht' : '';
  const vertrauen = Math.round(stand.vorstand.vertrauen);
  $('kopfVertrauen').textContent = vertrauen;
  $('kopfVertrauen').className = vertrauen < 30 ? 'schlecht' : '';

  const knopf = $('weiter');
  if (stand.status === 'entlassen') {
    knopf.textContent = 'Entlassen';
    knopf.disabled = true;
  } else {
    knopf.textContent = n.art === 'saisonende' ? 'Saison abschliessen' : n.art === 'vorbereitung' ? `Saison ${stand.saison} starten` : `Weiter: ${n.titel}`;
    knopf.disabled = laeuft;
  }
  const winter = stand.kalender.findIndex((t) => t.art === 'winterpause');
  $('vorWinter').disabled = laeuft || stand.status !== 'laeuft' || stand.termin.index >= winter;
  $('vorEnde').disabled = laeuft || stand.status !== 'laeuft' || n.art === 'saisonende';

  document.querySelectorAll('#reiter .reiterKnopf').forEach((k) => {
    k.setAttribute('aria-pressed', String(k.dataset.blatt === blatt));
  });
  const transfer = document.querySelector('#reiter [data-blatt="transfer"]');
  transfer.innerHTML = `Transfer${stand.angebote.length ? `<span class="zaehler">${stand.angebote.length}</span>` : ''}`;
}

const BLAETTER = {
  buero: blattBuero,
  mannschaft: blattMannschaft,
  kader: blattKader,
  spieltag: blattSpieltag,
  liga: blattLiga,
  pokal: blattPokal,
  transfer: blattTransfer,
  finanzen: blattFinanzen,
};

function zeichnen() {
  if (!stand || !stand.verein) return;
  clearInterval(tickerZeigen.uhr);
  kopfZeichnen();
  BLAETTER[blatt]();
  // Verweise zwischen den Blaettern, gleich auf welchem Blatt sie stehen.
  inhalt.querySelectorAll('[data-gehe]').forEach((knopf) => knopf.addEventListener('click', () => {
    blatt = knopf.dataset.gehe;
    if (knopf.dataset.spieltag) ansicht.spieltag = knopf.dataset.spieltag;
    const anker = knopf.dataset.anker;
    zeichnen();
    if (anker) $(anker)?.scrollIntoView({ block: 'start' });
  }));
  inhalt.querySelectorAll('[data-verein-ansehen]').forEach((knopf) => {
    knopf.addEventListener('click', () => vereinAnsehen(knopf.dataset.vereinAnsehen));
  });
}

$('reiter').addEventListener('click', (e) => {
  const knopf = e.target.closest('.reiterKnopf');
  if (!knopf) return;
  blatt = knopf.dataset.blatt;
  if (blatt === 'liga') ansicht.liga = null;
  zeichnen();
});

$('tempo').addEventListener('change', () => {
  if (blatt === 'spieltag') zeichnen();
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

startseite();
