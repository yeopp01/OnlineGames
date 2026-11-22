// Ein Spiel zum Anhalten (spieltag AC-26): anpfiff, spielen, eingreifen,
// abpfiff - und dazwischen eine Sicherung als JSON. Die Grundlage dafuer, ein
// Spiel live zu spielen und mitten in der zweiten Halbzeit zu speichern.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const kader = require('../server/spiele/manager/kader.js');
const {
  begegnung, anpfiff, spielen, eingreifen, abpfiff,
} = require('../server/spiele/manager/spieltag.js');
const { zufallAus, ziehen } = require('../server/spiele/manager/zufall.js');

const vereine = kader.weltErzeugen(4711).vereine;

function aufstellung(verein) {
  const elf = kader.elfStellen(verein, verein.taktik.system);
  return { elf, bank: kader.bankStellen(verein, elf), system: verein.taktik.system };
}

const einstellungenFuer = (heim, gast, rest = {}) => ({
  aufstellungen: { heim: aufstellung(heim), gast: aufstellung(gast) }, ...rest,
});

/** Eine Sicherung und ein Laden - nichts ueberlebt, was nicht in JSON steht. */
const rundreise = (spiel) => JSON.parse(JSON.stringify(spiel));

test('spieltag AC-26: der Zufall ist ein Wert und uebersteht die Sicherung', () => {
  const quelle = zufallAus(7);
  for (let i = 0; i < 5; i++) quelle();
  const gesichert = JSON.parse(JSON.stringify(quelle.stand));
  const weiter = Array.from({ length: 20 }, () => quelle());
  assert.deepEqual(Array.from({ length: 20 }, () => ziehen(gesichert)), weiter);
  assert.deepEqual(gesichert, quelle.stand);
  assert.throws(() => anpfiff(vereine[0], vereine[1], Math.random, einstellungenFuer(vereine[0], vereine[1])), /zufallAus/);
});

test('spieltag AC-26: stueckweise mit Sicherung dazwischen ergibt dasselbe wie begegnung()', () => {
  const halte = [[45, 90], [5, 20, 45, 46, 89, 90, 95, 120], [0, 60, 105], [90, 120, 121]];
  let verlaengert = 0;
  let elfmeter = 0;
  for (let i = 0; i < 80; i++) {
    const heim = vereine[i % 36];
    const gast = vereine[(i * 7 + 3) % 36 === i % 36 ? (i + 1) % 36 : (i * 7 + 3) % 36];
    const einstellungen = einstellungenFuer(heim, gast, { entscheidung: i % 2 === 0, neutral: i % 5 === 0 });

    const amStueck = zufallAus(100 + i);
    const erwartet = begegnung(heim, gast, amStueck, einstellungen);

    let spiel = rundreise(anpfiff(heim, gast, zufallAus(100 + i), einstellungen));
    for (const minute of halte[i % halte.length]) spiel = rundreise(spielen(spiel, minute));
    const geladen = rundreise(spiel);
    const ergebnis = abpfiff(geladen);

    assert.deepEqual(ergebnis, erwartet, `Spiel ${i} weicht ab`);
    // Der Spieltag zieht weiter, wo das Spiel aufhoerte - auch nach dem Laden.
    assert.deepEqual(geladen.zufall, amStueck.stand, `Spiel ${i}: der Zufall steht anders`);
    if (erwartet.verlaengerung) verlaengert += 1;
    if (erwartet.elfmeter) elfmeter += 1;
  }
  assert.ok(verlaengert >= 3, `nur ${verlaengert} Verlaengerungen - der Test sieht sie nicht`);
  assert.ok(elfmeter >= 1, 'kein Elfmeterschiessen - der Test sieht es nicht');
});

test('spieltag AC-26: ein Spiel haelt an jeder Minute und rechnet nicht darueber hinaus', () => {
  const [heim, gast] = vereine;
  const spiel = anpfiff(heim, gast, zufallAus(3), einstellungenFuer(heim, gast));
  assert.equal(spiel.minute, 0);
  spielen(spiel, 44);
  assert.equal(spiel.minute, 40, 'ein Abschnitt ueber die Minute hinaus');
  assert.ok(spiel.ereignisse.every((e) => e.minute <= 40));
  spielen(spiel, 45);
  assert.equal(spiel.minute, 45);
  assert.equal(spiel.vorbei, false);
  spielen(spiel, 90);
  assert.equal(spiel.vorbei, true, 'ein Ligaspiel ist nach 90 Minuten vorbei');
});

test('spieltag AC-26: ein Wechsel wirkt ab dem naechsten Abschnitt', () => {
  const [heim, gast] = vereine;
  const einstellungen = einstellungenFuer(heim, gast);
  const ohne = begegnung(heim, gast, zufallAus(11), einstellungen);

  const spiel = spielen(anpfiff(heim, gast, zufallAus(11), einstellungen), 45);
  const seite = spiel.seiten[0];
  const raus = seite.auf.find((s) => s.platz !== 'TW');
  const rein = seite.bank.find((s) => s.position !== kader.TOR);
  assert.deepEqual(eingreifen(spiel, 'heim', { wechsel: { raus: raus.id, rein: rein.id } }), { ok: true });
  const mit = abpfiff(rundreise(spiel));

  const bisHalbzeit = (e) => e.ereignisse.filter((x) => x.minute <= 45 && x.grund !== 'trainer');
  assert.deepEqual(bisHalbzeit(mit), bisHalbzeit(ohne), 'der Wechsel veraendert, was vorher war');
  const wechsel = mit.ereignisse.find((e) => e.art === 'wechsel' && e.grund === 'trainer');
  assert.deepEqual([wechsel.minute, wechsel.spielerId, wechsel.reinId, wechsel.platz], [45, raus.id, rein.id, raus.platz]);
  assert.equal(mit.einsaetze[raus.id], 45);
  assert.ok(mit.einsaetze[rein.id] <= 45 && mit.einsaetze[rein.id] > 0);
  const spaeter = mit.ereignisse.filter((e) => e.minute > 45 && e.art !== 'wechsel');
  assert.ok(spaeter.every((e) => e.spielerId !== raus.id && e.vorlageId !== raus.id), 'der Ausgewechselte spielt weiter');
});

test('spieltag AC-26: eine Taktik zur Pause wirkt ab der zweiten Halbzeit', () => {
  const [heim, gast] = vereine;
  const einstellungen = einstellungenFuer(heim, gast);
  // Am Anpfiff gedreht ist dasselbe wie von Anfang an so aufgestellt.
  const vorab = begegnung(heim, gast, zufallAus(4), { ...einstellungen, taktiken: { heim: { ...heim.taktik, ausrichtung: 5 } } });
  const sofort = anpfiff(heim, gast, zufallAus(4), einstellungen);
  eingreifen(sofort, 'heim', { taktik: { ausrichtung: 5 } });
  assert.deepEqual(abpfiff(sofort), vorab);

  // Zur Pause auf Sturm: ueber viele Spiele mehr Chancen in der zweiten Halbzeit.
  let chancenRuhig = 0;
  let chancenSturm = 0;
  for (let i = 0; i < 300; i++) {
    const startwert = 500 + i;
    const ruhig = spielen(anpfiff(heim, gast, zufallAus(startwert), einstellungen), 45);
    const sturm = rundreise(ruhig);
    eingreifen(sturm, 'heim', { taktik: { ausrichtung: 5 } });
    assert.equal(sturm.seiten[0].taktik.system, heim.taktik.system);
    const vorher = ruhig.seiten[0].chancen;
    chancenRuhig += abpfiff(ruhig).chancen[0] - vorher;
    chancenSturm += abpfiff(sturm).chancen[0] - vorher;
  }
  assert.ok(chancenSturm > chancenRuhig * 1.05, `Sturm ${chancenSturm}, ruhig ${chancenRuhig}`);
});

test('spieltag AC-26: was nicht geht, weist eingreifen() ab und aendert nichts', () => {
  const [heim, gast] = vereine;
  const spiel = anpfiff(heim, gast, zufallAus(2), einstellungenFuer(heim, gast));
  const seite = spiel.seiten[1];
  const feld = () => seite.auf.find((s) => s.platz !== 'TW');
  const torwart = () => seite.auf.find((s) => s.platz === 'TW');
  const ersatz = () => seite.bank.find((s) => s.position !== kader.TOR);
  const ersatzTorwart = () => seite.bank.find((s) => s.position === kader.TOR);

  const abgewiesen = (was, welche, fehler) => {
    const vorher = JSON.stringify(spiel);
    assert.deepEqual(eingreifen(spiel, welche, was), { fehler });
    assert.equal(JSON.stringify(spiel), vorher, `${fehler} - und doch geaendert`);
  };
  abgewiesen({ taktik: { ausrichtung: 1 } }, 'beide', 'Heim oder Gast?');
  abgewiesen({ wechsel: { raus: feld().id, rein: ersatz().id } }, 'gast', 'Gewechselt wird erst nach dem Anpfiff.');
  const anderes = seite.taktik.system === '4-4-2' ? '3-5-2' : '4-4-2';
  abgewiesen({ taktik: { system: anderes } }, 'gast', 'Das System lässt sich im Spiel nicht wechseln.');

  spielen(spiel, 30);
  abgewiesen({ wechsel: { raus: 'niemand', rein: ersatz().id } }, 'gast', 'Dieser Spieler steht nicht auf dem Platz.');
  abgewiesen({ wechsel: { raus: feld().id, rein: feld().id } }, 'gast', 'Dieser Spieler sitzt nicht auf der Bank.');
  if (ersatzTorwart()) {
    abgewiesen({ wechsel: { raus: feld().id, rein: ersatzTorwart().id } }, 'gast', 'Ins Tor gehört ein Torwart, ins Feld keiner.');
  }
  abgewiesen({ wechsel: { raus: torwart().id, rein: ersatz().id } }, 'gast', 'Ins Tor gehört ein Torwart, ins Feld keiner.');

  while (seite.wechsel < 3) {
    assert.deepEqual(eingreifen(spiel, 'gast', { wechsel: { raus: feld().id, rein: ersatz().id } }), { ok: true });
  }
  abgewiesen({ wechsel: { raus: feld().id, rein: 'x' } }, 'gast', 'Mehr als 3 Wechsel gehen nicht.');

  spielen(spiel, Infinity);
  abgewiesen({ taktik: { ausrichtung: 1 } }, 'heim', 'Das Spiel ist vorbei.');
});
