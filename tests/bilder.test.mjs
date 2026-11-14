// Die gerenderten Bilder (→ specs/10-strategie/darstellung.md AC-17, AC-18 und
// AC-23, ADR-0016).
//
// Ohne Blender und ohne Browser pruefbar ist, ob das, was eingecheckt ist,
// zusammenpasst: jede Tafel so gross, wie ihre Beschreibung sagt, die Maske
// deckungsgleich, und zu jedem Bild ein Modell als Skript.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { beschreibungBilder, bestandLesen, bildmasse, modelleWaehlen, quellenPruefen, quellenZeilen, verzeichnisPruefen } from '../scripts/bilder-verzeichnis.mjs';

const ordner = new URL('../public/bilder/', import.meta.url);
const grafik = new URL('../grafik/', import.meta.url);

/** Breite, Hoehe und Durchsicht aus dem Kopf einer Tafel. */
const masse = (datei) => bildmasse(readFileSync(new URL(datei, ordner)));

const beschreibungen = readdirSync(ordner).filter((n) => n.endsWith('.json'))
  .map((n) => ({ name: n.replace(/\.json$/, ''), ...JSON.parse(readFileSync(new URL(n, ordner), 'utf8')) }));

test('darstellung AC-17: Dorfbewohner, Haus und Baum liegen als gerenderte Tafeln vor', () => {
  const namen = beschreibungen.map((b) => b.name);
  for (const name of ['dorfbewohner', 'haus', 'baum']) assert.ok(namen.includes(name), `${name} fehlt unter public/bilder/`);
});

test('darstellung AC-17: jede Tafel ist so gross, wie ihre Beschreibung sagt, und hat Durchsicht', () => {
  for (const b of beschreibungen) {
    const bild = masse(b.bild);
    assert.equal(bild.breite, b.zelle[0] * b.spalten, `${b.bild}: Breite`);
    assert.equal(bild.hoehe, b.zelle[1] * b.zeilen, `${b.bild}: Hoehe`);
    // Ohne Durchsicht staende jedes Stueck in einem Kasten. Nur der Boden
    // deckt seine Kachel mit Absicht ganz (darstellung AC-23).
    if (b.art !== 'boden') assert.ok(bild.durchsicht, `${b.bild}: keine Durchsicht`);
    assert.ok(b.fuss[0] > 0 && b.fuss[0] < b.zelle[0] && b.fuss[1] > 0 && b.fuss[1] <= b.zelle[1], `${b.name}: Fusspunkt ausserhalb der Zelle`);
    if (b.maske) {
      const maske = masse(b.maske);
      assert.deepEqual([maske.breite, maske.hoehe], [bild.breite, bild.hoehe], `${b.maske} deckt sich nicht mit ${b.bild}`);
    }
    // Ein Ablauf mit eigener Tafel: dieselbe Zelle, dieselben Zeilen, so viele
    // Spalten, wie er Bilder hat.
    for (const [name, ablauf] of Object.entries(b.ablaeufe || {}).filter(([, a]) => a.bild)) {
      const teil = masse(ablauf.bild);
      // Eine knapp geschnittene Tafel nennt ihre eigene Zelle und ihren Fuss.
      const zelle = ablauf.zelle || b.zelle;
      const fuss = ablauf.fuss || b.fuss;
      const spalten = Math.max(...Object.values(b.ablaeufe).filter((a) => a.bild === ablauf.bild).map((a) => a.spalte + a.bilder));
      assert.equal(teil.breite, zelle[0] * spalten, `${ablauf.bild}: Breite`);
      assert.equal(teil.hoehe, zelle[1] * b.zeilen, `${ablauf.bild}: Hoehe`);
      assert.ok(fuss[0] > 0 && fuss[0] < zelle[0] && fuss[1] > 0 && fuss[1] <= zelle[1], `${ablauf.bild}: Fusspunkt ausserhalb der Zelle`);
      assert.ok(teil.durchsicht, `${ablauf.bild}: keine Durchsicht`);
      // Der Schlagschatten von Mauer und Tor ist eine eigene Tafel ohne
      // Spielerfarbe - er hat nie eine Maske.
      if (name === 'schatten') assert.equal(ablauf.maske, null, `${b.name}: ein Schatten traegt keine Farbe`);
      else assert.equal(Boolean(ablauf.maske), Boolean(b.maske), `${b.name}, ${name}: Maske wie die Haupttafel`);
      if (ablauf.maske) {
        const maske = masse(ablauf.maske);
        assert.deepEqual([maske.breite, maske.hoehe], [teil.breite, teil.hoehe], `${ablauf.maske} deckt sich nicht mit ${ablauf.bild}`);
      }
    }
  }
});

test('darstellung AC-17: der Dorfbewohner steht und geht in acht Blickrichtungen', () => {
  const figur = beschreibungen.find((b) => b.name === 'dorfbewohner');
  assert.equal(figur.richtungen, 8);
  assert.equal(figur.zeilen, 8, 'eine Zeile je Blickrichtung');
  assert.equal(figur.ablaeufe.stehen.bilder, 1);
  assert.ok(figur.ablaeufe.gehen.bilder >= 8, 'Gehen ist ein Ablauf aus mindestens acht Bildern');
  assert.equal(figur.spalten, figur.ablaeufe.stehen.bilder + figur.ablaeufe.gehen.bilder);
  assert.ok(figur.maske, 'die Spielerfarbe kommt als Maske');
});

test('darstellung AC-17: zu jedem Bild gibt es das Modell als Skript', () => {
  for (const b of beschreibungen) assert.ok(existsSync(new URL(`${b.name}.py`, grafik)), `grafik/${b.name}.py fehlt`);
});

// ---------------------------------------------------------------------------
// Das Verzeichnis der Kette (darstellung AC-18): welches Skript erzeugt welches
// Bild. Geprueft wird der Bestand auf der Platte - und an gestellten
// Bestaenden, dass die Pruefung jeden der Faelle auch wirklich beanstandet.
// ---------------------------------------------------------------------------

const bestand = bestandLesen();
// Ein Bestand zum Verstellen: tief kopiert, damit kein Fall den naechsten faerbt.
const gestellt = (aendern) => {
  const kopie = structuredClone(bestand);
  aendern(kopie);
  return kopie;
};

test('darstellung AC-18: jede Rastergrafik unter public/bilder/ steht mit ihrem Skript im Verzeichnis', () => {
  assert.deepEqual(verzeichnisPruefen(bestand), []);
  // Nicht leer gruen: die Stuecke der Probe und der Marktkarren stehen darin.
  const namen = bestand.verzeichnis.modelle.map((m) => m.name);
  for (const name of ['dorfbewohner', 'haus', 'baum', 'marktkarren']) assert.ok(namen.includes(name), `${name} fehlt im Verzeichnis`);
  assert.ok(bestand.bilddateien.filter((d) => !d.endsWith('.json')).length >= 7, 'unter public/bilder/ liegen die Tafeln und ihre Masken');
});

test('darstellung AC-18: ein Bild ohne Eintrag wird beanstandet', () => {
  const funde = verzeichnisPruefen(gestellt((b) => b.bilddateien.push('drache.webp')));
  assert.equal(funde.length, 1);
  assert.match(funde[0], /drache\.webp: Bild ohne Eintrag/);
  // Auch eine Maske, die niemand nennt, ist ein Bild ohne Eintrag.
  const ohneMaske = verzeichnisPruefen(gestellt((b) => {
    b.verzeichnis.modelle.find((m) => m.name === 'haus').bilder = ['haus.webp'];
  }));
  assert.ok(ohneMaske.some((f) => /haus-maske\.webp: Bild ohne Eintrag/.test(f)), ohneMaske.join('\n'));
});

test('darstellung AC-18: ein Eintrag ohne Bild wird beanstandet', () => {
  const funde = verzeichnisPruefen(gestellt((b) => {
    b.verzeichnis.modelle.push({ name: 'drache', skript: 'haus.py', bilder: ['drache.webp'] });
  }));
  assert.ok(funde.some((f) => /drache: Eintrag ohne Bild/.test(f)), funde.join('\n'));
  // Ein Bild, das von der Platte verschwindet, faellt genauso auf.
  const geloescht = verzeichnisPruefen(gestellt((b) => {
    b.bilddateien = b.bilddateien.filter((d) => d !== 'baum.webp');
  }));
  assert.ok(geloescht.some((f) => /baum: Eintrag ohne Bild/.test(f)), geloescht.join('\n'));
});

test('darstellung AC-18: die Tafel eines Ablaufs zaehlt zu den Bildern ihres Modells', () => {
  // Angreifen und Sterben liegen in eigenen Tafeln; die Beschreibung nennt sie
  // am Ablauf, das Verzeichnis in der Liste des Modells.
  const reiter = bestand.beschreibungen.spaeherreiter;
  assert.ok(beschreibungBilder(reiter).includes('spaeherreiter-angreifen.webp'));
  assert.ok(beschreibungBilder(reiter).includes('spaeherreiter-sterben-maske.webp'));
  const vergessen = verzeichnisPruefen(gestellt((b) => {
    const modell = b.verzeichnis.modelle.find((m) => m.name === 'spaeherreiter');
    modell.bilder = modell.bilder.filter((d) => d !== 'spaeherreiter-sterben.webp');
  }));
  assert.ok(vergessen.some((f) => /spaeherreiter-sterben\.webp: Bild ohne Eintrag/.test(f)), vergessen.join('\n'));
  assert.ok(vergessen.some((f) => /spaeherreiter: das Verzeichnis nennt/.test(f)), vergessen.join('\n'));
});

test('darstellung AC-18: ein Eintrag ohne Skript und ein Bild mit zwei Skripten werden beanstandet', () => {
  const ohneSkript = verzeichnisPruefen(gestellt((b) => {
    b.grafikdateien = b.grafikdateien.filter((d) => d !== 'baum.py');
  }));
  assert.deepEqual(ohneSkript, ['baum: das Skript grafik/baum.py fehlt']);
  const doppelt = verzeichnisPruefen(gestellt((b) => {
    b.verzeichnis.modelle.find((m) => m.name === 'baum').bilder.push('haus.webp');
  }));
  assert.ok(doppelt.some((f) => /haus\.webp steht bei haus und bei baum/.test(f)), doppelt.join('\n'));
});

test('darstellung AC-18: die Tafeln liegen als WebP vor, und der Kopf wird in jeder Fassung richtig gelesen', () => {
  // Gemessen am 2026-11-10: WebP mit Guete 90 ist ein Drittel so gross wie PNG
  // (docs/strategie/bildumbau.md). Ein PNG unter public/bilder/ waere ein
  // Rueckfall - oder ein Wegwerfbild, das nicht hierher gehoert.
  for (const datei of bestand.bilddateien.filter((d) => !d.endsWith('.json'))) {
    assert.match(datei, /\.webp$/, `public/bilder/${datei} ist kein WebP`);
    assert.equal(masse(datei).art, 'webp', `public/bilder/${datei} heisst nur so`);
  }
  // Der Kopfleser an gestellten Koepfen - die eingecheckten Tafeln sind alle
  // von einer Fassung, die anderen zwei kaemen sonst nie dran.
  const kopf = (teil, fuellen) => {
    const k = Buffer.alloc(32);
    k.write('RIFF', 0, 'latin1');
    k.write('WEBP', 8, 'latin1');
    k.write(teil, 12, 'latin1');
    fuellen(k);
    return k;
  };
  const erweitert = kopf('VP8X', (k) => {
    k[20] = 0x10;
    k.writeUIntLE(1296 - 1, 24, 3);
    k.writeUIntLE(1024 - 1, 27, 3);
  });
  assert.deepEqual(bildmasse(erweitert), { art: 'webp', breite: 1296, hoehe: 1024, durchsicht: true });
  const verlustfrei = kopf('VP8L', (k) => {
    k[20] = 0x2f;
    k.writeUInt32LE(((400 - 1) | ((330 - 1) << 14) | (1 << 28)) >>> 0, 21);
  });
  assert.deepEqual(bildmasse(verlustfrei), { art: 'webp', breite: 400, hoehe: 330, durchsicht: true });
  const einfach = kopf('VP8 ', (k) => {
    k.writeUInt16LE(300, 26);
    k.writeUInt16LE(240, 28);
  });
  assert.deepEqual(bildmasse(einfach), { art: 'webp', breite: 300, hoehe: 240, durchsicht: false });
  assert.throws(() => bildmasse(Buffer.from('GIF89a..........................')), /weder WebP noch PNG/);
});

test('darstellung AC-18: npm run bilder rendert, was im Verzeichnis steht - und nichts anderes', () => {
  const alle = bestand.verzeichnis.modelle.map((m) => m.name);
  assert.deepEqual(modelleWaehlen(bestand.verzeichnis), alle);
  assert.deepEqual(modelleWaehlen(bestand.verzeichnis, ['baum']), ['baum']);
  assert.throws(() => modelleWaehlen(bestand.verzeichnis, ['drache']), /Kein Modell "drache"/);
  // Die Kette in Blender liest dieselbe Datei und fuehrt keine zweite Liste.
  const kette = readFileSync(new URL('bilder.py', grafik), 'utf8');
  assert.match(kette, /verzeichnis\.json/);
  for (const name of alle) assert.ok(!kette.includes(`'${name}'`), `grafik/bilder.py nennt ${name} noch selbst`);
});

test('darstellung AC-18: der Browser laedt nur Tafeln, die im Verzeichnis stehen', () => {
  const quelle = readFileSync(new URL('../public/bilder.js', import.meta.url), 'utf8');
  const liste = /const NAMEN = \[([^\]]*)\]/.exec(quelle);
  assert.ok(liste, 'public/bilder.js: die Liste NAMEN nicht gefunden');
  const geladen = [...liste[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(geladen.length >= 3);
  const alle = bestand.verzeichnis.modelle.map((m) => m.name);
  for (const name of geladen) assert.ok(alle.includes(name), `public/bilder.js laedt ${name}, das Verzeichnis kennt es nicht`);
});

test('darstellung AC-18: fremdes Material steht mit Herkunft in QUELLEN.md, und nur unter CC0', () => {
  assert.deepEqual(quellenPruefen(bestand), []);
  const kopf = '| Was | Woher | Lizenz |\n| --- | --- | --- |\n';
  // Eine Datei unter grafik/, die kein Skript ist und nirgends steht.
  const fremd = quellenPruefen(gestellt((b) => b.grafikdateien.push('stoffe/eiche.jpg')));
  assert.deepEqual(fremd, ['grafik/stoffe/eiche.jpg ist kein eigenes Skript und steht nicht in grafik/QUELLEN.md']);
  // Eingetragen unter CC0: in Ordnung.
  const eingetragen = gestellt((b) => {
    b.grafikdateien.push('stoffe/eiche.jpg');
    b.quellen = `${kopf}| stoffe/eiche.jpg | ambientcg.com, Wood 051 | CC0 1.0 |\n`;
  });
  assert.deepEqual(quellenPruefen(eingetragen), []);
  assert.deepEqual(quellenZeilen(eingetragen.quellen), [{ was: 'stoffe/eiche.jpg', woher: 'ambientcg.com, Wood 051', lizenz: 'CC0 1.0' }]);
  // Eingetragen unter einer anderen Lizenz oder ohne Herkunft: nicht.
  const andere = quellenPruefen(gestellt((b) => {
    b.grafikdateien.push('stoffe/eiche.jpg');
    b.quellen = `${kopf}| stoffe/eiche.jpg | irgendwo | CC BY 4.0 |\n`;
  }));
  assert.equal(andere.length, 1);
  assert.match(andere[0], /erlaubt ist nur CC0/);
  const ohneHerkunft = quellenPruefen(gestellt((b) => {
    b.quellen = `${kopf}| ein Gesicht | – | CC0 |\n`;
  }));
  assert.deepEqual(ohneHerkunft, ['grafik/QUELLEN.md: ein Gesicht ohne Herkunft']);
});

// ---------------------------------------------------------------------------
// Gelaende und Vorraete (darstellung AC-23). Ohne Browser pruefbar ist der
// Aufbau der Tafeln; was auf den Bildern zu sehen ist - Flaechen, Hoehen,
// Farben, die Naht - und wie der Wald aus den vier Arten gemischt wird, misst
// der Browserlauf (e2e/tests/strategie-bildprobe.spec.mjs).
// ---------------------------------------------------------------------------

const von = (name) => beschreibungen.find((b) => b.name === name);

test('darstellung AC-23: Baeume in vier Arten, Beeren, Gold und Stein in vier Fuellstufen', () => {
  const baum = von('baum');
  assert.ok(baum.arten.length >= 4, 'mindestens vier Baumarten');
  assert.equal(new Set(baum.arten).size, baum.arten.length, 'keine Art doppelt');
  assert.equal(baum.zeilen, baum.arten.length, 'eine Zeile je Art');
  assert.ok(baum.gestalten >= 3, 'je Art mehrere Gestalten');
  assert.equal(baum.spalten, baum.gestalten);
  for (const name of ['beere', 'gold', 'stein']) {
    const vorrat = von(name);
    assert.ok(vorrat, `${name} fehlt unter public/bilder/`);
    assert.equal(vorrat.stufen, 4, `${name}: der Server kennt vier Viertel, die Tafel hat sie als Zeilen`);
    assert.equal(vorrat.zeilen, vorrat.stufen);
    assert.ok(vorrat.gestalten >= 3, `${name}: mehrere Gestalten`);
    assert.equal(vorrat.spalten, vorrat.gestalten);
    assert.equal(vorrat.maske, null, `${name} traegt keine Spielerfarbe`);
  }
});

test('darstellung AC-23: der Boden liegt in fuenf Texturen vor, die sich in jedem Massstab ohne Rest wiederholen', () => {
  const boden = von('boden');
  assert.ok(boden, 'boden fehlt unter public/bilder/');
  assert.deepEqual(boden.arten, ['gras', 'erde', 'waldboden', 'sand', 'wasser']);
  assert.equal(boden.zeilen, boden.arten.length);
  // Die Zelle traegt oben und unten einen Saum aus der eigenen Wiederholung,
  // damit die Bildkodierung nicht die Nachbarkachel hineinzieht.
  const [breite, hoehe] = boden.kachel;
  assert.deepEqual(boden.zelle, [breite + 2 * boden.saum[0], hoehe + 2 * boden.saum[1]]);
  assert.ok(boden.zeilen === 1 || boden.saum[1] >= 16, 'Kacheln untereinander brauchen einen Saum');
  // Eine Kachel ist eine ganze Zahl von Feldern breit und halb so hoch - so
  // sieht die Kamera ein Quadrat am Boden.
  assert.equal(breite % boden.feldbreite, 0);
  assert.equal(breite, hoehe * 2);
  // Der Browser verkleinert sie fuer seine drei Kachelmassstaebe (0,5 / 1 / 2
  // bei 44 Bildpunkten je Feld): die Kanten muessen dabei ganze Bildpunkte
  // bleiben, sonst wiederholt sich das Muster mit einer Naht.
  for (const massstab of [0.5, 1, 2]) {
    const faktor = (massstab * 44) / boden.feldbreite;
    assert.ok(Number.isInteger(breite * faktor) && Number.isInteger(hoehe * faktor), `Massstab ${massstab}: ${breite * faktor} x ${hoehe * faktor}`);
  }
  // Was die Kette beim Rendern selbst gemessen hat: Rand gegen Rand, im
  // Verhaeltnis zu zwei Nachbarn mitten in der Kachel. 1 heisst keine Naht.
  for (const art of boden.arten) {
    assert.ok(boden.naht[art] < 1.5, `${art}: Naht ${boden.naht[art]}`);
    assert.equal(boden.mittel[art].length, 3);
  }
  // Erdig statt bunt (darstellung AC-13 gilt weiter): das Gras ist oliv - mehr
  // Gruen als Rot, mehr Rot als Blau - und nicht hell.
  const [r, g, b] = boden.mittel.gras;
  assert.ok(g > r && r > b, `Gras im Mittel ${boden.mittel.gras}`);
  assert.ok(g < 130, `Gras im Mittel ${boden.mittel.gras}: zu hell`);
});

test('darstellung AC-28: Pfeil und Stein kommen aus einer Tafel - ein Pfeil, der Stein in mehreren Lagen, ohne Spielerfarbe, und der Browser laedt und zeichnet sie', () => {
  const geschoss = von('geschoss');
  assert.ok(geschoss, 'geschoss fehlt unter public/bilder/');
  assert.equal(geschoss.zeilen, 1);
  assert.equal(geschoss.pfeil, 0);
  assert.ok(geschoss.steine.length >= 4, 'der Stein ueberschlaegt sich in mehreren Lagen');
  assert.equal(geschoss.spalten, 1 + geschoss.steine.length);
  assert.ok(!geschoss.steine.includes(geschoss.pfeil));
  assert.equal(geschoss.maske, null, 'ein Geschoss traegt keine Spielerfarbe');
  // Die Spitze des Pfeils liegt auf dem Fusspunkt, der Schaft links davon:
  // rechts vom Fuss bleibt nur der Rand der Zelle.
  assert.ok(geschoss.fuss[0] > geschoss.zelle[0] / 2);
  const laden = readFileSync(new URL('../public/bilder.js', import.meta.url), 'utf8');
  const geladen = [...(/const NAMEN = \[([^\]]*)\]/.exec(laden)?.[1] || '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(geladen.includes('geschoss'), 'public/bilder.js laedt geschoss nicht');
  const ansicht = readFileSync(new URL('../public/ansicht.js', import.meta.url), 'utf8');
  assert.match(ansicht, /gerendert\('geschoss'\)/);
});

// --- Gebaeude und Einheiten aus den Daten (darstellung AC-22, AC-24) --------
const { EINHEITEN, GEBAEUDE, TIERE } = createRequire(import.meta.url)('../server/spiele/strategie/daten.js');
const geladeneNamen = () => {
  const laden = readFileSync(new URL('../public/bilder.js', import.meta.url), 'utf8');
  return [...(/const NAMEN = \[([^\]]*)\]/.exec(laden)?.[1] || '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
};

test('darstellung AC-22: jedes Gebaeude der Daten hat eine Tafel, jede Groesse eine Baustelle in vier Stufen, und der Browser laedt sie', () => {
  const geladen = geladeneNamen();
  for (const art of Object.keys(GEBAEUDE)) {
    const tafel = von(art);
    assert.ok(tafel, `${art}: keine Tafel unter public/bilder/`);
    assert.equal(tafel.art, 'gebaeude', `${art}: die Tafel ist kein Gebaeude`);
    assert.ok(geladen.includes(art), `public/bilder.js laedt ${art} nicht`);
    // Die Spielerfarbe steht als Maske ueber dem Bild (AC-21).
    assert.ok(tafel.maske, `${art}: keine Maske fuer die Spielerfarbe`);
  }
  for (const groesse of new Set(Object.values(GEBAEUDE).map((g) => g.groesse || 1))) {
    const geruest = von(`baustelle-${groesse}`);
    assert.ok(geruest, `keine Baustelle fuer Gebaeude der Groesse ${groesse}`);
    assert.ok(geruest.stufen >= 4, `baustelle-${groesse}: ${geruest.stufen} Stufen`);
    assert.equal(geruest.spalten, geruest.stufen, `baustelle-${groesse}: eine Spalte je Stufe`);
    assert.ok(geladen.includes(`baustelle-${groesse}`), `public/bilder.js laedt baustelle-${groesse} nicht`);
  }
  // Die Mauer besteht aus Stuecken: ein Pfeiler, ein Arm je Nachbar, ein Lauf
  // je Achse - und ihr Schatten liegt als eigene Tafel in derselben Ordnung.
  const mauer = von('steinmauer');
  assert.equal(mauer.teile.arme.length, 8, 'Mauer: ein Arm je Nachbarrichtung');
  assert.equal(mauer.teile.laeufe.length, 4, 'Mauer: ein Lauf je Achse');
  const spalten = [mauer.teile.pfeiler, ...mauer.teile.arme.map((a) => a.spalte), ...mauer.teile.laeufe.map((l) => l.spalte)];
  assert.deepEqual([...spalten].sort((a, b) => a - b), Array.from({ length: mauer.spalten }, (_, i) => i), 'Mauer: jede Spalte ist genau ein Stueck');
  assert.ok(mauer.ablaeufe.schatten.bild, 'Mauer: kein Schatten');
  // Das Tor steht in zwei Richtungen, zu und offen.
  const tor = von('tor');
  assert.deepEqual([tor.zeilen, tor.spalten], [tor.ausrichtungen.length, tor.zustaende.length], 'Tor: Richtungen mal Zustaende');
  assert.deepEqual(tor.zustaende, ['zu', 'offen']);
  // Die Farm leert sich in Stufen (AC-3).
  assert.ok(von('farm').stufen >= 4 && von('farm').zeilen === von('farm').stufen, 'Farm: eine Zeile je Stufe');
});

test('darstellung AC-24: jede Einheit und jedes Tier der Daten hat eine Tafel mit acht Richtungen, und der Browser laedt sie', () => {
  const geladen = geladeneNamen();
  for (const art of [...Object.keys(EINHEITEN), ...Object.keys(TIERE)]) {
    const tafel = von(art);
    assert.ok(tafel, `${art}: keine Tafel unter public/bilder/`);
    assert.equal(tafel.zeilen, 8, `${art}: ${tafel.zeilen} Blickrichtungen`);
    assert.ok(geladen.includes(art), `public/bilder.js laedt ${art} nicht`);
  }
});

test('darstellung AC-23: der Browser nimmt Baum, Beere, Gold, Stein und Boden aus den Tafeln', () => {
  const laden = readFileSync(new URL('../public/bilder.js', import.meta.url), 'utf8');
  const geladen = [...(/const NAMEN = \[([^\]]*)\]/.exec(laden)?.[1] || '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
  for (const name of ['baum', 'beere', 'gold', 'stein', 'boden']) assert.ok(geladen.includes(name), `public/bilder.js laedt ${name} nicht`);
  const gelaende = readFileSync(new URL('../public/gelaende.js', import.meta.url), 'utf8');
  assert.match(gelaende, /\[WALD\]: 'baum', \[BEERE\]: 'beere', \[GOLD\]: 'gold', \[STEIN\]: 'stein'/);
  assert.match(readFileSync(new URL('../public/boden.js', import.meta.url), 'utf8'), /gerendert\('boden'\)/);
});
