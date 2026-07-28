#!/usr/bin/env python3
# 补抓 a350 / c919：改用维基百科条目内嵌图片（generator=images），更稳。
import json, os, base64, time, urllib.request, urllib.parse

PROXY = "http://localhost:3456"
ROOT = "/Users/panyp/WorkBuddy/飞机探索"
IMG_DIR = os.path.join(ROOT, "assets", "img")
NEED = {"a350": ("Airbus A350", 3), "c919": ("Comac C919", 3)}
EXCLUDE = ("svg","pdf","gif","tif","tiff","logo","map","diagram","seat","route",
           "layout","plan","drawing","icon","symbol","graph","flag","chart","stub",
           "meta","vector","render","model","scheme","table","silhouette","cutaway",
           "mockup","paint","scheme","cockpit","cabin","interior","seat","marketing")

def eval_js(tid, js):
    data = js.encode()
    req = urllib.request.Request(PROXY + "/eval?target=" + tid, data=data,
                                 headers={"Content-Type": "text/plain"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode())

def new_tab(url):
    data = url.encode()
    req = urllib.request.Request(PROXY + "/new", data=data,
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
    for aid, (title, n) in NEED.items():
        print("== %s (article:%s, need %d) ==" % (aid, title, n))
        api = ("https://en.wikipedia.org/w/api.php?action=query&format=json"
               "&generator=images&titles=%s&prop=imageinfo&iiprop=url|mime|size"
               "&iiurlwidth=1280&gimlimit=80" % urllib.parse.quote(title))
        try:
            items = fetch_json(api)
        except Exception as e:
            print("  API ERR", e); continue
        cands = []
        for it in items:
            t = (it.get("title") or "").lower()
            if any(k in t for k in EXCLUDE): continue
            if it.get("mime") not in ("image/jpeg", "image/png"): continue
            if (it.get("w") or 0) < 1000: continue
            cands.append(it)
        print("  candidates(%d):" % len(cands), [c["title"].split(":")[-1] for c in cands][:8])
        d = os.path.join(IMG_DIR, aid)
        os.makedirs(d, exist_ok=True)
        # 从已有编号续接
        i = 1
        while os.path.exists(os.path.join(d, "%s_g%d.jpg" % (aid, i))):
            i += 1
        added = 0
        for c in cands:
            if added >= n: break
            fn = "%s_g%d.jpg" % (aid, i)
            path = os.path.join(d, fn)
            try:
                b64 = fetch_b64(c["url"])
                with open(path, "wb") as f:
                    f.write(base64.b64decode(b64))
                print("  saved", fn, len(b64), "b64")
                added += 1; i += 1
            except Exception as e:
                print("  fetch ERR", c["title"], e)
            time.sleep(0.4)
        print("  added", added)
        time.sleep(0.5)
    print("DONE")

if __name__ == "__main__":
    main()
