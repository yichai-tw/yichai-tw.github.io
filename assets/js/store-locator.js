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
    } catch (e) {
      return null;
    }
  }

  async function loadStoreData() {
    try {
      const response = await fetch('mapping/PetStores_BranchInfo.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load store data');
      const data = await response.json();
      const now = new Date();

      return (data.stores || []).map(store => {
        const city = store.location?.city?.chinese || '';
        const district = store.location?.district?.chinese || '';
        const fullAddress = store.location?.full_address || `${city}${district}${store.location?.address || ''}`;
        const coordinates = store.location?.coordinates || {};
        const weeklyHours = store.business_hours || null;
        const hours = resolveTodayHours(weeklyHours, now);
        const status = getStatus(hours, now);

        return {
          id: normalizeStoreName(store.store_name),
          name: `${store.store_name}店`,
          city,
          address: fullAddress,
          lat: coordinates.latitude,
          lng: coordinates.longitude,
          phone: store.contact?.supplies_phone || '',
          weeklyHours,
          status,
          hasGrooming: store.services?.grooming === true,
          mapEmbedUrl: (coordinates.latitude && coordinates.longitude)
            ? `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}&hl=zh-TW&z=15&output=embed`
            : `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&hl=zh-TW&z=15&output=embed`
        };
      });
    } catch (err) {
      console.error('loadStoreData error:', err);
      return [];
    }
  }

  function calculateDistance(lat1, lng1, lat2, lng2) {
    if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function renderStoresPage(allStores, userLat, userLng) {
    const filterContainer = document.getElementById('store-filter-bar');
    const listContainer = document.getElementById('store-list-container');
    const mapFrame = document.getElementById('store-map-frame');
    if (!filterContainer || !listContainer) return;

    let activeFilters = { cities: [], openOnly: false, groomingOnly: false };
    let selectedStoreId = null;

    function getFilteredStores() {
      return allStores.filter(store => {
        const cityMatch = activeFilters.cities.length === 0 || activeFilters.cities.includes(store.city);
        const openMatch = !activeFilters.openOnly || (store.status && store.status.isOpen);
        const groomingMatch = !activeFilters.groomingOnly || store.hasGrooming;
        return cityMatch && openMatch && groomingMatch;
      }).sort((a, b) => {
        if (userLat && userLng) {
          const distA = calculateDistance(userLat, userLng, a.lat, a.lng);
          const distB = calculateDistance(userLat, userLng, b.lat, b.lng);
          return distA - distB;
        }
        return a.city.localeCompare(b.city, 'zh-TW');
      });
    }

    function renderFilters() {
      const isAllActive = activeFilters.cities.length === 0 && !activeFilters.openOnly && !activeFilters.groomingOnly;
      const filters = [
        { id: 'all', label: '全部', active: isAllActive, action: () => { activeFilters = { cities: [], openOnly: false, groomingOnly: false }; } },
        { id: 'open', label: '營業中', active: activeFilters.openOnly, action: () => activeFilters.openOnly = !activeFilters.openOnly },
        { id: 'grooming', label: '美容服務', active: activeFilters.groomingOnly, action: () => activeFilters.groomingOnly = !activeFilters.groomingOnly },
        { id: 'taipei', label: '台北市', active: activeFilters.cities.includes('台北市'), action: () => toggleCity('台北市') },
        { id: 'new-taipei', label: '新北市', active: activeFilters.cities.includes('新北市'), action: () => toggleCity('新北市') }
      ];

      function toggleCity(city) {
        const index = activeFilters.cities.indexOf(city);
        if (index > -1) activeFilters.cities.splice(index, 1);
        else activeFilters.cities.push(city);
      }

      filterContainer.innerHTML = filters.map(f => `
        <button class="filter-chip ${f.active ? 'active' : ''}" data-filter-id="${f.id}">
          ${f.label}
        </button>
      `).join('');

      filterContainer.querySelectorAll('.filter-chip').forEach(btn => {
        btn.onclick = () => {
          const filter = filters.find(f => f.id === btn.dataset.filterId);
          filter.action();
          updateUI();
        };
      });
    }

    function renderList() {
      const filtered = getFilteredStores();
      if (filtered.length === 0) {
        listContainer.innerHTML = '<div class="store-list-empty">找不到符合條件的門市</div>';
        if (mapFrame) mapFrame.src = '';
        return;
      }

      // 安全地設定預設選中門市
      const currentExists = selectedStoreId && filtered.find(s => s.id === selectedStoreId);
      if (!currentExists) {
        selectedStoreId = filtered[0].id;
        if (mapFrame) mapFrame.src = filtered[0].mapEmbedUrl;
      }

      listContainer.innerHTML = filtered.map(store => `
        <div class="store-card ${selectedStoreId === store.id ? 'active' : ''}" data-store-id="${store.id}">
          <div class="card-header">
            <div class="card-title">
              ${store.name}
              ${store.hasGrooming ? '<span class="badge-grooming">美容</span>' : ''}
            </div>
            <div class="card-status ${store.status?.className || ''}">${store.status?.text || ''}</div>
          </div>
          <div class="card-info">
            <div class="card-info-item"><i class="fas fa-map-marker-alt"></i> ${store.address}</div>
            <div class="card-info-item"><i class="fas fa-phone-alt"></i> ${store.phone}</div>
          </div>
        </div>
      `).join('');

      listContainer.querySelectorAll('.store-card').forEach(card => {
        card.onclick = () => {
          selectedStoreId = card.dataset.storeId;
          const store = filtered.find(s => s.id === selectedStoreId);
          if (store && mapFrame) {
            mapFrame.src = store.mapEmbedUrl;
          }
          renderList(); 
          if (window.innerWidth < 1024) {
            document.querySelector('.store-main-map')?.scrollIntoView({ behavior: 'smooth' });
          }
        };
      });
    }

    function updateUI() {
      renderFilters();
      renderList();
    }

    updateUI();
  }

  async function main() {
    try {
      const stores = await loadStoreData();
      if (!stores || stores.length === 0) {
        const listContainer = document.getElementById('store-list-container');
        if (listContainer) listContainer.innerHTML = '<div class="store-list-empty">無法載入門市資料，請稍後再試</div>';
        return;
      }

      renderStoresPage(stores, null, null);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => renderStoresPage(stores, pos.coords.latitude, pos.coords.longitude),
          () => {},
          { timeout: 5000 }
        );
      }
    } catch (err) {
      console.error('Main execution error:', err);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
  else main();
})();
