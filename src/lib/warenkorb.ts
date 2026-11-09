// Warenkorb im Browser (localStorage). Jede Änderung meldet sich mit dem Ereignis „warenkorb“,
// damit Zähler im Menü und Warenkorb-Seite sich selbst aktualisieren, auch in anderen Tabs.

export type Posten = {
  id: string; // eindeutig, z. B. "webinar-2026-11-19" oder "download-durchfall"
  titel: string;
  detail?: string; // z. B. der Termin
  preis: number;
  anzahl: number;
  max: number; // höchste erlaubte Anzahl
};

const SCHLUESSEL = "hilde-warenkorb";

export function lesen(): Posten[] {
  try {
    const daten = JSON.parse(localStorage.getItem(SCHLUESSEL) ?? "[]");
    return Array.isArray(daten) ? daten.filter((p) => p && typeof p.id === "string" && p.anzahl > 0) : [];
  } catch {
    return [];
  }
}

function schreiben(posten: Posten[]) {
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(posten));
  } catch {
    /* privater Modus o. Ä.: Warenkorb gilt dann nur für diese Seite */
  }
  window.dispatchEvent(new CustomEvent("warenkorb"));
}

export function hinzufuegen(neu: Omit<Posten, "anzahl">, anzahl = 1) {
  const posten = lesen();
  const da = posten.find((p) => p.id === neu.id);
  if (da) da.anzahl = Math.min(da.max, da.anzahl + anzahl);
  else posten.push({ ...neu, anzahl: Math.min(neu.max, anzahl) });
  schreiben(posten);
}

export function setzeAnzahl(id: string, anzahl: number) {
  const posten = lesen()
    .map((p) => (p.id === id ? { ...p, anzahl: Math.max(0, Math.min(p.max, anzahl)) } : p))
    .filter((p) => p.anzahl > 0);
  schreiben(posten);
}

export function leeren() {
  schreiben([]);
}

export const anzahlGesamt = (posten = lesen()) => posten.reduce((s, p) => s + p.anzahl, 0);
export const summe = (posten = lesen()) => posten.reduce((s, p) => s + p.preis * p.anzahl, 0);

export const euro = (n: number) =>
  n.toLocaleString("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: n % 1 ? 2 : 0 });

/** Ruft fn sofort und bei jeder Änderung auf (auch aus anderen Tabs). */
export function beobachten(fn: () => void) {
  fn();
  window.addEventListener("warenkorb", fn);
  window.addEventListener("storage", (e) => {
    if (e.key === SCHLUESSEL) fn();
  });
  // Zurück-Taste: Seite kommt aus dem Cache, Zähler neu setzen
  window.addEventListener("pageshow", fn);
}
