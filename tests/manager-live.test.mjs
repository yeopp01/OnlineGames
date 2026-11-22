// Das eigene Spiel live (Stufe M1, karriere AC-30 bis AC-32): der Termin ist
// gerechnet, das eigene Spiel wartet am Anpfiff, und erst der Abpfiff
// schliesst den Termin. Wer nicht eingreift, bekommt dasselbe wie vorgespult.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Karriere, TERMINE } = require('../server/spiele/manager/karriere.js');

const STARTWERT = 4711;
const ICH = 'm1';

function neueKarriere(startwert = STARTWERT) {
  return Karriere.neu({ startwert, vereinId: 'v5', name: 'Live' });
}

/** Weiter bis zum naechsten Termin, an dem der eigene Verein spielt. */
function bisZumSpiel(k, art = 'liga') {
  for (let i = 0; i < 80; i++) {
    const termin = TERMINE[k.termin];
    if (termin.art === art && k.eigenesSpielAm('v5', termin)?.gegnerId) return termin;
    assert.ok(k.weiter().ok);
  }
  throw new Error(`Kein ${art}-Spiel gefunden`);
}

/** Was ein Mensch von den uebrigen Spielen sehen koennte. */
function sichtbar(k) {
  const z = k.zustand(ICH);
  return {
    tabellen: z.tabellen, torjaeger: z.torjaeger, pokal: z.pokal, kalender: z.kalender, zuletzt: z.zuletzt, termin: z.termin,
  };
}

/** Das live gespielte Spiel in Schritten zu Ende - ohne Eingriff. */
function durchspielen(k, schritt = 15) {
  let antwort;
  for (let bis = k.offen.live.spiel.minute + schritt; ; bis += schritt) {
    antwort = k.liveSpielen(ICH, { bis });
    assert.ok(antwort.ok, antwort.fehler);
    if (!k.offen) return antwort;
  }
}

test('karriere AC-30: das eigene Spiel wartet am Anpfiff, der Termin schliesst erst mit dem Abpfiff', () => {
  const k = neueKarriere();
  const termin = bisZumSpiel(k);
  const index = k.termin;
  const vorher = sichtbar(k);

  const antwort = k.anpfeifen(ICH);
  assert.ok(antwort.ok, antwort.fehler);
  assert.equal(antwort.laufend.minute, 0);
  assert.deepEqual(antwort.laufend.ereignisse, []);
  assert.deepEqual(antwort.laufend.tore, [0, 0]);
  // Alle anderen Spiele sind gerechnet ...
  const gerechnet = k.offen.spiele.filter((s) => s.ergebnis);
  assert.equal(gerechnet.length, k.offen.spiele.length - 1, 'alle bis auf das eigene');
  assert.equal(k.offen.spiele.length, k.plaene[1][termin.nr - 1].length + k.plaene[2][termin.nr - 1].length);
  // ... aber nicht zu sehen, und der Termin steht noch.
  assert.deepEqual(sichtbar(k), vorher);
  assert.equal(k.termin, index);
  for (const nummer of [1, 2]) for (const p of k.plaene[nummer][termin.nr - 1]) assert.equal(p.tore ?? null, null);

  // Andere Zuege warten, bis abgepfiffen ist; ein zweiter Anpfiff auch.
  assert.equal(k.taktikSetzen(ICH, { ausrichtung: 5 }).fehler, 'Erst das laufende Spiel zu Ende spielen.');
  assert.equal(k.anpfeifen(ICH).fehler, 'Das Spiel läuft schon.');

  const halb = k.liveSpielen(ICH, { bis: 45 });
  assert.equal(halb.laufend.minute, 45);
  assert.equal(k.termin, index, 'zur Halbzeit ist der Termin noch offen');

  const ende = durchspielen(k);
  assert.ok(ende.bericht, 'mit dem Abpfiff kommt der Bericht des Termins');
  assert.equal(k.termin, index + 1);
  assert.equal(k.offen, undefined);
  assert.equal(k.zustand(ICH).laufend, null);
  for (const nummer of [1, 2]) for (const p of k.plaene[nummer][termin.nr - 1]) assert.ok(p.tore, 'jetzt stehen alle Ergebnisse');
  assert.equal(k.liveSpielen(ICH, { bis: 90 }).fehler, 'Es läuft kein Spiel.');
});

test('karriere AC-30: was im eigenen Spiel geschieht, aendert kein anderes Ergebnis', () => {
  const ohne = neueKarriere();
  const mit = neueKarriere();
  const termin = bisZumSpiel(ohne);
  bisZumSpiel(mit);
  ohne.weiter();

  mit.anpfeifen(ICH);
  // Ein Trainer, der alles nach vorn wirft und dreimal wechselt.
  mit.liveSpielen(ICH, { bis: 30, taktik: { ausrichtung: 5, pressing: 5 } });
  const eigene = mit.offen.live.spiel.seiten[mit.offen.live.seite === 'heim' ? 0 : 1];
  for (let i = 0; i < 3; i++) {
    const raus = eigene.auf.find((s) => s.platz !== 'TW');
    const rein = eigene.bank.find((s) => s.position !== 'TOR');
    if (!raus || !rein) break;
    assert.ok(mit.liveSpielen(ICH, { wechsel: { raus: raus.id, rein: rein.id } }).ok);
  }
  durchspielen(mit);

  const fremde = (k) => [1, 2].flatMap((n) => k.plaene[n][termin.nr - 1]
    .filter((p) => p.heim !== 'v5' && p.gast !== 'v5').map((p) => `${p.heim}-${p.gast} ${p.tore}`));
  assert.deepEqual(fremde(mit), fremde(ohne));
});

test('karriere AC-30: ein angehaltenes Spiel uebersteht Sichern und Laden', () => {
  const k = neueKarriere();
  bisZumSpiel(k);
  k.anpfeifen(ICH);
  k.liveSpielen(ICH, { bis: 35, taktik: { ausrichtung: 4 } });

  const geladen = Karriere.laden(k.sichern());
  assert.deepEqual(geladen.zustand(ICH).laufend, k.zustand(ICH).laufend);
  durchspielen(k, 10);
  durchspielen(geladen, 25);
  assert.deepEqual(geladen.sichern(), k.sichern(), 'gleiche Fortsetzung, auch in anderen Schritten');
});

test('karriere AC-30: auch im Pokal, mit Verlaengerung und Elfmeterschiessen', () => {
  // Ein Pokalspiel mit Entscheidung: bis 90 bleibt es offen, wenn es steht.
  let gefunden = 0;
  for (let startwert = 1; startwert <= 30 && gefunden < 2; startwert++) {
    const k = neueKarriere(startwert);
    const v = neueKarriere(startwert);
    bisZumSpiel(k, 'pokal');
    bisZumSpiel(v, 'pokal');
    v.weiter();
    k.anpfeifen(ICH);
    let ende = k.liveSpielen(ICH, { bis: 90 });
    if (k.offen) {
      assert.equal(ende.laufend.verlaengerung, true, 'offen nach 90 nur mit Verlaengerung');
      ende = durchspielen(k, 15);
    }
    assert.deepEqual(k.sichern(), v.sichern(), `Startwert ${startwert}: live wie vorgespult`);
    if (ende.laufend.verlaengerung) gefunden += 1;
  }
  assert.ok(gefunden >= 1, 'wenigstens ein Pokalspiel ging in die Verlaengerung');
});

test('karriere AC-31: Vorspulen spielt das eigene Spiel mit Automatik - wie live ohne Eingriff', () => {
  // Eine ganze Saison: einmal vorgespult, einmal jedes eigene Spiel live in
  // Schritten zu fuenf Minuten, einmal angepfiffen und dann mit "Weiter".
  const vorgespult = neueKarriere();
  const live = neueKarriere();
  const angepfiffen = neueKarriere();
  const saison = vorgespult.saison;
  while (vorgespult.saison === saison) assert.ok(vorgespult.weiter().ok);
  let liveGespielt = 0;
  while (live.saison === saison) {
    const termin = TERMINE[live.termin];
    if ((termin.art === 'liga' || termin.art === 'pokal') && live.eigenesSpielAm('v5', termin)?.gegnerId) {
      assert.ok(live.anpfeifen(ICH).ok);
      durchspielen(live, 5);
      liveGespielt += 1;
    } else assert.ok(live.weiter().ok);
  }
  while (angepfiffen.saison === saison) {
    const termin = TERMINE[angepfiffen.termin];
    if ((termin.art === 'liga' || termin.art === 'pokal') && angepfiffen.eigenesSpielAm('v5', termin)?.gegnerId) {
      angepfiffen.anpfeifen(ICH);
      angepfiffen.liveSpielen(ICH, { bis: 20 });
    }
    assert.ok(angepfiffen.weiter().ok);
  }
  assert.ok(liveGespielt >= 34, `${liveGespielt} Spiele live`);
  assert.deepEqual(live.sichern(), vorgespult.sichern());
  assert.deepEqual(angepfiffen.sichern(), vorgespult.sichern());

  // "Bis zur Winterpause" beendet ein offenes Spiel zuerst.
  const k = neueKarriere();
  const v = neueKarriere();
  bisZumSpiel(k);
  bisZumSpiel(v);
  k.anpfeifen(ICH);
  k.liveSpielen(ICH, { bis: 60 });
  assert.ok(k.vorspulen({ bis: 'winterpause' }).ok);
  v.vorspulen({ bis: 'winterpause' });
  assert.deepEqual(k.sichern(), v.sichern());
});

test('karriere AC-32: die Antwort kennt nichts nach der gezeigten Minute', () => {
  const k = neueKarriere();
  bisZumSpiel(k);
  const vorher = sichtbar(k);
  let antwort = k.anpfeifen(ICH);
  let gesehen = [];
  for (let bis = 5; k.offen; bis += 5) {
    const { laufend } = antwort;
    for (const e of [...laufend.ereignisse, ...laufend.szenen]) assert.ok(e.minute <= laufend.minute, `${e.minute}' nach ${laufend.minute}'`);
    const tore = (id) => laufend.ereignisse.filter((e) => e.art === 'tor' && e.verein === id).length;
    assert.deepEqual(laufend.tore, [tore(laufend.heim.id), tore(laufend.gast.id)], 'der Stand ist der bis jetzt');
    // Was vorher gezeigt war, bleibt - es kommt nur dazu.
    assert.deepEqual(laufend.ereignisse.slice(0, gesehen.length), gesehen);
    gesehen = laufend.ereignisse;
    // Vom Rest des Termins nichts: kein Ergebnis, keine Tabelle, kein Bericht.
    assert.equal(antwort.bericht, undefined);
    assert.deepEqual(sichtbar(k), vorher);
    assert.equal(JSON.stringify(antwort).includes('"ergebnis"'), false);
    antwort = k.liveSpielen(ICH, { bis });
    assert.ok(antwort.ok, antwort.fehler);
  }
});
