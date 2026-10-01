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

  /* title background: drifting starfield + big moon (動的ビューポート対応) */
  const stars = [];
  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 130; i++) {
      stars.push({ x: Math.random() * GM.VW, y: Math.random() * GM.VH, s: Math.random() < 0.85 ? 1 : 2, v: 4 + Math.random() * 14 });
    }
  }
  seedStars();
  GM.onViewportChange = (function (prev) {
    return function () { seedStars(); if (prev) prev(); };
  })(typeof GM.onViewportChange === 'function' ? GM.onViewportChange : null);
  function renderTitleBG(c, tick) {
    const VW = GM.VW, VH = GM.VH;
    c.fillStyle = '#05070f';
    c.fillRect(0, 0, VW, VH);
    // nebula
    const g = c.createRadialGradient(VW / 2, VH + 36, 40, VW / 2, VH + 36, 320);
    g.addColorStop(0, 'rgba(60,110,255,.28)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, VW, VH);
    // stars
    c.fillStyle = '#cfe0ff';
    stars.forEach((s) => {
      s.x -= s.v * 0.016;
      if (s.x < 0) s.x = VW;
      c.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(tick / 900 + s.x));
      c.fillRect(Math.floor(s.x), Math.floor(s.y), s.s, s.s);
    });
    c.globalAlpha = 1;
    // twin stars (Ea16 + Eb16)
    const mx = VW - 90;
    c.fillStyle = '#ffd98a';
    c.beginPath(); c.arc(mx, 60, 18, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,217,138,.25)';
    c.beginPath(); c.arc(mx, 60, 26, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff8a6a';
    c.beginPath(); c.arc(mx + 40, 92, 7, 0, Math.PI * 2); c.fill();
    // crystal silhouette (中央)
    const cxm = Math.round(VW / 2);
    c.fillStyle = 'rgba(244,201,93,.9)';
    c.fillRect(cxm - 8, 236, 16, 40);
    c.fillRect(cxm - 14, 250, 28, 26);
    c.fillStyle = 'rgba(255,232,160,.9)';
    c.fillRect(cxm - 2, 244, 4, 28);
    if (GM.state.fade.a > 0) {
      c.fillStyle = `rgba(0,0,0,${GM.state.fade.a})`;
      c.fillRect(0, 0, VW, VH);
    }
  }

  /* ---------------- boot ---------------- */
  function boot() {
    GM.normalizeMaps();

    /* ---- 起動時自己診断（内蔵テスト環境） ----
       データ整合性の致命的問題を起動 1 回で検出し、開発者に通知する。
       プレイヤー体験は損なわない（失敗は console とトースト 1 回のみ）。 */
    let bootQA = null;
    try {
      if (GM.QA) {
        bootQA = GM.QA.bootCheck();
        if (!bootQA.ok) {
          console.error('[QA] 起動時自己診断で異常を検出:', bootQA.errors);
          setTimeout(() => GM.toast('⚠ 内部整合性チェックで異常（詳細はコンソール）', true), 1500);
        } else {
          console.log(`[QA] 起動時自己診断 OK ─ ${bootQA.checked} 項目`);
        }
      }
    } catch (e) { console.warn('[QA] bootCheck 例外', e); }

    GM.AUDIO.loadSettings();
    GM.startLoop();
    GM.toTitle();

    /* ---- URL パラメータハンドリング ---- */
    try {
      const params = new URLSearchParams(location.search);
      // ?debug=1 → デバッグコンソール
      if (params.get('debug') === '1' && GM.Debug) GM.Debug.enable();
      else {
        let dbg = null; try { dbg = localStorage.getItem('gm_debug'); } catch (e) {}
        if (dbg === '1' && GM.Debug) GM.Debug.enable();
      }
      // ?test=1 → 内蔵 QA コンソールを自動オープン
      if (params.get('test') === '1' && GM.QA && GM.QA.openConsole) {
        setTimeout(() => GM.QA.openConsole(true), 400);
      }
      // ?action=continue（PWA ショートカット）→ オートセーブから直接再開
      if (params.get('action') === 'continue' && GM.saveMeta('auto')) {
        setTimeout(() => {
          if (GM.state.scene !== 'title') return;
          if (GM.loadGame('auto')) {
            document.getElementById('title').classList.add('hidden');
            GM.startField();
          }
        }, 250);
      }
    } catch (e) { console.warn('URL param handling failed', e); }

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

    // ☰ メニューボタン（これまでハンドラが無く無反応だったバグを修正）
    const menuBtn = $('btn-menu');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        if (GM.state.scene === 'field' && !GM.uiOwner && !GM.dialogueOpen()) {
          GM.AUDIO.sfx('open');
          GM.Menu.open();
        }
        menuBtn.blur();
      });
    }
    // ⛶ フルスクリーンボタン
    const fsBtn = $('btn-fs');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        GM.toggleFullscreen();
        fsBtn.blur();
      });
    }
    // 会話ウィンドウのクリックで送り（PCマウス操作対応）
    const dlgEl = $('dialogue');
    if (dlgEl) {
      dlgEl.addEventListener('click', () => {
        if (GM.dialogueOpen() && !GM.uiOwner) {
          GM.AUDIO.sfx('cursor');
          GM.dialogueAdvance();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else boot();

})(window.GM);
