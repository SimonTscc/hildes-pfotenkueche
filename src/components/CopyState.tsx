import { forwardRef, type CSSProperties } from "react";
import styles from "./CopyState.module.css";

type Props = {
  variant: "hero" | "mid" | "final";
  line1: string;
  line2: string;
  text: string;
  button?: string;
  intro?: boolean;
};

const words = (line: string) => line.split(" ").filter(Boolean);

/** Ein Textblock: zweizeilige Headline + Absatz (+ Button). */
export const CopyState = forwardRef<HTMLElement, Props>(function CopyState(
  { variant, line1, line2, text, button, intro },
  ref,
) {
  const Heading = variant === "hero" ? "h1" : "h2";
  const first = words(line1);
  const second = words(line2);
  const renderLine = (list: string[], offset: number) =>
    list.map((word, i) => (
      <span key={i}>
        {i > 0 && " "}
        <span data-word className={styles.word} style={{ "--i": offset + i } as CSSProperties}>
          {word}
        </span>
      </span>
    ));

  return (
    <section ref={ref} className={[styles.block, styles[variant], intro && styles.intro].filter(Boolean).join(" ")}>
      <Heading className={styles.headline}>
        <span className={`trim sans ${styles.line1}`}>{renderLine(first, 0)}</span>
        <span className={`trim serif ${styles.line2}`}>{renderLine(second, first.length)}</span>
      </Heading>
      <div data-detail className={styles.detail}>
        <p className={styles.text}>{text}</p>
        {button && (
          <a href="#beratung" className={styles.button} data-cursor-label="Schnuppern">
            {button}
            <img src={`${import.meta.env.BASE_URL}pfote.svg`} alt="" width={16} height={16} className={styles.paw} />
          </a>
        )}
      </div>
    </section>
  );
});
