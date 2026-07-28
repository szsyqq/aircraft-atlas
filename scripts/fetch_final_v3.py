#!/usr/bin/env python3
"""
Final fetch v3: use imageinfo API with iiurlwidth=1280 to get proper thumbnail URLs.
Standard sizes only (1280 is approved). Long cooldowns between requests.
"""
import json, os, urllib.parse, urllib.request, time, subprocess

UA = "AircraftAtlas/1.0"
API = "https://commons.wikimedia.org/w/api.php"
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "img")

def api(params, tries=6):
    params["format"] = "json"
    url = API + "?" + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception as e:
            wait = 6 * (i + 1)
            print(f"    [retry {i+1}/{tries}] {e} — wait {wait}s")
            time.sleep(wait)
    return None

def search_one(query):
    d = api({"action": "query", "list": "search", "srsearch": query,
             "srnamespace": 6, "srlimit": 20})
    if not d:
        return []
    return d.get("query", {}).get("search", [])

def get_thumb(title, width=1280):
    """Get thumbnail URL via imageinfo API."""
    d = api({"action": "query", "titles": title, "prop": "imageinfo",
             "iiprop": "url|size|mime", "iiurlwidth": width})
    pages = d.get("query", {}).get("pages", {})
    for pid, page in pages.items():
        ii = page.get("imageinfo", [{}])[0]
        return {
            "thumb": ii.get("thumburl", ""),
            "orig": ii.get("url", ""),
            "w": ii.get("width", 0),
            "h": ii.get("height", 0),
            "mime": ii.get("mime", ""),
        }
    return {}

def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    if len(data) < 5000:
        print(f"      Too small ({len(data)}B)")
        return 0
    with open(dest, "wb") as f:
        f.write(data)
    tmp = dest + ".tmp.jpg"
    subprocess.run(["/usr/bin/sips", "-s", "format", "jpeg", "-Z", "1280",
                   dest, "--out", tmp], capture_output=True)
    if os.path.exists(tmp):
        os.replace(tmp, dest)
    return os.path.getsize(dest)

SKIP_WORDS = [
    "diagram", "map", "chart", "logo", "font", "unifont",
    "3d model", "interior", "cabin", "seat", "engine only",
    "landing gear door", "parts", "mock-up", "pdf",
    "register", "federal", "congress", "hearing", "infrared",
    "reentry", "infographic", "schematic", "line drawing",
]

# (id, angle, search_queries_to_try_in_order)
# Also supports direct File: title lookup via prefix "FILE:"
MISSING = [
    ("b747",  "front", ["Boeing 747 nose on head-on", "Boeing 747 cockpit front view"]),
    ("b747",  "top",   ["Boeing 747 from below underside", "Boeing 747 belly"]),
    ("a320",  "top",   ["Airbus A320 from below overhead belly", "Airbus A320 underside"]),
    ("a330",  "top",   ["Airbus A330 from below overhead belly", "Airbus A330 underside"]),
    ("a350",  "front", ["Airbus A350 nose on head-on", "Airbus A350 front view"]),
    ("a350",  "top",   ["Airbus A350 from below overhead", "Airbus A350 underside"]),
    ("a380",  "front", ["Airbus A380 nose on head-on", "Airbus A380 front view"]),
    ("a380",  "top",   ["FILE:Emirates Airbus A380 (seen from below).JPG", "Airbus A380 from below underside"]),
    ("c919",  "front", ["COMAC C919 nose on cockpit", "C919 front view"]),
    ("c919",  "top",   ["C919 from below overhead", "COMAC C919 underside"]),
    ("arj21", "front", ["ARJ21 nose on COMAC", "ARJ21 front view"]),
    ("arj21", "top",   ["ARJ21 from below overhead", "ARJ21 underside"]),
]

ok = 0
for idx, (aid, angle, queries) in enumerate(MISSING):
    outfile = os.path.join(OUT, f"{aid}_{angle}.jpg")
    if os.path.exists(outfile) and os.path.getsize(outfile) > 10000:
        print(f"SKIP {aid}_{angle} (exists)")
        ok += 1
        continue

    print(f"\n[{idx+1}/{len(MISSING)}] {aid}_{angle}")
    
    if idx > 0:
        time.sleep(8)

    picked_title = None
    for qi, q in enumerate(queries):
        if qi > 0:
            time.sleep(5)
        # Direct file title lookup (prefix "FILE:")
        if q.startswith("FILE:"):
            picked_title = q  # Use directly as File:Title
            break
        hits = search_one(q)
        for hit in hits:
            title = hit["title"]
            lower = title.lower()
            if any(w in lower for w in SKIP_WORDS):
                continue
            picked_title = title
            break
        if picked_title:
            break

    if not picked_title:
        print(f"  NO MATCH")
        continue

    info = get_thumb(picked_title, 1280)
    thumb = info.get("thumb", "")
    if not thumb:
        print(f"  NO THUMB URL for {picked_title}")
        continue

    print(f"  PICKED: {picked_title}")
    print(f"    {info['w']}x{info['h']} {info['mime']}")
    
    try:
        sz = download(thumb, outfile)
        if sz > 0:
            print(f"  OK {sz}B")
            ok += 1
        else:
            print(f"  DOWNLOAD FAILED")
    except Exception as e:
        print(f"  ERR: {e}")

    time.sleep(10)

print(f"\n=== DONE: {ok}/{len(MISSING)} successful ===")
for f in sorted(os.listdir(OUT)):
    if "_front." in f or "_top." in f:
        fp = os.path.join(OUT, f)
        print(f"  {f}: {os.path.getsize(fp)}B")
