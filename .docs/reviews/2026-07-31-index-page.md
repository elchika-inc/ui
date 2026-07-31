# トップページ実ブラウザ再検証

検証した commit: `5aa8ae85b4dec1da87dab03a9d9ce42fbb1ae265`

使用ポート: `3012`

| route | theme | screenshot | console | network | DOM / a11y tree | keyboard | 横スクロール | 矩形 | 色 |
|---|---|---|---|---|---|---|---|---|---|
| `/` | light | ✅ `index-catalog-light.png` | ✅ 0 件 | ✅ 失敗 0 件、HTTP 4xx / 5xx 0 件 | ✅ main 1、h1 1、名前付き navigation 1、名前付き link 2、button 0 | ✅ Tab で `Button — light` へ到達。不透明な `oklch(0.556 0 0)` の 3px ring | ✅ `1512 / 1512` | ✅ link `103.171875 × 20.5` / `104.2265625 × 20.5`、main `1512 × 828` | ✅ background `oklch(1 0 0)`、foreground `oklch(0.145 0 0)`、link `oklch(0.205 0 0)` |
| `/` | forced-dark | ✅ `index-catalog-dark.png` | ✅ 0 件 | ✅ テーマ切替による追加失敗 0 件 | ✅ light と同じ構造。`Button — light` の focus も維持 | ✅ light で到達した focus と不透明な 3px ring を dark 強制後も維持 | ✅ `1512 / 1512` | ✅ link `103.171875 × 20.5` / `104.2265625 × 20.5`、main `1512 × 828` | ✅ background `oklch(0.145 0 0)`、foreground `oklch(0.985 0 0)`、link `oklch(0.922 0 0)` |

## リンク契約

- `Button — light` → `/preview/button/`
- `Button — dark` → `/preview/button-dark/`

## 共通観測

- `<html lang="ja">` と `<title>elchika-inc/ui</title>` を実ブラウザで確認した。
- light と forced-dark で `backgroundColor` が異なることを確認した。
- 本文とリンクの文字色は各テーマの背景色と異なり、すべての矩形は幅・高さが 0 より大きかった。
- 初回 load の document、CSS、font、`favicon.svg` はすべて 200 / 304 だった。`/favicon.ico` の 404 は発生せず、除外した request は 0 件だった。
- dark class は証跡取得後に除去し、ブラウザタブと `serve dist` を終了した。
