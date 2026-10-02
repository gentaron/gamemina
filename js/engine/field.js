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
  /* v3: 'v'=奈落 は通行不可（旧: 歩ける虚空で視覚と挙動が矛盾していた）
     'S'=セーブ結晶は「調べる物体」（旧: 踏むと発動し、通りがかるたびにセーブ画面が開いていた） */
  const SOLID = new Set(['#', ' ', 'w', 't', 'r', 'c', 'C', 'b', 'p', 'm', 'x', 'o', '*', 'T', 'v', 'P', 'F', 'L', 'u', 'K', 'S']);
  /* 影を落とすオクルーダー（壁＋背の高い障害物） */
  const OCCLUDER = new Set(['#', 'm', 'r', 'c', 'C', 'o', 'x', 't', 'T', 'P', 'K']);
  /* 床の上に置かれる装飾タイル（焼き込み時に下地の床を先に描く） */
  const ON_FLOOR = new Set(['tree', 'crate', 'plant', 'sign', 'chest', 'pillar', 'fence', 'rubble', 'statue', 'stair', 'door', 'thorn', 'rock', 'counter', 'bed']);
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
      case '.': return (map.floorTile === 'void' ? 'rift' : map.floorTile) || 'stone';
      case 'w': return map.liquid || 'water';
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
      case ',': return map.altTile || 'stone';
      case ':': return 'dirt';
      case '=': return 'road';
      case 'V': return 'rift';
      case 'D': return 'door';
      case 'P': return 'pillar';
      case 'F': return 'fence';
      case 'L': return 'lamp';
      case 'u': return 'rubble';
      case 'K': return 'statue';
      default: return map.floorTile || 'stone';
    }
  }
  GM.tileType = tileType;

  /* アニメーションするタイル（毎フレーム描画） */
  const ANIMATED = new Set(['water', 'slime', 'sewage', 'void', 'gate', 'save', 'console', 'lamp']);

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
          if (type === 'gate' || type === 'save' || type === 'lamp') { GM.SPRITES.drawFloorTile(c, def.floorTile || 'stone', tx, ty, 7); }
          else if (type === 'void' || type === 'water' || type === 'console') { /* 下地なしで毎フレーム全面描画 */ }
          continue;
        }
        if (ch === '#' || ch === 'm') {
          const below = walkable(tx, ty + 1), above = walkable(tx, ty - 1);
          let variant = below ? 'front' : (above ? 'cap' : 'flat');
          if (def.roofs && variant !== 'front') variant = variant === 'cap' ? 'roofcap' : 'roof';
          GM.SPRITES.drawWallTile(c, type, tx, ty, variant, 7);
        } else {
          if (ON_FLOOR.has(type)) GM.SPRITES.drawFloorTile(c, def.floorTile || 'stone', tx, ty, 7);
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
    if (GM._lastBannerMap !== mapId) {
      GM._lastBannerMap = mapId;
      if (GM.showAreaBanner) GM.showAreaBanner(def.name, def.encounters ? '── 魔物の気配がする ──' : (def.id === 'hub' ? '── 時空の回廊 ──' : ''));
    }
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
  /* 仲間に加わった NPC は消える（hideIfParty） */
  function npcVisible(n) {
    return !(n.hideIfParty && S.party.some((m) => m.id === n.hideIfParty));
  }
  GM.npcVisible = npcVisible;
  function npcAt(x, y) {
    return (S.map.npcs || []).find((n) => n.x === x && n.y === y && npcVisible(n)) || null;
  }

  /* ---------- ボス撃破状態 / 封印 ----------
     defeated_<boss> フラグが正。旧セーブ互換として「その章をクリア済みなら撃破済み」とみなす */
  const BOSS_CHAPTER = {
    bugboss: 0, executor: 1, titanrex: 2, celia: 2, ronan: 3, slimecore: 4, slimewoman: 4,
    dalgos: 5, vaeron: 5, fiona: 6, goldenvenom: 7, possessed: 8, minotaur: 9, abyssreais: 9,
    omega: 10, diana: 10
  };
  GM.BOSS_CHAPTER = BOSS_CHAPTER;
  GM.bossDefeated = function (id) {
    if (S.flags['defeated_' + id]) return true;
    const ch = BOSS_CHAPTER[id];
    if (ch != null && ch > 0 && (S.chapter || 0) >= ch) return true;
    if (ch === 0 && S.flags.hub_open) return true;
    return false;
  };
  GM.bossAlive = function (ev, mapId) {
    if (!ev || ev.type !== 'boss') return false;
    if (S.killed[(mapId || S.mapId) + ':' + ev.x + ',' + ev.y]) return false;
    return !GM.bossDefeated(ev.boss);
  };
  /* requires（ボス撃破）/ requiresFlag（フラグ）を満たさない間はロック */
  GM.isLocked = function (ev) {
    if (!ev) return false;
    if (ev.requires && !GM.bossDefeated(ev.requires)) return true;
    if (ev.requiresFlag && !S.flags[ev.requiresFlag]) return true;
    return false;
  };
  /* 歩行をブロックするイベント（生存ボス・ロック中の封印/出口） */
  function blockingEventAt(x, y) {
    const ev = eventAt(x, y);
    if (!ev) return null;
    if (ev.type === 'boss' && GM.bossAlive(ev)) return ev;
    if ((ev.type === 'barrier' || ev.requires || ev.requiresFlag) && GM.isLocked(ev)) return ev;
    return null;
  }
  GM.blockingEventAt = blockingEventAt;
  const LOCK_MSG = {
    exit: ['──見えない力に阻まれて、先へ進めない。', 'この場所を守る「主」を倒せば、道は開くはずだ。'],
    gate2: ['──壁に、微かな裂け目がある。', '今はまだ、向こう側の気配は閉ざされている。'],
    barrier: ['──封印の障壁が道を塞いでいる。']
  };
  async function showLocked(ev) {
    const lines = ev.lines || LOCK_MSG[ev.type] || LOCK_MSG.barrier;
    GM.AUDIO.sfx('cancel');
    for (const line of lines) await GM.Dlg.show(null, line);
    GM.Dlg.hide();
  }

  async function interact() {
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[S.player.dir];
    const tx = S.player.x + d[0], ty = S.player.y + d[1];
    // NPC（カウンター越しの会話にも対応）
    let npc = npcAt(tx, ty);
    if (!npc && tileAt(S.map, tx, ty) === 'C' && !eventAt(tx, ty)) npc = npcAt(tx + d[0], ty + d[1]);
    if (npc) {
      GM.AUDIO.sfx('open');
      npc.dir = ({ up: 'down', down: 'up', left: 'right', right: 'left' })[S.player.dir];
      if (npc.script) { await GM.runScript(npc.script); }
      else if (npc.lines) {
        for (const line of npc.lines) await GM.Dlg.show(npc.name, line);
        GM.Dlg.hide();
      }
      if (npc.shop != null) await GM.openShop(npc.shop);
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
    if (GM.isLocked(ev)) { await showLocked(ev); return; }
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
        if (GM.isLocked(ev)) { await showLocked(ev); break; }
        GM.AUDIO.sfx('gate');
        await GM.runScript(ev.script);
        break;
      case 'exit': {
        if (GM.isLocked(ev)) { await showLocked(ev); break; }
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
        if (!GM.bossAlive(ev)) break;
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
  let bumpLock = 0;  // ボス/封印への体当たりクールダウン

  function tryMove(dir) {
    if (S.player.moving) return;
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    S.player.dir = dir;
    const nx = S.player.x + d[0], ny = S.player.y + d[1];
    if (GM.isSolid(S.map, nx, ny)) return;
    if (npcAt(nx, ny)) return;
    const blk = blockingEventAt(nx, ny);
    if (blk) {
      // ボスに体当たり → 戦闘開始 / 封印 → メッセージ（連打防止のクールダウン付き）
      if (!GM.uiOwner && GM.tickNow() - bumpLock > 600) {
        bumpLock = GM.tickNow();
        S.player._pendingBump = blk;
      }
      return;
    }
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
      } else if ((ev.type === 'gate' || ev.type === 'gate2' || ev.type === 'exit') && !GM.uiOwner) {
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
    // bump（ボス接触・封印）
    if (S.player._pendingBump && !S.player.moving && !GM.uiOwner && S.scene === 'field') {
      const ev = S.player._pendingBump;
      S.player._pendingBump = null;
      if (ev.type === 'boss') { GM.AUDIO.sfx('encounter'); GM.runEvent(ev, ev.x, ev.y); }
      else showLocked(ev);
    }
    // input（会話ウィンドウ表示中は歩けない）
    if (!S.player.moving && S.scene === 'field' && !GM.uiOwner && !GM.dialogueOpen()) {
      const b = GM.Input.consume();
      if (b === 'a') { GM.AUDIO.sfx('cursor'); interact(); }
      else if (b === 'menu') { GM.Menu.open(); }
      else if (b === 'map') { GM.toggleMinimap(); }
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
      if (!npc.wander || !npcVisible(npc)) return;
      npc._t = (npc._t || 0) + dt;
      if (npc._t > 2200) {
        npc._t = 0;
        const dirs = ['up', 'down', 'left', 'right'];
        const dir = U.pick(dirs);
        const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
        const nx = npc.x + d[0], ny = npc.y + d[1];
        const home = npc._home || (npc._home = { x: npc.x, y: npc.y });
        if (!GM.isSolid(S.map, nx, ny) && !npcAt(nx, ny) && !eventAt(nx, ny) &&
          Math.abs(nx - home.x) + Math.abs(ny - home.y) <= 3 &&
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
      if (GM.isLocked(ev)) return '✖ 封印中';
      return dst.id === 'hub' ? '▶ リミナル・フォージ' : '▶ ' + dst.name;
    }
    if (ev.type === 'boss') {
      if (!GM.bossAlive(ev)) return null;
      const e = GM.ENEMIES[ev.boss];
      return '⚠ ' + (e ? e.name : 'BOSS');
    }
    if (ev.type === 'gate' && ev.gate) {
      const ch = GM.CHAPTERS && GM.CHAPTERS[ev.gate];
      if (!S.gates[ev.gate]) return '第' + ev.gate + '章ゲート（未起動）';
      return ch ? ('▶ 第' + ev.gate + '章「' + ch.name + '」') : ('▶ 第' + ev.gate + '章');
    }
    if (ev.type === 'gate2') return GM.isLocked(ev) ? (ev.hidden ? null : '✖ 封印された門') : '▶ ？？？';
    return null;
  }

  function drawPortalLabels(ctx, map, camX, camY, VW, VH) {
    (map.events || []).forEach((ev) => {
      if (ev.type !== 'exit' && ev.type !== 'gate' && ev.type !== 'gate2' && ev.type !== 'boss') return;
      const d = Math.abs(ev.x - S.player.x) + Math.abs(ev.y - S.player.y);
      if (d > (ev.type === 'boss' ? 7 : 5)) return;
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
      const boss = ev.type === 'boss';
      ctx.strokeStyle = boss ? 'rgba(255,90,110,.95)' : ev.type === 'exit' ? 'rgba(120,235,255,.9)' : 'rgba(255,217,74,.9)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, w - 1, 11);
      ctx.fillStyle = boss ? '#ffc4cc' : ev.type === 'exit' ? '#bff4ff' : '#ffe9a0';
      ctx.fillText(text, bx + w / 2, by + 9);
    });
  }

  function drawPortalArrows(ctx, map, camX, camY, VW, VH) {
    const pl = Math.sin(S.tick / 12) * 0.5 + 0.5;
    (map.events || []).forEach((ev) => {
      if (ev.type !== 'exit' && ev.type !== 'gate' && ev.type !== 'boss') return;
      if (ev.type === 'gate' && !S.gates[ev.gate]) return; // 未起動ゲートは案内しない
      if (ev.type === 'boss' && !GM.bossAlive(ev)) return;
      if (ev.type === 'exit' && GM.isLocked(ev)) return;
      const cx = ev.x * TILE + 8 - camX, cy = ev.y * TILE + 8 - camY;
      const m = 14;
      if (cx > m && cx < VW - m && cy > m && cy < VH - m) return; // 画面内なら不要
      const ax = Math.max(m, Math.min(VW - m, cx));
      const ay = Math.max(m, Math.min(VH - m, cy));
      const ang = Math.atan2(cy - ay, cx - ax);
      const rgb = ev.type === 'boss' ? '255,90,110' : ev.type === 'exit' ? '98,214,255' : '255,217,74';
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

  /* ---------------- 奈落の縁（崖の断面） ---------------- */
  function drawVoidLip(ctx, map, tx, ty) {
    const up = tileAt(map, tx, ty - 1);
    if (up === 'v' || up === ' ' || up === '#' || up === 'm') return;
    const x = tx * TILE, y = ty * TILE;
    ctx.fillStyle = '#2a2f45'; ctx.fillRect(x, y, TILE, 4);
    ctx.fillStyle = '#3d4463'; ctx.fillRect(x, y, TILE, 1);
    const g = ctx.createLinearGradient(0, y + 4, 0, y + 10);
    g.addColorStop(0, 'rgba(20,24,44,.85)'); g.addColorStop(1, 'rgba(4,5,13,0)');
    ctx.fillStyle = g; ctx.fillRect(x, y + 4, TILE, 6);
  }

  /* ---------------- 封印障壁 / 隠し裂け目 ---------------- */
  function drawSeal(ctx, sx, sy, t) {
    const pl = Math.sin(t / 10) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(160,70,255,${0.28 + pl * 0.18})`;
    ctx.fillRect(sx + 1, sy, 14, 16);
    ctx.fillStyle = `rgba(230,190,255,${0.55 + pl * 0.35})`;
    for (let i = 0; i < 4; i++) {
      const yy = sy + ((i * 4 + (t >> 2)) % 16);
      ctx.fillRect(sx + 1, yy, 14, 1);
    }
    ctx.strokeStyle = `rgba(255,120,200,${0.7 + pl * 0.3})`; ctx.lineWidth = 1;
    ctx.strokeRect(sx + 1.5, sy + 0.5, 13, 15);
    // 錠前
    ctx.fillStyle = '#ffd94a'; ctx.fillRect(sx + 6, sy + 7, 4, 4);
    ctx.strokeStyle = '#ffd94a'; ctx.beginPath(); ctx.arc(sx + 8, sy + 7, 2, Math.PI, 0); ctx.stroke();
  }
  function drawCrack(ctx, sx, sy, t) {
    // 未解放の隠し門: 壁と見分けにくい裂け目だけが微かに光る
    ctx.save(); ctx.translate(sx, sy);
    GM.SPRITES.drawWallTile(ctx, S.map.wallTile || 'wall', 0, 0, 'front', 3);
    const pl = Math.sin(t / 18) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(190,120,255,${0.25 + pl * 0.45})`;
    ctx.fillRect(7, 2, 1, 4); ctx.fillRect(8, 5, 1, 4); ctx.fillRect(7, 8, 1, 3); ctx.fillRect(8, 11, 1, 3);
    ctx.restore();
  }

  /* ---------------- フィールド上のボス ---------------- */
  function drawFieldBoss(ctx, ev, sx, sy, t) {
    const e = GM.ENEMIES[ev.boss];
    const pl = Math.sin(t / 9) * 0.5 + 0.5;
    const bob = Math.round(Math.sin(t / 14) * 1.5);
    // 足元の禍々しいオーラ
    ctx.save();
    ctx.fillStyle = `rgba(255,40,80,${0.18 + pl * 0.16})`;
    ctx.beginPath(); ctx.ellipse(sx + 8, sy + 14, 11, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(255,120,150,${0.45 + pl * 0.4})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(sx + 8, sy + 14, 9 + pl * 2, 3.5 + pl, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    if (e && e.spr && GM.ENEMY_ART && GM.ENEMY_ART[e.spr]) {
      GM.SPRITES.drawEnemy(ctx, e.spr, sx + 8, sy + 14 + bob, 1, {});
    } else {
      ctx.fillStyle = `rgba(255,60,90,${0.7 + pl * 0.3})`; ctx.fillRect(sx + 4, sy + 2 + bob, 8, 11);
    }
    // 頭上の「！」
    const ay = sy - 9 - Math.round(pl * 2);
    ctx.fillStyle = '#ff5a6e'; ctx.fillRect(sx + 7, ay, 2, 5); ctx.fillRect(sx + 7, ay + 6, 2, 2);
  }

  /* ---------------- エリア名バナー ---------------- */
  let banner = null; // { text, sub, t0 }
  GM.showAreaBanner = function (text, sub) { banner = { text, sub: sub || '', t0: GM.tickNow() }; };
  function drawAreaBanner(ctx, VW) {
    if (!banner) return;
    const age = GM.tickNow() - banner.t0;
    const LIFE = 2600;
    if (age > LIFE) { banner = null; return; }
    const a = age < 300 ? age / 300 : age > LIFE - 500 ? (LIFE - age) / 500 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    const w = Math.max(ctx.measureText(banner.text).width + 48, 160);
    const x = VW / 2 - w / 2, y = 22;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, 'rgba(4,8,24,0)'); g.addColorStop(0.2, 'rgba(4,8,24,.88)');
    g.addColorStop(0.8, 'rgba(4,8,24,.88)'); g.addColorStop(1, 'rgba(4,8,24,0)');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, banner.sub ? 30 : 20);
    ctx.fillStyle = 'rgba(255,217,74,.8)'; ctx.fillRect(x + w * 0.2, y, w * 0.6, 1); ctx.fillRect(x + w * 0.2, y + (banner.sub ? 29 : 19), w * 0.6, 1);
    ctx.fillStyle = '#f4f6ff'; ctx.fillText(banner.text, VW / 2, y + 14);
    if (banner.sub) { ctx.font = '8px monospace'; ctx.fillStyle = '#aab4d8'; ctx.fillText(banner.sub, VW / 2, y + 25); }
    ctx.restore();
  }

  /* ---------------- ミニマップ（Q / HUD の地図ボタン） ---------------- */
  GM.toggleMinimap = function () {
    if (S.scene !== 'field' && S.scene !== 'script') return;
    S.showMinimap = !S.showMinimap;
    GM.AUDIO.sfx(S.showMinimap ? 'open' : 'cancel');
    try { localStorage.setItem('gm_minimap', S.showMinimap ? '1' : '0'); } catch (e) {}
  };
  try { S.showMinimap = localStorage.getItem('gm_minimap') === '1'; } catch (e) {}
  const mmCache = new Map();
  function minimapBase(map) {
    if (mmCache.has(map.id)) return mmCache.get(map.id);
    const cv = document.createElement('canvas');
    cv.width = map._w; cv.height = map._h;
    const c = cv.getContext('2d');
    for (let y = 0; y < map._h; y++) for (let x = 0; x < map._w; x++) {
      const ch = tileAt(map, x, y);
      let col = null;
      if (ch === 'v' || ch === ' ') col = null;
      else if (ch === 'w') col = map.liquid === 'slime' ? '#2f7a3a' : '#2a4f90';
      else if (ch === '#' || ch === 'm') col = '#1a2038';
      else if (SOLID.has(ch)) col = '#39415e';
      else col = '#7f89ad';
      if (col) { c.fillStyle = col; c.fillRect(x, y, 1, 1); }
    }
    mmCache.set(map.id, cv);
    return cv;
  }
  function drawMinimap(ctx, map, VW, VH) {
    const sc = Math.max(2, Math.min(4, Math.floor(Math.min(VW * 0.34 / map._w, VH * 0.45 / map._h))));
    const w = map._w * sc, h = map._h * sc;
    const x0 = VW - w - 8, y0 = 22;
    ctx.save();
    ctx.fillStyle = 'rgba(2,4,14,.78)'; ctx.fillRect(x0 - 4, y0 - 4, w + 8, h + 16);
    ctx.strokeStyle = 'rgba(120,235,255,.55)'; ctx.lineWidth = 1; ctx.strokeRect(x0 - 3.5, y0 - 3.5, w + 7, h + 15);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(minimapBase(map), x0, y0, w, h);
    const dot = (x, y, col, big) => { ctx.fillStyle = col; const s2 = big ? sc + 2 : sc; ctx.fillRect(x0 + x * sc - (big ? 1 : 0), y0 + y * sc - (big ? 1 : 0), s2, s2); };
    (map.chests || []).forEach((c) => { if (!S.opened[S.mapId + ':' + c.x + ',' + c.y]) dot(c.x, c.y, '#ffd94a'); });
    (map.events || []).forEach((ev) => {
      if (ev.type === 'exit') dot(ev.x, ev.y, GM.isLocked(ev) ? '#b05cff' : '#62d6ff', true);
      else if (ev.type === 'gate' && S.gates[ev.gate]) dot(ev.x, ev.y, '#ffd94a', true);
      else if (ev.type === 'save') dot(ev.x, ev.y, '#9fe8ff');
      else if (ev.type === 'boss' && GM.bossAlive(ev)) dot(ev.x, ev.y, '#ff4a64', true);
      else if (ev.type === 'barrier' && GM.isLocked(ev)) dot(ev.x, ev.y, '#b05cff');
    });
    (map.npcs || []).forEach((n) => { if (npcVisible(n)) dot(n.x, n.y, '#7ce38b'); });
    if ((S.tick >> 4) % 2 === 0) dot(S.player.x, S.player.y, '#ff7eb6', true);
    ctx.font = '8px monospace'; ctx.textAlign = 'left'; ctx.fillStyle = '#bff4ff';
    ctx.fillText('MAP [Q]', x0, y0 + h + 9);
    ctx.restore();
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
    // アニメーションタイル（ワールド座標で描くためカメラ分を平行移動。
    // 旧: オフセット未適用でスクロール時に水・結晶・ゲートが本来の位置からズレていた）
    ctx.save();
    ctx.translate(-camX, -camY);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const type = tileType(map, tileAt(map, tx, ty));
        if (ANIMATED.has(type)) {
          GM.SPRITES.drawTile(ctx, type, tx, ty, S.tick, 7);
          if (type === 'void') drawVoidLip(ctx, map, tx, ty);
        }
      }
    }
    ctx.restore();
    // 出口ポータル（点滅クリスタル + 光柱 + ルーン）/ 封印 / 隠し裂け目
    (map.events || []).forEach((ev) => {
      const sx = ev.x * TILE - camX, sy = ev.y * TILE - camY;
      if (!(sx > -24 && sy > -24 && sx < VW + 24 && sy < VH + 24)) return;
      const locked = GM.isLocked(ev);
      if (ev.type === 'exit') {
        drawExitPortal(ctx, sx, sy, S.tick);
        if (locked) drawSeal(ctx, sx, sy, S.tick);
      } else if (ev.type === 'barrier' && locked) {
        drawSeal(ctx, sx, sy, S.tick);
      } else if (ev.type === 'gate2' && locked) {
        if (ev.hidden) drawCrack(ctx, sx, sy, S.tick); else drawSeal(ctx, sx, sy, S.tick);
      }
    });
    // opened chests look
    (map.chests || []).forEach((c) => {
      const key = S.mapId + ':' + c.x + ',' + c.y;
      if (S.opened[key]) {
        const sx = c.x * TILE - camX, sy = c.y * TILE - camY;
        if (sx > -TILE && sy > -TILE && sx < VW && sy < VH) {
          ctx.save(); ctx.translate(-camX, -camY);
          GM.SPRITES.drawFloorTile(ctx, map.floorTile || 'stone', c.x, c.y, 7);
          GM.SPRITES.drawTile(ctx, 'chestopen', c.x, c.y, S.tick, 7);
          ctx.restore();
        }
      }
    });
    // ボス（フィールドに実体表示。旧: 不可視で「何も無い行き止まり」に見えていた）
    (map.events || []).forEach((ev) => {
      if (ev.type !== 'boss' || !GM.bossAlive(ev)) return;
      const sx = ev.x * TILE - camX, sy = ev.y * TILE - camY;
      if (sx > -40 && sy > -40 && sx < VW + 40 && sy < VH + 40) drawFieldBoss(ctx, ev, sx, sy, S.tick);
    });
    // npcs
    (map.npcs || []).forEach((npc) => {
      if (!npcVisible(npc)) return;
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
    // エリア名バナー / ミニマップ
    drawAreaBanner(ctx, VW);
    if (S.showMinimap) drawMinimap(ctx, map, VW, VH);
    // fade
    if (S.fade.a > 0) {
      ctx.fillStyle = `rgba(0,0,0,${S.fade.a})`;
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  GM.Field = { update: updateField, render: renderField };
  GM._SOLID = SOLID; // 内蔵テスト環境からの連結性検証用
})(window.GM);
