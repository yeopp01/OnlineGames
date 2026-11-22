// Das eigene Spiel live im Bild: Tafel, Band, Ticker und Tempo, Eingreifen,
// die Kabine zur Halbzeit (→ specs/15-manager/bedienung.md AC-19 bis AC-21).
// Gespielt wird auf 1366 x 768 - dort muss die Kabine ganz zu sehen sein.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import {
  ANMELDUNG, expect, karriereBeginnen, tempo, test, weiter,
} from '../helpers/seite.mjs';

const BEDIENUNG = '15-manager/bedienung.md';
const LAPTOP = { width: 1366, height: 768 };

/** Die Minute, die die Uhr der Tafel zeigt - 0 vor dem Anpfiff und in der Kabine. */
const minuteAufDerUhr = async (page) => Number((await page.locator('#liveUhr b').textContent().catch(() => '0'))?.match(/\d+/)?.[0] ?? 0);

/** Bis vor das erste Ligaspiel: die Saison beginnen, dann steht Spieltag 1 an. */
async function vorDemErstenSpiel(page) {
  await page.setViewportSize(LAPTOP);
  await karriereBeginnen(page);
  await tempo(page, 0);
  await weiter(page);
  await expect(page.locator('#live')).toBeVisible();
}

async function anpfeifen(page) {
  const antwort = page.waitForResponse((r) => r.url().endsWith('/anpfeifen'));
  await page.locator('#live').click();
  expect((await antwort).ok()).toBe(true);
  await expect(page.locator('#liveTafel')).toBeVisible();
}

const tempoWaehlen = (page, name) => page.locator(`#liveTempo [data-tempo="${name}"]`).click();

/** Einer vom Platz und einer von der Bank, beide keine Torhueter. */
async function wechselPaar(page) {
  return page.evaluate(() => {
    const feldspieler = (wahl) => [...document.querySelectorAll(wahl)]
      .filter((k) => k.closest('tr').querySelector('td').textContent.trim() !== 'TW' && k.closest('tr').querySelector('td').textContent.trim() !== 'TOR')
      .map((k) => /** @type {HTMLElement} */ (k).dataset.raus || /** @type {HTMLElement} */ (k).dataset.rein);
    return { raus: feldspieler('[data-raus]'), rein: feldspieler('[data-rein]') };
  });
}

test.describe('Das Spiel live', () => {
  test.use({ storageState: ANMELDUNG });

  test('oberflaeche AC-19: Tafel, Band und Ticker laufen, Sofort rechnet wie Weiter', async ({ page }, info) => {
    test.setTimeout(180_000);

    // Zum Vergleich: dasselbe Spiel mit "Weiter" gerechnet.
    await vorDemErstenSpiel(page);
    await weiter(page);
    const gerechnet = (await page.locator('#standAnzeige').textContent()).trim();

    await vorDemErstenSpiel(page);
    await expect(page.locator('#live')).toHaveText('Live spielen');
    await anpfeifen(page);

    // Die Tafel: beide Vereine, Stand und Uhr; Kopf und Reiter sind weg.
    await expect(page.locator('#liveTafel .seite.heim .verein')).not.toBeEmpty();
    await expect(page.locator('#liveTafel .seite.gast .verein')).not.toBeEmpty();
    await expect(page.locator('#liveTorHeim')).toHaveText('0');
    await expect(page.locator('.kopf')).toBeHidden();
    // Normal ist vorgewaehlt, Sofort, Schnell und Pause stehen daneben.
    await expect(page.locator('#liveTempo [data-tempo="normal"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#liveTempo button')).toHaveText(['Pause', 'Normal', 'Schnell', 'Sofort']);

    // Normal: rund eine Sekunde je Minute.
    await expect.poll(() => minuteAufDerUhr(page), { timeout: 10_000 }).toBeGreaterThanOrEqual(3);
    const normal = await minuteAufDerUhr(page);
    await page.waitForTimeout(2000);
    const nachZwei = await minuteAufDerUhr(page);
    expect(nachZwei - normal).toBeGreaterThanOrEqual(1);
    expect(nachZwei - normal).toBeLessThanOrEqual(3);

    // Schnell bis in die zweite Hälfte - die Kabine haelt dazwischen an.
    await tempoWaehlen(page, 'schnell');
    await expect(page.locator('#liveKabine')).toBeVisible({ timeout: 30_000 });
    await page.locator('#liveZweite').click();
    await expect.poll(() => minuteAufDerUhr(page), { timeout: 30_000 }).toBeGreaterThanOrEqual(62);

    // Pause: die Uhr steht.
    await tempoWaehlen(page, 'pause');
    const steht = await minuteAufDerUhr(page);
    await page.waitForTimeout(1500);
    expect(await minuteAufDerUhr(page)).toBe(steht);
    await expect(page.locator('#liveTempo [data-tempo="pause"]')).toHaveAttribute('aria-pressed', 'true');

    // Das Band: ein Abschnitt je fuenf Minuten bis zur gezeigten, die uebrigen offen.
    const band = await page.evaluate(() => ({
      alle: document.querySelectorAll('#liveBand .abschnitt').length,
      gefuellt: document.querySelectorAll('#liveBand .abschnitt:not(.offen)').length,
    }));
    expect(band.alle).toBe(18);
    expect(band.gefuellt).toBe(Math.floor(steht / 5));
    // Der Ticker: Szene fuer Szene, mit dem Satz vom Server, die juengste oben.
    const minuten = await page.locator('#liveZeilen li .minute').allTextContents();
    const zahlen = minuten.map((m) => Number.parseInt(m, 10)).filter(Number.isFinite);
    expect(zahlen.length).toBeGreaterThan(4);
    expect(zahlen).toEqual([...zahlen].sort((a, b) => b - a));
    expect(Math.max(...zahlen)).toBeLessThanOrEqual(steht);

    await page.mouse.move(5, 760);
    await nachweis(page, {
      spec: BEDIENUNG,
      ac: 'AC-19',
      titel: 'Das erste Ligaspiel live in der zweiten Haelfte, angehalten: oben die Tafel mit Stand und Uhr, darunter das Band mit den Abschnitten bis zur Minute, links der Ticker, unten das Tempo',
      test: info,
    });

    // Sofort: bis zum Abpfiff, und das Ergebnis ist dasselbe wie mit Weiter.
    await tempoWaehlen(page, 'sofort');
    await expect(page.locator('#liveUhr')).toContainText('Abpfiff');
    const live = `${await page.locator('#liveTorHeim').textContent()} : ${await page.locator('#liveTorGast').textContent()}`;
    expect(live).toBe(gerechnet);

    // Jedes Tor steht im Band mit Minute und Schuetze.
    const tore = await page.locator('#liveZeilen li.tor').count();
    const namen = await page.locator('#liveBand .torname').allTextContents();
    expect(namen.join('\n').split('\n').filter((n) => /^\d+\. \S/.test(n)).length).toBe(tore);
    expect(await page.locator('#liveBand .abschnitt .tor').count()).toBe(tore);

    // Danach der Bericht, wie nach Weiter - und der Kopf ist wieder da.
    await page.locator('#liveBericht').click();
    await expect(page.locator('.kopf')).toBeVisible();
    await expect(page.locator('#standAnzeige')).toHaveText(gerechnet);
  });

  test('oberflaeche AC-20: wechseln und umstellen im laufenden Spiel', async ({ page }, info) => {
    test.setTimeout(120_000);
    await vorDemErstenSpiel(page);
    await anpfeifen(page);

    // Vor dem Anpfiff weist der Server einen Wechsel ab - der Grund steht im Bild.
    await tempoWaehlen(page, 'pause');
    let paar = await wechselPaar(page);
    await page.locator(`[data-raus="${paar.raus.at(-1)}"]`).click();
    await expect(page.locator(`tr.gewaehlt [data-raus="${paar.raus.at(-1)}"]`)).toBeVisible();
    await page.locator(`[data-rein="${paar.rein[0]}"]`).click();
    await expect(page.locator('#liveGrund')).toHaveText('Gewechselt wird erst nach dem Anpfiff.');

    await tempoWaehlen(page, 'schnell');
    await expect.poll(() => minuteAufDerUhr(page), { timeout: 20_000 }).toBeGreaterThanOrEqual(12);
    await tempoWaehlen(page, 'pause');

    // Umstellen im stehenden Spiel: wirkt ab der Minute nach der gerechneten.
    const ab = Number((await page.locator('#liveAb b').textContent()).match(/\d+/)[0]);
    await page.locator('[data-regler="ausrichtung"][data-wert="5"]').click();
    await expect(page.locator('[data-regler="ausrichtung"][data-wert="5"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#liveGeaendert li').first()).toContainText(`wirkt ab Minute ${ab}`);
    await page.locator('[data-regler="haerte"][data-wert="4"]').click();
    await page.locator('[data-regler="pressing"][data-wert="2"]').click();
    await expect(page.locator('[data-regler="pressing"][data-wert="2"]')).toHaveAttribute('aria-pressed', 'true');

    // Drei Wechsel gehen, auch waehrend das Spiel laeuft.
    await tempoWaehlen(page, 'normal');
    for (let i = 0; i < 3; i++) {
      paar = await wechselPaar(page);
      const raus = paar.raus.at(-1);
      await page.locator(`[data-raus="${raus}"]`).click();
      await expect(page.locator(`tr.gewaehlt [data-raus="${raus}"]`)).toBeVisible();
      await page.locator(`[data-rein="${paar.rein[0]}"]`).click();
      await expect(page.locator(`[data-raus="${raus}"]`)).toHaveCount(0);
      await expect(page.locator('#liveAb')).toContainText(`${i + 1} von 3 Wechseln`);
    }
    // Der vierte nicht.
    await tempoWaehlen(page, 'pause');
    paar = await wechselPaar(page);
    await page.locator(`[data-raus="${paar.raus.at(-1)}"]`).click();
    await expect(page.locator(`tr.gewaehlt [data-raus="${paar.raus.at(-1)}"]`)).toBeVisible();
    await page.locator(`[data-rein="${paar.rein[0]}"]`).click();
    await expect(page.locator('#liveGrund')).toHaveText('Mehr als 3 Wechsel gehen nicht.');
    await expect(page.locator('#liveGeaendert li')).toHaveCount(3);

    await page.mouse.move(5, 760);
    await nachweis(page, {
      spec: BEDIENUNG,
      ac: 'AC-20',
      titel: 'Rechts das Eingreifen im angehaltenen Spiel: Ausrichtung, Haerte und Pressing verstellt, drei Wechsel mit "wirkt ab Minute", der vierte abgewiesen mit dem Grund des Servers',
      test: info,
    });
  });

  test('oberflaeche AC-21: die Halbzeit haelt an, die Kabine steht ganz im Bild', async ({ page }, info) => {
    test.setTimeout(120_000);
    await vorDemErstenSpiel(page);
    await anpfeifen(page);
    await tempoWaehlen(page, 'schnell');

    // Von selbst angehalten, die Uhr sagt Halbzeit.
    await expect(page.locator('#liveKabine')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#liveUhr')).toHaveText('Halbzeit');
    await page.waitForTimeout(1200);
    await expect(page.locator('#liveKabine')).toBeVisible();
    await expect(page.locator('#liveTempo [data-tempo="pause"]')).toHaveAttribute('aria-pressed', 'true');

    // Statistik der ersten Haelfte, drei Ansprachen, und rechts die Wechsel.
    await expect(page.locator('#liveKabine .haelfte dt')).toHaveText(['Chancen', 'Spielanteil', 'Karten']);
    await expect(page.locator('#liveKabine [data-ansprache]')).toHaveCount(3);
    await expect(page.locator('#liveRand [data-rein]').first()).toBeVisible();

    // Auf 1366 x 768 ganz im Bild, ohne zu rollen: weder die Seite noch die
    // rechte Spalte, und die Kabine endet ueber dem Fuss.
    const mass = await page.evaluate(() => {
      const kabine = document.querySelector('#liveKabine').getBoundingClientRect();
      const fuss = document.querySelector('.livefuss').getBoundingClientRect();
      const rand = document.querySelector('#liveRand');
      return {
        seite: document.documentElement.scrollHeight - window.innerHeight,
        rand: rand.scrollHeight - rand.clientHeight,
        kabineUnten: kabine.bottom,
        kabineRechts: kabine.right,
        fussOben: fuss.top,
        breite: window.innerWidth,
      };
    });
    expect(mass.seite).toBeLessThanOrEqual(0);
    expect(mass.rand).toBeLessThanOrEqual(0);
    expect(mass.kabineUnten).toBeLessThanOrEqual(mass.fussOben);
    expect(mass.kabineRechts).toBeLessThanOrEqual(mass.breite);

    // Die Zeile "Halbzeit" ist leiser als ein Tor: kleiner, duenner, in Grau.
    const halbzeit = page.locator('#liveZeilen li.ruhezeile', { hasText: 'Halbzeit' });
    await expect(halbzeit).toHaveCount(1);
    const stil = await page.evaluate(() => {
      const probe = document.createElement('li');
      probe.className = 'tor heim';
      probe.innerHTML = '<span class="minute">1.</span><span class="art">Tor</span><p>Probe</p>';
      document.querySelector('#liveZeilen').append(probe);
      const lesen = (el) => {
        const s = getComputedStyle(el.querySelector('p'));
        return { groesse: parseFloat(s.fontSize), gewicht: Number(s.fontWeight), farbe: s.color };
      };
      const ergebnis = {
        tor: lesen(probe),
        halbzeit: lesen([...document.querySelectorAll('#liveZeilen li.ruhezeile')].find((li) => li.textContent.includes('Halbzeit'))),
      };
      probe.remove();
      return ergebnis;
    });
    expect(stil.halbzeit.groesse).toBeLessThan(stil.tor.groesse);
    expect(stil.halbzeit.gewicht).toBeLessThan(stil.tor.gewicht);
    expect(stil.halbzeit.farbe).not.toBe(stil.tor.farbe);

    await page.mouse.move(5, 760);
    await nachweis(page, {
      spec: BEDIENUNG,
      ac: 'AC-21',
      titel: 'Halbzeit auf 1366 x 768: die Kabine mit drei Ansprachen und der Statistik der ersten Haelfte, rechts Platz und Bank zum Wechseln, nichts rollt',
      test: info,
    });

    // Eine Ansprache, dann geht es weiter.
    await page.locator('[data-ansprache="laut"]').click();
    await expect(page.locator('[data-ansprache="laut"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-ansprache="ruhig"]')).toBeDisabled();
    await page.locator('#liveZweite').click();
    await expect(page.locator('#liveKabine')).toBeHidden();
    await expect.poll(() => minuteAufDerUhr(page), { timeout: 20_000 }).toBeGreaterThan(45);
  });

  test('oberflaeche AC-22: der Verein faerbt Kopf, Tafel und Band', async ({ page }, info) => {
    test.setTimeout(120_000);
    const rgb = (hex) => {
      const n = parseInt(hex.slice(1), 16);
      return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
    };
    const grund = (wahl) => page.locator(wahl).first().evaluate((el) => getComputedStyle(el).backgroundColor);

    // Der Kopf in den Farben, die der Server fuer den eigenen Verein nennt.
    await page.setViewportSize(LAPTOP);
    await karriereBeginnen(page);
    await tempo(page, 0);
    const saisonstart = page.waitForResponse((r) => r.url().endsWith('/weiter'));
    await weiter(page);
    const { farben } = (await (await saisonstart).json()).zustand.verein;
    expect(farben.eins).toMatch(/^#[0-9a-f]{6}$/);
    expect(await grund('.kopf')).toBe(rgb(farben.eins));
    await page.mouse.move(5, 760);
    await expect.poll(() => grund('#weiter')).toBe(rgb(farben.zwei));
    expect(await page.locator('#weiter').evaluate((el) => getComputedStyle(el).color)).toBe(rgb(farben.schriftZwei));
    await page.mouse.move(5, 760);
    await nachweis(page, {
      spec: BEDIENUNG,
      ac: 'AC-22',
      titel: 'Vor dem ersten Ligaspiel: der Kopf in der ersten Farbe des eigenen Vereins, der Knopf Weiter in der zweiten mit dunkler Schrift',
      test: info,
    });

    // Die Tafel und das Band: beide Vereine in ihren Trikots.
    const anpfiff = page.waitForResponse((r) => r.url().endsWith('/anpfeifen'));
    await page.locator('#live').click();
    const { laufend } = (await (await anpfiff).json()).zustand;
    const eigen = laufend[laufend.seite];
    expect(eigen.trikot.grund).toBe(farben.eins);
    await expect(page.locator('#liveTafel')).toBeVisible();
    await tempoWaehlen(page, 'schnell');
    await expect.poll(() => minuteAufDerUhr(page), { timeout: 20_000 }).toBeGreaterThanOrEqual(31);
    await tempoWaehlen(page, 'pause');
    for (const seite of ['heim', 'gast']) {
      const t = laufend[seite].trikot;
      expect(await grund(`#liveTafel .seite.${seite}`)).toBe(rgb(t.grund));
      expect(await page.locator(`#liveTafel .seite.${seite}`).evaluate((el) => getComputedStyle(el).color)).toBe(rgb(t.schrift));
      // Das Band liest dieselben Farben; ein Balken steht nur, wo die Seite mehr vom Spiel hatte.
      expect(await page.locator('.live').evaluate((el, s) => getComputedStyle(el).getPropertyValue(`--${s}-1`).trim(), seite)).toBe(t.grund);
      for (const balken of await page.locator(`#liveBand .abschnitt i.${seite}`).all()) {
        expect(await balken.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(rgb(t.grund));
      }
    }
    // Zwei verschiedene Gruende - sonst waere im Band nichts zu unterscheiden.
    expect(laufend.heim.trikot.grund).not.toBe(laufend.gast.trikot.grund);

    await page.mouse.move(5, 760);
    await nachweis(page, {
      spec: BEDIENUNG,
      ac: 'AC-22',
      titel: 'Das erste Ligaspiel in Minute 30: Heim und Gast stehen auf der Tafel und im Band in den zwei Farben ihres Vereins, die der Server aus dem Startwert rechnet',
      test: info,
    });
  });
});
