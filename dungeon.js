/* 🗝️ S.F.T · Zindan (dungeon.js) — maceracıdan gidilir. Numaralı kapılarla art arda gelen 40 oda: meşaleli koridorlar, parmaklıklı hücreler,
   sallanan zincirler, labirent, diken ve ok tuzakları, zifiri karanlık (🔥 çakmak), kol bulmacası, anahtar sandıkları, basınç plakaları,
   uyanan iskeletler ve sonda Kemik Kral. Her girişte odalar farklı dizilir (çok oyunculuda herkes aynı zindana girer).
   index.html bunu yükler; oyunun değişkenlerine window.__sftG (G) ile erişir. Tasarımlar bu oyuna özgüdür. */
(function (G) {
'use strict';
const T = G.THREE, $ = id => document.getElementById(id), adT = s => G.adT(s);
G.AREAS.dungeon = { cx: -36000, cz: 36000, r: 3000, bg: 0x030406, fog: [4, 34], sky: 0x8a90b0, gnd: 0x45434c, sunC: 0x7d8bb0, sunI: .15 };
G.LOAD_NAMES.dungeon = 'Zindan';
const A = () => G.AREAS.dungeon;
const NROOM = 39, WALLH = 6.2, TALL = 500;   // TALL: duvarlara tırmanılmasın
const DG = { g: new T.Group(), rooms: [], cur: -1, seed: 0, pend: 0, on: false, lighter: false, fuel: 100, light: null, torchL: [], boss: null, arrows: [], lastHit: -9, inv: 0, ac: null };
DG.g.name = 'dungeonRoot';
let RND = Math.random;
const mul32 = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const R = (a, b) => a + RND() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1)), PICK = L => L[Math.floor(RND() * L.length)];
const RP = L => L[Math.floor(Math.random() * L.length)];

/* ---------- 🔊 zindan sesleri (kendi ses motoru: zincir, gıcırtı, damla, kol, diken, ok, iskelet, kükreme, uğultu) ---------- */
function ac() { if (!DG.ac) { try { DG.ac = new (window.AudioContext || window.webkitAudioContext)(); DG.out = DG.ac.createGain(); DG.out.gain.value = .55; DG.out.connect(DG.ac.destination); } catch (e) { return null; } } if (DG.ac.state === 'suspended') DG.ac.resume().catch(() => {}); return DG.ac; }
function noiseBuf() { if (DG.nb) return DG.nb; const c = ac(), b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return DG.nb = b; }
function snd(kind, vol = 1, pan = 0) {
  const c = ac(); if (!c || c.state !== 'running') return; const t = c.currentTime;
  const out = c.createStereoPanner ? c.createStereoPanner() : c.createGain(); if (out.pan) out.pan.value = Math.max(-1, Math.min(1, pan)); out.connect(DG.out);
  const env = (g, a, d, v) => { g.gain.setValueAtTime(0, t + a); g.gain.linearRampToValueAtTime(v, t + a + .005); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); };
  const nz = (a, dur, type, f, q, v) => { const n = c.createBufferSource(); n.buffer = noiseBuf(); const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = c.createGain(); env(g, a, dur, v); n.connect(fl).connect(g).connect(out); n.start(t + a, Math.random() * .5); n.stop(t + a + dur + .05); };
  if (kind === 'chain') { const n = 4 + (Math.random() * 5 | 0); for (let i = 0; i < n; i++) { const a = i * (.05 + Math.random() * .1); nz(a, .12, 'bandpass', 2400 + Math.random() * 3200, 12, .5 * vol);
      const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = 1800 + Math.random() * 2800; const g2 = c.createGain(); env(g2, a, .28, .07 * vol); o.connect(g2).connect(out); o.start(t + a); o.stop(t + a + .32); } }
  else if (kind === 'creak') { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(115, t); o.frequency.linearRampToValueAtTime(68, t + .6); o.frequency.linearRampToValueAtTime(96, t + .95); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 620; f.Q.value = 6; const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.2 * vol, t + .08); g.gain.linearRampToValueAtTime(0, t + 1); o.connect(f).connect(g).connect(out); o.start(t); o.stop(t + 1.05); }
  else if (kind === 'drip') { const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(1300 + Math.random() * 700, t); o.frequency.exponentialRampToValueAtTime(380, t + .12); const g = c.createGain(); env(g, 0, .2, .12 * vol); o.connect(g).connect(out); o.start(t); o.stop(t + .22); }
  else if (kind === 'clunk') { const o = c.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(48, t + .16); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; const g = c.createGain(); env(g, 0, .26, .3 * vol); o.connect(f).connect(g).connect(out); o.start(t); o.stop(t + .3); nz(.02, .1, 'bandpass', 3000, 8, .25 * vol); }
  else if (kind === 'spike') { nz(0, .15, 'highpass', 3000, 1, .35 * vol); nz(.03, .1, 'bandpass', 5200, 10, .2 * vol); }
  else if (kind === 'rattle') { for (let i = 0; i < 7; i++) nz(i * .045, .05, 'bandpass', 900 + Math.random() * 900, 8, .4 * vol); }
  else if (kind === 'buzz') { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 90; const g = c.createGain(); env(g, 0, .35, .15 * vol); o.connect(g).connect(out); o.start(t); o.stop(t + .4); }
  else if (kind === 'arrow') { const n = c.createBufferSource(); n.buffer = noiseBuf(); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(800, t); f.frequency.exponentialRampToValueAtTime(3200, t + .2); f.Q.value = 3; const g = c.createGain(); env(g, 0, .25, .22 * vol); n.connect(f).connect(g).connect(out); n.start(t); n.stop(t + .3); }
  else if (kind === 'flick') { nz(0, .05, 'highpass', 4000, 1, .25 * vol); nz(.06, .3, 'lowpass', 700, 1, .18 * vol); }
  else if (kind === 'roar') { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(72, t); o.frequency.linearRampToValueAtTime(44, t + 1.2); const o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.value = 33; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520; const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.35 * vol, t + .1); g.gain.linearRampToValueAtTime(0, t + 1.3); o.connect(f); o2.connect(f); f.connect(g).connect(out); o.start(t); o2.start(t); o.stop(t + 1.35); o2.stop(t + 1.35); }
}
function droneOn(on) {
  const c = on ? ac() : DG.ac; if (!c) return;
  if (on && !DG.drone) { const g = c.createGain(); g.gain.value = 0; g.connect(DG.out); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 230; f.connect(g);
    const os = [55, 82.4, 55.7].map((fr, i) => { const o = c.createOscillator(); o.type = i === 1 ? 'triangle' : 'sine'; o.frequency.value = fr; o.connect(f); o.start(); return o; });
    g.gain.setValueAtTime(0, c.currentTime); g.gain.linearRampToValueAtTime(.03, c.currentTime + 2); DG.drone = { g, os }; }
  else if (!on && DG.drone) { const d = DG.drone; DG.drone = null; d.g.gain.cancelScheduledValues(c.currentTime); d.g.gain.setValueAtTime(d.g.gain.value, c.currentTime); d.g.gain.linearRampToValueAtTime(0, c.currentTime + .6); setTimeout(() => d.os.forEach(o => { try { o.stop(); } catch (e) {} }), 800); }
}
for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, () => { if (DG.ac && DG.ac.state === 'suspended') DG.ac.resume().catch(() => {}); }, { passive: true });

/* ---------- 🧱 malzemeler ---------- */
const TEX = {};
function ctex(key, w, h, draw) { if (TEX[key]) return TEX[key]; const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; return TEX[key] = t; }
const stoneTex = () => ctex('stone', 256, 256, (g, W) => { g.fillStyle = '#3a3a40'; g.fillRect(0, 0, W, W); for (let y = 0; y < 8; y++) for (let x = 0; x < 5; x++) { const o = (y % 2) * 26, l = 58 + Math.random() * 34; g.fillStyle = `rgb(${l},${l - 2},${l + 5})`; g.fillRect(x * 52 + o - 26 + 2, y * 32 + 2, 48, 28); }
  for (let i = 0; i < 1100; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .18})`; g.fillRect(Math.random() * W, Math.random() * W, 2, 2); } g.fillStyle = 'rgba(46,80,46,.22)'; for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(Math.random() * W, Math.random() * W, 3 + Math.random() * 9, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < 6; i++) { g.beginPath(); let x = Math.random() * W, y = Math.random() * W; g.moveTo(x, y); for (let k = 0; k < 4; k++) g.lineTo(x += (Math.random() - .5) * 30, y += Math.random() * 20); g.stroke(); } });
const floorTex = () => ctex('floor', 256, 256, (g, W) => { g.fillStyle = '#26262b'; g.fillRect(0, 0, W, W); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const l = 40 + Math.random() * 24; g.fillStyle = `rgb(${l},${l},${l + 4})`; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); } for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .22})`; g.fillRect(Math.random() * W, Math.random() * W, 2, 2); }
  g.fillStyle = 'rgba(20,30,40,.35)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(Math.random() * W, Math.random() * W, 8 + Math.random() * 18, 5 + Math.random() * 10, Math.random() * 3, 0, 7); g.fill(); } });
const woodTex = () => ctex('wood', 128, 256, (g, W, H) => { g.fillStyle = '#5a3a22'; g.fillRect(0, 0, W, H); for (let x = 0; x < 4; x++) { g.fillStyle = `rgba(0,0,0,${.15 + Math.random() * .15})`; g.fillRect(x * 32, 0, 2, H); } for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(30,15,5,.35)'; g.beginPath(); const x = Math.random() * W; g.moveTo(x, 0); g.bezierCurveTo(x + 6, H * .3, x - 6, H * .6, x + 3, H); g.stroke(); }
  g.fillStyle = '#2b2d33'; g.fillRect(0, 40, W, 14); g.fillRect(0, 200, W, 14); for (const y of [47, 207]) for (const x of [12, 64, 116]) { g.fillStyle = '#8d939c'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); } });
const glowTex = () => ctex('glow', 64, 64, (g, W) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,220,150,1)'); gr.addColorStop(.35, 'rgba(255,150,60,.5)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, W); });
let MAT = null;
function mats() {
  if (MAT) return MAT;
  MAT = { wall: new T.MeshStandardMaterial({ map: stoneTex(), roughness: .95 }), floor: new T.MeshStandardMaterial({ map: floorTex(), roughness: .9 }), ceil: new T.MeshStandardMaterial({ map: stoneTex(), color: 0x55555c, roughness: 1 }),
    iron: new T.MeshStandardMaterial({ color: 0x3b3f46, metalness: .7, roughness: .45 }), rust: new T.MeshStandardMaterial({ color: 0x5a3a2a, metalness: .5, roughness: .7 }), wood: new T.MeshStandardMaterial({ map: woodTex(), roughness: .8 }),
    flame: new T.MeshBasicMaterial({ color: 0xffa340 }), flame2: new T.MeshBasicMaterial({ color: 0xffe08a }), gold: new T.MeshStandardMaterial({ color: 0xd4a73a, metalness: .8, roughness: .3, emissive: 0x3a2a00 }),
    red: new T.MeshStandardMaterial({ color: 0xb3261e, emissive: 0x5a0000, roughness: .5 }), eye: new T.MeshBasicMaterial({ color: 0xff2a2a, fog: false }),
    halo: new T.SpriteMaterial({ map: glowTex(), color: 0xffb060, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: .55 }) };
  return MAT;
}
function uvBox(geo, w, h, d, s = 4) {   // duvar dokusu her boyutta aynı ölçüde kalsın (tek malzeme)
  const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / s, uv.getY(i) * dims[f][1] / s); }
  return geo;
}
const box = (g, w, h, d, m, x, y, z, tile) => { const geo = new T.BoxGeometry(w, h, d); if (tile) uvBox(geo, w, h, d, tile); const o = new T.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
const cyl = (g, r, h, m, x, y, z, s = 10) => { const o = new T.Mesh(new T.CylinderGeometry(r, r, h, s), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
function txtMat(s, fg = '#ffd166', bg = 'rgba(20,14,8,.85)', w = 256, h = 96, fs = .5) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = '#8d6b3a'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = fg; let f = h * fs | 0; g.font = `bold ${f}px Georgia, serif`; while (g.measureText(s).width > w - 24 && f > 10) { f -= 2; g.font = `bold ${f}px Georgia, serif`; } g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, w / 2, h / 2 + 2);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; const m = new T.MeshBasicMaterial({ map: t, transparent: true }); m.userData.own = true; return m; }

/* ---------- 🗺️ oda planı ---------- */
const TYPES = ['hall', 'jail', 'maze', 'traps', 'dark', 'lever', 'key', 'plates', 'skel'];
const TNAME = { start: 'Giriş', hall: 'Meşaleli koridor', jail: 'Zindan hücreleri', maze: 'Labirent', traps: 'Tuzak koridoru', dark: 'Zifiri karanlık', lever: 'Kol bulmacası', key: 'Anahtar odası', plates: 'Basınç plakaları', skel: 'İskelet odası', boss: 'Kemik Kral' };
const LOCKMSG = { lever: 'Kapı kilitli — kolları duvardaki sırayla çek', key: 'Kapı kilitli — sandıklardan anahtarı bul', plates: 'Kapı kilitli — bütün plakalar aynı anda yanmalı', skel: 'Kapı kilitli — bütün iskeletleri yen', boss: 'Kemik Kral’ı yen' };
function plan(seed) {
  RND = mul32(seed); const L = []; let z = 0, last = '', pdx = 0, bag = [];
  for (let i = 0; i <= NROOM; i++) {
    let type = i === 0 ? 'start' : i === NROOM ? 'boss' : null;
    if (!type) { if (!bag.length) bag = TYPES.slice().sort(() => RND() - .5); let k = bag.findIndex(t => t !== last && !(i < 3 && (t === 'skel' || t === 'dark' || t === 'traps'))); if (k < 0) k = 0; type = bag.splice(k, 1)[0]; }
    last = type; let w, l;
    if (type === 'maze') { w = 32; l = 34; } else if (type === 'boss') { w = 38; l = 40; } else if (type === 'traps') { w = 12; l = 38; } else if (type === 'start') { w = 16; l = 18; }
    else if (type === 'jail' || type === 'hall') { w = 11 + RI(0, 3); l = 30 + RI(0, 3) * 4.55; } else { w = 17 + RI(0, 6); l = 20 + RI(0, 9); }
    if (w / 2 < Math.abs(pdx) + 1.8) w = 2 * (Math.abs(pdx) + 1.8);
    const doorX = ['maze', 'boss', 'traps', 'jail'].includes(type) ? 0 : RI(-1, 1) * Math.floor(w / 4);
    L.push({ i, type, w, l, z0: z, z1: z + l, doorX, pdx, seed: (seed * 31 + i * 977) | 0, built: false, solved: !['lever', 'key', 'plates', 'skel', 'boss'].includes(type) });
    pdx = doorX; z += l;
  }
  for (let i = 0; i < L.length; i++) L[i].bw = i < NROOM ? Math.max(L[i].w, L[i + 1].w) : L[i].w;
  return L;
}

/* ---------- 🏗️ oda kurma ---------- */
function wallOb(rm, x, z, hx, hz, top = TALL) { const a = A(), o = { x: a.cx + x, z: a.cz + z, box: true, hx, hz, r: Math.hypot(hx, hz), h: top, top, stand: false, pass: false, dg: true }; G.obstacles.push(o); rm.obs.push(o); return o; }
function wall(rm, g, x, z, w, d, h = WALLH, top = TALL) { box(g, w, h, d, mats().wall, x, h / 2, z, 4); wallOb(rm, x, z, w / 2, d / 2, top); }
function torch(rm, g, x, y, z, ry) {
  const M = mats(), t = new T.Group(); t.position.set(x, y, z); t.rotation.y = ry; g.add(t);
  box(t, .1, .1, .3, M.iron, 0, -.1, .1); box(t, .14, .5, .14, M.wood, 0, .05, .22); const cup = cyl(t, .1, .12, M.iron, 0, .3, .22, 8);
  const f = new T.Mesh(new T.ConeGeometry(.11, .38, 7), M.flame); f.position.set(0, .52, .22); t.add(f); const f2 = new T.Mesh(new T.ConeGeometry(.055, .22, 6), M.flame2); f2.position.set(0, .45, .22); t.add(f2);
  const h = new T.Sprite(M.halo); h.scale.set(1.3, 1.3, 1); h.position.set(0, .5, .22); t.add(h);
  const a = A(), wp = new T.Vector3(.0, .55, .45).applyAxisAngle(new T.Vector3(0, 1, 0), ry); rm.torches.push({ f, f2, h, p: new T.Vector3(a.cx + x + wp.x, y + wp.y, a.cz + z + wp.z), ph: Math.random() * 6 });
}
function chain(rm, g, x, z, len, top = WALLH) {
  const M = mats(), c = new T.Group(); c.position.set(x, top, z); g.add(c); const lk = new T.TorusGeometry(.07, .022, 5, 10);
  for (let i = 0; i < len; i++) { const l = new T.Mesh(lk, i % 5 === 3 ? M.rust : M.iron); l.position.y = -.12 - i * .13; l.rotation.y = i % 2 ? Math.PI / 2 : 0; c.add(l); }
  const r = RND(); if (r < .45) { const hk = new T.Mesh(new T.TorusGeometry(.12, .03, 6, 12, Math.PI * 1.4), M.iron); hk.position.y = -.22 - len * .13; hk.rotation.z = 2.4; c.add(hk); }
  else if (r < .7) { const cf = new T.Mesh(new T.TorusGeometry(.11, .035, 6, 14), M.rust); cf.position.y = -.24 - len * .13; c.add(cf); }
  rm.chains.push({ c, ph: Math.random() * 6, p: new T.Vector3(A().cx + x, top - len * .13, A().cz + z) });
}
function skelDecor(g, x, z, ry, pose) {   // süs iskelet (oturan / yatan)
  try { const r = G.makeThemeRig('skeleton'); r.stick.visible = true; r.stick.userData.rig = true; r.stick.position.set(x, 0, z); r.stick.rotation.y = ry;
    if (pose === 'lie') { r.stick.rotation.order = 'YXZ'; r.stick.rotation.x = -Math.PI / 2; r.stick.position.y = .14; r.armL.sh.rotation.z = .5; r.armR.sh.rotation.z = -.9; r.look.rotation.y = .6; }
    else { r.legL.hip.rotation.x = r.legR.hip.rotation.x = -1.45; r.legL.kn.rotation.x = .2; r.stick.position.y = -.5; r.torso.rotation.x = -.2; r.look.rotation.x = .55; r.look.rotation.z = .25; r.armL.sh.rotation.z = .25; r.armR.sh.rotation.z = -.25; }
    r.armR.el.children.forEach(c => { if (c.isGroup) c.visible = false; }); g.add(r.stick); } catch (e) {}
}
function build(rm) {
  if (rm.built) return; rm.built = true; RND = mul32(rm.seed);
  const M = mats(), a = A(), g = new T.Group(); g.position.set(a.cx, 0, a.cz); DG.g.add(g); rm.g = g; rm.obs = []; rm.torches = []; rm.chains = []; rm.items = []; rm.t = 0; rm.skels = rm.skels || [];
  const { w, l, z0, z1 } = rm, cz = (z0 + z1) / 2, hw = w / 2;
  const fgeo = new T.PlaneGeometry(w, l).rotateX(-Math.PI / 2), fuv = fgeo.attributes.uv; for (let i = 0; i < fuv.count; i++) fuv.setXY(i, fuv.getX(i) * w / 4, fuv.getY(i) * l / 4);
  const fl = new T.Mesh(fgeo, M.floor); fl.position.set(0, .01, cz); fl.receiveShadow = true; g.add(fl);
  const cgeo = new T.PlaneGeometry(w, l).rotateX(Math.PI / 2), cuv = cgeo.attributes.uv; for (let i = 0; i < cuv.count; i++) cuv.setXY(i, cuv.getX(i) * w / 4, cuv.getY(i) * l / 4);
  const ce = new T.Mesh(cgeo, M.ceil); ce.position.set(0, WALLH, cz); g.add(ce);
  for (let z = z0 + 2; z < z1 - 1; z += 4) { box(g, w, .35, .4, M.wall, 0, WALLH - .17, z, 4); }   // tavan kirişleri
  wall(rm, g, -hw - .3, cz, .6, l + .6); wall(rm, g, hw + .3, cz, .6, l + .6);
  if (rm.i === 0) wall(rm, g, 0, z0 - .3, w + 1.2, .6);
  // arka duvar (iki odanın genişini kapatır) + kapı boşluğu
  const bh = rm.bw / 2, dx = rm.doorX, gw = 2.4, lw = dx - gw / 2 + bh + .6, rw = bh + .6 - (dx + gw / 2);
  if (lw > .05) wall(rm, g, -bh - .6 + lw / 2, z1 + .3, lw, .6); if (rw > .05) wall(rm, g, bh + .6 - rw / 2, z1 + .3, rw, .6);
  box(g, gw + .1, WALLH - 3, .6, M.wall, dx, 3 + (WALLH - 3) / 2, z1 + .3, 4);
  for (const s of [-1, 1]) box(g, .22, 3.2, .7, M.wood, dx + s * (gw / 2 + .05), 1.6, z1 + .3); box(g, gw + .55, .25, .7, M.wood, dx, 3.1, z1 + .3);   // kapı kasası
  if (rm.i < NROOM) {   // 🚪 numaralı kapı
    const dg = new T.Group(); dg.position.set(dx - gw / 2, 0, z1 + .3); g.add(dg); box(dg, gw, 3, .16, M.wood, gw / 2, 1.5, 0); const knob = cyl(dg, .07, .1, M.gold, gw - .3, 1.4, -.12, 8); knob.rotation.x = Math.PI / 2;
    const num = String(rm.i + 2).padStart(3, '0');
    const pl = new T.Mesh(new T.PlaneGeometry(.9, .34), txtMat(num)); pl.position.set(gw / 2, 2.4, -.09); pl.rotation.y = Math.PI; dg.add(pl);
    const pl2 = new T.Mesh(new T.PlaneGeometry(.9, .34), txtMat(num)); pl2.position.set(gw / 2, 2.4, .09); dg.add(pl2);
    rm.door = { g: dg, open: 0, ob: wallOb(rm, dx, z1 + .3, gw / 2 + .1, .3) };
    if (!rm.solved) { const lk = new T.Group(); lk.position.set(gw / 2, 1.4, -.14); dg.add(lk); box(lk, .36, .32, .1, M.iron, 0, 0, 0); const sh = new T.Mesh(new T.TorusGeometry(.12, .035, 6, 12, Math.PI), M.iron); sh.position.y = .16; lk.add(sh); rm.lock = lk;
      for (const s of [-1, 1]) { const ch = new T.Mesh(new T.CylinderGeometry(.03, .03, gw * 1.1, 5), M.iron); ch.rotation.z = Math.PI / 2 + s * .5; ch.position.set(gw / 2, 1.4, -.12); dg.add(ch); rm.lockCh = (rm.lockCh || []).concat(ch); } }
  }
  if (rm.type !== 'dark') for (let z = z0 + 3, k = 0; z < z1 - 1.5; z += 6.5, k++) { torch(rm, g, -hw + .02, 2.4, z, Math.PI / 2); torch(rm, g, hw - .02, 2.4, z + 3.2, -Math.PI / 2); }
  rm.drip = 2 + Math.random() * 4;
  if (TYPE_BUILD[rm.type]) TYPE_BUILD[rm.type](rm, g);
  if (rm.type === 'boss' && rm.treasure) bossProps(rm);
  if (rm.i > 0) { const s = new T.Mesh(new T.PlaneGeometry(3.4, .55), txtMat(adT(TNAME[rm.type]), '#e9e2cf', 'rgba(15,12,10,.8)', 512, 84, .55)); s.position.set(rm.pdx, 4.15, z0 + .62); g.add(s); }
  // yerde kemik / moloz süsleri
  for (let k = 0; k < 6; k++) { const b = new T.Mesh(new T.CylinderGeometry(.03, .03, R(.25, .45), 5), MAT_BONE()); b.rotation.set(Math.PI / 2, 0, R(0, 3)); b.position.set(R(-hw + .5, hw - .5), .04, R(z0 + 1, z1 - 1)); g.add(b); }
  for (let k = 0; k < 8; k++) { const s = R(.1, .3), r = new T.Mesh(new T.DodecahedronGeometry(s), M.wall); r.position.set(PICK([-1, 1]) * (hw - R(.15, .5)), s * .6, R(z0 + 1, z1 - 1)); r.rotation.set(R(0, 3), R(0, 3), 0); g.add(r); }
}
let _bone = null; const MAT_BONE = () => _bone || (_bone = new T.MeshStandardMaterial({ color: 0xe9e2cf, roughness: .8 }));
function dispose(rm) {
  if (!rm.built) return; rm.built = false;
  for (const o of rm.obs) { const i = G.obstacles.indexOf(o); if (i >= 0) G.obstacles.splice(i, 1); } rm.obs = [];
  for (const s of rm.skels || []) if (s.h.parent) s.h.parent.remove(s.h); rm.skels = []; if (!rm.solved) rm.started = false; if (DG.boss && DG.boss.rm === rm) DG.boss = null;
  DG.g.remove(rm.g);
  const skip = new Set(); rm.g.traverse(o => { if (o.userData && o.userData.rig) o.traverse(c => skip.add(c)); });
  rm.g.traverse(o => { if (skip.has(o)) return; if (o.geometry) o.geometry.dispose(); if (o.material && o.material.userData && o.material.userData.own) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
  rm.g = null; rm.door = null; rm.lock = null; rm.lockCh = null; rm.spikes = rm.shooters = rm.eyes = rm.levers = rm.chests = rm.plates = null; rm.portal = rm.chestT = null;
}

/* ---------- 🧩 oda türleri ---------- */
function cellRow(rm, g, side, zc, len) {   // parmaklıklı hücre (yan duvar ile parmaklık arası 2.4 m)
  const M = mats(), hw = rm.w / 2, bx = side * (hw - 2.4);
  const nb = Math.round(len / .42); for (let i = 0; i <= nb; i++) cyl(g, .04, WALLH - .5, M.iron, bx, (WALLH - .5) / 2, zc - len / 2 + i * len / nb, 6);
  box(g, .1, .12, len, M.iron, bx, WALLH - .55, zc); box(g, .1, .1, len, M.iron, bx, .95, zc); box(g, .1, .1, len, M.iron, bx, .05, zc);
  wallOb(rm, bx, zc, .08, len / 2);
  for (const e of [-1, 1]) { box(g, 2.4, WALLH, .35, M.wall, side * (hw - 1.2), WALLH / 2, zc + e * (len / 2 + .17), 4); wallOb(rm, side * (hw - 1.2), zc + e * (len / 2 + .17), 1.2, .18); }
  const ix = side * (hw - 1.2);
  if (RND() < .8) skelDecor(g, side * (hw - .5), zc + R(-1, 1), side > 0 ? -Math.PI / 2 : Math.PI / 2, RND() < .55 ? 'sit' : 'lie');
  for (let k = RI(1, 2); k > 0; k--) chain(rm, g, ix + R(-.6, .6), zc + R(-1.4, 1.4), RI(5, 13));
  if (RND() < .5) { const bk = new T.Mesh(new T.CylinderGeometry(.18, .15, .3, 10), M.wood); bk.position.set(ix + R(-.4, .4), .15, zc + R(-1.2, 1.2)); g.add(bk); }
  if (RND() < .6) { const hay = new T.Mesh(new T.BoxGeometry(1, .12, 1.6), new T.MeshStandardMaterial({ color: 0x8a7440, roughness: 1 })); hay.material.userData.own = true; hay.position.set(ix, .06, zc + R(-.8, .8)); hay.rotation.y = R(-.3, .3); g.add(hay); }
}
const TYPE_BUILD = {
  start(rm, g) {
    const s = new T.Mesh(new T.PlaneGeometry(6, 1.3), txtMat('🗝️ ' + adT('ZİNDAN') + ' 🗝️', '#ffd166', 'rgba(15,12,10,.9)', 512, 110, .62)); s.position.set(0, 3.7, rm.z0 + .02); g.add(s);
    const s2 = new T.Mesh(new T.PlaneGeometry(6.4, .62), txtMat(adT('🔥 F: çakmak · V: kullan · vur: iskelet'), '#e9e2cf', 'rgba(15,12,10,.8)', 900, 88, .5)); s2.position.set(0, 2.55, rm.z0 + .02); g.add(s2);
    const s3 = new T.Mesh(new T.PlaneGeometry(6.4, .55), txtMat(adT(`${NROOM + 1} oda · sonda Kemik Kral seni bekliyor`), '#c9b8ff', 'rgba(15,12,10,.75)', 900, 80, .5)); s3.position.set(0, 1.8, rm.z0 + .02); g.add(s3);
    for (const x of [-4, 4]) { box(g, .7, .7, .7, mats().wood, x, .35, rm.z0 + 4); wallOb(rm, x, rm.z0 + 4, .35, .35, .7); box(g, .5, .5, .5, mats().wood, x + .1, .95, rm.z0 + 4); }
    chain(rm, g, -2, rm.z0 + 8, 10); chain(rm, g, 2.5, rm.z0 + 10, 7); chain(rm, g, 0, rm.z0 + 13, 14);
    skelDecor(g, -6.4, rm.z0 + 7, Math.PI / 2, 'sit');
    const gate = new T.Group(); gate.position.set(0, 0, rm.z0 - .05); g.add(gate); for (let i = 0; i < 7; i++) cyl(gate, .04, 3, mats().iron, -1.2 + i * .4, 1.5, 0, 6); },
  hall(rm, g) { const hw = rm.w / 2; for (let z = rm.z0 + 4; z < rm.z1 - 2.5; z += R(3, 5.5)) { if (RND() < .7) chain(rm, g, R(-hw + 1, hw - 1), z, RI(6, 18));
      if (RND() < .35) { const x = PICK([-hw + .7, hw - .7]); box(g, .9, 1, .9, mats().wood, x, .5, z); wallOb(rm, x, z, .45, .45, 1); if (RND() < .5) { const bl = cyl(g, .3, .8, mats().wood, x, 1.4, z, 10); } }
      if (RND() < .3) skelDecor(g, PICK([-hw + .5, hw - .5]) , z + 1, PICK([Math.PI / 2, -Math.PI / 2]), 'sit'); }
    for (const z of [rm.z0 + rm.l * .33, rm.z0 + rm.l * .66]) for (const s of [-1, 1]) { cyl(g, .35, WALLH, mats().wall, s * (hw - .35), WALLH / 2, z, 10); wallOb(rm, s * (hw - .35), z, .35, .35); } },
  jail(rm, g) { const hw = rm.w / 2, len = 4.2;
    for (let zc = rm.z0 + 3 + len / 2; zc + len / 2 < rm.z1 - 2.5; zc += len + .35) { cellRow(rm, g, -1, zc, len); cellRow(rm, g, 1, zc, len); }
    for (let k = 0; k < 4; k++) chain(rm, g, R(-hw + 3, hw - 3), R(rm.z0 + 2, rm.z1 - 2), RI(4, 10));
    const tb = new T.Group(); tb.position.set(0, 0, rm.z0 + 1.6); g.add(tb); box(tb, 1.4, .08, .7, mats().wood, 0, .8, 0); for (const x of [-.6, .6]) box(tb, .08, .8, .6, mats().wood, x, .4, 0); const kr = new T.Mesh(new T.TorusGeometry(.12, .02, 5, 12), mats().iron); kr.rotation.x = Math.PI / 2; kr.position.set(.3, .86, 0); tb.add(kr); },
  maze(rm, g) {   // 6x6 hücreli labirent (her girişte farklı)
    const N = 8, C = 4, ox = -N * C / 2, oz = rm.z0 + 1, vis = new Array(N * N).fill(false);
    const H = new Array((N + 1) * N).fill(true), V = new Array(N * (N + 1)).fill(true), st = [[N >> 1, 0]]; vis[N >> 1] = true;
    while (st.length) { const [x, y] = st[st.length - 1], nb = [[x + 1, y, 'v', x + 1, y], [x - 1, y, 'v', x, y], [x, y + 1, 'h', x, y + 1], [x, y - 1, 'h', x, y]].filter(([p, q]) => p >= 0 && q >= 0 && p < N && q < N && !vis[q * N + p]);
      if (!nb.length) { st.pop(); continue; } const [p, q, t, wx, wy] = PICK(nb); if (t === 'v') V[wy * (N + 1) + wx] = false; else H[wy * N + wx] = false; vis[q * N + p] = true; st.push([p, q]); }
    for (let k = 0; k < 5; k++) { const x = RI(1, N - 1), y = RI(0, N - 1); V[y * (N + 1) + x] = false; }   // birkaç kısa yol
    const ex = RI(0, N - 1); H[N >> 1] = false; H[N * N + ex] = false; rm.mazeExit = ox + ex * C + C / 2;
    const M = mats(), wh = 3.6;
    for (let y = 0; y <= N; y++) for (let x = 0; x < N; x++) if (H[y * N + x]) { box(g, C + .35, wh, .35, M.wall, ox + x * C + C / 2, wh / 2, oz + y * C, 4); wallOb(rm, ox + x * C + C / 2, oz + y * C, (C + .35) / 2, .18); }
    for (let y = 0; y < N; y++) for (let x = 1; x < N; x++) if (V[y * (N + 1) + x]) { box(g, .35, wh, C + .35, M.wall, ox + x * C, wh / 2, oz + y * C + C / 2, 4); wallOb(rm, ox + x * C, oz + y * C + C / 2, .18, (C + .35) / 2); }
    for (let k = 0; k < 11; k++) { const x = RI(0, N - 1), y = RI(1, N - 1); if (H[y * N + x]) torch(rm, g, ox + x * C + C / 2, 2.1, oz + y * C - .2, Math.PI); }
    for (let k = 0; k < 5; k++) chain(rm, g, ox + RI(0, N - 1) * C + C / 2 + R(-1, 1), oz + RI(0, N - 1) * C + C / 2 + R(-1, 1), RI(5, 12));
    if (RND() < .8) skelDecor(g, ox + RI(0, N - 1) * C + C / 2, oz + RI(1, N - 2) * C + C / 2, R(0, 6), 'lie');
    rm.items.push(fuelItem(g, ox + RI(0, N - 1) * C + C / 2, oz + RI(2, N - 1) * C + C / 2)); },
  traps(rm, g) {   // ⚠️ diken sıraları ve duvardan ok atan tuzaklar (kırmızı yanınca kaç!)
    const M = mats(), hw = rm.w / 2; rm.spikes = []; rm.shooters = [];
    for (let z = rm.z0 + 4, k = 0; z < rm.z1 - 3; z += 3.2, k++) {
      if (k % 2 === 0 || RND() < .3) { const sp = new T.Group(); sp.position.set(0, 0, z); g.add(sp); const bm = new T.MeshStandardMaterial({ color: 0x3b3f46, metalness: .6, roughness: .5, emissive: 0 }); bm.userData.own = true;
        const base = box(sp, rm.w - .1, .05, 1.8, bm, 0, .03, 0); const pins = new T.Group(); sp.add(pins); const cg = new T.ConeGeometry(.08, .55, 5);
        for (let x = -hw + .4; x < hw - .2; x += .5) for (const dz of [-.55, 0, .55]) { const c = new T.Mesh(cg, M.iron); c.position.set(x, .27, dz); pins.add(c); }
        pins.position.y = -.6; rm.spikes.push({ z, pins, bm, ph: k * .73 + R(0, .5), per: 2.3 + R(0, .8), up: false }); }
      else { const side = PICK([-1, 1]), sh = new T.Group(); sh.position.set(side * (hw - .02), 1.1, z); g.add(sh); box(sh, .2, .55, .55, M.iron, 0, 0, 0); const sk = new T.Mesh(new T.SphereGeometry(.2, 10, 8), MAT_BONE()); sk.position.set(-side * .12, 0, 0); sk.scale.set(.6, 1, 1); sh.add(sk);
        for (const s of [-.07, .07]) { const e = new T.Mesh(new T.SphereGeometry(.045, 6, 5), M.eye); e.position.set(-side * .25, .04, s); sh.add(e); } rm.shooters.push({ side, z, t: R(0, 2), per: 1.6 + R(0, 1) }); } }
    const s = new T.Mesh(new T.PlaneGeometry(3.4, .5), txtMat('⚠️ ' + adT('Kırmızı = kaç!'), '#ff8a7a', 'rgba(15,12,10,.8)', 512, 76, .55)); s.position.set(rm.pdx, 3.55, rm.z0 + .62); g.add(s); },
  dark(rm, g) {   // 🌑 zifiri karanlık: çakmak lazım; karanlıkta parlayan gözler (yaklaşınca kaybolur)
    const hw = rm.w / 2; rm.eyes = [];
    for (let k = 0; k < 13; k++) { const x = R(-hw + 1.5, hw - 1.5), z = R(rm.z0 + 3.5, rm.z1 - 3.5); if (Math.abs(x - rm.doorX) < 2 && z > rm.z1 - 5) continue; const sx = R(.8, 1.4), sz = R(.8, 1.4), sy = R(1.2, 3); box(g, sx, sy, sz, mats().wall, x, sy / 2, z, 4); wallOb(rm, x, z, sx / 2, sz / 2, sy); }
    for (let k = 0; k < 7; k++) { const e = new T.Group(); e.position.set(R(-hw + .3, hw - .3), R(.8, 3.2), R(rm.z0 + 2, rm.z1 - 1)); for (const s of [-.11, .11]) { const m = new T.Mesh(new T.SphereGeometry(.045, 8, 6), mats().eye); m.position.x = s; e.add(m); } e.rotation.y = R(0, 6); g.add(e); rm.eyes.push(e); }
    for (let k = 0; k < 4; k++) chain(rm, g, R(-hw + 1, hw - 1), R(rm.z0 + 2, rm.z1 - 2), RI(6, 14));
    rm.items.push(fuelItem(g, R(-hw + 1, hw - 1), R(rm.z0 + 4, rm.z1 - 4))); },
  lever(rm, g) {   // 🔀 sembollü kollar: kapının üstündeki taştaki sırayla çek
    const M = mats(), hw = rm.w / 2, sym = ['☾', '✦', '☀', '❖'], order = [0, 1, 2, 3].sort(() => RND() - .5).slice(0, 3); rm.order = order; rm.got = []; rm.levers = [];
    const mural = new T.Mesh(new T.PlaneGeometry(4, 1), txtMat(order.map(i => sym[i]).join('  →  '), '#ffd166', 'rgba(25,18,10,.92)', 512, 128, .6)); mural.position.set(rm.doorX, 4.05, rm.z1 - .02); mural.rotation.y = Math.PI; g.add(mural);
    const spots = [[-hw + .05, rm.z0 + rm.l * .3, Math.PI / 2], [hw - .05, rm.z0 + rm.l * .42, -Math.PI / 2], [-hw + .05, rm.z0 + rm.l * .62, Math.PI / 2], [hw - .05, rm.z0 + rm.l * .78, -Math.PI / 2]].sort(() => RND() - .5);
    for (let i = 0; i < 4; i++) { const [x, z, ry] = spots[i], L = new T.Group(); L.position.set(x, 1.3, z); L.rotation.y = ry; g.add(L); box(L, .55, .75, .14, M.iron, 0, 0, .07); const arm = new T.Group(); arm.position.z = .16; L.add(arm); const st = cyl(arm, .04, .55, M.wood, 0, .27, 0, 6); const kn = new T.Mesh(new T.SphereGeometry(.08, 8, 6), M.red); kn.position.y = .55; arm.add(kn); arm.rotation.x = .6;
      const sg = new T.Mesh(new T.PlaneGeometry(.5, .42), txtMat(sym[i], '#4cc9f0', 'rgba(10,10,15,.92)', 128, 104, .7)); sg.position.set(0, .72, .08); L.add(sg);
      const wp = new T.Vector3(0, 0, .7).applyAxisAngle(new T.Vector3(0, 1, 0), ry); rm.levers.push({ i, arm, p: new T.Vector3(A().cx + x + wp.x, 1, A().cz + z + wp.z), on: false }); } },
  key(rm, g) {   // 🗝️ sandıklardan birinde anahtar var
    const M = mats(), hw = rm.w / 2, n = RI(5, 8), k = RI(0, n - 1); rm.chests = [];
    for (let i = 0; i < n; i++) { const x = (i % 2 ? 1 : -1) * (hw - 1), z = rm.z0 + 3 + i * (rm.l - 6) / Math.max(1, n - 1), c = new T.Group(); c.position.set(x, 0, z); c.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; g.add(c);
      box(c, 1.1, .6, .7, M.wood, 0, .3, 0); const lid = new T.Group(); lid.position.set(0, .6, -.35); c.add(lid); box(lid, 1.12, .18, .72, M.wood, 0, .09, .35); for (const s of [-.4, .4]) box(c, .06, .62, .74, M.iron, s, .31, 0);
      rm.chests.push({ g: c, lid, key: i === k, open: false, p: new T.Vector3(A().cx + x, 0, A().cz + z) }); wallOb(rm, x, z, .42, .42, .8); }
    const s = new T.Mesh(new T.PlaneGeometry(3.4, .5), txtMat('🗝️ ' + adT('Anahtar sandıklardan birinde'), '#ffd166', 'rgba(15,12,10,.8)', 640, 76, .5)); s.position.set(rm.pdx, 3.55, rm.z0 + .62); g.add(s); },
  plates(rm, g) {   // ⬜ 4 plakanın hepsi aynı anda yanmalı (her biri basınca 6 sn yanar)
    const hw = rm.w / 2; rm.plates = [];
    for (let i = 0; i < 4; i++) { const x = (i % 2 ? 1 : -1) * (hw * .6), z = rm.z0 + rm.l * (.22 + Math.floor(i / 2) * .5) + (i % 2) * rm.l * .12, pm = new T.MeshStandardMaterial({ color: 0x6b7280, emissive: 0x000000, roughness: .5 }); pm.userData.own = true; const p = box(g, 1.6, .1, 1.6, pm, x, .05, z); rm.plates.push({ m: p, p: new T.Vector3(A().cx + x, 0, A().cz + z), t: 0 }); }
    const s = new T.Mesh(new T.PlaneGeometry(3.4, .5), txtMat('⬜ ' + adT('Dört plaka aynı anda yansın'), '#9be7ff', 'rgba(15,12,10,.8)', 640, 76, .5)); s.position.set(rm.pdx, 3.55, rm.z0 + .62); g.add(s); },
  skel(rm, g) { rm.skelN = RI(4, 7); rm.graves = []; const hw = rm.w / 2; for (let k = 0; k < rm.skelN; k++) { const gr = new T.Mesh(new T.CircleGeometry(.6, 14).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0x0d0d10 })); gr.material.userData.own = true; const x = R(-hw + 2, hw - 2), z = R(rm.z0 + rm.l * .45, rm.z1 - 2); gr.position.set(x, .02, z); g.add(gr); rm.graves.push([x, z]); }
    for (let k = 0; k < 3; k++) chain(rm, g, R(-hw + 1, hw - 1), R(rm.z0 + 2, rm.z1 - 2), RI(5, 12)); },
  boss(rm, g) { const M = mats(); for (const x of [-13, 13]) for (const z of [rm.z0 + 8, rm.z0 + rm.l / 2, rm.z1 - 9]) { cyl(g, .9, WALLH, M.wall, x, WALLH / 2, z, 12); wallOb(rm, x, z, .9, .9); chain(rm, g, x * .6, z, RI(10, 20)); }
    const th = new T.Group(); th.position.set(0, 0, rm.z1 - 2.5); g.add(th); box(th, 4, 1, 2, M.wall, 0, .5, 0, 4); box(th, 3, 4, .6, M.wall, 0, 3, -.7, 4); box(th, 2.6, .3, 1.6, M.red, 0, 1.15, 0);
    for (let k = 0; k < 9; k++) { const sk = new T.Mesh(new T.SphereGeometry(.18, 10, 8), MAT_BONE()); sk.position.set(R(-1.8, 1.8), 1.05 + R(0, .2), R(-.8, .9)); th.add(sk); }
    for (const x of [-4, 4]) { const br = new T.Group(); br.position.set(x, 0, rm.z1 - 3); g.add(br); cyl(br, .08, 1.5, M.iron, 0, .75, 0, 6); const bowl = new T.Mesh(new T.CylinderGeometry(.45, .2, .35, 12), M.iron); bowl.position.y = 1.6; br.add(bowl); const f = new T.Mesh(new T.ConeGeometry(.35, .9, 8), M.flame); f.position.y = 2.1; br.add(f); const h = new T.Sprite(M.halo); h.scale.set(2.4, 2.4, 1); h.position.y = 2.1; br.add(h); rm.torches.push({ f, f2: f, h, p: new T.Vector3(A().cx + x, 2.2, A().cz + rm.z1 - 3), ph: Math.random() * 6 }); wallOb(rm, x, rm.z1 - 3, .3, .3, 2); } },
};
function fuelItem(g, x, z) { const o = new T.Group(); o.position.set(x, .4, z); g.add(o); const b = new T.Mesh(new T.CylinderGeometry(.13, .15, .38, 10), new T.MeshStandardMaterial({ color: 0xe76f51, emissive: 0x6a2a00, roughness: .4 })); b.material.userData.own = true; o.add(b); const cap = new T.Mesh(new T.CylinderGeometry(.06, .06, .1, 8), mats().gold); cap.position.y = .24; o.add(cap); const h = new T.Sprite(mats().halo); h.scale.set(.9, .9, 1); o.add(h); return { g: o, kind: 'fuel', p: new T.Vector3(A().cx + x, 0, A().cz + z) }; }

/* ---------- 💀 iskeletler ---------- */
function spawnSkel(rm, x, z, big) {
  let rig; try { rig = G.makeThemeRig('skeleton'); } catch (e) { console.warn('iskelet', e); return null; }
  rig.stick.visible = true;   // oyunun tema iskeleti gizli başlar
  const h = new T.Group(); h.add(rig.stick); h.position.set(A().cx + x, -1.8 * (big ? 2.6 : 1), A().cz + z); h.rotation.y = Math.PI; DG.g.add(h); if (big) { h.scale.setScalar(2.6); const cr = new T.Mesh(new T.CylinderGeometry(.13, .15, .1, 8, 1, true), mats().gold); cr.position.y = .2; rig.head.add(cr); for (let i = 0; i < 5; i++) { const sp = new T.Mesh(new T.ConeGeometry(.025, .08, 4), mats().gold); sp.position.set(Math.sin(i * 1.256) * .13, .28, Math.cos(i * 1.256) * .13); rig.head.add(sp); } }
  const s = { h, rig, hp: big ? 480 : 60, max: big ? 480 : 60, big, st: 'rise', t: 0, atk: 1 + Math.random(), hurt: 0, rm, sw: 0 };
  rm.skels.push(s); snd('rattle', .8); for (let i = 0; i < 10; i++) G.spawnDust(h.position.x, 0, h.position.z, .8 * (big ? 2.6 : 1), 1.5, 0, 0, 0x6b6157); return s;
}
function skelTick(s, dt, P) {
  const h = s.h, q = h.position, sc = s.big ? 2.6 : 1, a = A(); s.t += dt; s.hurt = Math.max(0, s.hurt - dt);
  if (s.st === 'rise') { q.y = Math.min(0, -1.8 * sc + s.t * 1.5 * sc); G.animateStick(s.rig, dt, { speed: 0 }); if (q.y >= 0) { s.st = 'chase'; s.t = 0; } return; }
  if (s.st === 'dead') { s.rig.stick.rotation.x = Math.max(-1.5, s.rig.stick.rotation.x - dt * 4); q.y = Math.max(-.25 * sc, q.y - dt * .2); if (s.t > 3.5) { h.visible = false; s.gone = true; } return; }
  const dx = P.x - q.x, dz = P.z - q.z, d = Math.hypot(dx, dz);
  h.rotation.y += G.wrapAng(Math.atan2(dx, dz) - h.rotation.y) * Math.min(1, dt * 8);
  let sp = 0; const reach = 1.25 * sc;
  if (d > reach && !G.dead) { sp = s.big ? 2.9 : 3.2; q.x += dx / d * sp * dt; q.z += dz / d * sp * dt; }
  const rm = s.rm, hw = rm.w / 2 - .4 * sc; q.x = Math.max(a.cx - hw, Math.min(a.cx + hw, q.x)); q.z = Math.max(a.cz + rm.z0 + .5 * sc, Math.min(a.cz + rm.z1 - .5 * sc, q.z));
  s.atk -= dt; s.sw = Math.max(0, s.sw - dt);
  if (d < reach + .35 && s.atk <= 0) { s.atk = s.big ? 2 : 1.2; s.sw = .35; if (s.big) bossSlam(s); else { dmg(9); snd('rattle', .6); } }
  if (s.big && !s.summoned && s.hp < s.max * .5) { s.summoned = true; for (const k of [-4, 4]) spawnSkel(rm, q.x - a.cx + k, Math.max(rm.z0 + 2, q.z - a.cz - 3), false); snd('roar', 1); G.showMsg('💀 ' + adT('Kemik Kral yardım çağırdı!'), 1.6); }
  G.animateStick(s.rig, dt, { speed: sp, running: false });
  if (s.sw > 0) s.rig.armR.sh.rotation.x = -2.4 + (1 - s.sw / .35) * 2.6;
}
function bossSlam(s) { snd('roar', .6); G.shake = Math.max(G.shake, .55); const P = G.player.position, q = s.h.position; for (let i = 0; i < 26; i++) G.spawnDust(q.x + Math.sin(s.h.rotation.y) * 2.5, 0, q.z + Math.cos(s.h.rotation.y) * 2.5, 4, 2, 0, 0, 0x8a8f96); if (Math.hypot(P.x - q.x, P.z - q.z) < 6 && P.y < 1.5) dmg(20); }
function hurtSkel(s, v, ux, uz) {
  const q = s.h.position, sc = s.big ? 2.6 : 1; s.hp -= v; s.hurt = .25; if (!s.big) { q.x += ux * .6; q.z += uz * .6; }
  snd('rattle', .5); for (let i = 0; i < 8; i++) G.spawnDust(q.x, 1.2 * sc, q.z, .4 * sc, 1.2, 0, 0, 0xe9e2cf);
  if (s.hp <= 0 && s.st !== 'dead') { s.st = 'dead'; s.t = 0; G.progAdd(s.big ? 60 : 3, q); if (s.big) bossDown(s.rm, true); }
}
function alive(s) { return s.st !== 'dead' && s.st !== 'rise' && !s.gone; }
function targets() { const L = []; for (const rm of DG.rooms) for (const s of rm.skels || []) if (alive(s)) { const sc = s.big ? 2.6 : 1; L.push({ id: s, p: s.h.position, h: 2 * sc, r: .45 * sc, hit: (v, dir, k) => { hurtSkel(s, v, dir ? dir.x : 0, dir ? dir.z : 0); if (k && !s.big && dir) { s.h.position.x += dir.x * k * .12; s.h.position.z += dir.z * k * .12; } } }); } return L; }
function attack(dir) {   // 👊 yumruk / tekme
  if (G.curKey !== 'dungeon') return false; const P = G.player.position; let hit = false;
  for (const rm of DG.rooms) for (const s of rm.skels || []) { if (!alive(s)) continue; const q = s.h.position, dx = q.x - P.x, dz = q.z - P.z, d = Math.hypot(dx, dz) || .01, sc = s.big ? 2.6 : 1;
    if (d > 2.2 + (sc - 1) * 1.1) continue; if (d > 1 && (dx * dir.x + dz * dir.z) / d < .35) continue; hurtSkel(s, G.giant ? 999 : 22, dx / d, dz / d); hit = true; }
  return hit;
}
function ray(o, d, best, v) {   // 🔫 mermi
  let bt = null, bs = null;
  for (const rm of DG.rooms) for (const s of rm.skels || []) { if (!alive(s)) continue; const q = s.h.position, sc = s.big ? 2.6 : 1, r = .4 * sc, ox = o.x - q.x, oz = o.z - q.z, a = d.x * d.x + d.z * d.z, b = 2 * (ox * d.x + oz * d.z), c = ox * ox + oz * oz - r * r, D = b * b - 4 * a * c;
    if (D < 0 || a < 1e-8) continue; const t = (-b - Math.sqrt(D)) / (2 * a); if (t < 0 || t >= best || (bt !== null && t >= bt)) continue; const y = o.y + d.y * t; if (y < q.y || y > q.y + 2 * sc) continue; bt = t; bs = s; }
  if (!bs) return null; const L = Math.hypot(d.x, d.z) || 1; hurtSkel(bs, v, d.x / L, d.z / L); return bt;
}
function bossDown(rm, mine) {
  if (rm.treasure) return; rm.treasure = true; rm.solved = true; snd('roar', 1.2); G.showMsg('👑 ' + adT('Kemik Kral yenildi! Hazine ve çıkış açıldı'), 3); G.play('goal');
  if (mine) netSend({ i: rm.i, boss: 1 });
  for (const s of rm.skels) if (alive(s)) { s.st = 'dead'; s.t = 0; }
  bossProps(rm);
}
function bossProps(rm) {   // hazine sandığı + çıkış kapısı
  if (!rm.g || rm.portal) return; const M = mats(), c = new T.Group(); c.position.set(0, 0, rm.z1 - 6.5); rm.g.add(c); box(c, 1.6, .9, 1, M.gold, 0, .45, 0); const lid = new T.Group(); lid.position.set(0, .9, -.5); c.add(lid); box(lid, 1.65, .25, 1.05, M.wood, 0, .12, .5);
  const hh = new T.Sprite(M.halo); hh.scale.set(1.7, 1.7, 1); hh.position.y = 1.1; c.add(hh); rm.chestT = { g: c, lid, p: new T.Vector3(A().cx, 0, A().cz + rm.z1 - 6.5), open: false };
  const pg = new T.Mesh(new T.TorusGeometry(1.4, .15, 10, 40), new T.MeshBasicMaterial({ color: 0x4cc9f0, fog: false })); pg.material.userData.own = true; pg.position.set(6, 1.8, rm.z1 - 4); rm.g.add(pg);
  const pf = new T.Mesh(new T.CircleGeometry(1.35, 32), new T.MeshBasicMaterial({ color: 0x9be7ff, transparent: true, opacity: .55, side: T.DoubleSide, fog: false })); pf.material.userData.own = true; pf.position.copy(pg.position); rm.g.add(pf);
  rm.portal = { m: pg, p: new T.Vector3(A().cx + 6, 0, A().cz + rm.z1 - 4) }; if (rm.chestOpened) rm.chestT.open = true;
}

/* ---------- ❤️ hasar (zindanda canın biterse bayılırsın: odanın başından devam) ---------- */
function dmg(v) {
  if (G.dead || G.teleporting || DG.inv > 0 || G.elapsed - DG.lastHit < .55) return;
  if (G.ADM && (G.ADM.god || G.ADM.bubbleShield)) return;
  DG.lastHit = G.elapsed; G.hurtFlash = .8; G.shake = Math.max(G.shake, .2); G.play('hit');
  const hp = G.hp - v; if (hp > 0) { G.hp = hp; return; }
  const rm = DG.rooms[DG.cur] || DG.rooms[0], a = A(); G.hp = Math.round(G.HPMAX * .6); DG.inv = 2.5;
  G.player.position.set(a.cx + rm.pdx, 0, a.cz + rm.z0 + 1.4); G.vel.set(0, 0, 0); G.vy = 0; G.facing = 0; G.yaw = -Math.PI;
  G.showMsg('💫 ' + adT('Bayıldın! Odanın başından devam'), 2.2); snd('drip');
}

/* ---------- 🌐 çok oyunculu: herkes aynı zindan, çözülen kapılar herkeste açılır ---------- */
function netSend(o) { try { if (G.MP.on && G.MP.started) G.mpSend(Object.assign({ t: 'dgs', sd: DG.seed }, o)); } catch (e) {} }
function net(m) { if (m.t !== 'dgs' || m.sd !== DG.seed || G.curKey !== 'dungeon') return; const rm = DG.rooms[m.i]; if (!rm) return; if (m.boss) bossDown(rm, false); else if (!rm.solved) { rm.solved = true; G.showMsg('🤝 ' + adT('Arkadaşın') + ` ${adT('Oda')} ${rm.i + 1} ${adT('kapısını açtı')}`, 1.6); } }
function solve(rm, msg) { if (rm.solved) return; rm.solved = true; G.play('magic'); G.showMsg('✅ ' + adT(msg), 1.7); netSend({ i: rm.i }); }

/* ---------- ⏱️ her kare ---------- */
function tick(dt) {
  if (G.curKey !== 'dungeon') { if (DG.on) leaveFx(); return; }
  if (!DG.rooms.length) return;
  const P = G.player.position, a = A(), lz = P.z - a.cz, t = G.elapsed;
  let ci = DG.rooms.findIndex(r => lz >= r.z0 - .2 && lz < r.z1 + .6); if (ci < 0) ci = lz < 0 ? 0 : DG.rooms.length - 1;
  for (let i = 0; i < DG.rooms.length; i++) { const near = (i >= ci - 2 && i <= ci + 1) || (i === ci + 2 && DG.rooms[ci].solved); if (near) build(DG.rooms[i]); else dispose(DG.rooms[i]); }
  if (ci !== DG.cur) { const was = DG.cur; DG.cur = ci; onEnter(DG.rooms[ci], was); }
  hud(); if (!dt) return;
  DG.inv = Math.max(0, DG.inv - dt);
  const rmc = DG.rooms[ci];
  // 🔥 meşaleler: en yakın üçüne gerçek ışık
  const all = []; for (const r of DG.rooms) if (r.built) for (const tc of r.torches) { const fl = 1 + Math.sin(t * 13 + tc.ph) * .18 + Math.sin(t * 29 + tc.ph * 2) * .08; tc.f.scale.set(1, fl, 1); tc.f2.scale.set(1, 2 - fl, 1); tc.h.material.opacity = .45 + (fl - 1) * .6; all.push(tc); }
  DG.lT = (DG.lT || 0) - dt; if (DG.lT <= 0) { DG.lT = .2; all.sort((p, q) => p.p.distanceToSquared(P) - q.p.distanceToSquared(P)); DG.torchL.forEach((L, i) => { const tc = all[i]; L.position.copy(tc ? tc.p : P); L.userData.on = !!tc; }); }
  for (const L of DG.torchL) L.intensity = L.userData.on ? 22 + Math.sin(t * 11 + L.userData.ph) * 2.5 + Math.sin(t * 23 + L.userData.ph) * 1.5 : 0;
  // 🔥 çakmak
  if (DG.lighter) { DG.fuel = Math.max(0, DG.fuel - dt * (G.ADM && G.ADM.god ? 0 : .8)); if (DG.fuel <= 0) { DG.lighter = false; G.showMsg('🔥 ' + adT('Çakmağın gazı bitti! Gaz kutusu bul'), 1.8); } }
  const lf = DG.lighter ? 1 : 0; DG.light.intensity += ((lf ? 12 + Math.sin(t * 23) * 1.4 + Math.sin(t * 9) * 1 : 0) - DG.light.intensity) * Math.min(1, dt * 14);
  DG.light.position.set(P.x + Math.sin(G.facing) * .4 - Math.cos(G.facing) * .25, P.y + 1.35, P.z + Math.cos(G.facing) * .4 + Math.sin(G.facing) * .25);
  // 🌫️ sis: karanlık odada göz gözü görmez
  const dark = rmc.type === 'dark', F = G.scene.fog, n0 = dark ? (DG.lighter ? 1 : .3) : 4, n1 = dark ? (DG.lighter ? 12 : 3.6) : 34, k = Math.min(1, dt * 3);
  if (F) { F.near += (n0 - F.near) * k; F.far += (n1 - F.far) * k; }
  // ⛓️ zincirler sallanır, şıngırdar; su damlar
  for (const r of DG.rooms) if (r.built) for (const c of r.chains) { c.c.rotation.z = Math.sin(t * 1.3 + c.ph) * .06; c.c.rotation.x = Math.cos(t * 1.1 + c.ph) * .045; }
  DG.chT = (DG.chT || 2) - dt; if (DG.chT <= 0) { DG.chT = 1.5 + Math.random() * 4; const cs = rmc.chains; if (cs && cs.length) { const c = RP(cs), d = c.p.distanceTo(P); if (d < 20) snd('chain', Math.max(.15, 1 - d / 20), Math.sign(c.p.x - P.x) * .5); } }
  rmc.drip -= dt; if (rmc.drip <= 0) { rmc.drip = 2.5 + Math.random() * 6; snd('drip', .7, Math.random() - .5); }
  DG.amb = (DG.amb || 9) - dt; if (DG.amb <= 0) { DG.amb = 10 + Math.random() * 14; snd(RP(['chain', 'rattle', 'creak']), .18, Math.random() * 2 - 1); }
  if (G.elapsed - DG.lastHit > 6 && G.hp < G.HPMAX && !G.dead) G.hp = Math.min(G.HPMAX, G.hp + dt * 3);
  // 🚪 kapılar
  for (const r of DG.rooms) if (r.built && r.door) { const D = r.door, dz = (r.z1 + .3) - lz, dx = r.doorX - (P.x - a.cx), near = Math.abs(dz) < 3 && Math.abs(dx) < 2.6;
    const want = r.solved && (near || D.open > .5) ? 1 : 0, was = D.open; D.open = Math.max(0, Math.min(1, D.open + (want ? dt * 1.8 : -dt * 1.8))); if (was === 0 && D.open > 0) snd('creak', .8); D.g.rotation.y = -D.open * 1.75; D.ob.pass = D.open > .55;
    if (r.lock) { r.lock.visible = !r.solved; for (const ch of r.lockCh || []) ch.visible = !r.solved; } if (near && !r.solved && dz > 0 && !r.warned) { r.warned = true; G.showMsg('🔒 ' + adT(LOCKMSG[r.type] || 'Kapı kilitli'), 2); snd('buzz', .5); } if (!near) r.warned = false; }
  for (const r of DG.rooms) if (r.built) roomTick(r, dt, P, lz);
  // 🧴 gaz kutuları
  for (const r of DG.rooms) if (r.built) for (const it of r.items) if (!it.got) { it.g.rotation.y += dt * 2; it.g.position.y = .4 + Math.sin(t * 3) * .06; if (Math.hypot(it.p.x - P.x, it.p.z - P.z) < 1.1) { it.got = true; it.g.visible = false; DG.fuel = Math.min(100, DG.fuel + 60); G.play('ding'); G.showMsg('🧴 ' + adT('Çakmak gazı +60'), 1.2); } }
  // 🏹 oklar
  for (const ar of DG.arrows) { ar.t += dt; const x0 = ar.m.position.x; ar.m.position.x += ar.vx * dt; const x1 = ar.m.position.x;
    if (!ar.hit && (x0 - P.x) * (x1 - P.x) <= 0 && Math.abs(ar.m.position.z - P.z) < .45 && P.y < 1.6) { ar.hit = true; dmg(10); ar.t = 9; }
    if (ar.t > 2.5) { if (ar.m.parent) ar.m.parent.remove(ar.m); ar.m.geometry.dispose(); ar.dead = true; } }
  DG.arrows = DG.arrows.filter(x => !x.dead);
}
function onEnter(rm, was) {
  if (rm.i > 0 && rm.i > was) { G.showMsg(`🚪 ${adT('Oda')} ${rm.i + 1} · ${adT(TNAME[rm.type])}`, 1.6); snd('chain', .4); }
  if (rm.type === 'dark' && !DG.lighter) setTimeout(() => { if (DG.rooms[DG.cur] === rm && !DG.lighter) G.showMsg('🌑 ' + adT('Zifiri karanlık — F ile çakmağı yak'), 2.2); }, 1700);
  if ((rm.type === 'skel' || rm.type === 'boss') && !rm.started && !rm.solved) { rm.started = true;
    if (rm.type === 'skel') { (rm.graves || []).forEach(([x, z], k) => setTimeout(() => { if (rm.built && rm.started && !spawnSkel(rm, x, z, false)) rm.skelN--; }, 300 + k * 450)); setTimeout(() => G.showMsg('💀 ' + adT('İskeletler uyandı! Hepsini yen'), 1.8), 300); }
    else setTimeout(() => { if (rm.built) { DG.boss = spawnSkel(rm, 0, rm.z1 - 9, true); snd('roar', 1.2); G.showMsg('👑 ' + adT('Kemik Kral uyandı!'), 2.2); } }, 900); }
}
function roomTick(rm, dt, P, lz) {
  rm.t += dt; const a = A();
  if (rm.spikes) for (const s of rm.spikes) { const ph = ((rm.t + s.ph) % s.per) / s.per, up = ph > .58 && ph < .9, warn = ph > .4 && ph <= .58;
    s.pins.position.y += ((up ? 0 : -.6) - s.pins.position.y) * Math.min(1, dt * (up ? 28 : 6));
    s.bm.emissive.setHex(up ? 0x6a0000 : warn ? (Math.sin(rm.t * 30) > 0 ? 0x5a0000 : 0x200000) : 0); s.bm.color.setHex(up || warn ? 0x8a2a22 : 0x3b3f46);
    if (up && !s.up && Math.abs(lz - s.z) < 12) snd('spike', Math.max(.2, .8 - Math.abs(lz - s.z) / 15)); s.up = up;
    if (up && s.pins.position.y > -.25 && Math.abs(lz - s.z) < 1 && P.y < .7) dmg(15); }
  if (rm.shooters) for (const sh of rm.shooters) { sh.t -= dt; if (sh.t <= 0) { sh.t = sh.per; if (Math.abs(lz - sh.z) < 14) { const m = new T.Mesh(new T.CylinderGeometry(.025, .025, .7, 5).rotateZ(Math.PI / 2), mats().wood); m.position.set(a.cx + sh.side * (rm.w / 2 - .35), 1.15, a.cz + sh.z); DG.g.add(m); DG.arrows.push({ m, vx: -sh.side * 14, t: 0 }); snd('arrow', .6, -sh.side * .5); } } }
  if (rm.eyes) for (const e of rm.eyes) { const d = Math.hypot(e.position.x + a.cx - P.x, e.position.z + a.cz - P.z); e.visible = !(DG.lighter && d < 6.5) && d > 2; if (Math.random() < dt * .3) e.scale.y = .1; else e.scale.y += (1 - e.scale.y) * Math.min(1, dt * 8); }
  if (rm.plates) { let all = true; for (const p of rm.plates) { if (Math.hypot(p.p.x - P.x, p.p.z - P.z) < 1 && P.y < .6) { if (p.t <= 0) snd('clunk', .6); p.t = 6; } p.t = Math.max(0, p.t - dt); p.m.position.y = p.t > 0 ? .02 : .05;
      p.m.material.emissive.setHex(p.t > 0 ? 0x06d6a0 : 0); p.m.material.emissiveIntensity = p.t > 0 ? .3 + p.t / 6 : 0; if (p.t <= 0) all = false; }
    if (all) { solve(rm, 'Hepsi yandı! Kapı açıldı'); } }
  if (rm.skels && rm.skels.length) for (const s of rm.skels) if (!s.gone) skelTick(s, dt, P);
  if (rm.type === 'skel' && rm.started && !rm.solved && (rm.skelN <= 0 || (rm.skels.length >= rm.skelN && rm.skels.every(s => !alive(s) && s.st !== 'rise')))) solve(rm, 'İskeletler yenildi! Kapı açıldı');
  if (rm.levers) for (const L of rm.levers) L.arm.rotation.x += ((L.on ? -.6 : .6) - L.arm.rotation.x) * Math.min(1, dt * 10);
  if (rm.chests) for (const c of rm.chests) c.lid.rotation.x += ((c.open ? -1.7 : 0) - c.lid.rotation.x) * Math.min(1, dt * 6);
  if (rm.chestT) rm.chestT.lid.rotation.x += ((rm.chestT.open ? -1.6 : 0) - rm.chestT.lid.rotation.x) * Math.min(1, dt * 5);
  if (rm.portal) { rm.portal.m.rotation.z += dt * 2; if (Math.hypot(rm.portal.p.x - P.x, rm.portal.p.z - P.z) < 1.4 && !DG.leaving) { DG.leaving = true; G.play('portal'); G.showMsg('🏆 ' + adT('Zindanı bitirdin!'), 2.6); setTimeout(() => goHome(), 700); } }
}
function prompt() {   // V istemi: kol, sandık, hazine
  if (G.curKey !== 'dungeon' || !DG.rooms.length) return null; const rm = DG.rooms[DG.cur]; if (!rm || !rm.built) return null; const P = G.player.position, tch = G.touchMode ? '👆 ' : 'V — ';
  if (rm.levers && !rm.solved) for (const L of rm.levers) if (!L.on && Math.hypot(L.p.x - P.x, L.p.z - P.z) < 1.5) return [tch + '🔀 ' + adT('Kolu çek'), () => pullLever(rm, L)];
  if (rm.chests) for (const c of rm.chests) if (!c.open && Math.hypot(c.p.x - P.x, c.p.z - P.z) < 1.8) return [tch + '📦 ' + adT('Sandığı aç'), () => openChest(rm, c)];
  if (rm.chestT && !rm.chestT.open && Math.hypot(rm.chestT.p.x - P.x, rm.chestT.p.z - P.z) < 2.2) return [tch + '👑 ' + adT('Hazineyi aç'), () => { rm.chestT.open = rm.chestOpened = true; G.progAdd(200, P); G.play('magic'); G.showMsg('💰 ' + adT('Kemik Kral’ın hazinesi! +200'), 2.4); }];
  return null;
}
function pullLever(rm, L) {
  L.on = true; snd('clunk'); const exp = rm.order[rm.got.length];
  if (L.i === exp) { rm.got.push(L.i); if (rm.got.length === rm.order.length) solve(rm, 'Doğru sıra! Kapı açıldı'); else G.showMsg('✔️ ' + rm.got.length + '/' + rm.order.length, .9); }
  else { snd('buzz'); G.showMsg('❌ ' + adT('Yanlış sıra! Kollar sıfırlandı'), 1.5); setTimeout(() => { if (rm.levers) for (const x of rm.levers) x.on = false; rm.got = []; snd('chain', .5); }, 600); }
}
function openChest(rm, c) {
  c.open = true; snd('creak', .6);
  if (c.key) { solve(rm, 'Anahtarı buldun! Kapı açıldı'); G.play('ding'); }
  else { const r = Math.random(); if (r < .35) { G.progAdd(5, c.p); } else if (r < .6) { DG.fuel = Math.min(100, DG.fuel + 40); G.showMsg('🧴 ' + adT('Çakmak gazı +40'), 1); } else { snd('rattle', .5); G.showMsg('🦴 ' + adT('Boş… sadece kemik'), 1); } }
}

/* ---------- 🖥️ arayüz ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>#dgHud{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top));transform:translateX(-50%);z-index:6;display:none;gap:7px;font:700 13px system-ui;color:#fff;pointer-events:none;white-space:nowrap}
#dgHud .pill{background:rgba(10,10,14,.75);border-radius:12px;padding:6px 10px;border:1px solid rgba(255,200,120,.22)}#dgHud .bar{width:70px;height:8px;border-radius:5px;background:rgba(255,255,255,.15);display:inline-block;vertical-align:middle;margin-left:6px;overflow:hidden}#dgHud .bar i{display:block;height:100%}
#dgFuel{background:linear-gradient(90deg,#e76f51,#ffd166)}#dgHp{background:linear-gradient(90deg,#d62828,#ff6b6b)}#dgExit{pointer-events:auto;cursor:pointer}
#dgLight{position:fixed;right:14px;top:42%;z-index:7;display:none;width:58px;height:58px;border-radius:50%;border:2px solid rgba(255,255,255,.4);background:rgba(10,10,14,.6);color:#fff;font-size:26px}#dgLight.on{background:rgba(255,180,80,.75)}
#dgBoss{position:fixed;left:50%;top:calc(52px + env(safe-area-inset-top));transform:translateX(-50%);z-index:6;width:min(420px,78vw);display:none;font:800 13px system-ui;color:#fff;text-align:center;text-shadow:0 1px 3px #000;pointer-events:none}#dgBoss .b{height:12px;border-radius:7px;background:rgba(0,0,0,.55);overflow:hidden;border:1px solid rgba(255,255,255,.3);margin-top:3px}#dgBoss .b i{display:block;height:100%;background:linear-gradient(90deg,#b3261e,#ff6b6b)}</style>`);
document.body.insertAdjacentHTML('beforeend', `<div id="dgHud"><div class="pill" id="dgRoom">🚪 1/${NROOM + 1}</div><div class="pill">❤️<span class="bar"><i id="dgHp"></i></span></div><div class="pill">🔥<span class="bar"><i id="dgFuel"></i></span></div><div class="pill" id="dgExit">🏳️ ${adT('Çık')}</div></div>
<button id="dgLight">🔥</button><div id="dgBoss">👑 ${adT('Kemik Kral')}<div class="b"><i id="dgBossB"></i></div></div>`);
for (const ev of ['pointerdown', 'mousedown', 'touchstart']) for (const id of ['dgExit', 'dgLight']) $(id).addEventListener(ev, e => e.stopPropagation(), { passive: true });
$('dgExit').addEventListener('click', e => { e.stopPropagation(); goHome(); });
$('dgLight').addEventListener('click', e => { e.stopPropagation(); toggleLighter(); });
function hud() {
  const on = G.curKey === 'dungeon' && !G.paused && !G.photoMode; $('dgHud').style.display = on ? 'flex' : 'none'; $('dgLight').style.display = on && G.touchMode ? 'block' : 'none'; if (!on) { $('dgBoss').style.display = 'none'; return; }
  $('dgRoom').textContent = `🚪 ${adT('Oda')} ${DG.cur + 1}/${NROOM + 1}`; $('dgFuel').style.width = DG.fuel + '%'; $('dgHp').style.width = Math.max(0, Math.min(100, G.hp / G.HPMAX * 100)) + '%'; $('dgLight').classList.toggle('on', DG.lighter);
  const B = DG.boss; $('dgBoss').style.display = B && alive(B) ? 'block' : 'none'; if (B) $('dgBossB').style.width = Math.max(0, B.hp / B.max * 100) + '%';
}
function toggleLighter() { if (!DG.lighter && DG.fuel <= 0) { G.showMsg('🔥 ' + adT('Gaz yok — gaz kutusu bul'), 1.2); return; } DG.lighter = !DG.lighter; snd(DG.lighter ? 'flick' : 'clunk', DG.lighter ? 1 : .25); }
function key(code) { if (G.curKey !== 'dungeon') return false; if (code === 'KeyF') { toggleLighter(); return true; } return false; }

/* ---------- 🗺️ giriş / çıkış ---------- */
function newRun(seed) {
  for (const r of DG.rooms) dispose(r); DG.seed = seed || ((Math.random() * 1e9) | 0) + 1; DG.rooms = plan(DG.seed); DG.cur = -1; DG.fuel = 100; DG.lighter = false; DG.boss = null; DG.leaving = false;
  for (const ar of DG.arrows) if (ar.m.parent) ar.m.parent.remove(ar.m); DG.arrows = [];
}
function area() {
  const on = G.curKey === 'dungeon';
  if (!on) { leaveFx(); return; }
  if (!DG.light) { DG.light = new T.PointLight(0xffb36b, 0, 13, 1.5); DG.g.add(DG.light); for (let i = 0; i < 4; i++) { const L = new T.PointLight(0xff9a4a, 0, 14, 1.5); L.userData.ph = i * 1.7; DG.g.add(L); DG.torchL.push(L); } }
  if (!DG.g.parent) G.scene.add(DG.g);
  const h = G.MP && G.MP.on && G.MP.regHint, sd = (h && h.dg) || DG.pend; DG.pend = 0;
  if (!DG.rooms.length || (sd && sd !== DG.seed)) newRun(sd);
  DG.on = true; DG.lT = 0; droneOn(true); tick(0);
}
function leaveFx() { if (DG.g.parent) G.scene.remove(DG.g); for (const r of DG.rooms) dispose(r); DG.rooms = []; DG.on = false; DG.lighter = false; droneOn(false); hud(); }
function open() {
  const busy = G.admBusy && G.admBusy(); if (busy) { G.showMsg(busy, 1.8); return; }
  const seed = ((Math.random() * 1e9) | 0) + 1, a = A(); DG.pend = seed;
  const mp = G.MP && G.MP.on && G.MP.started; if (mp) G.MP.hint = { dg: seed };
  G.teleportTo('dungeon', a.cx, a.cz + 3, 0, '🗝️ ' + adT('Zindana indin… dikkatli ol!'));
  if (mp && G.MP.hint && G.MP.hint.dg === seed) G.MP.hint = null;
}
function cam(Tg, c) {   // kamera duvarın / tavanın arkasına geçmesin
  if (G.curKey !== 'dungeon') return; const obs = []; for (let i = Math.max(0, DG.cur - 1); i <= Math.min(DG.rooms.length - 1, DG.cur + 1); i++) { const r = DG.rooms[i]; if (r && r.built) for (const o of r.obs) if (!o.pass && o.top > 3) obs.push(o); }
  const cx = c.x, cy = c.y, cz = c.z; let best = 1;
  for (let i = 1; i <= 24; i++) { const t = i / 24, x = Tg.x + (cx - Tg.x) * t, z = Tg.z + (cz - Tg.z) * t; if (obs.some(o => Math.abs(x - o.x) < o.hx + .22 && Math.abs(z - o.z) < o.hz + .22)) { best = Math.max(0, (i - 1.2) / 24); break; } }
  if (best < 1) c.set(Tg.x + (cx - Tg.x) * best, Tg.y + (cy - Tg.y) * best, Tg.z + (cz - Tg.z) * best);
  c.y = Math.min(c.y, WALLH - .3);
}
function goHome() { G.teleportTo('hub', 0, 7.5, 0, adT('🏡 Köye döndün')); }
function jumpTo(i) { const a = A(); for (let k = 0; k < i; k++) DG.rooms[k].solved = true; const nx = DG.rooms[i]; G.player.position.set(a.cx + nx.pdx, 0, a.cz + nx.z0 + 1.4); G.vel.set(0, 0, 0); tick(0); }

/* ---------- 🛠️ admin: zindan ---------- */
try {
  const need = () => G.curKey !== 'dungeon' ? adT('🗝️ Önce zindana git') : null;
  const cat = ['🗝️ Zindan', '🗝️ Dungeon', [
    ['dg_go', '🗝️', 'Zindana git (yeni)', 'Go to dungeon (new)', () => { open(); return '🗝️'; }],
    ['dg_next', '⏭️', 'Sonraki odaya geç', 'Skip to next room', () => need() || (jumpTo(Math.min(NROOM, DG.cur + 1)), '⏭️')],
    ['dg_open', '🔓', 'Bu odanın kapısını aç', 'Unlock this room', () => need() || (solve(DG.rooms[DG.cur], 'Kapı açıldı'), '🔓')],
    ['dg_boss', '👑', 'Kemik Kral’a ışınlan', 'Teleport to boss', () => need() || (jumpTo(NROOM), '👑')],
    ['dg_fuel', '🧴', 'Çakmak gazını doldur', 'Refill lighter', () => { DG.fuel = 100; return '🧴 100%'; }],
  ]];
  if (G.ADM_LIST && G.ADM_F) { G.ADM_LIST.splice(1, 0, cat); for (const [id, ic, tr, en, fn] of cat[2]) G.ADM_F[id] = { id, ic, tr, en, fn }; }
} catch (e) { console.warn('zindan admin', e); }

window.__dg = { targets, tick, area, cam, open, key, prompt, attack, ray, net, DG, newRun, jumpTo, plan };
})(window.__sftG);
