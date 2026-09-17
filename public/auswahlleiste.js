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
      const schluessel = `g${gebaeude.i}:${gebaeude.h}:${gebaeude.s.join(',')}:${gebaeude.w}:${bezahlbar}`;
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
    if (auswahl.length) {
      const bauplan = this.bauplan(auswahl);
      const bezahlbar = bauplan.map((e) => this.fehlt(e.kosten)).join('|');
      const einzeln = auswahl.length === 1 ? auswahl[0] : null;
      const schluessel = einzeln
        ? `e${einzeln.i}:${einzeln.h}:${einzeln.l}:${einzeln.a}:${bezahlbar}:${a.platzieren?.art}`
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
    return (werte.gebaeude[gebaeude.art]?.bildetAus || []).map((art) => ({
      art,
      name: FIGUREN[art]?.name || art,
      kosten: werte.einheiten[art]?.kosten || {},
    }));
  }

  // Was die Auswahl bauen kann: jedes Gebaeude, das mindestens einer baut.
  bauplan(auswahl) {
    const werte = this.ansicht.werte;
    const arten = new Set();
    for (const e of auswahl) {
      if (e.b !== this.ansicht.ich) continue;
      for (const art of werte.einheiten[this.ansicht.arten[e.k]]?.baut || []) arten.add(art);
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
    this.wurzel.append(element('div', 'auswahl-kopf', `${auswahl.length} ausgewaehlt`), gruppe);
  }

  // Das Baumenue (bedienung AC-25): ein Knopf je Gebaeude, ein Klick beginnt
  // das Platzieren (bauen AC-4).
  baumenueBauen(bauplan, farbe) {
    const menue = element('div', 'baumenue');
    menue.id = 'baumenue';
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
      knopf.addEventListener('click', () => {
        if (!fehlt) this.ansicht.platzierenBeginnen(eintrag.art);
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
    const voll = werte[art]?.leben ?? 0;
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

    const knoepfe = element('div', 'ausbilden');
    for (const eintrag of angebot) {
      const knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.dataset.ausbilden = eintrag.art;
      const fehlt = this.fehlt(eintrag.kosten);
      knopf.disabled = Boolean(fehlt);
      const kosten = Object.entries(eintrag.kosten).map(([r, m]) => `${m} ${ROHSTOFF_NAMEN[r]}`).join(', ');
      knopf.title = fehlt ? `${eintrag.name} - zu wenig ${fehlt}` : `${eintrag.name} ausbilden (${kosten})`;
      knopf.append(bildchen(eintrag.art, 58, farbe), element('span', 'kosten', Object.values(eintrag.kosten).join(' / ')));
      knopf.addEventListener('click', () => {
        this.senden({ auftrag: 'ausbilden', gebaeude: gebaeude.i, einheit: eintrag.art });
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
      eintrag.append(bildchen(art, platz === 0 ? 50 : 38, farbe));
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
