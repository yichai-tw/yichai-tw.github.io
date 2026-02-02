#!/usr/bin/env python3
"""
驗證並將健康相關 CSV 轉成 JSON 的簡易工具。

用法:
  python scripts/validate_and_convert_health_csv.py docs/health_conditions.csv docs/health_life_stages.csv

輸出:
    預設會輸出到 `data/`（或由 `--out-dir` 指定的目錄），產生 per-species JSON（例如 `data/conditions_cat.json`）。

主要功能:
  - 檢查標頭是否符合預期
  - 檢查必要欄位是否為空
  - 將 CSV 轉換為 JSON 陣列
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import List, Tuple, Dict, Any

import re


def slugify(s: str) -> str:
    s = (s or '').strip().lower()
    s = re.sub(r"\s+", "_", s)
    s = re.sub(r"[^a-z0-9_]+", "", s)
    return s or 'unknown'


EXPECTED_SCHEMAS = {
    "health_conditions.csv": ["物種", "疾病項目", "飲食注意", "專家叮嚀"],
    "health_life_stages.csv": [
        "物種",
        "階段",
        "對應人類年齡",
        "建議健檢頻率",
        "照護重點",
        "常見問題",
    ],
}


def validate_and_load(path: Path) -> Tuple[List[Dict[str, Any]], List[str]]:
    errors: List[str] = []
    rows: List[Dict[str, Any]] = []

    if not path.exists():
        errors.append(f"檔案不存在: {path}")
        return rows, errors

    expected = EXPECTED_SCHEMAS.get(path.name)

    with path.open("r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            errors.append(f"無法讀取標頭: {path}")
            return rows, errors

        # 標頭檢查
        fieldnames = [h.strip() for h in reader.fieldnames]
        if expected:
            missing = [h for h in expected if h not in fieldnames]
            extra = [h for h in fieldnames if h not in expected]
            if missing:
                errors.append(f"{path.name} 缺少欄位: {missing}")
            if extra:
                # 只是警告，不當作致命錯誤
                errors.append(f"{path.name} 有額外欄位: {extra}")

        # 逐列檢查必要欄位是否為空
        for i, r in enumerate(reader, start=2):
            clean = {k.strip(): (v.strip() if isinstance(v, str) else v) for k, v in r.items()}
            # 忽略全空列
            if all((v == "" or v is None) for v in clean.values()):
                continue

            # 檢查重要欄位存在且非空（若有 schema，則檢查 schema 中的前兩個欄位）
            if expected:
                for req in expected[:2]:
                    if not clean.get(req):
                        errors.append(f"{path.name} 第{i}列: 欄位 '{req}' 不可為空")

            rows.append(clean)

    return rows, errors


def write_json(path: Path, data: List[Dict[str, Any]]) -> None:
    out = path.with_suffix(".json")
    with out.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main(argv: List[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="驗證並轉換健康 CSV 為 JSON")
    parser.add_argument("files", nargs="+", help="要處理的 CSV 檔案，或目錄（會自動尋找預設檔名）")
    parser.add_argument("--out-dir", "-o", default="data", help="輸出 JSON 的目錄（預設: data）")
    args = parser.parse_args(argv)

    total_errors = 0
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    for p in args.files:
        path = Path(p)
        # 若是目錄，嘗試找預設檔名
        if path.is_dir():
            for name in EXPECTED_SCHEMAS.keys():
                candidate = path / name
                if candidate.exists():
                    rows, errs = validate_and_load(candidate)
                    for e in errs:
                        print("警告:", e)
                    if rows:
                        outpath = out_dir / candidate.name
                        outpath = outpath.with_suffix('.json')
                        write_json(outpath, rows)
                        print(f"已輸出: {outpath}")
                    total_errors += len(errs)
            continue

        rows, errs = validate_and_load(path)
        for e in errs:
            print("警告:", e)
        if rows:
            if path.name == 'health_conditions.csv':
                # 拆分為每個物種的 JSON（嘗試以 data/health-guidelines.json 的 species key 命名）
                hg_path = Path('data/health-guidelines.json')
                name2key = {}
                if hg_path.exists():
                    try:
                        with hg_path.open('r', encoding='utf-8') as f:
                            hg = json.load(f)
                            name2key = {v.get('name'): k for k, v in hg.items() if isinstance(v, dict) and 'name' in v}
                    except Exception:
                        name2key = {}

                # group rows by species name
                groups: Dict[str, List[Dict[str, Any]]] = {}
                for r in rows:
                    sp = (r.get('物種') or '').strip()
                    groups.setdefault(sp or 'unknown', []).append(r)

                # write per-species files
                for sp, items in groups.items():
                    key = name2key.get(sp)
                    fname = f"conditions_{key or slugify(sp)}.json"
                    outpath = out_dir / fname
                    write_json(outpath, items)
                    print(f"已輸出: {outpath}")

                # also write combined file for compatibility
                combined = out_dir / 'conditions_all.json'
                write_json(combined, rows)
                print(f"已輸出: {combined}")
            else:
                outpath = out_dir / path.name
                outpath = outpath.with_suffix('.json')
                write_json(outpath, rows)
                print(f"已輸出: {outpath}")
        total_errors += len(errs)

    if total_errors:
        print(f"處理完成但有 {total_errors} 個警告/錯誤（請檢查輸出訊息）")
        return 2
    print("處理完成，無警告。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
