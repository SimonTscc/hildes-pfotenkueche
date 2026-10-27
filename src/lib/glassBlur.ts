// Die Kopie ist ohnehin stark weichgezeichnet; in einem Viertel der Auflösung kostet sie pro Frame
// nur einen Bruchteil, ohne dass man einen Unterschied sieht.
const GLASS_RESOLUTION = 0.25;

/** Zeichnet jede Glas-Canvas (canvas[data-blur]) als weichgezeichnete Kopie der Szene hinter ihrem Elternelement. */
export function drawGlass(stage: HTMLElement, cave: HTMLCanvasElement) {
  const src = cave.getBoundingClientRect();
  if (!src.width || !cave.width) return;
  const devicePx = cave.width / src.width; // Geräte-px pro CSS-px in der Szene
  const scale = GLASS_RESOLUTION; // Glas-px pro CSS-px
  for (const canvas of stage.querySelectorAll<HTMLCanvasElement>("canvas[data-blur]")) {
    const host = canvas.parentElement;
    if (!host) continue;
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height || getComputedStyle(host).visibility === "hidden") continue;
    const blur = Number(canvas.dataset.blur);
    const pad = blur * 2;
    const cssW = r.width + pad * 2,
      cssH = r.height + pad * 2;
    const w = Math.max(1, Math.round(cssW * scale)),
      h = Math.max(1, Math.round(cssH * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    Object.assign(canvas.style, { left: `${-pad}px`, top: `${-pad}px`, width: `${cssW}px`, height: `${cssH}px` });
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.filter = `blur(${blur * scale}px)`;
    // nur den Ausschnitt hinter dem Element aus der Szene holen
    const sx = (r.left - src.left - pad) * devicePx,
      sy = (r.top - src.top - pad) * devicePx;
    ctx.drawImage(cave, sx, sy, cssW * devicePx, cssH * devicePx, 0, 0, w, h);
    ctx.filter = "none";
  }
}
