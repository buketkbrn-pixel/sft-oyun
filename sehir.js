/* 🏙️ S.F.T · Şehir (sehir.js) — 👽 dev uzaylı istilası, 🎖️ başkanın kahramanlık töreni, 👥 arkadaş grupları ve gerçek hayat dokunuşları:
   📰 son dakika bandı + 🚁 haber helikopteri · 🚑 acil durum ekipleri · 📱 seni çeken insanlar + ün · 🌭 sokak büfeleri · 🚕 taksi çağırma · 🏥 hastanede uyanma.
   index.html bunu yükler; oyunun değişkenlerine window.__sftG (G) ile erişir. Tasarımlar bu oyuna özgüdür. */
(function (G) {
'use strict';
const T = G.THREE, $ = id => document.getElementById(id), adT = s => G.adT(s), R = (a, b) => a + Math.random() * (b - a), pick = a => a[(Math.random() * a.length) | 0];
const V1 = new T.Vector3(), V2 = new T.Vector3(), V3 = new T.Vector3(), UP = new T.Vector3(0, 1, 0);
const inCity = () => G.curKey === 'city' && G.CITY && G.CITY.built, CA = () => G.AREAS.city;
const play = (n, o) => { try { G.play(n, o); } catch (e) {} };
const news = t => { try { G.cyNews(t); } catch (e) {} ticker(t); };
const say = (n, t, d) => { try { G.cySay(n, t, d); } catch (e) {} };

/* ---------- 🔊 sesler ---------- */
let AC = null, OUT = null, NB = null;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); OUT = AC.createGain(); OUT.gain.value = .5; OUT.connect(AC.destination); } catch (e) { return null; } } if (AC.state === 'suspended') AC.resume().catch(() => {}); return AC; }
function snd(kind, vol = 1, dist = 0) {
  const c = ac(); if (!c || c.state !== 'running') return; const v0 = vol * Math.max(.08, 1 - dist / 300), t = c.currentTime;
  const tone = (type, f0, f1, a, d, v) => { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t + a); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + a + d); g.gain.setValueAtTime(0, t + a); g.gain.linearRampToValueAtTime(v * v0, t + a + .02); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); o.connect(g); g.connect(OUT); o.start(t + a); o.stop(t + a + d + .05); };
  const noise = (a, d, f, q, v, type = 'bandpass') => { if (!NB) { NB = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const ch = NB.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; } const n = c.createBufferSource(); n.buffer = NB; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = c.createGain(); g.gain.setValueAtTime(v * v0, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); n.connect(fl); fl.connect(g); g.connect(OUT); n.start(t + a); n.stop(t + a + d + .05); };
  if (kind === 'roar') { tone('sawtooth', 120, 60, 0, 1.6, .18); tone('sawtooth', 180, 80, .05, 1.4, .12); noise(0, 1.5, 400, .6, .25, 'lowpass'); tone('square', 90, 45, .2, 1.2, .08); }
  else if (kind === 'stomp') { noise(0, .5, 120, .8, .4, 'lowpass'); tone('sine', 60, 30, 0, .5, .25); }
  else if (kind === 'smash') { noise(0, 1.2, 300, .5, .5, 'lowpass'); noise(0, .8, 2200, .7, .2); tone('sine', 70, 28, 0, 1, .3); }
  else if (kind === 'laser') { tone('sawtooth', 900, 400, 0, .25, .06); tone('square', 1400, 700, 0, .2, .04); }
  else if (kind === 'boom') { noise(0, .9, 500, .5, .45, 'lowpass'); tone('sine', 90, 35, 0, .8, .25); }
  else if (kind === 'portal') { tone('sine', 120, 900, 0, 3, .1); tone('triangle', 60, 300, 0, 3, .08); noise(0, 3, 600, 2, .08); }
  else if (kind === 'siren') { for (let i = 0; i < 4; i++) { tone('triangle', 960, 960, i * .5, .25, .05); tone('triangle', 720, 720, i * .5 + .25, .25, .05); } }
  else if (kind === 'firework') { tone('sine', 400, 1600, 0, .6, .03); noise(.6, .7, 900, .5, .35, 'lowpass'); for (let k = 0; k < 6; k++) noise(.7 + k * .07, .08, 4000, 1, .06); }
  else if (kind === 'cheer') { for (let k = 0; k < 10; k++) tone('sawtooth', R(300, 600), R(500, 900), k * .06, .6, .012); noise(0, 2, 1400, .4, .12); }
  else if (kind === 'clap') { for (let k = 0; k < 24; k++) noise(k * .07 + R(0, .04), .05, 2500, 1, .1); }
  else if (kind === 'fanfare') { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone('square', f, f, i * .22, .3, .05)); }
  else if (kind === 'heli') { for (let k = 0; k < 10; k++) noise(k * .1, .07, 160, .7, .08, 'lowpass'); }
  else if (kind === 'horn') { tone('square', 420, 420, 0, .35, .05); tone('square', 520, 520, 0, .35, .04); }
  else if (kind === 'coin') { tone('square', 988, 988, 0, .08, .05); tone('square', 1319, 1319, .08, .25, .05); }
}

/* ---------- ✨ parçacıklar (patlama, havai fişek, konfeti) ---------- */
const NP = 2400, pPos = new Float32Array(NP * 3).fill(-1e5), pCol = new Float32Array(NP * 3), pD = [...Array(NP)].map(() => ({ l: 0, m: 1, v: new T.Vector3(), c: new T.Color(), g: 1 }));
const pGeo = new T.BufferGeometry(); pGeo.setAttribute('position', new T.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new T.BufferAttribute(pCol, 3));
const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new T.CanvasTexture(c); return t; })();
const parts = new T.Points(pGeo, new T.PointsMaterial({ size: 1.4, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false })); parts.frustumCulled = false; G.scene.add(parts);
let pI = 0;
function emit(x, y, z, vx, vy, vz, life, col, grav = 1) { const i = pI = (pI + 1) % NP, d = pD[i]; d.l = d.m = life; d.v.set(vx, vy, vz); d.c.setHex(col); d.g = grav; pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z; }
function burst(x, y, z, n, sp, cols, life = 1.2, grav = 1) { for (let k = 0; k < n; k++) { V1.set(R(-1, 1), R(-1, 1), R(-1, 1)).normalize().multiplyScalar(sp * R(.4, 1)); emit(x, y, z, V1.x, V1.y, V1.z, R(life * .6, life), Array.isArray(cols) ? pick(cols) : cols, grav); } }
function partsTick(dt) { for (let i = 0; i < NP; i++) { const d = pD[i]; if (d.l <= 0) continue; d.l -= dt; if (d.l <= 0) { pPos[i * 3 + 1] = -1e5; continue; } const k = Math.min(1, d.l / d.m * 1.5); d.v.y -= 9.8 * d.g * dt; d.v.multiplyScalar(Math.exp(-.6 * dt)); pPos[i * 3] += d.v.x * dt; pPos[i * 3 + 1] += d.v.y * dt; pPos[i * 3 + 2] += d.v.z * dt; pCol[i * 3] = d.c.r * k; pCol[i * 3 + 1] = d.c.g * k; pCol[i * 3 + 2] = d.c.b * k; } pGeo.attributes.position.needsUpdate = pGeo.attributes.color.needsUpdate = true; }
function shake(k, x, z) { const P = G.player.position, d = x == null ? 0 : Math.hypot(P.x - x, P.z - z); G.shake = Math.max(G.shake, k * Math.max(0, 1 - d / 260)); }

/* ---------- 📰 son dakika bandı ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>
#shTick{position:fixed;left:0;right:0;top:calc(52px + env(safe-area-inset-top));z-index:6;display:none;height:26px;background:#b71c1c;color:#fff;font:700 14px/26px system-ui;overflow:hidden;box-shadow:0 2px 8px #0006}
#shTick b{position:absolute;left:0;top:0;bottom:0;padding:0 10px;background:#7f0000;z-index:1}#shTick span{position:absolute;white-space:nowrap;left:100%;animation:shScroll 16s linear infinite}
@keyframes shScroll{to{transform:translateX(calc(-100% - 100vw))}}
#shBoss{position:fixed;left:50%;top:calc(84px + env(safe-area-inset-top));transform:translateX(-50%);z-index:6;display:none;min-width:240px;padding:6px 12px;border-radius:12px;background:#0b1a10e0;color:#d8ffd8;font:700 13px system-ui;text-align:center;border:1px solid #4caf50}
#shBoss .hb{height:8px;border-radius:4px;background:#333;margin-top:4px;overflow:hidden}#shBoss .hb i{display:block;height:100%;background:linear-gradient(90deg,#76ff03,#00e676)}
#shCer{position:fixed;inset:0;z-index:58;pointer-events:none;display:none}#shCer .bar{position:absolute;left:0;right:0;height:8vh;background:#000}#shCer .bt{top:0}#shCer .bb{bottom:0}
#shCer .bb2,#shUI .bb2{position:absolute;transform:translate(-50%,-100%);background:#fff;color:#222;padding:5px 10px;border-radius:12px;font:700 14px system-ui;white-space:nowrap;box-shadow:0 2px 8px #0006}
#shSkip{position:absolute;right:14px;bottom:calc(8vh + 10px);pointer-events:auto;padding:8px 14px;border-radius:18px;border:1px solid #fff8;background:#0008;color:#fff;font:600 14px system-ui}
#shFame{position:fixed;left:12px;top:calc(96px + env(safe-area-inset-top));z-index:6;display:none;padding:3px 9px;border-radius:12px;background:#000a;color:#fff;font:700 12px system-ui}
#shTaxi{position:fixed;left:12px;top:calc(122px + env(safe-area-inset-top));z-index:6;display:none;padding:5px 10px;border-radius:14px;border:1px solid #ffd54f;background:#3a2c00e0;color:#ffe082;font:700 13px system-ui}
#shTaxiM{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:30;display:none;width:min(92vw,420px);max-height:80vh;overflow:auto;padding:12px;border-radius:16px;background:#1c1a14f2;color:#fff;font:600 14px system-ui;box-shadow:0 8px 30px #000a}
#shTaxiM h3{margin:0 0 8px;font-size:17px}#shTaxiM button{display:block;width:100%;margin:5px 0;padding:9px;border-radius:10px;border:1px solid #ffd54f66;background:#2c2717;color:#fff;font:600 14px system-ui;text-align:left}
</style>`);
document.body.insertAdjacentHTML('beforeend', `<div id="shTick"><b>🔴 ${adT('SON DAKİKA')}</b><span></span></div><div id="shBoss"></div><div id="shFame"></div><button id="shTaxi">🚕 ${adT('Taksi çağır')}</button><div id="shTaxiM"></div>
<div id="shCer"><div class="bar bt"></div><div class="bar bb"></div><button id="shSkip">⏭ ${adT('Geç')}</button></div><div id="shUI" style="position:fixed;inset:0;pointer-events:none;z-index:7"></div>`);
for (const id of ['shTaxi', 'shTaxiM', 'shSkip']) for (const ev of ['pointerdown', 'mousedown', 'touchstart']) $(id).addEventListener(ev, e => e.stopPropagation(), { passive: true });
let tickT = 0;
function ticker(t, dur = 16) { const el = $('shTick'); el.querySelector('span').textContent = t + '  •  ' + t; el.style.display = 'block'; tickT = dur; }

/* ---------- 👽 dev uzaylı (özgün tasarım: üç gözlü, kubbe kafalı, zırhlı, uzun kollu) ---------- */
function makeAlien(leader) {
  const root = new T.Group(), body = new T.Group(); root.add(body);
  const skin = new T.MeshStandardMaterial({ color: leader ? 0x7b2fa8 : 0x3f9a5c, roughness: .5, metalness: .1, emissive: leader ? 0x2a0838 : 0x0b2414, emissiveIntensity: .5 });
  const armor = new T.MeshStandardMaterial({ color: leader ? 0x1d1a24 : 0x2b3340, roughness: .3, metalness: .75 }), eyeM = new T.MeshBasicMaterial({ color: leader ? 0xff2e63 : 0xffa000, toneMapped: false });
  const cap = (r, L, m) => new T.Mesh(new T.CapsuleGeometry(r, L, 4, 10), m), sph = (r, m) => new T.Mesh(new T.SphereGeometry(r, 18, 14), m);
  const legs = []; for (const s of [-1, 1]) { const hip = new T.Group(); hip.position.set(s * .75, 4.2, 0); body.add(hip); const th = cap(.45, 1.6, skin); th.position.y = -1; hip.add(th); const kn = new T.Group(); kn.position.y = -2.05; hip.add(kn); const sh = cap(.36, 1.7, skin); sh.position.y = -1.05; kn.add(sh); const pad = cap(.5, .5, armor); pad.position.set(0, -.15, .2); pad.rotation.x = 1.4; kn.add(pad); const ft = new T.Mesh(new T.BoxGeometry(.9, .35, 1.6), armor); ft.position.set(0, -2.05, .35); kn.add(ft); legs.push({ hip, kn }); }
  const torso = cap(1.15, 1.8, skin); torso.position.y = 5.9; body.add(torso); const chest = new T.Mesh(new T.CylinderGeometry(1.25, 1.0, 1.9, 8, 1, true), armor); chest.position.set(0, 6.2, .1); chest.material.side = T.DoubleSide; body.add(chest);
  const core = sph(.35, eyeM); core.position.set(0, 6.3, 1.18); body.add(core);
  const neck = new T.Group(); neck.position.y = 7.6; body.add(neck); const nk = cap(.35, .6, skin); nk.position.y = .3; neck.add(nk);
  const head = sph(1.25, skin); head.scale.set(1, 1.35, 1.1); head.position.y = 1.65; neck.add(head); const eyes = [];
  for (const [x, y, r] of [[-.45, 1.75, .26], [.45, 1.75, .26], [0, 2.25, .2]]) { const e = sph(r, eyeM); e.position.set(x, y, 1.05); neck.add(e); eyes.push(e); }
  for (const s of [-1, 1]) { const an = new T.Mesh(new T.CylinderGeometry(.05, .08, 1.4, 6), armor); an.position.set(s * .6, 3.3, -.2); an.rotation.z = -s * .45; neck.add(an); const tip = sph(.16, eyeM); tip.position.set(s * .9, 3.95, -.2); neck.add(tip); }
  if (leader) for (let k = 0; k < 5; k++) { const sp = new T.Mesh(new T.ConeGeometry(.22, 1.2, 6), armor); const a = (k - 2) * .45; sp.position.set(Math.sin(a) * 1.0, 3.1, Math.cos(a) * .3 - .5); sp.rotation.set(-.4, 0, -a * .8); neck.add(sp); }
  const arms = []; for (const s of [-1, 1]) { const sh = new T.Group(); sh.position.set(s * 1.55, 7.1, 0); body.add(sh); const sp = sph(.6, armor); sh.add(sp); const up = cap(.32, 1.9, skin); up.position.y = -1.2; sh.add(up); const el = new T.Group(); el.position.y = -2.4; sh.add(el); const fo = cap(.28, 1.9, skin); fo.position.y = -1.15; el.add(fo);
    const hand = new T.Group(); hand.position.y = -2.4; el.add(hand); const pm = sph(.45, skin); pm.scale.set(1, .7, 1); hand.add(pm); for (let k = 0; k < 3; k++) { const cl = new T.Mesh(new T.ConeGeometry(.12, .9, 6), armor); cl.position.set((k - 1) * .25, -.6, .15); cl.rotation.x = Math.PI; hand.add(cl); } arms.push({ sh, el, hand }); }
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  return { root, body, legs, arms, neck, eyes, mats: [skin, armor] };
}
const INV = { st: 'off', t: 0, al: [], wave: 0, portal: null, coolT: 90, warnT: 0, kills: 0, beams: [], cerWait: 0 };
const BASE_H = 10.6;   // tasarım boyu (birim)
function alienSpawn(leader, x, z) {
  const m = makeAlien(leader), sc = leader ? 5.2 : 3.4, H = BASE_H * sc;
  m.root.scale.setScalar(sc); G.scene.add(m.root);
  const a = { m, leader, sc, H, r: 1.6 * sc, pos: new T.Vector3(x, 160, z), vy: -20, hp: leader ? 4200 : 1500, max: leader ? 4200 : 1500, st: 'fall', t: 0, atkT: R(3, 6), tgt: null, face: R(0, 6.28), walkPh: 0, hurtT: 0, beam: null, dead: false };
  INV.al.push(a); return a;
}
function alienHurt(a, d) {
  if (a.dead || a.st === 'fall') return; a.hp -= d; a.hurtT = .15; if (Math.random() < .25) burst(a.pos.x + R(-a.r, a.r), a.pos.y + R(a.H * .3, a.H * .8), a.pos.z + R(-a.r, a.r), 6, 6, [0x76ff03, 0xccff90], .6);
  if (a.hp <= 0) alienDie(a);
}
function alienDie(a) {
  a.dead = true; a.st = 'die'; a.t = 0; INV.kills++; if (a.beam) { a.beam.visible = false; } snd('roar', .9); snd('boom', 1);
  news(a.leader ? adT('Uzaylı lideri yenildi!') : adT('Dev bir uzaylı yere serildi!')); try { G.progAdd(a.leader ? 1500 : 500, a.pos.clone().setY(2), adT('Uzaylı yenildi')); } catch (e) {}
}
function alienTargets() {
  const L = []; for (const a of INV.al) { if (a.dead || a.st === 'fall') continue; L.push({ id: a, p: a.pos, h: a.H, r: a.r, hit: (d, dir, k) => alienHurt(a, d), set: (x, y, z) => a.pos.set(x, y, z) }); } return L;
}
function rayHit(o, d, best, dmg) {   // 🔫 mermi: dikey kapsüle çarpar mı
  let hit = null, ht = best;
  for (const a of INV.al) { if (a.dead || a.st === 'fall') continue; const dx = o.x - a.pos.x, dz = o.z - a.pos.z, A2 = d.x * d.x + d.z * d.z, B = 2 * (dx * d.x + dz * d.z), C = dx * dx + dz * dz - a.r * a.r, D = B * B - 4 * A2 * C; if (D < 0 || A2 < 1e-9) continue;
    const t = (-B - Math.sqrt(D)) / (2 * A2); if (t < 0 || t > ht) continue; const y = o.y + d.y * t; if (y < a.pos.y || y > a.pos.y + a.H) continue; ht = t; hit = a; }
  if (hit) { alienHurt(hit, dmg); burst(o.x + d.x * ht, o.y + d.y * ht, o.z + d.z * ht, 8, 5, 0x76ff03, .5); return ht; } return null;
}
function blast(x, y, z, r, dmg) { if (!dmg) return; for (const a of INV.al) { if (a.dead || a.st === 'fall') continue; const d = Math.hypot(x - a.pos.x, z - a.pos.z); if (d > r + a.r || y > a.pos.y + a.H + r) continue; alienHurt(a, dmg * .5); } }
function punch(dir) { const P = G.player.position; for (const a of INV.al) { if (a.dead || a.st === 'fall') continue; if (Math.hypot(P.x - a.pos.x, P.z - a.pos.z) < a.r + 2.6 && P.y < a.pos.y + a.H) { alienHurt(a, G.giant ? 120 : 15); burst(P.x + dir.x * 1.5, P.y + 1.2, P.z + dir.z * 1.5, 6, 4, 0x76ff03, .4); } } }
let BB = null; function cityBounds() { if (!BB) { const A = CA(); BB = { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 }; for (const n of G.CITY.nodes) { BB.x0 = Math.min(BB.x0, A.cx + n.x); BB.x1 = Math.max(BB.x1, A.cx + n.x); BB.z0 = Math.min(BB.z0, A.cz + n.z); BB.z1 = Math.max(BB.z1, A.cz + n.z); } } return BB; }
function pickBld(near, rad) { const A = CA(), B = G.CITY.bld; let best = null, bs = -1; for (let k = 0; k < 18; k++) { const b = B[(Math.random() * B.length) | 0]; if (!b || b[5]) continue; const x = A.cx + b[0], z = A.cz + b[1], d = Math.hypot(x - near.x, z - near.z); if (d > rad) continue; const s = b[4] - d * .05; if (s > bs) { bs = s; best = { x, z, h: b[4], w: b[2], dd: b[3] }; } } return best; }
function handWorld(a, s, out) { return a.m.arms[s].hand.getWorldPosition(out); }
function beamMesh() { const g = new T.Group(), m1 = new T.Mesh(new T.CylinderGeometry(.6, .6, 1, 10, 1, true).translate(0, .5, 0), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .95, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false })), m2 = new T.Mesh(new T.CylinderGeometry(2, 2, 1, 12, 1, true).translate(0, .5, 0), new T.MeshBasicMaterial({ color: 0xff5a1f, transparent: true, opacity: .45, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false })); g.add(m1, m2); g.traverse(o => o.frustumCulled = false); G.scene.add(g); return g; }
function alienTick(a, dt, t) {
  const m = a.m, P = G.player.position; a.t += dt; a.hurtT = Math.max(0, a.hurtT - dt);
  for (const mt of m.mats) mt.emissiveIntensity = a.hurtT > 0 ? 1.4 : .5;
  if (a.st === 'fall') { a.vy -= 40 * dt; a.pos.y += a.vy * dt; emit(a.pos.x + R(-3, 3), a.pos.y + a.H * .5, a.pos.z + R(-3, 3), R(-2, 2), 10, R(-2, 2), 1.2, pick([0xff6d00, 0xffab00, 0x76ff03]), .2);
    if (a.pos.y <= 0) { a.pos.y = 0; a.st = 'walk'; a.t = 0; snd('smash', 1.2, Math.hypot(P.x - a.pos.x, P.z - a.pos.z)); snd('roar', 1); shake(.9, a.pos.x, a.pos.z); try { G.cyBlast(a.pos.x, 2, a.pos.z, 22, 500); } catch (e) {} burst(a.pos.x, 2, a.pos.z, 160, 30, [0x9e9e9e, 0x8d6e63, 0xff6d00], 2, .6); ring(a.pos, 40); flee(a.pos, 90); }
    m.root.position.copy(a.pos); return; }
  if (a.st === 'die') { const k = Math.min(1, a.t / 2.2); m.body.rotation.x = -k * 1.45; m.root.position.copy(a.pos); if (a.t > 2.2 && a.t - dt <= 2.2) { snd('smash', 1.3, Math.hypot(P.x - a.pos.x, P.z - a.pos.z)); shake(.8, a.pos.x, a.pos.z); try { G.cyBlast(a.pos.x, 2, a.pos.z - a.H * .5, 16, 200); } catch (e) {} burst(a.pos.x, 4, a.pos.z, 200, 25, [0x76ff03, 0xb2ff59, 0xffffff], 2.5, .3); }
    if (a.t > 2.6) { const f = Math.min(1, (a.t - 2.6) / 1.4); m.root.scale.setScalar(a.sc * (1 - f)); if (Math.random() < .8) emit(a.pos.x + R(-a.H * .5, a.H * .5) * .3, R(1, 8), a.pos.z - R(0, a.H * .8), 0, R(2, 6), 0, 1.4, 0x76ff03, -.1); }
    if (a.t > 4) { G.scene.remove(m.root); a.gone = true; } return; }
  if (a.__frz > 0) { m.root.position.copy(a.pos); return; }   // ❄️ buzla donmuş
  // 🎯 hedef: oyuncunun yakınındaki binalar; çok yakınsa oyuncuya saldırır
  const dP = Math.hypot(P.x - a.pos.x, P.z - a.pos.z);
  if (!a.tgt || a.t > 25) { a.t = 0; a.tgt = pickBld(dP < 220 ? P : a.pos, 160) || { x: P.x + R(-60, 60), z: P.z + R(-60, 60), h: 20 }; }
  const tx = a.tgt.x, tz = a.tgt.z, dT = Math.hypot(tx - a.pos.x, tz - a.pos.z), want = Math.atan2(tx - a.pos.x, tz - a.pos.z);
  let dA = ((want - a.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI; a.face += dA * Math.min(1, dt * 1.2);
  a.atkT -= dt;
  const busy = a.st === 'smash' || a.st === 'laser';
  if (!busy) {
    const walkSp = (a.leader ? 6 : 4.5);
    if (dT > a.r + 14) { a.pos.x += Math.sin(a.face) * walkSp * dt; a.pos.z += Math.cos(a.face) * walkSp * dt; a.walkPh += dt * walkSp / (a.sc * 1.1);
      const ph = a.walkPh; m.legs[0].hip.rotation.x = Math.sin(ph) * .45; m.legs[1].hip.rotation.x = -Math.sin(ph) * .45; m.legs[0].kn.rotation.x = Math.max(0, -Math.sin(ph)) * .7; m.legs[1].kn.rotation.x = Math.max(0, Math.sin(ph)) * .7; m.arms[0].sh.rotation.x = -Math.sin(ph) * .35; m.arms[1].sh.rotation.x = Math.sin(ph) * .35; m.body.position.y = Math.abs(Math.cos(ph)) * .15;
      if (Math.floor(ph / Math.PI) !== Math.floor((ph - dt * walkSp / (a.sc * 1.1)) / Math.PI)) { snd('stomp', .8, dP); shake(.18, a.pos.x, a.pos.z); try { G.cyBlast(a.pos.x, 1, a.pos.z, 6, 80); } catch (e) {} for (let k = 0; k < 10; k++) emit(a.pos.x + R(-4, 4), .5, a.pos.z + R(-4, 4), R(-3, 3), R(1, 4), R(-3, 3), 1, 0x9e9e9e, .6); } }
    if (a.atkT <= 0) { a.atkT = R(4, 7) * (a.leader ? .7 : 1); const near = dP < 70 || dT < a.r + 20; a.st = near && Math.random() < .6 ? 'smash' : 'laser'; a.t2 = 0; a.aim = near && dP < 70 ? P.clone() : new T.Vector3(tx, 0, tz); if (a.st === 'laser') { a.aim0 = a.pos.clone().add(V1.set(Math.sin(a.face) * 20, 0, Math.cos(a.face) * 20)); snd('laser', 1, dP); } }
  }
  if (a.st === 'smash') { a.t2 += dt; const k = a.t2; const s = 1;   // sağ kol kalkar ve iner
    if (k < .9) { m.arms[s].sh.rotation.x += (-2.9 - m.arms[s].sh.rotation.x) * Math.min(1, dt * 6); m.arms[s].el.rotation.x = -.4; }
    else if (k < 1.15) { m.arms[s].sh.rotation.x += (.6 - m.arms[s].sh.rotation.x) * Math.min(1, dt * 18); m.body.rotation.x = .25; }
    if (k >= 1.15 && !a.hit) { a.hit = true; const hp = handWorld(a, s, V2); hp.y = 0; snd('smash', 1.4, dP); shake(.7, hp.x, hp.z); try { G.cyBlast(hp.x, 6, hp.z, 16, 450); } catch (e) {} burst(hp.x, 3, hp.z, 140, 26, [0x9e9e9e, 0x795548, 0xffab40], 2, .7); ring(hp, 30); flee(hp, 80); dispatch(hp);
      if (Math.hypot(P.x - hp.x, P.z - hp.z) < 18 && !G.giant) hurtPlayer(25); }
    if (k > 1.9) { a.st = 'walk'; a.hit = false; m.body.rotation.x = 0; } }
  else if (a.st === 'laser') { a.t2 += dt; const k = Math.min(1, a.t2 / 2.4); if (!a.beam) a.beam = beamMesh(); a.beam.visible = true;
    const tp = V3.lerpVectors(a.aim0, a.aim, k); tp.y = 0; m.neck.lookAt(V1.set(tp.x, tp.y, tp.z)); m.neck.rotation.y -= a.face;   // kafa hedefe
    const eo = m.eyes[2].getWorldPosition(V2), dv = V1.subVectors(tp, eo), L = dv.length(); a.beam.position.copy(eo); a.beam.quaternion.setFromUnitVectors(UP, dv.normalize()); a.beam.scale.set(a.sc * .25, L, a.sc * .25);
    a.lzT = (a.lzT || 0) - dt; if (a.lzT <= 0) { a.lzT = .18; try { G.cyBlast(tp.x, 2, tp.z, 7, 110); } catch (e) {} burst(tp.x, 1, tp.z, 24, 12, [0xff6d00, 0xffd180, 0xffffff], 1, .8); if (Math.random() < .3) snd('boom', .5, dP); if (Math.hypot(P.x - tp.x, P.z - tp.z) < 5 && !G.giant) hurtPlayer(6); }
    if (k >= 1) { a.st = 'walk'; a.beam.visible = false; m.neck.rotation.set(0, 0, 0); dispatch(tp.clone()); } }
  // 🏙️ şehir sınırı
  const bb = cityBounds(); a.pos.x = Math.max(bb.x0 + 20, Math.min(bb.x1 - 20, a.pos.x)); a.pos.z = Math.max(bb.z0 + 20, Math.min(bb.z1 - 20, a.pos.z));
  m.root.position.copy(a.pos); m.root.rotation.y = a.face; m.arms[1].hand.rotation.z = Math.sin(t * 2) * .1;
}
function hurtPlayer(d) { try { if (G.damagePlayer) G.damagePlayer(d); } catch (e) {} }
const rings = [];
function ring(p, r) { const m = new T.Mesh(new T.RingGeometry(.8, 1, 48).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0xfff3e0, transparent: true, opacity: .8, side: T.DoubleSide, depthWrite: false })); m.position.set(p.x, .4, p.z); G.scene.add(m); rings.push({ m, t: 0, r }); }
function ringsTick(dt) { for (let i = rings.length - 1; i >= 0; i--) { const q = rings[i]; q.t += dt; const k = q.t / .8; q.m.scale.setScalar(1 + k * q.r); q.m.material.opacity = .8 * (1 - k); if (k >= 1) { G.scene.remove(q.m); q.m.geometry.dispose(); q.m.material.dispose(); rings.splice(i, 1); } } }
function flee(p, r) { try { for (const n of G.CITY.peds) { if (n.dead || !n.holder.visible || n.state === 'held' || n.follow) continue; if (Math.hypot(n.holder.position.x - p.x, n.holder.position.z - p.z) < r) { if (n.grp) grpRelease(n.grp); n.flee = 4; if (Math.random() < .08) say(n, pick([adT('Kaçııın!'), adT('Uzaylılar!!'), adT('İmdaaat!'), adT('Bu ne böyle?!')]), 1.6); } } } catch (e) {} }
function makePortal() { const g = new T.Group(); const tor = new T.Mesh(new T.TorusGeometry(40, 4, 12, 60), new T.MeshBasicMaterial({ color: 0x76ff03, transparent: true, opacity: .8, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false })); tor.rotation.x = Math.PI / 2; g.add(tor);
  const disk = new T.Mesh(new T.CircleGeometry(40, 48), new T.MeshBasicMaterial({ color: 0x1b0033, transparent: true, opacity: .85, side: T.DoubleSide, depthWrite: false })); disk.rotation.x = Math.PI / 2; g.add(disk); g.traverse(o => o.frustumCulled = false); G.scene.add(g); return g; }
function invStart() {
  if (INV.st !== 'off' || !inCity()) return false; const P = G.player.position; INV.st = 'warn'; INV.t = 0; INV.al = []; INV.wave = 0; INV.kills = 0;
  INV.portal = makePortal(); INV.portal.position.set(P.x + R(-40, 40), 230, P.z + R(-40, 40)); INV.portal.scale.setScalar(.01);
  snd('portal', 1); news(adT('Gökyüzünde dev bir uzay kapısı açıldı!')); G.showMsg('📡 ' + adT('Gökyüzünde garip bir sinyal… Uzay kapısı açılıyor!'), 3.5); return true;
}
function invTick(dt, t) {
  if (INV.st === 'off') { if (inCity() && !G.CITY.ev && !CER.on) { INV.coolT -= dt; if (INV.coolT <= 0) { INV.coolT = R(300, 480); invStart(); } } return; }
  INV.t += dt; const P = G.player.position;
  if (INV.portal) { const pk = INV.st === 'won' ? Math.max(0, 1 - INV.t / 2) : Math.min(1, INV.t / 3); INV.portal.scale.setScalar(Math.max(.01, pk)); INV.portal.rotation.y += dt * .6; if (Math.random() < .5) emit(INV.portal.position.x + R(-40, 40), INV.portal.position.y, INV.portal.position.z + R(-40, 40), 0, -R(4, 12), 0, 2, 0x76ff03, .1); }
  if (INV.st === 'warn' && INV.t > 5) { INV.st = 'fight'; INV.t = 0; for (let k = 0; k < 3; k++) { const ang = k / 3 * 6.28 + R(-.4, .4), d = R(70, 120); alienSpawn(false, P.x + Math.sin(ang) * d, P.z + Math.cos(ang) * d); }
    news(adT('Dev uzaylılar şehre saldırıyor! Halk kaçışıyor!')); G.showMsg('👽 ' + adT('DEV UZAYLILAR ŞEHRE İNDİ! Onları her şekilde durdur: yumruk, silah, dev ol, kozmik küre, şimşek, buz…'), 5); }
  for (const a of INV.al) alienTick(a, dt, t);
  INV.al = INV.al.filter(a => !a.gone);
  if (INV.st === 'fight') { const alive = INV.al.filter(a => !a.dead);
    if (!alive.length) { if (INV.wave === 0) { INV.wave = 1; INV.st = 'leaderWait'; INV.t = 0; G.showMsg('⚠️ ' + adT('Yer sarsılıyor… Uzaylıların lideri geliyor!'), 3); news(adT('Uzaylıların lideri geliyor!')); snd('portal', 1); } }
    if (INV.t > 480) invRetreat(); }
  if (INV.st === 'leaderWait' && INV.t > 4) { INV.st = 'fight'; INV.t = 0; INV.wave = 2; const ang = R(0, 6.28); alienSpawn(true, P.x + Math.sin(ang) * 110, P.z + Math.cos(ang) * 110); }
  if (INV.st === 'fight' && INV.wave === 2 && !INV.al.some(a => !a.dead)) { INV.st = 'won'; INV.t = 0; snd('fanfare', 1); news(adT('KAHRAMAN ŞEHRİ KURTARDI! Başkan tören düzenliyor')); G.showMsg('🏆 ' + adT('Şehri kurtardın! Başkan seni meydandaki sahneye çağırıyor…'), 4); INV.cerWait = 0; }
  if (INV.st === 'won') { if (INV.t > 2.2 && INV.portal) { G.scene.remove(INV.portal); INV.portal = null; }
    if (INV.t > 5) { if (G.giant) { INV.cerWait += dt; if (INV.cerWait % 8 < dt) G.showMsg('🎖️ ' + adT('Tören için normal boyuna dön (B)'), 2.5); if (INV.cerWait < 90) return; } INV.st = 'off'; cerStart(); } }
  // 🎛️ üst bilgi
  const live = INV.al.filter(a => !a.dead), el = $('shBoss'); if (live.length && INV.st === 'fight') { const hp = live.reduce((s, a) => s + Math.max(0, a.hp), 0), mx = live.reduce((s, a) => s + a.max, 0); el.style.display = 'block'; el.innerHTML = `${INV.wave === 2 ? '👑 ' + adT('UZAYLI LİDERİ') : '👽 ' + adT('DEV UZAYLILAR') + ' · ' + live.length + '/3'}<div class="hb"><i style="width:${(hp / mx * 100).toFixed(1)}%"></i></div>`; } else el.style.display = 'none';
}
function invRetreat() { for (const a of INV.al) if (!a.dead) { a.dead = true; a.st = 'die'; a.t = 2.6; } INV.st = 'won'; INV.t = 3; news(adT('Uzaylılar geri çekildi.')); G.showMsg('🛸 ' + adT('Uzaylılar geri çekildi'), 3); }
function invStop() { for (const a of INV.al) { G.scene.remove(a.m.root); if (a.beam) G.scene.remove(a.beam); } INV.al = []; if (INV.portal) { G.scene.remove(INV.portal); INV.portal = null; } INV.st = 'off'; $('shBoss').style.display = 'none'; }

/* ---------- 🚑 acil durum ekipleri: hasar gören yere ambulans / itfaiye gelir ---------- */
const EMS = { list: [], cd: 0 };
function vehMesh(kind) {
  const g = new T.Group(), col = kind === 'fire' ? 0xd32f2f : 0xffffff, M = c => new T.MeshStandardMaterial({ color: c, roughness: .5, metalness: .2 });
  const b = new T.Mesh(new T.BoxGeometry(2.3, 1.9, kind === 'fire' ? 6.5 : 5), M(col)); b.position.y = 1.4; g.add(b); const cab = new T.Mesh(new T.BoxGeometry(2.25, 1.2, 1.4), M(kind === 'fire' ? 0xb71c1c : 0xf5f5f5)); cab.position.set(0, 1.0, (kind === 'fire' ? 3.25 : 2.5) + .5); g.add(cab);
  const win = new T.Mesh(new T.BoxGeometry(2.0, .6, .05), new T.MeshStandardMaterial({ color: 0x223344, roughness: .1, metalness: .5 })); win.position.set(0, 1.35, (kind === 'fire' ? 3.25 : 2.5) + 1.22); g.add(win);
  const st = new T.Mesh(new T.BoxGeometry(2.32, .3, kind === 'fire' ? 6.5 : 5), M(kind === 'fire' ? 0xffeb3b : 0xff1744)); st.position.y = 1.2; g.add(st);
  if (kind === 'fire') { const lad = new T.Mesh(new T.BoxGeometry(.6, .2, 5.5), M(0xbdbdbd)); lad.position.set(0, 2.5, -.3); g.add(lad); }
  else { const cr = new T.Mesh(new T.BoxGeometry(.25, 1, .05), M(0xff1744)), cr2 = new T.Mesh(new T.BoxGeometry(1, .25, .05), M(0xff1744)); cr.position.set(0, 1.6, -2.53); cr2.position.copy(cr.position); g.add(cr, cr2); }
  for (const [x, z] of [[-1.1, 1.8], [1.1, 1.8], [-1.1, -1.8], [1.1, -1.8]]) { const w = new T.Mesh(new T.CylinderGeometry(.45, .45, .35, 12).rotateZ(Math.PI / 2), M(0x212121)); w.position.set(x, .45, z); g.add(w); }
  const l1 = new T.Mesh(new T.BoxGeometry(.5, .2, .3), new T.MeshBasicMaterial({ color: 0xff1744 })), l2 = new T.Mesh(new T.BoxGeometry(.5, .2, .3), new T.MeshBasicMaterial({ color: 0x2979ff })); l1.position.set(-.45, 2.45, 2.7); l2.position.set(.45, 2.45, 2.7); g.add(l1, l2); g.userData.lights = [l1, l2];
  G.scene.add(g); return g;
}
function dispatch(p) {
  if (!inCity() || EMS.cd > 0 || EMS.list.length >= 3) return; EMS.cd = 9; const kind = Math.random() < .55 ? 'fire' : 'amb', A = CA(), N = G.CITY.nodes;
  let st = null; for (let k = 0; k < 25; k++) { const nd = pick(N), x = A.cx + nd.x, z = A.cz + nd.z, d = Math.hypot(x - p.x, z - p.z); if (d > 70 && d < 160) { st = { x, z }; break; } } if (!st) return;
  const g = vehMesh(kind); g.position.set(st.x, 0, st.z); EMS.list.push({ g, kind, st: 'go', to: new T.Vector3(p.x, 0, p.z), t: 0, crew: [], sirT: 0 }); news(kind === 'fire' ? adT('İtfaiye ekipleri olay yerine gidiyor') : adT('Ambulanslar yaralılar için yolda'));
}
function emsTick(dt, t) {
  EMS.cd = Math.max(0, EMS.cd - dt); const P = G.player.position;
  for (let i = EMS.list.length - 1; i >= 0; i--) { const e = EMS.list[i], g = e.g; e.t += dt; const L = g.userData.lights, blink = (t * 6 | 0) % 2; L[0].material.color.setHex(blink ? 0xff1744 : 0x330000); L[1].material.color.setHex(blink ? 0x110022 : 0x2979ff);
    e.sirT -= dt; if (e.sirT <= 0 && e.st !== 'done') { e.sirT = 2; snd('siren', .8, Math.hypot(P.x - g.position.x, P.z - g.position.z)); }
    if (e.st === 'go') { V1.subVectors(e.to, g.position).setY(0); const d = V1.length(); if (d < 14 || e.t > 30) { e.st = 'work'; e.t = 0; for (let k = 0; k < 2; k++) { const r = G.createStickman(e.kind === 'fire' ? 0x263238 : 0xffffff), h = new T.Group(); h.add(r.stick); h.position.copy(g.position).add(V2.set(k ? 2 : -2, 0, 0)); G.scene.add(h); e.crew.push({ r, h }); } }
      else { const yaw = Math.atan2(V1.x, V1.z); g.rotation.y += ((((yaw - g.rotation.y) + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 3); g.position.addScaledVector(V1.normalize(), Math.min(d, 16 * dt)); } }
    else if (e.st === 'work') { for (const c of e.crew) { c.h.lookAt(e.to.x, 0, e.to.z); try { G.animateStick(c.r, dt, { speed: 0 }); } catch (x) {} c.r.armR.sh.rotation.x = -1.5; c.r.armL.sh.rotation.x = -1.4;
        if (e.kind === 'fire') { const hp = c.h.position; V2.subVectors(e.to, hp).setY(0).normalize(); for (let k = 0; k < 3; k++) emit(hp.x + V2.x, 1.5, hp.z + V2.z, V2.x * 14 + R(-1, 1), R(3, 6), V2.z * 14 + R(-1, 1), 1.2, pick([0x81d4fa, 0xe1f5fe]), 1); } }
      if (e.t > 12) { e.st = 'done'; e.t = 0; for (const c of e.crew) G.scene.remove(c.h); e.crew = []; } }
    else if (e.st === 'done') { g.position.y -= dt * .6; if (e.t > 3) { G.scene.remove(g); EMS.list.splice(i, 1); } } }
}

/* ---------- 🚁 haber helikopteri (istilada olay yerinin üstünde döner) ---------- */
let HELI = null;
function heliTick(dt, t) {
  const want = INV.st === 'fight' && INV.al.some(a => !a.dead);
  if (want && !HELI) { const g = new T.Group(), M = c => new T.MeshStandardMaterial({ color: c, roughness: .4, metalness: .3 }); const b = new T.Mesh(new T.CapsuleGeometry(1.1, 2.2, 4, 10).rotateX(Math.PI / 2), M(0x1565c0)); g.add(b); const tl = new T.Mesh(new T.BoxGeometry(.3, .4, 4), M(0x0d47a1)); tl.position.z = -3; g.add(tl);
    const rot = new T.Mesh(new T.BoxGeometry(9, .06, .35), M(0x222222)); rot.position.y = 1.3; g.add(rot); const rot2 = rot.clone(); rot2.rotation.y = Math.PI / 2; g.add(rot2); g.userData.rot = [rot, rot2];
    const sp = new T.Mesh(new T.ConeGeometry(9, 40, 20, 1, true).translate(0, -20, 0), new T.MeshBasicMaterial({ color: 0xfff9c4, transparent: true, opacity: .08, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); g.add(sp); g.userData.sp = sp;
    const lab = new T.Sprite(new T.SpriteMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#c62828'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#fff'; x.font = 'bold 34px system-ui'; x.textAlign = 'center'; x.fillText('📺 SFT HABER', 128, 44); return new T.CanvasTexture(c); })() })); lab.scale.set(6, 1.5, 1); lab.position.y = 2.6; g.add(lab);
    G.scene.add(g); HELI = { g, a: 0 }; }
  if (!HELI) return; if (!want) { HELI.g.position.y += dt * 12; if (HELI.g.position.y > 260) { G.scene.remove(HELI.g); HELI = null; } return; }
  const live = INV.al.find(a => !a.dead) || { pos: G.player.position }; HELI.a += dt * .25; const c = live.pos; V1.set(c.x + Math.sin(HELI.a) * 70, 75, c.z + Math.cos(HELI.a) * 70); HELI.g.position.lerp(V1, Math.min(1, dt * 1.5)); HELI.g.rotation.y = HELI.a + Math.PI / 2; HELI.g.userData.rot.forEach(r => r.rotation.y += dt * 30);
  HELI.g.userData.sp.lookAt(c.x, 0, c.z); HELI.g.userData.sp.rotateX(-Math.PI / 2);
}

/* ---------- 🎖️ başkanın kahramanlık töreni: sahne, kalabalık, madalya, havai fişek, uçak ve dron gösterisi ---------- */
const CER = { on: false, t: 0, objs: [], crowd: [], mayor: null, cam: null, look: new T.Vector3(), bub: [], fw: [], jets: [], drones: null, after: 0, ev: {} };
function txtTex(t, w = 1024, h = 160, bg = '#b71c1c', fg = '#ffd54f') { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = fg; x.lineWidth = 8; x.strokeRect(6, 6, w - 12, h - 12); x.fillStyle = fg; x.font = `900 ${h * .5}px system-ui`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, w / 2, h / 2 + 4); const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; return tx; }
function textPts(str, n) { const c = document.createElement('canvas'); c.width = 220; c.height = 80; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.font = '900 64px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(str, 110, 42); const d = x.getImageData(0, 0, 220, 80).data, L = []; for (let y = 0; y < 80; y += 2) for (let xx = 0; xx < 220; xx += 2) if (d[(y * 220 + xx) * 4 + 3] > 128) L.push([(xx - 110) / 110, (40 - y) / 110]); const out = []; for (let k = 0; k < n; k++) out.push(L.length ? L[(k * L.length / n) | 0] : [0, 0]); return out; }
function shapePts(kind, n) { const out = []; for (let k = 0; k < n; k++) { const u = k / n * Math.PI * 2; if (kind === 'heart') out.push([16 * Math.pow(Math.sin(u), 3) / 17, (13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)) / 17]); else { const r = (k % 2 ? .42 : 1); const a = Math.floor(k / (n / 10)) / 10 * Math.PI * 2 + Math.PI / 2, a2 = (Math.floor(k / (n / 10)) + 1) / 10 * Math.PI * 2 + Math.PI / 2, f = (k % (n / 10)) / (n / 10), r1 = Math.floor(k / (n / 10)) % 2 ? .42 : 1, r2 = Math.floor(k / (n / 10)) % 2 ? 1 : .42; out.push([Math.cos(a) * r1 * (1 - f) + Math.cos(a2) * r2 * f, Math.sin(a) * r1 * (1 - f) + Math.sin(a2) * r2 * f]); } } return out; }
function cerStart() {
  if (CER.on || !inCity()) return; const L = G.CITY.lots.stage || G.CITY.lots.plaza, A = CA(), X = A.cx + L.x, Z = A.cz + L.z, sy = L.t === 'stage' ? 1 : .1, sz = L.t === 'stage' ? Z + 5.2 : Z;
  CER.on = true; CER.t = 0; CER.ev = {}; CER.cp = null; CER.objs = []; CER.crowd = []; CER.base = new T.Vector3(X, sy, sz); CER.Z = Z;
  const add = o => { G.scene.add(o); CER.objs.push(o); return o; }, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .6 }, o)), box = (w, h, d, c, x, y, z) => { const m = add(new T.Mesh(new T.BoxGeometry(w, h, d), typeof c === 'number' ? M(c) : c)); m.position.set(x, y, z); return m; };
  if (L.t !== 'stage') box(12, 1, 7, 0x3e2723, X, .5, sz + .8);
  box(3.2, .03, 7, 0xc62828, X, sy + .02, sz + .5);   // kırmızı halı
  const pod = box(1.1, 1.2, .7, 0x5d4037, X - 1.2, sy + .6, sz - 1.2); const emb = box(.5, .5, .03, M(0xffd54f, { metalness: .8, roughness: .3 }), X - 1.2, sy + .75, sz - 1.56); const mic = box(.04, .5, .04, 0x212121, X - 1.2, sy + 1.45, sz - 1.4);
  const ban = add(new T.Mesh(new T.PlaneGeometry(11, 1.7), new T.MeshBasicMaterial({ map: txtTex('🏆 ' + adT('ŞEHRİN KAHRAMANI') + ' 🏆'), side: T.DoubleSide }))); ban.position.set(X, sy + 4.6, sz + 2.2); ban.rotation.y = Math.PI;
  for (const s of [-1, 1]) { box(.12, 5.4, .12, 0xbdbdbd, X + s * 5.6, sy + 2.7, sz + 2.2); }
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const fp = box(.08, 4.5, .08, 0xeeeeee, X + s * (7.5 + k * 1.6), 2.25, sz - 1); const fl = add(new T.Mesh(new T.PlaneGeometry(1.4, .9, 6, 1), new T.MeshStandardMaterial({ color: [0xe53935, 0x1e88e5, 0xfdd835][k], side: T.DoubleSide }))); fl.position.set(X + s * (7.5 + k * 1.6) + .72, 4, sz - 1); fl.userData.flag = true; }
  for (let k = 0; k < 14; k++) { const s = k < 7 ? -1 : 1, b = add(new T.Mesh(new T.SphereGeometry(.35, 12, 10), M(pick([0xff5252, 0xffd740, 0x40c4ff, 0x69f0ae, 0xea80fc]), { roughness: .3 }))); b.position.set(X + s * (5.4 + R(-.4, .4)), sy + 5.4 + R(0, 1.2), sz + 2.2 + R(-.4, .4)); b.userData.bob = R(0, 6); }
  // 🧍 başkan: koyu takım, kırmızı kuşak, gri saç
  const mr = G.createStickman(0x263238), mh = new T.Group(); mh.add(mr.stick); mh.position.set(X - 1.2, sy, sz - .4); mh.rotation.y = Math.PI; add(mh); CER.mayor = { r: mr, h: mh };
  const sash = new T.Mesh(new T.BoxGeometry(.06, .9, .12), M(0xc62828)); sash.position.set(0, 0, .14); sash.rotation.z = .6; mr.torso.add(sash); const hair = new T.Mesh(new T.SphereGeometry(.18, 12, 8, 0, Math.PI * 2, 0, 1.2), M(0xbdbdbd)); hair.position.y = .03; mr.head.add(hair);
  // 👥 kalabalık
  const cols = [0xef5350, 0x42a5f5, 0x66bb6a, 0xffca28, 0xab47bc, 0x26c6da, 0xff7043, 0x8d6e63, 0xec407a, 0x5c6bc0];
  for (let row = 0; row < 5; row++) for (let k = 0; k < 11; k++) { const r = G.createStickman(pick(cols)), h = new T.Group(); h.add(r.stick); h.position.set(X + (k - 5) * 1.55 + R(-.35, .35) + (row % 2) * .7, .05, sz - 4.5 - row * 1.7 + R(-.3, .3)); h.rotation.y = R(-.25, .25); h.scale.setScalar(R(.92, 1.06)); add(h); CER.crowd.push({ r, h, ph: R(0, 6), kind: pick(['cheer', 'clap', 'wave', 'jump']) }); }
  for (const s of [-1, 1]) { const r = G.createStickman(0x0d1b4c), h = new T.Group(); h.add(r.stick); h.position.set(X + s * 4.6, sy, sz - 1.8); h.rotation.y = Math.PI; add(h); CER.crowd.push({ r, h, ph: 0, kind: 'guard' }); }
  // oyuncu sahneye
  try { const P = G.player; P.position.set(X + 1.2, sy + .05, sz - .9); G.facing = Math.PI; G.charHolder.rotation.y = Math.PI; G.vel && G.vel.set(0, 0, 0); } catch (e) {}
  // 🛩️ jetler ve 🛸 dronlar
  CER.jets = []; for (let k = 0; k < 3; k++) { const j = new T.Group(), M2 = M(0xeceff1, { metalness: .6, roughness: .3 }); const b = new T.Mesh(new T.ConeGeometry(.6, 6, 10).rotateX(Math.PI / 2), M2); j.add(b); const w = new T.Mesh(new T.BoxGeometry(6, .12, 1.6), M2); w.position.z = -.6; j.add(w); const tl = new T.Mesh(new T.BoxGeometry(.12, 1.4, 1), M2); tl.position.set(0, .6, -2.4); j.add(tl); j.visible = false; add(j); CER.jets.push({ g: j, col: [0xe53935, 0xffffff, 0x00bcd4][k], off: (k - 1) * 9 }); }
  const DN = 160, dg = new T.SphereGeometry(.8, 8, 6), dm = new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }); CER.drones = add(new T.InstancedMesh(dg, dm, DN)); CER.drones.frustumCulled = false; CER.drones.visible = false; CER.dn = DN;
  CER.dPos = [...Array(DN)].map(() => new T.Vector3(X + R(-60, 60), R(2, 6), sz + 40 + R(-20, 20))); CER.dCol = new T.Color(); CER.shapes = [shapePts('star', DN), shapePts('heart', DN), textPts('SFT', DN)];
  CER.cam = G.camera; document.body.classList.add('shCine'); $('shCer').style.display = 'block'; snd('fanfare', 1); play('drumroll');
  for (const p of CER.bub) p.el.remove(); CER.bub = [];
}
function cerBubble(h, text, dur = 2.6, dy = 2.1) { const el = document.createElement('div'); el.className = 'bb2'; el.textContent = text; $('shCer').appendChild(el); CER.bub.push({ el, h, t1: CER.t + dur, dy }); }
function cerEnd(now) {
  if (!CER.on) return; CER.on = false; document.body.classList.remove('shCine'); $('shCer').style.display = 'none'; for (const b of CER.bub) b.el.remove(); CER.bub = [];
  if (!CER.ev.reward) giveReward(); CER.after = 25;
}
function giveReward() { CER.ev.reward = true; try { G.progAdd(5000, G.player.position.clone().setY(G.player.position.y + 2), adT('Kahramanlık ödülü')); } catch (e) {} snd('coin', 1); G.showMsg('🏅 ' + adT('Madalya ve şehrin altın anahtarı senin! +5000 🪙'), 4);
  try { const r = G.playerRig; if (r && !r.torso.userData.medal) { const md = new T.Mesh(new T.CylinderGeometry(.09, .09, .02, 18).rotateX(Math.PI / 2), new T.MeshStandardMaterial({ color: 0xffd54f, metalness: .9, roughness: .25, emissive: 0x4a3200 })); md.position.set(0, .12, .16); r.torso.add(md); const rb = new T.Mesh(new T.BoxGeometry(.06, .22, .01), new T.MeshStandardMaterial({ color: 0xc62828 })); rb.position.set(0, .26, .15); r.torso.add(rb); r.torso.userData.medal = true; } } catch (e) {} }
function cerTick(dt, t) {
  if (!CER.on) { if (CER.after > 0) { CER.after -= dt; cerCrowd(dt, t, true); if (CER.after <= 0) { for (const o of CER.objs) G.scene.remove(o); CER.objs = []; CER.crowd = []; } } return; }
  const ct = CER.t += dt, E = CER.ev, once = k => !E[k] && (E[k] = true), B = CER.base, M = CER.mayor;
  try { const K = G.keys; for (const k in K) K[k] = false; } catch (e) {}
  if (ct > .5 && once('s1')) { cerBubble(M.h, adT('Sevgili hemşehrilerim!'), 2.4); play('clap'); }
  if (ct > 3.2 && once('s2')) cerBubble(M.h, adT('Bugün şehrimizi dev uzaylılardan kurtaran bir kahramanımız var!'), 3.4);
  if (ct > 4.5 && once('ch1')) { snd('cheer', 1); for (let k = 0; k < 4; k++) cerBubble(pick(CER.crowd).h, pick(['👏👏', adT('Yaşaaa!'), adT('Kahraman!'), '🎉', '❤️']), 2, 2.2); }
  if (ct > 7.2 && once('s3')) cerBubble(M.h, adT('Şehrimiz adına bu madalyayı ve şehrin altın anahtarını sana veriyorum!'), 3.6);
  if (ct > 9.5 && once('medal')) { giveReward(); snd('fanfare', 1); }
  if (ct > 10.3 && once('ch2')) { snd('cheer', 1.2); snd('clap', 1); for (let k = 0; k < 6; k++) cerBubble(pick(CER.crowd).h, pick(['KAH-RA-MAN!', '👏👏👏', adT('Teşekkürler!'), adT('Sen bir efsanesin!'), '🎊']), 2.2, 2.2); for (let k = 0; k < 2; k++) for (const s of [-1, 1]) setTimeout(() => burst(B.x + s * 5.5, B.y + 1, B.z + 2, 120, 14, [0xff5252, 0xffd740, 0x40c4ff, 0x69f0ae, 0xea80fc, 0xffffff], 3, .25), k * 500); }
  if (ct > 12.5 && once('s4')) cerBubble(M.h, adT('Şimdi kahramanımız için gösteri başlasın!'), 2.6);
  // 🛩️ jetler
  if (ct > 14 && ct < 21) { const k = (ct - 14) / 7; for (const j of CER.jets) { j.g.visible = true; j.g.position.set(B.x + j.off, 55 + Math.abs(j.off) * .3, B.z - 220 + k * 440); j.g.rotation.set(0, 0, Math.sin(ct * 2) * .1); for (let q = 0; q < 3; q++) emit(j.g.position.x, j.g.position.y, j.g.position.z - 3, R(-.5, .5), R(-.2, .2), R(-1, 0), 3.2, j.col, 0); } if (once('jet')) { snd('heli', .5); play('airhorn'); } }
  else for (const j of CER.jets) j.g.visible = false;
  // 🎆 havai fişek
  if (ct > 15 && ct < 30) { CER.fwT = (CER.fwT || 0) - dt; if (CER.fwT <= 0) { CER.fwT = R(.35, .8); CER.fw.push({ p: new T.Vector3(B.x + R(-25, 25), 2, B.z + R(15, 35)), v: new T.Vector3(R(-2, 2), R(32, 42), R(-2, 2)), t: 0, col: pick([[0xff1744, 0xffeb3b], [0x00e5ff, 0xffffff], [0x76ff03, 0xffff00], [0xd500f9, 0xff80ab], [0xffab00, 0xfff176]]) }); snd('firework', .6); } }
  for (let i = CER.fw.length - 1; i >= 0; i--) { const f = CER.fw[i]; f.t += dt; f.v.y -= 9.8 * dt; f.p.addScaledVector(f.v, dt); emit(f.p.x, f.p.y, f.p.z, 0, -1, 0, .5, 0xffe0b2, .2); if (f.v.y < 4) { burst(f.p.x, f.p.y, f.p.z, 140, 22, f.col, 2.4, .25); CER.fw.splice(i, 1); } }
  // 🛸 dron gösterisi: yıldız → kalp → SFT
  if (ct > 18) { CER.drones.visible = true; const si = ct < 23 ? 0 : ct < 28 ? 1 : 2, S = CER.shapes[si], cx = B.x, cy = 48, cz = B.z + 45, sc = si === 2 ? 34 : 22;
    for (let k = 0; k < CER.dn; k++) { const tp = V1.set(cx - S[k][0] * sc, cy + S[k][1] * sc, cz); CER.dPos[k].lerp(tp, Math.min(1, dt * 1.8)); dmy.position.copy(CER.dPos[k]); dmy.scale.setScalar(1); dmy.updateMatrix(); CER.drones.setMatrixAt(k, dmy.matrix); CER.dCol.setHSL(((k / CER.dn) * .3 + si * .33 + ct * .05) % 1, .9, .6); CER.drones.setColorAt(k, CER.dCol); }
    CER.drones.instanceMatrix.needsUpdate = true; if (CER.drones.instanceColor) CER.drones.instanceColor.needsUpdate = true; }
  if (ct > 23 && once('dr2')) cerBubble(M.h, '❤️ ' + adT('Seni seviyoruz kahraman!'), 2.4);
  // 🧍 başkanın hareketleri
  const mr = M.r; try { G.animateStick(mr, dt, { speed: 0 }); } catch (e) {} if (CER.bub.some(b => b.h === M.h)) { mr.armR.sh.rotation.x = -1.2 + Math.sin(ct * 4) * .3; mr.armL.sh.rotation.x = -.4; } if (ct > 8.8 && ct < 10.5) { M.h.rotation.y = Math.PI * .5 + Math.PI; mr.armR.sh.rotation.x = -1.5; mr.armL.sh.rotation.x = -1.5; } else M.h.rotation.y = Math.PI;
  try { const pr = G.playerRig; if (ct > 10 && ct < 14) { pr.armL.sh.rotation.x = -2.9; pr.armR.sh.rotation.x = -2.9; } } catch (e) {}
  cerCrowd(dt, t, false); cerFlags(t);
  for (const o of CER.objs) if (o.userData.bob != null) o.position.y += Math.sin(t * 1.5 + o.userData.bob) * .004;
  if (ct > 31) cerEnd(); else if (ct > 30.4 && once('fadeE')) {}
}
const dmy = new T.Object3D();
function cerCrowd(dt, t, loose) { for (const c of CER.crowd) { const r = c.r, w = t * 7 + c.ph; try { G.animateStick(r, dt, { speed: 0 }); } catch (e) {} if (c.kind === 'guard') continue;
  if (c.kind === 'cheer') { r.armL.sh.rotation.x = -2.8 + Math.sin(w) * .2; r.armR.sh.rotation.x = -2.8 - Math.sin(w) * .2; r.armL.sh.rotation.z = .4; r.armR.sh.rotation.z = -.4; }
  else if (c.kind === 'clap') { const k = Math.abs(Math.sin(w * 1.4)); r.armL.sh.rotation.x = r.armR.sh.rotation.x = -1.4; r.armL.sh.rotation.z = -.2 - k * .5; r.armR.sh.rotation.z = .2 + k * .5; }
  else if (c.kind === 'wave') { r.armR.sh.rotation.x = -2.9; r.armR.sh.rotation.z = -.4 + Math.sin(w) * .5; }
  else { r.armL.sh.rotation.x = -2.6; r.armR.sh.rotation.x = -2.6; c.h.position.y = .05 + Math.max(0, Math.sin(w)) * .35; } } }
function cerFlags(t) { for (const o of CER.objs) if (o.userData.flag) { const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin(t * 6 + x * 3) * .12 * (x + .7)); } p.needsUpdate = true; } }
function cerCam(cam) {   // 🎥 tören kamerası
  if (!CER.on) return false; const ct = CER.t, B = CER.base; let pos, look;
  if (ct < 3) { pos = V1.set(B.x + 2, 6 + ct, B.z - 20 + ct); look = V2.set(B.x, B.y + 2, B.z); }
  else if (ct < 7) { pos = V1.set(B.x - 3.2, B.y + 2.3, B.z - 4.5); look = V2.set(B.x - 1.2, B.y + 1.7, B.z - .4); }
  else if (ct < 10.6) { pos = V1.set(B.x + 4.5, B.y + 2.2, B.z - 3.5); look = V2.set(B.x, B.y + 1.4, B.z - .6); }
  else if (ct < 14) { pos = V1.set(B.x + Math.sin(ct * .3) * 2, B.y + 3, B.z + 1.5); look = V2.set(B.x, 1.5, B.z - 9); }
  else if (ct < 21) { const j = CER.jets[1]; pos = V1.set(B.x + 26, 5, B.z - 30); look = j && j.g.visible ? V2.copy(j.g.position) : V2.set(B.x, 40, B.z); }
  else { pos = V1.set(B.x, 8, B.z - 26); look = V2.set(B.x, 34, B.z + 40); }
  const now = performance.now(), fdt = Math.min(.1, (now - (CER.camT || now)) / 1000); CER.camT = now; const k = ct < .1 ? 1 : 1 - Math.exp(-4 * fdt);
  if (!CER.cp || ct < .1) { CER.cp = pos.clone(); CER.look.copy(look); } CER.cp.lerp(pos, k); CER.look.lerp(look, k); cam.position.copy(CER.cp); cam.lookAt(CER.look); return true;
}
function cerBubbles() { const W = innerWidth, H = innerHeight; for (let i = CER.bub.length - 1; i >= 0; i--) { const b = CER.bub[i]; if (CER.t > b.t1) { b.el.remove(); CER.bub.splice(i, 1); continue; } const q = V3.copy(b.h.position).add(V2.set(0, b.dy, 0)).project(G.camera); if (q.z > 1 || Math.abs(q.x) > 1.1) { b.el.style.display = 'none'; continue; } b.el.style.display = 'block'; b.el.style.left = ((q.x + 1) / 2 * W) + 'px'; b.el.style.top = ((1 - q.y) / 2 * H) + 'px'; } }
document.head.insertAdjacentHTML('beforeend', '<style>body.shCine > *:not(canvas):not(#shCer):not(script){display:none !important}</style>');
$('shSkip').addEventListener('click', e => { e.stopPropagation(); cerEnd(); });
addEventListener('keydown', e => { if (!CER.on) return; if (e.code === 'Escape' || e.code === 'Enter') cerEnd(); e.stopImmediatePropagation(); if (e.code === 'Space' || e.code === 'Tab') e.preventDefault(); }, true);

/* ---------- 👥 arkadaş grupları: birlikte gezen, tanışan, sohbet eden, aktivite yapan şehirliler ---------- */
const GIRL = new Set(['Ayşe', 'Zeynep', 'Elif', 'Selin', 'Ece', 'Derya', 'Defne', 'Pelin', 'Nazlı', 'Yasemin', 'İrem', 'Melis', 'Gizem', 'Buse', 'Ezgi']);
const isGirl = n => GIRL.has(n.name), FREE_ROLES = new Set(['walker', 'office', 'jogger', 'dancer', 'artist', 'banker', 'shop', 'musician', 'doctor']);
const GRP = { list: [], t: 4, on: true };
const LINES = {
  girls: ['Kızlar, kahve içelim mi? ☕', 'Bu ayakkabılar çok tatlı!', 'Akşam sinemaya gidelim!', 'Bak şu vitrine, bayıldım 😍', 'Haftaya doğum günüm var 🎂', 'Çok güldüm yaa 😂'],
  boys: ['Kanka akşam maç var ⚽', 'Abi şu arabaya bak! 🚗', 'Hadi basket oynayalım 🏀', 'Kanka acıktım, döner yiyelim 🥙', 'Dün oyunda rekor kırdım 🎮', 'Hahaha efsane 😂'],
  mix: ['Bugün hava çok güzel ☀️', 'Yarın denize gidelim mi? 🏖️', 'Şu yeni kafeyi denedin mi?', 'Haftasonu planın ne?', 'Hahaha aynen 😄', 'Devi gördün mü? Kocamandı!'],
  meet1: ['Merhaba! Ben {a} 👋', 'Selam, nasılsın? 😊', 'Pardon, seni bir yerden tanıyor muyum?'], meet2: ['Memnun oldum, ben {b}!', 'İyiyim, sen nasılsın?', 'Evet! Spor salonundan 😄'], meet3: ['Birlikte yürüyelim mi?', 'Bir kahve içelim mi? ☕', 'Görüşürüz, iyi günler! 👋'],
  ball: ['Pas ver! ⚽', 'Gooool! 🙌', 'Güzel vuruş!'], selfie: ['Gülümseyin! 📸', 'Bir daha çekelim 😄', 'Bunu paylaşıyorum! #SFT'], dance: ['Bu şarkı süper! 🎶', 'Hadi dans! 💃🕺'], ice: ['Çilekli en iyisi 🍓', 'Benimki çikolatalı 🍫', 'Erimeden yiyelim 😋'],
};
const L = k => adT(pick(LINES[k]));
function freePed(n) { return n && !n.dead && n.holder.visible && !n.grp && n.state !== 'held' && n.state !== 'thrown' && n.state !== 'down' && n.state !== 'flee' && !n.follow && !n.inc && !n.sick && !n.stuck && !n.beach && !n.angry && FREE_ROLES.has(n.role) && !(G.CITY.talk && G.CITY.talk.n === n) && !(G.CITY.ev && G.CITY.ev.peds && G.CITY.ev.peds.includes(n)); }
function nodeW(i) { const A = CA(), nd = G.CITY.nodes[i]; return V1.set(A.cx + nd.x, 0, A.cz + nd.z); }
function nearNode(x, z) { const A = CA(), N = G.CITY.nodes; let b = 0, bd = 1e9; for (let i = 0; i < N.length; i++) { const d = Math.hypot(A.cx + N[i].x - x, A.cz + N[i].z - z); if (d < bd) { bd = d; b = i; } } return b; }
const GN = [...GIRL], BN = ['Mehmet', 'Can', 'Emre', 'Burak', 'Mert', 'Kaan', 'Oğuz', 'Cem', 'Hakan', 'Arda', 'Tolga', 'Barış', 'Serkan', 'Onur', 'Umut', 'Kerem'];
function grpPull() {   // yakında boşta kimse yoksa: uzaktaki şehirlileri yakındaki bir kaldırıma getir (gruplar hep çevrende olsun)
  const P = G.player.position, A = CA(), N = G.CITY.nodes; let spot = null; const f = G.facing;
  for (let k = 0; k < 30; k++) { const nd = pick(N), x = A.cx + nd.x, z = A.cz + nd.z, d = Math.hypot(x - P.x, z - P.z); if (d < 22 || d > 55) continue; const ang = Math.atan2(x - P.x, z - P.z), behind = Math.abs(((ang - f + Math.PI * 3) % (Math.PI * 2)) - Math.PI) > 1.2; if (behind || k > 20) { spot = { x, z }; break; } }
  if (!spot) return; const sex = pick(['girls', 'boys', 'mix', 'mix']), n0 = Math.random() < .5 ? 2 : 3;
  for (let k = 0; k < n0; k++) { const n = G.cyPedAt(spot.x + R(-1.5, 1.5), 0, spot.z + R(-1.5, 1.5), 'walker'); if (!n) break; n.name = sex === 'girls' ? pick(GN) : sex === 'boys' ? pick(BN) : (k % 2 ? pick(GN) : pick(BN)); try { n.rig.bodyMat.color.setHex(pick([0xef5350, 0x42a5f5, 0x66bb6a, 0xffca28, 0xab47bc, 0x26c6da, 0xff7043, 0xec407a, 0x5c6bc0])); } catch (e) {} }
}
function grpForm() {
  { const P0 = G.player.position, nearN = G.CITY.peds.filter(n => freePed(n) && Math.hypot(n.holder.position.x - P0.x, n.holder.position.z - P0.z) < 45).length; if (nearN < 3) grpPull(); }
  const P = G.player.position, pool = G.CITY.peds.filter(n => freePed(n) && Math.hypot(n.holder.position.x - P.x, n.holder.position.z - P.z) < 150 && Math.hypot(n.holder.position.x - P.x, n.holder.position.z - P.z) > 6); if (pool.length < 2) return;
  let kind = pick(['walk', 'walk', 'walk', 'meet', 'meet', 'chat', 'ball', 'selfie', 'dance', 'ice']); const sex = pick(['girls', 'boys', 'mix', 'mix']);
  const want = kind === 'meet' || kind === 'ball' ? 2 : Math.random() < .55 ? 2 : 3, a = pick(pool), mem = [a];
  const ok = n => sex === 'girls' ? isGirl(n) : sex === 'boys' ? !isGirl(n) : true;
  const near = pool.filter(n => n !== a && ok(n)).sort((x, y) => x.holder.position.distanceTo(a.holder.position) - y.holder.position.distanceTo(a.holder.position));
  for (const n of near) { if (mem.length >= want) break; const d = n.holder.position.distanceTo(a.holder.position); if (kind === 'meet' ? d < 6 || d > 60 : d > 30) continue; mem.push(n); }
  if (mem.length < 2 && kind !== 'meet') { kind = 'meet'; const n = near.find(n => { const d = n.holder.position.distanceTo(a.holder.position); return d >= 6 && d < 70; }); if (n) mem.push(n); }   // yakında kimse yoksa: biriyle tanışmaya gider
  if (mem.length < 2) return; if (kind === 'meet') mem.length = 2;
  const g = { kind, sex: sex === 'mix' || !mem.every(ok) ? 'mix' : sex, mem, t: 0, life: R(35, 70), st: kind === 'meet' ? 'approach' : 'go', node: nearNode(a.holder.position.x, a.holder.position.z), next: -1, anchor: a.holder.position.clone(), dir: new T.Vector3(0, 0, 1), talkT: R(4, 9), props: [] };
  for (const n of mem) { n.grp = g; n.vel && n.vel.set(0, 0, 0); n.state = 'idle'; }
  if (kind === 'ice') for (const n of mem) { const cone = new T.Group(); const c1 = new T.Mesh(new T.ConeGeometry(.06, .18, 10).rotateX(Math.PI), new T.MeshStandardMaterial({ color: 0xd7a35f })); const c2 = new T.Mesh(new T.SphereGeometry(.07, 10, 8), new T.MeshStandardMaterial({ color: pick([0xf48fb1, 0x8d6e63, 0xfff9c4, 0xa5d6a7]) })); c2.position.y = .1; cone.add(c1, c2); handOf(n).add(cone); cone.position.set(0, -.36, .05); g.props.push(cone); }
  if (kind === 'selfie') { const ph = new T.Mesh(new T.BoxGeometry(.08, .14, .015), new T.MeshStandardMaterial({ color: 0x111111, emissive: 0x335577, emissiveIntensity: .6 })); handOf(mem[0]).add(ph); ph.position.set(0, -.38, .05); g.props.push(ph); }
  if (kind === 'ball') { const b = new T.Mesh(new T.SphereGeometry(.17, 14, 10), new T.MeshStandardMaterial({ color: 0xffffff, roughness: .5 })); G.scene.add(b); g.ball = { m: b, from: 0, t: 0 }; g.props.push(b); }
  GRP.list.push(g);
}
function handOf(n) { return n.rig.armR.el; }
function grpRelease(g) { const i = GRP.list.indexOf(g); if (i >= 0) GRP.list.splice(i, 1); for (const p of g.props) if (p.parent) p.parent.remove(p); for (const n of g.mem) { if (n.grp === g) { n.grp = null; if (n.state !== 'held' && n.state !== 'thrown') { n.state = 'idle'; n.timer = R(.5, 2); } } } }
function grpTick(dt, t) {
  if (!inCity() || !GRP.on || CER.on) { if (GRP.list.length) [...GRP.list].forEach(grpRelease); return; }
  GRP.t -= dt; if (GRP.t <= 0) { GRP.t = R(2, 4); if (GRP.list.filter(g => g.kind !== 'film').length < 7 && INV.st !== 'fight') grpForm(); }
  const P = G.player.position;
  for (const g of [...GRP.list]) { g.t += dt; if (g.mem.some(n => n.grp !== g || n.dead || n.state === 'held' || n.state === 'thrown' || n.flee > 0 || n.state === 'flee' || !n.holder.visible) || g.t > g.life || Math.hypot(g.anchor.x - P.x, g.anchor.z - P.z) > 190) { grpRelease(g); continue; }
    g.talkT -= dt;
    if (g.kind === 'meet' && g.st === 'approach') { const [a, b] = g.mem, pa = a.holder.position, pb = b.holder.position, d = pa.distanceTo(pb); if (d < 1.4) { g.st = 'greet'; g.gt = 0; say(a, adT(pick(LINES.meet1)).replace('{a}', a.name), 2.2); } g.anchor.copy(pa).lerp(pb, .5); continue; }
    if (g.st === 'greet') { g.gt += dt; if (g.gt > 2.3 && !g.g2) { g.g2 = true; say(g.mem[1], adT(pick(LINES.meet2)).replace('{b}', g.mem[1].name), 2.2); } if (g.gt > 4.6 && !g.g3) { g.g3 = true; say(g.mem[0], L('meet3'), 2.2); } if (g.gt > 6.5) { if (Math.random() < .6) { g.kind = 'walk'; g.st = 'go'; g.sex = 'mix'; } else { grpRelease(g); } } continue; }
    if (g.kind === 'walk' || g.kind === 'ice') { if (g.st === 'go') { if (g.next < 0) { const nb = G.CITY.nodes[g.node].nb || []; g.next = nb.length ? pick(nb) : g.node; } const tp = nodeW(g.next).clone(), d = Math.hypot(tp.x - g.anchor.x, tp.z - g.anchor.z); if (d < .8) { g.node = g.next; g.next = -1; } else { g.dir.set(tp.x - g.anchor.x, 0, tp.z - g.anchor.z).normalize(); g.anchor.addScaledVector(g.dir, Math.min(d, 1.35 * dt)); }
        if (g.talkT <= 0) { g.talkT = R(7, 13); g.st = 'talk'; g.tt = 0; say(pick(g.mem), g.kind === 'ice' ? L('ice') : L(g.sex), 2.6); } }
      else if (g.st === 'talk') { g.tt += dt; if (g.tt > 2.8 && !g.rep) { g.rep = true; say(pick(g.mem), g.kind === 'ice' ? L('ice') : L(g.sex), 2.4); } if (g.tt > 5.5) { g.st = 'go'; g.rep = false; } } }
    else if (g.kind === 'chat' || g.kind === 'selfie' || g.kind === 'dance') { if (g.talkT <= 0) { g.talkT = R(3.5, 6); say(pick(g.mem), g.kind === 'chat' ? L(g.sex) : L(g.kind), 2.4); if (g.kind === 'selfie') { const h = g.mem[0].holder.position; burst(h.x, h.y + 2.2, h.z, 20, 2, 0xffffff, .3, 0); } } }
    else if (g.kind === 'ball' && g.ball) { const B = g.ball, a = g.mem[B.from], b = g.mem[1 - B.from]; B.t += dt / 1.1; const pa = a.holder.position, pb = b.holder.position; B.m.position.lerpVectors(pa, pb, Math.min(1, B.t)); B.m.position.y = pa.y + .17 + Math.sin(Math.min(1, B.t) * Math.PI) * 1.2; if (B.t >= 1) { B.t = 0; B.from = 1 - B.from; if (Math.random() < .3) say(b, L('ball'), 1.4); } }
  }
}
function grpNpc(n, dt) {   // updateNPC kancası: gruptaki kişiyi biz yönetiriz
  const g = n.grp; if (!g || !GRP.list.includes(g)) { n.grp = null; return false; }
  const i = g.mem.indexOf(n), h = n.holder, r = n.rig, k = Math.min(1, dt * 6), t = G.elapsed; let spd = 0, face = null;
  if (g.kind === 'meet' && g.st === 'approach') { const o = g.mem[1 - i].holder.position; V1.subVectors(o, h.position).setY(0); const d = V1.length(); if (d > 1.2) { h.position.addScaledVector(V1.normalize(), Math.min(d - 1.2, 1.4 * dt)); spd = 1.4; } face = Math.atan2(o.x - h.position.x, o.z - h.position.z); }
  else if (g.st === 'greet') { const o = g.mem[1 - i].holder.position; face = Math.atan2(o.x - h.position.x, o.z - h.position.z); }
  else if ((g.kind === 'walk' || g.kind === 'ice') && g.st === 'go') { const side = V2.set(g.dir.z, 0, -g.dir.x), off = (i - (g.mem.length - 1) / 2) * .9; V3.copy(g.anchor).addScaledVector(side, off).addScaledVector(g.dir, -Math.abs(off) * .15); V1.subVectors(V3, h.position).setY(0); const d = V1.length(); if (d > .05) h.position.addScaledVector(V1.normalize(), Math.min(d, (1.35 + d) * dt)); spd = 1.35; face = Math.atan2(g.dir.x, g.dir.z); }
  else { const c = g.anchor, ang = i / g.mem.length * Math.PI * 2 + (g.kind === 'ball' ? 0 : .5), rad = g.kind === 'ball' ? 2.4 : g.kind === 'selfie' ? .55 : .85; V3.set(c.x + Math.sin(ang) * rad, h.position.y, c.z + Math.cos(ang) * rad); V1.subVectors(V3, h.position).setY(0); const d = V1.length(); if (d > .05) { h.position.addScaledVector(V1.normalize(), Math.min(d, 1.4 * dt)); spd = d > .3 ? 1.4 : 0; }
    face = g.kind === 'selfie' ? Math.atan2(g.mem[0].holder.position.x - c.x, g.mem[0].holder.position.z - c.z) + (i ? 0 : 0) : Math.atan2(c.x - h.position.x, c.z - h.position.z); if (g.kind === 'selfie' && i === 0) face += Math.PI; }
  if (face != null) h.rotation.y += ((((face - h.rotation.y) + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * k;
  try { G.animateStick(r, dt, { speed: spd }); } catch (e) {}
  if (spd < .3) {   // 🙋 jestler
    const talking = g.st === 'talk' || g.st === 'greet' || g.kind === 'chat';
    if (g.st === 'greet') { if (g.gt < 1.5) { r.armR.sh.rotation.x = -2.8; r.armR.sh.rotation.z = -.3 + Math.sin(t * 9) * .4; } else if (g.gt < 3.5) { r.armR.sh.rotation.x = -1.2; r.armR.el.rotation.x = -.3; } }
    else if (g.kind === 'dance') { const w = t * 6 + i; r.armL.sh.rotation.x = -1.5 + Math.sin(w) * 1.2; r.armR.sh.rotation.x = -1.5 - Math.sin(w) * 1.2; r.armL.sh.rotation.z = .6; r.armR.sh.rotation.z = -.6; h.position.y = Math.abs(Math.sin(w * 2)) * .12; }
    else if (g.kind === 'selfie') { if (i === 0) { r.armR.sh.rotation.x = -2.2; r.armR.el.rotation.x = -.2; } else { r.armR.sh.rotation.x = -2.9; r.armR.sh.rotation.z = -.2; } }
    else if (g.kind === 'ball') { const B = g.ball; if (B && B.from === i && B.t < .15) { r.legR.hip.rotation.x = -1.0; } }
    else if (talking) { r.armR.sh.rotation.x = -.6 + Math.sin(t * 5 + i * 2) * .5; r.armL.sh.rotation.x = -.3 + Math.sin(t * 4 + i) * .3; if (r.head) r.head.rotation.x = Math.sin(t * 6 + i) * .08; }
  }
  if (g.kind === 'ice' && spd >= .3) { r.armR.sh.rotation.x = -1.3; r.armR.el.rotation.x = -1.2; }
  return true;
}

/* ---------- 📱 seni çeken insanlar + ⭐ ün ---------- */
const FAME = { v: 0, show: 0, t: 0, film: [] };
try { FAME.v = +localStorage.getItem('sftUn') || 0; } catch (e) {}
const fameStr = v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'B' : String(v | 0);
function spectacular() { if (CER.on) return 3; let s = 0; if (G.giant) s += 2; try { if (window.__cos && __cos.on()) s += 2; if (G.flyingNow) s += 1; } catch (e) {} if (INV.st === 'fight') s += 2; return s; }
function fameTick(dt) {
  if (!inCity()) { $('shFame').style.display = 'none'; return; } const s = spectacular(); FAME.t -= dt;
  if (s > 0 && FAME.t <= 0) { FAME.t = 2; const P = G.player.position, cand = G.CITY.peds.filter(n => freePed(n) && Math.hypot(n.holder.position.x - P.x, n.holder.position.z - P.z) < 30 + (G.giant ? 40 : 0)); for (let k = 0; k < Math.min(2, cand.length); k++) { const n = pick(cand); if (n.grp) continue; const g = { kind: 'film', mem: [n], t: 0, life: R(4, 7), props: [], anchor: n.holder.position.clone(), st: 'film' }; const ph = new T.Mesh(new T.BoxGeometry(.08, .14, .015), new T.MeshStandardMaterial({ color: 0x111111, emissive: 0xaaccff, emissiveIntensity: .8 })); handOf(n).add(ph); ph.position.set(0, -.38, .05); g.props.push(ph); n.grp = g; GRP.list.push(g); if (Math.random() < .4) say(n, pick([adT('Bunu çekmeliyim! 📱'), adT('Canlı yayındayım! 🔴'), adT('İnanılmaz!'), adT('Viral olacak bu!')]), 2); } }
  const filming = GRP.list.filter(g => g.kind === 'film').length; if (filming) { FAME.v += filming * s * dt * 37; FAME.show = 4; try { if (Math.random() < dt) localStorage.setItem('sftUn', String(FAME.v | 0)); } catch (e) {} }
  FAME.show -= dt; const el = $('shFame'); el.style.display = FAME.v > 0 ? 'block' : 'none'; if (FAME.v > 0) el.textContent = '📈 ' + fameStr(FAME.v) + ' ' + adT('takipçi') + (filming ? ' · 📱×' + filming : '');
}
function filmNpc(n, dt, g) { const P = G.player.position, h = n.holder, r = n.rig; h.rotation.y = Math.atan2(P.x - h.position.x, P.z - h.position.z); try { G.animateStick(r, dt, { speed: 0 }); } catch (e) {} r.armR.sh.rotation.x = -2.0 - (G.giant ? .5 : 0); r.armR.el.rotation.x = -.3; return true; }
// film gruplarının yaşam süresi
function filmTick(dt) { for (const g of [...GRP.list]) if (g.kind === 'film') { g.t += dt; const n = g.mem[0]; if (g.t > g.life || n.dead || n.state === 'held' || n.flee > 0 || !n.holder.visible) grpRelease(g); } }

/* ---------- 🌭 sokak büfeleri ---------- */
const FOOD = { built: false, carts: [] };
const MENU = [['simit', '🥯', 'Simit', 8, 25], ['doner', '🥙', 'Döner', 15, 45], ['dond', '🍦', 'Dondurma', 10, 30], ['kahve', '☕', 'Kahve', 12, 35]];
function foodBuild() {
  if (FOOD.built || !inCity()) return; FOOD.built = true; const A = CA(), Ls = ['plaza', 'stage', 'court', 'pond', 'bank', 'gym', 'hospital', 'club'];
  MENU.forEach((m, i) => { const Lt = G.CITY.lots[Ls[i * 2 % Ls.length]] || G.CITY.lots.plaza; if (!Lt) return; const x = A.cx + Lt.x + (i % 2 ? 22 : -22), z = A.cz + Lt.z - 25; const g = new T.Group(), M = c => new T.MeshStandardMaterial({ color: c, roughness: .6 });
    const b = new T.Mesh(new T.BoxGeometry(1.8, 1, 1), M(0xf5f5f5)); b.position.y = .9; g.add(b); const st = new T.Mesh(new T.BoxGeometry(1.82, .25, 1.02), M([0xd32f2f, 0xff8f00, 0xec407a, 0x6d4c41][i])); st.position.y = 1.2; g.add(st);
    for (const s of [-1, 1]) { const w = new T.Mesh(new T.CylinderGeometry(.3, .3, .12, 14).rotateX(Math.PI / 2), M(0x333333)); w.position.set(s * .65, .3, .55); g.add(w); const pl = new T.Mesh(new T.CylinderGeometry(.03, .03, 1.3, 6), M(0x9e9e9e)); pl.position.set(s * .85, 2, 0); g.add(pl); }
    const roof = new T.Mesh(new T.BoxGeometry(2.2, .08, 1.5), M([0xd32f2f, 0xff8f00, 0xec407a, 0x6d4c41][i])); roof.position.y = 2.65; g.add(roof);
    const sg = new T.Sprite(new T.SpriteMaterial({ map: txtTex(m[1] + ' ' + adT(m[2]).toUpperCase(), 512, 128, '#fff8e1', '#4e342e') })); sg.scale.set(2.2, .55, 1); sg.position.y = 3.1; g.add(sg);
    const vr = G.createStickman(0xffffff), vh = new T.Group(); vh.add(vr.stick); vh.position.set(0, 0, .9); vh.rotation.y = Math.PI; g.add(vh); g.position.set(x, 0, z); G.scene.add(g); FOOD.carts.push({ g, m, vr, p: new T.Vector3(x, 0, z) }); });
}
function foodNear() { const P = G.player.position; for (const c of FOOD.carts) if (Math.hypot(P.x - c.p.x, P.z - c.p.z) < 3.2) return c; return null; }
function foodBuy(c) { const [, ic, nm, price, heal] = c.m; let ok = false; try { ok = G.progSpend(price); } catch (e) {} if (!ok) { G.showMsg('💸 ' + adT('Paran yetmiyor') + ` (${price} 🪙)`, 1.6); return; } try { G.hp = Math.min(G.HPMAX, G.hp + heal); } catch (e) {} snd('coin', .8); G.showMsg(`${ic} ${adT(nm)} ${adT('aldın! Afiyet olsun')} · +${heal} ❤️`, 2); }

/* ---------- 🚕 taksi çağır: seçtiğin yere götürür ---------- */
const TAXI = { st: 'off', car: null, t: 0, dest: null };
const DEST = [['plaza', '🏛️', 'Meydan'], ['stage', '🎤', 'Sokak Sahnesi'], ['hospital', '🏥', 'Hastane'], ['bank', '🏦', 'Banka'], ['police', '👮', 'Karakol'], ['gym', '🏋️', 'Spor Salonu'], ['club', '🪩', 'Kulüp'], ['court', '🏀', 'Basket Sahası'], ['pond', '🦆', 'Göl'], ['rest1', '🍽️', 'Restoran'], ['garage', '🔧', 'Garaj'], ['home', '🏠', 'Evim']];
$('shTaxi').addEventListener('click', e => { e.stopPropagation(); taxiCall(); });
function taxiCall() { if (TAXI.st !== 'off' || !inCity() || G.giant) return; const P = G.player.position, f = G.facing; const g = new T.Group(); try { const c = G.buildCar(0xfdd835); g.add(c.g || c); } catch (e) { g.add(new T.Mesh(new T.BoxGeometry(2, 1.4, 4.2), new T.MeshStandardMaterial({ color: 0xfdd835 }))); }
  const sign = new T.Mesh(new T.BoxGeometry(.8, .3, .4), new T.MeshBasicMaterial({ color: 0xffffff })); sign.position.y = 1.9; g.add(sign); g.position.set(P.x + Math.sin(f + 1.2) * 45, 0, P.z + Math.cos(f + 1.2) * 45); G.scene.add(g); TAXI.car = g; TAXI.st = 'come'; TAXI.t = 0; snd('horn', .7); G.showMsg('🚕 ' + adT('Taksi geliyor…'), 2); if (document.pointerLockElement) document.exitPointerLock(); }
function taxiMenu() { const el = $('shTaxiM'); el.innerHTML = `<h3>🚕 ${adT('Nereye gidelim?')} <small style="opacity:.7">(20 🪙)</small></h3>` + DEST.filter(d => G.CITY.lots[d[0]]).map(d => `<button data-d="${d[0]}">${d[1]} ${adT(d[2])}</button>`).join('') + `<button data-d="x">✖ ${adT('Vazgeç')}</button>`; el.style.display = 'block'; }
$('shTaxiM').addEventListener('click', e => { e.stopPropagation(); const b = e.target.closest('[data-d]'); if (!b) return; $('shTaxiM').style.display = 'none'; const k = b.dataset.d; if (k === 'x') { TAXI.st = 'leave'; TAXI.t = 0; return; } let ok = false; try { ok = G.progSpend(20); } catch (x) {} if (!ok) { G.showMsg('💸 ' + adT('Taksi için paran yetmiyor (20 🪙)'), 2); TAXI.st = 'leave'; TAXI.t = 0; return; }
  const Lt = G.CITY.lots[k], A = CA(), sp = Lt.spot || { x: Lt.x, z: Lt.z }; try { G.teleportTo('city', A.cx + sp.x, A.cz + sp.z - 3, Math.PI, '🚕 ' + adT(DEST.find(d => d[0] === k)[2])); } catch (x) {} snd('coin', .7); TAXI.st = 'leave'; TAXI.t = 0; if (TAXI.car) TAXI.car.visible = false; });
function taxiTick(dt) {
  const btn = $('shTaxi'); btn.style.display = inCity() && TAXI.st === 'off' && !G.giant && !CER.on && !G.paused ? 'block' : 'none'; if (TAXI.st === 'off' || !TAXI.car) return; TAXI.t += dt; const P = G.player.position, g = TAXI.car;
  if (TAXI.st === 'come') { V1.subVectors(P, g.position).setY(0); const d = V1.length(); if (d < 4 || TAXI.t > 12) { TAXI.st = 'wait'; TAXI.t = 0; taxiMenu(); snd('horn', .6); } else { g.rotation.y = Math.atan2(V1.x, V1.z); g.position.addScaledVector(V1.normalize(), Math.min(d - 3.5, 14 * dt)); } }
  else if (TAXI.st === 'wait') { if (TAXI.t > 25 || P.distanceTo(g.position) > 30) { $('shTaxiM').style.display = 'none'; TAXI.st = 'leave'; TAXI.t = 0; } }
  else if (TAXI.st === 'leave') { g.position.x += Math.sin(g.rotation.y) * 14 * dt; g.position.z += Math.cos(g.rotation.y) * 14 * dt; if (TAXI.t > 4) { G.scene.remove(g); TAXI.car = null; TAXI.st = 'off'; } }
}

/* ---------- 🏥 hastanede uyanma: şehirde bayılınca hastanede kendine gelirsin ---------- */
const HOSP = { down: false, t: 0 };
function hospTick(dt) {
  if (!inCity()) { HOSP.down = false; return; }
  if (G.dead && !HOSP.down) { HOSP.down = true; HOSP.t = 0; }
  if (HOSP.down && !G.dead) { HOSP.down = false; const Lt = G.CITY.lots.hospital; if (!Lt) return; const A = CA(), sp = Lt.spot || { x: Lt.x, z: Lt.z }; setTimeout(() => { try { G.teleportTo('city', A.cx + sp.x, A.cz + sp.z - 4, Math.PI, '🏥 ' + adT('Hastane')); } catch (e) {} let fee = 0; try { fee = G.progSpend(50) ? 50 : 0; } catch (e) {} G.showMsg('🏥 ' + adT('Hastanede uyandın. Doktorlar seni iyileştirdi') + (fee ? ' · ' + adT('tedavi') + ' 50 🪙' : ''), 3.5); try { G.hp = G.HPMAX; } catch (e) {} }, 400); }
}

/* ---------- 🗣️ V ile etkileşim: büfe ---------- */
function prompt() { if (!inCity() || CER.on || G.giant) return null; const c = foodNear(); if (c) { const [, ic, nm, price, heal] = c.m; return [(G.touchMode ? '👆 ' : 'V — ') + `${ic} ${adT(nm)} ${adT('al')} (${price} 🪙, +${heal} ❤️)`, () => foodBuy(c)]; } return null; }

/* ---------- 🛠️ admin: Şehir ---------- */
try { G.ADM_LIST.splice(1, 0, ['🏙️ Şehir', '🏙️ City', [['sh_inv', '👽', 'Uzaylı istilası başlat', 'Start alien invasion', () => { if (!inCity()) { G.showMsg(adT('Önce şehre git'), 1.6); return; } INV.coolT = 0; if (INV.st === 'off') invStart(); }], ['sh_stop', '🛑', 'İstilayı durdur', 'Stop invasion', () => invStop()], ['sh_cer', '🎖️', 'Başkanın töreni', 'Mayor ceremony', () => { if (!inCity()) { G.showMsg(adT('Önce şehre git'), 1.6); return; } cerStart(); }], ['sh_grp', '👥', 'Arkadaş grupları aç / kapat', 'Friend groups on / off', () => { GRP.on = !GRP.on; G.showMsg('👥 ' + (GRP.on ? adT('Arkadaş grupları açık') : adT('Arkadaş grupları kapalı')), 1.4); }], ['sh_taxi', '🚕', 'Taksi çağır', 'Call taxi', () => taxiCall()]]]); for (const it of G.ADM_LIST[1][2]) G.ADM_F[it[0]] = it[4]; } catch (e) { console.warn('sehir adm', e); }

/* ---------- ⏱️ her kare ---------- */
let lastIn = false;
function tick(dt) {
  if (!dt) return; const t = G.elapsed, ic = inCity();
  if (ic && !lastIn && INV.coolT > 120) INV.coolT = R(100, 160); lastIn = ic;
  if (ic) foodBuild();
  try { invTick(dt, t); } catch (e) { console.warn('inv', e); }
  try { emsTick(dt, t); heliTick(dt, t); } catch (e) { console.warn('ems', e); }
  try { cerTick(dt, t); if (CER.on) cerBubbles(); } catch (e) { console.warn('cer', e); }
  try { grpTick(dt, t); filmTick(dt); fameTick(dt); } catch (e) { console.warn('grp', e); }
  try { taxiTick(dt); hospTick(dt); } catch (e) { console.warn('taxi', e); }
  if (!ic && INV.st !== 'off') invStop();
  tickT -= dt; if (tickT <= 0) $('shTick').style.display = 'none';
  ringsTick(dt); partsTick(dt);
  for (const f of FOOD.carts) { f.g.visible = ic; try { G.animateStick(f.vr, dt, { speed: 0 }); } catch (e) {} }
}
function npc(n, dt) { const g = n.grp; if (!g) return false; if (g.kind === 'film') { if (!GRP.list.includes(g)) { n.grp = null; return false; } return filmNpc(n, dt, g); } return grpNpc(n, dt); }

window.__sehir = { tick, npc, cam: cerCam, prompt, targets: alienTargets, ray: rayHit, blast, punch, invStart, invStop, cerStart, INV, CER, GRP, FAME, EMS, TAXI, FOOD };
})(window.__sftG);
