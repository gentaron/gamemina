/* ============================================================
   GAMEMINA CHRONICLE ─ Debug Console (?debug=1)
   ============================================================
   開発・検証用オーバーレイ:
     - FPS / 座標 / 章ゲート / フラグ数 のライブ表示
     - 章へワープ / 全回復 / nTG 加算 の検証ショートカット
   有効化: URL に ?debug=1、または localStorage.setItem('gm_debug','1')
   ============================================================ */
'use strict';
(function (GM) {
  if (!GM) return;

  let enabled = false;
  let box = null;
  let fps = 0, frames = 0, fpsT = 0;

  function build() {
    if (box) return box;
    box = document.createElement('div');
    box.id = 'gm-debug';
    box.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:9000;font:9px/1.5 monospace;' +
      'color:#7ce38b;background:rgba(2,6,16,.82);border:1px solid rgba(124,227,139,.4);' +
      'border-radius:4px;padding:6px 9px;pointer-events:none;white-space:pre;max-width:60vw;';
    document.body.appendChild(box);
    // ショートカットパネル（タップ操作可能版）
    const panel = document.createElement('div');
    panel.style.cssText = 'position:fixed;right:6px;bottom:6px;z-index:9000;display:flex;flex-direction:column;gap:4px;';
    const mkBtn = (label, fn) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'font:9px monospace;color:#eaf1ff;background:rgba(20,30,66,.9);border:1px solid #4a5f9e;border-radius:3px;padding:4px 8px;cursor:pointer;';
      b.addEventListener('click', fn);
      panel.appendChild(b);
      return b;
    };
    const chapters = ['hub', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'trap1', 'trap3', 'ch10', 'under0', 'under0b', 'colosseum'];
    const sel = document.createElement('select');
    sel.style.cssText = 'font:9px monospace;background:rgba(20,30,66,.9);color:#eaf1ff;border:1px solid #4a5f9e;border-radius:3px;padding:3px;';
    chapters.forEach((id) => {
      const o = document.createElement('option');
      o.value = id; o.textContent = GM.MAPS[id] ? GM.MAPS[id].name : id;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => warpTo(sel.value));
    panel.appendChild(sel);
    mkBtn('全回復', () => {
      GM.state.party.forEach((m) => { m.hp = m.maxhp; m.mp = m.maxmp; });
      GM.toast('[DEBUG] パーティ全回復');
    });
    mkBtn('nTG+10000', () => { GM.addTG(10000); GM.updateHUD(); GM.toast('[DEBUG] nTG +10000'); });
    mkBtn('章ゲート全解禁', () => {
      for (let n = 1; n <= 10; n++) GM.state.gates[n] = true;
      GM.toast('[DEBUG] 全ゲート解禁');
    });
    mkBtn('エンカウンターOFF', () => {
      if (GM.state.map) { GM.state.map._encBack = GM.state.map.encounters; GM.state.map.encounters = null; GM.toast('[DEBUG] エンカウント停止'); }
    });
    document.body.appendChild(panel);
    box._panel = panel;
    return box;
  }

  function warpTo(mapId) {
    if (!GM.MAPS[mapId]) return;
    if (GM.state.scene !== 'field' && GM.state.scene !== 'title') return;
    if (GM.state.scene === 'title') {
      // タイトルからは最小限の状態で入場
      GM.state.scene = 'field';
      document.getElementById('title').classList.add('hidden');
    }
    GM.loadMap(mapId);
    const ent = GM.safeLanding(GM.MAPS[mapId], GM.MAPS[mapId].entry.x, GM.MAPS[mapId].entry.y);
    GM.state.player.x = ent.x; GM.state.player.y = ent.y;
    GM.state.player.px = ent.x * 16; GM.state.player.py = ent.y * 16;
    GM.state.loc = { map: mapId, x: ent.x, y: ent.y, dir: 'down' };
    GM.centerCam();
    GM.updateHUD();
    GM.toast('[DEBUG] ' + GM.MAPS[mapId].name + ' へワープ');
  }

  GM.onFrame(function (dt) {
    if (!enabled) return;
    frames++;
    fpsT += dt;
    if (fpsT >= 500) { fps = Math.round(frames * 1000 / fpsT); frames = 0; fpsT = 0; }
    const s = GM.state;
    const flags = Object.keys(s.flags || {}).length;
    const gatesOn = Object.keys(s.gates || {}).filter((k) => s.gates[k]).join(',') || '─';
    build().textContent =
      `FPS ${fps}\n` +
      `scene ${s.scene} / map ${s.mapId || '─'}\n` +
      `pos (${s.player.x},${s.player.y}) chapter ${s.chapter}\n` +
      `gates [${gatesOn}] flags ${flags}\n` +
      `party ${s.party.length} / items ${Object.keys(s.items || {}).length}`;
  });

  GM.Debug = {
    enable() {
      if (enabled) return;
      enabled = true;
      build();
      try { localStorage.setItem('gm_debug', '1'); } catch (e) {}
      console.log('[DEBUG] デバッグコンソール有効 ─ 章ワープ/全回復/ゲート解禁が利用可能');
    },
    disable() {
      enabled = false;
      if (box) { box.remove(); box._panel.remove(); box = null; }
      try { localStorage.removeItem('gm_debug'); } catch (e) {}
    },
    get enabled() { return enabled; },
    warpTo
  };
})(window.GM);
