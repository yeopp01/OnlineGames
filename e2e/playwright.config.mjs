// Playwright fuer die Oberflaeche (→ docs/adr/0010-playwright.md).
//
// Der Browserlauf gehoert NICHT in die CI. Er laeuft oertlich:
//
//   npm run test:e2e        # nur der Browser
//   npm run check:alles     # Browser, danach alles aus npm run check
//
// `npm run check` - und damit die CI - kommt ohne Browser aus. Die Bilder,
// die dieser Lauf schreibt, liegen eingecheckt unter qa/bildnachweise/ und
// werden dort ohne Browser geprueft.
//
// Der Server wird HIER gestartet, nicht vorausgesetzt: es ist derselbe
// `starten()`-Aufruf, den auch die Tests unter tests/ nehmen, mit Konten im
// Arbeitsspeicher (e2e/server.mjs).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';
import { ANMELDUNG } from './helpers/seite.mjs';

// Jeder Lauf legt seine Dauern hier ab; `npm run e2e:laufzeiten` liest sie,
// statt selbst einen ganzen Lauf zu fahren (Rueckschau nach Runde 140).
export const BERICHT = join(dirname(fileURLToPath(import.meta.url)), '.ergebnisse', 'bericht.json');

export const HAFEN = Number(process.env.E2E_HAFEN) || 4191;

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.mjs$/,
  outputDir: './.ergebnisse/lauf',
  timeout: 60_000,
  expect: { timeout: 8_000 },

  // Ein vergessenes .only laesst den Lauf scheitern, statt still den Rest
  // auszulassen.
  forbidOnly: true,
  // Kein Wiederholen. Ein Test, der beim zweiten Mal gruen wird, verbirgt
  // genau das Problem, das er finden soll.
  retries: 0,
  // Nacheinander: alle Tests teilen ein Konto, und ein Konto hat hoechstens
  // fuenf Spielstaende.
  workers: 1,
  reporter: [['list'], ['json', { outputFile: BERICHT }]],

  use: {
    baseURL: `http://localhost:${HAFEN}`,
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    // Bilder gibt es ueber nachweis() am Abnahmekriterium (ADR-0011), nicht
    // als namenlose Anhaenge eines Laufs. Eine Spur bleibt nur bei Fehlschlag.
    screenshot: 'off',
    video: 'off',
    trace: 'retain-on-failure',
  },

  projects: [
    // Einmal anmelden; die Tests des Managerspiels erben die Sitzung.
    { name: 'anmeldung', testDir: '.', testMatch: /anmeldung\.setup\.mjs$/ },
    {
      name: 'chromium',
      dependencies: ['anmeldung'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 950 } },
      metadata: { anmeldung: ANMELDUNG },
    },
  ],

  webServer: {
    command: 'node server.mjs',
    url: `http://localhost:${HAFEN}/manager.html`,
    env: { E2E_HAFEN: String(HAFEN) },
    // Immer frisch: ein liegengebliebener Server wuerde alten Code pruefen.
    reuseExistingServer: false,
    timeout: 30_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
