/* ============================================================
   GAMEMINA CHRONICLE ─ Enemy Data
   AI: basic / caster / brute / boss
   boss は phases[] で HP閾値ごとに行動パターン変更
   weak: 弱点属性 / resist: 耐性
   ============================================================ */
'use strict';
window.GM = window.GM || {};

/* ---------------- 敵用スキル ---------------- */
GM.ESKILLS = {
  bite:        { name: 'かみつき', kind: 'phys', el: 'phys', pow: 1.15 },
  claw:        { name: 'ひっかき', kind: 'phys', el: 'phys', pow: 1.2 },
  doubleclaw:  { name: 'ダブルクロー', kind: 'phys', el: 'phys', pow: 0.85, hits: 2 },
  slam:        { name: 'のしかかり', kind: 'phys', el: 'phys', pow: 1.35 },
  crush:       { name: '粉砕', kind: 'phys', el: 'phys', pow: 1.7 },
  allslash:    { name: 'なぎ払い', kind: 'phys', el: 'phys', pow: 0.9, tgt: 'allies' },
  laser:       { name: '照準レーザー', kind: 'mag', el: 'thunder', pow: 1.35 },
  plasmabolt:  { name: 'プラズマボルト', kind: 'mag', el: 'thunder', pow: 1.55 },
  shockfield:  { name: 'ショックフィールド', kind: 'mag', el: 'thunder', pow: 1.05, tgt: 'allies' },
  icebreath:   { name: '冷気のブレス', kind: 'mag', el: 'water', pow: 1.2 },
  tempest:     { name: 'テンペスト', kind: 'mag', el: 'water', pow: 1.35, tgt: 'allies' },
  voidpalm:    { name: '虚無の掌', kind: 'mag', el: 'void', pow: 1.6 },
  meltdown:    { name: 'メルトダウン', kind: 'mag', el: 'void', pow: 1.6, tgt: 'allies' },
  judgement:   { name: 'ジャッジメント', kind: 'mag', el: 'holy', pow: 2.0 },
  venomspit:   { name: '毒液', kind: 'mag', el: 'phys', pow: 0.8, status: { id: 'poison', turns: 4, rate: 0.7 } },
  webshot:     { name: 'ワイヤ拘束', kind: 'phys', el: 'phys', pow: 0.6, status: { id: 'paralysis', turns: 2, rate: 0.6 } },
  lullaby:     { name: '子守唄', kind: 'debuff', status: { id: 'sleep', turns: 2, rate: 0.55 }, tgt: 'allies' },
  screech:     { name: '耳鳴り咆哮', kind: 'debuff', status: { id: 'atkdown', turns: 3, rate: 0.7 }, tgt: 'allies' },
  drain:       { name: 'エネルギー吸収', kind: 'drain', el: 'void', pow: 1.25 },
  repair:      { name: '自己修復', kind: 'heal', pow: 260 },
  guardcall:   { name: '防御態勢', kind: 'buff', status: { id: 'prot', turns: 3 }, tgt: 'self' },
  madness:     { name: '戦闘狂化', kind: 'buff', status: { id: 'atkup', turns: 4 }, tgt: 'self' },
  execution:   { name: '処刑プロトコル', kind: 'phys', el: 'phys', pow: 2.4 },
  grandfall:   { name: 'グランドフォール', kind: 'mag', el: 'thunder', pow: 1.8, tgt: 'allies' },
  photonrain:  { name: 'フォトン・レイン', kind: 'mag', el: 'holy', pow: 1.3, tgt: 'allies' },
  blackdice:   { name: 'ブラック・ダイス改', kind: 'mag', el: 'void', pow: 1.7, tgt: 'allies' },
  wireflurry:  { name: 'ワイヤ・フラリー', kind: 'phys', el: 'phys', pow: 0.9, hits: 3 },
  deepcrush:   { name: 'ディープ・クラッシャー', kind: 'phys', el: 'phys', pow: 2.7 },
  nightfall:   { name: 'ナイトフォール', kind: 'mag', el: 'void', pow: 1.9, tgt: 'allies' },
  omegabeam:   { name: 'オメガ・ビーム', kind: 'mag', el: 'void', pow: 2.6, tgt: 'allies' },
  genesis:     { name: '创世の波動', kind: 'mag', el: 'holy', pow: 2.2, tgt: 'allies' },
  regenall:    { name: '全景修復', kind: 'heal', pow: 900 },
  timeslip:    { name: 'タイムスリップ', kind: 'debuff', status: { id: 'paralysis', turns: 2, rate: 0.45 }, tgt: 'allies' }
};

/* ---------------- 通常敵 ---------------- */
GM.ENEMIES = {
  /* --- 序盤・下層系 --- */
  slime:      { name: 'スライム', spr: 'slime', lv: 2, hp: 70, atk: 11, def: 5, mag: 6, mdf: 6, spd: 8, exp: 9, tg: 12, weak: ['thunder'], ai: 'basic', skills: ['bite'], drop: 'potion' },
  slimequeen: { name: 'スライム・クイーン', spr: 'slimequeen', lv: 6, hp: 210, atk: 16, def: 9, mag: 12, mdf: 10, spd: 9, exp: 30, tg: 45, weak: ['thunder'], ai: 'basic', skills: ['bite', 'venomspit'], drop: 'antitox' },
  bat:        { name: 'クロウバット', spr: 'bat', lv: 3, hp: 55, atk: 12, def: 4, mag: 5, mdf: 6, spd: 16, exp: 11, tg: 14, weak: ['thunder'], ai: 'basic', skills: ['bite'], drop: 'potion' },
  cyberrat:   { name: 'サイバーラット', spr: 'cyberrat', lv: 4, hp: 80, atk: 14, def: 6, mag: 6, mdf: 8, spd: 15, exp: 14, tg: 18, ai: 'basic', skills: ['claw', 'doubleclaw'], drop: 'potion' },
  wraith:     { name: 'プラズマレイス', spr: 'wraith', lv: 8, hp: 160, atk: 15, def: 8, mag: 20, mdf: 14, spd: 13, exp: 34, tg: 40, weak: ['holy'], ai: 'caster', skills: ['plasmabolt', 'drain'], drop: 'ether' },
  /* --- ZAMLT/機械系 --- */
  drone:      { name: 'ロウアー・ドローン', spr: 'drone', lv: 5, hp: 110, atk: 15, def: 10, mag: 10, mdf: 10, spd: 12, exp: 20, tg: 24, weak: ['thunder'], ai: 'basic', skills: ['laser'], drop: 'potion' },
  hacker:     { name: 'サイバーファング', spr: 'hacker', lv: 9, hp: 150, atk: 19, def: 10, mag: 18, mdf: 12, spd: 14, exp: 38, tg: 46, ai: 'caster', skills: ['laser', 'screech'], drop: 'ether' },
  sentrybot:  { name: 'セントリー・ボット', spr: 'sentrybot', lv: 12, hp: 260, atk: 24, def: 18, mag: 14, mdf: 14, spd: 9, exp: 55, tg: 60, weak: ['thunder'], ai: 'basic', skills: ['plasmabolt', 'repair'], drop: 'hipotion' },
  phalanx:    { name: 'ファランクス重装兵', spr: 'phalanx', lv: 15, hp: 380, atk: 30, def: 26, mag: 10, mdf: 16, spd: 8, exp: 80, tg: 90, weak: ['void'], ai: 'basic', skills: ['slam', 'guardcall'], drop: 'hipotion' },
  guardsman:  { name: 'エヴァ・ガード', spr: 'guardsman', lv: 18, hp: 340, atk: 34, def: 20, mag: 12, mdf: 14, spd: 12, exp: 95, tg: 100, ai: 'basic', skills: ['claw', 'webshot'], drop: 'hipotion' },
  /* --- 自然/異形系 --- */
  viper:      { name: 'ネオンバイパー', spr: 'viper', lv: 10, hp: 170, atk: 21, def: 10, mag: 12, mdf: 10, spd: 15, exp: 40, tg: 42, weak: ['holy'], ai: 'basic', skills: ['venomspit', 'claw'], drop: 'antitox' },
  mirage:     { name: 'ミラージュ', spr: 'mirage', lv: 16, hp: 290, atk: 26, def: 14, mag: 24, mdf: 18, spd: 18, exp: 85, tg: 88, weak: ['holy'], ai: 'caster', skills: ['voidpalm', 'lullaby'], drop: 'clearnano' },
  siren:      { name: 'フラックス・サイレン', spr: 'siren', lv: 20, hp: 360, atk: 24, def: 16, mag: 30, mdf: 22, spd: 15, exp: 110, tg: 120, ai: 'caster', skills: ['tempest', 'lullaby'], drop: 'hiether' },
  stalker:    { name: 'ヴォイド・ストーカー', spr: 'stalker', lv: 24, hp: 460, atk: 38, def: 20, mag: 26, mdf: 20, spd: 19, exp: 150, tg: 150, weak: ['holy'], ai: 'basic', skills: ['voidpalm', 'doubleclaw'], drop: 'expotion' },
  crystalguard:{ name: 'クリスタル・ガード', spr: 'crystalguard', lv: 30, hp: 700, atk: 46, def: 30, mag: 28, mdf: 26, spd: 14, exp: 260, tg: 240, weak: ['void'], ai: 'basic', skills: ['slam', 'photonrain'], drop: 'expotion' },
  bug:        { name: 'バグ・フラグメント', spr: 'bug', lv: 3, hp: 90, atk: 13, def: 6, mag: 10, mdf: 8, spd: 11, exp: 15, tg: 20, weak: ['holy'], ai: 'basic', skills: ['claw'], drop: 'potion' },
  venom:      { name: 'アルファ・ヴェノム工作員', spr: 'venom', lv: 28, hp: 900, atk: 50, def: 26, mag: 30, mdf: 24, spd: 18, exp: 400, tg: 420, ai: 'basic', skills: ['crush', 'venomspit'], drop: 'expotion' },
  /* ---------------- BOSS ---------------- */
  bugboss: {
    name: '歪みの核〈バグ・クラスタ〉', spr: 'bug', lv: 4, hp: 380, atk: 15, def: 8, mag: 14, mdf: 10, spd: 10, exp: 60, tg: 120,
    weak: ['holy'], boss: true, ai: 'boss',
    skills: ['claw', 'shockfield'],
    phases: [{ hp: 0.45, add: ['meltdown'], msg: '歪みが膨れ上がり、次元の裂け目がうなる！' }]
  },
  executor: {
    name: 'ZAMLT執行機体〈エグゼキューター〉', spr: 'executor', lv: 7, hp: 980, atk: 22, def: 14, mag: 16, mdf: 12, spd: 11, exp: 180, tg: 300,
    weak: ['thunder'], boss: true, ai: 'boss',
    skills: ['slam', 'laser', 'guardcall'],
    phases: [{ hp: 0.5, add: ['execution', 'shockfield'], msg: 'エグゼキューターの眼が赤く発光──処刑プロトコル起動！' }]
  },
  titanrex: {
    name: 'コロシアム王者〈タイタン・レクス〉', spr: 'titanrex', lv: 11, hp: 1900, atk: 30, def: 20, mag: 12, mdf: 14, spd: 10, exp: 380, tg: 600,
    boss: true, ai: 'boss',
    skills: ['slam', 'crush', 'screech'],
    phases: [{ hp: 0.4, add: ['allslash'], status: { id: 'atkup' }, msg: 'タイタン・レクスが咆哮し、筋肉が膨れ上がる！' }]
  },
  celia: {
    name: '新次元皇帝〈セリア〉', spr: 'celia', lv: 13, hp: 2400, atk: 34, def: 24, mag: 30, mdf: 22, spd: 16, exp: 500, tg: 800,
    boss: true, ai: 'boss',
    skills: ['judgement', 'voidpalm', 'guardcall'],
    phases: [{ hp: 0.55, add: ['allslash', 'meltdown'], msg: 'セリアの次元剣が煌めき、空間が裂ける！' }]
  },
  ronan: {
    name: 'アポロン騎士団長〈ロナン・アーサ〉', spr: 'ronan', lv: 16, hp: 3100, atk: 40, def: 26, mag: 22, mdf: 22, spd: 14, exp: 700, tg: 1000,
    boss: true, ai: 'boss',
    skills: ['crush', 'judgement', 'guardcall'],
    phases: [{ hp: 0.5, add: ['allslash', 'photonrain'], msg: 'ロナン・アーサは騎士剣を高々と掲げた！' }]
  },
  slimecore: {
    name: '汚染核〈スライム・コア〉', spr: 'slimecore', lv: 19, hp: 4200, atk: 36, def: 22, mag: 30, mdf: 22, spd: 12, exp: 900, tg: 1300,
    weak: ['thunder'], boss: true, ai: 'boss',
    skills: ['venomspit', 'slam', 'tempest'],
    phases: [{ hp: 0.5, add: ['regenall'], msg: 'スライム・コアがうねり、損傷を自己修復していく！' }]
  },
  slimewoman: {
    name: '高次元射影体〈スライム・ウーマン〉', spr: 'slimewoman', lv: 21, hp: 5400, atk: 38, def: 24, mag: 38, mdf: 28, spd: 18, exp: 1200, tg: 1800,
    weak: ['thunder'], boss: true, ai: 'boss',
    skills: ['drain', 'tempest', 'lullaby'],
    phases: [
      { hp: 0.6, add: ['meltdown'], msg: 'スライム・ウーマンの輪郭が揺らぎ、次元の彼方と共鳴する！' },
      { hp: 0.25, add: ['nightfall'], msg: '射影体が不安定化──存在そのものが漏れ出してくる！' }
    ]
  },
  dalgos: {
    name: 'エヴァトロン重機〈グリム・ダルゴス〉', spr: 'dalgos', lv: 24, hp: 6200, atk: 46, def: 34, mag: 26, mdf: 24, spd: 10, exp: 1600, tg: 2200,
    weak: ['thunder'], boss: true, ai: 'boss',
    skills: ['crush', 'laser', 'guardcall'],
    phases: [{ hp: 0.5, add: ['shockfield', 'execution'], msg: 'グリム・ダルゴスの装甲が開放し、砲列が展開する！' }]
  },
  vaeron: {
    name: 'エヴァトロン統治者〈ヴァイロン・デアクス〉', spr: 'vaeron', lv: 26, hp: 7400, atk: 50, def: 32, mag: 40, mdf: 30, spd: 17, exp: 2200, tg: 3000,
    boss: true, ai: 'boss',
    skills: ['voidpalm', 'judgement', 'webshot'],
    phases: [
      { hp: 0.6, add: ['meltdown', 'allslash'], msg: 'ヴァイロン・デアクスは「Evapolis」の名のもと、虐げられし時代の怨嗟を纏う！' },
      { hp: 0.25, add: ['nightfall', 'execution'], msg: '統治者の仮面が剥がれ落ち、純粋な支配欲が剥き出しになる！' }
    ]
  },
  fiona: {
    name: 'ブルーローズV7〈フィオナ〉', spr: 'fiona', lv: 27, hp: 6800, atk: 52, def: 28, mag: 36, mdf: 28, spd: 22, exp: 2400, tg: 3200,
    boss: true, ai: 'boss',
    skills: ['wireflurry', 'webshot', 'icebreath'],
    phases: [{ hp: 0.5, add: ['blackdice', 'allslash'], msg: 'フィオナは赤い薔薇の跨り、戦場を舞う！' }]
  },
  goldenvenom: {
    name: '秘密警察〈ゴールデン・ヴェノム〉', spr: 'goldenvenom', lv: 30, hp: 9200, atk: 56, def: 32, mag: 40, mdf: 30, spd: 20, exp: 3200, tg: 4200,
    boss: true, ai: 'boss',
    skills: ['crush', 'venomspit', 'drain'],
    phases: [
      { hp: 0.6, add: ['nightfall', 'allslash'], msg: 'ゴールデン・ヴェノムの紋章が燃え上がる！' },
      { hp: 0.25, add: ['execution', 'meltdown'], msg: '「虐殺の記録は消えない」──組織の業が具現化する！' }
    ]
  },
  possessed: {
    name: '憑依者〈ポゼスド・ケン〉', spr: 'possessed', lv: 33, hp: 8600, atk: 60, def: 30, mag: 44, mdf: 32, spd: 21, exp: 3800, tg: 5000,
    weak: ['holy'], boss: true, ai: 'boss',
    skills: ['crush', 'voidpalm', 'madness'],
    phases: [
      { hp: 0.55, add: ['nightfall', 'lullaby'], msg: 'ケンの影が Dominions の残滓を呼び込む！' },
      { hp: 0.25, add: ['meltdown', 'execution'], msg: '憑依の深度が限界を超え、人格が溶け落ちていく！' }
    ]
  },
  minotaur: {
    name: '迷宮の主〈ミノタウロス Lv230〉', spr: 'minotaur', lv: 36, hp: 9800, atk: 68, def: 36, mag: 20, mdf: 28, spd: 15, exp: 4600, tg: 6000,
    boss: true, ai: 'boss',
    skills: ['crush', 'allslash', 'screech'],
    phases: [{ hp: 0.4, add: ['deepcrush'], status: { id: 'atkup' }, msg: 'ミノタウロスの斧が赤熱し、迷宮の空気が焦げる！' }]
  },
  abyssreais: {
    name: '奈落の司祭〈アビサルレイス〉', spr: 'abyssreais', lv: 39, hp: 11200, atk: 58, def: 34, mag: 62, mdf: 38, spd: 20, exp: 5600, tg: 7000,
    weak: ['holy'], boss: true, ai: 'boss',
    skills: ['voidpalm', 'nightfall', 'drain'],
    phases: [{ hp: 0.5, add: ['meltdown', 'lullaby'], msg: 'アビサルレイスが経典を燃やし、奈落の詠唱を始めた！' }]
  },
  succubus: {
    name: '深層の女王〈Lv1008 サキュバス〉', spr: 'succubus', lv: 48, hp: 16800, atk: 74, def: 40, mag: 74, mdf: 44, spd: 30, exp: 12000, tg: 15000,
    weak: ['holy'], boss: true, ai: 'boss', hidden: true,
    skills: ['drain', 'lullaby', 'blackdice'],
    phases: [
      { hp: 0.6, add: ['nightfall', 'timeslip'], msg: '女王は笑う。測定上限など、この深度では無意味だ。' },
      { hp: 0.3, add: ['meltdown', 'wireflurry'], msg: '鱗粉が生物発光し、空間ごと Lubricate され始める！' }
    ]
  },
  omega: {
    name: '虚無の統合体〈オメガ＝ユリシス〉', spr: 'omega', lv: 42, hp: 13400, atk: 70, def: 40, mag: 66, mdf: 40, spd: 24, exp: 8000, tg: 10000,
    boss: true, ai: 'boss',
    skills: ['omegabeam', 'meltdown', 'photonrain'],
    phases: [
      { hp: 0.6, add: ['nightfall', 'timeslip'], msg: 'オメガ＝ユリシスが「EVILS連合」の怨念を統合し始める！' },
      { hp: 0.3, add: ['omegabeam', 'genesis'], msg: '統合体の核が開き、高次元の光が直下世界を焼く！' }
    ]
  },
  diana: {
    name: '狂気の女神〈初代 DIANA〉', spr: 'diana', lv: 50, hp: 16800, atk: 78, def: 44, mag: 76, mdf: 44, spd: 28, exp: 0, tg: 0,
    weak: [], boss: true, final: true, ai: 'boss',
    skills: ['genesis', 'judgement', 'guardcall'],
    phases: [
      { hp: 0.66, add: ['meltdown', 'allslash'], msg: 'DIANA は微笑む。「14世紀ぶりの来訪者ね」' },
      { hp: 0.33, add: ['omegabeam', 'nightfall', 'genesis'], status: { id: 'atkup' }, msg: '女神の仮面が砕け、狂気が剥き出しになる──世界が軋む！' }
    ]
  },
  celiaext: {
    name: 'Dimension Selia 〈セリア・真〉', spr: 'celia', lv: 55, hp: 22000, atk: 84, def: 48, mag: 80, mdf: 48, spd: 32, exp: 0, tg: 0,
    boss: true, ai: 'boss', hidden: true,
    skills: ['judgement', 'allslash', 'guardcall'],
    phases: [
      { hp: 0.6, add: ['grandfall', 'meltdown'], msg: '次元剣〈Dimension Selia〉が振るわれ、座標そのものが切断される！' },
      { hp: 0.25, add: ['grandfall', 'genesis', 'execution'], msg: '皇帝は静かに笑う。「これが黄金期の力だ」' }
    ]
  }
};

/* 出現テーブル（maps.js から参照） */
GM.FORMATIONS = {
  under:   [['slime', 'slime'], ['slime', 'bat'], ['bat', 'bat', 'bat'], ['cyberrat', 'slime'], ['slimequeen', 'slime']],
  zamlt:   [['drone', 'drone'], ['drone', 'cyberrat'], ['hacker', 'drone'], ['sentrybot'], ['wraith', 'drone']],
  colosseum: [['guardsman', 'guardsman'], ['phalanx'], ['mirage', 'viper'], ['phalanx', 'guardsman', 'guardsman']],
  apollon: [['guardsman', 'guardsman', 'guardsman'], ['phalanx', 'phalanx'], ['sentrybot', 'guardsman'], ['mirage', 'mirage']],
  undercity: [['slimequeen', 'slimequeen'], ['viper', 'bat', 'bat'], ['slimequeen', 'viper'], ['wraith', 'slimequeen', 'slime']],
  evatron: [['sentrybot', 'sentrybot'], ['guardsman', 'sentrybot'], ['phalanx', 'guardsman'], ['stalker', 'sentrybot']],
  vermilion: [['mirage', 'viper'], ['siren'], ['stalker', 'mirage'], ['viper', 'viper', 'mirage']],
  nostalgia: [['wraith', 'wraith'], ['slimequeen', 'wraith'], ['venom', 'wraith'], ['venom', 'venom'], ['mirage', 'wraith', 'slime']],
  earth:   [['mirage', 'cyberrat'], ['hacker', 'hacker'], ['stalker'], ['mirage', 'mirage', 'hacker']],
  trapdungeon: [['stalker', 'stalker'], ['siren', 'mirage'], ['crystalguard'], ['stalker', 'siren', 'mirage']],
  omega:   [['crystalguard', 'crystalguard'], ['stalker', 'siren'], ['crystalguard', 'mirage', 'stalker'], ['siren', 'siren', 'stalker']]
};
