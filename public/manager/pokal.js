// @ts-check
// Der Pokal: die Runden nebeneinander wie ein Turnierbaum, und wo der eigene
// Verein steht.
import { inhalt, lage } from './kern.js';
import { text } from './teile.js';

// Im Pokal zwei Zeilen je Paarung wie auf einem Turnierbaum: drei Runden
// nebeneinander lassen für eine Zeile je Paarung zu wenig Platz für die Namen.
function pokalPaarung(p) {
  const seite = (id, name, tore) => `<div class="seite ${p.sieger && p.sieger === id ? 'sieger' : ''}">
    <span class="name">${text(name)}</span><span class="tore">${p.tore ? tore : ''}</span></div>`;
  const zusatz = p.elfmeter ? `i.E. ${p.elfmeter[0]}:${p.elfmeter[1]}` : p.verlaengerung ? 'n.V.' : '';
  return `<div class="paarung pokalpaarung ${p.eigenes ? 'eigenes' : ''}">
    ${seite(p.heim, p.heimName, p.tore?.[0])}${seite(p.gast, p.gastName, p.tore?.[1])}
    ${zusatz ? `<small class="zusatz">${zusatz}</small>` : ''}
  </div>`;
}

export function blattPokal() {
  const p = lage.stand.pokal;
  const eigen = lage.stand.verein.id;
  const eigene = p.runden.flatMap((r) => r.paarungen.filter((x) => x.eigenes).map((x) => ({ ...x, runde: r.name })));
  const letzte = eigene.at(-1);
  let stellung = 'Dein Verein ist in diesem Jahr nicht im Pokal.';
  if (p.sieger) stellung = `Pokalsieger: ${text(p.sieger)}.`;
  else if (letzte && letzte.tore && letzte.sieger !== eigen) stellung = `Ausgeschieden: ${text(letzte.runde)}.`;
  else if (letzte) stellung = `Noch dabei - ${text(letzte.runde)}.`;
  inhalt.innerHTML = `
    <p class="unterzeile" id="pokalLage">${stellung}</p>
    <div class="pokal">${p.runden.map((r) => `<section class="pokalrunde">
      <h2>${text(r.name)}</h2>
      ${r.paarungen.length ? r.paarungen.map(pokalPaarung).join('') : '<p class="unterzeile">noch nicht ausgelost</p>'}
    </section>`).join('')}</div>`;
}
