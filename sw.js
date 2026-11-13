const CACHE_VERSION = 'v1';
const CACHE_STATIC  = `glubokoe-static-${CACHE_VERSION}`;
const CACHE_MEDIA   = `glubokoe-media-${CACHE_VERSION}`;
const CACHE_RUNTIME = `glubokoe-runtime-${CACHE_VERSION}`;

/* ── Файлы App Shell: критичны для запуска офлайн ── */
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './data.json',
  './js/page-flip.browser.js',
  './js/fancybox.umd.js',
  './js/qr-code-styling.js',
  './css/fancybox.css',
  './page-flip-sound.mp3',
  './img/ornament-corner.svg',
  './img/ornament-strip.svg',
  './img/linen-bg.jpg',
  './img/cover-front.png',
  './img/cover-back.png'
];

/* ── Медиа, которое кэшируем лениво (по первому запросу) ── */
const MEDIA_EXT = /\.(?:mp4|webm|ogg|vtt|png|jpe?g|gif|webp|svg|woff2?|ttf|eot|ico)$/i;

/* ────────────────────────────────────────────────
   INSTALL: кэшируем App Shell по одному файлу,
   чтобы один отсутствующий не сломал всю установку.
   ──────────────────────────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_STATIC);
    let ok = 0, fail = 0;

    for (const url of APP_SHELL) {
      try {
        const response = await fetch(url, { cache: 'no-cache' });
        if (response.ok) {
          await cache.put(url, response);
          ok++;
        } else {
          console.warn('[SW] Не 200 OK:', url, response.status);
          fail++;
        }
      } catch (e) {
        console.warn('[SW] Не удалось закэшировать:', url, e.message);
        fail++;
      }
    }
    console.log(`[SW] App Shell: ${ok} ok, ${fail} fail`);
    await self.skipWaiting();
  })());
});

/* ────────────────────────────────────────────────
   ACTIVATE: удаляем старые версии кэшей
   ──────────────────────────────────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => !key.endsWith(CACHE_VERSION))
        .map((key) => {
          console.log('[SW] Удаляю старый кэш:', key);
          return caches.delete(key);
        })
    );
    await self.clients.claim();
  })());
});

/* ────────────────────────────────────────────────
   FETCH: маршрутизация запросов
   ──────────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Кэшируем только GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Пропускаем запросы chrome-extension, DevTools и т.п.
  if (!url.protocol.startsWith('http')) return;

  // ── 1. Навигация (открытие страницы) ──
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigate(request));
    return;
  }

  // ── 2. Google Fonts и другие внешние домены ──
  if (url.origin !== self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, CACHE_RUNTIME));
    return;
  }

  // ── 3. Медиа (видео, картинки, шрифты, VTT) ──
  if (MEDIA_EXT.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_MEDIA));
    return;
  }

  // ── 4. JSON: критично для старта, Cache First ──
  if (url.pathname.endsWith('.json')) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // ── 5. Всё остальное (CSS, JS) — Cache First ──
  event.respondWith(cacheFirst(request, CACHE_STATIC));
});

/* ────────────────────────────────────────────────
   Стратегии
   ──────────────────────────────────────────────── */

/** Cache First: сначала кэш, потом сеть. Найденное в сети кладём в кэш. */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Если офлайн и нет в кэше — вернём заглушку для медиа
    if (MEDIA_EXT.test(new URL(request.url).pathname)) {
      return new Response('', { status: 404, statusText: 'Offline' });
    }
    throw err;
  }
}

/** Stale-While-Revalidate: отдаём из кэша, параллельно обновляем. */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: true });

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached); // при офлайне вернём кэш

  return cached || fetchPromise;
}

/** Навигация: сначала кэш index.html, потом сеть. */
async function handleNavigate(request) {
  const cache = await caches.open(CACHE_STATIC);

  // Пытаемся найти точное совпадение (например, /index.html)
  const exact = await cache.match(request, { ignoreSearch: true });
  if (exact) return exact;

  // Иначе отдаём ./index.html — это универсальный fallback для SPA
  const fallback = await cache.match('./index.html', { ignoreSearch: true });
  if (fallback) return fallback;

  try {
    return await fetch(request);
  } catch (err) {
    return new Response(
      '<h1>Офлайн</h1><p>Страница недоступна без интернета.</p>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

/* ────────────────────────────────────────────────
   Сообщения от страницы: команды обновления
   ──────────────────────────────────────────────── */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
});