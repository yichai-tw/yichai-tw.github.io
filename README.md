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
│   ├── 📂 components        # 共用組件
│   │   ├── 🌐 header.html    # 共用頁首組件
│   │   └── 🌐 footer.html    # 共用頁尾組件
│   ├── 📂 css               # CSS 樣式檔案
│   │   ├── 🎨 main.css       # 通用自訂樣式
│   │   └── 🎨 stores.css     # 門市資訊頁專用樣式
│   ├── 📂 fonts             # 字體檔案
│   │   ├── 📄 twicon.otf     # TW Icon Fonts 字體
│   │   ├── 🎯 twicon.dart    # TW Icon 字元對照表
│   │   └── 📝 twicon_license.md  # 字體版權資訊
│   ├── 📂 images            # 圖片資源
│   │   ├── 📂 brand_logo     # 品牌 Logo
│   │   ├── 🖼️ 2026_cny_operation_notice.webp
│   │   └── 🖼️ yichai-petshop-logo.png
│   └── 📂 js                # JavaScript 檔案
│       ├── 🟨 load-header.js # 動態載入頁首腳本
│       ├── 🟨 load-footer.js # 動態載入頁尾腳本
│       ├── 🟨 load-news.js   # 最新消息載入腳本
│       └── 🟨 store-locator.js # GPS 門市定位系統
├── 📂 mapping               # 資料對應檔案
│   ├── 📊 PetStores_BranchInfo.csv
│   ├── 📋 PetStores_BranchInfo.json
│   ├── 📋 brand_logos.json
│   └── 🐍 csv_to_json.py
├── 📂 news                  # 最新消息系統
│   ├── 📂 posts             # 公告內容 (Markdown 格式)
│   │   └── 📝 YYYY-MM-DD_*.md
│   └── 📋 news.json         # 消息索引資料 (核心設定)
├── 📂 tools                 # 工具腳本
│   └── 🐍 project_tree_generator.py
├── 🌐 index.html            # 首頁
├── 🌐 news.html             # 最新消息頁
├── 🌐 stores.html           # 門市資訊頁
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

2. 直接在瀏覽器開啟 `index.html` 即可預覽

### 部署到 GitHub Pages

1. 將變更推送到 `main` 分支
2. GitHub Pages 會自動部署
3. 網站將在幾分鐘內更新

## 📝 頁面說明

### 首頁 (index.html)

- 公司介紹與品牌形象
- 服務特色展示
- **GPS 定位門市系統**：自動定位使用者位置，推薦最近的門市並顯示地圖
- 門市資訊預覽（16間門市，顯示「XX市XX區」格式）
- 品牌故事與服務項目
- 使用 Tailwind CSS 框架
- 響應式設計：手機版卡片兩欄顯示，PC 版多欄顯示

### 門市資訊頁 (stores.html)

- 全台 16 間門市完整資訊
- 各門市地址、聯絡電話與 Google 地圖
- 依城市分類（台北市、新北市）
- 使用 TW Icon Fonts 顯示城市圖示
- 地圖延遲載入優化
- 響應式卡片式佈局
- CSS 模組化（使用 `assets/css/stores.css`）

### 最新消息頁 (news.html)

- **部落格卡片式公告系統**：動態載入、分類篩選、置頂功能
- **Markdown 支援**：公告內容使用 `.md` 格式，維護簡易
- **智慧展開邏輯**：支援 URL 錨點自動展開指定消息
- **響應式設計**：手機版自動隱私摘要，點擊展開全文

### 聯絡我們頁 (contact.html)

- 線上諮詢表單（使用 EmailJS 串接 Gmail）
- 完整的表單驗證功能：
  - Email 格式驗證
  - 電話格式驗證
  - 欄位混淆檢查（防止 Email 填到電話欄位，或電話填到 Email 欄位）
  - 必填欄位檢查
  - 聯絡方式二選一驗證（電話或 Email 至少填寫一項）
  - **隱私權政策同意勾選驗證**（必須勾選才能送出表單）
- Email 與 LINE 聯絡方式
- 門市選擇下拉選單（16 間門市）
- 即時錯誤提示與成功訊息

### 隱私權政策頁 (privacy.html)

- 完整的隱私權保護政策說明
- 包含七大章節：
  - 隱私權保護政策的適用範圍
  - 資料的蒐集與使用方式
  - 資料之保護
  - 網站對外的相關連結
  - Cookie 之使用
  - **第三方服務揭露**（EmailJS、LINE 官方帳號、Google Maps）
  - 隱私權保護政策之修正
- 與其他頁面一致的設計風格

### 使用條款頁 (terms.html)

- 完整的網站使用條款說明
- 包含八大章節：
  - 網站使用規範
  - 使用者責任
  - 服務內容與變更
  - 第三方服務
  - 免責聲明
  - 智慧財產權
  - 使用條款之修正
  - 準據法與管轄法院
- 與其他頁面一致的設計風格

## 🛠️ 開發說明

### 最新消息系統維護 (News System)

本站使用 JSON 驅動的部落格公告系統，維護人員只需編輯 `news/` 目錄下的檔案：

#### 1. 新增公告步驟
1.  **撰寫內容**：在 `news/posts/` 下建立 `.md` 檔案（建議命名：`YYYY-MM-DD_標題.md`）。
2.  **更新索引**：編輯 `news/news.json`，在陣列最前方加入新消息物件。

#### 2. `news.json` 參數說明
| 參數 | 說明 | 範例 |
| :--- | :--- | :--- |
| `id` | 唯一識別碼（用於超連結） | `"2026-cny"` |
| `title` | 公告標題 | `"2026 春節營業公告"` |
| `type` | 分類（`operation`, `event`, `system`, `general`） | `"operation"` |
| `date` | 發布日期（YYYY-MM-DD） | `"2026-01-29"` |
| `pinned` | 是否置頂（`true` / `false`） | `true` |
| `excerpt` | 列表顯示的簡短摘要 | `"春節期間營業時間調整..."` |
| `content` | 內容檔案路徑（相對於 news 目錄） | `"posts/2026-01-29_cny.md"` |
| `autoExpand`| 是否預設展開（非必填） | `true` |

*註：`type` 若空白則預設為 `general`（一般公告）。*

#### 3. 分類 (Type) 對照表
- `operation`: 營運公告（藍色）
- `event`: 活動公告（橘黃色）
- `system`: 系統通知（灰色）
- `general`: 一般公告（綠色）

#### 4. 公告超連結 (Deep Linking)
若要從外部（如 LINE、FB）或首頁直接連結到特定公告並**自動展開**，請在網址後加上 `#news-{id}`：
- 範例：`https://yichai-tw.github.io/news.html#news-2026-cny`

#### 5. 展開邏輯優先級
1. 網址帶有 `#news-id` 參數（強制跳轉並展開該則）。
2. 排序後的第一則消息（預設自動展開）。
3. JSON 中的 `autoExpand: true` 設定。

### 內容管理

- **直接編輯**：直接編輯 HTML 檔案（`index.html`、`stores.html`、`contact.html` 等）

### 樣式設計

- **Tailwind CSS**：使用 Tailwind CSS CDN 進行快速開發（首頁使用）
- **自訂樣式**：
  - `assets/css/main.css` - 通用自訂樣式
  - `assets/css/stores.css` - 門市資訊頁專用樣式
- **響應式設計**：支援手機、平板、桌面裝置
- **品牌主色**：`#DF7621`（橙色）
- **TW Icon Fonts**：使用台灣圖示字體（台北市、新北市圖示）

### 導航系統

- **共用頁首組件**：所有頁面統一使用 `assets/components/header.html`
- **桌面版**：水平導航列，顯示所有連結
- **手機版**：緊湊的頁首設計，使用側邊欄選單
  - 漢堡選單按鈕（右上角）
  - 從右側滑出的側邊欄選單
  - 背景遮罩效果
  - 平滑動畫過渡
  - 自動高亮當前頁面連結

### SEO 優化

- 完整的 Meta Tags（description, keywords, author）
- Open Graph 標籤（Facebook、LinkedIn 等）
- Twitter Card 標籤
- Schema.org 結構化資料（JSON-LD）
  - Store / Organization 結構化資料
  - ContactPage 結構化資料
  - PrivacyPolicy 結構化資料
  - TermsOfService 結構化資料
  - **BreadcrumbList 結構化資料**（全站主要頁面）
- 語義化 HTML 標籤
- Canonical URLs
- **Google Search Console**：已通過網域驗證，可監控網站收錄狀態

### 圖片資源

- Logo 位置：`assets/images/yichai-petshop-logo.png`
- 其他圖片請放置在 `assets/images/` 目錄

### 共用組件系統

- **頁首組件**：`assets/components/header.html` - 通用頁首組件（包含導航列與手機版選單）
- **頁尾組件**：`assets/components/footer.html` - 通用頁尾組件（包含快速連結與聯絡資訊）
- **載入腳本**：
  - `assets/js/load-header.js` - 動態載入頁首的 JavaScript（包含手機版選單功能與當前頁面高亮）
  - `assets/js/load-footer.js` - 動態載入頁尾的 JavaScript
- **優勢**：所有頁面統一使用共用頁首與頁尾組件，修改一次即可同步到所有頁面，便於維護和更新

### GPS 門市定位系統

- **定位功能**：使用瀏覽器 Geolocation API 自動獲取使用者位置
- **高精度定位**：優先使用 GPS 衛星定位，精度可達 5–10 公尺
- **分層定位策略**：
  - 第一層：高精度 GPS 定位（15 秒超時）
  - 第二層：低精度網路/WiFi 定位（自動降級，10 秒超時）
  - 第三層：使用 7 天內的緩存位置
- **智能推薦**：使用 Haversine 公式計算距離，自動推薦最近的門市
- **位置緩存**：7 天緩存期限（符合國際標準規範），減少重新授權頻率
- **地圖整合**：最近門市顯示 Google Maps 嵌入地圖
- **距離顯示**：顯示門市與使用者的距離（公里）
- **快速操作**：提供 Google 導航和撥打電話按鈕
- **容錯處理**：定位失敗時顯示所有門市的簡短資訊卡片
- **精度記錄**：記錄定位精度資訊，用於調試 and 優化
- **腳本位置**：`assets/js/store-locator.js`

## 📋 注意事項

### Git 排除規則

以下檔案/目錄不會被追蹤：

- `content/` - 原始資料目錄
- `tools/project_tree_generator.py` - 工具腳本
- `project_structure.txt` - 專案結構檔案
- 所有 `.json` 檔案（除非明確指定）
- 環境變數、機密檔案等

詳細規則請參考 `.gitignore`

### Jekyll 設定

- 專案使用 `.nojekyll` 檔案禁用 Jekyll 處理
- 所有 HTML 檔案直接提供，無需編譯

## 🔗 相關連結

- [GitHub 倉庫](https://github.com/yichai-tw/yichai-tw.github.io)
- [官方網站](https://yichai-tw.github.io/)
- [門市資訊](https://yichai-tw.github.io/stores.html)
- [聯絡我們](https://yichai-tw.github.io/contact.html)
- [隱私權政策](https://yichai-tw.github.io/privacy.html)
- [使用條款](https://yichai-tw.github.io/terms.html)
- [LINE 官方帳號](https://lin.ee/79ysbfnm)

## 📄 授權

Copyright © 1999–2026 宜加寵物生活館. All rights reserved.

---

**最後更新**：2026年1月

## 📌 技術特色

- ✅ 純靜態 HTML，無需後端伺服器
- ✅ Tailwind CSS 響應式設計
- ✅ CSS 模組化設計（樣式檔案分離）
- ✅ 共用組件系統（頁首與頁尾統一管理，動態載入）
- ✅ **GPS 門市定位系統**（高精度定位、分層定位策略、7天緩存、智能推薦、地圖整合）
- ✅ SEO 優化（Meta Tags、Open Graph、結構化資料）
- ✅ 地圖延遲載入優化
- ✅ **EmailJS 表單整合**（串接 Gmail，無需後端伺服器）
- ✅ 完整的表單驗證功能（Email/電話格式驗證、欄位混淆檢查）
- ✅ 16 間門市完整資訊
- ✅ TW Icon Fonts 台灣圖示字體
- ✅ 手機版側邊欄導航選單（自動高亮當前頁面、連結正常導航）
- ✅ 優化的手機版頁首設計（緊湊、不占版面）
- ✅ JavaScript 模組化（共用功能統一管理）
- ✅ 響應式佈局優化（支援 21:9 超寬螢幕，背景全寬延伸）
- ✅ 響應式按鈕設計（手機版文字較小，避免換行）
- ✅ 手機版卡片兩欄布局優化
- ✅ Google Search Console 網域驗證（已通過驗證）
- ✅ Google Fonts Zen Old Mincho 字體（全站統一使用）
- ✅ **Breadcrumb 結構化資料**（BreadcrumbList，符合 Google 官方規範）
- ✅ **隱私權政策頁面**（包含第三方服務揭露說明）
- ✅ **使用條款頁面**（完整的網站使用規範）
- ✅ **LINE 瀏覽器優化**（偵測 LINE 內建瀏覽器，隱藏 Google Maps iframe，顯示提示訊息）
