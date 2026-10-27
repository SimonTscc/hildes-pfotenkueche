import { createQuadProgram, fitCanvas, loseContext } from "./gl";

const FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform float uProgress;
uniform float uTime;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(13.7, 8.4); a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = vUv;
  vec2 p = uv - 0.5;
  p.x *= uResolution.x / uResolution.y;
  float n = fbm(uv * 3.1 + vec2(uTime * 0.035, -uTime * 0.025));
  float detail = fbm(uv * 8.4 - vec2(uTime * 0.02));
  float lobes = sin(atan(p.y, p.x) * 6.0 + uTime * 0.4) * 0.035;
  float field = length(p) + lobes + (n - 0.5) * 0.2 + (detail - 0.5) * 0.06;
  // 1.02 bei 16:10 und schmaler; breitere Screens nach ihrer Eckdistanz skaliert, + 0.1 Reserve für Rauschen
  // und Ausbuchtungen: bei uProgress 1 bleibt auf keinem Screen etwas übrig
  float reach = max(1.02, 1.02 * length(vec2(0.5 * uResolution.x / uResolution.y, 0.5)) / 0.9434) + 0.1;
  float threshold = mix(-0.22, reach, uProgress);
  float edge = 0.045;
  float alpha = smoothstep(threshold - edge, threshold + edge, field);
  float rim = 1.0 - smoothstep(0.006, 0.052, abs(field - threshold));
  float coverage = max(alpha, rim * 0.22);
  vec3 linen = vec3(239.0, 230.0, 214.0) / 255.0;
  vec3 terracotta = vec3(200.0, 105.0, 63.0) / 255.0;
  vec3 color = mix(linen, terracotta, rim * 0.75);
  gl_FragColor = vec4(color * coverage, coverage);
}`;

/** Der Leinen-Screen des Preloaders und sein Wegschmelzen. */
export class MeltRenderer {
  canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private buffer: WebGLBuffer;
  private uResolution: WebGLUniformLocation | null;
  private uProgress: WebGLUniformLocation | null;
  private uTime: WebGLUniformLocation | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!gl) throw new Error("WebGL nicht verfügbar");
    this.gl = gl;
    const { program, buffer } = createQuadProgram(gl, FRAGMENT);
    this.program = program;
    this.buffer = buffer;
    this.uResolution = gl.getUniformLocation(program, "uResolution");
    this.uProgress = gl.getUniformLocation(program, "uProgress");
    this.uTime = gl.getUniformLocation(program, "uTime");
  }

  draw(progress: number) {
    if (!fitCanvas(this.canvas)) return;
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(this.uResolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uProgress, progress);
    gl.uniform1f(this.uTime, performance.now() / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose() {
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
    loseContext(this.gl);
  }
}
