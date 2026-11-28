/* 🌌 S.F.T · Uzay (space.js) — köy meydanındaki düğmeye basınca uzay bölümüne çıkılır.
   Kozmik desenler, bulutsular, gezegenler, sarmal gökada, dönen geometrik ışık desenleri, kayan yıldızlar.
   Havada asılı dev kayaların üstünde yürü, tırman, yüksek ve hızlı zıpla; mikroplar ve kozmik yaratıklarla dövüş. Tek düğme: Çık.
   index.html bunu yükler; oyunun değişkenlerine window.__sftG (G) ile erişir. Tasarımlar bu oyuna özgüdür. */
(function (G) {
'use strict';
const T = G.THREE, $ = id => document.getElementById(id), adT = s => G.adT(s);
const CX = -45000, CZ = -45000, Y0 = 60;
G.AREAS.space = { cx: CX, cz: CZ, r: 400, bg: 0x03020c, fog: [8000, 9000], sky: 0x7a6ad8, gnd: 0x1a1430, sunC: 0xfff0e0, sunI: 1.6 };
G.LOAD_NAMES.space = 'Uzay';
const SP = { g: new T.Group(), built: false, on: false, flow: new T.Vector3(.5, .06, .2), sky: null, rocks: [], obs: [], mobs: [], shots: [], kills: 0, lastHit: -9, inv: 0, top0: 40 };
SP.g.name = 'spaceRoot';
const U = { uTime: { value: 0 } };
const R = (a, b) => a + Math.random() * (b - a);
const tv = new T.Vector3(), tq = new T.Quaternion(), dmy = new T.Object3D();
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; }

/* ---------- 🔊 uzay sesleri: derin uğultu, dövüş, kayan yıldız ---------- */
function ac() { if (!SP.ac) { try { SP.ac = new (window.AudioContext || window.webkitAudioContext)(); SP.out = SP.ac.createGain(); SP.out.gain.value = .5; SP.out.connect(SP.ac.destination); } catch (e) { return null; } } if (SP.ac.state === 'suspended') SP.ac.resume().catch(() => {}); return SP.ac; }
for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, () => { if (SP.ac && SP.ac.state === 'suspended') SP.ac.resume().catch(() => {}); }, { passive: true });
function snd(kind, vol = 1) {
  const c = ac(); if (!c || c.state !== 'running' || !SP.on) return; const t = c.currentTime, g = c.createGain(); g.connect(SP.out);
  const tone = (type, f0, f1, d, v) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d); const gg = c.createGain(); gg.gain.setValueAtTime(v * vol, t); gg.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(gg).connect(g); o.start(t); o.stop(t + d + .02); };
  if (kind === 'pop') tone('sine', 500, 1400, .09, .18);
  else if (kind === 'splat') { tone('sawtooth', 300, 60, .25, .16); tone('sine', 900, 200, .15, .12); }
  else if (kind === 'bite') tone('square', 220, 90, .12, .12);
  else if (kind === 'zap') tone('sawtooth', 1200, 300, .3, .08);
  else if (kind === 'boom') { tone('sine', 140, 35, .6, .3); tone('sawtooth', 600, 80, .4, .1); }
  else if (kind === 'star') { const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(1800, t); o.frequency.exponentialRampToValueAtTime(500, t + .9); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05 * vol, t + .05); g.gain.exponentialRampToValueAtTime(.0001, t + 1); o.connect(g); o.start(t); o.stop(t + 1.05); }
}
function hum(on) {
  const c = on ? ac() : SP.ac; if (!c) return;
  if (on && !SP.hum) { const g = c.createGain(); g.gain.value = 0; g.connect(SP.out); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 320; f.connect(g);
    const os = [41.2, 61.7, 82.4, 123.5].map((fr, i) => { const o = c.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = fr * (1 + (Math.random() - .5) * .004); const og = c.createGain(); og.gain.value = [.5, .25, .18, .08][i]; o.connect(og).connect(f); o.start(); return o; });
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = .07; lg.gain.value = 160; lfo.connect(lg).connect(f.frequency); lfo.start(); os.push(lfo);
    g.gain.setValueAtTime(0, c.currentTime); g.gain.linearRampToValueAtTime(.16, c.currentTime + 3); SP.hum = { g, os }; }
  else if (!on && SP.hum) { const h = SP.hum; SP.hum = null; h.g.gain.cancelScheduledValues(c.currentTime); h.g.gain.setValueAtTime(h.g.gain.value, c.currentTime); h.g.gain.linearRampToValueAtTime(0, c.currentTime + .6); setTimeout(() => h.os.forEach(o => { try { o.stop(); } catch (e) {} }), 800); }
}

/* ---------- 🌌 kozmik gökyüzü (bulutsu + yıldızlar + samanyolu) ---------- */
function skyMat() {
  return new T.ShaderMaterial({ uniforms: { uTime: U.uTime }, side: T.BackSide, depthWrite: false, depthTest: false, fog: false,
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = vec4(p.xy, p.w * .9999, p.w); }`,
    fragmentShader: `uniform float uTime; varying vec3 vD;
      float h1(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float nz(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h1(i), h1(i + vec3(1,0,0)), f.x), mix(h1(i + vec3(0,1,0)), h1(i + vec3(1,1,0)), f.x), f.y), mix(mix(h1(i + vec3(0,0,1)), h1(i + vec3(1,0,1)), f.x), mix(h1(i + vec3(0,1,1)), h1(i + vec3(1,1,1)), f.x), f.y), f.z); }
      float fbm(vec3 p){ float v = 0.0, a = .5; for (int i = 0; i < 5; i++) { v += a * nz(p); p = p * 2.03 + 11.7; a *= .5; } return v; }
      float stars(vec3 d, float sc, float th){ vec3 p = d * sc, c = floor(p), f = fract(p) - .5; float h = h1(c); if (h < th) return 0.0; vec3 o = vec3(h1(c + 3.1), h1(c + 7.7), h1(c + 1.3)) - .5; float s = smoothstep(.16, 0.0, length(f - o * .55)); return s * (.55 + .45 * sin(uTime * (1.5 + h * 3.0) + h * 60.0)); }
      void main(){ vec3 d = normalize(vD); float t = uTime * .004;
        vec3 col = vec3(.008, .006, .025);
        float n1 = fbm(d * 2.4 + vec3(t, 0.0, -t)), n2 = fbm(d * 4.6 - vec3(3.0, t, 1.0)), n3 = fbm(d * 3.2 + 9.0);
        col += vec3(.42, .1, .62) * smoothstep(.48, .86, n1) * .95;
        col += vec3(.06, .32, .78) * smoothstep(.52, .9, n2) * .75;
        col += vec3(.95, .32, .52) * pow(smoothstep(.56, .95, n3), 2.0) * .7;
        col += vec3(.1, .8, .7) * pow(smoothstep(.62, .98, fbm(d * 6.0 + 21.0)), 3.0) * .5;
        float band = exp(-pow(dot(d, normalize(vec3(.35, 1.0, .25))) * 3.6, 2.0)); col += vec3(.55, .48, .78) * band * (.25 + .6 * fbm(d * 10.0));
        col += vec3(1.0, .92, .85) * stars(d, 260.0, .978) + vec3(.8, .9, 1.0) * stars(d, 110.0, .985) * 1.4 + vec3(1.0, .8, .7) * stars(d, 55.0, .992) * 1.8;
        gl_FragColor = vec4(col, 1.0); }` });
}

/* ---------- 🪐 gezegenler, gökada, desenler ---------- */
function glowTex(c0 = 'rgba(255,255,255,1)', c1 = 'rgba(180,160,255,.35)') { return canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, c0); gr.addColorStop(.3, c1); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }); }
function bandTex(cols) { return canvasTex(64, 256, (g, W, H) => { for (let y = 0; y < H; y += 2) { const k = Math.sin(y * .09) * .5 + Math.sin(y * .23 + 1) * .3 + Math.random() * .2, c = cols[Math.floor((k * .5 + .5) * cols.length) % cols.length]; g.fillStyle = c; g.fillRect(0, y, W, 2); } }); }
function build() {
  if (SP.built) return; SP.built = true;
  SP.sky = new T.Mesh(new T.SphereGeometry(900, 48, 24), skyMat()); SP.sky.renderOrder = -900; SP.sky.frustumCulled = false; SP.g.add(SP.sky);
  // ☀️ uzak yıldız
  const sun = new T.Sprite(new T.SpriteMaterial({ map: glowTex('rgba(255,250,235,1)', 'rgba(255,200,120,.4)'), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false })); sun.scale.set(160, 160, 1); sun.position.set(-520, 260, -380); SP.g.add(sun); SP.far = [sun];
  // 🪐 halkalı dev gezegen
  const gp = new T.Group(); gp.position.set(260, 40, -330); SP.g.add(gp); SP.planet = gp;
  const pm = new T.Mesh(new T.SphereGeometry(70, 48, 32), new T.MeshStandardMaterial({ map: bandTex(['#e9c46a', '#f4a261', '#e76f51', '#d4a373', '#faedcd', '#c58b5a']), roughness: .9, fog: false })); gp.add(pm); SP.pm = pm;
  const rt = canvasTex(512, 8, (g, W) => { for (let x = 0; x < W; x++) { const k = Math.sin(x * .08) * .3 + Math.sin(x * .31) * .2 + .5; g.fillStyle = `rgba(${220 + Math.random() * 30 | 0},${190 + Math.random() * 40 | 0},${150 + Math.random() * 40 | 0},${Math.max(0, k) * (x > 40 && x < 470 ? 1 : 0)})`; g.fillRect(x, 0, 1, 8); } });
  const rg = new T.RingGeometry(90, 150, 96, 1); { const p = rg.attributes.position, uv = rg.attributes.uv; for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getY(i)); uv.setXY(i, (r - 90) / 60, .5); } }
  const ring = new T.Mesh(rg, new T.MeshBasicMaterial({ map: rt, transparent: true, side: T.DoubleSide, depthWrite: false, fog: false })); ring.rotation.x = Math.PI / 2 - .38; ring.rotation.y = .2; gp.add(ring);
  // 🌍 mavi gezegen + ay
  const bp = new T.Mesh(new T.SphereGeometry(34, 40, 28), new T.MeshStandardMaterial({ map: canvasTex(256, 128, (g, W, H) => { g.fillStyle = '#1d4ed8'; g.fillRect(0, 0, W, H); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${40 + Math.random() * 60 | 0},${140 + Math.random() * 60 | 0},${70 + Math.random() * 40 | 0},.9)`; g.beginPath(); g.ellipse(Math.random() * W, H * .2 + Math.random() * H * .6, 6 + Math.random() * 24, 4 + Math.random() * 12, Math.random() * 3, 0, 7); g.fill(); } for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(Math.random() * W, Math.random() * H, 8 + Math.random() * 30, 2 + Math.random() * 4, 0, 0, 7); g.fill(); } }), roughness: .8, fog: false }));
  bp.position.set(-300, -60, 220); SP.g.add(bp); SP.bp = bp;
  const halo = new T.Sprite(new T.SpriteMaterial({ map: glowTex('rgba(120,190,255,.0)', 'rgba(90,170,255,.35)'), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false })); halo.scale.set(100, 100, 1); halo.position.copy(bp.position); SP.g.add(halo);
  const moon = new T.Mesh(new T.SphereGeometry(9, 24, 16), new T.MeshStandardMaterial({ color: 0xb0aab5, roughness: 1, flatShading: true, fog: false })); moon.position.set(-250, -30, 180); SP.g.add(moon); SP.moon = moon;
  // 🌀 sarmal gökada
  const gx = canvasTex(512, 512, (g, W) => { g.translate(W / 2, W / 2); const core = g.createRadialGradient(0, 0, 0, 0, 0, 90); core.addColorStop(0, 'rgba(255,240,220,1)'); core.addColorStop(1, 'rgba(255,200,160,0)'); g.fillStyle = core; g.beginPath(); g.arc(0, 0, 90, 0, 7); g.fill();
    for (let arm = 0; arm < 3; arm++) for (let i = 0; i < 1400; i++) { const t = i / 1400, a = arm * 2.094 + t * 7.5, r = 20 + t * 220, j = (Math.random() - .5) * (8 + t * 40); g.fillStyle = `hsla(${200 + t * 120 + Math.random() * 40},90%,${60 + Math.random() * 30}%,${.5 * (1 - t) + .1})`; g.fillRect(Math.cos(a) * r + j, Math.sin(a) * r + j, 2, 2); } });
  const gal = new T.Mesh(new T.PlaneGeometry(260, 260), new T.MeshBasicMaterial({ map: gx, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false })); gal.position.set(120, 330, 520); gal.lookAt(0, 0, 0); gal.rotateX(.9); SP.g.add(gal); SP.gal = gal;
  // ✴️ kozmik desen (dönen ışık mandalası)
  const md = canvasTex(512, 512, (g, W) => { g.translate(W / 2, W / 2); g.globalCompositeOperation = 'lighter'; g.lineWidth = 2;
    for (let k = 0; k < 7; k++) { g.strokeStyle = `hsla(${180 + k * 25},90%,65%,.75)`; g.beginPath(); g.arc(0, 0, 40 + k * 30, 0, 7); g.stroke(); }
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; g.strokeStyle = `hsla(${260 + (k % 3) * 30},90%,70%,.55)`; g.beginPath(); g.moveTo(Math.cos(a) * 40, Math.sin(a) * 40); g.lineTo(Math.cos(a) * 240, Math.sin(a) * 240); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(Math.cos(a) * 190, Math.sin(a) * 190, 4, 0, 7); g.fill(); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.strokeStyle = 'hsla(300,90%,70%,.6)'; g.beginPath(); g.arc(Math.cos(a) * 100, Math.sin(a) * 100, 60, 0, 7); g.stroke(); }
    for (let s = 0; s < 2; s++) { g.strokeStyle = s ? 'hsla(190,100%,70%,.8)' : 'hsla(45,100%,70%,.8)'; g.beginPath(); for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI * 2 + s * Math.PI / 6; g[k ? 'lineTo' : 'moveTo'](Math.cos(a) * 150, Math.sin(a) * 150); } g.stroke(); } });
  SP.mand = []; for (const [p, s] of [[[-160, 120, -420], 220], [[380, -120, 260], 160]]) { const m = new T.Mesh(new T.PlaneGeometry(s, s), new T.MeshBasicMaterial({ map: md, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false, opacity: .8 })); m.position.set(...p); m.lookAt(0, 0, 0); SP.g.add(m); SP.mand.push(m); }
  // 🔷 dönen tel kafes geometriler
  SP.wire = []; const wcol = [0x7df9ff, 0xff7ad9, 0xffe66d, 0x9d7dff];
  [[new T.IcosahedronGeometry(16, 0), [-90, 30, -150]], [new T.OctahedronGeometry(12, 0), [120, -25, -110]], [new T.TorusKnotGeometry(10, 1.6, 90, 6, 2, 3), [70, 45, 140]], [new T.DodecahedronGeometry(13, 0), [-140, -40, 90]], [new T.IcosahedronGeometry(26, 1), [10, 90, -260]]].forEach(([geo, p], i) => {
    const l = new T.LineSegments(new T.EdgesGeometry(geo, 1), new T.LineBasicMaterial({ color: wcol[i % 4], transparent: true, opacity: .85, blending: T.AdditiveBlending, depthWrite: false, fog: false })); l.position.set(...p); l.userData.s = R(.05, .2); SP.g.add(l); SP.wire.push(l); });
  // ✨ yakın yıldızlar (paralaks) ve uzay tozu
  const N = 2200, sp = new Float32Array(N * 3), sc = new Float32Array(N * 3), col = new T.Color();
  for (let i = 0; i < N; i++) { const r = R(60, 420), a = R(0, 6.28), b = Math.acos(R(-1, 1)); sp[i * 3] = Math.sin(b) * Math.cos(a) * r; sp[i * 3 + 1] = Math.cos(b) * r; sp[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r; col.setHSL(R(.55, .75), .6, R(.7, 1)); sc[i * 3] = col.r; sc[i * 3 + 1] = col.g; sc[i * 3 + 2] = col.b; }
  const sg = new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(sp, 3)).setAttribute('color', new T.BufferAttribute(sc, 3));
  SP.stars = new T.Points(sg, new T.PointsMaterial({ size: 1.6, map: glowTex(), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false })); SP.stars.frustumCulled = false; SP.g.add(SP.stars);
  const ND = 900, dp = new Float32Array(ND * 3); for (let i = 0; i < ND; i++) { dp[i * 3] = R(-40, 40); dp[i * 3 + 1] = R(-40, 40); dp[i * 3 + 2] = R(-40, 40); }
  SP.dust = new T.Points(new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(dp, 3)), new T.PointsMaterial({ size: .12, color: 0xcfd8ff, transparent: true, opacity: .6, depthWrite: false, fog: false })); SP.dust.frustumCulled = false; SP.g.add(SP.dust);
  // ☄️ asteroitler
  const NA = 70; SP.ast = new T.InstancedMesh(new T.DodecahedronGeometry(1, 1), new T.MeshStandardMaterial({ color: 0x7a7285, roughness: 1, flatShading: true, fog: false }), NA); SP.ast.frustumCulled = false; SP.g.add(SP.ast);
  { const p = SP.ast.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const k = .75 + Math.random() * .4; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } SP.ast.geometry.computeVertexNormals(); }
  SP.astD = [...Array(NA)].map(() => ({ p: new T.Vector3(R(-120, 120), R(-60, 60), R(-120, 120)), r: new T.Euler(R(0, 6), R(0, 6), 0), w: new T.Vector3(R(-.4, .4), R(-.4, .4), R(-.4, .4)), s: Math.random() < .1 ? R(4, 9) : R(.4, 2.2), v: R(.6, 1.4) }));
  // 🌠 kayan yıldızlar
  SP.shoot = []; const stt = canvasTex(256, 8, (g, W) => { const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = gr; g.fillRect(0, 2, W, 4); });
  for (let i = 0; i < 3; i++) { const m = new T.Mesh(new T.PlaneGeometry(40, .8), new T.MeshBasicMaterial({ map: stt, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false })); m.visible = false; SP.g.add(m); SP.shoot.push({ m, t: 0, v: new T.Vector3() }); }
}

/* ---------- 🪨 havada asılı dev kayalar (üstünde yürünür, tırmanılır) ---------- */
function on() { return G.curKey === 'space'; }
let RS = 7; const RR = () => { RS = (RS * 16807) % 2147483647; return RS / 2147483647; }, RRr = (a, b) => a + RR() * (b - a);
function rockGeo(r, h) {   // üstü düz, altı sivri, pürüzlü kaya
  const g = new T.IcosahedronGeometry(1, 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const n = 1 + Math.sin(x * 5.1 + z * 3.3) * .08 + Math.sin(y * 7.3 + x * 2.1) * .06;
    x *= r * n; z *= r * n; y = y > .25 ? h * .5 : y > -.2 ? y * h * .9 + h * .3 : y * h * 1.6; p.setXYZ(i, x, y, z); }
  g.computeVertexNormals(); return g;
}
function buildRocks() {
  RS = 7; const mat = new T.MeshStandardMaterial({ color: 0x5b5470, roughness: .95, flatShading: true, fog: false }), cry = new T.MeshStandardMaterial({ color: 0xb98cff, emissive: 0x8a4dff, emissiveIntensity: 1.1, roughness: .3, fog: false });
  const L = [[0, 0, SP.top0, 20, 7]];   // ana kaya: başlangıç
  let prev = L[0];
  for (let k = 0; k < 46; k++) {   // zıplanarak geçilen kaya zincirleri (kenarlar arası 2–5 m, yükseklik farkı ≤ 3.5 m)
    if (k % 9 === 8) prev = L[Math.floor(RR() * L.length)];
    for (let tries = 0; tries < 10; tries++) { const r = RRr(3.5, 9), a = RRr(0, Math.PI * 2), d = prev[3] + r + RRr(2, 5), x = prev[0] + Math.cos(a) * d, z = prev[1] + Math.sin(a) * d;
      if (Math.hypot(x, z) > 175 || L.some(o => Math.hypot(o[0] - x, o[1] - z) < o[3] + r + 1.5)) continue;
      const y = Math.max(SP.top0 - 14, Math.min(SP.top0 + 30, prev[2] + RRr(-2.5, 3.4))), n = [x, z, y, r, RRr(3, 7)]; L.push(n); prev = n; break; } }
  for (let k = 0; k < 10; k++) { const a = RRr(0, 6.28), d = RRr(30, 90); L.push([Math.cos(a) * d, Math.sin(a) * d, SP.top0 + RRr(-6, 20), RRr(2.5, 4.5), RRr(2, 4)]); }
  for (const [x, z, y, r, h] of L) { const m = new T.Mesh(rockGeo(r, h), mat); m.position.set(x, y - h * .5, z); m.castShadow = m.receiveShadow = true; SP.g.add(m);
    for (let c = 0; c < Math.round(r / 2.5); c++) { const a = RRr(0, 6.28), rr = RRr(.2, .85) * r, cs = RRr(.25, .7), cm = new T.Mesh(new T.OctahedronGeometry(cs, 0), cry); cm.scale.y = RRr(1.6, 3); cm.position.set(x + Math.cos(a) * rr, y + cs * cm.scale.y * .5, z + Math.sin(a) * rr); cm.rotation.set(RRr(-.3, .3), RRr(0, 3), RRr(-.3, .3)); SP.g.add(cm); }
    SP.rocks.push({ x, z, y, r }); SP.obs.push({ x: CX + x, z: CZ + z, r: r * .95, h: y, top: y, y0: y - h * 1.6, stand: true, pass: false, spc: true }); }
}
const groundHere = (x, z, y = 1e9) => { let best = -9999; for (const r of SP.rocks) if (r.y <= y + .6 && Math.hypot(r.x - x, r.z - z) < r.r * .95) best = Math.max(best, r.y); return best; };
function ground(x, z, y, g) { return groundHere(x - CX, z - CZ, y); }

/* ---------- 🦠 mikroplar ve 👁️ kozmik yaratıklar ---------- */
function mobMesh(kind) {
  const g = new T.Group(), M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .4, fog: false }, o));
  if (kind === 'germ') { const col = [0x7cff6b, 0xc77dff, 0x4cc9f0, 0xff7ad9][Math.random() * 4 | 0], body = new T.Mesh(new T.SphereGeometry(1, 18, 14), M(col, { transparent: true, opacity: .62, emissive: col, emissiveIntensity: .25 })); g.add(body);
    const nuc = new T.Mesh(new T.SphereGeometry(.42, 12, 10), M(0x2d1b4e, { emissive: 0x3a1066, emissiveIntensity: .4 })); nuc.position.set(.15, -.1, -.1); g.add(nuc);
    const cil = new T.Mesh(G.mergeGeometries([...Array(26)].map(() => { const v = new T.Vector3(R(-1, 1), R(-1, 1), R(-1, 1)).normalize(); return new T.ConeGeometry(.06, .55, 4).translate(0, 1.15, 0).applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), v)); })), M(col, { emissive: col, emissiveIntensity: .35 })); g.add(cil);
    for (const s of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(.22, 10, 8), M(0xffffff)); e.position.set(s * .3, .3, .82); g.add(e); const pu = new T.Mesh(new T.SphereGeometry(.11, 8, 6), M(0x111111)); pu.position.set(s * .3, .3, 1.02); g.add(pu); }
    const mouth = new T.Mesh(new T.TorusGeometry(.22, .05, 5, 10, Math.PI), M(0x220022)); mouth.rotation.z = Math.PI; mouth.position.set(0, -.2, .92); g.add(mouth); g.userData.spin = cil; }
  else { const body = new T.Mesh(new T.SphereGeometry(1.5, 22, 16), M(0x1b0f3a, { emissive: 0x2a0f5c, emissiveIntensity: .5, metalness: .3 })); g.add(body);
    const dots = new T.Points(new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(new Float32Array([...Array(60)].flatMap(() => { const v = new T.Vector3(R(-1, 1), R(-1, 1), R(-1, 1)).normalize().multiplyScalar(1.52); return [v.x, v.y, v.z]; })), 3)), new T.PointsMaterial({ size: .16, color: 0xfff2b3, fog: false })); g.add(dots);
    const eye = new T.Mesh(new T.SphereGeometry(.62, 16, 12), M(0xfff0ff, { emissive: 0xffd6ff, emissiveIntensity: .4 })); eye.position.z = 1.1; g.add(eye); const iris = new T.Mesh(new T.SphereGeometry(.34, 12, 10), M(0xff2bd6, { emissive: 0xff2bd6, emissiveIntensity: 1 })); iris.position.z = 1.55; g.add(iris);
    const ring = new T.Mesh(new T.TorusGeometry(2.1, .08, 8, 40), M(0xb98cff, { emissive: 0x8a4dff, emissiveIntensity: 1.2 })); ring.rotation.x = Math.PI / 2; g.add(ring); g.userData.ring = ring; g.userData.tent = [];
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, tg = new T.Group(); tg.position.set(Math.cos(a) * .9, -1, Math.sin(a) * .9); g.add(tg); const t = new T.Mesh(new T.ConeGeometry(.22, 2.6, 6).translate(0, -1.3, 0), M(0x3a1d7a, { emissive: 0x5b2bbf, emissiveIntensity: .5 })); tg.add(t); g.userData.tent.push(tg); } }
  const hb = new T.Sprite(new T.SpriteMaterial({ color: 0xff4d6d, fog: false, depthTest: false })); hb.scale.set(1.6, .14, 1); hb.position.y = kind === 'germ' ? 1.8 : 3; hb.renderOrder = 5; g.add(hb); g.userData.hb = hb;
  return g;
}
function spawnMob(kind, near, small) {
  const P = G.player.position, a = R(0, 6.28), d = near ? R(4, 8) : R(22, 38), g = mobMesh(kind), lx = (near ? near.x : P.x - CX) + Math.cos(a) * d, lz = (near ? near.z : P.z - CZ) + Math.sin(a) * d;
  g.position.set(lx, (near ? near.y : P.y) + R(1, 6), lz); const sc = kind === 'germ' ? (small ? R(.45, .6) : R(.8, 1.3)) : R(1, 1.25); g.scale.setScalar(sc); SP.g.add(g);
  const hp = kind === 'germ' ? (small ? 18 : 40) : 130; SP.mobs.push({ kind, g, hp, max: hp, sc, small, cd: R(1, 3), ph: R(0, 6), vel: new T.Vector3(), hurt: 0 });
}
function mobTick(dt, t) {
  const P = G.player.position, lp = tv.set(P.x - CX, P.y + 1.1, P.z - CZ);
  const nG = SP.mobs.filter(m => m.kind === 'germ').length, nC = SP.mobs.length - nG; SP.spT = (SP.spT || 0) - dt;
  if (SP.spT <= 0) { SP.spT = .8; if (nG < 8) spawnMob('germ'); else if (nC < 3) spawnMob('beast'); }
  for (let i = SP.mobs.length - 1; i >= 0; i--) { const m = SP.mobs[i], g = m.g, q = g.position;
    if (m.dead) { m.dead += dt; g.scale.multiplyScalar(1 + dt * 3); g.traverse(o => { if (o.material && 'opacity' in o.material) { o.material.transparent = true; o.material.opacity = Math.max(0, 1 - m.dead * 2.5); } }); if (m.dead > .45) { SP.g.remove(g); SP.mobs.splice(i, 1); } continue; }
    if (m.__frz > 0) continue;   // ❄️ donmuş
    const dx = lp.x - q.x, dy = lp.y - q.y, dz = lp.z - q.z, d = Math.hypot(dx, dy, dz) || 1, sp = m.kind === 'germ' ? (m.small ? 4.6 : 3.4) : 2.2, want = m.kind === 'germ' ? .9 : 9;
    if (d > want) m.vel.lerp(new T.Vector3(dx / d * sp, dy / d * sp, dz / d * sp), Math.min(1, dt * 1.8)); else m.vel.multiplyScalar(Math.exp(-3 * dt));
    for (const o of SP.mobs) if (o !== m && !o.dead) { const ox = q.x - o.g.position.x, oy = q.y - o.g.position.y, oz = q.z - o.g.position.z, od = Math.hypot(ox, oy, oz); if (od < 2.4 && od > .01) m.vel.add(new T.Vector3(ox, oy, oz).multiplyScalar(dt * 6 / od)); }
    q.addScaledVector(m.vel, dt); if (d > 140) { q.set(lp.x + R(-30, 30), lp.y + R(2, 8), lp.z + R(-30, 30)); }
    g.lookAt(CX + lp.x, lp.y, CZ + lp.z); g.rotation.z += Math.sin(t * 3 + m.ph) * .002; m.hurt = Math.max(0, m.hurt - dt);
    const wob = 1 + Math.sin(t * 6 + m.ph) * .06; g.scale.set(m.sc * wob, m.sc / wob, m.sc * wob); if (m.hurt > 0) g.position.x += Math.sin(t * 60) * .05;
    if (g.userData.spin) g.userData.spin.rotation.y += dt * 2; if (g.userData.ring) { g.userData.ring.rotation.z += dt * 1.5; g.userData.tent.forEach((tg, k) => { tg.rotation.x = Math.sin(t * 2.5 + k) * .45; tg.rotation.z = Math.cos(t * 2 + k * 1.3) * .3; }); }
    g.userData.hb.scale.x = 1.6 * Math.max(0, m.hp / m.max) / m.sc; g.userData.hb.visible = m.hp < m.max;
    m.cd -= dt;
    if (m.kind === 'germ' && d < 1.8 * m.sc + .6 && m.cd <= 0) { m.cd = 1.1; dmg(m.small ? 4 : 7); snd('bite'); }
    if (m.kind === 'beast' && d < 32 && m.cd <= 0) { m.cd = R(2.2, 3.4); const o = q.clone(), v = new T.Vector3(dx, dy, dz).normalize().multiplyScalar(13); const b = new T.Mesh(new T.SphereGeometry(.42, 12, 10), new T.MeshBasicMaterial({ color: 0xff4df0, fog: false })); b.position.copy(o).addScaledVector(v, .14); SP.g.add(b);
      const gl = new T.Sprite(new T.SpriteMaterial({ map: glowTex('rgba(255,140,255,1)', 'rgba(200,60,255,.4)'), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false })); gl.scale.set(2.4, 2.4, 1); b.add(gl); SP.shots.push({ m: b, v, t: 0 }); snd('zap'); }
  }
  for (let i = SP.shots.length - 1; i >= 0; i--) { const s = SP.shots[i]; s.t += dt; s.m.position.addScaledVector(s.v, dt); if (s.m.position.distanceTo(lp) < 1.1) { dmg(10); s.t = 9; } if (s.t > 4) { SP.g.remove(s.m); SP.shots.splice(i, 1); } }
}
function hurtMob(m, v, dir, knock) {
  if (m.dead) return; m.hp -= v; m.hurt = .2; if (dir) m.vel.addScaledVector(dir, (knock || 3) / (m.kind === 'germ' ? 1 : 2.5)); snd('pop', .5);
  for (let k = 0; k < 6; k++) G.spawnDust(CX + m.g.position.x, m.g.position.y, CZ + m.g.position.z, .5, 1.2, 0, 0, m.kind === 'germ' ? 0x9dff8a : 0xd59bff);
  if (m.hp <= 0) { m.dead = .001; SP.kills++; G.progAdd(m.kind === 'germ' ? (m.small ? 1 : 3) : 10, new T.Vector3(CX + m.g.position.x, m.g.position.y, CZ + m.g.position.z)); snd(m.kind === 'germ' ? 'splat' : 'boom');
    if (m.kind === 'germ' && !m.small) for (let k = 0; k < 2; k++) spawnMob('germ', m.g.position, true);   // büyük mikrop ikiye bölünür
    for (let k = 0; k < 16; k++) G.spawnDust(CX + m.g.position.x, m.g.position.y, CZ + m.g.position.z, 1.2, 2.2, 0, 0, m.kind === 'germ' ? 0x7cff6b : 0xffe066); }
}
function alive() { return SP.mobs.filter(m => !m.dead); }
function attack(dir) {   // 👊 yumruk / tekme
  if (!on()) return false; const P = G.player.position; let hit = false;
  for (const m of alive()) { const q = m.g.position, dx = q.x - (P.x - CX), dy = q.y - (P.y + 1.1), dz = q.z - (P.z - CZ), d = Math.hypot(dx, dy, dz); if (d > 2.4 + m.sc * 1.2) continue; if (Math.hypot(dx, dz) > 1 && (dx * dir.x + dz * dir.z) / Math.hypot(dx, dz) < .3) continue;
    hurtMob(m, G.giant ? 999 : 22, new T.Vector3(dx, dy * .3, dz).normalize(), 6); hit = true; }
  return hit;
}
function ray(o, d, best, v) {   // 🔫 mermi
  let bt = null, bm = null; for (const m of alive()) { const c = tv.set(CX + m.g.position.x, m.g.position.y, CZ + m.g.position.z), oc = new T.Vector3().subVectors(o, c), b = oc.dot(d), r = (m.kind === 'germ' ? 1.1 : 1.7) * m.sc, cc = oc.lengthSq() - r * r, D = b * b - cc; if (D < 0) continue; const t = -b - Math.sqrt(D); if (t < 0 || t >= best || (bt !== null && t >= bt)) continue; bt = t; bm = m; }
  if (!bm) return null; hurtMob(bm, v, d.clone().setY(0).normalize(), 2); return bt;
}
function targets() { return alive().map(m => ({ id: m, p: new T.Vector3(CX + m.g.position.x, m.g.position.y - 1 * m.sc, CZ + m.g.position.z), h: 2 * m.sc, r: (m.kind === 'germ' ? 1.1 : 1.7) * m.sc, hit: (v, dir, k) => hurtMob(m, v, dir, k), set: (x, y, z) => m.g.position.set(x - CX, y + 1 * m.sc, z - CZ) })); }

/* ---------- ❤️ hasar: canın biterse ana kayada uyanırsın ---------- */
function dmg(v) {
  if (G.dead || G.teleporting || SP.inv > 0 || G.elapsed - SP.lastHit < .5) return; if (G.ADM && (G.ADM.god || G.ADM.bubbleShield)) return; if (window.__cos && __cos.blocks && __cos.blocks()) return;
  SP.lastHit = G.elapsed; G.hurtFlash = .8; G.shake = Math.max(G.shake, .2); G.play('hit'); const hp = G.hp - v; if (hp > 0) { G.hp = hp; return; }
  G.hp = Math.round(G.HPMAX * .6); SP.inv = 2.5; respawn(); G.showMsg('💫 ' + adT('Bayıldın! Ana kayada uyandın'), 2.2);
}
function respawn() { const p = G.player.position; p.set(CX + R(-3, 3), SP.top0 + .2, CZ + R(-3, 3)); G.vel.set(0, 0, 0); G.vy = 0; }

/* ---------- ⏱️ her kare ---------- */
function tick(dt) {
  btnTick(dt);
  if (!on()) { if (SP.on) leave(); return; }
  if (!SP.built) return; ui(); if (!dt) return;
  const t = G.elapsed, cam = G.camera.position, lc = tv.copy(cam).sub(SP.g.position), lcx = lc.x, lcy = lc.y, lcz = lc.z; U.uTime.value = t;
  SP.sky.position.copy(lc); const F = SP.flow; SP.inv = Math.max(0, SP.inv - dt);
  { const p = SP.stars.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i) - F.x * dt * .35, y = p.getY(i) - F.y * dt * .35, z = p.getZ(i) - F.z * dt * .35; if (x * x + y * y + z * z > 420 * 420) { x = -x * .98; y = -y * .98; z = -z * .98; } p.setXYZ(i, x, y, z); } p.needsUpdate = true; SP.stars.position.set(lcx, lcy, lcz); }
  { const p = SP.dust.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i) - F.x * dt, y = p.getY(i) - F.y * dt, z = p.getZ(i) - F.z * dt; x = ((x + 40) % 80 + 80) % 80 - 40; y = ((y + 40) % 80 + 80) % 80 - 40; z = ((z + 40) % 80 + 80) % 80 - 40; p.setXYZ(i, x, y, z); } p.needsUpdate = true; SP.dust.position.set(lcx, lcy, lcz); }
  SP.astD.forEach((a, i) => { a.p.addScaledVector(F, -dt * a.v); for (const k of ['x', 'y', 'z']) { const L = k === 'y' ? 120 : 260; if (a.p[k] < -L) a.p[k] += 2 * L; else if (a.p[k] > L) a.p[k] -= 2 * L; } a.r.x += a.w.x * dt; a.r.y += a.w.y * dt; a.r.z += a.w.z * dt;
    dmy.position.copy(a.p); if (Math.hypot(a.p.x, a.p.z) < 190 && Math.abs(a.p.y - SP.top0) < 40) dmy.position.y = SP.top0 + (a.p.y > SP.top0 ? 60 : -60) + a.p.y * .2; dmy.rotation.copy(a.r); dmy.scale.setScalar(a.s); dmy.updateMatrix(); SP.ast.setMatrixAt(i, dmy.matrix); }); SP.ast.instanceMatrix.needsUpdate = true;
  SP.pm.rotation.y += dt * .03; SP.bp.rotation.y += dt * .05; SP.gal.rotateZ(dt * .01);
  for (const m of SP.mand) m.rotateZ(dt * .04); for (const w of SP.wire) { w.rotation.x += dt * w.userData.s; w.rotation.y += dt * w.userData.s * .7; }
  for (const o of [SP.planet, SP.bp, SP.moon, SP.gal, SP.far[0], ...SP.mand, ...SP.wire]) { if (!o.userData.base) o.userData.base = o.position.clone(); }
  for (const o of [SP.planet, SP.bp, SP.gal, SP.far[0], ...SP.mand, ...SP.wire]) o.position.set(o.userData.base.x + lcx, o.userData.base.y + lcy, o.userData.base.z + lcz);
  SP.moon.position.set(-300 + Math.cos(t * .05) * 60 + lcx, -60 + Math.sin(t * .03) * 12 + lcy, 220 + Math.sin(t * .05) * 60 + lcz);
  SP.stT = (SP.stT || 3) - dt; if (SP.stT <= 0) { SP.stT = R(2.5, 7); const s = SP.shoot.find(x => !x.m.visible); if (s) { const a = R(0, 6.28); s.p0 = new T.Vector3(Math.cos(a) * 200, R(40, 140), Math.sin(a) * 200); s.v.set(-Math.cos(a) * R(140, 220), -R(20, 60), -Math.sin(a) * R(140, 220) + R(-60, 60)); s.t = 0; s.m.visible = true; snd('star', .7); } }
  for (const s of SP.shoot) if (s.m.visible) { s.t += dt; s.m.position.set(s.p0.x + s.v.x * s.t + lcx, s.p0.y + s.v.y * s.t + lcy, s.p0.z + s.v.z * s.t + lcz); s.m.lookAt(G.camera.position); s.m.rotateZ(Math.atan2(-s.v.y, Math.hypot(s.v.x, s.v.z))); s.m.material.opacity = Math.max(0, 1 - s.t / 1.4); if (s.t > 1.4) s.m.visible = false; }
  mobTick(dt, t);
  const P = G.player.position; if (P.y < SP.top0 - 70) { respawn(); G.showMsg('🌌 ' + adT('Boşluğa düştün! Ana kayaya döndün'), 2); }
  if (G.elapsed - SP.lastHit > 6 && G.hp < G.HPMAX && !G.dead) G.hp = Math.min(G.HPMAX, G.hp + dt * 3);
}

/* ---------- 🖥️ arayüz: tek düğme Çık ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>#spHud{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top));transform:translateX(-50%);z-index:8;display:none;gap:7px;align-items:center;font:700 13px system-ui;color:#fff;white-space:nowrap}
#spHud .pill{background:rgba(20,10,45,.7);border-radius:12px;padding:6px 10px;border:1px solid rgba(190,170,255,.4)}#spHud .bar{width:70px;height:8px;border-radius:5px;background:rgba(255,255,255,.15);display:inline-block;vertical-align:middle;margin-left:6px;overflow:hidden}#spHud .bar i{display:block;height:100%;background:linear-gradient(90deg,#d62828,#ff6b6b)}
#spExit{padding:7px 16px;border-radius:14px;border:2px solid rgba(190,170,255,.6);background:rgba(20,10,45,.75);color:#fff;font:800 14px system-ui;cursor:pointer}</style>`);
document.body.insertAdjacentHTML('beforeend', `<div id="spHud"><div class="pill">🌌 ${adT('Uzay')}</div><div class="pill">❤️<span class="bar"><i id="spHp"></i></span></div><div class="pill" id="spKills">👾 0</div><button id="spExit">🚪 ${adT('Çık')}</button></div>`);
for (const ev of ['pointerdown', 'mousedown', 'touchstart']) $('spExit').addEventListener(ev, e => e.stopPropagation(), { passive: true });
$('spExit').addEventListener('click', e => { e.stopPropagation(); goHome(); });
function ui() { const s = on() && !G.paused && !G.photoMode; $('spHud').style.display = s ? 'flex' : 'none'; if (!s) return; $('spHp').style.width = Math.max(0, Math.min(100, G.hp / G.HPMAX * 100)) + '%'; $('spKills').textContent = `👾 ${SP.kills}`; }

/* ---------- 🔴 köy meydanındaki uzay düğmesi ---------- */
const BTN = { x: -13, z: 0, y: null, g: null };
function btnBuild() {
  const g = new T.Group(); BTN.g = g; G.scene.add(g); let y = 0;
  try { const rc = new T.Raycaster(new T.Vector3(BTN.x, 200, BTN.z), new T.Vector3(0, -1, 0)); const h = G.ground && rc.intersectObject(G.ground, true)[0]; if (h) y = h.point.y; } catch (e) {} BTN.y = y; g.position.set(BTN.x, y, BTN.z);
  const metal = new T.MeshStandardMaterial({ color: 0x2b2f45, metalness: .6, roughness: .4 }), trim = new T.MeshStandardMaterial({ color: 0x8b7cff, emissive: 0x4b3bbf, emissiveIntensity: .6, metalness: .3, roughness: .4 });
  const base = new T.Mesh(new T.CylinderGeometry(1.4, 1.7, .35, 24), metal); base.position.y = .17; g.add(base);
  const col = new T.Mesh(new T.CylinderGeometry(.42, .55, 1.1, 16), metal); col.position.y = .9; g.add(col);
  const ring = new T.Mesh(new T.TorusGeometry(.62, .06, 8, 28), trim); ring.rotation.x = Math.PI / 2; ring.position.y = 1.47; g.add(ring);
  const top = new T.Mesh(new T.CylinderGeometry(.68, .6, .18, 24), metal); top.position.y = 1.5; g.add(top);
  BTN.dome = new T.Mesh(new T.SphereGeometry(.45, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0xff3b6b, emissive: 0xff1f5a, emissiveIntensity: .9, roughness: .25 })); BTN.dome.position.y = 1.58; g.add(BTN.dome);
  BTN.glow = new T.Sprite(new T.SpriteMaterial({ map: glowTex('rgba(255,120,200,1)', 'rgba(160,120,255,.35)'), transparent: true, depthWrite: false, blending: T.AdditiveBlending })); BTN.glow.scale.set(2.6, 2.6, 1); BTN.glow.position.y = 1.75; g.add(BTN.glow);
  const sc = canvasTex(512, 160, (c, W, H) => { const gr = c.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#1b1046'); gr.addColorStop(1, '#3b1d6e'); c.fillStyle = gr; c.fillRect(0, 0, W, H); for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,255,255,${Math.random()})`; c.fillRect(Math.random() * W, Math.random() * H, 2, 2); } c.strokeStyle = '#b39dff'; c.lineWidth = 8; c.strokeRect(4, 4, W - 8, H - 8); c.fillStyle = '#fff'; c.font = 'bold 72px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🚀 UZAY', W / 2, H / 2 + 4); });
  for (const s of [-1, 1]) { const p = new T.Mesh(new T.BoxGeometry(.14, 3, .14), metal); p.position.set(s * 1.3, 1.5, -.9); g.add(p); }
  const sign = new T.Mesh(new T.PlaneGeometry(2.6, .8), new T.MeshBasicMaterial({ map: sc })); sign.position.set(0, 2.85, -.88); g.add(sign); const sign2 = sign.clone(); sign2.rotation.y = Math.PI; sign2.position.z = -.92; g.add(sign2); g.rotation.y = -Math.PI / 2;
  G.obstacles.push({ x: BTN.x, z: BTN.z, r: .7, h: 1.6, top: 1.6, stand: false, pass: false });
}
function btnTick(dt) {
  if (G.curKey !== 'hub') { if (BTN.g) BTN.g.visible = false; return; }
  if (!BTN.g) { try { btnBuild(); } catch (e) { console.warn('uzay düğmesi', e); BTN.g = new T.Group(); } }
  BTN.g.visible = true; BTN.pr = Math.max(0, (BTN.pr || 0) - dt);
  if (BTN.dome) { const k = .8 + Math.sin(G.elapsed * 3) * .25; BTN.dome.material.emissiveIntensity = k; BTN.glow.material.opacity = .5 + Math.sin(G.elapsed * 3) * .2; BTN.dome.position.y = 1.58 - (BTN.pr > 0 ? .1 : 0); }
}
function prompt() {
  if (G.curKey !== 'hub' || !BTN.g) return null; const p = G.player.position; if (Math.hypot(p.x - BTN.x, p.z - BTN.z) > 2.6) return null;
  return [(G.touchMode ? '👆 ' : 'V — ') + '🚀 ' + adT('Düğmeye bas: uzaya git'), () => { BTN.pr = .4; G.play('ui'); setTimeout(open, 350); }];
}

/* ---------- 🗺️ giriş / çıkış ---------- */
function area() {
  if (!on()) { leave(); return; }
  build(); if (!SP.rocks.length) buildRocks(); if (!SP.g.parent) G.scene.add(SP.g); SP.g.position.set(CX, 0, CZ);
  for (const o of SP.obs) if (!G.obstacles.includes(o)) G.obstacles.push(o);
  respawn(); SP.on = true; hum(true); SP.spT = 2;
  setTimeout(() => { if (on()) G.showMsg('🌌 ' + adT('Uzaydasın! Kayalarda zıpla, mikropları ve kozmik yaratıkları yen'), 3.5); }, 900);
}
function leave() { if (SP.g.parent) G.scene.remove(SP.g); for (const o of SP.obs) { const i = G.obstacles.indexOf(o); if (i >= 0) G.obstacles.splice(i, 1); } for (const m of SP.mobs) SP.g.remove(m.g); SP.mobs = []; for (const s of SP.shots) SP.g.remove(s.m); SP.shots = []; SP.on = false; hum(false); ui(); }
function open() { const busy = G.admBusy && G.admBusy(); if (busy) { G.showMsg(busy, 1.8); return; } G.teleportTo('space', CX, CZ, 0, '🌌 ' + adT('Uzaya çıktın!')); }
function goHome() { G.teleportTo('hub', BTN.x + 2.6, BTN.z, Math.PI / 2, adT('🏡 Köye döndün')); }

/* ---------- 🛠️ admin ---------- */
try {
  const cat = ['🌌 Uzay', '🌌 Space', [
    ['spc_go', '🚀', 'Uzaya git', 'Go to space', () => { open(); return '🚀'; }],
    ['spc_clear', '💥', 'Uzay canavarlarını yok et', 'Clear space monsters', () => { for (const m of alive()) hurtMob(m, 9999); return '💥'; }],
    ['spc_beast', '👁️', 'Kozmik yaratık çağır', 'Spawn cosmic beast', () => { if (!on()) return adT('🌌 Önce uzaya git'); spawnMob('beast'); return '👁️'; }],
  ]];
  if (G.ADM_LIST && G.ADM_F) { G.ADM_LIST.splice(1, 0, cat); for (const [id, ic, tr, en, fn] of cat[2]) G.ADM_F[id] = { id, ic, tr, en, fn }; }
} catch (e) { console.warn('uzay admin', e); }

window.__spc = { tick, area, open, prompt, attack, ray, targets, skyMat, ground, SP, BTN, groundHere };
})(window.__sftG);
