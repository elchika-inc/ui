verified_impl_sha: e37090316f1e5b4332a2019276e30f6846e5d49a

# badge preview 実ブラウザ検証（組版と Mono）

## 成功基準と対象

成功基準は [委任仕様 §4・§B](../../plans/2026-09-17-typography-layer.md) と司令塔の追加裁定。base を text-2xs / leading-none とし、numeric prop を useRender の state に載せた。numeric の2例（1,234 / 99+）を preview に追加した。

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
[data-slot="badge"]
```

## 表示とエラー

| theme | route | HTTP | 対象数 | console error（favicon除外） | favicon error | pageerror | dark class |
| --- | --- | --- | --- | --- | --- | --- | --- |
| light | `/preview/badge/` | 200 | 9 | 0 | 1 | 0 | false |
| dark | `/preview/badge-dark/` | 200 | 9 | 0 | 0 | 0 | true |

全ルートの body は fontSize 16px / lineHeight 28px / letterSpacing 0.32px。favicon の失敗は `/favicon.ico` の404であり、component の console error と分けた。

## フォントの読込

| theme | 400 weight の load 前 check | 500 weight の load 前 check | 400 weight の load 後 check | load 結果 |
| --- | --- | --- | --- | --- |
| light | false | true | true | IBM Plex Mono / 400 / loaded |
| dark | false | true | true | IBM Plex Mono / 400 / loaded |

`document.fonts.check` は400 weightを指定するため、500 weightのみが使われるページでは初期値falseでも500 weightは読込済みだった。上表はその違いを隠さず併記している。Mono の適用判定は下表の computed family で行い、フォント資産の読込確認と分離する。

## computed style と寸法

| theme | slot / text | fontSize | lineHeight | letterSpacing | weight | fontVariantNumeric | scrollHeight / clientHeight |
| --- | --- | --- | --- | --- | --- | --- | --- |
| light | `badge` / 公開中 | 12px | 12px | 0.32px | 500 | normal | 18 / 18 |
| light | `badge` / 下書き | 12px | 12px | 0.32px | 500 | normal | 18 / 18 |
| light | `badge` / 停止中 | 12px | 12px | 0.32px | 500 | normal | 18 / 18 |
| light | `badge` / 審査待ち | 12px | 12px | 0.32px | 500 | normal | 18 / 18 |
| light | `badge` / 任意 | 12px | 12px | 0.32px | 500 | normal | 18 / 18 |
| light | `badge` / 詳細を見る | 12px | 12px | 0.32px | 500 | normal | 18 / 18 |
| light | `badge` / 新着 | 12px | 12px | 0.32px | 500 | normal | 18 / 18 |
| light | `badge` / 1,234 | 12px | 12px | 0.32px | 500 | tabular-nums | 18 / 18 |
| light | `badge` / 99+ | 12px | 12px | 0.32px | 500 | tabular-nums | 18 / 18 |
| dark | `badge` / 公開中 | 12px | 12px | 0.32px | 500 | normal | 18 / 18 |
| dark | `badge` / 下書き | 12px | 12px | 0.32px | 500 | normal | 18 / 18 |
| dark | `badge` / 停止中 | 12px | 12px | 0.32px | 500 | normal | 18 / 18 |
| dark | `badge` / 審査待ち | 12px | 12px | 0.32px | 500 | normal | 18 / 18 |
| dark | `badge` / 任意 | 12px | 12px | 0.32px | 500 | normal | 18 / 18 |
| dark | `badge` / 詳細を見る | 12px | 12px | 0.32px | 500 | normal | 18 / 18 |
| dark | `badge` / 新着 | 12px | 12px | 0.32px | 500 | normal | 18 / 18 |
| dark | `badge` / 1,234 | 12px | 12px | 0.32px | 500 | tabular-nums | 18 / 18 |
| dark | `badge` / 99+ | 12px | 12px | 0.32px | 500 | tabular-nums | 18 / 18 |

computed fontFamily（light / dark で一致）:

- 公開中 / 下書き / 停止中 / 審査待ち / 任意 / 詳細を見る / 新着: `"IBM Plex Sans JP", "IBM Plex Sans", system-ui, sans-serif`。
- 1,234 / 99+: `"IBM Plex Mono", "IBM Plex Sans JP", ui-monospace, monospace`。

`data-numeric` は各テーマで数値例2件だけに空文字列として存在し、通常7件には存在しなかった。数値2件は `tabular-nums`、通常7件は `normal`。固定高さの溢れ検査は light 9/9・dark 9/9 が `18 <= 18` で通過した。PR A の旧表示7件の `21 > 18` は [共有面 report](../2026-09-18-typography-a/report.md) に記録済みで、本変更による改善を確認した。

## 画像と判定範囲

- light: [2026-09-18-badge-preview-light.jpg](2026-09-18-badge-preview-light.jpg)。
- dark: [2026-09-18-badge-preview-dark.jpg](2026-09-18-badge-preview-dark.jpg)。

画像はそれぞれのrouteから撮影した1440×900 JPEGで、既存証跡の複製ではない。目視で対象テキストの欠落を認めなかった。DOM存在・HTTP・console/pageerror・computed style・対象要素の寸法を検証した。全props、全キーボード操作、全画面幅を網羅する検証ではない。

## 共通の生成 CSS 検査（§4.6）

各コマンドはpipeなしで独立実行した。0件のgrepはexit 1を正常な負検査として記録する。

```bash
grep -o -- '--text-xs:[^;]*;' dist/_astro/global.C8RNV9Y7.css
```

```text
--text-xs:.8125rem;
--text-xs:.8125rem;
```

exit 0、2件。

```bash
grep -o -- '--leading-normal:[^;]*;' dist/_astro/global.C8RNV9Y7.css
```

```text
--leading-normal:1.75;
--leading-normal:1.6;
--leading-normal:1.75;
```

exit 0、3件。

```bash
grep -o -- '--leading-snug:[^;]*;' dist/_astro/global.C8RNV9Y7.css
```

```text
--leading-snug:1.5;
--leading-snug:1.5;
```

exit 0、2件。

```bash
grep -o -- '--tracking-normal:[^;]*;' dist/_astro/global.C8RNV9Y7.css
```

```text
--tracking-normal:.02em;
--tracking-normal:0em}body{font-family:var(--font-body);
--tracking-normal:.02em;
```

exit 0、3件。

```bash
grep -o ':lang(en){[^}]*}' dist/_astro/global.C8RNV9Y7.css
```

```text
:lang(en){--font-display:"IBM Plex Sans", "IBM Plex Sans JP", system-ui, sans-serif;--font-body:"IBM Plex Sans", "IBM Plex Sans JP", system-ui, sans-serif;--leading-display:1.2;--leading-normal:1.6;--leading-relaxed:1.75;--tracking-normal:0em}
```

exit 0、1件。

```bash
grep -o '\.text-xs{[^}]*}' dist/_astro/global.C8RNV9Y7.css
```

```text
.text-xs{font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height))}
```

exit 0、1件。

```bash
grep -o -- '--text-xs--line-height:[^;]*;' dist/_astro/global.C8RNV9Y7.css
```

```text
--text-xs--line-height:1.5;
```

exit 0、1件。

```bash
grep -o -- '--text-base--line-height:[^;]*;' dist/_astro/global.C8RNV9Y7.css
```

```text
--text-base--line-height:1.75;
```

exit 0、1件。

```bash
grep -o -- '--text-lg--line-height:[^;]*;' dist/_astro/global.C8RNV9Y7.css
```

```text
--text-lg--line-height:1.9;
```

exit 0、1件。

```bash
grep -o -- '--text-2xl--line-height:[^;]*;' dist/_astro/global.C8RNV9Y7.css
```

```text
--text-2xl--line-height:1.35;
```

exit 0、1件。

```bash
grep -o '\.leading-normal{[^}]*}' dist/_astro/global.C8RNV9Y7.css
```

```text
.leading-normal{--tw-leading:var(--leading-normal);line-height:var(--leading-normal)}
```

exit 0、1件。

```bash
grep -o '\.font-heading{[^}]*}' dist/_astro/global.C8RNV9Y7.css
```

```text
.font-heading{font-family:var(--font-display);font-feature-settings:"palt" 1}
```

exit 0、1件。

```bash
grep -c -- --text-7xl dist/_astro/global.C8RNV9Y7.css
```

```text
0
```

exit 1、0件。

```bash
grep -c -- --leading-loose dist/_astro/global.C8RNV9Y7.css
```

```text
0
```

exit 1、0件。

minifier による末尾セミコロン省略で tracking-normal のgrepが閉じ括弧を越えるため、`:lang(en)` 切り出しを併記した。`:lang(en)` 外では `--text-xs:.75rem` / `--leading-normal:1.5` / `--leading-snug:1.375` / `--tracking-normal:0em` は各0件。`--leading-normal:1.6` と `--tracking-normal:0em` は言語ブロック内だけに存在する。旧 main cd4efbb の陽性対照は [PR A の実測](../2026-09-18-typography-a/report.md) を参照し、本B1では旧baseの再buildは行っていない。
