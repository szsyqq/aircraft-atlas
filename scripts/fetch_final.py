#!/usr/bin/env python3
"""
Final targeted fetch: one specific query per missing aircraft/angle.
Downloads candidate, resizes to JPEG ≤1280px.
Outputs manifest of what was fetched so we can visually verify each one.
"""
import json, os, urllib.parse, urllib.request, time, subprocess, re

UA = "AircraftAtlas/1.0"
API = "https://commons.wikimedia.org/w/api.php"
CDN = "upload.wikimedia.org"
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "img")

def get(params, tries=5):
    params["format"] = "json"
    url = API + "?" + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception as e:
            wait = 4 * (i + 1)
            print(f"  [retry {i+1}/{tries}] {e} — waiting {wait}s")
            time.sleep(wait)
    return None

def get_url(title):
    """Get direct image URL for a given file title."""
    d = get({"action": "query", "titles": title, "prop": "imageinfo",
             "iiprop": "url|size|mime", "format": "json"})
    pages = d.get("query", {}).get("pages", {})
    for pid, page in pages.items():
        ii = page.get("imageinfo", [{}])[0]
        return ii.get("url", ""), ii.get("width", 0), ii.get("mime", "")
    return "", 0, ""

def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    with open(dest, "wb") as f:
        f.write(data)
    # Convert to JPEG via sips
    tmp = dest + ".tmp.jpg"
    subprocess.run(["/usr/bin/sips", "-s", "format", "jpeg", "-Z", "1280", dest, "--out", tmp],
                   capture_output=True)
    if os.path.exists(tmp):
        os.replace(tmp, dest)
        return os.path.getsize(dest)
    return len(data)

# Missing angles: (id, angle, search_query)
# angle = "front" or "top"
MISSING = [
    ("b747",  "front", "Boeing 747 nose head on"),
    ("b747",  "top",   "Boeing 747 from below underside"),
    ("a320",  "top",   "Airbus A320 from below overhead"),
    ("a330",  "top",   "Airbus A330 from below belly"),
    ("a350",  "front", "Airbus A350 nose cockpit"),
    ("a350",  "top",   "Airbus A350 from below"),
    ("a380",  "front", "Airbus A380 nose"),
    ("a380",  "top",   "Airbus A380 seen from below"),
    ("c919",  "front", "Comac C919 nose cockpit"),
    ("c919",  "top",   "Comac C919 from below"),
    ("arj21", "front", "ARJ21 nose"),
    ("arj21", "top",   "ARJ21 from below"),
]

results = {}
for aid, angle, query in MISSING:
    outfile = os.path.join(OUT, f"{aid}_{angle}.jpg")
    if os.path.exists(outfile):
        sz = os.path.getsize(outfile)
        print(f"SKIP {aid}_{angle} (exists, {sz}B)")
        results[f"{aid}_{angle}"] = {"file": outfile, "status": "existing"}
        continue

    print(f"\n--- {aid}_{angle}: \"{query}\" ---")
    d = get({"action": "query", "list": "search", "srsearch": query,
             "srnamespace": 6, "srlimit": 10})
    if not d:
        print(f"  NO RESPONSE")
        continue

    hits = d.get("query", {}).get("search", [])
    picked = None
    for hit in hits:
        title = hit["title"]
        # Skip obvious non-photos
        skip_words = ["diagram", "map", "chart", "logo", "font", "unifont",
                      "3d model", "interior", "cabin", "seat", "engine only",
                      "landing gear door", "parts"]
        lower = title.lower()
        if any(w in lower for w in skip_words):
            print(f"  SKIP {title}")
            continue
        picked = title
        break

    if not picked:
        print(f"  NO MATCH (tried {len(hits)} hits)")
        # Show first 3 titles for debugging
        for h in hits[:3]:
            print(f"    - {h['title']}")
        continue

    url, w, mime = get_url(picked)
    if not url:
        print(f"  NO URL for {picked}")
        continue

    print(f"  PICKED: {picked} ({w}x? {mime})")
    try:
        sz = download(url, outfile)
        print(f"  OK {aid}_{angle}.jpg ({sz}B)")
        results[f"{aid}_{angle}"] = {
            "file": outfile, "title": picked, "url": url,
            "size": sz, "status": "downloaded"
        }
    except Exception as e:
        print(f"  DOWNLOAD ERR: {e}")

    time.sleep(2)

print("\n=== DONE ===")
print(json.dumps(results, indent=2, ensure_ascii=False))
