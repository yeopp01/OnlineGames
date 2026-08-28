'use strict';

// Konten, Sitzungen und Einladungscodes. Better Auth laeuft als Bibliothek im
// Spielserver, die Daten liegen in derselben SQLite-Datei - kein zweiter
// Dienst, kein zusaetzlicher Speicher (→ docs/adr/0003-anmeldung.md).

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { randomBytes, randomInt, timingSafeEqual } = require('node:crypto');
const { betterAuth } = require('better-auth');
const { toNodeHandler, fromNodeHeaders } = require('better-auth/node');
const { getMigrations } = require('better-auth/db/migration');

const KENNWORT_MIN = 10;
const SITZUNG_TAGE = 30;
const EINLADUNG_TAGE = 14;
// Dieselben Zeichen wie beim Raumcode: vorlesbar, keine Verwechslung.
const ZEICHEN = 'BCDFGHJKLMNPQRSTVWXZ23456789';
const EINLADUNG_LAENGE = 8;

function einladungErzeugen() {
  let code = '';
  for (let i = 0; i < EINLADUNG_LAENGE; i++) code += ZEICHEN[randomInt(ZEICHEN.length)];
  return code;
}

function einladungLesen(eingabe) {
  return String(eingabe || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Vergleich ohne Zeitunterschied. Ein Code ist kurz genug, dass eine
// Laufzeitmessung sonst etwas verraten koennte.
function gleich(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

function datenbank(datei) {
  if (datei !== ':memory:') fs.mkdirSync(path.dirname(datei), { recursive: true });
  const db = new DatabaseSync(datei);
  db.exec(`
    CREATE TABLE IF NOT EXISTS einladung (
      code       TEXT PRIMARY KEY,
      angelegt   INTEGER NOT NULL,
      laeuft_ab  INTEGER NOT NULL,
      benutzt_am INTEGER,
      benutzt_von TEXT,
      notiz      TEXT
    )`);
  return db;
}

class Einladungen {
  constructor(db, uhr = () => Date.now()) {
    this.db = db;
    this.uhr = uhr;
  }

  anlegen(notiz = null, tage = EINLADUNG_TAGE) {
    const code = einladungErzeugen();
    const jetzt = this.uhr();
    this.db.prepare(
      'INSERT INTO einladung (code, angelegt, laeuft_ab, notiz) VALUES (?, ?, ?, ?)',
    ).run(code, jetzt, jetzt + tage * 24 * 60 * 60 * 1000, notiz);
    return code;
  }

  // Gibt den Grund zurueck, warum es nicht geht - oder null, wenn es geht.
  pruefen(eingabe) {
    const code = einladungLesen(eingabe);
    if (!code) return 'Ohne Einladungscode kann kein Konto entstehen.';
    const eintrag = this.db.prepare('SELECT * FROM einladung WHERE code = ?').get(code);
    // Immer dieselbe Meldung: ob ein Code existiert, geht niemanden etwas an.
    const abgelehnt = 'Dieser Einladungscode ist nicht gueltig.';
    if (!eintrag) return abgelehnt;
    if (!gleich(eintrag.code, code)) return abgelehnt;
    if (eintrag.benutzt_am) return abgelehnt;
    if (eintrag.laeuft_ab < this.uhr()) return abgelehnt;
    return null;
  }

  verbrauchen(eingabe, wer) {
    const code = einladungLesen(eingabe);
    // Nur verbrauchen, was noch frei ist - sonst gewinnen zwei gleichzeitige
    // Anmeldungen beide mit demselben Code.
    const ergebnis = this.db.prepare(
      'UPDATE einladung SET benutzt_am = ?, benutzt_von = ? WHERE code = ? AND benutzt_am IS NULL',
    ).run(this.uhr(), wer || null, code);
    return ergebnis.changes === 1;
  }

  zuruecknehmen(eingabe) {
    const ergebnis = this.db.prepare('DELETE FROM einladung WHERE code = ? AND benutzt_am IS NULL')
      .run(einladungLesen(eingabe));
    return ergebnis.changes === 1;
  }

  liste() {
    return this.db.prepare('SELECT * FROM einladung ORDER BY angelegt DESC').all();
  }
}

async function konten(einstellungen = {}) {
  const datei = einstellungen.datei || path.join(__dirname, '..', 'daten', 'konten.sqlite');
  const adresse = einstellungen.adresse || `http://localhost:${einstellungen.hafen || 4180}`;
  const geheimnis = einstellungen.geheimnis
    || process.env.KONTEN_GEHEIMNIS
    // Ohne gesetztes Geheimnis wird eines erzeugt: gut fuer Tests, im Betrieb
    // meldet der Start eine Warnung, weil dann jeder Neustart alle Sitzungen
    // ungueltig macht.
    || randomBytes(32).toString('hex');

  const db = datenbank(datei);
  const einladungen = new Einladungen(db, einstellungen.uhr);

  const auth = betterAuth({
    database: db,
    secret: geheimnis,
    baseURL: adresse,
    basePath: '/api/auth',
    trustedOrigins: einstellungen.vertrauteHerkunft || [adresse],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: KENNWORT_MIN,
      // Bestaetigung per Mail kommt, sobald ein Mailweg steht. Bis dahin
      // ist der Einladungscode das, was ein Konto rechtfertigt.
      requireEmailVerification: false,
    },
    session: {
      expiresIn: SITZUNG_TAGE * 24 * 60 * 60,
      updateAge: 24 * 60 * 60,
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 30,
      customRules: {
        // Anmelden und Registrieren sind die Wege, die sich zu erraten lohnen.
        '/sign-in/email': { window: 60 * 60, max: 5 },
        '/sign-up/email': { window: 60 * 60, max: 10 },
      },
    },
    advanced: {
      cookiePrefix: 'onlinegames',
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: 'lax',
        secure: adresse.startsWith('https://'),
      },
    },
    ...einstellungen.mehr,
  });

  // Schema anlegen, ohne den CLI-Umweg.
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();

  const behandeln = toNodeHandler(auth);

  // Der Einladungscode wird vor Better Auth geprueft und danach verbraucht.
  // Bewusst davor statt ueber interne Haken: so haengt die Regel nicht an
  // Innereien der Bibliothek und laesst sich einzeln pruefen.
  async function behandelnMitEinladung(anfrage, antwort) {
    const istAnmeldung = anfrage.method === 'POST'
      && /\/sign-up\//.test(anfrage.url || '');
    if (!istAnmeldung) return behandeln(anfrage, antwort);

    const roh = await koerperLesen(anfrage);
    let daten;
    try {
      daten = JSON.parse(roh || '{}');
    } catch {
      return absagen(antwort, 400, 'Unverstaendliche Anfrage.');
    }

    const grund = einladungen.pruefen(daten.einladung);
    if (grund) return absagen(antwort, 403, grund);

    // Better Auth liest den Koerper selbst - er ist hier schon gelesen,
    // also wird er neu untergeschoben, ohne das Feld `einladung`.
    const { einladung, ...rest } = daten;
    const nachgereicht = koerperNachreichen(anfrage, JSON.stringify(rest));

    const beobachtet = antwortBeobachten(antwort, (status) => {
      if (status >= 200 && status < 300) einladungen.verbrauchen(einladung, rest.email);
    });
    return behandeln(nachgereicht, beobachtet);
  }

  async function sitzung(kopfzeilen) {
    try {
      return await auth.api.getSession({ headers: fromNodeHeaders(kopfzeilen) });
    } catch {
      return null;
    }
  }

  return {
    auth,
    db,
    einladungen,
    behandeln: behandelnMitEinladung,
    sitzung,
    geheimnisGesetzt: Boolean(einstellungen.geheimnis || process.env.KONTEN_GEHEIMNIS),
    schliessen: () => db.close(),
  };
}

function koerperLesen(anfrage) {
  return new Promise((fertig, scheitern) => {
    let inhalt = '';
    anfrage.on('data', (stueck) => {
      inhalt += stueck;
      if (inhalt.length > 16 * 1024) scheitern(new Error('zu gross'));
    });
    anfrage.on('end', () => fertig(inhalt));
    anfrage.on('error', scheitern);
  });
}

// Eine bereits gelesene Anfrage noch einmal lesbar machen.
function koerperNachreichen(anfrage, text) {
  const { Readable } = require('node:stream');
  const neu = Readable.from([Buffer.from(text)]);
  neu.method = anfrage.method;
  neu.url = anfrage.url;
  neu.headers = { ...anfrage.headers, 'content-length': String(Buffer.byteLength(text)) };
  neu.httpVersion = anfrage.httpVersion;
  neu.socket = anfrage.socket;
  return neu;
}

// Auf den Statuscode warten, ohne die Antwort zu veraendern.
function antwortBeobachten(antwort, dann) {
  const urspruenglich = antwort.writeHead.bind(antwort);
  antwort.writeHead = (status, ...rest) => {
    dann(status);
    return urspruenglich(status, ...rest);
  };
  const urspruenglichEnde = antwort.end.bind(antwort);
  antwort.end = (...rest) => {
    if (!antwort.headersSent) dann(antwort.statusCode);
    return urspruenglichEnde(...rest);
  };
  return antwort;
}

function absagen(antwort, status, text) {
  antwort.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  antwort.end(JSON.stringify({ message: text }));
}

module.exports = { konten, Einladungen, einladungErzeugen, einladungLesen, KENNWORT_MIN };
