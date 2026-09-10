// Gemeinsames Werkzeug fuer die Tests, die ueber den echten Anfrageweg gehen.
import WebSocket from 'ws';

// Ein Testkunde, der Nachrichten sammelt und auf eine bestimmte wartet.
// Mit `kekse` verbindet er sich als angemeldeter Benutzer.
export function kunde(hafen, kekse = null) {
  const draht = new WebSocket(`ws://localhost:${hafen}`, {
    headers: kekse ? { cookie: kekse } : {},
  });
  const eingang = [];
  const wartende = [];
  draht.on('message', (roh) => {
    const nachricht = JSON.parse(roh.toString());
    eingang.push(nachricht);
    for (let i = wartende.length - 1; i >= 0; i--) {
      if (wartende[i].passt(nachricht)) wartende.splice(i, 1)[0].fertig(nachricht);
    }
  });
  return {
    draht,
    eingang,
    offen: () => new Promise((fertig, scheitern) => {
      draht.on('open', fertig);
      draht.on('error', scheitern);
    }),
    senden: (n) => draht.send(JSON.stringify(n)),
    warteAuf(passt, frist = 5000) {
      const treffer = eingang.find(passt);
      if (treffer) return Promise.resolve(treffer);
      return new Promise((fertig, scheitern) => {
        const uhr = setTimeout(() => scheitern(new Error('Nichts empfangen')), frist);
        wartende.push({ passt, fertig: (n) => { clearTimeout(uhr); fertig(n); } });
      });
    },
    zuende: () => new Promise((fertig) => draht.on('close', (code) => fertig(code))),
    zu: () => draht.close(),
  };
}

export const istTyp = (typ) => (n) => n.typ === typ;

// Alles zumachen, was den Prozess sonst offen haelt. `fetch` haelt seine
// Verbindungen absichtlich am Leben - ohne closeAllConnections endet der
// Testlauf nie, und zwar nur dort, wo das Aufraeumen langsamer ist als der
// Rechner daheim.
export function beenden(laufend) {
  laufend.manager?.halt();
  laufend.zugang.schliessen();
  laufend.schutz.halt();
  laufend.raeume.halt();
  for (const draht of laufend.wss.clients) draht.terminate();
  laufend.wss.close();
  laufend.server.closeAllConnections();
  laufend.server.close();
}
export const warte = (ms) => new Promise((fertig) => setTimeout(fertig, ms));

// Ein Konto anlegen und die Sitzungskekse zurueckgeben. Genau der Weg, den
// auch der Browser geht: Einladungscode, Registrieren, Cookie behalten.
export async function konto(hafen, laufend, {
  email = `anna${Math.round(performance.now() * 1000)}@example.test`,
  name = 'Anna',
  kennwort = 'einLangesKennwort',
  einladung = undefined,
} = {}) {
  const code = einladung === undefined ? laufend.zugang.einladungen.anlegen('Test') : einladung;
  const antwort = await fetch(`http://localhost:${hafen}/api/auth/sign-up/email`, {
    method: 'POST',
    // Better Auth verlangt eine bekannte Herkunft - das ist der CSRF-Schutz.
    // Ein Browser schickt sie von selbst, hier muss sie gesetzt werden.
    headers: { 'Content-Type': 'application/json', Origin: `http://localhost:${hafen}` },
    body: JSON.stringify({ email, password: kennwort, name, einladung: code }),
  });
  const kekse = (antwort.headers.getSetCookie?.() || [])
    .map((k) => k.split(';')[0]).join('; ');
  return {
    ok: antwort.ok,
    status: antwort.status,
    koerper: await antwort.json().catch(() => ({})),
    kekse,
    email,
    name,
    kennwort,
    einladung: code,
  };
}

export async function anmelden(hafen, { email, kennwort }) {
  const antwort = await fetch(`http://localhost:${hafen}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: `http://localhost:${hafen}` },
    body: JSON.stringify({ email, password: kennwort }),
  });
  const kekse = (antwort.headers.getSetCookie?.() || [])
    .map((k) => k.split(';')[0]).join('; ');
  return { ok: antwort.ok, status: antwort.status, kekse };
}
