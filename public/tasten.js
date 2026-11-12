// Tastenkuerzel und Tastenuebersicht (→ specs/10-strategie/bedienung.md AC-27, AC-22).
//
// H waehlt das Dorfzentrum, dort bildet Q einen Dorfbewohner aus. Mit
// ausgewaehlten Dorfbewohnern schaltet B die Bautasten ein, und die obere
// Buchstabenreihe waehlt das Gebaeude in der Reihenfolge des Baumenues - erst
// nach B, damit W A S D sonst weiter die Karte schieben. ? oder F1 zeigt die
// Uebersicht; sie entsteht aus derselben Liste, die hier die Tasten belegt.

// Die Reihe, in der die Gebaeude des Baumenues ihre Tasten bekommen.
// Nach der oberen Reihe die untere: A S D schieben die Karte (bauen AC-28),
// B schaltet die Bautasten, V kam mit dem Wachturm (bauen AC-29), N mit der
// Mauer (bauen AC-30) - B selbst bleibt der Schalter. Danach die mittlere
// Reihe hinter A S D: F kam mit der Burg (bauen AC-32); G bleibt der
// Angriffslauf, H das Dorfzentrum. J kam mit dem Markt (bauen AC-33).
export const BAUTASTEN = ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'y', 'x', 'c', 'v', 'n', 'm', 'f', 'j'];

// Texte auf dem Bildschirm mit echten Umlauten (Entscheidung vom 2026-09-17).
export const BELEGUNG = [
  ['Ziehen mit links', 'Einheiten im Rahmen wählen'],
  ['Klick links', 'eine Einheit oder ein Gebäude wählen'],
  ['Rechtsklick', 'hingehen, sammeln, bauen – oder Sammelpunkt setzen'],
  ['W A S D, Pfeile', 'Karte schieben'],
  ['Mausrad', 'näher, weiter'],
  ['H', 'Dorfzentrum wählen'],
  ['Q (Dorfzentrum gewählt)', 'Dorfbewohner ausbilden'],
  // Aus der Liste, nicht aufgezaehlt: sie waechst mit den Stufen.
  ['B (Dorfbewohner gewählt)', `Bautasten an, dann ${BAUTASTEN.join(' ').toUpperCase()} für das Gebäude`],
  ['.', 'nächster untätiger Dorfbewohner'],
  ['Strg oder Alt + 1 bis 9', 'Auswahl unter der Ziffer ablegen'],
  ['1 bis 9', 'abgelegte Auswahl zurückholen'],
  ['G, dann Rechtsklick', 'Angriffslauf: hingehen und unterwegs angreifen'],
  ['Esc', 'Angriffslauf oder Platzieren abbrechen, Auswahl aufheben'],
  ['? oder F1', 'diese Übersicht'],
];

export class Tasten {
  /**
   * @param {import('./ansicht.js').Ansicht} ansicht
   * @param {HTMLElement} wurzel die Auswahlleiste
   * @param {HTMLElement} uebersicht das Feld der Tastenuebersicht
   */
  constructor(ansicht, wurzel, uebersicht) {
    this.ansicht = ansicht;
    this.wurzel = wurzel;
    this.uebersicht = uebersicht;
    this.bauen = false; // B gedrueckt, die naechste Buchstabentaste waehlt ein Gebaeude
    this.uebersichtFuellen();
    uebersicht.addEventListener('click', () => this.uebersichtZeigen(false));
  }

  uebersichtFuellen() {
    const liste = document.createElement('dl');
    for (const [taste, wirkung] of BELEGUNG) {
      const dt = document.createElement('dt');
      dt.textContent = taste;
      const dd = document.createElement('dd');
      dd.textContent = wirkung;
      liste.append(dt, dd);
    }
    const titel = document.createElement('h2');
    titel.textContent = 'Tasten';
    const hinweis = document.createElement('p');
    hinweis.className = 'leise';
    hinweis.textContent = 'Schließen: noch einmal ? oder F1, Esc oder ein Klick.';
    this.uebersicht.replaceChildren(titel, liste, hinweis);
  }

  uebersichtZeigen(an = this.uebersicht.hidden) {
    this.uebersicht.hidden = !an;
  }

  /** Eine Taste; `true` heisst: verbraucht, die Ansicht soll sie nicht sehen. */
  taste(e) {
    // Gruppen (bedienung AC-5): nach der Taste selbst, nicht nach dem Zeichen -
    // mit Umschalt oder auf anderer Belegung ist e.key kein "1".
    const ziffer = /^Digit([1-9])$/.exec(e.code)?.[1];
    if (ziffer && !e.shiftKey && !e.metaKey) {
      // Strg wie im Original; Alt daneben, weil Chrome Strg+1 bis 8 fuer die
      // Tabs behalten kann (nicht geprueft, siehe Spec).
      if (e.ctrlKey || e.altKey) {
        e.preventDefault();
        this.ansicht.gruppeAblegen(Number(ziffer));
        return true;
      }
      if (!this.bauen) {
        this.ansicht.gruppeAbrufen(Number(ziffer));
        return true;
      }
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    const taste = e.key.toLowerCase();
    if (taste === '?' || e.key === 'F1') {
      e.preventDefault();
      this.uebersichtZeigen();
      return true;
    }
    if (!this.uebersicht.hidden && e.key === 'Escape') {
      this.uebersichtZeigen(false);
      return true;
    }
    const a = this.ansicht;

    if (this.bauen) {
      const nummer = BAUTASTEN.indexOf(taste);
      this.bauenSetzen(false);
      if (nummer >= 0) {
        const knoepfe = this.wurzel.querySelectorAll('#baumenue [data-bauen]');
        knoepfe[nummer]?.click();
        return true;
      }
      if (e.key === 'Escape') return true;
    }

    // G schaltet den Angriffslauf ein (kampf AC-4). Nicht A: das schiebt die
    // Karte nach links (W A S D). G wie "gegen".
    if (taste === 'g') {
      if (!a.ausgewaehlt.size) return true;
      if (a.platzieren) a.platzierenBeenden();
      a.angriffslaufSetzen(!a.angriffslauf);
      return true;
    }
    if (taste === 'h') {
      const zentrum = [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'dorfzentrum' && g.u === undefined);
      if (!zentrum) return true;
      if (a.platzieren) a.platzierenBeenden();
      a.ausgewaehlt.clear();
      a.gewaehltesGebaeude = zentrum.i;
      const mitte = a.gebaeudeMitte(zentrum);
      a.blickAuf(mitte.x, mitte.y);
      a.beiAuswahl();
      return true;
    }
    if (taste === 'q' && a.gewaehltesGebaeude) {
      const knopf = this.wurzel.querySelector('[data-ausbilden="dorfbewohner"]');
      if (knopf) {
        knopf.click();
        return true;
      }
    }
    if (taste === 'b' && this.wurzel.querySelector('#baumenue')) {
      this.bauenSetzen(true);
      return true;
    }
    return false;
  }

  bauenSetzen(an) {
    this.bauen = an;
    // Die Auswahlleiste baut ihr Menue oft neu - sie liest den Zustand hier.
    this.ansicht.bautasten = an;
    this.wurzel.querySelector('#baumenue')?.classList.toggle('tasten', an);
  }
}
