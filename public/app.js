import { Ansicht } from './ansicht.js';

const teile = {
  vorraum: document.getElementById('vorraum'),
  warteraum: document.getElementById('warteraum'),
  spiel: document.getElementById('spiel'),
  name: document.getElementById('name'),
  code: document.getElementById('code'),
  raumcode: document.getElementById('raumcode'),
  spielerliste: document.getElementById('spielerliste'),
  meldung: document.getElementById('meldung'),
  wartemeldung: document.getElementById('wartemeldung'),
  vorraete: document.getElementById('vorraete'),
  brett: document.getElementById('brett'),
  angemeldet: document.getElementById('angemeldet'),
  abgemeldet: document.getElementById('abgemeldet'),
  werName: document.getElementById('werName'),
  formAnmelden: document.getElementById('formAnmelden'),
  formRegistrieren: document.getElementById('formRegistrieren'),
  spiele: document.getElementById('spiele'),
};

let draht = null;
let ich = null;
let ansicht = null;

teile.name.value = localStorage.getItem('name') || '';

function zeigen(welcher) {
  teile.vorraum.hidden = welcher !== 'vorraum';
  teile.warteraum.hidden = welcher !== 'warteraum';
  teile.spiel.hidden = welcher !== 'spiel';
  document.body.style.display = welcher === 'spiel' ? 'block' : 'grid';
  // Im Spiel gehoert jede Bewegung der Karte, nicht der Seite.
  document.body.style.overflow = welcher === 'spiel' ? 'hidden' : '';
}

function melden(text, wo = teile.meldung) {
  wo.textContent = text;
  wo.hidden = !text;
}

function senden(nachricht) {
  if (draht && draht.readyState === WebSocket.OPEN) draht.send(JSON.stringify(nachricht));
}

function verbinden(dann) {
  const schema = location.protocol === 'https:' ? 'wss' : 'ws';
  draht = new WebSocket(`${schema}://${location.host}`);
  draht.addEventListener('open', dann);
  draht.addEventListener('message', (e) => empfangen(JSON.parse(e.data)));
  draht.addEventListener('close', () => {
    if (ansicht) melden('Verbindung weg. Seite neu laden, um zurueckzukehren.', teile.wartemeldung);
  });
}

function empfangen(nachricht) {
  switch (nachricht.typ) {
    case 'du':
      ich = nachricht.id;
      // Fuer die Rueckkehr nach einem Absturz - lebt nur solange die Partie laeuft.
      sessionStorage.setItem('platz', JSON.stringify({ code: nachricht.code, token: nachricht.token }));
      teile.raumcode.textContent = nachricht.anzeige || nachricht.code;
      zeigen('warteraum');
      break;

    case 'raum':
      spielerlisteZeichnen(nachricht.spieler);
      break;

    case 'aufbau':
      if (!ansicht) {
        ansicht = new Ansicht(teile.brett, (einheiten, ziel) =>
          senden({ typ: 'befehl', einheiten, ziel }));
      }
      zeigen('spiel');
      ansicht.aufbau(nachricht, ich);
      break;

    case 'zustand':
      if (!ansicht) return;
      ansicht.zustand(nachricht);
      teile.vorraete.textContent =
        `Holz ${ansicht.vorraete.holz}  ·  Nahrung ${ansicht.vorraete.nahrung}`;
      break;

    case 'fehler':
      melden(nachricht.text, teile.warteraum.hidden ? teile.meldung : teile.wartemeldung);
      break;
  }
}

function spielerlisteZeichnen(spieler) {
  teile.spielerliste.innerHTML = '';
  for (const eintrag of spieler) {
    const zeile = document.createElement('li');
    if (!eintrag.verbunden) zeile.className = 'weg';
    const punkt = document.createElement('span');
    punkt.className = 'punkt';
    zeile.append(punkt, `${eintrag.name}${eintrag.id === ich ? ' (du)' : ''}`);
    teile.spielerliste.append(zeile);
  }
}

// ---- Spiele ------------------------------------------------------------
// Die Uebersicht zeigt, was der Server als Steckbriefe liefert. Ein neues
// Spiel braucht hier keine Zeile (→ specs/00-plattform/spielauswahl.md AC-2).

const STAND = { 'im-bau': 'im Bau', gesperrt: 'noch nicht spielbar' };

function spielerzahl({ von, bis }) {
  if (von === bis) return von === 1 ? 'allein' : `${von} Spieler`;
  return `${von} bis ${bis} Spieler`;
}

function eroeffnen() {
  // Kein Name noetig: der Server nimmt den aus dem Konto.
  melden('');
  verbinden(() => senden({ typ: 'erstellen' }));
}

function spielkarte(spiel) {
  const karte = document.createElement('li');
  karte.className = `spielkarte stand-${spiel.stand}`;
  karte.dataset.spiel = spiel.art;

  const kopf = document.createElement('div');
  kopf.className = 'spielkopf';
  const name = document.createElement('strong');
  name.textContent = spiel.name;
  kopf.append(name);
  if (STAND[spiel.stand]) {
    const marke = document.createElement('span');
    marke.className = 'marke';
    marke.textContent = STAND[spiel.stand];
    kopf.append(marke);
  }

  const satz = document.createElement('p');
  satz.className = 'spielsatz';
  satz.textContent = spiel.beschreibung;

  const fuss = document.createElement('div');
  fuss.className = 'spielfuss';
  const zahl = document.createElement('span');
  zahl.className = 'spielerzahl';
  zahl.textContent = spielerzahl(spiel.spieler);

  const knopf = document.createElement('button');
  knopf.className = 'haupt';
  knopf.dataset.oeffnen = spiel.art;
  if (spiel.stand === 'gesperrt') {
    knopf.disabled = true;
    knopf.textContent = 'gesperrt';
  } else if (spiel.einstieg.art === 'seite') {
    knopf.textContent = 'Oeffnen';
    knopf.addEventListener('click', () => location.assign(spiel.einstieg.adresse));
  } else {
    knopf.textContent = 'Eroeffnen';
    knopf.addEventListener('click', eroeffnen);
  }
  fuss.append(zahl, knopf);

  karte.append(kopf, satz, fuss);
  return karte;
}

async function spieleLaden() {
  try {
    const antwort = await fetch('/api/spiele');
    const { spiele } = await antwort.json();
    teile.spiele.replaceChildren(...spiele.map(spielkarte));
  } catch {
    melden('Die Liste der Spiele liess sich nicht laden.');
  }
}

document.getElementById('beitreten').addEventListener('click', () => {
  const name = teile.name.value.trim();
  // Bindestriche und Leerzeichen fallen weg - vorgelesen wird ABC-DEF.
  const code = teile.code.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!name) return melden('Bitte einen Namen eintragen.');
  if (code.length !== 6) return melden('Der Raumcode hat sechs Zeichen.');
  localStorage.setItem('name', name);
  melden('');
  verbinden(() => senden({ typ: 'beitreten', code, name }));
});

document.getElementById('starten').addEventListener('click', () => {
  melden('', teile.wartemeldung);
  senden({ typ: 'start' });
});

// ---- Konto -------------------------------------------------------------
// Die Sitzung liegt in einem HttpOnly-Keks; JavaScript kommt nicht daran und
// soll es auch nicht. Der Server sagt, wer da ist.

async function konto(weg, koerper) {
  const antwort = await fetch(`/api/auth/${weg}`, {
    method: koerper ? 'POST' : 'GET',
    headers: koerper ? { 'Content-Type': 'application/json' } : undefined,
    body: koerper ? JSON.stringify(koerper) : undefined,
  });
  const daten = await antwort.json().catch(() => ({}));
  return { ok: antwort.ok, status: antwort.status, daten };
}

async function sitzungPruefen() {
  const { ok, daten } = await konto('get-session');
  const wer = ok && daten && daten.user ? daten.user : null;
  teile.angemeldet.hidden = !wer;
  teile.abgemeldet.hidden = Boolean(wer);
  if (wer) {
    teile.werName.textContent = wer.name;
    // Wer angemeldet ist, tritt auch unter seinem Kontonamen bei.
    if (!teile.name.value) teile.name.value = wer.name;
    await spieleLaden();
  }
  return wer;
}

function reiter(aufRegistrieren) {
  document.getElementById('reiterAnmelden').setAttribute('aria-pressed', String(!aufRegistrieren));
  document.getElementById('reiterRegistrieren').setAttribute('aria-pressed', String(aufRegistrieren));
  teile.formAnmelden.hidden = aufRegistrieren;
  teile.formRegistrieren.hidden = !aufRegistrieren;
  melden('');
}

document.getElementById('reiterAnmelden').addEventListener('click', () => reiter(false));
document.getElementById('reiterRegistrieren').addEventListener('click', () => reiter(true));

teile.formAnmelden.addEventListener('submit', async (e) => {
  e.preventDefault();
  melden('');
  const { ok, daten } = await konto('sign-in/email', {
    email: document.getElementById('anEmail').value.trim(),
    password: document.getElementById('anKennwort').value,
  });
  // Nie verraten, welcher Teil falsch war.
  if (!ok) return melden(daten.message || 'Mailadresse oder Kennwort stimmen nicht.');
  await sitzungPruefen();
});

teile.formRegistrieren.addEventListener('submit', async (e) => {
  e.preventDefault();
  melden('');
  const { ok, daten } = await konto('sign-up/email', {
    einladung: document.getElementById('regEinladung').value,
    name: document.getElementById('regName').value.trim(),
    email: document.getElementById('regEmail').value.trim(),
    password: document.getElementById('regKennwort').value,
  });
  if (!ok) return melden(daten.message || 'Das Konto konnte nicht angelegt werden.');
  await sitzungPruefen();
});

document.getElementById('abmelden').addEventListener('click', async () => {
  await konto('sign-out', {});
  await sitzungPruefen();
});

// ---- Start -------------------------------------------------------------

await sitzungPruefen();

// Nach einem Neuladen zurueck in die eigene Partie, ohne Code abzutippen.
const platz = sessionStorage.getItem('platz');
if (platz) {
  const { code, token } = JSON.parse(platz);
  verbinden(() => senden({ typ: 'zurueck', code, token }));
}
