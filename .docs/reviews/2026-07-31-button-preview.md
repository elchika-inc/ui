# Button 隔離プレビュー実ブラウザ検証

検証した commit: 3a5d932406cd97ef8d3a53a58d27b51d9c3cb1b0

保存時の実体が JPEG だったため拡張子を実体に合わせた。画像の byte は撮影時のまま。

| route | light | dark | console | network | a11y tree | keyboard | 崩れ |
|---|---|---|---|---|---|---|---|
| / | ✅ index-light.jpg | ✅ index-dark.jpg | ✅ 0 件 | ✅ 失敗 0 件（favicon.ico の 404 を除く） | ✅ button 1 個 | ✅ Tab で到達 | ✅ |
| /preview/button/ | ✅ button-preview-light.jpg | ✅ button-preview-light-forced-dark.jpg | ✅ 0 件 | ✅ 失敗 0 件（favicon.ico の 404 を除く） | ✅ button 7 個 | ✅ Tab で到達 | ✅ |
| /preview/button-dark/ | ✅ button-preview-dark-forced-light.jpg | ✅ button-preview-dark.jpg | ✅ 0 件 | ✅ 失敗 0 件 | ✅ button 7 個 | ✅ Tab で到達 | ✅ |

## computed backgroundColor

| route | theme | backgroundColor |
|---|---|---|
| / | light | `oklch(1 0 0)` |
| / | dark | `oklch(0.145 0 0)` |
| /preview/button/ | light | `oklch(1 0 0)` |
| /preview/button/ | forced-dark | `oklch(0.145 0 0)` |
| /preview/button-dark/ | forced-light | `oklch(1 0 0)` |
| /preview/button-dark/ | dark | `oklch(0.145 0 0)` |

## 共通観測

- a11y tree で全 Button のアクセシブル名を確認し、プレビューの「送信中」は disabled として確認した。
- console の error / warning は全 scenario で 0 件だった。
- ページが参照する CSS / JS / フォント / 画像に失敗と 4xx / 5xx は無かった。ブラウザが自動試行した `/favicon.ico` の 404 だけを計画どおり除外した。
- Tab で最初の Button へ到達し、安定後のフォーカスリングは `oklch(0.556 0 0) 0px 0px 0px 3px`、透明合成レイヤーは 0 件だった。
- 横スクロールは全 scenario で発生せず、全 Button は幅・高さが 0 より大きく、文字色と背景色が同一の Button は 0 個だった。
