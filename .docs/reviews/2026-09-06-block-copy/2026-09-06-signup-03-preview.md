verified_impl_sha: 60d941edae9839bdfec65fb4d5dfe2b0d4719999

# signup-03 preview 実ブラウザー検証（文言・デモデータの日本語化）

## 検証方法

- 検証日: 2026-09-06。文言変更を含む実装commitより後のcommitを検証対象として固定した。
- `npm run build:site`（exit 0、271ページ）の成果物を `npx astro preview --host 127.0.0.1 --port 4394` で配信した。
- Playwright / headless Chromium（Chrome 152.0.7977.76、channel chrome、headless: true）/ viewport 1440×900 / deviceScaleFactor 1 / locale ja-JP。
- navigation前にconsole / pageerror listenerを登録し、対象selectorがvisibleになるまで待機。`document.fonts.ready`と600msの描画待ち後に測定し、各routeで新しくJPEG撮影した。
- selector: `[data-slot="signup-03-preview"]`。light / darkは別の隔離preview routeを個別に開いた。

## 実測結果

| theme | route | HTTP | selector件数 | lang | pageerror | console error | dark class | scrollWidth / clientWidth | toolbar |
|---|---|---:|---:|---|---:|---:|---|---|---:|
| light | `/preview/signup-03/` | 200 | 1 | `ja` | 0 | 0 | false | 1440 / 1440 | 0 |
| dark | `/preview/signup-03-dark/` | 200 | 1 | `ja` | 0 | 0 | true | 1440 / 1440 | 0 |

両テーマで `document.documentElement.lang === "ja"`、pageerror 0、`scrollWidth <= clientWidth` を実測した。

## モバイル幅の実測

同じrouteをviewport 390×844へ変更して再測定した。モバイル画像は仕様に従い作成しない。

| theme | scrollWidth | clientWidth | 横overflow |
|---|---:|---:|---|
| light | 390 | 390 | なし |
| dark | 390 | 390 | なし |

## 証跡画像

- light: [2026-09-06-signup-03-preview-light.jpg](2026-09-06-signup-03-preview-light.jpg) — 1440×900px / JPEG / magic bytes `FF D8 FF`。
- dark: [2026-09-06-signup-03-preview-dark.jpg](2026-09-06-signup-03-preview-dark.jpg) — 1440×900px / JPEG / magic bytes `FF D8 FF`。

## 判定と検証範囲

対象の存在（route・selector・画像ファイル）、実行（HTTP・hydration・pageerror）、表示動作（lang・テーマ・横overflow）を確認した。フォーム送信、全メニュー操作、全propsの組合せはこのreportの検証範囲に含めない。

このreportとlight / darkの2画像は同じcommitへ追加する。既存の証跡は変更・複製していない。
