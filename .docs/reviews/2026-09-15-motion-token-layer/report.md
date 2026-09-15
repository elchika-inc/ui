verified_impl_sha: 865875d238b9abf3a5d518cf9e3391ce4709912f
evidence_scope: shared-token-migration
targeted_dynamic_sha: 865875d238b9abf3a5d518cf9e3391ce4709912f

# モーショントークン層の実ブラウザ検証

## 対象と環境

- 検証日: 2026-09-15。
- 検証対象: `865875d238b9abf3a5d518cf9e3391ce4709912f`（commit B）。トークン変更 commit A は `d73178ed2381e7b8748f73742301b2aa742147c2` で、B は A より後の commit。
- 成功基準: `.docs/plans/2026-09-15-motion-token-layer.md` §4。root の CSS 変数表記は後述の司令塔裁定に従う。
- 環境: macOS / Node.js v24.21.0 / Astro 7.1.6 / Playwright MCP / Chromium 153.0.8010.36。
- Chromium は `channel: "chrome", headless: true`、viewport 1440×900 CSS px、deviceScaleFactor 1 を明示した。
- User-Agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36`。
- 一時 utility probe を削除した `npm run build:site` の成果物を配信。build は exit 0、271 ページ、生成 CSS は `dist/_astro/global.Bg-ZegLv.css`。
- 起動ログと実 URL のポートはともに 4398。

```bash
npx astro preview --host 127.0.0.1 --port 4398
```

## 操作と検証手順

1. Playwright MCP の `browser_run_code_unsafe` で、渡された `page.context().browser().browserType()` から上記の headless Chromium を新規起動する。各 route の navigation 前に console と pageerror の listener を登録する。
2. `preview-selectors.json` の selector の先頭要素が visible になるまで待つ。通常 preview は `document.fonts.ready` と 600ms の描画待ちの後、selector 件数、テーマ属性、横 overflow、toolbar、必要な computed style を取得する。overlay は既存 preview の初期 open 状態を使う。
3. 通常24枚を `page.screenshot({type:"jpeg", quality:90, animations:"disabled", scale:"css"})` で撮る。
4. catalog / disabled-controls は同じ catalog route と selector を共用する。後述の viewport タイル撮影で全高を取得し、PNG の画素を実測した座標へ連結して JPEG にする。
5. JPEG 28枚の magic bytes と寸法を Pillow で独立検査する。通常24枚の縮小一覧、catalog の全高分割一覧と最下部画像を目視する。

## route・selector・console error

全28件で HTTP 200 と下表の selector の実在を確認した。light は `data-theme="light"`、dark は `data-theme="dark"` と `class="dark"` が一致し、`astro-dev-toolbar` は0件だった。HTTP status だけで成功とは判定していない。

| subject | theme | route | selector | 件数 | console error（component / favicon） | pageerror | 横 overflow |
|---|---|---|---|---:|---:|---:|---|
| alert-dialog | light | `/preview/alert-dialog/` | `[data-slot="alert-dialog-content"]` | 1 | 0 / 1 | 0 | なし |
| alert-dialog | dark | `/preview/alert-dialog-dark/` | `[data-slot="alert-dialog-content"]` | 1 | 0 / 0 | 0 | なし |
| attachment | light | `/preview/attachment/` | `[data-slot="attachment-preview"]` | 1 | 0 / 0 | 0 | なし |
| attachment | dark | `/preview/attachment-dark/` | `[data-slot="attachment-preview"]` | 1 | 0 / 0 | 0 | なし |
| menubar | light | `/preview/menubar/` | `[data-slot="menubar-content"]` | 1 | 0 / 0 | 0 | なし |
| menubar | dark | `/preview/menubar-dark/` | `[data-slot="menubar-content"]` | 1 | 0 / 0 | 0 | なし |
| select | light | `/preview/select/` | `[data-slot="select-content"]` | 1 | 0 / 0 | 0 | なし |
| select | dark | `/preview/select-dark/` | `[data-slot="select-content"]` | 1 | 0 / 0 | 0 | なし |
| button | light | `/preview/button/` | `[data-slot="button"]` | 11 | 0 / 0 | 0 | なし |
| button | dark | `/preview/button-dark/` | `[data-slot="button"]` | 11 | 0 / 0 | 0 | なし |
| bubble | light | `/preview/bubble/` | `[data-slot="bubble-preview"]` | 1 | 0 / 0 | 0 | なし |
| bubble | dark | `/preview/bubble-dark/` | `[data-slot="bubble-preview"]` | 1 | 0 / 0 | 0 | なし |
| dialog | light | `/preview/dialog/` | `[data-slot="dialog-content"]` | 1 | 0 / 0 | 0 | なし |
| dialog | dark | `/preview/dialog-dark/` | `[data-slot="dialog-content"]` | 1 | 0 / 0 | 0 | なし |
| drawer | light | `/preview/drawer/` | `[data-slot="drawer-content"]` | 1 | 0 / 0 | 0 | なし |
| drawer | dark | `/preview/drawer-dark/` | `[data-slot="drawer-content"]` | 1 | 0 / 0 | 0 | なし |
| badge | light | `/preview/badge/` | `[data-slot="badge"]` | 6 | 0 / 0 | 0 | なし |
| badge | dark | `/preview/badge-dark/` | `[data-slot="badge"]` | 6 | 0 / 0 | 0 | なし |
| alert | light | `/preview/alert/` | `[data-slot="alert"]` | 2 | 0 / 0 | 0 | なし |
| alert | dark | `/preview/alert-dark/` | `[data-slot="alert"]` | 2 | 0 / 0 | 0 | なし |
| sheet | light | `/preview/sheet/` | `[data-slot="sheet-content"]` | 1 | 0 / 0 | 0 | なし |
| sheet | dark | `/preview/sheet-dark/` | `[data-slot="sheet-content"]` | 1 | 0 / 0 | 0 | なし |
| tabs | light | `/preview/tabs/` | `[data-slot="tabs"]` | 1 | 0 / 0 | 0 | なし |
| tabs | dark | `/preview/tabs-dark/` | `[data-slot="tabs"]` | 1 | 0 / 0 | 0 | なし |
| catalog | light | `/catalog/` | `[data-slot="verification-catalog"]` | 1 | 0 / 0 | 0 | なし |
| disabled-controls | light | `/catalog/` | `[data-slot="verification-catalog"]` | 1 | 0 / 0 | 0 | なし |
| catalog | dark | `/catalog-dark/` | `[data-slot="verification-catalog"]` | 1 | 0 / 0 | 0 | なし |
| disabled-controls | dark | `/catalog-dark/` | `[data-slot="verification-catalog"]` | 1 | 0 / 0 | 0 | なし |

favicon の404は最初の alert-dialog light で1件あり、component error と分離した。catalog / disabled-controls は両テーマで `[disabled]` が17件だった。

## computed style の生値（仕様 §4.5）

`getComputedStyle` の返値を加工せず記録する。custom property は仕様に従い trim だけを適用した。以下の値は Button の light / dark 両方で同じだった。

| route | selector | property | 仕様の期待値 | 実測の生値 | 判定理由 |
|---|---|---|---|---|---|
| `/preview/button/` | `[data-slot="button"]` 先頭 | transition-duration | `0.12s` | `0.12s` | 文字列一致 |
| `/preview/button/` | `[data-slot="button"]` 先頭 | transition-timing-function | `cubic-bezier(0.2, 0, 0, 1)` | `cubic-bezier(0.2, 0, 0, 1)` | 文字列一致 |
| `/preview/button/` | `document.documentElement` | --curve-entrance | `cubic-bezier(0.16, 1, 0.3, 1)` | `cubic-bezier(.16, 1, .3, 1)` | 数値として等価（0.16 = .16、0.3 = .3） |
| `/preview/button/` | `document.documentElement` | --duration-emphasis | `500ms` | `.5s` | 数値として等価（500ms = .5s） |

司令塔裁定（2026-09-15）により、root の2値は文字列一致ではなく数値等価で合格とした。仕様は tokens.css の表記を期待値としており、build の minify による等価表記への変換を考慮していなかった。tokens.css 自体は仕様どおりの表記である。

変更前の記録 `.docs/reviews/2026-09-06-geometry-layer/report.md` の Button の transition-duration と、今回の computed style は同じ `0.12s` である。timing-function は今回の実測が既存トークンから導いた期待値と一致した。origin/main 側の再 build・同時実測は行っていない。既存8トークンの解決値不変と component / block / preview / page / site の差分が空であることを別途確認し、見た目を変えていないことの構造的な根拠とした。

## 長い catalog 画像の撮影と連結

初回の `fullPage: true` 撮影は、画像末尾に Message Scroller / Native Select / Navigation Menu が現れ、実際の最下部 Toggle / Toggle Group / Tooltip と一致しなかった。この4枚は採用せず、見本 report と同じ viewport タイル方式で取り直した。新しい headless Chromium の起動が一度180秒で timeout したため、重いテスト実行を止めた後に再試行した。

- 各画像31タイル、4画像で計124タイル。
- viewport 1440×900、文書高27302、Y座標は0から900px刻み、末尾だけブラウザ上限の26402。
- `window.scrollTo({top: expected, behavior:"instant"})` の後500ms待ち、実 `scrollY` と文書高を照合する。位置が安定しなければ最大3回で再試行し、今回の実測は最大2回だった。
- 各 screenshot の後にも `scrollY` が期待座標のままであることを確認した。
- 通常の PNG screenshot を実測座標へ貼り、リサイズ・加筆・色補正は行わない。JPEG 出力は quality 95 / subsampling 0。
- 最下部で視覚的に表示される fixed / sticky 要素は0件だった。clip-path で視覚的に隠された要素はこの件数から除外した。
- 連結後の最下部は通常の viewport 撮影と照合し、Toggle / Toggle Group / Tooltip を確認した。

連結時の検査は次のとおり。すべての画像で `covered == scroll_height == 27302` を確認し、未撮影領域がないことを検証した。

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

## JPEG の実体

| ファイル | 幅×高さ | magic bytes |
|---|---:|---|
| `2026-09-15-alert-dialog-preview-light.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-alert-dialog-preview-dark.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-attachment-preview-light.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-attachment-preview-dark.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-menubar-preview-light.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-menubar-preview-dark.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-select-preview-light.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-select-preview-dark.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-button-preview-light.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-button-preview-dark.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-bubble-preview-light.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-bubble-preview-dark.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-dialog-preview-light.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-dialog-preview-dark.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-drawer-preview-light.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-drawer-preview-dark.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-badge-preview-light.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-badge-preview-dark.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-alert-preview-light.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-alert-preview-dark.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-sheet-preview-light.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-sheet-preview-dark.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-tabs-preview-light.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-tabs-preview-dark.jpg` | 1440×900 | FF D8 FF |
| `2026-09-15-catalog-preview-light.jpg` | 1440×27302 | FF D8 FF |
| `2026-09-15-disabled-controls-light.jpg` | 1440×27302 | FF D8 FF |
| `2026-09-15-catalog-preview-dark.jpg` | 1440×27302 | FF D8 FF |
| `2026-09-15-disabled-controls-dark.jpg` | 1440×27302 | FF D8 FF |

## 目視結果と検証範囲

通常24枚の light / dark の全画面縮小一覧、および catalog の全高分割一覧と最下部を確認した。今回の撮影では文字・枠・内容の欠落や新しいはみ出しは観測されなかった。catalog の最下部の繰り返しがある初回 fullPage 画像は最終証跡に含めていない。

| 項目 | 測定段階 | 範囲 |
|---|---|---|
| 18追加トークン・既存8値・4 utility・禁止パターン・component 差分 | 存在 | 正本、生成 CSS、git diff、grep |
| トークン生成・lint・standards・sensor self-test・unit tests・check:all・check-evidence | 実行 | 個々のコマンドと終了コードを PR 本文へ記録 |
| route・selector・console・pageerror・overflow | 実行 | 上表28件、navigation 前から listener を登録 |
| Button と root の4項目 | 動作（computed style） | 生値と期待値、文字列一致または司令塔裁定の数値等価 |
| JPEG | 存在・実行・目視 | 28枚、magic bytes、寸法、124タイルの座標と被覆、描画内容 |

全 props の組合せ、全 component の computed style、キーボード操作全般はこの検証の対象外である。画像と同時追加する本 report の不変性を保つため、後続の check:all / check-evidence / PR CI の最終終了コードは PR 本文へ記録する。
