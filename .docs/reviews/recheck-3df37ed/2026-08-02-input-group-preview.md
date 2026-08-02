# InputGroup Task 9 R4 動作検証レポート

verified_impl_sha: 3df37ed476863bbd863009af6892a7a16a7bdd6f

## 結論

- 判定: **PASS**
- Light / Darkを各3つのfresh target、計6/6で実測した。
- textarea addonのbutton以外部分を実座標clickすると、`textarea[data-slot="input-group-control"][aria-label="共有メモ"]`がactiveElementになった。
- input addonの実座標clickでも従来どおり`input[aria-label="サイト内検索"]`へfocusした。
- copy buttonの実座標clickはbutton自身へfocusを残し、共有URL inputへredirectせず、statusを`コピーしました`へ変えた。
- console error / warning、pageerror、network failure、未終端、4xx / 5xxは全run 0だった。

## 実行環境

| 項目 | 実測値 |
|---|---|
| リポジトリ | `/Users/nishikawa/projects/elchika-inc/ui` |
| branch | `feat/batch-final` |
| 固定HEAD | 上記`verified_impl_sha` |
| 検証日時 | 2026-08-02 15:30〜15:48 JST |
| OS | macOS 26.3.1（Build 25D2128）、arm64 |
| Node.js / npm | v26.4.0 / 11.17.0 |
| Browser | Google Chrome 150.0.7871.187、raw CDP |
| server | `127.0.0.1:3018`へ明示固定 |
| fresh build | `npm run build` exit 0、Astro 125 pages |

## 成功基準（実行前rubric）

1. Light / Darkを各3 fresh targetで実行する。
2. textarea addonのbutton以外部分clickで共有メモtextareaへfocusする。
3. input addon clickでサイト内検索inputへfocusする。
4. copy button click後もbutton自身がactiveElementで、共有URL inputへfocusを奪われない。
5. copy handlerの実体としてstatusが`コピーしました`へ変化する。
6. requestとresponseが全件対応し、failure、未終端、4xx / 5xx、console / Runtime / Log errorが0である。

## 3/3実測結果

| theme | fresh target | textarea addon→textarea | input addon→input | copy button維持 / handler | resource | error |
|---|---:|---|---|---|---|---|
| Light | 3/3 | 3/3 | 3/3 | 3/3、`コピーしました` | 各31 request / 31 response、全status 200 | 全0 |
| Dark | 3/3 | 3/3 | 3/3 | 3/3、`コピーしました` | 各31 request / 31 response、全status 200 | 全0 |

clickは`Input.dispatchMouseEvent`のpress / releaseを対象矩形内座標へ送った。textarea addonでは右端寄りのbuttonでない余白を選び、copy buttonは`button[aria-label="URLをコピー"]`自体を選んだ。

## JPEG証跡

Chrome DevTools Protocolの`Page.getLayoutMetrics`でfull-page寸法を取得し、`Page.captureScreenshot({ format: "jpeg", quality: 90, captureBeyondViewport: true, clip })`のbase64を変換せず`.jpg`へ直接保存した。

| 画像 | bytes | 寸法 | magic / format | SHA-256 |
|---|---:|---:|---|---|
| `2026-08-02-input-group-preview-light.jpg` | 20,297 | 1280×900 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `066810a763fde8316977babd5195f72cfa82b1dee0f54d93850bbc0cfb1ebb04` |
| `2026-08-02-input-group-preview-dark.jpg` | 20,787 | 1280×900 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `a954c6811839bcbaefda292de015355d0ae3ab8ec8bad162539c5e0307441505` |

`file`、`sips`、magicが一致した。Light / Darkとも検索input、共有URL inputとcheck icon、共有メモtextarea、`コピーしました`statusが描画され、blankや途中描画でないことを目視確認した。

## 三方向導出と未検証範囲

- コード: addonの`closest("button")` early return、control query、copy handlerのstate変更を分離して導出した。
- 画面: addon / input / textarea / button / statusの操作可能要素とactiveElementを実測した。
- 型: addonが汎用`div` props、controlがinput / textarea props、buttonがButton propsを受ける契約に一致した。外部schemaは存在しない。
- 未検証: addon内に複数controlがある非標準構成、disabled / invalid、block-end、keyboardだけでaddonを操作する経路、Safari / Firefox、スクリーンリーダー読み上げ、pixel baseline比較。

## 再現手順

```bash
cd /Users/nishikawa/projects/elchika-inc/ui
git rev-parse HEAD
lsof -nP -iTCP:3018 -sTCP:LISTEN
npm run build
npm run preview -- --host 127.0.0.1 --port 3018
```

1. `/preview/input-group/`と`/preview/input-group-dark/`を各3 fresh targetで開く。
2. CDPのPage / Runtime / Network / Logをnavigation前にenableする。
3. textarea addon、input addon、copy buttonを順に実座標clickし、各activeElementとstatusを取得する。
4. 全CDP eventを逐次購読し、request / response / failureとconsole / exceptionを照合する。
5. 3回目のtargetでCDPからJPEGを直接取得する。

## クリーンアップ

- 永続データ作成、外部送信、削除、課金なし。copy操作はローカルReact stateのみでClipboard APIを呼ばない。
- 全targetとheadless Chromeを終了し、CDP port 9228 LISTENなしを確認した。
- preview serverを停止し、3018 LISTENなし、停止後curl exit 7を確認した。
- 終了HEADとbranchは開始時から不変で、tracked / cached差分は0だった。
