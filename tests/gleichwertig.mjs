// Zwei Werte Wert fuer Wert vergleichen (speichern AC-2, ADR-0017) - fuer
// Spielstaende, in denen `Map`, `Set`, Bytefelder und geteilte Dinge stehen.
//
// Warum nicht die Bytes: `v8.serialize` schreibt dieselbe Zahl einmal als
// ganze Zahl und einmal als Kommazahl, je nachdem, wie V8 sie gerade haelt,
// und ein leeres Feld frisch angelegt anders als frisch gelesen. Ein Stand,
// geladen und wieder gesichert, ist deshalb Wert fuer Wert gleich, aber nicht
// Byte fuer Byte - erst ab dem zweiten Laden auch das (gemessen 2026-11-22).
//
// Und warum nicht `assert.deepStrictEqual`: der prueft nicht, dass zwei
// Stellen, die im einen Wert auf **dasselbe** Ding zeigen, es auch im anderen
// tun (Verbuendete teilen ein Sichtfeld). Hier wird jedes Ding des einen
// Werts genau einem des anderen zugeordnet; zeigt eine Stelle im einen auf
// ein schon gesehenes Ding, muss sie im anderen auf dessen Gegenstueck zeigen.

const art = (wert) => (wert === null ? 'null' : Array.isArray(wert) ? 'Array' : typeof wert === 'object' ? Object.getPrototypeOf(wert)?.constructor?.name ?? 'ohne Vorbild' : typeof wert);

/**
 * Die Stellen, an denen sich `a` und `b` unterscheiden - leer heisst gleich.
 * @param {unknown} a
 * @param {unknown} b
 * @param {number} [hoechstens] so viele Stellen, dann hoert der Vergleich auf
 * @returns {string[]}
 */
export function unterschiede(a, b, hoechstens = 10) {
  const raus = [];
  const zuB = new Map();
  const zuA = new Map();
  const melden = (pfad, text) => raus.push(`${pfad || '(Wurzel)'}: ${text}`);
  const kurz = (wert) => {
    const text = typeof wert === 'string' ? JSON.stringify(wert) : String(wert);
    return text.length > 40 ? `${text.slice(0, 40)}…` : text;
  };

  function vergleich(x, y, pfad) {
    if (raus.length >= hoechstens) return;
    if (typeof x === 'function' || typeof y === 'function') return melden(pfad, 'eine Funktion');
    if (x === null || y === null || typeof x !== 'object' || typeof y !== 'object') {
      if (!Object.is(x, y)) melden(pfad, `${kurz(x)} statt ${kurz(y)}`);
      return;
    }
    // Dasselbe Ding an zwei Stellen: im anderen Wert ebenso.
    if (zuB.has(x) || zuA.has(y)) {
      if (zuB.get(x) !== y || zuA.get(y) !== x) melden(pfad, 'geteilt im einen Wert, nicht im anderen');
      return;
    }
    zuB.set(x, y);
    zuA.set(y, x);
    if (art(x) !== art(y)) return melden(pfad, `${art(x)} statt ${art(y)}`);
    if (ArrayBuffer.isView(x)) {
      const bx = Buffer.from(x.buffer, x.byteOffset, x.byteLength);
      const by = Buffer.from(/** @type {ArrayBufferView} */ (y).buffer, /** @type {ArrayBufferView} */ (y).byteOffset, /** @type {ArrayBufferView} */ (y).byteLength);
      if (!bx.equals(by)) melden(pfad, `Bytefeld ungleich (${bx.length} und ${by.length} Bytes)`);
      return;
    }
    if (x instanceof Map) {
      const kx = [...x.keys()];
      const ky = [...y.keys()];
      if (kx.length !== ky.length) melden(pfad, `${kx.length} statt ${ky.length} Eintraege`);
      for (let i = 0; i < Math.min(kx.length, ky.length); i++) {
        if (typeof kx[i] === 'object' && kx[i] !== null) vergleich(kx[i], ky[i], `${pfad}<${i}>`);
        else if (!Object.is(kx[i], ky[i])) return melden(pfad, `Schluessel ${kurz(kx[i])} statt ${kurz(ky[i])} an Stelle ${i}`);
        vergleich(x.get(kx[i]), y.get(ky[i]), `${pfad}[${kurz(kx[i])}]`);
      }
      return;
    }
    if (x instanceof Set) {
      const lx = [...x];
      const ly = [...y];
      if (lx.length !== ly.length) melden(pfad, `${lx.length} statt ${ly.length} Eintraege`);
      for (let i = 0; i < Math.min(lx.length, ly.length); i++) vergleich(lx[i], ly[i], `${pfad}{${i}}`);
      return;
    }
    if (Array.isArray(x)) {
      if (x.length !== y.length) melden(pfad, `Laenge ${x.length} statt ${y.length}`);
      for (let i = 0; i < Math.min(x.length, y.length); i++) {
        if ((i in x) !== (i in y)) melden(`${pfad}[${i}]`, 'Luecke im einen, Wert im anderen');
        else vergleich(x[i], y[i], `${pfad}[${i}]`);
      }
      return;
    }
    const fx = Object.keys(x);
    const fy = Object.keys(y);
    const fehlt = fy.filter((f) => !Object.hasOwn(x, f));
    const extra = fx.filter((f) => !Object.hasOwn(y, f));
    if (fehlt.length || extra.length) melden(pfad, `Felder nur links: ${extra.join(', ') || '-'}; nur rechts: ${fehlt.join(', ') || '-'}`);
    else if (fx.join() !== fy.join()) melden(pfad, 'dieselben Felder in anderer Reihenfolge');
    for (const f of fx) if (Object.hasOwn(y, f)) vergleich(x[f], y[f], pfad ? `${pfad}.${f}` : f);
  }

  vergleich(a, b, '');
  return raus;
}
