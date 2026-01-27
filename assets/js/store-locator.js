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
      return { text: `● 尚未營業 · ${hours.open} 開門`, className: 'status-closed' };
    }
    if (diff <= 0) {
      return { text: `● 已打烊 · ${hours.close} 關門`, className: 'status-closed' };
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

      const hasGrooming = store.services?.grooming === true;
      const googleBusinessUrl = store.google_business_url || '';
      const googleBusinessShortUrl = store.google_business_short_url || '';

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
        googleBusinessUrl,
        googleBusinessShortUrl,
        mapUrl: googleBusinessShortUrl || googleBusinessUrl || (fullAddress
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
          : `https://www.google.com/maps?q=${lat},${lng}`),
        mapEmbedUrl: (lat && lng)
          ? `https://www.google.com/maps?q=${lat},${lng}&hl=zh-TW&z=15&output=embed`
          : `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&hl=zh-TW&z=15&output=embed`
      };
    });
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
        return a.name.localeCompare(b.name, 'zh-TW');
      });
    }
    return [...stores].sort((a, b) => {
      const cityOrder = { '台北市': 1, '新北市': 2 };
      const orderA = cityOrder[a.city] || 999;
      const orderB = cityOrder[b.city] || 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name, 'zh-TW');
    });
  }

  function renderStoresPage(stores, userLat, userLng) {
    const navContainer = document.getElementById('store-nav-chips');
    const detailContainer = document.getElementById('store-detail-card');
    if (!navContainer || !detailContainer) return;

    const ordered = sortStoresByDistance(stores, userLat, userLng);
    
    // 邏輯：如果有 GPS (userLat 存在)，則自動選最近的 (ordered[0])
    // 如果沒有 GPS，則優先找「內湖店」，找不到才選第一個
    let currentStore = null;
    if (userLat && userLng) {
      currentStore = ordered[0];
    } else {
      currentStore = ordered.find(s => s.name.includes('內湖')) || ordered[0];
    }

    function renderNav() {
      const grouped = ordered.reduce((acc, store) => {
        const city = store.city || '其他';
        if (!acc[city]) acc[city] = [];
        acc[city].push(store);
        return acc;
      }, {});

      navContainer.innerHTML = Object.entries(grouped).map(([city, stores]) => `
        <div class="city-group" data-city="${city}">
          <div class="city-label">${city}</div>
          <div class="city-chips">
            ${stores.map(store => `
              <button class="nav-chip ${currentStore?.id === store.id ? 'active' : ''}" 
                      data-store-id="${store.id}">
                ${store.name}
              </button>
            `).join('')}
          </div>
        </div>
      `).join('');

      // 檢查是否溢出並添加標記
      setTimeout(() => {
        navContainer.querySelectorAll('.city-group').forEach(group => {
          const chips = group.querySelector('.city-chips');
          if (chips.scrollWidth > chips.clientWidth) {
            group.classList.add('has-overflow');
            chips.classList.add('has-overflow');
          }
        });
      }, 100);

      navContainer.querySelectorAll('.nav-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const selected = ordered.find(s => s.id === chip.dataset.storeId);
          if (selected) {
            currentStore = selected;
            updateUI();
          }
        });
      });
    }

    function renderDetail() {
      if (!currentStore) return;
      
      const status = getStatus(currentStore.hours, new Date());
      const groomingBadge = currentStore.hasGrooming ? `<span class="badge-grooming"><i class="fas fa-cut"></i> 寵物美容</span>` : '';
      const phoneLink = `tel:${currentStore.phoneDigits}`;
      const hoursList = buildWeeklyHoursList(currentStore.weeklyHours);

      detailContainer.innerHTML = `
        <div class="detail-header">
          <div class="detail-title">
            ${currentStore.name}
            ${groomingBadge}
          </div>
          <div class="store-list-status ${status?.className || ''}">${status?.text || ''}</div>
        </div>
        <div class="detail-info-grid">
          <div class="detail-main-info">
            <div class="info-item">
              <i class="fas fa-map-marker-alt"></i>
              <a href="${currentStore.mapUrl}" target="_blank" class="address-link">
                ${currentStore.address}
                <i class="fas fa-location-arrow icon-inline"></i>
              </a>
            </div>
            <div class="info-item">
              <i class="fas fa-phone-alt"></i>
              <a href="${phoneLink}" class="text-[#DF7621] font-bold">${currentStore.phone}</a>
            </div>
          </div>
          <div class="detail-hours-info">
            <details class="store-details-accordion">
              <summary style="font-weight: 600; color: #DF7621; cursor: pointer; margin-bottom: 10px;">營業時間 (點擊展開)</summary>
              <div class="store-details-content">
                <ul class="store-hours-week">${hoursList}</ul>
              </div>
            </details>
          </div>
        </div>
      `;
    }

    function updateUI() {
      renderNav();
      renderDetail();
      updateMapFrame(currentStore);
    }

    updateUI();
  }

  async function main() {
    try {
      const stores = await loadStoreData();
      if (!stores || stores.length === 0) return;

      renderStoresPage(stores, null, null);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            renderStoresPage(stores, userLat, userLng);
          },
          () => {},
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
        );
      }
    } catch (error) {
      console.error('執行 main 失敗:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
