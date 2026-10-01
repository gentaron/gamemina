/* ============================================================
   GAMEMINA CHRONICLE ─ UI 結合テスト (ブラウザ専用)
   ============================================================
   実際の DOM 上で動く結合テスト。test.html と ?test=1 から実行。
   Node CLI ではロードされない（document が無いため）。
   ============================================================ */
'use strict';
(function (GM) {
  if (!GM || !GM.QA || typeof document === 'undefined') return;

  const QA = GM.QA;

  QA.suite('UI ─ DOM 結合', function (t) {

    t('必須 UI 要素が全て存在する', () => {
      const ids = ['screen', 'game', 'ui', 'hud', 'hud-chapter', 'hud-token', 'btn-fs', 'btn-menu',
        'dialogue', 'dlg-name', 'dlg-text', 'dlg-next', 'dlg-portrait', 'dlg-img',
        'choice', 'battle-ui', 'bat-log', 'bat-party', 'bat-cmd', 'bat-abil', 'bat-item', 'bat-target',
        'menu', 'shop', 'system-ui', 'boss-intro', 'boss-intro-name', 'boss-intro-sub',
        'chapter-card', 'title', 'toasts', 'touch', 'dpad', 'tb-a', 'tb-b', 'tb-m', 'offline-banner'];
      const missing = ids.filter((id) => !document.getElementById(id));
      if (missing.length) throw new Error('欠落: ' + missing.join(', '));
    });

    t('ゲームキャンバスが 2D コンテキストを持ち、ビューポートに追従している', () => {
      const cv = document.getElementById('game');
      const ctx = cv.getContext('2d');
      if (!ctx) throw new Error('2D コンテキストが取得できない');
      if (cv.width < 480 || cv.height < 304) throw new Error(`キャンバスが最小解像度未満: ${cv.width}x${cv.height}`);
      if (!GM.VW || !GM.VH) throw new Error('動的ビューポート (GM.VW/VH) が未初期化');
    });

    t('HUD 更新: 章・所持金が DOM へ反映される', () => {
      GM.state.tg = 7777;
      GM.updateHUD();
      if (!/7,?777/.test(document.getElementById('hud-token').textContent)) {
        throw new Error('所持金が HUD に反映されていない: ' + document.getElementById('hud-token').textContent);
      }
    });

    t('MENU ボタン (#btn-menu) のクリックでメニューが開閉する', () => {
      const keepScene = GM.state.scene;
      const keepOwner = GM.uiOwner;
      try {
        GM.state.scene = 'field';
        GM.uiOwner = null;
        const btn = document.getElementById('btn-menu');
        btn.click();
        const menu = document.getElementById('menu');
        if (menu.classList.contains('hidden')) throw new Error('MENU が開かない');
        if (GM.uiOwner !== 'menu') throw new Error('uiOwner が menu になっていない');
        // 全タブが描画されていること
        if (!menu.querySelectorAll('.mrow').length) throw new Error('メニュー行が描画されていない');
        GM.Menu.close();
        if (!menu.classList.contains('hidden')) throw new Error('MENU が閉じない');
      } finally {
        GM.state.scene = keepScene;
        GM.uiOwner = keepOwner;
        document.getElementById('menu').classList.add('hidden');
      }
    });

    t('メニューのセーブタブに SAVE/LOAD ボタンがあり、SAVE が動作する', () => {
      const keepScene = GM.state.scene;
      const keepOwner = GM.uiOwner;
      try {
        GM.state.scene = 'field';
        GM.uiOwner = null;
        GM.state.party = [GM.makeChar('layla')];
        GM.state.battleParty = GM.state.party.slice();
        GM.state.tg = 555;
        GM.Menu.open();
        const menu = document.getElementById('menu');
        // セーブタブをクリック
        const rows = [...menu.querySelectorAll('.mrow')];
        const saveTab = rows.find((r) => r.textContent === 'セーブ');
        if (!saveTab) throw new Error('セーブタブが見つからない');
        saveTab.click();
        const btns = [...menu.querySelectorAll('.slot-btn')];
        const saveBtns = btns.filter((b) => b.textContent === 'SAVE');
        if (saveBtns.length < 4) throw new Error(`SAVE ボタンが ${saveBtns.length} 個しか無い（4 スロット必要）`);
        saveBtns[1].click(); // SLOT 1 に保存
        const meta = GM.saveMeta('1');
        if (!meta) throw new Error('メニューからのセーブが記録されていない（旧: クリック無反応バグ）');
        if (meta.tg !== 555) throw new Error('セーブ内容が不正');
        try { localStorage.removeItem('gm_save_1'); } catch (e) {}
      } finally {
        GM.state.scene = keepScene;
        GM.uiOwner = keepOwner;
        document.getElementById('menu').classList.add('hidden');
      }
    });

    t('会話ウィンドウ: 表示 → 送り → 解除のライフサイクル', async () => {
      const p = GM.Dlg.show('テスト者', 'これはQAテストの会話です。');
      if (document.getElementById('dialogue').classList.contains('hidden')) throw new Error('会話ウィンドウが表示されない');
      if (!GM.dialogueOpen()) throw new Error('dialogueOpen が true にならない');
      // 送り操作（タイプ中の tap は全表示のみ → 解除されるまで連打する）
      for (let i = 0; i < 20 && GM.dialogueOpen(); i++) {
        GM.dialogueAdvance();
        await new Promise((r) => setTimeout(r, 30));
      }
      await p;
      GM.Dlg.hide();
      if (!document.getElementById('dialogue').classList.contains('hidden')) throw new Error('hide しても非表示にならない');
    });

    t('バトル UI: パーティ行が battleParty と一致して描画される', () => {
      const keep = GM.state.battleParty;
      try {
        GM.state.battleParty = [GM.makeChar('layla'), GM.makeChar('gentaro')];
        GM.state.battleParty.forEach((m) => { m.hp = m.maxhp; });
        GM.BatUI.buildParty();
        const rows = document.getElementById('bat-party').children;
        if (rows.length !== 2) throw new Error(`パーティ行が ${rows.length} 行（期待 2）`);
        GM.BatUI.log('QAテスト');
        if (document.getElementById('bat-log').textContent !== 'QAテスト') throw new Error('ログが反映されない');
      } finally {
        GM.state.battleParty = keep;
        document.getElementById('battle-ui').classList.add('hidden');
      }
    });

    t('セーブダイアログ: 4 スロットが描画され、キャンセルで null を返す', async () => {
      GM.uiOwner = 'qa';
      try {
        const p = GM.SaveDialog.show('load');
        const box = document.getElementById('system-ui');
        const slots = box.querySelectorAll('.slot-row');
        if (slots.length < 4) throw new Error(`スロット行が ${slots.length}（期待 4）`);
        const cancel = [...box.querySelectorAll('.sys-btn')].find((b) => b.textContent === 'キャンセル');
        if (!cancel) throw new Error('キャンセルボタンが無い');
        cancel.click();
        const r = await p;
        if (r !== null) throw new Error('キャンセルが null を返さない');
      } finally {
        GM.uiOwner = null;
        document.getElementById('system-ui').classList.add('hidden');
      }
    });

    t('フルスクリーンボタンと三本線ボタンに title / aria-label がある（ユーザー理解性）', () => {
      const fs = document.getElementById('btn-fs');
      const mb = document.getElementById('btn-menu');
      if (!fs.getAttribute('aria-label') || !fs.getAttribute('title')) throw new Error('⛶ボタンの説明が無い');
      if (!mb.getAttribute('aria-label') || !mb.getAttribute('title')) throw new Error('☰ボタンの説明が無い');
      if (!mb.textContent.includes('MENU')) throw new Error('☰ボタンに MENU ラベルが無い（三本線の正体が分からない問題の再発）');
    });

    t('タッチコントロール: 全ボタンが入力にバインド済み', () => {
      // bindHold は pointerdown をバインドする ─ リスナー検出は getEventListeners が無い為
      // クリック→Input 状態変化で検証
      const a = document.getElementById('tb-a');
      a.dispatchEvent(new Event('pointerdown'));
      if (!GM.Input.tm.a && !GM.Input.queue.includes('a')) {
        throw new Error('A ボタンの pointerdown が入力に反映されない');
      }
      GM.Input.releaseAll();
    });

    t('マニフェストが有効な JSON で必須フィールドを持つ', async () => {
      const res = await fetch('manifest.webmanifest');
      if (!res.ok) throw new Error('manifest 取得失敗: ' + res.status);
      const m = await res.json();
      ['name', 'short_name', 'start_url', 'display', 'icons'].forEach((k) => {
        if (!m[k]) throw new Error('manifest に ' + k + ' が無い');
      });
      if (!m.icons.some((i) => i.src.includes('512'))) throw new Error('512px アイコンが無い');
    });

    t('Service Worker: 登録状態を確認（https 環境のみ / 未登録は警告）', async () => {
      if (!('serviceWorker' in navigator)) { t.warn('この環境に SW API が無い'); return; }
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) { t.warn('SW 未登録（file:// や http localhost では正常）'); return; }
      if (!reg.active && !reg.installing && !reg.waiting) throw new Error('SW の状態が不正');
    }, ['env']);

    t('起動時自己診断 (bootCheck) が GREEN を返す', () => {
      const out = GM.QA.bootCheck();
      if (!out.ok) throw new Error('起動時自己診断に失敗: ' + out.errors.join(' / '));
      if (out.checked < 10) throw new Error('自己診断の実行チェック数が少なすぎる: ' + out.checked);
    });
  });
})(window.GM);
