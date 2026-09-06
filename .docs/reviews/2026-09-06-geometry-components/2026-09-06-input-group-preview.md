verified_impl_sha: cc547672fb248eb51c45a7b972ce2ac0cefda982

# input-group preview 実ブラウザ検証（幾何レイヤー）

## 検証方法

- 検証日: 2026-09-06。実装 commit `56abdb762edff97b46855d5631b87b228eee4cdc` の後の SHA を固定した。
- `npm run build:site`（exit 0、271ページ）の成果物を `npx astro preview --host 127.0.0.1 --port 4393` で配信した。疎通確認の `curl -sI http://127.0.0.1:4393/` は exit 0 / HTTP 200。
- Playwright MCP / headless Chromium（Chrome 152.0.7977.76、channel chrome）/ viewport 1440×900 / deviceScaleFactor 1。
- navigation 前に console / pageerror listener を登録し、各 route の selector が visible になるまで待った。`document.fonts.ready` と600msの描画待ち後に測定した。
- selector: `[data-slot="input-group-preview"]`。light / dark は隔離 preview route を個別に開いた。

## 実測結果

| theme | route | HTTP | selector 件数 | console 総数 / favicon 除外後 | pageerror | dark class | 横 overflow | toolbar |
|---|---|---:|---:|---:|---:|---|---|---:|
| light | `/preview/input-group/` | 200 | 1 | 0 / 0 | 0 | false | なし | 0 |
| dark | `/preview/input-group-dark/` | 200 | 1 | 0 / 0 | 0 | true | なし | 0 |

favicon.ico の404は配信資産の既知の欠落として分離した。両テーマで主文書の高さは900pxで、viewport内を JPEG 撮影した。

## 証跡画像

- light: [2026-09-06-input-group-preview-light.jpg](2026-09-06-input-group-preview-light.jpg) — 1440×900px / JPEG / magic bytes `FF D8 FF`。
- dark: [2026-09-06-input-group-preview-dark.jpg](2026-09-06-input-group-preview-dark.jpg) — 1440×900px / JPEG / magic bytes `FF D8 FF`。

## 判定と検証範囲

両テーマで対象の存在、表示の実行、console / pageerror / 横 overflow / JPEG形式を確認し、目視で欠落・重なり・切断の重大な異常を認めなかった。画像は共有証跡からの複製ではなく、各 route で新規撮影した。このreportと2画像は同じcommitへ追加する。

存在確認と表示の実行を測定し、computed style は記載した項目だけを動作として実測した。キーボード操作全般・全 props 組合せ・入力送信の検証は含まない。共有トークンの合否条件と生の shadow の扱いは [共有report](../2026-09-06-geometry-layer/report.md) を参照する。
