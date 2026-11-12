// Die Haeuser als Daten (→ specs/10-strategie/spielziel.md AC-17,
// fahrplan.md AC-17, docs/adr/0014-haeuser-statt-voelker.md).
//
// Ein Haus ist ein Eintrag in `HAEUSER`; seine Boni haben die Form einer
// Verbesserung und werden dort gelesen, wo die Verbesserungen gelesen werden.
// Diese Tests lesen die Boni aus den Daten - keine Liste im Testkopf -, damit
// ein neuer Bonus in einer bekannten Form von selbst mitgeprueft wird.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE, HAEUSER, HANDEL, VERBESSERUNGEN, STARTAUFSTELLUNG } = require('../server/spiele/strategie/daten.js');
const { partieSpielen } = require('../server/spiele/strategie/pruefstand.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const mitHaus = (haus) => new Welt(ZWEI, 7, { sicht: 'aufgedeckt', haeuser: { a: haus } });

// Die Formen, die gelesen werden - `handel` seit E3 (spielziel AC-26). Was
// ein Haus sonst traegt, braucht eine neue Lesestelle und bricht hier, bis es
// sie gibt. Was die Boni im Spiel bewirken, misst
// tests/strategie-haeuser-wirkung.test.mjs.
const FORMEN = ['wirkung', 'sammeln', 'farm', 'gebaeude', 'handel'];
// Gebaeudewerte, die nur ein Gebaeude traegt, das schiesst.
const SCHIESSEND = Object.keys(GEBAEUDE).find((art) => GEBAEUDE[art].angriff > 0);

// Was der Mannschaftsbonus eines Hauses an derselben Stelle dazugibt: er gilt
// auch dem Haus selbst (spielziel AC-25), ein Vergleich mit und ohne Haus
// misst deshalb beides zusammen.
function mannschaftDazu(eintrag, form, ...weg) {
  let wert = eintrag.mannschaft?.[form];
  for (const schritt of weg) wert = wert?.[schritt];
  return typeof wert === 'number' ? wert : 0;
}

// Eine Einheitenart, auf die ein Schluessel aus `wirkung` greift: die Art
// selbst oder die erste mit dieser Klasse.
function artFuer(schluessel) {
  if (EINHEITEN[schluessel]) return schluessel;
  return Object.keys(EINHEITEN).find((art) => EINHEITEN[art].klassen?.includes(schluessel));
}

test('spielziel AC-17: jeder Bonus jedes Hauses wirkt von Beginn an, gelesen wie eine Verbesserung', () => {
  let geprueft = 0;
  for (const [haus, eintrag] of Object.entries(HAEUSER)) {
    for (const form of Object.keys(eintrag.boni)) assert.ok(FORMEN.includes(form), `${haus}: Bonus in unbekannter Form "${form}"`);
    const welt = mitHaus(haus);
    const { wirkung = {}, sammeln = {}, farm = {}, gebaeude = {}, handel = {} } = eintrag.boni;

    // Kampfwerte je Art oder Klasse - Anna mit Haus, Bert ohne, dieselbe Welt.
    for (const [schluessel, felder] of Object.entries(wirkung)) {
      const art = artFuer(schluessel);
      assert.ok(art, `${haus}: "${schluessel}" trifft keine Einheit`);
      for (const [feld, zuschlag] of Object.entries(felder)) {
        const erwartet = zuschlag + mannschaftDazu(eintrag, 'wirkung', schluessel, feld);
        assert.equal(welt.einheitenwert('a', art, feld) - welt.einheitenwert('b', art, feld), erwartet, `${haus}: ${art}.${feld}`);
        geprueft += 1;
      }
    }
    // Sammeln als Faktor.
    for (const [rohstoff, faktor] of Object.entries(sammeln)) {
      assert.ok(Math.abs(welt.sammelrate('a', rohstoff, 1) - faktor) < 1e-9, `${haus}: ${rohstoff}`);
      assert.equal(welt.sammelrate('b', rohstoff, 1), 1);
      geprueft += 1;
    }
    // Nahrung je Farm.
    if (farm.nahrung) {
      assert.equal(welt.farmNahrung('a') - welt.farmNahrung('b'), farm.nahrung, `${haus}: Farm`);
      geprueft += 1;
    }
    // Gebaeude: Leben als Anteil, alles andere als Zuschlag - am Dorfzentrum,
    // das von Beginn an steht; Angriff, Reichweite und Nachladezeit an einem,
    // das schiesst.
    for (const [feld, wert] of Object.entries(gebaeude)) {
      const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === 'dorfzentrum');
      const art = ['angriff', 'reichweite', 'nachladen'].includes(feld) ? SCHIESSEND : 'dorfzentrum';
      if (feld === 'lebenAnteil') {
        assert.equal(zentrum.leben, Math.round(GEBAEUDE.dorfzentrum.leben * (1 + wert)), `${haus}: das Dorfzentrum steht mit mehr Leben`);
      } else {
        assert.equal(welt.gebaeudewert('a', art, feld) - welt.gebaeudewert('b', art, feld), wert, `${haus}: ${art}.${feld}`);
      }
      geprueft += 1;
    }
    // Handel: die Gebuehr als Zuschlag, der Karren als Anteil.
    for (const [feld, wert] of Object.entries(handel)) {
      assert.equal(welt.handelswert('a', feld) - welt.handelswert('b', feld), wert, `${haus}: handel.${feld}`);
      if (feld === 'gebuehr') {
        const [kauf] = welt.handelspreise('a').holz;
        assert.equal(kauf, Math.round(HANDEL.waren.holz * (1 + HANDEL.gebuehr + wert)), `${haus}: Kaufpreis`);
      }
      geprueft += 1;
    }
    // Was von Beginn an steht, traegt den Bonus schon: die Startaufstellung
    // hat das Leben mit Haus.
    for (const art of new Set(STARTAUFSTELLUNG)) {
      const einheit = [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === art);
      assert.equal(einheit.leben, welt.einheitenwert('a', art, 'leben'), `${haus}: ${art} beginnt mit vollem Leben`);
    }
  }
  // Gegenprobe des Aufbaus: jedes Blatt der Boni ist einmal geprueft worden,
  // und es sind welche - leer waere der Test sonst gruen. Seit E3 zwoelf.
  const blaetter = (o) => Object.values(o).reduce((n, w) => n + (typeof w === 'object' ? blaetter(w) : 1), 0);
  const erwartet = Object.values(HAEUSER).reduce((n, h) => n + blaetter(h.boni), 0);
  assert.equal(geprueft, erwartet);
  assert.ok(erwartet >= 12, `Boni in den Daten: ${erwartet}`);
});

test('spielziel AC-17: Haus und Verbesserung zaehlen zusammen, ein unbekanntes Haus gibt nichts', () => {
  // Wehrstein (+10 % Leben) und Mauerwerk (+10 %) - beide aus den Daten.
  const mauerwerk = Object.keys(VERBESSERUNGEN).find((v) => VERBESSERUNGEN[v].gebaeude?.lebenAnteil);
  const welt = mitHaus('wehrstein');
  const spieler = welt.spielerVon('a');
  spieler.zeitalter = 3;
  welt.erforschen(spieler, mauerwerk);
  const anteil = HAEUSER.wehrstein.boni.gebaeude.lebenAnteil + VERBESSERUNGEN[mauerwerk].gebaeude.lebenAnteil;
  assert.equal(welt.gebaeudewert('a', 'haus', 'leben'), Math.round(GEBAEUDE.haus.leben * (1 + anteil)));

  // Kein Haus, ein erfundenes, ein geerbter Name, eine Zahl: keine Boni.
  for (const haus of ['nebelheim', 'toString', 3, null]) {
    const ohne = mitHaus(haus);
    assert.equal(ohne.spielerVon('a').haus, null, String(haus));
    assert.equal(ohne.sammelrate('a', 'holz', 1), 1);
  }
});

test('spielziel AC-17: die Wertetafel fuer den Browser traegt die Boni, auch die Nahrung je Farm', () => {
  // Der Browser rechnet nichts nach (bedienung AC-35): was die Leiste ueber
  // eine Farm sagt ("noch 200 von 220"), kommt aus `kw`. Fehlte die Farm in
  // der Tafel, stuende bei einem Haus mit Farmbonus "220 von 175"
  // (Durchsicht Runde 167).
  for (const [haus, eintrag] of Object.entries(HAEUSER)) {
    const welt = mitHaus(haus);
    const tafel = welt.kampfwerte('a');
    assert.equal(tafel.farm.nahrung, GEBAEUDE.farm.nahrung + (eintrag.boni.farm?.nahrung || 0), haus);
    for (const [schluessel, felder] of Object.entries(eintrag.boni.wirkung || {})) {
      const art = artFuer(schluessel);
      for (const feld of Object.keys(felder)) assert.equal(tafel[art][feld], welt.einheitenwert('a', art, feld), `${haus}: ${art}.${feld}`);
    }
  }
});

// "Die Simulation nennt kein einzelnes Haus" steht als Waechter in
// tests/waechter-haeuser.test.mjs (Rueckschau nach Runde 178).

test('fahrplan AC-17: ein sechstes Haus entsteht allein aus Daten und ist spielbar', () => {
  // Das sechste Haus traegt jede Form, die es gibt - als Eintrag, sonst nichts.
  HAEUSER.probe = {
    name: 'Probe', sitz: 'Testland', wahlspruch: 'Nur Daten.',
    boni: {
      wirkung: { dorfbewohner: { leben: 5 } },
      sammeln: { holz: 1.5, gold: 1.5 },
      farm: { nahrung: 100 },
      gebaeude: { lebenAnteil: 0.2, reichweite: 1 },
      handel: { gebuehr: -0.1, karrenAnteil: 0.1 },
    },
  };
  try {
    // Zwanzig Minuten KI gegen KI, jeder Takt vom Pruefstand auf Widersprueche
    // geprueft; KI 1 spielt das neue Haus.
    const mit = partieSpielen({ startwert: 3, minuten: 20, einstellungen: { sicht: 'aufgedeckt', haeuser: { ki1: 'probe' } } });
    const ohne = partieSpielen({ startwert: 3, minuten: 20, einstellungen: { sicht: 'aufgedeckt' } });
    const welt = mit.welt;
    assert.equal(welt.spielerVon('ki1').haus, 'probe');
    assert.equal(welt.einheitenwert('ki1', 'dorfbewohner', 'leben'), EINHEITEN.dorfbewohner.leben + 5);
    // Im Spiel angekommen: jeder Dorfbewohner von KI 1 hat das hoehere Leben
    // als Hoechstwert, jede ihrer Farmen begann mit mehr Nahrung.
    const leute = [...welt.einheiten.values()].filter((e) => e.besitzer === 'ki1' && e.art === 'dorfbewohner');
    assert.ok(leute.length > 10, `Dorfbewohner: ${leute.length}`);
    assert.ok(leute.every((e) => e.leben <= EINHEITEN.dorfbewohner.leben + 5));
    assert.ok(leute.some((e) => e.leben > EINHEITEN.dorfbewohner.leben), 'mindestens einer mit dem Bonus im Leben');
    assert.equal(welt.farmNahrung('ki1'), GEBAEUDE.farm.nahrung + 100);
    // Gegenprobe: dieselbe Partie ohne Haus verlaeuft anders - der Bonus
    // wirkt in der Partie, nicht nur in der Abfrage.
    assert.ok(mit.welt.spielerVon('ki1').gesammelt.holz !== ohne.welt.spielerVon('ki1').gesammelt.holz);
  } finally {
    delete HAEUSER.probe;
  }
});
