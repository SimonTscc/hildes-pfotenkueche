// Prozedurale 3D-Szene für die Kamerafahrt: Eichentisch mit BARF-Zutaten → Rührschüssel → Napf „HILDE“ mit Hundepfote.
// Erzeugt pro Bild ein Farbbild (1920 × 1080) und eine Tiefenkarte (960 × 540, weiß = nah).
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";

const FRAMES = 120;

// ---------- Zufall und Rauschen ----------
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const rr = (a, b) => a + (b - a) * rand();

function hash3(x, y, z) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const l = (a, b, t) => a + (b - a) * t;
  const h = (dx, dy, dz) => hash3(ix + dx, iy + dy, iz + dz);
  return l(
    l(l(h(0, 0, 0), h(1, 0, 0), u), l(h(0, 1, 0), h(1, 1, 0), u), v),
    l(l(h(0, 0, 1), h(1, 0, 1), u), l(h(0, 1, 1), h(1, 1, 1), u), v),
    w,
  );
}
const fbm3 = (x, y, z, o = 4) => {
  let v = 0, a = 0.5;
  for (let i = 0; i < o; i++) { v += a * noise3(x, y, z); x *= 2.03; y *= 2.03; z *= 2.03; a *= 0.5; }
  return v;
};

// ---------- Texturen ----------
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function woodTexture() {
  return canvasTex(2048, 2048, (g, w, h) => {
    const planks = 6;
    const ph = h / planks;
    for (let p = 0; p < planks; p++) {
      const base = [52 + rr(-6, 8), 33 + rr(-4, 6), 20 + rr(-3, 4)];
      g.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
      g.fillRect(0, p * ph, w, ph);
      const off = rr(0, 1000);
      for (let i = 0; i < 260; i++) {
        const y0 = p * ph + rr(0, ph);
        const light = rand() < 0.5;
        g.strokeStyle = light ? `rgba(120,80,45,${rr(0.05, 0.18)})` : `rgba(15,8,4,${rr(0.08, 0.3)})`;
        g.lineWidth = rr(0.6, 3.2);
        g.beginPath();
        for (let x = 0; x <= w; x += 16) {
          const y = y0 + Math.sin((x + off) * 0.004 + i) * rr(1, 3) + (fbm3(x * 0.002, y0 * 0.01, p) - 0.5) * 30;
          if (x === 0) g.moveTo(x, y); else g.lineTo(x, Math.min(Math.max(y, p * ph + 2), (p + 1) * ph - 2));
        }
        g.stroke();
      }
      // Äste
      for (let k = 0; k < 2; k++) {
        const kx = rr(0, w), ky = p * ph + rr(20, ph - 20);
        const grd = g.createRadialGradient(kx, ky, 2, kx, ky, rr(14, 30));
        grd.addColorStop(0, "rgba(20,10,5,0.75)");
        grd.addColorStop(1, "rgba(20,10,5,0)");
        g.fillStyle = grd;
        g.beginPath(); g.ellipse(kx, ky, 46, 18, 0, 0, Math.PI * 2); g.fill();
      }
      // Fuge
      g.fillStyle = "rgba(8,4,2,0.85)";
      g.fillRect(0, p * ph, w, 3);
    }
    const img = g.getImageData(0, 0, w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 10;
      img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
  });
}

function boardTexture() {
  return canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = "#9c6d42"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      g.strokeStyle = rand() < 0.5 ? `rgba(70,40,20,${rr(0.08, 0.25)})` : `rgba(200,150,100,${rr(0.05, 0.15)})`;
      g.lineWidth = rr(0.5, 2.5);
      const y0 = rr(0, h);
      g.beginPath();
      for (let x = 0; x <= w; x += 12) g.lineTo(x, y0 + Math.sin(x * 0.01 + i) * 3);
      g.stroke();
    }
    // Messerspuren
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = `rgba(60,35,18,${rr(0.1, 0.3)})`;
      g.lineWidth = 0.8;
      const x = rr(0, w), y = rr(0, h), a = rr(-0.6, 0.6), l = rr(20, 90);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
  });
}

function linenTexture() {
  return canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = "#e6dccb"; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) {
      g.fillStyle = `rgba(150,130,100,${rr(0.04, 0.12)})`;
      g.fillRect(0, y, w, 1);
    }
    for (let x = 0; x < w; x += 3) {
      g.fillStyle = `rgba(255,250,240,${rr(0.03, 0.1)})`;
      g.fillRect(x, 0, 1, h);
    }
    // eingewebter Streifen
    g.fillStyle = "rgba(160,70,45,0.55)";
    g.fillRect(0, 90, w, 14); g.fillRect(0, 116, w, 5);
  });
}

function meatTexture(fat = 0.6) {
  return canvasTex(512, 512, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = fbm3(x * 0.02, y * 0.02, 3.3, 5);
      const vein = Math.abs(Math.sin(x * 0.03 + n * 9)) < 0.06 * fat ? 1 : 0;
      const i = (y * w + x) * 4;
      const r = 140 + n * 70, gg = 22 + n * 25, b = 28 + n * 20;
      img.data[i] = vein ? 236 : r; img.data[i + 1] = vein ? 214 : gg; img.data[i + 2] = vein ? 196 : b; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}

function speckleTexture(base, specks) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (const [color, count, size] of specks) {
      g.fillStyle = color;
      for (let i = 0; i < count; i++) {
        g.beginPath(); g.ellipse(rr(0, w), rr(0, h), rr(size * 0.4, size), rr(size * 0.2, size * 0.6), rr(0, 3), 0, Math.PI * 2); g.fill();
      }
    }
  });
}

function furTexture() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = "#b07a3c"; g.fillRect(0, 0, w, h);
    // großflächige Farbwolken im Fell
    for (let i = 0; i < 60; i++) {
      const x = rr(0, w), y = rr(0, h), r = rr(30, 90);
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      const c = rand() < 0.5 ? "220,170,100" : "120,75,30";
      grd.addColorStop(0, `rgba(${c},0.35)`);
      grd.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // kurze Haarbüschel in wechselnder Richtung, damit nichts gestreift wirkt
    for (let i = 0; i < 30000; i++) {
      const x = rr(0, w), y = rr(0, h), l = rr(3, 8);
      const a = fbm3(x * 0.008, y * 0.008, 2) * 6 + rr(-0.4, 0.4);
      g.strokeStyle = rand() < 0.55 ? `rgba(240,205,150,${rr(0.12, 0.35)})` : `rgba(95,55,22,${rr(0.15, 0.4)})`;
      g.lineWidth = rr(0.6, 1.3);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
  });
}

/** Gravur „HILDE“ im Bogen; die Textur deckt die Scheibe bis zum Außenradius ab (UVs der RingGeometry). */
function engravingTexture(inner, outer) {
  return canvasTex(2048, 2048, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.translate(w / 2, h / 2);
    const px = w / 2 / outer;
    const radius = ((inner + outer) / 2) * px;
    const size = (outer - inner) * px * 0.62;
    g.font = `600 ${size}px Georgia, serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const text = "HILDE";
    const step = (size * 0.95) / radius;
    [...text].forEach((ch, i) => {
      const a = ((text.length - 1) / 2 - i) * step;
      g.save();
      g.rotate(a);
      g.translate(0, radius);
      // vertiefte Schrift: dunkle Kante unten, helle oben
      g.fillStyle = "rgba(255,250,240,0.5)";
      g.fillText(ch, 0, -size * 0.04);
      g.fillStyle = "rgba(95,75,55,0.9)";
      g.fillText(ch, 0, size * 0.03);
      g.restore();
    });
  });
}

// ---------- Geometrie-Helfer ----------
function blob(r, amp, freq, scale = [1, 1, 1], detail = 4, s = rand() * 100) {
  let geo = new THREE.IcosahedronGeometry(r, detail);
  geo.deleteAttribute("normal"); geo.deleteAttribute("uv");
  geo = mergeVertices(geo);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = fbm3(v.x * freq + s, v.y * freq, v.z * freq) - 0.5;
    v.multiplyScalar(1 + n * amp);
    p.setXYZ(i, v.x * scale[0], v.y * scale[1], v.z * scale[2]);
  }
  geo.computeVertexNormals();
  sphericalUV(geo);
  return geo;
}

function sphericalUV(geo) {
  const p = geo.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    uv[i * 2] = 0.5 + Math.atan2(z, x) / (2 * Math.PI);
    uv[i * 2 + 1] = 0.5 + Math.asin(Math.max(-1, Math.min(1, y / Math.hypot(x, y, z)))) / Math.PI;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

const mat = (o) => new THREE.MeshPhysicalMaterial(o);
const shadow = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
const place = (obj, x, y, z, ry = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; scene.add(obj); return obj; };

/** Schüssel als Drehkörper: Außenwand, Rand, Innenwand. */
function bowlGeometry(rTop, rBottom, height, wall, rim = 0.006) {
  const pts = [];
  pts.push(new THREE.Vector2(0.0001, 0));
  pts.push(new THREE.Vector2(rBottom, 0));
  for (let i = 1; i <= 12; i++) {
    const t = i / 12;
    pts.push(new THREE.Vector2(rBottom + (rTop - rBottom) * Math.sin(t * Math.PI / 2), height * t));
  }
  pts.push(new THREE.Vector2(rTop + rim * 0.3, height + rim * 0.6));
  pts.push(new THREE.Vector2(rTop - wall * 0.5, height + rim));
  for (let i = 12; i >= 1; i--) {
    const t = i / 12;
    pts.push(new THREE.Vector2(rBottom - wall + (rTop - rBottom) * Math.sin(t * Math.PI / 2), wall + (height - wall) * t));
  }
  pts.push(new THREE.Vector2(0.0001, wall));
  return new THREE.LatheGeometry(pts, 96);
}

// ---------- Renderer, Szene, Licht ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(1920, 1080, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const BG = new THREE.Color("#140e0a");
scene.background = BG;
scene.fog = new THREE.Fog("#1c130d", 2.4, 5.2);

const camera = new THREE.PerspectiveCamera(36, 16 / 9, 0.02, 20);

// warmes Vormittagslicht durchs Küchenfenster (links hinten)
const sun = new THREE.DirectionalLight("#ffd6a3", 4.2);
sun.position.set(-2.4, 2.3, -1.6);
sun.target.position.set(0.1, 0, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 1.6, bottom: -1.6, near: 0.5, far: 7 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.01;
sun.shadow.radius = 5;
scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight("#ffe8cc", "#2a1a10", 0.75));
const fill = new THREE.PointLight("#ffb880", 0.8, 5, 2);
fill.position.set(1.6, 1.2, 1.4);
scene.add(fill);

// Umgebung für Glanzlichter (einfache warme Kugel)
{
  const pm = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: "#3b2a1e" }));
  const win = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), new THREE.MeshBasicMaterial({ color: "#fff1dc" }));
  win.position.set(-3, 2, -2.5); win.lookAt(0, 0, 0);
  env.add(sky, win);
  scene.environment = pm.fromScene(env, 0.04).texture;
  scene.environmentIntensity = 0.5;
}

// ---------- Tisch und Tuch ----------
const wood = woodTexture();
wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
wood.repeat.set(1.6, 1.1);
const table = shadow(new THREE.Mesh(
  new THREE.BoxGeometry(6, 0.08, 4),
  mat({ map: wood, roughness: 0.48, clearcoat: 0.35, clearcoatRoughness: 0.45 }),
));
table.position.y = -0.04;
scene.add(table);

{
  const geo = new THREE.PlaneGeometry(0.95, 0.62, 80, 60);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    p.setZ(i, Math.max(0, (fbm3(x * 6, y * 6, 1) - 0.45) * 0.018));
  }
  geo.computeVertexNormals();
  const linen = shadow(new THREE.Mesh(geo, mat({ map: linenTexture(), roughness: 0.95, sheen: 0.6, sheenColor: "#fff3e0" })));
  linen.rotation.x = -Math.PI / 2;
  linen.rotation.z = 0.12;
  place(linen, -0.62, 0.001, -0.25);
}

// ---------- Hintergrund: verputzte Küchenwand mit Fensterlicht ----------
{
  const plaster = canvasTex(1024, 512, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, "#6d5640");
    grd.addColorStop(0.35, "#4a382a");
    grd.addColorStop(1, "#21170f");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = `rgba(${rand() < 0.5 ? "255,240,220" : "0,0,0"},${rr(0.01, 0.05)})`;
      g.fillRect(rr(0, w), rr(0, h), rr(1, 4), rr(1, 4));
    }
    // Lichtfleck des Fensters
    const spot = g.createRadialGradient(w * 0.18, h * 0.45, 10, w * 0.18, h * 0.45, w * 0.3);
    spot.addColorStop(0, "rgba(255,214,160,0.55)");
    spot.addColorStop(1, "rgba(255,214,160,0)");
    g.fillStyle = spot; g.fillRect(0, 0, w, h);
  });
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 3.2),
    new THREE.MeshStandardMaterial({ map: plaster, emissiveMap: plaster, emissive: "#ffffff", emissiveIntensity: 0.55, roughness: 1 }),
  );
  wall.position.set(0, 1.2, -2.05);
  wall.receiveShadow = true;
  scene.add(wall);
}

// ---------- Fleisch-Helfer ----------
/** Unregelmäßiger, leicht gerundeter Würfel (Gulasch-Stück) mit Fettrand über Vertex-Farben. */
function chunkGeometry(size, round, amp, fatSide = 0) {
  let geo = new THREE.BoxGeometry(1, 1, 1, 8, 8, 8);
  geo.deleteAttribute("normal"); geo.deleteAttribute("uv");
  geo = mergeVertices(geo);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  const s = rand() * 50;
  const colors = new Float32Array(p.count * 3);
  const red = new THREE.Color(), fat = new THREE.Color("#efe1cc");
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const sph = v.clone().normalize().multiplyScalar(0.62);
    v.lerp(sph, round);
    v.multiplyScalar(1 + (fbm3(v.x * 3 + s, v.y * 3, v.z * 3) - 0.5) * amp);
    v.x *= size[0]; v.y *= size[1]; v.z *= size[2];
    p.setXYZ(i, v.x, v.y, v.z);
    const n = fbm3(v.x * 90 + s, v.y * 90, v.z * 90, 3);
    red.setRGB(0.24 + n * 0.2, 0.025 + n * 0.03, 0.03 + n * 0.025);
    // feine Fettmaserung
    if (Math.abs(Math.sin(v.x * 260 + n * 14)) < 0.035) red.lerp(fat, 0.45);
    if (fatSide && v.y > size[1] * (0.38 + n * 0.12)) red.lerp(fat, 0.6);
    colors.set([red.r, red.g, red.b], i * 3);
  }
  geo.computeVertexNormals();
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

const meatMat = mat({ vertexColors: true, roughness: 0.46, clearcoat: 0.28, clearcoatRoughness: 0.42, sheen: 0.3, sheenColor: "#ff9d8a" });

/** Hackmischung aus vielen kleinen Stückchen (Fleisch, Innereien, Möhre, Kürbis, Kräuter). */
function mince(cx, cz, radius, baseY, heap, count, clipRadius = radius) {
  const group = new THREE.Group();
  const shapes = [0, 1, 2, 3].map(() => blob(1, 1.1, 2.6, [1.3, 0.6, 1], 2));
  const palette = [
    ["#6a1d17", 0.24], ["#83291f", 0.22], ["#9c3a2f", 0.17], ["#b5584c", 0.1], ["#3a120e", 0.08],
    ["#d9691c", 0.07], ["#e9a04a", 0.04], ["#47732a", 0.06], ["#ddc9b0", 0.02],
  ];
  const pick = () => {
    let r = rand();
    for (const [c, w] of palette) { if ((r -= w) <= 0) return c; }
    return palette[0][0];
  };
  const o = new THREE.Object3D();
  const color = new THREE.Color();
  for (const shape of shapes) {
    const n = Math.floor(count / shapes.length);
    const inst = new THREE.InstancedMesh(shape, mat({ roughness: 0.55, clearcoat: 0.22, clearcoatRoughness: 0.5 }), n);
    for (let i = 0; i < n; i++) {
      const a = rr(0, Math.PI * 2), d = Math.sqrt(rand()) * radius;
      const fall = 1 - (d / radius) ** 2;
      o.position.set(cx + Math.cos(a) * d, baseY + heap * fall * rr(0.75, 1) + rr(-0.004, 0.004), cz + Math.sin(a) * d);
      if (Math.hypot(o.position.x - cx, o.position.z - cz) > clipRadius) o.position.y -= 0.01;
      o.rotation.set(rr(0, 6), rr(0, 6), rr(0, 6));
      const c = pick();
      const s = c === "#47732a" ? rr(0.003, 0.006) : rr(0.0045, 0.009);
      o.scale.set(s * rr(0.8, 1.4), s, s * rr(0.8, 1.3));
      o.updateMatrix();
      inst.setMatrixAt(i, o.matrix);
      inst.setColorAt(i, color.set(c).multiplyScalar(rr(0.85, 1.1)));
    }
    inst.castShadow = inst.receiveShadow = true;
    group.add(inst);
  }
  // dunkler Grund, damit keine Lücken durchscheinen
  const base = new THREE.Mesh(blob(radius * 0.98, 0.1, 6, [1, heap / radius * 0.85, 1], 4), mat({ color: "#4a130f", roughness: 0.6 }));
  base.position.set(cx, baseY - 0.006, cz);
  base.receiveShadow = true;
  group.add(base);
  scene.add(group);
  return group;
}

// ---------- Zutaten (Start der Fahrt) ----------
seed = 11;
const board = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.028, 0.38), mat({ map: boardTexture(), roughness: 0.62, clearcoat: 0.1 })));
place(board, -1.0, 0.014, 0.08, -0.12);

for (let i = 0; i < 9; i++) {
  const sz = [rr(0.038, 0.05), rr(0.026, 0.034), rr(0.03, 0.042)];
  const m = shadow(new THREE.Mesh(chunkGeometry(sz, rr(0.3, 0.55), 0.55, i % 4 === 1 ? 1 : 0), meatMat));
  m.rotation.set(rr(-0.2, 0.2), rr(0, 6), rr(-0.2, 0.2));
  place(m, -1.18 + (i % 3) * 0.075 + rr(-0.01, 0.01), 0.028 + sz[1] * 0.45, -0.03 + Math.floor(i / 3) * 0.065 + rr(-0.01, 0.01), m.rotation.y);
}

// Pansen: graugrüne Wabenstruktur
{
  const comb = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = "#9a9274"; g.fillRect(0, 0, w, h);
    // weiche, unregelmäßige Waben
    for (let i = 0; i < 1400; i++) {
      const x = rr(0, w), y = rr(0, h), r = rr(4, 10);
      const grd = g.createRadialGradient(x, y, r * 0.2, x, y, r);
      grd.addColorStop(0, "rgba(70,66,48,0.55)");
      grd.addColorStop(1, "rgba(70,66,48,0)");
      g.fillStyle = grd;
      g.beginPath(); g.ellipse(x, y, r, r * rr(0.7, 1.1), rr(0, 3), 0, Math.PI * 2); g.fill();
    }
  });
  const bump = comb.clone(); bump.colorSpace = THREE.NoColorSpace;
  const tripeMat = mat({ map: comb, bumpMap: bump, bumpScale: 3, roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.3 });
  for (let i = 0; i < 2; i++) {
    const m = shadow(new THREE.Mesh(blob(0.06, 0.45, 14, [1.35, 0.32, 1]), tripeMat));
    place(m, -0.83 + i * 0.075, 0.042, 0.13 + i * 0.03, rr(0, 6));
  }
}

// Hühnerhälse: gegliedert, hautfarben mit Gänsehaut-Sprenkeln
{
  const skin = speckleTexture("#e3b39a", [["rgba(190,120,95,0.35)", 1600, 3], ["rgba(250,220,200,0.4)", 900, 2]]);
  const neckMat = mat({ map: skin, roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.35 });
  for (let n = 0; n < 3; n++) {
    const g = new THREE.Group();
    for (let k = 0; k < 11; k++) {
      const r = 0.016 - Math.abs(k - 5) * 0.0008;
      const s = shadow(new THREE.Mesh(blob(r, 0.2, 40, [0.85, 1, 1], 3), neckMat));
      s.position.set(k * 0.015, 0, Math.sin(k * 0.5 + n) * 0.006);
      g.add(s);
    }
    g.rotation.y = 0.5 + n * 0.22;
    place(g, -1.0 + n * 0.035, 0.044, -0.08 - n * 0.032, g.rotation.y);
  }
}

// Emaille-Schüsseln
const enamel = mat({ color: "#f1ece2", roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08 });
const enamelRim = mat({ color: "#1f2d4d", roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 });
function enamelBowl(r, h, x, z) {
  const g = new THREE.Group();
  g.add(shadow(new THREE.Mesh(bowlGeometry(r, r * 0.55, h, 0.004), enamel)));
  const rim = shadow(new THREE.Mesh(new THREE.TorusGeometry(r, 0.0055, 12, 128), enamelRim));
  rim.rotation.x = Math.PI / 2; rim.position.y = h + 0.003;
  g.add(rim);
  return place(g, x, 0, z);
}

// geraspelte Möhren: gebogene, feine Streifen
const carrotMat = mat({ color: "#ef7019", roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.25 });
function shredGeometry() {
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.016, 0, 0), new THREE.Vector3(0, 0.006, 0.004), new THREE.Vector3(0.016, 0, 0));
  return new THREE.TubeGeometry(curve, 8, 0.0019, 4, false);
}
enamelBowl(0.12, 0.07, -0.56, -0.3);
{
  const inst = new THREE.InstancedMesh(shredGeometry(), carrotMat, 1400);
  const o = new THREE.Object3D();
  for (let i = 0; i < inst.count; i++) {
    // Füllung bleibt innerhalb der Schüsselwand (unten schmaler als oben)
    const a = rr(0, Math.PI * 2);
    const y = rr(0.012, 0.085);
    const wallR = 0.066 + 0.054 * Math.sin(Math.min(y, 0.07) / 0.07 * Math.PI / 2) - 0.018;
    const d = Math.sqrt(rand()) * wallR;
    const top = 0.07 + 0.025 * (1 - (d / 0.1) ** 2);
    o.position.set(-0.56 + Math.cos(a) * d, Math.min(y, top), -0.3 + Math.sin(a) * d);
    o.rotation.set(rr(-1.2, 1.2), rr(0, 6), rr(-1.2, 1.2));
    o.scale.setScalar(rr(0.7, 1.25));
    o.updateMatrix();
    inst.setMatrixAt(i, o.matrix);
  }
  inst.castShadow = inst.receiveShadow = true;
  scene.add(inst);
}

// Kürbis (ganz + Würfel)
{
  const geo = new THREE.SphereGeometry(0.13, 128, 64);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const a = Math.atan2(v.z, v.x);
    const rib = 1 - Math.pow(Math.abs(Math.sin(a * 5)), 0.5) * 0.08;
    p.setXYZ(i, v.x * rib, v.y * 0.7 * (1 - 0.18 * Math.max(0, v.y / 0.13) ** 4), v.z * rib);
  }
  geo.computeVertexNormals();
  const skin = speckleTexture("#c9601b", [["rgba(230,140,60,0.35)", 1500, 4], ["rgba(120,50,10,0.3)", 800, 3]]);
  const pumpkin = shadow(new THREE.Mesh(geo, mat({ map: skin, roughness: 0.45, clearcoat: 0.55, clearcoatRoughness: 0.3 })));
  place(pumpkin, -1.36, 0.09, -0.46);
  const stem = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.015, 0.055, 7), mat({ color: "#6b6440", roughness: 0.85 })));
  stem.rotation.z = 0.3;
  place(stem, -1.36, 0.185, -0.46);
  const flesh = mat({ color: "#f29a35", roughness: 0.55, clearcoat: 0.3 });
  for (let i = 0; i < 7; i++) {
    const c = shadow(new THREE.Mesh(chunkGeometry([0.022, 0.022, 0.022], 0.15, 0.15), flesh));
    c.geometry.deleteAttribute("color");
    place(c, -1.16 + rr(-0.06, 0.06), 0.012, -0.28 + rr(-0.05, 0.05), rr(0, 6));
  }
}

// Petersilie
const leafMat = mat({ color: "#355f22", roughness: 0.5, sheen: 0.5, sheenColor: "#a6cf72", side: THREE.DoubleSide });
const stemMat = mat({ color: "#6f9a45", roughness: 0.6 });
function leafGeometry() {
  // flaches, gezacktes Petersilienblatt
  const shape = new THREE.Shape();
  for (let k = 0; k <= 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    const r = 0.012 * (0.75 + 0.25 * Math.cos(a * 3)) * (k % 2 ? 0.8 : 1);
    if (k === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  return geo;
}
const LEAF = leafGeometry();
function parsley(x, z, n = 9, spread = 0.07) {
  for (let i = 0; i < n; i++) {
    const a = rr(-0.5, 0.5) + 0.3;
    const len = rr(0.1, 0.16);
    const stem = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0024, len, 6), stemMat));
    stem.rotation.z = Math.PI / 2;
    const g = new THREE.Group();
    stem.position.x = -len / 2;
    g.add(stem);
    for (let k = 0; k < 9; k++) {
      const l = shadow(new THREE.Mesh(LEAF, leafMat));
      l.position.set(rr(-0.012, 0.03), rr(0.002, 0.014), rr(-0.022, 0.022));
      l.rotation.set(rr(-0.6, 0.6), rr(0, 6), rr(-0.6, 0.6));
      l.scale.setScalar(rr(0.7, 1.2));
      g.add(l);
    }
    g.rotation.y = a;
    place(g, x + rr(-spread, spread), 0.006, z + rr(-spread, spread) * 0.6, a);
  }
}
parsley(-0.62, 0.3);
parsley(-0.12, 0.24, 3, 0.05);
parsley(0.78, -0.27, 2, 0.04);

// Schälchen Öl
{
  const ceramic = mat({ color: "#d9cdb8", roughness: 0.3, clearcoat: 0.8 });
  place(shadow(new THREE.Mesh(bowlGeometry(0.055, 0.035, 0.032, 0.004), ceramic)), -0.33, 0, 0.12);
  const oil = new THREE.Mesh(new THREE.CircleGeometry(0.048, 48), mat({ color: "#b98712", roughness: 0.04, clearcoat: 1, emissive: "#2a1a00" }));
  oil.rotation.x = -Math.PI / 2;
  place(oil, -0.33, 0.026, 0.12);
}

// ---------- Mitte: Rührschüssel ----------
seed = 23;
{
  enamelBowl(0.25, 0.13, 0.32, 0.0);
  mince(0.32, 0.0, 0.205, 0.085, 0.045, 11000);
  // Holzlöffel: Stiel + flache Kelle, schräg in der Masse
  const spoonMat = mat({ color: "#c09060", roughness: 0.6 });
  const spoon = new THREE.Group();
  const handle = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.011, 0.3, 16), spoonMat));
  handle.position.y = 0.15;
  const bowlPart = shadow(new THREE.Mesh(blob(0.032, 0.02, 4, [0.8, 0.28, 1.2], 3), spoonMat));
  bowlPart.position.y = -0.01;
  bowlPart.rotation.x = Math.PI / 2;
  spoon.add(handle, bowlPart);
  spoon.rotation.set(0, 0.6, -0.95);
  place(spoon, 0.27, 0.12, -0.03, 0.6);
  spoon.rotation.z = -0.95;
}
// ein paar Krümel auf dem Tisch
{
  const bits = new THREE.InstancedMesh(shredGeometry(), carrotMat, 26);
  const o = new THREE.Object3D();
  for (let i = 0; i < bits.count; i++) {
    o.position.set(rr(-0.2, 1.0), 0.003, rr(-0.38, 0.38));
    if (Math.abs(o.position.x - 0.32) < 0.27 && Math.abs(o.position.z) < 0.27) o.position.z += 0.42;
    if (Math.abs(o.position.x - 1.22) < 0.22 && Math.abs(o.position.z) < 0.22) o.position.z -= 0.4;
    o.rotation.set(0, rr(0, 6), 0);
    o.updateMatrix();
    bits.setMatrixAt(i, o.matrix);
  }
  bits.castShadow = bits.receiveShadow = true;
  scene.add(bits);
}

// ---------- Ende: Napf „HILDE“ mit Pfote ----------
seed = 41;
const NAPF = new THREE.Vector3(1.22, 0, 0.0);
{
  // Keramiknapf mit breitem, flachem Rand
  const H = 0.07, R = 0.15, FL = 0.034;
  const pts = [
    [0.0001, 0], [R - 0.01, 0], [R, 0.008], [R + 0.004, H - 0.01], [R + 0.006, H], [R + 0.004, H + 0.003],
    [R - FL, H + 0.003], [R - FL - 0.004, H - 0.002], [R - FL - 0.012, 0.03], [R - FL - 0.02, 0.016], [0.0001, 0.016],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const glazeTex = speckleTexture("#e6dcc8", [["rgba(120,100,80,0.18)", 1400, 2], ["rgba(255,255,255,0.25)", 600, 3]]);
  const glaze = mat({ map: glazeTex, roughness: 0.26, clearcoat: 0.9, clearcoatRoughness: 0.12 });
  const napf = shadow(new THREE.Mesh(new THREE.LatheGeometry(pts, 128), glaze));
  place(napf, NAPF.x, 0, NAPF.z);
  // Gravur auf dem flachen Rand
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(R - FL + 0.002, R + 0.003, 160, 1),
    new THREE.MeshStandardMaterial({ map: engravingTexture(R - FL + 0.002, R + 0.003), transparent: true, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -4 }),
  );
  ring.rotation.x = -Math.PI / 2;
  place(ring, NAPF.x, H + 0.0032, NAPF.z);
  mince(NAPF.x, NAPF.z, 0.108, 0.035, 0.035, 7000);

  // Hundepfote von rechts ins Bild (Golden-Retriever-Fell): Bein, Ballen und Zehen als eine
  // verschmolzene Form (Marching Cubes), damit es keine Nähte oder Ringe gibt.
  const furTex = furTexture();
  furTex.wrapS = furTex.wrapT = THREE.RepeatWrapping;
  furTex.repeat.set(3.5, 3.5);
  const furBump = furTex.clone(); furBump.colorSpace = THREE.NoColorSpace;
  const fur = mat({ map: furTex, bumpMap: furBump, bumpScale: 8, roughness: 0.92, sheen: 1, sheenColor: "#f5d39c", sheenRoughness: 0.4 });
  const paw = new THREE.Group();
  const S = 0.26; // halbe Kantenlänge des Feldes in Metern
  const mc = new MarchingCubes(110, fur, true, false, 200000);
  mc.isolation = 80;
  mc.scale.set(S, S, S);
  mc.position.set(0.16, 0, 0); // Feld reicht von x −0.10 bis 0.42
  mc.reset();
  const SUB = 12;
  const ball = (x, y, z, r) => {
    const k = 1 / (2 * S);
    mc.addBall((x - 0.16) * k + 0.5, y * k + 0.5, z * k + 0.5, (r * k) ** 2 * (SUB + mc.isolation), SUB);
  };
  // Unterarm, leicht verjüngt, läuft rechts aus dem Feld
  for (let x = 0.06; x <= 0.44; x += 0.012) ball(x, 0.034, 0, 0.027 + Math.min(x - 0.06, 0.12) * 0.04);
  // Mittelfuß: breit und flach
  ball(0.0, 0.02, -0.018, 0.03);
  ball(0.0, 0.02, 0.018, 0.03);
  ball(0.03, 0.026, 0, 0.032);
  // Zehen im Bogen, mit Furchen dazwischen
  const toes = [[-0.036, -0.047], [-0.052, -0.017], [-0.052, 0.017], [-0.036, 0.047]];
  for (const [x, z] of toes) ball(x - 0.004, 0.014, z * 1.05, 0.019);
  for (const [x, z] of [[-0.056, -0.034], [-0.064, 0], [-0.056, 0.034]]) {
    const k = 1 / (2 * S);
    mc.addBall((x - 0.16) * k + 0.5, 0.026 * k + 0.5, z * k + 0.5, -((0.011 * k) ** 2) * (SUB + mc.isolation), SUB);
  }
  mc.update();
  mc.castShadow = mc.receiveShadow = true;
  paw.add(mc);
  const nailMat = mat({ color: "#2b2420", roughness: 0.35, clearcoat: 0.6 });
  for (const [x, z] of toes) {
    const nail = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.0035, 0.012, 8), nailMat));
    nail.rotation.z = Math.PI / 2 + 0.35;
    nail.position.set(x - 0.02, 0.004, z * 1.03);
    paw.add(nail);
  }
  paw.rotation.y = 0.45;
  place(paw, NAPF.x + 0.27, 0.03, NAPF.z + 0.17, 0.45);
}

// ---------- Kamerafahrt ----------
const posCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1.58, 0.27, 0.6),
  new THREE.Vector3(-0.95, 0.36, 0.74),
  new THREE.Vector3(-0.15, 0.62, 0.72),
  new THREE.Vector3(0.62, 0.95, 0.42),
  new THREE.Vector3(1.22, 1.08, 0.06),
], false, "centripetal");
const lookCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.85, 0.05, -0.1),
  new THREE.Vector3(-0.45, 0.04, -0.06),
  new THREE.Vector3(0.3, 0.06, -0.02),
  new THREE.Vector3(0.95, 0.03, 0.0),
  new THREE.Vector3(1.22, 0.0, 0.0),
], false, "centripetal");
const ease = (t) => t * t * (3 - 2 * t);

function setCamera(i) {
  const t = ease(i / (FRAMES - 1)) * 0.92 + (i / (FRAMES - 1)) * 0.08;
  camera.position.copy(posCurve.getPoint(t));
  camera.up.set(0, 1, 0);
  camera.lookAt(lookCurve.getPoint(t));
}

// ---------- Tiefen-Pass ----------
const depthMat = new THREE.ShaderMaterial({
  uniforms: { uNear: { value: 0.3 }, uFar: { value: 2 } },
  vertexShader: `varying float vZ;
    #include <common>
    void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0);
    #ifdef USE_INSTANCING
      mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    #endif
    vZ = -mv.z; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform float uNear; uniform float uFar; varying float vZ;
    void main() { float d = clamp((uFar - vZ) / (uFar - uNear), 0.0, 1.0); gl_FragColor = vec4(vec3(pow(d, 0.9)), 1.0); }`,
  side: THREE.DoubleSide,
});

function render(i, mode) {
  setCamera(i);
  if (mode === "depth") {
    renderer.setSize(960, 540, false);
    const dist = camera.position.distanceTo(lookCurve.getPoint(ease(i / (FRAMES - 1))));
    depthMat.uniforms.uNear.value = dist * 0.55;
    depthMat.uniforms.uFar.value = dist * 1.9;
    scene.overrideMaterial = depthMat;
    scene.background = new THREE.Color("#000");
    const fog = scene.fog; scene.fog = null;
    const tm = renderer.toneMapping; renderer.toneMapping = THREE.NoToneMapping;
    renderer.render(scene, camera);
    scene.overrideMaterial = null; scene.background = BG; scene.fog = fog; renderer.toneMapping = tm;
  } else {
    renderer.setSize(1920, 1080, false);
    renderer.render(scene, camera);
  }
}

window.renderFrame = (i, mode) => {
  render(i, mode);
  return mode === "depth"
    ? renderer.domElement.toDataURL("image/webp", 0.9)
    : renderer.domElement.toDataURL("image/jpeg", 0.82);
};

// Vorschau im Browser
const slider = document.getElementById("t");
const depthBox = document.getElementById("d");
const preview = () => render(Number(slider.value), depthBox.checked ? "depth" : "color");
slider.addEventListener("input", preview);
depthBox.addEventListener("change", preview);
preview();
window.sceneReady = true;
