verified_impl_sha: cc547672fb248eb51c45a7b972ce2ac0cefda982
evidence_scope: shared-token-migration
targeted_dynamic_sha: cc547672fb248eb51c45a7b972ce2ac0cefda982

# 幾何レイヤーの実ブラウザ検証

## 対象と環境

- 検証日: 2026-09-06
- 対象実装: `cc547672fb248eb51c45a7b972ce2ac0cefda982`
- トークン変更 commit: `56abdb762edff97b46855d5631b87b228eee4cdc`。検証対象はその後の commit である。
- 環境: macOS / Node.js v24.20.0 / Playwright MCP、Chromium（Chrome 152.0.7977.76、`channel: "chrome", headless: true` を明示）
- User-Agent: `HeadlessChrome/152.0.0.0`
- viewport: 1440×900 CSS px、deviceScaleFactor: 1
- 配信方法: `npm run build:site` の成果物を `npx astro preview --host 127.0.0.1 --port 4393` で配信
- 実ポート: `4393`
- 疎通: `curl -sI http://127.0.0.1:4393/` は exit 0、HTTP 200。各対象 route の body に必要な selector があることも別途確認した。
- 最終 build: exit 0、271ページ。生成 CSS は `dist/_astro/global.DHjz_95G.css`。

## route・selector・console error

通常24枚は viewport 撮影、catalog / disabled-controls の4枚は後述の viewport タイル連結である。全28件で selector を実行時に確認し、`pageerror` 0件、横 overflow なし、`astro-dev-toolbar` 0件だった。console error は component 由来と favicon 由来を分離した。

| subject | theme | route | `preview-selectors.json` の selector | selector 件数 | console error（component / favicon） | `pageerror` | 横 overflow |
|---|---|---|---|---:|---:|---:|---|
| alert-dialog | light | `/preview/alert-dialog/` | `[data-slot="alert-dialog-content"]` | 1 | 0 / 1 | 0 | なし |
| alert-dialog | dark | `/preview/alert-dialog-dark/` | `[data-slot="alert-dialog-content"]` | 1 | 0 / 0 | 0 | なし |
| attachment | light | `/preview/attachment/` | `[data-slot="attachment-preview"]` | 1 | 0 / 0 | 0 | なし |
| attachment | dark | `/preview/attachment-dark/` | `[data-slot="attachment-preview"]` | 1 | 0 / 0 | 0 | なし |
| menubar | light | `/preview/menubar/` | `[data-slot="menubar-content"]` | 1 | 0 / 0 | 0 | なし |
| menubar | dark | `/preview/menubar-dark/` | `[data-slot="menubar-content"]` | 1 | 0 / 0 | 0 | なし |
| select | light | `/preview/select/` | `[data-slot="select-content"]` | 1 | 0 / 0 | 0 | なし |
| select | dark | `/preview/select-dark/` | `[data-slot="select-content"]` | 1 | 0 / 0 | 0 | なし |
| button | light | `/preview/button/` | `[data-slot="button"]` | 11 | 0 / 1 | 0 | なし |
| button | dark | `/preview/button-dark/` | `[data-slot="button"]` | 11 | 0 / 0 | 0 | なし |
| bubble | light | `/preview/bubble/` | `[data-slot="bubble-preview"]` | 1 | 0 / 0 | 0 | なし |
| bubble | dark | `/preview/bubble-dark/` | `[data-slot="bubble-preview"]` | 1 | 0 / 0 | 0 | なし |
| dialog | light | `/preview/dialog/` | `[data-slot="dialog-content"]` | 1 | 0 / 0 | 0 | なし |
| dialog | dark | `/preview/dialog-dark/` | `[data-slot="dialog-content"]` | 1 | 0 / 0 | 0 | なし |
| drawer | light | `/preview/drawer/` | `[data-slot="drawer-content"]` | 1 | 0 / 0 | 0 | なし |
| drawer | dark | `/preview/drawer-dark/` | `[data-slot="drawer-content"]` | 1 | 0 / 0 | 0 | なし |
| badge | light | `/preview/badge/` | `[data-slot="badge"]` | 6 | 0 / 1 | 0 | なし |
| badge | dark | `/preview/badge-dark/` | `[data-slot="badge"]` | 6 | 0 / 0 | 0 | なし |
| alert | light | `/preview/alert/` | `[data-slot="alert"]` | 2 | 0 / 0 | 0 | なし |
| alert | dark | `/preview/alert-dark/` | `[data-slot="alert"]` | 2 | 0 / 0 | 0 | なし |
| sheet | light | `/preview/sheet/` | `[data-slot="sheet-content"]` | 1 | 0 / 0 | 0 | なし |
| sheet | dark | `/preview/sheet-dark/` | `[data-slot="sheet-content"]` | 1 | 0 / 0 | 0 | なし |
| tabs | light | `/preview/tabs/` | `[data-slot="tabs"]` | 1 | 0 / 0 | 0 | なし |
| tabs | dark | `/preview/tabs-dark/` | `[data-slot="tabs"]` | 1 | 0 / 0 | 0 | なし |
| catalog | light | `/catalog/` | `[data-slot="verification-catalog"]` | 1 | 0 / 0 | 0 | なし |
| catalog | dark | `/catalog-dark/` | `[data-slot="verification-catalog"]` | 1 | 0 / 0 | 0 | なし |
| disabled-controls | light | `/catalog/` | `[data-slot="verification-catalog"]` | 1 | 0 / 0 | 0 | なし |
| disabled-controls | dark | `/catalog-dark/` | `[data-slot="verification-catalog"]` | 1 | 0 / 0 | 0 | なし |

`disabled-controls` は見本 report と同じく `catalog` の route / selector を共用する。`[disabled]` 属性を持つ要素は light / dark とも17件だった。catalog のタイル撮影時にも console error / pageerror は0件だった。favicon 404 は幾何レイヤーと無関係な配信資産の欠落として分離し、component error に加算していない。

## computed style 実測表（仕様4節5項）

Playwright で selector の先頭要素が visible になるまで待ち、`document.fonts.ready` と600msの描画待ちの後、`getComputedStyle` を呼び出した。

| route | selector | property | 期待値 | 実測値 | 判定 |
|---|---|---|---|---|---|
| `/preview/button/` | `[data-slot="button"]` 先頭 | height | `36px` | `36px` | 合格 |
| `/preview/button/` | `[data-slot="button"]` 先頭 | border-radius | `8px` | `8px` | 合格 |
| `/preview/button/` | `[data-slot="button"]` 先頭 | transition-duration | `0.12s` を含む | `0.12s` | 合格 |
| `/preview/dialog/` | `[data-slot="dialog-content"]` | border-radius | `12px` | `12px` | 合格 |
| `/preview/dialog/` | `[data-slot="dialog-content"]` | box-shadow の末尾1層 | `rgba(26, 28, 33, 0.1) 0px 12px 32px 0px` | 期待値と一致、他は透明ゼロ寸法4層 | 合格 |
| `/preview/dialog-dark/` | `[data-slot="dialog-content"]` | box-shadow の末尾1層 | `rgba(0, 0, 0, 0.55) 0px 12px 32px 0px` | 期待値と一致、他は透明ゼロ寸法4層 | 合格 |

司令塔裁定により影の合否は「末尾1層が期待値と一致し、それ以外の層はすべて完全透明かつゼロ寸法であること」とした。先頭4層は Tailwind の `--tw-inset-shadow` / `--tw-inset-ring-shadow` / `--tw-ring-offset-shadow` / `--tw-ring-shadow` の合成である。以下に生の実測文字列を省略せず残す。

### Dialog light

```text
rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(26, 28, 33, 0.1) 0px 12px 32px 0px
```

### Dialog dark

```text
rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.55) 0px 12px 32px 0px
```

Dialog / AlertDialog の `shadow-lg` 追加は、正本のモーダル向け elevation と実体の不一致を解消する司令塔裁定による。Dialog の明示 `duration-100` は維持しており、その実測は `0.1s` である。既定 transition 120ms への接続は、明示 duration を持たない Button で確認した。

## 生成 CSS の存在確認（仕様4節4項）

`CSS=dist/_astro/global.DHjz_95G.css` として各 grep を独立実行した。`grep -c` は一致行数であり、minify 済み1行 CSS 中の出現総数ではない。0件の場合の exit 1 は不在を確認できた結果として扱う。

| コマンド | exit | 件数・実体 |
|---|---:|---|
| `grep -c -- '--radius:.625rem' "$CSS"` | 1 | 0 |
| `grep -c 'rounded-lg{border-radius:var(--rounding-lg)}' "$CSS"` | 0 | 1 |
| `grep -c 'shadow-xs{' "$CSS"` | 0 | 1 |
| `grep -o 'shadow-xs{[^}]*}' "$CSS"` | 0 | 下記のとおり `var(--elevation-xs)` を含む |
| `grep -c '\.font-bold{' "$CSS"` | 1 | 0 |
| `grep -c 'h-control-md{height:var(--control-height-md)}' "$CSS"` | 0 | 1 |
| `grep -c 'transition-duration:var(--duration-fast)' "$CSS"` | 0 | 1 |

```css
shadow-xs{--tw-shadow:var(--elevation-xs);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}
```

## 負の検査（仕様4節8項・司令塔裁定）

検査対象は `src/components src/blocks src/site src/previews src/pages src/styles/global.css`。各語について `rg -n --fixed-strings -- '<語>' <検査対象>` を1コマンドずつ実行した。

| 語 | exit | 一致行数 |
|---|---:|---:|
| `ring-foreground/10` | 1 | 0 |
| `font-bold` | 1 | 0 |
| `rounded-4xl` | 1 | 0 |
| `rounded-2xl` | 1 | 0 |
| `rounded-3xl` | 1 | 0 |
| `shadow-xl` | 1 | 0 |
| `shadow-2xl`（追加確認） | 1 | 0 |
| `--radius: 0.625rem` | 1 | 0 |

`src/styles/design-system/design-tokens.html:1687` の説明文には `font-bold` が1件あるが class ではない。「系外の値を許さない」という正しい決定記録なので、司令塔裁定に従い変更せず検査対象から除いた。他の対象語は正本の説明文にも残っていない。

## 長い catalog 画像の撮影と連結

初回の `fullPage: true` 撮影は 1440×27302 JPEG の下部に先頭内容の繰返しが入り、`--disable-gpu` で再試行すると下部が白紙になった。DOM最下部へスクロールした1440×900の通常撮影では Toggle / Toggle Group / Tooltip が正しく写ることを確認した。司令塔の明示承認を受け、catalog / disabled-controls の4枚だけ viewport タイル撮影へ変更した。通常24枚の撮影方式は維持した。

1. Playwright MCP の `browser_run_code_unsafe` で headless Chromium を起動し、1440×900の viewport、deviceScaleFactor 1で対象 route を開く。
2. `document.documentElement.scrollHeight` が27302であることを確認し、0から900px刻みで `window.scrollTo` する。各タイルの実 `scrollY`、scrollHeight、横 overflow、fixed / sticky 要素の座標を取得し、`page.screenshot({type:"png", animations:"disabled", scale:"css"})` で保存する。1画像につき31タイル、合計124タイル。
3. 15300px のタイルだけ実位置が17667pxへ移動する事象を検出したため再取得した。`window.scrollTo({top:15300, behavior:"instant"})` 後に700ms待ち、最大3回で実位置が15300へ安定すること、撮影後にも同じ位置であることを確認した。他の実位置は0〜26100の900px刻み、最後のみブラウザ上限の26402である。
4. `uv run --with pillow python /tmp/geometry-stitch.py`（exit 0）で連結する。下記の要点で、各PNGをリサイズ・加筆・色補正せず、実測したY座標へ貼り付ける。最後のタイルは直前と重なる部分を上書きする。JPEGへの出力はquality 95 / subsampling 0で、JPEGエンコード以外の画素加工は行わない。

```python
canvas = Image.new("RGB", (1440, scroll_height))
covered = 0
for tile in tiles:
    image = Image.open(tile["file"])
    assert image.size == (1440, 900)
    assert tile["y"] <= covered
    canvas.paste(image, (0, tile["y"]))
    covered = max(covered, tile["y"] + 900)
assert covered == scroll_height == 27302
canvas.save(output, "JPEG", quality=95, subsampling=0)
```

連結後4枚とも高さ27302pxがDOMのscrollHeightと一致し、最下部タイルの Toggle / Toggle Group / Tooltip を目視およびDOM見出しで照合した。各タイル間に未撮影領域がないことを `covered` の検査で確認した。下部が繰り返される初回画像・白紙の再試行画像は採用していない。

### fixed / sticky 要素の位置

全31タイル・両テーマの主文書で、幅と高さを持つ fixed 要素は18個、sticky は0個だった。内訳は13個の INPUT と3個の SPAN が viewport座標 `(-1,-1)`・1×1px、残る2個の INPUT が文書座標 `(669.25,25615.609375)` / `(636.84375,25663.609375)`・10×10pxである。18個すべて `clip-path: inset(50%)` により視覚的に隠されている。後者2個のviewport上のYはスクロールに伴って減り、最下部では `-786.390625` / `-738.390625` だった。主文書に視覚的に重複する固定装飾はない。iframe 内のナビゲーションはiframeの表示領域内へ描かれるため、主文書のタイル境界で画面全体へ反復しないことを連結画像で確認した。

## JPEG の実体

| ファイル | 幅×高さ | magic bytes |
|---|---:|---|
| `2026-09-06-alert-dialog-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-alert-dialog-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-attachment-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-attachment-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-menubar-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-menubar-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-select-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-select-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-button-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-button-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-bubble-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-bubble-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-dialog-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-dialog-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-drawer-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-drawer-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-badge-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-badge-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-alert-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-alert-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-sheet-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-sheet-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-tabs-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-tabs-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-06-catalog-preview-light.jpg` | 1440×27302 | `FF D8 FF` |
| `2026-09-06-catalog-preview-dark.jpg` | 1440×27302 | `FF D8 FF` |
| `2026-09-06-disabled-controls-light.jpg` | 1440×27302 | `FF D8 FF` |
| `2026-09-06-disabled-controls-dark.jpg` | 1440×27302 | `FF D8 FF` |

## 目視結果と検証範囲

通常24枚は light / dark を並べた全画面縮小画像で確認し、catalog / disabled-controls は全高を分割した一覧と最下部画像を照合した。文字・枠・角丸・影に新たなはみ出しや欠落は観測されなかった。連結画像のblock previewはスクロールに伴って読み込まれるため、初回fullPage撮影より多くのiframe内容が写っている。

| 項目 | 測定した段階 | 範囲 |
|---|---|---|
| 正本・生成CSS・置換漏れ | 存在 | sourceとbuild出力の静的検査 |
| tokens / lint / standards / unit tests | 実行 | 終了コード・件数はレビュー記録に記載 |
| selector / console / pageerror / overflow | 実行 | 上記28件、console listenerはnavigation前に登録 |
| Button / Dialog の寸法・角丸・影・transition | 動作（computed style） | 仕様4節5項の上記6項目 |
| JPEG | 存在・実行・目視 | 28枚、magic bytes、寸法、描画内容 |

キーボード操作全般・全 props 組合せ・全部品の computed style はこの検証の対象外である。今回の主張は上表の実測範囲に限る。`check:all` / `check-evidence` / PR CI の最終結果は、画像と同時追加する本reportの不変性を保つため PR 本文と別の検証記録へ残す。
