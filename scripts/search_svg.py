import json, urllib.parse, urllib.request, time

UA = "AircraftAtlas/1.0"
API = "https://commons.wikimedia.org/w/api.php"

def get(params):
    params["format"] = "json"
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)

queries = {
    "b737":  ["Boeing 737 three-view", "Boeing 737 silhouette", "Boeing 737-800 side view"],
    "b747":  ["Boeing 747 three-view", "Boeing 747 silhouette", "Boeing 747 outline"],
    "b777":  ["Boeing 777 three-view", "Boeing 777 silhouette"],
    "b787":  ["Boeing 787 three-view", "Boeing 787 silhouette"],
    "a320":  ["Airbus A320 three-view", "Airbus A320 silhouette"],
    "a330":  ["Airbus A330 three-view", "Airbus A330 silhouette"],
    "a350":  ["Airbus A350 three-view", "Airbus A350 silhouette"],
    "a380":  ["Airbus A380 three-view", "Airbus A380 silhouette"],
    "c919":  ["Comac C919 three-view", "Comac C919 silhouette"],
    "arj21": ["Comac ARJ21 three-view", "Comac ARJ21 silhouette", "Comac C909 silhouette"],
}

for aid, qs in queries.items():
    print("\n===== %s =====" % aid)
    seen = set()
    for q in qs:
        try:
            d = get({"action":"query","list":"search","srsearch":q+" filetype:svg",
                     "srnamespace":6,"srlimit":8})
            for it in d.get("query",{}).get("search",[]):
                title = it["title"]
                if title.lower() in seen: continue
                seen.add(title.lower())
                # fetch imageinfo url
                info = get({"action":"query","titles":title,"prop":"imageinfo",
                            "iiprop":"url|mime|size","format":"json"})
                page = list(info.get("query",{}).get("pages",{}).values())[0]
                ii = page.get("imageinfo",[{}])[0]
                print("  • %s | %s | %sx%s" % (title, ii.get("mime",""), ii.get("width"), ii.get("height")))
                print("    %s" % ii.get("url",""))
        except Exception as e:
            print("  ERR", q, e)
        time.sleep(0.4)
