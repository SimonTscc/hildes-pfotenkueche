import { forwardRef } from "react";
import { CARD_BLUR } from "../config";
import styles from "./GlassCards.module.css";

const CARDS = [
  {
    title: "Dein Futterplan",
    text: "Ein Plan mit Mengen und Rezepten für jede Woche – du kaufst ein und bereitest selbst zu.",
    side: "left",
  },
  {
    title: "Persönliche Beratung",
    text: "Hilde bespricht mit dir Gewohnheiten, Allergien und Ziele – auch für Senioren und empfindliche Mägen.",
    side: "right",
  },
] as const;

/** Die zwei Glaskarten auf dem letzten Screen. */
export const GlassCards = forwardRef<HTMLDivElement>(function GlassCards(_props, ref) {
  return (
    <div ref={ref} className={styles.cards}>
      {CARDS.map((card) => (
        <article key={card.side} data-card={card.side} className={`${styles.card} ${styles[card.side]}`}>
          <canvas data-blur={CARD_BLUR} className={styles.glass} aria-hidden="true" />
          <div className={styles.body}>
            <h3 className={styles.title}>{card.title}</h3>
            <p className={styles.text}>{card.text}</p>
          </div>
          <span className={styles.paw} aria-hidden="true" />
        </article>
      ))}
    </div>
  );
});
