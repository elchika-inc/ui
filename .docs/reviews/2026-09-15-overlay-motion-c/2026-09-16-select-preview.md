verified_impl_sha: ec2d883a0940f17d9b82aed14e022578de305871

# select preview 実ブラウザ検証（overlay モーション統一 PR C）

## 成功基準と実行条件

正本は [委任仕様 §4 / §C](../../plans/2026-09-15-overlay-motion.md)。司令塔の追加裁定は PR 本文に記録する。

- 日付: 2026-09-16（JST）。Playwright 1.63.0 / headless Chromium 153.0.8010.12。
- viewport 1440×900、deviceScaleFactor 1、reducedMotion=no-preference。
- `npm run build:site`（exit 0、271ページ）の成果物を `npx astro preview --host 127.0.0.1 --port 4406` で配信した。
- navigation 前に console error / pageerror の収集を開始し、HTTP 200、Astro hydration、`document.fonts.ready` を確認した。
- 初期表示で Popup が開いている場合は Popup に focus して Escape で閉じてから、先頭の trigger をクリックする。
- open 操作前から MutationObserver で starting / ending / instant / activation-direction を収集し、open 安定後450msで computed style を測定した。
- close 操作は下表に記載する。16ms間隔で終了属性をポーリングし、終了 transition の後に Popup が表示から外れることを確認した。
- 生データは [browser-results.json](browser-results.json) の component=`select` に記録した。画像は開いた状態を各テーマ1枚撮影した。

## 存在・実行の実測

| theme | route | HTTP | preview selector 件数 | console error | pageerror | favicon error | dark class | 横 overflow |
|---|---|---:|---:|---:|---:|---:|---|---|
| light | `/preview/select/` | 200 | 1 | 0 | 0 | 0 | false | なし |
| dark | `/preview/select-dark/` | 200 | 1 | 0 | 0 | 0 | true | なし |

`preview-selectors.json` の selector は `[data-slot="select-content"]`、動作の実測対象は `[data-slot="select-content"]`。

## 動作の実測

| theme | open transition-duration | open transition-timing-function | transition-property | starting 観測 | open 直後 data-instant | close 操作 | close duration | ending 標本数 | ending 初観測→非表示（ms） |
|---|---|---|---|---|---|---|---|---:|---:|
| light | `0.26s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `opacity, scale` | あり | なし（null） | popup focus → Escape | `0.12s` | 9 | 144.300 |
| dark | `0.26s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `opacity, scale` | あり | なし（null） | popup focus → Escape | `0.12s` | 9 | 143.600 |

両テーマとも close の曲線は `cubic-bezier(0.16, 1, 0.3, 1)`。時間列は16msポーリングの観測差であり、CSSの宣言時間とは区別する。

### aligned 時の scale と close 終点

既定の `alignItemWithTrigger=true` で確認した。starting / ending の computed `scale` は両テーマとも全標本で `1` となり、変形せず opacity のみ変化した。open 安定後の `scale: none` も倍率1と等価である。

close の終点は司令塔裁定どおり `checkVisibility()=false` で判定した。両テーマとも同じ Popup は `isConnected=true` のまま保持され、親 Positioner が `hidden=true` / `display:none` になった。終了属性9標本と close `0.12s` / `opacity, scale` を観測してから非表示となった。DOMの削除とは記録していない。aligned=false の実ブラウザ検証は今回の preview の対象外。

通常の開く操作で両テーマとも `data-instant` が付かなかったため、共通テンプレの `data-instant:transition-none` を保持した。

## 証跡画像と判定範囲

- light: [2026-09-16-select-preview-light.jpg](2026-09-16-select-preview-light.jpg)（1440×900 / JPEG、SHA-256 `c611c1f69a5af78480a79f34ee750cbe591f060f25c1443351a252c6707193e2`）。
- dark: [2026-09-16-select-preview-dark.jpg](2026-09-16-select-preview-dark.jpg)（1440×900 / JPEG、SHA-256 `589bb15cbb25c48fe7b8b0c57e4395ee4d790c2ac6f7e7070e63723d10113efe`）。

存在（HTTP / selector）、実行（静的ビルドの描画・操作）、動作（computed style / 属性遷移 / 非表示化）まで実測した。両画像を個別に目視し、対象 Popup の欠落・切断・表示崩れを認めなかった。全props組合せ、全キーボード操作、モーション以外の挙動の網羅検証は対象外。
