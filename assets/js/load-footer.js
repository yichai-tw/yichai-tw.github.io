// 動態載入頁尾
(function() {
  function loadFooter() {
    // 取得頁尾容器
    const footerContainer = document.getElementById('footer-container');
    if (!footerContainer) {
      console.warn('頁尾容器未找到');
      return;
    }

    // 載入 footer.html
    // 使用相對於根目錄的路徑（以 / 開頭），確保在所有頁面都能正確載入
    const footerPath = '/assets/components/footer.html';
    
    fetch(footerPath)
    .then(response => {
      if (!response.ok) {
        throw new Error('無法載入頁尾: HTTP ' + response.status);
      }
      return response.text();
    })
    .then(html => {
      footerContainer.innerHTML = html;
    })
    .catch(error => {
      console.error('載入頁尾時發生錯誤:', error);
      // 如果載入失敗，顯示預設頁尾
      footerContainer.innerHTML = `
        <div style="background: #2c3e50; color: white; padding: 40px 20px; text-align: center;">
          <p>Copyright © 1999–2026 宜加寵物生活館. All rights reserved.</p>
        </div>
      `;
    });
  }

  // 確保 DOM 載入完成後執行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFooter);
  } else {
    loadFooter();
  }
})();
