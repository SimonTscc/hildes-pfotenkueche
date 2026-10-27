import type { CSSProperties, RefObject } from "react";
import { PRELOADER_PAWS } from "../config";
import styles from "./Preloader.module.css";

export type Phase = "loading" | "melting" | "ready" | "done";

export type PreloaderRefs = {
  meltHost: RefObject<HTMLDivElement | null>;
  count: RefObject<HTMLSpanElement | null>;
  bar: RefObject<HTMLDivElement | null>;
  paws: RefObject<HTMLDivElement | null>;
};

/** Zähler, Fortschrittslinie, Pfotenspur und Host der Schmelz-Canvas. */
export function Preloader({ phase, refs }: { phase: Phase; refs: PreloaderRefs }) {
  return (
    <div className={`${styles.preloader} ${styles[phase]}`} aria-hidden={phase === "done" || undefined}>
      <div ref={refs.meltHost} className={styles.melt} />
      <div className={styles.ui}>
        <p className={`trim serif ${styles.counter}`} role="status" aria-label="Wird geladen">
          <span ref={refs.count}>0</span>&#8239;%
        </p>
        <p className={styles.note}>Der Napf wird gefüllt …</p>
        <div ref={refs.paws} className={styles.paws}>
          {Array.from({ length: PRELOADER_PAWS }, (_, i) => (
            <span
              key={i}
              className={styles.paw}
              style={
                {
                  left: `${((i + 0.5) / PRELOADER_PAWS) * 100}%`,
                  "--versatz": i % 2 === 0 ? -2 : 2,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div className={styles.track}>
          <div ref={refs.bar} className={styles.bar} />
        </div>
      </div>
    </div>
  );
}

export const PAW_SHOWN_CLASS = styles.shown;
