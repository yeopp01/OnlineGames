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

document.getElementById('erstellen').addEventListener('click', () => {
  const name = teile.name.value.trim();
  if (!name) return melden('Bitte einen Namen eintragen.');
  localStorage.setItem('name', name);
  melden('');
  verbinden(() => senden({ typ: 'erstellen', name }));
});

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

// Nach einem Neuladen zurueck in die eigene Partie, ohne Code abzutippen.
const platz = sessionStorage.getItem('platz');
if (platz) {
  const { code, token } = JSON.parse(platz);
  verbinden(() => senden({ typ: 'zurueck', code, token }));
}
