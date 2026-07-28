#!/usr/bin/env python3
# 从 Wikimedia Commons 拉取各机型的真实照片（CC 授权），存入 assets/img/<id>.jpg
# 统一规范为 JPEG、长边 <= 1280，并生成 assets/manifest.json 记录作者与许可证用于署名。
import urllib.request, urllib.parse, json, os, time, re, subprocess

ROOT = "/Users/panyp/WorkBuddy/飞机探索"
OUT = os.path.join(ROOT, "assets", "img")
os.makedirs(OUT, exist_ok=True)
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "AircraftAtlas/1.0 (educational aircraft field guide; contact: user@example.com)"}

queries = {
    "b737": "Boeing 737-800 airliner side view",
    "b747": "Boeing 747-400 airliner",
    "b777": "Boeing 777-300ER airliner",
    "b787": "Boeing 787-9 Dreamliner airliner",
    "a320": "Airbus A320 airliner",
    "a330": "Airbus A330 airliner",
    "a350": "Airbus A350-900 airliner",
    "a380": "Airbus A380 airliner",
    "c919": "Comac C919 airliner",
    "arj21": "Comac ARJ21 airliner",
}

BAD = ("logo", "diagram", "symbol", "map", "icon", "silhouette", "drawing",
       "svg", "graph", "seal", "cockpit", "interior", "cabin", "tail-fin")


def api(params, attempt=0):
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        if e.code == 429 and attempt < 6:
            time.sleep(15 + attempt * 10)
            return api(params, attempt + 1)
        raise


def normalize(src, dst, maxw=1280):
    subprocess.run(["/usr/bin/sips", "-s", "format", "jpeg", "-Z", str(maxw),
                    src, "--out", dst], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def fetch_one(id, q, attempt=0):
    data = api({"action": "query", "list": "search", "srsearch": q,
                "srnamespace": 6, "srlimit": 25, "format": "json"})
    titles = [s["title"] for s in data.get("query", {}).get("search", [])]
    chosen = None
    for t in titles:
        tl = t.lower()
        if any(b in tl for b in BAD):
            continue
        chosen = t
        break
    if not chosen and titles:
        chosen = titles[0]
    if not chosen:
        return None
    info = api({"action": "query", "titles": chosen, "prop": "imageinfo",
                "iiprop": "url|mime|extmetadata|size", "iiurlwidth": 1280, "format": "json"})
    pages = info.get("query", {}).get("pages", {})
    for pid, pg in pages.items():
        ii = pg.get("imageinfo")
        if not ii:
            continue
        ii = ii[0]
        if not str(ii.get("mime", "")).startswith("image"):
            continue
        thumb = ii.get("thumburl") or ii.get("url")
        tmp = os.path.join(OUT, id + ".tmp")
        req = urllib.request.Request(thumb, headers=UA)
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                with open(tmp, "wb") as f:
                    f.write(r.read())
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 6:
                time.sleep(15 + attempt * 10)
                return fetch_one(id, q, attempt + 1)
            raise
        fn = os.path.join(OUT, id + ".jpg")
        try:
            normalize(tmp, fn, 1280)
        except Exception:
            if os.path.exists(tmp):
                os.replace(tmp, fn)
        if os.path.exists(tmp):
            os.remove(tmp)
        em = ii.get("extmetadata", {})
        lic = em.get("LicenseShortName", {}).get("value", "?")
        artist = em.get("Artist", {})
        artist = artist.get("value", "?") if isinstance(artist, dict) else str(artist)
        artist = re.sub("<[^>]+>", "", artist)[:140]
        return {"id": id, "file": chosen, "license": lic, "artist": artist,
                "w": ii.get("width"), "h": ii.get("height")}
    return None


manifest = []
for id, q in queries.items():
    fn = os.path.join(OUT, id + ".jpg")
    if os.path.exists(fn) and os.path.getsize(fn) > 2000:
        print("SKIP", id, "(already have)")
        continue
    r = None
    for attempt in range(5):
        try:
            r = fetch_one(id, q)
            break
        except Exception as e:
            print("retry", id, "attempt", attempt + 1, "|", e)
            time.sleep(12 + attempt * 6)
    if r:
        manifest.append(r)
        print("OK  ", id, "->", r["file"], "|", r["license"])
    else:
        print("NONE", id)
    time.sleep(4)

# 合并已有 manifest 中因 skip 而未重新写入的条目
mp = os.path.join(ROOT, "assets", "manifest.json")
existing = []
if os.path.exists(mp):
    try:
        existing = json.load(open(mp))
    except Exception:
        existing = []
byid = {m["id"]: m for m in existing}
for m in manifest:
    byid[m["id"]] = m
json.dump(list(byid.values()), open(mp, "w"), ensure_ascii=False, indent=2)
print("DONE", len(byid), "/", len(queries))
