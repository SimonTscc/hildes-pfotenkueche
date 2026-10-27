// Rendert die Kamerafahrt in ../../public/frames (oder in den als Argument übergebenen Ordner).
// Aufruf: npm run render            → alle 120 Bilder
//         node render.mjs <ordner> 0 40 80 119   → nur einzelne Bilder (Probe)
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { createServer } from "vite";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] ?? resolve(here, "../../public/frames"));
const only = process.argv.slice(3).map(Number);
const frames = only.length ? only : Array.from({ length: 120 }, (_, i) => i);
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

await mkdir(out, { recursive: true });
const server = await createServer({ root: here, logLevel: "error", server: { port: 4352, strictPort: false } });
await server.listen();
const url = server.resolvedUrls.local[0];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11"],
});
try {
  const page = await browser.newPage();
  page.on("console", (m) => m.type() === "error" && console.error("Seite:", m.text()));
  page.on("pageerror", (e) => console.error("Seitenfehler:", e.message));
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.waitForFunction("window.sceneReady === true", { timeout: 120000 });
  const pad = (i) => String(i).padStart(3, "0");
  const t0 = Date.now();
  for (const i of frames) {
    for (const mode of ["color", "depth"]) {
      const data = await page.evaluate((i, mode) => window.renderFrame(i, mode), i, mode);
      const file = mode === "color" ? `kueche-${pad(i)}.jpg` : `tiefe-${pad(i)}.webp`;
      await writeFile(resolve(out, file), Buffer.from(data.split(",")[1], "base64"));
    }
    process.stdout.write(`Bild ${i} fertig (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
  }
} finally {
  await browser.close();
  await server.close();
}
