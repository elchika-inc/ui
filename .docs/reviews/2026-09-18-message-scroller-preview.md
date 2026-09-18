verified_impl_sha: 4e586dd16b86a794197f5a97fd819fa8ee7a468b

# 動作検証レポート: Message Scroller Preview

## 結論

**総合判定: PASS**。指定された実ブラウザ rubric を Light / Dark で満たした。測定開始日時: 2026-09-18T12:36:54.236Z。

## 成功基準と検証方法

成功基準は `.docs/plans/2026-09-18-motion-defects.md` §4 と2026-09-18の司令塔の後続裁定 B（入れ子の検証を追加）。原因の再調査はせず、修正前の値は同仕様 §1 に記録された司令塔の main `8cb38a6` 実測を引用した。修正後は本 worker が独立した headless Chromium で取得した。

- Node.js v24.21.0、Astro 7.1.6、headless Chromium 153.0.8010.12。
- 1280 × 800 CSS px、deviceScaleFactor 1、reducedMotion `no-preference`。
- 配信: `npx astro preview --host ::1 --port 4329`。
- Light / Dark の新規 browser context ごとに console error、warning、pageerror、HTTP 400 以上を全件記録し、hydration と 700ms の安定待ちを行った。
- 実測時の3実装ファイルの SHA-256 と `verified_impl_sha` の実体を照合し、一致を確認した。

## 実ブラウザ結果（仕様 §4.6）

| 観測項目 | 修正前（司令塔の記録） | 修正後 Light | 修正後 Dark |
|---|---|---|---|
| Message Scroller transition-property | `background, border-color, color, box-shadow` | `translate, scale, opacity, background, border-color, color, box-shadow` | 同左 |
| data-active の出現遷移 | `false → true` | `false → true` | `false → true` |
| data-active=true の transition-duration | 今回は再計測しない | `0.18s` | `0.18s` |
| data-active=false の transition-duration | 今回は再計測しない | `0.4s` | `0.4s` |
| opacity 中間値の件数 | 0件 | 8件 / 30サンプル | 9件 / 30サンプル |
| sidebar-11 閉→開→閉 rotate | `none → none → none` | `none → 90deg → none` | `none → 90deg → none` |
| sidebar-02 閉→開→閉 rotate（参照） | `none ↔ 90deg` | `none → 90deg → none` | `none → 90deg → none` |
| sidebar-11 / sidebar-02 root 属性 | sidebar-11 も属性は正常 | `data-closed → data-open → data-closed` | 同左 |
| sidebar-11 DOM の data-state=open class | 旧選択子あり | 0件 | 0件 |

### Message Scroller の出現と hover

viewport の `scrollTop` を `scrollHeight` に設定し、`data-active=false` を待ってさらに500ms待機した。MutationObserver を先に登録してから `scrollTop=0` にし、`data-active=true` へ変わった時点で1回、その後 `setInterval(..., 20)` で29回、計30回の computed opacity を採取した。タイマーの実際の経過時間も以下に記録する。

| テーマ | 通常背景 | hover 60ms 後 | hover 完了後 | 色の transition-property |
|---|---|---|---|---|
| light | `rgb(246, 246, 247)` | `rgb(238, 239, 241)` | `rgb(237, 238, 240)` | `background, border-color, color, box-shadow` を含む |
| dark | `rgb(21, 23, 28)` | `rgb(37, 41, 49)` | `rgb(38, 42, 51)` | `background, border-color, color, box-shadow` を含む |

#### light の採取値

中間値（8件）: `0.468176, 0.725341, 0.856229, 0.962257, 0.982197, 0.992462, 0.99736, 0.99939`。

| # | 経過時間 ms | computed opacity |
|---|---|---|
| 1 | 0.1 | 0 |
| 2 | 22.8 | 0.468176 |
| 3 | 42.9 | 0.725341 |
| 4 | 62.4 | 0.856229 |
| 5 | 82.7 | 0.962257 |
| 6 | 101.6 | 0.982197 |
| 7 | 123.1 | 0.992462 |
| 8 | 142.9 | 0.99736 |
| 9 | 162.7 | 0.99939 |
| 10 | 183.2 | 1 |
| 11 | 201.6 | 1 |
| 12 | 222.6 | 1 |
| 13 | 242.7 | 1 |
| 14 | 262.5 | 1 |
| 15 | 282.6 | 1 |
| 16 | 302.6 | 1 |
| 17 | 322.8 | 1 |
| 18 | 342.8 | 1 |
| 19 | 362.9 | 1 |
| 20 | 382.6 | 1 |
| 21 | 402.7 | 1 |
| 22 | 422.8 | 1 |
| 23 | 442.9 | 1 |
| 24 | 463 | 1 |
| 25 | 483 | 1 |
| 26 | 503.1 | 1 |
| 27 | 523.2 | 1 |
| 28 | 543.2 | 1 |
| 29 | 563.1 | 1 |
| 30 | 583.2 | 1 |

#### dark の採取値

中間値（9件）: `0.466723, 0.724594, 0.856212, 0.925237, 0.982081, 0.992433, 0.997372, 0.99939, 0.999952`。

| # | 経過時間 ms | computed opacity |
|---|---|---|
| 1 | 0.1 | 0 |
| 2 | 21.4 | 0.466723 |
| 3 | 41.7 | 0.724594 |
| 4 | 61.8 | 0.856212 |
| 5 | 82.6 | 0.925237 |
| 6 | 101.6 | 0.982081 |
| 7 | 121.7 | 0.992433 |
| 8 | 142.2 | 0.997372 |
| 9 | 162.7 | 0.99939 |
| 10 | 182.5 | 0.999952 |
| 11 | 200.8 | 1 |
| 12 | 221.9 | 1 |
| 13 | 242 | 1 |
| 14 | 262.1 | 1 |
| 15 | 281.5 | 1 |
| 16 | 302.6 | 1 |
| 17 | 322.6 | 1 |
| 18 | 342.7 | 1 |
| 19 | 361.5 | 1 |
| 20 | 382.5 | 1 |
| 21 | 402.6 | 1 |
| 22 | 422.7 | 1 |
| 23 | 441.8 | 1 |
| 24 | 461.8 | 1 |
| 25 | 481.8 | 1 |
| 26 | 501.9 | 1 |
| 27 | 521.9 | 1 |
| 28 | 542 | 1 |
| 29 | 562 | 1 |
| 30 | 582 | 1 |

hover 色変化は有効で、中間色も観測した。速度は仕様 §A.1 の明示受容に従い、active 時に fast 120ms から base 180ms へ揃う。easing は active が `cubic-bezier(0.16, 1, 0.3, 1)`、inactive が `cubic-bezier(0.2, 0, 0, 1)` だった。

### Sidebar の測定対象と状態

各ページの先頭 `[data-slot="collapsible"]` と、その最初の button、内部の `svg.lucide-chevron-right` を同じ方法で測定した。sidebar-11 は `app`、sidebar-02 は `導入` が対象。sidebar-02 は初期 open のため一度閉じ、その後は両者とも閉→開→閉の順でクリックし、各500ms後に computed rotate と root 属性を採取した。

| ページ | 初期 rotate | 閉状態の属性 | 開状態の属性 | 閉じ直した属性 |
|---|---|---|---|---|
| sidebar-11 Light / Dark | `none` | data-closed=true / data-open=false | data-closed=false / data-open=true | data-closed=true / data-open=false |
| sidebar-02 Light / Dark | `90deg` | data-closed=true / data-open=false | data-closed=false / data-open=true | data-closed=true / data-open=false |

### 全ケースの console / pageerror

| URL（host は http://[::1]:4329） | console error | console warning | pageerror | HTTP 400以上 |
|---|---|---|---|---|
| `/preview/message-scroller/` | 0 | 0 | 0 | 0 |
| `/preview/message-scroller-dark/` | 0 | 0 | 0 | 0 |
| `/preview/sidebar-11/` | 0 | 0 | 0 | 0 |
| `/preview/sidebar-11-dark/` | 0 | 0 | 0 | 0 |
| `/preview/sidebar-02/` | 0 | 0 | 0 | 0 |
| `/preview/sidebar-02-dark/` | 0 | 0 | 0 | 0 |

## 検証の範囲と補足

- 本証跡は今回の2件のモーション修正を対象とし、既存の Message Scroller 証跡は上書きしていない。
- Firefox / Safari、reduced motion、RTL、custom render、モバイル操作は本 rubric の対象外で未検証。
- 事前の MCP 共有ブラウザ確認では favicon の404と思われる console error 1件が出たため、その実行を合格証跡には用いなかった。正式な headless Chromium の全6ケースは上表のとおり0件で、リクエストを遮断・差し替えせず測定した。
- Playwright が既定で参照する headless shell 1244 は未配置だったため、既存の headless shell 1243（上記バージョン）を明示した。ブラウザの追加インストールはしていない。
- ローカルの全件テスト・typecheck・check:all は仕様 §7 に従い実行せず、PR CI の完走を別途確認する。

## 後続裁定 B: 入れ子の追加検証

元spec §A.2 の祖先 group による回転指定は、親を開くと閉じた子 api まで90degになることをworkerが観測した。司令塔は副作用の受容を却下し、trigger自身へ `group/collapsible-trigger` を置き、アイコンを `transition-transform group-data-panel-open/collapsible-trigger:rotate-90` とする裁定 B を出した。specは変更せず、裁定の詳細はPR本文へ記録する。

親 app を開いたまま、子 api を閉→開→閉と操作した。親の data-open と data-panel-open は全状態で存在した。

| テーマ | 親 data-open | 子の状態 | 子 root data-open / data-closed | 子 trigger data-panel-open | 子 computed rotate |
|---|---|---|---|---|---|
| light | あり | 閉 | false / true | なし | `none` |
| light | あり | 開 | true / false | あり | `90deg` |
| light | あり | 閉じ直し | false / true | なし | `none` |
| dark | あり | 閉 | false / true | なし | `none` |
| dark | あり | 開 | true / false | あり | `90deg` |
| dark | あり | 閉じ直し | false / true | なし | `none` |

親自身と参照sidebar-02の閉→開→閉も上表のとおり `none → 90deg → none` を維持した。

## JPEG 証跡

1280 × 800、JPEG quality 90、fullPage false で Playwright から直接取得し、4枚すべてを開いてテーマと対象要素を目視確認した。

末尾ボタンが active でフォーカスした状態。

| ファイル | bytes | SHA-256 |
|---|---|---|
| [2026-09-18-message-scroller-preview-light.jpg](2026-09-18-message-scroller-preview-light.jpg) | 31200 | `eea217d4d1dcc530b3ceccede6d2f1fadc6e9923b756a74163d8a41ad4f78038` |
| [2026-09-18-message-scroller-preview-dark.jpg](2026-09-18-message-scroller-preview-dark.jpg) | 31155 | `11be1e58a0a20c5736e13517a383ee5ec016c19fd1d7a8e89a4e524e7cfd2793` |

magic bytes は4枚とも `ff d8 ff e0 00 10 4a 46`。画像加工・変換なし。
