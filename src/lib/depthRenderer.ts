import { DEPTH_STRENGTH, FRAME_ASPECT } from "../config";
import { createQuadProgram, fitCanvas, loseContext } from "./gl";
import type { Frame } from "./sequence";

const FRAGMENT = `
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform vec2 uPointer;
uniform vec2 uStrength;
uniform vec2 uCoverScale;
uniform vec2 uResolution;
uniform float uPlaceholder;
varying vec2 vUv;
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
  float depth = texture2D(uDepth, uv).r;
  vec2 displaced = uv + uPointer * uStrength * (depth - 0.5) * 2.0;
  displaced = clamp(displaced, vec2(0.008), vec2(0.992));
  gl_FragColor = texture2D(uColor, displaced);
}`;

/** Zeichnet ein Bild der Sequenz mit Tiefen-Parallaxe (WebGL 1). */
export class DepthRenderer {
  canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private buffer: WebGLBuffer;
  private colorTex: WebGLTexture;
  private depthTex: WebGLTexture;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private current: Frame | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error("WebGL nicht verfügbar");
    this.gl = gl;
    const { program, buffer } = createQuadProgram(gl, FRAGMENT);
    this.program = program;
    this.buffer = buffer;
    for (const name of ["uColor", "uDepth", "uPointer", "uStrength", "uCoverScale", "uResolution", "uPlaceholder"]) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }
    gl.uniform1i(this.uniforms.uColor, 0);
    gl.uniform1i(this.uniforms.uDepth, 1);
    gl.uniform2f(this.uniforms.uStrength, DEPTH_STRENGTH.x, DEPTH_STRENGTH.y);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    this.colorTex = this.createTexture(0);
    this.depthTex = this.createTexture(1);
  }

  private createTexture(unit: number) {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
  }

  /** Zeichnet das Bild (oder den Platzhalter bei null). false, wenn die Canvas noch keine Größe hat. */
  draw(frame: Frame | null, pointerX: number, pointerY: number) {
    if (!fitCanvas(this.canvas)) return false;
    const gl = this.gl;
    const { width, height } = this.canvas;
    gl.viewport(0, 0, width, height);
    gl.uniform2f(this.uniforms.uResolution, width, height);

    if (frame && frame !== this.current) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.colorTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, frame.color);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.depthTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, frame.depth);
      this.current = frame;
    }
    gl.uniform1f(this.uniforms.uPlaceholder, frame ? 0 : 1);

    const view = width / height;
    if (view > FRAME_ASPECT) gl.uniform2f(this.uniforms.uCoverScale, 1, FRAME_ASPECT / view);
    else gl.uniform2f(this.uniforms.uCoverScale, view / FRAME_ASPECT, 1);
    gl.uniform2f(this.uniforms.uPointer, pointerX, pointerY);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return true;
  }

  dispose() {
    const gl = this.gl;
    gl.deleteTexture(this.colorTex);
    gl.deleteTexture(this.depthTex);
    gl.deleteBuffer(this.buffer);
    gl.deleteProgram(this.program);
    loseContext(gl);
  }
}
