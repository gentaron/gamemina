/* ============================================================
   GAMEMINA CHRONICLE ─ Map Initializer (strict)
   v3: マップは「書いたまま」が正。座標の自動リロケートは廃止した。
   （旧版は手描きのズレを実行時に補正していたため、セーブ結晶やボスが
    意図しない場所へ移動し、道の途中が行き止まりに見える原因になっていた）

   ここで行うのは:
   - _w / _h の算出（行幅不一致は issues に記録。補正はしない）
   - entry（デバッグワープ/着地点の既定）の確定
   - 整合性の問題を def._issues に記録（QA ハーネスと起動時自己診断が検査）
   ============================================================ */
'use strict';
window.GM = window.GM || {};
(function (GM) {
  const SOLID = new Set(['#', ' ', 'w', 't', 'r', 'c', 'C', 'b', 'p', 'm', 'x', 'o', '*', 'T', 'v', 'P', 'F', 'L', 'u', 'K', 'S']);
  const WALK_EVENTS = ['boss', 'exit', 'gate', 'gate2', 'shop', 'trigger', 'barrier'];

  function normalizeMap(def) {
    if (def._ready) return def;
    const issues = [];
    const rows = def.map;
    const w = rows[0].length;
    const h = rows.length;
    rows.forEach((r, i) => { if (r.length !== w) issues.push(`行${i} の幅 ${r.length} ≠ ${w}`); });
    def._w = Math.max(...rows.map((r) => r.length));
    def._h = h;
    const tile = (x, y) => (rows[y] && rows[y][x] != null) ? rows[y][x] : '#';
    const solid = (x, y) => SOLID.has(tile(x, y));

    (def.events || []).forEach((e) => {
      if (WALK_EVENTS.includes(e.type) && solid(e.x, e.y)) issues.push(`${e.type} (${e.x},${e.y}) が通行不可タイル '${tile(e.x, e.y)}' 上`);
      if (e.type === 'save' && tile(e.x, e.y) !== 'S') issues.push(`save (${e.x},${e.y}) が S タイル上に無い`);
    });
    (def.npcs || []).forEach((n) => { if (solid(n.x, n.y)) issues.push(`NPC ${n.name} (${n.x},${n.y}) が通行不可タイル上`); });
    (def.chests || []).forEach((c) => { if (tile(c.x, c.y) !== '*') issues.push(`宝箱 (${c.x},${c.y}) が '*' タイル上に無い`); });
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (tile(x, y) === '*' && !(def.chests || []).some((c) => c.x === x && c.y === y)) issues.push(`'*' (${x},${y}) に宝箱定義が無い`);
    }

    if (!def.entry || solid(def.entry.x, def.entry.y)) {
      if (def.entry) issues.push(`entry (${def.entry.x},${def.entry.y}) が通行不可`);
      // フォールバック: 下中央に最も近い床
      let best = null, bd = Infinity;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (solid(x, y)) continue;
        const d = Math.abs(x - (w >> 1)) + Math.abs(y - (h - 3)) * 1.2;
        if (d < bd) { bd = d; best = { x, y }; }
      }
      def.entry = best || { x: 1, y: 1 };
    }
    def._issues = issues;
    def._ready = true;
    if (issues.length && typeof console !== 'undefined') console.warn(`[MAP] ${def.id}:`, issues);
    return def;
  }

  GM.normalizeMaps = function () {
    Object.values(GM.MAPS).forEach(normalizeMap);
  };
  GM._normalizeMap = normalizeMap;
  GM._MAP_SOLID = SOLID;
})(window.GM);
