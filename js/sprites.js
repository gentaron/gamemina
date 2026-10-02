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
  const TILE = 16;
  function hash(x, y, seed) {
    let h = (x * 374761393 + y * 668265263 + (seed || 0) * 1442695041) | 0;
    h = (h ^ (h >> 13)) * 1274126177 | 0;
    return ((h ^ (h >> 16)) >>> 0) / 4294967295;
  }

  /* ---- 床タイル（明るめ・ノイズ・質感) ---- */
  function drawFloorTile(ctx, type, tx, ty, seed) {
    const x = tx * TILE, y = ty * TILE;
    const rnd = (i, j, s) => hash(tx * 16 + i, ty * 16 + j, (seed || 1) + (s || 0));
    switch (type) {
      case 'stone': {
        ctx.fillStyle = '#6e7691'; ctx.fillRect(x, y, TILE, TILE);
        // ノイズ
        for (let i = 0; i < TILE; i += 2) for (let j = 0; j < TILE; j += 2) {
          const r = rnd(i, j);
          if (r > 0.72) { ctx.fillStyle = 'rgba(255,255,255,.09)'; ctx.fillRect(x + i, y + j, 2, 2); }
          else if (r < 0.16) { ctx.fillStyle = 'rgba(10,14,30,.10)'; ctx.fillRect(x + i, y + j, 2, 2); }
        }
        // ひび（稀）
        if (rnd(3, 7, 9) > 0.86) {
          ctx.fillStyle = 'rgba(20,26,48,.35)';
          const cx = x + 3 + (rnd(1, 1, 4) * 8 | 0);
          ctx.fillRect(cx, y + 4, 1, 5); ctx.fillRect(cx + 1, y + 8, 1, 3);
        }
        break;
      }
      case 'metal': {
        ctx.fillStyle = '#5d6787'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#6a7498'; ctx.fillRect(x + 1, y + 1, 14, 14);
        // ベベル
        ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x + 1, y + 1, 14, 1); ctx.fillRect(x + 1, y + 1, 1, 14);
        ctx.fillStyle = 'rgba(10,14,32,.28)'; ctx.fillRect(x + 1, y + 14, 14, 1); ctx.fillRect(x + 14, y + 1, 1, 14);
        // シーム
        ctx.fillStyle = '#495372';
        ctx.fillRect(x + 1, y + 8, 14, 1); ctx.fillRect(x + 8, y + 1, 1, 14);
        // ボルト
        ctx.fillStyle = '#95a0c8';
        ctx.fillRect(x + 3, y + 3, 2, 2); ctx.fillRect(x + 11, y + 3, 2, 2);
        ctx.fillRect(x + 3, y + 11, 2, 2); ctx.fillRect(x + 11, y + 11, 2, 2);
        break;
      }
      case 'sand': {
        ctx.fillStyle = '#cdb271'; ctx.fillRect(x, y, TILE, TILE);
        for (let i = 0; i < TILE; i += 2) for (let j = 0; j < TILE; j += 2) {
          const r = rnd(i, j);
          if (r > 0.66) { ctx.fillStyle = 'rgba(255,240,200,.16)'; ctx.fillRect(x + i, y + j, 2, 1); }
          else if (r < 0.2) { ctx.fillStyle = 'rgba(120,95,45,.14)'; ctx.fillRect(x + i, y + j, 2, 1); }
        }
        break;
      }
      case 'snow': {
        ctx.fillStyle = '#dce8f8'; ctx.fillRect(x, y, TILE, TILE);
        for (let i = 0; i < TILE; i += 3) for (let j = 0; j < TILE; j += 3)
          if (rnd(i, j) > 0.62) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x + i, y + j, 2, 1); }
        ctx.fillStyle = 'rgba(140,170,210,.12)'; ctx.fillRect(x, y, TILE, 1);
        break;
      }
      case 'ice': {
        ctx.fillStyle = '#a9ddf3'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.fillRect(x + 2, y + 3, 6, 1); ctx.fillRect(x + 3, y + 4, 3, 1);
        ctx.fillRect(x + 9, y + 10, 5, 1);
        ctx.fillStyle = 'rgba(90,160,210,.22)';
        ctx.fillRect(x + 5, y + 12, 6, 1); ctx.fillRect(x + 11, y + 2, 3, 1);
        break;
      }
      case 'void': {
        ctx.fillStyle = '#04050d'; ctx.fillRect(x, y, TILE, TILE);
        break;
      }
      case 'carpet': {
        ctx.fillStyle = '#93263c'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#a12d46'; ctx.fillRect(x + 1, y + 1, 14, 14);
        ctx.fillStyle = 'rgba(255,220,140,.5)';
        ctx.fillRect(x + 2, y + 2, 2, 2); ctx.fillRect(x + 12, y + 2, 2, 2);
        ctx.fillRect(x + 2, y + 12, 2, 2); ctx.fillRect(x + 12, y + 12, 2, 2);
        ctx.fillStyle = 'rgba(40,6,14,.35)'; ctx.fillRect(x + 7, y + 1, 1, 14);
        break;
      }
      case 'wood': {
        ctx.fillStyle = '#8a613a'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#9a6f44';
        for (let j = 0; j < TILE; j += 4) ctx.fillRect(x, y + j, TILE, 3);
        ctx.fillStyle = '#6d4a28';
        for (let j = 3; j < TILE; j += 4) ctx.fillRect(x, y + j, TILE, 1);
        if (rnd(2, 3) > 0.6) { ctx.fillStyle = 'rgba(60,38,16,.4)'; ctx.fillRect(x + 5, y + 6, 5, 1); }
        break;
      }
      case 'grass': {
        ctx.fillStyle = '#4c9a5f'; ctx.fillRect(x, y, TILE, TILE);
        for (let i = 0; i < TILE; i += 2) for (let j = 0; j < TILE; j += 2) {
          const r = rnd(i, j);
          if (r > 0.7) { ctx.fillStyle = 'rgba(255,255,180,.10)'; ctx.fillRect(x + i, y + j, 2, 1); }
          else if (r < 0.2) { ctx.fillStyle = 'rgba(20,80,40,.16)'; ctx.fillRect(x + i, y + j, 2, 1); }
        }
        if (rnd(1, 2) > 0.72) {
          ctx.fillStyle = '#63b878';
          ctx.fillRect(x + 4, y + 9, 1, 3); ctx.fillRect(x + 5, y + 8, 1, 3); ctx.fillRect(x + 10, y + 10, 1, 3);
        }
        break;
      }
      case 'flower': {
        drawFloorTile(ctx, 'grass', tx, ty, seed);
        const fx = x + 3 + Math.floor(rnd(3, 4) * 8), fy = y + 3 + Math.floor(rnd(5, 6) * 8);
        const col = ['#ff8fb8', '#ffd94a', '#f4f6ff', '#c39bff'][Math.floor(rnd(7, 8) * 4)];
        ctx.fillStyle = col;
        ctx.fillRect(fx, fy, 2, 2);
        ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(fx, fy, 1, 1);
        break;
      }
      case 'marble': {
        ctx.fillStyle = '#d8ccb0'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#e8dec6'; ctx.fillRect(x + 1, y + 1, 14, 14);
        ctx.fillStyle = 'rgba(170,140,80,.35)';
        if (rnd(1, 1) > 0.5) { ctx.fillRect(x + 2, y + 5, 6, 1); ctx.fillRect(x + 7, y + 6, 4, 1); }
        else { ctx.fillRect(x + 6, y + 10, 7, 1); }
        ctx.fillStyle = '#c9a24a'; ctx.fillRect(x, y, TILE, 1); ctx.fillRect(x, y, 1, TILE);
        break;
      }
      case 'ash': {
        ctx.fillStyle = '#4b4448'; ctx.fillRect(x, y, TILE, TILE);
        for (let i = 0; i < TILE; i += 2) for (let j = 0; j < TILE; j += 2) {
          const r = rnd(i, j);
          if (r > 0.8) { ctx.fillStyle = 'rgba(200,190,185,.12)'; ctx.fillRect(x + i, y + j, 2, 1); }
          else if (r < 0.12) { ctx.fillStyle = 'rgba(10,6,8,.3)'; ctx.fillRect(x + i, y + j, 2, 2); }
          else if (r > 0.785 && r < 0.79) { ctx.fillStyle = 'rgba(255,120,60,.55)'; ctx.fillRect(x + i, y + j, 1, 1); }
        }
        break;
      }
      case 'road': {
        ctx.fillStyle = '#3c4152'; ctx.fillRect(x, y, TILE, TILE);
        for (let i = 0; i < TILE; i += 2) for (let j = 0; j < TILE; j += 2) {
          const r = rnd(i, j);
          if (r > 0.82) { ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(x + i, y + j, 1, 1); }
          else if (r < 0.1) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x + i, y + j, 1, 1); }
        }
        if ((tx + ty) % 4 === 0) { ctx.fillStyle = 'rgba(255,217,74,.45)'; ctx.fillRect(x + 7, y + 4, 2, 8); }
        break;
      }
      case 'dirt': {
        ctx.fillStyle = '#8a6a44'; ctx.fillRect(x, y, TILE, TILE);
        for (let i = 0; i < TILE; i += 2) for (let j = 0; j < TILE; j += 2) {
          const r = rnd(i, j);
          if (r > 0.72) { ctx.fillStyle = 'rgba(255,230,180,.12)'; ctx.fillRect(x + i, y + j, 2, 1); }
          else if (r < 0.18) { ctx.fillStyle = 'rgba(50,30,10,.18)'; ctx.fillRect(x + i, y + j, 2, 1); }
        }
        if (rnd(5, 5) > 0.8) { ctx.fillStyle = '#6b5032'; ctx.fillRect(x + 4 + (rnd(2, 2) * 8 | 0), y + 9, 2, 2); }
        break;
      }
      case 'rift': {
        ctx.fillStyle = '#1c1638'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#251d4a'; ctx.fillRect(x + 1, y + 1, 14, 14);
        ctx.fillStyle = 'rgba(155,120,255,.35)';
        ctx.fillRect(x, y, TILE, 1); ctx.fillRect(x, y, 1, TILE);
        if (rnd(3, 3) > 0.55) { ctx.fillStyle = 'rgba(190,160,255,.5)'; ctx.fillRect(x + 3 + (rnd(1, 4) * 9 | 0), y + 3 + (rnd(4, 1) * 9 | 0), 1, 1); }
        break;
      }
      case 'tile': {
        const odd = (tx + ty) % 2;
        ctx.fillStyle = odd ? '#c8ccd8' : '#b4b9c8'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(x, y, TILE, 1);
        break;
      }
      default:
        ctx.fillStyle = '#6e7691'; ctx.fillRect(x, y, TILE, TILE);
    }
  }

  /* ---- 壁タイル（暗い・面の向きで描き分け) ----
     variant: 'flat'=天面のみ / 'front'=前面(下が床) / 'cap'=上端ハイライト */
  function drawWallTile(ctx, kind, tx, ty, variant, seed) {
    const x = tx * TILE, y = ty * TILE;
    const rnd = (i, j) => hash(tx * 16 + i, ty * 16 + j, (seed || 1) + 31);
    if (variant === 'roof' || variant === 'roofcap') {
      // 屋外の建物の屋根（旧: 真っ黒な天面が「穴」に見えていた）
      const P = kind === 'metalwall' ? ['#34405f', '#43527a', '#27304a', '#6c7fae'] : ['#6e3a33', '#8a4a40', '#4e2723', '#c0705e'];
      ctx.fillStyle = P[0]; ctx.fillRect(x, y, TILE, TILE);
      for (let j = 0; j < TILE; j += 4) {
        ctx.fillStyle = P[1]; ctx.fillRect(x, y + j, TILE, 3);
        ctx.fillStyle = P[2]; ctx.fillRect(x + ((j / 4) % 2 ? 4 : 12), y + j, 1, 3);
      }
      if (variant === 'roofcap') { ctx.fillStyle = P[3]; ctx.fillRect(x, y, TILE, 2); }
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x, y + 15, TILE, 1);
      return;
    }
    if (kind === 'metalwall') {
      ctx.fillStyle = '#0e1224'; ctx.fillRect(x, y, TILE, TILE);
      if (variant === 'front') {
        ctx.fillStyle = '#1a2138'; ctx.fillRect(x, y, TILE, TILE);
        // パネル
        ctx.fillStyle = '#141a30'; ctx.fillRect(x + 1, y + 2, 6, 5); ctx.fillRect(x + 9, y + 2, 6, 5);
        ctx.fillRect(x + 1, y + 9, 6, 5); ctx.fillRect(x + 9, y + 9, 6, 5);
        // シーム
        ctx.fillStyle = '#0a0e1e';
        ctx.fillRect(x, y + 8, TILE, 1); ctx.fillRect(x + 8, y, 1, TILE);
        // リベット
        ctx.fillStyle = '#3d4a7e';
        ctx.fillRect(x + 2, y + 3, 1, 1); ctx.fillRect(x + 12, y + 3, 1, 1);
        ctx.fillRect(x + 2, y + 11, 1, 1); ctx.fillRect(x + 12, y + 11, 1, 1);
        if (rnd(1, 2) > 0.8) { ctx.fillStyle = 'rgba(98,214,255,.5)'; ctx.fillRect(x + 5 + (rnd(2, 2) * 6 | 0), y + 5, 2, 1); }
      } else {
        ctx.fillStyle = '#161c33'; ctx.fillRect(x, y, TILE, TILE);
        if (variant === 'cap') { ctx.fillStyle = '#2b3560'; ctx.fillRect(x, y, TILE, 2); }
        ctx.fillStyle = '#0a0e1e';
        ctx.fillRect(x, y + 7, TILE, 1); ctx.fillRect(x + 7, y, 1, TILE);
        if (rnd(1, 3) > 0.7) { ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x + (rnd(2, 4) * 12 | 0), y + 2, 2, 2); }
      }
      // 下端（床との境界)に暗線
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x, y + 15, TILE, 1);
    } else if (kind === 'cliff') {
      ctx.fillStyle = '#3e3020'; ctx.fillRect(x, y, TILE, TILE);
      if (variant === 'front') {
        ctx.fillStyle = '#7a5c36'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#8f6c40'; ctx.fillRect(x + 1, y + 1, 6, 6); ctx.fillRect(x + 9, y + 4, 6, 5); ctx.fillRect(x + 3, y + 10, 7, 4);
        ctx.fillStyle = '#5a4126'; ctx.fillRect(x, y + 8, TILE, 1); ctx.fillRect(x + 8, y, 1, 8); ctx.fillRect(x + 11, y + 9, 1, 7);
        ctx.fillStyle = 'rgba(255,230,170,.18)'; ctx.fillRect(x, y, TILE, 1);
      } else {
        ctx.fillStyle = '#5b4429'; ctx.fillRect(x, y, TILE, TILE);
        if (variant === 'cap') { ctx.fillStyle = '#a3814f'; ctx.fillRect(x, y, TILE, 2); }
        ctx.fillStyle = '#4a361f';
        if (rnd(1, 3) > 0.4) ctx.fillRect(x + (rnd(2, 4) * 10 | 0) + 2, y + 5, 4, 2);
        if (rnd(2, 5) > 0.5) ctx.fillRect(x + (rnd(3, 2) * 10 | 0) + 1, y + 11, 3, 2);
      }
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x, y + 15, TILE, 1);
    } else { // brick wall
      ctx.fillStyle = '#12172a'; ctx.fillRect(x, y, TILE, TILE);
      if (variant === 'front') {
        ctx.fillStyle = '#20273f'; ctx.fillRect(x, y, TILE, TILE);
        // 煉瓦
        ctx.fillStyle = '#28314e';
        ctx.fillRect(x, y + 1, 7, 3); ctx.fillRect(x + 8, y + 1, 8, 3);
        ctx.fillRect(x - 2, y + 5, 9, 3); ctx.fillRect(x + 8, y + 5, 7, 3);
        ctx.fillRect(x, y + 9, 7, 3); ctx.fillRect(x + 8, y + 9, 8, 3);
        ctx.fillRect(x - 2, y + 13, 9, 2); ctx.fillRect(x + 8, y + 13, 7, 2);
        // 目地
        ctx.fillStyle = '#151a2e';
        ctx.fillRect(x, y + 4, TILE, 1); ctx.fillRect(x, y + 8, TILE, 1); ctx.fillRect(x, y + 12, TILE, 1);
        ctx.fillRect(x + 7, y + 1, 1, 3); ctx.fillRect(x + 3, y + 5, 1, 3); ctx.fillRect(x + 11, y + 5, 1, 3);
        ctx.fillRect(x + 7, y + 9, 1, 3); ctx.fillRect(x + 3, y + 13, 1, 2);
        // ハイライト
        ctx.fillStyle = 'rgba(255,255,255,.06)';
        ctx.fillRect(x, y, TILE, 1);
        if (rnd(1, 2) > 0.75) { ctx.fillStyle = 'rgba(255,220,140,.10)'; ctx.fillRect(x + 4, y + 2, 2, 1); }
      } else {
        ctx.fillStyle = '#181e33'; ctx.fillRect(x, y, TILE, TILE);
        if (variant === 'cap') { ctx.fillStyle = '#313b62'; ctx.fillRect(x, y, TILE, 2); }
        ctx.fillStyle = '#101527';
        if (rnd(1, 3) > 0.5) ctx.fillRect(x + (rnd(2, 4) * 10 | 0) + 2, y + 4, 3, 1);
        if (rnd(2, 5) > 0.6) ctx.fillRect(x + (rnd(3, 2) * 10 | 0) + 1, y + 10, 4, 1);
      }
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x, y + 15, TILE, 1);
    }
  }

  /* ---- アニメーション/装飾タイル ---- */
  function drawTile(ctx, type, tx, ty, tick, seed) {
    const x = tx * TILE, y = ty * TILE;
    const t = tick || 0;
    const rnd = (i, j) => hash(tx * 16 + i, ty * 16 + j, seed || 1);
    switch (type) {
      /* ---- 静的(焼き込み用の再現) ---- */
      case 'grass': case 'flower': case 'stone': case 'metal': case 'sand':
      case 'snow': case 'ice': case 'carpet': case 'wood': case 'void_static':
      case 'marble': case 'ash': case 'road': case 'dirt': case 'rift': case 'tile':
        if (type === 'void_static') { ctx.fillStyle = '#04050d'; ctx.fillRect(x, y, TILE, TILE); break; }
        drawFloorTile(ctx, type, tx, ty, seed); break;
      case 'wall': case 'metalwall': case 'cliff':
        drawWallTile(ctx, type, tx, ty, 'flat', seed); break;

      /* ---- アニメーション ---- */
      case 'water': case 'slime': case 'sewage': {
        const LQ = { water: ['#2a5fb0', '#3a77cc'], slime: ['#2f8a3c', '#56c25e'], sewage: ['#3d5248', '#53705f'] }[type];
        ctx.fillStyle = LQ[0]; ctx.fillRect(x, y, TILE, TILE);
        const ph = Math.floor(t / 26) % 2;
        ctx.fillStyle = LQ[1];
        for (let j = 2; j < TILE; j += 5) ctx.fillRect(x + ((j * 3 + ph * 3) % TILE), y + j, 7, 1);
        ctx.fillStyle = 'rgba(190,230,255,.5)';
        ctx.fillRect(x + 3, y + 4 + ph, 5, 1);
        ctx.fillStyle = 'rgba(255,255,255,.22)';
        if ((t / 40 | 0) % 3 === 0) ctx.fillRect(x + 9 - ph * 2, y + 11, 3, 1);
        break;
      }
      case 'void': {
        ctx.fillStyle = '#04050d'; ctx.fillRect(x, y, TILE, TILE);
        for (let i = 0; i < 3; i++) {
          const tw = Math.sin(t / 300 + hash(tx, ty, i) * 9) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(170,200,255,${0.25 + tw * 0.55})`;
          ctx.fillRect(x + ((hash(tx, ty, i + 9) * 14) | 0) + 1, y + ((hash(ty, tx, i + 5) * 14) | 0) + 1, 1, 1);
        }
        break;
      }
      case 'rock': {
        ctx.fillStyle = '#232a3e'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#586178'; ctx.fillRect(x + 2, y + 5, 12, 9); ctx.fillRect(x + 4, y + 3, 8, 3);
        ctx.fillStyle = '#6d7890'; ctx.fillRect(x + 4, y + 5, 5, 3);
        ctx.fillStyle = '#3b4358'; ctx.fillRect(x + 2, y + 11, 12, 3);
        ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x + 1, y + 14, 14, 1);
        break;
      }
      case 'stair': {
        ctx.fillStyle = '#3a4258'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#525c78';
        ctx.fillRect(x + 1, y + 1, 14, 4);
        ctx.fillStyle = '#485270'; ctx.fillRect(x + 2, y + 5, 12, 4);
        ctx.fillStyle = '#3e4664'; ctx.fillRect(x + 3, y + 9, 10, 4);
        ctx.fillStyle = '#333b54'; ctx.fillRect(x + 4, y + 13, 8, 2);
        break;
      }
      case 'chest': {
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x + 1, y + 13, 14, 2);
        ctx.fillStyle = '#5c3d1c'; ctx.fillRect(x + 2, y + 5, 12, 9);
        ctx.fillStyle = '#8a5f34'; ctx.fillRect(x + 3, y + 6, 10, 7);
        ctx.fillStyle = '#d9a441'; ctx.fillRect(x + 2, y + 4, 12, 3);
        ctx.fillStyle = '#ffd94a'; ctx.fillRect(x + 7, y + 7, 2, 4);
        ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x + 3, y + 4, 10, 1);
        break;
      }
      case 'chestopen': {
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x + 1, y + 13, 14, 2);
        ctx.fillStyle = '#5c3d1c'; ctx.fillRect(x + 2, y + 6, 12, 8);
        ctx.fillStyle = '#3a2712'; ctx.fillRect(x + 3, y + 7, 10, 6);
        ctx.fillStyle = '#d9a441'; ctx.fillRect(x + 2, y + 2, 12, 3);
        break;
      }
      case 'crate': {
        ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x + 1, y + 14, 14, 1);
        ctx.fillStyle = '#59401f'; ctx.fillRect(x + 1, y + 1, 14, 14);
        ctx.fillStyle = '#7d5c30'; ctx.fillRect(x + 2, y + 2, 12, 12);
        ctx.fillStyle = '#59401f';
        ctx.fillRect(x + 2, y + 2, 12, 1); ctx.fillRect(x + 2, y + 13, 12, 1);
        ctx.fillRect(x + 2, y + 2, 1, 12); ctx.fillRect(x + 13, y + 2, 1, 12);
        ctx.fillRect(x + 8, y + 2, 1, 12); ctx.fillRect(x + 2, y + 8, 12, 1);
        break;
      }
      case 'counter': {
        ctx.fillStyle = '#3d2c18'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#8a613a'; ctx.fillRect(x, y, TILE, 6);
        ctx.fillStyle = '#a87d4a'; ctx.fillRect(x, y, TILE, 2);
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x, y + 6, TILE, 1);
        break;
      }
      case 'bed': {
        ctx.fillStyle = '#3d2c18'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#f2f6ff'; ctx.fillRect(x + 2, y + 1, 12, 6);
        ctx.fillStyle = '#4a7fd0'; ctx.fillRect(x + 2, y + 7, 12, 8);
        ctx.fillStyle = '#dbe6ff'; ctx.fillRect(x + 2, y + 1, 12, 2);
        ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x + 2, y + 9, 12, 1);
        break;
      }
      case 'console': {
        ctx.fillStyle = '#0e1224'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#232c4e'; ctx.fillRect(x + 1, y + 2, 14, 12);
        const on = Math.floor(t / 22) % 2;
        ctx.fillStyle = on ? '#7ce38b' : '#2fae4a'; ctx.fillRect(x + 3, y + 4, 4, 2);
        ctx.fillStyle = '#62d6ff'; ctx.fillRect(x + 9, y + 4, 4, 2);
        ctx.fillStyle = 'rgba(155,89,208,.85)'; ctx.fillRect(x + 3, y + 9, 10, 2);
        ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(x + 1, y + 2, 14, 1);
        break;
      }
      case 'save': {
        const pl = Math.sin(t / 16) * 0.5 + 0.5;
        // 光柱
        ctx.fillStyle = `rgba(120,220,255,${0.10 + pl * 0.10})`;
        ctx.fillRect(x + 2, y - 2, 12, 18);
        // 台座
        ctx.fillStyle = '#2a3454'; ctx.fillRect(x + 2, y + 12, 12, 4);
        ctx.fillStyle = '#3d4a78'; ctx.fillRect(x + 1, y + 11, 14, 2);
        // クリスタル
        ctx.fillStyle = `rgba(98,214,255,${0.75 + pl * 0.25})`;
        ctx.fillRect(x + 6, y + 3, 4, 9);
        ctx.fillRect(x + 5, y + 5, 6, 6);
        ctx.fillStyle = '#eaf9ff';
        ctx.fillRect(x + 7, y + 1, 2, 3);
        ctx.fillRect(x + 7, y + 4, 2, 8);
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.fillRect(x + 7, y + 2, 1, 10);
        break;
      }
      case 'gate': {
        // 単一枚扉ポータル
        const pl = Math.sin(t / 12) * 0.5 + 0.5;
        // 外枠アーチ
        ctx.fillStyle = '#d9a441';
        ctx.fillRect(x + 1, y + 1, 14, 2);
        ctx.fillRect(x + 1, y + 1, 2, 14); ctx.fillRect(x + 13, y + 1, 2, 14);
        ctx.fillStyle = '#8a6a1e';
        ctx.fillRect(x + 1, y + 14, 14, 1);
        // ポータル本体
        const g = ctx.createLinearGradient(x, y + 3, x, y + 14);
        g.addColorStop(0, `rgba(210,160,255,${0.85 + pl * 0.15})`);
        g.addColorStop(1, `rgba(120,60,200,${0.75 + pl * 0.2})`);
        ctx.fillStyle = g;
        ctx.fillRect(x + 3, y + 3, 10, 11);
        // 渦
        ctx.fillStyle = `rgba(255,255,255,${0.35 + pl * 0.3})`;
        ctx.fillRect(x + 5 + (pl > 0.5 ? 2 : 0), y + 5, 2, 2);
        ctx.fillRect(x + 8 - (pl > 0.5 ? 2 : 0), y + 9, 2, 2);
        // 光漏れ
        ctx.fillStyle = `rgba(200,150,255,${0.12 + pl * 0.12})`;
        ctx.fillRect(x + 3, y + 14, 10, 2);
        break;
      }
      case 'sign': {
        ctx.fillStyle = '#4a3220'; ctx.fillRect(x + 7, y + 9, 2, 6);
        ctx.fillStyle = '#8a613a'; ctx.fillRect(x + 2, y + 2, 12, 8);
        ctx.fillStyle = '#a87d4a'; ctx.fillRect(x + 2, y + 2, 12, 1);
        ctx.fillStyle = '#2a1c0e';
        ctx.fillRect(x + 4, y + 4, 8, 1); ctx.fillRect(x + 4, y + 6, 6, 1);
        break;
      }
      case 'plant': {
        ctx.fillStyle = '#8a2a52'; ctx.fillRect(x + 5, y + 10, 6, 5);
        ctx.fillStyle = '#b83a78'; ctx.fillRect(x + 5, y + 10, 6, 1);
        ctx.fillStyle = '#3fae5a';
        ctx.fillRect(x + 4, y + 4, 2, 7); ctx.fillRect(x + 10, y + 5, 2, 6); ctx.fillRect(x + 7, y + 3, 2, 8);
        ctx.fillStyle = '#7ce38b';
        ctx.fillRect(x + 4, y + 4, 1, 3); ctx.fillRect(x + 7, y + 3, 1, 3);
        break;
      }
      case 'tree': {
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x + 1, y + 14, 14, 1);
        ctx.fillStyle = '#5a3d20'; ctx.fillRect(x + 6, y + 10, 4, 5);
        ctx.fillStyle = '#1d6e35'; ctx.fillRect(x + 2, y + 1, 12, 10);
        ctx.fillStyle = '#2f8a47'; ctx.fillRect(x + 3, y, 10, 8);
        ctx.fillStyle = '#3fae5a'; ctx.fillRect(x + 4, y + 1, 5, 4);
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x + 2, y + 10, 12, 1);
        break;
      }
      case 'thorn': {
        ctx.fillStyle = '#2a1e10'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#4a3418';
        ctx.fillRect(x + 2, y + 11, 4, 4); ctx.fillRect(x + 7, y + 9, 4, 6); ctx.fillRect(x + 12, y + 11, 3, 4);
        ctx.fillStyle = '#8f1f2d';
        ctx.fillRect(x + 3, y + 8, 1, 4); ctx.fillRect(x + 8, y + 6, 1, 4); ctx.fillRect(x + 13, y + 8, 1, 4);
        ctx.fillStyle = '#c23a4a';
        ctx.fillRect(x + 3, y + 7, 1, 2); ctx.fillRect(x + 8, y + 5, 1, 2);
        break;
      }
      case 'pillar': {
        ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.fillRect(x + 2, y + 13, 12, 3);
        ctx.fillStyle = '#7d86a8'; ctx.fillRect(x + 3, y + 12, 10, 3);
        ctx.fillStyle = '#9aa3c4'; ctx.fillRect(x + 4, y + 1, 8, 12);
        ctx.fillStyle = '#c3cbe6'; ctx.fillRect(x + 5, y + 1, 2, 12);
        ctx.fillStyle = '#646c8c'; ctx.fillRect(x + 10, y + 1, 2, 12);
        ctx.fillStyle = '#7d86a8'; ctx.fillRect(x + 3, y, 10, 2);
        break;
      }
      case 'fence': {
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x, y + 13, TILE, 2);
        ctx.fillStyle = '#9aa3c4'; ctx.fillRect(x, y + 5, TILE, 2); ctx.fillRect(x, y + 10, TILE, 2);
        ctx.fillStyle = '#c3cbe6'; ctx.fillRect(x + 2, y + 3, 2, 11); ctx.fillRect(x + 12, y + 3, 2, 11);
        ctx.fillStyle = '#646c8c'; ctx.fillRect(x + 3, y + 3, 1, 11); ctx.fillRect(x + 13, y + 3, 1, 11);
        break;
      }
      case 'lamp': {
        const pl = Math.sin(t / 30 + tx) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255,220,140,${0.10 + pl * 0.06})`;
        ctx.beginPath(); ctx.arc(x + 8, y + 4, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x + 4, y + 14, 8, 2);
        ctx.fillStyle = '#3d4566'; ctx.fillRect(x + 7, y + 5, 2, 10); ctx.fillRect(x + 5, y + 13, 6, 2);
        ctx.fillStyle = '#ffe9a0'; ctx.fillRect(x + 5, y + 1, 6, 4);
        ctx.fillStyle = '#fff8dc'; ctx.fillRect(x + 6, y + 2, 4, 2);
        break;
      }
      case 'rubble': {
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x + 1, y + 13, 14, 2);
        ctx.fillStyle = '#5c5358'; ctx.fillRect(x + 1, y + 8, 7, 6); ctx.fillRect(x + 7, y + 5, 8, 9);
        ctx.fillStyle = '#7a7076'; ctx.fillRect(x + 2, y + 8, 4, 2); ctx.fillRect(x + 8, y + 5, 5, 2);
        ctx.fillStyle = '#3a3236'; ctx.fillRect(x + 4, y + 11, 6, 3);
        ctx.fillStyle = '#8f6c40'; ctx.fillRect(x + 10, y + 3, 1, 5);
        break;
      }
      case 'statue': {
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x + 2, y + 14, 12, 2);
        ctx.fillStyle = '#6d7490'; ctx.fillRect(x + 3, y + 11, 10, 4);
        ctx.fillStyle = '#d9a441'; ctx.fillRect(x + 6, y + 2, 4, 3); ctx.fillRect(x + 5, y + 5, 6, 6);
        ctx.fillStyle = '#ffd94a'; ctx.fillRect(x + 6, y + 2, 2, 2); ctx.fillRect(x + 6, y + 6, 2, 4);
        ctx.fillStyle = '#8a6a1e'; ctx.fillRect(x + 10, y + 5, 1, 6);
        break;
      }
      case 'door': {
        ctx.fillStyle = '#05070f'; ctx.fillRect(x + 2, y, 12, TILE);
        ctx.fillStyle = '#2a3354'; ctx.fillRect(x, y, 2, TILE); ctx.fillRect(x + 14, y, 2, TILE);
        ctx.fillStyle = '#4a5682'; ctx.fillRect(x, y, TILE, 2);
        const g2 = ctx.createLinearGradient(0, y, 0, y + TILE);
        g2.addColorStop(0, 'rgba(98,214,255,0)'); g2.addColorStop(1, 'rgba(98,214,255,.22)');
        ctx.fillStyle = g2; ctx.fillRect(x + 2, y + 2, 12, 14);
        break;
      }
      default:
        ctx.fillStyle = '#6e7691'; ctx.fillRect(x, y, TILE, TILE);
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

  GM.SPRITES = { PAL, drawEnemy, enemySize, drawChibi, drawPortrait, drawTile, drawWallTile, drawFloorTile, drawShadow, TILE, _chibiCanvas: chibiCanvas };
})(window.GM);
