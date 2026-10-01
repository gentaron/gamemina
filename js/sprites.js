/* ============================================================
   GAMEMINA CHRONICLE ─ Sprite / Tile Renderer
   - 敵ドット絵描画（フラッシュ・揺れ対応）
   - 手続き生成チビキャラ（8方向対応: down/up/side+flip, 2フレーム歩行）
   - ポートレート生成
   - 手続き生成タイル（16x16）
   ============================================================ */
'use strict';
window.GM = window.GM || {};
(function (GM) {

  /* ---------------- palette ---------------- */
  const PAL = {
    K: '#0a0a12', W: '#f4f6ff', D: '#3a3f52', d: '#5a6180', L: '#8b93b5',
    R: '#e04545', r: '#8f1f2d', O: '#ff9d3c', Y: '#ffd94a', A: '#c8871a',
    G: '#3fae5a', g: '#1d6e35', B: '#3f7fe0', b: '#22437f', C: '#62d6ff',
    T: '#2fae9e', P: '#9b59d0', p: '#5b2f8a', M: '#ff7eb6', m: '#b83a78',
    S: '#f2c9a0', s: '#c99468', N: '#8a5a2e', n: '#55371c',
    F: '#ffe9f2', E: '#ff3b6b'
  };

  /* offscreen cache: enemy normal / white flash */
  const cache = new Map();
  function spriteCanvas(id, rows, flash) {
    const key = id + (flash ? '_f' : '');
    if (cache.has(key)) return cache.get(key);
    const w = Math.max(...rows.map(r => r.length));
    const h = rows.length;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        c.fillStyle = flash ? '#ffffff' : (PAL[ch] || '#ff00ff');
        c.fillRect(x, y, 1, 1);
      }
    }
    cache.set(key, cv);
    return cv;
  }

  function drawEnemy(ctx, id, x, y, scale, opts) {
    opts = opts || {};
    const rows = GM.ENEMY_ART[id];
    if (!rows) return;
    const cv = spriteCanvas(id, rows, !!opts.flash);
    const w = cv.width * scale, h = cv.height * scale;
    ctx.save();
    if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
    const dx = Math.round(x - w / 2 + (opts.dx || 0));
    const dy = Math.round(y - h + (opts.dy || 0)); // (x,y)=足元中心
    if (opts.flip) {
      ctx.translate(dx + w, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(cv, 0, 0, w, h);
    } else {
      ctx.drawImage(cv, dx, dy, w, h);
    }
    ctx.restore();
    return { w, h, x: dx, y: dy };
  }
  function enemySize(id, scale) {
    const rows = GM.ENEMY_ART[id];
    if (!rows) return { w: 16, h: 16 };
    return { w: Math.max(...rows.map(r => r.length)) * scale, h: rows.length * scale };
  }

  /* ---------------- chibi character ----------------
     12x16 grid, 手続き生成。
     look: {hair, hair2, skin, top, top2, bottom, boot, trim, longHair, twin}
  ------------------------------------------------- */
  function chibiPixels(look, dir, frame) {
    const G = [];
    for (let y = 0; y < 16; y++) G.push(new Array(12).fill('.'));
    const set = (x, y, c) => { if (x >= 0 && x < 12 && y >= 0 && y < 16) G[y][x] = c; };
    const H = look.hair, H2 = look.hair2 || look.hair, S = look.skin, T = look.top, T2 = look.top2 || look.top, B = look.bottom, BT = look.boot, TR = look.trim || look.top;
    // head (rows 0-6), cols 2-9
    for (let x = 2; x <= 9; x++) set(x, 0, H);
    for (let y = 1; y <= 5; y++) {
      for (let x = 2; x <= 9; x++) {
        if (y >= 3) set(x, y, S); else set(x, y, H);
      }
    }
    // side hair
    set(1, 2, H); set(10, 2, H);
    if (dir !== 'up') {
      // fringe + eyes + mouth
      set(2, 3, H); set(9, 3, H); set(3, 3, H); set(8, 3, H);
      set(4, 4, 'K'); set(7, 4, 'K');
      if (dir === 'side') { set(4, 4, '.'); set(5, 4, 'K'); set(2, 3, H); set(3, 3, H); }
      set(5, 5, look.blush ? 'M' : '.');
    } else {
      // back of head: hair everywhere
      for (let y = 3; y <= 5; y++) for (let x = 2; x <= 9; x++) set(x, y, H);
    }
    if (look.longHair) {
      for (let y = 2; y <= 12; y++) { set(1, y, H); set(10, y, H); }
      if (dir !== 'up') { set(1, 3, H); set(10, 3, H); }
    }
    if (look.twin) {
      for (let y = 2; y <= 11; y++) { set(0, y, H); set(11, y, H); }
    }
    // neck
    set(5, 6, S); set(6, 6, S);
    // torso rows 7-11, cols 3-8
    for (let y = 7; y <= 11; y++) {
      for (let x = 3; x <= 8; x++) set(x, y, T);
    }
    // trim line
    set(3, 8, TR); set(8, 8, TR); set(4, 8, TR); set(7, 8, TR);
    // arms
    set(2, 8, T2); set(9, 8, T2);
    set(2, 9, T2); set(9, 9, T2);
    set(2, 10, S); set(9, 10, S); // hands
    if (dir === 'side') { set(2, 8, '.'); set(2, 9, '.'); set(2, 10, '.'); }
    // belt
    for (let x = 3; x <= 8; x++) set(x, 11, look.belt || TR);
    // legs rows 12-14
    const legL = 3, legR = 8;
    for (let y = 12; y <= 13; y++) {
      set(legL, y, B); set(legL + 1, y, B);
      set(legR - 1, y, B); set(legR, y, B);
    }
    // walk frames
    const liftL = frame === 1, liftR = frame === 3;
    // boots row 14
    if (!liftL) { set(legL, 14, BT); set(legL + 1, 14, BT); }
    if (!liftR) { set(legR - 1, 14, BT); set(legR, 14, BT); }
    if (liftL) { set(legL, 13, BT); set(legL + 1, 13, BT); }
    if (liftR) { set(legR - 1, 13, BT); set(legR, 13, BT); }
    // rows as strings
    return G.map(r => r.join(''));
  }

  const chibiCache = new Map();
  function chibiCanvas(look, dir, frame) {
    const key = JSON.stringify(look) + dir + frame;
    if (chibiCache.has(key)) return chibiCache.get(key);
    const rows = chibiPixels(look, dir, frame);
    const cv = document.createElement('canvas');
    cv.width = 12; cv.height = 16;
    const c = cv.getContext('2d');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 12; x++) {
        const ch = rows[y][x];
        if (ch === '.') continue;
        c.fillStyle = PAL[ch] || '#ff00ff';
        c.fillRect(x, y, 1, 1);
      }
    }
    chibiCache.set(key, cv);
    return cv;
  }

  /* dir: 'down'|'up'|'left'|'right', frame: 0..3 */
  function drawChibi(ctx, x, y, look, dir, frame, scale) {
    const d = dir === 'left' || dir === 'right' ? 'side' : dir;
    const cv = chibiCanvas(look, d, frame);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (dir === 'left') {
      ctx.translate(x + 12 * scale, y);
      ctx.scale(-1, 1);
      ctx.drawImage(cv, 0, 0, 12 * scale, 16 * scale);
    } else {
      ctx.drawImage(cv, x, y, 12 * scale, 16 * scale);
    }
    ctx.restore();
  }

  /* ---------------- portrait (dialogue) ---------------- */
  function drawPortrait(ctx, x, y, look, scale) {
    const S = scale || 3;
    // 12x12 head enlarged
    const cv = chibiCanvas(look, 'down', 0);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // head part: rows 0..7 of the 12x16 → crop
    ctx.drawImage(cv, 0, 0, 12, 8, x, y, 12 * S, 8 * S);
    ctx.restore();
  }

  /* ---------------- tiles ---------------- */
  function hash(x, y, seed) {
    let h = (x * 374761393 + y * 668265263 + (seed || 0) * 1442695041) | 0;
    h = (h ^ (h >> 13)) * 1274126177 | 0;
    return ((h ^ (h >> 16)) >>> 0) / 4294967295;
  }

  const TILE = 16;
  function drawTile(ctx, type, tx, ty, tick, seed) {
    const x = tx * TILE, y = ty * TILE;
    const t = tick || 0;
    const rnd = (i, j) => hash(tx * 16 + i, ty * 16 + j, seed || 1);
    switch (type) {
      case 'grass': {
        ctx.fillStyle = '#2e7d3f'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#35904a';
        for (let i = 0; i < TILE; i += 4) for (let j = 0; j < TILE; j += 4)
          if (rnd(i, j) > 0.5) ctx.fillRect(x + i, y + j, 2, 1);
        ctx.fillStyle = '#256b34';
        if (rnd(1, 2) > 0.6) { ctx.fillRect(x + 4, y + 10, 1, 2); ctx.fillRect(x + 5, y + 9, 1, 3); }
        break;
      }
      case 'flower': {
        ctx.fillStyle = '#2e7d3f'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#35904a';
        for (let i = 0; i < TILE; i += 4) for (let j = 0; j < TILE; j += 4)
          if (rnd(i, j) > 0.5) ctx.fillRect(x + i, y + j, 2, 1);
        const fx = x + 3 + Math.floor(rnd(3, 4) * 8), fy = y + 3 + Math.floor(rnd(5, 6) * 8);
        ctx.fillStyle = ['#ff7eb6', '#ffd94a', '#f4f6ff'][Math.floor(rnd(7, 8) * 3)];
        ctx.fillRect(fx, fy, 2, 2);
        break;
      }
      case 'tree': {
        ctx.fillStyle = '#2e7d3f'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#55371c'; ctx.fillRect(x + 6, y + 11, 4, 5);
        ctx.fillStyle = '#1d6e35'; ctx.fillRect(x + 2, y + 2, 12, 10);
        ctx.fillStyle = '#2f8a47'; ctx.fillRect(x + 3, y + 1, 10, 8);
        ctx.fillStyle = '#3fae5a'; ctx.fillRect(x + 4, y + 2, 5, 4);
        break;
      }
      case 'water': {
        ctx.fillStyle = '#1d4e89'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#2a6ab5';
        const ph = Math.floor(t / 24) % 2;
        for (let j = 2; j < TILE; j += 5) ctx.fillRect(x + ((j + ph * 3) % TILE), y + j, 6, 1);
        ctx.fillStyle = 'rgba(180,220,255,.35)';
        ctx.fillRect(x + 3, y + 4 + ph, 4, 1);
        break;
      }
      case 'stone': {
        ctx.fillStyle = '#4a5068'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#565d78';
        for (let i = 0; i < TILE; i += 3) for (let j = 0; j < TILE; j += 3)
          if (rnd(i, j) > 0.6) ctx.fillRect(x + i, y + j, 1, 1);
        ctx.strokeStyle = 'rgba(20,24,40,.6)'; ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
        break;
      }
      case 'metal': {
        ctx.fillStyle = '#39415e'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#454e70'; ctx.fillRect(x + 1, y + 1, 14, 14);
        ctx.fillStyle = '#2c3350';
        ctx.fillRect(x + 1, y + 7, 14, 1); ctx.fillRect(x + 7, y + 1, 1, 14);
        ctx.fillStyle = '#5a64a0';
        ctx.fillRect(x + 3, y + 3, 1, 1); ctx.fillRect(x + 12, y + 3, 1, 1);
        ctx.fillRect(x + 3, y + 12, 1, 1); ctx.fillRect(x + 12, y + 12, 1, 1);
        break;
      }
      case 'sand': {
        ctx.fillStyle = '#c2a25a'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#d4b76e';
        for (let i = 0; i < TILE; i += 3) for (let j = 0; j < TILE; j += 3)
          if (rnd(i, j) > 0.55) ctx.fillRect(x + i, y + j, 2, 1);
        break;
      }
      case 'snow': {
        ctx.fillStyle = '#cfe0f5'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#e8f2ff';
        for (let i = 0; i < TILE; i += 4) for (let j = 0; j < TILE; j += 4)
          if (rnd(i, j) > 0.5) ctx.fillRect(x + i, y + j, 2, 2);
        break;
      }
      case 'ice': {
        ctx.fillStyle = '#9fd8ef'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#c4ecff';
        ctx.fillRect(x + 2, y + 3, 5, 1); ctx.fillRect(x + 3, y + 4, 3, 1);
        ctx.fillRect(x + 9, y + 10, 5, 1);
        break;
      }
      case 'void': {
        ctx.fillStyle = '#070912'; ctx.fillRect(x, y, TILE, TILE);
        const ph = Math.floor(t / 40) % 3;
        ctx.fillStyle = 'rgba(160,190,255,.7)';
        for (let i = 0; i < 3; i++) {
          const sx = (hash(tx, ty, i + 9) * 14 | 0) + 1;
          const sy = (hash(ty, tx, i + 5) * 14 | 0) + 1;
          ctx.fillRect(x + sx, y + sy, 1, 1);
        }
        if (ph === 0) ctx.fillRect(x + 7, y + 7, 2, 1);
        break;
      }
      case 'carpet': {
        ctx.fillStyle = '#7a1f2d'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#96283a'; ctx.fillRect(x + 1, y + 1, 14, 14);
        ctx.fillStyle = '#c8871a';
        ctx.fillRect(x + 2, y + 2, 2, 2); ctx.fillRect(x + 12, y + 2, 2, 2);
        ctx.fillRect(x + 2, y + 12, 2, 2); ctx.fillRect(x + 12, y + 12, 2, 2);
        break;
      }
      case 'wood': {
        ctx.fillStyle = '#7a5230'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#8a5f3a';
        for (let j = 0; j < TILE; j += 4) ctx.fillRect(x, y + j, TILE, 1);
        ctx.fillStyle = '#66441f';
        if (rnd(2, 3) > 0.5) ctx.fillRect(x + 5, y + 6, 6, 1);
        break;
      }
      case 'wall': {
        ctx.fillStyle = '#2c3350'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#454e70';
        ctx.fillRect(x, y, TILE, 7);
        ctx.fillStyle = '#5a64a0'; ctx.fillRect(x, y, TILE, 1);
        ctx.fillStyle = '#20263e';
        ctx.fillRect(x + 7, y + 1, 1, 6); ctx.fillRect(x + 3, y + 8, 1, 7); ctx.fillRect(x + 11, y + 8, 1, 7);
        ctx.fillRect(x, y + 7, TILE, 1);
        break;
      }
      case 'metalwall': {
        ctx.fillStyle = '#1a2038'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#2c3350'; ctx.fillRect(x + 1, y + 1, 14, 14);
        ctx.fillStyle = '#3f4a80'; ctx.fillRect(x + 1, y + 1, 14, 2);
        ctx.fillStyle = '#12162a';
        ctx.fillRect(x + 1, y + 8, 14, 1); ctx.fillRect(x + 8, y + 1, 1, 14);
        ctx.fillStyle = '#62d6ff'; ctx.fillRect(x + 4, y + 4, 2, 1);
        break;
      }
      case 'counter': {
        ctx.fillStyle = '#4a3220'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#8a5f3a'; ctx.fillRect(x, y, TILE, 5);
        ctx.fillStyle = '#a8794a'; ctx.fillRect(x, y, TILE, 2);
        break;
      }
      case 'bed': {
        ctx.fillStyle = '#4a3220'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#e8f2ff'; ctx.fillRect(x + 2, y + 1, 12, 6);
        ctx.fillStyle = '#3f7fe0'; ctx.fillRect(x + 2, y + 7, 12, 8);
        ctx.fillStyle = '#dfe9ff'; ctx.fillRect(x + 2, y + 1, 12, 2);
        break;
      }
      case 'crate': {
        ctx.fillStyle = '#66441f'; ctx.fillRect(x + 1, y + 1, 14, 14);
        ctx.fillStyle = '#8a5f3a'; ctx.fillRect(x + 2, y + 2, 12, 12);
        ctx.strokeStyle = '#55371c'; ctx.strokeRect(x + 2.5, y + 2.5, 11, 11);
        ctx.fillStyle = '#55371c'; ctx.fillRect(x + 8, y + 2, 1, 12);
        break;
      }
      case 'console': {
        ctx.fillStyle = '#1a2038'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#2c3350'; ctx.fillRect(x + 1, y + 2, 14, 12);
        const on = Math.floor(t / 20) % 2;
        ctx.fillStyle = on ? '#7ce38b' : '#2fae4a'; ctx.fillRect(x + 3, y + 4, 4, 2);
        ctx.fillStyle = '#62d6ff'; ctx.fillRect(x + 9, y + 4, 4, 2);
        ctx.fillStyle = '#9b59d0'; ctx.fillRect(x + 3, y + 9, 10, 2);
        break;
      }
      case 'rock': {
        ctx.fillStyle = '#4a5068'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#565d78';
        ctx.fillRect(x + 3, y + 6, 10, 8); ctx.fillRect(x + 5, y + 4, 6, 2);
        ctx.fillStyle = '#7a82a8'; ctx.fillRect(x + 5, y + 6, 4, 2);
        break;
      }
      case 'stair': {
        ctx.fillStyle = '#2c3350'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#454e70';
        ctx.fillRect(x + 1, y + 2, 14, 3);
        ctx.fillRect(x + 3, y + 6, 10, 3);
        ctx.fillRect(x + 5, y + 10, 6, 3);
        break;
      }
      case 'chest': {
        ctx.fillStyle = '#66441f'; ctx.fillRect(x + 2, y + 5, 12, 9);
        ctx.fillStyle = '#8a5f3a'; ctx.fillRect(x + 3, y + 6, 10, 7);
        ctx.fillStyle = '#c8871a'; ctx.fillRect(x + 2, y + 5, 12, 3);
        ctx.fillStyle = '#ffd94a'; ctx.fillRect(x + 7, y + 8, 2, 3);
        break;
      }
      case 'chestopen': {
        ctx.fillStyle = '#66441f'; ctx.fillRect(x + 2, y + 5, 12, 9);
        ctx.fillStyle = '#3a2714'; ctx.fillRect(x + 3, y + 6, 10, 7);
        ctx.fillStyle = '#c8871a'; ctx.fillRect(x + 2, y + 2, 12, 3);
        break;
      }
      case 'save': {
        ctx.fillStyle = 'rgba(10,14,40,.2)'; ctx.fillRect(x, y, TILE, TILE);
        const pl = Math.sin(t / 14) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(98,214,255,${0.25 + pl * 0.2})`;
        ctx.fillRect(x + 4, y + 4, 8, 11);
        ctx.fillStyle = `rgba(220,245,255,${0.7 + pl * 0.3})`;
        ctx.fillRect(x + 6, y + 2, 4, 13);
        ctx.fillRect(x + 4, y + 5, 8, 7);
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 7, y + 1, 2, 14);
        break;
      }
      case 'gate': {
        ctx.fillStyle = '#12081f'; ctx.fillRect(x, y, TILE, TILE);
        const pl = Math.sin(t / 10) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(155,89,208,${0.5 + pl * 0.3})`;
        ctx.fillRect(x + 2, y + 1, 12, 14);
        ctx.fillStyle = `rgba(230,200,255,${0.6 + pl * 0.4})`;
        ctx.fillRect(x + 5, y + 3, 6, 10);
        ctx.fillStyle = '#f4c95d';
        ctx.fillRect(x + 2, y, 12, 1); ctx.fillRect(x + 2, y + 15, 12, 1);
        break;
      }
      case 'door': {
        ctx.fillStyle = '#2c3350'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#55371c'; ctx.fillRect(x + 2, y + 1, 12, 14);
        ctx.fillStyle = '#8a5f3a'; ctx.fillRect(x + 3, y + 2, 10, 13);
        ctx.fillStyle = '#ffd94a'; ctx.fillRect(x + 11, y + 8, 2, 2);
        break;
      }
      case 'sign': {
        ctx.fillStyle = '#2e7d3f'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#55371c'; ctx.fillRect(x + 7, y + 8, 2, 7);
        ctx.fillStyle = '#8a5f3a'; ctx.fillRect(x + 3, y + 2, 10, 7);
        ctx.fillStyle = '#e8f2ff'; ctx.fillRect(x + 5, y + 4, 6, 1); ctx.fillRect(x + 5, y + 6, 4, 1);
        break;
      }
      case 'plant': {
        ctx.fillStyle = '#2c3350'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#b83a78'; ctx.fillRect(x + 5, y + 10, 6, 5);
        ctx.fillStyle = '#3fae5a';
        ctx.fillRect(x + 4, y + 4, 2, 7); ctx.fillRect(x + 10, y + 5, 2, 6); ctx.fillRect(x + 7, y + 3, 2, 8);
        ctx.fillStyle = '#7ce38b'; ctx.fillRect(x + 4, y + 4, 1, 3); ctx.fillRect(x + 7, y + 3, 1, 3);
        break;
      }
      case 'thorn': {
        ctx.fillStyle = '#3a2714'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#55371c';
        ctx.fillRect(x + 2, y + 12, 3, 3); ctx.fillRect(x + 7, y + 10, 3, 5); ctx.fillRect(x + 12, y + 12, 3, 3);
        ctx.fillStyle = '#8f1f2d';
        ctx.fillRect(x + 3, y + 9, 1, 4); ctx.fillRect(x + 8, y + 7, 1, 4); ctx.fillRect(x + 13, y + 9, 1, 4);
        break;
      }
      default: { // floor fallback
        ctx.fillStyle = '#39415e'; ctx.fillRect(x, y, TILE, TILE);
      }
    }
  }

  /* shadow ellipse (field/battle) */
  function drawShadow(ctx, cx, cy, w) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, w, w * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  GM.SPRITES = { PAL, drawEnemy, enemySize, drawChibi, drawPortrait, drawTile, drawShadow, TILE };
})(window.GM);
