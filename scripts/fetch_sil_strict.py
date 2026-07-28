import json, urllib.parse, urllib.request, time, os

UA = "AircraftAtlas/1.0"
API = "https://commons.wikimedia.org/w/api.php"
OUT = "/Users/panyp/WorkBuddy/飞机探索/assets/sil"
os.makedirs(OUT, exist_ok=True)

BAD = ["operators", "range", "diagram", "payload", "map", "unifont", "logo",
       "flag", "icon", "symbol", "clipart", "chart", "graph", "world", "livery",
       "route", "seat", "cabin", "airport", "scheme"]
GOOD = ["silhouette", "side", "profile", "three-view", "outline", "drawing"]

def get(params, tries=8):
    params["format"] = "json"
    url = API + "?" + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=25) as r:
                return json.load(r)
        except Exception as e:
            wait = 6 * (i + 1)
            print("  rate/err (%s), backoff %ss" % (e, wait), flush=True)
            time.sleep(wait)
    return None

targets = {
    "a320":  (["A320"], ["Airbus A320 silhouette", "Airbus A320 side view", "A320 silhouette"]),
    "a330":  (["A330"], ["Airbus A330 silhouette", "Airbus A330 side view", "A330 silhouette"]),
    "a350":  (["A350"], ["Airbus A350 silhouette", "Airbus A350 side view", "A350 silhouette"]),
    "c919":  (["C919", "Comac C919"], ["Comac C919 silhouette", "C919 silhouette", "Comac C919 side view"]),
    "arj21": (["ARJ21", "C909"], ["Comac ARJ21 silhouette", "ARJ21 silhouette", "Comac C909 silhouette"]),
}

def find_title(tokens, queries):
    for q in queries:
        d = get({"action":"query","list":"search","srsearch":q+" filetype:svg",
                 "srnamespace":6,"srlimit":14})
        if not d:
            time.sleep(5); continue
        best = None; best_score = -1
        for it in d.get("query",{}).get("search",[]):
            t = it["title"]; low = t.lower()
            if not low.endswith(".svg"): continue
            if any(b in low for b in BAD): continue
            if not any(tok.lower() in low for tok in tokens): continue
            score = sum(2 for g in GOOD if g in low)
            if score > best_score:
                best_score = score; best = t
        if best:
            return best
        time.sleep(5)
    return None

def download(title):
    info = get({"action":"query","titles":title,"prop":"imageinfo",
                "iiprop":"url|mime|size","format":"json"})
    if not info: return None
    page = list(info.get("query",{}).get("pages",{}).values())[0]
    ii = page.get("imageinfo",[{}])[0]
    url = ii.get("url"); sz = ii.get("size", 0)
    if not url: return None
    if sz and sz > 200000:   # 超过 200KB 多半是地图/大图，拒收
        print("  too big (%d), skip" % sz, flush=True); return None
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.read()
    except Exception as e:
        print("  dl err", e, flush=True); return None

manifest = {}
mp = os.path.join(OUT, "manifest.json")
if os.path.exists(mp):
    manifest = json.load(open(mp))

for aid, (tokens, queries) in targets.items():
    print("== %s ==" % aid, flush=True)
    title = find_title(tokens, queries)
    if not title:
        print("  no good svg found -> 保留程序生成图兜底", flush=True); continue
    print("  title: %s" % title, flush=True)
    data = download(title)
    if not data or (b"<svg" not in data[:300] and b"<?xml" not in data[:300]):
        print("  invalid svg", flush=True); continue
    with open(os.path.join(OUT, aid + ".svg"), "wb") as f:
        f.write(data)
    manifest[aid] = {"src": "assets/sil/%s.svg" % aid, "title": title}
    print("  saved %d bytes" % len(data), flush=True)
    time.sleep(6)

json.dump(manifest, open(mp, "w"), ensure_ascii=False, indent=2)
print("STRICT DONE.", flush=True)
