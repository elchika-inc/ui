# Switch preview 実ブラウザ検証

verified_impl_sha: 1dc76479e48b8469c8b167a0bf987e57deeb9256

- implementation commit: `1dc76479e48b8469c8b167a0bf987e57deeb9256`
- Browser: Chrome（Browser Plugin）
- server: `http://127.0.0.1:4319`（空き listener を確認後、build 済み `dist` を `astro preview` で配信）
- 対象 route: `/preview/switch/`、`/preview/switch-dark/`
- catalog: 未訪問。バッチ末尾の横断検証へ延期する。

## 成功基準

- 各 route の URL と title が一致し、fresh DOM snapshot で preview 1件、有効・無効 Switch が各1件見える。
- 有効 Switch は初期 `false` で、click 往復と keyboard の Space に状態・ARIA・output・表示が追随する。
- BODY からの Tab で有効 Switch だけが focus され、非透明な semantic ring が computed 3px になる。
- 無効 Switch は Tab を skip し、click と Space でも checked 状態が変わらない。
- light / dark の semantic token と checked / unchecked の track・thumb 表示が対応する。
- console error が0件で、implementation commit から component path の差分がない。

## URL・件数・label association

| theme | URL / title | selector 件数 | 初期状態 | label / a11y |
| --- | --- | --- | --- | --- |
| light | `http://127.0.0.1:4319/preview/switch/` / `Switch` | preview 1、switch 2、thumb 2、enabled 1、disabled 1 | enabled `aria-checked=false` / input false / output「更新通知: オフ」、disabled `aria-checked=true` / `aria-disabled=true` | label `for=switch-notifications` と hidden input id が一致し、label は visible switch を包含。snapshot は switch「更新通知」を公開 |
| dark | `http://127.0.0.1:4319/preview/switch-dark/` / `Switch Dark` | light と同じ | light と同じ | light と同じ。snapshot は disabled switch「管理者によって固定」も checked / disabled として公開 |

## pointer・keyboard・focus・disabled

| theme | click | BODY → Tab / Space | focus ring | disabled invariant |
| --- | --- | --- | --- | --- |
| light | `false → true → false`。ARIA / hidden input / output は `false / オフ → true / オン → false / オフ` | BODY から Tab で enabled switch に focus。Space で `false → true` | transition settle 後 `box-shadow: ... oklch(0.556 0 0) 0 0 0 3px ...`、border も同 token。透明度なし | `tabIndex=-1` で enabled からの Tab 後は BODY へ移り disabled を skip。force click 後も true、続く BODY Space 後も true、focus なし |
| dark | light と同じ | light と同じ | light と同じ3px / 非透明 ring | light と同じ |

## track・thumb・semantic token

| theme | unchecked | checked | root semantic token |
| --- | --- | --- | --- |
| light | track=`oklch(0.922 0 0)`、thumb=`oklch(1 0 0)`、thumb offset=1px | track=`oklch(0.205 0 0)`、thumb=`oklch(1 0 0)`、thumb offset=15px | background=`oklch(100% 0 0)`、foreground=`oklch(14.5% 0 0)`、input=`oklch(92.2% 0 0)`、primary=`oklch(20.5% 0 0)`、ring=`oklch(55.6% 0 0)` |
| dark | track=`oklab(1 0 0 / 0.12)`、thumb=`oklch(0.985 0 0)`、thumb offset=1px | track=`oklch(0.922 0 0)`、thumb=`oklch(0.205 0 0)`、thumb offset=15px | background=`oklch(14.5% 0 0)`、foreground=`oklch(98.5% 0 0)`、input=`oklch(100% 0 0/.15)`、primary=`oklch(92.2% 0 0)`、ring=`oklch(55.6% 0 0)` |

## console・実装固定

- console error: light 0件、dark 0件。
- `git diff --exit-code 1dc76479e48b8469c8b167a0bf987e57deeb9256 -- <Task 19 implementation 8 paths>`: exit 0。

## screenshots と取得方法

Browser の `tab.screenshot({ fullPage: true })` で取得した bytes は light / dark とも JPEG/JFIF magic `ff d8 ff e0` だったため、変換せず `.jpg` として保存し、取得形式と拡張子を一致させた。

- `2026-08-01-switch-preview-light.jpg`: JPEG/JFIF、1512 × 828px、magic bytes `ffd8ff`。
- `2026-08-01-switch-preview-dark.jpg`: JPEG/JFIF、1512 × 828px、magic bytes `ffd8ff`。

## 再現手順

1. `git checkout 1dc76479e48b8469c8b167a0bf987e57deeb9256` 相当の固定実装を用意する。
2. port 4319 に listener がないことを `lsof -nP -iTCP:4319 -sTCP:LISTEN` で確認する。
3. `npm run preview -- --host 127.0.0.1 --port 4319` で build 済み `dist` を配信する。
4. 各 route を fresh navigation / snapshot し、`[data-slot="switch-preview"]`、`[data-preview-switch="enabled"]`、`[data-preview-switch="disabled"]` を基準に上表の操作を行う。
5. computed style、ARIA、hidden input、output、activeElement、console error を各操作直後に採取する。focus ring は CSS transition settle 後に採取する。
6. `file`、`sips -g pixelWidth -g pixelHeight`、`node --test "scripts/*.test.mjs"` で画像形式・寸法・magic bytes 検査を確認する。
