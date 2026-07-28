import json, urllib.parse, urllib.request, time, os, sys

UA = "AircraftAtlas/1.0"
API = "https://commons.wikimedia.org/w/api.php"
OUT = "/Users/panyp/WorkBuddy/飞机探索/assets/sil"
os.makedirs(OUT, exist_ok=True)

def get(params, tries=6):
    params["format"] = "json"
    url = API + "?" + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=25) as r:
                return json.load(r)
        except Exception as e:
            wait = 4 * (i + 1)
            print("  rate/err (%s), backoff %ss" % (e, wait), flush=True)
            time.sleep(wait)
    return None

# 每款机型的查询词：先找 three-view，退化到 silhouette
queries = {
    "b737":  ["Boeing 737 three-view", "Boeing 737-800 silhouette", "Boeing 737 silhouette"],
    "b747":  ["Boeing 747 three-view", "Boeing 747 silhouette", "Boeing 747-400 silhouette"],
    "b777":  ["Boeing 777 three-view", "Boeing 777 silhouette", "Boeing 777-300 silhouette"],
    "b787":  ["Boeing 787 three-view", "Boeing 787 silhouette", "Boeing 787-9 silhouette"],
    "a320":  ["Airbus A320 three-view", "Airbus A320 silhouette", "Airbus A320 sharklet silhouette"],
    "a330":  ["Airbus A330 three-view", "Airbus A330 silhouette", "Airbus A330-300 silhouette"],
    "a350":  ["Airbus A350 three-view", "Airbus A350 silhouette", "Airbus A350-900 silhouette"],
    "a380":  ["Airbus A380 three-view", "Airbus A380 silhouette", "Airbus A380-800 silhouette"],
    "c919":  ["Comac C919 silhouette", "Comac C919 three-view", "C919 aircraft silhouette"],
    "arj21": ["Comac ARJ21 silhouette", "Comac C909 silhouette", "ARJ21 silhouette"],
}

def find_title(terms):
    for q in terms:
        d = get({"action":"query","list":"search","srsearch":q+" filetype:svg",
                 "srnamespace":6,"srlimit":10})
        if not d: 
            continue
        for it in d.get("query",{}).get("search",[]):
            t = it["title"]
            tl = t.lower()
            # 偏好含 three-view / silhouette 的矢量
            if "three-view" in tl or "silhouette" in tl or tl.endswith(".svg"):
                return t
        time.sleep(2.5)
    return None

def download(title):
    info = get({"action":"query","titles":title,"prop":"imageinfo",
                "iiprop":"url|mime","format":"json"})
    if not info: return None
    page = list(info.get("query",{}).get("pages",{}).values())[0]
    ii = page.get("imageinfo",[{}])[0]
    url = ii.get("url")
    if not url: return None
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        data = r.read()
    return data

manifest = {}
for aid, terms in queries.items():
    print("== %s ==" % aid, flush=True)
    title = find_title(terms)
    if not title:
        print("  no svg found", flush=True)
        continue
    print("  title: %s" % title, flush=True)
    data = download(title)
    if not data:
        print("  download failed", flush=True)
        continue
    # 校验是 svg
    if b"<svg" not in data[:200] and b"<?xml" not in data[:200]:
        print("  not svg, skip", flush=True)
        continue
    path = os.path.join(OUT, aid + ".svg")
    with open(path, "wb") as f:
        f.write(data)
    manifest[aid] = {"src": "assets/sil/%s.svg" % aid, "title": title}
    print("  saved %d bytes -> %s" % (len(data), path), flush=True)
    time.sleep(3)

with open(os.path.join(OUT, "manifest.json"), "w") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
print("DONE. %d svgs." % len(manifest), flush=True)
