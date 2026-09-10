// Das Aussehen des Berichts qa/report/index.html. Die Farben kommen aus der
// Oberflaeche des Spiels, damit der Bericht aussieht wie etwas aus diesem
// Projekt und nicht wie ein fremdes Werkzeug.
export const stil = `
      :root {
        --grund: #14171c;
        --tafel: #1b2027;
        --tafel2: #20262e;
        --rand: #2c333d;
        --linie: #242a33;
        --schrift: #e6e9ee;
        --leise: #97a1b0;
        --betont: #4a90d9;
        --gruen: #46b378;
        --gelb: #e3b341;
        --orange: #e5853f;
        --blau: #4a90d9;
        --grau: #7d8794;
        --violett: #a48be0;
      }
      * { box-sizing: border-box; }
      /* Ohne !important schlaegt jede eigene display-Regel das hidden-Attribut:
         nav a ist display:flex, und der Filter blendete dort nichts aus. */
      [hidden] { display: none !important; }
      html { scroll-padding-top: calc(var(--kopfhoehe, 130px) + 12px); }
      body {
        margin: 0;
        background: var(--grund);
        color: var(--schrift);
        font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
      }
      a { color: inherit; }
      code {
        font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
        font-size: 0.86em;
        background: #262d36;
        padding: 0.05em 0.35em;
        border-radius: 4px;
      }

      .f-fertig { color: var(--gruen); }
      .f-in-qa { color: var(--gelb); }
      .f-in-arbeit { color: var(--orange); }
      .f-geplant { color: var(--blau); }
      .f-offen { color: var(--grau); }
      .f-zurueckgestellt { color: var(--violett); }
      .k-code { color: var(--blau); }
      .k-tests { color: var(--gruen); }
      .k-doku { color: var(--violett); }
      .k-werkzeug { color: var(--grau); }

      header.kopf {
        position: sticky;
        top: 0;
        z-index: 10;
        background: var(--grund);
        border-bottom: 1px solid var(--rand);
        padding: 14px 24px 12px;
      }
      header.kopf h1 { margin: 0; font-size: 1.25rem; }
      header.kopf h1 span { color: var(--betont); }
      .meta { color: var(--leise); font-size: 0.82rem; font-weight: 400; }
      .werkzeug { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 10px; }
      #suche {
        flex: 1 1 260px;
        max-width: 380px;
        background: #12151a;
        border: 1px solid var(--rand);
        border-radius: 999px;
        color: var(--schrift);
        padding: 7px 14px;
        font: inherit;
      }
      .werkzeug button {
        background: transparent;
        border: 1px solid var(--rand);
        border-radius: 999px;
        color: var(--schrift);
        padding: 5px 12px;
        font: inherit;
        font-size: 0.86rem;
        cursor: pointer;
      }
      .werkzeug button b { margin-left: 4px; }
      .werkzeug button[aria-pressed="true"] { border-color: currentColor; background: #262d38; }
      .werkzeug button:focus-visible, #suche:focus-visible { outline: 2px solid var(--betont); outline-offset: 2px; }
      .punkt { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: currentColor; margin-right: 6px; }
      .trenner { width: 1px; height: 22px; background: var(--rand); margin: 0 4px; }

      .rumpf {
        display: grid;
        grid-template-columns: 290px minmax(0, 1fr);
        gap: 28px;
        max-width: 1520px;
        margin: 0 auto;
        padding: 0 24px 80px;
      }
      nav {
        position: sticky;
        top: calc(var(--kopfhoehe, 130px) + 8px);
        align-self: start;
        max-height: calc(100vh - var(--kopfhoehe, 130px) - 16px);
        overflow: auto;
        padding: 16px 8px 16px 0;
      }
      nav h2 {
        display: flex;
        justify-content: space-between;
        margin: 18px 8px 6px;
        font-size: 0.72rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--leise);
      }
      nav a {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        padding: 4px 8px;
        border-radius: 6px;
        text-decoration: none;
        font-size: 0.9rem;
      }
      nav a:hover, nav a.hier { background: #222933; }
      .balken { display: flex; gap: 1px; height: 3px; margin: 0 8px 6px; border-radius: 2px; overflow: hidden; background: #262d36; }
      .balken i { display: block; background: currentColor; }

      main { padding-top: 16px; min-width: 0; }
      section.bereich > h2 {
        margin: 34px 0 10px;
        font-size: 0.78rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--leise);
      }
      section.spec, .block {
        background: var(--tafel);
        border: 1px solid var(--rand);
        border-radius: 12px;
        padding: 16px 20px;
        margin-bottom: 18px;
      }
      section.spec h3, .block h3 { margin: 0; font-size: 1.08rem; }
      section.spec h3 a { text-decoration: none; }
      section.spec h3 a:hover { text-decoration: underline; }
      section.spec > .meta, .block > .meta { display: block; margin: 2px 0 10px; }

      table.kriterien { width: 100%; border-collapse: collapse; }
      tr.zeile > td { border-top: 1px solid var(--rand); padding: 12px 8px; vertical-align: top; }
      td.ac { width: 140px; white-space: nowrap; }
      td.ac .id { display: block; font-weight: 600; }
      .marke { display: block; margin-top: 2px; font-size: 0.74rem; letter-spacing: 0.05em; text-transform: uppercase; }
      .nachweis { display: block; margin-top: 2px; font-size: 0.78rem; color: var(--leise); }
      .gruppe { margin: 0; font-size: 0.72rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--leise); }
      .titel { margin: 2px 0; font-weight: 600; }
      .text { margin: 0; max-width: 82ch; color: #cdd3dc; }
      .grund, .beleg { margin: 6px 0 0; max-width: 82ch; font-size: 0.84rem; color: var(--leise); }
      .grund b, .beleg b { color: var(--schrift); font-weight: 600; }
      .bilder { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 10px; }
      figure { margin: 0; width: 330px; }
      figure img { display: block; width: 100%; border: 1px solid var(--rand); border-radius: 6px; background: #0e1014; }
      figcaption { margin-top: 4px; font-size: 0.78rem; color: var(--leise); }
      .haken { color: var(--gruen); margin-right: 6px; }
      .nurlesbar { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
      .leer { color: var(--leise); padding: 24px 0; }

      .kacheln { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; margin: 14px 0 18px; }
      .kachel { border: 1px solid var(--rand); border-radius: 8px; padding: 10px 14px; background: var(--tafel2); }
      .kachel .name { font-size: 0.8rem; color: var(--leise); }
      .kachel .zahl { font-size: 1.7rem; font-weight: 600; line-height: 1.25; color: var(--betont); font-variant-numeric: tabular-nums; }
      .kachel .unter { font-size: 0.8rem; color: var(--leise); }
      .diagramme { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 22px; }
      .diagramm h4 { margin: 0 0 6px; font-size: 0.86rem; font-weight: 500; color: var(--leise); }
      .rolle { overflow-x: auto; direction: rtl; border-bottom: 1px solid var(--rand); }
      .rolle > svg { direction: ltr; display: block; }
      svg text { fill: var(--leise); font-size: 10px; font-family: inherit; }
      svg .linie { stroke: var(--linie); }
      .legende { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 8px; font-size: 0.8rem; }
      .legende span::before { content: ""; display: inline-block; width: 9px; height: 9px; margin-right: 5px; border-radius: 2px; background: currentColor; }

      table.zahlen { width: 100%; margin-top: 16px; border-collapse: collapse; font-size: 0.86rem; font-variant-numeric: tabular-nums; }
      table.zahlen th {
        padding: 6px 8px;
        border-bottom: 1px solid var(--rand);
        font-size: 0.72rem;
        font-weight: 500;
        letter-spacing: 0.05em;
        text-align: right;
        text-transform: uppercase;
        color: var(--leise);
      }
      table.zahlen td { padding: 5px 8px; border-bottom: 1px solid var(--linie); text-align: right; }
      table.zahlen .links { text-align: left; }
      table.zahlen tr.jetzt td { background: #1f2a36; }
      .rahmen { overflow-x: auto; }

      @media (max-width: 900px) {
        .rumpf { grid-template-columns: 1fr; }
        nav { position: static; max-height: none; }
      }
`;
