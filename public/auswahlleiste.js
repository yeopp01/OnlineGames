// Unten im Spielbild: was ein ausgewaehltes eigenes Gebaeude kann
// (→ specs/10-strategie/bedienung.md AC-26). Ein Knopf je Einheit mit Bild
// und Kosten, darunter die Warteschlange; der laufende Auftrag zeigt seinen
// Fortschritt, ein Klick auf einen Eintrag bricht ihn ab (bauen AC-10, AC-11).
// Rechnen tut hier nichts: die Leiste zeigt den Zustand und schickt Absichten.
import { figurZeichnen } from './figuren.js';
import { GEBAEUDE } from './gebaeude.js';

// Was Gebaeude ausbilden und was es kostet. Der Server prueft es noch einmal;
// hier steht es nur, damit der Knopf vorher sagen kann, was fehlt.
const AUSBILDUNG = {
  dorfzentrum: [{ art: 'dorfbewohner', name: 'Dorfbewohner', kosten: { nahrung: 50 }, taste: 'Q' }],
};
const ROHSTOFF_NAMEN = { holz: 'Holz', nahrung: 'Nahrung', gold: 'Gold', stein: 'Stein' };

function bildchen(art, groesse, farbe) {
  const leinwand = document.createElement('canvas');
  const dichte = window.devicePixelRatio || 1;
  leinwand.width = groesse * dichte;
  leinwand.height = groesse * dichte;
  leinwand.style.width = `${groesse}px`;
  leinwand.style.height = `${groesse}px`;
  const stift = leinwand.getContext('2d');
  stift.scale(dichte, dichte);
  figurZeichnen(stift, art, groesse / 2, groesse * 0.95, groesse * 0.95, farbe);
  return leinwand;
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
    if (!gebaeude || gebaeude.b !== a.ich) {
      this.wurzel.hidden = true;
      this.gezeigt = null;
      return;
    }
    const farbe = a.spieler.get(a.ich)?.farbe || '#888888';
    const angebot = AUSBILDUNG[gebaeude.art] || [];
    // Neu gebaut wird nur, wenn sich Schlange, Wartegrund oder Bezahlbarkeit
    // aendern - sonst nur der Balken. So flackert nichts unter dem Zeiger.
    const bezahlbar = angebot.map((e) => this.fehlt(e.kosten)).join('|');
    const schluessel = `${gebaeude.i}:${gebaeude.s.join(',')}:${gebaeude.w}:${bezahlbar}`;
    if (schluessel !== this.gezeigt) {
      this.bauen(gebaeude, angebot, farbe);
      this.gezeigt = schluessel;
    }
    const balken = this.wurzel.querySelector('.fortschritt > span');
    if (balken) balken.style.width = `${Math.round(gebaeude.f * 100)}%`;
    this.wurzel.hidden = false;
  }

  fehlt(kosten) {
    const vorraete = this.ansicht.vorraete;
    return Object.entries(kosten)
      .filter(([rohstoff, menge]) => vorraete[rohstoff] < menge)
      .map(([rohstoff]) => ROHSTOFF_NAMEN[rohstoff])
      .join(', ');
  }

  bauen(gebaeude, angebot, farbe) {
    const w = this.wurzel;
    w.replaceChildren();

    const kopf = document.createElement('div');
    kopf.className = 'auswahl-kopf';
    const name = document.createElement('strong');
    name.textContent = GEBAEUDE[gebaeude.art]?.name || gebaeude.art;
    kopf.append(name);
    w.append(kopf);

    const knoepfe = document.createElement('div');
    knoepfe.className = 'ausbilden';
    for (const eintrag of angebot) {
      const knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.dataset.ausbilden = eintrag.art;
      const fehlt = this.fehlt(eintrag.kosten);
      knopf.disabled = Boolean(fehlt);
      const kosten = Object.entries(eintrag.kosten).map(([r, m]) => `${m} ${ROHSTOFF_NAMEN[r]}`).join(', ');
      knopf.title = fehlt ? `${eintrag.name} - zu wenig ${fehlt}` : `${eintrag.name} ausbilden (${kosten})`;
      const text = document.createElement('span');
      text.className = 'kosten';
      text.textContent = Object.values(eintrag.kosten).join(' / ');
      knopf.append(bildchen(eintrag.art, 58, farbe), text);
      knopf.addEventListener('click', () => {
        this.senden({ auftrag: 'ausbilden', gebaeude: gebaeude.i, einheit: eintrag.art });
      });
      knoepfe.append(knopf);
    }
    w.append(knoepfe);

    const schlange = document.createElement('div');
    schlange.className = 'schlange';
    gebaeude.s.forEach((art, platz) => {
      const eintrag = document.createElement('button');
      eintrag.type = 'button';
      eintrag.dataset.abbrechen = String(platz);
      eintrag.title = 'Abbrechen - die Kosten kommen voll zurueck';
      eintrag.append(bildchen(art, platz === 0 ? 50 : 38, farbe));
      if (platz === 0) {
        eintrag.classList.add('laufend');
        const balken = document.createElement('div');
        balken.className = 'fortschritt';
        balken.append(document.createElement('span'));
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
      const hinweis = document.createElement('p');
      hinweis.className = 'wartegrund';
      hinweis.id = 'wartegrund';
      hinweis.textContent = 'Bevoelkerung voll - Haus bauen';
      w.append(hinweis);
    }
  }
}
