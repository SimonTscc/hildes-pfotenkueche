// Hildes eigene Tiere für „Über Hilde“. Text leer = auf der Seite steht „Text folgt“.
// Texte von Hilde (2026-11-19).

// imBild: wo das Tier auf dem Gruppenfoto zu sehen ist.
export type Tier = { name: string; imBild?: string; zusatz?: string; text: string };

export const hunde: Tier[] = [
  {
    name: "Nala",
    imBild: "rechts im Bild",
    text: "Nala kam 2021 über Fellnasen Stuttgart e. V. aus Kalabrien in Italien zu mir. Mit ihr begann meine Leidenschaft für den Tierschutz. Sie ist der Grund, warum ich mich heute so intensiv für Tiere in Not einsetze, und wird deshalb immer einen ganz besonderen Platz in meinem Herzen haben.",
  },
  {
    name: "Heinrich",
    imBild: "in der Mitte",
    text: "Heinrich ist unser liebenswerter Senior und kam im Mai 2026 über Fellnasen Stuttgart e. V. aus Kroatien zu mir. Er darf seinen Lebensabend bei uns verbringen und ist gleichzeitig einer der Patenschaftshunde des Vereins. Trotz seiner gesundheitlichen Baustellen genießt er sein neues Leben.",
  },
  {
    name: "Patata",
    imBild: "links im Bild",
    zusatz: "Italienisch für Kartoffel",
    text: "Patata kam im September 2025 aus demselben Tierheim in Kalabrien wie Nala zu mir. Sie leidet an einer Autoimmunerkrankung und benötigt besondere Pflege und medizinische Versorgung. Auch sie ist eine Patenschaftshündin von Fellnasen Stuttgart e. V. und darf bei uns ein liebevolles Zuhause genießen.",
  },
];

export const katzen: Tier[] = [
  {
    name: "Erika",
    imBild: "hinten im Bild",
    text: "Erika habe ich im September 2025 während eines meiner Tierschutzaufenthalte in Italien ganz alleine auf der Straße gefunden. Sie war gerade einmal etwa vier Wochen alt und wog nur 500 Gramm. Aus dem winzigen, hilflosen Katzenbaby wurde ein festes Familienmitglied, das ich nicht mehr missen möchte.",
  },
  {
    name: "Helmut",
    imBild: "vorne im Bild",
    text: "Auch Helmut hatte keinen einfachen Start ins Leben. Er wurde ganz alleine auf einer Straße in Deutschland gefunden und anschließend liebevoll von Hand aufgezogen. Im September 2026 zog er schließlich bei mir ein und gehört seitdem zu unserer tierischen Familie.",
  },
];
