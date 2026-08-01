# Input OTP preview 実ブラウザ検証

- 検証 SHA: `957bd50a6e9698594705a9a9f08473321f6903dc`
- Browser: Chrome
- server: `http://127.0.0.1:4336`（implementation commit の固定 SHA で起動）
- 対象 route: `/preview/input-otp/`、`/preview/input-otp-dark/`
- catalog: 未訪問。バッチ末尾の横断検証で実施する。

## 初期状態と単一フォーカス

| theme | selector / input / slot | 初期状態 | separator / tabIndex |
| --- | --- | --- | --- |
| light | `[data-slot="input-otp-preview"]` 1件、`input` 1件、slot 6件 | `input` は `type=text`、`tabIndex=0`、value は空。focus 後の active slot は index 0 | separator は native `HR`。6 slot と separator はいずれも `tabindex` 属性なし |
| dark | light と同じ件数 | light と同じ。focus 後の active slot は index 0 | light と同じ |

前controlをfocusした状態から Tab 1回で `#input-otp-default` の実inputへ、さらに Tab 1回で後controlへ進んだ。視覚slotはTab stopにならず、入力中も実focusは単一inputに維持された。

## 入力・キーボード操作

| theme | type `12` | Backspace | ArrowLeft / ArrowRight | status / focus |
| --- | --- | --- | --- |
| light | chars=`1`,`2`,``,…、active index 0→2 | value=`1`、active index 2→1 | 1→0 / 0→1 | status は `現在のコード: 12`。各操作後も実inputがfocus |
| dark | light と同じ | light と同じ | light と同じ | light と同じ |

## キャレット・semantics・表示値

| theme | caret computed | opacity 時間差 | slot / token |
| --- | --- | --- | --- |
| light | `animation-name=caret-blink`、`duration=1.25s`、`iteration-count=infinite` | 400ms間で `0` → `1` | slot=32×32px、先頭slot radius=10px、border=`oklch(0.922 0 0)`。`--background=oklch(1 0 0)`、`--foreground=oklch(0.145 0 0)`、`--input=oklch(0.922 0 0)`、`--ring=oklch(0.556 0 0)` |
| dark | light と同じ | 400ms間で約`0` → `0.256639` | slot=32×32px、先頭slot radius=10px、border=`oklch(1 0 0 / 0.15)`。`--background=oklch(0.145 0 0)`、`--foreground=oklch(0.985 0 0)`、`--input=oklch(1 0 0 / 15%)`、`--ring=oklch(0.556 0 0)` |

build後のCSSに`.animate-caret-blink`と`@keyframes caret-blink`が実在し、utility classだけでなくアニメーション定義まで生成されることを確認した。

両themeでpreviewは384×240px、separatorはnative `hr`としてAccessibility treeにseparatorで公開され、console errorは0件だった。slotは視覚表現専用で、各slotに`tabIndex`を追加していない。

## screenshots

- `2026-08-01-input-otp-preview-light.jpg`: JPEG/JFIF、1512×828px、magic bytes `ffd8ff`。
- `2026-08-01-input-otp-preview-dark.jpg`: JPEG/JFIF、1512×828px、magic bytes `ffd8ff`。
