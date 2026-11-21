#!/usr/bin/env node
// Der Steuerstand ueberlebt den Autocompact.
//
// Bei langen Arbeitsschleifen (/loop /strategie-weiterbauen) wird der
// Gespraechsverlauf irgendwann zusammengefasst. Dabei gehen Einzelheiten
// verloren: wo genau die Runde stand, welcher Befehl als naechster kommt,
// welche Falle schon bekannt ist. Deshalb liegt der Stand in einer Datei im
// Repo (docs/strategie/steuerstand.md) - und dieser Haken legt sie vor.
//
//   node .claude/hooks/steuerstand.mjs sitzungsstart <teil>  SessionStart
//   node .claude/hooks/steuerstand.mjs vor-compact           PreCompact
//   node .claude/hooks/steuerstand.mjs erinnern              UserPromptSubmit
//
// Genau einmal nach jeder Zusammenfassung: Claude Code beginnt danach die
// Sitzung neu und ruft SessionStart mit `source: "compact"` - dort, und nur
// dort, wird der Steuerstand vorgelegt (auch bei startup, resume, clear und
// fork). Einen PostCompact-Haken gibt es mit Absicht nicht: PostCompact kennt
// kein `hookSpecificOutput` und gibt nichts in den Kontext, und neben
// SessionStart legte er den Stand ein zweites Mal vor.
//
// In Teilen: Claude Code nimmt je Feld `additionalContext` hoechstens 10 000
// Zeichen; was laenger ist, landet in einer Datei, und im Kontext steht nur
// der Pfad mit 2000 Zeichen Vorschau. Deshalb stehen in .claude/settings.json
// TEILE SessionStart-Haken nebeneinander, `sitzungsstart 1` bis
// `sitzungsstart 5`. Jeder schneidet die Datei gleich - an den
// `##`-Abschnitten, notfalls an `###` und Leerzeilen - und legt nur seinen
// Teil vor; wer keinen Teil hat, schweigt. Reichen die Teile nicht, sagt der
// letzte, ab welcher Zeile der Rest mit Read zu lesen ist.
//
// Antworten, alle mit Exit 0 (die Felder nach code.claude.com/docs/en/hooks):
//   sitzungsstart  JSON: hookSpecificOutput { hookEventName: "SessionStart",
//                  additionalContext }, nach einer Zusammenfassung im ersten
//                  Teil dazu systemMessage (die Zeile fuer den Benutzer)
//   vor-compact    reiner Text: PreCompact nimmt die Standardausgabe als
//                  Anweisung fuer die Zusammenfassung (hoechstens 10 000
//                  Zeichen). hookSpecificOutput gibt es dort nicht.
//   erinnern       JSON: hookSpecificOutput { hookEventName:
//                  "UserPromptSubmit", additionalContext } - nur wenn es etwas
//                  zu erinnern gibt, sonst nichts
// Ein unbekannter Anlass endet mit Exit 2 und einer Zeile auf stderr.
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const STEUERSTAND = join(wurzel, 'docs', 'strategie', 'steuerstand.md');

// So viele `sitzungsstart <n>` stehen in .claude/settings.json.
const TEILE = 5;
// Zeichen Steuerstand je Teil. Die Grenze von Claude Code ist 10 000; der Rest
// bleibt fuer die Kopfzeilen, die jeder Teil davor bekommt.
const TEIL_GRENZE = 9_000;

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
    return readFileSync(STEUERSTAND, 'utf8').replace(/\r\n/g, '\n');
  } catch {
    return null;
  }
}

function jsonAntworten(antwort) {
  process.stdout.write(JSON.stringify({ ...antwort, suppressOutput: true }));
}

/** Zerlegt `text` an Stellen, vor denen `muster` passt (Lookahead), in Stuecke. */
function schneiden(text, muster) {
  return text.split(muster).map((stueck, i, alle) => (i < alle.length - 1 ? `${stueck}\n` : stueck));
}

/** Stuecke, von denen keines laenger als die Grenze ist: erst ##, dann ###, dann Leerzeilen, zuletzt hart. */
function kleinMachen(stueck, stufe = 0) {
  if (stueck.length <= TEIL_GRENZE) return [stueck];
  const muster = [/\n(?=### )/, /\n(?=\n)/][stufe];
  if (!muster) {
    const harte = [];
    for (let i = 0; i < stueck.length; i += TEIL_GRENZE) harte.push(stueck.slice(i, i + TEIL_GRENZE));
    return harte;
  }
  const teile = schneiden(stueck, muster);
  if (teile.length === 1) return kleinMachen(stueck, stufe + 1);
  return teile.flatMap((t) => kleinMachen(t, stufe + 1));
}

/** Die Datei in Teile von hoechstens TEIL_GRENZE Zeichen, mit der Zeile, in der jeder beginnt. */
function teilen(text) {
  const stuecke = schneiden(text, /\n(?=## )/).flatMap((s) => kleinMachen(s));
  const teile = [];
  let zeile = 1;
  for (const stueck of stuecke) {
    const letzter = teile[teile.length - 1];
    if (letzter && letzter.text.length + stueck.length <= TEIL_GRENZE) letzter.text += stueck;
    else teile.push({ text: stueck, zeile });
    zeile += stueck.split('\n').length - 1;
  }
  return teile;
}

function alterIn(stunden) {
  return stunden < 1 ? `${Math.round(stunden * 60)} Minuten` : `${stunden.toFixed(1)} Stunden`;
}

const was = process.argv[2];
const nachricht = eingabe();

if (was === 'sitzungsstart') {
  const nummer = Number(process.argv[3] ?? 1);
  const text = inhalt();
  const nachCompact = nachricht.source === 'compact';
  if (!text) {
    if (nummer === 1) {
      jsonAntworten({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: 'Hinweis: docs/strategie/steuerstand.md fehlt. Diese Datei haelt den Arbeitsstand ueber den Autocompact hinweg - bitte anlegen.',
        },
      });
    }
  } else {
    const teile = teilen(text);
    const anzahl = Math.min(teile.length, TEILE);
    const teil = teile[nummer - 1];
    if (teil && nummer <= TEILE) {
      const anlass = nachCompact ? 'nach der Zusammenfassung' : 'zum Sitzungsbeginn';
      const kopf = [`# Steuerstand, Teil ${nummer} von ${anzahl} (eingelesen ${anlass}, ab Zeile ${teil.zeile})`, ''];
      if (nummer === 1) {
        kopf.push(
          'Diese Datei ist `docs/strategie/steuerstand.md` - der fortgeschriebene',
          'Arbeitsstand am Strategiespiel. Sie ist genauer als jede Zusammenfassung:',
          'danach wird weitergearbeitet, nicht nach einem Gedaechtnis des Verlaufs.',
          `Sie kommt in ${anzahl} Teilen (je Haken hoechstens 10 000 Zeichen); erst alle zusammen sind der Stand.`,
          '',
        );
      }
      let rumpf = teil.text;
      if (nummer === TEILE && teile.length > TEILE) {
        rumpf += `\n\n[Der Steuerstand ist laenger als ${TEILE} Teile. Der Rest ab Zeile ${teile[TEILE].zeile} ist hier NICHT vorgelegt - mit Read lesen, bevor weitergearbeitet wird, und den Steuerstand kuerzen.]`;
      }
      const antwort = { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: [...kopf, rumpf].join('\n') } };
      if (nummer === 1 && nachCompact) {
        antwort.systemMessage = `Steuerstand nach der Zusammenfassung wieder vorgelegt (${anzahl} Teile): docs/strategie/steuerstand.md`;
      }
      jsonAntworten(antwort);
    }
    // Kein Teil mit dieser Nummer: nichts ausgeben, das ist eine gueltige Antwort.
  }
} else if (was === 'vor-compact') {
  // Vor der Zusammenfassung ist es zu spaet, um noch zu schreiben - aber nicht
  // zu spaet, um der Zusammenfassung zu sagen, was sie behalten soll.
  const text = inhalt();
  const zeilen = [];
  if (text) {
    const stunden = (Date.now() - statSync(STEUERSTAND).mtimeMs) / 3_600_000;
    zeilen.push(
      `Der Steuerstand docs/strategie/steuerstand.md wurde zuletzt vor ${alterIn(stunden)} geschrieben.`,
      'Er wird nach der Zusammenfassung von selbst wieder vorgelegt - die Zusammenfassung muss ihn nicht wiederholen.',
      'Behalte stattdessen genau, was NACH seinem letzten Fortschreiben geschah: Auftraege und Worte des Benutzers im Wortlaut,',
      'laufende Hintergrundlaeufe und Hilfsagenten mit Kennung, uncommittete Dateien, gemessene Zahlen, offene Fehler.',
      'Das gehoert unmittelbar nach der Zusammenfassung in den Steuerstand.',
    );
  } else {
    zeilen.push(
      'Der Steuerstand docs/strategie/steuerstand.md fehlt. Die Zusammenfassung muss den Arbeitsstand vollstaendig behalten:',
      'Auftraege des Benutzers im Wortlaut, laufende Laeufe, uncommittete Dateien, naechste Schritte. Danach den Steuerstand neu anlegen.',
    );
  }
  process.stdout.write(`${zeilen.join('\n')}\n`);
} else if (was === 'erinnern') {
  // Der eine Haken, der von der Auslastung abhaengt: ist seit dem letzten
  // Fortschreiben viel Gespraech dazugekommen, wird daran erinnert.
  const text = inhalt();
  let hinweis = null;
  if (!text) {
    hinweis = 'Hinweis: docs/strategie/steuerstand.md fehlt. Diese Datei haelt den Arbeitsstand ueber den Autocompact hinweg - bitte anlegen.';
  } else {
    let zuwachs = 0;
    try {
      const verlauf = statSync(nachricht.transcript_path);
      const stand = statSync(STEUERSTAND);
      // Grob: der Verlauf ist seit dem Schreiben des Steuerstands gewachsen.
      if (verlauf.mtimeMs > stand.mtimeMs) zuwachs = verlauf.size * ((verlauf.mtimeMs - stand.mtimeMs) / (verlauf.mtimeMs - Math.min(stand.mtimeMs, verlauf.birthtimeMs || stand.mtimeMs) || 1));
    } catch { /* ohne Verlaufsdatei gibt es nichts zu messen */ }
    if (zuwachs > ZUWACHS_GRENZE) {
      hinweis = `Hinweis: seit dem letzten Fortschreiben von docs/strategie/steuerstand.md sind rund ${Math.round(zuwachs / 1e6)} MB Gespraech dazugekommen. Vor dem naechsten langen Schritt den Steuerstand fortschreiben - die Zusammenfassung kommt sonst zuvor.`;
    }
  }
  if (hinweis) jsonAntworten({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: hinweis } });
} else {
  process.stderr.write(`steuerstand.mjs: unbekannter Anlass "${was}"\n`);
  process.exit(2);
}
