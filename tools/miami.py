# Miami bölgelerinin OpenStreetMap verisini indirip oyun için küçük bir biçime çevirir (© OpenStreetMap katkıcıları, ODbL)
# binalar, yollar, kıyı çizgisi (deniz/körfez), göller, kum/plaj, park/çimen, ağaçlar (palmiyeler)
import json, math, os, time, urllib.parse, urllib.request
REG = {'southbeach': (25.7797, -80.1310), 'downtown': (25.7745, -80.1890), 'littlehavana': (25.7655, -80.2190), 'starisland': (25.7775, -80.1495)}
SV = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']
HW = 'motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|pedestrian|service|primary_link|secondary_link'
PALM = ('palm', 'arecaceae', 'sabal', 'roystonea', 'cocos', 'washingtonia', 'phoenix', 'veitchia', 'adonidia', 'dypsis', 'wodyetia', 'livistona', 'syagrus', 'ptychosperma', 'thrinax', 'coccothrinax', 'bismarckia', 'chamaerops')
os.makedirs('data', exist_ok=True)
def fetch(q):
    for k in range(4):
        for u in SV:
            try:
                req = urllib.request.Request(u, data=urllib.parse.urlencode({'data': q}).encode(), headers={'User-Agent': 'sft-oyun/1.0 (github pages game)'})
                with urllib.request.urlopen(req, timeout=180) as r: j = json.load(r)
                if j.get('elements'): return j
            except Exception as e: print('err', u, e)
        time.sleep(25)
    raise SystemExit('indirilemedi')
for key, (lat, lon) in REG.items():
    dl, dn = .0045, .005
    S, N, W, E = lat - dl, lat + dl, lon - dn, lon + dn
    bb = f'{S},{W},{N},{E}'
    q = (f'[out:json][timeout:120];(way["building"]({bb});way["highway"~"^({HW})$"]({bb});'
         f'way["natural"~"^(coastline|water|beach|sand)$"]({bb});way["leisure"~"^(park|garden|pitch|golf_course)$"]({bb});'
         f'way["landuse"~"^(grass|recreation_ground)$"]({bb});node["natural"="tree"]({bb}););out geom;')
    j = fetch(q)
    kx, kz = 111320 * math.cos(math.radians(lat)), 110540
    xz = lambda p: (round((p['lon'] - lon) * kx * 10), round(-(p['lat'] - lat) * kz * 10))   # desimetre
    LIM = 9000   # 900 m: kıyı çizgisinin bölgeden uzak parçaları atılır
    B, nodes, nidx, ways, coast, areas, trees = [], [], {}, [], [], [], []
    for el in j['elements']:
        t = el.get('tags', {})
        if el.get('type') == 'node':
            if t.get('natural') == 'tree':
                s = ' '.join(str(t.get(k, '')) for k in ('genus', 'species', 'taxon', 'name', 'species:en', 'leaf_type')).lower()
                x, z = xz(el); trees += [x, z, 1 if any(w in s for w in PALM) else 0]
            continue
        g = el.get('geometry')
        if el.get('type') != 'way' or not g: continue
        if t.get('natural') == 'coastline':
            run, prev = [], None
            for p in g:
                x, z = xz(p); inn = abs(x) < LIM and abs(z) < LIM
                if inn:
                    if not run and prev: run += list(prev)   # bölgeye girmeden önceki nokta (kesintisiz çizgi)
                    run += [x, z]
                elif run:
                    run += [x, z]
                    if len(run) >= 4: coast.append(run)
                    run = []
                prev = (x, z)
            if len(run) >= 4: coast.append(run)
            continue
        kind = None
        if t.get('natural') in ('water',): kind = 'w'
        elif t.get('natural') in ('beach', 'sand'): kind = 's'
        elif t.get('leisure') in ('park', 'garden', 'golf_course') or t.get('landuse') in ('grass', 'recreation_ground'): kind = 'g'
        elif t.get('leisure') == 'pitch': kind = 'p'
        if kind and 'building' not in t and 'highway' not in t:
            pts = [xz(p) for p in g]
            if len(pts) > 1 and pts[0] == pts[-1]: pts.pop()
            if len(pts) >= 3: areas.append([kind] + [c for p in pts for c in p])
            continue
        if 'highway' in t:
            if not el.get('nodes') or len(el['nodes']) != len(g): continue
            idx = []
            for nid, p in zip(el['nodes'], g):
                if nid not in nidx: nidx[nid] = len(nodes); nodes.append(xz(p))
                idx.append(nidx[nid])
            ways.append([t['highway'], 1 if (t.get('oneway') == 'yes' or t.get('junction') == 'roundabout') else 0] + idx)
        elif 'building' in t:
            pts = [xz(p) for p in g]
            if len(pts) > 1 and pts[0] == pts[-1]: pts.pop()
            if len(pts) < 3: continue
            h = 0
            try: h = float(t.get('height', '0').replace('m', '').strip() or 0)
            except: h = 0
            lv = 0
            try: lv = float(t.get('building:levels', '0') or 0)
            except: lv = 0
            nm = (t.get('name') or '')[:40]
            B.append([el['id'] % 100000, round(h * 10), round(lv * 10), t.get('building', 'yes')[:12], nm] + [c for p in pts for c in p])
    out = {'v': 2, 'lat': lat, 'lon': lon, 'b': B, 'n': [c for p in nodes for c in p], 'w': ways, 'c': coast, 'a': areas, 't': trees}
    with open(f'data/miami_{key}.json', 'w', encoding='utf-8') as f: json.dump(out, f, separators=(',', ':'), ensure_ascii=False)
    print(key, len(B), 'bina', len(ways), 'yol', len(coast), 'kıyı', len(areas), 'alan', len(trees) // 3, 'ağaç', sum(trees[2::3]), 'palmiye', os.path.getsize(f'data/miami_{key}.json'), 'bayt')
    time.sleep(10)
