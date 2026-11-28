/* 🛠️ S.F.T · Çalışma modu (editor.js) — yalnızca admin varken (çok oyunculuda odada admin varsa arkadaşlar da):
   oyun durur, izleyici kameraya geçersin; her şeyi seçip yerini, dönüşünü, boyutunu, rengini değiştirirsin; can, hasar, zıplatma, hız, iyileştirme,
   dönme, süzülme, devriye, takip gibi özellikler eklersin; yeni nesneler (küp, küre, rampa, yazı, ışık, kukla, araba, ağaç, ev, pedler…) koyarsın.
   Eklediklerin her bölgede kayıtlı kalır; çok oyunculuda herkeste aynı anda değişir. index.html bunu yükler (window.__sftG). */
(function (G) {
'use strict';
const T = G.THREE, $ = id => document.getElementById(id), adT = s => G.adT(s);
const V1 = new T.Vector3(), V2 = new T.Vector3(), V3 = new T.Vector3(), Q1 = new T.Quaternion(), E1 = new T.Euler(0, 0, 0, 'YXZ'), RC = new T.Raycaster();
const ED = { on: false, p: new T.Vector3(), yaw: 0, pitch: 0, sel: null, items: [], uid: 0, keys: {}, drag: null, look: null, area: '', loaded: {}, mods: new Map(), sendT: 0, touch: false, mv: { x: 0, z: 0, y: 0 } };
const SAVE = 'sftCalisma1';
const allowed = () => { try { if (G.ADM_UNLOCK) return true; const M = G.MP; return !!(M && M.on && Object.values(M.players).some(p => p.admin)); } catch (e) { return false; } };
const mpOn = () => { try { return G.MP && G.MP.on; } catch (e) { return false; } };
const send = m => { try { if (mpOn()) G.mpSend(Object.assign({ t: 'ed' }, m)); } catch (e) {} };
const myId = () => { try { return (G.MP && G.MP.me && G.MP.me.id) || 'yerel'; } catch (e) { return 'yerel'; } };
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; }

/* ---------- 🧊 eklenebilen nesneler ---------- */
const TYPES = [
  ['box', '🧊', 'Küp'], ['ball', '⚪', 'Küre'], ['cyl', '🛢️', 'Silindir'], ['cone', '🔺', 'Koni'], ['ramp', '📐', 'Rampa'], ['plat', '🟫', 'Platform'], ['ring', '⭕', 'Halka'], ['star', '⭐', 'Yıldız'],
  ['text', '🔤', 'Yazı'], ['light', '💡', 'Işık'], ['dummy', '🎯', 'Hedef kukla'], ['npc', '🧍', 'Çöp adam'], ['car', '🚗', 'Araba'], ['tree', '🌳', 'Ağaç'], ['house', '🏠', 'Ev'],
  ['jump', '🟢', 'Zıplama pedi'], ['lava', '🌋', 'Lav'], ['heal', '💚', 'Şifa alanı'], ['speed', '⚡', 'Hız pedi'], ['wall', '🧱', 'Duvar']];
const PROP_DEF = { hp: 0, dmg: 0, bounce: 0, speed: 0, heal: 0, spin: 0, float: 0, patrol: 0, follow: false, glow: false, solid: true };
const PRESET = { jump: { bounce: 22, glow: true, solid: false }, lava: { dmg: 25, glow: true, solid: false }, heal: { heal: 20, glow: true, solid: false }, speed: { speed: 40, glow: true, solid: false }, dummy: { hp: 300 }, light: { solid: false }, text: { solid: false }, npc: { solid: false } };
const COL0 = { box: 0x4fc3f7, ball: 0xff7043, cyl: 0x9575cd, cone: 0xffca28, ramp: 0x90a4ae, plat: 0x8d6e63, ring: 0xec407a, star: 0xffd54f, text: 0xffffff, light: 0xfff3c4, dummy: 0xd7ccc8, npc: 0x30b0ff, car: 0xe53935, tree: 0x4caf50, house: 0xe0d6c4, jump: 0x00e676, lava: 0xff3d00, heal: 0x69f0ae, speed: 0xffea00, wall: 0xbcaaa4 };
function starGeo() { const s = new T.Shape(); for (let k = 0; k < 10; k++) { const r = k % 2 ? .45 : 1.1, a = k / 10 * Math.PI * 2 + Math.PI / 2; k ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath(); return new T.ExtrudeGeometry(s, { depth: .4, bevelEnabled: true, bevelSize: .06, bevelThickness: .06, bevelSegments: 1 }).translate(0, 1.1, -.2); }
function rampGeo() { const s = new T.Shape(); s.moveTo(-2, 0); s.lineTo(2, 0); s.lineTo(2, 1.6); s.closePath(); return new T.ExtrudeGeometry(s, { depth: 2.4, bevelEnabled: false }).translate(0, 0, -1.2).rotateY(-Math.PI / 2); }
function textTex(t, col) { return canvasTex(512, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, w, h); g.fillStyle = '#' + new T.Color(col).getHexString(); let fs = 80; g.font = `900 ${fs}px system-ui`; while (g.measureText(t).width > w * .92 && fs > 18) { fs -= 4; g.font = `900 ${fs}px system-ui`; } g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, w / 2, h / 2 + 3); }); }
function buildObj(type, col, text) {
  const mat = () => new T.MeshStandardMaterial({ color: col, roughness: .55, metalness: .1 }), mesh = (geo, m) => { const o = new T.Mesh(geo, m || mat()); o.castShadow = o.receiveShadow = true; return o; }; let o;
  switch (type) {
    case 'box': o = mesh(new T.BoxGeometry(2, 2, 2).translate(0, 1, 0)); break;
    case 'ball': o = mesh(new T.SphereGeometry(1, 24, 16).translate(0, 1, 0)); break;
    case 'cyl': o = mesh(new T.CylinderGeometry(1, 1, 2, 24).translate(0, 1, 0)); break;
    case 'cone': o = mesh(new T.ConeGeometry(1, 2, 24).translate(0, 1, 0)); break;
    case 'ramp': o = mesh(rampGeo()); break;
    case 'plat': o = mesh(new T.BoxGeometry(4, .4, 4).translate(0, .2, 0)); break;
    case 'wall': o = mesh(new T.BoxGeometry(6, 3, .4).translate(0, 1.5, 0)); break;
    case 'ring': o = mesh(new T.TorusGeometry(1, .25, 12, 32).translate(0, 1.4, 0)); break;
    case 'star': o = mesh(starGeo()); break;
    case 'text': { o = new T.Mesh(new T.PlaneGeometry(4, 1).translate(0, 1.5, 0), new T.MeshBasicMaterial({ map: textTex(text || 'SFT', col), transparent: true, side: T.DoubleSide, toneMapped: false })); break; }
    case 'light': { o = new T.Group(); const b = new T.Mesh(new T.SphereGeometry(.3, 12, 10), new T.MeshBasicMaterial({ color: col, toneMapped: false })); b.position.y = 1.5; const l = new T.PointLight(col, 40, 22, 1.5); l.position.y = 1.5; o.add(b, l); o.userData.light = l; break; }
    case 'dummy': { o = new T.Group(); const m = mat(); const body = mesh(new T.CylinderGeometry(.45, .55, 1.4, 14).translate(0, 1.1, 0), m), head = mesh(new T.SphereGeometry(.35, 14, 10).translate(0, 2.1, 0), m), post = mesh(new T.CylinderGeometry(.08, .08, .5, 6).translate(0, .25, 0), new T.MeshStandardMaterial({ color: 0x5d4037 })); const tgt = new T.Mesh(new T.RingGeometry(.15, .3, 20).translate(0, 1.2, .56), new T.MeshBasicMaterial({ color: 0xff1744, side: T.DoubleSide })); o.add(body, head, post, tgt); break; }
    case 'npc': { const r = G.createStickman(col); o = new T.Group(); o.add(r.stick); o.userData.rig = r; break; }
    case 'car': { try { o = window.__kent ? __kent.makeCar(col) : null; } catch (e) {} if (!o) o = mesh(new T.BoxGeometry(2, 1.4, 4.2).translate(0, .7, 0)); break; }
    case 'tree': { o = new T.Group(); const tr = mesh(new T.CylinderGeometry(.3, .4, 3, 8).translate(0, 1.5, 0), new T.MeshStandardMaterial({ color: 0x6d4c41 })); const lf = mesh(new T.IcosahedronGeometry(2, 0).translate(0, 4, 0), new T.MeshStandardMaterial({ color: col, flatShading: true })); o.add(tr, lf); break; }
    case 'house': { try { o = G.staticPH('kh0', () => G.buildHouse(G.HOUSE_VARIANTS[0])); } catch (e) { o = mesh(new T.BoxGeometry(6, 5, 6).translate(0, 2.5, 0)); } break; }
    case 'jump': { o = mesh(new T.CylinderGeometry(1.5, 1.6, .3, 24).translate(0, .15, 0)); const ar = new T.Mesh(new T.ConeGeometry(.5, .6, 4).translate(0, .6, 0), new T.MeshBasicMaterial({ color: 0xffffff })); o.add(ar); break; }
    case 'lava': { o = mesh(new T.BoxGeometry(4, .2, 4).translate(0, .1, 0)); break; }
    case 'heal': { o = mesh(new T.CylinderGeometry(2, 2, .15, 24).translate(0, .08, 0), new T.MeshStandardMaterial({ color: col, transparent: true, opacity: .55 })); const pl = new T.Mesh(new T.BoxGeometry(.3, .02, 1.2).translate(0, .18, 0), new T.MeshBasicMaterial({ color: 0xffffff })), pl2 = pl.clone(); pl2.rotation.y = Math.PI / 2; o.add(pl, pl2); break; }
    case 'speed': { o = mesh(new T.BoxGeometry(3, .15, 4).translate(0, .08, 0)); for (let k = 0; k < 3; k++) { const ar = new T.Mesh(new T.ConeGeometry(.5, .8, 3).rotateX(Math.PI / 2).translate(0, .2, -1 + k * .9), new T.MeshBasicMaterial({ color: 0x212121 })); ar.rotation.y = 0; o.add(ar); } break; }
    default: o = mesh(new T.BoxGeometry(2, 2, 2).translate(0, 1, 0));
  }
  return o;
}

/* ---------- 📦 öğe kaydı ---------- */
function makeItem(d) {   // d: { id, type, p, r, s, col, props, text, area }
  const obj = buildObj(d.type, d.col, d.text); obj.position.fromArray(d.p); obj.rotation.set(d.r[0] || 0, d.r[1] || 0, d.r[2] || 0); obj.scale.fromArray(d.s);
  obj.userData.edItem = true; obj.traverse(o => { o.userData.edPart = true; });
  const it = { id: d.id, type: d.type, obj, col: d.col, text: d.text || '', area: d.area, props: Object.assign({}, PROP_DEF, PRESET[d.type] || {}, d.props || {}), base: obj.position.clone(), t: Math.random() * 6, spawn: true };
  it.hp = it.props.hp; obj.userData.edRec = it; ED.items.push(it); G.scene.add(obj); applyLook(it); refreshObs(it); return it;
}
function ser(it) { const o = it.obj; return { id: it.id, type: it.type, p: (it.base || o.position).toArray().map(v => +v.toFixed(2)), r: [o.rotation.x, o.rotation.y, o.rotation.z].map(v => +v.toFixed(3)), s: o.scale.toArray().map(v => +v.toFixed(3)), col: it.col, props: it.props, text: it.text, area: it.area }; }
let saveT = 0; function save() { saveT = .6; }
const WM = (() => { try { return JSON.parse(localStorage.getItem(SAVE + 'w') || '{}'); } catch (e) { return {}; } })();   // dünyadaki nesnelere yapılan değişiklikler (yer, boyut, renk, gizleme)
const keepId = id => /^[sb]:/.test(id);
function bldMesh() { let f = null; try { const C = G.CITY; if (!C || !C.bld) return null; (C.g || G.scene).traverse(o => { if (!f && o.isInstancedMesh && o.count === C.bld.length && o.count > 20) f = o; }); } catch (e) {} return f; }
function wmSet(id, k, v) { if (!keepId(id)) return; const a = WM[G.curKey] = WM[G.curKey] || {}; (a[id] = a[id] || {})[k] = v; save(); }
let wmDone = {}; function wmApply() { const a = WM[G.curKey]; if (!a || wmDone[G.curKey]) return; if (G.curKey === 'city' && !(G.CITY && G.CITY.built)) return; wmDone[G.curKey] = true;
  for (const id in a) { const s = resolve(id), m = a[id]; if (!s) continue; if (m.tr) trSet(s, new T.Vector3().fromArray(m.tr[0]), new T.Euler(m.tr[1][0], m.tr[1][1], m.tr[1][2], 'YXZ'), new T.Vector3().fromArray(m.tr[2]), true); if (m.col != null) setColorLocal(s, m.col); if (m.hide && s.obj) { s.obj.visible = false; try { if (s.obj.userData.obs) s.obj.userData.obs.pass = true; } catch (e) {} } } }
function flushSave() { try { const all = JSON.parse(localStorage.getItem(SAVE) || '{}'); all[ED.area] = ED.items.filter(i => i.spawn && i.area === ED.area && !i.dead).map(ser); localStorage.setItem(SAVE, JSON.stringify(all)); localStorage.setItem(SAVE + 'w', JSON.stringify(WM)); } catch (e) {} }
function loadArea(a) { if (ED.loaded[a]) return; ED.loaded[a] = true; try { const all = JSON.parse(localStorage.getItem(SAVE) || '{}'); for (const d of all[a] || []) if (!ED.items.find(i => i.id === d.id)) makeItem(d); } catch (e) {} }
function removeItem(it, quiet) { it.dead = true; G.scene.remove(it.obj); if (it.ob) { const i = G.obstacles.indexOf(it.ob); if (i >= 0) G.obstacles.splice(i, 1); it.ob = null; } ED.items.splice(ED.items.indexOf(it), 1); if (ED.sel && ED.sel.rec === it) select(null); if (!quiet) save(); }
function applyLook(it) { const o = it.obj; o.traverse(m => { if (!m.isMesh || !m.material || !m.material.color || m.userData.keepCol) return; if (it.type !== 'text' && !(it.type === 'jump' || it.type === 'speed' || it.type === 'heal') || m === o) { m.material.color.setHex(it.col); if ('emissive' in m.material) { m.material.emissive.setHex(it.props.glow ? it.col : 0); m.material.emissiveIntensity = it.props.glow ? .6 : 0; } } });
  if (it.type === 'text' && o.material) { o.material.map.dispose(); o.material.map = textTex(it.text || 'SFT', it.col); o.material.needsUpdate = true; }
  if (o.userData.light) o.userData.light.color.setHex(it.col); if (o.userData.rig) o.userData.rig.bodyMat.color.setHex(it.col); }
function refreshObs(it) {   // katı nesneler: üstünde durulur, içinden geçilmez
  if (it.ob) { const i = G.obstacles.indexOf(it.ob); if (i >= 0) G.obstacles.splice(i, 1); it.ob = null; }
  if (!it.props.solid || it.type === 'ramp' || it.dead || it.area !== G.curKey) return; const bb = new T.Box3().setFromObject(it.obj); if (bb.isEmpty()) return;
  it.ob = { box: true, x: (bb.min.x + bb.max.x) / 2, z: (bb.min.z + bb.max.z) / 2, hx: (bb.max.x - bb.min.x) / 2, hz: (bb.max.z - bb.min.z) / 2, r: bb.max.distanceTo(bb.min) / 2, h: bb.max.y, top: bb.max.y, y0: bb.min.y, tb: bb.min.y, stand: true, pass: false, edB: true }; G.obstacles.push(it.ob);
}
function areaSync() { const a = G.curKey; if (a === ED.area) return; ED.area = a; wmDone[a] = false; loadArea(a); for (const it of ED.items) { if (!it.spawn) continue; it.obj.visible = it.area === a; refreshObs(it); } }

/* ---------- 🔎 dünyadaki nesneleri seçme ---------- */
function containers() { const s = new Set([G.scene]); try { if (G.CITY && G.CITY.g) s.add(G.CITY.g); if (G.CITY && G.CITY.varG) s.add(G.CITY.varG); if (window.__kent) s.add(__kent.K.g); } catch (e) {} return s; }
function rootOf(o) { const C = containers(); while (o.parent && !C.has(o.parent)) { if (o.userData.edItem) return o; o = o.parent; } return o; }
function skip(o) { if (o.userData.edHelper || o.isPoints || o.isLine || o.isSprite) return true; for (let p = o; p; p = p.parent) { if (p === G.player || p.userData.edHelper) return true; if (!p.visible) return true; } if (o === G.ground) return true; const g = o.geometry; if (g) { if (!g.boundingSphere) g.computeBoundingSphere(); if (g.boundingSphere && g.boundingSphere.radius * Math.max(o.scale.x, o.scale.z) > 400 && !o.isInstancedMesh) return true; } return false; }
function pickAt(cx, cy) {
  const r = G.renderer ? G.renderer.domElement.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
  RC.setFromCamera(new T.Vector2((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), G.camera); RC.far = 2500;
  const hits = RC.intersectObjects(G.scene.children, true); for (const h of hits) { if (skip(h.object)) continue; if (h.object.isInstancedMesh && h.instanceId != null) return { inst: h.object, i: h.instanceId, pt: h.point }; const root = rootOf(h.object); if (root === G.scene) continue; return { obj: root, pt: h.point }; }
  return null;
}
function worldId(sel) {
  if (sel.rec && sel.rec.spawn) return 'e:' + sel.rec.id; const o = sel.obj;
  if (sel.inst) return (sel.inst === bldMesh() ? 'b:' : 'i:' + pathOf(sel.inst) + ':') + sel.i;
  try { for (const k in G.slotHolders) { const i = G.slotHolders[k].indexOf(o); if (i >= 0) return 's:' + k + ':' + i; } } catch (e) {}
  try { const i = G.npcs.findIndex(n => n.holder === o); if (i >= 0) return 'n:' + i; } catch (e) {}
  try { const i = G.CITY.cars.findIndex(c => c.g === o); if (i >= 0) return 'c:' + i; } catch (e) {}
  return 'p:' + pathOf(o);
}
function pathOf(o) { const a = []; while (o && o.parent) { a.unshift(o.parent.children.indexOf(o)); o = o.parent; } return a.join('/'); }
function fromPath(p) { let o = G.scene; for (const k of p.split('/')) { if (!o) return null; o = o.children[+k]; } return o || null; }
function resolve(id) {
  const [k, a, b] = id.split(':');
  if (k === 'e') { const it = ED.items.find(i => i.id === id.slice(2)); return it ? { obj: it.obj, rec: it } : null; }
  if (k === 's') { const o = G.slotHolders[a] && G.slotHolders[a][+b]; return o ? { obj: o } : null; }
  if (k === 'n') { const n = G.npcs[+a]; return n ? { obj: n.holder } : null; }
  if (k === 'c') { const c = G.CITY.cars[+a]; return c ? { obj: c.g } : null; }
  if (k === 'b') { const m = bldMesh(); return m ? { inst: m, i: +a } : null; }
  if (k === 'i') { const m = fromPath(a); return m && m.isInstancedMesh ? { inst: m, i: +b } : null; }
  if (k === 'p') { const o = fromPath(a); return o ? { obj: o } : null; }
  return null;
}
function recOf(sel) {   // dünyadaki nesneye eklenen özellikler (spawn olmayanlar için)
  if (sel.rec) return sel.rec; const id = worldId(sel); let r = ED.mods.get(id); if (!r) { r = { id, world: true, sel, props: Object.assign({}, PROP_DEF, { solid: false }), t: Math.random() * 6 }; ED.mods.set(id, r); } return r;
}
function entityHp(sel) {   // canlıların gerçek canı
  const o = sel.obj; if (!o) return null;
  try { const n = G.npcs.find(n => n.holder === o); if (n) return { get: () => n.hp ?? 100, set: v => { n.hp = v; } }; } catch (e) {}
  try { const a = window.__sehir && __sehir.INV.al.find(a => a.m.root === o); if (a) return { get: () => a.hp, set: v => { a.hp = v; a.max = Math.max(a.max, v); } }; } catch (e) {}
  try { const m = window.__spc && __spc.SP && __spc.SP.mobs.find(m => m.g === o); if (m) return { get: () => m.hp, set: v => { m.hp = v; } }; } catch (e) {}
  return null;
}

/* ---------- 🎯 seçim kutusu ---------- */
const helper = new T.Box3Helper(new T.Box3(), 0xffd600); helper.userData.edHelper = true; helper.visible = false; G.scene.add(helper);
const ghost = new T.Mesh(new T.SphereGeometry(.25, 10, 8), new T.MeshBasicMaterial({ color: 0xffd600, depthTest: false })); ghost.userData.edHelper = true; ghost.visible = false; ghost.renderOrder = 999; G.scene.add(ghost);
function select(sel) { ED.sel = sel; if (sel) sel.rec = sel.rec || (sel.obj && sel.obj.userData.edRec) || null; panel(); }
function selBox(sel, out) { if (sel.inst) { const m = new T.Matrix4(); sel.inst.getMatrixAt(sel.i, m); m.premultiply(sel.inst.matrixWorld); sel.inst.geometry.computeBoundingBox(); return out.copy(sel.inst.geometry.boundingBox).applyMatrix4(m); } return out.setFromObject(sel.obj); }
function trGet(sel) { if (sel.inst) { const m = new T.Matrix4(), p = new T.Vector3(), q = new T.Quaternion(), s = new T.Vector3(); sel.inst.getMatrixAt(sel.i, m); m.decompose(p, q, s); const e = new T.Euler().setFromQuaternion(q, 'YXZ'); return { p, r: e, s }; } const o = sel.obj, rec = sel.rec; return { p: (rec && rec.base && rec.spawn) ? rec.base : o.position, r: o.rotation, s: o.scale }; }
function trSet(sel, p, r, s, quiet) {
  if (sel.inst) { const m = new T.Matrix4().compose(p, new T.Quaternion().setFromEuler(r), s); sel.inst.setMatrixAt(sel.i, m); sel.inst.instanceMatrix.needsUpdate = true; sel.inst.computeBoundingSphere && sel.inst.computeBoundingSphere();
    try { const C = G.CITY; if (C && C.bld && sel.inst.count === C.bld.length && C.obs[sel.i] && C.obs[sel.i].box) { const o = C.obs[sel.i], A = G.AREAS.city, b = C.bld[sel.i]; o.x = A.cx + p.x; o.z = A.cz + p.z; o.hx = s.x / 2; o.hz = s.z / 2; o.top = o.h = p.y + s.y / 2; b[0] = p.x; b[1] = p.z; b[2] = s.x; b[3] = s.z; b[4] = s.y; } } catch (e) {} }
  else { const o = sel.obj, rec = sel.rec; if (rec && rec.spawn) { rec.base = p.clone(); } o.position.copy(p); o.rotation.copy(r); o.scale.copy(s);
    try { const ob = o.userData.obs; if (ob && !Array.isArray(ob)) { ob.x = p.x; ob.z = p.z; } } catch (e) {} if (rec && rec.spawn) refreshObs(rec); }
  if (!quiet) { if (!(sel.rec && sel.rec.spawn)) wmSet(worldId(sel), 'tr', [p.toArray().map(v => +v.toFixed(2)), [r.x, r.y, r.z].map(v => +v.toFixed(3)), s.toArray().map(v => +v.toFixed(3))]); const now = performance.now(); if (now - ED.sendT > 90) { ED.sendT = now; send({ op: 'set', id: worldId(sel), tr: [p.toArray(), [r.x, r.y, r.z], s.toArray()] }); } if (sel.rec && sel.rec.spawn) save(); }
}

/* ---------- 🖥️ arayüz ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>
body.edOn > *:not(canvas):not(#edUI):not(#edTop):not(#edAdd):not(#edPad):not(script):not(#sftErrBox){display:none !important}
#edTop{position:fixed;left:50%;top:calc(8px + env(safe-area-inset-top));transform:translateX(-50%);z-index:40;display:none;gap:6px;padding:6px;border-radius:14px;background:#141820ee;box-shadow:0 4px 16px #0008}
#edTop button,#edUI button,#edAdd button,#edPad button{border:1px solid #ffffff33;background:#263040;color:#fff;border-radius:10px;padding:7px 10px;font:600 13px system-ui;cursor:pointer}
#edTop button:hover,#edUI button:hover,#edAdd button:hover{background:#34445a}#edTop .x{background:#7f1d1d}
#edUI{position:fixed;right:8px;top:calc(60px + env(safe-area-inset-top));bottom:8px;width:min(300px,46vw);z-index:40;display:none;overflow:auto;padding:10px;border-radius:14px;background:#141820ee;color:#e8eef5;font:600 13px system-ui}
#edUI h3{margin:2px 0 8px;font-size:15px}#edUI .r{display:flex;align-items:center;gap:6px;margin:5px 0}#edUI .r>span{flex:0 0 74px;opacity:.85}#edUI input[type=number]{width:62px;background:#0d1117;border:1px solid #ffffff33;color:#fff;border-radius:6px;padding:4px}
#edUI input[type=range]{flex:1}#edUI input[type=text]{flex:1;background:#0d1117;border:1px solid #ffffff33;color:#fff;border-radius:6px;padding:5px}#edUI .hint{opacity:.7;font-weight:500;font-size:12px;line-height:1.4}
#edUI .sec{margin-top:10px;padding-top:8px;border-top:1px solid #ffffff22}#edUI select{background:#0d1117;color:#fff;border:1px solid #ffffff33;border-radius:6px;padding:4px}
#edAdd{position:fixed;left:8px;top:calc(60px + env(safe-area-inset-top));z-index:41;display:none;grid-template-columns:repeat(4,1fr);gap:6px;width:min(360px,52vw);padding:10px;border-radius:14px;background:#141820f2}
#edAdd button{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;padding:7px 4px}#edAdd button b{font-size:20px}
#edPad{position:fixed;left:10px;bottom:12px;z-index:40;display:none;grid-template-columns:repeat(3,48px);gap:6px}#edPad button{height:48px;font-size:20px;padding:0}
#edTip{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:39;color:#fff;background:#000a;padding:5px 10px;border-radius:10px;font:600 12px system-ui;pointer-events:none}
</style>`);
document.body.insertAdjacentHTML('beforeend', `<div id="edTop"><button data-e="add">🧊 ${adT('Ekle')}</button><button data-e="dup">📋 ${adT('Kopyala')}</button><button data-e="del">🗑️ ${adT('Sil')}</button><button data-e="focus">🎯 ${adT('Odakla')}</button><button data-e="drop">⬇️ ${adT('Yere koy')}</button><button data-e="x" class="x">✖ ${adT('Çık')}</button></div>
<div id="edUI"></div><div id="edAdd">${TYPES.map(([k, ic, n]) => `<button data-t="${k}"><b>${ic}</b>${adT(n)}</button>`).join('')}</div>
<div id="edPad"><span></span><button data-m="f">⬆️</button><button data-m="u">⤴️</button><button data-m="l">⬅️</button><button data-m="b">⬇️</button><button data-m="r">➡️</button><span></span><span></span><button data-m="d">⤵️</button></div>`);
const tip = document.createElement('div'); tip.id = 'edTip'; tip.style.display = 'none'; document.body.appendChild(tip); $('edUI').before(tip);
for (const id of ['edTop', 'edUI', 'edAdd', 'edPad']) for (const ev of ['pointerdown', 'mousedown', 'touchstart', 'wheel', 'keydown']) $(id).addEventListener(ev, e => e.stopPropagation(), { passive: ev !== 'keydown' });
$('edTop').addEventListener('click', e => { const b = e.target.closest('[data-e]'); if (!b) return; const k = b.dataset.e;
  if (k === 'x') exit(); else if (k === 'add') { const a = $('edAdd'); a.style.display = a.style.display === 'grid' ? 'none' : 'grid'; } else if (k === 'dup') dup(); else if (k === 'del') del(); else if (k === 'focus') focus(); else if (k === 'drop') dropDown(); });
$('edAdd').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return; spawn(b.dataset.t); $('edAdd').style.display = 'none'; });
for (const b of $('edPad').querySelectorAll('[data-m]')) { const k = b.dataset.m, on = v => { const M = ED.mv; if (k === 'f') M.z = v; if (k === 'b') M.z = -v; if (k === 'l') M.x = -v; if (k === 'r') M.x = v; if (k === 'u') M.y = v; if (k === 'd') M.y = -v; };
  b.addEventListener('pointerdown', e => { e.stopPropagation(); on(1); }); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => on(0)); }
const num = (v, d = 2) => (+v).toFixed(d);
function panel() {
  const U = $('edUI'); if (!ED.on) return; const s = ED.sel;
  if (!s) { U.innerHTML = `<h3>🛠️ ${adT('Çalışma modu')}</h3><div class="hint">${ED.touch ? adT('Ekrana dokun: seç · seçiliyi sürükle: taşı · boş yeri sürükle: etrafa bak · alttaki oklar: uç') : adT('Tıkla: seç · seçiliyi sürükle: taşı · sağ tık sürükle: bak · WASD / QE: uç (Shift hızlı) · ok tuşları ve PageUp/Down: kaydır · [ ]: döndür · + / −: boyut · Delete: sil · Ctrl+D: kopyala · F2 / Esc: çık')}</div>
    <div class="sec hint">🧊 ${adT('Ekle ile yeni nesne koy. Eklediklerin bu bölgede kayıtlı kalır')}${mpOn() ? ' · 👥 ' + adT('arkadaşlarında da görünür') : ''}.</div><div class="sec hint">📍 ${adT('Bölge')}: ${G.curKey} · ${adT('eklenen')}: ${ED.items.filter(i => i.spawn && i.area === G.curKey).length}</div>`; return; }
  const tr = trGet(s), rec = s.inst ? null : recOf(s), hp = s.inst ? null : entityHp(s), isSp = rec && rec.spawn, P = rec ? rec.props : null;
  const SLN = { tree: '🌳 Ağaç', pine: '🌲 Çam', house: '🏠 Ev', rock: '🪨 Kaya', lamp: '💡 Lamba', bush: '🌿 Çalı', crate: '📦 Sandık', bench: '🪑 Bank', flower: '🌸 Çiçek' }, wid = s.inst ? '' : worldId(s);
  let wname = null; if (wid.startsWith('s:')) wname = SLN[wid.split(':')[1]] || '📦 ' + wid.split(':')[1]; else if (wid.startsWith('n:')) { const n = G.npcs[+wid.split(':')[1]]; wname = '🧍 ' + ((n && n.name) || adT('Kişi')); } else if (wid.startsWith('c:')) wname = '🚗 ' + adT('Araba'); else if (s.obj && s.obj.userData.cyPed) wname = '🧍 ' + adT('Şehirli');
  const name = wname && !isSp ? wname : isSp ? (TYPES.find(t => t[0] === rec.type) || [, '🧊', rec.type])[1] + ' ' + adT((TYPES.find(t => t[0] === rec.type) || [, , rec.type])[2]) : s.inst ? '🏢 ' + adT('Toplu nesne') + ' #' + s.i : '📦 ' + (s.obj.name || s.obj.type);
  const col = isSp ? rec.col : (() => { let c = 0xffffff; s.obj && s.obj.traverse(m => { if (m.isMesh && m.material && m.material.color && c === 0xffffff) c = m.material.color.getHex(); }); return c; })();
  const row = (lab, html) => `<div class="r"><span>${lab}</span>${html}</div>`, n3 = (k, v, st) => ['x', 'y', 'z'].map((a, i) => `<input type="number" step="${st}" data-f="${k}${a}" value="${num(v[i])}">`).join('');
  U.innerHTML = `<h3>${name}</h3>
    ${row(adT('Yer'), n3('p', [tr.p.x, tr.p.y, tr.p.z], .5))}
    ${row(adT('Dönüş'), `<input type="range" min="-180" max="180" step="1" data-f="ry" value="${Math.round(tr.r.y * 180 / Math.PI)}"><input type="number" step="15" data-f="ry2" value="${Math.round(tr.r.y * 180 / Math.PI)}">`)}
    ${row(adT('Eğim'), `<input type="number" step="15" data-f="rx" value="${Math.round(tr.r.x * 180 / Math.PI)}"><input type="number" step="15" data-f="rz" value="${Math.round(tr.r.z * 180 / Math.PI)}">`)}
    ${row(adT('Boyut'), `<input type="range" min="-2.3" max="3" step=".01" data-f="su" value="${Math.log(tr.s.x).toFixed(2)}"><b>${num(tr.s.x, 1)}×</b>`)}
    ${row('', n3('s', [tr.s.x, tr.s.y, tr.s.z], .1))}
    ${s.inst ? '' : row(adT('Renk'), `<input type="color" data-f="col" value="#${new T.Color(col).getHexString()}">`)}
    ${isSp && rec.type === 'text' ? row(adT('Yazı'), `<input type="text" data-f="text" maxlength="40" value="${(rec.text || '').replace(/"/g, '&quot;')}">`) : ''}
    ${isSp && ['box', 'ball', 'cyl', 'cone', 'ramp', 'plat', 'ring', 'star', 'wall'].includes(rec.type) ? row(adT('Şekil'), `<select data-f="shape">${['box', 'ball', 'cyl', 'cone', 'ramp', 'plat', 'ring', 'star', 'wall'].map(k => `<option value="${k}" ${k === rec.type ? 'selected' : ''}>${(TYPES.find(t => t[0] === k) || [])[1]} ${adT((TYPES.find(t => t[0] === k) || [])[2])}</option>`).join('')}</select>`) : ''}
    ${hp ? row('❤️ ' + adT('Can'), `<input type="number" step="10" data-f="ehp" value="${Math.round(hp.get())}">`) : ''}
    ${P ? `<div class="sec"><b>✨ ${adT('Özellikler')}</b>
      ${isSp ? row('❤️ ' + adT('Can'), `<input type="number" step="50" min="0" data-f="hp" value="${P.hp}"><span class="hint">${adT('0 = kırılmaz')}</span>`) : ''}
      ${row('💥 ' + adT('Hasar'), `<input type="number" step="5" min="0" data-f="dmg" value="${P.dmg}"><span class="hint">${adT('dokununca / sn')}</span>`)}
      ${row('🦘 ' + adT('Zıplatma'), `<input type="number" step="2" min="0" data-f="bounce" value="${P.bounce}">`)}
      ${row('⚡ ' + adT('Hız'), `<input type="number" step="5" min="0" data-f="speed" value="${P.speed}">`)}
      ${row('💚 ' + adT('İyileştir'), `<input type="number" step="5" min="0" data-f="heal" value="${P.heal}">`)}
      ${row('🔄 ' + adT('Dönme'), `<input type="number" step="15" data-f="spin" value="${P.spin}"><span class="hint">°/sn</span>`)}
      ${row('🎈 ' + adT('Süzülme'), `<input type="number" step=".5" min="0" data-f="float" value="${P.float}"><span class="hint">m</span>`)}
      ${row('↔️ ' + adT('Devriye'), `<input type="number" step="1" min="0" data-f="patrol" value="${P.patrol}"><span class="hint">m</span>`)}
      ${row('🐕 ' + adT('Takip et'), `<input type="checkbox" data-f="follow" ${P.follow ? 'checked' : ''}>`)}
      ${row('✨ ' + adT('Parlak'), `<input type="checkbox" data-f="glow" ${P.glow ? 'checked' : ''}>`)}
      ${isSp ? row('🧱 ' + adT('Katı'), `<input type="checkbox" data-f="solid" ${P.solid ? 'checked' : ''}><span class="hint">${adT('üstünde durulur')}</span>`) : ''}</div>` : ''}
    <div class="sec hint">${adT('Taşımak için nesneyi sürükle.')} ${s.inst ? adT('Bu, birçok parçadan oluşan toplu bir nesnenin tek parçası.') : ''}</div>`;
}
$('edUI').addEventListener('input', e => edField(e.target, false)); $('edUI').addEventListener('change', e => edField(e.target, true));
function edField(el, done) {
  const s = ED.sel, f = el.dataset.f; if (!s || !f) return; const tr = trGet(s), p = tr.p.clone(), r = new T.Euler(tr.r.x, tr.r.y, tr.r.z, 'YXZ'), sc = tr.s.clone(), v = +el.value;
  if (/^p[xyz]$/.test(f)) p[f[1]] = v; else if (f === 'ry' || f === 'ry2') r.y = v * Math.PI / 180; else if (f === 'rx') r.x = v * Math.PI / 180; else if (f === 'rz') r.z = v * Math.PI / 180;
  else if (f === 'su') { const k = Math.exp(v) / (sc.x || 1); sc.multiplyScalar(k); } else if (/^s[xyz]$/.test(f)) sc[f[1]] = Math.max(.01, v);
  else if (f === 'col') { setColor(s, parseInt(el.value.slice(1), 16)); return; }
  else if (f === 'text') { const rec = s.rec; rec.text = el.value; applyLook(rec); if (done) { send({ op: 'look', id: worldId(s), col: rec.col, text: rec.text }); save(); } return; }
  else if (f === 'shape') { reshape(s.rec, el.value); return; }
  else if (f === 'ehp') { const h = entityHp(s); if (h) h.set(v); return; }
  else { const rec = recOf(s), P = rec.props; P[f] = el.type === 'checkbox' ? el.checked : v; if (f === 'hp') rec.hp = v; if (f === 'glow' && rec.spawn) applyLook(rec); if (f === 'glow' && !rec.spawn) glowWorld(s, P.glow); if (f === 'solid' && rec.spawn) refreshObs(rec); if (f === 'patrol' || f === 'float') rec.base = trGet(s).p.clone();
    send({ op: 'props', id: rec.id.startsWith && rec.spawn ? 'e:' + rec.id : rec.id, props: P }); if (rec.spawn) save(); return; }
  trSet(s, p, r, sc); if (done) panel();
}
function setColor(s, c) { if (s.rec && s.rec.spawn) { s.rec.col = c; applyLook(s.rec); save(); } else if (s.obj) { s.obj.traverse(m => { if (!m.isMesh || !m.material || !m.material.color) return; if (!m.userData.edCl) { m.material = Array.isArray(m.material) ? m.material.map(x => x.clone()) : m.material.clone(); m.userData.edCl = true; } (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => x.color && x.color.setHex(c)); }); wmSet(worldId(s), 'col', c); } send({ op: 'look', id: worldId(s), col: c }); }
function glowWorld(s, on) { if (!s.obj) return; s.obj.traverse(m => { if (!m.isMesh || !m.material || !('emissive' in m.material)) return; if (!m.userData.edCl) { m.material = m.material.clone(); m.userData.edCl = true; } m.material.emissive.copy(on ? m.material.color : new T.Color(0)); m.material.emissiveIntensity = on ? .6 : 0; }); }
function reshape(rec, type) { if (!rec || rec.type === type) return; const d = ser(rec); d.type = type; d.props = rec.props; const sel = ED.sel; removeItem(rec, true); const it = makeItem(d); select({ obj: it.obj, rec: it }); send({ op: 'add', it: ser(it) }); save(); }

/* ---------- ➕ ekle / kopyala / sil ---------- */
function spawnPoint() { const d = G.camera.getWorldDirection(V1), o = G.camera.position; let p = o.clone().addScaledVector(d, 10); try { const gy = G.groundAt(p.x, p.z, p.y + 50); if (gy > -50 && gy < p.y + 2) p.y = gy; } catch (e) {} return p; }
function spawn(type, base) {
  const p = base ? base.p.slice() : spawnPoint().toArray(), d = { id: myId().slice(-5) + '-' + Date.now().toString(36) + (ED.uid++), type, p, r: base ? base.r : [0, ED.yaw + Math.PI, 0], s: base ? base.s : [1, 1, 1], col: base ? base.col : COL0[type] || 0xffffff, props: base ? JSON.parse(JSON.stringify(base.props)) : {}, text: base ? base.text : (type === 'text' ? 'SFT' : ''), area: G.curKey };
  if (type === 'text' && !base) { const t = prompt(adT('Yazı:'), 'SFT'); if (t === null) return; d.text = t.slice(0, 40); }
  const it = makeItem(d); select({ obj: it.obj, rec: it }); send({ op: 'add', it: ser(it) }); save(); try { G.play('pop'); } catch (e) {}
  return it;
}
function dup() { const s = ED.sel; if (!s || !s.rec || !s.rec.spawn) { G.showMsg(adT('Yalnızca eklenen nesneler kopyalanır'), 1.6); return; } const b = ser(s.rec); b.p = [b.p[0] + 2, b.p[1], b.p[2] + 2]; spawn(s.rec.type, b); }
function del() { const s = ED.sel; if (!s) return; if (s.rec && s.rec.spawn) { send({ op: 'del', id: 'e:' + s.rec.id }); removeItem(s.rec); return; } if (s.obj) { s.obj.visible = false; try { const ob = s.obj.userData.obs; if (ob) ob.pass = true; } catch (e) {} send({ op: 'hide', id: worldId(s) }); wmSet(worldId(s), 'hide', 1); select(null); } }
function focus() { const s = ED.sel; if (!s) return; const b = selBox(s, new T.Box3()), c = b.getCenter(V1), r = Math.max(2, b.getSize(V2).length()); ED.p.copy(c).add(V3.set(Math.sin(ED.yaw) * r * 1.2, r * .5, Math.cos(ED.yaw) * r * 1.2)); ED.pitch = -Math.atan2(r * .5, r * 1.2); }
function dropDown() { const s = ED.sel; if (!s) return; const tr = trGet(s), p = tr.p.clone(); try { p.y = G.groundAt(p.x, p.z, p.y + 1); } catch (e) {} trSet(s, p, tr.r, tr.s); panel(); }

/* ---------- 🎮 giriş / çıkış ---------- */
function enter() {
  if (!allowed()) { G.showMsg('🔒 ' + adT('Çalışma modu için admin gerekir (çok oyunculuda odada bir admin olmalı)'), 3); return; }
  if (ED.on) return; ED.on = true; ED.touch = !!G.touchMode; G.paused = true; try { $('pause').style.display = 'none'; } catch (e) {} if (document.pointerLockElement) document.exitPointerLock();
  const c = G.camera, d = c.getWorldDirection(V1); ED.p.copy(c.position); ED.yaw = Math.atan2(-d.x, -d.z); ED.pitch = Math.asin(Math.max(-1, Math.min(1, d.y)));
  document.body.classList.add('edOn'); for (const id of ['edTop', 'edUI']) $(id).style.display = id === 'edTop' ? 'flex' : 'block'; $('edPad').style.display = ED.touch ? 'grid' : 'none'; tip.style.display = 'block';
  tip.textContent = '🛠️ ' + adT('Çalışma modu — oyun durdu') + (mpOn() ? ' · 👥 ' + adT('değişiklikler herkeste') : ''); areaSync(); panel(); send({ op: 'note', on: 1 });
}
function exit() { if (!ED.on) return; ED.on = false; document.body.classList.remove('edOn'); for (const id of ['edTop', 'edUI', 'edAdd', 'edPad']) $(id).style.display = 'none'; tip.style.display = 'none'; helper.visible = ghost.visible = false; ED.drag = ED.look = null; flushSave(); try { G.resumeGame(); } catch (e) { G.paused = false; } }
function toggle() { if (ED.on) exit(); else enter(); }
// ⏸ duraklat menüsüne ve admin paneline düğme
try { const pb = $('pause') && $('pause').querySelector('.pR'); if (pb) { pb.insertAdjacentHTML('afterbegin', `<button id="pEd">🛠️ ${adT('Çalışma modu')} <small>F2 · ${adT('admin')}</small></button>`); $('pEd').addEventListener('click', e => { e.stopPropagation(); enter(); }); } } catch (e) {}
try { G.ADM_LIST.splice(1, 0, ['🛠️ Çalışma modu', '🛠️ Work mode', [['ed_on', '🛠️', 'Çalışma moduna geç (F2)', 'Enter work mode (F2)', () => { try { G.ADM && (G.ADM.open = false); const a = $('adm'); if (a) a.style.display = 'none'; } catch (e) {} enter(); }], ['ed_clr', '🧹', 'Bu bölgede eklenenleri sil', 'Clear spawned here', () => { for (const it of ED.items.filter(i => i.spawn && i.area === G.curKey)) { send({ op: 'del', id: 'e:' + it.id }); removeItem(it, true); } flushSave(); G.showMsg('🧹 ' + adT('Temizlendi'), 1.4); }]]]); for (const it of G.ADM_LIST[1][2]) G.ADM_F[it[0]] = it[4]; } catch (e) {}

/* ---------- ⌨️🖱️ kontroller ---------- */
addEventListener('keydown', e => {
  if (e.code === 'F2' && G.started) { e.preventDefault(); e.stopImmediatePropagation(); toggle(); return; }
  if (!ED.on) return; if (e.target && e.target.matches && e.target.matches('input,select,textarea')) return; e.stopImmediatePropagation(); ED.keys[e.code] = true;
  const s = ED.sel; if (e.code === 'Escape') { if (s) select(null); else exit(); return; }
  if (!s) return; const tr = trGet(s), p = tr.p.clone(), r = new T.Euler(tr.r.x, tr.r.y, tr.r.z, 'YXZ'), sc = tr.s.clone(), st = e.shiftKey ? 5 : .5, f = V1.set(-Math.sin(ED.yaw), 0, -Math.cos(ED.yaw)), rt = V2.set(Math.cos(ED.yaw), 0, -Math.sin(ED.yaw)); let ch = true;
  if (e.code === 'ArrowUp') p.addScaledVector(f, st); else if (e.code === 'ArrowDown') p.addScaledVector(f, -st); else if (e.code === 'ArrowLeft') p.addScaledVector(rt, -st); else if (e.code === 'ArrowRight') p.addScaledVector(rt, st);
  else if (e.code === 'PageUp') p.y += st; else if (e.code === 'PageDown') p.y -= st; else if (e.code === 'BracketLeft') r.y += Math.PI / 12; else if (e.code === 'BracketRight') r.y -= Math.PI / 12;
  else if (e.key === '+' || e.code === 'NumpadAdd' || e.code === 'Equal') sc.multiplyScalar(1.1); else if (e.key === '-' || e.code === 'NumpadSubtract' || e.code === 'Minus') sc.multiplyScalar(1 / 1.1);
  else if (e.code === 'Delete' || e.code === 'Backspace') { del(); ch = false; } else if (e.code === 'KeyD' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); dup(); ch = false; } else ch = false;
  if (ch) { e.preventDefault(); trSet(s, p, r, sc); panel(); }
}, true);
addEventListener('keyup', e => { if (ED.on) { ED.keys[e.code] = false; e.stopImmediatePropagation(); } }, true);
const cvs = () => G.renderer ? G.renderer.domElement : document.querySelector('canvas');
function pDown(e) {
  if (!ED.on) return; e.stopImmediatePropagation(); e.preventDefault(); const tch = e.pointerType === 'touch';
  if (e.button === 2 && !tch) { ED.look = { x: e.clientX, y: e.clientY }; return; }
  const hit = pickAt(e.clientX, e.clientY), s = ED.sel, same = s && hit && ((hit.obj && hit.obj === s.obj) || (hit.inst && hit.inst === s.inst && hit.i === s.i));
  if (same) { const tr = trGet(s); ED.drag = { y: tr.p.y, off: tr.p.clone().sub(hit.pt).setY(0), moved: false, id: e.pointerId }; return; }
  ED.pend = { x: e.clientX, y: e.clientY, hit, t: performance.now(), id: e.pointerId }; if (tch) ED.look = { x: e.clientX, y: e.clientY, id: e.pointerId };
}
function pMove(e) {
  if (!ED.on) return; if (ED.look) { const dx = e.clientX - ED.look.x, dy = e.clientY - ED.look.y; ED.look.x = e.clientX; ED.look.y = e.clientY; ED.yaw -= dx * .005; ED.pitch = Math.max(-1.5, Math.min(1.5, ED.pitch - dy * .005)); if (ED.pend && Math.hypot(e.clientX - ED.pend.x, e.clientY - ED.pend.y) > 8) ED.pend.moved = true; return; }
  if (ED.drag && ED.sel) { const r = cvs().getBoundingClientRect(); RC.setFromCamera(new T.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), G.camera); const pl = new T.Plane(new T.Vector3(0, 1, 0), -ED.drag.y), pt = new T.Vector3(); if (RC.ray.intersectPlane(pl, pt)) { const tr = trGet(ED.sel); trSet(ED.sel, pt.add(ED.drag.off).setY(ED.drag.y), tr.r, tr.s); ED.drag.moved = true; } }
}
function pUp(e) { if (!ED.on) return; e.stopImmediatePropagation(); if (ED.drag) { if (ED.drag.moved) panel(); ED.drag = null; } const pd = ED.pend; ED.pend = null; ED.look = null; if (pd && !pd.moved && performance.now() - pd.t < 600) select(pd.hit); }
addEventListener('pointerdown', e => { if (ED.on && e.target === cvs()) pDown(e); }, true); addEventListener('pointermove', e => { if (ED.on) pMove(e); }, true); addEventListener('pointerup', e => { if (ED.on && (e.target === cvs() || ED.drag || ED.look || ED.pend)) pUp(e); }, true);
addEventListener('wheel', e => { if (!ED.on || e.target !== cvs()) return; e.stopImmediatePropagation(); const d = G.camera.getWorldDirection(V1); ED.p.addScaledVector(d, -Math.sign(e.deltaY) * (e.shiftKey ? 12 : 3)); }, { capture: true, passive: true });
addEventListener('contextmenu', e => { if (ED.on) e.preventDefault(); }, true);
for (const ev of ['mousedown', 'click', 'touchstart']) addEventListener(ev, e => { if (ED.on && e.target === cvs()) e.stopImmediatePropagation(); }, true);

/* ---------- 🌐 çok oyunculu ---------- */
function net(m) {
  try { const pl = G.MP.players[m.f], ok = (pl && pl.admin) || Object.values(G.MP.players).some(p => p.admin); if (!ok || m.f === myId()) return; } catch (e) { return; }
  if (m.op === 'add') { const d = m.it; if (!ED.items.find(i => i.id === d.id)) { const it = makeItem(d); it.obj.visible = d.area === G.curKey; } return; }
  if (m.op === 'note') { G.showMsg('🛠️ ' + adT('Bir arkadaşın çalışma modunda'), 2); return; }
  const s = resolve(m.id); if (!s) return; if (!s.rec && s.obj) s.rec = s.obj.userData.edRec || null;
  if (m.op === 'set') { trSet(s, new T.Vector3().fromArray(m.tr[0]), new T.Euler(m.tr[1][0], m.tr[1][1], m.tr[1][2], 'YXZ'), new T.Vector3().fromArray(m.tr[2]), true); if (s.rec && s.rec.spawn) save(); }
  else if (m.op === 'del') { if (s.rec && s.rec.spawn) removeItem(s.rec); }
  else if (m.op === 'hide') { if (s.obj) s.obj.visible = false; }
  else if (m.op === 'look') { if (s.rec && s.rec.spawn) { s.rec.col = m.col; if (m.text != null) s.rec.text = m.text; applyLook(s.rec); save(); } else setColorLocal(s, m.col); }
  else if (m.op === 'props') { const r = recOf(s); Object.assign(r.props, m.props); if (r.spawn) { r.hp = r.props.hp; applyLook(r); refreshObs(r); save(); } }
  else if (m.op === 'kill') { if (s.rec && s.rec.spawn) breakItem(s.rec, true); }
  if (ED.sel && worldId(ED.sel) === m.id) panel();
}
function setColorLocal(s, c) { if (!s.obj) return; s.obj.traverse(m => { if (!m.isMesh || !m.material || !m.material.color) return; if (!m.userData.edCl) { m.material = m.material.clone(); m.userData.edCl = true; } m.material.color.setHex(c); }); }

/* ---------- 🎯 kırılabilir nesneler (silah, yumruk, kozmik güçler) ---------- */
function breakItem(it, quiet) { const b = new T.Box3().setFromObject(it.obj), c = b.getCenter(V1); try { G.spawnDust && [...Array(20)].forEach(() => G.spawnDust(c.x, c.y, c.z, 1.2, 2, 0, 0, it.col)); G.play('boom', { gain: .5 }); } catch (e) {} if (!quiet) send({ op: 'kill', id: 'e:' + it.id }); removeItem(it); }
function targets() { const L = []; for (const it of ED.items) { if (!it.spawn || it.dead || !(it.props.hp > 0) || it.area !== G.curKey) continue; const b = new T.Box3().setFromObject(it.obj); L.push({ id: it, p: new T.Vector3((b.min.x + b.max.x) / 2, b.min.y, (b.min.z + b.max.z) / 2), h: b.max.y - b.min.y, r: Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2, hit: d => { it.hp -= d; flash(it); if (it.hp <= 0) breakItem(it); } }); } return L; }
function flash(it) { it.flashT = .12; }
function ray(o, d, best, dmg) { let bt = best, hit = null; const r = new T.Ray(o, d), pt = new T.Vector3(); for (const it of ED.items) { if (!it.spawn || it.dead || !(it.props.hp > 0) || it.area !== G.curKey) continue; const b = new T.Box3().setFromObject(it.obj); if (r.intersectBox(b, pt)) { const t = pt.distanceTo(o); if (t < bt) { bt = t; hit = it; } } } if (hit) { hit.hp -= dmg; flash(hit); if (hit.hp <= 0) breakItem(hit); return bt; } return null; }
function ground(x, z, y, g) { for (const it of ED.items) { if (it.type !== 'ramp' || it.dead || !it.props.solid || it.area !== G.curKey) continue; const o = it.obj, lp = o.worldToLocal(V3.set(x, y, z)); if (Math.abs(lp.x) < 2 && lp.z > -1.2 && lp.z < 1.2 && false) {} const inv = lp; if (inv.x > -2 / 1 && inv.x < 2 && Math.abs(inv.z) < 1.2) { const hy = 1.6 * (inv.x + 2) / 4; const wy = o.localToWorld(V2.set(inv.x, hy, inv.z)).y; if (wy <= y + 1.3 && wy > g) g = wy; } } return g; }

/* ---------- ⏱️ her kare ---------- */
let behT = 0;
function tick(dt) {
  areaSync(); wmApply(); saveT -= dt; if (saveT > 0 && saveT - dt <= 0) flushSave();
  ED.n = ED.items.length;
  if (ED.on) {   // 🎥 izleyici kamera
    const K = ED.keys, sp = (K.ShiftLeft || K.ShiftRight ? 40 : 12) * dt, f = V1.set(-Math.sin(ED.yaw) * Math.cos(ED.pitch), Math.sin(ED.pitch), -Math.cos(ED.yaw) * Math.cos(ED.pitch)), rt = V2.set(Math.cos(ED.yaw), 0, -Math.sin(ED.yaw)), M = ED.mv;
    const fw = (K.KeyW ? 1 : 0) - (K.KeyS ? 1 : 0) + M.z, sd = (K.KeyD ? 1 : 0) - (K.KeyA ? 1 : 0) + M.x, up = (K.KeyE || K.Space ? 1 : 0) - (K.KeyQ || K.KeyC ? 1 : 0) + M.y;
    ED.p.addScaledVector(f, fw * sp).addScaledVector(rt, sd * sp); ED.p.y += up * sp;
    const c = G.camera; c.position.copy(ED.p); E1.set(ED.pitch, ED.yaw, 0, 'YXZ'); c.quaternion.setFromEuler(E1); c.updateMatrixWorld();
    if (ED.sel) { const b = selBox(ED.sel, helper.box); helper.visible = !b.isEmpty(); ghost.visible = false; } else helper.visible = false;
  }
  if (G.paused || G.photoMode || !dt) { flashTick(dt); return; }
  // ✨ özellik davranışları (oyun akarken)
  const P = G.player.position, t = G.elapsed; behT -= dt; const doHit = behT <= 0; if (doHit) behT = .25;
  const all = ED.items.filter(i => !i.dead && i.area === G.curKey).concat([...ED.mods.values()].filter(r => r.sel && (r.sel.obj || r.sel.inst)));
  for (const r of all) { const p = r.props; if (!p) continue; const o = r.spawn ? r.obj : r.sel.obj; if (!o) continue; r.t += dt;
    if (p.spin) o.rotation.y += p.spin * Math.PI / 180 * dt;
    if ((p.float || p.patrol) && r.base) { o.position.copy(r.base); if (p.float) o.position.y += Math.sin(r.t * 2) * p.float; if (p.patrol) { o.position.x += Math.sin(r.t * .8) * p.patrol * Math.cos(o.rotation.y); o.position.z -= Math.sin(r.t * .8) * p.patrol * Math.sin(o.rotation.y); } }
    else if ((p.float || p.patrol) && !r.base) r.base = o.position.clone();
    if (p.follow) { V1.subVectors(P, o.position).setY(0); const d = V1.length(); if (d > 3) { o.position.addScaledVector(V1.normalize(), Math.min(d - 3, 6 * dt)); o.rotation.y = Math.atan2(V1.x, V1.z); try { o.position.y = G.groundAt(o.position.x, o.position.z, o.position.y + 1); } catch (e) {} } if (r.base) r.base.copy(o.position); }
    if (o.userData.rig) try { G.animateStick(o.userData.rig, dt, { speed: p.follow || p.patrol ? 2 : 0 }); } catch (e) {}
    if (!(p.dmg || p.bounce || p.speed || p.heal)) continue;
    const b = new T.Box3().setFromObject(o); b.expandByScalar(.25); if (!(P.x > b.min.x && P.x < b.max.x && P.z > b.min.z && P.z < b.max.z && P.y < b.max.y + .4 && P.y + 1.6 > b.min.y)) continue;
    if (p.bounce && P.y >= b.max.y - .8) { try { G.vy = p.bounce; G.onGround = false; G.play('boing'); } catch (e) {} }
    if (p.speed) { try { const f = G.facing; G.vel.x = Math.sin(f) * p.speed; G.vel.z = Math.cos(f) * p.speed; } catch (e) {} }
    if (p.heal) { try { G.hp = Math.min(G.HPMAX, G.hp + p.heal * dt); } catch (e) {} }
    if (p.dmg && doHit) { try { G.damagePlayer(p.dmg * .25); } catch (e) {} }
  }
  flashTick(dt);
}
function flashTick(dt) { for (const it of ED.items) if (it.flashT > 0) { it.flashT -= dt; it.obj.traverse(m => { if (m.isMesh && m.material && 'emissive' in m.material) { m.material.emissive.setHex(it.flashT > 0 ? 0xffffff : it.props.glow ? it.col : 0); m.material.emissiveIntensity = it.flashT > 0 ? .9 : it.props.glow ? .6 : 0; } }); } }

window.__ed = { tick, net, targets, ray, ground, enter, exit, toggle, allowed, ED, n: 0 };
})(window.__sftG);
