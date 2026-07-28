#!/usr/bin/env python3
# 精细化抓取：前视=真实机头照；顶视=真实「从下方/腹视」照。排除示意图/模型/发动机特写，偏好 JPG。
# 429 时长时间退避重试。产出 js/views.js。
import json, os, re, time, urllib.parse, urllib.request

UA = "AircraftAtlas/1.0"
API = "https://commons.wikimedia.org/w/api.php"
IMG = "assets/img"
os.makedirs(IMG, exist_ok=True)

SEARCH = {
    "b737": "Boeing 737", "b747": "Boeing 747", "b777": "Boeing 777", "b787": "Boeing 787",
    "a320": "Airbus A320", "a330": "Airbus A330", "a350": "Airbus A350", "a380": "Airbus A380",
    "c919": "Comac C919", "arj21": "Comac ARJ21",
}
FRONT_Q = ["{q} nose", "{q} cockpit"]
TOP_Q = ["{q} from below", "{q} underside", "{q} belly view", "{q} taking off"]
REJECT = re.compile(r"cabin|interior|seat|passenger|map|logo|diagram|chart|silhouette|glyph|symbol|"
                    r"scheme|drawing|mock|mockup|concept|family|v1\.0|v1\.1|\bengine\b|cutaway|format", re.I)
JPG = re.compile(r"\.jpg$", re.I)


def api(params, tries=14):
    params["format"] = "json"
    url = API + "?" + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception as e:
            if i == tries - 1:
                return None
            time.sleep(7 * (i + 1))


def search_file(q):
    d = api({"action": "query", "list": "search", "srsearch": q + " filetype:bitmap",
             "srnamespace": 6, "srlimit": 14})
    if not d:
        return None
    cands = []
    for it in d.get("query", {}).get("search", []):
        t = it["title"]
        if REJECT.search(t):
            continue
        if not JPG.search(t):   # 优先真实照片(JPG)，PNG 多为示意图，跳过
            continue
        cands.append(t)
    for t in cands:
        info = api({"action": "query", "titles": t, "prop": "imageinfo",
                    "iiprop": "url|mime", "format": "json"})
        if not info:
            continue
        page = list(info.get("query", {}).get("pages", {}).values())[0]
        ii = page.get("imageinfo", [{}])[0]
        if ii.get("mime", "") == "image/jpeg" and JPG.search(ii.get("url", "")):
            return t, ii["url"]
        time.sleep(1)
    return None


def download(url, path):
    for i in range(8):
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
            if i == 7:
                return False
            time.sleep(5 * (i + 1))


def fetch(aid, queries):
    for q in queries:
        res = search_file(q)
        if res:
            return res
        time.sleep(2)
    return None


def main():
    manifest = {}
    for aid, q in SEARCH.items():
        rec = {"side": True, "top": False, "front": False}
        front = fetch(aid, [x.format(q=q) for x in FRONT_Q])
        if front:
            if download(front[1], os.path.join(IMG, aid + "_front.jpg")):
                rec["front"] = True
            print(("OK  " if rec["front"] else "FAIL"), aid, "front <-", front[0][:55])
        else:
            print("MISS", aid, "front")
        time.sleep(4)
        top = fetch(aid, [x.format(q=q) for x in TOP_Q])
        if top:
            if download(top[1], os.path.join(IMG, aid + "_top.jpg")):
                rec["top"] = True
            print(("OK  " if rec["top"] else "FAIL"), aid, "top <-", top[0][:55])
        else:
            print("MISS", aid, "top")
        time.sleep(5)
        manifest[aid] = rec
    with open("js/views.js", "w") as f:
        f.write("window.VIEWS = " + json.dumps(manifest, ensure_ascii=False, indent=2) + ";\n")
    got = {k: v for k, v in manifest.items() if (v["top"] or v["front"])}
    print("WROTE js/views.js:", json.dumps(got, ensure_ascii=False))


if __name__ == "__main__":
    main()
