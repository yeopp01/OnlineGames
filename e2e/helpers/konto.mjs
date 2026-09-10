// Das eine Konto des Browserlaufs. e2e/server.mjs legt es beim Start an, die
// Tests melden sich damit an.
//
// Angemeldet wird im ganzen Lauf so selten wie moeglich: der Server laesst
// fuenf Anmeldungen je Stunde und Adresse zu (specs/00-plattform/konten.md
// AC-11), und alle Browserfenster kommen von derselben Adresse.
export const KONTO = {
  email: 'anna@browserlauf.test',
  kennwort: 'einLangesKennwortFuerDenBrowserlauf',
  name: 'Anna',
};
