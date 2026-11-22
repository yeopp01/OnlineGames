// @ts-check
// Die Mannschaft: Aufstellung auf dem Platz, Bank, Taktik, Training und was
// eingeuebt ist. Die Elf, an der gearbeitet wird, haelt der Browser
// (`lage.elfLokal`), bis sie abgegeben ist.
import {
  $, alle, besteElf, inhalt, lage, melden, nachPosition, spielerVon, wertVon, zeichnen, zug,
} from './kern.js';
import {
  balken, note, rolleText, text,
} from './teile.js';

// Zu welchem Mannschaftsteil ein Platz gehoert - dieselbe Zuordnung wie auf dem Server.
const TEIL = {
  TW: 'TOR', LV: 'ABW', IV: 'ABW', RV: 'ABW', DM: 'MIT', LM: 'MIT', ZM: 'MIT', RM: 'MIT', OM: 'MIT', LA: 'ANG', ST: 'ANG', RA: 'ANG',
};
const SCHWERPUNKTE = {
  keiner: 'kein Schwerpunkt',
  system: 'System einspielen',
  pressing: 'Pressing üben',
  abwehr: 'Abwehr üben',
  angriff: 'Angriff üben',
};

const form = (s) => s.staerke * (0.6 + (s.kondition / 100) * 0.4) * (0.9 + (s.moral / 100) * 0.2);
// Wie gut einer auf einem Platz ist - die Tabelle kommt vom Server, gerechnet wird dort.
const eignung = (s, platz) => (s.rolle === platz ? 1 : s.nebenrolle === platz ? lage.stand.eignung.neben : lage.stand.eignung.tabelle[s.rolle][platz]);
const passtInsFach = (s, platz) => (platz === 'TW') === (s.position === 'TOR');
const wertAuf = (s, platz) => form(s) * eignung(s, platz);
const plaetzeJetzt = () => lage.stand.plaetze[lage.stand.verein.taktik.system];
const FACH = 'Ins Tor gehört ein Torwart, ins Feld keiner.';

/**
 * Ein Spieler auf einen Platz. Steht er schon in der Elf, tauscht er mit dem,
 * der dort steht; kommt er von der Bank, setzt sich der andere auf die Bank.
 */
function aufPlatz(id, index) {
  const elf = lage.elfLokal;
  const spieler = spielerVon(id);
  const plaetze = plaetzeJetzt();
  if (!spieler.bereit) return melden(`${spieler.name} ist ${spieler.ausfall}.`, true);
  const bisher = elf.indexOf(id);
  if (bisher === index) return undefined;
  if (!passtInsFach(spieler, plaetze[index])) return melden(FACH, true);
  if (bisher >= 0) {
    const anderer = spielerVon(elf[index]);
    if (anderer && !passtInsFach(anderer, plaetze[bisher])) return melden(FACH, true);
    [elf[bisher], elf[index]] = [elf[index], elf[bisher]];
  } else {
    elf[index] = id;
  }
  return zeichnen();
}

/**
 * Ein Klick genuegt: von der Bank kommt ein Spieler auf den Platz, auf dem er
 * gegenueber dem, der dort steht, am meisten bringt; aus der Elf weicht er
 * dem Besten von der Bank für seinen Platz.
 */
function tauschen(id) {
  const elf = lage.elfLokal;
  const spieler = spielerVon(id);
  if (!spieler.bereit) return melden(`${spieler.name} ist ${spieler.ausfall}.`, true);
  const plaetze = plaetzeJetzt();
  const index = elf.indexOf(id);
  if (index >= 0) {
    const platz = plaetze[index];
    const ersatz = lage.stand.verein.spieler
      .filter((s) => s.bereit && !elf.includes(s.id) && passtInsFach(s, platz))
      .sort((a, b) => wertAuf(b, platz) - wertAuf(a, platz))[0];
    if (!ersatz) return melden(`Für ${platz} sitzt niemand mehr auf der Bank.`);
    elf[index] = ersatz.id;
    return zeichnen();
  }
  const gewinn = (platz, i) => {
    if (!passtInsFach(spieler, platz)) return -Infinity;
    const dort = spielerVon(elf[i]);
    return wertAuf(spieler, platz) - (dort ? wertAuf(dort, platz) : 0);
  };
  const ziel = plaetze.map((platz, i) => ({ i, wert: gewinn(platz, i) })).sort((a, b) => b.wert - a.wert)[0];
  return aufPlatz(id, ziel.i);
}

// Ziehen und Ablegen mit Zeigerereignissen statt HTML-Drag-and-Drop: das geht
// mit Maus, Stift und Finger gleich. Wer nicht zieht, klickt - dann gilt `tauschen`.
let gezogen = null;
let klickSchlucken = false;

const zielUnter = (x, y) => /** @type {HTMLElement | null} */ (document.elementFromPoint(x, y)?.closest('[data-platz], #bankBereich') || null);

function ziehenBeginnen(e) {
  const quelle = e.currentTarget;
  if (e.button !== 0) return;
  // Mit dem Finger wird nur auf dem Spielfeld gezogen - in der Bankliste scrollt er.
  if (e.pointerType === 'touch' && !quelle.classList.contains('trikot')) return;
  gezogen = {
    id: quelle.dataset.spieler, x: e.clientX, y: e.clientY, quelle, geist: null, ziel: null,
  };
}

document.addEventListener('pointermove', (e) => {
  if (!gezogen) return;
  if (!gezogen.geist) {
    if (Math.hypot(e.clientX - gezogen.x, e.clientY - gezogen.y) < 6) return;
    const s = spielerVon(gezogen.id);
    gezogen.geist = document.createElement('div');
    gezogen.geist.className = 'geist';
    gezogen.geist.textContent = `${s.name} · ${rolleText(s)}`;
    document.body.append(gezogen.geist);
    gezogen.quelle.classList.add('wird-gezogen');
  }
  gezogen.geist.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 10}px)`;
  const ziel = zielUnter(e.clientX, e.clientY);
  if (ziel !== gezogen.ziel) {
    gezogen.ziel?.classList.remove('ziel');
    ziel?.classList.add('ziel');
    gezogen.ziel = ziel;
  }
});

function ziehenEnden(e) {
  if (!gezogen) return;
  const {
    id, geist, quelle, ziel,
  } = gezogen;
  gezogen = null;
  if (!geist) return;
  geist.remove();
  quelle.classList.remove('wird-gezogen');
  ziel?.classList.remove('ziel');
  // Der Klick, den der Browser nach dem Loslassen schickt, ist kein Klick.
  klickSchlucken = true;
  setTimeout(() => { klickSchlucken = false; }, 0);
  if (!ziel || e.type === 'pointercancel') return;
  if (ziel.dataset.platz !== undefined) aufPlatz(id, Number(ziel.dataset.platz));
  else if (lage.elfLokal.includes(id)) tauschen(id);
}

document.addEventListener('pointerup', ziehenEnden);
document.addEventListener('pointercancel', ziehenEnden);

export function blattMannschaft() {
  const { stand } = lage;
  const elfLokal = lage.elfLokal;
  const v = stand.verein;
  const merk = v.aufstellung;
  const plaetze = plaetzeJetzt();
  const gleich = merk && merk.system === v.taktik.system && merk.ids.length === elfLokal.length && merk.ids.every((id, i) => id === elfLokal[i]);
  const vonHand = !merk && elfLokal.join() !== besteElf().join();
  const status = gleich ? '<span class="gut">abgegeben · gilt bis zum Widerruf</span>'
    : merk || vonHand ? '<span class="schlecht">geändert, noch nicht abgegeben</span>'
      : '<span class="leise">keine feste Elf · vor jedem Spiel stellt der Rechner die beste</span>';

  // Je Mannschaftsteil eine Reihe, darin die Plaetze von links nach rechts.
  const reihen = ['ANG', 'MIT', 'ABW', 'TOR']
    .map((teil) => plaetze.map((platz, i) => ({ platz, i })).filter(({ platz }) => TEIL[platz] === teil));
  const platzfeld = ({ platz, i }) => {
    const s = spielerVon(elfLokal[i]);
    if (!s) return `<div class="platzfeld" data-platz="${i}"><span class="platzname">${platz}</span><span class="leer">frei</span></div>`;
    const e = eignung(s, platz);
    return `<div class="platzfeld lage-${platz.toLowerCase()}" data-platz="${i}">
      <span class="platzname">${platz}</span>
      <button class="trikot ${s.kondition < 70 ? 'muede' : ''} ${e < 1 ? 'fremd' : ''}" data-spieler="${s.id}" data-ziehbar
        title="${text(s.name)}, ${rolleText(s)} auf ${platz}: ${Math.round(e * 100)} % · Kondition ${s.kondition}, Moral ${s.moral}">
        <b>${text(s.name.split(' ').at(-1))}</b>
        <span class="bringt ${e < 0.9 ? 'schlecht' : e < 1 ? 'mau' : ''}">${Math.round(s.staerke * e)}${e < 1 ? ` <small>von ${s.staerke}</small>` : ''}</span>
        <span class="wert">${rolleText(s)} · K ${s.kondition}</span>
      </button>
    </div>`;
  };
  const bank = v.spieler.filter((s) => !elfLokal.includes(s.id)).sort(nachPosition);

  inhalt.innerHTML = `
    <div class="zweispalten">
      <section>
        <h2>Aufstellung ${v.taktik.system} <small id="aufstellungStatus">${status}</small></h2>
        <div class="platz">
          ${reihen.map((reihe) => `<div class="reihe-elf">${reihe.map(platzfeld).join('')}</div>`).join('')}
        </div>
        <div class="reihe" style="margin-top:.85rem">
          <label class="feld klein"><span>System</span>
            <select id="system">${stand.systeme.map((s) => `<option${s === v.taktik.system ? ' selected' : ''}>${s}</option>`).join('')}</select>
          </label>
          <button id="besteElf">Beste Elf</button>
          <button id="abgeben" class="haupt">Aufstellung abgeben</button>
          <button id="freigeben" class="leise" ${merk ? '' : 'disabled'}>freigeben</button>
        </div>
        <p class="unterzeile">Ziehe einen Spieler von der Bank auf einen Platz oder von Platz zu Platz - oder klicke ihn an: von der Bank
          kommt er dorthin, wo er am meisten bringt, aus der Elf weicht er dem Besten für seinen Platz. Auf einer fremden Position bringt
          ein Spieler weniger; die Zahl im Trikot ist, was er dort bringt. Eine abgegebene Elf gilt, bis du sie änderst; fällt einer aus,
          rückt auf seinen Platz, wer dort am meisten bringt.</p>

        <div class="regler">
          <label><span>Ausrichtung</span><input type="range" id="ausrichtung" min="1" max="5" value="${v.taktik.ausrichtung}" />
            <span>${text(stand.ausrichtungen[v.taktik.ausrichtung - 1])}</span></label>
          <label><span>Härte</span><input type="range" id="haerte" min="1" max="5" value="${v.taktik.haerte}" /><span>${v.taktik.haerte} / 5</span></label>
          <label><span>Pressing</span><input type="range" id="pressing" min="1" max="5" value="${v.taktik.pressing}" /><span>${v.taktik.pressing} / 5</span></label>
          <label><span>Training</span><input type="range" id="training" min="0" max="100" step="10" value="${v.training}" />
            <span>${v.training < 34 ? 'Kondition' : v.training > 66 ? 'Technik' : 'gemischt'}</span></label>
          <label><span>Schwerpunkt</span>
            <select id="schwerpunkt">${stand.schwerpunkte.map((s) => `<option value="${s}"${s === v.schwerpunkt ? ' selected' : ''}>${SCHWERPUNKTE[s]}</option>`).join('')}</select><span></span></label>
          <label><span>Wechsel</span>
            <select id="wechselregel">
              <option value="auto"${v.wechselregel === 'auto' ? ' selected' : ''}>automatisch</option>
              <option value="verletzung"${v.wechselregel === 'verletzung' ? ' selected' : ''}>nur bei Verletzung</option>
            </select><span></span></label>
        </div>
        <p class="unterzeile">Offensiv öffnet das Spiel für beide Seiten - das hilft dem Stärkeren; Mauern verriegelt es - das hilft dem
          Schwächeren. Pressing stärkt das Mittelfeld und kostet Kondition, geübtes Pressing weniger. Härte stärkt die Abwehr und kostet
          Karten. Training entscheidet zwischen frischen Beinen jede Woche und besseren Spielern zur Winterpause und am Saisonende; ein
          Schwerpunkt kostet davon ein Viertel. Automatisch gewechselt wird nach 60, 70 und 80 Minuten, wer müde ist.</p>

        <div class="karte" id="einstudiert">
          <h2>Eingeübt</h2>
          ${[[`System ${v.taktik.system}`, v.einstudiert.systeme[v.taktik.system] ?? 0], ['Pressing', v.einstudiert.pressing],
    ['Abwehr', v.einstudiert.abwehr], ['Angriff', v.einstudiert.angriff]].map(([name, wert]) => `<div class="uebung" data-uebung="${name.split(' ')[0].toLowerCase()}">
            <span>${text(name)}</span>
            ${balken(Math.round(wert), wert < 40 ? 'tief' : wert < 70 ? 'mittel' : '')}
            <b>${Math.round(wert)} %</b></div>`).join('')}
          <p class="unterzeile">Ein System, das nicht sitzt, kostet bis zu sieben Prozent. Jedes Spiel darin und der Schwerpunkt "System einspielen"
            bringen es näher; was nicht geübt wird, verblasst.</p>
        </div>
      </section>

      <section id="bankBereich">
        <h2>Bank und Tribüne <span class="leise">${bank.length} Spieler</span></h2>
        <div class="tabellenrahmen">
          <table id="bank"><thead><tr><th class="links">Pos</th><th class="links">Spieler</th><th>Alt</th><th>St</th><th>Kon</th><th>Mor</th><th>Note</th></tr></thead>
          <tbody>${bank.map((s) => `<tr data-spieler="${s.id}" data-ziehbar class="bankzeile ${s.bereit ? '' : 'leise'}">
            <td class="links">${rolleText(s)}</td>
            <td class="links">${text(s.name)}${s.ausfall ? ` <small class="schlecht">${text(s.ausfall)}</small>` : ''}</td>
            <td>${s.alter}</td><td><b>${s.staerke}</b></td>
            <td class="${s.kondition < 70 ? 'schlecht' : ''}">${s.kondition}</td><td>${s.moral}</td><td>${note(s.saison.note)}</td>
          </tr>`).join('')}</tbody></table>
        </div>
      </section>
    </div>`;

  alle('[data-spieler]').forEach((el) => el.addEventListener('click', () => {
    if (!klickSchlucken) tauschen(el.dataset.spieler);
  }));
  alle('[data-ziehbar]').forEach((el) => el.addEventListener('pointerdown', ziehenBeginnen));
  $('system').addEventListener('change', async (e) => {
    const system = wertVon(e);
    const daten = await zug('taktik', { system });
    const eingespielt = Math.round(lage.stand.verein.einstudiert.systeme[system] ?? 0);
    if (daten.aufstellungVerworfen) melden(`Die abgegebene Aufstellung passte zum alten System und ist verworfen. ${system} ist zu ${eingespielt} % eingespielt.`);
    else if (daten.ok) melden(`${system} ist zu ${eingespielt} % eingespielt.`);
    lage.elfLokal = besteElf();
    zeichnen();
  });
  $('besteElf').addEventListener('click', () => { lage.elfLokal = besteElf(); zeichnen(); });
  $('abgeben').addEventListener('click', async () => {
    const daten = await zug('aufstellung', { ids: lage.elfLokal, system: lage.stand.verein.taktik.system });
    if (daten.ok) melden('Aufstellung steht - sie gilt bis zum Widerruf.');
    zeichnen();
  });
  $('freigeben').addEventListener('click', async () => {
    const daten = await zug('aufstellung', { frei: true });
    if (daten.ok) {
      lage.elfLokal = besteElf();
      melden('Keine feste Elf mehr - vor jedem Spiel stellt der Rechner die beste.');
    }
    zeichnen();
  });
  for (const regler of ['ausrichtung', 'haerte', 'pressing']) {
    $(regler).addEventListener('change', (e) => zug('taktik', { [regler]: Number(wertVon(e)) }).then(zeichnen));
  }
  $('schwerpunkt').addEventListener('change', (e) => zug('schwerpunkt', { schwerpunkt: wertVon(e) }).then(zeichnen));
  $('training').addEventListener('change', (e) => zug('training', { wert: Number(wertVon(e)) }).then(zeichnen));
  $('wechselregel').addEventListener('change', (e) => zug('wechselregel', { regel: wertVon(e) }).then(zeichnen));
}
