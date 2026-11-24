// Die Schautafel (→ specs/10-strategie/darstellung.md AC-6, AC-9): jede Figur
// der aktuellen Stufe nebeneinander, gross und in Spielgroesse, in zwei
// Spielerfarben. Sie ist Bildnachweis und Pruefstueck zugleich - der
// Browserlauf liest `window.schautafel`.
//
// Gezeigt und gemessen wird, was das Spiel zeigt: die gerenderten Bilder
// (ADR-0016), geholt ueber dieselben Funktionen wie im Spielbild. Die Tafel
// wartet deshalb, bis alle Bilder samt den Ablaeufen da sind, und setzt
// `window.schautafel` erst dann.
//
// Alles steht in einem Massstab: eine Ramme ist neben einem Dorfbewohner so
// gross wie im Spiel. Wie breit eine Zelle ist, kommt deshalb aus dem Bild
// selbst (`rahmen`) und nicht aus einer Liste von Hand.
import { ablaeufeLaden, bilderWarten, gerendert } from './bilder.js';
import { FIGUREN, figurBildZeichnen } from './figuren.js';
import { GEBAEUDE, gebaeudeBildZeichnen, gebaeudeSchattenZeichnen } from './gebaeude.js';
import { KACHEL, kachelZeichnen } from './boden.js';
import { figurHoeheBei, tierHoeheBei } from './ansicht.js';

// So gross zeigt und misst die Schautafel jedes Stueck: die Naehe, in der
// das Spiel bis zum 2026-11-24 endete. Das Rad geht seitdem bis 3,6
// (ZOOM_NAH in ansicht.js); die Messungen der Tafel bleiben bei diesem Mass.
const TAFEL_NAH = 2.5;
import {
  BEERE, GOLD, GRAS as BODEN_GRAS, STEIN, WALD, WASSER, dingBildZeichnen, raute,
} from './gelaende.js';

await bilderWarten();
await Promise.all(Object.keys(FIGUREN).map(ablaeufeLaden));

const FARBEN = ['#4a90d9', '#d94a4a'];
const GRAS = '#2f4636';
const SCHRIFT = '#e6e9ee';
const LEISE = '#9aa3b0';
const SALZ = 4711;

const EINTRAEGE = [
  { art: 'dorfbewohner', titel: 'Dorfbewohner', lage: {} },
  { art: 'dorfbewohner', titel: 'trägt Holz', lage: { ladung: 'h' } },
  { art: 'dorfbewohner', titel: 'trägt Nahrung', lage: { ladung: 'n' } },
  { art: 'dorfbewohner', titel: 'trägt Gold', lage: { ladung: 'g' } },
  { art: 'miliz', titel: 'Miliz', lage: {} },
  { art: 'soldat', titel: 'Soldat', lage: {} },
  // Ritterzeit (einheiten AC-33, AC-34).
  { art: 'ritter', titel: 'Ritter', lage: {} },
  { art: 'armbrustschuetze', titel: 'Armbrust', lage: {} },
  // Belagerung (einheiten AC-35).
  { art: 'ramme', titel: 'Ramme', lage: {} },
  { art: 'mangonel', titel: 'Mangonel', lage: {} },
  // Der Moench, stehend und beim Heilen (einheiten AC-37).
  { art: 'moench', titel: 'Mönch', lage: {} },
  { art: 'moench', titel: 'Mönch heilt', lage: { arbeit: 1.2 } },
  // Der Marktkarren (einheiten AC-39).
  { art: 'marktkarren', titel: 'Marktkarren', lage: {} },
  { art: 'spaeherreiter', titel: 'Späherreiter', lage: {} },
  { art: 'speerkaempfer', titel: 'Speerkämpfer', lage: {} },
  { art: 'bogenschuetze', titel: 'Kurzbogen', lage: {} },
  { art: 'plaenkler', titel: 'Plänkler', lage: {} },
  // Die Stufen des Fuerstentums (einheiten AC-58 bis AC-62).
  { art: 'bogenschuetze2', titel: 'Bogenschütze', lage: {} },
  { art: 'langschwertkaempfer', titel: 'Langschwert', lage: {} },
  { art: 'pikenier', titel: 'Pikenier', lage: {} },
  { art: 'eliteplaenkler', titel: 'Eliteplänkler', lage: {} },
  { art: 'leichtekavallerie', titel: 'Leichte Kavallerie', lage: {} },
  // Die Stufen der Krone (einheiten AC-66).
  { art: 'zweihandkaempfer', titel: 'Zweihandkämpfer', lage: {} },
  { art: 'hellebardier', titel: 'Hellebardier', lage: {} },
  { art: 'husar', titel: 'Husar', lage: {} },
  { art: 'kavalier', titel: 'Kavalier', lage: {} },
  { art: 'paladin', titel: 'Paladin', lage: {} },
  // Die Stufen der Schuetzen und der Belagerung (einheiten AC-67, AC-68).
  { art: 'langbogenschuetze', titel: 'Langbogen', lage: {} },
  { art: 'schwerearmbrust', titel: 'Schwere Armbrust', lage: {} },
  { art: 'belagerungsramme', titel: 'Belagerungsramme', lage: {} },
  { art: 'onager', titel: 'Onager', lage: {} },
  // Einheiten der Haeuser (einheiten AC-42 bis AC-44).
  { art: 'eibenschuetze', titel: 'Eibenschütze', lage: {} },
  { art: 'pavesenschuetze', titel: 'Pavesenschütze', lage: {} },
  { art: 'soeldner', titel: 'Söldner', lage: {} },
  // Aus der Burg (einheiten AC-45 bis AC-47).
  { art: 'kriegswolf', titel: 'Kriegswolf', lage: {} },
  { art: 'reiterschuetze', titel: 'Reiterschütze', lage: {} },
  { art: 'riese', titel: 'Riese', lage: {} },
  { art: 'meuchler', titel: 'Meuchler', lage: {} },
  { art: 'wiedergaenger', titel: 'Wiedergänger', lage: {} },
  // Statt des Trebuchets (einheiten AC-52): gerufen, nicht ausgebildet.
  { art: 'drache', titel: 'Drache', lage: {} },
  { art: 'schaf', titel: 'Schaf', lage: {}, tier: true },
  { art: 'schaf', titel: 'Kadaver, halb', lage: { liegt: true, rest: 0.5 }, tier: true },
];

const GEBAEUDE_REIHE = [
  { art: 'dorfzentrum', groesse: 4, titel: 'Dorfzentrum' },
  { art: 'haus', groesse: 2, titel: 'Haus' },
  { art: 'muehle', groesse: 2, titel: 'Mühle' },
  { art: 'holzfaellerlager', groesse: 2, titel: 'Holzfällerlager' },
  { art: 'bergbaulager', groesse: 2, titel: 'Bergbaulager' },
  { art: 'kaserne', groesse: 3, titel: 'Kaserne' },
  { art: 'farm', groesse: 3, titel: 'Farm' },
  // Feudalzeit (bauen AC-24).
  { art: 'schiessanlage', groesse: 3, titel: 'Schießanlage' },
  { art: 'stall', groesse: 3, titel: 'Stall' },
  { art: 'schmiede', groesse: 3, titel: 'Schmiede' },
  // Die Sicht waechst (kampf AC-18).
  { art: 'aussenposten', groesse: 1, titel: 'Außenposten' },
  // Ritterzeit (bauen AC-28).
  { art: 'kloster', groesse: 3, titel: 'Kloster' },
  { art: 'universitaet', groesse: 3, titel: 'Universität' },
  { art: 'belagerungswerkstatt', groesse: 3, titel: 'Werkstatt' },
  // Schiesst (bauen AC-29).
  { art: 'wachturm', groesse: 1, titel: 'Wachturm' },
  { art: 'steinmauer', groesse: 1, titel: 'Steinmauer' },
  // Zu und offen (bauen AC-31).
  // Vier Felder lang, eines tief (bauen AC-37).
  { art: 'tor', groesse: 4, tief: 1, titel: 'Tor' },
  { art: 'tor', groesse: 4, tief: 1, titel: 'Tor, offen', offen: true },
  // Schiesst und gibt Wohnraum (bauen AC-32).
  { art: 'burg', groesse: 4, titel: 'Burg' },
  { art: 'markt', groesse: 4, titel: 'Markt' },
  { art: 'wunder', groesse: 5, titel: 'Wunder' },
  { art: 'haus', groesse: 2, titel: 'Baustelle 20 %', bau: 0.2 },
  { art: 'haus', groesse: 2, titel: 'Baustelle 70 %', bau: 0.7 },
];
// Wie viele Felder ein Gebaeude breit ist - fuer die Messungen unten.
const felderVon = (art) => GEBAEUDE_REIHE.find((g) => g.art === art && !g.bau && !g.offen)?.groesse || 2;
// Wie tief, wenn es kein Quadrat ist - das Tor.
const tiefeVon = (art) => GEBAEUDE_REIHE.find((g) => g.art === art && !g.bau && !g.offen)?.tief || felderVon(art);

const DINGE = [
  { art: WALD, titel: 'Wald' },
  { art: BEERE, titel: 'Beerenstrauch' },
  { art: GOLD, titel: 'Gold' },
  { art: STEIN, titel: 'Stein' },
  { art: WASSER, titel: 'Wasser am Ufer' },
];

// ---- Werkzeug: zeichnen und lesen --------------------------------------------

function blattMit(breite, hoehe = breite) {
  const blatt = document.createElement('canvas');
  blatt.width = Math.ceil(breite);
  blatt.height = Math.ceil(hoehe);
  return [blatt, blatt.getContext('2d', { willReadFrequently: true })];
}

/** Die Bildpunkte einer Zeichnung auf einem leeren Blatt der Kantenlaenge `groesse`. */
function bildpunkte(groesse, malen) {
  const [, s] = blattMit(groesse);
  malen(s);
  return s.getImageData(0, 0, groesse, groesse).data;
}

/**
 * Was eine Zeichnung um ihren Fusspunkt deckt: wie weit sie nach links,
 * rechts, oben und unten reicht. Der Schlagschatten ist halb durchsichtig
 * und zaehlt nicht; eine Bogensehne, die nur halb deckt, zaehlt (`DECKT`) -
 * mit der Schwelle 200 ragte der Bogen des Schuetzen vier Bildpunkte aus
 * seiner Zelle.
 */
const DECKT = 128;
function rahmen(malen, halb = 320) {
  const g = halb * 2;
  const daten = bildpunkte(g, (s) => malen(s, halb, halb));
  let links = g;
  let rechts = -1;
  let oben = g;
  let unten = -1;
  for (let y = 0; y < g; y++) {
    for (let x = 0; x < g; x++) {
      if (daten[(y * g + x) * 4 + 3] <= DECKT) continue;
      if (x < links) links = x;
      if (x > rechts) rechts = x;
      if (y < oben) oben = y;
      if (y > unten) unten = y;
    }
  }
  if (rechts < links) return { links: 0, rechts: 0, oben: 0, unten: 0 };
  return { links: halb - links, rechts: rechts + 1 - halb, oben: halb - oben, unten: unten + 1 - halb };
}

// Mauer und Tor werfen ihren Schatten aus einer eigenen Schicht, die das
// Spielbild als Ganzes auflegt (public/bilder.js) - hier je Gebaeude.
function schattenMalen(s, art, x, y, e) {
  const b = Math.ceil(12 * e);
  const [blatt, schicht] = blattMit(b);
  const deckung = gebaeudeSchattenZeichnen(schicht, art, b / 2, b / 2, e);
  if (!deckung) return;
  s.save();
  s.globalAlpha = deckung;
  s.drawImage(blatt, x - b / 2, y - b / 2);
  s.restore();
}

function gebaeudeMalen(s, eintrag, x, y, e, farbe) {
  schattenMalen(s, eintrag.art, x, y, e);
  gebaeudeBildZeichnen(s, eintrag.art, x, y, e, farbe, eintrag.groesse, eintrag.bau ?? 1, 1, Boolean(eintrag.offen));
}

const hoeheVon = (eintrag, zoom) => (eintrag.tier ? tierHoeheBei(zoom) : figurHoeheBei(zoom));

function figurMalen(s, eintrag, x, y, zoom, farbe) {
  figurBildZeichnen(s, eintrag.art, x, y, hoeheVon(eintrag, zoom), farbe, { blick: 1, ...eintrag.lage });
}

// ---- Anordnung ---------------------------------------------------------------
// Eine Zelle ist ein Vielfaches von RASTER breit, so viel, wie ihr Bild
// braucht; ist die Reihe voll, beginnt die naechste.

const BREITE = 1100;
const RASTER = 55;
const SPALTEN = BREITE / RASTER;

function anordnen(breiten) {
  const plaetze = [];
  let reihe = 0;
  let spalte = 0;
  for (const innen of breiten) {
    const n = Math.min(SPALTEN, Math.max(2, Math.ceil((innen + 28) / RASTER)));
    if (spalte + n > SPALTEN) {
      reihe += 1;
      spalte = 0;
    }
    plaetze.push({ reihe, x: spalte * RASTER + 8, breite: n * RASTER - 16 });
    spalte += n;
  }
  return { plaetze, reihen: reihe + 1 };
}

// Einheiten: gross wie beim naechsten Zoom, daneben in Spielgroesse (Zoom 1).
const ABSTAND = 10;
const figurMasse = EINTRAEGE.map((eintrag) => ({
  gross: rahmen((s, x, y) => figurMalen(s, eintrag, x, y, TAFEL_NAH, FARBEN[0])),
  klein: rahmen((s, x, y) => figurMalen(s, eintrag, x, y, 1, FARBEN[0])),
}));
const figurBreite = (m) => m.gross.links + m.gross.rechts + ABSTAND + m.klein.links + m.klein.rechts;
const figurOrdnung = anordnen(figurMasse.map(figurBreite));
const figurOben = Math.ceil(Math.max(...figurMasse.map((m) => m.gross.oben)));
const figurUnten = Math.ceil(Math.max(...figurMasse.map((m) => m.gross.unten)));
const figurGras = figurOben + figurUnten + 20;
const figurTeilung = figurGras + 34;
const figurenOben = 40;

// Gelaende: ein Stueck Karte gross, darunter fast leer und in Spielgroesse.
const E_GROSS = 30;
const E_SPIEL = 22;
const dingIndex = (gx, gy) => gx * 7 + gy * 13;
// Weit auseinander auf der Karte: so stehen Laub- und Nadelbaeume im selben Stueck.
const dingFeld = (gx, gy) => ({ x: gx * 5, y: gy * 5 });

// Wie weit ein Stueck Wald aus 3 x 3 Feldern ueber seine Mitte ragt.
function waldOben(e) {
  let hoch = 1.5 * e;
  for (let gy = 0; gy < 3; gy++) {
    for (let gx = 0; gx < 3; gx++) {
      const b = rahmen((s, x, y) => dingBildZeichnen(s, WALD, x, y, e, dingIndex(gx, gy), 1, dingFeld(gx, gy), SALZ), 200);
      hoch = Math.max(hoch, b.oben - (gx + gy - 2) * e * 0.5);
    }
  }
  return Math.ceil(hoch);
}

const gelaendeOben = figurenOben + 2 * figurOrdnung.reihen * figurTeilung + 30;
const dingSpalte = BREITE / DINGE.length;
const dingMitteGross = gelaendeOben + 6 + 10 + waldOben(E_GROSS);
const dingMitteSpiel = dingMitteGross + 1.5 * E_GROSS + 26 + waldOben(E_SPIEL);
const dingUnten = dingMitteSpiel + 1.5 * E_SPIEL + 30;
const gelaendeHoehe = dingUnten + 6 - gelaendeOben;

// Gebaeude: alle in Spielgroesse (Zoom 1).
const E_BAU = 22;
const bauMasse = GEBAEUDE_REIHE.map((eintrag) => rahmen((s, x, y) => gebaeudeMalen(s, eintrag, x, y, E_BAU, FARBEN[0])));
const bauOrdnung = anordnen(bauMasse.map((m) => m.links + m.rechts));
const bauOben = Math.ceil(Math.max(...bauMasse.map((m) => m.oben)));
const bauUnten = Math.ceil(Math.max(...bauMasse.map((m) => m.unten)));
const bauGras = bauOben + bauUnten + 20;
const bauTeilung = bauGras + 34;
const gebaeudeOben = gelaendeOben + gelaendeHoehe + 40;
const HOEHE = gebaeudeOben + 6 + 2 * bauOrdnung.reihen * bauTeilung;

// ---- Zeichnen ----------------------------------------------------------------

const leinwand = document.getElementById('tafel');
const stift = leinwand.getContext('2d');
const dichte = window.devicePixelRatio || 1;
leinwand.width = BREITE * dichte;
leinwand.height = HOEHE * dichte;
stift.scale(dichte, dichte);
stift.fillStyle = '#1d222a';
stift.fillRect(0, 0, BREITE, HOEHE);

function ueberschrift(text, y) {
  stift.fillStyle = SCHRIFT;
  stift.font = '600 15px system-ui, sans-serif';
  stift.textAlign = 'left';
  stift.fillText(text, 12, y);
}

function name(text, x, y, groesse = 13) {
  stift.fillStyle = SCHRIFT;
  stift.font = `600 ${groesse}px system-ui, sans-serif`;
  stift.textAlign = 'center';
  stift.fillText(text, x, y);
}

ueberschrift('Einheiten – so groß, wie das Rad sie heranholt, daneben in Spielgröße (Zoom 1), in zwei Spielerfarben', figurenOben - 14);
const zellen = [];
FARBEN.forEach((farbe, f) => {
  EINTRAEGE.forEach((eintrag, i) => {
    const platz = figurOrdnung.plaetze[i];
    const m = figurMasse[i];
    const oben = figurenOben + (f * figurOrdnung.reihen + platz.reihe) * figurTeilung;
    const beginn = platz.x + (platz.breite - figurBreite(m)) / 2;
    const boden = oben + 10 + figurOben;
    zellen.push({
      art: eintrag.art, titel: eintrag.titel, farbe, x: platz.x, y: oben, breite: platz.breite, hoehe: figurGras,
      eintrag,
      gross: { x: Math.round(beginn + m.gross.links), y: boden },
      klein: { x: Math.round(beginn + m.gross.links + m.gross.rechts + ABSTAND + m.klein.links), y: boden },
    });
  });
});
// Erst das Gras aller Zellen, dann die Figuren: so faellt ein Schatten auch
// auf das Gras der Nachbarzelle, statt von ihm uebermalt zu werden.
for (const z of zellen) {
  stift.fillStyle = GRAS;
  stift.fillRect(z.x, z.y, z.breite, z.hoehe);
}
for (const z of zellen) {
  figurMalen(stift, z.eintrag, z.gross.x, z.gross.y, TAFEL_NAH, z.farbe);
  figurMalen(stift, z.eintrag, z.klein.x, z.klein.y, 1, z.farbe);
  name(z.titel, z.x + z.breite / 2, z.y + z.hoehe + 20);
}

// ---- Gelaende und Vorraete (darstellung AC-2, AC-3) -----------------------

// Der Boden unter einem Stueck Karte aus n x n Feldern, wie ihn das Spiel
// zeichnet: eine Kachel, deren Mitte die Mitte des Stuecks ist.
function bodenKachel(karte, e, salz = SALZ) {
  const mitte = (karte.groesse - 1) / 2;
  return kachelZeichnen(karte, -KACHEL / 2, -KACHEL / 2 + mitte * 2 * e * 0.5, 1, e, e / 2, salz);
}

function flecken(s, mitteX, mitteY, e, art, fuellung, n = 3) {
  const felder = [];
  for (let gy = 0; gy < n; gy++) {
    for (let gx = 0; gx < n; gx++) felder.push({ gx, gy });
  }
  // Hinten beginnend, dann die Dinge nach Tiefe.
  felder.sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
  const karte = { groesse: n, felder: new Array(n * n).fill(art === WALD ? WALD : BODEN_GRAS) };
  // Wasser in der vorderen Haelfte, mit seinem Ufer.
  if (art === WASSER) for (const { gx, gy } of felder) if (gx + gy >= n - 1) karte.felder[gy * n + gx] = WASSER;
  s.save();
  raute(s, mitteX, mitteY, e * n, e * n * 0.5);
  s.clip();
  s.drawImage(bodenKachel(karte, e), mitteX - KACHEL / 2, mitteY - KACHEL / 2);
  s.restore();
  if (art === WASSER) return;
  const mitte = (n - 1) / 2;
  for (const { gx, gy } of felder) {
    if (art !== WALD && (gx !== mitte || gy !== mitte)) continue;
    const x = mitteX + (gx - gy) * e;
    const y = mitteY + (gx + gy - (n - 1)) * e * 0.5;
    dingBildZeichnen(s, art, x, y, e, dingIndex(gx, gy), fuellung, dingFeld(gx, gy), SALZ);
  }
}

ueberschrift('Gelände und Vorräte – voll, darunter fast leer und in Spielgröße (Zoom 1)', gelaendeOben - 6);
DINGE.forEach((ding, i) => {
  const x = i * dingSpalte;
  stift.fillStyle = '#26303a';
  stift.fillRect(x + 8, gelaendeOben + 6, dingSpalte - 16, gelaendeHoehe - 12);
  flecken(stift, x + dingSpalte / 2, dingMitteGross, E_GROSS, ding.art, 1);
  // Fast leer auf einem Feld; das Wasser wird nicht leer.
  if (ding.art !== WASSER) flecken(stift, x + 48, dingMitteSpiel + 1.5 * E_SPIEL - E_GROSS * 0.5, E_GROSS, ding.art, 0.25, 1);
  flecken(stift, x + (ding.art === WASSER ? dingSpalte / 2 : 142), dingMitteSpiel, E_SPIEL, ding.art, 1);
  stift.fillStyle = LEISE;
  stift.font = '11px system-ui, sans-serif';
  stift.textAlign = 'center';
  if (ding.art !== WASSER) stift.fillText('fast leer', x + 48, dingUnten - 20);
  stift.fillText('Zoom 1', x + (ding.art === WASSER ? dingSpalte / 2 : 142), dingUnten - 20);
  name(ding.titel, x + dingSpalte / 2, dingUnten - 3, 14);
});

// ---- Gebaeude und Baustellen (darstellung AC-4, AC-5) -----------------------

ueberschrift('Gebäude und Baustellen – in Spielgröße (Zoom 1), in zwei Spielerfarben', gebaeudeOben - 6);
const gebaeudeZellen = [];
FARBEN.forEach((farbe, f) => {
  GEBAEUDE_REIHE.forEach((eintrag, i) => {
    const platz = bauOrdnung.plaetze[i];
    const m = bauMasse[i];
    const oben = gebaeudeOben + 6 + (f * bauOrdnung.reihen + platz.reihe) * bauTeilung;
    gebaeudeZellen.push({
      art: eintrag.art, titel: eintrag.titel, bau: eintrag.bau ?? 1, farbe, x: platz.x, y: oben, breite: platz.breite, hoehe: bauGras,
      eintrag,
      fuss: { x: Math.round(platz.x + (platz.breite - m.links - m.rechts) / 2 + m.links), y: oben + 10 + bauOben },
    });
  });
});
for (const z of gebaeudeZellen) {
  stift.fillStyle = GRAS;
  stift.fillRect(z.x, z.y, z.breite, z.hoehe);
}
for (const z of gebaeudeZellen) {
  gebaeudeMalen(stift, z.eintrag, z.fuss.x, z.fuss.y, E_BAU, z.farbe);
  name(z.titel, z.x + z.breite / 2, z.y + z.hoehe + 20);
}

// ---- Messen ------------------------------------------------------------------
//
// Alles Folgende ist fuer den Browserlauf. Gemessen wird am Bild, wie es das
// Spiel zeichnet - nie an einer Angabe darueber.

// Was sich aendert, wenn der Spieler ein anderer ist, traegt seine Farbe.
// Bei gerenderten Bildern ist das Tuch mit der Farbe malgenommen: es hat
// Falten und Schatten und ist nirgends genau der Ton des Spielers. Bis zum
// Bildumbau wurde gezaehlt, was nahe am reinen Ton lag - an einer Zeichnung
// dasselbe, an einem Bild fast nichts.
const gegenfarbe = (farbe) => (farbe.toLowerCase() === FARBEN[1] ? FARBEN[0] : FARBEN[1]);
const FARBSPRUNG = 60;

/** Liest ein Bild in beiden Farben: was es belegt, und was davon die Spielerfarbe traegt. */
function auswerten(groesse, malen, farbe, mitFarben = true) {
  const eigen = bildpunkte(groesse, (s) => malen(s, farbe));
  const fremd = bildpunkte(groesse, (s) => malen(s, gegenfarbe(farbe)));
  const belegt = [];
  const farben = [];
  let pixel = 0;
  let farbpixel = 0;
  let hoechster = groesse;
  for (let i = 0; i < eigen.length; i += 4) {
    // Der Schatten ist halb durchsichtig und gehoert nicht zur Gestalt.
    const voll = eigen[i + 3] > 200;
    belegt.push(voll ? 1 : 0);
    if (mitFarben) farben.push(voll ? [eigen[i], eigen[i + 1], eigen[i + 2]] : null);
    if (!voll) continue;
    pixel += 1;
    hoechster = Math.min(hoechster, Math.floor(i / 4 / groesse));
    if (Math.abs(eigen[i] - fremd[i]) + Math.abs(eigen[i + 1] - fremd[i + 1]) + Math.abs(eigen[i + 2] - fremd[i + 2]) > FARBSPRUNG) farbpixel += 1;
  }
  return { belegt, farben, pixel, farbpixel, oben: hoechster };
}

/**
 * Ein Gebaeude allein auf durchsichtigem Grund (darstellung AC-4): welche
 * Bildpunkte es belegt und wie viele die Spielerfarbe tragen. Alle gleich
 * gross: jedes so, dass seine Grundflaeche zwei Felder von e = 20 fuellt -
 * nur, wer auf einem Feld steht, in seiner eigenen Groesse (der Aussenposten
 * ist hoch; als zwei Felder gezeichnet ragten Dach und Wimpel aus dem Blatt,
 * Runde 109).
 */
function gebaeudeMaske(art, farbe, bau = 1) {
  const groesse = 140;
  const echt = felderVon(art);
  const felder = Math.min(2, echt);
  const e = (20 * felder) / echt;
  const m = auswerten(groesse, (s, f) => gebaeudeMalen(s, { art, groesse: echt, bau }, groesse / 2, groesse * 0.72, e, f), farbe);
  // `grundOben`: die obere Ecke der Grundflaeche - die Raute reicht bei
  // e = 20 je Feld zehn Bildpunkte ueber und unter die Mitte.
  // `feld`: die Hoehe eines Feldes dieses Gebaeudes im Bild - woran sich
  // misst, ob es Koerper hat. Wer auf drei oder vier Feldern steht, ist hier
  // verkleinert gezeichnet, und sein Feld mit ihm.
  // `grundflaeche`: die Raute, auf der es steht, in Bildpunkten - 40 mal 20
  // je Feld, halbiert.
  return { ...m, grundOben: Math.floor(groesse * 0.72 - 10 * felder), feld: e, grundflaeche: (400 * felder * felder * tiefeVon(art)) / echt };
}

/**
 * Ein Vorrat allein auf durchsichtigem Grund (darstellung AC-3): wie viele
 * Bildpunkte er belegt und wie viele davon in einer Farbfamilie liegen.
 *
 * Gelesen wird der **Farbton**, nicht der Farbwert. Ein gerendertes Bild hat
 * Licht und Schatten: dasselbe Laub ist in der Sonne hell und unter der Krone
 * fast schwarz, und eine Schwelle auf den Farbwerten (bis zum Bildumbau:
 * "Rot ueber 150, Gruen unter 90") trifft davon nur die Sonnenseite - an der
 * Zeichnung war das dasselbe, am Bild blieben vom Wald 41 % gruen. Was im
 * tiefen Schatten liegt (kein Kanal ueber 50), hat keinen Farbton und zaehlt
 * nicht zu `farbig`; die Anteile der Familien beziehen sich auf `farbig`.
 *
 *   grau   Saettigung unter 0,18
 *   rot    Farbton innerhalb von 20 Grad um Rot, Saettigung ab 0,4
 *   gold   Ocker bis Gelb, 20 bis 70 Grad - das Gestein des Goldes und das Gold
 *   glanz  davon das helle Gold: ab 35 Grad, Saettigung ab 0,4, hell (ab 130)
 *   gruen  70 bis 180 Grad
 */
function dingBild(art, fuellung = 1) {
  const groesse = 240;
  const data = bildpunkte(groesse, (s) => dingBildZeichnen(s, art, groesse / 2, groesse * 0.8, 48, 17, fuellung));
  const z = { pixel: 0, farbig: 0, grau: 0, rot: 0, gold: 0, glanz: 0, gruen: 0 };
  const belegt = [];
  const farben = [];
  for (let i = 0; i < data.length; i += 4) {
    const voll = data[i + 3] >= 200;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    belegt.push(voll ? 1 : 0);
    farben.push(voll ? [r, g, b] : null);
    if (!voll) continue;
    z.pixel += 1;
    const hoch = Math.max(r, g, b);
    if (hoch <= 50) continue;
    z.farbig += 1;
    const satt = (hoch - Math.min(r, g, b)) / hoch;
    if (satt < 0.18) {
      z.grau += 1;
      continue;
    }
    const ton = farbton([r, g, b]);
    if (ton >= 340 || ton < 20) {
      if (satt >= 0.4) z.rot += 1;
    } else if (ton <= 70) {
      z.gold += 1;
      if (ton >= 35 && satt >= 0.4 && hoch >= 130) z.glanz += 1;
    } else if (ton <= 180) z.gruen += 1;
  }
  return { z, belegt, farben };
}

const dingMaske = (art, fuellung = 1) => dingBild(art, fuellung).z;

// Wie verschieden zwei Bilder sind: Anteil der gemeinsamen Flaeche, die sich
// im Umriss oder deutlich in der Farbe (Summe der Kanaele ueber 90)
// unterscheidet - das Mass aus darstellung AC-14.
function verschieden(a, b) {
  let anders = 0;
  let flaeche = 0;
  for (let k = 0; k < a.belegt.length; k++) {
    if (!a.belegt[k] && !b.belegt[k]) continue;
    flaeche += 1;
    if (a.belegt[k] !== b.belegt[k]) { anders += 1; continue; }
    const [r1, g1, b1] = a.farben[k];
    const [r2, g2, b2] = b.farben[k];
    if (Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2) > 90) anders += 1;
  }
  return Math.round((anders / flaeche) * 1000) / 1000;
}

/** Je zwei Vorraete gegeneinander, nach dem Mass aus darstellung AC-14. */
function dingUnterschiede() {
  const bilder = Object.entries({ wald: WALD, beere: BEERE, gold: GOLD, stein: STEIN }).map(([name, art]) => [name, dingBild(art)]);
  const paare = [];
  for (let i = 0; i < bilder.length; i++) {
    for (let j = i + 1; j < bilder.length; j++) {
      paare.push({ paar: `${bilder[i][0]} gegen ${bilder[j][0]}`, anteil: verschieden(bilder[i][1], bilder[j][1]) });
    }
  }
  return paare.sort((x, y) => x.anteil - y.anteil);
}

/**
 * Eine Figur allein auf durchsichtigem Grund: welche Bildpunkte sie belegt
 * und wie viele davon die Spielerfarbe tragen.
 *
 * `hoehe` ist die Figurenhoehe in Bildpunkten; ohne Angabe herangezoomt
 * (72), fuer die Spielgroesse `figurHoeheBei(1)` - rund 29 (bedienung AC-36).
 * Das Blatt bleibt gleich gross, damit zwei Masken Punkt fuer Punkt
 * vergleichbar bleiben: 240, damit auch ein Reiter mit Lanze ganz darauf
 * steht (mit 96 war die Miliz rechts abgeschnitten); `blatt` macht es
 * groesser, wo Ramme und Karren ganz gebraucht werden.
 */
function maske(art, farbe, lage = {}) {
  const { hoehe = 72, blatt = 240, ...rest } = lage;
  return auswerten(blatt, (s, f) => figurBildZeichnen(s, art, blatt / 2, blatt / 2 + hoehe / 2, hoehe, f, { blick: 1, ...rest }), farbe);
}

/**
 * Wie viel einer Einheit die Spielerfarbe traegt (darstellung AC-6, AC-9):
 * Anteil der Figur, der sich mit dem Spieler aendert - die ganze Figur,
 * nichts abgeschnitten.
 */
function spielerfarbe(art, hoehe = 72) {
  const blatt = 480;
  const anteil = (farbe) => {
    const m = auswerten(blatt, (s, f) => figurBildZeichnen(s, art, blatt / 2, blatt / 2 + hoehe / 2, hoehe, f, { blick: 1 }), farbe, false);
    return m.pixel ? Math.round((m.farbpixel / m.pixel) * 1000) / 1000 : 0;
  };
  return FARBEN.map(anteil);
}

// Mittlere Farbe je Block einer Kachel: die Halme der Textur mitteln sich
// heraus, was bleibt, ist die Toenung des Bodens.
function bloecke(kachel, block = 12) {
  const { data } = kachel.getContext('2d').getImageData(0, 0, KACHEL, KACHEL);
  const aus = [];
  for (let y = 40; y + block <= KACHEL - 40; y += block) {
    for (let x = 40; x + block <= KACHEL - 40; x += block) {
      const summe = [0, 0, 0];
      let ganz = true;
      for (let j = 0; j < block && ganz; j++) {
        for (let i = 0; i < block; i++) {
          const k = ((y + j) * KACHEL + x + i) * 4;
          if (data[k + 3] < 255) { ganz = false; break; }
          summe[0] += data[k];
          summe[1] += data[k + 1];
          summe[2] += data[k + 2];
        }
      }
      aus.push(ganz ? summe.map((w) => w / (block * block)) : null);
    }
  }
  return aus;
}

function farbton([rot, gruen, blau]) {
  const [r, g, b] = [rot / 255, gruen / 255, blau / 255];
  const hoch = Math.max(r, g, b);
  const tief = Math.min(r, g, b);
  const d = hoch - tief || 1;
  let ton = hoch === r ? ((g - b) / d) % 6 : hoch === g ? (b - r) / d + 2 : (r - g) / d + 4;
  ton *= 60;
  return Math.round(ton < 0 ? ton + 360 : ton);
}

// Eine Kachel aus lauter Gras, mitten aus einer Karte von 30 x 30 Feldern.
function grasKachel(salz) {
  const g = 30;
  return kachelZeichnen({ groesse: g, felder: new Array(g * g).fill(BODEN_GRAS) }, -KACHEL / 2, 100, 1, 22, 11, salz);
}

/**
 * Fuer den Browserlauf (darstellung AC-2): wie viele Toenungen das Gras hat,
 * wie verschieden zwei Startwerte es toenen, und ob am Ufer Sand liegt.
 * Gelesen aus der Kachel, die das Spielbild zeichnet - je Block von zwoelf
 * Bildpunkten die mittlere Farbe.
 */
function bodenProbe() {
  const a = bloecke(grasKachel(SALZ));
  const b = bloecke(grasKachel(1234));
  const toene = new Set();
  let anders = 0;
  let gezaehlt = 0;
  for (let i = 0; i < a.length; i++) {
    if (!a[i] || !b[i]) continue;
    gezaehlt += 1;
    toene.add(a[i].map((k) => Math.round(k) >> 3).join(','));
    if (Math.abs(a[i][0] - b[i][0]) + Math.abs(a[i][1] - b[i][1]) + Math.abs(a[i][2] - b[i][2]) > 6) anders += 1;
  }
  // Ein See aus drei mal drei Feldern mitten im Gras, wie im Spiel gezeichnet,
  // und dieselbe Karte ohne ihn. Ein einzelnes Wasserfeld taugt als Probe
  // nicht mehr: das weiche Ufer reicht von jeder Seite ein halbes Feld hinein,
  // und von dem Feld bleibt eine Pfuetze. `wasser` ist, was blau ist; `ufer`,
  // was der See am Boden sonst veraendert hat - der Streifen zwischen Wasser
  // und Gras.
  const g = 9;
  const see = new Array(g * g).fill(0).map((_, i) => (Math.abs((i % g) - 4) <= 1 && Math.abs(Math.floor(i / g) - 4) <= 1 ? WASSER : BODEN_GRAS));
  const lesen = (felder) => {
    const [, s] = blattMit(320, 200);
    s.drawImage(bodenKachel({ groesse: g, felder }, 22), 160 - KACHEL / 2, 100 - KACHEL / 2);
    return s.getImageData(0, 0, 320, 200).data;
  };
  const mit = lesen(see);
  const ohne = lesen(new Array(g * g).fill(BODEN_GRAS));
  let ufer = 0;
  let wasser = 0;
  for (let i = 0; i < mit.length; i += 4) {
    if (mit[i + 3] <= 200) continue;
    if (mit[i + 2] > mit[i] + 12 && mit[i + 2] >= mit[i + 1]) wasser += 1;
    else if (Math.abs(mit[i] - ohne[i]) + Math.abs(mit[i + 1] - ohne[i + 1]) + Math.abs(mit[i + 2] - ohne[i + 2]) > 30) ufer += 1;
  }
  // Farbtoene (Grad) an einigen Stellen des Grases, fuer AC-13: erdig statt gruen.
  const voll = a.filter(Boolean);
  const farbtoene = [];
  for (let i = 0; i < 12; i++) farbtoene.push(farbton(voll[Math.floor((i + 0.5) * voll.length / 12)]));
  // Ein Feld deckt bei e = 22 eine Raute von 44 mal 22 Bildpunkten: 484.
  return { toene: toene.size, verschieden: anders / gezaehlt, ufer, wasser, seeflaeche: 9 * 484, farbtoene, bloecke: gezaehlt };
}

/**
 * Fuer den Browserlauf (darstellung AC-12): wie viele deutlich verschiedene
 * Farbtoene ein Bild hat - Kanaele auf 16 Stufen gerundet, gezaehlt nur
 * Toene mit mindestens einem Hundertstel der Flaeche. Flach gezeichnet ist das
 * etwa eine Stufe je Flaeche, schattiert ein Mehrfaches.
 */
function tonstufen(welche, art) {
  const g = 480;
  const data = bildpunkte(g, (s) => {
    if (welche === 'figur') figurBildZeichnen(s, art, g / 2, g - 60, 130, FARBEN[0], {});
    else if (welche === 'gebaeude') gebaeudeMalen(s, { art, groesse: felderVon(art) }, g / 2, g * 0.72, 22, FARBEN[0]);
    else dingBildZeichnen(s, art, g / 2, g * 0.8, 50, 17, 1);
  });
  const zaehler = new Map();
  let pixel = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 250) continue;
    pixel += 1;
    const k = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    zaehler.set(k, (zaehler.get(k) || 0) + 1);
  }
  let deutlich = 0;
  for (const n of zaehler.values()) if (n >= pixel * 0.01) deutlich += 1;
  return deutlich;
}

/**
 * Fuer den Browserlauf (darstellung AC-13): wie comichaft ein Bild ist.
 * `schwarz` ist der Anteil fast schwarzer Bildpunkte (kein Kanal ueber 50),
 * `rand` derselbe Anteil nur am Rand der Gestalt - an den deckenden Punkten,
 * die einen nicht deckenden Nachbarn haben. Ein gezeichneter Umriss ist
 * genau dort schwarz; ein tiefer Schatten im Inneren eines offenen Schuppens
 * ist es nicht. `saettigung` ist die mittlere Saettigung (HSL, 0..1).
 * In Spielgroesse, gezaehlt nur deckende Punkte - der Schlagschatten ist
 * halb durchsichtig und zaehlt nicht.
 */
function anmutung(welche, art) {
  const g = 420;
  const data = bildpunkte(g, (s) => {
    if (welche === 'figur') figurBildZeichnen(s, art, g / 2, g - 60, 40, FARBEN[0], {});
    else if (welche === 'ding') dingBildZeichnen(s, art, g / 2, g * 0.72, 22, 17, 1);
    else gebaeudeBildZeichnen(s, art, g / 2, g * 0.72, 22, FARBEN[0], felderVon(art));
  });
  const deckt = (i) => i >= 0 && i < data.length && data[i + 3] >= 250;
  let pixel = 0;
  let schwarz = 0;
  let saettigung = 0;
  let rand = 0;
  let randSchwarz = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (!deckt(i)) continue;
    const r = data[i] / 255;
    const gr = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    pixel += 1;
    const hoch = Math.max(r, gr, b);
    const tief = Math.min(r, gr, b);
    const dunkel = hoch * 255 <= 50;
    if (dunkel) schwarz += 1;
    if (!deckt(i - 4) || !deckt(i + 4) || !deckt(i - g * 4) || !deckt(i + g * 4)) {
      rand += 1;
      if (dunkel) randSchwarz += 1;
    }
    const l = (hoch + tief) / 2;
    if (hoch > tief) saettigung += (hoch - tief) / (1 - Math.abs(2 * l - 1));
  }
  return { pixel, schwarz: schwarz / pixel, rand: rand ? randSchwarz / rand : 0, saettigung: saettigung / pixel };
}

/** Hoehe der deckenden Bildpunkte (Alpha ueber 200) einer Zeichnung. */
function deckendeHoehe(daten, breite) {
  let oben = Infinity;
  let unten = -Infinity;
  for (let i = 3; i < daten.length; i += 4) {
    if (daten[i] <= 200) continue;
    const zeile = Math.floor((i - 3) / 4 / breite);
    oben = Math.min(oben, zeile);
    unten = Math.max(unten, zeile);
  }
  return unten >= oben ? unten - oben + 1 : 0;
}

// Haut im gerenderten Bild: warm und hell - Rot ueber Gruen ueber Blau, mit
// Abstand. Leinen und Wolle sind unbunter, Leder und Haar dunkler.
const istHaut = (r, g, b) => r > 130 && r - g >= 18 && g - b >= 10 && r - b <= 120;

/**
 * Fuer den Browserlauf (darstellung AC-13, Proportionen): `kopf` ist die
 * Zahl der Zeilen im oberen Drittel, in denen das Gesicht zu sehen ist -
 * mindestens `breit` Bildpunkte Haut nebeneinander; ein Lanzenschaft ist
 * schmaler. `figur` ist die Hoehe der ganzen Figur.
 *
 * Bis zum Bildumbau wurde die Figur dafuer mit einem Hautton gezeichnet, den
 * sonst nichts hat; ein gerendertes Bild laesst sich nicht umfaerben.
 */
function proportionen(art, breit = 5) {
  const g = 480;
  const data = bildpunkte(g, (s) => figurBildZeichnen(s, art, g / 2, g - 80, 150, FARBEN[0], {}));
  const figur = deckendeHoehe(data, g);
  let oben = Infinity;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 200) { oben = Math.floor((i - 3) / 4 / g); break; }
  let kopf = 0;
  for (let zeile = oben; zeile <= oben + figur / 3; zeile++) {
    let lauf = 0;
    let laengster = 0;
    for (let x = 0; x < g; x++) {
      const i = (zeile * g + x) * 4;
      lauf = data[i + 3] > 200 && istHaut(data[i], data[i + 1], data[i + 2]) ? lauf + 1 : 0;
      laengster = Math.max(laengster, lauf);
    }
    if (laengster >= breit) kopf += 1;
  }
  return { figur, kopf };
}

/**
 * Fuer den Browserlauf (darstellung AC-13): ein Dorfbewohner und ein Haus bei
 * Zoom 1, so gross wie im Spielbild - wie hoch ist jedes?
 */
function groessen() {
  const g = 300;
  const zeichnen = (malen) => deckendeHoehe(bildpunkte(g, malen), g);
  return {
    dorfbewohner: zeichnen((s) => figurBildZeichnen(s, 'dorfbewohner', g / 2, g - 20, figurHoeheBei(1), FARBEN[0], {})),
    haus: zeichnen((s) => gebaeudeBildZeichnen(s, 'haus', g / 2, g * 0.7, 22, FARBEN[0], 2)),
  };
}

/**
 * Fuer den Browserlauf (darstellung AC-9): wie viele Bildpunkte jede Einheit
 * links, rechts und oben aus dem Gras ihrer Zelle ragt - die grosse Figur
 * und die in Spielgroesse zusammen. Die Spitze der Ramme war in Runde 129
 * abgeschnitten, der Wurfarm des Mangonels ragte in Runde 130 hinaus, und
 * beide Male fand es erst das Auge (Rueckschau nach Runde 130). Seit dem
 * Bildumbau kommt die Breite der Zelle aus dem Bild selbst; gemessen wird
 * trotzdem, auf einem leeren Blatt und gegen die Zelle, wie sie dasteht.
 * Gezaehlt wird, was deckt - der weiche Schatten nicht.
 */
function ueberstand() {
  const rand = 40;
  const h = figurGras + 2 * rand;
  return zellen.filter((z) => z.farbe === FARBEN[0]).map((z) => {
    const [, s] = blattMit(BREITE, h);
    const dy = rand - z.y;
    figurMalen(s, z.eintrag, z.gross.x, z.gross.y + dy, TAFEL_NAH, z.farbe);
    figurMalen(s, z.eintrag, z.klein.x, z.klein.y + dy, 1, z.farbe);
    const { data } = s.getImageData(0, 0, BREITE, h);
    let links = BREITE;
    let rechts = -1;
    let oben = h;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < BREITE; x++) {
        if (data[(y * BREITE + x) * 4 + 3] <= DECKT) continue;
        if (x < links) links = x;
        if (x > rechts) rechts = x;
        if (y < oben) oben = y;
      }
    }
    return {
      art: z.art, titel: z.titel,
      links: Math.max(0, z.x - links), rechts: Math.max(0, rechts - (z.x + z.breite - 1)), oben: Math.max(0, rand - oben),
    };
  });
}

/**
 * Fuer den Browserlauf (darstellung AC-13, kein Rautenraster): eine Bodenkachel
 * aus lauter Gras, wie im Spiel. Verglichen wird der Farbsprung zwischen zwei
 * benachbarten Bildpunkten, die auf verschiedenen Feldern liegen, mit dem
 * Sprung innerhalb eines Feldes. Ein Raster zeigt sich als groesserer Sprung
 * an den Feldgrenzen.
 */
function bodenRaster() {
  const hb = 22;
  const hh = 11;
  const x0 = -KACHEL / 2;
  const y0 = 100;
  const kachel = grasKachel(SALZ);
  const { data } = kachel.getContext('2d').getImageData(0, 0, KACHEL, KACHEL);
  const feld = (i, j) => {
    const px = x0 + i + 0.5;
    const py = y0 + j + 0.5;
    return [Math.round((px / hb + py / hh) / 2), Math.round((py / hh - px / hb) / 2)];
  };
  const grenze = { summe: 0, n: 0 };
  const innen = { summe: 0, n: 0 };
  for (let j = 40; j < KACHEL - 40; j += 3) {
    for (let i = 40; i < KACHEL - 40; i++) {
      for (const [di, dj] of [[1, 0], [0, 1]]) {
        const a = (j * KACHEL + i) * 4;
        const b = ((j + dj) * KACHEL + i + di) * 4;
        if (data[a + 3] < 255 || data[b + 3] < 255) continue;
        const sprung = Math.abs(data[a] - data[b]) + Math.abs(data[a + 1] - data[b + 1]) + Math.abs(data[a + 2] - data[b + 2]);
        const [fa, ga] = feld(i, j);
        const [fb, gb] = feld(i + di, j + dj);
        const ziel = fa !== fb || ga !== gb ? grenze : innen;
        ziel.summe += sprung;
        ziel.n += 1;
      }
    }
  }
  return { grenze: grenze.summe / grenze.n, innen: innen.summe / innen.n, paareGrenze: grenze.n };
}

/**
 * Fuer den Browserlauf (darstellung AC-13, Schlagschatten): halb durchsichtige
 * dunkle Bildpunkte **neben der Grundflaeche**, rechts und links der Mitte.
 * Licht von links oben heisst: der Schatten liegt rechts.
 *
 * Bis zum Bildumbau galt als "neben der Grundflaeche", was rechts der rechten
 * Ecke der Raute lag. Der gezeichnete Schatten war ein Streifen, der dort
 * begann; der gerenderte faellt, wie die Sonne steht - nach rechts unten -,
 * und bei einem niedrigen Bau auf drei Feldern (Stall, Schmiede) erreicht er
 * die Ecke nicht: er liegt vor der rechten unteren Kante. Jenseits der Ecke
 * lagen beim Stall 2 Bildpunkte. Gezaehlt wird deshalb, was ausserhalb der
 * Raute liegt.
 */
function schlagschatten(welche, art) {
  const g = 480;
  const e = 22;
  const felder = welche === 'ding' ? 1 : felderVon(art);
  const mitteY = g * 0.6;
  const data = bildpunkte(g, (s) => {
    if (welche === 'ding') dingBildZeichnen(s, art, g / 2, mitteY, e, 17, 1);
    else gebaeudeMalen(s, { art, groesse: felder }, g / 2, mitteY, e, FARBEN[0]);
  });
  let rechts = 0;
  let links = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 20 || a > 200 || Math.max(data[i], data[i + 1], data[i + 2]) > 90) continue;
    const dx = ((i / 4) % g) + 0.5 - g / 2;
    const dy = Math.floor(i / 4 / g) + 0.5 - mitteY;
    if (Math.abs(dx) / (felder * e) + Math.abs(dy) / (felder * e * 0.5) <= 1) continue;
    // Der geglaettete Rand einer dunklen Krone ist auch halb durchsichtig und
    // dunkel - aber kein Schatten: wer an die Gestalt grenzt, zaehlt nicht.
    if ([i - 4, i + 4, i - g * 4, i + g * 4].some((n) => data[n + 3] > 200)) continue;
    if (dx > 0) rechts += 1;
    else links += 1;
  }
  return { rechts, links };
}

/**
 * Fuer den Browserlauf (darstellung AC-14): wie verschieden je zwei Einheiten
 * oder je zwei Gebaeude sind - Anteil der gemeinsamen Flaeche, die sich im
 * Umriss oder deutlich in der Farbe (Summe der Kanaele ueber 90) unterscheidet.
 * Alle in Blau und im selben Massstab, damit nur die Gestalt zaehlt; die
 * Einheiten auf einem Blatt, auf dem auch Ramme und Karren ganz stehen.
 */
function unterschiede(welche, lage = {}) {
  const arten = welche === 'figur' ? Object.keys(FIGUREN) : Object.keys(GEBAEUDE);
  const masken = arten.map((art) => [art, welche === 'figur' ? maske(art, FARBEN[0], { blatt: 360, ...lage }) : gebaeudeMaske(art, FARBEN[0])]);
  const paare = [];
  for (let i = 0; i < masken.length; i++) {
    for (let j = i + 1; j < masken.length; j++) {
      paare.push({ paar: `${masken[i][0]} gegen ${masken[j][0]}`, anteil: verschieden(masken[i][1], masken[j][1]) });
    }
  }
  return paare.sort((x, y) => x.anteil - y.anteil);
}

/**
 * Fuer den Browserlauf (bedienung AC-36): wie verschieden zwei Figuren **im
 * Umriss** sind, in der Hoehe, die Zoom 1 ihnen gibt - Anteil der gemeinsamen
 * Flaeche, auf dem die eine belegt ist und die andere nicht.
 *
 * Anders als `unterschiede` zaehlt die Farbe hier **nicht** mit. Bei 29
 * Bildpunkten Hoehe ist die Spielerfarbe im Koerper eine Handvoll Punkte, die
 * gegen das Gelaende verschwindet; was bleibt, ist die Gestalt. Deshalb misst
 * das Kriterium nur sie.
 */
function umrissUnterschied(eine, andere, hoehe = figurHoeheBei(1)) {
  const a = maske(eine, FARBEN[0], { hoehe });
  const b = maske(andere, FARBEN[0], { hoehe });
  let anders = 0;
  let flaeche = 0;
  for (let k = 0; k < a.belegt.length; k++) {
    if (!a.belegt[k] && !b.belegt[k]) continue;
    flaeche += 1;
    if (a.belegt[k] !== b.belegt[k]) anders += 1;
  }
  return Math.round((anders / flaeche) * 1000) / 1000;
}

// Was nicht aus der Kette kommt, sondern noch gezeichnet wird (darstellung AC-24).
const TAFEL_ZU = { [WALD]: 'baum', [BEERE]: 'beere', [GOLD]: 'gold', [STEIN]: 'stein' };
const gezeichnet = [
  ...Object.keys(FIGUREN), ...Object.keys(GEBAEUDE), ...Object.values(TAFEL_ZU), 'boden',
  ...[1, 2, 3, 4, 5].map((n) => `baustelle-${n}`),
].filter((art) => !gerendert(art));

const blank = ({ eintrag, ...rest }) => rest;
window.schautafel = {
  zellen: zellen.map(blank), maske, dingMaske, dingUnterschiede, bodenProbe, arten: Object.keys(FIGUREN), dinge: { WALD, BEERE, GOLD, STEIN },
  gebaeudeZellen: gebaeudeZellen.map(blank), gebaeudeMaske, gebaeudeArten: Object.keys(GEBAEUDE), tonstufen, anmutung, proportionen, groessen, ueberstand, bodenRaster, schlagschatten, unterschiede,
  umrissUnterschied, spielerfarbe, spielhoehe: figurHoeheBei(1), gelaendeOben, gelaendeHoehe, gebaeudeOben, hoehe: HOEHE, gezeichnet,
};
