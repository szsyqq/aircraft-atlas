#!/usr/bin/env python3
"""
Final fetch v2: use THUMBNAIL URLs (not original) to avoid 429.
Per https://w.wiki/GHai — thumbnails are preferred for bulk access.
Target: 1280px wide JPEG thumbnails.
"""
import json, os, urllib.parse, urllib.request, time, subprocess, re

UA = "AircraftAtlas/1.0"
API = "https://commons.wikimedia.org/w/api.php"
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "img")

def get(params, tries=6):
    params["format"] = "json"
    url = API + "?" + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception as e:
            wait = 6 * (i + 1)
            print(f"    [retry {i+1}/{tries}] {e} — waiting {wait}s")
            time.sleep(wait)
    return None

def get_thumb_url(title, width=1280):
    """Build thumbnail URL from file title."""
    # Encode title for URL: replace spaces with _, keep as-is otherwise
    encoded = title.replace(" ", "_").replace("File:", "")
    # Thumbnail URL pattern
    first = encoded[0].upper() if encoded else "_"
    # Handle subdirectory hashing (first char / first two chars)
    if len(encoded) >= 2:
        sub = f"{first}/{encoded[:2]}/{encoded}"
    else:
        sub = f"{first}/{encoded}"
    url = f"https://upload.wikimedia.org/wikipedia/commons/thumb/{sub}/{width}px-{encoded}"
    return url

def get_original_url(title):
    d = get({"action": "query", "titles": title, "prop": "imageinfo",
             "iiprop": "url|size|mime", "format": "json"})
    pages = d.get("query", {}).get("pages", {})
    for pid, page in pages.items():
        ii = page.get("imageinfo", [{}])[0]
        return ii.get("url", ""), ii.get("width", 0)
    return "", 0

def download_any_url(url, dest):
    """Try thumbnail URL first, fall back to original."""
    for u in [url]:
        if not u:
            continue
        try:
            req = urllib.request.Request(u, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            if len(data) < 5000:
                print(f"      Too small ({len(data)}B), skipping")
                continue
            with open(dest, "wb") as f:
                f.write(data)
            tmp = dest + ".tmp.jpg"
            subprocess.run(["/usr/bin/sips", "-s", "format", "jpeg", "-Z", "1280",
                           dest, "--out", tmp], capture_output=True)
            if os.path.exists(tmp):
                os.replace(tmp, dest)
            return os.path.getsize(dest)
        except Exception as e:
            print(f"      ERR: {e}")
    return 0

# Missing angles: (id, angle, search_query)
MISSING = [
    ("b747",  "front", "Boeing 747 nose on cockpit head-on"),
    ("b747",  "top",   "Boeing 747 underside belly from below"),
    ("a320",  "top",   "Airbus A320 underside from below overhead"),
    ("a330",  "top",   "Airbus A330 underside from below"),
    ("a350",  "front", "Airbus A350 nose on"),
    ("a350",  "top",   "Airbus A350 underside from below"),
    ("a380",  "front", "Airbus A380 nose on cockpit"),
    ("a380",  "top",   "Airbus A380 underside seen from below"),
    ("c919",  "front", "C919 nose cockpit COMAC"),
    ("c919",  "top",   "C919 underside from below"),
    ("arj21", "front", "ARJ21 nose COMAC"),
    ("arj21", "top",   "ARJ21 underside from below"),
]

results = {}
for idx, (aid, angle, query) in enumerate(MISSING):
    outfile = os.path.join(OUT, f"{aid}_{angle}.jpg")
    if os.path.exists(outfile) and os.path.getsize(outfile) > 10000:
        sz = os.path.getsize(outfile)
        print(f"SKIP {aid}_{angle} (exists {sz}B)")
        continue

    print(f"\n[{idx+1}/{len(MISSING)}] {aid}_{angle}: \"{query}\"")
    
    # Cooldown between searches
    if idx > 0:
        time.sleep(5)

    d = get({"action": "query", "list": "search", "srsearch": query,
             "srnamespace": 6, "srlimit": 15})
    if not d:
        print(f"  NO RESPONSE")
        continue

    hits = d.get("query", {}).get("search", [])
    
    skip_words = ["diagram", "map", "chart", "logo", "font", "unifont",
                  "3d model", "interior", "cabin", "seat", "engine only",
                  "landing gear door", "parts", "pdf", "register", "federal",
                  "congress", "hearing", "infrared", "reentry"]
    
    picked = None
    for hit in hits:
        title = hit["title"]
        lower = title.lower()
        if any(w in lower for w in skip_words):
            continue
        picked = title
        break

    if not picked:
        print(f"  NO GOOD MATCH ({len(hits)} hits)")
        for h in hits[:3]:
            print(f"    - {h['title']}")
        continue

    # Try thumbnail URL first
    thumb_url = get_thumb_url(picked, 1024)
    orig_url, ow = get_original_url(picked)
    
    print(f"  PICKED: {picked}")
    print(f"    thumb: {thumb_url[-80:]}")
    print(f"    orig:  {orig_url[-60:] if orig_url else 'N/A'} ({ow}px)")

    sz = download_any_url(thumb_url, outfile)
    if sz > 0:
        print(f"  OK {aid}_{angle}.jpg ({sz}B)")
    else:
        print(f"  FAILED to download")
    
    time.sleep(8)  # Cooldown between downloads

print("\n=== DONE ===")
# List final state
for f in sorted(os.listdir(OUT)):
    if "_front." in f or "_top." in f:
        fp = os.path.join(OUT, f)
        print(f"  {f}: {os.path.getsize(fp)}B")
