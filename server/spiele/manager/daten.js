// @ts-check
'use strict';

// Die Formen des Managerspiels, fuer den Pruefer (`npm run typen`). Die
// Dateien bleiben JavaScript: wer `@param {Verein}` schreibt, bekommt einen
// vertippten Feldnamen gemeldet, bevor ein Test ihn findet.
//
// **Ein neues Feld wird hier eingetragen**, sonst meldet der Pruefer es.
// Neue Tabellen ab M1 stehen ebenfalls hier (→ docs/manager/plan.md, M0.6);
// die bestehenden bleiben, wo sie sind (`WIRKUNG` in spieltag.js).
//
// Eingebunden ueber `@typedef {import('./daten').Verein} Verein`.

/**
 * @typedef {'TOR'|'ABW'|'MIT'|'ANG'} Position
 *
 * @typedef {object} Saisonwerte
 * @property {number} spiele
 * @property {number} minuten
 * @property {number} tore
 * @property {number} vorlagen
 * @property {number} notenSumme
 * @property {number} noten
 * @property {number} gelbe
 * @property {number} platzverweise
 *
 * @typedef {object} Vertrag
 * @property {number} bis     letzte Saison des Vertrags
 * @property {number} gehalt  im Jahr, in Tausend
 *
 * @typedef {object} Spieler
 * @property {string} id
 * @property {string} name
 * @property {Position} position
 * @property {string} rolle        der Platz, fuer den er gebaut ist (`IV`, `LA` ...)
 * @property {string|null} [nebenrolle]
 * @property {number} alter
 * @property {number} staerke
 * @property {number} talent
 * @property {number} kondition   0 bis 100
 * @property {number} moral       0 bis 100
 * @property {Vertrag|null} vertrag  ohne: vereinslos
 * @property {number} gelbe       in der laufenden Zaehlung bis zur Sperre
 * @property {number} sperre      Pflichtspiele
 * @property {number} verletzt    Wochen
 * @property {Saisonwerte} saison
 * @property {{spiele: number, tore: number}} laufbahn
 * @property {object|null} transferliste
 * @property {boolean} [jugend]
 * @property {number} [karriereende]  die Saison, nach der er aufhoert
 *
 * @typedef {object} Taktik
 * @property {string} system       `4-4-2`, `3-5-2` ...
 * @property {number} ausrichtung  1 Mauern bis 5 Sturm
 * @property {number} haerte       1 bis 5
 * @property {number} pressing     1 bis 5
 *
 * @typedef {object} Sponsor
 * @property {string} id
 * @property {string} name
 * @property {'sicher'|'ausgewogen'|'erfolg'} art
 * @property {number} jeSpiel
 * @property {number} jeSieg
 *
 * @typedef {object} Stadion
 * @property {number} plaetze
 * @property {{plaetze: number, rest: number}|null} ausbau
 *
 * @typedef {object} Verein
 * @property {string} id
 * @property {string} name
 * @property {1|2} liga
 * @property {Spieler[]} spieler
 * @property {number} konto        in Tausend
 * @property {Stadion} stadion
 * @property {number} reputation
 * @property {number} eintritt
 * @property {Sponsor|null} sponsor
 * @property {Taktik} taktik
 * @property {number} training
 * @property {string} schwerpunkt
 * @property {{systeme: Object<string, number>, pressing: number, abwehr: number, angriff: number}} einstudiert
 * @property {number} technikSumme
 * @property {number} trainingswochen
 * @property {'auto'|'verletzung'} wechselregel
 * @property {{system: string, ids: string[]}|null} aufstellung  die gemerkte Elf
 * @property {number} abzug        Punktabzug
 * @property {number} tvRang
 *
 * @typedef {object} Aufstellung  was ein Spiel von einer Mannschaft bekommt
 * @property {Spieler[]} elf
 * @property {Spieler[]} bank
 * @property {string} [system]
 *
 * @typedef {object} Manager  ein Mensch in einer Karriere (karriere AC-29)
 * @property {string} managerId
 * @property {string|null} vereinId
 * @property {string} name
 * @property {string} status
 * @property {object[]} stellen
 * @property {object} vorstand
 * @property {Sponsor[]|null} sponsorAngebote
 * @property {object[]} angebote
 * @property {object[]} nachrichten
 * @property {object[]} buch
 * @property {object} kasse
 * @property {object} vorjahr
 * @property {object} zuletzt
 * @property {object[]} entwicklungen
 *
 * @typedef {object} Karrierezustand  was `sichern()` schreibt (welt.js)
 * @property {number} fassung
 * @property {number} startwert
 * @property {number} saison
 * @property {number} termin       Stelle in `TERMINE`
 * @property {Verein[]} vereine
 * @property {Spieler[]} freie     die Vereinslosen
 * @property {number} zaehler      fuer neue Kennungen
 * @property {Object<string, object[][]>} plaene
 * @property {Object<string, object[]>} tabellen
 * @property {Object<string, object>} torjaeger
 * @property {object|null} pokal
 * @property {object[]} ticker
 * @property {object[]} historie
 * @property {Manager[]} manager
 * @property {OffenerTermin} [offen]  nur solange ein eigenes Spiel live laeuft (live.js)
 *
 * @typedef {object} OffenerTermin  ein gerechneter Termin, der auf den Abpfiff wartet
 * @property {number[]} kontoVorher   je Manager das Konto vor dem Termin
 * @property {{stelle: number, liga?: number, kasse: object|null, ergebnis: object|null}[]} spiele  in der Reihenfolge des Rechnens
 * @property {{managerId: string, stelle: number, seite: 'heim'|'gast', spiel: Spiel}|null} live
 *
 * @typedef {object} Platzspieler  was ein Spiel von einem Spieler liest (spieltag.js, `knapp`)
 * @property {string} id
 * @property {string} name
 * @property {Position} position   auf dem Platz: die Reihe seines Platzes
 * @property {string} [platz]      `TW`, `IV`, `LA` ... - nur wer auf dem Platz steht
 * @property {string} rolle
 * @property {string|null} [nebenrolle]
 * @property {number} staerke      auf dem Platz: mit der Eignung fuer ihn
 * @property {number} moral
 * @property {number} kondition
 *
 * @typedef {object} Seite  eine Mannschaft in einem laufenden Spiel
 * @property {string} id           der Verein
 * @property {number} niveau       fuer die Noten; 0 in der Vorschau
 * @property {Platzspieler[]} auf
 * @property {string[]} plaetze    die Plaetze der Startelf, wie aufgestellt
 * @property {Platzspieler[]} bank
 * @property {Object<string, {position: Position, staerke: number}>} spieler  Werte im Verein, fuer die Noten
 * @property {Taktik} taktik
 * @property {{system: number, pressing: number, abwehr: number, angriff: number}} geuebt  0 bis 1
 * @property {Object<string, number>} systeme  wie gut die Elf jedes System kennt, 0 bis 1 - fuer den Wechsel im Spiel
 * @property {'ruhig'|'aufbauen'|'laut'} [ansprache]  zur Halbzeit gehalten (spieltag AC-30)
 * @property {number} [umstellen]  nur ein Verein des Servers: seine Ausrichtung beim Anpfiff, an der er ab Minute 60 umstellt (spieltag AC-31)
 * @property {'auto'|'verletzung'} wechselregel
 * @property {Object<string, number>} frische   Kondition im Spiel
 * @property {Object<string, {von: number, bis: number|null}>} minuten
 * @property {Object<string, number>} gelbe     Gelbe in diesem Spiel
 * @property {Object<string, number>} letzte    Minute des letzten Zweikampfs
 * @property {number} tore
 * @property {number} chancen
 * @property {number} wechsel
 * @property {string[]} gesperrt   wer vor dem Anpfiff gesperrt war
 *
 * @typedef {object} Spiel  ein laufendes Spiel, ein reiner Datenwert (spieltag AC-26)
 * @property {string} heim
 * @property {string} gast
 * @property {Zufallsstand} zufall
 * @property {boolean} neutral
 * @property {boolean} entscheidung
 * @property {Seite[]} seiten       Heim, Gast
 * @property {{heim: {elf: string[], bank: string[]}, gast: {elf: string[], bank: string[]}}} aufstellung
 * @property {number} abschnitte   gespielte Abschnitte zu fuenf Minuten
 * @property {number} minute
 * @property {number} besitz       Summe der Ballbesitzanteile je Abschnitt
 * @property {number[]} [anteile]   Spielanteil des Heims je Abschnitt in Prozent, nur mit Szenen (oberflaeche AC-19)
 * @property {boolean} verlaengerung
 * @property {number[]|null} elfmeter
 * @property {boolean} vorbei
 * @property {Ereignis[]} ereignisse
 * @property {Szenenstand|null} [szenen]  nur im Spiel, das jemand sieht (spieltag AC-27)
 *
 * @typedef {object} Szene  eine Chance, erzaehlt (szenen.js)
 * @property {number} minute
 * @property {'heim'|'gast'} seite
 * @property {string} verein
 * @property {string} art          `konter`, `flanke` ... (`ARTEN` in szenen.js)
 * @property {string} zone         `strafraum-links`, `vorfeld-mitte` ...
 * @property {{abschluss: string, vorlage: string|null, torwart: string|null}} beteiligte
 * @property {string} ausgang      `tor`, `gehalten`, `vorbei`, `pfosten`, `geblockt`, `abseits`
 * @property {string} satz         mit Namen, fertig zum Zeigen
 *
 * @typedef {object} Szenenstand  was ein Spiel mit Szenen zusaetzlich traegt
 * @property {Zufallsstand} zufall  eine eigene Quelle - die des Spiels bleibt unberuehrt (AC-28)
 * @property {[string, string]} namen  Heim, Gast
 * @property {Object<string, string>} genannt  je Spieler der Name im Satz: Nachname, bei Doppel der ganze
 * @property {Szene[]} liste
 * @property {string[]} benutzt   `art/ausgang/nummer` der schon gesagten Saetze
 *
 * @typedef {{minute: number, art: string, verein?: string, spielerId?: string, [feld: string]: any}} Ereignis  Tor, Karte, Wechsel ...
 *
 * @typedef {object} Zufallsstand  der Zufall als Wert (spieltag AC-26)
 * @property {number} a
 *
 * @typedef {(() => number) & {stand?: Zufallsstand}} Zufall  eine Quelle aus `zufallAus`
 */

module.exports = {};
