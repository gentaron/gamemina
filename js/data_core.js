/* ============================================================
   MINA CHRONICLE 〜光と音を永遠に〜
   data_core.js : キャラクター / スキル / アイテム / 装備 / ショップ
   Based on EDU canon (worldedu / unified-history)
   ============================================================ */
'use strict';
window.GD = window.GD || {};

/* ---------- キャラクター ---------- */
GD.chars = {
  mina: {
    id:'mina', name:'ミナ', full:'ミナ・エウレカ・アーネスト', role:'プロデューサー',
    color:'#ff7fb2', hair:'#ffb0cd', outfit:'#6f86ff', skin:'#ffe0cc',
    desc:'AURALIS二代目・総プロデューサー。ノスタルジア・コロニー出身。次元エネルギーの調和を操る。',
    base:{hp:54, mp:16, atk:9, def:7, mag:13, res:10, agi:9, luck:11},
    grow:{hp:11, mp:3.4, atk:1.9, def:1.6, mag:2.5, res:2.0, agi:1.8, luck:1.7},
    learn:[{lv:1,id:'eureka'},{lv:2,id:'fire'},{lv:3,id:'cure'},{lv:5,id:'bolt'},
           {lv:7,id:'produce'},{lv:9,id:'cure2'},{lv:11,id:'fira'},{lv:13,id:'barrier'},
           {lv:16,id:'thundara'},{lv:19,id:'eureka2'},{lv:22,id:'curada'},{lv:26,id:'shell'},
           {lv:30,id:'firaga'},{lv:34,id:'liminal'},{lv:38,id:'shining'},{lv:45,id:'genesis'}],
    eq:{weapon:'w_producer', armor:'a_suit', acc:null}
  },
  leila: {
    id:'leila', name:'レイラ', full:'レイラ・ヴィラーズ・ノヴァ', role:'ピンク・ヴォルテージ',
    color:'#ff5f8f', hair:'#ff9fbe', outfit:'#ff4f7e', skin:'#ffdcc8',
    desc:'冷凍保存から蘇ったAURALISの伝説。雷霆を纏う最前線の戦士。',
    base:{hp:66, mp:12, atk:13, def:10, mag:10, res:8, agi:11, luck:9},
    grow:{hp:13, mp:2.4, atk:2.6, def:2.1, mag:2.0, res:1.7, agi:2.2, luck:1.5},
    learn:[{lv:1,id:'voltedge'},{lv:3,id:'bolt'},{lv:6,id:'rush'},{lv:9,id:'thundara'},
           {lv:12,id:'sparks'},{lv:15,id:'voltedge2'},{lv:19,id:'haste'},{lv:23,id:'thundaga'},
           {lv:27,id:'voltbreak'},{lv:32,id:'pinkvoltage'},{lv:38,id:'thundaja'},{lv:45,id:'novabolt'}],
    eq:{weapon:'w_blade', armor:'a_volt', acc:null}
  },
  kate: {
    id:'kate', name:'ケイト', full:'ケイト・パットン（新）', role:'ガンナー',
    color:'#ffd166', hair:'#ffe29a', outfit:'#c9a84c', skin:'#ffe4cc',
    desc:'名跡継承システムで受け継がれたAURALISの銃士。支援射撃の名手。',
    base:{hp:58, mp:13, atk:12, def:8, mag:9, res:9, agi:13, luck:10},
    grow:{hp:11.5, mp:2.6, atk:2.4, def:1.8, mag:1.7, res:1.8, agi:2.5, luck:1.8},
    learn:[{lv:1,id:'quickshot'},{lv:4,id:'analyze'},{lv:8,id:'piercing'},{lv:11,id:'overload'},
           {lv:14,id:'smokescreen'},{lv:18,id:'guarddown'},{lv:22,id:'rapidfire'},{lv:27,id:'photon_rain'},
           {lv:33,id:'snipe'},{lv:40,id:'aurora_volley'}],
    eq:{weapon:'w_gun', armor:'a_vest', acc:null}
  },
  lillie: {
    id:'lillie', name:'リリィ', full:'リリィ・アーデント（新）', role:'ホワイトメイジ',
    color:'#8fe3ff', hair:'#c8f4ff', outfit:'#7fd4f0', skin:'#ffe6d4',
    desc:'名跡継承システムで受け継がれたAURALISの癒し手。光の調律師。',
    base:{hp:50, mp:22, atk:7, def:7, mag:14, res:12, agi:8, luck:10},
    grow:{hp:10, mp:4.2, atk:1.5, def:1.5, mag:2.7, res:2.4, agi:1.6, luck:1.6},
    learn:[{lv:1,id:'cure'},{lv:3,id:'bubble'},{lv:5,id:'esuna'},{lv:8,id:'cure2'},
           {lv:11,id:'barrier'},{lv:14,id:'raise'},{lv:18,id:'shell'},{lv:21,id:'cure3'},
           {lv:25,id:'aria'},{lv:29,id:'araise'},{lv:34,id:'holy'},{lv:42,id:'eternalchoir'}],
    eq:{weapon:'w_rod', armor:'a_robe', acc:null}
  },
  ninny: {
    id:'ninny', name:'ニニー', full:'ニニー・オッフェンバック', role:'サモナー',
    color:'#c792ff', hair:'#e0c2ff', outfit:'#9d6fe0', skin:'#ffe2d2',
    desc:'クローン継承の末裔。ペルセフォネ圏の召喚術で次元の住人を呼ぶ。',
    base:{hp:52, mp:20, atk:8, def:8, mag:13, res:11, agi:9, luck:12},
    grow:{hp:10.5, mp:4.0, atk:1.7, def:1.6, mag:2.6, res:2.2, agi:1.7, luck:1.9},
    learn:[{lv:1,id:'pact'},{lv:4,id:'stone'},{lv:7,id:'summon_slime'},{lv:10,id:'aero'},
           {lv:13,id:'drain'},{lv:17,id:'summon_titan'},{lv:21,id:'aerora'},{lv:25,id:'summon_perse'},
           {lv:30,id:'quagmire'},{lv:36,id:'summon_sigma'},{lv:43,id:'offenbach'}],
    eq:{weapon:'w_staff', armor:'a_robe', acc:null}
  }
};

/* パーティ加入順 */
GD.joinOrder = ['mina','kate','lillie','leila','ninny'];

/* ---------- スキル ---------- */
/* kind: atk(物理) / mag(魔法) / heal / buff / debuff / drain / summon
   elem: fire ice bolt light dark none  */
GD.skills = {
  /* ミナ */
  eureka:   {name:'エウレカ', kind:'mag', elem:'light', mp:3,  pow:14, tgt:'one', desc:'閃きの光で1体を攻撃'},
  eureka2:  {name:'エウレカβ', kind:'mag', elem:'light', mp:9,  pow:30, tgt:'one', desc:'増幅した閃光で1体を攻撃'},
  produce:  {name:'プロデュース', kind:'buff', elem:'none', mp:8, pow:0, tgt:'all', buff:{atk:1.3,mag:1.3}, turns:4, desc:'全体の攻撃力を上げる'},
  barrier:  {name:'バリア', kind:'buff', elem:'none', mp:6, pow:0, tgt:'all', buff:{def:1.4,res:1.4}, turns:4, desc:'全体の防御力を上げる'},
  shell:    {name:'シェル', kind:'buff', elem:'none', mp:6, pow:0, tgt:'all', buff:{res:1.6}, turns:3, desc:'魔法耐性を大きく上げる'},
  liminal:  {name:'リミナルレイ', kind:'mag', elem:'light', mp:20, pow:46, tgt:'all', desc:'次元の光線が敵全体を貫く'},
  shining:  {name:'シャイニングエウレカ', kind:'mag', elem:'light', mp:26, pow:60, tgt:'one', desc:'渾身の閃光を1体に叩き込む'},
  genesis:  {name:'ジェネシスヴォルト', kind:'mag', elem:'light', mp:44, pow:80, tgt:'all', desc:'創世の大いなる光。敵全体を焼き払う'},
  /* 汎用魔法 */
  fire:     {name:'ファイア', kind:'mag', elem:'fire', mp:4,  pow:16, tgt:'one', desc:'炎で1体を攻撃'},
  fira:     {name:'ファイラ', kind:'mag', elem:'fire', mp:10, pow:34, tgt:'one', desc:'強炎で1体を攻撃'},
  firaga:   {name:'ファイガ', kind:'mag', elem:'fire', mp:22, pow:56, tgt:'all', desc:'業炎が敵全体を包む'},
  blizzard: {name:'ブリザド', kind:'mag', elem:'ice', mp:4,  pow:16, tgt:'one', desc:'氷で1体を攻撃'},
  blizzara: {name:'ブリザラ', kind:'mag', elem:'ice', mp:10, pow:34, tgt:'one', desc:'強氷で1体を攻撃'},
  blizzaga: {name:'ブリザガ', kind:'mag', elem:'ice', mp:22, pow:56, tgt:'all', desc:'極寒が敵全体を凍らす'},
  bolt:     {name:'サンダー', kind:'mag', elem:'bolt', mp:4,  pow:16, tgt:'one', desc:'雷で1体を攻撃'},
  thundara: {name:'サンダラ', kind:'mag', elem:'bolt', mp:10, pow:34, tgt:'one', desc:'強雷で1体を攻撃'},
  thundaga: {name:'サンダガ', kind:'mag', elem:'bolt', mp:22, pow:56, tgt:'all', desc:'雷撃が敵全体を走る'},
  thundaja: {name:'サンダジャ', kind:'mag', elem:'bolt', mp:30, pow:74, tgt:'all', desc:'天罰の雷が敵全体を砕く'},
  aero:     {name:'エアロ', kind:'mag', elem:'none', mp:5,  pow:18, tgt:'one', desc:'突風で1体を攻撃'},
  aerora:   {name:'エアロラ', kind:'mag', elem:'none', mp:12, pow:38, tgt:'all', desc:'嵐が敵全体を薙ぐ'},
  stone:    {name:'ストーン', kind:'mag', elem:'none', mp:5,  pow:18, tgt:'one', desc:'岩塊で1体を攻撃'},
  quagmire: {name:'クエイグマイヤ', kind:'mag', elem:'none', mp:18, pow:44, tgt:'all', desc:'次元の泥沼が敵全体を飲む'},
  cure:     {name:'ケアル', kind:'heal', elem:'none', mp:4,  pow:22, tgt:'one', desc:'1人のHPを回復'},
  cure2:    {name:'ケアルラ', kind:'heal', elem:'none', mp:9,  pow:52, tgt:'one', desc:'1人のHPを大きく回復'},
  cure3:    {name:'ケアルダ', kind:'heal', elem:'none', mp:18, pow:110, tgt:'one', desc:'1人のHPを大量回復'},
  curada:   {name:'ケアルガ', kind:'heal', elem:'none', mp:24, pow:80, tgt:'all', desc:'全体のHPを回復'},
  esuna:    {name:'エスナ', kind:'heal', elem:'none', mp:6,  pow:0, tgt:'one', cure:'all', desc:'1人の状態異常を治す'},
  raise:    {name:'レイズ', kind:'heal', elem:'none', mp:14, pow:40, tgt:'one', revive:true, desc:'戦闘不能の1人を蘇生'},
  araise:   {name:'アレイズ', kind:'heal', elem:'none', mp:26, pow:100, tgt:'one', revive:true, desc:'全回復で蘇生'},
  aria:     {name:'癒しのアリア', kind:'heal', elem:'none', mp:16, pow:46, tgt:'all', desc:'歌で全体のHPを回復'},
  holy:     {name:'ホーリー', kind:'mag', elem:'light', mp:24, pow:62, tgt:'one', desc:'聖なる光で1体を攻撃'},
  eternalchoir:{name:'エターナル聖歌隊', kind:'heal', elem:'none', mp:40, pow:150, tgt:'all', revive:true, desc:'光と音の力で全体を完全蘇生'},
  haste:    {name:'ヘイスト', kind:'buff', elem:'none', mp:8, pow:0, tgt:'one', buff:{agi:1.5}, turns:5, desc:'1人の素早さを上げる'},
  bubble:   {name:'バブル', kind:'buff', elem:'none', mp:5, pow:0, tgt:'one', buff:{def:1.5}, turns:4, desc:'1人の防御を上げる'},
  /* レイラ */
  voltedge: {name:'ヴォルトエッジ', kind:'atk', elem:'bolt', mp:3, pow:18, tgt:'one', desc:'帯電した刃で斬る'},
  voltedge2:{name:'ヴォルトエッジ改', kind:'atk', elem:'bolt', mp:8, pow:36, tgt:'one', desc:'高出力の雷刃で斬る'},
  rush:     {name:'ヴォルトラッシュ', kind:'atk', elem:'bolt', mp:6, pow:14, tgt:'rand3', desc:'雷速の連撃・ランダム3回'},
  sparks:   {name:'スパークフィールド', kind:'mag', elem:'bolt', mp:12, pow:30, tgt:'all', desc:'電磁フィールドで敵全体を走る'},
  voltbreake:{name:'ヴォルトブレイク', kind:'atk', elem:'bolt', mp:16, pow:52, tgt:'one', defcut:true, desc:'防御を無視した雷撃の一撃'},
  pinkvoltage:{name:'ピンク・ヴォルテージ', kind:'atk', elem:'bolt', mp:30, pow:26, tgt:'rand4', desc:'伝説の奥義・桃色電光の乱舞'},
  novabolt: {name:'ノヴァボルト', kind:'mag', elem:'bolt', mp:48, pow:95, tgt:'all', desc:'超新星の雷が敵全体を消し飛ばす'},
  /* ケイト */
  quickshot:{name:'クイックショット', kind:'atk', elem:'none', mp:2, pow:15, tgt:'one', desc:'素早い牽制射撃'},
  piercing: {name:'ピアッシング', kind:'atk', elem:'none', mp:7, pow:34, tgt:'one', defcut:true, desc:'装甲を貫く徹甲弾'},
  analyze:  {name:'アナライズ', kind:'debuff', elem:'none', mp:4, pow:0, tgt:'one', debuff:{def:0.7,res:0.7}, turns:4, desc:'敵の防御を下げて弱点を暴く'},
  overload: {name:'オーバーロード弾', kind:'atk', elem:'fire', mp:9, pow:40, tgt:'one', desc:'過荷弾が爆発する'},
  smokescreen:{name:'スモークスクリーン', kind:'debuff', elem:'none', mp:6, pow:0, tgt:'all', debuff:{agi:0.6}, turns:3, desc:'煙幕で敵全体の素早さを下げる'},
  guarddown:{name:'アーマーブレイク', kind:'debuff', elem:'none', mp:5, pow:0, tgt:'one', debuff:{def:0.55}, turns:4, desc:'敵の装甲を破壊する'},
  rapidfire:{name:'ラピッドファイア', kind:'atk', elem:'none', mp:14, pow:20, tgt:'rand4', desc:'乱れ撃ち・ランダム4回'},
  photon_rain:{name:'フォトンレイン', kind:'atk', elem:'light', mp:24, pow:34, tgt:'rand5', desc:'光子の弾雨が降り注ぐ'},
  snipe:    {name:'狙撃・フェイルノート', kind:'atk', elem:'none', mp:20, pow:85, tgt:'one', crit:true, desc:'急所を必ず撃ち抜く'},
  aurora_volley:{name:'オーロラボレー', kind:'atk', elem:'light', mp:42, pow:60, tgt:'all', desc:'極光の一斉射撃'},
  /* ニニー */
  pact:     {name:'パクトボルト', kind:'mag', elem:'dark', mp:4, pow:17, tgt:'one', desc:'契約の黒雷で1体を攻撃'},
  drain:    {name:'ドレインタップ', kind:'drain', elem:'dark', mp:8, pow:24, tgt:'one', desc:'敵のHPを吸収する'},
  summon_slime:{name:'召喚・スライム領主', kind:'summon', elem:'none', mp:16, pow:40, tgt:'all', desc:'スライム危機の主を召喚'},
  summon_titan:{name:'召喚・タイタン', kind:'summon', elem:'none', mp:24, pow:52, tgt:'all', desc:'小惑星帯の巨人を召喚'},
  summon_perse:{name:'召喚・ペルセフォネ', kind:'summon', elem:'dark', mp:34, pow:68, tgt:'all', desc:'仮想宇宙の女王を召喚'},
  summon_sigma:{name:'召喚・シグマコア', kind:'summon', elem:'light', mp:44, pow:84, tgt:'all', desc:'Σユニットの核を召喚し敵全体を滅す'},
  offenbach:{name:'オッフェンバック変奏曲', kind:'summon', elem:'dark', mp:52, pow:100, tgt:'all', desc:'完奏すれば戦場を覆う終焉の変奏曲'}
};

/* ---------- アイテム ---------- */
GD.items = {
  potion:    {name:'ポーション', kind:'use', heal:60,  price:60,  desc:'HP60回復'},
  hipotion:  {name:'ハイポーション', kind:'use', heal:260, price:260, desc:'HP260回復'},
  xpotions:  {name:'エクスポーション', kind:'use', heal:900, price:900, desc:'HP900回復'},
  megapotion:{name:'メガポーション', kind:'use', heal:300, tgtAll:true, price:1200, desc:'全体のHP300回復'},
  ether:     {name:'エーテル', kind:'use', mp:40, price:300, desc:'MP40回復'},
  turboether:{name:'ターボエーテル', kind:'use', mp:60, tgtAll:true, price:1100, desc:'全体のMP60回復'},
  elixir:    {name:'エリクサー', kind:'use', heal:9999, mp:999, price:5000, desc:'HP/MP全回復'},
  phoenix:   {name:'フェニックスの尾', kind:'use', revive:true, heal:50, price:200, desc:'戦闘不能をHP50で蘇生'},
  antidote:  {name:'きんのくすり', kind:'use', cure:'all', price:60, desc:'状態異常を治す'},
  bomb:      {name:'ボムのかけら', kind:'use', dmg:120, elem:'fire', price:160, desc:'敵1体に炎120'},
  icecrystal:{name:'アイスクリスタル', kind:'use', dmg:120, elem:'ice', price:160, desc:'敵1体に氷120'},
  boltcore:  {name:'サンダーコア', kind:'use', dmg:120, elem:'bolt', price:160, desc:'敵1体に雷120'},
  lightorb:  {name:'ひかりのたま', kind:'use', dmg:200, elem:'light', price:500, desc:'敵1体に光200'},
  /* 重要アイテム */
  recorder:  {name:'母の記録端末', kind:'key', desc:'母が遺した歴史記録端末。Σユニットの原初データを含む'},
  summit_pass:{name:'サミット招待状', kind:'key', desc:'世界連邦サミットの招待状'},
  forge_key: {name:'フォージ・コアキー', kind:'key', desc:'リミナル・フォージ起動鍵'},
  echo_chip: {name:'エコー・チップ', kind:'key', desc:'AIドローン「エコー」のコア。ミナの相棒'}
};

/* ---------- 装備 ---------- */
GD.equips = {
  /* 武器 */
  w_producer:{name:'プロデューサーロッド', slot:'weapon', atk:4, mag:5, price:120, for_:['mina'], desc:'ミナの初期武器'},
  w_biblio:  {name:'ビブロ書杖', slot:'weapon', atk:8, mag:11, price:520, for_:['mina'], desc:'書庫都市の技術が詰まった杖'},
  w_aud:     {name:'オーディエンスロッド', slot:'weapon', atk:13, mag:19, price:1800, for_:['mina'], desc:'観客の声が力になる杖'},
  w_forge:   {name:'リミナルロッド', slot:'weapon', atk:20, mag:30, price:6000, for_:['mina'], desc:'光と音を増幅する最終装備'},
  w_blade:   {name:'ヴォルトブレード', slot:'weapon', atk:9, mag:2, price:200, for_:['leila'], desc:'帯電するレイラの長剣'},
  w_thunder: {name:'サンダーブレード', slot:'weapon', atk:17, mag:5, price:1500, for_:['leila'], desc:'雷を纏う銘刀'},
  w_pink:    {name:'ピンククライン', slot:'weapon', atk:27, mag:9, price:6200, for_:['leila'], desc:'伝説の電光刀'},
  w_gun:     {name:'オートピストル', slot:'weapon', atk:8, mag:2, price:180, for_:['kate'], desc:'ケイトの初期銃'},
  w_rifle:   {name:'スマートライフル', slot:'weapon', atk:15, mag:4, price:1400, for_:['kate'], desc:'照準補正付きライフル'},
  w_rail:    {name:'レールキャノン', slot:'weapon', atk:25, mag:7, price:5800, for_:['kate'], desc:'電磁加速の重砲'},
  w_rod:     {name:'ホワイトロッド', slot:'weapon', atk:3, mag:7, price:130, for_:['lillie'], desc:'癒し手の細杖'},
  w_cure:    {name:'ケアルロッド', slot:'weapon', atk:6, mag:14, price:560, for_:['lillie'], desc:'回復力を高める杖'},
  w_choir:   {name:'聖歌隊の指揮杖', slot:'weapon', atk:11, mag:22, price:1900, for_:['lillie'], desc:'歌声を光に変える杖'},
  w_eternal: {name:'エターナルロッド', slot:'weapon', atk:16, mag:33, price:6400, for_:['lillie'], desc:'永遠の調べを奏でる杖'},
  w_staff:   {name:'サモナースタッフ', slot:'weapon', atk:4, mag:6, price:140, for_:['ninny'], desc:'召喚の触媒杖'},
  w_pact:    {name:'パクトスタッフ', slot:'weapon', atk:7, mag:13, price:540, for_:['ninny'], desc:'契約力を高める杖'},
  w_sym:     {name:'交響の杖', slot:'weapon', atk:12, mag:21, price:1850, for_:['ninny'], desc:'次元の交響曲を奏でる'},
  w_omega:   {name:'オメガスタッフ', slot:'weapon', atk:17, mag:32, price:6100, for_:['ninny'], desc:'高次元の波動を宿す杖'},
  /* 防具 */
  a_suit:    {name:'カジュアルスーツ', slot:'armor', def:3, res:2, price:80, for_:'all', desc:'旅装束'},
  a_robe:    {name:'ローブ', slot:'armor', def:4, res:6, price:300, for_:['mina','lillie','ninny'], desc:'魔力を守る法衣'},
  a_volt:    {name:'ヴォルトスーツ', slot:'armor', def:7, res:4, price:400, for_:['leila'], desc:'耐電装甲服'},
  a_vest:    {name:'スカウトベスト', slot:'armor', def:6, res:3, price:350, for_:['kate'], desc:'軽量防弾ベスト'},
  a_plate:   {name:'AURALISプレート', slot:'armor', def:12, res:8, price:1600, for_:'all', desc:'AURALIS制式鎧'},
  a_forge:   {name:'リミナルアーマー', slot:'armor', def:20, res:16, price:7000, for_:'all', desc:'次元光繊維の最終鎧'},
  /* アクセサリ */
  ac_speed:  {name:'スピードチップ', slot:'acc', agi:6, price:800, for_:'all', desc:'素早さ+6'},
  ac_power:  {name:'パワーチップ', slot:'acc', atk:6, price:800, for_:'all', desc:'攻撃+6'},
  ac_magic:  {name:'マギチップ', slot:'acc', mag:6, price:800, for_:'all', desc:'魔法+6'},
  ac_guard:  {name:'ガードチップ', slot:'acc', def:5, res:5, price:900, for_:'all', desc:'防御/耐性+5'},
  ac_ribbon: {name:'リボン', slot:'acc', luck:8, res:4, price:2500, for_:'all', desc:'状態異常をほぼ防ぐ護符'},
  ac_token:  {name:'豊穣のnチップ', slot:'acc', luck:5, price:1200, for_:'all', desc:'獲得n-トークン増加'}
};

/* ---------- ショップ ---------- */
GD.shops = {
  biblo: { name:'ビブロ書庫店', items:['potion','antidote','phoenix','bomb'], equips:['w_biblio','a_robe','ac_speed'] },
  giga:  { name:'ギガポリス・コーポ市場', items:['potion','hipotion','ether','phoenix','antidote','bomb','icecrystal','boltcore'], equips:['w_thunder','w_rifle','w_cure','w_pact','a_volt','a_vest','a_plate','ac_power','ac_magic','ac_guard'] },
  vermilion:{ name:'ヴァーミリオン交易所', items:['hipotion','ether','phoenix','boltcore','lightorb'], equips:['w_aud','a_plate','ac_guard','ac_ribbon'] },
  eros:  { name:'ネオンクレーター宮商店', items:['hipotion','xpotions','turboether','phoenix','lightorb','elixir'], equips:['w_sym','w_choir','a_plate','ac_ribbon','ac_token'] },
  final: { name:'サミット特別供給部', items:['xpotions','megapotion','turboether','elixir','phoenix'], equips:['w_forge','w_pink','w_rail','w_eternal','w_omega','a_forge','ac_ribbon','ac_token'] }
};

/* レベル経験値テーブル */
GD.expTable = (() => {
  const t = [0,0];
  for (let lv=2; lv<=60; lv++) t[lv] = Math.round(20 * Math.pow(lv-1, 2.0));
  return t;
})();
