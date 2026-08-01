# Resizable 実ブラウザ検証

- 実装commit: `c37037c78cc0a24757e1963d68e6bc7be371bca7`
- URL: `http://127.0.0.1:4325/preview/resizable/`（light）と `http://127.0.0.1:4325/preview/resizable-dark/`（dark）、明示port `4325` は起動前に空きを確認した。
- wrapper: `node scripts/add-component.mjs resizable --modified "…"` を1回だけ実行し、停止・復元path・分類不能pathはなかった。生成直後SHA-256は`6e3f0f912a0d68614281e7570f4077a966a0517f8adcde65aed5cf9c88af073c`、registry SHA-256は`2bfc1dfa5959622a7ce87abe96d76dd48339c8902c24ed5c6c4e41a9afdbbeb9`だった。
- dependency diff: `dependencies`へ`react-resizable-panels@^4.12.2`だけを追加し、既存dependencyのversion/section変更・削除は0件。lockfile実解決版は`4.12.2`。
- RED: wrapper直後の`npm run check:all`は、barrel export・preview・light/dark routeの不足でexit 1だった。
- GREEN: `format`、`lint`、`typecheck`、Props contract単独`tsc`、scripts tests（80/80）、`build`、`build:lib`、`check:pre`を実装commit前にexit 0で通過し、固定SHAからfresh buildした。
- light実測: stable selector 1、before/after sentinel各1、group高224px。handleは`role="separator"`、`aria-orientation="vertical"`、`aria-valuemin="25"`、`aria-valuenow="50"`、`aria-valuemax="75"`。pointer dragでvalueは50から63.688、panel幅は262.5/262.5pxから334.359/190.641pxへ変化した。ArrowLeftは58.688、ArrowRightは63.688へ戻し、Tab順はbefore sentinel → handle → after sentinelだった。
- dark実測: stable selector 1、sentinel 2、group高224px、同じseparator ARIA実値。pointer dragで63.688、ArrowLeftで58.688、ArrowRightで63.688となり、Tab順はbefore sentinel → handle → after sentinelだった。
- catalog: `http://127.0.0.1:4325/catalog/`のResizable sectionはpreview 1、sentinel 0、separator value 50、panel幅178.828/178.836px、console error 0だった。
- console: light / dark / catalogのerrorはいずれも0件。
- JPEG取得形式: Browser `tab.screenshot({fullPage:true})` のUint8Arrayを無変換で`.jpg`へ保存し、light/darkともJPEG/JFIF magic bytes `ff d8 ff e0`を確認した。
- 見た範囲: isolated light/darkでhandleのARIA・pointer/keyboard resize・Tab順、catalogのsentinel分岐を確認した。見ていない範囲: 垂直orientation、複数handle、永続layout。
