// Unten im Spielbild: was ausgewaehlt ist und was es kann.
// - ein eigenes Gebaeude: Name, Leben, ein Knopf je Einheit mit Bild und
//   Kosten, darunter die Warteschlange; der laufende Auftrag zeigt seinen
//   Fortschritt, ein Klick auf einen Eintrag bricht ihn ab
//   (→ specs/10-strategie/bedienung.md AC-26, bauen AC-10, AC-11)
// - eine Einheit: Bild, Name, Leben und beim Dorfbewohner, was er traegt (AC-29)
// Rechnen tut hier nichts: die Leiste zeigt den Zustand und schickt Absichten.
// Werte wie Leben und Kosten kommen vom Server mit dem Aufbau (ansicht.werte).
import { FIGUREN, WAREN, figurZeichnen } from './figuren.js';
import { GEBAEUDE } from './gebaeude.js';

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

    const einheit = a.ausgewaehlt.size === 1 ? a.nachher.get([...a.ausgewaehlt][0]) : null;
    if (einheit) {
      const schluessel = `e${einheit.i}:${einheit.h}:${einheit.l}:${einheit.a}`;
      if (schluessel !== this.gezeigt) {
        this.einheitBauen(einheit, farbe);
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

  fehlt(kosten) {
    const vorraete = this.ansicht.vorraete;
    return Object.entries(kosten)
      .filter(([rohstoff, menge]) => vorraete[rohstoff] < menge)
      .map(([rohstoff]) => ROHSTOFF_NAMEN[rohstoff])
      .join(', ');
  }

  einheitBauen(einheit, farbe) {
    const w = this.wurzel;
    w.replaceChildren();
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
