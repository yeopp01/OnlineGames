// Die Haeuser als Daten (→ specs/10-strategie/spielziel.md AC-17,
// fahrplan.md AC-17, docs/adr/0014-haeuser-statt-voelker.md).
//
// Ein Haus ist ein Eintrag in `HAEUSER`; seine Boni haben die Form einer
// Verbesserung und werden dort gelesen, wo die Verbesserungen gelesen werden.
// Diese Tests lesen die Boni aus den Daten - keine Liste im Testkopf -, damit
// ein neuer Bonus in einer bekannten Form von selbst mitgeprueft wird.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE, HAEUSER, VERBESSERUNGEN, STARTAUFSTELLUNG } = require('../server/spiele/strategie/daten.js');
const { partieSpielen } = require('../server/spiele/strategie/pruefstand.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const mitHaus = (haus) => new Welt(ZWEI, 7, { sicht: 'aufgedeckt', haeuser: { a: haus } });

// Die Formen, die E2 liest. Was ein Haus sonst traegt, braucht eine neue
// Lesestelle (E3, spielziel AC-26) - und bricht hier, bis es sie gibt.
const FORMEN = ['wirkung', 'sammeln', 'farm', 'gebaeude'];

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
    const { wirkung = {}, sammeln = {}, farm = {}, gebaeude = {} } = eintrag.boni;

    // Kampfwerte je Art oder Klasse - Anna mit Haus, Bert ohne, dieselbe Welt.
    for (const [schluessel, felder] of Object.entries(wirkung)) {
      const art = artFuer(schluessel);
      assert.ok(art, `${haus}: "${schluessel}" trifft keine Einheit`);
      for (const [feld, zuschlag] of Object.entries(felder)) {
        assert.equal(welt.einheitenwert('a', art, feld) - welt.einheitenwert('b', art, feld), zuschlag, `${haus}: ${art}.${feld}`);
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
    // das von Beginn an steht.
    for (const [feld, wert] of Object.entries(gebaeude)) {
      const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === 'dorfzentrum');
      if (feld === 'lebenAnteil') {
        assert.equal(zentrum.leben, Math.round(GEBAEUDE.dorfzentrum.leben * (1 + wert)), `${haus}: das Dorfzentrum steht mit mehr Leben`);
      } else {
        assert.equal(welt.gebaeudewert('a', 'dorfzentrum', feld) - welt.gebaeudewert('b', 'dorfzentrum', feld), wert, `${haus}: ${feld}`);
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
  // und es sind welche - leer waere der Test sonst gruen. Heute neun
  // (Silberfurt hat bis E3 keinen).
  const blaetter = (o) => Object.values(o).reduce((n, w) => n + (typeof w === 'object' ? blaetter(w) : 1), 0);
  const erwartet = Object.values(HAEUSER).reduce((n, h) => n + blaetter(h.boni), 0);
  assert.equal(geprueft, erwartet);
  assert.ok(erwartet >= 9, `Boni in den Daten: ${erwartet}`);
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

test('spielziel AC-17: die Simulation nennt kein einzelnes Haus', () => {
  // Ein Haus ist ein Eintrag, keine Verzweigung: weder Welt noch KI noch
  // Pruefstand schreiben den Schluessel eines Hauses aus.
  for (const datei of ['welt.js', 'ki.js', 'pruefstand.js']) {
    const quelle = readFileSync(new URL(`../server/spiele/strategie/${datei}`, import.meta.url), 'utf8');
    for (const haus of Object.keys(HAEUSER)) {
      assert.ok(!quelle.toLowerCase().includes(haus), `${datei} nennt ${haus}`);
    }
  }
});

test('fahrplan AC-17: ein sechstes Haus entsteht allein aus Daten und ist spielbar', () => {
  // Das sechste Haus traegt jede Form, die es gibt - als Eintrag, sonst nichts.
  HAEUSER.probe = {
    name: 'Probe', sitz: 'Testland', wahlspruch: 'Nur Daten.',
    boni: {
      wirkung: { dorfbewohner: { leben: 5 } },
      sammeln: { holz: 1.5, gold: 1.5 },
      farm: { nahrung: 100 },
      gebaeude: { lebenAnteil: 0.2 },
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
