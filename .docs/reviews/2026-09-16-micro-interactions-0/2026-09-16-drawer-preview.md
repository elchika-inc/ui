verified_impl_sha: 096fbc8b01d5fbbf232b5af2a99e13332e8fa6d3

# drawer preview のマイクロインタラクション検証

## 検証方法

- 成功基準: [委任仕様 §4・§A](../../plans/2026-09-16-micro-interactions.md)。検証日2026-09-16。
- `npm run build:site` はexit 0、271ページ。`npx astro preview --host 127.0.0.1 --port 62298` で配信した。
- Playwright MCPでChromium 153.0.8010.48（channel chrome、headless true）を新規起動。viewport 1440×900、deviceScaleFactor 1、reducedMotion `no-preference`。
- hydration完了、指定selectorのvisible、`document.fonts.ready`、600msを待つ。navigation前にconsole error / pageerrorを登録した。
- `getAnimations()` では型、`transitionProperty`、`effect.getTiming()` のduration / easingを取得する。操作前から16ms間隔で属性・computed style・animationを記録した。表の時刻は操作前の記録開始からの相対値で、CSSのdurationそのものとは区別する。

| theme | route | selector件数 | console / favicon / pageerror | HTTP |
|---|---|---:|---|---:|
| light | `/preview/drawer/` | 1 | 0 / 1 / 0 | 200 |
| dark | `/preview/drawer-dark/` | 1 | 0 / 0 / 0 | 200 |

両テーマで横overflowなし、dev toolbar 0件。dark classはlightでfalse、darkでtrue。通常モーション設定であることも実測した。

## 操作とcomputed style

selectorは `[data-slot="drawer-content"]`、動作対象は `[data-slot="drawer-popup"]`。初期openの「閉じる」をclickし、PopupのDOM消失後40msまで記録。`drawer-trigger` をclickし、650ms後まで記録して撮影した。

| theme | transition-property | transition-duration | transition-timing-function |
|---|---|---|---|
| light | `transform, height, opacity, filter` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| dark | `transform, height, opacity, filter` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` |

初期openも同値。開く側の `getAnimations()` は両テーマで `CSSTransition` / `transform` / duration `500` / easing `cubic-bezier(0.16, 1, 0.3, 1)`。閉じる側は `height` と `transform`、duration `400`、同じeasing。閉じるdurationは既存の `data-ending-style:duration-slower` を維持している。

## 属性遷移

| theme | close全sample | ending sample | 最初のending ms | 最後のending ms | 最初の不在 ms | open全sample | starting sample |
|---|---:|---:|---:|---:|---:|---:|---:|
| light | 53 | 25 | 99.8 | 481.1 | 496.6 | 41 | 0 |
| dark | 52 | 25 | 49.5 | 433.1 | 449.0 | 42 | 0 |

両テーマでending属性の付与後にPopupが消失した。starting属性はbest-effortで未観測だったが、開くtransform transitionは両テーマで観測した。

## 証跡と範囲

- light: [2026-09-16-drawer-preview-light.jpg](2026-09-16-drawer-preview-light.jpg)
- dark: [2026-09-16-drawer-preview-dark.jpg](2026-09-16-drawer-preview-dark.jpg)

両画像は実装commitから新規撮影した1440×900のJPEGで、署名・デコード・寸法を独立確認した。存在（selector / 画像）、実行（build / HTTP / console）、動作（computed / getAnimations / 属性遷移）を測った。全props・全キーボード操作・reduced-motionの実動作・pixel差分比較は含めない。

drawerの2画像は共有面28枚にも含め、同じ実体を参照している。
