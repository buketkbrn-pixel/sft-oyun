/* 🏙️ S.F.T · Şehir dünyası (kent.js) — şehrin çevresinde ⛰️ dağlar ve dağ üstü evler, 🛣️ katman katman üst yollar, 🚇 dağın içinden tünel,
   🌳 fıskiyeli park, 🅿️ katlı otopark, 🛒 içi olan SFT Market, 🏢 içi olan SFT Plaza (Tapır Kahve, açık ofis), 🌃 Tokyo gibi ışıklı reklam panoları,
   🚗 daha kaliteli arabalar ve her yerde SFT yazıları. index.html bunu yükler; oyunun değişkenlerine window.__sftG (G) ile erişir. Tasarımlar bu oyuna özgüdür. */
(function (G) {
'use strict';
const T = G.THREE, $ = id => document.getElementById(id), adT = s => G.adT(s), R = (a, b) => a + Math.random() * (b - a), pick = a => a[(Math.random() * a.length) | 0];
const V1 = new T.Vector3(), V2 = new T.Vector3(), UP = new T.Vector3(0, 1, 0), dmy = new T.Object3D();
const inCity = () => G.curKey === 'city' && G.CITY && G.CITY.built, CA = () => G.AREAS.city;
const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const K = { built: false, g: new T.Group(), obs: [], decks: [], bld: [], anim: [], npcs: [], cars: [], fount: [], doors: [], cut: [], boards: [], U: { t: { value: 0 } } };
K.g.name = 'kentRoot'; K.g.visible = false;
let rs = 777; const rr = () => (rs = (rs * 48271) % 2147483647) / 2147483647;   // tohumlu rastgele (herkeste aynı dünya)
const RR = (a, b) => a + rr() * (b - a);
const M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .75 }, o));
const GLOW = c => new T.MeshBasicMaterial({ color: c, toneMapped: false });
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }

/* ---------- ⛰️ dağlar: yükseklik alanı (şehrin batısı ve kuzeyi) ---------- */
const PEAKS = [[-660, -40, 230, 150], [-610, -450, 270, 205], [-260, -680, 240, 160], [120, -700, 260, 185], [460, -640, 220, 125], [-780, 250, 200, 105]];
const TUN = { z: -300, hw: 6.4, x0: -400, x1: -1100, top: 7.2 };   // tünel koridoru (x0: giriş, x1: çıkış; yapılırken bulunur)
const SUM = { x: 120, z: -700, top: 0 };   // 🏡 dağ köyü (zirve düzlüğü)
const hsh = (i, j) => { let h = (i * 374761393 + j * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
function vn(x, z) { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz), a = hsh(i, j), b = hsh(i + 1, j), c = hsh(i, j + 1), d = hsh(i + 1, j + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function ridged(x, z) { let s = 0, a = .5, f = 1, w = 1; for (let o = 0; o < 5; o++) { let n = 1 - Math.abs(vn(x * f, z * f) * 2 - 1); n *= n * w; w = Math.min(1, n * 2); s += n * a; a *= .5; f *= 2.03; } return s; }   // sivri sırtlar, vadiler
function fbm(x, z) { let s = 0, a = .5, f = 1; for (let o = 0; o < 4; o++) { s += vn(x * f, z * f) * a; a *= .5; f *= 2.1; } return s; }
const LAKE = { x: -470, z: -560, y: null };
function mhRaw(x, z) { let h = mhCore(x, z); const d = Math.hypot(x - LAKE.x, z - LAKE.z); if (d < 85) { if (LAKE.y == null) LAKE.y = mhCore(LAKE.x, LAKE.z) * .8; const floor = LAKE.y - 5 * Math.max(0, 1 - d / 38); h = d < 38 ? floor : floor + (h - floor) * sst(38, 85, d) * (h > floor ? 1 : 0) + (h <= floor ? h - floor : 0); } return h; }   // 🏞️ gölün çanağı
function mhCore(x, z) {
  const r = Math.hypot(x, z); let m = sst(505, 610, r); if (z > 250 && x > -640) m = 0; if (x > 250 && z > -430) m = 0; if (m <= 0) return 0;
  let env = 0; for (const [px, pz, pr, H] of PEAKS) { const d = Math.hypot(x - px, z - pz) / pr; if (d < 2) env = Math.max(env, H * Math.exp(-d * d * 1.25)); }
  const rg = ridged(x * .0042 + 11, z * .0042 + 7), hills = fbm(x * .011, z * .011);
  let h = env * (.55 + rg * .85) + 22 * hills + 6 * fbm(x * .05 + 3, z * .05);   // dağ gövdesi × sırtlar + tepecikler + pürüz
  { const d = Math.hypot(x - SUM.x, z - SUM.z); if (d < 70) { const top = SUM.top || 150; h = h > top ? top + (h - top) * sst(40, 70, d) : h; } }   // zirve düzlüğü
  return Math.max(0, h * m);
}
function inTunnel(x, z) { return Math.abs(z - TUN.z) < TUN.hw && x < TUN.x0 + 2 && x > TUN.x1 - 2; }
const RG = new Map(); let RGon = false;   // dağ yolu: arazi yolun altında düzleşir
function rgNear(x, z) { const cx = Math.floor(x / 8), cz = Math.floor(z / 8); let bd = 1e9, by = 0; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const L = RG.get((cx + i) + ',' + (cz + j)); if (!L) continue; for (const p of L) { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; by = p.y; } } } return [bd, by]; }
function mh(x, z) { let h = mhRaw(x, z); if (RGon && h > 0) { const [d, y] = rgNear(x, z); if (d < 9) h = d < 4.6 ? y - .05 : y - .05 + (h - y + .05) * sst(4.6, 9, d); } if (Math.abs(z - TUN.z) < TUN.hw + 2.5 && x < -290 && x > -1180 && h < 11) return 0; return h; }   // tünel ağzına giden yol kesiği

/* ---------- 🛣️ yollar: üst geçitler (katlı), tünel, dağ yolu ---------- */
const ROADS = [];   // { pts:[{x,z,y}], w, deck(bool) }
function addRoad(pts, w, deck) { const r = { pts, w, deck, len: 0, cum: [0] }; for (let i = 1; i < pts.length; i++) { r.len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); r.cum.push(r.len); } ROADS.push(r); return r; }
function roadAt(r, s, out) { s = Math.max(0, Math.min(r.len, s)); let i = 1; while (i < r.cum.length - 1 && r.cum[i] < s) i++; const a = r.pts[i - 1], b = r.pts[i], u = (s - r.cum[i - 1]) / Math.max(1e-6, r.cum[i] - r.cum[i - 1]); out.set(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u); out.dir = Math.atan2(b.x - a.x, b.z - a.z); return out; }
function dense(pts, step) { const out = []; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / step)); for (let k = 0; k < n; k++) { const u = k / n; out.push({ x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, y: a.y + (b.y - a.y) * u }); } } out.push(pts[pts.length - 1]); return out; }
function ease(pts) { for (let k = 0; k < 2; k++) for (let i = 1; i < pts.length - 1; i++) pts[i].y = (pts[i - 1].y + pts[i].y * 2 + pts[i + 1].y) / 4; return pts; }   // rampalar yumuşak başlar ve biter
const roadTex = canvasTex(128, 256, (g, w, h) => { g.fillStyle = '#2b2d31'; g.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .05})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } g.fillStyle = '#e9e5d6'; g.fillRect(4, 0, 4, h); g.fillRect(w - 8, 0, 4, h); g.fillStyle = '#f5c518'; g.fillRect(w / 2 - 3, 0, 2, h); g.fillRect(w / 2 + 1, 0, 2, h); g.fillStyle = '#e9e5d6'; for (const x of [w * .27, w * .73]) for (let y = 0; y < h; y += 64) g.fillRect(x - 1.5, y, 3, 34); });
roadTex.wrapS = roadTex.wrapT = T.RepeatWrapping;
function ribbon(pts, w, mat, yOff = 0, sideH = 0) {   // yol şeridi (pts zaten yoğun)
  const pos = [], uv = [], idx = []; let v = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1, nx = dz / L, nz = -dx / L, p = pts[i];
    if (i) v += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z) / (w * 2);
    const yl = p.yl != null ? p.yl : p.y, yr = p.yr != null ? p.yr : p.y;
    pos.push(p.x + nx * w / 2, yl + yOff, p.z + nz * w / 2, p.x - nx * w / 2, yr + yOff, p.z - nz * w / 2); uv.push(0, v, 1, v);
    if (i) { const o = (i - 1) * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); } }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = new T.Mesh(geo, mat); m.receiveShadow = true; return m;
}
function wallStrip(pts, off, h, mat) {   // köprü korkuluğu (beton duvar)
  const pos = [], idx = [];
  for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1, nx = dz / L * off, nz = -dx / L * off, p = pts[i];
    pos.push(p.x + nx, p.y, p.z + nz, p.x + nx, p.y + h, p.z + nz); if (i) { const o = (i - 1) * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); } }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); const m = new T.Mesh(geo, mat); m.material.side = T.DoubleSide; return m;
}

/* ---------- 🚗 daha kaliteli araba gövdesi: yuvarlatılmış profil, çamurluk kavisleri, eğimli ön cam ---------- */
const CD = { sedan: { L: 4.3, W: 1.86, bh: .58, by: .62, ch: .54, cl: 2.05, cz: -.2, wr: .36, wz: 1.36 }, hatch: { L: 3.9, W: 1.8, bh: .58, by: .62, ch: .58, cl: 2.0, cz: -.55, wr: .35, wz: 1.25 }, suv: { L: 4.6, W: 1.98, bh: .78, by: .8, ch: .62, cl: 2.6, cz: -.35, wr: .43, wz: 1.48 }, sport: { L: 4.4, W: 1.9, bh: .5, by: .55, ch: .42, cl: 1.7, cz: -.35, wr: .36, wz: 1.4 } };
const BODY = {};
function carProfile(t, lite) {
  const key = t + (lite ? 'L' : ''); if (BODY[key]) return BODY[key]; const D = CD[t], { L, W, bh, by, ch, cl, cz, wr, wz } = D, y0 = wr * .55, belt = by + bh / 2, roof = belt + ch, aR = wr + .07;
  const fz = L / 2, bz = -L / 2, wsB = cz + cl / 2 + (t === 'sport' ? .65 : .45), wsT = cz + cl / 2 - .12, rT = cz - cl / 2 + .22, rB = t === 'hatch' ? cz - cl / 2 - .05 : cz - cl / 2 - (t === 'sport' ? .6 : .38);
  const s = new T.Shape(); s.moveTo(bz + .25, y0);
  s.lineTo(-wz - aR, y0); s.absarc(-wz, y0, aR, Math.PI, 0, true); s.lineTo(wz - aR, y0); s.absarc(wz, y0, aR, Math.PI, 0, true); s.lineTo(fz - .25, y0);
  s.quadraticCurveTo(fz + .02, y0, fz, y0 + .25); s.quadraticCurveTo(fz, belt - .08, fz - .32, belt - .04);   // ön tampon ve burun
  s.lineTo(wsB, belt); s.lineTo(wsT, roof - .03); s.quadraticCurveTo(wsT - .1, roof, wsT - .25, roof); s.lineTo(rT + .2, roof); s.quadraticCurveTo(rT, roof, rT - .05, roof - .06);
  if (t === 'hatch') { s.lineTo(bz + .02, belt + .1); } else { s.lineTo(rB, belt + .01); s.lineTo(bz + .25, belt); }
  s.quadraticCurveTo(bz, belt - .02, bz, belt - .25); s.lineTo(bz, y0 + .2); s.quadraticCurveTo(bz, y0, bz + .25, y0);
  const body = new T.ExtrudeGeometry(s, lite ? { depth: W, bevelEnabled: false, curveSegments: 3 } : { depth: W - .12, bevelEnabled: true, bevelThickness: .06, bevelSize: .06, bevelSegments: 2, curveSegments: 8 }).translate(0, 0, -(lite ? W : W - .12) / 2).rotateY(-Math.PI / 2);
  const o = .018, g = new T.Shape(); g.moveTo(wsB - .06 + o, belt + .05); g.lineTo(wsT - .02 + o, roof - .07); g.lineTo(rT + .12 - o, roof - .07); if (t === 'hatch') g.lineTo(bz + .07 - o, belt + .14); else g.lineTo(rB + .06 - o, belt + .05); g.closePath();
  const glass = new T.ExtrudeGeometry(g, { depth: W - .02, bevelEnabled: false }).translate(0, 0, -(W - .02) / 2).rotateY(-Math.PI / 2);
  return BODY[key] = { body, glass, D, belt, roof };
}
const CMAT = { glass: new T.MeshStandardMaterial({ color: 0x14202c, roughness: .05, metalness: .6 }), tire: M(0x141416, { roughness: .9 }), rim: M(0xcfd5db, { metalness: .9, roughness: .25 }), dark: M(0x1c1f23, { roughness: .6 }), hl: new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d6, emissiveIntensity: .9 }), tl: new T.MeshStandardMaterial({ color: 0x5a0000, emissive: 0xff2020, emissiveIntensity: .7 }) };
const plateTex = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a3d9c'; g.fillRect(0, 0, 34, h); g.fillStyle = '#fff'; g.font = 'bold 18px system-ui'; g.fillText('TR', 5, 40); g.fillStyle = '#111'; g.font = '900 42px system-ui'; g.textAlign = 'center'; g.fillText('34 SFT 01', 145, 48); });
CMAT.plate = new T.MeshStandardMaterial({ map: plateTex, roughness: .5 });
const tireGeoL = new T.CylinderGeometry(1, 1, .26, 8).rotateZ(Math.PI / 2);
const hubGeo = (() => { const g = new T.CylinderGeometry(.21, .21, .04, 16).rotateZ(Math.PI / 2); return g; })(), tireGeo = new T.CylinderGeometry(1, 1, .26, 18).rotateZ(Math.PI / 2), spokeGeo = new T.BoxGeometry(.03, .36, .05);
function detailCar(g, D, paint, opts = {}) {
  if (opts.lite) { const { W, wr, wz } = D; for (const s of [-1, 1]) for (const zz of [-wz, wz]) { const tw = new T.Mesh(tireGeoL, CMAT.tire); tw.position.set(s * (W / 2 - .1), wr, zz); tw.scale.set(1, wr, wr); g.add(tw); } return; }   // aynalar, jantlar, kapı çizgileri, plakalar, tampon, anten
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m; }, { L, W, by, bh, wr, wz } = D, belt = by + bh / 2;
  for (const s of [-1, 1]) { const mir = add(new T.BoxGeometry(.14, .1, .2), paint, s * (W / 2 + .07), belt + .1, (D.cz + D.cl / 2) - .05); mir.rotation.y = s * .2;
    add(new T.BoxGeometry(.01, bh * .7, .01), CMAT.dark, s * (W / 2 + .005), by, D.cz + .1);   // kapı çizgisi
    add(new T.BoxGeometry(.04, .04, .16), CMAT.rim, s * (W / 2 + .01), belt - .1, D.cz + .45); add(new T.BoxGeometry(.04, .04, .16), CMAT.rim, s * (W / 2 + .01), belt - .1, D.cz - .5);   // kapı kolları
    if (opts.wheels) for (const zz of [-wz, wz]) { const tw = add(tireGeo, CMAT.tire, s * (W / 2 - .1), wr, zz); tw.scale.set(1, wr, wr); }
    for (const zz of [-wz, wz]) { add(hubGeo, CMAT.rim, s * (W / 2 + .005), wr, zz).scale.set(1, wr / .36, wr / .36); for (let k = 0; k < 5; k++) add(spokeGeo, CMAT.dark, s * (W / 2 + .03), wr, zz, k / 5 * Math.PI, 0, 0).scale.set(1, wr / .36, 1); } }
  for (const s of [-1, 1]) add(new T.BoxGeometry(.52, .12, .02), CMAT.plate, 0, wr + .12, s * (L / 2 + .07), 0, s > 0 ? 0 : Math.PI, 0);
  if (opts.lights) for (const s of [-1, 1]) { add(new T.BoxGeometry(.4, .12, .05), CMAT.hl, s * W * .33, belt - .15, L / 2 - .05); add(new T.BoxGeometry(.42, .1, .05), CMAT.tl, s * W * .33, belt - .1, -L / 2 + .04); }
  add(new T.CylinderGeometry(.008, .008, .5, 4), CMAT.dark, W * .3, D.by + bh / 2 + D.ch + .25, D.cz - D.cl / 2 + .3);
}
const PAINT = {};
function makeCar(col, t = pick(['sedan', 'sedan', 'hatch', 'suv', 'sport']), lite) {   // otopark / otoyol arabaları (park edilenler sade)
  const P = carProfile(t, lite), g = new T.Group(), paint = lite ? (PAINT[col] = PAINT[col] || new T.MeshStandardMaterial({ color: col, metalness: .55, roughness: .3 })) : new T.MeshStandardMaterial({ color: col, metalness: .55, roughness: .3 });
  g.add(new T.Mesh(P.body, paint), new T.Mesh(P.glass, CMAT.glass)); detailCar(g, P.D, paint, { wheels: true, lights: !lite, lite });
  g.children[0].castShadow = true; g.userData.paint = paint; return g;
}
function upgradeCityCars() {   // şehirdeki arabaların gövdesini yuvarlak profille değiştir
  for (const c of G.CITY.cars) { if (c.g.userData.kUp) continue; c.g.userData.kUp = true; const t = c.kind; if (!CD[t]) { detailCar(c.g, { L: 4.9, W: 2.0, bh: 1.55, by: 1.2, ch: 0, cl: 0, cz: 0, wr: .38, wz: 1.6 }, c.paint); continue; }
    const P = carProfile(t); for (const m of c.g.children) { if (!m.isMesh) continue; if (m.material === c.paint && m.geometry.type !== 'BoxGeometry') { m.geometry.dispose(); m.geometry = P.body.clone(); } else if (m.material && m.material.transparent && m.material.opacity === .8) { m.geometry.dispose(); m.geometry = P.glass.clone(); m.material = CMAT.glass; } else if (m.material && m.material.color && m.material.color.getHex() === 0xf2f2f2 && !m.material.map) { m.material.map = plateTex; m.material.needsUpdate = true; } }
    detailCar(c.g, P.D, c.paint); }
}

/* ---------- 🌃 Tokyo gibi animasyonlu, ışıklı reklam panoları ---------- */
const NIGHT = { value: 0 };
const AD_TXT = [['SFT', '#ffffff', 0xff2e88, 0x00e5ff], ['TAPIR KAHVE ☕', '#fff4e0', 0x6d3b1f, 0xffb74d], ['SFT MARKET', '#ffffff', 0xd50000, 0xffd600], ['NEON RAMEN 🍜', '#fff', 0xff1744, 0xff9100], ['UZAY TURU 🚀', '#e0f7ff', 0x311b92, 0x00b0ff],
  ['SÜPER DEV KOLA', '#fff', 0xb71c1c, 0xff5252], ['KOZMİK KÜRE 🔮', '#f3e5ff', 0x4a148c, 0xe040fb], ['ŞİMŞEK ENERJİ ⚡', '#111', 0xffea00, 0x00e5ff], ['BUZ GİBİ ❄️', '#003049', 0x80deea, 0xffffff], ['ATLANTİS TATİL 🌊', '#fff', 0x01579b, 0x26c6da],
  ['ÇÖP ADAM TV 📺', '#fff', 0x1b5e20, 0x76ff03], ['ROBO KOL 🤖', '#fff', 0x263238, 0xff6d00], ['DÖNER 🥙 7/24', '#fff', 0xbf360c, 0xffca28], ['SFT PLAZA', '#fff', 0x0d47a1, 0x40c4ff], ['PLEY 6 🎮', '#fff', 0x1a237e, 0x2979ff], ['GECE KULÜBÜ 🪩', '#fff', 0x880e4f, 0xff4081]];
const adVert = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const adFrag = `uniform sampler2D map; uniform float t, mode, ph, night; uniform vec3 c1, c2; varying vec2 vUv;
void main(){ vec2 uv = vUv; float tt = t + ph;
  vec3 bg = mix(c1, c2, 0.5 + 0.5 * sin(uv.x * 5.0 - tt * 1.7 + uv.y * 2.0));
  if (mode > 0.5 && mode < 1.5) uv.x = fract(uv.x + tt * 0.12);
  vec4 tx = texture2D(map, uv);
  float scan = 0.88 + 0.12 * sin(vUv.y * 180.0 + tt * 6.0);
  float spark = step(0.985, fract(sin(dot(floor(vUv * vec2(60.0, 24.0)), vec2(12.9898, 78.233)) + floor(tt * 6.0)) * 43758.5453));
  vec3 col = mix(bg * 0.75, tx.rgb * 1.25, tx.a) * scan + spark * 0.6;
  float bx = min(min(vUv.x, 1.0 - vUv.x) * 18.0, min(vUv.y, 1.0 - vUv.y) * 9.0);
  float bulbs = step(0.5, fract((vUv.x + vUv.y) * 14.0 - tt * 2.5));
  if (bx < 0.35) col = mix(vec3(1.0, 0.85, 0.4) * (0.4 + bulbs), c2 * 1.4, step(1.5, mode));
  float blink = mode > 2.5 ? 0.55 + 0.45 * step(0.35, fract(tt * 0.8)) : 1.0;
  if (mode > 3.5) { vec2 c = vUv - vec2(.25 + .1 * sin(tt * .9), .5); float rr = length(c * vec2(2., 1.)); float ring = smoothstep(.02, 0., abs(rr - .25 - .05 * sin(tt * 3.))); float burst = smoothstep(.35, 0., rr) * (.5 + .5 * sin(atan(c.y, c.x) * 12. + tt * 4.));
    col = mix(col, c2 * 1.6, ring) + c1 * burst * .6; }   // 🎬 animasyonlu ürün reklamı: dönen ışın patlaması
  gl_FragColor = vec4(col * blink * (1.15 + night * .9), 1.0); }`;
function adTex(text, fg, vert) { return canvasTex(vert ? 128 : 512, vert ? 512 : 192, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = fg; g.shadowBlur = 18;
  if (vert) { const ch = [...text.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü0-9 ]/g, '')].filter(c => c !== ' ').slice(0, 9); g.font = `900 ${Math.min(56, h / ch.length * .85)}px system-ui`; ch.forEach((c, i) => g.fillText(c, w / 2, (i + .5) * h / ch.length)); }
  else { let fs = 110; g.font = `900 ${fs}px system-ui`; while (g.measureText(text).width > w * .88 && fs > 30) { fs -= 6; g.font = `900 ${fs}px system-ui`; } g.fillText(text, w / 2, h / 2 + 4); } }); }
function adBoard(w, h, k, mode, vert) {
  const [tx, fg, c1, c2] = AD_TXT[k % AD_TXT.length], mat = new T.ShaderMaterial({ uniforms: { map: { value: adTex(tx, fg, vert) }, t: K.U.t, night: NIGHT, mode: { value: mode }, ph: { value: rr() * 20 }, c1: { value: new T.Color(c1) }, c2: { value: new T.Color(c2) } }, vertexShader: adVert, fragmentShader: adFrag, toneMapped: false, side: T.DoubleSide });
  const m = new T.Mesh(new T.PlaneGeometry(w, h), mat); K.boards.push(m); return m;
}
function cityBoards() {
  const B = G.CITY.bld, g = new T.Group(); K.g.add(g); let k = 0; const used = new Set();
  const cand = B.map((b, i) => [b, i]).filter(([b]) => !b[5] && !b.office && b[4] >= 14 && Math.hypot(b[0], b[1]) < 330).sort((a, b) => Math.hypot(a[0][0], a[0][1]) - Math.hypot(b[0][0], b[0][1]));
  for (const [b, i] of cand) { if (k >= 80) break; const [x, z, w, d, h] = b, faces = [[0, 1], [0, -1], [1, 0], [-1, 0]].sort(() => rr() - .5).slice(0, rr() < .4 ? 2 : 1);
    for (const [fx, fz] of faces) { const vert = rr() < .35, bw = vert ? 3.2 : Math.min(fx ? d : w, 16) * RR(.55, .85), bh = vert ? Math.min(16, h * .45) : bw * RR(.42, .6), y = vert ? h * RR(.45, .65) : h * RR(.55, .8);
      const m = adBoard(bw, bh, k++, (k % 5), vert); m.position.set(x + fx * (w / 2 + .12), Math.min(y, h - bh / 2 - .5), z + fz * (d / 2 + .12)); if (vert) m.position.x += fz ? RR(-w / 3, w / 3) : 0; m.rotation.y = Math.atan2(fx, fz); g.add(m); } }
  nightShow(g, B);
  // 🔤 çatıda kocaman SFT neonları (en yüksek kuleler)
  const tall = B.map((b, i) => [b, i]).filter(([b]) => !b[5] && b[4] > 40).sort((a, b) => b[0][4] - a[0][4]).slice(0, 4);
  const sftT = canvasTex(512, 220, (g2, w, h) => { g2.clearRect(0, 0, w, h); g2.font = '900 190px system-ui'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.shadowBlur = 30; g2.shadowColor = '#ff2e88'; g2.strokeStyle = '#ff7ac0'; g2.lineWidth = 10; g2.strokeText('SFT', w / 2, h / 2 + 8); g2.shadowColor = '#00e5ff'; g2.fillStyle = '#e8fdff'; g2.fillText('SFT', w / 2, h / 2 + 8); });
  for (const [b] of tall) { const s = new T.Mesh(new T.PlaneGeometry(b[2] * .9, b[2] * .39), new T.MeshBasicMaterial({ map: sftT, transparent: true, side: T.DoubleSide, toneMapped: false, depthWrite: false })); s.position.set(b[0], b[4] + b[2] * .25, b[1]); s.rotation.y = rr() * Math.PI; g.add(s); K.anim.push(t => { s.material.opacity = .82 + .18 * Math.sin(t * 9 + b[0]) * (Math.sin(t * .7 + b[1]) > .9 ? 1 : 0); s.rotation.y += .002; });
    const fr = new T.Mesh(new T.BoxGeometry(b[2] * .9, .4, .4), M(0x37474f, { metalness: .6 })); fr.position.set(b[0], b[4] + .2, b[1]); g.add(fr); }
}

/* ---------- 🌃 gece şöleni: neon kenar çizgileri, çatı panoları, ışık huzmeleri, ışık zincirleri, hologram ---------- */
const NEON = [0xff2e88, 0x00e5ff, 0xb388ff, 0xffea00, 0x76ff03, 0xff6d00, 0xff4081, 0x18ffff];
function nightShow(g, B) {
  const big = B.filter(b => !b[5] && b[4] >= 16 && Math.hypot(b[0], b[1]) < 360).sort((a, b) => b[4] - a[4]).slice(0, 70);
  // neon kenarlar: dikey köşeler + çatı çevresi
  const segs = []; big.forEach((b, i) => { const [x, z, w, d, h] = b, c = NEON[i % NEON.length], hx = w / 2 + .08, hz = d / 2 + .08; for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) segs.push([x + sx * hx, h / 2, z + sz * hz, .18, h, .18, c]); segs.push([x, h + .1, z + hz, w + .2, .18, .18, c], [x, h + .1, z - hz, w + .2, .18, .18, c], [x + hx, h + .1, z, .18, .18, d + .2, c], [x - hx, h + .1, z, .18, .18, d + .2, c]);
    if (i % 3 === 0) for (let y = 6; y < h - 2; y += 9) segs.push([x, y, z + hz, w + .2, .1, .1, c], [x, y, z - hz, w + .2, .1, .1, c]); });
  const nm = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), segs.length); const col = new T.Color();
  segs.forEach(([x, y, z, sx, sy, sz, c], i) => { dmy.position.set(x, y, z); dmy.rotation.set(0, 0, 0); dmy.scale.set(sx, sy, sz); dmy.updateMatrix(); nm.setMatrixAt(i, dmy.matrix); nm.setColorAt(i, col.setHex(c)); }); g.add(nm); K.neon = nm; K.neonBase = segs.map(s => s[6]);
  // çatı panoları (iskele üstünde, iki yüzlü, animasyonlu)
  let k = 40; big.slice(4, 30).forEach((b, i) => { const [x, z, w, d, h] = b, bw = Math.min(w, d) * 1.1, bh = bw * .45, ry = rr() * Math.PI, st = new T.Group(); st.position.set(x, h, z); st.rotation.y = ry; g.add(st);
    for (const s of [-1, 1]) { const p = new T.Mesh(new T.BoxGeometry(.25, bh * .8, .25), M(0x37474f, { metalness: .6 })); p.position.set(s * bw * .35, bh * .4, 0); st.add(p); }
    const f = adBoard(bw, bh, k++, 4 - (i % 3), false); f.position.y = bh * .8 + bh / 2; st.add(f); const bk = adBoard(bw, bh, k++, i % 4, false); bk.position.set(0, bh * .8 + bh / 2, -.1); bk.rotation.y = Math.PI; st.add(bk); });
  // dev LED ekran duvarları (Tokyo kavşağı gibi) — en büyük 6 binanın yan yüzleri
  big.slice(0, 6).forEach((b, i) => { const [x, z, w, d, h] = b, sw = Math.min(w, 26) * .95, sh = Math.min(h * .5, sw * .62), m = adBoard(sw, sh, 20 + i, 4, false); m.position.set(x, h * .55, z + d / 2 + .25); g.add(m); const m2 = adBoard(sw * .8, sh * .8, 26 + i, 4, false); m2.position.set(x + w / 2 + .25, h * .45, z); m2.rotation.y = Math.PI / 2; g.add(m2); });
  // ışık huzmeleri (gece gökyüzünü tarar)
  K.beams = []; big.slice(0, 8).forEach((b, i) => { const bm = new T.Mesh(new T.CylinderGeometry(1.2, 9, 260, 16, 1, true).translate(0, 130, 0), new T.MeshBasicMaterial({ color: NEON[(i * 3) % 8], transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false })); bm.position.set(b[0], b[4] + .5, b[1]); g.add(bm); K.beams.push({ m: bm, ph: i * 1.3 }); });
  // ışık zincirleri (caddeler boyunca sarkan renkli ampuller)
  const bulbs = []; for (let q = 0; q < 26; q++) { const n1 = G.CITY.nodes[(rr() * G.CITY.nodes.length) | 0], nb = (n1.nb || [])[0]; if (nb == null) continue; const n2 = G.CITY.nodes[nb]; for (let u = 0; u <= 1.001; u += .05) bulbs.push([n1.x + (n2.x - n1.x) * u, 7.5 - Math.sin(u * Math.PI) * 1.8, n1.z + (n2.z - n1.z) * u]); }
  const bl = new T.InstancedMesh(new T.SphereGeometry(.16, 6, 4), new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), bulbs.length); bulbs.forEach(([x, y, z], i) => { dmy.position.set(x, y, z); dmy.scale.setScalar(1); dmy.rotation.set(0, 0, 0); dmy.updateMatrix(); bl.setMatrixAt(i, dmy.matrix); bl.setColorAt(i, col.setHex(NEON[i % 8])); }); g.add(bl); K.bulbs = bl;
  // 🪐 meydanda dönen hologram
  const L = G.CITY.lots.plaza || { x: 0, z: 0 }, ho = new T.Group(); ho.position.set(L.x, 26, L.z); g.add(ho); K.holo = ho;
  const hm = c => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: .55, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, wireframe: true });
  ho.add(new T.Mesh(new T.IcosahedronGeometry(6, 2), hm(0x00e5ff))); const rg = new T.Mesh(new T.TorusGeometry(10, .25, 6, 60), hm(0xff2e88)); rg.rotation.x = 1.2; ho.add(rg); const rg2 = new T.Mesh(new T.TorusGeometry(13, .2, 6, 60), hm(0xffea00)); rg2.rotation.x = 1.9; ho.add(rg2);
  const tx = canvasTex(512, 160, (g2, w, h) => { g2.clearRect(0, 0, w, h); g2.font = '900 120px system-ui'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.shadowBlur = 25; g2.shadowColor = '#00e5ff'; g2.fillStyle = '#e0ffff'; g2.fillText('S.F.T', w / 2, h / 2); });
  const ts = new T.Sprite(new T.SpriteMaterial({ map: tx, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); ts.scale.set(18, 5.6, 1); ts.position.y = -9; ho.add(ts);
  const cone = new T.Mesh(new T.CylinderGeometry(.5, 5, 20, 20, 1, true).translate(0, -16, 0), new T.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: .12, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); ho.add(cone);
}
const poolMat = new T.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }), poolGeo = new T.CircleGeometry(5.5, 24).rotateX(-Math.PI / 2), headMat = new T.MeshBasicMaterial({ color: 0x555555, toneMapped: false });
function lampPost(x, z, y = 0, par) {   // 🏮 gece yanan lamba + yerde ışık halkası
  const g = new T.Group(); g.position.set(x, y, z); (par || K.g).add(g); const pole = new T.Mesh(new T.CylinderGeometry(.09, .12, 6, 6), M(0x37474f, { metalness: .6 })); pole.position.y = 3; const arm = new T.Mesh(new T.BoxGeometry(1.1, .08, .08), pole.material); arm.position.set(.5, 5.95, 0);
  const hd = new T.Mesh(new T.BoxGeometry(.7, .14, .35), headMat); hd.position.set(1, 5.85, 0); const pool = new T.Mesh(poolGeo, poolMat); pool.position.set(1, .06, 0); g.add(pole, arm, hd, pool); }
function nightTick(t, lit) {
  poolMat.opacity = lit * .35; headMat.color.setRGB(.33 + lit * .9, .33 + lit * .8, .33 + lit * .55);
  NIGHT.value = lit; if (K.neon) { K.neon.visible = lit > .05; if (K.neon.visible) { const col = new T.Color(); for (let i = 0; i < K.neon.count; i += 7) { const on = Math.sin(t * 2 + i * .37) > -.6 || lit < .5 ? 1 : .25; K.neon.setColorAt(i, col.setHex(K.neonBase[i]).multiplyScalar((.4 + lit * 1.4) * on)); } K.neon.instanceColor.needsUpdate = true; } }
  for (const b of K.beams || []) { b.m.material.opacity = lit * .16; b.m.visible = lit > .05; b.m.rotation.set(Math.sin(t * .4 + b.ph) * .45, 0, Math.cos(t * .33 + b.ph) * .45); }
  if (K.bulbs) { K.bulbs.visible = lit > .05; if (K.bulbs.visible && ((t * 4) | 0) % 2 !== K.bp) { K.bp = ((t * 4) | 0) % 2; const col = new T.Color(); for (let i = 0; i < K.bulbs.count; i++) K.bulbs.setColorAt(i, col.setHex(NEON[(i + K.bp) % 8]).multiplyScalar(.5 + lit)); K.bulbs.instanceColor.needsUpdate = true; } }
  if (K.holo) { K.holo.visible = lit > .2; K.holo.rotation.y = t * .3; K.holo.children[1].rotation.z = t * .8; K.holo.children[2].rotation.z = -t * .5; K.holo.position.y = 26 + Math.sin(t) * .8; }
}

/* ---------- 🧱 yardımcılar: kutu, engel, etiket ---------- */
function box(w, h, d, mat, x, y, z, par) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; (par || K.g).add(m); return m; }
function obsBox(x, z, hx, hz, top, y0, stand = false) { const A = CA(), o = { box: true, x: A.cx + x, z: A.cz + z, hx, hz, r: Math.hypot(hx, hz), h: stand ? top : Infinity, top, y0, tb: y0 || 0, stand, pass: false, cityB: true, kent: true }; K.obs.push(o); return o; }
function obsCyl(x, z, r, top) { const A = CA(), o = { x: A.cx + x, z: A.cz + z, r, h: Infinity, top, tb: 0, stand: false, pass: false, cityB: true, kent: true }; K.obs.push(o); return o; }
function label(text, bg, fg, w, h) { const t = canvasTex(512, 128, (g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.fillStyle = fg; g.font = '900 64px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = 64; while (g.measureText(text).width > W * .92 && fs > 20) { fs -= 4; g.font = `900 ${fs}px system-ui`; } g.fillText(text, W / 2, H / 2 + 3); }); return new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t, toneMapped: false, side: T.DoubleSide })); }
function stick(col, x, y, z, ry, par, pose) { const r = G.createStickman(col), h = new T.Group(); h.add(r.stick); h.position.set(x, y, z); h.rotation.y = ry || 0; (par || K.g).add(h); const n = { r, h, pose: pose || 'stand', ph: rr() * 6, home: new T.Vector3(x, y, z) }; K.npcs.push(n); return n; }
const VIV = [0xff3b30, 0xff9500, 0xffcc00, 0x34c759, 0x00c7be, 0x30b0ff, 0x007aff, 0x5856d6, 0xaf52de, 0xff2d55, 0xff6f61, 0x7bd148];
const viv = () => VIV[(rr() * VIV.length) | 0];
function deck(kind, d) { d.kind = kind; K.decks.push(d); return d; }   // yürünebilir katlar / rampalar

/* ---------- 🏗️ dünyayı kur ---------- */
function build() {
  if (K.built) return; K.built = true; const A = CA(); K.g.position.set(A.cx, 0, A.cz); G.scene.add(K.g);
  // tünel giriş / çıkış: koridor boyunca dağ 11 m'yi aşınca giriş, sonra yine 11 m'nin altına inince çıkış
  { let x = -300, inT = false; for (; x > -1180; x -= 2) { const h = Math.min(mhRaw(x, TUN.z - TUN.hw), mhRaw(x, TUN.z + TUN.hw), mhRaw(x, TUN.z)); if (!inT && h > 12) { TUN.x0 = x + 4; inT = true; } else if (inT && h < 11) { TUN.x1 = x - 4; break; } } if (!inT) TUN.x0 = -480; if (x <= -1180) TUN.x1 = -1170; }
  SUM.top = 0; { let mx = 0; for (let a = 0; a < 6.28; a += .5) mx = Math.max(mx, mhRaw(SUM.x + Math.cos(a) * 30, SUM.z + Math.sin(a) * 30)); SUM.top = Math.round(mx * .92); }
  mountainPts(); terrain(); highways(); tunnel(); mountainRoad(); villages(); park(); parkingLot(); market(); plaza(); garage(); cityBoards(); hubSign();
  try { upgradeCityCars(); } catch (e) { console.warn('kent cars', e); }
  for (const o of K.obs) { G.CITY.obs.push(o); if (G.CITY.obsIn) G.obstacles.push(o); }
}
function terrain() {
  const X0 = -1180, X1 = 680, Z0 = -1120, Z1 = 520, S = 7, nx = Math.round((X1 - X0) / S), nz = Math.round((Z1 - Z0) / S);
  const geo = new T.PlaneGeometry(X1 - X0, Z1 - Z0, nx, nz).rotateX(-Math.PI / 2).translate((X0 + X1) / 2, 0, (Z0 + Z1) / 2), p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new T.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), h = mh(x, z), hx = mh(x + 3, z) - mh(x - 3, z), hz = mh(x, z + 3) - mh(x, z - 3), sl = Math.min(1.2, Math.hypot(hx, hz) / 7);
    p.setY(i, h > .02 ? h : -1.2); const n = Math.sin(x * .3) * Math.cos(z * .27) * .04;
    const gr = fbm(x * .02, z * .02), sn = h + gr * 30 - sl * 40, rk = sl * (.35 + sst(40, 170, h) * .85) + (gr - .5) * .35;   // kar: yükseklik ve eğime göre · kaya: dik yamaçlar · çimen tonları: lekeli
    if (sn > 205) c.setRGB(.93 + n, .95 + n, .98); else if (sn > 188) c.setRGB(.74, .77, .8); else if (rk > .9) c.setRGB(.44 + n + gr * .1, .41 + n + gr * .08, .37 + n); else if (rk > .7) c.setRGB(.34 + n, .4 + n, .26 + gr * .05); else if (h > 150) c.setRGB(.42 + gr * .1, .5 + gr * .06, .32); else if (h < 1) c.setRGB(.3, .5, .24); else c.setRGB(.18 + gr * .18, .38 + gr * .2 + n, .15 + gr * .05); col.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const m = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: .95, flatShading: true })); m.receiveShadow = true; m.castShadow = false; K.g.add(m); K.terr = m;
  // 🌲 çam ağaçları
  const pts = []; for (let k = 0; k < 9000 && pts.length < 2200; k++) { const x = RR(X0, X1), z = RR(Z0, Z1), h = mh(x, z); if (h < 4 || h > 150 || inTunnel(x, z)) continue; const sl = Math.hypot(mh(x + 3, z) - mh(x - 3, z), mh(x, z + 3) - mh(x, z - 3)); if (sl > 6.5) continue; if (K.mroad && false) continue; if (Math.hypot(x - SUM.x, z - SUM.z) < 75) continue; pts.push([x, h, z, RR(.8, 1.6)]); }
  const cone = new T.InstancedMesh(new T.ConeGeometry(2.2, 7, 7), M(0x2e6b34, { flatShading: true }), pts.length), trunk = new T.InstancedMesh(new T.CylinderGeometry(.3, .4, 2, 5), M(0x5d4037), pts.length);
  pts.forEach(([x, y, z, s], i) => { dmy.position.set(x, y + 4.4 * s, z); dmy.scale.setScalar(s); dmy.rotation.set(0, 0, 0); dmy.updateMatrix(); cone.setMatrixAt(i, dmy.matrix); dmy.position.y = y + .9 * s; dmy.updateMatrix(); trunk.setMatrixAt(i, dmy.matrix); });
  K.g.add(cone, trunk);
  const rocks = []; for (let k = 0; k < 6000 && rocks.length < 700; k++) { const x = RR(X0, X1), z = RR(Z0, Z1), h = mh(x, z); if (h < 6 || inTunnel(x, z)) continue; const sl = Math.hypot(mh(x + 3, z) - mh(x - 3, z), mh(x, z + 3) - mh(x, z - 3)) / 6; if (sl < .45 && rr() > .08) continue; if (K.mP && rgNear(x, z)[0] < 9) continue; rocks.push([x, h, z, RR(1, 5.5)]); }
  const rk = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0), M(0x7d776f, { flatShading: true, roughness: 1 }), rocks.length); rocks.forEach(([x, y, z, s], i) => { dmy.position.set(x, y - s * .3, z); dmy.rotation.set(rr() * 3, rr() * 3, rr() * 3); dmy.scale.set(s, s * RR(.5, .9), s * RR(.7, 1.2)); dmy.updateMatrix(); rk.setMatrixAt(i, dmy.matrix); }); K.g.add(rk);
  const bush = []; for (let k = 0; k < 4000 && bush.length < 900; k++) { const x = RR(X0, X1), z = RR(Z0, Z1), h = mh(x, z); if (h < 1 || h > 120 || inTunnel(x, z)) continue; if (K.mP && rgNear(x, z)[0] < 6) continue; bush.push([x, h, z, RR(.6, 1.6)]); }
  const bm = new T.InstancedMesh(new T.IcosahedronGeometry(1, 0), M(0x3d6e2e, { flatShading: true }), bush.length); bush.forEach(([x, y, z, s], i) => { dmy.position.set(x, y + s * .3, z); dmy.rotation.set(0, rr() * 3, 0); dmy.scale.set(s * 1.3, s * .7, s); dmy.updateMatrix(); bm.setMatrixAt(i, dmy.matrix); bm.setColorAt(i, new T.Color().setHSL(.25 + rr() * .08, .45, .2 + rr() * .1)); }); K.g.add(bm);
  // 🏞️ dağ gölü (vadide)
  const lake = new T.Mesh(new T.CircleGeometry(38, 40).rotateX(-Math.PI / 2), new T.ShaderMaterial({ uniforms: { t: K.U.t }, transparent: true, vertexShader: 'varying vec3 w; void main(){ w = (modelMatrix * vec4(position,1.)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0); }',
    fragmentShader: 'uniform float t; varying vec3 w; void main(){ float r = sin(w.x * .35 + t * 1.3) * sin(w.z * .3 - t) * .5 + .5; vec3 c = mix(vec3(.08,.3,.42), vec3(.45,.75,.85), r * .5); gl_FragColor = vec4(c, .9); }' }));
  const LX = LAKE.x, LZ = LAKE.z; lake.position.set(LX, (LAKE.y || mh(LX, LZ)) - 1.2, LZ); K.g.add(lake); K.lake = { x: LX, z: LZ, y: lake.position.y };
}
function highways() {
  const conc = M(0xb0aca4, { roughness: .9 }), concD = M(0xa09c94, { roughness: .9, side: T.DoubleSide }), rmat = new T.MeshStandardMaterial({ map: roadTex, roughness: .85, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }), wallM = M(0xc8c4bb, { roughness: .9 });
  const mk = (raw, w, deckOn, pillarStep, name) => {
    const P = ease(dense(raw, 4)), r = addRoad(P, w, deckOn); r.name = name;
    const top = ribbon(P, w, rmat, .02), under = ribbon(P, w + .6, concD, -.6); K.g.add(top, under);
    const low = P.map(p => ({ x: p.x, z: p.z, y: p.y - .6 })); for (const s of [1, -1]) { K.g.add(wallStrip(low, s * (w / 2 + .3), 1.6, wallM)); K.g.add(wallStrip(P, s * (w / 2 + .05), 1, wallM)); }
    r.bb = [Math.min(...P.map(p => p.x)) - 10, Math.max(...P.map(p => p.x)) + 10, Math.min(...P.map(p => p.z)) - 10, Math.max(...P.map(p => p.z)) + 10];
    let acc = 0; for (let i = 1; i < P.length; i++) { acc += Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z); const p = P[i]; if (acc >= pillarStep && p.y > 3.5) { acc = 0; const pl = new T.Mesh(new T.CylinderGeometry(.9, 1.1, p.y - .6, 10), conc); pl.position.set(p.x, (p.y - .6) / 2, p.z); pl.castShadow = true; K.g.add(pl); obsCyl(p.x, p.z, 1.05, p.y - .6);
      const cap = new T.Mesh(new T.BoxGeometry(w + 1, .7, 1.6), conc); cap.position.set(p.x, p.y - .95, p.z); cap.rotation.y = Math.atan2(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z); K.g.add(cap);
      if (i % 3 === 0) { const lamp = new T.Group(); const pole = new T.Mesh(new T.CylinderGeometry(.08, .1, 5, 6), M(0x546e7a, { metalness: .6 })); pole.position.y = 2.5; const hd = new T.Mesh(new T.BoxGeometry(1.2, .15, .4), GLOW(0xfff4d0)); hd.position.set(0, 5, 0); lamp.add(pole, hd); lamp.position.set(p.x, p.y, p.z); K.g.add(lamp); } } }
    return r;
  };
  // A: şehrin kuzey kenarında 10 m'de, batıda yere inip tünele girer · B: üstünden 18 m'de geçen ikinci kat, şehrin içinde bir caddenin üstünden uzanır
  K.hwA = mk([{ x: 340, z: -300, y: 0 }, { x: 255, z: -300, y: 10 }, { x: -300, z: -300, y: 10 }, { x: -385, z: -300, y: 0 }, { x: TUN.x0 + 1, z: -300, y: 0 }], 12, true, 22, 'A');
  K.hwB = mk([{ x: -210, z: -520, y: 0 }, { x: -210, z: -430, y: 18 }, { x: -210, z: -300, y: 18 }, { x: -210, z: 210, y: 18 }, { x: -210, z: 298, y: 0 }], 10, true, 25, 'B');
  K.hwT = mk([{ x: TUN.x0, z: -300, y: 0 }, { x: TUN.x1, z: -300, y: 0 }, { x: Math.max(-1170, TUN.x1 - 60), z: -300, y: 0 }], 12, false, 1e9, 'T');
  const sgn = label('🛣️ SFT OTOYOLU · ' + adT('Tünel') + ' →', '#0b6b2e', '#ffffff', 9, 1.6); sgn.position.set(-150, 16.2, -300); sgn.rotation.y = Math.PI / 2; K.g.add(sgn);
  const s2 = label('⬆ ' + adT('Dağ Köyü') + ' · ⬇ ' + adT('Plaj'), '#0b6b2e', '#ffffff', 8, 1.5); s2.position.set(-210, 24, -280); K.g.add(s2);
  for (const z of [-292, -308]) { const gp = new T.Mesh(new T.BoxGeometry(.3, 5, .3), M(0x37474f)); gp.position.set(-150, 13.5, z); K.g.add(gp); }
  // 🚗 otoyol trafiği
  const lanes = [[K.hwA, 3, 1], [K.hwA, -3, -1], [K.hwA, 3, 1], [K.hwA, -3, -1], [K.hwA, 3, 1], [K.hwB, 2.3, 1], [K.hwB, -2.3, -1], [K.hwB, 2.3, 1], [K.hwT, 3, 1], [K.hwT, -3, -1]];
  lanes.forEach(([r, off, dir], i) => { const c = makeCar(viv()); c.scale.setScalar(1); K.g.add(c); K.cars.push({ g: c, r, off, dir, s: rr() * r.len, sp: RR(14, 20) }); });
}
function tunnel() {
  const L = TUN.x0 - TUN.x1, cx = (TUN.x0 + TUN.x1) / 2, R2 = TUN.hw + .6, g = new T.Group(); g.position.set(cx, 0, TUN.z); K.g.add(g);
  const tube = new T.Mesh(new T.CylinderGeometry(R2, R2, L, 20, 1, true, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2), M(0x8f8a82, { side: T.DoubleSide, roughness: .9 })); tube.position.y = 0; tube.scale.set(1, 1.08, 1); g.add(tube);
  const tile = M(0xe8e4da, { roughness: .6 }); for (const s of [-1, 1]) box(L, 2.2, .2, tile, 0, 1.1, s * (TUN.hw + .2), g);
  const lights = new T.InstancedMesh(new T.BoxGeometry(2.2, .12, .4), GLOW(0xffe9b0), Math.floor(L / 12) * 2); let k = 0;
  for (let x = -L / 2 + 6; x < L / 2 - 6 && k < lights.count - 1; x += 12) for (const s of [-1, 1]) { dmy.position.set(x, R2 * .95, s * 2.6); dmy.scale.setScalar(1); dmy.rotation.set(0, 0, 0); dmy.updateMatrix(); lights.setMatrixAt(k++, dmy.matrix); } lights.count = k; g.add(lights);
  const strip = new T.InstancedMesh(new T.BoxGeometry(1.5, .25, .05), GLOW(0x00e5ff), Math.floor(L / 9) * 2); k = 0; for (let x = -L / 2; x < L / 2 && k < strip.count - 1; x += 9) for (const s of [-1, 1]) { dmy.position.set(x, 1.6, s * (TUN.hw + .08)); dmy.updateMatrix(); strip.setMatrixAt(k++, dmy.matrix); } strip.count = k; g.add(strip);
  for (const ex of [TUN.x0, TUN.x1]) { const pg = new T.Group(); pg.position.set(ex, 0, TUN.z); K.g.add(pg); const sd = ex === TUN.x0 ? 1 : -1;
    const arch = new T.Mesh(new T.TorusGeometry(R2 + .6, .9, 8, 24, Math.PI).rotateY(Math.PI / 2), M(0x9e9a92)); arch.position.x = sd * .3; pg.add(arch);
    const face = new T.Mesh(new T.BoxGeometry(3, 6, 22), M(0x8a857c, { flatShading: true })); face.position.set(-sd * 1.2, R2 + 3.4, 0); pg.add(face);
    const lb = label(ex === TUN.x0 ? '🚇 SFT TÜNELİ' : '🚇 SFT TÜNELİ · ' + adT('Şehir') + ' →', '#263238', '#ffeb3b', 9, 1.4); lb.position.set(sd * 1.1, R2 + 2.4, 0); lb.rotation.y = sd > 0 ? Math.PI / 2 : -Math.PI / 2; pg.add(lb); }
  for (const s of [-1, 1]) obsBox((TUN.x0 + TUN.x1) / 2, TUN.z + s * (TUN.hw + .3), L / 2, .3, 6.5);
}
function mountainPts() {   // yol çizgisi araziden önce: arazi yolun altında düzleşsin
  const C = SUM, st = { x: 40, z: -500 }, r0 = Math.hypot(st.x - C.x, st.z - C.z), a0 = Math.atan2(st.z - C.z, st.x - C.x), pts = [];
  pts.push({ x: 40, z: -455, y: .05 });
  for (let t = 0; t <= 1.0001; t += .004) { const r = r0 * (1 - t) + 48 * t, a = a0 - t * Math.PI * 2 * 1.75, x = C.x + Math.cos(a) * r, z = C.z + Math.sin(a) * r; pts.push({ x, z, y: 0 }); }
  const P = dense(pts, 3.5); for (const p of P) p.y = mhRaw(p.x, p.z); for (let k = 0; k < 6; k++) for (let i = 1; i < P.length - 1; i++) P[i].y = (P[i - 1].y + P[i].y * 2 + P[i + 1].y) / 4;
  for (const p of P) { p.y = Math.max(.05, p.y); const key = Math.floor(p.x / 8) + ',' + Math.floor(p.z / 8); if (!RG.has(key)) RG.set(key, []); RG.get(key).push(p); } RGon = true; K.mP = P;
}
function mountainRoad() {   // 🏔️ zirvedeki köye kıvrıla kıvrıla çıkan dağ yolu
  const C = SUM;
  const P = K.mP, rmat = new T.MeshStandardMaterial({ map: roadTex, roughness: .85, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
  const m = ribbon(P, 7, rmat, .22); K.g.add(m); const sh = ribbon(P, 8.4, M(0x8d8270, { roughness: 1 }), .12); K.g.add(sh); K.mroad = addRoad(P, 7, false);
  const g1 = makeCar(0xff5252, 'suv'), g2 = makeCar(0x2979ff, 'hatch'); K.g.add(g1, g2); K.cars.push({ g: g1, r: K.mroad, off: 1.6, dir: 1, s: 30, sp: 9, ground: true }, { g: g2, r: K.mroad, off: -1.6, dir: -1, s: K.mroad.len * .6, sp: 8, ground: true });
  const s = label('🏔️ ' + adT('Dağ Köyü') + ' ↑', '#2e7d32', '#ffffff', 6, 1.3); s.position.set(40, 3.2, -452); K.g.add(s); const ps = new T.Mesh(new T.BoxGeometry(.2, 2.6, .2), M(0x555555)); ps.position.set(40, 1.3, -452.2); K.g.add(ps);
}
function villages() {   // 🏡 dağ üstü evler
  const V = G.HOUSE_VARIANTS || [], spots = [];
  for (let k = 0; k < 11; k++) { const a = k / 11 * Math.PI * 2 + .2, r = 22 + (k % 3) * 9; spots.push([SUM.x + Math.cos(a) * r, SUM.z + Math.sin(a) * r, a + Math.PI]); }
  if (K.mroad) for (let s = 80; s < K.mroad.len - 60; s += 95) { const p = roadAt(K.mroad, s, V1.clone()); const a = Math.atan2(p.z - SUM.z, p.x - SUM.x); spots.push([p.x + Math.cos(a) * 12, p.z + Math.sin(a) * 12, a + Math.PI]); }
  for (const [px, pz, k] of [[-640, -60, 0], [-560, -420, 0], [-280, -640, 0], [440, -600, 0], [-760, 230, 0]]) for (let j = 0; j < 2; j++) { const a = rr() * 6.28; spots.push([px + Math.cos(a) * 55, pz + Math.sin(a) * 55, a]); }
  spots.forEach(([x, z, ry], i) => { const y = Math.min(mh(x, z), mh(x + 3, z), mh(x - 3, z), mh(x, z + 3), mh(x, z - 3)); if (y < 3 && i >= 11) return; const v = i % Math.max(1, V.length); let h;
    try { h = G.staticPH('kh' + v, () => G.buildHouse(V[v])); } catch (e) { h = new T.Mesh(new T.BoxGeometry(6, 5, 6), M(0xe0d6c4)); }
    h.position.set(x, y - .3, z); h.rotation.y = ry; h.scale.setScalar(1.15); K.g.add(h); const base = new T.Mesh(new T.CylinderGeometry(5.2, 6, 3, 8), M(0x7a6e62, { flatShading: true })); base.position.set(x, y - 1.6, z); K.g.add(base); obsBox(x, z, 3.4, 3.4, y + 5); });
  const sg = label('🏡 ' + adT('DAĞ KÖYÜ') + ' · SFT', '#4e342e', '#fff3e0', 7, 1.4); sg.position.set(SUM.x, SUM.top + 4, SUM.z + 40); K.g.add(sg);
  for (let k = 0; k < 6; k++) stick(viv(), SUM.x + Math.cos(k) * 14, SUM.top, SUM.z + Math.sin(k) * 14, rr() * 6, null, k % 2 ? 'walk' : 'talk');
}

/* ---------- 🌳 fıskiyeli park ---------- */
const NW = 900, wPos = new Float32Array(NW * 3).fill(-1e5), wD = [...Array(NW)].map(() => ({ l: 0, v: new T.Vector3() })), wGeo = new T.BufferGeometry(); wGeo.setAttribute('position', new T.BufferAttribute(wPos, 3));
const wPts = new T.Points(wGeo, new T.PointsMaterial({ color: 0xcfefff, size: .32, transparent: true, opacity: .85, depthWrite: false })); wPts.frustumCulled = false;
let wI = 0; function wEmit(x, y, z, vx, vy, vz, l) { const i = wI = (wI + 1) % NW, d = wD[i]; d.l = l; d.v.set(vx, vy, vz); wPos[i * 3] = x; wPos[i * 3 + 1] = y; wPos[i * 3 + 2] = z; }
function fountain(x, z, r, jets) {
  const g = new T.Group(); g.position.set(x, 0, z); K.g.add(g); const st = M(0xd7d2c8, { roughness: .7 });
  const rim = new T.Mesh(new T.TorusGeometry(r, .35, 8, 40).rotateX(Math.PI / 2), st); rim.position.y = .6; g.add(rim); const wall = new T.Mesh(new T.CylinderGeometry(r, r, .6, 40, 1, true), st); wall.position.y = .3; g.add(wall);
  const water = new T.Mesh(new T.CircleGeometry(r - .1, 40).rotateX(-Math.PI / 2), new T.ShaderMaterial({ uniforms: { t: K.U.t }, transparent: true, vertexShader: 'varying vec2 p; void main(){ p = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float t; varying vec2 p; void main(){ float d = length(p); float w = 0.5 + 0.5 * sin(d * 5.0 - t * 4.0) * sin(p.x * 3.0 + t) ; vec3 c = mix(vec3(0.1, 0.45, 0.7), vec3(0.75, 0.95, 1.0), w * 0.6); gl_FragColor = vec4(c, 0.85); }' })); water.position.y = .45; g.add(water);
  const col = new T.Mesh(new T.CylinderGeometry(.35, .6, 1.8, 10), st); col.position.y = .9; g.add(col); const bowl = new T.Mesh(new T.CylinderGeometry(1.4, .5, .4, 16), st); bowl.position.y = 1.9; g.add(bowl);
  const lights = new T.Mesh(new T.TorusGeometry(r - .3, .06, 4, 40).rotateX(Math.PI / 2), GLOW(0x80deea)); lights.position.y = .5; g.add(lights);
  obsCyl(x, z, r + .3, .9); K.fount.push({ x, z, r, jets, ph: rr() * 6 });
}
function park() {
  const g = new T.Group(); K.g.add(g); const X0 = -255, X1 = -145, Z0 = -425, Z1 = -325, cx = (X0 + X1) / 2, cz = (Z0 + Z1) / 2;
  box(X1 - X0, .1, Z1 - Z0, M(0x5aa040, { roughness: 1 }), cx, .05, cz, g);
  const path = M(0xd9c9a3, { roughness: .95 }); box(X1 - X0, .12, 4, path, cx, .06, cz, g); box(4, .12, Z1 - Z0, path, -180, .06, cz, g); box(4, .12, Z1 - Z0, path, -235, .06, cz, g);
  fountain(-180, -375, 5.5, 8); fountain(-235, -345, 3, 4); fountain(-165, -410, 3, 4); K.g.add(wPts);
  const trees = []; for (let k = 0; k < 40; k++) { const x = RR(X0 + 4, X1 - 4), z = RR(Z0 + 4, Z1 - 4); if (Math.abs(z - cz) < 5 || Math.abs(x + 180) < 9 || Math.abs(x + 235) < 5 || Math.abs(x + 210) < 6) continue; trees.push([x, z, RR(.8, 1.3)]); }
  const tk = new T.InstancedMesh(new T.CylinderGeometry(.25, .35, 3, 6), M(0x6d4c41), trees.length), lf = new T.InstancedMesh(new T.IcosahedronGeometry(2.3, 0), M(0x4caf50, { flatShading: true }), trees.length), lf2 = new T.InstancedMesh(new T.IcosahedronGeometry(1.6, 0), M(0xffb7c5, { flatShading: true }), trees.length);
  trees.forEach(([x, z, s], i) => { dmy.rotation.set(0, i, 0); dmy.position.set(x, 1.5 * s, z); dmy.scale.setScalar(s); dmy.updateMatrix(); tk.setMatrixAt(i, dmy.matrix); dmy.position.y = 4.2 * s; dmy.updateMatrix(); lf.setMatrixAt(i, dmy.matrix); dmy.position.y = 5.4 * s; dmy.scale.setScalar(i % 3 ? 0 : s); dmy.updateMatrix(); lf2.setMatrixAt(i, dmy.matrix); obsCyl(x, z, .4, 3); });
  tk.castShadow = lf.castShadow = true; g.add(tk, lf, lf2);
  const fl = [0xff4081, 0xffd740, 0xe040fb, 0xff6e40, 0xffffff]; for (let k = 0; k < 8; k++) { const bx = RR(X0 + 8, X1 - 8), bz = RR(Z0 + 8, Z1 - 8); if (Math.abs(bz - cz) < 6) continue; box(4, .3, 2, M(0x5d4037), bx, .15, bz, g); for (let j = 0; j < 14; j++) { const f = new T.Mesh(new T.SphereGeometry(.18, 6, 4), M(fl[j % 5])); f.position.set(bx + RR(-1.8, 1.8), .45, bz + RR(-.8, .8)); g.add(f); } }
  const wood = M(0x8d6e63), iron = M(0x37474f, { metalness: .6 });
  [[-200, -371, 0], [-160, -371, 0], [-200, -379, Math.PI], [-160, -379, Math.PI], [-232, -360, Math.PI / 2], [-150, -350, -Math.PI / 2], [-250, -400, Math.PI / 2], [-190, -420, 0]].forEach(([x, z, ry], i) => {
    const b = new T.Group(); b.position.set(x, 0, z); b.rotation.y = ry; g.add(b); box(2, .1, .5, wood, 0, .5, 0, b); box(2, .5, .08, wood, 0, .85, -.22, b); for (const s of [-.85, .85]) box(.08, .5, .5, iron, s, .25, 0, b); obsBox(x, z, 1, 1, .6);
    if (i < 5) { const n = stick(viv(), x, 0, z, ry, null, 'sit'); n.h.position.set(x + Math.sin(ry) * .05, .02, z + Math.cos(ry) * .05); } });
  for (const [x, z] of [[-250, -372], [-220, -378], [-195, -372], [-165, -378], [-150, -372], [-182, -335], [-182, -415], [-237, -395], [-237, -335]]) lampPost(x, z, 0, g);
  for (let k = 0; k < 4; k++) { const n = stick(viv(), cx + RR(-30, 30), 0, cz, 0, null, 'stroll'); n.path = [[cx - 45, cz], [cx + 45, cz]]; n.pi = k % 2; n.sp = RR(1, 1.4); }
  const sg = label('🌳 SFT ' + adT('PARKI') + ' · ' + adT('Fıskiyeler'), '#2e7d32', '#ffffff', 8, 1.5); sg.position.set(cx, 3.2, Z1 + .2); g.add(sg); const ps = box(.25, 2.5, .25, iron, cx - 3.5, 1.25, Z1 + .1, g); const ps2 = box(.25, 2.5, .25, iron, cx + 3.5, 1.25, Z1 + .1, g);
}
function parkingLot() {   // 🅿️ marketin önündeki açık otopark
  const g = new T.Group(); K.g.add(g); box(84, .06, 22, M(0x34373b, { roughness: .95, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }), -90, .03, -347, g);
  const lm = M(0xf5f5f5); for (let k = 0; k <= 16; k++) { box(.15, .02, 5, lm, -130 + k * 5, .07, -340, g); box(.15, .02, 5, lm, -130 + k * 5, .07, -354, g); }
  for (let k = 0; k < 16; k++) { if (rr() < .3) continue; for (const [zz, ry] of [[-340, 0], [-354, Math.PI]]) { if (rr() < .4) continue; const c = makeCar(viv(), undefined, true); c.position.set(-127.5 + k * 5, 0, zz); c.rotation.y = ry; g.add(c); obsBox(-127.5 + k * 5, zz, 1, 2.2, 1.5); } }
  for (let k = 0; k < 5; k++) lampPost(-128 + k * 18, -347, 0, g);
  const p = label('🅿️ ' + adT('OTOPARK'), '#1565c0', '#ffffff', 4, 1.2); p.position.set(-134, 3, -347); p.rotation.y = Math.PI / 2; g.add(p);
}

/* ---------- 🛒 SFT Market (içine girilir) ---------- */
function market() {
  const cx = -90, cz = -388, W = 34, D = 22, H = 6, g = new T.Group(); g.position.set(cx, 0, cz); K.g.add(g); const roofG = new T.Group(); g.add(roofG);
  const wall = M(0xf5f1e8), glass = new T.MeshStandardMaterial({ color: 0x9fd6ff, transparent: true, opacity: .28, roughness: .05, metalness: .2, depthWrite: false }), frame = M(0x37474f, { metalness: .5 });
  box(W, .06, D, M(0xe9e5dc, { roughness: .4 }), 0, .03, 0, g);
  for (let x = -W / 2 + 1; x < W / 2; x += 2) box(.04, .01, D, M(0xd6d0c4), x, .065, 0, g);
  box(W, H, .4, wall, 0, H / 2, -D / 2, g); obsBox(cx, cz - D / 2, W / 2, .3, H);
  for (const s of [-1, 1]) { box(.4, H, D, wall, s * W / 2, H / 2, 0, g); obsBox(cx + s * W / 2, cz, .3, D / 2, H); }
  for (const [x0, x1] of [[-W / 2, -4], [4, W / 2]]) { const w = x1 - x0, mx = (x0 + x1) / 2; box(w, H - 1, .1, glass, mx, (H - 1) / 2, D / 2, g); box(w, 1, .4, wall, mx, H - .5, D / 2, g); for (let x = x0; x <= x1; x += 3) box(.12, H - 1, .14, frame, x, (H - 1) / 2, D / 2, g); obsBox(cx + mx, cz + D / 2, w / 2, .3, H); }
  box(8, 1, .4, wall, 0, H - .5, D / 2, g);
  const dl = box(4, H - 1, .08, glass, -2, (H - 1) / 2, D / 2 + .1, g), dr = box(4, H - 1, .08, glass, 2, (H - 1) / 2, D / 2 + .1, g); K.doors.push({ l: dl, r: dr, x: cx, z: cz + D / 2, k: 0, w: 2 });
  const roof = box(W + .4, .4, D + .4, M(0xcfd8dc), 0, H + .2, 0, roofG); for (let x = -12; x <= 12; x += 6) for (let z = -7; z <= 7; z += 7) box(3, .05, .6, GLOW(0xffffff), x, H - .05, z, roofG);
  for (const x of [-14, 14]) lampPost(x, D / 2 + 3.5, 0, g);
  const sign = label('🛒 SFT MARKET', '#d50000', '#ffffff', 14, 2.2); sign.position.set(0, H + 1.5, D / 2 + .3); g.add(sign); K.boards.push(sign);
  const aw = box(W, .15, 2.4, M(0xd50000), 0, H - .7, D / 2 + 1.2, g); aw.rotation.x = .12;
  K.cut.push({ x: cx, z: cz, hx: W / 2, hz: D / 2, hide: [roofG], ymax: 99 });
  // 🧃 raflar ve ürünler
  const shelfM = M(0xeceff1, { metalness: .2 }), prodCols = [0xe53935, 0xfdd835, 0x43a047, 0x1e88e5, 0xfb8c00, 0x8e24aa, 0xffffff, 0x6d4c41, 0x00acc1];
  const prods = new T.InstancedMesh(new T.BoxGeometry(.32, .38, .26), M(0xffffff, { roughness: .5 }), 3 * 2 * 3 * 50); let pi = 0; const col = new T.Color();
  for (const z of [-6, -1.5, 3]) { box(20, 2.2, .7, shelfM, -2, 1.1, z, g); obsBox(cx - 2, cz + z, 10, .6, 2.2); box(20, .1, 1.3, shelfM, -2, 2.25, z, g); for (const lv of [.45, 1.15, 1.85]) box(20, .04, 1.3, M(0xcfd8dc, { metalness: .4 }), -2, lv, z, g);
    for (const lv of [.45, 1.15, 1.85]) for (const s of [-1, 1]) for (let k = 0; k < 50 && pi < prods.count; k++) { dmy.position.set(-11.6 + k * .39, lv + .21, z + s * .5); dmy.rotation.set(0, 0, 0); dmy.scale.set(1, .7 + (k * 7 % 5) * .1, 1); dmy.updateMatrix(); prods.setMatrixAt(pi, dmy.matrix); prods.setColorAt(pi++, col.setHex(prodCols[(k + Math.round(lv * 10) + (z | 0)) % prodCols.length])); } }
  prods.count = pi; g.add(prods);
  for (let x = -14; x <= 14; x += 3.5) { box(3.2, 2.4, .9, M(0xb0bec5, { metalness: .3 }), x, 1.2, -D / 2 + .7, g); const fg = box(3, 2, .05, new T.MeshStandardMaterial({ color: 0xe1f5fe, emissive: 0x80d8ff, emissiveIntensity: .45, transparent: true, opacity: .7 }), x, 1.25, -D / 2 + 1.17, g); }
  obsBox(cx, cz - D / 2 + .7, 16, .5, 2.4);
  const veg = [0xff7043, 0x7cb342, 0xffee58, 0xe53935, 0xff9800]; for (let k = 0; k < 4; k++) { const z = -6 + k * 3; box(2.4, .9, 1.4, M(0x8d6e63), 13.5, .45, z, g); obsBox(cx + 13.5, cz + z, 1.2, .7, .9); for (let j = 0; j < 16; j++) { const f = new T.Mesh(new T.SphereGeometry(.14, 6, 5), M(veg[(k + j) % 5])); f.position.set(13.5 + RR(-1, 1), 1, z + RR(-.55, .55)); g.add(f); } }
  for (const x of [-12, -7, -2]) { box(2.6, .9, .8, M(0x455a64), x, .45, 7, g); box(2.4, .05, .5, M(0x212121), x, .92, 7, g); obsBox(cx + x, cz + 7, 1.3, .45, .9); stick(viv(), x + .4, 0, 7.9, Math.PI, g, 'cashier'); const lt = box(.3, .3, .3, GLOW(0x76ff03), x + 1.1, 1.6, 7, g); }
  for (let k = 0; k < 6; k++) { const ct = cart(); ct.position.set(10 + (k % 3) * .7, 0, 8.5 + (k / 3 | 0) * 1.4); g.add(ct); }
  // 🧍 alışveriş yapanlar: sepetli / arabalı, rafların arasında dolaşır
  const loop = [[-14, 9.5], [-14, -3.8], [10, -3.8], [10, .8], [-14, .8], [-14, 5.2], [10, 5.2], [10, 9.5]];
  for (let k = 0; k < 6; k++) { const n = stick(viv(), loop[k][0], 0, loop[k][1], 0, g, 'shop'); n.path = loop; n.pi = k; n.sp = RR(.9, 1.3); if (k % 2) { n.cart = cart(); g.add(n.cart); } else bag(n); }
  stick(0x43a047, 6, 0, -8, 0, g, 'stock');
}
function cart() { const g = new T.Group(), m = M(0xb0bec5, { metalness: .7, roughness: .3 }), r = M(0xd50000); const b = new T.Mesh(new T.BoxGeometry(.6, .45, .9), new T.MeshStandardMaterial({ color: 0xcfd8dc, metalness: .6, wireframe: true })); b.position.y = .75; g.add(b); const h = new T.Mesh(new T.BoxGeometry(.6, .05, .05), r); h.position.set(0, 1.05, -.5); g.add(h); for (const [x, z] of [[-.25, -.35], [.25, -.35], [-.25, .35], [.25, .35]]) { const w = new T.Mesh(new T.CylinderGeometry(.06, .06, .04, 8).rotateZ(Math.PI / 2), m); w.position.set(x, .06, z); g.add(w); } const it = new T.Mesh(new T.BoxGeometry(.4, .25, .5), M(pick([0xff7043, 0x42a5f5, 0x66bb6a]))); it.position.y = .72; g.add(it); return g; }
function bag(n) { const b = new T.Mesh(new T.BoxGeometry(.22, .3, .1), M(pick([0xfff3e0, 0xffcdd2, 0xc8e6c9, 0xbbdefb]))); b.position.set(0, -.5, 0); n.r.armR.el.add(b); }

/* ---------- 🏢 SFT Plaza: lobi, Tapır Kahve, açık ofis (içine girilir, iki kat) ---------- */
const PL = { cx: 70, cz: -392, W: 38, D: 28, F2: 4.5, st: { x0: -18.6, x1: -15.4, z0: 10, z1: -2 } };
function plaza() {
  const { cx, cz, W, D, F2 } = PL, g = new T.Group(); g.position.set(cx, 0, cz); K.g.add(g); const f2G = new T.Group(), topG = new T.Group(); g.add(f2G, topG);
  const glass = new T.MeshStandardMaterial({ color: 0x8ecae6, transparent: true, opacity: .3, roughness: .05, metalness: .4, depthWrite: false }), frame = M(0x263238, { metalness: .6, roughness: .35 }), slab = M(0xe0e0e0);
  box(W, .06, D, M(0xf3efe7, { roughness: .3 }), 0, .03, 0, g);
  // dış cam cephe (zemin kat: ön tarafta kapı)
  const facade = (y0, h, par, door) => { for (const [x0, x1, z, rot] of [[-W / 2, W / 2, -D / 2, 0], [-W / 2, W / 2, D / 2, 0], [-D / 2, D / 2, -W / 2, 1], [-D / 2, D / 2, W / 2, 1]]) { const segs = door && z === D / 2 && !rot ? [[x0, -4], [4, x1]] : [[x0, x1]];
      for (const [a, b] of segs) { const w = b - a, m = (a + b) / 2; const gm = box(rot ? .1 : w, h, rot ? w : .1, glass, rot ? z : m, y0 + h / 2, rot ? m : z, par); for (let q = a; q <= b + .01; q += 3.2) box(.14, h, .14, frame, rot ? z : q, y0 + h / 2, rot ? q : z, par);
        obsBox(cx + (rot ? z : m), cz + (rot ? m : z), rot ? .25 : w / 2, rot ? w / 2 : .25, y0 + h, y0 > 0 ? y0 : undefined); } } };
  facade(0, F2, g, true); box(8, .6, .3, frame, 0, F2 - .3, D / 2, g);
  { const s = PL.st, X = W / 2 + .15, Z = D / 2 + .15; box(X - s.x1, .3, 2 * Z, slab, (s.x1 + X) / 2, F2 - .15, 0, f2G); box(s.x1 + X, .3, Z + s.z1, slab, (-X + s.x1) / 2, F2 - .15, (-Z + s.z1) / 2, f2G); box(s.x1 + X, .3, Z - s.z0, slab, (-X + s.x1) / 2, F2 - .15, (s.z0 + Z) / 2, f2G); }   // 2. kat zemini (merdiven boşluğu açık)
  facade(F2, 4.2, f2G, false);
  // üst katlar (dıştan): koyu cam kule, kat çizgileri, ışıklı pencereler
  const towerM = new T.MeshStandardMaterial({ color: 0x1b2a3a, metalness: .7, roughness: .15, emissive: 0x102030, emissiveIntensity: .3 });
  const tw = box(W, 18, D, towerM, 0, F2 + 4.2 + 9, 0, topG); for (let y = F2 + 4.2; y < F2 + 22.3; y += 3.6) box(W + .3, .25, D + .3, frame, 0, y, 0, topG);
  const winT = canvasTex(256, 256, (g2, w, h) => { g2.fillStyle = '#0d1b2a'; g2.fillRect(0, 0, w, h); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g2.fillStyle = Math.random() < .55 ? `hsl(${45 + Math.random() * 15},90%,${60 + Math.random() * 25}%)` : '#1c3550'; g2.fillRect(x * 32 + 3, y * 32 + 5, 26, 20); } });
  for (const [x, z, ry, w] of [[0, D / 2 + .02, 0, W], [0, -D / 2 - .02, Math.PI, W], [W / 2 + .02, 0, Math.PI / 2, D], [-W / 2 - .02, 0, -Math.PI / 2, D]]) { const p = new T.Mesh(new T.PlaneGeometry(w, 18), new T.MeshBasicMaterial({ map: winT, transparent: true, opacity: .55, toneMapped: false })); winT.wrapS = winT.wrapT = T.RepeatWrapping; p.position.set(x, F2 + 4.2 + 9, z); p.rotation.y = ry; topG.add(p); }
  box(W + .6, .5, D + .6, frame, 0, F2 + 22.45, 0, topG);
  const logo = adBoard(16, 7, 0, 3, false); logo.position.set(0, F2 + 27, D / 2 - 2); topG.add(logo); const logo2 = adBoard(16, 7, 0, 3, false); logo2.position.set(0, F2 + 27, -D / 2 + 2); logo2.rotation.y = Math.PI; topG.add(logo2);
  const scr = adBoard(10, 5.6, 13, 0, false); scr.position.set(W / 2 + .3, F2 + 12, 0); scr.rotation.y = Math.PI / 2; topG.add(scr);
  for (const x of [-14, -7, 7, 14]) lampPost(x, D / 2 + 4, 0, g);
  const ent = label('SFT PLAZA', '#0d47a1', '#ffffff', 10, 1.6); ent.position.set(0, F2 + .8, D / 2 + .25); g.add(ent);
  K.cut.push({ x: cx, z: cz, hx: W / 2, hz: D / 2, hide: [topG], ymax: 99 }, { x: cx, z: cz, hx: W / 2, hz: D / 2, hide: [f2G], ymax: F2 - 1.2 });
  // 🪜 merdiven (batı duvarı boyunca)
  const { x0, x1, z0, z1 } = PL.st, stG = new T.Group(); g.add(stG); const stepM = M(0xbdbdbd);
  for (let k = 0; k < 15; k++) { const u = k / 15; box(x1 - x0, .3, .82, stepM, (x0 + x1) / 2, F2 * u + .15, z0 + (z1 - z0) * u, stG); }
  box(.08, 1, Math.abs(z1 - z0) + 1, frame, x1 + .05, F2 / 2 + .5, (z0 + z1) / 2, stG).rotation.x = Math.atan2(F2, z0 - z1);
  // 🛎️ lobi: resepsiyon, koltuklar, bitkiler, turnikeler, duvarda SFT
  const wood = M(0x8d6e63), white = M(0xfafafa), sofaM = M(0x37474f);
  box(7, 1.1, 1.2, white, -4, .55, 5, g); box(7.2, .1, 1.4, wood, -4, 1.15, 5, g); obsBox(cx - 4, cz + 5, 3.6, .7, 1.2); stick(0xec407a, -4, 0, 4, 0, g, 'desk');
  const wl = adBoard(12, 3.2, 0, 2, false); wl.position.set(0, 2.4, -D / 2 + .25); g.add(wl);
  for (const [x, z, ry] of [[-10, 0, Math.PI / 2], [-10, -5, Math.PI / 2]]) { box(1, .45, 3, sofaM, x, .3, z, g); box(.3, .8, 3, sofaM, x - .5, .6, z, g); obsBox(cx + x, cz + z, .6, 1.5, .7); }
  stick(0xff9800, -10, .05, -.6, Math.PI / 2, g, 'sit'); stick(0x7e57c2, -10, .05, -5.2, Math.PI / 2, g, 'phone');
  for (const [x, z] of [[-17, -12], [17, -12], [-7, 12], [7, 12], [-17, 12]]) { const p = new T.Mesh(new T.CylinderGeometry(.4, .3, .7, 10), M(0xeeeeee)); p.position.set(x, .35, z); g.add(p); const l = new T.Mesh(new T.IcosahedronGeometry(.8, 0), M(0x388e3c, { flatShading: true })); l.position.set(x, 1.4, z); g.add(l); }
  for (let x = -6; x <= 4; x += 2.5) { box(.25, 1, 1, M(0x90a4ae, { metalness: .6 }), x, .5, -1, g); box(.05, .4, 1, GLOW(0x00e676), x, 1.05, -1, g); }
  for (const x of [-13, -10, -7]) { box(2.2, 3.2, .1, M(0xb0bec5, { metalness: .8, roughness: .2 }), x, 1.6, -D / 2 + .3, g); box(.2, .2, .05, GLOW(0xffab00), x, 3.4, -D / 2 + .32, g); }
  // ☕ Tapır Kahve
  const tapir = canvasTex(512, 256, (g2, w, h) => { g2.fillStyle = '#3e2723'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#ffcc80'; g2.beginPath(); g2.ellipse(110, 128, 70, 52, 0, 0, 7); g2.fill(); g2.beginPath(); g2.ellipse(40, 145, 34, 18, -.3, 0, 7); g2.fill(); g2.fillStyle = '#3e2723'; g2.beginPath(); g2.arc(120, 112, 9, 0, 7); g2.fill(); g2.fillStyle = '#ffcc80'; g2.beginPath(); g2.ellipse(150, 78, 16, 24, .3, 0, 7); g2.fill(); g2.fillStyle = '#fff3e0'; g2.font = '900 64px system-ui'; g2.fillText('TAPIR', 200, 115); g2.font = '700 48px system-ui'; g2.fillText('KAHVE ☕', 205, 175); });
  const tk = new T.Mesh(new T.PlaneGeometry(6, 3), new T.MeshBasicMaterial({ map: tapir, toneMapped: false })); tk.position.set(13, 3, -D / 2 + .25); g.add(tk);
  const tko = new T.Mesh(new T.PlaneGeometry(5, 2.5), new T.MeshBasicMaterial({ map: tapir, toneMapped: false, side: T.DoubleSide })); tko.position.set(W / 2 + .2, 3.2, 8); tko.rotation.y = Math.PI / 2; g.add(tko);
  box(10, 1.1, 1, M(0x5d4037), 13, .55, -9, g); box(10.2, .08, 1.2, M(0xfff8e1), 13, 1.12, -9, g); obsBox(cx + 13, cz - 9, 5, .6, 1.2);
  box(1, .8, .6, M(0x9e9e9e, { metalness: .8 }), 10, 1.55, -9.2, g); box(1.6, .6, .7, new T.MeshStandardMaterial({ color: 0xfff3e0, emissive: 0xffcc80, emissiveIntensity: .4, transparent: true, opacity: .8 }), 15, 1.45, -9, g);
  const menu = label('☕ ' + adT('Latte · Mocha · Tapır Special'), '#212121', '#ffe0b2', 7, 1); menu.position.set(13, 4, -D / 2 + .28); g.add(menu);
  stick(0x6d4c41, 13, 0, -10, 0, g, 'barista'); stick(viv(), 12, 0, -7.6, Math.PI, g, 'queue'); stick(viv(), 12.2, 0, -6.4, Math.PI, g, 'phone');
  for (const [x, z] of [[9, -3], [15, -3], [9, 3], [15, 3], [12, 8]]) { const t = new T.Mesh(new T.CylinderGeometry(.6, .6, .05, 14), wood); t.position.set(x, .75, z); g.add(t); const lg = new T.Mesh(new T.CylinderGeometry(.06, .06, .75, 6), M(0x212121)); lg.position.set(x, .37, z); g.add(lg); obsCyl(x, z, .65, .8);
    for (const s of [-1, 1]) { const ch = stick(viv(), x + s * 1.05, .02, z, s > 0 ? -Math.PI / 2 : Math.PI / 2, g, 'coffee'); const cup = new T.Mesh(new T.CylinderGeometry(.06, .05, .12, 8), M(0xffffff)); cup.position.set(x + s * .4, .84, z); g.add(cup); } }
  // 💻 2. kat: açık ofis (bilgisayar başındakiler, boş yapanlar, toplantı odası)
  const deskM = M(0xfafafa), legM = M(0x546e7a), chairM = M(0x263238);
  const codeT = canvasTex(256, 160, (g2, w, h) => { g2.fillStyle = '#1e1e2e'; g2.fillRect(0, 0, w, h); const c = ['#89b4fa', '#a6e3a1', '#f9e2af', '#f38ba8', '#cba6f7']; for (let y = 10; y < h; y += 12) { let x = 8 + (y * 7 % 30); for (let k = 0; k < 4; k++) { g2.fillStyle = c[(y + k) % 5]; const L = 14 + (y * k * 13) % 40; g2.fillRect(x, y, L, 6); x += L + 6; } } });
  const graphT = canvasTex(256, 160, (g2, w, h) => { g2.fillStyle = '#fff'; g2.fillRect(0, 0, w, h); g2.strokeStyle = '#1e88e5'; g2.lineWidth = 5; g2.beginPath(); g2.moveTo(10, 140); for (let x = 10; x < w; x += 20) g2.lineTo(x, 140 - x * .45 - Math.sin(x) * 12); g2.stroke(); g2.fillStyle = '#43a047'; for (let k = 0; k < 6; k++) g2.fillRect(20 + k * 38, 150 - k * 15 - 20, 22, k * 15 + 20); });
  const gameT = canvasTex(256, 160, (g2, w, h) => { g2.fillStyle = '#4fc3f7'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#66bb6a'; g2.fillRect(0, 115, w, 45); g2.fillStyle = '#ff7043'; g2.fillRect(60, 90, 20, 25); g2.fillStyle = '#fff'; g2.font = 'bold 22px system-ui'; g2.fillText('SFT 2', 160, 30); g2.fillStyle = '#ffd54f'; for (let k = 0; k < 5; k++) { g2.beginPath(); g2.arc(110 + k * 25, 80, 7, 0, 7); g2.fill(); } });
  const scrM = [codeT, graphT, codeT, codeT].map(t => new T.MeshBasicMaterial({ map: t, toneMapped: false })), gameM = new T.MeshBasicMaterial({ map: gameT, toneMapped: false });
  let di = 0;
  for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) { const x = -8 + col * 6.2, z = -6 + row * 6.2; const dg = new T.Group(); dg.position.set(x, F2, z); f2G.add(dg);
    box(2.8, .06, 1.1, deskM, 0, .75, 0, dg); for (const s of [-1.3, 1.3]) box(.06, .75, 1, legM, s, .375, 0, dg); obsBox(cx + x, cz + z, 1.4, .55, F2 + .8, F2);
    for (const s of [-.65, .65]) { box(.7, .45, .04, M(0x111111), s, 1.15, -.35, dg); const sc = new T.Mesh(new T.PlaneGeometry(.64, .38), di === 7 && s > 0 ? gameM : scrM[(di + (s > 0 ? 1 : 0)) % 4]); sc.position.set(s, 1.15, -.325); dg.add(sc); box(.06, .25, .06, legM, s, .9, -.35, dg); box(.45, .02, .15, M(0x424242), s, .79, 0, dg); }
    const roles = ['type', 'type', 'type', 'sleep', 'type', 'type', 'game', 'type', 'type', 'type', 'phone', 'type'];
    for (const s of [-.65, .65]) { const role = s < 0 ? roles[di] : 'type'; if (s > 0 && di % 3 === 1) continue; box(.5, .08, .5, chairM, s, .48, .55, dg); const n = stick(viv(), x + s, F2 + .02, z + .62, Math.PI, f2G, role); } di++; }
  const pp = new T.Group(); pp.position.set(13, F2, 9); f2G.add(pp); box(2.7, .08, 1.5, M(0x1565c0), 0, .76, 0, pp); box(.04, .15, 1.5, M(0xffffff), 0, .87, 0, pp); for (const [x, z] of [[-1.2, -.6], [1.2, -.6], [-1.2, .6], [1.2, .6]]) box(.06, .76, .06, legM, x, .38, z, pp); obsBox(cx + 13, cz + 9, 1.4, .8, F2 + .9, F2);
  const ball = new T.Mesh(new T.SphereGeometry(.05, 8, 6), M(0xffffff)); pp.add(ball); K.anim.push(t => { const u = (Math.sin(t * 3) + 1) / 2; ball.position.set(-1.1 + u * 2.2, .95 + Math.abs(Math.sin(t * 6)) * .3, Math.sin(t * 1.7) * .3); });
  stick(viv(), 13 - 1.9, F2, 9, Math.PI / 2, f2G, 'pong'); stick(viv(), 13 + 1.9, F2, 9, -Math.PI / 2, f2G, 'pong');
  for (const [x, z, c] of [[16, -11, 0xff7043], [14.6, -11.6, 0x7e57c2]]) { const bb = new T.Mesh(new T.SphereGeometry(.7, 10, 8), M(c)); bb.scale.set(1, .6, 1); bb.position.set(x, F2 + .35, z); f2G.add(bb); }
  stick(viv(), 16, F2 + .5, -11, -2.4, f2G, 'lazy');
  box(.5, 1.3, .5, M(0x90caf9), -16, F2 + .65, -12, f2G); stick(viv(), -15, F2, -11.2, 2.4, f2G, 'talk'); stick(viv(), -16.6, F2, -10.5, 2.0, f2G, 'talk');
  for (const [w, x, z, rot] of [[10, -9, -8, 0], [6, -4, -11, 1]]) { box(rot ? .08 : w, 3.6, rot ? w : .08, glass, x, F2 + 1.8, z, f2G); obsBox(cx + x, cz + z, rot ? .1 : w / 2, rot ? w / 2 : .1, F2 + 3.6, F2); }
  box(5, .06, 1.8, wood, -9, F2 + .75, -11.4, f2G); obsBox(cx - 9, cz - 11.4, 2.5, .9, F2 + .8, F2); const wb = label('📈 SFT 2027 ' + adT('HEDEFLER') + ': ' + adT('Ay\'a şube!'), '#ffffff', '#1565c0', 4.5, 1.6); wb.position.set(-9, F2 + 1.9, -13.75); f2G.add(wb);
  for (const [x, z, ry] of [[-11, -10.8, Math.PI], [-7, -10.8, Math.PI], [-11, -12.1, 0], [-7, -12.1, 0], [-12.3, -11.4, Math.PI / 2]]) stick(viv(), x, F2, z, ry, f2G, 'meet');
  const zz = canvasTex(128, 64, (g2) => { g2.fillStyle = '#fff'; g2.font = '900 44px system-ui'; g2.fillText('Zzz', 10, 48); }); K.zzz = new T.Sprite(new T.SpriteMaterial({ map: zz, transparent: true, depthWrite: false })); K.zzz.scale.set(.8, .4, 1); f2G.add(K.zzz);
  deck('plaza', { x: cx, z: cz, hx: W / 2, hz: D / 2 });
}

/* ---------- 🅿️ katlı otopark ---------- */
const GP = { cx: 195, cz: -385, W: 30, D: 40, L: [0, 3.6, 7.2], r1: { x0: 9, x1: 14, z0: 14, z1: -6 }, r2: { x0: -14, x1: -9, z0: -6, z1: 14 } };
function garage() {
  const { cx, cz, W, D, L } = GP, g = new T.Group(); g.position.set(cx, 0, cz); K.g.add(g); const conc = M(0xa8a59e, { roughness: .9 }), yel = M(0xffd600), lm = M(0xf5f5f5);
  box(W, .05, D, M(0x5f6368), 0, .03, 0, g);
  for (const [lv, hole] of [[1, GP.r1], [2, GP.r2]]) { const y = L[lv]; const hx0 = hole.x0, hx1 = hole.x1, hz0 = Math.min(hole.z0, hole.z1), hz1 = Math.max(hole.z0, hole.z1);
    box(hx0 + W / 2, .35, D, conc, (-W / 2 + hx0) / 2, y - .17, 0, g); box(W / 2 - hx1, .35, D, conc, (hx1 + W / 2) / 2, y - .17, 0, g);
    box(hx1 - hx0, .35, hz0 + D / 2, conc, (hx0 + hx1) / 2, y - .17, (-D / 2 + hz0) / 2, g); box(hx1 - hx0, .35, D / 2 - hz1, conc, (hx0 + hx1) / 2, y - .17, (hz1 + D / 2) / 2, g);
    for (const s of [-1, 1]) { box(W, 1, .3, conc, 0, y + .5, s * D / 2, g); obsBox(cx, cz + s * D / 2, W / 2, .25, y + 1, y); box(.3, 1, D, conc, s * W / 2, y + .5, 0, g); obsBox(cx + s * W / 2, cz, .25, D / 2, y + 1, y); }
    const ln = label(adT('KAT') + ' ' + lv, '#ffd600', '#212121', 2.4, .8); ln.position.set(0, y + 2.4, -D / 2 + .5); g.add(ln); }
  for (const x of [-12, -4, 4]) for (const z of [-16, -8, 0, 8, 16]) { box(.6, L[2], .6, conc, x, L[2] / 2, z, g); obsCyl(cx + x, cz + z, .45, L[2]); }
  for (const r of [GP.r1, GP.r2]) { const lenZ = Math.abs(r.z1 - r.z0), y0 = r === GP.r1 ? 0 : 3.6, ang = Math.atan2(3.6, lenZ); const m = box(r.x1 - r.x0, .3, Math.hypot(lenZ, 3.6), conc, (r.x0 + r.x1) / 2, y0 + 1.8 - .15, (r.z0 + r.z1) / 2, g); m.rotation.x = (r.z1 < r.z0 ? 1 : -1) * ang; for (let k = 0; k < 6; k++) { const s = box(r.x1 - r.x0, .02, .3, yel, (r.x0 + r.x1) / 2, 0, 0, g); const u = (k + .5) / 6; s.position.set((r.x0 + r.x1) / 2, y0 + 3.6 * u + .03, r.z0 + (r.z1 - r.z0) * u); s.rotation.x = m.rotation.x; } }
  for (const y of L) for (let k = 0; k < 10; k++) { const z = -17 + k * 3.8; box(.12, .02, 4, lm, -13.8, y + .05, z, g); if (rr() < .55) { const c = makeCar(viv(), undefined, true); c.position.set(-11.6, y, z + 1.9); c.rotation.y = Math.PI / 2; g.add(c); obsBox(cx - 11.6, cz + z + 1.9, 2.2, 1, y + 1.5, y || undefined); } box(.12, .02, 4, lm, 6, y + .05, z, g); if (rr() < .5) { const c = makeCar(viv(), undefined, true); c.position.set(3.8, y, z + 1.9); c.rotation.y = -Math.PI / 2; g.add(c); obsBox(cx + 3.8, cz + z + 1.9, 2.2, 1, y + 1.5, y || undefined); } }
  for (const y of [L[1], L[2]]) for (let z = -16; z <= 16; z += 8) box(2, .06, .3, GLOW(0xfff8e1), -2, y - .38, z, g);
  const sg = label('🅿️ SFT OTOPARK · 3 ' + adT('KAT'), '#1565c0', '#ffffff', 10, 1.6); sg.position.set(0, L[2] + 2.5, D / 2 + .2); g.add(sg); const sg2 = adBoard(8, 4, 14, 1, false); sg2.position.set(W / 2 + .2, L[2] + 2.6, 0); sg2.rotation.y = Math.PI / 2; g.add(sg2);
  deck('garage', { x: cx, z: cz, hx: W / 2, hz: D / 2 });
}
function hubSign() {   // 🏞️ köyün tepesinde kocaman S.F.T yazısı
  const H = G.AREAS.hub; let best = null, bs = -1; const holders = [].concat(...['house', 'tree', 'pine', 'rock', 'lamp'].map(k => (G.slotHolders && G.slotHolders[k]) || []));
  for (let a = 0; a < 6.28; a += .2) { const x = H.cx + Math.cos(a) * 196, z = H.cz + Math.sin(a) * 196; let dm = 1e9; for (const h of holders) dm = Math.min(dm, Math.hypot(h.position.x - x, h.position.z - z)); if (dm > bs) { bs = dm; best = [x, z, a]; } }
  if (!best) return; const [x, z, a] = best, g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = -a - Math.PI / 2; G.scene.add(g); K.hub = g;
  const hill = new T.Mesh(new T.SphereGeometry(16, 20, 10, 0, 6.29, 0, Math.PI / 2), M(0x6a9a45, { flatShading: true })); hill.scale.set(1.6, .45, 1); g.add(hill);
  const lt = 'S.F.T'; [...lt].forEach((ch, i) => { const t = canvasTex(128, 160, (g2, w, h) => { g2.clearRect(0, 0, w, h); g2.fillStyle = '#ffffff'; g2.font = '900 150px system-ui'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText(ch, w / 2, h / 2 + 8); });
    const p = new T.Mesh(new T.PlaneGeometry(ch === '.' ? 3 : 6.5, 8), new T.MeshStandardMaterial({ map: t, transparent: true, alphaTest: .4, side: T.DoubleSide, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .25 })); p.position.set((i - 2) * 5.2, 9.5, 0); p.rotation.x = -.12; g.add(p);
    if (ch !== '.') for (const s of [-1.6, 1.6]) { const pole = new T.Mesh(new T.CylinderGeometry(.08, .08, 4, 5), M(0x5d4037)); pole.position.set((i - 2) * 5.2 + s, 6, -.6); g.add(pole); } });
}

/* ---------- 👣 yürünebilir zemin: dağlar, otoyollar, katlar, rampalar ---------- */
function roadGround(r, x, z, y, g) {
  if (r.bb && (x < r.bb[0] || x > r.bb[1] || z < r.bb[2] || z > r.bb[3])) return g;
  const P = r.pts, hw = r.w / 2 + .3; let best = -1;
  for (let i = 0; i < P.length - 1; i += 1) { const a = P[i], b = P[i + 1]; if (Math.abs(a.x - x) > 12 && Math.abs(b.x - x) > 12) continue; if (Math.abs(a.z - z) > 12 && Math.abs(b.z - z) > 12) continue;
    const dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1, u = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L2)), px = a.x + dx * u, pz = a.z + dz * u; if (Math.hypot(x - px, z - pz) > hw) continue; const yy = a.y + (b.y - a.y) * u; if (yy <= y + 1.3 && yy > best) best = yy; }
  return best > g ? best : g;
}
function ground(wx, wz, y, g) {
  if (!K.built) return g; const A = CA(), x = wx - A.cx, z = wz - A.cz, r = Math.hypot(x, z);
  if (inTunnel(x, z) && y < TUN.top + 1) g = Math.max(g, 0); else if (r > 490) { const h = mh(x, z); if (h > g) g = h; }
  for (const rd of ROADS) if (rd.deck) g = roadGround(rd, wx - A.cx, wz - A.cz, y, g);
  // 🏢 Plaza katları + merdiven
  { const lx = x - PL.cx, lz = z - PL.cz; if (Math.abs(lx) < PL.W / 2 && Math.abs(lz) < PL.D / 2) { const s = PL.st, onSt = lx > s.x0 && lx < s.x1 && lz < s.z0 + .5 && lz > s.z1 - .5;
    if (onSt) { const yy = PL.F2 * Math.max(0, Math.min(1, (s.z0 - lz) / (s.z0 - s.z1))); if (yy <= y + 1.3) g = Math.max(g, yy); }
    else if (y >= PL.F2 - 1.3) g = Math.max(g, PL.F2); } }
  // 🅿️ otopark katları + rampalar
  { const lx = x - GP.cx, lz = z - GP.cz; if (Math.abs(lx) < GP.W / 2 && Math.abs(lz) < GP.D / 2) { const inR = (q) => lx > q.x0 && lx < q.x1 && lz > Math.min(q.z0, q.z1) - .3 && lz < Math.max(q.z0, q.z1) + .3, ry = (q, y0) => y0 + 3.6 * Math.max(0, Math.min(1, (lz - q.z0) / (q.z1 - q.z0)));
    const c = []; if (!inR(GP.r1)) c.push(GP.L[1]); if (!inR(GP.r2)) c.push(GP.L[2]); if (inR(GP.r1)) c.push(ry(GP.r1, 0)); if (inR(GP.r2)) c.push(ry(GP.r2, 3.6));
    for (const yy of c) if (yy <= y + 1.3 && yy > g) g = yy; } }
  return g;
}

/* ---------- ⏱️ her kare ---------- */
let doorT = 0, cutT = 0;
function npcTick(n, dt, t) {
  const r = n.r, h = n.h, p = n.pose, w = t * 8 + n.ph, S = (o, ax, v) => { o.rotation[ax] = v; };
  if (n.path) { const tp = n.path[n.pi], dx = tp[0] - h.position.x, dz = tp[1] - h.position.z, d = Math.hypot(dx, dz); if (d < .3) n.pi = (n.pi + 1) % n.path.length; else { h.position.x += dx / d * n.sp * dt; h.position.z += dz / d * n.sp * dt; h.rotation.y = Math.atan2(dx, dz); } try { G.animateStick(r, dt, { speed: n.sp }); } catch (e) {}
    if (n.cart) { n.cart.position.set(h.position.x + Math.sin(h.rotation.y) * .8, 0, h.position.z + Math.cos(h.rotation.y) * .8); n.cart.rotation.y = h.rotation.y; r.armL.sh.rotation.x = r.armR.sh.rotation.x = -1.2; } return; }
  try { G.animateStick(r, dt, { speed: p === 'walk' ? 1 : 0 }); } catch (e) {}
  const sit = () => { S(r.legL.hip, 'x', -1.5); S(r.legR.hip, 'x', -1.5); S(r.legL.kn, 'x', 1.5); S(r.legR.kn, 'x', 1.5); h.position.y = n.home.y - .3; };
  if (p === 'sit' || p === 'coffee' || p === 'type' || p === 'game' || p === 'sleep' || p === 'meet' || p === 'lazy') sit();
  if (p === 'type' || p === 'game') { S(r.armL.sh, 'x', -1.25 + Math.sin(w * 2.3) * .06); S(r.armR.sh, 'x', -1.25 + Math.cos(w * 2.1) * .06); S(r.armL.el, 'x', -.5); S(r.armR.el, 'x', -.5); if (p === 'game') S(r.head, 'y', Math.sin(t * 3) * .15); }
  else if (p === 'sleep') { S(r.armL.sh, 'x', -1.6); S(r.armR.sh, 'x', -1.6); S(r.armL.el, 'x', -1.4); S(r.armR.el, 'x', -1.4); if (r.neck) S(r.neck, 'x', .9); if (K.zzz && !K.zzzN) { K.zzzN = n; } }
  else if (p === 'coffee') { const k = Math.max(0, Math.sin(w * .4)); S(r.armR.sh, 'x', -.7 - k * 1.2); S(r.armR.el, 'x', -.6 - k * 1.1); }
  else if (p === 'phone' || p === 'lazy') { S(r.armR.sh, 'x', -1.4); S(r.armR.el, 'x', -1.3); S(r.head, 'x', .25); }
  else if (p === 'talk' || p === 'meet' || p === 'desk' || p === 'cashier' || p === 'barista') { S(r.armR.sh, 'x', -.5 + Math.sin(w * .8) * .45); S(r.armL.sh, 'x', -.3 + Math.sin(w * .6 + 1) * .3); if (p === 'barista' || p === 'cashier') S(r.armL.sh, 'x', -1 + Math.sin(w) * .2); }
  else if (p === 'pong') { S(r.armR.sh, 'x', -1.2 + Math.sin(t * 3 + n.ph) * .5); S(r.armR.sh, 'z', -.3); }
  else if (p === 'stock') { S(r.armL.sh, 'x', -1.6 + Math.sin(w * .5) * .4); S(r.armR.sh, 'x', -1.6 - Math.sin(w * .5) * .4); }
  else if (p === 'walk') { h.position.x = n.home.x + Math.sin(t * .2 + n.ph) * 6; h.position.z = n.home.z + Math.cos(t * .2 + n.ph) * 6; h.rotation.y = t * .2 + n.ph + Math.PI; }
}
function tick(dt) {
  const ic = inCity(); if (K.hub) K.hub.visible = G.curKey === 'hub';
  if (!ic) { K.g.visible = false; return; }
  if (!K.built) { try { build(); } catch (e) { console.warn('kent build', e); } }
  K.g.visible = true; if (!dt) return; const t = (K.U.t.value += dt), A = CA(), P = G.player.position, lx = P.x - A.cx, lz = P.z - A.cz;
  for (const f of K.anim) f(t);
  { let lit = 0; try { const N = G.CITY.uNight ? (G.CITY.uNight.value - .08) / .95 : (G.DAY.N || 0); lit = Math.max(0, Math.min(1, N)); } catch (e) {} nightTick(t, lit); }
  // 🚗 otoyol / dağ yolu trafiği
  for (const c of K.cars) { c.s += c.dir * c.sp * dt; if (c.s > c.r.len) c.s -= c.r.len; if (c.s < 0) c.s += c.r.len; const p = roadAt(c.r, c.s, V1); const a = p.dir + (c.dir < 0 ? Math.PI : 0), nx = Math.cos(p.dir), nz = -Math.sin(p.dir); c.g.position.set(p.x + nx * c.off, p.y + (c.ground ? .22 : .05), p.z + nz * c.off); c.g.rotation.y = a; }
  // 💧 fıskiyeler
  for (const f of K.fount) { if (Math.hypot(f.x - lx, f.z - lz) > 160) continue; for (let k = 0; k < f.jets; k++) { const a = k / f.jets * Math.PI * 2 + t * .4, s = 1 + .3 * Math.sin(t * 2 + k); wEmit(f.x + Math.cos(a) * (f.r - .8), .6, f.z + Math.sin(a) * (f.r - .8), -Math.cos(a) * 1.2, 4.5 * s, -Math.sin(a) * 1.2, 1.4); } wEmit(f.x, 2.1, f.z, R(-.4, .4), 7 + Math.sin(t * 3) * 2, R(-.4, .4), 1.6); wEmit(f.x, 2.1, f.z, R(-.6, .6), 6, R(-.6, .6), 1.5); }
  for (let i = 0; i < NW; i++) { const d = wD[i]; if (d.l <= 0) continue; d.l -= dt; if (d.l <= 0 || wPos[i * 3 + 1] < .45) { wPos[i * 3 + 1] = -1e5; d.l = 0; continue; } d.v.y -= 9.8 * dt; wPos[i * 3] += d.v.x * dt; wPos[i * 3 + 1] += d.v.y * dt; wPos[i * 3 + 2] += d.v.z * dt; } wGeo.attributes.position.needsUpdate = true;
  // 🚪 otomatik kapılar
  for (const d of K.doors) { const near = Math.hypot(P.x - (A.cx + d.x), P.z - (A.cz + d.z)) < 4.5; d.k += ((near ? 1 : 0) - d.k) * Math.min(1, dt * 5); d.l.position.x = -d.w - d.k * 3.6; d.r.position.x = d.w + d.k * 3.6; }
  // 🏠 içerideyken çatı / üst katlar gizlenir (içeriyi görürsün)
  cutT -= dt; if (cutT <= 0) { cutT = .15; const groups = new Map(); for (const c of K.cut) { const inside = Math.abs(lx - c.x) < c.hx && Math.abs(lz - c.z) < c.hz && P.y < c.ymax + 1; for (const h of c.hide) groups.set(h, (groups.get(h) || false) || inside); } for (const [h, hid] of groups) h.visible = !hid; }
  // 🧍 iç mekân ve park kişileri (yakındakiler)
  let k = 0; for (const n of K.npcs) { const wp = n.h.getWorldPosition(V2); if (Math.hypot(wp.x - P.x, wp.z - P.z) > 90) continue; npcTick(n, dt, t); if (++k > 70) break; }
  if (K.zzz && K.zzzN) { const wp = K.zzzN.h.position; K.zzz.position.set(wp.x + .3, wp.y + 1.9 + Math.sin(t * 2) * .1, wp.z); K.zzz.material.opacity = .5 + .5 * Math.sin(t * 2); }
}
window.__kent = { tick, ground, K, mh, makeCar, TUN, PL, GP };
})(window.__sftG);
