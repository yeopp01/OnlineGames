// @ts-check
// Der Technologiebaum (bedienung AC-81 bis AC-86): was es an Gebaeuden,
// Einheiten und Verbesserungen gibt, je Zeitalter und Gebaeude, die Linien
// mit ihren Stufen - und je Haus, was ihm fehlt, was nur es hat und was es
// staerkt.
//
// Gerechnet ist alles auf dem Server (server/spiele/strategie/techbaum.js),
// geholt unter /api/spiele/strategie/nachschlagen. Die Saetze, was eine
// Verbesserung bringt, schreibt er auch (bedienung AC-55); die Tafel an einem
// Eintrag ist dieselbe wie an den Knoepfen der Leiste (`tafelInhalt`).
//
// Eine Ebene ueber der Seite, kein eigener Tab: die Partie laeuft darunter
// weiter wie unter dem Menue, die Tafeln der Bilder sind schon geladen, das
// Vollbild bleibt, und es braucht keine zweite Verbindung.

import { Auswahlleiste, aufstiegBildchen, bildchen, gebaeudeBildchen, warenklasse } from './auswahlleiste.js';
import { bilderWarten } from './bilder.js';
import { FIGUREN } from './figuren.js';
import { GEBAEUDE } from './gebaeude.js';

const ADRESSE = '/api/spiele/strategie/nachschlagen';
const BILD = 34;
const SEITE_VORGABE = 1;

/** @type {Promise<any> | null} */
let geholt = null;

/** Die Daten einmal je Seite - sie aendern sich nur mit dem Server. */
function datenHolen() {
  if (!geholt) {
    geholt = fetch(ADRESSE).then((antwort) => {
      if (!antwort.ok) throw new Error(`Technologiebaum: ${antwort.status}`);
      return antwort.json();
    });
    geholt.catch(() => { geholt = null; });
  }
  return geholt;
}

/**
 * @param {string} name
 * @param {string | null} [klasse]
 * @param {string} [text]
 */
function element(name, klasse, text) {
  const e = document.createElement(name);
  if (klasse) e.className = klasse;
  if (text !== undefined) e.textContent = text;
  return e;
}

/**
 * Wie die Linien eines Gebaeudes in Spalten stehen: jede Linie in einer
 * Spalte, eine Linie mit Stufen belegt ihre Zeilen vom ersten bis zum
 * letzten Zeitalter fuer sich - sonst liefe ein Pfeil durch einen fremden
 * Eintrag. Einzelne teilen sich eine Zelle zu zweit.
 * @param {any[][]} linien
 * @param {number} ab Zeitalter des Gebaeudes - frueher steht nichts
 * @returns {{ spalten: number, plaetze: { knoten: any, spalte: number, zeile: number }[] }}
 */
export function spaltenPacken(linien, ab) {
  const VOLL = 2;
  /** @type {number[][]} */
  const belegt = [];
  const plaetze = [];
  for (const linie of linien) {
    const zeilen = linie.map((k) => Math.max(k.zeitalter, ab));
    const von = Math.min(...zeilen);
    const bis = Math.max(...zeilen);
    const bedarf = [0, 0, 0, 0];
    for (const z of zeilen) bedarf[z] += 1;
    if (linie.length > 1) for (let z = von; z <= bis; z += 1) bedarf[z] = VOLL;
    let spalte = belegt.findIndex((b) => bedarf.every((n, z) => !n || b[z] + n <= VOLL));
    if (spalte < 0) {
      spalte = belegt.length;
      belegt.push([0, 0, 0, 0]);
    }
    bedarf.forEach((n, z) => { belegt[spalte][z] += n; });
    linie.forEach((knoten, i) => plaetze.push({ knoten, spalte, zeile: zeilen[i] }));
  }
  return { spalten: Math.max(1, belegt.length), plaetze };
}

export class Technologiebaum {
  constructor() {
    this.daten = null;
    this.seite = SEITE_VORGABE;
    /** @type {string | null} */
    this.haus = null;
    this.farbe = '#4a90d9';
    /** @type {HTMLElement | null} */
    this.angeheftet = null;
    /** @type {(() => void) | null} */
    this.danach = null;
    this.zurueck = null;

    const wurzel = element('div', 'techbaum');
    wurzel.id = 'techbaum';
    wurzel.setAttribute('role', 'dialog');
    wurzel.setAttribute('aria-modal', 'true');
    wurzel.setAttribute('aria-label', 'Technologiebaum');
    wurzel.hidden = true;
    const tafel = element('div', 'tb-flaeche');
    const kopf = element('div', 'tb-kopf');
    kopf.append(element('h2', null, 'Technologiebaum'));
    this.seiten = element('div', 'tb-seiten');
    this.seiten.setAttribute('role', 'tablist');
    this.haeuser = element('div', 'tb-haeuser');
    this.haeuser.setAttribute('role', 'group');
    this.haeuser.setAttribute('aria-label', 'Haus');
    const zu = /** @type {HTMLButtonElement} */ (element('button', 'tb-zu', 'Schließen (Esc)'));
    zu.type = 'button';
    zu.id = 'techbaumZu';
    zu.addEventListener('click', () => this.schliessen());
    kopf.append(this.seiten, this.haeuser, zu);
    this.hausZeile = element('p', 'tb-hauszeile');
    this.raster = element('div', 'tb-raster');
    this.rahmen = element('div', 'tb-rahmen');
    this.rahmen.append(this.raster);
    tafel.append(kopf, this.hausZeile, this.rahmen);
    wurzel.append(tafel);

    // Die Tafel am Eintrag (bedienung AC-84) - wie an den Knoepfen der Leiste.
    this.tafel = element('div', 'knopftafel tb-tafel');
    this.tafel.id = 'techbaumTafel';
    this.tafel.setAttribute('role', 'tooltip');
    this.tafel.hidden = true;
    wurzel.append(this.tafel);
    document.body.append(wurzel);
    this.wurzel = wurzel;

    const eintragVon = (ziel) => /** @type {HTMLElement | null} */ (ziel?.closest?.('[data-techbaum], [data-tb-aufstieg], [data-tb-haus]') || null);
    wurzel.addEventListener('mouseover', (e) => {
      if (!this.angeheftet) this.tafelZeigen(eintragVon(e.target));
    });
    wurzel.addEventListener('focusin', (e) => {
      if (!this.angeheftet) this.tafelZeigen(eintragVon(e.target));
    });
    wurzel.addEventListener('click', (e) => {
      const eintrag = eintragVon(e.target);
      if (eintrag?.dataset.tbHaus !== undefined) {
        this.hausWaehlen(eintrag.dataset.tbHaus || null);
        return;
      }
      // Ein Klick heftet die Tafel an, ein zweiter oder einer daneben loest sie.
      if (!eintrag || eintrag === this.angeheftet) {
        this.angeheftet = null;
        this.tafelZeigen(eintrag);
        return;
      }
      this.angeheftet = eintrag;
      this.tafelZeigen(eintrag);
    });
    this.rahmen.addEventListener('scroll', () => {
      if (this.tafelFuer) this.tafelZeigen(this.tafelFuer);
    });

    // Solange der Baum offen ist, gehoert ihm die Tastatur: Esc schliesst,
    // keine Taste erreicht das Spiel darunter.
    this.taste = (/** @type {KeyboardEvent} */ e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (this.angeheftet) {
          this.angeheftet = null;
          this.tafelZeigen(null);
        } else this.schliessen();
      }
      e.stopPropagation();
    };
    this.loslassen = (/** @type {KeyboardEvent} */ e) => e.stopPropagation();
    this.groesse = () => this.pfeileZeichnen();
  }

  get offen() {
    return !this.wurzel.hidden;
  }

  /**
   * @param {{ haus?: string | null, farbe?: string, danach?: () => void }} [wie]
   */
  async oeffnen(wie = {}) {
    this.haus = wie.haus || null;
    if (wie.farbe) this.farbe = wie.farbe;
    this.danach = wie.danach || null;
    this.zurueck = document.activeElement;
    this.wurzel.hidden = false;
    window.addEventListener('keydown', this.taste, true);
    window.addEventListener('keyup', this.loslassen, true);
    window.addEventListener('resize', this.groesse);
    this.raster.replaceChildren(element('p', 'tb-laden', 'Technologiebaum wird geladen …'));
    /** @type {HTMLElement} */ (this.wurzel.querySelector('.tb-zu')).focus();
    try {
      const [daten] = await Promise.all([datenHolen(), bilderWarten()]);
      this.daten = daten;
    } catch {
      this.raster.replaceChildren(element('p', 'tb-laden', 'Der Technologiebaum ließ sich nicht laden.'));
      return;
    }
    if (!this.offen) return;
    this.leiste = this.leisteBauen();
    this.kopfBauen();
    this.zeichnen();
  }

  schliessen() {
    if (!this.offen) return;
    this.wurzel.hidden = true;
    this.angeheftet = null;
    this.tafel.hidden = true;
    window.removeEventListener('keydown', this.taste, true);
    window.removeEventListener('keyup', this.loslassen, true);
    window.removeEventListener('resize', this.groesse);
    if (this.zurueck instanceof HTMLElement && this.zurueck.isConnected) this.zurueck.focus();
    this.danach?.();
  }

  /**
   * Eine Leiste ohne Partie, nur fuer ihre Tafeln: die Werte sind die des
   * gewaehlten Hauses, ab dem Zeitalter, in dem es den Eintrag gibt.
   */
  leisteBauen() {
    const d = this.daten;
    const ich = 'techbaum';
    const ansicht = {
      werte: d.werte,
      ich,
      einheitenwerte: new Map(),
      spieler: new Map(),
      vorraete: null,
    };
    const leiste = new Auswahlleiste(document.createElement('div'), ansicht, () => {});
    const eigen = leiste.hausBildetAus.bind(leiste);
    // Ohne gewaehltes Haus bildet jedes Haus aus, was es hat.
    leiste.hausBildetAus = (art) => !this.haus || eigen(art);
    this.ansicht = ansicht;
    return leiste;
  }

  kopfBauen() {
    const d = this.daten;
    this.seiten.replaceChildren(...d.seiten.map((s, i) => {
      const knopf = /** @type {HTMLButtonElement} */ (element('button', 'tb-reiter', s.name));
      knopf.type = 'button';
      knopf.dataset.tbSeite = String(i);
      knopf.setAttribute('role', 'tab');
      knopf.addEventListener('click', () => {
        this.seite = i;
        this.zeichnen();
      });
      return knopf;
    }));
    const alle = /** @type {HTMLButtonElement} */ (element('button', 'tb-haus', 'Alle Häuser'));
    alle.type = 'button';
    alle.dataset.tbHaus = '';
    this.haeuser.replaceChildren(alle, ...d.haeuser.map((h) => {
      const knopf = /** @type {HTMLButtonElement} */ (element('button', 'tb-haus', h.name));
      knopf.type = 'button';
      knopf.dataset.tbHaus = h.art;
      return knopf;
    }));
  }

  /** @param {string | null} haus */
  hausWaehlen(haus) {
    this.haus = haus && this.daten.haeuser.some((h) => h.art === haus) ? haus : null;
    this.angeheftet = null;
    this.tafelZeigen(null);
    this.zeichnen();
  }

  hausDaten() {
    return this.haus ? this.daten.haeuser.find((h) => h.art === this.haus) : null;
  }

  /** Wie ein Eintrag heisst - Namen von Figuren und Gebaeuden wie im Spiel. */
  nameVon(k) {
    const werte = this.daten.werte;
    const tafel = this.daten.jeHaus[this.haus || this.daten.ohne] || {};
    const figur = (art) => tafel[art]?.name || FIGUREN[art]?.name || art;
    if (k.typ === 'verbesserung') return werte.verbesserungen[k.art]?.name || k.art;
    if (k.typ === 'stufe') {
      const v = werte.verbesserungen[k.art];
      return v?.wandelt ? figur(k.einheit) : v?.name || k.art;
    }
    if (k.typ === 'gebaeude') return tafel[k.art]?.name || GEBAEUDE[k.art]?.name || k.art;
    return figur(k.art);
  }

  bildVon(k) {
    const d = this.daten;
    if (k.typ === 'verbesserung') return this.leiste.verbesserungBildchen(k.art, BILD, this.farbe);
    if (k.typ === 'gebaeude') return gebaeudeBildchen(k.art, BILD, this.farbe, d.werte.gebaeude[k.art]?.groesse || 1);
    return bildchen(k.typ === 'stufe' ? k.einheit : k.art, BILD, this.farbe);
  }

  /** Was ein Haus mit einem Eintrag zu tun hat: fehlt, eigen, gestaerkt. */
  hausBezug(k) {
    const haus = this.hausDaten();
    if (!haus) return { fehlt: false, eigen: false, gestaerkt: false };
    const fehlt = Boolean(k.haeuser && !k.haeuser.includes(haus.art));
    return {
      fehlt,
      eigen: Boolean(k.haeuser?.includes(haus.art)),
      gestaerkt: !fehlt && haus.gestaerkt.includes(k.typ === 'stufe' ? k.einheit : k.art),
    };
  }

  knotenBauen(k) {
    const knopf = /** @type {HTMLButtonElement} */ (element('button', `tb-knoten tb-typ-${k.typ}`));
    knopf.type = 'button';
    knopf.dataset.techbaum = k.art;
    knopf.dataset.typ = k.typ;
    // Eine Stufe zeigt die Einheit, zu der sie macht.
    if (k.einheit) knopf.dataset.einheit = k.einheit;
    const bild = element('span', 'tb-bild');
    bild.append(this.bildVon(k));
    const v = this.daten.werte.verbesserungen[k.art];
    if (k.typ === 'stufe' && !v?.wandelt) bild.append(element('span', 'tb-elite', 'Elite'));
    const bezug = this.hausBezug(k);
    if (bezug.fehlt) knopf.classList.add('fehlt');
    if (bezug.eigen) knopf.classList.add('eigen');
    if (bezug.gestaerkt) {
      knopf.classList.add('gestaerkt');
      bild.append(element('span', 'tb-staerker', '▲'));
    }
    knopf.append(bild, element('span', 'tb-name', this.nameVon(k)));
    // Ohne gewaehltes Haus steht an allem, was nur ein Haus hat, sein Name.
    if (!this.haus && k.haeuser) {
      const namen = k.haeuser.map((h) => this.daten.werte.haeuser[h]?.name || h).join(', ');
      knopf.append(element('span', 'tb-nurhaus', namen));
    }
    return knopf;
  }

  zeichnen() {
    const d = this.daten;
    if (!d) return;
    const haus = this.hausDaten();
    // Die Werte des gewaehlten Hauses in die Tafeln (spielziel AC-17).
    this.ansicht.einheitenwerte = new Map([[this.ansicht.ich, d.jeHaus[this.haus || d.ohne]]]);
    this.ansicht.spieler = new Map([[this.ansicht.ich, { haus: this.haus }]]);
    for (const knopf of /** @type {NodeListOf<HTMLElement>} */ (this.seiten.querySelectorAll('[data-tb-seite]'))) {
      const an = Number(knopf.dataset.tbSeite) === this.seite;
      knopf.classList.toggle('an', an);
      knopf.setAttribute('aria-selected', String(an));
    }
    for (const knopf of /** @type {NodeListOf<HTMLElement>} */ (this.haeuser.querySelectorAll('[data-tb-haus]'))) {
      const an = (knopf.dataset.tbHaus || null) === this.haus;
      knopf.classList.toggle('an', an);
      knopf.setAttribute('aria-pressed', String(an));
    }
    this.hausZeileBauen(haus);

    const seite = d.seiten[this.seite];
    const zeitalter = d.zeitalter;
    const teile = [];
    const spalten = ['var(--tb-alter)'];
    let spalte = 2;
    /** @type {{ gruppe: any, von: number, bis: number, plaetze: any[] }[]} */
    const gruppen = [];
    for (const gruppe of seite.gruppen) {
      const { spalten: n, plaetze } = spaltenPacken(gruppe.linien, gruppe.zeitalter);
      gruppen.push({ gruppe, von: spalte, bis: spalte + n, plaetze });
      spalten.push(`repeat(${n}, minmax(var(--tb-spalte), 1fr))`, 'var(--tb-luecke)');
      spalte += n + 1;
    }
    spalten.pop();

    // Je Zeitalter eine Zeile: der Name und der Aufstieg dorthin.
    for (const z of zeitalter) {
      const zelle = element('div', 'tb-alter');
      zelle.style.gridRow = String(z.stufe + 2);
      zelle.append(element('strong', null, z.name));
      if (z.aufstieg) {
        const knopf = /** @type {HTMLButtonElement} */ (element('button', 'tb-aufstieg'));
        knopf.type = 'button';
        knopf.dataset.tbAufstieg = z.aufstieg;
        knopf.setAttribute('aria-label', `Aufstieg ${z.ab.replace(/^ab /, 'in ')}`);
        knopf.append(aufstiegBildchen(26, this.farbe));
        zelle.append(knopf);
      }
      const linie = element('div', 'tb-zeile');
      linie.style.gridRow = String(z.stufe + 2);
      teile.push(linie, zelle);
    }

    for (const { gruppe, von, bis, plaetze } of gruppen) {
      const art = gruppe.gebaeude;
      const kopf = element('div', 'tb-gebaeude');
      kopf.style.gridColumn = `${von} / ${bis}`;
      kopf.style.gridRow = '1';
      if (art) {
        kopf.dataset.techbaum = art;
        kopf.dataset.typ = 'gebaeude';
        kopf.tabIndex = 0;
        kopf.append(gebaeudeBildchen(art, 30, this.farbe, d.werte.gebaeude[art]?.groesse || 1));
      }
      const name = element('span', 'tb-gname', art ? this.nameVon({ typ: 'gebaeude', art }) : 'Weitere Gebäude');
      kopf.append(name);
      // Was das Haus am Gebaeude selbst staerkt (Wehrsteins Mauerwerk), wie an den Eintraegen.
      if (art && haus?.gestaerkt.includes(art)) {
        kopf.classList.add('gestaerkt');
        kopf.append(element('span', 'tb-staerker-kopf', '▲'));
      }
      if (art) kopf.append(element('span', 'tb-ab', zeitalter[gruppe.zeitalter].ab));
      const band = element('div', 'tb-band');
      band.style.gridColumn = `${von} / ${bis}`;
      band.style.gridRow = '2 / 6';
      teile.push(band, kopf);
      // Vor dem Zeitalter des Gebaeudes gibt es nichts davon.
      if (gruppe.zeitalter > 0) {
        const vorher = element('div', 'tb-vorher');
        vorher.style.gridColumn = `${von} / ${bis}`;
        vorher.style.gridRow = `2 / ${gruppe.zeitalter + 2}`;
        teile.push(vorher);
      }
      /** @type {Map<string, HTMLElement>} */
      const zellen = new Map();
      for (const platz of plaetze) {
        const schluessel = `${platz.spalte}:${platz.zeile}`;
        let zelle = zellen.get(schluessel);
        if (!zelle) {
          zelle = element('div', 'tb-zelle');
          zelle.style.gridColumn = String(von + platz.spalte);
          zelle.style.gridRow = String(platz.zeile + 2);
          zelle.dataset.gruppe = art || '';
          zellen.set(schluessel, zelle);
          teile.push(zelle);
        }
        const knopf = this.knotenBauen(platz.knoten);
        knopf.dataset.gruppe = art || '';
        if (platz.knoten.vor) knopf.dataset.vor = platz.knoten.vor;
        zelle.append(knopf);
      }
    }

    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.classList.add('tb-pfeile');
    this.svg.setAttribute('aria-hidden', 'true');
    this.raster.style.gridTemplateColumns = spalten.join(' ');
    this.raster.replaceChildren(...teile, this.svg);
    this.raster.dataset.seite = String(this.seite);
    this.raster.dataset.haus = this.haus || '';
    this.pfeileZeichnen();
  }

  /** @param {any} haus */
  hausZeileBauen(haus) {
    if (!haus) {
      this.hausZeile.replaceChildren(
        element('span', 'tb-legende', 'Goldener Pfeil: Weiterentwicklung, sie tauscht die Einheit aus · grauer Pfeil: verlangt die Verbesserung davor · ein Haus wählen: was ihm fehlt, ist blass, was nur es hat, golden umrandet, was es stärkt, trägt ▲ · Zeigen oder Klicken: Preis, Zeit und Werte'),
      );
      return;
    }
    const d = this.daten;
    const teile = [element('strong', null, `Haus ${haus.name}`), element('span', 'tb-wahlspruch', `„${haus.wahlspruch}“`)];
    if (haus.bringt?.length) teile.push(element('span', null, haus.bringt.join(' · ')));
    if (haus.mannschaft?.length) teile.push(element('span', null, `Im Bündnis, auch für Verbündete: ${haus.mannschaft.join(' · ')}`));
    const eigene = haus.eigene.filter((art) => {
      const v = d.werte.verbesserungen[art];
      return !v || v.wandelt;
    }).map((art) => FIGUREN[art]?.name || d.werte.verbesserungen[art]?.name || art);
    if (eigene.length) teile.push(element('span', null, `Nur hier: ${eigene.join(', ')}`));
    this.hausZeile.replaceChildren(...teile);
  }

  /**
   * Die Pfeile von der Vorstufe zum Eintrag (bedienung AC-82): golden, wo
   * eine Stufe die Einheit austauscht, grau, wo eine Verbesserung die davor
   * verlangt. Gezeichnet nach dem Setzen, aus den Lagen im Raster.
   */
  pfeileZeichnen() {
    const svg = this.svg;
    if (!svg || !this.offen || !this.raster.isConnected) return;
    const raster = this.raster.getBoundingClientRect();
    svg.setAttribute('width', String(this.raster.scrollWidth));
    svg.setAttribute('height', String(this.raster.scrollHeight));
    const ns = 'http://www.w3.org/2000/svg';
    const teile = [];
    const spitze = (id, farbe) => {
      const marker = document.createElementNS(ns, 'marker');
      marker.id = id;
      for (const [k, w] of Object.entries({ viewBox: '0 0 8 8', refX: '7', refY: '4', markerWidth: '7', markerHeight: '7', orient: 'auto' })) marker.setAttribute(k, w);
      const pfad = document.createElementNS(ns, 'path');
      pfad.setAttribute('d', 'M0,0 L8,4 L0,8 z');
      pfad.setAttribute('fill', farbe);
      marker.append(pfad);
      return marker;
    };
    const defs = document.createElementNS(ns, 'defs');
    defs.append(spitze('tbSpitzeGold', '#e0b43a'), spitze('tbSpitzeGrau', '#9aa3ae'));
    teile.push(defs);
    const lage = (/** @type {Element} */ e) => {
      const r = e.getBoundingClientRect();
      return { x: r.left - raster.left + r.width / 2, oben: r.top - raster.top, unten: r.bottom - raster.top };
    };
    for (const knopf of /** @type {NodeListOf<HTMLElement>} */ (this.raster.querySelectorAll('.tb-knoten[data-vor]'))) {
      const gruppe = knopf.dataset.gruppe;
      const vor = this.raster.querySelector(`.tb-knoten[data-gruppe="${gruppe}"][data-techbaum="${knopf.dataset.vor}"]`);
      if (!vor) continue;
      const a = lage(vor);
      const b = lage(knopf);
      const gold = knopf.dataset.typ === 'stufe';
      const y1 = a.unten + 1;
      const y2 = b.oben - 2;
      const mitte = (y1 + y2) / 2;
      const d = Math.abs(a.x - b.x) < 1 ? `M${a.x},${y1} V${y2}` : `M${a.x},${y1} V${mitte} H${b.x} V${y2}`;
      const pfad = document.createElementNS(ns, 'path');
      pfad.setAttribute('d', d);
      pfad.setAttribute('class', gold ? 'tb-pfeil gold' : 'tb-pfeil');
      pfad.setAttribute('marker-end', `url(#${gold ? 'tbSpitzeGold' : 'tbSpitzeGrau'})`);
      pfad.dataset.von = knopf.dataset.vor;
      pfad.dataset.nach = knopf.dataset.techbaum;
      teile.push(pfad);
    }
    svg.replaceChildren(...teile);
  }

  /**
   * Die Tafel zu einem Eintrag: Name, Preis, Zeit und Werte, die Saetze vom
   * Server - dieselbe Tafel wie an der Leiste, mit den Werten des Hauses.
   * @param {HTMLElement | null} eintrag
   */
  tafelZeigen(eintrag) {
    this.tafelFuer = eintrag;
    if (!eintrag || !this.daten) {
      this.tafel.hidden = true;
      this.tafel.classList.remove('angeheftet');
      return;
    }
    const d = this.daten;
    let inhalt;
    /** @type {string[]} */
    const dazu = [];
    if (eintrag.dataset.tbHaus !== undefined) {
      if (!eintrag.dataset.tbHaus) {
        inhalt = { name: 'Alle Häuser', kosten: {}, dauer: null, zeilen: ['Zeigt alles, was es gibt – an Einheiten, die nur ein Haus hat, steht sein Name'] };
      } else inhalt = this.leiste.tafelInhalt('haus', eintrag.dataset.tbHaus);
    } else if (eintrag.dataset.tbAufstieg) {
      inhalt = this.leiste.tafelInhalt('ausbilden', eintrag.dataset.tbAufstieg);
    } else {
      const art = eintrag.dataset.techbaum;
      const typ = eintrag.dataset.typ;
      inhalt = this.leiste.tafelInhalt(typ === 'gebaeude' ? 'bauen' : 'ausbilden', art);
      const knoten = this.knotenSuchen(art, eintrag.dataset.gruppe);
      dazu.push(...(knoten?.hinweis || []));
      const haus = this.hausDaten();
      if (knoten && haus) {
        const bezug = this.hausBezug(knoten);
        if (bezug.fehlt) dazu.push(`Haus ${haus.name} hat das nicht`);
        if (bezug.gestaerkt) dazu.push(`▲ Von Haus ${haus.name} gestärkt – die Werte oben gelten mit dem Haus`);
      }
      // Ab wann: das Zeitalter des Eintrags, nie frueher als sein Gebaeude.
      if (knoten) dazu.push(`Gibt es ${d.zeitalter[Math.max(knoten.zeitalter, this.gruppenAlter(eintrag.dataset.gruppe))].ab}`);
    }
    const kopf = element('div', 'kt-kopf');
    const preis = element('span', 'preis');
    for (const [r, m] of Object.entries(inhalt.kosten || {})) preis.append(element('span', warenklasse(r)), element('span', null, String(m)));
    kopf.append(element('strong', null, inhalt.name), preis);
    this.tafel.replaceChildren(kopf, ...inhalt.zeilen.map((zeile) => element('div', 'kt-zeile', zeile)));
    for (const zeile of dazu.filter(Boolean)) this.tafel.append(element('div', 'kt-hinweis', zeile));
    if (inhalt.dauer) this.tafel.append(element('div', 'kt-fuss', inhalt.dauer));
    this.tafel.dataset.fuer = eintrag.dataset.techbaum || eintrag.dataset.tbAufstieg || eintrag.dataset.tbHaus || '';
    this.tafel.classList.toggle('angeheftet', this.angeheftet === eintrag);
    this.tafel.hidden = false;
    // Neben dem Eintrag, nie aus dem Fenster: rechts davon, sonst links.
    const r = eintrag.getBoundingClientRect();
    const breite = this.tafel.offsetWidth;
    const hoehe = this.tafel.offsetHeight;
    let links = r.right + 8;
    if (links + breite > window.innerWidth - 8) links = r.left - breite - 8;
    links = Math.max(8, Math.min(window.innerWidth - breite - 8, links));
    const oben = Math.max(8, Math.min(window.innerHeight - hoehe - 8, r.top));
    this.tafel.style.left = `${Math.round(links)}px`;
    this.tafel.style.top = `${Math.round(oben)}px`;
  }

  /** @param {string | undefined} art @param {string | undefined} gruppe */
  knotenSuchen(art, gruppe) {
    for (const seite of this.daten.seiten) {
      for (const g of seite.gruppen) {
        if ((g.gebaeude || '') !== (gruppe ?? '')) continue;
        for (const linie of g.linien) for (const k of linie) if (k.art === art) return k;
      }
    }
    // Der Kopf einer Gruppe ist das Gebaeude selbst.
    if (art && this.daten.werte.gebaeude[art]) return { art, typ: 'gebaeude', zeitalter: this.daten.werte.gebaeude[art].zeitalter || 0, haeuser: null };
    return null;
  }

  /** @param {string | undefined} gruppe */
  gruppenAlter(gruppe) {
    return gruppe ? this.daten.werte.gebaeude[gruppe]?.zeitalter || 0 : 0;
  }
}
