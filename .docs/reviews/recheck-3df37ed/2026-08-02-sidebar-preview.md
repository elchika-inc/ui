# Sidebar Task 9 R4 動作検証レポート

verified_impl_sha: 3df37ed476863bbd863009af6892a7a16a7bdd6f

## 結論

- 判定: **PASS**
- Light / Dark各3論理runを、desktop 3 fresh targetとmobile 390×844の3 fresh targetの対として実測した。
- SSR HTMLとhydration後DOMの`[data-review-skeleton="stable"] [data-sidebar="menu-skeleton-text"]`は全runで`--skeleton-width:70%`が一致した。
- desktopの公開`id` / data属性 / class / `touchAction` / `dir=ltr`は全runで同一DOMへ到達した。
- mobile open後も公開propsが到達し、dialog 1件、検索input autofocus、Escape 1回でclose、dialog消滅、trigger focus returnとなった。
- desktop / mobile双方でconsole error / warning、hydration warning、pageerror、network failure、未終端、4xx / 5xxは全run 0だった。

## 実行環境

| 項目 | 実測値 |
|---|---|
| リポジトリ | `/Users/nishikawa/projects/elchika-inc/ui` |
| branch | `feat/batch-final` |
| 固定HEAD | 上記`verified_impl_sha` |
| 検証日時 | 2026-08-02 15:30〜15:48 JST |
| OS | macOS 26.3.1（Build 25D2128）、arm64 |
| Node.js / npm | v26.4.0 / 11.17.0 |
| Browser | Google Chrome 150.0.7871.187、raw CDP |
| desktop / mobile | 1280×900 / 390×844 |
| server | `127.0.0.1:3018`へ明示固定 |
| fresh build | `npm run build` exit 0、Astro 125 pages |

## 成功基準（実行前rubric）

1. Light / Dark各3論理runで、desktopとmobileをそれぞれfresh targetから実行する。
2. `curl`取得のSSR HTMLとhydrated DOMのskeleton inline custom propertyが`70%`で一致する。
3. desktop rootへ公開propsが到達し、expanded状態である。
4. mobile 390×844でtriggerからopenし、公開props、dialog 1件、検索input autofocusを確認する。
5. 検索inputからEscape 1回でcloseし、dialog / mobile rootが消え、triggerへfocusが戻る。
6. desktop / mobile各通信集合でrequestとresponseが全件対応し、failure、未終端、4xx / 5xx、console / Runtime / Log error、hydration warningが0である。

## 3/3実測結果

| theme | 論理run | SSR / hydrated skeleton | desktop props | mobile open / Escape / focus return | desktop resource | mobile resource | error |
|---|---:|---|---|---|---|---|---|
| Light | 3/3 | 各`70%` / `70%` | 3/3 | 3/3 | 各69 / 69、全200 | 各69 / 69、全200 | 全0 |
| Dark | 3/3 | 各`70%` / `70%` | 3/3 | 3/3 | 各69 / 69、全200 | 各69 / 69、全200 | 全0 |

desktop hydrated DOM:

```text
id: sidebar-preview-props
data-preview-props: forwarded
class contains: sidebar-preview-props
computed touch-action: manipulation
dir / computed direction: ltr / ltr
state: デスクトップ: expanded
skeleton style: --skeleton-width:70%
```

mobile open / close:

```text
open: data-mobile=true, dialog=1, search input focused, public props forwarded
Escape後: mobile root=0, dialog=0, data-mobile-open=false, trigger focused=true
```

raw CDPのflattened session中にdesktopからmobileへ動的metrics overrideするとrenderer反映がsession detachまで遅延したため、そのrunは全て不採用とした。採用runはviewportをnavigation前に設定し、desktop / mobileを別fresh targetとして実装と同じmount時判定経路へ通した。

## JPEG証跡

Chrome DevTools Protocolの`Page.getLayoutMetrics`でfull-page寸法を取得し、`Page.captureScreenshot({ format: "jpeg", quality: 90, captureBeyondViewport: true, clip })`のbase64を変換せず`.jpg`へ直接保存した。

| 画像 | bytes | 寸法 | magic / format | SHA-256 |
|---|---:|---:|---|---|
| `2026-08-02-sidebar-preview-light.jpg` | 26,847 | 1280×900 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `4395b3f3e87584932ee4707f6f39135c101c011aad5f38ba2e437f04be6e44eb` |
| `2026-08-02-sidebar-preview-dark.jpg` | 27,442 | 1280×900 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `cfb639fc06901809cc1a8b773fa1390725e65327db0b0fbf8491e1029d1650d7` |

`file`、`sips`、magicが一致した。Light / Darkともexpanded desktop Sidebar、検索、menu、skeleton、inset mainが描画され、blankや途中描画でないことを目視確認した。

## 三方向導出と未検証範囲

- コード: skeleton固定幅、desktop / mobile分岐、公開props転送、Sheet open / closeを追跡した。
- 画面: SSR文字列、hydrated DOM、desktop属性、mobile dialog / activeElement / focus returnを実測した。
- 型: `SidebarProps`のHTML propsを両表示経路へ転送する契約と一致した。外部schemaは存在しない。
- 未検証: `side=right`、`variant=floating/inset`、`collapsible=offcanvas/none`、controlled open、desktop collapse / cookie永続化、実機touch、回転、Safari / Firefox、スクリーンリーダー、pixel baseline比較。

## 再現手順

```bash
cd /Users/nishikawa/projects/elchika-inc/ui
git rev-parse HEAD
lsof -nP -iTCP:3018 -sTCP:LISTEN
npm run build
npm run preview -- --host 127.0.0.1 --port 3018
curl --fail --silent --show-error http://127.0.0.1:3018/preview/sidebar/ -o /private/tmp/sidebar-r4-ssr.html
```

1. `/preview/sidebar/`と`/preview/sidebar-dark/`について、1280×900と390×844のtargetをnavigation前に別々に初期化する。
2. 各theme / runでdesktopのskeletonと公開propsを取得する。
3. 対応するmobile targetでtriggerをclickし、公開props、dialog、autofocusを取得する。
4. 検索inputからEscapeを送り、close、DOM消滅、focus returnを取得する。
5. desktop / mobile双方の全CDP eventを逐次購読し、request / response / failureとconsole / exceptionを照合する。
6. desktop 3回目のtargetでCDPからJPEGを直接取得する。

## クリーンアップ

- 永続データ作成、外部送信、削除、課金なし。desktop collapseを操作せずcookieを作成していない。
- 採用 / 不採用を含む全targetとheadless Chromeを終了し、CDP port 9228 LISTENなしを確認した。
- preview serverを停止し、3018 LISTENなし、停止後curl exit 7を確認した。
- 終了HEADとbranchは開始時から不変で、tracked / cached差分は0だった。
