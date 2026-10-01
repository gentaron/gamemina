/* ============================================================
   data_enemies.js : 通常エネミー / ボス / エンカウンターテーブル
   ============================================================ */
'use strict';
window.GD = window.GD || {};

/* shape: drone/slime/hound/worm/wasp/golem/phantom/soldier/queen/sigma/titan/serpent
   draw は battle.js のプロシージャル描画で使用 */
GD.enemies = {
  /* --- 序盤（コロニー/ビブロ） --- */
  venom_drone:  {name:'ヴェノム・ドローン', shape:'drone',  hp:26,  mp:0,  atk:10, def:4,  mag:4,  res:4,  agi:8,  exp:20,   tok:12,  elem:{bolt:1.5}, drop:['potion'], color:'#7fae7f', desc:'アルファ・ヴェノムの偵察機'},
  venom_hound:  {name:'ヴェノム・ハウンド', shape:'hound',  hp:38,  mp:0,  atk:14, def:6,  mag:2,  res:3,  agi:12, exp:30,  tok:16,  drop:['antidote'], color:'#8fae6f', desc:'生体改造された猟犬'},
  cyber_rat:    {name:'サイバーラット',     shape:'hound',  hp:20,  mp:0,  atk:8,  def:3,  mag:2,  res:2,  agi:14, exp:15,   tok:8,   drop:['potion'], color:'#b0a090', desc:'都市に棲む機械化ネズミ'},
  slime_a:      {name:'ノスタルジア・スライム', shape:'slime', hp:30, mp:0, atk:9, def:5, mag:6, res:10, agi:5, exp:20, tok:10, elem:{fire:1.5, ice:0.5}, drop:['potion'], color:'#6fe0a8', desc:'スライム危機の末裔。分裂の予兆'},
  scrap_golem:  {name:'スクラップ・ゴーレム', shape:'golem', hp:70,  mp:0,  atk:17, def:12, mag:2,  res:4,  agi:4,  exp:55,  tok:30,  elem:{bolt:1.5}, drop:['bomb'], color:'#9a8f86', desc:'廃棄機材の集合体'},
  nova_bat:     {name:'ノヴァ・バット',     shape:'wasp',   hp:28,  mp:0,  atk:11, def:4,  mag:8,  res:6,  agi:16, exp:25,  tok:12,  drop:['icecrystal'], color:'#a9b8ff', desc:'夜間書庫を飛び交う'},
  /* --- ビブロ以降 --- */
  book_guard:   {name:'書庫ガードロボ',     shape:'soldier', hp:66, mp:0, atk:16, def:10, mag:6, res:8,  agi:8,  exp:55,  tok:26,  elem:{bolt:1.3}, drop:['potion','potion'], color:'#7f9fcf', desc:'大学警備のロボット'},
  archive_worm: {name:'アーカイブワーム',   shape:'worm',   hp:88,  mp:0,  atk:19, def:9,  mag:10, res:8,  agi:6,  exp:75,  tok:34,  drop:['hipotion'], color:'#c9a97f', desc:'データを食う電子虫'},
  /* --- ギガポリス/地下 --- */
  corp_guard:   {name:'コーポ・セキュリティ', shape:'soldier', hp:96, mp:0, atk:22, def:14, mag:6, res:10, agi:10, exp:95, tok:52, drop:['hipotion'], color:'#cfd8e8', desc:'企業連合の警備兵'},
  under_bug:    {name:'アンダーバグ',       shape:'worm',   hp:78,  mp:0,  atk:24, def:10, mag:4,  res:6,  agi:14, exp:90,  tok:44,  drop:['antidote'], color:'#8f7f9f', desc:'地下都市の大群蟲'},
  void_phantom: {name:'ヴォイド・ファントム', shape:'phantom', hp:84, mp:30, atk:18, def:8,  mag:20, res:14, agi:12, exp:115, tok:50, elem:{light:1.5, dark:0.5}, drop:['ether'], color:'#7f6f9f', acts:['darkbolt'], desc:'次元の裂け目から現れる'},
  tina_bot:     {name:'ゲゥの番兵機',       shape:'drone',  hp:110, mp:0,  atk:26, def:16, mag:8,  res:10, agi:9,  exp:130,  tok:64,  elem:{bolt:1.4}, drop:['boltcore'], color:'#9fcf9f', desc:'地下都市を守る自走砲'},
  /* --- クレセント地方 --- */
  crescent_bandit:{name:'クレセント・バンディット', shape:'soldier', hp:130, mp:0, atk:30, def:16, mag:8, res:10, agi:13, exp:170, tok:88, drop:['hipotion'], color:'#cf9f7f', desc:'荒野を荒らす無法者'},
  sand_worm:    {name:'サンドワーム',       shape:'worm',   hp:190, mp:0,  atk:36, def:18, mag:6,  res:8,  agi:7,  exp:240, tok:110, drop:['hipotion','phoenix'], color:'#d8b878', desc:'三日月砂漠の捕食者'},
  dust_hawk:    {name:'ダストホーク',       shape:'wasp',   hp:100, mp:0,  atk:32, def:12, mag:8,  res:8,  agi:20, exp:180,  tok:80,  drop:['boltcore'], color:'#cfa86f', desc:'砂塵を纏う猛禽'},
  techrosus_bot:{name:'テクロサス機兵',     shape:'soldier', hp:160, mp:0, atk:34, def:22, mag:12, res:14, agi:11, exp:265, tok:130, drop:['hipotion'], color:'#b8c4d8', acts:['missile'], desc:'テクロサス東支店の量産機兵'},
  /* --- エロス --- */
  eros_wasp:    {name:'ネオン・ワスプ',     shape:'wasp',   hp:150, mp:0,  atk:38, def:16, mag:16, res:14, agi:22, exp:310, tok:140, elem:{bolt:1.3}, drop:['turboether'], color:'#ff9fd8', desc:'クレーターの光虫'},
  bio_sentinel: {name:'バイオ・センチネル', shape:'golem',  hp:240, mp:0,  atk:42, def:26, mag:14, res:18, agi:8,  exp:395, tok:180, elem:{fire:1.4}, drop:['xpotions'], color:'#7fd8b8', acts:['regenwave'], desc:'生体防御ユニット'},
  golden_guard: {name:'ゴールデン・ガード', shape:'soldier', hp:220, mp:0, atk:44, def:24, mag:16, res:16, agi:15, exp:420, tok:200, drop:['lightorb'], color:'#ffd878', desc:'黄金毒の親衛隊'},
  /* --- タルタロス/終盤 --- */
  sigma_exp:    {name:'Σ実験体',           shape:'sigma',  hp:280, mp:40, atk:48, def:24, mag:26, res:20, agi:14, exp:505, tok:230, elem:{light:1.3}, drop:['elixir'], acts:['sigmabeam'], desc:'Σユニットの失敗作'},
  venom_knight: {name:'ヴェノム・ナイト',   shape:'sigma',  hp:320, mp:20, atk:54, def:28, mag:18, res:18, agi:16, exp:570, tok:260, drop:['xpotions'], color:'#6f9f6f', acts:['venomslash'], desc:'アルファ・ヴェノムの精鋭'},
  void_sigma:   {name:'ヴォイド・シグマ',   shape:'phantom', hp:300, mp:60, atk:46, def:22, mag:34, res:26, agi:18, exp:615, tok:280, elem:{light:1.6, dark:0.3}, drop:['turboether'], acts:['voidstorm'], desc:'虚無に侵された演算霊'},
  titan_node:   {name:'タイタン・ノード',   shape:'golem',  hp:420, mp:0,  atk:58, def:34, mag:20, res:20, agi:8,  exp:705, tok:320, elem:{bolt:1.5}, drop:['megapotion'], color:'#8f9fb8', desc:'小惑星帯の自律防衛機'},
  /* --- 裏ボス用召喚演出などでも使用 --- */
  echo_drone:   {name:'エコー（演習）',     shape:'drone',  hp:60,  mp:0,  atk:14, def:8,  mag:10, res:10, agi:12, exp:0,  tok:0,  color:'#8fd8ff', desc:'訓練用ドローン'}
};

/* ---------- ボス ---------- */
/* acts: 使用特技（battle.js BOSS_ACTS 参照）。phases: HP閾値で行動変化 */
GD.bosses = {
  b_drone: { name:'ヴェノム・スカウト', shape:'drone', hp:80,  mp:0,  atk:12, def:5,  mag:5,  res:5,  agi:8,  exp:90,  tok:60, color:'#7fae7f',
    acts:['venomshot'], drop:[], desc:'ノスタルジアを焼いた偵察機の先兵' },
  b_recruit: { name:'ヴェノム・リクルート', shape:'sigma', hp:200, mp:20, atk:10, def:8, mag:7, res:6,  agi:10, exp:395, tok:300, color:'#6f9f6f',
    acts:['venomslash','venomshot'], phases:[{hp:0.4, acts:['venomslash','venomshot','poisonburst']}], drop:['echo_chip'], desc:'母の記録端末を狙うヴェノム幹部候補' },
  b_underlord: { name:'地下都市の主 ゲゥ', shape:'worm', hp:900, mp:30, atk:30, def:16, mag:14, res:12, agi:9, exp:1145, tok:800, color:'#8f7f9f',
    acts:['earthquake','swallow'], phases:[{hp:0.35, acts:['earthquake','swallow','underburst']}], drop:[], desc:'E400以来、地下都市を支配する巨蟲' },
  b_bogdus: { name:'IV位 ボグダス・ジャヴリン', shape:'soldier', hp:1500, mp:60, atk:40, def:22, mag:20, res:16, agi:14, exp:2420, tok:1600, color:'#c88f6f',
    acts:['missile','commander_call','overrun'], phases:[{hp:0.5, acts:['missile','commander_call','overrun','grandmissile']}], drop:[], desc:'IRIS第4位。テクロサス東支店の常駐将校' },
  b_goldqueen: { name:'ゴールデン・ヴェノム・クイーン', shape:'queen', hp:2100, mp:90, atk:46, def:24, mag:34, res:24, agi:16, exp:4180, tok:2600, color:'#ffd878',
    acts:['goldenshot','honeyguard','venomstorm'], phases:[{hp:0.45, acts:['goldenshot','venomstorm','royal_pheromone']}], drop:[], desc:'黄金毒の女王。エロスを毒で靡かせる' },
  b_protsigma: { name:'Σ実験体・プロトシグマ', shape:'sigma', hp:2600, mp:120, atk:52, def:28, mag:40, res:26, agi:15, exp:5720, tok:3200, color:'#9fb8ff',
    acts:['sigmabeam','mindshock','phase_shift'], phases:[{hp:0.4, acts:['sigmabeam','mindshock','sigma_rage']}], drop:[], desc:'タルタロスに眠るΣユニットの原初形態' },
  b_sigmalord: { name:'アルファ・ヴェノム・シグマロード', shape:'sigma', hp:5200, mp:200, atk:62, def:34, mag:48, res:32, agi:18, exp:22000, tok:9999, color:'#7fbf7f',
    acts:['venomslash','sigmabeam','venomstorm','nostalgia'], phases:[
      {hp:0.66, acts:['venomslash','sigmabeam','venomstorm','nostalgia']},
      {hp:0.33, acts:['sigmabeam','venomstorm','nostalgia','apocalypse'], rage:true}
    ], drop:[], final:true, desc:'Σユニットの継承者にしてアルファ・ヴェノムの主' },
  b_jen: { name:'ジェン', shape:'queen', hp:20000, mp:999, atk:88, def:48, mag:66, res:44, agi:30, exp:0, tok:0, color:'#ff6f9f',
    acts:['jen_slash','valoria_grace','jen_wave','jen_judgement'], phases:[
      {hp:0.75, acts:['jen_slash','valoria_grace','jen_wave']},
      {hp:0.5,  acts:['jen_slash','jen_wave','jen_judgement']},
      {hp:0.25, acts:['jen_judgement','jen_wave','valoria_grace'], rage:true}
    ], drop:[], super:true, desc:'Lv938+ ヴァロリア連邦の覇者。裏ボス' }
};

/* ---------- エンカウンターテーブル ---------- */
GD.encounters = {
  colony:   [['venom_drone'], ['venom_drone','venom_drone'], ['venom_hound']],
  biblo:    [['cyber_rat','cyber_rat'], ['slime_a'], ['nova_bat','cyber_rat'], ['slime_a','cyber_rat'], ['venom_drone']],
  biblo_deep:[['book_guard'], ['archive_worm'], ['nova_bat','nova_bat'], ['book_guard','cyber_rat'], ['scrap_golem']],
  giga:     [['corp_guard'], ['under_bug','under_bug'], ['corp_guard','cyber_rat'], ['under_bug'], ['scrap_golem','corp_guard']],
  under:    [['under_bug','under_bug'], ['void_phantom'], ['tina_bot'], ['under_bug','void_phantom'], ['tina_bot','under_bug']],
  crescent: [['crescent_bandit'], ['sand_worm'], ['dust_hawk','dust_hawk'], ['crescent_bandit','dust_hawk'], ['sand_worm','dust_hawk']],
  tower:    [['techrosus_bot'], ['techrosus_bot','crescent_bandit'], ['sand_worm'], ['techrosus_bot','techrosus_bot'], ['void_phantom','techrosus_bot']],
  eros:     [['eros_wasp','eros_wasp'], ['bio_sentinel'], ['golden_guard'], ['eros_wasp'], ['golden_guard','eros_wasp']],
  tartarus: [['sigma_exp'], ['venom_knight'], ['void_sigma'], ['sigma_exp','venom_knight'], ['venom_knight','void_sigma']],
  final:    [['venom_knight','venom_knight'], ['titan_node'], ['void_sigma','venom_knight'], ['titan_node','sigma_exp'], ['venom_knight','void_sigma']]
};
