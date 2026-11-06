#!/usr/bin/env node
// Der Steuerstand ueberlebt den Autocompact.
//
// Bei langen Arbeitsschleifen (/loop /strategie-weiterbauen) wird der
// Gespraechsverlauf irgendwann zusammengefasst. Dabei gehen Einzelheiten
// verloren: wo genau die Runde stand, welcher Befehl als naechster kommt,
// welche Falle schon bekannt ist. Deshalb liegt der Stand in einer Datei im
// Repo - und dieser Haken legt sie nach der Zusammenfassung wieder vor.
//
//   node .claude/hooks/steuerstand.mjs nach-compact   PostCompact
//   node .claude/hooks/steuerstand.mjs vor-compact    PreCompact
//   node .claude/hooks/steuerstand.mjs sitzungsstart  SessionStart
//   node .claude/hooks/steuerstand.mjs erinnern       UserPromptSubmit
//
// Jeder Aufruf liest die Hakennachricht von der Standardeingabe und antwortet
// mit JSON (→ .claude/settings.json).
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const STEUERSTAND = join(wurzel, 'docs', 'strategie', 'steuerstand.md');

// Ab wie viel neuem Gespraech der Steuerstand als veraltet gilt. Die Menge an
// Zeichen im Verlauf ist das einzige Mass, das ein Haken hat - Tokens kennt er
// nicht. Grob gilt: 1 MB Verlauf sind einige zehntausend Tokens, 1,5 MB
// Zuwachs seit dem letzten Fortschreiben ist also reichlich Arbeit.
const ZUWACHS_GRENZE = 1_500_000;

function eingabe() {
  try {
    return JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

function inhalt() {
  try {
    return readFileSync(STEUERSTAND, 'utf8');
  } catch {
    return null;
  }
}

function antworten(name, { kontext = null, meldung = null } = {}) {
  const antwort = {};
  if (kontext) antwort.hookSpecificOutput = { hookEventName: name, additionalContext: kontext };
  if (meldung) antwort.systemMessage = meldung;
  antwort.suppressOutput = true;
  process.stdout.write(JSON.stringify(antwort));
}

/** Der Steuerstand als Kontext, mit einem Satz davor, der sagt, was er ist. */
function vorlegen(anlass) {
  const text = inhalt();
  if (!text) return null;
  return [
    `# Steuerstand (eingelesen ${anlass})`,
    '',
    'Diese Datei ist `docs/strategie/steuerstand.md` - der fortgeschriebene',
    'Arbeitsstand am Strategiespiel. Sie ist genauer als jede Zusammenfassung:',
    'danach wird weitergearbeitet, nicht nach einem Gedaechtnis des Verlaufs.',
    'Nach jedem Abschnitt Arbeit wird sie fortgeschrieben.',
    '',
    text,
  ].join('\n');
}

const was = process.argv[2];
const nachricht = eingabe();

if (was === 'nach-compact' || was === 'sitzungsstart') {
  const name = was === 'nach-compact' ? 'PostCompact' : 'SessionStart';
  const kontext = vorlegen(was === 'nach-compact' ? 'nach der Zusammenfassung' : 'zum Sitzungsbeginn');
  if (kontext) {
    antworten(name, {
      kontext,
      meldung: was === 'nach-compact' ? 'Steuerstand wieder eingelesen: docs/strategie/steuerstand.md' : null,
    });
  } else {
    antworten(name, {});
  }
} else if (was === 'vor-compact') {
  // Vor der Zusammenfassung ist es zu spaet, um noch zu schreiben - aber nicht
  // zu spaet, um zu sagen, wie alt der Stand ist, der gleich wieder vorgelegt wird.
  const text = inhalt();
  let alter = 'Der Steuerstand fehlt - nach der Zusammenfassung muss er neu geschrieben werden.';
  if (text) {
    const stunden = (Date.now() - statSync(STEUERSTAND).mtimeMs) / 3_600_000;
    alter = `Steuerstand zuletzt vor ${stunden < 1 ? `${Math.round(stunden * 60)} Minuten` : `${stunden.toFixed(1)} Stunden`} geschrieben; er wird nach der Zusammenfassung wieder eingelesen.`;
  }
  antworten('PreCompact', {
    kontext: `Die Zusammenfassung laeuft. ${alter} Was seit dem letzten Fortschreiben dazugekommen ist, gehoert unmittelbar danach in docs/strategie/steuerstand.md.`,
    meldung: alter,
  });
} else if (was === 'erinnern') {
  // Der eine Haken, der von der Auslastung abhaengt: ist seit dem letzten
  // Fortschreiben viel Gespraech dazugekommen, wird daran erinnert.
  const text = inhalt();
  if (!text) {
    antworten('UserPromptSubmit', {
      kontext: 'Hinweis: docs/strategie/steuerstand.md fehlt. Diese Datei haelt den Arbeitsstand ueber den Autocompact hinweg - bitte anlegen.',
    });
  } else {
    let zuwachs = 0;
    try {
      const verlauf = statSync(nachricht.transcript_path);
      const stand = statSync(STEUERSTAND);
      // Grob: der Verlauf ist seit dem Schreiben des Steuerstands gewachsen.
      if (verlauf.mtimeMs > stand.mtimeMs) zuwachs = verlauf.size * ((verlauf.mtimeMs - stand.mtimeMs) / (verlauf.mtimeMs - Math.min(stand.mtimeMs, verlauf.birthtimeMs || stand.mtimeMs) || 1));
    } catch { /* ohne Verlaufsdatei gibt es nichts zu messen */ }
    if (zuwachs > ZUWACHS_GRENZE) {
      antworten('UserPromptSubmit', {
        kontext: `Hinweis: seit dem letzten Fortschreiben von docs/strategie/steuerstand.md sind rund ${Math.round(zuwachs / 1e6)} MB Gespraech dazugekommen. Vor dem naechsten langen Schritt den Steuerstand fortschreiben - die Zusammenfassung kommt sonst zuvor.`,
      });
    } else {
      antworten('UserPromptSubmit', {});
    }
  }
} else {
  process.stderr.write(`steuerstand.mjs: unbekannter Anlass "${was}"\n`);
  process.exit(2);
}
