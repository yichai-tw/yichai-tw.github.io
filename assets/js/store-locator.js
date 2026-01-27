// 門市定位與清單系統
(function() {
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
    if (todayHours.toUpperCase() === 'OFF') return { isClosedAllDay: true, rawText: todayHours };
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
    if (hours.isClosedAllDay) return { text: '● 今日休息', className: 'status-closed', isOpen: false };
    try {
      const openAt = parseTimeToDate(now, hours.open);
      const closeAt = parseTimeToDate(now, hours.close);
      if (now < openAt) return { text: `● 尚未營業 · ${hours.open} 開`, className: 'status-closed', isOpen: false };
      if (now >= closeAt) return { text: `● 已打烊 · ${hours.close} 關`, className: 'status-closed', isOpen: false };
      return { text: `● 營業中 · ${hours.close} 關`, className: 'status-open', isOpen: true };
    } catch (e) { return null; }
  }

  function buildWeeklyHoursList(weeklyHours) {
    const order = [
      { key: 'monday', label: '週一' }, { key: 'tuesday', label: '週二' },
      { key: 'wednesday', label: '週三' }, { key: 'thursday', label: '週四' },
      { key: 'friday', label: '週五' }, { key: 'saturday', label: '週六' },
      { key: 'sunday', label: '週日' }
    ];
    return order.map(({ key, label }) => {
      const value = weeklyHours?.[key];
      if (!value) return null;
      const display = value.toUpperCase() === 'OFF' ? '休息' : value;
      return `<li><span class="store-hours-day">${label}</span><span class="store-hours-slot">${display}</span></li>`;
    }).filter(Boolean).join('');
  }

  async function loadStoreData() {
    try {
      const response = await fetch('mapping/PetStores_BranchInfo.json', { cache: 'no-store' });
      const data = await response.json();
      const now = new Date();
      return (data.stores || []).map(store => {
        const city = store.location?.city?.chinese || '';
        const coordinates = store.location?.coordinates || {};
        const fullAddress = store.location?.full_address || `${city}${store.location?.address || ''}`;
        const weeklyHours = store.business_hours || null;
        const hours = resolveTodayHours(weeklyHours, now);
        return {
          id: normalizeStoreName(store.store_name),
          name: `${store.store_name}店`,
          city,
          address: fullAddress,
          lat: coordinates.latitude,
          lng: coordinates.longitude,
          phone: store.contact?.supplies_phone || '',
          phoneDigits: (store.contact?.supplies_phone || '').replace(/[^\d]/g, ''),
          weeklyHours,
          status: getStatus(hours, now),
          hasGrooming: store.services?.grooming === true,
          mapUrl: store.google_business_short_url || store.google_business_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`,
          mapEmbedUrl: (coordinates.latitude && coordinates.longitude)
            ? `https://www.google.com/maps?q=${coordinates.latitude},coordinates.longitude&hl=zh-TW&z=15&output=embed`
            : `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&hl=zh-TW&z=15&output=embed`
        };
      });
    } catch (err) { return []; }
  }

  function calculateDistance(lat1, lng1, lat2, lng2) {
    if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function renderStoresPage(allStores, userLat, userLng) {
    const filterBar = document.getElementById('store-filter-bar');
    const listContainer = document.getElementById('store-list-container');
    const mapFrame = document.getElementById('store-map-frame');
    if (!filterBar || !listContainer) return;

    let activeFilters = { cities: [], openOnly: false, groomingOnly: false };
    let selectedStoreId = null;

    function getFilteredStores() {
      return allStores.filter(store => {
        const cityMatch = activeFilters.cities.length === 0 || activeFilters.cities.includes(store.city);
        const openMatch = !activeFilters.openOnly || (store.status && store.status.isOpen);
        const groomingMatch = !activeFilters.groomingOnly || store.hasGrooming;
        return cityMatch && openMatch && groomingMatch;
      }).sort((a, b) => {
        if (userLat && userLng) return calculateDistance(userLat, userLng, a.lat, a.lng) - calculateDistance(userLat, userLng, b.lat, b.lng);
        return a.city.localeCompare(b.city, 'zh-TW');
      });
    }

    function renderFilters() {
      const isAll = activeFilters.cities.length === 0 && !activeFilters.openOnly && !activeFilters.groomingOnly;
      const filters = [
        { id: 'all', label: '全部', active: isAll, action: () => activeFilters = { cities: [], openOnly: false, groomingOnly: false } },
        { id: 'open', label: '營業中', active: activeFilters.openOnly, action: () => activeFilters.openOnly = !activeFilters.openOnly },
        { id: 'grooming', label: '美容', active: activeFilters.groomingOnly, action: () => activeFilters.groomingOnly = !activeFilters.groomingOnly },
        { id: 'taipei', label: '台北市', active: activeFilters.cities.includes('台北市'), action: () => toggleCity('台北市') },
        { id: 'new-taipei', label: '新北市', active: activeFilters.cities.includes('新北市'), action: () => toggleCity('新北市') }
      ];
      function toggleCity(c) {
        const i = activeFilters.cities.indexOf(c);
        if (i > -1) activeFilters.cities.splice(i, 1); else activeFilters.cities.push(c);
      }
      filterBar.innerHTML = filters.map(f => `<button class="filter-chip ${f.active ? 'active' : ''}" data-id="${f.id}">${f.label}</button>`).join('');
      filterBar.querySelectorAll('.filter-chip').forEach(btn => {
        btn.onclick = () => { filters.find(f => f.id === btn.dataset.id).action(); updateUI(); };
      });
    }

    function renderStoreCard(store, isActive) {
      const hoursList = buildWeeklyHoursList(store.weeklyHours);
      return `
        <div class="store-card ${isActive ? 'active' : ''}" data-id="${store.id}">
          <div class="card-header">
            <div class="card-title">${store.name} ${store.hasGrooming ? '<span class="badge-grooming">美容</span>' : ''}</div>
            <div class="card-status ${store.status?.className || ''}">${store.status?.text || ''}</div>
          </div>
          <div class="card-info">
            <div class="card-info-item"><i class="fas fa-map-marker-alt"></i> 
              <a href="${store.mapUrl}" target="_blank" class="address-link">${store.address} <i class="fas fa-location-arrow icon-inline"></i></a>
            </div>
            <div class="card-info-item"><i class="fas fa-phone-alt"></i> 
              <a href="tel:${store.phoneDigits}" class="text-[#DF7621] font-bold">${store.phone}</a>
            </div>
          </div>
          <details class="card-hours-details">
            <summary>營業時間 (點擊展開)</summary>
            <ul class="card-hours-list">${hoursList}</ul>
          </details>
        </div>
      `;
    }

    function renderUI() {
      const filtered = getFilteredStores();
      const isMobile = window.innerWidth < 1024;

      if (filtered.length === 0) {
        listContainer.innerHTML = '<div class="store-list-empty">找不到符合條件的門市</div>';
        if (mapFrame) mapFrame.src = '';
        return;
      }

      if (!selectedStoreId || !filtered.find(s => s.id === selectedStoreId)) {
        selectedStoreId = filtered[0].id;
      }
      const activeStore = filtered.find(s => s.id === selectedStoreId) || filtered[0];
      if (mapFrame) mapFrame.src = activeStore.mapEmbedUrl;

      if (isMobile) {
        // 手機版：Chips + 單一詳細卡片
        const chipsHTML = `
          <div class="store-nav-chips-mobile">
            ${filtered.map(s => `<button class="nav-chip ${selectedStoreId === s.id ? 'active' : ''}" data-id="${s.id}">${s.name}</button>`).join('')}
          </div>
        `;
        listContainer.innerHTML = chipsHTML + renderStoreCard(activeStore, true);
        
        listContainer.querySelectorAll('.nav-chip').forEach(chip => {
          chip.onclick = () => { selectedStoreId = chip.dataset.id; renderUI(); };
        });
      } else {
        // PC 版：完整清單
        listContainer.innerHTML = filtered.map(s => renderStoreCard(s, s.id === selectedStoreId)).join('');
      }

      listContainer.querySelectorAll('.store-card').forEach(card => {
        card.onclick = (e) => {
          if (e.target.closest('details') || e.target.closest('a')) return;
          selectedStoreId = card.dataset.id;
          renderUI();
          if (isMobile) document.querySelector('.store-main-map')?.scrollIntoView({ behavior: 'smooth' });
        };
      });
    }

    function updateUI() { renderFilters(); renderUI(); }
    window.onresize = renderUI;
    updateUI();
  }

  async function main() {
    const stores = await loadStoreData();
    if (stores.length) {
      renderStoresPage(stores, null, null);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(p => renderStoresPage(stores, p.coords.latitude, p.coords.longitude), null, { timeout: 5000 });
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main); else main();
})();
