<div align="center">

# GAMEMINA CHRONICLE ─ 星々の交響曲

**Eternal Dominion Universe をなぞる、本格ファンタジーRPG (PWA)**

*Symphony of Stars ─ A full-scale retro RPG tracing the EDU universe*

`10 CHAPTERS` · `8 PARTY MEMBERS` · `20+ BOSSES` · `OFFLINE PWA`

</div>

---

## 日本語

### 概要

**GAMEMINA CHRONICLE** は、[gentaron/edutext](https://github.com/gentaron/edutext) の世界設定 **Eternal Dominion Universe (EDU)** を舞台にした、ファイナルファンタジー風の王道ターン制RPGです。

E暦528年。歴史の継ぎ目から「歪み」が漏れ始めた世界を修復するため、レイラ率いるパーティが **時空の回廊〈リミナル・フォージ〉** から10の時代を巡る──EDUの年表（E318 → E528）をなぞる全10章+プロローグ+エピローグの長編ストーリー。

### 特徴

- **10章の長編ストーリー** ── ZAMLT時代、セリア黄金期、アポロン大戦、スライム危機、エヴァトロン暗黒時代、Irisの時代、ノスタルジア、Tier Δ（現代地球）、Trap Dungeon、オメガの回廊
- **8人のプレイアブル** ── Layla / 弦太郎 / Mina / Jen / Ayaka / Myu / Iris / Casteria（戦闘は4人、いつでも入れ替え可）
- **ロアをなぞるボス戦** ── エグゼキューター、タイタン・レクス、セリア、ロナン・アーサ、スライム・コア＆スライム・ウーマン、グリム・ダルゴス、ヴァイロン・デアクス、フィオナ、ゴールデン・ヴェノム、ポゼスド・ケン、ミノタウロスLv230、アビサルレイス、オメガ＝ユリシス、初代DIANA…
- **隠し要素** ── Lv1008サキュバス（測定上限超えの裏ボス）、クリア後のセリア戦〈Dimension Selia〉
- **アルカイブ** ── 歴史の記録を集めるロア図鑑（20項目）
- **完全生成のサウンド** ── WebAudioによるチップチューンBGM 10曲+効果音（音源ファイル不要）
- **完全オフラインPWA** ── Service Workerプリキャッシュ、インストール対応、セーブは端末内+コード書き出し

### 起動方法

[**ゲームを起動**](https://gentaron.github.io/gamemina/) ※GitHub Pages有効化後

1. ブラウザで `index.html` を開くだけ（ビルド不要）
2. 「インストール」ボタン or ブラウザメニューから **ホーム画面に追加** でアプリ化
3. 一度起動すればオフラインで完結

### 操作

| 操作 | キーボード | タッチ | ゲームパッド |
|------|-----------|--------|-------------|
| 移動 | 矢印 / WASD | 十字ボタン | 方向パッド / 左スティック |
| 決定・話す | Z / Enter / Space | Aボタン | A |
| キャンセル | X / Esc | Bボタン | B |
| メニュー | C / M / Tab | Mボタン | Start |

### 遊び方のヒント

- セーブは各地の **クリスタル「S」** またはメニューの「セーブ」から（+章クリア時に自動セーブ）
- ショップの品揃えは章の進行で拡張
- ステータス画面では戦力測定上限（Lv1000）の世界観ネタも読める
- クリア後は「試練の門」で最強ボスに挑戦できる

### ディレクトリ構成

```
gamemina/
├── index.html              # エントリ
├── manifest.webmanifest    # PWAマニフェスト
├── sw.js                   # Service Worker（オフライン）
├── css/style.css           # UIシステム
├── js/
│   ├── audio.js            # WebAudio チップチューン
│   ├── sprites.js          # ドット絵/タイル描画
│   ├── main.js             # 起動・ループ
│   ├── data/               # ゲームデータ（キャラ/敵/マップ/ストーリー）
│   └── engine/             # コア/戦闘/フィールド/メニュー/セーブ
└── icons/                  # PWAアイコン
```

### 関連リポジトリ

| Repo | 説明 |
|------|------|
| [gentaron/edutext](https://github.com/gentaron/edutext) | EDU世界観のロア原典（本作のストーリー原作） |

## English

**GAMEMINA CHRONICLE** is a Final-Fantasy-style turn-based RPG based on the **Eternal Dominion Universe (EDU)** lore from [gentaron/edutext](https://github.com/gentaron/edutext).

- 10-chapter epic tracing the EDU timeline (E318 → E528) through a time-gate hub "Liminal Forge"
- 8 playable characters (Layla, Gentaro, Mina, Jen, Ayaka, Myu, Iris, Casteria), 4 in battle
- Lore-faithful boss battles: Executor, Titan Rex, Celia, Ronan Arthur, Slime Core / Slime Woman, Grim Dalgos, Vaeron Deaxus, Fiona, Golden Venom, Possessed Ken, Minotaur Lv230, Abyssal Reais, Omega-Ulyssis, and the first DIANA
- Hidden superboss: Lv1008 Succubus / post-clear Celia duel
- Procedural chiptune (WebAudio), pixel-art rendering, zero build step
- Full offline PWA: service worker precache, installable, localStorage saves + export codes

**Play:** open `index.html` in any modern browser, or install it as a PWA. Keyboard (arrows/WASD + Z/X), touch D-pad, and gamepad are supported.

## License

[MIT](LICENSE)

---

*Original lore & characters: Eternal Dominion Universe (EDU) by gentaron*
