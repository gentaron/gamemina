/* ============================================================
   MINA CHRONICLE Service Worker
   - 全アセット先読み（プレキャッシュ）で完全オフライン対応
   - バージョン管理 + 古いキャッシュ自動削除
   - ナビゲーションは network-first → cache fallback
   ============================================================ */
'use strict';

const VERSION = 'mina-chronicle-v1.0.0';
const CACHE = VERSION;
const CORE = [
  './',
  './index.html',
  './404.html',
  './manifest.webmanifest',
  './favicon.svg',
  './css/game.css',
  './js/data_core.js',
  './js/data_enemies.js',
  './js/data_maps.js',
  './js/data_story_a.js',
  './js/data_story_b.js',
  './js/audio.js',
  './js/engine.js',
  './js/field.js',
  './js/menu.js',
  './js/story.js',
  './js/battle.js',
  './js/main.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/screenshot-wide.png',
  './icons/screenshot-narrow.png'
];

/* インストール：全リソースをキャッシュ */
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // 失敗しても SW 導入は継続（個別に追加）
    await Promise.allSettled(CORE.map(url => cache.add(url)));
    self.skipWaiting();
  })());
});

/* アクティベート：旧キャッシュ削除 */
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* フェッチ戦略 */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 同一オリジンのみ処理
  if (url.origin !== location.origin) return;

  // ページナビゲーション: network-first → cache → index.html
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match(req)) ||
               (await cache.match('./index.html')) ||
               (await cache.match('./')) ||
               new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  // 静的アセット: cache-first → network（取得できたらキャッシュ更新）
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    if (hit) {
      // バックグラウンドで更新（stale-while-revalidate）
      fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); }).catch(()=>{});
      return hit;
    }
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      return new Response('', { status: 504 });
    }
  })());
});

/* メッセージ：即座アップデート */
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
