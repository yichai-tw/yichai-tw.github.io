import json
import pandas as pd
import os
from pathlib import Path

# 設定路徑（JSON 固定在 data）
JSON_PATH = 'data/health-guidelines.json'
# 輸出目錄預設為 docs，可由 CLI --out-dir 覆寫
# 預設不綁定單一 hamster CSV 路徑，統一輸出為 `pet_breeds.csv`
CSV_HAMSTER_BREEDS = None
OUTPUT_DIR = 'docs'

# 匯入時若 CSV 無「品種key」欄位，才用此對照表（向後相容）
HAMSTER_LABEL_TO_KEY = {
    '黃金鼠': 'syrian',
    '三線鼠/冬白': 'winter_white',
    '一線鼠': 'campbell',
    '老公公鼠': 'roborovski',
}


def convert_health_guidelines():
    if not os.path.exists(JSON_PATH):
        print(f"[ERROR] 找不到檔案: {JSON_PATH}")
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    # 物種清單（用於拆分與 CSV 輸出）
    species_keys = ['cat', 'dog', 'rabbit', 'hamster']

    # 立即拆分成每個物種的完整 guidelines JSON（便於小工具分別載入）
    try:
        data_dir = Path('data')
        data_dir.mkdir(parents=True, exist_ok=True)
        for skey in species_keys:
            if skey in data:
                outfile = data_dir / f'guidelines_{skey}.json'
                with outfile.open('w', encoding='utf-8') as of:
                    json.dump(data[skey], of, ensure_ascii=False, indent=2)

        # 產生 breeds_lifespans.json：優先使用 docs/pet_breeds.csv，若不存在則嘗試從 JSON 中取出 hamster 品種壽命
        lifespans = {}
        pet_breeds_csv = f"{OUTPUT_DIR}/pet_breeds.csv"
        if os.path.exists(pet_breeds_csv):
            try:
                pb_df = pd.read_csv(pet_breeds_csv, encoding='utf-8-sig')
                if '物種' in pb_df.columns and '品種標籤' in pb_df.columns and '預期壽命' in pb_df.columns:
                    for _, row in pb_df.iterrows():
                        sp = row.get('物種')
                        label = row.get('品種標籤')
                        lifespan = row.get('預期壽命')
                        if pd.isna(sp) or pd.isna(label):
                            continue
                        lifespans.setdefault(sp, []).append({'breed': label, 'lifespan': lifespan})
            except Exception:
                pass
        else:
            # fallback: use data['hamster']['breeds'] if present
            if 'hamster' in data and isinstance(data['hamster'].get('breeds'), dict):
                lifespans['倉鼠'] = []
                for bkey, binfo in data['hamster']['breeds'].items():
                    lifespans['倉鼠'].append({'breed': binfo.get('label', bkey), 'lifespan': binfo.get('lifespanRange', '')})

        with (data_dir / 'temp_breeds_lifespans.json').open('w', encoding='utf-8') as f:
            json.dump(lifespans, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

    # species_keys 在上面已定義
    
    # 1. 生命階段建議表 (Life Stages)
    stages_data = []
    for skey in species_keys:
        name = data[skey]['name']
        for stage, info in data[skey]['lifeStages'].items():
            stages_data.append({
                '物種': name,
                '階段': stage,
                '對應人類年齡': info.get('humanAge'),
                '建議健檢頻率': info.get('checkupFrequency'),
                '照護重點': " | ".join(info.get('healthTips', [])),
                '常見問題': " | ".join(info.get('commonIssues', []))
            })
    pd.DataFrame(stages_data).to_csv(f'{OUTPUT_DIR}/health_life_stages.csv', index=False, encoding='utf-8-sig')

    # 2. 常見疾病與飲食建議表 (Conditions)
    conditions_data = []
    for skey in species_keys:
        name = data[skey]['name']
        for cond in data[skey].get('commonConditions', []):
            conditions_data.append({
                '物種': name,
                '疾病項目': cond['label'],
                '飲食注意': cond['dietaryNote'],
                '專家叮嚀': cond['tip']
            })
    pd.DataFrame(conditions_data).to_csv(f'{OUTPUT_DIR}/health_conditions.csv', index=False, encoding='utf-8-sig')

    # 3. 倉鼠品種資料表：與既有 CSV 對齊，匯出時帶「品種key」供網站與匯入對齊用（不依硬編碼）
    #     CSV 內「物種≠倉鼠」的列（犬/貓/兔）僅合併保留、不從 JSON 匯出（JSON 目前只有 hamster.breeds；
    #     dog 為 sizeCategories 體型，cat/rabbit 無品種結構）。若未來 JSON 新增 dog/cat/rabbit 的 breeds 再擴充匯出/匯入。
    # build pet breeds rows from hamster JSON breeds
    hamster_rows = []
    for bkey, binfo in data['hamster']['breeds'].items():
        hamster_rows.append({
            '物種': '倉鼠',
            '品種key': bkey,
            '品種標籤': binfo['label'],
            '學名': binfo['scientific'],
            '俗名': " / ".join(binfo['commonNames']),
            '預期壽命': binfo['lifespanRange']
        })
    hamster_df = pd.DataFrame(hamster_rows)

    # Merge with existing pet_breeds CSV if present (preserve non-hamster rows)
    existing = None
    # prefer an explicitly configured CSV_HAMSTER_BREEDS, otherwise check for OUTPUT_DIR/pet_breeds.csv
    if CSV_HAMSTER_BREEDS and os.path.exists(CSV_HAMSTER_BREEDS):
        existing = pd.read_csv(CSV_HAMSTER_BREEDS, encoding='utf-8-sig')
    elif os.path.exists(f"{OUTPUT_DIR}/pet_breeds.csv"):
        existing = pd.read_csv(f"{OUTPUT_DIR}/pet_breeds.csv", encoding='utf-8-sig')

    if existing is not None and '物種' in existing.columns:
        # keep non-hamster rows from existing
        other = existing[existing['物種'] != '倉鼠'].copy()
        if '品種key' not in other.columns:
            other['品種key'] = ''
        out_df = pd.concat([hamster_df, other], ignore_index=True)
        out_df = out_df.drop_duplicates(subset=['物種', '品種標籤'], keep='first')
    else:
        out_df = hamster_df

    # 統一輸出為 OUTPUT_DIR/pet_breeds.csv（包含倉鼠與非倉鼠列）
    target_pet = f"{OUTPUT_DIR}/pet_breeds.csv"
    out_df.to_csv(target_pet, index=False, encoding='utf-8-sig')

    print(f"[OK] 轉換完成！CSV 檔案已儲存至 {OUTPUT_DIR}/ 資料夾。")

    # 同時輸出 per-species JSON 到 data/，方便小工具直接讀取
    try:
        data_dir = Path('data')
        data_dir.mkdir(parents=True, exist_ok=True)

        # 依物種拆分 conditions
        cond_groups = {}
        for row in conditions_data:
            sp = row.get('物種') or 'unknown'
            cond_groups.setdefault(sp, []).append(row)

        # 以 data/health-guidelines.json 的 species keys 為命名（若存在）
        name2key = {}
        if os.path.exists(JSON_PATH):
            try:
                with open(JSON_PATH, 'r', encoding='utf-8') as f:
                    hg = json.load(f)
                    name2key = {v.get('name'): k for k, v in hg.items() if isinstance(v, dict) and 'name' in v}
            except Exception:
                name2key = {}

        for sp, items in cond_groups.items():
            key = name2key.get(sp)
            fname = f'temp_conditions_{key or sp.replace(" ", "_")}.json'
            with (data_dir / fname).open('w', encoding='utf-8') as f:
                json.dump(items, f, ensure_ascii=False, indent=2)

        # overall combined conditions
        with (data_dir / 'temp_conditions_all.json').open('w', encoding='utf-8') as f:
            json.dump(conditions_data, f, ensure_ascii=False, indent=2)

        # 輸出 breeds：使用 out_df（最終 CSV）按物種拆分
        try:
            records = out_df.to_dict(orient='records')
            breeds_by_species = {}
            for b in records:
                sp = (b.get('物種') or 'unknown')
                breeds_by_species.setdefault(sp, []).append(b)
            for sp, rows in breeds_by_species.items():
                key = name2key.get(sp)
                fname = f'temp_breeds_{key or sp.replace(" ", "_")}.json'
                with (data_dir / fname).open('w', encoding='utf-8') as f:
                    json.dump(rows, f, ensure_ascii=False, indent=2)
        except Exception:
            pass
    except Exception:
        # 不影響主流程，僅在產生 JSON 時忽略錯誤
        pass


def update_health_guidelines_from_hamster_csv():
    """從 docs/hamster_breeds.csv 讀取「物種=倉鼠」的列，更新 data/health-guidelines.json 的 hamster.breeds。"""
    target_hamster = CSV_HAMSTER_BREEDS or f"{OUTPUT_DIR}/hamster_breeds.csv"
    if not os.path.exists(target_hamster):
        print(f"[ERROR] 找不到檔案: {target_hamster}")
        return
    if not os.path.exists(JSON_PATH):
        print(f"[ERROR] 找不到檔案: {JSON_PATH}")
        return

    df = pd.read_csv(target_hamster, encoding='utf-8-sig')
    if '物種' not in df.columns:
        print("[ERROR] CSV 缺少「物種」欄位，無法對齊。")
        return
    hamster_rows = df[df['物種'] == '倉鼠']

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for _, row in hamster_rows.iterrows():
        # 優先以 CSV 的「品種key」對齊 JSON，無欄位或空值時才用品種標籤對照表（向後相容）
        bkey = (row.get('品種key') or '').strip() if '品種key' in row else ''
        if not bkey:
            label = row.get('品種標籤', '').strip()
            bkey = HAMSTER_LABEL_TO_KEY.get(label)
        if not bkey:
            print(f"[WARN] 略過無法對應的倉鼠列（需有品種key或品種標籤）: {row.get('品種標籤', '')}")
            continue
        if bkey not in data['hamster']['breeds']:
            print(f"[WARN] JSON 中無此 key: {bkey}")
            continue
        # 俗名：支援 " / " 或 "、" 分隔，轉成 list
        common_str = row.get('俗名', '') or ''
        common_names = [s.strip() for s in common_str.replace('、', ' / ').split(' / ') if s.strip()]
        data['hamster']['breeds'][bkey]['label'] = row.get('品種標籤', data['hamster']['breeds'][bkey]['label'])
        data['hamster']['breeds'][bkey]['scientific'] = row.get('學名', data['hamster']['breeds'][bkey]['scientific'])
        data['hamster']['breeds'][bkey]['commonNames'] = common_names if common_names else data['hamster']['breeds'][bkey]['commonNames']
        data['hamster']['breeds'][bkey]['lifespanRange'] = row.get('預期壽命', data['hamster']['breeds'][bkey]['lifespanRange'])

    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"[OK] 已從 {target_hamster} 更新 {JSON_PATH} 的倉鼠品種資料。")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='健康指引 JSON ↔ CSV 轉換')
    parser.add_argument('--import-csv', action='store_true', help='從 hamster_breeds.csv 匯入並更新 JSON 倉鼠品種')
    parser.add_argument('--out-dir', default='docs', help='輸出 CSV 的目錄（預設: docs）')
    args = parser.parse_args()

    # 設定輸出路徑全域變數，讓舊有函式沿用變數名稱
    globals()['OUTPUT_DIR'] = args.out_dir
    globals()['CSV_HAMSTER_BREEDS'] = f"{args.out_dir}/hamster_breeds.csv"

    # 建立目錄
    os.makedirs(args.out_dir, exist_ok=True)

    if args.import_csv:
        update_health_guidelines_from_hamster_csv()
    else:
        convert_health_guidelines()