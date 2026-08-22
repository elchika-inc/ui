# 動作検証レポート: Acme Inc. 復元・catalog隔離修正後再検証

verified_impl_sha: 71446e87c3fdf3127d3e3e990e9470893fa11990

- 総合判定: **✅ PASS**
- `dashboard-01` light / dark / mobileで `Acme Inc.` 復元を実画面確認した。
- 直前FAILだったcatalog内の遮蔽は解消した。
- catalogの対象spanはdashboard-01 item内へ収まり、中心点の前面要素も対象自身となった。
- catalog修正後もisolatedのdesktop offcanvasとmobile sidebar動作は退行していない。

## 実行環境（再現性の前提）

- 検証日時: 2026-08-22 17:12:13–17:20:49 JST
- 対象コミット: 上記 `verified_impl_sha`
- OS: Darwin 25.3.0 / arm64
- Node.js: `v26.7.0`
- npm: `11.19.0`
- ブラウザ: Chrome `151.0.0.0`
- desktop viewport: `1512 × 828`
- mobile viewport: `390 × 844`
- devicePixelRatio: `2`
- 起動コマンド: `npm run dev -- --host 127.0.0.1 --port 4321`
- 4321は無関係なPID 11102が使用中だったため停止せず、対象Astroが割り当てた `http://127.0.0.1:4322` を使用した。
- 対象Astro PID: `51119`
- 実行可否: ✅実行した

## 成功基準（rubric・実行前に定義）

- light / darkで可視exact `Acme Inc.` が1、旧 `Acme` 単独表記が0。
- 390×844のmobile sidebarで `Acme Inc.` が可視となり、開閉できる。
- catalogのdashboard-01 item内で `Acme Inc.` がDOM上だけでなく画面上でも可視となる。
- catalogの対象span rectがitem rect内に収まる。
- 対象span中心の`elementFromPoint`がtarget自身、その子孫または祖先を返す。
- 後続sidebar-10等のfixed layerに遮蔽されない。
- catalogのdashboard-01 / dashboard-table itemが正寸法を持つ。
- isolatedのdesktop offcanvasとmobile sidebar動作が退行しない。
- 安定描画後のduplicate DOM id、console error、page exception、HTTP 4xx/5xx、request failureが0。
- 全採用監査でevent bufferが`truncated:false`。
- light / dark / mobile / catalogの新規スクリーンショットを取得し、magic bytesを確認する。
- 件数は今回の観測値としてのみ記録し、将来の固定成功条件にしない。
- 非変更のdashboard-table機能は再実行しない。

## テストケースと結果

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 再現率 | 実体エビデンス | 再現手順 |
|---|---|---|---|---|---|---|---|---|
| 1 | dashboard-01 lightの表記 | コード・画面 | 同値分割 | High | ✅実測確認 | 1/1 | `evidence/2026-08-22-dashboard-01-light.jpg`、`evidence/case05-browser-results.json` | `/preview/dashboard-01/` を開き、安定後に可視text nodeをexact集計 |
| 2 | dashboard-01 darkの表記 | コード・画面 | テーマ同値分割 | High | ✅実測確認 | 1/1 | `evidence/2026-08-22-dashboard-01-dark.jpg`、`evidence/case05-browser-results.json` | `/preview/dashboard-01-dark/` で同じ集計を実施 |
| 3 | isolated desktop offcanvas | コード・画面 | 1スイッチ状態遷移 | High | ✅実測確認 | 1/1 | `evidence/case05-browser-results.json` | lightでsidebar triggerを2回操作し、expanded→collapsed→expandedを計測 |
| 4 | mobile sidebarの開閉と表記 | コード・画面 | 1スイッチ状態遷移 | High | ✅実測確認 | 1/1 | `evidence/case03-dashboard-01-mobile-sidebar-acme-inc.jpg`、`evidence/case05-browser-results.json` | 390×844でtriggerを押し、表示確認後にEscape |
| 5 | catalog item内のDOM表記 | コード・画面・型 | スコープ限定同値分割 | High | ✅実測確認 | 1/1 | `evidence/case05-browser-results.json` | `[data-catalog-preview="dashboard-01"]` 内をexact集計 |
| 6 | catalog item内の実画面可視性 | 画面 | 前面要素・境界監査 | High | ✅実測確認 | 1/1 | `evidence/case04-catalog-dashboard-items-acme-inc-visible.jpg`、`evidence/case05-browser-results.json` | dialogを閉じて対象itemへscrollし、rectと`elementFromPoint`を計測 |
| 7 | catalog対象2itemの寸法 | 画面 | 境界値 | High | ✅実測確認 | 1/1 | `evidence/case05-browser-results.json` | dashboard-01 / dashboard-tableのrectを計測 |
| 8 | 安定描画後のduplicate DOM id | 画面 | 否定条件監査 | High | ✅実測確認 | 4対象 | `evidence/case05-browser-results.json` | light / dark / mobile / catalogで全`[id]`を集計 |
| 9 | HTTP・通信失敗・例外・console error | 画面・通信 | 異常系監査 | High | ✅実測確認 | 4対象 | `evidence/case06-network-console-audit.json` | CDPで操作区間を監査。catalogは連続71 batch回収 |
| 10 | screenshotの画像実体 | 画面 | ファイル形式検査 | Medium | ✅実測確認 | 4/4 | JPEG 4画像 | `file evidence/*.jpg` とmagic bytesを確認 |
| 11 | 対象server停止と共有port保全 | CLI | クリーンアップ | High | ✅実測確認 | 1/1 | `evidence/case07-server-cleanup.log` | 対象server停止後に4322不在、4321継続を確認 |

## 主要実測値

### dashboard-01 light

- `Acme Inc.` 可視exact text: 1
- 旧 `Acme` 単独可視exact text: 0
- dashboard root: 1
- root rect: `1512 × 828`
- `Documents` heading: 1
- section card: 5
- chart SVG: 1
- duplicate ID: 0
- 対象span中心の前面要素: 対象自身
- スクリーンショット上でも `Acme Inc.` を目視確認。

### isolated desktop offcanvas

初期:

- state: `expanded`
- sidebar container: `{ x: 0, width: 288, right: 288 }`
- `Acme Inc.` target rect: `{ x: 50, y: 20, width: 77.711, height: 24 }`
- target前面性: true

1回目のtrigger操作後:

- state: `collapsed`
- `data-collapsible`: `offcanvas`
- sidebar container: `{ x: -256, width: 288, right: 32 }`
- target rect: `{ x: -206, y: 20, width: 77.711, height: 24 }`
- 対象textがviewport外へ退避。

2回目のtrigger操作後:

- state: `expanded`
- sidebar container: `{ x: 0, width: 288, right: 288 }`
- target rect: `{ x: 50, y: 20, width: 77.711, height: 24 }`
- target前面性: true

catalog時だけ`collapsible="none"`へ変える修正後も、isolatedの`offcanvas`契約は維持された。

### dashboard-01 dark

- `Acme Inc.` 可視exact text: 1
- 旧 `Acme` 単独可視exact text: 0
- dashboard root: 1
- root rect: `1512 × 828`
- `<html class="dark">`
- duplicate ID: 0
- target前面性: true
- スクリーンショット上でも `Acme Inc.` を目視確認。

### mobile sidebar

開く前:

- viewport: `390 × 844`
- trigger: 1
- dialog: 0
- mobile sidebar DOM: 0
- 可視sidebar: 0

開いた後:

- dialog: 1
- sidebar rect: `292.5 × 844`
- `Acme Inc.` 可視exact text: 1
- 旧 `Acme` 単独可視exact text: 0
- target前面性: true
- duplicate ID: 0

Escape後:

- dialog: 0
- mobile sidebar DOM: 0
- 可視sidebar: 0

### catalog修正後

今回の観測値:

- catalog root: 1
- preview item: 89
- dashboard-01 item: 1
- dashboard-table item: 1
- dashboard-01 item rect: `{ x: 985.328, y: 47.648, width: 410.664, height: 467 }`
- dashboard-table item rect: `{ x: 116, y: 538.648, width: 410.664, height: 467 }`
- dashboard-01 item内 `Acme Inc.` exact text: 1
- dashboard-01 item内旧 `Acme` 単独exact text: 0
- duplicate ID: 0

対象span:

- rect: `{ x: 1029.328, y: 142.648, width: 77.711, height: 24 }`
- item rect内: true
- viewport内: true
- `elementFromPoint`: 対象 `SPAN`
- 前面text: `Acme Inc.`
- 前面preview: `dashboard-01`
- target前面性: true

catalog sidebar:

- `position`: `static`
- sidebar rect: `{ x: 987.328, y: 130.648, width: 213.914, height: 616 }`
- `sidebar-container`: 0

前回は対象spanが左上 `{ x: 50, y: 20 }` へfixed配置され、`sidebar-10`に遮蔽された。修正後はspanがdashboard-01 item内に収まり、前面previewもdashboard-01自身となった。

![catalog修正後](evidence/case04-catalog-dashboard-items-acme-inc-visible.jpg)

## 通信・実行時エラー監査

| 対象 | response観測値 | truncated | HTTP 4xx/5xx | request failure | page exception | console error |
|---|---:|---|---:|---:|---:|---:|
| dashboard-01 light | 158 | false | 0 | 0 | 0 | 0 |
| dashboard-01 dark | 158 | false | 0 | 0 | 0 | 0 |
| dashboard-01 mobile | 158 | false | 0 | 0 | 0 | 0 |
| catalog | 421 | false | 0 | 0 | 0 | 0 |

- 総response観測値: `895`
- 総件数は今回の観測値であり、固定成功条件には使用しない。
- catalogはevent到着を連続71 batchで回収。
- catalog最大batch: 91 events
- 全採用監査: `truncated:false`
- dev error log: 全対象0。

## screenshot形式

- JPEG: 4
- PNG: 0
- 全4画像が `JPEG image data, JFIF standard 1.01`
- desktop画像: `1512 × 828`
- mobile画像: `390 × 844`
- evidence全体: 7件、336KB

## 三方向導出のクロスチェック結果

### コードから

- `AppSidebar` のブランド表示は `Acme Inc.`。
- 修正後の`DashboardZeroOnePreview`はcatalog時に`collapsible="none"`、isolated時に`collapsible="offcanvas"`を渡す。
- `Sidebar`の`none`経路はfixed containerを生成せず静的sidebarを返す。
- isolatedの`offcanvas`経路は従来のfixed containerと状態遷移を維持する。

### 画面から

- light / dark / mobileで `Acme Inc.` の可視表示を確認。
- isolated desktopでoffcanvas開閉を実操作確認。
- catalogで対象spanがcard内に描画され、スクリーンショットでも目視できた。
- 対象中心点の前面要素は対象span自身だった。

### 型・スキーマから

- `PreviewProps.mode`によりcatalog / isolated経路が分かれる。
- `Sidebar`の`collapsible`型は`"offcanvas" | "icon" | "none"`。
- 修正値は既存の型定義内に収まる。

### 乖離

- コード、型、DOM、前面要素、スクリーンショットが一致した。
- 直前FAILの「DOMには存在するが画面に見えない」乖離は解消した。
- 画面から入力できるがコードで扱っていない値: 本件対象内ではなし。
- 型にあるがコードで扱っていないパラメータ: 本件対象内ではなし。

## 未到達分岐（網羅の穴・機械的な証拠）

- dashboard-01 chartの期間切替。
- sidebar内navigation itemの遷移。
- user menu、Quick Create、Inbox等の個別操作。
- network offline、resource timeout、JavaScript無効。
- 全catalog preview間のlayer isolation組み合わせ。
- dashboard-tableのsort / selection / drawer / chartは非変更かつ明示的に再実行不要のため未実行。

## 発見した不具合

- 今回の固定commitでは新規不具合なし。
- 直前FAILだったcatalog内のdashboard-01遮蔽は再現しなかった。

## 未列挙・未検証の残（正直な限界）

- catalog全previewの相互遮蔽を網羅する検証ではなく、dashboard-01の`Acme Inc.`と対象cardに限定した影響再検証。
- dashboard-tableの機能操作は依頼どおり未実行。
- catalog内には他preview由来のfixed要素が存在するが、dashboard-01の対象span中心を遮蔽しないことは実測した。

## クリーンアップ

- browser viewport overrideをreset。
- 検証用browser tabをclose。
- 対象Astro PID 51119を停止。
- port 4322: `lsof` exit 1、LISTENなし。
- `astro dev status`: `No dev server is running.`、exit 0。
- 無関係なport 4321 / PID 11102は継続LISTEN。
- 検証データ作成なし。
- 外部送信・deploy・既存データ削除なし。
- tracked file差分なし。
- staged差分なし。
- 新規 `.docs/reviews/2026-08-22-phase3-acme-recheck-fixed/evidence/` 配下だけへ7件保存。
- 直前FAILのreport / evidenceは変更していない。

## 申し送り候補

- `.docs/actions/` 登録候補: なし。
- brain記録候補: 高密度catalogのCDP監査ではevent到着を連続回収し、`truncated:false`を合格条件にする。
