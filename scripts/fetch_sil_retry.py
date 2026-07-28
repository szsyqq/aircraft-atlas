import json, urllib.parse, urllib.request, time, os

UA = "AircraftAtlas/1.0"
API = "https://commons.wikimedia.org/w/api.php"
OUT = "/Users/panyp/WorkBuddy/飞机探索/assets/sil"
os.makedirs(OUT, exist_ok=True)

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

# 缺失机型 + 关键词 + 搜索词
targets = {
    "a320":  (["A320"], ["Airbus A320 silhouette", "Airbus A320", "A320 side view"]),
    "a330":  (["A330"], ["Airbus A330 silhouette", "Airbus A330", "A330 side view"]),
    "a350":  (["A350"], ["Airbus A350 silhouette", "Airbus A350", "A350 side view"]),
    "c919":  (["C919", "Comac C919"], ["Comac C919", "C919 aircraft silhouette", "C919"]),
    "arj21": (["ARJ21", "C909"], ["Comac ARJ21", "Comac C909", "ARJ21 aircraft"]),
}

def find_title(tokens, queries):
    for q in queries:
        d = get({"action":"query","list":"search","srsearch":q+" filetype:svg",
                 "srnamespace":6,"srlimit":12})
        if not d:
            time.sleep(5); continue
        for it in d.get("query",{}).get("search",[]):
            t = it["title"]
            low = t.lower()
            if "logo" in low or "flag" in low or "icon" in low or "symbol" in low or "map" in low:
                continue
            if not (low.endswith(".svg") or "svg" in low):
                continue
            if any(tok.lower() in low for tok in tokens):
                return t
        time.sleep(5)
    return None

def download(title):
    info = get({"action":"query","titles":title,"prop":"imageinfo",
                "iiprop":"url|mime","format":"json"})
    if not info: return None
    page = list(info.get("query",{}).get("pages",{}).values())[0]
    ii = page.get("imageinfo",[{}])[0]
    url = ii.get("url")
    if not url: return None
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
    title = find_title(tokens, queries)
    if not title:
        print("  no svg found", flush=True); continue
    print("  title: %s" % title, flush=True)
    data = download(title)
    if not data or b"<svg" not in data[:300] and b"<?xml" not in data[:300]:
        print("  invalid svg", flush=True); continue
    with open(os.path.join(OUT, aid + ".svg"), "wb") as f:
        f.write(data)
    manifest[aid] = {"src": "assets/sil/%s.svg" % aid, "title": title}
    print("  saved %d bytes" % len(data), flush=True)
    time.sleep(6)

json.dump(manifest, open(mp, "w"), ensure_ascii=False, indent=2)
print("DONE missing retry.", flush=True)
