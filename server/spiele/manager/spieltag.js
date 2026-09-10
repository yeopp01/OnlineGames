'use strict';

// Eine Begegnung, Minute fuer Minute. Der Server rechnet sie, der Browser
// zeigt nur das Ergebnis (→ docs/adr/0001-server-rechnet.md).
//
// Das Modell in einem Satz: das Mittelfeld teilt die Chancen auf, der Angriff
// gegen Abwehr und Torwart entscheidet, was daraus wird - und zwar in
// Abschnitten von fuenf Minuten, mit der Mannschaft, die in diesem Abschnitt
// wirklich auf dem Platz steht.
//
// Deshalb gilt: wer vom Platz fliegt oder sich verletzt, trifft danach nicht
// mehr; eine rote Karte schwaecht die Mannschaft fuer den Rest des Spiels; die
// zweite gelbe Karte ist Gelb-Rot; wer muede ist, wird ausgewechselt.
//
// Taktik ist eine Entscheidung, keine Einstellung, die man einmal richtig
// setzt: offensiv bringt Tore und kostet Gegentore, Pressing staerkt das
// Mittelfeld und kostet Kondition, Haerte staerkt die Abwehr und kostet
// Karten, und ein System, das die Mannschaft nicht kennt, kostet Leistung.
//
// `begegnung()` aendert an den Vereinen nichts - sie liest nur. Was bleibt,
// traegt `nachwirkung()` nach.
const {
  TOR, ABW, MIT, ANG, PLAETZE, TEIL, tagesform, niveau, einsatzbereit, eignung,
} = require('./kader');

const SCHEIBE = 5;
const SCHEIBEN = 18;
const VERLAENGERUNG = 6;
const HEIMVORTEIL = 1.1;
const CHANCEN_JE_SPIEL = 19;
// Erwartete Karten je Mannschaft bei mittlerer Haerte.
const KARTEN_JE_SPIEL = 1.6;
const ROT_ANTEIL = 0.02;
// Wer schon Gelb hat, geht vorsichtiger in den Zweikampf.
const VORBELASTET = 0.4;
const VERLETZUNG_JE_SPIEL = 0.012;
const ERMUEDUNG_JE_MINUTE = 0.13;
const WECHSEL_MAX = 3;
// Ausgewechselt wird, wer unter diese Frische faellt - und nur fuer einen, der
// jetzt mindestens so viel bringt wie dieser Anteil von ihm. Ein wenig
// schwaecher darf der Neue sein: die Minuten, die der Muede nicht mehr
// laeuft, hat er naechste Woche an Kondition uebrig.
const WECHSEL_FRISCHE = 88;
const WECHSEL_ABSTAND = 0.85;
const GELBSPERRE = 5;
const ROTSPERRE = 2;
const GELBROTSPERRE = 1;
// Was ein Spiel im eigenen System an Eingespieltheit bringt.
const SPIELPRAXIS = 3;

const TAKTIK_VORGABE = { system: '4-4-2', ausrichtung: 3, haerte: 3, pressing: 3 };
const AUSRICHTUNGEN = ['Mauern', 'Defensiv', 'Ausgewogen', 'Kontrollierte Offensive', 'Offensiv'];
// Wie viel ein Schritt Ausrichtung, Pressing und Haerte bewirkt, was Geuebtes
// bringt - und wie stark Ueberlegenheit durchschlaegt (`hebel`: 1 heisst
// Verhaeltnis, darueber zaehlt Staerke mehr und der Zufall weniger).
// `verwertung` bremst die Trefferwahrscheinlichkeit auf gut drei Tore je Spiel.
// Ausgerichtet an der Messung (→ specs/15-manager/spieltag.md).
// `tempo`: wie viel mehr Chancen ein offenes Spiel fuer beide Seiten hat.
const WIRKUNG = {
  angriff: 0.03, abwehr: 0.06, tempo: 0.12, pressing: 0.04, haerte: 0.05, geuebt: 0.06, hebel: 1.5, verwertung: 0.34,
};
// Mehr Leute auf einer Position wiegen schwerer - im Sturm am meisten, im
// Mittelfeld am wenigsten. Sonst gewaenne immer, wer das Mittelfeld fuellt.
const ANZAHL_GEWICHT = { [ABW]: [0.70, 0.075], [MIT]: [0.84, 0.04], [ANG]: [0.76, 0.08] };
const TREFFERNEIGUNG = { [ANG]: 3.0, [MIT]: 1.1, [ABW]: 0.4, [TOR]: 0 };
const VORLAGENEIGUNG = { [ANG]: 1.5, [MIT]: 2.2, [ABW]: 0.7, [TOR]: 0.05 };

function taktikPruefen(taktik = {}) {
  const grenze = (wert, vorgabe) => (Number.isFinite(wert) ? Math.min(5, Math.max(1, Math.round(wert))) : vorgabe);
  return {
    system: typeof taktik.system === 'string' ? taktik.system : TAKTIK_VORGABE.system,
    ausrichtung: grenze(taktik.ausrichtung, TAKTIK_VORGABE.ausrichtung),
    haerte: grenze(taktik.haerte, TAKTIK_VORGABE.haerte),
    pressing: grenze(taktik.pressing, TAKTIK_VORGABE.pressing),
  };
}

/** Was eine Mannschaft eingeuebt hat, von 0 bis 1. Ohne Angabe: halb eingespielt, nichts geuebt. */
function eingeuebt(verein, system) {
  const e = verein.einstudiert || {};
  return {
    system: ((e.systeme || {})[system] ?? 50) / 100,
    pressing: (e.pressing ?? 0) / 100,
    abwehr: (e.abwehr ?? 0) / 100,
    angriff: (e.angriff ?? 0) / 100,
  };
}

/** Wie schnell eine Mannschaft ermuedet: Pressing kostet, geuebtes Pressing weniger. */
function ermuedung(taktik, geuebtesPressing = 0) {
  const schritte = taktik.pressing - 3;
  const zuschlag = schritte > 0 ? 0.2 * schritte * (1 - 0.5 * geuebtesPressing) : 0.06 * schritte;
  return ERMUEDUNG_JE_MINUTE * (1 + zuschlag);
}

/**
 * Ein Spieler, wie er auf einem Platz steht: er zaehlt fuer den
 * Mannschaftsteil des Platzes und bringt dort seine Staerke mal Eignung. Eine
 * Kopie - der Verein selbst bleibt unberuehrt.
 */
function aufDemPlatz(spieler, platz) {
  return {
    ...spieler, position: TEIL[platz], platz, staerke: spieler.staerke * eignung(spieler, platz),
  };
}

function seiteAnlegen(verein, {
  elf, bank, system, taktik, wechselregel,
}) {
  const geprueft = taktikPruefen(taktik);
  // Die Plaetze kommen aus dem System der Aufstellung; ohne eines aus der Taktik.
  const plaetze = PLAETZE[system] || PLAETZE[geprueft.system] || PLAETZE['4-4-2'];
  return {
    verein,
    id: verein.id,
    auf: elf.map((s, i) => aufDemPlatz(s, plaetze[i])),
    plaetze: elf.map((s, i) => plaetze[i]),
    bank: bank.slice(),
    taktik: geprueft,
    geuebt: eingeuebt(verein, geprueft.system),
    wechselregel: wechselregel === 'verletzung' ? 'verletzung' : 'auto',
    frische: new Map([...elf, ...bank].map((s) => [s.id, s.kondition])),
    minuten: new Map(elf.map((s) => [s.id, { von: 0, bis: null }])),
    gelbe: new Map(),
    letzte: new Map(),
    tore: 0,
    chancen: 0,
    wechsel: 0,
    // Wer vor dem Anpfiff gesperrt war, sitzt dieses Spiel ab.
    gesperrt: verein.spieler.filter((s) => s.sperre > 0).map((s) => s.id),
  };
}

function teil(seite, position) {
  const leute = seite.auf.filter((s) => s.position === position);
  if (!leute.length) return position === TOR ? 20 : 35;
  return leute.reduce((summe, s) => summe + tagesform(s, seite.frische.get(s.id)), 0) / leute.length;
}

/**
 * Die vier Mannschaftsteile in einem Durchgang ueber die, die auf dem Platz
 * stehen: Schnitt der Tagesform, und fuer Abwehr, Mittelfeld und Sturm mit
 * dem Gewicht ihrer Anzahl. Laeuft 23.000-mal je Saison - deshalb einmal statt
 * siebenmal ueber die Elf.
 */
function teile(seite) {
  const summe = { [TOR]: 0, [ABW]: 0, [MIT]: 0, [ANG]: 0 };
  const anzahl = { [TOR]: 0, [ABW]: 0, [MIT]: 0, [ANG]: 0 };
  for (const spieler of seite.auf) {
    summe[spieler.position] += tagesform(spieler, seite.frische.get(spieler.id));
    anzahl[spieler.position] += 1;
  }
  const gewichtet = (position) => {
    const [grund, je] = ANZAHL_GEWICHT[position];
    const schnitt = anzahl[position] ? summe[position] / anzahl[position] : 35;
    return schnitt * (grund + je * anzahl[position]);
  };
  return {
    torwart: anzahl[TOR] ? summe[TOR] / anzahl[TOR] : 20,
    abwehr: gewichtet(ABW),
    mittelfeld: gewichtet(MIT),
    angriff: gewichtet(ANG),
  };
}

function staerkeRechnen(seite, heimfaktor) {
  const { taktik, geuebt } = seite;
  const roh = teile(seite);
  const unterzahl = 1 - 0.05 * Math.max(0, 11 - seite.auf.length);
  // Ein System, das die Mannschaft nicht kennt, kostet bis zu sieben Prozent.
  const allgemein = heimfaktor * unterzahl * (0.93 + 0.07 * geuebt.system);
  const ausrichtung = taktik.ausrichtung - 3;
  const pressing = 1 + WIRKUNG.pressing * (1 + 0.6 * geuebt.pressing) * (taktik.pressing - 3);
  const haerte = 1 + WIRKUNG.haerte * (taktik.haerte - 3);
  return {
    torwart: roh.torwart,
    abwehr: roh.abwehr * haerte * (1 - WIRKUNG.abwehr * ausrichtung) * (1 + WIRKUNG.geuebt * geuebt.abwehr) * allgemein,
    mittelfeld: roh.mittelfeld * pressing * allgemein,
    angriff: roh.angriff * (1 + WIRKUNG.angriff * ausrichtung) * (1 + WIRKUNG.geuebt * geuebt.angriff) * allgemein,
  };
}

/**
 * Die Mannschaftsteile einer Elf, wie sie vor dem Anpfiff steht: Tagesform,
 * Anzahl je Reihe, eingespieltes System und Geuebtes - ohne Heimvorteil und
 * ohne Taktikregler, denn die stellt jeder erst vor dem Spiel. Fuer die
 * Vorschau auf den Gegner; gerechnet wie im Spiel selbst.
 */
function mannschaftsteile(verein, elf, system = verein.taktik?.system) {
  const seite = seiteAnlegen(verein, {
    elf, bank: [], system, taktik: { system },
  });
  const teile = staerkeRechnen(seite, 1);
  return {
    torwart: Math.round(teile.torwart), abwehr: Math.round(teile.abwehr), mittelfeld: Math.round(teile.mittelfeld), angriff: Math.round(teile.angriff),
  };
}

function gewichtetWaehlen(liste, gewichtVon, zufall) {
  const gewichte = liste.map(gewichtVon);
  const summe = gewichte.reduce((a, b) => a + b, 0);
  if (summe <= 0) return null;
  let wurf = zufall() * summe;
  for (let i = 0; i < liste.length; i++) {
    wurf -= gewichte[i];
    if (wurf <= 0) return liste[i];
  }
  return liste[liste.length - 1];
}

/**
 * Eine Minute fuer ein Ereignis dieses Spielers in diesem Abschnitt - nie
 * frueher als sein letztes. Sonst trifft einer in der 43., der in der 41.
 * vom Platz flog.
 */
function minuteFuer(seite, spielerId, von, zufall) {
  const gezogen = von + Math.floor(zufall() * SCHEIBE);
  const minute = Math.max(gezogen, seite.letzte.get(spielerId) || 0);
  seite.letzte.set(spielerId, minute);
  return minute;
}

function vomPlatz(seite, spieler, minute) {
  seite.auf = seite.auf.filter((s) => s.id !== spieler.id);
  seite.minuten.get(spieler.id).bis = minute;
}

function einwechseln(seite, raus, rein, minute, ereignisse, grund) {
  vomPlatz(seite, raus, minute);
  seite.bank = seite.bank.filter((s) => s.id !== rein.id);
  // Der Neue uebernimmt den Platz des Alten.
  seite.auf.push(aufDemPlatz(rein, raus.platz));
  seite.minuten.set(rein.id, { von: minute, bis: null });
  seite.letzte.set(rein.id, minute);
  seite.wechsel += 1;
  ereignisse.push({
    minute, art: 'wechsel', verein: seite.id, spielerId: raus.id, spieler: raus.name, reinId: rein.id, rein: rein.name, platz: raus.platz, grund,
  });
}

/** Was einer von der Bank jetzt auf diesem Platz bringt. */
const aufDerBank = (seite, spieler, platz) => tagesform(spieler, seite.frische.get(spieler.id)) * eignung(spieler, platz);

/** Der Beste von der Bank fuer einen Platz - ins Tor nur ein Torwart, ins Feld keiner. */
function ersatzFuer(seite, platz) {
  return seite.bank
    .filter((s) => (s.position === TOR) === (platz === 'TW'))
    .sort((a, b) => aufDerBank(seite, b, platz) - aufDerBank(seite, a, platz))[0] || null;
}

function abschnitt(seiten, von, heimfaktoren, zufall, ereignisse, anzahlAbschnitte) {
  const [a, b] = [staerkeRechnen(seiten[0], heimfaktoren[0]), staerkeRechnen(seiten[1], heimfaktoren[1])];
  const h = WIRKUNG.hebel;
  const anteil = a.mittelfeld ** h / (a.mittelfeld ** h + b.mittelfeld ** h);
  // Offene Spiele haben mehr Chancen, verriegelte weniger - fuer beide. Das
  // hilft dem Staerkeren, wenn er aufmacht, und dem Schwaecheren, wenn er mauert.
  const offen = 1 + WIRKUNG.tempo * (seiten[0].taktik.ausrichtung + seiten[1].taktik.ausrichtung - 6);
  const chancenJeAbschnitt = (CHANCEN_JE_SPIEL / SCHEIBEN) * offen * (0.85 + zufall() * 0.3);

  // Chancen und Tore.
  [[0, a, b, anteil], [1, b, a, 1 - anteil]].forEach(([i, eigen, gegner, teilhabe]) => {
    const seite = seiten[i];
    const erwartet = chancenJeAbschnitt * teilhabe;
    const chancen = Math.floor(erwartet) + (zufall() < erwartet % 1 ? 1 : 0);
    const abwehr = (1.15 * gegner.abwehr + 0.55 * gegner.torwart) / 1.7;
    const treffer = Math.min(0.5, (eigen.angriff ** h / (eigen.angriff ** h + abwehr ** h)) * WIRKUNG.verwertung);
    for (let c = 0; c < chancen; c++) {
      seite.chancen += 1;
      if (zufall() >= treffer) continue;
      const schuetze = gewichtetWaehlen(seite.auf, (s) => TREFFERNEIGUNG[s.position] * (s.staerke / 70), zufall);
      if (!schuetze) continue;
      seite.tore += 1;
      const vorlage = zufall() < 0.7
        ? gewichtetWaehlen(seite.auf.filter((s) => s.id !== schuetze.id), (s) => VORLAGENEIGUNG[s.position], zufall)
        : null;
      const minute = minuteFuer(seite, schuetze.id, von, zufall);
      if (vorlage) seite.letzte.set(vorlage.id, Math.max(seite.letzte.get(vorlage.id) || 0, minute));
      ereignisse.push({
        minute, art: 'tor', verein: seite.id, spielerId: schuetze.id, spieler: schuetze.name,
        ...(vorlage ? { vorlageId: vorlage.id, vorlage: vorlage.name } : {}),
      });
    }
  });

  // Karten und Verletzungen - die Haerte des Gegners treibt die Verletzungen.
  seiten.forEach((seite, i) => {
    const gegner = seiten[1 - i];
    const karte = (KARTEN_JE_SPIEL * (1 + 0.39 * (seite.taktik.haerte - 3))) / (11 * SCHEIBEN);
    const verletzung = (VERLETZUNG_JE_SPIEL * (1 + 0.33 * (gegner.taktik.haerte - 3))) / SCHEIBEN;
    for (const spieler of seite.auf.slice()) {
      if (zufall() < karte * (seite.gelbe.has(spieler.id) ? VORBELASTET : 1)) {
        const minute = minuteFuer(seite, spieler.id, von, zufall);
        if (zufall() < ROT_ANTEIL) {
          ereignisse.push({ minute, art: 'rot', verein: seite.id, spielerId: spieler.id, spieler: spieler.name });
          vomPlatz(seite, spieler, minute);
          continue;
        }
        const gelbe = (seite.gelbe.get(spieler.id) || 0) + 1;
        seite.gelbe.set(spieler.id, gelbe);
        ereignisse.push({ minute, art: gelbe === 2 ? 'gelbrot' : 'gelb', verein: seite.id, spielerId: spieler.id, spieler: spieler.name });
        if (gelbe === 2) {
          vomPlatz(seite, spieler, minute);
          continue;
        }
      }
      if (zufall() < verletzung) {
        const minute = minuteFuer(seite, spieler.id, von, zufall);
        ereignisse.push({
          minute, art: 'verletzung', verein: seite.id, spielerId: spieler.id, spieler: spieler.name, dauer: 1 + Math.floor(zufall() * 6),
        });
        const ersatz = seite.wechsel < WECHSEL_MAX ? ersatzFuer(seite, spieler.platz) : null;
        if (ersatz) einwechseln(seite, spieler, ersatz, minute, ereignisse, 'verletzung');
        else vomPlatz(seite, spieler, minute);
      }
    }
  });

  // Nach 60, 70 und 80 Minuten: der Muedeste geht - wenn einer von der Bank
  // in diesem Moment nicht viel weniger bringt als er.
  const ende = von + SCHEIBE - 1;
  if (anzahlAbschnitte === SCHEIBEN && [60, 70, 80].includes(ende)) {
    for (const seite of seiten) {
      if (seite.wechselregel !== 'auto' || seite.wechsel >= WECHSEL_MAX) continue;
      const jetzt = (s) => tagesform(s, seite.frische.get(s.id));
      const muede = seite.auf
        .filter((s) => s.position !== TOR && seite.frische.get(s.id) < WECHSEL_FRISCHE)
        .sort((x, y) => seite.frische.get(x.id) - seite.frische.get(y.id))[0];
      if (!muede) continue;
      const ersatz = ersatzFuer(seite, muede.platz);
      if (ersatz && aufDerBank(seite, ersatz, muede.platz) >= jetzt(muede) * WECHSEL_ABSTAND) {
        einwechseln(seite, muede, ersatz, ende, ereignisse, 'muede');
      }
    }
  }

  for (const seite of seiten) {
    const verlust = ermuedung(seite.taktik, seite.geuebt.pressing) * SCHEIBE;
    for (const spieler of seite.auf) {
      seite.frische.set(spieler.id, Math.max(30, seite.frische.get(spieler.id) - verlust));
    }
  }
  return anteil;
}

function elfmeterschiessen(seiten, zufall, ereignisse) {
  const treffer = [0, 0];
  const schuetzen = seiten.map((seite) => seite.auf.filter((s) => s.position !== TOR).sort((x, y) => y.staerke - x.staerke));
  const quote = (seite, gegner, schuetze) => Math.min(0.88, Math.max(0.55, 0.74 + (schuetze.staerke - teil(gegner, TOR)) / 400));
  for (let runde = 0; runde < 30; runde++) {
    for (const i of [0, 1]) {
      const liste = schuetzen[i].length ? schuetzen[i] : seiten[i].auf;
      const schuetze = liste[runde % liste.length];
      const drin = zufall() < quote(seiten[i], seiten[1 - i], schuetze);
      if (drin) treffer[i] += 1;
      ereignisse.push({ minute: 121, art: drin ? 'elfmeter' : 'elfmeter-vergeben', verein: seiten[i].id, spielerId: schuetze.id, spieler: schuetze.name });
    }
    const geschossen = runde + 1;
    if (geschossen < 5) {
      const rest = 5 - geschossen;
      if (treffer[0] > treffer[1] + rest || treffer[1] > treffer[0] + rest) break;
    } else if (treffer[0] !== treffer[1]) {
      break;
    }
  }
  return treffer;
}

/** Schulnote von 1,0 bis 6,0 je Spieler, der mindestens zwanzig Minuten spielte. */
function notenGeben(seiten, ergebnis, zufall) {
  const noten = {};
  seiten.forEach((seite, i) => {
    const eigene = ergebnis.tore[i];
    const fremde = ergebnis.tore[1 - i];
    const vereinsniveau = niveau(seite.verein) || 60;
    for (const [id, { von, bis }] of seite.minuten) {
      const minuten = (bis ?? ergebnis.dauer) - von;
      if (minuten < 20) continue;
      const spieler = [...seite.auf, ...seite.bank, ...seite.verein.spieler].find((s) => s.id === id);
      let note = 3.5 - 0.25 * Math.max(-3, Math.min(3, eigene - fremde)) - (spieler.staerke - vereinsniveau) / 40;
      if (spieler.position === TOR || spieler.position === ABW) note += fremde === 0 ? -0.5 : 0.25 * fremde;
      for (const e of ergebnis.ereignisse) {
        if (e.verein !== seite.id) continue;
        if (e.art === 'tor' && e.spielerId === id) note -= 0.6;
        if (e.art === 'tor' && e.vorlageId === id) note -= 0.3;
        if (e.art === 'gelb' && e.spielerId === id) note += 0.2;
        if ((e.art === 'rot' || e.art === 'gelbrot') && e.spielerId === id) note += 1.5;
      }
      note += (zufall() - 0.5) * 1.2;
      noten[id] = Math.round(Math.min(6, Math.max(1, note)) * 2) / 2;
    }
  });
  return noten;
}

/**
 * Rechnet eine Begegnung.
 *
 * @param {object} heim  Verein
 * @param {object} gast  Verein
 * @param {Function} zufall
 * @param {object} einstellungen
 *   aufstellungen: { heim: {elf, bank}, gast: {elf, bank} }
 *   taktiken:      { heim, gast }
 *   wechselregeln: { heim, gast }
 *   neutral:       kein Heimvorteil (Pokalfinale)
 *   entscheidung:  bei Gleichstand Verlaengerung und Elfmeterschiessen
 */
function begegnung(heim, gast, zufall, einstellungen) {
  const { aufstellungen, taktiken = {}, wechselregeln = {}, neutral = false, entscheidung = false } = einstellungen;
  const seiten = [
    seiteAnlegen(heim, { ...aufstellungen.heim, taktik: taktiken.heim || heim.taktik, wechselregel: wechselregeln.heim || heim.wechselregel }),
    seiteAnlegen(gast, { ...aufstellungen.gast, taktik: taktiken.gast || gast.taktik, wechselregel: wechselregeln.gast || gast.wechselregel }),
  ];
  const heimfaktoren = neutral ? [1, 1] : [HEIMVORTEIL, 1];
  const ereignisse = [];
  let besitz = 0;
  let dauer = SCHEIBEN * SCHEIBE;

  for (let s = 0; s < SCHEIBEN; s++) besitz += abschnitt(seiten, s * SCHEIBE + 1, heimfaktoren, zufall, ereignisse, SCHEIBEN);

  let verlaengerung = false;
  let elfmeter = null;
  if (entscheidung && seiten[0].tore === seiten[1].tore) {
    verlaengerung = true;
    dauer = 120;
    for (let s = 0; s < VERLAENGERUNG; s++) abschnitt(seiten, 90 + s * SCHEIBE + 1, heimfaktoren, zufall, ereignisse, VERLAENGERUNG);
    if (seiten[0].tore === seiten[1].tore) elfmeter = elfmeterschiessen(seiten, zufall, ereignisse);
  }

  ereignisse.sort((x, y) => x.minute - y.minute);
  const tore = [seiten[0].tore, seiten[1].tore];
  let sieger = null;
  if (tore[0] !== tore[1]) sieger = tore[0] > tore[1] ? heim.id : gast.id;
  else if (elfmeter) sieger = elfmeter[0] > elfmeter[1] ? heim.id : gast.id;

  const ergebnis = {
    heim: heim.id,
    gast: gast.id,
    tore,
    chancen: [seiten[0].chancen, seiten[1].chancen],
    besitz: [Math.round((besitz / SCHEIBEN) * 100), 100 - Math.round((besitz / SCHEIBEN) * 100)],
    verlaengerung,
    elfmeter,
    sieger,
    dauer,
    ereignisse,
    aufstellung: {
      heim: { elf: aufstellungen.heim.elf.map((s) => s.id), plaetze: seiten[0].plaetze, bank: aufstellungen.heim.bank.map((s) => s.id) },
      gast: { elf: aufstellungen.gast.elf.map((s) => s.id), plaetze: seiten[1].plaetze, bank: aufstellungen.gast.bank.map((s) => s.id) },
    },
    einsaetze: {},
    gesperrt: { heim: seiten[0].gesperrt, gast: seiten[1].gesperrt },
    taktik: { heim: seiten[0].taktik, gast: seiten[1].taktik },
    eingespielt: { heim: Math.round(seiten[0].geuebt.system * 100), gast: Math.round(seiten[1].geuebt.system * 100) },
  };
  for (const seite of seiten) {
    for (const [id, { von, bis }] of seite.minuten) ergebnis.einsaetze[id] = (bis ?? dauer) - von;
  }
  ergebnis.noten = notenGeben(seiten, ergebnis, zufall);
  return ergebnis;
}

/**
 * Was ein Spiel mit einem Verein macht: Kondition, Moral, Statistik, Karten,
 * Sperren, Verletzungen, Spielpraxis im System. Gibt die Folgen zurueck, die
 * eine Nachricht wert sind.
 */
function nachwirkung(verein, ergebnis) {
  const seite = ergebnis.heim === verein.id ? 'heim' : 'gast';
  const i = seite === 'heim' ? 0 : 1;
  const eigene = ergebnis.tore[i];
  const fremde = ergebnis.tore[1 - i];
  const gewonnen = ergebnis.sieger ? ergebnis.sieger === verein.id : eigene > fremde;
  const unentschieden = !ergebnis.sieger && eigene === fremde;
  const stimmung = gewonnen ? 3 : unentschieden ? 0 : -3;
  const meine = new Map(verein.spieler.map((s) => [s.id, s]));
  const folgen = [];
  const taktik = taktikPruefen(ergebnis.taktik?.[seite]);
  const jeMinute = ermuedung(taktik, eingeuebt(verein, taktik.system).pressing);

  // Wer gesperrt war, hat dieses Spiel abgesessen - vor den neuen Sperren.
  for (const id of ergebnis.gesperrt[seite]) {
    const spieler = meine.get(id);
    if (spieler) spieler.sperre = Math.max(0, spieler.sperre - 1);
  }

  // Wer ein System spielt, spielt sich darin ein.
  if (verein.einstudiert && ergebnis.taktik) {
    const systeme = verein.einstudiert.systeme;
    systeme[taktik.system] = Math.min(100, (systeme[taktik.system] ?? 0) + SPIELPRAXIS);
  }

  const schwelle = niveau(verein);
  for (const spieler of verein.spieler) {
    const minuten = ergebnis.einsaetze[spieler.id];
    if (minuten > 0) {
      spieler.kondition = Math.max(30, Math.round(spieler.kondition - minuten * jeMinute));
      spieler.saison.spiele += 1;
      spieler.saison.minuten += minuten;
      spieler.laufbahn.spiele += 1;
      const note = ergebnis.noten[spieler.id];
      if (note) {
        spieler.saison.notenSumme += note;
        spieler.saison.noten += 1;
      }
      spieler.moral += Math.round((note ? (3.5 - note) * 3 : 0) + stimmung);
    } else if (einsatzbereit(spieler) && spieler.staerke >= schwelle) {
      // Wer gut genug ist und nicht spielt, wird unzufrieden.
      spieler.moral -= 1;
    }
    spieler.moral = Math.min(100, Math.max(10, spieler.moral));
  }

  const platzverweis = new Set(ergebnis.ereignisse.filter((e) => e.verein === verein.id && e.art === 'gelbrot').map((e) => e.spielerId));
  for (const e of ergebnis.ereignisse) {
    if (e.verein !== verein.id) continue;
    const spieler = meine.get(e.spielerId);
    if (e.art === 'tor') {
      if (spieler) {
        spieler.saison.tore += 1;
        spieler.laufbahn.tore += 1;
      }
      const vorlage = meine.get(e.vorlageId);
      if (vorlage) vorlage.saison.vorlagen += 1;
    }
    if (!spieler) continue;
    // Die gelbe Karte vor Gelb-Rot zaehlt nicht fuer die Sperre nach fuenf Gelben.
    if (e.art === 'gelb' && !platzverweis.has(spieler.id)) {
      spieler.gelbe += 1;
      spieler.saison.gelbe += 1;
      if (spieler.gelbe >= GELBSPERRE) {
        spieler.gelbe -= GELBSPERRE;
        spieler.sperre += 1;
        folgen.push({ art: 'sperre', spieler: spieler.name, spiele: 1, grund: 'fuenfte gelbe Karte' });
      }
    }
    if (e.art === 'gelbrot') {
      spieler.sperre += GELBROTSPERRE;
      spieler.saison.platzverweise += 1;
      folgen.push({ art: 'sperre', spieler: spieler.name, spiele: GELBROTSPERRE, grund: 'Gelb-Rot' });
    }
    if (e.art === 'rot') {
      spieler.sperre += ROTSPERRE;
      spieler.saison.platzverweise += 1;
      folgen.push({ art: 'sperre', spieler: spieler.name, spiele: ROTSPERRE, grund: 'rote Karte' });
    }
    if (e.art === 'verletzung') {
      spieler.verletzt = Math.max(spieler.verletzt, e.dauer);
      folgen.push({ art: 'verletzung', spieler: spieler.name, wochen: e.dauer });
    }
  }
  return folgen;
}

module.exports = {
  begegnung, nachwirkung, taktikPruefen, eingeuebt, ermuedung, mannschaftsteile,
  TAKTIK_VORGABE, AUSRICHTUNGEN, HEIMVORTEIL, ERMUEDUNG_JE_MINUTE, SPIELPRAXIS, WIRKUNG, ANZAHL_GEWICHT,
  GELBSPERRE, ROTSPERRE, GELBROTSPERRE, WECHSEL_MAX, SCHEIBEN,
};
