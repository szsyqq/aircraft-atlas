#!/usr/bin/env python3
# 用搜索 API 定向抓「顶视 / 前视」真实照片（media-list 标题不含角度词，故改用搜索）。
# 严格过滤：只接受 .jpg/.png 实拍，拒收 cabin/interior/map/logo/diagram/silhouette。
# 产出 js/views.js：window.VIEWS = { <id>: {side:true, top:bool, front:bool} }
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
FRONT_Q = ["{q} nose", "{q} cockpit", "{q} front view"]
TOP_Q = ["{q} top view", "{q} from below", "{q} takeoff"]
BAD = re.compile(r"cabin|interior|seat|passenger|map|logo|diagram|chart|silhouette|\.svg|glyph|symbol|scheme|plan view drawing", re.I)
GOOD_EXT = re.compile(r"\.(jpg|jpeg|png)$", re.I)


def api(params, tries=12):
    params["format"] = "json"
    url = API + "?" + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception as e:
            if i == tries - 1:
                print("  APIERR", e)
                return None
            time.sleep(6 * (i + 1))


def search_file(q):
    d = api({"action": "query", "list": "search", "srsearch": q + " filetype:bitmap",
             "srnamespace": 6, "srlimit": 12})
    if not d:
        return None
    for it in d.get("query", {}).get("search", []):
        t = it["title"]
        if BAD.search(t) or not GOOD_EXT.search(t):
            continue
        info = api({"action": "query", "titles": t, "prop": "imageinfo",
                    "iiprop": "url|mime", "format": "json"})
        if not info:
            continue
        page = list(info.get("query", {}).get("pages", {}).values())[0]
        ii = page.get("imageinfo", [{}])[0]
        if ii.get("mime", "").startswith("image") and GOOD_EXT.search(ii.get("url", "")):
            return t, ii["url"]
        time.sleep(1)
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


def fetch_angle(aid, queries):
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
        front = fetch_angle(aid, [x.format(q=q) for x in FRONT_Q])
        if front:
            if download(front[1], os.path.join(IMG, aid + "_front.jpg")):
                rec["front"] = True
            print(("OK  " if rec["front"] else "FAIL"), aid, "front <-", front[0][:55])
        else:
            print("MISS", aid, "front")
        time.sleep(3)
        top = fetch_angle(aid, [x.format(q=q) for x in TOP_Q])
        if top:
            if download(top[1], os.path.join(IMG, aid + "_top.jpg")):
                rec["top"] = True
            print(("OK  " if rec["top"] else "FAIL"), aid, "top <-", top[0][:55])
        else:
            print("MISS", aid, "top")
        time.sleep(4)
        manifest[aid] = rec
    with open("js/views.js", "w") as f:
        f.write("window.VIEWS = " + json.dumps(manifest, ensure_ascii=False, indent=2) + ";\n")
    print("WROTE js/views.js:", json.dumps({k: v for k, v in manifest.items() if (v["top"] or v["front"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
