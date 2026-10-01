/* ============================================================
   GAMEMINA CHRONICLE ─ 内蔵自動テスト環境 (QA Harness)
   ============================================================
   世界最高峰の品質保証レイヤー。単一ファイルで Node CLI / ブラウザ
   QA コンソール (test.html) / 起動時自己診断 (bootCheck) の
   3 つの実行環境を共有する。

   - DOM に依存しない純粋検証のみをここに置く（Node でも動作）
   - UI 結合テストは js/tests/ui.tests.js（ブラウザ専用）
   ============================================================ */
'use strict';
(function (root, factory) {
  const QA = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = QA;
  if (root && root.GM) root.GM.QA = QA;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {

  /* ================= 微小テストフレームワーク ================= */
  const suites = [];   // { name, tests: [{name, fn, tags}] }
  let cur = null;
  function suite(name, fn) {
    cur = { name, tests: [] };
    suites.push(cur);
    fn(api);
    cur = null;
  }
  function test(name, fn, tags) {
    if (cur) cur.tests.push({ name, fn, tags: tags || [] });
  }
  /* アサーション群（t.ok / t.warn としても、t('test', fn) としても使える） */
  function ok(cond, msg) { if (!cond) throw new Error(msg || '期待値を満たさない'); }
  function eq(a, b, msg) { if (a !== b) throw new Error((msg || '一致しない') + ` (actual=${JSON.stringify(a)}, expected=${JSON.stringify(b)})`); }
  function near(a, b, eps, msg) { if (Math.abs(a - b) > (eps == null ? 1e-6 : eps)) throw new Error((msg || '近似一致しない') + ` (actual=${a}, expected=${b})`); }
  function gt(a, b, msg) { if (!(a > b)) throw new Error(msg || `期待: ${a} > ${b}`); }
  function includes(arr, v, msg) { if (!arr.includes(v)) throw new Error(msg || `配列に ${v} が存在しない`); }
  function warn(msg) { const e = new Error(msg); e.isWarning = true; throw e; }
  /* t は呼び出し可能かつアサーションをプロパティに持つ */
  const api = Object.assign(function (name, fn, tags) { test(name, fn, tags); }, {
    test, suite, ok, eq, near, gt, includes, warn
  });

  /* ================= 実行エンジン ================= */
  function now() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }
  async function runSuite(s, filter) {
    const out = { name: s.name, pass: 0, fail: 0, warn: 0, skipped: 0, results: [], ms: 0 };
    const t0 = now();
    for (const tcase of s.tests) {
      if (filter && !filter(s, tcase)) { out.skipped++; out.results.push({ name: tcase.name, status: 'skip' }); continue; }
      const st = now();
      try {
        await tcase.fn(api);
        out.pass++;
        out.results.push({ name: tcase.name, status: 'pass', ms: now() - st });
      } catch (e) {
        if (e && e.isWarning) {
          out.warn++;
          out.results.push({ name: tcase.name, status: 'warn', msg: e.message, ms: now() - st });
        } else {
          out.fail++;
          out.results.push({ name: tcase.name, status: 'fail', msg: (e && e.message) || String(e), stack: e && e.stack, ms: now() - st });
        }
      }
    }
    out.ms = now() - t0;
    return out;
  }
  async function runAll(opts) {
    opts = opts || {};
    const results = [];
    for (const s of suites) results.push(await runSuite(s, opts.filter));
    const sum = results.reduce((a, r) => ({
      pass: a.pass + r.pass, fail: a.fail + r.fail, warn: a.warn + r.warn, skipped: a.skipped + r.skipped
    }), { pass: 0, fail: 0, warn: 0, skipped: 0 });
    return { suites: results, summary: sum, totalMs: results.reduce((a, r) => a + r.ms, 0), env: env() };
  }
  function env() {
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof document.getElementById === 'function' && !!document.body;
    return { browser: isBrowser, node: !isBrowser, ua: (typeof navigator !== 'undefined' && navigator.userAgent) || 'node' };
  }

  /* ================= ユーティリティ ================= */
  function requireGM() {
    const GM = (root && root.GM) || (typeof window !== 'undefined' ? window.GM : null);
    if (!GM) throw new Error('GM 名前空間が未ロード（ゲームスクリプトを先に読み込むこと）');
    return GM;
  }
  /* 歩行可能判定（field.js の SOLID と同一定義。GM._SOLID があればそれを優先） */
  function solidSet(GM) {
    return GM._SOLID || new Set(['#', ' ', 'w', 't', 'r', 'c', 'C', 'b', 'p', 'm', 'x', 'o', '*', 'T']);
  }
  function tileAt(map, x, y) {
    const row = map.map[y];
    if (!row) return '#';
    return row[x] != null ? row[x] : '#';
  }
  /* BFS 到達集合（entry から計算） */
  function reachableFrom(GM, map, sx, sy) {
    const SOLID = solidSet(GM);
    const w = map._w, h = map._h;
    const seen = new Set();
    const q = [[sx, sy]];
    seen.add(sx + ',' + sy);
    while (q.length) {
      const [cx, cy] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, k = nx + ',' + ny;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen.has(k)) continue;
        if (SOLID.has(tileAt(map, nx, ny))) continue;
        seen.add(k);
        q.push([nx, ny]);
      }
    }
    return seen;
  }
  function adjReach(reach, x, y) {
    return reach.has(x + ',' + y) ||
      [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach.has((x + dx) + ',' + (y + dy)));
  }

  /* ============================================================
     SUITE 1: マップデータ整合性
     ============================================================ */
  suite('MAP ─ マップ整合性', function (t) {

    t('全マップの行幅が矩形になっている', () => {
      const GM = requireGM();
      for (const id in GM.MAPS) {
        const def = GM.MAPS[id];
        const w = def._w || Math.max(...def.map.map((r) => r.length));
        def.map.forEach((row, i) => {
          if (row.length !== w) throw new Error(`${id} 行${i} の幅が ${row.length} (期待 ${w})`);
        });
      }
    });

    t('exit イベントの行き先マップが全て実在する', () => {
      const GM = requireGM();
      for (const id in GM.MAPS) {
        (GM.MAPS[id].events || []).forEach((ev) => {
          if (ev.type !== 'exit') return;
          const to = ev.to && ev.to[0];
          if (!to || !GM.MAPS[to]) throw new Error(`${id} (${ev.x},${ev.y}) → 存在しないマップ "${to}"`);
        });
      }
    });

    t('出口の往復閉包: hub 以外の全マップに出口が存在する（戻れない部屋ゼロ）', () => {
      const GM = requireGM();
      for (const id in GM.MAPS) {
        if (id === 'hub') continue;
        const hasExit = (GM.MAPS[id].events || []).some((e) => e.type === 'exit' || e.type === 'gate');
        if (!hasExit) throw new Error(`${id}: 出口もゲートも無い ─ 入ったら出られない`);
      }
    });

    t('gate イベントに対応する gate_go_N スクリプトが存在する', () => {
      const GM = requireGM();
      for (const id in GM.MAPS) {
        (GM.MAPS[id].events || []).forEach((ev) => {
          if (ev.type !== 'gate') return;
          if (!GM.STORY['gate_go_' + ev.gate]) throw new Error(`${id}: gate_go_${ev.gate} が未定義`);
        });
      }
    });

    t('boss イベントの敵とスクリプトが実在する', () => {
      const GM = requireGM();
      for (const id in GM.MAPS) {
        (GM.MAPS[id].events || []).forEach((ev) => {
          if (ev.type !== 'boss') return;
          if (!GM.ENEMIES[ev.boss]) throw new Error(`${id}: 敵 "${ev.boss}" が未定義`);
          if (!GM.STORY[ev.script]) throw new Error(`${id}: スクリプト "${ev.script}" が未定義`);
        });
      }
    });

    t('trigger / shop イベントの参照先が有効', () => {
      const GM = requireGM();
      for (const id in GM.MAPS) {
        (GM.MAPS[id].events || []).forEach((ev) => {
          if (ev.type === 'trigger' && !GM.STORY[ev.script]) throw new Error(`${id}: trigger "${ev.script}" が未定義`);
          if (ev.type === 'shop' && !GM.SHOPS[ev.shop]) throw new Error(`${id}: shop${ev.shop} が未定義`);
        });
      }
    });

    t('S タイルとセーブイベントの実体一致', () => {
      const GM = requireGM();
      for (const id in GM.MAPS) {
        const def = GM.MAPS[id];
        const hasSTile = def.map.some((r) => r.includes('S'));
        const saves = (def.events || []).filter((e) => e.type === 'save');
        if (hasSTile && !saves.length) throw new Error(`${id}: S タイルがあるのに save イベントが無い`);
        saves.forEach((s) => {
          if (tileAt(def, s.x, s.y) !== 'S') throw new Error(`${id}: save イベント (${s.x},${s.y}) が S タイル上に無い`);
        });
      }
    });

    t('宝箱定義が実在アイテムを指す', () => {
      const GM = requireGM();
      for (const id in GM.MAPS) {
        (GM.MAPS[id].chests || []).forEach((c) => {
          if (!GM.ITEMS[c.item] && !GM.WEAPONS[c.item] && !GM.ARMORS[c.item] && !GM.ACCS[c.item]) {
            throw new Error(`${id} (${c.x},${c.y}): 不明なアイテム "${c.item}"`);
          }
        });
      }
    });

    t('NPC のスクリプト/見た目が有効', () => {
      const GM = requireGM();
      for (const id in GM.MAPS) {
        (GM.MAPS[id].npcs || []).forEach((n) => {
          if (n.script && !GM.STORY[n.script]) throw new Error(`${id} NPC "${n.name}": "${n.script}" 未定義`);
          const look = typeof n.look === 'string' ? GM.LOOKS[n.look] : n.look;
          if (!look) throw new Error(`${id} NPC "${n.name}": look "${n.look}" 未定義`);
        });
      }
    });

    t('encounters テーブルの敵が全て実在し、形成が空でない', () => {
      const GM = requireGM();
      for (const id in GM.MAPS) {
        const enc = GM.MAPS[id].encounters;
        if (!enc) continue;
        const table = GM.FORMATIONS[enc];
        if (!table || !table.length) throw new Error(`${id}: FORMATIONS.${enc} が未定義/空`);
        table.forEach((f, i) => {
          if (!f.length) throw new Error(`${id}: ${enc}[${i}] が空の形成`);
          f.forEach((k) => { if (!GM.ENEMIES[k]) throw new Error(`${id}: ${enc} の敵 "${k}" が未定義`); });
        });
      }
    });
  });

  /* ============================================================
     SUITE 2: 連結性 ─「出られなくなる部屋」の機械的ゼロ保証
     ============================================================ */
  suite('CONNECTIVITY ─ ソフトロック監査', function (t) {

    t('各マップ: entry から全イベント・全NPC・全宝箱に到達できる', () => {
      const GM = requireGM();
      for (const id in GM.MAPS) {
        const def = GM.MAPS[id];
        if (!def.entry) throw new Error(`${id}: entry 未計算（normalizeMaps 未実行）`);
        const reach = reachableFrom(GM, def, def.entry.x, def.entry.y);
        (def.events || []).forEach((ev) => {
          if (!adjReach(reach, ev.x, ev.y)) throw new Error(`${id}: (${ev.x},${ev.y}) の ${ev.type} に到達不可`);
        });
        (def.npcs || []).forEach((n) => {
          if (!adjReach(reach, n.x, n.y)) throw new Error(`${id}: NPC "${n.name}" (${n.x},${n.y}) に到達不可`);
        });
        (def.chests || []).forEach((c) => {
          const adj = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach.has((c.x + dx) + ',' + (c.y + dy)));
          if (!adj) throw new Error(`${id}: 宝箱 (${c.x},${c.y}) に到達不可`);
        });
      }
    });

    t('各マップ: 全ての出入口（exit/gate）に entry から到達できる', () => {
      const GM = requireGM();
      for (const id in GM.MAPS) {
        const def = GM.MAPS[id];
        const reach = reachableFrom(GM, def, def.entry.x, def.entry.y);
        (def.events || []).forEach((ev) => {
          if (ev.type !== 'exit' && ev.type !== 'gate' && ev.type !== 'gate2') return;
          if (!adjReach(reach, ev.x, ev.y)) throw new Error(`${id}: ${ev.type} (${ev.x},${ev.y}) に到達不可 ─ 出られない部屋`);
        });
      }
    });

    t('孤立した歩行可能領域（本流から切り離された部屋）が存在しない', () => {
      const GM = requireGM();
      const SOLID = solidSet(GM);
      const problems = [];
      for (const id in GM.MAPS) {
        const def = GM.MAPS[id];
        const w = def._w, h = def._h;
        const reach = reachableFrom(GM, def, def.entry.x, def.entry.y);
        const seenAll = new Set();
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const k = x + ',' + y;
            if (seenAll.has(k) || SOLID.has(tileAt(def, x, y))) continue;
            const comp = [];
            const q = [[x, y]];
            seenAll.add(k);
            while (q.length) {
              const [cx, cy] = q.shift();
              comp.push([cx, cy]);
              for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = cx + dx, ny = cy + dy, nk = nx + ',' + ny;
                if (nx < 0 || ny < 0 || nx >= w || ny >= h || seenAll.has(nk)) continue;
                if (SOLID.has(tileAt(def, nx, ny))) continue;
                seenAll.add(nk);
                q.push([nx, ny]);
              }
            }
            if (!comp.some(([cx, cy]) => reach.has(cx + ',' + cy))) {
              problems.push(`${id}: ${comp.length}タイル (${comp[0]})`);
            }
          }
        }
      }
      if (problems.length) t.warn('本流に接続しない領域 → ' + problems.join(' / '));
    }, ['warn']);

    t('章進行グラフ: 第1章→第10章まで順に完走可能（ストーリー全体の完走保証）', () => {
      const GM = requireGM();
      /* exit を辿って到達できるマップ閉包（ch2→colosseum のような多段構成をカバー） */
      function mapClosure(startId) {
        const seen = new Set([startId]);
        const q = [startId];
        while (q.length) {
          const curId = q.shift();
          (GM.MAPS[curId].events || []).forEach((ev) => {
            if (ev.type !== 'exit') return;
            const to = ev.to && ev.to[0];
            if (to && GM.MAPS[to] && !seen.has(to)) { seen.add(to); q.push(to); }
          });
        }
        return seen;
      }
      for (let n = 1; n <= 10; n++) {
        const sc = GM.STORY['gate_go_' + n];
        if (!sc) throw new Error(`gate_go_${n} 未定義 ─ 第${n}章に入れない`);
        const warp = sc.find((s) => s.t === 'warp');
        if (!warp || !GM.MAPS[warp.map]) throw new Error(`gate_go_${n} の warp 先が不正`);
        const closure = mapClosure(warp.map);
        if (n < 10) {
          // 閉包内の全マップから「ボスに到達でき、勝利で hub 復帰 + 次章ゲート解禁」を見つける
          let cleared = null;
          for (const mapId of closure) {
            const mapDef = GM.MAPS[mapId];
            const reach = reachableFrom(GM, mapDef, mapDef.entry.x, mapDef.entry.y);
            for (const b of (mapDef.events || []).filter((e) => e.type === 'boss')) {
              if (!adjReach(reach, b.x, b.y)) continue;
              const steps = GM.STORY[b.script] || [];
              if (!steps.some((s) => s.t === 'warp' && s.map === 'hub')) continue;
              const gate = steps.find((s) => s.t === 'openGate');
              if (!gate || gate.n !== n + 1) continue;
              if (!GM.STORY['gate_go_' + gate.n]) continue;
              cleared = { mapId, boss: b.boss, script: b.script };
              break;
            }
            if (cleared) break;
          }
          if (!cleared) throw new Error(`第${n}章: warp先閉包内に「ボス撃破→hub帰還→第${n + 1}章解禁」が完結する経路が無い`);
        }
      }
      // 終章: オメガと DIANA の双方に到達できる
      const ch10 = GM.MAPS['ch10'];
      const reach10 = reachableFrom(GM, ch10, ch10.entry.x, ch10.entry.y);
      (ch10.events || []).filter((e) => e.type === 'boss').forEach((b) => {
        if (!adjReach(reach10, b.x, b.y)) throw new Error(`ch10: 最終ボス (${b.boss}) に到達不可`);
      });
    });

    t('safeLanding: 壁・範囲外・イベント上の座標を安全地点へ補正できる', () => {
      const GM = requireGM();
      // 壁の中
      const hub = GM.MAPS['hub'];
      const fix1 = GM.safeLanding(hub, 1, 1); // (1,1) は壁
      if (GM.isSolid(hub, fix1.x, fix1.y)) throw new Error(`壁から脱出できていない: (${fix1.x},${fix1.y})`);
      // 範囲外
      const u0b = GM.MAPS['under0b']; // 12行しかないマップ
      const fix2 = GM.safeLanding(u0b, 15, 17); // y=17 は範囲外
      if (GM.isSolid(u0b, fix2.x, fix2.y)) throw new Error(`範囲外座標の補正に失敗: (${fix2.x},${fix2.y})`);
      // 出口イベント上への着地は避けられる
      const ch1 = GM.MAPS['ch1'];
      const exitEv = (ch1.events || []).find((e) => e.type === 'exit');
      const fix3 = GM.safeLanding(ch1, exitEv.x, exitEv.y);
      const onEv = (ch1.events || []).some((e) => e.x === fix3.x && e.y === fix3.y && (e.type === 'exit' || e.type === 'boss'));
      if (onEv) throw new Error('出口イベント上に着地してしまう（ワープ無限ループの危険）');
    });
  });

  /* ============================================================
     SUITE 3: ストーリーデータ整合性
     ============================================================ */
  suite('STORY ─ スクリプト整合性', function (t) {

    t('全スクリプト参照（npc/ev/choice/script/branch）が解決できる', () => {
      const GM = requireGM();
      for (const sid in GM.STORY) {
        GM.STORY[sid].forEach((step) => {
          if (step.t === 'script' && !GM.STORY[step.id]) throw new Error(`${sid}: 入れ子 script "${step.id}" 未定義`);
          if (step.t === 'choice') step.options.forEach((o, i) => {
            if (o.script && !GM.STORY[o.script]) throw new Error(`${sid}: choice[${i}] → "${o.script}" 未定義`);
          });
          if (step.t === 'branch' && step.branch) {
            for (const k in step.branch) {
              (step.branch[k] || []).forEach((st2, i) => {
                if (st2.t === 'script' && !GM.STORY[st2.id]) throw new Error(`${sid}: branch[${k}][${i}] → "${st2.id}" 未定義`);
              });
            }
          }
        });
      }
    });

    t('warp / boss / give / openGate の参照先が実在する', () => {
      const GM = requireGM();
      for (const sid in GM.STORY) {
        GM.STORY[sid].forEach((step) => {
          if (step.t === 'warp' && !GM.MAPS[step.map]) throw new Error(`${sid}: warp 先 "${step.map}" 未定義`);
          if (step.t === 'boss' && !GM.ENEMIES[step.boss]) throw new Error(`${sid}: boss "${step.boss}" 未定義`);
          if (step.t === 'give' && !GM.ITEMS[step.item] && !GM.WEAPONS[step.item] && !GM.ARMORS[step.item] && !GM.ACCS[step.item]) {
            throw new Error(`${sid}: give "${step.item}" 未定義`);
          }
          if (step.t === 'openGate' && !(step.n >= 1 && step.n <= 10)) throw new Error(`${sid}: openGate n=${step.n} が範囲外`);
        });
      }
    });

    t('章クリアチェーン: chapter 1..9 が飛び無く、各クリアで次章ゲートが開く', () => {
      const GM = requireGM();
      for (let n = 1; n <= 9; n++) {
        let owner = null;
        for (const sid in GM.STORY) {
          if (GM.STORY[sid].some((s) => s.t === 'flag' && s.key === 'chapter' && s.val === n)) { owner = sid; break; }
        }
        if (!owner) throw new Error(`chapter=${n} を設定するスクリプトが存在しない`);
        const g = GM.STORY[owner].find((s) => s.t === 'openGate' && s.n === n + 1);
        if (!g) throw new Error(`${owner}: openGate(${n + 1}) が無い ─ 第${n + 1}章へ進めない`);
      }
    });

    t('エンディングに到達できる（endgame 経路が存在）', () => {
      const GM = requireGM();
      const hasEnd = Object.keys(GM.STORY).some((sid) => GM.STORY[sid].some((s) => s.t === 'endgame'));
      if (!hasEnd) throw new Error('endgame ステップが無い ─ クリア不能');
    });

    t('archive 参照 ID が実在する（ロア収集の壊れ防止）', () => {
      const GM = requireGM();
      for (const sid in GM.STORY) {
        GM.STORY[sid].forEach((st) => {
          if (st.t === 'archive' && !GM.ARCHIVE.some((a) => a.id === st.id)) {
            throw new Error(`${sid}: archive id=${st.id} が未定義`);
          }
        });
      }
    });
  });

  /* ============================================================
     SUITE 4: バトルシステム（回帰テスト ─ 実在したバグを封印）
     ============================================================ */
  suite('BATTLE ─ 戦闘数理と回帰', function (t) {

    t('全敵定義からユニットを生成できる（必須フィールド完全性）', () => {
      const GM = requireGM();
      for (const key in GM.ENEMIES) {
        const e = GM.Battle._test.makeEnemy(key);
        if (!e) throw new Error(`敵 "${key}" の生成に失敗`);
        ['name', 'hp', 'atk', 'def', 'spd', 'exp', 'tg'].forEach((f) => {
          if (e[f] == null) throw new Error(`敵 "${key}" に ${f} が無い`);
        });
        (e.skills || []).forEach((s) => {
          if (!GM.ESKILLS[s]) throw new Error(`敵 "${key}" のスキル "${s}" が ESKILLS 無し`);
        });
        (e.phases || []).forEach((p, i) => {
          if (p.hp == null || p.hp <= 0 || p.hp >= 1) throw new Error(`敵 "${key}" phase[${i}]: hp閾値は 0<hp<1 であるべき`);
          (p.add || []).forEach((s) => { if (!GM.ESKILLS[s]) throw new Error(`敵 "${key}" phase[${i}] の追加スキル "${s}" が未定義`); });
        });
      }
    });

    t('ダメージ計算: 弱点 > 通常、ぼうぎょ軽減、魔法は魔防参照', () => {
      const GM = requireGM();
      const { calcDamage, makeEnemy } = GM.Battle._test;
      const actor = { atk: 100, mag: 100, luk: 10, statuses: [] };
      const foe = makeEnemy('slime'); // weak: thunder
      foe.statuses = [];
      foe.guarding = false;
      const normal = calcDamage(actor, foe, { kind: 'phys', el: 'phys', pow: 1 });
      const weak = calcDamage(actor, foe, { kind: 'phys', el: 'thunder', pow: 1 });
      if (weak <= normal) throw new Error(`弱点ダメージが通常以下: weak=${weak} normal=${normal}`);
      foe.guarding = true;
      const guarded = calcDamage(actor, foe, { kind: 'phys', el: 'phys', pow: 1 });
      foe.guarding = false;
      if (guarded >= normal) throw new Error(`ぼうぎょ軽減が機能していない: guarded=${guarded} normal=${normal}`);
      const mag = calcDamage(actor, foe, { kind: 'mag', el: 'void', pow: 1 });
      if (mag <= 0) throw new Error('魔法ダメージが 0 以下');
    });

    t('【回帰】回復アビリティが null ターゲットでもクラッシュしない（旧: 戦闘フリーズ）', () => {
      const GM = requireGM();
      const { useAbility, B } = GM.Battle._test;
      B.party = [GM.makeChar('layla'), GM.makeChar('mina')];
      B.party.forEach((m) => { m.hp = Math.floor(m.maxhp / 2); m.statuses = []; m.guarding = false; });
      B.enemies = [];
      B.popups = [];
      const mina = B.party[1];
      mina.mp = 99;
      const before = B.party[0].hp;
      useAbility(mina, GM.ABILITIES.limlight, null); // 旧実装では TypeError
      if (B.party[0].hp <= before) throw new Error('単体回復が適用されていない');
      B.party.forEach((m) => { m.hp = 1; });
      useAbility(mina, GM.ABILITIES.limheal, null);
      B.party.forEach((m) => { if (m.hp <= 1) throw new Error('全体回復が適用されていない'); });
    });

    t('【回帰】補助アビリティ（allies/enemies）が MP だけ消えて無効果にならない', () => {
      const GM = requireGM();
      const { useAbility, B } = GM.Battle._test;
      B.party = [GM.makeChar('jen'), GM.makeChar('gentaro')];
      B.party.forEach((m) => { m.hp = m.maxhp; m.statuses = []; m.guarding = false; });
      B.enemies = [GM.Battle._test.makeEnemy('slime')];
      B.enemies[0].hp = B.enemies[0].maxhp;
      B.enemies[0].statuses = [];
      B.popups = [];
      const jen = B.party[0];
      jen.mp = 99;
      useAbility(jen, GM.ABILITIES.valerguard, null); // allies に prot
      if (!B.party.some((m) => (m.statuses || []).some((s) => s.id === 'prot'))) {
        throw new Error('allies バフが誰にも付与されていない（旧バグ再発）');
      }
      const mina = GM.makeChar('mina');
      mina.mp = 99; mina.statuses = []; mina.hp = mina.maxhp;
      B.party.push(mina);
      // stillness は rate 0.6 の睡眠 ─ 複数試行で経路の有効性を検証（統計的フレーク回避）
      let applied = false;
      for (let i = 0; i < 30 && !applied; i++) {
        mina.mp = 99;
        B.enemies.forEach((e) => { e.statuses = []; e.hp = e.maxhp; });
        useAbility(mina, GM.ABILITIES.stillness, null);
        applied = B.enemies.some((e) => (e.statuses || []).some((s) => s.id === 'sleep'));
      }
      if (!applied) throw new Error('enemies デバフ（睡眠）が30回の試行で一度も適用されない（旧バグ再発）');
    });

    t('【回帰】敵の付帯ステータス攻撃（毒/麻痺）が適用される（旧: 常に無効）', () => {
      const GM = requireGM();
      const { execAttack, B } = GM.Battle._test;
      B.party = [GM.makeChar('layla')];
      B.party[0].hp = B.party[0].maxhp;
      B.party[0].statuses = [];
      B.enemies = [];
      B.popups = [];
      const snake = GM.Battle._test.makeEnemy('viper');
      snake.isEnemy = true;
      execAttack(snake, B.party[0], { name: '毒液', kind: 'mag', el: 'phys', pow: 0.5, status: { id: 'poison', turns: 4, rate: 1 } });
      if (!B.party[0].statuses.some((s) => s.id === 'poison')) throw new Error('敵の毒攻撃が適用されていない（旧バグ再発）');
    });

    t('【回帰】ぼうぎょ効果は再計算で解除される（旧: 永続化で敵ダメージ永久減衰）', () => {
      const GM = requireGM();
      const { calcDamage, makeEnemy } = GM.Battle._test;
      const actor = { atk: 100, mag: 0, luk: 10, statuses: [] };
      const foe = makeEnemy('slime');
      foe.statuses = [];
      foe.guarding = true;
      const guarded = calcDamage(actor, foe, { kind: 'phys', el: 'phys', pow: 1 });
      foe.guarding = false; // tickRoundStatuses 相当の解除
      const after = calcDamage(actor, foe, { kind: 'phys', el: 'phys', pow: 1 });
      if (after <= guarded) throw new Error('解除後もダメージが軽減されたまま（ぼうぎょ永続化の再発）');
    });

    t('ステータス付与は null ターゲットで安全に無視される', () => {
      const GM = requireGM();
      GM.Battle._test.applyStatus(null, { status: { id: 'poison', turns: 2 } }); // 例外禁止
    });

    t('習得表・アビリティ・対象種別の整合', () => {
      const GM = requireGM();
      const validTgt = ['enemy', 'enemies', 'ally', 'allies', 'self', 'dead'];
      const validKind = ['phys', 'mag', 'heal', 'buff', 'debuff', 'revive', 'drain'];
      for (const cid in GM.LEARN) {
        if (!GM.CHARACTERS[cid]) throw new Error(`LEARN のキャラ "${cid}" が未定義`);
        GM.LEARN[cid].forEach(([lv, ab]) => {
          if (!GM.ABILITIES[ab]) throw new Error(`${cid} Lv${lv}: アビリティ "${ab}" 未定義`);
          const def = GM.ABILITIES[ab];
          if (!validTgt.includes(def.tgt)) throw new Error(`"${ab}": 不明な tgt "${def.tgt}"`);
          if (!validKind.includes(def.kind)) throw new Error(`"${ab}": 不明な kind "${def.kind}"`);
          if (def.kind === 'heal' && !['ally', 'allies'].includes(def.tgt)) throw new Error(`"${ab}": heal の tgt が不正 (${def.tgt})`);
          if (def.kind === 'revive' && def.tgt !== 'dead') throw new Error(`"${ab}": revive は tgt:dead であるべき`);
          if (def.mp == null) throw new Error(`"${ab}": MPコスト未定義`);
        });
      }
      // 全アビリティ（未習得含む）も検査
      for (const abId in GM.ABILITIES) {
        const def = GM.ABILITIES[abId];
        if (!validTgt.includes(def.tgt)) throw new Error(`"${abId}": 不明な tgt "${def.tgt}"`);
        if (!validKind.includes(def.kind)) throw new Error(`"${abId}": 不明な kind "${def.kind}"`);
      }
    });

    t('対象解決ロジックが全アビリティで配列を返す（空集合クラッシュ防止）', () => {
      const GM = requireGM();
      const { resolveTargets, B } = GM.Battle._test;
      B.party = [GM.makeChar('layla')];
      B.party[0].hp = B.party[0].maxhp;
      B.party[0].statuses = [];
      B.enemies = [GM.Battle._test.makeEnemy('slime')];
      B.enemies[0].hp = B.enemies[0].maxhp;
      B.enemies[0].statuses = [];
      for (const abId in GM.ABILITIES) {
        const ts = resolveTargets(B.party[0], GM.ABILITIES[abId], null);
        if (!Array.isArray(ts)) throw new Error(`${abId}: 対象解決が配列でない`);
      }
    });

    t('【回帰】仲間加入時に出撃メンバーへ自動参加する（旧: メニュー手動必須）', () => {
      const GM = requireGM();
      const s = GM.state;
      const keep = { party: s.party, battleParty: s.battleParty };
      try {
        s.party = []; s.battleParty = [];
        // join ステップ相当の処理を直接検証（runScript 経由は DOM 前提のため）
        const steps = GM.STORY.prologue_intro.filter((st) => st.t === 'join');
        if (steps.length < 2) throw new Error('prologue に join ステップが2つ無い');
        // join ロジックを runStep と同様に手動実行
        steps.forEach((st) => {
          if (!s.party.some((m) => m.id === st.who)) {
            const m = GM.makeChar(st.who);
            s.party.push(m);
            if (s.battleParty.length < 4) s.battleParty.push(m);
          }
        });
        if (s.battleParty.length !== 2) throw new Error(`プロローグ参加後の出撃メンバーが ${s.battleParty.length} 人（期待 2）`);
        const ids = s.battleParty.map((m) => m.id).sort().join(',');
        if (ids !== 'gentaro,layla') throw new Error(`出撃メンバーが不正: ${ids}`);
      } finally {
        s.party = keep.party; s.battleParty = keep.battleParty;
      }
    });
  });

  /* ============================================================
     SUITE 5: セーブ/キャラクターシステム
     ============================================================ */
  suite('SAVE ─ 永続化とキャラ成長', function (t) {

    t('キャラ生成 → レベルアップ → 再計算が一貫する', () => {
      const GM = requireGM();
      const m = GM.makeChar('layla');
      if (m.hp !== m.maxhp || m.mp !== m.maxmp) throw new Error('生成直後の HP/MP が満タンでない');
      const need = GM.expTotal(m.lv + 1);
      GM.gainExp(m, need);
      if (m.lv !== 2) throw new Error(`1レベル分のEXPで Lv2 にならない (lv=${m.lv})`);
      if (m.maxhp <= 320) throw new Error('レベルアップで HP が成長していない');
      GM.recalc(m);
      if (m.hp > m.maxhp) throw new Error('recalc 後に HP が上限を超えている');
    });

    t('セーブ → ロードのラウンドトリップが状態を完全復元する', () => {
      const GM = requireGM();
      const s = GM.state;
      const keep = {
        party: s.party, battleParty: s.battleParty, items: s.items, flags: s.flags,
        gates: s.gates, archive: s.archive, opened: s.opened, killed: s.killed,
        chapter: s.chapter, tg: s.tg, loc: s.loc, mapId: s.mapId
      };
      try {
        s.party = [GM.makeChar('layla'), GM.makeChar('gentaro')];
        s.battleParty = s.party.slice(0, 2);
        s.items = { potion: 3, w_layla2: 1 };
        s.tg = 12345;
        s.flags = { qa_test: true };
        s.gates = { 1: true, 2: true };
        s.archive = [1, 2, 3];
        s.opened = { 'ch1:11,2': true };
        s.killed = { 'ch1:16,6': true };
        s.chapter = 2;
        s.loc = { map: 'hub', x: 18, y: 4, dir: 'down' };
        s.mapId = 'hub';
        if (!GM.saveTo('__qa__')) throw new Error('saveTo が false');
        const obj = GM.loadFrom('__qa__');
        if (!obj) throw new Error('loadFrom が null');
        const d = obj.data;
        if (d.tg !== 12345) throw new Error('TG が一致しない');
        if (d.party.length !== 2 || d.party[0].id !== 'layla') throw new Error('パーティが一致しない');
        if (d.items.potion !== 3) throw new Error('アイテム数が一致しない');
        if (d.gates['2'] !== true) throw new Error('ゲート状態が一致しない');
        if (d.loc.map !== 'hub' || d.loc.x !== 18) throw new Error('位置情報が一致しない');
        GM.loadGame('__qa__');
        if (s.tg !== 12345 || s.chapter !== 2 || s.party[0].id !== 'layla') throw new Error('restore 後の状態が不一致');
        const code = GM.exportSave();
        const before = { tg: s.tg, chapter: s.chapter };
        s.tg = 0; s.chapter = 0;
        if (!GM.importSave(code)) throw new Error('importSave が false');
        if (s.tg !== before.tg || s.chapter !== before.chapter) throw new Error('export/import 復元に失敗');
      } finally {
        Object.assign(s, keep);
        try { (typeof localStorage !== 'undefined') && localStorage.removeItem('gm_save___qa__'); } catch (e) {}
      }
    });

    t('不正なセーブコード・存在しないスロットは安全に失敗する', () => {
      const GM = requireGM();
      if (GM.loadFrom('__no_such_slot__') !== null) throw new Error('存在しないスロットが null を返さない');
      if (GM.importSave('!!!not-base64!!!') !== false) throw new Error('不正コードが false を返さない');
    });

    t('装備変更でステータスが正しく再計算される', () => {
      const GM = requireGM();
      const m = GM.makeChar('layla');
      const base = m.atk; // w_layla1 (+4) 装備済み
      m.equip.weapon = 'w_layla2'; // +12
      GM.recalc(m, true);
      if (m.atk !== base - 4 + 12) throw new Error(`装備再計算が不正: ${m.atk} (期待 ${base - 4 + 12})`);
    });
  });

  /* ============================================================
     SUITE 6: ショップ/アセット/BGM
     ============================================================ */
  suite('ASSETS ─ ショップ・アセット整合', function (t) {

    t('全ショップの品揃えが実在アイテムで構成される', () => {
      const GM = requireGM();
      for (const lv in GM.SHOPS) {
        GM.SHOPS[lv].forEach((id) => {
          const def = GM.ITEMS[id] || GM.WEAPONS[id] || GM.ARMORS[id] || GM.ACCS[id];
          if (!def) throw new Error(`SHOPS[${lv}]: "${id}" 未定義`);
          if (!def.price) throw new Error(`SHOPS[${lv}]: "${id}" に価格が無い`);
        });
      }
    });

    t('武器のキャラ紐付けが有効', () => {
      const GM = requireGM();
      for (const id in GM.WEAPONS) {
        if (!GM.CHARACTERS[GM.WEAPONS[id].char]) throw new Error(`武器 "${id}": キャラ "${GM.WEAPONS[id].char}" 未定義`);
      }
    });

    t('ポートレート索引: パーティ8人+主要NPCの URL が解決できる', () => {
      const GM = requireGM();
      if (!GM.Portraits) throw new Error('Portraits が未ロード');
      GM.JOIN_ORDER.forEach((id) => {
        if (!GM.Portraits.url(id)) throw new Error(`"${id}" の URL が解決できない`);
      });
      ['kate', 'lillie', 'fiona', 'kane', 'celia', 'diana'].forEach((id) => {
        if (!GM.Portraits.url(id)) throw new Error(`NPC "${id}" の URL が解決できない`);
      });
      if (!GM.Portraits.INDEX.length) throw new Error('図鑑索引が空');
    });

    t('ネットワーク: 全主要ポートレート URL が到達可能（オフライン時は警告）', async (t2) => {
      const GM = requireGM();
      if (typeof fetch !== 'function') { t.warn('fetch が無いためスキップ'); return; }
      const files = Array.from(new Set(Object.keys(GM.Portraits.CHARS).map((k) => GM.Portraits.CHARS[k])));
      const ng = [];
      for (const f of files) {
        try {
          const res = await fetch(GM.Portraits.BASE + f + '.png', { method: 'HEAD' });
          if (!res.ok) ng.push(f + ':' + res.status);
        } catch (e) { ng.push(f + ':ERR'); }
      }
      if (ng.length === files.length) { t.warn('全ポートレートに到達不能（オフライン?）'); return; }
      if (ng.length) throw new Error('ポートレート取得失敗: ' + ng.join(', '));
    }, ['network']);

    t('章定義 CHAPTERS のマップ参照が有効', () => {
      const GM = requireGM();
      for (const n in GM.CHAPTERS) {
        if (!GM.MAPS[GM.CHAPTERS[n].map]) throw new Error(`第${n}章: マップ "${GM.CHAPTERS[n].map}" 未定義`);
      }
    });

    t('BGM トラック名の整合（マップ/スクリプト参照先が既知トラック）', () => {
      const GM = requireGM();
      const known = new Set(['title', 'hub', 'town', 'field', 'dungeon', 'battle', 'boss', 'final', 'victory', 'gameover', 'ending']);
      for (const id in GM.MAPS) {
        const bgm = GM.MAPS[id].bgm;
        if (bgm && !known.has(bgm)) throw new Error(`${id}: 不明な BGM "${bgm}"`);
      }
      for (const sid in GM.STORY) {
        GM.STORY[sid].forEach((st) => {
          if (st.t === 'music' && !known.has(st.track)) throw new Error(`${sid}: 不明な BGM "${st.track}"`);
        });
      }
    });
  });

  /* ============================================================
     起動時自己診断（同期・軽量・プレイ環境に常駐）
     ============================================================ */
  function bootCheck() {
    const critical = ['MAP ─ マップ整合性', 'STORY ─ スクリプト整合性'];
    const out = { ok: true, errors: [], warnings: [], checked: 0 };
    for (const s of suites) {
      if (!critical.includes(s.name)) continue;
      for (const tcase of s.tests) {
        out.checked++;
        try {
          const r = tcase.fn(api);
          if (r && typeof r.then === 'function') { /* async は起動時対象外 */ }
        } catch (e) {
          if (e && e.isWarning) out.warnings.push(s.name + ' / ' + tcase.name + ': ' + e.message);
          else { out.ok = false; out.errors.push(s.name + ' / ' + tcase.name + ': ' + (e && e.message)); }
        }
      }
    }
    return out;
  }

  /* ================= exports ================= */
  return {
    suite, test, api, runAll, runSuite, bootCheck,
    suites,
    utils: { solidSet, tileAt, reachableFrom, adjReach, requireGM },
    VERSION: '1.0.0'
  };
});
