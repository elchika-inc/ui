# PROJECT_GOAL — ui

## 目的

elchika-inc の各プロダクトが同じ見た目と操作性を共有できるよう、Base UI と Tailwind CSS v4 を用いた UI コンポーネントの正本を構築する。npm publish は行わず、利用側がソースをコピーして所有する shadcn custom registry で配布する。

## 対象範囲

- 対象: `elchika-inc/ui` のリポジトリ骨格と共有 UI コンポーネント。
- サブプロジェクト #1 の成果物: Button 1 件について、法務・来歴・生成・standards 適合・ビルド・registry 配布・隔離プレビュー・CI の経路を端から端まで通す。
- 非対象: 約 50 件のコンポーネント実装、docs サイトの本格構築、registry の公開、Claude Design への同期、standards 側の更新、既存 `@tools/ui` の移行。

## SuccessCriteria

1. `npm ci && npm run build` により、ライブラリ・registry・Astro サイトの成果物が fresh checkout から再現できる。
2. `src/components/ui/` の全コンポーネントが standards に適合し、名前付き Props 型・registry item・light/dark プレビューの全経路に載る。
3. registry から別プロジェクトへ取り込んだソース・トークン・法務ファイルが実際に届き、利用側でビルドできる。
4. コンポーネントの上流来歴とライセンスが機械可読かつ追跡可能である。
5. 実ブラウザ検証と CI の結果が、検証対象の commit SHA に束縛されている。

## DoneCriteria（サブプロジェクト #1）

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

## 明示的な非目標

- サブプロジェクト #2 以降の成果物を先取りしない。
- npm registry へ publish しない。
- 配信ドメイン確定前に registry URL を利用者へ公開しない。
- standards のルールやテンプレートをこのリポジトリから変更しない。
