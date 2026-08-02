# Batch Final Task 9 R4 Catalog 横断動作検証レポート

verified_impl_sha: 3df37ed476863bbd863009af6892a7a16a7bdd6f

## 結論

- 判定: **PASS**
- Light / Darkを各3つのfresh target、計6/6で実測した。
- hydration後の`[data-catalog-preview]`は全runで期待集合61件と完全一致し、欠落、余剰、重複、不可視は0だった。
- batch4の19件は全runで19/19が各1section、正の矩形で表示された。
- catalog modeのoverlay、toast、sentinelは全runでDOM 0件・visible 0件だった。
- raw CDP eventをnavigation前から逐次購読し、固定長bufferを介さず全requestのresponse / failure終端を評価した。request=response、未終端0、全status 200だった。
- console error / warning、pageerror、network failure、4xx / 5xxは全run 0だった。

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
| viewport | 1440×900 CSS px |
| server | `127.0.0.1:3018`へ明示固定 |
| fresh build | `npm run build` exit 0、Astro 125 pages |

## 成功基準（実行前rubric）

1. Light / Darkを各3 fresh targetで実行する。
2. `src/previews/*.tsx`から機械導出した期待集合が61件で、hydrated集合と完全一致する。
3. 全sectionが正の矩形、display / visibility有効、hiddenなしである。
4. batch4 19件が各1件かつvisibleである。
5. overlay / toast / sentinelが自動表示されない。
6. raw CDP eventをnavigation前から逐次購読し、固定長buffer truncationなしで全requestの終端とstatusを評価する。
7. failure、未終端、4xx / 5xx、console / Runtime / Log errorが0である。

## 期待集合と3/3実測結果

期待61件は`src/previews/*.tsx`のbasenameからsortして機械導出した。batch4は`alert-dialog`, `attachment`, `button-group`, `calendar`, `carousel`, `chart`, `combobox`, `command`, `direction`, `field`, `input-group`, `item`, `menubar`, `message-scroller`, `pagination`, `sheet`, `sidebar`, `toast`, `toggle-group`の19件である。

| theme | fresh target | root / sections | 集合差分 | 不可視 | batch4 | overlay等 | resource | error |
|---|---:|---|---|---:|---:|---|---|---|
| Light | 3/3 | 各1 / 61 | 欠落0・余剰0・重複0 | 0 | 19/19 | 全0 | 173/173、172/172、172/172。loopback 172/172、171/171、171/171。全200 | 全0 |
| Dark | 3/3 | 各1 / 61 | 欠落0・余剰0・重複0 | 0 | 19/19 | 全0 | 各172/172。loopback各171/171。全200 | 全0 |

全runで`astro-island[ssr]=0`だった。次のselectorはDOM total / visibleとも0だった。

```text
[data-slot="alert-dialog-content"]
[data-slot="sheet-content"]
[data-slot="menubar-content"]
[data-slot="combobox-content"]
[data-slot="dialog-content"]
[data-slot="toast"]
[data-sonner-toast]
[data-sentinel]
```

resourceはCDP WebSocket event handlerで逐次受信したため、後読みbufferやcursorの容量上限を使用していない。全runでrequest=response、loopback request=response、`Network.loadingFailed=0`、未終端0、bad status 0だった。loopback外の1件はheadless Chrome側resourceで、これもresponseとstatusを評価した。

## JPEG証跡

Chrome DevTools Protocolの`Page.getLayoutMetrics`でfull-page寸法を取得し、`Page.captureScreenshot({ format: "jpeg", quality: 90, captureBeyondViewport: true, clip })`のbase64を変換せず`.jpg`へ直接保存した。

| 画像 | bytes | 寸法 | magic / format | SHA-256 |
|---|---:|---:|---|---|
| `2026-08-02-batch-final-r4-catalog-light.jpg` | 870,938 | 1440×9313 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `a39f29ce402862c2732f421fe1c3c55b2b79700aac53216d9068ff37ee097adb` |
| `2026-08-02-batch-final-r4-catalog-dark.jpg` | 884,114 | 1440×9313 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `146c97aa5f953f1d805d9f6c7faf8ec392e6860461ac75d6b70063c84de01e06` |

`file`、`sips`、magicが一致した。Light / Darkとも3列の61section全景が末尾Tooltipまで描画され、欠落、blank、途中描画、自動overlay遮蔽がないことを目視確認した。

## 三方向導出と未検証範囲

- コード: `src/previews/*.tsx`の全basename、catalogの`previewItems.map`、各Previewへの`mode="catalog"`を追跡した。
- 画面: hydrated name集合、各矩形、overlay selector、themeを実測した。
- 型: `PreviewMode = "isolated" | "catalog"`のcatalog経路と一致した。外部schemaは存在しない。
- 未検証: catalog内triggerを開いた後の各overlay操作、toast生成後の表示 / 消滅、isolated固有keyboard契約、mobile catalog、Safari / Firefox、スクリーンリーダー、pixel baseline比較。

## 再現手順

```bash
cd /Users/nishikawa/projects/elchika-inc/ui
git rev-parse HEAD
lsof -nP -iTCP:3018 -sTCP:LISTEN
npm run build
npm run preview -- --host 127.0.0.1 --port 3018
```

1. `/catalog/`と`/catalog-dark/`を各3 fresh targetで開く。
2. CDPのPage / Runtime / Network / Logをnavigation前にenableし、event handlerで全eventを逐次保持する。
3. hydration完了後、期待61件とactual集合、全矩形、batch4 19件、overlay / toast / sentinelを取得する。
4. request / response / failureの全対応とstatus、console / exceptionを照合する。
5. 3回目のtargetでCDPからfull-page JPEGを直接取得する。

## クリーンアップ

- 永続データ作成、外部送信、削除、課金なし。
- 全targetとheadless Chromeを終了し、CDP port 9228 LISTENなしを確認した。
- preview serverを停止し、3018 LISTENなし、停止後curl exit 7を確認した。
- 終了HEADとbranchは開始時から不変で、tracked / cached差分は0だった。
