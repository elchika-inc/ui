# 動作再検証レポート: dashboard-01 preview（R2）

verified_impl_sha: bf65ded6d1c5d0610d035e4213edbca0168d535a

## 結論

R2 で修正した chart の期間境界を、light / dark と mobile の実ブラウザで再検証した。両 theme で描画が成立し、mobile sidebar も dialog として開いた。console error、HTTP error、重複 DOM ID はなかった。

## 実行環境

- 検証日時: 2026-08-22 12:28–12:31 JST
- 対象 URL: `http://127.0.0.1:4322/preview/dashboard-01/`、`/preview/dashboard-01-dark/`
- browser: Playwright Chromium
- viewport: desktop `1440x1000`、mobile `390x844`
- 認証・外部データ: 不要

## 実測

| 確認項目 | light | dark |
|---|---|---|
| theme | `data-theme=light` | `class=dark` / `data-theme=dark` |
| navigation | Dashboard / Lifecycle / Analytics / Projects / Team が `href="#"` の anchor | 同左 |
| 初期期間 | `Total for the last 3 months` | 同左 |
| DnD affordance | `draggable=true` 0 件 | 0 件 |
| 重複 DOM ID | 0 件 | 0 件 |
| console error | 0 件 | 0 件 |
| network | 観測した request は全件 200 | 観測した request は全件 200 |

light で `Last 7 days` を実クリックし、説明が `Total for the last 7 days` へ変わることを確認した。7 / 30 / 90 日の両端を含む抽出件数と開始日は `scripts/dashboard-blocks.test.mjs` で実関数を呼び、7 日は 2024-06-24、30 日は 2024-06-01、90 日は 2024-04-02 から 2024-06-30 までになることを検査した。

mobile viewport では初期期間が 7 日へ切り替わり、`サイドバーを切り替える` button から sidebar dialog が開くことを確認した。

## 画像

- light: `2026-08-22-dashboard-01-light.jpg`
- dark: `2026-08-22-dashboard-01-dark.jpg`

両画像を目視し、sidebar、section cards、chart の欠落、意図しない重なり、theme 不一致がないことを確認した。

## 未到達範囲

全 navigation の遷移先は fixture の `#` なので遷移自体は行わず、anchor semantics と URL 反映を検査した。chart tooltip の全データ点は総当たりしていない。
