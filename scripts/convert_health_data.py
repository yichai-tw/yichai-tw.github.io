import json
import pandas as pd
import os

# 設定路徑
JSON_PATH = 'data/health-guidelines.json'
OUTPUT_DIR = 'docs'

def convert_health_guidelines():
    if not os.path.exists(JSON_PATH):
        print(f"❌ 找不到檔案: {JSON_PATH}")
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    species_keys = ['cat', 'dog', 'rabbit', 'hamster']
    
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

    # 3. 倉鼠品種資料表 (獨有結構處理)
    hamster_breeds = []
    for bkey, binfo in data['hamster']['breeds'].items():
        hamster_breeds.append({
            '品種標籤': binfo['label'],
            '學名': binfo['scientific'],
            '俗名': " / ".join(binfo['commonNames']),
            '預期壽命': binfo['lifespanRange']
        })
    pd.DataFrame(hamster_breeds).to_csv(f'{OUTPUT_DIR}/hamster_breeds.csv', index=False, encoding='utf-8-sig')

    print(f"✅ 轉換完成！CSV 檔案已儲存至 {OUTPUT_DIR}/ 資料夾。")

if __name__ == "__main__":
    convert_health_guidelines()