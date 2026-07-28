#!/usr/bin/env python3
import json, urllib.request, urllib.parse, sys
PROXY = "http://localhost:3456"
def eval_js(tid, js):
    req = urllib.request.Request(PROXY + "/eval?target=" + tid, data=js.encode(),
                                 headers={"Content-Type": "text/plain"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode())
def new_tab(url):
    req = urllib.request.Request(PROXY + "/new", data=url.encode(), headers={"Content-Type": "text/plain"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())["targetId"]
TID = new_tab("https://en.wikipedia.org/")
for title in ["Antonov An-124", "Sukhoi Superjet 100"]:
    api = ("https://en.wikipedia.org/w/api.php?action=query&format=json"
           "&generator=images&titles=%s&prop=imageinfo&iiprop=url|mime|size"
           "&iiurlwidth=1280&gimlimit=80" % urllib.parse.quote(title))
    js = ("(async()=>{const r=await fetch(%s,{mode:'cors'});const j=await r.json();"
          "const pages=j.query&&j.query.pages?Object.values(j.query.pages):[];"
          "const out=pages.map(p=>{const ii=p.imageinfo&&p.imageinfo[0];"
          "return {title:p.title,mime:ii?ii.mime:null,w:ii?ii.width:null};}).filter(x=>x.mime);"
          "return JSON.stringify(out);})()") % json.dumps(api)
    data = json.loads(eval_js(TID, js)["value"])
    print("=== %s (%d images) ===" % (title, len(data)))
    for d in data:
        print("  %s | %s | w=%s" % (d["title"], d["mime"], d["w"]))
