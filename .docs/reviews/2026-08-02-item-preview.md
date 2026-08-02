# 動作検証レポート: Item Preview

verified_impl_sha: bb72dd6443e534b86b507f8ea94fd75981c6f614

## 結論

判定は ✅ PASS。

Light / Dark の両テーマで、ItemGroup、2件の Item、separator、polymorphic anchor、キーボード順序、accessible name、button/link の不透明3px focus ring、semantic token、JPEG証跡を実ブラウザーで確認した。

- ✅ 実測確認: 13ケース
- ❌ 不具合: 0件
- 🔁 flaky: 0件
- ブラウザーコンソールエラー: Light 0件 / Dark 0件
- リポジトリ変更: なし

## 実行環境

- 検証日時: 2026-08-02 07:07:31 JST
- 対象コミット: 上記 `verified_impl_sha`
- server: `http://127.0.0.1:3013`
- Light: `/preview/item/`
- Dark: `/preview/item-dark/`
- selector: `[data-slot="item-preview"]`
- OS: macOS 26.3.1（Build 25D2128、arm64）
- Node.js: v26.4.0
- Browser: Google Chrome 150.0.7871.187
- 終了時 `git status --short`: 出力なし
- 対象ファイルの `git diff --exit-code`: exit code 0
- 最終ゲート: exit code 0

## 成功基準と結果

| # | 動作パターン | 導出元 | 判定 | 実体エビデンス |
|---|---|---|---|---|
| 1 | 両themeのhydration | コード・画面 | ✅実測確認 | selector各1件 |
| 2 | console error | 画面 | ✅実測確認 | Light/Dark各0件 |
| 3 | ItemGroup構造 | コード・画面 | ✅実測確認 | `DIV role=list` |
| 4 | Item 2件とseparator | コード・画面 | ✅実測確認 | `DIV:item → DIV:item-separator → A:item` |
| 5 | 先頭Item構成 | コード・画面 | ✅実測確認 | media/content/title/description/actions/button |
| 6 | polymorphic anchor | コード・画面・型 | ✅実測確認 | `A[data-slot=item][href="#item-detail"]` |
| 7 | Tab順 | 画面 | ✅実測確認 | 設定button → プロフィールlink → BODY |
| 8 | accessible name | 画面 | ✅実測確認 | button「設定」、linkはtitle+description |
| 9 | button focus ring | コード・画面 | ✅実測確認 | `--ring`、3px、alphaなし |
| 10 | link focus ring | コード・画面 | ✅実測確認 | border/ringとも`--ring`、3px、alphaなし |
| 11 | theme token | コード・画面 | ✅実測確認 | background/foreground/border/muted/ring到達 |
| 12 | separator | コード・画面 | ✅実測確認 | horizontal、role=separator、528×1px |
| 13 | JPEG | 画面 | ✅実測確認 | JFIF、SOI `ffd8`、2枚 |

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky / ⏭️未実行 / ❌不具合

導出元ラベル: コード / 画面 / 型

## 実DOM構造

```text
DIV[data-slot="item-group"][role="list"]
├── DIV[data-slot="item"]
├── DIV[data-slot="item-separator"][role="separator"]
└── A[data-slot="item"][href="#item-detail"]
```

先頭 Item は icon media、title「通知設定」、description、actions、button「設定」を持つ。後半 Item は `useRender` により wrapper を増やさず実 DOM 自身が anchor となり、title「プロフィールを確認」、description、actions を持つ。

## keyboard と focus ring

Light / Dark とも Tab 順は次のとおりだった。

1. `BUTTON[data-slot="button"]`「設定」
2. `A[data-slot="item"]`「プロフィールを確認 公開情報と表示状態を確認します。」
3. `BODY`

button と link は各々直接 keyboard 到達可能だった。button/link の ring は `oklch(0.556 0 0)`、3px、alphaなし。link は border も同色で、root の `--ring: oklch(55.6% 0 0)` と数値一致した。

## theme token

Light は background `oklch(1 0 0)`、foreground `oklch(0.145 0 0)`、border `oklch(0.922 0 0)`、muted foreground `oklch(0.54 0 0)`。Dark は background `oklch(0.145 0 0)`、foreground `oklch(0.985 0 0)`、separator `oklch(1 0 0 / 0.1)`、muted foreground `oklch(0.708 0 0)`。両 theme の ring は `oklch(0.556 0 0)` だった。

separator は両 theme で `role="separator"`、`data-orientation="horizontal"`、528×1pxだった。

## JPEG証跡

Browser API に `format: "jpeg"` を指定して直接取得した。返却型は `Uint8Array`、先頭8 byte は `ff d8 ff e0 00 10 4a 46` だった。

| テーマ | 保存先 | サイズ | 寸法 | SHA-256 |
|---|---|---:|---:|---|
| Light | `/private/tmp/item-preview-light.jpg` | 18,474 bytes | 1512×828 | `01d81dfebb6c2b8d325258ee9ae6e20e616b22dd987abfe7f5afc940589cf99a` |
| Dark | `/private/tmp/item-preview-dark.jpg` | 18,010 bytes | 1512×772 | `50e081e30c6477f4e864f1a6ae32adfc2bacf0bf55e1971133253a3a113404f3` |

撮影時は profile anchor が keyboard focus 中で、不透明3px ring、先頭 Item、設定 button、horizontal separator、後半 Item を表示した。

## 三方向導出と未到達分岐

コード・画面・型から ItemGroup、separator、variant/size、polymorphic render、media/content/title/description/actions/header/footer を照合した。今回の Preview から到達しないものは次のとおり。

- muted variant、sm/xs size
- default/image media
- ItemHeader / ItemFooter
- 複数ItemContent隣接時
- description内link
- dropdown menu内xs Item
- vertical separator
- anchor以外のcustom render
- disabled/invalid button
- click後の業務処理、link navigation、hover

ItemGroup の `role="list"` は確認したが、各 Item への `role="listitem"` 要否は今回の rubric に含まれないため未判定とした。

## 発見した不具合

なし。

## 未検証の残

- button click後処理、link実navigation、hover
- image load失敗、長文・多言語
- 実screen reader
- Chrome/macOS以外
- mobile viewport、zoom、高コントラスト、強制色
- JavaScript無効環境

## クリーンアップ

- 検証データ作成: なし
- repo変更: なし
- `/private/tmp` の JPEG 2件は証跡として保持
- 証跡合計10MB未満
- Browser session: finalize済み
- `.docs/actions/` 登録候補: なし
- brain候補: polymorphic componentはsourceのrender指定だけでなく実DOM tag・href・Tab到達を確認する
