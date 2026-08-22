# 動作再検証レポート: dashboard-01 preview

verified_impl_sha: 6b1281483eb9a042ceb0b98208a00263847bc52b

## 結論

R1 で修正した navigation link、chart の UTC 日付処理、選択期間の説明を、light / dark の実ブラウザで再検証した。両 theme で描画が成立し、console error、HTTP error、重複 DOM ID はなかった。

## 実行環境

- 検証日時: 2026-08-22 11:43–11:45 JST
- 対象 URL: `http://127.0.0.1:4322/preview/dashboard-01/`、`/preview/dashboard-01-dark/`
- browser: Playwright Chromium
- 認証・外部データ: 不要

## 実測

| 確認項目 | light | dark |
|---|---|---|
| theme | `data-theme=light` | `class=dark` / `data-theme=dark` |
| navigation | Dashboard / Lifecycle / Analytics / Projects / Team が `href="#"` の anchor | 同左 |
| 重複 DOM ID | 0 件 | 0 件 |
| console error | 0 件 | 0 件 |
| network | 観測した request は全件 200 | 観測した request は全件 200 |

light で `Last 30 days` を実クリックし、pressed 状態が同 button へ移り、説明が `Total for the last 30 days`、chart tick が `Jun 2` から `Jun 30` になったことを確認した。日付文字列の比較と表示は UTC に統一されている。

## 画像

- light: `dashboard-01-light.jpg`
- dark: `dashboard-01-dark.jpg`

両画像を目視し、sidebar、section cards、chart の欠落、意図しない重なり、theme 不一致がないことを確認した。

## 未到達範囲

全 navigation の遷移先は fixture の `#` なので遷移自体は行わず、anchor semantics と URL 反映を検査した。chart tooltip の全データ点は総当たりしていない。
