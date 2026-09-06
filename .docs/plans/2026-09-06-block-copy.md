Issue: https://github.com/elchika-inc/ui/issues/54

# 委任仕様: block 29 件の文言・demo データを elchika 共通の汎用語彙で日本語化する（issue #54）

## 1. 背景（司令塔が実測済み。再調査不要）

- リポジトリ: elchika-inc/ui（Astro 7 + React 19 + Tailwind CSS v4 + Base UI）。`AGENTS.md` と `CLAUDE.md`、`DESIGN.md`「ブランドボイス」を最初に読むこと。
- 直前に PR #53（issue #52、幾何レイヤーの接続）が main へマージ済み（merge commit `aaf7810`）。本タスクは main から分岐する。#53 の仕様と司令塔裁定は `.docs/plans/2026-09-06-geometry-layer.md` にあり、証跡・provenance・レビュー経路の前例として参照してよい。
- `src/blocks/<name>/**` は shadcn の block をそのまま移植したもので、英語のデモ文字列が 50 の tsx ファイルに約 180 箇所ある。組織名 `Acme` / `Acme Inc` / `Acme Corp.` / `Evil Corp.`、ユーザー `shadcn` / `m@example.com`、人名 `John Doe`、placeholder `Search the docs...` / `Type to search...` 等。
- `src/blocks/dashboard-01/data.json` は 68 行（keys: id, header, type, status, target, limit, reviewer）。type は Cover page / Table of contents / Narrative / Technical content / Plain language / Legal / Visual / Financial / Research / Planning の 10 値、status は In Process / Done の 2 値、reviewer は英語人名 20 種 + `Assign reviewer`。`src/blocks/dashboard-table/` にも data があれば同様に扱う。
- `src/blocks/dashboard-01/components/chart-area-interactive.tsx` 147 行目に `new Intl.DateTimeFormat("en-US", { month: "short", ... })` がある。
- `src/blocks/dashboard-01/components/section-cards.tsx` 14 行目の class に shadcn 固有のグラデーション `*:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card` と `dark:*:data-[slot=card]:bg-card` がある。
- `src/components/ui/dialog.tsx` / `sheet.tsx` の既定ラベルは既に `閉じる`。component 層は本タスクの対象外。
- block の preview route は `src/pages/preview/<name>.astro` と `<name>-dark.astro`（`<html lang="ja">`）。selector は `preview-selectors.json` の `[data-slot="<name>-preview"]`。
- block の来歴は `provenance.json` の `blocks[<name>].files[].generatedContentSha256` が実体と突合される（`check-completeness`）。block のファイルを変えたら `node scripts/add-component.mjs <name> --resync` で同期する（`.docs/component-addition-procedure.md` 95〜112 行目）。`--force` は使わない。`--modified` は既存の `modified` 全文を置き換えるので、追記するときは既存全文に追記した文字列を渡す。
- `check-evidence` は block のファイルを変えると、その block の固有証跡（`<YYYY-MM-DD>-<name>-preview.md` + light / dark 画像、同一 commit）を要求する。共有トークンは触らないので共有 28 枚は不要。前例: `.docs/reviews/2026-09-06-geometry-components/`（21 件）。
- `public/r/` は git 管理外（ビルド時に生成）。
- ベースライン（main `aaf7810`）: `npm run lint` exit 0（warning 200 件は既存）、`node scripts/check-standards.mjs` exit 0、`npm run typecheck` はローカルで OOM（CI で代替）、`node --test "scripts/*.test.mjs"` は 499 件緑だが全件実行で稀に 1 件落ちる（単独再実行で切り分け）、`npm run check:all` は約 30 分（`check-evidence` が証跡数に比例）。

## 2. 実施内容（literal）

### 2.1 対訳の原則

- 文体: 敬体でなく体言止め・動詞止め。「〜します」はフォーム説明文にだけ使う。句点は説明文の末尾にだけ付ける。
- ボタンの動詞と結果を一致させる（「ログイン」→ 遷移、「アカウントを作成」→ 作成）。「送信」「Submit」のような汎用動詞は使わない。
- 利用者の語彙で呼ぶ。実装の語（webhook / config / model）を UI 文言に出さない。
- 和欧の間に手動スペースを入れない（`Google でログイン` のように助詞の前後は例外として半角スペースを 1 つ置く。これは Tailwind の組版でなく可読性のための既存慣習に合わせる）。
- 固有名（GitHub / Google / Apple / elchika）と email は原語のまま。
- 対訳表にない語は同じ原則で訳し、**訳した全語の対訳表を PR 本文に載せる**。

### 2.2 固定の対訳表（この表の語はこの訳に統一する）

組織・プラン:
- Acme / Acme Inc / Acme Inc. → elchika
- Acme Corp. → elchika ラボ
- Evil Corp. → elchika スタジオ
- Enterprise → エンタープライズ、Startup → スタートアップ、Free → 無料

ユーザー（既定ユーザーと avatar）:
- shadcn / m@example.com → 佐藤 美咲 / misaki.sato@example.com
- John Doe → 佐藤 美咲
- avatar の fallback（`CN` 等）→ 姓 1 文字（`佐`）
- その他の架空人名は次から順に使う: 鈴木 健太 kenta.suzuki@example.com / 高橋 さくら sakura.takahashi@example.com / 田中 大輔 daisuke.tanaka@example.com / 伊藤 結衣 yui.ito@example.com / 渡辺 翔 sho.watanabe@example.com / 山本 葵 aoi.yamamoto@example.com / 中村 陽菜 hina.nakamura@example.com

ナビゲーション:
- Dashboard → ダッシュボード、Projects → プロジェクト、Team / Teams → チーム、Settings → 設定、Documentation / Docs → ドキュメント、Reports → レポート、Analytics → 分析、History → 履歴、Starred / Favorites → お気に入り、Playground → 作業スペース、Models → テンプレート、Lifecycle → ライフサイクル、Data Library → データ、Word Assistant → 文書アシスタント、Get Help → ヘルプ、Search → 検索、More → その他、General → 全般、Billing → 請求、Limits → 上限、Introduction → はじめに、Get Started → 導入、Tutorials → チュートリアル、Changelog → 変更履歴、Design Engineering → デザイン、Sales & Marketing → 営業・マーケティング、Travel → 出張、Support → サポート、Feedback → フィードバック、Platform → プラットフォーム、Workspaces → ワークスペース、Calendars → カレンダー、Inbox → 受信箱、Drafts → 下書き、Sent → 送信済み、Junk → 迷惑メール、Trash → ゴミ箱、Archive → アーカイブ、Building Your Application → アプリケーションの構築、Data Fetching → データ取得
- Quick Create → 新規作成、Add team → チームを追加、Add workspace → ワークスペースを追加、View Project → プロジェクトを表示、Share Project → プロジェクトを共有、Delete Project → プロジェクトを削除、Upgrade to Pro → Pro にアップグレード、Account → アカウント、Notifications → 通知、Log out → ログアウト、Toggle sidebar → サイドバーを切り替える、Open page actions → ページ操作を開く、Add to favorites → お気に入りに追加、Select a value → 値を選択

login / signup:
- Login to your account / Welcome back → ログイン
- Create your account / Create an account / Welcome to Acme → アカウントを作成
- Enter your email below to login to your account → 登録したメールアドレスでログインします
- Enter your email below to create your account → メールアドレスを入力してアカウントを作成します
- Email → メールアドレス、Password → パスワード、Confirm Password → パスワード（確認）、Full Name → 氏名
- placeholder `m@example.com` → `misaki.sato@example.com`、`John Doe` → `佐藤 美咲`
- Forgot your password? → パスワードを忘れた場合
- Login → ログイン、Sign in → ログイン、Sign up → アカウントを作成、Create Account → アカウントを作成、Continue → 続行
- Login with Google / GitHub / Apple → Google でログイン / GitHub でログイン / Apple でログイン（signup は「Google で登録」）
- Or continue with → または
- Don't have an account? Sign up → アカウントをお持ちでない場合は アカウントを作成（リンク部分は「アカウントを作成」）
- Already have an account? Sign in → アカウントをお持ちの場合は ログイン
- By clicking continue, you agree to our Terms of Service and Privacy Policy. → 続行すると、利用規約とプライバシーポリシーに同意したことになります。
- Terms of Service → 利用規約、Privacy Policy → プライバシーポリシー
- 画像の alt（`Image` 等）→ 内容を表す日本語（例: `ログイン画面のイメージ`）

dashboard:
- Documents → 文書、Total Revenue → 売上高、New Customers → 新規顧客、Active Accounts → 有効アカウント、Growth Rate → 成長率
- `$1,250.00` → `¥1,250,000`、`1,234` / `45,678` / `4.5%` は数値のまま
- Trending up this month → 今月は増加傾向、Down 20% this period → 今期は 20% 減少、Strong user retention → 継続率が高い、Steady performance increase → 安定して伸長
- Visitors for the last 6 months → 過去 6 か月の訪問者数、Acquisition needs attention → 獲得に注意が必要、Engagement exceed targets → 利用率が目標を上回る、Meets growth projections → 成長予測どおり
- Total Visitors → 訪問者数、Total for the last 3 months → 過去 3 か月の合計、Last 3 months → 過去 3 か月、Last 30 days → 過去 30 日、Last 7 days → 過去 7 日
- Outline → 概要、Past Performance → 過去の実績、Key Personnel → 主要メンバー、Focus Documents → 重点文書、Customize Columns → 列を編集、Add Section → セクションを追加、Rows per page → 1 ページの行数、Filter documents... → 文書を絞り込む
- 表の列: Header → 見出し、Section Type → 種別、Status → 状態、Target → 目標、Limit → 上限、Reviewer → 担当者
- data.json の type: Cover page → 表紙、Table of contents → 目次、Narrative → 本文、Technical content → 技術解説、Plain language → 平易な説明、Legal → 法務、Visual → 図版、Financial → 財務、Research → 調査、Planning → 計画
- data.json の status: In Process → 作業中、Done → 完了
- data.json の reviewer: `Assign reviewer` → `担当者を割り当て`、英語人名は 2.2 の架空人名 7 名を順に割り当てる（同じ英語名には同じ日本語名）
- data.json の header: 各行の内容を表す日本語（例: Cover page → 表紙、Executive summary → 要約、Technical approach → 技術方針、Design → 設計、Capabilities → 機能、Integration with existing systems → 既存システムとの連携）。残りも同じ粒度で訳し、対訳表を PR 本文に載せる。
- `chart-area-interactive.tsx` の `Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })` 相当 → `Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" })`（表示は `4/7` 形式）。同ファイルの他の `en-US` も `ja-JP` にする。
- 検索 placeholder: Search the docs... → ドキュメントを検索、Type to search... → 検索語を入力、Search... → 検索

### 2.3 グラデーションの除去

`src/blocks/dashboard-01/components/section-cards.tsx` 14 行目の class から `*:data-[slot=card]:bg-linear-to-t`、`*:data-[slot=card]:from-primary/5`、`*:data-[slot=card]:to-card`、`dark:*:data-[slot=card]:bg-card` の 4 語を削除する。`*:data-[slot=card]:shadow-xs` と他の class は残す。

### 2.4 対象と手順

- 対象: `src/blocks/**/*.tsx` と `src/blocks/**/data.json` の全 29 block。英語のデモ文字列・placeholder・aria-label・alt・data を 2.1〜2.2 で日本語化する。コード識別子・import・class・lucide のアイコン名は変えない。
- block ごとに `node scripts/add-component.mjs <name> --resync` を実行し、`provenance.json` の当該 block の `generatedContentSha256` を同期する。`modified` への追記は行わない（文言の日本語化は PR 本文と plan に記録する）。`provenance.json` の差分が `generatedContentSha256` 以外に及んだら止めて ask で報告する。
- lint（biome）の整形が入ったら整形後に `--resync` する。

### 2.5 証跡

- `.docs/reviews/2026-09-06-block-copy/` に 29 block × (`2026-09-06-<name>-preview.md` + `2026-09-06-<name>-preview-light.jpg` + `-dark.jpg`) = 29 report + 58 枚。書式は `.docs/reviews/2026-09-06-geometry-components/2026-09-06-login-02-preview.md` に合わせる。`verified_impl_sha` は文言変更を含む commit より後の commit を指す。画像と report は同じ commit に入れる。
- 撮影は `npm run build:site` の成果物を `npx astro preview --host 127.0.0.1 --port <空き>` で配信し、Playwright（headless Chromium、1440×900）で撮る。dev server は使わない。
- report には各 route で `document.documentElement.lang === "ja"`、`pageerror` 0、横 overflow なし（`scrollWidth <= clientWidth`）を実測して書く。
- login-01〜05 / signup-01〜05 の 10 block は追加で viewport 390×844 でも `scrollWidth <= clientWidth` を実測し（画像は不要）、report に書く。日本語化で折り返しが崩れた箇所があれば文言を短くして直す（class の変更は最小限に留め、変えた場合は申告する）。

### 2.6 仕様と記録

- この仕様の 1〜7 節を `.docs/plans/2026-09-06-block-copy.md` として保存する（冒頭に issue #54 へのリンク）。
- レビューで残った flag の受容は `.docs/risk-registry.md` に DOCS_OPS §3 の書式で記録する。

## 3. スコープ外

追加裁定（同日）: `src/previews` は英語のデモ文字列に限り変更可。上記5ファイルに加え、sidebar-01〜08・14の `Build Your Application` / `Data Fetching` とsidebar-09の `All Inboxes` / `Inbox` を日本語化する。合計15ファイル25箇所。previewの構造・class・selectorは維持する。英語残存検査を `src/previews` へも適用して全件記録する。

2026-09-06追加裁定: `src/previews/login-02.tsx` / `login-03.tsx` / `signup-02.tsx` / `signup-03.tsx` の `Acme` → `elchika`、`src/previews/sidebar-12.tsx` の `October 2024` → `2024年10月` は指定文字列に限り変更可。`src/blocks/sidebar-12/components/date-picker.tsx` と sidebar-15 の `enUS` import・locale指定を `ja` へ変更可。利用者が見る画像に旧組織名と英語の月・曜日が残る問題を除くため。負の検査に `src/previews` の `Acme` / `October 2024` を追加し、同じレビュアーによるラウンド3の対象差分再確認と証跡撮り直しを行う。

- 司令塔裁定（2026-09-06）: 日本語化で顕在化したSSRとブラウザーの既定locale差によるhydration不一致を解消するため、dashboard-tableのlocaleCompare 2箇所の第2引数にja-JPを指定する。並べ替えの他ロジックとUIは維持する。`scripts/dashboard-blocks.test.mjs` は既定 locale 差の回帰 test 1 件に限り追加可。修正前後のen-US / ja-JPの行ID順とpageerror件数をreportとPRへ記録する。

- 司令塔裁定（2026-09-06）: `scripts/dashboard-blocks.test.mjs` は表示文言の契約同期に限り変更可。187行目の1testの名称・期待値だけをelchika表示必須、Acme / Acme Inc.非表示へ同期する。他test・検査スクリプト・閾値は維持し、当該ファイル全testと全件testを再実行する。

- `src/components/ui/**`、`src/site/**`、`src/previews/**`、`src/pages/**`、`src/styles/**` は変えない。
- block の構造・レイアウト・class は 2.3 と 2.5 の折り返し対応を除いて変えない。
- `provenance.json` は `--resync` による `generatedContentSha256` の同期に限る。`registry.json` は変えない。
- `.docs/reviews/` の既存 report と画像を書き換えない・削除しない。
- `scripts/**` を変えない（検査スクリプトの変更が必要になったら止めて ask）。
- `main` へのマージ、`gh pr merge`、ruleset の変更をしない。

## 4. 検証（rubric）。結果は worker_done の body に実測値（コマンドと exit code）で含める

1. `npm run lint` が exit 0。
2. `node scripts/check-standards.mjs` が exit 0。
3. `npm run build:site` が exit 0。
4. 負の検査（`src/blocks` を対象に各 1 コマンドで実行し、件数 0 を報告する。`rg -n --fixed-strings -- '<語>' src/blocks`）: `Acme`、`shadcn`、`m@example.com`、`John Doe`、`Evil Corp`、`from-primary/5`、`en-US`、`Login to your account`、`Playground`、`Total Revenue`、`In Process`。
5. 英語残存の検査: `rg -n --pcre2 '>[A-Z][a-z]+(?: [A-Za-z]+)*<' src/blocks` の出力を全件 report に載せ、残ってよいのは固有名（GitHub / Google / Apple / elchika / Pro）と email だけであることを 1 行ずつ確認する。それ以外が残っていたら訳す。
6. Playwright（1440×900）で全 29 block の light / dark route を開き、`lang` / `pageerror` / 横 overflow を実測（2.5）。login / signup 10 block は 390×844 でも横 overflow なし。
7. `node --test "scripts/*.test.mjs"` を実行し、失敗した test があれば単独で再実行する。単独再実行でも失敗する test が 0 件。
8. `node scripts/check-completeness.mjs` が exit 0（provenance 同期の確認）。
9. `node scripts/check-evidence.mjs` が exit 0。
10. `npm run check:all` が exit 0（約 30〜40 分。`run_in_background` 相当で回し、完走を待つ）。typecheck はローカルで OOM の場合 PR CI の結果で代替する。
11. 実測の範囲（存在 / 実行 / 動作）を各項目に書く。

## 5. レビューサイクル（委譲先で完結）

- 実施者: この worker。fresh context のレビュアーを `orca terminal create` + `orca terminal send` で 1 名立て（Orca の nested dispatch は使わない。#53 と同じ経路）、`lens-review-cycle` の既定 5 ロール（Security / Core Logic / Tests / Domain / Fresh Eyes）を順に当てる。Domain レンズでは `DESIGN.md`「ブランドボイス」と 2.1 の原則への適合（動詞と結果の一致、利用者の語彙、実装語の混入なし）を重点にする。並列起動しない。
- 収束規律は standards `AI_FIRST.md` §3: 最大 3 ラウンド（skill の既定値を上書き）。残った flag は `.docs/risk-registry.md` に受容記録を書き、即日決める。
- 「収束の対」: 終了宣言時に 4 節 1・2・7 を再実行して exit code を PR 本文へ書く。
- 指摘の正しさと修正の妥当性は別（brain URISK-117）。文言の好みの指摘は flag にしない（原則違反だけを flag にする）。

## 6. 完了条件

- ブランチ `naoto24kawa/issue-54-block-copy` で PR を作成する（マージしない。human 承認へ落とす）。PR 本文は日本語で、次を含む: 変更概要、**対訳表の全文**（2.2 に無い語を含む）、4 節の各項目の実測結果（コマンド・exit code・件数）、5 節の英語残存一覧と判定、レビュー記録、受容した flag と risk-registry の ID、実装担当識別子（エージェント名とモデル）、`Closes #54`。
- PR 本文はファイルに書いて `--body-file` で渡す。
- worker_done の body に PR の URL、最終 commit SHA、4 節の実測値を含める。

## 7. 制約

- **指示と実態が矛盾したら止めて ask で報告する**（例: 2.2 の訳を当てると UI が崩れる、`--resync` が provenance の他フィールドを変える、Playwright が使えない、対象 block に 2.2 で扱えない構造がある）。
- 裁量の範囲: 2.2 に無い語の訳、data.json の header の訳、report の表現、折り返し対応の文言短縮。コード識別子・class・構造・色は変えない。裁量で訳した語は PR 本文の対訳表に載せる。
- 逆委任は受けない。環境制約で担当範囲を遂行できないときは、範囲を司令塔へ戻さず ask で報告して判断を待つ。
- 想定所要時間: 3〜5 時間（29 block の文言、証跡 58 枚、check:all 約 30〜40 分、レビュー 3 ラウンドを含む）。その間 commit が無くても正常。
- 作成・編集するファイルに口語の語尾や絵文字を入れない。日本語で書く（技術用語・識別子は原語）。

## 司令塔裁定（2026-09-06）

- 対象数は実在する28blockへ補正する。証跡は28reportと56画像。29件はpreview-selectors.jsonのキー数との取り違えによる司令塔側の数え間違い。原文の29件をこの裁定で読み替える。

- login-05のWelcome to Acmeはログインに訳す。固定訳のアカウントを作成はsignup側だけに適用する。
- 架空人名は指定7名の後に小林 蓮（ren.kobayashi@example.com）、加藤 美月（mitsuki.kato@example.com）、吉田 陸（riku.yoshida@example.com）を追加する。メール差出人10名はこの順序で割り当て、emailの一意性を維持する。reviewerなど他blockも同じ10名の順序で使用可能。
- dashboard-tableの条件比較文字列Done / In Processはデータと同時に完了 / 作業中へ同期する。構造変更は最小限にしPR本文へ記録する。

- sidebar-11の技術ファイル名は内容そのものなので維持する。展開・選択状態の名前比較も維持し、Changes / Filesなどのラベルだけを日本語化する。状態バッジM / UはGitの慣習的な1文字表記なので維持する。

- 全件検証と収束の対は `node --test --test-concurrency=1 "scripts/*.test.mjs"` で実行する。既定の並列実行でシェル・Orca・Chromeの応答が約8分停止する現象を2回観測し、うち1回をCtrl-Cでexit 130へ中断したため。対象499件は維持し、コマンド差分・理由と最終pass / fail / skip件数をPR本文へ記録する。環境側の現象として残る課題へ記録し、AGENTS.mdのKey Commandsの変更は別途human判断とする。

- 売上カードの円表示によるバッジ切断を解消する最小class調整を承認する。4枚のstatカードを同じ調整に揃える。①CardTitleの`@[250px]/card:text-3xl`を外してtext-2xlを維持し、1440px / 390pxで実測する。②①で切れる場合だけCardActionへshrink-0 / whitespace-nowrap、CardTitleへmin-w-0を付ける。③それでも収まらない場合だけcol-span系を検討し、その前にaskする。数値のtruncate・省略は禁止。前後のカード右端とバッジ右端をreport / PRへ記録し、来歴同期・再レビュー・証跡再撮影を行う。component層は変更しない。

- preview全体の英語残存5件は司令塔裁定により維持する。Linux / Androidは固有名、Escはキー名、Variants / Sizesは対象外の既存toggle preview文言。toggleの2語は次PR候補として記録する。
