/* ============================================================
   GAMEMINA CHRONICLE ─ Story Data
   スクリプト命令:
   card / narr / msg / join / leave / boss / music / stop / flag
   openGate / archive / give / tg / heal / warp / fade / wait
   toast / choice / endgame / clearAuto
   ============================================================ */
'use strict';
window.GM = window.GM || {};

/* NPC・一般キャラの見た目パレット */
GM.LOOKS = {
  mina:     GM.CHARACTERS.mina.look,
  gentaro:  GM.CHARACTERS.gentaro.look,
  ayaka:    GM.CHARACTERS.ayaka.look,
  myu:      GM.CHARACTERS.myu.look,
  iris:     GM.CHARACTERS.iris.look,
  casteria: GM.CHARACTERS.casteria.look,
  kate:     { hair: 'N', hair2: 'n', skin: 'S', top: 'A', top2: 'n', bottom: 'b', boot: 'n', trim: 'W', belt: 'n' },
  lillie:   { hair: 'P', hair2: 'p', skin: 'S', top: 'K', top2: 'm', bottom: 'K', boot: 'm', trim: 'P', belt: 'P', longHair: true },
  kane:     { hair: 'L', hair2: 'D', skin: 's', top: 's', top2: 'D', bottom: 'K', boot: 'D', trim: 'D', belt: 'R' },
  herald:   { hair: 'G', hair2: 'g', skin: 'S', top: 'Y', top2: 'A', bottom: 'K', boot: 'N', trim: 'K', belt: 'A' },
  celianpc: { hair: 'Y', hair2: 'A', skin: 'S', top: 'W', top2: 'A', bottom: 'W', boot: 'A', trim: 'A', belt: 'A' },
  soldier:  { hair: 'D', hair2: 'K', skin: 'S', top: 'g', top2: 'g', bottom: 'n', boot: 'K', trim: 'K', belt: 'K' },
  citizen:  { hair: 'd', hair2: 'D', skin: 'S', top: 'd', top2: 'D', bottom: 'D', boot: 'K', trim: 'L', belt: 'L' },
  guard:    { hair: 'K', hair2: 'D', skin: 'S', top: 'b', top2: 'b', bottom: 'K', boot: 'K', trim: 'C', belt: 'C' },
  worker:   { hair: 'O', hair2: 'A', skin: 'S', top: 'O', top2: 'A', bottom: 'D', boot: 'N', trim: 'W', belt: 'K' },
  ghost:    { hair: 'C', hair2: 'W', skin: 'F', top: 'F', top2: 'W', bottom: 'F', boot: 'C', trim: 'C', belt: 'C' },
  student:  { hair: 'K', hair2: 'D', skin: 'S', top: 'W', top2: 'W', bottom: 'b', boot: 'K', trim: 'b', belt: 'b' },
  student2: { hair: 'n', hair2: 'A', skin: 'S', top: 'b', top2: 'b', bottom: 'b', boot: 'K', trim: 'W', belt: 'W' },
  seer:     { hair: 'W', hair2: 'C', skin: 'S', top: 'C', top2: 'W', bottom: 'W', boot: 'C', trim: 'P', belt: 'P', longHair: true }
};

/* 章タイトル定義 */
GM.CHAPTERS = {
  1:  { num: '第一章', name: '企業の鎖', sub: 'E318 ─ ZAMLT時代 ─ ギガポリス', map: 'ch1', hx: 3, hy: 4 },
  2:  { num: '第二章', name: '黄金の皇帝', sub: 'E340 ─ セリア黄金期 ─ セリノポリス', map: 'ch2', hx: 6, hy: 4 },
  3:  { num: '第三章', name: '大戦の嵐', sub: 'E375 ─ アポロン・ドミニオン大戦', map: 'ch3', hx: 9, hy: 4 },
  4:  { num: '第四章', name: 'スライム危機', sub: 'E385 ─ アンダーシティ第6層', map: 'ch4', hx: 12, hy: 4 },
  5:  { num: '第五章', name: '暗黒の時代', sub: 'E400 ─ エヴァトロン支配', map: 'ch5', hx: 15, hy: 4 },
  6:  { num: '第六章', name: 'Irisの時代', sub: 'E490 ─ 東大陸クレセント ─ ヴァーミリオン', map: 'ch6', hx: 21, hy: 4 },
  7:  { num: '第七章', name: '金色の粛清', sub: 'E509 ─ ノスタルジア・コロニー', map: 'ch7', hx: 24, hy: 4 },
  8:  { num: '第八章', name: '次元の彼方', sub: 'AD2026 ─ Tier Δ ─ 美咲が丘', map: 'ch8', hx: 27, hy: 4 },
  9:  { num: '第九章', name: 'Trap Dungeon', sub: 'E522 ─ 検証的迷宮', map: 'trap1', hx: 30, hy: 4 },
  10: { num: '終章', name: 'オメガの回廊', sub: 'E528 ─ Tier Ω ─ 高次元領域', map: 'ch10', hx: 33, hy: 4 }
};

/* アルカイブ（ロア収集要素） */
GM.ARCHIVE = [
  { id: 1, title: 'E16連星系', text: 'M104銀河ハロー領域の二重連星系。主星Ea16（橙色星）と伴星Eb16（赤色星）を持ち、中心惑星は「Symphony of Stars（星々の交響曲）」。1年は320日・10フェーズで構成されるE暦で数える。' },
  { id: 2, title: '次元ピラミッド', text: '世界は階層的に存在する。Tier Δ（我々の現代地球）／Tier Ε（E16通常次元）／Tier Σ（仮想多元宇宙ペルセポネ）／Tier Ω（8〜11次元の高次元層）。歪みはこの継ぎ目から生まれる。' },
  { id: 3, title: 'A籍制度', text: 'コーポラタムパブリカ期に導入された155階層の市民格付け。階層は住居・医療・移動権限に直結する。下層出身の覇者たちは、しばしばこの制度を「鎖」と呼んだ。' },
  { id: 4, title: 'AURALIS', text: 'E270年、K・パットンとL・ステイナーが創設した頂点決戦機構。「設計者」と「感情の炎」、二人の女性なしで銀河の歴史は語れない。E400年に解体され、E522年に2期として再建された。' },
  { id: 5, title: 'Layla Virel Nova', text: 'ピンクのツインテールと白いレオタード、真紅のマント。下層出身の元コロシアム王者で、公式戦績341戦316勝。E400年に冷凍保存され、E514年代に復活した「Pink Voltage」。' },
  { id: 6, title: 'アルファ・ケイン', text: 'ZAMLT時代、低階層から覚醒した元コロシアム王者。E318年のギガポリス解放戦の中心人物。後にセリア皇帝に敗れて処刑されるが、その灯火は多くの反抗者の心に燃え続けた。' },
  { id: 7, title: 'セリア・ドミニクス', text: 'アルファを打倒した「新次元皇帝」。次元エネルギー剣〈Dimension Selia〉の持ち主で、E335年から黄金期を築いた。敵にも味方にもなりうる、時代最大級の存在。' },
  { id: 8, title: 'アポロン・ドミニオン大戦', text: 'E375年のケンタウロス・レーザー、E378年のG4ファントムパルス──光速の砲火が星間政治を焼き変えた。アポロン・セントラリスはE385年に崩壊する。' },
  { id: 9, title: 'スライム危機', text: 'E380〜400年、高次元生命体スライムが下層に溢れた。レイラとアヤカの共闘は4戦4勝。最深部のReactor戦は伝説として語り継がれる。' },
  { id: 10, title: 'エヴァトロン', text: 'E400〜475年、E16を占領した統合企業体。惑星を勝手に「Evapolis」と改称し、AURALISを解体、抵抗者を粛清した。統治者はヴァイロン・デアクス。' },
  { id: 11, title: 'Irisの時代', text: 'E475年のエヴァトロン崩壊後、復興期を導いた時代の呼称。東大陸クレセントではIRISランキングが力の秩序を定め、第1位ヴァーミリオン、第2位ブルーローズが覇を競った。' },
  { id: 12, title: 'アルファ・ヴェノム', text: 'Σ-Unit後継の秘密警察。E509年、ノスタルジア・コロニーを攻撃し多数の難民を出した。金色の紋章は、忘却された虐殺の証人である。' },
  { id: 13, title: 'Tier Δ（地球）', text: 'AD2026年の「我々の現代」。美咲が丘高校の日常は、高次元からは観測困難なほど安寧──だからこそ、歪みはそこに隠れる。' },
  { id: 14, title: 'Trap Dungeon', text: '検証的迷宮。ミノタウロスLv230、アビサルレイスLv110など「測定レベル」が存在し、最深部にはLv1008の存在が眠ると言われる。探査の英雄ミュがその記録を持つ。' },
  { id: 15, title: '8大文明圏', text: '1位グランベル（経済）、2位エレシオン（医療）、3位ティエリア（軍事）、4位ファルージャ（文化）、5位ディオクレニス（探査）、6位エレシュ（宗教）、7位プロキオ（交易）、8位ロースター（通信）。' },
  { id: 16, title: '弦太郎', text: '童顔の優等生系剣士。喫茶店のバイトと低ランク討伐依頼で生計を立てる。アルファ・ケイン反乱期に急速な成長を見せ、弟子たちに技を広めた。' },
  { id: 17, title: 'リミナル・フォージ', text: 'ミナ・エウレカ・アーネストが主宰する境界鍛冶機関。時代と時代の「継ぎ目」を観測・修復する。この物語の拠点であり、時空の回廊そのもの。' },
  { id: 18, title: '初代DIANA', text: '1400年前に世界を征服したと伝わる「狂気の女神」。その名は継承され、誰かが必ず受け継いでいる。Tier Ωの深部で、彼女はずっと待っていた。' },
  { id: 19, title: 'オメガ＝ユリシス', text: 'EVILS連合を統合した虚無の統合体。歴史を「書き換える」ことで現在を消し去ろうとする。Tier Ωの回廊の門番にして、物語の最後の鍵。' },
  { id: 20, title: '諸世界連邦サミット', text: 'E524年、8大文明圏とE16の代表が結集した。歴史が正しく「ある」ために、未来は初めて希望を持つ。君たちの戦いは、この会議の前提である。' }
];

/* ---------------- スクリプト本体 ---------------- */
GM.STORY = {

/* ===== タイトル/新規ゲーム ===== */
prologue_intro: [
  { t: 'music', track: 'ending' },
  { t: 'narr', text: '──E暦528年。\nE16連星系・中心惑星「Symphony of Stars」。\n8大文明圏が連邦の夜明けを迎えた。' },
  { t: 'narr', text: 'そのはずだった。\n\n歴史の継ぎ目から、何かが漏れ始めている。' },
  { t: 'card', num: 'PROLOGUE', name: '星々の交響曲', sub: 'E528 ─ ギガポリス下層' },
  { t: 'music', track: 'dungeon' },
  { t: 'narr', text: '──下層区画。壁面のナノライトが明滅する。' },
  { t: 'msg', name: 'レイラ', text: '……下層の空気は、変わらないね。\n百年冷凍されてても、これだけは忘れない。' },
  { t: 'msg', name: '弦太郎', text: 'レイラさん、こっちです！\nAURALIS 2期の決起集会に遅れますよ……って、うわっ！\nなんですかこの「歪み」！？' },
  { t: 'msg', name: 'レイラ', text: '次元の裂け目……？\nいや、これはただの亀裂じゃない。「何か」がこっちを見てる。' },
  { t: 'flag', key: 'prologue_started', val: true },
  { t: 'join', who: 'layla' },
  { t: 'join', who: 'gentaro' },
  { t: 'toast', text: 'レイラ & 弦太郎 が仲間に加わった！' },
  { t: 'narr', text: '──整備通路の奥から、次元の呻きが聞こえる。' },
  { t: 'warp', map: 'under0' }
],

prologue_boss_area: [
  { t: 'msg', name: '弦太郎', text: '床が……脈打ってます。\nまるで「世界がバグっている」みたいな。' },
  { t: 'msg', name: 'レイラ', text: '行くよ、弦太郎。\n下層の掃除は、下層出身者の仕事だから。' }
],

boss_bugboss: [
  { t: 'music', track: 'battle' },
  { t: 'msg', name: '？？？？', text: '▓▓▓ 修復不可能 ▓▓▓\n▓▓▓ 歴史, 再構成, 開始 ▓▓▓' },
  { t: 'msg', name: 'レイラ', text: '……機械じゃない。もっと「上」から来た声。' },
  { t: 'boss', boss: 'bugboss' },
  { t: 'msg', name: '弦太郎', text: 'や、やった……？\nでも本体じゃなさそうな気がします。' },
  { t: 'msg', name: '？？？？', text: '▓▓▓ 観測対象, 確認 ▓▓▓\n▓▓▓ Ω座標, 転送完了 ▓▓▓' },
  { t: 'narr', text: '──歪みの残骸から、一枚の「鍵」が転がり出た。\n　それは静かに、青白く脈打っている。' },
  { t: 'give', item: 'chronokey', qty: 1 },
  { t: 'archive', id: 2 },
  { t: 'narr', text: '鍵が光を放ち、空間が折り畳まれる──' },
  { t: 'fade', to: 'black', ms: 600 },
  { t: 'warp', map: 'hub', x: 18, y: 6 },
  { t: 'script', id: 'hub_first' }
],

/* ===== ハブ: リミナル・フォージ ===== */
hub_first: [
  { t: 'music', track: 'hub' },
  { t: 'fade', to: 'normal', ms: 600 },
  { t: 'narr', text: '──時空の回廊「リミナル・フォージ」。\n　時代と時代の継ぎ目を観測する、境界の鍛冶場。' },
  { t: 'msg', name: 'ミナ', text: '……来たのね、レイラ。弦太郎も。', },
  { t: 'msg', name: 'ミナ', text: '私はミナ・エウレカ・アーネスト。\nこの回廊の主宰者。そして──ノスタルジアの生き残り。' },
  { t: 'msg', name: 'レイラ', text: 'ノスタルジア……E509年にアルファ・ヴェノムに襲われた。' },
  { t: 'msg', name: 'ミナ', text: 'ええ。だから、知ってるの。\n歴史が「書き換えられようとしている」ことを。' },
  { t: 'msg', name: 'ミナ', text: '10の門が示すのは、10の重要な時代。\n歪みは必ず、歴史の転換点に現れる。', },
  { t: 'msg', name: 'ミナ', text: 'みんなで歴史をなぞり、歪みを一つずつ修復しましょう。\nE318年──「企業の鎖」の時代から。', },
  { t: 'archive', id: 17 },
  { t: 'flag', key: 'hub_open', val: true },
  { t: 'openGate', n: 1 },
  { t: 'toast', text: '第一章のゲートが起動した！' },
  { t: 'narr', text: '──操作方法: 矢印/WASDで移動、Z/Enterで決定。\n端末の☰（Mボタン）でメニュー。セーブはクリスタル「S」。' }
],

hub_mina: [
  { t: 'branch', key: 'chapter', branch: {
    '0': [ { t: 'msg', name: 'ミナ', text: 'まずは第一章のゲートから。準備ができたら、いつでも。' } ],
    '1': [ { t: 'msg', name: 'ミナ', text: 'ZAMLT時代。アルファ・ケインが立った街──\n歪みの核は、塔の前にいるはず。' } ],
    '2': [ { t: 'msg', name: 'ミナ', text: 'セリアの黄金期。美しいけど、張り詰めた時代。\nコロシアムから始めて。' } ],
    '3': [ { t: 'msg', name: 'ミナ', text: '大戦の嵐。光速の砲火が歴史を焼いた時代。\n騎士団長ロナン・アーサに会って。' } ],
    '4': [ { t: 'msg', name: 'ミナ', text: 'アンダーシティ第6層。スライムの大繁殖。\n……私たちの時代の傷跡よ。' } ],
    '5': [ { t: 'msg', name: 'ミナ', text: 'エヴァトロンの要塞。AURALISが解体された夜の前夜。\nヴァイロン・デアクスに会って。' } ],
    '6': [ { t: 'msg', name: 'ミナ', text: 'Irisの時代。東大陸ヴァーミリオン。\nIRIS第1位の本人が、待っているはず。' } ],
    '7': [ { t: 'msg', name: 'ミナ', text: 'ノスタルジア……私の故郷。\nゴールデン・ヴェノム、絶対に逃さない。' } ],
    '8': [ { t: 'msg', name: 'ミナ', text: 'Tier Δ、美咲が丘。「普通の日常」の世界。\n歪みは日常のど真ん中に潜んでいる。' } ],
    '9': [ { t: 'msg', name: 'ミナ', text: 'Trap Dungeon。測定不能の迷宮。\n深く潜るほど、「測定上限」を超えた何かに会うわ。' } ],
    '10': [ { t: 'msg', name: 'ミナ', text: 'オメガの回廊。高次元領域。\n……これが、最後の門。行ってらっしゃい。' } ],
    '11': [ { t: 'msg', name: 'ミナ', text: '歴史は、ちゃんと続いている。\nありがとう、そして──おかえりなさい。' } ]
  } }
],

hub_gentaro: [
  { t: 'msg', name: '弦太郎', text: 'ここ、すごく落ち着くんですよね。\n……修行にも、お昼寝にも最適です。' }
],

shop_kate: [
  { t: 'msg', name: 'K・パットン', text: 'いらっしゃい。リミナル・フォージ正規店、K-ショップよ。', },
  { t: 'shop', shop: 'chapter' }
],

inn_lillie: [
  { t: 'msg', name: 'リリー', text: '回復施設「L-リカバリー」。全快10 nトークンでどう？', },
  { t: 'choice', options: [
    { text: '休む（10 nTG）', script: 'inn_stay' },
    { text: 'やめておく', script: 'inn_no' }
  ] }
],

inn_stay: [
  { t: 'branch', cond: 'tg10', then: [
    { t: 'tg', amount: -10 },
    { t: 'fade', to: 'black', ms: 500 },
    { t: 'heal' },
    { t: 'wait', ms: 700 },
    { t: 'fade', to: 'normal', ms: 500 },
    { t: 'msg', name: 'リリー', text: 'はい、全快。感情の炎は、ちゃんと命を燃やすわ。' },
    { t: 'sfx', name: 'heal' }
  ], else: [
    { t: 'msg', name: 'リリー', text: 'あら、nトークンが足りないわ。お散でも稼いできて。' }
  ] }
],

inn_no: [
  { t: 'msg', name: 'リリー', text: 'そう。無理は禁物よ。……でも、無理するタイプね、あなたたち。' }
],

/* ===== 第一章 ===== */
gate_go_1: [
  { t: 'card', num: '第一章', name: '企業の鎖', sub: 'E318 ─ ZAMLT時代 ─ ギガポリス' },
  { t: 'archive', id: 3 },
  { t: 'fade', to: 'black', ms: 500 },
  { t: 'warp', map: 'ch1', x: 4, y: 24 },
  { t: 'fade', to: 'normal', ms: 500 },
  { t: 'music', track: 'town' },
  { t: 'narr', text: '──E318年。ZAMLTが全階層を管理する時代。\n　低階層出身の王者・アルファ・ケインが、解放の狼煙を上げようとしていた。' }
],

ch1_tower_intro: [
  { t: 'msg', name: '弦太郎', text: 'あれが……ZAMLTセントラル・タワー。\n執行機体が、門を守ってます。' },
  { t: 'msg', name: 'レイラ', text: '私の時代より100年前。\nでも、空気の重さは同じ。歴史って、繰り返すんだね。' }
],

boss_executor: [
  { t: 'music', track: 'boss' },
  { t: 'msg', name: 'エグゼキューター', text: '警告。当区域は ZAMLT 管轄第7区。\n無許可の生命体は、執行対象。' },
  { t: 'msg', name: 'レイラ', text: 'へえ、ちゃんとした「鎖」じゃない。\nなら──粉砕対象ってことで。' },
  { t: 'boss', boss: 'executor' },
  { t: 'music', track: 'victory' },
  { t: 'msg', name: '弦太郎', text: '勝った……！\nこの時代の歪み、修復できたんですか？' },
  { t: 'msg', name: 'ミナ', text: 'ええ、観測値が戻ってきた。\nここからの歴史は、ちゃんと「ある」わ。' },
  { t: 'archive', id: 6 },
  { t: 'fade', to: 'black', ms: 600 },
  { t: 'warp', map: 'hub', x: 3, y: 4 },
  { t: 'fade', to: 'normal', ms: 600 },
  { t: 'music', track: 'hub' },
  { t: 'join', who: 'mina' },
  { t: 'toast', text: 'ミナ が仲間に加わった！' },
  { t: 'msg', name: 'ミナ', text: '第一章、修復完了。\n次は「黄金の皇帝」──セリアの時代よ。' },
  { t: 'flag', key: 'chapter', val: 1 },
  { t: 'openGate', n: 2 },
  { t: 'toast', text: '第二章のゲートが起動した！' },
  { t: 'clearAuto' }
],

/* ===== 第二章 ===== */
gate_go_2: [
  { t: 'card', num: '第二章', name: '黄金の皇帝', sub: 'E340 ─ セリア黄金期 ─ セリノポリス' },
  { t: 'archive', id: 7 },
  { t: 'fade', to: 'black', ms: 500 },
  { t: 'warp', map: 'ch2', x: 4, y: 25 },
  { t: 'fade', to: 'normal', ms: 500 },
  { t: 'music', track: 'town' },
  { t: 'narr', text: '──E340年。ギガポリスは「セリノポリス」と改名された。\n　新次元皇帝セリアの黄金期。大通りは金と活気に満ちている。' }
],

boss_titanrex: [
  { t: 'music', track: 'boss' },
  { t: 'msg', name: '司会', text: '決勝、開始！挑戦者チームの名前は……「時代の修復屋」！', },
  { t: 'msg', name: 'レイラ', text: 'コロシアムは知ってる。\n何度も立った舞台。その真ん中で、純粋に強い奴と殴り合う。', },
  { t: 'boss', boss: 'titanrex' },
  { t: 'music', track: 'victory' },
  { t: 'msg', name: '司会', text: '勝、勝者決定！！ 挑戦者チーム、優勝だ！！' },
  { t: 'msg', name: '？？？？', text: '──いい試合だった。', },
  { t: 'msg', name: 'セリア', text: '私の黄金期に、時を越えた挑戦者とは。\nレイラ・ヴィレル・ノヴァ。冷凍保存の「Pink Voltage」ね。' },
  { t: 'msg', name: 'レイラ', text: 'セリア……！新次元皇帝。\n歪みを狩ってる私たちを、どうするの？' },
  { t: 'msg', name: 'セリア', text: '利用するわ。\n歪みは私の帝国の欠陥だ。修復屋なら、都合がいい。', },
  { t: 'msg', name: 'セリア', text: '試練を与える。私と、やってみなさい。\n勝てば情報を与えるし……負けても、命までは取らない。' },
  { t: 'boss', boss: 'celia' },
  { t: 'music', track: 'victory' },
  { t: 'msg', name: 'セリア', text: '……いい腕ね。341戦316勝の名は、伊達じゃない。', },
  { t: 'msg', name: 'セリア', text: '教えてあげる。歪みの根源は「高次元」。E16の歴史に触れたくてたまらない、貪欲な神話級の存在よ。', },
  { t: 'msg', name: 'セリア', text: '疑うなら、回廊で「回」を重視することね。\n……次に会う時は、味方か敵か、決めておきなさい。' },
  { t: 'archive', id: 7 },
  { t: 'fade', to: 'black', ms: 600 },
  { t: 'warp', map: 'hub', x: 6, y: 4 },
  { t: 'fade', to: 'normal', ms: 600 },
  { t: 'music', track: 'hub' },
  { t: 'join', who: 'jen' },
  { t: 'toast', text: 'ジェン が仲間に加わった！' },
  { t: 'msg', name: 'ジェン', text: '遅くなった。ヴァロリアの統治を、後任に委ねてきた。', },
  { t: 'msg', name: 'ジェン', text: 'ジェン。歴史の「看守」をやらせてもらう。\n弱さは強さ、強さは弱さ──行こう、修復屋の仲間たち。' },
  { t: 'flag', key: 'chapter', val: 2 },
  { t: 'openGate', n: 3 },
  { t: 'toast', text: '第三章のゲートが起動した！' },
  { t: 'clearAuto' }
],

/* ===== 第三章 ===== */
gate_go_3: [
  { t: 'card', num: '第三章', name: '大戦の嵐', sub: 'E375 ─ アポロン・ドミニオン大戦' },
  { t: 'archive', id: 8 },
  { t: 'fade', to: 'black', ms: 500 },
  { t: 'warp', map: 'ch3', x: 4, y: 26 },
  { t: 'fade', to: 'normal', ms: 500 },
  { t: 'music', track: 'dungeon' },
  { t: 'narr', text: '──E375年。アポロン・ドミニオン大戦の戦線。\n　砂塵と鉄の匂い。地平線には、焼けた首都の影。' }
],

ch3_pulse: [
  { t: 'music', track: 'boss' },
  { t: 'narr', text: '──空が、二つに割れた。', },
  { t: 'msg', name: '通信兵', text: 'G4ファントムパルス、着弾まで30秒!!\n全員伏せろ──!!!', },
  { t: 'sfx', name: 'shake' },
  { t: 'wait', ms: 900 },
  { t: 'sfx', name: 'thunder' },
  { t: 'narr', text: '──白光。音が死に、世界が振動する。\n　光速の砲火が、歴史そのものを焼き改めた。', },
  { t: 'msg', name: 'ジェン', text: 'これが……大戦。「正しい歴史」には、こうした夜が何千とある。', },
  { t: 'msg', name: 'ミナ', text: 'だから、歪みはここに来た。\n焼け跡の記憶は、高次元にとって一番「美味しい」の。' },
  { t: 'music', track: 'dungeon' }
],

boss_ronan: [
  { t: 'music', track: 'boss' },
  { t: 'msg', name: 'ロナン・アーサ', text: 'アポロン騎士団長、ロナン・アーサ。\nこの戦で堕ちる定めと知りつつ──今日も、剣を置かない。', },
  { t: 'msg', name: 'ロナン・アーサ', text: '時の旅人よ。歴史を戻したいなら、私を越えてみせろ。\nそれが、この時代への礼儀だ。', },
  { t: 'boss', boss: 'ronan' },
  { t: 'music', track: 'victory' },
  { t: 'msg', name: 'ロナン・アーサ', text: 'いい剣……いや、いい仲間だ。\n団長として、最後の仕事を一つ。', },
  { t: 'msg', name: 'ロナン・アーサ', text: '歪みの主は「回廊」を狙っている。歴史の継ぎ目──お前たちの足元だ。', },
  { t: 'msg', name: 'ロナン・アーサ', text: '行け。私はここで、騎士の名に恥じない終わり方をするだけだ。', },
  { t: 'msg', name: 'ジェン', text: '……英雄とは、こういう者のことだね。', },
  { t: 'archive', id: 8 },
  { t: 'fade', to: 'black', ms: 600 },
  { t: 'warp', map: 'hub', x: 9, y: 4 },
  { t: 'fade', to: 'normal', ms: 600 },
  { t: 'music', track: 'hub' },
  { t: 'msg', name: 'ミナ', text: '第三章、修復完了。\n次は……私たちの時代の傷、「スライム危機」。' },
  { t: 'flag', key: 'chapter', val: 3 },
  { t: 'openGate', n: 4 },
  { t: 'toast', text: '第四章のゲートが起動した！' },
  { t: 'clearAuto' }
],

/* ===== 第四章 ===== */
gate_go_4: [
  { t: 'card', num: '第四章', name: 'スライム危機', sub: 'E385 ─ アンダーシティ第6層' },
  { t: 'archive', id: 9 },
  { t: 'fade', to: 'black', ms: 500 },
  { t: 'warp', map: 'ch4', x: 4, y: 26 },
  { t: 'fade', to: 'normal', ms: 500 },
  { t: 'music', track: 'dungeon' },
  { t: 'narr', text: '──E385年。アンダーシティ第6層。\n　配管から漏れる緑色の粘液。高次元の生態が、下層を飲み込み始めている。' }
],

ch4_join_ayaka: [
  { t: 'join', who: 'ayaka' },
  { t: 'toast', text: 'アヤカ が仲間に加わった！' },
  { t: 'msg', name: 'アヤカ', text: 'レイラ！久しぶり！共闘4戦4勝の、あの伝説をね。', },
  { t: 'msg', name: 'レイラ', text: 'アヤカ！ここにいたんだ。', },
  { t: 'msg', name: 'アヤカ', text: 'スライム・コアは私の管轄。\nでも……奥にいる「本物」は、私一人じゃ狩りきれない。', },
  { t: 'msg', name: 'アヤカ', text: '行こう。二人で狩れば、負けなしんだから。' }
],

boss_slimecore: [
  { t: 'music', track: 'boss' },
  { t: 'msg', name: 'アヤカ', text: 'これが汚染核──スライム・コア！\n核を壊せば、蔓延は止まる！', },
  { t: 'boss', boss: 'slimecore' },
  { t: 'music', track: 'victory' },
  { t: 'msg', name: '弦太郎', text: '止まった……下層の悲鳴が、止まりました。', },
  { t: 'msg', name: 'アヤカ', text: '……いや、まだよ。\n核の背後、「深層」から何かが来てる。', },
  { t: 'msg', name: 'レイラ', text: '高次元の……本物。' }
],

boss_slimewoman: [
  { t: 'music', track: 'boss' },
  { t: 'sfx', name: 'bossroar' },
  { t: 'msg', name: 'スライム・ウーマン', text: 'ぁ……やっと、お隔たり。3次元の、もどかしい世界。', },
  { t: 'msg', name: 'スライム・ウーマン', text: 'ポータルが開いている間だけ、私はここに居られる。\nだから──その間に、できる限り、観察させて頂戴。', },
  { t: 'msg', name: 'ミナ', text: '高次元射影体……！\n本体を倒すことはできない。でも、歴史から「追い出す」ことはできる！', },
  { t: 'boss', boss: 'slimewoman' },
  { t: 'music', track: 'victory' },
  { t: 'msg', name: 'スライム・ウーマン', text: 'ぁ……良い、観察だった。また、ね。', },
  { t: 'narr', text: '──射影体は、静かに粒子となって上へ昇っていった。', },
  { t: 'msg', name: 'レイラ', text: '「またね」じゃないよ。\nこの時代は、私たちが守る。' },
  { t: 'archive', id: 9 },
  { t: 'fade', to: 'black', ms: 600 },
  { t: 'warp', map: 'hub', x: 12, y: 4 },
  { t: 'fade', to: 'normal', ms: 600 },
  { t: 'music', track: 'hub' },
  { t: 'msg', name: 'ミナ', text: '第四章、修復完了。\n……でも、警告よ。E400年──エヴァトロンの夜が来る。', },
  { t: 'flag', key: 'chapter', val: 4 },
  { t: 'openGate', n: 5 },
  { t: 'toast', text: '第五章のゲートが起動した！' },
  { t: 'clearAuto' }
],

/* ===== 第五章 ===== */
gate_go_5: [
  { t: 'card', num: '第五章', name: '暗黒の時代', sub: 'E400 ─ エヴァトロン支配' },
  { t: 'archive', id: 10 },
  { t: 'fade', to: 'black', ms: 500 },
  { t: 'warp', map: 'ch5', x: 4, y: 26 },
  { t: 'fade', to: 'normal', ms: 500 },
  { t: 'music', track: 'dungeon' },
  { t: 'narr', text: '──E400年。エヴァトロンがE16を占領した。\n　惑星の名は勝手に「Evapolis」と改称され、AURALISは解体された。', }
],

ch5_dark_intro: [
  { t: 'narr', text: '──要塞の回廊に、拡声の声が響く。', },
  { t: 'msg', name: 'アナウンス', text: '通達。反統合組織 AURALIS の解体を完了した。\n創設者 K・パットン、L・ステイナーを逮捕。', },
  { t: 'msg', name: 'ジェン', text: '歴史の事実は、変えられない。\nでも──見て見ぬふりも、しない。', },
  { t: 'msg', name: 'レイラ', text: '……この先の未来で、私は冷凍保存される。\nエヴァトロンに捕まりたくないから。', },
  { t: 'msg', name: 'レイラ', text: 'だからこそ、この時代のことは知ってる。\n統治者ヴァイロン・デアクス──ここにいる。' }
],

ch5_join_myu: [
  { t: 'join', who: 'myu' },
  { t: 'toast', text: 'ミュ が仲間に加わった！' },
  { t: 'msg', name: 'ミュ', text: '……ミュだ。Trap Dungeon 最深部の記録を持つ、探査の英雄。' },
  { t: 'msg', name: 'ミュ', text: 'エヴァトロンの要塞構造、すでに解析済みだ。\n内郭ゲートは北。番機グリム・ダルゴスを落とせば開く。' },
  { t: 'msg', name: 'レイラ', text: '頼もしいね。……一緒に行こう、ミュ。' }
],

boss_dalgos: [
  { t: 'music', track: 'boss' },
  { t: 'msg', name: 'グリム・ダルゴス', text: '警告。Evapolis の空を飛ぶもの、所有者あり。', },
  { t: 'msg', name: 'ミュ', text: '重装甲。攻略ルートは……翼下の放熱板、1点のみ。', },
  { t: 'boss', boss: 'dalgos' },
  { t: 'music', track: 'victory' },
  { t: 'msg', name: 'ミュ', text: '……いい動きだった。深層への鍵が開いた。' }
],

boss_vaeron: [
  { t: 'music', track: 'boss' },
  { t: 'msg', name: 'ヴァイロン・デアクス', text: 'よくぞ来た、時の拾い物たち。', },
  { t: 'msg', name: 'ヴァイロン・デアクス', text: '私はこの星を「Evapolis」と呼ぶ。名前を与える者だけが、支配者だ。', },
  { t: 'msg', name: 'レイラ', text: 'その名前で、75年分の夜があった。\nAURALISの二人、多くの仲間が消された。', },
  { t: 'msg', name: 'ヴァイロン・デアクス', text: '歴史は勝者が書く。お前たちは……負けた側だ。', },
  { t: 'boss', boss: 'vaeron' },
  { t: 'music', track: 'victory' },
  { t: 'msg', name: 'ヴァイロン・デアクス', text: '……なるほど。歴史を変えない「修復屋」か。\n私の書いた夜も、消さずに持ち帰る、と。', },
  { t: 'msg', name: 'ミュ', text: '消さない。忘れない。\nだから、繰り返さない。', },
  { t: 'archive', id: 10 },
  { t: 'fade', to: 'black', ms: 600 },
  { t: 'warp', map: 'hub', x: 15, y: 4 },
  { t: 'fade', to: 'normal', ms: 600 },
  { t: 'music', track: 'hub' },
  { t: 'msg', name: 'ミナ', text: '第五章、修復完了。\n次は復興の時代──Irisの時代。東大陸クレセントよ。', },
  { t: 'flag', key: 'chapter', val: 5 },
  { t: 'openGate', n: 6 },
  { t: 'toast', text: '第六章のゲートが起動した！' },
  { t: 'clearAuto' }
],

/* ===== 第六章 ===== */
gate_go_6: [
  { t: 'card', num: '第六章', name: 'Irisの時代', sub: 'E490 ─ 東大陸クレセント ─ ヴァーミリオン' },
  { t: 'archive', id: 11 },
  { t: 'fade', to: 'black', ms: 500 },
  { t: 'warp', map: 'ch6', x: 4, y: 26 },
  { t: 'fade', to: 'normal', ms: 500 },
  { t: 'music', track: 'town' },
  { t: 'narr', text: '──E490年。エヴァトロン崩壊から15年。\n　東大陸クレセントではIRISランキングが秩序を定める。第1位の名は、ヴァーミリオン。' }
],

ch6_join_iris: [
  { t: 'join', who: 'iris' },
  { t: 'toast', text: 'アイリス が仲間に加わった！' },
  { t: 'msg', name: 'アイリス', text: '取ったわ、修復屋。私の青い糸は、時代の歪みにも届くの。', },
  { t: 'msg', name: 'アイリス', text: 'フィオナは北の広場。ブルーローズ第2位が、何かを待ってる。\n……行きましょう。私を楽しませて。' }
],

boss_fiona: [
  { t: 'music', track: 'boss' },
  { t: 'msg', name: 'フィオナ', text: 'あら、IRIS第1位と……お世辞にも「現役」とは言えない顔ね。', },
  { t: 'msg', name: 'フィオナ', text: 'この歪み、私が頂く。ランキングを書き換える最新のショックだわ。', },
  { t: 'msg', name: 'アイリス', text: 'Blue Wire、出しなさい。……今度は、私が勝つ。', },
  { t: 'boss', boss: 'fiona' },
  { t: 'music', track: 'victory' },
  { t: 'msg', name: 'フィオナ', text: '……負けた。でも、満足ね。こういう「予想外」が、戦いの醍醐味だもの。', },
  { t: 'msg', name: 'アイリス', text: '第2位の誇り、受け取ったわ。', },
  { t: 'archive', id: 11 },
  { t: 'fade', to: 'black', ms: 600 },
  { t: 'warp', map: 'hub', x: 21, y: 4 },
  { t: 'fade', to: 'normal', ms: 600 },
  { t: 'music', track: 'hub' },
  { t: 'msg', name: 'ミナ', text: '第六章、修復完了。\n……次は、私の故郷の章になるわ。覚悟して。', },
  { t: 'flag', key: 'chapter', val: 6 },
  { t: 'openGate', n: 7 },
  { t: 'toast', text: '第七章のゲートが起動した！' },
  { t: 'clearAuto' }
],

/* ===== 第七章 ===== */
gate_go_7: [
  { t: 'card', num: '第七章', name: '金色の粛清', sub: 'E509 ─ ノスタルジア・コロニー' },
  { t: 'archive', id: 12 },
  { t: 'fade', to: 'black', ms: 500 },
  { t: 'warp', map: 'ch7', x: 4, y: 25 },
  { t: 'fade', to: 'normal', ms: 500 },
  { t: 'music', track: 'dungeon' },
  { t: 'narr', text: '──E509年。ノスタルジア・コロニー。\n　金色の紋章が町を焼いた夜の、その直後。' }
],

boss_goldenvenom: [
  { t: 'music', track: 'boss' },
  { t: 'msg', name: 'ゴールデン・ヴェノム', text: '……生存者を発見。粛清対象に追加します。', },
  { t: 'msg', name: 'ミナ', text: '私は「生存者」なんかじゃない。証人よ。\n金色の紋章の下で焼かれた、すべての名前の、証人。', },
  { t: 'msg', name: 'ゴールデン・ヴェノム', text: '記録は消去されます。', },
  { t: 'msg', name: 'ミナ', text: 'じゃあ、私が全部覚えている。\nそして──これからは、歴史があなたを覚えるわ。', },
  { t: 'boss', boss: 'goldenvenom' },
  { t: 'music', track: 'victory' },
  { t: 'msg', name: 'ミナ', text: '……終わった。', },
  { t: 'msg', name: 'レイラ', text: 'うん。……帰ろう、ミナ。歴史は、ちゃんと続いてる。', },
  { t: 'archive', id: 12 },
  { t: 'fade', to: 'black', ms: 600 },
  { t: 'warp', map: 'hub', x: 24, y: 4 },
  { t: 'fade', to: 'normal', ms: 600 },
  { t: 'music', track: 'hub' },
  { t: 'msg', name: 'ミナ', text: '第七章、修復完了。', },
  { t: 'msg', name: 'カステリア', text: '（通信）探したわよ、次元跳躍の同類さん！\n面白い世界に到着しちゃった……次は「私の世界」に来て。', },
  { t: 'flag', key: 'chapter', val: 7 },
  { t: 'openGate', n: 8 },
  { t: 'toast', text: '第八章のゲートが起動した！' },
  { t: 'clearAuto' }
],

/* ===== 第八章 ===== */
gate_go_8: [
  { t: 'card', num: '第八章', name: '次元の彼方', sub: 'AD2026 ─ Tier Δ ─ 美咲が丘' },
  { t: 'archive', id: 13 },
  { t: 'fade', to: 'black', ms: 500 },
  { t: 'warp', map: 'ch8', x: 4, y: 25 },
  { t: 'fade', to: 'normal', ms: 500 },
  { t: 'music', track: 'town' },
  { t: 'narr', text: '──AD2026年。Tier Δ。「私たちの世界」。\n　美咲が丘。通学路、コンビニ、放課後の匂い。歪みは、日常のど真ん中にいる。' }
],

ch8_join_casteria: [
  { t: 'join', who: 'casteria' },
  { t: 'toast', text: 'カステリア が仲間に加わった！' },
  { t: 'msg', name: 'カステリア', text: '遅い！段取り悪いわ、時代の修復屋。', },
  { t: 'msg', name: 'カステリア', text: 'ここ美咲が丘の歪みは「憑依」タイプ。\n同級生の赤津くん──いまはケンじゃない、何か別のものが使ってる。', },
  { t: 'msg', name: 'ミナ', text: 'Dominions の残滓……？\n高次元が日常に紛れるなら、ここが一番都合がいいものね。' }
],

boss_possessed: [
  { t: 'music', track: 'boss' },
  { t: 'msg', name: 'ポゼスド・ケン', text: '……かた、い、です……あ、たま……を……く、れ……', },
  { t: 'msg', name: 'カステリア', text: '本人の声が残ってる！\n殴るだけじゃダメ、憑依の「核」を引き剥がす！', },
  { t: 'boss', boss: 'possessed' },
  { t: 'music', track: 'victory' },
  { t: 'narr', text: '──少年は、その場に静かに倒れ込んだ。\n　そして、普通に「目を覚ました」。', },
  { t: 'msg', name: '赤津', text: '……あれ？ここ、体育館裏……？\nえ、授業始まってるんですけど！', },
  { t: 'msg', name: 'カステリア', text: '……よかった。日常は、ちゃんと戻ってくる。', },
  { t: 'archive', id: 13 },
  { t: 'fade', to: 'black', ms: 600 },
  { t: 'warp', map: 'hub', x: 27, y: 4 },
  { t: 'fade', to: 'normal', ms: 600 },
  { t: 'music', track: 'hub' },
  { t: 'msg', name: 'ミナ', text: '第八章、修復完了。残るは「Trap Dungeon」と──最後の門。', },
  { t: 'flag', key: 'chapter', val: 8 },
  { t: 'openGate', n: 9 },
  { t: 'toast', text: '第九章のゲートが起動した！' },
  { t: 'clearAuto' }
],

/* ===== 第九章 ===== */
gate_go_9: [
  { t: 'card', num: '第九章', name: 'Trap Dungeon', sub: 'E522 ─ 検証的迷宮' },
  { t: 'archive', id: 14 },
  { t: 'fade', to: 'black', ms: 500 },
  { t: 'warp', map: 'trap1', x: 4, y: 26 },
  { t: 'fade', to: 'normal', ms: 500 },
  { t: 'music', track: 'dungeon' },
  { t: 'narr', text: '──Trap Dungeon。「測定」でできた迷宮。\n　深く潜るほど、存在は「上限」を問われ始める。' }
],

boss_minotaur: [
  { t: 'music', track: 'boss' },
  { t: 'msg', name: 'ミノタウロス', text: '……お前たちの「測定値」を聞こうか。', },
  { t: 'msg', name: 'ミュ', text: 'Lv230。私の記録では、第1層の主。\n──でも、記録は過去のもの。今は、越える側だ。', },
  { t: 'boss', boss: 'minotaur' },
  { t: 'music', track: 'victory' },
  { t: 'msg', name: 'ミュ', text: '最深部への通路が開いた。行こう。\n……静かにして、聞いてみて。', },
  { t: 'narr', text: '──迷宮の底から、山のような「算段」が返ってくる。\n　測定上限Lv1000を超える、何かの呼吸。' }
],

boss_abyssreais: [
  { t: 'music', track: 'boss' },
  { t: 'msg', name: 'アビサルレイス', text: 'ようこそ、奈落の司祭堂へ。生け贄の座標、あ、あなたがた……', },
  { t: 'msg', name: 'アイリス', text: '司祭の前で不敬よ。Blue Wireで、口を縫いましょうか。', },
  { t: 'boss', boss: 'abyssreais' },
  { t: 'music', track: 'victory' },
  { t: 'msg', name: 'ミナ', text: 'これで、第九章の歪みは……終了。', },
  { t: 'narr', text: '──最深部の「門」が、ゆっくりと閉じていく。\n　だが、壁の一枚にだけ、まだ微かな裂け目が。' },
  { t: 'archive', id: 14 },
  { t: 'fade', to: 'black', ms: 600 },
  { t: 'warp', map: 'hub', x: 30, y: 4 },
  { t: 'fade', to: 'normal', ms: 600 },
  { t: 'music', track: 'hub' },
  { t: 'msg', name: 'ミナ', text: '第九章、修復完了。\n……最後よ。Tier Ω──「オメガの回廊」。', },
  { t: 'flag', key: 'chapter', val: 9 },
  { t: 'openGate', n: 10 },
  { t: 'toast', text: '終章のゲートが起動した！' },
  { t: 'clearAuto' }
],

hidden_succubus: [
  { t: 'music', track: 'boss' },
  { t: 'sfx', name: 'gate' },
  { t: 'narr', text: '──裂け目の奥から、深い紫色の光。\n　そして、測定器が数字を出力し続けて破裂する。', },
  { t: 'msg', name: '？？？？', text: 'おはよう、下界の勇者さんたち。\n私の「測定値」、気にならない？', },
  { t: 'msg', name: 'ミュ', text: '……Lv1008。\n測定上限を超えている。逃げるなら、今だ。', },
  { t: 'msg', name: '？？？？', text: '逃げてもいいけれど。\nここまで来たなら──私と遊んでいかない？', },
  { t: 'choice', options: [
    { text: '挑む（高難度）', script: 'succubus_fight' },
    { text: '今は引く', script: 'succubus_leave' }
  ] }
],

succubus_fight: [
  { t: 'msg', name: 'ミュ', text: '……行こう。上限は、超えるためにある。', },
  { t: 'boss', boss: 'succubus' },
  { t: 'music', track: 'victory' },
  { t: 'msg', name: '？？？？', text: '……勝っちゃった。すごい、すごーい。\nこの深さまで来た修復屋の名前、ちゃんと覚えたわ。', },
  { t: 'msg', name: '？？？？', text: 'その力なら……あの「回廊」の主とも、やっていけると思う。', },
  { t: 'give', item: 'elixir', qty: 2 },
  { t: 'toast', text: 'Lv1008の遺物を手に入れた！（エリクシル×2）' }
],

succubus_leave: [
  { t: 'msg', name: '？？？？', text: 'ふふ、賢明ね。じゃあ、続きはまた今度。', },
  { t: 'narr', text: '──裂け目は、ゆっくりと閉じた。' }
],

/* ===== 終章 ===== */
gate_go_10: [
  { t: 'card', num: '終章', name: 'オメガの回廊', sub: 'E528 ─ Tier Ω ─ 高次元領域' },
  { t: 'archive', id: 19 },
  { t: 'fade', to: 'black', ms: 500 },
  { t: 'warp', map: 'ch10', x: 4, y: 25 },
  { t: 'fade', to: 'normal', ms: 500 },
  { t: 'music', track: 'final' },
  { t: 'narr', text: '──Tier Ω。8〜11次元の高次元領域。\n　歴史の継ぎ目すべてが、ここに綴じられている。' }
],

boss_omega: [
  { t: 'music', track: 'boss' },
  { t: 'msg', name: 'オメガ＝ユリシス', text: '……到来を、待っていた。修復屋、八人。', },
  { t: 'msg', name: 'オメガ＝ユリシス', text: '歴史とは「書き換え可能な下書き」だ。\nEVILS連合の怨念とともに、私は総てを統合する。', },
  { t: 'msg', name: 'レイラ', text: '歴史は下書きじゃない。\n下層で働いた人たち、大戦で堕ちた人たち──全部、確かに「あった」。', },
  { t: 'msg', name: 'オメガ＝ユリシス', text: 'では、確かめてみせろ。', },
  { t: 'boss', boss: 'omega' },
  { t: 'music', track: 'victory' },
  { t: 'msg', name: 'オメガ＝ユリシス', text: '……統合、失敗。\nならば──「君たちが正しい」のか。', },
  { t: 'msg', name: 'オメガ＝ユリシス', text: 'だが、私の上に「彼女」がいる。\n……狂気の女神。DIANA。', },
  { t: 'msg', name: 'ミナ', text: 'そう、最後の扉の奥にいる。\n1400年前に世界を征服した──初代DIANA。' }
],

boss_diana: [
  { t: 'music', track: 'final' },
  { t: 'narr', text: '──回廊の最奥。時間が、ゆっくりと渦を巻く。', },
  { t: 'msg', name: 'DIANA', text: 'よく来たね、小さな修復屋さんたち。', },
  { t: 'msg', name: 'DIANA', text: '私はね、「歴史」が気に入らないの。\nどの時代も、どの星も──飽きるほど、似たような物語でしょう？', },
  { t: 'msg', name: 'DIANA', text: 'だから書き換える。何度でも。\n1400年前も、E528年も、あなたたちの今日も。', },
  { t: 'msg', name: 'レイラ', text: '飽きたら、違うものを見に行けばいい。\nそれでも「続けたい」って思うのが──歴史なんだよ。', },
  { t: 'msg', name: 'ミナ', text: 'リミナル・フォージの全観測記録、接続します。\n私たちが見てきた「確かな歴史」、全部持ってきてあげる。', },
  { t: 'msg', name: 'DIANA', text: '……いいわ。じゃあ、その「確かさ」を見せてみて。', },
  { t: 'boss', boss: 'diana' },
  { t: 'music', track: 'victory' },
  { t: 'wait', ms: 700 },
  { t: 'script', id: 'epilogue' }
],

epilogue: [
  { t: 'fade', to: 'black', ms: 900 },
  { t: 'music', track: 'ending' },
  { t: 'card', num: 'EPILOGUE', name: '星々の交響曲は続く', sub: 'E528 ─ 諸世界連邦サミット' },
  { t: 'narr', text: '──E528年。諸世界連邦サミット。\n　8大文明圏とE16の代表が、歴史の「正しさ」を再確認した。\n　歪みは修復され、時空の回廊は静かに眠りにつく。', },
  { t: 'narr', text: 'レイラたちは、AURALIS 2期のエースとして今日も戦い続ける。\n弦太郎は師範代となり、ミナは次の観測を始めた。\nジェンはヴァロリアに帰り、ミュは次の最深部へ。\nアヤカはハンター業を続け、アイリスは第1位のまま。\nカステリアは──今日も、どこかの世界に跳んでいる。', },
  { t: 'narr', text: '歴史は正しく「ある」。\nだから、未来は初めて希望を持つ。', },
  { t: 'msg', name: 'ミナ', text: '……報告、完了。\nみんな、ありがとう。そして──おかえりなさい。', },
  { t: 'archive', id: 20 },
  { t: 'flag', key: 'game_clear', val: true },
  { t: 'flag', key: 'chapter', val: 11 },
  { t: 'warp', map: 'hub', x: 18, y: 18 },
  { t: 'clearAuto' },
  { t: 'endgame' }
],

/* ゲームクリア後: 試練の門 */
trial_gate: [
  { t: 'msg', name: '？？？', text: '……素晴らしい。歴史を守る力、それが本物なら──', },
  { t: 'msg', name: 'セリア', text: '私と、もう一度だけ。Dimension Selia の真の力、見せてあげる。', },
  { t: 'choice', options: [
    { text: '挑む（超高難度）', script: 'trial_fight' },
    { text: 'やめておく', script: 'trial_no' }
  ] }
],

trial_fight: [
  { t: 'boss', boss: 'celiaext' },
  { t: 'music', track: 'victory' },
  { t: 'msg', name: 'セリア', text: '……ふふ。君たちなら、歴史は大丈夫ね。', },
  { t: 'give', item: 'c_iris', qty: 1 },
  { t: 'toast', text: '皇帝の証を手に入れた！（IRIS第1位の証）' }
],

trial_no: [
  { t: 'msg', name: 'セリア', text: 'そう。慌てる必要はないわ。歴史は、ちゃんと続いてるもの。' }
]
};
