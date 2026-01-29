/**
 * 最新消息載入、渲染與篩選系統
 */
(function() {
  // 自動判斷基礎路徑
  const getBasePath = () => {
    return 'news/news.json';
  };

  const NEWS_JSON_PATH = getBasePath();
  const TYPE_LABELS = {
    'operation': '營運公告',
    'event': '活動公告',
    'system': '系統通知',
    'general': '一般公告'
  };

  let allNewsItems = []; // 儲存所有的消息
  let currentFilter = 'all'; // 當前的篩選分類

  async function init() {
    const container = document.getElementById('news-list-container');
    const filterBar = document.getElementById('filter-bar');
    if (!container) return;

    try {
      // 載入資料
      const fetchUrl = `${NEWS_JSON_PATH}?v=${new Date().getTime()}`;
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error(`HTTP 錯誤! 狀態碼: ${response.status}`);
      
      allNewsItems = await response.json();

      // 預設排序
      sortNews(allNewsItems);

      // 渲染初始畫面
      renderNews(allNewsItems);

      // 綁定篩選按鈕事件
      if (filterBar) {
        const filterBtns = filterBar.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
          btn.addEventListener('click', function() {
            const type = this.dataset.type;
            
            // 更新按鈕樣式
            filterBtns.forEach(b => {
              b.classList.remove('bg-[#DF7621]', 'text-white', 'border-[#DF7621]');
              b.classList.add('bg-white', 'text-gray-600', 'border-gray-200');
            });
            this.classList.remove('bg-white', 'text-gray-600', 'border-gray-200');
            this.classList.add('bg-[#DF7621]', 'text-white', 'border-[#DF7621]');

            // 執行篩選
            currentFilter = type;
            const filteredItems = type === 'all' 
              ? allNewsItems 
              : allNewsItems.filter(item => item.type === type);
            
            renderNews(filteredItems);
          });
        });
      }

      // 處理 URL Hash (自動展開)
      handleUrlHash();

    } catch (error) {
      console.error('載入最新消息失敗:', error);
      container.innerHTML = '<div class="text-center py-12 text-red-500">載入失敗，請稍後再試</div>';
    }
  }

  function sortNews(items) {
    items.sort((a, b) => {
      // 1. 置頂優先
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      // 2. 日期新到舊
      return new Date(b.date) - new Date(a.date);
    });
  }

  function renderNews(items) {
    const container = document.getElementById('news-list-container');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = '<div class="text-center py-24 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">目前此分類尚無公告</div>';
      return;
    }

    container.innerHTML = items.map(item => createNewsCard(item)).join('');
    bindToggleEvents();
  }

  function handleUrlHash() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#news-')) {
      const id = hash.replace('#news-', '');
      
      // 如果有 Hash，我們需要確保該消息在目前的篩選分類中
      // 或者乾脆切換回「全部」以確保能看到該消息
      const item = allNewsItems.find(i => i.id === id);
      if (item && currentFilter !== 'all' && item.type !== currentFilter) {
        const allBtn = document.querySelector('.filter-btn[data-type="all"]');
        if (allBtn) allBtn.click();
      }

      const btn = document.querySelector(`.toggle-btn[data-id="${id}"]`);
      if (btn) {
        setTimeout(() => {
          btn.click();
          const card = document.getElementById(`news-${id}`);
          if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }
  }

  function createNewsCard(item) {
    const typeLabel = TYPE_LABELS[item.type] || '公告';
    const pinnedBadge = item.pinned ? `<span class="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded text-xs font-bold mr-2"><i class="fas fa-thumbtack mr-1"></i>置頂</span>` : '';
    
    return `
      <article class="news-card bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8 transition-all hover:shadow-md ${item.pinned ? 'ring-2 ring-[#DF7621] ring-opacity-20' : ''}" id="news-${item.id}">
        <div class="p-6 md:p-8">
          <div class="flex flex-wrap items-center gap-2 mb-4">
            ${pinnedBadge}
            <span class="badge-${item.type} px-2 py-0.5 rounded text-xs font-medium">${typeLabel}</span>
            <time class="text-gray-400 text-sm ml-auto">${item.date}</time>
          </div>
          
          <h3 class="text-xl md:text-2xl font-bold text-gray-800 mb-4">${item.title}</h3>
          
          <div class="excerpt-container">
            <p class="text-gray-600 leading-relaxed excerpt-text">
              ${item.excerpt}
            </p>
          </div>
          
          <div class="full-content hidden mt-6 pt-6 border-t border-gray-100" id="content-${item.id}">
            <div class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DF7621]"></div>
            </div>
          </div>
          
          <div class="mt-6 flex justify-center">
            <button class="toggle-btn flex items-center gap-2 text-[#DF7621] font-bold hover:text-[#C65D1A] transition-colors" data-id="${item.id}" data-content="${item.content}">
              <span>展開閱讀全文</span>
              <i class="fas fa-chevron-down transition-transform duration-300"></i>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function bindToggleEvents() {
    const buttons = document.querySelectorAll('.toggle-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.dataset.id;
        const contentPath = this.dataset.content;
        const contentDiv = document.getElementById(`content-${id}`);
        const icon = this.querySelector('i');
        const textSpan = this.querySelector('span');
        const card = document.getElementById(`news-${id}`);
        const excerptText = card.querySelector('.excerpt-text');

        const isExpanding = contentDiv.classList.contains('hidden');

        if (isExpanding) {
          // --- 手風琴效果 ---
          document.querySelectorAll('.full-content:not(.hidden)').forEach(otherDiv => {
            const otherId = otherDiv.id.replace('content-', '');
            const otherBtn = document.querySelector(`.toggle-btn[data-id="${otherId}"]`);
            const otherCard = document.getElementById(`news-${otherId}`);
            if (otherBtn && otherCard) {
              otherDiv.classList.add('hidden');
              otherBtn.querySelector('i').classList.remove('rotate-180');
              otherBtn.querySelector('span').textContent = '展開閱讀全文';
              otherCard.querySelector('.excerpt-text').classList.remove('opacity-50');
            }
          });

          contentDiv.classList.remove('hidden');
          icon.classList.add('rotate-180');
          textSpan.textContent = '收合內容';
          excerptText.classList.add('opacity-50');

          if (!contentDiv.dataset.loaded) {
            try {
              const res = await fetch(`news/${contentPath}`);
              if (!res.ok) throw new Error('無法載入公告內容');
              const text = await res.text();
              
              if (contentPath.endsWith('.md')) {
                if (window.marked) {
                  contentDiv.innerHTML = `<div class="post-content markdown-body">${marked.parse(text)}</div>`;
                } else {
                  contentDiv.innerHTML = `<div class="post-content"><pre class="whitespace-pre-wrap">${text}</pre></div>`;
                }
              } else {
                contentDiv.innerHTML = text;
              }
              contentDiv.dataset.loaded = "true";
            } catch (error) {
              contentDiv.innerHTML = `<div class="text-red-500 py-4">內容載入失敗</div>`;
            }
          }
          card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          contentDiv.classList.add('hidden');
          icon.classList.remove('rotate-180');
          textSpan.textContent = '展開閱讀全文';
          excerptText.classList.remove('opacity-50');
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
