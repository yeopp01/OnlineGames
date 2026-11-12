// Das Ausrollen (fahrplan AC-22): was sich ohne Server pruefen laesst - die
// Einstellungen und das Skript, das dort laufen wird.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { einstellungenLesen, einstellungenPruefen, serverSkript } from './ausrollen.mjs';

const gut = { AUSROLLEN_ZIEL: 'mein-server', AUSROLLEN_ADRESSE: 'https://spiel.example' };

test('fahrplan AC-22: Ziel und Adresse kommen aus der Datei, die Umgebung geht vor', () => {
  const werte = einstellungenLesen('# Kommentar\nAUSROLLEN_ZIEL=aus-der-datei\r\nAUSROLLEN_ADRESSE = https://spiel.example \n', { AUSROLLEN_ZIEL: 'aus-der-umgebung', PATH: '/usr/bin' });
  assert.equal(werte.AUSROLLEN_ZIEL, 'aus-der-umgebung');
  assert.equal(werte.AUSROLLEN_ADRESSE, 'https://spiel.example');
  assert.equal(werte.PATH, undefined);
  const e = einstellungenPruefen(werte);
  assert.deepEqual(e.fehler, []);
  assert.equal(e.rechner, 'spiel.example');
  assert.equal(e.ordner, '/opt/onlinegames');
  assert.equal(e.warten, 30);
});

test('fahrplan AC-22: was in einen Befehl auf dem Server wandert, ist geprueft', () => {
  assert.equal(einstellungenPruefen({}).fehler.length, 2, 'ohne Ziel und Adresse geht nichts');
  for (const boese of ["x'; rm -rf /; '", 'a b', '$(reboot)']) {
    assert.ok(einstellungenPruefen({ ...gut, AUSROLLEN_ZIEL: boese }).fehler.length, `Ziel ${boese}`);
    assert.ok(einstellungenPruefen({ ...gut, AUSROLLEN_ORDNER: `/opt/${boese}` }).fehler.length, `Ordner ${boese}`);
    assert.ok(einstellungenPruefen({ ...gut, AUSROLLEN_ADRESSE: `https://${boese}` }).fehler.length, `Adresse ${boese}`);
  }
  assert.ok(einstellungenPruefen({ ...gut, AUSROLLEN_ADRESSE: 'http://spiel.example' }).fehler.length, 'nur https');
  assert.ok(einstellungenPruefen({ ...gut, AUSROLLEN_ADRESSE: 'https://spiel.example/pfad' }).fehler.length, 'ohne Pfad');
});

test('fahrplan AC-22: das Skript fuer den Server wartet auf leere Raeume, sichert die Konten und meldet, ob der Dienst laeuft', () => {
  const e = einstellungenPruefen(gut);
  const skript = serverSkript({ ...e, stand: 'abc1234567', sofort: false });
  assert.ok(!skript.includes('\r'), 'keine Windows-Zeilenenden - bash stolpert darueber');
  const stelle = (text) => {
    const wo = skript.indexOf(text);
    assert.ok(wo >= 0, `im Skript fehlt: ${text}`);
    return wo;
  };
  // Die Reihenfolge ist die Zusage: erst bauen, dann warten, dann sichern,
  // dann starten - gewartet wird also nicht mit einem angehaltenen Dienst.
  const bauen = stelle('docker build');
  const warten = stelle('/betrieb/zahlen');
  const sichern = stelle('cp -a daten/.');
  const starten = stelle('docker compose up -d');
  const melden = stelle('echo "LAEUFT $STAND"');
  assert.ok(bauen < warten && warten < sichern && sichern < starten && starten < melden);
  assert.match(skript, /^STAND='abc1234567'$/m);
  assert.match(skript, /^chmod 700 daten$/m, 'die Konten liest auf der Maschine sonst niemand');
  assert.match(skript, /^SOFORT='0'$/m);
  assert.match(serverSkript({ ...e, stand: 'abc1234567', sofort: true }), /^SOFORT='1'$/m);

  // Liest bash es ueberhaupt? Wo es kein bash gibt, bleibt das ungeprueft.
  // Unter Windows kann "bash" auch der Starter von WSL sein - der zaehlt nicht.
  const da = spawnSync('bash', ['--version'], { encoding: 'utf8' });
  if (!da.error && da.status === 0 && /GNU bash/.test(da.stdout)) {
    const bash = spawnSync('bash', ['-n'], { input: skript, encoding: 'utf8' });
    assert.equal(bash.status, 0, bash.stderr);
  }
});
