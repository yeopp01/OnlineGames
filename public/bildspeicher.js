// @ts-check
// Ein Zwischenspeicher fuer fertig gezeichnete Bilder (→ darstellung AC-27).
//
// Figuren, Gebaeude, Vorraete und Bodenkacheln werden je Zoomstufe einmal in
// ein kleines Bild gezeichnet und danach nur kopiert. Bis hierher zaehlte
// jeder Speicher Stuecke - 400 Figuren, 240 Gebaeude, 150 Kacheln - und warf
// das zuerst Gezeichnete hinaus, auch wenn es eben noch im Bild stand. Beim
// Zoomen war damit nach zwei Stufen alles fort, was auf dem Rueckweg wieder
// gebraucht wurde (gemessen: jede Stufe ein Bild von 50 bis 100 ms).
//
// Hier zaehlen die Bildpunkte, denn an ihnen haengt der Speicher: eine Kachel
// in doppelter Aufloesung wiegt sechzehnmal so viel wie eine in halber. Und
// hinaus geht, was am laengsten nicht gebraucht wurde.
//
// Dazu eine Frist je Bild des Spiels: eine neue Zoomstufe braucht jedes Stueck
// in neuer Groesse, und alle auf einmal gezeichnet stand das Bild 60 bis
// 120 ms. Ist die Frist um, liegt fuer dieses eine Bild dasselbe Stueck in der
// Groesse von eben da, gestreckt - und die naechsten Bilder zeichnen nach.

/** @typedef {{ width: number, height: number }} Bild */

/** @template {Bild} B */
export class Bildspeicher {
  /**
   * Jeder Speicher unter seinem Namen - damit sich messen laesst, wie viel
   * wo liegt und wie oft neu gezeichnet wurde.
   * @type {Map<string, Bildspeicher<any>>}
   */
  static alle = new Map();

  // So viele Millisekunden darf ein Bild des Spiels an neuen Stuecken zeichnen,
  // bevor Ersatz genommen wird. Ohne `bildBeginn` gilt keine Frist - die
  // Schautafel zeichnet alles gleich.
  static frist = Infinity;
  static verbraucht = 0;
  // Wie viele Stuecke im laufenden Bild nur als Ersatz stehen.
  static ersetzt = 0;

  /**
   * Ein neues Bild des Spiels beginnt.
   * @param {number} frist  Millisekunden fuer neue Stuecke in diesem Bild
   */
  static bildBeginn(frist) {
    Bildspeicher.frist = frist;
    Bildspeicher.verbraucht = 0;
    Bildspeicher.ersetzt = 0;
  }

  /**
   * @param {string} name
   * @param {number} grenze  so viele Bildpunkte liegen hoechstens im Speicher
   */
  constructor(name, grenze) {
    this.name = name;
    this.grenze = grenze;
    /** @type {Map<string, B>} */
    this.bilder = new Map();
    // Je Familie - dasselbe Stueck in jeder Groesse - der Schluessel, unter
    // dem es zuletzt gebraucht wurde.
    /** @type {Map<string, string>} */
    this.familien = new Map();
    this.punkte = 0;
    // Wie oft etwas neu gezeichnet und abgelegt wurde, und wie oft etwas ging.
    this.abgelegt = 0;
    this.verworfen = 0;
    Bildspeicher.alle.set(name, this);
  }

  /** Wie viele Bilder im Speicher liegen. */
  get zahl() {
    return this.bilder.size;
  }

  /**
   * Das Bild unter diesem Schluessel - und es gilt damit als eben gebraucht.
   * @param {string} schluessel
   * @param {string} [familie]  dasselbe Stueck ohne seine Groesse
   * @returns {B | undefined}
   */
  holen(schluessel, familie) {
    const bild = this.bilder.get(schluessel);
    if (bild) {
      // Eine Map haelt die Reihenfolge des Einfuegens: neu eingefuegt steht hinten.
      this.bilder.delete(schluessel);
      this.bilder.set(schluessel, bild);
      if (familie !== undefined) this.familien.set(familie, schluessel);
    }
    return bild;
  }

  /**
   * Ist die Frist des Bildes um, das Stueck in der Groesse von eben zeichnen,
   * gestreckt auf den Platz des neuen. Sagt, ob es das getan hat.
   * @param {CanvasRenderingContext2D} stift
   * @param {string} familie
   * @param {number} x
   * @param {number} y
   * @param {number} breite
   * @param {number} hoehe
   */
  ersatzZeichnen(stift, familie, x, y, breite, hoehe) {
    if (Bildspeicher.verbraucht <= Bildspeicher.frist) return false;
    const schluessel = this.familien.get(familie);
    const bild = schluessel === undefined ? undefined : this.bilder.get(schluessel);
    if (!bild) return false;
    stift.drawImage(/** @type {any} */ (bild), x, y, breite, hoehe);
    Bildspeicher.ersetzt += 1;
    return true;
  }

  /**
   * Nachsehen, ohne dass das Bild als gebraucht gilt.
   * @param {string} schluessel
   * @returns {B | undefined}
   */
  ansehen(schluessel) {
    return this.bilder.get(schluessel);
  }

  /**
   * Ein Bild ablegen. Ist der Speicher danach zu voll, geht das am laengsten
   * nicht Gebrauchte - das eben Abgelegte nie.
   * @param {string} schluessel
   * @param {B} bild
   * @param {string} [familie]  dasselbe Stueck ohne seine Groesse
   * @param {number} [beginn]  wann das Zeichnen begann (`performance.now()`) -
   *   die Zeit seither zaehlt auf die Frist des Bildes
   */
  legen(schluessel, bild, familie, beginn) {
    if (familie !== undefined) this.familien.set(familie, schluessel);
    if (beginn !== undefined) Bildspeicher.verbraucht += performance.now() - beginn;
    this.loeschen(schluessel);
    this.bilder.set(schluessel, bild);
    this.punkte += bild.width * bild.height;
    this.abgelegt += 1;
    while (this.punkte > this.grenze && this.bilder.size > 1) {
      const aeltester = this.bilder.keys().next().value;
      if (aeltester === undefined) break;
      this.loeschen(aeltester);
      this.verworfen += 1;
    }
  }

  /** @param {string} schluessel */
  loeschen(schluessel) {
    const bild = this.bilder.get(schluessel);
    if (!bild) return;
    this.bilder.delete(schluessel);
    this.punkte -= bild.width * bild.height;
  }

  leeren() {
    this.bilder.clear();
    this.familien.clear();
    this.punkte = 0;
  }
}
