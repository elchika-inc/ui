verified_impl_sha: 971b08315898706ad8ce3d1a152e8bd598a03280
evidence_scope: shared-token-migration
targeted_dynamic_sha: 971b08315898706ad8ce3d1a152e8bd598a03280

# 旧 tracking utility を解除した共有面検証

## 成功基準と検証時点

正本は [委任仕様 §4・§A](../../plans/2026-09-18-tracking-initial.md)。global.css 変更 `afe500fa55c38c60b1fad35e6432f58d5b735eb7` の厳密な子孫である上記テスト commit を検証した。非 inline `@theme` に既定値解除を追加し、続く tracking 4定義は元の値・順序を保持する。テスト名と assert の反転、陽性対照1件の追加を確認した。commit 分割についての司令塔裁定は PR 本文に記録する。

## 環境と再現手順

2026-09-18 JST、macOS、Node 24.21.0、Astro 7.1.6、Playwright 1.64.0-alpha-2026-09-14、headless Chromium 153.0.8010.50（channel chrome）。viewport 1440×900、deviceScaleFactor 1、reducedMotion no-preference。

```sh
npm run build:site
npx astro preview --host ::1 --port 64489
```

1. navigation 前から console error / pageerror / requestfailed を収集する。公開サイトは `localStorage.setItem("elchika-ui-theme", theme)` を init script で指定し、light / dark を開く。
2. HTTP 200、`astro-island[ssr]` 0件、対象 selector の visible を待つ。`document.fonts.ready` と600msを待機し、computed letterSpacing と documentElement の scrollWidth / clientWidth を採取する。
3. 共有面は `preview-selectors.json` の selector を使用する。disabled-controls は catalog の `[data-catalog-preview="button"]` を画面内へ移動し、disabled 3件を確認する。catalog は先頭 viewport を撮影する。
4. 共有面では `document.fonts.check('16px "IBM Plex Sans JP"')` を前後で採取し、`document.fonts.load` に「共有 UI の概要を表示しています。」を指定する。body の computed fontFamily は全件 `"IBM Plex Sans JP", "IBM Plex Sans", system-ui, sans-serif`。
5. JPEG quality 90、animations disabled、scale css の viewport 画像を28枚新規撮影する。sharp で全件の形式・寸法・デコードを独立検査し、light/dark の一覧画像で目視確認した。原画像の加工はしていない。合計 976,442 bytes。

## 生成 CSS の before / after

before は仕様 §1 の司令塔実測（main `2f8c5c1`）。after は `dist/_astro/global.DfdbtWGX.css`。各 grep を pipe なしで独立実行した。minify の値表記に依存せず、名前と selector を照合する。

| probe | before | after | after exit |
|---|---:|---:|---:|
| `.tracking-tight{` | 1 | 0 | 1 |
| `.tracking-wider{` | 1 | 0 | 1 |
| `.tracking-widest{` | 1 | 0 | 1 |
| `.tracking-tighter{` | 0 | 0 | 1 |
| `.tracking-wide{` | 0 | 0 | 1 |
| `.tracking-display{` | 1 | 1 | 0 |
| `.tracking-heading{` | 1 | 1 | 0 |
| `.tracking-normal{` | 1 | 1 | 0 |
| `.tracking-label{` | 1 | 1 | 0 |
| `--tracking-tight:` | 1 | 0 | 1 |
| `--tracking-wider:` | 1 | 0 | 1 |
| `--tracking-widest:` | 1 | 0 | 1 |

```sh
grep -c '\.tracking-tight{' dist/_astro/global.*.css
grep -c '\.tracking-wider{' dist/_astro/global.*.css
grep -c '\.tracking-widest{' dist/_astro/global.*.css
grep -c '\.tracking-tighter{' dist/_astro/global.*.css
grep -c '\.tracking-wide{' dist/_astro/global.*.css
grep -c '\.tracking-display{' dist/_astro/global.*.css
grep -c '\.tracking-heading{' dist/_astro/global.*.css
grep -c '\.tracking-normal{' dist/_astro/global.*.css
grep -c '\.tracking-label{' dist/_astro/global.*.css
grep -c -- '--tracking-tight:' dist/_astro/global.*.css
grep -c -- '--tracking-wider:' dist/_astro/global.*.css
grep -c -- '--tracking-widest:' dist/_astro/global.*.css
grep -o -- '--tracking-[a-z]*:' dist/_astro/global.*.css
```

0件の grep は exit 1 が期待結果。既知の陽性である4 utility が各1件 / exit 0になることも同じ検索方式で確認した。最後の grep は exit 0、その出力を集合化すると `--tracking-display:` / `--tracking-heading:` / `--tracking-label:` / `--tracking-normal:` の4種だけだった（検証に pipe は使用しない）。

## 公開サイトの computed letterSpacing

全6ケースで HTTP 200、console error 0、favicon 404 0、pageerror 0、requestfailed 0。eyebrow は全要素を測定し、全て同値だった。masthead の wordmark は `[data-site-masthead] a[href="/"]`、body は `document.body` を測定する。

| route | theme | eyebrow 件数 / letterSpacing | wordmark | body | scrollWidth / clientWidth |
|---|---|---|---|---|---|
| `/` | light | 3 / `0.88px` | `-0.16px` | `0.32px` | 1440 / 1440 |
| `/` | dark | 3 / `0.88px` | `-0.16px` | `0.32px` | 1440 / 1440 |
| `/components/` | light | 11 / `0.88px` | `-0.16px` | `0.32px` | 1440 / 1440 |
| `/components/` | dark | 11 / `0.88px` | `-0.16px` | `0.32px` | 1440 / 1440 |
| `/components/button/` | light | 1 / `0.88px` | `-0.16px` | `0.32px` | 1440 / 1440 |
| `/components/button/` | dark | 1 / `0.88px` | `-0.16px` | `0.32px` | 1440 / 1440 |

`/components/` は既存 preview の autofocus により測定時 scrollY 4136、それ以外の公開ページは0。横方向は全件1440で一致した。

## 共有面28枚

全件 HTTP 200、favicon を除く console error 0、pageerror 0、requestfailed 0。favicon 404 は alert-dialog light の1件を別記する。scrollWidth / clientWidth 1440 / 1440、dev toolbar 0、theme class 一致。画像は全て JPEG 1440×900、デコード成功。console 欄は console error / favicon 404 / pageerror の順。

| subject | theme | route | selector 件数 | HTTP | console / favicon / pageerror | fonts.check 前→後 | 画像 |
|---|---|---|---:|---:|---|---|---|
| disabled-controls | light | `/catalog/` | 1 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-disabled-controls-preview-light.jpg](2026-09-18-disabled-controls-preview-light.jpg) |
| disabled-controls | dark | `/catalog-dark/` | 1 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-disabled-controls-preview-dark.jpg](2026-09-18-disabled-controls-preview-dark.jpg) |
| alert-dialog | light | `/preview/alert-dialog/` | 1 | 200 | 0 / 1 / 0 | false → true | [2026-09-18-alert-dialog-preview-light.jpg](2026-09-18-alert-dialog-preview-light.jpg) |
| alert-dialog | dark | `/preview/alert-dialog-dark/` | 1 | 200 | 0 / 0 / 0 | false → true | [2026-09-18-alert-dialog-preview-dark.jpg](2026-09-18-alert-dialog-preview-dark.jpg) |
| attachment | light | `/preview/attachment/` | 1 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-attachment-preview-light.jpg](2026-09-18-attachment-preview-light.jpg) |
| attachment | dark | `/preview/attachment-dark/` | 1 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-attachment-preview-dark.jpg](2026-09-18-attachment-preview-dark.jpg) |
| catalog | light | `/catalog/` | 1 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-catalog-preview-light.jpg](2026-09-18-catalog-preview-light.jpg) |
| catalog | dark | `/catalog-dark/` | 1 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-catalog-preview-dark.jpg](2026-09-18-catalog-preview-dark.jpg) |
| menubar | light | `/preview/menubar/` | 1 | 200 | 0 / 0 / 0 | false → true | [2026-09-18-menubar-preview-light.jpg](2026-09-18-menubar-preview-light.jpg) |
| menubar | dark | `/preview/menubar-dark/` | 1 | 200 | 0 / 0 / 0 | false → true | [2026-09-18-menubar-preview-dark.jpg](2026-09-18-menubar-preview-dark.jpg) |
| select | light | `/preview/select/` | 1 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-select-preview-light.jpg](2026-09-18-select-preview-light.jpg) |
| select | dark | `/preview/select-dark/` | 1 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-select-preview-dark.jpg](2026-09-18-select-preview-dark.jpg) |
| button | light | `/preview/button/` | 11 | 200 | 0 / 0 / 0 | false → true | [2026-09-18-button-preview-light.jpg](2026-09-18-button-preview-light.jpg) |
| button | dark | `/preview/button-dark/` | 11 | 200 | 0 / 0 / 0 | false → true | [2026-09-18-button-preview-dark.jpg](2026-09-18-button-preview-dark.jpg) |
| bubble | light | `/preview/bubble/` | 1 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-bubble-preview-light.jpg](2026-09-18-bubble-preview-light.jpg) |
| bubble | dark | `/preview/bubble-dark/` | 1 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-bubble-preview-dark.jpg](2026-09-18-bubble-preview-dark.jpg) |
| dialog | light | `/preview/dialog/` | 1 | 200 | 0 / 0 / 0 | false → true | [2026-09-18-dialog-preview-light.jpg](2026-09-18-dialog-preview-light.jpg) |
| dialog | dark | `/preview/dialog-dark/` | 1 | 200 | 0 / 0 / 0 | false → true | [2026-09-18-dialog-preview-dark.jpg](2026-09-18-dialog-preview-dark.jpg) |
| drawer | light | `/preview/drawer/` | 1 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-drawer-preview-light.jpg](2026-09-18-drawer-preview-light.jpg) |
| drawer | dark | `/preview/drawer-dark/` | 1 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-drawer-preview-dark.jpg](2026-09-18-drawer-preview-dark.jpg) |
| badge | light | `/preview/badge/` | 9 | 200 | 0 / 0 / 0 | false → true | [2026-09-18-badge-preview-light.jpg](2026-09-18-badge-preview-light.jpg) |
| badge | dark | `/preview/badge-dark/` | 9 | 200 | 0 / 0 / 0 | false → true | [2026-09-18-badge-preview-dark.jpg](2026-09-18-badge-preview-dark.jpg) |
| alert | light | `/preview/alert/` | 2 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-alert-preview-light.jpg](2026-09-18-alert-preview-light.jpg) |
| alert | dark | `/preview/alert-dark/` | 2 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-alert-preview-dark.jpg](2026-09-18-alert-preview-dark.jpg) |
| sheet | light | `/preview/sheet/` | 1 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-sheet-preview-light.jpg](2026-09-18-sheet-preview-light.jpg) |
| sheet | dark | `/preview/sheet-dark/` | 1 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-sheet-preview-dark.jpg](2026-09-18-sheet-preview-dark.jpg) |
| tabs | light | `/preview/tabs/` | 2 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-tabs-preview-light.jpg](2026-09-18-tabs-preview-light.jpg) |
| tabs | dark | `/preview/tabs-dark/` | 2 | 200 | 0 / 0 / 0 | true → true | [2026-09-18-tabs-preview-dark.jpg](2026-09-18-tabs-preview-dark.jpg) |

## コマンド検証

各コマンドの終了を個別に観測した。全件テスト・typecheck・check:all はローカルでは実行せず、PR CI で代替する。

| 検査 | 実測 | exit |
|---|---|---:|
| standards | 263ファイル | 0 |
| lint | 517ファイル、error 0 / warning 215 / info 3 | 0 |
| theme-typography 単体 | 7 pass / fail 0 / skip 0 | 0 |
| typography-usage 単体 | 6 pass / fail 0 / skip 0 | 0 |
| contrast 単体 | 18 pass / fail 0 / skip 0 | 0 |
| check-completeness 単体 | 95 pass / fail 0 / skip 0 | 0 |
| catalog-build 単体 | 10 pass / fail 0 / skip 0 | 0 |
| docs-site 単体 | 11 pass / fail 0 / skip 0 | 0 |
| build:lib → check:props → completeness → preview-render | 各独立実行、68 components / 28 blocks | 各0 |
| registry:build → distribution | 各独立実行、配布物原本一致 | 各0 |
| registry.json 差分検査 | 差分なし | 0 |
| build:site | 292ページ | 0 |
| Playwright | 公開6ケース + 共有面28ケース | 0 |

```sh
node scripts/check-standards.mjs
npm run lint
node --test scripts/theme-typography.test.mjs
node --test scripts/typography-usage.test.mjs
node --test scripts/contrast.test.mjs
node --test scripts/check-completeness.test.mjs
node --test scripts/catalog-build.test.mjs
node --test scripts/docs-site.test.mjs
npm run build:lib
npm run check:props
node scripts/check-completeness.mjs
node scripts/check-preview-render.mjs
npm run registry:build
node scripts/check-distribution.mjs
git diff --exit-code registry.json
npm run build:site
node scripts/check-evidence.mjs
```

組版テストは変更前6件、変更後7件。AST により既存5件の名称保持と指定1件の改名を照合し、テスト削除0件・skip 0件を確認した。diff の `-test(` 1行は仕様で指定された改名に対応し、テスト本体の削除ではない。追加の陽性対照はファイルを変更せず文字列から `--tracking-*: initial;` を除き、同じ正規表現の検査が `ERR_ASSERTION` になることを確認する。global.css の差分は指定コメントと initial の2行だけで、既存全文との一致も別途検査した。

report 直後および証跡 commit 後の check-evidence の実測結果、最終の変更範囲・base 確認・PR CI は PR 本文に記録する。レビュー記録は [レビューサイクル](../cycles/2026-09-18-tracking-initial.md)。

## 検証範囲

名前空間の解除、生成 CSS、字間の computed 値、light/dark の描画、共有面28枚を検証した。全 props、全 overlay の開閉操作、キーボード操作、他 viewport、他ブラウザ、全高 catalog の撮影、pixel 差分は未実施。
