/* ============================================================
   GAMEMINA CHRONICLE ─ Map Normalizer
   手描きマップの座標ズレを自動修復:
   - 行幅を統一 / 主連結成分(歩行可能域)を検出
   - イベント・NPC・宝箱を到達可能な床へリロケート
   - '*'タイルと宝箱定義を対応付け / entry(出現点)を決定
   ============================================================ */
'use strict';
window.GM = window.GM || {};
(function (GM) {
  const SOLID = new Set(['#', ' ', 'w', 't', 'r', 'c', 'C', 'b', 'p', 'm', 'x', 'o', '*', 'T']);

  function normalizeMap(def) {
    const rows = def.map;
    const w = Math.max(...rows.map((r) => r.length));
    const h = rows.length;
    def.map = rows.map((r) => r.padEnd(w, '#'));
    def._w = w; def._h = h;

    const tile = (x, y) => (def.map[y] && def.map[y][x] != null) ? def.map[y][x] : '#';
    const solid = (x, y) => SOLID.has(tile(x, y));

    /* main walkable component (BFS from every floor, take largest) */
    const seen = new Set();
    let best = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (solid(x, y) || seen.has(x + ',' + y)) continue;
        const comp = [];
        const q = [[x, y]];
        seen.add(x + ',' + y);
        while (q.length) {
          const [cx, cy] = q.pop();
          comp.push([cx, cy]);
          [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
            const nx = cx + dx, ny = cy + dy, k = nx + ',' + ny;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
            if (seen.has(k) || solid(nx, ny)) return;
            seen.add(k);
            q.push([nx, ny]);
          });
        }
        if (comp.length > best.length) best = comp;
      }
    }
    const main = new Set(best.map(([x, y]) => x + ',' + y));

    /* occupied set (events + npcs) */
    const occupied = new Set();
    const relocate = (x, y, allowSolidAdj) => {
      if (main.has(x + ',' + y) && !occupied.has(x + ',' + y)) {
        occupied.add(x + ',' + y);
        return [x, y];
      }
      // nearest main tile
      let bestD = Infinity, bx = null, by = null;
      for (const key of main) {
        if (occupied.has(key)) continue;
        const [mx, my] = key.split(',').map(Number);
        const d = Math.abs(mx - x) + Math.abs(my - y);
        if (d < bestD) { bestD = d; bx = mx; by = my; }
      }
      if (bx != null) {
        occupied.add(bx + ',' + by);
        return [bx, by];
      }
      return [x, y];
    };

    /* events */
    def.events = (def.events || []).filter((e) => e.type !== 'chest'); // chest はタイル '*' + chests定義で処理

    /* saveイベントは 'S' タイルにスナップ（クリスタルと実体の不一致防止） */
    const sTiles = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (tile(x, y) === 'S') sTiles.push([x, y]);
    const snapOccupied = new Set();
    (def.events || []).forEach((e) => {
      if (e.type !== 'save' || !sTiles.length) return;
      let bd = Infinity, bs = null;
      sTiles.forEach(([sx, sy]) => {
        if (snapOccupied.has(sx + ',' + sy)) return;
        const d = Math.abs(sx - e.x) + Math.abs(sy - e.y);
        if (d < bd) { bd = d; bs = [sx, sy]; }
      });
      if (bs) { e.x = bs[0]; e.y = bs[1]; snapOccupied.add(bs[0] + ',' + bs[1]); }
    });

    (def.events || []).forEach((e) => {
      const walkable = ['boss', 'exit', 'gate', 'gate2', 'save', 'shop', 'trigger'];
      if (walkable.includes(e.type)) {
        if (solid(e.x, e.y) || !main.has(e.x + ',' + e.y)) {
          const [nx, ny] = relocate(e.x, e.y);
          e.x = nx; e.y = ny;
        } else occupied.add(e.x + ',' + e.y);
      } else {
        // sign / chest-type: adjacent interact, relocate if fully buried
        if (solid(e.x, e.y) || !main.has(e.x + ',' + e.y)) {
          const [nx, ny] = relocate(e.x, e.y);
          e.x = nx; e.y = ny;
        }
      }
    });

    /* ---- セーブ結晶とセーブイベントの視覚同期 ----
       イベントが主連結成分へリロケートされた場合、'S' タイル（結晶の見た目）も
       イベント位置へ移動させる。密室に取り残された結晶（見えない・届かない）を
       構造的に排除し、「結晶がある＝そこでセーブできる」を全マップで保証する。 */
    {
      const OVERWRITE_FLOOR = new Set(['.', 'g', 'f', 'd', 'n', 'i', 'k', 'W', 'M', 'B', 'v']);
      const saveEvts = (def.events || []).filter((e) => e.type === 'save');
      const used = new Set();
      saveEvts.forEach((e) => {
        const cur = tile(e.x, e.y);
        if (cur !== 'S') {
          if (OVERWRITE_FLOOR.has(cur)) {
            const row = def.map[e.y];
            def.map[e.y] = row.substring(0, e.x) + 'S' + row.substring(e.x + 1);
          } else {
            // 特殊タイル上なら隣の平床へ退避してから結晶を置く
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const nx = e.x + dx, ny = e.y + dy;
              if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
              if (OVERWRITE_FLOOR.has(tile(nx, ny)) && !used.has(nx + ',' + ny)) {
                e.x = nx; e.y = ny;
                const row = def.map[ny];
                def.map[ny] = row.substring(0, nx) + 'S' + row.substring(nx + 1);
                break;
              }
            }
          }
        }
        used.add(e.x + ',' + e.y);
        occupied.add(e.x + ',' + e.y); // 後続の宝箱リロケートが結晶位置を潰さないように
      });
      // 使われなくなった S タイル（密室の結晶など）を床に戻す
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (tile(x, y) === 'S' && !used.has(x + ',' + y)) {
            const row = def.map[y];
            def.map[y] = row.substring(0, x) + '.' + row.substring(x + 1);
          }
        }
      }
    }

    /* npcs */
    (def.npcs || []).forEach((n) => {
      if (solid(n.x, n.y) || !main.has(n.x + ',' + n.y) || occupied.has(n.x + ',' + n.y)) {
        const [nx, ny] = relocate(n.x, n.y);
        n.x = nx; n.y = ny;
      } else occupied.add(n.x + ',' + n.y);
    });

    /* chests <-> '*' tiles */
    const stars = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (tile(x, y) !== '*') continue;
        // 操作可能（隣が主領域）なら候補にする
        const touchable = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) =>
          main.has((x + dx) + ',' + (y + dy)));
        if (touchable) stars.push([x, y]);
      }
    }
    const chests = (def.chests || []).slice();
    // match by proximity
    const usedStars = new Set();
    chests.forEach((c) => {
      let bestD = Infinity, bs = null;
      stars.forEach(([sx, sy]) => {
        if (usedStars.has(sx + ',' + sy)) return;
        const d = Math.abs(sx - c.x) + Math.abs(sy - c.y);
        if (d < bestD) { bestD = d; bs = [sx, sy]; }
      });
      if (bs) {
        c.x = bs[0]; c.y = bs[1];
        usedStars.add(bs[0] + ',' + bs[1]);
      } else {
        // no star available: convert a floor tile in main area near target
        const [nx, ny] = relocate(c.x, c.y);
        const row = def.map[ny];
        def.map[ny] = row.substring(0, nx) + '*' + row.substring(nx + 1);
        c.x = nx; c.y = ny;
        occupied.add(nx + ',' + ny);
      }
      if (c.x >= w) c.x = w - 1;
    });
    // leftover stars without chest → add dummy
    stars.forEach(([sx, sy]) => {
      if (usedStars.has(sx + ',' + sy)) return;
      if (!chests.some((c) => c.x === sx && c.y === sy)) {
        chests.push({ x: sx, y: sy, item: 'potion', qty: 1 });
        usedStars.add(sx + ',' + sy);
      }
    });
    def.chests = chests;

    /* entry point: walkable tile in main component nearest to bottom-center */
    let entry = [1, 1];
    let bd = Infinity;
    for (const key of main) {
      const [mx, my] = key.split(',').map(Number);
      if (occupied.has(key)) continue;
      const d = Math.abs(mx - Math.floor(w / 2)) + Math.abs(my - (h - 3)) * 1.2;
      if (d < bd) { bd = d; entry = [mx, my]; }
    }
    def.entry = { x: entry[0], y: entry[1] };
    return def;
  }

  GM.normalizeMaps = function () {
    Object.values(GM.MAPS).forEach(normalizeMap);
  };
  GM._normalizeMap = normalizeMap;
})(window.GM);
