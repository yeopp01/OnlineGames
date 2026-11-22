// @ts-check
'use strict';

// Der Anfrageweg zu den eigenen Partiestaenden (speichern AC-12, AC-13):
// auflisten, oeffnen, umbenennen, loeschen. Jede Anfrage verlangt die
// Anmeldung und traegt das Konto bis in die Abfrage - geprueft bei jedem
// Zugriff, nicht nur beim Anzeigen der Liste. Kein Spiel wird hier geladen:
// zum Oeffnen bekommt der Weg die Steckbriefe von aussen und fragt den, dessen
// Art im Stand steht, nach `laden` (ADR-0006).
//
// Oeffnen heisst hier: der Server laedt den Stand und sagt, ob es ging - und
// ob es der vorige war, weil der neueste kaputt ist (AC-6). Fortsetzen in
// einem neuen Raum kommt mit der Liste im Vorraum (S3, AC-7 bis AC-11).

const PFAD = '/api/partien';

function antworten(antwort, code, wert) {
  antwort.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  antwort.end(JSON.stringify(wert));
}

const fehlerhaft = (antwort, text, code = 400) => antworten(antwort, code, { fehler: text });
const GIBT_ES_NICHT = 'Diesen Spielstand gibt es nicht.';
const KOERPER_MAX = 4 * 1024;

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

/**
 * @param {object} teile
 * @param {InstanceType<typeof import('./partiestaende').Partiestaende>} teile.ablage
 * @param {{ zugErlaubt(adresse: string): boolean, rechnenErlaubt(adresse: string): boolean }} teile.schutz
 * @param {(anfrage: import('node:http').IncomingMessage) => string} teile.adresseVon
 * @param {(kopfzeilen: import('node:http').IncomingHttpHeaders) => Promise<{ user: { id: string } } | null>} teile.sitzung
 * @param {Array<{ art: string, laden?: (bytes: Uint8Array) => unknown }>} teile.spiele  die Steckbriefe
 */
function partienWeg({ ablage, schutz, adresseVon, sitzung, spiele }) {
  /**
   * @param {import('node:http').IncomingMessage} anfrage
   * @param {import('node:http').ServerResponse} antwort
   */
  async function behandeln(anfrage, antwort) {
    const adresse = adresseVon(anfrage);
    const url = new URL(anfrage.url || '/', 'http://x');
    const teile = url.pathname.slice(PFAD.length).split('/').filter(Boolean);
    const methode = anfrage.method;

    // Die Bremse vor der Anmeldung (ADR-0005).
    if (!schutz.zugErlaubt(adresse)) return fehlerhaft(antwort, 'Zu schnell hintereinander.', 429);
    const angemeldet = await sitzung(anfrage.headers);
    if (!angemeldet) return fehlerhaft(antwort, 'Gespeicherte Partien gibt es nur mit Anmeldung.', 401);
    const konto = angemeldet.user.id;

    if (teile.length === 0) {
      if (methode !== 'GET') return fehlerhaft(antwort, 'Falsche Methode.', 405);
      return antworten(antwort, 200, { partien: ablage.liste(konto) });
    }
    const [id, was] = teile;
    if (teile.length > 2) return fehlerhaft(antwort, 'Unbekannte Abfrage.', 404);

    if (!was && methode === 'GET') {
      // Laden rechnet (eine grosse Partie 15 ms) - die engere Bremse.
      if (!schutz.rechnenErlaubt(adresse)) return fehlerhaft(antwort, 'Zu viele Anfragen. Bitte kurz warten.', 429);
      const spielVon = (art) => spiele.find((s) => s.art === art && typeof s.laden === 'function');
      const offen = ablage.oeffnen(konto, id, (bytes, zeile) => {
        const spiel = spielVon(zeile.art);
        if (!spiel || !spiel.laden) throw new Error('Dieses Spiel lässt sich nicht fortsetzen.');
        return spiel.laden(bytes);
      });
      if (!offen) return fehlerhaft(antwort, GIBT_ES_NICHT, 404);
      const geladen = 'geladen' in offen;
      return antworten(antwort, 200, {
        partie: offen.zeile,
        ladbar: geladen,
        vorher: geladen ? offen.vorher : false,
        ...(offen.fehler ? { fehler: offen.fehler } : {}),
      });
    }
    if (!was && methode === 'DELETE') {
      return ablage.loeschen(konto, id) ? antworten(antwort, 200, { ok: true }) : fehlerhaft(antwort, GIBT_ES_NICHT, 404);
    }
    if (was === 'name' && methode === 'POST') {
      const n = await koerperLesen(anfrage);
      return ablage.umbenennen(konto, id, n.name) ? antworten(antwort, 200, { ok: true }) : fehlerhaft(antwort, GIBT_ES_NICHT, 404);
    }
    return fehlerhaft(antwort, 'Unbekannte Abfrage.', 404);
  }

  return {
    /** Gibt true zurueck, wenn die Anfrage hier hingehoert. */
    behandeln(anfrage, antwort) {
      const pfad = (anfrage.url || '').split('?')[0];
      if (pfad !== PFAD && !pfad.startsWith(`${PFAD}/`)) return false;
      behandeln(anfrage, antwort).catch((fehler) => {
        if (!antwort.headersSent) fehlerhaft(antwort, fehler.message || 'Fehler', 400);
      });
      return true;
    },
  };
}

module.exports = { partienWeg };
