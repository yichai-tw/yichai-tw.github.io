// 門市定位系統
(function() {
  // 偵測 LINE 內建瀏覽器
  function isLineBrowser() {
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    // 偵測 LINE 內建瀏覽器（多種可能的 User-Agent 格式）
    return /Line/i.test(ua) || 
           /Naver/i.test(ua) || 
           /LINE/i.test(ua) ||
           (ua.indexOf('Line') !== -1) ||
           (ua.indexOf('line') !== -1);
  }

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

    const isLine = isLineBrowser();
    const mapUrl = `https://www.google.com/maps?q=${store.lat},${store.lng}`;
    
    // 如果是 LINE 瀏覽器，不顯示 iframe，顯示提示訊息
    const mapSection = isLine ? `
      <div class="mb-4 p-4 bg-gray-50 rounded-lg text-center">
        <p class="text-gray-600 mb-2">
          <i class="fas fa-info-circle mr-2"></i>Google 地圖不支援 LINE 瀏覽器
        </p>
        <p class="text-gray-500 text-sm">請使用其他瀏覽器或 Google Maps App 查看地圖</p>
      </div>
    ` : `
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
    `;

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
          ${store.accuracy ? `<p class="text-gray-500 text-sm">定位精度: 約 ${store.accuracy} 公尺</p>` : ''}
        </div>
        ${mapSection}
        <div class="flex gap-3">
          <a href="${store.mapUrl}" target="_blank" class="flex-1 bg-[#DF7621] text-white text-center py-2 md:py-3 px-3 md:px-4 rounded-lg text-sm md:text-base font-medium hover:bg-[#C65D1A] transition-colors no-underline">
            <i class="fas fa-map-marker-alt mr-2"></i> Google 導航
          </a>
          <a href="tel:${store.phone.replace(/-/g, '')}" class="flex-1 bg-gray-100 text-gray-800 text-center py-2 md:py-3 px-3 md:px-4 rounded-lg text-sm md:text-base font-medium hover:bg-gray-200 transition-colors no-underline">
            <i class="fas fa-phone-alt mr-2"></i> 撥打電話
          </a>
        </div>
      </div>
    `;
  }

  // 從地址中提取「XX市XX區」格式
  function extractCityDistrict(address) {
    // 匹配「XX市XX區」格式，例如：台北市內湖區、新北市新莊區
    const match = address.match(/(台北市|新北市)([^區]+區)/);
    if (match) {
      return match[1] + match[2]; // 返回「XX市XX區」
    }
    // 如果匹配失敗，返回原城市名稱
    return address.includes('台北市') ? '台北市' : '新北市';
  }

  // 渲染其他門市（簡單資訊）
  function renderOtherStores(nearestStoreName) {
    const container = document.getElementById('other-stores-container');
    if (!container) return;

    const otherStores = stores.filter(store => store.name !== nearestStoreName);
    
    container.innerHTML = `
      <h3 class="text-2xl font-bold text-gray-800 mb-6">其他門市據點</h3>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        ${otherStores.map(store => {
          const location = extractCityDistrict(store.address);
          return `
          <div class="bg-gray-50 p-6 rounded-lg border-l-4 border-[#DF7621] transition-all hover:translate-x-1 hover:shadow-md hover:bg-white text-left">
            <h4 class="text-gray-800 mb-2 text-xl">${store.name}</h4>
            <p class="text-gray-600 text-sm">${location}</p>
          </div>
        `;
        }).join('')}
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
        ${stores.map(store => {
          const location = extractCityDistrict(store.address);
          return `
          <div class="bg-gray-50 p-6 rounded-lg border-l-4 border-[#DF7621] transition-all hover:translate-x-1 hover:shadow-md hover:bg-white text-left">
            <h4 class="text-gray-800 mb-2 text-xl">${store.name}</h4>
            <p class="text-gray-600 text-sm">${location}</p>
          </div>
        `;
        }).join('')}
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

    // 檢查是否有緩存的位置資訊（7天內有效，符合國際標準規範）
    const cachedLocation = localStorage.getItem('userLocation');
    const cacheTime = localStorage.getItem('userLocationTime');
    const now = Date.now();
    const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7天（毫秒），符合國際標準規範的最長緩存期限

    if (cachedLocation && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
      // 使用緩存的位置資訊
      try {
        const location = JSON.parse(cachedLocation);
        const nearestStore = findNearestStore(location.lat, location.lng);
        if (nearestStore) {
          renderNearestStore(nearestStore);
          renderOtherStores(nearestStore.name);
        }
        return;
      } catch (e) {
        console.warn('緩存位置資訊解析失敗，重新獲取位置');
      }
    }

    // 獲取使用者位置（優先使用高精度定位）
    function attemptHighAccuracyLocation() {
      navigator.geolocation.getCurrentPosition(
        function(position) {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          
          // 記錄定位精度資訊（用於調試和優化）
          if (position.coords.accuracy) {
            console.log('高精度定位成功，精度：', Math.round(position.coords.accuracy), '公尺');
          }
          
          // 將位置資訊存入 localStorage（7天有效，符合國際標準規範）
          localStorage.setItem('userLocation', JSON.stringify({ lat: userLat, lng: userLng }));
          localStorage.setItem('userLocationTime', now.toString());
          
          const nearestStore = findNearestStore(userLat, userLng);
          if (nearestStore) {
            renderNearestStore(nearestStore);
            renderOtherStores(nearestStore.name);
          }
        },
        function(error) {
          // 高精度定位失敗，嘗試使用低精度定位作為備選
          console.warn('高精度定位失敗，嘗試低精度定位:', error.message);
          attemptLowAccuracyLocation();
        },
        {
          enableHighAccuracy: true, // 啟用高精度定位，使用 GPS 衛星定位
          timeout: 15000, // 增加超時時間至 15 秒，給予更多時間獲取高精度位置
          maximumAge: 0 // 不使用瀏覽器緩存，確保獲取最新且最精確的位置
        }
      );
    }

    // 低精度定位備選方案（當高精度定位失敗時使用）
    function attemptLowAccuracyLocation() {
      navigator.geolocation.getCurrentPosition(
        function(position) {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          
          // 記錄定位精度資訊
          if (position.coords.accuracy) {
            console.log('低精度定位成功，精度：', Math.round(position.coords.accuracy), '公尺');
          }
          
          // 將位置資訊存入 localStorage
          localStorage.setItem('userLocation', JSON.stringify({ lat: userLat, lng: userLng }));
          localStorage.setItem('userLocationTime', now.toString());
          
          const nearestStore = findNearestStore(userLat, userLng);
          if (nearestStore) {
            renderNearestStore(nearestStore);
            renderOtherStores(nearestStore.name);
          }
        },
        function(error) {
          // 低精度定位也失敗，檢查是否有舊的緩存可以使用
          if (cachedLocation) {
            try {
              const location = JSON.parse(cachedLocation);
              const nearestStore = findNearestStore(location.lat, location.lng);
              if (nearestStore) {
                renderNearestStore(nearestStore);
                renderOtherStores(nearestStore.name);
                return;
              }
            } catch (e) {
              console.warn('使用舊緩存失敗');
            }
          }
          // 如果沒有緩存或緩存無效，顯示所有門市的簡短資訊
          console.warn('無法獲取位置:', error.message);
          renderAllStoresSimple();
        },
        {
          enableHighAccuracy: false, // 使用低精度定位（基於網路或 WiFi），作為備選方案
          timeout: 10000,
          maximumAge: 0
        }
      );
    }

    // 開始嘗試高精度定位
    attemptHighAccuracyLocation();
  }

  // 頁面載入完成後初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
