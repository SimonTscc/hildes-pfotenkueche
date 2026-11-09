// Shop: Webinar-Plätze und der Durchfall-Plan zum Herunterladen. BARF-Pläne gibt es nur über die Anfrage.
// Alles mit [SWAP] liefert Hilde noch (Preise, Dauer, Plattform, echte Termine).
//
// Wichtig fürs BARF-Webinar: Es erklärt die Grundlagen, rechnet aber keine Rationen.
// Mengen und Verhältnisse für den eigenen Hund gibt es nur im individuellen Plan.

export type Termin = { datum: string; uhrzeit: string; ausgebucht?: boolean };

export type Webinar = {
  id: string; // kurz, ohne Leerzeichen, steht in der Adresse (#barf)
  titel: string;
  untertitel: string;
  text: string;
  punkte: string[];
  nichtDabei?: string; // ehrlicher Hinweis, was das Webinar nicht leistet
  dauer: string;
  ort: string;
  preis: number; // Euro pro Platz
  maxPlaetze: number; // so viele Plätze kann man pro Bestellung buchen
  /**
   * Termine: eine Zeile pro Termin, Format "JJJJ-MM-TT" und "HH:MM".
   * Vergangene Termine blendet die Seite von selbst aus, sie können also stehen bleiben.
   * ausgebucht: true zeigt den Termin, man kann ihn aber nicht mehr buchen.
   */
  termine: Termin[];
};

export const webinare: Webinar[] = [
  {
    id: "barf",
    titel: "BARF-Webinar",
    untertitel: "Live mit Hilde, Fragen ausdrücklich erwünscht",
    text: "Hilde erklärt in kleiner Runde, was hinter BARF steckt: welche Bausteine in den Napf gehören, warum, und worauf du beim Einkaufen, Lagern und Umstellen achten solltest. Danach ist Zeit für deine Fragen.",
    punkte: ["Die Bausteine: Fleisch, Knochen, Innereien, Gemüse, Öle", "Was Hund und Katze nicht fressen dürfen", "Einkaufen, Lagern, Auftauen", "Wie eine Umstellung abläuft", "Offene Fragerunde am Ende"],
    nichtDabei: "Mengen und Rezepte für dein Tier rechnet Hilde nicht im Webinar, sondern im individuellen Futterplan.",
    dauer: "etwa 90 Minuten", // [SWAP]
    ort: "online per Zoom, den Link bekommst du per E-Mail", // [SWAP] Plattform
    preis: 29, // [SWAP]
    maxPlaetze: 4,
    termine: [
      // [SWAP] Beispieltermine, bis Hilde echte Daten schickt
      { datum: "2026-11-19", uhrzeit: "19:00" },
      { datum: "2026-12-03", uhrzeit: "19:00" },
      { datum: "2026-12-17", uhrzeit: "19:00" },
      { datum: "2027-01-14", uhrzeit: "19:00" },
    ],
  },
  {
    id: "einzug",
    titel: "Mein Hund zieht ein",
    untertitel: "Für alle, bei denen bald ein Hund einzieht, auch aus dem Tierschutz",
    text: "Ein neuer Hund bringt viel Freude und viele Fragen mit. Hilde ist auch bei den Fellnasen Stuttgart aktiv und weiß, was in den ersten Wochen zählt, gerade bei Hunden aus dem Tierschutz, die schon einiges hinter sich haben.",
    punkte: ["Was du vor dem Einzug vorbereiten solltest", "Die ersten Tage und Wochen: Ruhe, Routine, Vertrauen", "Tierschutzhunde: was anders sein kann und worauf du achtest", "Fütterung am Anfang, gerade bei empfindlichem Magen", "Offene Fragerunde am Ende"],
    dauer: "etwa 90 Minuten", // [SWAP]
    ort: "online per Zoom, den Link bekommst du per E-Mail", // [SWAP] Plattform
    preis: 29, // [SWAP]
    maxPlaetze: 4,
    termine: [
      // [SWAP] Beispieltermine
      { datum: "2026-11-26", uhrzeit: "19:00" },
      { datum: "2026-12-10", uhrzeit: "19:00" },
      { datum: "2027-01-21", uhrzeit: "19:00" },
    ],
  },
];

export type Download = {
  id: string;
  titel: string;
  fuer: string;
  text: string;
  punkte: string[];
  format: string;
  preis: number;
};

export const downloads: Download[] = [
  {
    id: "durchfall",
    titel: "Durchfall-Plan „SOS Durchfall“",
    fuer: "Für die ersten Tage, wenn es schnell gehen muss",
    text: "Was du sofort tun kannst, was in den Napf darf und wie du dein Tier danach behutsam zurück zum normalen Futter führst. Mit klaren Mengen und dem Hinweis, wann es Zeit für die Tierarztpraxis ist.",
    punkte: ["Schonkost-Plan für die ersten Tage", "Mengen nach Gewicht deines Tieres", "Rückweg zum normalen Futter", "Warnzeichen, bei denen du zur Tierarztpraxis solltest"],
    format: "PDF zum Herunterladen und Ausdrucken",
    preis: 19, // [SWAP]
  },
];

/** Termin als Text, z. B. „Donnerstag, 19. November 2026, 19:00 Uhr“ */
export function terminText(t: { datum: string; uhrzeit: string }) {
  const d = new Date(`${t.datum}T${t.uhrzeit}:00`);
  const tag = d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return `${tag}, ${t.uhrzeit} Uhr`;
}

export const euro = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: n % 1 ? 2 : 0 });
