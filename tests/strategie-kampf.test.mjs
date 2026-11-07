// Der Kampf (kampf AC-1 bis AC-3, AC-5 bis AC-8, AC-10 und einheiten AC-25) -
// Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md). Die
// Oberflaeche dazu steht in e2e/tests/strategie-kampf.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE, VERFOLGUNG_FELDER } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
// So lange liegt ein Toter (kampf AC-10).
const TOT_SEKUNDEN_TAKTE = 2 * TAKTE_PRO_SEKUNDE;

/**
 * Eine Welt mit zwei Einheiten, die sich sehen: Annas Angreifer und Berts
 * Ziel, `abstand` Felder weit auseinander auf derselben Zeile.
 */
function gegenueber(art, zielArt, abstand = 3) {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('a').basis;
  const angreifer = welt.einheitAnlegen('a', basis.x + 4, basis.y + 4, art);
  const ziel = welt.einheitAnlegen('b', basis.x + 4 + abstand, basis.y + 4, zielArt);
  return { welt, angreifer, ziel };
}

/** Der Rechtsklick des Browsers: auf das Feld, nicht auf die Nummer. */
function rechtsklick(welt, spielerId, einheiten, auf) {
  return welt.nachricht(spielerId, {
    auftrag: 'befehl',
    einheiten: einheiten.map((e) => e.id),
    ziel: { x: auf.x, y: auf.y },
  });
}

function takten(welt, takte) {
  for (let t = 0; t < takte; t++) welt.takten();
}

/** Takten, bis die Bedingung zutrifft - oder bis die Geduld reisst. */
function taktenBis(welt, bedingung, grenze = 2000) {
  for (let t = 0; t < grenze; t++) {
    welt.takten();
    if (bedingung()) return t + 1;
  }
  throw new Error('nicht eingetreten in ' + grenze + ' Takten');
}

// ---- Angreifen -------------------------------------------------------------

test('kampf AC-1: ein Rechtsklick auf eine fremde Einheit wird zum Angriff', () => {
  const { welt, angreifer, ziel } = gegenueber('soldat', 'miliz', 4);
  rechtsklick(welt, 'a', [angreifer], ziel);
  // Feld um Feld, nicht als ganzes Objekt: ein Auftrag bekommt mit den Stufen
  // mehr Felder (Platz, Heimat), und ein deepEqual waere dann falsch.
  assert.equal(angreifer.auftrag.art, 'angreifen');
  assert.equal(angreifer.auftrag.ziel, ziel.id);
  assert.equal(angreifer.auftrag.gebaeude, false);

  // Er laeuft hin - und schlaegt erst zu, wenn das Ziel in Reichweite ist.
  const vorher = { x: angreifer.x, y: angreifer.y };
  takten(welt, 5);
  assert.ok(Math.hypot(angreifer.x - vorher.x, angreifer.y - vorher.y) > 0.1, 'er laeuft los');
  assert.equal(ziel.leben, EINHEITEN.miliz.leben, 'auf vier Felder trifft ein Nahkaempfer nicht');

  const takte = taktenBis(welt, () => ziel.leben < EINHEITEN.miliz.leben);
  assert.ok(Math.hypot(ziel.x - angreifer.x, ziel.y - angreifer.y) <= 1.5, 'er steht daneben');
  assert.deepEqual(angreifer.weg, [], 'in Reichweite bleibt er stehen');
  // Vier Felder bei Tempo 0,9 sind rund 45 Takte; mehr als 80 heisst, dass er
  // nicht geradewegs hingelaufen ist.
  assert.ok(takte < 80, `erster Treffer nach ${takte} Takten`);
});

test('kampf AC-1: ein Rechtsklick auf ein fremdes Gebaeude greift es an, bis es fallt', () => {
  const { welt, angreifer } = gegenueber('soldat', 'miliz', 20);
  const basis = welt.spielerVon('b').basis;
  const haus = welt.gebaeudeAnlegen('b', 'haus', basis.x + 4, basis.y + 4);
  // Ein Haus mit 550 Leben haelt einen Soldaten drei Minuten aus; geprueft wird
  // der Abriss, nicht die Geduld.
  haus.leben = 12;
  const feld = haus.y * welt.karte.groesse + haus.x;

  rechtsklick(welt, 'a', [angreifer], { x: haus.x, y: haus.y });
  assert.deepEqual(angreifer.auftrag, { art: 'angreifen', ziel: haus.id, gebaeude: true });
  taktenBis(welt, () => !welt.gebaeude.has(haus.id));

  assert.equal(welt.gebaeude.has(haus.id), false, 'das Haus ist weg');
  // Der Platz ist wieder frei, und der Browser erfaehrt davon.
  assert.notEqual(welt.karte.felder[feld], require('../server/spiele/strategie/karte.js').BEBAUT);
  const zustand = welt.zustand();
  assert.deepEqual(zustand.gebaeude.find((g) => g.i === haus.id), { i: haus.id, weg: true });
  // Der Auftrag endet im Takt danach: der Schlag ist abgerechnet, bevor der
  // Angreifer das naechste Mal nach seinem Ziel sieht.
  welt.takten();
  assert.equal(angreifer.auftrag, null, 'danach hat er nichts mehr zu tun');
});

test('kampf AC-1: mehrere Angreifer stellen sich um das Ziel, nicht uebereinander', () => {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('a').basis;
  const vier = [0, 1, 2, 3].map((i) => welt.einheitAnlegen('a', basis.x + 3 + i, basis.y + 3, 'miliz'));
  const ziel = welt.einheitAnlegen('b', basis.x + 5, basis.y + 8, 'spaeherreiter');
  ziel.leben = 10000;
  rechtsklick(welt, 'a', vier, ziel);
  // Der Reiter wehrt sich (kampf AC-2) und laeuft dabei einem der vier
  // entgegen: gewartet wird, bis alle vier **gleichzeitig** stehen und in
  // Reichweite sind, nicht nur bis ihr erster Weg zu Ende ist (Runde 64).
  taktenBis(welt, () => vier.every((e) => !e.weg.length && Math.hypot(e.x - ziel.x, e.y - ziel.y) <= 1.5), 600);

  // Keine zwei auf demselben Fleck: ein halbes Feld Abstand ist die Schwelle,
  // ab der zwei Figuren im Bild noch zwei sind (Runde 63).
  for (const [i, e] of vier.entries()) {
    assert.ok(Math.hypot(e.x - ziel.x, e.y - ziel.y) <= 1.5, 'jeder steht in Reichweite');
    for (const f of vier.slice(i + 1)) {
      const abstand = Math.hypot(e.x - f.x, e.y - f.y);
      assert.ok(abstand >= 0.5, `${abstand.toFixed(2)} Felder zwischen zwei Angreifern`);
    }
  }
});

test('kampf AC-1: auf Eigenes wird nicht geschlagen', () => {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('a').basis;
  const soldat = welt.einheitAnlegen('a', basis.x + 4, basis.y + 4, 'soldat');
  const eigener = welt.einheitAnlegen('a', basis.x + 6, basis.y + 4, 'miliz');
  rechtsklick(welt, 'a', [soldat], eigener);
  assert.equal(soldat.auftrag.art, 'gehen', 'der eigene Mann ist ein Ziel zum Hingehen');
  takten(welt, 100);
  assert.equal(eigener.leben, EINHEITEN.miliz.leben);
});

test('kampf AC-1: stirbt das Ziel unterwegs, bleibt der Angreifer stehen', () => {
  const { welt, angreifer, ziel } = gegenueber('soldat', 'miliz', 12);
  rechtsklick(welt, 'a', [angreifer], ziel);
  takten(welt, 10);
  assert.ok(angreifer.weg.length, 'er ist unterwegs');

  welt.einheitSterben(ziel);
  welt.takten();
  assert.equal(angreifer.auftrag, null, 'der Auftrag endet');
  assert.deepEqual(angreifer.weg, [], 'er laeuft nicht auf das leere Feld');
});

// ---- Schaden ---------------------------------------------------------------

test('kampf AC-6: der Schaden folgt der einen Formel', () => {
  const welt = new Welt(ZWEI, 7);
  const einheit = (art) => ({ art });
  const faelle = [
    // Angreifer, Ziel, erwartet, warum
    ['soldat', 'miliz', 6, 'nah 6 gegen Nahruestung 0'],
    ['miliz', 'spaeherreiter', 4, 'die Fernruestung 2 des Reiters zaehlt nicht gegen ein Schwert'],
    ['speerkaempfer', 'spaeherreiter', 18, '3 + 15 Bonus auf Kavallerie'],
    ['bogenschuetze', 'speerkaempfer', 7, '4 + 3 Bonus auf Speer'],
    ['plaenkler', 'bogenschuetze', 5, '2 + 3 Bonus auf Bogenschuetzen'],
    ['bogenschuetze', 'plaenkler', 1, '4 - 3 Fernruestung des Plaenklers'],
    ['soldat', 'dorfbewohner', 6, 'der Dorfbewohner traegt keine Ruestung'],
  ];
  for (const [von, auf, erwartet, warum] of faelle) {
    assert.equal(welt.schaden(einheit(von), einheit(auf), false), erwartet, `${von} auf ${auf}: ${warum}`);
  }
  // Gegen Gebaeude: nah voll, fern fast nichts - und niemals null.
  assert.equal(welt.schaden(einheit('soldat'), { art: 'haus' }, true), 6);
  assert.equal(welt.schaden(einheit('bogenschuetze'), { art: 'haus' }, true), 1, '4 - 7 Fernruestung, mindestens 1');
  assert.equal(welt.schaden(einheit('dorfbewohner'), { art: 'kaserne' }, true), 3);
});

test('kampf AC-6: der Bonus wirkt auch im Takt, nicht nur in der Formel', () => {
  // Der Speerkaempfer braucht gegen den Reiter (45 Leben, 18 Schaden je
  // Schlag) drei Schlaege; der dritte nimmt mehr, als noch da ist.
  const { welt, angreifer, ziel } = gegenueber('speerkaempfer', 'spaeherreiter', 2);
  rechtsklick(welt, 'a', [angreifer], ziel);
  taktenBis(welt, () => ziel.leben < 45);
  assert.equal(ziel.leben, 27, 'ein Schlag nimmt 18');
  taktenBis(welt, () => ziel.leben < 27);
  assert.equal(ziel.leben, 9, 'der zweite auch');
  taktenBis(welt, () => ziel.tot);
  assert.equal(ziel.leben, 0, 'der dritte reicht, und Leben unter null gibt es nicht');
});

test('kampf AC-7: zwischen zwei Schlaegen liegt genau die Nachladezeit', () => {
  for (const art of ['soldat', 'plaenkler']) {
    const { welt, angreifer } = gegenueber(art, 'miliz', 20);
    const basis = welt.spielerVon('b').basis;
    // Ein Ziel, das lange haelt: eine Kaserne mit viel Leben - so lassen sich
    // die Treffer zaehlen, ohne dass sie dabei zusammenfaellt.
    const bau = welt.gebaeudeAnlegen('b', 'kaserne', basis.x + 4, basis.y + 4);
    bau.leben = 100000;
    rechtsklick(welt, 'a', [angreifer], { x: bau.x, y: bau.y });
    taktenBis(welt, () => bau.leben < 100000);

    const schaden = welt.schaden(angreifer, bau, true);
    const nachladen = EINHEITEN[art].nachladen * TAKTE_PRO_SEKUNDE;
    const nachErstem = bau.leben;
    // Einen Takt vor Ablauf der dritten Nachladezeit sind es zwei weitere
    // Treffer, im Takt danach der dritte: genau alle `nachladen` Takte einer.
    takten(welt, 3 * nachladen - 1);
    assert.equal((nachErstem - bau.leben) / schaden, 2, `${art}: nach ${3 * nachladen - 1} Takten zwei Treffer`);
    welt.takten();
    assert.equal((nachErstem - bau.leben) / schaden, 3, `${art}: der dritte kommt genau im Takt ${3 * nachladen}`);
  }
});

test('kampf AC-8: gleiche Lage, gleiches Ergebnis', () => {
  const lauf = () => {
    const { welt, angreifer, ziel } = gegenueber('bogenschuetze', 'speerkaempfer', 8);
    rechtsklick(welt, 'a', [angreifer], ziel);
    const verlauf = [];
    for (let t = 0; t < 200; t++) {
      welt.takten();
      verlauf.push(`${t}:${ziel.leben}:${Math.round(angreifer.x * 1000)}:${Math.round(angreifer.y * 1000)}`);
    }
    return verlauf.join('|');
  };
  assert.equal(lauf(), lauf(), 'zwei Partien mit gleichem Startwert laufen gleich');
  // Und im Kampfteil steht kein Wuerfel.
  const quelle = require('node:fs').readFileSync(
    new URL('../server/spiele/strategie/welt.js', import.meta.url), 'utf8');
  assert.equal(quelle.includes('Math.random'), false, 'kein Math.random in der Simulation');
});

// ---- Tod -------------------------------------------------------------------

test('kampf AC-10: ein Toter liegt zwei Sekunden und verschwindet dann', () => {
  const { welt, angreifer, ziel } = gegenueber('soldat', 'miliz', 2);
  rechtsklick(welt, 'a', [angreifer], ziel);
  const bevorher = welt.bevoelkerung().get('b');
  taktenBis(welt, () => ziel.tot);

  // Er liegt noch, aber er zaehlt nicht mehr: nicht zur Bevoelkerung, nicht
  // als Ziel, nicht als untaetig.
  assert.equal(welt.einheiten.has(ziel.id), true, 'noch im Bild');
  assert.equal(welt.bevoelkerung().get('b'), bevorher - 1, 'die Bevoelkerung ist gefallen');
  assert.equal(welt.feindAn('a', ziel.x, ziel.y), null, 'auf einen Toten wird nicht geschlagen');
  const imZustand = welt.zustand().einheiten.find((e) => e.i === ziel.id);
  assert.equal(imZustand.s, 1, 'der Browser erfaehrt, dass er liegt');

  // Zwei Sekunden: einen Takt vorher liegt er noch, danach ist er weg.
  welt.takten();
  assert.equal(angreifer.auftrag, null, 'der Angreifer hat danach nichts mehr zu tun');
  takten(welt, TOT_SEKUNDEN_TAKTE - 2);
  assert.equal(welt.einheiten.has(ziel.id), true, `nach ${TOT_SEKUNDEN_TAKTE - 1} Takten liegt er noch`);
  welt.takten();
  assert.equal(welt.einheiten.has(ziel.id), false, 'nach zwei Sekunden ist er weg');
  assert.equal(welt.zustand().einheiten.some((e) => e.i === ziel.id), false);
});

test('kampf AC-10: ein toter Dorfbewohner zaehlt nicht als untaetig', () => {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('b').basis;
  const bauer = welt.einheitAnlegen('b', basis.x + 4, basis.y + 4, 'dorfbewohner');
  const vorher = welt.untaetigeVon('b').length;
  welt.einheitSterben(bauer);
  assert.equal(welt.untaetigeVon('b').length, vorher - 1);
  assert.equal(welt.untaetigeVon('b').includes(bauer.id), false);
});

test('kampf AC-10: beide sterben, wenn beide den letzten Schlag haben', () => {
  // Zwei Soldaten nebeneinander, beide mit so wenig Leben, dass ein Treffer
  // reicht - der Grenzfall aus der Spec: kein Vorrang fuer den Ersten.
  const { welt, angreifer, ziel } = gegenueber('soldat', 'soldat', 1);
  angreifer.leben = 3;
  ziel.leben = 3;
  rechtsklick(welt, 'a', [angreifer], ziel);
  rechtsklick(welt, 'b', [ziel], angreifer);
  welt.takten();
  assert.ok(angreifer.tot && ziel.tot, 'beide liegen');
});

test('kampf AC-10: ein Gebaeude mit Leben 0 steht nicht mehr im Weg', () => {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('b').basis;
  const haus = welt.gebaeudeAnlegen('b', 'haus', basis.x + 6, basis.y + 6);
  assert.equal(GEBAEUDE.haus.groesse, 2);
  welt.gebaeudeZerstoeren(haus);
  const { x0, y0, x1, y1 } = welt.grundflaeche('haus', haus.x, haus.y);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      assert.equal(require('../server/spiele/strategie/karte.js').begehbar(welt.karte, x, y), true, `${x}/${y} ist frei`);
    }
  }
});

// ---- Sich wehren (kampf AC-2) ----------------------------------------------

test('kampf AC-2: eine stehende Miliz greift ohne Befehl an, was in ihre Sichtweite kommt', () => {
  // Drei Felder auseinander, Sichtweite der Miliz ist vier - niemand bekommt
  // einen Befehl.
  const { welt, angreifer, ziel } = gegenueber('miliz', 'miliz', 3);
  assert.equal(angreifer.auftrag, null);
  // Umgesehen wird zweimal je Sekunde, nicht in jedem Takt (WACHE_TAKTE).
  taktenBis(welt, () => angreifer.auftrag, 10);
  assert.equal(angreifer.auftrag.art, 'angreifen');
  assert.equal(angreifer.auftrag.ziel, ziel.id);
  // Und der Angegriffene wehrt sich seinerseits - beide sind Kampfeinheiten.
  assert.equal(ziel.auftrag.art, 'angreifen');
  assert.equal(ziel.auftrag.ziel, angreifer.id);
  // Es wird wirklich geschlagen, nicht nur befohlen.
  taktenBis(welt, () => ziel.leben < EINHEITEN.miliz.leben, 100);
});

test('kampf AC-2: was ausser Sichtweite steht, wird nicht angegriffen', () => {
  // Sechs Felder: weiter als die Sichtweite vier der Miliz.
  const { welt, angreifer, ziel } = gegenueber('miliz', 'miliz', 6);
  takten(welt, 60);
  assert.equal(angreifer.auftrag, null, 'sie bleibt stehen');
  assert.equal(ziel.leben, EINHEITEN.miliz.leben, 'und niemand wird geschlagen');
});

test('kampf AC-2: ein Dorfbewohner wacht nicht - er arbeitet weiter', () => {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('a').basis;
  const [sammler] = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  const wald = welt.naechsterVorrat(basis, 1);
  assert.ok(wald, 'ein Baum in der Naehe');
  welt.befehl('a', [sammler.id], wald);
  taktenBis(welt, () => sammler.sammelt, 600);
  // Ein fremder Dorfbewohner stellt sich daneben. Er wacht auch nicht, also
  // bleibt die Arbeit die einzige Handlung in dieser Welt.
  welt.einheitAnlegen('b', Math.round(sammler.x) + 1, Math.round(sammler.y), 'dorfbewohner');
  takten(welt, 60);
  assert.equal(sammler.sammelt, true, 'er sammelt weiter');
  assert.equal(sammler.auftrag.art, 'sammeln');
});

test('kampf AC-2: ein getroffener Dorfbewohner laesst die Arbeit liegen und schlaegt zurueck', () => {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('a').basis;
  const [sammler] = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  const wald = welt.naechsterVorrat(basis, 1);
  welt.befehl('a', [sammler.id], wald);
  taktenBis(welt, () => sammler.sammelt, 600);
  const raeuber = welt.einheitAnlegen('b', Math.round(sammler.x) + 2, Math.round(sammler.y), 'miliz');

  // Die Miliz wacht von selbst, der Dorfbewohner nicht - bis der erste Schlag
  // sitzt.
  taktenBis(welt, () => sammler.leben < EINHEITEN.dorfbewohner.leben, 100);
  // Der Auftrag steht schon, aber abgerechnet wird am Ende des Taktes: die
  // Arbeit liegt erst im naechsten, wenn die Einheit wieder getaktet wird.
  assert.equal(sammler.auftrag.art, 'angreifen');
  welt.takten();
  assert.equal(sammler.sammelt, false, 'die Arbeit liegt');
  assert.equal(sammler.auftrag.ziel, raeuber.id);
  // Er richtet etwas aus, wenn auch wenig (kampf AC-5).
  taktenBis(welt, () => raeuber.leben < EINHEITEN.miliz.leben, 100);
});

// ---- Verfolgung (kampf AC-3) -----------------------------------------------

test('kampf AC-3: eine Verfolgung ohne Befehl endet fuenf Felder vom Ausgangsplatz', () => {
  const { welt, angreifer, ziel } = gegenueber('miliz', 'spaeherreiter', 3);
  const heimat = { x: angreifer.x, y: angreifer.y };
  // Der Reiter laeuft weg - und ist schneller als die Miliz (1,2 gegen 0,9).
  welt.befehl('b', [ziel.id], welt.spielerVon('b').basis);
  taktenBis(welt, () => angreifer.auftrag?.art === 'angreifen', 10);

  // In keinem Takt weiter als fuenf Felder von dort, wo sie stand. Ein Schritt
  // je Takt ist hoechstens 0,09 Felder lang, deshalb die kleine Zugabe.
  let weiteste = 0;
  taktenBis(welt, () => {
    weiteste = Math.max(weiteste, Math.hypot(angreifer.x - heimat.x, angreifer.y - heimat.y));
    return !angreifer.auftrag;
  }, 2000);
  assert.ok(weiteste > 1, `sie hat ihn ueberhaupt verfolgt (${weiteste.toFixed(2)} Felder)`);
  assert.ok(weiteste <= VERFOLGUNG_FELDER + 0.2, `nie weiter als fuenf Felder: ${weiteste.toFixed(2)}`);

  // Und sie kehrt an ihren Platz zurueck.
  taktenBis(welt, () => Math.hypot(angreifer.x - heimat.x, angreifer.y - heimat.y) < 0.6, 2000);
  assert.equal(angreifer.auftrag, null);
});

test('kampf AC-3: ein befohlener Angriff folgt weiter - sonst stellt man keinen Fluechtenden', () => {
  const { welt, angreifer, ziel } = gegenueber('miliz', 'spaeherreiter', 3);
  const start = { x: angreifer.x, y: angreifer.y };
  rechtsklick(welt, 'a', [angreifer], ziel);
  welt.befehl('b', [ziel.id], welt.spielerVon('b').basis);
  assert.equal(angreifer.auftrag.heimat, undefined, 'ein Befehl kennt keine Heimat');
  taktenBis(welt, () => Math.hypot(angreifer.x - start.x, angreifer.y - start.y) > VERFOLGUNG_FELDER + 1, 2000);
  assert.equal(angreifer.auftrag.art, 'angreifen', 'der Auftrag gilt noch');
});

// ---- Dorfbewohner (kampf AC-5) ---------------------------------------------

test('kampf AC-5: ein Dorfbewohner kaempft schlecht - fuenfzehn Schlaege gegen fuenf', () => {
  const werte = EINHEITEN.dorfbewohner;
  assert.equal(werte.angriff, 3);
  assert.equal(werte.nahruestung, 0);
  assert.equal(werte.fernruestung, 0);
  assert.equal(werte.bonus, undefined, 'keine Boni');

  const { welt, angreifer: bauer, ziel: soldat } = gegenueber('dorfbewohner', 'soldat', 1);
  assert.equal(welt.schaden(bauer, soldat, false), 3, 'drei gegen einen Soldaten');
  assert.equal(welt.schaden(soldat, bauer, false), 6, 'sechs gegen einen Dorfbewohner');
  assert.equal(Math.ceil(EINHEITEN.soldat.leben / 3), 15, 'fuenfzehn Schlaege fuer 45 Leben');
  assert.equal(Math.ceil(werte.leben / 6), 5, 'und er fallt nach fuenf');

  // Im Zweikampf: der Soldat wacht von selbst, der Dorfbewohner wehrt sich erst,
  // wenn er getroffen ist - und verliert damit eine Runde. Er schlaegt viermal,
  // waehrend der Soldat fuenfmal schlaegt: 12 von 45 Schaden. Gemessen, nicht
  // gerechnet - die verlorene Runde war in der Rechnung nicht vorgesehen.
  taktenBis(welt, () => bauer.tot, 600);
  assert.equal(soldat.leben, EINHEITEN.soldat.leben - 12, 'der Soldat steht mit 33 von 45 Leben da');
});

test('kampf AC-5: vier Dorfbewohner erschlagen einen Soldaten - einer nie', () => {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('a').basis;
  const soldat = welt.einheitAnlegen('b', basis.x + 7, basis.y + 7, 'soldat');
  const bauern = [[0, 1], [1, 0], [0, -1], [-1, 0]]
    .map(([dx, dy]) => welt.einheitAnlegen('a', soldat.x + dx, soldat.y + dy, 'dorfbewohner'));
  for (const bauer of bauern) rechtsklick(welt, 'a', [bauer], soldat);

  // Vier mal drei Schaden je zwei Sekunden gegen 45 Leben: vier Runden. Der
  // Soldat braucht fuer einen Dorfbewohner fuenf - deshalb verliert er.
  taktenBis(welt, () => soldat.tot, 600);
  assert.equal(bauern.filter((b) => b.tot).length, 0, 'keiner von ihnen fallt');
  // Teuer bleibt es: wer die Schlaege abbekommt, verliert mehr als ein Drittel
  // seines Lebens (25 / 3 = 8,3 - also 16 oder weniger uebrig). Gemessen: 7 von
  // 25 nach 6,1 Sekunden.
  const wundester = Math.min(...bauern.map((b) => b.leben));
  assert.ok(wundester <= 16, `einer hat mehr als ein Drittel verloren: ${wundester} von 25`);
});

// ---- Fernkaempfer (einheiten AC-25) ----------------------------------------

/**
 * Der Abstand, aus dem ein Angreifer seinen ersten Treffer landet - und ob er
 * danach stehenblieb. Das Ziel steht acht Felder weit weg, also doppelt so weit
 * wie die Reichweite eines Fernkaempfers.
 */
function ersterTreffer(art) {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('a').basis;
  const angreifer = welt.einheitAnlegen('a', basis.x + 4, basis.y + 4, art);
  const ziel = welt.einheitAnlegen('b', basis.x + 12, basis.y + 4, 'miliz');
  rechtsklick(welt, 'a', [angreifer], ziel);
  taktenBis(welt, () => ziel.leben < EINHEITEN.miliz.leben, 600);
  const abstand = Math.hypot(angreifer.x - ziel.x, angreifer.y - ziel.y);
  let naechster = abstand;
  takten(welt, 100);
  naechster = Math.min(naechster, Math.hypot(angreifer.x - ziel.x, angreifer.y - ziel.y));
  return { abstand, naechster, ziel, angreifer };
}

test('einheiten AC-25: Bogenschuetze und Plaenkler schiessen aus vier Feldern', () => {
  for (const art of ['bogenschuetze', 'plaenkler']) {
    assert.equal(EINHEITEN[art].reichweite, 4, `${art} hat Reichweite vier`);
    const { abstand, naechster } = ersterTreffer(art);
    // Reichweite vier plus den Spielraum fuer die Schraege: nie naeher als
    // dreieinhalb Felder, nie weiter als viereinhalb. Gemessen 4,42.
    assert.ok(abstand > 3.5 && abstand < 4.6, `${art} trifft aus ${abstand.toFixed(2)} Feldern`);
    // Und er laeuft auch danach nicht in den Nahkampf, solange das Ziel in
    // Reichweite bleibt.
    assert.ok(naechster > 3.5, `${art} bleibt auf ${naechster.toFixed(2)} Feldern`);
  }
});

test('einheiten AC-25: ein Nahkaempfer geht dagegen bis ans Ziel', () => {
  assert.equal(EINHEITEN.miliz.reichweite, 0);
  const { abstand } = ersterTreffer('miliz');
  assert.ok(abstand < 1.5, `die Miliz trifft erst auf ${abstand.toFixed(2)} Feldern`);
});
