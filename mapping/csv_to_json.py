import csv
import json
import os
from datetime import datetime

def csv_to_json(csv_file_path, json_file_path):
    stores = []
    store_index = {}
    
    # 預設 metadata
    metadata = {
        "title": "宜加寵物生活館分店資訊",
        "description": "包含各分店的地址、聯絡方式及GPS座標資訊",
        "version": "1.1",
        "created_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_stores": 0
    }
    
    # 讀取原本的 JSON 以獲取 metadata (如果存在且格式正確)
    if os.path.exists(json_file_path):
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                old_data = json.load(f)
                if 'metadata' in old_data:
                    metadata = old_data['metadata']
                    metadata['created_date'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    metadata['version'] = "1.1" # 更新版本號
        except:
            pass

    # 讀取 CSV
    with open(csv_file_path, mode='r', encoding='utf-8-sig') as csvfile:
        reader = csv.DictReader(csvfile)
        for i, row in enumerate(reader):
            store_name = row['Store Name'].strip()
            if not store_name: continue # 跳過空行
            
            # 處理布林值
            has_grooming = row.get('offers_grooming_service', 'false').lower() == 'true'
            
            # 建立店家資訊結構
            store_data = {
                "store_name": store_name,
                "location": {
                    "city": {
                        "chinese": row['City (CH)'],
                        "english": row['City (EN)']
                    },
                    "district": {
                        "chinese": row['District (CH)'],
                        "english": row['District (EN)']
                    },
                    "address": row['Address'],
                    "full_address": row['Full Address'],
                    "coordinates": {
                        "latitude": float(row['Latitude']) if row['Latitude'] else 0.0,
                        "longitude": float(row['Longitude']) if row['Longitude'] else 0.0
                    }
                },
                "contact": {
                    "supplies_phone": row['Supplies Phone'],
                    "grooming_phone": row['Grooming Phone']
                },
                "services": {
                    "grooming": has_grooming
                },
                "business_hours": {
                    "monday": row['Monday'] or "",
                    "tuesday": row['Tuesday'] or "",
                    "wednesday": row['Wednesday'] or "",
                    "thursday": row['Thursday'] or "",
                    "friday": row['Friday'] or "",
                    "saturday": row['Saturday'] or "",
                    "sunday": row['Sunday'] or ""
                },
                "google_business_url": row.get('google_business_url', '')
            }
            
            # 如果有舊版的次要公司資訊欄位（若 CSV 中還有保留的話）
            if row.get('Secondary Company') or row.get('Tax ID'):
                store_data["secondary_company"] = {
                    "name": row['Secondary Company'],
                    "tax_id": row['Tax ID']
                }
            
            stores.append(store_data)
            
            # 建立索引
            store_index[store_name] = {
                "index": i,
                "city": row['City (CH)'],
                "district": row['District (CH)']
            }

    # 更新總店數
    metadata["total_stores"] = len(stores)

    # 封裝成最終 JSON 格式
    final_data = {
        "metadata": metadata,
        "store_index": store_index,
        "stores": stores
    }

    # 寫入 JSON 檔案
    with open(json_file_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    
    print(f"轉換完成！已更新 {json_file_path}")
    print(f"總計處理 {len(stores)} 間門市。")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, "PetStores_BranchInfo.csv")
    json_path = os.path.join(script_dir, "PetStores_BranchInfo.json")
    
    if os.path.exists(csv_path):
        csv_to_json(csv_path, json_path)
    else:
        print(f"找不到 CSV 檔案：{csv_path}")
