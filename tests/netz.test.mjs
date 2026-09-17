// Prueft den echten Weg: HTTP-Server, WebSocket, Raum, Simulation.
// Keine direkten Aufrufe der Klassen - was hier gruen ist, geht auch im Browser.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import WebSocket from 'ws';
import { kunde as kundeMit, istTyp, konto, beenden } from './hilfe.mjs';

const require = createRequire(import.meta.url);
const { starten } = require('../server/index.js');

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
  anna.senden({ typ: 'erstellen', name: 'Anna' });
  const du = await anna.warteAuf(istTyp('du'));

  const bert = kunde();
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  await bert.warteAuf(istTyp('du'));

  anna.senden({ typ: 'start', startwert: 7 });
  const aufbau = await bert.warteAuf(istTyp('aufbau'));
  assert.equal(aufbau.karte.groesse, 120); // zwei Spieler (karte AC-11)
  assert.equal(aufbau.spieler.length, 2);

  const zustand = await bert.warteAuf((n) => n.typ === 'zustand' && n.t >= 3);
  assert.equal(zustand.einheiten.length, 10); // 5 Sammler je Spieler
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
  anna.senden({ typ: 'erstellen', name: 'Anna' });
  const du = await anna.warteAuf(istTyp('du'));

  const bert = kunde();
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  const duBert = await bert.warteAuf(istTyp('du'));

  anna.senden({ typ: 'start', startwert: 7 });
  await anna.warteAuf(istTyp('aufbau'));
  const zustand = await anna.warteAuf(istTyp('zustand'));
  const meines = zustand.gebaeude.find((g) => g.b === du.id && g.art === 'dorfzentrum');
  const fremdes = zustand.gebaeude.find((g) => g.b === duBert.id);
  assert.ok(meines && fremdes, 'jeder hat ein Dorfzentrum im Zustand');

  const nahrung = (n) => n.spieler.find((s) => s.id === du.id).nahrung;
  anna.senden({ typ: 'befehl', auftrag: 'ausbilden', gebaeude: meines.i, einheit: 'dorfbewohner' });
  anna.senden({ typ: 'befehl', auftrag: 'ausbilden', gebaeude: meines.i, einheit: 'dorfbewohner' });
  const eingereiht = await anna.warteAuf(
    (n) => n.typ === 'zustand' && n.gebaeude.find((g) => g.i === meines.i).s.length === 2,
  );
  assert.equal(nahrung(eingereiht), nahrung(zustand) - 100);
  // Fuenf Dorfbewohner, fuenf Plaetze: der Auftrag wartet.
  assert.equal(eingereiht.gebaeude.find((g) => g.i === meines.i).w, true);

  anna.senden({ typ: 'befehl', auftrag: 'abbrechen', gebaeude: meines.i, platz: 0 });
  const abgebrochen = await anna.warteAuf(
    (n) => n.typ === 'zustand' && n.gebaeude.find((g) => g.i === meines.i).s.length === 1,
  );
  assert.equal(nahrung(abgebrochen), nahrung(zustand) - 50);

  anna.senden({ typ: 'befehl', auftrag: 'ausbilden', gebaeude: fremdes.i, einheit: 'dorfbewohner' });
  const absage = await anna.warteAuf(istTyp('fehler'));
  assert.match(absage.text, /nicht dein Gebaeude/);

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
