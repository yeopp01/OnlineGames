// @ts-check
'use strict';

// Die Saetze des Spieltags (spieltag AC-29). Der Server setzt die Namen ein,
// der Browser zeigt nur, was ankommt - er setzt nichts zusammen.
//
// Je Art einer Chance stehen nur die Ausgaenge, die es im Fussball gibt:
// kein Abseits nach einer Ecke oder vom Elfmeterpunkt, kein Block vor dem
// Elfmeter. Je Paar mindestens sechs Saetze, damit in einem Spiel keiner
// zweimal kommt.
//
// Platzhalter: {abschluss}, {vorlage}, {torwart} (Nachnamen), {verein},
// {gegner} (Vereinsnamen). {vorlage} steht nur in Arten mit Vorlage
// (`MIT_VORLAGE` in szenen.js).

/** @type {Object<string, Object<string, string[]>>} */
const SAETZE = {
  konter: {
    tor: [
      '{gegner} verliert den Ball an der Mittellinie. {vorlage} schickt {abschluss}, und der bleibt vor {torwart} eiskalt.',
      'Ein langer Ball von {vorlage}, {abschluss} läuft allen davon und schiebt flach ins Eck.',
      'Drei Pässe, zwanzig Sekunden: {vorlage} legt quer, {abschluss} muss nur noch den Fuß hinhalten.',
      '{verein} kontert über rechts, {vorlage} zieht zwei Mann auf sich, {abschluss} vollendet ins kurze Eck.',
      'Ballgewinn, Tempo, Tor. {abschluss} nimmt den Pass von {vorlage} mit und lupft über den herauseilenden {torwart}.',
      '{gegner} stand zu hoch. {vorlage} sieht es zuerst, {abschluss} läuft allein auf {torwart} zu und bleibt ruhig.',
      'Aus der eigenen Hälfte heraus: {vorlage} treibt den Ball, {abschluss} vollendet mit dem Außenrist.',
    ],
    gehalten: [
      '{abschluss} läuft allein auf {torwart} zu — und schiebt ihm den Ball in die Arme.',
      '{vorlage} schickt {abschluss} steil, doch {torwart} kommt heraus und macht sich breit.',
      'Der Konter läuft über drei Stationen, {abschluss} zieht ab, {torwart} reißt die Faust hoch.',
      '{abschluss} hat viel Platz und zu viel Zeit. {torwart} ist längst unten, als der Schuss kommt.',
      'Zwei gegen einen: {vorlage} legt ab, {abschluss} schießt halbhoch, {torwart} pariert mit dem Fuß.',
      '{torwart} ahnt die Ecke. Der Schuss von {abschluss} nach dem Pass von {vorlage} ist zu zentral.',
    ],
    vorbei: [
      '{abschluss} kommt nach dem Pass von {vorlage} frei zum Schuss und setzt ihn knapp am langen Pfosten vorbei.',
      'Der Konter ist gut gespielt, der Abschluss von {abschluss} nicht: weit drüber.',
      '{vorlage} legt quer, {abschluss} rutscht weg, der Ball trudelt ins Aus.',
      'Allein vor {torwart} will {abschluss} es zu genau machen. Daneben.',
      '{verein} läuft drei gegen zwei. {abschluss} schießt zu früh, der Ball fliegt über die Latte.',
      '{abschluss} schließt nach dem Sprint über das halbe Feld ab, ihm fehlt die Kraft. Am Tor vorbei.',
    ],
    pfosten: [
      '{abschluss} umkurvt {torwart} und schiebt aus spitzem Winkel an den Innenpfosten. Er springt wieder heraus.',
      'Der Konter über {vorlage}, der Schuss von {abschluss} — an den Pfosten. {gegner} atmet durch.',
      '{abschluss} nimmt den Pass von {vorlage} direkt. Das Aluminium rettet für {torwart}.',
      'Lattenkreuz! {abschluss} hat nach dem Konter alles richtig gemacht außer dem letzten Zentimeter.',
      '{abschluss} schießt flach, der Ball klatscht an den Pfosten und rollt die Linie entlang ins Aus.',
      '{vorlage} legt quer, {abschluss} trifft aus fünf Metern nur den Pfosten. Das Stadion hält sich den Kopf.',
    ],
    geblockt: [
      '{gegner} ist schneller zurück, als es aussah. Der Schuss von {abschluss} landet am Bein eines Verteidigers.',
      '{abschluss} holt aus, ein Verteidiger wirft sich in den Schuss. Ecke.',
      'Der Konter läuft, {vorlage} spielt {abschluss} frei, doch der letzte Mann grätscht dazwischen.',
      '{abschluss} zögert einen Moment zu lange. Der Schuss prallt vom heraneilenden Verteidiger ab.',
      'Drei gegen drei: {abschluss} zieht ab, und der Ball bleibt im Getümmel hängen.',
      '{abschluss} schießt, ein Verteidiger blockt mit dem Oberkörper. {gegner} kann klären.',
    ],
    abseits: [
      '{vorlage} schickt {abschluss} auf die Reise — die Fahne geht hoch. Abseits, knapp.',
      '{abschluss} läuft allein auf {torwart} zu, aber zu früh los. Der Linienrichter hat es gesehen.',
      'Der Konter ist schnell, {abschluss} schneller als erlaubt. Abseits.',
      '{gegner} rückt im richtigen Moment heraus, {abschluss} steht einen halben Meter vorn.',
      '{abschluss} trifft sogar, aber die Fahne war schon oben. Abseits nach dem Pass von {vorlage}.',
      'Schöner Pass von {vorlage}, doch {abschluss} hat auf den Ball nicht gewartet. Abseits.',
    ],
  },

  flanke: {
    tor: [
      '{vorlage} flankt von links, {abschluss} steigt am höchsten und köpft unhaltbar ein.',
      'Die Flanke von {vorlage} senkt sich am langen Pfosten, {abschluss} drückt sie über die Linie.',
      '{vorlage} bringt den Ball scharf vor das Tor, {abschluss} rutscht hinein. {torwart} ist ohne Chance.',
      'Von der Grundlinie zurückgelegt: {vorlage} findet {abschluss} am Elfmeterpunkt, und der schießt direkt.',
      '{abschluss} löst sich von seinem Bewacher und nickt die Flanke von {vorlage} ins Netz.',
      'Eine Flanke wie gemalt von {vorlage}. {abschluss} muss nur noch den Kopf hinhalten.',
    ],
    gehalten: [
      '{vorlage} flankt, {abschluss} köpft wuchtig — {torwart} lenkt den Ball über die Latte.',
      'Kopfball von {abschluss} nach der Flanke von {vorlage}, aber genau auf {torwart}.',
      '{abschluss} kommt an die Flanke heran, sein Volley pariert {torwart} glänzend.',
      'Die Flanke von {vorlage} ist gut, der Kopfball von {abschluss} auch. {torwart} ist besser.',
      '{torwart} faustet die Hereingabe von {vorlage} vor {abschluss} weg, den Nachschuss hält er auch.',
      '{abschluss} köpft aufs kurze Eck, {torwart} ist schnell unten.',
    ],
    vorbei: [
      '{vorlage} flankt von rechts, {abschluss} kommt mit dem Kopf heran und setzt ihn einen Meter drüber.',
      'Die Flanke von {vorlage} ist zu lang, {abschluss} bekommt nur noch den Hinterkopf dran. Weit vorbei.',
      '{abschluss} springt zu früh. Der Kopfball nach der Flanke von {vorlage} geht am Tor vorbei.',
      '{vorlage} flankt flach, {abschluss} grätscht, der Ball rollt am Pfosten vorbei.',
      'Volley von {abschluss} nach der Hereingabe von {vorlage}: hoch über das Tor auf die Tribüne.',
      '{abschluss} steht frei, köpft aber in den Boden, und der Ball springt über die Latte.',
    ],
    pfosten: [
      '{vorlage} flankt, {abschluss} köpft — an den Pfosten! {torwart} wäre nicht mehr hingekommen.',
      'Die Hereingabe von {vorlage} nimmt {abschluss} direkt. Latte.',
      '{abschluss} wuchtet den Kopfball an die Unterkante der Latte, der Ball springt vor die Linie.',
      'Kopfball von {abschluss} nach der Flanke von {vorlage}, an den Innenpfosten und wieder heraus.',
      '{vorlage} schlägt die Flanke an den langen Pfosten, {abschluss} trifft genau diesen.',
      'Die Flanke ist scharf, der Kopfball von {abschluss} streift den Pfosten. Ganz knapp.',
    ],
    geblockt: [
      '{vorlage} will flanken, die Hereingabe bleibt am ersten Verteidiger hängen.',
      'Die Flanke kommt, {abschluss} schießt, und {gegner} wirft sich mit drei Mann dazwischen.',
      '{abschluss} nimmt die Flanke von {vorlage} an, ein Verteidiger blockt den Schuss.',
      '{vorlage} flankt in den Rücken der Abwehr, der Schuss von {abschluss} wird abgefälscht. Ecke.',
      'Gute Hereingabe von {vorlage}, doch der Kopfball von {abschluss} landet am Kopf eines Verteidigers.',
      '{abschluss} kommt zum Abschluss, ein Verteidiger rettet mit dem Knie.',
    ],
    abseits: [
      '{vorlage} flankt, {abschluss} köpft ein — doch er stand im Abseits.',
      'Die Flanke von {vorlage} landet bei {abschluss}, der einen Schritt zu weit vorne steht.',
      '{abschluss} lauert am langen Pfosten, leider hinter der Abwehr. Abseits.',
      'Die Fahne ist oben, bevor {abschluss} die Flanke von {vorlage} erreicht.',
      '{gegner} rückt beim Flanken heraus, {abschluss} bleibt stehen. Abseits.',
      '{abschluss} nickt die Hereingabe ein, der Linienrichter winkt ab.',
    ],
  },

  steilpass: {
    tor: [
      '{vorlage} spielt den Pass durch die Schnittstelle, {abschluss} nimmt ihn mit und trifft ins lange Eck.',
      'Ein Pass, der die ganze Abwehr von {gegner} aushebelt: {vorlage} auf {abschluss}, Tor.',
      '{abschluss} startet im richtigen Moment, {vorlage} sieht ihn. Flach am herauseilenden {torwart} vorbei.',
      '{vorlage} chippt den Ball über die Abwehr, {abschluss} nimmt ihn volley.',
      'Steil auf {abschluss}, der {torwart} umkurvt und ins leere Tor schiebt.',
      'Der Doppelpass mit {vorlage} sitzt, {abschluss} schließt aus zwölf Metern ab.',
    ],
    gehalten: [
      '{vorlage} schickt {abschluss} in die Tiefe, {torwart} ist schnell draußen und blockt.',
      'Der Steilpass von {vorlage} ist perfekt, der Schuss von {abschluss} pariert {torwart} mit den Fingerspitzen.',
      '{abschluss} nimmt den Pass mit, sein Schuss kommt flach — {torwart} taucht ab und hält.',
      '{torwart} liest den Pass von {vorlage}, ist vor {abschluss} am Ball.',
      'Durch die Mitte auf {abschluss}, der zu lange wartet. {torwart} wirft sich dazwischen.',
      '{abschluss} schießt nach dem Pass von {vorlage} unter die Latte, {torwart} kratzt ihn heraus.',
    ],
    vorbei: [
      '{vorlage} spielt {abschluss} frei, der Schuss streicht am Pfosten vorbei.',
      'Der Pass von {vorlage} ist einen Tick zu weit, {abschluss} erreicht ihn erst an der Grundlinie und schießt ins Außennetz.',
      '{abschluss} läuft in den Pass hinein und jagt den Ball über das Tor.',
      'Gute Idee von {vorlage}, {abschluss} schießt aus vollem Lauf daneben.',
      '{abschluss} will {torwart} tunneln, der Ball rollt knapp vorbei.',
      'Steilpass, Abschluss, vorbei: {abschluss} verzieht nach dem Zuspiel von {vorlage}.',
    ],
    pfosten: [
      '{vorlage} schickt {abschluss}, der schiebt am Torwart vorbei an den Pfosten.',
      '{abschluss} trifft nach dem Steilpass von {vorlage} die Latte. {torwart} hätte nichts gemacht.',
      'Der Ball von {abschluss} streift {torwart} und springt an den Pfosten.',
      '{abschluss} schießt durch die Beine des Verteidigers — an den Pfosten.',
      'Pass von {vorlage}, Schuss von {abschluss}, Pfosten. Dann ist der Ball weg.',
      'Das Aluminium rettet {gegner}: {abschluss} trifft nach dem Steilpass den Innenpfosten.',
    ],
    geblockt: [
      '{vorlage} sucht {abschluss}, ein Verteidiger fängt den Pass ab und spitzelt den Ball weg.',
      '{abschluss} ist durch, aber ein Verteidiger holt ihn ein und grätscht den Schuss ab.',
      'Der Pass von {vorlage} kommt an, der Schuss von {abschluss} nicht: geblockt.',
      '{abschluss} schließt ab, der zurückeilende Verteidiger wirft sich hinein.',
      'Steil auf {abschluss}, doch {gegner} ist mit zwei Mann da. Der Schuss bleibt hängen.',
      '{abschluss} zieht nach innen, ein Verteidiger stellt den Fuß in den Schuss.',
    ],
    abseits: [
      '{vorlage} spielt den Pass, {abschluss} läuft zu früh los. Abseits.',
      'Die Abwehr von {gegner} rückt im richtigen Moment, {abschluss} steht vorn.',
      'Der Steilpass von {vorlage} ist gut, {abschluss} war schneller als die Regel.',
      '{abschluss} ist durch und trifft — aber die Fahne ist oben.',
      'Abseits. {abschluss} hat nicht auf den Pass von {vorlage} gewartet.',
      '{abschluss} startet, bevor {vorlage} spielt. Der Linienrichter ist im Bild.',
    ],
  },

  fernschuss: {
    tor: [
      '{abschluss} fasst sich aus zwanzig Metern ein Herz — und trifft genau in den Winkel.',
      'Niemand greift {abschluss} an, also schießt er. Flach, hart, ins Eck.',
      'Aus fünfundzwanzig Metern: {abschluss} zieht ab, {torwart} sieht den Ball erst im Netz.',
      '{abschluss} nimmt den abgewehrten Ball direkt aus der Luft. Ein Treffer für das Jahr.',
      '{torwart} ist die Sicht verstellt, der Schuss von {abschluss} schlägt unten links ein.',
      'Der Ball senkt sich, {torwart} kommt nicht mehr heran. {abschluss} hat aus der Distanz getroffen.',
    ],
    gehalten: [
      '{abschluss} zieht aus fünfundzwanzig Metern ab. {torwart} ist unten und hält.',
      'Fernschuss von {abschluss}, sicher gefangen von {torwart}.',
      '{abschluss} probiert es aus der Distanz, {torwart} faustet den Ball über die Latte.',
      'Ein strammer Schuss von {abschluss}, doch zu zentral für {torwart}.',
      '{torwart} lenkt den Flatterball von {abschluss} um den Pfosten.',
      '{abschluss} schießt von der Strafraumgrenze, {torwart} pariert zur Seite.',
    ],
    vorbei: [
      '{abschluss} zieht aus zwanzig Metern ab, gut zwei Meter vorbei.',
      'Der Fernschuss von {abschluss} landet auf der Tribüne.',
      '{abschluss} trifft den Ball nicht richtig, er hoppelt am Tor vorbei.',
      'Aus der Distanz: {abschluss} verfehlt den Winkel um eine Handbreit.',
      '{abschluss} probiert es mit links. Der Ball fliegt über das Tor.',
      '{abschluss} schießt, als niemand damit rechnet. Auch der Ball nicht: weit daneben.',
    ],
    pfosten: [
      '{abschluss} zieht aus fünfundzwanzig Metern ab. Der Ball klatscht an den Pfosten und von dort ins Aus.',
      'Latte! {abschluss} hat aus der Distanz alles getroffen außer dem Tor.',
      '{abschluss} schießt, {torwart} streckt sich, der Pfosten hält für ihn.',
      'Der Fernschuss von {abschluss} senkt sich auf die Latte.',
      '{abschluss} trifft aus zwanzig Metern das Lattenkreuz.',
      'Ein Hammer von {abschluss}, an den Pfosten. {gegner} hat Glück.',
    ],
    geblockt: [
      '{abschluss} holt aus, der Schuss prallt am ersten Verteidiger ab.',
      'Der Fernschuss von {abschluss} bleibt in der Mauer der Abwehrspieler von {gegner} hängen.',
      '{abschluss} schießt aus zwanzig Metern, ein Verteidiger dreht sich in den Ball.',
      '{abschluss} hat das Bein schon oben, ein Verteidiger ist schneller.',
      '{abschluss} zieht ab, abgefälscht zur Ecke.',
      'Der Schuss von {abschluss} trifft einen Verteidiger am Rücken. {gegner} klärt.',
    ],
  },

  ecke: {
    tor: [
      '{vorlage} zirkelt die Ecke an den kurzen Pfosten, {abschluss} steigt höher als alle.',
      'Ecke von {vorlage}, {abschluss} löst sich und köpft ins lange Eck.',
      'Die Ecke wird kurz ausgeführt, {vorlage} flankt nach, {abschluss} drückt den Ball über die Linie.',
      '{torwart} kommt heraus und verpasst die Ecke von {vorlage}. {abschluss} köpft ins leere Tor.',
      'Ecke, Kopfballverlängerung, {abschluss} am langen Pfosten. Nach dem Ball von {vorlage} geht es schnell.',
      '{abschluss} kommt aus dem Rückraum und nimmt die Ecke von {vorlage} volley.',
    ],
    gehalten: [
      'Die Ecke von {vorlage} landet bei {abschluss}, der Kopfball ist eine Beute für {torwart}.',
      '{abschluss} köpft die Ecke aufs Tor, {torwart} hält mit einer Hand.',
      '{torwart} pflückt die Ecke von {vorlage} vor dem Kopf von {abschluss} aus der Luft.',
      'Ecke, Kopfball {abschluss}, Parade {torwart}.',
      'Die Ecke kommt scharf, {abschluss} verlängert, {torwart} reagiert.',
      '{abschluss} kommt nach der Ecke frei zum Kopfball, zu nah am Torwart.',
    ],
    vorbei: [
      'Ecke von {vorlage}, {abschluss} köpft knapp drüber.',
      'Die Ecke wird verlängert, {abschluss} kommt am langen Pfosten nicht mehr richtig heran.',
      '{abschluss} steigt nach der Ecke von {vorlage} hoch, der Kopfball geht vorbei.',
      'Die Ecke ist zu lang, {abschluss} erwischt sie nur noch mit dem Hinterkopf.',
      'Nach der Ecke von {vorlage} schießt {abschluss} aus dem Gewühl daneben.',
      '{abschluss} köpft die Ecke in den Boden, der Ball springt über das Tor.',
    ],
    pfosten: [
      'Ecke von {vorlage}, Kopfball {abschluss}, an die Latte.',
      '{abschluss} köpft die Ecke an den Innenpfosten. {torwart} hatte sie nicht.',
      'Die Ecke von {vorlage} springt im Fünfmeterraum auf, {abschluss} trifft den Pfosten.',
      '{abschluss} kommt nach der Ecke als Erster an den Ball. Aluminium.',
      'Nach der Ecke: {abschluss} wuchtet den Ball an die Latte.',
      'Die Ecke von {vorlage} landet auf dem Kopf von {abschluss} und von dort am Pfosten.',
    ],
    geblockt: [
      'Die Ecke von {vorlage} köpft der erste Verteidiger weg.',
      '{abschluss} schießt nach der Ecke, im Gewühl bleibt der Ball hängen.',
      'Ecke, Durcheinander, {gegner} wirft sich in jeden Schuss. Auch in den von {abschluss}.',
      '{abschluss} kommt nach der Ecke zum Abschluss, ein Verteidiger blockt auf der Linie.',
      'Die Ecke von {vorlage} wird abgewehrt, der Nachschuss von {abschluss} geblockt.',
      'Nach der Ecke ist {gegner} zur Stelle, bevor {abschluss} schießen kann.',
    ],
  },

  freistoss: {
    tor: [
      '{abschluss} legt sich den Ball zurecht, aus neunzehn Metern über die Mauer — Tor.',
      'Freistoß {abschluss}, um die Mauer herum ins kurze Eck. {torwart} steht falsch.',
      '{abschluss} schießt den Freistoß flach unter der springenden Mauer hindurch.',
      'Aus fünfundzwanzig Metern: der Freistoß von {abschluss} senkt sich hinter {torwart} ins Netz.',
      '{abschluss} zirkelt den Freistoß in den Winkel. Nichts zu machen für {torwart}.',
      'Freistoß {abschluss}, der Ball dreht sich über die Mauer und schlägt im Eck ein.',
    ],
    gehalten: [
      '{abschluss} aus neunzehn Metern über die Mauer. {torwart} fliegt und lenkt ihn um den Pfosten.',
      'Der Freistoß von {abschluss} ist gut, {torwart} ist besser.',
      '{torwart} hat die Ecke vorher geahnt. Der Freistoß von {abschluss} landet in seinen Armen.',
      'Freistoß {abschluss}, aufs Torwarteck. {torwart} hält.',
      '{abschluss} schießt den Freistoß hart, {torwart} faustet ihn weg.',
      '{torwart} streckt sich und holt den Freistoß von {abschluss} aus dem Winkel.',
    ],
    vorbei: [
      '{abschluss} schießt den Freistoß knapp über das Tor.',
      'Der Freistoß von {abschluss} dreht sich zu wenig und fliegt vorbei.',
      '{abschluss} versucht es direkt, der Ball geht weit über die Latte.',
      'Freistoß von halbrechts, {abschluss} verfehlt den Winkel knapp.',
      '{abschluss} schießt den Freistoß ins Außennetz. Manche im Stadion jubeln schon.',
      'Der Freistoß von {abschluss} streicht am langen Pfosten vorbei.',
    ],
    pfosten: [
      'Freistoß {abschluss}, an die Latte!',
      '{abschluss} trifft mit dem Freistoß den Pfosten, {torwart} war geschlagen.',
      'Über die Mauer, an das Lattenkreuz: {abschluss} hat Pech.',
      'Der Freistoß von {abschluss} klatscht an den Innenpfosten und springt zurück ins Feld.',
      '{abschluss} schießt den Freistoß an die Oberkante der Latte.',
      'Freistoß {abschluss} — der Pfosten wackelt noch.',
    ],
    geblockt: [
      'Der Freistoß von {abschluss} bleibt in der Mauer hängen.',
      '{abschluss} schießt, die Mauer springt nicht und blockt.',
      'Freistoß {abschluss}, mitten in die Mauer von {gegner}.',
      'Der Freistoß wird von der Mauer abgefälscht, Ecke für {verein}.',
      '{abschluss} schießt den Freistoß flach, ein Verteidiger hat sich hingelegt.',
      'Mauer, Abpraller, geklärt. Der Freistoß von {abschluss} bringt nichts.',
    ],
  },

  elfmeter: {
    tor: [
      'Elfmeter. {abschluss} läuft an, {torwart} springt nach links, der Ball geht rechts hinein.',
      '{abschluss} verwandelt den Elfmeter sicher halbhoch.',
      'Strafstoß {abschluss}: flach ins Eck, {torwart} ist in der richtigen Ecke und kommt nicht heran.',
      '{abschluss} wartet, bis {torwart} sich bewegt, und schiebt ein.',
      'Elfmeter unter die Latte. {abschluss} lässt {torwart} keine Chance.',
      '{abschluss} schießt den Strafstoß mit Wucht in die Mitte. {torwart} liegt schon.',
    ],
    gehalten: [
      '{torwart} hält den Elfmeter von {abschluss}!',
      '{abschluss} schießt den Strafstoß zu zentral, {torwart} pariert mit den Beinen.',
      'Elfmeter {abschluss}, {torwart} ahnt die Ecke und taucht ab.',
      '{torwart} macht sich groß, {abschluss} wird nervös. Gehalten.',
      '{abschluss} verzögert, {torwart} wartet länger. Gehalten.',
      'Strafstoß {abschluss}, flach ins Eck — {torwart} ist da.',
    ],
    vorbei: [
      '{abschluss} schießt den Elfmeter über das Tor.',
      'Elfmeter {abschluss}, knapp am Pfosten vorbei.',
      '{abschluss} will es zu genau machen. Der Strafstoß geht daneben.',
      'Der Elfmeter von {abschluss} landet auf der Tribüne.',
      '{abschluss} rutscht beim Schuss weg, der Ball fliegt vorbei.',
      '{abschluss} schießt den Strafstoß neben das Tor. Er schaut lange auf den Rasen.',
    ],
    pfosten: [
      'Elfmeter {abschluss} — an den Pfosten!',
      '{abschluss} schießt den Strafstoß an die Latte.',
      '{torwart} war geschlagen, aber der Elfmeter von {abschluss} trifft nur den Pfosten.',
      'Strafstoß {abschluss}, Innenpfosten, und der Ball springt wieder heraus.',
      '{abschluss} zielt ins Eck und trifft den Pfosten.',
      'Der Elfmeter von {abschluss} klatscht an die Unterkante der Latte und springt vor die Linie.',
    ],
  },

  einzelaktion: {
    tor: [
      '{abschluss} lässt zwei Verteidiger stehen und schießt ins kurze Eck.',
      '{abschluss} zieht von links nach innen, Haken, Schuss, Tor.',
      'Ein Solo über vierzig Meter: {abschluss} umkurvt auch noch {torwart}.',
      '{abschluss} tanzt durch den Strafraum von {gegner} und schiebt ein.',
      '{abschluss} nimmt den Ball mit der Brust an, dreht sich und trifft.',
      'Übersteiger, Tempo, Abschluss. {abschluss} macht es allein.',
    ],
    gehalten: [
      '{abschluss} setzt sich gegen zwei durch, sein Schuss ist eine Beute für {torwart}.',
      '{abschluss} dribbelt in den Strafraum und scheitert an {torwart}.',
      'Ein schönes Solo von {abschluss}, ein schöner Reflex von {torwart}.',
      '{abschluss} zieht nach innen und schießt, {torwart} ist unten.',
      '{abschluss} lässt seinen Gegenspieler aussteigen, {torwart} nicht.',
      '{abschluss} versucht es allein und schießt {torwart} an.',
    ],
    vorbei: [
      '{abschluss} dribbelt sich frei und schießt knapp vorbei.',
      '{abschluss} läuft zwei Mann davon, dann ist der Winkel zu spitz.',
      'Viel Aufwand von {abschluss}, wenig Ertrag: der Schuss geht über das Tor.',
      '{abschluss} zieht nach innen und schlenzt den Ball am langen Pfosten vorbei.',
      '{abschluss} geht allein durch und vergisst, rechtzeitig zu schießen. Ins Aus.',
      'Haken, Haken, Schuss — daneben. {abschluss} schüttelt den Kopf.',
    ],
    pfosten: [
      '{abschluss} lässt zwei stehen und trifft den Pfosten.',
      'Nach seinem Solo schießt {abschluss} an die Latte.',
      '{abschluss} schlenzt den Ball an den Innenpfosten.',
      '{abschluss} zieht nach innen, Schuss, Pfosten. {torwart} hätte ihn nicht gehabt.',
      'Ein Dribbling durch die halbe Abwehr von {gegner}, und dann die Latte.',
      '{abschluss} umkurvt {torwart} und schießt aus spitzem Winkel an den Pfosten.',
    ],
    geblockt: [
      '{abschluss} dribbelt, bis ihm drei Verteidiger den Weg verstellen.',
      '{abschluss} will durch und bleibt am letzten Mann hängen.',
      'Der Schuss von {abschluss} nach seinem Solo wird geblockt.',
      '{abschluss} verliert im Strafraum den Ball an einen Verteidiger von {gegner}.',
      '{abschluss} zieht ab, ein Verteidiger wirft sich hinein.',
      '{abschluss} kommt an zwei vorbei, der dritte grätscht sauber.',
    ],
  },

  abstauber: {
    tor: [
      '{torwart} kann den Schuss von {vorlage} nur abklatschen, {abschluss} staubt ab.',
      'Der Ball springt im Fünfmeterraum hin und her, {abschluss} ist zur Stelle.',
      '{vorlage} schießt, der Ball prallt vom Pfosten zu {abschluss}, der einschiebt.',
      'Abpraller, Nachschuss, Tor. {abschluss} steht da, wo ein Stürmer stehen muss.',
      '{torwart} lässt den Schuss von {vorlage} prallen, {abschluss} reagiert am schnellsten.',
      '{abschluss} grätscht den abgewehrten Ball über die Linie.',
    ],
    gehalten: [
      '{torwart} pariert gegen {vorlage} und auch den Nachschuss von {abschluss}.',
      'Doppelchance: {vorlage} und {abschluss} scheitern nacheinander an {torwart}.',
      'Der Abpraller fällt {abschluss} vor die Füße, {torwart} ist schon wieder oben.',
      '{abschluss} schießt den Abpraller sofort, {torwart} reißt das Bein hoch.',
      '{torwart} lässt prallen, fängt den Nachschuss von {abschluss} dann aber sicher.',
      'Zweimal {torwart}: erst gegen {vorlage}, dann gegen {abschluss}.',
    ],
    vorbei: [
      'Der Abpraller landet bei {abschluss}, der ihn über das leere Tor schießt.',
      '{abschluss} kommt an den abgewehrten Ball und setzt ihn neben das Tor.',
      'Nach dem Schuss von {vorlage} springt der Ball zu {abschluss}. Der verzieht.',
      '{abschluss} ist zu überrascht vom Abpraller, der Ball rutscht ihm über den Spann. Vorbei.',
      'Der Nachschuss von {abschluss} geht knapp am Pfosten vorbei.',
      '{abschluss} staubt nicht ab, sondern schießt ins Aus.',
    ],
    pfosten: [
      'Abpraller zu {abschluss}, der Nachschuss geht an den Pfosten.',
      '{vorlage} scheitert an {torwart}, {abschluss} trifft im Nachschuss die Latte.',
      'Der Ball springt zu {abschluss}, sein Schuss klatscht an den Pfosten.',
      'Im Gewühl kommt {abschluss} an den Ball — Pfosten. {gegner} klärt endlich.',
      '{abschluss} nimmt den Abpraller direkt und trifft das Aluminium.',
      'Erst hält {torwart}, dann rettet der Pfosten gegen {abschluss}.',
    ],
    geblockt: [
      'Der Abpraller landet bei {abschluss}, ein Verteidiger wirft sich auf der Linie dazwischen.',
      '{abschluss} schießt nach, im Fünfmeterraum steht ein Bein von {gegner} im Weg.',
      'Nach dem Schuss von {vorlage} kommt {abschluss} zum Nachschuss, geblockt.',
      'Zweiter Ball, zweiter Versuch: {abschluss} trifft einen Verteidiger.',
      '{abschluss} will abstauben, {gegner} klärt in höchster Not.',
      'Abpraller, Nachschuss {abschluss}, Kopf eines Verteidigers.',
    ],
  },
};

/** Ein Satz mit eingesetzten Namen. Was fehlt, ist ein Fehler des Aufrufers. */
function einsetzen(satz, namen) {
  return satz.replace(/\{(\w+)\}/g, (_, feld) => {
    if (!(feld in namen) || namen[feld] == null) throw new Error(`Satz ohne ${feld}: ${satz}`);
    return namen[feld];
  });
}

module.exports = { SAETZE, einsetzen };
