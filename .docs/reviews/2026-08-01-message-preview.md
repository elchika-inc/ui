# Message プレビュー実ブラウザ検証

verified_impl_sha: db0e0a6aff33ac2d7b1cb070d13c2f32a396609e

検証した実装 commit: `db0e0a6aff33ac2d7b1cb070d13c2f32a396609e`

## 検証条件

- 配信: `npm run dev -- --host 127.0.0.1 --port 4325`
- ブラウザ: Chrome、full-page screenshot
- selector: `[data-slot="message-preview"]`
- 操作: なし。静的 chat の初期描画を確認した
- catalog は開かず、バッチ末尾の横断確認へ残した

## 検証結果

| route / theme | selector / console | slot / alignment / variant / text semantics / actions | 寸法・radius・semantic token | screenshot |
| --- | --- | --- | --- | --- |
| `/preview/message/` light | selector 1件、console error / warning 0件 | MessageGroup 1、Message / Avatar / Content / Header / Footer は各3件。alignment は start 2件・end 1件。assistant / user / ghost のchat行を表示し、ghost行だけが上流の `data-variant="ghost"`。paragraph 3件、time 3件、avatar の aria-label 3件、`コピー` / `編集` / `詳細` の有効な button 3件を確認 | preview 576 × 352px、各Messageは 528px幅。assistant / user の本文は各488 × 36px、10px radius、ghost本文は488 × 20px、0px radius。body background `oklch(1 0 0)`、foreground `oklch(0.145 0 0)`、muted `oklch(0.97 0 0)`、primary `oklch(0.205 0 0)`、border `oklch(0.922 0 0)` | `2026-08-01-message-preview-light.jpg` |
| `/preview/message-dark/` dark | selector 1件、console error / warning 0件 | light と同じ全 slot、alignment、ghost variant、paragraph / time / avatar label / action buttonを確認 | light と同寸法・radius。body background `oklch(0.145 0 0)`、foreground `oklch(0.985 0 0)`、muted `oklch(0.269 0 0)`、primary `oklch(0.922 0 0)`、border `oklch(1 0 0 / 10%)` | `2026-08-01-message-preview-dark.jpg` |

## screenshot 実体と後始末

- 両方とも JPEG JFIF（先頭 bytes: `ffd8ffe000104a4649460001`）で、拡張子と画像実体が一致する。
- 検証後に Browser tab を finalize し、dev server を停止した。

## 見た項目と見なかった項目

- 見た: 固有 light / dark route、hydration 後のselector、全 slot、start / end alignment、上流が扱う ghost data variant、paragraph / time / avatar label のHTML semantics、action button、有効状態、寸法、radius、foreground / background semantic token、横 overflow、console error / warning、JPEG screenshot。
- 見なかった: catalog 横断確認。Task 9 の範囲外であり、バッチ末尾に実施する。
