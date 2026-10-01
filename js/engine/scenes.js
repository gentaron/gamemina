/* ============================================================
   GAMEMINA CHRONICLE ─ Scene Manager / Script Runner
   カットシーン実行・章カード・タイトル・ゲームオーバー
   ============================================================ */
'use strict';
window.GM = window.GM || {};
(function (GM) {
  const U = GM.U, $ = GM.$, el = GM.el, esc = GM.esc;
  const S = GM.state;

  /* ---------------- script runner ---------------- */
  GM.uiOwner = null;

  GM.runScript = async function (id) {
    const script = GM.STORY[id];
    if (!script) { console.warn('script not found:', id); return; }
    const prevScene = S.scene;
    if (prevScene === 'field') S.scene = 'script';
    for (const step of script) {
      const ok = await runStep(step, id);
      if (!ok) break; // 中断（敗北など）
    }
    if (S.scene === 'script') {
      S.scene = 'field';
      GM.Dlg.hide();
      $('hud').classList.remove('hidden');
      GM.updateHUD();
    }
  };

  async function runStep(step, scriptId) {
    switch (step.t) {
      case 'msg':
      case 'narr': {
        const accent = step.t === 'msg' ? (speakerAccent(step.name)) : null;
        await GM.Dlg.show(step.t === 'narr' ? null : step.name, step.text, accent);
        return true;
      }
      case 'card': {
        await showCard(step);
        return true;
      }
      case 'join': {
        if (!S.party.some((m) => m.id === step.who)) {
          const m = GM.makeChar(step.who);
          // 参入時は現パーティ平均Lvに合わせる（償却）
          if (S.party.length) {
            const avg = S.party.reduce((a, p) => a + p.lv, 0) / S.party.length;
            const target = Math.max(1, Math.floor(avg));
            m.lv = Math.min(50, Math.max(m.lv, target));
            while (m.exp < GM.expTotal(m.lv)) m.exp += GM.expToNext(m.lv);
            GM.recalc(m, true);
            GM.learnAt(m);
          }
          S.party.push(m);
          // 参入した仲間は自動で出撃メンバーに入る（最大4人。旧: 手動入れ替え必須）
          if (S.battleParty.length < 4) S.battleParty.push(m);
          syncBattleParty();
        }
        return true;
      }
      case 'leave': {
        S.party = S.party.filter((m) => m.id !== step.who);
        syncBattleParty();
        return true;
      }
      case 'give': {
        GM.addItem(step.item, step.qty || 1);
        GM.AUDIO.sfx('item');
        GM.toast(`${GM.itemName(step.item)} ×${step.qty || 1} を手に入れた！`);
        return true;
      }
      case 'tg': {
        GM.addTG(step.amount);
        GM.AUDIO.sfx(step.amount > 0 ? 'coin' : 'cancel');
        GM.updateHUD();
        return true;
      }
      case 'flag': {
        S.flags[step.key] = step.val;
        if (step.key === 'chapter' && typeof step.val === 'number') S.chapter = step.val;
        return true;
      }
      case 'openGate': {
        S.gates[step.n] = true;
        return true;
      }
      case 'archive': {
        if (!S.archive.includes(step.id)) {
          S.archive.push(step.id);
          const entry = GM.ARCHIVE.find((a) => a.id === step.id);
          if (entry) GM.toast(`アルカイブ: 「${entry.title}」を記録した`, true);
        }
        return true;
      }
      case 'toast': {
        GM.toast(step.text);
        return true;
      }
      case 'music': { GM.AUDIO.playBGM(step.track); return true; }
      case 'stop': { GM.AUDIO.stopBGM(); return true; }
      case 'sfx': { GM.AUDIO.sfx(step.name); return true; }
      case 'fade': {
        GM.fadeTo(step.to === 'black' ? 1 : 0, step.ms || 500);
        await GM.waitFade();
        return true;
      }
      case 'wait': { await GM.wait(step.ms || 500); return true; }
      case 'warp': {
        GM.loadMap(step.map);
        const def = GM.MAPS[step.map];
        // スクリプト指定座標を尊重（無指定や到達不能時は安全地点へ自動補正）
        let ent = (step.x != null && step.y != null) ? { x: step.x, y: step.y }
          : (def && def.entry) || { x: 1, y: 1 };
        ent = GM.safeLanding(def, ent.x, ent.y);
        S.player.x = ent.x; S.player.y = ent.y;
        S.player.px = ent.x * 16; S.player.py = ent.y * 16;
        S.player.dir = 'down';
        S.loc = { map: step.map, x: ent.x, y: ent.y, dir: 'down' };
        GM.centerCam();
        GM.updateHUD();
        return true;
      }
      case 'shop': { await GM.openShop(step.shop); return true; }
      case 'heal': {
        S.party.forEach((m) => { m.hp = m.maxhp; m.mp = m.maxmp; });
        GM.AUDIO.sfx('heal');
        return true;
      }
      case 'clearAuto': { GM.saveTo('auto'); return true; }
      case 'script': { await GM.runScript(step.id); return true; }
      case 'boss': {
        GM.pendingBossKey = GM.pendingBossKey || null;
        const won = await GM.Battle.run([step.boss], { boss: true, noEscape: true });
        if (GM.pendingBossKey) { S.killed[GM.pendingBossKey] = true; GM.pendingBossKey = null; }
        if (!won) { return false; } // game over overlay shown by battle
        return true;
      }
      case 'choice': {
        GM.uiOwner = 'choice';
        const idx = await GM.Choice.show(step.options);
        GM.uiOwner = null;
        await GM.runScript(step.options[idx].script);
        return true;
      }
      case 'branch': {
        if (step.branch) {
          const key = String(S.flags[step.key] != null ? S.flags[step.key] : S.chapter);
          const target = step.branch[key];
          if (target) await GM.runSteps ? GM.runSteps(target) : await runInline(target);
        } else if (step.cond === 'tg10') {
          await runInline(S.tg >= 10 ? step.then : step.else);
        }
        return true;
      }
      case 'endgame': {
        GM.showEnding();
        return false;
      }
      default:
        console.warn('unknown step', step);
        return true;
    }
  }
  async function runInline(steps) {
    for (const st of steps) {
      const ok = await runStep(st);
      if (!ok) break;
    }
  }
  GM.runSteps = runInline;

  function syncBattleParty() {
    const valid = S.battleParty.filter((m) => S.party.includes(m));
    if (valid.length !== S.battleParty.length) S.battleParty = valid;
    if (!S.battleParty.length) S.battleParty = S.party.slice(0, Math.min(4, S.party.length));
  }

  function speakerAccent(name) {
    if (!name) return null;
    if (name.includes('レイラ') || name.includes('アヤカ') || name.includes('カステリア')) return 'c1';
    return 'c2';
  }

  /* ---------------- chapter card ---------------- */
  function showCard(step) {
    return new Promise((res) => {
      const box = $('chapter-card');
      box.innerHTML = `
        <div class="num">${esc(step.num || '')}</div>
        <div class="name">${esc(step.name || '')}</div>
        <div class="sub">${esc(step.sub || '')}</div>`;
      box.classList.remove('hidden');
      GM.AUDIO.sfx('gate');
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        box.classList.add('hidden');
        res();
      };
      const timer = setTimeout(finish, 2600);
      const wait = () => {
        const b = GM.uiOwner ? null : GM.Input.consume();
        if (b === 'a' || b === 'b') { clearTimeout(timer); finish(); return; }
        if (!done) requestAnimationFrame(wait);
      };
      setTimeout(() => requestAnimationFrame(wait), 300);
    });
  }

  /* ---------------- ending ---------------- */
  GM.showEnding = function () {
    const box = $('system-ui');
    box.innerHTML = '';
    const win = el('div', 'win');
    win.innerHTML = `
      <div class="menu-title">GAMEMINA CHRONICLE</div>
      <div style="font-size:10px; line-height:2; color:var(--ink-dim)">
        歴史は正しく「ある」。<br>
        星々の交響曲は、今日も続いていく。<br><br>
        ── GAMEMINA CHRONICLE ──<br>
        Star Symphony of the Eternal Dominion Universe<br><br>
        Original Lore: EDU Text (gentaron/edutext)<br>
        Character Art: gentaron/image (URL indexed)<br>
        Game: GAMEMINA Project<br>
        Thank you for playing!
      </div>
      <div class="sys-actions"><div class="sys-btn" id="end-title">タイトルへ</div></div>`;
    box.appendChild(win);
    box.classList.remove('hidden');
    $('end-title').addEventListener('click', () => {
      box.classList.add('hidden');
      GM.toTitle();
    });
    GM.AUDIO.playBGM('ending');
  };

  /* ---------------- game over ---------------- */
  GM.gameOver = function () {
    S.scene = 'gameover';
    GM.AUDIO.stopBGM();
    GM.AUDIO.playBGM('gameover');
    $('hud').classList.add('hidden');
    const box = $('system-ui');
    box.innerHTML = '';
    const win = el('div', 'win');
    win.innerHTML = `
      <div class="menu-title" style="color:var(--red)">GAME OVER</div>
      <div style="font-size:10px; color:var(--ink-dim); line-height:1.8">
        パーティは全滅した……。<br>
        だが、歴史の記録は残っている。セーブから再開できる。
      </div>
      <div class="sys-actions">
        <div class="sys-btn" id="go-load">最後のセーブから</div>
        <div class="sys-btn" id="go-title">タイトルへ</div>
      </div>`;
    box.appendChild(win);
    box.classList.remove('hidden');
    $('go-title').addEventListener('click', () => { box.classList.add('hidden'); GM.toTitle(); });
    $('go-load').addEventListener('click', () => {
      box.classList.add('hidden');
      const ok = GM.loadGame('auto') && GM.startField();
      if (!ok) GM.toTitle();
    });
  };

  /* ---------------- title screen ---------------- */
  GM.toTitle = function () {
    S.scene = 'title';
    S.script = null;
    GM.AUDIO.playBGM('title');
    const box = $('title');
    const hasSave = ['1', '2', '3'].some((s) => GM.saveMeta(s)) || !!GM.saveMeta('auto');
    // キャラポートレートストリップ（URL索引）
    let castHtml = '';
    if (GM.Portraits) {
      GM.Portraits.warm();
      ['layla', 'gentaro', 'mina', 'jen', 'ayaka', 'myu', 'iris', 'casteria'].forEach((id) => {
        const url = GM.Portraits.url(id);
        if (url) castHtml += `<img src="${url}" alt="" loading="lazy" onerror="this.style.display='none'">`;
      });
    }
    box.innerHTML = `
      <div class="t-logo">
        <div class="t-top">ETERNAL DOMINION RPG</div>
        <div class="t-main">GAMEMINA<br>CHRONICLE</div>
        <div class="t-sub">星々の交響曲</div>
        <div class="t-crown">SYMPHONY OF STARS</div>
      </div>
      <div class="t-menu" id="t-menu"></div>
      <div class="t-cast" id="t-cast">${castHtml}</div>
      <div class="t-foot"><span class="t-keyhint">↑↓ 移動　Z / Enter 決定　X / Esc キャンセル　C メニュー　F 全画面</span><br>10 CHAPTERS / 8 PARTY MEMBERS / OFFLINE PWA ─ art: github.com/gentaron/image</div>
      <div class="t-fs" id="t-fs" title="フルスクリーン切替 (F)">⛶ 全画面</div>
      <div class="t-inst hidden" id="t-install">⬇ インストール</div>`;
    box.classList.remove('hidden');
    const tfs = $('t-fs');
    if (tfs) tfs.addEventListener('click', () => GM.toggleFullscreen());

    const items = [
      { label: 'NEW GAME', act: newGame },
      { label: 'CONTINUE', act: continueGame, dis: !hasSave },
      { label: 'ALMANAC', act: almanacFromTitle, dis: !hasSave }
    ];
    const menu = $('t-menu');
    let idx = 0;
    items.forEach((it, i) => {
      const d = el('div', 't-item' + (i === idx ? ' sel' : '') + (it.dis ? ' dis' : ''), it.label);
      d.addEventListener('click', () => { if (!it.dis) { idx = i; update(); it.act(); } });
      menu.appendChild(d);
    });
    const update = () => [...menu.children].forEach((c, i) => c.classList.toggle('sel', i === idx));
    const nav = () => {
      if (S.scene !== 'title') return;
      const b = GM.uiOwner ? null : GM.Input.consume();
      if (b === 'up') { do { idx = (idx + items.length - 1) % items.length; } while (items[idx].dis); GM.AUDIO.sfx('cursor'); update(); }
      else if (b === 'down') { do { idx = (idx + 1) % items.length; } while (items[idx].dis); GM.AUDIO.sfx('cursor'); update(); }
      else if (b === 'a') { if (!items[idx].dis) { GM.AUDIO.sfx('confirm'); items[idx].act(); return; } }
      requestAnimationFrame(nav);
    };
    requestAnimationFrame(nav);

    // install prompt
    if (GM.deferredInstall) {
      const inst = $('t-install');
      inst.classList.remove('hidden');
      inst.addEventListener('click', async () => {
        GM.deferredInstall.prompt();
        await GM.deferredInstall.userChoice;
        GM.deferredInstall = null;
        inst.classList.add('hidden');
      });
    }
  };

  function newGame() {
    // reset state
    const s = GM.state;
    s.party = []; s.battleParty = []; s.items = {}; s.tg = 300;
    s.flags = {}; s.gates = {}; s.archive = []; s.chapter = 0;
    s.opened = {}; s.killed = {}; s.steps = 0;
    s.map = null; s.mapId = null;
    $('hud').classList.add('hidden');
    $('title').classList.add('hidden');
    s.scene = 'field'; // runScript が script シーンへ遷移する
    GM.runScript('prologue_intro');
  }

  async function continueGame() {
    $('title').classList.add('hidden');
    GM.uiOwner = 'save';
    const slot = await GM.SaveDialog.show('load');
    GM.uiOwner = null;
    if (slot == null) { GM.toTitle(); return; }
    const ok = GM.loadGame(slot);
    if (ok) {
      GM.startField();
    } else { GM.toast('ロードに失敗しました', true); GM.toTitle(); }
  }

  async function almanacFromTitle() {
    GM.uiOwner = 'menu';
    await GM.Menu.showArchiveOnly();
    GM.uiOwner = null;
  }

  GM.titleItems = null;

})(window.GM);
