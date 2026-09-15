verified_impl_sha: 59a5d6d5a4c7ee14eb37189705ee8222c05e1a5f
evidence_scope: shared-token-migration
targeted_dynamic_sha: 59a5d6d5a4c7ee14eb37189705ee8222c05e1a5f

# overlay モーション統一 PR E の実ブラウザ検証

## 成功基準と実装

- 正本: `.docs/plans/2026-09-15-overlay-motion.md` §4・§E、および PR 本文に記録する司令塔裁定。
- 実装 commit 1: `716dd468a7cf1acea0d1dc43380c9534f58e39ec`（共有 CSS、依存、registry と配布契約テスト）。
- 実装 commit 2: `59a5d6d5a4c7ee14eb37189705ee8222c05e1a5f`（部品の生値置換、allowlist 空化、block 来歴ハッシュ）。commit 2 は commit 1 の厳密な子孫で、全画像と report は commit 2 を検証した。
- 共有面 14 subject × light/dark の28枚に、変更した6 subjectの12枚と部品別reportを追加する裁定に従った。合計40枚。

## 環境と再現手順

- 実測日: 2026-09-16（JST）、macOS、Astro 7.1.6。
- Playwright MCP から `browserType().launch({channel: "chrome", headless: true})` で Chromium 153.0.8010.36 を起動。
- viewport 1440×900 CSS px、deviceScaleFactor 1、通常モーション設定。
- `npm run build:site` の成果物（271ページ、exit 0）をポート4395で配信した。生成CSSは `dist/_astro/global.BO12mFFC.css`。

```bash
npx astro preview --host 127.0.0.1 --port 4395
```

1. navigation前に `console` のerrorと`pageerror`のlistenerを登録する。
2. `astro-island[ssr]` がなくなるまでhydrationを待ち、`preview-selectors.json`のselector先頭がvisibleになるまで待つ。`document.fonts.ready` と600msの描画待ちを経て、selector件数・dark class・横overflow・toolbarを測る。
3. 通常36枚は `page.screenshot({type: "jpeg", quality: 90, animations: "disabled", scale: "css"})`。input-otpは `#input-otp-default` へfocusしてcaretを表示し、computed style取得後に撮影する。
4. catalogとdisabled-controlsは同じcatalog routeを別々に撮影する。高さ27302、viewport900pxの31タイルを各画像に使う（合計124タイル）。スクロール位置を250ms後に実測し、期待位置と一致しない場合は最大3回だけ再試行する。撮影後のscrollYも一致を確認する。末尾のYは26402。
5. PNGタイルを実測Yに配置し、未被覆領域がないことを確認してJPEG quality 95 / subsampling 0にする。画像のリサイズ・加筆・色補正は行わない。最下部で可視のfixed/sticky要素は全4件で0。全画像を独立にdecodeし、JPEG署名と寸法を検査する。

連結の被覆検査:

```python
canvas = Image.new("RGB", (1440, scroll_height))
covered = 0
for tile in tiles:
    image = Image.open(tile["path"])
    assert image.size == (1440, 900)
    assert tile["y"] <= covered
    canvas.paste(image, (0, tile["y"]))
    covered = max(covered, tile["y"] + 900)
assert covered == scroll_height == 27302
```

## 共有面28件の結果

全件HTTP 200、selector 1件以上、component console error 0件、pageerror 0件、横overflowなし、dev toolbar 0件。dark classはlightでfalse、darkでtrue。`data-theme`属性は存在しないため、テーマ判定には実在するdark classを使った。

| subject | theme | route | selector件数 | console / favicon / pageerror | 画像 |
|---|---|---|---:|---|---|
| alert-dialog | light | `/preview/alert-dialog/` | 1 | 0 / 1 / 0 | [2026-09-16-alert-dialog-preview-light.jpg](2026-09-16-alert-dialog-preview-light.jpg) |
| alert-dialog | dark | `/preview/alert-dialog-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-alert-dialog-preview-dark.jpg](2026-09-16-alert-dialog-preview-dark.jpg) |
| attachment | light | `/preview/attachment/` | 1 | 0 / 0 / 0 | [2026-09-16-attachment-preview-light.jpg](2026-09-16-attachment-preview-light.jpg) |
| attachment | dark | `/preview/attachment-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-attachment-preview-dark.jpg](2026-09-16-attachment-preview-dark.jpg) |
| menubar | light | `/preview/menubar/` | 1 | 0 / 0 / 0 | [2026-09-16-menubar-preview-light.jpg](2026-09-16-menubar-preview-light.jpg) |
| menubar | dark | `/preview/menubar-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-menubar-preview-dark.jpg](2026-09-16-menubar-preview-dark.jpg) |
| select | light | `/preview/select/` | 1 | 0 / 1 / 0 | [2026-09-16-select-preview-light.jpg](2026-09-16-select-preview-light.jpg) |
| select | dark | `/preview/select-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-select-preview-dark.jpg](2026-09-16-select-preview-dark.jpg) |
| button | light | `/preview/button/` | 11 | 0 / 0 / 0 | [2026-09-16-button-preview-light.jpg](2026-09-16-button-preview-light.jpg) |
| button | dark | `/preview/button-dark/` | 11 | 0 / 0 / 0 | [2026-09-16-button-preview-dark.jpg](2026-09-16-button-preview-dark.jpg) |
| bubble | light | `/preview/bubble/` | 1 | 0 / 0 / 0 | [2026-09-16-bubble-preview-light.jpg](2026-09-16-bubble-preview-light.jpg) |
| bubble | dark | `/preview/bubble-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-bubble-preview-dark.jpg](2026-09-16-bubble-preview-dark.jpg) |
| dialog | light | `/preview/dialog/` | 1 | 0 / 1 / 0 | [2026-09-16-dialog-preview-light.jpg](2026-09-16-dialog-preview-light.jpg) |
| dialog | dark | `/preview/dialog-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-dialog-preview-dark.jpg](2026-09-16-dialog-preview-dark.jpg) |
| drawer | light | `/preview/drawer/` | 1 | 0 / 0 / 0 | [2026-09-16-drawer-preview-light.jpg](2026-09-16-drawer-preview-light.jpg) |
| drawer | dark | `/preview/drawer-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-drawer-preview-dark.jpg](2026-09-16-drawer-preview-dark.jpg) |
| badge | light | `/preview/badge/` | 6 | 0 / 0 / 0 | [2026-09-16-badge-preview-light.jpg](2026-09-16-badge-preview-light.jpg) |
| badge | dark | `/preview/badge-dark/` | 6 | 0 / 0 / 0 | [2026-09-16-badge-preview-dark.jpg](2026-09-16-badge-preview-dark.jpg) |
| alert | light | `/preview/alert/` | 2 | 0 / 1 / 0 | [2026-09-16-alert-preview-light.jpg](2026-09-16-alert-preview-light.jpg) |
| alert | dark | `/preview/alert-dark/` | 2 | 0 / 0 / 0 | [2026-09-16-alert-preview-dark.jpg](2026-09-16-alert-preview-dark.jpg) |
| sheet | light | `/preview/sheet/` | 1 | 0 / 0 / 0 | [2026-09-16-sheet-preview-light.jpg](2026-09-16-sheet-preview-light.jpg) |
| sheet | dark | `/preview/sheet-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-sheet-preview-dark.jpg](2026-09-16-sheet-preview-dark.jpg) |
| tabs | light | `/preview/tabs/` | 1 | 0 / 0 / 0 | [2026-09-16-tabs-preview-light.jpg](2026-09-16-tabs-preview-light.jpg) |
| tabs | dark | `/preview/tabs-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-tabs-preview-dark.jpg](2026-09-16-tabs-preview-dark.jpg) |
| catalog | light | `/catalog/` | 1 | 0 / 0 / 0 | [2026-09-16-catalog-preview-light.jpg](2026-09-16-catalog-preview-light.jpg) |
| catalog | dark | `/catalog-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-catalog-preview-dark.jpg](2026-09-16-catalog-preview-dark.jpg) |
| disabled-controls | light | `/catalog/` | 1 | 0 / 0 / 0 | [2026-09-16-disabled-controls-light.jpg](2026-09-16-disabled-controls-light.jpg) |
| disabled-controls | dark | `/catalog-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-disabled-controls-dark.jpg](2026-09-16-disabled-controls-dark.jpg) |

通常プレビュー36件のうちfavicon 404は5件（別browser起動後の最初のnavigationで発生）、component errorとは分離した。catalog系4件はfavicon errorも0件で、disabled属性を持つ要素は各17件だった。

## 担当部品のcomputed styleと操作

値はCSSOMの返値をそのまま記録する。light/darkで同じ結果だった。

| 対象 | 操作・状態 | 実測値 |
|---|---|---|
| input-otp caret | inputへfocus | animation-name `caret-blink`、animation-duration `1.25s`、animation-timing-function `cubic-bezier(0.16, 1, 0.3, 1)`、transition-duration `0.5s` |
| item | divとaの2要素 | transition-duration `0.12s`、transition-timing-function `cubic-bezier(0.2, 0, 0, 1)` |
| message-scroller button | 初期末尾、data-active=false | duration `0.4s`、timing `cubic-bezier(0.2, 0, 0, 1)`、opacity `0` |
| message-scroller button | viewportを先頭へscroll、data-active=true | duration `0.18s`、timing `cubic-bezier(0.16, 1, 0.3, 1)`、opacity `1` |
| message-scroller button | buttonをclickして末尾へ戻る | data-active=false、duration `0.4s`、timing `cubic-bezier(0.2, 0, 0, 1)`、opacity `0` |
| sidebar | gap/container/group-label | duration `0.18s`、timing `linear`、triggerでexpanded → collapsed → expanded |
| sidebar-07 | nav-mainの矢印svg 4件 | duration `0.18s`、timing `cubic-bezier(0.2, 0, 0, 1)` |
| dashboard-01 | nav-mainのbutton | duration `0.18s`、timing `linear` |

§4.5のpopup開始・終了属性とdata-instantの検査は、§Eの担当6subjectにはpopupの変更がないためN/A。共有面のoverlay画像は既存previewの初期open表示を確認したもので、§A〜§Dの開閉検証を再実行したとは主張しない。

## 生成CSSと検査の範囲

生成CSSでduration-slowとease-entranceは各1ルール、data-starting-styleは1行、ease-outは0行、ease-linearは1行、animate-caret-blinkは1ルールを確認した。caretルールは次のとおり。

```css
.animate-caret-blink{animation:caret-blink 1.25s var(--curve-entrance) infinite}
```

司令塔裁定により、§E.2のease-outはCSSも走査するstandardsに検知される誤記としてcurve-entranceへ写像した。1.25sは専用段がないためコメント付きで維持した。検査ロジックは変更していない。

| 段階 | 観測対象 | 記録 |
|---|---|---|
| 存在 | 生値・依存の不在、生成CSS、空Map、SHA祖先関係 | `verification-results.json` とPR本文 |
| 実行 | standards、lint、単体テスト、build、配布・completeness検査 | コマンド別exit codeをPR本文へ記録 |
| 動作 | caret/Itemの期待値、message-scrollerの状態別style、sidebar切替 | `browser-results.json` / `dynamic-results.json` |
| 画像 | 40枚のdecode・署名・寸法、catalogの被覆 | `image-manifest.json` / `catalog-results.json` |

## 画像の独立確認と限界

通常36枚の縮小一覧とcatalog両テーマの全高分割一覧、末尾900pxを目視した。プレビューの部品が描画され、catalog末尾にはToggle / Toggle Group / Tooltipが写っている。連結した4枚は全高27302pxを被覆した。通常36枚は1440×900、catalog系4枚は1440×27302、全40枚のJPEG署名はFF D8 FFでdecodeに成功した。

既存画像とのpixel差分比較、全propsの組合せ、全overlayの開閉、キーボード操作の網羅、reduced-motionの再検証は今回の範囲外。後続のcheck-evidence再実行とPR CIの結果は、このreportを変更せずPR本文に記録する。
