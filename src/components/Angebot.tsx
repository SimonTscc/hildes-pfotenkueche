import styles from "./Angebot.module.css";

const PLAENE = [
  { name: "BARF-Plan Puppy", text: "Für Welpen im Wachstum. Die Mengen wachsen mit, damit Knochen und Gelenke genau das bekommen, was sie brauchen." },
  { name: "BARF-Plan Adult", text: "Für gesunde erwachsene Hunde, abgestimmt auf Gewicht, Aktivität und das, was dein Hund gern frisst." },
  { name: "BARF-Plan Senior", text: "Für ältere Hunde: gut verdaulich und angepasst an Gelenke, Organe und einen ruhigeren Alltag." },
  { name: "BARF-Plan Gesundheit", text: "Bei Vorerkrankungen. Hilde stimmt den Plan auf die Diagnose ab, gern in Absprache mit deiner Tierarztpraxis." },
  { name: "BARF-Plan Gewichtskontrolle", text: "Zum gesunden Ab- oder Zunehmen, satt und ohne Hungerphasen." },
  { name: "Die Ausschlussdiät", text: "Futtermittelallergien und Unverträglichkeiten Schritt für Schritt aufspüren, mit klarem Ablauf für jede Woche." },
  { name: "Die Darmsanierung", text: "Die Darmflora nach Durchfall, Antibiotika oder Wurmkur wieder aufbauen." },
];

const LEISTUNGEN = [
  { name: "1:1-Beratung", text: "Ein persönliches Gespräch, wenn du über den Plan hinaus Fragen hast. Ihr nehmt euch in Ruhe Zeit für alles, was dich beschäftigt." },
  { name: "Ernährungsanalyse", text: "Hilde schaut sich an, was dein Hund heute frisst, und zeigt dir, wo etwas fehlt oder zu viel ist." },
  { name: "Tipps & Tricks", text: "Zu jedem Plan und jeder Beratung: wie du fütterst, portionierst und richtig aufbewahrst." },
  { name: "Guide „SOS Durchfall“", text: "Erste Hilfe für deinen Hund als Ratgeber zum Download, für die Tage, an denen es schnell gehen muss." },
];

function Liste({ items }: { items: { name: string; text: string }[] }) {
  return (
    <ul className={styles.liste}>
      {items.map((item) => (
        <li key={item.name} className={styles.zeile}>
          <h3 className={styles.name}>{item.name}</h3>
          <p className={styles.text}>{item.text}</p>
        </li>
      ))}
    </ul>
  );
}

/** Angebot unter der Kamerafahrt: Futterpläne und Beratung als Zeilen. */
export function Angebot() {
  return (
    <div className={styles.angebot}>
      <section id="plaene" className={styles.block} aria-labelledby="plaene-titel">
        <h2 id="plaene-titel" className={styles.titel}>
          <span className="trim sans">Futterpläne</span>
          <span className="trim serif">für jede Lebensphase.</span>
        </h2>
        <p className={styles.intro}>
          Jeder Plan wird für deinen Hund einzeln berechnet: mit Mengen, Rezepten und Einkaufsliste. Du bereitest
          selbst zu und weißt genau, warum was in den Napf kommt.
        </p>
        <Liste items={PLAENE} />
      </section>

      <section id="beratung" className={styles.block} aria-labelledby="beratung-titel">
        <h2 id="beratung-titel" className={styles.titel}>
          <span className="trim sans">Beratung</span>
          <span className="trim serif">und alles drumherum.</span>
        </h2>
        <Liste items={LEISTUNGEN} />
      </section>

      <footer id="ueber" className={styles.fuss}>
        <p>Hildes Pfotenküche · BARF-Ernährungsberatung</p>
        <p className={styles.leise}>Kontakt und Preise folgen in Kürze.</p>
      </footer>
    </div>
  );
}
