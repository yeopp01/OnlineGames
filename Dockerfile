# Das Abbild fuer den Betrieb (specs/20-betrieb). Nur, was der Server zum
# Laufen braucht: die Abhaengigkeiten ohne Playwright, server/ und public/,
# dazu das Skript fuer die Einladungscodes. Gebaut wird auf dem Server aus
# dem Stand eines Commits - npm run ausrollen.
FROM node:24-slim

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY server ./server
COPY public ./public
COPY scripts/einladung.mjs ./scripts/einladung.mjs

# Nicht als root. Die Konten liegen ausserhalb des Programmordners
# (betrieb AC-7), der Ordner dazu gehoert diesem Benutzer.
USER node
EXPOSE 4180
CMD ["node", "server/index.js"]
