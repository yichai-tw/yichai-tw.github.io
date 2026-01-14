// 動態載入頁首
(function() {
  // 取得頁首容器
  const headerContainer = document.getElementById('header-container');
  if (!headerContainer) return;

  // 載入 header.html
  fetch('assets/components/header.html')
    .then(response => {
      if (!response.ok) {
        throw new Error('無法載入頁首');
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
    link.addEventListener('click', closeMenu);
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
