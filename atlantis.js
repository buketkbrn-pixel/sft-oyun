/* 🌊 S.F.T · Atlantis (atlantis.js) — denizin dibindeki dev batık şehir. Macera değil, serbest keşif bölgesi:
   halka halka kanallar ve surlar, ortada kristalli büyük tapınak, saraylar, evler, amfitiyatro, çarşı, su kemerleri, kristal kuleler,
   deniz feneri, dev bekçi heykelleri; dışarıda yosun ormanı, mercan bahçesi, batık gemiler, uçurum ve sıcak su bacaları.
   Konuşan deniz kızları (V), balık sürüleri, parlayan denizanaları, vatozlar, kaplumbağalar, yunuslar, dev balina, yengeçler. 25 inci istiridyesi, batık sandıklar.
   Yüzme: Boşluk yukarı · Q aşağı dalış · E hızlı · Shift ayaklar pervane gibi döner, çok hızlı.
   index.html bunu yükler; oyunun değişkenlerine window.__sftG (G) ile erişir. Tasarımlar bu oyuna özgüdür. */
(function (G) {
'use strict';
const T = G.THREE, $ = id => document.getElementById(id), adT = s => G.adT(s);
const CX = 45000, CZ = 45000, WY = 78, NPEARL = 25;
G.AREAS.atlantis = { cx: CX, cz: CZ, r: 655, bg: 0x0d5577, fog: [4, 150], sky: 0x8fdcf0, gnd: 0x1d4e5e, sunC: 0xa8e6ff, sunI: 1.25 };
G.LOAD_NAMES.atlantis = 'Atlantis';
const AT = { built: false, g: new T.Group(), obs: [], chunks: [], fast: false, prop: false, down: false, ph: 0, sch: [], jel: [], cre: [], bub: [], rays: [], clams: [], chests: [], vents: [], on: false };
AT.g.name = 'atlantisRoot';
const U = { uTime: { value: 0 } };
const mul32 = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
let RND = mul32(20261126);
const R = (a, b) => a + RND() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1)), PICK = L => L[Math.floor(RND() * L.length)];
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
AT.pearls = new Set(); try { for (const i of JSON.parse(localStorage.getItem('sftAtlInci') || '[]')) AT.pearls.add(i); } catch (e) {}

/* ---------- 🗺️ deniz tabanı ---------- */
const CANALS = [[45, 60], [120, 135], [210, 225]], WALLS = [[60, 64, 10], [135, 139, 8.5], [225, 231, 13]], GATES = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
function floorH(x, z) {
  const r = Math.hypot(x, z), out = sstep(232, 262, r);
  let h = (Math.sin(x * .021 + 1.3) * Math.cos(z * .017) * 1.7 + Math.sin(x * .053 + z * .041) * .6 + Math.sin(z * .093 - x * .031) * .3) * (.18 + .82 * out);
  for (const [a, b] of CANALS) h -= 4.5 * sstep(a, a + 2.5, r) * (1 - sstep(b - 2.5, b, r));
  h += 6 * (1 - sstep(38, 50, r));
  if (out > 0) {
    h += out * (Math.sin(x * .011) * Math.sin(z * .013) * 5 + Math.max(0, Math.sin(x * .007 + z * .009)) * 8);
    const xc = -430 + Math.sin(z * .012) * 45; h -= out * 46 * (1 - sstep(18, 75, Math.abs(x - xc))) * (1 - sstep(330, 520, Math.abs(z)));   // batıda uçurum
  }
  return h + Math.max(0, r - 590) * 1.4;
}
const region = (x, z) => { const a = Math.atan2(z, x), r = Math.hypot(x, z); if (r < 245) return 'city'; if (x < -300) return 'trench'; if (a > -.75 && a < .75) return 'reef'; if (a >= .75 && a < 2.4) return 'kelp'; if (a <= -.75 && a > -2.4) return 'wreck'; return 'trench'; };

/* ---------- 🔊 su altı sesleri ---------- */
function ac() { if (!AT.ac) { try { AT.ac = new (window.AudioContext || window.webkitAudioContext)(); AT.out = AT.ac.createGain(); AT.out.gain.value = .5; AT.out.connect(AT.ac.destination); } catch (e) { return null; } } if (AT.ac.state === 'suspended') AT.ac.resume().catch(() => {}); return AT.ac; }
for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, () => { if (AT.ac && AT.ac.state === 'suspended') AT.ac.resume().catch(() => {}); }, { passive: true });
function nbuf() { if (AT.nb) return AT.nb; const c = ac(), b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { l = (l + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; } return AT.nb = b; }
function snd(kind, vol = 1, pan = 0) {
  const c = ac(); if (!c || c.state !== 'running' || !AT.on) return; const t = c.currentTime, out = c.createStereoPanner ? c.createStereoPanner() : c.createGain(); if (out.pan) out.pan.value = Math.max(-1, Math.min(1, pan)); out.connect(AT.out);
  const env = (g, a, d, v) => { g.gain.setValueAtTime(0, t + a); g.gain.linearRampToValueAtTime(v, t + a + .01); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); };
  if (kind === 'bub') { const n = 1 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) { const a = i * (.04 + Math.random() * .08), o = c.createOscillator(); o.type = 'sine'; const f0 = 260 + Math.random() * 500; o.frequency.setValueAtTime(f0, t + a); o.frequency.exponentialRampToValueAtTime(f0 * 2.6, t + a + .07); const g = c.createGain(); env(g, a, .09, .12 * vol); o.connect(g).connect(out); o.start(t + a); o.stop(t + a + .12); } }
  else if (kind === 'stroke') { const n = c.createBufferSource(); n.buffer = nbuf(); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 420 + Math.random() * 200; f.Q.value = 1.2; const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.22 * vol, t + .12); g.gain.linearRampToValueAtTime(0, t + .5); n.connect(f).connect(g).connect(out); n.start(t, Math.random()); n.stop(t + .55); }
  else if (kind === 'whale') { const o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), dl = c.createDelay(1.5), fb = c.createGain(); o.type = 'sine'; o2.type = 'triangle'; const b = 140 + Math.random() * 60;
    o.frequency.setValueAtTime(b, t); o.frequency.linearRampToValueAtTime(b * .7, t + 1.2); o.frequency.linearRampToValueAtTime(b * 1.6, t + 2.6); o.frequency.linearRampToValueAtTime(b * .9, t + 4); o2.frequency.setValueAtTime(b * .5, t); o2.frequency.linearRampToValueAtTime(b * .38, t + 4);
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5; lg.gain.value = 6; lfo.connect(lg).connect(o.frequency); f.type = 'lowpass'; f.frequency.value = 900; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.3 * vol, t + .6); g.gain.setValueAtTime(.3 * vol, t + 3.2); g.gain.linearRampToValueAtTime(0, t + 4.2);
    dl.delayTime.value = .45; fb.gain.value = .35; o.connect(f); o2.connect(f); f.connect(g); g.connect(out); g.connect(dl); dl.connect(fb).connect(dl); dl.connect(out); for (const x of [o, o2, lfo]) { x.start(t); x.stop(t + 4.4); } }
  else if (kind === 'dolphin') { for (let i = 0; i < 3; i++) { const a = i * .13, o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(2200 + Math.random() * 600, t + a); o.frequency.exponentialRampToValueAtTime(4200 + Math.random() * 800, t + a + .1); const g = c.createGain(); env(g, a, .12, .05 * vol); o.connect(g).connect(out); o.start(t + a); o.stop(t + a + .15); } }
  else if (kind === 'chest') { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t); o.frequency.linearRampToValueAtTime(70, t + .5); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.18 * vol, t + .06); g.gain.linearRampToValueAtTime(0, t + .6); o.connect(f).connect(g).connect(out); o.start(t); o.stop(t + .65); }
}
function amb(on) {   // derin uğultu + akıntı sesi; pervane vızıltısı
  const c = on ? ac() : AT.ac; if (!c) return;
  if (on && !AT.amb) { const n = c.createBufferSource(); n.buffer = nbuf(); n.loop = true; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380; const g = c.createGain(); g.gain.value = 0; n.connect(f).connect(g).connect(AT.out); n.start();
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 48; const og = c.createGain(); og.gain.value = .05; o.connect(og).connect(g); o.start();
    const pr = c.createOscillator(); pr.type = 'sawtooth'; pr.frequency.value = 95; const pf = c.createBiquadFilter(); pf.type = 'bandpass'; pf.frequency.value = 520; pf.Q.value = 2; const pg = c.createGain(); pg.gain.value = 0; const am = c.createOscillator(), amg = c.createGain(); am.frequency.value = 34; amg.gain.value = .5; am.connect(amg).connect(pg.gain); pr.connect(pf).connect(pg).connect(AT.out); pr.start(); am.start();
    g.gain.linearRampToValueAtTime(.55, c.currentTime + 2); AT.amb = { n, o, g, f, pr, am, pg }; }
  else if (!on && AT.amb) { const a = AT.amb; AT.amb = null; a.g.gain.cancelScheduledValues(c.currentTime); a.g.gain.setValueAtTime(a.g.gain.value, c.currentTime); a.g.gain.linearRampToValueAtTime(0, c.currentTime + .5); a.pg.gain.value = 0; setTimeout(() => { for (const x of [a.n, a.o, a.pr, a.am]) try { x.stop(); } catch (e) {} }, 700); }
}

/* ---------- 🎨 dokular ve malzemeler ---------- */
function canvasTex(w, h, draw, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep, rep); } t.anisotropy = 4; return t; }
function causticTex() {   // döşenebilir parlak ağ deseni (su yüzeyinden süzülen ışık)
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), im = g.createImageData(S, S), P = Math.PI * 2 / S;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x * P, v = y * P; let s = 0; s += Math.sin(u * 3 + Math.sin(v * 2) * 1.5); s += Math.sin(v * 4 + Math.sin(u * 3) * 1.3); s += Math.sin((u + v) * 2 + Math.sin(u * 5 - v * 1) * .9); s += Math.sin((u - v) * 3 + Math.cos(v * 2) * 1.1);
    let k = 1 - Math.abs(s) / 2.2; k = Math.max(0, k); k = Math.pow(k, 8); const i = (y * S + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = Math.min(255, k * 330); im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
}
let MT = null;
function mats() {
  if (MT) return MT; const M = G.M;
  const sand = canvasTex(256, 256, (g, W) => { g.fillStyle = '#c8b48a'; g.fillRect(0, 0, W, W); for (let i = 0; i < 5000; i++) { const l = 150 + Math.random() * 70; g.fillStyle = `rgba(${l},${l * .9 | 0},${l * .7 | 0},.35)`; g.fillRect(Math.random() * W, Math.random() * W, 2, 2); }
    g.strokeStyle = 'rgba(120,100,70,.25)'; g.lineWidth = 3; for (let y = 0; y < W; y += 18) { g.beginPath(); for (let x = 0; x <= W; x += 8) g.lineTo(x, y + Math.sin(x / W * Math.PI * 4) * 4); g.stroke(); } }, 1);
  sand.repeat.set(110, 110);
  const caus = causticTex(); caus.repeat.set(70, 70);
  MT = { sand, caus,
    floor: new T.MeshStandardMaterial({ map: sand, color: 0xb9d6d2, roughness: 1, emissive: 0x9ff3ff, emissiveMap: caus, emissiveIntensity: .17 }),
    marble: M(0xe9e4d4), marble2: M(0xd2cbb6), teal: M(0x6fa7a0), sandst: M(0xc8b28a), roof: M(0x4d8c78), roof2: M(0x7a5a3c), dark: M(0x24343c), pink: M(0xd98a84), bronze: M(0x5f9e8a), wood: M(0x5b4632), wood2: M(0x3f3124), rock: M(0x5d6b70), rock2: M(0x46545a),
    gold: M(0xd4af37, { metalness: .9, roughness: .3, emissive: 0x2a1e00 }),
    crystal: M(0x7ff6ff, { emissive: 0x29d4ff, emissiveIntensity: 1.3, roughness: .2 }), crystal2: M(0xd7a8ff, { emissive: 0x9b4dff, emissiveIntensity: 1.1, roughness: .2 }),
    lamp: M(0xbff9ff, { emissive: 0x7ff0ff, emissiveIntensity: 1.6 }), ember: M(0xff8a3a, { emissive: 0xff5a10, emissiveIntensity: 1.4 }) };
  return MT;
}
const glowTex = () => AT.gt || (AT.gt = canvasTex(64, 64, (g, W) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(200,250,255,.55)'); gr.addColorStop(1, 'rgba(150,230,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, W); }));
function sway(mat, amp, freq, hs) {   // yosun / mercan dalgalanması (gölgesiz)
  mat.onBeforeCompile = sh => { sh.uniforms.uTime = U.uTime; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    #ifdef USE_INSTANCING
      float swPh = instanceMatrix[3].x * .21 + instanceMatrix[3].z * .17;
    #else
      float swPh = 0.0;
    #endif
    float swH = max(position.y, 0.0) * ${hs.toFixed(3)};
    transformed.x += sin(uTime * ${freq.toFixed(3)} + swPh + position.y * .35) * swH * ${amp.toFixed(3)};
    transformed.z += cos(uTime * ${(freq * .8).toFixed(3)} + swPh * 1.3 + position.y * .3) * swH * ${(amp * .7).toFixed(3)};`); };
  mat.customProgramCacheKey = () => 'atlsw' + amp + '_' + freq + '_' + hs; return mat;
}

/* ---------- 🏛️ yapı parçaları ---------- */
let OBS = [];   // yerel koordinatta engeller
const ob = (x, z, r, top, y0) => OBS.push({ x, z, r, top, y0 });
const add = (g, geo, m, x, y, z) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
const box = (g, w, h, d, m, x, y, z) => add(g, new T.BoxGeometry(w, h, d), m, x, y, z);
const cyl = (g, r0, r1, h, m, x, y, z, s = 10) => add(g, new T.CylinderGeometry(r0, r1, h, s), m, x, y, z);
function prism(w, d, h) { const geo = new T.CylinderGeometry(1, 1, w, 3).rotateZ(Math.PI / 2).rotateX(-Math.PI / 2); geo.scale(1, h / 1.5, d / 1.732); geo.translate(0, h / 3, 0); return geo; }
function column(g, x, z, y0, h, r, m, broken) {
  const M = mats(), hh = broken ? h * R(.25, .75) : h; box(g, r * 2.6, .4, r * 2.6, M.marble2, x, y0 + .2, z); cyl(g, r, r * 1.08, hh, m || M.marble, x, y0 + .4 + hh / 2, z, 10);
  if (!broken) box(g, r * 2.8, .45, r * 2.8, M.marble2, x, y0 + .4 + hh + .22, z); return hh + .85;
}
function sub(g, x, z, ry, y) { const s = new T.Group(); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s; }
function windowAt(b, x, y, z, ry, wm, round) {   // çerçeveli pencere + denizlik (+ bazen kepenk)
  const M = mats(), w = sub(b, x, z, ry, y), tr = wm === M.marble ? M.teal : M.marble;
  if (round) { add(w, new T.CylinderGeometry(.52, .52, .1, 14).rotateX(Math.PI / 2), tr, 0, 0, .02); add(w, new T.CylinderGeometry(.38, .38, .12, 14).rotateX(Math.PI / 2), M.dark, 0, 0, .04); box(w, .06, .76, .14, tr, 0, 0, .06); box(w, .76, .06, .14, tr, 0, 0, .06); return; }
  box(w, 1.12, 1.36, .1, tr, 0, 0, .02); box(w, .8, 1.04, .12, M.dark, 0, 0, .04); add(w, new T.CylinderGeometry(.4, .4, .12, 10, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2), M.dark, 0, .52, .04); add(w, new T.TorusGeometry(.48, .06, 4, 10, Math.PI), tr, 0, .52, .05);
  box(w, 1.35, .12, .34, tr, 0, -.72, .14); box(w, .06, 1.04, .14, tr, 0, 0, .07);
  if (RND() < .35) for (const sx of [-1, 1]) box(w, .42, 1.2, .07, PICK([M.teal, M.roof2, M.roof]), sx * .8, 0, .08);
  if (RND() < .25) { box(w, 1, .26, .3, M.roof2, 0, -.55, .3); for (let k = 0; k < 3; k++) add(w, new T.IcosahedronGeometry(.13, 0), PICK([M.pink, M.teal]), -.3 + k * .3, -.36, .3); }
}
function balustrade(b, x, y, z, len, ry) { const M = mats(), r = sub(b, x, z, ry, y); box(r, len, .12, .2, M.marble, 0, .95, 0); box(r, len, .1, .24, M.marble2, 0, .05, 0); const n = Math.max(2, Math.round(len / .42)); for (let k = 0; k <= n; k++) cyl(r, .06, .08, .85, M.marble, -len / 2 + k * len / n, .5, 0, 6); }
function villa(g, x, z, ry, y, s) {   // sütunlu saray (frizli, akroterli, havuzlu)
  const M = mats(), b = sub(g, x, z, ry, y), w = 12 * s, d = 9 * s, h = 6.5 * s, wm = PICK([M.marble, M.marble, M.sandst, M.teal]), tr = wm === M.marble ? M.teal : M.marble;
  box(b, w + 3, 1.2, d + 4, M.marble2, 0, .6, 0); for (let k = 0; k < 3; k++) box(b, w * .5 + k * .6, .4, .7, M.marble, 0, .2 + k * .4, d / 2 + 2.9 - k * .5);
  box(b, w, h, .7, wm, 0, 1.2 + h / 2, -d / 2); box(b, .7, h, d, wm, -w / 2, 1.2 + h / 2, 0); box(b, .7, h, d, wm, w / 2, 1.2 + h / 2, 0);
  const dw = 2.4 * s; box(b, (w - dw) / 2, h, .7, wm, -(w + dw) / 4, 1.2 + h / 2, d / 2); box(b, (w - dw) / 2, h, .7, wm, (w + dw) / 4, 1.2 + h / 2, d / 2); box(b, dw, h * .35, .7, wm, 0, 1.2 + h * .825, d / 2);
  box(b, dw * .9, h * .62, .2, M.dark, 0, 1.2 + h * .31, d / 2 - .3); add(b, new T.TorusGeometry(dw * .5, .12, 5, 14, Math.PI), M.gold, 0, 1.2 + h * .62, d / 2 + .38);
  for (const sx of [-1, 1]) { windowAt(b, sx * (w / 2 + .36), 1.2 + h * .55, 0, sx * Math.PI / 2, wm); windowAt(b, sx * (w / 2 + .36), 1.2 + h * .55, -d * .3, sx * Math.PI / 2, wm, RND() < .3); windowAt(b, sx * w * .3, 1.2 + h * .55, d / 2 + .36, 0, wm); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(b, .55, h, .55, tr, sx * w / 2, 1.2 + h / 2, sz * d / 2);
  const n = s > 1.2 ? 6 : 4; for (let i = 0; i < n; i++) column(b, -w / 2 + .9 + i * (w - 1.8) / (n - 1), d / 2 + 1.6, 1.2, h - .2, .38 * s, M.marble, RND() < .12);
  box(b, w + 1.6, .6, d + 3.2, M.marble2, 0, 1.2 + h + .3, .8); box(b, w + 1.7, .35, d + 3.3, tr, 0, 1.2 + h - .1, .8);
  for (let k = 0; k < Math.round(w / 1.2); k++) box(b, .35, .3, .12, M.gold, -w / 2 + .6 + k * 1.2, 1.2 + h - .1, d / 2 + 2.45);   // friz süsleri
  const roofY = 1.2 + h + .6, rh = 2.6 * s;
  if (RND() < .3) { add(b, new T.SphereGeometry(Math.min(w, d) * .36, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.roof, 0, roofY, 0); cyl(b, .5, .7, 1.2, M.gold, 0, roofY + Math.min(w, d) * .36 + .5, 0, 8); }
  else { add(b, prism(w + 1.6, d + 3.2, rh), PICK([M.roof, M.roof2, M.marble]), 0, roofY, .8); add(b, new T.CylinderGeometry(.75, .75, .15, 14).rotateX(Math.PI / 2), M.gold, 0, roofY + rh * .38, .8 + (d + 3.2) / 2 + .02);
    for (const sx of [-1, 1]) add(b, new T.ConeGeometry(.32, .9, 6), M.gold, sx * (w / 2 + .6), roofY + .45, .8 + (d + 3.2) / 2); add(b, new T.ConeGeometry(.3, 1, 6), M.gold, 0, roofY + rh + .4, .8 + (d + 3.2) / 2); }
  if (RND() < .55) { const f = sub(b, 0, d / 2 + 6.5, 0, 0); cyl(f, 2.2, 2.4, .7, M.marble2, 0, .35, 0, 18); cyl(f, 1.9, 1.9, .1, M.teal, 0, .66, 0, 18); cyl(f, .25, .3, 1.6, M.marble, 0, 1.1, 0, 8); add(f, new T.SphereGeometry(.45, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.marble, 0, 1.9, 0); }
  for (const sx of [-1, 1]) { const u = sub(b, sx * (w * .25 + .8), d / 2 + 3.4, 0, .4); cyl(u, .35, .25, .5, M.marble2, 0, .25, 0, 8); add(u, new T.IcosahedronGeometry(.4, 0), M.pink, 0, .7, 0); }
  if (RND() < .45) for (let k = 0; k < 2; k++) add(b, new T.IcosahedronGeometry(R(.6, 1.2), 0), M.pink, R(-w / 2, w / 2), roofY + R(.4, 1.4), R(-d / 2, d / 2));
  ob(x, z, Math.min(w, d) * .62 + 1, y + 1.2 + h + 2.6 * s);
}
function house(g, x, z, ry, y) {   // ayrıntılı ev: kemerli kapı, çerçeveli pencereler, köşe sütunları, friz, balkon, çatı terası / kubbe
  const M = mats(), b = sub(g, x, z, ry, y), w = R(5.5, 8.5), d = R(5, 7.5), h = R(3.6, 5.2), wm = PICK([M.marble, M.sandst, M.teal, M.marble2]), tr = wm === M.marble ? M.teal : M.marble, fl = RND() < .42 ? 2 : 1, h0 = .35;
  box(b, w + .7, h0, d + .7, M.marble2, 0, h0 / 2, 0); box(b, w, h, d, wm, 0, h0 + h / 2, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(b, .36, h, .36, tr, sx * w / 2, h0 + h / 2, sz * d / 2);
  box(b, w + .3, .3, d + .3, tr, 0, h0 + h - .15, 0); box(b, w + .1, .12, d + .1, M.gold, 0, h0 + h - .38, 0);
  // kemerli kapı + basamak
  box(b, 1.3, 2, .12, M.dark, 0, h0 + 1, d / 2 + .02); add(b, new T.CylinderGeometry(.65, .65, .12, 12, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2), M.dark, 0, h0 + 2, d / 2 + .02);
  add(b, new T.TorusGeometry(.76, .1, 5, 12, Math.PI), tr, 0, h0 + 2, d / 2 + .06); for (const sx of [-1, 1]) box(b, .18, 2, .16, tr, sx * .76, h0 + 1, d / 2 + .06);
  box(b, 1.9, .2, .7, M.marble, 0, .1, d / 2 + .6); box(b, 1.6, .2, .4, M.marble, 0, .3, d / 2 + .5);
  if (RND() < .5) for (const sx of [-1, 1]) { cyl(b, .22, .16, .45, M.roof2, sx * 1.25, h0 + .22, d / 2 + .5, 8); add(b, new T.IcosahedronGeometry(.28, 0), PICK([M.pink, M.teal]), sx * 1.25, h0 + .6, d / 2 + .5); }
  // pencereler
  if (w > 6.2) for (const sx of [-1, 1]) windowAt(b, sx * w * .32, h0 + h * .56, d / 2 + .02, 0, wm, RND() < .2); else windowAt(b, w * .3, h0 + h * .56, d / 2 + .02, 0, wm);
  for (const sx of [-1, 1]) windowAt(b, sx * (w / 2 + .02), h0 + h * .56, 0, sx * Math.PI / 2, wm, RND() < .25);
  windowAt(b, 0, h0 + h * .56, -d / 2 - .02, Math.PI, wm, true);
  let top = h0 + h;
  if (fl === 2) { const w2 = w * .66, d2 = d * .66, h2 = R(2.6, 3.4), zc = -d * .12; box(b, w2, h2, d2, wm, 0, top + h2 / 2, zc); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(b, .28, h2, .28, tr, sx * w2 / 2, top + h2 / 2, zc + sz * d2 / 2);
    windowAt(b, 0, top + h2 * .55, zc + d2 / 2 + .02, 0, wm, RND() < .3); box(b, w2 + .25, .25, d2 + .25, tr, 0, top + h2 - .12, zc);
    balustrade(b, 0, top, d / 2 - .2, w * .9, 0); for (const sx of [-1, 1]) balustrade(b, sx * (w / 2 - .2), top, zc + d2 / 2 + (d / 2 - zc - d2 / 2) / 2, d / 2 - zc - d2 / 2, Math.PI / 2);
    top += h2; }
  const rk = RND();
  if (rk < .38) { const rr = Math.min(fl === 2 ? w * .66 : w, fl === 2 ? d * .66 : d) * .34, zc = fl === 2 ? -d * .12 : 0; cyl(b, rr + .15, rr + .15, .3, M.marble2, 0, top + .15, zc, 14); add(b, new T.SphereGeometry(rr, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), PICK([M.roof, M.teal, M.roof]), 0, top + .3, zc); cyl(b, .18, .22, .5, M.gold, 0, top + .3 + rr + .2, zc, 8); add(b, new T.ConeGeometry(.2, .5, 6), M.gold, 0, top + .3 + rr + .7, zc); top += rr + 1; }
  else if (rk < .7) { const ww = fl === 2 ? w * .66 : w, dd = fl === 2 ? d * .66 : d, zc = fl === 2 ? -d * .12 : 0; box(b, ww + .3, .3, dd + .3, M.marble2, 0, top + .15, zc);
    for (let k = 0; k < Math.round((ww + dd) * 2 / 1.1); k++) { const p = k * 1.1, per = (ww + dd) * 2; let px, pz; if (p < ww) { px = -ww / 2 + p; pz = dd / 2; } else if (p < ww + dd) { px = ww / 2; pz = dd / 2 - (p - ww); } else if (p < ww * 2 + dd) { px = ww / 2 - (p - ww - dd); pz = -dd / 2; } else { px = -ww / 2; pz = -dd / 2 + (p - ww * 2 - dd); } if (p < per) box(b, .5, .5, .5, M.marble2, px, top + .55, zc + pz); }
    if (RND() < .6) amphora(sub(b, R(-ww / 4, ww / 4), zc + R(-dd / 4, dd / 4), 0, top + .3), 0, 0); if (RND() < .5) coralClump(sub(b, R(-ww / 4, ww / 4), zc + R(-dd / 4, dd / 4), 0, top + .3)); top += .8; }
  else { const ww = fl === 2 ? w * .66 : w, dd = fl === 2 ? d * .66 : d, zc = fl === 2 ? -d * .12 : 0, rh = R(1.4, 2.2); add(b, new T.ConeGeometry(Math.hypot(ww, dd) / 2 + .3, rh, 4).rotateY(Math.PI / 4).scale(ww / Math.hypot(ww, dd) * 1.414, 1, dd / Math.hypot(ww, dd) * 1.414), PICK([M.roof2, M.roof]), 0, top + rh / 2, zc); top += rh; }
  if (RND() < .33) { const yd = sub(b, 0, 0, 0, 0), L = d / 2 + 3.2; for (const sx of [-1, 1]) { box(yd, .3, .9, L - d / 2 + .2, M.marble2, sx * (w / 2 + 1), .45, d / 2 + (L - d / 2) / 2); box(yd, (w + 2) / 2 - 1.2, .9, .3, M.marble2, sx * ((w + 2) / 4 + .6), .45, L); } }
  ob(x, z, Math.max(w, d) * .58, y + top + .5);
}
function coralClump(g) { const M = mats(); for (let k = 0; k < 3; k++) { add(g, new T.IcosahedronGeometry(R(.3, .7), 0), PICK([M.pink, M.teal, M.sandst]), R(-.6, .6), R(0, .4), R(-.6, .6)); } }
function ruin(g, x, z, y) {
  const M = mats(), n = RI(3, 6), r = R(.4, .6); let top = 2;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + R(0, .4), rr = R(2, 4); top = Math.max(top, column(g, x + Math.cos(a) * rr, z + Math.sin(a) * rr, y, R(3, 7), r, M.marble, true)); }
  const fc = cyl(g, r, r, R(4, 7), M.marble, x + R(-2, 2), y + r, z + R(-2, 2), 10); fc.rotation.set(Math.PI / 2, 0, R(0, 3));
  for (let k = 0; k < 4; k++) box(g, R(.6, 1.4), R(.4, 1), R(.6, 1.4), PICK([M.marble, M.marble2, M.sandst]), x + R(-4, 4), y + .3, z + R(-4, 4)).rotation.set(R(0, .5), R(0, 3), R(0, .5));
  ob(x, z, 3.2, y + top * .6);
}
function tholos(g, x, z, y, rr = 5) {   // yuvarlak küçük tapınak
  const M = mats(); cyl(g, rr + 1.5, rr + 2, 1, M.marble2, x, y + .5, z, 20); const n = 10;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; column(g, x + Math.cos(a) * rr, z + Math.sin(a) * rr, y + 1, 6, .35, M.marble, RND() < .1); }
  cyl(g, rr + .8, rr + .8, .6, M.marble2, x, y + 7.9, z, 20); add(g, new T.SphereGeometry(rr + .6, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.roof, x, y + 8.2, z);
  ob(x, z, rr + 1.5, y + 13);
}
function tower(g, x, z, y) {
  const M = mats(), h = R(14, 22), r = R(2.4, 3.4), wm = PICK([M.marble, M.teal, M.sandst]); cyl(g, r + .6, r + .9, 1.2, M.marble2, x, y + .6, z, 14); cyl(g, r, r * 1.05, h, wm, x, y + 1.2 + h / 2, z, 14);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .4; box(g, .8, 1.4, .3, M.dark, x + Math.cos(a) * r, y + h * .7, z + Math.sin(a) * r).rotation.y = -a + Math.PI / 2; }
  cyl(g, r + .7, r + .7, .8, M.marble2, x, y + 1.2 + h + .4, z, 14); add(g, new T.ConeGeometry(r + .5, r * 2, 14), PICK([M.roof, M.gold]), x, y + 1.2 + h + .8 + r, z);
  ob(x, z, r + .9, y + h + 2 + r * 2);
}
function spire(g, x, z, y, alt) {   // kristal kule
  const M = mats(), h = R(18, 30); cyl(g, 2.6, 3.2, 2, M.marble2, x, y + 1, z, 8); const c = add(g, new T.OctahedronGeometry(1.6, 0), alt ? M.crystal2 : M.crystal, x, y + 2 + h / 2, z); c.scale.set(1, h / 3.2, 1);
  for (let k = 0; k < 3; k++) { const a = k * 2.1, s = add(g, new T.OctahedronGeometry(.8, 0), alt ? M.crystal2 : M.crystal, x + Math.cos(a) * 2.4, y + 2 + h * .2, z + Math.sin(a) * 2.4); s.scale.set(1, R(3, 5), 1); s.rotation.z = Math.cos(a) * .3; s.rotation.x = Math.sin(a) * .3; }
  AT.glow.push([x, y + 2 + h, z, alt ? 0xd7a8ff : 0x9ff3ff, 9]); AT.glow.push([x, y + 2 + h * .5, z, alt ? 0xd7a8ff : 0x9ff3ff, 7]); ob(x, z, 3.2, y + 2 + h);
}
function lamp(g, x, z, y) { const M = mats(); cyl(g, .12, .16, 4, M.bronze, x, y + 2, z, 6); cyl(g, .3, .3, .2, M.bronze, x, y + 4.05, z, 8); add(g, new T.SphereGeometry(.35, 10, 8), M.lamp, x, y + 4.45, z); AT.glow.push([x, y + 4.45, z, 0xbff9ff, 3.2]); }
function statue(g, x, z, y, s, ry) {   // 🔱 deniz bekçisi heykeli (bu oyuna özgü)
  const M = mats(), b = sub(g, x, z, ry, y); b.scale.setScalar(s); const m = M.bronze;
  box(b, 3, 1.4, 3, M.marble2, 0, .7, 0); add(b, new T.ConeGeometry(1.15, 4.2, 12), m, 0, 3.5, 0); cyl(b, .45, .62, 1.5, m, 0, 6.2, 0, 10); add(b, new T.SphereGeometry(.5, 12, 10), m, 0, 7.4, 0);
  add(b, new T.ConeGeometry(.55, .7, 10), m, 0, 7.95, -.05).rotation.x = -.2;
  const ar = cyl(b, .17, .17, 1.7, m, .75, 6.1, .2, 6); ar.rotation.z = -.5; const ar2 = cyl(b, .17, .17, 1.6, m, -.65, 5.9, 0, 6); ar2.rotation.z = .25;
  cyl(b, .07, .07, 6.5, M.gold, 1.25, 6.4, .35, 6); box(b, .9, .1, .1, M.gold, 1.25, 9.4, .35); for (const dx of [-.42, 0, .42]) add(b, new T.ConeGeometry(.08, .7, 5), M.gold, 1.25 + dx, 9.8, .35);
  ob(x, z, 1.9 * s, y + 9.8 * s);
}
function amphi(g, x, z, y, ry) {   // amfitiyatro: yarım halka basamaklar
  const M = mats(), b = sub(g, x, z, ry, y), r0 = 8;
  for (let i = 0; i < 9; i++) { const r = r0 + i * 1.7 + .85, n = 10 + i * 2; for (let k = 0; k < n; k++) { const a = (k + .5) / n * Math.PI, s2 = sub(b, Math.cos(a) * r, -Math.sin(a) * r, a, 0); box(s2, 1.75, (i + 1) * .75, r * Math.PI / n + .15, i % 2 ? M.marble : M.marble2, 0, (i + 1) * .375, 0); } }
  box(b, 14, .8, 8, M.marble2, 0, .4, 4); for (let i = 0; i < 6; i++) column(b, -7 + i * 2.8, 8.5, .8, 5, .3, M.marble, RND() < .3);
  ob(x, z, 10, y + 4);
}
function market(g, x, z, y) {
  const M = mats(); for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, rr = 9, sx = x + Math.cos(a) * rr, sz = z + Math.sin(a) * rr, s = sub(g, sx, sz, -a + Math.PI / 2, y);
    for (const [px, pz] of [[-1.4, -1], [1.4, -1], [-1.4, 1], [1.4, 1]]) cyl(s, .08, .08, 2.6, M.wood, px, 1.3, pz, 5); const rf = box(s, 3.4, .12, 2.6, PICK([M.pink, M.teal, M.roof2]), 0, 2.7, 0); rf.rotation.x = .18; box(s, 2.8, .8, 1, M.wood2, 0, .4, -.4);
    for (let j = 0; j < 3; j++) amphora(s, R(-1.2, 1.2), R(.4, 1.2)); }
  cyl(g, 3, 3.4, .8, M.marble2, x, y + .4, z, 16); cyl(g, 2.4, 2.4, .2, M.teal, x, y + .9, z, 16); statue(g, x, z, y + .8, .45, 0);
}
function amphora(g, x, z) { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new T.Vector2(.08 + Math.sin(t * Math.PI) * .25 + (t > .85 ? .05 : 0), t * 1)); } add(g, new T.LatheGeometry(pts, 8), PICK([mats().roof2, mats().sandst]), x, 0, z); }
function arch(g, x, z, y, ry, w, h, m) {   // kemer kapı
  const M = mats(), b = sub(g, x, z, ry, y); box(b, 2.2, h, 3, m || M.marble, -w / 2 - 1.1, h / 2, 0); box(b, 2.2, h, 3, m || M.marble, w / 2 + 1.1, h / 2, 0);
  const t = add(b, new T.TorusGeometry(w / 2 + 1.1, 1.1, 6, 16, Math.PI), m || M.marble, 0, h, 0); t.scale.z = 1.36; box(b, w + 4.4, 1.4, 3, m || M.marble2, 0, h + w / 2 + 1.8, 0);
}

/* ---------- 🏙️ şehir kurulumu (parçalara bölünür, uzaktakiler gizlenir) ---------- */
function chunk(key, cx, cz, build) {
  const grp = G.staticPH('atl_' + key, () => { const g = new T.Group(); build(g); return g; }); grp.userData.c = new T.Vector2(cx, cz); AT.g.add(grp); AT.chunks.push(grp); return grp;
}
function nearGate(a, rr, w) { for (const ga of GATES) { let d = Math.abs(((a - ga + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (d * rr < w) return true; } return false; }
function buildCity() {
  const M = mats(); AT.glow = []; OBS = [];
  // 🏛️ akropol: büyük kristal tapınak
  chunk('temple', 0, 0, g => { const y = floorH(0, 0);
    for (let i = 0; i < 4; i++) cyl(g, 30 - i * 3.2, 31 - i * 3.2, 1.2, M.marble2, 0, y + .6 + i * 1.2, 0, 32);
    const yt = y + 4.8, n = 24; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; column(g, Math.cos(a) * 19, Math.sin(a) * 19, yt, 15, .9, M.marble, false); ob(Math.cos(a) * 19, Math.sin(a) * 19, 1.3, yt + 16); }
    cyl(g, 20.5, 20.5, 1.6, M.marble2, 0, yt + 16.6, 0, 32); cyl(g, 19.5, 19.5, 1, M.gold, 0, yt + 17.9, 0, 32);
    add(g, new T.SphereGeometry(18, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.roof, 0, yt + 18.4, 0); cyl(g, 2, 2.6, 3, M.gold, 0, yt + 37.5, 0, 12);
    cyl(g, 9, 9.5, 2.5, M.marble2, 0, yt + 1.25, 0, 20); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; statue(g, Math.cos(a) * 7, Math.sin(a) * 7, yt + 2.5, .55, -a - Math.PI / 2); }
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, s = sub(g, Math.cos(a) * 27, Math.sin(a) * 27, -a + Math.PI / 2, y); for (let i = 0; i < 5; i++) box(s, 12, .9, 1.6, M.marble, 0, .45 + i * .9, 3.2 - i * 1.6); }
    ob(0, 0, 8.5, yt + 2.5); });
  // 🔮 dev kristal (şehrin kalbi) — ayrı, döner
  { const y = floorH(0, 0) + 4.8 + 52; AT.crystal = new T.Mesh(new T.OctahedronGeometry(5, 0), M.crystal); AT.crystal.scale.set(1, 1.9, 1); AT.crystal.position.set(0, y, 0); AT.g.add(AT.crystal);
    AT.ring = new T.Mesh(new T.TorusGeometry(9, .35, 8, 48), M.gold); AT.ring.position.set(0, y, 0); AT.g.add(AT.ring); AT.glow.push([0, y, 0, 0x9ff3ff, 34]);
    for (let k = 0; k < 3; k++) { const m = new T.Mesh(new T.OctahedronGeometry(1.4, 0), M.crystal2); m.userData.k = k; AT.g.add(m); (AT.orbs = AT.orbs || []).push(m); } }
  // 🧱 surlar, köprüler, kapılar
  for (let wi = 0; wi < 3; wi++) { const [r0, r1, h] = WALLS[wi], rm = (r0 + r1) / 2, segN = Math.round(rm * Math.PI * 2 / 9);
    for (let q = 0; q < 8; q++) chunk(`wall${wi}_${q}`, Math.cos((q + .5) * Math.PI / 4) * rm, Math.sin((q + .5) * Math.PI / 4) * rm, g => {
      for (let i = 0; i < segN; i++) { const a = (i + .5) / segN * Math.PI * 2; if (Math.floor(((a + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) !== q) continue; if (nearGate(a, rm, 8)) continue;
        const x = Math.cos(a) * rm, z = Math.sin(a) * rm, y = floorH(x, z), broken = RND() < .1, hh = broken ? h * R(.35, .7) : h, s = sub(g, x, z, -a, y);
        box(s, r1 - r0, hh, 9.6, wi === 2 ? M.sandst : M.marble2, 0, hh / 2, 0); if (!broken) { box(s, r1 - r0 + .6, .7, 9.8, M.marble, 0, hh + .35, 0); for (const dz of [-3, 0, 3]) box(s, r1 - r0 + .6, 1, 1.4, M.marble, 0, hh + 1.2, dz); }
        if (i % 6 === 0 && !broken) { cyl(s, (r1 - r0) * .9, (r1 - r0), hh + 4, M.marble, 0, (hh + 4) / 2, 0, 10); add(s, new T.ConeGeometry((r1 - r0) * .95, 4, 10), M.roof, 0, hh + 6, 0); }
        if (RND() < .15) { const c = sub(s, 0, hh + .7, R(-3, 3), 0); coralClump(c); } }
      for (const a of GATES) { if (Math.floor(((a + Math.PI * 2 + .001) % (Math.PI * 2)) / (Math.PI / 4)) !== q) continue;
        const x = Math.cos(a) * rm, z = Math.sin(a) * rm; arch(g, x, z, floorH(x, z), -a + Math.PI / 2, 12, h + 2, wi === 2 ? M.sandst : M.marble);
        const [ca, cb] = CANALS[wi], cm = (ca + cb) / 2, s = sub(g, Math.cos(a) * cm, Math.sin(a) * cm, -a + Math.PI / 2, .2);   // 🌉 köprü
        box(s, 9, .8, cb - ca + 3, M.marble2, 0, 0, 0); for (const sx of [-4.3, 4.3]) box(s, .5, 1, cb - ca + 3, M.marble, sx, .9, 0);
        const ar = add(s, new T.TorusGeometry((cb - ca) / 2, .9, 6, 14, Math.PI), M.marble2, 0, -3.9, 0); ar.rotation.y = Math.PI / 2; ar.scale.set(1, .45, 5); } }); }
  // 🏠 1. bölge: saraylar · 2. bölge: evler, kuleler, kristal kuleler, harabeler
  const RINGS_B = [[80, 22, 'villa'], [103, 22, 'villa'], [150, 15, 'mix'], [170, 15, 'mix'], [192, 15, 'mix']];
  const LM = [[Math.PI / 4, 172, 'amphi'], [Math.PI * 3 / 4, 172, 'market'], [-Math.PI * 3 / 4, 172, 'garden'], [-Math.PI / 4, 172, 'tholos']];
  for (let q = 0; q < 8; q++) for (let band = 0; band < 2; band++) chunk(`dist${q}_${band}`, Math.cos((q + .5) * Math.PI / 4) * (band ? 172 : 92), Math.sin((q + .5) * Math.PI / 4) * (band ? 172 : 92), g => {
    RND = mul32(1000 + q * 10 + band);
    for (const [rr, sp, kind] of RINGS_B) { if ((rr < 120) !== !band) continue; const n = Math.round(rr * Math.PI * 2 / sp);
      for (let i = 0; i < n; i++) { const a = (i + (rr % 2 ? .5 : 0)) / n * Math.PI * 2 + R(-.02, .02); if (Math.floor(((a + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) !== q) continue; if (nearGate(a, rr, 11)) continue;
        if (band && LM.some(([la, lr]) => Math.abs(((a - la + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * rr < 26 && Math.abs(rr - lr) < 30)) continue;
        const x = Math.cos(a) * rr + R(-1.5, 1.5), z = Math.sin(a) * rr + R(-1.5, 1.5), y = floorH(x, z), ry = Math.atan2(-x, -z);
        if (kind === 'villa') villa(g, x, z, ry, y, R(1, 1.5));
        else { const k = RND(); if (k < .5) house(g, x, z, ry, y); else if (k < .62) tower(g, x, z, y); else if (k < .8) ruin(g, x, z, y); else if (k < .88) tholos(g, x, z, y, 3.5); else spire(g, x, z, y, RND() < .4); } }
      // caddedeki lambalar
    }
    for (const ga of GATES) { if (Math.floor(((ga + Math.PI * 2 + .001) % (Math.PI * 2)) / (Math.PI / 4)) !== q) continue; for (let rr = band ? 146 : 68; rr < (band ? 206 : 118); rr += 12) for (const s of [-1, 1]) { const px = Math.cos(ga) * rr - Math.sin(ga) * 6 * s, pz = Math.sin(ga) * rr + Math.cos(ga) * 6 * s; lamp(g, px, pz, floorH(px, pz)); }
      const s0 = sub(g, Math.cos(ga) * (band ? 174 : 91), Math.sin(ga) * (band ? 174 : 91), -ga + Math.PI / 2, 0); box(s0, 9, .5, band ? 66 : 52, M.marble2, 0, floorH(Math.cos(ga) * (band ? 174 : 91), Math.sin(ga) * (band ? 174 : 91)) + .1, 0); }
    if (band) for (const [la, lr, kind] of LM) { if (Math.floor(((la + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) !== q) continue; const x = Math.cos(la) * lr, z = Math.sin(la) * lr, y = floorH(x, z);
      if (kind === 'amphi') amphi(g, x, z, y, Math.atan2(-x, -z) + Math.PI); else if (kind === 'market') market(g, x, z, y); else if (kind === 'tholos') { tholos(g, x, z, y, 7); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; lamp(g, x + Math.cos(a) * 12, z + Math.sin(a) * 12, y); } }
      else { for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; statue(g, x + Math.cos(a) * 10, z + Math.sin(a) * 10, floorH(x + Math.cos(a) * 10, z + Math.sin(a) * 10), R(.35, .55), -a - Math.PI / 2 + Math.PI); } spire(g, x, z, y, true); } }
  });
  // 🌉 su kemeri (2. bölgenin dışında yay)
  chunk('aqueduct', Math.cos(-.3) * 205, Math.sin(-.3) * 205, g => { RND = mul32(77); const rr = 205; for (let a = -1.1; a < .55; a += .055) { if (nearGate(a, rr, 9) || RND() < .1) continue; const x = Math.cos(a) * rr, z = Math.sin(a) * rr, y = floorH(x, z), s = sub(g, x, z, -a, y);
      box(s, 2.4, 13, 2.4, M.sandst, 0, 6.5, -5.6); const t = add(s, new T.TorusGeometry(4.4, .9, 6, 12, Math.PI), M.sandst, 0, 13, 0); t.rotation.y = Math.PI / 2; t.scale.set(1, 1, 1.3); box(s, 2.6, 1.6, 11.3, M.sandst, 0, 18.2, 0); box(s, 2, .4, 11.3, M.teal, 0, 19.1, 0); ob(x + 5.6 * Math.sin(a), z - 5.6 * Math.cos(a), 1.6, y + 13); } });
  // 🗿 dış dünya: ana kapı heykelleri, fener, batık gemiler, dev heykel başı, uçurum bacaları
  chunk('outer_s', 0, -250, g => { RND = mul32(501); for (const s of [-1, 1]) statue(g, s * 16, -244, floorH(s * 16, -244), 2.3, Math.PI);
    for (let k = 0; k < 6; k++) { const x = R(-60, 60), z = R(-300, -255); ruin(g, x, z, floorH(x, z)); } });
  chunk('lighthouse', 170, 175, g => { const x = 172, z = 178, y = floorH(x, z); cyl(g, 7, 9, 3, M.rock, x, y + 1.5, z, 14); cyl(g, 4, 5.4, 34, M.marble, x, y + 20, z, 16); for (let i = 0; i < 5; i++) cyl(g, 5.2 - i * .28, 5.2 - i * .28, .8, M.roof2, x, y + 8 + i * 6.5, z, 16);
    cyl(g, 4.6, 4.6, 1, M.marble2, x, y + 37.5, z, 16); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; cyl(g, .25, .25, 4, M.marble, x + Math.cos(a) * 3.6, y + 40, z + Math.sin(a) * 3.6, 6); } add(g, new T.ConeGeometry(4.8, 5, 16), M.roof, x, y + 44.5, z);
    add(g, new T.OctahedronGeometry(1.8, 0), M.crystal, x, y + 40, z); AT.glow.push([x, y + 40, z, 0x9ff3ff, 22]); AT.light0 = new T.Vector3(x, y + 40, z); ob(x, z, 7.5, y + 47); });
  chunk('wrecks', 0, -380, g => { RND = mul32(611); for (const [x, z, ry, s] of [[-70, -360, .6, 1.15], [55, -410, -1.1, 1], [150, -330, 2.2, .9], [-160, -440, -2.6, .85]]) ship(g, x, z, ry, s); });
  chunk('reefhead', 360, 40, g => { RND = mul32(721); const x = 360, z = 40, y = floorH(x, z), s = sub(g, x, z, -1.2, y - 2); s.rotation.z = .35; const M2 = mats();
    add(s, new T.SphereGeometry(9, 16, 12), M2.bronze, 0, 8, 0).scale.set(1, 1.25, 1); box(s, 3, 6, 4, M2.bronze, 0, 8, 8.5).rotation.x = -.15; for (const sx of [-1, 1]) { box(s, 3.4, 1.2, 1.5, M2.dark, sx * 3.6, 11.5, 8); add(s, new T.SphereGeometry(1.1, 8, 6), M2.dark, sx * 3.6, 10.6, 8.3); } box(s, 6, 1, 1.5, M2.dark, 0, 3.6, 8.4);
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; add(s, new T.ConeGeometry(.9, 4, 6), M2.gold, Math.cos(a) * 6, 19 + Math.sin(a * 2) * .3, Math.sin(a) * 6 - 1).rotation.set(Math.sin(a) * .5, 0, -Math.cos(a) * .5); } ob(x, z, 10, y + 20);
    for (let k = 0; k < 5; k++) { const cx2 = x + R(-40, 40), cz2 = z + R(-40, 40); ruin(g, cx2, cz2, floorH(cx2, cz2)); } });
  chunk('trench', -430, 0, g => { RND = mul32(831); for (let k = 0; k < 9; k++) { const z = R(-300, 300), x = -430 + Math.sin(z * .012) * 45 + R(-12, 12), y = floorH(x, z), h = R(5, 13);
      add(g, new T.CylinderGeometry(R(.6, 1), R(2, 3), h, 8), M.rock2, x, y + h / 2, z); add(g, new T.TorusGeometry(R(.7, 1.1), .3, 6, 10), M.ember, x, y + h, z).rotation.x = Math.PI / 2; AT.vents.push(new T.Vector3(x, y + h + .3, z)); AT.glow.push([x, y + h, z, 0xff9a4a, 6]); ob(x, z, 2.2, y + h); }
    for (let k = 0; k < 40; k++) { const z = R(-420, 420), side = PICK([-1, 1]), x = -430 + Math.sin(z * .012) * 45 + side * R(40, 80), y = floorH(x, z), s = R(2, 7); add(g, new T.DodecahedronGeometry(s, 0), PICK([M.rock, M.rock2]), x, y + s * .4, z).rotation.set(R(0, 3), R(0, 3), 0); } });
  for (const ch of AT.chests) { const cs = sub(AT.g, ch.p.x, ch.p.z, ch.ry, ch.p.y); box(cs, 1.4, .8, .9, M.wood, 0, .4, 0); box(cs, 1.45, .1, .95, M.gold, 0, .78, 0); for (let k = 0; k < 6; k++) add(cs, new T.CylinderGeometry(.09, .09, .03, 10), M.gold, R(-.5, .5), .82, R(-.3, .3));
    ch.lid = sub(cs, 0, -.45, 0, .85); box(ch.lid, 1.45, .28, .95, M.wood, 0, .14, .45); box(ch.lid, 1.5, .08, .2, M.gold, 0, .14, .9); }
  // 🔤 ana kapının üstünde ATLANTİS yazısı
  { const tex = canvasTex(1024, 192, (g, W, H) => { g.font = 'bold 150px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 10; g.strokeStyle = '#3a2a00'; g.strokeText('ATLANTİS', W / 2, H / 2 + 6); const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#fff2b0'); gr.addColorStop(1, '#d4a73a'); g.fillStyle = gr; g.fillText('ATLANTİS', W / 2, H / 2 + 6); });
    const y = floorH(0, -228); for (const [rz, ry] of [[-230.4, Math.PI], [-225.6, 0]]) { const p = new T.Mesh(new T.PlaneGeometry(26, 4.9), new T.MeshStandardMaterial({ map: tex, transparent: true, emissive: 0xffd36a, emissiveMap: tex, emissiveIntensity: .5, roughness: .4 })); p.position.set(0, y + 24.4, rz); p.rotation.y = ry; AT.g.add(p); } }
  // 📍 caddede lamba ışıltıları
  const gp = new Float32Array(AT.glow.length * 3), gc = new Float32Array(AT.glow.length * 3), gs = new Float32Array(AT.glow.length), col = new T.Color();
  AT.glow.forEach(([x, y, z, c, s], i) => { gp[i * 3] = x; gp[i * 3 + 1] = y; gp[i * 3 + 2] = z; col.setHex(c); gc[i * 3] = col.r; gc[i * 3 + 1] = col.g; gc[i * 3 + 2] = col.b; gs[i] = s; });
  const gg = new T.BufferGeometry(); gg.setAttribute('position', new T.BufferAttribute(gp, 3)); gg.setAttribute('color', new T.BufferAttribute(gc, 3)); gg.setAttribute('size', new T.BufferAttribute(gs, 1));
  AT.glowPts = new T.Points(gg, glowMat()); AT.glowPts.frustumCulled = false; AT.g.add(AT.glowPts);
}
function glowMat() {   // boyutu noktaya göre değişen parıltı
  return new T.ShaderMaterial({ uniforms: { map: { value: glowTex() }, uTime: U.uTime, fogColor: { value: new T.Color() }, fogNear: { value: 1 }, fogFar: { value: 1000 } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false,
    vertexShader: `attribute float size; varying vec3 vC; varying float vF; uniform float uTime; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); float tw = .85 + .15 * sin(uTime * 2.0 + position.x * .3 + position.z * .2); gl_PointSize = size * tw * 300.0 / -mv.z; gl_Position = projectionMatrix * mv; vF = -mv.z; }`,
    fragmentShader: `uniform sampler2D map; varying vec3 vC; varying float vF; uniform vec3 fogColor; uniform float fogNear; uniform float fogFar; void main(){ vec4 t = texture2D(map, gl_PointCoord); float f = 1.0 - smoothstep(fogNear, fogFar * 1.3, vF); gl_FragColor = vec4(vC * t.a * f, t.a * f); }`, vertexColors: true });
}
function ship(g, x, z, ry, s) {   // batık gemi
  const M = mats(), y = floorH(x, z), b = sub(g, x, z, ry, y - 1.2); b.scale.setScalar(s); b.rotation.z = R(-.35, .35);
  const hull = add(b, new T.SphereGeometry(1, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.wood, 0, 3.4, 0); hull.scale.set(4.2, 3.6, 13);
  box(b, 7.6, .4, 22, M.wood2, 0, 3.4, 0); box(b, 7, 3, 4, M.wood, 0, 5, -9); box(b, 6.4, .4, 4.4, M.wood2, 0, 6.6, -9);
  for (const [mz, mh, br] of [[5, 18, .6], [-2, 22, .35]]) { const hh = mh * (1 - br * R(.5, 1)), m = cyl(b, .35, .45, hh, M.wood2, 0, 3.6 + hh / 2, mz, 8); m.rotation.z = R(-.25, .25); if (hh > 10) { const sl = box(b, .1, 5, 7, M.marble2, .4, 3.6 + hh * .7, mz); sl.rotation.z = m.rotation.z; } }
  for (let k = 0; k < 5; k++) cyl(b, .5, .5, 1.2, M.wood, R(-6, 6), .6, R(-14, 14), 8).rotation.set(R(0, 1.5), 0, R(0, 1.5));
  const ch = { p: new T.Vector3(x + Math.cos(-ry) * 0 + Math.sin(ry) * 4 * s, y + .5, z + Math.cos(ry) * 4 * s), open: false };
  ch.ry = ry; AT.chests.push(ch);
  ob(x, z, 6 * s, y + 7 * s);
}

/* ---------- 🌿 yaşam: yosun, mercan, deniz yıldızı… (InstancedMesh) ---------- */
function inst(geo, mat, list, color, shadow) {
  const im = new T.InstancedMesh(geo, mat, list.length), d = new T.Object3D(), c = new T.Color();
  list.forEach((p, i) => { d.position.set(p[0], p[1], p[2]); d.rotation.set(p[4] || 0, p[3] || 0, p[5] || 0); d.scale.setScalar(p[6] || 1); if (p[7]) d.scale.y *= p[7]; d.updateMatrix(); im.setMatrixAt(i, d.matrix); if (color) im.setColorAt(i, c.setHex(typeof color === 'function' ? color(i) : color)); });
  im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); im.castShadow = !!shadow; im.receiveShadow = true; AT.g.add(im); return im;
}
function clusters(n, test) { const L = []; let k = 0; while (L.length < n && k++ < n * 60) { const a = R(-Math.PI, Math.PI), r = Math.sqrt(R(.02, 1)) * 590, x = Math.cos(a) * r, z = Math.sin(a) * r; if (test(x, z, r)) L.push([x, z]); } return L; }
function around(C, n, rad, test) { const L = []; let k = 0; while (L.length < n && k++ < n * 20) { const c = C[Math.floor(RND() * C.length)], a = R(0, 6.28), d = Math.sqrt(RND()) * rad, x = c[0] + Math.cos(a) * d, z = c[1] + Math.sin(a) * d; if (test && !test(x, z, Math.hypot(x, z))) continue; L.push([x, floorH(x, z), z, R(0, 6.28)]); } return L; }
function scatter(n, test, yOff = 0) { const L = []; let k = 0; while (L.length < n && k++ < n * 40) { const a = R(-Math.PI, Math.PI), r = Math.sqrt(R(.02, 1)) * 600, x = Math.cos(a) * r, z = Math.sin(a) * r; if (!test(x, z, r)) continue; L.push([x, floorH(x, z) + yOff, z, R(0, 6.28)]); } return L; }
function buildLife() {
  RND = mul32(9001); const M = mats(), merge = G.mergeGeometries;
  // 🌿 yosun ormanı (kuzey) + kanallarda yosun
  const kTex = canvasTex(64, 512, (g, W, H) => { g.clearRect(0, 0, W, H); g.strokeStyle = '#4c6b23'; g.lineWidth = 4; g.beginPath(); g.moveTo(32, H); for (let y = H; y > 0; y -= 16) g.lineTo(32 + Math.sin(y * .03) * 4, y); g.stroke();
    for (let y = H - 30; y > 10; y -= 26) for (const s of [-1, 1]) { g.fillStyle = `hsl(${75 + Math.random() * 20},55%,${30 + Math.random() * 12}%)`; g.beginPath(); g.ellipse(32 + s * 14, y + s * 6, 13, 5, s * .5, 0, 7); g.fill(); } });
  const kelpM = sway(new T.MeshStandardMaterial({ map: kTex, alphaTest: .5, side: T.DoubleSide, roughness: .9, color: 0xc8e0a0 }), 1.3, 1.1, 1);
  const kelpG = new T.PlaneGeometry(2.4, 1, 1, 10).translate(0, .5, 0);
  const KC = clusters(34, (x, z, r) => region(x, z) === 'kelp' && r > 275 && r < 570); const kl = around(KC, 2000, 22, (x, z, r) => r > 262).map(p => [p[0], p[1], p[2], p[3], 0, 0, 1, R(7, 26)]);
  for (let i = 0; i < 180; i++) { const [a0, b0] = PICK(CANALS), a = R(-Math.PI, Math.PI); if (nearGate(a, a0, 8)) continue; const rr = R(a0 + 3, b0 - 3), x = Math.cos(a) * rr, z = Math.sin(a) * rr; kl.push([x, floorH(x, z), z, R(0, 6), 0, 0, 1, R(4, 9)]); }
  for (let i = 0; i < 120; i++) { const p = scatter(1, (x, z, r) => r > 250 && region(x, z) !== 'kelp')[0]; if (p) kl.push([p[0], p[1], p[2], p[3], 0, 0, 1, R(3, 8)]); }
  inst(kelpG, kelpM, kl.map(p => { const q = p.slice(); q[6] = 1; return q; }));
  // 🌾 deniz çayırı (güney)
  const grassG = new T.PlaneGeometry(.18, 1, 1, 3).translate(0, .5, 0); const grassM = sway(new T.MeshStandardMaterial({ color: 0x6f9a3a, side: T.DoubleSide, roughness: 1 }), .25, 1.6, 1);
  inst(grassG, grassM, scatter(2600, (x, z, r) => (region(x, z) === 'wreck' || (r < 245 && RND() < .15)) && r > 30).map(p => [p[0], p[1], p[2], p[3], R(-.2, .2), 0, R(.6, 1.4)]), null);
  // 🪸 mercanlar (doğu + şehirde serpiştirilmiş)
  const RC = clusters(46, (x, z, r) => region(x, z) === 'reef' && r > 270).concat(clusters(16, (x, z, r) => r > 70 && r < 205 && !OBS.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 3))), reefL = (n, rad = 11) => around(RC, n, rad, (x, z, r) => r > 66);
  const reef = (x, z, r) => region(x, z) === 'reef' || (r < 240 && RND() < .04), CC = [0xff7f7f, 0xffa64d, 0xc77dff, 0xffd166, 0x4cc9f0, 0xff5d8f, 0x80ed99];
  const brG = (() => { const parts = []; const br = (x, y, z, ax, az, l, r, d) => { const c = new T.CylinderGeometry(r * .7, r, l, 5).translate(0, l / 2, 0).rotateX(ax).rotateZ(az).translate(x, y, z); parts.push(c); if (d < 3) for (let k = 0; k < 2; k++) { const tx = x + Math.sin(az) * -l * .8, ty = y + Math.cos(ax) * Math.cos(az) * l * .8, tz = z + Math.sin(ax) * l * .8; br(tx, ty, tz, ax + R(-.6, .6), az + R(-.6, .6), l * .75, r * .7, d + 1); } }; br(0, 0, 0, 0, 0, 1, .18, 0); return merge(parts.map(p => p.toNonIndexed())); })();
  const coralM = new T.MeshStandardMaterial({ roughness: .7, flatShading: true });
  inst(brG, coralM, reefL(420).map(p => [p[0], p[1], p[2], p[3], 0, 0, R(1, 2.6)]), i => CC[i % CC.length]);
  const brainG = new T.IcosahedronGeometry(1, 1); { const pa = brainG.attributes.position; for (let i = 0; i < pa.count; i++) { const v = new T.Vector3().fromBufferAttribute(pa, i), k = 1 + Math.sin(v.x * 9) * Math.sin(v.z * 9) * .08; pa.setXYZ(i, v.x * k, Math.max(-.2, v.y) * .65 * k, v.z * k); } brainG.computeVertexNormals(); }
  inst(brainG, coralM, reefL(300).map(p => [p[0], p[1], p[2], p[3], 0, 0, R(.6, 1.8)]), i => [0xe9c46a, 0xf4a261, 0xb5838d, 0x84a59d][i % 4]);
  const fanG = new T.CircleGeometry(1, 14); { const pa = fanG.attributes.position; for (let i = 1; i < pa.count; i++) { const k = .8 + Math.random() * .3; pa.setXY(i, pa.getX(i) * k, pa.getY(i) * k); } fanG.translate(0, 1, 0); }
  inst(fanG, sway(new T.MeshStandardMaterial({ side: T.DoubleSide, roughness: .8 }), .12, 1.4, .6), reefL(240).map(p => [p[0], p[1], p[2], p[3], 0, 0, R(.8, 2.2)]), i => [0xc77dff, 0xff5d8f, 0xffa64d][i % 3]);
  const tubeG = merge([0, 1, 2, 3].map(k => new T.CylinderGeometry(.22, .17, 1.2 + k * .35, 8, 1, true).translate(Math.cos(k * 1.7) * .35, (1.2 + k * .35) / 2, Math.sin(k * 1.7) * .35)));
  inst(tubeG, new T.MeshStandardMaterial({ side: T.DoubleSide, roughness: .8 }), reefL(220).map(p => [p[0], p[1], p[2], p[3], 0, 0, R(.8, 2.2)]), i => [0xffd166, 0xff7f50, 0x9b5de5][i % 3]);
  const anemG = merge([new T.CylinderGeometry(.35, .4, .4, 10).translate(0, .2, 0), ...[...Array(18)].map((_, k) => { const a = k / 18 * Math.PI * 2, rr = k % 2 ? .28 : .14; return new T.ConeGeometry(.04, .7, 4).translate(0, .35, 0).rotateZ(Math.cos(a) * .5).rotateX(Math.sin(a) * .5).translate(Math.cos(a) * rr, .4, Math.sin(a) * rr); })]);
  inst(anemG, sway(new T.MeshStandardMaterial({ roughness: .6, emissive: 0x220a18 }), .35, 2, 1.4), reefL(200, 14).concat(scatter(60, (x, z) => region(x, z) === 'wreck')).map(p => [p[0], p[1], p[2], p[3], 0, 0, R(.8, 1.6)]), i => [0xff9ecd, 0xb8f2e6, 0xffd6a5, 0xcaffbf][i % 4]);
  // ⭐ deniz yıldızı, kirpi, deniz kabuğu
  const starS = new T.Shape(); for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 2, r = i % 2 ? .18 : .45; starS[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
  const starG = new T.ExtrudeGeometry(starS, { depth: .06, bevelEnabled: false }).rotateX(-Math.PI / 2);
  inst(starG, new T.MeshStandardMaterial({ roughness: .8 }), scatter(170, (x, z, r) => r > 20).map(p => [p[0], p[1] + .03, p[2], p[3], 0, 0, R(.7, 1.6)]), i => [0xff6b6b, 0xffa94d, 0xf783ac, 0xffd43b, 0x9775fa][i % 5]);
  const urG = merge([new T.SphereGeometry(.22, 8, 6), ...[...Array(26)].map(() => { const v = new T.Vector3(R(-1, 1), R(0, 1), R(-1, 1)).normalize(); return new T.CylinderGeometry(.01, .02, .5, 3).translate(0, .25, 0).applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), v)); })].map(g => g.index ? g.toNonIndexed() : g));
  inst(urG, new T.MeshStandardMaterial({ color: 0x3c1f4a, roughness: .6 }), scatter(100, (x, z, r) => r > 30).map(p => [p[0], p[1] + .1, p[2], p[3], 0, 0, R(.7, 1.3)]));
  const rocks = scatter(170, (x, z, r) => r > 255).map(p => { const s = R(1, 6); if (s > 3.5) ob(p[0], p[2], s * .8, p[1] + s * 1.2); return [p[0], p[1] + s * .3, p[2], p[3], R(0, 3), R(0, 3), s]; });
  inst(new T.DodecahedronGeometry(1, 0), new T.MeshStandardMaterial({ color: 0x5d6b70, roughness: 1, flatShading: true }), rocks, null, true);
  // 🦪 dev istiridyeler (inciler)
  const clamSpots = [];
  RND = mul32(4242); const regs = [['city', 8], ['reef', 5], ['kelp', 4], ['wreck', 4], ['trench', 4]];
  for (const [rg, n] of regs) { let k = 0, tries = 0; while (k < n && tries++ < 4000) { const a = R(-Math.PI, Math.PI), r = rg === 'city' ? R(68, 205) : R(270, 560), x = Math.cos(a) * r, z = Math.sin(a) * r; if (region(x, z) !== rg) continue; if (rg === 'city' && OBS.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 2.5)) continue; if (rg === 'city' && nearGate(a, r, 10)) continue; clamSpots.push([x, floorH(x, z), z, R(0, 6.28)]); k++; } }
  const shellG = new T.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2); shellG.scale(1, .35, .8); shellG.translate(0, 0, .8);
  const shellM = new T.MeshStandardMaterial({ roughness: .5, flatShading: true }), bot = new T.InstancedMesh(shellG.clone().rotateZ(Math.PI), shellM, clamSpots.length), top = new T.InstancedMesh(shellG, shellM, clamSpots.length), prl = new T.InstancedMesh(new T.SphereGeometry(.26, 14, 10), new T.MeshStandardMaterial({ color: 0xfff8f0, roughness: .15, metalness: .3, emissive: 0x504840 }), clamSpots.length);
  const cc = new T.Color(); clamSpots.forEach((p, i) => { AT.clams.push({ i, x: p[0], y: p[1] + .32, z: p[2], ry: p[3], open: 0, ph: R(0, 6) }); bot.setColorAt(i, cc.setHex([0xb8a1d9, 0x86c5c9, 0xe0b1cb][i % 3])); top.setColorAt(i, cc.setHex([0xc9b3e8, 0x9bd5d8, 0xeec4d8][i % 3])); });
  for (const im of [bot, top, prl]) { im.frustumCulled = false; AT.g.add(im); } AT.clamIM = { bot, top, prl };
  const pg = new Float32Array(clamSpots.length * 3); AT.pearlPts = new T.Points(new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(pg, 3)), new T.PointsMaterial({ size: 2.4, map: glowTex(), transparent: true, depthWrite: false, blending: T.AdditiveBlending, color: 0xfff4d6 })); AT.pearlPts.frustumCulled = false; AT.g.add(AT.pearlPts);
}

/* ---------- 🐟 canlılar ---------- */
function buildCreatures() {
  RND = mul32(5150); const merge = G.mergeGeometries, d = new T.Object3D();
  // balık sürüleri
  const body = new T.SphereGeometry(.5, 10, 7).scale(.3, .42, 1), tail = new T.ConeGeometry(.3, .5, 4).rotateX(Math.PI / 2).scale(.12, 1, 1).translate(0, 0, -.62), fin = new T.ConeGeometry(.12, .35, 4).scale(.2, 1, 1).translate(0, .26, -.05);
  const fishG = merge([body, tail, fin].map(g => g.toNonIndexed()));
  const homes = [];
  for (let k = 0; k < 7; k++) { const a = R(-Math.PI, Math.PI), r = R(30, 200); homes.push([Math.cos(a) * r, Math.sin(a) * r, R(8, 30)]); }
  for (const rg of ['reef', 'reef', 'reef', 'reef', 'kelp', 'kelp', 'wreck', 'wreck', 'trench']) { for (let t = 0; t < 200; t++) { const a = R(-Math.PI, Math.PI), r = R(280, 540), x = Math.cos(a) * r, z = Math.sin(a) * r; if (region(x, z) === rg) { homes.push([x, z, floorH(x, z) + R(4, 14)]); break; } } }
  const FC = [[0xffd43b, 0xffe066], [0x4dabf7, 0x74c0fc], [0xff922b, 0xffa94d], [0xced4da, 0xf1f3f5], [0xda77f2, 0xe599f7], [0x63e6be, 0x96f2d7], [0xff6b6b, 0xffa8a8]];
  let n = 0; for (const h of homes) { const big = RND() < .18, cnt = big ? 6 : RI(14, 22), pal = PICK(FC), s = { hx: h[0], hz: h[1], hy: h[2], R: R(8, 22), w: R(.12, .3) * (RND() < .5 ? 1 : -1), k: R(.6, 1.4), t: R(0, 6), i0: n, n: cnt, sc: big ? R(1.6, 2.6) : R(.45, .85), f: [] };
    for (let i = 0; i < cnt; i++) s.f.push({ o: new T.Vector3(R(-3, 3), R(-1.5, 1.5), R(-3, 3)).multiplyScalar(big ? 1.6 : 1), p: R(0, 6), fl: new T.Vector3(), c: PICK(pal), s: R(.8, 1.2) }); n += cnt; AT.sch.push(s); }
  AT.fishIM = new T.InstancedMesh(fishG, new T.MeshStandardMaterial({ roughness: .4, metalness: .25 }), n); AT.fishIM.frustumCulled = false; const cc = new T.Color();
  for (const s of AT.sch) s.f.forEach((f, i) => AT.fishIM.setColorAt(s.i0 + i, cc.setHex(f.c))); AT.g.add(AT.fishIM);
  // 🪼 parlayan denizanaları
  const bell = new T.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), tent = merge([...Array(8)].map((_, k) => { const a = k / 8 * Math.PI * 2; return new T.CylinderGeometry(.025, .01, 2.6, 3).translate(Math.cos(a) * .55, -1.3, Math.sin(a) * .55); }).concat([new T.CylinderGeometry(.12, .02, 1.4, 6).translate(0, -.7, 0)]));
  const NJ = 46; AT.jelB = new T.InstancedMesh(bell, new T.MeshBasicMaterial({ transparent: true, opacity: .55, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }), NJ); AT.jelT = new T.InstancedMesh(tent, new T.MeshBasicMaterial({ transparent: true, opacity: .4, blending: T.AdditiveBlending, depthWrite: false }), NJ);
  for (const im of [AT.jelB, AT.jelT]) { im.frustumCulled = false; AT.g.add(im); }
  for (let i = 0; i < NJ; i++) { const tr = i < 18, a = R(-Math.PI, Math.PI); let x, z; if (tr) { z = R(-320, 320); x = -430 + Math.sin(z * .012) * 45 + R(-25, 25); } else { const r = R(40, 520); x = Math.cos(a) * r; z = Math.sin(a) * r; }
    const c = cc.setHex(PICK([0x9ff3ff, 0xd7a8ff, 0xffa8e8, 0xa8ffcf])); AT.jelB.setColorAt(i, c); AT.jelT.setColorAt(i, c); AT.jel.push({ x, z, y: floorH(x, z) + R(6, 30), s: R(.6, 1.6), p: R(0, 6), vx: R(-.4, .4), vz: R(-.4, .4) }); }
  // 🐢 kaplumbağa, vatoz, yunus, balina, yengeç
  const M = mats(), Ms = c => new T.MeshStandardMaterial({ color: c, roughness: .7 });
  const mk = (kind) => { const g = new T.Group(), parts = {}; AT.g.add(g);
    if (kind === 'turtle') { const sh = new T.Mesh(new T.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), Ms(0x6b8f4e)); sh.scale.set(1, .5, 1.25); g.add(sh); const bl = new T.Mesh(new T.CylinderGeometry(1, 1, .15, 14), Ms(0xd9c79a)); bl.scale.set(.95, 1, 1.2); g.add(bl);
      const hd = new T.Mesh(new T.SphereGeometry(.32, 10, 8), Ms(0x8fae6e)); hd.position.set(0, .05, 1.45); hd.scale.z = 1.3; g.add(hd); parts.fl = [];
      for (const [x, z, s] of [[1, .6, 1], [-1, .6, 1], [.7, -.9, .6], [-.7, -.9, .6]]) { const p = new T.Group(); p.position.set(x * .85, 0, z); g.add(p); const f = new T.Mesh(new T.BoxGeometry(1.1 * s, .08, .45 * s), Ms(0x8fae6e)); f.position.x = Math.sign(x) * .5 * s; p.add(f); parts.fl.push(p); } }
    else if (kind === 'manta') { const b = new T.Mesh(new T.SphereGeometry(1, 14, 8), Ms(0x2f3e4a)); b.scale.set(1.1, .25, 1.6); g.add(b); parts.w = [];
      for (const s of [-1, 1]) { const p = new T.Group(); g.add(p); const sh = new T.Shape(); sh.moveTo(0, -1.2); sh.lineTo(s * 3.2, -.2); sh.lineTo(0, 1.2); const w = new T.Mesh(new T.ShapeGeometry(sh).rotateX(Math.PI / 2), new T.MeshStandardMaterial({ color: 0x2f3e4a, side: T.DoubleSide, roughness: .7 })); p.add(w); parts.w.push(p); }
      const tl = new T.Mesh(new T.CylinderGeometry(.04, .01, 3, 4), Ms(0x2f3e4a)); tl.rotation.x = Math.PI / 2; tl.position.z = -2.8; g.add(tl); }
    else if (kind === 'dolphin') { const b = new T.Mesh(new T.SphereGeometry(1, 14, 10), Ms(0x7d97ad)); b.scale.set(.5, .55, 1.6); g.add(b); const sn = new T.Mesh(new T.ConeGeometry(.16, .6, 8), Ms(0x7d97ad)); sn.rotation.x = Math.PI / 2; sn.position.z = 1.8; g.add(sn);
      const df = new T.Mesh(new T.ConeGeometry(.25, .7, 4), Ms(0x6c869c)); df.scale.z = .3; df.position.set(0, .7, -.1); df.rotation.x = -.5; g.add(df); const tp = new T.Group(); tp.position.z = -1.5; g.add(tp); const tf = new T.Mesh(new T.BoxGeometry(1.4, .06, .5), Ms(0x6c869c)); tf.position.z = -.3; tp.add(tf); parts.tail = tp; }
    else if (kind === 'whale') { const b = new T.Mesh(new T.SphereGeometry(4, 22, 14), Ms(0x3f5566)); b.scale.set(1, .9, 3.6); g.add(b); const be = new T.Mesh(new T.SphereGeometry(3.8, 18, 10, 0, Math.PI * 2, Math.PI * .55, Math.PI * .45), Ms(0xc9d4dc)); be.scale.set(1, .9, 3.5); be.position.y = -.3; g.add(be);
      for (const s of [-1, 1]) { const f = new T.Mesh(new T.BoxGeometry(5, .4, 1.8), Ms(0x3f5566)); f.position.set(s * 5.5, -1.5, 4); f.rotation.z = s * -.4; f.rotation.y = s * .4; g.add(f); }
      const tp = new T.Group(); tp.position.z = -13; g.add(tp); const tc = new T.Mesh(new T.CylinderGeometry(1.2, 2.2, 4, 10), Ms(0x3f5566)); tc.rotation.x = Math.PI / 2; tc.position.z = -1.5; tp.add(tc); const fl = new T.Mesh(new T.BoxGeometry(9, .4, 2.6), Ms(0x3f5566)); fl.position.z = -4; tp.add(fl); parts.tail = tp;
      for (const s of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(.35, 8, 6), Ms(0x111111)); e.position.set(s * 3.3, .4, 9.5); g.add(e); } }
    else if (kind === 'crab') { const b = new T.Mesh(new T.SphereGeometry(.35, 10, 6), Ms(0xe8590c)); b.scale.set(1.3, .5, 1); g.add(b); parts.l = []; for (const s of [-1, 1]) { for (let k = 0; k < 3; k++) { const l = new T.Mesh(new T.BoxGeometry(.45, .05, .05), Ms(0xd9480f)); l.position.set(s * .5, -.08, -.15 + k * .15); l.rotation.z = s * -.6; g.add(l); parts.l.push(l); }
      const cl = new T.Mesh(new T.SphereGeometry(.13, 8, 6), Ms(0xff6b2c)); cl.position.set(s * .38, .05, .38); cl.scale.set(1, .7, 1.4); g.add(cl); } for (const s of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(.04, 6, 4), Ms(0x111111)); e.position.set(s * .1, .2, .3); g.add(e); } }
    return { g, parts, kind };
  };
  for (let i = 0; i < 6; i++) { const c = mk('turtle'); const a = R(-Math.PI, Math.PI), r = R(60, 450); Object.assign(c, { cx: Math.cos(a) * r, cz: Math.sin(a) * r, R: R(15, 40), w: R(.04, .08), t: R(0, 6), y: 0, s: R(.8, 1.3) }); c.g.scale.setScalar(c.s); AT.cre.push(c); }
  for (let i = 0; i < 5; i++) { const c = mk('manta'); const a = R(-Math.PI, Math.PI), r = R(100, 480); Object.assign(c, { cx: Math.cos(a) * r, cz: Math.sin(a) * r, R: R(30, 60), w: R(.05, .09), t: R(0, 6), s: R(1, 1.8) }); c.g.scale.setScalar(c.s); AT.cre.push(c); }
  for (let i = 0; i < 4; i++) { const c = mk('dolphin'); Object.assign(c, { cx: R(-200, 200), cz: R(-200, 200), R: R(60, 120), w: R(.15, .22) * (i % 2 ? 1 : -1), t: i * 1.6, s: 1.1 }); c.g.scale.setScalar(c.s); AT.cre.push(c); }
  { const c = mk('whale'); Object.assign(c, { cx: 0, cz: 0, R: 262, w: .016, t: 0, s: 1 }); AT.cre.push(c); AT.whale = c; }
  { const parts = [new T.SphereGeometry(.35, 10, 6).scale(1.3, .5, 1)]; for (const sd of [-1, 1]) { for (let k = 0; k < 3; k++) parts.push(new T.BoxGeometry(.45, .05, .05).rotateZ(sd * -.6).translate(sd * .5, -.08, -.15 + k * .15)); parts.push(new T.SphereGeometry(.13, 8, 6).scale(1, .7, 1.4).translate(sd * .38, .05, .38)); }
    const geo = merge(parts.map(g => g.index ? g.toNonIndexed() : g)); AT.crabIM = new T.InstancedMesh(geo, new T.MeshStandardMaterial({ color: 0xe8590c, roughness: .6 }), 22); AT.crabIM.frustumCulled = false; AT.g.add(AT.crabIM);
    AT.crabs = [...Array(22)].map(() => { const p = scatter(1, (x, z, r) => r > 60)[0]; return { x: p[0], z: p[2], dir: R(0, 6), t: R(0, 6), s: R(.8, 1.6) }; }); }
}

/* ---------- 🧜‍♀️ konuşan deniz kızları (bu oyuna özgü tasarım) — V ile konuşulur ---------- */
const MM_SHARED = [
  'Yunuslar birbirine ıslıkla isim takar. Benim yunus adım: “Fııı-tıt!”',
  'Deniz atlarında yavruları babalar karnındaki kesede taşır. Ne tatlı, değil mi?',
  'Soluduğun oksijenin yaklaşık yarısını okyanustaki minicik planktonlar üretir. Onlara bir teşekkür borçlusun!',
  'Mavi balina dünyadaki en büyük hayvan; kalbi küçük bir araba kadar büyük!',
  'Denizanalarının beyni yok ama 500 milyon yıldan uzun süredir yüzüyorlar. Demek ki her şey kafada bitmiyor.',
  'Yukarıdaki uçan adalarda kocaman BRK GAMES yazısı varmış. Bu dünyayı yapanlara benden selam söyle!',
  'Ejderhaya bindin mi hiç? Biz balinaya biniyoruz… ama sadece doğum günlerinde.',
  'Sihirli asanla bir balığı büyütürsen bana haber ver, kocaman bir arkadaşım olsun.',
  'Battle royale’de kazandın mı? Burada kimse kavga etmez, biz sadece yüzeriz.',
  'Bir dahaki sefere arkadaşlarını da getir! Çok oyunculu modda hep birlikte dalabilirsiniz.',
  'Okyanusların büyük kısmı hâlâ keşfedilmedi. Belki Atlantis’in yeni bir sokağını sen bulursun.',
  'Ahtapotların üç kalbi ve mavi kanı var. Benim bir kalbim var ama kocaman!'];
const MERMAIDS = [
  { name: 'Marin', at: [9, -246], y: 5, skin: 0xf3cfae, hair: 0xe85d75, tail: [0x2a9d8f, 0x8ce0d0], fin: 0xbff6ee, top: 0xffd166, acc: 'shell', lines: [
    'Hoş geldin kara insanı! Ben Marin. Atlantis’e köydeki kuyudan mı geldin? O kuyu bizim en sevdiğimiz sır.',
    'Shift’e basınca bacakların pervane gibi dönüyor, gördüm! Biz kuyrukla yüzüyoruz ama seninki de fena değil.',
    'Şehirde 25 dev istiridye var. Açıkken yanlarına yüzersen incilerini sana verirler.',
    'Köyünüzün üstünde uçan adalar varmış… Bulutların üstünde ağaç! Bir gün görmek isterdim.',
    'Kapının üstündeki ATLANTİS yazısını her sabah balıklar parlatır. Şaka şaka, kristalin ışığı o.'] },
  { name: 'Derin', at: [0, -40], y: 10, skin: 0xd9a77e, hair: 0x2b4c8c, tail: [0x3a0ca3, 0x7b9cff], fin: 0xc9d6ff, top: 0x9ff3ff, acc: 'crown', lines: [
    'Tepedeki dev kristal şehrin kalbidir. Etrafında dönen mor taşlar da onun kalp atışı.',
    'Bu tapınakta yirmi dört sütun var. Her gün sayarım, eksilmesin diye.',
    'Kristale uzun uzun bakma, sonra gözlerin mavi mavi parlar!',
    'Atlantis’i ilk Platon adında bir filozof anlatmış, yaklaşık 2400 yıl önce. Biz de ona el sallamıştık.'] },
  { name: 'İnci', at: [-118, 116], y: 6, skin: 0xffe0c4, hair: 0xf2c14e, tail: [0xd6336c, 0xffa8c5], fin: 0xffd6e6, top: 0x80ed99, acc: 'pearls', lines: [
    'Çarşımızda istiridye kabuğuyla alışveriş yapılır. Senin altınların burada geçer mi bakalım?',
    'Kara insanlarının telefon diye bir şeyi varmış. Biz haberleri yunuslardan alırız, onlar daha hızlı.',
    'Amforaların içinde ne var biliyor musun? Hiçbir şey! Balıklar saklambaç oynuyor.',
    'Yukarıda bir kıyafet odanız varmış, değil mi? Bana da deniz yosunundan bir elbise lazım.'] },
  { name: 'Mavi', at: [345, 18], y: 6, skin: 0xc68b67, hair: 0x111111, tail: [0x0077b6, 0x48cae4], fin: 0xade8f4, top: 0xff8fab, acc: 'star', lines: [
    'Mercanlar aslında hayvandır, bitki değil! Minicik canlılar bir araya gelip bu kayalıkları yapar.',
    'Şu dev bronz baş kimin, bilmiyoruz. Belki eski bir kral, belki de çok kendini beğenmiş bir heykeltıraş.',
    'Yengeçler hep yan yan yürür. Onlara düz yürümeyi öğretmeye çalıştım, olmadı.',
    'Bazı papağan balıkları geceleri kendi salyalarından bir “uyku tulumu” yapıp içinde uyur. Bilim garip ve güzel!'] },
  { name: 'Nehir', at: [10, 372], y: 7, skin: 0xf0c8a0, hair: 0x6a994e, tail: [0x386641, 0xa7c957], fin: 0xdde5b6, top: 0xf4a261, acc: 'shell', lines: [
    'Yosun ormanında kaybolursan yukarıdaki ışığa doğru yüz; su yüzü hep oradadır.',
    'Dev yosunlar bir günde yarım metreye yakın uzayabilir. Benim saçım o kadar hızlı uzamıyor.',
    'Balinanın şarkısını duydun mu? Dinle… Okyanusta kilometrelerce öteden duyulabilir.',
    'Yukarıda karanlık bir zindan varmış, Kemik Kral yaşıyormuş. Burası çok daha aydınlık, değil mi?'] },
  { name: 'Ela', at: [-48, -330], y: 5, skin: 0xe8b894, hair: 0x7f4f24, tail: [0x9d4edd, 0xe0aaff], fin: 0xf3d9ff, top: 0x4cc9f0, acc: 'crown', lines: [
    'Bu gemiler eski bir fırtınada batmış. İçlerindeki sandıkları V ile açabilirsin, altın çıkıyor!',
    'Gemilerin direklerinde artık balıklar yaşıyor. En iyi ev, eski evdir!',
    'Yukarıda araba yarışı yapıyormuşsunuz; drift, nitro… Biz de yunuslarla yarışıyoruz, hep onlar kazanıyor.',
    'Eski denizciler yıldızlara bakarak yön bulurmuş. Ben de hâlâ öyle yapıyorum, su yüzüne çıkınca.'] },
  { name: 'Su', at: [158, 162], y: 9, skin: 0xffd9b8, hair: 0xb8c0ff, tail: [0x00a6a6, 0xbbf0f0], fin: 0xffffff, top: 0xe76f51, acc: 'pearls', lines: [
    'Kristal Fener, sular kararınca yolunu kaybedenlere yön gösterir.',
    'Senin de el fenerin var mı? K’ya basınca uzun moda geçiyormuş, çok uzağı aydınlatıyormuş!',
    'Fenerin tepesinden bütün şehri görebilirsin. Yukarı çıkmak için Boşluk yeter.',
    'Gerçek dünyanın en ünlü feneri İskenderiye Feneri’ymiş; Antik Dünyanın Yedi Harikası’ndan biri.'] },
  { name: 'Lal', at: [-382, 36], y: 4, skin: 0xb07a55, hair: 0xd00000, tail: [0x7f1d1d, 0xff6b35], fin: 0xffb38a, top: 0xffd60a, acc: 'star', lines: [
    'Bu uçurum derin ama gerçek dünyadaki Mariana Çukuru’nun yanında minicik kalır; o yaklaşık 11 kilometre!',
    'Sıcak su bacalarının çevresinde güneşi hiç görmeyen canlılar yaşar.',
    'Parlayan denizanalarını görüyor musun? Onlar benim gece lambalarım.',
    'Derin denizdeki bazı balıklar kendi ışıklarını yapar; buna biyolüminesans denir. Ben de kuyruğumu parlatmayı deniyorum!'] }];
const MM = { list: [], cur: null, t: 0 };
const vc = (geo, hex) => { const g = geo.index ? geo.toNonIndexed() : geo, n = g.attributes.position.count, c = new T.Color(hex), a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new T.BufferAttribute(a, 3)); return g; };
let MM_MAT = null;
function mmMats() { if (MM_MAT) return MM_MAT; MM_MAT = { base: new T.MeshStandardMaterial({ vertexColors: true, roughness: .55 }) }; return MM_MAT; }
function bendMat(down, amp, freq) {   // kuyruk ve saç: GPU'da dalgalanır (her deniz kızının kendi değerleri)
  const u = { uAmp: { value: amp }, uFreq: { value: freq }, uPh: { value: Math.random() * 6 }, uTrail: { value: 0 } };
  const m = new T.MeshStandardMaterial({ vertexColors: true, roughness: .5, side: T.DoubleSide });
  m.onBeforeCompile = sh => { sh.uniforms.uTime = U.uTime; Object.assign(sh.uniforms, u); sh.vertexShader = 'uniform float uTime, uAmp, uFreq, uPh, uTrail;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    float bY = max(-position.y, 0.0);
    transformed.z += sin(uTime * uFreq - bY * 2.2 + uPh) * uAmp * pow(bY, 1.25) - uTrail * bY * bY * .35;
    transformed.x += sin(uTime * uFreq * .7 - bY * 1.6 + uPh * 1.3) * uAmp * .25 * bY;`); };
  m.customProgramCacheKey = () => 'mmbend'; m.userData.u = u; return m;
}
function makeMermaid(o) {
  const merge = G.mergeGeometries, base = mmMats().base, g = new T.Group(), body = new T.Group(); g.add(body);
  const tailC = new T.Color(o.tail[0]), tailC2 = new T.Color(o.tail[1]);
  // gövde: ten, üst, kalça (pullu), kemer, kolye
  const tp = [vc(new T.CapsuleGeometry(.12, .36, 4, 12).translate(0, .32, 0), o.skin), vc(new T.CylinderGeometry(.152, .14, .15, 16).translate(0, .45, 0), o.top), vc(new T.CylinderGeometry(.155, .155, .03, 16).translate(0, .52, 0), 0xffffff),
    vc(new T.SphereGeometry(.165, 14, 10).scale(1, .85, .85).translate(0, .02, 0), o.tail[0]), vc(new T.TorusGeometry(.16, .022, 6, 18).rotateX(Math.PI / 2).translate(0, .1, 0), o.tail[1]), vc(new T.CylinderGeometry(.05, .055, .12, 10).translate(0, .62, 0), o.skin)];
  for (const s of [-1, 1]) tp.push(vc(new T.BoxGeometry(.025, .14, .02).rotateZ(s * .25).translate(s * .08, .56, .07), o.top));
  if (o.acc === 'pearls') for (let k = 0; k < 9; k++) { const a = (k / 8 - .5) * 2.4; tp.push(vc(new T.SphereGeometry(.018, 6, 5).translate(Math.sin(a) * .07, .6 - Math.cos(a) * .03, Math.cos(a) * .065 + .01), 0xfff8ee)); }
  body.add(new T.Mesh(merge(tp), base));
  // baş: yüz, saç, aksesuar
  const head = new T.Group(); head.position.y = .8; body.add(head);
  const hp = [vc(new T.SphereGeometry(.17, 18, 14), o.skin), vc(new T.SphereGeometry(.183, 16, 10, 0, Math.PI * 2, 0, Math.PI * .55).rotateX(-.35).translate(0, .01, -.01), o.hair), vc(new T.SphereGeometry(.12, 10, 6).scale(1.25, .45, .7).translate(0, .13, .09), o.hair)];
  for (const s of [-1, 1]) { hp.push(vc(new T.SphereGeometry(.036, 10, 8).translate(s * .062, .015, .145), 0xffffff), vc(new T.SphereGeometry(.023, 8, 6).translate(s * .062, .012, .172), 0x1b2a4a), vc(new T.SphereGeometry(.008, 5, 4).translate(s * .056, .022, .192), 0xffffff), vc(new T.SphereGeometry(.026, 8, 6).scale(1, .6, .4).translate(s * .095, -.035, .135), 0xff9aa2), vc(new T.BoxGeometry(.05, .009, .01).rotateZ(s * -.15).translate(s * .065, .07, .15), o.hair)); }
  hp.push(vc(new T.TorusGeometry(.04, .008, 4, 10, Math.PI).rotateZ(Math.PI).translate(0, -.05, .158), 0xc0394b));
  if (o.acc === 'crown') for (let k = 0; k < 7; k++) { const a = (k - 3) * .32; hp.push(vc(new T.ConeGeometry(.022, .1, 5).translate(Math.sin(a) * .15, .18 + (k === 3 ? .02 : 0), Math.cos(a) * .15 - .02), k % 2 ? 0xffd166 : 0xff8fab)); }
  else if (o.acc === 'shell') { const sh = new T.SphereGeometry(.06, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, .3, 1).rotateZ(1.2).translate(.16, .1, .03); hp.push(vc(sh, 0xffe5ec)); }
  else if (o.acc === 'star') { const st = new T.Shape(); for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 2, r = i % 2 ? .02 : .05; st[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } hp.push(vc(new T.ExtrudeGeometry(st, { depth: .012, bevelEnabled: false }).rotateY(1.3).translate(.17, .09, .02), 0xffb703)); }
  head.add(new T.Mesh(merge(hp), base));
  // saç telleri (dalgalanır)
  const hs = []; for (let k = 0; k < 11; k++) { const a = Math.PI + (k - 5) * .27, len = .5 + Math.abs(k - 5) * -.02 + Math.random() * .12; hs.push(vc(new T.CapsuleGeometry(.032, len, 3, 6).scale(1.6, 1, .55).rotateY(-a).translate(Math.sin(a) * .15, -len / 2 + .02, Math.cos(a) * .15), k % 3 ? o.hair : new T.Color(o.hair).offsetHSL(0, 0, .12).getHex())); }
  const hairM = bendMat(true, .06, 1.6); const hair = new T.Mesh(merge(hs), hairM); hair.position.set(0, .02, -.02); head.add(hair);
  // kollar
  const arm = s => { const sh = new T.Group(); sh.position.set(s * .17, .55, 0); body.add(sh); sh.add(new T.Mesh(vc(new T.CapsuleGeometry(.038, .24, 3, 8).translate(0, -.15, 0), o.skin), base)); const el = new T.Group(); el.position.y = -.31; sh.add(el);
    el.add(new T.Mesh(merge([vc(new T.CapsuleGeometry(.034, .22, 3, 8).translate(0, -.14, 0), o.skin), vc(new T.SphereGeometry(.045, 8, 6).scale(.8, 1, .55).translate(0, -.3, 0), o.skin), vc(new T.TorusGeometry(.04, .01, 5, 10).rotateX(Math.PI / 2).translate(0, -.22, 0), o.tail[1])]), base)); return { sh, el }; };
  const armL = arm(1), armR = arm(-1);
  // kuyruk + yüzgeç (tek parça, GPU'da dalgalanır)
  const pts = []; for (let i = 0; i <= 18; i++) { const t = i / 18; pts.push(new T.Vector2(Math.max(.035, .158 + .025 * Math.sin(t * Math.PI * .9) - .12 * Math.pow(t, 1.15)), -t * 2)); }
  const lathe = new T.LatheGeometry(pts.reverse(), 14).toNonIndexed(), lp = lathe.attributes.position, lc = new Float32Array(lp.count * 3), cc2 = new T.Color();
  for (let i = 0; i < lp.count; i++) { const t = Math.min(1, -lp.getY(i) / 2); cc2.copy(tailC).lerp(tailC2, t); if (Math.floor(t * 16) % 2) cc2.multiplyScalar(.82); lc[i * 3] = cc2.r; lc[i * 3 + 1] = cc2.g; lc[i * 3 + 2] = cc2.b; } lathe.setAttribute('color', new T.BufferAttribute(lc, 3));
  const fs = new T.Shape(); fs.moveTo(0, 0); fs.bezierCurveTo(.16, -.08, .5, -.22, .62, -.6); fs.bezierCurveTo(.4, -.48, .18, -.45, 0, -.32); fs.bezierCurveTo(-.18, -.45, -.4, -.48, -.62, -.6); fs.bezierCurveTo(-.5, -.22, -.16, -.08, 0, 0);
  const fin = vc(new T.ShapeGeometry(fs, 10).translate(0, -1.94, 0), o.fin), sf = [];
  for (const s of [-1, 1]) { const sh2 = new T.Shape(); sh2.moveTo(0, 0); sh2.quadraticCurveTo(s * .2, -.05, s * .26, -.22); sh2.quadraticCurveTo(s * .1, -.16, 0, -.18); sf.push(vc(new T.ShapeGeometry(sh2, 5).translate(s * .12, -.55, 0), o.fin)); }
  const tailM = bendMat(false, .12, 4.5), tail = new T.Mesh(merge([lathe, fin, ...sf].map(x => { if (!x.attributes.uv) x.setAttribute('uv', new T.BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2)); return x; })), tailM); body.add(tail);
  // isim etiketi
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x2 = c.getContext('2d'); x2.fillStyle = 'rgba(5,40,60,.65)'; x2.beginPath(); x2.roundRect ? x2.roundRect(4, 6, 248, 52, 26) : x2.rect(4, 6, 248, 52); x2.fill(); x2.fillStyle = '#fff'; x2.font = 'bold 30px system-ui'; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillText('🧜‍♀️ ' + o.name, 128, 33);
  const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; const tag = new T.Sprite(new T.SpriteMaterial({ map: tx, transparent: true, depthWrite: false })); tag.scale.set(1.6, .4, 1); tag.position.y = 1.35; g.add(tag);
  return { g, body, head, hair, hairM, armL, armR, tail, tailM, tag };
}
function buildMermaids() {
  RND = mul32(3131);
  for (const o of MERMAIDS) { const m = makeMermaid(o); Object.assign(m, { o, hx: o.at[0], hz: o.at[1], hy: floorH(o.at[0], o.at[1]) + o.y, rr: R(5, 9), a: R(0, 6.28), sp: R(1.2, 1.8), tilt: 1.3, ph: R(0, 6), k: 0, said: 0 }); m.g.scale.setScalar(1.15); AT.g.add(m.g); MM.list.push(m); }
}
function mmTick(dt, t, lx, ly, lz) {
  for (const m of MM.list) {
    const g = m.g, d = Math.hypot(g.position.x - lx, g.position.y - ly, g.position.z - lz), near = d < 10, talking = MM.cur === m, k = 1 - Math.exp(-3 * dt);
    if (!near) { m.a += dt * m.sp / m.rr; const tx = m.hx + Math.cos(m.a) * m.rr, tz = m.hz + Math.sin(m.a) * m.rr; g.position.x += (tx - g.position.x) * k; g.position.z += (tz - g.position.z) * k; g.rotation.y += G.wrapAng(Math.atan2(-Math.sin(m.a), Math.cos(m.a)) - g.rotation.y) * k; }
    else g.rotation.y += G.wrapAng(Math.atan2(lx - g.position.x, lz - g.position.z) - g.rotation.y) * Math.min(1, dt * 4);
    g.position.y += (m.hy + Math.sin(t * .9 + m.ph) * .35 - g.position.y) * k;
    m.tilt += ((near ? .1 : 1.3) - m.tilt) * Math.min(1, dt * 2.5); m.body.rotation.x = m.tilt;
    const U2 = m.tailM.userData.u, H2 = m.hairM.userData.u; U2.uAmp.value += ((near ? .07 : .14) - U2.uAmp.value) * k; U2.uFreq.value += ((near ? 2 : 4.6) - U2.uFreq.value) * k; H2.uTrail.value += ((near ? 0 : 1) - H2.uTrail.value) * k; H2.uAmp.value = near ? .05 : .09;
    const S = (o, ax, v) => { o.rotation[ax] += (v - o.rotation[ax]) * Math.min(1, dt * 6); };
    if (!near) { S(m.armL.sh, 'x', .15); S(m.armR.sh, 'x', .15); S(m.armL.sh, 'z', .14); S(m.armR.sh, 'z', -.14); S(m.armL.el, 'x', 0); S(m.armR.el, 'x', 0); }
    else if (talking && m.talkT > 0) { m.talkT -= dt; S(m.armR.sh, 'z', -1.9 + Math.sin(t * 5) * .35); S(m.armR.sh, 'x', -.3); S(m.armR.el, 'x', -.7); S(m.armL.sh, 'z', .45); S(m.armL.sh, 'x', 0); S(m.armL.el, 'x', -1.3); }
    else { const b = Math.sin(t * 1.3 + m.ph); S(m.armL.sh, 'z', .5 + b * .15); S(m.armR.sh, 'z', -.5 - b * .15); S(m.armL.sh, 'x', -.2); S(m.armR.sh, 'x', -.2); S(m.armL.el, 'x', -.4); S(m.armR.el, 'x', -.4); }
    m.head.rotation.x = near ? -.1 : -.55; m.tag.visible = d < 32;
    if (Math.random() < dt * .25) bubble(g.position.x, g.position.y + 1.1, g.position.z, RI(1, 3), .1);
  }
  if (MM.cur) { const g = MM.cur.g; MM.t -= dt; if (MM.t <= 0 || Math.hypot(g.position.x - lx, g.position.y - ly, g.position.z - lz) > 8) mmClose(); }
}
function mmNear(lx, ly, lz) { let b = null, bd = 4.6; for (const m of MM.list) { const d = Math.hypot(m.g.position.x - lx, m.g.position.y + .6 - ly - 1, m.g.position.z - lz); if (d < bd) { bd = d; b = m; } } return b; }
function mmTalk(m) {
  if (MM.cur !== m) { MM.cur = m; }
  const L = m.o.lines; let line; if (m.said < L.length) line = L[m.said++]; else { const pool = L.concat(MM_SHARED); do { line = pool[Math.floor(Math.random() * pool.length)]; } while (line === m.last && pool.length > 1); }
  m.last = line; m.talkT = 2.2; MM.t = 16; G.play('talk', { base: 560 + Math.random() * 140 }); bubble(m.g.position.x, m.g.position.y + 1.2, m.g.position.z, 4, .15);
  $('mmName').textContent = '🧜‍♀️ ' + m.o.name; $('mmText').textContent = adT(line); $('mmBox').style.display = 'block';
}
function mmClose() { MM.cur = null; $('mmBox').style.display = 'none'; }

/* ---------- ✨ kabarcık, deniz karı, ışık huzmeleri, su yüzeyi ---------- */
function buildFx() {
  const NB = 700, bp = new Float32Array(NB * 3).fill(-9999); AT.bubGeo = new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(bp, 3)); AT.bubD = [...Array(NB)].map(() => ({ life: 0, vy: 0, ph: 0 })); AT.bubI = 0;
  const bt = canvasTex(64, 64, (g) => { g.strokeStyle = 'rgba(230,255,255,.95)'; g.lineWidth = 5; g.beginPath(); g.arc(32, 32, 24, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(24, 23, 6, 0, 7); g.fill(); g.fillStyle = 'rgba(200,250,255,.18)'; g.beginPath(); g.arc(32, 32, 22, 0, 7); g.fill(); });
  AT.bubPts = new T.Points(AT.bubGeo, new T.PointsMaterial({ size: .35, map: bt, transparent: true, depthWrite: false })); AT.bubPts.frustumCulled = false; AT.g.add(AT.bubPts);
  const NS = 1300, sp = new Float32Array(NS * 3); for (let i = 0; i < NS; i++) { sp[i * 3] = Math.random() * 70 - 35; sp[i * 3 + 1] = Math.random() * 40 - 20; sp[i * 3 + 2] = Math.random() * 70 - 35; }
  AT.snowGeo = new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(sp, 3)); AT.snow = new T.Points(AT.snowGeo, new T.PointsMaterial({ size: .09, color: 0xdff8ff, transparent: true, opacity: .55, depthWrite: false })); AT.snow.frustumCulled = false; AT.g.add(AT.snow);
  const rt = canvasTex(32, 256, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(220,255,255,.9)'); gr.addColorStop(.6, 'rgba(160,240,255,.25)'); gr.addColorStop(1, 'rgba(120,220,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); const g2 = g.createLinearGradient(0, 0, W, 0); g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(.5, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = g2; g.fillRect(0, 0, W, H); });
  for (let i = 0; i < 14; i++) { const m = new T.Mesh(new T.PlaneGeometry(R(5, 12), 120).translate(0, -60, 0), new T.MeshBasicMaterial({ map: rt, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: R(.12, .26), side: T.DoubleSide })); m.userData.o = m.material.opacity; m.userData.p = R(0, 6); m.position.set(R(-80, 80), WY, R(-80, 80)); m.rotation.z = R(-.12, .12); AT.g.add(m); AT.rays.push(m); }
  const wt = canvasTex(256, 256, (g, W) => { g.fillStyle = '#9fe6f5'; g.fillRect(0, 0, W, W); for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(255,255,255,${.2 + Math.random() * .4})`; g.lineWidth = 2 + Math.random() * 3; g.beginPath(); const x = Math.random() * W, y = Math.random() * W; g.ellipse(x, y, 10 + Math.random() * 25, 4 + Math.random() * 8, Math.random() * 3, 0, 7); g.stroke(); } }, 70);
  AT.surf = new T.Mesh(new T.PlaneGeometry(1500, 1500).rotateX(Math.PI / 2), new T.MeshBasicMaterial({ map: wt, transparent: true, opacity: .75, side: T.DoubleSide, depthWrite: false })); AT.surf.position.y = WY; AT.g.add(AT.surf);
  const fgeo = new T.PlaneGeometry(1400, 1400, 175, 175).rotateX(-Math.PI / 2), pa = fgeo.attributes.position; for (let i = 0; i < pa.count; i++) pa.setY(i, floorH(pa.getX(i), pa.getZ(i))); fgeo.computeVertexNormals();
  const fl = new T.Mesh(fgeo, mats().floor); fl.receiveShadow = true; AT.g.add(fl);
  // 🌀 pervane izi (ayakların çevresinde dönen halka)
  const dt = canvasTex(128, 128, (g) => { g.translate(64, 64); for (let k = 0; k < 3; k++) { g.rotate(Math.PI * 2 / 3); const gr = g.createLinearGradient(0, 0, 60, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(200,250,255,.9)'); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 60, 0, .9); g.closePath(); g.fill(); } });
  AT.disc = new T.Mesh(new T.CircleGeometry(.62, 28).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: dt, transparent: true, opacity: .55, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); AT.disc.visible = false;
}
function bubble(x, y, z, n = 1, spread = .2, big = 1) { for (let k = 0; k < n; k++) { const i = AT.bubI = (AT.bubI + 1) % AT.bubD.length, b = AT.bubD[i]; b.life = R(2.5, 5); b.vy = R(1.2, 2.6) * big; b.ph = R(0, 6); const p = AT.bubGeo.attributes.position; p.setXYZ(i, x + R(-spread, spread), y + R(-spread, spread), z + R(-spread, spread)); } }

/* ---------- 🏗️ kurulum ---------- */
function build() {
  if (AT.built) return; AT.built = true; const t0 = performance.now();
  try { buildCity(); } catch (e) { console.warn('atlantis şehir', e); }
  try { buildLife(); } catch (e) { console.warn('atlantis yaşam', e); }
  try { buildCreatures(); } catch (e) { console.warn('atlantis canlılar', e); }
  try { buildFx(); } catch (e) { console.warn('atlantis efekt', e); }
  try { buildMermaids(); } catch (e) { console.warn('atlantis deniz kızları', e); }
  AT.obsW = OBS.map(o => ({ x: CX + o.x, z: CZ + o.z, r: o.r, h: o.top, top: o.top, stand: true, pass: false, atl: true }));
  AT.g.position.set(CX, 0, CZ); AT.g.updateMatrixWorld(true);
  console.log('🌊 Atlantis kuruldu', Math.round(performance.now() - t0) + ' ms', AT.obsW.length + ' engel');
}

/* ---------- 🏊 yüzme (oyunun hareket koduna bağlanır) ---------- */
const P = () => G.player.position;
function swimOn() { return G.curKey === 'atlantis' && !G.giant && !G.dead && !(G.RIDE && G.RIDE.on); }
function top() { return WY - 1.1; }
function swim(dt, moving, ix, iz, right) {
  const K = G.keys, prop = !!(K.ShiftLeft || K.ShiftRight || AT.prop), fast = !!(K.KeyE || AT.fast), sp = prop ? 15 : fast ? 8 : 4.2, yaw = G.yaw;
  let tx = 0, tz = 0; if (moving) { const fx = -Math.sin(yaw), fz = -Math.cos(yaw); tx = fx * iz + right.x * ix; tz = fz * iz + right.z * ix; const L = Math.hypot(tx, tz) || 1, a = Math.min(1, Math.hypot(ix, iz)); tx = tx / L * sp * a; tz = tz / L * sp * a; }
  const up = K.Space ? 1 : 0, dn = (K.KeyQ || AT.down) ? 1 : 0; let ty = (up - dn) * (prop ? 9 : fast ? 6.5 : 4.2); if (!up && !dn) ty = Math.sin(G.elapsed * 1.3) * .18;
  const kh = 1 - Math.exp(-(prop ? 3.2 : 2.3) * dt), kv = 1 - Math.exp(-3 * dt), V = G.vel; V.x += (tx - V.x) * kh; V.z += (tz - V.z) * kh; V.y = 0; G.vy = G.vy + (ty - G.vy) * kv;
  AT.mv = moving || !!up || !!dn; AT.propOn = prop && AT.mv; AT.fastOn = fast;
}
function tilt() { const hs = Math.hypot(G.vel.x, G.vel.z), vy = G.vy; if (hs < .8 && Math.abs(vy) < 1.2) return .12; return Math.max(.12, Math.min(2.6, Math.PI / 2 - Math.atan2(vy, hs) * .85)); }
function pose(r, dt) {
  if (!swimOn() || !r) { if (AT.disc) AT.disc.visible = false; return; }
  const t = G.elapsed, hs = Math.hypot(G.vel.x, G.vel.z), mv = hs > .8 || Math.abs(G.vy) > 1.2, k = 1 - Math.exp(-12 * dt), S = (o, ax, v) => { o.rotation[ax] += (v - o.rotation[ax]) * k; };
  AT.ph += dt * (AT.fastOn ? 9 : 5.5) * (mv ? 1 : .5); const p = AT.ph;
  if (AT.propOn) { for (const [a, s] of [[r.armL, 1], [r.armR, -1]]) { S(a.sh, 'x', -3.05); S(a.sh, 'z', .12 * s); S(a.el, 'x', 0); }
    const w = t * 34; r.legL.hip.rotation.x = .15 + Math.sin(w) * .55; r.legL.hip.rotation.z = .2 + Math.cos(w) * .55; r.legR.hip.rotation.x = .15 - Math.sin(w) * .55; r.legR.hip.rotation.z = -.2 - Math.cos(w) * .55; r.legL.kn.rotation.x = r.legR.kn.rotation.x = .04; }
  else if (mv) { S(r.armL.sh, 'x', -1.55 + Math.sin(p) * 1.55); S(r.armR.sh, 'x', -1.55 - Math.sin(p) * 1.55); S(r.armL.sh, 'z', .18); S(r.armR.sh, 'z', -.18); S(r.armL.el, 'x', -.35); S(r.armR.el, 'x', -.35);
    const f = Math.sin(p * 2); S(r.legL.hip, 'x', .12 + f * .38); S(r.legR.hip, 'x', .12 - f * .38); S(r.legL.hip, 'z', .05); S(r.legR.hip, 'z', -.05); S(r.legL.kn, 'x', .25 + Math.max(0, f) * .3); S(r.legR.kn, 'x', .25 + Math.max(0, -f) * .3);
    const st = Math.floor(p / Math.PI); if (st !== AT.lastSt) { AT.lastSt = st; snd('stroke', AT.fastOn ? .9 : .6, Math.sin(p) * .4); } }
  else { const b = Math.sin(t * 2.6), c = Math.sin(t * 2.2); S(r.armL.sh, 'x', -.25); S(r.armR.sh, 'x', -.25); S(r.armL.sh, 'z', 1.05 + b * .35); S(r.armR.sh, 'z', -1.05 - b * .35); S(r.armL.el, 'x', -.3); S(r.armR.el, 'x', -.3);
    S(r.legL.hip, 'x', -.35 + c * .35); S(r.legR.hip, 'x', -.35 - c * .35); S(r.legL.kn, 'x', .9 + Math.sin(t * 2.2 + 1) * .3); S(r.legR.kn, 'x', .9 - Math.sin(t * 2.2 + 1) * .3); S(r.legL.hip, 'z', .15); S(r.legR.hip, 'z', -.15); }
  S(r.neck, 'x', mv ? -.6 : 0); S(r.torso, 'x', 0); r.hips.position.y += (1 - r.hips.position.y) * k;
  if (AT.disc) { if (AT.disc.parent !== r.hips) r.hips.add(AT.disc); AT.disc.position.set(0, -.96, 0); AT.disc.visible = !!AT.propOn; AT.disc.rotation.y -= dt * 38; }
}
function ground(x, z, y, g) { const f = floorH(x - CX, z - CZ); return g > .001 ? Math.max(g, f) : f; }
function cam(Tg, c) { const f = floorH(c.x - CX, c.z - CZ) + .6; if (c.y < f) c.y = f; if (c.y > WY - .4) c.y = WY - .4; }
function collide(pos) {   // surlar (kapılardan geçilir) — dairesel, kesin
  if (G.curKey !== 'atlantis') return; const x = pos.x - CX, z = pos.z - CZ, r = Math.hypot(x, z), a = Math.atan2(z, x);
  for (const [r0, r1, h] of WALLS) { if (r < r0 - .4 || r > r1 + .4) continue; const fy = floorH(x, z); if (pos.y > fy + h + 1.2 || nearGate(a, r, 5.6)) continue; const to = r < (r0 + r1) / 2 ? r0 - .4 : r1 + .4; pos.x = CX + x / r * to; pos.z = CZ + z / r * to; }
}

/* ---------- ⏱️ her kare ---------- */
const dmy = new T.Object3D(), tv = new T.Vector3(), cc = new T.Color(), C_SH = new T.Color(0x1f86ad), C_DP = new T.Color(0x031a2b), C_TR = new T.Color(0x020d18);
function tick(dt) {
  wellTick(dt);
  if (G.curKey !== 'atlantis') { if (AT.on) leave(); return; }
  if (!AT.built) return; hud(); if (!dt) return;
  const t = G.elapsed, Pp = P(), lx = Pp.x - CX, lz = Pp.z - CZ, cam = G.camera.position, clx = cam.x - CX, clz = cam.z - CZ; U.uTime.value = t;
  // 🌫️ derinliğe göre renk
  const depth = WY - cam.y, deep = sstep(25, 110, depth), tr = sstep(-5, -30, cam.y);
  cc.copy(C_SH).lerp(C_DP, deep).lerp(C_TR, tr); const F = G.scene.fog; if (F) { F.color.copy(cc); F.near = 3; F.far = 165 - 90 * deep - 30 * tr; } if (G.scene.background && G.scene.background.isColor) G.scene.background.copy(cc);
  if (AT.glowPts) { const u = AT.glowPts.material.uniforms; u.fogColor.value.copy(cc); u.fogNear.value = 3; u.fogFar.value = F ? F.far : 160; }
  if (!AT.sun) AT.sun = G.scene.children.find(o => o.isDirectionalLight) || null; if (AT.sun) AT.sun.intensity = 1.25 * (1 - deep * .65 - tr * .25);
  const m = mats(); m.caus.offset.set(t * .013, t * .009); m.floor.emissiveIntensity = .17 * (1 - deep * .7); if (AT.surf) AT.surf.material.map.offset.set(t * .006, -t * .004);
  // 🏙️ uzak parçaları gizle
  AT.cT = (AT.cT || 0) - dt; if (AT.cT <= 0) { AT.cT = .4; for (const c of AT.chunks) c.visible = Math.hypot(c.userData.c.x - clx, c.userData.c.y - clz) < 240; }
  // 🔮 kristal
  if (AT.crystal) { AT.crystal.rotation.y += dt * .35; AT.crystal.position.y = floorH(0, 0) + 56.8 + Math.sin(t * .7) * 1.2; AT.ring.position.y = AT.crystal.position.y; AT.ring.rotation.x = Math.PI / 2 + Math.sin(t * .4) * .3; AT.ring.rotation.y += dt * .2;
    AT.orbs.forEach(o => { const a = t * .5 + o.userData.k * 2.094; o.position.set(Math.cos(a) * 14, AT.crystal.position.y + Math.sin(a * 2) * 3, Math.sin(a) * 14); o.rotation.y += dt * 2; }); }
  // 🐟 balıklar
  for (const s of AT.sch) { s.t += dt * s.w; const cx = s.hx + Math.cos(s.t) * s.R, cz = s.hz + Math.sin(s.t * s.k) * s.R * .7, cy = Math.max(floorH(cx, cz) + 2, Math.min(WY - 4, s.hy + Math.sin(s.t * 1.7) * 3));
    const dx = -Math.sin(s.t) * s.w, dz = Math.cos(s.t * s.k) * s.k * .7 * s.w, yw = Math.atan2(dx, dz);
    s.f.forEach((f, i) => { tv.set(cx + f.o.x + f.fl.x, cy + f.o.y + f.fl.y, cz + f.o.z + f.fl.z); const ex = tv.x - lx, ey = tv.y - Pp.y, ez = tv.z - lz, ed = Math.hypot(ex, ey, ez);
      if (ed < 6.5) { const k2 = (6.5 - ed) / (ed || 1) * dt * 5; f.fl.x += ex * k2; f.fl.y += ey * k2; f.fl.z += ez * k2; } f.fl.multiplyScalar(Math.exp(-1.2 * dt));
      dmy.position.copy(tv); dmy.rotation.set(0, yw + Math.sin(t * 9 + f.p) * .18, 0); dmy.scale.setScalar(s.sc * f.s); dmy.updateMatrix(); AT.fishIM.setMatrixAt(s.i0 + i, dmy.matrix); }); }
  AT.fishIM.instanceMatrix.needsUpdate = true;
  // 🪼 denizanası
  AT.jel.forEach((j, i) => { j.p += dt * 1.6; const pu = Math.sin(j.p); j.x += j.vx * dt; j.z += j.vz * dt; j.y += (.25 + Math.max(0, pu) * .5) * dt * .6 - dt * .12; const fy = floorH(j.x, j.z); if (j.y < fy + 4) j.y = fy + 4; if (j.y > WY - 6) j.y = WY - 6;
    dmy.position.set(j.x, j.y, j.z); dmy.rotation.set(Math.sin(j.p * .3) * .15, 0, Math.cos(j.p * .27) * .15); dmy.scale.set(j.s * (1 + pu * .14), j.s * (1 - pu * .12), j.s * (1 + pu * .14)); dmy.updateMatrix(); AT.jelB.setMatrixAt(i, dmy.matrix);
    dmy.scale.set(j.s, j.s * (1 + pu * .1), j.s); dmy.updateMatrix(); AT.jelT.setMatrixAt(i, dmy.matrix); });
  AT.jelB.instanceMatrix.needsUpdate = AT.jelT.instanceMatrix.needsUpdate = true;
  // 🐢🐋 diğer canlılar
  for (const c of AT.cre) { c.t += dt * (c.w || 1); const g = c.g;
    if (c.kind === 'crabX') { c.t += dt; const sd = Math.sin(c.t * .5) > 0 ? 1 : -1, sp = .7 * c.s; c.cx += Math.cos(c.dir) * sp * dt * sd; c.cz -= Math.sin(c.dir) * sp * dt * sd; g.position.set(c.cx, floorH(c.cx, c.cz) + .18 * c.s, c.cz); g.rotation.y = c.dir; c.parts.l.forEach((l, k) => l.rotation.x = Math.sin(c.t * 14 + k) * .4); continue; }
    const x = c.cx + Math.cos(c.t) * c.R, z = c.cz + Math.sin(c.t) * c.R, dx = -Math.sin(c.t) * Math.sign(c.w), dz = Math.cos(c.t) * Math.sign(c.w);
    let y; if (c.kind === 'whale') y = 58 + Math.sin(c.t * 3) * 3; else if (c.kind === 'dolphin') y = WY - 10 + Math.sin(c.t * 9) * 6; else if (c.kind === 'manta') y = floorH(x, z) + 9 + Math.sin(c.t * 2) * 3; else y = floorH(x, z) + 5 + Math.sin(c.t * 1.5) * 2;
    g.position.set(x, y, z); g.rotation.y = Math.atan2(dx, dz);
    if (c.kind === 'turtle') c.parts.fl.forEach((f, k) => f.rotation.z = Math.sin(t * 2.2 + (k < 2 ? 0 : 1)) * (k % 2 ? -.5 : .5));
    else if (c.kind === 'manta') { c.parts.w[0].rotation.z = Math.sin(t * 1.8) * .35; c.parts.w[1].rotation.z = -Math.sin(t * 1.8) * .35; g.rotation.x = Math.sin(t * .9) * .08; }
    else if (c.kind === 'dolphin') { c.parts.tail.rotation.x = Math.sin(t * 9) * .4; g.rotation.x = -Math.cos(c.t * 9) * .5; if (Math.random() < dt * .08 && Math.hypot(x - lx, z - lz) < 60) snd('dolphin', .8, Math.sign(x - lx) * .5); }
    else if (c.kind === 'whale') { c.parts.tail.rotation.x = Math.sin(t * 1.1) * .25; g.rotation.x = Math.cos(c.t * 3) * .05; }
  }
  if (AT.crabIM) { AT.crabs.forEach((c, i) => { c.t += dt; const sd = Math.sin(c.t * .5) > 0 ? 1 : -1; c.x += Math.cos(c.dir) * .7 * c.s * dt * sd; c.z -= Math.sin(c.dir) * .7 * c.s * dt * sd; dmy.position.set(c.x, floorH(c.x, c.z) + .18 * c.s + Math.abs(Math.sin(c.t * 14)) * .03, c.z); dmy.rotation.set(0, c.dir, Math.sin(c.t * 14) * .06); dmy.scale.setScalar(c.s); dmy.updateMatrix(); AT.crabIM.setMatrixAt(i, dmy.matrix); }); AT.crabIM.instanceMatrix.needsUpdate = true; }
  AT.wsT = (AT.wsT || 12) - dt; if (AT.wsT <= 0) { AT.wsT = 28 + Math.random() * 30; if (AT.whale) { const d = AT.whale.g.position.distanceTo(tv.set(lx, Pp.y, lz)); snd('whale', Math.max(.25, 1 - d / 350)); } }
  // 🦪 istiridyeler
  if (AT.clamIM) { const { bot, top: tp, prl } = AT.clamIM, pp = AT.pearlPts.geometry.attributes.position;
    for (const c of AT.clams) { const d = Math.hypot(c.x - lx, c.z - lz), want = (Math.sin(t * .35 + c.ph) > -.2 || d < 9) ? .9 : .05; c.open += (want - c.open) * Math.min(1, dt * 1.5); const got = AT.pearls.has(c.i);
      dmy.position.set(c.x, c.y, c.z); dmy.rotation.set(0, c.ry, 0, 'YXZ'); dmy.scale.setScalar(1.6); dmy.updateMatrix(); bot.setMatrixAt(c.i, dmy.matrix);
      dmy.rotation.set(-c.open, c.ry, 0, 'YXZ'); dmy.updateMatrix(); tp.setMatrixAt(c.i, dmy.matrix);
      const px = c.x + Math.sin(c.ry) * 1.28, pz = c.z + Math.cos(c.ry) * 1.28; dmy.position.set(px, c.y + .22, pz); dmy.rotation.set(0, 0, 0); dmy.scale.setScalar(got ? 0 : 1.6); dmy.updateMatrix(); prl.setMatrixAt(c.i, dmy.matrix);
      pp.setXYZ(c.i, px, got || c.open < .3 ? -9999 : c.y + .3, pz);
      if (!got && c.open > .45 && Math.hypot(px - lx, pz - lz) < 2.2 && Math.abs(Pp.y - c.y) < 2.6) takePearl(c, px, c.y, pz); }
    for (const im of [bot, tp, prl]) im.instanceMatrix.needsUpdate = true; pp.needsUpdate = true; }
  try { mmTick(dt, t, lx, Pp.y, lz); } catch (e) { console.warn('mm', e); }
  for (const ch of AT.chests) ch.lid.rotation.x += ((ch.open ? -1.5 : 0) - ch.lid.rotation.x) * Math.min(1, dt * 4);
  // 🫧 kabarcıklar
  AT.brT = (AT.brT || 1) - dt; if (AT.brT <= 0) { AT.brT = R(1.4, 3); tv.set(0, 1.62, .15); G.playerRig && G.playerRig.head ? G.playerRig.head.getWorldPosition(tv) : tv.set(Pp.x, Pp.y + 1.6, Pp.z); bubble(tv.x - CX, tv.y, tv.z - CZ, RI(2, 5), .12); if (Math.random() < .5) snd('bub', .6); }
  if (AT.propOn && G.playerRig) { AT.pbT = (AT.pbT || 0) - dt; if (AT.pbT <= 0) { AT.pbT = .03; G.playerRig.hips.localToWorld(tv.set(0, -.95, 0)); bubble(tv.x - CX, tv.y, tv.z - CZ, 2, .35, .6); } if (Math.random() < dt * 4) snd('bub', .35); }
  else if (AT.fastOn && AT.mv && Math.random() < dt * 6 && G.playerRig) { G.playerRig.hips.localToWorld(tv.set(0, -.9, 0)); bubble(tv.x - CX, tv.y, tv.z - CZ, 1, .3); }
  for (const v of AT.vents) if (Math.hypot(v.x - lx, v.z - lz) < 140 && Math.random() < dt * 14) bubble(v.x, v.y, v.z, 1, .5, 1.3);
  if (Math.random() < dt * 3) for (const c of AT.clams) if (c.open > .5 && Math.hypot(c.x - lx, c.z - lz) < 50 && Math.random() < .1) bubble(c.x, c.y + .4, c.z, 1, .2);
  { const bp = AT.bubGeo.attributes.position; for (let i = 0; i < AT.bubD.length; i++) { const b = AT.bubD[i]; if (b.life <= 0) continue; b.life -= dt; b.ph += dt * 6; const y = bp.getY(i) + b.vy * dt; if (b.life <= 0 || y > WY - .2) { b.life = 0; bp.setY(i, -9999); continue; } bp.setXYZ(i, bp.getX(i) + Math.sin(b.ph) * dt * .3, y, bp.getZ(i) + Math.cos(b.ph * .8) * dt * .3); } bp.needsUpdate = true; }
  // ❄️ deniz karı (kameranın çevresinde)
  { const sp = AT.snowGeo.attributes.position, n = sp.count; for (let i = 0; i < n; i++) { let x = sp.getX(i), y = sp.getY(i) - dt * .25, z = sp.getZ(i); const ox = clx + ((x - clx + 35) % 70 + 70) % 70 - 35, oz = clz + ((z - clz + 35) % 70 + 70) % 70 - 35; if (y < cam.y - 20) y += 40; if (y > cam.y + 20) y -= 40; sp.setXYZ(i, ox + Math.sin(t * .3 + i) * dt * .1, y, oz); } sp.needsUpdate = true; }
  // ☀️ ışık huzmeleri
  for (const r of AT.rays) { if (Math.hypot(r.position.x - clx, r.position.z - clz) > 95) r.position.set(clx + R(-70, 70), WY, clz + R(-70, 70)); r.rotation.y = Math.atan2(clx - r.position.x, clz - r.position.z); r.material.opacity = r.userData.o * (.6 + .4 * Math.sin(t * .6 + r.userData.p)) * (1 - deep * .6); }
  // 🔊 pervane sesi
  if (AT.amb && AT.ac) AT.amb.pg.gain.value += ((AT.propOn ? .12 : 0) - AT.amb.pg.gain.value) * Math.min(1, dt * 6);
}
function takePearl(c, x, y, z) {
  AT.pearls.add(c.i); try { localStorage.setItem('sftAtlInci', JSON.stringify([...AT.pearls])); } catch (e) {}
  G.play('ding'); G.progAdd(15, tv.set(CX + x, y, CZ + z)); bubble(x, y + .3, z, 12, .5);
  if (AT.pearls.size >= NPEARL) { G.progAdd(300, tv.set(CX + x, y, CZ + z)); G.play('goal'); G.showMsg('🦪 ' + adT('Atlantis’in bütün incilerini topladın! +300'), 3.5); }
  else G.showMsg(`🦪 ${adT('İnci')} ${AT.pearls.size}/${NPEARL} · +15`, 1.6);
}
function prompt() {
  if (G.curKey !== 'atlantis' || !AT.built) return null; const Pp = P(), tch = G.touchMode ? '👆 ' : 'V — ';
  const mm = mmNear(Pp.x - CX, Pp.y, Pp.z - CZ); if (mm) return [tch + '🧜‍♀️ ' + (MM.cur === mm ? adT('Devam et') : `${mm.o.name} ${adT('ile konuş')}`), () => mmTalk(mm)];
  for (const ch of AT.chests) if (!ch.open && Math.hypot(CX + ch.p.x - Pp.x, CZ + ch.p.z - Pp.z) < 2.4 && Math.abs(Pp.y - ch.p.y) < 3) return [tch + '💰 ' + adT('Batık sandığı aç'), () => { ch.open = true; snd('chest'); G.play('magic'); G.progAdd(40, Pp); G.showMsg('💰 ' + adT('Batık gemi hazinesi! +40'), 2); bubble(ch.p.x, ch.p.y + .8, ch.p.z, 14, .5); }];
  return null;
}

/* ---------- 🖥️ arayüz ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>#atHud{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top));transform:translateX(-50%);z-index:6;display:none;gap:7px;font:700 13px system-ui;color:#fff;pointer-events:none;white-space:nowrap}
#atHud .pill{background:rgba(5,40,60,.65);border-radius:12px;padding:6px 10px;border:1px solid rgba(160,240,255,.3)}#atExit{pointer-events:auto;cursor:pointer}
#mmBox{position:fixed;left:50%;bottom:calc(138px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:6;display:none;width:min(460px,88vw);background:linear-gradient(135deg,rgba(5,45,70,.88),rgba(40,20,80,.85));border:2px solid rgba(160,240,255,.55);border-radius:18px;padding:11px 15px;color:#fff;font:600 15px system-ui;box-shadow:0 6px 22px rgba(0,0,0,.35);pointer-events:none}
#mmBox .n{font:800 14px system-ui;color:#9ff3ff;margin-bottom:4px}#mmBox .h{font:600 11px system-ui;opacity:.7;margin-top:6px}body.touch #mmBox{bottom:calc(76px + env(safe-area-inset-bottom))}
#atTouch{position:fixed;right:12px;bottom:calc(205px + env(safe-area-inset-bottom));z-index:7;display:none;flex-direction:column;gap:8px}#atTouch button{width:60px;height:52px;border-radius:16px;border:2px solid rgba(160,240,255,.5);background:rgba(5,40,60,.6);color:#fff;font:800 11px system-ui;line-height:1.1}#atTouch button b{display:block;font-size:20px}#atTouch button.on{background:linear-gradient(135deg,#0096c7,#48cae4);border-color:#fff}</style>`);
document.body.insertAdjacentHTML('beforeend', `<div id="atHud"><div class="pill">🌊 Atlantis</div><div class="pill" id="atDepth">⬇️ 0 m</div><div class="pill" id="atPearl">🦪 0/${NPEARL}</div><div class="pill" id="atExit">🏳️ ${adT('Çık')}</div></div>
<div id="mmBox"><div class="n" id="mmName"></div><div id="mmText"></div><div class="h">${adT('V — devam · uzaklaşınca kapanır')}</div></div><div id="atTouch"><button id="atDown"><b>⬇️</b>${adT('Dal')}</button><button id="atFast"><b>💨</b>${adT('Hızlı')}</button><button id="atProp"><b>🌀</b>${adT('Pervane')}</button></div>`);
for (const ev of ['pointerdown', 'mousedown', 'touchstart']) for (const id of ['atExit', 'atDown', 'atFast', 'atProp']) $(id).addEventListener(ev, e => e.stopPropagation(), { passive: true });
$('atExit').addEventListener('click', e => { e.stopPropagation(); goHome(); });
$('atDown').addEventListener('pointerdown', () => { AT.down = true; }); for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) $('atDown').addEventListener(ev, () => { AT.down = false; });
$('atFast').addEventListener('click', e => { e.stopPropagation(); AT.fast = !AT.fast; if (AT.fast) AT.prop = false; });
$('atProp').addEventListener('click', e => { e.stopPropagation(); AT.prop = !AT.prop; if (AT.prop) AT.fast = false; });
function hud() {
  const on = G.curKey === 'atlantis' && !G.paused && !G.photoMode; $('atHud').style.display = on ? 'flex' : 'none'; $('atTouch').style.display = on && G.touchMode ? 'flex' : 'none'; if (!on) return;
  $('atDepth').textContent = `⬇️ ${Math.max(0, Math.round(WY - P().y))} m`; $('atPearl').textContent = `🦪 ${AT.pearls.size}/${NPEARL}`; $('atFast').classList.toggle('on', AT.fast); $('atProp').classList.toggle('on', AT.prop);
}
function key(code) { if (G.curKey !== 'atlantis') return false; return code === 'KeyQ' || code === 'KeyE'; }

/* ---------- 🕳️ köydeki Atlantis kuyusu ---------- */
const WELL = { x: 10, z: 0, y: null, g: null };
function wellBuild() {
  const M = mats(), g = new T.Group(); WELL.g = g; G.scene.add(g);
  let y = 2.55; try { const rc = new T.Raycaster(new T.Vector3(WELL.x, 200, WELL.z), new T.Vector3(0, -1, 0)); const h = G.ground && rc.intersectObject(G.ground, true)[0]; if (h) y = h.point.y; } catch (e) {} WELL.y = y; g.position.set(WELL.x, y, WELL.z);
  const rim = new T.Mesh(new T.CylinderGeometry(1.45, 1.6, .75, 20, 1, true), new T.MeshStandardMaterial({ color: 0x9aa3a8, roughness: .9, side: T.DoubleSide, flatShading: true })); rim.position.y = .37; g.add(rim);
  const lip = new T.Mesh(new T.TorusGeometry(1.5, .14, 8, 24), M.marble2); lip.rotation.x = Math.PI / 2; lip.position.y = .78; g.add(lip);
  const wt = canvasTex(128, 128, (c, W) => { const gr = c.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, '#e0fbff'); gr.addColorStop(.5, '#2bb3e0'); gr.addColorStop(1, '#0b4d77'); c.fillStyle = gr; c.fillRect(0, 0, W, W); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 4; for (let k = 0; k < 3; k++) { c.beginPath(); for (let a = 0; a < 9; a += .1) { const r = a * 6.5; c.lineTo(64 + Math.cos(a + k * 2.1) * r, 64 + Math.sin(a + k * 2.1) * r); } c.stroke(); } });
  const wa = new T.Mesh(new T.CircleGeometry(1.42, 24).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ map: wt, emissive: 0x2bb3e0, emissiveMap: wt, emissiveIntensity: .6, roughness: .2 })); wa.position.y = .55; g.add(wa); WELL.water = wa;
  for (const s of [-1, 1]) { const p = new T.Mesh(new T.BoxGeometry(.18, 2.3, .18), M.wood); p.position.set(s * 1.5, 1.15, 0); g.add(p); }
  const rf = new T.Mesh(prism(3.6, 1.9, .8), M.roof); rf.position.y = 2.3; g.add(rf);
  const sc = document.createElement('canvas'); sc.width = 512; sc.height = 128; const sg = sc.getContext('2d'); sg.fillStyle = '#0b4d77'; sg.fillRect(0, 0, 512, 128); sg.strokeStyle = '#9ff3ff'; sg.lineWidth = 8; sg.strokeRect(4, 4, 504, 120); sg.fillStyle = '#fff'; sg.font = 'bold 64px system-ui'; sg.textAlign = 'center'; sg.textBaseline = 'middle'; sg.fillText('🌊 Atlantis', 256, 68);
  const st = new T.CanvasTexture(sc); st.colorSpace = T.SRGBColorSpace; for (const s of [-1, 1]) { const sp = new T.Mesh(new T.PlaneGeometry(1.8, .45), new T.MeshBasicMaterial({ map: st })); sp.position.set(0, 1.95, s * .16); if (s < 0) sp.rotation.y = Math.PI; g.add(sp); }
}
function wellTick(dt) {
  if (G.curKey !== 'hub') { if (WELL.g) WELL.g.visible = false; return; }
  if (!WELL.g) { try { wellBuild(); } catch (e) { console.warn('kuyu', e); WELL.g = new T.Group(); } }
  WELL.g.visible = true; if (WELL.water) WELL.water.rotation.y -= dt * 1.2;
  WELL.cd = Math.max(0, (WELL.cd || 0) - dt); const p = P(); if (dt && !WELL.cd && !G.teleporting && Math.hypot(p.x - WELL.x, p.z - WELL.z) < .95 && WELL.y !== null && p.y < WELL.y + 1.6 && !G.giant) { WELL.cd = 5; open(); }
}

/* ---------- 🗺️ giriş / çıkış ---------- */
function area() {
  if (G.curKey !== 'atlantis') { leave(); return; }
  build(); if (!AT.g.parent) G.scene.add(AT.g);
  for (const o of AT.obsW) if (!G.obstacles.includes(o)) G.obstacles.push(o);
  AT.on = true; amb(true); AT.sun = null;
  const p = P(), f = floorH(p.x - CX, p.z - CZ); if (p.y < f + 6) p.y = f + 8; G.vy = 0;
  setTimeout(() => { if (G.curKey === 'atlantis') G.showMsg('🌊 ' + adT(G.touchMode ? 'Atlantis! ⬆️ Zıpla yukarı · ⬇️ Dal · 💨 Hızlı · 🌀 Pervane' : 'Atlantis! Boşluk ↑ · Q ↓ dal · E hızlı · Shift pervane'), 4); }, 900);
}
function leave() { mmClose(); if (AT.g.parent) G.scene.remove(AT.g); for (const o of AT.obsW || []) { const i = G.obstacles.indexOf(o); if (i >= 0) G.obstacles.splice(i, 1); } AT.on = false; AT.prop = AT.fast = AT.down = false; amb(false); if (AT.disc) { AT.disc.visible = false; if (AT.disc.parent) AT.disc.parent.remove(AT.disc); } hud(); }
function open() { const busy = G.admBusy && G.admBusy(); if (busy) { G.showMsg(busy, 1.8); return; } G.teleportTo('atlantis', CX, CZ - 262, 0, '🌊 ' + adT('Atlantis’e daldın!')); }
function goHome() { G.teleportTo('hub', WELL.x - 3, WELL.z, -Math.PI / 2, adT('🏡 Köye döndün')); }

/* ---------- 🛠️ admin ---------- */
try {
  const need = () => G.curKey !== 'atlantis' ? adT('🌊 Önce Atlantis’e git') : null, TPL = (x, z, yo = 6) => { const p = P(); p.set(CX + x, floorH(x, z) + yo, CZ + z); G.vel.set(0, 0, 0); };
  const cat = ['🌊 Atlantis', '🌊 Atlantis', [
    ['atl_go', '🌊', 'Atlantis’e git', 'Go to Atlantis', () => { open(); return '🌊'; }],
    ['atl_temple', '🔮', 'Kristal tapınağa ışınlan', 'Teleport to crystal temple', () => need() || (TPL(0, -26, 12), '🔮')],
    ['atl_reef', '🪸', 'Mercan bahçesine ışınlan', 'Teleport to coral reef', () => need() || (TPL(380, 0), '🪸')],
    ['atl_kelp', '🌿', 'Yosun ormanına ışınlan', 'Teleport to kelp forest', () => need() || (TPL(0, 400), '🌿')],
    ['atl_wreck', '🚢', 'Batık gemilere ışınlan', 'Teleport to shipwrecks', () => need() || (TPL(-60, -340), '🚢')],
    ['atl_trench', '🌋', 'Uçuruma ışınlan', 'Teleport to the trench', () => need() || (TPL(-430, 0, 8), '🌋')],
    ['atl_whale', '🐋', 'Balinayı çağır', 'Call the whale', () => { if (need()) return need(); const w = AT.whale, p = P(); w.cx = p.x - CX - Math.cos(w.t) * w.R; w.cz = p.z - CZ - Math.sin(w.t) * w.R - 30; snd('whale', 1); return '🐋'; }],
    ['atl_pearls', '🦪', 'İncileri sıfırla', 'Reset pearls', () => { AT.pearls.clear(); try { localStorage.removeItem('sftAtlInci'); } catch (e) {} return '🦪 0/' + NPEARL; }],
  ]];
  if (G.ADM_LIST && G.ADM_F) { G.ADM_LIST.splice(1, 0, cat); for (const [id, ic, tr, en, fn] of cat[2]) G.ADM_F[id] = { id, ic, tr, en, fn }; }
} catch (e) { console.warn('atlantis admin', e); }

window.__atl = { tick, area, open, key, prompt, swim, swimOn, top, tilt, pose, ground, cam, collide, AT, floorH, build, WY, WELL };
})(window.__sftG);
