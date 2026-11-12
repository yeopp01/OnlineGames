// Die Bildprobe (→ specs/10-strategie/darstellung.md AC-17, AC-23, ADR-0016):
// gerenderte Stuecke neben ihren gezeichneten Vorgaengern, dazu Gelaende und
// Vorraete. An diesem Bild entscheidet der Benutzer, ob der Umbau weitergeht.
//
// Die Seite bewegt sich: die Figuren gehen. Mit `?still=1` steht die Zeit -
// so nimmt der Browserlauf ein Bild auf, das sich nicht von Lauf zu Lauf
// aendert.

import { figurZeichnen } from './figuren.js';
import { gebaeudeZeichnen } from './gebaeude.js';
import { WALD, dingZeichnen } from './gelaende.js';
import { ablaeufeLaden, ablaufZelle, bilderEin, figurZelle, gerendert, richtungAus, zelleZeichnen } from './bilder.js';

const HALB_B = 22;          // halbe Rautenbreite bei Zoom 1, wie im Spielbild
const FIGUR_HOEHE = 1.3;
const STARTZOOM = 1.5;
const BLAU = '#4a90d9';
const ROT = '#d94a4a';
const GRAS = '#56622f';
const SCHRIFT = '600 13px system-ui, sans-serif';
const STILL = new URLSearchParams(location.search).has('still');

const figurHoehe = (zoom) => HALB_B * FIGUR_HOEHE * zoom;
const zeit = () => (STILL ? 1.3 : performance.now() / 1000);
// Derselbe Takt wie im Spielbild: ein Doppelschritt in rund 0,7 Sekunden.
const phase = (versatz = 0) => zeit() * 1000 / 110 + versatz;
const stufe = (p) => Math.floor(((p % (Math.PI * 2)) / (Math.PI * 2)) * 8) % 8;

function blatt(id) {
  const leinwand = document.getElementById(id);
  const dichte = window.devicePixelRatio || 1;
  const breite = leinwand.width;
  const hoehe = leinwand.height;
  leinwand.width = breite * dichte;
  leinwand.height = hoehe * dichte;
  const stift = leinwand.getContext('2d');
  stift.scale(dichte, dichte);
  return { stift, breite, hoehe };
}

function grund(b) {
  b.stift.fillStyle = GRAS;
  b.stift.fillRect(0, 0, b.breite, b.hoehe);
}

function schrift(stift, text, x, y, hell = 0.92) {
  stift.font = SCHRIFT;
  stift.fillStyle = `rgba(255, 255, 255, ${hell})`;
  stift.fillText(text, x, y);
}

function trennung(b, x) {
  b.stift.fillStyle = 'rgba(0, 0, 0, 0.28)';
  b.stift.fillRect(x - 1, 0, 2, b.hoehe);
}

function gerenderteFigur(stift, x, y, zoom, farbe, richtung, schritt) {
  const tafel = gerendert('dorfbewohner');
  if (!tafel) return;
  const zelle = figurZelle(tafel, richtung, schritt, 8);
  zelleZeichnen(stift, tafel, zelle.zeile, zelle.spalte, x, y, figurHoehe(zoom) / tafel.hoehe, farbe);
}

function gerendertesHaus(stift, x, y, zoom, farbe) {
  const tafel = gerendert('haus');
  if (tafel) zelleZeichnen(stift, tafel, 0, 0, x, y, (2 * HALB_B * zoom) / tafel.feldbreite, farbe);
}

function gerenderterBaum(stift, x, y, zoom, gestalt) {
  const tafel = gerendert('baum');
  if (tafel) zelleZeichnen(stift, tafel, 0, gestalt % tafel.gestalten, x, y, (2 * HALB_B * zoom) / tafel.feldbreite, null);
}

function gerenderterKarren(stift, x, y, zoom, farbe, richtung, schritt) {
  const tafel = gerendert('marktkarren');
  if (!tafel) return;
  const zelle = figurZelle(tafel, richtung, schritt, 8);
  zelleZeichnen(stift, tafel, zelle.zeile, zelle.spalte, x, y, (2 * HALB_B * zoom) / tafel.feldbreite, farbe);
}

// Die Einheiten, die schon gerendert sind (darstellung AC-24): je Einheit ein
// Band auf dem Blatt. `weit` ist der Abstand zwischen zwei Figuren bei Zoom 2.
// `schlag` nennt den Ablauf, mit dem sie zuschlaegt - der Dorfbewohner
// arbeitet, das Schaf tut nichts dergleichen; `ladungen`: was sie in den acht
// Richtungen traegt; `hoch`: die Figurenhoehe, wo sie nicht die uebliche ist;
// `zoom` und `luft`: die Geraete sind breit - sie stehen kleiner im Band und
// mit Abstand vor der Spielgroesse, sonst liegen die Truemmer darauf.
const EINHEITEN = [
  { art: 'dorfbewohner', titel: 'Dorfbewohner', weit: 96, schlag: 'arbeiten', schlagTitel: 'Arbeiten', ladungen: [null, 'h', 'n', 'g', 's', null, 'h', 'g'] },
  { art: 'miliz', titel: 'Miliz', weit: 96 },
  { art: 'soldat', titel: 'Soldat', weit: 96 },
  { art: 'speerkaempfer', titel: 'Speerkämpfer', weit: 104 },
  { art: 'bogenschuetze', titel: 'Bogenschütze', weit: 96 },
  { art: 'plaenkler', titel: 'Plänkler', weit: 96 },
  { art: 'armbrustschuetze', titel: 'Armbrustschütze', weit: 96 },
  { art: 'spaeherreiter', titel: 'Späherreiter', weit: 118 },
  { art: 'ritter', titel: 'Ritter', weit: 118 },
  { art: 'moench', titel: 'Mönch', weit: 96, schlagTitel: 'Heilen und Bekehren' },
  { art: 'ramme', titel: 'Ramme', weit: 108, zoom: 1.35, luft: 44 },
  { art: 'mangonel', titel: 'Mangonel', weit: 108, zoom: 1.35, luft: 44 },
  { art: 'schaf', titel: 'Schaf', weit: 80, hoch: 0.9, schlag: null },
];
const BAND = 330;
document.getElementById('probe-einheiten').height = EINHEITEN.length * BAND;

function gerenderteEinheit(stift, art, x, y, zoom, farbe, richtung, ablauf, anteil, hoch = FIGUR_HOEHE) {
  const tafel = gerendert(art);
  if (!tafel) return;
  const zelle = ablaufZelle(tafel, richtung, ablauf, anteil);
  // Derselbe Massstab wie im Spielbild: Figurenhoehe durch die Hoehe, die die Tafel nennt.
  zelleZeichnen(stift, zelle.quelle, zelle.zeile, zelle.spalte, x, y, (HALB_B * hoch * zoom) / tafel.hoehe, farbe);
}

const blaetter = {
  einheiten: blatt('probe-einheiten'),
  figur: blatt('probe-figur'),
  haus: blatt('probe-haus'),
  baum: blatt('probe-baum'),
  szene: blatt('probe-szene'),
  karren: blatt('probe-karren'),
  gelaende: blatt('probe-gelaende'),
};

function figurMalen(b) {
  const s = b.stift;
  grund(b);
  trennung(b, 340);
  schrift(s, 'gezeichnet (bisher) – zwei Blickrichtungen, gespiegelt', 16, 24);
  schrift(s, 'gerendert (neu) – acht Blickrichtungen, im Gehen', 360, 24);
  schrift(s, 'Zoom 3', 16, 48, 0.6);
  schrift(s, 'Spielgröße beim Start', 16, 228, 0.6);
  const p = phase();
  [[70, 1, BLAU], [165, -1, BLAU], [260, 1, ROT]].forEach(([x, blick, farbe]) => {
    figurZeichnen(s, 'dorfbewohner', x, 170, figurHoehe(3), farbe, { blick, schritt: p });
    figurZeichnen(s, 'dorfbewohner', x, 296, figurHoehe(STARTZOOM), farbe, { blick, schritt: p });
  });
  for (let richtung = 0; richtung < 8; richtung += 1) {
    const x = 410 + richtung * 94;
    gerenderteFigur(s, x, 170, 3, richtung < 5 ? BLAU : ROT, richtung, stufe(p));
    gerenderteFigur(s, x, 296, STARTZOOM, richtung < 5 ? BLAU : ROT, richtung, stufe(p));
  }
}

function hausMalen(b) {
  const s = b.stift;
  grund(b);
  trennung(b, 580);
  schrift(s, 'gezeichnet (bisher)', 16, 24);
  schrift(s, 'gerendert (neu)', 600, 24);
  gebaeudeZeichnen(s, 'haus', 190, 290, HALB_B * 3, BLAU, 2);
  gebaeudeZeichnen(s, 'haus', 460, 220, HALB_B * STARTZOOM, ROT, 2);
  gerendertesHaus(s, 760, 290, 3, BLAU);
  gerendertesHaus(s, 1030, 220, STARTZOOM, ROT);
  schrift(s, 'Zoom 3', 16, 48, 0.6);
  schrift(s, 'Spielgröße beim Start', 400, 120, 0.6);
  schrift(s, 'Spielgröße beim Start', 965, 120, 0.6);
}

function baumMalen(b) {
  const s = b.stift;
  grund(b);
  trennung(b, 580);
  schrift(s, 'gezeichnet (bisher)', 16, 24);
  schrift(s, 'gerendert (neu) – vier Gestalten', 600, 24);
  for (let i = 0; i < 4; i += 1) {
    dingZeichnen(s, WALD, 80 + i * 130, 250, HALB_B * 2, i * 7 + 3, 1);
    gerenderterBaum(s, 660 + i * 125, 250, 2, i);
  }
}

// Eine kleine Szene in Spielgroesse, zweimal dieselbe: links gezeichnet,
// rechts gerendert. Vier Dorfbewohner gehen im Kreis um das Haus.
const BAEUME = [[70, 150, 0], [125, 118, 1], [185, 92, 2], [250, 70, 3], [105, 205, 2], [40, 230, 1], [500, 120, 0], [545, 165, 3]];

function szeneMalen(b) {
  const s = b.stift;
  grund(b);
  const zoom = STARTZOOM;
  const t = zeit();
  for (const seite of [0, 1]) {
    const x0 = seite * 580;
    s.save();
    s.beginPath();
    s.rect(x0, 0, 580, b.hoehe);
    s.clip();
    const dinge = [];
    for (const [x, y, gestalt] of BAEUME) {
      dinge.push({ y, malen: () => (seite ? gerenderterBaum(s, x0 + x, y, zoom, gestalt) : dingZeichnen(s, WALD, x0 + x, y, HALB_B * zoom, gestalt * 7 + 3, 1)) });
    }
    dinge.push({ y: 245, malen: () => (seite ? gerendertesHaus(s, x0 + 320, 245, zoom, BLAU) : gebaeudeZeichnen(s, 'haus', x0 + 320, 245, HALB_B * zoom, BLAU, 2)) });
    for (let i = 0; i < 4; i += 1) {
      const w = t * 0.35 + i * Math.PI / 2;
      const x = 320 + Math.cos(w) * 190;
      const y = 275 + Math.sin(w) * 95;
      const dx = -Math.sin(w) * 190;
      const dy = Math.cos(w) * 95;
      const p = phase(i * 1.7);
      const farbe = i === 3 ? ROT : BLAU;
      dinge.push({
        y,
        malen: () => (seite
          ? gerenderteFigur(s, x0 + x, y, zoom, farbe, richtungAus(dx, dy), stufe(p))
          : figurZeichnen(s, 'dorfbewohner', x0 + x, y, figurHoehe(zoom), farbe, { blick: dx < 0 ? -1 : 1, schritt: p })),
      });
    }
    dinge.sort((a, c) => a.y - c.y).forEach((d) => d.malen());
    s.restore();
    schrift(s, seite ? 'gerendert (neu)' : 'gezeichnet (bisher)', x0 + 16, 24);
  }
  trennung(b, 580);
}

// Der Marktkarren: acht Blickrichtungen im Gehen, gross und in Spielgroesse;
// ein Dorfbewohner steht daneben, damit man das Verhaeltnis sieht.
function karrenMalen(b) {
  const s = b.stift;
  grund(b);
  schrift(s, 'gerendert (neu) – acht Blickrichtungen, im Gehen', 16, 24);
  schrift(s, 'Zoom 2,5', 16, 48, 0.6);
  schrift(s, 'Spielgröße beim Start', 16, 498, 0.6);
  const p = phase();
  for (let richtung = 0; richtung < 8; richtung += 1) {
    const farbe = richtung < 5 ? BLAU : ROT;
    gerenderterKarren(s, 150 + (richtung % 4) * 285, richtung < 4 ? 185 : 385, 2.5, farbe, richtung, stufe(p));
    gerenderterKarren(s, 100 + richtung * 132, 585, STARTZOOM, farbe, richtung, stufe(p));
  }
  // Ein Dorfbewohner daneben als Massstab - neben dem letzten Karren, nicht davor.
  gerenderteFigur(s, 1118, 600, STARTZOOM, BLAU, 1, -1);
  gerenderteFigur(s, 1095, 305, 2.5, BLAU, 1, -1);
}

// Gelaende und Vorraete (darstellung AC-23): oben die fuenf Bodentexturen,
// jede zweimal nebeneinander - an der Mitte laege die Naht -, darunter die
// vier Baumarten in ihren Gestalten und die Vorraete von voll bis fast leer.
const BODEN_NAMEN = { gras: 'Gras', erde: 'Erde', waldboden: 'Waldboden', sand: 'Sand', wasser: 'Wasser' };
const BAUM_NAMEN = { eiche: 'Eiche', birke: 'Birke', fichte: 'Fichte', kiefer: 'Kiefer' };

function gelaendeMalen(b) {
  const s = b.stift;
  grund(b);
  const boden = gerendert('boden');
  if (boden) {
    const [breite] = boden.kachel || boden.zelle;
    const hoehe = boden.zelle[1];
    const [saumX, saumY] = boden.saum || [0, 0];
    // Bei Zoom 2: zwei Drittel der gerenderten Groesse.
    const mass = (2 * HALB_B * 2) / boden.feldbreite;
    const stueck = 108;
    boden.arten.forEach((art, zeile) => {
      const x = 16 + zeile * 229;
      for (const seite of [0, 1]) {
        // Links das rechte Ende der Kachel, rechts ihr linkes: so stoesst in
        // der Mitte des Feldes Rand an Rand.
        const sx = saumX + (seite ? 0 : breite - stueck / mass);
        s.drawImage(boden.tafel, sx, zeile * hoehe + saumY + 120, stueck / mass, 150 / mass, x + seite * stueck, 40, stueck, 150);
      }
      schrift(s, BODEN_NAMEN[art] || art, x + 8, 60);
    });
    schrift(s, 'Boden bei Zoom 2 – in der Mitte jedes Feldes stößt der rechte Rand der Kachel an den linken', 16, 24);
  }
  const baeume = gerendert('baum');
  if (baeume) {
    schrift(s, 'Bäume in vier Arten, je vier Gestalten – Zoom 1,5', 16, 226);
    (baeume.arten || []).forEach((art, zeile) => {
      for (let gestalt = 0; gestalt < baeume.gestalten; gestalt += 1) {
        const x = 50 + zeile * 284 + gestalt * 62;
        zelleZeichnen(s, baeume, zeile, gestalt, x, 420, (2 * HALB_B * 1.5) / baeume.feldbreite, null);
      }
      schrift(s, BAUM_NAMEN[art] || art, 30 + zeile * 284, 448, 0.6);
    });
  }
  schrift(s, 'Vorräte in vier Füllstufen, je drei Gestalten – Zoom 2', 16, 486);
  [['beere', 'Beeren'], ['gold', 'Gold'], ['stein', 'Stein']].forEach(([name, titel], spalte) => {
    const tafel = gerendert(name);
    if (!tafel) return;
    const x0 = 16 + spalte * 384;
    schrift(s, titel, x0, 510, 0.6);
    for (let gestalt = 0; gestalt < tafel.gestalten; gestalt += 1) {
      for (let zeile = 0; zeile < tafel.stufen; zeile += 1) {
        zelleZeichnen(s, tafel, zeile, gestalt, x0 + 42 + zeile * 84, 580 + gestalt * 76, (2 * HALB_B * 2) / tafel.feldbreite, null);
      }
    }
  });
  // Das Schaf als Massstab, so gross wie im Spiel bei Zoom 2.
  figurZeichnen(s, 'schaf', 362, 584, Math.max(9, HALB_B * 0.9 * 2), '#888888', {});
}

// Je Einheit: links die bisherige Zeichnung, daneben die acht Blickrichtungen
// im Gehen; darunter der Angriff in vier Richtungen, das Sterben in vier
// Bildern und die Einheit so gross wie beim Start einer Partie.
function einheitenMalen(b) {
  const s = b.stift;
  grund(b);
  EINHEITEN.forEach(({ art, titel, weit, schlag = 'angreifen', schlagTitel = 'Angriff', ladungen, hoch = FIGUR_HOEHE, zoom = 2, luft = 0 }, nummer) => {
    const oben = nummer * BAND;
    if (nummer) {
      s.fillStyle = 'rgba(0, 0, 0, 0.28)';
      s.fillRect(0, oben - 1, b.breite, 2);
    }
    schrift(s, titel, 16, oben + 24);
    schrift(s, 'gezeichnet (bisher)', 16, oben + 44, 0.6);
    schrift(s, `gerendert (neu) – acht Blickrichtungen, im Gehen${ladungen ? ', mit Holz, Nahrung, Gold und Stein' : ''}`, 190, oben + 44, 0.6);
    const p = phase(nummer * 1.7);
    const gehen = stufe(p) / 8;
    const tafel = gerendert(art);
    figurZeichnen(s, art, 80, oben + 160, HALB_B * hoch * zoom, BLAU, { blick: 1, schritt: p });
    for (let richtung = 0; richtung < 8; richtung += 1) {
      const ware = ladungen?.[richtung];
      gerenderteEinheit(s, art, 230 + richtung * weit, oben + 160, zoom, richtung < 5 ? BLAU : ROT, richtung, ware ? `gehen_${ware}` : 'gehen', gehen, hoch);
    }
    if (schlag) {
      schrift(s, schlagTitel, 16, oben + 200, 0.6);
      [1, 3, 5, 7].forEach((richtung, i) => {
        // Steht die Zeit, zeigt jede Spalte einen anderen Augenblick des Schlags.
        const anteil = STILL ? [1, 3, 4, 6][i] / 8 : stufe(p + i * 0.8) / 8;
        gerenderteEinheit(s, art, 80 + i * weit, oben + 305, zoom, i < 2 ? BLAU : ROT, richtung, schlag, anteil, hoch);
      });
    }
    if (tafel?.ablaeufe.kadaver) {
      // Ein geschlachtetes Tier: von voll bis fast leer (einheiten AC-17).
      schrift(s, 'Geschlachtet – von voll bis fast leer', 16, oben + 200, 0.6);
      for (let i = 0; i < tafel.ablaeufe.kadaver.bilder; i += 1) {
        gerenderteEinheit(s, art, 80 + i * weit * 1.4, oben + 305, zoom, BLAU, 1, 'kadaver', (i + 0.5) / tafel.ablaeufe.kadaver.bilder, hoch);
      }
    }
    if (tafel?.ablaeufe.sterben) {
      schrift(s, 'Sterben', 16 + 4 * weit + 30, oben + 200, 0.6);
      [2, 4, 5, 7].forEach((bild, i) => {
        gerenderteEinheit(s, art, 80 + (4 + i) * weit + 30, oben + 305, zoom, BLAU, 1, 'sterben', bild / 8 + 0.01, hoch);
      });
    }
    schrift(s, 'Spielgröße', 16 + 8 * weit + 20 + luft, oben + 200, 0.6);
    [1, 6].forEach((richtung, i) => {
      gerenderteEinheit(s, art, 60 + 8 * weit + 20 + luft + i * (70 + luft), oben + 305, STARTZOOM, i ? ROT : BLAU, richtung, 'gehen', gehen, hoch);
    });
  });
}

function malen() {
  einheitenMalen(blaetter.einheiten);
  figurMalen(blaetter.figur);
  hausMalen(blaetter.haus);
  baumMalen(blaetter.baum);
  szeneMalen(blaetter.szene);
  karrenMalen(blaetter.karren);
  gelaendeMalen(blaetter.gelaende);
  if (!STILL) requestAnimationFrame(malen);
}

bilderEin().then(() => Promise.all(EINHEITEN.map((e) => ablaeufeLaden(e.art)))).then(() => {
  malen();
  // Fuer den Browserlauf: die Seite sagt, wann ihre Bilder gemalt sind.
  window.bildprobe = { fertig: true, tafeln: ['dorfbewohner', 'haus', 'baum'].map((name) => {
    const tafel = gerendert(name);
    return { name, zelle: tafel.zelle, zeilen: tafel.zeilen, spalten: tafel.spalten };
  }), einheiten: EINHEITEN.map((e) => e.art) };
});
