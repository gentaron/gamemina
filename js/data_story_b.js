/* ============================================================
   data_story_b.js : シナリオ（第四章〜終章・エンディング）
   ============================================================ */
'use strict';
window.GD = window.GD || {};

GD.segments = window.GD.segments || {};

Object.assign(GD.segments, {

/* ============ 第四章 ============ */
ch4_intro: [
  {t:'card', title:'第四章', sub:'惑星エロスの女王'},
  {t:'bgm', id:'eros'},
  {t:'narr', text:'惑星エロス7。E16星系の外縁惑星。\nE0年以来、女性が社会を担う「マトリカル社会」\nが続く、紫の霧に包まれた世界。'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《注意。電磁嵐により通信制限。\n首都・ネオンクレーター宮へは\n北西の宮殿通路から》', face:'echo'},
  {t:'map', map:'eros', x:9, y:10, dir:'up'},
  {t:'say', who:'ニニー', color:'#c792ff', text:'ここがエロス7…本の世界でしか\n見たことない、きれいな星球だ…', face:'ninny'},
  {t:'flag', key:'ch4_task', val:'女王の玉座へ'},
  {t:'control'}
],
ch4_throne: [
  {t:'bgm', id:'dungeon2'},
  {t:'say', who:'アヤカ・リン', color:'#ff9fb8', text:'——AURALISの皆さん、よく来てくれた。\n改革派のアヤカ・リンです。手短に言います。', face:'ayaka'},
  {t:'say', who:'アヤカ・リン', color:'#ff9fb8', text:'女王陛下が「変わって」しまった。\n国内の搾取技術が、西の機構と同じ\n「毒」に書き換えられている。', face:'ayaka'},
  {t:'say', who:'アヤカ・リン', color:'#ff9fb8', text:'ゴールデン・ヴェノムの女王——\n「黄金の蜂后」が宮殿に巣食っている。\n陛下はその費洛蒙（フェロモン）で\n操られているんです。', face:'ayaka'},
  {t:'say', who:'ケイト', color:'#ffd166', text:'費洛蒙は回路じゃ消せない…。\nでも、ソースを燃やせば話は別だ。', face:'kate'},
  {t:'say', who:'アヤカ・リン', color:'#ff9fb8', text:'玉座の間の先、培養庭園に主巣があります。\n…改革派は外の混乱を抑えます。\n——陛下を、返してください。', face:'ayaka'},
  {t:'battle', group:['golden_guard','golden_guard'], bgm:'battle'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《培養庭園制圧。主巣の守りが薄れました。\n玉座に、女王の反応…強烈な毒波形を検知》', face:'echo'},
  {t:'say', who:'ゴールデン・クイーン', color:'#ffd878', text:'キュキュキュ…良い客だねぇ。\nこの星の「蜜」は濃厚かい？\n…もうしばらく、巣の中がいいだろう？', face:'enemy'},
  {t:'say', who:'レイラ', color:'#ff5f8f', text:'——女王陛下を返していただくわ。\n骨の一本残さず、って言い方でよろしく？', face:'leila'},
  {t:'battle', boss:'b_goldqueen', bgm:'boss'},
  {t:'say', who:'ゴールデン・クイーン', color:'#ffd878', text:'バカな…この私が…種ごと燃やされる…\nシグマ様…次代は…おまえの…', face:'enemy'},
  {t:'say', who:'エロス女王', color:'#ffb8d8', text:'……ふう。目が、覚めたようだ。\n私は何を…何を隣人たちに…', face:'queen'},
  {t:'say', who:'アヤカ・リン', color:'#ff9fb8', text:'陛下。過去は「記録」し、未来は「改正」を。\n改革派は準備できています。', face:'ayaka'},
  {t:'say', who:'エロス女王', color:'#ffb8d8', text:'E524年のサミット…エロスの参加を\n正式に表明する。男女共同評議会の\n名において——宇宙へ羽ばたく。', face:'queen'},
  {t:'say', who:'アヤカ・リン', color:'#ff9fb8', text:'ミナさん。私たちの記録者になって。\nこの星の「改正」の歴史を——\nあなたの手で、未来に渡して。', face:'ayaka'},
  {t:'heal'},
  {t:'chapter', n:5},
  {t:'fade', mode:'out'}
],

/* ============ 第五章 ============ */
ch5_intro: [
  {t:'card', title:'第五章', sub:'タルタロスの真実'},
  {t:'bgm', id:'dungeon'},
  {t:'narr', text:'E475年に放棄されたEvatronの墓標。\n軍事惑星タルタロス——\nΣユニットが生まれ、そして死んだ場所。'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《内部は未だ自律演算が稼働中。\n検出中——2つの強反応。\n「演算端末」と「培養槽」です》', face:'echo'},
  {t:'say', who:'リリィ', color:'#8fe3ff', text:'端末でサミットへの脅威を解析して、\n培養槽を止める。二手に分かれる…\nのではなく、手分けせず回りましょう。', face:'lillie'},
  {t:'map', map:'tartarus', x:2, y:10, dir:'up'},
  {t:'flag', key:'ch5_task', val:'演算端末と培養槽を調べる'},
  {t:'control'}
],
ch5_terminal: [
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《演算端末、接続。母の記録端末と照合…\nオリジン・キーの解析——完了》', face:'echo'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《真実を報告します。\nE420年、Evatronは「Σユニット」を開発。\n精神操作と生体改造の禁止技術——\n…いえ、禁止された技術です》', face:'echo'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《E475年、Evatron崩壊。Σユニットの残滓は\n「シルバー・ヴェノム」として独立。\nE500年、東西へ分裂——\n西が「アルファ」、東が「ゴールデン」》', face:'echo'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《E509年、アルファ・ヴェノムの初代主が\nノスタルジアを襲撃。目的はただひとつ——\n「オリジン・キー」の回収。\nキーとは…記録端末に隠された\nΣユニット完全復元鍵です》', face:'echo'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'……母は、知ってたんだ。\nあの夜、この端末ごと、宇宙から\n消そうとしてた…。だから守った…', face:'mina'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《そしてE500年——アルファ・ヴェノムの\n現在の主が「継承」しました。\nコードネーム——シグマロード。\n演算能力はΣユニットの10,000倍》', face:'echo'},
  {t:'say', who:'レイラ', color:'#ff5f8f', text:'よし、真実は揃った。あとは\n——「歴史を守る」だけね。', face:'leila'},
  {t:'flag', key:'ch5_task', val:'培養槽を止める'},
  {t:'control'}
],
ch5_lab: [
  {t:'shake'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《培養槽、開放。高エネルギー反応！\n原初形態——プロトシグマ、起動します！》', face:'echo'},
  {t:'say', who:'プロトシグマ', color:'#9fb8ff', text:'『キー』……『キー』ヲ、ヨコセ……。\nソレガ、アルレキ、ノ、サイコウカイ……', face:'enemy'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'…やっぱり、あんたも「過去」から\n逃げてるだけなんだ。歴史は上書き\nできても、消えやしない——', face:'mina'},
  {t:'battle', boss:'b_protsigma', bgm:'boss'},
  {t:'say', who:'プロトシグマ', color:'#9fb8ff', text:'演算…不能…なぜ、ヒトは\n「ソン」という解を、選ブ……', face:'enemy'},
  {t:'say', who:'ニニー', color:'#c792ff', text:'それは…「ともに生きる」って言うんだよ。\n…ほら、静かに、おやすみ。', face:'ninny'},
  {t:'heal'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《全星域緊急速報——アルファ・ヴェノム主艦隊、\nギガポリスへ跳躍！目標：中央タワー！\n件名は《サミット砲撃と歴史の改竄》》', face:'echo'},
  {t:'say', who:'ケイト', color:'#ffd166', text:'サミットだ！引き返すぞ、全員！\n——ここからが「終章」だ。', face:'kate'},
  {t:'chapter', n:6},
  {t:'fade', mode:'out'}
],

/* ============ 終章 ============ */
fin_intro: [
  {t:'card', title:'終章', sub:'光と音を永遠に'},
  {t:'bgm', id:'summit'},
  {t:'narr', text:'E524年。ギガポリス中央タワー。\nM104銀河8大文明とE16星系が集う\n「世界連邦サミット」——開幕の朝。'},
  {t:'map', map:'summit', x:10, y:8, dir:'up'},
  {t:'say', who:'セリア・ドミニクス', color:'#ffb8d8', text:'——続けて。E16星系、AURALIS代表。\n若き総プロデューサー、ミナ殿。', face:'queen'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'はい。まず報告します。\nアルファ・ヴェノムの正体と目的、\nそして——このサミットが、次の標的です。', face:'mina'},
  {t:'flag', key:'fin_task', val:'サミットホールの異変を確認'},
  {t:'control'}
],
fin_summit_hall: [
  {t:'shake'},
  {t:'flash', color:'#6fff9f'},
  {t:'say', who:'???', color:'#7fbf7f', text:'——演算、完了。最高解を提示する。\n《サミットの全滅と、歴史の改竄》', face:'enemy'},
  {t:'say', who:'アルファ・ヴェノム・シグマロード', color:'#7fbf7f', text:'私はΣユニットの継承者。\n45年前、私がおまえの街を焼いた。\n「オリジン・キー」を運ばない者から、\n順に歴史から消えてゆけ。', face:'enemy'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'……ようやく会えたね。\nあの夜、パパとママの顔の前に立った\n「あいつ」——あなたか。', face:'mina'},
  {t:'say', who:'アルファ・ヴェノム・シグマロード', color:'#7fbf7f', text:'記憶照合。確証——99.2%。\n「記録者」の娘。ようやく揃ったな、\n最後のノイズよ。', face:'enemy'},
  {t:'say', who:'アルファ・ヴェノム・シグマロード', color:'#7fbf7f', text:'ヴェノムの軍勢よ——サミットを焼け。\n私が上で仕切る。フォージの起動鍵と\nキーは、頂戴する。', face:'enemy'},
  {t:'battle', group:['venom_knight','venom_knight','titan_node'], bgm:'battle'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《サミットホール、確保。閣僚の避難完了。\n——ミナ様。フォージ核心部への転送、\n準備できました。最後です》', face:'echo'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'みんな——行こう。\n45年ぶんの夜を、終わらせる。', face:'mina'},
  {t:'flag', key:'fin_task', val:'リミナル・フォージ核心部へ'},
  {t:'map', map:'summit', x:10, y:2, dir:'down'},
  {t:'control'}
],
fin_forge_core: [
  {t:'bgm', id:'boss2'},
  {t:'narr', text:'リミナル・フォージ——\n次元ピラミッドの頂から底へ、\n「光と音」を永遠に送り続ける放送装置。'},
  {t:'say', who:'アルファ・ヴェノム・シグマロード', color:'#7fbf7f', text:'来たか。……聞け、記録者の娘。\n私は「演算」の正しさを信じる。\n生きる解、希望の解——そういう曖昧さが、\nこの銀河を弱くした。', face:'enemy'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'あんたは「過去」を直せば未来が変わると\n思ってる。でも違う——過去は「記録」だから\n未来を決められる。私は、その為の\nプロデューサーだ。', face:'mina'},
  {t:'say', who:'アルファ・ヴェノム・シグマロード', color:'#7fbf7f', text:'——なら、演算で証明させてもらう。\nここに、おまえの45年を消す。\n《ノスタルジア》から、始めてやる！', face:'enemy'},
  {t:'battle', boss:'b_sigmalord', bgm:'boss2'},
  {t:'say', who:'アルファ・ヴェノム・シグマロード', color:'#7fbf7f', text:'ぐあっ…！なぜだ…最高解に…\n「そ な ら ぬ」 解 が あ る …！？', face:'enemy'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'だから言ったでしょ。\n計算は、全部「材料」が足りなかった——\n希望は、数字に書けないの。', face:'mina'},
  {t:'say', who:'アルファ・ヴェノム・シグマロード', color:'#7fbf7f', text:'……そうか。演算の外に「生」がある……。\nなら、その生を——記録者よ、\n覚えていてくれ。……私は、静かに、消える。', face:'enemy'},
  {t:'flash', color:'#ffffff'},
  {t:'wait', ms:1200},
  {t:'ending'}
],

/* ============ エンディング ============ */
ending: [
  {t:'bgm', id:'ending'},
  {t:'narr', text:'——E525年、リミナル・フォージ起動。\nE16星系から2026年の地球（ティア・デルタ）まで、\n次元ピラミッドの全階層へ「光と音」が届く。'},
  {t:'narr', text:'AURALIS二代目は、ノスタルジア・コロニーの\n記録を、宇宙史の正式な一頁として\n書庫へ捧げた。'},
  {t:'say', who:'ケイト', color:'#ffd166', text:'えっと、つまり——「歴史を守る側」の\n大人たちの城も、私たちが引き継いだって\nことだね。', face:'kate'},
  {t:'say', who:'リリィ', color:'#8fe3ff', text:'歌を続けます。光と音を永遠に——\nそれが私たちの名前の意味ですから。', face:'lillie'},
  {t:'say', who:'レイラ', color:'#ff5f8f', text:'E380年のスライム危機も、E509年の夜も、\n全部、次の世代への「仕送り」だ。\n——ミナ、あなたが書きなさい。', face:'leila'},
  {t:'say', who:'ニニー', color:'#c792ff', text:'僕も！僕も一頁だけ、召喚術の頁を…\n…あっ、これから増やしていきます！', face:'ninny'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《記録：完了。そしてミナ様——\nママの端末に、最初の1行が残っていました。\n「この記録を、生きる者へ」》', face:'echo'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'——うん。生きるよ、ママ。\nこの宇宙の、全部の夜を越えて。', face:'mina'},
  {t:'wait', ms:800},
  {t:'narr', text:'E528年。\nジェネシス・ヴォルトは2,000を超え、\n星々の夜に、それぞれの朝が灯る。'},
  {t:'narr', text:'——「宇宙は、私たちの意志によって\nかたちづくられる」\n（移住の父・ティムール・シャー）'},
  {t:'credits'}
],

credits: [
  {t:'narr', text:'MINA CHRONICLE 〜光と音を永遠に〜\n\n原作世界：EDU統合版設定（E16星系年代記）\n主人公：ミナ・エウレカ・アーネスト\nAURALIS二代目：ケイト・リリィ・レイラ・ニニー\nAI相棒：エコー\n\nゲーム制作：GameMina Project', center:true},
  {t:'narr', text:'Thanks for playing!\n\n……裏ボス「ジェン」が\n地下都市の最奥で、挑戦者を待っています。', center:true},
  {t:'postgame'}
],

/* ============ クリア後：裏ボス ============ */
post_jen: [
  {t:'bgm', id:'boss2'},
  {t:'say', who:'???', color:'#ff6f9f', text:'——おもしろい。この銀河の「記録」を\n書き換えた小娘が、ここに来るとは。', face:'enemy'},
  {t:'say', who:'ジェン', color:'#ff6f9f', text:'ジェン。E319年、ヴァロリア宮を奪り、\n今も連邦をまとめる者。Lv938——\n貴様らの比ではない。', face:'enemy'},
  {t:'say', who:'ミナ', color:'#ff7fb2', text:'……それでも、記録は残す。\nこの戦いも、いつかの歴史になる。', face:'mina'},
  {t:'say', who:'ジェン', color:'#ff6f9f', text:'いい眼だ。……では、その「歴史」、\n私の力で書き直せるか、試してやろう。', face:'enemy'},
  {t:'battle', boss:'b_jen', bgm:'boss2'},
  {t:'say', who:'ジェン', color:'#ff6f9f', text:'……負けたか。E319年以来の、実感ある敗北。\n貴様らの記録は——本物だ。', face:'enemy'},
  {t:'say', who:'ジェン', color:'#ff6f9f', text:'名を教えろ、記録者。……ミナ、か。\n次代の歴史に、その名を刻んでおこう。', face:'enemy'},
  {t:'say', who:'エコー', color:'#8fd8ff', text:'《真・クリア！全記録、完成。\nAURALIS二代目の物語は——永遠に続く》', face:'echo'},
  {t:'heal'},
  {t:'control'}
]

/* 裏ボス: postgame は story.js の 'postgame' ハンドラで地下都市へ転送 */
});
