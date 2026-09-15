verified_impl_sha: 9f86ac173db171442c56e50763205bd0211c1cc5

# collapsible preview 実ブラウザ検証（overlay モーション統一 PR D）

## 成功基準と手順

正本は [委任仕様 §4 / §D](../../plans/2026-09-15-overlay-motion.md)。実装 commit を固定して検証した。

- 日付: 2026-09-16（JST）。Playwright 1.63.0 / headless Chromium 153.0.8010.12 / viewport 1440×900 / deviceScaleFactor 1 / reducedMotion=no-preference。
- `npm run build:site`（exit 0、271ページ）の成果物を `npx astro preview --host 127.0.0.1 --port 4398` で配信した。起動前に同ポートが未使用であることを確認した。
- navigation 前に console error / pageerror listener を登録し、preview selector の表示、Astro hydration、document.fonts.ready を待った。
- preview selector は `preview-selectors.json` の `[data-slot="collapsible-preview"]`、実測対象は `[data-slot="collapsible-content"]`。
- 操作: 初期 open を trigger click で閉じて650ms待ち、同じ trigger click で開く。撮影後に再度 trigger click で閉じる。
- open 直後の属性は MutationObserver と click 直後の読み取り、安定した computed style は open 後500msで記録した。close は16ms間隔の属性ポーリングを850ms続け、ending 属性と、その後の DOM 削除を観測した。
- 各テーマを独立した BrowserContext で検証し、表示中の JPEG を撮影した。属性と時刻の生データは [browser-results.json](browser-results.json) の当該 component / theme を参照。

## 存在・実行・動作の実測

| theme | route | HTTP | preview selector 件数 | console error | pageerror | favicon error | dark class | 横 overflow |
|---|---|---:|---:|---:|---:|---:|---|---|
| light | `/preview/collapsible/` | 200 | 1 | 0 | 0 | 0 | false | なし |
| dark | `/preview/collapsible-dark/` | 200 | 1 | 0 | 0 | 0 | true | なし |

| theme | open transition-duration | transition-timing-function | transition-property | open height | ending 観測数 | ending 初観測→DOM削除（ms） | starting 観測 | open 直後 data-instant |
|---|---|---|---|---|---:|---:|---|---|
| light | `0.26s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `height` | `32px` | 19 | 298.300 | あり | なし（false / null） |
| dark | `0.26s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `height` | `32px` | 19 | 299.000 | あり | なし（false / null） |

close の宣言時間・曲線も open と同値。全テーマで ending 属性の観測後に DOM が消えた。上表の観測時間は16msポーリングの実測であり、CSS宣言時間とは区別する。

## 証跡画像

- light: [2026-09-16-collapsible-preview-light.jpg](2026-09-16-collapsible-preview-light.jpg)（1440×900 / JPEG）。
- dark: [2026-09-16-collapsible-preview-dark.jpg](2026-09-16-collapsible-preview-dark.jpg)（1440×900 / JPEG）。

## 判定と限界

存在（HTTP / selector）、実行（static build の描画・click 操作）、動作（computed style / ending 属性 / DOM削除）を実測し、§4.5 の期待値と一致した。画像は個別に目視し、対象の欠落・切断・表示崩れがないことを確認した。全 props の組合せ、全キーボード操作、toast の全 swipe 方向と stack 操作は今回の動作検証に含めていない。
