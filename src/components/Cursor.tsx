import { useEffect, useRef } from "react";
import { CURSOR_ANGLE_SMOOTHING, CURSOR_SMOOTHING, TRAIL } from "../config";
import { damp, dampFactor, reducedMotion } from "../lib/motion";
import styles from "./Cursor.module.css";

/** Pfoten-Cursor mit verblassender Spur. `introStarted` kommt als data-Attribut an. */
export function Cursor({ introStarted, unitRef }: { introStarted: boolean; unitRef: { current: number } }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pawRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current,
      ring = ringRef.current,
      paw = pawRef.current,
      label = labelRef.current,
      trailHost = trailRef.current;
    if (!root || !ring || !paw || !label || !trailHost) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const reduced = reducedMotion();
    const prints = Array.from(trailHost.children) as HTMLElement[];
    let x = innerWidth / 2,
      y = innerHeight / 2,
      tx = x,
      ty = y;
    let angle = 0,
      targetAngle = 0;
    let lastX = x,
      lastY = y,
      travelled = 0,
      printIndex = 0,
      side = 1;
    let last = performance.now();
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      tx = e.clientX;
      ty = e.clientY;
      root.classList.add(styles.visible);
    };
    const onLeave = () => root.classList.remove(styles.visible);
    const onOver = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest?.("a, button, [data-cursor-label]");
      root.classList.toggle(styles.hover, !!target);
      const text = target?.getAttribute("data-cursor-label");
      if (text) label.textContent = text;
      root.classList.toggle(styles.labelled, !!text);
    };

    const placePrint = () => {
      const el = prints[printIndex];
      printIndex = (printIndex + 1) % prints.length;
      const unit = unitRef.current || 1;
      const offset = 6 * unit * side;
      side *= -1;
      const nx = -Math.sin(angle),
        ny = Math.cos(angle);
      el.style.transform = `translate3d(${x + nx * offset}px, ${y + ny * offset}px, 0) translate(-50%, -50%) rotate(${angle + Math.PI / 2}rad)`;
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "";
      el.style.animationDuration = `${TRAIL.fadeMs}ms`;
    };

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const px = x,
        py = y;
      x = damp(x, tx, CURSOR_SMOOTHING, dt);
      y = damp(y, ty, CURSOR_SMOOTHING, dt);
      const dx = x - px,
        dy = y - py;
      const speed = Math.hypot(dx, dy) / Math.max(dt / 16.67, 0.001);
      if (!reduced && speed > 0.5) {
        targetAngle = Math.atan2(dy, dx);
        let diff = targetAngle - angle;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        angle += diff * dampFactor(CURSOR_ANGLE_SMOOTHING, dt);
      }
      root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      paw.style.setProperty("--angle", `${angle + Math.PI / 2}rad`);

      const visible = root.classList.contains(styles.visible) && root.dataset.intro === "true";
      if (!reduced && visible) {
        travelled += Math.hypot(x - lastX, y - lastY);
        if (travelled >= TRAIL.stepPx * (unitRef.current || 1)) {
          travelled = 0;
          placePrint();
        }
      }
      lastX = x;
      lastY = y;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.addEventListener("pointerover", onOver);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("pointerover", onOver);
    };
  }, [unitRef]);

  return (
    <>
      <div ref={trailRef} className={styles.trail} aria-hidden="true">
        {Array.from({ length: TRAIL.max }, (_, i) => (
          <span key={i} className={styles.print} />
        ))}
      </div>
      <div ref={rootRef} className={styles.cursor} data-intro={introStarted ? "true" : "false"} aria-hidden="true">
        <div ref={ringRef} className={styles.ring} />
        <div ref={pawRef} className={styles.pawWrap}>
          <span className={styles.paw} />
        </div>
        <span ref={labelRef} className={styles.label} />
      </div>
    </>
  );
}
