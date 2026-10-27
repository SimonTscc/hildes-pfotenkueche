import { DEPTH_URL, FRAME_COUNT, FRAME_URL } from "../config";

/** Ein Bild der Fahrt. Die Bitmaps sind vorab dekodierte Kopien rund um die Scroll-Position. */
export type Frame = {
  color: HTMLImageElement;
  depth: HTMLImageElement;
  colorBitmap?: ImageBitmap;
  depthBitmap?: ImageBitmap;
  warming?: boolean;
};

type Slot = "idle" | "loading" | "done" | "failed";

const BATCH_FIRST = 8;
const BATCH_SIZE = 4;
const BATCH_PAUSE_MS = 20;
// Fenster der vorab dekodierten Bilder (vor/hinter der Position) und ab wann sie wieder freigegeben werden
const WARM_BEHIND = 6,
  WARM_AHEAD = 12,
  KEEP = 24;

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

  /**
   * Dekodiert die Bilder um `index` im Hintergrund (createImageBitmap), damit das Hochladen in WebGL
   * beim Scrollen nicht erst ein JPEG entpacken muss. Weit entfernte Bitmaps werden freigegeben.
   */
  warm(index: number) {
    if (typeof createImageBitmap !== "function") return;
    for (let i = Math.max(0, index - WARM_BEHIND); i <= Math.min(FRAME_COUNT - 1, index + WARM_AHEAD); i++) {
      const frame = this.frames[i];
      if (!frame || frame.colorBitmap || frame.warming) continue;
      frame.warming = true;
      Promise.all([createImageBitmap(frame.color), createImageBitmap(frame.depth)]).then(
        ([color, depth]) => {
          frame.warming = false;
          if (this.disposed) return void (color.close(), depth.close());
          frame.colorBitmap = color;
          frame.depthBitmap = depth;
        },
        () => (frame.warming = false),
      );
    }
    this.frames.forEach((frame, i) => {
      if (frame?.colorBitmap && Math.abs(i - index) > KEEP) {
        frame.colorBitmap.close();
        frame.depthBitmap?.close();
        frame.colorBitmap = frame.depthBitmap = undefined;
      }
    });
  }

  dispose() {
    this.disposed = true;
    window.clearTimeout(this.timer);
    for (const frame of this.frames) {
      frame?.colorBitmap?.close();
      frame?.depthBitmap?.close();
    }
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
