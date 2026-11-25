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
// Angriffslauf, H das Dorfzentrum. J kam mit dem Markt (bauen AC-33), K mit
// dem Wunder (bauen AC-51), L mit dem zweiten Dorfzentrum (bauen AC-57).
export const BAUTASTEN = ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'y', 'x', 'c', 'v', 'n', 'm', 'f', 'j', 'k', 'l'];

// Texte auf dem Bildschirm mit echten Umlauten (Entscheidung vom 2026-09-17).
export const BELEGUNG = [
  ['Ziehen mit links', 'Einheiten im Rahmen wählen'],
  ['Klick links', 'eine Einheit oder ein Gebäude wählen – Fremdes nur ansehen'],
  ['Umschalt + Klick oder Ziehen', 'zur Auswahl hinzunehmen'],
  ['Doppelklick', 'alle Einheiten dieser Art im Bild'],
  ['Rechtsklick', 'hingehen, sammeln, bauen – oder Sammelpunkt setzen'],
  ['Umschalt + Rechtsklick', 'Ziel hinten anhängen, der Reihe nach abgehen'],
  ['Umschalt oder Strg beim Bauen', 'weitere Baustellen setzen, der Reihe nach bauen'],
  ['Umschalt + Klick auf eine Einheit im Gebäude', 'fünf auf einmal ausbilden'],
  ['R (Tor in der Hand)', 'das Tor drehen'],
  ['W A S D, Pfeile', 'Karte schieben'],
  ['Maus an den Bildschirmrand', 'Karte schieben – unten abschaltbar'],
  ['Mausrad', 'näher, weiter'],
  ['H', 'Dorfzentrum wählen'],
  ['Q (Dorfzentrum gewählt)', 'Dorfbewohner ausbilden'],
  // Aus der Liste, nicht aufgezaehlt: sie waechst mit den Stufen.
  ['B (Dorfbewohner gewählt)', `Bautasten an, dann ${BAUTASTEN.join(' ').toUpperCase()} für das Gebäude; noch einmal B zeigt die andere Seite`],
  ['.', 'nächster untätiger Dorfbewohner'],
  ['Leertaste', 'zum Dorfzentrum, noch einmal zurück'],
  ['Tab halten', 'Spielstand aller Spieler'],
  ['Strg oder Alt + 1 bis 9', 'Auswahl unter der Ziffer ablegen – Strg nur im Vollbild, im Fenster wechselt der Browser damit den Tab'],
  ['1 bis 9', 'abgelegte Auswahl zurückholen'],
  ['G, dann Rechtsklick', 'Angriffslauf: hingehen und unterwegs angreifen'],
  ['E, dann Klick auf ein eigenes Gebäude', 'Einquartieren: ins Dorfzentrum, in einen Turm oder die Burg'],
  ['Y X C V', 'Haltung: Angreifen, Verteidigen, Stellung halten, Nicht angreifen'],
  ['Esc', 'Angriffslauf, Einquartieren oder Platzieren abbrechen, Auswahl aufheben'],
  ['Entf', 'die gewählte Einheit oder das gewählte Gebäude entfernen – eines je Druck'],
  ['F3 oder Pause', 'Partie anhalten, weiterspielen'],
  ['F10', 'Menü'],
  ['F11', 'Vollbild – Strg + Ziffer und Esc gehören dann dem Spiel; Esc halten oder F11 verlässt es'],
  ['? oder F1', 'diese Übersicht'],
];

export class Tasten {
  /**
   * @param {import('./ansicht.js').Ansicht} ansicht
   * @param {HTMLElement} wurzel die Auswahlleiste
   * @param {HTMLElement} uebersicht das Feld der Tastenuebersicht
   * @param {import('./ton.js').Ton} [ton] fuer die zwei Schalter in der Uebersicht
   */
  constructor(ansicht, wurzel, uebersicht, ton = null) {
    this.ansicht = ansicht;
    this.ton = ton;
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
    // Schieben am Rand (bedienung AC-9) ist hier abschaltbar: wer die Maus
    // gern an den Rand legt, findet den Schalter dort, wo die Taste steht.
    const schalter = (id, text, an, setzen) => {
      const zeile = document.createElement('label');
      zeile.className = 'schalter';
      const kasten = document.createElement('input');
      kasten.type = 'checkbox';
      kasten.id = id;
      kasten.checked = an;
      kasten.addEventListener('change', () => setzen(kasten.checked));
      zeile.append(kasten, ` ${text}`);
      // Der Klick auf den Schalter schliesst die Uebersicht nicht.
      zeile.addEventListener('click', (e) => e.stopPropagation());
      return zeile;
    };
    const alle = [schalter('rand-schieben', 'Karte am Bildschirmrand schieben', this.ansicht.randSchieben, (an) => this.ansicht.randSchiebenSetzen(an))];
    // Ton (bedienung AC-61): Geraeusche und Musik einzeln, die Wahl merkt
    // sich der Browser.
    if (this.ton) {
      alle.push(
        schalter('ton-geraeusche', 'Geräusche', this.ton.geraeusche, (an) => this.ton.geraeuscheSetzen(an)),
        schalter('ton-musik', 'Musik', this.ton.musik, (an) => this.ton.musikSetzen(an)),
      );
    }
    const hinweis = document.createElement('p');
    hinweis.className = 'leise';
    hinweis.textContent = 'Schließen: noch einmal ? oder F1, Esc oder ein Klick.';
    this.uebersicht.replaceChildren(titel, liste, ...alle, hinweis);
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
    // F3 haelt an und spielt weiter, wie in der Vorlage; die Pause-Taste
    // daneben (speichern AC-19). Ohne `preventDefault` sucht F3 im Browser.
    if (e.key === 'F3' || e.key === 'Pause') {
      e.preventDefault();
      this.ansicht.beiPause?.();
      return true;
    }
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
      // Noch einmal B: die andere Seite des Baumenues (bedienung AC-64). Die
      // Bautasten bleiben an.
      if (taste === 'b') {
        const reiter = [...this.wurzel.querySelectorAll('#baumenue [data-bauseite]')];
        const jetzt = reiter.findIndex((k) => k.getAttribute('aria-pressed') === 'true');
        if (reiter.length) reiter[(jetzt + 1) % reiter.length].click();
        return true;
      }
      const nummer = BAUTASTEN.indexOf(taste);
      this.bauenSetzen(false);
      if (nummer >= 0) {
        const knoepfe = this.wurzel.querySelectorAll('#baumenue [data-bauen]');
        knoepfe[nummer]?.click();
        return true;
      }
      if (e.key === 'Escape') return true;
    }

    // R dreht das Tor in der Hand (bauen AC-37). Nur dann: sonst gehoert die
    // Taste niemandem.
    if (taste === 'r' && a.platzieren && a.platzDrehen()) return true;

    // G schaltet den Angriffslauf ein (kampf AC-4). Nicht A: das schiebt die
    // Karte nach links (W A S D). G wie "gegen".
    if (taste === 'g') {
      if (!a.ausgewaehlt.size) return true;
      if (a.platzieren) a.platzierenBeenden();
      a.angriffslaufSetzen(!a.angriffslauf);
      return true;
    }
    // E schaltet das Einquartieren ein (bauen AC-58): der naechste
    // Linksklick waehlt das Gebaeude. Ohne Einheit, die hinein darf, nichts.
    if (taste === 'e' && a.ausgewaehlt.size) {
      if (a.einquartierenAn) a.einquartierenSetzen(false);
      else if (a.einquartierbare().length) {
        if (a.platzieren) a.platzierenBeenden();
        a.einquartierenSetzen(true);
      } else return false;
      return true;
    }
    // Y X C V setzen die Haltung (kampf AC-28) - ueber den Knopf, damit
    // Taste und Klick dasselbe tun. Nebeneinander links unten, wie die Knoepfe.
    const haltung = { y: 'angriff', x: 'verteidigung', c: 'stellung', v: 'passiv' }[taste];
    if (haltung && a.ausgewaehlt.size) {
      const knopf = this.wurzel.querySelector(`[data-befehl="haltung-${haltung}"]`);
      if (knopf instanceof HTMLElement) {
        knopf.click();
        return true;
      }
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
