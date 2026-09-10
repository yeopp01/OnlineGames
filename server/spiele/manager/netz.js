'use strict';

// Der Anfrageweg des Managerspiels. Er liegt hier und nicht in `index.js`,
// weil dort nichts Spielspezifisches stehen darf
// (→ docs/adr/0006-mehrere-spiele.md).
//
// Rundenbasiert heisst: HTTP genuegt. Es gibt nichts zu schieben, solange
// niemand einen Zug macht - eine offene Verbindung waere reine Kosten.
//
// Eroeffnen verlangt ein Konto: eine Karriere belegt Rechenzeit und Platz in
// der Datenbank, und sie gehoert jemandem. Deshalb geht hier nichts ohne
// Anmeldung - geprueft bei jeder Anfrage, nicht nur beim Anlegen.
const { Spielstaende } = require('./spielstaende');
const kader = require('./kader');

const KOERPER_MAX = 16 * 1024;

function antworten(antwort, code, wert) {
  antwort.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  antwort.end(JSON.stringify(wert));
}

const fehlerhaft = (antwort, text, code = 400) => antworten(antwort, code, { fehler: text });

function koerperLesen(anfrage) {
  return new Promise((fertig, scheitern) => {
    let roh = '';
    anfrage.on('data', (stueck) => {
      roh += stueck;
      if (roh.length > KOERPER_MAX) {
        scheitern(new Error('Die Nachricht ist zu gross.'));
        anfrage.destroy();
      }
    });
    anfrage.on('end', () => {
      try {
        fertig(roh ? JSON.parse(roh) : {});
      } catch {
        scheitern(new Error('Unverstaendliche Nachricht.'));
      }
    });
    anfrage.on('error', scheitern);
  });
}

const ganzeZahl = (wert) => (Number.isInteger(wert) ? wert : null);
const zahlOderNichts = (wert) => (wert === undefined || wert === null || wert === '' ? undefined : Number(wert));

// Die Zuege. Jeder bekommt die Karriere und die Nachricht und gibt zurueck,
// was geschah - oder den Satz, warum nicht.
const ZUEGE = {
  weiter: (k) => k.weiter(),
  vorspulen: (k, n) => k.vorspulen({ anzahl: ganzeZahl(n.anzahl), bis: typeof n.bis === 'string' ? n.bis : null }),
  taktik: (k, n) => k.taktikSetzen({
    system: typeof n.system === 'string' ? n.system : undefined,
    ausrichtung: zahlOderNichts(n.ausrichtung),
    haerte: zahlOderNichts(n.haerte),
    pressing: zahlOderNichts(n.pressing),
  }),
  aufstellung: (k, n) => {
    if (Array.isArray(n.ids)) return k.aufstellen(n.ids.map(String), String(n.system || k.verein?.taktik.system));
    return n.frei ? k.aufstellungFreigeben() : k.aufstellenAutomatisch();
  },
  wechselregel: (k, n) => k.wechselregelSetzen(n.regel),
  training: (k, n) => k.trainingSetzen(Number(n.wert)),
  schwerpunkt: (k, n) => k.schwerpunktSetzen(String(n.schwerpunkt)),
  eintritt: (k, n) => k.eintrittSetzen(Number(n.preis)),
  sponsor: (k, n) => k.sponsorWaehlen(String(n.id)),
  stadion: (k, n) => k.stadionAusbauen(Number(n.stufe)),
  kaufen: (k, n) => k.kaufen(String(n.spielerId), Number(n.gebot), Number(n.laufzeit)),
  verlaengern: (k, n) => k.verlaengern(String(n.spielerId), Number(n.laufzeit)),
  freistellen: (k, n) => k.spielerFreistellen(String(n.spielerId)),
  transferliste: (k, n) => k.transferlisteSetzen(String(n.spielerId), Boolean(n.an)),
  annehmen: (k, n) => k.angebotAnnehmen(String(n.angebotId)),
  ablehnen: (k, n) => k.angebotAblehnen(String(n.angebotId)),
  stelle: (k, n) => k.stelleAntreten(String(n.vereinId)),
};

// Zuege, die viel rechnen koennen, gehen durch die engere Bremse.
const TEUER = new Set(['vorspulen']);

function marktFilter(suche) {
  const zahl = (name) => (suche.has(name) && suche.get(name) !== '' ? Number(suche.get(name)) : undefined);
  return {
    position: kader.POSITIONEN.includes(suche.get('position')) ? suche.get('position') : undefined,
    liga: ['1', '2', 'frei'].includes(suche.get('liga')) ? suche.get('liga') : undefined,
    maxAlter: zahl('maxAlter'),
    minStaerke: zahl('minStaerke'),
    maxPreis: zahl('maxPreis'),
    sortierung: suche.get('sortierung') || undefined,
    anzahl: zahl('anzahl'),
  };
}

/**
 * Baut den Anfragebehandler. Schutz und Anmeldung kommen von aussen - sie
 * gehoeren der Plattform, nicht dem Spiel
 * (→ docs/adr/0005-grenzen-statt-vertrauen.md).
 *
 * @param {object} teile
 * @param {object} teile.schutz
 * @param {Function} teile.adresseVon
 * @param {import('node:sqlite').DatabaseSync} teile.db  die Datenbank der Konten
 * @param {Function} teile.sitzung  (kopfzeilen) => Promise<{user}|null>
 */
function manager({ schutz, adresseVon, db, sitzung }) {
  const staende = new Spielstaende(db);

  async function behandeln(anfrage, antwort) {
    const adresse = adresseVon(anfrage);
    const url = new URL(anfrage.url, 'http://x');
    const teile = url.pathname.split('/').filter(Boolean).slice(2); // hinter /api/manager/
    const methode = anfrage.method;

    // Die Bremse vor der Anmeldung: wer ohne Konto haemmert, kostet trotzdem.
    if (!schutz.zugErlaubt(adresse)) return fehlerhaft(antwort, 'Zu schnell hintereinander.', 429);
    const angemeldet = await sitzung(anfrage.headers);
    if (!angemeldet) return fehlerhaft(antwort, 'Zum Managerspiel ist eine Anmeldung noetig.', 401);
    const konto = angemeldet.user.id;

    // Die Vereinswahl vor dem Anlegen: beide Ligen, mit dem, was man wissen muss.
    if (teile[0] === 'vereine' && teile.length === 1 && methode === 'GET') {
      const startwert = Number(url.searchParams.get('startwert'));
      if (!Number.isInteger(startwert)) return fehlerhaft(antwort, 'Startwert muss eine ganze Zahl sein.');
      const { vereine } = kader.weltErzeugen(startwert);
      const rang = (verein) => vereine.filter((v) => v.liga === verein.liga)
        .sort((a, b) => kader.niveau(b) - kader.niveau(a)).indexOf(verein) + 1;
      return antworten(antwort, 200, {
        startwert,
        vereine: vereine.map((v) => ({
          id: v.id,
          name: v.name,
          liga: v.liga,
          erwartet: rang(v),
          niveau: Math.round(kader.niveau(v)),
          konto: v.konto,
          plaetze: v.stadion.plaetze,
          kaderwert: v.spieler.reduce((s, x) => s + kader.marktwert(x), 0),
        })),
      });
    }

    if (teile[0] !== 'spielstaende') return fehlerhaft(antwort, 'Unbekannte Abfrage.', 404);

    if (teile.length === 1) {
      // Der Name steht gleich dabei: so fragt die Seite nicht noch einmal nach
      // der Sitzung, und die Grenzen der Anmeldung bleiben fuer das Anmelden.
      if (methode === 'GET') {
        return antworten(antwort, 200, { konto: { name: angemeldet.user.name }, spielstaende: staende.liste(konto) });
      }
      if (methode !== 'POST') return fehlerhaft(antwort, 'Falsche Methode.', 405);
      const n = await koerperLesen(anfrage);
      // Die Bremse steht hinter dem Lesen, aber vor dem Rechnen: eine neue
      // Welt sind 36 Vereine und 750 Spieler.
      if (!schutz.rechnenErlaubt(adresse)) return fehlerhaft(antwort, 'Zu viele neue Spielstaende. Bitte kurz warten.', 429);
      const startwert = ganzeZahl(n.startwert) ?? Math.floor(Math.random() * 1e9);
      const name = typeof n.name === 'string' && n.name.trim() ? n.name.trim().slice(0, 40) : 'Neue Karriere';
      const angelegt = staende.anlegen(konto, { startwert, vereinId: typeof n.vereinId === 'string' ? n.vereinId : null, name });
      if (angelegt.fehler) return fehlerhaft(antwort, angelegt.fehler, 409);
      return antworten(antwort, 200, { id: angelegt.id, zustand: angelegt.karriere.zustand() });
    }

    const id = teile[1];
    const geoeffnet = staende.oeffnen(konto, id);
    if (!geoeffnet) return fehlerhaft(antwort, 'Diesen Spielstand gibt es nicht.', 404);
    if (geoeffnet.fehler) return fehlerhaft(antwort, geoeffnet.fehler, 409);
    const { karriere } = geoeffnet;
    const was = teile[2];

    if (methode === 'DELETE' && !was) {
      staende.loeschen(konto, id);
      return antworten(antwort, 200, { ok: true });
    }
    if (methode === 'GET') {
      if (!was) return antworten(antwort, 200, { id, zustand: karriere.zustand() });
      if (was === 'markt') return antworten(antwort, 200, { markt: karriere.markt(marktFilter(url.searchParams)) });
      if (was === 'spieler' && teile[3]) {
        const akte = karriere.spielerAkte(teile[3]);
        return akte.fehler ? fehlerhaft(antwort, akte.fehler, 404) : antworten(antwort, 200, { spieler: akte });
      }
      if (was === 'verein' && teile[3]) {
        const ansicht = karriere.vereinAnsicht(teile[3]);
        return ansicht.fehler ? fehlerhaft(antwort, ansicht.fehler, 404) : antworten(antwort, 200, { verein: ansicht });
      }
      return fehlerhaft(antwort, 'Unbekannte Abfrage.', 404);
    }
    if (methode !== 'POST') return fehlerhaft(antwort, 'Falsche Methode.', 405);
    const zug = ZUEGE[was];
    if (!zug) return fehlerhaft(antwort, `Unbekannter Zug: ${was}`, 404);
    const n = await koerperLesen(anfrage);
    if (TEUER.has(was) && !schutz.rechnenErlaubt(adresse)) {
      return fehlerhaft(antwort, 'Zu viele Berechnungen. Bitte kurz warten.', 429);
    }
    const ergebnis = zug(karriere, n) || {};
    if (!ergebnis.fehler) staende.schreiben(konto, id, karriere);
    // Immer den ganzen Zustand zurueck: der Browser soll nicht raten muessen,
    // was ein Zug alles bewegt hat.
    return antworten(antwort, ergebnis.fehler ? 400 : 200, { ...ergebnis, zustand: karriere.zustand() });
  }

  return {
    staende,
    halt: () => staende.halt(),
    // Gibt true zurueck, wenn die Anfrage hier hingehoert.
    behandeln(anfrage, antwort) {
      if (!(anfrage.url || '').startsWith('/api/manager/')) return false;
      behandeln(anfrage, antwort).catch((fehler) => {
        if (!antwort.headersSent) fehlerhaft(antwort, fehler.message || 'Fehler', fehler.message ? 400 : 500);
      });
      return true;
    },
  };
}

module.exports = { manager };
