/* ============================================================
   data_maps.js : フィールドマップ定義
   タイル文字: . 草地  , 深い草(遇敵)  r 道路  t 木  w 水  m 岩
   ~ 砂(遇敵)  o 挙上物/瓦礫  # 建物壁  f 屋内床  W 屋内壁
   g ガラス床  n ネオン床(遇敵)  k 暗床(遇敵)  p コンソール
   b ブリッジ  L エネルギー裂け目  x 空/不可
   ============================================================ */
'use strict';
window.GD = window.GD || {};

GD.maps = {
/* ================= プロローグ: ノスタルジア・コロニー ================= */
colony: {
  name:'ノスタルジア・コロニー', bgm:'sad', battleBg:'colony',
  enc:{table:'colony', rate:0.12},
  tiles:[
    '##################',
    '#....#.....#.....#',
    '#....#.....#.....#',
    '#..o.o..o...o..o.#',
    '#..o..r......o...#',
    '#....r....#......#',
    '#.#..r..#.###.#..#',
    '#.#..r..#.....#..#',
    '#....r...........#',
    '#.o..r......o....#',
    '#....r.......r...#',
    '##################'
  ],
  events:[
    {x:15,y:10,type:'story',ev:'pro_ship',mark:'ship'},
    {x:3,y:2,type:'story',ev:'pro_house',mark:'home'},
    {x:9,y:5,type:'npc',name:'避難民',lines:['クソッ…ヴェノムが来た！','救命艇は東の港だ！走れ！']},
    {x:5,y:8,type:'npc',name:'避難民',lines:['炎が…街が…','母さんはまだ書庫室に…！']},
    {x:2,y:9,type:'chest',id:'c1',item:'potion',n:2},
    {x:13,y:8,type:'npc',name:'少年',lines:['パパがヴェノムに…ぐすっ','…ごめん、大丈夫だよ']}
  ]
},

/* ================= 第一章: ビブロ郊外 ================= */
biblo_field: {
  name:'ビブロ郊外 草原街道', bgm:'field', battleBg:'field',
  enc:{table:'biblo', rate:0.10},
  tiles:[
    'tt,,.....,,,,....tt..,,,,t',
    't,,....rr,,,,,...t..,,,,t',
    ',,....rr......,,,,....,,t',
    ',....rr....ww....,,....,,',
    '....rr....wwww......,,..t',
    '...rr......ww....,,....t,',
    '..rr....mm..w......,,,t,,',
    '.rr....mmmm.......,,,,,,,',
    'rr......mm....,,,,,,,....',
    'r....,,,,....,,......,,,',
    '....,,,.......t...,,...t',
    '...,,,,....t..t..,,,....t',
    '..,,,,....tt....,,,,....t',
    't,,,......t....,,,,.....t',
    'tt,,..........,,,,...tttt',
    'ttt.......rr....t..tttttt'
  ],
  events:[
    {x:10,y:15,type:'door',to:{map:'biblo_city',x:10,y:11,dir:'up'}},
    {x:24,y:1,type:'story',ev:'ch1_field_gate',mark:'gate'},
    {x:5,y:6,type:'npc',name:'旅商人',lines:['書庫都市ビブロへ？','知識は武器だよ、若いの。','…って店で売り文句言ってた']},
    {x:18,y:4,type:'chest',id:'c1',item:'potion',n:2},
    {x:2,y:12,type:'chest',id:'c2',item:'phoenix',n:1},
    {x:21,y:8,type:'npc',name:'巡礼者',lines:['ビブロには「普遍書庫」がある','星々の歴史が全部収まってるんだとさ']}
  ]
},

/* ================= 第一章: 書庫都市ビブロ ================= */
biblo_city: {
  name:'書庫都市ビブロ', bgm:'city', battleBg:'city',
  enc:null,
  tiles:[
    '####################',
    '#..#....rr....#....#',
    '#..#....rr....#..#.#',
    '#..D....rr....D..#.#',
    '#..#....rr....#..D.#',
    '#..#....rr....#..#.#',
    '#rrrrrrrrrrrrrrrrrr#',
    '#..#....rr....#....#',
    '#..D....rr....D....#',
    '#..#....rr....#....#',
    '#..#....rr....#....#',
    '#rrrrrrrrrrrrrrrrrr#',
    '#.......rr.........#',
    '####################'
  ],
  events:[
    {x:10,y:12,type:'door',to:{map:'biblo_field',x:10,y:14,dir:'up'}},
    {x:4,y:3,type:'door',to:{map:'library',x:8,y:7,dir:'up'},label:'ロレンツィオ国際大学'},
    {x:15,y:3,type:'door',to:{map:'biblo_shop',x:4,y:5,dir:'up'},label:'書庫店'},
    {x:4,y:8,type:'door',to:{map:'biblo_inn',x:4,y:5,dir:'up'},label:'宿屋「頁」'},
    {x:15,y:8,type:'door',to:{map:'biblo_home',x:4,y:5,dir:'up'},label:'学生寮'},
    {x:8,y:6,type:'npc',name:'学生',lines:['卒論…次元エネルギーの臨界…','教授に怒られるー！']},
    {x:13,y:10,type:'npc',name:'老学者',lines:['いいかね若いの、歴史は繰り返す','E400年のEvatron占領…あの悪夢も','「過去」だと思いたいがのう…']},
    {x:6,y:10,type:'npc',name:'少女',lines:['あのね、空中庭園の噴水きれいだよ','おにいちゃんもみにいこう！']}
  ]
},
biblo_shop: {
  name:'書庫店', bgm:'shop', indoor:true, battleBg:'city',
  tiles:['WWWWWWWWW','WffffffW','WffffffW','WffffffW','WffffffW','WffffffW','WWfDfWWWW'.slice(0,9)],
  events:[
    {x:4,y:6,type:'door',to:{map:'biblo_city',x:15,y:4,dir:'down'}},
    {x:3,y:2,type:'shop',id:'biblo'}
  ]
},
biblo_inn: {
  name:'宿屋「頁」', bgm:'shop', indoor:true, battleBg:'city',
  tiles:['WWWWWWWWW','WffffffW','WffffffW','WffffffW','WffffffW','WffffffW','WWfDfWWWW'.slice(0,9)],
  events:[
    {x:4,y:6,type:'door',to:{map:'biblo_city',x:4,y:9,dir:'down'}},
    {x:4,y:2,type:'inn',price:30}
  ]
},
biblo_home: {
  name:'学生寮', bgm:'shop', indoor:true, battleBg:'city',
  tiles:['WWWWWWWWW','WffffffW','WffffffW','WffffffW','WffffffW','WffffffW','WWfDfWWWW'.slice(0,9)],
  events:[
    {x:4,y:6,type:'door',to:{map:'biblo_city',x:15,y:9,dir:'down'}},
    {x:3,y:2,type:'chest',id:'hb',item:'ether',n:1},
    {x:6,y:2,type:'npc',name:'寮母',lines:['あんた、ミナだね？卒業おめでとう','世界的な研究者になるんだよ！']}
  ]
},

/* ================= 第一章: ロレンツィオ大学（普遍書庫） ================= */
library: {
  name:'ロレンツィオ国際大学', bgm:'dungeon2', indoor:true, battleBg:'library',
  enc:{table:'biblo_deep', rate:0.14},
  tiles:[
    'WWWWWWWWWWWWWWWW',
    'WfffffWfffffWffW',
    'WfffffWfffffWffW',
    'WffpffffpffffffW',
    'WfffffWfffffWffW',
    'WWWWfWWWWWWfWWWW',
    'WffffffkfffffkkW',
    'WfffffkkkffffkkW',
    'WfffffffffffffDW',
    'WWWWWWWWWWWWWWWW'
  ],
  events:[
    {x:13,y:8,type:'door',to:{map:'biblo_city',x:4,y:4,dir:'down'}},
    {x:3,y:3,type:'story',ev:'ch1_prof',mark:'prof'},
    {x:10,y:3,type:'npc',name:'司書',lines:['最深部は管理区です','許可なく入ると…警備ロボが']},
    {x:12,y:6,type:'chest',id:'c1',item:'ether',n:1},
    {x:2,y:6,type:'npc',name:'教授の助手',lines:['教授は管理区にいますよ','ここ最近、転送記録の検証ばかり']}
  ]
},

/* ================= 第二章: ギガポリス・テスラ区 ================= */
giga_street: {
  name:'ギガポリス テスラ区', bgm:'city2', battleBg:'city',
  enc:null,
  tiles:[
    '########################',
    '#ff#ffff#ffff#ffff#ff#f#',
    '#ff#ffff#ffff#ffff#ff#f#',
    '#ffDffffDffffDffffDff#f#',
    '#rrrrrrrrrrrrrrrrrrrr#f#',
    '#rrrrrrrrrrrrrrrrrrrrrr#',
    '#ff#ffff#ffff#ffff#ffff#',
    '#ffDffffDffffDffffDffff#',
    '#ff#ffff#ffff#ffff#ffff#',
    '#rrrrrrrrrrrrrrrrrrrrrr#',
    '#ff#ffff#ffff#ffff#ffff#',
    '#ffDffffDffffDffffDffff#',
    '#ff#ffff#ffff#ffff#ffff#',
    '########################'
  ],
  events:[
    {x:21,y:5,type:'door',to:{map:'under',x:2,y:11,dir:'up'},label:'地下都市入り口'},
    {x:3,y:3,type:'door',to:{map:'auralis_hq',x:9,y:10,dir:'up'},label:'AURALIS本部', flag:'ch2_task'},
    {x:10,y:3,type:'door',to:{map:'giga_shop',x:4,y:5,dir:'up'},label:'コーポ市場'},
    {x:17,y:3,type:'door',to:{map:'giga_inn',x:4,y:5,dir:'up'},label:'宿屋「星熵」'},
    {x:6,y:8,type:'npc',name:'n-トレーダー',lines:['n-トークンは量子暗号…','おい、そんなこと聞いてどうする']},
    {x:14,y:8,type:'npc',name:'通勤者',lines:['200,000社がひしめく企業国家','それがギガポリスだ。慣れなよ']},
    {x:20,y:8,type:'npc',name:'子ども',lines:['AURALISってほんとにいるの？','光と音を永遠に…って何？']},
    {x:9,y:12,type:'npc',name:'老人',lines:['E400年の占領からもうずいぶん…','まだ地下に「あの方々」がいると聞く']},
    {x:3,y:12,type:'chest',id:'c1',item:'hipotion',n:1}
  ]
},
giga_shop: {
  name:'コーポ市場', bgm:'shop', indoor:true, battleBg:'city',
  tiles:['WWWWWWWWW','WffffffW','WffffffW','WffffffW','WffffffW','WffffffW','WWfDfWWWW'.slice(0,9)],
  events:[{x:4,y:6,type:'door',to:{map:'giga_street',x:10,y:4,dir:'down'}},{x:3,y:2,type:'shop',id:'giga'}]
},
giga_inn: {
  name:'宿屋「星熵」', bgm:'shop', indoor:true, battleBg:'city',
  tiles:['WWWWWWWWW','WffffffW','WffffffW','WffffffW','WffffffW','WffffffW','WWfDfWWWW'.slice(0,9)],
  events:[{x:4,y:6,type:'door',to:{map:'giga_street',x:17,y:4,dir:'down'}},{x:4,y:2,type:'inn',price:60}]
},

/* ================= 第二章: AURALIS本部 ================= */
auralis_hq: {
  name:'AURALIS本部', bgm:'auralis', indoor:true, battleBg:'library',
  enc:null,
  tiles:[
    'WWWWWWWWWWWWWWWWWW',
    'WffffffffffffffffW',
    'WffWffffffffffWffW',
    'WffWffffffffffWffW',
    'WfffffpffffffpfffW',
    'WffffffffffffffffW',
    'WWWWDffffffffDWWWW',
    'WffffffffffffffffW',
    'WffWffffffffffWffW',
    'WffWffffffffffWffW',
    'WffffffffffffDfffW',
    'WWWWWWWWWWWWWWWWWW'
  ],
  events:[
    {x:12,y:10,type:'door',to:{map:'giga_street',x:3,y:4,dir:'down'}},
    {x:9,y:4,type:'story',ev:'ch2_hq_table',mark:'table'},
    {x:4,y:8,type:'save'},
    {x:15,y:8,type:'heal',label:'治療ポッド'},
    {x:4,y:2,type:'npc',name:'作戦参謀',lines:['西大陸は五大文明の同盟で安定','課題は東…クレセント地方だ']}
  ]
},

/* ================= 第二章: 地下都市 ================= */
under: {
  name:'ギガポリス地下都市', bgm:'dungeon', battleBg:'under',
  enc:{table:'under', rate:0.13},
  tiles:[
    '######################',
    '#kkk#kkkkk#kkkkkk#kkk#',
    '#kkkkkkkkkkkkkkkkkkkk#',
    '#kk#kk#kkkkkk#kk#kkkk#',
    '#kk#kk#kkkkkk#kk#kkkk#',
    '#kkkkkkkkkkkkkkkkkkkk#',
    '#kkkkkkk#kkkkkkkkkkkk#',
    '####kkkkkkkkkkkkkk####',
    '#kkkkkkkkkkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkkkk#',
    '#kk#kkkkkkkkkkkkkk#kk#',
    '#kk#kkkkkkkkkkkkkk#kk#',
    '######################'
  ],
  events:[
    {x:1,y:11,type:'door',to:{map:'giga_street',x:21,y:6,dir:'down'}},
    {x:11,y:1,type:'story',ev:'ch2_under_boss',mark:'throne'},
    {x:6,y:5,type:'chest',id:'c1',item:'hipotion',n:2},
    {x:17,y:9,type:'chest',id:'c2',item:'turboether',n:1},
    {x:2,y:8,type:'chest',id:'c3',item:'phoenix',n:2},
    {x:19,y:3,type:'npc',name:'地下住民',lines:['上は企業、下は…主がいる','それがこの街の秩序さ']},
    {x:11,y:8,type:'save'}
  ]
},

/* ================= 第三章: 三日月地方 ================= */
crescent: {
  name:'三日月地方クレセント 東大陸', bgm:'field2', battleBg:'desert',
  enc:{table:'crescent', rate:0.11},
  tiles:[
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~o~~~~~~~o~~~~~~~o~~~~~',
    '~~o~~~~~~~~~~~~~~~~~~~~~~~o~',
    '~~~~~~~~~~~~~~~~~~~~mm~~~~~~',
    '~~~o~~~~~~rr~~~~~~mmmm~~~~~~',
    '~~~~~~~~~~rr~~~~~~mmmm~~~o~~',
    '~~o~~~~~~~rr~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~rr~~~~~~~~~~~o~~~~',
    '~~~~o~~~~~rr~~~~~~o~~~~~~~~~',
    '~~~~~~~~~~rr~~~~~~~~~~~~~~~~',
    '~~o~~~~~~~rr~~~~~~o~~~~~~o~~',
    '~~~~~~~~~~rr~~~~~~~~~~~~~~~~',
    '~~~~o~~~~~rr~~~~~o~~~~o~~~~~',
    '~~~~~~~~~~rr~~~~~~~~~~~~~~~~',
    '~~o~~~~~~~rr~~~~~~~o~~~o~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
  ],
  events:[
    {x:10,y:15,type:'door',to:{map:'vermilion',x:9,y:9,dir:'up'}},
    {x:11,y:1,type:'story',ev:'ch3_tower_gate',mark:'tower'},
    {x:3,y:2,type:'chest',id:'c1',item:'hipotion',n:2},
    {x:26,y:2,type:'chest',id:'c2',item:'boltcore',n:2},
    {x:25,y:9,type:'npc',name:'遊牧民',lines:['東の空に塔が見えるか？','あれが次元エネルギー管制塔だ','最近、テクロサスの機兵が増えた…']},
    {x:4,y:10,type:'npc',name:'行商人',lines:['水は買うものだ、砂漠の掟さ','…ってことで水、いらないかい？']}
  ]
},

/* ================= 第三章: ヴァーミリオン ================= */
vermilion: {
  name:'ヴァーミリオン', bgm:'city2', battleBg:'city',
  enc:null,
  tiles:[
    '##################',
    '#ff#ff#ffff#ff#ff#',
    '#ff#ff#ffff#ff#ff#',
    '#ffDffDffffDffDff#',
    '#rrrrrrrrrrrrrrrr#',
    '#rrrrrrrrrrrrrrrr#',
    '#ff#ff#ffff#ff#ff#',
    '#ffDffDffffDffDff#',
    '#ff#ff#ffff#ff#ff#',
    '#rrrrrrrrrrrrrrrr#',
    '##################'
  ],
  events:[
    {x:10,y:9,type:'door',to:{map:'crescent',x:10,y:14,dir:'down'}},
    {x:3,y:3,type:'door',to:{map:'vermilion_shop',x:4,y:5,dir:'up'},label:'交易所'},
    {x:7,y:3,type:'door',to:{map:'vermilion_inn',x:4,y:5,dir:'up'},label:'宿場'},
    {x:13,y:3,type:'npc',name:'技師',lines:['管制塔の警備はテクロサス任せ','…これが仇になるかもな']},
    {x:6,y:7,type:'npc',name:'商人',lines:['クレセントの特産は次元結晶','でも最近は「毒」の話のほうが多い']},
    {x:14,y:7,type:'npc',name:'子供',lines:['シルバー・ヴェノムって知ってる？','その子孫が今、西にも東にもいるんだって']},
    {x:3,y:7,type:'save'}
  ]
},
vermilion_shop: {
  name:'ヴァーミリオン交易所', bgm:'shop', indoor:true, battleBg:'city',
  tiles:['WWWWWWWWW','WffffffW','WffffffW','WffffffW','WffffffW','WffffffW','WWfDfWWWW'.slice(0,9)],
  events:[{x:4,y:6,type:'door',to:{map:'vermilion',x:3,y:4,dir:'down'}},{x:3,y:2,type:'shop',id:'vermilion'}]
},
vermilion_inn: {
  name:'宿場', bgm:'shop', indoor:true, battleBg:'city',
  tiles:['WWWWWWWWW','WffffffW','WffffffW','WffffffW','WffffffW','WffffffW','WWfDfWWWW'.slice(0,9)],
  events:[{x:4,y:6,type:'door',to:{map:'vermilion',x:7,y:4,dir:'down'}},{x:4,y:2,type:'inn',price:80}]
},

/* ================= 第三章: 次元エネルギー管制塔 ================= */
tower: {
  name:'次元エネルギー管制塔', bgm:'dungeon2', indoor:true, battleBg:'tower',
  enc:{table:'tower', rate:0.14},
  tiles:[
    'WWWWWWWWWWWWWWWWWW',
    'WffffWfffffffWfffW',
    'WffffWfffffffWfffW',
    'WffffWffkkkffWfffW',
    'WffffWffkkkffWfffW',
    'WffffWffkkkffWfffW',
    'WffffWfffffffWfffW',
    'WffffWWWWfWWWWWWW',
    'WfffffffffffffpffW',
    'WffWfffffffffffffW',
    'WffWffffpffffffffW',
    'WWWWWWWWWWWWWWWWWW'
  ],
  events:[
    {x:9,y:7,type:'door',to:{map:'crescent',x:11,y:2,dir:'down'}},
    {x:10,y:3,type:'story',ev:'ch3_tower_core',mark:'core'},
    {x:2,y:9,type:'chest',id:'c1',item:'xpotions',n:1},
    {x:16,y:10,type:'chest',id:'c2',item:'lightorb',n:1},
    {x:8,y:10,type:'save'}
  ]
},

/* ================= 第四章: エロス7 ネオンクレーター宮 ================= */
eros: {
  name:'エロス7 ネオンクレーター宮', bgm:'eros', battleBg:'eros',
  enc:{table:'eros', rate:0.13},
  tiles:[
    '####################',
    '#nnnn#nnnnnn#nnnnnn#',
    '#nnnn#nnnnnn#nnnnnn#',
    '#nnnnnnnnnnnnnnnnnn#',
    '#nn#nnnnn##nnnnnn#n#',
    '#nn#nnnnn##nnnnnn#n#',
    '#nnnnnnnnnnnnnnnnnn#',
    '###nnnnnnnnnnnnnn###',
    '#nnnnnnnnnnnnnnnnnn#',
    '#nn#nnnnnnnnnnn#nnn#',
    '#nn#nnnnnnnnnnn#nnn#',
    '####################'
  ],
  events:[
    {x:16,y:1,type:'story',ev:'ch4_throne',mark:'throne'},
    {x:1,y:8,type:'door',to:{map:'eros_shop',x:4,y:5,dir:'up'}},
    {x:4,y:9,type:'chest',id:'c1',item:'megapotion',n:1},
    {x:16,y:8,type:'chest',id:'c2',item:'elixir',n:1},
    {x:2,y:1,type:'save'},
    {x:9,y:5,type:'npc',name:'改革派の女性',lines:['アヤカ・リン様の改革が動いてる','搾取会議の廃止…いつの日か']},
    {x:17,y:5,type:'npc',name:'近衛',lines:['女王陛下のお通りだ','身を低くしていろ']}
  ]
},
eros_shop: {
  name:'ネオンクレーター宮商店', bgm:'shop', indoor:true, battleBg:'eros',
  tiles:['WWWWWWWWW','WffffffW','WffffffW','WffffffW','WffffffW','WffffffW','WWfDfWWWW'.slice(0,9)],
  events:[{x:4,y:6,type:'door',to:{map:'eros',x:1,y:9,dir:'right'}},{x:3,y:2,type:'shop',id:'eros'}]
},

/* ================= 第五章: タルタロス遺跡 ================= */
tartarus: {
  name:'Evatron遺跡 タルタロス', bgm:'dungeon', battleBg:'tartarus',
  enc:{table:'tartarus', rate:0.15},
  tiles:[
    '######################',
    '#kkkkk#kkkkkkkk#kkkkk#',
    '#kkkkk#kkkkkkkk#kkkkk#',
    '#kkkkkkkkkkkkkkkkkkkk#',
    '###kkkkkk#kkkkkkkkk###',
    '#kkkkkkkk#kkkkkkkkkkk#',
    '#kk#kkkkkkkkkkkk#kkkk#',
    '#kk#kkkkkkkkkkkk#kkkk#',
    '#kkkkkkk#kkkkkkkkkkkk#',
    '#kkkkkkk#kkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkkkk#',
    '######################'
  ],
  events:[
    {x:1,y:10,type:'door',to:{map:'eros',x:1,y:2,dir:'down'}},
    {x:11,y:1,type:'story',ev:'ch5_lab',mark:'lab'},
    {x:18,y:1,type:'story',ev:'ch5_terminal',mark:'terminal'},
    {x:5,y:5,type:'chest',id:'c1',item:'megapotion',n:2},
    {x:18,y:9,type:'chest',id:'c2',item:'lightorb',n:2},
    {x:2,y:2,type:'chest',id:'c3',item:'elixir',n:1},
    {x:1,y:6,type:'save'},
    {x:5,y:8,type:'npc',name:'研究記録AI',lines:['…記録再生。E420年、Σユニット稼働','…精神操作・生体改造…禁止条約違反…','…E475年、母体崩壊。残滓は西へ…']}
  ]
},

/* ================= 終章: 中央タワー サミットホール ================= */
summit: {
  name:'ギガポリス中央タワー サミットホール', bgm:'summit', battleBg:'summit',
  enc:{table:'final', rate:0.15},
  tiles:[
    '####################',
    '#gggggggggggggggggg#',
    '#gggggggggggggggggg#',
    '#gggggggggggggggggg#',
    '#gggggggffffggggggg#',
    '#gggggggfWffggggggg#',
    '#gggggggggggggggggg#',
    '#gggggggggggggggggg#',
    '#gggggggggggggggggg#',
    '####################'
  ],
  events:[
    {x:10,y:1,type:'story',ev:'fin_forge_core',mark:'core'},
    {x:3,y:8,type:'story',ev:'fin_summit_hall',mark:'summit'},
    {x:17,y:8,type:'save'},
    {x:6,y:2,type:'npc',name:'グランベル代表',lines:['アルゼン・カリーン大統領閣下…','の代理です。経済同盟、よろしく']},
    {x:14,y:2,type:'npc',name:'エリセオン代表',lines:['リアーナ・ソリス女王の名代です','医療技術を武器にしませんように']}
  ]
}
};
