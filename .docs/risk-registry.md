# Risk Registry — 明示受容した例外（ACCEPTED_RISKS）

## RISK-001: Storybook を置かず Astro の隔離プレビューで代替する
- date: 2026-07-31
- confidence: high
- location: `.docs/plans/2026-07-31-elchika-ui-foundation-design.md` §1
- status: accepted
- reason: カタログサイトと描画確認手段を Astro に一本化し、運用対象を増やさないため。代償として design-sync は storybook shape でなく package shape になり、実レンダリングとの自動スクリーンショット照合を利用できない。
- anchor: Task 9 で生成する light / dark の静的ルートと、3 route × 2 テーマの実ブラウザ検証結果・スクリーンショットが `.docs/reviews/2026-07-31-button-preview.md` に記録される。ルートまたは描画が破れれば HTTP・DOM・console・network・keyboard の実測で検知される。

## RISK-002: Base UI を基底層に採用する
- date: 2026-07-31
- confidence: high
- location: `.docs/plans/2026-07-31-elchika-ui-foundation-design.md` §1
- status: accepted
- reason: shadcn CLI v4 が公式に提供する Base UI 構成を採用し、React 19 と共有 UI のアクセシビリティ基盤を揃えるため。DESIGN.md §2 の Radix UI ベースという記載からは乗り換えとなる。
- anchor: `src/components/ui/button.tsx` の `@base-ui/react` import、`npm run typecheck`、`npm run build:lib`、外部 probe の `npm run build` が実装と依存の整合を直接検査する。

## RISK-003: PR CI でフルセットを実行する
- date: 2026-07-31
- confidence: high
- location: `.github/workflows/ci.yml`
- status: accepted
- reason: DOCS_OPS §6 の build-check のみという分担はローカル `vp check` と main push の Deploy job を前提とするが、このリポジトリは `vp` も #1 時点の deploy 先も持たない。人間のマージ判断前に lint・test・型検査・配布物検査を実行するため、PR CI をフルセットにする。代償として PR ごとの Actions 実行時間が増える。
- anchor: GitHub Actions の PR run にある名前付きステップをすべて列挙して各 `conclusion` を Task 10 で API から読み、最終 head SHA と一致する run がすべて success であることを検査する。必須ステップとして `Design token build` と `Token contrast` の存在と success を個別に確認する。

## RISK-004: 検証スクリーンショットをリポジトリへコミットする
- date: 2026-07-31
- confidence: high
- location: `.docs/reviews/`
- status: accepted
- reason: AI_FIRST §2 が正本とする GitHub の直接添付は Web UI 経由でしか作成できず、CLI で作業するエージェントから実行できない。public リポジトリへ機微情報を含まない画像をコミットし、画像を含む commit SHA 固定の permalink を PR 本文から参照する。
- anchor: GitHub 上の PR 本文に計画が要求する証跡への `blob/<40桁SHA>/.docs/reviews/` permalink が存在し、ブランチ名を含む URL が 0 件であることを、Task 10 でリモート本文から読み戻す。画像は取得時の `format`、返却 bytes の magic、拡張子が一致することを各証跡で確認し、件数と拡張子を anchor へ固定しない。

## RISK-005: 実ブラウザ検証を別 worktree で行わない
- date: 2026-07-31
- confidence: high
- location: `.docs/plans/2026-07-31-elchika-ui-foundation-plan.md` Task 9
- status: accepted
- reason: 本リポジトリは本タスクで新規作成した fresh clone であり、保護すべき既存作業ツリーも共有 DB もない。実装を先にコミットし、その SHA からビルドした静的成果物を検証することで、AI_FIRST §2 の目的である「PR に入るコードを検証する」を満たす。
- anchor: 証跡に記録した `VERIFIED_SHA` が実在する commit であることと、`git diff --quiet "$VERIFIED_SHA" HEAD -- src/` が exit 0 であることを最終ゲートで検査する。差分があれば3 route × 2テーマの実ブラウザ検証を再実行する。

## RISK-006: light の warning ペアが WCAG AA を満たさない
- date: 2026-07-31
- confidence: high
- location: `src/styles/design-system/design-tokens.html` の warning pair と `src/styles/global.css` の `--warning` / `--warning-foreground`
- status: mitigated
- reason: デザインシステム v1.8 の検査済み `--color-status-warning-bg` / `--color-status-warning-text` pair を、`--warning` / `--warning-foreground` へ値の複製なしで alias する。旧 light pair の 3.9190:1 は置き換えられ、通常テキストに必要な 4.5:1 以上を token build と実 consumer の両方で検査する。
- anchor: `src/styles/design-system/build-tokens.mjs --check` が HTML 正本と生成 CSS の byte 一致および warning pair を検査し、`scripts/contrast.mjs` が生成 token と shadcn alias を結合して実 consumer の PASS / FAIL を再計算する。どちらかが失敗すれば配布へ進まない。

## RISK-007: 利用者の既存トークンを registry から上書きできない
- date: 2026-07-31
- confidence: high
- location: `registry.json` の `cssVars`、`~/elchika-ui/tokens.css`、`~/elchika-ui/design-system/tokens.css`
- status: accepted
- reason: shadcn の CSS 更新は `overwriteCssVars` が既定 `false` で、利用者側に同名の宣言が既にあれば何もしないため、registry からトークン値を強制適用できない。生成 token と shadcn alias を別 file で配り、README では alias 側 `~/elchika-ui/tokens.css` だけを最後に import するよう案内する。alias CSS の相対 `layer(design-system)` import が generated token へ到達する。registry は現在未公開であり、サブプロジェクト #3 で公開した後の配信正本を GitHub raw ではなく `ui.elchika.dev` とする。既定値を持たない `--success` / `--warning` とその foreground は `cssVars` で自動追加する。
- anchor: Task 9 の fresh install で2 file の byte 一致、alias の相対 import、利用側ビルドと light / dark の実 computed style を確認する。

## RISK-008: GitHub Actions を可変タグで参照する

- date: 2026-07-31
- confidence: high
- location: `.github/workflows/ci.yml` の `actions/checkout@v4` / `actions/setup-node@v4`
- status: accepted
- reason: 可変タグは同じ参照が別のコードを指しうる supply-chain risk を持つが、standards の正準テンプレートが `@v4` を採用しており、本リポジトリだけ SHA pin すると運用が分岐する。また、workflow は `permissions: contents: read` のみで secrets を使わず DOCS_OPS §6 の信頼境界を満たす。更新機構なしの pin は陳腐化して CVE 対応を遅らせるため、standards レベルの方針決定に先行して分岐させない。
- anchor: standards 側の Action Queue `manual-github-actions-sha-pin.md` で決まった判断に従う。

## RISK-009: Base UI Dialog が `aria-modal` を付与しない

- date: 2026-07-31
- confidence: high
- location: `src/components/ui/dialog.tsx`（`@base-ui/react` 1.6.0）
- status: accepted
- reason: Base UI 1.6.0 の Dialog は `role="dialog"` に `aria-modal` を付与しない。Root の `modal` は `true` / `false` / `"trap-focus"` を取るため、wrapper から無条件に `aria-modal="true"` を付けると非 modal 用途を誤表現する。上流の挙動を受容し、modal の実効性は content 内の focus trap、閉じたあとの trigger への focus return、背景の `aria-hidden="true"` と overlay の pointer event 捕捉で確認する。
- anchor: `@base-ui/react` の更新時に実ブラウザで `role="dialog"` の属性を再確認する。上流が `aria-modal` を付与するようになった場合は本受容を解消し、`aria-modal` と Root の `modal` 値の対応を検証項目へ戻す。

## RISK-010: Sonner が `next-themes` の ThemeProvider を前提とする

- date: 2026-08-01
- confidence: high
- location: `src/components/ui/sonner.tsx`（`next-themes` 0.4.6）
- status: accepted
- reason: `@elchika/sonner` は `next-themes` の `ThemeProvider` を前提とする。Provider が無い環境では `useTheme()` が `undefined` となり、Sonner は OS の `prefers-color-scheme` に従うため、`html.dark` によるテーマ切替と乖離する。サブプロジェクト #1〜#2 では、DESIGN.md §5 の standards 正規化と公開型の追加に範囲を限定し、上流 component のテーマ契約は変更せずそのまま配る。registry の dependencies には `next-themes` を含め、README で Provider の前提を案内する。本リポジトリのプレビューだけは、専用 wrapper が `html` の class を監視して `theme` prop へ明示的に渡す。
- anchor: 利用者が `@elchika/sonner` を実際に取り込んだとき、そのプロジェクトのテーマ切替で toast が追従するかを確認する。プレビューでは `.docs/reviews/2026-08-01-sonner-preview.md` の 2 route × 2 theme 実測が、toast の `data-sonner-theme` と `html.dark` の一致を固定する。

## RISK-011: Calendar の上流由来レイアウトが 80 実行行を超える

- date: 2026-08-02
- confidence: high
- location: `src/components/ui/calendar.tsx` の `Calendar`
- status: accepted
- reason: Sentinel の `oversized-function` レンズを、空行・コメント・区切り行・JSX 終了タグだけの行を除外する物理 SLOC で実測すると 80 行を超える。一方、このリポジトリに 80 行制限はなく、correctness・security・明示要件への影響も検出されていない。shadcn/ui の上流レイアウトを関数分割すると、表示クラスと React DayPicker の slot 対応が分散し、上流更新への追従差分を増やすため、保守性上の low finding を受容して現状を維持する。
- anchor: `provenance.json` の `calendar.upstreamPathSha` と `modified` が上流との差分を固定する。`scripts/check-standards.test.mjs`、型検査、配布物 build、および Calendar の Light / Dark 実ブラウザ証跡が、上流追従時の機能回帰を検知する。

## RISK-012: standards checker の className 静的解析を完全な抽象実行にしない

- date: 2026-08-02
- confidence: high
- location: `scripts/check-standards.mjs` の `className` 候補解析
- status: accepted
- reason: 透明な focus ring の分割指定を検出するため、checker は TypeScript の module graph・lexical binding・条件制約・静的 helper return まで解析する。一方、レビューサイクルを既定上限の3ラウンドを超えて反復した結果、残る指摘は次の interprocedural abstract interpretation 境界へ収束した。
  - union literal 型の computed key が到達できる全 property を列挙しない。
  - helper の仮引数へ実引数を束縛せず、既知 return と raw 引数を代替候補として扱うため、分割違反の見逃しと引数を無視する helper の偽検出がありうる。
  - 同値 literal の引用符を意味値へ正規化せず、loose equality と strict equality を同じ制約として扱う。
  - destructuring alias を元 property へ正規化せず、単純 const alias では元 binding / property の後続 mutation を追跡しない。
  - 独立分岐の候補集合を直積するため、人工的に多数の分岐を置いた `className` では実行時間が指数的に増える。
  これらを同時に sound に解消するには、parameter substitution、union 展開、mutation-aware control-flow、JavaScript coercion、候補状態の抽象化と上限超過時の fail-closed 診断が必要になる。補助 checker に独自の言語解析器を持つライフサイクル総複雑さは、本サブプロジェクトの61コンポーネントを検査する便益を超えるため、既知の限界として受容する。
- impact: `focus-ring-opacity` の複数 fragment 関連付けに偽陰性・偽陽性が残り、信頼できない source が多数の独立分岐を追加すると CI 時間を消費しうる。単一 literal / 同一行の規定違反、arbitrary value、boolean `data-inset` の検査には影響しない。
- mitigation: 生成 component は provenance と実差分を保持し、`npm run check:all` に加えて型検査、配布物 build、component ごとのレビューと実ブラウザ検証を通す。checker が対応しない class helper、computed union key、loose equality、mutation を伴う alias を `className` に導入する変更はレビューで個別確認する。現在の実ソースでは checker が完走し、standards 違反0件を確認済みである。
- anchor: `scripts/check-standards.test.mjs` が対応済みの binding・condition・module resolution 境界を固定する。実ソースに上記未対応 pattern が導入されたとき、または候補解析が CI の時間制限へ近づいたときは、TypeScript / ESLint の既存 control-flow API で置換可能か再評価し、置換できなければ候補上限と fail-closed 診断を追加する。

## RISK-013: vendored token 仕様ページが Clipboard API の失敗を表示しない

- date: 2026-08-02
- confidence: high
- location: `src/styles/design-system/design-tokens.html` の token 名コピー処理
- status: accepted
- reason: デザインシステム v1.8 の仕様ページは承認済み外部正本を byte 一致で保持し、生成 token の唯一の正本として使う。`navigator.clipboard.writeText()` の reject handler は空で、コピー失敗を画面へ表示しないが、ここを単独修正すると上流同一性と生成物追跡の契約を壊す。影響は仕様ページ内の補助的なコピー操作に限定され、token 生成・registry 配布・利用者アプリの runtime には到達しないため、上流改善候補として受容する。
- mitigation: 仕様ページの button semantics など既知の a11y error と同じく、Task 8 の最終レポートへ改善候補として記録する。token 値の参照と配布は Clipboard API に依存せず、`build-tokens.mjs --check` と registry の byte 一致検査を fail-closed で通す。
- anchor: `README.md` の「トークンの適用」が取り込み元 SHA と承認済み generator 差分を固定する。上流 v1.8 source が更新されたときは、コピー失敗の表示が追加されたかを確認し、解消していれば本受容を閉じる。

## RISK-014: Slider のSSRとclient初回renderでtext hydration mismatchが起きる

- date: 2026-08-03
- confidence: high
- location: `src/components/ui/slider.tsx` / `src/previews/slider.tsx` のisolated preview hydration
- status: accepted
- reason: `/preview/slider/`と`/preview/slider-dark/`のfresh loadでReact minified error #418を1件ずつ検出した。見た目、selector、theme同期、focus、overflowは正常だが、ReactがSSR出力をclient側で再生成して不一致を隠している。既存Slider証跡の検証SHA `cf2542b675ad78804c8af239b866b6c290e69bdb`を当時のlockfileから再buildし、navigation前からRuntimeを監視しても同じ#418が再現したため、デザイントークン移行が開けた欠陥ではなく移行前からのlatent defectと判断した。今回PRはブランドトークン移行にscopeを限定し、Slider sourceの原因調査と修正は別作業へ分離する。
- impact: hydration時にclient re-renderが発生し、初期DOM identity・state・event timingへ影響する可能性がある。現在のpreviewでは操作可能なSliderとvalue表示が残るが、console clean契約は満たさない。
- mitigation: 新しいSlider証跡は#418を正直に記録し、navigation前にRuntime listenerを登録する再現手順をanchorにする。同じ新runnerで64 routeを再監査し、Slider以外の63 routeはconsole 0だったため、旧手法が見逃したlatent例外はSliderだけと実測した。別作業ではSSR HTMLとclient初回DOMのtext差分を開発buildで特定し、RED/GREENのbrowser回帰検査を追加する。
- anchor: `.docs/reviews/brand-token-migration/2026-08-03-slider-preview.md`のlight/dark実測と、旧SHA `cf2542b675ad78804c8af239b866b6c290e69bdb`での再現結果。
