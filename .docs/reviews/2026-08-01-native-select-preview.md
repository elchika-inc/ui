# Native Select preview 実ブラウザ検証

verified_impl_sha: a34c757376b9491cde8ce547ba77a541f1adfed6

- 検証 SHA: `a34c757376b9491cde8ce547ba77a541f1adfed6`
- Browser: Chrome
- server: `http://127.0.0.1:4335`（implementation commit の固定 SHA で起動）
- 対象 route: `/preview/native-select/`、`/preview/native-select-dark/`
- catalog: 未訪問。バッチ末尾の横断検証で実施する。

## 初期状態と native semantics

| theme | selector / slot | 初期 value / selected text / options | 状態 | label association / semantics |
| --- | --- | --- | --- | --- |
| light | `[data-slot="native-select-preview"]` 1件、wrapper/select/icon 各4件、option 11件、optgroup 2件 | default=`apple` / `りんご` / 3件、sm=`linux` / `Linux` / 4件、disabled=`locked` / `変更できません` / 2件、invalid=`expired` / `期限切れ` / 2件 | default と sm は enabled、disabled は `disabled=true`、invalid は `aria-invalid=true` | 全4件が native `SELECT` / `type=select-one`。各 `select.labels` は1件で、`label[for]` と select の `id` が一致 |
| dark | light と同じ件数 | light と同じ初期値・selected text・option 件数 | light と同じ | light と同じ |

Accessibility tree では4件とも `combobox` として公開され、各 option の selected 状態、disabled select の disabled 状態、label 由来の accessible name を確認した。

## キーボード操作と change 表示

| theme | Tab focus | native 文字キー前後 | change event の表示 | disabled の不変性 | focus-visible ring |
| --- | --- | --- | --- | --- | --- |
| light | `BODY` から Tab 1回で default、2回目で sm | sm に focus した状態で `m` を送り、`linux` / `Linux` → `mac` / `macOS` | default を `apple` / `りんご` → `grape` / `ぶどう` と選択すると、表示が `現在: りんご（変更 0 回）` → `現在: ぶどう（変更 1 回）`、`data-selected-value=grape` へ連動 | Tab 順は default → sm → invalid で disabled を skip。続けて ArrowDown を送り、disabled は `locked` → `locked` | default で `:focus-visible=true`。ring は `oklch(0.556 0 0) 0 0 0 3px` |
| dark | light と同じ | `linux` / `Linux` → `mac` / `macOS` | light と同じく変更回数0→1、表示・属性が `grape` / `ぶどう` へ連動 | Tab 順は default → sm → invalid。ArrowDown 後も `locked` → `locked` | default で `:focus-visible=true`。ring は `oklch(0.556 0 0) 0 0 0 3px` |

この環境の macOS Chrome では、閉じた default select への ArrowDown 単独では選択が確定しなかったため、その結果を値変更の証拠には使わず、native typeahead として有効だった文字キー `m` の前後を記録した。disabled は keyboard focus 対象外であることを Tab 順で確認し、後続のキー送出後にも値が変わらないことを確認した。

## dimensions / tokens / console

| theme | dimensions | computed appearance / tokens | console error |
| --- | --- | --- | --- |
| light | preview=384×488px、default=100×32px / radius 10px、sm=108×28px / radius 8px、disabled=142×32px、invalid=100×32px、全select border=1px | default background=`rgba(0, 0, 0, 0)`、disabled background=`oklab(0.922 0 0 / 0.5)`、invalid border=`oklch(0.505 0.213 27.518)`、`--background=oklch(1 0 0)`、`--foreground=oklch(0.145 0 0)`、`--input=oklch(0.922 0 0)`、`--ring=oklch(0.556 0 0)`、`--destructive=oklch(0.505 0.213 27.518)` | 0件 |
| dark | preview=384×488px、select 寸法・radius・border は light と同じ | default background=`oklab(1 0 0 / 0.045)`、disabled background=`oklab(1 0 0 / 0.12)`、invalid border=`oklab(0.704 0.176821 0.072217 / 0.5)`、`--background=oklch(0.145 0 0)`、`--foreground=oklch(0.985 0 0)`、`--input=oklch(1 0 0 / 15%)`、`--ring=oklch(0.556 0 0)`、`--destructive=oklch(0.704 0.191 22.216)` | 0件 |

## screenshots と観測限界

- `2026-08-01-native-select-preview-light.jpg`: JPEG/JFIF、1512×828px、magic bytes `ffd8ff`。
- `2026-08-01-native-select-preview-dark.jpg`: JPEG/JFIF、1512×828px、magic bytes `ffd8ff`。
- 両 screenshot は初期 value / selected textへ戻し、default select に keyboard focus と focus-visible ring が残る状態を撮影した。
- native select の popup 内部は OS / browser が描画するため、popup 内部の色・寸法・hover・選択ハイライトはDOM/computed styleとして実測できない。ここでは閉じた select 本体、Accessibility tree の option、keyboard操作後に確定した value / selected text、change表示のみを証拠とし、popup内部を推測しない。
