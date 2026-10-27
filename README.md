# Hildes Pfotenküche

Website für Hildes BARF-Ernährungsberatung (Futterpläne und Beratung für Hunde). Astro, mehrere Seiten, Napf zum Befüllen auf der Startseite (Zutaten hineinziehen, Gefährliches springt raus).

- Entwickeln: `npm install`, dann `npm run dev` → http://localhost:4321/hildes-pfotenkueche/
- Prüfen und bauen: `npm run check`, `npm run build`
- Deploy: automatisch per GitHub Actions auf GitHub Pages bei jedem Push auf `main`
- Inhalte: `src/data/site.ts` (Kontakt, Vorschau-Schalter), `src/data/angebot.ts` (Pläne, Beratung, Ablauf), `src/data/zutaten.ts` (Napf-Spiel)
- Offene Angaben sind mit `[SWAP]` markiert.
- Fotos: Unsplash, Nachweis in `src/data/bildnachweis.ts` und im Impressum.

Der erste Entwurf (Scroll-Website mit WebGL-Kamerafahrt) liegt auf dem Branch `archiv/v1-kamerafahrt` bzw. Tag `v1-kamerafahrt`.
