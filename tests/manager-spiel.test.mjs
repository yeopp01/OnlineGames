// Das Managerspiel als Karriere: aufstellen, handeln, wirtschaften, Saison um
// Saison. Die Karriere ist ein Rechenteil ohne Naht zum Browser und wird
// deshalb direkt geprueft (→ docs/adr/0004-teststrategie.md). Der Anfrageweg
// steht in manager-netz.test.mjs, die Welt ueber Jahre in manager-welt.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { schnitt } from './manager-hilfe.mjs';

const require = createRequire(import.meta.url);
const kader = require('../server/spiele/manager/kader.js');
const transfer = require('../server/spiele/manager/transfer.js');
const vertraege = require('../server/spiele/manager/vertraege.js');
const finanzen = require('../server/spiele/manager/finanzen.js');
const vorstand = require('../server/spiele/manager/vorstand.js');
const liga = require('../server/spiele/manager/liga.js');
const spieltag = require('../server/spiele/manager/spieltag.js');
const { Karriere, TERMINE, FASSUNG } = require('../server/spiele/manager/karriere.js');
const { zufallAus } = require('../server/spiele/manager/zufall.js');

const { TOR, ABW, MIT, ANG } = kader;

const neu = (vereinId = 'v5', startwert = 4711) => Karriere.neu({ startwert, vereinId });
const naechster = (k) => TERMINE[k.termin];
const istLiga = (nr) => (t) => t.art === 'liga' && t.nr === nr;
const istPokal = (runde) => (t) => t.art === 'pokal' && t.runde === runde;
const ist = (art) => (t) => t.art === art;
const indexVon = (passt) => TERMINE.findIndex(passt);
const seiteVon = (k, bericht) => (bericht.heim.id === k.vereinId ? 'heim' : 'gast');

/** Termine rechnen, bis der naechste passt. Geduldig heisst: der Vorstand entlaesst nicht. */
function bis(k, passt, { geduldig = true } = {}) {
  for (let i = 0; i < 100 && !passt(naechster(k)); i++) {
    if (geduldig && k.vorstand) k.vorstand.vertrauen = 100;
    const r = k.weiter();
    assert.ok(r.ok, r.fehler);
  }
  assert.ok(passt(naechster(k)), `Termin nicht erreicht, es steht ${naechster(k).art} an`);
}

/** Jede Geldbewegung aller Vereine mitschreiben. */
function buchungen(k) {
  const liste = [];
  const echt = k.buchen.bind(k);
  k.buchen = (verein, kategorie, betrag, zweck) => {
    liste.push({ verein: verein.id, liga: verein.liga, kategorie, betrag: Math.round(betrag), zweck, termin: k.termin, saison: k.saison });
    return echt(verein, kategorie, betrag, zweck);
  };
  return liste;
}

const kaufbar = (k, passt = () => true) => k.markt({ anzahl: 200 }).liste
  .find((s) => s.bereit && s.vereinId && s.forderung > 0 && s.forderung <= k.verein.konto && passt(s));
const vereinslos = (k, passt = () => true) => k.markt({ liga: 'frei', anzahl: 200 }).liste.find((s) => s.bereit && passt(s));
const angebot = (k, spieler, gebot = 1000, vereinId = 'v1') => ({
  id: `test-${spieler.id}`, vereinId, verein: k.vereinVon(vereinId).name, spielerId: spieler.id, spieler: spieler.name,
  position: spieler.position, staerke: spieler.staerke, wert: kader.marktwert(spieler), gebot, gueltigBis: 99,
});

test('kader AC-21: das Karriereende wird zur Winterpause angekuendigt', () => {
  const k = neu();
  // Ein 35-Jaehriger mit Vertrag bis Saison 3 - er hoert trotzdem auf.
  const alt = k.verein.spieler.find((s) => s.position !== TOR);
  alt.alter = 35;
  alt.vertrag = { ...alt.vertrag, bis: 3 };
  bis(k, ist('winterpause'));
  assert.equal(alt.karriereende ?? null, null, 'vor der Winterpause steht noch nichts fest');
  k.weiter();
  assert.equal(alt.karriereende, 1);
  assert.ok(k.nachrichten.some((n) => n.text.startsWith('Zum Saisonende hoeren auf:') && n.text.includes(alt.name)));
  const gezeigt = k.zustand().verein.spieler.find((s) => s.id === alt.id);
  assert.deepEqual([gezeigt.karriereende, gezeigt.verlaengerbar], [true, false]);
  assert.equal(k.verlaengern(alt.id, 1).fehler, `${alt.name} hoert zum Saisonende auf und verlaengert nicht mehr.`);
  // Die Unter-33-Jaehrigen kuendigt niemand an.
  assert.ok(k.vereine.flatMap((v) => v.spieler).filter((s) => s.karriereende).every((s) => s.alter >= 29));

  const angekuendigt = new Set(k.vereine.flatMap((v) => v.spieler).filter((s) => s.karriereende === 1).map((s) => s.id));
  bis(k, ist('saisonende'));
  const bleiben = k.vereine.flatMap((v) => v.spieler).filter((s) => !s.karriereende && s.vertrag && s.vertrag.bis > 1).map((s) => s.id);
  k.weiter();
  const danach = new Set([...k.vereine.flatMap((v) => v.spieler), ...k.freie].map((s) => s.id));
  for (const id of angekuendigt) assert.ok(!danach.has(id), 'ein Angekuendigter spielt weiter');
  // Wer nicht angekuendigt war und Vertrag hatte, ist noch da - im Verein oder, abgegeben, bei den Vereinslosen.
  for (const id of bleiben) assert.ok(danach.has(id), 'einer hat aufgehoert, ohne es anzukuendigen');
  assert.ok(k.nachrichten.some((n) => n.text.startsWith('Karriereende:') && n.text.includes(alt.name)));
});

test('kader AC-22: jeder Spieler hat eine Akte', () => {
  const k = neu();
  const neuer = vereinslos(k, (s) => s.alter <= 27);
  assert.ok(k.kaufen(neuer.id, 0, 2).ok);
  bis(k, ist('saisonende'));
  const stamm = k.verein.spieler.find((s) => s.saison.spiele >= 20 && s.vertrag.bis > 1 && !s.karriereende);
  const saison1 = { ...stamm.saison };
  k.weiter();

  const akte = k.spielerAkte(stamm.id);
  assert.equal(akte.stationen.length, 1);
  const [erste] = akte.stationen;
  assert.deepEqual(
    [erste.saison, erste.verein, erste.liga, erste.spiele, erste.tore, erste.vorlagen, erste.staerke, erste.alter],
    [1, k.verein.name, 1, saison1.spiele, saison1.tore, saison1.vorlagen, stamm.staerke, stamm.alter - 1],
  );
  assert.equal(erste.note, Math.round((saison1.notenSumme / saison1.noten) * 10) / 10);
  assert.deepEqual([akte.saison.saison, akte.saison.spiele], [2, 0]);
  assert.ok(Array.isArray(stamm.laufbahn.stationen[0]), 'die Akte liegt nicht knapp als Zahlenreihe');

  const zugang = k.spielerAkte(neuer.id);
  assert.deepEqual(zugang.wechsel.map((w) => [w.saison, w.von, w.zu, w.abloese]), [[1, 'vereinslos', k.verein.name, 0]]);
  assert.equal(zugang.stationen[0].verein, k.verein.name);
  assert.equal(k.spielerAkte('gibt-es-nicht').fehler, 'Diesen Spieler gibt es nicht.');
});

test('kader AC-20: die Entwicklung wird festgehalten, Spieler fuer Spieler', () => {
  const k = neu();
  bis(k, ist('winterpause'));
  const vorher = new Map(k.verein.spieler.map((s) => [s.id, s.staerke]));
  k.weiter();
  const [bericht] = k.zustand().entwicklungen;
  assert.deepEqual([bericht.anlass, bericht.saison], ['Winterpause', 1]);
  assert.equal(bericht.spieler.length, k.verein.spieler.length);
  for (const e of bericht.spieler) {
    assert.equal(e.vorher, vorher.get(e.id), e.name);
    assert.equal(e.nachher, k.spielerVon(e.id).staerke, e.name);
    assert.equal(e.stufe, kader.altersstufe(e.alter));
    assert.ok(e.spielanteil >= 0 && e.spielanteil <= 100);
  }
  const zaehlen = (passt) => bericht.spieler.filter(passt).length;
  const post = k.nachrichten.find((n) => n.text.startsWith('Entwicklung in der Hinrunde:'));
  assert.ok(post, 'keine Nachricht zur Entwicklung');
  assert.ok(post.text.includes(`${zaehlen((e) => e.nachher > e.vorher)} besser, ${zaehlen((e) => e.nachher < e.vorher)} schlechter`), post.text);

  bis(k, ist('saisonende'));
  k.weiter();
  assert.deepEqual(k.zustand().entwicklungen.map((b) => b.anlass), ['Saisonende', 'Winterpause']);
  const sommer = k.entwicklungen[0];
  // Am Saisonende steht das Alter vor dem Geburtstag im Bericht - danach wurde gerechnet.
  for (const e of sommer.spieler) {
    const s = [...k.vereine.flatMap((v) => v.spieler), ...k.freie].find((x) => x.id === e.id);
    if (s) assert.equal(s.alter, e.alter + 1, e.name);
  }
});

test('karriere AC-28: ein Spielstand der Fassung 2 wird angehoben', () => {
  const k = neu();
  bis(k, istLiga(3));
  k.aufstellenAutomatisch();
  // So sah ein Stand vor den Positionen aus.
  const alt = k.sichern();
  alt.fassung = 2;
  for (const s of [...alt.vereine.flatMap((v) => v.spieler), ...alt.freie]) {
    delete s.rolle;
    delete s.nebenrolle;
  }
  const geladen = Karriere.laden(alt);
  assert.equal(geladen.fassung, FASSUNG);
  assert.equal(geladen.verein.aufstellung, null, 'die gemerkte Elf passt zu keinen Plaetzen');
  for (const s of [...geladen.vereine.flatMap((v) => v.spieler), ...geladen.freie]) {
    assert.equal(kader.TEIL[s.rolle], s.position, `${s.name}: ${s.rolle} gehoert nicht zu ${s.position}`);
  }
  // Die Staerksten bekommen die tragenden Rollen: der beste Verteidiger ist Innenverteidiger.
  for (const verein of geladen.vereine) {
    const besterVerteidiger = verein.spieler.filter((s) => s.position === ABW).sort((a, b) => b.staerke - a.staerke)[0];
    assert.equal(besterVerteidiger.rolle, 'IV', verein.name);
    assert.equal(kader.elfStellen(verein, verein.taktik.system).length, 11);
  }
  assert.ok(geladen.weiter().ok);
  assert.throws(() => Karriere.laden({ ...alt, fassung: 1 }), /anderen Fassung/);
});

test('karriere AC-27: die Vorschau zeigt den naechsten Gegner und liest nur', () => {
  assert.equal(neu().zustand().vorschau, null, 'vor der Saison gibt es kein Spiel');
  const k = neu();
  bis(k, istLiga(18));
  const vorher = JSON.stringify(k.sichern());
  const { vorschau: v, naechster: termin } = k.zustand();
  assert.equal(JSON.stringify(k.sichern()), vorher, 'die Vorschau hat den Spielstand veraendert');

  assert.equal(v.gegner.name, termin.spiel.gegner);
  assert.equal(v.daheim, termin.spiel.daheim);
  for (const seite of [v.eigen, v.gegner]) {
    assert.equal(seite.platz, k.platz(seite.id));
    assert.equal(seite.form.length, 5);
    assert.ok(seite.form.every((f) => ['S', 'U', 'N'].includes(f)), seite.form.join());
    for (const [teil, wert] of Object.entries(seite.teile)) assert.ok(wert > 20 && wert < 110, `${teil} ${wert}`);
  }
  // Das Hinspiel am 1. Spieltag, aus eigener Sicht erzaehlt.
  const hinspiel = v.bisher.find((b) => b.titel === '1. Spieltag');
  assert.ok(hinspiel, JSON.stringify(v.bisher));
  assert.equal(hinspiel.daheim, !v.daheim);
  assert.ok(['favorit', 'offen', 'aussenseiter'].includes(v.einschaetzung));

  // Gerechnet mit der Tagesform: ein muede Gegner steht schwaecher da.
  const gegner = k.vereinVon(v.gegner.id);
  const kondition = gegner.spieler.map((s) => s.kondition);
  for (const s of gegner.spieler) s.kondition = 50;
  const muede = k.vorschau().gegner.teile;
  gegner.spieler.forEach((s, i) => { s.kondition = kondition[i]; });
  assert.ok(muede.mittelfeld < v.gegner.teile.mittelfeld && muede.angriff < v.gegner.teile.angriff);
});

// Eine ganze Saison ohne Menschen, einmal gerechnet und von vielen Tests gelesen.
let saisonCache = null;
function ganzeSaison() {
  if (saisonCache) return saisonCache;
  const k = Karriere.neu({ startwert: 4711, vereinId: null });
  const buch = buchungen(k);
  const ticker = [];
  const tickerEcht = k.ticker.unshift.bind(k.ticker);
  k.ticker.unshift = (eintrag) => { ticker.push(eintrag); return tickerEcht(eintrag); };
  const anfang = {
    plaene: JSON.parse(JSON.stringify(k.plaene)),
    gehaltJeTermin: new Map(k.vereine.map((v) => [v.id, Math.round(v.spieler.reduce((s, x) => s + x.vertrag.gehalt, 0) / 42)])),
  };
  bis(k, ist('saisonende'), { geduldig: false });
  const vorEnde = {
    tabellen: { 1: liga.sortiert(k.tabellen[1]), 2: liga.sortiert(k.tabellen[2]) },
    pokal: JSON.parse(JSON.stringify(k.pokal)),
    ruf: new Map(k.vereine.map((v) => [v.id, v.reputation])),
    vertraege: new Map(k.vereine.flatMap((v) => v.spieler.map((s) => [s.id, { verein: v.id, ...s.vertrag }]))),
  };
  // Zehn alte Saisons in der Chronik, damit die elfte die aelteste Tabelle verdraengt.
  k.historie = Array.from({ length: 10 }, (_, i) => ({ saison: -i, tabellen: { 1: [], 2: [] } }));
  const ergebnis = k.weiter();
  assert.ok(ergebnis.ok);
  saisonCache = { k, buch, ticker, anfang, vorEnde, bericht: ergebnis.bericht };
  return saisonCache;
}

// Zwei Saisons mit einem Menschen, der nichts tut - auch einmal gerechnet.
let karriereCache = null;
function zweiSaisons() {
  if (karriereCache) return karriereCache;
  const k = neu('v5');
  const auslaufend = k.verein.spieler.filter((s) => s.vertrag.bis <= 1).map((s) => ({ id: s.id, name: s.name }));
  const alter = new Map(k.vereine.flatMap((v) => v.spieler.map((s) => [s.id, s.alter])));
  bis(k, ist('winterpause'));
  assert.ok(k.weiter().ok);
  const winterpost = k.nachrichten.filter((n) => n.saison === 1).map((n) => n.text);
  // Wer zur Winterpause sein Karriereende angekuendigt hat, geht als Karriereende, nicht als Vertragsende.
  const angekuendigt = new Set(k.verein.spieler.filter((s) => s.karriereende).map((s) => s.id));
  bis(k, ist('saisonende'));
  k.vorstand.vertrauen = 100;
  const erstes = k.weiter();
  assert.ok(erstes.ok);
  const nachEnde = {
    kader: new Set(k.verein.spieler.map((s) => s.id)),
    groesse: JSON.stringify(k.sichern()).length,
    post: k.nachrichten.map((n) => n.text),
  };
  const begonnen = performance.now();
  bis(k, ist('saisonende'));
  k.vorstand.vertrauen = 100;
  assert.ok(k.weiter().ok);
  const dauer = performance.now() - begonnen;
  karriereCache = {
    k, auslaufend, angekuendigt, alter, winterpost, nachEnde, dauer, bericht: erstes.bericht,
  };
  return karriereCache;
}

// ---------------------------------------------------------- Aufstellung

test('aufstellung AC-1: elf Spieler, genau ein Torwart', () => {
  const k = neu();
  const verein = k.verein;
  const elf = kader.elfStellen(verein, '4-4-2').map((s) => s.id);
  assert.equal(k.aufstellen(elf, '4-4-2').ok, true);
  assert.match(k.aufstellen(elf.slice(0, 10), '4-4-2').fehler, /genau elf/i);
  assert.match(k.aufstellen([...elf, verein.spieler.find((s) => !elf.includes(s.id)).id], '4-4-2').fehler, /genau elf/i);
  const mitZwei = [...elf];
  mitZwei[elf.findIndex((id) => k.spielerVon(id).position === ABW)] = verein.spieler.find((s) => s.position === TOR && !elf.includes(s.id)).id;
  assert.match(k.aufstellen(mitZwei, '4-4-2').fehler, /genau ein Torwart/i);
});

test('aufstellung AC-2: das System bestimmt die Verteilung', () => {
  const k = neu();
  for (const [system, plaetze] of Object.entries(kader.PLAETZE)) {
    const elf = kader.elfStellen(k.verein, system).map((s) => s.id);
    assert.equal(k.aufstellen(elf, system).ok, true, system);
    // Die Verteilung haengt an den Plaetzen, nicht an den Leuten, die darauf stehen.
    const zaehlen = (teil) => plaetze.filter((p) => kader.TEIL[p] === teil).length;
    const plan = kader.SYSTEME[system];
    assert.deepEqual([zaehlen(TOR), zaehlen(ABW), zaehlen(MIT), zaehlen(ANG)], [1, plan[ABW], plan[MIT], plan[ANG]]);
    assert.equal(`${plan[ABW]}-${plan[MIT]}-${plan[ANG]}`, system);
  }
  // Dieselben elf in einem anderen System: erlaubt, sie stehen dann auf anderen Plaetzen.
  const vier = kader.elfStellen(k.verein, '4-4-2').map((s) => s.id);
  assert.equal(k.aufstellen(vier, '4-3-3').ok, true);
  assert.match(k.aufstellen(vier, 'Kraut und Rueben').fehler, /Unbekanntes System/);
});

test('aufstellung AC-3: nur eigene Spieler, keiner zweimal', () => {
  const k = neu();
  const elf = kader.elfStellen(k.verein, '4-4-2').map((s) => s.id);
  const doppelt = [...elf];
  doppelt[10] = doppelt[9];
  assert.match(k.aufstellen(doppelt, '4-4-2').fehler, /zweimal/);
  const fremd = [...elf];
  fremd[10] = k.vereinVon('v1').spieler[0].id;
  assert.match(k.aufstellen(fremd, '4-4-2').fehler, /nicht zum Kader/);
});

test('aufstellung AC-4: Ausfaelle nicht aufstellbar, mit Grund und Dauer', () => {
  const k = neu();
  const elf = kader.elfStellen(k.verein, '4-4-2').map((s) => s.id);
  const einer = k.spielerVon(elf[5]);
  einer.verletzt = 3;
  assert.equal(k.aufstellen(elf, '4-4-2').fehler, `${einer.name} ist verletzt, noch 3 Wochen.`);
  einer.verletzt = 0;
  einer.sperre = 2;
  assert.equal(k.aufstellen(elf, '4-4-2').fehler, `${einer.name} ist gesperrt, noch 2 Spiele.`);
});

test('aufstellung AC-5: geprueft wird auf dem Server, auch vor dem Spiel noch einmal', () => {
  const k = neu();
  assert.ok(k.aufstellen(['gibt', 'es', 'nicht']).fehler);
  assert.ok(k.aufstellen([]).fehler);
  k.weiter();
  const elf = kader.elfStellen(k.verein, '4-4-2').map((s) => s.id);
  assert.ok(k.aufstellen(elf, '4-4-2').ok);
  const faellt = k.spielerVon(elf.find((id) => k.spielerVon(id).position === MIT));
  faellt.verletzt = 2;
  k.weiter();
  const eigenes = k.zuletzt.eigenes;
  assert.ok(!eigenes.aufstellung[seiteVon(k, eigenes)].elf.some((s) => s.id === faellt.id), 'der Verletzte hat gespielt');
});

test('aufstellung AC-6 und manager AC-3: ohne Abgabe spielt die beste Elf', () => {
  const k = neu();
  k.weiter();
  assert.equal(k.verein.aufstellung, null);
  const erwartet = kader.elfStellen(k.verein, k.verein.taktik.system).map((s) => s.id).sort();
  k.weiter();
  const eigenes = k.zuletzt.eigenes;
  const gespielt = eigenes.aufstellung[seiteVon(k, eigenes)].elf.map((s) => s.id).sort();
  assert.equal(gespielt.length, 11);
  assert.deepEqual(gespielt, erwartet);
});

test('aufstellung AC-7: ein Systemwechsel verwirft eine unpassende Aufstellung', () => {
  const k = neu();
  k.aufstellenAutomatisch();
  assert.equal(k.verein.aufstellung.system, '4-4-2');
  assert.equal(k.taktikSetzen({ system: '4-3-3' }).aufstellungVerworfen, true);
  assert.equal(k.verein.aufstellung, null);
  k.aufstellenAutomatisch();
  k.taktikSetzen({ haerte: 5 });
  assert.ok(k.verein.aufstellung, 'ein Regler hat die Aufstellung verworfen');
});

test('aufstellung AC-8 und manager AC-7: drei Regler, auf dem Server begrenzt', () => {
  const k = neu();
  k.taktikSetzen({ haerte: 99, pressing: -3, ausrichtung: 0 });
  assert.deepEqual(k.verein.taktik, { system: '4-4-2', ausrichtung: 1, haerte: 5, pressing: 1 });
  k.taktikSetzen({ pressing: 4 });
  assert.deepEqual(k.verein.taktik, { system: '4-4-2', ausrichtung: 1, haerte: 5, pressing: 4 }, 'ein Regler hat den anderen zurueckgesetzt');
  assert.match(k.taktikSetzen({ system: 'gibt es nicht' }).fehler, /Unbekanntes System/);
});

test('aufstellung AC-9: die Taktik bleibt und wirkt', () => {
  const k = neu();
  k.taktikSetzen({ system: '5-3-2', ausrichtung: 2, haerte: 5, pressing: 2 });
  bis(k, istLiga(3));
  assert.deepEqual(k.verein.taktik, { system: '5-3-2', ausrichtung: 2, haerte: 5, pressing: 2 });
  const eigenes = k.zuletzt.eigenes;
  assert.deepEqual(eigenes.taktik[seiteVon(k, eigenes)], { system: '5-3-2', ausrichtung: 2, haerte: 5, pressing: 2 });
});

test('aufstellung AC-10 und manager AC-9: ein Regler zwischen Kondition und Entwicklung', () => {
  const k = neu();
  assert.equal(k.trainingSetzen(140).training, 100);
  assert.equal(k.trainingSetzen(-20).training, 0);
  assert.ok(k.trainingSetzen(Number('viel')).fehler);
});

test('aufstellung AC-11: Kondition sofort, Technik am Saisonende', () => {
  const { verein } = neu();
  const kopie = (training) => ({
    ...verein, training, technikSumme: 0, trainingswochen: 0, spieler: verein.spieler.map((s) => ({ ...s, kondition: 60 })),
  });
  const kondition = kopie(0);
  const technik = kopie(100);
  kader.trainieren(kondition);
  kader.trainieren(technik);
  const frische = (v) => schnitt(v.spieler, (s) => s.kondition);
  assert.ok(frische(kondition) > frische(technik) + 5, `${frische(kondition)} zu ${frische(technik)}`);
  assert.deepEqual([kondition.technikSumme, technik.technikSumme], [0, 1]);
  assert.deepEqual(technik.spieler.map((s) => s.staerke), verein.spieler.map((s) => s.staerke), 'die Staerke hat sich unter der Saison bewegt');
});

test('aufstellung AC-14 und manager AC-6: die Elf gilt bis zum Widerruf', () => {
  const k = neu();
  const elf = kader.elfStellen(k.verein, '4-3-3').map((s) => s.id);
  assert.ok(k.aufstellen(elf, '4-3-3').ok);
  bis(k, istLiga(4));
  assert.deepEqual(k.verein.aufstellung, { system: '4-3-3', ids: elf });
  assert.ok(k.aufstellungFreigeben().ok);
  assert.equal(k.verein.aufstellung, null);
});

test('aufstellung AC-17: ein Ausfall rueckt nach, und wer zurueck ist, spielt wieder', () => {
  const k = neu();
  k.weiter();
  k.aufstellenAutomatisch();
  const merk = k.verein.aufstellung.ids.slice();
  const index = merk.findIndex((id) => k.spielerVon(id).position === MIT);
  const faellt = k.spielerVon(merk[index]);
  faellt.verletzt = 1;
  k.weiter();
  const eigenes = k.zuletzt.eigenes;
  const gespielt = eigenes.aufstellung[seiteVon(k, eigenes)].elf;
  assert.ok(!gespielt.some((s) => s.id === faellt.id));
  // Der Nachruecker steht auf dem Platz des Ausgefallenen, alle anderen bleiben, wo sie waren.
  const plaetze = kader.PLAETZE[k.verein.aufstellung.system];
  assert.deepEqual(gespielt.map((s) => s.platz), plaetze);
  assert.ok(!merk.includes(gespielt[index].id), 'auf dem Platz steht keiner von der Bank');
  gespielt.forEach((s, i) => { if (i !== index) assert.equal(s.id, merk[i]); });
  assert.ok(k.nachrichten.some((n) => n.text.includes(`fuer ${faellt.name} in die Elf`)));
  assert.deepEqual(k.verein.aufstellung.ids, merk, 'die gemerkte Elf wurde veraendert');

  assert.equal(faellt.verletzt, 0);
  k.weiter();
  const danach = k.zuletzt.eigenes;
  assert.ok(danach.aufstellung[seiteVon(k, danach)].elf.some((s) => s.id === faellt.id), 'der Genesene spielt nicht wieder');
});

test('aufstellung AC-18: sieben auf der Bank, ein Torwart darunter', () => {
  const { verein } = neu();
  const elf = kader.elfStellen(verein, '4-4-2');
  const bank = kader.bankStellen(verein, elf);
  assert.equal(bank.length, 7);
  assert.ok(bank.some((s) => s.position === TOR));
  assert.ok(bank.every((s) => !elf.includes(s)));
});

test('aufstellung AC-22: zwoelf Positionen, elf Plaetze je System', () => {
  assert.deepEqual(kader.ROLLEN, ['TW', 'LV', 'IV', 'RV', 'DM', 'LM', 'ZM', 'RM', 'OM', 'LA', 'ST', 'RA']);
  for (const [system, plaetze] of Object.entries(kader.PLAETZE)) {
    assert.equal(plaetze.length, 11, system);
    assert.equal(plaetze.filter((p) => p === 'TW').length, 1, system);
    for (const platz of plaetze) assert.ok(kader.ROLLEN.includes(platz), `${system}: ${platz}`);
  }
  const { vereine, freie } = kader.weltErzeugen(4711);
  const alle = [...vereine.flatMap((v) => v.spieler), ...freie];
  for (const s of alle) {
    assert.equal(kader.TEIL[s.rolle], s.position, `${s.name}: ${s.rolle} gehoert nicht zu ${s.position}`);
    if (s.nebenrolle) {
      assert.notEqual(s.nebenrolle, s.rolle);
      assert.ok(kader.eignung({ rolle: s.rolle }, s.nebenrolle) >= 0.84, `${s.rolle} und ${s.nebenrolle} liegen nicht nebeneinander`);
    }
  }
  // Zu Beginn kann jeder Verein jede Rolle besetzen - von den Aussenstuermern eine.
  for (const verein of vereine) {
    const da = new Set(verein.spieler.map((s) => s.rolle));
    for (const rolle of ['TW', 'LV', 'IV', 'RV', 'DM', 'LM', 'ZM', 'RM', 'OM', 'ST']) assert.ok(da.has(rolle), `${verein.name} ohne ${rolle}`);
    assert.ok(da.has('LA') || da.has('RA'), `${verein.name} ohne Aussenstuermer`);
  }
  const mitZweiter = alle.filter((s) => s.nebenrolle).length / alle.length;
  assert.ok(mitZweiter > 0.25 && mitZweiter < 0.45, `${Math.round(mitZweiter * 100)} % mit zweiter Position`);
  // Jugend und Nachruecker fuellen die Rolle, von der es am wenigsten gibt.
  const verein = vereine[0];
  verein.spieler = verein.spieler.filter((s) => s.rolle !== 'LV');
  let zaehler = 0;
  const erzeuger = { neueId: () => `j${++zaehler}`, neuerName: () => `Jugend ${zaehler}`, saison: 2 };
  const jugend = kader.jugendErzeugen(verein, zufallAus(9), erzeuger);
  for (const s of jugend.filter((x) => x.position === ABW)) assert.equal(s.rolle, 'LV');
});

test('aufstellung AC-23: eine fremde Position kostet Staerke', () => {
  const e = (rolle, platz, nebenrolle = null) => kader.eignung({ rolle, nebenrolle }, platz);
  const gleich = (wert, soll) => assert.ok(Math.abs(wert - soll) < 1e-9, `${wert} statt ${soll}`);
  gleich(e('IV', 'IV'), 1);
  gleich(e('IV', 'LV', 'LV'), kader.NEBENROLLE);
  gleich(e('IV', 'RV'), 0.95);
  gleich(e('LV', 'RV'), 0.90);
  gleich(e('IV', 'DM'), 0.92);
  gleich(e('IV', 'ZM'), 0.84);
  gleich(e('ZM', 'ST'), 0.84);
  gleich(e('ST', 'IV'), 0.68);
  gleich(e('LA', 'RV'), 0.65);
  gleich(e('TW', 'ST'), kader.FALSCHES_FACH);
  gleich(e('ST', 'TW'), kader.FALSCHES_FACH);

  // Im Spiel gerechnet: tauschen zwei Verteidiger mit den Stuermern die Plaetze, verlieren Abwehr und Angriff.
  const { verein } = neu();
  const elf = kader.elfStellen(verein, '4-4-2');
  const richtig = spieltag.mannschaftsteile(verein, elf, '4-4-2');
  const vertauscht = [...elf];
  [vertauscht[2], vertauscht[9]] = [vertauscht[9], vertauscht[2]];
  [vertauscht[3], vertauscht[10]] = [vertauscht[10], vertauscht[3]];
  const falsch = spieltag.mannschaftsteile(verein, vertauscht, '4-4-2');
  assert.ok(falsch.abwehr < richtig.abwehr, `Abwehr ${falsch.abwehr} zu ${richtig.abwehr}`);
  assert.ok(falsch.angriff < richtig.angriff, `Angriff ${falsch.angriff} zu ${richtig.angriff}`);
  assert.equal(falsch.mittelfeld, richtig.mittelfeld);
});

test('aufstellung AC-24: der Rechner besetzt die Plaetze nach Eignung', () => {
  const k = neu();
  for (const verein of k.vereine) {
    const bereit = verein.spieler.filter(kader.einsatzbereit);
    for (const system of kader.SYSTEME_NAMEN) {
      const plaetze = kader.PLAETZE[system];
      const elf = kader.elfStellen(verein, system);
      const wert = (s, i) => kader.tagesform(s) * kader.eignung(s, plaetze[i]);
      const summe = elf.reduce((x, s, i) => x + wert(s, i), 0);
      assert.ok(Math.abs(summe - kader.elfWert(verein, system)) < 1e-6);
      // Kein einzelner Tausch bringt mehr - nicht zwischen zwei Plaetzen, nicht mit einem von draussen.
      const draussen = bereit.filter((s) => !elf.includes(s));
      for (let i = 0; i < 11; i++) {
        for (let j = i + 1; j < 11; j++) {
          assert.ok(wert(elf[j], i) + wert(elf[i], j) <= wert(elf[i], i) + wert(elf[j], j) + 1e-6, `${verein.name} ${system}: Plaetze ${i} und ${j}`);
        }
        for (const s of draussen) assert.ok(wert(s, i) <= wert(elf[i], i) + 1e-6, `${verein.name} ${system}: ${s.name} auf ${plaetze[i]}`);
      }
    }
  }
  assert.deepEqual(k.zustand().verein.besteElf, kader.elfStellen(k.verein, k.verein.taktik.system).map((s) => s.id));
});

test('aufstellung AC-20: die anderen stellen sich auf den Gegner ein', () => {
  const k = neu();
  const [stark, schwach] = [k.vereinVon('v1'), k.vereinVon('v18')];
  k.kiTaktik(stark, schwach, true);
  k.kiTaktik(schwach, stark, false);
  assert.ok(stark.taktik.ausrichtung >= 4, `der Favorit spielt ${stark.taktik.ausrichtung}`);
  assert.ok(schwach.taktik.ausrichtung <= 2, `der Aussenseiter spielt ${schwach.taktik.ausrichtung}`);

  for (const s of stark.spieler) s.kondition = 95;
  for (const s of schwach.spieler) s.kondition = 65;
  k.kiTaktik(stark, schwach, true);
  k.kiTaktik(schwach, stark, false);
  assert.deepEqual([stark.taktik.pressing, schwach.taktik.pressing], [4, 2]);

  stark.einstudiert.systeme[stark.taktik.system] = 40;
  k.kiTaktik(stark, schwach, true);
  assert.equal(stark.schwerpunkt, 'system');

  // Das System bleibt, solange ein anderes nicht deutlich mehr bringt.
  const verein = k.vereinVon('v4');
  const wert = (system) => kader.elfWert(verein, system);
  const bestes = kader.bestesSystem(verein);
  for (const system of kader.SYSTEME_NAMEN) {
    assert.equal(kader.bestesSystem(verein, system), wert(system) * 1.03 >= wert(bestes) ? system : bestes, system);
  }
});

test('aufstellung AC-16: die Wechselregel wird gemerkt', () => {
  const k = neu();
  assert.equal(k.verein.wechselregel, 'auto');
  assert.ok(k.wechselregelSetzen('verletzung').ok);
  assert.equal(k.verein.wechselregel, 'verletzung');
  assert.ok(k.wechselregelSetzen('manchmal').fehler);
});

// ------------------------------------------------------------ Transfer

test('transfer AC-4 und transfer AC-18: Forderung ueber dem Wert, billiger auf der Liste und im letzten Jahr', () => {
  const k = neu();
  const verein = k.vereinVon('v2');
  for (const spieler of verein.spieler.filter((s) => s.vertrag.bis > 1)) {
    assert.ok(transfer.forderung(verein, spieler, 1) > kader.marktwert(spieler), spieler.name);
  }
  const abwehr = verein.spieler.filter((s) => s.position === ABW && s.vertrag.bis > 1).sort((a, b) => b.staerke - a.staerke);
  const aufschlag = (s) => transfer.forderung(verein, s, 1) / kader.marktwert(s);
  assert.ok(aufschlag(abwehr[0]) > aufschlag(abwehr.at(-1)));

  const einer = abwehr[1];
  const normal = transfer.forderung(verein, einer, 1);
  einer.transferliste = 1;
  assert.ok(Math.abs(transfer.forderung(verein, einer, 1) - normal * 0.8) <= 1);
  einer.transferliste = null;
  einer.vertrag.bis = 1;
  assert.ok(Math.abs(transfer.forderung(verein, einer, 1) - normal * 0.7) <= 1);
});

test('transfer AC-5: wer zu wenig bietet, bekommt eine Absage mit Preis', () => {
  const k = neu();
  const ziel = kaufbar(k);
  assert.equal(k.kaufen(ziel.id, ziel.forderung - 1, 1).fehler, `${ziel.verein} verlangt ${ziel.forderung} T.`);
  assert.equal(k.verein.spieler.length, 20);
});

test('transfer AC-6 und manager AC-10: was nicht auf dem Konto ist, kann nicht geboten werden', () => {
  const k = neu();
  const teuer = k.markt({ anzahl: 200 }).liste.find((s) => s.bereit && s.vereinId && s.forderung > k.verein.konto);
  assert.ok(teuer, 'jeder Spieler der Welt ist bezahlbar');
  assert.equal(k.kaufen(teuer.id, teuer.forderung, 1).fehler, 'So viel ist nicht auf dem Konto.');
  const frei = vereinslos(k);
  k.verein.konto = 0;
  assert.equal(k.kaufen(frei.id, 0, 1).fehler, 'Mit leerem Konto unterschreibt niemand.');
});

test('transfer AC-7: der Kader hat eine Obergrenze', () => {
  const k = neu();
  for (const s of k.markt({ liga: 'frei', anzahl: 200 }).liste.filter((x) => x.bereit)) {
    if (k.verein.spieler.length >= kader.KADER_MAX) break;
    assert.ok(k.kaufen(s.id, 0, 1).ok);
  }
  assert.equal(k.verein.spieler.length, kader.KADER_MAX);
  assert.equal(k.kaufen(vereinslos(k).id, 0, 1).fehler, 'Der Kader ist voll (26 Spieler).');
});

test('transfer AC-8: kein Verein gibt seinen letzten Torwart ab', () => {
  const k = neu();
  const fremder = k.vereinVon('v9');
  const tor = fremder.spieler.filter((s) => s.position === TOR);
  fremder.spieler = fremder.spieler.filter((s) => s.position !== TOR || s === tor[0] || s === tor[1]);
  assert.equal(k.markt({ position: TOR, anzahl: 200 }).liste.filter((s) => s.vereinId === fremder.id).length, 0);
  k.verein.konto = 10_000_000;
  assert.equal(k.kaufen(tor[0].id, 9_999_999, 1).fehler, `${fremder.name} gibt den letzten TOR nicht ab.`);
});

test('transfer AC-9: Vereinslose kosten keine Abloese', () => {
  const k = neu();
  const frei = vereinslos(k);
  assert.equal(frei.forderung, 0);
  const konto = k.verein.konto;
  const gekauft = k.kaufen(frei.id, 0, 2);
  assert.equal(gekauft.abloese, 0);
  assert.equal(k.verein.konto, konto);
  assert.equal(k.verein.spieler.length, 21);
  assert.equal(k.markt({ liga: 'frei', anzahl: 200 }).liste.filter((s) => s.id === frei.id).length, 0);
});

test('transfer AC-10 und manager AC-8: ein Wechsel verschiebt Geld und Spieler zugleich', () => {
  const k = neu();
  const ziel = kaufbar(k);
  const verkaeufer = k.vereinVon(ziel.vereinId);
  const vorher = { eigen: k.verein.konto, fremd: verkaeufer.konto, kader: verkaeufer.spieler.length };
  assert.ok(k.kaufen(ziel.id, ziel.forderung, 1).ok);
  assert.equal(k.verein.konto, vorher.eigen - ziel.forderung);
  assert.equal(verkaeufer.konto, vorher.fremd + ziel.forderung);
  assert.equal(verkaeufer.spieler.length, vorher.kader - 1);
  assert.ok(k.spielerVon(ziel.id));
});

test('transfer AC-11: die anderen bieten von sich aus, solange das Fenster offen ist', () => {
  let angebote = 0;
  let gemeldet = false;
  for (const startwert of [4711, 99, 12345]) {
    const k = neu('v5', startwert);
    for (let i = 0; i < 4; i++) {
      k.weiter();
      angebote += k.angebote.length;
      for (const a of k.angebote) assert.ok(a.gueltigBis >= k.termin);
    }
    gemeldet = gemeldet || k.nachrichten.some((n) => n.art === 'transfer' && /bietet/.test(n.text));
    assert.equal(naechster(k).art, 'pokal');
    assert.deepEqual(k.angebote, [], 'nach dem Fenster liegen noch Angebote');
  }
  assert.ok(angebote > 0, 'im Sommerfenster kam kein einziges Angebot');
  assert.ok(gemeldet, 'kein Angebot im Postfach');
});

test('transfer AC-12: geboten wird nur auf Verstaerkungen', () => {
  const k = neu('v1');
  let gesehen = 0;
  for (let runde = 0; runde < 80; runde++) {
    for (const a of transfer.kiAngebote(k, k.verein, zufallAus(runde))) {
      gesehen += 1;
      const bieter = k.vereinVon(a.vereinId);
      assert.ok(a.staerke > transfer.schwaechsterStamm(bieter, a.position) + 3, `${bieter.name} bietet auf ${a.staerke}`);
      assert.ok(a.gebot <= bieter.konto * 0.7);
    }
  }
  assert.ok(gesehen > 0);
});

test('transfer AC-13: auch der Mensch faellt nicht unter den Mindestbestand', () => {
  const k = neu();
  const tor = k.verein.spieler.filter((s) => s.position === TOR);
  k.verein.spieler = k.verein.spieler.filter((s) => s.position !== TOR || s === tor[0] || s === tor[1]);
  k.angebote = [angebot(k, tor[0], 9999)];
  assert.equal(k.angebotAnnehmen(k.angebote[0].id).fehler, `Ohne ${tor[0].name} bleiben zu wenige auf TOR.`);
  assert.equal(k.verein.spieler.filter((s) => s.position === TOR).length, 2);
});

test('transfer AC-14: ein verkaufter Spieler faellt aus der Aufstellung', () => {
  const k = neu();
  k.aufstellenAutomatisch();
  const drin = k.spielerVon(k.verein.aufstellung.ids.find((id) => k.spielerVon(id).position === MIT));
  k.angebote = [angebot(k, drin, 1000)];
  const id = k.angebote[0].id;
  assert.equal(k.angebotAnnehmen(id).ok, true);
  assert.equal(k.verein.aufstellung, null);
  assert.ok(k.vereinVon('v1').spieler.includes(drin));
  assert.ok(k.angebotAblehnen(id).fehler);
});

test('transfer AC-15: ausserhalb des Fensters nur Vereinslose', () => {
  const k = neu();
  bis(k, istPokal(1));
  assert.equal(k.markt().fenster.offen, false);
  k.verein.konto = 50000;
  const ziel = kaufbar(k);
  assert.equal(k.kaufen(ziel.id, ziel.forderung, 1).fehler, 'Das Transferfenster ist geschlossen. Vereinslose kannst du jederzeit holen.');
  assert.ok(k.kaufen(vereinslos(k).id, 0, 1).ok);
});

test('transfer AC-16: die anderen handeln untereinander', () => {
  const { ticker } = ganzeSaison();
  const zwischen = ticker.filter((t) => t.von !== 'vereinslos');
  assert.ok(zwischen.length > 10, `nur ${zwischen.length} Wechsel zwischen Vereinen in einer Saison`);
  assert.ok(ticker.some((t) => t.von === 'vereinslos'));

  // Ein Loch im Kader wird gestopft.
  const k = Karriere.neu({ startwert: 4711, vereinId: null });
  const loch = k.vereinVon('v7');
  loch.spieler = loch.spieler.filter((s) => s.position !== ANG);
  transfer.kiTransfers(k, zufallAus(3), { verstaerkung: 0 });
  assert.ok(loch.spieler.some((s) => s.position === ANG), 'das Loch im Sturm blieb');

  // Wer ueber 23 waechst, gibt ab.
  const reich = k.vereinVon('v3');
  reich.spieler.push(...k.freie.splice(0, 3).map((s) => ({ ...s, vertrag: { bis: 2, gehalt: 100 } })));
  reich.konto = 1_000_000;
  let gekauft = false;
  for (let i = 0; i < 10 && !gekauft; i++) {
    gekauft = transfer.kiTransfers(k, zufallAus(i), { verstaerkung: 1 }).some((w) => w.zu === reich.name);
  }
  assert.ok(gekauft, 'der reiche Verein hat nichts gekauft');
  assert.ok(reich.spieler.length <= transfer.KI_KADER_ZIEL, `der Kader ist auf ${reich.spieler.length} gewachsen`);
});

test('transfer AC-19: nicht jeder will kommen', () => {
  const k = neu('v30');
  const star = k.markt({ anzahl: 200 }).liste.find((s) => s.staerke >= kader.niveau(k.verein) + 14);
  assert.ok(star);
  assert.equal(star.bereit, false);
  k.verein.konto = 10_000_000;
  assert.equal(k.kaufen(star.id, star.forderung, 1).fehler, `${star.name} sieht bei ${k.verein.name} keine Perspektive.`);
});

test('transfer AC-20: die Transferliste bringt Angebote, fuer weniger Geld', () => {
  const k = neu('v10');
  const spieler = k.verein.spieler.filter((s) => s.position === MIT).sort((a, b) => a.staerke - b.staerke)[0];
  const zaehlen = () => {
    const faktoren = [];
    for (let i = 0; i < 400; i++) {
      for (const a of transfer.kiAngebote(k, k.verein, zufallAus(i))) if (a.spielerId === spieler.id) faktoren.push(a.gebot / a.wert);
    }
    return faktoren;
  };
  const ohne = zaehlen();
  assert.ok(k.transferlisteSetzen(spieler.id, true).ok);
  const mit = zaehlen();
  assert.ok(mit.length > ohne.length * 2 + 5, `${mit.length} Angebote mit Liste, ${ohne.length} ohne`);
  assert.ok(schnitt(mit) < 1.1);
});

test('transfer AC-21: ein Spieler bleibt derselbe', () => {
  const k = neu();
  bis(k, istLiga(3));
  k.verein.konto = 100_000;
  const ziel = kaufbar(k, (s) => s.alter <= 30);
  const vorher = transfer.finden(k, ziel.id).spieler;
  const kopie = JSON.parse(JSON.stringify(vorher));
  assert.ok(k.kaufen(ziel.id, ziel.forderung, 2).ok);
  const nachher = k.spielerVon(ziel.id);
  assert.equal(nachher, vorher);
  // Dazu kommt nur der Wechsel selbst - in der Akte (kader AC-22).
  const { wechsel, ...laufbahn } = nachher.laufbahn;
  const { wechsel: wechselVorher = [], ...laufbahnVorher } = kopie.laufbahn;
  assert.deepEqual(
    [nachher.name, nachher.staerke, nachher.talent, nachher.alter, nachher.saison, laufbahn],
    [kopie.name, kopie.staerke, kopie.talent, kopie.alter, kopie.saison, laufbahnVorher],
  );
  assert.deepEqual(wechsel, [...wechselVorher, [k.saison, k.termin, ziel.vereinId, k.vereinId, ziel.forderung]]);
  assert.equal(nachher.vertrag.bis, 2);
});

test('transfer AC-22: der Markt laesst sich filtern und sortieren', () => {
  const k = neu();
  const alle = (filter) => k.markt({ anzahl: 200, ...filter }).liste;
  assert.ok(alle({ position: MIT }).every((s) => s.position === MIT));
  assert.ok(alle({ liga: '2' }).every((s) => s.liga === 2));
  assert.ok(alle({ liga: 'frei' }).every((s) => s.vereinId === null));
  assert.ok(alle({ maxAlter: 23 }).every((s) => s.alter <= 23));
  assert.ok(alle({ minStaerke: 75 }).every((s) => s.staerke >= 75));
  assert.ok(alle({ maxPreis: 2000 }).every((s) => s.forderung <= 2000));
  const preise = alle({ sortierung: 'preis' }).map((s) => s.forderung);
  assert.deepEqual(preise, preise.slice().sort((a, b) => a - b));
  assert.ok(!alle({}).some((s) => s.vereinId === k.vereinId), 'eigene Spieler auf dem Markt');
});

test('transfer AC-23 und vertraege AC-9: Freistellen kostet Abfindung', () => {
  const k = neu();
  const spieler = k.verein.spieler.find((s) => s.position === MIT && s.vertrag.bis >= 2);
  const erwartet = vertraege.abfindung(spieler, 1);
  const konto = k.verein.konto;
  assert.deepEqual(k.spielerFreistellen(spieler.id), { ok: true, abfindung: erwartet });
  assert.equal(k.verein.konto, konto - erwartet);
  assert.ok(k.freie.includes(spieler) && spieler.vertrag === null);
  assert.equal(k.buch.at(-1).kategorie, 'abfindungen');

  const tor = k.verein.spieler.filter((s) => s.position === TOR);
  k.verein.spieler = k.verein.spieler.filter((s) => s !== tor[2]);
  assert.match(k.spielerFreistellen(tor[0].id).fehler, /zu wenige auf TOR/);
});

test('transfer AC-24: wer im Minus steht, verkauft', () => {
  const k = Karriere.neu({ startwert: 4711, vereinId: null });
  const klamm = k.vereinVon('v12');
  klamm.konto = -1000;
  transfer.kiSparen(k);
  const gelistet = klamm.spieler.filter((s) => s.transferliste);
  const teuerste = klamm.spieler.slice().sort((a, b) => b.vertrag.gehalt - a.vertrag.gehalt).slice(0, 2);
  assert.deepEqual(gelistet.map((s) => s.id).sort(), teuerste.map((s) => s.id).sort());
  klamm.konto = 500;
  transfer.kiSparen(k);
  assert.equal(klamm.spieler.filter((s) => s.transferliste).length, 0);
});

test('transfer AC-25: der Ticker zeigt jeden Wechsel', () => {
  const k = neu();
  const ziel = kaufbar(k);
  k.kaufen(ziel.id, ziel.forderung, 1);
  assert.deepEqual(
    { spieler: k.ticker[0].spieler, von: k.ticker[0].von, zu: k.ticker[0].zu, abloese: k.ticker[0].abloese },
    { spieler: ziel.name, von: ziel.verein, zu: k.verein.name, abloese: ziel.forderung },
  );
});

// ------------------------------------------------------------ Karriere

test('karriere AC-1: der Mensch waehlt seinen Verein, in beiden Ligen', () => {
  assert.equal(neu('v3').verein.liga, 1);
  assert.equal(neu('v20').verein.liga, 2);
  assert.equal(Karriere.neu({ startwert: 4711, vereinId: 'gibt es nicht' }).verein, null);
});

test('karriere AC-2: gleicher Startwert, gleiche Welt', () => {
  const eine = neu();
  const andere = neu();
  assert.deepEqual(eine.vereine, andere.vereine);
  assert.deepEqual(eine.plaene, andere.plaene);
  assert.deepEqual(eine.pokal, andere.pokal);
  assert.notDeepEqual(eine.vereine, neu('v5', 4712).vereine);
});

test('karriere AC-3: die uebrigen Vereine spielt der Server', () => {
  const k = neu();
  for (const verein of k.vereine.filter((v) => v.id !== k.vereinId)) {
    // Gewechselt wird nur, wenn ein anderes System deutlich mehr bringt.
    assert.equal(verein.taktik.system, kader.bestesSystem(verein, '4-4-2'));
  }
  k.weiter();
  k.weiter();
  // Nach dem Spiel darf schon gehandelt worden sein - gezaehlt wird deshalb
  // ueber die ganze Welt, und jeder Verein hat eine volle Elf.
  const gespielt = [...k.vereine.flatMap((v) => v.spieler), ...k.freie].filter((s) => s.saison.spiele === 1);
  assert.ok(gespielt.length >= 36 * 11, `nur ${gespielt.length} Spieler im Einsatz`);
  for (const verein of k.vereine) {
    assert.equal(k.tabellen[verein.liga].find((z) => z.id === verein.id).spiele, 1);
    assert.equal(kader.elfStellen(verein, verein.taktik.system).length, 11, `${verein.name} hat keine Elf`);
  }
});

test('karriere AC-4 und liga AC-12: ein Zug, ein Termin, beide Ligen', () => {
  const k = neu();
  assert.equal(naechster(k).art, 'vorbereitung');
  k.weiter();
  assert.equal(k.termin, 1);
  for (const nummer of [1, 2]) assert.ok(k.tabellen[nummer].every((z) => z.spiele === 0));
  k.weiter();
  for (const nummer of [1, 2]) {
    assert.ok(k.tabellen[nummer].every((z) => z.spiele === 1));
    assert.ok(k.plaene[nummer][0].every((p) => p.tore));
    assert.ok(k.plaene[nummer][1].every((p) => !p.tore));
  }
  bis(k, istPokal(1));
  const tabelle = JSON.stringify(k.tabellen);
  k.weiter();
  assert.equal(JSON.stringify(k.tabellen), tabelle, 'eine Pokalrunde hat die Tabelle veraendert');
});

test('karriere AC-5: der Bericht zeigt den Termin', () => {
  const k = neu();
  k.weiter();
  const { bericht } = k.weiter();
  assert.equal(bericht.art, 'liga');
  assert.equal(bericht.titel, '1. Spieltag');
  assert.deepEqual([bericht.ligen[1].length, bericht.ligen[2].length], [9, 9]);
  const eigenes = bericht.eigenes;
  assert.equal(eigenes.besitz[0] + eigenes.besitz[1], 100);
  assert.equal(eigenes.chancen.length, 2);
  for (const seite of ['heim', 'gast']) {
    assert.equal(eigenes.aufstellung[seite].elf.length, 11);
    for (const s of eigenes.aufstellung[seite].elf) assert.ok(s.name && s.position && s.minuten > 0);
  }
  if (eigenes.heim.id === k.vereinId) assert.ok(eigenes.zuschauer > 0);

  bis(k, istPokal(1));
  const pokalbericht = k.weiter().bericht;
  assert.equal(pokalbericht.art, 'pokal');
  assert.equal(pokalbericht.paarungen.length, 16);
  assert.equal(pokalbericht.eigenes.wettbewerb, 'pokal');
});

test('karriere AC-6: vorspulen haelt vor Winterpause und Saisonende', () => {
  const k = neu();
  assert.ok(k.vorspulen({ bis: 'winterpause' }).ok);
  assert.equal(naechster(k).art, 'winterpause');
  assert.match(k.vorspulen({ bis: 'winterpause' }).fehler, /steht schon an/);
  assert.deepEqual(k.vorspulen({ anzahl: 3 }), { ok: true, gerechnet: 3 });
  assert.ok(k.vorspulen({ bis: 'saisonende' }).ok);
  assert.equal(naechster(k).art, 'saisonende');
  assert.equal(k.saison, 1);
  assert.ok(k.vorspulen({}).fehler);
});

test('karriere AC-6 und vorstand AC-8: vorspulen haelt, sobald der Manager entlassen ist', () => {
  const k = neu();
  bis(k, istLiga(8));
  k.vorstand.vertrauen = 1;
  const r = k.vorspulen({ bis: 'saisonende' });
  assert.deepEqual(r, { ok: true, gerechnet: 1 });
  assert.equal(k.status, 'entlassen');
});

test('karriere AC-7: eine Saison in unter einer Sekunde', () => {
  const { dauer } = zweiSaisons();
  assert.ok(dauer < 1000, `die zweite Saison dauerte ${dauer.toFixed(0)} ms`);
});

test('karriere AC-9: was passiert, steht im Postfach', () => {
  const k = neu();
  const vorher = k.nachrichten.length;
  k.weiter();
  k.weiter();
  const neue = k.nachrichten.slice(vorher);
  assert.ok(neue.some((n) => n.art === 'spiel' && /^1\. Spieltag: (Sieg|Niederlage|Unentschieden), \d+:\d+ (gegen|bei) .+\. Platz \d+\.$/.test(n.text)));
  assert.ok(neue.every((n) => n.saison === 1 && n.datum));
});

test('karriere AC-10: sichern und laden ergeben dieselbe Fortsetzung', () => {
  const k = neu();
  bis(k, istLiga(8));
  const geladen = Karriere.laden(JSON.parse(JSON.stringify(k.sichern())));
  assert.deepEqual(geladen.sichern(), k.sichern());
  for (let i = 0; i < 8; i++) {
    k.vorstand.vertrauen = 100;
    geladen.vorstand.vertrauen = 100;
    k.weiter();
    geladen.weiter();
  }
  assert.deepEqual(geladen.sichern(), k.sichern());
  assert.throws(() => Karriere.laden({ ...k.sichern(), fassung: FASSUNG + 1 }), /anderen Fassung/);
});

test('karriere AC-11: der Zufall haengt am Startwert, nicht am Ablauf', () => {
  const amStueck = neu();
  amStueck.vorspulen({ bis: 'winterpause' });
  const einzeln = neu();
  while (naechster(einzeln).art !== 'winterpause') einzeln.weiter();
  assert.deepEqual(einzeln.sichern(), amStueck.sichern());
});

test('karriere AC-12: ein Spielstand bleibt klein', () => {
  const { k, nachEnde } = zweiSaisons();
  assert.ok(nachEnde.groesse < 1024 * 1024, `${(nachEnde.groesse / 1024).toFixed(0)} KB nach einer Saison`);
  const groesse = JSON.stringify(k.sichern()).length;
  assert.ok(groesse < 1024 * 1024, `${(groesse / 1024).toFixed(0)} KB nach zwei Saisons`);
});

test('karriere AC-21 und karriere AC-17: die Saison geht weiter', () => {
  const { k } = zweiSaisons();
  assert.equal(k.saison, 3);
  assert.equal(k.termin, 0);
  assert.equal(k.sponsorAngebote.length, 3);
  assert.equal(k.verein.sponsor, null);
  assert.ok(k.plaene[1].flat().every((p) => p.tore === null));
  assert.ok(k.pokal.runden[0].paarungen.length === 16 && k.pokal.runden[0].paarungen.every((p) => !p.tore));
  assert.ok(k.vorstand.ziel && k.vorstand.ziel.platz);
  assert.equal(k.historie.length, 2);
  assert.ok(k.vorspulen({ anzahl: 2 }).ok);
});

// ----------------------------------------------------------------- Liga

test('liga AC-7: die Torjaegerliste zaehlt je Liga, auch nach einem Wechsel', () => {
  const k = neu();
  bis(k, istLiga(3));
  const summe = (nummer) => Object.values(k.torjaeger[nummer]).reduce((s, e) => s + e.tore, 0);
  const tore = (nummer) => k.plaene[nummer].flat().reduce((s, p) => s + (p.tore ? p.tore[0] + p.tore[1] : 0), 0);
  assert.equal(summe(1), tore(1));
  assert.equal(summe(2), tore(2));

  const [id, eintrag] = Object.entries(k.torjaeger[1]).sort((a, b) => b[1].tore - a[1].tore)
    .find(([sid]) => { const g = transfer.finden(k, sid); return g?.verein && g.verein.id !== k.vereinId && g.verein.liga === 1; });
  const gefunden = transfer.finden(k, id);
  transfer.wechseln(k, { kaeufer: k.verein, verkaeufer: gefunden.verein, spieler: gefunden.spieler, abloese: 0, laufzeit: 1 });
  gefunden.spieler.staerke = 99;
  const vorher = eintrag.tore;
  for (let i = 0; i < 30 && k.torjaeger[1][id].tore === vorher; i++) {
    k.vorstand.vertrauen = 100;
    k.weiter();
  }
  assert.ok(k.torjaeger[1][id].tore > vorher, 'der Neue hat nie getroffen');
  assert.equal(k.torjaeger[1][id].verein, k.verein.name);
});

test('liga AC-8: eine Saison ist wiederholbar', () => {
  const { k } = ganzeSaison();
  const nochmal = Karriere.neu({ startwert: 4711, vereinId: null });
  bis(nochmal, ist('saisonende'), { geduldig: false });
  nochmal.weiter();
  assert.deepEqual(nochmal.historie[0].tabellen, k.historie[0].tabellen);
});

test('finanzen AC-1 und liga AC-9: nur der Gastgeber nimmt Eintritt', () => {
  const { buch, anfang } = ganzeSaison();
  const heim = new Set([...anfang.plaene[1][0], ...anfang.plaene[2][0]].map((p) => p.heim));
  const eintritt = buch.filter((b) => b.saison === 1 && b.termin === indexVon(istLiga(1)) && b.kategorie === 'zuschauer');
  assert.equal(eintritt.length, 18);
  assert.ok(eintritt.every((b) => heim.has(b.verein) && b.betrag > 0));
});

test('liga AC-10 und finanzen AC-5: Gehaelter laufen jeden Termin', () => {
  const { buch, anfang } = ganzeSaison();
  const vorbereitung = buch.filter((b) => b.saison === 1 && b.termin === 0 && b.kategorie === 'gehaelter');
  assert.equal(vorbereitung.length, 36);
  for (const b of vorbereitung) assert.equal(b.betrag, -anfang.gehaltJeTermin.get(b.verein));
  for (const index of [indexVon(ist('winterpause')), indexVon(istPokal(3))]) {
    assert.equal(buch.filter((b) => b.saison === 1 && b.termin === index && b.kategorie === 'gehaelter').length, 36);
  }
});

test('liga AC-13: Fernsehgeld bekommen beide', () => {
  const { buch } = ganzeSaison();
  const fernsehen = buch.filter((b) => b.saison === 1 && b.termin === indexVon(istLiga(1)) && b.kategorie === 'fernsehen');
  assert.equal(new Set(fernsehen.map((b) => b.verein)).size, 36);
});

test('liga AC-11: drei steigen ab, drei steigen auf', () => {
  const { k, vorEnde } = ganzeSaison();
  const ab = vorEnde.tabellen[1].slice(-3).map((z) => z.id);
  const auf = vorEnde.tabellen[2].slice(0, 3).map((z) => z.id);
  for (const id of ab) assert.equal(k.vereinVon(id).liga, 2);
  for (const id of auf) assert.equal(k.vereinVon(id).liga, 1);
  assert.deepEqual([k.vereine.filter((v) => v.liga === 1).length, k.vereine.filter((v) => v.liga === 2).length], [18, 18]);
});

test('liga AC-14 und finanzen AC-10: tiefes Minus kostet Punkte', () => {
  const k = neu();
  bis(k, ist('winterpause'));
  const pleite = k.vereinVon('v2');
  pleite.konto = -5000;
  k.verein.konto = 1000;
  const vorher = liga.wertung(k.tabellen[1].find((z) => z.id === pleite.id));
  k.weiter();
  const zeile = k.tabellen[1].find((z) => z.id === pleite.id);
  assert.equal(zeile.abzug, finanzen.PUNKTABZUG);
  assert.equal(liga.wertung(zeile), vorher - finanzen.PUNKTABZUG);
  assert.equal(k.tabellen[1].find((z) => z.id === k.vereinId).abzug, 0);
  assert.ok(k.nachrichten.some((n) => n.text.startsWith(`${pleite.name}: 6 Punkte Abzug`)));
});

test('liga AC-15: zwei Ligen zu je achtzehn', () => {
  const zustand = neu().zustand();
  assert.deepEqual([zustand.tabellen[1].length, zustand.tabellen[2].length], [18, 18]);
  assert.deepEqual(zustand.tabellen[1].filter((z) => z.zone === 'abstieg').map((z) => z.platz), [16, 17, 18]);
  assert.deepEqual(zustand.tabellen[2].filter((z) => z.zone === 'aufstieg').map((z) => z.platz), [1, 2, 3]);
});

test('liga AC-17: die Chronik bleibt', () => {
  const { k, vorEnde } = ganzeSaison();
  const eintrag = k.historie[0];
  assert.equal(eintrag.saison, 1);
  assert.equal(eintrag.meister[1], vorEnde.tabellen[1][0].name);
  assert.equal(eintrag.meister[2], vorEnde.tabellen[2][0].name);
  assert.equal(eintrag.pokalsieger, k.vereinVon(vorEnde.pokal.sieger).name);
  assert.deepEqual([eintrag.absteiger.length, eintrag.aufsteiger.length], [3, 3]);
  assert.deepEqual([eintrag.tabellen[1].length, eintrag.tabellen[2].length], [18, 18]);
  assert.equal(k.historie.length, 11);
  assert.ok(k.historie.slice(0, 10).every((h) => h.tabellen), 'eine der letzten zehn Tabellen fehlt');
  assert.equal(k.historie[10].tabellen, undefined, 'die elfte Tabelle ist noch da');
});

test('liga AC-18: der Ruf folgt dem Abschneiden', () => {
  const { k, vorEnde } = ganzeSaison();
  const aenderung = (id) => k.vereinVon(id).reputation - vorEnde.ruf.get(id);
  const auf = vorEnde.tabellen[2].slice(0, 3).map((z) => aenderung(z.id));
  const ab = vorEnde.tabellen[1].slice(-3).map((z) => aenderung(z.id));
  assert.ok(schnitt(auf) > schnitt(ab) + 10, `Aufsteiger ${auf}, Absteiger ${ab}`);
  const pokalsieger = vorEnde.pokal.sieger;
  assert.ok(k.vereinVon(pokalsieger).reputation >= vorEnde.ruf.get(pokalsieger) - 10);
});

// ---------------------------------------------------------------- Pokal

test('pokal AC-5 und finanzen AC-16: Praemien je Runde, fuer den Sieger obendrauf', () => {
  const { buch, vorEnde } = ganzeSaison();
  const ersteRunde = buch.filter((b) => b.saison === 1 && b.termin === indexVon(istPokal(1)) && b.kategorie === 'praemien');
  assert.equal(ersteRunde.length, 32);
  assert.ok(ersteRunde.every((b) => b.betrag === 250 && b.zweck === 'Pokal: 1. Runde'));
  const sieg = buch.filter((b) => b.zweck === 'Pokalsieg');
  assert.deepEqual(sieg.map((b) => [b.verein, b.betrag]), [[vorEnde.pokal.sieger, 3500]]);
});

test('pokal AC-4: das Finale bringt keinem Zuschauereinnahmen', () => {
  const { buch } = ganzeSaison();
  const finale = buch.filter((b) => b.saison === 1 && b.termin === indexVon(istPokal(5)));
  assert.equal(finale.filter((b) => b.kategorie === 'zuschauer').length, 0);
  assert.equal(finale.filter((b) => b.zweck === 'Pokal: Finale').length, 2);
  const halbfinale = buch.filter((b) => b.saison === 1 && b.termin === indexVon(istPokal(4)) && b.kategorie === 'zuschauer');
  assert.equal(halbfinale.length, 2);
});

test('pokal AC-6: nur Sieger kommen weiter', () => {
  const { vorEnde } = ganzeSaison();
  const runden = vorEnde.pokal.runden;
  assert.deepEqual(runden.map((r) => r.paarungen.length), [16, 8, 4, 2, 1]);
  for (let i = 1; i < runden.length; i++) {
    const dabei = new Set(runden[i].paarungen.flatMap((p) => [p.heim, p.gast]));
    assert.deepEqual(dabei, new Set(runden[i - 1].paarungen.map((p) => p.sieger)));
  }
  assert.equal(vorEnde.pokal.sieger, runden[4].paarungen[0].sieger);
});

test('pokal AC-8: weiter oder raus steht im Postfach', () => {
  const k = neu();
  bis(k, istPokal(1));
  const vorher = k.nachrichten.length;
  k.weiter();
  const neue = k.nachrichten.slice(vorher).map((n) => n.text);
  const ergebnis = neue.find((t) => t.startsWith('Pokal, 1. Runde: '));
  assert.ok(ergebnis, neue.join(' | '));
  if (/Weiter/.test(ergebnis)) assert.ok(neue.some((t) => t.startsWith('Pokal, Achtelfinale: ')), 'der naechste Gegner fehlt');
  else assert.match(ergebnis, /Ausgeschieden/);
});

// ------------------------------------------------------------- Finanzen

test('finanzen AC-8: jede Bewegung wird gebucht', () => {
  const k = neu();
  k.weiter();
  k.weiter();
  const arten = new Set(k.buch.map((b) => b.kategorie));
  for (const art of ['gehaelter', 'fernsehen', 'sponsor']) assert.ok(arten.has(art), `${art} fehlt im Buch`);
  const ziel = kaufbar(k);
  k.kaufen(ziel.id, ziel.forderung, 1);
  const kauf = k.buch.at(-1);
  assert.deepEqual([kauf.kategorie, kauf.betrag, kauf.datum], ['transfers', -ziel.forderung, '2. Spieltag']);
  assert.match(kauf.zweck, new RegExp(ziel.name));
  assert.ok(k.buch.every((b) => b.zweck && b.datum && Number.isInteger(b.betrag)));
});

test('finanzen AC-9: ein Minus wird gemeldet', () => {
  const k = neu();
  k.verein.konto = 10;
  k.weiter();
  assert.ok(k.verein.konto < 0);
  assert.ok(k.nachrichten.some((n) => /Konto ist im Minus/.test(n.text) && /Punkte/.test(n.text)));
});

test('finanzen AC-12: den Eintritt setzt der Manager', () => {
  const k = neu();
  assert.equal(k.eintrittSetzen(35).eintritt, 35);
  assert.equal(k.verein.eintritt, 35);
  assert.equal(k.eintrittSetzen(500).eintritt, 80);
  assert.ok(k.eintrittSetzen(Number('x')).fehler);
});

test('finanzen AC-13: drei Sponsoren, gewaehlt oder vom Vorstand', () => {
  const k = neu();
  assert.equal(k.sponsorAngebote.length, 3);
  const gewaehlt = k.sponsorAngebote[2];
  assert.ok(k.sponsorWaehlen(gewaehlt.id).ok);
  assert.ok(k.sponsorWaehlen(gewaehlt.id).fehler);
  k.weiter();
  k.weiter();
  const eigenes = k.zuletzt.eigenes;
  const i = eigenes.heim.id === k.vereinId ? 0 : 1;
  const sieg = eigenes.tore[i] > eigenes.tore[1 - i];
  const zahlung = k.buch.find((b) => b.kategorie === 'sponsor');
  assert.equal(zahlung.betrag, gewaehlt.jeSpiel + (sieg ? gewaehlt.jeSieg : 0));

  const ohneWahl = neu();
  const ausgewogen = ohneWahl.sponsorAngebote[1];
  ohneWahl.weiter();
  assert.deepEqual(ohneWahl.verein.sponsor, ausgewogen);
  assert.ok(ohneWahl.nachrichten.some((n) => n.text.includes(ausgewogen.name)));
  assert.ok(ohneWahl.sponsorWaehlen('egal').fehler);
});

test('finanzen AC-14: Stadionausbau fuer den Menschen und die anderen', () => {
  const k = neu();
  k.verein.konto = 10000;
  const plaetze = k.verein.stadion.plaetze;
  assert.ok(k.stadionAusbauen(1).ok);
  assert.equal(k.verein.konto, 7500);
  assert.equal(k.buch.at(-1).kategorie, 'stadion');
  assert.match(k.stadionAusbauen(1).fehler, /gebaut/);
  for (let i = 0; i < 2; i++) k.weiter();
  assert.equal(k.verein.stadion.plaetze, plaetze);
  k.weiter();
  assert.equal(k.verein.stadion.plaetze, plaetze + 2500);
  assert.ok(k.nachrichten.some((n) => /Stadionausbau ist fertig/.test(n.text)));

  const reich = k.vereinVon('v1');
  reich.konto = 60000;
  reich.eintritt = 10;
  k.kiStadion();
  assert.ok(reich.stadion.ausbau, 'der reiche Verein baut nicht');
  assert.ok(reich.konto >= 12000);
});

// ------------------------------------------------------------ Vertraege

test('kader AC-15 und vertraege AC-6: wer ohne Vertrag dasteht, geht', () => {
  const { auslaufend, angekuendigt, nachEnde } = zweiSaisons();
  assert.ok(auslaufend.length > 0);
  for (const { id } of auslaufend) assert.ok(!nachEnde.kader.has(id), 'ein Spieler ohne Vertrag ist geblieben');
  const meldung = nachEnde.post.find((t) => t.startsWith('Vertrag ausgelaufen, verlassen den Verein: '));
  assert.ok(meldung);
  for (const { id, name } of auslaufend) {
    if (!angekuendigt.has(id)) assert.ok(meldung.includes(name), `${name} fehlt in der Meldung`);
  }
});

test('vertraege AC-7: die Winterpause warnt vor auslaufenden Vertraegen', () => {
  const { auslaufend, angekuendigt, winterpost } = zweiSaisons();
  const warnung = winterpost.find((t) => t.startsWith('Zum Saisonende laufen '));
  assert.ok(warnung);
  // Gewarnt wird vor denen, mit denen sich noch verlaengern laesst - nicht vor denen, die aufhoeren.
  for (const { id, name } of auslaufend) assert.equal(warnung.includes(name), !angekuendigt.has(id), name);
});

test('vertraege AC-8: die anderen verlaengern gezielt', () => {
  const verlaengert = (konto) => {
    const k = Karriere.neu({ startwert: 4711, vereinId: null });
    const verein = k.vereinVon('v4');
    verein.konto = konto;
    for (const s of verein.spieler) s.vertrag.bis = 1;
    const bester = verein.spieler.filter((s) => s.alter <= 26).sort((a, b) => b.staerke - a.staerke)[0];
    transfer.kiVertraege(k, zufallAus(2));
    return { anzahl: verein.spieler.filter((s) => s.vertrag.bis > 1).length, bester };
  };
  const normal = verlaengert(5000);
  assert.ok(normal.anzahl > 5 && normal.anzahl <= transfer.KI_KADER_ZIEL - 2, `${normal.anzahl} verlaengert`);
  assert.ok(normal.bester.vertrag.bis > 1, 'der beste Junge wurde nicht verlaengert');
  assert.ok(verlaengert(-5000).anzahl < normal.anzahl, 'im Minus wird genauso verlaengert');
});

test('vertraege AC-10: die Abstiegsklausel senkt die Gehaelter', () => {
  const { k, vorEnde } = ganzeSaison();
  let geprueft = 0;
  for (const { id } of vorEnde.tabellen[1].slice(-3)) {
    for (const spieler of k.vereinVon(id).spieler) {
      const alt = vorEnde.vertraege.get(spieler.id);
      if (!alt || alt.verein !== id || alt.bis <= 1) continue;
      assert.equal(spieler.vertrag.gehalt, Math.round(alt.gehalt * 0.75), spieler.name);
      geprueft += 1;
    }
  }
  assert.ok(geprueft > 20);
});

test('vertraege AC-4: der Mensch verlaengert zum genannten Gehalt', () => {
  const k = neu();
  const spieler = k.verein.spieler.find((s) => s.vertrag.bis === 2 && s.moral >= 25 && s.alter <= 30);
  const wunsch = vertraege.gehaltswunsch(spieler);
  assert.deepEqual(k.verlaengern(spieler.id, 3), { ok: true, bis: 5, gehalt: wunsch });
  assert.ok(k.nachrichten.at(-1).text.includes('verlaengert bis Saison 5'));
  assert.match(k.verlaengern(spieler.id, 1).fehler, /laeuft noch bis Saison 5/);
});

// ------------------------------------------------------------- Vorstand

test('vorstand AC-4: entlassen wird ab dem 8. Spieltag', () => {
  const k = neu();
  bis(k, istLiga(7));
  k.vorstand.vertrauen = 1;
  k.weiter();
  assert.equal(k.status, 'laeuft', 'schon vor dem 8. Spieltag entlassen');
  k.vorstand.vertrauen = 1;
  k.weiter();
  assert.equal(k.status, 'entlassen');
  assert.equal(k.stellen.length, 3);
  assert.ok(k.nachrichten.at(-1).text.includes('entlassen'));
});

test('vorstand AC-7 und vorstand AC-8: entlassen heisst warten, dann neue Stelle, neues Ziel', () => {
  const k = neu();
  bis(k, istLiga(8));
  k.vorstand.vertrauen = 1;
  k.weiter();
  assert.equal(k.status, 'entlassen');
  const ruhig = JSON.stringify(k.tabellen);
  assert.match(k.weiter().fehler, /entlassen/);
  assert.match(k.kaufen('egal', 0, 1).fehler, /entlassen/);
  assert.match(k.taktikSetzen({ haerte: 1 }).fehler, /entlassen/);
  assert.equal(JSON.stringify(k.tabellen), ruhig);

  const alter = k.verein;
  assert.ok(k.stelleAntreten('v999').fehler);
  const neuId = k.stellen[1];
  assert.ok(k.stelleAntreten(neuId).ok);
  assert.equal(k.vereinId, neuId);
  assert.equal(k.status, 'laeuft');
  assert.equal(k.vorstand.vertrauen, vorstand.VERTRAUEN_NEU);
  assert.equal(k.vorstand.ziel.rang, vorstand.erwarteterRang(k.vereine, k.verein));
  assert.equal(alter.aufstellung, null);
  assert.ok(k.weiter().ok);
});

test('vorstand AC-1: jede Saison ein Ziel, am Rang des Kaders', () => {
  const k = neu('v5');
  assert.equal(k.vorstand.ziel.rang, vorstand.erwarteterRang(k.vereine, k.verein));
  assert.equal(k.vorstand.vertrauen, vorstand.VERTRAUEN_START);
  assert.ok(k.nachrichten[0].text.includes(k.vorstand.ziel.text));
});

// ------------------------------------------------------------- Spielziel

test('manager AC-4: eine Saison endet vollstaendig', () => {
  const { bericht } = zweiSaisons();
  assert.equal(bericht.art, 'saisonende');
  assert.ok(bericht.meister[1] && bericht.meister[2] && bericht.pokalsieger);
  assert.deepEqual([bericht.absteiger.length, bericht.aufsteiger.length], [3, 3]);
  assert.equal(bericht.eigener.verein, 'SC Hohenfeld'.length ? bericht.eigener.verein : '');
  assert.ok(bericht.eigener.platz >= 1 && bericht.eigener.platz <= 18);
  assert.ok(typeof bericht.eigener.erreicht === 'boolean' && bericht.eigener.ziel.platz);
});

test('manager AC-11: Saison um Saison, Spieler altern', () => {
  const { k, alter } = zweiSaisons();
  const gealtert = k.vereine.flatMap((v) => v.spieler).filter((s) => alter.has(s.id));
  assert.ok(gealtert.length > 300);
  assert.ok(gealtert.every((s) => s.alter === alter.get(s.id) + 2));
  const jugend = k.vereine.flatMap((v) => v.spieler).filter((s) => !alter.has(s.id) && s.jugend);
  assert.ok(jugend.length > 40, `nur ${jugend.length} Jugendspieler nach zwei Saisons`);
});

test('kader AC-14: das Postfach meldet die Jugend', () => {
  const { nachEnde, k } = zweiSaisons();
  assert.ok(nachEnde.post.some((t) => t.startsWith('Aus der Jugend ruecken auf: ')));
  assert.ok(k.verein.spieler.some((s) => s.jugend && s.alter === 17));
});

test('kader AC-3: Namen bleiben ueber Saisons eindeutig', () => {
  const { k } = zweiSaisons();
  const namen = [...k.vereine.flatMap((v) => v.spieler), ...k.freie].map((s) => s.name);
  assert.equal(new Set(namen).size, namen.length);
  for (const startwert of [1, 42, 999999]) {
    const { vereine, freie } = kader.weltErzeugen(startwert);
    const alle = [...vereine.flatMap((v) => v.spieler), ...freie].map((s) => s.name);
    assert.equal(new Set(alle).size, alle.length, `Startwert ${startwert}`);
  }
});

test('manager AC-12: zwei Ligen und ein Pokal', () => {
  const k = neu();
  assert.equal(k.vereine.length, 36);
  assert.deepEqual(k.pokal.runden.map((r) => r.name), ['1. Runde', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale']);
  assert.equal(k.pokal.runden[0].paarungen.length, 16);
  assert.equal(TERMINE.filter((t) => t.art === 'pokal').length, 5);
});

test('manager AC-13: gleiche Regeln fuer alle', () => {
  const k = neu();
  bis(k, istLiga(4));
  assert.ok(k.vereine.every((v) => v.trainingswochen === k.termin), 'nicht alle Vereine haben gleich oft trainiert');

  const { buch, vorEnde, k: welt, ticker } = ganzeSaison();
  for (const verein of welt.vereine) {
    for (const art of ['gehaelter', 'fernsehen', 'sponsor', 'praemien']) {
      assert.ok(buch.some((b) => b.verein === verein.id && b.kategorie === art), `${verein.name} ohne ${art}`);
    }
  }
  const verlaengert = welt.vereine.flatMap((v) => v.spieler)
    .filter((s) => vorEnde.vertraege.get(s.id)?.bis === 1 && s.vertrag?.bis > 1);
  assert.ok(verlaengert.length > 50, `nur ${verlaengert.length} Vertraege von den anderen verlaengert`);
  assert.ok(ticker.length > 50);
});
