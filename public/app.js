import { Ansicht } from './ansicht.js';
import { Auswahlleiste } from './auswahlleiste.js';
import { Uebersicht } from './uebersicht.js';
import { Tasten } from './tasten.js';

const teile = {
  vorraum: document.getElementById('vorraum'),
  warteraum: document.getElementById('warteraum'),
  spiel: document.getElementById('spiel'),
  name: document.getElementById('name'),
  code: document.getElementById('code'),
  raumcode: document.getElementById('raumcode'),
  spielerliste: document.getElementById('spielerliste'),
  meldung: document.getElementById('meldung'),
  wartemeldung: document.getElementById('wartemeldung'),
  verbindungweg: document.getElementById('verbindungweg'),
  vorraete: document.getElementById('vorraete'),
  kartenwert: document.getElementById('kartenwert'),
  brett: document.getElementById('brett'),
  angemeldet: document.getElementById('angemeldet'),
  abgemeldet: document.getElementById('abgemeldet'),
  werName: document.getElementById('werName'),
  formAnmelden: document.getElementById('formAnmelden'),
  formRegistrieren: document.getElementById('formRegistrieren'),
  spiele: document.getElementById('spiele'),
  raumEinstellungen: document.getElementById('raumEinstellungen'),
  einstellungsliste: document.getElementById('einstellungsliste'),
  einstellungsHinweis: document.getElementById('einstellungsHinweis'),
  codeKopieren: document.getElementById('codeKopieren'),
  auswahlleiste: document.getElementById('auswahlleiste'),
};

let draht = null;
let ich = null;
let ansicht = null;
let auswahlleiste = null;
// Wo eine Absage beim Eroeffnen hingehoert: an das Formular, aus dem es kam.
let meldeort = null;
// Bin ich der Gastgeber dieses Raums? Nur er startet - und nur er die
// Revanche (spielziel AC-9).
let binGastgeber = false;

teile.name.value = localStorage.getItem('name') || '';

function zeigen(welcher) {
  teile.vorraum.hidden = welcher !== 'vorraum';
  teile.warteraum.hidden = welcher !== 'warteraum';
  teile.spiel.hidden = welcher !== 'spiel';
  document.body.style.display = welcher === 'spiel' ? 'block' : 'grid';
  // Im Spiel gehoert jede Bewegung der Karte, nicht der Seite.
  document.body.style.overflow = welcher === 'spiel' ? 'hidden' : '';
}

function melden(text, wo = teile.meldung) {
  wo.textContent = text;
  wo.hidden = !text;
}

function senden(nachricht) {
  if (draht && draht.readyState === WebSocket.OPEN) draht.send(JSON.stringify(nachricht));
}

function verbinden(dann) {
  // Ein abgewiesener Versuch laesst eine offene Verbindung ohne Raum zurueck.
  if (draht && !ansicht) draht.close();
  const schema = location.protocol === 'https:' ? 'wss' : 'ws';
  draht = new WebSocket(`${schema}://${location.host}`);
  draht.addEventListener('open', dann);
  draht.addEventListener('message', (e) => empfangen(JSON.parse(e.data)));
  draht.addEventListener('close', (e) => {
    // Nur wenn es die Verbindung von gerade ist: ein neuer Versuch schliesst
    // die alte selbst (oben), das ist kein Abbruch.
    if (e.target !== draht) return;
    // Im Spiel ein Hinweis mitten im Bild, nicht erst stehende Einheiten
    // (bedienung AC-19); im Warteraum unter der Spielerliste.
    if (!teile.spiel.hidden) teile.verbindungweg.hidden = false;
    else if (!teile.warteraum.hidden) melden('Verbindung weg. Seite neu laden, um zurückzukehren.', teile.wartemeldung);
  });
}

function empfangen(nachricht) {
  switch (nachricht.typ) {
    case 'du':
      ich = nachricht.id;
      gastgeberFelder = null;
      // Fuer die Rueckkehr nach einem Absturz - lebt nur solange die Partie laeuft.
      sessionStorage.setItem('platz', JSON.stringify({ code: nachricht.code, token: nachricht.token }));
      teile.raumcode.textContent = nachricht.anzeige || nachricht.code;
      zeigen('warteraum');
      break;

    case 'raum':
      // Wer Gastgeber ist, steht nur hier - und nur er startet (die Revanche
      // auch, spielziel AC-9). Die Nachricht kommt vor dem Start und noch
      // einmal, wenn jemand geht; im Spiel selbst kommt keine mehr, deshalb
      // wird es gemerkt und nicht im Augenblick des Endes erfragt.
      binGastgeber = nachricht.gastgeber === ich;
      spielerlisteZeichnen(nachricht);
      raumEinstellungenZeichnen(nachricht);
      break;

    case 'aufbau':
      if (!ansicht) {
        ansicht = new Ansicht(teile.brett, (einheiten, ziel, angriffslauf) =>
          senden({ typ: 'befehl', einheiten, ziel, ...(angriffslauf ? { angriffslauf: true } : {}) }));
        // Fuer den Browserlauf: die Leinwand laesst sich nicht befragen, die
        // Ansicht schon (e2e/tests/strategie-spielbild.spec.mjs). Lesen, nicht
        // schreiben - befohlen wird dort ueber Maus und Tastatur.
        window.ansicht = ansicht;
        auswahlleiste = new Auswahlleiste(teile.auswahlleiste, ansicht, (auftrag) =>
          senden({ typ: 'befehl', ...auftrag }));
        ansicht.beiAuswahl = () => auswahlleiste.aktualisieren();
        const uebersicht = new Uebersicht(document.getElementById('uebersicht'), ansicht);
        ansicht.nachBild = (jetzt) => uebersicht.zeichnen(jetzt);
        ansicht.beiFeldern = () => uebersicht.feldGeaendert();
        // Fuer den Browserlauf, wie window.ansicht: lesen, nicht schreiben.
        window.uebersicht = uebersicht;
        const tasten = new Tasten(ansicht, teile.auswahlleiste, document.getElementById('tastenuebersicht'));
        ansicht.beiTaste = (e) => tasten.taste(e);
        ansicht.melden = spielMelden;
        ansicht.beiZeitalter = (stufe, name) => zeitalterwechselMelden(name);
        ansicht.beiAngriff = (ort) => angriffZeigen(ort);
        ansicht.beiEnde = (ende, text) => partieendeZeigen(text);
        ansicht.beiSpielstand = () => spielstandZeigen();
        ansicht.sammelpunktSenden = (gebaeude, ziel) =>
          senden({ typ: 'befehl', auftrag: 'sammelpunkt', gebaeude, ziel });
        ansicht.bauenSenden = (einheiten, art, ziel) =>
          senden({ typ: 'befehl', auftrag: 'bauen', einheiten, art, ziel });
        ansicht.mauerSenden = (einheiten, art, von, bis) =>
          senden({ typ: 'befehl', auftrag: 'mauer', einheiten, art, von, bis });
      }
      zeigen('spiel');
      teile.kartenwert.textContent = `· Karte ${nachricht.startwert}`;
      ansicht.aufbau(nachricht, ich);
      zeitgrenzeZeigen(ansicht.zeitgrenze);
      // Ein Aufbau kann der zweite sein: die Revanche (spielziel AC-9). Dann
      // muss weg, was von der alten Partie noch im Bild steht.
      partieraumAufraeumen();
      aufgebenZeigen();
      buendnisZeigen();
      zuschauerZeigen();
      break;

    case 'zustand':
      if (!ansicht) return;
      ansicht.zustand(nachricht);
      leisteZiel(ansicht.vorraete);
      auswahlleiste.aktualisieren();
      untaetigZeigen(ansicht.untaetige.length);
      wohnraumZeigen(ansicht.wartetEtwas());
      arbeiterZeigen(ansicht.arbeiter);
      zeitalterZeigen(ansicht.zeitalterName());
      spielzeitZeigen(ansicht.spielzeit());
      aufgebenZeigen();
      buendnisZeigen();
      zuschauerZeigen();
      // Offen gehalten, zieht die Tafel mit (bedienung AC-20).
      if (ansicht.spielstandOffen) spielstandZeigen();
      break;

    case 'fehler':
      // Im Spiel als kurze Einblendung, nicht in einem verdeckten Formular.
      if (!teile.spiel.hidden) spielMelden(nachricht.text);
      else melden(nachricht.text, teile.warteraum.hidden ? meldeort || teile.meldung : teile.wartemeldung);
      break;
  }
}

// ---- Absagen im Spielbild (bedienung AC-18) -------------------------------
// Kurz eingeblendet und von selbst wieder weg - kein Fenster mit Knopf.
let spielMeldungUhr = null;

function spielMelden(text) {
  const ort = document.getElementById('spielmeldung');
  ort.textContent = text;
  ort.hidden = false;
  ort.classList.remove('neu');
  void ort.offsetWidth; // die Einblendung von vorn beginnen
  ort.classList.add('neu');
  clearTimeout(spielMeldungUhr);
  spielMeldungUhr = setTimeout(() => { ort.hidden = true; }, 3000);
}

// ---- Angriff wird gemeldet (kampf AC-14) ---------------------------------
// Ein Knopf oben in der Mitte: wer angegriffen wird, sieht es, auch wenn die
// Kamera woanders steht, und ein Klick setzt sie dorthin. Er geht nach zehn
// Sekunden von selbst - ein neuer Angriff anderswo bringt ihn wieder.
let angriffUhr = null;

function angriffZeigen(ort) {
  const knopf = document.getElementById('angriffsmeldung');
  knopf.dataset.x = String(ort.x);
  knopf.dataset.y = String(ort.y);
  knopf.hidden = false;
  knopf.classList.remove('neu');
  void knopf.offsetWidth; // die Einblendung von vorn beginnen
  knopf.classList.add('neu');
  clearTimeout(angriffUhr);
  angriffUhr = setTimeout(() => { knopf.hidden = true; }, 10_000);
}

// Am Ende der Partie und bei der Revanche: was zur alten Partie gehoerte, geht.
function angriffVerbergen() {
  document.getElementById('angriffsmeldung').hidden = true;
  clearTimeout(angriffUhr);
}

document.getElementById('angriffsmeldung').addEventListener('click', (ereignis) => {
  const knopf = ereignis.currentTarget;
  if (ansicht) ansicht.blickAuf(Number(knopf.dataset.x), Number(knopf.dataset.y));
  knopf.hidden = true;
  clearTimeout(angriffUhr);
});

// ---- Zeitalter (bedienung AC-33) -----------------------------------------
// Oben in der Leiste steht, in welchem Zeitalter man ist; der Wechsel wird
// einmal gross in der Mitte angekuendigt und verschwindet von selbst.
let zeitalterUhr = null;

function zeitalterZeigen(name) {
  const feld = document.querySelector('#zeitalter b');
  if (feld && feld.textContent !== name) feld.textContent = name;
}

// Die Spielzeit oben neben dem Zeitalter (bedienung AC-37). Sie kommt aus
// den Takten des Servers, nicht aus einer Uhr im Browser - deshalb steht hier
// kein Intervall, sondern nur das Schreiben bei jedem Zustand.
function spielzeitZeigen(text) {
  const feld = document.querySelector('#spielzeit b');
  if (feld && feld.textContent !== text) feld.textContent = text;
}

// Hat die Partie eine Zeitgrenze (spielziel AC-22), steht sie hinter der
// Uhr: "12:34 / 90:00" beantwortet "wie lange noch" ohne Rechnen. Ohne
// Grenze steht nichts dahinter.
function zeitgrenzeZeigen(minuten) {
  const feld = document.querySelector('#spielzeit .zeitgrenze');
  if (!feld) return;
  feld.hidden = !minuten;
  feld.textContent = minuten ? ` / ${minuten}:00` : '';
  document.getElementById('spielzeit').title = minuten
    ? `Spielzeit - nach ${minuten} Minuten endet die Partie unentschieden`
    : 'Spielzeit';
}

// ---- Das Ende der Partie (spielziel AC-5) --------------------------------
// Die Meldung bleibt stehen, anders als Absage und Zeitalterwechsel: die
// Partie ist zu Ende, es kommt nichts mehr nach. Die Tafel mit den Zahlen
// (spielziel AC-8) nimmt spaeter diesen Platz ein.
function partieendeZeigen(text) {
  document.getElementById('partieende').textContent = text;
  abschlusstafelFuellen();
  angriffVerbergen();
  document.getElementById('abschluss').hidden = false;
  revancheZeigen();
  aufgebenFrageSchliessen();
  aufgebenZeigen();
  buendnisFrageSchliessen();
  buendnisZeigen();
  zuschauerZeigen();
}

// ---- Revanche (spielziel AC-9) -------------------------------------------
// Unter der Tafel steht der Knopf, der dieselbe Runde neu startet: dieselben
// Leute, dieselben Einstellungen, niemand tippt einen Code. Geschickt wird
// **dieselbe** Nachricht wie beim ersten Start - die Revanche ist fuer den
// Server ein zweiter Start desselben Raums, und nur der Gastgeber darf ihn.
// Wer nicht Gastgeber ist, bekommt deshalb keinen Knopf, sondern einen Satz:
// ein Knopf, der mit einer Absage antwortet, waere schlimmer als keiner.
function revancheZeigen() {
  document.getElementById('revanche').hidden = !binGastgeber;
  document.getElementById('revanchehinweis').hidden = binGastgeber;
}

document.getElementById('revanche').addEventListener('click', () => {
  senden({ typ: 'start' });
});

// Was vom Abschlussbild der vorigen Partie noch steht, wenn die naechste
// beginnt. Die Rohstoffleiste wird dabei zurueckgesetzt, nicht nur neu
// beschriftet: sie zaehlt in einer halben Sekunde auf den neuen Wert, und
// vom Stand der alten Partie herunterzuzaehlen waere eine Wirtschaft, die es
// nie gab.
function partieraumAufraeumen() {
  document.getElementById('abschluss').hidden = true;
  document.getElementById('partieende').textContent = '';
  aufgebenFrageSchliessen();
  buendnisFrageSchliessen();
  angriffVerbergen();
  leiste.ziel = {};
  leiste.gezeigt = {};
  leiste.von = {};
}

// Die Tafel darunter (spielziel AC-8): je Spieler eine Zeile mit dem, was er
// in dieser Partie zusammengebracht hat. Gezaehlt hat der Server ueber die
// ganze Partie - deshalb stehen hier auch die Zahlen eines Spielers, von dem
// am Ende nichts mehr auf der Karte ist.
const TAFELKOPF = ['Spieler', 'Zeitalter', 'Holz', 'Nahrung', 'Gold', 'Stein', 'Ausgebildet', 'Verloren'];

// Der Spielstand auf `Tab` (bedienung AC-20): dieselbe Form wie die Tafel am
// Ende, aber mit dem, was jetzt ist. Wo der Server nichts schickt (Gegner im
// Nebel, kampf AC-13), steht ein Strich - kein geschaetzter Wert.
const STANDKOPF = ['Spieler', 'Zeitalter', 'Bevölkerung', 'Holz', 'Nahrung', 'Gold', 'Stein'];

function spielstandZeigen() {
  const feld = document.getElementById('spielstand');
  feld.hidden = !ansicht.spielstandOffen;
  if (feld.hidden) return;
  const kopf = document.createElement('tr');
  for (const [i, titel] of STANDKOPF.entries()) {
    const zelle = document.createElement('th');
    zelle.textContent = titel;
    zelle.scope = 'col';
    if (i > 0) zelle.className = 'zahl';
    kopf.append(zelle);
  }
  const koerper = ansicht.spielstandZeilen().map((zeile) => {
    const tr = document.createElement('tr');
    tr.dataset.spieler = zeile.id;
    if (zeile.aus) tr.className = 'draussen';
    else if (zeile.ich) tr.className = 'sieger';
    const name = document.createElement('th');
    name.scope = 'row';
    const punkt = document.createElement('span');
    punkt.className = 'farbpunkt';
    punkt.style.background = zeile.farbe;
    name.append(punkt, document.createTextNode(zeile.aus ? `${zeile.name} (ausgeschieden)` : zeile.name));
    tr.append(name);
    const v = zeile.vorraete;
    const werte = [
      zeile.zeitalter,
      v ? `${v.bev} / ${v.raum}` : '–',
      v ? v.holz : '–',
      v ? v.nahrung : '–',
      v ? v.gold : '–',
      v ? v.stein : '–',
    ];
    for (const [i, wert] of werte.entries()) {
      const td = document.createElement('td');
      td.className = 'zahl';
      if (i > 0) td.dataset.wert = v ? 'ja' : 'nein';
      td.textContent = String(wert);
      tr.append(td);
    }
    return tr;
  });
  document.getElementById('spielstandtafel').replaceChildren(kopf, ...koerper);
}

function abschlusstafelFuellen() {
  const tafel = document.getElementById('abschlusstafel');
  const zeilen = ansicht.abschlusszeilen();
  const kopf = document.createElement('tr');
  for (const [i, titel] of TAFELKOPF.entries()) {
    const zelle = document.createElement('th');
    zelle.textContent = titel;
    zelle.scope = 'col';
    if (i > 0) zelle.className = 'zahl';
    kopf.append(zelle);
  }
  const koerper = zeilen.map((zeile) => {
    const tr = document.createElement('tr');
    if (zeile.sieger) tr.className = 'sieger';
    else if (zeile.aus) tr.className = 'draussen';
    const name = document.createElement('th');
    name.scope = 'row';
    const punkt = document.createElement('span');
    punkt.className = 'farbpunkt';
    punkt.style.background = zeile.farbe;
    name.append(punkt, document.createTextNode(zeile.name));
    tr.append(name);
    const werte = [
      zeile.zeitalter,
      zeile.gesammelt.holz,
      zeile.gesammelt.nahrung,
      zeile.gesammelt.gold,
      zeile.gesammelt.stein,
      zeile.ausgebildet,
      zeile.verloren,
    ];
    for (const wert of werte) {
      const td = document.createElement('td');
      td.className = 'zahl';
      td.textContent = String(wert);
      tr.append(td);
    }
    return tr;
  });
  tafel.replaceChildren(kopf, ...koerper);
  document.getElementById('abschlussdauer').textContent = `Dauer ${ansicht.abschlussdauer()}`;
}

// ---- Zuschauen nach dem Ausscheiden (spielziel AC-7) ---------------------
// Wer nichts mehr hat, sieht die Partie weiterlaufen. Die Meldung sagt ihm,
// warum er nichts mehr befehlen kann; mit dem Ende der Partie weicht sie der
// Meldung darueber, wer gewonnen hat. Gerechnet wird bei jedem Zustand und
// nicht bei einem Ereignis: Ausscheiden und Partieende koennen in denselben
// Takt fallen (wer als Vorletzter aufgibt).
function zuschauerZeigen() {
  const ort = document.getElementById('zuschauer');
  ort.hidden = !ansicht || !ansicht.aus || ansicht.ende !== null;
}

// ---- Aufgeben (bedienung AC-38) ------------------------------------------
// Der Knopf steht oben rechts, weit weg von allem, was im Spiel oft geklickt
// wird. Er fragt **genau einmal** zurueck: erst der zweite Klick, im
// Rueckfragefeld, schickt den Auftrag. Ein Fehlklick auf "Aufgeben" kostet
// nichts. Wer schon ausgeschieden ist oder dessen Partie vorbei ist, sieht
// den Knopf nicht mehr - zweimal aufgeben kann niemand (spielziel AC-6).
const aufgebenKnopf = document.getElementById('aufgeben');
const aufgebenFrage = document.getElementById('aufgebenfrage');

function aufgebenZeigen() {
  aufgebenKnopf.hidden = !ansicht || ansicht.aus || ansicht.ende !== null;
}

function aufgebenFrageTaste(e) {
  if (e.key !== 'Escape') return;
  // Nicht weiter: sonst hebt dieselbe Taste darunter die Auswahl auf.
  e.stopPropagation();
  aufgebenFrageSchliessen();
}

function aufgebenFrageOeffnen() {
  if (!ansicht || ansicht.ende) return;
  aufgebenFrage.hidden = false;
  window.addEventListener('keydown', aufgebenFrageTaste, true);
  document.getElementById('aufgebenNein').focus();
}

function aufgebenFrageSchliessen() {
  if (aufgebenFrage.hidden) return;
  aufgebenFrage.hidden = true;
  window.removeEventListener('keydown', aufgebenFrageTaste, true);
}

aufgebenKnopf.addEventListener('click', aufgebenFrageOeffnen);
document.getElementById('aufgebenNein').addEventListener('click', aufgebenFrageSchliessen);
document.getElementById('aufgebenJa').addEventListener('click', () => {
  aufgebenFrageSchliessen();
  senden({ typ: 'befehl', auftrag: 'aufgeben' });
});

// ---- Buendnis loesen (spielziel AC-24) ------------------------------------
// Ein Knopf neben Aufgeben, der genau einmal zurueckfragt - wie Aufgeben,
// denn auch das laesst sich nicht zuruecknehmen. Er steht nur, wenn der
// Server ja sagen wuerde (`ansicht.kannKuendigen`): bei "fest", ohne
// Verbuendeten und nach der eigenen Kuendigung fehlt er. Die Ansage darunter
// sehen alle, mit der Uhr der Frist und danach kurz "jetzt Gegner".
const buendnisKnopf = document.getElementById('buendnisloesen');
const buendnisFrage = document.getElementById('buendnisfrage');
const buendnisAnsage = document.getElementById('buendnisansage');
let buendnisAnsageText = '';

function buendnisZeigen() {
  buendnisKnopf.hidden = !ansicht || !ansicht.kannKuendigen();
  if (buendnisKnopf.hidden) buendnisFrageSchliessen();
  const ansagen = ansicht && ansicht.ende === null ? ansicht.buendnisAnsagen() : [];
  // Nur neu schreiben, was sich geaendert hat - die Uhr schlaegt je Sekunde,
  // ein Zustand kommt zehnmal so oft.
  const html = ansagen.map(({ name, rest }) => {
    const wer = name === null ? 'Du hast dein Bündnis gelöst' : `${textSicher(name)} hat das Bündnis gelöst`;
    return rest > 0
      ? `<span>${wer} — Gegner in <b>${rest} s</b></span>`
      : `<span class="gegner">${wer} — jetzt Gegner</span>`;
  }).join('');
  if (html !== buendnisAnsageText) {
    buendnisAnsageText = html;
    buendnisAnsage.innerHTML = html;
  }
  buendnisAnsage.hidden = ansagen.length === 0;
}

// Namen kommen von Mitspielern: nie als HTML.
function textSicher(text) {
  const el = document.createElement('i');
  el.textContent = text;
  return el.innerHTML;
}

function buendnisFrageTaste(e) {
  if (e.key !== 'Escape') return;
  e.stopPropagation();
  buendnisFrageSchliessen();
}

function buendnisFrageOeffnen() {
  if (!ansicht || !ansicht.kannKuendigen()) return;
  aufgebenFrageSchliessen();
  buendnisFrage.hidden = false;
  window.addEventListener('keydown', buendnisFrageTaste, true);
  document.getElementById('buendnisNein').focus();
}

function buendnisFrageSchliessen() {
  if (buendnisFrage.hidden) return;
  buendnisFrage.hidden = true;
  window.removeEventListener('keydown', buendnisFrageTaste, true);
}

buendnisKnopf.addEventListener('click', buendnisFrageOeffnen);
document.getElementById('buendnisNein').addEventListener('click', buendnisFrageSchliessen);
document.getElementById('buendnisJa').addEventListener('click', () => {
  buendnisFrageSchliessen();
  senden({ typ: 'befehl', auftrag: 'kuendigen' });
});

function zeitalterwechselMelden(name) {
  const ort = document.getElementById('zeitalterwechsel');
  ort.textContent = `${name} erreicht`;
  ort.hidden = false;
  ort.classList.remove('neu');
  void ort.offsetWidth; // die Einblendung von vorn beginnen
  ort.classList.add('neu');
  clearTimeout(zeitalterUhr);
  zeitalterUhr = setTimeout(() => { ort.hidden = true; }, 4000);
}

// ---- Rohstoffleiste (bedienung AC-24, AC-17) ------------------------------
// Die Zahlen springen nicht: jede Anzeige laeuft in rund einer halben Sekunde
// auf den neuen Wert, damit man sieht, dass die Wirtschaft arbeitet.
const LEISTE_DAUER = 500;
const leiste = { ziel: {}, gezeigt: {}, von: {}, start: 0, laeuft: false };

function leisteFeld(name) {
  if (name === 'raum') return teile.vorraete.querySelector('[data-teil="raum"]');
  return teile.vorraete.querySelector(`[data-rohstoff="${name}"] b`);
}

// Voller Wohnraum (bedienung AC-43): wartet irgendwo ein eigener Auftrag,
// weil die Bevoelkerung voll ist, wird die Anzeige oben rot - auch wenn das
// wartende Gebaeude nicht gewaehlt ist. Der Grund steht im Titel; in der
// Leiste des Gebaeudes steht er ohnehin (bauen AC-15).
function wohnraumZeigen(wartet) {
  const feld = teile.vorraete.querySelector('[data-rohstoff="bev"]');
  if (feld.classList.contains('wartet') === wartet) return;
  feld.classList.toggle('wartet', wartet);
  feld.title = wartet ? 'Bevölkerung voll — ein Auftrag wartet, Haus bauen' : 'Bevölkerung';
}

// Der Knopf fuer untaetige Dorfbewohner (bedienung AC-28): die Zahl, und
// gelb, sobald einer herumsteht.
function untaetigZeigen(zahl) {
  const knopf = document.getElementById('untaetig');
  const text = String(zahl);
  if (knopf.querySelector('b').textContent !== text) knopf.querySelector('b').textContent = text;
  knopf.disabled = zahl === 0;
  knopf.classList.toggle('hat', zahl > 0);
  knopf.setAttribute('aria-label', `Untätige Dorfbewohner: ${zahl}`);
}

document.getElementById('untaetig').addEventListener('click', () => ansicht?.naechsterUntaetiger());

// Arbeiter je Rohstoff in der Leiste (bedienung AC-32): die Zahl steht am
// Vorrat, null bleibt blass - so sieht man auf einen Blick, wo niemand steht.
function arbeiterZeigen(arbeiter) {
  for (const [rohstoff, zahl] of Object.entries(arbeiter)) {
    const feld = document.querySelector(`[data-arbeiter="${rohstoff}"]`);
    if (!feld) continue;
    const text = String(zahl);
    if (feld.textContent !== text) feld.textContent = text;
    feld.classList.toggle('keiner', zahl === 0);
  }
}

function leisteZiel(werte) {
  let geaendert = false;
  for (const [name, wert] of Object.entries(werte)) {
    if (leiste.ziel[name] === wert) continue;
    // Der erste Wert erscheint sofort - hochzaehlen ab null waere falsch.
    if (leiste.ziel[name] === undefined) {
      leiste.gezeigt[name] = wert;
      leisteFeld(name).textContent = wert;
    }
    leiste.ziel[name] = wert;
    geaendert = true;
  }
  if (!geaendert) return;
  leiste.von = { ...leiste.gezeigt };
  leiste.start = performance.now();
  if (!leiste.laeuft) {
    leiste.laeuft = true;
    requestAnimationFrame(leisteZaehlen);
  }
}

function leisteZaehlen(jetzt) {
  // Der Zeitstempel des Bildes kann vor der Lieferung liegen, die mitten im
  // Bild ankam - ohne Untergrenze zaehlte die Leiste kurz rueckwaerts.
  const anteil = Math.max(0, Math.min(1, (jetzt - leiste.start) / LEISTE_DAUER));
  for (const [name, ziel] of Object.entries(leiste.ziel)) {
    const von = leiste.von[name] ?? ziel;
    const wert = Math.round(von + (ziel - von) * anteil);
    if (wert === leiste.gezeigt[name]) continue;
    leiste.gezeigt[name] = wert;
    leisteFeld(name).textContent = wert;
  }
  if (anteil < 1) requestAnimationFrame(leisteZaehlen);
  else leiste.laeuft = false;
}

// ---- Einstellungen im Warteraum (AC-9, AC-10) ----------------------------
// Der Gastgeber bekommt Felder, alle anderen lesen mit. Die Felder entstehen
// einmal je Raum - neu gezeichnet waere bei jeder Nachricht die Eingabe weg.

let gastgeberFelder = null;

function wertText(e) {
  if (e.art === 'startwert') return e.wert === null ? 'zufällig' : String(e.wert);
  if (e.art === 'wahl') return (e.werte.find((w) => w.wert === e.wert) || {}).name || String(e.wert);
  return String(e.wert);
}

function raumEinstellungenZeichnen(nachricht) {
  const liste = nachricht.einstellungen || [];
  teile.raumEinstellungen.hidden = liste.length === 0 || nachricht.gestartet;
  if (liste.length === 0) return;

  if (nachricht.gastgeber !== ich) {
    gastgeberFelder = null;
    teile.einstellungsHinweis.textContent = 'Der Gastgeber kann sie bis zum Start ändern.';
    const tafel = document.createElement('dl');
    tafel.className = 'werte';
    for (const e of liste) {
      const name = document.createElement('dt');
      name.textContent = e.name;
      const wert = document.createElement('dd');
      wert.dataset.wert = e.schluessel;
      wert.textContent = wertText(e);
      tafel.append(name, wert);
    }
    teile.einstellungsliste.replaceChildren(tafel);
    return;
  }

  teile.einstellungsHinweis.textContent = 'Änderungen sehen alle sofort - bis zum Start.';
  if (!gastgeberFelder) {
    gastgeberFelder = document.createElement('form');
    gastgeberFelder.className = 'einstellungen im-raum';
    gastgeberFelder.append(...liste.map(einstellungsfeld));
    gastgeberFelder.addEventListener('submit', (ereignis) => ereignis.preventDefault());
    gastgeberFelder.addEventListener('change', () => {
      melden('', teile.wartemeldung);
      senden({ typ: 'einstellen', einstellungen: einstellungenLesen(gastgeberFelder) });
    });
    teile.einstellungsliste.replaceChildren(gastgeberFelder);
  }
  // Was der Server sagt, gilt - ausser im Feld, in dem gerade getippt wird.
  for (const e of liste) {
    const feld = gastgeberFelder.querySelector(`[data-einstellung="${e.schluessel}"]`);
    if (!feld || feld === document.activeElement) continue;
    if (e.art === 'wahl') feld.value = JSON.stringify(e.wert);
    else feld.value = e.wert === null ? '' : String(e.wert);
  }
}

teile.codeKopieren.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(teile.raumcode.textContent);
    teile.codeKopieren.textContent = 'kopiert';
    setTimeout(() => { teile.codeKopieren.textContent = 'Code kopieren'; }, 2000);
  } catch {
    melden('Kopieren ging nicht - bitte den Code abschreiben.', teile.wartemeldung);
  }
});

// Jeder Platz eine Zeile, die des Spiels (KIs) eingeschlossen - und daneben,
// was je Platz gewaehlt wird (spielauswahl AC-22: das Team). Den eigenen
// Platz waehlt jeder selbst, der Gastgeber jeden; die anderen lesen mit.
// Was die Wahl bedeutet, steht im Steckbrief, nicht hier.
function spielerlisteZeichnen(nachricht) {
  const verbunden = new Map((nachricht.spieler || []).map((s) => [s.id, s.verbunden]));
  const plaetze = nachricht.plaetze
    || (nachricht.spieler || []).map((s) => ({ platz: s.id, name: s.name, mensch: true, wahl: {} }));
  const jePlatz = nachricht.gestartet ? [] : nachricht.jePlatz || [];
  teile.spielerliste.innerHTML = '';
  for (const eintrag of plaetze) {
    const zeile = document.createElement('li');
    zeile.dataset.platz = eintrag.platz;
    if (!eintrag.mensch) zeile.classList.add('vom-spiel');
    else if (verbunden.get(eintrag.platz) === false) zeile.classList.add('weg');
    const punkt = document.createElement('span');
    punkt.className = 'punkt';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = `${eintrag.name}${eintrag.platz === ich ? ' (du)' : ''}`;
    zeile.append(punkt, name);
    const darf = eintrag.platz === ich || nachricht.gastgeber === ich;
    for (const e of jePlatz) zeile.append(platzwahlFeld(e, eintrag, darf));
    teile.spielerliste.append(zeile);
  }
}

function platzwahlFeld(e, eintrag, darf) {
  const wert = eintrag.wahl ? eintrag.wahl[e.schluessel] : e.vorgabe;
  if (!darf) {
    const marke = document.createElement('span');
    marke.className = 'platzwahl';
    marke.dataset.wahl = e.schluessel;
    marke.textContent = wertText({ ...e, wert });
    return marke;
  }
  const feld = einstellungsfeld({ ...e, vorgabe: wert });
  feld.classList.add('platzwahl-feld');
  const eingabe = feld.querySelector('[data-einstellung]');
  // Kein Teil der Einstellungen. Der Name steht fuer den Vorleser am Feld,
  // sichtbar ist nur die Wahl - die Zeile sagt schon, wessen Platz es ist.
  delete eingabe.dataset.einstellung;
  eingabe.dataset.wahl = e.schluessel;
  eingabe.setAttribute('aria-label', `${e.name}: ${eintrag.name}`);
  feld.querySelector('span').remove();
  eingabe.addEventListener('change', () => {
    melden('', teile.wartemeldung);
    senden({ typ: 'platz', platz: eintrag.platz, wahl: { [e.schluessel]: JSON.parse(eingabe.value) } });
  });
  return feld;
}

// ---- Spiele ------------------------------------------------------------
// Die Uebersicht zeigt, was der Server als Steckbriefe liefert. Ein neues
// Spiel braucht hier keine Zeile (→ specs/00-plattform/spielauswahl.md AC-2).

const STAND = { 'im-bau': 'im Bau', gesperrt: 'noch nicht spielbar' };

function spielerzahl({ von, bis }) {
  if (von === bis) return von === 1 ? 'allein' : `${von} Spieler`;
  return `${von} bis ${bis} Spieler`;
}

function eroeffnen(art, einstellungen, ort) {
  // Kein Name noetig: der Server nimmt den aus dem Konto.
  melden('');
  meldeort = ort;
  melden('', ort);
  verbinden(() => senden({ typ: 'erstellen', art, einstellungen }));
}

// Ein Feld je Einstellung, so wie das Spiel sie beschreibt (AC-4). Die Seite
// kennt nur die drei Arten, keine einzelne Einstellung.
function einstellungsfeld(e) {
  const feld = document.createElement('label');
  feld.className = 'feld';
  const titel = document.createElement('span');
  titel.textContent = e.name;
  let eingabe;
  if (e.art === 'wahl') {
    eingabe = document.createElement('select');
    for (const w of e.werte) {
      const option = document.createElement('option');
      option.value = JSON.stringify(w.wert);
      option.textContent = w.name;
      option.selected = w.wert === e.vorgabe;
      eingabe.append(option);
    }
  } else {
    eingabe = document.createElement('input');
    eingabe.autocomplete = 'off';
    if (e.art === 'zahl') {
      eingabe.type = 'number';
      eingabe.min = e.von;
      eingabe.max = e.bis;
      eingabe.value = e.vorgabe;
      titel.textContent = `${e.name} (${e.von} bis ${e.bis})`;
    } else {
      eingabe.inputMode = 'numeric';
      eingabe.placeholder = 'zufällig';
    }
  }
  eingabe.dataset.einstellung = e.schluessel;
  eingabe.dataset.art = e.art;
  // Eine Wahl mit langen Namen ("wenig (200 Holz, 200 Nahrung, ...)") nimmt
  // im Raster zwei Spalten, sonst ist die Haelfte abgeschnitten. Gefragt wird
  // die Laenge, nicht der Schluessel - welche Einstellung das ist, weiss
  // nur der Steckbrief.
  if (e.art === 'wahl' && Math.max(...e.werte.map((w) => w.name.length)) > 24) feld.classList.add('breit');
  feld.append(titel, eingabe);
  return feld;
}

// Was im Formular steht, so roh wie noetig: pruefen tut der Server (AC-8).
function einstellungenLesen(form) {
  const werte = {};
  for (const eingabe of form.querySelectorAll('[data-einstellung]')) {
    const roh = eingabe.value.trim();
    const { art, einstellung } = eingabe.dataset;
    if (art === 'wahl') werte[einstellung] = JSON.parse(roh);
    else if (art === 'startwert') werte[einstellung] = roh === '' ? null : /^\d+$/.test(roh) ? Number(roh) : roh;
    else if (roh !== '') werte[einstellung] = /^-?\d+$/.test(roh) ? Number(roh) : roh;
  }
  return werte;
}

function spielkarte(spiel) {
  const karte = document.createElement('li');
  karte.className = `spielkarte stand-${spiel.stand}`;
  karte.dataset.spiel = spiel.art;

  const kopf = document.createElement('div');
  kopf.className = 'spielkopf';
  const name = document.createElement('strong');
  name.textContent = spiel.name;
  kopf.append(name);
  if (STAND[spiel.stand]) {
    const marke = document.createElement('span');
    marke.className = 'marke';
    marke.textContent = STAND[spiel.stand];
    kopf.append(marke);
  }

  const satz = document.createElement('p');
  satz.className = 'spielsatz';
  satz.textContent = spiel.beschreibung;

  const fuss = document.createElement('div');
  fuss.className = 'spielfuss';
  const zahl = document.createElement('span');
  zahl.className = 'spielerzahl';
  zahl.textContent = spielerzahl(spiel.spieler);

  const knopf = document.createElement('button');
  knopf.className = 'haupt';
  knopf.dataset.oeffnen = spiel.art;
  if (spiel.stand === 'gesperrt') {
    knopf.disabled = true;
    knopf.textContent = 'gesperrt';
  } else if (spiel.einstieg.art === 'seite') {
    knopf.textContent = 'Öffnen';
    knopf.addEventListener('click', () => location.assign(spiel.einstieg.adresse));
  } else {
    knopf.textContent = 'Eröffnen';
  }
  fuss.append(zahl, knopf);
  karte.append(kopf, satz, fuss);

  if (spiel.stand !== 'gesperrt' && spiel.einstieg.art === 'raum') {
    // Erst die Einstellungen zeigen; wer nichts aendert, eroeffnet mit den
    // Vorgaben (AC-5).
    const form = document.createElement('form');
    form.className = 'einstellungen';
    form.hidden = true;
    form.dataset.einstellungenFuer = spiel.art;
    form.append(...spiel.einstellungen.map(einstellungsfeld));
    const los = document.createElement('button');
    los.type = 'submit';
    los.className = 'haupt breit';
    los.dataset.eroeffnen = spiel.art;
    los.textContent = 'Partie eröffnen';
    const absage = document.createElement('p');
    absage.className = 'meldung';
    absage.hidden = true;
    form.append(absage, los);
    form.addEventListener('submit', (ereignis) => {
      ereignis.preventDefault();
      eroeffnen(spiel.art, einstellungenLesen(form), absage);
    });
    knopf.addEventListener('click', () => {
      form.hidden = false;
      knopf.hidden = true;
      form.querySelector('input, select, button')?.focus();
    });
    karte.append(form);
  }
  return karte;
}

async function spieleLaden() {
  try {
    const antwort = await fetch('/api/spiele');
    const { spiele } = await antwort.json();
    teile.spiele.replaceChildren(...spiele.map(spielkarte));
  } catch {
    melden('Die Liste der Spiele liess sich nicht laden.');
  }
}

document.getElementById('beitreten').addEventListener('click', () => {
  // Was beim Beitreten schiefgeht, steht unter dem Code, nicht in der
  // Spalte der Anmeldung (spielauswahl AC-23).
  const hier = document.getElementById('beitretmeldung');
  meldeort = hier;
  const name = teile.name.value.trim();
  // Bindestriche und Leerzeichen fallen weg - vorgelesen wird ABC-DEF.
  const code = teile.code.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!name) return melden('Bitte einen Namen eintragen.', hier);
  if (code.length !== 6) return melden('Der Raumcode hat sechs Zeichen.', hier);
  localStorage.setItem('name', name);
  melden('');
  melden('', hier);
  verbinden(() => senden({ typ: 'beitreten', code, name }));
});

// Am PC drueckt man Enter, statt zur Maus zu greifen (spielauswahl AC-23):
// im Namen und im Code ist das Beitreten.
for (const feld of [teile.name, teile.code]) {
  feld.addEventListener('keydown', (ereignis) => {
    if (ereignis.key !== 'Enter') return;
    ereignis.preventDefault();
    document.getElementById('beitreten').click();
  });
}

document.getElementById('starten').addEventListener('click', () => {
  melden('', teile.wartemeldung);
  senden({ typ: 'start' });
});

// ---- Konto -------------------------------------------------------------
// Die Sitzung liegt in einem HttpOnly-Keks; JavaScript kommt nicht daran und
// soll es auch nicht. Der Server sagt, wer da ist.

async function konto(weg, koerper) {
  const antwort = await fetch(`/api/auth/${weg}`, {
    method: koerper ? 'POST' : 'GET',
    headers: koerper ? { 'Content-Type': 'application/json' } : undefined,
    body: koerper ? JSON.stringify(koerper) : undefined,
  });
  const daten = await antwort.json().catch(() => ({}));
  return { ok: antwort.ok, status: antwort.status, daten };
}

async function sitzungPruefen() {
  const { ok, daten } = await konto('get-session');
  const wer = ok && daten && daten.user ? daten.user : null;
  teile.angemeldet.hidden = !wer;
  teile.abgemeldet.hidden = Boolean(wer);
  if (wer) {
    teile.werName.textContent = wer.name;
    // Wer angemeldet ist, tritt auch unter seinem Kontonamen bei.
    if (!teile.name.value) teile.name.value = wer.name;
    await spieleLaden();
  }
  return wer;
}

function reiter(aufRegistrieren) {
  document.getElementById('reiterAnmelden').setAttribute('aria-pressed', String(!aufRegistrieren));
  document.getElementById('reiterRegistrieren').setAttribute('aria-pressed', String(aufRegistrieren));
  teile.formAnmelden.hidden = aufRegistrieren;
  teile.formRegistrieren.hidden = !aufRegistrieren;
  melden('');
}

document.getElementById('reiterAnmelden').addEventListener('click', () => reiter(false));
document.getElementById('reiterRegistrieren').addEventListener('click', () => reiter(true));

teile.formAnmelden.addEventListener('submit', async (e) => {
  e.preventDefault();
  melden('');
  const { ok, daten } = await konto('sign-in/email', {
    email: document.getElementById('anEmail').value.trim(),
    password: document.getElementById('anKennwort').value,
  });
  // Nie verraten, welcher Teil falsch war.
  if (!ok) return melden(daten.message || 'Mailadresse oder Kennwort stimmen nicht.');
  await sitzungPruefen();
});

teile.formRegistrieren.addEventListener('submit', async (e) => {
  e.preventDefault();
  melden('');
  const { ok, daten } = await konto('sign-up/email', {
    einladung: document.getElementById('regEinladung').value,
    name: document.getElementById('regName').value.trim(),
    email: document.getElementById('regEmail').value.trim(),
    password: document.getElementById('regKennwort').value,
  });
  if (!ok) return melden(daten.message || 'Das Konto konnte nicht angelegt werden.');
  await sitzungPruefen();
});

document.getElementById('abmelden').addEventListener('click', async () => {
  await konto('sign-out', {});
  await sitzungPruefen();
});

// Neu laden kehrt mit dem gemerkten Platz zurueck (unten, "Start").
document.getElementById('neuladen').addEventListener('click', () => location.reload());

// ---- Start -------------------------------------------------------------

await sitzungPruefen();

// Nach einem Neuladen zurueck in die eigene Partie, ohne Code abzutippen.
const platz = sessionStorage.getItem('platz');
if (platz) {
  const { code, token } = JSON.parse(platz);
  verbinden(() => senden({ typ: 'zurueck', code, token }));
}
