# Kbd プレビュー実ブラウザ検証

検証した実装 commit: `41ade99b60b4593346481a89a11bcbabedd481bf`

## 検証条件

- 配信: `npx serve dist -l 3037 --no-clipboard`
- ブラウザ: Chrome、full-page screenshot
- selector: `[data-slot="kbd-preview"]`
- 操作: なし。静的な単独 Kbd と KbdGroup の初期描画を確認した
- catalog は開かず、バッチ末尾の横断確認へ残した

## 検証結果

| route / theme | selector / console | Kbd / KbdGroup / text / HTML semantics | 寸法・radius・border・token | screenshot |
| --- | --- | --- | --- | --- |
| `/preview/kbd/` light | selector 1件、console error / warning 0件 | Kbd 3件、KbdGroup 1件。`Esc`、`⌘`、`K`、group text `⌘K`。Kbdは全件`kbd`、groupはaria-label `コマンドパレットのショートカット`を持つ`div` | Kbdは Esc 28.17 × 20px、⌘/K 20 × 20px、radius 6px、border 0px。body `oklch(1 0 0)`、Kbd background `oklch(0.97 0 0)`、text `oklch(0.54 0 0)` | `2026-08-01-kbd-preview-light.jpg` |
| `/preview/kbd-dark/` dark | selector 1件、console error / warning 0件 | light と同じ Kbd 3件、KbdGroup 1件、text、`kbd` / `div` semantics、aria-label | light と同寸法・radius・border。body `oklch(0.145 0 0)`、Kbd background `oklch(0.269 0 0)`、text `oklch(0.708 0 0)` | `2026-08-01-kbd-preview-dark.jpg` |

## screenshot 実体と後始末

- 両方とも JPEG JFIF（先頭 bytes: `ffd8ffe000104a4649460001`）で、拡張子と画像実体が一致する。
- 検証後に Browser tab を finalize し、`serve` を停止した。

## 見た項目と見なかった項目

- 見た: 固有 light / dark route、hydration 後のselector、Kbd / KbdGroupの件数、複合shortcutのtext、HTML semantics、寸法、radius、border、semantic token、console error、JPEG screenshot。
- 見なかった: catalog 横断確認。Task 7 の範囲外であり、バッチ末尾に実施する。
