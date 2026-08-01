# Accordion 実ブラウザ検証

verified_impl_sha: 055cb3c86e3a78636dbd893a3ce8ef093075e321

- 実装commit: `055cb3c86e3a78636dbd893a3ce8ef093075e321`
- URL: `http://127.0.0.1:4322/preview/accordion/`、`http://127.0.0.1:4322/preview/accordion-dark/`
- 配信: `npm run preview -- --host 127.0.0.1 --port 4322`
- stable selector: `[data-slot="accordion-preview"]` はlight/darkとも1件。
- JPEG はBrowserの `screenshot()`（Uint8Array、magic bytes `ff d8 ff`）で取得したため、`.jpg` 拡張子と実体が一致する。

## light / dark 共通の観測

- sentinel: `data-sentinel="before"` と `data-sentinel="after"` は各1件。
- 初期状態: trigger 3件、最初のtriggerの `aria-expanded="true"`、`region` 1件。
- click: `aria-expanded` は `true` から `false`、region は0件へ遷移する。
- Space: `aria-expanded` は `false` から `true`、region は1件へ遷移する。
- Enter: `aria-expanded` は `true` から `false`。閉じanimation中はregionが残ることがあるが、次のDOM snapshotでは存在しない。
- ArrowDown / ArrowUp: Base UIの実DOMでは最初のtriggerにfocusが残った（矢印でroving focusは提供されない）。
- Tab: 最初のtriggerから次のtrigger（請求設定）へfocusが移動した。
- console error: 0件。

## catalog 確認

- URL: `http://127.0.0.1:4322/catalog/`
- `[data-catalog-preview="accordion"]` が存在し、triggerは3件。
- `before` / `after` sentinelは各0件、`aria-expanded="true"`は0件、regionは0件。
- catalog横断走査はバッチ末尾で実施する。

## 見た範囲

light/darkのhydration後DOM、キーボード／pointer操作、ARIA属性、focus遷移、表示状態、JPEG実体を確認した。画面readerの読み上げや高倍率表示は未実測。
