/* ============================================================
   GAMEMINA CHRONICLE ─ Ability Data (アビリティ/魔法)
   kind: phys | mag | heal | buff | debuff | revive | drain
   tgt : enemy | enemies | ally | allies | self | dead
   el  : phys | thunder | water | holy | void
   ============================================================ */
'use strict';
window.GM = window.GM || {};
GM.ABILITIES = {
  /* ---- Layla (Pink Voltage) ---- */
  epunch:      { name: 'エレクトリファイド・パンチ', kind: 'phys', el: 'thunder', mp: 3, pow: 1.5, tgt: 'enemy', sfx: 'thunder', desc: '帯電した拳で叩き込む雷撃のストレート' },
  shockwave:   { name: 'ショックウェーブ・ブラスト', kind: 'phys', el: 'thunder', mp: 8, pow: 1.1, tgt: 'enemies', sfx: 'thunder', desc: '衝撃波で敵全体を薙ぎ払う' },
  nkick:       { name: 'ナノファイバー・キック', kind: 'phys', el: 'phys', mp: 6, pow: 1.7, tgt: 'enemy', pierce: true, sfx: 'hit', desc: '敵の防御を貫通する強化繊維の蹴り' },
  lightning:   { name: 'ライトニング・ストライク', kind: 'mag', el: 'thunder', mp: 12, pow: 2.0, tgt: 'enemy', sfx: 'thunder', desc: '空より落雷を呼び下ろす' },
  jspin:       { name: 'ジェット・パワード・スピン', kind: 'phys', el: 'phys', mp: 14, pow: 1.35, tgt: 'enemies', sfx: 'hit', desc: '噴射推進の回転蹴りで敵全体を粉砕' },
  grapple:     { name: 'サイバネティック・グラップル', kind: 'drain', el: 'phys', mp: 10, pow: 1.3, tgt: 'enemy', sfx: 'hit', desc: '敵のエネルギーを吸収してHP回復' },
  boltaura:    { name: 'ボルト・オーロラ', kind: 'mag', el: 'thunder', mp: 28, pow: 2.4, tgt: 'enemies', sfx: 'thunder', desc: ' Pink Voltage の奥義。極光のごとき雷海' },
  /* ---- 弦太郎 (Gentaro) ---- */
  shineslash:  { name: 'シャインスラッシュ', kind: 'phys', el: 'holy', mp: 3, pow: 1.45, tgt: 'enemy', sfx: 'magic', desc: '闪光を纏った斬撃' },
  dualstrike:  { name: 'デュアルストライク', kind: 'phys', el: 'phys', mp: 7, pow: 0.95, hits: 2, tgt: 'enemy', sfx: 'hit', desc: '二連続の連撃' },
  guardbreak:  { name: 'ガードスマッシュ', kind: 'debuff', el: 'phys', mp: 8, pow: 0.6, tgt: 'enemy', status: { id: 'atkdown', turns: 4 }, sfx: 'debuff', desc: '防御の要を砕き、敵の攻撃力を下げる' },
  speedstar:   { name: 'スピードスター', kind: 'buff', el: 'phys', mp: 9, tgt: 'self', status: { id: 'haste', turns: 5 }, sfx: 'buff', desc: '疾風の如き加速で素早さを上げる' },
  kakusei:     { name: '覚醒・煌斬', kind: 'phys', el: 'holy', mp: 24, pow: 2.6, tgt: 'enemy', sfx: 'crit', desc: '弦太郎の奥義。覚醒の一閃' },
  /* ---- Mina (Liminal Forge) ---- */
  dimray:      { name: 'ディメンション・レイ', kind: 'mag', el: 'void', mp: 5, pow: 1.5, tgt: 'enemy', sfx: 'magic', desc: '位相を歪めて射出する次元光線' },
  limlight:    { name: 'リミナル・ライト', kind: 'heal', el: 'holy', mp: 6, pow: 60, tgt: 'ally', sfx: 'heal', desc: '境界の光で傷を癒す（回復量60+魔力的）' },
  forgeward:   { name: 'フォージ・シールド', kind: 'buff', el: 'holy', mp: 10, tgt: 'ally', status: { id: 'prot', turns: 4 }, sfx: 'buff', desc: '鍛冶の結界で味方の防御を上げる' },
  stillness:   { name: '時空の静寂', kind: 'debuff', el: 'void', mp: 14, tgt: 'enemies', status: { id: 'sleep', turns: 2, rate: 0.6 }, sfx: 'debuff', desc: '時間を凍らせ、敵全体を眠らせる' },
  limheal:     { name: 'リミナル・ヒールオール', kind: 'heal', el: 'holy', mp: 20, pow: 110, tgt: 'allies', sfx: 'heal', desc: '味方全員の傷を癒す' },
  persephone:  { name: 'ペルセポネ・ゲート', kind: 'mag', el: 'void', mp: 30, pow: 2.2, tgt: 'enemies', sfx: 'magic', desc: '仮想多元宇宙の扉を開き、虚無を浴びせる' },
  /* ---- Jen (Dawnbreaker) ---- */
  dawnbreaker: { name: 'ドーンブレイカー', kind: 'phys', el: 'holy', mp: 6, pow: 1.7, tgt: 'enemy', sfx: 'crit', desc: '夜明けの剣。聖なる衝撃を与える' },
  valerguard:  { name: 'ヴァラー・プロテクション', kind: 'buff', el: 'holy', mp: 12, tgt: 'allies', status: { id: 'prot', turns: 3 }, sfx: 'buff', desc: '「弱さは強さ」──全員の防御を高める誓い' },
  holyslash:   { name: '聖光斬', kind: 'mag', el: 'holy', mp: 14, pow: 2.1, tgt: 'enemy', sfx: 'magic', desc: '聖なる光波を剣圧として放つ' },
  mercyblade:  { name: '慈悲の刃', kind: 'drain', el: 'holy', mp: 12, pow: 1.4, tgt: 'enemy', sfx: 'hit', desc: '与えたダメージの一部をHPとして吸収' },
  grandhall:   { name: 'グランドホール・スラッシュ', kind: 'phys', el: 'holy', mp: 30, pow: 2.8, tgt: 'enemy', sfx: 'crit', desc: 'ヴァロリアの奥義。大広間を裂く終焉の一撃' },
  /* ---- Ayaka ---- */
  aquawave:    { name: 'アクアウェーブ', kind: 'mag', el: 'water', mp: 6, pow: 1.4, tgt: 'enemies', sfx: 'magic', desc: '押し寄せる水脈で敵全体を洗い流す' },
  bbarrier:    { name: 'ビキニバリア', kind: 'buff', el: 'water', mp: 10, tgt: 'ally', status: { id: 'shell', turns: 4 }, sfx: 'buff', desc: '特殊バリアで魔法ダメージを大幅に軽減' },
  splashheal:  { name: 'ヒーリング・スプラッシュ', kind: 'heal', el: 'water', mp: 8, pow: 70, tgt: 'ally', sfx: 'heal', desc: '清らかな水しぶきで回復' },
  soulburst:   { name: 'ソウルバースト', kind: 'mag', el: 'water', mp: 18, pow: 2.4, tgt: 'enemy', sfx: 'magic', desc: '魂の鼓動を爆発させる一撃' },
  oceanfall:   { name: 'オーシャン・フォール', kind: 'mag', el: 'water', mp: 30, pow: 2.3, tgt: 'enemies', sfx: 'magic', desc: 'アヤカの奥義。大海の怒りを天より降らせる' },
  /* ---- Myu ---- */
  lightblade:  { name: 'ライトブレード', kind: 'phys', el: 'holy', mp: 4, pow: 1.6, tgt: 'enemy', sfx: 'magic', desc: '光を纏う剣で斬り裂く' },
  tripdash:    { name: 'トリップダッシュ', kind: 'phys', el: 'phys', mp: 10, pow: 0.9, hits: 3, tgt: 'enemy', sfx: 'hit', desc: '三段突進の高速連撃' },
  emeraledge:  { name: 'エメラルド・エッジ', kind: 'phys', el: 'phys', mp: 9, pow: 1.2, tgt: 'enemy', status: { id: 'poison', turns: 5, rate: 0.75 }, sfx: 'hit', desc: '毒を帯びた翡翠の刃' },
  detect:      { name: 'トラップ・ディテクト', kind: 'buff', el: 'holy', mp: 6, tgt: 'allies', status: { id: 'focus', turns: 4 }, sfx: 'buff', desc: '探査英雄の眼識で味方の命中と会心を上げる' },
  deepdive:    { name: 'ディープ・ダイブ', kind: 'phys', el: 'holy', mp: 28, pow: 3.0, tgt: 'enemy', sfx: 'crit', desc: 'Trap Dungeon 最深部に至る者の一撃' },
  /* ---- Iris ---- */
  bluewire:    { name: 'ブルーワイヤ', kind: 'phys', el: 'phys', mp: 5, pow: 0.8, hits: 3, tgt: 'enemies', sfx: 'hit', desc: '自在に操る青い鋼線で敵を絡め斬る' },
  waterorb:    { name: 'ウォーター・オーブ', kind: 'mag', el: 'water', mp: 6, pow: 1.6, tgt: 'enemy', sfx: 'magic', desc: '水の矢を凝縮して射出する' },
  blackdice:   { name: 'ブラック・ダイス', kind: 'mag', el: 'void', mp: 15, pow: 1.8, tgt: 'enemies', sfx: 'magic', desc: '確率すら欺く黒い骰子が敵全体を割く' },
  wiretrap:    { name: 'ワイヤトラップ', kind: 'debuff', el: 'phys', mp: 8, tgt: 'enemy', status: { id: 'paralysis', turns: 3, rate: 0.65 }, sfx: 'debuff', desc: '鋼線の罠で動きを封じる' },
  vermdance:   { name: 'ヴァーミリオン・ダンス', kind: 'phys', el: 'phys', mp: 26, pow: 1.5, hits: 4, tgt: 'enemies', sfx: 'crit', desc: 'IRIS 第1位の名に懸ける無数の剣舞' },
  /* ---- Casteria ---- */
  sleepfeather:{ name: '睡眠の羽根', kind: 'debuff', el: 'void', mp: 7, tgt: 'enemies', status: { id: 'sleep', turns: 3, rate: 0.55 }, sfx: 'debuff', desc: '眠りを誘う羽根を敵全体に舞わせる' },
  jumpstrike:  { name: 'ジャンプ・ストライク', kind: 'phys', el: 'phys', mp: 6, pow: 1.75, tgt: 'enemy', sfx: 'hit', desc: '飛行能力による急降下攻撃' },
  foresee:     { name: '未来予知', kind: 'buff', el: 'void', mp: 9, tgt: 'allies', status: { id: 'focus', turns: 3 }, sfx: 'buff', desc: '降りかかる打撃を先読みして回避率を上げる' },
  timereap:    { name: 'タイムリープ', kind: 'buff', el: 'void', mp: 14, tgt: 'allies', status: { id: 'haste', turns: 4 }, sfx: 'buff', desc: '時を跳んで味方全体の素早さを上げる' },
  dimslash:    { name: 'ディメンション・スラッシュ', kind: 'mag', el: 'void', mp: 28, pow: 2.6, tgt: 'enemies', sfx: 'magic', desc: '世界の継ぎ目を断ち切る次元斬' }
};

/* 習得表: [level, abilityId] */
GM.LEARN = {
  layla:    [[1, 'epunch'], [4, 'shockwave'], [8, 'nkick'], [13, 'lightning'], [19, 'grapple'], [26, 'jspin'], [38, 'boltaura']],
  gentaro:  [[1, 'shineslash'], [5, 'dualstrike'], [10, 'guardbreak'], [16, 'speedstar'], [30, 'kakusei']],
  mina:     [[1, 'dimray'], [3, 'limlight'], [7, 'forgeward'], [12, 'stillness'], [18, 'limheal'], [25, 'persephone']],
  jen:      [[1, 'dawnbreaker'], [6, 'valerguard'], [11, 'mercyblade'], [17, 'holyslash'], [33, 'grandhall']],
  ayaka:    [[1, 'aquawave'], [4, 'splashheal'], [9, 'bbarrier'], [15, 'soulburst'], [28, 'oceanfall']],
  myu:      [[1, 'lightblade'], [6, 'detect'], [12, 'emeraledge'], [18, 'tripdash'], [32, 'deepdive']],
  iris:     [[1, 'bluewire'], [5, 'waterorb'], [11, 'wiretrap'], [17, 'blackdice'], [31, 'vermdance']],
  casteria: [[1, 'sleepfeather'], [5, 'jumpstrike'], [10, 'foresee'], [16, 'timereap'], [29, 'dimslash']]
};
