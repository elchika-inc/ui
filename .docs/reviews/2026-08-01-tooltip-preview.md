# Tooltip preview 実ブラウザ検証

- 実装 commit: `f256f6d04604520235f61acd6df2c036a67e8eb4`
- 検証 URL: `http://127.0.0.1:4175/preview/tooltip/`、`http://127.0.0.1:4175/preview/tooltip-dark/`、`http://127.0.0.1:4175/catalog/`、`http://127.0.0.1:4175/catalog-dark/`
- stable selector: `[data-slot="tooltip-content"]`
- 実行環境: 固定実装 commit の build 済み成果物を `npm run preview -- --host 127.0.0.1 --port 4175` で起動し、Chrome 実ブラウザで検証した。

## 上流の ARIA 欠落と補完契約

`@base-ui/react` 1.6.0 をそのまま包んだ実装 commit `33c89b045aeae1d01c8e1dd8a7dfe0437f5fd612` では、hydration 後の Popup に `role` と `id` がなく、Trigger に `aria-describedby` がなかった。`node_modules/@base-ui/react/tooltip/popup/TooltipPopup.mjs` は `useRenderElement` へ state、ref、popup props、利用者 props を渡すだけで tooltip role を付けず、`trigger/TooltipTrigger.mjs` も内部 trigger id は付けるが `aria-describedby` を生成しないことをソースで確認した。

公開 props の実ブラウザ probe では、content の `id="tooltip-preview-content"` と `role="tooltip"`、trigger の `aria-describedby="tooltip-preview-content"` がそのまま DOM へ到達し、`document.getElementById(trigger.getAttribute("aria-describedby")) === content` が成立した。これを受け、固定実装では配布 component の `TooltipContent` が `role="tooltip"` を上書き不能な位置で固定し、利用側が一意な content `id` と同値の trigger `aria-describedby` を公開 props で配線する契約を README と preview に置いた。`role` だけでは trigger と説明の関係が成立しないため、`aria-describedby` と参照先 ID の一致を対で要求する。

上流 Base UI が将来 ARIA tooltip pattern と ID 関係を実装した場合は、二重指定や競合を避けるためこの正規化と利用契約を再評価する。

## isolated light

- hydration 後は前後 sentinel 各1件、Portal content 1件だった。content は Astro island の外にある `body` 配下へ描画され、外側の `DIV` は `role="presentation"` だった。
- content は `role="tooltip"`、`id="tooltip-preview-content"`、trigger は `aria-describedby="tooltip-preview-content"` で、参照先は同じ content 要素だった。content 矩形は約 149.70 × 28px、背景は `oklch(0.145 0 0)`、文字色は `oklch(1 0 0)`、`pointer-events: auto` だった。
- 初期 focus は `BODY`。`[inert]` と focus guard は0件だった。`aria-hidden="true"` は Tooltip Arrow の `DIV` だけで、背景要素には付かなかった。
- 背景操作 button 自身の `pointer-events` は `auto` で、中央座標の `document.elementFromPoint` は `[data-slot="tooltip-background-action"]` を返した。同座標への実 click は表示を `背景操作: 0` から `背景操作: 1` へ更新し、content を閉じ、focus を背景 button へ移した。Tooltip は非 modal で背景操作を遮らない。
- pointer hover で再び content が1件になり、ARIA の参照関係を維持したまま focus は背景 button に留まった。pointer leave の120ms時点では transition / safe-polygon の終了待ちで content が残る場合があったが、1000ms以内に0件になった。
- before sentinel から Tab で trigger を focus すると content が1件になり、focus は trigger に留まった。Escape で content は0件となり、focus は trigger に残った。再度 focus open 後に Tab で背景 button へ抜けると content は0件になり、focus trap はなかった。
- console error は0件だった。

## isolated dark

- `html.dark` を確認した。hydration 後は前後 sentinel 各1件、Portal content 1件で、Portal の配置、`role="tooltip"`、`id="tooltip-preview-content"`、trigger の `aria-describedby`、参照先一致は light と同じだった。
- content 矩形は約 149.70 × 28px、背景は `oklch(0.985 0 0)`、文字色は `oklch(0.145 0 0)`、`pointer-events: auto` だった。
- 初期 focus は `BODY`、`[inert]` と focus guard は0件で、`aria-hidden="true"` は Arrow の `DIV` だけだった。背景 button 中央の hit-test は同 button を返し、実 click は `背景操作: 0` から `背景操作: 1` へ更新して content を閉じ、focus を背景 button へ移した。
- hover open は focus を背景 button に維持し、pointer leave 後1000ms以内に閉じた。focus open は trigger に focus を維持し、Escape 後も trigger に残った。再open 後の Tab は背景 button へ抜けて content を閉じ、focus trap がないことを確認した。
- console error は0件だった。

## catalog

- `/catalog/` と `/catalog-dark/` の双方で Tooltip preview section は1件、`client="load"` の Astro island は hydration 済み、trigger は1件だった。
- 両 route とも before / after sentinel は各0件、Portal content は0件だった。dark route は `html.dark` を確認した。
- trigger の公開契約である `aria-describedby="tooltip-preview-content"` は維持される一方、catalog の closed 状態では参照先 content を mount しない。
- console error は light / dark とも0件だった。

## 画像

- `.docs/reviews/tooltip-preview-light.jpg` と `.docs/reviews/tooltip-preview-dark.jpg` は、open 状態を Chrome Browser API の `tab.screenshot({ fullPage: true })` で取得した。返却された `Uint8Array` は JPEG / JFIF magic bytes `FF D8 FF E0` を持つため、その byte 列をそのまま `.jpg` として保存した。取得方法と画像形式・拡張子は一致する。
- light は 16,607 bytes、dark は 16,663 bytesで、双方とも 1512 × 772px、baseline、8-bit、3 components の JFIF JPEG である。

## 見た範囲 / 見ていない範囲

- 見た範囲は固定実装 commit の isolated light / dark における defaultOpen、sentinel、Portal 実DOM、ARIA 実値と参照先一致、semantic token、hover / pointer leave、focus / blur、Escape、focus 維持、背景属性・hit-test・実 click、console、および catalog light / dark の hydration と closed 状態である。
- スクリーンリーダーによる読み上げ音声、touch 操作、mobile viewport、複数 Tooltip 間の Provider delay、バッチ全 component の catalog 視覚走査は見ていない。バッチ横断 catalog 走査は Task 15 で実施する。
