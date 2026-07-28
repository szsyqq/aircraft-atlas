import json, urllib.parse, urllib.request, time
UA="AircraftAtlas/1.0"; API="https://commons.wikimedia.org/w/api.php"
def get(p, tries=8):
    p["format"]="json"; url=API+"?"+urllib.parse.urlencode(p)
    for i in range(tries):
        try:
            req=urllib.request.Request(url, headers={"User-Agent":UA})
            with urllib.request.urlopen(req, timeout=25) as r: return json.load(r)
        except Exception as e:
            time.sleep(5*(i+1))
    return None
for q in ["Airbus A330 silhouette","Airbus A350 silhouette","Comac C919 silhouette","Comac ARJ21 silhouette","ARJ21 aircraft"]:
    d=get({"action":"query","list":"search","srsearch":q+" filetype:svg","srnamespace":6,"srlimit":15})
    print("\n##", q)
    if not d: print("  (no response)"); continue
    for it in d.get("query",{}).get("search",[]):
        print("  -", it["title"])
    time.sleep(3)
