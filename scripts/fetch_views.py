#!/usr/bin/env python3
# 严格按角度抓取每款机型的「顶视」(top) 与「前视」(front) 真实照片。
# 侧视用已有的 assets/img/<id>.jpg（Wikipedia 摘要主图，始终真实）。
# 规则：只接受严格命中角度关键字的真实照片；不命中就留空（绝不把侧面照标成顶视/前视）。
# 产出：js/views.js —— window.VIEWS = { <id>: {side:true, top:bool, front:bool} }
import json, os, re, time, urllib.parse, urllib.request

UA = "AircraftAtlas/1.0"
API = "https://en.wikipedia.org/api/rest_v1/page/media-list/"
IMG = "assets/img"
os.makedirs(IMG, exist_ok=True)

TITLES = {
    "b737": "Boeing 737", "b747": "Boeing 747", "b777": "Boeing 777", "b787": "Boeing 787",
    "a320": "Airbus A320", "a330": "Airbus A330", "a350": "Airbus A350", "a380": "Airbus A380",
    "c919": "Comac C919", "arj21": ["Comac ARJ21", "Comac C909"],
}
FRONT_RE = re.compile(r"\b(nose|front|cockpit|forward|facial)\b", re.I)
FRONT_BAD = re.compile(r"cabin|interior|seat|deck|passenger", re.I)
TOP_RE = re.compile(r"\b(above|below|under|underside|climb|take ?off|plan ?view|from above|wing[a-z]* from|bird.?s.eye)\b", re.I)
BAD_RE = re.compile(r"\.svg|\.png$|\.gif|logo|map|diagram|chart|glyph|symbol|flag|scheme", re.I)


def get(url, tries=10):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception as e:
            if i == tries - 1:
                return None
            time.sleep(4 * (i + 1))


def orig_from_thumb(thumb):
    u = "https:" + thumb if thumb.startswith("//") else thumb
    u = u.replace("/thumb/", "/")
    u = re.sub(r"/[0-9]+px-[^/]+$", "", u)
    return u


def pick(items, rx, bad=None):
    for it in items:
        title = it.get("title", "")
        if BAD_RE.search(title):
            continue
        if bad and bad.search(title):
            continue
        ss = it.get("srcset") or []
        if not ss:
            continue
        if rx.search(title):
            return title, orig_from_thumb(ss[0].get("src"))
    return None


def download(url, path):
    for i in range(6):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                data = r.read()
            tmp = path + ".tmp"
            with open(tmp, "wb") as f:
                f.write(data)
            os.system('/usr/bin/sips -s format jpeg -Z 1280 "%s" --out "%s" >/dev/null 2>&1' % (tmp, path))
            if not os.path.exists(path):
                os.rename(tmp, path)
            os.remove(tmp)
            return True
        except Exception as e:
            if i == 5:
                return False
            time.sleep(3 * (i + 1))


def main():
    manifest = {}
    for aid, t in TITLES.items():
        titles = t if isinstance(t, list) else [t]
        items = None
        for tt in titles:
            d = get(API + urllib.parse.quote(tt))
            if d and d.get("items"):
                items = d["items"]
                break
            time.sleep(2)
        rec = {"side": True, "top": False, "front": False}
        if not items:
            print("NONE", aid)
        else:
            front = pick(items, FRONT_RE, FRONT_BAD)
            top = pick(items, TOP_RE)
            if front:
                if download(orig_from_thumb_pick(front), os.path.join(IMG, aid + "_front.jpg")):
                    rec["front"] = True
                print(("OK  " if rec["front"] else "FAIL"), aid, "front <-", front[0][:50])
            else:
                print("MISS", aid, "front")
            if top:
                if download(orig_from_thumb_pick(top), os.path.join(IMG, aid + "_top.jpg")):
                    rec["top"] = True
                print(("OK  " if rec["top"] else "FAIL"), aid, "top <-", top[0][:50])
            else:
                print("MISS", aid, "top")
            time.sleep(5)
        manifest[aid] = rec
    with open("js/views.js", "w") as f:
        f.write("window.VIEWS = " + json.dumps(manifest, ensure_ascii=False, indent=2) + ";\n")
    print("WROTE js/views.js:", json.dumps({k: v for k, v in manifest.items() if (v["top"] or v["front"])}, ensure_ascii=False))


def orig_from_thumb_pick(pair):
    return pair[1]


if __name__ == "__main__":
    main()
