verified_impl_sha: 6ca8ee243e54ff2c215e4342e71f6932b8dc5eaa
evidence_scope: shared-token-migration
targeted_dynamic_sha: 6ca8ee243e54ff2c215e4342e71f6932b8dc5eaa

# 組版トークン PR A の共有面検証

## 成功基準と対象

正本は [委任仕様 §4・§A](../../plans/2026-09-17-typography-layer.md)。global.css と突合テストの commit は `5c8a4638404883a39d5bcb59ce9620a76ad65674`、site と手順書の commit は上記の検証 SHA。共有 CSS commit は検証 SHA の厳密な祖先である。部品・blocks・previews・design-tokens.html・生成器・tokens.css・brands.css は変更していない。

## 環境と再現手順

2026-09-18（JST）、macOS、Astro 7.1.6、Playwright から起動した headless Chromium 153.0.8010.48（channel: chrome）。viewport 1440×900、deviceScaleFactor 1、reducedMotion no-preference。`npm run build:site` は exit 0、292ページ。配信コマンド:

```sh
npx astro preview --host ::1 --port 64321
```

1. navigation 前に console error / pageerror / requestfailed の listener を登録する。
2. 各 URL の HTTP 200 を確認し、`astro-island[ssr]` が0件になるまで待つ。下表の対象 selector が visible であることを確認し、`document.fonts.ready` と600msを待つ。
3. catalog は先頭、disabled-controls は catalog 内の `[data-catalog-preview="button"]` が見える位置を撮影する。catalog light は lazy iframe の autofocus で最初の試行が scrollY=2373 となったため再試行し、撮影前後とも0を確認した。disabled-controls は両テーマとも scrollY=1236、同カードの disabled 要素3件。
4. `page.screenshot({ type: "jpeg", quality: 90, animations: "disabled", scale: "css" })` で viewport を保存する。全28枚の JPEG 署名、デコード、1440×900を独立検査し、一覧画像でlight/darkの実表示を目視した。原画像のリサイズ・色補正・加筆はしていない。
5. 固定高さ検査は button / badge / kbd / sidebar の light preview を別途開き、対象の全要素で `scrollHeight > clientHeight` を判定する。

## 生成 CSS と陽性対照

生成 CSS: `global.Cz004WX6.css`。以下は spec の grep を各1コマンド、pipeなしで実行した出力。minify により小数の先頭0と末尾セミコロンは省略される。`--tracking-normal:[^;]*;` は末尾の閉じ括弧を越えるため、`:lang(en)` 全体の切り出しを併記して判定する。

```sh
grep -o -- '--text-xs:[^;]*;' dist/_astro/global.*.css
```
exit 0、2件。
```text
--text-xs:.8125rem;
--text-xs:.8125rem;
```

```sh
grep -o -- '--leading-normal:[^;]*;' dist/_astro/global.*.css
```
exit 0、3件。
```text
--leading-normal:1.75;
--leading-normal:1.6;
--leading-normal:1.75;
```

```sh
grep -o -- '--leading-snug:[^;]*;' dist/_astro/global.*.css
```
exit 0、2件。
```text
--leading-snug:1.5;
--leading-snug:1.5;
```

```sh
grep -o -- '--tracking-normal:[^;]*;' dist/_astro/global.*.css
```
exit 0、3件。
```text
--tracking-normal:.02em;
--tracking-normal:0em}body{font-family:var(--font-body);
--tracking-normal:.02em;
```

```sh
grep -o -- ':lang(en){[^}]*}' dist/_astro/global.*.css
```
exit 0、1件。
```text
:lang(en){--font-display:"IBM Plex Sans", "IBM Plex Sans JP", system-ui, sans-serif;--font-body:"IBM Plex Sans", "IBM Plex Sans JP", system-ui, sans-serif;--leading-display:1.2;--leading-normal:1.6;--leading-relaxed:1.75;--tracking-normal:0em}
```

```sh
grep -o -- '\.text-xs{[^}]*}' dist/_astro/global.*.css
```
exit 0、1件。
```text
.text-xs{font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height))}
```

```sh
grep -o -- '--text-xs--line-height:[^;]*;' dist/_astro/global.*.css
```
exit 0、1件。
```text
--text-xs--line-height:1.5;
```

```sh
grep -o -- '--text-base--line-height:[^;]*;' dist/_astro/global.*.css
```
exit 0、1件。
```text
--text-base--line-height:1.75;
```

```sh
grep -o -- '--text-lg--line-height:[^;]*;' dist/_astro/global.*.css
```
exit 0、1件。
```text
--text-lg--line-height:1.9;
```

```sh
grep -o -- '--text-2xl--line-height:[^;]*;' dist/_astro/global.*.css
```
exit 0、1件。
```text
--text-2xl--line-height:1.35;
```

```sh
grep -o -- '\.leading-normal{[^}]*}' dist/_astro/global.*.css
```
exit 0、1件。
```text
.leading-normal{--tw-leading:var(--leading-normal);line-height:var(--leading-normal)}
```

```sh
grep -o -- '\.font-heading{[^}]*}' dist/_astro/global.*.css
```
exit 0、1件。
```text
.font-heading{font-family:var(--font-display);font-feature-settings:"palt" 1}
```

```sh
grep -c -- '--text-7xl' dist/_astro/global.*.css
```
exit 1、0件。
```text
0
```

```sh
grep -c -- '--leading-loose' dist/_astro/global.*.css
```
exit 1、0件。
```text
0
```

`:lang(en){...}` は1件。そこを除いた CSS では `--text-xs:.75rem` / `--leading-normal:1.5` / `--leading-snug:1.375` / `--tracking-normal:0em` は各0件。`--leading-normal:1.6` と `--tracking-normal:0em` はこの言語ブロック内だけに存在する。

陽性対照として変更前（main cd4efbb と同じ実装、先頭spec commitのみ追加）のビルドで次を各1件・exit 0と確認した。

```css
--leading-normal:1.5;
--text-xs:.75rem;
```

新規テストは接続変更前に6件すべて失敗（exit 1）、変更後6/6成功（exit 0、fail / skip 0）。文字列だけの `--leading-normal: 1.75;` → `1.5;` とトークン欠落を検出する陽性対照を含む。

## body の computed style と固定高さ

| route（light） | fontSize | lineHeight | letterSpacing | fonts.check |
|---|---|---|---|---|
| `/preview/button/` | 16px | 28px | 0.32px | false |
| `/preview/badge/` | 16px | 28px | 0.32px | false |
| `/preview/kbd/` | 16px | 28px | 0.32px | false |
| `/preview/sidebar/` | 16px | 28px | 0.32px | true |

`fonts.check` は spec 指定の `document.fonts.check('16px "IBM Plex Sans JP"')` の戻り値。falseを成功と置き換えていない。表示に使用されるfont faceの読み込み完了を `document.fonts.ready` で待ったが、全weight・文字集合の読み込みを保証するものではない。変更前の button / badge はいずれも fontSize 16px、lineHeight 24px、letterSpacing `normal`（Chromiumのゼロ字間の表現）、同checkは false だった。

| slot / light preview | 全件数 | 溢れ | clientHeight | scrollHeight | fontSize / lineHeight |
|---|---:|---:|---|---|---|
| `button` / button | 11 | 0 | 34px | 34px | 14px / 21px |
| `badge` / badge | 7 | 7 | 18px | 21px | 13px / 19.5px |
| `kbd` / kbd | 3 | 0 | 20px | 20px | 13px / 19.5px |
| `sidebar-group-label` / sidebar | 1 | 0 | 32px | 32px | 13px / 19.5px |

button 11件、kbd 3件、sidebar-group-label 1件は全件 `scrollHeight <= clientHeight`。badge は公開中 / 下書き / 停止中 / 審査待ち / 任意 / 詳細を見る / 新着の全7件で 21 > 18。追加測定のconsole errorはbuttonのfavicon 404が1件のみ、pageerrorは全4ページ0件。

## 司令塔の裁定と ACCEPTED_RISKS

- §A.3 の数値 leading は指定3ファイルに全10件あり、spec の9件は数え違いのため全10件を置換した。
- §4.7 の一時上書きは spec の2xs指定がBの再タグ付け後の前提で、Aではxsを使う裁定。その後、通常状態のbadge全7件が scrollHeight 21 > clientHeight 18 と観測されたため、既に検査が溢れを検出できる陽性対照が成立し、追加の2.5上書きは不要との再裁定を得た。一時変更は行っていない。
- ACCEPTED_RISKS: PR Aのbadgeは text-xs（13px × 1.5）で固定高さに対して溢れる中間状態。B1 / B2でチップ側へ leading-none を足して解消し、解消確認はBの証跡で行う。PR Aでは部品も段のトークン値も変更しない。

## 共有面 28 枚の HTTP・console・pageerror と画像

全件で HTTP 200、selector 1件以上、pageerror 0、requestfailed 0、横overflowなし、dev toolbar 0。テーマ class は全件一致した。console欄は component error / favicon 404 / pageerror の順。catalog は全DOMを描画するが、画像は先頭viewportのみで全高証跡ではない。

| subject | theme | route | selector件数 | HTTP | console / favicon / pageerror | 画像 |
|---|---|---|---:|---:|---|---|
| disabled-controls | light | `/catalog/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-disabled-controls-preview-light.jpg](2026-09-18-disabled-controls-preview-light.jpg) |
| disabled-controls | dark | `/catalog-dark/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-disabled-controls-preview-dark.jpg](2026-09-18-disabled-controls-preview-dark.jpg) |
| alert-dialog | light | `/preview/alert-dialog/` | 1 | 200 | 0 / 1 / 0 | [2026-09-18-alert-dialog-preview-light.jpg](2026-09-18-alert-dialog-preview-light.jpg) |
| alert-dialog | dark | `/preview/alert-dialog-dark/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-alert-dialog-preview-dark.jpg](2026-09-18-alert-dialog-preview-dark.jpg) |
| attachment | light | `/preview/attachment/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-attachment-preview-light.jpg](2026-09-18-attachment-preview-light.jpg) |
| attachment | dark | `/preview/attachment-dark/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-attachment-preview-dark.jpg](2026-09-18-attachment-preview-dark.jpg) |
| catalog | light | `/catalog/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-catalog-preview-light.jpg](2026-09-18-catalog-preview-light.jpg) |
| catalog | dark | `/catalog-dark/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-catalog-preview-dark.jpg](2026-09-18-catalog-preview-dark.jpg) |
| menubar | light | `/preview/menubar/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-menubar-preview-light.jpg](2026-09-18-menubar-preview-light.jpg) |
| menubar | dark | `/preview/menubar-dark/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-menubar-preview-dark.jpg](2026-09-18-menubar-preview-dark.jpg) |
| select | light | `/preview/select/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-select-preview-light.jpg](2026-09-18-select-preview-light.jpg) |
| select | dark | `/preview/select-dark/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-select-preview-dark.jpg](2026-09-18-select-preview-dark.jpg) |
| button | light | `/preview/button/` | 11 | 200 | 0 / 0 / 0 | [2026-09-18-button-preview-light.jpg](2026-09-18-button-preview-light.jpg) |
| button | dark | `/preview/button-dark/` | 11 | 200 | 0 / 0 / 0 | [2026-09-18-button-preview-dark.jpg](2026-09-18-button-preview-dark.jpg) |
| bubble | light | `/preview/bubble/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-bubble-preview-light.jpg](2026-09-18-bubble-preview-light.jpg) |
| bubble | dark | `/preview/bubble-dark/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-bubble-preview-dark.jpg](2026-09-18-bubble-preview-dark.jpg) |
| dialog | light | `/preview/dialog/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-dialog-preview-light.jpg](2026-09-18-dialog-preview-light.jpg) |
| dialog | dark | `/preview/dialog-dark/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-dialog-preview-dark.jpg](2026-09-18-dialog-preview-dark.jpg) |
| drawer | light | `/preview/drawer/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-drawer-preview-light.jpg](2026-09-18-drawer-preview-light.jpg) |
| drawer | dark | `/preview/drawer-dark/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-drawer-preview-dark.jpg](2026-09-18-drawer-preview-dark.jpg) |
| badge | light | `/preview/badge/` | 7 | 200 | 0 / 0 / 0 | [2026-09-18-badge-preview-light.jpg](2026-09-18-badge-preview-light.jpg) |
| badge | dark | `/preview/badge-dark/` | 7 | 200 | 0 / 0 / 0 | [2026-09-18-badge-preview-dark.jpg](2026-09-18-badge-preview-dark.jpg) |
| alert | light | `/preview/alert/` | 2 | 200 | 0 / 0 / 0 | [2026-09-18-alert-preview-light.jpg](2026-09-18-alert-preview-light.jpg) |
| alert | dark | `/preview/alert-dark/` | 2 | 200 | 0 / 0 / 0 | [2026-09-18-alert-preview-dark.jpg](2026-09-18-alert-preview-dark.jpg) |
| sheet | light | `/preview/sheet/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-sheet-preview-light.jpg](2026-09-18-sheet-preview-light.jpg) |
| sheet | dark | `/preview/sheet-dark/` | 1 | 200 | 0 / 0 / 0 | [2026-09-18-sheet-preview-dark.jpg](2026-09-18-sheet-preview-dark.jpg) |
| tabs | light | `/preview/tabs/` | 2 | 200 | 0 / 0 / 0 | [2026-09-18-tabs-preview-light.jpg](2026-09-18-tabs-preview-light.jpg) |
| tabs | dark | `/preview/tabs-dark/` | 2 | 200 | 0 / 0 / 0 | [2026-09-18-tabs-preview-dark.jpg](2026-09-18-tabs-preview-dark.jpg) |

28枚の合計は 971,043 bytes。各subjectのselectorは `preview-selectors.json` に従い、disabled-controlsはcatalogのbuttonカードを対象とした。

## コマンド実測

| 検査 | 結果 | exit |
|---|---|---:|
| standards | 262ファイル | 0 |
| lint | 515ファイル、error 0、warning 215、info 3 | 0 |
| check-completeness単体 | 95/95、fail / skip 0 | 0 |
| add-component単体 | 93/93、fail / skip 0 | 0 |
| contrast単体 | 18/18、fail / skip 0 | 0 |
| design-tokens単体 | 2/2、fail / skip 0 | 0 |
| theme-typography単体 | 6/6、fail / skip 0 | 0 |
| build:lib → check:props → completeness → preview render | 各コマンドを順に独立実行、68 components / 28 blocks | 各0 |
| registry:build → distribution | 配布原本と一致 | 各0 |
| registry.json 差分 | 空 | 0 |
| build:site | 292ページ | 0 |

```sh
node scripts/check-standards.mjs
npm run lint
node --test scripts/check-completeness.test.mjs
node --test scripts/add-component.test.mjs
node --test scripts/contrast.test.mjs
node --test scripts/design-tokens.test.mjs
node --test scripts/theme-typography.test.mjs
npm run build:lib
npm run check:props
node scripts/check-completeness.mjs
node scripts/check-preview-render.mjs
npm run registry:build
node scripts/check-distribution.mjs
git diff --exit-code registry.json
npm run build:site
```

site再タグ付け後の負検査は以下、出力0件・exit 1。同じgrepで `tracking-heading|leading-normal` を検索する陽性対照は13行・exit 0。text-xsは5→0、text-2xsは0→3、text-3xsは0→2、tracking-headingは0→4、tracking-labelは0→2、数値leadingは10→0。

```sh
grep -rEn "tracking-(tight|wider|widest)|leading-[0-9]" src/site
```

既存testの削除は0件。全件テスト・typecheck・check:allは司令塔指示に従いPR CIで代替する。report直後と証跡commit後のcheck-evidence結果、およびCI実績はPR本文へ記録する。

## 検証範囲

- 存在: 組版22トークン、サイズ別行間12段、palt、旧名の負検査、画像28枚の形式と寸法。
- 実行: 指定の単体214件、各build・整合検査、28ページのHTTP / console / pageerror。
- 動作: bodyのcomputed style、固定高さ22要素の溢れ検査、light / darkの描画。
- 未実施: 全overlayの開閉・キーボード操作、全props、全高catalogの撮影、画像のpixel差分比較、ブラウザ間比較。静的レビューはこれらの動作検証の代替ではない。

レビュー記録は [2026-09-18-typography-a](../cycles/2026-09-18-typography-a.md)。裁量はテストの構成（欠落検出を追加）、reportの表現、一時ファイル名、Playwrightの構成・測定ルート・catalogの再撮影に限定した。
