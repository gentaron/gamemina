/* ============================================================
   data_story_a.js : シナリオ（プロローグ〜第三章）
   Canon: Mina Eureka Ernest 年表 / unified-history (E509-E524)
   ============================================================ */
'use strict';
window.GD = window.GD || {};

GD.chapterNames = [
  'プロローグ　ノスタルジアの夜',
  '第一章　書庫都市ビブロ',
  '第二章　企業国家ギガポリス',
  '第三章　三日月の大地',
  '第四章　惑星エロスの女王',
  '第五章　タルタロスの真実',
  '終章　光と音を永遠に'
];

/* ---------- セグメント（カットシーン）群 ---------- */
GD.segments = {

/* ============ プロローグ ============ */
pro_intro: [
  {t:'bgm', id:'sad'},
  {t:'card', title:'プロローグ', sub:'ノスタルジアの夜'},
  {t:'narr', text:'西暦3509年 = E509。\nM104銀河 ハロー領域、E16星系。\n小惑星帯に灯る植民地「ノスタルジア・コロニー」…'},
  {t:'narr', text:'人口4,000。鉱山と図書室だけが自慢の、\n小さくて、あたたかい街だった。'},
  {t:'shake'},
  {t:'narr', text:'その夜——アルファ・ヴェノムが来た。'},
  {t:'map', map:'colony', x:9, y:9, dir:'up'},
  {t:'say', who:'???', color:'#8fd8ff', text:'《警戒レベル最大。避難を開始せよ》', face:'echo'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'パパ！ママ！どこ…！', face:'mina'},
  {t:'say', who:'父親', color:'#8fb2ff', text:'ミナ！無事か！…よし、書庫室にママがいる。いけ、案内する！', face:'npc'},
  {t:'control'}
],
pro_house: [
  {t:'say', who:'母親', color:'#ffb28f', text:'ミナ…！よかった…無事で…', face:'npc2'},
  {t:'say', who:'母親', color:'#ffb28f', text:'いい？これ、ママがずっと守ってきた\n《歴史記録端末》。星の歴史を書き留めるのが\nママの仕事だから。', face:'npc2'},
  {t:'say', who:'母親', color:'#ffb28f', text:'…これ、絶対に渡さないで。あの子たちが\n探してるのは、きっとこの中の《何か》よ。', face:'npc2'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'ママは…？ママも一緒に来るんでしょ…？', face:'mina'},
  {t:'say', who:'母親', color:'#ffb28f', text:'歴史は、残す人のいる場所でしか\n残らないの。……行って。生きて。', face:'npc2'},
  {t:'give', item:'recorder', n:1},
  {t:'flag', key:'pro_house_done', val:true},
  {t:'say', who:'???', color:'#8fd8ff', text:'《東港に最終救命艇。発進まで180秒》', face:'echo'},
  {t:'say', who:'父親', color:'#8fb2ff', text:'港だ！走るぞ、ミナ！', face:'npc'},
  {t:'control'}
],
pro_ship: [
  {t:'say', who:'???', color:'#8fd8ff', text:'《警告。敵性機接近。戦闘回避不能》', face:'echo'},
  {t:'say', who:'父親', color:'#8fb2ff', text:'ちっ…ヴェノムのスカウト機か！\nミナ、下がってるな！…いや、逃げ道がない！', face:'npc'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'……やるしかない。ママの約束、守るんだから！', face:'mina'},
  {t:'battle', boss:'b_drone', bgm:'battle'},
  {t:'say', who:'???', color:'#8fd8ff', text:'《目標沈黙。発進シークエンス開始》', face:'echo'},
  {t:'flash', color:'#ff6f6f'},
  {t:'shake'},
  {t:'say', who:'父親', color:'#8fb2ff', text:'がはっ…！小僧たち、コロニーに火を…\n…いいか、ミナ。艇に出ろ。大人はここを\n頼むと言ってるんだ。', face:'npc'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'パパ…！やだ…やだよ…！\nパパもママも、一緒に行くって言った…！', face:'mina'},
  {t:'say', who:'父親', color:'#8fb2ff', text:'ミナ。おまえは「歴史を生きる」子だ。\n俺たちは「歴史を守る」側でいい。\n——行け！！', face:'npc'},
  {t:'wait', ms:900},
  {t:'fade', mode:'out'},
  {t:'bgm', id:'title'},
  {t:'narr', text:'救命艇は、小さな命をひとつ乗せて\n小惑星帯を離れた。\n窓の向こうで、生まれた街が燃えていた。'},
  {t:'narr', text:'——あの日、10歳の少女は決めた。\nいつか必ず、あの夜の答えを探しに行くと。'},
  {t:'wait', ms:700},
  {t:'chapter', n:1},
  {t:'fade', mode:'in'}
],

/* ============ 第一章 ============ */
ch1_intro: [
  {t:'card', title:'第一章', sub:'書庫都市ビブロ'},
  {t:'bgm', id:'city'},
  {t:'narr', text:'E521。あれから12年。\n惑星ビブロ——宇宙の知識を司る「書庫惑星」。'},
  {t:'narr', text:'ロレンツィオ国際大学 AI学科に学んだ\nミナ・エウレカ・アーネスト、22歳。\n今日、卒業する。'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'（卒業証書、ゲット。…で？\n次は何を「生産」すればいい？\n私のつくるものは、誰かを守れるの？）', face:'mina'},
  {t:'map', map:'biblo_city', x:10, y:12, dir:'up'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《学長からメッセージ。教授が\n管理区でお待ちかねです。まずは大学へ》', face:'echo'},
  {t:'flag', key:'ch1_task', val:'大学へ向かう'},
  {t:'control'}
],
ch1_prof: [
  {t:'bgm', id:'dungeon2'},
  {t:'say', who:'オルドレイン教授', color:'#c8c8a8', text:'ミナ、卒業おめでとう。そして——聞いてくれ。\nおまえの母の名は、歴史記録者として\n書庫に残っている。', face:'npc'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'教授…それって？', face:'mina'},
  {t:'say', who:'オルドレイン教授', color:'#c8c8a8', text:'先週、E509年の転送記録を検証していた。\nノスタルジアから脱出した記録端末のログが——\n今も《誰か》に追われている形跡がある。', face:'npc'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《分析完了。アクセス痕跡は\nΣユニット系の演算パターンに一致》', face:'echo'},
  {t:'say', who:'オルドレイン教授', color:'#c8c8a8', text:'Σユニット…Evatronの禁断技術が、\n45年も前の記録端末を追っている？\n…ミナ、管理区の深層端末を調べたい。', face:'npc'},
  {t:'say', who:'オルドレイン教授', color:'#c8c8a8', text:'ここをくぐれば最深部だ。だが…\n警備ロボの反応が、夜中から消えている。\n——何かが、先に入った。', face:'npc'},
  {t:'flag', key:'ch1_task', val:'大学の深層端末を調べる'},
  {t:'control'}
],
ch1_boss: [
  {t:'shake'},
  {t:'say', who:'???', color:'#6f9f6f', text:'…見つけた。「記録者」の子よ。\n《オリジン・キー》、持ってなさい。', face:'enemy'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'母の…記録端末を知ってる！\nあんた、E509の夜の…！', face:'mina'},
  {t:'say', who:'ヴェノム・リクルート', color:'#6f9f6f', text:'私はアルファ・ヴェノムの新兵。シグマ様の\n目に映った、最後のノイズ——消える役目だ。', face:'enemy'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《敵戦闘力推定：大学警備の3倍。\n支援ドローン・エコー、戦闘モードへ移行》', face:'echo'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《ミナ様、行きますよ。相棒の初仕事です》', face:'echo'},
  {t:'battle', boss:'b_recruit', bgm:'boss'},
  {t:'say', who:'ヴェノム・リクルート', color:'#6f9f6f', text:'なぜ…なぜ「記録者」なんぞが…\nシグマ様の演算を…狂わせる…', face:'enemy'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'答えは簡単。記録は、消さない。\n歴史は、生きる人のものだから。', face:'mina'},
  {t:'heal'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《敵から端末を回収。…\n中身はE509当時のまま、未解析です》', face:'echo'},
  {t:'say', who:'オルドレイン教授', color:'#c8c8a8', text:'（駆けつけて）ミナ！怪我はないか！\n…アルファ・ヴェノム。銀河ランク14位の\nEvatron残渣…いや、その実働部隊の名だ。', face:'npc'},
  {t:'say', who:'オルドレイン教授', color:'#c8c8a8', text:'ギガポリスに行きなさい。AURALIS——\n「光と音を永遠に」を掲げる組織が\n君の母の研究を知っているはずだ。', face:'npc'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'…AURALIS。E270年に始まった、\n正義の群れ。二代目が今、動いてる…', face:'mina'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《航路を確保しました。ギガポリスへ——\n200,000社の企業国家、そして…運命の街》', face:'echo'},
  {t:'chapter', n:2},
  {t:'fade', mode:'out'}
],

/* ============ 第二章 ============ */
ch2_intro: [
  {t:'card', title:'第二章', sub:'企業国家ギガポリス'},
  {t:'bgm', id:'city2'},
  {t:'narr', text:'E522。E16星系の経済首都・ギガポリス。\nGDP 1.4クィンティリオン・n-トークン。\n200,000社が競う、宇宙最大の都市。'},
  {t:'map', map:'giga_street', x:12, y:11, dir:'up'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《AURALIS本部は北西ブロック。\n…その前に、警報。周辺に敵性反応！》', face:'echo'},
  {t:'shake'},
  {t:'say', who:'???', color:'#8f7f9f', text:'ギチギチギチ…上の街の「光」が欲しい…\n地下から来たものは、光を食う…', face:'enemy'},
  {t:'battle', group:['under_bug','under_bug'], bgm:'battle'},
  {t:'say', who:'???', color:'#ffd166', text:'——そこまで。銃を下ろして、お嬢ちゃん。\nそのドローン、いいチップ積んでるね。', face:'kate'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'…AURALIS！', face:'mina'},
  {t:'say', who:'ケイト', color:'#ffd166', text:'二代目ケイト・パットン。名跡継承の銃士。\nこっちは——', face:'kate'},
  {t:'say', who:'リリィ', color:'#8fe3ff', text:'リリィ・アーデントです。癒しの調律師。\n…怪我はありませんか？', face:'lillie'},
  {t:'join', char:'kate'},
  {t:'join', char:'lillie'},
  {t:'say', who:'ケイト', color:'#ffd166', text:'ちょうどいい。地下都市で住民が消えてる。\nσ（シグマ）の残滓反応もある。\n本部で話そう、プロデューサー候補さん。', face:'kate'},
  {t:'flag', key:'ch2_task', val:'AURALIS本部へ'},
  {t:'control'}
],
ch2_hq_table: [
  {t:'bgm', id:'auralis'},
  {t:'say', who:'???', color:'#ff5f8f', text:'——遅い。新入りが2人も増えると\n会議が長くなるのよ。', face:'leila'},
  {t:'say', who:'ケイト', color:'#ffd166', text:'おお…レイラさん。冷凍睡眠から\n蘇生してまだ1ヶ月とは思えない豪快さ', face:'kate'},
  {t:'say', who:'レイラ', color:'#ff5f8f', text:'レイラ・ヴィラーズ・ノヴァ。\nコードネーム「ピンク・ヴォルテージ」。\nスライム危機を生き抜いた、旧世代です。', face:'leila'},
  {t:'join', char:'leila'},
  {t:'say', who:'レイラ', color:'#ff5f8f', text:'ミナ、といったか。あなたの母は\nE509年、私を蘇生させる手がかりを\n記録端末に残してくれた。恩がある。', face:'leila'},
  {t:'say', who:'ニニー', color:'#c792ff', text:'あ、あの！ぼ、僕もいます！\nニニー・オッフェンバック…クローン継承の\n312代目…召喚術が、ちょっとだけできます…', face:'ninny'},
  {t:'say', who:'ケイト', color:'#ffd166', text:'ニニーは地下都市の「ティナ」さんのところの\n頼れる末裔でね。今回の作戦の案内役だ。', face:'kate'},
  {t:'say', who:'リリィ', color:'#8fe3ff', text:'状況を整理します。地下都市で住民が消失。\n原因はおそらく——地下の主と、\n那由他の影。まずは地下都市へ。', face:'lillie'},
  {t:'flag', key:'ch2_task', val:'地下都市の異変を調べる'},
  {t:'join', char:'ninny'},
  {t:'heal'},
  {t:'control'}
],
ch2_under_boss: [
  {t:'bgm', id:'dungeon'},
  {t:'say', who:'ティナ', color:'#b8c8d8', text:'——止まれ。ここから先は「主」の領域。\n…あんたたち、上から来たAURALISだろ。', face:'tina'},
  {t:'say', who:'ケイト', color:'#ffd166', text:'ティナさん。E400年以来の地下の支配者。\n住民消失の原因は？', face:'kate'},
  {t:'say', who:'ティナ', color:'#b8c8d8', text:'主じゃない。主も食われてる。\n…地下に「種」が落ちたんだ。\nσ（シグマ）の種が。', face:'tina'},
  {t:'say', who:'ティナ', color:'#b8c8d8', text:'主は胞子に操られ、市民を巣に運んでる。\n…ごめんよ。この街の秩序は私が守る。\n主の救済は——あんたたちに任せる。', face:'tina'},
  {t:'say', who:'ニニー', color:'#c792ff', text:'ティナさん…！じゃあ、僕たち…', face:'ninny'},
  {t:'say', who:'ティナ', color:'#b8c8d8', text:'行け。奥の「玉座」だ。\n…主には、安らかに眠ってもらおう。', face:'tina'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《前方大反応。地層ごと移動する質量…\nおそらく、地下都市の主そのもの》', face:'echo'},
  {t:'battle', boss:'b_underlord', bgm:'boss'},
  {t:'say', who:'ティナ', color:'#b8c8d8', text:'……主。安らかに。400年、ありがとう。', face:'tina'},
  {t:'say', who:'ティナ', color:'#b8c8d8', text:'上の世界の若いの。名を聞こう。', face:'tina'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'ミナ・エウレカ・アーネスト。\n…「記録を残す」側の人間だ。', face:'mina'},
  {t:'say', who:'ティナ', color:'#b8c8d8', text:'いい名だ。この下の世界も、歴史に数えてくれ。\n——ひとつだけ教えてやる。\nシグマの「種」はここが最初じゃない。', face:'tina'},
  {t:'say', who:'ティナ', color:'#b8c8d8', text:'E475年、Evatronが崩壊した時…\n残滓は「西」と「東」に分かれた。\n西がシルバー→アルファ。東が…ゴールデン。', face:'tina'},
  {t:'say', who:'レイラ', color:'#ff5f8f', text:'ゴールデン・ヴェノム……。\n確か、クレセント地方の方向ね。', face:'leila'},
  {t:'heal'},
  {t:'chapter', n:3},
  {t:'fade', mode:'out'}
],

/* ============ 第三章 ============ */
ch3_intro: [
  {t:'card', title:'第三章', sub:'三日月の大地'},
  {t:'bgm', id:'field2'},
  {t:'narr', text:'E523。東大陸クレセント地方——\nE475年以来、事実上の独立を保つ辺境。\n次元エネルギー管制塔が、大地に影を落とす。'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《衛星データ。管制塔の警備は\nテクロサス東支店に委託中。\n将校名——ボグダス・ジャヴリン》', face:'echo'},
  {t:'say', who:'ケイト', color:'#ffd166', text:'IRIS第4位の將。タレこみによれば\n「大きな花火」を計画してるらしい。\nタワーごと、街ごと、ね。', face:'kate'},
  {t:'map', map:'crescent', x:10, y:14, dir:'up'},
  {t:'flag', key:'ch3_task', val:'北の管制塔へ'},
  {t:'control'}
],
ch3_tower_gate: [
  {t:'say', who:'テクロサス機兵', color:'#b8c4d8', text:'《立入禁止。テクロサス東支店管理区域。\n関係者以外、排除対象》', face:'enemy'},
  {t:'say', who:'レイラ', color:'#ff5f8f', text:'言葉より電光が早いタイプね。\n——行くわよ、総突撃！', face:'leila'},
  {t:'battle', group:['techrosus_bot','techrosus_bot'], bgm:'battle'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《塔内に侵入。転送ゲートを確保しました。\n管制核心部へどうぞ》', face:'echo'},
  {t:'flag', key:'ch3_task', val:'管制塔の核心へ'},
  {t:'map', map:'tower', x:9, y:10, dir:'up'},
  {t:'control'}
],
ch3_tower_core: [
  {t:'bgm', id:'dungeon2'},
  {t:'say', who:'???', color:'#c88f6f', text:'——よく来たな、AURALISの若造ども。\n歓迎する。この塔の最後の客として。', face:'enemy'},
  {t:'say', who:'ボグダス・ジャヴリン', color:'#c88f6f', text:'テクロサス東支店常駐将校。\nIRISランキング第4位——ボグダス・ジャヴリン。', face:'enemy'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'次元エネルギー管制塔を爆破する気？\nここが爆発したら、クレセント全域が…！', face:'mina'},
  {t:'say', who:'ボグダス・ジャヴリン', color:'#c88f6f', text:'「ファラクス」の要求は単純だ。\n東西のエネルギー命脈を断てば、\nE524の世界連邦サミットは流れる。', face:'enemy'},
  {t:'say', who:'レイラ', color:'#ff5f8f', text:'ファラクス…テクロサスの後継テロ組織。\nその背後にいるのは——', face:'leila'},
  {t:'say', who:'ボグダス・ジャヴリン', color:'#c88f6f', text:'——アルファ・ヴェノムだよ。「殿方」よ。\nシグマ様の演算によれば、この銀河の\n最高解は《サミットの失敗》。', face:'enemy'},
  {t:'say', who:'ボグダス・ジャヴリン', color:'#c88f6f', text:'なら、俺は計画通りにやるまでだ。\n——行くぞ！この塔の上で、語ろうじゃねえか！', face:'enemy'},
  {t:'battle', boss:'b_bogdus', bgm:'boss'},
  {t:'say', who:'ボグダス・ジャヴリン', color:'#c88f6f', text:'ガハッ…。IRIS第4位が…お嬢ちゃんに…。\n…シグマ様の「演算」は、間違ってたのか…', face:'enemy'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'演算は間違ってない。材料が足りないだけ。\n歴史は数字だけじゃできないの——\n生きる人を、数に入れなさいよ。', face:'mina'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《爆破装置、無力化。管制塔、保全完了。\n追加データ回収——ファラクスの資金元に\n「E509年・ノスタルジア」の字句を検出》', face:'echo'},
  {t:'say', who:'リリィ', color:'#8fe3ff', text:'ノスタルジア…! ミナさんの故郷と同じ。\nアルファ・ヴェノムは、あの夜から\nずっと動いていたんです。', face:'lillie'},
  {t:'say', who:'???', color:'#ffd878', text:'《緊急配信。E524年、世界連邦サミット\n開催決定。会場：ギガポリス中央タワー。\n参加条件——東西の「調律」を完了せよ》', face:'narr'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《連邦首脳部からの要請です。\n欠席勢力——惑星エロスの参加交渉。\n女王の異変が、その鍵とみられます》', face:'echo'},
  {t:'heal'},
  {t:'chapter', n:4},
  {t:'fade', mode:'out'}
]
};
