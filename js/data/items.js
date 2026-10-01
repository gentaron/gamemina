/* ============================================================
   GAMEMINA CHRONICLE ─ Item / Equipment Data
   通貨: nトークン (nTG)
   type: heal | mp | revive | cure | battle | key
   equip: weapon(slot by char) / armor / acc
   ============================================================ */
'use strict';
window.GM = window.GM || {};
GM.ITEMS = {
  potion:      { name: 'ポーション', type: 'heal', val: 80, price: 50, desc: 'ナノマシンが傷を高速修復する（HP80回復）' },
  hipotion:    { name: 'ハイポーション', type: 'heal', val: 350, price: 220, desc: '濃縮修復ナノマシン（HP350回復）' },
  expotion:    { name: 'エクスポーション', type: 'heal', val: 1200, price: 800, desc: '軍用規格の完全修復剤（HP1200回復）' },
  ether:       { name: 'エーテル', type: 'mp', val: 40, price: 150, desc: '次元エネルギー飲料（MP40回復）' },
  hiether:     { name: 'ハイエーテル', type: 'mp', val: 120, price: 600, desc: '高濃度次元エネルギー（MP120回復）' },
  elixir:      { name: 'エリクシル', type: 'heal', val: 9999, mp: 999, price: 0, desc: '伝説の完全回復剤（HP/MP全回復）' },
  revive:      { name: 'リバイブ・セル', type: 'revive', val: 0.5, price: 400, desc: '生命再構築セル（戦闘不能を半分HPで復帰）' },
  antitox:     { name: 'アンチトキシン', type: 'cure', cures: ['poison'], price: 60, desc: '毒を分解する抗毒ナノ剂' },
  clearnano:   { name: 'クリア・ナノ', type: 'cure', cures: ['poison', 'paralysis', 'sleep'], price: 150, desc: '全状態異常を洗浄する万能ナノ剂' },
  grenade:     { name: 'プラズマ・グレネード', type: 'battle', abil: { kind: 'mag', el: 'thunder', pow: 1.8, tgt: 'enemy', sfx: 'thunder' }, price: 180, desc: 'プラズマ弾が炸裂する（敵1体）' },
  emp:         { name: '電磁パルス弾', type: 'battle', abil: { kind: 'mag', el: 'thunder', pow: 1.4, tgt: 'enemies', sfx: 'thunder' }, price: 300, desc: 'EMPで敵全体を感電させる' },
  gbomb:       { name: '重力崩壊弾頭', type: 'battle', abil: { kind: 'mag', el: 'void', pow: 2.6, tgt: 'enemies', sfx: 'shake' }, price: 1200, desc: '禁呪級の戦略兵器（敵全体に大打撃）' },
  /* key items */
  qid:         { name: '量子IDチップ', type: 'key', desc: 'A籍を証明する量子暗号チップ' },
  forgekey:    { name: 'フォージ・クレデンシャル', type: 'key', desc: 'リミナル・フォージへの正規アクセス権' },
  chronokey:   { name: 'クロノゲート・キー', type: 'key', desc: '時空の回廊を起動する鍵' },
  archive:     { name: '記憶の断片', type: 'key', desc: 'アルカイブに記録される時代の記憶' }
};

/* ---------------- Equipment ---------------- */
/* weapon: char 毎の成長ライン。atk 加算 */
GM.WEAPONS = {
  w_layla1: { name: '訓練用ナノグローブ', atk: 4, price: 100, char: 'layla' },
  w_layla2: { name: 'プラズマ・グローブ', atk: 12, price: 480, char: 'layla' },
  w_layla3: { name: 'ナノファイバー・ガントレット', atk: 24, price: 1500, char: 'layla' },
  w_layla4: { name: '100トン・インパクト', atk: 40, price: 4200, char: 'layla' },
  w_layla5: { name: 'ヴォルテック・カタラクト', atk: 62, price: 8800, char: 'layla' },
  w_gentaro1: { name: '冒険者の刃', atk: 4, price: 100, char: 'gentaro' },
  w_gentaro2: { name: '討伐屋の長剣', atk: 11, price: 450, char: 'gentaro' },
  w_gentaro3: { name: 'エリートブレード', atk: 22, price: 1400, char: 'gentaro' },
  w_gentaro4: { name: '曙光の刀', atk: 38, price: 4000, char: 'gentaro' },
  w_gentaro5: { name: '煌刃アマツ', atk: 58, price: 8600, char: 'gentaro' },
  w_mina1: { name: '見習いのロッド', atk: 2, mag: 5, price: 100, char: 'mina' },
  w_mina2: { name: 'フォージ・ロッド', atk: 3, mag: 12, price: 460, char: 'mina' },
  w_mina3: { name: '境界のスタッフ', atk: 5, mag: 22, price: 1400, char: 'mina' },
  w_mina4: { name: 'ペルセポネ・セプター', atk: 8, mag: 36, price: 4000, char: 'mina' },
  w_mina5: { name: '創世のヴォール', atk: 12, mag: 54, price: 8400, char: 'mina' },
  w_jen1: { name: 'ヴァロリアの剣', atk: 5, price: 120, char: 'jen' },
  w_jen2: { name: '統治者のセイバー', atk: 13, price: 500, char: 'jen' },
  w_jen3: { name: '白銀のレイピア', atk: 26, price: 1600, char: 'jen' },
  w_jen4: { name: '夜明けのプロミネンス', atk: 44, price: 4600, char: 'jen' },
  w_jen5: { name: 'ドーンブレイカー・真', atk: 66, price: 9000, char: 'jen' },
  w_ayaka1: { name: 'ハンターのトンファー', atk: 5, price: 120, char: 'ayaka' },
  w_ayaka2: { name: '潮打つの十手', atk: 13, price: 500, char: 'ayaka' },
  w_ayaka3: { name: '深海のヌンチャク', atk: 25, price: 1600, char: 'ayaka' },
  w_ayaka4: { name: '渦潮のシンセ', atk: 42, price: 4600, char: 'ayaka' },
  w_ayaka5: { name: '海皇のロッド・改', atk: 62, price: 8800, char: 'ayaka' },
  w_myu1: { name: '探査用の短剣', atk: 5, price: 120, char: 'myu' },
  w_myu2: { name: '遺跡のフォイル', atk: 13, price: 500, char: 'myu' },
  w_myu3: { name: 'エメラルド・セイバー', atk: 26, price: 1600, char: 'myu' },
  w_myu4: { name: '光剣ルミナ', atk: 44, price: 4600, char: 'myu' },
  w_myu5: { name: '星剣ディープダイヴ', atk: 64, price: 9000, char: 'myu' },
  w_iris1: { name: '仕込みダガー', atk: 5, price: 120, char: 'iris' },
  w_iris2: { name: 'ブルーワイヤ・クロー', atk: 13, price: 500, char: 'iris' },
  w_iris3: { name: '紫電のステレット', atk: 26, price: 1600, char: 'iris' },
  w_iris4: { name: '黒蝶のダイスブレード', atk: 44, price: 4600, char: 'iris' },
  w_iris5: { name: 'ヴァーミリオン・エッジ', atk: 64, price: 8800, char: 'iris' },
  w_casteria1: { name: '跳躍者のダガー', atk: 4, mag: 4, price: 120, char: 'casteria' },
  w_casteria2: { name: '風読のダガー', atk: 6, mag: 10, price: 500, char: 'casteria' },
  w_casteria3: { name: '星詠みのロッド', atk: 8, mag: 20, price: 1600, char: 'casteria' },
  w_casteria4: { name: '予知のオーブスタッフ', atk: 11, mag: 34, price: 4600, char: 'casteria' },
  w_casteria5: { name: '跳界のディメンショナー', atk: 14, mag: 52, price: 8600, char: 'casteria' }
};
/* armor: def/mdf 加算（全員共通） */
GM.ARMORS = {
  a1: { name: '旅装束', def: 3, mdf: 2, price: 80 },
  a2: { name: 'ナノファイバー・スーツ', def: 8, mdf: 5, price: 320 },
  a3: { name: 'ガード・ベスト', def: 15, mdf: 9, price: 980 },
  a4: { name: 'A籍式防護服', def: 24, mdf: 16, price: 2600 },
  a5: { name: '次元装甲ヴァラー', def: 38, mdf: 26, price: 6800 },
  a6: { name: '星衣シンフォニー', def: 52, mdf: 38, price: 9800 }
};
/* acc: 全員共通 */
GM.ACCS = {
  c_power:  { name: 'パワー・リング', atk: 6, price: 600, desc: '攻撃力+6' },
  c_guard:  { name: 'ガード・リング', def: 6, price: 600, desc: '防御+6' },
  c_mind:   { name: 'クオリア・コア', mag: 8, price: 800, desc: '魔力+8' },
  c_speed:  { name: 'スピード・チップ', spd: 8, price: 800, desc: '素早さ+8' },
  c_hp:     { name: 'ナノセル・インプラント', hp: 400, price: 1200, desc: '最大HP+400' },
  c_mp:     { name: '次元電池ユニット', mp: 60, price: 1200, desc: '最大MP+60' },
  c_amulet: { name: 'ホライゾンのアミュレット', def: 4, mdf: 8, price: 1800, desc: '防御+4 魔防+8' },
  c_badge:  { name: 'A籍A級バッジ', atk: 4, def: 4, mag: 4, spd: 4, price: 5000, desc: '全ステータス+4' },
  c_iris:   { name: 'IRIS第1位の証', atk: 8, spd: 8, price: 0, desc: 'IRIS王者の証。攻撃+8 素早さ+8' }
};

/* ショップ在庫（章が進むと品揃え拡張） */
GM.SHOPS = {
  0: ['potion', 'antitox', 'w_layla1', 'w_gentaro1', 'a1'],
  1: ['potion', 'hipotion', 'antitox', 'ether', 'w_layla2', 'w_gentaro2', 'w_mina2', 'a2', 'c_power', 'c_guard'],
  2: ['hipotion', 'ether', 'clearnano', 'w_mina2', 'w_jen1', 'w_jen2', 'a2', 'a3', 'c_mind', 'c_speed'],
  3: ['hipotion', 'ether', 'grenade', 'w_layla3', 'w_gentaro3', 'w_jen2', 'w_ayaka1', 'a3', 'c_power', 'c_speed'],
  4: ['expotion', 'hiether', 'clearnano', 'grenade', 'w_layla3', 'w_mina3', 'w_ayaka2', 'w_myu2', 'a3', 'a4', 'c_hp', 'c_mp'],
  5: ['expotion', 'hiether', 'emp', 'w_gentaro3', 'w_jen3', 'w_ayaka3', 'w_myu3', 'a4', 'c_amulet', 'c_badge'],
  6: ['expotion', 'hiether', 'emp', 'grenade', 'w_iris1', 'w_iris2', 'w_casteria1', 'a4', 'c_speed', 'c_mind'],
  7: ['expotion', 'hiether', 'gbomb', 'w_layla4', 'w_gentaro4', 'w_jen4', 'w_ayaka4', 'w_myu4', 'a5', 'c_badge'],
  8: ['expotion', 'hiether', 'gbomb', 'w_iris4', 'w_casteria4', 'w_mina4', 'a5', 'a6', 'c_hp', 'c_mp', 'c_badge'],
  9: ['expotion', 'hiether', 'gbomb', 'w_layla5', 'w_gentaro5', 'w_mina5', 'w_jen5', 'w_ayaka5', 'w_myu5', 'w_iris5', 'w_casteria5', 'a6']
};
