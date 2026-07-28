import json, urllib.parse, urllib.request, time, os

UA = "AircraftAtlas/1.0"
API = "https://commons.wikimedia.org/w/api.php"
OUT = "/Users/panyp/WorkBuddy/飞机探索/assets/sil"
os.makedirs(OUT, exist_ok=True)

BAD = ["operators", "range", "diagram", "payload", "map", "unifont", "logo",
       "flag", "icon", "symbol", "clipart", "chart", "graph", "world", "livery",
       "route", "seat", "cabin", "airport", "scheme", "wingspan", "length"]

def get(params, tries=8):
    params["format"] = "json"
    url = API + "?" + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=25) as r:
                return json.load(r)
        except Exception as e:
            time.sleep(6 * (i + 1))
    return None

targets = {
    "a330":  (["A330"], ["Airbus A330", "A330 silhouette", "Airbus A330 side"]),
    "a350":  (["A350"], ["Airbus A350", "A350 silhouette", "Airbus A350 side"]),
    "c919":  (["C919", "Comac C919"], ["Comac C919", "C919", "C919 silhouette"]),
    "arj21": (["ARJ21", "C909"], ["Comac ARJ21", "ARJ21", "Comac C909"]),
}

def find_best(tokens, queries):
    best = None; best_sz = 10**9
    for q in queries:
        d = get({"action":"query","list":"search","srsearch":q+" filetype:svg",
                 "srnamespace":6,"srlimit":14})
        if not d:
            time.sleep(5); continue
        for it in d.get("query",{}).get("search",[]):
            t = it["title"]; low = t.lower()
            if not low.endswith(".svg"): continue
            if any(b in low for b in BAD): continue
            if not any(tok.lower() in low for tok in tokens): continue
            # 取信息
            info = get({"action":"query","titles":t,"prop":"imageinfo",
                        "iiprop":"url|size","format":"json"})
            if not info: continue
            page = list(info.get("query",{}).get("pages",{}).values())[0]
            ii = page.get("imageinfo",[{}])[0]
            sz = ii.get("size", 0) or 0
            # 真实线图通常很小（<40KB）；过大是地图/图
            if 400 < sz < 60000:
                if sz < best_sz:
                    best_sz = sz; best = (t, ii.get("url"))
        time.sleep(5)
    return best

def download(url):
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
    if os.path.exists(os.path.join(OUT, aid + ".svg")):
        print("  already have", flush=True); continue
    best = find_best(tokens, queries)
    if not best:
        print("  none <60KB -> 程序生成图兜底", flush=True); continue
    title, url = best
    print("  title: %s (%d bytes)" % (title, best_sz if 'best_sz' in dir() else 0), flush=True)
    data = download(url)
    if not data or (b"<svg" not in data[:300] and b"<?xml" not in data[:300]):
        print("  invalid", flush=True); continue
    with open(os.path.join(OUT, aid + ".svg"), "wb") as f:
        f.write(data)
    manifest[aid] = {"src": "assets/sil/%s.svg" % aid, "title": title}
    print("  saved %d bytes" % len(data), flush=True)
    time.sleep(6)

json.dump(manifest, open(mp, "w"), ensure_ascii=False, indent=2)
print("FINAL DONE.", flush=True)
