/* ============================================================
   GAMEMINA CHRONICLE ─ Variant Forge（派生種の生成）
   ------------------------------------------------------------
   少ない素材から多くの敵を作る仕組み。
   通常敵のドット絵（文字の行）とステータスを「元」にして、
   属性ごとの接辞（アフィックス）を掛け合わせ、起動時に派生種を
   決定論的に生成して GM.ENEMIES / GM.ENEMY_ART に登録する。

     通常敵 17 体 × 接辞 6 種 ＝ 派生 約100 体（新しい絵は 0 枚）

   - 絵: 元スプライトの有彩色を、明るさの順位を保ったまま接辞の
         3階調ランプへ写す（輪郭・白目などの無彩色はそのまま）。
         いちばん面積の小さい有彩色は「差し色」として残す。
   - 数値: 接辞の倍率を掛けて整数に丸める。経験値と報酬も連動。
   - 行動: 接辞の属性スキルを1つ足す。弱点は接辞の属性相性で上書き。
   - 出現: 通常エンカウントの各枠が一定確率で派生種に化ける。
           乱数は注入できる（テストで決定論的に検証するため）。

   生成物はすべて元データから導出されるので、元の敵を直せば
   派生種も自動で追従する。セーブデータには何も足さない
   （発見記録だけ別キーで localStorage に持つ）。
   ============================================================ */
'use strict';
window.GM = window.GM || {};
(function (GM) {

  const SEP = '+'; // 派生キー: 'slime+tide'

  /* ramp: 暗→明の3階調（sprites.js の PAL の文字） / accent: 差し色
     alt: 元の色が ramp とほぼ同じで見分けがつかないときに使う代わりの3階調 */
  const AFFIXES = {
    tide: {
      prefix: 'アクア', tag: '潮', el: 'water', weight: 22,
      ramp: ['b', 'B', 'C'], alt: ['b', 'T', 'W'], accent: 'W',
      mult: { hp: 1.2, atk: 1.05, def: 1.1, mag: 1.2, mdf: 1.2, spd: 1.0 }, reward: 1.5,
      skill: 'icebreath', weak: ['thunder'],
      lore: '歪みから漏れた海水を吸って変質した個体。動きは鈍らないが、電撃をよく通す。'
    },
    volt: {
      prefix: 'ボルト', tag: '雷', el: 'thunder', weight: 22,
      ramp: ['B', 'C', 'Y'], alt: ['A', 'O', 'Y'], accent: 'W',
      mult: { hp: 1.1, atk: 1.15, def: 1.0, mag: 1.25, mdf: 1.05, spd: 1.2 }, reward: 1.5,
      skill: 'plasmabolt', weak: ['void'],
      lore: 'ZAMLT の残留電荷を帯びた個体。素早く、先手で撃ってくる。'
    },
    relic: {
      prefix: 'セイクリッド', tag: '聖', el: 'holy', weight: 18,
      ramp: ['L', 'F', 'W'], alt: ['s', 'S', 'W'], accent: 'Y',
      mult: { hp: 1.25, atk: 1.0, def: 1.15, mag: 1.3, mdf: 1.3, spd: 0.95 }, reward: 1.7,
      skill: 'photonrain', weak: ['void'],
      lore: 'セリア黄金期の祭具に触れて白化した個体。全体攻撃の光を降らせる。'
    },
    hollow: {
      prefix: 'ホロウ', tag: '虚', el: 'void', weight: 18,
      ramp: ['p', 'P', 'M'], alt: ['p', 'm', 'F'], accent: 'E',
      mult: { hp: 1.15, atk: 1.2, def: 0.95, mag: 1.3, mdf: 1.1, spd: 1.1 }, reward: 1.7,
      skill: 'voidpalm', weak: ['holy'],
      lore: '歴史の継ぎ目に長く留まり、中身が抜け落ちた個体。聖属性で形を保てなくなる。'
    },
    elder: {
      prefix: 'エルダー', tag: '古', el: 'phys', weight: 15,
      ramp: ['n', 'r', 'R'], alt: ['n', 'N', 'O'], accent: 'Y',
      mult: { hp: 1.5, atk: 1.25, def: 1.25, mag: 1.15, mdf: 1.2, spd: 0.9 }, reward: 2.2,
      skill: 'madness', weak: null, // 元の弱点を引き継ぐ
      lore: '同じ時代を何度も生き延びた古い個体。硬く、重く、怒ると手がつけられない。'
    },
    gilded: {
      prefix: 'ゴールデン', tag: '金', el: 'phys', weight: 5,
      ramp: ['N', 'A', 'Y'], alt: ['A', 'Y', 'W'], accent: 'W',
      mult: { hp: 1.3, atk: 1.0, def: 1.3, mag: 1.0, mdf: 1.3, spd: 1.3 }, reward: 4.0,
      skill: 'guardcall', weak: null, rare: true,
      lore: 'トークンの鉱脈を食べて育った希少種。倒せれば報酬は桁違い。'
    }
  };

  const STATS = ['hp', 'atk', 'def', 'mag', 'mdf', 'spd'];

  function luminance(hex) {
    const n = parseInt(String(hex).slice(1), 16);
    return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  }

  /* 元スプライトの色 → 接辞ランプ への写像を作る（純関数）
     - ふつうは有彩色だけを写す（輪郭 K・白 W・灰色はそのまま）
     - 体のほとんどが灰色のスプライト（コウモリや機械）は、灰色を体の色として
       ランプへ写し、もともとの有彩色（目や発光部）を差し色にする */
  const GREYS = ['D', 'd', 'L'];
  function paletteMap(rows, affix, PAL) {
    const count = new Map();
    for (const row of rows) {
      for (const ch of row) {
        if (ch === '.' || ch === ' ' || ch === 'K' || ch === 'W' || !PAL[ch]) continue;
        count.set(ch, (count.get(ch) || 0) + 1);
      }
    }
    const byLum = (a, b) => luminance(PAL[a]) - luminance(PAL[b]) || a.localeCompare(b);
    const spread = (letters, map) => letters.sort(byLum).forEach((ch, i) => {
      const slot = letters.length === 1 ? 1 : Math.round((i / (letters.length - 1)) * (affix.ramp.length - 1));
      map[ch] = affix.ramp[slot];
    });
    const sum = (letters) => letters.reduce((n, ch) => n + count.get(ch), 0);
    const greys = [...count.keys()].filter((ch) => GREYS.includes(ch));
    const colors = [...count.keys()].filter((ch) => !GREYS.includes(ch));
    const map = {};

    if (greys.length && sum(colors) < sum(greys) * 0.67) {
      spread(greys, map);
      colors.forEach((ch) => { map[ch] = affix.accent; });
      return map;
    }
    if (!colors.length) return map;
    // 3色以上あるときだけ、いちばん面積の小さい色を差し色にする
    let accentFrom = null;
    if (colors.length >= 3) {
      accentFrom = colors.slice().sort((x, y) => count.get(x) - count.get(y) || x.localeCompare(y))[0];
      map[accentFrom] = affix.accent;
    }
    spread(colors.filter((ch) => ch !== accentFrom), map);
    return map;
  }

  function recolor(rows, map) {
    return rows.map((row) => {
      let out = '';
      for (const ch of row) out += map[ch] || ch;
      return out;
    });
  }

  /* 塗られているピクセルのうち、色が変わった割合 */
  function changedRatio(a, b) {
    let total = 0, diff = 0;
    for (let y = 0; y < a.length; y++) {
      for (let x = 0; x < a[y].length; x++) {
        const ch = a[y][x];
        if (ch === '.' || ch === ' ' || ch === 'K') continue;
        total++;
        if (ch !== b[y][x]) diff++;
      }
    }
    return total ? diff / total : 0;
  }

  function deriveStats(base, affix) {
    const out = {};
    for (const k of STATS) out[k] = Math.max(1, Math.round(base[k] * affix.mult[k]));
    out.exp = Math.round(base.exp * affix.reward);
    out.tg = Math.round(base.tg * affix.reward);
    out.lv = base.lv + (affix.reward >= 2 ? 2 : 1);
    return out;
  }

  /* 元の敵 + 接辞 → 派生種の定義（純関数。登録はしない） */
  function derive(baseKey, affixId, ENEMIES, ESKILLS) {
    const base = ENEMIES[baseKey];
    const affix = AFFIXES[affixId];
    if (!base || !affix || base.boss) return null;
    if (base.name.indexOf(affix.prefix) !== -1) return null; // 名前の重複を避ける
    const skills = base.skills.slice();
    if (ESKILLS[affix.skill] && !skills.includes(affix.skill)) skills.push(affix.skill);
    const key = baseKey + SEP + affixId;
    return Object.assign({}, base, deriveStats(base, affix), {
      name: affix.prefix + '・' + base.name,
      spr: key,
      skills,
      weak: affix.weak ? affix.weak.slice() : (base.weak || []).slice(),
      variant: { base: baseKey, affix: affixId, tag: affix.tag, el: affix.el, rare: !!affix.rare }
    });
  }

  /* 全派生種を生成して登録する。何度呼んでも結果は同じ（冪等） */
  function forge() {
    const ENEMIES = GM.ENEMIES, ART = GM.ENEMY_ART, ESKILLS = GM.ESKILLS;
    const PAL = (GM.SPRITES && GM.SPRITES.PAL) || {};
    const made = [];
    const bases = Object.keys(ENEMIES).filter((k) => !ENEMIES[k].boss && !ENEMIES[k].variant);
    for (const baseKey of bases) {
      const rows = ART[ENEMIES[baseKey].spr];
      if (!rows) continue;
      for (const affixId of Object.keys(AFFIXES)) {
        const def = derive(baseKey, affixId, ENEMIES, ESKILLS);
        if (!def) continue;
        ENEMIES[def.spr] = def;
        const affix = AFFIXES[affixId];
        let art = recolor(rows, paletteMap(rows, affix, PAL));
        // 元の配色が接辞の色とかぶっていて見分けがつかないときは、代わりのランプで塗り直す
        if (changedRatio(rows, art) < 0.25) {
          art = recolor(rows, paletteMap(rows, Object.assign({}, affix, { ramp: affix.alt }), PAL));
        }
        ART[def.spr] = art;
        made.push(def.spr);
      }
    }
    return { bases, keys: made };
  }

  /* ---------------- 出現 ---------------- */
  const RATE = 0.14;        // 1枠が派生種に化ける確率
  const MAX_PER_FIGHT = 2;  // 1戦闘あたりの派生種の上限

  function pickAffix(baseKey, rng) {
    const pool = Object.keys(AFFIXES).filter((id) => GM.ENEMIES[baseKey + SEP + id]);
    const total = pool.reduce((n, id) => n + AFFIXES[id].weight, 0);
    if (!total) return null;
    let r = rng() * total;
    for (const id of pool) {
      r -= AFFIXES[id].weight;
      if (r < 0) return id;
    }
    return pool[pool.length - 1];
  }

  /* 編成（敵キーの配列）を受け取り、一部を派生種に差し替えた新しい配列を返す */
  function roll(formation, rng, opts) {
    rng = rng || Math.random;
    const rate = (opts && opts.rate != null) ? opts.rate : RATE;
    let used = 0;
    return formation.map((key) => {
      const def = GM.ENEMIES[key];
      if (!def || def.boss || def.variant || used >= MAX_PER_FIGHT) return key;
      if (rng() >= rate) return key;
      const affixId = pickAffix(key, rng);
      if (!affixId) return key;
      used++;
      return key + SEP + affixId;
    });
  }

  /* ---------------- 発見記録（図鑑） ---------------- */
  const CODEX_KEY = 'gamemina_codex_v1';
  const Codex = {
    _cache: null,
    _load() {
      if (this._cache) return this._cache;
      let list = [];
      try { list = JSON.parse(localStorage.getItem(CODEX_KEY) || '[]'); } catch (e) { list = []; }
      this._cache = new Set(Array.isArray(list) ? list : []);
      return this._cache;
    },
    has(key) { return this._load().has(key); },
    count() { return this._load().size; },
    /* 初めて見た敵なら true を返す */
    mark(key) {
      const seen = this._load();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      try { localStorage.setItem(CODEX_KEY, JSON.stringify([...seen])); } catch (e) { /* 保存できなくても遊べる */ }
      return true;
    },
    reset() { this._cache = new Set(); try { localStorage.removeItem(CODEX_KEY); } catch (e) { /* noop */ } }
  };

  const result = forge();

  GM.VARIANTS = {
    SEP, AFFIXES, RATE, MAX_PER_FIGHT,
    bases: result.bases, keys: result.keys,
    paletteMap, recolor, derive, forge, roll, pickAffix
  };
  GM.Codex = Codex;
})(window.GM);
