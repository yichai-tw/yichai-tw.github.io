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
        mapUrl: fullAddress
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
          : `https://www.google.com/maps?q=${lat},${lng}`,
        mapEmbedUrl: (lat && lng)
          ? `https://www.google.com/maps?q=${lat},${lng}&hl=zh-TW&z=15&output=embed`
          : `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&hl=zh-TW&z=15&output=embed`
      };
    });
  }

  function buildStoreCard(store, isCompact) {
    const status = getStatus(store.hours, new Date());
    const statusText = status ? `<div class="store-list-status ${status.className}">${status.text}</div>` : '';
    const details = isCompact ? '' : buildWeeklyHoursDetails(store.weeklyHours);
    const phoneLink = store.phoneDigits ? `tel:${store.phoneDigits}` : '';
    const mapLink = store.mapUrl || '';
    const actions = isCompact ? '' : `
      <div class="store-list-actions">
        ${phoneLink ? `<a href="${phoneLink}"><i class="fas fa-phone-alt"></i> 電話</a>` : ''}
        ${mapLink ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer"><i class="fas fa-map-marker-alt"></i> 地圖</a>` : ''}
      </div>
    `;

    return `
      <div class="store-list-item" data-store-id="${store.id}">
        <div class="store-list-title">${store.name}</div>
        <div class="store-list-address">${store.address}</div>
        ${statusText}
        ${actions}
        ${details}
      </div>
    `;
  }

  function updateMapFrame(store) {
    const mapFrame = document.getElementById('store-map-frame');
    if (!mapFrame || !store?.mapEmbedUrl) return;
    mapFrame.src = store.mapEmbedUrl;
  }

  function findNearestStore(stores, lat, lng) {
    if (!stores.length) return null;
    let nearest = null;
    let minDistance = Infinity;

    stores.forEach(store => {
      if (!store.lat || !store.lng) return;
      const R = 6371;
      const dLat = (store.lat - lat) * Math.PI / 180;
      const dLng = (store.lng - lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(store.lat * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance < minDistance) {
        minDistance = distance;
        nearest = store;
      }
    });

    return nearest || stores[0];
  }

  function initPanelInteractions(panel) {
    if (!panel) return;
    const handle = panel.querySelector('.store-panel-handle');
    if (!handle) return;

    const setHeight = height => {
      panel.style.setProperty('--panel-height', `${height}px`);
    };

    const minHeight = 160;
    let maxHeight = Math.round(window.innerHeight * 0.85);
    setHeight(minHeight);

    function snapPanel(height) {
      const midpoint = (minHeight + maxHeight) / 2;
      const isExpanded = height >= midpoint;
      panel.classList.toggle('is-expanded', isExpanded);
      panel.classList.toggle('is-collapsed', !isExpanded);
      setHeight(isExpanded ? maxHeight : minHeight);
    }

    let startY = 0;
    let startHeight = 0;
    let dragging = false;

    function onPointerMove(event) {
      if (!dragging) return;
      const delta = startY - event.clientY;
      const nextHeight = Math.min(Math.max(startHeight + delta, minHeight), maxHeight);
      setHeight(nextHeight);
    }

    function onPointerUp(event) {
      if (!dragging) return;
      dragging = false;
      const currentHeight = parseFloat(getComputedStyle(panel).height);
      snapPanel(currentHeight);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    }

    handle.addEventListener('click', () => {
      const currentHeight = parseFloat(getComputedStyle(panel).height);
      snapPanel(currentHeight === minHeight ? maxHeight : minHeight);
    });

    handle.addEventListener('pointerdown', event => {
      dragging = true;
      startY = event.clientY;
      startHeight = parseFloat(getComputedStyle(panel).height);
      maxHeight = Math.round(window.innerHeight * 0.85);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    });
  }

  function renderStoresPage(stores, nearestStore) {
    const panel = document.getElementById('store-panel');
    const list = document.getElementById('store-list');
    const preview = document.getElementById('store-preview');
    const searchInput = document.getElementById('store-search-input');

    if (!panel || !list || !preview) return false;

    const ordered = nearestStore
      ? [nearestStore, ...stores.filter(store => store.id !== nearestStore.id)]
      : stores;

    preview.innerHTML = ordered[0] ? buildStoreCard(ordered[0], true) : '';
    list.innerHTML = ordered.map(store => buildStoreCard(store, false)).join('');
    updateMapFrame(ordered[0]);
    initPanelInteractions(panel);

    list.addEventListener('click', event => {
      const item = event.target.closest('.store-list-item');
      if (!item) return;
      const storeId = item.dataset.storeId;
      const selected = ordered.find(store => store.id === storeId);
      if (selected) {
        updateMapFrame(selected);
      }
    });

    if (searchInput) {
      searchInput.addEventListener('input', event => {
        const keyword = event.target.value.trim();
        const filtered = ordered.filter(store => {
          const target = `${store.name}${store.address}${store.city}${store.district}`;
          return target.includes(keyword);
        });
        list.innerHTML = filtered.map(store => buildStoreCard(store, false)).join('');
      });
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

  async function init() {
    let stores = [];
    try {
      stores = await loadStoreData();
    } catch (error) {
      console.warn('載入門市資料失敗:', error);
      return;
    }

    let nearestStore = stores[0] || null;
    if (navigator.geolocation && stores.length) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          nearestStore = findNearestStore(stores, latitude, longitude) || nearestStore;
          renderStoresPage(stores, nearestStore);
          renderIndexPage(stores, nearestStore);
        },
        () => {
          renderStoresPage(stores, nearestStore);
          renderIndexPage(stores, nearestStore);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
      );
    } else {
      renderStoresPage(stores, nearestStore);
      renderIndexPage(stores, nearestStore);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
