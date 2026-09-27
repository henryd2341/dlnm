#!/usr/bin/env python3
"""
去掉文件（扩展名之前）的相同后缀。

示例：
    image_suffix.png  image_2_suffix.png
    -> image.png      image_2.png

用法：
    python strip_suffix.py image_suffix.png image_2_suffix.png
    python strip_suffix.py -d ./photos
    python strip_suffix.py -d . -e png          # 只处理 png
    python strip_suffix.py -n -d . -e png       # 只预览
"""

import argparse
import os
import sys
from pathlib import Path

SEPARATORS = "_- ."

# 正在运行的脚本自身，处理目录时自动排除
SELF = Path(__file__).resolve()


def common_suffix(names):
    if not names:
        return ""
    return os.path.commonprefix([n[::-1] for n in names])[::-1]


def safe_suffix(names):
    suffix = common_suffix(names)
    if not suffix:
        return ""
    idx = next((i for i, ch in enumerate(suffix) if ch in SEPARATORS), None)
    if idx is None:
        return ""
    return suffix[idx:]


def collect_files(args):
    if args.dir:
        base = Path(args.dir)
        files = [p for p in base.iterdir() if p.is_file()]
    else:
        files = [Path(f) for f in args.files]

    # 1) 排除脚本自身
    files = [p for p in files if p.resolve() != SELF]

    # 2) 只保留指定扩展名
    if args.ext:
        exts = {e.lower().lstrip(".") for e in args.ext}
        files = [p for p in files if p.suffix.lower().lstrip(".") in exts]

    return files


def strip_common_suffix(paths, dry_run=False):
    paths = [Path(p) for p in paths]
    suffix = safe_suffix([p.stem for p in paths])

    if not suffix:
        print("没有找到可安全去掉的共同后缀，未做任何修改。", file=sys.stderr)
        return 0

    print(f"检测到共同后缀：{suffix!r}\n")

    count = 0
    for p in paths:
        new_stem = p.stem[: -len(suffix)]
        if not new_stem:
            continue
        new_path = p.with_name(new_stem + p.suffix)
        if new_path == p:
            continue
        if new_path.exists():
            print(f"跳过 {p.name} -> {new_path.name}（目标已存在）", file=sys.stderr)
            continue

        print(f"{p.name} -> {new_path.name}")
        if not dry_run:
            p.rename(new_path)
        count += 1

    return count


def main():
    ap = argparse.ArgumentParser(description="去掉文件（扩展名之前）的相同后缀")
    ap.add_argument("files", nargs="*", help="待处理的文件")
    ap.add_argument("-d", "--dir", help="处理该目录下的所有普通文件")
    ap.add_argument("-e", "--ext", nargs="+",
                    help="只处理这些扩展名，例如 -e png jpg")
    ap.add_argument("-n", "--dry-run", action="store_true",
                    help="只显示结果，不实际重命名")
    args = ap.parse_args()

    paths = collect_files(args)

    if len(paths) < 2:
        print("至少需要两个文件才能确定共同后缀。", file=sys.stderr)
        sys.exit(1)

    n = strip_common_suffix(paths, dry_run=args.dry_run)
    print(f"\n{'将重命名' if args.dry_run else '已重命名'} {n} 个文件。")


if __name__ == "__main__":
    main()