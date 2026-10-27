import { DEPTH_URL, FRAME_COUNT, FRAME_URL } from "../config";

export type Frame = { color: HTMLImageElement; depth: HTMLImageElement };

type Slot = "idle" | "loading" | "done" | "failed";

const BATCH_FIRST = 8;
const BATCH_SIZE = 4;
const BATCH_PAUSE_MS = 20;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Bild nicht geladen: ${src}`));
    image.src = src;
  });
}

/** Lädt die Bildsequenz (Farbe + Tiefe) in Prioritätsreihenfolge. */
export class Sequence {
  frames: (Frame | null)[] = new Array(FRAME_COUNT).fill(null);
  state: Slot[] = new Array(FRAME_COUNT).fill("idle");
  first: Promise<boolean>;
  private disposed = false;
  private timer = 0;

  constructor() {
    this.first = this.load(0).then((ok) => {
      if (ok && !this.disposed) this.runBatches();
      return ok;
    });
  }

  /** Vom Scroll angefordertes Bild: lädt sofort, außerhalb der Batches. */
  request(index: number) {
    if (this.state[index] === "idle") void this.load(index);
  }

  /** Nächstgelegenes geladenes Bild: index, index − 1, index + 1, index − 2, … */
  nearest(index: number): { frame: Frame; index: number } | null {
    for (let d = 0; d < FRAME_COUNT; d++) {
      for (const i of d === 0 ? [index] : [index - d, index + d]) {
        const frame = i >= 0 && i < FRAME_COUNT ? this.frames[i] : null;
        if (frame) return { frame, index: i };
      }
    }
    return null;
  }

  dispose() {
    this.disposed = true;
    window.clearTimeout(this.timer);
  }

  private async load(index: number) {
    if (this.state[index] !== "idle") return this.state[index] === "done";
    this.state[index] = "loading";
    try {
      const [color, depth] = await Promise.all([loadImage(FRAME_URL(index)), loadImage(DEPTH_URL(index))]);
      if (this.disposed) return false;
      this.frames[index] = { color, depth };
      this.state[index] = "done";
      return true;
    } catch (error) {
      if (!this.disposed) console.warn(error instanceof Error ? error.message : error);
      this.state[index] = "failed";
      return false;
    }
  }

  private async runBatches() {
    let next = 1;
    let size = BATCH_FIRST;
    while (next < FRAME_COUNT && !this.disposed) {
      const batch: Promise<boolean>[] = [];
      for (let i = next; i < Math.min(next + size, FRAME_COUNT); i++) batch.push(this.load(i));
      await Promise.all(batch);
      next += size;
      size = BATCH_SIZE;
      if (next < FRAME_COUNT && !this.disposed) {
        await new Promise<void>((resolve) => (this.timer = window.setTimeout(resolve, BATCH_PAUSE_MS)));
      }
    }
  }
}
