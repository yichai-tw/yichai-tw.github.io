#!/usr/bin/env python3
"""
從 docs/*.csv 更新 data/health-guidelines.json 的腳本。

用法：
  python scripts/update_health_json.py --docs-dir docs --json data/health-guidelines.json

行為：
  - 讀取 docs/health_conditions.csv、docs/health_life_stages.csv、docs/hamster_breeds.csv（若存在）
  - 以 CSV 內容更新 JSON 中對應資料（生命階段、常見疾病、倉鼠品種）
  - 具有去重與合併邏輯（以疾病名稱/品種 key 為主鍵）
"""
from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path
from typing import Dict, Any, List


def slugify(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"\s+", "_", s)
    s = re.sub(r"[^a-z0-9_]+", "", s)
    if not s:
        s = "key"
    return s


def load_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, data: Dict[str, Any]) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def read_csv(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        return [ {k.strip(): (v.strip() if isinstance(v, str) else v) for k, v in row.items()} for row in reader ]


def map_name_to_key(data: Dict[str, Any]) -> Dict[str, str]:
    mapping: Dict[str, str] = {}
    for key, info in data.items():
        if isinstance(info, dict) and 'name' in info:
            mapping[info['name']] = key
    return mapping


def update_life_stages(data: Dict[str, Any], rows: List[Dict[str, str]]) -> int:
    """Update lifeStages in-place. Returns number of updates."""
    name2key = map_name_to_key(data)
    updated = 0
    for r in rows:
        species = r.get('物種')
        stage = r.get('階段')
        if not species or not stage:
            continue
        key = name2key.get(species)
        if not key:
            continue
        human = r.get('對應人類年齡') or ''
        freq = r.get('建議健檢頻率') or ''
        health_tips = [s.strip() for s in (r.get('照護重點') or '').split(' | ') if s.strip()]
        common_issues = [s.strip() for s in (r.get('常見問題') or '').split(' | ') if s.strip()]

        if 'lifeStages' not in data[key]:
            data[key]['lifeStages'] = {}
        data[key]['lifeStages'][stage] = {
            'humanAge': human,
            'checkupFrequency': freq,
            'healthTips': health_tips,
            'commonIssues': common_issues,
        }
        updated += 1
    return updated


def update_conditions(data: Dict[str, Any], rows: List[Dict[str, str]]) -> int:
    """Update commonConditions for each species. Dedupe by label. Returns number of upserts."""
    name2key = map_name_to_key(data)
    changes = 0
    for r in rows:
        species = r.get('物種')
        label = r.get('疾病項目')
        if not species or not label:
            continue
        key = name2key.get(species)
        if not key:
            continue
        dietary = r.get('飲食注意') or ''
        tip = r.get('專家叮嚀') or ''

        if 'commonConditions' not in data[key]:
            data[key]['commonConditions'] = []
        # build index by label
        idx = {c.get('label'): c for c in data[key]['commonConditions']}
        if label in idx:
            # update fields
            obj = idx[label]
            obj['dietaryNote'] = dietary or obj.get('dietaryNote', '')
            obj['tip'] = tip or obj.get('tip', '')
        else:
            data[key]['commonConditions'].append({
                'label': label,
                'dietaryNote': dietary,
                'tip': tip,
            })
        changes += 1
    return changes


def update_hamster_breeds(data: Dict[str, Any], rows: List[Dict[str, str]]) -> int:
    """Update hamster.breeds keyed by '品種key' when possible. Returns number of upserts."""
    if 'hamster' not in data:
        return 0
    breeds = data['hamster'].get('breeds', {})
    # build reverse lookup by label
    label_to_key = {info.get('label'): k for k, info in breeds.items()}
    changes = 0
    next_idx = 1
    for r in rows:
        species = r.get('物種')
        if species != '倉鼠':
            continue
        bkey = (r.get('品種key') or '').strip()
        label = (r.get('品種標籤') or '').strip()
        scientific = (r.get('學名') or '').strip()
        common = (r.get('俗名') or '').strip()
        lifespan = (r.get('預期壽命') or '').strip()

        if not bkey and label:
            bkey = label_to_key.get(label, '')
        if not bkey:
            # generate unique key
            candidate = slugify(label) if label else f'new_breed_{next_idx}'
            if candidate in breeds:
                # append number until unique
                while f"{candidate}_{next_idx}" in breeds:
                    next_idx += 1
                candidate = f"{candidate}_{next_idx}"
            bkey = candidate
            next_idx += 1

        if bkey not in breeds:
            breeds[bkey] = {
                'label': label or bkey,
                'scientific': scientific or '',
                'commonNames': [s.strip() for s in re.split(r"[\/\,、]", common) if s.strip()],
                'lifespanRange': lifespan or '',
            }
        else:
            entry = breeds[bkey]
            if label:
                entry['label'] = label
            if scientific:
                entry['scientific'] = scientific
            if common:
                entry['commonNames'] = [s.strip() for s in re.split(r"[\/\,、]", common) if s.strip()]
            if lifespan:
                entry['lifespanRange'] = lifespan
        changes += 1

    data['hamster']['breeds'] = breeds
    return changes


def main(argv=None):
    parser = argparse.ArgumentParser(description='Update health-guidelines.json from CSVs')
    parser.add_argument('--docs-dir', default='docs', help='CSV source directory (default: docs)')
    parser.add_argument('--json', default='data/health-guidelines.json', help='Target JSON file')
    args = parser.parse_args(argv)

    docs = Path(args.docs_dir)
    js = Path(args.json)
    if not js.exists():
        print(f"[ERROR] JSON not found: {js}")
        return 2

    data = load_json(js)

    cond_rows = read_csv(docs / 'health_conditions.csv')
    stage_rows = read_csv(docs / 'health_life_stages.csv')
    pet_breeds_rows = read_csv(docs / 'pet_breeds.csv')

    c1 = update_life_stages(data, stage_rows)
    c2 = update_conditions(data, cond_rows)
    c3 = update_hamster_breeds(data, pet_breeds_rows)

    write_json(js, data)

    # 寫出分割後的 per-species condition JSON
    # 以 data 中 species keys 為準
    for key in ('cat', 'dog', 'rabbit', 'hamster'):
        out_conditions = data.get(key, {}).get('commonConditions', [])
        out_path = js.parent / f'conditions_{key}.json'
        with out_path.open('w', encoding='utf-8') as f:
            json.dump(out_conditions, f, ensure_ascii=False, indent=2)

    # 將 breeds 依 species 切分輸出為 data/breeds_{key}.json
    # 使用 pet_breeds_rows 作為來源（若有）
    breeds_by_species = {}
    for r in pet_breeds_rows:
        sp = (r.get('物種') or '').strip()
        if not sp:
            continue
        breeds_by_species.setdefault(sp, []).append(r)

    # mapping chinese name -> key for file naming
    name2key = {v.get('name'): k for k, v in data.items() if isinstance(v, dict) and 'name' in v}
    for sp_name, rows in breeds_by_species.items():
        key = name2key.get(sp_name)
        fname = f'breeds_{key or slugify(sp_name)}.json'
        out_path = js.parent / fname
        with out_path.open('w', encoding='utf-8') as f:
            json.dump(rows, f, ensure_ascii=False, indent=2)

    print(f"Updated life stages: {c1}, conditions upserts: {c2}, hamster breeds upserts: {c3}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
