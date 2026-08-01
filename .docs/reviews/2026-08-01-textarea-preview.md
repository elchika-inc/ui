# Textarea preview 実ブラウザ検証

- implementation commit: `d7c0500d253c71399bdfe5aef7f7d1116abfaeae`
- Browser: Chrome（Browser Plugin）
- server: `http://127.0.0.1:4320`（空き listener を確認後、build 済み `dist` を `astro preview` で配信）
- 対象 route: `/preview/textarea/`、`/preview/textarea-dark/`
- catalog: 未訪問。バッチ末尾の横断検証へ延期する。

## 成功基準

- 各 route の URL / title が一致し、fresh snapshot で preview 1件と textarea 3件が公開される。
- editable はlabel、初期値、controlled入力、Enter改行、value / output / selection / focusが同期する。
- BODYからのTabでeditableにfocusし、非透明semantic ringがcomputed 3pxになる。
- disabledはTabをskipしてclick / typeでも値が変わらず、readOnlyはTab focus可能かつtypeで値が変わらない。
- light / darkの寸法、resize、semantic token、computed appearanceが契約どおりで、console errorが0件になる。
- implementation commitからTask 20 component pathの差分がない。

## URL・件数・初期値・label association

| theme | URL / title | selector件数 | 初期値 / 状態 | label association |
| --- | --- | --- | --- | --- |
| light | `http://127.0.0.1:4320/preview/textarea/` / `Textarea` | preview 1、textarea 3、editable / disabled / readOnly 各1 | editable=`確認事項を入力してください。`、selection=`0-0`、focus output=`false`。disabled / readOnly値も一致 | `labels` APIとfresh a11y snapshotで「編集可能」「無効」「読み取り専用」を各textareaへ関連付け |
| dark | `http://127.0.0.1:4320/preview/textarea-dark/` / `Textarea Dark` | lightと同じ | lightと同じ | lightと同じ |

## editable入力・改行・selection・focus

| theme | BODY → Tab / ring | type・Enter | value / output / selection |
| --- | --- | --- | --- |
| light | editableへfocusし、output `data-focused=true`。transition settle後 `box-shadow: ... oklch(0.556 0 0) 0 0 0 3px ...`、borderもring token、透明度なし | 初期14文字の末尾へ` 追記`をtypeして17、Enterで改行して18、`次の行`をtypeして21 | DOM value / output `data-value`が `確認事項を入力してください。 追記\n次の行` で一致。selectionStart / Endとoutputは `14→17→18→21` で一致 |
| dark | lightと同じ3px / 非透明ring | lightと同じ | lightと同じ |

## disabled・readOnly

| theme | disabled | readOnly |
| --- | --- | --- |
| light | editableからTabするとdisabledをskipしてreadOnlyへ移動。forced click後もfocusはBODY、type後も値=`管理者によって編集が無効です。`で不変 | Tabでfocus可能。実キーtype `変更不可` 後も値=`確認済みの内容です。`、selection=`0-0`で不変 |
| dark | lightと同じ | lightと同じ |

readOnlyへのPlaywright locator `type` はactionability判定でtimeoutしたため、URISK-046に従い実装経路と同じfocus済み要素へのBrowser key入力へ切り替え、値不変を再確認した。これはapplication console errorではない。

## 寸法・resize・semantic token・console

| theme | 寸法 / resize | computed appearance / root token | console error |
| --- | --- | --- | --- |
| light | 3件とも336×64px、`resize=vertical`。2行入力後もmin-height内で64px | editable bg=`transparent`、border=`oklch(0.922 0 0)`。background=`oklch(100% 0 0)`、foreground=`oklch(14.5% 0 0)`、input=`oklch(92.2% 0 0)`、ring=`oklch(55.6% 0 0)` | 0件 |
| dark | lightと同じ | editable bg=`oklab(1 0 0 / 0.045)`、border=`oklch(1 0 0 / 0.15)`。background=`oklch(14.5% 0 0)`、foreground=`oklch(98.5% 0 0)`、input=`oklch(100% 0 0/.15)`、ring=`oklch(55.6% 0 0)` | 0件 |

## screenshots と取得方法

Browserの`tab.screenshot({ fullPage: true })`が返したbytesはlight / darkともJPEG/JFIF magic `ff d8 ff e0`だったため、変換せず`.jpg`として保存し、取得形式と拡張子を一致させた。

- `2026-08-01-textarea-preview-light.jpg`: JPEG/JFIF、1512×828px、magic bytes `ffd8ff`。
- `2026-08-01-textarea-preview-dark.jpg`: JPEG/JFIF、1512×828px、magic bytes `ffd8ff`。

## 再現手順

1. `lsof -nP -iTCP:4320 -sTCP:LISTEN`でport 4320の空きを確認する。
2. `npm run preview -- --host 127.0.0.1 --port 4320`でbuild済み`dist`を配信する。
3. 各routeをfresh navigation / snapshotし、`[data-slot="textarea-preview"]`と3個の`data-preview-textarea`を確認する。
4. BODYからTab、editable末尾へのtype、Enter、2行目type、Tab移動、readOnlyとdisabledへのtypeを行い、DOM value / selectionStart / selectionEnd / activeElementとoutput属性を採取する。
5. focus transition settle後にcomputed ring、各textareaのrect / resize / colors、root token、console errorを採取する。
6. `test -s`、`file`、`sips -g pixelWidth -g pixelHeight`、magic bytes検査で証跡実体を確認する。
