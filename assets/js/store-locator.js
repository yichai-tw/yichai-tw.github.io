// 門市定位與清單系統
(function() {
  function isLineBrowser() {
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    return /Line/i.test(ua) || /Naver/i.test(ua) || /LINE/i.test(ua);
  }

  function normalizeStoreName(name) {
    return (name || '').replace(/店$/, '').trim();
  }

  function getTodayKey(date) {
    return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
  }

  function resolveTodayHours(weeklyHours, now) {
    if (!weeklyHours) return null;
    const todayKey = getTodayKey(now);
    const todayHours = weeklyHours[todayKey];
    if (!todayHours) return null;

    if (todayHours.toUpperCase() === 'OFF') {
      return { isClosedAllDay: true, rawText: todayHours };
    }

    const [open, close] = todayHours.split('-');
    if (!open || !close) return null;

    return { open, close, rawText: todayHours };
  }

  function parseTimeToDate(baseDate, timeText) {
    const [hours, minutes] = timeText.split(':').map(Number);
    const target = new Date(baseDate);
    target.setHours(hours, minutes, 0, 0);
    return target;
  }

  function getStatus(hours, now) {
    if (!hours) return null;
    if (hours.isClosedAllDay) {
      return { text: '● 今日休息', className: 'status-closed' };
    }

    const openAt = parseTimeToDate(now, hours.open);
    const closeAt = parseTimeToDate(now, hours.close);
    const diff = closeAt - now;

    if (now < openAt) {
      const untilOpen = openAt - now;
      if (untilOpen <= 30 * 60 * 1000) {
        return { text: `● 即將營業 · ${hours.open} 開門`, className: 'status-upcoming' };
      }
      return { text: `● 尚未營業 · ${hours.open} 開門`, className: 'status-upcoming' };
    }
    if (diff <= 0) {
      return { text: `● 已打烊 · ${hours.close} 關門`, className: 'status-closed' };
    }
    if (diff <= 30 * 60 * 1000) {
      return { text: `● 即將打烊 · ${hours.close} 關門`, className: 'status-closing' };
    }
    return { text: `● 營業中 · ${hours.close} 關店`, className: 'status-open' };
  }

  function buildWeeklyHoursList(weeklyHours) {
    const order = [
      { key: 'monday', label: '週一' },
      { key: 'tuesday', label: '週二' },
      { key: 'wednesday', label: '週三' },
      { key: 'thursday', label: '週四' },
      { key: 'friday', label: '週五' },
      { key: 'saturday', label: '週六' },
      { key: 'sunday', label: '週日' }
    ];

    return order
      .map(({ key, label }) => {
        const value = weeklyHours?.[key];
        if (!value) return null;
        const display = value.toUpperCase() === 'OFF' ? '休息' : value;
        return `<li><span class="store-hours-day">${label}</span><span class="store-hours-slot">${display}</span></li>`;
      })
      .filter(Boolean)
      .join('');
  }

  function buildWeeklyHoursDetails(weeklyHours) {
    const list = buildWeeklyHoursList(weeklyHours);
    if (!list) return '';

    return `
      <details class="store-hours-details">
        <summary>本週完整時間</summary>
        <ul class="store-hours-week">
          ${list}
        </ul>
      </details>
    `;
  }

  async function loadStoreData() {
    const response = await fetch('mapping/PetStores_BranchInfo.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Failed to load store data');
    }

    const data = await response.json();
    const now = new Date();

    return (data.stores || []).map(store => {
      const city = store.location?.city?.chinese || '';
      const district = store.location?.district?.chinese || '';
      const fullAddress = store.location?.full_address || `${city}${district}${store.location?.address || ''}`;
      const coordinates = store.location?.coordinates || {};
      const lat = coordinates.latitude;
      const lng = coordinates.longitude;
      const phone = store.contact?.supplies_phone || '';
      const phoneDigits = phone.replace(/[^\d]/g, '');
      const weeklyHours = store.business_hours || null;
      const hours = resolveTodayHours(weeklyHours, now);

      // 檢查是否有寵物美容服務（預設為 true，除非明確標記為 false）
      const hasGrooming = store.services?.grooming !== false;
      const status = getStatus(hours, now);
      // 判斷是否營業中（status-open 表示正在營業）
      const isOpen = status && (status.className === 'status-open' || status.className === 'status-closing');

      return {
        id: normalizeStoreName(store.store_name),
        name: `${store.store_name}店`,
        city,
        district,
        address: fullAddress,
        lat,
        lng,
        phone,
        phoneDigits,
        weeklyHours,
        hours,
        hasGrooming,
        isOpen,
        mapUrl: fullAddress
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
          : `https://www.google.com/maps?q=${lat},${lng}`,
        mapEmbedUrl: (lat && lng)
          ? `https://www.google.com/maps?q=${lat},${lng}&hl=zh-TW&z=15&output=embed`
          : `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&hl=zh-TW&z=15&output=embed`
      };
    });
  }

  function buildStoreCard(store, isCompact, isSelected) {
    const status = getStatus(store.hours, new Date());
    const statusText = status ? `<div class="store-list-status ${status.className}">${status.text}</div>` : '';
    const phoneLink = store.phoneDigits ? `tel:${store.phoneDigits}` : '';
    const mapLink = store.mapUrl || '';
    
    // PC版：hover 工具提示顯示完整營業時間
    const hoursTooltip = store.weeklyHours ? buildWeeklyHoursTooltip(store.weeklyHours) : '';
    
    // 手機版：Accordion 展開詳情（只在非選中時顯示，選中時顯示按鈕）
    const mobileDetails = (isCompact || isSelected) ? '' : buildMobileStoreDetails(store.weeklyHours);
    
    // 操作按鈕：只在選中的門市或手機版預覽時顯示
    const actions = (isSelected || isCompact) ? `
      <div class="store-list-actions">
        ${phoneLink ? `<a href="${phoneLink}" class="btn-phone"><i class="fas fa-phone-alt"></i> 撥打電話</a>` : ''}
        ${mapLink ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="btn-map"><i class="fas fa-map-marker-alt"></i> Google 導航</a>` : ''}
      </div>
    ` : '';

    return `
      <div class="store-list-item" data-store-id="${store.id}">
        <div class="store-list-title">${store.name}</div>
        <div class="store-list-address">${store.address}</div>
        ${statusText}
        ${hoursTooltip}
        ${actions}
        ${mobileDetails}
      </div>
    `;
  }

  function buildWeeklyHoursTooltip(weeklyHours) {
    if (!weeklyHours) return '';
    
    const list = buildWeeklyHoursList(weeklyHours);
    if (!list) return '';
    
    const todayKey = getTodayKey(new Date());
    const todayHours = weeklyHours[todayKey];
    const todayDisplay = todayHours && todayHours.toUpperCase() !== 'OFF' ? todayHours : '今日休息';
    
    return `
      <div class="store-hours-preview">
        <span class="store-hours-preview-text">營業時間：${todayDisplay}</span>
        <div class="store-hours-tooltip">
          <ul class="store-hours-week">
            ${list}
          </ul>
        </div>
      </div>
    `;
  }

  function buildMobileStoreDetails(weeklyHours) {
    if (!weeklyHours) return '';
    
    // 手機版：直接顯示完整營業時間列表，不需要再點開
    const hoursList = buildWeeklyHoursList(weeklyHours);
    if (!hoursList) return '';
    
    return `
      <details class="store-details-accordion">
        <summary>查看完整營業時間</summary>
        <div class="store-details-content">
          <ul class="store-hours-week-mobile">
            ${hoursList}
          </ul>
        </div>
      </details>
    `;
  }

  function updateMapFrame(store) {
    const mapFrame = document.getElementById('store-map-frame');
    if (!mapFrame) return;
    
    if (store?.mapEmbedUrl) {
      mapFrame.src = store.mapEmbedUrl;
    } else {
      // 如果沒有選中門市，清空地圖
      mapFrame.src = '';
    }
  }

  function calculateDistance(lat1, lng1, lat2, lng2) {
    if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
    const R = 6371; // 地球半徑（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function findNearestStore(stores, lat, lng) {
    if (!stores.length) return null;
    let nearest = null;
    let minDistance = Infinity;

    stores.forEach(store => {
      if (!store.lat || !store.lng) return;
      const distance = calculateDistance(lat, lng, store.lat, store.lng);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = store;
      }
    });

    return nearest || stores[0];
  }

  function sortStoresByDistance(stores, userLat, userLng) {
    if (!stores.length) return stores;

    // 如果有用戶位置，按距離排序
    if (userLat && userLng) {
      return stores.map(store => ({
        ...store,
        distance: calculateDistance(userLat, userLng, store.lat, store.lng)
      })).sort((a, b) => {
        // 先按距離排序
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        // 距離相同時，按城市排序（台北市 > 新北市）
        return sortByCity(a, b);
      });
    }

    // 如果沒有用戶位置，只按城市排序（台北市 > 新北市）
    return [...stores].sort(sortByCity);
  }

  function sortByCity(a, b) {
    const cityOrder = { '台北市': 1, '新北市': 2 };
    const orderA = cityOrder[a.city] || 999;
    const orderB = cityOrder[b.city] || 999;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // 同城市時，按店名排序
    return a.name.localeCompare(b.name, 'zh-TW');
  }

  function initPanelInteractions(panel) {
    if (!panel) return;
    const handle = panel.querySelector('.store-panel-handle');
    const toggleButtonPC = panel.querySelector('.store-panel-toggle-btn');
    const mapLayer = document.querySelector('.store-map-layer');

    // 行動版點擊展開/收合邏輯
    if (handle) {
      const minHeight = 160; // 初始收合高度
      const expandedHeight = Math.round(window.innerHeight * 0.5); // 展開高度限制為 50vh

      function togglePanel() {
        const isCollapsed = panel.classList.contains('is-collapsed');
        if (isCollapsed) {
          panel.classList.remove('is-collapsed');
          panel.classList.add('is-expanded');
          panel.style.setProperty('--panel-height', `${expandedHeight}px`);
        } else {
          panel.classList.remove('is-expanded');
          panel.classList.add('is-collapsed');
          panel.style.setProperty('--panel-height', `${minHeight}px`);
        }
      }

      handle.addEventListener('click', togglePanel);

      // 初始設定為收合狀態
      panel.classList.add('is-collapsed');
      panel.style.setProperty('--panel-height', `${minHeight}px`);
    }

    // PC版切換按鈕邏輯
    if (toggleButtonPC && window.innerWidth >= 1024) {
      toggleButtonPC.addEventListener('click', () => {
        panel.classList.toggle('is-collapsed-pc');
        if (mapLayer) {
          mapLayer.classList.toggle('map-expanded');
        }
      });

      // 初始狀態檢查：根據是否有 is-collapsed-pc 類別設定地圖層級
      if (panel.classList.contains('is-collapsed-pc') && mapLayer) {
        mapLayer.classList.add('map-expanded');
      } else if (mapLayer) {
        mapLayer.classList.remove('map-expanded');
      }
    }

    // 監聽視窗大小變化，處理 PC 和手機模式切換
    window.addEventListener('resize', () => {
      if (window.innerWidth < 1024) {
        // 切換到手機模式，移除 PC 相關類別
        panel.classList.remove('is-collapsed-pc');
        if (mapLayer) {
          mapLayer.classList.remove('map-expanded');
        }
        // 確保行動版面板狀態正確
        if (!panel.classList.contains('is-expanded') && !panel.classList.contains('is-collapsed')) {
          panel.classList.add('is-collapsed');
          panel.style.setProperty('--panel-height', `160px`);
        }
      } else {
        // 切換到 PC 模式，確保沒有行動版相關類別
        panel.classList.remove('is-collapsed');
        panel.classList.remove('is-expanded');
        panel.style.setProperty('--panel-height', 'auto'); // PC 模式下高度由 CSS 控制
        // 根據初始狀態或上次的 PC 狀態設定地圖層級
        if (panel.classList.contains('is-collapsed-pc') && mapLayer) {
          mapLayer.classList.add('map-expanded');
        } else if (mapLayer) {
          mapLayer.classList.remove('map-expanded');
        }
      }
    });
  }

  function showLoading() {
    const list = document.getElementById('store-list');
    const preview = document.getElementById('store-preview');
    
    if (list) {
      list.innerHTML = `
        <div class="store-list-loading">
          <i class="fas fa-spinner fa-spin" style="font-size: 2em; color: #DF7621; margin-bottom: 12px;"></i>
          <p>載入門市資料中...</p>
        </div>
      `;
    }
    
    if (preview) {
      preview.innerHTML = `
        <div class="store-list-loading">
          <i class="fas fa-spinner fa-spin" style="font-size: 1.5em; color: #DF7621;"></i>
        </div>
      `;
    }
  }

  function renderStoresPage(stores, userLat, userLng) {
    const panel = document.getElementById('store-panel');
    const list = document.getElementById('store-list');
    const preview = document.getElementById('store-preview');

    if (!panel || !list || !preview) return false;

    // 按距離或城市排序
    const ordered = sortStoresByDistance(stores, userLat, userLng);

    // 自動選中第一筆（按 GPS 距離或城市排序後的第一筆）
    let currentStore = ordered[0] || null;
    
    // 保存用戶位置，供篩選時使用
    const savedUserLat = userLat;
    const savedUserLng = userLng;

    function updateStoreList(storesToShow) {
      // 如果當前選中的門市不在篩選結果中，選中第一筆
      if (currentStore && !storesToShow.find(s => s.id === currentStore.id)) {
        currentStore = storesToShow[0] || null;
      }
      // 如果沒有選中的門市，自動選中第一筆
      else if (!currentStore && storesToShow.length > 0) {
        currentStore = storesToShow[0];
      }
      
      // 手機版預覽：只在手機版顯示選中的門市（帶按鈕）
      // PC版不需要預覽區域，選中的門市在列表中顯示
      if (preview) {
        if (window.innerWidth < 1024 && currentStore) {
          preview.innerHTML = buildStoreCard(currentStore, true, true);
        } else {
          preview.innerHTML = '';
        }
      }
      
      // 列表：所有門市都顯示，但只有選中的才顯示按鈕
      // PC版和手機版都統一處理，避免重複顯示
      list.innerHTML = storesToShow.map(store => {
        const isSelected = currentStore && store.id === currentStore.id;
        return buildStoreCard(store, false, isSelected);
      }).join('');
      
      // 高亮選中的門市
      if (currentStore) {
        const activeItem = list.querySelector(`[data-store-id="${currentStore.id}"]`);
        if (activeItem) {
          activeItem.classList.add('active');
        }
      }
      
      // 重新綁定點擊事件
      bindStoreItemEvents(storesToShow);
    }

    function bindStoreItemEvents(storesToShow) {
      const items = list.querySelectorAll('.store-list-item');
      items.forEach(item => {
        item.addEventListener('click', event => {
          // 防止點擊詳情按鈕時觸發
          if (event.target.closest('a') || event.target.closest('details')) {
            return;
          }
          
          const storeId = item.dataset.storeId;
          const selected = storesToShow.find(store => store.id === storeId);
          if (selected) {
            // 更新選中的門市
            currentStore = selected;
            updateMapFrame(selected);
            
            // 更新手機版預覽（帶按鈕），PC版不需要
            if (preview && window.innerWidth < 1024) {
              preview.innerHTML = buildStoreCard(selected, true, true);
            }
            
            // 重新渲染列表，只有選中的門市才顯示按鈕
            list.innerHTML = storesToShow.map(store => {
              const isSelected = store.id === selected.id;
              return buildStoreCard(store, false, isSelected);
            }).join('');
            
            // 重新綁定事件並高亮選中的門市
            bindStoreItemEvents(storesToShow);
            const activeItem = list.querySelector(`[data-store-id="${selected.id}"]`);
            if (activeItem) {
              activeItem.classList.add('active');
            }
            
            // 手機版：點擊後展開面板（但限制高度，確保地圖可見）
            if (window.innerWidth < 1024) {
              if (panel.classList.contains('is-collapsed')) {
                panel.classList.remove('is-collapsed');
                panel.classList.add('is-expanded');
                // 限制最大高度為 50vh，確保地圖至少有 50% 可見
                const maxHeight = Math.round(window.innerHeight * 0.5);
                panel.style.setProperty('--panel-height', `${maxHeight}px`);
              }
              // 手機版才滾動到可見區域
              setTimeout(() => {
                if (activeItem) {
                  activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
              }, 100);
            }
            // PC 端不自動滾動，讓用戶自由滾動
          }
        });
      });
    }

    updateStoreList(ordered);
    // 自動顯示第一筆門市的地圖
    if (currentStore) {
      updateMapFrame(currentStore);
    }
    initPanelInteractions(panel);
  }

    return true;
  }

  function renderIndexPage(stores, nearestStore) {
    const nearestStoreContainer = document.getElementById('nearest-store-container');
    const otherStoresContainer = document.getElementById('other-stores-container');

    if (!nearestStoreContainer || !otherStoresContainer) return false;

    if (!nearestStore) {
      otherStoresContainer.innerHTML = '<div class="text-center py-8"><p class="text-gray-600">載入中...</p></div>';
      return true;
    }

    const mapSection = isLineBrowser()
      ? `
        <div class="mb-4 p-4 bg-gray-50 rounded-lg text-center">
          <p class="text-gray-600 mb-2">
            <i class="fas fa-info-circle mr-2"></i>Google 地圖不支援 LINE 瀏覽器
          </p>
          <p class="text-gray-500 text-sm">請使用其他瀏覽器或 Google Maps App 查看地圖</p>
        </div>
      `
      : `
        <div class="mb-4 rounded-lg overflow-hidden" style="height: 300px;">
          <iframe
            src="${nearestStore.mapEmbedUrl}"
            width="100%"
            height="100%"
            style="border:0;"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade">
          </iframe>
        </div>
      `;

    nearestStoreContainer.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-6 md:p-8 mb-8">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">📍</span>
          <h3 class="text-2xl font-bold text-gray-800">離您最近的門市</h3>
        </div>
        <div class="mb-4">
          <h4 class="text-xl font-bold text-[#DF7621] mb-2">${nearestStore.name}</h4>
          <p class="text-gray-600 mb-1"><strong>地址：</strong>${nearestStore.address}</p>
          <p class="text-gray-600 mb-1"><strong>電話：</strong><a href="tel:${nearestStore.phoneDigits}" class="text-[#DF7621] hover:underline">${nearestStore.phone}</a></p>
        </div>
        ${mapSection}
        <div class="flex gap-3">
          <a href="${nearestStore.mapUrl}" target="_blank" class="flex-1 bg-[#DF7621] text-white text-center py-2 md:py-3 px-3 md:px-4 rounded-lg text-sm md:text-base font-medium hover:bg-[#C65D1A] transition-colors no-underline">
            <i class="fas fa-map-marker-alt mr-2"></i> Google 導航
          </a>
          <a href="tel:${nearestStore.phoneDigits}" class="flex-1 bg-gray-100 text-gray-800 text-center py-2 md:py-3 px-3 md:px-4 rounded-lg text-sm md:text-base font-medium hover:bg-gray-200 transition-colors no-underline">
            <i class="fas fa-phone-alt mr-2"></i> 撥打電話
          </a>
        </div>
      </div>
    `;

    otherStoresContainer.innerHTML = `
      <h3 class="text-2xl font-bold text-gray-800 mb-6">其他門市據點</h3>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        ${stores.map(store => {
          const location = `${store.city}${store.district}`;
          return `
          <div class="bg-gray-50 p-6 rounded-lg border-l-4 border-[#DF7621] transition-all hover:translate-x-1 hover:shadow-md hover:bg-white text-left">
            <h4 class="text-gray-800 mb-2 text-xl">${store.name}</h4>
            <p class="text-gray-600 text-sm">${location}</p>
          </div>
        `;
        }).join('')}
      </div>
    `;

    return true;
  }

  function showError(message) {
    const panel = document.getElementById('store-panel');
    const list = document.getElementById('store-list');
    const preview = document.getElementById('store-preview');
    
    if (list) {
      list.innerHTML = `
        <div class="store-list-empty">
          <i class="fas fa-exclamation-triangle"></i>
          <p>${message}</p>
          <p style="font-size: 0.85em; margin-top: 8px; color: #9ca3af;">請稍後再試或聯絡客服</p>
        </div>
      `;
    }
    
    if (preview) {
      preview.innerHTML = `
        <div class="store-list-empty">
          <i class="fas fa-exclamation-triangle"></i>
          <p>${message}</p>
        </div>
      `;
    }
  }

  async function main() {
    // 顯示載入狀態
    showLoading();
    
    let stores = [];
    try {
      stores = await loadStoreData();
      if (!stores || stores.length === 0) {
        showError('目前沒有門市資料');
        return;
      }
    } catch (error) {
      console.error('載入門市資料失敗:', error);
      showError('無法載入門市資料，請檢查網路連線');
      return;
    }

    let userLat = null;
    let userLng = null;
    let nearestStore = stores[0] || null; // 預設第一間店為最近店面

    const processGeolocation = (position) => {
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;
      nearestStore = findNearestStore(stores, userLat, userLng) || nearestStore;
      renderStoresPage(stores, userLat, userLng);
      renderIndexPage(stores, nearestStore);
    };

    const geolocationError = () => {
      console.warn('無法取得用戶位置，將依城市排序門市。');
      renderStoresPage(stores, null, null);
      renderIndexPage(stores, nearestStore);
    };

    if (navigator.geolocation && stores.length) {
      navigator.geolocation.getCurrentPosition(
        processGeolocation,
        geolocationError,
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
      );
    } else {
      // 不支援定位或沒有門市，直接渲染頁面
      geolocationError();
    }
  }

  // 在 DOMContentLoaded 時執行主函數
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
