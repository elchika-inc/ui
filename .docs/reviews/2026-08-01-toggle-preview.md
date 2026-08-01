# Toggle preview 実ブラウザ検証

verified_impl_sha: d6cf3f4cea682437027b68f5b4ed32999f0f52d2

- implementation commit: `d6cf3f4cea682437027b68f5b4ed32999f0f52d2`
- Browser: Chrome（Browser Plugin）
- server: `http://127.0.0.1:4322`（空き listener を確認後、build 済み `dist` を `astro preview` で配信）
- 対象 route: `/preview/toggle/`、`/preview/toggle-dark/`
- catalog: 未訪問。バッチ末尾の横断検証へ延期する。

## 成功基準

- 各 route のURL / titleが一致し、fresh snapshotでpreview 1件、button role 7件、controlled / disabled各1件、variant 2件、size 3件が公開される。
- controlled Toggleは初期`aria-pressed=false`、`data-pressed`なし、output=`オフ`で、clickにより`false→true→false`、BODYからTabとSpaceにより`false→true`、Enterにより`true→false`へ遷移し、属性とoutputが同期する。
- controlled Toggleのaccessible nameが「お気に入り」で、button roleと一致する。Toggleはlabel要素を必要としないbutton契約として名前を自身のテキストから得る。
- keyboard focusのtransition settle後、computed ringが非透明semantic colorの3pxになる。
- disabled ToggleはTabをskipし、click / Space / Enter後も`aria-pressed=false`、`data-pressed`なしで不変になる。
- upstreamの全variant（default / outline）と全size（sm / default / lg）が表示され、操作可能で、寸法・border / background / tokenがvariant / size契約を反映する。
- light / darkともconsole errorが0件になる。
- implementation commitからTask 21 component固有8パスの差分がない。

## URL・件数・accessible name

| theme | URL / title | selector / role件数 | controlled初期状態 | accessible name / label契約 |
| --- | --- | --- | --- | --- |
| light | `http://127.0.0.1:4322/preview/toggle/` / `Toggle` | preview 1、button 7、controlled 1、disabled 1、variant 2、size 3 | `aria-pressed=false`、`data-pressed`なし、`data-state`なし、output=`お気に入り: オフ` / `data-pressed=false` | fresh a11y snapshotでbutton「お気に入り」。native button由来の自己ラベルで、`labels` APIは空 |
| dark | `http://127.0.0.1:4322/preview/toggle-dark/` / `Toggle Dark` | lightと同じ | lightと同じ | lightと同じ |

## controlled Toggleの状態遷移

| theme | click | BODY → Tab / ring | Space / Enter |
| --- | --- | --- | --- |
| light | `false→true→false`。true時は`aria-pressed=true`、`data-pressed=""`、output=`オン`、false復帰時は`data-pressed`なし、output=`オフ` | Shift+TabでBODYへ戻した後のTabで「お気に入り」へfocus。300ms settle後、border=`oklch(0.556 0 0)`、box-shadowに同色`0 0 0 3px`、透明度なし | Spaceで`false→true`、Enterで`true→false`。各時点で`aria-pressed` / `data-pressed` / outputが同期し、`data-state`は常に存在しない |
| dark | lightと同じ | lightと同じ3px / 非透明ring | lightと同じ |

Toggleがnative buttonを基底にする契約どおり、SpaceだけでなくEnterでも状態が遷移した。

## disabled Toggle

| theme | Tab | click | Space / Enter |
| --- | --- | --- | --- |
| light | controlledからTabするとdisabledをskipし、次の`variant-default`へfocus | forced click後もdisabledはfocusされず、`aria-pressed=false`、`data-pressed` / `data-state`なし | BODYへ戻った実キーSpace / Enter後も同じfalse状態で不変 |
| dark | lightと同じ | lightと同じ | lightと同じ |

disabled buttonはkeyboard focus対象にならないため、Space / EnterはBODYをactive elementとした実キー入力後にdisabled属性の不変を確認した。

## variants / sizes・computed appearance

全5件を個別にclickし、`aria-pressed=true`、`data-pressed=""`、`data-state`なしへの遷移をlight / darkで確認した。押下後のbackgroundはlightでmuted token `oklch(0.97 0 0)`、darkで`oklch(0.269 0 0)`になった。

| 対象 | light寸法 / border | dark寸法 / border |
| --- | --- | --- |
| variant default | 66.367×32px / 0px | 同寸法 / 0px |
| variant outline | 67.344×32px / 1px `oklch(0.922 0 0)` | 同寸法 / 1px `oklch(1 0 0 / 0.15)` |
| size sm | 36.938×28px | 同寸法 |
| size default | 66.367×32px | 同寸法 |
| size lg | 36×36px | 同寸法 |

root tokenはlightでbackground=`oklch(100% 0 0)`、foreground=`oklch(14.5% 0 0)`、muted=`oklch(97% 0 0)`、ring=`oklch(55.6% 0 0)`、darkでbackground=`oklch(14.5% 0 0)`、foreground=`oklch(98.5% 0 0)`、muted=`oklch(26.9% 0 0)`、ring=`oklch(55.6% 0 0)`だった。

## console・実装不変

- light / darkともBrowserのerror-level console logは0件。
- `git diff --exit-code d6cf3f4cea682437027b68f5b4ed32999f0f52d2 -- <Task 21 implementation 8 paths>`はexit 0。
- same-tabでdarkへ遷移した直後、fresh snapshotは取得できた一方でlocatorが2回timeoutした。URISK-046に従い実装ではなく検証経路を切り分け、新しいdark tabで同一URL / title / fresh snapshotを確認後に全ケースを再実行した。application console errorではない。

## screenshots と取得方法

Browserの`tab.screenshot({ fullPage: true })`が返したbytesはlight / darkともJPEG/JFIF magic `ff d8 ff e0`だったため、変換せず`.jpg`として保存し、取得形式と拡張子を一致させた。

- `2026-08-01-toggle-preview-light.jpg`: JPEG/JFIF、1512×828px、18,379 bytes、magic bytes `ffd8ff`。
- `2026-08-01-toggle-preview-dark.jpg`: JPEG/JFIF、1512×772px、18,534 bytes、magic bytes `ffd8ff`。

## 再現手順

1. `lsof -nP -iTCP:4322 -sTCP:LISTEN`でport 4322の空きを確認する。
2. `npm run preview -- --host 127.0.0.1 --port 4322`でbuild済み`dist`を配信する。
3. 各routeをfresh navigation / snapshotし、`[data-slot="toggle-preview"]`、button role、`data-preview-toggle`の各件数を確認する。
4. controlledをclickで往復し、BODYからTab、Space、Enterを実キー入力して、`aria-pressed` / `data-pressed` / `data-state` / output / activeElementを採取する。
5. focus transition settle後にcomputed ringを採取し、disabledのTab skip、forced click、BODY上のSpace / Enter後の不変を確認する。
6. variant 2件とsize 3件を個別にclickし、pressed属性、rect、background、border、root token、console errorを採取する。
7. `test -s`、`file`、`sips -g pixelWidth -g pixelHeight`、magic bytes検査で証跡実体を確認する。
