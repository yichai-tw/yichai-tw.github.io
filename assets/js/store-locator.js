// 門市定位系統
(function() {
  // 所有門市資料
  const stores = [
    { name: '內湖店', lat: 25.08460893161349, lng: 121.59463993217013, address: '台北市內湖區金龍路17號', phone: '02-2796-1100', mapUrl: 'https://maps.app.goo.gl/njRYqtSPN6fTKvKZ7', city: '台北市' },
    { name: '新和店', lat: 25.04377345957, lng: 121.44825366083482, address: '新北市新莊區中和街28號', phone: '02-2997-2211', mapUrl: 'https://www.google.com/maps/search/?api=1&query=新北市新莊區中和街28號', city: '新北市' },
    { name: '中華店', lat: 25.0448444216677, lng: 121.453486519488, address: '新北市新莊區中華路二段22-1號', phone: '02-8993-6000', mapUrl: 'https://www.google.com/maps/search/?api=1&query=新北市新莊區中華路二段22-1號', city: '新北市' },
    { name: '中正店', lat: 25.0342200600257, lng: 121.442976421663, address: '新北市新莊區中正路380號', phone: '02-8991-7700', mapUrl: 'https://www.google.com/maps/search/?api=1&query=新北市新莊區中正路380號', city: '新北市' },
    { name: '龍安店', lat: 25.0188687324957, lng: 121.423177604826, address: '新北市新莊區龍安路306號', phone: '02-2202-5000', mapUrl: 'https://www.google.com/maps/search/?api=1&query=新北市新莊區龍安路306號', city: '新北市' },
    { name: '中港店', lat: 25.050784883087186, lng: 121.45204051941089, address: '新北市新莊區中港路430號', phone: '02-2990-1715', mapUrl: 'https://www.google.com/maps/search/?api=1&query=新北市新莊區中港路430號', city: '新北市' },
    { name: '仁愛店', lat: 25.082103788280826, lng: 121.4878785876342, address: '新北市三重區仁愛街508號', phone: '02-2983-2929', mapUrl: 'https://www.google.com/maps/search/?api=1&query=新北市三重區仁愛街508號', city: '新北市' },
    { name: '九芎店', lat: 25.080976586918503, lng: 121.46489604170408, address: '新北市蘆洲區九芎街90巷11-1號', phone: '02-8285-7111', mapUrl: 'https://www.google.com/maps/search/?api=1&query=新北市蘆洲區九芎街90巷11-1號', city: '新北市' },
    { name: '長榮店', lat: 25.09277205476275, lng: 121.46108365542734, address: '新北市蘆洲區長榮路786、788號', phone: '02-2282-0066', mapUrl: 'https://www.google.com/maps/search/?api=1&query=新北市蘆洲區長榮路786、788號', city: '新北市' },
    { name: '五股店', lat: 25.0758952725763, lng: 121.435053940776, address: '新北市五股區成泰路一段138號', phone: '02-2295-2000', mapUrl: 'https://www.google.com/maps/search/?api=1&query=新北市五股區成泰路一段138號', city: '新北市' },
    { name: '成泰店', lat: 25.10246021872565, lng: 121.45233081543373, address: '新北市五股區成泰路3段518號', phone: '02-2908-0960', mapUrl: 'https://www.google.com/maps/search/?api=1&query=新北市五股區成泰路3段518號', city: '新北市' },
    { name: '康寧店', lat: 25.06766847256219, lng: 121.62908637907044, address: '新北市汐止區康寧街378號', phone: '02-2693-5678', mapUrl: 'https://www.google.com/maps/search/?api=1&query=新北市汐止區康寧街378號', city: '新北市' },
    { name: '淡水店', lat: 25.1739699524988, lng: 121.441238394258, address: '新北市淡水區中山路170號', phone: '02-2626-9555', mapUrl: 'https://www.google.com/maps/search/?api=1&query=新北市淡水區中山路170號', city: '新北市' },
    { name: '泰山店', lat: 25.050724686371264, lng: 121.42750942755018, address: '新北市泰山區明志路二段152號', phone: '02-2900-0650', mapUrl: 'https://www.google.com/maps/search/?api=1&query=新北市泰山區明志路二段152號', city: '新北市' },
    { name: '明志店', lat: 25.05717924625939, lng: 121.43082585122028, address: '新北市泰山區明志路一段409號', phone: '02-2983-0518', mapUrl: 'https://www.google.com/maps/search/?api=1&query=新北市泰山區明志路一段409號', city: '新北市' },
    { name: '北大店', lat: 24.94189437221343, lng: 121.3792083511288, address: '新北市三峽區三樹路202-1號', phone: '02-8672-5898', mapUrl: 'https://www.google.com/maps/search/?api=1&query=新北市三峽區三樹路202-1號', city: '新北市' }
  ];

  // 計算兩點間距離（Haversine 公式）
  function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 地球半徑（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // 找到最近的門市
  function findNearestStore(userLat, userLng) {
    let nearestStore = null;
    let minDistance = Infinity;

    stores.forEach(store => {
      const distance = calculateDistance(userLat, userLng, store.lat, store.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestStore = { ...store, distance: distance.toFixed(1) };
      }
    });

    return nearestStore;
  }

  // 渲染最近門市（含地圖）
  function renderNearestStore(store) {
    const container = document.getElementById('nearest-store-container');
    if (!container) return;

    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-6 md:p-8 mb-8">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">📍</span>
          <h3 class="text-2xl font-bold text-gray-800">離您最近的門市</h3>
        </div>
        <div class="mb-4">
          <h4 class="text-xl font-bold text-[#DF7621] mb-2">${store.name}</h4>
          <p class="text-gray-600 mb-1"><strong>地址：</strong>${store.address}</p>
          <p class="text-gray-600 mb-1"><strong>電話：</strong><a href="tel:${store.phone.replace(/-/g, '')}" class="text-[#DF7621] hover:underline">${store.phone}</a></p>
          <p class="text-gray-600 mb-4"><strong>距離：</strong>約 ${store.distance} 公里</p>
        </div>
        <div class="mb-4 rounded-lg overflow-hidden" style="height: 300px;">
          <iframe 
            src="https://www.google.com/maps?q=${store.lat},${store.lng}&hl=zh-TW&z=15&output=embed" 
            width="100%" 
            height="100%" 
            style="border:0;" 
            allowfullscreen="" 
            loading="lazy" 
            referrerpolicy="no-referrer-when-downgrade">
          </iframe>
        </div>
        <div class="flex gap-3">
          <a href="${store.mapUrl}" target="_blank" class="flex-1 bg-[#DF7621] text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-[#C65D1A] transition-colors no-underline">
            <i class="fas fa-map-marker-alt mr-2"></i> Google 導航
          </a>
          <a href="tel:${store.phone.replace(/-/g, '')}" class="flex-1 bg-gray-100 text-gray-800 text-center py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors no-underline">
            <i class="fas fa-phone-alt mr-2"></i> 撥打電話
          </a>
        </div>
      </div>
    `;
  }

  // 渲染其他門市（簡單資訊）
  function renderOtherStores(nearestStoreName) {
    const container = document.getElementById('other-stores-container');
    if (!container) return;

    const otherStores = stores.filter(store => store.name !== nearestStoreName);
    
    container.innerHTML = `
      <h3 class="text-2xl font-bold text-gray-800 mb-6">其他門市據點</h3>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        ${otherStores.map(store => `
          <div class="bg-gray-50 p-6 rounded-lg border-l-4 border-[#DF7621] transition-all hover:translate-x-1 hover:shadow-md hover:bg-white text-left">
            <h4 class="text-gray-800 mb-2 text-xl">${store.name}</h4>
            <p class="text-gray-600 text-sm">${store.city}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 渲染所有門市（簡單資訊，定位失敗時使用）
  function renderAllStoresSimple() {
    const nearestStoreContainer = document.getElementById('nearest-store-container');
    const otherStoresContainer = document.getElementById('other-stores-container');
    
    if (!nearestStoreContainer || !otherStoresContainer) return;

    // 清空最近門市容器
    nearestStoreContainer.innerHTML = '';
    
    // 顯示所有門市的簡短資訊
    otherStoresContainer.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        ${stores.map(store => `
          <div class="bg-gray-50 p-6 rounded-lg border-l-4 border-[#DF7621] transition-all hover:translate-x-1 hover:shadow-md hover:bg-white text-left">
            <h4 class="text-gray-800 mb-2 text-xl">${store.name}</h4>
            <p class="text-gray-600 text-sm">${store.city}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 初始化
  function init() {
    const nearestStoreContainer = document.getElementById('nearest-store-container');
    const otherStoresContainer = document.getElementById('other-stores-container');
    
    if (!nearestStoreContainer || !otherStoresContainer) return;

    // 顯示載入訊息
    nearestStoreContainer.innerHTML = '<div class="text-center py-8"><p class="text-gray-600">正在定位您的位置...</p></div>';
    otherStoresContainer.innerHTML = '<div class="text-center py-8"><p class="text-gray-600">載入中...</p></div>';

    // 檢查是否支援 Geolocation API
    if (!navigator.geolocation) {
      // 不支援定位，顯示所有門市的簡短資訊
      renderAllStoresSimple();
      return;
    }

    // 獲取用戶位置
    navigator.geolocation.getCurrentPosition(
      function(position) {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        const nearestStore = findNearestStore(userLat, userLng);
        if (nearestStore) {
          renderNearestStore(nearestStore);
          renderOtherStores(nearestStore.name);
        }
      },
      function(error) {
        // 定位失敗，顯示所有門市的簡短資訊
        console.warn('無法獲取位置:', error);
        renderAllStoresSimple();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  // 頁面載入完成後初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
