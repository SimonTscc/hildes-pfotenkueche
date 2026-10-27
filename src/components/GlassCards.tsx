import { forwardRef } from "react";
import { CARD_BLUR } from "../config";
import styles from "./GlassCards.module.css";

const CARDS = [
  {
    title: "BARF-Menüs",
    text: "Fertig gemischte Komplettmenüs mit Rind, Pute, Lamm oder Pferd – einfach auftauen und füttern.",
    side: "left",
  },
  {
    title: "Persönliche Beratung",
    text: "Hilde stellt mit dir den passenden Futterplan zusammen – auch für Allergiker und Senioren.",
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
