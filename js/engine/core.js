/* ============================================================
   GAMEMINA CHRONICLE ─ Engine Core
   入力（キーボード/タッチ/ゲームパッド）/ ゲームループ / 状態 / ユーティリティ
   ============================================================ */
'use strict';
window.GM = window.GM || {};
(function (GM) {

  /* ---------------- dynamic viewport ----------------
     画面比率に合わせて解像度を拡張 → 黒帯なしの全画面表示 */
  GM.VW = 480; GM.VH = 304;

  /* ---------------- global game state ---------------- */
  const state = {
    scene: 'boot',           // boot | title | field | script | battle
    mapId: null, map: null,
    player: { x: 4, y: 4, dir: 'down', moving: false, px: 64, py: 64, frame: 0, animT: 0 },
    cam: { x: 0, y: 0 },
    party: [],               // charState[]
    battleParty: [],         // 参加中の charState (max4)
    items: {},
    tg: 300,
    flags: {},
    gates: {},               // n -> true
    archive: [],
    chapter: 0,
    steps: 0, encThreshold: 20,
    opened: {},              // chest key -> true
    killed: {},              // boss key -> true
    script: null,            // 実行中カットシーン
    fade: { a: 0, target: 0, speed: 0.002 },
    tick: 0,
    result: null
  };
  GM.state = state;

  /* ---------------- utils ---------------- */
  const U = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    rand: (a, b) => a + Math.random() * (b - a),
    randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    chance: (p) => Math.random() < p,
    pct: (v, max) => max <= 0 ? 0 : v / max,
    fmt: (n) => n.toLocaleString('ja-JP')
  };
  GM.U = U;

  /* ---------------- input ----------------
     キーボード / タッチ / ゲームパッドのソースを分離し、
     held は毎回合成する（ゲームパッドによる上書きバグを廃止） */
  const KEYS = ['up', 'down', 'left', 'right', 'a', 'b', 'menu'];
  const blankMap = () => KEYS.reduce((o, k) => (o[k] = false, o), {});
  const Input = {
    queue: [],
    kb: blankMap(),   // keyboard
    tm: blankMap(),   // touch / mouse buttons
    gp: blankMap(),   // gamepad
    held: blankMap(), // 合成
    _sync() { for (const k of KEYS) this.held[k] = this.kb[k] || this.tm[k] || this.gp[k]; },
    push(btn) { this.queue.push(btn); },
    consume() { return this.queue.shift() || null; },
    clear() { this.queue.length = 0; },
    releaseAll() {
      for (const k of KEYS) this.kb[k] = this.tm[k] = this.gp[k] = this.held[k] = false;
      this.clear();
      document.querySelectorAll('#touch .on').forEach((b) => b.classList.remove('on'));
    }
  };
  GM.Input = Input;
  const isDirKey = (b) => b === 'up' || b === 'down' || b === 'left' || b === 'right';

  const KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
    z: 'a', Z: 'a', Enter: 'a', ' ': 'a',
    x: 'b', X: 'b', Escape: 'b', Backspace: 'b',
    c: 'menu', C: 'menu', m: 'menu', M: 'menu', Tab: 'menu',
    f: 'fs', F: 'fs'
  };
  window.addEventListener('keydown', (e) => {
    const btn = KEYMAP[e.key];
    if (!btn) return;
    e.preventDefault();
    GM.AUDIO.unlock();
    if (btn === 'fs') { GM.toggleFullscreen(); return; }
    if (!Input.kb[btn]) { Input.kb[btn] = true; Input._sync(); Input.push(btn); }
    else if (isDirKey(btn)) {
      // OSリピートはキュー最大2に制限（入力滞留バグ防止）
      let n = 0; for (const q of Input.queue) if (q === btn) n++;
      if (n < 2) Input.push(btn);
    }
  });
  window.addEventListener('keyup', (e) => {
    const btn = KEYMAP[e.key];
    if (btn && btn !== 'fs') { Input.kb[btn] = false; Input._sync(); }
  });
  /* Alt+Tab等でフォーカスが外れたら全キー解放（歩き続けバグ防止） */
  window.addEventListener('blur', () => Input.releaseAll());
  document.addEventListener('visibilitychange', () => { if (document.hidden) Input.releaseAll(); });

  /* タッチ/マウス共通ホールドバインド（pointerId追跡・leave対応） */
  function bindHold(btnEl, key) {
    const pts = new Set();
    const press = (e) => {
      e.preventDefault();
      GM.AUDIO.unlock();
      pts.add(e.pointerId);
      if (!Input.tm[key]) {
        Input.tm[key] = true; Input._sync();
        Input.push(key); // タップ移動・決定とも queue 経由
      }
      btnEl.classList.add('on');
    };
    const release = (e) => {
      if (e && e.pointerId != null) pts.delete(e.pointerId);
      if (pts.size === 0) { Input.tm[key] = false; Input._sync(); btnEl.classList.remove('on'); }
    };
    btnEl.addEventListener('pointerdown', press);
    btnEl.addEventListener('pointerup', release);
    btnEl.addEventListener('pointercancel', release);
    btnEl.addEventListener('pointerleave', release);
    btnEl.style.touchAction = 'none';
  }

  function bindTouch() {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const el = document.getElementById('touch');
    const showTouch = () => el.classList.remove('hidden');
    if (isTouch) showTouch();
    else window.addEventListener('touchstart', showTouch, { once: true, passive: true });
    el.querySelectorAll('[data-dir]').forEach((b) => bindHold(b, b.dataset.dir));
    bindHold(document.getElementById('tb-a'), 'a');
    bindHold(document.getElementById('tb-b'), 'b');
    bindHold(document.getElementById('tb-m'), 'menu');
  }
  GM.bindTouch = bindTouch;

  /* gamepad polling（合成を壊さないよう gp ソースのみ更新） */
  let gpPrev = { a: false, b: false, menu: false };
  let gpPrevDirs = {};
  let gpSeen = false;
  function pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let found = null;
    for (const gp of pads) { if (gp && gp.connected) { found = gp; break; } }
    if (!found) {
      if (gpSeen) { for (const k of KEYS) Input.gp[k] = false; Input._sync(); gpSeen = false; }
      return;
    }
    gpSeen = true;
    const gp = found;
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    const d = (btn) => !!(gp.buttons[btn] && gp.buttons[btn].pressed);
    const dirs = {
      up: d(12) || ay < -0.5, down: d(13) || ay > 0.5,
      left: d(14) || ax < -0.5, right: d(15) || ax > 0.5
    };
    for (const k in dirs) {
      Input.gp[k] = dirs[k];
      if (dirs[k] && !gpPrevDirs[k]) Input.push(k);
    }
    gpPrevDirs = dirs;
    const a = d(0), b = d(1), menu = d(9) || d(8);
    Input.gp.a = a; Input.gp.b = b; Input.gp.menu = menu;
    if (a && !gpPrev.a) Input.push('a');
    if (b && !gpPrev.b) Input.push('b');
    if (menu && !gpPrev.menu) Input.push('menu');
    gpPrev = { a, b, menu };
    Input._sync();
  }

  /* ---------------- fullscreen (真正の全画面表示) ---------------- */
  GM.toggleFullscreen = function () {
    try {
      const doc = document, el = doc.documentElement;
      const cur = doc.fullscreenElement || doc.webkitFullscreenElement;
      if (!cur) {
        const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
        if (req) {
          const p = req.call(el);
          if (p && p.catch) p.catch(() => {});
        }
        if (screen.orientation && screen.orientation.lock) {
          try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
        }
      } else {
        const ext = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
        if (ext) ext.call(doc);
      }
    } catch (e) {}
  };

  /* ---------------- scaling（黒帯をなくす動的ビューポート） ----------------
     - 横長画面: 縦は304px固定のまま横方向に視野を拡張（最大960px）
     - 縦長画面: 横は480px固定のまま縦方向に視野を拡張（最大600px）
     - スケールはちょうど画面を埋める値を使い、端数の黒帯も出さない */
  const MAX_W = 960, MAX_H = 600;
  function fitScreen() {
    const vw = Math.max(200, window.innerWidth), vh = Math.max(200, window.innerHeight);
    const screenEl = document.getElementById('screen');
    const canvas = document.getElementById('game');
    if (!screenEl || !canvas) return;
    let s, w, h;
    if (vw / vh >= 480 / 304) {
      const idealW = 304 * vw / vh;
      if (idealW <= MAX_W) { w = Math.max(480, Math.round(idealW)); s = vw / w; h = 304; }
      else { w = MAX_W; h = 304; s = vh / 304; } // 超極端ワイドのみ中央寄せ
    } else {
      const idealH = 480 * vh / vw;
      if (idealH <= MAX_H) { h = Math.max(304, Math.round(idealH)); s = vh / h; w = 480; }
      else { w = 480; h = MAX_H; s = vw / 480; }
    }
    const changed = w !== GM.VW || h !== GM.VH;
    GM.VW = w; GM.VH = h;
    canvas.width = w; canvas.height = h;
    canvas.style.width = '100%'; canvas.style.height = '100%';
    screenEl.style.width = w + 'px'; screenEl.style.height = h + 'px';
    document.documentElement.style.setProperty('--s', String(s));
    if (changed && GM.onViewportChange) GM.onViewportChange();
    if (changed) { try { canvas.getContext('2d').imageSmoothingEnabled = false; } catch (e) {} }
  }
  GM.fitScreen = fitScreen;
  fitScreen();
  window.addEventListener('resize', fitScreen);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fitScreen);
  window.addEventListener('orientationchange', () => setTimeout(fitScreen, 100));
  document.addEventListener('fullscreenchange', () => setTimeout(fitScreen, 60));
  document.addEventListener('webkitfullscreenchange', () => setTimeout(fitScreen, 60));

  /* ---------------- main loop ---------------- */
  const loopFns = [];
  GM.onFrame = (fn) => loopFns.push(fn);

  let last = performance.now();
  function loop(t) {
    requestAnimationFrame(loop);
    pollGamepad();
    const dt = Math.min(50, t - last);
    last = t;
    state.tick += dt;
    // fade
    const f = state.fade;
    if (f.a !== f.target) {
      const dir = Math.sign(f.target - f.a);
      f.a = U.clamp(f.a + dir * dt * f.speed, 0, 1);
      if ((dir > 0 && f.a >= f.target) || (dir < 0 && f.a <= f.target)) f.a = f.target;
    }
    for (const fn of loopFns) fn(dt, state.tick);
  }
  GM.startLoop = function () { requestAnimationFrame(loop); };

  GM.fadeTo = function (target, ms) {
    state.fade.target = target;
    state.fade.speed = 1 / Math.max(1, ms || 500);
  };
  GM.waitFade = function () {
    return new Promise((res) => {
      const check = () => { if (state.fade.a === state.fade.target) res(); else setTimeout(check, 40); };
      check();
    });
  };
  GM.wait = (ms) => new Promise((res) => setTimeout(res, ms));
  GM.tickNow = () => state.tick;

  /* ---------------- helpers ---------------- */
  GM.$ = (id) => document.getElementById(id);
  GM.isDirKey = isDirKey;
  GM.el = function (tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  GM.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  GM.addItem = function (id, qty) {
    state.items[id] = (state.items[id] || 0) + qty;
    if (state.items[id] <= 0) delete state.items[id];
  };
  GM.countItem = (id) => state.items[id] || 0;
  GM.itemName = function (id) {
    return (GM.ITEMS[id] && GM.ITEMS[id].name) ||
      (GM.WEAPONS[id] && GM.WEAPONS[id].name) ||
      (GM.ARMORS[id] && GM.ARMORS[id].name) ||
      (GM.ACCS[id] && GM.ACCS[id].name) || id;
  };
  GM.addTG = (n) => { state.tg = Math.max(0, state.tg + n); };

  GM.toast = function (text, blue) {
    const t = GM.el('div', 'toast' + (blue ? ' blue' : ''), GM.esc(text));
    GM.$('toasts').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 450); }, 1800);
  };

})(window.GM);
