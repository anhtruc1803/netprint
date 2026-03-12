// NetPrint CRM - Service Worker
// Phiên bản cache - thay đổi để force update
const CACHE_VERSION = 'netprint-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Các file static cần cache ngay khi install
const STATIC_ASSETS = [
  '/',
  '/logo/logo-icon.png',
  '/logo/logo-full.png',
  '/logo/logo-single.png',
  '/favicon.ico',
];

// Các pattern URL KHÔNG cache (API calls, etc.)
const NO_CACHE_PATTERNS = [
  '/api/',
  'chrome-extension',
  'hot-update',
  '__vite',
];

// ============================================
// INSTALL - Cache các static assets
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] 📦 Installing Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] ✅ Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activate ngay lập tức
  );
});

// ============================================
// ACTIVATE - Xóa cache cũ
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] 🚀 Activating Service Worker...');
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => {
              console.log(`[SW] 🗑️ Deleting old cache: ${key}`);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim()) // Chiếm quyền điều khiển ngay
  );
});

// ============================================
// FETCH - Chiến lược Network First, fallback Cache
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bỏ qua các request không cần cache
  if (NO_CACHE_PATTERNS.some((pattern) => request.url.includes(pattern))) {
    return;
  }

  // Chỉ cache GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Chỉ cache same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Navigation requests (HTML pages) - Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache bản mới nhất
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Offline → lấy từ cache
          return caches.match(request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts) - Network First (luôn lấy bản mới nhất)
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Lưu bản mới vào cache cho offline
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Offline → lấy từ cache
          return caches.match(request);
        })
    );
    return;
  }

  // Mặc định - Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ============================================
// MESSAGE - Nhận message từ app
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
