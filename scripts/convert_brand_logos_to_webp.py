"""品牌 Logo WebP 批次轉換工具。

用途：
    遞迴尋找 ``assets/images/brand_logo`` 內的 JPG、JPEG、PNG，轉換為
    同名 WebP，並同步更新 ``mapping/brand_logos.json`` 的 ``filename``
    與 ``path`` 引用。

安全機制：
    1. 先將圖片輸出至暫存檔。
    2. 使用 Pillow 重新開啟並驗證輸出確實為有效 WebP。
    3. 驗證成功後才替換目的檔並刪除原始 JPG／JPEG／PNG。
    4. 只更新轉換成功的 JSON 項目；失敗圖片的原始引用保持不變。
    5. 若不同來源會產生相同的 WebP 檔名，立即停止以避免互相覆寫。

需求：
    Python 3.9+、Pillow（安裝專案 ``requirements.txt`` 即可）。

使用方式：
    python scripts/convert_brand_logos_to_webp.py
    python scripts/convert_brand_logos_to_webp.py --dry-run
    python scripts/convert_brand_logos_to_webp.py --quality 90
    python scripts/convert_brand_logos_to_webp.py <圖片資料夾> --mapping <JSON 路徑>

預設 WebP 品質為 90。腳本可重複執行；沒有可轉換檔案時不會修改內容。
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

from PIL import Image, ImageOps


SUPPORTED_SUFFIXES = {".jpg", ".jpeg", ".png"}
DEFAULT_LOGO_DIR = Path(__file__).resolve().parents[1] / "assets" / "images" / "brand_logo"
DEFAULT_MAPPING_PATH = Path(__file__).resolve().parents[1] / "mapping" / "brand_logos.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="遞迴將品牌 Logo 的 JPG、JPEG、PNG 轉成 WebP，成功後刪除來源檔。"
    )
    parser.add_argument(
        "directory",
        nargs="?",
        type=Path,
        default=DEFAULT_LOGO_DIR,
        help=f"圖片資料夾（預設：{DEFAULT_LOGO_DIR}）",
    )
    parser.add_argument("--quality", type=int, default=90, help="WebP 品質，1–100（預設：90）")
    parser.add_argument(
        "--mapping",
        type=Path,
        default=DEFAULT_MAPPING_PATH,
        help=f"品牌引用 JSON（預設：{DEFAULT_MAPPING_PATH}）",
    )
    parser.add_argument("--dry-run", action="store_true", help="只列出預計轉換項目，不修改檔案")
    return parser.parse_args()


def find_sources(directory: Path) -> list[Path]:
    return sorted(
        path
        for path in directory.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_SUFFIXES
    )


def validate_unique_destinations(sources: list[Path]) -> None:
    destinations = [source.with_suffix(".webp") for source in sources]
    duplicates = [path for path, count in Counter(destinations).items() if count > 1]
    if duplicates:
        joined = "\n".join(f"  - {path}" for path in duplicates)
        raise RuntimeError(f"多個來源檔會寫入同一個 WebP，已停止以避免覆寫：\n{joined}")


def convert_one(source: Path, quality: int) -> Path:
    destination = source.with_suffix(".webp")
    temporary = destination.with_name(f".{destination.name}.tmp")

    try:
        with Image.open(source) as image:
            image = ImageOps.exif_transpose(image)
            if image.mode not in {"RGB", "RGBA"}:
                image = image.convert("RGBA" if "transparency" in image.info else "RGB")
            image.save(temporary, format="WEBP", quality=quality, method=6)

        with Image.open(temporary) as converted:
            if converted.format != "WEBP" or converted.size[0] <= 0 or converted.size[1] <= 0:
                raise RuntimeError("輸出檔驗證失敗")
            converted.verify()

        temporary.replace(destination)
        source.unlink()
        return destination
    except Exception:
        temporary.unlink(missing_ok=True)
        raise


def update_mapping(mapping_path: Path, conversions: list[tuple[Path, Path]]) -> int:
    if not mapping_path.is_file():
        raise FileNotFoundError(f"找不到品牌引用 JSON：{mapping_path}")

    with mapping_path.open("r", encoding="utf-8") as file:
        records = json.load(file)
    if not isinstance(records, list):
        raise ValueError("品牌引用 JSON 的最外層必須是陣列")

    replacements = {source.name: destination.name for source, destination in conversions}
    updated = 0
    for record in records:
        if not isinstance(record, dict):
            continue
        old_filename = record.get("filename")
        new_filename = replacements.get(old_filename)
        if not new_filename:
            continue
        record["filename"] = new_filename
        old_path = record.get("path")
        if isinstance(old_path, str):
            record["path"] = str(Path(old_path).with_name(new_filename)).replace("\\", "/")
        updated += 1

    temporary = mapping_path.with_name(f".{mapping_path.name}.tmp")
    try:
        with temporary.open("w", encoding="utf-8", newline="\n") as file:
            json.dump(records, file, ensure_ascii=False, indent=2)
            file.write("\n")
        with temporary.open("r", encoding="utf-8") as file:
            json.load(file)
        temporary.replace(mapping_path)
    except Exception:
        temporary.unlink(missing_ok=True)
        raise
    return updated


def main() -> int:
    args = parse_args()
    directory = args.directory.resolve()

    if not 1 <= args.quality <= 100:
        print("錯誤：--quality 必須介於 1 到 100。", file=sys.stderr)
        return 2
    if not directory.is_dir():
        print(f"錯誤：找不到資料夾：{directory}", file=sys.stderr)
        return 2

    sources = find_sources(directory)
    validate_unique_destinations(sources)
    if not sources:
        print(f"沒有需要轉換的 JPG、JPEG 或 PNG：{directory}")
        return 0

    if args.dry_run:
        for source in sources:
            print(f"[預覽] {source} -> {source.with_suffix('.webp')}")
        print(f"共 {len(sources)} 個檔案。")
        return 0

    failures = 0
    conversions: list[tuple[Path, Path]] = []
    for source in sources:
        try:
            destination = convert_one(source, args.quality)
            conversions.append((source, destination))
            print(f"[完成] {source.name} -> {destination.name}")
        except Exception as error:
            failures += 1
            print(f"[失敗] {source}: {error}", file=sys.stderr)

    succeeded = len(sources) - failures
    if conversions:
        try:
            updated = update_mapping(args.mapping.resolve(), conversions)
            print(f"品牌引用已更新：{updated} 筆（{args.mapping.resolve()}）")
        except Exception as error:
            print(f"品牌引用更新失敗：{error}", file=sys.stderr)
            return 1
    print(f"轉換完成：成功 {succeeded}，失敗 {failures}。")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
