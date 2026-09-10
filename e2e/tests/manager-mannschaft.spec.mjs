// Aufstellung, Taktik und Training, im Browser gesehen
// (→ specs/15-manager/aufstellung.md, bedienung.md).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import {
  ANMELDUNG, aufBlatt, expect, griff, karriereBeginnen, tempo, test, weiter,
} from '../helpers/seite.mjs';

const SPEC = '15-manager/aufstellung.md';
const BEDIENUNG = '15-manager/bedienung.md';

test.use({ storageState: ANMELDUNG });

const elf = (page) => page.locator('.trikot').evaluateAll((t) => t.map((x) => x.dataset.spieler));

test('oberflaeche AC-2: ein Klick tauscht einen Spieler', async ({ page }, info) => {
  await karriereBeginnen(page);
  await aufBlatt(page, 'mannschaft');
  expect(await elf(page)).toHaveLength(11);
  const bank = page.locator('#bank tbody tr[data-spieler]:not(.leise)').first();
  const rein = await bank.getAttribute('data-spieler');
  await bank.click();
  await expect.poll(() => elf(page)).toContain(rein);
  expect(await elf(page)).toHaveLength(11);
  await expect(page.locator('#aufstellungStatus')).toContainText('noch nicht abgegeben');
  await nachweis(page, {
    spec: BEDIENUNG,
    ac: 'AC-2',
    titel: 'Ein Spieler von der Bank steht nach einem Klick in der Elf, die Aenderung ist noch nicht abgegeben',
    test: info,
  });
});

test('oberflaeche AC-3: die Aufstellung ist ein Spielfeld', async ({ page }, info) => {
  await karriereBeginnen(page);
  await aufBlatt(page, 'mannschaft');
  const reihen = page.locator('.reihe-elf');
  await expect(reihen).toHaveCount(4);
  expect(await reihen.evaluateAll((r) => r.map((x) => x.children.length))).toEqual([2, 4, 4, 1]);
  const oben = await reihen.evaluateAll((r) => r.map((x) => x.getBoundingClientRect().top));
  for (let i = 1; i < oben.length; i++) expect(oben[i]).toBeGreaterThan(oben[i - 1]);
  const zeilen = (await page.locator('.trikot').first().innerText()).split('\n').filter(Boolean);
  expect(zeilen).toHaveLength(3);
  await nachweis(page, {
    spec: BEDIENUNG,
    ac: 'AC-3',
    titel: 'Die Elf als Spielfeld in vier Reihen, daneben Bank und Tribuene',
    test: info,
  });
});

test('aufstellung AC-7: ein Systemwechsel verwirft die Aufstellung', async ({ page }, info) => {
  await karriereBeginnen(page);
  await aufBlatt(page, 'mannschaft');
  await page.locator('#abgeben').click();
  await expect(page.locator('#aufstellungStatus')).toContainText('abgegeben · gilt bis zum Widerruf');
  await page.locator('#system').selectOption('4-3-3');
  await expect(page.locator('#meldung')).toContainText('verworfen');
  await expect(page.locator('#aufstellungStatus')).toContainText('keine feste Elf');
  await expect(page.locator('.reihe-elf').first().locator('.trikot')).toHaveCount(3);
  await nachweis(page, {
    spec: SPEC,
    ac: 'AC-7',
    titel: 'Nach dem Wechsel auf 4-3-3 gilt die abgegebene Aufstellung nicht mehr',
    test: info,
  });
});

test('aufstellung AC-8: drei Regler, eins bis fuenf', async ({ page }, info) => {
  await karriereBeginnen(page);
  await aufBlatt(page, 'mannschaft');
  await expect(page.locator('#system option')).toHaveCount(5);
  await page.locator('#haerte').fill('5');
  await expect(page.locator('.regler label:has(#haerte)')).toContainText('5 / 5');
  await page.locator('#pressing').fill('1');
  await expect(page.locator('.regler label:has(#pressing)')).toContainText('1 / 5');
  await nachweis(page, {
    spec: SPEC,
    ac: 'AC-8',
    titel: 'System, Haerte und Pressing - Haerte auf fuenf, Pressing auf eins gestellt',
    test: info,
  });
});

test('aufstellung AC-10: ein Regler zwischen Kondition und Entwicklung', async ({ page }, info) => {
  await karriereBeginnen(page);
  await aufBlatt(page, 'mannschaft');
  const training = page.locator('.regler label:has(#training)');
  await page.locator('#training').fill('0');
  await expect(training).toContainText('Kondition');
  await page.locator('#training').fill('100');
  await expect(training).toContainText('Technik');
  await nachweis(page, {
    spec: SPEC,
    ac: 'AC-10',
    titel: 'Der Trainingsregler ganz auf Technik - beides zugleich geht nicht',
    test: info,
  });
});

test('aufstellung AC-16: die Wechselregel bleibt eingestellt', async ({ page }, info) => {
  await karriereBeginnen(page);
  await aufBlatt(page, 'mannschaft');
  const antwort = page.waitForResponse((r) => r.url().endsWith('/wechselregel'));
  await page.locator('#wechselregel').selectOption('verletzung');
  expect((await antwort).ok()).toBe(true);
  await page.reload();
  await page.locator('[data-fortsetzen]').first().click();
  await aufBlatt(page, 'mannschaft');
  await expect(page.locator('#wechselregel')).toHaveValue('verletzung');
  await nachweis(page, {
    spec: SPEC,
    ac: 'AC-16',
    titel: 'Die Wechselregel steht nach dem Neuladen auf nur bei Verletzung',
    test: info,
  });
});

test('aufstellung AC-14: die Elf gilt bis zum Widerruf', async ({ page }, info) => {
  await karriereBeginnen(page);
  await aufBlatt(page, 'mannschaft');
  await page.locator('#system').selectOption('4-3-3');
  await page.locator('#abgeben').click();
  await expect(page.locator('#aufstellungStatus')).toContainText('abgegeben');
  await tempo(page, 0);
  await weiter(page);
  await weiter(page);
  await weiter(page);
  await aufBlatt(page, 'mannschaft');
  await expect(page.locator('#aufstellungStatus')).toContainText('abgegeben · gilt bis zum Widerruf');
  await expect(page.locator('#system')).toHaveValue('4-3-3');
  await nachweis(page, {
    spec: SPEC,
    ac: 'AC-14',
    titel: 'Nach zwei Spieltagen steht die abgegebene 4-3-3-Elf noch - sie gilt bis zum Widerruf',
    test: info,
  });
});

test('aufstellung AC-21: Ausrichtung, Schwerpunkt und was eingeuebt ist', async ({ page }, info) => {
  await karriereBeginnen(page);
  await aufBlatt(page, 'mannschaft');
  const pressing = () => page.locator('#einstudiert [data-uebung="pressing"] b').textContent();
  const vorher = await pressing();

  await page.locator('#ausrichtung').fill('5');
  await expect(page.locator('.regler label:has(#ausrichtung)')).toContainText('Offensiv');
  const antwort = page.waitForResponse((r) => r.url().endsWith('/schwerpunkt'));
  await page.locator('#schwerpunkt').selectOption('pressing');
  expect((await antwort).ok()).toBe(true);

  await tempo(page, 0);
  await weiter(page);
  await weiter(page);
  await aufBlatt(page, 'mannschaft');
  await expect(page.locator('#schwerpunkt')).toHaveValue('pressing');
  expect(Number.parseInt(await pressing(), 10)).toBeGreaterThan(Number.parseInt(vorher, 10));
  await expect(page.locator('#einstudiert [data-uebung="system"]')).toContainText('System 4-4-2');
  await nachweis(page, {
    spec: SPEC,
    ac: 'AC-21',
    titel: 'Offensiv eingestellt, Pressing als Schwerpunkt - nach zwei Wochen sitzt das Pressing besser',
    test: info,
    ganzeSeite: true,
  });
});

test('aufstellung AC-25, aufstellung AC-22 und aufstellung AC-23: Spieler auf Plaetze ziehen', async ({ page }, info) => {
  await karriereBeginnen(page);
  await aufBlatt(page, 'mannschaft');
  const platz = (i) => page.locator(`.platzfeld[data-platz="${i}"]`);
  const wer = (i) => platz(i).locator('.trikot').getAttribute('data-spieler');
  const ziehen = async (quelle, ziel) => {
    const von = await quelle.boundingBox();
    const nach = await ziel.boundingBox();
    await page.mouse.move(von.x + von.width / 2, von.y + von.height / 2);
    await page.mouse.down();
    await page.mouse.move(nach.x + nach.width / 2, nach.y + nach.height / 2, { steps: 8 });
    await page.mouse.up();
  };

  // Elf Plaetze mit Namen, im 4-4-2 von hinten nach vorn.
  await expect(page.locator('.platzname')).toHaveText(['ST', 'ST', 'LM', 'ZM', 'ZM', 'RM', 'LV', 'IV', 'IV', 'RV', 'TW']);
  await nachweis(page, {
    spec: '15-manager/aufstellung.md',
    ac: 'AC-22',
    titel: 'Das Spielfeld im 4-4-2 mit elf benannten Plaetzen, jedes Trikot mit Stammposition und Kondition',
    test: info,
  });

  // Von Platz zu Platz: der Linksverteidiger tauscht mit einem Stuermer.
  const lv = await wer(1);
  const st = await wer(9);
  await ziehen(platz(1).locator('.trikot'), platz(9));
  await expect(platz(9).locator('.trikot')).toHaveAttribute('data-spieler', lv);
  await expect(platz(1).locator('.trikot')).toHaveAttribute('data-spieler', st);
  // Auf fremder Position zeigt das Trikot, was er dort bringt - und von wie viel.
  await expect(platz(9).locator('.trikot .bringt')).toContainText('von');
  await expect(platz(1).locator('.trikot .bringt')).toContainText('von');
  await nachweis(page, {
    spec: '15-manager/aufstellung.md',
    ac: 'AC-23',
    titel: 'Verteidiger im Sturm, Stuermer in der Abwehr: beide Trikots zeigen, wie viel weniger sie dort bringen',
    test: info,
  });

  // Von der Bank auf einen Platz.
  const bank = page.locator('#bank tbody tr[data-spieler]:not(.leise)', { hasNot: page.locator('td', { hasText: /^TW/ }) }).first();
  const rein = await bank.getAttribute('data-spieler');
  await ziehen(bank, platz(6));
  await expect(platz(6).locator('.trikot')).toHaveAttribute('data-spieler', rein);
  await expect(page.locator('#aufstellungStatus')).toContainText('noch nicht abgegeben');
  await nachweis(page, {
    spec: '15-manager/aufstellung.md',
    ac: 'AC-25',
    titel: 'Ein Spieler von der Bank auf einen Platz gezogen, zwei andere haben die Plaetze getauscht - noch nicht abgegeben',
    test: info,
  });

  // Ein Feldspieler ins Tor: abgewiesen, mit einem Satz.
  await ziehen(platz(6).locator('.trikot'), platz(0));
  await expect(page.locator('#meldung')).toContainText('Torwart');
  await expect(platz(6).locator('.trikot')).toHaveAttribute('data-spieler', rein);

  // Abgeben: der Server nimmt die Elf mit fremden Positionen an, Platz fuer Platz.
  const antwort = page.waitForResponse((r) => r.url().endsWith('/aufstellung'));
  await page.locator('#abgeben').click();
  expect((await antwort).ok()).toBe(true);
  await expect(page.locator('#aufstellungStatus')).toContainText('abgegeben · gilt bis zum Widerruf');
  await expect(platz(9).locator('.trikot')).toHaveAttribute('data-spieler', lv);
});

test('aufstellung AC-4: Ausfaelle lassen sich nicht aufstellen', async ({ page }, info) => {
  await karriereBeginnen(page);
  await griff(page, 'verletzen', { position: 'MIT', wochen: 3 });
  await aufBlatt(page, 'mannschaft');
  const ausfall = page.locator('#bank tbody tr[data-spieler]:has(small.schlecht)').first();
  await expect(ausfall).toContainText('verletzt, noch 3 Wochen');
  await ausfall.click();
  const meldung = page.locator('#meldung');
  await expect(meldung).toBeVisible();
  await expect(meldung).toHaveClass(/schlimm/);
  await expect(meldung).toContainText('verletzt, noch 3 Wochen');
  await nachweis(page, {
    spec: SPEC,
    ac: 'AC-4',
    titel: 'Ein verletzter Spieler wird beim Einwechseln abgewiesen, mit Grund und Dauer',
    test: info,
  });
});
