# Hover Card preview 実ブラウザ検証

- 実装 commit: `1099d0bbffa539e9023f2db8d42a26028c265b01`
- 配信: fresh `npm run build:site` 後、`npm run preview -- --port 4321`（`http://localhost:4321`）
- stable selector: `[data-slot="hover-card-content"]`
- 画像: `hover-card-preview-light.jpg`、`hover-card-preview-dark.jpg`（ともに JFIF JPEG、1512x828）
- catalog 横断走査はバッチ末尾で実施する。

## isolated preview

light (`/preview/hover-card/`) と dark (`/preview/hover-card-dark/`) の両方で、hydration 後に selector と Portal が各1件、`data-sentinel="before"` と `data-sentinel="after"` が各1件だった。trigger は `href="#hover-card-preview"` を持つ `A` 要素で、content は trigger の直下ではなく Portal に描画された。content の矩形は 256x84px、trigger の矩形は約60x20pxで、content class は `bg-popover`、`text-popover-foreground`、`ring-1 ring-border` のsemantic tokenを使う。

実DOMの content は `role` と `aria-modal` がともに `null`、`[inert]` は0件だった。これは Base UI `PreviewCard` の非modal実装と一致する。console errorは light / dark とも0件だった。

両themeで以下を実測した。

- before sentinelをclickしても背景操作が可能で、focusはbefore sentinel、contentは0件、`inert` は0件になった。
- pointerでtriggerへ入るとcontentが1件になり、focusは既存のbefore sentinelから移動しなかった。Escape後はcontentが0件となり、focus returnは発生せずbefore sentinelに留まった。
- pointer leave後はcontentが0件になった。
- triggerをfocusするとcontentが1件になり、focusはtriggerから移動しなかった。Tabでafter sentinelへ抜け、1000ms後にcontentは0件だった。focus trapは存在しない。
- focus経路でEscapeするとcontentは0件となり、focusはtriggerに残った。

## catalog

`/catalog/` と `/catalog-dark/` の双方で Hover Card preview は1件、link triggerは1件、before/after sentinel・Portal・contentはいずれも0件だった。dark route は `html.dark` を確認し、双方のconsole errorは0件だった。

## 見た範囲

Chrome実ブラウザでlight/darkの初期open、Portal実DOM、pointer/focus/blur/Escape、Tab脱出、背景click、catalog閉状態、console、JPEG実体を確認した。多triggerのpayload切替、Viewport/Arrow/Backdropなど今回公開していないBase UIの任意slotは確認対象外である。
