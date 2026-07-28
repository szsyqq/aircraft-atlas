#!/usr/bin/env python3
# 用维基百科 REST 摘要接口获取各机型代表照片（lead image，来自 Wikimedia Commons）。
# 比 search API 更少被限流；下载后统一规范为 JPEG、长边 <= 1280。
import urllib.request, json, os, time, subprocess

ROOT = "/Users/panyp/WorkBuddy/飞机探索"
OUT = os.path.join(ROOT, "assets", "img")
os.makedirs(OUT, exist_ok=True)
UA = {"User-Agent": "AircraftAtlas/1.0"}

# id -> 维基百科条目标题
TITLES = {
    "b737": "Boeing_737",
    "b747": "Boeing_747",
    "b777": "Boeing_777",
    "b787": "Boeing_787",
    "a320": "Airbus_A320",
    "a330": "Airbus_A330",
    "a350": "Airbus_A350",
    "a380": "Airbus_A380",
    "c919": "Comac_C919",
    "arj21": "Comac_ARJ21",
}


def get_json(url, attempt=0):
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        if e.code in (429, 503) and attempt < 4:
            time.sleep(10 + attempt * 8)
            return get_json(url, attempt + 1)
        raise


def normalize(src, dst, maxw=1280):
    subprocess.run(["/usr/bin/sips", "-s", "format", "jpeg", "-Z", str(maxw),
                    src, "--out", dst], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


manifest = []
for id, title in TITLES.items():
    fn = os.path.join(OUT, id + ".jpg")
    if os.path.exists(fn) and os.path.getsize(fn) > 2000:
        print("SKIP", id, "(already have)")
        continue
    try:
        j = get_json("https://en.wikipedia.org/api/rest_v1/page/summary/" + title)
        src = (j.get("originalimage") or {}).get("source") or (j.get("thumbnail") or {}).get("source")
        if not src:
            print("NONE", id, "(no image in summary)")
            continue
        tmp = os.path.join(OUT, id + ".tmp")
        req = urllib.request.Request(src, headers=UA)
        with urllib.request.urlopen(req, timeout=60) as r:
            with open(tmp, "wb") as f:
                f.write(r.read())
        normalize(tmp, fn, 1280)
        if os.path.exists(tmp):
            os.remove(tmp)
        manifest.append({"id": id, "title": j.get("title"), "source": src})
        print("OK  ", id, "->", j.get("title"))
    except Exception as e:
        print("ERR ", id, "|", e)
    time.sleep(2.5)

# 合并已有 manifest
mp = os.path.join(ROOT, "assets", "manifest.json")
existing = []
if os.path.exists(mp):
    try:
        existing = json.load(open(mp))
    except Exception:
        existing = []
byid = {m.get("id"): m for m in existing}
for m in manifest:
    byid[m["id"]] = m
json.dump(list(byid.values()), open(mp, "w"), ensure_ascii=False, indent=2)
print("DONE", len(byid), "/", len(TITLES))
