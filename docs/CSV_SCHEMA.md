# Health CSV Schema

這份文件說明 `docs/health_conditions.csv` 與 `docs/health_life_stages.csv` 的欄位與擴充建議，供未來手動或程式化擴充使用。

## health_conditions.csv

- 物種: 字串，常見值例如 `貓咪`, `狗狗`, `兔子`, `倉鼠`。建議統一品種名稱。必填。
- 疾病項目: 字串，疾病或症狀名稱。必填。
- 飲食注意: 文字，建議的飲食或餵食要點。可留空但建議填寫。
- 專家叮嚀: 文字，額外注意事項或就醫建議。可留空但建議填寫。

擴充建議：若要加入分類（例如 `系統: 呼吸 / 消化`）或嚴重度欄位，可新增欄位並將其加入標頭；程式會將額外欄位視為警告但仍會處理。

## health_life_stages.csv

- 物種: 字串，同上，必填。
- 階段: 文字，例如 `幼年期`, `成年期`, `老年期`。必填。
- 對應人類年齡: 字串或範圍，例如 `0-15歲`。可作為說明，用於前端顯示。
- 建議健檢頻率: 文字，例如 `每年健檢一次`。
- 照護重點: 文字，建議的照護重點（可包含多項，以 `|` 或句點分隔）。
- 常見問題: 文字，常見健康問題或警示症狀。

擴充建議：如需多語系（英文等），可在檔案中新增同名語系欄位（例如 `照護重點_en`），或維持單一語系並在 build 時做轉換。

## 驗證與轉換腳本

已提供 `scripts/validate_and_convert_health_csv.py`：

- 會檢查標頭是否缺漏（若有額外欄位會列為警告）
- 檢查前兩個欄位（通常為識別欄位）是否為空
- 產生 `.json` 檔案（同目錄）

用法範例：

將 CSV 轉成 JSON 並輸出到指定資料夾（預設 `data/`）:

```bash
python scripts/validate_and_convert_health_csv.py docs/health_conditions.csv docs/health_life_stages.csv
```

或處理整個資料夾並輸出到 `data/`：

```bash
python scripts/validate_and_convert_health_csv.py docs
```

若要指定不同輸出資料夾：

```bash
python scripts/validate_and_convert_health_csv.py docs --out-dir mapping
```

操作流程建議（雙向同步）

1. 由 JSON 匯出 CSV（開發者編輯 CSV）：

```bash
python scripts/convert_health_data.py --out-dir docs
```

2. 編輯 `docs/*.csv`（`health_conditions.csv` / `health_life_stages.csv` / `hamster_breeds.csv`）

3. 將 CSV 變更回寫入 JSON：

```bash
python scripts/update_health_json.py --docs-dir docs --json data/health-guidelines.json
```

說明：兩支腳本支援自訂輸入/輸出目錄 (`--out-dir` / `--docs-dir`)；`convert_health_data.py` 會輸出 CSV（並與既有 `hamster_breeds.csv` 合併、去重），`update_health_json.py` 會讀取 CSV 並以「疾病名稱」或「品種 key」為主鍵更新 `data/health-guidelines.json`。

在本機執行這些腳本前，請確認已啟用虛擬環境並安裝相依：

```powershell
& .venv\Scripts\Activate.ps1
pip install -r requirements.txt
# 或直接安裝 pandas
pip install pandas
```

