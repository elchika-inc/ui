# Checkbox preview 実ブラウザ検証

- 検証 SHA: `b12845f58afc38d27f2f252e1d413a7b7aafb76d`
- Browser: Chrome
- server: `http://127.0.0.1:4334`（implementation commit の固定 SHA で起動）
- 対象 route: `/preview/checkbox/`、`/preview/checkbox-dark/`
- catalog: 未訪問。バッチ末尾の横断検証で実施する。

## 初期状態と構造

| theme | selector / root | 初期状態と ARIA | indicator DOM | label association |
| --- | --- | --- | --- | --- |
| light | `[data-slot="checkbox-preview"]` 1件、`[data-preview-checkbox]` 4件 | unchecked=`aria-checked=false`、checked=`true`、indeterminate=`mixed`、disabled=`true` + `aria-disabled=true` | 全体3件。unchecked=0、checked=1、indeterminate=1、disabled=1 | 各 hidden `input[type=checkbox]` の `id` と `label[for]` が一致し、`input.labels` は各1件。各 visible root の `aria-labelledby` は対応 label id を参照 |
| dark | `[data-slot="checkbox-preview"]` 1件、`[data-preview-checkbox]` 4件 | unchecked=`aria-checked=false`、checked=`true`、indeterminate=`mixed`、disabled=`true` + `aria-disabled=true` | 全体3件。unchecked=0、checked=1、indeterminate=1、disabled=1 | light と同じ関連付けを実測 |

## マウス・キーボード操作

| theme | unchecked のマウス click | Tab / Space | disabled の不変性 | focus-visible ring |
| --- | --- | --- | --- | --- |
| light | `false → true → false`。indicator は `0 → 1 → 0` | `BODY` から Tab 1回で unchecked root へ focus。Space 前後は `false → true` | `aria-disabled=true`、`tabIndex=-1`。visible root の実座標 click 前後は `true → true`、続く Space 試行後も `true` | `:focus-visible=true`、`box-shadow` の ring は `oklch(0.556 0 0) 0 0 0 3px`、focus 時 border は `oklab(0.90893 0 0)` |
| dark | `false → true → false`。indicator は `0 → 1 → 0` | `BODY` から Tab 1回で unchecked root へ focus。Space 前後は `false → true` | `aria-disabled=true`、`tabIndex=-1`。visible root の実座標 click 前後は `true → true`、続く Space 試行後も `true` | `:focus-visible=true`、`box-shadow` の ring は `oklch(0.556 0 0) 0 0 0 3px`、focus 時 border は `oklab(0.914012 0 0 / 0.179558)` |

disabled root は keyboard focus の対象外であるため、実座標 click 後も active element にならないことを確認したうえで Space を送出し、disabled の `aria-checked` が変化しないことを確認した。

## dimensions / tokens / console

| theme | dimensions | computed appearance / tokens | console error |
| --- | --- | --- | --- |
| light | preview=384px、各 root=16×16px、border=1px、radius=6px | unchecked border=`oklch(0.922 0 0)`、checked background/border=`oklch(0.205 0 0)`、`--primary=oklch(0.205 0 0)`、`--primary-foreground=oklch(0.985 0 0)`、`--input=oklch(0.922 0 0)`、`--ring=oklch(0.556 0 0)`、`--radius=0.625rem` | 0件 |
| dark | preview=384px、各 root=16×16px、border=1px、radius=6px | unchecked border=`oklch(1 0 0 / 0.15)`、checked background/border=`oklch(0.922 0 0)`、`--primary=oklch(0.922 0 0)`、`--primary-foreground=oklch(0.205 0 0)`、`--input=oklch(1 0 0 / 15%)`、`--ring=oklch(0.556 0 0)`、`--radius=0.625rem` | 0件 |

## screenshots

- `2026-08-01-checkbox-preview-light.jpg`: JPEG/JFIF、1512×828px、magic bytes `ffd8ff`。
- `2026-08-01-checkbox-preview-dark.jpg`: JPEG/JFIF、1512×828px、magic bytes `ffd8ff`。
- 両 screenshot は操作後、unchecked を `false` へ戻し、checked=`true`、indeterminate=`mixed`、disabled=`true` の初期4状態を再現した。unchecked root に keyboard focus と focus-visible ring が残る状態を撮影した。
