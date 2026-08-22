# 動作再検証レポート: dashboard-table preview（R2）

verified_impl_sha: bf65ded6d1c5d0610d035e4213edbca0168d535a

## 結論

R2 で修正した table の selection 計算、data 更新時の状態束縛、非数値 metric の防御を検証した。light / dark の実ブラウザでは mixed selection と drawer chart が成立した。DnD は設計 §3-6 どおり非搭載で、npm 依存追加はない。

## 実行環境

- 検証日時: 2026-08-22 12:29–12:31 JST
- 対象 URL: `http://127.0.0.1:4322/preview/dashboard-table/`、`/preview/dashboard-table-dark/`
- browser: Playwright Chromium
- viewport: `1440x1000`
- 検証データ: `src/blocks/dashboard-01/data.json` の先頭 12 件

## 実測

| 確認項目 | 結果 |
|---|---|
| 初期行 | light / dark とも 12 件 |
| detail button | 各行に accessible name 付きで 12 件 |
| focusable `tr` | 0 件 |
| 一部選択 | 1 行選択後に `12 件を表示・1 件を選択` |
| header checkbox | `aria-checked="mixed"` / `data-indeterminate` |
| drawer | Document button から dialog が開き、title と進捗 chart を描画 |
| DnD affordance | light / dark とも `draggable=true` 0 件 |
| theme | light は `data-theme=light`、dark は `class=dark` / `data-theme=dark` |
| 重複 DOM ID | light / dark とも 0 件 |
| console / network | console error 0 件、観測した 157 request は全件 200 |

prop の `data` 更新時に選択 ID と active row を現在データへ束縛する経路、部分選択の mixed state、非数値 metric の安定 sort と chart fallback は、`scripts/dashboard-blocks.test.mjs` で実関数を呼んで検査した。実ブラウザ fixture の metric は全件数値文字列なので、非数値 fallback の描画自体は browser 未到達である。

## 画像

- light: `2026-08-22-dashboard-table-light.jpg`（1 行選択後、drawer を開いた状態）
- dark: `2026-08-22-dashboard-table-dark.jpg`（drawer を開いた状態）

両画像を目視し、table、selection、drawer、chart の欠落、意図しない重なり、theme 不一致がないことを確認した。

## 既知の差分と未到達範囲

DnD による行順の変更は設計 §3-6 の決定に従い実装しない。依存 / import、sortable context、drag handler、drag handle の不在は `scripts/dashboard-blocks.test.mjs` で機械検査した。全列の全方向ソート、全行の一括選択組み合わせ、実スクリーンリーダーによる読み上げは総当たりしていない。
