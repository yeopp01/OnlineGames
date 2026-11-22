// @ts-check
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
        scheitern(new Error('Die Nachricht ist zu groß.'));
        anfrage.destroy();
      }
    });
    anfrage.on('end', () => {
      try {
        fertig(roh ? JSON.parse(roh) : {});
      } catch {
        scheitern(new Error('Unverständliche Nachricht.'));
      }
    });
    anfrage.on('error', scheitern);
  });
}

const ganzeZahl = (wert) => (Number.isInteger(wert) ? wert : null);
const zahlOderNichts = (wert) => (wert === undefined || wert === null || wert === '' ? undefined : Number(wert));

// Die Zuege. Jeder bekommt die Karriere, die Nachricht und den Manager, der
// zieht, und gibt zurueck, was geschah - oder den Satz, warum nicht.
const ZUEGE = {
  weiter: (k) => k.weiter(),
  vorspulen: (k, n) => k.vorspulen({ anzahl: ganzeZahl(n.anzahl), bis: typeof n.bis === 'string' ? n.bis : null }),
  taktik: (k, n, m) => k.taktikSetzen(m, {
    system: typeof n.system === 'string' ? n.system : undefined,
    ausrichtung: zahlOderNichts(n.ausrichtung),
    haerte: zahlOderNichts(n.haerte),
    pressing: zahlOderNichts(n.pressing),
  }),
  aufstellung: (k, n, m) => {
    if (Array.isArray(n.ids)) return k.aufstellen(m, n.ids.map(String), n.system ? String(n.system) : undefined);
    return n.frei ? k.aufstellungFreigeben(m) : k.aufstellenAutomatisch(m);
  },
  wechselregel: (k, n, m) => k.wechselregelSetzen(m, n.regel),
  training: (k, n, m) => k.trainingSetzen(m, Number(n.wert)),
  schwerpunkt: (k, n, m) => k.schwerpunktSetzen(m, String(n.schwerpunkt)),
  eintritt: (k, n, m) => k.eintrittSetzen(m, Number(n.preis)),
  sponsor: (k, n, m) => k.sponsorWaehlen(m, String(n.id)),
  stadion: (k, n, m) => k.stadionAusbauen(m, Number(n.stufe)),
  kaufen: (k, n, m) => k.kaufen(m, String(n.spielerId), Number(n.gebot), Number(n.laufzeit)),
  verlaengern: (k, n, m) => k.verlaengern(m, String(n.spielerId), Number(n.laufzeit)),
  freistellen: (k, n, m) => k.spielerFreistellen(m, String(n.spielerId)),
  transferliste: (k, n, m) => k.transferlisteSetzen(m, String(n.spielerId), Boolean(n.an)),
  annehmen: (k, n, m) => k.angebotAnnehmen(m, String(n.angebotId)),
  ablehnen: (k, n, m) => k.angebotAblehnen(m, String(n.angebotId)),
  stelle: (k, n, m) => k.stelleAntreten(m, String(n.vereinId)),
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
 * @param {{zugErlaubt(adresse: string): boolean, rechnenErlaubt(adresse: string): boolean}} teile.schutz  aus server/schutz.js
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
    if (!angemeldet) return fehlerhaft(antwort, 'Zum Managerspiel ist eine Anmeldung nötig.', 401);
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
      if (!schutz.rechnenErlaubt(adresse)) return fehlerhaft(antwort, 'Zu viele neue Spielstände. Bitte kurz warten.', 429);
      const startwert = ganzeZahl(n.startwert) ?? Math.floor(Math.random() * 1e9);
      const name = typeof n.name === 'string' && n.name.trim() ? n.name.trim().slice(0, 40) : 'Neue Karriere';
      const angelegt = staende.anlegen(konto, { startwert, vereinId: typeof n.vereinId === 'string' ? n.vereinId : null, name });
      if (angelegt.fehler) return fehlerhaft(antwort, angelegt.fehler, 409);
      return antworten(antwort, 200, { id: angelegt.id, zustand: angelegt.karriere.zustand(angelegt.karriere.manager[0]?.managerId) });
    }

    const id = teile[1];
    const geoeffnet = staende.oeffnen(konto, id);
    if (!geoeffnet) return fehlerhaft(antwort, 'Diesen Spielstand gibt es nicht.', 404);
    if (geoeffnet.fehler) return fehlerhaft(antwort, geoeffnet.fehler, 409);
    const { karriere } = geoeffnet;
    // Ein Spielstand hat bisher genau einen Menschen (M0.4: die Welt kennt
    // schon mehrere, der Anfrageweg noch nicht).
    const managerId = karriere.manager[0]?.managerId ?? null;
    const was = teile[2];

    if (methode === 'DELETE' && !was) {
      staende.loeschen(konto, id);
      return antworten(antwort, 200, { ok: true });
    }
    if (methode === 'GET') {
      if (!was) return antworten(antwort, 200, { id, zustand: karriere.zustand(managerId) });
      if (was === 'markt') return antworten(antwort, 200, { markt: karriere.markt(managerId, marktFilter(url.searchParams)) });
      if (was === 'spieler' && teile[3]) {
        const akte = karriere.spielerAkte(teile[3]);
        return akte.fehler ? fehlerhaft(antwort, akte.fehler, 404) : antworten(antwort, 200, { spieler: akte });
      }
      if (was === 'verein' && teile[3]) {
        const ansicht = karriere.vereinAnsicht(managerId, teile[3]);
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
    const ergebnis = zug(karriere, n, managerId) || {};
    if (!ergebnis.fehler) staende.schreiben(konto, id, karriere);
    // Immer den ganzen Zustand zurueck: der Browser soll nicht raten muessen,
    // was ein Zug alles bewegt hat.
    return antworten(antwort, ergebnis.fehler ? 400 : 200, { ...ergebnis, zustand: karriere.zustand(managerId) });
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
