import { ENTER_RISE, EXIT_LIFT, type Timing } from "../config";

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (t: number) => t * t * (3 - 2 * t);
export const invLerp = (a: number, b: number, v: number) => clamp((v - a) / (b - a || 1));

/** Bildratenunabhängiger Glättungsfaktor aus einem „pro 60-fps-Frame“-Wert. */
export const dampFactor = (f: number, dtMs: number) => 1 - Math.pow(1 - f, Math.min(dtMs, 100) / 16.67);
export const damp = (value: number, target: number, f: number, dtMs: number) =>
  lerp(value, target, dampFactor(f, dtMs));

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function stateStyle(progress: number, { enter, exit }: Timing) {
  let opacity = 1,
    y = 0;
  if (enter && progress < enter[1]) {
    const t = smoothstep(invLerp(enter[0], enter[1], progress));
    opacity = t;
    y = lerp(ENTER_RISE, 0, t);
  } else if (exit && progress > exit[0]) {
    const t = smoothstep(invLerp(exit[0], exit[1], progress));
    opacity = 1 - t;
    y = lerp(0, EXIT_LIFT, t);
  }
  return { opacity, y, visible: opacity > 0.002 };
}

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
