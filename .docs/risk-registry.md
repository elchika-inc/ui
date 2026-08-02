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
- anchor: GitHub Actions の PR run にある13個の名前付きステップと各 `conclusion` を Task 10 で API から読み、最終 head SHA と一致する run がすべて success であることを検査する。

## RISK-004: 検証スクリーンショットをリポジトリへコミットする
- date: 2026-07-31
- confidence: high
- location: `.docs/reviews/`
- status: accepted
- reason: AI_FIRST §2 が正本とする GitHub の直接添付は Web UI 経由でしか作成できず、CLI で作業するエージェントから実行できない。public リポジトリへ機微情報を含まない画像をコミットし、画像を含む commit SHA 固定の permalink を PR 本文から参照する。
- anchor: GitHub 上の PR 本文に6本の `blob/<40桁SHA>/.docs/reviews/*.png` URL が存在し、ブランチ名を含む URL が 0 件であることを、Task 10 でリモート本文を読み戻して検査する。

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
- location: `src/styles/global.css` の `--warning` / `--warning-foreground`
- status: accepted
- reason: standards の正本を byte 一致で取り込んだ状態で実計算したコントラスト比は 3.9190:1 であり、通常テキストに必要な 4.5:1 を満たさない。本サブプロジェクトの Button は warning ペアを使わないため #1 では実害がなく、standards 側の修正を待つ。warning 背景と foreground を使うコンポーネントを追加する前に再検討する。
- anchor: standards の `.docs/actions/next-session-warning-foreground-contrast.md` が閉じられて `templates/design-tokens.css` の該当トークンが変更されること、および本リポジトリの `scripts/contrast.mjs` が `src/styles/global.css` の実値から PASS / FAIL を再計算すること。Task 10 の整合検査は PASS 後に本エントリが残る状態も拒否する。

## RISK-007: 利用者の既存トークンを registry から上書きできない
- date: 2026-07-31
- confidence: high
- location: `registry.json` の `cssVars` と `~/elchika-ui/tokens.css`
- status: accepted
- reason: shadcn の CSS 更新は `overwriteCssVars` が既定 `false` で、利用者側に同名の宣言が既にあれば何もしないため、registry からトークン値を強制適用できない。全トークンの正本を `~/elchika-ui/tokens.css` として配り、README で利用者自身の CSS から最後に `@import` するよう案内する。既定値を持たない `--success` / `--warning` とその foreground は `cssVars` で自動追加する。
- anchor: 利用者側プロジェクトのビルド出力に elchika のトークン値が現れるかを、サブプロジェクト #2 以降で実際に取り込むときに確認する。

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
