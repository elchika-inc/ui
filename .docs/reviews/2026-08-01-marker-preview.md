# Marker プレビュー実ブラウザ検証

検証した実装 commit: `78d685458def8ef64e3219d400b24f9130d272e8`

## 検証条件

- 配信: `npm run dev -- --host 127.0.0.1 --port 4325`
- ブラウザ: Chrome、full-page screenshot
- selector: `[data-slot="marker-preview"]`
- 操作: なし。静的な default / separator / border Marker の初期描画を確認した
- catalog は開かず、バッチ末尾の横断確認へ残した

## 検証結果

| route / theme | selector / console | slot / variant / text semantics | 寸法・radius・semantic token | screenshot |
| --- | --- | --- | --- | --- |
| `/preview/marker/` light | selector 1件、console error / warning 0件 | marker 3、marker-icon 1、marker-content 3。default / separator / border を各1件。Marker は全件 `div`、icon は `aria-hidden="true"` の `span`、content は全件 `span`。`新しいメッセージがあります`、`2026年8月1日`、`更新履歴を確認する` を確認 | 全幅 528px。default / separator は20px高、border は29px高、radius は全件0px。body background `oklch(1 0 0)`、foreground `oklch(0.145 0 0)`、marker text `oklch(0.54 0 0)`、border token `oklch(0.922 0 0)` | `2026-08-01-marker-preview-light.jpg` |
| `/preview/marker-dark/` dark | selector 1件、console error / warning 0件 | light と同じ全 slot / variant / text / `div` / `span` semantics と `aria-hidden` を確認 | light と同寸法・radius。body background `oklch(0.145 0 0)`、foreground `oklch(0.985 0 0)`、marker text `oklch(0.708 0 0)`、border token `oklch(1 0 0 / 10%)` | `2026-08-01-marker-preview-dark.jpg` |

## screenshot 実体と後始末

- 両方とも JPEG JFIF（先頭 bytes: `ffd8ffe000104a4649460001`）で、拡張子と画像実体が一致する。
- 検証後に Browser tab を finalize し、dev server を停止した。

## 見た項目と見なかった項目

- 見た: 固有 light / dark route、hydration 後の selector、全 slot、全 variant、text と HTML semantics、寸法、radius、foreground / background semantic token、console error / warning、JPEG screenshot。
- 見なかった: catalog 横断確認。Task 8 の範囲外であり、バッチ末尾に実施する。
