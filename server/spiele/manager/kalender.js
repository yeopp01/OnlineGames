'use strict';

// Der Saisonkalender. Eine Saison ist eine Folge von Terminen, und ein Zug
// "weiter" fuehrt genau einen davon aus - einen Liga-Spieltag, eine
// Pokalrunde, die Winterpause, das Saisonende.
//
// Alles, was Zeit braucht, zaehlt in Terminen: Verletzungen heilen je
// Termin, Gehaelter laufen je Termin, ein Stadionausbau dauert Termine.
// Sperren dagegen zaehlen in Spielen - wer gesperrt ist, sitzt Pflichtspiele
// ab, nicht Wochen.

const RUNDEN = ['1. Runde', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'];
// Nach welchem Liga-Spieltag die Pokalrunden liegen.
const POKAL_NACH = [3, 10, 20, 27, 34];
const WINTERPAUSE_NACH = 17;
const SPIELTAGE = 34;

function saisonKalender() {
  const termine = [{ art: 'vorbereitung' }];
  let runde = 0;
  for (let nr = 1; nr <= SPIELTAGE; nr++) {
    termine.push({ art: 'liga', nr });
    if (nr === WINTERPAUSE_NACH) termine.push({ art: 'winterpause' });
    if (POKAL_NACH[runde] === nr) {
      runde += 1;
      termine.push({ art: 'pokal', runde });
    }
  }
  termine.push({ art: 'saisonende' });
  return termine;
}

const TERMINE_JE_SAISON = saisonKalender().length;

function terminTitel(termin) {
  if (!termin) return '';
  switch (termin.art) {
    case 'vorbereitung': return 'Saisonvorbereitung';
    case 'liga': return `${termin.nr}. Spieltag`;
    case 'pokal': return `Pokal, ${RUNDEN[termin.runde - 1]}`;
    case 'winterpause': return 'Winterpause';
    case 'saisonende': return 'Saisonende';
    default: return termin.art;
  }
}

/**
 * Ist das Transferfenster offen, solange dieser Termin als naechster
 * ansteht? Im Sommer von der Vorbereitung bis zum 3. Spieltag, im Winter
 * von der Winterpause bis zum 18. Spieltag. Vereinslose sind davon nicht
 * betroffen - wer keinen Vertrag hat, darf jederzeit unterschreiben.
 */
function fensterOffen(termin) {
  if (!termin) return false;
  if (termin.art === 'vorbereitung' || termin.art === 'winterpause') return true;
  if (termin.art === 'liga') return termin.nr <= 3 || termin.nr === 18;
  return false;
}

function fensterText(termin) {
  if (!fensterOffen(termin)) return 'Transferfenster geschlossen - nur Vereinslose';
  const winter = termin.art === 'winterpause' || (termin.art === 'liga' && termin.nr >= 18);
  return winter ? 'Transferfenster offen bis zum 18. Spieltag' : 'Transferfenster offen bis zum 3. Spieltag';
}

module.exports = {
  RUNDEN, POKAL_NACH, WINTERPAUSE_NACH, SPIELTAGE, TERMINE_JE_SAISON,
  saisonKalender, terminTitel, fensterOffen, fensterText,
};
