// Zutaten für das Napf-Spiel. „gut“ gehört in einen BARF-Napf, der Rest ist für Hunde gefährlich.

export type Zutat = {
  id: string;
  name: string;
  gut: boolean;
  farbe: string; // Farbe der Stückchen im Napf
  info: string; // kurze Erklärung nach dem Hineinziehen
};

export const zutaten: Zutat[] = [
  { id: "muskel", name: "Muskelfleisch", gut: true, farbe: "#a9443a", info: "Der größte Teil im Napf: liefert Eiweiß und Energie." },
  { id: "schokolade", name: "Schokolade", gut: false, farbe: "#5a3825", info: "Schokolade enthält Theobromin und ist für Hunde giftig." },
  { id: "pansen", name: "Pansen", gut: true, farbe: "#8f8366", info: "Riecht streng, schmeckt Hunden aber und ist gut für die Verdauung." },
  { id: "gemuese", name: "Gemüse", gut: true, farbe: "#e46b24", info: "Püriert, damit der Hund es verwerten kann. Liefert Ballaststoffe." },
  { id: "trauben", name: "Weintrauben", gut: false, farbe: "#6b4a7a", info: "Trauben und Rosinen können die Nieren schwer schädigen." },
  { id: "innereien", name: "Leber & Niere", gut: true, farbe: "#5e2420", info: "Klein, aber wichtig: Vitamine und Spurenelemente." },
  { id: "knochen", name: "Fleischige Knochen", gut: true, farbe: "#e9e1cf", info: "Roh und passend groß: die natürliche Kalziumquelle." },
  { id: "zwiebel", name: "Zwiebeln", gut: false, farbe: "#c9a46b", info: "Zwiebeln und Knoblauch schädigen die roten Blutkörperchen." },
  { id: "obst", name: "Obst", gut: true, farbe: "#c9cf5a", info: "Ein kleiner Anteil, zum Beispiel Apfel oder Beeren." },
  { id: "gekocht", name: "Gekochte Knochen", gut: false, farbe: "#a07c55", info: "Gekochte Knochen splittern und können verletzen. Immer roh füttern." },
  { id: "oel", name: "Lachsöl", gut: true, farbe: "#e2b23a", info: "Ein paar Tropfen für Omega-3-Fettsäuren, Haut und Fell." },
];
