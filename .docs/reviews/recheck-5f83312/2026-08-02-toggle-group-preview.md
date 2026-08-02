# ToggleGroup Task 9 R3 動作検証レポート

verified_impl_sha: 5f8331231ee849330ea0bdd5288338e0f7b5eb1f

## 結論

- 判定: **PASS**
- Light / Darkを各3つのfresh tab、計6/6で実測した。
- `[data-preview-group="single"]`の実DOMで、公開`style`由来の`touch-action: manipulation`と内部`--toggle-group-gap: calc(var(--spacing) * 0)`が同じ`style`属性に同時に存在した。
- `spacing=0`のcomputed `gap` / `row-gap` / `column-gap`はすべて`0px`で、3 itemの隣接差も`[0, 0]px`だった。
- 初期pressed state、pointer toggle、horizontal / vertical keyboard navigation、Space / Enter toggleはLight / Dark全runで一致した。
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
| URL | Light `/preview/toggle-group/`、Dark `/preview/toggle-group-dark/` |
| 実行可否 | ✅ Light / Darkとも実行 |
| fresh build | `npm run build` exit 0、125 pages生成 |
| 開始条件 | HEAD一致、branch一致、tracked / cached / untracked差分なし、候補3018/3028/3038/3048全て空き |
| port選択 | 候補内の3018へ明示固定。自動fallbackなし |

## 成功基準（実行前rubric）

1. 各themeを3つのfresh tabで実行する。
2. hydration後にpreview 1件、single / multiple groupが各1件、各group itemが3件存在する。
3. single rootの公開`touch-action`と内部`--toggle-group-gap`が同じ実DOM `style`属性に共存する。
4. computed `touch-action=manipulation`、computed gap群=`0px`である。
5. single初期値はcenterのみ、multiple初期値はboldのみpressedである。
6. horizontalはArrowRight / ArrowLeft / Home / End、verticalはArrowDown / ArrowUp / Home / Endでroving focusが移動し、navigation keyだけでは選択が変わらない。
7. Space / Enterとpointerでpressed stateとstatusが同期する。
8. 全監視区間で4xx / 5xx、loading failure、pageerror、console error / warning、未終端requestが0である。
9. Light / Dark JPEGが対象ページを表し、拡張子と実形式がJPEGで一致する。

## 3/3結果

| theme | 採用fresh tab | DOM style同居 | computed touch / gap | pressed / keyboard | request / response | error |
|---|---:|---|---|---|---|---|
| Light | 3/3 | 3/3 | `manipulation` / `0px`、3/3 | 3/3 | 各35 / 35、全200 | 全項目0 |
| Dark | 3/3 | 3/3 | `manipulation` / `0px`、3/3 | 3/3 | 各35 / 35、全200 | 全項目0 |

各runのCDP対象イベントは70件、`truncated=false`、`Network.loadingFailed=0`、`Runtime.exceptionThrown=0`、console / Log / browser dev logのerror・warningは0、未終端requestは0だった。

## 実DOM値

Light / Dark、全6runで同値だった。

```text
selector: [data-preview-group="single"]
role: group
aria-label: 文字揃え
data-orientation: horizontal
data-spacing: 0
style: touch-action:manipulation;--toggle-group-gap:calc(var(--spacing) * 0)
element.style.touchAction: manipulation
element.style.getPropertyValue("--toggle-group-gap"): calc(var(--spacing) * 0)
computed touch-action: manipulation
computed gap: 0px
computed row-gap: 0px
computed column-gap: 0px
item隣接差: [0px, 0px]
```

初期状態:

```text
single pressed: [false, true, false]
single status: 選択: center
multiple pressed: [true, false, false]
multiple status: 選択: bold
```

## keyboard / pressed state

Light / Dark全runで次の遷移が一致した。

| group | 操作 | activeElement | pressed / status |
|---|---|---|---|
| single | ArrowRight | 中央揃え | centerのまま |
| single | ArrowLeft | 左揃え | centerのまま |
| single | End | 右揃え | centerのまま |
| single | Home | 左揃え | centerのまま |
| single | Space | 左揃え | leftのみ / `選択: left` |
| single | Enter | 左揃え | 全false / `選択: なし` |
| single | 右揃えclick | 右揃え | rightのみ / `選択: right` |
| single | 右揃え再click | 右揃え | 全false / `選択: なし` |
| multiple | ArrowDown | 斜体 | boldのまま |
| multiple | ArrowUp | 太字 | boldのまま |
| multiple | End | 下線 | boldのまま |
| multiple | Home | 太字 | boldのまま |
| multiple | Space | 太字 | 全false / `選択: なし` |
| multiple | Enter | 太字 | boldのみ / `選択: bold` |

## JPEG証跡

取得方法はChrome DevTools Protocolの`Page.getLayoutMetrics`でページ寸法を取得後、`Page.captureScreenshot({ format: "jpeg", quality: 90, captureBeyondViewport: true, clip })`を呼び、返却base64を`.jpg`へ直接保存した。PNGからの拡張子変更ではない。

| 画像名 | bytes | 実寸 | magic / format | SHA-256 |
|---|---:|---:|---|---|
| `2026-08-02-toggle-group-preview-light.jpg` | 66,577 | 3024×1544 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `2da686a7725bff3b578d34c5e5f0e670efe373e745812e430f9b2788d9344184` |
| `2026-08-02-toggle-group-preview-dark.jpg` | 67,532 | 3024×1544 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `53ff0a7cb0f7aa7550d6a3299dea7ed516f225fb7143c883cdb377289839600c` |

`file`、`sips format=jpeg`、JFIF magicが一致した。画像はLight / DarkのToggleGroup、singleの連結形状、center / bold pressed stateを目視確認した。

## 三方向導出のクロスチェック

- コード: wrapperは公開`style`を先に展開し、その後に内部`--toggle-group-gap`を追加する。previewは公開`touchAction: "manipulation"`と`spacing={0}`を同時指定する。
- 画面: 同じroot要素の実`style`、computed style、item rect、a11y tree、pressed / status / activeElementを取得した。
- 型・公開契約: `ToggleGroupPrimitive.Props`由来の公開styleとwrapper内部custom propertyが競合せず共存することを実体で確認した。
- コードにあるが画面から未到達: disabled、RTL、size `sm`、spacing 0/2以外、実行中のorientation変更。
- 画面から入力できるがコードで未検証: 自由入力なし。6 buttonはpointerまたはkeyboardで操作した。
- OpenAPI等の外部schemaは対象に存在しない。

## 検証ハーネス上の不採用run

- Browser接続の`waitForLoadState(networkidle)`が未対応だった途中tabは不採用・破棄し、`load`と`astro-island[ssr]`消滅を条件にしたfresh tabで再実行した。
- 文字列形式の`playwright.evaluate`が値を返さなかった途中tabも不採用・破棄し、関数形式evaluateの単体確認後にfresh tabで再実行した。
- 上記は製品Expected不一致ではなく検証経路の不一致であり、採用6runへ混在させていない。

## 未検証範囲

- RTL時のhorizontal方向キー反転
- disabled itemを跨ぐroving focus
- wrap-around
- touch gesture実機
- Safari / Firefox / Android Chrome
- VoiceOver等の実スクリーンリーダー
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

1. Light / Dark URLを各3つのfresh tabで開く。
2. `load`後、`astro-island[ssr]`が消えるまで待つ。
3. `[data-preview-group="single"]`の`style`、`element.style`、computed gap、item rectを取得する。
4. 上記keyboard / pointer操作を順に行い、各操作後のactiveElement、tabindex、pressed、statusを取得する。
5. reloadと並行してCDPのNetwork / Runtime / Logイベントを取得し、全requestのresponse、status、failure、exceptionを検査する。
6. CDPからJPEGを直接取得し、`file`、`xxd -l 16`、`sips`、`shasum -a 256`で検査する。

## クリーンアップ

- 永続データ作成、外部送信、削除、課金なし。
- 全採用tabと不採用tabをcloseした。
- Browser finalize直前のtab数は0。
- viewport overrideをreset後、Browser sessionをfinalizeした。
- preview serverを停止し、3018 LISTENなし、停止後curl exit 7を確認した。
- 終了HEADは固定SHAから不変。
- tracked / cached差分は0。
- 未追跡は指定6 JPEGだけで、本レポートMarkdownは呼び出し元が書き出す前の状態である。
