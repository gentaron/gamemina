/* ============================================================
   GAMEMINA CHRONICLE ─ Main / Boot
   ループ制御・サービスワーカー登録・インストール促し
   ============================================================ */
'use strict';
window.GM = window.GM || {};
(function (GM) {
  const $ = GM.$;

  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  GM.Dlg.init();
  GM.bindTouch();
  GM.fitScreenFn = null;

  /* ---------------- global frame ---------------- */
  GM.onFrame((dt, tick) => {
    // dialogue advance handling (A button) when no other UI owns input
    if (!GM.uiOwner && GM.dialogueOpen()) {
      const b = GM.Input.consume();
      if (b === 'a' || b === 'b') {
        GM.AUDIO.sfx('cursor');
        GM.dialogueAdvance();
      }
    }
    switch (GM.state.scene) {
      case 'field':
      case 'script':
        GM.Field.update(dt);
        GM.Field.render(ctx);
        break;
      case 'battle':
        GM.Battle.update(dt);
        GM.Battle.render(ctx);
        break;
      case 'title':
        renderTitleBG(ctx, tick);
        break;
      default:
        // gameover etc: keep last frame, render field behind
        if (GM.state.map) GM.Field.render(ctx);
    }
  });

  /* title background: drifting starfield + big moon */
  const stars = [];
  for (let i = 0; i < 90; i++) {
    stars.push({ x: Math.random() * 480, y: Math.random() * 304, s: Math.random() < 0.85 ? 1 : 2, v: 4 + Math.random() * 14 });
  }
  function renderTitleBG(c, tick) {
    c.fillStyle = '#05070f';
    c.fillRect(0, 0, 480, 304);
    // nebula
    const g = c.createRadialGradient(240, 340, 40, 240, 340, 320);
    g.addColorStop(0, 'rgba(60,110,255,.28)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 480, 304);
    // stars
    c.fillStyle = '#cfe0ff';
    stars.forEach((s) => {
      s.x -= s.v * 0.016;
      if (s.x < 0) s.x = 480;
      c.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(tick / 900 + s.x));
      c.fillRect(Math.floor(s.x), Math.floor(s.y), s.s, s.s);
    });
    c.globalAlpha = 1;
    // twin stars (Ea16 + Eb16)
    c.fillStyle = '#ffd98a';
    c.beginPath(); c.arc(390, 60, 18, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,217,138,.25)';
    c.beginPath(); c.arc(390, 60, 26, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff8a6a';
    c.beginPath(); c.arc(430, 92, 7, 0, Math.PI * 2); c.fill();
    // crystal silhouette
    c.fillStyle = 'rgba(244,201,93,.9)';
    c.fillRect(232, 236, 16, 40);
    c.fillRect(226, 250, 28, 26);
    c.fillStyle = 'rgba(255,232,160,.9)';
    c.fillRect(238, 244, 4, 28);
    if (GM.state.fade.a > 0) {
      c.fillStyle = `rgba(0,0,0,${GM.state.fade.a})`;
      c.fillRect(0, 0, 480, 304);
    }
  }

  /* ---------------- boot ---------------- */
  function boot() {
    GM.normalizeMaps();
    GM.AUDIO.loadSettings();
    GM.startLoop();
    GM.toTitle();

    // unlock audio on first gesture
    const unlockOnce = () => { GM.AUDIO.unlock(); };
    window.addEventListener('pointerdown', unlockOnce, { once: true });
    window.addEventListener('keydown', unlockOnce, { once: true });

    // SW（本番環境のみ。localhost開発では無効）
    if ('serviceWorker' in navigator) {
      const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(location.hostname) || location.protocol === 'file:';
      if (!isLocal) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      }
    }

    // offline banner
    const banner = $('offline-banner');
    const updateOnline = () => {
      if (!navigator.onLine) banner.classList.remove('hidden');
      else banner.classList.add('hidden');
    };
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    updateOnline();

    // install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      GM.deferredInstall = e;
    });
    window.addEventListener('appinstalled', () => { GM.deferredInstall = null; });

    // prevent context menu / selection on game area
    $('screen').addEventListener('contextmenu', (e) => e.preventDefault());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else boot();

})(window.GM);
