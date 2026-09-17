verified_impl_sha: e37090316f1e5b4332a2019276e30f6846e5d49a

# combobox preview 実ブラウザ検証（組版と Mono）

## 成功基準と対象

成功基準は [委任仕様 §4・§B](../../plans/2026-09-17-typography-layer.md) と司令塔の追加裁定。label と chip を text-2xs、chip を leading-none にした。司令塔裁定で preview にグループラベルと複数選択 chip の最小例を追加した。既存の単一選択例は維持し、絞り込みは既存の ComboboxCollection を利用した。

## 再現手順

- 検証日: 2026-09-18。`npm run build:site`（exit 0、292ページ）の成果物を下記で配信した。
- Playwright MCP から headless Chromium 153.0.8010.48 を新規起動し、ページごとに viewport 1440×900 / deviceScaleFactor 1 / reducedMotion `no-preference` の context を使用した。
- navigation 前に console error / pageerror を購読した。`astro-island` の `ssr` 属性が消えるまで待ち、対象 selector の表示を確認した。
- `document.fonts.ready` の後、既定400 weightの未使用フォントも検査できるよう `document.fonts.load('12px "IBM Plex Mono"')` を待ち、指定の `document.fonts.check('12px "IBM Plex Mono"')` を測定した。500 weightを表示する Badge / Kbd の読込状態と、400 weightの読込前の結果は区別して記録した。style の上書きは行っていない。
- フォント読込後300ms待ち、computed style、寸法、DOM属性を測定し、同じ状態を JPEG（quality 90、1440×900）で新規撮影した。

```bash
npx astro preview --host ::1 --port 52981
```

対象 selector:

```css
[data-slot="combobox-label"], [data-slot="combobox-chip"]
```

`#combobox-multiple` をクリックし、chip 2件とグループラベルが同時に見える状態を撮影した。

## 表示とエラー

| theme | route | HTTP | 対象数 | console error（favicon除外） | favicon error | pageerror | dark class |
| --- | --- | --- | --- | --- | --- | --- | --- |
| light | `/preview/combobox/` | 200 | 3 | 0 | 0 | 0 | false |
| dark | `/preview/combobox-dark/` | 200 | 3 | 0 | 0 | 0 | true |

全ルートの body は fontSize 16px / lineHeight 28px / letterSpacing 0.32px。favicon の失敗は `/favicon.ico` の404であり、component の console error と分けた。

## フォントの読込

| theme | 400 weight の load 前 check | 500 weight の load 前 check | 400 weight の load 後 check | load 結果 |
| --- | --- | --- | --- | --- |
| light | false | false | true | IBM Plex Mono / 400 / loaded |
| dark | false | false | true | IBM Plex Mono / 400 / loaded |

`document.fonts.check` は400 weightを指定するため、500 weightのみが使われるページでは初期値falseでも500 weightは読込済みだった。上表はその違いを隠さず併記している。Mono の適用判定は下表の computed family で行い、フォント資産の読込確認と分離する。

## computed style と寸法

| theme | slot / text | fontSize | lineHeight | letterSpacing | weight | fontVariantNumeric | scrollHeight / clientHeight |
| --- | --- | --- | --- | --- | --- | --- | --- |
| light | `combobox-chip` / Astro | 12px | 12px | 0.32px | 500 | normal | 23 / 21 |
| light | `combobox-chip` / React | 12px | 12px | 0.32px | 500 | normal | 23 / 21 |
| light | `combobox-label` / フレームワーク | 12px | 18px | 0.32px | 400 | normal | 30 / 30 |
| dark | `combobox-chip` / Astro | 12px | 12px | 0.32px | 500 | normal | 23 / 21 |
| dark | `combobox-chip` / React | 12px | 12px | 0.32px | 500 | normal | 23 / 21 |
| dark | `combobox-label` / フレームワーク | 12px | 18px | 0.32px | 400 | normal | 30 / 30 |

computed fontFamily（light / dark で一致）:

- Astro / React / フレームワーク: `"IBM Plex Sans JP", "IBM Plex Sans", system-ui, sans-serif`。

chip の行間は12px。削除ボタンは既存の `size="icon-xs"` によって高さ24pxであり、chip 高さ21pxに対して `scrollHeight 23 > clientHeight 21` となる。これは文字行の溢れと分けて観測を残し、全件合格を要求された Badge / Kbd の検査には含めていない。削除ボタンやchipの寸法は本変更で変えていない。目視では chip の文字の欠けは無い。

追加例の操作確認: 初期 chip `[Astro, React]` → `Svelte` 入力で候補 `[Svelte]` →選択で `[Astro, React, Svelte]` → 末尾の削除ボタンクリックで `[Astro, React]`。pageerror 0。

## 画像と判定範囲

- light: [2026-09-18-combobox-preview-light.jpg](2026-09-18-combobox-preview-light.jpg)。
- dark: [2026-09-18-combobox-preview-dark.jpg](2026-09-18-combobox-preview-dark.jpg)。

画像はそれぞれのrouteから撮影した1440×900 JPEGで、既存証跡の複製ではない。目視で対象テキストの欠落を認めなかった。DOM存在・HTTP・console/pageerror・computed style・対象要素の寸法を検証した。全props、全キーボード操作、全画面幅を網羅する検証ではない。
