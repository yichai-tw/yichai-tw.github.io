# 宜加寵物用品連鎖 官方網站

宜加寵物用品連鎖的官方網站，提供全台門市資訊、聯絡方式與服務內容。

## 🌐 網站資訊

- **發布平台**：GitHub Pages
- **主站網址**：https://yichai-tw.github.io/
- **倉庫地址**：https://github.com/yichai-tw/yichai-tw.github.io

## 📁 專案結構

```
yichai-tw.github.io/
├─ .gitignore              # Git 排除規則
├─ .nojekyll               # 禁用 Jekyll 處理
├─ index.html              # 首頁
├─ stores.html             # 門市資訊頁
├─ contact.html            # 聯絡我們頁
│
├─ assets/
│  ├─ css/                 # CSS 樣式檔案
│  │  └─ main.css          # 自訂樣式
│  ├─ js/                  # JavaScript 檔案
│  │  └─ load-footer.js    # 動態載入頁尾腳本
│  ├─ components/          # 共用組件
│  │  └─ footer.html       # 共用頁尾組件
│  └─ images/              # 圖片資源
│     └─ yichai-petshop-logo.png
│
├─ content/                # 原始資料目錄（不追蹤）
│  ├─ stores.md
│  └─ about.md
│
├─ mapping/                # 資料對應檔案（不追蹤）
│  └─ PetStores_BranchInfo.json
│
├─ templates/              # HTML 模板
│  ├─ base.html
│  └─ page_layout.html
│
└─ tools/                  # 工具腳本
   ├─ build.py
   └─ project_tree_generator.py
```

## 🚀 快速開始

### 本地開發

1. 克隆專案：
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
- 門市資訊預覽（16間門市）
- 品牌故事與服務項目
- 使用 Tailwind CSS 框架

### 門市資訊頁 (stores.html)
- 全台 16 間門市完整資訊
- 各門市地址、聯絡電話與 Google 地圖
- 依城市分類（台北市、新北市）
- 地圖延遲載入優化
- 響應式卡片式佈局

### 聯絡我們頁 (contact.html)
- 線上諮詢表單
- 表單驗證功能
- Email 與 LINE 聯絡方式
- 門市選擇下拉選單

## 🛠️ 開發說明

### 內容管理

- **原始資料**：編輯 `content/` 目錄下的 Markdown 檔案
- **HTML 生成**：使用 `tools/build.py` 將 Markdown 轉換為 HTML
- **直接編輯**：也可以直接編輯 `index.html` 和 `stores.html`

### 樣式設計

- **Tailwind CSS**：使用 Tailwind CSS CDN 進行快速開發
- **自訂樣式**：`assets/css/main.css` 存放必要的自訂樣式
- **響應式設計**：支援手機、平板、桌面裝置
- **品牌主色**：`#DF7621`（橙色）

### 導航系統

- **桌面版**：水平導航列，顯示所有連結
- **手機版**：緊湊的頁首設計，使用側邊欄選單
  - 漢堡選單按鈕（右上角）
  - 從右側滑出的側邊欄選單
  - 背景遮罩效果
  - 平滑動畫過渡

### SEO 優化

- 完整的 Meta Tags（description, keywords, author）
- Open Graph 標籤（Facebook、LinkedIn 等）
- Twitter Card 標籤
- Schema.org 結構化資料（JSON-LD）
- 語義化 HTML 標籤
- Canonical URLs

### 圖片資源

- Logo 位置：`assets/images/yichai-petshop-logo.png`
- 其他圖片請放置在 `assets/images/` 目錄

### 共用組件

- **頁尾組件**：`assets/components/footer.html` - 可透過 JavaScript 動態載入
- **載入腳本**：`assets/js/load-footer.js` - 動態載入頁尾的 JavaScript
- 目前各頁面仍使用內嵌頁尾，未來可統一使用共用組件

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
- [LINE 官方帳號](https://lin.ee/79ysbfnm)

## 📄 授權

Copyright © 1999–2026 宜加寵物生活館. All rights reserved.

---

**最後更新**：2026年1月13日

## 📌 技術特色

- ✅ 純靜態 HTML，無需後端伺服器
- ✅ Tailwind CSS 響應式設計
- ✅ SEO 優化（Meta Tags、Open Graph、結構化資料）
- ✅ 地圖延遲載入優化
- ✅ 表單驗證與 mailto 功能
- ✅ 16 間門市完整資訊
- ✅ 手機版側邊欄導航選單
- ✅ 優化的手機版頁首設計（緊湊、不占版面）