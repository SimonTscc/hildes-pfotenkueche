import { PILL_BLUR } from "../config";
import styles from "./Header.module.css";

const LINKS = [
  { label: "Über Hilde", href: "#ueber", active: true },
  { label: "Sortiment", href: "#sortiment" },
  { label: "Beratung", href: "#beratung" },
];

export function Header({ revealed }: { revealed: boolean }) {
  return (
    <header className={`${styles.header} ${revealed ? styles.revealed : ""}`}>
      <a href="#" className={styles.logo} aria-label="Hildes Pfotenküche">
        <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width={208} height={33} />
      </a>
      <div className={styles.right}>
        <nav className={styles.pill} aria-label="Hauptnavigation">
          <canvas data-blur={PILL_BLUR} className={styles.glass} aria-hidden="true" />
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`${styles.link} ${link.active ? styles.active : ""}`}
              aria-current={link.active ? "page" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className={styles.menu}>
          <button type="button" className={styles.menuLabel}>
            Menü
          </button>
          <button type="button" className={styles.menuRound} aria-label="Menü öffnen">
            <img src={`${import.meta.env.BASE_URL}menu.svg`} alt="" width={12} height={12} />
          </button>
        </div>
      </div>
    </header>
  );
}
