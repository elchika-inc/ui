# elchika-inc/ui — registry:block の導入設計

- **作成日**: 2026-08-17
- **対象**: `elchika-inc/ui` への `registry:block` レーン新設と、上流 shadcn base-nova からの block 27 件の移植
- **発端**: 現状の registry は `registry:ui` 61 件 + `registry:hook` 1 件のみで、ログイン画面のような「組み立て済みの雛形」を配布できない。部品は揃っているが、部品の組み合わせ方の知識が配布経路に載っていない。

## 1. 決定事項

| 項目 | 決定 | 根拠 |
|---|---|---|
| block の出自 | **上流 shadcn base-nova からの移植**（自作しない） | 既存 61 件と同じ経路。`provenance.json` の既存スキーマが移植品前提で作られており、自作はスキーマ分岐という恒常コストを生む |
| 配置 | `src/blocks/<block-name>/` の **per-block ディレクトリ**。上流の `components/` サブディレクトリ構造もそのまま保つ | 実測 §6-3。フラット配置は物理的に不可能 |
| item 名 | 上流と同名（`login-01` 等）。接頭辞を付けない | 利用側の導入コマンドが `shadcn add @elchika/login-01` となり、上流のドキュメントやスクリーンショットから名前で辿れる |
| barrel（`src/index.ts`） | **載せない**。registry 経由の配布専用 | block は import する API ではなく copy-and-edit の雛形。barrel に載せると `types/dts-contract.ts` が全 export に `<Name>Props` を強制し、ライブラリの公開 API が雛形で薄まる |
| `registry:page` | **配布しない**。レイアウト枠は preview へ移す | standards が Next.js を標準スタック外としている（実測 §6-4）。`target: app/login/page.tsx` は Next の App Router 規約 |
| UI 文言 | **上流の英語のまま** | 利用側が copy-and-edit で書き換える前提。移植の差分を最小に保ち、来歴を追いやすくする（2026-08-17 ユーザー判断） |
| 対象 block | **27 件**（login-01〜05 / signup-01〜05 / sidebar-01〜16 / dashboard-01） | 実測 §6-1。base-nova に実在するものの全件 |
| 検査 | `check-completeness.mjs` を **kind 別要件マトリクス**へ拡張 | ゲートの掛からないレーンを作らない。§3 参照 |

## 2. スコープ

### やること

上流 base-nova の block 27 件を、既存 61 コンポーネントと同じ水準の検査・来歴・プレビュー・法務同梱の下に置き、registry から配布可能にする。

### やらないこと

- 独自 block の新規設計（上流にないものを作らない）
- `registry:page` の配布（§1 の決定）
- 上流 block の UI 文言の翻訳・改変（レイアウト枠の preview 移設と、standards 適合のための正規化は除く）
- registry を per-item ファイルへ分割する構造変更（§5 で検討し不採用）

## 3. アーキテクチャ

### 3-1. block を「別種のレーン」として扱う

`check-completeness.mjs` は現在 `src/components/ui/*.tsx` を唯一の走査根とし、全コンポーネントに 5 経路（barrel export / registry item / preview tsx / preview astro ×2 / provenance）を要求する。block はこのうち barrel 系を満たせない（満たすべきでない）ため、走査根を追加した上で **kind 別の要件マトリクス**へ拡張する。

| 要件 | `registry:ui` | `registry:block` |
|---|---|---|
| barrel export + `<Name>Props` | 必要 | **不要** |
| registry.json の item | 必要 | 必要 |
| preview（tsx + light/dark astro） | 必要 | 必要 |
| provenance | 必要 | 必要（形式は 3-3 で拡張） |

### 3-2. `add-component.mjs` の 3 箇所を拡張する

| 箇所 | 現状 | 改修 |
|---|---|---|
| `resolveRegistryTarget` | `registry:ui` / `registry:hook` のみ対応、他は throw | `registry:block` を追加。upstream は `registry/base-nova/blocks/<name>/...` |
| 同関数の `primaryFiles.length !== 1` | 一次ファイルが 1 個でないと throw | block は 2〜11 ファイル。複数許容へ |
| `CHANGE_CLASSIFICATION_RULES` | `src/blocks/` の matcher が無い | 追加しないと add 後の reconcile が「想定外パス」で停止する |

3 箇所目は fail-closed が正しく働いた結果として停止するため、塞ぎ忘れると「なぜか毎回停止する」形で現れる。

### 3-3. `provenance.json` に `blocks` セクションを新設する

現行の `PROVENANCE_SPEC` は単一ファイル前提で、`upstreamPath: /^\S+\.tsx$/` と各 SHA を 1 つずつしか持てない。block は複数ファイルで、`dashboard-01/data.json` は `.tsx` の正規表現に一致しない。

`components` と同列に `blocks` を置き、共通メタ（`registryUrl` / `registryContentSha256` / `addTarget` / `shadcnCliVersion` / `fetchedAt` / `license` / `modified`）に加えて **`files[]` 配列**（`path` / `upstreamPath` / `upstreamPathSha` / `generatedContentSha256`）を持たせる。

103 ファイルの来歴を一次ファイル 1 個分しか記録しない設計では、PROJECT_GOAL の DoneCriteria 8（来歴をコンポーネントごとに機械可読で記録）が実質空洞化する。

### 3-4. preview とカテゴリ

`src/catalog/previews.ts` は `import.meta.glob("../previews/*.tsx")` で自動収集するため、preview の配線改修は不要。ただし `component-categories.mjs` は全 preview の分類を強制する検査を持つので、block 用カテゴリ（「認証」「ダッシュボード」）を追加する。

`registry:page` を配布しない代わりに、page.tsx が持っていたレイアウト枠（`flex min-h-svh w-full items-center justify-center p-6 md:p-10` と `max-w-sm` 相当）は preview 側へ移し、上流と同じ見た目を再現する。

### 3-5. 証跡

`check-completeness` は証跡を要求しないが、当リポジトリの運用は実ブラウザ証跡を伴う。**27 件 × light/dark = 54 枚**を `.docs/reviews/` へ追加する。

共有トークン（`src/styles/global.css` / `src/styles/design-system/tokens.css`）は変更しないため、`SHARED_TOKEN_IMAGE_SUBJECTS`（14 件 × light/dark = 28 枚）の撮り直しは発生しない。

## 4. フェーズ構成

| Phase | 内容 | このフェーズで潰すもの |
|---|---|---|
| **1. レーン構築 + login-01** | `src/blocks/` 新設、§3-2 の 3 箇所拡張、§3-1 のマトリクス化、§3-3 のスキーマ新設。**login-01 の 1 件だけ**を端から端まで通す | 機構の設計ミス。1 件で見つければ修正コストは 1 件分 |
| **2. 残り 25 件** | 認証系 9 件 + sidebar 16 件。新規 npm 依存ゼロ | 1 件では出ない衝突（`app-sidebar.tsx` が 15 件で同名）、preview 54 枚とカテゴリ分類の運用コスト |
| **3. dashboard-01** | npm 依存 6 件（`@dnd-kit/core` / `@dnd-kit/modifiers` / `@dnd-kit/sortable` / `@dnd-kit/utilities` / `@tanstack/react-table` / `zod`）追加、`THIRD_PARTY_LICENSES` 再取得、ライブラリ選定基準の判断を記録 | 依存追加の是非。他 26 件の進行を止めずに切り離せる |

### 実装体制

| Phase | worker 数 | 理由 |
|---|---|---|
| 1 | 1 | `add-component.mjs` / `check-completeness.mjs` / `provenance.json` スキーマは互いに噛み合っていないと意味がなく、分割不能 |
| 2 | 1（直列） | §5-2 参照 |
| 3 | 1 | 依存追加の判断を含むため独立 |

委任仕様には literal 実行前提の記述、「指示と実態が矛盾したら止めて報告せよ」、レビューサイクルの実施者（委譲先で完結）と上限ラウンド数を明記する。

## 5. 検討して採らなかった案

### 5-1. `src/components/ui/` へ既存コンポーネントと同列に配置する

**不採用。物理的に成立しない。** 配布ファイル 103 個のうち、ファイル名 26 種の **16 種が衝突**する（実測 §6-3）。`page.tsx` は 27 件全部が同名、`login-form.tsx` は login-01〜05 が同名。

プレフィックスで回避しても `login-01-login-form.tsx` のような名前が 61 件の部品リストに 27 件混ざり、`component-categories.mjs` の分類も破綻する。

### 5-2. Phase 2 を 2 worker で並列化する

**不採用。書き込み先が独立していない。** 25 件は互いに完全独立だが、`registry.json` / `provenance.json` / `component-categories.mjs` の 3 ファイルはいずれも単一の台帳であり、worktree で隔離してもマージ時に 3 ファイル全部が衝突する。25 件分の JSON 差分を手で解決するのは直列より高くつく。

registry を per-item ファイルへ分割すれば並列化できるが、今回 1 回のために台帳の構造を変えるのは割に合わない（YAGNI）。

### 5-3. `src/blocks/` へ置くがゲートは拡張しない

**不採用。** 最も安いが、ゲートの掛からないレーンができる。当リポジトリは `check-all.mjs` が 7 検査を fail-closed で並べ、`add-component.mjs` は分類不能なパスを見たら「復元せず停止」する設計思想を持つ。そこへ未検査の 27 件・103 ファイルを足すのは思想への逆行であり、この機構拡張こそが block 導入コストの本体である。

## 6. 実測

すべて 2026-08-17 に実施。取得物は scratchpad に保存。

### 6-1. base-nova の block 実在確認

`https://ui.shadcn.com/r/styles/base-nova/<name>.json` を取得し、`type === "registry:block"` を確認した。

- 実在: login-01〜05、signup-01〜05、sidebar-01〜16、dashboard-01 の **27 件**
- 不在（404）: login-06、otp-01/02、forgot-password-01、authentication-01、dashboard-02/03、sidebar-17
- 公開 index（`https://ui.shadcn.com/r/index.json`）には `registry:ui` 63 件のみが載り、block は含まれない。個別 URL でのみ取得できる

### 6-2. 依存の充足

27 件の `registryDependencies` を既存 registry item と突き合わせた結果、**不足は 0 件**。既存 61 コンポーネントで全 block をまかなえる。

npm 依存の不足は **dashboard-01 のみ**で 6 件（`@dnd-kit/core` / `@dnd-kit/modifiers` / `@dnd-kit/sortable` / `@dnd-kit/utilities` / `@tanstack/react-table` / `zod`）。他 26 件は新規依存ゼロ。

### 6-3. ファイル名の衝突

配布ファイル総数 **103 個**、ファイル名 26 種のうち **16 種が衝突**。

| 衝突数 | ファイル名 |
|---|---|
| 27 | `page.tsx`（全 block） |
| 15 | `app-sidebar.tsx` |
| 7 | `nav-main.tsx` / `nav-user.tsx` |
| 5 | `nav-secondary.tsx` / `login-form.tsx` / `signup-form.tsx` |
| 4 | `search-form.tsx` |
| 3 | `nav-projects.tsx` / `team-switcher.tsx` |
| 2 | `site-header.tsx` / `version-switcher.tsx` / `nav-favorites.tsx` / `nav-workspaces.tsx` / `calendars.tsx` / `date-picker.tsx` |

上流がこの衝突を許しているのは、block が「利用者が 1 つ選んで自分のアプリへコピーする雛形」であり、同時に複数入れる前提がないため。registry 側は per-block ディレクトリで名前空間を切る必要がある。

### 6-4. 利用側フレームワーク（standards が正本）

当リポジトリの利用者は `PROJECT_GOAL.md` が定める「elchika-inc の各プロダクト」であり、standards に準拠する。

| 出典 | 記述 |
|---|---|
| `PROJECT_RULES.md` | フレームワークは Hono（API）+ React（UI）（SHOULD） |
| `CHANGELOG.md` | 「全プロジェクトが Cloudflare + Hono + Vite に収束しており、差が『astro を足すか』『three を足すか』の 2 軸しかない」 |
| `CHANGELOG.md` | **「Next.js + OpenNext で標準スタック外」** |
| `AUDIT.md` | トークン定義の適用対象は「React SPA app のみ — Astro 系 app は N/A」 |

上流 block の `registry:page` は `target: app/login/page.tsx` を持ち、これは Next.js App Router のファイルベースルーティング規約である。標準スタック外の規約を配布物へ焼き込むことになるため配布しない。

### 6-5. login-01 の page.tsx の中身

配布しない判断の影響範囲を測るため中身を確認した。レイアウト枠のみで、308 文字。

```tsx
<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
  <div className="w-full max-w-sm"><LoginForm /></div>
</div>
```

この枠は preview 側へ移設することで見た目を再現できる（§3-4）。

## 7. DoneCriteria

1. `npm run check:all` の 7 検査すべてが exit 0 で、`check-completeness` が block を kind 別要件で検査していること。**block を 1 件わざと壊して赤くなることを確認する**（緑であることは検査が働いている証拠にならない）
2. `provenance.json` の `blocks` に 27 件分の来歴があり、103 ファイルすべてが `files[]` に SHA 付きで載っていること
3. 全 block の preview が light / dark の 2 ページで存在し、dark 側ルート要素が `class="dark"` を持つこと
4. **リポジトリ外の別プロジェクトへ実際に `shadcn add` して描画されること** — React + Vite の scratch アプリで `@elchika/login-01` を導入し、ビルドと描画まで到達する
5. 配布 registry item に法務ファイル（`LICENSE` / `THIRD_PARTY_LICENSES` / トークン 3 ファイル）が同梱され、`check-distribution` を通ること

DoneCriteria 4 は、block がリポジトリ内の検査では測れない失敗モード（同名ファイルの落下先、複数 block を同時導入したときの衝突）を持つため必須とする。
