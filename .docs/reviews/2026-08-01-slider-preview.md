# Slider preview 実ブラウザ検証

- 検証 SHA: `aa10e4b6829b350c4ce77a493d2730330705725b`
- Browser: Chrome
- server: `http://127.0.0.1:3011`（implementation commit の固定 SHA で起動）
- 対象 route: `/preview/slider/`、`/preview/slider-dark/`
- catalog: 未訪問。バッチ末尾の横断検証で実施する。

## 初期状態と ARIA

| theme | selector / slot | enabled | disabled | thumb / range |
| --- | --- | --- | --- | --- |
| light | preview 1件、slider / thumb / range 各2件 | `aria-valuenow=40`、`min=0`、`max=100`、`step=1`、output=`40` | `disabled=true`、`aria-valuenow=30` | enabled thumb=12×12px、range=135.594×4px |
| dark | light と同じ件数 | light と同じ | light と同じ | light と同じ |

Accessibility tree では、enabled は `group "音量"` 内の `slider "音量": "40"`、disabled は `group "無効な音量"` 内の disabled sliderとして公開された。

## pointer / keyboard / focus

| theme | pointer drag | ArrowLeft / ArrowRight / Home / End | focus / DOM identity | disabled invariant |
| --- | --- | --- | --- | --- |
| light | value / ARIA / output=`40`→`77`、thumb x=`153.594`→`273.477px`、range width=`135.594`→`255.477px` | `77`→`76`→`77`→`0`→`100`。各操作後にvalueとoutputが一致 | `BODY`からTabでenabled inputへfocus。thumb id=`base-ui-_r1R_3b_`、input id=`base-ui-_r1R_3bH2_`はdrag前後で不変。各keyboard操作後も同じinputがactiveElement | thumb click後もvalue / ARIA=`30`、focusを取得しない。enabledからTab後はslider外へ移りdisabledをskip |
| dark | light と同じ値・座標変化 | light と同じ | light と同じ | light と同じ |

## focus ring / tokens / console

| theme | focus-visible ring | computed appearance / semantic tokens | console error |
| --- | --- | --- | --- |
| light | Tab focus時に`outline-width=3px`、`outline-color=oklch(0.556 0 0)`。`--ring=oklch(55.6% 0 0)`で非透明 | thumb background=`oklch(1 0 0)`、border=`oklch(0.556 0 0)`、range=`oklch(0.205 0 0)`、`--background=oklch(100% 0 0)`、`--foreground=oklch(14.5% 0 0)`、`--muted=oklch(97% 0 0)`、`--primary=oklch(20.5% 0 0)` | 0件 |
| dark | light と同じ3px / 非透明ring | thumb background=`oklch(0.145 0 0)`、border=`oklch(0.556 0 0)`、range=`oklch(0.922 0 0)`、`--background=oklch(14.5% 0 0)`、`--foreground=oklch(98.5% 0 0)`、`--muted=oklch(26.9% 0 0)`、`--primary=oklch(92.2% 0 0)` | 0件 |

## screenshots と取得方法

- `2026-08-01-slider-preview-light-r2.jpg`: JPEG/JFIF、1512×828px、Browserのfull-page取得。
- `2026-08-01-slider-preview-dark-r2.jpg`: JPEG/JFIF、1512×828px、Browserのfull-page取得。

scalar `value`、scalar `defaultValue`、unsetはcompiled public Sliderでthumb 1件、range valueはthumb 2件となるassertを確認した。
