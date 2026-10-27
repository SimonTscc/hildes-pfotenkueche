import { DEPTH_STRENGTH, FRAME_ASPECT } from "../config";
import { createQuadProgram, fitCanvas, loseContext } from "./gl";
import type { Frame } from "./sequence";

const FRAGMENT = `
precision highp float;
uniform sampler2D uColorA;
uniform sampler2D uDepthA;
uniform sampler2D uColorB;
uniform sampler2D uDepthB;
uniform float uMix;
uniform vec2 uPointer;
uniform vec2 uStrength;
uniform vec2 uCoverScale;
uniform vec2 uResolution;
uniform float uPlaceholder;
varying vec2 vUv;
// Texturen liegen ungespiegelt vor (Zeile 0 oben), damit Bilder und ImageBitmaps gleich behandelt werden
vec2 flipY(vec2 uv) { return vec2(uv.x, 1.0 - uv.y); }
vec4 sampleFrame(sampler2D color, sampler2D depthMap, vec2 uv) {
  float depth = texture2D(depthMap, flipY(uv)).r;
  vec2 displaced = uv + uPointer * uStrength * (depth - 0.5) * 2.0;
  return texture2D(color, flipY(clamp(displaced, vec2(0.008), vec2(0.992))));
}
void main() {
  if (uPlaceholder > 0.5) {
    // warmer Platzhalter-Verlauf, solange kein Bild da ist
    vec2 p = vUv - 0.5;
    p.x *= uResolution.x / uResolution.y;
    float t = clamp(length(p) / 0.9, 0.0, 1.0);
    gl_FragColor = vec4(mix(vec3(58.0, 42.0, 30.0), vec3(30.0, 26.0, 22.0), t) / 255.0, 1.0);
    return;
  }
  vec2 uv = (vUv - 0.5) * uCoverScale + 0.5;
  vec4 a = sampleFrame(uColorA, uDepthA, uv);
  if (uMix < 0.001) { gl_FragColor = a; return; }
  gl_FragColor = mix(a, sampleFrame(uColorB, uDepthB, uv), uMix);
}`;

type Slot = { color: WebGLTexture; depth: WebGLTexture; frame: Frame | null };

const UPLOAD_COOLDOWN = 2; // Frames zwischen zwei Bild-Uploads

/**
 * Zeichnet die Sequenz mit Tiefen-Parallaxe (WebGL 1). Zwischen zwei Nachbarbildern wird überblendet,
 * damit die Fahrt auch bei langsamem Scrollen nicht in Bildsprüngen läuft.
 */
export class DepthRenderer {
  canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private buffer: WebGLBuffer;
  private slots: [Slot, Slot];
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private cooldown = 0;
  private shown: Slot | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error("WebGL nicht verfügbar");
    this.gl = gl;
    const { program, buffer } = createQuadProgram(gl, FRAGMENT);
    this.program = program;
    this.buffer = buffer;
    const names = ["uColorA", "uDepthA", "uColorB", "uDepthB", "uMix", "uPointer", "uStrength", "uCoverScale", "uResolution", "uPlaceholder"];
    for (const name of names) this.uniforms[name] = gl.getUniformLocation(program, name);
    gl.uniform2f(this.uniforms.uStrength, DEPTH_STRENGTH.x, DEPTH_STRENGTH.y);
    this.slots = [
      { color: this.createTexture(), depth: this.createTexture(), frame: null },
      { color: this.createTexture(), depth: this.createTexture(), frame: null },
    ];
  }

  private createTexture() {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
  }

  /** Liefert den Slot mit diesem Bild; lädt es sonst in den Slot, den `keep` nicht braucht. */
  private slotFor(frame: Frame, keep: Frame | null) {
    const hit = this.slots.find((s) => s.frame === frame);
    if (hit) return hit;
    // Hochladen kostet ein paar Millisekunden: direkt nach einem Upload lieber noch einen Frame das
    // vorhandene Bild zeigen, als die Seite stocken zu lassen
    if (this.cooldown > 0 && this.slots.some((s) => s.frame)) return null;
    this.cooldown = UPLOAD_COOLDOWN;
    const gl = this.gl;
    const slot = this.slots[0].frame === keep && keep ? this.slots[1] : this.slots[0];
    gl.bindTexture(gl.TEXTURE_2D, slot.color);
    // RGBA ist der schnelle Upload-Pfad; RGB/LUMINANCE zwingen den Browser zu einer Umrechnung auf der CPU
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame.colorBitmap ?? frame.color);
    gl.bindTexture(gl.TEXTURE_2D, slot.depth);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame.depthBitmap ?? frame.depth);
    slot.frame = frame;
    return slot;
  }

  private bind(unit: number, tex: WebGLTexture, uniform: string) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(this.uniforms[uniform], unit);
  }

  /**
   * Zeichnet Bild `a`, zu `mix` mit Bild `b` überblendet (oder den Platzhalter, wenn `a` fehlt).
   * false, wenn die Canvas noch keine Größe hat.
   */
  draw(a: Frame | null, b: Frame | null, mix: number, pointerX: number, pointerY: number) {
    if (!fitCanvas(this.canvas)) return false;
    const gl = this.gl;
    const { width, height } = this.canvas;
    gl.viewport(0, 0, width, height);
    gl.uniform2f(this.uniforms.uResolution, width, height);
    gl.uniform1f(this.uniforms.uPlaceholder, a ? 0 : 1);

    if (a) {
      // Pro Frame höchstens ein Upload. Ist A noch nicht da, das Bild im Speicher zeigen, das am
      // nächsten liegt (B oder das zuletzt gezeigte); fehlt B, ohne Überblendung.
      this.cooldown = Math.max(0, this.cooldown - 1);
      const slotA = this.slotFor(a, b) ?? this.slots.find((s) => s.frame === b) ?? this.shown;
      const slotB = b && b !== a && mix > 0.001 ? this.slotFor(b, slotA?.frame ?? a) : null;
      if (slotA) {
        const useMix = slotB && slotB !== slotA && slotA.frame === a ? mix : 0;
        this.bind(0, slotA.color, "uColorA");
        this.bind(1, slotA.depth, "uDepthA");
        this.bind(2, (slotB ?? slotA).color, "uColorB");
        this.bind(3, (slotB ?? slotA).depth, "uDepthB");
        gl.uniform1f(this.uniforms.uMix, useMix);
        this.shown = slotA;
      }
    }

    const view = width / height;
    if (view > FRAME_ASPECT) gl.uniform2f(this.uniforms.uCoverScale, 1, FRAME_ASPECT / view);
    else gl.uniform2f(this.uniforms.uCoverScale, view / FRAME_ASPECT, 1);
    gl.uniform2f(this.uniforms.uPointer, pointerX, pointerY);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return true;
  }

  dispose() {
    const gl = this.gl;
    for (const slot of this.slots) {
      gl.deleteTexture(slot.color);
      gl.deleteTexture(slot.depth);
    }
    gl.deleteBuffer(this.buffer);
    gl.deleteProgram(this.program);
    loseContext(gl);
  }
}
