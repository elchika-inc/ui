verified_impl_sha: 4a0a38e43e947a8bcf800e3b5390db4134e847a7

# `/components/` アクセシビリティ修正後検証

## 検証対象と方法

- 実装: `4a0a38e43e947a8bcf800e3b5390db4134e847a7`。
- 起動: `npm run build:site` の後、`npm run preview` で生成物を配信した。
- 読み上げ相当: light / dark の `/components/` を実ブラウザで開き、a11y tree から role、accessible name、heading level を取得した。
- キーボード: Chrome で既存証跡と同じ component / block 境界を起点に実キーの Tab を送り、各操作後の `document.activeElement` を取得した。
- 視覚表示: light / dark の画面を撮影してボタン表示を目視し、あわせて button の直接のテキストノードと `sr-only` span の computed style を取得した。
- 変更前の値と操作順は [2026-08-28-component-index-a11y.md](./2026-08-28-component-index-a11y.md) を参照した。同ファイルは変更していない。

## 1. block button の accessible name

light / dark とも同じ結果だった。

| テーマ | 状態 | button 件数 | accessible name の unique 件数 |
|---|---|---:|---:|
| light | 変更前 | 28 | 1 |
| light | 変更後 | 28 | 28 |
| dark | 変更前 | 28 | 1 |
| dark | 変更後 | 28 | 28 |

変更後に a11y tree から取得した実際の値には、次が含まれていた。

- `Login 01 の プレビューを読み込む`
- `Signup 01 の プレビューを読み込む`
- `Dashboard 01 の プレビューを読み込む`
- `Sidebar 01 の プレビューを読み込む`
- `Sidebar 16 の プレビューを読み込む`

要素境界の空白は accname 仕様どおりの挙動であり、28 件の一意性と Label in Name の充足には影響しない。視覚テキスト `プレビューを読み込む` は、各 accessible name に連続した部分文字列として含まれていた。

## 2. 見出し構造

light / dark とも同じ結果だった。

| 状態 | h1 | h2 | h3 | h4 以上 | 合計 | level skip |
|---|---:|---:|---:|---:|---:|---:|
| 変更前 | 1 | 10 | 117 | 0 | 128 | 0 |
| 変更後 | 1 | 10 | 89 | 0 | 100 | 0 |

変更後の block 区間は `h2 認証 → h3 Login 01 → h3 Login 02 → ...` となり、`隔離プレビューを開始` は paragraph として a11y tree に現れた。カード名の h3 は 28 件すべて残り、h3 は変更前の 117 件から 89 件へ 28 件減った。

## 3. Tab 順序

light / dark とも、component / block 境界で次の順序を実測した。

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

変更前の証跡 §1 と一致し、button と link の間に停止先は増えていなかった。追加した `sr-only` span は focusable ではなく、各 block では従来どおり button、link の順に 1 回ずつ停止した。

## 4. 視覚上の表示

| テーマ | button の画面表示 | 追加テキストの状態 |
|---|---|---|
| light | `プレビューを読み込む` | `Login 01 の` などの block 名は画面に表示されなかった |
| dark | `プレビューを読み込む` | `Login 01 の` などの block 名は画面に表示されなかった |

実ブラウザで取得した button の直接のテキストノードは light / dark とも `プレビューを読み込む` だった。`sr-only` span の computed style は `position: absolute`、`width: 1px`、`height: 1px`、`overflow: hidden`、`white-space: nowrap` で、実測矩形も 1 × 1 px だった。

## 判定

未読込 block button 28 件の accessible name は全件一意になり、見出しは h3 が 117 件から 89 件へ減った。light / dark とも h4 以上と level skip は 0 件、Tab 順序は変更前と一致し、button の視覚表示は `プレビューを読み込む` のままだった。
