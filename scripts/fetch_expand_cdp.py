#!/usr/bin/env python3
# 通过 web-access CDP proxy（localhost:3456）驱动用户浏览器，从 Wikipedia 文章图片抓取真实照片。
# 每个机型：hero(assets/img/<id>.jpg) + 2 张图库(assets/img/<id>/<id>_gN.jpg)。
# 已存在的文件会跳过（可断点续跑）。镜像 fetch_gallery_cdp2.py 的可用调用方式（text/plain 原始体）。
import json, os, base64, time, urllib.request, urllib.parse, sys

PROXY = "http://localhost:3456"
IMG_DIR = "/Users/panyp/WorkBuddy/飞机探索/assets/img"

# id -> Wikipedia 文章标题
TITLES = {
    "b707": "Boeing 707",
    "b757": "Boeing 757",
    "b767": "Boeing 767",
    "a220": "Airbus A220",
    "a340": "Airbus A340",
    "ejet": "Embraer E-Jet family",
    "erj": "Embraer ERJ family",
    "crj": "Bombardier CRJ",
    "md80": "McDonnell Douglas MD-80",
    "md11": "McDonnell Douglas MD-11",
    "tu154": "Tupolev Tu-154",
    "tu204": "Tupolev Tu-204",
    "il96": "Ilyushin Il-96",
    "concorde": "Concorde",
    "an124": "Antonov An-124",
    "ssj100": "Sukhoi Superjet 100",
}

EXCLUDE = ("svg","pdf","gif","tif","tiff","logo","map","diagram","seat","route",
           "layout","plan","drawing","icon","symbol","graph","flag","chart","stub",
           "meta","vector","render","model","scheme","table","silhouette","cutaway",
           "mockup","paint","cockpit","cabin","interior","marketing","thumb")

def eval_js(tid, js):
    req = urllib.request.Request(PROXY + "/eval?target=" + tid, data=js.encode(),
                                 headers={"Content-Type": "text/plain"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode())

def new_tab(url):
    req = urllib.request.Request(PROXY + "/new", data=url.encode(),
                                 headers={"Content-Type": "text/plain"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())["targetId"]

def fetch_json(url):
    js = ("(async()=>{const r=await fetch(%s,{mode:'cors'});"
          "const j=await r.json();"
          "const pages=j.query&&j.query.pages?Object.values(j.query.pages):[];"
          "const out=pages.map(p=>{const ii=p.imageinfo&&p.imageinfo[0];"
          "return ii?{title:p.title,url:ii.thumburl,mime:ii.mime,w:ii.width}:null;})"
          ".filter(Boolean);return JSON.stringify(out);})()") % json.dumps(url)
    return json.loads(eval_js(TID, js)["value"])

def fetch_b64(url):
    js = ("(async()=>{const r=await fetch(%s,{mode:'cors'});"
          "const buf=await r.arrayBuffer();"
          "const b=new Uint8Array(buf);let s='';const c=0x8000;"
          "for(let i=0;i<b.length;i+=c){s+=String.fromCharCode.apply(null,b.subarray(i,i+c));}"
          "return btoa(s);})()") % json.dumps(url)
    return eval_js(TID, js)["value"]

def main():
    global TID
    TID = new_tab("https://en.wikipedia.org/")
    time.sleep(1.5)
    print("TAB", TID, flush=True)
    for aid, title in TITLES.items():
        hero_path = os.path.join(IMG_DIR, aid + ".jpg")
        gdir = os.path.join(IMG_DIR, aid)
        g1 = os.path.join(gdir, aid + "_g1.jpg")
        g2 = os.path.join(gdir, aid + "_g2.jpg")
        if os.path.exists(hero_path) and os.path.exists(g1) and os.path.exists(g2):
            print("[skip] %s" % aid, flush=True); continue
        print("== %s (article:%s) ==" % (aid, title), flush=True)
        api = ("https://en.wikipedia.org/w/api.php?action=query&format=json"
               "&generator=images&titles=%s&prop=imageinfo&iiprop=url|mime|size"
               "&iiurlwidth=1280&gimlimit=80" % urllib.parse.quote(title))
        try:
            items = fetch_json(api)
        except Exception as e:
            print("  API ERR", e, flush=True); time.sleep(1); continue
        cands = []
        for it in items:
            t = (it.get("title") or "").lower()
            if any(k in t for k in EXCLUDE): continue
            if it.get("mime") not in ("image/jpeg", "image/png"): continue
            if (it.get("w") or 0) < 1000: continue
            cands.append(it)
        print("  candidates(%d)" % len(cands), flush=True)
        if not cands:
            print("  无可用图片", flush=True); time.sleep(0.5); continue
        os.makedirs(gdir, exist_ok=True)
        # 第一张作为 hero
        if not os.path.exists(hero_path):
            try:
                with open(hero_path, "wb") as f:
                    f.write(base64.b64decode(fetch_b64(cands[0]["url"])))
                print("  hero saved", flush=True)
            except Exception as e:
                print("  hero ERR", e, flush=True)
        # 后两张作为图库
        gi = 1
        for c in cands[1:]:
            if gi > 2: break
            gp = os.path.join(gdir, "%s_g%d.jpg" % (aid, gi))
            if os.path.exists(gp): gi += 1; continue
            try:
                with open(gp, "wb") as f:
                    f.write(base64.b64decode(fetch_b64(c["url"])))
                print("  gallery saved", os.path.basename(gp), flush=True)
                gi += 1
            except Exception as e:
                print("  gallery ERR", c["title"], e, flush=True)
            time.sleep(0.4)
        time.sleep(0.6)
    # 关闭临时标签
    try:
        req = urllib.request.Request(PROXY + "/close?target=" + TID, data=b"{}",
                                     headers={"Content-Type": "text/plain"})
        urllib.request.urlopen(req, timeout=10).read()
    except Exception: pass
    print("DONE", flush=True)

if __name__ == "__main__":
    main()
