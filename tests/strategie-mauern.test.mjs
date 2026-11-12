// Mauern (bauen AC-30) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md). Die Oberflaeche dazu:
// e2e/tests/strategie-mauern.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE, mauerLinie, MAUER_MAX } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE } = require('../server/spiele/strategie/daten.js');
const karten = require('../server/spiele/strategie/karte.js');
const { suchen } = require('../server/spiele/strategie/wege.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

/**
 * Eine Welt in der Feudalzeit mit einem freien Stueck Gras in der Kartenmitte,
 * `breite` mal `hoehe` Felder - weit weg von beiden Doerfern. Frei heisst, was
 * `platzPruefen` sagt, keine eigene Regel.
 */
function feudalMitPlatz(breite = 12, hoehe = 12) {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  const spieler = welt.spielerVon('a');
  spieler.zeitalter = 1;
  spieler.stein = 1000;
  const mitte = Math.floor(welt.karte.groesse / 2);
  for (let r = 0; r < 30; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const x0 = mitte + dx;
        const y0 = mitte + dy;
        let frei = true;
        for (let y = y0; y < y0 + hoehe && frei; y++) for (let x = x0; x < x0 + breite && frei; x++) frei = welt.platzPruefen('steinmauer', x, y);
        if (frei) return { welt, spieler, x0, y0, bauer: welt.einheitAnlegen('a', x0, y0 + hoehe - 1, 'dorfbewohner') };
      }
    }
  }
  throw new Error('kein freier Platz in der Mitte');
}

function sekunden(welt, s) {
  for (let t = 0; t < Math.round(s * TAKTE_PRO_SEKUNDE); t++) welt.takten();
}

test('bauen AC-30: die Steinmauer mit den Werten der Vorlage - gezogen, ab der Feudalzeit', () => {
  const m = GEBAEUDE.steinmauer;
  assert.deepEqual(m.kosten, { stein: 5 }, 'je Feld');
  assert.equal(m.bauzeit, 8);
  assert.equal(m.leben, 1800);
  assert.equal(m.groesse, 1);
  assert.equal(m.zeitalter, 1);
  assert.equal(m.gezogen, true);
  assert.ok(EINHEITEN.dorfbewohner.baut.includes('steinmauer'));
  // Sie haelt niemanden im Spiel und zaehlt nicht zum Aufstieg - wie in der Vorlage.
  assert.equal(m.bestand, false);
  assert.equal(m.zumAufstieg, false);
});

test('bauen AC-30: die Linie geht von Feld zu Nachbarfeld, gerade und schraeg, in der Reihenfolge des Ziehens', () => {
  assert.deepEqual(mauerLinie({ x: 2, y: 5 }, { x: 6, y: 5 }).map((f) => f.x), [2, 3, 4, 5, 6]);
  assert.deepEqual(mauerLinie({ x: 6, y: 5 }, { x: 2, y: 5 }).map((f) => f.x), [6, 5, 4, 3, 2], 'rueckwaerts gezogen');
  assert.deepEqual(mauerLinie({ x: 3, y: 3 }, { x: 3, y: 3 }), [{ x: 3, y: 3 }], 'ein Klick ist ein Feld');
  for (const bis of [{ x: 13, y: 4 }, { x: 4, y: 13 }, { x: 10, y: 10 }, { x: -3, y: 8 }, { x: 7, y: -9 }]) {
    const linie = mauerLinie({ x: 0, y: 0 }, bis);
    assert.deepEqual(linie[0], { x: 0, y: 0 });
    assert.deepEqual(linie.at(-1), bis);
    for (let i = 1; i < linie.length; i++) {
      const schritt = Math.max(Math.abs(linie[i].x - linie[i - 1].x), Math.abs(linie[i].y - linie[i - 1].y));
      assert.equal(schritt, 1, `jeder Schritt ein Nachbarfeld (${JSON.stringify(bis)}, Schritt ${i})`);
    }
  }
  assert.equal(mauerLinie({ x: 0, y: 0 }, { x: MAUER_MAX - 1, y: 0 }).length, MAUER_MAX);
  assert.equal(mauerLinie({ x: 0, y: 0 }, { x: MAUER_MAX, y: 0 }), null, 'zu lang');
  assert.equal(mauerLinie({ x: 'a', y: 0 }, { x: 1, y: 0 }), null);
});

test('bauen AC-30: gezogen entsteht je Feld eine Baustelle, bezahlt je Feld', () => {
  const { welt, spieler, x0, y0, bauer } = feudalMitPlatz();
  const vorher = spieler.stein;
  const antwort = welt.nachricht('a', { auftrag: 'mauer', einheiten: [bauer.id], art: 'steinmauer', von: { x: x0 + 1, y: y0 + 2 }, bis: { x: x0 + 8, y: y0 + 2 } });
  assert.equal(antwort.fehler, undefined);
  assert.equal(antwort.gebaeude.length, 8);
  assert.equal(spieler.stein, vorher - 8 * 5);
  const lagen = antwort.gebaeude.map((id) => welt.gebaeude.get(id)).map((g) => [g.art, g.x, g.y, g.fertig]);
  assert.deepEqual(lagen, Array.from({ length: 8 }, (_, i) => ['steinmauer', x0 + 1 + i, y0 + 2, false]));
});

test('bauen AC-30: was nicht frei ist, wird uebersprungen - und nicht bezahlt', () => {
  const { welt, spieler, x0, y0, bauer } = feudalMitPlatz();
  // Ein Haus (zwei mal zwei) mitten in der Linie.
  welt.gebaeudeAnlegen('a', 'haus', x0 + 5, y0 + 5, true);
  const vorher = spieler.stein;
  const antwort = welt.nachricht('a', { auftrag: 'mauer', einheiten: [bauer.id], art: 'steinmauer', von: { x: x0 + 1, y: y0 + 5 }, bis: { x: x0 + 9, y: y0 + 5 } });
  assert.equal(antwort.uebersprungen, 2, 'die zwei Felder des Hauses');
  assert.equal(antwort.gebaeude.length, 7);
  assert.equal(spieler.stein, vorher - 7 * 5);
  const xe = antwort.gebaeude.map((id) => welt.gebaeude.get(id).x);
  assert.ok(!xe.includes(x0 + 4) && !xe.includes(x0 + 5), `${xe}`);
  // Gegenprobe: ganz zugebaut gibt es nichts und kostet nichts.
  const zu = welt.nachricht('a', { auftrag: 'mauer', einheiten: [bauer.id], art: 'steinmauer', von: { x: x0 + 4, y: y0 + 5 }, bis: { x: x0 + 5, y: y0 + 4 } });
  assert.equal(zu.fehler, 'Hier ist kein Platz.');
});

test('bauen AC-30: reicht der Stein nicht, endet die Linie dort - ohne Stein eine Absage', () => {
  const { welt, spieler, x0, y0, bauer } = feudalMitPlatz();
  spieler.stein = 12;
  const antwort = welt.nachricht('a', { auftrag: 'mauer', einheiten: [bauer.id], art: 'steinmauer', von: { x: x0 + 1, y: y0 + 1 }, bis: { x: x0 + 6, y: y0 + 1 } });
  assert.equal(antwort.gebaeude.length, 2, '12 Stein reichen fuer zwei Felder');
  assert.equal(antwort.zuWenig, true);
  assert.equal(spieler.stein, 2);
  const ohne = welt.nachricht('a', { auftrag: 'mauer', einheiten: [bauer.id], art: 'steinmauer', von: { x: x0 + 1, y: y0 + 3 }, bis: { x: x0 + 6, y: y0 + 3 } });
  assert.equal(ohne.fehler, 'Zu wenig Stein.');
});

test('bauen AC-30: in der Dunklen Zeit gibt es keine Mauer, und ein Haus laesst sich nicht ziehen', () => {
  const { welt, spieler, x0, y0, bauer } = feudalMitPlatz();
  spieler.zeitalter = 0;
  const dunkel = welt.nachricht('a', { auftrag: 'mauer', einheiten: [bauer.id], art: 'steinmauer', von: { x: x0, y: y0 }, bis: { x: x0 + 3, y: y0 } });
  assert.equal(dunkel.fehler, 'Die Steinmauer gibt es erst ab dem Lehen.');
  const haus = welt.nachricht('a', { auftrag: 'mauer', einheiten: [bauer.id], art: 'haus', von: { x: x0, y: y0 }, bis: { x: x0 + 3, y: y0 } });
  assert.equal(haus.fehler, 'Das lässt sich nicht ziehen.');
  // Fremde Dorfbewohner ziehen nichts.
  spieler.zeitalter = 1;
  const fremd = welt.nachricht('b', { auftrag: 'mauer', einheiten: [bauer.id], art: 'steinmauer', von: { x: x0, y: y0 }, bis: { x: x0 + 3, y: y0 } });
  assert.equal(fremd.fehler, 'Niemand in der Auswahl kann das bauen.');
});

test('bauen AC-30: ein Dorfbewohner baut die Linie Feld fuer Feld, danach sperrt sie - auch schraeg', () => {
  const { welt, x0, y0, bauer } = feudalMitPlatz();
  // Schraeg von links oben nach rechts unten quer durch das freie Stueck.
  const antwort = welt.nachricht('a', { auftrag: 'mauer', einheiten: [bauer.id], art: 'steinmauer', von: { x: x0 + 2, y: y0 + 1 }, bis: { x: x0 + 7, y: y0 + 6 } });
  assert.equal(antwort.gebaeude.length, 6);
  // Ein Feld braucht allein 3 * 8 / 3 = 8 s, dazu die Wege - sechs Felder in 80 s.
  sekunden(welt, 80);
  const fertig = antwort.gebaeude.filter((id) => welt.gebaeude.get(id).fertig).length;
  assert.equal(fertig, 6, 'alle sechs Felder von einem gebaut');
  assert.equal(bauer.auftrag, null, 'danach steht er bereit');
  // Die Mauer sperrt: von einer Seite zur anderen fuehrt kein Weg durch sie.
  const g = welt.karte.groesse;
  const mauer = new Set(antwort.gebaeude.map((id) => welt.gebaeude.get(id)).map((m) => m.y * g + m.x));
  for (const i of mauer) assert.equal(welt.karte.felder[i], karten.BEBAUT, `Feld ${i}`);
  const weg = suchen(welt.karte, { x: x0 + 2, y: y0 + 3 }, { x: x0 + 6, y: y0 + 2 });
  assert.ok(weg.length > 0, 'aussen herum gibt es einen Weg');
  let vorher = { x: x0 + 2, y: y0 + 3 };
  for (const schritt of weg) {
    assert.ok(!mauer.has(schritt.y * g + schritt.x), 'kein Schritt auf die Mauer');
    // Schraeg nur, wenn beide geraden Nachbarn frei sind - sonst ginge er durch die Fuge.
    if (schritt.x !== vorher.x && schritt.y !== vorher.y) {
      assert.ok(!mauer.has(vorher.y * g + schritt.x) && !mauer.has(schritt.y * g + vorher.x), 'nicht durch die Fuge');
    }
    vorher = schritt;
  }
  // Die gerade Strecke waere vier Felder; aussen herum ist es weiter.
  assert.ok(weg.length > 4, `${weg.length} Schritte`);
});

test('bauen AC-30: Mauern zaehlen nicht zum Aufstieg und halten niemanden im Spiel', () => {
  const { welt, spieler, x0, y0, bauer } = feudalMitPlatz();
  const zahl = welt.gebaeudeDerZeit(spieler);
  welt.gebaeudeAnlegen('a', 'steinmauer', x0 + 1, y0 + 1, true);
  welt.gebaeudeAnlegen('a', 'steinmauer', x0 + 2, y0 + 1, true);
  assert.equal(welt.gebaeudeDerZeit(spieler), zahl, 'zwei Mauerfelder sind nicht die Ritterzeit');
  // Gegenprobe: eine Schmiede zaehlt.
  welt.gebaeudeAnlegen('a', 'schmiede', x0 + 6, y0 + 6, true);
  assert.equal(welt.gebaeudeDerZeit(spieler), zahl + 1);
  // Wer nur noch Mauern hat, ist nicht mehr im Bestand.
  for (const e of [...welt.einheiten.values()]) if (e.besitzer === 'a') welt.einheiten.delete(e.id);
  for (const g of [...welt.gebaeude.values()]) if (g.besitzer === 'a' && g.art !== 'steinmauer') welt.gebaeude.delete(g.id);
  assert.equal(welt.imBestand('a'), false);
  assert.ok(bauer);
});

test('bauen AC-30: faellt das Feld, an dem gebaut wird, geht der Bauer zum naechsten - die Linie bleibt nicht liegen', () => {
  // Durchsicht in Runde 127: abgerissen oder zerstoert, verlor der Bauer die
  // ganze Folge, und die uebrigen bezahlten Felder blieben liegen.
  const { welt, x0, y0, bauer } = feudalMitPlatz();
  const antwort = welt.nachricht('a', { auftrag: 'mauer', einheiten: [bauer.id], art: 'steinmauer', von: { x: x0 + 1, y: y0 + 3 }, bis: { x: x0 + 5, y: y0 + 3 } });
  assert.equal(antwort.gebaeude.length, 5);
  const [erstes, ...rest] = antwort.gebaeude;
  assert.equal(welt.nachricht('a', { auftrag: 'abreissen', gebaeude: erstes }).fehler, undefined);
  assert.equal(bauer.auftrag?.gebaeude, rest[0], 'gleich zum naechsten Feld');
  sekunden(welt, 70);
  assert.deepEqual(rest.map((id) => welt.gebaeude.get(id)?.fertig), [true, true, true, true]);
});

// ---- Tore (bauen AC-31) ---------------------------------------------------------

/**
 * Ein geschlossener Ring aus fertiger Mauer um die Mitte des freien Platzes:
 * von x0 + 2 bis x0 + 8, ebenso in y. Innen ist (x0 + 5, y0 + 5), aussen
 * (x0 + 5, y0). Das Tor kommt auf das Feld oben in der Mitte.
 */
function mauerring(welt, besitzer, x0, y0) {
  for (let i = 2; i <= 8; i++) {
    for (const [x, y] of [[x0 + i, y0 + 2], [x0 + i, y0 + 8], [x0 + 2, y0 + i], [x0 + 8, y0 + i]]) {
      if (!welt.gebaeudeAn(x, y)) welt.gebaeudeAnlegen(besitzer, 'steinmauer', x, y, true);
    }
  }
  return { innen: { x: x0 + 5, y: y0 + 5 }, aussen: { x: x0 + 5, y: y0 }, torfeld: { x: x0 + 5, y: y0 + 2 } };
}

test('bauen AC-31: das Tor mit den Werten der Vorlage - ab der Feudalzeit, ein Feld', () => {
  const t = GEBAEUDE.tor;
  assert.deepEqual(t.kosten, { stein: 30 });
  assert.equal(t.bauzeit, 70);
  assert.equal(t.leben, 2750);
  assert.equal(t.zeitalter, 1);
  assert.equal(t.groesse, 1, 'ein Feld statt vier - begruendet in den Daten');
  assert.equal(t.tor, true);
  assert.equal(t.ersetzt, 'steinmauer');
  assert.ok(EINHEITEN.dorfbewohner.baut.includes('tor'));
  assert.equal(t.bestand, false);
  assert.equal(t.zumAufstieg, false);
});

test('bauen AC-31: ein Tor im Mauerring laesst Annas Dorfbewohner hinaus und Berts nicht hinein', () => {
  const { welt, spieler, x0, y0, bauer } = feudalMitPlatz();
  const { innen, aussen, torfeld } = mauerring(welt, 'a', x0, y0);
  const anna = welt.einheitAnlegen('a', innen.x, innen.y, 'dorfbewohner');
  const bert = welt.einheitAnlegen('b', x0, y0 + 1, 'dorfbewohner');

  // Gegenprobe: ohne Tor ist der Ring zu - auch fuer Anna.
  welt.befehl('a', [anna.id], aussen);
  assert.deepEqual(anna.weg, [], 'ohne Tor kein Weg hinaus');

  // Das Tor auf das Mauerfeld: es ersetzt die Mauer dort, ohne Erstattung.
  const mauer = welt.gebaeudeAn(torfeld.x, torfeld.y);
  assert.equal(mauer.art, 'steinmauer');
  const steinVorher = spieler.stein;
  const antwort = welt.nachricht('a', { auftrag: 'bauen', einheiten: [bauer.id], art: 'tor', ziel: torfeld });
  assert.equal(antwort.fehler, undefined);
  assert.equal(welt.gebaeude.has(mauer.id), false, 'das Mauerfeld ist ersetzt');
  assert.equal(welt.gebaeudeAn(torfeld.x, torfeld.y).art, 'tor');
  assert.equal(spieler.stein, steinVorher - 30);
  // Siebzig Sekunden fuer einen Bauer, dazu der Weg: er geht durch die eigene
  // Torbaustelle und baut von innen, gemessen 17 Felder, rund 21 Sekunden.
  sekunden(welt, 100);
  assert.equal(welt.gebaeude.get(antwort.gebaeude).fertig, true, 'ein Bauer braucht 70 Sekunden und den Weg');

  // Anna geht durch das Tor hinaus.
  welt.befehl('a', [anna.id], aussen);
  assert.ok(anna.weg.some((f) => f.x === torfeld.x && f.y === torfeld.y), 'der Weg fuehrt durch das Tor');
  sekunden(welt, 15);
  assert.deepEqual(welt.feldVon(anna), aussen, 'Anna steht draussen');

  // Bert kommt nicht hinein: fuer ihn ist das Tor eine Mauer.
  welt.befehl('b', [bert.id], innen);
  assert.deepEqual(bert.weg, [], 'fuer Bert kein Weg in den Ring');
  sekunden(welt, 10);
  const feld = welt.feldVon(bert);
  assert.ok(feld.x < x0 + 2 || feld.y < y0 + 2, 'Bert steht weiter draussen');
});

test('bauen AC-31: ein Tor geht in eine Luecke oder auf die eigene Mauer - nicht auf fremde, nicht vor der Feudalzeit', () => {
  const { welt, spieler, x0, y0, bauer } = feudalMitPlatz();
  welt.gebaeudeAnlegen('b', 'steinmauer', x0 + 3, y0 + 3, true);
  const fremd = welt.nachricht('a', { auftrag: 'bauen', einheiten: [bauer.id], art: 'tor', ziel: { x: x0 + 3, y: y0 + 3 } });
  assert.equal(fremd.fehler, 'Hier ist kein Platz.', 'Berts Mauer bleibt Berts');
  // Ein Haus ist keine Mauer: auch das eigene wird nicht ersetzt.
  welt.gebaeudeAnlegen('a', 'haus', x0 + 7, y0 + 7, true);
  assert.equal(welt.nachricht('a', { auftrag: 'bauen', einheiten: [bauer.id], art: 'tor', ziel: { x: x0 + 7, y: y0 + 7 } }).fehler, 'Hier ist kein Platz.');
  // In eine Luecke auf Gras geht es.
  assert.equal(welt.nachricht('a', { auftrag: 'bauen', einheiten: [bauer.id], art: 'tor', ziel: { x: x0 + 1, y: y0 + 1 } }).fehler, undefined);
  // Und vor der Feudalzeit gar nicht.
  spieler.zeitalter = 0;
  assert.match(welt.nachricht('a', { auftrag: 'bauen', einheiten: [bauer.id], art: 'tor', ziel: { x: x0 + 9, y: y0 + 9 } }).fehler, /erst ab dem Lehen/);
});

test('bauen AC-31: faellt das Tor, ist die Luecke fuer alle offen', () => {
  const { welt, x0, y0 } = feudalMitPlatz();
  const { innen, torfeld } = mauerring(welt, 'a', x0, y0);
  welt.gebaeudeZerstoeren(welt.gebaeudeAn(torfeld.x, torfeld.y));
  const tor = welt.gebaeudeAnlegen('a', 'tor', torfeld.x, torfeld.y, true);
  assert.ok(welt.toreVon('a').has(torfeld.y * welt.karte.groesse + torfeld.x));
  const bert = welt.einheitAnlegen('b', x0, y0 + 1, 'dorfbewohner');
  welt.befehl('b', [bert.id], innen);
  assert.deepEqual(bert.weg, [], 'solange das Tor steht, kein Weg');
  welt.gebaeudeZerstoeren(tor);
  assert.equal(welt.toreVon('a'), null, 'kein Tor mehr in der Liste');
  welt.befehl('b', [bert.id], innen);
  assert.ok(bert.weg.length > 0, 'durch die Luecke hinein');
});

test('bauen AC-31: liegt das naechste Randfeld hinter der Mauer, baut der Bauer von der Seite, die er erreicht', () => {
  // Runde 128: wer das letzte Feld eines Rings setzt, findet das naechste
  // Randfeld innen - ohne Weg dorthin gab er auf, und der Ring blieb offen.
  const { welt, x0, y0, bauer } = feudalMitPlatz();
  const { torfeld } = mauerring(welt, 'a', x0, y0);
  // Das Feld oben in der Mitte ist nur eine Baustelle - der Ring ist zu.
  welt.gebaeudeZerstoeren(welt.gebaeudeAn(torfeld.x, torfeld.y));
  const luecke = welt.gebaeudeAnlegen('a', 'steinmauer', torfeld.x, torfeld.y, false);
  const vorBauer = welt.randfeld(luecke, bauer);
  assert.ok(vorBauer.y > torfeld.y, 'das naechste Randfeld liegt innen');
  welt.befehl('a', [bauer.id], torfeld);
  assert.equal(bauer.auftrag?.art, 'bauen');
  assert.ok(bauer.weg.length > 0, 'ein Weg an die Aussenseite');
  assert.ok(bauer.weg.at(-1).y < torfeld.y, 'er endet draussen');
  sekunden(welt, 40);
  assert.equal(welt.gebaeude.get(luecke.id).fertig, true, 'der Ring ist geschlossen');
});

// Mauern halten auf (kampf AC-21): Berts Haus in Berts Mauerring, Annas
// Angreifer davor. `luecke` laesst ein Mauerfeld frei, als Versatz zu x0, y0.
function hausImRing(luecke = null) {
  const { welt, x0, y0 } = feudalMitPlatz();
  for (let i = 2; i <= 8; i++) {
    for (const [x, y] of [[x0 + i, y0 + 2], [x0 + i, y0 + 8], [x0 + 2, y0 + i], [x0 + 8, y0 + i]]) {
      if (luecke && x0 + luecke.dx === x && y0 + luecke.dy === y) continue;
      if (!welt.gebaeudeAn(x, y)) welt.gebaeudeAnlegen('b', 'steinmauer', x, y, true);
    }
  }
  const haus = welt.gebaeudeAnlegen('b', 'haus', x0 + 5, y0 + 5, true);
  const mauern = [...welt.gebaeude.values()].filter((g) => g.art === 'steinmauer');
  return { welt, x0, y0, haus, mauern };
}

test('kampf AC-21: gibt es einen Weg aussen herum, geht der Angreifer ihn - die Mauer bleibt heil', () => {
  // Die Luecke liegt auf der abgewandten Seite: der Weg dorthin ist laenger
  // als jeder Weg durch die Mauer, und trotzdem wird er gegangen.
  const { welt, x0, y0, haus, mauern } = hausImRing({ dx: 5, dy: 8 });
  const miliz = welt.einheitAnlegen('a', x0 + 5, y0, 'miliz');
  welt.befehl('a', [miliz.id], { x: haus.x, y: haus.y });
  assert.equal(miliz.auftrag?.ziel, haus.id);
  assert.ok(miliz.weg.length > 0, 'ein Weg durch die Luecke');
  const ziele = new Set();
  for (let t = 0; t < 40 * TAKTE_PRO_SEKUNDE; t++) {
    welt.takten();
    if (miliz.auftrag) ziele.add(miliz.auftrag.ziel);
  }
  assert.deepEqual([...ziele], [haus.id], 'nie eine Mauer als Ziel');
  assert.ok(haus.leben < GEBAEUDE.haus.leben, 'das Haus wird getroffen');
  assert.ok(mauern.every((m) => m.leben === GEBAEUDE.steinmauer.leben), 'keine Mauer beschaedigt');
});

test('kampf AC-21: ist der Ring zu, greift der Angreifer die Mauer an - und nach ihrem Fall das Haus dahinter', () => {
  // Eine Miliz braucht fuer 1800 Leben eine Viertelstunde (4 je zwei
  // Sekunden). Geprueft wird hier das Verhalten, nicht die Dauer: die
  // Mauern bekommen 20 Leben, das sind fuenf Schlaege.
  const { welt, x0, y0, haus, mauern } = hausImRing();
  for (const m of mauern) m.leben = 20;
  const miliz = welt.einheitAnlegen('a', x0 + 5, y0, 'miliz');
  welt.befehl('a', [miliz.id], { x: haus.x, y: haus.y });
  sekunden(welt, 1);
  const mauer = welt.gebaeude.get(miliz.auftrag?.ziel);
  assert.equal(mauer?.art, 'steinmauer', 'das Ziel ist jetzt ein Mauerfeld');
  assert.equal(mauer.besitzer, 'b');
  assert.equal(miliz.auftrag.danach.ziel, haus.id, 'das Haus bleibt gemerkt');
  // Das Feld zwischen ihm und dem Haus: auf der Seite, von der er kommt.
  assert.equal(mauer.y, y0 + 2, 'die Mauer auf seiner Seite');
  sekunden(welt, 20);
  assert.equal(welt.gebaeude.has(mauer.id), false, 'das Mauerfeld ist gefallen');
  assert.equal(miliz.auftrag?.ziel, haus.id, 'danach wieder das Haus');
  sekunden(welt, 20);
  assert.ok(haus.leben < GEBAEUDE.haus.leben, 'und das Haus wird getroffen');
  const stehen = [...welt.gebaeude.values()].filter((g) => g.art === 'steinmauer').length;
  assert.equal(stehen, mauern.length - 1, 'nur dieses eine Mauerfeld ist gefallen');
});

test('kampf AC-21: eigene Mauern bricht niemand - wer im eigenen Ring nicht hinauskommt, bleibt stehen', () => {
  // Gegenprobe zur Auswahl der Mauer: nur fremde Mauern und Tore zaehlen.
  const { welt, x0, y0, mauern } = hausImRing();
  const bert = welt.einheitAnlegen('b', x0 + 4, y0 + 4, 'miliz');
  const ziel = welt.einheitAnlegen('a', x0 + 5, y0, 'dorfbewohner');
  welt.befehl('b', [bert.id], { x: ziel.x, y: ziel.y });
  sekunden(welt, 5);
  assert.equal(bert.auftrag, null, 'der Auftrag endet');
  assert.ok(mauern.every((m) => m.leben === GEBAEUDE.steinmauer.leben), 'keine eigene Mauer beschaedigt');
});

test('kampf AC-21: eine Ramme bricht ein Feld Steinmauer mit fuenfzehn Stoessen, drei Rammen in unter einer halben Minute', () => {
  // Die Werte der Vorlage: 1800 Leben, 2 Angriff + 125 gegen Gebaeude, keine
  // Nahruestung der Mauer, alle fuenf Sekunden ein Stoss. 1800 / 127 heisst
  // fuenfzehn Stoesse, also 70 Sekunden fuer eine. Drei teilen sich die
  // fuenfzehn: fuenf je Ramme, 20 Sekunden nach dem ersten Stoss - gemessen
  // in Runde 139 22,2, weil die drei nacheinander ankommen.
  for (const anzahl of [1, 3]) {
    const { welt, x0, y0, haus } = hausImRing();
    const rammen = [];
    for (let i = 0; i < anzahl; i++) rammen.push(welt.einheitAnlegen('a', x0 + 4 + i, y0 + 1, 'ramme'));
    welt.befehl('a', rammen.map((r) => r.id), { x: haus.x, y: haus.y });
    welt.takten();
    const mauer = welt.gebaeude.get(rammen[0].auftrag.ziel);
    assert.equal(mauer.leben, GEBAEUDE.steinmauer.leben, 'noch kein Stoss');
    assert.equal(mauer?.art, 'steinmauer');
    // Alle auf dasselbe Feld: der Befehl geht auf die Mauer selbst.
    welt.befehl('a', rammen.map((r) => r.id), { x: mauer.x, y: mauer.y });
    let stoesse = 0;
    let ersterTreffer = null;
    let gefallen = null;
    for (let t = 0; t < 120 * TAKTE_PRO_SEKUNDE && gefallen === null; t++) {
      const vorher = mauer.leben;
      welt.takten();
      // Der letzte Stoss nimmt das Feld weg - dann zaehlt er ohne neues Leben.
      if (mauer.leben < vorher || !welt.gebaeude.has(mauer.id)) {
        stoesse += 1;
        ersterTreffer ??= t;
      }
      if (!welt.gebaeude.has(mauer.id)) gefallen = t;
    }
    assert.notEqual(gefallen, null, `${anzahl} Rammen: die Mauer faellt in zwei Minuten`);
    const sekundenBisFall = (gefallen - ersterTreffer) / TAKTE_PRO_SEKUNDE;
    if (anzahl === 1) {
      assert.equal(stoesse, 15, 'fuenfzehn Takte mit einem Stoss');
      assert.ok(Math.abs(sekundenBisFall - 70) <= 1, `vom ersten Stoss bis zum Fall ${sekundenBisFall} s`);
    } else {
      assert.ok(sekundenBisFall < 30, `drei Rammen brauchen ${sekundenBisFall} s`);
    }
  }
});

test('kampf AC-21: faellt das Ziel hinter der Mauer, waehrend er an ihr schlaegt, laesst er die Mauer stehen', () => {
  // Gefunden von der Durchsicht in Runde 139: ohne diese Regel brach er die
  // Mauer weiter ab, obwohl dahinter nichts mehr war.
  const { welt, x0, y0, mauern } = hausImRing();
  const bert = welt.einheitAnlegen('b', x0 + 5, y0 + 3, 'dorfbewohner');
  const miliz = welt.einheitAnlegen('a', x0 + 5, y0, 'miliz');
  welt.befehl('a', [miliz.id], { x: bert.x, y: bert.y });
  sekunden(welt, 3);
  const mauer = welt.gebaeude.get(miliz.auftrag?.ziel);
  assert.equal(mauer?.art, 'steinmauer', 'er schlaegt auf die Mauer');
  assert.ok(mauer.leben < GEBAEUDE.steinmauer.leben);
  welt.einheitSterben(bert);
  sekunden(welt, 1);
  assert.equal(miliz.auftrag, null, 'der Auftrag endet mit dem Ziel');
  const leben = mauer.leben;
  sekunden(welt, 10);
  assert.equal(mauer.leben, leben, 'die Mauer bleibt, wie sie ist');
  assert.ok(mauern.every((m) => welt.gebaeude.has(m.id)));
});

test('kampf AC-21: wer sich von selbst wehrt, bricht keine Mauer, um an einen Feind dahinter zu kommen', () => {
  // Nur ein Befehl bricht durch. Eine Wache, die Bert hinter seinem Ring
  // sieht, bleibt stehen - sonst stuende jede Wache vor jedem fremden Ring
  // und schluege los (Durchsicht Runde 139).
  const { welt, x0, y0, mauern } = hausImRing();
  welt.einheitAnlegen('b', x0 + 5, y0 + 3, 'dorfbewohner');
  const wache = welt.einheitAnlegen('a', x0 + 5, y0, 'miliz');
  assert.ok(EINHEITEN.miliz.wacht);
  sekunden(welt, 15);
  assert.ok(mauern.every((m) => m.leben === GEBAEUDE.steinmauer.leben), 'keine Mauer beschaedigt');
  assert.ok(Math.hypot(wache.x - (x0 + 5), wache.y - y0) < 1.5, 'die Wache steht noch an ihrem Platz');
});
