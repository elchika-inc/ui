verified_impl_sha: 59d5c77282b8416e2ff190733a38841859695cf3

# カタログ横断 実ブラウザ証跡（block の iframe 隔離）

- 検証日: 2026-08-23
- 環境: macOS (Darwin 25.3.0) / Chromium (Playwright MCP) / viewport 1440×900 / scale css
- 対象: `npm run build` の静的出力を `npx astro preview --host 127.0.0.1 --port 4325` で配信
- 対象 SHA: `59d5c77282b8416e2ff190733a38841859695cf3`
- 実装担当: Claude Code（claude-fable-5）、worktree `catalog-block-isolation`

## 再検証の理由

registry:block 28 件を catalog の同一 DOM に直接描画していたため、本番 `/catalog/` で (1) sidebar-13 の dialog overlay がロード時からページ全体を覆う、(2) sidebar 系 preview の `position: fixed` が viewport 端に貼り付いて隣のカードを覆う、という実害が出た（`check:all` は全て緑のまま）。block だけを隔離プレビュー `/preview/<name>/` の `<iframe loading="lazy">` 埋め込みへ切り替えた。catalog の見た目が変わるため、`2026-08-21-blocks-phase2-final/2026-08-21-blocks-phase2-catalog.md` を supersede する証跡を作る。

## 症状の再現（変更前、同じ viewport、ローカル dev server、HEAD `3de805243c93f3058a6abd0dde2080e290db4ae8`）

| 項目 | light | dark |
|---|---|---|
| ロード直後の `[data-slot="dialog-overlay"]` | **存在**（0,0,1440×900） | **存在**（0,0,1440×900） |
| Dashboard 01 カード幅 90% 地点の `elementFromPoint` の所属 | **sidebar-14** | **sidebar-14** |
| 画像 | `evidence/before-light-load.jpg`、`evidence/before-light-dashboard-area.jpg` | `evidence/before-dark-load.jpg` |

本番 https://ui.elchika.dev/catalog/ の証拠スクリーンショット（司令塔撮影）と同じ症状をローカルで再現した。

## 実測結果（変更後、static build）

| # | 仕様 §5-2 の項目 | `/catalog/`（light） | `/catalog-dark/`（dark） | 測った範囲 |
|---|---|---|---|---|
| 1 | ロード直後に dialog overlay が存在しない | overlay **null**、`dialog-content` 0 件 | 同左 | 存在（DOM query） |
| 2 | catalog 上のボタンがクリックできる | dialog トリガーの `elementFromPoint` がトリガー自身、座標クリックで `dialog-content` 0 → 1、Escape で閉じる | 同左 | 動作（実クリック） |
| 3 | sidebar 系 block のカードがカード境界内に収まる | sidebar-07 カード内 5 点の所属すべて sidebar-07、カード外へ出た fixed 要素 0 件（全カード）、iframe 内 sidebar は 256×512 で `expanded` | 同左 | 動作（`elementFromPoint`・computed style） |
| 4 | Dashboard 01 カードに他 preview が被さらない | カード内 5 点（幅 10/50/90%・高さ 15/85%）の所属すべて dashboard-01 | 同左 | 動作（`elementFromPoint`） |
| 5 | dark 側でも 1〜4 | — | 1〜4 すべて同結果、`html.dark` / `data-theme="dark"`、iframe 内も `dark` | 同上 |
| 6 | iframe 内で sidebar-13 の dialog が開いた状態 | `iframe.contentDocument` に `dialog-content` 800×500、iframe viewport 1278×512 に収まる。親 DOM の `dialog-content` 0 件 | `dialog-content` 791×495（遅延ロード直後の計測。安定後は 800×500） | 動作（iframe 内 DOM の実在と寸法） |

その他の観測値（light / dark 同値）:

- preview card 89 件 = block 28（`data-catalog-kind="block"`）+ component 61（`data-catalog-kind="component"`）。iframe 28 件、`loading="lazy"` / `title` 欠落 0 件、src は `/preview/<name>/`（dark は `/preview/<name>-dark/`）
- block 本体のルート（`data-slot="<name>-preview"`）が catalog DOM に 0 件
- console error / warning / pageerror: 0 件
- 横 overflow: なし。scrollHeight 27,107px（block カードが行全体 1280×595 になったため変更前より長い）
- ロード直後の scrollY は 2,134px（本番の変更前も 2,110px で、表示されるカード集合 card〜context-menu も一致。catalog 内 component preview の既存挙動で本タスクの対象外）
- 画像: `2026-08-23-block-iframe-isolation-catalog-light.jpg` (79390 bytes) / `2026-08-23-block-iframe-isolation-catalog-dark.jpg` (79249 bytes)（scrollTo(0,0) 後の上部 viewport）、`evidence/final-{light,dark}-load.jpg`（ロード直後）、`evidence/final-{light,dark}-dashboard-area.jpg`、`evidence/final-{light,dark}-sidebar-07.jpg`、`evidence/final-{light,dark}-sidebar-13-settled.jpg`（全 iframe ロード後に sidebar-13 へスクロール）

## 隔離プレビューの不変（仕様 §5-3）

- ソース: `git diff 3de8052 HEAD -- src/previews src/pages/preview src/blocks src/styles src/layouts src/components src/lib src/hooks` の差分 0 行
- 実表示: 本番（変更前）https://ui.elchika.dev/preview/sidebar-07/ ・ /preview/sidebar-13/ とローカル build の同 route を 1440×900 で開き、title / `data-preview-mode` / root class / `[data-slot]` 件数（61・45）/ sentinel 件数 / dialog の有無と寸法（sidebar-13: 800×500）/ sidebar の state と寸法（256×900）/ 本文テキスト先頭 160 字と総文字数（236・248）を比較して **差異 0 項目**。画像: `evidence/prod-preview-*.jpg` と `evidence/local-preview-*.jpg`

## 既知の制限（catalog 側では防げない）

隔離プレビューは dialog / popover を開いた状態で描画し、その focus trap が iframe 内の要素へ autofocus する。ブラウザはフォーカスされた iframe が見える位置まで親ページをスクロールするため、遅延ロード時に catalog がジャンプする（build 出力でページを 800px ずつ走査したとき、scrollY 15,200 を要求した時点で 17,473 へ移動、activeElement は sidebar-13 の iframe。light / dark とも 1 回）。iframe の `inert`、親 window の `focusin`、親 window の `blur` の 3 案を実装して実測したが、`inert` は iframe 内の `focus()` を止めず、`focusin` は親に届かず、`blur` は最初の子 frame への focus でしか発火しない（sidebar-10 → sidebar-13 の frame 間移動は観測不能）。根本対処は preview 側で埋め込み時の autofocus を抑止すること（本タスクのスコープ外として申し送る）。

## 見た範囲 / 見ていない範囲

- 見た範囲: static build の `/catalog/` と `/catalog-dark/`、上記 6 項目、iframe 属性、console error、横 overflow、スクロール走査でのジャンプ、本番との隔離プレビュー突合、JPEG 実体
- 見ていない範囲: viewport 1440×900 以外（md ブレークポイント 768〜1279px では block カードが 2 列分 = 行全体になり iframe 幅が 768px 未満になりうるため、Sidebar が offcanvas 表示になる）、複数 run による揺らぎ（各テーマ 1 run）、28 block 全ての iframe 内描画の目視（sidebar-07 / sidebar-13 / dashboard-01 / login-01 のみ DOM 計測）、本番デプロイ後の再確認
