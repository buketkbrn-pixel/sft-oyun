# Ankara bölgelerinin OpenStreetMap verisini indirip oyun için küçük bir biçime çevirir (© OpenStreetMap katkıcıları, ODbL)
import json, math, os, time, urllib.parse, urllib.request
REG = {'kizilay': (39.9208, 32.8541), 'ulus': (39.9419, 32.8543), 'anitkabir': (39.9250, 32.8369), 'cankaya': (39.8856, 32.8558)}
SV = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']
HW = 'motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|pedestrian|service|primary_link|secondary_link'
os.makedirs('data', exist_ok=True)
def fetch(q):
    for k in range(3):
        for u in SV:
            try:
                req = urllib.request.Request(u, data=urllib.parse.urlencode({'data': q}).encode(), headers={'User-Agent': 'sft-oyun/1.0 (github pages game)'})
                with urllib.request.urlopen(req, timeout=120) as r: j = json.load(r)
                if j.get('elements'): return j
            except Exception as e: print('err', u, e)
        time.sleep(20)
    raise SystemExit('indirilemedi')
for key, (lat, lon) in REG.items():
    dl, dn = .0045, .0059
    S, N, W, E = lat - dl, lat + dl, lon - dn, lon + dn
    q = f'[out:json][timeout:90];(way["building"]({S},{W},{N},{E});way["highway"~"^({HW})$"]({S},{W},{N},{E}););out geom;'
    j = fetch(q)
    kx, kz = 111320 * math.cos(math.radians(lat)), 110540
    xz = lambda p: (round((p['lon'] - lon) * kx * 10), round(-(p['lat'] - lat) * kz * 10))   # desimetre
    B, nodes, nidx, ways = [], [], {}, []
    for el in j['elements']:
        t = el.get('tags', {}); g = el.get('geometry')
        if el.get('type') != 'way' or not g: continue
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
    out = {'v': 1, 'lat': lat, 'lon': lon, 'b': B, 'n': [c for p in nodes for c in p], 'w': ways}
    with open(f'data/ankara_{key}.json', 'w', encoding='utf-8') as f: json.dump(out, f, separators=(',', ':'), ensure_ascii=False)
    print(key, len(B), 'bina', len(ways), 'yol', os.path.getsize(f'data/ankara_{key}.json'), 'bayt')
    time.sleep(10)
