// 動態載入頁首
(function() {
  function loadHeader() {
    // 取得頁首容器
    const headerContainer = document.getElementById('header-container');
    if (!headerContainer) {
      console.warn('頁首容器未找到');
      return;
    }

    // 載入 header.html
    // 根據當前頁面路徑決定相對路徑
    let headerPath = 'assets/components/header.html';
    const currentPath = window.location.pathname;
    if (currentPath && currentPath !== '/' && currentPath !== '/index.html') {
      // 如果不在根目錄，需要調整路徑
      const depth = currentPath.split('/').filter(p => p && !p.endsWith('.html')).length;
      if (depth > 0) {
        headerPath = '../' + headerPath;
      }
    }
    
    fetch(headerPath)
    .then(response => {
      if (!response.ok) {
        throw new Error('無法載入頁首: HTTP ' + response.status);
      }
      return response.text();
    })
    .then(html => {
      headerContainer.innerHTML = html;
      
      // 初始化手機版選單功能
      initMobileMenu();
      
      // 高亮當前頁面連結
      highlightCurrentPage();
    })
    .catch(error => {
      console.error('載入頁首時發生錯誤:', error);
    });
  }

  // 確保 DOM 載入完成後執行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
  } else {
    loadHeader();
  }
})();

// 初始化手機版選單
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuClose = document.getElementById('mobile-menu-close');
  const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
  const mobileMenuLinks = mobileMenu ? mobileMenu.querySelectorAll('.mobile-menu-link') : [];

  function openMenu(event) {
    if (event) event.preventDefault();
    if (mobileMenu) mobileMenu.classList.remove('translate-x-full');
    if (mobileMenuOverlay) mobileMenuOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu(event) {
    if (event) event.preventDefault();
    if (mobileMenu) mobileMenu.classList.add('translate-x-full');
    if (mobileMenuOverlay) mobileMenuOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', openMenu);
  }
  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', closeMenu);
  }
  if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener('click', closeMenu);
  }

  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', function(event) {
      // 讓連結正常導航，延遲關閉選單以確保導航發生
      setTimeout(closeMenu, 100);
    });
  });
}

// 高亮當前頁面連結
function highlightCurrentPage() {
  // 根據當前頁面檔案名稱判斷
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  let pageName = 'index';
  
  if (currentPage.includes('stores')) {
    pageName = 'stores';
  } else if (currentPage.includes('contact')) {
    pageName = 'contact';
  }
  
  // 高亮桌面版導航連結
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    if (link.dataset.page === pageName) {
      link.classList.add('text-[#DF7621]');
      link.classList.remove('text-gray-800');
    } else {
      link.classList.add('text-gray-800');
      link.classList.remove('text-[#DF7621]');
    }
  });
  
  // 高亮手機版選單連結
  const mobileLinks = document.querySelectorAll('.mobile-menu-link');
  mobileLinks.forEach(link => {
    if (link.dataset.page === pageName) {
      link.classList.add('text-[#DF7621]');
      link.classList.add('font-bold');
    }
  });
}
