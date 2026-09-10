// Gemeinsames Werkzeug fuer die Tests des Managerspiels.

const WECHSEL_MAX = 3;

/**
 * Alles, was sich in einem Spiel widersprechen kann: ein Ereignis fuer einen,
 * der nicht auf dem Platz steht, eine Vorlage von aussen, zwei Gelbe ohne
 * Gelb-Rot, mehr Wechsel als erlaubt, Tore, die nicht zum Stand passen.
 *
 * @returns {string[]} leer heisst stimmig
 */
export function widersprueche(e) {
  const fehler = [];
  for (const [seite, id, index] of [['heim', e.heim, 0], ['gast', e.gast, 1]]) {
    const auf = new Set(e.aufstellung[seite].elf);
    const bank = new Set(e.aufstellung[seite].bank);
    const gelbe = new Map();
    let wechsel = 0;
    for (const x of e.ereignisse.filter((y) => y.verein === id)) {
      if (x.art === 'elfmeter' || x.art === 'elfmeter-vergeben') {
        if (!auf.has(x.spielerId)) fehler.push(`Elfmeter von ${x.spieler}, der nicht auf dem Platz steht`);
        continue;
      }
      if (x.art === 'wechsel') {
        wechsel += 1;
        if (!auf.has(x.spielerId) && x.grund !== 'verletzung') fehler.push(`${x.minute}' ${x.spieler} ausgewechselt, war nicht drin`);
        if (!bank.has(x.reinId)) fehler.push(`${x.minute}' ${x.rein} eingewechselt, sass nicht auf der Bank`);
        auf.delete(x.spielerId);
        bank.delete(x.reinId);
        auf.add(x.reinId);
        continue;
      }
      if (!auf.has(x.spielerId)) fehler.push(`${x.minute}' ${x.art} fuer ${x.spieler}, der nicht auf dem Platz steht`);
      if (x.vorlageId && (!auf.has(x.vorlageId) || x.vorlageId === x.spielerId)) fehler.push(`${x.minute}' Vorlage von ${x.vorlage}`);
      if (x.art === 'gelb' || x.art === 'gelbrot') {
        const n = (gelbe.get(x.spielerId) || 0) + 1;
        gelbe.set(x.spielerId, n);
        if (n === 2 && x.art !== 'gelbrot') fehler.push(`zweite Gelbe ohne Gelb-Rot fuer ${x.spieler}`);
        if (n > 2) fehler.push(`dritte Gelbe fuer ${x.spieler}`);
      }
      if (['rot', 'gelbrot', 'verletzung'].includes(x.art)) auf.delete(x.spielerId);
    }
    if (wechsel > WECHSEL_MAX) fehler.push(`${wechsel} Wechsel`);
    const tore = e.ereignisse.filter((x) => x.verein === id && x.art === 'tor').length;
    if (tore !== e.tore[index]) fehler.push(`${tore} Torereignisse bei ${e.tore[index]} Toren`);
  }
  return fehler;
}

export const schnitt = (liste, wert = (x) => x) => liste.reduce((s, x) => s + wert(x), 0) / liste.length;
