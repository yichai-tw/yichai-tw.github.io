#!/usr/bin/env python3
"""
建置腳本：將 content/ 目錄下的 Markdown 檔案轉換為 HTML
"""

import os
import sys
from pathlib import Path

def main():
    """主函數"""
    # 專案根目錄
    project_root = Path(__file__).parent.parent
    
    # content 目錄
    content_dir = project_root / "content"
    
    # templates 目錄
    templates_dir = project_root / "templates"
    
    print("建置腳本執行中...")
    print(f"專案根目錄: {project_root}")
    print(f"內容目錄: {content_dir}")
    
    # TODO: 實作 Markdown 轉 HTML 的邏輯
    # TODO: 使用 templates 來生成最終的 HTML 檔案
    
if __name__ == "__main__":
    main()
