# Bubble プレビュー実ブラウザ検証

verified_impl_sha: 2e5dee5a404c403f7fe87155ad41317766d28e46

検証した implementation commit: `2e5dee5a404c403f7fe87155ad41317766d28e46`

## 検証条件

- 配信: `npm run dev -- --host 127.0.0.1 --port 4329`
- ブラウザ: Chrome、1512px 幅、full-page JPEG screenshot
- selector: `[data-slot="bubble-preview"]`
- catalog 横断確認: バッチ末尾で実施するため、この component 固有検証では実施しない

## 検証結果

| route / theme | selector / console | slot / variant / alignment | 寸法・radius | theme token | screenshot |
|---|---|---|---|---|---|
| `/preview/bubble/` light | selector 1件、console error 0件 | `bubble-group` 1、`bubble` 7、`bubble-content` 7、`bubble-reactions` 2。default / secondary / muted / tinted / outline / ghost / destructive、start / end、reaction bottom/end・top/start を観測 | preview 幅 1512px。content は ghost を除き 60.75px 高・14px radius、ghost は 44.75px 高・0px radius | background `oklch(1 0 0)`、foreground `oklch(0.145 0 0)`、primary `oklch(0.205 0 0)`、secondary / muted `oklch(0.97 0 0)`、destructive `oklch(0.505 0.213 27.518)` | `2026-08-01-bubble-preview-light.jpg` |
| `/preview/bubble-dark/` dark | selector 1件、console error 0件 | light と同じ全 slot / variant / alignment を観測 | light と同じ content 寸法・radius | background `oklch(0.145 0 0)`、foreground `oklch(0.985 0 0)`、primary `oklch(0.922 0 0)`、secondary / muted `oklch(0.269 0 0)`、destructive `oklch(0.704 0.191 22.216)` | `2026-08-01-bubble-preview-dark.jpg` |

## 画像実体

- 両方とも JPEG JFIF（先頭 bytes: `ffd8ffe000104a4649460001`）で、拡張子と画像実体が一致する。
