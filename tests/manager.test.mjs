// Reine Rechenteile des Managerspiels: Spieler, Begegnung, Liga, Pokal, Geld,
// Vertraege, Vorstand, Kalender. Sie haben keine Naht zum Browser und duerfen
// deshalb direkt geprueft werden (→ docs/adr/0004-teststrategie.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { widersprueche } from './manager-hilfe.mjs';

const require = createRequire(import.meta.url);
const kader = require('../server/spiele/manager/kader.js');
const spieltag = require('../server/spiele/manager/spieltag.js');
const liga = require('../server/spiele/manager/liga.js');
const pokal = require('../server/spiele/manager/pokal.js');
const finanzen = require('../server/spiele/manager/finanzen.js');
const vertraege = require('../server/spiele/manager/vertraege.js');
const vorstand = require('../server/spiele/manager/vorstand.js');
const kalender = require('../server/spiele/manager/kalender.js');
const { zufallAus } = require('../server/spiele/manager/zufall.js');

const {
  TOR, ABW, MIT, ANG, weltErzeugen, elfStellen, bankStellen, tagesform, niveau, marktwert,
} = kader;
const { begegnung, nachwirkung, taktikPruefen } = spieltag;

const welt = (startwert = 4711) => weltErzeugen(startwert).vereine;
const erste = (startwert) => welt(startwert).filter((v) => v.liga === 1);
const schnitt = (liste, wert) => liste.reduce((s, x) => s + wert(x), 0) / liste.length;

function aufstellung(verein, system = verein.taktik.system) {
  const elf = elfStellen(verein, system);
  return { elf, bank: bankStellen(verein, elf), system };
}

/** Eine Begegnung mit der besten Elf beider Vereine. */
function spiel(heim, gast, zufall, { systeme = {}, elfHeim = null, ...rest } = {}) {
  return begegnung(heim, gast, zufall, {
    aufstellungen: { heim: elfHeim || aufstellung(heim, systeme.heim), gast: aufstellung(gast, systeme.gast) },
    ...rest,
  });
}

/** Viele Durchlaeufe aus einer Zufallsquelle. */
function reihe(anzahl, machen, startwert = 20260910) {
  const zufall = zufallAus(startwert);
  return Array.from({ length: anzahl }, (_, i) => machen(zufall, i));
}


// ---------------------------------------------------------------- Kader

test('kader AC-1: gleicher Startwert ergibt dieselbe Welt', () => {
  assert.deepEqual(weltErzeugen(4711), weltErzeugen(4711));
  assert.notDeepEqual(welt(4711), welt(4712));
});

test('kader AC-2: zwanzig Spieler je Verein, nach Positionen verteilt', () => {
  const vereine = welt(7);
  assert.equal(vereine.length, 36);
  assert.equal(vereine.filter((v) => v.liga === 1).length, 18);
  for (const verein of vereine) {
    const zaehlen = (position) => verein.spieler.filter((s) => s.position === position).length;
    assert.deepEqual([verein.spieler.length, zaehlen(TOR), zaehlen(ABW), zaehlen(MIT), zaehlen(ANG)], [20, 3, 7, 7, 3]);
  }
});

test('kader AC-4: die Welt hat ein Gefaelle', () => {
  const vereine = welt(4711);
  const eins = vereine.filter((v) => v.liga === 1).map(niveau);
  const zwei = vereine.filter((v) => v.liga === 2).map(niveau);
  assert.ok(Math.max(...eins) > Math.min(...eins) + 10, `erste Liga zu flach: ${Math.max(...eins)} zu ${Math.min(...eins)}`);
  assert.ok(schnitt(eins, (x) => x) > schnitt(zwei, (x) => x) + 8, 'die zweite Liga ist nicht schwaecher');
});

test('kader AC-5: Alter formt Staerke und Talent', () => {
  const alle = welt(4711).flatMap((v) => v.spieler);
  const jung = alle.filter((s) => s.alter <= 21);
  const scheitel = alle.filter((s) => s.alter >= 26 && s.alter <= 28);
  const alt = alle.filter((s) => s.alter >= 33);
  assert.ok(schnitt(jung, (s) => s.staerke) < schnitt(scheitel, (s) => s.staerke));
  assert.ok(schnitt(alt, (s) => s.staerke) < schnitt(scheitel, (s) => s.staerke));
  for (const spieler of alle) assert.ok(spieler.talent >= spieler.staerke);
  assert.ok(schnitt(jung, (s) => s.talent - s.staerke) > schnitt(alt, (s) => s.talent - s.staerke));
});

test('kader AC-6: Gehalt waechst steiler als Staerke', () => {
  const faktor = kader.jahresgehalt(90) / kader.jahresgehalt(60);
  assert.ok(faktor > 1.5 ** 3.5, `90 kostet nur das ${faktor.toFixed(1)}-fache von 60`);
  assert.ok(kader.jahresgehalt(40) > 0);
});

test('kader AC-8: fuenf Systeme verteilen zehn Feldspieler', () => {
  assert.equal(kader.SYSTEME_NAMEN.length, 5);
  for (const [name, plan] of Object.entries(kader.SYSTEME)) {
    assert.equal(plan[ABW] + plan[MIT] + plan[ANG], 10, name);
  }
});

test('kader AC-9: die beste Elf stellt sich selbst auf', () => {
  const [verein] = welt(4711);
  for (const [name, plaetze] of Object.entries(kader.PLAETZE)) {
    const elf = elfStellen(verein, name);
    assert.equal(elf.length, 11);
    assert.equal(new Set(elf).size, 11, name);
    elf.forEach((s, i) => assert.ok(kader.passtInsFach(s, plaetze[i]), `${name}: ${s.name} (${s.rolle}) auf ${plaetze[i]}`));
  }
  const abwehr = verein.spieler.filter((s) => s.position === ABW).sort((a, b) => tagesform(a) - tagesform(b));
  assert.ok(!elfStellen(verein, '4-4-2').includes(abwehr[0]), 'der schwaechste Verteidiger steht in der Elf');
});

test('kader AC-10: wer ausserhalb seiner Position spielt, ist schwaecher', () => {
  const [verein] = welt(4711);
  const einer = verein.spieler.find((s) => s.position === ANG);
  const duenn = { ...verein, spieler: verein.spieler.filter((s) => s.position !== ANG || s === einer) };
  const plaetze = kader.PLAETZE['4-3-3'];
  const elf = elfStellen(duenn, '4-3-3');
  assert.equal(elf.length, 11);
  // Drei Sturmplaetze, ein Stuermer: mindestens zwei spielen ausserhalb ihrer Reihe - und bringen dort weniger.
  const fremd = elf.map((s, i) => ({ s, platz: plaetze[i] })).filter(({ s, platz }) => kader.TEIL[platz] !== s.position);
  assert.ok(fremd.length >= 2, `nur ${fremd.length} umgestellt`);
  for (const { s, platz } of fremd) assert.ok(kader.eignung(s, platz) < 1, `${s.name} (${s.rolle}) auf ${platz}`);
});

test('kader AC-11: Tagesform ist Staerke, gedaempft durch Kondition und Moral', () => {
  const grund = { staerke: 70, kondition: 100, moral: 100 };
  assert.ok(tagesform({ ...grund, kondition: 50 }) < tagesform(grund));
  assert.ok(tagesform({ ...grund, moral: 20 }) < tagesform(grund));
  assert.ok(tagesform({ staerke: 85, kondition: 45, moral: 25 }) < tagesform({ staerke: 70, kondition: 100, moral: 90 }));
});

test('kader AC-12: Verletzte und Gesperrte stehen nicht in der besten Elf', () => {
  const [verein] = welt(4711);
  const stamm = verein.spieler.filter((s) => s.position === TOR).sort((a, b) => b.staerke - a.staerke)[0];
  stamm.verletzt = 2;
  assert.ok(!elfStellen(verein, '4-4-2').some((s) => s.id === stamm.id));
  assert.equal(kader.ausfallgrund(stamm), 'verletzt, noch 2 Wochen');
  stamm.verletzt = 0;
  stamm.sperre = 1;
  assert.ok(!elfStellen(verein, '4-4-2').some((s) => s.id === stamm.id));
  assert.equal(kader.ausfallgrund(stamm), 'gesperrt, noch 1 Spiel');
  stamm.sperre = 0;
  assert.ok(elfStellen(verein, '4-4-2').some((s) => s.id === stamm.id));
});

test('kader AC-13 und aufstellung AC-12: Entwicklung am Saisonende', () => {
  const spieler = (werte) => ({
    id: werte.id, name: werte.id, position: MIT, kondition: 90, moral: 60, vertrag: null, gelbe: 0, sperre: 0, verletzt: 0,
    laufbahn: { spiele: 0, tore: 0 }, saison: { ...kader.leereSaisonwerte(), minuten: werte.minuten }, ...werte,
  });
  const verein = (technik) => ({
    spieler: [
      spieler({ id: 'jung', alter: 19, staerke: 50, talent: 80, minuten: 3600 }),
      spieler({ id: 'bank', alter: 19, staerke: 50, talent: 80, minuten: 0 }),
      spieler({ id: 'alt', alter: 32, staerke: 75, talent: 75, minuten: 3600 }),
    ],
    technikSumme: technik * 40,
    trainingswochen: 40,
  });
  const mitTechnik = verein(1);
  const ohneTechnik = verein(0);
  kader.entwickeln(mitTechnik, zufallAus(1), 40);
  kader.entwickeln(ohneTechnik, zufallAus(1), 40);
  const wert = (v, id) => v.spieler.find((s) => s.id === id);

  assert.ok(wert(mitTechnik, 'jung').staerke >= 58, `der Junge waechst kaum: ${wert(mitTechnik, 'jung').staerke}`);
  assert.ok(wert(mitTechnik, 'jung').staerke > wert(ohneTechnik, 'jung').staerke, 'Techniktraining bringt nichts');
  assert.ok(wert(mitTechnik, 'jung').staerke > wert(mitTechnik, 'bank').staerke - 0, 'Spielzeit bringt nichts');
  assert.ok(wert(mitTechnik, 'alt').staerke < 75, 'der Alte verliert nicht');
  assert.ok(wert(mitTechnik, 'jung').staerke <= 80, 'ueber das Talent hinaus gewachsen');
  assert.deepEqual(mitTechnik.spieler.map((s) => s.alter), [20, 20, 33]);
  assert.equal(mitTechnik.technikSumme, 0, 'die Trainingssumme beginnt nicht von vorn');
});

test('kader AC-14: die Jugend liefert nach', () => {
  const [vorlage] = welt(4711);
  const verein = { ...vorlage, spieler: vorlage.spieler.filter((s) => s.position !== ANG || s === vorlage.spieler.find((x) => x.position === ANG)) };
  let zaehler = 0;
  const erzeuger = { neueId: () => `j${++zaehler}`, neuerName: () => `Jugend ${zaehler}`, saison: 2 };
  const jugend = kader.jugendErzeugen(verein, zufallAus(3), erzeuger);
  assert.equal(jugend.length, 2);
  for (const spieler of jugend) {
    assert.equal(spieler.alter, 17);
    assert.ok(spieler.talent > spieler.staerke);
    assert.equal(spieler.vertrag.bis, 4);
  }
  assert.equal(jugend[0].position, ANG, 'die duennste Position zuerst');

  const talent = (reputation) => schnitt(reihe(150, (zufall) => kader.jugendErzeugen({ ...vorlage, reputation }, zufall, erzeuger)[0]), (s) => s.talent);
  assert.ok(talent(90) > talent(10) + 10, 'Ruf bringt kein Talent');
});

test('kader AC-16: jeder Spieler hat einen Marktwert', () => {
  const { vereine, freie } = weltErzeugen(4711);
  for (const spieler of [...vereine.flatMap((v) => v.spieler), ...freie]) {
    assert.ok(Number.isFinite(marktwert(spieler)) && marktwert(spieler) >= 20);
  }
});

test('kader AC-17: Karriereende ab 33, mit 36 ist Schluss', () => {
  const zaehlen = (alter, staerke = 70) => reihe(1000, (zufall) => kader.hoertAuf({ alter, staerke }, zufall)).filter(Boolean).length;
  assert.equal(zaehlen(29), 0);
  assert.equal(zaehlen(32), 0);
  assert.ok(zaehlen(33) > 50 && zaehlen(33) < 300);
  assert.ok(zaehlen(35) > zaehlen(34));
  assert.equal(zaehlen(36), 1000);
});

test('kader AC-18: die A-Jugend springt ein', () => {
  const [verein] = welt(4711);
  for (const spieler of verein.spieler) {
    if (spieler.position === TOR || verein.spieler.indexOf(spieler) % 2) spieler.verletzt = 3;
  }
  assert.ok(verein.spieler.filter(kader.einsatzbereit).length < 11);
  let zaehler = 0;
  const neu = kader.notfallJugend(verein, { neueId: () => `a${++zaehler}`, neuerName: () => `A-Jugend ${zaehler}`, saison: 1 });
  const bereit = verein.spieler.filter(kader.einsatzbereit);
  assert.ok(bereit.length >= 11);
  assert.ok(bereit.some((s) => s.position === TOR), 'kein Torwart nachgerueckt');
  assert.ok(neu.length > 0 && neu.every((s) => s.jugend && s.alter === 18 && s.vertrag.bis === 1));
  assert.equal(elfStellen(verein, '4-4-2').length, 11);
});

// ------------------------------------------------------------- Spieltag

test('spieltag AC-1: gleiche Zufallsquelle ergibt dasselbe Spiel', () => {
  const [a, b] = welt(4711);
  const eines = spiel(a, b, zufallAus(5));
  assert.deepEqual(eines, spiel(a, b, zufallAus(5)));
  assert.notDeepEqual(eines, spiel(a, b, zufallAus(6)));
});

test('spieltag AC-2: das Mittelfeld teilt die Chancen', () => {
  const vereine = erste(4711);
  const spiele = reihe(400, (zufall) => spiel(vereine[5], vereine[6], zufall, { neutral: true, systeme: { heim: '4-5-1', gast: '4-3-3' } }));
  const heim = spiele.reduce((s, e) => s + e.chancen[0], 0);
  const gast = spiele.reduce((s, e) => s + e.chancen[1], 0);
  assert.ok(heim > gast * 1.03, `fuenf im Mittelfeld bringen nichts: ${heim} zu ${gast} Chancen`);
});

test('spieltag AC-3: der Staerkere gewinnt oefter, aber nicht immer', () => {
  const vereine = erste(4711);
  const siege = reihe(400, (zufall) => spiel(vereine[0], vereine.at(-1), zufall)).filter((e) => e.tore[0] > e.tore[1]).length;
  assert.ok(siege > 220, `nur ${siege} von 400 Siegen fuer den Besseren`);
  assert.ok(siege < 400);
});

test('spieltag AC-4: Heimvorteil ist messbar', () => {
  const vereine = erste(4711);
  const [a, b] = [vereine[8], vereine[9]];
  const daheim = reihe(600, (zufall) => spiel(a, b, zufall)).filter((e) => e.tore[0] > e.tore[1]).length;
  const auswaerts = reihe(600, (zufall) => spiel(b, a, zufall)).filter((e) => e.tore[1] > e.tore[0]).length;
  assert.ok(daheim > auswaerts, `daheim ${daheim}, auswaerts ${auswaerts} Siege`);
});

test('spieltag AC-5: etwa drei Tore je Spiel', () => {
  const vereine = erste(4711);
  const spiele = reihe(1000, (zufall, i) => spiel(vereine[i % 18], vereine[(i * 7 + 3) % 18], zufall));
  const tore = schnitt(spiele.filter((e) => e.heim !== e.gast), (e) => e.tore[0] + e.tore[1]);
  assert.ok(tore > 2.7 && tore < 3.5, `${tore.toFixed(2)} Tore je Spiel`);
});

test('spieltag AC-6: Stuermer treffen am haeufigsten, der Torwart nie', () => {
  const vereine = erste(4711);
  const position = new Map(vereine.flatMap((v) => v.spieler.map((s) => [s.id, s.position])));
  const zaehler = { [TOR]: 0, [ABW]: 0, [MIT]: 0, [ANG]: 0 };
  for (const e of reihe(300, (zufall, i) => spiel(vereine[i % 18], vereine[(i + 5) % 18], zufall))) {
    for (const x of e.ereignisse) if (x.art === 'tor') zaehler[position.get(x.spielerId)] += 1;
  }
  assert.equal(zaehler[TOR], 0);
  assert.ok(zaehler[ANG] > zaehler[MIT] && zaehler[MIT] > zaehler[ABW], JSON.stringify(zaehler));
});

test('spieltag AC-22: Tore haben Vorlagen aus der eigenen Mannschaft', () => {
  const vereine = erste(4711);
  const tore = reihe(300, (zufall, i) => spiel(vereine[i % 18], vereine[(i + 3) % 18], zufall))
    .flatMap((e) => e.ereignisse.filter((x) => x.art === 'tor').map((x) => ({ ...x, e })));
  const mitVorlage = tore.filter((t) => t.vorlageId);
  assert.ok(mitVorlage.length > tore.length * 0.55, `nur ${mitVorlage.length} von ${tore.length} Toren mit Vorlage`);
  for (const t of mitVorlage) {
    assert.notEqual(t.vorlageId, t.spielerId);
    const verein = vereine.find((v) => v.id === t.verein);
    assert.ok(verein.spieler.some((s) => s.id === t.vorlageId), 'Vorlage von einem fremden Spieler');
  }
});

test('spieltag AC-7: Pressing staerkt das Mittelfeld, Haerte die Abwehr', () => {
  const vereine = erste(4711);
  const [a, b] = [vereine[5], vereine[6]];
  const pressing = reihe(400, (zufall) => spiel(a, b, zufall, { neutral: true, taktiken: { heim: { pressing: 5 }, gast: { pressing: 1 } } }));
  const mit = pressing.reduce((s, e) => s + e.chancen[0], 0);
  const ohne = pressing.reduce((s, e) => s + e.chancen[1], 0);
  assert.ok(mit > ohne * 1.1, `Pressing bringt keine Chancen: ${mit} zu ${ohne}`);

  const gegentore = (haerte) => reihe(1500, (zufall) => spiel(a, b, zufall, { neutral: true, taktiken: { heim: { haerte }, gast: { haerte: 3 } } }))
    .reduce((s, e) => s + e.tore[1], 0);
  const hart = gegentore(5);
  const weich = gegentore(1);
  assert.ok(hart < weich, `harte Abwehr kassiert nicht weniger: ${hart} zu ${weich}`);
});

test('spieltag AC-8: Taktikwerte werden auf dem Server begrenzt', () => {
  assert.deepEqual(taktikPruefen({ haerte: 99, pressing: -4, ausrichtung: 7 }), { system: '4-4-2', ausrichtung: 5, haerte: 5, pressing: 1 });
  assert.deepEqual(taktikPruefen({}), { system: '4-4-2', ausrichtung: 3, haerte: 3, pressing: 3 });
  assert.deepEqual(taktikPruefen({ haerte: 'viel', pressing: null }), { system: '4-4-2', ausrichtung: 3, haerte: 3, pressing: 3 });
  assert.equal(elfStellen(welt(4711)[0], 'Kraut und Rueben').length, 11);
});

test('spieltag AC-9: Haerte kostet Karten', () => {
  const vereine = erste(4711);
  const karten = (haerte) => reihe(300, (zufall) => spiel(vereine[5], vereine[6], zufall, { taktiken: { heim: { haerte }, gast: { haerte } } }))
    .reduce((s, e) => s + e.ereignisse.filter((x) => ['gelb', 'gelbrot', 'rot'].includes(x.art)).length, 0);
  const hart = karten(5);
  const weich = karten(1);
  assert.ok(weich > 0);
  assert.ok(hart > weich * 2, `harte Gangart bringt kaum Karten: ${hart} zu ${weich}`);
});

test('spieltag AC-12 und aufstellung AC-16: drei Wechsel je Spiel, nach der Wechselregel', () => {
  const vereine = erste(4711);
  // Muede sind die, die spielen; die Bank ist frisch. Aufgestellt wird vorher,
  // sonst saesse die frische Bank in der Elf.
  const spiele = reihe(400, (zufall, i) => {
    const [heim, gast] = [vereine[i % 18], vereine[(i + 1) % 18]];
    const aufstellungen = { heim: aufstellung(heim), gast: aufstellung(gast) };
    const elf = [...aufstellungen.heim.elf, ...aufstellungen.gast.elf];
    for (const s of elf) s.kondition = 70;
    const e = begegnung(heim, gast, zufall, {
      aufstellungen,
      taktiken: { heim: { haerte: 5 }, gast: { haerte: 5 } },
      wechselregeln: { heim: 'auto', gast: 'verletzung' },
    });
    for (const s of elf) s.kondition = 100;
    return e;
  });
  let muede = 0;
  for (const e of spiele) {
    assert.deepEqual(widersprueche(e), []);
    for (const x of e.ereignisse.filter((y) => y.art === 'wechsel')) {
      if (x.grund !== 'muede') continue;
      muede += 1;
      assert.equal(x.verein, e.heim, 'die Regel "nur bei Verletzung" hat einen Muden ausgewechselt');
      assert.ok([60, 70, 80].includes(x.minute));
    }
    // Die Minuten jedes Spielers: vom Anpfiff oder seiner Einwechslung bis zum
    // Schluss oder bis er vom Platz muss.
    for (const seite of ['heim', 'gast']) {
      const elf = new Set(e.aufstellung[seite].elf);
      for (const [id, minuten] of Object.entries(e.einsaetze)) {
        const rein = e.ereignisse.find((y) => y.art === 'wechsel' && y.reinId === id);
        if (!elf.has(id) && !(rein && e.aufstellung[seite].bank.includes(id))) continue;
        const von = elf.has(id) ? 0 : rein.minute;
        const raus = e.ereignisse.find((y) => y.spielerId === id && y.minute >= von && !(y.art === 'wechsel' && y.reinId === id)
          && ['rot', 'gelbrot', 'verletzung', 'wechsel'].includes(y.art));
        assert.equal(minuten, (raus ? raus.minute : e.dauer) - von, `Minuten von ${id}`);
      }
    }
  }
  assert.ok(muede > 100, `bei muedem Kader nur ${muede} Wechsel wegen Muedigkeit`);
});

test('spieltag AC-13: Verletzungen treibt die Haerte des Gegners', () => {
  const vereine = erste(4711);
  const verletzte = (gegnerHaerte) => reihe(600, (zufall) => spiel(vereine[3], vereine[4], zufall, { taktiken: { heim: { haerte: 3 }, gast: { haerte: gegnerHaerte } } }))
    .flatMap((e) => e.ereignisse.filter((x) => x.art === 'verletzung' && x.verein === e.heim));
  const gegenHart = verletzte(5);
  const gegenWeich = verletzte(1);
  for (const x of gegenHart) assert.ok(x.dauer >= 1 && x.dauer <= 6);
  assert.ok(gegenHart.length > gegenWeich.length * 2, `${gegenHart.length} gegen harte, ${gegenWeich.length} gegen weiche Gegner`);
});

test('spieltag AC-14: Unterzahl schwaecht fuer den Rest des Spiels', () => {
  const vereine = erste(4711);
  const [a, b] = [vereine[6], vereine[7]];
  const zehn = () => {
    const voll = aufstellung(a);
    const raus = voll.elf.find((s) => s.position === MIT);
    return { elf: voll.elf.filter((s) => s !== raus), bank: voll.bank };
  };
  const mitZehn = reihe(800, (zufall) => spiel(a, b, zufall, { neutral: true, elfHeim: zehn() }));
  const mitElf = reihe(800, (zufall) => spiel(a, b, zufall, { neutral: true }));
  const gegentore = (liste) => liste.reduce((s, e) => s + e.tore[1], 0);
  const chancen = (liste) => liste.reduce((s, e) => s + e.chancen[0], 0);
  assert.ok(gegentore(mitZehn) > gegentore(mitElf), `zu zehnt ${gegentore(mitZehn)}, zu elft ${gegentore(mitElf)} Gegentore`);
  assert.ok(chancen(mitZehn) < chancen(mitElf));
});

test('spieltag AC-17: nichts nach Platzverweis, Verletzung oder Wechsel', () => {
  const vereine = welt(4711);
  let ereignisse = 0;
  for (const e of reihe(800, (zufall, i) => spiel(vereine[i % 36], vereine[(i * 5 + 1) % 36], zufall, {
    taktiken: { heim: { haerte: 5 }, gast: { haerte: 4 } }, entscheidung: i % 3 === 0,
  }))) {
    if (e.heim === e.gast) continue;
    ereignisse += e.ereignisse.length;
    assert.deepEqual(widersprueche(e), []);
  }
  assert.ok(ereignisse > 5000, `nur ${ereignisse} Ereignisse in 800 Spielen`);
});

test('spieltag AC-18: die zweite Gelbe ist Gelb-Rot', () => {
  const vereine = erste(4711);
  const spiele = reihe(1000, (zufall, i) => spiel(vereine[i % 18], vereine[(i + 7) % 18], zufall));
  let gelbrot = 0;
  let rot = 0;
  for (const e of spiele) {
    assert.deepEqual(widersprueche(e).filter((f) => /Gelbe/.test(f)), []);
    gelbrot += e.ereignisse.filter((x) => x.art === 'gelbrot').length;
    rot += e.ereignisse.filter((x) => x.art === 'rot').length;
  }
  assert.ok(gelbrot > 0 && gelbrot / 1000 < 0.15, `${gelbrot / 1000} Gelb-Rot je Spiel`);
  assert.ok(rot / 1000 < 0.12, `${rot / 1000} Rot je Spiel`);
});

const ergebnisFuer = (verein, { tore = [0, 0], ereignisse = [], einsaetze = {}, noten = {}, gesperrt = [] } = {}) => ({
  heim: verein.id, gast: 'fremd', tore, sieger: null, ereignisse, einsaetze, noten, gesperrt: { heim: gesperrt, gast: [] },
});

test('spieltag AC-10: Spielen kostet Kondition, nach Minuten', () => {
  const [a, b] = welt(4711);
  for (const spieler of a.spieler) spieler.kondition = 90;
  const e = spiel(a, b, zufallAus(3));
  const vorher = new Map(a.spieler.map((s) => [s.id, s.kondition]));
  nachwirkung(a, e);
  let voll = 0;
  for (const spieler of a.spieler) {
    const minuten = e.einsaetze[spieler.id] || 0;
    const verlust = vorher.get(spieler.id) - spieler.kondition;
    if (!minuten) assert.equal(verlust, 0, `${spieler.name} sass draussen und hat verloren`);
    else assert.ok(Math.abs(verlust - minuten * 0.13) <= 1, `${spieler.name}: ${minuten} Minuten, ${verlust} verloren`);
    if (minuten === 90) voll += 1;
  }
  assert.ok(voll >= 5);
});

test('spieltag AC-11: das Ergebnis bewegt die Moral', () => {
  const [a] = welt(4711);
  for (const spieler of a.spieler) spieler.moral = 50;
  const elf = a.spieler.slice(0, 11);
  const einsaetze = Object.fromEntries(elf.map((s) => [s.id, 90]));
  const stimmung = () => schnitt(elf, (s) => s.moral);

  nachwirkung(a, ergebnisFuer(a, { tore: [3, 0], einsaetze }));
  assert.ok(stimmung() > 50, 'ein Sieg hebt die Moral nicht');
  const nachSieg = stimmung();
  nachwirkung(a, ergebnisFuer(a, { tore: [0, 3], einsaetze }));
  assert.ok(stimmung() < nachSieg, 'eine Niederlage drueckt die Moral nicht');

  const draussen = a.spieler[15];
  draussen.staerke = 99;
  const vorher = draussen.moral;
  nachwirkung(a, ergebnisFuer(a, { tore: [1, 1], einsaetze }));
  assert.equal(draussen.moral, vorher - 1, 'wer gut genug ist und nicht spielt, bleibt zufrieden');

  for (let i = 0; i < 60; i++) nachwirkung(a, ergebnisFuer(a, { tore: [0, 5], einsaetze }));
  assert.ok(a.spieler.every((s) => s.moral >= 10 && s.moral <= 100));
});

test('spieltag AC-15: Karten sperren, gezaehlt in Spielen', () => {
  const [verein] = welt(4711);
  const einer = verein.spieler[5];
  const ereignis = (art, minute = 40) => ({ minute, art, verein: verein.id, spielerId: einer.id, spieler: einer.name });

  for (let i = 1; i <= 4; i++) {
    nachwirkung(verein, ergebnisFuer(verein, { ereignisse: [ereignis('gelb')] }));
    assert.equal(einer.sperre, 0, `nach ${i} Gelben gesperrt`);
  }
  const folgen = nachwirkung(verein, ergebnisFuer(verein, { ereignisse: [ereignis('gelb')] }));
  assert.equal(einer.sperre, 1);
  assert.equal(einer.gelbe, 0);
  assert.equal(folgen[0].art, 'sperre');

  // Abgesessen wird in einem Spiel, in dem er gesperrt fehlte.
  nachwirkung(verein, ergebnisFuer(verein, { gesperrt: [einer.id] }));
  assert.equal(einer.sperre, 0);

  // Gelb-Rot: ein Spiel, und die Gelbe davor zaehlt nicht fuer die fuenf.
  nachwirkung(verein, ergebnisFuer(verein, { ereignisse: [ereignis('gelb', 20), ereignis('gelbrot', 70)] }));
  assert.equal(einer.sperre, spieltag.GELBROTSPERRE);
  assert.equal(einer.gelbe, 0);

  nachwirkung(verein, ergebnisFuer(verein, { ereignisse: [ereignis('rot')] }));
  assert.equal(einer.sperre, spieltag.GELBROTSPERRE + spieltag.ROTSPERRE);
});

test('spieltag AC-16: begegnung() aendert die Vereine nicht', () => {
  const vereine = welt(4711);
  const vorher = JSON.stringify(vereine);
  const zufall = zufallAus(3);
  for (let i = 0; i < 50; i++) spiel(vereine[0], vereine[1], zufall, { entscheidung: true });
  assert.equal(JSON.stringify(vereine), vorher);
});

test('spieltag AC-20: Noten fuer jeden, der mindestens zwanzig Minuten spielte', () => {
  const vereine = erste(4711);
  const mitTor = [];
  const ohneTor = [];
  for (const e of reihe(300, (zufall, i) => spiel(vereine[i % 18], vereine[(i + 2) % 18], zufall))) {
    const schuetzen = new Set(e.ereignisse.filter((x) => x.art === 'tor').map((x) => x.spielerId));
    for (const [id, minuten] of Object.entries(e.einsaetze)) {
      const note = e.noten[id];
      if (minuten < 20) {
        assert.equal(note, undefined);
        continue;
      }
      assert.ok(note >= 1 && note <= 6 && Number.isInteger(note * 2), `Note ${note}`);
      (schuetzen.has(id) ? mitTor : ohneTor).push(note);
    }
  }
  assert.ok(schnitt(mitTor, (x) => x) < schnitt(ohneTor, (x) => x) - 0.4, 'Torschuetzen bekommen keine besseren Noten');
});

// ----------------------------------------------------------------- Liga

const ids = (anzahl) => Array.from({ length: anzahl }, (_, i) => `v${i + 1}`);

test('liga AC-1: jeder gegen jeden, hin und zurueck', () => {
  const plan = liga.spielplan(ids(18));
  assert.equal(plan.length, 34);
  for (const tag of plan) assert.equal(tag.length, 9);
});

test('liga AC-2: an jedem Spieltag spielt jeder genau einmal', () => {
  for (const anzahl of [4, 10, 18, 24]) {
    for (const tag of liga.spielplan(ids(anzahl))) {
      assert.equal(new Set(tag.flatMap((p) => [p.heim, p.gast])).size, anzahl);
    }
  }
});

test('liga AC-3: Heimrecht ist ueber die Saison ausgeglichen', () => {
  const plan = liga.spielplan(ids(18)).flat();
  for (const id of ids(18)) {
    assert.equal(plan.filter((p) => p.heim === id).length, 17);
    assert.equal(plan.filter((p) => p.gast === id).length, 17);
  }
});

test('liga AC-4: jede Paarung gibt es einmal je Richtung', () => {
  const plan = liga.spielplan(ids(18)).flat();
  const gesehen = new Set(plan.map((p) => `${p.heim}>${p.gast}`));
  assert.equal(gesehen.size, 18 * 17);
  for (const p of plan) assert.ok(gesehen.has(`${p.gast}>${p.heim}`));
});

test('liga AC-5: drei Punkte fuer den Sieg, einer fuers Unentschieden', () => {
  const tabelle = liga.leereTabelle([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]);
  liga.verbuchen(tabelle, { heim: 'a', gast: 'b', tore: [2, 1] });
  assert.deepEqual(tabelle.map((z) => [z.punkte, z.siege, z.niederlagen, z.tore, z.gegentore]), [[3, 1, 0, 2, 1], [0, 0, 1, 1, 2]]);
  liga.verbuchen(tabelle, { heim: 'b', gast: 'a', tore: [1, 1] });
  assert.deepEqual(tabelle.map((z) => [z.punkte, z.spiele, z.unentschieden]), [[4, 2, 1], [1, 2, 1]]);
});

test('liga AC-6: bei Gleichstand entscheiden Tordifferenz, Tore, dann der Name', () => {
  const zeile = (id, name, punkte, tore, gegentore, abzug = 0) => ({
    id, name, punkte, tore, gegentore, abzug, spiele: 10, siege: 0, unentschieden: 0, niederlagen: 0,
  });
  const sortiert = liga.sortiert([
    zeile('c', 'Cesar', 20, 30, 25),
    zeile('a', 'Anton', 20, 25, 20),
    zeile('b', 'Berta', 20, 28, 20),
    zeile('d', 'Dora', 21, 1, 40),
    zeile('e', 'Emil', 20, 25, 20),
    zeile('f', 'Fritz', 25, 50, 10, 6),
  ]);
  assert.deepEqual(sortiert.map((z) => z.id), ['d', 'b', 'c', 'a', 'e', 'f']);
});

test('liga AC-11: die letzten drei steigen ab, die ersten drei auf', () => {
  const zeilen = (praefix) => ids(18).map((id, i) => ({
    id: `${praefix}${id}`, name: `${praefix}${id}`, punkte: 60 - i * 3, tore: 40, gegentore: 30, abzug: 0,
  }));
  const { absteiger, aufsteiger } = liga.aufUndAbstieg(zeilen('e'), zeilen('z'));
  assert.deepEqual(absteiger, ['ev16', 'ev17', 'ev18']);
  assert.deepEqual(aufsteiger, ['zv1', 'zv2', 'zv3']);
});

test('liga AC-16: ein Kalender fuer Liga, Pokal und Pausen', () => {
  const termine = kalender.saisonKalender();
  assert.equal(termine.length, 42);
  assert.equal(kalender.TERMINE_JE_SAISON, 42);
  assert.equal(termine[0].art, 'vorbereitung');
  assert.equal(termine.at(-1).art, 'saisonende');
  assert.deepEqual(termine.filter((t) => t.art === 'liga').map((t) => t.nr), Array.from({ length: 34 }, (_, i) => i + 1));
  assert.deepEqual(termine.filter((t) => t.art === 'pokal').map((t) => t.runde), [1, 2, 3, 4, 5]);
  const index = (passt) => termine.findIndex(passt);
  assert.equal(index((t) => t.art === 'winterpause'), index((t) => t.art === 'liga' && t.nr === 17) + 1);
  assert.equal(index((t) => t.art === 'pokal' && t.runde === 5), index((t) => t.art === 'liga' && t.nr === 34) + 1);
  assert.equal(kalender.terminTitel(termine[1]), '1. Spieltag');
  assert.equal(kalender.terminTitel({ art: 'pokal', runde: 2 }), 'Pokal, Achtelfinale');
});

// ---------------------------------------------------------------- Pokal

test('pokal AC-1: die erste Liga und die vierzehn Besten der zweiten', () => {
  const vereine = welt(4711);
  const zweite = vereine.filter((v) => v.liga === 2).reverse().map((v) => v.id);
  const dabei = pokal.teilnehmer(vereine, zweite);
  assert.equal(dabei.length, 32);
  for (const verein of vereine.filter((v) => v.liga === 1)) assert.ok(dabei.includes(verein.id));
  assert.deepEqual(dabei.slice(18), zweite.slice(0, 14));
});

test('pokal AC-2: ausgelost wird ohne Setzliste, wiederholbar', () => {
  const alle = ids(32);
  const eine = pokal.auslosen(alle, zufallAus(9));
  assert.deepEqual(eine, pokal.auslosen(alle, zufallAus(9)));
  assert.notDeepEqual(eine, pokal.auslosen(alle, zufallAus(10)));
  assert.equal(eine.length, 16);
  assert.equal(new Set(eine.flatMap((p) => [p.heim, p.gast])).size, 32);
});

test('pokal AC-3: jedes Pokalspiel hat einen Sieger', () => {
  const vereine = erste(4711);
  let verlaengert = 0;
  let elfmeter = 0;
  for (const e of reihe(400, (zufall) => spiel(vereine[8], vereine[9], zufall, { entscheidung: true }))) {
    assert.ok(e.sieger === e.heim || e.sieger === e.gast);
    if (e.verlaengerung) {
      verlaengert += 1;
      assert.equal(e.dauer, 120);
    } else {
      assert.notEqual(e.tore[0], e.tore[1]);
    }
    if (e.elfmeter) {
      elfmeter += 1;
      assert.equal(e.tore[0], e.tore[1]);
      assert.notEqual(e.elfmeter[0], e.elfmeter[1]);
      assert.equal(e.sieger, e.elfmeter[0] > e.elfmeter[1] ? e.heim : e.gast);
      const schuesse = (id) => e.ereignisse.filter((x) => x.verein === id && x.art.startsWith('elfmeter')).length;
      assert.equal(schuesse(e.heim), schuesse(e.gast));
      assert.ok(schuesse(e.heim) >= 3);
    }
  }
  assert.ok(verlaengert > 30 && elfmeter > 5, `${verlaengert} Verlaengerungen, ${elfmeter} Elfmeterschiessen`);
});

test('pokal AC-4: auf neutralem Platz zaehlt kein Heimvorteil', () => {
  const vereine = erste(4711);
  const [a, b] = [vereine[8], vereine[9]];
  const siegeVonA = (neutral) => {
    const daheim = reihe(1000, (zufall) => spiel(a, b, zufall, { neutral })).filter((e) => e.tore[0] > e.tore[1]).length;
    const auswaerts = reihe(1000, (zufall) => spiel(b, a, zufall, { neutral })).filter((e) => e.tore[1] > e.tore[0]).length;
    return daheim - auswaerts;
  };
  const mitHeimvorteil = siegeVonA(false);
  const neutral = siegeVonA(true);
  assert.ok(mitHeimvorteil > 60, `mit Heimvorteil nur ${mitHeimvorteil} Siege Unterschied`);
  assert.ok(Math.abs(neutral) < mitHeimvorteil / 2, `neutral noch ${neutral} Siege Unterschied`);
});

// ------------------------------------------------------------- Finanzen

test('finanzen AC-2: Erfolg und Ruf fuellen das Stadion', () => {
  const verein = welt(4711).find((v) => v.liga === 2);
  assert.ok(finanzen.auslastung(verein, { stimmung: 1 }) > finanzen.auslastung(verein, { stimmung: 0 }) * 1.2);
  assert.ok(finanzen.auslastung({ ...verein, reputation: 80 }) > finanzen.auslastung({ ...verein, reputation: 20 }));
  assert.ok(finanzen.auslastung(verein, { gegner: { reputation: 95 } }) > finanzen.auslastung(verein, { gegner: { reputation: 5 } }));
  const zufall = zufallAus(4);
  for (let i = 0; i < 200; i++) {
    const kasse = finanzen.heimspiel({ ...verein, reputation: 100, eintritt: 5 }, zufall, { stimmung: 1 });
    assert.ok(kasse.zuschauer <= verein.stadion.plaetze, 'mehr Zuschauer als Plaetze');
  }
});

test('finanzen AC-3: Fernsehgeld nach Liga und Vorjahresrang', () => {
  const mitte = finanzen.FERNSEHGELD[1];
  assert.equal(finanzen.fernsehgeld({ liga: 1, tvRang: 1 }), Math.round(mitte * 1.4));
  assert.equal(finanzen.fernsehgeld({ liga: 1, tvRang: 18 }), Math.round(mitte * 0.6));
  assert.ok(finanzen.fernsehgeld({ liga: 2, tvRang: 1 }) < finanzen.fernsehgeld({ liga: 1, tvRang: 1 }));
  assert.ok(finanzen.fernsehgeld({ liga: 2, tvRang: 18 }) > 0);
});

test('finanzen AC-4: Praemie nach Platz, der Meister vorn', () => {
  for (const nummer of [1, 2]) {
    for (let platz = 1; platz < 18; platz++) {
      assert.ok(finanzen.saisonpraemie(nummer, platz) > finanzen.saisonpraemie(nummer, platz + 1));
    }
  }
  assert.ok(finanzen.saisonpraemie(1, 18) > 0);
  assert.ok(finanzen.saisonpraemie(1, 9) > finanzen.saisonpraemie(2, 9));
  assert.ok(finanzen.saisonpraemie(1, 1) - finanzen.saisonpraemie(1, 2) >= finanzen.MEISTERPRAEMIE[1]);
});

test('finanzen AC-5: Gehaelter laufen jeden Termin', () => {
  const [verein] = welt(4711);
  const jahr = verein.spieler.reduce((s, x) => s + x.vertrag.gehalt, 0);
  assert.equal(finanzen.gehaelter(verein), Math.round(jahr / 42));
});

test('finanzen AC-11: ein Minus kostet Zinsen, ein Guthaben bringt nichts', () => {
  assert.equal(finanzen.zinsen({ konto: 5000 }), 0);
  assert.equal(finanzen.zinsen({ konto: -10000 }), -30);
});

test('finanzen AC-12: der Eintrittspreis ist ein Regler', () => {
  assert.equal(finanzen.eintrittPruefen(200), finanzen.PREIS_MAX);
  assert.equal(finanzen.eintrittPruefen(1), finanzen.PREIS_MIN);
  assert.equal(finanzen.eintrittPruefen(Number('viel')), null);
  const verein = welt(4711).find((v) => v.liga === 2);
  assert.ok(finanzen.auslastung({ ...verein, eintritt: 40 }) < finanzen.auslastung({ ...verein, eintritt: 14 }));
  assert.ok(finanzen.auslastung({ ...verein, eintritt: 5 }) > finanzen.auslastung({ ...verein, eintritt: 14 }));
});

test('finanzen AC-13: drei Sponsoren zur Wahl', () => {
  const vereine = welt(4711);
  const angebote = finanzen.sponsorAngebote(vereine[0], zufallAus(2), 1);
  assert.deepEqual(angebote.map((a) => a.art), ['sicher', 'ausgewogen', 'erfolg']);
  assert.ok(angebote[0].jeSpiel > angebote[2].jeSpiel);
  assert.ok(angebote[2].jeSieg > angebote[0].jeSieg);
  const zweite = finanzen.sponsorAngebote({ ...vereine[0], liga: 2 }, zufallAus(2), 1);
  assert.ok(zweite[1].jeSpiel < angebote[1].jeSpiel, 'die zweite Liga bringt so viel wie die erste');
});

test('finanzen AC-14: Stadionausbau in drei Stufen', () => {
  const verein = { konto: 20000, stadion: { plaetze: 30000, ausbau: null } };
  assert.equal(finanzen.ausbauPruefen(verein, 4).fehler, 'Diese Ausbaustufe gibt es nicht.');
  assert.match(finanzen.ausbauPruefen({ ...verein, konto: 100 }, 1).fehler, /Geld/);
  assert.match(finanzen.ausbauPruefen({ ...verein, stadion: { plaetze: 74000, ausbau: null } }, 1).fehler, /75\.000/);
  const plan = finanzen.ausbauPruefen(verein, 2);
  assert.deepEqual([plan.plaetze, plan.kosten, plan.termine], [5000, 5500, 6]);

  verein.stadion.ausbau = { plaetze: plan.plaetze, rest: plan.termine };
  assert.match(finanzen.ausbauPruefen(verein, 1).fehler, /gebaut/);
  for (let i = 0; i < 5; i++) assert.equal(finanzen.ausbauWeiter(verein), 0);
  assert.equal(finanzen.ausbauWeiter(verein), 5000);
  assert.equal(verein.stadion.plaetze, 35000);
  assert.equal(verein.stadion.ausbau, null);
});

// ------------------------------------------------------------- Vertraege

test('vertraege AC-1: jeder im Verein hat einen Vertrag, Vereinslose keinen', () => {
  const { vereine, freie } = weltErzeugen(4711);
  for (const spieler of vereine.flatMap((v) => v.spieler)) {
    assert.ok(spieler.vertrag.bis >= 1 && spieler.vertrag.bis <= 4);
    assert.equal(spieler.vertrag.gehalt, kader.jahresgehalt(spieler.staerke));
  }
  assert.ok(freie.length > 0 && freie.every((s) => s.vertrag === null));
});

test('vertraege AC-2: der Spieler nennt sein Gehalt', () => {
  const grund = { staerke: 70, talent: 70, moral: 60, alter: 26 };
  const wunsch = (werte) => vertraege.gehaltswunsch({ ...grund, ...werte });
  assert.ok(wunsch({ staerke: 80, talent: 80 }) > wunsch({}));
  assert.ok(wunsch({ talent: 90 }) > wunsch({}));
  assert.ok(wunsch({ moral: 20 }) > wunsch({}));
  assert.ok(wunsch({ alter: 32 }) < wunsch({}));
  assert.equal(vertraege.neuerVertrag({ ...grund }, 3, 5).bis, 7);
});

test('vertraege AC-3: die Laufzeit richtet sich nach dem Alter', () => {
  assert.deepEqual([30, 31, 32, 33, 36].map((alter) => vertraege.laufzeitMax({ alter })), [4, 2, 2, 1, 1]);
  assert.equal(vertraege.laufzeitPruefen({ alter: 25, name: 'A' }, 4), null);
  assert.match(vertraege.laufzeitPruefen({ alter: 33, name: 'A' }, 2), /hoechstens fuer 1 Jahr/);
  assert.match(vertraege.laufzeitPruefen({ alter: 25, name: 'A' }, 0), /mindestens/);
  assert.match(vertraege.laufzeitPruefen({ alter: 25, name: 'A' }, 1.5), /mindestens/);
});

test('vertraege AC-4 und vertraege AC-5: verlaengert wird kurz vor Schluss, und nicht von Unzufriedenen', () => {
  const spieler = (bis, moral = 60) => ({ name: 'Ole', alter: 26, staerke: 70, talent: 72, moral, vertrag: { bis, gehalt: 1 } });
  assert.match(vertraege.verlaengern(spieler(4), 2, 2).fehler, /laeuft noch bis Saison 4/);
  const naechstes = spieler(3);
  assert.deepEqual(vertraege.verlaengern(naechstes, 2, 2), { ok: true, bis: 5, gehalt: vertraege.gehaltswunsch(naechstes) });
  const dieses = spieler(2);
  assert.equal(vertraege.verlaengern(dieses, 1, 2).bis, 3);
  assert.match(vertraege.verlaengern(spieler(2, 20), 1, 2).fehler, /will den Verein verlassen/);
});

test('vertraege AC-9: Abfindung ist die Haelfte der restlichen Gehaelter', () => {
  assert.equal(vertraege.abfindung({ vertrag: { bis: 4, gehalt: 1000 } }, 2), 1500);
  assert.equal(vertraege.abfindung({ vertrag: { bis: 2, gehalt: 1000 } }, 2), 500);
  assert.equal(vertraege.abfindung({ vertrag: null }, 2), 0);
});

// --------------------------------------------------------------- Vorstand

test('vorstand AC-1: das Ziel passt zum Kader', () => {
  const vereine = welt(4711);
  const eins = vereine.filter((v) => v.liga === 1).sort((a, b) => niveau(b) - niveau(a));
  const zwei = vereine.filter((v) => v.liga === 2).sort((a, b) => niveau(b) - niveau(a));
  assert.deepEqual(vorstand.saisonziel(vereine, eins[0]), { art: 'titel', text: 'Um die Meisterschaft spielen', platz: 3, rang: 1 });
  assert.equal(vorstand.saisonziel(vereine, eins[9]).art, 'mittelfeld');
  assert.equal(vorstand.saisonziel(vereine, eins[17]).art, 'klassenerhalt');
  assert.equal(vorstand.saisonziel(vereine, zwei[0]).art, 'aufstieg');
  assert.equal(vorstand.saisonziel(vereine, zwei[0]).platz, 3);
});

test('vorstand AC-2: Ergebnisse bewegen das Vertrauen', () => {
  const neu = () => ({ vertrauen: 50, ziel: { platz: 6 } });
  const nach = (werte) => { const v = neu(); vorstand.nachLigaspiel(v, { platz: 6, spieltag: 1, gegnerStaerker: false, ...werte }); return v.vertrauen; };
  assert.ok(nach({ ergebnis: 'sieg' }) > 50);
  assert.ok(nach({ ergebnis: 'niederlage' }) < 50);
  assert.ok(nach({ ergebnis: 'niederlage', gegnerStaerker: true }) > nach({ ergebnis: 'niederlage' }));
  // Spaet in der Saison wiegt der Abstand zum Ziel schwerer.
  const frueh = nach({ ergebnis: 'unentschieden', platz: 14, spieltag: 2 });
  const spaet = nach({ ergebnis: 'unentschieden', platz: 14, spieltag: 30 });
  assert.ok(spaet < frueh);
  const pokal = { vertrauen: 50 };
  vorstand.nachPokalspiel(pokal, { weiter: false, gegnerLigaTiefer: true });
  assert.equal(pokal.vertrauen, 46);
});

test('vorstand AC-3: Schulden kosten Vertrauen', () => {
  const v = { vertrauen: 50 };
  vorstand.nachKasse(v, -1000);
  assert.equal(v.vertrauen, 50);
  vorstand.nachKasse(v, -2500);
  assert.equal(v.vertrauen, 49);
});

test('vorstand AC-4: entlassen wird nicht vor dem 8. Spieltag', () => {
  assert.equal(vorstand.entlassen({ vertrauen: 0 }, 7), false);
  assert.equal(vorstand.entlassen({ vertrauen: 14.9 }, 8), true);
  assert.equal(vorstand.entlassen({ vertrauen: 15 }, 20), false);
});

test('vorstand AC-5: die Saisonbilanz', () => {
  const erreicht = { vertrauen: 50, ziel: { platz: 6 } };
  assert.deepEqual(vorstand.saisonbilanz(erreicht, 4), { erreicht: true, delta: 15, entlassen: false });
  assert.equal(erreicht.vertrauen, 65);
  const knapp = { vertrauen: 50, ziel: { platz: 6 } };
  assert.deepEqual(vorstand.saisonbilanz(knapp, 9), { erreicht: false, delta: -9, entlassen: false });
  const weg = { vertrauen: 40, ziel: { platz: 6 } };
  assert.equal(vorstand.saisonbilanz(weg, 12).entlassen, true);
});

test('vorstand AC-6: drei Vereine bieten an, nie keiner', () => {
  const vereine = welt(4711);
  const schwaechster = vereine.slice().sort((a, b) => niveau(a) - niveau(b))[0];
  const staerkster = vereine.slice().sort((a, b) => niveau(b) - niveau(a))[0];
  for (const frueher of [schwaechster, staerkster, vereine[20]]) {
    const angebote = vorstand.stellenangebote(vereine, frueher, zufallAus(1));
    assert.equal(angebote.length, 3);
    assert.ok(!angebote.includes(frueher.id));
    assert.equal(new Set(angebote).size, 3);
  }
  const vomBesten = vorstand.stellenangebote(vereine, staerkster, zufallAus(1)).map((id) => vereine.find((v) => v.id === id));
  assert.ok(vomBesten.every((v) => niveau(v) < niveau(staerkster)), 'nach der Entlassung ein staerkerer Verein');
});

// ------------------------------------------------------------- Transfer

test('transfer AC-1: der Marktwert waechst steiler als die Staerke', () => {
  const gut = marktwert({ alter: 26, staerke: 70, talent: 70 });
  const stark = marktwert({ alter: 26, staerke: 88, talent: 88 });
  assert.ok(stark > gut * 2.2);
});

test('transfer AC-2: Alter drueckt den Wert', () => {
  const grund = { staerke: 80, talent: 80 };
  assert.ok(marktwert({ ...grund, alter: 22 }) > marktwert({ ...grund, alter: 26 }));
  assert.ok(marktwert({ ...grund, alter: 33 }) < marktwert({ ...grund, alter: 26 }) / 2);
});

test('transfer AC-3: ungenutztes Talent hebt den Wert', () => {
  assert.ok(marktwert({ staerke: 70, talent: 90, alter: 26 }) > marktwert({ staerke: 70, talent: 70, alter: 26 }));
});

test('transfer AC-15: das Fenster ist im Sommer und im Winter offen', () => {
  const offen = kalender.saisonKalender().filter(kalender.fensterOffen).map(kalender.terminTitel);
  assert.deepEqual(offen, ['Saisonvorbereitung', '1. Spieltag', '2. Spieltag', '3. Spieltag', 'Winterpause', '18. Spieltag']);
  assert.match(kalender.fensterText({ art: 'liga', nr: 10 }), /geschlossen/);
});

// --------------------------------------------------------------- Taktik

/** Punkte und Chancen je Spiel fuer A mit einer Taktik, Heim und Auswaerts im Wechsel. */
function punkteReihe(a, b, taktikA, anzahl = 1200) {
  const zufall = zufallAus(77);
  let punkte = 0;
  let chancen = 0;
  for (let i = 0; i < anzahl; i++) {
    const daheim = i % 2 === 0;
    const [heim, gast] = daheim ? [a, b] : [b, a];
    const e = spiel(heim, gast, zufall, { taktiken: daheim ? { heim: taktikA } : { gast: taktikA } });
    const [ich, du] = daheim ? e.tore : [e.tore[1], e.tore[0]];
    punkte += ich > du ? 3 : ich === du ? 1 : 0;
    chancen += e.chancen[0] + e.chancen[1];
  }
  return { punkte: punkte / anzahl, chancen: chancen / anzahl };
}

const mitAusrichtung = (ausrichtung) => ({ ...spieltag.TAKTIK_VORGABE, ausrichtung });

test('spieltag AC-23: die Ausrichtung oeffnet oder verriegelt das Spiel', () => {
  const liga = erste(4711);
  const [favorit, aussenseiter] = [liga[1], liga[16]];
  const offen = punkteReihe(favorit, aussenseiter, mitAusrichtung(5));
  const zu = punkteReihe(favorit, aussenseiter, mitAusrichtung(1));
  assert.ok(offen.chancen > zu.chancen * 1.15, `offen ${offen.chancen.toFixed(1)}, verriegelt ${zu.chancen.toFixed(1)} Chancen`);
  assert.ok(offen.punkte > zu.punkte + 0.1, `der Favorit holt offensiv ${offen.punkte.toFixed(2)}, mauernd ${zu.punkte.toFixed(2)}`);
  const mauern = punkteReihe(aussenseiter, favorit, mitAusrichtung(1));
  const angreifen = punkteReihe(aussenseiter, favorit, mitAusrichtung(5));
  assert.ok(mauern.punkte > angreifen.punkte, `der Aussenseiter holt mauernd ${mauern.punkte.toFixed(2)}, offensiv ${angreifen.punkte.toFixed(2)}`);
});

test('spieltag AC-24: Pressing kostet Kondition, geuebtes weniger', () => {
  const mitPressing = (pressing) => ({ ...spieltag.TAKTIK_VORGABE, pressing });
  assert.ok(spieltag.ermuedung(mitPressing(5)) > spieltag.ermuedung(mitPressing(3)));
  assert.ok(spieltag.ermuedung(mitPressing(3)) > spieltag.ermuedung(mitPressing(1)));
  assert.ok(spieltag.ermuedung(mitPressing(5), 1) < spieltag.ermuedung(mitPressing(5), 0));
  const [verein] = welt(4711);
  const nachDemSpiel = (pressing) => {
    const kopie = JSON.parse(JSON.stringify(verein));
    const spieler = kopie.spieler[3];
    spieler.kondition = 100;
    nachwirkung(kopie, { ...ergebnisFuer(kopie, { einsaetze: { [spieler.id]: 90 } }), taktik: { heim: mitPressing(pressing) } });
    return spieler.kondition;
  };
  assert.ok(nachDemSpiel(5) < nachDemSpiel(3) && nachDemSpiel(3) < nachDemSpiel(1),
    `Kondition nach 90 Minuten: ${nachDemSpiel(5)} / ${nachDemSpiel(3)} / ${nachDemSpiel(1)}`);
});

test('spieltag AC-25: ein System muss sich einspielen', () => {
  const liga = erste(4711);
  const eingespielt = (wert) => {
    const kopie = JSON.parse(JSON.stringify(liga[8]));
    kopie.einstudiert.systeme['4-4-2'] = wert;
    return kopie;
  };
  const fremd = punkteReihe(eingespielt(0), liga[9], spieltag.TAKTIK_VORGABE);
  const vertraut = punkteReihe(eingespielt(100), liga[9], spieltag.TAKTIK_VORGABE);
  assert.ok(vertraut.punkte > fremd.punkte + 0.08, `eingespielt ${vertraut.punkte.toFixed(2)}, fremd ${fremd.punkte.toFixed(2)}`);

  const verein = JSON.parse(JSON.stringify(liga[8]));
  verein.einstudiert.systeme['4-3-3'] = 10;
  nachwirkung(verein, { ...ergebnisFuer(verein), taktik: { heim: { ...spieltag.TAKTIK_VORGABE, system: '4-3-3' } } });
  assert.equal(verein.einstudiert.systeme['4-3-3'], 10 + spieltag.SPIELPRAXIS);
});

test('aufstellung AC-19: was geuebt wird, sitzt besser, der Rest verblasst', () => {
  const [vorlage] = welt(4711);
  const verein = JSON.parse(JSON.stringify(vorlage));
  verein.training = 100;
  verein.schwerpunkt = 'pressing';
  verein.einstudiert = { systeme: { '4-4-2': 60, '4-3-3': 40 }, pressing: 20, abwehr: 20, angriff: 20 };
  kader.trainieren(verein);
  assert.deepEqual(verein.einstudiert, { systeme: { '4-4-2': 61, '4-3-3': 38 }, pressing: 28, abwehr: 18, angriff: 18 });
  assert.equal(verein.technikSumme, 0.75, 'der Schwerpunkt kostet keine Technik');
  verein.schwerpunkt = 'system';
  kader.trainieren(verein);
  assert.equal(verein.einstudiert.systeme['4-4-2'], 69);
  assert.equal(verein.einstudiert.pressing, 26);

  const erholung = (schwerpunkt) => {
    const kopie = JSON.parse(JSON.stringify(vorlage));
    kopie.training = 0;
    kopie.schwerpunkt = schwerpunkt;
    for (const s of kopie.spieler) s.kondition = 50;
    kader.trainieren(kopie);
    return schnitt(kopie.spieler, (s) => s.kondition);
  };
  assert.ok(erholung('keiner') > erholung('abwehr'), 'der Schwerpunkt kostet keine Erholung');
});

test('kader AC-19: zur Winterpause ein Teil der Entwicklung, ohne zu altern', () => {
  const [vorlage] = welt(4711);
  const vorbereiten = () => {
    const verein = JSON.parse(JSON.stringify(vorlage));
    Object.assign(verein.spieler[0], { alter: 19, staerke: 50, talent: 80 });
    verein.spieler[0].saison.minuten = 1500;
    verein.technikSumme = 10;
    verein.trainingswochen = 17;
    return verein;
  };
  const winter = vorbereiten();
  const alter = winter.spieler.map((s) => s.alter);
  kader.entwickeln(winter, zufallAus(4), 17, { anteil: 0.4, altern: false });
  assert.deepEqual(winter.spieler.map((s) => s.alter), alter);
  assert.deepEqual([winter.technikSumme, winter.trainingswochen], [10, 17]);
  assert.ok(winter.spieler[0].staerke > 50 && winter.spieler[0].staerke < 60, `nach der Hinrunde ${winter.spieler[0].staerke}`);

  const ganz = vorbereiten();
  kader.entwickeln(ganz, zufallAus(4), 17);
  assert.ok(ganz.spieler[0].staerke > winter.spieler[0].staerke);
});

test('manager AC-15: keine Einstellung ist immer die richtige', () => {
  const liga = erste(4711);
  const punkte = (a, b, ausrichtung) => punkteReihe(a, b, mitAusrichtung(ausrichtung), 1500).punkte;
  // Der Favorit faehrt offensiv besser, der Aussenseiter mauernd - dieselbe
  // Einstellung ist also nicht fuer beide die richtige.
  const favorit = [punkte(liga[1], liga[16], 1), punkte(liga[1], liga[16], 5)];
  const aussenseiter = [punkte(liga[16], liga[1], 1), punkte(liga[16], liga[1], 5)];
  assert.ok(favorit[1] > favorit[0] + 0.05, `der Favorit holt mauernd ${favorit[0].toFixed(2)}, offensiv ${favorit[1].toFixed(2)}`);
  assert.ok(aussenseiter[0] > aussenseiter[1] + 0.03, `der Aussenseiter holt mauernd ${aussenseiter[0].toFixed(2)}, offensiv ${aussenseiter[1].toFixed(2)}`);
  // Pressing bringt im Spiel und kostet danach - Haerte bringt Abwehr und kostet Karten.
  assert.ok(spieltag.ermuedung({ pressing: 5 }) > spieltag.ERMUEDUNG_JE_MINUTE * 1.2);
});
