/* ============================================================
   GAMEMINA CHRONICLE ─ Field Engine v2
   マップ描画 / 移動 / 衝突 / 遭遇 / イベント
   - 静的レイヤー焼き込み (map bake) による高速描画
   - 壁の面描き分け (front/top) + 床AO影 → 視認性大幅向上
   - ビネットライティング
   - 扉・出口は踏み込みでも発動 (step-on)
   ============================================================ */
'use strict';
window.GM = window.GM || {};
(function (GM) {
  const U = GM.U, S = GM.state, $ = GM.$;
  const TILE = 16; // ビューポート (GM.VW/GM.VH) は動的（fitScreen が画面比に合わせ拡張）

  /* tile solidity（'T'=茨は通過不可） */
  const SOLID = new Set(['#', ' ', 'w', 't', 'r', 'c', 'C', 'b', 'p', 'm', 'x', 'o', '*', 'T']);
  /* 影を落とすオクルーダー（壁＋背の高い障害物） */
  const OCCLUDER = new Set(['#', 'm', 'r', 'c', 'C', 'o', 'x', 't', 'T']);
  function tileAt(map, x, y) {
    const row = map.map[y];
    if (!row) return '#';
    const ch = row[x] != null ? row[x] : '#';
    return ch;
  }
  GM.tileAt = tileAt;
  GM.isSolid = function (map, x, y) {
    const ch = tileAt(map, x, y);
    return SOLID.has(ch);
  };

  /* ---------------- tile → draw type ---------------- */
  function tileType(map, ch) {
    switch (ch) {
      case '#': return map.wallTile || 'wall';
      case '.': return map.floorTile || 'stone';
      case 'w': return 'water';
      case 't': return 'tree';
      case 'r': return 'rock';
      case 'c': return 'crate';
      case 'C': return 'counter';
      case 'b': return 'bed';
      case 'p': return 'plant';
      case 'm': return 'metalwall';
      case 'S': return 'save';
      case 'G': return 'gate';
      case 's': return 'stair';
      case 'x': return 'sign';
      case 'o': return 'console';
      case '*': return 'chest';
      case 'B': return 'wood';
      case 'k': return 'carpet';
      case 'W': return 'wood';
      case 'M': return 'metal';
      case 'i': return 'ice';
      case 'n': return 'snow';
      case 'd': return 'sand';
      case 'v': return 'void';
      case 'g': return 'grass';
      case 'f': return 'flower';
      case 'T': return 'thorn';
      case ' ': return 'void';
      default: return map.floorTile || 'stone';
    }
  }
  GM.tileType = tileType;

  /* アニメーションするタイル（毎フレーム描画） */
  const ANIMATED = new Set(['water', 'void', 'gate', 'save', 'console']);

  /* ---------------- map bake (静的レイヤー) ---------------- */
  const bakeCache = new Map();   // mapId → canvas
  function bakeMap(mapId, def) {
    const w = def._w, h = def._h;
    const cv = document.createElement('canvas');
    cv.width = w * TILE; cv.height = h * TILE;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    const walkable = (x, y) => {
      const ch = tileAt(def, x, y);
      return !SOLID.has(ch);
    };
    const occludes = (x, y) => OCCLUDER.has(tileAt(def, x, y));
    for (let ty = 0; ty < h; ty++) {
      for (let tx = 0; tx < w; tx++) {
        const ch = tileAt(def, tx, ty);
        const type = tileType(def, ch);
        if (ANIMATED.has(type)) {
          // アニメタイルの床下地を焼いておく
          if (type === 'gate' || type === 'save') { GM.SPRITES.drawFloorTile(c, def.floorTile || 'stone', tx, ty, 7); }
          else if (type === 'void' || type === 'water' || type === 'console') { /* 下地なしで毎フレーム全面描画 */ }
          continue;
        }
        if (ch === '#' || ch === 'm') {
          const below = walkable(tx, ty + 1), above = walkable(tx, ty - 1);
          const variant = below ? 'front' : (above ? 'cap' : 'flat');
          GM.SPRITES.drawWallTile(c, type, tx, ty, variant, 7);
        } else {
          GM.SPRITES.drawTile(c, type, tx, ty, 0, 7);
        }
      }
    }
    /* AO: 床タイルに隣接壁の影を落とす */
    for (let ty = 0; ty < h; ty++) {
      for (let tx = 0; tx < w; tx++) {
        const ch = tileAt(def, tx, ty);
        if (SOLID.has(ch)) continue;
        const px = tx * TILE, py = ty * TILE;
        const t = occludes(tx, ty - 1), b = occludes(tx, ty + 1);
        const l = occludes(tx - 1, ty), r = occludes(tx + 1, ty);
        if (t) {
          const g = c.createLinearGradient(0, py, 0, py + 5);
          g.addColorStop(0, 'rgba(5,8,20,.42)'); g.addColorStop(1, 'rgba(5,8,20,0)');
          c.fillStyle = g; c.fillRect(px, py, TILE, 5);
        }
        if (l) {
          const g = c.createLinearGradient(px, 0, px + 4, 0);
          g.addColorStop(0, 'rgba(5,8,20,.30)'); g.addColorStop(1, 'rgba(5,8,20,0)');
          c.fillStyle = g; c.fillRect(px, py, 4, TILE);
        }
        if (r) {
          const g = c.createLinearGradient(px + TILE, 0, px + TILE - 4, 0);
          g.addColorStop(0, 'rgba(5,8,20,.30)'); g.addColorStop(1, 'rgba(5,8,20,0)');
          c.fillStyle = g; c.fillRect(px + TILE - 4, py, 4, TILE);
        }
        if (b) {
          const g = c.createLinearGradient(0, py + TILE, 0, py + TILE - 3);
          g.addColorStop(0, 'rgba(5,8,20,.24)'); g.addColorStop(1, 'rgba(5,8,20,0)');
          c.fillStyle = g; c.fillRect(px, py + TILE - 3, TILE, 3);
        }
        // 角の影
        if (t && l && occludes(tx - 1, ty - 1)) { c.fillStyle = 'rgba(5,8,20,.30)'; c.fillRect(px, py, 4, 4); }
        if (t && r && occludes(tx + 1, ty - 1)) { c.fillStyle = 'rgba(5,8,20,.30)'; c.fillRect(px + TILE - 4, py, 4, 4); }
      }
    }
    /* ゲート番号ラベル（ハブ): 壁に章番号を焼く */
    if (def.id === 'hub') {
      (def.events || []).forEach((ev) => {
        if (ev.type !== 'gate') return;
        const lx = ev.x * TILE + TILE / 2, ly = (ev.y - 1) * TILE + 11;
        c.font = 'bold 9px monospace';
        c.textAlign = 'center';
        c.fillStyle = 'rgba(0,0,0,.55)';
        c.fillText(String(ev.gate), lx + 1, ly + 1);
        c.fillStyle = '#ffd94a';
        c.fillText(String(ev.gate), lx, ly);
      });
    }
    /* 出口ポータルの床ルーン（静的ベース）: exit イベント位置に焼き込む */
    (def.events || []).forEach((ev) => {
      if (ev.type !== 'exit') return;
      const px = ev.x * TILE, py = ev.y * TILE;
      const cx = px + TILE / 2, cy = py + TILE / 2;
      c.fillStyle = 'rgba(8,26,38,.60)';
      c.beginPath(); c.arc(cx, cy, 7.5, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(130,235,255,.55)'; c.lineWidth = 1;
      c.beginPath(); c.arc(cx, cy, 7.5, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(cx, cy, 4.5, 0, Math.PI * 2); c.stroke();
      c.fillStyle = 'rgba(170,245,255,.30)';
      c.fillRect(px + 7, py + 1, 2, 14); c.fillRect(px + 1, py + 7, 14, 2);
    });
    return cv;
  }
  function invalidateBake(mapId) { bakeCache.delete(mapId); }
  GM.invalidateBake = invalidateBake;

  /* ---------------- vignette ---------------- */
  let vignette = null;
  function getVignette() {
    const VW = GM.VW, VH = GM.VH;
    if (vignette && vignette._w === VW && vignette._h === VH) return vignette;
    const cv = document.createElement('canvas');
    cv.width = VW; cv.height = VH;
    cv._w = VW; cv._h = VH;
    const c = cv.getContext('2d');
    const g = c.createRadialGradient(VW / 2, VH / 2, VH * 0.42, VW / 2, VH / 2, Math.max(VW, VH) * 0.85);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(2,4,14,.42)');
    c.fillStyle = g; c.fillRect(0, 0, VW, VH);
    vignette = cv;
    return cv;
  }
  GM.onViewportChange = () => { vignette = null; };

  /* ---------------- map load ---------------- */
  GM.loadMap = function (mapId) {
    const def = GM.MAPS[mapId];
    if (!def) { console.warn('map not found', mapId); return; }
    S.mapId = mapId;
    S.map = def;
    const w = Math.max(...def.map.map((r) => r.length));
    def.map = def.map.map((r) => r.padEnd(w, '#'));
    def._w = w; def._h = def.map.length;
    if (!bakeCache.has(mapId)) bakeCache.set(mapId, bakeMap(mapId, def));
    S.bake = bakeCache.get(mapId);
    S.steps = 0;
    S.encThreshold = (def.encRate || 16) + U.randi(-4, 6);
    if (def.bgm) GM.AUDIO.playBGM(def.bgm);
    GM.updateHUD();
  };
  /* カメラ: マップがビューポートより小さい場合は中央寄せ（余白は虚空） */
  function camAxis(pos, mapPx, viewPx) {
    if (mapPx >= viewPx) return U.clamp(pos, 0, mapPx - viewPx);
    return (mapPx - viewPx) / 2;
  }
  GM.centerCam = function () {
    const VW = GM.VW, VH = GM.VH;
    S.cam.x = camAxis(S.player.x * TILE - VW / 2 + TILE / 2, S.map._w * TILE, VW);
    S.cam.y = camAxis(S.player.py || S.player.y * TILE - VH / 2 + TILE / 2, S.map._h * TILE, VH);
  };

  /* ---------------- safe landing (自己修復ランディング) ----------------
   指定座標が壁・虚空・踏み込みイベント上なら、最寄りの安全な床へ BFS で退避。
   旧セーブとの互換・マップ改修時のソフトロックを構造的に排除する */
  GM.safeLanding = function (map, x, y) {
    if (!map || !map.map) return { x: x || 0, y: y || 0 };
    const w = map._w || Math.max(...map.map.map((r) => r.length));
    const h = map._h || map.map.length;
    const stepEv = (tx, ty) => (map.events || []).some((e) =>
      e.x === tx && e.y === ty && (e.type === 'exit' || e.type === 'gate' || e.type === 'gate2' || e.type === 'boss'));
    const inb = (tx, ty) => tx >= 0 && ty >= 0 && tx < w && ty < h;
    const ok = (tx, ty) => inb(tx, ty) && !GM.isSolid(map, tx, ty) && !stepEv(tx, ty);
    if (ok(x, y)) return { x, y };
    // 始点が範囲外ならクランプして探索開始
    const sx = U.clamp(x | 0, 0, w - 1), sy = U.clamp(y | 0, 0, h - 1);
    if (ok(sx, sy)) return { x: sx, y: sy };
    const seen = new Set([sx + ',' + sy]);
    const q = [[sx, sy]];
    while (q.length) {
      const [cx, cy] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, k = nx + ',' + ny;
        if (!inb(nx, ny) || seen.has(k)) continue;
        seen.add(k);
        if (ok(nx, ny)) return { x: nx, y: ny };
        if (!GM.isSolid(map, nx, ny)) q.push([nx, ny]); // 歩行可能だがイベント上 → さらに探索
      }
    }
    return (map.entry) ? { x: map.entry.x, y: map.entry.y } : { x: sx, y: sy };
  };

  GM.startField = function () {
    if (S.loc && S.loc.map) {
      GM.loadMap(S.loc.map);
      // セーブ時の位置が現行マップで歩行不能になっている場合の自己修復
      const fix = GM.safeLanding(S.map, S.loc.x, S.loc.y);
      S.player.x = fix.x; S.player.y = fix.y; S.player.dir = S.loc.dir || 'down';
      S.loc = { map: S.mapId, x: fix.x, y: fix.y, dir: S.player.dir };
    }
    S.player.px = S.player.x * TILE; S.player.py = S.player.y * TILE;
    if (!S.battleParty.length) S.battleParty = S.party.slice(0, Math.min(4, S.party.length));
    S.scene = 'field';
    $('hud').classList.remove('hidden');
    GM.centerCam();
    GM.updateHUD();
    // 初回ヒント: ☰MENU / ⛶全画面 の案内（1回のみ）+ 未使用ならMENUボタンをパルス
    try {
      const mb = $('btn-menu');
      if (!localStorage.getItem('gm_hint_ui')) {
        localStorage.setItem('gm_hint_ui', '1');
        setTimeout(() => {
          GM.toast('右上の ☰ MENU：装備・セーブ等／⛶：全画面表示', true);
          if (mb && !localStorage.getItem('gm_menu_used')) mb.classList.add('pulse');
        }, 900);
      } else if (mb && !localStorage.getItem('gm_menu_used')) {
        mb.classList.add('pulse');
      }
    } catch (e) {}
    return true;
  };

  /* ---------------- events lookup ---------------- */
  function eventAt(x, y) {
    if (!S.map.events) return null;
    return S.map.events.find((e) => e.x === x && e.y === y) || null;
  }
  function npcAt(x, y) {
    return (S.map.npcs || []).find((n) => n.x === x && n.y === y) || null;
  }

  async function interact() {
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[S.player.dir];
    const tx = S.player.x + d[0], ty = S.player.y + d[1];
    // NPC
    const npc = npcAt(tx, ty);
    if (npc) {
      GM.AUDIO.sfx('open');
      npc.dir = ({ up: 'down', down: 'up', left: 'right', right: 'left' })[S.player.dir];
      if (npc.script) { await GM.runScript(npc.script); }
      else if (npc.lines) {
        for (const line of npc.lines) await GM.Dlg.show(npc.name, line);
        GM.Dlg.hide();
      }
      return;
    }
    // chest tile
    if (tileAt(S.map, tx, ty) === '*') {
      const chest = (S.map.chests || []).find((c) => c.x === tx && c.y === ty);
      const key = S.mapId + ':' + tx + ',' + ty;
      if (chest && !S.opened[key]) {
        S.opened[key] = true;
        GM.AUDIO.sfx('item');
        GM.addItem(chest.item, chest.qty || 1);
        GM.toast(`${GM.itemName(chest.item)} ×${chest.qty || 1} を手に入れた！`);
      } else {
        GM.toast('空の宝箱だ……');
      }
      return;
    }
    const ev = eventAt(tx, ty);
    if (!ev) return;
    await runEvent(ev, tx, ty);
  }
  GM.interact = interact;

  async function runEvent(ev, tx, ty) {
    switch (ev.type) {
      case 'save': {
        GM.AUDIO.sfx('save');
        GM.uiOwner = 'save';
        const slot = await GM.SaveDialog.show('save');
        GM.uiOwner = null;
        if (slot != null) GM.saveGame(slot);
        break;
      }
      case 'sign':
        GM.AUDIO.sfx('open');
        for (const line of (ev.lines || [])) await GM.Dlg.show(null, line);
        GM.Dlg.hide();
        break;
      case 'gate': {
        const n = ev.gate;
        if (S.gates[n]) {
          GM.AUDIO.sfx('gate');
          await GM.runScript('gate_go_' + n);
        } else {
          GM.AUDIO.sfx('cancel');
          const ch = GM.CHAPTERS && GM.CHAPTERS[n];
          GM.Dlg.show(null, ch ? `──このゲートはまだ起動していない。\n（第${n}章はまだ観測されていない時代だ）` : `このゲートはまだ起動していない。`).then(() => GM.Dlg.hide());
        }
        break;
      }
      case 'gate2':
        if (ev.hidden && !S.killed[ev.script]) { /* 隠しゲート */ }
        GM.AUDIO.sfx('gate');
        await GM.runScript(ev.script);
        break;
      case 'exit': {
        GM.AUDIO.sfx('confirm');
        const to = ev.to[0];
        const dst = GM.MAPS[to];
        if (!dst) { console.warn('[exit] 行き先マップが存在しません:', to); break; }
        // 指定座標を尊重（指定がなければマップの entry）。到達不能なら安全地点へ自動補正
        let ent = (ev.to.length >= 3) ? { x: ev.to[1], y: ev.to[2] } : (dst.entry || { x: 1, y: 1 });
        ent = GM.safeLanding(dst, ent.x, ent.y);
        S.loc = { map: to, x: ent.x, y: ent.y, dir: S.player.dir };
        GM.loadMap(to);
        S.player.x = ent.x; S.player.y = ent.y;
        S.player.px = ent.x * TILE; S.player.py = ent.y * TILE;
        GM.centerCam();
        break;
      }
      case 'shop':
        GM.AUDIO.sfx('open');
        await GM.openShop(ev.shop);
        break;
      case 'boss': {
        const key = S.mapId + ':' + tx + ',' + ty;
        if (S.killed[key]) break;
        GM.pendingBossKey = key;
        await GM.runScript(ev.script);
        break;
      }
      case 'trigger': {
        const key = S.mapId + ':' + ev.script;
        if (ev.once && S.flags['trg_' + key]) break;
        S.flags['trg_' + key] = true;
        await GM.runScript(ev.script);
        break;
      }
    }
  }
  GM.runEvent = runEvent;

  /* boss battle kills: mark tile dead after victory via script flag hook */
  GM.markBossDead = function (tx, ty) {
    S.killed[S.mapId + ':' + tx + ',' + ty] = true;
  };

  /* ---------------- movement ---------------- */
  let moveT = 0; // 0..1 progress
  const MOVE_MS = 140;
  let lastDir = 'down';
  let stepLock = 0;  // step-on 発動後のクールダウン

  function tryMove(dir) {
    if (S.player.moving) return;
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    S.player.dir = dir;
    const nx = S.player.x + d[0], ny = S.player.y + d[1];
    if (GM.isSolid(S.map, nx, ny)) return;
    if (npcAt(nx, ny)) return;
    S.player.moving = true;
    moveT = 0;
    S.player.fx = S.player.x; S.player.fy = S.player.y;
    S.player.x = nx; S.player.y = ny;
    S.player.frame = (S.player.frame + 1) % 4;
    // steps & encounters
    S.steps++;
    if (S.map.encounters && S.steps >= S.encThreshold) {
      S.steps = 0;
      S.encThreshold = (S.map.encRate || 16) + U.randi(-4, 6);
      startRandomEncounter();
    }
    // step-on events（扉・出口は踏み込み発動。会話系はAボタン）
    const ev = eventAt(nx, ny);
    if (ev) {
      if (ev.type === 'trigger' && ev.once) {
        const key = S.mapId + ':' + ev.script;
        if (!S.flags['trg_' + key]) {
          S.flags['trg_' + key] = true;
          GM.runScript(ev.script);
        }
      } else if ((ev.type === 'gate' || ev.type === 'gate2' || ev.type === 'exit' || ev.type === 'save') && !GM.uiOwner) {
        // 踏み込んで発動（moveT完了後に発火させる）
        S.player._pendingStep = ev;
      }
    }
  }

  function startRandomEncounter() {
    const table = GM.FORMATIONS[S.map.encounters];
    if (!table || !table.length) return;
    const formation = U.pick(table);
    GM.AUDIO.sfx('encounter');
    GM.Battle.run(formation, { noEscape: !!S.map.noEscape });
  }

  function updateField(dt) {
    if (!S.map) return;
    // step-on event (扉/出口)
    if (S.player._pendingStep && !S.player.moving && !GM.uiOwner && S.scene === 'field' && GM.tickNow() - stepLock > 350) {
      const ev = S.player._pendingStep;
      S.player._pendingStep = null;
      stepLock = GM.tickNow();
      GM.runEvent(ev, S.player.x, S.player.y);
    }
    // input
    if (!S.player.moving && S.scene === 'field' && !GM.uiOwner) {
      const b = GM.Input.consume();
      if (b === 'a') { GM.AUDIO.sfx('cursor'); interact(); }
      else if (b === 'menu') { GM.Menu.open(); }
      else if (b) lastDir = b;
      if (heldReady()) {
        for (const dir of ['up', 'down', 'left', 'right']) {
          if (GM.Input.held[dir]) { tryMove(dir); break; }
        }
      }
    }
    // movement progress
    if (S.player.moving) {
      moveT += dt / MOVE_MS;
      if (moveT >= 1) {
        moveT = 1;
        S.player.moving = false;
        S.player.px = S.player.x * TILE;
        S.player.py = S.player.y * TILE;
      } else {
        const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[S.player.dir];
        S.player.px = (S.player.fx + d[0] * moveT) * TILE;
        S.player.py = (S.player.fy + d[1] * moveT) * TILE;
      }
    }
    // npc wander
    (S.map.npcs || []).forEach((npc) => {
      if (!npc.wander) return;
      npc._t = (npc._t || 0) + dt;
      if (npc._t > 2200) {
        npc._t = 0;
        const dirs = ['up', 'down', 'left', 'right'];
        const dir = U.pick(dirs);
        const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
        const nx = npc.x + d[0], ny = npc.y + d[1];
        if (!GM.isSolid(S.map, nx, ny) && !npcAt(nx, ny) &&
          !(nx === S.player.x && ny === S.player.y)) {
          npc.x = nx; npc.y = ny; npc.dir = dir;
        }
      }
    });
    // camera
    const VW = GM.VW, VH = GM.VH;
    const txc = camAxis(S.player.px + TILE / 2 - VW / 2, S.map._w * TILE, VW);
    const tyc = camAxis(S.player.py + TILE / 2 - VH / 2, S.map._h * TILE, VH);
    S.cam.x += (txc - S.cam.x) * Math.min(1, dt / 80);
    S.cam.y += (tyc - S.cam.y) * Math.min(1, dt / 80);
  }

  function heldReady() {
    return ['up', 'down', 'left', 'right'].some((k) => GM.Input.held[k]);
  }

  /* ---------------- exit portal ---------------- */
  function drawExitPortal(ctx, sx, sy, t) {
    const pl = Math.sin(t / 13) * 0.5 + 0.5;
    // 光柱（上に伸びる）
    const g = ctx.createLinearGradient(0, sy - 16, 0, sy + 16);
    g.addColorStop(0, 'rgba(98,214,255,0)');
    g.addColorStop(1, `rgba(98,214,255,${0.16 + pl * 0.10})`);
    ctx.fillStyle = g;
    ctx.fillRect(sx + 3, sy - 16, 10, 32);
    // クリスタル本体
    ctx.fillStyle = `rgba(110,205,245,${0.78 + pl * 0.2})`;
    ctx.fillRect(sx + 6, sy + 4, 4, 7);
    ctx.fillRect(sx + 5, sy + 6, 6, 4);
    ctx.fillStyle = `rgba(225,252,255,${0.85 + pl * 0.15})`;
    ctx.fillRect(sx + 7, sy + 2, 2, 9);
    ctx.fillRect(sx + 6, sy + 3, 4, 2);
    // 浮遊▼（踏み込み地点を示す）
    const ay = sy - 7 - Math.round(pl * 2);
    ctx.fillStyle = `rgba(140,235,255,${0.7 + pl * 0.3})`;
    ctx.fillRect(sx + 5, ay + 2, 6, 2);
    ctx.fillRect(sx + 6, ay + 4, 4, 1);
    ctx.fillRect(sx + 7, ay + 5, 2, 1);
  }

  /* ---------------- portal labels / edge arrows ---------------- */
  function portalLabel(ev) {
    if (ev.type === 'exit') {
      const dst = GM.MAPS[ev.to && ev.to[0]];
      if (!dst) return null;
      return dst.id === 'hub' ? '▶ リミナル・フォージ' : '▶ ' + dst.name;
    }
    if (ev.type === 'gate' && ev.gate) {
      const ch = GM.CHAPTERS && GM.CHAPTERS[ev.gate];
      if (!S.gates[ev.gate]) return '第' + ev.gate + '章ゲート（未起動）';
      return ch ? ('▶ 第' + ev.gate + '章「' + ch.name + '」') : ('▶ 第' + ev.gate + '章');
    }
    if (ev.type === 'gate2') return '▶ ？？？';
    return null;
  }

  function drawPortalLabels(ctx, map, camX, camY, VW, VH) {
    (map.events || []).forEach((ev) => {
      if (ev.type !== 'exit' && ev.type !== 'gate' && ev.type !== 'gate2') return;
      const d = Math.abs(ev.x - S.player.x) + Math.abs(ev.y - S.player.y);
      if (d > 5) return;
      const text = portalLabel(ev);
      if (!text) return;
      const sx = ev.x * TILE - camX + 8, sy = ev.y * TILE - camY;
      if (sx < -20 || sx > VW + 20 || sy < 10 || sy > VH + 10) return;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      const w = Math.ceil(ctx.measureText(text).width) + 10;
      let bx = sx - w / 2, by = sy - 24;
      bx = Math.max(2, Math.min(VW - w - 2, bx));
      if (by < 2) by = 2;
      ctx.fillStyle = 'rgba(4,8,24,.86)';
      ctx.fillRect(bx, by, w, 12);
      ctx.strokeStyle = ev.type === 'exit' ? 'rgba(120,235,255,.9)' : 'rgba(255,217,74,.9)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, w - 1, 11);
      ctx.fillStyle = ev.type === 'exit' ? '#bff4ff' : '#ffe9a0';
      ctx.fillText(text, bx + w / 2, by + 9);
    });
  }

  function drawPortalArrows(ctx, map, camX, camY, VW, VH) {
    const pl = Math.sin(S.tick / 12) * 0.5 + 0.5;
    (map.events || []).forEach((ev) => {
      if (ev.type !== 'exit' && ev.type !== 'gate') return;
      if (ev.type === 'gate' && !S.gates[ev.gate]) return; // 未起動ゲートは案内しない
      const cx = ev.x * TILE + 8 - camX, cy = ev.y * TILE + 8 - camY;
      const m = 14;
      if (cx > m && cx < VW - m && cy > m && cy < VH - m) return; // 画面内なら不要
      const ax = Math.max(m, Math.min(VW - m, cx));
      const ay = Math.max(m, Math.min(VH - m, cy));
      const ang = Math.atan2(cy - ay, cx - ax);
      const rgb = ev.type === 'exit' ? '98,214,255' : '255,217,74';
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(ang);
      ctx.globalAlpha = 0.55 + pl * 0.45;
      ctx.fillStyle = `rgba(${rgb},.92)`;
      ctx.beginPath();
      ctx.moveTo(7, 0); ctx.lineTo(-4, -5); ctx.lineTo(-4, 5); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgba(${rgb},1)`; ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  /* ---------------- render ---------------- */
  function renderField(ctx) {
    const VW = GM.VW, VH = GM.VH;
    const map = S.map;
    if (!map || !S.bake) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH); return; }
    const camX = Math.floor(S.cam.x), camY = Math.floor(S.cam.y);
    const x0 = Math.floor(camX / TILE), y0 = Math.floor(camY / TILE);
    const x1 = Math.ceil((camX + VW) / TILE), y1 = Math.ceil((camY + VH) / TILE);
    ctx.fillStyle = '#02030a';
    ctx.fillRect(0, 0, VW, VH);
    // 静的レイヤー
    ctx.drawImage(S.bake, -camX, -camY);
    // アニメーションタイル
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const type = tileType(map, tileAt(map, tx, ty));
        if (ANIMATED.has(type)) GM.SPRITES.drawTile(ctx, type, tx, ty, S.tick, 7);
      }
    }
    // 出口ポータル（点滅クリスタル + 光柱 + ルーン）
    (map.events || []).forEach((ev) => {
      if (ev.type !== 'exit') return;
      const sx = ev.x * TILE - camX, sy = ev.y * TILE - camY;
      if (sx > -24 && sy > -24 && sx < VW + 24 && sy < VH + 24) drawExitPortal(ctx, sx, sy, S.tick);
    });
    // opened chests look
    (map.chests || []).forEach((c) => {
      const key = S.mapId + ':' + c.x + ',' + c.y;
      if (S.opened[key]) {
        const sx = c.x * TILE - camX, sy = c.y * TILE - camY;
        if (sx > -TILE && sy > -TILE && sx < VW && sy < VH) {
          GM.SPRITES.drawTile(ctx, 'chestopen', c.x, c.y, S.tick, 7);
        }
      }
    });
    // npcs
    (map.npcs || []).forEach((npc) => {
      const look = typeof npc.look === 'string' ? (GM.LOOKS[npc.look] || GM.LOOKS.citizen) : npc.look;
      const sx = npc.x * TILE - camX, sy = npc.y * TILE - camY;
      if (sx > -32 && sy > -32 && sx < VW + 32 && sy < VH + 32) {
        GM.SPRITES.drawShadow(ctx, sx + 8, sy + 15, 6);
        GM.SPRITES.drawChibi(ctx, sx + 2, sy - 1, look, npc.dir || 'down', 0, 1);
      }
    });
    // player
    const psx = S.player.px - camX, psy = S.player.py - camY;
    const pc = GM.CHARACTERS[S.battleParty[0] ? S.battleParty[0].id : 'layla'] || GM.CHARACTERS.layla;
    GM.SPRITES.drawShadow(ctx, psx + 8, psy + 15, 6);
    GM.SPRITES.drawChibi(ctx, psx + 2, psy - 1, pc.look, S.player.dir, S.player.frame, 1);
    // vignette
    ctx.drawImage(getVignette(), 0, 0);
    // ポータル行き先ラベル（近くで表示）
    drawPortalLabels(ctx, map, camX, camY, VW, VH);
    // 画面外ポータルへの方向矢印
    drawPortalArrows(ctx, map, camX, camY, VW, VH);
    // fade
    if (S.fade.a > 0) {
      ctx.fillStyle = `rgba(0,0,0,${S.fade.a})`;
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  GM.Field = { update: updateField, render: renderField };
  GM._SOLID = SOLID; // 内蔵テスト環境からの連結性検証用
})(window.GM);
