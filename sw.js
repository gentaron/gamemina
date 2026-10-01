/* ============================================================
   GAMEMINA CHRONICLE ─ Service Worker
   Strategy:
   - Precache: 全アセットをインストール時に取得（完全オフライン動作）
   - Fetch: cache-first + バックグラウンド更新（stale-while-revalidate）
   - Navigation: index.html へフォールバック
   - バージョン管理: CACHE 名を更新することで旧キャッシュを自動削除
   ============================================================ */
'use strict';

const VERSION = 'v1.2.0';
const CACHE_NAME = `gamemina-chronicle-${VERSION}`;
const IMG_CACHE = `gamemina-images-${VERSION}`;
const IMG_ORIGIN = 'https://raw.githubusercontent.com';
const OFFLINE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/audio.js',
  './js/sprites.js',
  './js/main.js',
  './js/data/abilities.js',
  './js/data/enemyart.js',
  './js/data/items.js',
  './js/data/characters.js',
  './js/data/enemies.js',
  './js/data/maps.js',
  './js/data/portraits.js',
  './js/data/story.js',
  './js/engine/core.js',
  './js/engine/mapfix.js',
  './js/engine/ui.js',
  './js/engine/save.js',
  './js/engine/scenes.js',
  './js/engine/field.js',
  './js/engine/battle.js',
  './js/engine/menu.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.png'
];

/* install: precache all */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // 個別に取得し、1つ失敗してもインストール自体は継続（頑健性重視）
    await Promise.allSettled(OFFLINE_URLS.map((url) =>
      cache.add(new Request(url, { cache: 'reload' }))
    ));
    await self.skipWaiting();
  })());
});

/* activate: purge old caches */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((n) => n.startsWith('gamemina-chronicle-') && n !== CACHE_NAME)
      .map((n) => caches.delete(n)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.disable(); } catch (_) {}
    }
    await self.clients.claim();
  })());
});

/* fetch: cache-first with background refresh */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // navigation
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (_) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('./index.html')) || (await cache.match('./')) ||
          new Response('<h1>Offline</h1><p>一度オンラインで起動してください。</p>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 });
      }
    })());
    return;
  }

  // same-origin assets
  if (new URL(req.url).origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => undefined);
      return cached || (await fetchPromise) || new Response('', { status: 504 });
    })());
    return;
  }

  // キャライラスト (raw.githubusercontent.com): cache-first + 背景更新 → オフラインでも表示
  if (req.url.startsWith(IMG_ORIGIN) && req.destination === 'image') {
    event.respondWith((async () => {
      const cache = await caches.open(IMG_CACHE);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => undefined);
      return cached || (await fetchPromise) || new Response('', { status: 504 });
    })());
  }
});

/* message: skip waiting / version query */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'GET_VERSION') {
    event.source.postMessage({ type: 'VERSION', version: VERSION });
  }
});
