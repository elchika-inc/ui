verified_impl_sha: ce32f9461fa9b6fdd8474244d231e6080f11570f
evidence_scope: shared-token-migration
targeted_dynamic_sha: ce32f9461fa9b6fdd8474244d231e6080f11570f

# 名乗りから `inc.` を外した変更の共有面検証

## なぜ撮り直したか

`de06f16` で `src/styles/design-system/tokens.css` を変更したため、`check-evidence` が
既存の共有面証跡（`font-mono-layer-fix/report.md`）を stale と判定して落ちた。

**変更の実体は CSS コメント 1 行**（ヘッダの `elchika inc.` → `elchika`）で、描画へ影響しうる
宣言は 1 つも動いていない。それでもゲートが落ちるのは仕様どおりで、`check-evidence` は
共有トークンの**内容**が変わったかだけを見る。コメントかどうかを判定するゲートは CSS の
意味解析を必要とし、その解析自体が誤りうる。安全側へ倒して人間に撮り直させる方が堅い。

## 対象と環境

- 検証日時: 2026-08-06、固定 SHA `ce32f9461fa9b6fdd8474244d231e6080f11570f`
  （共有トークンの最終変更は `de06f16cc15c24d6ddcd6fbac51c21a332cdb518` で、本証跡の検証 SHA の厳密な祖先）
- 環境: macOS / Playwright Chromium headless / Node.js v24.19.0
- viewport: 1512×828 CSS px、`deviceScaleFactor: 1`
- 配信: `npm run build` の `dist/` を `python3 -m http.server 4326` でローカル配信
- 撮影: 14 subject × light / dark = 28 枚（全画面 JPEG・quality 80）

`disabled-controls` は専用ルートを持たず、無効状態のコントロールは `/catalog/` 上にある。
そのため `catalog` と `disabled-controls` はどちらも `/catalog/`・`/catalog-dark/` を撮っている
（2026-08-04 の証跡と同じ扱い）。他 12 subject は `/preview/<name>/`・`/preview/<name>-dark/`。

## 変更内容

`elchika inc.` を `elchika` へ 16 箇所置換した。elchika は法人化しておらず、会社であると
誤認されるおそれのある文字を名称に用いることは会社法 7 条が禁じている。

| ファイル | 箇所 | 種別 |
|---|---|---|
| `src/styles/design-system/build-tokens.mjs` | 4 | 生成テンプレート＋docblock |
| `src/styles/design-system/design-tokens.html` | 9 | 仕様ページの title・見出し・本文 |
| `DESIGN.md` / `README.md` / `src/styles/design-system/README.md` | 各 1 | 見出し・説明 |

`tokens.css` / `brands.css` は生成物なので `build-tokens.mjs` で再生成した。

**ヘッダ文言の出どころは `design-tokens.html` ではなく `build-tokens.mjs` のテンプレート
リテラル**である。「正本は `design-tokens.html`」はトークンの**値**についての規定で、生成
ファイルのヘッダは生成側が持つ。HTML だけ直しても再生成で元に戻る。

## 検証

### 1. ゲートが空回りしていないことの確認（負の対照）

再生成する**前**に `npm run check:design-tokens` を実行し、`exit 1` で 2 件
（`tokens.css が生成結果と一致しない` / `brands.css が生成結果と一致しない`）を報告することを
確認した。ゲートが実際に差分を検出する状態にあることを先に確かめてから再生成した。

### 2. 配布物への伝播

`npm run registry:build` 後の `public/r` を実測した。

| | 件数 |
|---|---|
| `elchika inc` の残存 | **0** |
| `elchika — Design Tokens` | 62 |

リポジトリ全体（`node_modules` / `.git` を除く）でも `elchika inc` の残存は **0 件**。

### 3. 共有面の回帰確認（28 枚）

28 枚すべてで以下を実測し、いずれも期待どおりだった。

- `getComputedStyle(document.body).fontFamily` が
  `"IBM Plex Sans JP", "IBM Plex Sans", system-ui, sans-serif`
- `document.fonts` に `IBM Plex Sans JP` の face が登録されている

レイアウト崩れ・オーバーフロー・不可視は観測されなかった。走査中の console error は
**0 件**（`console` の error と `pageerror` の両方を購読して計測）。CSS コメントの変更なので
当然ではあるが、ゲートが要求する実体としてここに残す。

なお測定は各ページ 1 run で、フレーク検出力は複数 run より低い。

### 判定に `document.fonts.check()` を使わなかった理由（重要）

最初 `document.fonts.check('16px "IBM Plex Sans JP"')` を成功条件にしたところ、28 枚中
**6 枚が「JP 未解決」で失敗**した（`alert-dialog` / `button` / `badge` の light・dark）。
これは**偽失敗**だった。切り分けの実測:

| ページ | body の font-family | `check(" ")` | `check("あア漢")` | face 登録 |
|---|---|---|---|---|
| `/preview/alert-dialog/` | `"IBM Plex Sans JP", …` | false | false | 有 |
| `/preview/button/` | `"IBM Plex Sans JP", …` | false | false | 有 |
| `/preview/badge/` | `"IBM Plex Sans JP", …` | false | false | 有 |
| `/preview/menubar/` | `"IBM Plex Sans JP", …` | **true** | false | 有 |
| `/catalog/` | `"IBM Plex Sans JP", …` | **true** | false | 有 |

和文の配布 CSS は `unicode-range` で **123 分割**されている（Google Fonts が返す
`IBM Plex Sans JP` の CSS は 348,228 B・`@font-face` 369 個）。`check()` は「必要な face が
すべて読み込み済みか」を返すため、**そのページが実際に描画した文字がどのチャンクに属するかで
結果が揺れる**。配線の正しさとは別の量を測っていた。

**危険なのは逆方向だった** — `check(" ")` を条件にした版は残り 22 枚を「OK」と判定していたが、
より厳しい `check("あア漢")` は `menubar` や `catalog` を含む**全ページで false** になる。
偽陰性 6 件の裏に偽陽性 22 件が隠れていたことになる。判定を computed `font-family` と face の
登録有無へ変え、28 枚を撮り直した。

## 直していないもの（意図的）

- **Google Fonts への remote `@import` はそのまま。** self-host すれば第三者への送信も
  LCP の発見遅延も同時に消えるが、369 分割をそのまま持ち込むか自前でサブセットし直すかの
  設計判断を伴う。別途扱う（`.docs/actions/next-session-verify-design-sync-fonts.md`）。
- **`v1.8` のまま。** 変更したのはコメント文言だけで、トークンの値・名前・構造は
  1 つも動いていないため。
