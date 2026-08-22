# 動作再検証レポート: dashboard-table preview

verified_impl_sha: 6b1281483eb9a042ceb0b98208a00263847bc52b

## 結論

R1 で修正した table row の操作 semantics、header checkbox の mixed state、drawer の詳細表示を、light / dark の実ブラウザで再検証した。DnD は設計 §3-6 どおり非搭載のままで、npm 依存追加はない。

## 実行環境

- 検証日時: 2026-08-22 11:44–11:46 JST
- 対象 URL: `http://127.0.0.1:4322/preview/dashboard-table/`、`/preview/dashboard-table-dark/`
- browser: Playwright Chromium
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
| theme | light は `data-theme=light`、dark は `class=dark` / `data-theme=dark` |
| 重複 DOM ID | light / dark とも 0 件 |
| console / network | console error 0 件、観測した request は全件 200 |

prop の `data` 更新時に選択 ID と active row を現在データへ束縛する経路は、`scripts/dashboard-blocks.test.mjs` の回帰テストで検査した。

## 画像

- light: `dashboard-table-light.jpg`（1 行選択後、drawer を開いた状態）
- dark: `dashboard-table-dark.jpg`（drawer を開いた状態）

両画像を目視し、table、selection、drawer、chart の欠落、意図しない重なり、theme 不一致がないことを確認した。

## 既知の差分と未到達範囲

DnD による行の並べ替えは設計 §3-6 の決定に従い実装しない。全列の全方向ソート、全行の一括選択組み合わせ、実スクリーンリーダーによる読み上げは総当たりしていない。
