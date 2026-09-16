verified_impl_sha: 096fbc8b01d5fbbf232b5af2a99e13332e8fa6d3
evidence_scope: shared-token-migration
targeted_dynamic_sha: 096fbc8b01d5fbbf232b5af2a99e13332e8fa6d3

# マイクロインタラクション PR 3-0 の共有面検証

## 成功基準と実装

正本は [委任仕様 §4・§A](../../plans/2026-09-16-micro-interactions.md)。共有面14 subject × light/darkの28枚に、navigation-menuの2枚を加えた。drawerの2枚は共有面と部品reportで共用する。

- 共有CSS commit: `de7fd065137c2df35d4dba3f52180c654c4cf2ed`。
- 部品 commit: `096fbc8b01d5fbbf232b5af2a99e13332e8fa6d3`。共有CSS commitの厳密な子孫で、全画像・動的検証がこの実装を対象とする。
- 変更は `transition-state` / `--animate-shake` の追加、drawer Popupのeasing置換、navigation-menu Trigger / Linkの状態遷移とIndicatorの接続。

## 環境と再現手順

2026-09-16（JST）、macOS、Astro 7.1.6。Playwright MCPから `browserType().launch({channel: "chrome", headless: true})` でChromium 153.0.8010.48を新規起動。viewport 1440×900、deviceScaleFactor 1、reducedMotion `no-preference`。`npm run build:site` はexit 0、271ページ。配信は以下。

```bash
npx astro preview --host 127.0.0.1 --port 62298
```

1. navigation前にconsole error / pageerrorのlistenerを登録する。
2. `astro-island[ssr]` が無くなるまでhydrationを待ち、`preview-selectors.json` のselector先頭がvisibleになるまで待つ。`document.fonts.ready` と600msを待ってselector件数、dark class、横overflow、dev toolbarを測る。
3. 通常26枚は `page.screenshot({type: "jpeg", quality: 90, animations: "disabled", scale: "css"})`。drawerとnavigation-menuは別reportの操作で閉じてから開き直した状態を撮影する。
4. catalogとdisabled-controlsは同じcatalog routeを別々に撮影する。高さ27302、viewport高さ900の31タイルを各画像に使う。スクロール後250ms待って実測Yを確認し、不一致時は最大3回まで再試行する。全124タイルが初回で期待位置と一致し、撮影後のYも一致した。末尾Yは26402。
5. 実測YでPNGタイルを連結し、被覆に隙間がないことを確認してJPEG quality 95 / subsampling 0で保存する。画像のリサイズ・加筆・色補正は行わない。各末尾の可視fixed/sticky要素は0件、disabled属性を持つ要素は17件。

連結の被覆検査は以下の条件を満たした。

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

## 表示結果

全30件でHTTP 200、selector 1件以上、component console error 0件、pageerror 0件、横overflowなし、dev toolbar 0件。dark classはlightでfalse、darkでtrue。favicon 404は下表で分離した。

| subject | theme | route | selector件数 | console / favicon / pageerror | 画像 |
|---|---|---|---:|---|---|
| alert-dialog | light | `/preview/alert-dialog/` | 1 | 0 / 1 / 0 | [2026-09-16-alert-dialog-preview-light.jpg](2026-09-16-alert-dialog-preview-light.jpg) |
| alert-dialog | dark | `/preview/alert-dialog-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-alert-dialog-preview-dark.jpg](2026-09-16-alert-dialog-preview-dark.jpg) |
| attachment | light | `/preview/attachment/` | 1 | 0 / 0 / 0 | [2026-09-16-attachment-preview-light.jpg](2026-09-16-attachment-preview-light.jpg) |
| attachment | dark | `/preview/attachment-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-attachment-preview-dark.jpg](2026-09-16-attachment-preview-dark.jpg) |
| menubar | light | `/preview/menubar/` | 1 | 0 / 0 / 0 | [2026-09-16-menubar-preview-light.jpg](2026-09-16-menubar-preview-light.jpg) |
| menubar | dark | `/preview/menubar-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-menubar-preview-dark.jpg](2026-09-16-menubar-preview-dark.jpg) |
| select | light | `/preview/select/` | 1 | 0 / 0 / 0 | [2026-09-16-select-preview-light.jpg](2026-09-16-select-preview-light.jpg) |
| select | dark | `/preview/select-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-select-preview-dark.jpg](2026-09-16-select-preview-dark.jpg) |
| button | light | `/preview/button/` | 11 | 0 / 0 / 0 | [2026-09-16-button-preview-light.jpg](2026-09-16-button-preview-light.jpg) |
| button | dark | `/preview/button-dark/` | 11 | 0 / 0 / 0 | [2026-09-16-button-preview-dark.jpg](2026-09-16-button-preview-dark.jpg) |
| bubble | light | `/preview/bubble/` | 1 | 0 / 0 / 0 | [2026-09-16-bubble-preview-light.jpg](2026-09-16-bubble-preview-light.jpg) |
| bubble | dark | `/preview/bubble-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-bubble-preview-dark.jpg](2026-09-16-bubble-preview-dark.jpg) |
| dialog | light | `/preview/dialog/` | 1 | 0 / 0 / 0 | [2026-09-16-dialog-preview-light.jpg](2026-09-16-dialog-preview-light.jpg) |
| dialog | dark | `/preview/dialog-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-dialog-preview-dark.jpg](2026-09-16-dialog-preview-dark.jpg) |
| badge | light | `/preview/badge/` | 6 | 0 / 0 / 0 | [2026-09-16-badge-preview-light.jpg](2026-09-16-badge-preview-light.jpg) |
| badge | dark | `/preview/badge-dark/` | 6 | 0 / 0 / 0 | [2026-09-16-badge-preview-dark.jpg](2026-09-16-badge-preview-dark.jpg) |
| alert | light | `/preview/alert/` | 2 | 0 / 0 / 0 | [2026-09-16-alert-preview-light.jpg](2026-09-16-alert-preview-light.jpg) |
| alert | dark | `/preview/alert-dark/` | 2 | 0 / 0 / 0 | [2026-09-16-alert-preview-dark.jpg](2026-09-16-alert-preview-dark.jpg) |
| sheet | light | `/preview/sheet/` | 1 | 0 / 0 / 0 | [2026-09-16-sheet-preview-light.jpg](2026-09-16-sheet-preview-light.jpg) |
| sheet | dark | `/preview/sheet-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-sheet-preview-dark.jpg](2026-09-16-sheet-preview-dark.jpg) |
| tabs | light | `/preview/tabs/` | 1 | 0 / 0 / 0 | [2026-09-16-tabs-preview-light.jpg](2026-09-16-tabs-preview-light.jpg) |
| tabs | dark | `/preview/tabs-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-tabs-preview-dark.jpg](2026-09-16-tabs-preview-dark.jpg) |
| drawer | light | `/preview/drawer/` | 1 | 0 / 1 / 0 | [2026-09-16-drawer-preview-light.jpg](2026-09-16-drawer-preview-light.jpg) |
| drawer | dark | `/preview/drawer-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-drawer-preview-dark.jpg](2026-09-16-drawer-preview-dark.jpg) |
| catalog | light | `/catalog/` | 1 | 0 / 0 / 0 | [2026-09-16-catalog-preview-light.jpg](2026-09-16-catalog-preview-light.jpg) |
| catalog | dark | `/catalog-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-catalog-preview-dark.jpg](2026-09-16-catalog-preview-dark.jpg) |
| disabled-controls | light | `/catalog/` | 1 | 0 / 0 / 0 | [2026-09-16-disabled-controls-light.jpg](2026-09-16-disabled-controls-light.jpg) |
| disabled-controls | dark | `/catalog-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-disabled-controls-dark.jpg](2026-09-16-disabled-controls-dark.jpg) |
| navigation-menu | light | `/preview/navigation-menu/` | 1 | 0 / 0 / 0 | [2026-09-16-navigation-menu-preview-light.jpg](2026-09-16-navigation-menu-preview-light.jpg) |
| navigation-menu | dark | `/preview/navigation-menu-dark/` | 1 | 0 / 0 / 0 | [2026-09-16-navigation-menu-preview-dark.jpg](2026-09-16-navigation-menu-preview-dark.jpg) |

## 生成CSSとコマンド実測

生成CSSは `dist/_astro/global.BPAn7D1u.css`。次の2ルールを各1件確認した。

```css
.transition-state{transition:var(--state-transition)}
.animate-shake{animation:shake calc(var(--duration-micro) * 4) var(--curve-standard)}
```

| 検査 | 結果 | exit |
|---|---|---:|
| standards | 248ファイル、motion-literal 0件 | 0 |
| drawer cubic-bezier 負の検査 | origin/main 1件、変更後0件 | 0 / 1 |
| navigation-menu transition-all 負の検査 | origin/main 2件、変更後0件 | 0 / 1 |
| lint | 486ファイル、201 warnings / 3 infos、修正なし | 0 |
| build:site | 271ページ | 0 |
| standards単体テスト | 72/72 pass、fail / skipped 0 | 0 |
| CSS transition-state | 上記1ルール | 0 |
| CSS @starting-style | 1行 | 0 |
| CSS animate-shake | 上記1ルール | 0 |
| CSS @keyframes shake | 1行 | 0 |
| 元CSS @keyframes shake / --animate-shake | 各1行 | 各0 |

件数の検索は§4の式を個別に実行し、pipe / コマンド連結を使わなかった。表に無い負の検査の組合せはN/A。全件テスト・typecheck・check:allは指示どおりローカルでは実行せず、PR CIを用いる。check-evidenceのcommit前後の結果とレビュー収束後の再検査値はPR本文に記録する。

## 動作と画像の独立確認

- [drawerの実測](2026-09-16-drawer-preview.md): 開き直したPopupは `0.5s` / `cubic-bezier(0.16, 1, 0.3, 1)`。開くtransformは500ms、閉じるheight / transformは400ms。終了属性を観測後、DOMから消失した。
- [navigation-menuの実測](2026-09-16-navigation-menu-preview.md): Trigger / Linkの4状態プロパティは120ms / standard。Indicatorは `data-popup-open` の付与・解除に合わせてopacity 0→1→0、開閉とも260ms / entrance。
- 全30枚のJPEG署名 `FF D8 FF`、デコード成功、寸法を独立に確認。通常26枚は1440×900、catalog系4枚は1440×27302、合計16954537 bytes。
- 通常26枚の一覧、catalog両テーマの全31タイルの一覧、末尾900pxを目視した。プレビューの部品が描画され、末尾にはToggle / Toggle Group / Tooltipが写っている。

## 検証範囲

| 段階 | 対象 |
|---|---|
| 存在 | CSSルール、元CSS定義、classの負検査、selector、画像形式・寸法 |
| 実行 | standards、lint、build、standards単体72件、HTTP、console / pageerror |
| 動作 | drawerのcomputed / getAnimations / ending属性→消失、navigation-menuのcomputed / getAnimations / popup-open→opacity |
| 画像 | 共有面28枚とnavigation-menu 2枚、catalog全高のタイル被覆と目視 |

共有面の他のoverlayは既存previewの初期open表示を確認した。全overlayの開閉、全props、swipe / snap points / nested drawer、全キーボード操作、reduced-motionの実動作、既存画像とのpixel差分比較は今回の測定範囲に含めない。レビューはコードの静的確認でありブラウザ実測の代替ではない。
