// Angebot: Futterpläne und Beratungsleistungen. Texte sind eigene Formulierungen.

export type Plan = {
  id: string;
  name: string;
  fuer: string; // für wen, eine Zeile
  text: string;
  inhalt: string[];
};

export const plaene: Plan[] = [
  {
    id: "puppy",
    name: "BARF-Plan Puppy",
    fuer: "Welpen im Wachstum",
    text: "Welpen wachsen schnell, und ihr Bedarf ändert sich fast jede Woche. Der Plan wächst mit: Mengen und Kalzium werden so angepasst, dass Knochen und Gelenke in Ruhe wachsen können.",
    inhalt: ["Mengen nach aktuellem und erwartetem Endgewicht", "Anpassungen für die einzelnen Wachstumsphasen", "Hinweise zur Umstellung vom Züchterfutter"],
  },
  {
    id: "adult",
    name: "BARF-Plan Adult",
    fuer: "Gesunde erwachsene Hunde",
    text: "Der Plan für den Alltag: abgestimmt auf Gewicht, Aktivität und das, was dein Hund gern frisst. Mit Rezepten, die sich gut vorbereiten und einfrieren lassen.",
    inhalt: ["Wochenplan mit Mengen pro Tag", "Einkaufsliste nach Fleischsorten", "Öle und Ergänzungen in der richtigen Dosis"],
  },
  {
    id: "senior",
    name: "BARF-Plan Senior",
    fuer: "Ältere Hunde",
    text: "Mit dem Alter wird der Stoffwechsel ruhiger und die Verdauung empfindlicher. Der Plan setzt auf gut verdauliche Zutaten und denkt an Gelenke, Nieren und einen gemütlicheren Tagesablauf.",
    inhalt: ["Leichter verdauliche Zusammenstellung", "Angepasste Energie und Eiweißmenge", "Ergänzungen für Gelenke"],
  },
  {
    id: "gesundheit",
    name: "BARF-Plan Gesundheit",
    fuer: "Hunde mit Vorerkrankungen",
    text: "Bei Erkrankungen von Nieren, Leber, Bauchspeicheldrüse, Haut oder Herz braucht der Napf besondere Aufmerksamkeit. Hilde stimmt den Plan auf die Diagnose ab, gern zusammen mit deiner Tierarztpraxis.",
    inhalt: ["Zusammenstellung passend zur Diagnose", "Berücksichtigung von Blutwerten und Medikamenten", "Abstimmung mit der Tierarztpraxis auf Wunsch"],
  },
  {
    id: "gewicht",
    name: "BARF-Plan Gewichtskontrolle",
    fuer: "Hunde, die ab- oder zunehmen sollen",
    text: "Gesund abnehmen heißt nicht hungern. Der Plan senkt die Energie, nicht das Sättigungsgefühl, und führt Schritt für Schritt zum Zielgewicht. Andersherum funktioniert er auch für Hunde, die zulegen müssen.",
    inhalt: ["Zielgewicht und realistischer Zeitplan", "Sättigende Zusammenstellung mit weniger Energie", "Anpassung nach Wiegen"],
  },
  {
    id: "ausschlussdiaet",
    name: "Die Ausschlussdiät",
    fuer: "Verdacht auf Allergie oder Unverträglichkeit",
    text: "Juckreiz, Pfotenlecken, weicher Kot: Oft steckt eine Unverträglichkeit dahinter. Mit einer Ausschlussdiät findest du Schritt für Schritt heraus, was dein Hund verträgt und was nicht.",
    inhalt: ["Start mit einer einzigen Eiweißquelle", "Klarer Ablauf für jede Woche", "Tagebuch-Vorlage zum Beobachten"],
  },
  {
    id: "darmsanierung",
    name: "Die Darmsanierung",
    fuer: "Nach Durchfall, Antibiotika oder Wurmkur",
    text: "Ein gestörter Darm braucht Zeit und das richtige Futter. Der Plan baut die Darmflora behutsam wieder auf und führt danach zurück in die normale Fütterung.",
    inhalt: ["Schonkost-Phase mit genauen Mengen", "Aufbau der Darmflora", "Übergang zurück zum normalen Plan"],
  },
];

export type Leistung = { id: string; name: string; text: string; punkte?: string[] };

export const leistungen: Leistung[] = [
  {
    id: "beratung",
    name: "1:1-Beratung",
    text: "Wenn du über den Plan hinaus Fragen hast, nehmt ihr euch in einem persönlichen Gespräch Zeit dafür. Ob Umstellung, Fütterung im Urlaub oder ein Hund, der plötzlich mäkelt: Es gibt keine falschen Fragen.",
    punkte: ["Gespräch per Telefon oder Video", "Vorher ein kurzer Fragebogen", "Zusammenfassung zum Nachlesen"],
  },
  {
    id: "analyse",
    name: "Ernährungsanalyse",
    text: "Du fütterst schon und willst wissen, ob alles passt? Hilde rechnet deine aktuelle Fütterung nach und zeigt dir, wo etwas fehlt oder zu viel ist, ohne dass du gleich alles umwerfen musst.",
    punkte: ["Auswertung deiner jetzigen Rationen", "Konkrete Vorschläge zum Nachbessern"],
  },
  {
    id: "tipps",
    name: "Tipps & Tricks",
    text: "Zu jedem Plan und jeder Beratung gehören die kleinen Dinge, die den Alltag leichter machen: wie du fütterst, portionierst, einfrierst und auftaust.",
  },
  {
    id: "guide",
    name: "Guide „SOS Durchfall“",
    text: "Erste Hilfe für deinen Hund als Ratgeber zum Herunterladen, für die Tage, an denen es schnell gehen muss: was du sofort tun kannst und wann es Zeit für die Tierarztpraxis ist.",
  },
];

export const ablauf = [
  { titel: "Fragebogen", text: "Du erzählst von deinem Hund: Alter, Gewicht, Alltag, Vorlieben und was ihm nicht bekommt." },
  { titel: "Rechnen", text: "Hilde stellt die Ration zusammen und prüft Nährstoffe, Kalzium und Energie." },
  { titel: "Dein Plan", text: "Du bekommst Mengen, Rezepte und Einkaufsliste, verständlich und zum Ausdrucken." },
  { titel: "Nachfragen", text: "Läuft etwas nicht rund, passt Hilde den Plan an." },
];
