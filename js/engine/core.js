/* ============================================================
   GAMEMINA CHRONICLE ─ Engine Core
   入力（キーボード/タッチ/ゲームパッド）/ ゲームループ / 状態 / ユーティリティ
   ============================================================ */
'use strict';
window.GM = window.GM || {};
(function (GM) {

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

  /* ---------------- input ---------------- */
  const Input = {
    queue: [],
    held: { up: false, down: false, left: false, right: false, a: false, b: false, menu: false },
    _touchHeld: {},
    push(btn) { this.queue.push(btn); },
    consume() { return this.queue.shift() || null; },
    clear() { this.queue.length = 0; }
  };
  GM.Input = Input;

  const KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
    z: 'a', Z: 'a', Enter: 'a', ' ': 'a',
    x: 'b', X: 'b', Escape: 'b', Backspace: 'b',
    c: 'menu', C: 'menu', m: 'menu', M: 'menu', Tab: 'menu'
  };
  window.addEventListener('keydown', (e) => {
    const btn = KEYMAP[e.key];
    if (!btn) return;
    e.preventDefault();
    GM.AUDIO.unlock();
    if (!Input.held[btn]) { Input.held[btn] = true; Input.push(btn); }
    else if (btn === 'up' || btn === 'down' || btn === 'left' || btn === 'right') Input.push(btn); // リピート許可
  });
  window.addEventListener('keyup', (e) => {
    const btn = KEYMAP[e.key];
    if (btn) Input.held[btn] = false;
  });

  function bindTouch() {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const el = document.getElementById('touch');
    const showTouch = () => el.classList.remove('hidden');
    if (isTouch) showTouch();
    else window.addEventListener('touchstart', showTouch, { once: true, passive: true });
    el.querySelectorAll('[data-dir]').forEach((b) => {
      const dir = b.dataset.dir;
      const on = (e) => { e.preventDefault(); GM.AUDIO.unlock(); Input.held[dir] = true; Input.push(dir); b.classList.add('on'); };
      const off = (e) => { e.preventDefault(); Input.held[dir] = false; b.classList.remove('on'); };
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointercancel', off);
      b.addEventListener('pointerleave', off);
    });
    const bindBtn = (id, btn) => {
      const b = document.getElementById(id);
      const on = (e) => { e.preventDefault(); GM.AUDIO.unlock(); if (!Input.held[btn]) { Input.held[btn] = true; Input.push(btn); } b.classList.add('on'); };
      const off = (e) => { e.preventDefault(); Input.held[btn] = false; b.classList.remove('on'); };
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointercancel', off);
    };
    bindBtn('tb-a', 'a');
    bindBtn('tb-b', 'b');
    bindBtn('tb-m', 'menu');
  }
  GM.bindTouch = bindTouch;

  /* gamepad polling */
  let gpPrev = { a: false, b: false, menu: false };
  function pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp) continue;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      const d = (btn) => !!(gp.buttons[btn] && gp.buttons[btn].pressed);
      const dirs = {
        up: d(12) || ay < -0.5, down: d(13) || ay > 0.5,
        left: d(14) || ax < -0.5, right: d(15) || ax > 0.5
      };
      for (const k in dirs) {
        if (dirs[k]) {
          if (!Input.held[k]) Input.push(k);
          Input.held[k] = true;
        } else Input.held[k] = false;
      }
      const a = d(0), b = d(1), menu = d(9) || d(8);
      if (a && !gpPrev.a) Input.push('a');
      if (b && !gpPrev.b) Input.push('b');
      if (menu && !gpPrev.menu) Input.push('menu');
      gpPrev = { a, b, menu };
      return;
    }
  }

  /* ---------------- scaling ---------------- */
  function fitScreen() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min(vw / 480, vh / 304);
    document.documentElement.style.setProperty('--s', String(Math.max(0.5, s)));
  }
  window.addEventListener('resize', fitScreen);
  window.addEventListener('orientationchange', () => setTimeout(fitScreen, 100));

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

  /* ---------------- helpers ---------------- */
  GM.$ = (id) => document.getElementById(id);
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
