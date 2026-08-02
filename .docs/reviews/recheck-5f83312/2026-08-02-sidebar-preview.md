# Sidebar Task 9 R3 動作検証レポート

verified_impl_sha: 5f8331231ee849330ea0bdd5288338e0f7b5eb1f

## 結論

- 判定: **PASS**
- Light / Darkを各3つのfresh tab、計6/6で実測した。
- desktopの`#sidebar-preview-props`へ`id`、`data-preview-props`、consumer class、公開`touchAction`、`dir=ltr`が同時に届いた。
- mobile 390×844でopenしたSheetContentにも同じ公開propsと`dir=ltr`が届いた。
- open後は検索inputへautofocusし、同inputからEscapeを1回押すとSheetが閉じ、dialogが消え、triggerへfocusが戻った。Light / Dark各3/3で一致した。
- console error / pageerror / network error / 4xx / 5xxは全run 0だった。
- 指定Light / Dark JPEGをCDPからJPEGとして直接取得し、JFIF magic・形式・寸法・目視対象の一致を確認した。

## 実行環境

| 項目 | 実測値 |
|---|---|
| リポジトリ | `/Users/nishikawa/projects/elchika-inc/ui` |
| branch | `feat/batch-final` |
| 固定HEAD | `5f8331231ee849330ea0bdd5288338e0f7b5eb1f` |
| 検証日時 | 2026-08-02 14:34〜14:50 JST |
| OS | macOS 26.3.1（Build 25D2128）、arm64 |
| Node.js / npm | v26.4.0 / 11.17.0 |
| Browser | Google Chrome 150.0.7871.187 |
| Astro | 7.1.6 |
| server | `127.0.0.1:3018`、PID 77895 |
| URL | Light `/preview/sidebar/`、Dark `/preview/sidebar-dark/` |
| desktop | 採用runは1280×900またはChrome既定1512×828 / 1512×772。全て`md`以上 |
| mobile | 390×844を各runで明示設定 |
| fresh build | `npm run build` exit 0、125 pages生成 |
| 実行可否 | ✅ Light / Darkとも実行 |

## 成功基準（実行前rubric）

1. 各themeを3つのfresh tabで実行する。
2. desktopでpreview 1件、expanded / `data-mobile=false`となる。
3. desktopの同一DOMに`id=sidebar-preview-props`、`data-preview-props=forwarded`、`sidebar-preview-props` class、`touch-action=manipulation`、`dir=ltr`が存在する。
4. mobile 390×844の閉状態を確認後、唯一のSidebarTriggerでopenする。
5. openしたSheetContentにdesktopと同じ公開props、`data-mobile=true`、`dir=ltr`が存在する。
6. mobile open時にdialog 1件、検索input autofocus、`data-mobile-open=true`となる。
7. 検索inputからEscape 1回でSheetContent / dialogが消え、`data-mobile-open=false`、trigger focus returnとなる。
8. 全監視区間で4xx / 5xx、loading failure、pageerror、console error / warning、未終端requestが0である。
9. Light / Dark JPEGがdesktop Sidebarを表し、拡張子と実形式がJPEGで一致する。

## 3/3結果

| theme | fresh tab | desktop props | mobile props 390×844 | Escape / focus return | request / response | error |
|---|---:|---|---|---|---|---|
| Light | 3/3 | 3/3 | 3/3 | 3/3 | 各70 / 70、全200 | 全項目0 |
| Dark | 3/3 | 3/3 | 3/3 | 3/3 | 各70 / 70、全200 | 全項目0 |

各runのCDP対象イベントは140件、`truncated=false`、`Network.loadingFailed=0`、`Runtime.exceptionThrown=0`、console / Log / browser dev logのerror・warningは0、未終端requestは0だった。

## desktop実DOM値

Light / Dark全runで次の契約が同時に成立した。

```text
selector: #sidebar-preview-props
tag: DIV
id: sidebar-preview-props
data-preview-props: forwarded
data-slot: sidebar-container
data-mobile: null
class contains: sidebar-preview-props
style / element.style.touchAction: touch-action: manipulation
computed touch-action: manipulation
dir: ltr
computed direction: ltr
state: デスクトップ: expanded
data-mobile: false
```

製品コードのdesktop分岐では、公開propsは外側の状態rootではなく`data-slot="sidebar-container"`へ転送される。実DOMもこの経路と一致した。

## mobile 390×844実DOM値

open後のSheetContent:

```text
selector: #sidebar-preview-props[data-mobile="true"]
tag: DIV
id: sidebar-preview-props
data-preview-props: forwarded
data-slot: sidebar
data-mobile: true
class contains: sidebar-preview-props
style contains: --sidebar-width: 18rem; touch-action: manipulation
element.style.touchAction: manipulation
computed touch-action: manipulation
dir: ltr
computed direction: ltr
dialog count: 1
state: モバイル: 開
activeElement: INPUT[data-slot="sidebar-input"][aria-label="サイドバーを検索"]
```

Escape 1回後:

```text
#sidebar-preview-props count: 0
dialog count: 0
state: モバイル: 閉
data-mobile-open: false
activeElement: BUTTON[data-slot="sidebar-trigger"]
trigger focus return: true
```

この遷移はLight 3/3、Dark 3/3、合計6/6で一致した。

## JPEG証跡

取得方法はChrome DevTools Protocolの`Page.getLayoutMetrics`でページ寸法を取得後、`Page.captureScreenshot({ format: "jpeg", quality: 90, captureBeyondViewport: true, clip })`を呼び、返却base64を`.jpg`へ直接保存した。

| 画像名 | bytes | 実寸 | magic / format | SHA-256 |
|---|---:|---:|---|---|
| `2026-08-02-sidebar-preview-light.jpg` | 27,159 | 1280×900 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `2d6e858f635e1e2e2d089fd0da472bfc2993cdfdacb6ace5e86a32da1a6c18f4` |
| `2026-08-02-sidebar-preview-dark.jpg` | 27,545 | 1280×900 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `aaf747ce04109427ccb80a499932c45ed06e73e1d3e58835da523f3dd11494d9` |

`file`、`sips format=jpeg`、JFIF magicが一致した。画像はLight / Darkのexpanded desktop Sidebar、検索、menu、header、inset mainを目視確認した。

## 三方向導出のクロスチェック

- コード: `useIsMobile()`でdesktop containerとmobile SheetContentを分岐し、両方が`dir`、`className`、`style`、残り公開propsを受け取る。
- 画面: desktop / mobile双方の同じIDを持つ実体で、属性、class、inline / computed style、directionを取得した。
- 型・公開契約: `SidebarProps`のHTML propsをdesktop / mobile双方へ転送する契約と実DOMが一致した。
- コードにあるが本previewから未到達: `side=right`、`variant=floating/inset`、`collapsible=offcanvas/none`、controlled `open/onOpenChange`。
- 画面から入力できるがコードで検証していない値: 検索inputは検索処理未接続のpreviewであり、今回はautofocus / Escape起点として検証した。
- OpenAPI等の外部schemaは対象に存在しない。

## 未検証範囲

- `side=right`
- `variant=floating/inset`
- `collapsible=offcanvas/none`
- controlled open
- mobile実機のtouch gesture、画面回転
- Safari / Firefox / Android Chrome
- VoiceOver等の実スクリーンリーダー
- desktop collapse / cookie永続化は今回のR3公開props回帰対象外のため操作していない
- screenshot baselineとの自動pixel diff

## 再現手順

```bash
cd /Users/nishikawa/projects/elchika-inc/ui
git rev-parse HEAD
git branch --show-current
git status --short
lsof -nP -iTCP:3018 -sTCP:LISTEN
npm run build
npm run preview -- --host 127.0.0.1 --port 3018
```

各themeを3つのfresh tabで次の順に実行する。

1. desktopで`load`とhydration完了を待つ。
2. `#sidebar-preview-props`のID、data属性、class、style、computed style、dirを取得する。
3. viewportを390×844に設定し、`data-mobile=true`を待つ。
4. `[data-slot="sidebar-trigger"]`が1件であることを確認してclickする。
5. mobile SheetContentの公開propsとdialog / autofocusを取得する。
6. 検索inputからEscapeを1回押し、SheetContent消滅、open=false、trigger focus returnを確認する。
7. desktopへ戻し、JPEGをCDPから直接取得する。
8. 全操作区間のCDP Network / Runtime / Logとbrowser dev logsを検査する。

## クリーンアップ

- 永続データ作成、外部送信、削除、課金なし。
- desktop collapse操作を行っていないため`sidebar_state` cookieは作成していない。
- 全fresh tabをcloseし、Browser finalize直前のtab数は0。
- mobile viewport overrideをreset後、Browser sessionをfinalizeした。
- preview serverを停止し、3018 LISTENなし、停止後curl exit 7を確認した。
- 終了HEADは固定SHAから不変。
- tracked / cached差分は0。
- 未追跡は指定6 JPEGだけで、本レポートMarkdownは呼び出し元が書き出す前の状態である。
