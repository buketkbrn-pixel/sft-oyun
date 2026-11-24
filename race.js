/* 🏎️ S.F.T · Yarış (race.js) — index.html bunu yükler; oyunun değişkenlerine window.__sftG (G) ile erişir.
   Maceracıdan, Işınla menüsünden ya da admin → 🏎️ Yarış bölümünden gidilir. Bütün arabalar aynı hızda: fark sürüşte, driftte, nitroda ve güçlerde.
   Çok oyunculu odada herkes aynı yarışta: botları oda sahibi yönetir, güçler herkesi etkiler. Güçler ve özel yetenekler bu oyuna özgü tasarımdır. */
(function (G) {
'use strict';
const T = G.THREE, $ = id => document.getElementById(id), adT = s => G.adT(s);
G.AREAS.race = { cx: 36000, cz: -36000, r: 1200, bg: 0x8fd3ff, fog: [320, 1500], sky: 0xbfe6ff, gnd: 0xe3cf9d, sunC: 0xfff4e0, sunI: 2.8, sunVis: 0xfff3d6 };
G.LOAD_NAMES.race = 'Yarış pisti';
const A = () => G.AREAS.race;
const W = 18, HW = W / 2, VMAX = 34, ACC = 15;
const RC = { built: '', g: new T.Group(), trk: null, state: 'off', racers: [], me: null, laps: 3, nBots: 5, t: 0, cd: 0, boxes: [], pads: [], ramps: [], fx: [], objs: [], pid: 0,
  hud: null, lobby: false, res: false, sendT: 0, botT: 0, adm: { infNitro: false }, keyQ: {}, prevKeys: {}, camYaw: null, glb: null, glbRot: 0, endT: 0 };
RC.g.name = 'raceRoot';
const SAVE = (() => { try { return JSON.parse(localStorage.getItem('sftYaris') || '{}'); } catch (e) { return {}; } })();
const save = () => { try { localStorage.setItem('sftYaris', JSON.stringify({ car: RC.car, col: RC.col, tr: RC.tr, laps: RC.laps, bots: RC.nBots, glbRot: RC.glbRot })); } catch (e) {} };
RC.car = SAVE.car || 'buggy'; RC.col = SAVE.col ?? 0xff5a36; RC.tr = SAVE.tr || 'beach'; RC.laps = SAVE.laps || 3; RC.nBots = SAVE.bots ?? 5; RC.glbRot = SAVE.glbRot || 0;
const mp = () => G.MP && G.MP.on && G.MP.started && Object.keys(G.MP.players).length > 1;
const myId = () => (G.MP && G.MP.on && G.MP.me.id) || 'me';
const isHost = () => !mp() || G.MP.host;
const r1 = v => Math.round(v * 10) / 10;

/* ---------- dokular ---------- */
const TEX = {};
function ctex(key, w, h, draw, rep) {
  if (TEX[key]) return TEX[key]; const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; if (rep) t.wrapS = t.wrapT = T.RepeatWrapping; return TEX[key] = t;
}
const roadTex = th => ctex('road' + th, 256, 256, (g, W2) => {
  g.fillStyle = th === 'beach' ? '#5b5f66' : '#4a4d52'; g.fillRect(0, 0, W2, W2);
  for (let i = 0; i < 3000; i++) { const l = Math.random() < .5 ? 0 : 255; g.fillStyle = `rgba(${l},${l},${l},.06)`; g.fillRect(Math.random() * W2, Math.random() * W2, 2, 2); }
  if (th === 'beach') for (let i = 0; i < 120; i++) { g.fillStyle = 'rgba(227,207,157,.35)'; g.beginPath(); g.arc(Math.random() * W2, Math.random() * W2, 2 + Math.random() * 6, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(6, 0, 6, W2); g.fillRect(W2 - 12, 0, 6, W2);
  g.fillStyle = '#ffd166'; g.fillRect(W2 / 2 - 3, 20, 6, 90); g.fillRect(W2 / 2 - 3, 148, 6, 90);
}, true);
const curbTex = () => ctex('curb', 64, 64, (g) => { for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#e63946'; g.fillRect(0, i * 16, 64, 16); } }, true);
const wallTex = () => ctex('wall', 128, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f1faee' : '#1d3557'; g.fillRect(i * 16, 0, 16, 64); } g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 54, 128, 10); }, true);
const checkTex = () => ctex('check', 128, 32, (g) => { for (let x = 0; x < 16; x++) for (let y = 0; y < 4; y++) { g.fillStyle = (x + y) % 2 ? '#111' : '#fff'; g.fillRect(x * 8, y * 8, 8, 8); } }, true);
const padTex = () => ctex('pad', 128, 160, (g) => { g.fillStyle = '#ff7b00'; g.fillRect(0, 0, 128, 160); g.strokeStyle = '#fff3b0'; g.lineWidth = 14; g.lineJoin = 'round';
  for (const y of [30, 80, 130]) { g.beginPath(); g.moveTo(18, y + 22); g.lineTo(64, y - 18); g.lineTo(110, y + 22); g.stroke(); } });
const boxTex = () => ctex('box', 128, 128, (g) => { const gr = g.createLinearGradient(0, 0, 128, 128); gr.addColorStop(0, '#8338ec'); gr.addColorStop(.5, '#3a86ff'); gr.addColorStop(1, '#06d6a0'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 8; g.strokeRect(6, 6, 116, 116); g.fillStyle = '#fff'; g.font = 'bold 80px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('✦', 64, 70); });
const crowdTex = () => ctex('crowd', 256, 128, (g) => { g.fillStyle = '#2b2d42'; g.fillRect(0, 0, 256, 128); const C = ['#e63946', '#ffd166', '#06d6a0', '#3a86ff', '#f1faee', '#ff70a6', '#8338ec'];
  for (let y = 6; y < 128; y += 12) for (let x = 4; x < 256; x += 9) { g.fillStyle = C[(Math.random() * C.length) | 0]; g.beginPath(); g.arc(x + Math.random() * 3, y, 3.4, 0, 7); g.fill(); } });
const glowTex = () => ctex('glow', 64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
const bannerTex = () => ctex('banner', 512, 96, (g) => { g.fillStyle = '#111'; g.fillRect(0, 0, 512, 96); for (let x = 0; x < 32; x++) for (let y = 0; y < 2; y++) { g.fillStyle = (x + y) % 2 ? '#111' : '#fff'; g.fillRect(x * 16, y * 16, 16, 16); g.fillRect(x * 16, 64 + y * 16, 16, 16); }
  g.fillStyle = '#ffd166'; g.font = '900 34px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('S.F.T  •  BAŞLA / BİTİŞ', 256, 48); });

/* ---------- 🗺️ pistler (özgün tasarım) ---------- */
const TRACKS = {
  beach: { n: '🏖️ Kumsal Turu', gnd: 0xe3cf9d, sea: true, pts: [[0, 0, 0], [120, -12, 0], [230, 14, 2], [300, 88, 5], [292, 182, 8], [222, 236, 6], [150, 206, 3], [108, 140, 2], [38, 150, 4], [-30, 214, 7], [-132, 224, 6], [-224, 162, 3], [-254, 62, 0], [-204, -28, 0], [-108, -50, 0]] },
  jungle: { n: '🌴 Orman Virajları', gnd: 0x5f8f45, sea: false, pts: [[0, 0, 0], [150, 0, 0], [222, 60, 3], [204, 142, 6], [122, 162, 4], [92, 232, 2], [162, 302, 5], [102, 364, 9], [-22, 344, 7], [-84, 262, 4], [-42, 182, 2], [-134, 142, 1], [-204, 60, 0], [-152, -22, 0]] },
};
function buildTrack(key) {
  if (RC.built === key) return; disposeTrack(); RC.built = key;
  const D = TRACKS[key], a = A(), g = new T.Group(); RC.trkG = g; RC.g.add(g);
  const V = D.pts.map(([x, z, y]) => new T.Vector3(a.cx + x, y, a.cz + z));
  const cur = new T.CatmullRomCurve3(V, true, 'centripetal', .5), L = cur.getLength(), N = Math.ceil(L / 2), P = cur.getSpacedPoints(N);
  const S = []; for (let i = 0; i < N; i++) { const p = P[i], q = P[(i + 1) % N], o = P[(i - 1 + N) % N]; const t = new T.Vector3(q.x - o.x, 0, q.z - o.z).normalize(); S.push({ p, t, n: new T.Vector3(-t.z, 0, t.x), s: i * L / N }); }
  for (let i = 0; i < N; i++) { const a0 = Math.atan2(S[i].t.x, S[i].t.z), a1 = Math.atan2(S[(i + 6) % N].t.x, S[(i + 6) % N].t.z); S[i].k = Math.abs(wrap(a1 - a0)); }
  RC.trk = { key, D, S, N, L, ds: L / N };
  // yol, kaldırım taşları, bariyer, set (yandaki dolgu)
  const strip = (off0, off1, y0, y1, mat, vScale, vert) => {
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) { const s = S[i % N], v = (i * L / N) / vScale;
      if (vert) { const x = s.p.x + s.n.x * off0, z = s.p.z + s.n.z * off0; pos.push(x, s.p.y + y0, z, x, s.p.y + y1 < -0.5 ? -0.6 : s.p.y + y1, z); }
      else pos.push(s.p.x + s.n.x * off0, s.p.y + y0, s.p.z + s.n.z * off0, s.p.x + s.n.x * off1, s.p.y + y1, s.p.z + s.n.z * off1);
      uv.push(0, v, 1, v); if (i) { const k = i * 2; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); } }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new T.Mesh(geo, mat); m.receiveShadow = true; g.add(m); return m;
  };
  const rt = roadTex(key); strip(HW, -HW, .06, .06, new T.MeshStandardMaterial({ map: rt, roughness: .9, side: T.DoubleSide }), 12);
  const ct = curbTex(); for (const sd of [1, -1]) strip(sd * HW, sd * (HW + 1.4), .07, .07, new T.MeshStandardMaterial({ map: ct, roughness: .8, side: T.DoubleSide }), 4);
  const wt = wallTex(); for (const sd of [1, -1]) strip(sd * (HW + 1.5), sd * (HW + 1.5), 0, 1.15, new T.MeshStandardMaterial({ map: wt, roughness: .7, side: T.DoubleSide }), 6, true);
  const emb = new T.MeshStandardMaterial({ color: key === 'beach' ? 0xc9b07a : 0x6b5a3a, roughness: 1, side: T.DoubleSide });
  for (const sd of [1, -1]) strip(sd * (HW + 1.5), sd * (HW + 1.5), .05, -20, emb, 6, true);
  // zemin ve deniz
  const gm = new T.Mesh(new T.CircleGeometry(900, 64).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ color: D.gnd, roughness: 1 })); gm.position.set(a.cx, -.5, a.cz); gm.receiveShadow = true; g.add(gm);
  if (D.sea) { const sea = new T.Mesh(new T.RingGeometry(470, 3000, 64).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ color: 0x1b8fd0, roughness: .15, metalness: .2, transparent: true, opacity: .92 })); sea.position.set(a.cx, -.3, a.cz); g.add(sea); RC.sea = sea; }
  // başlangıç / bitiş: dama çizgisi, kapı, tribün
  const s0 = S[0];
  { const f = new T.Mesh(new T.PlaneGeometry(W, 2.4).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ map: checkTex(), roughness: .8 })); f.position.set(s0.p.x, s0.p.y + .08, s0.p.z); f.rotation.y = Math.atan2(s0.t.x, s0.t.z); g.add(f);
    const arch = new T.Group(); arch.position.copy(s0.p); arch.rotation.y = Math.atan2(s0.t.x, s0.t.z); g.add(arch);
    const pm = G.M(0xe63946, { roughness: .5 }); for (const sd of [1, -1]) { const p = G.mesh(new T.BoxGeometry(1, 8, 1), pm, sd * (HW + 2.2), 4, 0); arch.add(p); }
    const b = new T.Mesh(new T.BoxGeometry(W + 5.4, 1.8, .4), [pm, pm, pm, pm, new T.MeshStandardMaterial({ map: bannerTex() }), new T.MeshStandardMaterial({ map: bannerTex() })]); b.position.y = 8; arch.add(b);
    const st = new T.Group(); st.position.copy(s0.p).addScaledVector(s0.n, HW + 14); st.position.y = 0; st.rotation.y = Math.atan2(s0.t.x, s0.t.z) - Math.PI / 2; g.add(st);
    for (let i = 0; i < 5; i++) { const s = G.mesh(new T.BoxGeometry(40, 1.2, 3), G.M(0x8d99ae), 0, .6 + i * 1.2, i * 2.4); st.add(s); const c = new T.Mesh(new T.PlaneGeometry(40, 1.2), new T.MeshStandardMaterial({ map: crowdTex(), roughness: 1 })); c.position.set(0, 1.5 + i * 1.2, i * 2.4 - 1.51); c.rotation.y = Math.PI; st.add(c); }
    const roof = G.mesh(new T.BoxGeometry(42, .4, 14), G.M(0xf1faee), 0, 9.5, 5); st.add(roof); }
  // palmiyeler / ağaçlar ve kayalar (tek çizimde çok kopya)
  const nT = key === 'jungle' ? 260 : 170, trunkG = new T.CylinderGeometry(.22, .34, 6.5, 6).translate(0, 3.25, 0), crownG = (key === 'jungle' ? new T.ConeGeometry(2.6, 5.5, 8).translate(0, 8, 0) : new T.ConeGeometry(3.3, 1.5, 7).rotateX(Math.PI).translate(0, 6.9, 0));
  const trunks = new T.InstancedMesh(trunkG, G.M(0x7a5a3a), nT), crowns = new T.InstancedMesh(crownG, G.M(key === 'jungle' ? 0x2f6f35 : 0x4f9a3a, { flatShading: true }), nT), m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), ps = new T.Vector3();
  for (let i = 0; i < nT; i++) { const s = S[(Math.random() * N) | 0], sd = Math.random() < .5 ? 1 : -1, off = HW + 6 + Math.random() * 40, k = .8 + Math.random() * .6;
    ps.set(s.p.x + s.n.x * off * sd, -.5, s.p.z + s.n.z * off * sd); if (nearTrack(ps.x, ps.z) < HW + 4) { ps.y = -999; }
    q.setFromAxisAngle(new T.Vector3(0, 1, 0), Math.random() * 6.28); sc.set(k, k, k); m4.compose(ps, q, sc); trunks.setMatrixAt(i, m4); crowns.setMatrixAt(i, m4); }
  trunks.castShadow = crowns.castShadow = true; g.add(trunks, crowns);
  const rocks = new T.InstancedMesh(new T.DodecahedronGeometry(1.2, 0), G.M(0x8a8f96, { flatShading: true }), 90);
  for (let i = 0; i < 90; i++) { const s = S[(Math.random() * N) | 0], sd = Math.random() < .5 ? 1 : -1, off = HW + 4 + Math.random() * 60, k = .5 + Math.random() * 1.6; ps.set(s.p.x + s.n.x * off * sd, -.3, s.p.z + s.n.z * off * sd); if (nearTrack(ps.x, ps.z) < HW + 3) ps.y = -999; q.setFromEuler(new T.Euler(Math.random(), Math.random() * 6, 0)); sc.set(k, k * .7, k); m4.compose(ps, q, sc); rocks.setMatrixAt(i, m4); }
  g.add(rocks);
  // ✦ güç kutuları, ⚡ hız pedleri ve rampa: düzlüklere ve eşit aralıklarla
  RC.boxes = []; RC.pads = []; RC.ramps = [];
  const bm = new T.MeshStandardMaterial({ map: boxTex(), emissive: 0x6a4cff, emissiveIntensity: .35, transparent: true, opacity: .88 }), bg = new T.BoxGeometry(1.5, 1.5, 1.5);
  for (const f of [.1, .3, .5, .7, .88]) { const i0 = Math.round(f * N) % N, s = S[i0];
    for (let j = 0; j < 4; j++) { const lat = -6 + j * 4, m = new T.Mesh(bg, bm); m.position.set(s.p.x + s.n.x * lat, s.p.y + 1.1, s.p.z + s.n.z * lat); m.castShadow = true; g.add(m); RC.boxes.push({ m, x: m.position.x, z: m.position.z, y: m.position.y, t: 0, ph: Math.random() * 6 }); } }
  const straights = []; for (let i = 0; i < N; i += 3) if (S[i].k < .05 && S[(i + 10) % N].k < .05) straights.push(i);
  const pm2 = new T.MeshStandardMaterial({ map: padTex(), emissive: 0xff7b00, emissiveIntensity: .7, roughness: .5 });
  for (let k = 0; k < 6 && straights.length; k++) { const i0 = straights[Math.floor((k + .5) / 6 * straights.length)], s = S[i0], lat = (k % 3 - 1) * 5;
    const m = new T.Mesh(new T.PlaneGeometry(4.2, 6).rotateX(-Math.PI / 2), pm2); m.position.set(s.p.x + s.n.x * lat, s.p.y + .09, s.p.z + s.n.z * lat); m.rotation.y = Math.atan2(s.t.x, s.t.z); g.add(m); RC.pads.push({ x: m.position.x, z: m.position.z, i: i0 }); }
  if (straights.length) { const i0 = straights[Math.floor(straights.length * .62)], s = S[i0];
    const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(7, 0); sh.lineTo(7, 1.6); sh.lineTo(0, 0);
    const rg = new T.ExtrudeGeometry(sh, { depth: 10, bevelEnabled: false }).translate(-3.5, 0, -5); rg.rotateY(-Math.PI / 2);
    const rm = new T.Mesh(rg, new T.MeshStandardMaterial({ color: 0xffd166, roughness: .6 })); rm.position.set(s.p.x, s.p.y + .05, s.p.z); rm.rotation.y = Math.atan2(s.t.x, s.t.z); rm.castShadow = true; g.add(rm);
    RC.ramps.push({ i: i0, len: 7 / RC.trk.ds | 0 }); }
}
function disposeTrack() { if (RC.trkG) { RC.g.remove(RC.trkG); RC.trkG.traverse(o => { if (o.geometry) o.geometry.dispose(); }); RC.trkG = null; } RC.built = ''; RC.trk = null; }
const wrap = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
function nearTrack(x, z) { const K = RC.trk; if (!K) return 1e9; let bd = 1e9; for (let i = 0; i < K.N; i += 2) { const p = K.S[i].p, d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) bd = d; } return Math.sqrt(bd); }
function findIdx(x, z, hint) {   // en yakın pist noktası (ipucunun çevresinde ara)
  const K = RC.trk, N = K.N; let bi = 0, bd = 1e18;
  if (hint == null) { for (let i = 0; i < N; i++) { const p = K.S[i].p, d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; bi = i; } } return bi; }
  for (let k = -30; k <= 30; k++) { const i = (hint + k + N) % N, p = K.S[i].p, d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; bi = i; } }
  return bi;
}
function trackAt(x, z, hint) {   // → {i, lat, s, y}
  const K = RC.trk, i = findIdx(x, z, hint), S = K.S[i], dx = x - S.p.x, dz = z - S.p.z, along = dx * S.t.x + dz * S.t.z, lat = dx * S.n.x + dz * S.n.z;
  const j = along >= 0 ? (i + 1) % K.N : (i - 1 + K.N) % K.N, f = Math.min(1, Math.abs(along) / K.ds), y = S.p.y + (K.S[j].p.y - S.p.y) * f;
  let s = S.s + along; if (s < 0) s += K.L; if (s >= K.L) s -= K.L; return { i, lat, s, y };
}

/* ---------- 🚗 arabalar (hepsi aynı hızda) ---------- */
const CARS = [
  ['buggy', '🏝️', 'Kumsal buggy', '🦘 Süper zıplama', 'Havalanır, engellerin üstünden aşar ve hızlanır'],
  ['kart', '🏁', 'Yarış kartı', '🌀 Kasırga dönüşü', 'Kendi etrafında döner, yakındakileri savurur'],
  ['sport', '🏎️', 'Spor araba', '☄️ Işık hızı', 'Birkaç saniye ışık gibi uçar, kimse durduramaz'],
  ['moto', '🏍️', 'Motosiklet', '🔥 Tek teker', 'Arka teker üstünde roket gibi gider, yağa kaymaz'],
  ['truck', '🛻', 'Canavar kamyon', '💥 Deprem', 'Yere vurur, yakındaki herkes havaya uçar'],
  ['turtle', '🐢', 'Roketli kaplumbağa', '🛡️ Kabuk zırhı', 'Dokunulmaz olur, çarptıklarını savurur'],
  ['uni', '🦄', 'Gökkuşağı tek boynuzlu at', '🌈 Gökkuşağı yolu', 'Hızlanır, arkasında kaydıran bir gökkuşağı bırakır'],
  ['custom', '📦', 'Kendi modelim (GLB)', '☄️ Işık hızı', 'Yüklediğin 3D model; hız herkesle aynı'],
];
const CAR = Object.fromEntries(CARS.map(c => [c[0], c]));
const PAL = [0xff5a36, 0xffd166, 0x06d6a0, 0x3a86ff, 0x8338ec, 0xff70a6, 0xf1faee, 0x222831];
function wheel(g, x, z, r, w) { const m = G.mesh(new T.CylinderGeometry(r, r, w, 14).rotateZ(Math.PI / 2), G.M(0x1b1b1b, { roughness: .8 }), x, r, z); g.add(m); const h = G.mesh(new T.CylinderGeometry(r * .5, r * .5, w + .02, 10).rotateZ(Math.PI / 2), G.M(0xd8dde3, { metalness: .8, roughness: .3 }), x, r, z); g.add(h); return m; }
function driver(g, col, y, z) { try { const r = G.createStickman(col); r.stick.scale.setScalar(.72); r.stick.position.set(0, y, z); r.legL.hip.rotation.x = r.legR.hip.rotation.x = -1.45; r.legL.kn.rotation.x = r.legR.kn.rotation.x = .2; r.armL.sh.rotation.x = r.armR.sh.rotation.x = -1.1; r.armL.el.rotation.x = r.armR.el.rotation.x = -.4; g.add(r.stick); return r; } catch (e) { return null; } }
function carModel(kind, col, dcol) {
  const g = new T.Group(), paint = new T.MeshStandardMaterial({ color: col, metalness: .45, roughness: .32 }), dark = G.M(0x22252b, { roughness: .6 });
  if (kind === 'buggy') {
    g.add(G.mesh(new T.BoxGeometry(1.7, .35, 3.1), paint, 0, .62, 0)); g.add(G.mesh(new T.BoxGeometry(1.5, .3, 1.1), paint, 0, .85, 1.1));
    const bar = G.M(0x333333, { metalness: .6, roughness: .4 }); for (const x of [-.7, .7]) { for (const z of [-.6, .4]) g.add(G.mesh(new T.CylinderGeometry(.05, .05, 1.2, 6), bar, x, 1.35, z)); g.add(G.mesh(new T.CylinderGeometry(.05, .05, 1.05, 6).rotateX(Math.PI / 2), bar, x, 1.95, -.1)); }
    g.add(G.mesh(new T.CylinderGeometry(.05, .05, 1.45, 6).rotateZ(Math.PI / 2), bar, 0, 1.95, -.6)); g.add(G.mesh(new T.CylinderGeometry(.05, .05, 1.45, 6).rotateZ(Math.PI / 2), bar, 0, 1.95, .4));
    g.add(G.mesh(new T.BoxGeometry(1.8, .08, .5), paint, 0, 1.25, -1.6)); for (const x of [-.6, .6]) g.add(G.mesh(new T.BoxGeometry(.06, .45, .06), dark, x, 1.02, -1.55));
    for (const x of [-.5, .5]) g.add(G.mesh(new T.SphereGeometry(.13, 10, 8), G.M(0xfff3b0, { emissive: 0xfff3b0, emissiveIntensity: .8 }), x, .8, 1.66));
    for (const [x, z] of [[-.95, 1.05], [.95, 1.05], [-.98, -1.05], [.98, -1.05]]) wheel(g, x, z, .5, .45);
    driver(g, dcol, .72, -.15);
  } else if (kind === 'kart') {
    g.add(G.mesh(new T.BoxGeometry(1.3, .18, 2.6), paint, 0, .3, 0)); g.add(G.mesh(new T.BoxGeometry(1.5, .22, .3), dark, 0, .35, 1.35)); g.add(G.mesh(new T.BoxGeometry(1.5, .22, .3), dark, 0, .35, -1.35));
    g.add(G.mesh(new T.BoxGeometry(.9, .5, .25), paint, 0, .62, -1.05)); g.add(G.mesh(new T.TorusGeometry(.18, .03, 6, 14), dark, 0, .75, .35).rotateX(-1));
    g.add(G.mesh(new T.BoxGeometry(1.4, .06, .4), paint, 0, 1, -1.35)); for (const [x, z, r] of [[-.75, .95, .26], [.75, .95, .26], [-.8, -.95, .3], [.8, -.95, .3]]) wheel(g, x, z, r, .32);
    driver(g, dcol, .32, -.35);
  } else if (kind === 'sport') {
    let m = null; try { m = G.buildCar(col); } catch (e) {}
    if (m && m.g) { const fr = m.fronts && m.fronts[0]; if (fr && fr.position && fr.position.z < 0) m.g.rotation.y = Math.PI; g.add(m.g); }
  } else if (kind === 'custom' && RC.glb) {
    const c = RC.glb.clone(true); c.rotation.y = RC.glbRot * Math.PI / 2; g.add(c);
  } else if (G.NV_DEF[kind] && G.NV_DEF[kind].build) {
    try { const m = G.NV_DEF[kind].build(paint); g.add(m.g); } catch (e) { console.warn('araba', e); }
  }
  if (!g.children.length) return carModel('buggy', col, dcol);
  const tgt = { buggy: 3.3, kart: 2.9, sport: 4.1, moto: 2.5, truck: 4.2, turtle: 3.2, uni: 2.8, custom: 3.6 }[kind] || 3.4;
  const bb = new T.Box3().setFromObject(g), sz = bb.getSize(new T.Vector3()), k = tgt / Math.max(.01, Math.max(sz.x, sz.z));
  if (kind !== 'buggy' && kind !== 'kart') { const w = new T.Group(); w.add(g); g.position.y = -bb.min.y; w.scale.setScalar(k); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return w; }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
}
// 📦 kendi modelin: tarayıcıda saklanır (IndexedDB)
const glbDB = () => new Promise((res, rej) => { const r = indexedDB.open('sftYaris', 1); r.onupgradeneeded = () => r.result.createObjectStore('m'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function glbLoad(buf, store) {
  return new Promise((res, rej) => { try { new G.GLTFLoader().parse(buf, '', gl => { const s = gl.scene; s.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } }); const bb = new T.Box3().setFromObject(s), c = bb.getCenter(new T.Vector3()); s.position.set(-c.x, -bb.min.y, -c.z); const w = new T.Group(); w.add(s); RC.glb = w;
    if (store) glbDB().then(db => { const tx = db.transaction('m', 'readwrite'); tx.objectStore('m').put(buf, 'car'); }).catch(() => {}); res(w); }, e => rej(e)); } catch (e) { rej(e); } });
}
glbDB().then(db => { const r = db.transaction('m').objectStore('m').get('car'); r.onsuccess = () => { if (r.result) glbLoad(r.result, false).catch(() => {}); }; }).catch(() => {});

/* ---------- 🎁 güçler (bu oyuna özgü) ---------- */
const ITEMS = {
  fire: ['🔥', 'Alev topu'], missile: ['🎯', 'Takip füzesi'], oil: ['🛢️', 'Kaygan yağ'], mine: ['💣', 'Sahte kutu'], shield: ['🛡️', 'Kalkan'],
  turbo: ['💨', 'Süper turbo'], zap: ['⚡', 'Yıldırım'], tornado: ['🌪️', 'Hortum'], magnet: ['🧲', 'Mıknatıs'],
};
function rollItem(place, n) {   // önde olan savunma, geride olan güçlü saldırı alır
  const f = n > 1 ? (place - 1) / (n - 1) : .5;
  const w = { fire: 3, oil: 3 - f * 2, mine: 2.5 - f * 1.5, shield: 2.5 - f, turbo: 1 + f * 3, missile: .6 + f * 3, zap: f * 2.2, tornado: .3 + f * 2, magnet: .3 + f * 2.5 };
  let s = 0; for (const k in w) s += Math.max(0, w[k]); let r = Math.random() * s; for (const k in w) { r -= Math.max(0, w[k]); if (r <= 0) return k; } return 'fire';
}

/* ---------- 🏁 yarışçılar ---------- */
const BOT_NAMES = ['Rüzgâr', 'Turbo Tosun', 'Kum Fırtınası', 'Hızlı Hüsnü', 'Dalga', 'Mercan', 'Pırpır', 'Yengeç Yaşar', 'Şimşek Şule', 'Martı'];
function mkRacer(o) {
  const R = Object.assign({ x: 0, y: 0, z: 0, h: 0, vx: 0, vz: 0, sp: 0, vy: 0, air: false, idx: 0, s: 0, lap: 0, prog: 0, cp: false, fin: false, finT: 0, place: 1, item: null, roll: 0,
    nitro: 0, spc: 0, drift: null, boostT: 0, nitroOn: false, spinT: 0, shieldT: 0, shrinkT: 0, ghostT: 0, specT: 0, specK: '', magT: 0, wrongT: 0, stuckT: 0, lastHit: 0, net: null, sparks: 0 }, o);
  R.root = new T.Group(); R.body = new T.Group(); R.root.add(R.body); R.model = carModel(R.car, R.col, R.dcol || 0x222222); R.body.add(R.model);
  const fl = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: 0x66ccff, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); fl.scale.set(1.6, 1.6, 1); fl.position.set(0, .7, -2.1); R.body.add(fl); R.flame = fl;
  const sh = new T.Mesh(new T.SphereGeometry(2.4, 18, 12), new T.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: .25, depthWrite: false })); sh.position.y = 1; sh.visible = false; R.root.add(sh); R.shieldM = sh;
  R.label = mkLabel(R.name, R.isMe ? '#ffd166' : R.remote ? '#9fd0ff' : '#ffffff'); R.label.position.y = 3.2; R.root.add(R.label); R.label.visible = !R.isMe;
  RC.g.add(R.root); return R;
}
function mkLabel(t, col) { const c = document.createElement('canvas'); c.width = 256; c.height = 56; const g = c.getContext('2d'); g.font = 'bold 30px system-ui'; const w = Math.min(250, g.measureText(t).width + 26); g.fillStyle = 'rgba(10,20,35,.7)'; g.beginPath(); g.roundRect((256 - w) / 2, 6, w, 44, 14); g.fill(); g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 128, 29);
  const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; const s = new T.Sprite(new T.SpriteMaterial({ map: tx, transparent: true, depthWrite: false })); s.scale.set(3.2, .7, 1); return s; }
function clearRacers() { for (const R of RC.racers) RC.g.remove(R.root); RC.racers = []; RC.me = null; for (const f of RC.fx) if (f.m) RC.g.remove(f.m); RC.fx = []; }
function gridPos(k) { const K = RC.trk, back = 6 + (k >> 1) * 7, i = (K.N - Math.round(back / K.ds)) % K.N, S = K.S[i], lat = (k % 2 ? -1 : 1) * 4.2; return { x: S.p.x + S.n.x * lat, z: S.p.z + S.n.z * lat, y: S.p.y, h: Math.atan2(S.t.x, S.t.z), i }; }
function placeOnGrid(R, k) { const p = gridPos(k); Object.assign(R, { x: p.x, z: p.z, y: p.y, h: p.h, idx: p.i, vx: 0, vz: 0, sp: 0, vy: 0, air: false, lap: 0, s: 0, prog: 0, cp: false, fin: false, finT: 0, item: null, nitro: 0, spc: 0, drift: null, boostT: 0, spinT: 0, shieldT: 0, shrinkT: 0, ghostT: 0, specT: 0, magT: 0 }); R.s = trackAt(R.x, R.z, R.idx).s; R.prog = R.s - RC.trk.L; }

/* ---------- 🏁 yarışı başlat / bitir ---------- */
function startRace(cfg) {   // cfg: {tr, laps, bots, grid:[{id,name,car,col}], seed}
  buildTrack(cfg.tr); clearRacers(); RC.laps = cfg.laps; RC.t = 0; RC.cd = 3.6; RC.state = 'count'; RC.endT = 0; RC.res = false; RC.goBoost = 0; hideLobby(); hideRes(); hudShow(true);
  for (const b of RC.boxes) { b.t = 0; b.m.visible = true; }
  const mine = myId(); let k = 0;
  for (const p of cfg.grid) { const R = mkRacer({ id: p.id, name: p.name, car: p.car, col: p.col, dcol: p.dcol, isMe: p.id === mine, remote: p.id !== mine && !p.bot, bot: !!p.bot, skill: p.skill || 1, lane: (Math.random() - .5) * 8 }); placeOnGrid(R, k++); RC.racers.push(R); if (R.isMe) RC.me = R; }
  RC.cfg = cfg; G.RACE_LOCK = true; lockPlayer(true);
  G.play('ui'); beep(440);
}
function lockPlayer(on) {
  try { G.charHolder.visible = !on; } catch (e) {}
  if (on) { RC.prevDist = RC.prevDist ?? G.dist; RC.prevPitch = RC.prevPitch ?? G.pitch; }
  else { if (RC.prevDist != null) { G.dist = RC.prevDist; G.pitch = RC.prevPitch; } RC.prevDist = RC.prevPitch = null; G.RACE_LOCK = false; }
}
function endRace(toLobby) {
  RC.state = 'off'; clearRacers(); lockPlayer(false); hudShow(false); hideRes(); if (toLobby) showLobby();
}
function soloStart() {
  const grid = [{ id: myId(), name: (G.MP && G.MP.me && G.MP.me.name) || adT('Sen'), car: RC.car, col: RC.col, dcol: G.playerRig ? G.playerRig.bodyMat.color.getHex() : 0x222222 }];
  const nb = RC.nBots; for (let i = 0; i < nb; i++) grid.push({ id: 'b' + i, bot: true, name: BOT_NAMES[i % BOT_NAMES.length], car: CARS[(Math.random() * 7) | 0][0], col: PAL[(Math.random() * PAL.length) | 0], dcol: new T.Color().setHSL(Math.random(), .6, .5).getHex(), skill: .86 + Math.random() * .14 });
  for (let i = grid.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [grid[i], grid[j]] = [grid[j], grid[i]]; }   // başlangıç sırası karışık
  return { tr: RC.tr, laps: RC.laps, bots: nb, grid };
}
function requestStart() {
  if (!mp()) { startRace(soloStart()); return; }
  if (!G.MP.host && !G.ADM_UNLOCK) { G.showMsg(adT('🏁 Yarışı oda sahibi başlatır'), 1.8); return; }
  const grid = []; for (const id in G.MP.players) { const p = G.MP.players[id], c = RC.mpCars[id] || {}; grid.push({ id, name: p.name || '?', car: id === myId() ? RC.car : c.car || 'buggy', col: id === myId() ? RC.col : c.col ?? PAL[grid.length % PAL.length], dcol: c.dcol ?? 0x333333 }); }
  const nb = RC.nBots; for (let i = 0; i < nb; i++) grid.push({ id: 'b' + i, bot: true, name: BOT_NAMES[i % BOT_NAMES.length], car: CARS[(Math.random() * 7) | 0][0], col: PAL[(Math.random() * PAL.length) | 0], dcol: new T.Color().setHSL(Math.random(), .6, .5).getHex(), skill: .86 + Math.random() * .14 });
  for (let i = grid.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [grid[i], grid[j]] = [grid[j], grid[i]]; }
  const cfg = { tr: RC.tr, laps: RC.laps, bots: nb, grid, host: myId() };
  G.mpSend({ t: 'rgo', cfg }); startRace(cfg);
}
RC.mpCars = {};

/* ---------- 🎮 girdiler ---------- */
const K = () => G.keys || {};
function input() {
  const k = K(), j = G.joy, t = RC.touch;
  const I = { thr: (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0), st: (k.KeyA || k.ArrowLeft ? 1 : 0) - (k.KeyD || k.ArrowRight ? 1 : 0),
    drift: !!(k.Space || k.ShiftLeft || k.ShiftRight || t.drift), nitro: !!(k.KeyE || k.KeyN || t.nitro), item: !!(k.KeyF || k.Enter || RC.mouseItem || t.item), spec: !!(k.KeyR || k.KeyQ || t.spec) };
  if (j && j.id !== null && j.id !== undefined) { I.st = Math.max(-1, Math.min(1, I.st - j.x * 1.3)); if (-j.y > .3) I.thr = 1; else if (j.y > .5) I.thr = -1; }
  if (G.touchMode && !I.thr && !t.brake) I.thr = 1; if (t.brake) I.thr = -1;   // telefonda gaz kendiliğinden
  RC.mouseItem = false; return I;
}
RC.touch = { drift: false, nitro: false, item: false, spec: false, brake: false };
const edge = (I, k) => { const was = RC.prevKeys[k]; RC.prevKeys[k] = I[k]; return I[k] && !was; };

/* ---------- 🚗 fizik ---------- */
function physics(R, I, dt) {
  const K2 = RC.trk;
  if (R.spinT > 0) { R.spinT -= dt; I = { thr: 0, st: 0, drift: false }; }
  const boost = R.boostT > 0, nit = R.nitroOn, mag = R.magT > 0;
  let max = VMAX * (boost ? 1.38 : 1) * (nit ? 1.28 : 1) * (mag ? 1.2 : 1) * (R.shrinkT > 0 ? .62 : 1) * (R.spinT > 0 ? .35 : 1) * (R.specK === 'light' && R.specT > 0 ? 1.55 : 1) * (R.specK === 'wheelie' && R.specT > 0 ? 1.35 : 1);
  if (I.thr > 0) R.sp += ACC * (boost || nit ? 1.6 : 1) * I.thr * dt; else if (I.thr < 0) R.sp -= (R.sp > 0 ? 32 : 9) * -I.thr * dt; else R.sp -= Math.sign(R.sp) * Math.min(Math.abs(R.sp), 6 * dt);
  if (R.sp > max) R.sp = Math.max(max, R.sp - 22 * dt); R.sp = Math.max(-10, R.sp);
  // drift
  const D = R.drift;
  if (!D && I.drift && Math.abs(I.st) > .25 && R.sp > 13 && !R.air) { R.drift = { dir: Math.sign(I.st), t: 0, c: 0 }; if (R.isMe) G.play('ui', { gain: .25 }); R.vy = 2.2; R.air = true; }
  let turn = 0; const sf = Math.min(1, Math.abs(R.sp) / 9) * Math.sign(R.sp || 1);
  if (R.drift) {
    const Dd = R.drift; Dd.t += dt; Dd.c += dt * (.7 + Math.abs(I.st + Dd.dir) * .6); turn = (Dd.dir * 1.05 + I.st * .65) * 1.55 * sf;
    if (!I.drift || R.sp < 8) { const lv = Dd.c > 2.6 ? 3 : Dd.c > 1.6 ? 2 : Dd.c > .8 ? 1 : 0; if (lv) { R.boostT = Math.max(R.boostT, [0, .55, .95, 1.45][lv]); R.nitro = Math.min(100, R.nitro + [0, 8, 14, 22][lv]); if (R.isMe) { G.play('boost', { gain: .5 }); G.shake = Math.max(G.shake, .12); } } R.drift = null; }
  } else turn = I.st * 1.7 * sf / (1 + Math.abs(R.sp) * .012);
  if (R.air) turn *= .4;
  R.h += turn * dt;
  const fx = Math.sin(R.h), fz = Math.cos(R.h), grip = R.drift ? 2.6 : R.air ? .4 : 9;
  R.vx += (fx * R.sp - R.vx) * Math.min(1, grip * dt); R.vz += (fz * R.sp - R.vz) * Math.min(1, grip * dt);
  R.x += R.vx * dt; R.z += R.vz * dt;
  // pist sınırı (bariyer)
  const tk = trackAt(R.x, R.z, R.idx); R.idx = tk.i; const S = K2.S[tk.i], lim = HW + .6;
  if (Math.abs(tk.lat) > lim) { const sd = Math.sign(tk.lat), ov = Math.abs(tk.lat) - lim; R.x -= S.n.x * sd * ov; R.z -= S.n.z * sd * ov; const vn = R.vx * S.n.x + R.vz * S.n.z;
    if (vn * sd > 0) { R.vx -= S.n.x * vn * 1.3; R.vz -= S.n.z * vn * 1.3; const hit = Math.abs(vn); R.sp *= hit > 8 ? .55 : .85; if (R.isMe && hit > 6) { G.play('hit', { gain: .4 }); G.shake = Math.max(G.shake, Math.min(.4, hit * .02)); } } }
  // yükseklik, rampa
  for (const r of RC.ramps) { const d = (tk.i - r.i + K2.N) % K2.N; if (!R.air && d >= 0 && d < r.len && Math.abs(tk.lat) < 5) { R.y = tk.y + 1.6 * d / r.len; if (d >= r.len - 1 && R.sp > 15) { R.vy = R.sp * .3; R.air = true; if (R.isMe) G.play('boing', { gain: .4 }); } } }
  if (R.air) { R.vy -= 26 * dt; R.y += R.vy * dt; if (R.y <= tk.y) { R.y = tk.y; R.air = false; if (R.vy < -8 && R.isMe) { G.play('land', { k: .5 }); G.shake = Math.max(G.shake, .15); } R.vy = 0; } }
  else if (!RC.ramps.some(r => { const d = (tk.i - r.i + K2.N) % K2.N; return d >= 0 && d < r.len && Math.abs(tk.lat) < 5; })) R.y = tk.y;
  // ilerleme ve tur
  const ps = R.s; R.s = tk.s; const L = K2.L;
  if (ps > L * .75 && R.s < L * .25) { if (R.cp) { R.lap++; R.cp = false; onLap(R); } else R.lapBack = (R.lapBack || 0); }
  else if (ps < L * .25 && R.s > L * .75 && R.lap > 0) { R.lap--; R.cp = true; }
  if (R.s > L * .45 && R.s < L * .6) R.cp = true;
  R.prog = R.lap * L + R.s - (R.cp || R.s < L * .5 ? 0 : 0);
  // ters yön, sıkışma
  const fwd = S.t.x * fx + S.t.z * fz; R.wrongT = fwd < -.3 && R.sp > 4 ? R.wrongT + dt : 0;
  R.stuckT = I.thr > 0 && Math.abs(R.sp) < 2 && RC.state === 'race' ? R.stuckT + dt : 0;
  if (R.stuckT > 4 || R.wrongT > 6 && R.bot) resetToTrack(R);
  // hız pedleri, güç kutuları
  for (const p of RC.pads) if ((p.x - R.x) ** 2 + (p.z - R.z) ** 2 < 9 && !R.air) { if (R.boostT < .6) { R.boostT = 1.3; R.nitro = Math.min(100, R.nitro + 6); if (R.isMe) G.play('boost', { gain: .5 }); } }
  if (!R.remote && !(R.bot && !isHost())) for (const b of RC.boxes) if (b.m.visible && (b.x - R.x) ** 2 + (b.z - R.z) ** 2 < 5.5 && Math.abs(b.y - R.y - 1) < 2.2) { b.m.visible = false; b.t = 2.6; if (mp()) G.mpSend({ t: 'rfx', k: 'box', x: r1(b.x), z: r1(b.z) }); gotBox(R); }
  R.boostT = Math.max(0, R.boostT - dt); R.shieldT = Math.max(0, R.shieldT - dt); R.shrinkT = Math.max(0, R.shrinkT - dt); R.ghostT = Math.max(0, R.ghostT - dt); R.magT = Math.max(0, R.magT - dt); R.specT = Math.max(0, R.specT - dt);
  R.spc = Math.min(100, R.spc + dt * (100 / 28));
}
function resetToTrack(R) { const S = RC.trk.S[R.idx]; R.x = S.p.x; R.z = S.p.z; R.y = S.p.y; R.h = Math.atan2(S.t.x, S.t.z); R.sp = 0; R.vx = R.vz = 0; R.stuckT = 0; R.wrongT = 0; R.air = false; R.drift = null; if (R.isMe) G.showMsg('↩️ ' + adT('Piste geri konuldun'), 1); }
function onLap(R) {
  if (R.lap >= RC.laps && !R.fin) { R.fin = true; R.finT = RC.t; if (R.isMe) { const pl = placeOf(R); G.play(pl === 1 ? 'goal' : 'ding', { gain: .7 }); big(pl === 1 ? '🏆 ' + adT('BİRİNCİ!') : `🏁 ${pl}. ${adT('oldun!')}`, 3); RC.endT = RC.t; if (mp()) G.mpSend({ t: 'rfx', k: 'fin', ft: r1(R.finT) }); try { G.progAdd(Math.max(1, 12 - pl * 2), null); } catch (e) {} } return; }
  if (R.isMe && R.lap > 0) { big(R.lap === RC.laps - 1 ? '🔔 ' + adT('SON TUR!') : `🏁 ${adT('Tur')} ${R.lap + 1}/${RC.laps}`, 1.6); G.play('ding', { gain: .5 }); }
}
function placeOf(R) { return R.place || 1; }
function updatePlaces() {
  const L = RC.racers.slice().sort((a, b) => (b.fin - a.fin) || (a.fin && b.fin ? a.finT - b.finT : b.prog - a.prog)); L.forEach((R, i) => R.place = i + 1); return L;
}
function gotBox(R) {
  R.spc = Math.min(100, R.spc + 8);
  if (R.item) return; R.roll = R.isMe ? 1.1 : .2; R.item = '…'; R.rollItem = rollItem(R.place, RC.racers.length); if (R.isMe) G.play('coin', { gain: .4 });
}

/* ---------- 🎯 güç kullanma ve etkileri ---------- */
function useItem(R) {
  if (!R.item || R.roll > 0 || R.item === '…') return; const it = R.item; R.item = null;
  const fx = Math.sin(R.h), fz = Math.cos(R.h), pid = myId() + ':' + (++RC.pid);
  const spawn = (k, o) => { const f = Object.assign({ k, pid, own: R.id, t: 0 }, o); addFx(f); if (mp()) G.mpSend({ t: 'rfx', k: 'add', f: netFx(f) }); return f; };
  if (it === 'fire') spawn('fire', { x: R.x + fx * 3, z: R.z + fz * 3, y: R.y + .8, vx: fx * 62, vz: fz * 62, b: 3, life: 4 });
  else if (it === 'missile') { const tg = RC.racers.find(o => o.place === R.place - 1); spawn('missile', { x: R.x + fx * 3, z: R.z + fz * 3, y: R.y + 1.2, vx: fx * 50, vz: fz * 50, tg: tg ? tg.id : null, life: 7 }); }
  else if (it === 'oil') spawn('oil', { x: R.x - fx * 4, z: R.z - fz * 4, y: R.y, life: 30 });
  else if (it === 'mine') spawn('mine', { x: R.x - fx * 4, z: R.z - fz * 4, y: R.y, life: 40 });
  else if (it === 'tornado') spawn('tornado', { s: R.s + 6, lat: 0, y: 0, life: 6, lap: R.lap });
  else if (it === 'shield') R.shieldT = 7;
  else if (it === 'turbo') { R.boostT = Math.max(R.boostT, 2.3); R.nitro = Math.min(100, R.nitro + 20); }
  else if (it === 'magnet') R.magT = 3.2;
  else if (it === 'zap') { area({ k: 'zap', own: R.id, prog: R.prog }); if (mp()) G.mpSend({ t: 'rfx', k: 'area', a: { k: 'zap', own: R.id, prog: R.prog } }); }
  if (R.isMe) G.play(it === 'zap' ? 'zap' : it === 'turbo' || it === 'magnet' ? 'boost' : it === 'shield' ? 'shield' : 'throw', { gain: .5 });
}
function useSpecial(R) {
  if (R.spc < 100) return; R.spc = 0; const c = R.car;
  if (c === 'buggy') { R.vy = 11; R.air = true; R.boostT = Math.max(R.boostT, 1.6); R.specK = 'hop'; R.specT = 1.6; R.ghostT = 1.4; }
  else if (c === 'kart') { R.specK = 'spin'; R.specT = 2.6; R.ghostT = 2.6; }
  else if (c === 'sport' || c === 'custom') { R.specK = 'light'; R.specT = 3; R.ghostT = 3; R.boostT = Math.max(R.boostT, 3); }
  else if (c === 'moto') { R.specK = 'wheelie'; R.specT = 2.8; R.boostT = Math.max(R.boostT, 2.8); }
  else if (c === 'truck') { R.specK = 'quake'; R.specT = .8; const a = { k: 'quake', own: R.id, x: R.x, z: R.z, r: 15 }; area(a); if (mp()) G.mpSend({ t: 'rfx', k: 'area', a: { ...a, x: r1(R.x), z: r1(R.z) } }); }
  else if (c === 'turtle') { R.specK = 'shell'; R.specT = 5; R.shieldT = Math.max(R.shieldT, 5); }
  else if (c === 'uni') { R.specK = 'rainbow'; R.specT = 3; R.boostT = Math.max(R.boostT, 3); }
  if (R.isMe) { G.play('magic', { gain: .6 }); big('✨ ' + CAR[c][3], 1.4); }
  if (mp() && !R.remote) G.mpSend({ t: 'rfx', k: 'spec', id: R.id, sk: R.specK });
}
function auth(R) { return R.isMe || (R.bot && isHost()); }   // bu arabanın sonucuna kim karar verir
function hitRacer(R, kind, by) {   // kind: spin | flip | launch | slow
  if (!R || R.fin || !auth(R)) return false;
  if (R.ghostT > 0) return false;
  if (R.shieldT > 0) { R.shieldT = 0; if (R.specK === 'shell') R.specT = 0; if (R.isMe) G.play('shield', { gain: .5 }); return true; }
  if (kind === 'spin') { R.spinT = 1.2; R.sp *= .4; } else if (kind === 'flip') { R.spinT = 1.5; R.vy = 7; R.air = true; R.sp *= .3; } else if (kind === 'launch') { R.spinT = 1.7; R.vy = 10; R.air = true; R.sp *= .25; } else if (kind === 'slow') { R.shrinkT = 3; }
  R.drift = null; R.nitroOn = false;
  if (R.isMe) { G.shake = Math.max(G.shake, .35); G.play('hit', { oof: true }); big(kind === 'slow' ? '⚡ ' + adT('Çarpıldın!') : '💫 ' + adT('Vuruldun!'), 1); }
  return true;
}
function area(a) {
  for (const R of RC.racers) { if (R.id === a.own || !auth(R)) continue;
    if (a.k === 'zap' && R.prog > a.prog) hitRacer(R, 'slow');
    else if (a.k === 'quake' && Math.hypot(R.x - a.x, R.z - a.z) < a.r) hitRacer(R, 'launch');
    else if (a.k === 'rain' && Math.hypot(R.x - a.x, R.z - a.z) < 2.6) hitRacer(R, 'spin'); }
  if (a.k === 'zap') { for (const R of RC.racers) if (R.prog > a.prog && R.id !== a.own) zapFx(R); if (RC.me && RC.me.id !== a.own) G.play('zap', { gain: .4 }); }
  if (a.k === 'quake') for (let i = 0; i < 30; i++) G.spawnDust(a.x, 0, a.z, a.r * .7, 2.5, 0, 0, 0xd9b38c);
}
function zapFx(R) { const a = new T.Vector3(R.x, R.y + 30, R.z), b = new T.Vector3(R.x, R.y + 1, R.z); try { G.spawnTracer(a, b); } catch (e) {} for (let i = 0; i < 8; i++) G.spawnDust(R.x, R.y + 1, R.z, 1, 2, 0, 0, 0xfff3b0); }
const FXM = {};
function fxMesh(k) {
  if (k === 'fire') { const m = new T.Mesh(new T.SphereGeometry(.7, 12, 10), new T.MeshBasicMaterial({ color: 0xff7b00 })); const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: 0xffb703, transparent: true, opacity: .8, blending: T.AdditiveBlending, depthWrite: false })); s.scale.set(3, 3, 1); m.add(s); return m; }
  if (k === 'missile') { const g = new T.Group(); g.add(G.mesh(new T.CylinderGeometry(.22, .22, 1.6, 8).rotateX(Math.PI / 2), G.M(0xe63946), 0, 0, 0)); g.add(G.mesh(new T.ConeGeometry(.24, .5, 8).rotateX(Math.PI / 2), G.M(0xf1faee), 0, 0, 1)); const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: 0xffd166, transparent: true, opacity: .9, blending: T.AdditiveBlending, depthWrite: false })); s.position.z = -1; s.scale.set(1.4, 1.4, 1); g.add(s); return g; }
  if (k === 'oil') { const m = new T.Mesh(new T.CircleGeometry(2.6, 20).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ color: 0x111111, roughness: .05, metalness: .6, transparent: true, opacity: .85 })); m.position.y = .1; return m; }
  if (k === 'mine') { const m = new T.Mesh(new T.BoxGeometry(1.5, 1.5, 1.5), new T.MeshStandardMaterial({ map: boxTex(), emissive: 0xff2a2a, emissiveIntensity: .45, transparent: true, opacity: .9 })); m.position.y = 1.1; return m; }
  if (k === 'tornado') { const g = new T.Group(); for (let i = 0; i < 6; i++) { const r = .6 + i * .45, t = new T.Mesh(new T.TorusGeometry(r, .12, 6, 18), new T.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: .5 })); t.rotation.x = Math.PI / 2; t.position.y = .4 + i * .9; g.add(t); } return g; }
  if (k === 'rain') { const m = new T.Mesh(new T.PlaneGeometry(4, 3).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: new T.Color().setHSL(Math.random(), .9, .6), transparent: true, opacity: .55 })); m.position.y = .12; return m; }
  return new T.Group();
}
function addFx(f) { if (RC.fx.some(o => o.pid === f.pid)) return; f.m = fxMesh(f.k); RC.g.add(f.m); RC.fx.push(f); posFx(f); }
function netFx(f) { const o = {}; for (const k of ['k', 'pid', 'own', 'x', 'z', 'y', 'vx', 'vz', 'b', 'life', 'tg', 's', 'lat', 'lap']) if (f[k] != null) o[k] = typeof f[k] === 'number' ? r1(f[k]) : f[k]; return o; }
function rmFx(pid, net) { const i = RC.fx.findIndex(f => f.pid === pid); if (i < 0) return; const f = RC.fx[i]; if (f.m) RC.g.remove(f.m); RC.fx.splice(i, 1); if (net && mp()) G.mpSend({ t: 'rfx', k: 'rm', pid }); }
function posFx(f) { if (!f.m) return; if (f.k === 'tornado') { const p = trackPoint(f.s, f.lat); f.x = p.x; f.z = p.z; f.y = p.y; } f.m.position.set(f.x, (f.k === 'oil' || f.k === 'rain' || f.k === 'tornado' ? f.y : f.y) + (f.k === 'mine' ? 0 : 0), f.z); }
function trackPoint(s, lat) { const K2 = RC.trk, L = K2.L; s = ((s % L) + L) % L; const i = Math.floor(s / K2.ds) % K2.N, S = K2.S[i]; return { x: S.p.x + S.n.x * lat, z: S.p.z + S.n.z * lat, y: S.p.y, h: Math.atan2(S.t.x, S.t.z) }; }
function fxTick(dt) {
  for (const f of [...RC.fx]) {
    f.t += dt; if (f.t > f.life) { rmFx(f.pid, false); continue; }
    if (f.k === 'fire') { f.x += f.vx * dt; f.z += f.vz * dt; const tk = trackAt(f.x, f.z, f.i); f.i = tk.i; f.y = tk.y + .8; if (Math.abs(tk.lat) > HW + .3) { const S = RC.trk.S[tk.i], vn = f.vx * S.n.x + f.vz * S.n.z; f.vx -= 2 * vn * S.n.x; f.vz -= 2 * vn * S.n.z; const sd = Math.sign(tk.lat); f.x -= S.n.x * sd * (Math.abs(tk.lat) - HW); f.z -= S.n.z * sd * (Math.abs(tk.lat) - HW); if (--f.b < 0) { rmFx(f.pid, false); continue; } } if (Math.random() < .5) G.spawnDust(f.x, f.y, f.z, .3, .6, 0, 0, 0xff9f1c); }
    else if (f.k === 'missile') { const tg = RC.racers.find(R => R.id === f.tg); if (tg) { const dx = tg.x - f.x, dz = tg.z - f.z, d = Math.hypot(dx, dz) || 1; const sp = 52; f.vx += (dx / d * sp - f.vx) * Math.min(1, 3.5 * dt); f.vz += (dz / d * sp - f.vz) * Math.min(1, 3.5 * dt); } f.x += f.vx * dt; f.z += f.vz * dt; const tk = trackAt(f.x, f.z, f.i); f.i = tk.i; f.y = tk.y + 1.2; f.m.rotation.y = Math.atan2(f.vx, f.vz); }
    else if (f.k === 'tornado') { f.s += 46 * dt; f.lat = Math.sin(f.t * 2.2) * 5; f.m.rotation.y += dt * 9; }
    else if (f.k === 'mine') f.m.rotation.y += dt * 1.5;
    posFx(f);
    // çarpışma: her bilgisayar sadece kendi karar verdiği arabalara bakar
    for (const R of RC.racers) { if (!auth(R) || R.fin) continue; if (R.id === f.own && f.t < (f.k === 'oil' || f.k === 'mine' ? 1.2 : 99)) continue; if (R.id === f.own && (f.k === 'fire' || f.k === 'missile' || f.k === 'tornado')) continue;
      const rr = f.k === 'oil' ? 2.6 : f.k === 'tornado' ? 3.2 : f.k === 'mine' ? 1.8 : 1.6, d2 = (R.x - f.x) ** 2 + (R.z - f.z) ** 2; if (d2 > rr * rr || Math.abs(R.y - f.y) > 3) continue;
      if (f.k === 'oil' && R.specK === 'wheelie' && R.specT > 0) continue;
      const kind = f.k === 'fire' ? 'spin' : f.k === 'missile' ? 'flip' : f.k === 'oil' ? 'spin' : f.k === 'mine' ? 'launch' : f.k === 'tornado' ? 'launch' : 'spin';
      if (f.k === 'rain') { hitRacer(R, 'spin'); continue; }
      hitRacer(R, kind, f.own); if (f.k === 'mine' || f.k === 'fire' || f.k === 'missile' || f.k === 'oil') { for (let i = 0; i < 12; i++) G.spawnDust(f.x, f.y, f.z, 1, 2, 0, 0, f.k === 'oil' ? 0x333333 : 0xff7b00); rmFx(f.pid, true); break; } }
  }
}

/* ---------- 🤖 bot sürücüler ---------- */
function botInput(R, dt) {
  const K2 = RC.trk, N = K2.N, la = Math.round((8 + R.sp * .5) / K2.ds), tI = (R.idx + la) % N, S = K2.S[tI];
  R.laneT = (R.laneT || 0) - dt; if (R.laneT <= 0) { R.laneT = 2 + Math.random() * 3; R.lane = THREE_clamp(R.lane + (Math.random() - .5) * 6, -6, 6); }
  for (const f of RC.fx) if ((f.k === 'oil' || f.k === 'mine') && f.own !== R.id) { const dx = f.x - R.x, dz = f.z - R.z, d = Math.hypot(dx, dz); if (d < 25 && d > 2) { const tk = trackAt(f.x, f.z, R.idx); R.lane = tk.lat > 0 ? Math.min(R.lane, tk.lat - 5) : Math.max(R.lane, tk.lat + 5); R.lane = THREE_clamp(R.lane, -7, 7); } }
  const tx = S.p.x + S.n.x * R.lane, tz = S.p.z + S.n.z * R.lane, want = Math.atan2(tx - R.x, tz - R.z), da = wrap(want - R.h);
  const curv = K2.S[(R.idx + Math.round(20 / K2.ds)) % N].k + K2.S[(R.idx + Math.round(36 / K2.ds)) % N].k;
  const I = { thr: 1, st: THREE_clamp(da * 2.4 * R.skill, -1, 1), drift: false, nitro: false };
  if (Math.abs(da) > .7 && R.sp > 26) I.thr = .25;
  if (R.drift) I.drift = curv > .12 || Math.abs(da) > .25; else I.drift = curv > .32 && R.sp > 22 && Math.abs(da) > .12 && Math.random() < R.skill;
  if (R.nitro > 35 && curv < .08) I.nitro = true;
  // güçler
  R.itT = (R.itT || 0) - dt;
  if (R.item && R.item !== '…' && R.itT <= 0) { const it = R.item, ahead = RC.racers.find(o => o.place === R.place - 1), behind = RC.racers.find(o => o.place === R.place + 1);
    const dA = ahead ? Math.hypot(ahead.x - R.x, ahead.z - R.z) : 999, dB = behind ? Math.hypot(behind.x - R.x, behind.z - R.z) : 999;
    let go = false;
    if (it === 'fire') go = dA < 55 && Math.abs(wrap(Math.atan2(ahead.x - R.x, ahead.z - R.z) - R.h)) < .25; else if (it === 'missile') go = !!ahead; else if (it === 'oil' || it === 'mine') go = dB < 30; else if (it === 'shield') go = dB < 25 || R.place > 1; else if (it === 'zap' || it === 'tornado') go = R.place > 1; else go = curv < .1;
    if (go || R.itHold > 9) { useItem(R); R.itHold = 0; } else R.itHold = (R.itHold || 0) + .5; R.itT = .5 + Math.random() * .8; }
  if (R.spc >= 100 && (R.car !== 'truck' || RC.racers.some(o => o !== R && Math.hypot(o.x - R.x, o.z - R.z) < 12)) && Math.random() < dt * .6) useSpecial(R);
  return I;
}
const THREE_clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- ⏱️ her kare ---------- */
function tick(dt) {
  if (G.curKey !== 'race') { if (RC.state !== 'off') endRace(false); return; }
  if (!RC.trk) return;
  const t = G.elapsed;
  for (const b of RC.boxes) { if (!b.m.visible) { b.t -= dt; if (b.t <= 0) b.m.visible = true; } b.m.rotation.y += dt * 1.6; b.m.rotation.x = Math.sin(t + b.ph) * .3; b.m.position.y = b.y + Math.sin(t * 2 + b.ph) * .2; }
  if (RC.state === 'off') { if (!RC.lobby && !RC.res && !G.paused) showLobby(); return; }
  if (!dt) { syncCam(0); return; }
  RC.t += dt;
  if (RC.state === 'count') {
    const c0 = Math.ceil(RC.cd); RC.cd -= dt; const c1 = Math.ceil(RC.cd);
    if (c1 !== c0 && c1 > 0) { big(String(c1), .9); beep(440); }
    const I = input(); if (I.thr > 0 && RC.cd < .45) RC.goBoost = 1; else if (I.thr > 0 && RC.cd > .9) RC.goBoost = -1;
    if (RC.cd <= 0) { RC.state = 'race'; RC.t = 0; big(adT('BAŞLA!'), 1); beep(880); if (RC.me && RC.goBoost === 1) { RC.me.boostT = 1.2; G.play('boost', { gain: .6 }); } }
  }
  const racing = RC.state === 'race';
  // benim arabam
  const me = RC.me;
  if (me) {
    const I = racing && !me.fin ? input() : { thr: me.fin ? .4 : 0, st: 0, drift: false, nitro: false };
    if (racing && !me.fin) {
      if (edge(I, 'item')) { if (me.item && me.item !== '…') useItem(me); else if (me.roll <= 0 && !me.item) G.play('ui', { gain: .2 }); }
      if (edge(I, 'spec')) { if (me.spc >= 100) useSpecial(me); else G.showMsg('✨ ' + adT('Özel güç dolmadı') + ` (${Math.floor(me.spc)}%)`, .8); }
      me.nitroOn = I.nitro && (me.nitro > 0 || RC.adm.infNitro); if (me.nitroOn && !RC.adm.infNitro) me.nitro = Math.max(0, me.nitro - dt * 28);
    } else me.nitroOn = false;
    if (me.fin) { const S = RC.trk.S[(me.idx + 6) % RC.trk.N]; I.st = THREE_clamp(wrap(Math.atan2(S.p.x - me.x, S.p.z - me.z) - me.h) * 2, -1, 1); }
    if (racing || me.fin) physics(me, I, dt);
    if (me.roll > 0) { me.roll -= dt; if (me.roll <= 0) { me.item = me.rollItem; G.play('ding', { gain: .4 }); } }
  }
  // botlar (tek başına ya da oda sahibi)
  for (const R of RC.racers) if (R.bot && isHost()) { const I = racing && !R.fin ? botInput(R, dt) : { thr: R.fin ? .5 : 0, st: 0 }; if (R.fin) { const S = RC.trk.S[(R.idx + 6) % RC.trk.N]; I.st = THREE_clamp(wrap(Math.atan2(S.p.x - R.x, S.p.z - R.z) - R.h) * 2, -1, 1); } R.nitroOn = !!I.nitro && R.nitro > 0; if (R.nitroOn) R.nitro -= dt * 28; if (racing || R.fin) physics(R, I, dt); if (R.roll > 0) { R.roll -= dt; if (R.roll <= 0) R.item = R.rollItem; } }
  // uzaktakiler (arkadaşlar, misafirde botlar)
  for (const R of RC.racers) if (R.remote || (R.bot && !isHost())) netFollow(R, dt);
  // araba-araba çarpışması
  for (let i = 0; i < RC.racers.length; i++) for (let j = i + 1; j < RC.racers.length; j++) { const a = RC.racers[i], b = RC.racers[j], dx = b.x - a.x, dz = b.z - a.z, d2 = dx * dx + dz * dz; if (d2 > 6.2 || Math.abs(a.y - b.y) > 2) continue; const d = Math.sqrt(d2) || .01, ov = (2.5 - d) / 2, nx = dx / d, nz = dz / d;
    if (a.ghostT > 0 || b.ghostT > 0) { const sp = a.ghostT > 0 && a.specK === 'spin' ? b : b.ghostT > 0 && b.specK === 'spin' ? a : null; if (sp) hitRacer(sp, 'spin'); continue; }
    if (a.specK === 'shell' && a.specT > 0) hitRacer(b, 'spin'); if (b.specK === 'shell' && b.specT > 0) hitRacer(a, 'spin');
    if (auth(a)) { a.x -= nx * ov; a.z -= nz * ov; a.sp *= .97; } if (auth(b)) { b.x += nx * ov; b.z += nz * ov; b.sp *= .97; } }
  // gökkuşağı izi
  for (const R of RC.racers) if (R.specK === 'rainbow' && R.specT > 0 && !R.remote && !(R.bot && !isHost())) { R.rainT = (R.rainT || 0) - dt; if (R.rainT <= 0) { R.rainT = .12; const f = { k: 'rain', pid: R.id + ':r' + (++RC.pid), own: R.id, x: R.x - Math.sin(R.h) * 3, z: R.z - Math.cos(R.h) * 3, y: R.y, life: 4, t: 0 }; addFx(f); if (mp()) G.mpSend({ t: 'rfx', k: 'add', f: netFx(f) }); } }
  fxTick(dt);
  updatePlaces();
  for (const R of RC.racers) drawRacer(R, dt);
  netSend(dt);
  syncCam(dt); hudTick();
  // bitiş
  if (me && me.fin && !RC.res) { const allP = RC.racers.filter(R => !R.bot).every(R => R.fin), allB = RC.racers.every(R => R.fin); if (RC.t - RC.endT > (allP ? (allB ? 2 : 6) : 25)) showRes(); }
}
function drawRacer(R, dt) {
  R.root.position.set(R.x, R.y, R.z);
  const spinA = R.spinT > 0 ? (1.5 - R.spinT) * Math.PI * 3 : R.specK === 'spin' && R.specT > 0 ? G.elapsed * 14 : 0;
  R.root.rotation.y = R.h + spinA + (R.drift ? R.drift.dir * .38 : 0);
  const st = R.drift ? R.drift.dir : 0; R.body.rotation.z += ((st * -.08) - R.body.rotation.z) * Math.min(1, 8 * dt); R.body.rotation.x += (((R.specK === 'wheelie' && R.specT > 0) ? -.45 : R.air ? THREE_clamp(-R.vy * .03, -.4, .4) : 0) - R.body.rotation.x) * Math.min(1, 8 * dt);
  const sc = R.shrinkT > 0 ? .55 : 1; R.root.scale.setScalar(R.root.scale.x + (sc - R.root.scale.x) * Math.min(1, 6 * dt));
  const fl = R.flame, on = R.nitroOn || R.boostT > 0 || (R.specK === 'light' && R.specT > 0);
  fl.material.opacity += ((on ? .9 : 0) - fl.material.opacity) * Math.min(1, 12 * dt); fl.material.color.setHex(R.nitroOn ? 0x66ccff : R.specK === 'light' ? 0xfff3b0 : 0xff9f1c); fl.scale.setScalar(1.2 + Math.random() * .8);
  if (!R.isMe) { const cd = G.camera.position.distanceTo(R.root.position); R.label.visible = cd > 11 && cd < 140; }
  R.shieldM.visible = R.shieldT > 0; if (R.shieldM.visible) R.shieldM.material.opacity = .18 + Math.sin(G.elapsed * 8) * .07;
  if (R.ghostT > 0 && R.specK === 'light') R.model.visible = Math.floor(G.elapsed * 20) % 2 === 0; else R.model.visible = true;
  // drift kıvılcımları
  if (R.drift && Math.abs(R.x - G.player.position.x) + Math.abs(R.z - G.player.position.z) < 90) { const c = R.drift.c > 2.6 ? 0xc77dff : R.drift.c > 1.6 ? 0xff9f1c : R.drift.c > .8 ? 0x4cc9f0 : 0xdddddd; R.sparks -= dt; if (R.sparks <= 0) { R.sparks = .04; for (const sd of [1, -1]) G.spawnDust(R.x - Math.sin(R.h) * 1.3 + Math.cos(R.h) * sd * .9, R.y + .2, R.z - Math.cos(R.h) * 1.3 - Math.sin(R.h) * sd * .9, .15, .5, 0, 0, c); } }
}
function syncCam(dt) {
  const me = RC.me; if (!me) return;
  G.player.position.set(me.x, me.y, me.z); G.vel.set(0, 0, 0); G.vy = 0; G.onGround = true;
  const want = me.h - Math.PI + (me.drift ? -me.drift.dir * .22 : 0); if (RC.camYaw == null || !dt) RC.camYaw = want; RC.camYaw += wrap(want - RC.camYaw) * Math.min(1, 7 * (dt || 1));
  G.yaw = RC.camYaw; G.facing = me.h; G.dist = 7.2 + Math.min(2, Math.abs(me.sp) * .03); G.pitch = .2;
}

/* ---------- 👥 çok oyunculu ---------- */
function netSend(dt) {
  if (!mp() || !RC.me) return;
  RC.sendT -= dt; if (RC.sendT <= 0) { RC.sendT = 1 / 12; const R = RC.me;
    G.mpSend({ t: 'rst', x: r1(R.x), y: r1(R.y), z: r1(R.z), h: Math.round(R.h * 100) / 100, sp: r1(R.sp), l: R.lap, s: r1(R.s), f: (R.drift ? R.drift.dir : 0), n: R.nitroOn || R.boostT > 0 ? 1 : 0, sh: R.shieldT > 0 ? 1 : 0, k: R.shrinkT > 0 ? 1 : 0, sp2: R.spinT > 0 ? 1 : 0, fin: R.fin ? r1(R.finT) : 0, sk: R.specT > 0 ? R.specK : '' }); }
  if (G.MP.host) { RC.botT -= dt; if (RC.botT <= 0) { RC.botT = .1; const b = RC.racers.filter(R => R.bot).map(R => [R.id, r1(R.x), r1(R.y), r1(R.z), Math.round(R.h * 100) / 100, r1(R.sp), R.lap, r1(R.s), R.drift ? R.drift.dir : 0, (R.nitroOn || R.boostT > 0 ? 1 : 0) | (R.shieldT > 0 ? 2 : 0) | (R.shrinkT > 0 ? 4 : 0) | (R.spinT > 0 ? 8 : 0), R.fin ? r1(R.finT) : 0, R.specT > 0 ? R.specK : '']); if (b.length) G.mpSend({ t: 'rbt', b }); } }
}
function netFollow(R, dt) {
  const n = R.net; if (!n) return; const k = 1 - Math.exp(-12 * dt);
  if (Math.hypot(n.x - R.x, n.z - R.z) > 30) { R.x = n.x; R.z = n.z; } else { R.x += (n.x - R.x) * k + Math.sin(R.h) * n.sp * dt * .5; R.z += (n.z - R.z) * k + Math.cos(R.h) * n.sp * dt * .5; }
  R.y += (n.y - R.y) * k; R.h += wrap(n.h - R.h) * k; R.sp = n.sp; R.lap = n.l; R.s = n.s; R.prog = n.l * RC.trk.L + n.s; R.idx = trackAt(R.x, R.z, R.idx).i;
  R.drift = n.f ? { dir: n.f, c: 1 } : null; R.nitroOn = !!n.n; R.shieldT = n.sh ? 1 : 0; R.shrinkT = n.k ? 1 : 0; R.spinT = n.sp2 ? Math.max(R.spinT - dt, .3) : 0; R.specK = n.sk || R.specK; R.specT = n.sk ? 1 : 0;
  if (n.fin && !R.fin) { R.fin = true; R.finT = n.fin; }
}
function net(m) {
  if (m.t === 'rcar') { RC.mpCars[m.f] = { car: m.car, col: m.col, dcol: m.dcol }; return; }
  if (m.t === 'rgo') { if (G.curKey !== 'race') return; startRace(m.cfg); return; }
  if (m.t === 'rq' && G.MP.host && RC.state !== 'off' && RC.cfg) { G.mpSend({ t: 'rgo', cfg: RC.cfg, to: m.f }); return; }
  if (RC.state === 'off' || !RC.trk) return;
  if (m.t === 'rst') { const R = RC.racers.find(o => o.id === m.f); if (R) R.net = m; return; }
  if (m.t === 'rbt' && !G.MP.host) { for (const e of m.b) { const R = RC.racers.find(o => o.id === e[0]); if (!R) continue; R.net = { x: e[1], y: e[2], z: e[3], h: e[4], sp: e[5], l: e[6], s: e[7], f: e[8], n: e[9] & 1, sh: e[9] & 2, k: e[9] & 4, sp2: e[9] & 8, fin: e[10], sk: e[11] }; } return; }
  if (m.t === 'rfx') {
    if (m.k === 'add') addFx(Object.assign({ t: 0 }, m.f));
    else if (m.k === 'rm') rmFx(m.pid, false);
    else if (m.k === 'area') area(m.a);
    else if (m.k === 'box') { for (const b of RC.boxes) if (Math.abs(b.x - m.x) < .6 && Math.abs(b.z - m.z) < .6) { b.m.visible = false; b.t = 2.6; } }
    else if (m.k === 'spec') { const R = RC.racers.find(o => o.id === m.id); if (R) { R.specK = m.sk; R.specT = 2.5; } }
  }
}

/* ---------- 🖥️ arayüz ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>
#rcHud{position:fixed;inset:0;pointer-events:none;z-index:7;display:none;font:700 14px system-ui,sans-serif;color:#fff}#rcHud.on{display:block}
#rcHud .top{position:absolute;left:50%;top:calc(10px + env(safe-area-inset-top));transform:translateX(-50%);display:flex;gap:8px}
#rcHud .pill{background:rgba(10,20,35,.72);border-radius:12px;padding:7px 12px;backdrop-filter:blur(4px)}
#rcHud .pos{font-size:26px;line-height:1}#rcHud .pos small{font-size:13px;opacity:.8}
#rcHud .list{position:absolute;left:10px;top:calc(70px + env(safe-area-inset-top));background:rgba(10,20,35,.62);border-radius:12px;padding:6px 8px;font-size:12px;min-width:140px}
#rcHud .list div{display:flex;gap:6px;padding:2px 0}#rcHud .list .me{color:#ffd166}
#rcHud .item{position:absolute;right:12px;top:calc(70px + env(safe-area-inset-top));width:78px;height:78px;border-radius:18px;background:rgba(10,20,35,.75);border:3px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-size:44px}
#rcHud .item.roll{animation:rcRoll .12s infinite}@keyframes rcRoll{50%{transform:scale(1.08) rotate(6deg)}}
#rcHud .bars{position:absolute;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;gap:12px;align-items:center}
#rcHud .bar{width:150px;height:14px;border-radius:8px;background:rgba(0,0,0,.45);overflow:hidden;border:1px solid rgba(255,255,255,.3)}#rcHud .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#4cc9f0,#3a86ff)}
#rcHud .bar.sp i{background:linear-gradient(90deg,#ffd166,#ff70a6)}#rcHud .bar.full{box-shadow:0 0 12px #ffd166}
#rcHud .spd{font-size:22px;min-width:90px;text-align:center}
#rcHud .big{position:absolute;left:50%;top:34%;transform:translate(-50%,-50%);font-size:min(16vw,92px);font-weight:900;text-shadow:0 6px 24px rgba(0,0,0,.5);transition:opacity .3s;opacity:0;white-space:nowrap}
#rcHud .warn{position:absolute;left:50%;top:22%;transform:translateX(-50%);font-size:26px;color:#ff4d6d;display:none}
#rcHud .keys{position:absolute;right:12px;bottom:calc(16px + env(safe-area-inset-bottom));font-size:11px;opacity:.75;text-align:right;line-height:1.5}
#rcHud canvas{position:absolute;right:12px;top:calc(158px + env(safe-area-inset-top));width:130px;height:130px;border-radius:12px;background:rgba(10,20,35,.5)}
#rcTouch{position:fixed;right:10px;bottom:calc(60px + env(safe-area-inset-bottom));z-index:8;display:none;grid-template-columns:repeat(2,72px);gap:10px;pointer-events:auto}
#rcTouch button{height:66px;border-radius:18px;border:2px solid rgba(255,255,255,.4);background:rgba(10,20,35,.62);color:#fff;font:800 13px system-ui;touch-action:none}
#rcTouch button.on{background:#ffd166;color:#111}
#rcPanel{position:fixed;inset:0;z-index:30;display:none;align-items:center;justify-content:center;background:rgba(3,8,16,.55);font:14px system-ui,sans-serif;color:#eef3ff}
#rcPanel.on{display:flex}#rcPanel .box{width:min(620px,95vw);max-height:90vh;overflow-y:auto;background:linear-gradient(160deg,#16213a,#0f1626);border:1px solid rgba(140,170,255,.25);border-radius:18px;padding:14px 16px;box-shadow:0 18px 50px rgba(0,0,0,.5)}
#rcPanel h3{margin:0 0 6px;font-size:20px}#rcPanel .sub{font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.6;font-weight:800;margin:12px 0 6px}
#rcPanel .row{display:flex;flex-wrap:wrap;gap:6px}#rcPanel button{border:1.5px solid rgba(255,255,255,.15);border-radius:11px;padding:8px 10px;background:rgba(255,255,255,.07);color:#fff;font:700 13px system-ui;cursor:pointer}
#rcPanel button.on{background:#ffd166;color:#1b1b1b;border-color:#ffd166}#rcPanel .go{background:#06d6a0;color:#06261d;font-size:16px;padding:12px 18px;border:0}
#rcPanel .car{display:flex;flex-direction:column;align-items:flex-start;text-align:left;width:calc(50% - 4px);min-width:200px}#rcPanel .car small{opacity:.7;font-weight:500}
#rcPanel .sw{width:30px;height:30px;border-radius:50%;padding:0}#rcPanel .tip{font-size:12px;opacity:.75;margin:6px 0;line-height:1.45}
#rcPanel table{width:100%;border-collapse:collapse;margin:8px 0}#rcPanel td{padding:6px;border-bottom:1px solid rgba(255,255,255,.08)}#rcPanel tr.me td{color:#ffd166;font-weight:800}
</style>`);
document.body.insertAdjacentHTML('beforeend', `<div id="rcHud"><div class="top"><div class="pill pos" id="rcPos">1<small>/6</small></div><div class="pill" id="rcLap">Tur 1/3</div><div class="pill" id="rcTime">0:00.0</div></div>
  <div class="list" id="rcList"></div><div class="item" id="rcItem"></div><canvas id="rcMap" width="260" height="260"></canvas>
  <div class="bars"><div><div style="font-size:11px">⚡ Nitro</div><div class="bar" id="rcNit"><i></i></div></div><div class="pill spd" id="rcSpd">0</div><div><div style="font-size:11px">✨ Özel güç</div><div class="bar sp" id="rcSpc"><i></i></div></div></div>
  <div class="big" id="rcBig"></div><div class="warn" id="rcWarn">⛔ Ters yön!</div>
  <div class="keys" id="rcKeys">W/S gaz-fren · A/D dön · Boşluk/Shift drift<br>E nitro · F / sol tık güç · R özel güç</div></div>
<div id="rcTouch"><button data-t="drift">↪️ Drift</button><button data-t="item">🎁 Güç</button><button data-t="nitro">⚡ Nitro</button><button data-t="spec">✨ Özel</button><button data-t="brake" style="grid-column:1/3;height:48px">🛑 Fren</button></div>
<div id="rcPanel"><div class="box" id="rcBox"></div></div>`);
{ const tb = $('rcTouch'); const set = (e, on) => { const b = e.target.closest('[data-t]'); if (!b) return; e.preventDefault(); e.stopPropagation(); RC.touch[b.dataset.t] = on; b.classList.toggle('on', on); };
  tb.addEventListener('pointerdown', e => set(e, true)); for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) tb.addEventListener(ev, e => set(e, false));
  for (const ev of ['mousedown', 'touchstart', 'keydown']) $('rcPanel').addEventListener(ev, e => e.stopPropagation(), { passive: true }); }
const fmt = t => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
function hudShow(on) { $('rcHud').classList.toggle('on', on); $('rcTouch').style.display = on && G.touchMode ? 'grid' : 'none'; $('rcKeys').style.display = G.touchMode ? 'none' : ''; }
function big(t, dur) { const b = $('rcBig'); b.textContent = t; b.style.opacity = 1; clearTimeout(RC.bigT); RC.bigT = setTimeout(() => { b.style.opacity = 0; }, dur * 1000); }
function beep(f) { try { G.play('ui', { gain: .5 }); } catch (e) {} }
function hudTick() {
  const me = RC.me; if (!me) return; const n = RC.racers.length;
  $('rcPos').innerHTML = `${me.place}<small>/${n}</small>`; $('rcLap').textContent = `🏁 ${adT('Tur')} ${Math.min(RC.laps, me.lap + 1)}/${RC.laps}`; $('rcTime').textContent = '⏱️ ' + fmt(me.fin ? me.finT : RC.state === 'race' ? RC.t : 0);
  const it = $('rcItem'); it.textContent = me.roll > 0 ? ITEMS[Object.keys(ITEMS)[Math.floor(G.elapsed * 14) % 9]][0] : me.item && ITEMS[me.item] ? ITEMS[me.item][0] : ''; it.classList.toggle('roll', me.roll > 0);
  $('rcNit').firstChild.style.width = (RC.adm.infNitro ? 100 : me.nitro) + '%'; $('rcSpc').firstChild.style.width = me.spc + '%'; $('rcSpc').classList.toggle('full', me.spc >= 100);
  $('rcSpd').textContent = Math.round(Math.abs(me.sp) * 3.6) + ' km/sa';
  $('rcWarn').style.display = me.wrongT > 1.2 ? 'block' : 'none';
  RC.listT = (RC.listT || 0) - 1; if (RC.listT <= 0) { RC.listT = 10; $('rcList').innerHTML = RC.racers.slice().sort((a, b) => a.place - b.place).map(R => `<div class="${R.isMe ? 'me' : ''}"><b>${R.place}.</b><span>${CAR[R.car] ? CAR[R.car][1] : '🚗'} ${esc(R.name)}</span>${R.fin ? '🏁' : ''}</div>`).join('');
    drawMap(); }
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function drawMap() {
  const c = $('rcMap'), g = c.getContext('2d'), K2 = RC.trk, a = A(); g.clearRect(0, 0, 260, 260);
  if (!RC.mapB) { let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9; for (const S of K2.S) { mnx = Math.min(mnx, S.p.x); mxx = Math.max(mxx, S.p.x); mnz = Math.min(mnz, S.p.z); mxz = Math.max(mxz, S.p.z); } RC.mapB = { mnx, mnz, k: 220 / Math.max(mxx - mnx, mxz - mnz) }; }
  const B = RC.mapB, X = x => 20 + (x - B.mnx) * B.k, Z = z => 20 + (z - B.mnz) * B.k;
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 7; g.beginPath(); K2.S.forEach((S, i) => i ? g.lineTo(X(S.p.x), Z(S.p.z)) : g.moveTo(X(S.p.x), Z(S.p.z))); g.closePath(); g.stroke();
  for (const R of RC.racers) { g.fillStyle = R.isMe ? '#ffd166' : R.bot ? '#ff6b6b' : '#4cc9f0'; g.beginPath(); g.arc(X(R.x), Z(R.z), R.isMe ? 7 : 5, 0, 7); g.fill(); }
}
function panel(html, on) { $('rcBox').innerHTML = html; $('rcPanel').classList.add('on'); RC.panelOn = on; try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {} }
function hidePanel() { $('rcPanel').classList.remove('on'); RC.panelOn = null; }
function showLobby() {
  RC.lobby = true; const host = !mp() || G.MP.host || G.ADM_UNLOCK;
  const cars = CARS.filter(c => c[0] !== 'custom' || RC.glb || true).map(c => `<button class="car ${RC.car === c[0] ? 'on' : ''}" data-car="${c[0]}"><span>${c[1]} <b>${adT(c[2])}</b></span><small>✨ ${adT(c[3])} — ${adT(c[4])}</small></button>`).join('');
  panel(`<h3>🏎️ ${adT('Yarış')}</h3><div class="tip">${adT('Bütün arabalar aynı hızda: fark sürüşte, driftte, nitroda ve güçlerde. ✦ kutulardan güç al, drift yaparak nitro doldur, özel gücün dolunca R ile kullan.')}</div>
    <div class="sub">${adT('Araban')}</div><div class="row">${cars}</div>
    <div class="row" style="margin-top:8px">${PAL.map(c => `<button class="sw ${RC.col === c ? 'on' : ''}" data-col="${c}" style="background:#${c.toString(16).padStart(6, '0')}"></button>`).join('')}</div>
    <div class="row" style="margin-top:8px"><label><button data-a="glb">📦 ${adT(RC.glb ? 'Modelini değiştir (GLB)' : 'Kendi modelini yükle (GLB)')}</button></label>${RC.glb ? `<button data-a="glbrot">↻ ${adT('Modeli çevir')}</button>` : ''}<input type="file" id="rcGlb" accept=".glb,.gltf" style="display:none"></div>
    ${host ? `<div class="sub">${adT('Pist')}</div><div class="row">${Object.entries(TRACKS).map(([k, v]) => `<button data-tr="${k}" class="${RC.tr === k ? 'on' : ''}">${adT(v.n)}</button>`).join('')}</div>
    <div class="sub">${adT('Tur')}</div><div class="row">${[1, 2, 3, 5].map(n => `<button data-laps="${n}" class="${RC.laps === n ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="sub">${adT('Bot')}</div><div class="row">${[0, 3, 5, 7].map(n => `<button data-bots="${n}" class="${RC.nBots === n ? 'on' : ''}">${n ? '🤖 ' + n : adT('Yok')}</button>`).join('')}</div>` : `<div class="tip">👥 ${adT('Pisti, turu ve botları oda sahibi seçer; yarışı o başlatır. Sen arabanı seç!')}</div>`}
    <div class="row" style="margin-top:14px">${host ? `<button class="go" data-a="go">🏁 ${adT('Yarışı başlat')}</button>` : ''}<button data-a="home">🏡 ${adT('Köye dön')}</button></div>`, 'lobby');
  if (mp()) G.mpSend({ t: 'rcar', car: RC.car, col: RC.col, dcol: G.playerRig ? G.playerRig.bodyMat.color.getHex() : 0x333333 });
}
function hideLobby() { RC.lobby = false; if (RC.panelOn === 'lobby') hidePanel(); }
function showRes() {
  RC.res = true; const L = updatePlaces();
  const rows = L.map(R => `<tr class="${R.isMe ? 'me' : ''}"><td>${R.place === 1 ? '🥇' : R.place === 2 ? '🥈' : R.place === 3 ? '🥉' : R.place + '.'}</td><td>${CAR[R.car] ? CAR[R.car][1] : ''} ${esc(R.name)}</td><td style="text-align:right">${R.fin ? fmt(R.finT) : '—'}</td></tr>`).join('');
  const host = !mp() || G.MP.host || G.ADM_UNLOCK;
  panel(`<h3>🏁 ${adT('Yarış bitti!')}</h3><table>${rows}</table><div class="row">${host ? `<button class="go" data-a="again">🔁 ${adT('Tekrar yarış')}</button>` : `<div class="tip">${adT('Yeni yarışı oda sahibi başlatır')}</div>`}<button data-a="lobby">🚗 ${adT('Araba / pist değiştir')}</button><button data-a="home">🏡 ${adT('Köye dön')}</button></div>`, 'res');
}
function hideRes() { RC.res = false; if (RC.panelOn === 'res') hidePanel(); }
$('rcPanel').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; G.play('ui', { gain: .4 });
  if (b.dataset.car) { if (b.dataset.car === 'custom' && !RC.glb) { $('rcGlb').click(); return; } RC.car = b.dataset.car; save(); showLobby(); }
  else if (b.dataset.col) { RC.col = +b.dataset.col; save(); showLobby(); }
  else if (b.dataset.tr) { RC.tr = b.dataset.tr; save(); buildTrack(RC.tr); RC.mapB = null; parkPlayer(); showLobby(); }
  else if (b.dataset.laps) { RC.laps = +b.dataset.laps; save(); showLobby(); }
  else if (b.dataset.bots) { RC.nBots = +b.dataset.bots; save(); showLobby(); }
  else if (b.dataset.a === 'glb') $('rcGlb').click();
  else if (b.dataset.a === 'glbrot') { RC.glbRot = (RC.glbRot + 1) % 4; save(); G.showMsg('↻ ' + adT('Model döndü'), .8); }
  else if (b.dataset.a === 'go' || b.dataset.a === 'again') { hidePanel(); RC.mapB = null; requestStart(); }
  else if (b.dataset.a === 'lobby') { endRace(true); }
  else if (b.dataset.a === 'home') { hidePanel(); RC.lobby = false; endRace(false); RC.leaving = true; G.teleportTo('hub', 0, 7.5, 0, adT('🏡 Köye döndün')); }
});
$('rcPanel').addEventListener('change', e => { if (e.target.id !== 'rcGlb') return; const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
  if (f.size > 25e6) { G.showMsg(adT('⚠️ Model çok büyük (en fazla 25 MB)'), 2); return; }
  f.arrayBuffer().then(buf => glbLoad(buf, true)).then(() => { RC.car = 'custom'; save(); G.showMsg('📦 ' + adT('Modelin yüklendi!'), 1.4); showLobby(); }).catch(() => G.showMsg(adT('⚠️ Bu dosya açılamadı (GLB olmalı)'), 2)); });

/* ---------- 🗺️ alan ---------- */
function parkPlayer() { if (!RC.trk) return; const p = gridPos(0); G.player.position.set(p.x + Math.cos(p.h) * 12, p.y, p.z - Math.sin(p.h) * 12); G.facing = p.h; G.yaw = p.h - Math.PI; }
function area() {
  const on = G.curKey === 'race';
  if (on) { if (!RC.g.parent) G.scene.add(RC.g); buildTrack(RC.tr); RC.mapB = null; RC.leaving = false; parkPlayer(); setTimeout(() => { if (G.curKey === 'race' && RC.state === 'off') { showLobby(); if (mp() && !G.MP.host) G.mpSend({ t: 'rq' }); } }, 400); }
  else { if (RC.g.parent) G.scene.remove(RC.g); if (RC.state !== 'off') endRace(false); hidePanel(); RC.lobby = false; hudShow(false); }
}
function open() {
  const busy = G.admBusy && G.admBusy(); if (busy) { G.showMsg(busy, 1.8); return; }
  if (G.curKey === 'race') { if (RC.state === 'off') showLobby(); return; }
  const a = A(); G.teleportTo('race', a.cx, a.cz, 0, '🏎️ ' + adT('Yarış pisti!'));
}
function ground(x, z, y, g) { if (!RC.trk) return g; if (RC.me && G.RACE_LOCK) return RC.me.y; const tk = trackAt(x, z, null); return Math.abs(tk.lat) < HW + 1.5 ? Math.max(g, tk.y + .06) : g; }
function key(code) {   // yarışta tuşlar oyuna değil arabaya
  if (code === 'Mouse0') { RC.mouseItem = true; return true; }
  return true;
}
function hideAv(p) { return RC.state !== 'off'; }

/* ---------- 🛠️ admin: yarış bölümü ---------- */
try {
  const A_ = (id, ic, tr, en, fn) => [id, ic, tr, en, fn], me = () => RC.me;
  const give = it => () => { const R = me(); if (!R) return adT('🏎️ Önce yarışa başla'); R.item = it; R.roll = 0; return ITEMS[it][0] + ' ' + adT(ITEMS[it][1]); };
  const cat = ['🏎️ Yarış', '🏎️ Racing', [
    A_('rc_go', '🏁', 'Yarış pistine git', 'Go to race track', () => { open(); return '🏎️'; }),
    A_('rc_start', '🚦', 'Yarışı başlat / yeniden', 'Start / restart race', () => { if (G.curKey !== 'race') { open(); return adT('🏎️ Önce piste gidiliyor'); } if (RC.state !== 'off') endRace(false); requestStart(); G.resumeGame && G.resumeGame(); return '🚦'; }),
    A_('rc_item', '🎁', 'Rastgele güç ver', 'Random power-up', () => { const R = me(); if (!R) return adT('🏎️ Önce yarışa başla'); R.item = null; R.roll = 0; gotBox(R); R.roll = .3; return '🎁'; }),
    A_('rc_fire', '🔥', 'Alev topu ver', 'Give fireball', give('fire')), A_('rc_missile', '🎯', 'Takip füzesi ver', 'Give homing missile', give('missile')),
    A_('rc_zap', '⚡', 'Yıldırım ver', 'Give lightning', give('zap')), A_('rc_tornado', '🌪️', 'Hortum ver', 'Give tornado', give('tornado')), A_('rc_shield', '🛡️', 'Kalkan ver', 'Give shield', give('shield')),
    A_('rc_nitro', '⚡', 'Nitroyu doldur', 'Fill nitro', () => { const R = me(); if (!R) return adT('🏎️ Önce yarışa başla'); R.nitro = 100; return '⚡ 100%'; }),
    A_('rc_inf', '♾️', 'Sınırsız nitro (aç / kapat)', 'Infinite nitro (toggle)', () => { RC.adm.infNitro = !RC.adm.infNitro; return RC.adm.infNitro ? '♾️ ' + adT('açık') : adT('kapalı'); }),
    A_('rc_spec', '✨', 'Özel gücü doldur', 'Fill special', () => { const R = me(); if (!R) return adT('🏎️ Önce yarışa başla'); R.spc = 100; return '✨ 100%'; }),
    A_('rc_win', '🏆', 'Yarışı bitir (son tur)', 'Finish race', () => { const R = me(); if (!R) return adT('🏎️ Önce yarışa başla'); R.lap = RC.laps - 1; R.cp = true; return '🏁 ' + adT('Son tur!'); }),
    A_('rc_bots', '🤖', 'Bot sayısı (0 / 3 / 5 / 7)', 'Bots (0/3/5/7)', () => { RC.nBots = [0, 3, 5, 7][([0, 3, 5, 7].indexOf(RC.nBots) + 1) % 4]; save(); if (RC.lobby) showLobby(); return '🤖 ' + RC.nBots; }),
  ]];
  if (G.ADM_LIST && G.ADM_F) { G.ADM_LIST.splice(1, 0, cat); for (const [id, ic, tr, en, fn] of cat[2]) G.ADM_F[id] = { id, ic, tr, en, fn }; }
} catch (e) { console.warn('yarış admin', e); }

window.__race = { tick, area, open, ground, key, net, hideAv, RC, startRace, requestStart, endRace, trackAt, physics };
})(window.__sftG);
