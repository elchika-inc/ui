verified_impl_sha: a399ba41b6b680e42ab72c11bc16e92d218c52a7

# `/components/` キーボード・アクセシビリティ検証

## 検証対象と方法

- 実装: `a399ba41b6b680e42ab72c11bc16e92d218c52a7`。
- 起動: npm で依存を導入した後、`npm run build:site`、`npm run preview -- --host 127.0.0.1` の順で実行し、`http://127.0.0.1:4322/components/` を Chrome で開いた。
- テーマ: theme toggle で light / dark を切り替えた。Tab 順の独立した起点を作るため、同じ静的ページへ機能を持たないクエリ `?a11y-light` / `?a11y-dark` を付けたタブを使用した。
- キーボード: `body` を起点に実キーの Tab / Shift+Tab / Enter / Space を送り、各操作後の `document.activeElement`、URL、DOM を取得した。
- 読み上げ相当: Chrome DevTools Protocol の `Accessibility.getFullAXTree` で、role、accessible name、heading level、ignored 状態を取得した。

## 1. Tab 順序

light / dark とも同じ結果だった。

- ページ先頭の最初の停止先は `本文へ移動`、続いて `elchika-inc/ui`、`はじめに`、`コンポーネント一覧`、Sidebar の component リンクの順だった。
- component カードの最初の停止先は Tab 97 回目の `Button のドキュメントを開く` だった。component カード 61 件では、各カードのドキュメントリンクだけに 1 回ずつ停止し、preview 内部の操作要素には停止しなかった。
- component / block の境界を含む実測順は次のとおりだった。

```text
Direction のドキュメントを開く
→ Resizable のドキュメントを開く
→ Scroll Area のドキュメントを開く
→ Separator のドキュメントを開く
→ login-01: プレビューを読み込む
→ Login 01 のドキュメントを開く
→ login-02: プレビューを読み込む
→ Login 02 のドキュメントを開く
→ login-03: プレビューを読み込む
→ Login 03 のドキュメントを開く
```

- `Login 03` のカードリンクまで 163 個の停止先を記録した。カード内は DOM の順どおり block の button が link より先だった。
- 全 89 カードの DOM 順を `getBoundingClientRect()` の `y`、`x` で並べた視覚順と比較し、不一致は 0 件だった。記録した 64 カードの最初の停止先の順と DOM 順の不一致も 0 件だった。

## 2. Enter / Space の発火先

| テーマ | キー | 対象 | 観測結果 |
|---|---|---|---|
| light | Enter | `login-01` の `プレビューを読み込む` | button が消え、`src="/preview/login-01/"` の iframe が現れた。URL は `/components/?a11y-light` のままで、ドキュメントページへ遷移しなかった。 |
| light | Space | `login-02` の `プレビューを読み込む` | button が消え、`src="/preview/login-02/"` の iframe が現れた。URL は `/components/?a11y-light` のままで、ドキュメントページへ遷移しなかった。 |
| dark | Enter | `login-01` の `プレビューを読み込む` | button が消え、`src="/preview/login-01-dark/"` の iframe が現れた。URL は `/components/?a11y-dark` のままで、ドキュメントページへ遷移しなかった。 |
| dark | Space | `login-02` の `プレビューを読み込む` | button が消え、`src="/preview/login-02-dark/"` の iframe が現れた。URL は `/components/?a11y-dark` のままで、ドキュメントページへ遷移しなかった。 |

いずれもキー入力は button を発火させ、カード全体を覆う link は発火しなかった。

## 3. フォーカスの可視性

CSS transition の完了後に computed style を取得した。

| テーマ | 対象 | 観測した computed style |
|---|---|---|
| light | カード link | link は `:focus-visible`、article は `:focus-within` だった。link の `outline-style` は `none` だが、link に `rgba(47, 95, 209, 0.28) 0 0 0 3px`、article 全体に `rgb(47, 95, 209) 0 0 0 3px` の `box-shadow` が描画された。 |
| light | block button | button は `:focus-visible`、article は `:focus-within` だった。button の border と 3px ring、article 全体の 3px ring はいずれも `rgb(47, 95, 209)` だった。 |
| dark | カード link | link は `:focus-visible`、article は `:focus-within` だった。link の `outline-style` は `none` だが、link に `rgba(110, 147, 240, 0.36) 0 0 0 3px`、article 全体に `rgb(110, 147, 240) 0 0 0 3px` の `box-shadow` が描画された。 |
| dark | block button | button は `:focus-visible`、article は `:focus-within` だった。button の border と 3px ring、article 全体の 3px ring はいずれも `rgb(110, 147, 240)` だった。 |

確認時のカード矩形は viewport 内の `x=1057, y=198, width=307, height=354`、button 矩形は `x=1130, y=382, width=162, height=32` だった。両テーマとも card 全体と button の双方に輪郭が出るため、画面上で現在位置を判別できた。

## 4. `inert` の実効性

light / dark とも同じ結果だった。

- `button` preview は `inert=""` と `aria-hidden="true"` を持ち、その内側には keyboard-interactive な要素が 9 件あった。
- `checkbox` preview は `inert=""` と `aria-hidden="true"` を持ち、その内側には keyboard-interactive な要素が 8 件あった。
- `input` preview は `inert=""` と `aria-hidden="true"` を持ち、その内側には keyboard-interactive な要素が 3 件あった。
- 実際の Tab 記録では component カード 61 件の停止先は各カードの link 61 件だけで、preview 内部の button / input への停止は 0 件だった。
- a11y tree に `保存する`、`キャンセル`、`絞り込み`、`削除する`、`送信中` など `button` preview 内部の名前は現れなかった。

React は `inert` 属性を DOM へ出力しており、Tab 順と a11y tree の両方で preview 内部を除外していた。

## 5. アクセシブルネームと見出し構造

light / dark とも同じ結果だった。

- a11y tree 上のカード link は 89 件だった。DOM から導出した 89 件の期待値と全件一致し、先頭は `Button のドキュメントを開く`、末尾は `Sidebar 16 のドキュメントを開く` だった。
- 未読込 block の button は 28 件で、accessible name の unique 値は `プレビューを読み込む` の 1 件だけだった。28 件すべてが同一名である。
- a11y tree と inert 領域を除いた DOM の見出しは 128 件で、level 1 が 1 件、level 2 が 10 件、level 3 が 117 件、level 4 以上が 0 件だった。
- DOM 順は `h1 コンポーネント一覧 → h2 アクション → h3 Button ... → h2 フォーム → h3 Calendar ...` だった。block 区間は `h2 認証 → h3 隔離プレビューを開始 → h3 Login 01 → ...` で、見出しレベルを飛ばす遷移は 0 件だった。

button の同名 28 件と、block ごとに説明用 h3 とカード名 h3 が並ぶ点は観測事実として残す。いずれも button / link のキーボード操作、発火先、フォーカス可視性、`inert` の実効性を壊しておらず、本タスクの修正条件外なので変更しなかった。

## 6. iframe の読み上げ

| テーマ | DOM | a11y tree |
|---|---|---|
| light | `login-01` の iframe は `title="Login 01 の隔離プレビュー"`、`src="/preview/login-01/"` だった。 | `role=Iframe`、`name=Login 01 の隔離プレビュー`、`ignored=false` として現れた。 |
| dark | `login-01` の iframe は `title="Login 01 の隔離プレビュー"`、`src="/preview/login-01-dark/"` だった。 | `role=Iframe`、`name=Login 01 の隔離プレビュー`、`ignored=false` として現れた。 |

iframe の accessible name は `title` と一致していた。

## 判定

キーボードだけで button と link に到達でき、Enter / Space は意図した button だけを発火させ、フォーカス位置は可視で、`inert` も実効していた。委任仕様 §2-2 の修正条件に該当する問題はなかったため、`src/site/component-index.tsx` は変更していない。
