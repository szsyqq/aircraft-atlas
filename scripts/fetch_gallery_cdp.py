#!/usr/bin/env python3
# 通过用户本地 Chrome CDP 代理（localhost:3456）从 Wikimedia Commons 拉取真实照片
# 写到 assets/img/<id>/<id>_gN.jpg，并输出 manifest（供 gallery.js 使用）。
import json, os, base64, time, urllib.request, urllib.error

PROXY = "http://localhost:3456"
ROOT = "/Users/panyp/WorkBuddy/飞机探索"
IMG_DIR = os.path.join(ROOT, "assets", "img")

# 需要补足的机型：缺多少张（已有真实照片/线图计数见 gallery.js）
NEED = {
    "b747":  ("Boeing 747", 2),   # 现有 1 照片 + 1 线图，需再 +1 照片达 3
    "a330":  ("Airbus A330", 2),
    "a350":  ("Airbus A350 XWB", 2),
    "arj21": ("Comac ARJ21", 2),
    "c919":  ("Comac C919", 3),   # 现有 1 照片，需 +2
}
EXCLUDE = ("svg", "pdf", "gif", "tif", "tiff",
           "logo", "map", "diagram", "seat", "route", "layout", "plan",
           "drawing", "icon", "symbol", "graph", "flag", "chart", "stub",
           "meta", "vector", "render", "model", "scheme", "table",
           "silhouette", "cutaway", "mockup", "paint", "scheme")
UA = "AircraftAtlas/1.0 (educational gallery fetch)"

def proxy_post(path, body, is_json=True):
    data = json.dumps(body).encode() if is_json else body.encode()
    req = urllib.request.Request(PROXY + path, data=data,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())

def eval_js(tid, js):
    # /eval 接受 raw JS（非 JSON），返回 {"value": ...}
    data = js.encode()
    req = urllib.request.Request(PROXY + "/eval?target=" + tid, data=data,
                                 headers={"Content-Type": "text/plain"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode())

def new_tab(url):
    return proxy_post("/new", url, is_json=False)["targetId"]

def fetch_json(url):
    js = ("(async()=>{const r=await fetch(%s,{mode:'cors'});"
          "const j=await r.json();"
          "const pages=j.query&&j.query.pages?Object.values(j.query.pages):[];"
          "const out=pages.map(p=>{const ii=p.imageinfo&&p.imageinfo[0];"
          "return ii?{title:p.title,url:ii.thumburl,mime:ii.mime,w:ii.width}:null;})"
          ".filter(Boolean);return JSON.stringify(out);})()") % json.dumps(url)
    raw = eval_js(TID, js)
    return json.loads(raw["value"])

def fetch_b64(url):
    js = ("(async()=>{const r=await fetch(%s,{mode:'cors'});"
          "const buf=await r.arrayBuffer();"
          "const b=new Uint8Array(buf);let s='';const c=0x8000;"
          "for(let i=0;i<b.length;i+=c){s+=String.fromCharCode.apply(null,b.subarray(i,i+c));}"
          "return btoa(s);})()") % json.dumps(url)
    return eval_js(TID, js)["value"]

def main():
    global TID
    TID = new_tab("https://commons.wikimedia.org/")
    time.sleep(1.5)
    manifest = {}
    for aid, (cat, n) in NEED.items():
        print("== %s (Category:%s, need %d) ==" % (aid, cat, n))
        api = ("https://commons.wikimedia.org/w/api.php?action=query&format=json"
               "&generator=categorymembers&gcmtitle=Category:%s&gcmtype=file"
               "&gcmlimit=80&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1280"
               % urllib.parse.quote(cat))
        try:
            items = fetch_json(api)
        except Exception as e:
            print("  API ERR", e); continue
        # 过滤：真实照片（jpeg/png）、足够大、排除图表/标志/线图
        cands = []
        for it in items:
            t = (it.get("title") or "").lower()
            if any(k in t for k in EXCLUDE): continue
            if it.get("mime") not in ("image/jpeg", "image/png"): continue
            if (it.get("w") or 0) < 1000: continue
            cands.append(it)
        cands = cands[: n + 1]  # 多取 1 张备用
        print("  candidates(%d):" % len(cands), [c["title"].split(":")[-1] for c in cands][:6])
        d = os.path.join(IMG_DIR, aid)
        os.makedirs(d, exist_ok=True)
        added = []
        i = 1
        for c in cands:
            fn = "%s_g%d.jpg" % (aid, i)
            path = os.path.join(d, fn)
            if os.path.exists(path):
                i += 1; continue
            try:
                b64 = fetch_b64(c["url"])
                with open(path, "wb") as f:
                    f.write(base64.b64decode(b64))
                added.append({"src": "assets/img/%s/%s" % (aid, fn),
                              "title": c["title"].split(":")[-1]})
                print("  saved", fn, len(b64), "b64 chars")
            except Exception as e:
                print("  fetch ERR", c["title"], e)
            i += 1
            time.sleep(0.4)
        manifest[aid] = added
        time.sleep(0.6)
    with open(os.path.join(ROOT, "scripts", "gallery_fetch_manifest.json"), "w") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print("DONE. manifest -> scripts/gallery_fetch_manifest.json")

if __name__ == "__main__":
    import urllib.parse
    main()
