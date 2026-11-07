// Unten im Spielbild: was ausgewaehlt ist und was es kann.
// - ein eigenes Gebaeude: Name, Leben, ein Knopf je Einheit mit Bild und
//   Kosten, darunter die Warteschlange; der laufende Auftrag zeigt seinen
//   Fortschritt, ein Klick auf einen Eintrag bricht ihn ab
//   (→ specs/10-strategie/bedienung.md AC-26, bauen AC-10, AC-11)
// - eine Einheit: Bild, Name, Leben und beim Dorfbewohner, was er traegt (AC-29)
// - Dorfbewohner in der Auswahl: das Baumenue mit Bild und Kosten; was nicht
//   bezahlbar ist, ist ausgegraut und sagt, was fehlt (AC-25)
// - eine eigene Baustelle: Fortschritt und Abriss (bauen AC-6)
// Rechnen tut hier nichts: die Leiste zeigt den Zustand und schickt Absichten.
// Werte wie Leben und Kosten kommen vom Server mit dem Aufbau (ansicht.werte).
import { BAUTASTEN } from './tasten.js';
import { FIGUREN, WAREN, figurZeichnen } from './figuren.js';
import { GEBAEUDE, gebaeudeZeichnen } from './gebaeude.js';

const ROHSTOFF_NAMEN = { holz: 'Holz', nahrung: 'Nahrung', gold: 'Gold', stein: 'Stein' };

function bildchen(art, groesse, farbe, lage = {}) {
  const leinwand = document.createElement('canvas');
  const dichte = window.devicePixelRatio || 1;
  leinwand.width = groesse * dichte;
  leinwand.height = groesse * dichte;
  leinwand.style.width = `${groesse}px`;
  leinwand.style.height = `${groesse}px`;
  const stift = leinwand.getContext('2d');
  stift.scale(dichte, dichte);
  figurZeichnen(stift, art, groesse / 2, groesse * 0.95, groesse * 0.95, farbe, lage);
  return leinwand;
}

// Der Aufstieg als Bild: ein Torbogen mit Zinnen, davor eine Fahne in der
// Volksfarbe - das naechste Zeitalter oeffnet sich (bauen AC-23).
function aufstiegBildchen(groesse, farbe) {
  const leinwand = document.createElement('canvas');
  const dichte = window.devicePixelRatio || 1;
  leinwand.width = groesse * dichte;
  leinwand.height = groesse * dichte;
  leinwand.style.width = `${groesse}px`;
  leinwand.style.height = `${groesse}px`;
  const s = leinwand.getContext('2d');
  s.scale(dichte, dichte);
  const g = groesse;
  // Zwei Tuerme und der Riegel darueber, aus warmem Stein.
  const stein = s.createLinearGradient(0, 0.2 * g, 0, 0.9 * g);
  stein.addColorStop(0, '#b9a98c');
  stein.addColorStop(1, '#7d705a');
  s.fillStyle = stein;
  s.fillRect(0.12 * g, 0.3 * g, 0.2 * g, 0.6 * g);
  s.fillRect(0.68 * g, 0.3 * g, 0.2 * g, 0.6 * g);
  s.fillRect(0.12 * g, 0.3 * g, 0.76 * g, 0.16 * g);
  // Zinnen auf beiden Tuermen.
  for (const x of [0.12, 0.23, 0.68, 0.79]) s.fillRect(x * g, 0.2 * g, 0.09 * g, 0.12 * g);
  // Die Durchfahrt: dunkel, oben rund.
  s.fillStyle = '#2b2219';
  s.beginPath();
  s.moveTo(0.36 * g, 0.9 * g);
  s.lineTo(0.36 * g, 0.66 * g);
  s.arc(0.5 * g, 0.66 * g, 0.14 * g, Math.PI, 0);
  s.lineTo(0.64 * g, 0.9 * g);
  s.closePath();
  s.fill();
  // Die Fahne am Riegel, in der Volksfarbe.
  s.fillStyle = farbe;
  s.beginPath();
  s.moveTo(0.5 * g, 0.46 * g);
  s.lineTo(0.5 * g, 0.12 * g);
  s.lineTo(0.78 * g, 0.19 * g);
  s.lineTo(0.5 * g, 0.26 * g);
  s.closePath();
  s.fill();
  s.strokeStyle = 'rgba(46, 34, 24, 0.6)';
  s.lineWidth = g * 0.03;
  s.beginPath();
  s.moveTo(0.5 * g, 0.46 * g);
  s.lineTo(0.5 * g, 0.1 * g);
  s.stroke();
  return leinwand;
}

// Ein kleiner Webstuhl als Bild fuer den Knopf: Rahmen, Kettfaeden, ein Stueck Tuch.
function webstuhlBildchen(groesse, farbe) {
  const leinwand = document.createElement('canvas');
  const dichte = window.devicePixelRatio || 1;
  leinwand.width = groesse * dichte;
  leinwand.height = groesse * dichte;
  leinwand.style.width = `${groesse}px`;
  leinwand.style.height = `${groesse}px`;
  const s = leinwand.getContext('2d');
  s.scale(dichte, dichte);
  const g = groesse;
  s.lineCap = 'round';
  s.strokeStyle = '#6b4a2b';
  s.lineWidth = g * 0.07;
  for (const [x0, y0, x1, y1] of [[0.2, 0.9, 0.2, 0.15], [0.8, 0.9, 0.8, 0.15], [0.15, 0.22, 0.85, 0.22], [0.15, 0.75, 0.85, 0.75]]) {
    s.beginPath();
    s.moveTo(x0 * g, y0 * g);
    s.lineTo(x1 * g, y1 * g);
    s.stroke();
  }
  s.strokeStyle = 'rgba(240, 230, 200, 0.85)';
  s.lineWidth = g * 0.015;
  for (let i = 0; i < 8; i++) {
    const x = (0.27 + i * 0.066) * g;
    s.beginPath();
    s.moveTo(x, 0.24 * g);
    s.lineTo(x, 0.73 * g);
    s.stroke();
  }
  const tuch = s.createLinearGradient(0, 0.5 * g, 0, 0.73 * g);
  tuch.addColorStop(0, farbe);
  tuch.addColorStop(1, 'rgba(0,0,0,0.5)');
  s.fillStyle = tuch;
  s.fillRect(0.26 * g, 0.5 * g, 0.48 * g, 0.23 * g);
  s.strokeStyle = 'rgba(255,255,255,0.35)';
  s.lineWidth = g * 0.012;
  for (let i = 0; i < 4; i++) {
    s.beginPath();
    s.moveTo(0.26 * g, (0.54 + i * 0.05) * g);
    s.lineTo(0.74 * g, (0.54 + i * 0.05) * g);
    s.stroke();
  }
  return leinwand;
}

function gebaeudeBildchen(art, groesse, farbe, n) {
  const leinwand = document.createElement('canvas');
  const dichte = window.devicePixelRatio || 1;
  leinwand.width = groesse * dichte;
  leinwand.height = groesse * dichte;
  leinwand.style.width = `${groesse}px`;
  leinwand.style.height = `${groesse}px`;
  const stift = leinwand.getContext('2d');
  stift.scale(dichte, dichte);
  // Jedes Gebaeude gleich breit im Knopf, egal wie gross es im Spiel ist.
  gebaeudeZeichnen(stift, art, groesse / 2, groesse * 0.74, groesse / (2.3 * n), farbe, n);
  return leinwand;
}

function element(name, klasse, text) {
  const e = document.createElement(name);
  if (klasse) e.className = klasse;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Name und Lebensbalken, fuer Einheit und Gebaeude gleich. */
function kopf(name, leben, voll) {
  const k = element('div', 'auswahl-kopf');
  k.append(element('strong', null, name));
  const zeile = element('div', 'leben');
  zeile.dataset.leben = `${leben}/${voll}`;
  const balken = element('div', 'lebensbalken');
  const fuellung = element('span');
  fuellung.style.width = `${Math.round((leben / voll) * 100)}%`;
  balken.append(fuellung);
  zeile.append(balken, element('span', 'lebenszahl', `${leben} / ${voll}`));
  k.append(zeile);
  return k;
}

export class Auswahlleiste {
  constructor(wurzel, ansicht, senden) {
    this.wurzel = wurzel;
    this.ansicht = ansicht;
    this.senden = senden;
    this.gezeigt = null; // Schluessel des zuletzt gebauten Inhalts
  }

  aktualisieren() {
    const a = this.ansicht;
    const gebaeude = a.gewaehltesGebaeude ? a.gebaeude.get(a.gewaehltesGebaeude) : null;
    const farbe = a.spieler.get(a.ich)?.farbe || '#888888';

    if (gebaeude && gebaeude.b === a.ich && gebaeude.u !== undefined) {
      const schluessel = `b${gebaeude.i}:${gebaeude.u}`;
      if (schluessel !== this.gezeigt) {
        this.baustelleBauen(gebaeude, farbe);
        this.gezeigt = schluessel;
      }
      this.wurzel.hidden = false;
      return;
    }

    if (gebaeude && gebaeude.b === a.ich) {
      const angebot = this.angebot(gebaeude);
      // Neu gebaut wird nur, wenn sich etwas Sichtbares aendert - sonst nur
      // der Balken. So flackert nichts unter dem Zeiger.
      const bezahlbar = angebot.map((e) => this.fehlt(e.kosten)).join('|');
      const schluessel = `g${gebaeude.i}:${gebaeude.h}:${gebaeude.n}:${gebaeude.s.join(',')}:${gebaeude.w}:${bezahlbar}:${a.verbesserungen.join(',')}:${a.zeitalter}`;
      if (schluessel !== this.gezeigt) {
        this.gebaeudeBauen(gebaeude, angebot, farbe);
        this.gezeigt = schluessel;
      }
      const balken = this.wurzel.querySelector('.fortschritt > span');
      if (balken) balken.style.width = `${Math.round(gebaeude.f * 100)}%`;
      this.wurzel.hidden = false;
      return;
    }

    const auswahl = [...a.ausgewaehlt].map((id) => a.nachher.get(id)).filter(Boolean);
    const schafe = [...a.ausgewaehlt].map((id) => a.tiere.get(id)).filter(Boolean);
    if (!auswahl.length && schafe.length) {
      const schluessel = `t${schafe.map((t) => t.i).join(',')}`;
      if (schluessel !== this.gezeigt) {
        this.wurzel.replaceChildren();
        const bild = element('div', 'auswahl-bild');
        bild.append(bildchen('schaf', 58, farbe));
        const k = element('div', 'auswahl-kopf');
        k.append(element('strong', null, schafe.length === 1 ? 'Schaf' : `${schafe.length} Schafe`));
        const nahrung = schafe.reduce((s, t) => s + (t.n ?? 0), 0);
        const zeile = element('div', 'ladung');
        zeile.id = 'schafnahrung';
        zeile.append(element('span', 'ware ware-n'), element('span', null, `${nahrung} Nahrung`), element('span', 'leise', ' - Rechtsklick treibt'));
        this.wurzel.append(bild, k, zeile);
        this.gezeigt = schluessel;
      }
      this.wurzel.hidden = false;
      return;
    }
    if (auswahl.length) {
      const bauplan = this.bauplan(auswahl);
      const bezahlbar = bauplan.map((e) => this.fehlt(e.kosten)).join('|');
      const einzeln = auswahl.length === 1 ? auswahl[0] : null;
      const schluessel = einzeln
        ? `e${einzeln.i}:${einzeln.h}:${einzeln.l}:${einzeln.a}:${bezahlbar}:${a.platzieren?.art}:${a.verbesserungen.length}`
        : `m${auswahl.map((e) => e.i).join(',')}:${bezahlbar}:${a.platzieren?.art}`;
      if (schluessel !== this.gezeigt) {
        this.wurzel.replaceChildren();
        if (einzeln) this.einheitBauen(einzeln, farbe);
        else this.gruppeBauen(auswahl, farbe);
        if (bauplan.length) this.baumenueBauen(bauplan, farbe);
        this.gezeigt = schluessel;
      }
      this.wurzel.hidden = false;
      return;
    }

    this.wurzel.hidden = true;
    this.gezeigt = null;
  }

  // Was ein Gebaeude ausbildet, mit den Kosten aus den Werten des Servers.
  angebot(gebaeude) {
    const werte = this.ansicht.werte;
    const aufstiege = werte.aufstiege || {};
    return (werte.gebaeude[gebaeude.art]?.bildetAus || [])
      // Eine erforschte Verbesserung verschwindet aus dem Angebot (bauen AC-21).
      .filter((art) => !this.ansicht.verbesserungen.includes(art))
      // Von den Zeitaltern steht nur das naechste zur Wahl (bauen AC-23) -
      // alle drei auf einmal waeren drei Knoepfe, von denen zwei absagen.
      .filter((art) => !aufstiege[art] || aufstiege[art].stufe === this.ansicht.zeitalter + 1)
      .map((art) => ({
        art,
        name: aufstiege[art]?.name || werte.verbesserungen?.[art]?.name || FIGUREN[art]?.name || art,
        kosten: werte.einheiten[art]?.kosten || werte.verbesserungen?.[art]?.kosten || aufstiege[art]?.kosten || {},
        verbesserung: Boolean(werte.verbesserungen?.[art]),
        aufstieg: Boolean(aufstiege[art]),
      }));
  }

  // Was die Auswahl bauen kann: jedes Gebaeude, das mindestens einer baut -
  // und das im erreichten Zeitalter schon zu haben ist (bauen AC-24). Was
  // spaeter kommt, steht gar nicht erst im Menue.
  bauplan(auswahl) {
    const werte = this.ansicht.werte;
    const arten = new Set();
    for (const e of auswahl) {
      if (e.b !== this.ansicht.ich) continue;
      for (const art of werte.einheiten[this.ansicht.arten[e.k]]?.baut || []) {
        if ((werte.gebaeude[art]?.zeitalter || 0) <= this.ansicht.zeitalter) arten.add(art);
      }
    }
    return [...arten].map((art) => ({
      art,
      name: GEBAEUDE[art]?.name || art,
      kosten: werte.gebaeude[art]?.kosten || {},
      groesse: werte.gebaeude[art]?.groesse || 1,
    }));
  }

  gruppeBauen(auswahl, farbe) {
    const zaehlung = new Map();
    for (const e of auswahl) {
      const art = this.ansicht.arten[e.k] || 'dorfbewohner';
      zaehlung.set(art, (zaehlung.get(art) || 0) + 1);
    }
    const gruppe = element('div', 'gruppe');
    for (const [art, anzahl] of zaehlung) {
      const eintrag = element('div', 'gruppe-eintrag');
      eintrag.append(bildchen(art, 40, farbe), element('span', null, `${anzahl}`));
      eintrag.title = `${anzahl} ${FIGUREN[art]?.name || art}`;
      gruppe.append(eintrag);
    }
    this.wurzel.append(element('div', 'auswahl-kopf', `${auswahl.length} ausgewählt`), gruppe);
  }

  // Das Baumenue (bedienung AC-25): ein Knopf je Gebaeude, ein Klick beginnt
  // das Platzieren (bauen AC-4).
  baumenueBauen(bauplan, farbe) {
    const menue = element('div', 'baumenue');
    menue.id = 'baumenue';
    if (this.ansicht.bautasten) menue.classList.add('tasten');
    for (const eintrag of bauplan) {
      const knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.dataset.bauen = eintrag.art;
      const fehlt = this.fehlt(eintrag.kosten);
      // Nicht `disabled`: ein gesperrter Knopf soll beim Ueberfahren noch sagen,
      // was fehlt - das tut er in Chrome nur, wenn er Zeigerereignisse bekommt.
      knopf.setAttribute('aria-disabled', fehlt ? 'true' : 'false');
      if (fehlt) knopf.dataset.fehlt = fehlt;
      const kosten = Object.entries(eintrag.kosten).map(([r, m]) => `${m} ${ROHSTOFF_NAMEN[r]}`).join(', ');
      knopf.title = fehlt ? `${eintrag.name} - zu wenig ${fehlt}` : `${eintrag.name} bauen (${kosten})`;
      if (this.ansicht.platzieren?.art === eintrag.art) knopf.classList.add('aktiv');
      const preis = element('span', 'preis');
      for (const [r, m] of Object.entries(eintrag.kosten)) preis.append(element('span', `ware ware-${r[0]}`), element('span', null, String(m)));
      knopf.append(gebaeudeBildchen(eintrag.art, 52, farbe, eintrag.groesse), element('span', 'bauname', eintrag.name), preis);
      // Die Taste nach B (bedienung AC-27), in der Reihenfolge des Menues.
      const nummer = bauplan.indexOf(eintrag);
      if (nummer < BAUTASTEN.length) knopf.append(element('kbd', 'taste', BAUTASTEN[nummer].toUpperCase()));
      knopf.addEventListener('click', () => {
        // Gesperrt sagt der Klick, warum (bedienung AC-18).
        if (fehlt) this.ansicht.melden(`Zu wenig ${fehlt}.`);
        else this.ansicht.platzierenBeginnen(eintrag.art);
      });
      menue.append(knopf);
    }
    this.wurzel.append(menue);
  }

  baustelleBauen(gebaeude, farbe) {
    const w = this.wurzel;
    w.replaceChildren();
    const name = GEBAEUDE[gebaeude.art]?.name || gebaeude.art;
    const bild = element('div', 'auswahl-bild');
    bild.append(gebaeudeBildchen(gebaeude.art, 58, farbe, 2));
    const kopfteil = element('div', 'auswahl-kopf');
    kopfteil.append(element('strong', null, `${name} im Bau`));
    const stand = element('div', 'leben');
    stand.id = 'baufortschritt';
    stand.dataset.bau = String(gebaeude.u);
    const balken = element('div', 'lebensbalken baubalken');
    const fuellung = element('span');
    fuellung.style.width = `${Math.round(gebaeude.u * 100)}%`;
    balken.append(fuellung);
    stand.append(balken, element('span', 'lebenszahl', `${Math.round(gebaeude.u * 100)} %`));
    kopfteil.append(stand);
    const abriss = document.createElement('button');
    abriss.type = 'button';
    abriss.dataset.abreissen = String(gebaeude.i);
    abriss.className = 'abriss';
    abriss.textContent = 'Abreissen';
    abriss.title = 'Was noch nicht verbaut ist, kommt zurueck';
    abriss.addEventListener('click', () => this.senden({ auftrag: 'abreissen', gebaeude: gebaeude.i }));
    w.append(bild, kopfteil, abriss);
  }

  fehlt(kosten) {
    const vorraete = this.ansicht.vorraete;
    return Object.entries(kosten)
      .filter(([rohstoff, menge]) => vorraete[rohstoff] < menge)
      .map(([rohstoff]) => ROHSTOFF_NAMEN[rohstoff])
      .join(', ');
  }

  einheitBauen(einheit, farbe) {
    const w = this.wurzel;
    const werte = this.ansicht.werte.einheiten;
    const art = this.ansicht.arten[einheit.k] || 'dorfbewohner';
    const voll = this.ansicht.lebenVoll(einheit);
    const leben = einheit.h ?? voll;

    const bild = element('div', 'auswahl-bild');
    bild.append(bildchen(art, 58, farbe, { ladung: einheit.l > 0 ? einheit.a : null }));
    w.append(bild, kopf(FIGUREN[art]?.name || art, leben, voll));

    // Nur wer tragen kann, zeigt, was er traegt.
    const tragkraft = werte[art]?.tragkraft || 0;
    if (tragkraft > 0) {
      const ladung = element('div', 'ladung');
      ladung.id = 'ladung';
      if (einheit.l > 0) {
        ladung.dataset.ware = einheit.a;
        ladung.append(element('span', `ware ware-${einheit.a}`), element('span', null, `traegt ${einheit.l} ${WAREN[einheit.a]?.name || ''}`));
        ladung.append(element('span', 'leise', ` von ${tragkraft}`));
      } else {
        ladung.append(element('span', 'leise', 'traegt nichts'));
      }
      w.append(ladung);
    }
  }

  gebaeudeBauen(gebaeude, angebot, farbe) {
    const w = this.wurzel;
    w.replaceChildren();
    const voll = this.ansicht.werte.gebaeude[gebaeude.art]?.leben ?? gebaeude.h;
    w.append(kopf(GEBAEUDE[gebaeude.art]?.name || gebaeude.art, gebaeude.h ?? voll, voll));
    // Eine Farm zeigt, wie viel Nahrung sie noch traegt (einheiten AC-18).
    const vorrat = this.ansicht.werte.gebaeude[gebaeude.art]?.nahrung;
    if (vorrat && gebaeude.n !== undefined) {
      const zeile = element('div', 'ladung');
      zeile.id = 'farmvorrat';
      zeile.append(element('span', 'ware ware-n'), element('span', null, `noch ${gebaeude.n} Nahrung`), element('span', 'leise', ` von ${vorrat}`));
      w.append(zeile);
    }

    // Was nichts ausbildet, zeigt weder Knoepfe noch eine leere Schlange.
    if (!angebot.length && !gebaeude.s.length) return;
    const knoepfe = element('div', 'ausbilden');
    for (const eintrag of angebot) {
      const knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.dataset.ausbilden = eintrag.art;
      const fehlt = this.fehlt(eintrag.kosten);
      // Wie im Baumenue: gesperrt, aber noch ansprechbar - er sagt, was fehlt.
      knopf.setAttribute('aria-disabled', fehlt ? 'true' : 'false');
      if (fehlt) knopf.dataset.fehlt = fehlt;
      const kosten = Object.entries(eintrag.kosten).map(([r, m]) => `${m} ${ROHSTOFF_NAMEN[r]}`).join(', ');
      if (eintrag.aufstieg) {
        knopf.dataset.aufstieg = eintrag.art;
        knopf.title = fehlt
          ? `Aufstieg in die ${eintrag.name} - zu wenig ${fehlt}`
          : `Aufstieg in die ${eintrag.name} (${kosten})`;
      } else {
        knopf.title = fehlt ? `${eintrag.name} - zu wenig ${fehlt}` : `${eintrag.name} ausbilden (${kosten})`;
      }
      const preis = element('span', 'preis');
      for (const [r, m] of Object.entries(eintrag.kosten)) preis.append(element('span', `ware ware-${r[0]}`), element('span', null, String(m)));
      if (eintrag.aufstieg) knopf.append(aufstiegBildchen(58, farbe));
      else if (eintrag.verbesserung) knopf.append(webstuhlBildchen(58, farbe));
      else knopf.append(bildchen(eintrag.art, 58, farbe));
      knopf.append(preis);
      knopf.addEventListener('click', () => {
        if (fehlt) this.ansicht.melden(`Zu wenig ${fehlt}.`);
        else this.senden({ auftrag: 'ausbilden', gebaeude: gebaeude.i, einheit: eintrag.art });
      });
      knoepfe.append(knopf);
    }
    w.append(knoepfe);

    const schlange = element('div', 'schlange');
    gebaeude.s.forEach((art, platz) => {
      const eintrag = document.createElement('button');
      eintrag.type = 'button';
      eintrag.dataset.abbrechen = String(platz);
      eintrag.title = 'Abbrechen - die Kosten kommen voll zurueck';
      const mass = platz === 0 ? 50 : 38;
      const verbesserung = Boolean(this.ansicht.werte.verbesserungen?.[art]);
      const aufstieg = Boolean(this.ansicht.werte.aufstiege?.[art]);
      if (aufstieg) {
        eintrag.append(aufstiegBildchen(mass, farbe));
        eintrag.dataset.laufenderAufstieg = art;
      } else if (verbesserung) {
        eintrag.append(webstuhlBildchen(mass, farbe));
      } else {
        eintrag.append(bildchen(art, mass, farbe));
      }
      if (platz === 0) {
        eintrag.classList.add('laufend');
        const balken = element('div', 'fortschritt');
        balken.append(element('span'));
        eintrag.append(balken);
      }
      eintrag.addEventListener('click', () => {
        this.senden({ auftrag: 'abbrechen', gebaeude: gebaeude.i, platz });
      });
      schlange.append(eintrag);
    });
    w.append(schlange);

    // Warum nichts vorangeht (bauen AC-15).
    if (gebaeude.w) {
      const hinweis = element('p', 'wartegrund', 'Bevoelkerung voll - Haus bauen');
      hinweis.id = 'wartegrund';
      w.append(hinweis);
    }
  }
}
