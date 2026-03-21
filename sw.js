const CACHE_NAME = 'multix-code-shell-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/logo.svg'//,
    //'/icon-192.png',
    //'/icon-512.png'
];

// 1. Встановлення Service Worker та кешування файлів
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('MULTIX PWA: Кешування ядра середовища');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 2. Очищення старого кешу при оновленні версії
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('MULTIX PWA: Видалення старого кешу', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. Перехоплення запитів: Стратегія "Кеш спочатку, потім мережа"
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Якщо файл є в кеші (наприклад, стиль чи HTML) - віддаємо його миттєво
            if (cachedResponse) {
                return cachedResponse;
            }
            // Якщо ні (наприклад, API запит до GitHub) - йдемо в мережу
            return fetch(event.request);
        })
    );
});
