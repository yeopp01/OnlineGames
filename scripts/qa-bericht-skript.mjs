// Das bisschen Verhalten des Berichts qa/report/index.html.
//
// Filtern und Suchen laufen im Browser ueber die bereits erzeugten Zeilen -
// die Seite laedt nichts nach und braucht keinen Server, sie oeffnet sich per
// Doppelklick. Ohne JavaScript ist einfach alles sichtbar; das ist der
// brauchbare Ausgangszustand.
export const skript = `
      const zeilen = [...document.querySelectorAll("tr.zeile")];
      const suche = document.getElementById("suche");
      const knoepfe = [...document.querySelectorAll("button[data-art]")];
      const stand = document.getElementById("stand");

      /** Aktive Wahl je Art - leer heisst "alles". */
      const wahl = { status: new Set(), nachweis: new Set() };

      function anwenden() {
        const wort = suche.value.trim().toLowerCase();
        let sichtbar = 0;
        for (const zeile of zeilen) {
          const passtStatus = !wahl.status.size || wahl.status.has(zeile.dataset.status);
          const passtNachweis = !wahl.nachweis.size || wahl.nachweis.has(zeile.dataset.nachweis);
          const passtWort = !wort || zeile.dataset.suche.includes(wort);
          zeile.hidden = !(passtStatus && passtNachweis && passtWort);
          if (!zeile.hidden) sichtbar += 1;
        }
        for (const spec of document.querySelectorAll("section.spec")) {
          spec.hidden = ![...spec.querySelectorAll("tr.zeile")].some((z) => !z.hidden);
        }
        for (const bereich of document.querySelectorAll("section.bereich")) {
          bereich.hidden = ![...bereich.querySelectorAll("section.spec")].some((s) => !s.hidden);
        }
        for (const verweis of document.querySelectorAll("nav a[data-spec]")) {
          const ziel = document.getElementById(verweis.dataset.ziel);
          verweis.hidden = !ziel || ziel.hidden;
          const balken = verweis.nextElementSibling;
          if (balken && balken.classList.contains("balken")) balken.hidden = verweis.hidden;
        }
        for (const gruppe of document.querySelectorAll("nav .navgruppe")) {
          gruppe.hidden = ![...gruppe.querySelectorAll("a[data-spec]")].some((a) => !a.hidden);
        }
        document.getElementById("nichts").hidden = sichtbar > 0;
        stand.textContent = sichtbar === zeilen.length
          ? zeilen.length + " Abnahmekriterien in " + document.querySelectorAll("section.spec").length + " Specs"
          : sichtbar + " von " + zeilen.length + " Abnahmekriterien";
      }

      for (const knopf of knoepfe) {
        knopf.addEventListener("click", () => {
          const menge = wahl[knopf.dataset.art];
          const wert = knopf.dataset.wert;
          if (wert === "alle") menge.clear();
          else if (menge.has(wert)) menge.delete(wert);
          else menge.add(wert);
          for (const k of knoepfe) {
            if (k.dataset.art !== knopf.dataset.art) continue;
            const eigen = k.dataset.wert;
            k.setAttribute("aria-pressed", String(eigen === "alle" ? menge.size === 0 : menge.has(eigen)));
          }
          anwenden();
        });
      }

      suche.addEventListener("input", anwenden);
      suche.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { suche.value = ""; anwenden(); }
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "/" && document.activeElement !== suche) {
          e.preventDefault();
          suche.focus();
        }
      });

      /* Der Kopf bleibt stehen; wie hoch er ist, haengt vom Umbruch der
         Filterleiste ab. Was darunter ausweichen muss, liest --kopfhoehe. */
      const kopf = document.querySelector("header.kopf");
      const kopfhoehe = () => document.documentElement.style.setProperty("--kopfhoehe", kopf.offsetHeight + "px");
      new ResizeObserver(kopfhoehe).observe(kopf);
      kopfhoehe();

      /* Im Inhaltsverzeichnis mitlaufen, welche Spec gerade oben steht. */
      const beobachter = new IntersectionObserver((eintraege) => {
        for (const eintrag of eintraege) {
          if (!eintrag.isIntersecting) continue;
          for (const a of document.querySelectorAll("nav a")) {
            a.classList.toggle("hier", a.dataset.ziel === eintrag.target.id);
          }
        }
      }, { rootMargin: "-20% 0px -70% 0px" });
      for (const ziel of document.querySelectorAll("section.spec, .block[id]")) beobachter.observe(ziel);

      anwenden();
`;
