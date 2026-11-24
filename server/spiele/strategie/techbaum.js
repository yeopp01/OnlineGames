// @ts-check
'use strict';

// Der Technologiebaum (bedienung AC-81 bis AC-85): was es an Gebaeuden,
// Einheiten und Verbesserungen gibt, je Zeitalter und Gebaeude, und was ein
// Haus davon hat - zum Nachschlagen, auch vor der Partie im Warteraum.
//
// Gerechnet wird hier, nicht im Browser: die Werte kommen aus derselben
// Stelle wie im Spiel (`welt.aufbauFuer().werte`, mit den Saetzen aus
// bringt.js), die Werte je Haus aus `welt.kampfwerte()`. Dafuer steht eine
// Welt mit einem Spieler je Haus und einem ohne Haus, einmal gebaut und
// gemerkt. Der Browser liest daraus nur, was er zeigt (bedienung AC-55).

const { Welt } = require('./welt');
const { EINHEITEN, GEBAEUDE, VERBESSERUNGEN, AUFSTIEGE, HAEUSER, DRACHE } = require('./daten');

/** Der Spieler ohne Haus - fuer "Alle Häuser". */
const OHNE = 'ohne';

/**
 * @typedef {{
 *   art: string,
 *   typ: 'einheit' | 'stufe' | 'verbesserung' | 'gebaeude' | 'gerufen',
 *   einheit?: string,
 *   zeitalter: number,
 *   vor: string | null,
 *   haeuser: string[] | null,
 *   hinweis?: string[],
 * }} Knoten
 * @typedef {{ gebaeude: string | null, zeitalter: number, linien: Knoten[][] }} Gruppe
 */

/** Welche Einheit eine Weiterentwicklung zeigt: die, zu der sie macht, oder die sie hebt. */
function gezeigteEinheit(v) {
  if (v.wandelt) return Object.values(v.wandelt)[0];
  return v.hebt || null;
}

/** Wovon eine Weiterentwicklung ausgeht: die Einheit, die sie austauscht oder hebt. */
function ausgangseinheit(v) {
  if (v.wandelt) return Object.keys(v.wandelt)[0];
  return v.hebt || null;
}

/** Die Haeuser eines Eintrags, oder null, wenn ihn jedes hat. */
function haeuserVon(w) {
  return w?.haeuser ? [...w.haeuser] : null;
}

/**
 * Die Linien eines Gebaeudes: je Einheit eine, mit ihren Stufen dahinter
 * (`wandelt`, `hebt`), und je Kette von Verbesserungen eine (`vorstufe`).
 * Eine Verbesserung mit zwei Nachfolgern beginnt fuer den zweiten eine neue
 * Linie, deren erster Knoten auf die Vorstufe zeigt.
 * @param {string} gebaeude
 * @returns {Knoten[][]}
 */
function linienVon(gebaeude) {
  const aus = GEBAEUDE[gebaeude].bildetAus || [];
  const verbesserungen = aus.filter((a) => VERBESSERUNGEN[a]);
  const stufen = verbesserungen.filter((a) => ausgangseinheit(VERBESSERUNGEN[a]));
  const forschung = verbesserungen.filter((a) => !ausgangseinheit(VERBESSERUNGEN[a]));
  /** @type {Knoten[][]} */
  const linien = [];

  for (const einheit of aus.filter((a) => EINHEITEN[a])) {
    /** @type {Knoten[]} */
    const linie = [{ art: einheit, typ: 'einheit', zeitalter: EINHEITEN[einheit].zeitalter || 0, vor: null, haeuser: haeuserVon(EINHEITEN[einheit]) }];
    let jetzt = einheit;
    let vor = einheit;
    for (;;) {
      const naechste = stufen.find((a) => ausgangseinheit(VERBESSERUNGEN[a]) === jetzt);
      if (!naechste) break;
      const v = VERBESSERUNGEN[naechste];
      linie.push({ art: naechste, typ: 'stufe', einheit: gezeigteEinheit(v), zeitalter: v.zeitalter || 0, vor, haeuser: haeuserVon(v) || haeuserVon(EINHEITEN[einheit]) });
      vor = naechste;
      // Eine Elitestufe hebt, statt auszutauschen - danach kommt nichts mehr.
      if (!v.wandelt) break;
      jetzt = gezeigteEinheit(v);
    }
    linien.push(linie);
  }

  // Ketten der Verbesserungen: Anfang ist, wessen Vorstufe nicht in diesem
  // Gebaeude liegt.
  const hier = new Set(forschung);
  const folgen = (art) => forschung.filter((a) => VERBESSERUNGEN[a].vorstufe === art);
  /** @param {string} art @param {string | null} vor */
  const kette = (art, vor) => {
    /** @type {Knoten[]} */
    const linie = [];
    let jetzt = art;
    let davor = vor;
    for (;;) {
      const v = VERBESSERUNGEN[jetzt];
      /** @type {Knoten} */
      const knoten = { art: jetzt, typ: 'verbesserung', zeitalter: v.zeitalter || 0, vor: davor, haeuser: haeuserVon(v) };
      // Ohne Nebel gibt es nichts aufzudecken (bauen AC-52).
      if (v.karte) knoten.hinweis = ['Nur, wenn beim Eröffnen Nebel eingestellt ist'];
      linie.push(knoten);
      const weiter = folgen(jetzt);
      for (const zweig of weiter.slice(1)) linien.push(kette(zweig, jetzt));
      if (!weiter.length) break;
      davor = jetzt;
      jetzt = weiter[0];
    }
    return linie;
  };
  for (const art of forschung) {
    const vorstufe = VERBESSERUNGEN[art].vorstufe;
    if (!vorstufe || !hier.has(vorstufe)) linien.push(kette(art, vorstufe || null));
  }
  return linien;
}

/** Wo der Drache herkommt (bauen AC-35): gerufen im Kloster, aus einem Ei. */
function drachenKnoten() {
  const r = DRACHE.rufen;
  const preis = Object.entries(r.kosten).map(([rohstoff, menge]) => `${menge} ${{ nahrung: 'Nahrung', gold: 'Gold', holz: 'Holz', stein: 'Stein' }[rohstoff]}`).join(' und ');
  return {
    art: 'drache', typ: /** @type {'gerufen'} */ ('gerufen'), zeitalter: EINHEITEN.drache.zeitalter || 0, vor: null, haeuser: null,
    hinweis: [
      'Wird nicht ausgebildet, sondern gerufen',
      'Ein Dorfbewohner trägt ein Drachenei ins eigene Kloster',
      `Dort rufen ihn ${r.moenche} Mönche, höchstens ${r.umkreis} Felder vom Rand, für ${preis} in ${r.sekunden} s`,
      'Nur, wenn der Drache beim Eröffnen an ist',
    ],
  };
}

/** Die Seiten wie im Baumenue (bedienung AC-64): Wirtschaft und Militaer. */
function seitenBauen() {
  const seiten = [{ name: 'Wirtschaft', gruppen: /** @type {Gruppe[]} */ ([]) }, { name: 'Militär', gruppen: /** @type {Gruppe[]} */ ([]) }];
  /** @type {Knoten[][][]} */
  const weitere = [[], []];
  // In der Reihenfolge der Daten - das ist die des Baumenues.
  for (const [art, g] of Object.entries(GEBAEUDE)) {
    const seite = g.seite || 0;
    const linien = linienVon(art);
    if (art === 'kloster') linien.push([drachenKnoten()]);
    if (linien.length) seiten[seite].gruppen.push({ gebaeude: art, zeitalter: g.zeitalter || 0, linien });
    else weitere[seite].push([{ art, typ: 'gebaeude', zeitalter: g.zeitalter || 0, vor: null, haeuser: haeuserVon(g) }]);
  }
  // Was nichts ausbildet und nichts erforscht, steht am Ende als eigene Gruppe.
  weitere.forEach((linien, seite) => {
    if (linien.length) seiten[seite].gruppen.push({ gebaeude: null, zeitalter: 0, linien });
  });
  return seiten;
}

/**
 * Ab welchem Zeitalter es eine Einheit gibt: ihr eigenes, oder das der Stufe,
 * die zu ihr macht (der Pikenier erst mit dem Fuerstentum).
 */
function zeitalterVon(art) {
  if (GEBAEUDE[art]) return GEBAEUDE[art].zeitalter || 0;
  const stufe = Object.values(VERBESSERUNGEN).find((v) => v.wandelt && Object.values(v.wandelt).includes(art));
  return stufe ? stufe.zeitalter || 0 : EINHEITEN[art]?.zeitalter || 0;
}

/** @type {object | null} */
let gemerkt = null;

/**
 * Alles, was die Seite zeigt. Einmal gerechnet und gemerkt: die Daten
 * aendern sich nur mit einem neuen Stand des Servers.
 */
function techbaum() {
  if (gemerkt) return gemerkt;
  const haeuser = Object.keys(HAEUSER);
  const ids = [OHNE, ...haeuser];
  const welt = new Welt(ids.map((id) => ({ id, name: id })), 1, {
    sicht: 'nebel',
    haeuser: Object.fromEntries(haeuser.map((h) => [h, h])),
  });
  const werte = welt.aufbauFuer(OHNE).werte;

  // Die Werte je Haus (spielziel AC-17): jede Art so, wie sie ist, sobald es
  // sie gibt - ohne Verbesserungen, mit den Boni des Hauses bis zu diesem
  // Zeitalter (`boniAb`). Und was das Haus staerkt: wo sich in der Krone
  // etwas vom Spieler ohne Haus unterscheidet.
  const tafeln = Object.fromEntries(ids.map((id) => [id, [0, 1, 2, 3].map((stufe) => {
    const spieler = welt.spielerVon(id);
    if (spieler) spieler.zeitalter = stufe;
    return welt.kampfwerte(id);
  })]));
  /** @type {Record<string, object>} */
  const jeHaus = {};
  /** @type {Record<string, string[]>} */
  const gestaerkt = {};
  for (const id of ids) {
    const tafel = {};
    for (const art of Object.keys(tafeln[id][0])) tafel[art] = tafeln[id][zeitalterVon(art)][art];
    jeHaus[id] = tafel;
    if (id === OHNE) continue;
    const ohne = tafeln[OHNE][3];
    const mit = tafeln[id][3];
    // Was das Haus gar nicht ausbildet, zaehlt nicht: Distelhags Infanterie-
    // ruestung staerkte sonst auch den Riesen Wehrsteins.
    gestaerkt[id] = Object.keys(mit).filter((art) => JSON.stringify(mit[art]) !== JSON.stringify(ohne[art])
      && (!EINHEITEN[art]?.haeuser || EINHEITEN[art].haeuser.includes(id)));
  }

  const seiten = seitenBauen();
  const alle = seiten.flatMap((s) => s.gruppen.flatMap((g) => g.linien.flat()));
  gemerkt = {
    werte,
    jeHaus,
    ohne: OHNE,
    zeitalter: werte.zeitalter.map((z, stufe) => ({
      stufe, name: z.name, ab: z.ab,
      aufstieg: Object.keys(AUFSTIEGE).find((a) => AUFSTIEGE[a].stufe === stufe) || null,
    })),
    seiten,
    haeuser: haeuser.map((art) => ({
      art,
      name: werte.haeuser[art].name,
      wahlspruch: werte.haeuser[art].wahlspruch,
      bringt: werte.haeuser[art].bringt,
      mannschaft: werte.haeuser[art].mannschaft,
      eigene: alle.filter((k) => k.haeuser?.includes(art)).map((k) => k.art),
      gestaerkt: gestaerkt[art],
    })),
  };
  return gemerkt;
}

module.exports = { techbaum, linienVon, OHNE };
