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

      const hasGrooming = store.services?.grooming !== false;
      const status = getStatus(hours, now);
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
    
    const hoursTooltip = store.weeklyHours ? buildWeeklyHoursTooltip(store.weeklyHours) : '';
    const mobileDetails = (isCompact || isSelected) ? '' : buildMobileStoreDetails(store.weeklyHours);
    
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
    mapFrame.src = store?.mapEmbedUrl || '';
  }

  function calculateDistance(lat1, lng1, lat2, lng2) {
    if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
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
    return nearest;
  }

  function sortStoresByDistance(stores, userLat, userLng) {
    if (!stores.length) return stores;
    if (userLat && userLng) {
      return stores.map(store => ({
        ...store,
        distance: calculateDistance(userLat, userLng, store.lat, store.lng)
      })).sort((a, b) => {
        if (a.distance !== b.distance) return a.distance - b.distance;
        return sortByCity(a, b);
      });
    }
    return [...stores].sort(sortByCity);
  }

  function sortByCity(a, b) {
    const cityOrder = { '台北市': 1, '新北市': 2 };
    const orderA = cityOrder[a.city] || 999;
    const orderB = cityOrder[b.city] || 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name, 'zh-TW');
  }

  function initPanelInteractions(panel) {
    if (!panel) return;
    const handle = panel.querySelector('.store-panel-handle');
    const toggleButtonPC = panel.querySelector('.store-panel-toggle-btn');
    const mapLayer = document.querySelector('.store-map-layer');
    const list = document.getElementById('store-list');

    if (handle) {
      const minHeight = 160;
      const expandedHeight = Math.round(window.innerHeight * 0.75); // 同步改為 75vh
      
      function updateBodyScrollLock() {
        if (!list || window.innerWidth >= 1024) return;
        
        const scrollTop = list.scrollTop;
        const scrollHeight = list.scrollHeight;
        const clientHeight = list.clientHeight;
        
        // 判斷是否滑到最底部 (容錯 5px)
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;

        if (panel.classList.contains('is-expanded')) {
          if (isAtBottom) {
            document.body.style.overflow = ''; // 到達底部，釋放鎖定
          } else {
            document.body.style.overflow = 'hidden'; // 未到步，鎖定背景
          }
        } else {
          document.body.style.overflow = '';
        }
      }

      function togglePanel(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        
        const isCollapsed = panel.classList.contains('is-collapsed');
        if (isCollapsed) {
          panel.classList.remove('is-collapsed');
          panel.classList.add('is-expanded');
          panel.style.setProperty('--panel-height', `${expandedHeight}px`);
          updateBodyScrollLock();
        } else {
          panel.classList.remove('is-expanded');
          panel.classList.add('is-collapsed');
          panel.style.setProperty('--panel-height', `${minHeight}px`);
          document.body.style.overflow = '';
        }
      }

      // 綁定點擊事件
      handle.addEventListener('click', togglePanel);
      // 額外綁定觸控事件以確保反應靈敏
      handle.addEventListener('touchend', (e) => {
        togglePanel(e);
      }, { passive: false });
      
      // 監聽清單滑動，動態決定是否釋放背景滑動
      if (list) {
        list.addEventListener('scroll', updateBodyScrollLock, { passive: true });
        list.addEventListener('touchmove', updateBodyScrollLock, { passive: true });
      }

      panel.classList.add('is-collapsed');
      panel.style.setProperty('--panel-height', `${minHeight}px`);
    }

    if (toggleButtonPC && window.innerWidth >= 1024) {
      toggleButtonPC.addEventListener('click', () => {
        panel.classList.toggle('is-collapsed-pc');
        if (mapLayer) mapLayer.classList.toggle('map-expanded');
      });
    }

    window.addEventListener('resize', () => {
      if (window.innerWidth < 1024) {
        panel.classList.remove('is-collapsed-pc');
        if (mapLayer) mapLayer.classList.remove('map-expanded');
      } else {
        panel.classList.remove('is-collapsed', 'is-expanded');
        panel.style.setProperty('--panel-height', 'auto');
      }
    });
  }

  function showLoading() {
    const list = document.getElementById('store-list');
    const preview = document.getElementById('store-preview');
    if (list) list.innerHTML = `<div class="store-list-loading"><i class="fas fa-spinner fa-spin"></i><p>載入門市資料中...</p></div>`;
    if (preview) preview.innerHTML = `<div class="store-list-loading"><i class="fas fa-spinner fa-spin"></i></div>`;
  }

  function renderStoresPage(stores, userLat, userLng) {
    const panel = document.getElementById('store-panel');
    const list = document.getElementById('store-list');
    const preview = document.getElementById('store-preview');
    if (!panel || !list || !preview) return;

    const ordered = sortStoresByDistance(stores, userLat, userLng);
    let currentStore = ordered[0] || null;

    function updateStoreList() {
      if (preview && window.innerWidth < 1024 && currentStore) {
        preview.innerHTML = buildStoreCard(currentStore, true, true);
      } else if (preview) {
        preview.innerHTML = '';
      }
      
      list.innerHTML = ordered.map(store => {
        const isSelected = currentStore && store.id === currentStore.id;
        return buildStoreCard(store, false, isSelected);
      }).join('');
      
      if (currentStore) {
        const activeItem = list.querySelector(`[data-store-id="${currentStore.id}"]`);
        if (activeItem) activeItem.classList.add('active');
      }
      bindStoreItemEvents();
    }

    function bindStoreItemEvents() {
      list.querySelectorAll('.store-list-item').forEach(item => {
        item.addEventListener('click', event => {
          if (event.target.closest('a') || event.target.closest('details')) return;
          const storeId = item.dataset.storeId;
          const selected = ordered.find(store => store.id === storeId);
          if (selected) {
            currentStore = selected;
            updateMapFrame(selected);
            updateStoreList();
          }
        });
      });
    }

    updateStoreList();
    if (currentStore) updateMapFrame(currentStore);
    initPanelInteractions(panel);
  }

  function renderIndexPage(stores, nearestStore) {
    const nearestStoreContainer = document.getElementById('nearest-store-container');
    const otherStoresContainer = document.getElementById('other-stores-container');
    if (!nearestStoreContainer || !otherStoresContainer) return;
    if (!nearestStore) return;

    const mapSection = isLineBrowser() ? '<div class="mb-4 p-4 bg-gray-50 rounded-lg text-center"><p class="text-gray-600">Google 地圖不支援 LINE 瀏覽器</p></div>' : `<div class="mb-4 rounded-lg overflow-hidden" style="height: 300px;"><iframe src="${nearestStore.mapEmbedUrl}" width="100%" height="100%" style="border:0;" loading="lazy"></iframe></div>`;

    nearestStoreContainer.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 class="text-2xl font-bold mb-4">離您最近的門市</h3>
        <h4 class="text-xl font-bold text-[#DF7621] mb-2">${nearestStore.name}</h4>
        <p>${nearestStore.address}</p>
        ${mapSection}
      </div>
    `;

    otherStoresContainer.innerHTML = `<div class="grid grid-cols-2 md:grid-cols-5 gap-5">${stores.map(s => `<div class="bg-gray-50 p-4 rounded-lg"><h4>${s.name}</h4></div>`).join('')}</div>`;
  }

  function showError(message) {
    const list = document.getElementById('store-list');
    if (list) list.innerHTML = `<div class="store-list-empty"><p>${message}</p></div>`;
  }

  async function main() {
    showLoading();
    try {
      const stores = await loadStoreData();
      if (!stores || stores.length === 0) {
        showError('目前沒有門市資料');
        return;
      }

      // 先進行預設渲染（依城市排序），讓使用者能立刻看到清單
      renderStoresPage(stores, null, null);
      renderIndexPage(stores, stores[0]);

      // 接著嘗試獲取定位，若成功則更新頁面
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            console.log('取得定位成功:', userLat, userLng);
            
            const nearestStore = findNearestStore(stores, userLat, userLng);
            // 重新渲染，帶入定位資訊進行排序
            renderStoresPage(stores, userLat, userLng);
            renderIndexPage(stores, nearestStore);
          },
          (error) => {
            console.warn('地理定位失敗:', error.message);
            // 保持預設渲染即可
          },
          { 
            enableHighAccuracy: false, 
            timeout: 5000, 
            maximumAge: 60000 
          }
        );
      }
    } catch (error) {
      console.error('執行 main 失敗:', error);
      showError('載入門市資料失敗');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
