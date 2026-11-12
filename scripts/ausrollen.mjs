#!/usr/bin/env node
// Bringt den Stand eines Commits auf den Server (fahrplan AC-22).
//
//   npm run ausrollen                 HEAD
//   npm run ausrollen -- <commit>     ein bestimmter Stand
//   npm run ausrollen -- --sofort     nicht auf leere Raeume warten
//   npm run ausrollen -- --stand      nur zeigen, was dort laeuft
//
// Wohin, steht nicht im Repository (specs/20-betrieb) - in der Umgebung oder
// in .env.betrieb neben package.json:
//
//   AUSROLLEN_ZIEL=<Name>              der Rechner, wie in ~/.ssh/config
//   AUSROLLEN_ADRESSE=https://<name>   unter der das Spiel erreichbar ist
//   AUSROLLEN_ORDNER=/opt/onlinegames  (Vorgabe)
//   AUSROLLEN_CADDY=/opt/caddy/conf.d  (Vorgabe; leer: Proxy nicht anfassen)
//   AUSROLLEN_WARTEN=30                Minuten Geduld mit laufenden Partien
//
// Was es tut: den Stand als Archiv hinueberschicken, dort das Abbild bauen,
// auf leere Raeume warten, die Konten sichern, den Dienst mit dem neuen
// Abbild starten und von aussen nachsehen, ob er antwortet.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// Eine Zeile "NAME=wert" je Einstellung; die Umgebung geht vor.
export function einstellungenLesen(text, umgebung = {}) {
  const werte = {};
  for (const zeile of text.split(/\r?\n/)) {
    const treffer = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(zeile);
    if (treffer) werte[treffer[1]] = treffer[2];
  }
  for (const [name, wert] of Object.entries(umgebung)) {
    if (name.startsWith('AUSROLLEN_') && wert !== undefined) werte[name] = wert;
  }
  return werte;
}

// Alles, was in einen Befehl auf dem Server wandert, wird vorher geprueft -
// ein Wert mit Leerzeichen oder Anfuehrungszeichen kommt gar nicht erst an.
export function einstellungenPruefen(werte) {
  const fehler = [];
  const ziel = werte.AUSROLLEN_ZIEL || '';
  const adresse = werte.AUSROLLEN_ADRESSE || '';
  const ordner = werte.AUSROLLEN_ORDNER || '/opt/onlinegames';
  const caddy = werte.AUSROLLEN_CADDY ?? '/opt/caddy/conf.d';
  const warten = Number(werte.AUSROLLEN_WARTEN ?? 30);
  if (!/^[A-Za-z0-9._@-]+$/.test(ziel)) fehler.push('AUSROLLEN_ZIEL fehlt oder ist kein Rechnername.');
  if (!/^https:\/\/[a-z0-9.-]+$/.test(adresse)) fehler.push('AUSROLLEN_ADRESSE fehlt oder ist keine Adresse der Form https://name - ohne Pfad, ohne Hafen.');
  if (!/^\/[A-Za-z0-9/_-]+$/.test(ordner)) fehler.push('AUSROLLEN_ORDNER ist kein Pfad.');
  if (caddy && !/^\/[A-Za-z0-9/._-]+$/.test(caddy)) fehler.push('AUSROLLEN_CADDY ist kein Pfad.');
  if (!Number.isFinite(warten) || warten < 0) fehler.push('AUSROLLEN_WARTEN ist keine Zahl von Minuten.');
  return { fehler, ziel, adresse, rechner: adresse.replace('https://', ''), ordner, caddy, warten };
}

// Was auf dem Server laeuft. Die Werte stehen als Zuweisungen davor; sie
// sind geprueft, Anfuehrungszeichen kommen darin nicht vor.
export function serverSkript({ stand, adresse, rechner, ordner, caddy, warten, sofort }) {
  const kopf = [
    'set -euo pipefail',
    `STAND='${stand}'`,
    `ADRESSE='${adresse}'`,
    `RECHNER='${rechner}'`,
    `ORDNER='${ordner}'`,
    `CADDY='${caddy}'`,
    `WARTEN='${warten}'`,
    `SOFORT='${sofort ? 1 : 0}'`,
  ].join('\n');
  return `${kopf}\n${RUMPF}`.replace(/\r\n/g, '\n');
}

const RUMPF = String.raw`
cd "$ORDNER"
mkdir -p daten sicherung
# Im Abbild laeuft der Dienst als Benutzer node (1000).
chown 1000:1000 daten

# Das Geheimnis der Sitzungen: einmal erzeugt, danach nie wieder angefasst -
# sonst meldet jede Aktualisierung alle ab.
if [ ! -f .env ]; then
  ( umask 077; printf 'KONTEN_GEHEIMNIS=%s\n' "$(openssl rand -hex 32)" > .env )
  echo "SCHRITT Geheimnis erzeugt"
fi
( umask 077; grep -v '^OEFFENTLICHE_ADRESSE=' .env > .env.neu || true
  printf 'OEFFENTLICHE_ADRESSE=%s\n' "$ADRESSE" >> .env.neu )
mv .env.neu .env

echo "SCHRITT Abbild bauen"
docker build -q -t "onlinegames:$STAND" -t onlinegames:aktuell quelle.neu > /dev/null
cp quelle.neu/betrieb/docker-compose.yml docker-compose.yml

# Der Proxy: eine eigene Datei neben denen der anderen Anwendungen. Erst
# pruefen, dann neu laden - eine Datei, die Caddy nicht versteht, wird
# zurueckgenommen, und der laufende Proxy merkt davon nichts.
if [ -n "$CADDY" ] && [ -d "$CADDY" ]; then
  DATEI="$CADDY/onlinegames.caddy"
  printf '%s {\n\treverse_proxy onlinegames:4180\n}\n' "$RECHNER" > "$ORDNER/onlinegames.caddy.neu"
  if ! cmp -s "$ORDNER/onlinegames.caddy.neu" "$DATEI"; then
    [ -f "$DATEI" ] && cp "$DATEI" "$ORDNER/onlinegames.caddy.alt"
    cp "$ORDNER/onlinegames.caddy.neu" "$DATEI"
    if docker exec caddy caddy validate --config /etc/caddy/Caddyfile > /dev/null 2>&1; then
      docker exec caddy caddy reload --config /etc/caddy/Caddyfile > /dev/null 2>&1
      echo "SCHRITT Proxy kennt $RECHNER"
    else
      if [ -f "$ORDNER/onlinegames.caddy.alt" ]; then cp "$ORDNER/onlinegames.caddy.alt" "$DATEI"; else rm -f "$DATEI"; fi
      echo "FEHLER Caddy nimmt die neue Datei nicht an - zurueckgenommen, nichts neu geladen"
      exit 3
    fi
  fi
  rm -f "$ORDNER/onlinegames.caddy.neu"
fi

# Laufende Partien liegen im Arbeitsspeicher: ein Neustart beendet sie. Also
# warten, bis keine mehr laeuft (betrieb AC-6) - gefragt wird im Container
# selbst, von aussen gibt es diese Zahlen nicht (betrieb AC-8).
partien() {
  docker exec onlinegames node -e "fetch('http://127.0.0.1:4180/betrieb/zahlen').then(a=>a.json()).then(z=>console.log(Number(z.partien)||0)).catch(()=>console.log(0))" 2>/dev/null || echo 0
}
if [ "$SOFORT" != "1" ] && docker ps --format '{{.Names}}' | grep -qx onlinegames; then
  ENDE=$(( $(date +%s) + WARTEN * 60 ))
  while true; do
    N=$(partien)
    [ "$N" = "0" ] && break
    if [ "$(date +%s)" -ge "$ENDE" ]; then
      echo "FEHLER noch $N laufende Partie(n) nach $WARTEN Minuten - nichts neu gestartet. Mit --sofort trotzdem."
      exit 4
    fi
    echo "SCHRITT $N laufende Partie(n), warte"
    sleep 20
  done
fi

# Die Konten sichern, waehrend niemand hineinschreibt (betrieb AC-7).
docker compose stop -t 10 > /dev/null 2>&1 || true
if [ -n "$(ls -A daten 2>/dev/null)" ]; then
  ZEIT=$(date +%Y%m%d-%H%M%S)
  mkdir -p "sicherung/$ZEIT" && cp -a daten/. "sicherung/$ZEIT/"
  ls -1d sicherung/*/ | sort -r | tail -n +11 | xargs -r rm -rf --
  echo "SCHRITT Konten gesichert nach sicherung/$ZEIT"
fi

echo "SCHRITT Dienst starten"
docker compose up -d > /dev/null 2>&1
rm -rf quelle && mv quelle.neu quelle
echo "$STAND" > STAND

# Antwortet er? Bis zu dreissig Sekunden.
for i in $(seq 1 30); do
  if docker exec onlinegames node -e "fetch('http://127.0.0.1:4180/api/spiele').then(a=>process.exit(a.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    # Alte Abbilder: nur die eigenen, die letzten drei Staende bleiben.
    docker images onlinegames --format '{{.Tag}}' | grep -v '^aktuell$' | tail -n +4 | xargs -r -I{} docker rmi "onlinegames:{}" > /dev/null 2>&1 || true
    echo "LAEUFT $STAND"
    exit 0
  fi
  sleep 1
done
echo "FEHLER der Dienst antwortet nicht. Die letzten Zeilen:"
docker logs --tail 30 onlinegames 2>&1 || true
exit 5
`;

const STAND_SKRIPT = String.raw`
cd "$ORDNER" 2>/dev/null || { echo "Dort liegt noch nichts unter $ORDNER."; exit 0; }
echo "Stand:    $(cat STAND 2>/dev/null || echo unbekannt)"
echo "Dienst:   $(docker ps --filter name=^onlinegames$ --format '{{.Status}}' | grep . || echo 'laeuft nicht')"
echo "Zahlen:   $(docker exec onlinegames node -e "fetch('http://127.0.0.1:4180/betrieb/zahlen').then(a=>a.text()).then(console.log).catch(()=>console.log('keine'))" 2>/dev/null || echo keine)"
echo "Speicher: $(docker stats --no-stream --format '{{.MemUsage}}, {{.CPUPerc}} Rechenzeit' onlinegames 2>/dev/null || echo unbekannt)"
echo "Sicherungen: $(ls -1d sicherung/*/ 2>/dev/null | wc -l)"
`;

// Unter Windows liegt der Schluessel beim Agenten des Systems; das ssh aus
// Git Bash kommt an ihn nicht heran.
function sshFinden() {
  if (process.env.AUSROLLEN_SSH) return process.env.AUSROLLEN_SSH;
  if (process.platform === 'win32') {
    const eigen = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'OpenSSH', 'ssh.exe');
    if (fs.existsSync(eigen)) return eigen;
  }
  return 'ssh';
}

function aufServer(ssh, ziel, skript) {
  return new Promise((fertig) => {
    const lauf = spawn(ssh, ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', ziel, 'bash -s'], { stdio: ['pipe', 'pipe', 'inherit'] });
    let ausgabe = '';
    lauf.stdout.on('data', (stueck) => {
      ausgabe += stueck;
      process.stdout.write(String(stueck).replace(/^(SCHRITT|LAEUFT|FEHLER) /gm, (_, wort) => (wort === 'SCHRITT' ? '  · ' : wort === 'FEHLER' ? '  ✗ ' : '  ✓ laeuft: ')));
    });
    lauf.on('close', (ende) => fertig({ ende, ausgabe }));
    lauf.stdin.end(skript);
  });
}

function archivSchicken(ssh, ziel, ordner, stand) {
  return new Promise((fertig) => {
    const pfade = ['Dockerfile', 'package.json', 'package-lock.json', 'server', 'public', 'scripts/einladung.mjs', 'betrieb'];
    const archiv = spawn('git', ['archive', '--format=tar', stand, '--', ...pfade], { cwd: wurzel, stdio: ['ignore', 'pipe', 'inherit'] });
    const hin = spawn(ssh, ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', ziel,
      `mkdir -p '${ordner}' && rm -rf '${ordner}/quelle.neu' && mkdir '${ordner}/quelle.neu' && tar -x -C '${ordner}/quelle.neu'`],
    { stdio: ['pipe', 'inherit', 'inherit'] });
    archiv.stdout.pipe(hin.stdin);
    let archivEnde = null;
    archiv.on('close', (ende) => { archivEnde = ende; });
    hin.on('close', (ende) => fertig(ende === 0 && archivEnde === 0));
  });
}

// Von aussen: kommt die Seite ueber HTTPS, und nimmt der Server eine
// Spielverbindung ueber wss an?
async function vonAussen(adresse) {
  const antwort = await fetch(`${adresse}/api/spiele`, { signal: AbortSignal.timeout(20000) });
  if (!antwort.ok) throw new Error(`${adresse}/api/spiele antwortet mit ${antwort.status}`);
  const { spiele } = await antwort.json();
  const { default: WebSocket } = await import('ws');
  await new Promise((gut, schlecht) => {
    const draht = new WebSocket(adresse.replace('https://', 'wss://'));
    const uhr = setTimeout(() => { draht.terminate(); schlecht(new Error('die Spielverbindung kommt nicht zustande')); }, 15000);
    draht.on('open', () => { clearTimeout(uhr); draht.close(); gut(); });
    draht.on('error', (fehler) => { clearTimeout(uhr); schlecht(fehler); });
  });
  return spiele.map((spiel) => spiel.name || spiel.art);
}

async function haupt() {
  const argumente = process.argv.slice(2);
  const datei = path.join(wurzel, '.env.betrieb');
  const werte = einstellungenLesen(fs.existsSync(datei) ? fs.readFileSync(datei, 'utf8') : '', process.env);
  const e = einstellungenPruefen(werte);
  if (e.fehler.length) {
    console.error(e.fehler.join('\n'));
    console.error('\nDie Werte gehoeren in .env.betrieb neben package.json (nicht im Repository) oder in die Umgebung.');
    process.exit(2);
  }
  const ssh = sshFinden();

  if (argumente.includes('--stand')) {
    const { ende } = await aufServer(ssh, e.ziel, `ORDNER='${e.ordner}'\n${STAND_SKRIPT}`.replace(/\r\n/g, '\n'));
    process.exit(ende);
  }

  const wunsch = argumente.find((a) => !a.startsWith('--')) || 'HEAD';
  const gelesen = spawnSync('git', ['rev-parse', '--short=10', '--verify', `${wunsch}^{commit}`], { cwd: wurzel, encoding: 'utf8' });
  if (gelesen.status !== 0) {
    console.error(`Kein Commit: ${wunsch}`);
    process.exit(2);
  }
  const stand = gelesen.stdout.trim();
  const betreff = spawnSync('git', ['log', '-1', '--format=%s', stand], { cwd: wurzel, encoding: 'utf8' }).stdout.trim();
  const offen = spawnSync('git', ['status', '--porcelain'], { cwd: wurzel, encoding: 'utf8' }).stdout.trim();
  console.log(`Ausrollen: ${stand} - ${betreff}`);
  if (offen) console.log('  (Im Arbeitsverzeichnis liegen Aenderungen, die nicht committet sind - sie gehen nicht mit.)');

  console.log('  · Archiv schicken');
  if (!await archivSchicken(ssh, e.ziel, e.ordner, stand)) {
    console.error('  ✗ Das Archiv ist nicht angekommen.');
    process.exit(1);
  }
  const { ende } = await aufServer(ssh, e.ziel, serverSkript({ ...e, stand, sofort: argumente.includes('--sofort') }));
  if (ende !== 0) process.exit(ende || 1);

  try {
    const spiele = await vonAussen(e.adresse);
    console.log(`  ✓ von aussen erreichbar: ${e.adresse} (${spiele.join(', ')}), Spielverbindung ueber wss steht`);
  } catch (fehler) {
    console.error(`  ✗ Der Dienst laeuft, ist von aussen aber nicht erreichbar: ${fehler.message}`);
    process.exit(6);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  haupt().catch((fehler) => {
    console.error(fehler.message);
    process.exit(1);
  });
}
