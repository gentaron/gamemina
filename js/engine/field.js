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
  const U = GM.U, S = GM.state;
  const TILE = 16, VW = 480, VH = 304;

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
    return cv;
  }
  function invalidateBake(mapId) { bakeCache.delete(mapId); }
  GM.invalidateBake = invalidateBake;

  /* ---------------- vignette ---------------- */
  let vignette = null;
  function getVignette() {
    if (vignette) return vignette;
    const cv = document.createElement('canvas');
    cv.width = VW; cv.height = VH;
    const c = cv.getContext('2d');
    const g = c.createRadialGradient(VW / 2, VH / 2, VH * 0.42, VW / 2, VH / 2, VH * 0.85);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(2,4,14,.42)');
    c.fillStyle = g; c.fillRect(0, 0, VW, VH);
    vignette = cv;
    return cv;
  }

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
  GM.centerCam = function () {
    S.cam.x = U.clamp(S.player.x * TILE - VW / 2 + TILE / 2, 0, Math.max(0, S.map._w * TILE - VW));
    S.cam.y = U.clamp(S.player.py || S.player.y * TILE - VH / 2 + TILE / 2, 0, Math.max(0, S.map._h * TILE - VH));
  };

  GM.startField = function () {
    if (S.loc && S.loc.map) {
      GM.loadMap(S.loc.map);
      S.player.x = S.loc.x; S.player.y = S.loc.y; S.player.dir = S.loc.dir || 'down';
    }
    if (!S.battleParty.length) S.battleParty = S.party.slice(0, Math.min(4, S.party.length));
    S.scene = 'field';
    $('hud').classList.remove('hidden');
    GM.centerCam();
    GM.updateHUD();
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
        const [to] = ev.to;
        const dst = GM.MAPS[to];
        const ent = (dst && dst.entry) || { x: 1, y: 1 };
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
    if (!table) return;
    const formation = U.pick(table);
    GM.AUDIO.sfx('encounter');
    GM.Battle.run(formation, {});
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
    const txc = U.clamp(S.player.px + TILE / 2 - VW / 2, 0, Math.max(0, S.map._w * TILE - VW));
    const tyc = U.clamp(S.player.py + TILE / 2 - VH / 2, 0, Math.max(0, S.map._h * TILE - VH));
    S.cam.x += (txc - S.cam.x) * Math.min(1, dt / 80);
    S.cam.y += (tyc - S.cam.y) * Math.min(1, dt / 80);
  }

  function heldReady() {
    return ['up', 'down', 'left', 'right'].some((k) => GM.Input.held[k]);
  }

  /* ---------------- render ---------------- */
  function renderField(ctx) {
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
    // fade
    if (S.fade.a > 0) {
      ctx.fillStyle = `rgba(0,0,0,${S.fade.a})`;
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  GM.Field = { update: updateField, render: renderField };
})(window.GM);
