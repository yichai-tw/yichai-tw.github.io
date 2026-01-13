// 動態載入頁尾
(function() {
  // 取得頁尾容器
  const footerContainer = document.getElementById('footer-container');
  if (!footerContainer) return;

  // 載入 footer.html
  fetch('assets/components/footer.html')
    .then(response => {
      if (!response.ok) {
        throw new Error('無法載入頁尾');
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
})();
