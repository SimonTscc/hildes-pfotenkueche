/** Interner Link mit Basis-Pfad (GitHub Pages läuft unter /hildes-pfotenkueche/). */
export function href(path = "") {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/${path.replace(/^\//, "")}`;
}
