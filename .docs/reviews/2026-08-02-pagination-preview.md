# 動作検証レポート: Pagination Preview 修正後再検証

verified_impl_sha: c3a93e12cae2583d4013968c27f5444300f8c8a5

## 結論

総合判定: ✅ PASS

前回検出したリンク意味論の欠落と、中間ページで current 表示が消失する問題は、Light / Dark の実ブラウザ再検証で解消を確認した。

## 実行環境

- 検証日時: 2026-08-02 08:19:48 JST
- OS: macOS 26.3.1 / Darwin 25.3.0 arm64
- ブラウザ: Google Chrome 150.0.7871.187
- Light: `http://127.0.0.1:3013/preview/pagination/`
- Dark: `http://127.0.0.1:3013/preview/pagination-dark/`
- 実行方法: `npm run preview -- --host 127.0.0.1 --port 3013`
- 起動ログURL: `http://127.0.0.1:3013/`
- 接続先: `127.0.0.1:3013`
- 起動前port 3013: LISTENなし
- 起動中: Node PID 7018が`127.0.0.1:3013`でLISTEN
- 両route: HTTP 200
- 終了時: server停止、port 3013 LISTENなし
- repo: staged / unstaged差分なし

## 成功基準

- hydration後、previewとpagination selectorが各1件。
- navigation landmarkのaccessible nameが「ページネーション」。
- 全PaginationLinkが`a[href]`で、`role="button"`を持たず、a11y treeでlinkとして公開される。
- 前、1、2、3、8、次の各linkに意図したaccessible nameがある。
- currentのみ`aria-current="page"`と`data-active`を持ち、常に各1件。
- page 4〜7ではcurrentが可視linkとして挿入される。
- page 1のPreviousとpage 8のNextはdisabled、tab順序外、強制clickでも不変。
- pointer click、Enter、Previous / Nextで正しく遷移する。
- keyboard focus ringが不透明3px。
- ellipsisのaccessible textが「その他のページ」で、装飾iconは`aria-hidden="true"`。
- Light / Dark tokenがcomputed styleへ到達する。
- console error / warning / page exceptionが0。
- JPEGをブラウザAPIから直接取得し、拡張子、形式、magic bytesが一致する。

## ケースと結果

| # | 手順 | 期待 | 実測 | 判定 |
|---|---|---|---|---|
| 1 | 各routeを開き500ms待機 | selector各1件、ready complete | preview=1、pagination=1、ready=complete | ✅ |
| 2 | navのa11y tree取得 | navigation「ページネーション」 | Light / Darkとも一致 | ✅ |
| 3 | 全PaginationLinkのDOMとa11y treeを列挙 | `A`、roleなし、a11y role=link | 6要素すべて一致 | ✅ |
| 4 | 初期状態を列挙 | page 1だけcurrent / active | 両属性とも1件、対象page 1 | ✅ |
| 5 | Previousをhit-test、強制click | pointer対象外、page 1維持 | hit先LI、強制click後もpage 1 | ✅ |
| 6 | bodyからTab | Previousをskipしてpage 1 | 最初のfocusは「1ページへ」 | ✅ |
| 7 | focus後250msでcomputed style取得 | 不透明3px ring | `oklch(0.556 0 0) ... 3px` | ✅ |
| 8 | page 2をpointer click | current page 2 | current / active各1件 | ✅ |
| 9 | page 1へ戻り、Tab×2後Enter | page 2へ遷移 | focus「2ページへ」、current page 2 | ✅ |
| 10 | page 2でPrevious | page 1へ戻る | current page 1 | ✅ |
| 11 | page 2でNext | page 3へ進む | current page 3 | ✅ |
| 12 | page 3でNext | page 4が可視current | 可視`1,2,3,4,8`、current / active各1件 | ✅ |
| 13 | page 4でPrevious | page 3へ戻る | 可視`1,2,3,8`、current page 3 | ✅ |
| 14 | Nextでpage 5、6、7へ順次遷移 | 各currentが可視、属性各1件 | 可視current 5 / 6 / 7、属性各1件 | ✅ |
| 15 | page 7でNext | page 8、Next disabled | current page 8、`aria-disabled=true`、tabIndex=-1 | ✅ |
| 16 | disabled Nextをhit-test、強制click | page 8維持 | hit先LI、current / active各1件を維持 | ✅ |
| 17 | page 8でTab列を確認 | Nextをskip | Previous→1→2→3→8→BODY | ✅ |
| 18 | ellipsis DOM / a11y確認 | textと装飾分離 | text「その他のページ」、SVG aria-hidden=true | ✅ |
| 19 | theme tokenとcomputed style取得 | 各themeへ到達 | 下記token節の値を確認 | ✅ |
| 20 | console / pageerror収集 | 0件 | errors=[]、warnings=[]、pageErrors=[] | ✅ |
| 21 | `page.screenshot({type:'jpeg'})` | JPEG Buffer / JFIF / `.jpg` | 両themeで一致 | ✅ |

全ケースはLight / Darkの双方で独立実行した。

## Link意味論

全linkについて以下を確認した。

- tag: `A`
- `href`あり
- 明示`role`なし
- a11y tree: `link`
- accessible names:
  - `前のページへ`
  - `1ページへ`
  - `2ページへ`
  - `3ページへ`
  - `8ページへ`
  - `次のページへ`

前回観測した`role="button"`とa11y tree上のbutton意味論は存在しない。

## current状態タイムライン

| 操作後 | 可視ページ | current | Previous href | Next href | `aria-current`件数 | `data-active`件数 |
|---|---|---|---|---|---:|---:|
| 初期 | 1,2,3,8 | 1 | `#page-1` | `#page-2` | 1 | 1 |
| page 2 | 1,2,3,8 | 2 | `#page-1` | `#page-3` | 1 | 1 |
| Next | 1,2,3,8 | 3 | `#page-2` | `#page-4` | 1 | 1 |
| Next | 1,2,3,4,8 | 4 | `#page-3` | `#page-5` | 1 | 1 |
| Next | 1,2,3,5,8 | 5 | `#page-4` | `#page-6` | 1 | 1 |
| Next | 1,2,3,6,8 | 6 | `#page-5` | `#page-7` | 1 | 1 |
| Next | 1,2,3,7,8 | 7 | `#page-6` | `#page-8` | 1 | 1 |
| Next | 1,2,3,8 | 8 | `#page-7` | `#page-8` | 1 | 1 |

## Theme token

### Light

- background: `oklch(100% 0 0)`
- foreground: `oklch(14.5% 0 0)`
- primary: `oklch(20.5% 0 0)`
- secondary: `oklch(97% 0 0)`
- muted: `oklch(97% 0 0)`
- ring: `oklch(55.6% 0 0)`
- border: `oklch(92.2% 0 0)`
- body background: `oklch(1 0 0)`
- body color: `oklch(0.145 0 0)`

### Dark

- background: `oklch(14.5% 0 0)`
- foreground: `oklch(98.5% 0 0)`
- primary: `oklch(92.2% 0 0)`
- secondary: `oklch(26.9% 0 0)`
- muted: `oklch(26.9% 0 0)`
- ring: `oklch(55.6% 0 0)`
- border: `oklch(100% 0 0/.1)`
- body background: `oklch(0.145 0 0)`
- body color: `oklch(0.985 0 0)`

## JPEG evidence

取得方法:

```js
await page.screenshot({
  path: "/private/tmp/2026-08-02-pagination-preview-<theme>.jpg",
  type: "jpeg",
  quality: 90,
  fullPage: false,
});
```

ブラウザAPIはNode.js `Buffer`を返し、先頭8 bytesは両方とも`ff d8 ff e0 00 10 4a 46`だった。PNG等からの変換は行っていない。

### Light

- `/private/tmp/2026-08-02-pagination-preview-light.jpg`
- JPEG / JFIF 1.01
- 2400×1724
- 30,883 bytes
- SHA-256: `ca8a7a7c6410caec1758431ec3d2ad81c0e6eb6b6a78ae34f1f2a407c8056806`

### Dark

- `/private/tmp/2026-08-02-pagination-preview-dark.jpg`
- JPEG / JFIF 1.01
- 2400×1724
- 30,806 bytes
- SHA-256: `cf7450d94134c7bf7fc5f5ce9338a3a96d2002c9dd3aa260c2b603bddd8114ff`

両画像を開き、page 8 current、disabled Next、keyboard focus ring、theme表示を目視確認した。

## 未到達・限界

- current page数やlastPageを外部入力する経路はpreviewにない。
- page 0、負数、lastPage超過はUIから到達不能。
- Firefox / Safari、スクリーンリーダー実機、RTL、zoom、高コントラストは未実行。
- pointer hover、touch、長時間連打は未実行。
- 同一エージェントが列挙・実行・判定しているため、最終承認は人間にある。

## クリーンアップ

- preview serverを停止。
- port 3013のLISTENなしを確認。
- repoのstaged / unstaged差分なし。
- repo内への書き込みなし。
- `/private/tmp`のMarkdown 1件とJPEG 2件のみ作成・更新。
