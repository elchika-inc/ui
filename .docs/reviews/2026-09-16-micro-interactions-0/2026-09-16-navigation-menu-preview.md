verified_impl_sha: 096fbc8b01d5fbbf232b5af2a99e13332e8fa6d3

# navigation-menu preview のマイクロインタラクション検証

## 検証方法

- 成功基準: [委任仕様 §4・§A](../../plans/2026-09-16-micro-interactions.md)。検証日2026-09-16。
- `npm run build:site` はexit 0、271ページ。`npx astro preview --host 127.0.0.1 --port 62298` で配信した。
- Playwright MCPでChromium 153.0.8010.48（channel chrome、headless true）を新規起動。viewport 1440×900、deviceScaleFactor 1、reducedMotion `no-preference`。
- hydration完了、指定selectorのvisible、`document.fonts.ready`、600msを待つ。navigation前にconsole error / pageerrorを登録した。
- `getAnimations()` では型、`transitionProperty`、`effect.getTiming()` のduration / easingを取得する。操作前から16ms間隔で属性・computed style・animationを記録した。表の時刻は操作前の記録開始からの相対値で、CSSのdurationそのものとは区別する。

| theme | route | selector件数 | console / favicon / pageerror | HTTP |
|---|---|---:|---|---:|
| light | `/preview/navigation-menu/` | 1 | 0 / 0 / 0 | 200 |
| dark | `/preview/navigation-menu-dark/` | 1 | 0 / 0 / 0 | 200 |

両テーマで横overflowなし、dev toolbar 0件。dark classはlightでfalse、darkでtrue。通常モーション設定であることも実測した。

## 状態遷移のcomputed style

preview selectorは `[data-slot="navigation-menu-content"]`（各1件）。Trigger全2件とLink全3件を各テーマで測り、全件同じ値だった。

- transition-property: `background, border-color, color, box-shadow`
- transition-duration: `0.12s, 0.12s, 0.12s, 0.12s`
- transition-timing-function: `cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1)`

`all` は含まない。段・曲線utilityを併記せず、`transition-state` が `--state-transition` に接続している。

## Indicatorの属性とopacity

初期openから外側（900, 600）をclickして閉じ、600ms待った。最初のTrigger「製品」をclickして600ms観測、外側clickで再度600ms観測し、開き直して600ms後に撮影した。

| theme | 閉じた状態 popup-open / opacity | 開いた状態 popup-open / opacity | 再度閉じた状態 popup-open / opacity | open / close全sample |
|---|---|---|---|---|
| light | false / 0 | true / 1 | false / 0 | 40 / 38 |
| dark | false / 0 | true / 1 | false / 0 | 39 / 38 |

実測対象は `[data-slot="navigation-menu-indicator"]`。computedは両テーマでproperty `opacity`、duration `0.26s`、easing `cubic-bezier(0.16, 1, 0.3, 1)`。両テーマの開閉両方で `CSSTransition` / `transitionProperty: opacity` / `effect.getTiming().duration: 260` / `easing: cubic-bezier(0.16, 1, 0.3, 1)` を観測した。

Indicatorは常駐するBase UI Iconで、開閉状態は `data-popup-open` が示す。starting / ending属性によるmount / unmount検証はこの対象に該当しない。

## 証跡と範囲

- light: [2026-09-16-navigation-menu-preview-light.jpg](2026-09-16-navigation-menu-preview-light.jpg)
- dark: [2026-09-16-navigation-menu-preview-dark.jpg](2026-09-16-navigation-menu-preview-dark.jpg)

両画像は実装commitから新規撮影した1440×900のJPEGで、署名・デコード・寸法を独立確認した。存在（selector / 画像）、実行（build / HTTP / console）、動作（computed / getAnimations / 属性遷移）を測った。全props・全キーボード操作・reduced-motionの実動作・pixel差分比較は含めない。
