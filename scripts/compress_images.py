#!/usr/bin/env python3
"""Batch compress JPGs: max edge 1280px, quality 82, optimize=True."""
import os, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.path.insert(0, "/Users/panyp/.workbuddy/binaries/python/envs/pillow_lib")
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True

ROOT = "/Users/panyp/WorkBuddy/飞机探索/assets/img"
MAX_EDGE = 1024
QUALITY = 75

def compress_one(path):
    try:
        orig = os.path.getsize(path)
        img = Image.open(path)
        w, h = img.size
        if max(w, h) > MAX_EDGE:
            ratio = MAX_EDGE / max(w, h)
            img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
        img = img.convert("RGB") if img.mode != "RGB" else img
        img.save(path, "JPEG", quality=QUALITY, optimize=True)
        new = os.path.getsize(path)
        return (path, orig, new)
    except Exception as e:
        return (path, -1, -1, str(e))

def main():
    files = []
    for dirpath, _, fnames in os.walk(ROOT):
        for f in fnames:
            if f.lower().endswith(".jpg"):
                files.append(os.path.join(dirpath, f))
    print(f"待压缩: {len(files)} 张")
    total_orig = sum(os.path.getsize(f) for f in files)
    print(f"原始总体积: {total_orig / 1024 / 1024:.1f} MB")

    t0 = time.time()
    results = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(compress_one, f): f for f in files}
        done = 0
        for fut in as_completed(futs):
            r = fut.result()
            results.append(r)
            done += 1
            if done % 100 == 0:
                print(f"  已处理 {done}/{len(files)} ...")

    errors = [r for r in results if len(r) > 3]
    ok = [r for r in results if len(r) == 3]
    total_new = sum(r[2] for r in ok)
    elapsed = time.time() - t0

    print(f"\n=== 压缩完成 ({elapsed:.1f}s) ===")
    print(f"成功: {len(ok)} 张 | 失败: {len(errors)} 张")
    print(f"压缩后总体积: {total_new / 1024 / 1024:.1f} MB")
    print(f"压缩率: {(1 - total_new / total_orig) * 100:.1f}%")
    if errors:
        print("失败文件:")
        for e in errors[:10]:
            print(f"  {e[0]}: {e[3]}")

if __name__ == "__main__":
    main()
