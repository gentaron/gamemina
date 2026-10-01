/* ============================================================
   GAMEMINA CHRONICLE ─ Portrait URL Index
   キャライラストは gentaron/image リポジトリから URL 索引する。
   Single Source of Truth:
     https://raw.githubusercontent.com/gentaron/image/main/<Name>.png
   - CORS有効 (Access-Control-Allow-Origin: *)
   - Service Worker が runtime cache → 完全オフライン対応
   - 読み込み失敗時は手続き生成ポートレートへフォールバック
   ============================================================ */
'use strict';
window.GM = window.GM || {};
(function (GM) {

  const BASE = 'https://raw.githubusercontent.com/gentaron/image/main/';

  /* ---- パーティ / 主要NPC: charId → image file ---- */
  const CHARS = {
    layla:    'LaylaVirelNova',      // レイラ・ヴィレル・ノヴァ
    gentaro:  'Gentaro',            // 弦太郎
    mina:     'MinaEurekaErnst',    // ミナ・エウレカ・アーネスト
    jen:      'Jen',                // ジェン
    ayaka:    'AyakaRin',           // アヤカ・リン
    myu:      'Myu',                // ミュ
    iris:     'Iris',               // アイリス
    casteria: 'CasteriaGrenvelt',   // カステリア・グレンヴェルト
    kate:     'KatePatton',         // K・パットン
    lillie:   'LillieArdent',       // リリー・アーデント
    fiona:    'Fiona',              // ブルーローズのフィオナ
    kane:     'AlphaKane',          // アルファ・ケイン
    celia:    'CeliaDminix',        // セリア・ドミニクス
    slimewoman: 'SlimeWoman',       // スライム・ウーマン
    diana:    'Diana'               // 初代 DIANA
  };

  /* ---- 敵(ボス)キー → image file ---- */
  const ENEMIES = {
    slimewoman: 'SlimeWoman',
    fiona:      'Fiona',
    celia:      'CeliaDminix',
    diana:      'Diana',
    possessed:  'AlphaKane'         // 憑依者〈ポゼスド・ケン〉＝ケインの残留思念
  };

  /* ---- 話者名 → charId（部分一致) ---- */
  const SPEAKER_MAP = [
    ['レイラ', 'layla'], ['弦太郎', 'gentaro'], ['ミナ', 'mina'],
    ['ジェン', 'jen'], ['アヤカ', 'ayaka'], ['ミュ', 'myu'],
    ['アイリス', 'iris'], ['カステリア', 'casteria'],
    ['K・パットン', 'kate'], ['K・パトン', 'kate'], ['リリー', 'lillie'],
    ['フィオナ', 'fiona'], ['アルファ・ケイン', 'kane'],
    ['セリア', 'celia'], ['黄金の皇帝', 'celia'],
    ['スライム・ウーマン', 'slimewoman'], ['DIANA', 'diana'],
    ['ポゼスド・ケン', 'kane']
  ];

  /* ---- リポジトリ全索引 (キャラ図鑑ギャラリー用) ---- */
  const INDEX = [
    'AJ', 'AikeLopez', 'AinaVonRiesfeld', 'AlphaKane', 'AriaSol',
    'AyakaRin', 'AzazelHectopus', 'Bobristy', 'CasteriaGrenvelt',
    'CastinaTempest', 'CeliaDminix', 'Diana', 'ElForhaus', 'Elena',
    'EriosWald', 'Fariel', 'Fiona', 'FredericGabby', 'Gareth', 'Garo',
    'Gentaro', 'Gil', 'Goldilocks', 'Ilmise', 'Iris', 'Izumi', 'Jen',
    'Jun', 'KarlaVelm', 'Katarina', 'KateClaudia', 'KatePatton',
    'Lastman', 'LaylaVirelNova', 'Leon', 'LeviliaSerpentina',
    'LilithVane', 'LillieArdent', 'LillieSteiner', 'MarinaBobbin',
    'MasterVenom', 'MikaelGabrieli', 'MinaEurekaErnst', 'Miyushari',
    'Myu', 'NinigisKaras', 'NinnyOffenbach', 'Piatrino', 'ReidKakizaki',
    'SebastianValerius', 'SheronJeras', 'SitraCeles', 'SlimeWoman',
    'SylviaCrow', 'Temirtaron', 'TimurShah', 'TinaGue', 'Vivietta',
    'Wadrina', 'WhiteNoise', 'Willie', 'Yeshibato', 'Yonik', 'Zena'
  ];
  /* 図鑑の見出し（PascalCase → 表示名） */
  const LABELS = {
    layla: 'レイラ', gentaro: '弦太郎', mina: 'ミナ', jen: 'ジェン',
    ayaka: 'アヤカ', myu: 'ミュ', iris: 'アイリス', casteria: 'カステリア',
    kate: 'K・パットン', lillie: 'リリー', fiona: 'フィオナ',
    kane: 'アルファ・ケイン', celia: 'セリア', slimewoman: 'スライム・ウーマン',
    diana: 'DIANA'
  };
  function labelOf(file) {
    for (const k in CHARS) if (CHARS[k] === file) return LABELS[k] || file;
    return file.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  }

  /* ---------------- loader ----------------
     state: file → 'loading' | HTMLImageElement | null(失敗) */
  const state = new Map();
  const waiters = new Map();

  function flush(file, im) {
    (waiters.get(file) || []).forEach((cb) => { try { cb(im); } catch (e) {} });
    waiters.delete(file);
  }

  function load(file) {
    if (!state.has(file)) {
      state.set(file, 'loading');
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.decoding = 'async';
      im.onload = () => { state.set(file, im); flush(file, im); };
      im.onerror = () => { state.set(file, null); flush(file, null); };
      im.src = BASE + file + '.png';
    }
    return state.get(file);
  }

  const Portraits = {
    BASE, INDEX, CHARS, ENEMIES, LABELS, labelOf,
    url(key) { const f = CHARS[key] || ENEMIES[key]; return f ? BASE + f + '.png' : null; },
    /* 同期: 読込済みなら Image、読込中/失敗は null（<img src> には url() を使う） */
    get(key) {
      const f = CHARS[key] || ENEMIES[key];
      if (!f) return null;
      const st = load(f);
      return (st && st !== 'loading' && st.naturalWidth) ? st : null;
    },
    /* コールバック版: 成功→Image / 失敗→null */
    fetch(key, cb) {
      const f = CHARS[key] || ENEMIES[key];
      if (!f) { cb(null); return; }
      const st = load(f);
      if (st === 'loading') {
        if (!waiters.has(f)) waiters.set(f, []);
        waiters.get(f).push(cb);
      } else cb(st);
    },
    /* 話者名 → charId */
    speakerId(name) {
      if (!name) return null;
      for (const [frag, id] of SPEAKER_MAP) if (name.includes(frag)) return id;
      return null;
    },
    /* 事読込（タイトル裏で暖める） */
    warm(keys) {
      (keys || Object.keys(CHARS)).forEach((k) => { const f = CHARS[k]; if (f) load(f); });
    },
    /* 手続きポートレート（フォールバック): look から頭部を描いた dataURL */
    fallbackDataURL(look) {
      try {
        const cv = document.createElement('canvas');
        cv.width = 48; cv.height = 48;
        const c = cv.getContext('2d');
        c.imageSmoothingEnabled = false;
        const chibi = GM.SPRITES && GM.SPRITES._chibiCanvas ? GM.SPRITES._chibiCanvas(look, 'down', 0) : null;
        if (chibi) c.drawImage(chibi, 0, 0, 12, 8, 0, 4, 48, 32);
        return cv.toDataURL();
      } catch (e) { return null; }
    }
  };

  GM.Portraits = Portraits;
})(window.GM);
