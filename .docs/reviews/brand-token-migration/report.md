verified_impl_sha: 41e6b9b17734a752825e14c9af97e69b76c51bc3
evidence_scope: shared-token-migration
targeted_dynamic_sha: f022b7ceca51604d09cefe052981240cd4d37dd3

# ブランドトークン移行 実ブラウザ検証

## 対象と環境

- 初回横断検証: 2026-08-03（run取得 2026-08-02T23:33:57.217Z）、固定SHA `41e6b9b17734a752825e14c9af97e69b76c51bc3`
- Chart scoped再検証: 2026-08-03T09:59:16+0900、固定SHA `f022b7ceca51604d09cefe052981240cd4d37dd3`
- 環境: macOS / Chrome 150.0.7871.187 / Node.js v26.4.0
- 初回viewport: 1512×828 CSS px / DPR 2。Chart scoped viewport: 1512×982 CSS px / DPR 2

runtime CSSの `src/styles/global.css` と `src/styles/design-system/tokens.css` は初回検証SHAより前に確定し、Chart scoped再検証まで変更されていない。27 componentと共有routeの初回画像は `41e6b9b…`、Chartの最新component画像は `f022b7c…` に束縛する。

## 横断結果

- changed component 27件をlight/darkで走査し、各component reportとJPEGを新規追加した。
- catalogはlight/darkともmanifestの61/61 previewを一意に列挙し、missing/extra 0、console error 0、horizontal overflowなしだった。
- forced themeは各routeで `.dark` と `data-theme` を同じevaluate内で切り替え、light/darkとも同期した。
- AlertDialog / Dialog / Drawer / Sheetのoverlayはblack 10%と `backdrop-filter: blur(4px)` を維持し、open contentとfocus stateを確認した。
- Input / Textarea / NativeSelect / InputGroupのdisabled描画を確認した。NativeSelectはwrapper opacity 1 / control opacity `--opacity-disabled`、InputGroupはwrapper opacity `--opacity-disabled` / control opacity 1の契約で二重合成を避ける。ただしdisabled InputGroup自体は現previewから未到達だった。
- Select placeholderとInputはlight/darkとも同じopaque control surface / borderへ解決した。disabled Selectはpointer前後で `background-image: none` を維持した。
- Chartは初回検証でRecharts animationが5 dash patternをpath-length dashへ上書きする欠陥を検出した。配布 `ChartLine` を修正後、最新light/dark画像と実DOMで `none` / `6 3` / `2 3` / `10 4 2 4` / `1 4` をfresh load後も維持した。

## 配色とcontrast

`node scripts/contrast.mjs` はexit 0だった。browser computed colorによる実測とsensorの同じcaseを照合した。

| Contract | Light | Dark | 判定 |
|---|---:|---:|---|
| primary hover sensor | 10.2087:1 | 7.3722:1 | AA |
| destructive subtle | 5.0268:1 | 5.5512:1 | AA |
| destructive subtle hover | 4.5687:1 | 4.5892:1 | AA |
| solid destructive menu focus sensor | 6.1338:1 | 5.9377:1 | AA |
| invalid control boundary | 6.1338:1 | 5.9377:1 | nontext 3:1以上 |
| Tabs inactive muted | 4.8887:1 | 5.2125:1 | AA |
| disabled Input | 2.4257:1 | 3.4200:1 | disabled-exempt、観測のみ |

Attachment / Alertのdestructive textはalphaなしで、browser computed pairはlight 6.1338:1 / dark 5.9377:1だった。solid menu focusのAAを保つため `destructive` aliasは `color-status-danger-text` を参照し、`color-status-danger` はsubtle / indicator用途で継続する。

## 証跡画像

- 各changed component: `2026-08-02-<name>-preview-light.jpg` / `-dark.jpg`
- aggregate: `catalog-*`、`alert-dialog-*`、`sheet-*`、`disabled-controls-*`
- Chart欠陥検出時: `chart-light.jpg` / `chart-dark.jpg`
- Chart修正後: `2026-08-03-chart-preview-light.jpg` / `-dark.jpg`

画像はChrome DevTools Protocol `Page.captureScreenshot` の `format: jpeg` で直接取得し、`.jpg` 拡張子とJPEG magic bytes `ffd8ff` の一致、寸法、非空、目視を確認した。既存証跡は上書きしていない。

## 未測定と後続

- ContextMenu / DropdownMenu / Menubarのdestructive item、Badge / BubbleContentのinteractive hover、disabled InputGroupは公開APIに存在するが現previewから到達できず、browser computed stateは未測定である。
- 上記を件数固定せず同型stateまで走査する後続を `.docs/actions/next-session-expand-preview-reachable-states.md` に登録した。
- dash propなしの一般 `ChartLine` animationはsource contractのみで、browser fixtureから未到達である。
- vendored `design-tokens.html` のtypeなしbutton、noninteractive `div[tabindex]`、Clipboard API rejectを空handlerで握りつぶす挙動は、配布CSSに影響しないv1.8側の改善候補である。

## 見た範囲 / 見ていない範囲

- 見た範囲: changed component light/dark、catalog全manifest、exact visual contract、利用可能なpointer/keyboard/open/disabled state、theme同期、computed style、contrast、console、overflow、JPEG実体。
- 見ていない範囲: 未測定欄のpreview未到達state、初回1512×828とChart 1512×982以外のviewport、assistive technology固有の読み上げ、vendored spec page自体の修正。
- `/favicon.ico` 404だけはブラウザ自動要求として正本の明示例外に従いcomponent実行経路外へ分離した。他URLのfailureは除外していない。
