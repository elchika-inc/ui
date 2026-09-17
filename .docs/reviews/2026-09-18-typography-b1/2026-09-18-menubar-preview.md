verified_impl_sha: e37090316f1e5b4332a2019276e30f6846e5d49a

# menubar preview 実ブラウザ検証（組版と Mono）

## 成功基準と対象

成功基準は [委任仕様 §4・§B](../../plans/2026-09-17-typography-layer.md) と司令塔の追加裁定。shortcut を font-mono text-2xs tracking-label に統一した。

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
[data-slot="menubar-shortcut"]
```

isolated preview の `defaultOpen` による popup を測定・撮影した。

## 表示とエラー

| theme | route | HTTP | 対象数 | console error（favicon除外） | favicon error | pageerror | dark class |
| --- | --- | --- | --- | --- | --- | --- | --- |
| light | `/preview/menubar/` | 200 | 2 | 0 | 0 | 0 | false |
| dark | `/preview/menubar-dark/` | 200 | 2 | 0 | 0 | 0 | true |

全ルートの body は fontSize 16px / lineHeight 28px / letterSpacing 0.32px。favicon の失敗は `/favicon.ico` の404であり、component の console error と分けた。

## フォントの読込

| theme | 400 weight の load 前 check | 500 weight の load 前 check | 400 weight の load 後 check | load 結果 |
| --- | --- | --- | --- | --- |
| light | true | false | true | IBM Plex Mono / 400 / loaded |
| dark | true | false | true | IBM Plex Mono / 400 / loaded |

`document.fonts.check` は400 weightを指定するため、500 weightのみが使われるページでは初期値falseでも500 weightは読込済みだった。上表はその違いを隠さず併記している。Mono の適用判定は下表の computed family で行い、フォント資産の読込確認と分離する。

## computed style と寸法

| theme | slot / text | fontSize | lineHeight | letterSpacing | weight | fontVariantNumeric | scrollHeight / clientHeight |
| --- | --- | --- | --- | --- | --- | --- | --- |
| light | `menubar-shortcut` / ⌘N | 12px | 18px | 0.96px | 400 | normal | 18 / 18 |
| light | `menubar-shortcut` / ⌘O | 12px | 18px | 0.96px | 400 | normal | 18 / 18 |
| dark | `menubar-shortcut` / ⌘N | 12px | 18px | 0.96px | 400 | normal | 18 / 18 |
| dark | `menubar-shortcut` / ⌘O | 12px | 18px | 0.96px | 400 | normal | 18 / 18 |

computed fontFamily（light / dark で一致）:

- ⌘N / ⌘O: `"IBM Plex Mono", "IBM Plex Sans JP", ui-monospace, monospace`。

## 画像と判定範囲

- light: [2026-09-18-menubar-preview-light.jpg](2026-09-18-menubar-preview-light.jpg)。
- dark: [2026-09-18-menubar-preview-dark.jpg](2026-09-18-menubar-preview-dark.jpg)。

画像はそれぞれのrouteから撮影した1440×900 JPEGで、既存証跡の複製ではない。目視で対象テキストの欠落を認めなかった。DOM存在・HTTP・console/pageerror・computed style・対象要素の寸法を検証した。全props、全キーボード操作、全画面幅を網羅する検証ではない。
