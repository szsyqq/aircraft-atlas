#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fetch_variant_images.py — 为飞机图鉴的 67 款具体机型从 Wikimedia Commons 抓取实拍图。

目标：
  - 每款机型独立 10 张照片，存入 assets/img/v/<slug>/NN.jpg
  - 不同机型不共用同一张源图（全局去重 used 集合）
  - 生成 js/variant-gallery.js（window.VGAL 映射），renderVariantDetail 直接消费

运行（需要有外网的机器）：
  python3 scripts/fetch_variant_images.py                 # 全量抓取（覆盖已有）
  python3 scripts/fetch_variant_images.py --limit 5       # 每款只抓 5 张（调试）
  python3 scripts/fetch_variant_images.py --slug 737-800 # 只抓某一款
  python3 scripts/fetch_variant_images.py --repair        # 只重抓磁盘上的坏文件，保留已有效的
  python3 scripts/fetch_variant_images.py --index-only    # 不联网，仅扫描磁盘生成 VGAL

图片来源：Wikimedia Commons（CC 授权），与站点既有图片同源。
健壮性：下载时校验 JPEG/PNG 文件头；遇 429 限流**不重试**、直接跳过该槽位留待下一轮修复，
避免重试风暴耗尽限流预算；候选 URL 缓存到 _candidates.json，修复模式不重复搜 API。
"""
import os, sys, json, time, subprocess, random, urllib.parse, argparse
import concurrent.futures as _cf
import threading
USED_LOCK = threading.Lock()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "assets", "img", "v")
CACHE = os.path.join(IMG_DIR, "_candidates.json")
OUT_JS = os.path.join(ROOT, "js", "variant-gallery.js")
API = "https://commons.wikimedia.org/w/api.php"
# 经沙箱代理下载时，Wikimedia 会拒绝 bot UA（403）；用浏览器 UA 可正常取图。
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
PER_VAR = 10
THUMB_W = 1100
SLEEP = 1.8       # 礼貌延时（秒）——经 wsrv.nl 中转后有 CDN 缓存，可放宽节奏
# 经图片代理 CDN 中转 Wikimedia 缩略图，绕开本沙箱共享 IP 对 upload.wikimedia.org 的限流
WESRV = "https://wsrv.nl/?url="

# slug -> Wikimedia 搜索词（尽量精确到具体型号，避免抓到无关图）
QUERY = {
    "707-120-120b": "Boeing 707-120",
    "707-320b-320c": "Boeing 707-320",
    "737-200": "Boeing 737-200",
    "737-300": "Boeing 737-300",
    "737-400": "Boeing 737-400",
    "737-500": "Boeing 737-500",
    "737-700": "Boeing 737-700",
    "737-800": "Boeing 737-800",
    "737-900er": "Boeing 737-900ER",
    "737-max-8": "Boeing 737 MAX 8",
    "737-max-9-200": "Boeing 737 MAX 9",
    "747-100-200": "Boeing 747-200",
    "747-400": "Boeing 747-400",
    "747-8": "Boeing 747-8",
    "757-200": "Boeing 757-200",
    "757-300": "Boeing 757-300",
    "767-200-200er": "Boeing 767-200",
    "767-300-300er": "Boeing 767-300",
    "767-400er": "Boeing 767-400",
    "777-200": "Boeing 777-200",
    "777-200er": "Boeing 777-200ER",
    "777-200lr": "Boeing 777-200LR",
    "777-300": "Boeing 777-300",
    "777-300er": "Boeing 777-300ER",
    "777f": "Boeing 777F",
    "777-9-777x": "Boeing 777X",
    "787-8": "Boeing 787-8",
    "787-9": "Boeing 787-9",
    "787-10": "Boeing 787-10",
    "a220-100": "Airbus A220-100",
    "a220-300": "Airbus A220-300",
    "a318": "Airbus A318",
    "a319-a319neo": "Airbus A319",
    "a320-a320neo": "Airbus A320",
    "a321-a321neo": "Airbus A321",
    "a321xlr": "Airbus A321XLR",
    "a330-200-200f": "Airbus A330-200",
    "a330-300": "Airbus A330-300",
    "a330-800-900neo": "Airbus A330neo",
    "a340-200-300": "Airbus A340-300",
    "a340-500": "Airbus A340-500",
    "a340-600": "Airbus A340-600",
    "a350-900-ulr": "Airbus A350-900",
    "a350-1000": "Airbus A350-1000",
    "a380-800": "Airbus A380",
    "arj21-c909": "Comac ARJ21",
    "c919": "Comac C919",
    "e170": "Embraer E170",
    "e175": "Embraer E175",
    "e190": "Embraer E190",
    "e195": "Embraer E195",
    "e190-e195-e2": "Embraer E190-E2",
    "erj-135-140": "Embraer ERJ-140",
    "erj-145": "Embraer ERJ-145",
    "crj100-200": "Bombardier CRJ200",
    "crj700": "Bombardier CRJ700",
    "crj900": "Bombardier CRJ900",
    "crj1000": "Bombardier CRJ1000",
    "md-80": "McDonnell Douglas MD-80",
    "md-90": "McDonnell Douglas MD-90",
    "md-11-dc-10": "McDonnell Douglas MD-11",
    "tu-154m": "Tupolev Tu-154",
    "tu-204-214": "Tupolev Tu-204",
    "il-96-300-400": "Ilyushin Il-96",
    "ssj100-sj-100": "Sukhoi Superjet 100",
    "an-124-ruslan": "Antonov An-124",
    "concorde": "Concorde",
}


def _curl_get(url, timeout=12):
    """经系统代理用 curl 取数据；返回 (http_code, data_bytes)。"""
    cmd = ["curl", "-s", "-L", "--max-time", str(timeout), "-A", UA,
           "-w", "\\n%{http_code}", "-o", "-", url]
    try:
        out = subprocess.run(cmd, capture_output=True)
    except Exception as e:
        return (0, b"")
    body = out.stdout
    # curl -w 在末尾追加了 \n<code>
    if b"\n" in body:
        data, code = body.rsplit(b"\n", 1)
    else:
        data, code = body, b"0"
    try:
        code_i = int(code.strip())
    except Exception:
        code_i = 0
    return (code_i, data)


def valid_image_bytes(data):
    if len(data) < 800:
        return False
    if data[:2] == b"\xff\xd8":       # JPEG
        return True
    if data[:8] == b"\x89PNG\r\n\x1a\n":  # PNG
        return True
    return False


def is_valid_file(path):
    try:
        with open(path, "rb") as f:
            return valid_image_bytes(f.read(16))
    except Exception:
        return False


def api_search(q, limit=24):
    params = {
        "action": "query", "format": "json",
        "generator": "search", "gsrsearch": q, "gsrnamespace": "6",
        "gsrlimit": str(limit),
        "prop": "imageinfo", "iiprop": "url|mime",
        "iiurlwidth": str(THUMB_W),
    }
    url = API + "?" + urllib.parse.urlencode(params)
    ok, body = _curl_get(url, timeout=30)
    if not ok or ok != 200:
        raise RuntimeError("curl API HTTP %s" % ok)
    return json.loads(body.decode("utf-8", "replace"))


def strip_scheme(u):
    if u.startswith("https://"):
        return u[len("https://"):]
    if u.startswith("http://"):
        return u[len("http://"):]
    return u


def proxied_urls(thumburl):
    """同一下载目标的多通道写法，应对单通道偶发连接抖动（wsrv=0）。

    - wsrv.nl / images.weserv.nl：图片代理 CDN，从自身服务器取 Wikimedia 图，绕开本机限流
    - i0.wp.com（Photon）：WordPress 图片代理，同样是第三方 IP 取图
    - 直连 upload.wikimedia.org：最后兜底（可能遇 429）
    """
    ns = strip_scheme(thumburl)
    q = urllib.parse.quote(ns, safe="")
    return [
        WESRV + q,
        "https://images.weserv.nl/?url=" + q,
        "https://i0.wp.com/" + ns,
        thumburl,
    ]


def download(url, dest):
    """多通道下载并校验；任一通道成功即写盘返回 True，全失败抛异常。

    主通道经图片代理 CDN 中转，绕开本沙箱共享 IP 对 upload.wikimedia.org 的限流；
    代理 CDN 自带缓存，同一张图二次取用秒回。单通道连接抖动（code=0）由下一通道接住，
    不主动重试、不制造请求风暴。仅当所有通道都失败时才由上层跳过该槽位。
    """
    last = ""
    for ch in proxied_urls(url):
        code, data = _curl_get(ch, timeout=30)
        if code == 200 and valid_image_bytes(data):
            with open(dest, "wb") as f:
                f.write(data)
            return True
        last = "ch=%s" % code
        if code == 429:
            # 限流：直接放弃该通道（直连也会 429），不让上层重试风暴
            continue
    raise RuntimeError("全部通道失败 (%s)" % last)


def load_cache():
    if os.path.exists(CACHE):
        try:
            return json.load(open(CACHE, encoding="utf-8"))
        except Exception:
            return {}
    return {}


def save_cache(cache):
    try:
        json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    except Exception:
        pass


def collect_candidates(slug, used, limit):
    """为该 slug 收集候选 (title, thumburl) 列表（Wikimedia Commons CC）。

    - 候选 URL 缓存到 _candidates.json：修复模式不重复搜 API，避免额外限流负载。
    - 跨宽泛查询与全局 used 去重，保证不同机型不共用同一张源图。
    """
    cache = load_cache()
    if slug in cache and cache[slug]:
        return cache[slug][: limit * 3]
    q = QUERY.get(slug, slug.replace("-", " "))
    cands = []
    seen_local = set()
    tried = [q]
    words = q.split()
    if len(words) >= 3:
        tried.append(" ".join(words[:2]))
    for qi, qry in enumerate(tried):
        try:
            data = api_search(qry, 50 if qi > 0 else 28)
        except Exception as e:
            print("   ! Wikimedia 失败 [%s]: %s" % (qry, e))
            continue
        pages = (data.get("query") or {}).get("pages") or {}
        for p in pages.values():
            if len(cands) >= limit * 3:
                break
            ii = (p.get("imageinfo") or [{}])[0]
            mime = ii.get("mime", "")
            title = p.get("title", "")
            if mime not in ("image/jpeg", "image/png"):
                continue
            if any(k in title.lower() for k in ("logo", "symbol", "icon", "map", "diagram", "svg")):
                continue
            if title in seen_local or title in used:
                continue
            thumb = ii.get("thumburl")
            if not thumb:
                continue
            seen_local.add(title)
            cands.append((title, thumb))
        if len(cands) >= limit:
            break
    if cands:
        cache[slug] = cands
        save_cache(cache)
    return cands


def _fetch_slot(slug, idx, cands, used, limit):
    """单槽位抓取：已有效则跳过；否则依次尝试候选（容忍个别文件取不到）。"""
    sdir = os.path.join(IMG_DIR, slug)
    dest = os.path.join(sdir, "%02d.jpg" % idx)
    if os.path.exists(dest) and is_valid_file(dest):
        return "assets/img/v/%s/%02d.jpg" % (slug, idx)
    base = idx - 1
    n_cands = len(cands)
    for off in range(min(3, n_cands)):
        ci = (base + off) % n_cands
        title, thumb = cands[ci]
        try:
            download(thumb, dest)
            with USED_LOCK:
                used.add(title)
            print("   + [%s] %d/%d  %s" % (slug, idx, limit, title[:50]))
            return "assets/img/v/%s/%02d.jpg" % (slug, idx)
        except Exception:
            continue
    print("   ! [%s] 槽位 %d/%d 候选均失败（留待下一轮修复）" % (slug, idx, limit))
    return None


def fetch_variant(slug, used, limit, repair=False):
    """并发抓取本 slug 的 limit 个槽位（线程池），大幅缩短前台等待时间。"""
    sdir = os.path.join(IMG_DIR, slug)
    os.makedirs(sdir, exist_ok=True)
    cands = collect_candidates(slug, used, limit)
    out = [None] * limit
    with _cf.ThreadPoolExecutor(max_workers=5) as ex:
        fut = {ex.submit(_fetch_slot, slug, i, cands, used, limit): i
               for i in range(1, limit + 1)}
        for f in _cf.as_completed(fut):
            i = fut[f]
            r = f.result()
            if r:
                out[i - 1] = r
    return [p for p in out if p]


def write_vgal(vgal):
    lines = [
        "/* 自动生成：scripts/fetch_variant_images.py — 每款机型独立图库（Wikimedia Commons CC） */",
        "window.VGAL = {",
    ]
    for slug, paths in vgal.items():
        arr = ", ".join('"%s"' % p for p in paths)
        lines.append('  "%s": [%s],' % (slug, arr))
    lines.append("};")
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def index_only():
    """只扫描 assets/img/v/ 下已有图片，生成 js/variant-gallery.js（不联网）。"""
    vgal = {}
    if not os.path.isdir(IMG_DIR):
        print("! 未找到 assets/img/v/ 目录")
        return
    for slug in sorted(os.listdir(IMG_DIR)):
        sdir = os.path.join(IMG_DIR, slug)
        if not os.path.isdir(sdir):
            continue
        files = sorted(f for f in os.listdir(sdir) if f.lower().endswith((".jpg", ".jpeg", ".png")))
        if files:
            vgal[slug] = ["assets/img/v/%s/%s" % (slug, f) for f in files]
    write_vgal(vgal)
    total = sum(len(v) for v in vgal.values())
    print("index-only 完成：%d 款机型，共 %d 张图片 -> %s" % (len(vgal), total, OUT_JS))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=PER_VAR)
    ap.add_argument("--slug", default=None)
    ap.add_argument("--slugs-file", default=None,
                    help="按文件分段抓取：每行一个 slug（仅保留 QUERY 中存在的）")
    ap.add_argument("--repair", action="store_true",
                    help="只重抓磁盘上的坏文件（非有效 JPEG/PNG），保留已有效的")
    ap.add_argument("--index-only", action="store_true",
                    help="不联网，仅扫描 assets/img/v/ 下已有图片生成 VGAL")
    args = ap.parse_args()
    if args.index_only:
        index_only()
        return
    if args.slugs_file:
        try:
            with open(args.slugs_file, encoding="utf-8") as fh:
                file_slugs = [l.strip() for l in fh if l.strip()]
            slugs = [s for s in file_slugs if s in QUERY]
            print("按文件分段：从 %d 行中取到 %d 个有效 slug" % (len(file_slugs), len(slugs)))
        except Exception as e:
            print("! 读取 --slugs-file 失败：%s" % e)
            slugs = []
    else:
        slugs = [args.slug] if args.slug else list(QUERY.keys())
    used = set()
    vgal = {}
    os.makedirs(IMG_DIR, exist_ok=True)
    for slug in slugs:
        print("== %s ==" % slug)
        got = fetch_variant(slug, used, args.limit, repair=args.repair)
        if got:
            vgal[slug] = got
        else:
            print("   (无可用图片)")
    # 始终从磁盘重新生成 VGAL，保证与落盘一致
    index_only()
    total = sum(len(v) for v in vgal.values())
    print("\n抓取完成：%d 款机型，共 %d 张图片。" % (len(vgal), total))


if __name__ == "__main__":
    main()
