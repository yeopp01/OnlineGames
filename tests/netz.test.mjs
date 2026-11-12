// Prueft den echten Weg: HTTP-Server, WebSocket, Raum, Simulation.
// Keine direkten Aufrufe der Klassen - was hier gruen ist, geht auch im Browser.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import WebSocket from 'ws';
import { kunde as kundeMit, istTyp, konto, beenden, warte } from './hilfe.mjs';

const require = createRequire(import.meta.url);
const { starten } = require('../server/index.js');
const { STARTAUFSTELLUNG } = require('../server/spiele/strategie/daten.js');

const HAFEN = 4199;
let laufend;
let kekse;

before(async () => {
  // Alle Testkunden kommen von derselben Adresse. Die Grenzen des Schutzes
  // werden hier bewusst weit gesetzt - sie haben ihre eigenen Tests.
  laufend = await starten(HAFEN, {
    schutz: {
      verbindungenJeAdresse: 200,
      verbindungenJeMinute: 500,
      raeumeGesamt: 200,
      raeumeJeAdresse: 100,
    },
    konten: { datei: ':memory:', geheimnis: 'p'.repeat(48) },
  });
  // Eroeffnen verlangt ein Konto - also gibt es hier eines.
  const angelegt = await konto(HAFEN, laufend, { name: 'Anna' });
  kekse = angelegt.kekse;
});

after(() => beenden(laufend));

// Wer eroeffnet, ist angemeldet; wer beitritt, braucht nur den Code.
const gastgeber = () => kundeMit(HAFEN, kekse);
const kunde = () => kundeMit(HAFEN);


test('raeume AC-1 / raeume AC-2: Raum eroeffnen liefert einen Code, ein zweiter tritt bei', async () => {
  const gast = gastgeber();
  await gast.offen();
  gast.senden({ typ: 'erstellen', name: 'Anna' });
  const du = await gast.warteAuf(istTyp('du'));
  assert.match(du.code, /^[A-Z0-9]{6}$/);
  assert.match(du.anzeige, /^[A-Z0-9]{3}-[A-Z0-9]{3}$/);

  const zweiter = kunde();
  await zweiter.offen();
  zweiter.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  const raum = await zweiter.warteAuf((n) => n.typ === 'raum' && n.spieler.length === 2);
  assert.deepEqual(raum.spieler.map((s) => s.name), ['Anna', 'Bert']);

  gast.zu();
  zweiter.zu();
});

test('raeume AC-15: der Code wird nachsichtig gelesen', async () => {
  const gast = gastgeber();
  await gast.offen();
  gast.senden({ typ: 'erstellen', name: 'Anna' });
  const du = await gast.warteAuf(istTyp('du'));

  // So, wie er vorgelesen und abgetippt wird: klein, mit Bindestrich, mit
  // Leerzeichen davor und dahinter.
  const getippt = ` ${du.anzeige.toLowerCase()} `;
  const bert = kunde();
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: getippt, name: 'Bert' });
  const raum = await bert.warteAuf((n) => n.typ === 'raum' && n.spieler.length === 2);
  assert.deepEqual(raum.spieler.map((s) => s.name), ['Anna', 'Bert']);

  gast.zu();
  bert.zu();
});

test('raeume AC-3: ein falscher Code wird abgewiesen', async () => {
  const gast = kunde();
  await gast.offen();
  gast.senden({ typ: 'beitreten', code: 'XXXXXX', name: 'Anna' });
  const fehler = await gast.warteAuf(istTyp('fehler'));
  assert.match(fehler.text, /Raumcode/);
  gast.zu();
});

test('raeume AC-6: allein laesst sich nicht starten', async () => {
  const gast = gastgeber();
  await gast.offen();
  gast.senden({ typ: 'erstellen', name: 'Anna' });
  await gast.warteAuf(istTyp('du'));
  gast.senden({ typ: 'start' });
  const fehler = await gast.warteAuf(istTyp('fehler'));
  assert.match(fehler.text, /Mitspieler/);
  gast.zu();
});

test('raeume AC-7: nur der Gastgeber startet', async () => {
  const anna = gastgeber();
  await anna.offen();
  anna.senden({ typ: 'erstellen', name: 'Anna' });
  const du = await anna.warteAuf(istTyp('du'));

  const bert = kunde();
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  await bert.warteAuf(istTyp('du'));

  bert.senden({ typ: 'start' });
  const fehler = await bert.warteAuf(istTyp('fehler'));
  assert.match(fehler.text, /Gastgeber/);

  anna.zu();
  bert.zu();
});

test('raeume AC-8 / uebertragung AC-5 / uebertragung AC-6 / uebertragung AC-7: Aufbau und laufende Zustaende', async () => {
  const anna = gastgeber();
  await anna.offen();
  // Aufgedeckt (kampf AC-16): hier geht es um die Uebertragung beider Doerfer,
  // nicht um den Nebel - den prueft kampf AC-13 eigens.
  anna.senden({ typ: 'erstellen', name: 'Anna', einstellungen: { sicht: 'aufgedeckt' } });
  const du = await anna.warteAuf(istTyp('du'));

  const bert = kunde();
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  await bert.warteAuf(istTyp('du'));

  anna.senden({ typ: 'start', startwert: 7 });
  const aufbau = await bert.warteAuf(istTyp('aufbau'));
  assert.equal(aufbau.karte.groesse, 120); // zwei Spieler (karte AC-11)
  assert.equal(aufbau.spieler.length, 2);

  const erster = await bert.warteAuf(istTyp('zustand'));
  // Drei Dorfbewohner und ein Spaeherreiter je Spieler (bauen AC-22).
  assert.equal(erster.einheiten.length, 2 * STARTAUFSTELLUNG.length);

  // uebertragung AC-7 spricht von zehn Einheiten: zwei kommen als Pruefgriff dazu.
  const welt = laufend.raeume.finden(du.code).welt;
  welt.einheitAnlegen(du.id, 20, 20);
  welt.einheitAnlegen(du.id, 21, 20);
  const zustand = await bert.warteAuf((n) => n.typ === 'zustand' && n.einheiten.length === 10);
  assert.ok(zustand.einheiten.every((e) => typeof e.x === 'number'));

  // uebertragung AC-7: ein Zustand mit zehn Einheiten bleibt unter 1 kB.
  const groesse = Buffer.byteLength(JSON.stringify(zustand));
  assert.ok(groesse < 1024, `Zustand war ${groesse} Byte`);

  anna.zu();
  bert.zu();
});

test('einheiten AC-12: erst die Ablieferung fuellt den Vorrat', async () => {
  const anna = gastgeber();
  await anna.offen();
  anna.senden({ typ: 'erstellen', name: 'Anna' });
  const du = await anna.warteAuf(istTyp('du'));

  const bert = kunde();
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  await bert.warteAuf(istTyp('du'));

  anna.senden({ typ: 'start', startwert: 7 });
  const aufbau = await anna.warteAuf(istTyp('aufbau'));

  const roh = Buffer.from(aufbau.karte.felder, 'base64');
  const meine = aufbau.spieler.find((s) => s.id === du.id);

  // Das naechstgelegene Waldfeld zur eigenen Basis suchen.
  let ziel = null;
  let besterAbstand = Infinity;
  for (let i = 0; i < roh.length; i++) {
    if (roh[i] !== 1) continue;
    const x = i % aufbau.karte.groesse;
    const y = (i / aufbau.karte.groesse) | 0;
    const abstand = Math.hypot(x - meine.basis.x, y - meine.basis.y);
    if (abstand < besterAbstand) {
      besterAbstand = abstand;
      ziel = { x, y };
    }
  }
  assert.ok(ziel, 'Es muss Wald in Basisnaehe geben');

  const zustand = await anna.warteAuf(istTyp('zustand'));
  const meineEinheiten = zustand.einheiten.filter((e) => e.b === du.id).map((e) => e.i);
  // Zeitraffer als Pruefgriff: eine volle Ladung braucht bei 0,39 je Sekunde
  // gut 25 Sekunden Spielzeit, dazu die Wege.
  laufend.raeume.finden(du.code).zeitraffer = 10;
  anna.senden({ typ: 'befehl', einheiten: meineEinheiten, ziel });

  const holzVorher = zustand.spieler.find((s) => s.id === du.id).holz;

  // Getragen ist noch nicht abgeliefert: waehrend die ersten schon Holz in
  // der Hand haben, steht der Vorrat still.
  const tragend = await anna.warteAuf(
    (n) => n.typ === 'zustand' && n.einheiten.some((e) => e.b === du.id && e.l > 0),
    30000,
  );
  assert.equal(tragend.spieler.find((s) => s.id === du.id).holz, holzVorher);

  const voll = await anna.warteAuf((n) => {
    if (n.typ !== 'zustand') return false;
    const stand = n.spieler.find((s) => s.id === du.id);
    return stand && stand.holz > holzVorher;
  }, 30000);
  const stand = voll.spieler.find((s) => s.id === du.id);
  assert.ok(stand.holz >= holzVorher + 10, `eine volle Ladung sind zehn, gestiegen um ${stand.holz - holzVorher}`);

  anna.zu();
  bert.zu();
});

test('uebertragung AC-1 / uebertragung AC-2 / einheiten AC-4: fremde Einheiten gehorchen nicht', async () => {
  const anna = gastgeber();
  await anna.offen();
  anna.senden({ typ: 'erstellen', name: 'Anna' });
  const du = await anna.warteAuf(istTyp('du'));

  const bert = kunde();
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  const duBert = await bert.warteAuf(istTyp('du'));

  anna.senden({ typ: 'start', startwert: 7 });
  await anna.warteAuf(istTyp('aufbau'));
  const zustand = await anna.warteAuf(istTyp('zustand'));

  const fremde = zustand.einheiten.filter((e) => e.b === duBert.id);
  const vorher = fremde.map((e) => ({ i: e.i, x: e.x, y: e.y }));

  // Anna befiehlt Berts Einheiten quer ueber die Karte.
  anna.senden({ typ: 'befehl', einheiten: fremde.map((e) => e.i), ziel: { x: 5, y: 5 } });

  const spaeter = await anna.warteAuf((n) => n.typ === 'zustand' && n.t >= zustand.t + 15);
  for (const alt of vorher) {
    const neu = spaeter.einheiten.find((e) => e.i === alt.i);
    assert.equal(neu.x, alt.x, 'fremde Einheit darf sich nicht bewegen');
    assert.equal(neu.y, alt.y, 'fremde Einheit darf sich nicht bewegen');
  }

  anna.zu();
  bert.zu();
});

test('bauen AC-8 / bauen AC-11: Ausbilden und Abbrechen gehen ueber die Leitung, Absagen kommen zurueck', async () => {
  const anna = gastgeber();
  await anna.offen();
  // Aufgedeckt (kampf AC-16): hier geht es um die Uebertragung beider Doerfer,
  // nicht um den Nebel - den prueft kampf AC-13 eigens.
  anna.senden({ typ: 'erstellen', name: 'Anna', einstellungen: { sicht: 'aufgedeckt' } });
  const du = await anna.warteAuf(istTyp('du'));

  const bert = kunde();
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  const duBert = await bert.warteAuf(istTyp('du'));

  anna.senden({ typ: 'start', startwert: 7 });
  const aufbau = await anna.warteAuf(istTyp('aufbau'));
  const zustand = await anna.warteAuf(istTyp('zustand'));
  const meines = aufbau.gebaeude.find((g) => g.b === du.id && g.art === 'dorfzentrum');
  const fremdes = aufbau.gebaeude.find((g) => g.b === duBert.id);
  assert.ok(meines && fremdes, 'jeder hat ein Dorfzentrum im Zustand');

  const nahrung = (n) => n.spieler.find((s) => s.id === du.id).nahrung;
  anna.senden({ typ: 'befehl', auftrag: 'ausbilden', gebaeude: meines.i, einheit: 'dorfbewohner' });
  anna.senden({ typ: 'befehl', auftrag: 'ausbilden', gebaeude: meines.i, einheit: 'dorfbewohner' });
  const eingereiht = await anna.warteAuf(
    (n) => n.typ === 'zustand' && n.gebaeude?.find((g) => g.i === meines.i)?.s.length === 2,
  );
  assert.equal(nahrung(eingereiht), nahrung(zustand) - 100);
  // Vier von fuenf Plaetzen belegt: der erste Auftrag laeuft.
  assert.equal(eingereiht.gebaeude.find((g) => g.i === meines.i).w, false);
  // Solange nichts ausgebildet wird, schweigt das Gebaeude (uebertragung AC-7).
  const fremdesSchweigt = await anna.warteAuf((n) => n.typ === 'zustand' && n.t > zustand.t + 3);
  assert.ok(!fremdesSchweigt.gebaeude?.some((g) => g.i === fremdes.i));

  anna.senden({ typ: 'befehl', auftrag: 'abbrechen', gebaeude: meines.i, platz: 0 });
  const abgebrochen = await anna.warteAuf(
    (n) => n.typ === 'zustand' && n.gebaeude?.find((g) => g.i === meines.i)?.s.length === 1,
  );
  assert.equal(nahrung(abgebrochen), nahrung(zustand) - 50);

  anna.senden({ typ: 'befehl', auftrag: 'ausbilden', gebaeude: fremdes.i, einheit: 'dorfbewohner' });
  const absage = await anna.warteAuf(istTyp('fehler'));
  assert.match(absage.text, /nicht dein Gebäude/);

  anna.zu();
  bert.zu();
});

test('bauen AC-1 / bauen AC-5 / bauen AC-6: Bauen und Abreissen gehen ueber die Leitung', async () => {
  const anna = gastgeber();
  await anna.offen();
  anna.senden({ typ: 'erstellen', name: 'Anna' });
  const du = await anna.warteAuf(istTyp('du'));

  const bert = kunde();
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  await bert.warteAuf(istTyp('du'));

  anna.senden({ typ: 'start', startwert: 7 });
  const aufbau = await anna.warteAuf(istTyp('aufbau'));
  assert.equal(aufbau.werte.gebaeude.haus.groesse, 2);
  const zustand = await anna.warteAuf(istTyp('zustand'));
  const bauer = zustand.einheiten.find((e) => e.b === du.id && e.k === 'd');

  // Einen freien Platz liest der Test aus der Welt - befohlen wird ueber die Leitung.
  const welt = laufend.raeume.finden(du.code).welt;
  const basis = aufbau.spieler.find((s) => s.id === du.id).basis;
  let platz = null;
  for (let r = 6; !platz && r < 20; r++) {
    for (const [dx, dy] of [[r, 0], [0, r], [r, r], [-r, 0], [0, -r]]) {
      if (welt.platzPruefen('haus', basis.x + dx, basis.y + dy)) { platz = { x: basis.x + dx, y: basis.y + dy }; break; }
    }
  }
  const holz = (n) => n.spieler.find((s) => s.id === du.id).holz;

  anna.senden({ typ: 'befehl', auftrag: 'bauen', einheiten: [bauer.i], art: 'haus', ziel: platz });
  const baustelle = await anna.warteAuf((n) => n.typ === 'zustand' && n.gebaeude?.some((g) => g.art === 'haus' && g.b === du.id));
  const haus = baustelle.gebaeude.find((g) => g.art === 'haus');
  assert.equal(holz(baustelle), holz(zustand) - 25, 'bezahlt bei Baubeginn');
  assert.equal(haus.u, 0, 'eine Baustelle, noch nichts gebaut');
  assert.ok(baustelle.felder.some((f) => f.a === 6), 'die Grundflaeche ist bebaut');

  anna.senden({ typ: 'befehl', auftrag: 'bauen', einheiten: [bauer.i], art: 'haus', ziel: platz });
  const absage = await anna.warteAuf(istTyp('fehler'));
  assert.equal(absage.text, 'Hier ist kein Platz.');

  anna.senden({ typ: 'befehl', auftrag: 'abreissen', gebaeude: haus.i });
  const weg = await anna.warteAuf((n) => n.typ === 'zustand' && n.gebaeude?.some((g) => g.i === haus.i && g.weg));
  assert.equal(holz(weg), holz(zustand), 'nichts verbaut: alles zurueck');

  anna.zu();
  bert.zu();
});

test('raeume AC-9 / raeume AC-10: nach Verbindungsabbruch kehrt der Spieler zurueck', async () => {
  const anna = gastgeber();
  await anna.offen();
  anna.senden({ typ: 'erstellen', name: 'Anna' });
  const du = await anna.warteAuf(istTyp('du'));

  const bert = kunde();
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  const duBert = await bert.warteAuf(istTyp('du'));

  anna.senden({ typ: 'start', startwert: 7 });
  await anna.warteAuf(istTyp('aufbau'));
  await anna.warteAuf(istTyp('zustand'));

  bert.zu();
  await new Promise((fertig) => setTimeout(fertig, 200));

  const zurueck = kunde();
  await zurueck.offen();
  zurueck.senden({ typ: 'zurueck', code: du.code, token: duBert.token });
  const wieder = await zurueck.warteAuf(istTyp('du'));
  assert.equal(wieder.id, duBert.id, 'dieselbe Spielerkennung');

  const aufbau = await zurueck.warteAuf(istTyp('aufbau'));
  assert.equal(aufbau.spieler.length, 2);
  const zustand = await zurueck.warteAuf(istTyp('zustand'));
  assert.ok(zustand.einheiten.some((e) => e.b === duBert.id), 'seine Einheiten sind noch da');

  anna.zu();
  zurueck.zu();
});

test('raeume AC-17: gehen alle, bleibt die laufende Partie stehen - die Uhr haelt an, und die Rueckkehr findet sie', async () => {
  const anna = gastgeber();
  await anna.offen();
  anna.senden({ typ: 'erstellen', name: 'Anna' });
  const du = await anna.warteAuf(istTyp('du'));
  const bert = kunde();
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  await bert.warteAuf(istTyp('du'));
  anna.senden({ typ: 'start', startwert: 7 });
  await anna.warteAuf(istTyp('aufbau'));
  await anna.warteAuf((n) => n.typ === 'zustand' && n.t >= 3);

  // Beide weg - vorher war der Raum im selben Augenblick geschlossen, und
  // wer allein gegen den Computer neu lud, bekam "Diesen Raumcode gibt es
  // nicht" (das erste Spiel auf dem Server, 2026-11-12).
  bert.zu();
  anna.zu();
  await Promise.all([anna.zuende(), bert.zuende()]);
  const vorher = anna.eingang.filter(istTyp('zustand')).at(-1).t;
  // Eine Sekunde ohne jeden am Tisch waeren zehn Takte.
  await new Promise((fertig) => setTimeout(fertig, 1000));
  const raum = laufend.raeume.finden(du.code);
  assert.ok(raum, 'der Raum ist noch da');
  assert.ok(raum.welt.takt - vorher <= 2, `die Uhr steht: Takt ${raum.welt.takt} nach ${vorher}`);

  const zurueck = kunde();
  await zurueck.offen();
  zurueck.senden({ typ: 'zurueck', code: du.code, token: du.token });
  const wieder = await zurueck.warteAuf(istTyp('du'));
  assert.equal(wieder.id, du.id, 'derselbe Platz');
  await zurueck.warteAuf(istTyp('aufbau'));
  const erster = await zurueck.warteAuf(istTyp('zustand'));
  assert.ok(erster.t - vorher <= 4, `sie geht weiter, wo sie stand - nichts wird nachgeholt: Takt ${erster.t} nach ${vorher}`);
  // Und sie laeuft wieder.
  await zurueck.warteAuf((n) => n.typ === 'zustand' && n.t >= erster.t + 5);

  // Vor dem Start gibt es nichts zu bewahren: ein Raum im Warteraum schliesst
  // mit dem letzten, der geht.
  const cem = gastgeber();
  await cem.offen();
  cem.senden({ typ: 'erstellen', name: 'Cem' });
  const duCem = await cem.warteAuf(istTyp('du'));
  cem.zu();
  await cem.zuende();
  await new Promise((fertig) => setTimeout(fertig, 100));
  assert.equal(laufend.raeume.finden(duCem.code), null, 'der Warteraum ist zu');
  zurueck.zu();
});

test('raeume AC-18: eine Rueckkehr ins Leere sagt, dass der Platz weg ist - damit der Browser ihn vergisst', async () => {
  // Die Partie gibt es nicht mehr: das war die Meldung "Diesen Raumcode gibt
  // es nicht" bei jedem Neuladen (das erste Spiel auf dem Server).
  const spaet = kunde();
  await spaet.offen();
  spaet.senden({ typ: 'zurueck', code: 'ZZZZZZ', token: 'x'.repeat(32) });
  const weg = await spaet.warteAuf(istTyp('fehler'));
  assert.equal(weg.platzWeg, true, 'der Browser erfaehrt, dass er den Platz vergessen soll');
  assert.equal(weg.text, 'Diese Partie gibt es nicht mehr.');
  spaet.zu();

  // Den Raum gibt es, den Platz nicht: dieselbe Antwort.
  const anna = gastgeber();
  await anna.offen();
  anna.senden({ typ: 'erstellen', name: 'Anna' });
  const du = await anna.warteAuf(istTyp('du'));
  const fremd = kunde();
  await fremd.offen();
  fremd.senden({ typ: 'zurueck', code: du.code, token: 'y'.repeat(32) });
  const keiner = await fremd.warteAuf(istTyp('fehler'));
  assert.equal(keiner.platzWeg, true);
  assert.equal(keiner.text, weg.text, 'die Antwort verraet nicht, ob es den Raum gibt');
  assert.equal(fremd.eingang.some(istTyp('du')), false, 'und niemand sitzt auf einem fremden Platz');

  // Ein Beitritt mit falschem Code traegt das Zeichen nicht - dort gibt es
  // nichts zu vergessen.
  const bert = kunde();
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: 'ZZZZZY', name: 'Bert' });
  const daneben = await bert.warteAuf(istTyp('fehler'));
  assert.equal(daneben.platzWeg, undefined);
  anna.zu();
  fremd.zu();
  bert.zu();
});

test('raeume AC-14 / uebertragung AC-3: unsinnige Nachrichten bringen den Server nicht um', async () => {
  const anna = gastgeber();
  await anna.offen();
  anna.senden({ typ: 'erstellen', name: 'Anna' });
  const du = await anna.warteAuf(istTyp('du'));

  anna.draht.send('kein JSON');
  anna.senden({ typ: 'befehl', einheiten: 'nichts', ziel: null });
  anna.senden({ typ: 'quatsch' });
  anna.senden({ typ: 'befehl', einheiten: [1, 2], ziel: { x: -99, y: 1e9 } });

  const bert = kunde();
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  const raum = await bert.warteAuf((n) => n.typ === 'raum' && n.spieler.length === 2);
  assert.equal(raum.spieler.length, 2, 'der Raum lebt noch');

  anna.zu();
  bert.zu();
});

test('spielziel AC-6 / spielziel AC-5: Aufgeben geht ueber die Leitung, das Ende kommt bei beiden an', async () => {
  const anna = gastgeber();
  await anna.offen();
  anna.senden({ typ: 'erstellen', name: 'Anna' });
  const du = await anna.warteAuf(istTyp('du'));

  const bert = kunde();
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  await bert.warteAuf(istTyp('du'));

  anna.senden({ typ: 'start', startwert: 7 });
  await bert.warteAuf(istTyp('aufbau'));
  const laeuft = await anna.warteAuf(istTyp('zustand'));
  assert.equal(laeuft.ende, undefined, 'solange die Partie laeuft, steht kein Ende im Zustand');

  // Bert gibt auf. Das Ergebnis ist fuer beide dasselbe (spielziel AC-5),
  // also wird es auch bei beiden abgeholt - der Verlierer bekommt es so gut
  // wie der Sieger.
  bert.senden({ typ: 'befehl', auftrag: 'aufgeben' });
  const beiAnna = await anna.warteAuf((n) => n.typ === 'zustand' && n.ende);
  const beiBert = await bert.warteAuf((n) => n.typ === 'zustand' && n.ende);
  assert.deepEqual(beiAnna.ende, beiBert.ende);
  assert.equal(beiAnna.ende.grund, 'eroberung');
  assert.equal(beiAnna.ende.sieger, du.id, 'Anna hat gewonnen');
  assert.equal(beiAnna.spieler.find((s) => s.id === du.id).aus, undefined);
  assert.ok(beiAnna.spieler.some((s) => s.aus === 1), 'Bert ist ausgeschieden');

  // Der Raum haelt seine Uhr an: nach dem Ende kommt kein Zustand mehr.
  const raum = laufend.raeume.finden(du.code);
  assert.equal(raum.uhr, null, 'die Uhr des Raums steht');
  assert.equal(raum.welt.vorbei, true);

  anna.zu();
  bert.zu();
});

test('spielziel AC-9: die Revanche geht ueber dieselbe Leitung und denselben Raum - nur der Gastgeber startet sie', async () => {
  const anna = gastgeber();
  await anna.offen();
  anna.senden({ typ: 'erstellen', name: 'Anna' });
  const du = await anna.warteAuf(istTyp('du'));

  const bert = kunde();
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  const duBert = await bert.warteAuf(istTyp('du'));

  anna.senden({ typ: 'start', startwert: 7 });
  await bert.warteAuf(istTyp('aufbau'));

  // Bert gibt auf, Anna gewinnt - das ist die Lage, aus der die Revanche
  // gestartet wird.
  bert.senden({ typ: 'befehl', auftrag: 'aufgeben' });
  await anna.warteAuf((n) => n.typ === 'zustand' && n.ende);
  await bert.warteAuf((n) => n.typ === 'zustand' && n.ende);

  // Ein Gast startet sie nicht: wer verloren hat, soll nicht ungefragt eine
  // neue Partie aufziehen koennen.
  bert.senden({ typ: 'start', startwert: 11 });
  const abgewiesen = await bert.warteAuf(istTyp('fehler'));
  assert.match(abgewiesen.text, /Gastgeber/);

  // Der Gastgeber schon. Beide bekommen einen zweiten Aufbau - ohne dass
  // jemand einen Code getippt hat, es ist derselbe Raum und derselbe Platz.
  anna.senden({ typ: 'start', startwert: 11 });
  const neu = await bert.warteAuf((n) => n.typ === 'aufbau' && n.startwert === 11);
  assert.equal(neu.ende, undefined, 'die neue Partie ist nicht entschieden');
  assert.deepEqual(neu.spieler.map((s) => s.name), ['Anna', 'Bert']);
  assert.ok(neu.spieler.some((s) => s.id === duBert.id), 'Bert behaelt seinen Platz');
  assert.ok(neu.spieler.every((s) => s.aus === undefined), 'und ist nicht mehr ausgeschieden');

  // Eine wirklich neue Welt: beide haben ihre Startaufstellung wieder, auch
  // der, von dem eben nichts mehr auf der Karte stand.
  const laeuft = await bert.warteAuf(istTyp('zustand'));
  assert.equal(laeuft.einheiten.length, 2 * STARTAUFSTELLUNG.length);
  assert.equal(laeuft.einheiten.filter((e) => e.b === duBert.id).length, STARTAUFSTELLUNG.length);

  const raum = laufend.raeume.finden(du.code);
  assert.ok(raum.uhr, 'die Uhr des Raums laeuft wieder');
  assert.equal(raum.welt.vorbei, false);

  anna.zu();
  bert.zu();
});

// ---- Nur Sichtbares ueber die Leitung (kampf AC-13, Runde 110) -------------

test('kampf AC-13 / fahrplan AC-13: im Nebel bekommt jeder nur seine Einheiten und was er sieht - nicht die Vorraete der anderen', async () => {
  const anna = gastgeber();
  await anna.offen();
  anna.senden({ typ: 'erstellen', name: 'Anna' });
  const du = await anna.warteAuf(istTyp('du'));
  const bert = kunde();
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  const duBert = await bert.warteAuf(istTyp('du'));
  anna.senden({ typ: 'start', startwert: 7 });
  const aufbau = await anna.warteAuf(istTyp('aufbau'));
  // Im Aufbau nur das eigene Dorfzentrum - Berts steht weit weg im Nebel.
  assert.ok(aufbau.gebaeude.some((g) => g.b === du.id), 'das eigene Dorfzentrum');
  assert.ok(!aufbau.gebaeude.some((g) => g.b === duBert.id), 'Berts nicht');
  const zustand = await anna.warteAuf(istTyp('zustand'));
  assert.equal(zustand.einheiten.filter((e) => e.b === du.id).length, STARTAUFSTELLUNG.length, 'die eigenen');
  assert.equal(zustand.einheiten.filter((e) => e.b === duBert.id).length, 0, 'keine von Bert');
  const berts = zustand.spieler.find((s) => s.id === duBert.id);
  assert.ok(berts, 'Bert steht in der Liste - dass es ihn gibt, ist kein Geheimnis');
  assert.equal(berts.holz, undefined, 'aber nicht sein Vorrat');
  assert.equal(zustand.spieler.find((s) => s.id === du.id).holz, 200, 'der eigene schon');

  // Gegenprobe: ein Mann Berts neben Annas Dorf - jetzt sieht sie ihn.
  const welt = laufend.raeume.finden(du.code).welt;
  const basis = welt.spielerVon(du.id).basis;
  const nah = welt.einheitAnlegen(duBert.id, basis.x + 3, basis.y + 3, 'miliz');
  const gesehen = await anna.warteAuf((n) => n.typ === 'zustand' && n.einheiten.some((e) => e.i === nah.id), 3000);
  assert.ok(gesehen, 'in Sicht: er kommt an');
  // Und Bert sieht ihn als seinen - die Filter gelten je Spieler.
  await bert.warteAuf((n) => n.typ === 'zustand' && n.einheiten.some((e) => e.i === nah.id), 3000);
  anna.zu();
  bert.zu();
});

test('spielziel AC-19: im Nebel bekommt Anna ueber die Leitung, was ihr Verbuendeter Cem sieht - Bert nicht', async () => {
  const anna = gastgeber();
  await anna.offen();
  anna.senden({ typ: 'erstellen', name: 'Anna' });
  const du = await anna.warteAuf(istTyp('du'));
  const gaeste = [];
  for (const name of ['Bert', 'Cem']) {
    const k = kunde();
    await k.offen();
    k.senden({ typ: 'beitreten', code: du.code, name });
    gaeste.push([k, await k.warteAuf(istTyp('du'))]);
  }
  const [[bert, duBert], [cem, duCem]] = gaeste;
  // Anna und Cem in Team 1, Bert in Team 2 - der Gastgeber setzt alle
  // (auswahl AC-22).
  for (const [platz, team] of [[du.id, 1], [duBert.id, 2], [duCem.id, 1]]) {
    anna.senden({ typ: 'platz', platz, wahl: { team } });
  }
  await anna.warteAuf((n) => n.typ === 'raum' && n.plaetze?.every((p) => p.wahl.team === (p.platz === duBert.id ? 2 : 1)));
  anna.senden({ typ: 'start', startwert: 7 });

  // Im Aufbau: Annas und Cems Dorfzentrum, nicht Berts - die Doerfer stehen
  // weit auseinander, und keiner sieht zu Beginn ein anderes.
  const aufbau = await anna.warteAuf(istTyp('aufbau'));
  assert.ok(aufbau.gebaeude.some((g) => g.b === du.id && g.art === 'dorfzentrum'), 'das eigene');
  assert.ok(aufbau.gebaeude.some((g) => g.b === duCem.id && g.art === 'dorfzentrum'), 'Cems');
  assert.ok(!aufbau.gebaeude.some((g) => g.b === duBert.id), 'Berts nicht');
  const zustand = await anna.warteAuf(istTyp('zustand'));
  assert.equal(zustand.einheiten.filter((e) => e.b === duCem.id).length, STARTAUFSTELLUNG.length, 'Cems Einheiten');
  assert.equal(zustand.einheiten.filter((e) => e.b === duBert.id).length, 0, 'keine von Bert');
  // Bert bekommt keine von beiden.
  const beiBert = await bert.warteAuf(istTyp('zustand'));
  assert.equal(beiBert.einheiten.filter((e) => e.b !== duBert.id).length, 0, 'Bert sieht nur seine');

  // Ein Mann Berts neben Cems Dorf: Anna bekommt ihn, obwohl er weit von ihr steht.
  const welt = laufend.raeume.finden(du.code).welt;
  const basis = welt.spielerVon(duCem.id).basis;
  const nah = welt.einheitAnlegen(duBert.id, basis.x + 3, basis.y + 3, 'miliz');
  const annasBasis = welt.spielerVon(du.id).basis;
  assert.ok(Math.hypot(basis.x - annasBasis.x, basis.y - annasBasis.y) > 20, 'weit weg von Annas Dorf');
  assert.ok(await anna.warteAuf((n) => n.typ === 'zustand' && n.einheiten.some((e) => e.i === nah.id), 3000), 'bei Anna');
  assert.ok(await cem.warteAuf((n) => n.typ === 'zustand' && n.einheiten.some((e) => e.i === nah.id), 3000), 'bei Cem');
  anna.zu();
  bert.zu();
  cem.zu();
});

// ---- Anhalten und Fortsetzen (speichern AC-19 bis AC-21) -------------------

// Wartet auf eine Nachricht, die erst nach diesem Aufruf eintrifft - `warteAuf`
// allein faende die Pause von vorhin.
function danach(wer, passt, frist) {
  const ab = wer.eingang.length;
  return wer.warteAuf((n) => wer.eingang.indexOf(n) >= ab && passt(n), frist);
}
const pauseVon = (name) => (n) => n.typ === 'pause' && n.name === name;

async function partieZuZweit() {
  const anna = gastgeber();
  await anna.offen();
  anna.senden({ typ: 'erstellen', name: 'Anna', einstellungen: { sicht: 'aufgedeckt' } });
  const du = await anna.warteAuf(istTyp('du'));
  const bert = kunde();
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  const duBert = await bert.warteAuf(istTyp('du'));
  anna.senden({ typ: 'start', startwert: 7 });
  await bert.warteAuf(istTyp('aufbau'));
  await bert.warteAuf((n) => n.typ === 'zustand' && n.t >= 3);
  return { anna, bert, du, duBert, raum: laufend.raeume.finden(du.code) };
}

test('speichern AC-19: Pause haelt die Uhr an - die Welt taktet nicht, Befehle werden verworfen, alle erfahren, wer angehalten hat', async () => {
  const { anna, bert, du, duBert, raum } = await partieZuZweit();

  const beiAnna = danach(anna, istTyp('pause'));
  const beiBert = danach(bert, istTyp('pause'));
  anna.senden({ typ: 'pause' });
  assert.equal((await beiAnna).name, 'Anna');
  const gesehen = await beiBert;
  assert.equal(gesehen.name, 'Anna', 'auch Bert erfaehrt, wer angehalten hat');
  assert.equal(gesehen.von, du.id);

  const takt = raum.welt.takt;
  const bilder = bert.eingang.filter(istTyp('zustand')).length;
  // Ein Befehl in der Pause: Bert gibt auf. Verworfen, nicht aufgehoben -
  // sonst waere die Partie mit dem Fortsetzen zu Ende.
  bert.senden({ typ: 'befehl', auftrag: 'aufgeben' });
  // Eine halbe Sekunde waeren fuenf Takte.
  await warte(500);
  assert.equal(raum.welt.takt, takt, 'die Welt taktet nicht');
  assert.equal(bert.eingang.filter(istTyp('zustand')).length, bilder, 'es kommt kein neues Bild');

  // Wer in die angehaltene Partie zurueckkommt, sieht, dass sie steht.
  bert.zu();
  await bert.zuende();
  const zurueck = kunde();
  await zurueck.offen();
  zurueck.senden({ typ: 'zurueck', code: du.code, token: duBert.token });
  assert.equal((await zurueck.warteAuf(istTyp('pause'))).name, 'Anna');

  const weiter = danach(zurueck, pauseVon(null));
  anna.senden({ typ: 'weiter' });
  await weiter;
  await danach(zurueck, (n) => n.typ === 'zustand' && n.t >= takt + 5);
  assert.ok(!raum.welt.vorbei, 'der Befehl aus der Pause ist verworfen: niemand hat aufgegeben');
  anna.zu();
  zurueck.zu();
});

test('speichern AC-21: fortsetzen kann jeder - auch wer nicht angehalten hat, und nichts wird nachgeholt', async () => {
  const { anna, bert, raum } = await partieZuZweit();
  const an = danach(bert, pauseVon('Anna'));
  anna.senden({ typ: 'pause' });
  await an;
  const takt = raum.welt.takt;
  await warte(600);

  const beiAnna = danach(anna, pauseVon(null));
  const erstes = danach(anna, istTyp('zustand'));
  bert.senden({ typ: 'weiter' });
  await beiAnna;
  const bild = await erstes;
  // Sechs Zehntel waren es - nachgeholt waeren sechs Takte.
  assert.ok(bild.t - takt <= 3, `es geht weiter, wo es stand: Takt ${bild.t} nach ${takt}`);
  await danach(anna, (n) => n.typ === 'zustand' && n.t >= bild.t + 5);
  anna.zu();
  bert.zu();
});

test('speichern AC-20: Anhalten ist begrenzt - nach der Frist geht es von selbst weiter, zweimal je Spieler; allein gilt keine Grenze', async () => {
  const { anna, bert, raum } = await partieZuZweit();

  // Die Frist: fuenf Minuten, hier auf drei Zehntel gestellt.
  let an = danach(bert, pauseVon('Anna'));
  anna.senden({ typ: 'pause' });
  assert.ok((await an).rest > 290, 'fuenf Minuten sind die Vorgabe');
  let weiter = danach(anna, pauseVon(null));
  // Auch Bert muss das Ende dieser Pause gelesen haben, bevor auf das Ende
  // der naechsten gewartet wird - sonst gilt die Nachricht von eben als die
  // erwartete, und die Frist scheint vor der Zeit um.
  const beiBert = danach(bert, pauseVon(null));
  bert.senden({ typ: 'weiter' });
  await weiter;
  await beiBert;

  raum.pauseMs = 300;
  an = danach(bert, pauseVon('Anna'));
  weiter = danach(bert, pauseVon(null), 3000);
  const dann = Date.now();
  anna.senden({ typ: 'pause' });
  assert.equal((await an).rest, 1, 'der Rest steht in der Nachricht, auf Sekunden aufgerundet');
  await weiter;
  assert.ok(Date.now() - dann >= 280, 'nicht vor der Frist');
  await danach(bert, istTyp('zustand'));
  assert.equal(raum.pause, null);

  // Zweimal hat Anna angehalten - das dritte Mal weist der Server ab.
  const nein = danach(anna, istTyp('fehler'));
  anna.senden({ typ: 'pause' });
  assert.equal((await nein).text, 'Du hast schon zweimal angehalten.');
  assert.equal(raum.pause, null, 'die Partie laeuft weiter');
  // Bert hat seine eigenen zwei.
  an = danach(anna, pauseVon('Bert'));
  bert.senden({ typ: 'pause' });
  await an;
  // Und waehrend sie steht, haelt niemand ein zweites Mal an.
  const schon = danach(bert, istTyp('fehler'));
  bert.senden({ typ: 'pause' });
  assert.equal((await schon).text, 'Die Partie ist schon angehalten.');
  anna.zu();
  bert.zu();

  // Allein gegen den Computer: so oft und so lange, wie man will.
  const cem = gastgeber();
  await cem.offen();
  // Wer eroeffnet, heisst wie sein Konto - der getippte Name zaehlt nicht.
  cem.senden({ typ: 'erstellen', name: 'Cem', einstellungen: { ki: 1, sicht: 'aufgedeckt' } });
  const duCem = await cem.warteAuf(istTyp('du'));
  cem.senden({ typ: 'start', startwert: 7 });
  await cem.warteAuf((n) => n.typ === 'zustand' && n.t >= 2);
  for (let i = 0; i < 3; i++) {
    const steht = danach(cem, pauseVon('Anna'));
    cem.senden({ typ: 'pause' });
    assert.equal((await steht).rest, null, `Pause ${i + 1} allein: ohne Frist`);
    const laeuft = danach(cem, pauseVon(null));
    cem.senden({ typ: 'weiter' });
    await laeuft;
  }
  // Und wer allein angehalten hat und am Tisch bleibt, wird nicht abgeraeumt.
  cem.senden({ typ: 'pause' });
  await danach(cem, pauseVon('Anna'));
  const solo = laufend.raeume.finden(duCem.code);
  solo.beruehrt = Date.now() - 31 * 60 * 1000;
  laufend.raeume.aufraeumen();
  assert.ok(laufend.raeume.finden(duCem.code), 'die angehaltene Partie steht noch');
  cem.zu();
});

// ---- Dateien nur einmal uebertragen (darstellung AC-25) ---------------------

test('darstellung AC-25: jede Datei traegt eine Marke aus ihrem Inhalt - wer sie nennt, bekommt "unveraendert" ohne Inhalt', async () => {
  const basis = `http://localhost:${HAFEN}`;
  for (const pfad of ['/bilder/boden.webp', '/bilder/dorfbewohner.json', '/ansicht.js', '/']) {
    const erste = await fetch(basis + pfad);
    assert.equal(erste.status, 200, pfad);
    const marke = erste.headers.get('etag');
    assert.match(marke, /^"[\w-]{20,}"$/, `${pfad}: eine Marke in Anfuehrungszeichen`);
    assert.equal(erste.headers.get('cache-control'), 'no-cache', `${pfad}: der Browser fragt jedes Mal nach`);
    const groesse = (await erste.arrayBuffer()).byteLength;
    assert.ok(groesse > 0);

    const zweite = await fetch(basis + pfad, { headers: { 'If-None-Match': marke } });
    assert.equal(zweite.status, 304, `${pfad}: unveraendert`);
    assert.equal((await zweite.arrayBuffer()).byteLength, 0, `${pfad}: ohne Inhalt`);
    assert.equal(zweite.headers.get('etag'), marke);

    // Eine andere Marke - etwa die von vor dem letzten Ausrollen - bekommt die Datei.
    const dritte = await fetch(basis + pfad, { headers: { 'If-None-Match': '"veraltet"' } });
    assert.equal(dritte.status, 200, `${pfad}: mit alter Marke die ganze Datei`);
    assert.equal((await dritte.arrayBuffer()).byteLength, groesse);
    assert.equal(dritte.headers.get('etag'), marke, `${pfad}: dieselbe Datei, dieselbe Marke`);
  }
  // Zwei verschiedene Dateien haben verschiedene Marken.
  const a = (await fetch(`${basis}/bilder/boden.webp`)).headers.get('etag');
  const b = (await fetch(`${basis}/bilder/baum.webp`)).headers.get('etag');
  assert.notEqual(a, b);
  // Und was es nicht gibt, bleibt 404 - auch ein Ordner.
  assert.equal((await fetch(`${basis}/bilder/gibt-es-nicht.webp`)).status, 404);
  assert.equal((await fetch(`${basis}/bilder/`)).status, 404);
});
