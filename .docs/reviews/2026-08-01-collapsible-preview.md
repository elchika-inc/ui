# Collapsible 実ブラウザ検証

- 実装SHA: `6a18f02b7baf722b6524e96c1dc1c8dd902614b6`
- 配信URL: `http://127.0.0.1:4325/preview/collapsible/` と `http://127.0.0.1:4325/preview/collapsible-dark/`
- light/dark: stable selector `[data-slot="collapsible-preview"]` は各1件、before/after sentinelは各1件、trigger/contentは初期表示、`aria-expanded="true"` を確認した。
- light/dark操作: clickで閉じる、Spaceで開く、Enterで閉じることを確認した。各操作後もfocusはtriggerに維持され、閉じた状態ではcontentが0件になった。
- Tab順: before sentinelからtrigger、triggerからafter sentinelへ移動した。
- catalog: `http://127.0.0.1:4325/catalog/` のCollapsible sectionでbefore/after sentinel 0件、content 0件、`aria-expanded="false"` を確認した。
- console error: light、dark、catalogはいずれも0件。見た範囲はdefaultOpenとキーボード・pointer操作、見ていない範囲はdisabled、controlled open、hiddenUntilFoundである。
- JPEG取得方法: Browser `tab.screenshot({fullPage:true})` のUint8Arrayを`.jpg`へ保存し、JPEG magic bytesを確認した。
