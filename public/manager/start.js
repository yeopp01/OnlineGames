// @ts-check
// Der Einstieg des Managerspiels (/manager.html): Anmeldung, die Startseite
// mit den Spielstaenden und der Vereinswahl - und die acht Blaetter, die sich
// hier beim Kern eintragen.
import {
  $, BLAETTER, alle, anfragen, feld, lage, melden, zeichnen, zeigen,
} from './kern.js';
import { geld, text, zahl } from './teile.js';
import { blattBuero } from './buero.js';
import { blattMannschaft } from './mannschaft.js';
import { blattKader } from './kader.js';
import { blattSpieltag } from './spieltag.js';
import { blattLiga } from './liga.js';
import { blattPokal } from './pokal.js';
import { blattTransfer } from './transfer.js';
import { blattFinanzen } from './finanzen.js';
import { blattLive } from './live.js';

Object.assign(BLAETTER, {
  buero: blattBuero,
  mannschaft: blattMannschaft,
  kader: blattKader,
  spieltag: blattSpieltag,
  liga: blattLiga,
  pokal: blattPokal,
  transfer: blattTransfer,
  finanzen: blattFinanzen,
  live: blattLive,
});

// ---------------------------------------------------------- Anmeldung

$('formAnmelden').addEventListener('submit', async (e) => {
  e.preventDefault();
  const hinweis = $('anmeldeMeldung');
  hinweis.hidden = true;
  const antwort = await fetch('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: feld('anEmail').value.trim(), password: feld('anKennwort').value }),
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
  lage.kennung = null;
  lage.stand = null;
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
        <button data-loeschen="${s.id}" class="leise">Löschen</button>
      </div>`).join('')
    : '<p class="unterzeile">Noch kein Spielstand. Unten fängt eine Karriere an.</p>';
  alle('[data-fortsetzen]', $('spielstaende')).forEach((knopf) => {
    knopf.addEventListener('click', () => oeffnen(knopf.dataset.fortsetzen));
  });
  alle('[data-loeschen]', $('spielstaende')).forEach((knopf) => {
    knopf.addEventListener('click', async () => {
      // Zweimal klicken statt eines Browser-Dialogs: der blockiert die Seite.
      if (!knopf.classList.contains('warnung')) {
        knopf.classList.add('warnung');
        knopf.textContent = 'Wirklich löschen?';
        return;
      }
      await anfragen(`/api/manager/spielstaende/${knopf.dataset.loeschen}`, { methode: 'DELETE' });
      startseite();
    });
  });
  $('neuHinweis').textContent = liste.length >= 5 ? 'Fünf Spielstände sind das Höchste - lösche einen, um neu anzufangen.' : '';
  if (!$('vereinswahl').children.length) vereineZeigen();
}

async function vereineZeigen() {
  const startwert = Number(feld('startwert').value.trim());
  if (!Number.isInteger(startwert)) return melden('Der Startwert muss eine ganze Zahl sein.', true);
  const daten = await anfragen(`/api/manager/vereine?startwert=${startwert}`);
  if (!daten.vereine) return undefined;
  const karte = (v) => `
    <button class="vereinskarte" data-verein="${v.id}">
      <b>${text(v.name)}</b>
      <small>Kader ${v.niveau} · erwartet Platz ${v.erwartet}</small>
      <small>Konto ${geld(v.konto)} · ${zahl(v.plaetze)} Plätze · Kaderwert ${geld(v.kaderwert)}</small>
    </button>`;
  $('vereinswahl').innerHTML = [1, 2].map((nummer) => `
    <section>
      <h2>${nummer}. Liga</h2>
      <div class="vereinsliste">${daten.vereine.filter((v) => v.liga === nummer).sort((a, b) => a.erwartet - b.erwartet).map(karte).join('')}</div>
    </section>`).join('');
  alle('[data-verein]', $('vereinswahl')).forEach((knopf) => {
    knopf.addEventListener('click', () => anlegen(startwert, knopf.dataset.verein));
  });
  return undefined;
}

async function anlegen(startwert, vereinId) {
  const daten = await anfragen('/api/manager/spielstaende', {
    methode: 'POST', koerper: { startwert, vereinId, name: feld('neuName').value.trim() },
  });
  if (!daten.id) return;
  lage.kennung = daten.id;
  lage.blatt = 'buero';
  lage.markt = null;
  zeigen('spiel');
  zeichnen();
}

async function oeffnen(id) {
  lage.kennung = id;
  lage.stand = null;
  lage.elfLokal = null;
  lage.markt = null;
  lage.blatt = 'buero';
  const daten = await anfragen(`/api/manager/spielstaende/${id}`);
  if (!daten.zustand) {
    lage.kennung = null;
    startseite();
    return;
  }
  zeigen('spiel');
  zeichnen();
}

$('vereineLaden').addEventListener('click', vereineZeigen);
$('zurStart').addEventListener('click', startseite);

// Fuer den Browserlauf (e2e/helpers/seite.mjs): welcher Spielstand offen ist,
// und ihn neu oeffnen, nachdem ein Pruefgriff ihn geaendert hat. Ein Modul
// hat keine Namen im globalen Raum wie vorher das eine Skript.
/** @type {any} */ (window).managerspiel = {
  get kennung() { return lage.kennung; },
  oeffnen,
};

startseite();
