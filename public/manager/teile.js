// @ts-check
// Was mehrere Blaetter des Managerspiels zeigen: Text, Betraege, Zahlen,
// Balken, die Teile einer Spielerzeile und die Zeilen eigener Spiele. Nichts
// hier liest den Zustand - jede Funktion bekommt, was sie zeigt.

/** @param {unknown} wert */
export function text(wert) {
  return String(wert ?? '').replace(/[&<>"]/g, (z) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
  }[z]));
}

// Betraege stehen in Tausend. Ueber tausend wird daraus eine Million -
// "12,4 Mio" liest sich schneller als "12400".
/** @param {number | null | undefined} tausend */
export function geld(tausend) {
  if (tausend === null || tausend === undefined) return '–';
  const zahl = Math.round(tausend);
  if (Math.abs(zahl) >= 1000) return `${(zahl / 1000).toFixed(1).replace('.', ',')} Mio`;
  return `${zahl} T`;
}

/** @param {number} wert */
export const zahl = (wert) => Number(wert).toLocaleString('de-DE');
/** @param {number | null | undefined} wert */
export const note = (wert) => (wert === null || wert === undefined ? '–' : Number(wert).toFixed(1).replace('.', ','));
/** @param {number} anzahl */
export const jahre = (anzahl) => `${anzahl} ${anzahl === 1 ? 'Jahr' : 'Jahre'}`;

/**
 * Ein Balken von 0 bis 100.
 * @param {number} breite  in Prozent
 * @param {string} stufe   '', 'mittel' oder 'tief'
 */
export const balken = (breite, stufe) => `<div class="balken-rahmen"><div class="balken ${stufe}" style="width:${breite}%"></div></div>`;

// ------------------------------------------------------- Spielerzeile

/** Rolle und zweite Position, sonst die Position. */
export const rolleText = (s) => (s.rolle ? `${s.rolle}${s.nebenrolle ? `/${s.nebenrolle}` : ''}` : s.position);

/** Ein Name, der die Akte des Spielers oeffnet. */
export const namensknopf = (id, name) => `<button class="namelink" data-akte="${id}">${text(name)}</button>`;

/** @param {number} d */
export const veraenderung = (d) => (d > 0 ? `<span class="gut">+${d}</span>` : d < 0 ? `<span class="schlecht">-${-d}</span>` : '<span class="leise">0</span>');

// Nach welcher Regel ein Spieler sich entwickelt hat - dieselben Stufen wie kader.entwickeln.
export const STUFEN = {
  jung: 'bis 20: wächst auf sein Talent zu',
  reifend: '21 bis 24: wächst noch, langsamer',
  bestes: '25 bis 28: bleibt, wie er ist',
  nachlassend: '29 bis 31: baut ab',
  alt: 'ab 32: baut deutlich ab',
};

export const EINSCHAETZUNG = { favorit: 'Du bist Favorit', offen: 'Offenes Spiel', aussenseiter: 'Du bist Aussenseiter' };

// ------------------------------------------------------ eigene Spiele

export function eigenesSpielText(spiel) {
  if (!spiel) return '–';
  if (spiel.offen) return 'noch nicht ausgelost';
  if (spiel.frei) return 'nicht dabei';
  return `${spiel.daheim ? 'H' : 'A'} · ${text(spiel.gegner)}`;
}

export function eigenesErgebnis(spiel) {
  if (!spiel || !spiel.tore) return { text: '', klasse: '' };
  const [eigene, fremde] = spiel.daheim ? spiel.tore : [spiel.tore[1], spiel.tore[0]];
  let zusatz = spiel.verlaengerung ? ' n.V.' : '';
  if (spiel.elfmeter) {
    const [ie, ifr] = spiel.daheim ? spiel.elfmeter : [spiel.elfmeter[1], spiel.elfmeter[0]];
    zusatz = ` i.E. ${ie}:${ifr}`;
  }
  const gewonnen = spiel.sieger ? spiel.sieger !== spiel.gegnerId : eigene > fremde;
  const verloren = spiel.sieger ? spiel.sieger === spiel.gegnerId : eigene < fremde;
  return { text: `${eigene}:${fremde}${zusatz}`, klasse: gewonnen ? 'gut' : verloren ? 'schlecht' : '' };
}

// Postfach und Buch nach Termin: das Datum einmal als Zwischenzeile statt vor jeder Zeile.
export function nachTermin(liste) {
  const gruppen = [];
  for (const eintrag of liste) {
    const datum = `Saison ${eintrag.saison} · ${eintrag.datum}`;
    if (gruppen.at(-1)?.datum === datum) gruppen.at(-1).eintraege.push(eintrag);
    else gruppen.push({ datum, eintraege: [eintrag] });
  }
  return gruppen;
}
