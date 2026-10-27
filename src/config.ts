export const FRAME_COUNT = 120;
export const FRAME_URL = (i: number) => `${import.meta.env.BASE_URL}frames/kueche-${String(i).padStart(3, "0")}.jpg`;
export const DEPTH_URL = (i: number) => `${import.meta.env.BASE_URL}frames/tiefe-${String(i).padStart(3, "0")}.webp`;
export const FRAME_ASPECT = 1920 / 1080;
export const SCROLL_SMOOTHING = 0.09; // pro 60-fps-Frame
export const DEPTH_STRENGTH = { x: 0.0144, y: 0.0108 };
export const POINTER_SMOOTHING = 0.055; // pro 60-fps-Frame
export const CURSOR_SMOOTHING = 0.2; // pro 60-fps-Frame
export const CURSOR_ANGLE_SMOOTHING = 0.15;

export type Timing = { enter?: [number, number]; exit?: [number, number] };

export const TIMING: Record<"hero" | "mid" | "cards" | "final", Timing> = {
  // im Scroll-Fortschritt 0…1
  hero: { exit: [0.16, 0.28] },
  mid: { enter: [0.38, 0.46], exit: [0.58, 0.68] },
  cards: { enter: [0.76, 0.84] },
  final: { enter: [0.82, 0.9] },
};
export const CARD_LEFT: [number, number] = [0.76, 0.84];
export const CARD_RIGHT: [number, number] = [0.79, 0.87];
export const ENTER_RISE = 24,
  EXIT_LIFT = -16; // Design-px
export const MIN_LOADER_MS = 1500,
  LOADER_TIMEOUT_MS = 8000,
  MELT_MS = 1150,
  INTRO_AT_MS = 760;
export const PILL_BLUR = 16,
  CARD_BLUR = 24; // CSS-px
export const TRAIL = { stepPx: 46, max: 8, fadeMs: 900 }; // Pfotenspur des Cursors
export const PRELOADER_PAWS = 14;
