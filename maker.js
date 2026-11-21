/* 🗺️ S.F.T · Harita oluşturucu (maker.js) — index.html bunu yükler. Oyunun içindeki değişkenlere window.__sftG (G) üzerinden erişir.
   Kaynak: index.html'deki "🗺️ HARİTA OLUŞTUR" bölümü ile aynı mantık; düzenlerken G.ad biçimini koru. */
(function (G) {
'use strict';

/* =====================================================================
   🗺️ HARİTA OLUŞTUR — durdurma menüsünden. Sıfırdan kendi dünyanı kur:
   ev, apartman, gökdelen, ağaç, yol, kavşak, sandalye, masa, bank, iris çukuru, sahil ve Miami eşyaları, canavar macerası eşyaları,
   şekiller (kutu, rampa, merdiven…), portal, para, can, trambolin, lav, kontrol noktası, bitiş bayrağı, araç noktası…
   NPC ekle (isim, söz, renk, şapka, dur / gez / rota / dans), canavar, zombi, iskelet koy. Saat (sabah, öğle, akşam, gece), hava, zemin, deniz kıyısı / ada.
   Her harita tarayıcıda kaydedilir, dosya olarak dışa / içe aktarılır. ✏️ Düzenle ↔ ▶️ Oyna
   ===================================================================== */
G.AREAS.maker = { cx: -24000, cz: 24000, r: 150, bg: 0x9fd4ff, fog: [150, 700], sky: 0xcfe8ff, gnd: 0x557744, sunC: 0xfff2dd, sunI: 2.6, sunVis: 0xfff3d6 };
G.LOAD_NAMES.maker = 'Haritan';
const MK = { map: null, recs: [], root: new G.THREE.Group(), envG: new G.THREE.Group(), edit: true, item: 'house', cat: 'yapi', rot: 0, scl: 1, col: null, v: 0,
  ghost: null, ghostKey: '', ring: null, aim: new G.THREE.Vector3(), aimY: 0, aimOk: false, inB: true, rayT: 0, sel: null, box: null, moving: null, route: null, routeG: null,
  undo: [], saveT: 0, dirty: false, back: null, day0: null, wx0: null, check: null, t0: 0, near: null, bird: null, tapD: null, ramps: [], waters: [], spins: [], fires: [], bobs: [],
  ray: new G.THREE.Raycaster(), v2: new G.THREE.Vector2(), tmp: new G.THREE.Vector3(), hidden: [], finished: false };
MK.root.name = 'mkRoot'; MK.envG.name = 'mkEnv';
const mkA = () => G.AREAS.maker;
const mkSnapD = () => MK.map ? MK.map.env.snap : 1;

/* ---------- küçük yapı taşları ---------- */
const mkMat = c => typeof c === 'number' ? G.M(c) : c;
const mkB = (g, w, h, d, c, x = 0, y = 0, z = 0, ry = 0) => { const m = G.mesh(new G.THREE.BoxGeometry(w, h, d), mkMat(c), x, y, z); m.rotation.y = ry; g.add(m); return m; };
const mkCy = (g, rt, rb, h, c, x = 0, y = 0, z = 0, seg = 12) => { const m = G.mesh(new G.THREE.CylinderGeometry(rt, rb, h, seg), mkMat(c), x, y, z); g.add(m); return m; };
const mkSp = (g, r, c, x = 0, y = 0, z = 0, seg = 12) => { const m = G.mesh(new G.THREE.SphereGeometry(r, seg, Math.max(6, seg * .7 | 0)), mkMat(c), x, y, z); g.add(m); return m; };
const mkCo = (g, r, h, c, x = 0, y = 0, z = 0, seg = 12) => { const m = G.mesh(new G.THREE.ConeGeometry(r, h, seg), mkMat(c), x, y, z); g.add(m); return m; };
const mkS = (key, f) => G.staticPH('mk_' + key, () => { const g = new G.THREE.Group(); f(g); return g; });
const mkC = (o, d) => o.c != null ? o.c : d;
const mkShade = (c, k) => new G.THREE.Color(c).multiplyScalar(k).getHex();
const MK_TEX = {};
function mkCanvasTex(key, w, h, draw, rep) {
  if (MK_TEX[key]) return MK_TEX[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new G.THREE.CanvasTexture(c); t.colorSpace = G.THREE.SRGBColorSpace; t.anisotropy = 4; if (rep) { t.wrapS = t.wrapT = G.THREE.RepeatWrapping; }
  return MK_TEX[key] = t;
}
function mkTextTex(text, bg, fg, w = 512, h = 160, font = 'bold') {
  return mkCanvasTex('txt|' + text + '|' + bg + '|' + fg + '|' + w + 'x' + h, w, h, (g, W, H) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, W, H); }
    const lines = String(text).split('\n').slice(0, 3); let fs = Math.floor(H / (lines.length + .4));
    g.font = `${font} ${fs}px system-ui, sans-serif`; while (lines.some(l => g.measureText(l).width > W - 30) && fs > 14) { fs -= 2; g.font = `${font} ${fs}px system-ui, sans-serif`; }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (!bg) { g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 8; }
    lines.forEach((l, i) => g.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * fs * 1.05));
  });
}
// cephe dokusu: beyaz duvar + pencere ızgarası (duvar rengi malzemeyle çarpılır), pencereler geceleri yanar
function mkFacade(kind) {
  const spec = { apt: [4, 4, '#2b3f55', 1], tower: [5, 12, '#1d3b5a', 2], shop: [3, 1, '#20384f', 3], office: [6, 6, '#26405c', 2] }[kind];
  const map = mkCanvasTex('fac_' + kind, 256, 256, (g, W, H) => {
    const [cols, rows, win, sty] = spec; g.fillStyle = sty === 2 ? '#c9d6e2' : '#f4f1ea'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .05})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    const cw = W / cols, rh = H / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * cw, y = r * rh;
      if (sty === 3) { g.fillStyle = win; g.fillRect(x + cw * .08, y + rh * .3, cw * .84, rh * .62); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + cw * .1, y + rh * .32, cw * .2, rh * .58); continue; }
      g.fillStyle = sty === 2 ? '#8aa3b8' : '#d8d2c6'; g.fillRect(x + cw * .14, y + rh * .16, cw * .72, rh * .66);
      g.fillStyle = win; g.fillRect(x + cw * .2, y + rh * .22, cw * .6, rh * .54);
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + cw * .22, y + rh * .24, cw * .18, rh * .5);
      if (sty === 1) { g.fillStyle = '#bdb6a8'; g.fillRect(x + cw * .1, y + rh * .8, cw * .8, rh * .06); }
    }
  }, true);
  const em = mkCanvasTex('face_' + kind, 256, 256, (g, W, H) => {
    const [cols, rows, , sty] = spec; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); const cw = W / cols, rh = H / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (Math.random() < .35) continue; g.fillStyle = Math.random() < .5 ? '#ffcf7a' : '#ffe6b0';
      if (sty === 3) g.fillRect(c * cw + cw * .08, r * rh + rh * .3, cw * .84, rh * .62); else g.fillRect(c * cw + cw * .2, r * rh + rh * .22, cw * .6, rh * .54); }
  }, true);
  return { map, em };
}
const MK_WINMATS = [];
function mkFacadeMat(kind, col, rx, ry) {
  const key = kind + '|' + col + '|' + rx + '|' + ry;
  return (MK_FMC[key] ||= (() => {
    const f = mkFacade(kind), map = f.map.clone(), em = f.em.clone(); map.needsUpdate = em.needsUpdate = true; map.repeat.set(rx, ry); em.repeat.set(rx, ry);
    const m = new G.THREE.MeshStandardMaterial({ color: col, map, emissiveMap: em, emissive: 0xffb04a, emissiveIntensity: 0, roughness: .8, metalness: kind === 'tower' ? .25 : .05 });
    MK_WINMATS.push(m); return m;
  })());
}
const MK_FMC = {};
const MK_GLOW = { warm: G.M(0xfff1b0, { emissive: 0xffd166, emissiveIntensity: 1.2 }) };   // BULB_MAT ile aynı: geceleri parlar
function mkNeonMat(col) { return G.M(col, { emissive: col, emissiveIntensity: 1.6, roughness: .4 }); }

/* ---------- yol dokuları (6 m'lik karo) ---------- */
function mkRoadTex(kind) {
  return mkCanvasTex('road_' + kind, 256, 256, (g, W) => {
    const k = W / 6; g.fillStyle = kind === 'dirt' ? '#8a6a45' : kind === 'walk' ? '#b9b4aa' : '#3e4045'; g.fillRect(0, 0, W, W);
    for (let i = 0; i < 2500; i++) { const l = Math.random() < .5 ? 0 : 255; g.fillStyle = `rgba(${l},${l},${l},${kind === 'dirt' ? .08 : .05})`; g.fillRect(Math.random() * W, Math.random() * W, 2, 2); }
    g.lineCap = 'butt';
    const dash = (x0, y0, x1, y1) => { g.setLineDash([k * .9, k * .7]); g.strokeStyle = '#f2c200'; g.lineWidth = k * .14; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]); };
    const edge = (x0, y0, x1, y1) => { g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = k * .1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    const arc = (cx, cy, r, a0, a1, d) => { if (d) { g.setLineDash([k * .9, k * .7]); g.strokeStyle = '#f2c200'; g.lineWidth = k * .14; } else { g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = k * .1; } g.beginPath(); g.arc(cx, cy, r, a0, a1); g.stroke(); g.setLineDash([]); };
    const e1 = k * .45, e2 = W - k * .45;
    if (kind === 'straight') { dash(W / 2, 0, W / 2, W); edge(e1, 0, e1, W); edge(e2, 0, e2, W); }
    else if (kind === 'corner') { arc(W, W, W / 2, Math.PI, Math.PI * 1.5, true); arc(W, W, W - e1, Math.PI, Math.PI * 1.5); arc(W, W, k * .45, Math.PI, Math.PI * 1.5); }
    else if (kind === 'tee') { dash(0, W / 2, W, W / 2); edge(0, e1, W, e1); edge(0, e2, k * .45, e2); edge(W - k * .45, e2, W, e2); }
    else if (kind === 'cross') { g.fillStyle = 'rgba(255,255,255,.85)'; for (const s of [0, 1]) for (let i = 0; i < 4; i++) { if (s) g.fillRect(W - k * .5, k * (.9 + i * 1.1), k * .35, k * .55); else g.fillRect(k * .15, k * (.9 + i * 1.1), k * .35, k * .55); } }
    else if (kind === 'zebra') { g.fillStyle = '#f4f4f4'; for (let i = 0; i < 7; i++) g.fillRect(k * .5 + i * k * .74, k * 1.3, k * .42, k * 3.4); edge(e1, 0, e1, k * 1); edge(e1, k * 5, e1, W); edge(e2, 0, e2, k * 1); edge(e2, k * 5, e2, W); }
    else if (kind === 'park') { edge(e1, 0, e1, W); for (let i = 0; i <= 2; i++) edge(e1, i * W / 2, W, i * W / 2); g.fillStyle = '#e8e8e8'; g.font = `bold ${k * 1.2}px system-ui`; g.textAlign = 'center'; g.fillText('P', W * .62, W * .3); g.fillText('P', W * .62, W * .8); }
    else if (kind === 'walk') { g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(i * k, 0); g.lineTo(i * k, W); g.stroke(); g.beginPath(); g.moveTo(0, i * k); g.lineTo(W, i * k); g.stroke(); } }
    else if (kind === 'dirt') { for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(60,40,20,.25)'; g.beginPath(); g.arc(Math.random() * W, Math.random() * W, 2 + Math.random() * 5, 0, 7); g.fill(); } }
  });
}
function mkFlat(g, w, d, map, y = .025, col = 0xffffff, opts = {}) {
  y = Math.max(y, .035);
  const m = new G.THREE.Mesh(new G.THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new G.THREE.MeshStandardMaterial({ color: col, map, roughness: .95, ...opts }));
  m.position.y = y; m.receiveShadow = true; g.add(m); return m;
}
const MK_ROADMAT = {};
function mkRoad(kind, w = 6, d = 6) {
  return () => { const g = new G.THREE.Group(); const key = kind + w + 'x' + d;
    const mat = MK_ROADMAT[key] ||= new G.THREE.MeshStandardMaterial({ map: mkRoadTex(kind), roughness: .95 });
    const m = new G.THREE.Mesh(new G.THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), mat); m.position.y = .03; m.receiveShadow = true; g.add(m); return g; };
}
// 🌊 su dokusu (kayan dalgalar)
const MK_WATER_TEX = mkCanvasTex('water', 256, 256, (g, W) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, W);
  for (let i = 0; i < 90; i++) { const x = Math.random() * W, y = Math.random() * W, l = 10 + Math.random() * 30; g.strokeStyle = `rgba(160,210,240,${.25 + Math.random() * .35})`; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 4, x + l, y); g.stroke(); }
}, true);
MK_WATER_TEX.repeat.set(1, 1);
function mkWaterMat() { return new G.THREE.MeshStandardMaterial({ color: 0x2f8fd0, map: MK_WATER_TEX, transparent: true, opacity: .84, roughness: .12, metalness: .15, depthWrite: false }); }
const MK_WATER = mkWaterMat();

/* ---------- 📦 EŞYA KATALOĞU ----------
   hit: c=[yarıçap, üst] (üstüne çıkılmaz) · s=[yarıçap, üst] (üstüne çıkılır) · b=[yarı en, yarı boy, üst] (dönük kutu, üstüne çıkılır)
   act: oyunda ne yapar · col: renk seçilebilir (varsayılan) · snap: ızgara adımı · flat: zemine yapışık
   ===================================================================== */
const MK_CATS = [['yapi', '🏠', 'Yapılar'], ['doga', '🌳', 'Doğa'], ['yol', '🛣️', 'Yollar'], ['esya', '🪑', 'Eşyalar'], ['sahil', '🏖️', 'Sahil · Miami'], ['macera', '👹', 'Macera · Canavar'], ['ozel', '✨', 'Özel'], ['npc', '🧍', 'NPC'], ['sekil', '🔷', 'Şekiller']];
const MK_I = {};
const mkItem = (id, cat, ic, n, f, o = {}) => { MK_I[id] = { id, cat, ic, n, f, ...o }; };

// 🏠 YAPILAR
mkItem('house', 'yapi', '🏡', 'Köy evi', o => o.c != null ? G.staticPH('mkhouse' + o.c, () => G.buildHouse({ wall: o.c, roof: mkShade(o.c, .45) })) : G.staticPH('house' + ((o.v || 0) % 6), () => G.buildHouse(G.HOUSE_VARIANTS[(o.v || 0) % 6])), { hit: { b: [2.15, 1.85, 4.4] }, col: 0xf3e6cc, vary: 6 });
function mkBuilding(kind, w, h, d, col, extra) {
  return o => { const c = mkC(o, col), g = new G.THREE.Group();
    const T = { apt: [4, 4], tower: [5, 12], office: [6, 6], shop: [3, 1] }[kind], fl = Math.max(1, Math.round(h / 3)), ry = kind === 'shop' ? 1 : fl / T[1];
    const fw = mkFacadeMat(kind, c, Math.max(1, Math.round(w / 2.5)) / T[0], ry), fd = mkFacadeMat(kind, c, Math.max(1, Math.round(d / 2.5)) / T[0], ry);
    const m = new G.THREE.Mesh(new G.THREE.BoxGeometry(w, h, d), [fd, fd, G.M(mkShade(c, .7)), G.M(0x555555), fw, fw]);
    m.position.y = h / 2; m.castShadow = m.receiveShadow = true; g.add(m);
    mkB(g, w + .3, .35, d + .3, mkShade(c, .6), 0, h + .17);   // çatı silmesi
    mkB(g, 1.6, 2.3, .12, 0x5b3a22, 0, 1.15, d / 2 + .04);       // kapı
    mkB(g, 2.2, .12, .9, mkShade(c, .5), 0, 2.5, d / 2 + .45);   // saçak
    if (extra) extra(g, c, w, h, d);
    return g; };
}
mkItem('apt', 'yapi', '🏢', 'Apartman', mkBuilding('apt', 10, 12, 9, 0xe8dcc4, (g, c, w, h) => { mkB(g, 1.2, 1.4, 1.2, 0x9a9a96, 2.5, h + 1, 0); mkCy(g, .35, .35, 1.2, 0x777777, -3, h + .9, -2); }), { hit: { b: [5, 4.5, 12.3] }, col: 0xe8dcc4 });
mkItem('tower', 'yapi', '🏙️', 'Gökdelen', mkBuilding('tower', 12, 36, 12, 0x8fb3d1, (g, c, w, h) => { mkB(g, 4, 3, 4, 0x6c7a86, 0, h + 1.5); mkCy(g, .08, .08, 6, 0xcccccc, 0, h + 6); mkSp(g, .25, MK_GLOW.warm, 0, h + 9); }), { hit: { b: [6, 6, 36.3] }, col: 0x8fb3d1 });
mkItem('office', 'yapi', '🏬', 'İş merkezi', mkBuilding('office', 14, 18, 10, 0xb9c4cc), { hit: { b: [7, 5, 18.3] }, col: 0xb9c4cc });
mkItem('shop', 'yapi', '🏪', 'Dükkân', mkBuilding('shop', 8, 4.2, 6, 0xf6e3a8, (g, c, w, h, d) => {
  for (let i = 0; i < 6; i++) mkB(g, w / 6, .08, 1.4, i % 2 ? 0xffffff : mkShade(c, .55), -w / 2 + w / 12 + i * w / 6, 3.3, d / 2 + .7).rotation.x = .35;
  const s = new G.THREE.Mesh(new G.THREE.PlaneGeometry(5, 1), new G.THREE.MeshStandardMaterial({ map: mkTextTex('DÜKKÂN', '#1d3557', '#ffd166', 512, 100), roughness: .6 })); s.position.set(0, 3.8, d / 2 + .02); g.add(s);
}), { hit: { b: [4, 3, 4.5] }, col: 0xf6e3a8 });
mkItem('cafe', 'yapi', '☕', 'Kafe', o => { const g = MK_I.shop.f({ c: mkC(o, 0xe6c8a8) }); for (const x of [-2.6, 2.6]) { mkCy(g, .5, .5, .05, 0xffffff, x, .75, 4.6, 16); mkCy(g, .05, .05, .75, 0x333333, x, .37, 4.6, 6); mkCy(g, .05, .05, 2.2, 0xdddddd, x, 1.1, 4.6, 6); mkCo(g, 1.3, .6, 0xd62828, x, 2.3, 4.6, 8); } return g; }, { hit: { b: [4, 3, 4.5] }, col: 0xe6c8a8 });
mkItem('hut', 'yapi', '🛖', 'Kulübe', o => mkS('hut' + mkC(o, 0x8b5a2b), g => { const c = mkC(o, 0x8b5a2b);
  mkB(g, 3, 2.2, 2.6, c, 0, 1.1); for (let i = 0; i < 6; i++) mkB(g, 3.02, .05, 2.62, mkShade(c, .75), 0, .3 + i * .36);
  const r = mkB(g, 3.6, .14, 1.8, 0x5c3b1e, 0, 2.6, .62); r.rotation.x = .6; const r2 = mkB(g, 3.6, .14, 1.8, 0x5c3b1e, 0, 2.6, -.62); r2.rotation.x = -.6;
  mkB(g, .9, 1.6, .06, 0x3e2612, 0, .8, 1.31); mkB(g, .6, .5, .06, 0xa9d8ff, .9, 1.4, 1.31); }), { hit: { b: [1.5, 1.3, 3] }, col: 0x8b5a2b });
mkItem('barn', 'yapi', '🏚️', 'Ahır', o => mkS('barn' + mkC(o, 0xb23a2e), g => { const c = mkC(o, 0xb23a2e);
  mkB(g, 6, 3.6, 8, c, 0, 1.8); const sh = new G.THREE.Shape([new G.THREE.Vector2(-3.2, 0), new G.THREE.Vector2(3.2, 0), new G.THREE.Vector2(0, 2.4)]);
  const gb = new G.THREE.ExtrudeGeometry(sh, { depth: 8.4, bevelEnabled: false }); gb.translate(0, 3.6, -4.2); g.add(G.mesh(gb, G.M(0x6b6f75)));
  mkB(g, 2.6, 2.8, .1, 0xf4f1ea, 0, 1.4, 4.02); mkB(g, 2.3, 2.5, .12, mkShade(c, .8), 0, 1.4, 4.05);
  for (const s of [-1, 1]) { const x = mkB(g, .14, 3.4, .14, 0xf4f1ea, 0, 1.4, 4.1); x.rotation.z = s * .74; } }), { hit: { b: [3, 4, 5] }, col: 0xb23a2e });
mkItem('tent', 'yapi', '⛺', 'Çadır', o => mkS('tent' + mkC(o, 0xf77f00), g => { const c = mkC(o, 0xf77f00);
  const sh = new G.THREE.Shape([new G.THREE.Vector2(-1.4, 0), new G.THREE.Vector2(1.4, 0), new G.THREE.Vector2(0, 1.8)]); const gb = new G.THREE.ExtrudeGeometry(sh, { depth: 2.6, bevelEnabled: false }); gb.translate(0, 0, -1.3); g.add(G.mesh(gb, G.M(c)));
  const d = new G.THREE.Shape([new G.THREE.Vector2(-.5, 0), new G.THREE.Vector2(.5, 0), new G.THREE.Vector2(0, 1.1)]); const dg = new G.THREE.ShapeGeometry(d); dg.translate(0, 0, 1.31); g.add(G.mesh(dg, G.M(0x2b2118))); }), { hit: { b: [1.4, 1.3, 1.8] }, col: 0xf77f00 });
mkItem('ctower', 'yapi', '🏰', 'Kale kulesi', o => mkS('ctower' + mkC(o, 0x9a948a), g => { const c = mkC(o, 0x9a948a);
  mkCy(g, 2.2, 2.5, 9, c, 0, 4.5, 0, 16); mkCy(g, 2.6, 2.6, .5, mkShade(c, .85), 0, 9.25, 0, 16);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; mkB(g, .7, .8, .5, c, Math.cos(a) * 2.35, 9.9, Math.sin(a) * 2.35, -a); }
  mkB(g, 1.2, 2, .3, 0x3a2a1c, 0, 1, 2.35); for (const y of [3.5, 6.5]) mkB(g, .35, .9, .3, 0x222222, 0, y, 2.3); }), { hit: { s: [2.5, 10.3] }, col: 0x9a948a });
mkItem('cwall', 'yapi', '🧱', 'Kale duvarı', o => mkS('cwall' + mkC(o, 0x9a948a), g => { const c = mkC(o, 0x9a948a); mkB(g, 6, 4, 1.2, c, 0, 2); for (let i = 0; i < 5; i++) mkB(g, .7, .7, 1.2, c, -2.4 + i * 1.2, 4.35); }), { hit: { b: [3, .6, 4] }, col: 0x9a948a, snap: 3 });
mkItem('fence', 'yapi', '🪵', 'Çit', o => mkS('fence' + mkC(o, 0xc8a46e), g => { const c = mkC(o, 0xc8a46e); for (let i = 0; i < 5; i++) mkB(g, .12, 1.1, .12, c, -1.4 + i * .7, .55); for (const y of [.4, .85]) mkB(g, 3, .1, .06, c, 0, y, .07); }), { hit: { b: [1.5, .12, 1.1] }, col: 0xc8a46e, snap: 1.5 });
mkItem('wfence', 'yapi', '🤍', 'Beyaz çit', o => mkS('wfence' + mkC(o, 0xf4f4f4), g => { const c = mkC(o, 0xf4f4f4); for (let i = 0; i < 9; i++) { mkB(g, .14, .9, .05, c, -1.4 + i * .35, .45); mkCo(g, .1, .14, c, -1.4 + i * .35, .97, 0, 4); } for (const y of [.3, .7]) mkB(g, 3.1, .08, .05, c, 0, y, -.05); }), { hit: { b: [1.55, .1, .9] }, col: 0xf4f4f4, snap: 1.5 });
mkItem('bwall', 'yapi', '🧱', 'Tuğla duvar', o => mkS('bwall' + mkC(o, 0xa0523d), g => { const c = mkC(o, 0xa0523d); mkB(g, 4, 2, .3, c, 0, 1); for (let r = 0; r < 8; r++) mkB(g, 4.02, .02, .32, mkShade(c, .7), 0, .25 * r + .12); mkB(g, 4.1, .1, .4, 0x9c9c9c, 0, 2.05); }), { hit: { b: [2, .2, 2.1] }, col: 0xa0523d, snap: 2 });
mkItem('arch', 'yapi', '⛩️', 'Kemer kapı', o => mkS('arch' + mkC(o, 0xd9cfbf), g => { const c = mkC(o, 0xd9cfbf); for (const x of [-1.8, 1.8]) mkB(g, .8, 4, .8, c, x, 2); const t = G.mesh(new G.THREE.TorusGeometry(1.8, .4, 8, 20, Math.PI), G.M(c), 0, 4); g.add(t); mkB(g, 5, .5, 1, mkShade(c, .85), 0, 6.1); }), { hits: [{ b: [.4, .4, 6.4], o: [-1.8, 0] }, { b: [.4, .4, 6.4], o: [1.8, 0] }], col: 0xd9cfbf });
mkItem('fountain', 'yapi', '⛲', 'Çeşme havuzu', o => { const g = mkS('fountain', gg => { mkCy(gg, 2.4, 2.6, .6, 0xc9c3b6, 0, .3, 0, 24); mkCy(gg, .5, .7, 1.6, 0xc9c3b6, 0, .9, 0, 12); mkCy(gg, 1, .9, .25, 0xc9c3b6, 0, 1.8, 0, 16); mkSp(gg, .3, 0xc9c3b6, 0, 2.1); });
  const w = new G.THREE.Mesh(new G.THREE.CircleGeometry(2.15, 24).rotateX(-Math.PI / 2), MK_WATER); w.position.y = .55; g.add(w); return g; }, { hit: { s: [2.6, .6] }, act: 'water' });
mkItem('well', 'yapi', '🪣', 'Kuyu', o => mkS('well', g => { mkCy(g, .9, .95, .9, 0x8c8a86, 0, .45, 0, 14); mkCy(g, .75, .75, .02, 0x10202a, 0, .88, 0, 14); for (const x of [-.85, .85]) mkB(g, .12, 1.6, .12, 0x5c3b1e, x, 1.6); const r = mkB(g, 2.1, .1, 1.2, 0x7a3b2e, 0, 2.5, .32); r.rotation.x = .5; const r2 = mkB(g, 2.1, .1, 1.2, 0x7a3b2e, 0, 2.5, -.32); r2.rotation.x = -.5; mkCy(g, .1, .1, 1.5, 0x5c3b1e, 0, 1.8).rotation.z = Math.PI / 2; }), { hit: { c: [1, 2.6] } });
mkItem('kiosk', 'yapi', '🥙', 'Büfe', o => mkS('kiosk' + mkC(o, 0x2a9d8f), g => { const c = mkC(o, 0x2a9d8f); mkB(g, 2.6, 2.4, 2, c, 0, 1.2); mkB(g, 2.2, 1, .05, 0x1d2b33, 0, 1.6, 1.01); mkB(g, 2.6, .1, .5, 0xdddddd, 0, 1.05, 1.2); mkB(g, 3, .15, 2.6, mkShade(c, .6), 0, 2.5, .2);
  const s = new G.THREE.Mesh(new G.THREE.PlaneGeometry(2.4, .5), new G.THREE.MeshStandardMaterial({ map: mkTextTex('BÜFE', '#ffd166', '#1d3557', 512, 110) })); s.position.set(0, 2.85, 1.02); g.add(s); }), { hit: { b: [1.3, 1, 2.6] }, col: 0x2a9d8f });
mkItem('busstop', 'yapi', '🚏', 'Otobüs durağı', o => mkS('busstop', g => { for (const x of [-1.6, 1.6]) mkB(g, .1, 2.4, .1, 0x5a6470, x, 1.2, -.5); mkB(g, 3.6, .1, 1.4, 0x3a86ff, 0, 2.45, 0); mkB(g, 3.3, 1.8, .04, new G.THREE.MeshStandardMaterial({ color: 0xbfe3ff, transparent: true, opacity: .35 }), 0, 1.3, -.55); mkB(g, 2.6, .08, .4, 0x8d6e63, 0, .5, -.3); mkB(g, .5, .5, .06, 0x2a9d8f, 1.75, 2.2, .2); }), { hit: { b: [1.8, .7, 2.5] }, sit: [[0, -.15, 0, 2.2]] });
mkItem('windmill', 'yapi', '🌬️', 'Yel değirmeni', o => { const g = mkS('windmill', gg => { mkCy(gg, 1.2, 1.9, 7, 0xf1e9da, 0, 3.5, 0, 12); mkCo(gg, 1.5, 1.6, 0x8a3b2b, 0, 7.8, 0, 12); mkB(gg, .9, 1.6, .1, 0x5c3b1e, 0, .8, 1.75); });
  const hub = new G.THREE.Group(); hub.position.set(0, 6.6, 1.5); hub.name = 'spin'; g.add(hub); mkCy(hub, .25, .25, .4, 0x5c3b1e).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) { const a = new G.THREE.Group(); a.rotation.z = i * Math.PI / 2; hub.add(a); mkB(a, .12, 4, .08, 0x6b4423, 0, 2.1, .1); mkB(a, .9, 3.2, .04, 0xf4f1ea, .5, 2.4, .12); }
  return g; }, { hit: { c: [1.9, 8.6] }, act: 'spin' });
mkItem('lighthouse', 'yapi', '🗼', 'Deniz feneri', o => { const g = mkS('lighthouse', gg => { for (let i = 0; i < 6; i++) mkCy(gg, 1.6 - (i + 1) * .12, 1.6 - i * .12, 2, i % 2 ? 0xd62828 : 0xf4f4f4, 0, 1 + i * 2, 0, 16); mkCy(gg, 1.1, 1.1, .2, 0x333333, 0, 12.1, 0, 16); mkCy(gg, .7, .7, 1.2, new G.THREE.MeshStandardMaterial({ color: 0xfff6c8, emissive: 0xffd166, emissiveIntensity: 1.4 }), 0, 12.8, 0, 12); mkCo(gg, .95, 1, 0x333333, 0, 13.9, 0, 12); }); return g; }, { hit: { s: [1.6, 12.2] } });
mkItem('greenhouse', 'yapi', '🌿', 'Sera', o => mkS('greenhouse', g => { const gl = new G.THREE.MeshStandardMaterial({ color: 0xd8f3dc, transparent: true, opacity: .35, roughness: .1 }); mkB(g, 4, 2, 6, gl, 0, 1); const r = G.mesh(new G.THREE.CylinderGeometry(2, 2, 6, 16, 1, false, 0, Math.PI), gl, 0, 2, 0); r.rotation.z = Math.PI / 2; r.rotation.y = Math.PI / 2; g.add(r); for (let i = 0; i < 4; i++) mkB(g, 3.4, .5, .9, 0x6b4423, 0, .25, -2.2 + i * 1.5); for (let i = 0; i < 12; i++) mkSp(g, .25, 0x4c9a3c, -1.2 + (i % 4) * .8, .65, -2.2 + Math.floor(i / 4) * 1.5); }), { hit: { b: [2, 3, 3.9] } });
mkItem('statue', 'yapi', '🗽', 'Heykel', o => { const g = mkS('statue' + mkC(o, 0xd4a73a), gg => { mkB(gg, 1.6, 1.4, 1.6, 0x9c9c9c, 0, .7); mkB(gg, 1.9, .2, 1.9, 0x8a8a8a, 0, 1.45); });
  const r = G.createStickman(mkC(o, 0xd4a73a), mkC(o, 0xd4a73a)); r.bodyMat.metalness = r.headMat.metalness = .7; r.bodyMat.roughness = r.headMat.roughness = .3; r.stick.position.y = 1.55; r.stick.scale.setScalar(1.5);
  r.armR.sh.rotation.set(-2.8, 0, -.2); r.armL.sh.rotation.set(0, 0, .5); r.armL.el.rotation.x = -1.6; g.add(r.stick); return g; }, { hit: { s: [.95, 1.55] }, col: 0xd4a73a });

// 🌳 DOĞA
mkItem('tree', 'doga', '🌳', 'Ağaç', o => { const v = (o.v || 0) % G.TREE_VARIANTS.length; return G.staticPH('tree' + v, () => G.buildTree(v), G.BAKED_TREE); }, { hit: { c: [.5, 5.2] }, vary: 4 });
mkItem('pine', 'doga', '🌲', 'Çam', o => { const v = (o.v || 0) % 2; return G.staticPH('pine' + v, () => G.buildPine(v), G.BAKED_TREE); }, { hit: { c: [.45, 6] }, vary: 2 });
mkItem('acacia', 'doga', '🌳', 'Akasya', o => { const v = (o.v || 0) % 3; return G.staticPH('mkacacia' + v, () => G.buildAcacia(v)); }, { hit: { c: [.3, 3.5] }, vary: 3 });
mkItem('palm', 'doga', '🌴', 'Palmiye', o => { const v = (o.v || 0) % 5; return G.staticPH('mkpalm' + v, () => G.buildPalm(v + 1)); }, { hit: { c: [.3, 6] }, vary: 5 });
mkItem('cactus', 'doga', '🌵', 'Kaktüs', o => mkS('cactus' + ((o.v || 0) % 2), g => { const c = 0x3f8f4a; mkCy(g, .28, .32, 2.6, c, 0, 1.3, 0, 10); mkSp(g, .28, c, 0, 2.6, 0, 10);
  for (const s of (o.v || 0) % 2 ? [1] : [1, -1]) { mkCy(g, .17, .17, .7, c, s * .5, 1.3, 0, 8).rotation.z = Math.PI / 2; mkCy(g, .17, .17, .9, c, s * .82, 1.75, 0, 8); mkSp(g, .17, c, s * .82, 2.2, 0, 8); } }), { hit: { c: [.35, 2.8] }, vary: 2 });
mkItem('bush', 'doga', '🌿', 'Çalı', o => G.staticPH('bush', () => { const g = new G.THREE.Group(); [[0, .45, 0, .55, 0x4c9a3c], [.45, .35, .1, .4, 0x5aab47], [-.4, .35, -.1, .42, 0x43903a], [.1, .3, .42, .35, 0x5aab47], [-.1, .62, -.2, .32, 0x62b54e]].forEach(([x, y, z, r, c]) => g.add(G.mesh(new G.THREE.IcosahedronGeometry(r, 1), G.M(c), x, y, z))); return g; }, G.BAKED_BUSH), {});
mkItem('hedge', 'doga', '🟩', 'Çit çalısı', o => mkS('hedge', g => { const m = mkB(g, 3, 1.2, .9, 0x3f8a3a, 0, .6); for (let i = 0; i < 10; i++) mkSp(g, .35, i % 2 ? 0x4c9a3c : 0x43903a, -1.3 + (i % 5) * .65, .7 + (i > 4 ? .45 : 0), (i % 3 - 1) * .3, 7); }), { hit: { b: [1.5, .45, 1.2] }, snap: 1.5 });
mkItem('rock', 'doga', '🪨', 'Kaya', o => G.staticPH('rock', () => { const g = new G.THREE.Group(); const m = G.mesh(new G.THREE.DodecahedronGeometry(.9, 0), G.M(0x8a8f96, { flatShading: true }), 0, .55); m.scale.set(1.2, .7, 1); g.add(m); return g; }), { hit: { s: [.9, 1.1] } });
mkItem('bigrock', 'doga', '⛰️', 'Büyük kaya', o => mkS('bigrock', g => { const m = G.mesh(new G.THREE.DodecahedronGeometry(2.6, 1), G.M(0x7f858c, { flatShading: true }), 0, 1.6); m.scale.set(1.3, .8, 1.1); g.add(m); const m2 = G.mesh(new G.THREE.DodecahedronGeometry(1.4, 0), G.M(0x8a8f96, { flatShading: true }), 2.2, .8, 1); g.add(m2); }), { hit: { s: [3.2, 3.6] } });
mkItem('flowers', 'doga', '🌷', 'Çiçek tarhı', o => mkS('flowers' + mkC(o, 0xff70a6), g => { const c = mkC(o, 0xff70a6); mkCy(g, 1.1, 1.2, .25, 0x6b4423, 0, .12, 0, 16); mkCy(g, 1, 1, .05, 0x3b2a1a, 0, .26, 0, 16);
  for (let i = 0; i < 22; i++) { const a = i * 2.4, r = Math.sqrt(i / 22) * .9, x = Math.cos(a) * r, z = Math.sin(a) * r; mkCy(g, .015, .015, .35, 0x3f8a3a, x, .45, z, 4); mkSp(g, .08, i % 3 ? c : 0xffd166, x, .65, z, 6); } }), { hit: { s: [1.2, .3] }, col: 0xff70a6 });
mkItem('sunflower', 'doga', '🌻', 'Ayçiçeği', o => mkS('sunflower', g => { for (let k = 0; k < 3; k++) { const x = (k - 1) * .4; mkCy(g, .03, .04, 1.6 + k * .2, 0x4f8a3a, x, .8 + k * .1, 0, 5); const h = mkCy(g, .25, .25, .06, 0xffc300, x, 1.65 + k * .2, .05, 12); h.rotation.x = 1.3; const c = mkCy(g, .13, .13, .07, 0x5c3b1e, x, 1.65 + k * .2, .07, 10); c.rotation.x = 1.3; } }), {});
mkItem('grass', 'doga', '🌾', 'Uzun otlar', o => mkS('grass', g => { for (let i = 0; i < 26; i++) { const a = Math.random() * 6.28, r = Math.random() * .7, m = mkCo(g, .04, .6 + Math.random() * .5, i % 3 ? 0x6aa84f : 0x93c47d, Math.cos(a) * r, .35, Math.sin(a) * r, 3); m.rotation.z = (Math.random() - .5) * .4; } }), {});
mkItem('mushroom', 'doga', '🍄', 'Dev mantar', o => mkS('mushroom' + mkC(o, 0xd62828), g => { const c = mkC(o, 0xd62828); mkCy(g, .25, .35, 1.4, 0xf4ecd8, 0, .7, 0, 10); const cap = mkSp(g, 1, c, 0, 1.45, 0, 16); cap.scale.set(1, .55, 1); for (let i = 0; i < 8; i++) { const a = i * .8, r = .3 + (i % 3) * .2; mkSp(g, .1, 0xffffff, Math.cos(a) * r, 1.45 + Math.sqrt(Math.max(0, 1 - r * r)) * .52, Math.sin(a) * r, 6); } }), { hit: { s: [1, 2] }, col: 0xd62828 });
mkItem('log', 'doga', '🪵', 'Kütük', o => mkS('log', g => { const m = mkCy(g, .35, .35, 2.4, 0x6b4423, 0, .35, 0, 10); m.rotation.z = Math.PI / 2; for (const x of [-1.2, 1.2]) { const e = mkCy(g, .33, .33, .02, 0xc8a46e, x, .35, 0, 10); e.rotation.z = Math.PI / 2; } }), { hit: { b: [1.2, .35, .7] }, sit: [[0, 0, 0, 2]] });
mkItem('stump', 'doga', '🪵', 'Ağaç kökü', o => mkS('stump', g => { mkCy(g, .45, .55, .6, 0x6b4423, 0, .3, 0, 10); mkCy(g, .44, .44, .02, 0xc8a46e, 0, .61, 0, 10); }), { hit: { s: [.5, .62] } });
mkItem('pond', 'doga', '💧', 'Gölet', o => { const g = mkS('pond', gg => { for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28, m = G.mesh(new G.THREE.DodecahedronGeometry(.45, 0), G.M(0x8a8f96, { flatShading: true }), Math.cos(a) * 4.2, .15, Math.sin(a) * 4.2); m.scale.y = .5; gg.add(m); } });
  const w = new G.THREE.Mesh(new G.THREE.CircleGeometry(4, 32).rotateX(-Math.PI / 2), MK_WATER); w.position.y = .06; g.add(w); const l = mkSp(g, .25, 0x4c9a3c, 1.5, .08, 1, 8); l.scale.y = .1; return g; }, { act: 'water', flat: true });
mkItem('deadtree', 'doga', '🥀', 'Kuru ağaç', o => mkS('deadtree', g => { const b = G.M(0x4a3a2c); const t = mkCy(g, .18, .3, 3.4, b, 0, 1.7, 0, 7); t.rotation.z = .08; for (const [a, l, y] of [[.5, 1.4, 2.4], [2.3, 1.2, 2.9], [4.1, 1, 2]]) { const p = new G.THREE.Group(); p.position.y = y; p.rotation.y = a; g.add(p); const br = mkCy(p, .05, .1, l, b, l * .35, l * .35, 0, 5); br.rotation.z = -.8; } }), { hit: { c: [.3, 3.4] } });
mkItem('pumpkin', 'doga', '🎃', 'Balkabağı', o => mkS('pumpkin' + ((o.v || 0) % 2), g => { const p = mkSp(g, .45, 0xf77f00, 0, .38, 0, 14); p.scale.y = .8; mkCy(g, .05, .06, .2, 0x4f6a2a, 0, .78, 0, 5); if ((o.v || 0) % 2) { for (const x of [-.15, .15]) mkB(g, .1, .1, .05, MK_GLOW.warm, x, .45, .42); mkB(g, .24, .06, .05, MK_GLOW.warm, 0, .27, .42); } }), { hit: { s: [.45, .7] }, vary: 2 });
mkItem('hay', 'doga', '🟨', 'Saman balyası', o => mkS('hay', g => { const m = mkCy(g, .7, .7, 1.4, 0xe9c46a, 0, .7, 0, 14); m.rotation.z = Math.PI / 2; for (const x of [-.71, .71]) { const e = mkCy(g, .68, .68, .02, 0xd4a843, x, .7, 0, 14); e.rotation.z = Math.PI / 2; } }), { hit: { b: [.7, .7, 1.4] } });

// 🛣️ YOLLAR (6 m'lik karolar: ızgara açıkken 6 m'ye ve 90°'ye oturur)
mkItem('road', 'yol', '🛣️', 'Düz yol', mkRoad('straight'), { flat: true, road: true });
mkItem('roadc', 'yol', '↪️', 'Viraj', mkRoad('corner'), { flat: true, road: true });
mkItem('roadt', 'yol', '⊥', 'T kavşak', mkRoad('tee'), { flat: true, road: true });
mkItem('roadx', 'yol', '✚', 'Dört yol', mkRoad('cross'), { flat: true, road: true });
mkItem('zebra', 'yol', '🚸', 'Yaya geçidi', mkRoad('zebra'), { flat: true, road: true });
mkItem('parking', 'yol', '🅿️', 'Otopark', mkRoad('park'), { flat: true, road: true });
mkItem('walk', 'yol', '⬜', 'Kaldırım', mkRoad('walk'), { flat: true, road: true });
mkItem('dirtpath', 'yol', '🟫', 'Toprak yol', mkRoad('dirt'), { flat: true, road: true });
mkItem('lamp', 'yol', '💡', 'Sokak lambası', o => G.PLACEHOLDERS.lamp(), { hit: { c: [.2, 3.3] } });
mkItem('tlight', 'yol', '🚦', 'Trafik lambası', o => mkS('tlight', g => { mkCy(g, .08, .1, 3, 0x333a44, 0, 1.5, 0, 8); mkB(g, .4, 1.1, .3, 0x222222, 0, 3.3, 0); [[0xe63946, 3.65], [0xffd166, 3.3], [0x06d6a0, 2.95]].forEach(([c, y]) => mkSp(g, .11, mkNeonMat(c), 0, y, .16, 10)); }), { hit: { c: [.2, 3.8] } });
mkItem('stop', 'yol', '🛑', 'Dur tabelası', o => { const g = mkS('stopp', gg => mkCy(gg, .04, .04, 2.2, 0x9aa0a6, 0, 1.1, 0, 6)); const s = new G.THREE.Mesh(new G.THREE.CircleGeometry(.4, 8), new G.THREE.MeshStandardMaterial({ map: mkTextTex('DUR', '#d62828', '#ffffff', 256, 256), side: G.THREE.DoubleSide })); s.position.set(0, 2.2, .05); s.rotation.z = Math.PI / 8; g.add(s); return g; }, { hit: { c: [.1, 2.6] } });
mkItem('sign', 'yol', '🪧', 'Tabela (yazılı)', o => { const g = mkS('signpost', gg => { for (const x of [-.9, .9]) mkCy(gg, .06, .07, 2.2, 0x6b4423, x, 1.1, 0, 6); mkB(gg, 2.3, .85, .1, 0x8a5a32, 0, 1.8); });
  const p = new G.THREE.Mesh(new G.THREE.PlaneGeometry(2.1, .7), new G.THREE.MeshStandardMaterial({ map: mkTextTex(o.txt || 'Hoş geldin!', '#8a5a32', '#fff3d6', 512, 170) })); p.position.set(0, 1.8, .06); g.add(p); return g; }, { hit: { b: [1.1, .1, 2.2] }, txt: 'Hoş geldin!' });
mkItem('barrier', 'yol', '🚧', 'Bariyer', o => mkS('barrier', g => { for (const x of [-1, 1]) { mkB(g, .08, 1, .08, 0x666666, x, .5); mkB(g, .5, .06, .4, 0x666666, x, .03); } for (let i = 0; i < 6; i++) mkB(g, .38, .3, .06, i % 2 ? 0xffffff : 0xe63946, -.95 + i * .38, .85); }), { hit: { b: [1.1, .2, 1] } });
mkItem('cone', 'yol', '🔶', 'Trafik konisi', o => mkS('cone', g => { mkB(g, .5, .05, .5, 0x222222, 0, .025); mkCo(g, .2, .75, 0xff7b00, 0, .42, 0, 12); mkCy(g, .13, .16, .1, 0xffffff, 0, .45, 0, 12); }), { hit: { c: [.22, .75] } });
mkItem('bollard', 'yol', '⚪', 'Direkçik', o => mkS('bollard', g => { mkCy(g, .1, .12, .9, 0x3a3f4a, 0, .45, 0, 10); mkCy(g, .105, .105, .08, 0xffd166, 0, .78, 0, 10); }), { hit: { c: [.12, .9] } });
mkItem('hydrant', 'yol', '🧯', 'Yangın musluğu', o => mkS('hydrant', g => { mkCy(g, .16, .2, .8, 0xd62828, 0, .4, 0, 10); mkSp(g, .17, 0xd62828, 0, .82, 0, 10); for (const s of [-1, 1]) mkCy(g, .06, .06, .2, 0xb51f1f, s * .2, .55, 0, 8).rotation.z = Math.PI / 2; }), { hit: { c: [.22, 1] } });

// 🪑 EŞYALAR (sandalye, bank, kanepe, kütük: V ile oturulur)
mkItem('chair', 'esya', '🪑', 'Sandalye', o => mkS('chair' + mkC(o, 0x8d5a2b), g => { const c = mkC(o, 0x8d5a2b); mkB(g, .5, .06, .5, c, 0, .47); for (const [x, z] of [[-.21, -.21], [.21, -.21], [-.21, .21], [.21, .21]]) mkB(g, .05, .47, .05, mkShade(c, .8), x, .23, z); mkB(g, .5, .55, .05, c, 0, .78, -.23); }), { hit: { b: [.27, .27, .5] }, col: 0x8d5a2b, sit: [[0, .05, 0, .5]], noStand: true });
mkItem('table', 'esya', '🟫', 'Masa', o => mkS('table' + mkC(o, 0xa0703c), g => { const c = mkC(o, 0xa0703c); mkB(g, 1.6, .08, 1, c, 0, .76); for (const [x, z] of [[-.7, -.4], [.7, -.4], [-.7, .4], [.7, .4]]) mkB(g, .07, .74, .07, mkShade(c, .8), x, .37, z); }), { hit: { b: [.8, .5, .8] }, col: 0xa0703c });
mkItem('roundtable', 'esya', '⚪', 'Yuvarlak masa', o => mkS('rtable' + mkC(o, 0xf4f4f4), g => { const c = mkC(o, 0xf4f4f4); mkCy(g, .55, .55, .05, c, 0, .75, 0, 18); mkCy(g, .05, .05, .72, 0x444444, 0, .37, 0, 6); mkCy(g, .3, .3, .04, 0x444444, 0, .02, 0, 12); }), { hit: { s: [.55, .78] }, col: 0xf4f4f4 });
mkItem('dining', 'esya', '🍽️', 'Masa + 4 sandalye', o => { const g = new G.THREE.Group(); g.add(MK_I.table.f(o)); for (const [x, z, r] of [[-.45, -.85, 0], [.45, -.85, 0], [-.45, .85, Math.PI], [.45, .85, Math.PI]]) { const ch = MK_I.chair.f({ c: 0x6b4423 }); ch.position.set(x, 0, z); ch.rotation.y = r; g.add(ch); } return g; }, { hit: { b: [.8, .5, .8] }, col: 0xa0703c, sit: [[-.45, -.8, 0, .5], [.45, -.8, 0, .5], [-.45, .8, Math.PI, .5], [.45, .8, Math.PI, .5]] });
mkItem('teatable', 'esya', '🍵', 'Çay masası', o => mkS('teat', g => { mkB(g, .9, .05, .9, 0x7a4a26, 0, .55); for (const [x, z] of [[-.4, -.4], [.4, -.4], [-.4, .4], [.4, .4]]) mkB(g, .05, .53, .05, 0x5e3519, x, .27, z); for (const [x, z] of [[-.2, -.15], [.2, .15], [.15, -.25]]) { mkCy(g, .03, .025, .09, new G.THREE.MeshStandardMaterial({ color: 0xa83a0a, transparent: true, opacity: .8 }), x, .62, z, 8); mkCy(g, .05, .05, .01, 0xf4f4f4, x, .58, z, 10); } }), { hit: { b: [.45, .45, .58] } });
mkItem('bench', 'esya', '🛋️', 'Park bankı', o => G.staticPH('parkbench', G.benchModel), { hit: { b: [1, .3, .95] }, sit: [[0, 0, 0, 2]], noStand: true });
mkItem('sofa', 'esya', '🛋️', 'Kanepe', o => mkS('sofa' + mkC(o, 0x3a86ff), g => { const c = mkC(o, 0x3a86ff), d = mkShade(c, .75); mkB(g, 2, .4, .9, d, 0, .25); mkB(g, 1.9, .18, .8, c, 0, .52, .05); mkB(g, 2, .7, .22, d, 0, .75, -.36); for (const x of [-1, 1]) mkB(g, .2, .6, .9, d, x * .95, .5); }), { hit: { b: [1, .45, .7] }, col: 0x3a86ff, sit: [[0, .1, 0, 1.7]], noStand: true });
mkItem('bed', 'esya', '🛏️', 'Yatak', o => mkS('bed' + mkC(o, 0x8ecae6), g => { const c = mkC(o, 0x8ecae6); mkB(g, 1.4, .35, 2.1, 0x7a4a26, 0, .2); mkB(g, 1.3, .2, 2, 0xf4f4f4, 0, .47); mkB(g, 1.32, .08, 1.3, c, 0, .6, .35); mkB(g, .9, .12, .4, 0xffffff, 0, .62, -.7); mkB(g, 1.4, .9, .1, 0x7a4a26, 0, .55, -1.03); }), { hit: { b: [.7, 1.05, .65] }, col: 0x8ecae6 });
mkItem('tv', 'esya', '📺', 'Televizyon', o => mkS('tv', g => { mkB(g, 1.6, .5, .45, 0x5e3519, 0, .25); mkB(g, 1.5, .85, .06, 0x111111, 0, .95); mkB(g, 1.38, .75, .02, new G.THREE.MeshStandardMaterial({ color: 0x1d3557, emissive: 0x3a86ff, emissiveIntensity: .6 }), 0, .95, .035); }), { hit: { b: [.8, .25, 1.4] } });
mkItem('shelf', 'esya', '📚', 'Kitaplık', o => mkS('shelf', g => { mkB(g, 1.2, 2, .35, 0x7a4a26, 0, 1); const cs = [0xe63946, 0x3a86ff, 0x06d6a0, 0xffd166, 0x8338ec, 0xf77f00]; for (let r = 0; r < 4; r++) for (let i = 0; i < 7; i++) mkB(g, .12, .38, .26, cs[(r * 7 + i) % 6], -.45 + i * .15, .28 + r * .48, .05); }), { hit: { b: [.6, .2, 2] } });
mkItem('floorlamp', 'esya', '🛋️', 'Ayaklı lamba', o => mkS('flamp', g => { mkCy(g, .2, .22, .04, 0x333333, 0, .02, 0, 12); mkCy(g, .025, .025, 1.6, 0x333333, 0, .8, 0, 6); mkCo(g, .28, .35, new G.THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: 0xffd166, emissiveIntensity: .8, side: G.THREE.DoubleSide }), 0, 1.65, 0, 14); }), { hit: { c: [.2, 1.8] } });
mkItem('trash', 'esya', '🗑️', 'Çöp kutusu', o => mkS('trash' + mkC(o, 0x2a9d8f), g => { mkCy(g, .28, .25, .9, mkC(o, 0x2a9d8f), 0, .45, 0, 12); mkCy(g, .3, .3, .06, 0x333333, 0, .92, 0, 12); }), { hit: { c: [.3, .95] }, col: 0x2a9d8f });
mkItem('mailbox', 'esya', '📫', 'Posta kutusu', o => mkS('mailbox', g => { mkCy(g, .05, .05, 1.1, 0x6b4423, 0, .55, 0, 6); const b = mkB(g, .35, .3, .55, 0x1d3557, 0, 1.2); mkB(g, .04, .2, .06, 0xd62828, .2, 1.35, .1); }), { hit: { c: [.2, 1.4] } });
mkItem('crate', 'esya', '📦', 'Kasa', o => G.PLACEHOLDERS.crate(), { hit: { b: [.45, .45, .9] } });
mkItem('barrel', 'esya', '🛢️', 'Fıçı', o => mkS('barrel', g => { mkCy(g, .4, .4, 1, 0x8b5a2b, 0, .5, 0, 14); for (const y of [.15, .5, .85]) mkCy(g, .42, .42, .06, 0x444444, 0, y, 0, 14); }), { hit: { s: [.42, 1] } });
mkItem('grill', 'esya', '🍖', 'Mangal', o => mkS('grill', g => { for (const [x, z] of [[-.4, -.2], [.4, -.2], [-.4, .2], [.4, .2]]) mkB(g, .04, .7, .04, 0x333333, x, .35, z); mkB(g, 1, .2, .5, 0x222222, 0, .78); for (let i = 0; i < 8; i++) mkB(g, .9, .02, .02, 0x777777, 0, .9, -.2 + i * .057); for (let i = 0; i < 4; i++) mkCy(g, .05, .05, .3, 0x8b3a1a, -.3 + i * .2, .93, 0, 6).rotation.z = Math.PI / 2; }), { hit: { b: [.5, .25, .95] }, act: 'smoke' });
mkItem('swing', 'esya', '🎠', 'Salıncak', o => mkS('swing', g => { for (const x of [-1.3, 1.3]) for (const z of [-.6, .6]) { const p = mkCy(g, .06, .06, 2.6, 0xd62828, x, 1.25, z * .5, 6); p.rotation.x = z > 0 ? -.25 : .25; } mkCy(g, .07, .07, 2.8, 0xd62828, 0, 2.5, 0, 6).rotation.z = Math.PI / 2; for (const x of [-.6, .6]) { for (const s of [-.22, .22]) mkCy(g, .01, .01, 1.9, 0x888888, x + s, 1.55, 0, 4); mkB(g, .55, .05, .25, 0x3a86ff, x, .6); } }), { hit: { b: [1.4, .4, 2.6] }, noStand: true, sit: [[-.6, 0, 0, .5], [.6, 0, 0, .5]] });
mkItem('slide', 'esya', '🛝', 'Kaydırak', o => mkS('slide', g => { mkB(g, 1, .1, 1, 0xffd166, 0, 1.8, -1.4); for (const [x, z] of [[-.45, -1.85], [.45, -1.85], [-.45, -.95], [.45, -.95]]) mkCy(g, .05, .05, 1.8, 0x3a86ff, x, .9, z, 6); for (let i = 0; i < 6; i++) mkB(g, .9, .05, .15, 0x3a86ff, 0, .3 * i + .15, -1.95 - .05); const s = mkB(g, .8, .06, 2.6, 0xe63946, 0, .95, .1); s.rotation.x = .7; }), { ramp: [0, .1, 1.1, 2.6, 1.85, Math.PI], hits: [{ b: [.55, .5, 1.85], o: [0, -1.45] }] });
mkItem('carpet', 'esya', '🟥', 'Halı', o => { const g = new G.THREE.Group(); const c = mkC(o, 0xb5452f); mkFlat(g, 2, 3, mkCanvasTex('carpet', 128, 192, (q, W, H) => { q.fillStyle = '#fff'; q.fillRect(0, 0, W, H); q.strokeStyle = 'rgba(0,0,0,.35)'; q.lineWidth = 6; q.strokeRect(10, 10, W - 20, H - 20); q.strokeRect(24, 24, W - 48, H - 48); q.fillStyle = 'rgba(255,215,120,.6)'; q.beginPath(); q.ellipse(W / 2, H / 2, 25, 40, 0, 0, 7); q.fill(); }), .03, c); return g; }, { flat: true, col: 0xb5452f });
mkItem('vending', 'esya', '🥤', 'Otomat', o => mkS('vending', g => { mkB(g, 1, 1.9, .8, 0xd62828, 0, .95); mkB(g, .6, 1.2, .02, new G.THREE.MeshStandardMaterial({ color: 0xbfe3ff, emissive: 0x6fb3ff, emissiveIntensity: .5 }), -.12, 1.15, .41); for (let i = 0; i < 12; i++) mkCy(g, .04, .04, .14, [0xffd166, 0x06d6a0, 0x3a86ff][i % 3], -.32 + (i % 4) * .14, .75 + Math.floor(i / 4) * .38, .3, 6); }), { hit: { b: [.5, .4, 1.9] } });
mkItem('pot', 'esya', '🪴', 'Saksı çiçeği', o => mkS('pot', g => { mkCy(g, .25, .18, .4, 0xb5652f, 0, .2, 0, 12); for (let i = 0; i < 6; i++) mkSp(g, .16, 0x4c9a3c, Math.cos(i) * .12, .55 + (i % 2) * .12, Math.sin(i) * .12, 7); mkSp(g, .07, 0xff70a6, .1, .78, 0, 6); }), { hit: { c: [.25, .8] } });
mkItem('piano', 'esya', '🎹', 'Piyano', o => mkS('piano', g => { mkB(g, 1.6, 1.3, .6, 0x111111, 0, .65); mkB(g, 1.5, .06, .3, 0xf4f4f4, 0, .8, .42); for (let i = 0; i < 10; i++) mkB(g, .05, .03, .18, 0x111111, -.63 + i * .14, .84, .38); mkB(g, .8, .5, .35, 0x111111, 0, .25, .9); }), { hit: { b: [.8, .5, 1.3] }, sit: [[0, .9, Math.PI, .8]] });

// 🏖️ SAHİL · MİAMİ
mkItem('sea', 'sahil', '🌊', 'Deniz / su alanı', o => { const g = new G.THREE.Group(); const w = new G.THREE.Mesh(new G.THREE.PlaneGeometry(20, 20).rotateX(-Math.PI / 2), MK_WATER); w.position.y = .07; g.add(w); return g; }, { flat: true, act: 'water', snap: 5 });
mkItem('sand', 'sahil', '🟨', 'Kum alanı', o => { const g = new G.THREE.Group(); mkFlat(g, 20, 20, mkCanvasTex('sandp', 128, 128, (q, W) => { q.fillStyle = '#e8d29c'; q.fillRect(0, 0, W, W); for (let i = 0; i < 1200; i++) { q.fillStyle = Math.random() < .5 ? 'rgba(180,150,90,.3)' : 'rgba(255,245,210,.4)'; q.fillRect(Math.random() * W, Math.random() * W, 1.5, 1.5); } }, true), .028); return g; }, { flat: true, snap: 5 });
mkItem('umbrella', 'sahil', '⛱️', 'Plaj şemsiyesi', o => mkS('umb' + mkC(o, 0xe63946), g => { const c = mkC(o, 0xe63946); mkCy(g, .03, .03, 2.3, 0xeeeeee, 0, 1.15, 0, 6); for (let i = 0; i < 8; i++) { const s = G.mesh(new G.THREE.ConeGeometry(1.3, .45, 8, 1, true, i / 8 * Math.PI * 2, Math.PI / 4), G.M(i % 2 ? c : 0xffffff, { side: G.THREE.DoubleSide }), 0, 2.25); g.add(s); } }), { hit: { c: [.1, 2.4] }, col: 0xe63946 });
mkItem('sunbed', 'sahil', '🏖️', 'Şezlong', o => mkS('sunbed' + mkC(o, 0x3a86ff), g => { const c = mkC(o, 0x3a86ff); mkB(g, .7, .06, 1.4, 0xf4f4f4, 0, .3, .2); const b = mkB(g, .7, .06, .7, 0xf4f4f4, 0, .55, -.65); b.rotation.x = -.7; mkB(g, .62, .05, 1.3, c, 0, .35, .2); const b2 = mkB(g, .62, .05, .6, c, 0, .58, -.62); b2.rotation.x = -.7; for (const [x, z] of [[-.3, .8], [.3, .8], [-.3, -.4], [.3, -.4]]) mkB(g, .04, .3, .04, 0xcccccc, x, .15, z); }), { hit: { b: [.35, .9, .5] }, col: 0x3a86ff, sit: [[0, .1, 0, .6]], noStand: true });
mkItem('towel', 'sahil', '🟦', 'Plaj havlusu', o => { const g = new G.THREE.Group(); mkFlat(g, 1, 1.9, mkCanvasTex('towel', 64, 128, (q, W, H) => { for (let i = 0; i < 8; i++) { q.fillStyle = i % 2 ? '#ffffff' : 'rgba(255,255,255,.0)'; q.fillRect(0, i * H / 8, W, H / 8); } }), .03, mkC(o, 0x3a86ff)); return g; }, { flat: true, col: 0x3a86ff });
mkItem('lifeguard', 'sahil', '🛟', 'Cankurtaran kulesi', o => mkS('lifeguard', g => { for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) mkB(g, .14, 2.4, .14, 0xf4f4f4, x, 1.2, z); mkB(g, 2.4, .15, 2.4, 0xd9b48a, 0, 2.45); mkB(g, 2, 1.4, 2, 0xe63946, 0, 3.25); mkB(g, 1.4, .7, .05, 0x1d3557, 0, 3.4, 1.01); const r = mkB(g, 2.6, .12, 2.6, 0xf4f4f4, 0, 4.05); for (let i = 0; i < 7; i++) mkB(g, .8, .06, .2, 0xd9b48a, 0, .3 + i * .33, 1.4 + i * .1); }), { hit: { b: [1.2, 1.2, 2.55], y0: 2.3 } });
mkItem('surf', 'sahil', '🏄', 'Sörf tahtası', o => mkS('surf' + mkC(o, 0xffd166), g => { const b = mkSp(g, 1, mkC(o, 0xffd166), 0, 1, 0, 14); b.scale.set(.28, 1, .05); b.rotation.x = -.15; mkB(g, .02, 1.6, .06, 0xe63946, 0, 1, .02).rotation.x = -.15; }), { hit: { c: [.25, 2] }, col: 0xffd166 });
mkItem('ball', 'sahil', '🏐', 'Plaj topu', o => mkS('bball', g => { for (let i = 0; i < 6; i++) g.add(G.mesh(new G.THREE.SphereGeometry(.35, 12, 8, i / 6 * Math.PI * 2, Math.PI / 3), G.M([0xe63946, 0xffffff, 0x3a86ff, 0xffffff, 0xffd166, 0xffffff][i]), 0, .35)); }), { hit: { s: [.35, .7] } });
mkItem('sandcastle', 'sahil', '🏰', 'Kumdan kale', o => mkS('sandcastle', g => { const s = 0xe0c78a; mkB(g, 1.4, .5, 1.4, s, 0, .25); for (const [x, z] of [[-.6, -.6], [.6, -.6], [-.6, .6], [.6, .6]]) { mkCy(g, .22, .26, .9, s, x, .45, z, 8); mkCo(g, .25, .35, s, x, 1.05, z, 8); } mkCy(g, .3, .35, 1.1, s, 0, .55, 0, 8); mkCo(g, .35, .5, s, 0, 1.35, 0, 8); mkB(g, .02, .3, .2, 0xe63946, 0, 1.8, .1); }), { hit: { s: [.9, .6] } });
mkItem('boat', 'sahil', '🛥️', 'Tekne', o => mkS('boat' + mkC(o, 0xf4f4f4), g => { const c = mkC(o, 0xf4f4f4); const h = new G.THREE.Shape(); h.moveTo(-1.2, 0); h.lineTo(1.2, 0); h.lineTo(1.4, .9); h.lineTo(-1.4, .9); h.closePath(); const hg = new G.THREE.ExtrudeGeometry(h, { depth: 5, bevelEnabled: false }); hg.translate(0, 0, -2.5); g.add(G.mesh(hg, G.M(c))); mkCo(g, 1.4, 1.6, c, 0, .45, 3.2, 4).rotation.x = Math.PI / 2; mkB(g, 2.4, .05, 5, 0xc8a46e, 0, .9); mkB(g, 1.6, 1, 1.8, 0xf4f4f4, 0, 1.4, -.6); mkB(g, 1.5, .5, .04, 0x1d3557, 0, 1.6, .31); mkB(g, 2.9, .12, 5.2, 0x1d3557, 0, .2); }), { hit: { b: [1.4, 3, 1.4] } });
mkItem('pier', 'sahil', '🪵', 'İskele', o => mkS('pier', g => { mkB(g, 3, .15, 8, 0xb08a5a, 0, .9); for (let i = 0; i < 9; i++) mkB(g, 3.02, .02, .05, 0x8a6a40, 0, .98, -3.9 + i); for (const x of [-1.4, 1.4]) for (let i = 0; i < 4; i++) mkCy(g, .12, .12, 1.4, 0x6b4423, x, .4, -3.5 + i * 2.33, 6); }), { hit: { b: [1.5, 4, .98] } });
mkItem('neon', 'sahil', '🌈', 'Neon tabela', o => { const c = mkC(o, 0xff4fd8), g = mkS('neonbase', gg => { for (const x of [-1.6, 1.6]) mkCy(gg, .05, .05, 2.6, 0x333333, x, 1.3, 0, 6); mkB(gg, 3.6, 1.2, .12, 0x15121c, 0, 2.6); });
  const hex = '#' + new G.THREE.Color(c).getHexString(), p = new G.THREE.Mesh(new G.THREE.PlaneGeometry(3.4, 1.05), new G.THREE.MeshBasicMaterial({ map: mkTextTex(o.txt || 'MIAMI', null, hex, 512, 160), transparent: true, toneMapped: false })); p.position.set(0, 2.6, .07); g.add(p); return g; }, { hit: { b: [1.8, .1, 3.2] }, col: 0xff4fd8, txt: 'MIAMI' });
mkItem('flamingo', 'sahil', '🦩', 'Flamingo', o => mkS('flamingo', g => { const p = 0xff8fab; for (const x of [-.05, .05]) mkCy(g, .015, .015, .8, 0xe56b8a, x, .4, 0, 4); const b = mkSp(g, .22, p, 0, .9, 0, 10); b.scale.set(.8, .7, 1.2); const n = mkCy(g, .035, .035, .55, p, 0, 1.15, .18, 6); n.rotation.x = .4; mkSp(g, .08, p, 0, 1.42, .3, 8); const bk = mkCo(g, .035, .14, 0x222222, 0, 1.38, .41, 6); bk.rotation.x = Math.PI / 2 + .6; }), { hit: { c: [.2, 1.4] } });
mkItem('car', 'sahil', '🚗', 'Araba (süs)', o => G.staticPH('mkcar' + mkC(o, 0x3a86ff), () => G.buildCar(mkC(o, 0x3a86ff)).g), { hit: { b: [.95, 2.15, 1.4] }, col: 0x3a86ff });
mkItem('icecream', 'sahil', '🍦', 'Dondurma tezgâhı', o => mkS('icecream', g => { mkB(g, 1.8, 1, .9, 0xf4f4f4, 0, .5); for (let i = 0; i < 4; i++) mkB(g, .4, .05, .3, [0xff8fab, 0xfff3b0, 0x8d5a2b, 0x9ae6b4][i], -.6 + i * .4, 1.03, 0); for (const x of [-.85, .85]) mkCy(g, .03, .03, 1.4, 0xcccccc, x, 1.7, 0, 6); for (let i = 0; i < 6; i++) mkB(g, .34, .05, 1.2, i % 2 ? 0xffffff : 0xff8fab, -.85 + i * .34, 2.4, 0); }), { hit: { b: [.9, .45, 1.05] } });
mkItem('volley', 'sahil', '🏐', 'Voleybol filesi', o => mkS('volley', g => { for (const x of [-4, 4]) mkCy(g, .05, .05, 2.5, 0xeeeeee, x, 1.25, 0, 6); const n = new G.THREE.Mesh(new G.THREE.PlaneGeometry(8, .9, 1, 1), new G.THREE.MeshStandardMaterial({ map: mkCanvasTex('net', 64, 16, (q, W, H) => { q.strokeStyle = '#fff'; q.lineWidth = 1; for (let i = 0; i <= W; i += 4) { q.beginPath(); q.moveTo(i, 0); q.lineTo(i, H); q.stroke(); } for (let j = 0; j <= H; j += 4) { q.beginPath(); q.moveTo(0, j); q.lineTo(W, j); q.stroke(); } q.fillStyle = '#fff'; q.fillRect(0, 0, W, 2); }), transparent: true, side: G.THREE.DoubleSide, alphaTest: .3 })); n.position.y = 2.1; g.add(n); }), {});
mkItem('palmlight', 'sahil', '🎆', 'Neon palmiye', o => { const g = G.staticPH('mkpalm2', () => G.buildPalm(3)); const c = mkC(o, 0x00f5d4); for (let i = 0; i < 6; i++) mkSp(g, .12, mkNeonMat(i % 2 ? c : 0xff4fd8), Math.sin(i) * .3, 1 + i * .9, Math.cos(i) * .3, 8); return g; }, { hit: { c: [.3, 6] }, col: 0x00f5d4 });

// 👹 MACERA · CANAVAR (oyunda canlanır)
mkItem('monster', 'macera', '👹', 'Canavar', o => { const g = G.PLACEHOLDERS.monster(); return g; }, { act: 'mon', mon: 'monster' });
mkItem('zombie', 'macera', '🧟', 'Zombi', o => G.makeThemeRig('zombie').stick, { act: 'mon', mon: 'zombie' });
mkItem('skeleton', 'macera', '💀', 'İskelet', o => G.makeThemeRig('skeleton').stick, { act: 'mon', mon: 'skeleton' });
mkItem('portal', 'macera', '🌀', 'Işınlanma kapısı', o => { const c = mkC(o, 0x7b2cbf), g = mkS('portalb', gg => { mkCy(gg, 1.6, 1.8, .12, 0x6b6f7a, 0, .06, 0, 24); for (const x of [-1.25, 1.25]) mkB(gg, .3, .5, .3, 0x3a3f4a, x, .25); });
  const ring = G.mesh(new G.THREE.TorusGeometry(1.15, .13, 10, 32), G.M(0x3a3f4a, { metalness: .4 }), 0, 1.55); g.add(ring); const inner = new G.THREE.Mesh(new G.THREE.CircleGeometry(1.05, 32), new G.THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .55, side: G.THREE.DoubleSide, depthWrite: false })); inner.position.y = 1.55; inner.name = 'spinz'; g.add(inner);
  g.add(G.mesh(new G.THREE.CircleGeometry(1.3, 24).rotateX(-Math.PI / 2), G.M(c, { emissive: c, emissiveIntensity: 1 }), 0, .13)); return g; }, { act: 'portal', col: 0x7b2cbf, hint: 'Aynı renkteki iki kapı birbirine bağlanır' });
mkItem('chest', 'macera', '🧰', 'Hazine sandığı', o => { const g = mkS('chestb', gg => { mkB(gg, 1, .55, .65, 0x8b5a2b, 0, .28); for (const x of [-.4, .4]) mkB(gg, .08, .57, .67, 0xd4a73a, x, .28); mkB(gg, .14, .16, .05, 0xd4a73a, 0, .45, .34); });
  const lid = new G.THREE.Group(); lid.position.set(0, .55, -.32); lid.name = 'lid'; g.add(lid); const l = G.mesh(new G.THREE.CylinderGeometry(.32, .32, 1, 12, 1, false, 0, Math.PI), G.M(0x7a4a26), 0, 0, .32); l.rotation.z = Math.PI / 2; lid.add(l); return g; }, { act: 'chest', hit: { b: [.5, .33, .9] } });
mkItem('coin', 'macera', '🪙', 'Para', o => { const g = new G.THREE.Group(); const sp = new G.THREE.Group(); sp.name = 'spinc'; sp.position.y = .9; g.add(sp); const c = G.mesh(new G.THREE.CylinderGeometry(.3, .3, .06, 20), G.M(0xffc300, { metalness: .8, roughness: .25, emissive: 0x6a4a00, emissiveIntensity: .4 })); c.rotation.x = Math.PI / 2; sp.add(c); return g; }, { act: 'coin', snap: .5 });
mkItem('heart', 'macera', '❤️', 'Can kalbi', o => { const g = new G.THREE.Group(); const s = new G.THREE.Shape(); s.moveTo(0, -.3); s.bezierCurveTo(-.5, 0, -.3, .4, 0, .18); s.bezierCurveTo(.3, .4, .5, 0, 0, -.3); const geo = new G.THREE.ExtrudeGeometry(s, { depth: .12, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 2 }); geo.translate(0, 0, -.06); const sp = new G.THREE.Group(); sp.name = 'spinc'; sp.position.y = 1; g.add(sp); sp.add(G.mesh(geo, G.M(0xe63946, { emissive: 0x7a0010, emissiveIntensity: .5 }))); return g; }, { act: 'heart' });
mkItem('tramp', 'macera', '🤸', 'Trambolin', o => mkS('tramp' + mkC(o, 0x3a86ff), g => { mkCy(g, 1.3, 1.3, .12, mkC(o, 0x3a86ff), 0, .55, 0, 24); mkCy(g, 1.15, 1.15, .02, 0x111111, 0, .62, 0, 24); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; mkCy(g, .04, .04, .55, 0x888888, Math.cos(a) * 1.2, .27, Math.sin(a) * 1.2, 5); } }), { act: 'tramp', col: 0x3a86ff });
mkItem('boost', 'macera', '⏩', 'Hız pedi', o => { const g = new G.THREE.Group(); mkFlat(g, 2, 3, mkCanvasTex('boostp', 64, 96, (q, W, H) => { q.fillStyle = '#0b2a4a'; q.fillRect(0, 0, W, H); q.fillStyle = '#4cc9f0'; for (let i = 0; i < 3; i++) { q.beginPath(); q.moveTo(8, 70 - i * 26); q.lineTo(W / 2, 46 - i * 26); q.lineTo(W - 8, 70 - i * 26); q.lineTo(W - 8, 80 - i * 26); q.lineTo(W / 2, 56 - i * 26); q.lineTo(8, 80 - i * 26); q.fill(); } }), .035, 0xffffff, { emissive: 0x2a8ac0, emissiveIntensity: .4 }); return g; }, { act: 'boost', flat: true });
mkItem('check', 'macera', '🚩', 'Kontrol noktası', o => mkS('checkf', g => { mkCy(g, .05, .05, 2.6, 0xdddddd, 0, 1.3, 0, 6); const f = mkB(g, .9, .55, .02, 0x06d6a0, .45, 2.3); mkCy(g, .8, .8, .05, 0x06d6a0, 0, .03, 0, 20); }), { act: 'check', hint: 'Düşersen ya da yenilirsen buradan devam edersin' });
mkItem('finish', 'macera', '🏁', 'Bitiş bayrağı', o => { const g = new G.THREE.Group(); for (const x of [-2, 2]) mkCy(g, .08, .08, 3.4, 0xdddddd, x, 1.7, 0, 8); const b = new G.THREE.Mesh(new G.THREE.PlaneGeometry(4, .8), new G.THREE.MeshStandardMaterial({ map: mkCanvasTex('chk', 64, 16, (q, W, H) => { for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { q.fillStyle = (i + j) % 2 ? '#111' : '#fff'; q.fillRect(i * 4, j * 4, 4, 4); } }), side: G.THREE.DoubleSide })); b.position.y = 3.1; g.add(b); return g; }, { act: 'finish', hint: 'Başlangıçtan buraya kadar süreni tutar' });
mkItem('spawn', 'macera', '🟢', 'Başlangıç noktası', o => { const g = new G.THREE.Group(); mkFlat(g, 2.4, 2.4, mkCanvasTex('spawnp', 128, 128, (q, W) => { q.fillStyle = 'rgba(0,0,0,0)'; q.clearRect(0, 0, W, W); q.strokeStyle = '#06d6a0'; q.lineWidth = 10; q.beginPath(); q.arc(W / 2, W / 2, W / 2 - 8, 0, 7); q.stroke(); q.fillStyle = '#06d6a0'; q.beginPath(); q.moveTo(W / 2, 22); q.lineTo(W / 2 + 22, 60); q.lineTo(W / 2 - 22, 60); q.fill(); }), .03, 0xffffff, { transparent: true }); return g; }, { act: 'spawn', flat: true, one: true, hint: 'Oyna’ya basınca buradan başlarsın' });
mkItem('lava', 'macera', '🌋', 'Lav havuzu', o => { const g = new G.THREE.Group(); const m = mkFlat(g, 4, 4, mkCanvasTex('lavat', 128, 128, (q, W) => { q.fillStyle = '#ff5400'; q.fillRect(0, 0, W, W); for (let i = 0; i < 40; i++) { q.fillStyle = Math.random() < .5 ? 'rgba(255,220,0,.6)' : 'rgba(140,20,0,.5)'; q.beginPath(); q.arc(Math.random() * W, Math.random() * W, 4 + Math.random() * 12, 0, 7); q.fill(); } }, true), .04, 0xffffff, { emissive: 0xff3c00, emissiveIntensity: .9 }); m.name = 'lava'; return g; }, { act: 'lava', flat: true, snap: 2 });
mkItem('spikes', 'macera', '🔺', 'Diken tuzağı', o => mkS('spikes', g => { mkB(g, 2, .1, 2, 0x444444, 0, .05); for (let i = 0; i < 16; i++) mkCo(g, .1, .45, 0xc0c4c8, -.75 + (i % 4) * .5, .3, -.75 + Math.floor(i / 4) * .5, 6); }), { act: 'lava', snap: 2 });
mkItem('tomb', 'macera', '🪦', 'Mezar taşı', o => mkS('tomb', g => { const t = mkB(g, .7, .9, .18, 0x8a8f96, 0, .45); mkCy(g, .35, .35, .18, 0x8a8f96, 0, .9, 0, 12).rotation.x = Math.PI / 2; mkB(g, .7, .06, 1.2, 0x5a4a3a, 0, .03, .6); }), { hit: { b: [.35, .1, 1] } });
mkItem('bones', 'macera', '🦴', 'Kemik yığını', o => mkS('bones', g => { for (let i = 0; i < 9; i++) { const b = mkCy(g, .04, .04, .6, 0xe9e2cf, (Math.random() - .5) * .8, .08 + i * .03, (Math.random() - .5) * .8, 5); b.rotation.z = Math.PI / 2; b.rotation.y = Math.random() * 3; } mkSp(g, .2, 0xe9e2cf, 0, .35, 0, 10); }), {});
mkItem('torch', 'macera', '🔥', 'Meşale', o => { const g = mkS('torchb', gg => { mkCy(gg, .05, .07, 1.6, 0x5c3b1e, 0, .8, 0, 6); mkCy(gg, .12, .08, .25, 0x444444, 0, 1.65, 0, 8); }); const f = mkCo(g, .13, .4, new G.THREE.MeshBasicMaterial({ color: 0xffa62b, toneMapped: false }), 0, 1.95, 0, 8); f.name = 'flame'; return g; }, { act: 'fire', hit: { c: [.1, 2] } });
mkItem('crystal', 'macera', '💎', 'Kristal', o => { const c = mkC(o, 0x4cc9f0), g = mkS('crystal' + c, gg => { for (let i = 0; i < 5; i++) { const m = G.mesh(new G.THREE.OctahedronGeometry(.35 + (i === 0 ? .3 : 0), 0), G.M(c, { emissive: c, emissiveIntensity: .7, roughness: .2, metalness: .2, flatShading: true }), i ? Math.cos(i * 1.6) * .45 : 0, i ? .35 : .7, i ? Math.sin(i * 1.6) * .45 : 0); m.scale.y = 1.8; gg.add(m); } }); return g; }, { hit: { s: [.6, 1.3] }, col: 0x4cc9f0 });
mkItem('target', 'macera', '🎯', 'Hedef tahtası', o => mkS('target', g => { for (const x of [-.4, .4]) mkB(g, .08, 1.6, .08, 0x6b4423, x, .8, -.1); [[.6, 0xffffff], [.48, 0xe63946], [.36, 0xffffff], [.24, 0xe63946], [.12, 0xffd166]].forEach(([r, c], i) => { const m = mkCy(g, r, r, .06, c, 0, 1.5, i * .01, 24); m.rotation.x = Math.PI / 2; }); }), { hit: { b: [.6, .1, 2.1] } });
mkItem('cage', 'macera', '⛓️', 'Kafes', o => mkS('cage', g => { mkCy(g, 1.2, 1.2, .1, 0x333333, 0, .05, 0, 16); mkCy(g, 1.2, 1.2, .1, 0x333333, 0, 2.6, 0, 16); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; mkCy(g, .03, .03, 2.6, 0x555555, Math.cos(a) * 1.15, 1.3, Math.sin(a) * 1.15, 4); } }), { hit: { s: [1.2, 2.65] } });

// ✨ ÖZEL
mkItem('pit', 'ozel', '🕳️', 'İris çukuru', o => mkPitBuild(), { act: 'pit', hint: 'Yaklaşınca açılır, içine girince giyinme odasına inersin' });
mkItem('vehicle', 'ozel', '🏍️', 'Araç noktası', o => { const g = new G.THREE.Group(); const D = G.NV_DEF[o.k || 'moto'] || G.NV_DEF.moto; mkFlat(g, 4, 4, mkCanvasTex('vpad', 128, 128, (q, W) => { q.fillStyle = '#2b2d42'; q.fillRect(0, 0, W, W); q.strokeStyle = '#ffd166'; q.lineWidth = 8; q.strokeRect(6, 6, W - 12, W - 12); }), .03);
  const s = new G.THREE.Sprite(new G.THREE.SpriteMaterial({ map: mkTextTex(D.ic, null, '#ffffff', 128, 128), transparent: true, depthWrite: false })); s.scale.set(1.4, 1.4, 1); s.position.y = 1.4; s.name = 'bobs'; g.add(s); return g; }, { act: 'veh', flat: true, hint: 'Oyunda yanına gidip V ile aracı çağırırsın' });
mkItem('pet', 'ozel', '🐕', 'Köpek', o => { const P = G.buildPet('dog', mkC(o, 0xc8a06e)); P.g.userData.pet = P; return P.g; }, { col: 0xc8a06e, act: 'pet' });
mkItem('cat', 'ozel', '🐈', 'Kedi', o => { const P = G.buildPet('cat', mkC(o, 0xf4a261)); P.g.userData.pet = P; return P.g; }, { col: 0xf4a261, act: 'pet' });
mkItem('balloon', 'ozel', '🎈', 'Balon', o => { const g = G.makeBalloon(mkC(o, 0xe63946)).g; g.position.y = 2.2; const w = new G.THREE.Group(); w.add(g); g.name = 'bob'; mkCy(w, .005, .005, 2.2, 0xdddddd, 0, 1.1, 0, 3); return w; }, { col: 0xe63946, act: 'bob' });
mkItem('campfire', 'ozel', '🔥', 'Kamp ateşi', o => { const g = mkS('campb', gg => { for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28, s = G.mesh(new G.THREE.DodecahedronGeometry(.18, 0), G.M(0x777777, { flatShading: true }), Math.cos(a) * .55, .1, Math.sin(a) * .55); gg.add(s); } for (let i = 0; i < 4; i++) { const l = mkCy(gg, .07, .07, .9, 0x5c3b1e, 0, .2, 0, 6); l.rotation.z = Math.PI / 2 - .4; l.rotation.y = i * .8; } });
  const f = mkCo(g, .32, .9, new G.THREE.MeshBasicMaterial({ color: 0xff8c1a, toneMapped: false }), 0, .55, 0, 7); f.name = 'flame'; const f2 = mkCo(g, .18, .6, new G.THREE.MeshBasicMaterial({ color: 0xffe066, toneMapped: false }), 0, .45, 0, 6); f2.name = 'flame'; return g; }, { act: 'fire', hit: { c: [.6, .4] } });
mkItem('stage', 'ozel', '🎤', 'Sahne', o => mkS('stage' + mkC(o, 0x6a4c93), g => { const c = mkC(o, 0x6a4c93); mkB(g, 8, .8, 5, 0x2b2d42, 0, .4); for (const x of [-3.8, 3.8]) mkB(g, .3, 4.5, .3, 0x333333, x, 2.65, -2.3); mkB(g, 8, .3, .3, 0x333333, 0, 4.9, -2.3); mkB(g, 7.4, 3.6, .1, c, 0, 2.8, -2.4); for (let i = 0; i < 5; i++) mkSp(g, .15, mkNeonMat([0xff4fd8, 0x4cc9f0, 0xffd166, 0x06d6a0, 0xe63946][i]), -3 + i * 1.5, 4.7, -2.15, 8); mkB(g, .6, 1, .6, 0x111111, -3.2, 1.3, 1.5); mkB(g, .6, 1, .6, 0x111111, 3.2, 1.3, 1.5); }), { hit: { b: [4, 2.5, .8] } });
mkItem('info', 'ozel', '📋', 'Bilgi panosu', o => { const g = mkS('infob', gg => { for (const x of [-.9, .9]) mkCy(gg, .05, .05, 1.2, 0x555555, x, .6, 0, 6); mkB(gg, 2.1, 1.5, .08, 0x2b2d42, 0, 1.75); }); const p = new G.THREE.Mesh(new G.THREE.PlaneGeometry(1.9, 1.3), new G.THREE.MeshStandardMaterial({ map: mkTextTex(o.txt || 'Haritama\nhoş geldin!', '#f4f1ea', '#1d3557', 512, 350) })); p.position.set(0, 1.75, .05); g.add(p); return g; }, { hit: { b: [1.05, .1, 2.5] }, txt: 'Haritama\nhoş geldin!' });
mkItem('text3d', 'ozel', '🔤', 'Havada yazı', o => { const g = new G.THREE.Group(); const hex = '#' + new G.THREE.Color(mkC(o, 0xffd166)).getHexString(); const s = new G.THREE.Sprite(new G.THREE.SpriteMaterial({ map: mkTextTex(o.txt || 'MERHABA', null, hex, 1024, 256, '900'), transparent: true, depthWrite: false })); s.scale.set(8, 2, 1); s.position.y = 3; g.add(s); return g; }, { col: 0xffd166, txt: 'MERHABA' });
mkItem('flag', 'ozel', '🏳️', 'Bayrak direği', o => { const g = mkS('flagp', gg => { mkCy(gg, .06, .08, 6, 0xdddddd, 0, 3, 0, 8); mkSp(gg, .1, 0xd4a73a, 0, 6.05, 0, 8); }); const f = new G.THREE.Mesh(new G.THREE.PlaneGeometry(1.8, 1.2, 8, 1), G.M(mkC(o, 0xe30a17), { side: G.THREE.DoubleSide })); f.position.set(.95, 5.3, 0); f.name = 'wave'; g.add(f); return g; }, { col: 0xe30a17, act: 'wave', hit: { c: [.1, 6] } });
mkItem('lightpole', 'ozel', '🔦', 'Projektör', o => mkS('proj', g => { mkCy(g, .1, .14, 6, 0x555555, 0, 3, 0, 8); mkB(g, 1.6, .1, .1, 0x555555, 0, 6); for (const x of [-.6, 0, .6]) mkB(g, .4, .3, .25, MK_GLOW.warm, x, 6.1, .1); }), { hit: { c: [.15, 6.2] } });

// 🔷 ŞEKİLLER (renk + boyut serbest; kutu, plaka, rampa, merdivenin üstüne çıkılır)
mkItem('box', 'sekil', '🟦', 'Kutu', o => mkS('box' + mkC(o, 0x3a86ff), g => mkB(g, 2, 2, 2, mkC(o, 0x3a86ff), 0, 1)), { hit: { b: [1, 1, 2] }, col: 0x3a86ff, snap: 1 });
mkItem('plate', 'sekil', '⬛', 'Plaka (zemin)', o => mkS('plate' + mkC(o, 0xbdbdbd), g => mkB(g, 4, .3, 4, mkC(o, 0xbdbdbd), 0, .15)), { hit: { b: [2, 2, .3] }, col: 0xbdbdbd, snap: 2 });
mkItem('platform', 'sekil', '🟫', 'Uçan platform', o => mkS('platf' + mkC(o, 0xffd166), g => { mkB(g, 3, .3, 3, mkC(o, 0xffd166), 0, 2.85); mkB(g, 3.1, .08, 3.1, mkShade(mkC(o, 0xffd166), .6), 0, 2.68); }), { hit: { b: [1.5, 1.5, 3], y0: 2.7 }, col: 0xffd166, snap: 1, hint: '⬆️⬇️ ile yüksekliğini değiştir — parkur yap!' });
mkItem('wallp', 'sekil', '▮', 'Duvar paneli', o => mkS('wallp' + mkC(o, 0xf4f1ea), g => mkB(g, 4, 3, .25, mkC(o, 0xf4f1ea), 0, 1.5)), { hit: { b: [2, .13, 3] }, col: 0xf4f1ea, snap: 1 });
mkItem('sphere', 'sekil', '🔴', 'Küre', o => mkS('sph' + mkC(o, 0xe63946), g => mkSp(g, 1, mkC(o, 0xe63946), 0, 1, 0, 20)), { hit: { s: [1, 2] }, col: 0xe63946 });
mkItem('cyl', 'sekil', '🛢️', 'Silindir', o => mkS('cyl' + mkC(o, 0x06d6a0), g => mkCy(g, 1, 1, 2, mkC(o, 0x06d6a0), 0, 1, 0, 20)), { hit: { s: [1, 2] }, col: 0x06d6a0 });
mkItem('pillar', 'sekil', '🏛️', 'Sütun', o => mkS('pil' + mkC(o, 0xece6da), g => { const c = mkC(o, 0xece6da); mkB(g, 1, .3, 1, c, 0, .15); mkCy(g, .35, .38, 4, c, 0, 2.3, 0, 14); mkB(g, 1, .3, 1, c, 0, 4.45); }), { hit: { s: [.5, 4.6] }, col: 0xece6da });
mkItem('cone2', 'sekil', '🔺', 'Koni', o => mkS('con' + mkC(o, 0xffd166), g => mkCo(g, 1, 2, mkC(o, 0xffd166), 0, 1, 0, 20)), { hit: { c: [.8, 2] }, col: 0xffd166 });
mkItem('pyramid', 'sekil', '🔼', 'Piramit', o => mkS('pyr' + mkC(o, 0xe9c46a), g => { const m = mkCo(g, 2.1, 2.4, mkC(o, 0xe9c46a), 0, 1.2, 0, 4); m.rotation.y = Math.PI / 4; }), { hit: { b: [1.4, 1.4, 1.2] }, col: 0xe9c46a });
mkItem('ramp', 'sekil', '📐', 'Rampa', o => mkS('ramp' + mkC(o, 0x8d99ae), g => { const s = new G.THREE.Shape([new G.THREE.Vector2(-2, 0), new G.THREE.Vector2(2, 0), new G.THREE.Vector2(2, 2)]); const geo = new G.THREE.ExtrudeGeometry(s, { depth: 3, bevelEnabled: false }); geo.translate(0, 0, -1.5); geo.rotateY(-Math.PI / 2); g.add(G.mesh(geo, G.M(mkC(o, 0x8d99ae)))); }), { ramp: [0, 0, 3, 4, 2, 0], col: 0x8d99ae, snap: 1, hint: 'Ok yönünde yükselir; üstünden yürüyerek çıkılır' });
mkItem('stairs', 'sekil', '🪜', 'Merdiven', o => mkS('stairs' + mkC(o, 0xbdbdbd), g => { for (let i = 0; i < 8; i++) mkB(g, 2, .375 * (i + 1), .5, mkC(o, 0xbdbdbd), 0, .1875 * (i + 1), -1.75 + i * .5); }), { ramp: [0, 0, 2, 4, 3, 0, 8], col: 0xbdbdbd, snap: 1 });
mkItem('torus', 'sekil', '⭕', 'Halka', o => mkS('tor' + mkC(o, 0x8338ec), g => { const m = G.mesh(new G.THREE.TorusGeometry(1.4, .3, 12, 32), G.M(mkC(o, 0x8338ec)), 0, 1.75); g.add(m); }), { col: 0x8338ec });
mkItem('star', 'sekil', '⭐', 'Yıldız', o => mkS('star' + mkC(o, 0xffd166), g => { const s = new G.THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + Math.PI / 2, r = i % 2 ? .45 : 1.1; if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } const geo = new G.THREE.ExtrudeGeometry(s, { depth: .3, bevelEnabled: true, bevelSize: .05, bevelThickness: .05, bevelSegments: 1 }); geo.translate(0, 0, -.15); g.add(G.mesh(geo, G.M(mkC(o, 0xffd166), { emissive: mkC(o, 0xffd166), emissiveIntensity: .25 }), 0, 1.4)); }), { col: 0xffd166 });
mkItem('arrow', 'sekil', '➡️', 'Ok işareti', o => { const g = new G.THREE.Group(); mkFlat(g, 1.6, 2.4, mkCanvasTex('arrowp', 64, 96, (q, W, H) => { q.clearRect(0, 0, W, H); q.fillStyle = '#fff'; q.beginPath(); q.moveTo(W / 2, 4); q.lineTo(W - 6, 40); q.lineTo(W * .66, 40); q.lineTo(W * .66, H - 4); q.lineTo(W * .34, H - 4); q.lineTo(W * .34, 40); q.lineTo(6, 40); q.fill(); }), .03, mkC(o, 0xffd166), { transparent: true }); return g; }, { flat: true, col: 0xffd166 });

// 🧍 NPC hazırları (özellikler: isim, söz, renk, şapka, davranış, hız)
const MK_NPC = {
  npc_villager: ['👨‍🌾', 'Köylü', 0x4c7a3a, 0xf4f4f4, 'hasir', 'wander', 'Hoş geldin!|Hava ne güzel bugün.|Tarlam şurada, uğra bir ara.'],
  npc_woman: ['👩', 'Komşu', 0xd6336c, 0xf4f4f4, 'none', 'wander', 'Merhaba!|Çay içer misin?|Bu harita çok güzel olmuş!'],
  npc_police: ['👮', 'Polis', 0x1d3557, 0xf4f4f4, 'polis', 'route', 'Her şey yolunda mı?|Kurallara uy, tamam mı?'],
  npc_doctor: ['🧑‍⚕️', 'Doktor', 0xf1f3f5, 0xf4f4f4, 'none', 'stand', 'Bol su iç!|Kendine iyi bak.'],
  npc_chef: ['🧑‍🍳', 'Aşçı', 0xffffff, 0xf4f4f4, 'asci', 'stand', 'Bugün menüde lahmacun var!|Afiyet olsun!'],
  npc_worker: ['👷', 'İşçi', 0xf77f00, 0xf4f4f4, 'kask', 'wander', 'Dikkat, çalışma var!|Burayı ben yaptım.'],
  npc_tourist: ['🏖️', 'Turist', 0x2ec4b6, 0xf4f4f4, 'sapka', 'wander', 'Plaj ne tarafta?|Ne güzel bir yer!'],
  npc_dancer: ['🕺', 'Dansçı', 0x9b5de5, 0xf4f4f4, 'none', 'dance', 'Hadi dans et!|Müziği aç!'],
  npc_king: ['👑', 'Kral', 0x7b2cbf, 0xf4f4f4, 'tac', 'stand', 'Krallığıma hoş geldin.|Bana bir hazine getir!'],
  npc_kid: ['🧒', 'Çocuk', 0xffbe0b, 0xf4f4f4, 'none', 'wander', 'Saklambaç oynayalım mı?|Yakala beni!'],
  npc_elder: ['👴', 'Dede', 0x6c757d, 0xf4f4f4, 'sapka', 'stand', 'Bizim zamanımızda böyle haritalar yoktu.|Gel otur yanıma.'],
  npc_guard: ['💂', 'Muhafız', 0xd62828, 0xf4f4f4, 'polis', 'route', 'Dur! Kimsin sen?|Geçebilirsin.'],
};
for (const k in MK_NPC) { const [ic, n, c, hc, hat, mode, say] = MK_NPC[k]; mkItem(k, 'npc', ic, n, o => mkNpcBuild(o), { act: 'npc', col: c, npc: { hc, hat, mode, say, s: k === 'npc_kid' ? .72 : 1, sp: k === 'npc_elder' ? 'slow' : 'walk' } }); }

/* ---------- 🕳️ iris çukuru (köydekinin küçüğü: yaklaşınca kanatlar dönerek açılır, içine girince giyinme odasına inersin) ---------- */
const MK_PIT_R = 1.6;
const MK_HOLE_MAT = new G.THREE.ShaderMaterial({ vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'void main() { gl_FragColor = vec4(.02, .02, .025, 1.0); gl_FragDepth = 1.0; }', depthFunc: G.THREE.AlwaysDepth });
let MK_PIT = null;
function mkPitBuild() {
  const R = MK_PIT_R;
  if (!MK_PIT) {
    const apron = mkCanvasTex('pitapron', 256, 256, (g, S) => { const k = S / 2 / 2.6; g.fillStyle = '#8f8b84'; g.fillRect(0, 0, S, S); g.save(); g.translate(S / 2, S / 2);
      for (let i = 0; i < 32; i++) { const a0 = i / 32 * Math.PI * 2, a1 = (i + 1) / 32 * Math.PI * 2; g.fillStyle = i % 2 ? '#1c1c1c' : '#f2c200'; g.beginPath(); g.arc(0, 0, 2.58 * k, a0, a1); g.arc(0, 0, 2.36 * k, a1, a0, true); g.closePath(); g.fill(); } g.restore(); });
    const shaft = mkCanvasTex('pitshaft', 64, 256, (q, W, H) => { const gr = q.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#34373c'); gr.addColorStop(.3, '#1d1f23'); gr.addColorStop(.75, '#2a2119'); gr.addColorStop(1, '#ffc27a'); q.fillStyle = gr; q.fillRect(0, 0, W, H); for (let y = 12; y < H; y += 30) { q.fillStyle = 'rgba(0,0,0,.35)'; q.fillRect(0, y, W, 3); } });
    const prof = [[R, -.3], [R, 0], [2.25, 0], [2.25, .14], [R, .14], [R + .04, .2], [R + .18, .22], [2.1, .22], [2.3, .12], [2.4, .02], [2.42, 0]].map(([r, y]) => new G.THREE.Vector2(r, y));
    const N = 9, W = Math.PI * 2 / N * 1.75, L = R * 1.1, sh = new G.THREE.Shape(); sh.moveTo(0, 0); sh.absarc(0, 0, L, -W / 2, W / 2, false); sh.lineTo(0, 0);
    MK_PIT = { apron: new G.THREE.RingGeometry(R, 2.6, 48, 1), apronM: new G.THREE.MeshStandardMaterial({ map: apron, roughness: .95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
      frame: new G.THREE.LatheGeometry(prof, 48), frameM: new G.THREE.MeshStandardMaterial({ color: 0x41464d, metalness: .55, roughness: .42, side: G.THREE.DoubleSide }),
      hole: new G.THREE.CircleGeometry(R + .01, 40).rotateX(-Math.PI / 2), shaft: new G.THREE.CylinderGeometry(R, R, 6, 32, 1, true), shaftM: new G.THREE.MeshBasicMaterial({ map: shaft, side: G.THREE.BackSide }),
      bottom: new G.THREE.CircleGeometry(R, 32).rotateX(-Math.PI / 2), bottomM: new G.THREE.MeshBasicMaterial({ color: 0xffd7a0 }),
      blade: new G.THREE.ShapeGeometry(sh, 10).rotateX(-Math.PI / 2), bladeM: [0xa9b1ba, 0x98a0a9].map(c => new G.THREE.MeshStandardMaterial({ color: c, metalness: .55, roughness: .32, side: G.THREE.DoubleSide })) };
  }
  const P = MK_PIT, g = new G.THREE.Group();
  const ap = new G.THREE.Mesh(P.apron, P.apronM); ap.rotation.x = -Math.PI / 2; ap.position.y = .012; ap.receiveShadow = true; g.add(ap);
  const fr = new G.THREE.Mesh(P.frame, P.frameM); fr.castShadow = fr.receiveShadow = true; g.add(fr);
  const hole = new G.THREE.Mesh(P.hole, MK_HOLE_MAT); hole.position.y = .004; hole.renderOrder = -1; hole.name = 'pithole'; g.add(hole);
  const sf = new G.THREE.Mesh(P.shaft, P.shaftM); sf.position.y = -3; g.add(sf);
  const bt = new G.THREE.Mesh(P.bottom, P.bottomM); bt.position.y = -6; g.add(bt);
  const blades = [];
  for (let i = 0; i < 9; i++) { const spin = new G.THREE.Group(), slide = new G.THREE.Group(); g.add(spin); spin.add(slide); const m = new G.THREE.Mesh(P.blade, P.bladeM[i % 2]); m.rotation.x = .058; m.position.y = .078; m.receiveShadow = true; slide.add(m); blades.push({ spin, slide, a0: i / 9 * Math.PI * 2 }); spin.rotation.y = blades[i].a0; }
  g.userData.blades = blades; return g;
}
function mkPitSet(g, k) { const e = k * k * (3 - 2 * k), B = g.userData.blades; if (!B) return; for (const b of B) { b.spin.rotation.y = b.a0 + e * 1.25; b.slide.position.x = e * MK_PIT_R * 1.09; } }

/* ---------- 🧍 NPC görünümü ---------- */
function mkHat(head, hat) {
  const add = (geo, c, y, x = 0, z = 0) => { const m = G.mesh(geo, G.M(c), x, y, z); head.add(m); return m; };
  if (hat === 'sapka') { add(new G.THREE.CylinderGeometry(.27, .27, .02, 16), 0x3b2a1a, .12); add(new G.THREE.CylinderGeometry(.15, .17, .16, 14), 0x3b2a1a, .2); }
  else if (hat === 'hasir') { add(new G.THREE.CylinderGeometry(.33, .33, .02, 16), 0xe9c46a, .12); add(new G.THREE.CylinderGeometry(.13, .17, .13, 14), 0xe9c46a, .19); }
  else if (hat === 'kask') { add(new G.THREE.SphereGeometry(.19, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xffc300, .05); add(new G.THREE.CylinderGeometry(.23, .23, .02, 16), 0xffc300, .06); }
  else if (hat === 'asci') { add(new G.THREE.CylinderGeometry(.15, .14, .3, 14), 0xffffff, .26); add(new G.THREE.SphereGeometry(.18, 12, 8), 0xffffff, .42); }
  else if (hat === 'polis') { add(new G.THREE.CylinderGeometry(.17, .17, .1, 14), 0x1d3557, .16); add(new G.THREE.CylinderGeometry(.2, .2, .03, 14), 0x1d3557, .21); add(new G.THREE.BoxGeometry(.2, .02, .12), 0x111111, .12, 0, .15); add(new G.THREE.BoxGeometry(.05, .05, .02), 0xffd166, .18, 0, .17); }
  else if (hat === 'tac') { add(new G.THREE.CylinderGeometry(.14, .14, .07, 14, 1, true), 0xffd166, .15); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; add(new G.THREE.ConeGeometry(.035, .11, 4), 0xffd166, .23, Math.cos(a) * .13, Math.sin(a) * .13); } }
  else if (hat === 'kovboy') { const b = add(new G.THREE.CylinderGeometry(.34, .34, .02, 18), 0x8b5a2b, .12); b.scale.z = .8; add(new G.THREE.CylinderGeometry(.14, .17, .18, 14), 0x8b5a2b, .21); }
  else if (hat === 'bere') { add(new G.THREE.SphereGeometry(.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xe63946, .06); add(new G.THREE.SphereGeometry(.05, 8, 6), 0xffffff, .24); }
}
function mkNpcBuild(o) {
  const it = MK_I[o.t], N = it.npc || {}, r = G.createStickman(mkC(o, it.col), o.hc != null ? o.hc : N.hc);
  mkHat(r.head, o.hat || N.hat); const g = new G.THREE.Group(); g.add(r.stick); g.userData.rig = r; return g;
}
const MK_HATS = [['none', 'Yok'], ['sapka', '🎩 Şapka'], ['hasir', '👒 Hasır'], ['kask', '⛑️ Kask'], ['asci', '🧑‍🍳 Aşçı'], ['polis', '👮 Kep'], ['tac', '👑 Taç'], ['kovboy', '🤠 Kovboy'], ['bere', '🧶 Bere']];
const MK_MODES = [['stand', '🧍 Durur'], ['wander', '🚶 Gezer'], ['route', '🧭 Rotada yürür'], ['dance', '🕺 Dans eder']];
const MK_SPEEDS = [['slow', '🐢 Yavaş', 1], ['walk', '🚶 Normal', 1.7], ['run', '🏃 Koşar', 4.2]];

/* ---------- kayıtlar: her eşyanın sahnedeki hâli, engelleri, oturakları, rampaları ---------- */
const MK_ANIM = { spin: 1, spinz: 1, spinc: 1, flame: 1, bob: 1, bobs: 1, wave: 1, lid: 1 };
const mkHits = it => it.hits || (it.hit ? [it.hit] : []);
const mkDyn = it => it.act === 'npc' || it.act === 'mon' || it.act === 'pet';
function mkAdd(o) {
  const it = MK_I[o.t]; if (!it) return null;
  const A = mkA(), rec = { o, it, g: null, inner: null, ob: [], seats: [], ramps: [], an: [], rt: {} };
  let g;
  if (it.act === 'npc') { g = mkNpcBuild(o); rec.rt.rig = g.userData.rig; }
  else if (it.act === 'mon') { g = new G.THREE.Group(); if (it.mon === 'monster') { const m = G.PLACEHOLDERS.monster(); g.add(m); rec.rt.parts = m.userData.parts; } else { const rig = G.makeThemeRig(it.mon); g.add(rig.stick); rec.rt.rig = rig; } }
  else g = it.f(o);
  const h = new G.THREE.Group(); h.add(g); h.position.set(A.cx + o.x, o.y || 0, A.cz + o.z); h.rotation.y = o.r || 0; h.scale.setScalar(o.s || 1);
  h.userData.mkRec = rec; rec.g = h; rec.inner = g; MK.root.add(h);
  h.traverse(n => { if (n.name && MK_ANIM[n.name]) rec.an.push([n, n.name, n.position.y, n.scale.y, Math.random() * 6]); });
  mkPhys(rec); mkRtInit(rec); MK.recs.push(rec);
  return rec;
}
function mkUnphys(rec) {
  for (const ob of rec.ob) { const i = G.obstacles.indexOf(ob); if (i >= 0) G.obstacles.splice(i, 1); }
  for (const b of rec.seats) { const i = G.BENCHES.indexOf(b); if (i >= 0) G.BENCHES.splice(i, 1); }
  for (const r of rec.ramps) { const i = MK.ramps.indexOf(r); if (i >= 0) MK.ramps.splice(i, 1); }
  rec.ob = []; rec.seats = []; rec.ramps = [];
}
function mkPhys(rec) {
  mkUnphys(rec);
  const { o, it } = rec, s = o.s || 1, ry = o.r || 0, cs = Math.cos(ry), sn = Math.sin(ry), A = mkA(), X = A.cx + o.x, Z = A.cz + o.z, Y = o.y || 0;
  const tw = (lx, lz) => [X + (lx * cs + lz * sn) * s, Z + (-lx * sn + lz * cs) * s];
  if (mkDyn(it)) return;
  for (const hh of mkHits(it)) {
    const [ox, oz] = hh.o || [0, 0], [cx, cz] = tw(ox, oz);
    if (hh.c || hh.s) { const [r, top] = hh.c || hh.s, ob = { x: cx, z: cz, r: r * s, h: Y + top * s, top: Y + top * s, stand: !!hh.s, pass: false, mk: true }; if (Y > .3) ob.y0 = Y; G.obstacles.push(ob); rec.ob.push(ob); }
    else if (hh.b) {
      const [hx, hz, top] = hh.b, P = [];
      for (const [a, b] of [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]]) { const q = tw(ox + a, oz + b); P.push(q[0], q[1]); }
      let mx = 0, mz = 0; for (let i = 0; i < 8; i += 2) { mx = Math.max(mx, Math.abs(P[i] - cx)); mz = Math.max(mz, Math.abs(P[i + 1] - cz)); }
      const ob = { x: cx, z: cz, box: true, hx: mx, hz: mz, poly: P, h: Y + top * s, top: Y + top * s, stand: !it.noStand, pass: false, mk: true };
      const y0 = hh.y0 != null ? Y + hh.y0 * s : (Y > .3 ? Y : undefined); if (y0 !== undefined) ob.y0 = y0;
      G.obstacles.push(ob); rec.ob.push(ob);
    }
  }
  for (const st of it.sit || []) { const [ox, oz, rr, len] = st, q = tw(ox, oz), b = { x: q[0], z: q[1], y: Y, rot: ry + (rr || 0), len: (len || .6) * s, two: false, holder: rec.g, mk: true }; G.BENCHES.push(b); rec.seats.push(b); }
  if (it.ramp) {
    const [ox, oz, w, l, hgt, rr, steps] = it.ramp, q = tw(ox, oz), r = { x: q[0], z: q[1], ry: ry + (rr || 0), w: w * s, l: l * s, h: hgt * s, y0: Y, steps: steps || 0 };
    rec.ramps.push(r); MK.ramps.push(r);
    // yüksek ucun arka yüzü: içinden geçilmesin (üstünde durulur)
    const bc = Math.cos(r.ry), bs = Math.sin(r.ry), bx = r.x + bs * (r.l / 2 - .1), bz = r.z + bc * (r.l / 2 - .1), P = [];
    for (const [a, b] of [[-r.w / 2, -.12], [r.w / 2, -.12], [r.w / 2, .12], [-r.w / 2, .12]]) P.push(bx + a * bc + b * bs, bz - a * bs + b * bc);
    let mx = 0, mz = 0; for (let i = 0; i < 8; i += 2) { mx = Math.max(mx, Math.abs(P[i] - bx)); mz = Math.max(mz, Math.abs(P[i + 1] - bz)); }
    const ob = { x: bx, z: bz, box: true, hx: mx, hz: mz, poly: P, h: Y + r.h, top: Y + r.h, stand: true, pass: false, mk: true }; G.obstacles.push(ob); rec.ob.push(ob);
  }
}
function mkRampAt(x, z, y, g) {
  for (const r of MK.ramps) {
    const dx = x - r.x, dz = z - r.z; if (Math.abs(dx) > r.l + r.w || Math.abs(dz) > r.l + r.w) continue;
    const c = Math.cos(r.ry), s = Math.sin(r.ry), lx = c * dx - s * dz, lz = s * dx + c * dz;
    if (Math.abs(lx) > r.w / 2 || Math.abs(lz) > r.l / 2) continue;
    const t = (lz + r.l / 2) / r.l, h = r.y0 + (r.steps ? Math.ceil(t * r.steps) / r.steps : t) * r.h;
    if (h <= y + .75 && h > g) g = h;
  }
  return g;
}
function mkRtInit(rec) {
  const { o, it } = rec, rt = rec.rt, h = rec.g.position;
  rt.hx = h.x; rt.hz = h.z; rt.face = o.r || 0;
  if (it.act === 'npc') {
    rt.tx = h.x; rt.tz = h.z; rt.wait = Math.random() * 2; rt.wp = 0; rt.lineI = 0; rt.lineT = 0; rt.hitT = 0; rt.t = Math.random() * 9;
    if (o.name) { const sp = new G.THREE.Sprite(new G.THREE.SpriteMaterial({ map: mkTextTex(o.name, 'rgba(10,20,35,.72)', '#ffffff', 512, 110), transparent: true, depthWrite: false })); sp.scale.set(1.7, .37, 1); sp.position.y = 2.32; rec.inner.add(sp); rt.label = sp; }
  } else if (it.act === 'mon') { rt.max = o.hp || 60; rt.hp = rt.max; rt.st = 'idle'; rt.dead = 0; rt.atk = 0; rt.ph = Math.random() * 6; rt.kx = rt.kz = 0; rt.tx = h.x; rt.tz = h.z; rt.wait = 1; }
  else if (it.act === 'pet') { rt.tx = h.x; rt.tz = h.z; rt.wait = 1 + Math.random() * 2; rt.ph = 0; }
  else if (it.act === 'pit') { rt.k = 0; rt.cool = 0; }
}
function mkRemove(rec) {
  mkUnphys(rec); if (rec.g.parent) rec.g.parent.remove(rec.g);
  const i = MK.recs.indexOf(rec); if (i >= 0) MK.recs.splice(i, 1);
  if (MK.sel === rec) mkSelect(null);
}
function mkRebuild() {
  for (const r of [...MK.recs]) mkRemove(r);
  MK.recs = []; MK.ramps = [];
  for (let i = G.obstacles.length; i--;) if (G.obstacles[i].mk) G.obstacles.splice(i, 1);
  for (let i = G.BENCHES.length; i--;) if (G.BENCHES[i].mk) G.BENCHES.splice(i, 1);
  if (MK.map) for (const o of MK.map.objs) { try { mkAdd(o); } catch (e) { console.warn('harita eşyası kurulamadı', o && o.t, e); } }
  mkRouteDraw();
}
function mkRetransform(rec) {
  const o = rec.o, A = mkA(); rec.g.position.set(A.cx + o.x, o.y || 0, A.cz + o.z); rec.g.rotation.y = o.r || 0; rec.g.scale.setScalar(o.s || 1);
  rec.rt.hx = rec.g.position.x; rec.rt.hz = rec.g.position.z; rec.rt.face = o.r || 0; mkPhys(rec); if (MK.sel === rec) mkSelBox();
}
function mkRefresh(rec) { const o = rec.o, sel = MK.sel === rec; mkRemove(rec); const n = mkAdd(o); if (sel) mkSelect(n); return n; }

/* ---------- ortam: zemin, deniz, sınır, sis ---------- */
const MK_GROUNDS = { grass: ['🌱 Çim', null, 0x557744], sand: ['🏖️ Kum', ['#e3cf9d', '#d4bd85', '#efe0b6'], 0xb8a070], snow: ['❄️ Kar', ['#eef4fa', '#dfe8f2', '#ffffff'], 0xc8d4e0], dirt: ['🟫 Toprak', ['#7b5a3c', '#6a4b30', '#8d6a48'], 0x5a4a35],
  desert: ['🏜️ Çöl', ['#d6a464', '#c69050', '#e2b67a'], 0xc78a54], stone: ['🪨 Taş', ['#8d8f93', '#7c7e82', '#a2a4a8'], 0x6b6f75], asphalt: ['⬛ Asfalt', ['#45474c', '#3a3c40', '#55575c'], 0x4a4c50],
  moon: ['🌑 Ay yüzeyi', ['#b9b9bd', '#a3a3a8', '#cfcfd3'], 0x8a8a90], volcano: ['🌋 Volkan', ['#3a2a26', '#2a1d1a', '#4a3530'], 0x3a2626] };
const MK_GTEX = {};
function mkGroundTex(k) {
  if (MK_GTEX[k]) return MK_GTEX[k];
  const d = MK_GROUNDS[k] || MK_GROUNDS.grass;
  if (!d[1]) { const t = G.ground.material.map.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = G.THREE.RepeatWrapping; return MK_GTEX[k] = t; }
  return MK_GTEX[k] = G.speckleTexture(d[1][0], d[1][1], d[1][2], 1);
}
const MK_SANDM = new G.THREE.MeshStandardMaterial({ map: mkCanvasTex('sandband', 128, 128, (q, W) => { q.fillStyle = '#e8d29c'; q.fillRect(0, 0, W, W); for (let i = 0; i < 1400; i++) { q.fillStyle = Math.random() < .5 ? 'rgba(180,150,90,.3)' : 'rgba(255,245,210,.4)'; q.fillRect(Math.random() * W, Math.random() * W, 1.5, 1.5); } }, true), roughness: .96 });
MK_SANDM.map.repeat.set(40, 40);
function mkApplyEnv() {
  const E = MK.map.env, A = mkA(), S = E.size;
  A.r = S; A.fog = [Math.max(70, S * .9), Math.max(260, S * 2.4)]; A.gnd = (MK_GROUNDS[E.ground] || MK_GROUNDS.grass)[2];
  for (const c of [...MK.envG.children]) { MK.envG.remove(c); if (c.geometry) c.geometry.dispose(); }
  const R = A.fog[1] + 40, tex = mkGroundTex(E.ground); tex.repeat.set(R * 2 / 7, R * 2 / 7);
  const gm = new G.THREE.Mesh(new G.THREE.CircleGeometry(R, 96).rotateX(-Math.PI / 2), new G.THREE.MeshStandardMaterial({ map: tex, roughness: .96 }));
  gm.position.set(A.cx, 0, A.cz); gm.receiveShadow = true; gm.renderOrder = -2; MK.envG.add(gm); MK.groundM = gm;
  const water = (geo, y = .06) => { const m = new G.THREE.Mesh(geo, MK_WATER); m.position.set(A.cx, y, A.cz); MK.envG.add(m); return m; };
  const sand = geo => { const m = new G.THREE.Mesh(geo, MK_SANDM); m.position.set(A.cx, .025, A.cz); m.receiveShadow = true; MK.envG.add(m); return m; };
  if (E.sea === 'coast') { const w = water(new G.THREE.PlaneGeometry(R * 2, R).rotateX(-Math.PI / 2)); w.position.z += S * .38 + R / 2; const sb = sand(new G.THREE.PlaneGeometry(R * 2, S * .2).rotateX(-Math.PI / 2)); sb.position.z += S * .3; }
  else if (E.sea === 'island') { water(new G.THREE.RingGeometry(S * .74, R, 96).rotateX(-Math.PI / 2)); sand(new G.THREE.RingGeometry(S * .6, S * .76, 96).rotateX(-Math.PI / 2)); }
  else if (E.sea === 'lake') { water(new G.THREE.CircleGeometry(S * .2, 64).rotateX(-Math.PI / 2)); sand(new G.THREE.RingGeometry(S * .2 - 1, S * .27, 64).rotateX(-Math.PI / 2)); }
  const edge = new G.THREE.Mesh(new G.THREE.RingGeometry(S - .35, S, 160).rotateX(-Math.PI / 2), new G.THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .45, depthWrite: false }));
  edge.position.set(A.cx, .07, A.cz); MK.envG.add(edge); MK.edge = edge; edge.visible = MK.edit;
  if (G.inMaker) G.applyArea(A);
}

/* ---------- 💾 kayıt ---------- */
const MK_IDX = 'sftHaritalar', mkKey = id => 'sftHarita:' + id;
const MK_ENV0 = { ground: 'grass', time: 'auto', wx: 'clear', sea: 'none', size: 150, snap: 1 };
function mkIndex() { try { const L = JSON.parse(localStorage.getItem(MK_IDX) || '[]'); return Array.isArray(L) ? L : []; } catch (e) { return []; } }
function mkIndexSave(L) { try { localStorage.setItem(MK_IDX, JSON.stringify(L)); } catch (e) {} }
function mkNewMap(name) { return { v: 1, id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: name || mkFreeName(), t: Date.now(), env: { ...MK_ENV0 }, objs: [] }; }
function mkFreeName() { const L = mkIndex(); let i = L.length + 1; while (L.some(m => m.name === G.adT('Haritam') + ' ' + i)) i++; return G.adT('Haritam') + ' ' + i; }
function mkSanitize(m) {
  if (!m || typeof m !== 'object' || !Array.isArray(m.objs)) return null;
  m.env = Object.assign({ ...MK_ENV0 }, m.env || {}); m.env.size = G.THREE.MathUtils.clamp(+m.env.size || 150, 40, 500);
  m.objs = m.objs.filter(o => o && MK_I[o.t] && isFinite(o.x) && isFinite(o.z)).slice(0, 4000);
  for (const o of m.objs) { if (o.route && !Array.isArray(o.route)) delete o.route; if (o.txt != null) o.txt = String(o.txt).slice(0, 120); if (o.name != null) o.name = String(o.name).slice(0, 24); if (o.say != null) o.say = String(o.say).slice(0, 400); }
  m.name = String(m.name || G.adT('Haritam')).slice(0, 40); if (!m.id) m.id = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return m;
}
function mkLoadMap(id) { try { return mkSanitize(JSON.parse(localStorage.getItem(mkKey(id)) || 'null')); } catch (e) { return null; } }
function mkSaveMap(m) {
  m.t = Date.now();
  try { localStorage.setItem(mkKey(m.id), JSON.stringify(m)); } catch (e) { G.showMsg(G.adT('⚠️ Kayıt yeri doldu — eski haritaları dışa aktarıp sil'), 2.6); return false; }
  const L = mkIndex().filter(x => x.id !== m.id); L.unshift({ id: m.id, name: m.name, t: m.t, n: m.objs.length, best: m.best }); mkIndexSave(L); return true;
}
function mkSaveNow(quiet) { if (!MK.map) return; if (mkSaveMap(MK.map)) { MK.dirty = false; if (!quiet) G.showMsg('💾 ' + G.adT('Kaydedildi'), 1.1); } }
function mkDeleteMap(id) { try { localStorage.removeItem(mkKey(id)); } catch (e) {} mkIndexSave(mkIndex().filter(x => x.id !== id)); }
function mkChanged() { MK.dirty = true; MK.saveT = 2.5; mkHudItem(); }
function mkPush() { if (!MK.map) return; MK.undo.push(JSON.stringify(MK.map.objs)); if (MK.undo.length > 40) MK.undo.shift(); }
function mkUndo() {
  if (!MK.undo.length) { G.showMsg(G.adT('↩️ Geri alınacak bir şey yok'), 1); return; }
  mkCancel(true); MK.map.objs = JSON.parse(MK.undo.pop()); mkRebuild(); mkChanged(); G.play('ui'); G.showMsg('↩️ ' + G.adT('Geri alındı'), .8);
}
function mkExport(m) {
  const blob = new Blob([JSON.stringify(m)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = (m.name || 'harita').replace(/[^\wçğıöşüÇĞİÖŞÜ -]+/g, '').trim().replace(/\s+/g, '-') + '.sft-harita.json';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  G.showMsg('📤 ' + G.adT('Dosya indirildi'), 1.4);
}
function mkImportFile(f, done) {
  const rd = new FileReader();
  rd.onload = () => { let m = null; try { m = mkSanitize(JSON.parse(rd.result)); } catch (e) {} if (!m) { G.showMsg(G.adT('⚠️ Bu dosya bir harita değil'), 2); return; }
    m.id = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); if (mkIndex().some(x => x.name === m.name)) m.name += ' (2)'; mkSaveMap(m); G.showMsg('📥 ' + m.name, 1.4); if (done) done(m); };
  rd.readAsText(f);
}

/* ---------- haritaya gir / çık ---------- */
function mkSpawnPt() {
  const A = mkA(), s = MK.recs.find(r => r.it.act === 'spawn');
  if (s) return { x: s.g.position.x, z: s.g.position.z, f: s.o.r || 0 };
  return { x: A.cx, z: A.cz - Math.min(20, A.r * .3), f: 0 };
}
function mkOpen(map, edit) {
  const busy = G.admBusy(); if (busy) { G.showMsg(busy, 1.8); return; }
  if (typeof G.RIDE !== 'undefined' && G.RIDE.on) G.rideExit();
  if (MK.map && MK.dirty) mkSaveNow(true);
  if (!G.inMaker) MK.back = { k: G.curKey, x: G.player.position.x, z: G.player.position.z, f: G.facing };
  mkCancel(true); MK.map = map; MK.edit = edit; MK.undo = []; MK.v = 0; MK.check = null;
  mkApplyEnv(); mkRebuild(); mkDlgClose(); mkCatShow(false);
  G.resumeGame();
  const sp = mkSpawnPt();
  G.teleportTo('maker', sp.x, sp.z, sp.f, '🗺️ ' + map.name, () => { if (!edit) mkStartPlay(true); else mkStartEdit(true); });
}
function mkLeave() {
  if (MK.map) mkSaveNow(true); mkCancel(true); if (MK.bird) mkBird();
  const B = MK.back;
  if (B && B.k === 'hub') G.teleportTo('hub', B.x, B.z, B.f, G.adT('🏡 Köye döndün')); else G.teleportTo('hub', 0, 7.5, 0, G.adT('🏡 Köye döndün'));
}
function mkArea() {
  if (G.inMaker && MK.map) {
    if (!MK.root.parent) G.scene.add(MK.root); if (!MK.envG.parent) G.scene.add(MK.envG);
    if (MK.day0 == null) { MK.day0 = { t: G.DAY.t, auto: G.DAY.auto }; MK.wx0 = G.WX.cur; }
    G.applyArea(mkA());
  } else {
    if (MK.root.parent) G.scene.remove(MK.root); if (MK.envG.parent) G.scene.remove(MK.envG);
    if (MK.day0) { if (MK.map && MK.map.env.time !== 'auto') { G.DAY.t = MK.day0.t; G.DAY.auto = MK.day0.auto; } G.WX.cur = G.WX.mode !== 'auto' ? G.WX.mode : MK.wx0 || 'clear'; MK.day0 = null; }
    mkGhostClear(); mkCancel(true); mkBubble(null); if (MK.bird) { MK.bird = null; }
    if (MK.dirty) mkSaveNow(true);
  }
  mkModeUI();
}
function mkStartPlay(fromOpen) {
  mkCancel(true); MK.edit = false; mkGhostClear(); MK.finished = false; MK.check = null; MK.coins = 0;
  for (const r of MK.recs) mkResetRt(r);
  const sp = mkSpawnPt();
  if (!fromOpen) { G.player.position.set(sp.x, 0, sp.z); G.vel.set(0, 0, 0); G.vy = 0; G.facing = sp.f; G.yaw = sp.f - Math.PI; for (let i = 0; i < 16; i++) G.spawnDust(sp.x, 0, sp.z, 1.2, 1.6, 0, 0, 0x9ff5c8); }
  G.hp = G.HPMAX; MK.t0 = G.elapsed;
  const hasMon = MK.recs.some(r => r.it.act === 'mon'), hasFin = MK.recs.some(r => r.it.act === 'finish');
  G.showMsg('▶️ ' + G.adT('Oyna!') + (hasFin ? ' ' + G.adT('🏁 Bitiş bayrağına ulaş') : ''), 1.8);
  mkModeUI();
}
function mkStartEdit(fromOpen) { MK.edit = true; for (const r of MK.recs) mkResetRt(r); mkModeUI(); if (!fromOpen) G.showMsg('✏️ ' + G.adT('Düzenleme'), 1); }
function mkResetRt(rec) {
  const rt = rec.rt, a = rec.it.act; rec.g.visible = true;
  if (mkDyn(rec.it)) { rec.g.position.set(rt.hx, rec.o.y || 0, rt.hz); rec.g.rotation.y = rt.face; rec.inner.rotation.set(0, 0, 0); rec.inner.position.set(0, 0, 0); }
  if (a === 'mon') { rt.hp = rt.max; rt.st = 'idle'; rt.dead = 0; rt.kx = rt.kz = 0; rt.tx = rt.hx; rt.tz = rt.hz; }
  if (a === 'npc') { rt.tx = rt.hx; rt.tz = rt.hz; rt.wp = 0; rt.wait = Math.random(); }
  if (a === 'coin' || a === 'heart') { rt.got = false; rt.back = 0; }
  if (a === 'chest') { rt.open = 0; rt.got = false; }
}
function mkRespawn(rv) {
  rv(); const c = MK.check || MK.recs.find(r => r.it.act === 'spawn');
  const p = c ? c.g.position : mkSpawnPt();
  G.player.position.set(p.x, (c && c.o.y) || 0, p.z); G.vel.set(0, 0, 0); G.vy = 0; G.onGround = true;
  for (let i = 0; i < 16; i++) G.spawnDust(p.x, 0, p.z, 1.2, 1.6, 0, 0, 0x9ff5c8); G.showMsg('💫 ' + G.adT('Tekrar dene!'), 1.2);
}
function mkHurt(msg) {   // lav / diken: kontrol noktasından devam
  if (MK.hurtT > 0 || G.dead) return; MK.hurtT = 1;
  const P = G.player.position; for (let i = 0; i < 18; i++) G.spawnDust(P.x, P.y + .5, P.z, .8, 2, 0, 0, 0xff7a1a); G.play('hit', { oof: true }); G.shake = Math.max(G.shake, .35); G.hurtFlash = 1;
  const c = MK.check || MK.recs.find(r => r.it.act === 'spawn'), p = c ? c.g.position : mkSpawnPt();
  G.player.position.set(p.x, ((c && c.o.y) || 0) + .2, p.z); G.vel.set(0, 0, 0); G.vy = 0; G.showMsg(msg, 1.3);
}
// giyinme odasından dönüş
function mkFromCloset() { const b = MK.pitBack || mkSpawnPt(); G.teleportTo('maker', b.x, b.z + 3.6, 0, '⬆️ ' + G.adT('Haritana döndün'), () => { if (MK.pitRec) { MK.pitRec.rt.k = 0; MK.pitRec.rt.cool = 1.5; mkPitSet(MK.pitRec.inner, 0); } }); }
function mkFallCloset(rec) {
  if (G.teleporting) return; MK.pitBack = { x: rec.g.position.x, z: rec.g.position.z }; MK.pitRec = rec; G.play('fall');
  const A = G.AREAS.closet;
  G.teleportTo('closet', A.cx, A.cz + .2, Math.PI, null, () => { G.player.position.y = 4.3; G.onGround = false; G.vy = -3; G.CLOSET.arriving = true; G.CLOSET.visits++; G.CLOSET.returnTo = 'maker'; });
}
// yumruk: canavarlara hasar, NPC'ler sendeler
function mkPunch(dir) {
  const P = G.player.position;
  for (const rec of MK.recs) {
    const a = rec.it.act; if (a !== 'mon' && a !== 'npc' && a !== 'pet') continue;
    const q = rec.g.position, dx = q.x - P.x, dz = q.z - P.z, d = Math.hypot(dx, dz);
    if (d > 2.3 * Math.max(1, rec.o.s || 1) || Math.abs(q.y - P.y) > 1.6) continue;
    if (d > .2 && (dx * dir.x + dz * dir.z) / d < Math.cos(65 * G.DEG)) continue;
    const rt = rec.rt; for (let i = 0; i < 10; i++) G.spawnDust(q.x - dir.x * .4, q.y + 1.1, q.z - dir.z * .4, .3, 1.4, dir.x * 2, dir.z * 2, a === 'mon' ? 0xc77dff : 0xffffff); G.shake = Math.max(G.shake, .22);
    if (a === 'mon' && !MK.edit && rt.st !== 'dead') {
      const dmg = 25 * (G.ADM.ohk ? 99 : G.ADM.superPunch ? 4 : 1); rt.hp -= dmg; rt.kx = dir.x * 7; rt.kz = dir.z * 7; rt.st = 'chase'; G.play(rt.hp <= 0 ? 'monster' : 'hit', { at: q, range: 50 });
      if (rt.hp <= 0) { rt.st = 'dead'; rt.dead = 0; G.progAdd(5, q); }
    } else if (a === 'npc') { rt.hitT = .7; rt.kx = dir.x * 4; rt.kz = dir.z * 4; rt.ouch = 1.6; G.play('hit', { gain: .4 }); }
    else if (a === 'pet') { rt.kx = dir.x * 4; rt.kz = dir.z * 4; G.play(rec.o.t === 'cat' ? 'meow' : 'bark', { gain: .6 }); }
  }
}

/* ---------- ✏️ düzenleme: nişan, hayalet önizleme, koy / seç / taşı ---------- */
const MK_GHOST_MATS = new Map();
function mkGhostMat(m) {
  if (!m || m.isShaderMaterial) return null;
  let c = MK_GHOST_MATS.get(m); if (!c) { c = m.clone(); c.transparent = true; c.opacity = Math.min(m.opacity ?? 1, .55); c.depthWrite = false; MK_GHOST_MATS.set(m, c); }
  return c;
}
function mkGhostClear() { if (MK.ghost) { G.scene.remove(MK.ghost); MK.ghost = null; } MK.ghostKey = ''; if (MK.ring) MK.ring.visible = false; }
function mkGhostSrc() { return MK.moving ? MK.moving.o : mkProto(); }
function mkGhostSet() {
  const o = mkGhostSrc(), it = MK_I[o.t], key = (MK.moving ? 'mv' + MK.recs.indexOf(MK.moving) : '') + o.t + '|' + o.c + '|' + o.v + '|' + o.txt + '|' + o.hat + '|' + o.k;
  if (key === MK.ghostKey && MK.ghost) return;
  if (MK.ghost) G.scene.remove(MK.ghost);
  const inner = it.act === 'npc' ? mkNpcBuild(o) : it.act === 'mon' ? (it.mon === 'monster' ? G.PLACEHOLDERS.monster() : G.makeThemeRig(it.mon).stick) : it.f(o);
  inner.traverse(n => { if (!n.isMesh && !n.isSprite) return; if (n.isSprite) { n.material = n.material.clone(); n.material.opacity = .55; return; }
    if (Array.isArray(n.material)) n.material = n.material.map(m => mkGhostMat(m) || m); else { const g = mkGhostMat(n.material); if (g) n.material = g; else n.visible = false; } n.castShadow = false; });
  const g = new G.THREE.Group(); g.add(inner); G.scene.add(g); MK.ghost = g; MK.ghostKey = key;
  const bb = new G.THREE.Box3().setFromObject(inner), sz = bb.getSize(MK.tmp); MK.ghostR = Math.max(.6, Math.hypot(sz.x, sz.z) / 2);
}
function mkRecOf(obj) { let n = obj; while (n && n !== MK.root) { if (n.userData && n.userData.mkRec) return n.userData.mkRec; n = n.parent; } return null; }
function mkAimFrom(nx, ny) {
  MK.v2.set(nx, ny); MK.ray.setFromCamera(MK.v2, G.camera); MK.ray.far = 140;
  const R = MK.ray.ray, out = { point: null, rec: null, top: false, y: 0 };
  let hit = null;
  for (const h of MK.ray.intersectObject(MK.root, true)) {
    if (h.distance < 1.2 || h.object.isSprite) continue;
    let n = h.object, vis = true; while (n && n !== MK.root) { if (!n.visible) { vis = false; break; } n = n.parent; } if (!vis) continue;
    const rec = mkRecOf(h.object); if (!rec || rec === MK.moving) continue; hit = h; out.rec = rec; break;
  }
  let gp = null; if (R.direction.y < -.005) { const t = -R.origin.y / R.direction.y; if (t > 0 && t < 160) gp = R.origin.clone().addScaledVector(R.direction, t); }
  if (hit) {
    const nrm = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : null;
    if (nrm && nrm.y > .55 && hit.point.y > .1) { out.point = hit.point.clone(); out.top = true; out.y = hit.point.y; }
    else if (gp && gp.distanceTo(R.origin) < hit.distance + 6) out.point = gp; else { out.point = hit.point.clone(); out.point.y = 0; }
  } else if (gp) out.point = gp;
  return out;
}
function mkSnapXZ(x, z, it) {
  const sn = MK.map.env.snap; if (!sn) return [x, z];
  const st = it && it.road ? 6 : it && it.snap ? Math.max(it.snap, sn) : sn, A = mkA();
  return [A.cx + Math.round((x - A.cx) / st) * st, A.cz + Math.round((z - A.cz) / st) * st];
}
function mkAimUpdate(nx = 0, ny = 0) {
  const a = mkAimFrom(nx, ny), P = G.player.position, it = MK_I[mkGhostSrc().t];
  let p = a.point;
  if (!p || p.distanceTo(P) > 70) { p = new G.THREE.Vector3(P.x + Math.sin(G.facing) * 5, 0, P.z + Math.cos(G.facing) * 5); a.y = 0; a.top = false; }
  let [x, z] = mkSnapXZ(p.x, p.z, it);
  MK.aim.set(x, 0, z); MK.aimY = a.top ? a.y : 0; MK.aimOk = true; MK.aimRec = a.rec;
  const A = mkA(); MK.inB = Math.hypot(x - A.cx, z - A.cz) < A.r - 1;
  return a;
}
function mkProto() {
  const it = MK_I[MK.item], o = { t: it.id, r: +MK.rot.toFixed(3) };
  if (Math.abs(MK.scl - 1) > .01) o.s = +MK.scl.toFixed(2);
  if (it.col !== undefined && MK.col != null) o.c = MK.col;
  if (it.vary) o.v = MK.v % it.vary;
  if (it.txt) o.txt = (MK.txts && MK.txts[it.id]) || it.txt;
  if (it.npc) { o.mode = it.npc.mode; o.say = it.npc.say; o.hat = it.npc.hat; o.sp = it.npc.sp; }
  if (it.act === 'veh') o.k = MK.vehK || 'moto';
  return o;
}
const mkR2 = v => Math.round(v * 100) / 100;
function mkPlace() {
  if (!MK.map || !MK.edit) return;
  if (MK.route) { mkRouteAdd(); return; }
  if (!MK.inB) { G.showMsg(G.adT('🚫 Harita sınırının dışı'), 1); G.play('ui'); return; }
  const A = mkA(), lx = mkR2(MK.aim.x - A.cx), lz = mkR2(MK.aim.z - A.cz), y = MK.aimY > .05 ? mkR2(MK.aimY) : 0;
  if (MK.moving) {   // taşımayı bitir
    mkPush(); const rec = MK.moving, o = rec.o; o.x = lx; o.z = lz; if (y) o.y = y; else delete o.y;
    MK.moving = null; rec.g.visible = true; mkGhostClear(); mkRetransform(rec); if (rec.it.act === 'npc') mkRouteDraw(); mkSelect(rec); mkChanged(); G.play('pop'); mkUI(); return;
  }
  const it = MK_I[MK.item]; mkPush();
  if (it.one) for (const r of [...MK.recs]) if (r.it.id === it.id) { MK.map.objs.splice(MK.map.objs.indexOf(r.o), 1); mkRemove(r); }
  const o = mkProto(); o.x = lx; o.z = lz; if (y) o.y = y;
  MK.map.objs.push(o); const rec = mkAdd(o); if (it.vary) MK.v++;
  for (let i = 0; i < 8; i++) G.spawnDust(MK.aim.x, y, MK.aim.z, Math.min(2.5, MK.ghostR || 1), 1.2, 0, 0, 0xffffff);
  G.play('pop', { gain: .5 }); mkChanged(); MK.ghostKey = '';
  if (MK.map.objs.length === 1) G.showMsg(G.adT('✅ İlk eşyan yerinde! Devam et'), 1.4);
  return rec;
}
function mkSelect(rec) {
  MK.sel = rec; if (MK.box) { G.scene.remove(MK.box); MK.box = null; }
  if (rec) { MK.box = new G.THREE.BoxHelper(rec.g, 0xffd166); MK.box.material.depthTest = false; MK.box.renderOrder = 9; G.scene.add(MK.box); }
  mkRouteDraw(); mkUI();
}
function mkSelBox() { if (MK.box && MK.sel) MK.box.setFromObject(MK.sel.g); }
function mkPickAt(nx, ny) {
  const a = mkAimFrom(nx, ny); let rec = a.rec;
  if (!rec && a.point) { let bd = 3; for (const r of MK.recs) { const d = Math.hypot(r.g.position.x - a.point.x, r.g.position.z - a.point.z); if (d < bd) { bd = d; rec = r; } } }
  if (rec) G.play('ui'); mkSelect(rec || null);
  if (!rec) G.showMsg(G.adT('👆 Seçmek için bir eşyaya dokun / nişan al'), 1.1);
}
function mkCancel(quiet) {
  if (MK.moving) { MK.moving.g.visible = true; MK.moving = null; mkGhostClear(); }
  if (MK.route) { MK.route = null; }
  if (MK.sel) mkSelect(null);
  if (!quiet) mkUI();
}
function mkMoveStart() { if (!MK.sel) return; MK.moving = MK.sel; MK.sel.g.visible = false; if (MK.box) { G.scene.remove(MK.box); MK.box = null; } MK.ghostKey = ''; G.showMsg(G.adT('✋ Yeni yere nişan al, ✅ Koy ile bırak'), 1.6); mkUI(); }
function mkDel() {
  const rec = MK.sel || MK.moving; if (!rec) { G.showMsg(G.adT('🗑️ Önce silinecek eşyayı seç'), 1.1); return; }
  mkPush(); if (MK.moving) { MK.moving = null; mkGhostClear(); }
  MK.map.objs.splice(MK.map.objs.indexOf(rec.o), 1); const p = rec.g.position; for (let i = 0; i < 10; i++) G.spawnDust(p.x, p.y + .5, p.z, 1, 1.2, 0, 0, 0xaaaaaa);
  mkRemove(rec); mkSelect(null); G.play('pop', { gain: .3 }); mkChanged();
}
function mkDup() {
  const rec = MK.sel; if (!rec) return; mkPush();
  const o = JSON.parse(JSON.stringify(rec.o)), d = 2 + (rec.o.s || 1) * 1.5; o.x = mkR2(o.x + Math.cos(o.r || 0) * d); o.z = mkR2(o.z - Math.sin(o.r || 0) * d);
  if (o.route) o.route = o.route.map(([x, z]) => [mkR2(x + Math.cos(rec.o.r || 0) * d), mkR2(z - Math.sin(rec.o.r || 0) * d)]);
  MK.map.objs.push(o); const n = mkAdd(o); mkSelect(n); mkChanged(); G.play('pop', { gain: .5 });
}
function mkRotate(dir, step = Math.PI / 4) {
  const tg = MK.moving || MK.sel, it = tg ? tg.it : MK_I[MK.item];
  const st = it.road && MK.map.env.snap ? Math.PI / 2 : step;
  if (tg) { if (MK.sel && !MK.moving) mkPush(); tg.o.r = mkR2(((tg.o.r || 0) + dir * st) % (Math.PI * 2)); if (!MK.moving) { mkRetransform(tg); mkChanged(); } }
  else MK.rot = (MK.rot + dir * st) % (Math.PI * 2);
  G.play('ui', { gain: .4 });
}
function mkScale(dir) {
  const tg = MK.moving || MK.sel, k = dir > 0 ? 1.15 : 1 / 1.15;
  if (tg) { if (!MK.moving) mkPush(); tg.o.s = mkR2(G.THREE.MathUtils.clamp((tg.o.s || 1) * k, .2, 10)); if (Math.abs(tg.o.s - 1) < .02) delete tg.o.s; if (!MK.moving) { mkRetransform(tg); mkChanged(); } }
  else MK.scl = G.THREE.MathUtils.clamp(MK.scl * k, .2, 10);
  G.play('ui', { gain: .4 }); mkHudItem();
}
function mkRaise(dir) {
  const tg = MK.sel; if (!tg) { G.showMsg(G.adT('⬆️ Önce bir eşya seç'), 1); return; } mkPush();
  tg.o.y = mkR2(Math.max(0, (tg.o.y || 0) + dir * .5)); if (!tg.o.y) delete tg.o.y; mkRetransform(tg); mkChanged(); G.play('ui', { gain: .4 });
}
function mkSetColor(c) {
  const tg = MK.sel;
  if (tg) { if (tg.it.col === undefined) { G.showMsg(G.adT('🎨 Bu eşyanın rengi değişmez'), 1.1); return; } mkPush(); if (c == null) delete tg.o.c; else tg.o.c = c; mkRefresh(tg); mkChanged(); }
  else { MK.col = c; MK.ghostKey = ''; }
  G.play('ui', { gain: .4 }); mkHudItem();
}
function mkPickItem(id) {
  const it = MK_I[id]; if (!it) return; mkCancel(true); MK.item = id; MK.tool = 'place'; MK.rot = MK.rot || 0; MK.col = null; MK.ghostKey = '';
  MK.scl = it.npc ? it.npc.s : 1; if (it.hint) G.showMsg(it.ic + ' ' + G.adT(it.hint), 2); mkUI();
}
/* 🧭 NPC rotası */
function mkRouteStart() { const rec = MK.sel; if (!rec || rec.it.act !== 'npc') return; MK.route = rec; rec.o.route ||= []; mkDlgClose(); G.showMsg(G.adT('🧭 Rota noktalarını sırayla koy (✅ Koy ya da dokun)'), 2); mkRouteDraw(); mkUI(); }
function mkRouteAdd() {
  const rec = MK.route; if (!rec) return; if (!MK.inB) return; mkPush(); const A = mkA();
  rec.o.route.push([mkR2(MK.aim.x - A.cx), mkR2(MK.aim.z - A.cz)]); if (rec.o.route.length >= 2 && rec.o.mode !== 'route') rec.o.mode = 'route';
  G.play('pop', { gain: .4 }); mkRouteDraw(); mkChanged(); mkUI();
}
function mkRouteDraw() {
  if (MK.routeG) { G.scene.remove(MK.routeG); MK.routeG = null; }
  const rec = MK.route || (MK.sel && MK.sel.it.act === 'npc' ? MK.sel : null); if (!rec || !MK.edit || !G.inMaker) return;
  const R = rec.o.route || [], A = mkA(), g = new G.THREE.Group(), pts = [new G.THREE.Vector3(rec.rt.hx, .15, rec.rt.hz)];
  R.forEach(([x, z], i) => { const p = new G.THREE.Vector3(A.cx + x, .15, A.cz + z); pts.push(p);
    const f = G.mesh(new G.THREE.ConeGeometry(.25, .7, 8), G.M(0x3a86ff, { emissive: 0x3a86ff, emissiveIntensity: .6 }), p.x, .35, p.z); f.rotation.x = Math.PI; g.add(f);
    const s = new G.THREE.Sprite(new G.THREE.SpriteMaterial({ map: mkTextTex(String(i + 1), null, '#ffffff', 128, 128, '900'), transparent: true, depthWrite: false, depthTest: false })); s.position.set(p.x, 1.1, p.z); s.scale.set(.8, .8, 1); g.add(s); });
  if (R.length > 1) pts.push(pts[1].clone());
  if (pts.length > 1) { const l = new G.THREE.Line(new G.THREE.BufferGeometry().setFromPoints(pts), new G.THREE.LineBasicMaterial({ color: 0x9fd0ff, depthTest: false, transparent: true })); l.renderOrder = 8; g.add(l); }
  G.scene.add(g); MK.routeG = g;
}
function mkBird() {
  if (MK.bird) { G.dist = MK.bird.d; G.pitch = MK.bird.p; MK.bird = null; }
  else { MK.bird = { d: G.dist, p: G.pitch }; G.dist = 32; G.pitch = 1.32; }
  mkUI();
}

/* ---------- 💡 gece: en yakın 3 ateş / lamba gerçek ışık yayar (ışık sayısı sabit: gölgelendirici yeniden derlenmez) ---------- */
const MK_GLOWS = { lamp: [0xffd9a0, 3, 2.4, 16], campfire: [0xff8a2a, .9, 3.2, 15], torch: [0xffa040, 2, 2, 11], lightpole: [0xfff2d0, 5.8, 3.2, 28], floorlamp: [0xffe0b0, 1.6, 1.4, 8], lighthouse: [0xfff6c8, 12.8, 4, 40], pumpkin: [0xff9a3a, .5, .9, 5], neon: [0xff4fd8, 2.6, 1.6, 10], crystal: [0x4cc9f0, .8, 1, 7], stage: [0xd0bfff, 4.6, 2, 14] };
MK.lights = [0, 1, 2].map(() => { const l = new G.THREE.PointLight(0xffb060, 0, 14, 1.6); MK.root.add(l); return l; });
function mkLightsTick(lit) {
  const L = MK.lights; if (lit < .02) { for (const l of L) l.intensity = 0; return; }
  const P = G.player.position, c = [];
  for (const r of MK.recs) { const G = MK_GLOWS[r.o.t]; if (!G || !r.g.visible) continue; const d = Math.abs(r.g.position.x - P.x) + Math.abs(r.g.position.z - P.z); if (d < 70) c.push([d, r, G]); }
  c.sort((a, b) => a[0] - b[0]);
  L.forEach((l, i) => { const e = c[i]; if (!e) { l.intensity = 0; return; } const [, r, G] = e, s = r.o.s || 1; l.position.set(r.g.position.x, r.g.position.y + G[1] * s, r.g.position.z); l.color.setHex(r.o.t === 'neon' || r.o.t === 'crystal' ? (r.o.c ?? G[0]) : G[0]); l.distance = G[3] * Math.sqrt(s); l.intensity = G[2] * lit * (r.o.t === 'campfire' || r.o.t === 'torch' ? .85 + Math.sin(G.elapsed * 13 + i) * .15 : 1); });
}

/* ---------- ⏱️ her kare ---------- */
const MK_V3 = new G.THREE.Vector3();
function mkTick(dt) {
  if (!G.inMaker || !MK.map) return;
  const E = MK.map.env, P = G.player.position, t = G.elapsed;
  if (E.time !== 'auto') { G.DAY.t = +E.time; G.DAY.goto = null; }
  if (E.wx && E.wx !== 'auto') G.WX.cur = E.wx;
  MK_WATER_TEX.offset.x = (MK_WATER_TEX.offset.x + dt * .012) % 1; MK_WATER_TEX.offset.y = (MK_WATER_TEX.offset.y + dt * .008) % 1;
  if (MK_TEX.lavat) { MK_TEX.lavat.offset.x = (MK_TEX.lavat.offset.x + dt * .03) % 1; }
  const lit = G.THREE.MathUtils.smoothstep(G.DAY.N, .15, .7); for (const m of MK_WINMATS) m.emissiveIntensity = lit * 1.5;
  MK.lightT = (MK.lightT || 0) - dt; if (MK.lightT <= 0 || lit > .02) { MK.lightT = .25; mkLightsTick(lit); }
  if (MK.edge) MK.edge.visible = MK.edit;
  MK.hurtT = Math.max(0, (MK.hurtT || 0) - dt); MK.portT = Math.max(0, (MK.portT || 0) - dt); MK.boostT = Math.max(0, (MK.boostT || 0) - dt);
  if (dt > 0) { MK.saveT -= dt; if (MK.dirty && MK.saveT <= 0) mkSaveNow(true); }
  // canlandırmalar
  const cam = G.camera.position; let talk = null, td = 2.7; MK.near = null; let nd = 2.8;
  for (const rec of MK.recs) {
    const g = rec.g, gp = g.position, far = Math.abs(gp.x - cam.x) + Math.abs(gp.z - cam.z) > 170;
    const a = rec.it.act;
    if (!far) for (const [n, k, y0, s0, ph] of rec.an) {
      if (k === 'spin') n.rotation.z += dt * 1.3; else if (k === 'spinz') { n.rotation.z += dt; n.material.opacity = .45 + Math.sin(t * 3) * .12; }
      else if (k === 'spinc') { n.rotation.y += dt * 2.6; n.position.y = y0 + Math.sin(t * 2 + ph) * .08; } else if (k === 'flame') { n.scale.y = s0 * (1 + Math.sin(t * 15 + ph) * .18 + Math.sin(t * 7.3) * .1); n.scale.x = n.scale.z = 1 + Math.sin(t * 11 + ph) * .08; }
      else if (k === 'bob' || k === 'bobs') n.position.y = y0 + Math.sin(t * 1.6 + ph) * .15;
      else if (k === 'wave') { const pa = n.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i) + .9; pa.setZ(i, Math.sin(x * 3 - t * 5 + ph) * .12 * x); } pa.needsUpdate = true; }
      else if (k === 'lid') n.rotation.x = -(rec.rt.open || 0) * 1.7;
    }
    if (a === 'npc') { const r = mkNpcTick(rec, dt, far); if (r != null && r < td) { td = r; talk = rec; } }
    else if (a === 'mon') mkMonTick(rec, dt, far);
    else if (a === 'pet') mkPetTick(rec, dt, far);
    else if (a === 'pit') {
      const rt = rec.rt, d = Math.hypot(P.x - gp.x, P.z - gp.z), s = rec.o.s || 1; rt.cool -= dt;
      const open = d < 5 * s && P.y < gp.y + 4 && rt.cool <= 0 && !G.giant, was = rt.k;
      rt.k = G.THREE.MathUtils.clamp(rt.k + (open ? dt / 1.1 : -dt / 1), 0, 1);
      if (rt.k !== was) { mkPitSet(rec.inner, rt.k); if (was === 0 || was === 1) G.play('iris', { at: gp, range: 40 }); if (rt.k === 0 || rt.k === 1) G.play('iris', { at: gp, range: 40, clank: true }); }
      if (!MK.edit && rt.k > .85 && d < MK_PIT_R * s * .85 && P.y < gp.y + .6 && !G.teleporting && !G.dead) mkFallCloset(rec);
    }
    if (MK.edit || far) continue;
    // ▶️ oyunda dokununca olanlar
    const dx = P.x - gp.x, dz = P.z - gp.z, d = Math.hypot(dx, dz), s = rec.o.s || 1, rt = rec.rt, dy = P.y - gp.y;
    if (a === 'coin') { if (!rt.got && d < .8 * s + .35 && dy > -1 && dy < 1.8 * s) { rt.got = true; g.visible = false; MK.coins = (MK.coins || 0) + 1; G.progAdd(1, gp); for (let i = 0; i < 8; i++) G.spawnDust(gp.x, gp.y + .9, gp.z, .4, 1.5, 0, 0, 0xffd166); } }
    else if (a === 'heart') { if (rt.got) { rt.back -= dt; if (rt.back <= 0) { rt.got = false; g.visible = true; } } else if (d < 1 * s && dy > -1 && dy < 2 && G.hp < G.HPMAX) { rt.got = true; rt.back = 25; g.visible = false; G.hp = Math.min(G.HPMAX, G.hp + 50); G.play('magic', { gain: .6 }); G.showMsg('❤️ +50', .9); } }
    else if (a === 'tramp') { if (d < 1.25 * s && dy > -.3 && dy < 1 && G.vy <= 0.5) { G.vy = 15 + 3 * s; G.onGround = false; G.play('boing'); for (let i = 0; i < 6; i++) G.spawnDust(P.x, gp.y + .6, P.z, .6, 1, 0, 0, 0xffffff); } }
    else if (a === 'boost') { const c = Math.cos(rec.o.r || 0), sn = Math.sin(rec.o.r || 0), lx = (c * dx - sn * dz) / s, lz = (sn * dx + c * dz) / s;
      if (Math.abs(lx) < 1 && Math.abs(lz) < 1.5 && dy > -.3 && dy < .8 && MK.boostT <= 0) { MK.boostT = .4; G.vel.set(sn * 26, 0, c * 26); G.facing = rec.o.r || 0; G.play('boost'); G.shake = Math.max(G.shake, .15); } }
    else if (a === 'lava') { const c = Math.cos(rec.o.r || 0), sn = Math.sin(rec.o.r || 0), lx = (c * dx - sn * dz) / s, lz = (sn * dx + c * dz) / s, hw = rec.it.id === 'spikes' ? 1 : 2;
      if (Math.abs(lx) < hw && Math.abs(lz) < hw && dy > -.3 && dy < (rec.it.id === 'spikes' ? .55 : .12) && !G.FLY.on) mkHurt(rec.it.id === 'spikes' ? G.adT('🔺 Ay! Diken!') : G.adT('🔥 Lava düştün!')); }
    else if (a === 'check') { if (d < 1.3 * s && MK.check !== rec) { MK.check = rec; G.play('ding'); G.showMsg('🚩 ' + G.adT('Kontrol noktası!'), 1.2); for (let i = 0; i < 14; i++) G.spawnDust(gp.x, gp.y + .5, gp.z, .8, 2, 0, 0, 0x06d6a0); } }
    else if (a === 'finish') { if (d < 2.3 * s && dy > -1 && dy < 4 && !MK.finished) { MK.finished = true; const tm = G.elapsed - MK.t0; G.play('goal'); G.shake = .3;
      const best = MK.map.best && MK.map.best < tm ? MK.map.best : tm, rec2 = !MK.map.best || tm < MK.map.best; MK.map.best = +best.toFixed(2); MK.dirty = true; MK.saveT = 1;
      G.showMsg(`🏁 ${G.adT('Bitirdin!')} ${tm.toFixed(1)} sn${rec2 ? ' · ' + G.adT('🏆 Rekor!') : ' · ' + G.adT('Rekor') + ': ' + best.toFixed(1)}`, 3); for (let i = 0; i < 40; i++) G.spawnDust(gp.x, gp.y + 2, gp.z, 2.5, 3, 0, 0, [0xffd166, 0x06d6a0, 0xe63946][i % 3]); } }
    else if (a === 'portal') { if (d < 1.1 * s && dy > -.5 && dy < 2.5 && MK.portT <= 0) { const col = rec.o.c ?? MK_I.portal.col, list = MK.recs.filter(r => r.it.act === 'portal' && (r.o.c ?? MK_I.portal.col) === col);
      if (list.length < 2) { if (!rt.warned) { rt.warned = true; G.showMsg(G.adT('🌀 Aynı renkte ikinci bir kapı koy'), 1.6); } }
      else { const nx = list[(list.indexOf(rec) + 1) % list.length], q = nx.g.position, f = nx.o.r || 0; MK.portT = 1.4; G.player.position.set(q.x + Math.sin(f) * 2.2 * (nx.o.s || 1), q.y, q.z + Math.cos(f) * 2.2 * (nx.o.s || 1)); G.vel.set(0, 0, 0); G.facing = f; G.yaw = f - Math.PI; G.play('portal'); for (let i = 0; i < 20; i++) G.spawnDust(q.x, q.y + 1, q.z, 1.2, 2, 0, 0, col); } } }
    else if (a === 'chest') { if (!rt.got && d < 1.7 * s) { rt.got = true; G.play('magic'); G.progAdd(rec.o.coins || 10, gp); G.showMsg('🧰 ' + G.adT('Hazine!'), 1.2); } if (rt.got) rt.open = Math.min(1, (rt.open || 0) + dt * 2.5); }
    else if (a === 'veh') { if (d < 2.8 * s && d < nd) { nd = d; MK.near = rec; } }
  }
  mkBubble(MK.edit ? null : talk);
  if (MK.edit) mkEditTick(dt); else mkPlayHud();
  mkActBtn();
}
function mkEditTick(dt) {
  if (!G.started || G.paused) return;
  const busy = MK.catOpen && G.touchMode;
  MK.rayT -= dt;
  if (MK.rayT <= 0) { MK.rayT = G.touchMode ? .06 : .03; if (MK.tool !== 'pick' || MK.moving || MK.route) mkAimUpdate(); }
  const show = !busy && (MK.tool !== 'pick' || MK.moving) && !MK.route;
  if (show) {
    mkGhostSet(); const g = MK.ghost, src = mkGhostSrc();
    g.visible = true; g.position.set(MK.aim.x, MK.aimY, MK.aim.z); g.rotation.y = src.r || 0; g.scale.setScalar(src.s || 1);
    if (!MK.ring) { MK.ring = new G.THREE.Mesh(new G.THREE.RingGeometry(.92, 1, 40).rotateX(-Math.PI / 2), new G.THREE.MeshBasicMaterial({ color: 0x06d6a0, transparent: true, opacity: .8, depthTest: false })); MK.ring.renderOrder = 9; G.scene.add(MK.ring); }
    MK.ring.visible = true; MK.ring.position.set(MK.aim.x, MK.aimY + .06, MK.aim.z); MK.ring.scale.setScalar((MK.ghostR || 1) * (src.s || 1)); MK.ring.material.color.setHex(MK.inB ? 0x06d6a0 : 0xe63946);
  } else { if (MK.ghost) MK.ghost.visible = false; if (MK.ring) MK.ring.visible = !!MK.route; if (MK.route && MK.ring) { MK.ring.position.set(MK.aim.x, .06, MK.aim.z); MK.ring.scale.setScalar(.6); MK.ring.material.color.setHex(0x3a86ff); } }
  if (MK.sel && MK.box) MK.box.update();
}
function mkPlayHud() {
  const el = MK.hudEl; if (!el) return;
  const fin = MK.recs.some(r => r.it.act === 'finish'), coins = MK.recs.filter(r => r.it.act === 'coin').length;
  const parts = []; if (fin && !MK.finished) parts.push('⏱️ ' + (G.elapsed - MK.t0).toFixed(1)); if (coins) parts.push(`🪙 ${MK.coins || 0}/${coins}`); if (MK.map.best && fin) parts.push('🏆 ' + MK.map.best.toFixed(1));
  const s = parts.join(' · '); if (s !== MK.hudS) { MK.hudS = s; el.textContent = s; el.style.display = s ? 'block' : 'none'; }
}
/* 🧍 NPC davranışı */
function mkNpcTick(rec, dt, far) {
  const o = rec.o, rt = rec.rt, g = rec.g, h = g.position, P = G.player.position, s = o.s || 1, rig = rt.rig;
  rt.t += dt;
  if (MK.edit || rec === MK.moving) { if (!far && rig) G.animateStick(rig, dt, { speed: 0 }); return null; }
  const dP = Math.hypot(P.x - h.x, P.z - h.z), lines = String(o.say || '').split('|').map(x => x.trim()).filter(Boolean);
  const talking = lines.length && dP < 2.6 * Math.max(1, s) && Math.abs(P.y - h.y) < 2;
  let sp = 0, tf = null; const SPD = (MK_SPEEDS.find(x => x[0] === o.sp) || MK_SPEEDS[1])[2] * Math.sqrt(s);
  if (rt.hitT > 0) { rt.hitT -= dt; h.x += rt.kx * dt; h.z += rt.kz * dt; rt.kx *= .9; rt.kz *= .9; }
  else if (talking) tf = Math.atan2(P.x - h.x, P.z - h.z);
  else if (o.mode === 'wander' || (o.mode === 'route' && (o.route || []).length >= 1)) {
    const A = mkA(); let tx = rt.tx, tz = rt.tz;
    if (o.mode === 'route') { const R = o.route, w = R[rt.wp % R.length]; tx = A.cx + w[0]; tz = A.cz + w[1]; }
    const dx = tx - h.x, dz = tz - h.z, dd = Math.hypot(dx, dz);
    if (rt.wait > 0) rt.wait -= dt;
    else if (dd < .35) { rt.wait = o.mode === 'route' ? .5 : 1 + Math.random() * 3; if (o.mode === 'route') rt.wp++; else { const a = Math.random() * 6.28, r = 2 + Math.random() * 6 * s; rt.tx = rt.hx + Math.cos(a) * r; rt.tz = rt.hz + Math.sin(a) * r; if (Math.hypot(rt.tx - A.cx, rt.tz - A.cz) > A.r - 3) { rt.tx = rt.hx; rt.tz = rt.hz; } } }
    else { sp = SPD; const st = Math.min(dd, sp * dt); h.x += dx / dd * st; h.z += dz / dd * st; tf = Math.atan2(dx, dz); }
  } else if (o.mode === 'stand') tf = dP < 7 ? Math.atan2(P.x - h.x, P.z - h.z) : rt.face;
  if (o.mode === 'dance' && !talking) { g.rotation.y += dt * 1.2; }
  else if (tf != null) g.rotation.y += G.wrapAng(tf - g.rotation.y) * Math.min(1, dt * 7);
  h.y = MK.ramps.length ? mkRampAt(h.x, h.z, (o.y || 0) + .8, o.y || 0) : (o.y || 0);
  if (dP < .75 * s && !G.FLY.on) G.separate(P, h, .7 * s);
  if (!far && rig) {
    G.animateStick(rig, dt, { speed: sp * 1.4 / Math.sqrt(s), running: sp > 3 });
    if (o.mode === 'dance' && !talking) { const k = rt.t * 7; rig.armL.sh.rotation.set(Math.sin(k) * .4, 0, 2.3 + Math.sin(k) * .5); rig.armR.sh.rotation.set(-Math.sin(k) * .4, 0, -2.3 - Math.cos(k) * .5); rig.armL.el.rotation.x = rig.armR.el.rotation.x = -.6; rig.hips.position.y = 1 + Math.abs(Math.sin(k)) * .06; rig.legL.hip.rotation.x = Math.sin(k) * .4; rig.legR.hip.rotation.x = -Math.sin(k) * .4; }
    if (talking && rt.lineT <= 0) rig.armR.sh.rotation.z = -.4 - Math.abs(Math.sin(rt.t * 3)) * .4;
  }
  if (rt.ouch > 0) { rt.ouch -= dt; return dP < 6 ? dP * .5 : null; }
  return talking ? dP : null;
}
function mkBubble(rec) {
  const el = MK.bubEl; if (!el) return;
  if (!rec) { if (el.style.display !== 'none') el.style.display = 'none'; MK.bubRec = null; return; }
  const rt = rec.rt, lines = String(rec.o.say || '').split('|').map(x => x.trim()).filter(Boolean);
  if (MK.bubRec !== rec) { MK.bubRec = rec; rt.lineT = 0; G.play('talk', { gain: .35 }); }
  rt.lineT -= G.DT_LAST; if (rt.lineT <= 0) { rt.lineT = 3.4; rt.lineI = (rt.lineI + 1) % Math.max(1, lines.length); }
  const txt = rt.ouch > 0 ? G.adT('Ayy! 😵 Neden vurdun?') : (rec.o.name ? `<b>${mkEsc(rec.o.name)}:</b> ` : '') + mkEsc(lines[rt.lineI % lines.length] || '');
  if (el.innerHTML !== txt) el.innerHTML = txt;
  const s = rec.o.s || 1; MK_V3.set(rec.g.position.x, rec.g.position.y + 2.55 * s, rec.g.position.z).project(G.camera);
  if (MK_V3.z > 1) { el.style.display = 'none'; return; }
  el.style.display = 'block'; el.style.left = ((MK_V3.x + 1) / 2 * innerWidth) + 'px'; el.style.top = ((1 - MK_V3.y) / 2 * innerHeight) + 'px';
}
const mkEsc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/* 👹 canavar davranışı */
function mkMonTick(rec, dt, far) {
  const o = rec.o, rt = rec.rt, g = rec.g, h = g.position, P = G.player.position, s = o.s || 1;
  const anim = (sp) => {
    if (far) return;
    if (rt.rig) G.animateStick(rt.rig, dt, { speed: sp, running: sp > 2.5 });
    else if (rt.parts) { rt.ph += dt * (2 + sp * 2.2); const sw = Math.sin(rt.ph) * Math.min(1, sp / 2) * .7, pp = rt.parts; pp.legL.rotation.x = sw; pp.legR.rotation.x = -sw; pp.armL.rotation.x = -sw * .8 + (rt.atkA || 0); pp.armR.rotation.x = sw * .8 + (rt.atkA || 0); pp.body.position.y = Math.abs(Math.sin(rt.ph)) * .05; pp.head.rotation.y = Math.sin(G.elapsed * .7) * .3; }
  };
  if (MK.edit || rec === MK.moving) { anim(0); return; }
  if (rt.st === 'dead') { rt.dead += dt; rec.inner.rotation.x = Math.min(Math.PI / 2, rt.dead * 3); rec.inner.position.y = -Math.max(0, rt.dead - 2) * .4;
    if (rt.dead > 9) { rt.st = 'idle'; rt.hp = rt.max; rec.inner.rotation.x = 0; rec.inner.position.y = 0; h.set(rt.hx, o.y || 0, rt.hz); for (let i = 0; i < 16; i++) G.spawnDust(h.x, .5, h.z, 1, 2, 0, 0, 0xc77dff); } return; }
  const dx = P.x - h.x, dz = P.z - h.z, d = Math.hypot(dx, dz), hd = Math.hypot(h.x - rt.hx, h.z - rt.hz);
  let tx = rt.tx, tz = rt.tz, sp = 0;
  const SP = (o.spd || 1) * (rec.it.mon === 'zombie' ? 1.7 : rec.it.mon === 'skeleton' ? 2.6 : 2.3) * Math.sqrt(s);
  if (!G.dead && !G.FLY.on && d < 14 * s && hd < 40 && Math.abs(P.y - h.y) < 4) { rt.st = 'chase'; tx = P.x; tz = P.z; sp = d > 1.3 * s ? SP : 0; }
  else { if (rt.st === 'chase') { rt.st = 'idle'; rt.tx = rt.hx; rt.tz = rt.hz; } const td = Math.hypot(tx - h.x, tz - h.z); if (rt.wait > 0) rt.wait -= dt; else if (td < .4) { rt.wait = 1.5 + Math.random() * 2.5; const a = Math.random() * 6.28, r = 1 + Math.random() * 5; rt.tx = rt.hx + Math.cos(a) * r; rt.tz = rt.hz + Math.sin(a) * r; } else sp = SP * .4; tx = rt.tx; tz = rt.tz; }
  const mx = tx - h.x, mz = tz - h.z, md = Math.hypot(mx, mz) || 1;
  if (sp > 0) { h.x += mx / md * sp * dt; h.z += mz / md * sp * dt; g.rotation.y += G.wrapAng(Math.atan2(mx, mz) - g.rotation.y) * Math.min(1, dt * 8); }
  else if (rt.st === 'chase') g.rotation.y += G.wrapAng(Math.atan2(dx, dz) - g.rotation.y) * Math.min(1, dt * 8);
  h.x += rt.kx * dt; h.z += rt.kz * dt; rt.kx *= Math.exp(-6 * dt); rt.kz *= Math.exp(-6 * dt);
  const A = mkA(), ar = Math.hypot(h.x - A.cx, h.z - A.cz); if (ar > A.r - 1) { h.x = A.cx + (h.x - A.cx) * (A.r - 1) / ar; h.z = A.cz + (h.z - A.cz) * (A.r - 1) / ar; }
  rt.atk -= dt; rt.atkA = Math.max(0, (rt.atkA || 0) - dt * 4);
  if (rt.st === 'chase' && d < 1.5 * s && rt.atk <= 0 && !G.dead) { rt.atk = 1.3; rt.atkA = -1.6; if (rt.rig) { rt.rig.armR.sh.rotation.x = -2; } G.damagePlayer(rec.it.mon === 'skeleton' ? 12 : 10, new G.THREE.Vector3(dx / (d || 1), 0, dz / (d || 1))); }
  if (d < .9 * s) G.separate(P, h, .9 * s);
  anim(sp);
  if (!far && rt.hp < rt.max && rt.st !== 'dead') { if (!rt.bar) { rt.bar = new G.THREE.Sprite(new G.THREE.SpriteMaterial({ color: 0xe63946, depthWrite: false })); rt.bar.center.set(0, .5); rec.g.add(rt.bar); } rt.bar.visible = true; rt.bar.position.set(-.5, 2.6, 0); rt.bar.scale.set(Math.max(.02, rt.hp / rt.max), .1, 1); }
  else if (rt.bar) rt.bar.visible = false;
}
/* 🐕 evcil hayvan */
function mkPetTick(rec, dt, far) {
  const rt = rec.rt, h = rec.g.position, g = rec.g;
  if (MK.edit || rec === MK.moving) return;
  rt.ph += dt; if (rt.kx) { h.x += rt.kx * dt; h.z += (rt.kz || 0) * dt; rt.kx *= .9; rt.kz *= .9; if (Math.abs(rt.kx) < .05) rt.kx = rt.kz = 0; }
  const P = G.player.position, dP = Math.hypot(P.x - h.x, P.z - h.z);
  if (dP < 7 && dP > 1.6 && rec.o.t === 'pet') { rt.tx = P.x; rt.tz = P.z; rt.wait = 0; }
  const dx = rt.tx - h.x, dz = rt.tz - h.z, d = Math.hypot(dx, dz);
  if (rt.wait > 0) rt.wait -= dt; else if (d < .5) { rt.wait = 1 + Math.random() * 3; const a = Math.random() * 6.28, r = 1 + Math.random() * 4; rt.tx = rt.hx + Math.cos(a) * r; rt.tz = rt.hz + Math.sin(a) * r; }
  else { const sp = dP < 7 && rec.o.t === 'pet' ? 3 : 1.1; h.x += dx / d * sp * dt; h.z += dz / d * sp * dt; g.rotation.y += G.wrapAng(Math.atan2(dx, dz) - g.rotation.y) * Math.min(1, dt * 6); if (!far) { rec.inner.position.y = Math.abs(Math.sin(rt.ph * 9)) * .04; const PP = rec.inner.userData.pet; if (PP && PP.legs) PP.legs.forEach((l, i) => { if (l && l.rotation) l.rotation.x = Math.sin(rt.ph * 11 + (i % 2) * Math.PI + (i > 1 ? Math.PI / 2 : 0)) * .55; }); } return; }
  const PP = rec.inner.userData.pet; if (!far && PP && PP.legs) PP.legs.forEach(l => { if (l && l.rotation) l.rotation.x *= .85; });
}

/* ---------- 🖥️ arayüz ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>
#mkTop{position:fixed;left:50%;top:calc(8px + env(safe-area-inset-top));transform:translateX(-50%);z-index:6;display:none;gap:5px;align-items:center;background:rgba(10,20,35,.84);padding:5px 6px;border-radius:12px;color:#fff;font:700 13px system-ui,sans-serif;backdrop-filter:blur(4px);max-width:calc(100vw - 250px)}
body.mk #mkTop{display:flex}
#mkTop button,#mkItemBtn button,#mkSel button,.mkB{border:0;border-radius:9px;padding:7px 9px;background:#2b3a52;color:#fff;font:700 13px system-ui,sans-serif;cursor:pointer;white-space:nowrap;touch-action:manipulation}
#mkTop button:hover,#mkItemBtn button:hover,#mkSel button:hover,.mkB:hover{background:#3a4f70}
#mkName{max-width:26vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 6px;cursor:pointer}
#mkTop .mode{background:#06d6a0;color:#06261d}body.mkEdit #mkTop .mode{background:#ffd166;color:#1b1b1b}
#mkTools{position:fixed;right:calc(8px + env(safe-area-inset-right));top:calc(56px + env(safe-area-inset-top));z-index:6;display:none;grid-template-columns:48px 48px;gap:6px}
body.mkEdit #mkTools{display:grid}
#mkTools button{width:48px;height:46px;border-radius:14px;border:2px solid rgba(255,255,255,.5);background:rgba(10,20,35,.66);color:#fff;font-size:19px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0;cursor:pointer;touch-action:manipulation;backdrop-filter:blur(3px)}
#mkTools button small{font-size:9px;font-weight:800;margin-top:1px}
#mkTools .big{grid-column:1/3;width:auto;height:54px;background:rgba(6,214,160,.78);font-size:23px}
#mkTools button.on{background:rgba(255,209,102,.88);color:#1b1b1b;border-color:#ffd166}
#mkTools button:active{transform:scale(.93)}
#mkItemBtn{position:fixed;left:calc(10px + env(safe-area-inset-left));top:calc(100px + env(safe-area-inset-top));z-index:6;display:none;gap:6px;align-items:center}
body.mkEdit #mkItemBtn{display:flex}
#mkItemBtn #mkCur{display:flex;align-items:center;gap:6px;background:rgba(10,20,35,.82);border:2px solid #ffd166;font-size:14px;padding:6px 10px}
#mkCur span{font-size:22px;line-height:1}#mkCur small{opacity:.7;font-size:11px}
#mkColBtn{width:38px;height:38px;border-radius:50%!important;padding:0!important;border:2px solid #fff!important;font-size:17px}
#mkSel{position:fixed;left:50%;bottom:calc(10px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:6;display:none;flex-wrap:wrap;justify-content:center;gap:5px;background:rgba(10,20,35,.86);padding:6px;border-radius:12px;max-width:min(600px,calc(100vw - 340px));color:#fff;font:700 12px system-ui,sans-serif;align-items:center}
#mkSel.on{display:flex}#mkSel .lbl{padding:0 6px;opacity:.85}
#mkSel .del{background:#c1121f}#mkSel .ok{background:#06d6a0;color:#06261d}
body:not(.touch) #mkSel{max-width:min(720px,calc(100vw - 160px))}
#mkCat{position:fixed;left:calc(8px + env(safe-area-inset-left));top:calc(52px + env(safe-area-inset-top));bottom:calc(8px + env(safe-area-inset-bottom));width:min(400px,54vw);z-index:12;display:none;flex-direction:column;background:rgba(12,18,30,.96);color:#fff;border-radius:14px;border:1px solid rgba(140,170,255,.25);font:13px system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.4)}
#mkCat.on{display:flex}
#mkCat .mch{display:flex;gap:6px;align-items:center;padding:8px 8px 2px}#mkCat .mch b{font-size:15px;white-space:nowrap}
#mkQ{flex:1;min-width:60px;background:#1b2535;color:#fff;border:1px solid #3a4658;border-radius:8px;padding:6px 8px;font:13px system-ui,sans-serif}
#mkCat .mkTabs{display:flex;gap:4px;overflow-x:auto;padding:6px 8px;touch-action:pan-x;scrollbar-width:thin}
#mkCat .mkTabs button{flex:0 0 auto;border:0;border-radius:9px;padding:6px 8px;background:#24324a;color:#fff;font:700 12px system-ui,sans-serif;cursor:pointer;white-space:nowrap}
#mkCat .mkTabs button.on{background:#ffd166;color:#1b1b1b}
#mkGrid{flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:6px;padding:4px 8px 8px;align-content:start;touch-action:pan-y;-webkit-overflow-scrolling:touch}
#mkGrid button{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 3px;border-radius:11px;border:2px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:#fff;cursor:pointer;font:inherit;touch-action:manipulation}
#mkGrid button span{font-size:27px;line-height:1}#mkGrid button small{font-size:10.5px;text-align:center;line-height:1.15;font-weight:600}
#mkGrid button.on{border-color:#ffd166;background:rgba(255,209,102,.18)}
#mkCat .mkFoot{padding:6px 10px 10px;font-size:11px;opacity:.7;line-height:1.35}
#mkDlg{position:fixed;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(3,6,12,.58)}
#mkDlg.on{display:flex}
#mkDlg .box{width:min(540px,94vw);max-height:88vh;overflow-y:auto;background:rgba(16,22,34,.98);color:#eef3ff;border:1px solid rgba(140,170,255,.25);border-radius:16px;padding:14px;font:13px system-ui,sans-serif;touch-action:pan-y;-webkit-overflow-scrolling:touch;user-select:text}
#mkDlg .mkH{display:flex;align-items:center;gap:8px;margin-bottom:8px}#mkDlg .mkH b{flex:1;font-size:17px}
#mkDlg .mkSub{font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.6;font-weight:800;margin:14px 0 6px}
#mkDlg .mkRow{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
#mkDlg .mkOpts{display:flex;flex-wrap:wrap;gap:5px}#mkDlg .mkOpts button{border:1.5px solid rgba(255,255,255,.15);border-radius:9px;padding:6px 9px;background:rgba(255,255,255,.07);color:#fff;font:700 12px system-ui,sans-serif;cursor:pointer}
#mkDlg .mkOpts button.on{background:#ffd166;color:#1b1b1b;border-color:#ffd166}
#mkDlg .mkSw{display:flex;flex-wrap:wrap;gap:6px}#mkDlg .mkSw button{width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,.35);cursor:pointer;padding:0}#mkDlg .mkSw button.on{border:3px solid #fff;box-shadow:0 0 0 2px #ffd166}
#mkDlg input[type=text],#mkDlg textarea,#mkDlg select{width:100%;box-sizing:border-box;background:#1b2535;color:#fff;border:1px solid #3a4658;border-radius:8px;padding:8px 9px;font:14px system-ui,sans-serif}
#mkDlg textarea{min-height:64px;resize:vertical}
#mkDlg .pri{background:#06d6a0;color:#06261d}#mkDlg .warn{background:#c1121f}
#mkDlg .mkMap{border-top:1px solid rgba(255,255,255,.1);padding:8px 0;display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center}
#mkDlg .mkMap .mi b{font-size:14px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#mkDlg .mkMap .mi small{opacity:.65;font-size:11px}
#mkDlg .mkMap .ma{display:flex;gap:5px}#mkDlg .mkMap .mm{grid-column:1/3;display:none;gap:5px;flex-wrap:wrap}#mkDlg .mkMap.open .mm{display:flex}
#mkDlg .tip{font-size:12px;opacity:.75;line-height:1.45;margin:6px 0}
#mkDlg .kv{display:grid;grid-template-columns:auto 1fr;gap:5px 12px;font-size:12.5px;line-height:1.4}#mkDlg .kv kbd{background:#2b3a52;border-radius:5px;padding:1px 6px;font:700 11px system-ui,sans-serif;white-space:nowrap}
#mkCross{position:fixed;left:50%;top:50%;width:26px;height:26px;margin:-13px 0 0 -13px;pointer-events:none;z-index:4;display:none}
body.mkEdit #mkCross{display:block}
#mkCross::before,#mkCross::after{content:"";position:absolute;background:#ffd166;box-shadow:0 0 3px #000}
#mkCross::before{left:12px;top:0;width:2px;height:26px}#mkCross::after{top:12px;left:0;height:2px;width:26px}
#mkHud{position:fixed;left:50%;top:calc(56px + env(safe-area-inset-top));transform:translateX(-50%);z-index:5;display:none;background:rgba(10,20,35,.78);color:#fff;padding:6px 14px;border-radius:10px;font:800 14px system-ui,sans-serif;pointer-events:none;white-space:nowrap}
body.mkEdit #mkHud{display:none!important}
#mkAct{position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:6;display:none;border:0;border-radius:12px;padding:11px 18px;background:#ffd166;color:#1b1b1b;font:800 15px system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35)}
#mkBub{z-index:5}
body.mkEdit #tbAct,body.mkEdit #tbSlide,body.mkEdit #tbShield,body.mkEdit #tbTea,body.mkEdit #tbGrab,body.mkEdit #tbStomp,body.mkEdit #tbWalkSq,body.mkEdit #tbLie,body.mkEdit #tbInvite,body.mkEdit #tbTV,body.mkEdit .tb.sm,body.mkEdit #roboModes,body.mkEdit #prompt,body.mkEdit #objective,body.mkEdit #compArrow,body.mkEdit #cross{display:none!important}
body.mkEdit #tbFly{right:calc(196px + env(safe-area-inset-right));bottom:calc(96px + env(safe-area-inset-bottom))}
@media (max-height:430px){#mkTools{grid-template-columns:44px 44px;gap:5px}#mkTools button{width:44px;height:40px;font-size:17px}#mkTools .big{height:46px}#mkTop button{padding:6px 7px;font-size:12px}}
</style>`);
document.body.insertAdjacentHTML('beforeend', `
<div id="mkTop"><b id="mkName" title="Harita ayarları">🗺️</b><button class="mode" data-a="mode">▶️ Oyna</button><button data-a="env" title="Harita ayarları">⚙️</button><button data-a="save" title="Kaydet">💾</button><button data-a="list" title="Haritalarım">🗂️</button><button data-a="help" title="Yardım">❓</button><button data-a="exit" title="Haritadan çık">🚪</button></div>
<div id="mkItemBtn"><button id="mkCur" data-a="cat"><span>🏡</span><b>Köy evi</b><small>▾</small></button><button id="mkColBtn" data-a="color" title="Renk">🎨</button></div>
<div id="mkTools"><button class="big" data-a="place" title="Koy (Enter / sol tık)">✅<small>Koy</small></button><button data-a="rotL" title="Sola döndür (Shift+R)">⟲</button><button data-a="rotR" title="Sağa döndür (R)">⟳</button><button data-a="small" title="Küçült ( [ )">➖</button><button data-a="big" title="Büyüt ( ] )">➕</button><button data-a="pick" title="Seç (Q / sağ tık)">👆<small>Seç</small></button><button data-a="undo" title="Geri al (Ctrl+Z)">↩️</button><button data-a="bird" title="Kuş bakışı">🦅</button><button data-a="cat2" title="Eşyalar (B)">📦</button></div>
<div id="mkSel"></div>
<div id="mkCat"><div class="mch"><b>📦 Eşyalar</b><input id="mkQ" type="text" placeholder="Ara… (ev, ağaç, yol)"><button class="mkB" data-a="close">✖</button></div><div class="mkTabs" id="mkTabs"></div><div id="mkGrid"></div><div class="mkFoot" id="mkFoot"></div></div>
<div id="mkDlg"><div class="box" id="mkDlgBox"></div></div>
<div id="mkCross"></div><div id="mkHud"></div><button id="mkAct"></button><div id="mkBub" class="bub"></div>
<input type="file" id="mkFile" accept=".json,application/json" style="display:none">`);
MK.bubEl = G.$('mkBub'); MK.hudEl = G.$('mkHud'); MK.tool = 'place'; MK.txts = {};
for (const id of ['mkTop', 'mkItemBtn', 'mkTools', 'mkSel', 'mkCat', 'mkDlg', 'mkAct']) { const el = G.$(id); el.addEventListener('pointerdown', e => e.stopPropagation()); el.addEventListener('mousedown', e => e.stopPropagation()); el.addEventListener('keydown', e => e.stopPropagation()); el.addEventListener('wheel', e => e.stopPropagation(), { passive: true }); }
const MK_PAL = [0xffffff, 0xf4f1ea, 0xbdbdbd, 0x6c757d, 0x222222, 0xe63946, 0xf77f00, 0xffd166, 0xe9c46a, 0x8d5a2b, 0x06d6a0, 0x2a9d8f, 0x4c9a3c, 0x3a86ff, 0x1d3557, 0x8338ec, 0xff70a6, 0x00f5d4];
const mkHex = c => '#' + new G.THREE.Color(c).getHexString();
function mkUnlock() { if (!G.touchMode && G.isLocked()) try { document.exitPointerLock(); } catch (e) {} }
function mkRelock() { if (!G.touchMode && !G.lockFailed && !G.paused && G.inMaker) try { G.tryLock(); } catch (e) {} }
function mkModeUI() {
  const on = G.inMaker && !!MK.map, ed = on && MK.edit;
  document.body.classList.toggle('mk', on); document.body.classList.toggle('mkEdit', ed);
  if (!on) { mkCatShow(false); G.$('mkSel').classList.remove('on'); G.$('mkAct').style.display = 'none'; if (MK.hudEl) MK.hudEl.style.display = 'none'; if (MK.routeG) { G.scene.remove(MK.routeG); MK.routeG = null; } if (MK.box) { G.scene.remove(MK.box); MK.box = null; } return; }
  G.$('mkName').textContent = '🗺️ ' + MK.map.name;
  G.$('mkTop').querySelector('.mode').textContent = ed ? '▶️ ' + G.adT('Oyna') : '✏️ ' + G.adT('Düzenle');
  if (!ed) { mkGhostClear(); mkCatShow(false); MK.hudS = null; }
  const hasMon = MK.recs.some(r => r.it.act === 'mon'); G.$('hpWrap').style.display = !ed && hasMon ? 'block' : 'none';
  if (MK.edge) MK.edge.visible = ed;
  mkRouteDraw(); mkUI();
}
function mkHudItem() {
  if (!MK.map) return; const it = MK_I[MK.item], cur = G.$('mkCur');
  const ex = []; if (Math.abs(MK.scl - 1) > .01) ex.push('×' + MK.scl.toFixed(1)); if (MK.rot) ex.push(Math.round(MK.rot / G.DEG) + '°');
  cur.innerHTML = `<span>${it.ic}</span><b>${G.adT(it.n)}</b><small>${ex.join(' ')} ▾</small>`;
  const cb = G.$('mkColBtn'), c = MK.sel ? MK.sel.o.c ?? MK.sel.it.col : MK.col ?? it.col;
  cb.style.background = c != null ? mkHex(c) : 'rgba(10,20,35,.7)'; cb.textContent = c != null ? '' : '🎨';
}
function mkUI() {
  if (!MK.map) return; mkHudItem();
  const T = G.$('mkTools'); T.querySelector('[data-a=pick]').classList.toggle('on', MK.tool === 'pick'); T.querySelector('[data-a=bird]').classList.toggle('on', !!MK.bird);
  T.querySelector('[data-a=place] small').textContent = MK.route ? G.adT('Nokta') : MK.moving ? G.adT('Bırak') : MK.tool === 'pick' ? G.adT('Seç') : G.adT('Koy');
  const S = G.$('mkSel'); let h = '';
  if (MK.route) { const n = (MK.route.o.route || []).length; h = `<span class="lbl">🧭 ${G.adT('Rota')}: ${n} ${G.adT('nokta')}</span><button data-a="rUndo">↩️ ${G.adT('Son nokta')}</button><button data-a="rClear">🗑️ ${G.adT('Temizle')}</button><button class="ok" data-a="rDone">✅ ${G.adT('Bitti')}</button>`; }
  else if (MK.moving) h = `<span class="lbl">✋ ${G.adT('Taşınıyor')}: ${MK.moving.it.ic} ${G.adT(MK.moving.it.n)}</span><button class="ok" data-a="place">✅ ${G.adT('Bırak')}</button><button data-a="cancel">✖ ${G.adT('Vazgeç')}</button>`;
  else if (MK.sel && MK.edit) { const it = MK.sel.it; h = `<span class="lbl">${it.ic} ${G.adT(it.n)}</span><button data-a="move">✋ ${G.adT('Taşı')}</button><button data-a="up">⬆️</button><button data-a="down">⬇️</button>` + (it.col !== undefined ? `<button data-a="color">🎨</button>` : '') + `<button data-a="dup">📋 ${G.adT('Kopyala')}</button>` + (mkHasProps(it) ? `<button data-a="props">⚙️ ${G.adT('Özellikler')}</button>` : '') + (it.act === 'npc' ? `<button data-a="route">🧭 ${G.adT('Rota')}</button>` : '') + `<button class="del" data-a="del">🗑️</button><button data-a="cancel">✖</button>`; }
  S.innerHTML = h; S.classList.toggle('on', !!h && MK.edit && G.inMaker);
}
const mkHasProps = it => !!(it.txt || it.npc || it.act === 'mon' || it.act === 'veh' || it.act === 'chest' || it.act === 'portal');
function mkCatShow(on) {
  if (MK.catOpen && !on) MK.uiT = performance.now(); MK.catOpen = on; G.$('mkCat').classList.toggle('on', on);
  if (on) { mkUnlock(); mkCatRender(); if (MK.ghost) MK.ghost.visible = false; } else if (document.activeElement && document.activeElement.id === 'mkQ') document.activeElement.blur();
}
function mkCatRender() {
  const q = (G.$('mkQ').value || '').trim().toLocaleLowerCase('tr');
  G.$('mkTabs').innerHTML = MK_CATS.map(([k, ic, n]) => `<button data-c="${k}" class="${!q && MK.cat === k ? 'on' : ''}">${ic} ${G.adT(n)}</button>`).join('');
  const items = Object.values(MK_I).filter(it => q ? (G.adT(it.n) + ' ' + it.n).toLocaleLowerCase('tr').includes(q) : it.cat === MK.cat);
  G.$('mkGrid').innerHTML = items.map(it => `<button data-i="${it.id}" class="${MK.item === it.id ? 'on' : ''}"><span>${it.ic}</span><small>${G.adT(it.n)}</small></button>`).join('') || `<div class="tip">${G.adT('Bulunamadı')}</div>`;
  G.$('mkFoot').textContent = { yol: G.adT('Yollar 6 m’lik karolardır; ızgara açıkken birbirine oturur. Virajı ⟲⟳ ile çevir.'), npc: G.adT('NPC’yi koyduktan sonra seç → ⚙️ Özellikler: isim, söz, renk, şapka, davranış · 🧭 Rota ile yol çiz.'), macera: G.adT('Canavarlar, para, lav, trambolin, portal ▶️ Oyna’da çalışır. Aynı renkteki iki portal birbirine bağlanır.'), sekil: G.adT('Şekillerin rengini 🎨 ile, boyutunu ➖➕ ile, yüksekliğini seçip ⬆️⬇️ ile değiştir.'), ozel: G.adT('İris çukuru giyinme odasına iner. Araç noktası: oyunda V ile araç çağırırsın.') }[MK.cat] || G.adT('Bir eşya seç, nişan al (ya da ekrana dokun) ve ✅ Koy. Seçmek için 👆.');
}
G.$('mkTabs').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; MK.cat = b.dataset.c; G.$('mkQ').value = ''; G.play('ui', { gain: .4 }); mkCatRender(); });
G.$('mkGrid').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b) return; G.play('ui', { gain: .5 }); mkPickItem(b.dataset.i); mkCatRender(); if (G.touchMode || matchMedia('(max-width: 900px)').matches) mkCatShow(false); });
G.$('mkQ').addEventListener('input', () => mkCatRender());
/* 🎨 renk seçici */
function mkColorOpen() {
  mkUnlock(); const tg = MK.sel, it = tg ? tg.it : MK_I[MK.item]; if (it.col === undefined) { G.showMsg(G.adT('🎨 Bu eşyanın rengi değişmez'), 1.1); return; }
  const cur = tg ? tg.o.c : MK.col;
  mkDlg(`<div class="mkH"><b>🎨 ${G.adT('Renk')} · ${it.ic} ${G.adT(it.n)}</b><button class="mkB" data-a="x">✖</button></div><div class="mkSw">${MK_PAL.map(c => `<button data-col="${c}" class="${cur === c ? 'on' : ''}" style="background:${mkHex(c)}"></button>`).join('')}</div>
    <div class="mkRow" style="margin-top:10px"><button class="mkB" data-col="def">${G.adT('↺ Varsayılan renk')}</button><input type="color" id="mkColIn" value="${mkHex(cur ?? it.col)}" style="width:46px;height:34px;border:0;background:none"></div>`,
    (a, b) => { if (b.dataset.col) { mkSetColor(b.dataset.col === 'def' ? null : +b.dataset.col); mkDlgClose(); } });
  G.$('mkColIn').addEventListener('change', e => { mkSetColor(parseInt(e.target.value.slice(1), 16)); mkDlgClose(); });
}
/* 🪟 genel pencere */
function mkUiOpen() { try { return !!(MK.catOpen || MK.dlgOn || performance.now() - (MK.uiT || 0) < 600); } catch (e) { return false; } }
function mkDlg(html, onClick) { MK.dlgOn = true; mkUnlock(); MK.dlgFn = onClick; G.$('mkDlgBox').innerHTML = html; G.$('mkDlg').classList.add('on'); }
function mkDlgClose() { if (MK.dlgOn) MK.uiT = performance.now(); G.$('mkDlg').classList.remove('on'); MK.dlgFn = null; MK.dlgOn = false; }
const mkDlgOpen = () => G.$('mkDlg').classList.contains('on');
G.$('mkDlg').addEventListener('click', e => {
  if (e.target.id === 'mkDlg') { mkDlgClose(); mkRelock(); return; }
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.a === 'x') { mkDlgClose(); mkRelock(); return; }
  if (MK.dlgFn) MK.dlgFn(b.dataset.a, b);
});
/* ⚙️ eşya özellikleri */
function mkPropOpen(rec) {
  const o = rec.o, it = rec.it; let h = `<div class="mkH"><b>⚙️ ${it.ic} ${G.adT(it.n)}</b><button class="mkB" data-a="x">✖</button></div>`;
  const opts = (k, list, cur) => `<div class="mkOpts" data-k="${k}">${list.map(([v, n]) => `<button data-a="opt" data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${G.adT(n)}</button>`).join('')}</div>`;
  const sw = (k, cur) => `<div class="mkSw" data-k="${k}">${MK_PAL.map(c => `<button data-a="opt" data-v="${c}" class="${cur === c ? 'on' : ''}" style="background:${mkHex(c)}"></button>`).join('')}</div>`;
  if (it.txt) h += `<div class="mkSub">${G.adT('Yazı')}</div><textarea id="mkPTxt" maxlength="120">${mkEsc(o.txt ?? it.txt)}</textarea>`;
  if (it.npc) {
    h += `<div class="mkSub">${G.adT('İsim')}</div><input type="text" id="mkPName" maxlength="24" value="${mkEsc(o.name || '')}" placeholder="${G.adT('ör. Ayşe Teyze')}">`;
    h += `<div class="mkSub">${G.adT('Ne söylesin? (her satır ayrı bir cümle)')}</div><textarea id="mkPSay" maxlength="400">${mkEsc(String(o.say || '').split('|').join('\n'))}</textarea>`;
    h += `<div class="mkSub">${G.adT('Davranış')}</div>` + opts('mode', MK_MODES, o.mode || 'stand');
    h += `<div class="mkSub">${G.adT('Hız')}</div>` + opts('sp', MK_SPEEDS.map(x => [x[0], x[1]]), o.sp || 'walk');
    h += `<div class="mkSub">${G.adT('Şapka')}</div>` + opts('hat', MK_HATS, o.hat || it.npc.hat);
    h += `<div class="mkSub">${G.adT('Vücut rengi')}</div>` + sw('c', o.c ?? it.col) + `<div class="mkSub">${G.adT('Kafa rengi')}</div>` + sw('hc', o.hc ?? it.npc.hc);
    h += `<div class="mkSub">${G.adT('Boy')}</div>` + opts('s', [['.72', '🧒 Çocuk'], ['1', '🧍 Normal'], ['1.25', '🏀 Uzun'], ['2.2', '🗿 Dev']], o.s || 1);
    h += `<div class="mkRow" style="margin-top:10px"><button class="mkB" data-a="route">🧭 ${G.adT('Rotayı çiz')} (${(o.route || []).length})</button></div>`;
  }
  if (it.act === 'mon') { h += `<div class="mkSub">${G.adT('Can')}</div>` + opts('hp', [[30, '💚 30'], [60, '💛 60'], [120, '🧡 120'], [250, '❤️‍🔥 250']], o.hp || 60) + `<div class="mkSub">${G.adT('Hız')}</div>` + opts('spd', [[.6, '🐢 Yavaş'], [1, '🚶 Normal'], [1.6, '⚡ Hızlı']], o.spd || 1); }
  if (it.act === 'veh') h += `<div class="mkSub">${G.adT('Araç')}</div>` + opts('k', Object.keys(G.NV_DEF).map(k => [k, G.NV_DEF[k].ic + ' ' + G.NV_DEF[k].tr]), o.k || 'moto');
  if (it.act === 'chest') h += `<div class="mkSub">${G.adT('İçindeki para')}</div>` + opts('coins', [[5, '🪙 5'], [10, '🪙 10'], [25, '💰 25'], [100, '💎 100']], o.coins || 10);
  if (it.act === 'portal') h += `<div class="tip">${G.adT('Aynı renkteki kapılar birbirine bağlanır. Renk = kanal.')}</div>` + sw('c', o.c ?? it.col);
  h += `<div class="mkRow" style="margin-top:14px"><button class="mkB pri" data-a="ok">✅ ${G.adT('Kaydet')}</button><button class="mkB" data-a="x">${G.adT('Vazgeç')}</button></div>`;
  const tmp = JSON.parse(JSON.stringify(o));
  mkDlg(h, (a, b) => {
    if (a === 'opt') { const box = b.parentElement, k = box.dataset.k; for (const x of box.children) x.classList.toggle('on', x === b); const v = b.dataset.v; tmp[k] = isFinite(+v) && k !== 'k' && k !== 'mode' && k !== 'sp' && k !== 'hat' ? +v : v; }
    else if (a === 'ok' || a === 'route') {
      if (it.txt) tmp.txt = G.$('mkPTxt').value.slice(0, 120);
      if (it.npc) { tmp.name = G.$('mkPName').value.trim().slice(0, 24); if (!tmp.name) delete tmp.name; tmp.say = G.$('mkPSay').value.split('\n').map(x => x.trim()).filter(Boolean).join('|').slice(0, 400); if (+tmp.s === 1) delete tmp.s; }
      mkPush(); Object.keys(o).forEach(k => delete o[k]); Object.assign(o, tmp); if (it.txt) MK.txts[it.id] = o.txt; if (it.act === 'veh') MK.vehK = o.k;
      const n = mkRefresh(rec); mkChanged(); mkDlgClose(); G.play('ui');
      if (a === 'route') { mkSelect(n); mkRouteStart(); } else mkRelock();
    }
  });
}
/* ⚙️ harita ayarları */
function mkEnvOpen() {
  const E = MK.map.env, opts = (k, list) => `<div class="mkOpts" data-k="${k}">${list.map(([v, n]) => `<button data-a="env" data-v="${v}" class="${String(E[k]) === String(v) ? 'on' : ''}">${G.adT(n)}</button>`).join('')}</div>`;
  mkDlg(`<div class="mkH"><b>⚙️ ${G.adT('Harita ayarları')}</b><button class="mkB" data-a="x">✖</button></div>
    <div class="mkSub">${G.adT('Harita adı')}</div><div class="mkRow"><input type="text" id="mkEName" maxlength="40" value="${mkEsc(MK.map.name)}" style="flex:1;width:auto"><button class="mkB" data-a="name">✔</button></div>
    <div class="mkSub">${G.adT('Zemin')}</div>${opts('ground', Object.entries(MK_GROUNDS).map(([k, v]) => [k, v[0]]))}
    <div class="mkSub">${G.adT('Saat')}</div>${opts('time', [['auto', '🔄 Gün akar'], [7.2, '🌅 Sabah'], [12.5, '☀️ Öğle'], [16, '🌤️ İkindi'], [17.3, '🌇 Akşam'], [23, '🌙 Gece']])}
    <div class="mkSub">${G.adT('Hava')}</div>${opts('wx', [['clear', '☀️ Açık'], ['rain', '🌧️ Yağmur'], ['storm', '⛈️ Fırtına'], ['snow', '❄️ Kar'], ['fog', '🌫️ Sis']])}
    <div class="mkSub">${G.adT('Deniz / su')}</div>${opts('sea', [['none', '🚫 Yok'], ['coast', '🏖️ Sahil (kuzeyde deniz)'], ['island', '🏝️ Ada (her yan deniz)'], ['lake', '💧 Ortada göl']])}
    <div class="mkSub">${G.adT('Harita boyutu')}</div>${opts('size', [[80, 'Küçük · 160 m'], [150, 'Orta · 300 m'], [250, 'Büyük · 500 m'], [400, 'Dev · 800 m']])}
    <div class="mkSub">${G.adT('Izgara (eşyalar bu adımla hizalanır)')}</div>${opts('snap', [[0, 'Kapalı'], [.5, '0,5 m'], [1, '1 m'], [2, '2 m']])}
    <div class="mkSub">${G.adT('Dosya')}</div><div class="mkRow"><button class="mkB" data-a="exp">📤 ${G.adT('Dışa aktar (dosya)')}</button><button class="mkB warn" data-a="wipe">🧹 ${G.adT('Bütün eşyaları sil')}</button></div>
    <div class="tip">${MK.map.objs.length} ${G.adT('eşya')}${MK.map.best ? ' · 🏆 ' + MK.map.best.toFixed(1) + ' sn' : ''}</div>`, (a, b) => {
    if (a === 'env') { const k = b.parentElement.dataset.k, v = b.dataset.v; for (const x of b.parentElement.children) x.classList.toggle('on', x === b);
      E[k] = isFinite(+v) ? +v : v; if (k === 'time' && v === 'auto' && MK.day0) { G.DAY.t = MK.day0.t; } if (k === 'wx' && MK.wx0 == null) MK.wx0 = G.WX.cur;
      if (k === 'ground' || k === 'sea' || k === 'size') mkApplyEnv(); mkChanged(); G.play('ui', { gain: .4 }); }
    else if (a === 'name') { const n = G.$('mkEName').value.trim(); if (n) { MK.map.name = n.slice(0, 40); mkChanged(); mkModeUI(); G.showMsg('✔', .6); } }
    else if (a === 'exp') { if (G.$('mkEName').value.trim()) MK.map.name = G.$('mkEName').value.trim().slice(0, 40); mkSaveNow(true); mkExport(MK.map); }
    else if (a === 'wipe') { if (b.dataset.sure) { mkPush(); MK.map.objs = []; mkRebuild(); mkChanged(); mkDlgClose(); G.showMsg('🧹 ' + G.adT('Harita temizlendi (↩️ ile geri alınır)'), 1.6); } else { b.dataset.sure = 1; b.textContent = '⚠️ ' + G.adT('Emin misin? Tekrar bas'); } }
  });
  G.$('mkEName').addEventListener('keydown', e => { if (e.key === 'Enter') G.$('mkDlgBox').querySelector('[data-a=name]').click(); });
}
/* 🗂️ haritalarım */
function mkListOpen() {
  const L = mkIndex(), fmt = t => { const d = new Date(t); return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); };
  const rows = L.map(m => `<div class="mkMap" data-id="${m.id}"><div class="mi"><b>🗺️ ${mkEsc(m.name)}</b><small>${m.n || 0} ${G.adT('eşya')} · ${fmt(m.t)}${m.best ? ' · 🏆 ' + (+m.best).toFixed(1) + ' sn' : ''}</small></div>
    <div class="ma"><button class="mkB" data-a="edit">✏️ ${G.adT('Düzenle')}</button><button class="mkB pri" data-a="play">▶️</button><button class="mkB" data-a="more">⋯</button></div>
    <div class="mm"><input type="text" class="rn" maxlength="40" value="${mkEsc(m.name)}" style="flex:1;width:auto;min-width:120px"><button class="mkB" data-a="ren">✔ ${G.adT('Adını değiştir')}</button><button class="mkB" data-a="copy">📋 ${G.adT('Kopyala')}</button><button class="mkB" data-a="exp">📤 ${G.adT('Dışa aktar')}</button><button class="mkB warn" data-a="del">🗑️ ${G.adT('Sil')}</button></div></div>`).join('');
  mkDlg(`<div class="mkH"><b>🗺️ ${G.adT('Haritalarım')}</b><button class="mkB" data-a="x">✖</button></div>
    <div class="tip">${G.adT('Sıfırdan kendi dünyanı kur: ev, bina, ağaç, yol, sandalye, masa, iris çukuru, sahil, Miami ve canavar macerası eşyaları, NPC’ler ve rotaları, saat, hava, deniz… Her harita bu tarayıcıda kaydedilir.')}</div>
    <div class="mkRow"><button class="mkB pri" data-a="new">➕ ${G.adT('Yeni boş harita')}</button><button class="mkB" data-a="imp">📥 ${G.adT('Dosyadan yükle')}</button></div>
    <div class="mkSub">${G.adT('Hazır şablonla başla')}</div><div class="mkRow">${MK_TPL.map((t, i) => `<button class="mkB" data-a="tpl" data-i="${i}">${t.ic} ${G.adT(t.n)}</button>`).join('')}</div>
    <div class="mkSub">${G.adT('Kayıtlı haritalar')} (${L.length})</div>${rows || `<div class="tip">${G.adT('Henüz harita yok — “Yeni boş harita” ile başla!')}</div>`}`, (a, b) => {
    const row = b.closest('.mkMap'), id = row && row.dataset.id;
    if (a === 'new') { const m = mkNewMap(); mkSaveMap(m); mkOpen(m, true); setTimeout(() => G.showMsg(G.adT('📦 Eşyalar’dan seç, nişan al ve ✅ Koy'), 2.4), 900); }
    else if (a === 'imp') G.$('mkFile').click();
    else if (a === 'tpl') { const T = MK_TPL[+b.dataset.i], m = mkNewMap(G.adT(T.n)); Object.assign(m.env, T.env); m.objs = T.make(); mkSaveMap(m); mkOpen(m, true); }
    else if (a === 'edit' || a === 'play') { const m = mkLoadMap(id); if (!m) { G.showMsg(G.adT('⚠️ Harita açılamadı'), 1.6); mkDeleteMap(id); mkListOpen(); return; } mkOpen(m, a === 'edit'); }
    else if (a === 'more') row.classList.toggle('open');
    else if (a === 'ren') { const n = row.querySelector('.rn').value.trim(); if (!n) return; const m = MK.map && MK.map.id === id ? MK.map : mkLoadMap(id); if (!m) return; m.name = n.slice(0, 40); mkSaveMap(m); if (MK.map && MK.map.id === id) mkModeUI(); mkListOpen(); }
    else if (a === 'copy') { const m = mkLoadMap(id); if (!m) return; m.id = mkNewMap().id; m.name = (m.name + ' ' + G.adT('(kopya)')).slice(0, 40); mkSaveMap(m); mkListOpen(); }
    else if (a === 'exp') { const m = MK.map && MK.map.id === id ? MK.map : mkLoadMap(id); if (m) mkExport(m); }
    else if (a === 'del') { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = '⚠️ ' + G.adT('Emin misin? Tekrar bas'); return; } mkDeleteMap(id); if (MK.map && MK.map.id === id) { MK.map.id = mkNewMap().id; } mkListOpen(); }
  });
}
G.$('mkFile').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) mkImportFile(f, () => mkListOpen()); });
function mkHelpOpen() {
  mkDlg(`<div class="mkH"><b>❓ ${G.adT('Harita oluşturma')}</b><button class="mkB" data-a="x">✖</button></div>
  <div class="kv"><b>📦</b><span>${G.adT('Eşyalar: ev, apartman, gökdelen, ağaç, yol, mobilya, sahil / Miami, canavar macerası, özel eşyalar, NPC, şekiller.')}</span>
  <b>✅</b><span>${G.adT('Koy: ortadaki sarı artının gösterdiği yere koyar. Telefonda ekranın sağ yarısına dokununca da oraya koyar.')}</span>
  <b>👆</b><span>${G.adT('Seç: bir eşyaya dokun / nişan al. Sonra ✋ taşı, ⬆️⬇️ yükselt, 🎨 renk, 📋 kopyala, ⚙️ özellikler, 🗑️ sil.')}</span>
  <b>⟲ ⟳ ➖ ➕</b><span>${G.adT('Döndür ve boyutlandır (seçili eşyaya ya da koyacağın eşyaya).')}</span>
  <b>🧍</b><span>${G.adT('NPC: isim, söz, renk, şapka, davranış (durur, gezer, rotada yürür, dans eder). 🧭 Rota ile noktaları sırayla koy.')}</span>
  <b>⚙️</b><span>${G.adT('Harita ayarları: zemin, saat (sabah, öğle, akşam, gece), hava, sahil / ada / göl, boyut, ızgara, dışa aktarma.')}</span>
  <b>▶️</b><span>${G.adT('Oyna: canavarlar saldırır, para toplanır, lav yakar, trambolin zıplatır, portal ışınlar, bitiş bayrağı süreni tutar.')}</span>
  <b>🦅</b><span>${G.adT('Kuş bakışı: kamera yukarıdan bakar. Uçarak (F) yüksek yerlere de koyabilirsin.')}</span>
  <b>💾</b><span>${G.adT('Her değişiklik birkaç saniyede kendiliğinden kaydedilir. 🗂️ Haritalarım’dan istediğini açarsın.')}</span></div>
  <div class="mkSub">${G.adT('Klavye')}</div><div class="kv"><kbd>Enter</kbd><span>${G.adT('Koy / bırak')}</span><kbd>${G.adT('Sol tık')}</kbd><span>${G.adT('Koy')}</span><kbd>Q · ${G.adT('sağ tık')}</kbd><span>${G.adT('Seç')}</span><kbd>R · Shift+R</kbd><span>${G.adT('Döndür')}</span><kbd>[ ]</kbd><span>${G.adT('Küçült / büyüt')}</span><kbd>PageUp/Down</kbd><span>${G.adT('Yükselt / alçalt')}</span><kbd>Delete</kbd><span>${G.adT('Sil')}</span><kbd>Ctrl+Z · Ctrl+D</kbd><span>${G.adT('Geri al · kopyala')}</span><kbd>B</kbd><span>${G.adT('Eşyalar')}</span><kbd>Esc</kbd><span>${G.adT('Seçimi bırak')}</span></div>`);
}
/* düğmeler */
function mkAction(a) {
  switch (a) {
    case 'place': if (MK.tool === 'pick' && !MK.moving && !MK.route) mkPickAt(0, 0); else mkPlace(); break;
    case 'rotL': mkRotate(1); break; case 'rotR': mkRotate(-1); break;
    case 'small': mkScale(-1); break; case 'big': mkScale(1); break;
    case 'pick': MK.tool = MK.tool === 'pick' ? 'place' : 'pick'; if (MK.tool === 'place') mkCancel(true); G.play('ui', { gain: .4 }); G.showMsg(MK.tool === 'pick' ? G.adT('👆 Seçmek için bir eşyaya dokun / nişan al') : G.adT('✅ Koyma modu'), 1.1); mkUI(); break;
    case 'undo': mkUndo(); break; case 'bird': mkBird(); break;
    case 'cat': case 'cat2': mkCatShow(!MK.catOpen); break; case 'close': mkCatShow(false); mkRelock(); break;
    case 'color': mkColorOpen(); break;
    case 'move': mkMoveStart(); break; case 'up': mkRaise(1); break; case 'down': mkRaise(-1); break;
    case 'dup': mkDup(); break; case 'del': mkDel(); break; case 'cancel': mkCancel(); break;
    case 'props': if (MK.sel) mkPropOpen(MK.sel); break; case 'route': if (MK.sel) mkRouteStart(); break;
    case 'rUndo': if (MK.route && MK.route.o.route.length) { mkPush(); MK.route.o.route.pop(); mkRouteDraw(); mkChanged(); mkUI(); } break;
    case 'rClear': if (MK.route) { mkPush(); MK.route.o.route = []; if (MK.route.o.mode === 'route') MK.route.o.mode = 'stand'; mkRouteDraw(); mkChanged(); mkUI(); } break;
    case 'rDone': { const r = MK.route; MK.route = null; if (r) { mkSelect(r); G.showMsg(`🧭 ${(r.o.route || []).length} ${G.adT('nokta')} — ${G.adT('▶️ Oyna’da yürür')}`, 1.6); } mkUI(); break; }
    case 'mode': if (MK.edit) mkStartPlay(); else mkStartEdit(); break;
    case 'env': mkEnvOpen(); break; case 'save': mkSaveNow(); break; case 'list': mkListOpen(); break; case 'help': mkHelpOpen(); break;
    case 'exit': mkLeave(); break;
  }
}
for (const id of ['mkTop', 'mkItemBtn', 'mkTools', 'mkSel']) G.$(id).addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) mkAction(b.dataset.a); });
G.$('mkName').addEventListener('click', () => mkEnvOpen());
G.$('mkAct').addEventListener('click', () => mkDoNear());
function mkActBtn() {
  const el = G.$('mkAct'), rec = !MK.edit && MK.near; let s = '';
  if (rec && rec.it.act === 'veh') { const D = G.NV_DEF[rec.o.k || 'moto'] || G.NV_DEF.moto; s = `${D.ic} ${G.touchMode ? '' : 'V — '}${G.adT(D.tr)} ${G.adT('çağır')}`; }
  if (s !== MK.actS) { MK.actS = s; el.textContent = s; el.style.display = s ? 'block' : 'none'; }
}
function mkDoNear() { const rec = MK.near; if (!rec) return; if (rec.it.act === 'veh') { const m = G.nvSpawn(rec.o.k || 'moto'); if (m) G.showMsg(m, 2); } }
// klavye (düzenlemede tuşlar haritaya gider)
addEventListener('keydown', e => {
  if (!G.inMaker || !MK.map || !G.started) return;
  const tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT')) return;
  if (mkDlgOpen()) { if (e.code === 'Escape') { mkDlgClose(); mkRelock(); e.preventDefault(); e.stopImmediatePropagation(); } return; }
  if (G.paused || G.photoMode) return;
  if (!MK.edit) { if (e.code === 'KeyV' && MK.near) { mkDoNear(); e.preventDefault(); e.stopImmediatePropagation(); } return; }
  let used = true;
  switch (e.code) {
    case 'Enter': case 'NumpadEnter': mkAction('place'); break;
    case 'KeyR': mkRotate(e.shiftKey ? 1 : -1, e.altKey ? Math.PI / 12 : Math.PI / 4); break;
    case 'BracketRight': mkScale(1); break; case 'BracketLeft': mkScale(-1); break;
    case 'PageUp': mkRaise(1); break; case 'PageDown': mkRaise(-1); break;
    case 'Delete': case 'Backspace': mkDel(); break;
    case 'KeyB': mkCatShow(!MK.catOpen); if (!MK.catOpen) mkRelock(); break;
    case 'KeyQ': mkPickAt(0, 0); MK.tool = 'pick'; mkUI(); break;
    case 'KeyZ': if (e.ctrlKey || e.metaKey) mkUndo(); else used = false; break;
    case 'KeyD': if (e.ctrlKey || e.metaKey) mkDup(); else used = false; break;
    case 'Escape': if (MK.catOpen) { mkCatShow(false); } else if (MK.moving || MK.sel || MK.route) mkCancel(); else used = false; break;
    default: used = false;
  }
  if (used) { e.preventDefault(); e.stopImmediatePropagation(); }
}, true);
// fare: kilitliyken sol tık koyar, sağ tık seçer
G.canvas.addEventListener('mousedown', e => {
  if (!G.inMaker || !MK.edit || !MK.map || G.paused || G.photoMode || mkDlgOpen()) return;
  const locked = G.isLocked(); if (!locked && !G.lockFailed) return;
  if (e.button === 0) { if (locked) mkAction('place'); else mkTapAt(e.clientX, e.clientY); e.stopImmediatePropagation(); }
  else if (e.button === 2) { if (locked) mkPickAt(0, 0); else mkPickAt(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); MK.tool = 'pick'; mkUI(); e.stopImmediatePropagation(); }
}, true);
// dokunmatik: ekranın sağ yarısına kısa dokunuş = oraya koy / seç
G.canvas.addEventListener('pointerdown', e => { if (!G.inMaker || !MK.edit || e.pointerType !== 'touch') return; MK.tapD = MK.tapD ? null : { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() }; if (MK.tapN) MK.tapD = null; MK.tapN = (MK.tapN || 0) + 1; }, true);
G.canvas.addEventListener('pointermove', e => { const T = MK.tapD; if (T && T.id === e.pointerId && Math.hypot(e.clientX - T.x, e.clientY - T.y) > 14) MK.tapD = null; }, true);
addEventListener('pointerup', e => { if (e.pointerType === 'touch') MK.tapN = Math.max(0, (MK.tapN || 1) - 1); const T = MK.tapD; if (!T || T.id !== e.pointerId) return; MK.tapD = null;
  if (!G.inMaker || !MK.edit || G.paused || mkDlgOpen() || performance.now() - T.t > 330 || T.x < innerWidth * .45) return; mkTapAt(T.x, T.y); }, true);
addEventListener('pointercancel', () => { MK.tapD = null; MK.tapN = 0; }, true);
function mkTapAt(x, y) {
  const nx = x / innerWidth * 2 - 1, ny = -(y / innerHeight * 2 - 1);
  if (MK.tool === 'pick' && !MK.moving && !MK.route) { mkPickAt(nx, ny); return; }
  mkAimUpdate(nx, ny); mkPlace(); MK.rayT = .25;
}
// durdurma menüsü: 🗺️ Harita oluştur
{ const pp = G.$('pPhoto'); if (pp) pp.insertAdjacentHTML('afterend', `<button id="pMaker">🗺️ ${G.adT('Harita oluştur')} <small>${G.adT('sıfırdan dünya yap, kaydet')}</small></button>`); const b = G.$('pMaker'); if (b) b.addEventListener('click', () => { mkListOpen(); }); }

/* ---------- 📋 hazır şablonlar (istediğin gibi değiştirirsin) ---------- */
const mkSeed = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
const mkO = (t, x, z, r = 0, ex = {}) => ({ t, x: mkR2(x), z: mkR2(z), r: mkR2(r), ...ex });
const mkFace = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
const MK_TPL = [
  { ic: '🏖️', n: 'Sahil kasabası', env: { sea: 'coast', time: 17.3, size: 150 }, make() {
    const L = [], R = mkSeed(11), O = mkO;
    for (let x = -66; x <= 66; x += 6) L.push(O('road', x, 6, Math.PI / 2));
    [-54, -42, -30, -18, 18, 30, 42, 54].forEach((x, i) => L.push(i % 3 === 1 ? O('shop', x, -7, 0, { c: [0xf6e3a8, 0xffb3c6, 0xa0e7e5][i % 3] }) : O('house', x, -5, 0, { v: i % 6 })));
    L.push(O('cafe', -6, -7, 0), O('kiosk', 6, -4, 0));
    for (let x = -60; x <= 60; x += 12) L.push(O('lamp', x, 10.5, Math.PI / 2));
    for (let x = -64; x <= 64; x += 8) L.push(O('palm', x + R() * 2, 30 + R() * 3, R() * 6, { v: Math.floor(R() * 5) }));
    for (let x = -50; x <= 50; x += 10) { if (Math.abs(x) < 8) continue; L.push(O('umbrella', x, 42, 0, { c: [0xe63946, 0x3a86ff, 0xffd166, 0x06d6a0][Math.abs(x / 10) % 4] }), O('sunbed', x - 1.1, 41.2, 0), O('sunbed', x + 1.1, 41.2, 0)); }
    L.push(O('lifeguard', 0, 47, Math.PI), O('neon', -20, 24, 0, { txt: 'MIAMI', c: 0xff4fd8 }), O('icecream', 14, 26, 0), O('volley', 30, 49, 0), O('pier', -34, 59, 0), O('boat', -24, 70, .3),
      O('surf', 22, 50, 0), O('surf', 23.2, 50, .2, { c: 0x3a86ff }), O('ball', 27, 44), O('sandcastle', -8, 50), O('flamingo', -44, 36, 1), O('flamingo', -45.5, 37.2, 2.2),
      O('car', -40, 1, Math.PI / 2, { c: 0xe63946 }), O('car', 36, 1, Math.PI / 2, { c: 0x00f5d4 }), O('busstop', 0, 11.2, Math.PI), O('sign', 5, 22, Math.PI, { txt: 'Sahil Kasabası' }), O('spawn', 0, 15, 0),
      O('npc_tourist', -10, 38, 0, { mode: 'wander', say: 'Deniz harika!|Güneş batıyor, ne güzel!', hat: 'sapka', sp: 'walk' }),
      O('npc_tourist', 18, 40, 0, { mode: 'wander', c: 0xffbe0b, say: 'Dondurma alacağım!|Kumlar sıcacık.', hat: 'hasir', sp: 'walk' }),
      O('npc_police', -20, 9, 0, { mode: 'route', route: [[-40, 9], [40, 9]], say: 'Sahilde iyi eğlenceler!|Her şey yolunda.', hat: 'polis', sp: 'walk' }),
      O('npc_villager', 6, -1.2, 0, { mode: 'stand', name: 'Büfeci Ali', say: 'Ayran, simit, tost!|Buyur, ne alırsın?', hat: 'none', sp: 'walk' }),
      O('npc_dancer', 34, 30, 0, { mode: 'dance', say: 'Hadi dans!|Müzik bizde!', hat: 'none' }),
      O('npc_kid', -6, 46, 0, { mode: 'wander', s: .72, say: 'Kumdan kale yaptım!|Yakala beni!', hat: 'bere', sp: 'walk' }));
    return L; } },
  { ic: '🌲', n: 'Orman kampı', env: { sea: 'lake', time: 22, size: 120 }, make() {
    const L = [], R = mkSeed(5), O = mkO, C = [0, 52];
    L.push(O('campfire', C[0], C[1]));
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + .4, x = C[0] + Math.cos(a) * 10, z = C[1] + Math.sin(a) * 10; L.push(O('tent', x, z, mkFace(x, z, C[0], C[1]), { c: [0xf77f00, 0x2a9d8f, 0xe63946, 0x3a86ff][i] })); }
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + .2, x = C[0] + Math.cos(a) * 3.6, z = C[1] + Math.sin(a) * 3.6; L.push(O('log', x, z, mkFace(x, z, C[0], C[1]))); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, x = C[0] + Math.cos(a) * 15, z = C[1] + Math.sin(a) * 15; L.push(O('torch', x, z)); }
    let n = 0; while (n < 120) { const a = R() * Math.PI * 2, r = 36 + R() * 76, x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.hypot(x - C[0], z - C[1]) < 20) continue; n++; const k = R(); L.push(k < .55 ? O('pine', x, z, R() * 6, { v: n % 2, s: mkR2(.8 + R() * .6) }) : k < .75 ? O('tree', x, z, R() * 6, { v: n % 4 }) : k < .88 ? O('bush', x, z, R() * 6) : k < .95 ? O('rock', x, z, R() * 6) : O('mushroom', x, z, R() * 6, { s: .6 })); }
    L.push(O('pier', 0, 24, Math.PI), O('boat', 9, 14, 1.2, { c: 0x8d5a2b, s: .7 }), O('sign', 6, 60, Math.PI, { txt: 'Orman Kampı' }), O('pet', 4, 48, 2), O('spawn', 0, 66, Math.PI), O('hay', -14, 60, .4), O('barrel', 13, 58), O('crate', 14, 59.5, .3),
      O('npc_villager', 2.5, 50, 0, { mode: 'stand', name: 'Kamp lideri Mert', say: 'Ateşin başına gel!|Gece orman çok sessiz…|Ağaçların arasında zombi gördüm diyorlar!', hat: 'kovboy', sp: 'walk' }),
      O('npc_kid', -3, 55, 0, { mode: 'wander', s: .72, say: 'Marshmallow pişirelim!|Yıldızlar ne güzel!', hat: 'bere', sp: 'walk' }),
      O('npc_elder', -4, 47, 0, { mode: 'stand', say: 'Eskiden burada kurtlar yaşardı…|Ateşi söndürmeyin.', hat: 'sapka', sp: 'slow' }),
      O('zombie', 70, -55, 0), O('zombie', -75, -40, 2), O('skeleton', 20, -90, 1));
    return L; } },
  { ic: '👹', n: 'Canavar parkuru', env: { ground: 'volcano', time: 'auto', size: 110 }, make() {
    const L = [], O = mkO;
    L.push(O('spawn', 0, -92, 0), O('sign', 5, -86, Math.PI, { txt: 'Lavlara basma!' }), O('arrow', 0, -86, 0, { c: 0xffd166 }));
    for (let z = -80; z <= -24; z += 8) for (const x of [-8, 0, 8]) L.push(O('lava', x, z, 0, { s: 2 }));
    let i = 0; for (let z = -82; z <= -22; z += 4, i++) L.push(O('plate', i % 2 ? 2 : -2, z, 0, { s: .6, c: 0x8d99ae }));
    for (let z = -78; z <= -30; z += 12) L.push(O('coin', (z / 12) % 2 ? 2 : -2, z, 0, { y: .2 }));
    L.push(O('plate', 0, -15, 0, { s: 1.6, c: 0x06d6a0 }), O('check', 0, -15, 0, { y: .48 }), O('tramp', 0, -9, 0, { c: 0xe63946 }));
    [[0, -3, 0], [2, 3, 1.2], [-1, 9, 2.4], [1, 15, 3.6]].forEach(([x, z, y]) => L.push(O('platform', x, z, 0, { y, c: 0xffd166 }), O('coin', x, z, 0, { y: y + 3 })));
    L.push(O('check', 0, 24), O('heart', -6, 26));
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, x = Math.cos(a) * 20, z = 48 + Math.sin(a) * 20; L.push(O('torch', x, z)); }
    L.push(O('monster', -8, 44, 0), O('monster', 8, 52, 0, { hp: 120 }), O('zombie', 0, 40, 0), O('zombie', -10, 56, 0), O('skeleton', 10, 42, 0), O('crystal', -14, 60, 0, { c: 0xff4fd8 }), O('crystal', 14, 36, 0), O('tomb', -16, 40, .3), O('tomb', 16, 58, -.3), O('bones', 4, 60), O('chest', 0, 64, Math.PI, { coins: 25 }));
    for (let k = 0; k < 6; k++) L.push(O('coin', -10 + k * 4, 48, 0));
    L.push(O('boost', 0, 72, 0), O('finish', 0, 88, 0), O('sign', 6, 80, Math.PI, { txt: 'Son düzlük!' }));
    return L; } },
  { ic: '🏙️', n: 'Mini şehir', env: { size: 150, time: 'auto' }, make() {
    const L = [], O = mkO, lines = [-36, 0, 36], E = 66;
    for (const X of lines) for (let z = -E; z <= E; z += 6) if (!lines.includes(z)) L.push(O('road', X, z, 0));
    for (const Z of lines) for (let x = -E; x <= E; x += 6) if (!lines.includes(x)) L.push(O('road', x, Z, Math.PI / 2));
    for (const X of lines) for (const Z of lines) { L.push(O('roadx', X, Z)); L.push(O('tlight', X + 4.3, Z + 4.3, Math.PI)); }
    for (const X of lines) for (let z = -60; z <= 60; z += 12) if (!lines.includes(z)) L.push(O('lamp', X + 4.2, z, Math.PI));
    L.push(O('fountain', 18, 18), O('bench', 18, 11, 0), O('bench', 18, 25, Math.PI), O('bench', 11, 18, Math.PI / 2), O('bench', 25, 18, -Math.PI / 2));
    for (const [x, z] of [[10, 10], [26, 10], [10, 26], [26, 26]]) L.push(O('tree', x, z, 0, { v: (x + z) % 4 }), O('flowers', x + (x < 18 ? 3 : -3), z, 0, { c: 0xff70a6 }));
    L.push(O('apt', -18, 14, 0), O('shop', -18, 27, Math.PI, { c: 0xffb3c6 }), O('tower', 18, -18, 0), O('office', -18, -18, 0), O('apt', 54, 18, Math.PI / 2, { c: 0xd9c4a8 }), O('cafe', 54, -14, Math.PI / 2), O('kiosk', 54, -26, Math.PI / 2),
      O('house', -50, 14, 0, { v: 1 }), O('house', -58, 14, 0, { v: 3 }), O('house', -50, 25, Math.PI, { v: 4 }), O('house', -58, 25, Math.PI, { v: 0 }), O('apt', -54, -18, 0, { c: 0xc9d6e2 }),
      O('busstop', -10, 40.5, Math.PI), O('kiosk', -25, 50, 0), O('parking', 12, -44, 0), O('parking', 18, -44, 0), O('parking', 24, -44, 0), O('car', 12, -44, 0, { c: 0xe63946 }), O('car', 24, -44, 0, { c: 0xffd166 }), O('car', 2, 20, 0, { c: 0x3a86ff }), O('car', -2, -50, Math.PI, { c: 0xf4f4f4 }),
      O('statue', 18, 54, Math.PI), O('spawn', 6, 46, Math.PI),
      O('npc_police', 6, 8, 0, { mode: 'route', route: [[6, 6], [30, 6], [30, 30], [6, 30]], say: 'Merhaba vatandaş!|Trafik kurallarına uy.', hat: 'polis', sp: 'walk' }),
      O('npc_woman', 16, 14, 0, { mode: 'wander', say: 'Çeşme ne güzel!|Kahve içmeye gidiyorum.', hat: 'none', sp: 'walk' }),
      O('npc_chef', 50.5, -14, -Math.PI / 2, { mode: 'stand', name: 'Aşçı Selim', say: 'Kafemiz açık!|Bugün pasta var.', hat: 'asci', sp: 'walk' }),
      O('npc_worker', 12, -26, 0, { mode: 'wander', say: 'Gökdeleni biz yaptık!|Baret takmayı unutma.', hat: 'kask', sp: 'walk' }),
      O('npc_kid', 22, 20, 0, { mode: 'wander', s: .72, say: 'Çeşmeye para attım!', hat: 'none', sp: 'walk' }), O('cat', 20, 50, 0));
    return L; } },
];

/* ---------- oyuna bağlanan uçlar ---------- */
window.__mk = { tick: mkTick, area: mkArea, ramp: (x, z, y, g) => MK.ramps.length ? mkRampAt(x, z, y, g) : g, punch: mkPunch, respawn: mkRespawn, fromCloset: mkFromCloset, uiOpen: mkUiOpen };
window.__mkDbg = { MK, MK_I, MK_TPL, mkOpen, mkNewMap, mkListOpen, mkSaveMap, mkPickItem, mkPlace, mkAimUpdate, mkStartPlay, mkStartEdit, mkTapAt, mkAction, mkPickAt, mkCatShow, mkPropOpen, mkEnvOpen };

})(window.__sftG);
