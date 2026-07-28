#!/usr/bin/env python3
import json, os, base64, time, urllib.request, urllib.parse
PROXY = "http://localhost:3456"
IMG_DIR = "/Users/panyp/WorkBuddy/飞机探索/assets/img"
# id -> Commons 搜索词
Q = {"an124": "Antonov An-124 Ruslan", "ssj100": "Sukhoi Superjet 100"}
EXCLUDE = ("logo","map","diagram","seat","route","layout","plan","drawing","icon","symbol",
           "graph","flag","chart","stub","meta","vector","render","model","scheme","table",
           "silhouette","cutaway","mockup","paint","cockpit","cabin","interior","marketing",
           "thumb","training","device","ceremony","class","certificate")
def eval_js(tid, js):
    req = urllib.request.Request(PROXY + "/eval?target=" + tid, data=js.encode(), headers={"Content-Type": "text/plain"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode())
def new_tab(url):
    req = urllib.request.Request(PROXY + "/new", data=url.encode(), headers={"Content-Type": "text/plain"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())["targetId"]
def b64(url):
    js = ("(async()=>{const r=await fetch(%s,{mode:'cors'});const b=await r.arrayBuffer();"
          "const a=new Uint8Array(b);let s='';const c=0x8000;"
          "for(let i=0;i<a.length;i+=c)s+=String.fromCharCode.apply(null,a.subarray(i,i+c));"
          "return btoa(s);})()") % json.dumps(url)
    return eval_js(TID, js)["value"]
TID = new_tab("https://commons.wikimedia.org/")
time.sleep(1.5)
for aid, q in Q.items():
    hero_path = os.path.join(IMG_DIR, aid + ".jpg")
    gdir = os.path.join(IMG_DIR, aid)
    os.makedirs(gdir, exist_ok=True)
    api = ("https://commons.wikimedia.org/w/api.php?action=query&format=json"
           "&generator=search&gsrsearch=%s&gsrnamespace=6&gsrlimit=40"
           "&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1280"
           % urllib.parse.quote(q))
    js = ("(async()=>{const r=await fetch(%s,{mode:'cors'});const j=await r.json();"
          "const pages=j.query&&j.query.pages?Object.values(j.query.pages):[];"
          "const out=pages.map(p=>{const ii=p.imageinfo&&p.imageinfo[0];"
          "return ii?{title:p.title,url:ii.thumburl,mime:ii.mime,w:ii.width}:null;}).filter(Boolean);"
          "return JSON.stringify(out);})()") % json.dumps(api)
    items = json.loads(eval_js(TID, js)["value"])
    cands = []
    for it in items:
        t = (it.get("title") or "").lower()
        if any(k in t for k in EXCLUDE): continue
        if it.get("mime") != "image/jpeg": continue
        if (it.get("w") or 0) < 1200: continue
        cands.append(it)
    print("[%s] candidates=%d" % (aid, len(cands)), flush=True)
    if not cands:
        print("  无可用图片", flush=True); continue
    # 写 hero + 2 gallery
    targets = [(hero_path, cands[0])]
    for i, c in enumerate(cands[1:3], 1):
        targets.append((os.path.join(gdir, "%s_g%d.jpg" % (aid, i)), c))
    for path, c in targets:
        if os.path.exists(path): continue
        try:
            with open(path, "wb") as f:
                f.write(base64.b64decode(b64(c["url"])))
            print("  saved", os.path.basename(path), flush=True)
        except Exception as e:
            print("  ERR", c["title"], e, flush=True)
        time.sleep(0.4)
    time.sleep(0.5)
try:
    req = urllib.request.Request(PROXY + "/close?target=" + TID, data=b"{}", headers={"Content-Type": "text/plain"})
    urllib.request.urlopen(req, timeout=10).read()
except Exception: pass
print("DONE", flush=True)
