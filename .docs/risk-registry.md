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
