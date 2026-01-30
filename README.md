# 宜加寵物生活館 官方網站

宜加寵物生活館的官方網站，提供全台門市資訊、聯絡方式與服務內容。

## 🌐 網站資訊

- **發布平台**：GitHub Pages
- **主站網址**：<https://yichai-tw.github.io/>
- **倉庫地址**：<https://github.com/yichai-tw/yichai-tw.github.io>

## 📁 專案結構

```text
📁 official-site
├── 📂 assets
│   ├── 📂 components        # 共用組件 (頁首、頁尾)
│   │   ├── 🌐 footer.html    # 共用頁尾組件
│   │   └── 🌐 header.html    # 共用頁首組件
│   ├── 📂 css               # CSS 樣式檔案
│   │   ├── 🎨 main.css       # 通用自訂樣式
│   │   └── 🎨 stores.css     # 門市資訊頁專用樣式
│   ├── 📂 fonts             # 字體檔案
│   │   ├── 🎯 twicon.dart    # TW Icon 字元對照表
│   │   ├── 📄 twicon.otf     # TW Icon Fonts 字體
│   │   └── 📝 twicon_license.md  # 字體版權資訊
│   ├── 📂 images            # 圖片資源
│   │   ├── 📂 brand_logo     # 品牌 Logo
│   │   ├── 🖼️ 2026_cny_operation_notice.webp
│   │   └── 🖼️ yichai-petshop-logo.png
│   └── 📂 js                # JavaScript 檔案
│       ├── 🟨 load-footer.js # 動態載入頁尾腳本
│       ├── 🟨 load-header.js # 動態載入頁首腳本 (含導航高亮)
│       ├── 🟨 load-news.js   # 最新消息載入腳本
│       ├── 🟨 store-locator.js # GPS 門市定位系統
│       ├── 🟨 health-calculator.js # 寵物健康計算核心 (含品種邏輯)
│       ├── 🟨 health-report-generator.js # Canvas 報告生成器
│       └── 🟨 health-report-ui.js # 健康報告 UI 控制與表單驗證
├── 📂 mapping               # 資料對應檔案
│   ├── 📊 PetStores_BranchInfo.csv
│   ├── 📋 PetStores_BranchInfo.json
│   ├── 📋 brand_logos.json
│   └── 🐍 csv_to_json.py
├── 📂 data                  # 系統資料庫
│   └── 📋 health-guidelines.json # 健康指引與年齡換算資料庫（物種常見疾病、性別健康關注）
├── 📂 docs                  # 開發文件
│   └── 📖 開發指引文件.md   # 寵物健康小幫手開發指引
├── 📂 news                  # 最新消息系統
│   ├── 📂 posts             # 公告內容 (Markdown 格式)
│   │   └── 📝 YYYY-MM-DD_*.md
│   └── 📋 news.json         # 消息索引資料 (核心設定)
├── 📂 tools                 # 工具腳本
│   └── 🐍 project_tree_generator.py
├── 🌐 index.html            # 首頁
├── 🌐 news.html             # 最新消息頁
├── 🌐 stores.html           # 門市資訊頁
├── 🌐 health-report.html    # 毛孩健康小幫手頁
├── 🌐 contact.html          # 聯絡我們頁
├── 🌐 privacy.html          # 隱私權政策頁
├── 🌐 terms.html            # 使用條款頁
├── 📋 sitemap.xml           # 網站地圖
├── 📄 robots.txt            # 爬蟲規則
└── 📖 README.md             # 專案說明文件
```

## 🚀 快速開始

### 本地開發

1. 複製專案：

   ```bash
   git clone https://github.com/yichai-tw/yichai-tw.github.io.git
   cd yichai-tw.github.io
   ```

2. 直接在瀏覽器開啟 `index.html` 即可預覽。

### 部署到 GitHub Pages

1. 將變更推送到 `main` 分支。
2. GitHub Pages 會自動觸發 GitHub Actions 進行部署。
3. 網站將在幾分鐘內更新完成。

## 📝 頁面說明

### 首頁 (index.html)

- 公司介紹與品牌形象。
- **GPS 定位門市系統**：自動定位使用者位置，推薦最近門市並整合 Google 地圖。
- 門市資訊預覽（16間門市）。
- 品牌合作跑馬燈：動態載入 `brand_logos.json` 展示品牌合作夥伴。
- 響應式設計：支援各種行動裝置與寬螢幕。

### 門市資訊頁 (stores.html)

- 全台 16 間門市完整資訊（地址、電話、營業時間、地圖）。
- 依城市分類（台北市、新北市），並使用 TW Icon Fonts。
- 地圖延遲載入優化，提升首屏載入速度。

### 最新消息頁 (news.html)

- **部落格卡片式公告系統**：動態載入 JSON 消息，支援分類篩選與置頂功能。
- **Markdown 支援**：公告內容維護簡易，具備高度擴充性。
- **智慧導航**：支援網址錨點 (#news-id) 自動跳轉並展開特定公告。

### 毛孩健康小幫手 (health-report.html)

- **趣味小工具**：宜加為寵物飼料用品連鎖專賣，本工具供趣味參考，不能取代專業獸醫；有健康疑慮請諮詢獸醫或儘速就醫。
- **一鍵式健康評估**：30 秒內快速分析毛孩健康數據。
- **精準計算模型**：
  - **人類年齡換算**：依據物種（貓、狗、兔、倉鼠）與體型精確計算。
  - **狗狗體型**：依成犬體型或品種選擇，附常見品種範例（如哈士奇、柴犬、黃金等），幼犬請選長大後的預期體型。
  - **倉鼠品種細分**：支援黃金鼠（金絲熊／熊鼠）、三線鼠、一線鼠、老公公鼠（羅波鼠）等，依壽命特性調整成長曲線。
  - **營養需求計算**：綜合品種、年齡、體重、體型、**性別**計算每日熱量 (kcal)、乾糧 (g) 與飲水 (ml) **區間**。
  - **健康度參考**：依體型與活動量以 **5 級愛心**（♥♡）呈現，並有對應建議與飼主稱讚（3 顆以上稱讚飼主）。
  - **性別與健康狀況**：可選公／母；可多選該物種**常見疾病**（貓/狗/兔/倉鼠各不同清單），影響飲食建議與健康提醒；**性別健康關注**（如公貓泌尿道、母狗子宮蓄膿等）會顯示在健康提醒第一條。
- **靈活輸入設計**：允許直接輸入月份（如 19 個月）；選倉鼠時體重單位預設為公克。
- **Canvas 動態圖卡生成**：使用 Canvas API 繪製 **1080×1440**（直式 3:4）報告圖卡，適合社群分享；健康提醒含性別關注與疾病建議、自動換行；報告內 QR Code 連結至官網首頁。
- **便捷分享與下載**：整合 Web Share API，支援一鍵分享至 LINE/FB 或下載 PNG。

### 聯絡我們頁 (contact.html)

- **EmailJS 整合**：無需後端，直接從前端安全發送郵件至管理後台。
- 嚴謹的表單驗證機制：Email/電話格式檢查、防混淆機制、聯絡資訊二選一。
- 完整隱私權政策同意機制。

## 🛠️ 開發說明

### 技術特色與優化

1. **GitHub Pages 路徑相容性優化**：
   - 實作了動態路徑解析邏輯，自動偵測 GitHub Pages 子目錄環境，解決 JSON 資料在不同網址格式下失效的問題。
2. **靜態資源版本控制**：
   - 關鍵 JavaScript 檔案與 CSS 透過 Query String (如 `?v=20260130`) 進行版本控制，強制清除客戶端快取，確保功能更新即時生效。
3. **防禦性編程**：
   - 核心計算器具備強大的載入重試與 null 檢查機制，在資料異常或網路延遲時能提供友好的錯誤提示。
4. **組件化管理**：
   - 頁首、頁尾完全組件化，透過 `load-header.js` 等腳本動態載入，大幅降低維護成本。

### 內容管理 (最新消息)

1. **新增公告**：在 `news/posts/` 下建立 `.md` 檔案，並在 `news/news.json` 頂部加入索引。
2. **參數說明**：
   - `id`: 唯一識別碼（用於錨點連結）。
   - `pinned`: 設定為 `true` 則該公告將始終位於列表最上方。
   - `type`: 分類標籤 (`operation`, `event`, `system`, `general`)。

## 📋 注意事項

### Git 排除規則

- `tools/project_tree_generator.py`: 工具腳本不納入正式部署。
- **JSON 檔案**：預設皆追蹤，僅排除本機／敏感用途（`*.local.json`、`*.secret.json`、`.env*.json`）。`data/health-guidelines.json` 等系統資料請謹慎修改。

## 🔗 相關連結

- [GitHub 倉庫](https://github.com/yichai-tw/yichai-tw.github.io)
- [官方網站](https://yichai-tw.github.io/)
- [LINE 官方帳號](https://lin.ee/79ysbfnm)

## 📄 授權

Copyright © 1999–2026 宜加寵物生活館. All rights reserved.

---
**最後更新**：2026年1月31日
