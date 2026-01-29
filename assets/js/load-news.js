/**
 * 最新消息載入與渲染系統
 */
(function() {
  // 自動判斷基礎路徑，確保在 GitHub Pages 的各種 URL 格式下都能正確找到 news.json
  const getBasePath = () => {
    // 改回簡潔的 news 路徑
    return 'news/news.json';
  };

  const NEWS_JSON_PATH = getBasePath();
  const TYPE_LABELS = {
    'operation': '營運公告',
    'event': '活動公告',
    'system': '系統通知',
    'general': '一般公告'
  };

  async function loadNews() {
    const container = document.getElementById('news-list-container');
    if (!container) return;

    try {
      // 加上時間戳記防止瀏覽器快取舊的 JSON 或是錯誤的 404 紀錄
      const fetchUrl = `${NEWS_JSON_PATH}?v=${new Date().getTime()}`;
      console.log('正在嘗試載入消息資料:', fetchUrl);
      
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`HTTP 錯誤! 狀態碼: ${response.status}`);
      }
      
      let newsItems = await response.json();
      console.log('消息資料載入成功:', newsItems);

      // 排序規則：1. 置頂優先 2. 日期新到舊
      newsItems.sort((a, b) => {
        // 先比置頂狀態 (pinned: true 優先)
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }
        // 同樣置頂或同樣不置頂，則比日期 (新 -> 舊)
        return new Date(b.date) - new Date(a.date);
      });

      if (newsItems.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-gray-500">目前尚無公告</div>';
        return;
      }

      container.innerHTML = newsItems.map(item => createNewsCard(item)).join('');

      // 綁定「顯示全部」按鈕事件
      bindToggleEvents(newsItems);

      // 處理 URL Hash (自動展開)
      handleUrlHash();

    } catch (error) {
      console.error('載入最新消息失敗:', error);
      container.innerHTML = '<div class="text-center py-12 text-red-500">載入失敗，請稍後再試</div>';
    }
  }

  function handleUrlHash() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#news-')) {
      const id = hash.replace('#news-', '');
      const btn = document.querySelector(`.toggle-btn[data-id="${id}"]`);
      if (btn) {
        // 延遲一點點確保渲染完成並觸發點擊
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

  function bindToggleEvents(newsItems) {
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
          // --- 手風琴效果：先收合所有其他的展開項目 ---
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

          // 展開當前
          contentDiv.classList.remove('hidden');
          icon.classList.add('rotate-180');
          textSpan.textContent = '收合內容';
          excerptText.classList.add('opacity-50');

          // 如果還沒載入過，就 fetch 內容
          if (!contentDiv.dataset.loaded) {
            try {
              const res = await fetch(`news/${contentPath}`);
              if (!res.ok) throw new Error('無法載入公告內容');
              const html = await res.text();
              contentDiv.innerHTML = html;
              contentDiv.dataset.loaded = "true";
            } catch (error) {
              contentDiv.innerHTML = `<div class="text-red-500 py-4">內容載入失敗</div>`;
            }
          }
          
          // 捲動到卡片頂部
          card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // 收合
          contentDiv.classList.add('hidden');
          icon.classList.remove('rotate-180');
          textSpan.textContent = '展開閱讀全文';
          excerptText.classList.remove('opacity-50');
          
          // 捲動回卡片
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNews);
  } else {
    loadNews();
  }
})();
