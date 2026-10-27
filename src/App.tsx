import { useEffect, useRef, useState } from "react";
import { Angebot } from "./components/Angebot";
import { CopyState } from "./components/CopyState";
import { Cursor } from "./components/Cursor";
import { GlassCards } from "./components/GlassCards";
import { Header } from "./components/Header";
import { PAW_SHOWN_CLASS, Preloader, type Phase, type PreloaderRefs } from "./components/Preloader";
import {
  CARD_LEFT,
  CARD_RIGHT,
  FRAME_COUNT,
  INTRO_AT_MS,
  LOADER_TIMEOUT_MS,
  MELT_MS,
  MIN_LOADER_MS,
  POINTER_SMOOTHING,
  PRELOADER_PAWS,
  SCROLL_SMOOTHING,
  TIMING,
  type Timing,
} from "./config";
import { DepthRenderer } from "./lib/depthRenderer";
import { drawGlass } from "./lib/glassBlur";
import { MeltRenderer } from "./lib/meltRenderer";
import { clamp, damp, easeInOutCubic, invLerp, reducedMotion, smoothstep, stateStyle } from "./lib/motion";
import { Sequence } from "./lib/sequence";
import styles from "./App.module.css";

export default function App() {
  const [phase, setPhase] = useState<Phase>("loading");
  const introStarted = phase === "ready" || phase === "done";

  const mainRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneHostRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const midRef = useRef<HTMLElement>(null);
  const finalRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef(1);
  const preloaderRefs: PreloaderRefs = {
    meltHost: useRef<HTMLDivElement>(null),
    count: useRef<HTMLSpanElement>(null),
    bar: useRef<HTMLDivElement>(null),
    paws: useRef<HTMLDivElement>(null),
  };
  const { meltHost: meltHostRef, count: countRef, bar: barRef, paws: pawsRef } = preloaderRefs;

  // Ein einziger Mount-Effect steuert Laden, Preloader, Schmelzen und die Scroll-Story.
  useEffect(() => {
    const main = mainRef.current,
      stage = stageRef.current,
      sceneHost = sceneHostRef.current,
      measure = measureRef.current,
      meltHost = meltHostRef.current,
      count = countRef.current,
      bar = barRef.current,
      pawHost = pawsRef.current,
      cards = cardsRef.current,
      hero = heroRef.current,
      mid = midRef.current,
      final = finalRef.current;
    if (!main || !stage || !sceneHost || !measure || !meltHost || !count || !bar || !pawHost || !cards) return;
    if (!hero || !mid || !final) return;

    let alive = true;
    const reduced = reducedMotion();
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(() => alive && fn(), ms));
    const go = (next: Phase) => alive && setPhase(next);

    // Szene
    const sceneCanvas = document.createElement("canvas");
    sceneCanvas.setAttribute("role", "img");
    sceneCanvas.setAttribute("aria-label", "Kamerafahrt über frische BARF-Zutaten bis zum gefüllten Napf");
    sceneHost.appendChild(sceneCanvas);
    let scene: DepthRenderer | null = null;
    try {
      scene = new DepthRenderer(sceneCanvas);
    } catch (error) {
      console.warn(error);
    }

    // Preloader-Leinen
    const meltCanvas = document.createElement("canvas");
    meltHost.appendChild(meltCanvas);
    let melt: MeltRenderer | null = null;
    try {
      melt = new MeltRenderer(meltCanvas);
      melt.draw(0);
    } catch (error) {
      console.warn(error);
      meltHost.style.background = "var(--leinen)";
    }

    // Laden: Bild 0 + beide Fonts; Fehler werden geloggt, nach LOADER_TIMEOUT_MS ist es in jedem Fall bereit
    const sequence = new Sequence();
    let ready = false;
    const settle = (p: Promise<unknown>, what: string) =>
      p.then(
        (ok) => {
          if (ok === false) console.warn(`${what} nicht verfügbar, weiter mit Platzhalter`);
        },
        (error) => console.warn(what, error),
      );
    void Promise.all([
      settle(sequence.first, "Bild 0"),
      settle(document.fonts.load('400 1em "Instrument Sans"'), "Instrument Sans"),
      settle(document.fonts.load('italic 400 1em "Instrument Serif"'), "Instrument Serif"),
    ]).then(() => (ready = true));
    later(() => (ready = true), LOADER_TIMEOUT_MS);

    // Einheit, Scroll-Ziel, Pointer
    let loader: "loading" | "melting" | "off" = "loading";
    let target = 0,
      progress = 0;
    const measureUnit = () => (unitRef.current = measure.getBoundingClientRect().width / 100 || 1);
    const measureScroll = () => {
      target = clamp(-main.getBoundingClientRect().top / Math.max(1, main.offsetHeight - innerHeight), 0, 1);
    };
    const onResize = () => {
      measureUnit();
      measureScroll();
      if (loader === "loading") melt?.draw(0);
    };
    measureUnit();
    measureScroll();

    let pointerTX = 0,
      pointerTY = 0,
      pointerX = 0,
      pointerY = 0;
    const onPointer = (e: PointerEvent) => {
      pointerTX = (e.clientX / innerWidth - 0.5) * 2;
      pointerTY = (0.5 - e.clientY / innerHeight) * 2;
    };
    const onLeave = () => {
      pointerTX = 0;
      pointerTY = 0;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", measureScroll, { passive: true });
    window.addEventListener("pointermove", onPointer);
    document.documentElement.addEventListener("mouseleave", onLeave);

    const paws = Array.from(pawHost.children) as HTMLElement[];
    const pawShown = new Array<boolean>(PRELOADER_PAWS).fill(false);
    const wordsOf = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>("[data-word]"));
    const revealBlocks = [
      { el: mid, timing: TIMING.mid, words: wordsOf(mid) },
      { el: final, timing: TIMING.final, words: wordsOf(final) },
    ];
    const cardLeft = cards.querySelector<HTMLElement>('[data-card="left"]');
    const cardRight = cards.querySelector<HTMLElement>('[data-card="right"]');

    const applyState = (el: HTMLElement, p: number, timing: Timing) => {
      const { opacity, y, visible } = stateStyle(p, timing);
      el.style.opacity = String(opacity);
      el.style.transform = `translate3d(0, ${y * unitRef.current}px, 0)`;
      el.style.visibility = visible ? "visible" : "hidden";
    };

    const showProgress = (value: number) => {
      count.textContent = String(value);
      bar.style.transform = `scaleX(${value / 100})`;
      paws.forEach((paw, i) => {
        if (!pawShown[i] && value / 100 >= (i + 0.5) / PRELOADER_PAWS) {
          pawShown[i] = true;
          paw.classList.add(PAW_SHOWN_CLASS);
        }
      });
    };

    const start = performance.now();
    let meltStart = 0;
    let last = start;
    let raf = 0;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      // Preloader (M1, M2)
      if (loader === "loading") {
        const elapsed = now - start;
        showProgress(Math.floor(Math.min(elapsed / MIN_LOADER_MS, 1, ready ? 1 : 0.99) * 100));
        if (elapsed >= MIN_LOADER_MS && ready) {
          showProgress(100);
          if (reduced) {
            loader = "off";
            go("ready");
            later(() => go("done"), 200);
          } else {
            loader = "melting";
            meltStart = now;
            go("melting");
            later(() => go("ready"), INTRO_AT_MS);
          }
        }
      } else if (loader === "melting") {
        const t = clamp((now - meltStart) / MELT_MS);
        melt?.draw(easeInOutCubic(t));
        if (t >= 1) {
          loader = "off";
          go("done");
        }
      }

      // Szene (M4)
      progress = damp(progress, target, SCROLL_SMOOTHING, dt);
      // zwischen den zwei Nachbarbildern überblenden statt auf das nächste zu springen
      const exact = progress * (FRAME_COUNT - 1);
      const index = Math.floor(exact);
      const next = Math.min(index + 1, FRAME_COUNT - 1);
      sequence.request(index);
      sequence.request(next);
      sequence.warm(index);
      pointerX = reduced ? 0 : damp(pointerX, pointerTX, POINTER_SMOOTHING, dt);
      pointerY = reduced ? 0 : damp(pointerY, pointerTY, POINTER_SMOOTHING, dt);
      const frameA = sequence.nearest(index)?.frame ?? null;
      const frameB = sequence.frames[next];
      const drawn = scene?.draw(frameA, frameB, exact - index, pointerX, pointerY);

      // Textblöcke und Karten
      applyState(hero, progress, TIMING.hero);
      applyState(mid, progress, TIMING.mid);
      applyState(final, progress, TIMING.final);
      applyState(cards, progress, TIMING.cards);
      for (const { el, timing, words } of revealBlocks) {
        const [a, b] = timing.enter!;
        const local = invLerp(a, b, progress);
        const n = words.length;
        words.forEach((word, i) => word.style.setProperty("--reveal", String(clamp((local - (i / n) * 0.58) / 0.34))));
        el.style.setProperty("--detail", String(clamp((local - 0.62) / 0.38)));
      }
      const t1 = smoothstep(invLerp(CARD_LEFT[0], CARD_LEFT[1], progress));
      const t2 = smoothstep(invLerp(CARD_RIGHT[0], CARD_RIGHT[1], progress));
      const rot = reduced ? 0 : 1;
      const u = unitRef.current;
      if (cardLeft) cardLeft.style.transform = `translate3d(0, ${(1 - t1) * 20 * u}px, 0) rotate(${(1 - t1) * -2 * rot}deg)`;
      if (cardRight) cardRight.style.transform = `translate3d(0, ${(1 - t2) * 20 * u}px, 0) rotate(${(1 - t2) * 2 * rot}deg)`;

      // Glas
      if (drawn) drawGlass(stage, sceneCanvas);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", measureScroll);
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      sequence.dispose();
      scene?.dispose();
      melt?.dispose();
      sceneCanvas.remove();
      meltCanvas.remove();
      meltHost.style.background = "";
    };
  }, [meltHostRef, countRef, barRef, pawsRef]);

  return (
    <>
      <main ref={mainRef} className={styles.main}>
        <div ref={stageRef} className={styles.stage}>
          <div ref={measureRef} className={styles.measure} aria-hidden="true" />
          <div ref={sceneHostRef} className={styles.scene} />
          <div className={styles.shade} aria-hidden="true" />
          <div className={styles.content}>
            <GlassCards ref={cardsRef} />
            <CopyState
              ref={heroRef}
              variant="hero"
              intro={introStarted}
              line1="Frisch. Roh. Artgerecht."
              line2="Mit Liebe gebarft."
              text="Hilde erstellt individuelle BARF-Futterpläne, berät dich persönlich und analysiert die Ernährung deines Tieres – damit du genau weißt, was in den Napf gehört."
              button="Plan anfragen"
            />
            <CopyState
              ref={midRef}
              variant="mid"
              line1="Ausgewogen gebarft."
              line2="Genau berechnet."
              text="Fleisch, Innereien, Knochen, Gemüse und Öle im richtigen Verhältnis – berechnet für Alter, Größe, Aktivität und Bedürfnisse deines Tieres."
            />
            <CopyState
              ref={finalRef}
              variant="final"
              line1="Für Hund und Katz’"
              line2="aus Hildes Küche."
              text="Damit der Napf leer ist und der Schwanz wedelt."
            />
          </div>
          <Header revealed={introStarted} />
          <Preloader phase={phase} refs={preloaderRefs} />
        </div>
      </main>
      <Angebot />
      <Cursor introStarted={introStarted} unitRef={unitRef} />
    </>
  );
}
