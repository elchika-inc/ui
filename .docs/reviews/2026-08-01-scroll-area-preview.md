# Scroll Area 実ブラウザ検証

verified_impl_sha: d9147d340fd4b13cb69dd48d5d97d6f9db87d074

- 実装SHA: `d9147d340fd4b13cb69dd48d5d97d6f9db87d074`
- 配信URL: `http://127.0.0.1:4327/preview/scroll-area/` と `http://127.0.0.1:4327/preview/scroll-area-dark/`
- 配信: fixed SHAを`npm run build`した後、空き確認済みport 4327で`npm run preview -- --host 127.0.0.1 --port 4327`を実行した。
- stable selector: `[data-slot="scroll-area-preview"]` はlight/darkとも1件で、before/after sentinelは各1件だった。

## light / dark 共通の観測

- viewportは`scrollWidth=672`、`clientWidth=510`、`scrollHeight=576`、`clientHeight=206`で、`data-has-overflow-x`と`data-has-overflow-y`がともに存在した。
- viewport、Content、vertical/horizontal scrollbar各1、thumb各1、Corner各1を確認した。初期thumb矩形はverticalが`10 × 70.09375`、horizontalが`379.4609375 × 10`だった。
- Tab順はbefore sentinelからBase UIがfocusableにしたviewport（`aria-label="操作記録"`）、続けて最初のcontent buttonへ移動した。`tabIndex`は追加していない。
- viewportにfocus後のArrowDown/ArrowRightでlightは`scrollTop=1.5`、`scrollLeft=1`、darkは`scrollTop=1.5`、`scrollLeft=1`へ変化した。
- viewport上のwheel後はlight/darkとも`scrollTop=220`、`scrollLeft=160`へ変化し、thumb矩形もverticalの`y=149.86111450195312`、horizontalの`x=144.04762268066406`へ追従した。
- viewportとcontent buttonのfocus ringはsemantic token `ring` を使う非透明3px ringである。light/darkのconsole errorは各0件だった。

## catalog 確認

- `http://127.0.0.1:4327/catalog/` の`[data-catalog-preview="scroll-area"]`は1件で、previewは1件、before/after sentinelはともに0件だった。
- catalogのviewportは初期`scrollTop=0`、`scrollLeft=0`で、viewport、2 scrollbar、2 thumb、Cornerは静的に描画された。console errorは0件だった。
- catalog横断走査はバッチ末尾で実施する。

## screenshot 実体と見た範囲

- `scroll-area-preview-light.jpg` と `scroll-area-preview-dark.jpg` はBrowser `tab.screenshot({ fullPage: true })` のUint8Arrayを無変換で保存した。両方のmagic bytesはJPEG/JFIFの`ff d8 ff e0`であり、`.jpg`拡張子と実体が一致する。
- 見た範囲はlight/dark固有routeのhydration後DOM、縦横overflow、scrollbar/thumb/Corner、Tab順、keyboard/wheel操作と前後位置、thumb矩形、semantic token、console error、JPEG実体である。見ていない範囲は高倍率表示、画面reader、RTL、programmatic scroll、disabled状態である。
