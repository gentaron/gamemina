# GameMina

ブラウザで今すぐ遊べるネオン風ミニゲーム集（全5タイトル）。ビルド不要の純静的サイトで、**Netlifyにそのままデプロイできます。**

## 収録タイトル

| タイトル | ジャンル | 最高記録の保存単位 |
|---|---|---|
| 神経衰弱 | パズル / 記憶 | 最速クリアタイム（秒） |
| スネーク | アクション | スコア（点） |
| ブロック崩し | アクション | スコア（点） |
| 反射神経 | 反射 | 最速反応（ミリ秒） |
| 15パズル | パズル / 頭脳 | 最少移動手数（手） |

各ゲームの最高記録はブラウザの `localStorage`（キー接頭辞 `gm_best_`）に端末ごと保存されます。サーバー送信は一切ありません。

## ディレクトリ構成

```
gamemina/
├── index.html          # ハブページ（ゲーム一覧）
├── 404.html            # ネオン風カスタム404（Netlifyが自動利用）
├── netlify.toml        # Netlify設定（ヘッダー/キャッシュ/リダイレクト）
├── favicon.svg
├── css/
│   └── style.css       # 共通ネオンデザインシステム
├── js/
│   ├── sfx.js          # WebAudio効果音エンジン（外部音源ファイル不要）
│   └── hub.js          # ハブでの最高記録表示
└── games/
    ├── memory/index.html    # 神経衰弱
    ├── snake/index.html     # スネーク
    ├── breakout/index.html  # ブロック崩し
    ├── reaction/index.html  # 反射神経
    └── fifteen/index.html   # 15パズル
```

## Netlifyへのデプロイ方法

### 方法1: GitHub連携（推奨・自動デプロイ）

1. このリポジトリをGitHubにpushする
2. [Netlify](https://app.netlify.com/) にログインし「Add new site」→「Import an existing project」→「Deploy with GitHub」
3. `gentaron/gamemina` を選択
4. 設定は `netlify.toml` から自動読み込みされます：
   - **Build command**: なし（静的サイト）
   - **Publish directory**: `.`（リポジトリルート）
5. 「Deploy」をクリック → 数秒で `https://<サイト名>.netlify.app` が公開される

以降は `git push` するだけで自動的に本番へ反映されます。

### 方法2: ドラッグ&ドロップ（最速・手軽）

1. [app.netlify.com/drop](https://app.netlify.com/drop) を開く
2. このフォルダの中身を丸ごとドラッグ&ドロップ
3. 即公開（GitHub連携なしの手動更新になる点に注意）

## ローカルでの確認方法

```bash
# プロジェクトルートで
python3 -m http.server 8080
# または
npx serve .
```

`http://localhost:8080` をブラウザで開く。（絶対パス `/css/style.css` 等を使っているため、`file://` 直接オープンではなくHTTPサーバー経由で確認してください）

## 技術メモ

- 純HTML/CSS/JS。フレームワーク・ビルドツール・依存パッケージは**ゼロ**
- フォントはGoogle Fonts（Orbitron / DotGothic16 / Noto Sans JP）からCDN読み込み
- 効果音はWeb Audio APIで合成（音源ファイルなし、ミュートボタン付き）
- スマホ対応：スネークに十字キー、ブロック崩しにタッチ操作を実装
- `netlify.toml` でセキュリティヘッダー（X-Frame-Options等）とキャッシュ制御を設定済み
