# 動作検証レポート: dashboard-01 preview

verified_impl_sha: 10574aa56ef00aafcd9dcb6bd51ad188ac3e42fe

## 結論

build 後の実装コミットから dev server を起動し、実 Chrome で light / dark / mobile / catalog を検証した。dashboard-01 の sidebar、header、section cards、chart は両 theme で描画され、mobile sidebar も実操作で開閉できた。

- light / dark selector: 各 1 件
- sidebar: 各 1 件
- chart: 各 1 件、area path 4 件
- section card: 各 5 件
- pageerror / console error / HTTP 4xx・5xx / request failure: 0 件
- isolated preview の重複 DOM ID: 0 件
- desktop body overflow: light / dark とも `clientWidth=1512`、`scrollWidth=1512`
- mobile body overflow: `clientWidth=390`、`scrollWidth=390`

## 実行環境

- 検証日時: 2026-08-22 10:07–10:19 JST
- 対象 URL: `http://127.0.0.1:4322`
- desktop viewport: 1512×828
- mobile viewport: 390×844
- 認証・検証データ: 不要

## light / dark

| theme | selector | sidebar | chart | card | 重複 ID | 通信・実行時エラー |
|---|---:|---:|---:|---:|---:|---:|
| light | 1 | 1 | 1 | 5 | 0 | 0 |
| dark | 1 | 1 | 1 | 5 | 0 | 0 |

Chart は両 theme で area path 4 件と 90 日範囲の tick 14 件を確認してから、fresh tab で 1 回だけ full-page capture した。viewport 切替を繰り返した tab の stale compositor snapshot は合格根拠に用いていない。

- light: `2026-08-22-dashboard-01-light.jpg`
- dark: `2026-08-22-dashboard-01-dark.jpg`

4 枚の Phase 3 component 画像を原寸で目視し、dashboard-01 では主要要素の欠落、意図しない重なり、クリップ、theme 不一致がないことを確認した。

## mobile sidebar

390×844 で `サイドバーを切り替える` button をクリックした。

- 操作前の page overflow: `390 / 390`
- 操作後の dialog: 1 件
- mobile sidebar: 1 件
- Escape 後の dialog: 0 件
- console error: 0 件

## catalog

hydration 安定待ち 4 秒後に `/catalog/` と `/catalog-dark/` を検査した。

- `dashboard-01` preview: light / dark とも 1 件
- `dashboard-table` preview: light / dark とも 1 件
- 固定 DOM ID / SVG gradient ID の重複: light / dark とも 0 件
- HTTP 4xx・5xx / request failure / Runtime exception / console error: 0 件

## 未到達範囲

sidebar 内の全リンク遷移、user menu の全項目、chart tooltip の全データ点は今回の必須範囲外として総当たりしていない。
