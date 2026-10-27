# Hildes Pfotenküche

Einseitige Scroll-Website für eine kleine BARF-Manufaktur: Kamerafahrt über einen Küchentisch (WebGL, 120 Bilder mit Tiefenkarte), Preloader mit Pfotenspur, Glaskarten, Pfoten-Cursor.

- Entwickeln: `npm install`, dann `npm run dev`
- Bauen: `npm run build` (Basis-Pfad `/hildes-pfotenkueche/` für GitHub Pages)
- Deploy: automatisch per GitHub Actions bei jedem Push auf `main`

## Kamerafahrt neu rendern

Die Bilder in `public/frames/` sind eine prozedurale 3D-Szene (three.js), gerendert mit Chrome:

```
cd tools/kamerafahrt
npm install
npm run render        # alle 120 Bilder + Tiefenkarten nach public/frames
npm run vorschau      # Szene mit Schieberegler im Browser ansehen
```

Liefert der Kunde ein echtes Video, ersetzen die Bilder daraus diese Dateien (gleiche Namen, 1920 × 1080 JPEG und 960 × 540 WebP, weiß = nah).
