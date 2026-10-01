/* ============================================================
   GAMEMINA CHRONICLE ─ Character Data
   base: Lv1値 / growth: レベル毎の上昇量（線形＋補正）
   cap: Lv50 / 戦闘参加: 4人（メニューで入れ替え）
   ============================================================ */
'use strict';
window.GM = window.GM || {};
GM.CHARACTERS = {
  layla: {
    id: 'layla', name: 'レイラ', full: 'レイラ・ヴィレル・ノヴァ',
    title: 'Pink Voltage', job: '雷光の闘士',
    accent: 'c1',
    look: { hair: 'M', hair2: 'm', skin: 'S', top: 'W', top2: 'B', bottom: 'R', boot: 'B', trim: 'M', belt: 'R', twin: true, blush: false },
    base: { hp: 320, mp: 30, atk: 16, def: 12, mag: 10, mdf: 10, spd: 14, luk: 12 },
    growth: { hp: 88, mp: 5, atk: 4.4, def: 2.9, mag: 2.0, mdf: 2.4, spd: 2.8, luk: 2.0 },
    weapon: ['w_layla1', 'w_layla2', 'w_layla3', 'w_layla4', 'w_layla5']
  },
  gentaro: {
    id: 'gentaro', name: '弦太郎', full: '弦太郎',
    title: 'Shining Blade', job: '若き剣士',
    accent: 'c2',
    look: { hair: 'K', hair2: 'D', skin: 'S', top: 'G', top2: 'g', bottom: 'b', boot: 'R', trim: 'W', belt: 'n' },
    base: { hp: 300, mp: 34, atk: 14, def: 11, mag: 12, mdf: 11, spd: 13, luk: 13 },
    growth: { hp: 82, mp: 6, atk: 4.0, def: 2.7, mag: 2.6, mdf: 2.6, spd: 2.7, luk: 2.2 },
    weapon: ['w_gentaro1', 'w_gentaro2', 'w_gentaro3', 'w_gentaro4', 'w_gentaro5']
  },
  mina: {
    id: 'mina', name: 'ミナ', full: 'ミナ・エウレカ・アーネスト',
    title: 'Liminal Forge', job: '次元の詠唱者',
    accent: 'c2',
    look: { hair: 'B', hair2: 'b', skin: 'S', top: 'W', top2: 'C', bottom: 'C', boot: 'b', trim: 'C', belt: 'C', longHair: true },
    base: { hp: 240, mp: 70, atk: 8, def: 9, mag: 18, mdf: 15, spd: 12, luk: 11 },
    growth: { hp: 62, mp: 13, atk: 1.8, def: 2.2, mag: 5.0, mdf: 3.6, spd: 2.4, luk: 1.8 },
    weapon: ['w_mina1', 'w_mina2', 'w_mina3', 'w_mina4', 'w_mina5']
  },
  jen: {
    id: 'jen', name: 'ジェン', full: 'ジェン',
    title: 'Dawnbreaker', job: 'ヴァロリアの英雄王',
    accent: 'c2',
    look: { hair: 'L', hair2: 'd', skin: 'S', top: 'B', top2: 'b', bottom: 'W', boot: 'R', trim: 'W', belt: 'A', longHair: true },
    base: { hp: 360, mp: 40, atk: 17, def: 15, mag: 12, mdf: 12, spd: 11, luk: 13 },
    growth: { hp: 98, mp: 7, atk: 4.6, def: 3.6, mag: 2.4, mdf: 2.9, spd: 2.2, luk: 2.0 },
    weapon: ['w_jen1', 'w_jen2', 'w_jen3', 'w_jen4', 'w_jen5']
  },
  ayaka: {
    id: 'ayaka', name: 'アヤカ', full: 'アヤカ・リン',
    title: 'Aqua Hunter', job: '搾精生物ハンター',
    accent: 'c1',
    look: { hair: 'O', hair2: 'A', skin: 'S', top: 'O', top2: 'Y', bottom: 'W', boot: 'C', trim: 'W', belt: 'C' },
    base: { hp: 310, mp: 55, atk: 13, def: 11, mag: 16, mdf: 14, spd: 13, luk: 14 },
    growth: { hp: 84, mp: 10, atk: 3.6, def: 2.7, mag: 4.2, mdf: 3.2, spd: 2.7, luk: 2.4 },
    weapon: ['w_ayaka1', 'w_ayaka2', 'w_ayaka3', 'w_ayaka4', 'w_ayaka5']
  },
  myu: {
    id: 'myu', name: 'ミュ', full: 'ミュ',
    title: 'Deep Diver', job: '探査の英雄',
    accent: 'c2',
    look: { hair: 'T', hair2: 'g', skin: 'S', top: 'B', top2: 'b', bottom: 'W', boot: 'R', trim: 'W', belt: 'A' },
    base: { hp: 330, mp: 38, atk: 16, def: 13, mag: 11, mdf: 11, spd: 15, luk: 13 },
    growth: { hp: 90, mp: 7, atk: 4.5, def: 3.1, mag: 2.2, mdf: 2.6, spd: 3.0, luk: 2.0 },
    weapon: ['w_myu1', 'w_myu2', 'w_myu3', 'w_myu4', 'w_myu5']
  },
  iris: {
    id: 'iris', name: 'アイリス', full: 'アイリス',
    title: 'Vermilion No.1', job: '青き穿つ者',
    accent: 'c2',
    look: { hair: 'p', hair2: 'K', skin: 'S', top: 'B', top2: 'W', bottom: 'K', boot: 'b', trim: 'C', belt: 'C' },
    base: { hp: 300, mp: 45, atk: 15, def: 12, mag: 15, mdf: 13, spd: 16, luk: 12 },
    growth: { hp: 80, mp: 8, atk: 4.2, def: 2.8, mag: 3.8, mdf: 3.0, spd: 3.2, luk: 2.0 },
    weapon: ['w_iris1', 'w_iris2', 'w_iris3', 'w_iris4', 'w_iris5']
  },
  casteria: {
    id: 'casteria', name: 'カステリア', full: 'カステリア・グレンヴェルト',
    title: 'Dimension Jumper', job: '跳躍する少女',
    accent: 'c1',
    look: { hair: 'Y', hair2: 'A', skin: 'S', top: 'K', top2: 'p', bottom: 'K', boot: 'P', trim: 'P', belt: 'P', longHair: true },
    base: { hp: 270, mp: 60, atk: 11, def: 10, mag: 17, mdf: 14, spd: 14, luk: 15 },
    growth: { hp: 70, mp: 11, atk: 2.8, def: 2.4, mag: 4.6, mdf: 3.4, spd: 2.9, luk: 2.6 },
    weapon: ['w_casteria1', 'w_casteria2', 'w_casteria3', 'w_casteria4', 'w_casteria5']
  }
};

/* 加入順（ストーリーで制御される） */
GM.JOIN_ORDER = ['layla', 'gentaro', 'mina', 'jen', 'ayaka', 'myu', 'iris', 'casteria'];

/* レベルアップに必要な累積EXP（次レベルまで） */
GM.expToNext = function (lv) {
  return Math.floor(32 * Math.pow(lv, 1.85));
};
GM.statAt = function (base, growth, lv) {
  const v = base + growth * (lv - 1) + Math.pow(Math.max(0, lv - 20), 1.6) * (growth * 0.12);
  return Math.floor(v);
};
