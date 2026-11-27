/* 🔮 S.F.T · Kozmik küre (cosmic.js) — envanterin başındaki küreyi eline al, V ile kullan: küre animasyonla içine girer, mor kozmik mod açılır.
   Kozmik modda: bileklerden yumruk + mor lazer (lazerin çevresinde dolanan ışıklar; ortaya ve 10 m içindeki en yakın düşmanlara),
   tek yumruk uzağa fırlatır, art arda yumrukta 60'a kadar hayalet kol hızlı küçük yumruklar atar, uçarken ayaklardan mor alev ve daha hızlı uçuş,
   hızlanmada bol efekt, kayarken yerden alev ve daha uzun kayma, daha geniş kalkan ve yakındaki arkadaşlara tam kalkan,
   X (telefonda ☄️): baktığın yere gökten lazer → yıldırım → düşen kozmik göktaşı. Gökyüzü uzay gibi olur. K: küre çıkar, uzaya uçar, boş ele dönersin.
   Küre içindeyken can iki katı. C (👥): içinden 6 mor gölge çıkar, uçarak düşmanlara çoklu yumruk atar, vurdukları canın yarısı sana geçer, ölene kadar dövüşür.
   Z (🗡️): kozmik kılıç çağır · tek basış uzun savurma · art arda basış: kılıç kare kare konumlara ışınlanıp keser (akıcı animasyon yok).
   Kılıç açıkken 1-9: kaç kılıç (her biri kendi yönünde saldırır) · nokta (.): hepsi birleşip ilk kılıcın yerinde dev parlak kılıç olur (aynı kontroller; X gökten saldırı yakındaki düşmanlara da düşer) · 0: kılıçları kapat.
   index.html bunu yükler; oyunun değişkenlerine window.__sftG (G) ile erişir. Tasarımlar bu oyuna özgüdür. */
(function (G) {
'use strict';
const T = G.THREE, $ = id => document.getElementById(id), adT = s => G.adT(s);
const CO = { on: false, anim: null, punches: [], rush: 0, rushN: 0, rushHit: 0, strikes: [], cd: 0, allyT: 0, shT: 0, skyK: 0, lasT: 0, beams: [] };
const R = (a, b) => a + Math.random() * (b - a);
const V1 = new T.Vector3(), V2 = new T.Vector3(), V3 = new T.Vector3(), V4 = new T.Vector3(), Q1 = new T.Quaternion(), UP = new T.Vector3(0, 1, 0), dmy = new T.Object3D();
const PURPLE = 0xb06bff, PINK = 0xff5df0;
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; }
const CDARK = new T.Color(.05, .03, .12), FOGB = { far: 0, last: -1, col: new T.Color(), colLast: new T.Color(-1, -1, -1) };
const glowTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(220,170,255,.6)'); gr.addColorStop(1, 'rgba(120,60,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
const addMat = (c, o = .8) => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false });
const on = () => CO.on;

/* ---------- 🔊 sesler ---------- */
function ac() { if (!CO.ac) { try { CO.ac = new (window.AudioContext || window.webkitAudioContext)(); CO.out = CO.ac.createGain(); CO.out.gain.value = .5; CO.out.connect(CO.ac.destination); } catch (e) { return null; } } if (CO.ac.state === 'suspended') CO.ac.resume().catch(() => {}); return CO.ac; }
for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, () => { if (CO.ac && CO.ac.state === 'suspended') CO.ac.resume().catch(() => {}); }, { passive: true });
function nbuf() { if (CO.nb) return CO.nb; const c = ac(), b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return CO.nb = b; }
function snd(kind, vol = 1) {
  const c = ac(); if (!c || c.state !== 'running') return; const t = c.currentTime, g = c.createGain(); g.connect(CO.out);
  const tone = (type, f0, f1, a, d, v) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t + a); o.frequency.exponentialRampToValueAtTime(f1, t + a + d); const gg = c.createGain(); gg.gain.setValueAtTime(0, t + a); gg.gain.linearRampToValueAtTime(v * vol, t + a + .02); gg.gain.exponentialRampToValueAtTime(.0001, t + a + d); o.connect(gg).connect(g); o.start(t + a); o.stop(t + a + d + .05); };
  const noise = (a, d, f, q, v, type = 'bandpass') => { const n = c.createBufferSource(); n.buffer = nbuf(); const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const gg = c.createGain(); gg.gain.setValueAtTime(v * vol, t + a); gg.gain.exponentialRampToValueAtTime(.0001, t + a + d); n.connect(fl).connect(gg).connect(g); n.start(t + a); n.stop(t + a + d + .05); };
  if (kind === 'in') { tone('sine', 180, 1400, 0, 1.2, .18); tone('triangle', 90, 700, .1, 1.1, .12); for (let k = 0; k < 8; k++) tone('sine', 1200 + k * 180, 2400 + k * 200, k * .12, .25, .05); }
  else if (kind === 'burst') { tone('sine', 120, 30, 0, .9, .4); noise(0, .7, 900, .7, .3, 'lowpass'); tone('sawtooth', 900, 120, 0, .5, .08); }
  else if (kind === 'out') { tone('sine', 300, 1800, 0, 1.4, .16); noise(0, 1.2, 2400, 2, .08); }
  else if (kind === 'punch') { tone('sine', 160, 40, 0, .35, .35); noise(0, .2, 600, 1, .25); tone('sawtooth', 700, 150, 0, .2, .08); }
  else if (kind === 'tap') { noise(0, .06, 1200 + Math.random() * 800, 2, .12); tone('sine', 300, 120, 0, .06, .08); }
  else if (kind === 'skylaser') { tone('sawtooth', 1600, 200, 0, 1, .12); tone('sine', 400, 80, 0, 1.1, .2); }
  else if (kind === 'meteor') { noise(0, 1, 500, .6, .2, 'lowpass'); tone('sine', 900, 120, 0, .9, .1); }
  else if (kind === 'impact') { tone('sine', 90, 25, 0, 1.2, .5); noise(0, 1, 400, .5, .45, 'lowpass'); }
  else if (kind === 'shield') { tone('sine', 520, 780, 0, .4, .1); tone('sine', 780, 1170, .05, .4, .07); }
}
function laserLoop(want) {
  const c = want ? ac() : CO.ac; if (!c) return;
  if (want && !CO.lz) { const o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(); o.type = 'sawtooth'; o.frequency.value = 180; o2.type = 'square'; o2.frequency.value = 271; f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 3; lfo.frequency.value = 18; lg.gain.value = .05; lfo.connect(lg).connect(g.gain); g.gain.value = .07; o.connect(f); o2.connect(f); f.connect(g).connect(CO.out); o.start(); o2.start(); lfo.start(); CO.lz = { o, o2, lfo, g }; }
  else if (!want && CO.lz) { const z = CO.lz; CO.lz = null; z.g.gain.cancelScheduledValues(c.currentTime); z.g.gain.setValueAtTime(z.g.gain.value, c.currentTime); z.g.gain.linearRampToValueAtTime(0, c.currentTime + .12); setTimeout(() => { for (const x of [z.o, z.o2, z.lfo]) try { x.stop(); } catch (e) {} }, 200); }
}

/* ---------- 🔮 eldeki küre ---------- */
function orbMesh(s = 1) {
  const g = new T.Group(); const core = new T.Mesh(new T.SphereGeometry(.07 * s, 16, 12), new T.MeshBasicMaterial({ color: 0xffe6ff, toneMapped: false })); g.add(core);
  const shell = new T.Mesh(new T.SphereGeometry(.12 * s, 20, 14), new T.MeshStandardMaterial({ color: 0x7a3cff, emissive: 0x6a2bff, emissiveIntensity: .9, transparent: true, opacity: .55, roughness: .1, metalness: .3 })); g.add(shell);
  const sw = new T.Mesh(new T.TorusGeometry(.1 * s, .012 * s, 6, 24), addMat(PINK, .9)); g.add(sw); const sw2 = sw.clone(); sw2.rotation.x = Math.PI / 2; g.add(sw2);
  const gl = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: 0xc89bff, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); gl.scale.setScalar(.55 * s); g.add(gl);
  g.userData.spin = [sw, sw2]; return g;
}
let handOrb = null;
function handOrbTick(dt) {
  if (!handOrb) { if (!G.HAND) return; handOrb = orbMesh(1); handOrb.position.set(0, .02, .06); G.HAND.add(handOrb); }
  const show = G.INV.eq === 'cosmic' && !CO.on && !CO.anim && !G.giant; handOrb.visible = show;
  if (show) for (const s of handOrb.userData.spin) { s.rotation.y += dt * 3; s.rotation.z += dt * 1.7; }
}

/* ---------- ✨ parçacıklar (mor alev, aura, kıvılcım) ---------- */
const NP = 900, pPos = new Float32Array(NP * 3).fill(-1e5), pCol = new Float32Array(NP * 3), pD = [...Array(NP)].map(() => ({ l: 0, m: 1, v: new T.Vector3(), c: new T.Color() }));
const pGeo = new T.BufferGeometry(); pGeo.setAttribute('position', new T.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new T.BufferAttribute(pCol, 3));
const parts = new T.Points(pGeo, new T.PointsMaterial({ size: .55, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false })); parts.frustumCulled = false; G.scene.add(parts);
let pI = 0;
function emit(x, y, z, vx, vy, vz, life, col) { const i = pI = (pI + 1) % NP, d = pD[i]; d.l = d.m = life; d.v.set(vx, vy, vz); d.c.setHex(col); pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z; }
function burst(p, n, sp, col, life = .8) { for (let k = 0; k < n; k++) { V4.set(R(-1, 1), R(-1, 1), R(-1, 1)).normalize().multiplyScalar(R(.3, 1) * sp); emit(p.x, p.y, p.z, V4.x, V4.y, V4.z, R(life * .5, life), Math.random() < .5 ? col : PINK); } }
function partsTick(dt) {
  for (let i = 0; i < NP; i++) { const d = pD[i]; if (d.l <= 0) continue; d.l -= dt; if (d.l <= 0) { pPos[i * 3 + 1] = -1e5; continue; } const k = d.l / d.m; pPos[i * 3] += d.v.x * dt; pPos[i * 3 + 1] += d.v.y * dt; pPos[i * 3 + 2] += d.v.z * dt; d.v.multiplyScalar(Math.exp(-1.5 * dt)); pCol[i * 3] = d.c.r * k; pCol[i * 3 + 1] = d.c.g * k; pCol[i * 3 + 2] = d.c.b * k; }
  pGeo.attributes.position.needsUpdate = pGeo.attributes.color.needsUpdate = true;
}

/* ---------- 🟣 lazer ışınları (çekirdek + parıltı + çevresinde dolanan ışıklar) ---------- */
const NB = 6, HN = 44, hPos = new Float32Array(NB * HN * 3).fill(-1e5), hGeo = new T.BufferGeometry(); hGeo.setAttribute('position', new T.BufferAttribute(hPos, 3));
const helix = new T.Points(hGeo, new T.PointsMaterial({ size: .32, map: glowTex, color: 0xe6b3ff, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false })); helix.frustumCulled = false; G.scene.add(helix);
for (let i = 0; i < NB; i++) { const core = new T.Mesh(new T.CylinderGeometry(.045, .045, 1, 8, 1, true).translate(0, .5, 0), addMat(0xfff0ff, .95)), glow = new T.Mesh(new T.CylinderGeometry(.2, .2, 1, 12, 1, true).translate(0, .5, 0), addMat(PURPLE, .4)), hit = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: 0xd9a6ff, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
  hit.scale.setScalar(1.6); for (const m of [core, glow, hit]) { m.visible = false; m.frustumCulled = false; G.scene.add(m); } CO.beams.push({ core, glow, hit, on: false }); }
function beamSet(i, a, b, t) {
  const B = CO.beams[i]; B.on = true; V1.subVectors(b, a); const L = V1.length() || .01; V1.divideScalar(L); Q1.setFromUnitVectors(UP, V1);
  for (const m of [B.core, B.glow]) { m.visible = true; m.position.copy(a); m.quaternion.copy(Q1); m.scale.set(1 + Math.sin(t * 40 + i) * .15, L, 1 + Math.sin(t * 40 + i) * .15); }
  B.hit.visible = true; B.hit.position.copy(b); B.hit.scale.setScalar(1.4 + Math.sin(t * 30) * .3);
  const u = V2.set(1, 0, 0); if (Math.abs(V1.x) > .9) u.set(0, 0, 1); u.cross(V1).normalize(); const v = V3.crossVectors(V1, u);
  for (let k = 0; k < HN; k++) { const s = k / HN, an = s * L * 2.2 - t * 9 + i, r = .32 + Math.sin(s * 20 + t * 6) * .05, o = (i * HN + k) * 3; hPos[o] = a.x + V1.x * s * L + (u.x * Math.cos(an) + v.x * Math.sin(an)) * r; hPos[o + 1] = a.y + V1.y * s * L + (u.y * Math.cos(an) + v.y * Math.sin(an)) * r; hPos[o + 2] = a.z + V1.z * s * L + (u.z * Math.cos(an) + v.z * Math.sin(an)) * r; }
  if (Math.random() < .5) emit(b.x, b.y, b.z, R(-3, 3), R(0, 4), R(-3, 3), .4, PINK);
}
function beamsOff(from = 0) { for (let i = from; i < NB; i++) { const B = CO.beams[i]; if (!B.on) continue; B.on = false; B.core.visible = B.glow.visible = B.hit.visible = false; for (let k = 0; k < HN; k++) hPos[(i * HN + k) * 3 + 1] = -1e5; } hGeo.attributes.position.needsUpdate = true; }

/* ---------- 👊 hayalet kollar (art arda yumrukta 60'a kadar) ---------- */
const armGeo = G.mergeGeometries([new T.CylinderGeometry(.06, .08, 1, 6).rotateX(Math.PI / 2).translate(0, 0, .5), new T.SphereGeometry(.17, 10, 8).translate(0, 0, 1.02)].map(g => g.index ? g.toNonIndexed() : g));
const arms = new T.InstancedMesh(armGeo, addMat(0xc488ff, .55), 60); arms.frustumCulled = false; arms.count = 0; G.scene.add(arms);
const armD = [...Array(60)].map((_, i) => ({ a: (i / 60 - .5) * 2.6 + R(-.08, .08), r: R(.5, 1.4), h: R(.6, 2), w: R(16, 26), ph: R(0, 6), side: i % 2 ? 1 : -1 }));

/* ---------- 🛡️ kalkan küresi ---------- */
const hexTex = canvasTex(256, 256, (g, W) => { g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; const s = 22, h = s * Math.sqrt(3); for (let y = -1; y < 9; y++) for (let x = -1; x < 9; x++) { const cx = x * s * 3 + (y % 2) * s * 1.5, cy = y * h / 2; g.beginPath(); for (let k = 0; k <= 6; k++) { const a = k * Math.PI / 3; g.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s); } g.stroke(); } });
hexTex.wrapS = hexTex.wrapT = T.RepeatWrapping; hexTex.repeat.set(4, 2);
function domeMesh(r) { const m = new T.Mesh(new T.SphereGeometry(r, 32, 20), new T.MeshBasicMaterial({ map: hexTex, color: 0xb98cff, transparent: true, opacity: .35, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false })); m.visible = false; m.frustumCulled = false; G.scene.add(m); return m; }
const dome = domeMesh(3.4), allyDome = domeMesh(1.7), friendDome = domeMesh(3.4);

/* ---------- 🌌 uzay gibi gökyüzü ---------- */
let skyBall = null;
function skyTick(dt) {
  const want = CO.on && G.curKey !== 'space'; CO.skyK += ((want ? 1 : 0) - CO.skyK) * Math.min(1, dt * 1.5);
  if (CO.skyK > .01 && !skyBall) { const mat = window.__spc && __spc.skyMat ? __spc.skyMat() : new T.MeshBasicMaterial({ color: 0x07041a, side: T.BackSide }); mat.transparent = true; mat.depthTest = false; mat.depthWrite = false;
    if (mat.uniforms) { mat.uniforms.uK = { value: 0 }; mat.fragmentShader = mat.fragmentShader.replace('uniform float uTime;', 'uniform float uTime; uniform float uK;').replace('gl_FragColor = vec4(col, 1.0);', 'gl_FragColor = vec4(col, uK);'); mat.uniforms.uTime = mat.uniforms.uTime || { value: 0 }; }
    mat.transparent = false; mat.blending = T.CustomBlending; mat.blendSrc = T.SrcAlphaFactor; mat.blendDst = T.OneMinusSrcAlphaFactor; mat.blendEquation = T.AddEquation;   // opak sırada çizilsin (dünyanın arkasında kalsın)
    skyBall = new T.Mesh(new T.SphereGeometry(900, 48, 24), mat); skyBall.renderOrder = -999; skyBall.frustumCulled = false; }
  if (!skyBall) return;
  if (CO.skyK > .01) { if (!skyBall.parent) G.scene.add(skyBall); skyBall.position.copy(G.camera.position); const u = skyBall.material.uniforms; if (u) { u.uK.value = CO.skyK; if (u.uTime) u.uTime.value = G.elapsed; } else skyBall.material.opacity = CO.skyK;
    const F = G.scene.fog; if (F) { if (F.far !== FOGB.last) FOGB.far = F.far; if (!F.color.equals(FOGB.colLast)) FOGB.col.copy(F.color);   // oyunun kendi sis değerini koru, üstüne uygula
      F.far = FOGB.far * (1 + CO.skyK * .5); F.color.copy(FOGB.col).lerp(CDARK, CO.skyK * .85); FOGB.last = F.far; FOGB.colLast.copy(F.color); } }
  else if (skyBall.parent) { G.scene.remove(skyBall); const F = G.scene.fog; if (F && F.far === FOGB.last) { F.far = FOGB.far; F.color.copy(FOGB.col); } }
}

/* ---------- 🎯 hedefler ---------- */
const targets = () => { try { return G.cosTargets ? G.cosTargets() : []; } catch (e) { return []; } };
function hurtAll(center, rad, dmg, knock, up = 0) { let n = 0; for (const t of targets()) { const cx = t.p.x, cy = t.p.y + t.h * .5, cz = t.p.z, d = Math.hypot(cx - center.x, cz - center.z), dy = Math.abs(cy - center.y); if (d > rad + t.r || dy > rad + t.h) continue; V4.set(cx - center.x, up, cz - center.z); if (V4.lengthSq() < .01) V4.set(0, up, 1); V4.normalize(); try { t.hit(dmg, V4.clone(), knock); } catch (e) {} n++; } return n; }
function aimPoint(max = 80) {
  const cam = G.camera, o = cam.position.clone(), d = new T.Vector3(); cam.getWorldDirection(d); let tt = max;
  try { const r = G.roboRay(o, d, max); if (r && isFinite(r.t)) tt = r.t; } catch (e) {}
  for (const t of targets()) { V4.set(t.p.x, t.p.y + t.h * .5, t.p.z).sub(o); const along = V4.dot(d); if (along < 0 || along > tt) continue; const perp = V4.addScaledVector(d, -along).length(); if (perp < t.r + .4) tt = along; }
  return o.addScaledVector(d, tt);
}
const hand = (s, out) => { const r = G.playerRig, a = s > 0 ? r.armL : r.armR; return a.el.localToWorld(out.set(0, -.33, 0)); };
const foot = (s, out) => { const r = G.playerRig, l = s > 0 ? r.legL : r.legR; return l.kn.localToWorld(out.set(0, -.48, 0)); };

/* ---------- ⚡ aç / kapat ---------- */
function activate() {
  if (CO.on || CO.anim || G.INV.eq !== 'cosmic') return; const p = new T.Vector3(); if (handOrb) handOrb.getWorldPosition(p); else p.copy(G.player.position).y += 1.2;
  const fo = orbMesh(1.6); fo.position.copy(p); G.scene.add(fo); CO.anim = { type: 'in', t: 0, orb: fo, from: p.clone() }; snd('in'); G.play('magic');
}
function deactivate(toFist = true) {
  if (!CO.on) return; CO.on = false; laserLoop(false); beamsOff(); arms.count = 0; dome.visible = false; CO.rush = 0;
  if (CO.hpBase) { G.HPMAX = CO.hpBase; G.hp = Math.min(G.hp, G.HPMAX); CO.hpBase = 0; }
  const p = G.playerRig.torso.localToWorld(new T.Vector3(0, .35, 0)), fo = orbMesh(1.6); fo.position.copy(p); fo.scale.setScalar(.01); G.scene.add(fo); CO.anim = { type: 'out', t: 0, orb: fo, from: p.clone() }; snd('out');
  if (toFist && G.INV.eq === 'cosmic') G.equip('fist');
  G.showMsg('🔮 ' + adT('Küre uzaya uçtu'), 1.6); document.body.classList.toggle('cosmicOn', false);
}
function animTick(dt) {
  const A = CO.anim; if (!A) return; A.t += dt; const o = A.orb, t = A.t, P = G.player.position;
  for (const s of o.userData.spin) { s.rotation.y += dt * 8; s.rotation.z += dt * 5; }
  const chest = G.playerRig.torso.localToWorld(V1.set(0, .35, 0));
  if (A.type === 'in') { const front = V2.copy(chest).add(V3.set(Math.sin(G.facing) * .7, .25, Math.cos(G.facing) * .7));
    if (t < .7) { o.position.lerpVectors(A.from, front, Math.min(1, t / .7)); o.scale.setScalar(1 + t * .6); } else { const k = Math.min(1, (t - .7) / .6); o.position.lerpVectors(front, chest, k * k); o.scale.setScalar(1.4 * (1 - k) + .01); }
    for (let k = 0; k < 4; k++) { const a = R(0, 6.28), r = R(1, 2); emit(o.position.x + Math.cos(a) * r, o.position.y + R(-.8, .8), o.position.z + Math.sin(a) * r, -Math.cos(a) * r * 2, R(-.5, .5), -Math.sin(a) * r * 2, .5, Math.random() < .5 ? PURPLE : PINK); }
    if (t >= 1.3) { G.scene.remove(o); CO.anim = null; CO.on = true; snd('burst'); CO.hpBase = G.HPMAX; G.HPMAX = CO.hpBase * 2; G.hp = Math.min(G.HPMAX, G.hp * 2);   // ❤️ küre içindeyken can iki katı G.shake = Math.max(G.shake, .4); burst(chest, 120, 9, PURPLE, 1.1); ring(chest, 6, PURPLE);
      document.body.classList.toggle('cosmicOn', true);
      G.showMsg('🔮 ' + adT(G.touchMode ? 'Kozmik mod! Can iki katı · 🔴 lazer · ☄️ gökten saldırı · 👥 6 gölge · 🗡️ kılıç · 🔮 kapat' : 'Kozmik mod! Can iki katı · sağ tık lazer · art arda vur: 60 kol · X gökten saldırı · C 6 gölge · Z kılıç · K kapat'), 4.5); } }
  else { if (t < .8) { const up = V2.copy(chest).add(V3.set(0, 1.4 * t / .8, 0)); o.position.copy(up); o.scale.setScalar(Math.min(1, t / .5) * 1.3); } else { o.position.y += dt * (12 + (t - .8) * 40); emit(o.position.x, o.position.y - .3, o.position.z, R(-.5, .5), -3, R(-.5, .5), .8, Math.random() < .5 ? PURPLE : PINK); }
    if (t > .1 && t < .8) emit(chest.x, chest.y, chest.z, R(-2, 2), R(1, 4), R(-2, 2), .6, PURPLE);
    if (t > 2.6) { G.scene.remove(o); CO.anim = null; } }
}
const rings = [];
function ring(p, R0, col) { const m = new T.Mesh(new T.TorusGeometry(1, .08, 8, 48), addMat(col, .9)); m.position.copy(p); m.rotation.x = Math.PI / 2; m.frustumCulled = false; G.scene.add(m); rings.push({ m, t: 0, R0 }); }
function ringsTick(dt) { for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; const k = r.t / .7; r.m.scale.setScalar(.5 + k * r.R0); r.m.material.opacity = Math.max(0, .9 * (1 - k)); if (k >= 1) { G.scene.remove(r.m); r.m.geometry.dispose(); r.m.material.dispose(); rings.splice(i, 1); } } }

/* ---------- 👊 yumruk: tek vuruş uzağa fırlatır, art arda → 60 kol ---------- */
function punch(dir) {
  const now = G.elapsed; CO.punches = CO.punches.filter(t => now - t < 1.1); CO.punches.push(now);
  if (CO.punches.length >= 3) { if (CO.rush <= 0) CO.rushN = 10; CO.rush = 1.6; }
  const P = G.player.position, c = V1.set(P.x + dir.x * 1.8, P.y + 1.2, P.z + dir.z * 1.8), hs = hand(-1, V2);
  const n = hurtAll(c, 2.6, CO.rush > 0 ? 22 : 45, CO.rush > 0 ? 6 : 26, CO.rush > 0 ? .3 : .55);
  for (let k = 0; k < 22; k++) emit(hs.x, hs.y, hs.z, dir.x * R(6, 14) + R(-2, 2), R(-1, 2), dir.z * R(6, 14) + R(-2, 2), .35, Math.random() < .5 ? PURPLE : PINK);
  ring(V3.set(P.x + dir.x * 1.2, P.y + 1.2, P.z + dir.z * 1.2), 2.2, PINK); snd('punch', n ? 1 : .6); if (n) G.shake = Math.max(G.shake, .3);
}
function rushTick(dt, t) {
  if (CO.rush <= 0) { arms.count = 0; return; } CO.rush -= dt; CO.rushN = Math.min(60, CO.rushN + dt * 38); const n = Math.floor(CO.rushN); arms.count = n;
  const P = G.player.position, f = G.facing, fx = Math.sin(f), fz = Math.cos(f), rx = Math.cos(f), rz = -Math.sin(f);
  for (let i = 0; i < n; i++) { const d = armD[i], e = Math.abs(Math.sin(t * d.w + d.ph)), bx = P.x + rx * Math.sin(d.a) * d.r - fx * .2, by = P.y + d.h, bz = P.z + rz * Math.sin(d.a) * d.r - fz * .2;
    const tx = P.x + fx * 3.6 + rx * Math.sin(d.a) * .9, ty = P.y + 1.2 + (d.h - 1.2) * .3, tz = P.z + fz * 3.6 + rz * Math.sin(d.a) * .9; V1.set(tx - bx, ty - by, tz - bz); const L = V1.length();
    dmy.position.set(bx, by, bz); dmy.lookAt(tx, ty, tz); dmy.scale.set(1, 1, Math.max(.15, e * L)); dmy.updateMatrix(); arms.setMatrixAt(i, dmy.matrix); }
  arms.instanceMatrix.needsUpdate = true;
  CO.rushHit -= dt; if (CO.rushHit <= 0) { CO.rushHit = .07; const c = V1.set(P.x + fx * 3, P.y + 1.2, P.z + fz * 3); const hitN = hurtAll(c, 2.4, 6, 2.5, .15); snd('tap', hitN ? 1 : .5); for (let k = 0; k < 4; k++) emit(c.x + R(-1.2, 1.2), c.y + R(-.8, .8), c.z + R(-1.2, 1.2), R(-2, 2), R(0, 3), R(-2, 2), .3, Math.random() < .5 ? 0xffffff : PINK); }
}

/* ---------- 🟣 lazer: ortaya + 10 m içindeki en yakın düşmanlara ---------- */
function laserTick(dt, t) {
  const want = CO.on && G.laserHeld && !CO.anim && !G.dead;
  if (!want) { if (CO.lasOn) { CO.lasOn = false; beamsOff(); laserLoop(false); } return; }
  if (!CO.lasOn) { CO.lasOn = true; laserLoop(true); }
  const aim = aimPoint(), hL = hand(1, new T.Vector3()), hR = hand(-1, new T.Vector3()); beamSet(0, hL, aim, t); beamSet(1, hR, aim, t);
  const P = G.player.position, near = targets().map(x => ({ x, d: Math.hypot(x.p.x - P.x, x.p.z - P.z) })).filter(o => o.d < 10).sort((a, b) => a.d - b.d).slice(0, 4);
  near.forEach((o, i) => beamSet(2 + i, i % 2 ? hR : hL, new T.Vector3(o.x.p.x, o.x.p.y + o.x.h * .55, o.x.p.z), t)); beamsOff(2 + near.length); hGeo.attributes.position.needsUpdate = true;
  CO.lasT -= dt; if (CO.lasT <= 0) { CO.lasT = .1; hurtAll(aim, 1.8, 8, 1.2); for (const o of near) try { o.x.hit(6, V4.set(o.x.p.x - P.x, 0, o.x.p.z - P.z).normalize().clone(), 1); } catch (e) {} }
  const cam = G.camera, d = V2; cam.getWorldDirection(d); const fa = Math.atan2(d.x, d.z); G.facing = fa; G.charHolder.rotation.y = fa;
}

/* ---------- ☄️ gökten lazer → yıldırım → göktaşı ---------- */
function strike() {
  if (!CO.on || CO.cd > 0 || CO.anim) return; CO.cd = 2.6; const p = aimPoint(120); CO.castT = 1; strikeAt(p);
  if (SW.giant) { const P = G.player.position, TL = targets().map(o => [o, Math.hypot(o.p.x - P.x, o.p.z - P.z)]).filter(x => x[1] < 35 && Math.hypot(x[0].p.x - p.x, x[0].p.z - p.z) > 4).sort((a, b) => a[1] - b[1]).slice(0, 6);   // ⚔️ dev kılıç: yakındaki düşmanlara da düşer
    TL.forEach((x, k) => strikeAt(new T.Vector3(x[0].p.x, x[0].p.y, x[0].p.z), .1 + k * .1)); }
  snd('skylaser'); G.play('magic');
}
function strikeAt(p, delay = 0) {
  const col = new T.Mesh(new T.CylinderGeometry(1.4, 1.4, 120, 16, 1, true).translate(0, 60, 0), addMat(PURPLE, .55)), core = new T.Mesh(new T.CylinderGeometry(.35, .35, 120, 10, 1, true).translate(0, 60, 0), addMat(0xffffff, .9));
  for (const m of [col, core]) { m.position.copy(p); m.frustumCulled = false; G.scene.add(m); }
  CO.strikes.push({ p: p.clone(), t: -delay, col, core, bolt: null, met: null, done: [] }); if (delay) col.visible = core.visible = false;
}
function boltMesh(p) { const pts = [], n = 16; let x = p.x + R(-3, 3), z = p.z + R(-3, 3); for (let k = 0; k <= n; k++) { const y = p.y + 70 * (1 - k / n); pts.push(new T.Vector3(x, y, z)); x += (p.x - x) / (n - k + 1) + R(-1.4, 1.4); z += (p.z - z) / (n - k + 1) + R(-1.4, 1.4); } pts[n].copy(p);
  const g = new T.Group(); for (let k = 0; k < n; k++) { const a = pts[k], b = pts[k + 1]; V1.subVectors(b, a); const L = V1.length(); const m = new T.Mesh(new T.CylinderGeometry(.12, .12, 1, 5, 1, true).translate(0, .5, 0), addMat(0xf3e0ff, 1)); m.position.copy(a); m.quaternion.setFromUnitVectors(UP, V1.normalize()); m.scale.y = L; g.add(m); const m2 = new T.Mesh(m.geometry, addMat(PURPLE, .5)); m2.position.copy(m.position); m2.quaternion.copy(m.quaternion); m2.scale.set(4, L, 4); g.add(m2); }
  g.traverse(o => o.frustumCulled = false); G.scene.add(g); return g; }
function strikesTick(dt, t) {
  CO.cd = Math.max(0, CO.cd - dt); CO.castT = Math.max(0, (CO.castT || 0) - dt);
  for (let i = CO.strikes.length - 1; i >= 0; i--) { const S = CO.strikes[i]; S.t += dt; const p = S.p; if (S.t < 0) continue; if (S.col && !S.col.visible) { S.col.visible = S.core.visible = true; snd('skylaser', .5); }
    if (S.col) { const k = Math.min(1, S.t / .2), w = S.t < .7 ? k * (1 + Math.sin(t * 50) * .1) : Math.max(0, 1 - (S.t - .7) / .25); S.col.scale.set(w, 1, w); S.core.scale.set(w, 1, w); if (S.t < .7) { if (Math.random() < .8) emit(p.x + R(-1.5, 1.5), p.y + R(0, 30), p.z + R(-1.5, 1.5), 0, -R(5, 15), 0, .5, PURPLE); if ((S.tk = (S.tk || 0) - dt) <= 0) { S.tk = .12; hurtAll(p, 3.5, 9, 1, .2); } } if (S.t > .95) { G.scene.remove(S.col); G.scene.remove(S.core); S.col = null; } }
    if (S.t > .7 && !S.done.includes('bolt')) { S.done.push('bolt'); S.bolt = boltMesh(p); G.play('thunder', { gain: .9 }); G.shake = Math.max(G.shake, .5); burst(p, 60, 8, 0xf3e0ff, .7); hurtAll(p, 4.5, 60, 10, .5); ring(V1.copy(p).setY(p.y + .3), 7, 0xf3e0ff); }
    if (S.bolt && S.t > 1.05) { G.scene.remove(S.bolt); S.bolt = null; }
    if (S.t > 1.1 && !S.done.includes('met')) { S.done.push('met'); S.met = orbMesh(9); S.met.position.set(p.x + 25, p.y + 70, p.z + 10); G.scene.add(S.met); snd('meteor'); }
    if (S.met) { const k = Math.min(1, (S.t - 1.1) / .55); S.met.position.set(p.x + 25 * (1 - k), p.y + 70 * (1 - k) + .5, p.z + 10 * (1 - k)); for (let j = 0; j < 5; j++) emit(S.met.position.x + R(-.6, .6), S.met.position.y + R(-.6, .6), S.met.position.z + R(-.6, .6), R(1, 4), R(2, 6), R(0, 2), .7, Math.random() < .5 ? PURPLE : 0xffa8ff);
      if (k >= 1) { G.scene.remove(S.met); S.met = null; snd('impact'); G.shake = Math.max(G.shake, 1); burst(p, 180, 14, PURPLE, 1.2); ring(V1.copy(p).setY(p.y + .4), 12, PURPLE); ring(V1.copy(p).setY(p.y + 1.2), 8, PINK); hurtAll(p, 6.5, 90, 22, .7); } }
    if (S.t > 2.2) CO.strikes.splice(i, 1); }
}

/* ---------- 🛡️ kalkan, 🔥 uçuş ve kayma efektleri, aura ---------- */
function shieldTick(dt, t) {
  const P = G.player.position, sh = CO.on && G.shielding;
  dome.visible = sh; if (sh) { dome.position.set(P.x, P.y + 1, P.z); dome.rotation.y += dt * .6; dome.material.opacity = .3 + Math.sin(t * 5) * .08; dome.material.map.offset.y = t * .05; if (!CO.shWas) snd('shield'); if (Math.random() < .6) { const a = R(0, 6.28), b = R(0, 1.3); emit(P.x + Math.cos(a) * Math.cos(b) * 3.4, P.y + 1 + Math.sin(b) * 3.4, P.z + Math.sin(a) * Math.cos(b) * 3.4, 0, .5, 0, .6, PURPLE); }
    CO.shT -= dt; if (CO.shT <= 0) { CO.shT = .35; try { if (G.MP.on && G.MP.started) G.mpSend({ t: 'cosh', x: +P.x.toFixed(1), y: +P.y.toFixed(1), z: +P.z.toFixed(1), r: 8 }); } catch (e) {} } }
  CO.shWas = sh;
  const ally = CO.allyT > G.elapsed; allyDome.visible = ally && !sh; if (ally) { allyDome.position.set(P.x, P.y + 1, P.z); allyDome.material.opacity = .28 + Math.sin(t * 6) * .06; }
  friendDome.visible = CO.friendT > G.elapsed; if (friendDome.visible) { friendDome.position.copy(CO.friendP); friendDome.rotation.y += dt * .6; }
}
function fxTick(dt, t) {
  if (!CO.on) return; const P = G.player.position;
  // aura: gövdeden yükselen mor kıvılcımlar, bileklerde ışık
  for (let k = 0; k < 2; k++) { const a = R(0, 6.28), r = R(.3, .7); emit(P.x + Math.cos(a) * r, P.y + R(.2, 1.9), P.z + Math.sin(a) * r, 0, R(.5, 1.8), 0, R(.5, 1), Math.random() < .6 ? PURPLE : PINK); }
  for (const s of [-1, 1]) { const h = hand(s, V1); if (Math.random() < .7) emit(h.x, h.y, h.z, R(-.3, .3), R(.2, .8), R(-.3, .3), .35, 0xe6b3ff); }
  // uçuş: ayaklardan mor alev
  if (G.flyingNow) { const boost = G.boostMode, n = boost ? 7 : 4; for (const s of [-1, 1]) { const f = foot(s, V1); for (let k = 0; k < n; k++) emit(f.x + R(-.08, .08), f.y, f.z + R(-.08, .08), -G.vel.x * .3 + R(-.6, .6), -R(4, 9), -G.vel.z * .3 + R(-.6, .6), R(.25, .5), k % 3 ? PURPLE : (k % 2 ? PINK : 0xffffff)); }
    if (boost) { CO.bT = (CO.bT || 0) - dt; if (CO.bT <= 0) { CO.bT = .12; ring(V2.copy(P).setY(P.y + 1), 3, Math.random() < .5 ? PURPLE : PINK); } for (let k = 0; k < 4; k++) emit(P.x + R(-1.5, 1.5), P.y + R(0, 2), P.z + R(-1.5, 1.5), -G.vel.x * .5, R(-1, 1), -G.vel.z * .5, .6, Math.random() < .5 ? 0xffffff : PINK); } }
  // kayma: yerden mor alev
  const sl = G.slideObj; if (sl) for (let k = 0; k < 6; k++) emit(P.x + R(-.5, .5), P.y + .05, P.z + R(-.5, .5), -sl.dir.x * R(1, 4) + R(-1, 1), R(1.5, 4.5), -sl.dir.z * R(1, 4) + R(-1, 1), R(.3, .6), k % 2 ? PURPLE : 0xff7ae0);
}

/* ---------- 👥 çoklu mod: içimizden 6 mor gölge (uçar, çoklu yumruk, can çalar, ölene kadar dövüşür) ---------- */
const SH = { list: [] };
function makeShadow() {
  const r = G.createStickman(0x8a4dff, 0xb98cff), mat = new T.MeshBasicMaterial({ color: 0x7b3fe4, transparent: true, opacity: .82, toneMapped: false }), rim = new T.MeshBasicMaterial({ color: 0xc58bff, transparent: true, opacity: .22, blending: T.AdditiveBlending, depthWrite: false, side: T.BackSide, toneMapped: false });
  const ms = []; r.stick.traverse(o => { if (o.isMesh) ms.push(o); }); for (const o of ms) { o.material = mat; o.castShadow = o.receiveShadow = false; const h = new T.Mesh(o.geometry, rim); h.scale.set(1.3, 1.08, 1.3); o.add(h); }
  const g = new T.Group(), pv = new T.Group(); pv.position.y = 1; r.stick.position.y = -1; pv.add(r.stick); g.add(pv);
  const gl = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: 0xb070ff, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: .6 })); gl.scale.setScalar(2.4); gl.position.y = 1; g.add(gl); G.scene.add(g);
  return { g, pv, r, mat };
}
function shadowsKey() {
  const al = SH.list.filter(s => !s.dead && !s.recall);
  if (al.length >= 6) { for (const s of al) s.recall = true; G.showMsg('👥 ' + adT('Gölgeler içine döndü'), 1.4); snd('out', .5); return; }
  const chest = G.playerRig.torso.localToWorld(new T.Vector3(0, .35, 0));
  for (let k = al.length; k < 6; k++) { const s = makeShadow(); s.g.position.copy(chest).y -= 1; s.g.scale.setScalar(.05); Object.assign(s, { hp: 100, k, ph: k / 6 * Math.PI * 2, born: 0, vel: new T.Vector3(R(-6, 6), R(3, 7), R(-6, 6)), at: R(0, .1), re: 0, tg: null }); SH.list.push(s); }
  burst(chest, 90, 7, PURPLE, .9); ring(chest, 4, PINK); snd('burst', .7); CO.castT = .5; G.showMsg('👥 ' + adT('6 mor gölge çıktı! Düşmanlara saldırıyorlar'), 2);
}
function shadowsTick(dt, t) {
  if (!SH.list.length) return; const P = G.player.position, TL = targets(), cnt = new Map();
  for (const s of SH.list) if (s.tg && !s.dead) cnt.set(s.tg, (cnt.get(s.tg) || 0) + 1);
  for (let i = SH.list.length - 1; i >= 0; i--) { const s = SH.list[i], g = s.g, q = g.position;
    if (s.dead) { s.dead += dt; g.scale.setScalar(1 + s.dead * 2); s.mat.opacity = Math.max(0, .82 * (1 - s.dead / .6)); if (s.dead > .6) { G.scene.remove(g); SH.list.splice(i, 1); } continue; }
    s.born = Math.min(1, s.born + dt * 2.5); const sc = s.born * (2 - s.born);
    if (q.distanceTo(P) > 120) q.set(P.x + R(-3, 3), P.y + 2, P.z + R(-3, 3));
    if (s.recall || !CO.on) { const ch = V1.set(P.x, P.y + .2, P.z); V2.subVectors(ch, q); const d = V2.length(); q.addScaledVector(V2.normalize(), Math.min(d, dt * 22)); g.scale.setScalar(Math.max(.05, Math.min(sc, d / 2))); if (d < .5) { emit(P.x, P.y + 1.2, P.z, 0, 2, 0, .5, PINK); G.scene.remove(g); SH.list.splice(i, 1); } continue; }
    g.scale.setScalar(sc);
    let tgt = s.tg ? TL.find(o => o.id === s.tg) : null; s.re -= dt;
    if (!tgt || s.re <= 0) { s.re = .6; let best = null, bd = 1e9; for (const o of TL) { const d = Math.hypot(o.p.x - q.x, o.p.z - q.z) + (cnt.get(o.id) || 0) * 6; if (d < bd && Math.hypot(o.p.x - P.x, o.p.z - P.z) < 50) { bd = d; best = o; } } if (s.tg) cnt.set(s.tg, Math.max(0, (cnt.get(s.tg) || 1) - 1)); s.tg = best ? best.id : null; tgt = best; if (best) cnt.set(best.id, (cnt.get(best.id) || 0) + 1); }
    let goal, fight = false;
    if (tgt) { const a = s.ph + t * 1.1, rr = tgt.r + 1.3; goal = V1.set(tgt.p.x + Math.cos(a) * rr, tgt.p.y + tgt.h * .45 - .6 + Math.sin(t * 3 + s.k) * .25, tgt.p.z + Math.sin(a) * rr); fight = Math.hypot(tgt.p.x - q.x, tgt.p.z - q.z) < tgt.r + 2.4; }
    else { const a = s.ph + t * .7; goal = V1.set(P.x + Math.cos(a) * 3, P.y + .9 + Math.sin(t * 1.4 + s.k) * .45, P.z + Math.sin(a) * 3); }
    V2.subVectors(goal, q).multiplyScalar(3.2); if (V2.length() > 17) V2.setLength(17); s.vel.lerp(V2, Math.min(1, dt * 4)); q.addScaledVector(s.vel, dt);
    const look = tgt ? V3.set(tgt.p.x, q.y, tgt.p.z) : V3.copy(q).add(V4.set(s.vel.x, 0, s.vel.z)); if (look.distanceToSquared(q) > .01) g.rotation.y = Math.atan2(look.x - q.x, look.z - q.z);
    const hs = Math.hypot(s.vel.x, s.vel.z); s.pv.rotation.x += ((fight ? .35 : Math.min(1.35, hs * .12)) - s.pv.rotation.x) * Math.min(1, dt * 5);
    const r = s.r, w = t * 26 + s.k;
    if (fight) { r.armL.sh.rotation.x = -1.55 + Math.sin(w) * .5; r.armR.sh.rotation.x = -1.55 - Math.sin(w) * .5; r.armL.el.rotation.x = -.3 - Math.max(0, Math.cos(w)) * .6; r.armR.el.rotation.x = -.3 - Math.max(0, -Math.cos(w)) * .6; r.armL.sh.rotation.z = .2; r.armR.sh.rotation.z = -.2; }
    else { r.armL.sh.rotation.x = -2.9; r.armR.sh.rotation.x = .2; r.armL.sh.rotation.z = .1; r.armR.sh.rotation.z = -.15; r.armL.el.rotation.x = 0; r.armR.el.rotation.x = -.2; }
    r.legL.hip.rotation.x = .25 + Math.sin(t * 3 + s.k) * .12; r.legR.hip.rotation.x = .1 - Math.sin(t * 3 + s.k) * .12; r.legL.kn.rotation.x = .35; r.legR.kn.rotation.x = .5;
    if (Math.random() < .5) emit(q.x + R(-.3, .3), q.y + R(.3, 1.6), q.z + R(-.3, .3), -s.vel.x * .2, R(.2, .8), -s.vel.z * .2, .45, Math.random() < .5 ? PURPLE : PINK);
    if (fight && tgt) { s.at -= dt; if (s.at <= 0) { s.at = .11; V4.set(tgt.p.x - q.x, 0, tgt.p.z - q.z).normalize(); const dmg = 6; try { tgt.hit(dmg, V4.clone(), 1.2); } catch (e) {}
        G.hp = Math.min(G.HPMAX, G.hp + dmg * .5);   // 🩸 can çalma: verdiği hasarın yarısı sana
        const hx = tgt.p.x - V4.x * tgt.r, hy = tgt.p.y + tgt.h * .5, hz = tgt.p.z - V4.z * tgt.r; for (let k = 0; k < 3; k++) emit(hx, hy, hz, R(-2, 2), R(0, 2.5), R(-2, 2), .3, k ? 0xffffff : PINK);
        emit(hx, hy, hz, (P.x - hx) * 1.6, (P.y + 1.2 - hy) * 1.6, (P.z - hz) * 1.6, .6, 0xff4d9a); if (Math.random() < .35) snd('tap', .35);
        s.hp -= tgt.h > 3 ? 1.6 : .8; s.mat.opacity = .4 + .42 * Math.max(0, s.hp) / 100; if (s.hp <= 0) { s.dead = .001; burst(V1.copy(q).setY(q.y + 1), 40, 5, PURPLE, .7); snd('tap'); } } }
  }
}

/* ---------- 🗡️ kozmik kılıçlar: Z çağır · tek basış savurma · art arda kare kare · 1-9 kaç kılıç · . birleşip dev kılıç · 0 kapat ---------- */
const SW = { list: [], n: 1, giant: false, merging: 0, last: -9, hs: -9, ghosts: [], slashes: [] }, BIG = 4;
let SWG = null;
function swGeo() { if (SWG) return SWG; const bl = new T.Shape(); bl.moveTo(0, 0); bl.lineTo(.13, .2); bl.lineTo(.1, 2.5); bl.lineTo(0, 2.95); bl.lineTo(-.1, 2.5); bl.lineTo(-.13, .2); bl.lineTo(0, 0);
  return SWG = { blade: new T.ExtrudeGeometry(bl, { depth: .05, bevelEnabled: true, bevelSize: .02, bevelThickness: .02, bevelSegments: 1 }).translate(0, .25, -.025), core: new T.BoxGeometry(.03, 2.5, .09).translate(0, 1.55, 0), guard: new T.BoxGeometry(.7, .09, .14).translate(0, .22, 0), grip: new T.CylinderGeometry(.045, .05, .36, 8).translate(0, .02, 0), pom: new T.OctahedronGeometry(.08, 0).translate(0, -.2, 0),
    sl1: new T.CylinderGeometry(.05, .05, 3.6, 6), sl2: new T.CylinderGeometry(.22, .22, 3.6, 8),
    bladeM: new T.MeshStandardMaterial({ color: 0xc9a6ff, emissive: 0x8a4dff, emissiveIntensity: 1.4, metalness: .6, roughness: .2 }), coreM: addMat(0xffffff, .9), guardM: new T.MeshStandardMaterial({ color: 0xffd36a, metalness: .9, roughness: .25, emissive: 0x5a2a00 }), gripM: new T.MeshStandardMaterial({ color: 0x2a1650, roughness: .6 }), pomM: new T.MeshBasicMaterial({ color: 0xff8af0, toneMapped: false }) }; }
function swordMesh(kind) {   // 0 normal · 1 hayalet iz · 2 dev parlak kılıç
  const Z = swGeo(), g = new T.Group(), gh = kind === 1, bm = gh ? addMat(0xc084ff, .5) : Z.bladeM, cm = gh ? addMat(0xffffff, .4) : Z.coreM, gm = gh ? addMat(0xff8af0, .5) : Z.guardM;
  g.add(new T.Mesh(Z.blade, bm), new T.Mesh(Z.core, cm), new T.Mesh(Z.guard, gm), new T.Mesh(Z.grip, gh ? gm : Z.gripM), new T.Mesh(Z.pom, gh ? gm : Z.pomM));
  if (!gh) { const gl = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: 0xb070ff, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: kind === 2 ? .85 : .55 })); gl.scale.set(1.3, 3.6, 1); gl.position.y = 1.5; g.add(gl); }
  if (kind === 2) { const h1 = new T.Mesh(Z.blade, addMat(0xd9a8ff, .32)); h1.scale.set(2.2, 1.04, 4); g.add(h1); const h2 = new T.Mesh(Z.blade, addMat(PINK, .16)); h2.scale.set(3.8, 1.08, 7); g.add(h2);
    for (const y of [.7, 1.7, 2.7]) { const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: 0xffd6ff, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: .65 })); s.scale.setScalar(1.5); s.position.y = y; g.add(s); } }
  g.traverse(o => o.frustumCulled = false); return g;
}
const swScale = s => s.big ? 1.25 * BIG : 1.25, swLen = s => 2.95 * swScale(s) + .3;
function swDir(s) { const N = SW.list.length; return s.big || N <= 1 ? G.facing : G.facing + s.i * Math.PI * 2 / N; }   // her kılıç kendi yönünde
function idlePos(s, out) {
  const P = G.player.position, f = G.facing, sf = Math.sin(f), cf = Math.cos(f), t = G.elapsed;
  if (s.big) return out.set(P.x - cf * 3.6 + sf * 1.2, P.y + 1.7 + Math.sin(t * 1.6) * .15, P.z + sf * 3.6 + cf * 1.2);   // sağda, biraz önde: kamera görsün
  const k = s.i >> 1, sd = s.i & 1 ? -1 : 1, rx = sd * (.95 + k * .55), bk = .35 + k * .12;   // kanat gibi: sağ omuz, sol omuz, sonra dışa ve yukarı doğru
  return out.set(P.x - cf * rx - sf * bk, P.y + 1.45 + k * .42 + Math.sin(t * 2 + s.i) * .08, P.z + sf * rx - cf * bk);
}
function idleQuat(s, pos, q) { const P = G.player.position; V2.set(pos.x - P.x, 0, pos.z - P.z); const L = V2.length() || 1; V2.multiplyScalar((s.big ? .3 : .3 + (s.i >> 1) * .14) / L); V2.y = 1; if (s.big) { V2.x += Math.sin(G.facing) * .45; V2.z += Math.cos(G.facing) * .45; } return q.setFromUnitVectors(UP, V2.normalize()); }
let camAdd = 0; function camK(dt) { camAdd += ((SW.giant && CO.on ? 5.5 : 0) - camAdd) * Math.min(1, (dt || .016) * 3); return camAdd; }   // dev kılıç varken kamera biraz geri çekilir
function newSword(i, from, big) { const s = { g: swordMesh(big ? 2 : 0), i, big: !!big, mode: 'idle', t: 0, hit: false, hold: 0, born: 0 }; s.g.scale.setScalar(.01); if (from) s.g.position.copy(from); else idlePos(s, s.g.position); idleQuat(s, s.g.position, s.g.quaternion); G.scene.add(s.g); return s; }
function dropSword(s) { burst(s.g.position, s.big ? 120 : 24, s.big ? 9 : 4, PURPLE, .6); G.scene.remove(s.g); }
function swHelp(n) { return G.touchMode ? `Kozmik kılıç ×${n}! 🗡️ tek: savur · art arda: kare kare · ×N: rakamla kaç kılıç · ⭐ dev kılıç · ✖ kapat` : `Kozmik kılıç ×${n}! Z: savur · art arda Z: kare kare · 1-9: kaç kılıç · nokta (.): birleşip dev kılıç · 0: kapat`; }
function summon() { SW.giant = false; SW.merging = 0; for (let i = 0; i < SW.n; i++) SW.list.push(newSword(i)); for (const s of SW.list) burst(s.g.position, 30, 5, PURPLE, .6); snd('in', .5); G.showMsg('🗡️ ' + adT(swHelp(SW.n)), 3); }
function swDismiss(quiet) { for (const s of SW.list) dropSword(s); SW.list = []; SW.giant = false; SW.merging = 0; if (!quiet) { snd('out', .35); G.showMsg('🗡️ ' + adT('Kılıçlar kapandı'), 1.2); } }
function setCount(n) {
  SW.n = n; if (SW.giant || SW.merging) { split(); return; }
  if (!SW.list.length) { summon(); return; }
  const from = SW.list[0].g.position.clone();
  while (SW.list.length < n) { const s = newSword(SW.list.length, from); burst(from, 14, 4, PINK, .5); SW.list.push(s); }
  while (SW.list.length > n) dropSword(SW.list.pop());
  SW.list.forEach((s, i) => s.i = i); snd('tap'); G.showMsg('🗡️ ×' + n, 1);
}
function mergeKey() {
  if (!CO.on) return; if (!SW.list.length) summon();
  if (SW.giant) { split(); return; } if (SW.merging) return;
  if (SW.list.length === 1) { finishMerge(); return; }
  SW.merging = .5; for (const s of SW.list) s.mode = 'merge'; snd('in', .6); G.showMsg('✨ ' + adT('Kılıçlar birleşiyor…'), 1);
}
function finishMerge() {
  const at = SW.list[0].g.position.clone(); for (const s of SW.list) G.scene.remove(s.g);
  const b = newSword(0, at, true); b.born = .15; SW.list = [b]; SW.giant = true; SW.merging = 0;
  burst(at, 200, 12, PURPLE, 1); burst(at, 80, 8, 0xffffff, .7); ring(V1.copy(at), 8, PINK); ring(V1.copy(at).setY(at.y + 2), 5, 0xffffff); snd('burst'); G.shake = Math.max(G.shake, .6);
  G.showMsg('⚔️ ' + adT(G.touchMode ? 'Dev kozmik kılıç! Aynı kontroller · ☄️ gökten saldırı artık yakındaki düşmanlara da düşer · ⭐ ayır' : 'Dev kozmik kılıç! Aynı kontroller · X gökten saldırı artık yakındaki düşmanlara da düşer · nokta (.): ayır'), 3.2);
}
function split() {
  const at = SW.list.length ? SW.list[0].g.position.clone() : idlePos({ i: 0 }, new T.Vector3()); for (const s of SW.list) G.scene.remove(s.g);
  SW.list = []; SW.giant = false; SW.merging = 0; for (let i = 0; i < SW.n; i++) SW.list.push(newSword(i, at));
  burst(at, 90, 9, PURPLE, .8); ring(V1.copy(at), 5, PINK); snd('out', .5); G.showMsg('🗡️ ' + adT('Dev kılıç ayrıldı') + ' ×' + SW.n, 1.4);
}
function swordKey() {
  if (!SW.list.length) { summon(); return; } if (SW.merging) return;
  const now = G.elapsed; if (now - SW.last < .45) snapAll(); else swingAll(); SW.last = now;
}
function swingAll() { const N = SW.list.length; for (const s of SW.list) { s.mode = 'swing'; s.t = -s.i * .03; s.hit = false; s.w = s.big || N <= 1 ? 1.95 : Math.max(.55, Math.PI / N + .2); } snd('out', SW.giant ? .6 : .35); }
function swingTick(s, dt, P) {
  s.t += dt; if (s.t < 0) { idleFollow(s, dt); return; }
  const dur = s.big ? .6 : .42, k = Math.min(1, s.t / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, a0 = swDir(s), a = a0 - s.w + e * 2 * s.w, rad = s.big ? 2.6 : 2.1, L = swLen(s);
  s.g.position.set(P.x + Math.sin(a) * rad, P.y + (s.big ? 1.1 : 1.25) - (k - .5) * .5, P.z + Math.cos(a) * rad); V2.set(Math.sin(a), s.big ? .2 : .12, Math.cos(a)).normalize(); s.g.quaternion.setFromUnitVectors(UP, V2);
  for (let j = 0; j < (s.big ? 12 : 4); j++) { const s2 = R(.8, L); emit(P.x + Math.sin(a) * s2, s.g.position.y + R(-.15, .15) + V2.y * s2, P.z + Math.cos(a) * s2, 0, R(0, .5), 0, s.big ? .5 : .35, j % 2 ? PURPLE : 0xffffff); }
  if (!s.hit && k > .45) { s.hit = true; let n = 0;
    for (const o of targets()) { const dx = o.p.x - P.x, dz = o.p.z - P.z, d = Math.hypot(dx, dz); if (d > rad + L - .3 + o.r) continue; const ang = Math.abs(G.wrapAng(Math.atan2(dx, dz) - a0)); if (ang > s.w + .15 && d > 1.2) continue; try { o.hit(s.big ? 120 : 55, new T.Vector3(dx, .4, dz).normalize(), s.big ? 30 : 16); } catch (e) {} n++; }
    if (G.elapsed - SW.hs > .06) { SW.hs = G.elapsed; snd('punch', n ? 1 : .5); } if (n) G.shake = Math.max(G.shake, s.big ? .7 : .35); if (s.i === 0) ring(V1.set(P.x, P.y + 1.25, P.z), s.big ? 14 : 5, PURPLE); if (s.big) burst(V1.set(P.x + Math.sin(a0) * 9, P.y + 1.2, P.z + Math.cos(a0) * 9), 80, 10, PINK, .6); }
  if (k >= 1) s.mode = 'idle';
}
function snapAll() {   // ✨ kare kare: her kılıç aniden kendi hedefinin yanına geçip keser (arada animasyon yok)
  const P = G.player.position, TL = targets().map(o => [o, Math.hypot(o.p.x - P.x, o.p.z - P.z)]).filter(x => x[1] < (SW.giant ? 22 : 12)).sort((a, b) => a[1] - b[1]).map(x => x[0]);
  for (const s of SW.list) snapOne(s, TL.length ? TL[s.i % TL.length] : null);
  snd('tap'); snd('skylaser', SW.giant ? .45 : .25); G.shake = Math.max(G.shake, SW.giant ? .45 : .12);
}
function snapOne(s, tg) {
  const P = G.player.position, a0 = swDir(s), far = s.big ? 8 : 3.2, c = tg ? new T.Vector3(tg.p.x, tg.p.y + tg.h * .5, tg.p.z) : new T.Vector3(P.x + Math.sin(a0) * far, P.y + 1.2, P.z + Math.cos(a0) * far);
  ghostAt(s.g);
  const a = R(0, Math.PI * 2), el = s.big ? R(.25, 1.1) : R(-.6, .9), d = s.big ? 7.5 : (tg ? tg.r : .5) + 1.5;
  s.g.position.set(c.x + Math.cos(a) * Math.cos(el) * d, c.y + Math.sin(el) * d, c.z + Math.sin(a) * Math.cos(el) * d); V2.subVectors(c, s.g.position).normalize(); s.g.quaternion.setFromUnitVectors(UP, V2); s.g.rotateY(R(0, Math.PI));
  s.mode = 'snap'; s.hold = .55;
  const Z = swGeo(), m1 = new T.Mesh(Z.sl1, addMat(0xffffff, 1)), m2 = new T.Mesh(Z.sl2, addMat(PINK, .55)), sc = s.big ? 3.2 : 1; V3.set(R(-1, 1), R(-1, 1), R(-1, 1)).normalize();
  for (const m of [m1, m2]) { m.position.copy(c); m.quaternion.setFromUnitVectors(UP, V3); m.scale.setScalar(sc); m.frustumCulled = false; G.scene.add(m); } SW.slashes.push({ ms: [m1, m2], t: 0, sc });
  if (tg) { try { tg.hit(s.big ? 70 : 26, V2.clone().setY(0).normalize(), s.big ? 9 : 4); } catch (e) {} } hurtAll(c, s.big ? 4 : 1.3, s.big ? 30 : 10, s.big ? 6 : 2);
  burst(c, s.big ? 60 : 18, s.big ? 10 : 6, Math.random() < .5 ? PURPLE : 0xffffff, .4);
}
function ghostAt(src) { let gh = SW.ghosts.find(x => x.t >= .3); if (!gh) { if (SW.ghosts.length < 24) { gh = { g: swordMesh(1), t: 1 }; G.scene.add(gh.g); SW.ghosts.push(gh); } else gh = SW.ghosts[0]; } gh.g.position.copy(src.position); gh.g.quaternion.copy(src.quaternion); gh.g.scale.copy(src.scale); gh.g.visible = true; gh.t = 0; }
function idleFollow(s, dt) { idlePos(s, V1); s.g.position.lerp(V1, Math.min(1, dt * 10)); idleQuat(s, V1, Q1); s.g.quaternion.slerp(Q1, Math.min(1, dt * 8)); }
function swordTick(dt, t) {
  for (const gh of SW.ghosts) { gh.t += dt; gh.g.visible = gh.t < .3; if (gh.g.visible) gh.g.traverse(o => { if (o.material) o.material.opacity = .5 * (1 - gh.t / .3); }); }
  for (let i = SW.slashes.length - 1; i >= 0; i--) { const sl = SW.slashes[i]; sl.t += dt; sl.ms.forEach((m, j) => { m.material.opacity = Math.max(0, (j ? .55 : 1) * (1 - sl.t / .2)); m.scale.set(sl.sc, sl.sc * (1 + sl.t * 2), sl.sc); }); if (sl.t > .2) { for (const m of sl.ms) { G.scene.remove(m); m.material.dispose(); } SW.slashes.splice(i, 1); } }
  if (!SW.list.length) return; if (!CO.on) { swDismiss(true); return; }
  const P = G.player.position;
  if (SW.merging > 0) { SW.merging -= dt; const c = idlePos(SW.list[0], V3); for (const s of SW.list) { s.g.position.lerp(c, Math.min(1, dt * 9)); s.g.rotateY(dt * 14); if (Math.random() < .6) emit(s.g.position.x, s.g.position.y + 1, s.g.position.z, R(-1, 1), R(0, 1), R(-1, 1), .4, PINK); } if (SW.merging <= 0) finishMerge(); return; }
  for (const s of SW.list) {
    s.born = Math.min(1, s.born + dt * 4); s.g.scale.setScalar(swScale(s) * Math.max(.01, s.born * (2 - s.born)));
    if (s.mode === 'swing') swingTick(s, dt, P);
    else if (s.mode === 'snap') { s.hold -= dt; if (s.hold <= 0) { ghostAt(s.g); idlePos(s, s.g.position); idleQuat(s, s.g.position, s.g.quaternion); s.mode = 'idle'; } }
    else idleFollow(s, dt);
    const L = swLen(s); for (let j = 0, n = s.big ? 4 : (Math.random() < .5 ? 1 : 0); j < n; j++) { V4.set(0, R(.4, L - .3), 0).applyQuaternion(s.g.quaternion).add(s.g.position); emit(V4.x, V4.y, V4.z, R(-.2, .2), R(.1, .6), R(-.2, .2), s.big ? .6 : .4, Math.random() < .6 ? PURPLE : PINK); }
  }
}

/* ---------- 🙌 el kol hareketleri ---------- */
function pose(r, dt) {
  if (!r || (!CO.on && !CO.anim)) return; const k = 1 - Math.exp(-14 * dt), S = (o, ax, v) => { o.rotation[ax] += (v - o.rotation[ax]) * k; }, t = G.elapsed;
  if (CO.anim && CO.anim.type === 'in') { for (const [a, s] of [[r.armL, 1], [r.armR, -1]]) { S(a.sh, 'x', -1.25); S(a.sh, 'z', .3 * s); S(a.el, 'x', -1.1); } return; }
  if (CO.anim && CO.anim.type === 'out') { for (const [a, s] of [[r.armL, 1], [r.armR, -1]]) { S(a.sh, 'x', -.2); S(a.sh, 'z', 2.7 * s); S(a.el, 'x', -.2); } return; }
  if (CO.castT > 0) { const up = CO.castT > .55; for (const [a, s] of [[r.armL, 1], [r.armR, -1]]) { S(a.sh, 'x', up ? -3 : -1.4); S(a.sh, 'z', up ? .25 * s : .1 * s); S(a.el, 'x', up ? -.1 : -.2); } return; }
  if (CO.lasOn) { const ap = Math.max(-1, Math.min(1, G.pitch * .8 - .05)); for (const [a, s] of [[r.armL, 1], [r.armR, -1]]) { S(a.sh, 'x', -1.57 + ap); S(a.sh, 'z', .16 * s); S(a.el, 'x', -.05); } return; }
  const swg = SW.list.find(x => x.mode === 'swing' && x.t >= 0); if (swg) { const k = Math.min(1, swg.t / (swg.big ? .6 : .42)); S(r.armR.sh, 'x', -1.45); S(r.armR.sh, 'z', -1.3 + k * 2.4); S(r.armR.el, 'x', -.15); S(r.armL.sh, 'z', .5); return; }
  if (CO.rush > 0) { const w = t * 24; S(r.armL.sh, 'x', -1.5 + Math.sin(w) * .45); S(r.armR.sh, 'x', -1.5 - Math.sin(w) * .45); S(r.armL.el, 'x', -.4 - Math.max(0, Math.cos(w)) * .5); S(r.armR.el, 'x', -.4 - Math.max(0, -Math.cos(w)) * .5); S(r.armL.sh, 'z', .2); S(r.armR.sh, 'z', -.2); }
}

/* ---------- 🌐 çok oyunculu: arkadaşın kalkanı seni de korur ---------- */
function net(m) { if (m.t !== 'cosh') return; const P = G.player.position; CO.friendP = new T.Vector3(m.x, m.y + 1, m.z); CO.friendT = G.elapsed + .6; if (Math.hypot(P.x - m.x, P.y - m.y, P.z - m.z) < (m.r || 8)) CO.allyT = G.elapsed + .7; }
function blocks() { return (CO.on && G.shielding) || CO.allyT > G.elapsed; }

/* ---------- ⏱️ her kare (gökyüzü güncellemesinden sonra) ---------- */
function late(dt) {
  try { handOrbTick(dt); } catch (e) {}
  if (CO.on && (G.INV.eq !== 'cosmic' || G.dead)) deactivate(false);
  const t = G.elapsed;
  if (dt) { animTick(dt); rushTick(dt, t); laserTick(dt, t); strikesTick(dt, t); shadowsTick(dt, t); swordTick(dt, t); fxTick(dt, t); ringsTick(dt); partsTick(dt); }
  shieldTick(dt, t); skyTick(dt); ui();
}
function prompt() { if (G.INV.eq !== 'cosmic' || CO.on || CO.anim || G.giant) return null; return [(G.touchMode ? '👆 ' : 'V — ') + '🔮 ' + adT('Küreyi kullan'), activate]; }
function key(code) { if (!CO.on) return false; if (code === 'KeyK') { deactivate(true); return true; } if (code === 'KeyX') { strike(); return true; } if (code === 'KeyC') { shadowsKey(); return true; } if (code === 'KeyZ') { swordKey(); return true; }
  if (SW.list.length) { const m = /^(?:Digit|Numpad)([0-9])$/.exec(code); if (m) { const n = +m[1]; if (n) setCount(n); else swDismiss(); return true; } }   // 🗡️ 1-9 kaç kılıç · 0 kapat
  return false; }
function toggle() { if (CO.on) deactivate(true); else activate(); }

/* ---------- 🖥️ telefon: ☄️ düğmesi ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>#cosPad{position:fixed;right:12px;top:calc(30% + env(safe-area-inset-top));z-index:7;display:none;flex-direction:column;gap:8px;align-items:flex-end}
#cosPad button{border-radius:50%;border:2px solid rgba(220,180,255,.7);background:radial-gradient(circle,#7b2ff7,#2a0b5c);color:#fff;box-shadow:0 0 14px rgba(176,107,255,.6)}#cosStrike{width:62px;height:62px;font-size:28px}#cosShadow,#cosSword{width:46px;height:46px;font-size:20px}#cosPad button.cd{opacity:.45}#cosSwRow{display:flex;gap:6px;align-items:center;position:relative}#cosSwNum{display:none;position:absolute;right:calc(100% + 8px);top:50%;transform:translateY(-50%);grid-template-columns:repeat(3,34px);gap:5px;padding:6px;border-radius:14px;background:rgba(30,10,60,.75)}#cosSwNum.open{display:grid}#cosSwNum button{width:34px;height:34px;font-size:15px;font-weight:700;padding:0;border-radius:10px}#cosSwNum button.sel{background:radial-gradient(circle,#ff8af0,#7b2ff7)}#cosSwX,#cosSwM,#cosSwN{display:none;width:36px;height:36px;font-size:14px;font-weight:700;padding:0}#cosPad.sw #cosSwX,#cosPad.sw #cosSwM,#cosPad.sw #cosSwN{display:block}#cosPad button.on{background:radial-gradient(circle,#ff8af0,#7b2ff7)}</style>`);
document.body.insertAdjacentHTML('beforeend', `<div id="cosPad"><button id="cosStrike">☄️</button><button id="cosShadow">👥</button><div id="cosSwRow"><button id="cosSwX">✖</button><button id="cosSwM">⭐</button><button id="cosSwN">×</button><button id="cosSword">🗡️</button><div id="cosSwNum">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-n="${n}">${n}</button>`).join('')}</div></div></div>`);
for (const id of ['cosStrike', 'cosShadow', 'cosSword', 'cosSwX', 'cosSwM', 'cosSwN']) for (const ev of ['pointerdown', 'mousedown', 'touchstart']) $(id).addEventListener(ev, e => e.stopPropagation(), { passive: true });
$('cosStrike').addEventListener('click', e => { e.stopPropagation(); strike(); }); $('cosShadow').addEventListener('click', e => { e.stopPropagation(); shadowsKey(); });
$('cosSword').addEventListener('pointerdown', e => { e.stopPropagation(); swordKey(); });
$('cosSwX').addEventListener('click', e => { e.stopPropagation(); swDismiss(); }); $('cosSwM').addEventListener('click', e => { e.stopPropagation(); mergeKey(); }); $('cosSwN').addEventListener('click', e => { e.stopPropagation(); $('cosSwNum').classList.toggle('open'); });   // ×N: rakam paneli aç/kapat
for (const ev of ['pointerdown', 'mousedown', 'touchstart']) $('cosSwNum').addEventListener(ev, e => e.stopPropagation(), { passive: true });
$('cosSwNum').addEventListener('click', e => { e.stopPropagation(); const b = e.target.closest('[data-n]'); if (!b) return; setCount(+b.dataset.n); $('cosSwNum').classList.remove('open'); });
function ui() { const p = $('cosPad'); p.style.display = CO.on && G.touchMode && !G.paused ? 'flex' : 'none'; if (!CO.on) return; $('cosStrike').classList.toggle('cd', CO.cd > 0); $('cosShadow').classList.toggle('on', SH.list.some(s => !s.dead && !s.recall)); const sw = SW.list.length > 0; p.classList.toggle('sw', sw); $('cosSword').classList.toggle('on', sw); $('cosSwM').classList.toggle('on', SW.giant); const nt = '×' + SW.n; if ($('cosSwN').textContent !== nt) { $('cosSwN').textContent = nt; for (const b of $('cosSwNum').children) b.classList.toggle('sel', +b.dataset.n === SW.n); } if (!sw) $('cosSwNum').classList.remove('open'); }

window.__cos = { late, prompt, key, punch, strike, activate, deactivate, toggle, net, blocks, pose, on, CO, SH, SW, shadowsKey, swordKey, mergeKey, setCount, swDismiss, swOn: () => CO.on && SW.list.length > 0, camK };
})(window.__sftG);
