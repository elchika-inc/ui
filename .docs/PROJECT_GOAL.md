# PROJECT_GOAL — ui

## 目的

elchika-inc の各プロダクトが同じ見た目と操作性を共有できるよう、Base UI と Tailwind CSS v4 を用いた UI コンポーネントの正本を構築する。npm publish は行わず、利用側がソースをコピーして所有する shadcn custom registry で配布する。

## 対象範囲

- 対象: `elchika-inc/ui` のリポジトリ骨格と共有 UI コンポーネント。
- 完了済みの初期基盤 #1: Button 1 件について、法務・来歴・生成・standards 適合・ビルド・registry 配布・隔離プレビュー・CI の経路を端から端まで通した。
- 完了済みのブランドトークン移行: 登録済み全コンポーネントを、デザインシステム v1.8 の2層 token、shadcn alias、実 consumer contrast、SHA 固定証跡の契約へ移行した。
- 現行のサイト配信 Phase A: registry index、利用者向け docs、Workers Assets と deploy workflow、Phase B の手動公開手順を repo 内へ実装する。
- 継続して非対象: Phase B の Cloudflare token 発行・GitHub secrets 登録・custom domain 操作、Claude Design への同期、standards 側の更新、既存 `@tools/ui` の移行。

## SuccessCriteria

1. `npm ci && npm run build` により、ライブラリ・registry・Astro サイトの成果物が fresh checkout から再現できる。
2. `src/components/ui/` の全コンポーネントが standards に適合し、名前付き Props 型・registry item・light/dark プレビューの全経路に載る。
3. registry から別プロジェクトへ取り込んだソース・トークン・法務ファイルが実際に届き、利用側でビルドできる。
4. コンポーネントの上流来歴とライセンスが機械可読かつ追跡可能である。
5. 実ブラウザ検証と CI の結果が、検証対象の commit SHA に束縛されている。

## DoneCriteria（初期基盤 #1、完了済み）

1. shadcn CLI の Astro + Base UI + Nova scaffold が成功し、`components.json` の `style` が `base-nova` である。
2. `src/components/ui/button.tsx` が `@base-ui/react` を import し、生成直後の standards 違反が 0 件である。
3. `src/styles/global.css` が standards の `templates/design-tokens.css` と同一で、和文フォールバック・`--success`・`prefers-reduced-motion` を含む。
4. `lib/index.d.ts` が `ButtonProps` を export し、その型が `variant` と `size` の契約を持つ。
5. ローカル配信した registry URL から、リポジトリ外の別プロジェクトへ standards 適合済み Button をコピーできる。
6. Button の隔離プレビューが light / dark の 2 静的ページとして存在し、dark 側ルート要素が `class="dark"` を持つ。
7. `THIRD_PARTY_LICENSES` に shadcn / Base UI の上流実ファイルが含まれ、registry の配布物にも同梱される。
8. 実行した CLI の exact version・配信元 URL・受領内容の SHA-256・元テンプレートのパスと commit・取得日・ライセンスが、コンポーネントごとに機械可読で記録される。
9. PR テンプレートに来歴チェック欄が空欄で用意される。
10. `.docs/` の `PROJECT_GOAL.md` / `actions/` / `plans/` / `risk-registry.md` が Git の追跡対象として存在し、受容エントリが `status: accepted` + `reason` + `anchor` を持つ。
11. `AGENTS.md` の `branch_policy` が `protected` で、GitHub 側の ruleset が実際に有効である。
12. CI が緑で、lint・型検査・standards 適合検知・テスト・両ビルド・registry 出力・法務ファイル同梱検査を実行する。

## DoneCriteria（現行ブランドトークン移行）

1. `src/styles/design-system/design-tokens.html` を正本として Layer 0 / 1 の `tokens.css` と `brands.css` を再生成し、正本と生成物の byte 一致を常設 gate で検査する。
2. `src/styles/global.css` は色値を複製せず shadcn alias を定義し、`color-scheme` を除く light / dark alias の key と式を完全一致させる。
3. registry は alias CSS と runtime 用 generated token の両方を配布し、fresh install で source・token・法務ファイルの到達と利用側 build を確認する。
4. consumer contrast sensor は全必須 case の gate・theme・source class 契約と実利用 pair を検査し、実ブラウザ証跡を不変な実装 SHA へ束縛する。

## DoneCriteria（サイト配信 Phase A）

1. `registry:build` が上流互換の非空 JSON 配列を `public/r/index.json` へ生成し、registry item と同じ集合を持つ。
2. トップページが直接 URL、`@elchika` 名前空間、shadcn MCP の3経路と token alias の再削除を案内する。
3. 実在する preview 集合から `/components/<name>` を静的生成し、単一カテゴリ正本の未分類・重複・未知が0である。
4. component ページが配布 `Sidebar`、`aria-current`、isolated preview、直接 URL と名前空間の install command を持ち、light / dark を切り替えられる。
5. Workers Assets が `dist/` を SPA fallback なしで配信し、main push と `workflow_dispatch` の deploy workflow が build 後に Wrangler を実行する。
6. README が `https://ui.elchika.dev` の実手順へ更新され、Phase B の user 操作が1枚の manual action として再現可能に記録される。
7. 既存 `/catalog/`、`/preview/*`、`.github/workflows/ci.yml` を変更せず、既存 gate と新規の機械検査がすべて exit 0 になる。

## 明示的な非目標

- 現行移行の対象外となる新しいコンポーネント実装を追加しない。
- npm registry へ publish しない。
- Phase A から Cloudflare token 発行、GitHub secrets 登録、custom domain 操作を行わない。
- standards のルールやテンプレートをこのリポジトリから変更しない。
