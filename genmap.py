import json, re, sys
sys.setrecursionlimit(20000)

# ---- load Louisiana features ----
data = json.load(open('counties-fips.json', encoding='utf-8'))
la = [f for f in data['features'] if 'US22' in f['properties']['GEO_ID']]
print('LA features:', len(la))

# ---- canonical names straight from index.html (single source of truth) ----
html = open('index.html', encoding='utf-8').read()
canon = re.findall(r"\{n:'([^']+)',ab:'[^']+',x:\d+,y:\d+\}", html)
print('canonical names in app:', len(canon))
norm = lambda s: ''.join(c for c in s.lower() if c.isalnum())

# ---- match ----
by_norm = {norm(n): n for n in canon}
matched = {}
for f in la:
    name = f['properties']['NAME']
    key = by_norm.get(norm(name))
    if key is None:
        print('UNMATCHED census name:', name)
        continue
    matched[key] = f['geometry']
print('matched:', len(matched), '| missing:', [n for n in canon if n not in matched])

# ---- rings ----
def rings(geom):
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    for poly in polys:
        for ring in poly:  # outer ring + any holes (evenodd fill handles holes)
            yield ring

# ---- Douglas-Peucker (iterative) ----
def dp(points, eps):
    if len(points) < 4:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1:
            continue
        ax, ay = points[a]; bx, by = points[b]
        dx, dy = bx - ax, by - ay
        norm2 = dx * dx + dy * dy
        maxd, idx = 0.0, -1
        for i in range(a + 1, b):
            px, py = points[i]
            if norm2 == 0:
                d = (px - ax) ** 2 + (py - ay) ** 2
            else:
                d = abs(dx * (ay - py) - (ax - px) * dy) / (norm2 ** .5)
            if d > maxd:
                maxd, idx = d, i
        if maxd > eps:
            keep[idx] = True
            stack.append((a, idx)); stack.append((idx, b))
    return [p for p, k in zip(points, keep) if k]

EPS = 0.0015
allpts = 0
simplified = {}
for name, geom in matched.items():
    rings_out = []
    for ring in rings(geom):
        r = dp(ring, EPS)
        if len(r) >= 3:
            rings_out.append(r)
            allpts += len(r)
    simplified[name] = rings_out
print('total points after DP(eps=%.3f):' % EPS, allpts)

# ---- project ----
xs = [c[0] for rings_ in simplified.values() for r in rings_ for c in r]
ys = [c[1] for rings_ in simplified.values() for r in rings_ for c in r]
minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
KX, KY, PAD = 95.5, 110.8, 8
W = (maxx - minx) * KX + 2 * PAD
H = (maxy - miny) * KY + 2 * PAD
print('bounds: lon %.3f..%.3f lat %.3f..%.3f -> W=%.0f H=%.0f' % (minx, maxx, miny, maxy, W, H))

def proj(lon, lat):
    return round((lon - minx) * KX + PAD, 1), round((maxy - lat) * KY + PAD, 1)

paths = {}
for name, rings_ in simplified.items():
    subs = []
    for r in rings_:
        pts = [proj(lon, lat) for lon, lat in r]
        subs.append('M' + 'L'.join('%s %s' % (p[0], p[1]) for p in pts) + 'Z')
    paths[name] = ''.join(subs)

out = 'const LA_MAP={"w":%d,"h":%d,"d":{' % (W, H)
out += ','.join('"%s":"%s"' % (n, p) for n, p in paths.items())
out += '}};'
print('js bytes:', len(out.encode('utf-8')))
open('la-map-data.js', 'w', encoding='utf-8').write(out)
print('written la-map-data.js')
