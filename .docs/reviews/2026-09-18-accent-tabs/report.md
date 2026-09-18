verified_impl_sha: c4a28708f5ffef05282383bc4e5a1194204d2059
evidence_scope: shared-token-migration
targeted_dynamic_sha: c4a28708f5ffef05282383bc4e5a1194204d2059

# 黄アクセントを Tabs line の下線へ接続した共有面検証

## 成功基準と検証時点

正本は [委任仕様 §4・§A](../../plans/2026-09-18-accent-tabs.md)。共有CSS変更 `53d88de827a072afab08e23531519973e15f8f48` の厳密な子孫である上記実装SHAを検証した。変更した部品は Tabs の class 2語のみ。既存のdefault面色・文字色・motion・APIは変更していない。司令塔裁定による検査の読み替えは下記に記録する。

## 環境と再現手順

2026-09-18 JST、macOS、Astro 7.1.6、Playwright 1.64.0-alpha-2026-09-14、headless Chromium 153.0.8010.50（channel chrome）。viewport 1440×900、deviceScaleFactor 1、reducedMotion no-preference。`npm run build:site` は exit 0、292ページ。

```sh
npx astro preview --host ::1 --port 64383
```

1. navigation前にconsole error / pageerror / requestfailedを収集し、HTTP 200、`astro-island[ssr]` 0件、`preview-selectors.json` の対象selectorのvisibleを待った。
2. `document.fonts.ready` と600msを待機した。disabled-controlsはcatalogの `[data-catalog-preview="button"]` を画面内へ移動（scrollY 1238、disabled 3件）。catalogは先頭viewport（scrollY 0）を撮影した。
3. Tabsの2つ目のTabsList内にあるIndicatorとactive Triggerの `::after` のcomputed backgroundColorを採取した。default variantは変更前とも比較した。
4. `document.fonts.check('16px "IBM Plex Sans JP"')` を `document.fonts.load` の前後で採取した。読み込み指定文字列は「共有 UI の概要を表示しています。」。全ページでbodyのcomputed fontFamilyは `"IBM Plex Sans JP", "IBM Plex Sans", system-ui, sans-serif`。合格条件はcomputed値であり、fonts.checkのfalseを成功に置き換えていない。
5. JPEG quality 90、animations disabled、scale cssでviewport撮影した。全28枚をsipsとsharpで独立に形式・寸法・デコード検証し、一覧画像とTabsの原寸画像で目視した。原画像の加工はしていない。合計976,517 bytes。

## registryと生成CSS

`npm run registry:tokens` / `npm run registry:build` / `node scripts/check-distribution.mjs` は各exit 0。97 item × light/dark × 3トークン = 582行追加、削除0。

```sh
git diff --stat origin/main -- registry.json
node -e 'const r=JSON.parse(require("fs").readFileSync("registry.json")); console.log(r.items.length, r.items[0].cssVars.light.highlight, r.items[0].cssVars.dark.highlight)'
```

両方exit 0。前者は `1 file changed, 582 insertions(+)`、後者は97とlight/darkとも `rgb(var(--color-accent-highlight))`。

生成CSSの検査コマンド（各コマンドをpipeなしで独立実行）:

```sh
grep -o -- '--color-highlight:[^;]*;' dist/_astro/global.*.css
grep -o -- '--highlight:[^;]*;' dist/_astro/global.*.css
grep -c '\.bg-highlight{' dist/_astro/global.*.css
grep -c 'after\\:bg-foreground' dist/_astro/global.*.css
grep -c 'after\\:bg-highlight' dist/_astro/global.*.css
grep -c 'tabs-list\\]\\:bg-highlight' dist/_astro/global.*.css
grep -c 'tabs-list\\:bg-highlight' dist/_astro/global.*.css
```

| probe | 変更前 | 変更後 | exit（変更後） |
|---|---:|---:|---:|
| --color-highlight | 未採取 | `var(--highlight)` 1件 | 0 |
| --highlight | 未採取 | `rgb(var(--color-accent-highlight))` 2件 | 0 |
| .bg-highlight | 未採取 | 1行 | 0 |
| after:bg-foreground | 1行 / exit 0 | 1行 | 0 |
| after:bg-highlight | 0行 / exit 1 | 1行 | 0 |
| tabs-list直後に]を要求するspec式 | 未採取 | 0行 | 1 |
| tabs-list直後に]を要求しない補正式 | 未採取 | 1行 | 0 |

変更前はmain `ca6e4f9` と同じ製品ソースを持つspec-only `87d7297` で新規buildした。司令塔裁定: Tailwindがspec本文の旧classも走査するため生成CSSには旧classが残る。正本・走査設定を変更せず、旧class不在の条件は部品ソースとcomputed新色で判定する。生成selectorは `group-data-\[variant\=line\]\/tabs-list\:bg-highlight` であり、`tabs-list` 直後の `]` はspec検査式の誤記だった。

```sh
grep -cE 'after:bg-foreground|group-data-\[variant=line\]/tabs-list:bg-foreground' src/components/ui/tabs.tsx
grep -cE 'after:bg-highlight|group-data-\[variant=line\]/tabs-list:bg-highlight' src/components/ui/tabs.tsx
```

旧2classは0行 / exit 1、新2classは2行 / exit 0。baseの全文に指定2語の置換を適用した結果と現tabs.tsxの全文一致も確認した。

## Tabs computed値

| theme | line Indicator / active ::after | default Indicator（前後同値） | active / inactive文字色 |
|---|---|---|---|
| light | `rgb(242, 194, 48)` | `rgb(255, 255, 255)` | `rgb(26, 28, 33)` / `rgb(99, 103, 111)` |
| dark | `rgb(245, 208, 101)` | `rgb(28, 31, 38)` | `rgb(246, 246, 247)` / `rgb(150, 156, 168)` |

変更前のline Indicator / ::afterはlight `rgb(26, 28, 33)`、dark `rgb(246, 246, 247)`。両variantの `::after` はIndicator併用のためdisplay noneであり、疑似要素のcomputed値を可視下線の描画証拠とは区別する。表示される下線はline Indicatorである。Tabs両テーマでconsole error / favicon / pageerror / requestfailedは全て0。

## 共有面28枚

全件HTTP 200、pageerror 0、requestfailed 0、横overflowなし、dev toolbar 0、theme class一致。console欄はcomponent error / favicon 404 / pageerrorの順。favicon 404はalert-dialog lightの1件を別記する。fonts欄はload前→後。

| subject | theme | route | selector件数 | HTTP | console / favicon / pageerror | fonts.check | 画像 |
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

## コマンド検証と裁定

| 検査 | 実測 | exit |
|---|---|---:|
| standards | 262ファイル | 0 |
| lint | 516ファイル、error 0 / warning 215 / info 3 | 0 |
| contrast単体 | 18 pass / fail 0 / skip 0 | 0 |
| completeness単体 | 95 pass / fail 0 / skip 0 | 0 |
| typography単体 | 6 pass / fail 0 / skip 0 | 0 |
| contrast | 追加2caseをdecorativeとして登録 | 0 |
| build:lib → check:props → completeness → preview-render | 各独立実行、68 components / 28 blocks | 各0 |
| registry:build → distribution → build:site | 各独立実行、配布原本一致・292ページ | 各0 |

既存test削除行は0。全件テスト・typecheck・check:allは指示によりPR CIで代替する。report直後と証跡commit後のcheck-evidence結果、およびCI実績はPR本文へ記録する。

contrast陽性対照は追加2caseを一時nontext-uiへ変更してexit 1を確認した。light background 1.5512 / card 1.6753が両方FAILし、「必須 consumer case の gate / theme / paint / source class / risk 契約が一致しない」も出た。decorativeへ戻した後はexit 0、一時変更のgit diffは空。

司令塔裁定により、case追加時はREQUIRED_CONSUMER_CASE_LABELSにも2labelを登録した。登録前は既存18テスト中17 pass / 1 fail、登録後18 pass。テスト自体は変更していない。backgroundの正しい比率はlight 1.5512 / dark 12.0326、cardはlight 1.6753 / dark 11.0674であるため、reasonもそれぞれ丸めて記録した。手順書追記は証跡commitに同居する。

## ACCEPTED_RISKSと検証範囲

lightの黄は非テキスト3:1未達だが、activeはforegroundとmuted-foregroundの文字色でも識別するというユーザー決定に従い、下線を補助表現としてdecorativeで登録した。濃黄への変更は行わない。黄の用途はTabs line下線に限定する。

存在（class / token / registry / 28画像）、実行（指定テスト・build・HTTP・console）、動作（computed色・light/dark描画）を検証した。全props、vertical Tabs、Indicatorなしでの疑似要素の可視描画、クリック・キーボード操作、全overlay開閉、全高catalog、pixel差分、他ブラウザは未実施。

レビュー記録: [2026-09-18-accent-tabs](../cycles/2026-09-18-accent-tabs.md)。裁量はreportの表現、一時ファイル名、Playwrightスクリプト構成、consumerCaseContractのexport形式（export const）に限定した。
