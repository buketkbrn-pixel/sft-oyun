/* 🌌 S.F.T · Uzay (space.js) — köyde AVM'nin arkasındaki düğmeye basınca uzaya çıkılır.
   Kozmik desenler, bulutsular, gezegenler, sarmal gökada, dönen geometrik ışık desenleri, asteroitler, kayan yıldızlar.
   Oyuncu hiçbir kontrol olmadan boşlukta süzülür ve yavaşça döner. Tek düğme: Çık. Alttaki kutuya yazdığın yazı uzaya yazılır.
   index.html bunu yükler; oyunun değişkenlerine window.__sftG (G) ile erişir. Tasarımlar bu oyuna özgüdür. */
(function (G) {
'use strict';
const T = G.THREE, $ = id => document.getElementById(id), adT = s => G.adT(s);
const CX = -45000, CZ = -45000, Y0 = 60;
G.AREAS.space = { cx: CX, cz: CZ, r: 60, bg: 0x03020c, fog: [8000, 9000], sky: 0x7a6ad8, gnd: 0x1a1430, sunC: 0xfff0e0, sunI: 1.6 };
G.LOAD_NAMES.space = 'Uzay';
const SP = { g: new T.Group(), built: false, on: false, flow: new T.Vector3(2.2, .3, .8), ax: 0, ay: 0, az: 0, off: new T.Vector3(), texts: [], typ: null, sky: null };
SP.g.name = 'spaceRoot';
const U = { uTime: { value: 0 } };
const R = (a, b) => a + Math.random() * (b - a);
const tv = new T.Vector3(), tq = new T.Quaternion(), dmy = new T.Object3D();
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; }

/* ---------- 🔊 uzay sesleri: derin uğultu, yazı tıkırtısı, kayan yıldız ---------- */
function ac() { if (!SP.ac) { try { SP.ac = new (window.AudioContext || window.webkitAudioContext)(); SP.out = SP.ac.createGain(); SP.out.gain.value = .5; SP.out.connect(SP.ac.destination); } catch (e) { return null; } } if (SP.ac.state === 'suspended') SP.ac.resume().catch(() => {}); return SP.ac; }
for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, () => { if (SP.ac && SP.ac.state === 'suspended') SP.ac.resume().catch(() => {}); }, { passive: true });
function snd(kind, vol = 1) {
  const c = ac(); if (!c || c.state !== 'running' || !SP.on) return; const t = c.currentTime, g = c.createGain(); g.connect(SP.out);
  if (kind === 'key') { const o = c.createOscillator(); o.type = 'square'; o.frequency.value = 900 + Math.random() * 300; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 600; g.gain.setValueAtTime(.06 * vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .04); o.connect(f).connect(g); o.start(t); o.stop(t + .05); }
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

/* ---------- 🧑‍🚀 süzülme: kontrol yok, oyuncu yerinde yavaşça döner, evren akar ---------- */
function on() { return G.curKey === 'space'; }
function Y() { return Y0 + SP.off.y; }
function drift() { G.vel.set(0, 0, 0); const p = G.player.position; p.x = CX + SP.off.x; p.z = CZ + SP.off.z; }
function pose(r, dt, custom) {
  if (!on()) return; const ch = G.charHolder, t = G.elapsed;
  SP.ax += dt * .32; SP.ay += dt * .11; SP.az += dt * .19;
  ch.rotation.set(SP.ax, G.facing + SP.ay, SP.az, 'YXZ'); tv.set(0, 1, 0).applyEuler(ch.rotation); ch.position.set(-tv.x, 1 - tv.y, -tv.z);
  if (custom || !r) return; const k = 1 - Math.exp(-4 * dt), S = (o, ax, v) => { o.rotation[ax] += (v - o.rotation[ax]) * k; }, a = Math.sin(t * .9), b = Math.sin(t * .7 + 1);
  S(r.armL.sh, 'z', 1.15 + a * .25); S(r.armR.sh, 'z', -1.05 - b * .3); S(r.armL.sh, 'x', -.3 + b * .2); S(r.armR.sh, 'x', .2 + a * .2); S(r.armL.el, 'x', -.5 - a * .2); S(r.armR.el, 'x', -.3 + b * .2);
  S(r.legL.hip, 'x', -.5 + a * .2); S(r.legR.hip, 'x', .15 - b * .2); S(r.legL.hip, 'z', .25); S(r.legR.hip, 'z', -.15); S(r.legL.kn, 'x', .9 + b * .2); S(r.legR.kn, 'x', .35 + a * .2);
  S(r.torso, 'x', .1); S(r.neck, 'x', -.2 + a * .1); r.hips.position.y += (1 - r.hips.position.y) * k;
}
function resetHolder() { const ch = G.charHolder; if (!ch) return; ch.rotation.order = 'XYZ'; ch.rotation.z = 0; }

/* ---------- ✏️ uzaya yazı ---------- */
function textSprite(s) {
  const f = 64, c = document.createElement('canvas'), g0 = c.getContext('2d'); g0.font = `bold ${f}px system-ui, sans-serif`; const w = Math.min(2048, Math.ceil(g0.measureText(s).width) + 80); c.width = w; c.height = 128;
  const g = c.getContext('2d'); g.font = `bold ${f}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#b39dff'; g.shadowBlur = 24; g.fillStyle = '#ffffff'; g.fillText(s, w / 2, 66); g.shadowBlur = 8; g.fillText(s, w / 2, 66);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; const sp = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false })); sp.scale.set(w / 128 * 3, 3, 1); return sp;
}
function writeText(s) {
  s = String(s || '').trim().slice(0, 80); if (!s) return; try { localStorage.setItem('sftUzayYazi', s); } catch (e) {}
  typeText(s);
  const sp = textSprite(s), cam = G.camera; cam.getWorldDirection(tv); sp.position.copy(cam.position).addScaledVector(tv, 26).sub(SP.g.position); SP.g.add(sp); SP.texts.push({ sp, t: 0 });
  while (SP.texts.length > 12) { const o = SP.texts.shift(); SP.g.remove(o.sp); o.sp.material.map.dispose(); o.sp.material.dispose(); }
}
function typeText(s) { SP.typ = { s, i: 0, t: 0, hold: 0 }; const el = $('spType'); el.textContent = ''; el.style.opacity = 1; el.style.display = 'block'; }

/* ---------- ⏱️ her kare ---------- */
function tick(dt) {
  btnTick(dt);
  if (!on()) { if (SP.on) leave(); return; }
  if (!SP.built) return; ui(); if (!dt) return;
  const t = G.elapsed, cam = G.camera.position, lc = tv.copy(cam).sub(SP.g.position); U.uTime.value = t;
  SP.sky.position.copy(lc);
  const F = SP.flow;
  // evren akar (oyuncu süzülüyormuş gibi)
  { const p = SP.stars.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i) - F.x * dt * .35, y = p.getY(i) - F.y * dt * .35, z = p.getZ(i) - F.z * dt * .35; if (x * x + y * y + z * z > 420 * 420) { x = -x * .98; y = -y * .98; z = -z * .98; } p.setXYZ(i, x, y, z); } p.needsUpdate = true; SP.stars.position.copy(lc); }
  { const p = SP.dust.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i) - F.x * dt, y = p.getY(i) - F.y * dt, z = p.getZ(i) - F.z * dt; x = ((x + 40) % 80 + 80) % 80 - 40; y = ((y + 40) % 80 + 80) % 80 - 40; z = ((z + 40) % 80 + 80) % 80 - 40; p.setXYZ(i, x, y, z); } p.needsUpdate = true; SP.dust.position.copy(lc); }
  SP.astD.forEach((a, i) => { a.p.addScaledVector(F, -dt * a.v); for (const k of ['x', 'y', 'z']) { const L = k === 'y' ? 60 : 120; if (a.p[k] < -L) a.p[k] += 2 * L; else if (a.p[k] > L) a.p[k] -= 2 * L; } a.r.x += a.w.x * dt; a.r.y += a.w.y * dt; a.r.z += a.w.z * dt;
    dmy.position.copy(a.p).add(lc); if (dmy.position.distanceTo(lc) < 6 + a.s) dmy.position.addScaledVector(a.p.clone().normalize(), 8); dmy.rotation.copy(a.r); dmy.scale.setScalar(a.s); dmy.updateMatrix(); SP.ast.setMatrixAt(i, dmy.matrix); }); SP.ast.instanceMatrix.needsUpdate = true;
  for (const o of SP.texts) { o.t += dt; o.sp.position.addScaledVector(F, -dt * .8); o.sp.material.opacity = Math.max(0, Math.min(1, (120 - o.t) / 20)); }
  // gezegenler ve desenler döner
  SP.pm.rotation.y += dt * .03; SP.bp.rotation.y += dt * .05; SP.moon.position.set(-300 + Math.cos(t * .05) * 60, -60 + Math.sin(t * .03) * 12, 220 + Math.sin(t * .05) * 60); SP.gal.rotateZ(dt * .01);
  for (const m of SP.mand) m.rotateZ(dt * .04); for (const w of SP.wire) { w.rotation.x += dt * w.userData.s; w.rotation.y += dt * w.userData.s * .7; }
  for (const o of [SP.planet, SP.bp, SP.moon, SP.gal, SP.far[0], ...SP.mand, ...SP.wire]) { if (!o.userData.base) o.userData.base = o.position.clone(); }
  for (const o of [SP.planet, SP.bp, SP.gal, SP.far[0], ...SP.mand, ...SP.wire]) o.position.copy(o.userData.base).add(lc);
  SP.moon.position.add(lc);
  // 🌠 kayan yıldız
  SP.stT = (SP.stT || 3) - dt; if (SP.stT <= 0) { SP.stT = R(2.5, 7); const s = SP.shoot.find(x => !x.m.visible); if (s) { const a = R(0, 6.28), e = R(.2, .9); s.p0 = new T.Vector3(Math.cos(a) * 200, R(40, 140), Math.sin(a) * 200); s.v.set(-Math.cos(a) * R(140, 220), -R(20, 60), -Math.sin(a) * R(140, 220) + R(-60, 60)); s.t = 0; s.m.visible = true; snd('star', .7); } }
  for (const s of SP.shoot) if (s.m.visible) { s.t += dt; s.m.position.copy(s.p0).addScaledVector(s.v, s.t).add(lc); s.m.lookAt(G.camera.position); s.m.rotateZ(Math.atan2(-s.v.y, Math.hypot(s.v.x, s.v.z))); s.m.material.opacity = Math.max(0, 1 - s.t / 1.4); if (s.t > 1.4) s.m.visible = false; }
  // ⌨️ daktilo yazısı
  const ty = SP.typ; if (ty) { ty.t += dt; const el = $('spType'); if (ty.i < ty.s.length) { while (ty.t > .055 && ty.i < ty.s.length) { ty.t -= .055; ty.i++; if (ty.s[ty.i - 1] !== ' ') snd('key'); } el.textContent = ty.s.slice(0, ty.i); } else { ty.hold += dt; if (ty.hold > 5) el.style.opacity = Math.max(0, 1 - (ty.hold - 5) / 1.5); if (ty.hold > 6.6) { el.style.display = 'none'; SP.typ = null; } } }
}

/* ---------- 🖥️ arayüz: tek düğme Çık + yazı kutusu ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>#spExit{position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top));transform:translateX(-50%);z-index:8;display:none;padding:10px 22px;border-radius:16px;border:2px solid rgba(190,170,255,.6);background:rgba(20,10,45,.7);color:#fff;font:800 15px system-ui;cursor:pointer;backdrop-filter:blur(4px)}
#spIn{position:fixed;left:50%;bottom:calc(22px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:8;display:none;width:min(420px,82vw);padding:12px 16px;border-radius:16px;border:2px solid rgba(190,170,255,.5);background:rgba(15,8,35,.7);color:#fff;font:600 15px system-ui;outline:none;text-align:center}
#spIn::placeholder{color:rgba(220,210,255,.65)}#spType{position:fixed;left:50%;top:42%;transform:translate(-50%,-50%);z-index:7;display:none;max-width:88vw;color:#fff;font:700 clamp(20px,4.2vw,38px) system-ui;text-align:center;text-shadow:0 0 18px rgba(170,140,255,.9),0 2px 6px #000;pointer-events:none;letter-spacing:.5px;white-space:pre-wrap}</style>`);
document.body.insertAdjacentHTML('beforeend', `<button id="spExit">🚪 ${adT('Çık')}</button><input id="spIn" maxlength="80" enterkeyhint="send" autocomplete="off" placeholder="✏️ ${adT('Uzaya bir şey yaz, Enter’a bas')}"><div id="spType"></div>`);
for (const ev of ['pointerdown', 'mousedown', 'touchstart']) for (const id of ['spExit', 'spIn']) $(id).addEventListener(ev, e => e.stopPropagation(), { passive: true });
for (const ev of ['keydown', 'keyup', 'keypress']) $('spIn').addEventListener(ev, e => { e.stopPropagation(); if (ev === 'keydown' && e.key === 'Enter') { writeText($('spIn').value); $('spIn').value = ''; if (G.touchMode) $('spIn').blur(); } if (ev === 'keydown' && e.key === 'Escape') $('spIn').blur(); });
$('spExit').addEventListener('click', e => { e.stopPropagation(); goHome(); });
function ui() { const s = on() && !G.paused && !G.photoMode; $('spExit').style.display = s ? 'block' : 'none'; $('spIn').style.display = s ? 'block' : 'none'; if (!s) $('spType').style.display = 'none'; }
function key(code) { return on(); }   // uzayda tuşlar çalışmaz (yalnızca Çık düğmesi ve yazı kutusu)

/* ---------- 🔴 köyde AVM'nin arkasındaki uzay düğmesi ---------- */
const BTN = { x: 8, z: -210.2, y: null, g: null };
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
  const sign = new T.Mesh(new T.PlaneGeometry(2.6, .8), new T.MeshBasicMaterial({ map: sc })); sign.position.set(0, 2.85, -.88); g.add(sign); const sign2 = sign.clone(); sign2.rotation.y = Math.PI; sign2.position.z = -.92; g.add(sign2);
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
  build(); if (!SP.g.parent) G.scene.add(SP.g); SP.g.position.set(CX, 0, CZ);
  SP.off.set(R(-5, 5), R(-3, 3), R(-5, 5)); SP.ax = R(0, 1); SP.az = R(0, 1); SP.ay = 0;
  const p = G.player.position; p.set(CX + SP.off.x, Y(), CZ + SP.off.z); G.vy = 0; SP.on = true; hum(true);
  try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
  let last = ''; try { last = localStorage.getItem('sftUzayYazi') || ''; } catch (e) {}
  setTimeout(() => { if (on()) typeText(adT('Uzayın sessizliğinde süzülüyorsun…')); }, 1200);
  if (last) setTimeout(() => { if (on()) { const sp = textSprite(last); sp.position.set(R(-20, 20), Y0 + R(5, 15), -40); SP.g.add(sp); SP.texts.push({ sp, t: 0 }); } }, 1500);
}
function leave() { if (SP.g.parent) G.scene.remove(SP.g); if (SP.on) resetHolder(); SP.on = false; hum(false); ui(); $('spType').style.display = 'none'; SP.typ = null; }
function open() { const busy = G.admBusy && G.admBusy(); if (busy) { G.showMsg(busy, 1.8); return; } G.teleportTo('space', CX, CZ, 0, '🌌 ' + adT('Uzaya çıktın!')); }
function goHome() { G.teleportTo('hub', BTN.x, BTN.z - 2.8, 0, adT('🏡 Köye döndün')); }

/* ---------- 🛠️ admin ---------- */
try {
  const cat = ['🌌 Uzay', '🌌 Space', [
    ['spc_go', '🚀', 'Uzaya git', 'Go to space', () => { open(); return '🚀'; }],
    ['spc_fast', '💫', 'Daha hızlı süzül', 'Drift faster', () => { SP.flow.multiplyScalar(1.6); return '💫'; }],
    ['spc_slow', '🐢', 'Daha yavaş süzül', 'Drift slower', () => { SP.flow.multiplyScalar(.6); return '🐢'; }],
  ]];
  if (G.ADM_LIST && G.ADM_F) { G.ADM_LIST.splice(1, 0, cat); for (const [id, ic, tr, en, fn] of cat[2]) G.ADM_F[id] = { id, ic, tr, en, fn }; }
} catch (e) { console.warn('uzay admin', e); }

window.__spc = { tick, area, open, key, prompt, drift, pose, Y, SP, writeText, BTN };
})(window.__sftG);
