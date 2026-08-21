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

### 3-2-2. `check-all` の 7 検査が `src/blocks/` を見るか

「ゲートの掛からないレーンを作らない」（§5-3）が成立するかは、走査根を持つ検査すべてが block を拾うかで決まる。7 検査すべてについて実測した。

| 検査 | 走査根 | block の扱い | 改修 |
|---|---|---|---|
| standards | `src/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts,css}`（glob） | **自動で拾う** | 不要（実測で確認） |
| completeness | `src/components/ui/*.tsx`（固定） | 拾わない | 必要（§3-1） |
| preview render | `readdirSync("src/components/ui")`（固定） | **拾わない** | **必要** |
| distribution | registry item 起点 | 自動で拾う | 不要 |
| design tokens / contrast | トークンファイルのみ | 対象外 | 不要 |
| evidence | `.docs/reviews/` 起点 | stale 検知は自動で拾う。**coverage（block に証跡があるか）は拾わない** | **必要**（訂正 2026-08-18: 当初「不要」としたが、証跡の欠落を検出できなかった。Task 5 のレビューで block 証跡のカバレッジ検査を追加した） |

preview render の走査根拡張は当初の設計に含まれておらず、この実測で追加された。ここを見落とすと、**block の preview が壊れていても緑になる**状態で「ゲートを掛けた」と主張することになる。

### 3-3. `provenance.json` に `blocks` セクションを新設する

現行の `PROVENANCE_SPEC` は単一ファイル前提で、`upstreamPath: /^\S+\.tsx$/` と各 SHA を 1 つずつしか持てない。block は複数ファイルで、`dashboard-01/data.json` は `.tsx` の正規表現に一致しない。

`components` と同列に `blocks` を置き、共通メタ（`registryUrl` / `registryContentSha256` / `addTarget` / `shadcnCliVersion` / `fetchedAt` / `license` / `modified`）に加えて **`files[]` 配列**（`path` / `upstreamPath` / `upstreamPathSha` / `generatedContentSha256`）を持たせる。

一次ファイル 1 個分しか記録しない設計では、PROJECT_GOAL の DoneCriteria 8（来歴をコンポーネントごとに機械可読で記録）が実質空洞化する。

**配布しない `page.tsx` も `files[]` に記録する。** 上流から受け取ったファイルは 103 個で、うち 27 個の `page.tsx` は §1 の決定により配布しない。落としたエントリには `dropped: true` を付け、手元に実体がないため `generatedContentSha256` を持たせず `upstreamPath` / `upstreamPathSha` のみを記録する。

「落とした」こと自体が上流からの改変であり、`modified` の文章による主張を機械可読に裏付ける。配布分 76 件だけを記録すると、来歴からは page が最初から存在しなかったのか意図的に落としたのかを区別できない。

### 3-4. preview とカテゴリ

`src/catalog/previews.ts` は `import.meta.glob("../previews/*.tsx")` で自動収集するため、preview の配線改修は不要。ただし `component-categories.mjs` は全 preview の分類を強制する検査を持つので、block 用カテゴリを追加する。

**Phase 1 では「認証」カテゴリのみを追加した。** sidebar 系 16 件の置き場所は Phase 2 で「アプリシェル」として新設した（§3-4-3）。

`registry:page` を配布しない代わりに、page.tsx が持っていたレイアウト枠（`flex min-h-svh w-full items-center justify-center p-6 md:p-10` と `max-w-sm` 相当）は preview 側へ移し、上流と同じ見た目を再現する。

### 3-4-2. `IconPlaceholder` の展開（Phase 2 で追加）

18 件の block が `@/app/(create)/components/icon-placeholder` を import する（§6-2 の訂正）。これは**不足している部品ではなく、配布時に解決されるべきマーカー**である。実体を読むと 5 つのアイコンライブラリの名前を並べて持つ。

```tsx
<IconPlaceholder
  lucide="GalleryVerticalEndIcon"
  tabler="IconLayoutRows"
  hugeicons="LayoutBottomIcon"
  phosphor="RowsIcon"
  remixicon="RiGalleryLine"
  className="size-4"
/>
```

上流サイト（`app/(create)/`）が利用者の選んだライブラリへ解決するためのもので、registry からも GitHub の配布ツリーからも取得できない（両方 404 を実測）。

**決定: 移植時の正規化として `lucide-react` の実アイコンへ展開する。** 自前の `IconPlaceholder` を用意しない — 5 ライブラリ対応の抽象を恒常的に保守することになり、「1 関数のために依存を足さない」「自前実装は最後の手段」に反する。`lucide-react` は既に当リポジトリの依存にある。

展開ルール:

- `<IconPlaceholder lucide="XIcon" ...その他ライブラリ属性 className="..." />` → `<XIcon className="..." />`
- `lucide` 以外のライブラリ属性（`tabler` / `hugeicons` / `phosphor` / `remixicon`）は捨てる
- `import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"` は `import { XIcon, YIcon } from "lucide-react"` へ置き換える（同一ファイル内で使う全アイコンをまとめる）
- `className` 以外の属性が付いていたらそのまま引き継ぐ

実測（2026-08-18）:

| 項目 | 値 |
|---|---|
| 使用箇所 | 243 件 |
| `lucide` 属性が欠けている箇所 | **0 件** |
| 必要な lucide アイコン | 79 種 |

`lucide` 属性の欠損が 0 件なので機械的に展開できる。**ただし展開スクリプトは「lucide 属性が無い箇所を見つけたら停止する」fail-closed で書く** — 上流が将来 lucide を落とした場合に、黙って壊れた JSX を生成させない。

展開したことは各 block の `modified` に記録する。

### 3-4-3. block のカテゴリ（Phase 2 で確定）

| カテゴリ | 対象 | 状態 |
|---|---|---|
| 認証 | login-01〜05 / signup-01〜05 | Phase 1 で新設済み（login-01 のみ登録） |
| **アプリシェル** | sidebar-01〜16 / dashboard-01 | **Phase 2 で新設** |

既存の「ナビゲーション」へ入れない理由: そこには部品としての `sidebar` が既にあり、部品（`registry:ui`）と画面雛形（`registry:block`）が同じ棚に並ぶと利用者が区別できない。名前も `sidebar` と `sidebar-07` で紛らわしい。block は「アプリの骨格」という別の粒度なので棚を分ける。

### 3-5. 証跡

`check-completeness` は証跡を要求しないが、当リポジトリの運用は実ブラウザ証跡を伴う。**27 件 × light/dark = 54 枚**を `.docs/reviews/` へ追加する。

共有トークン（`src/styles/global.css` / `src/styles/design-system/tokens.css`）は変更しないため、`SHARED_TOKEN_IMAGE_SUBJECTS`（14 件 × light/dark = 28 枚）の撮り直しは発生しない。

## 4. フェーズ構成

| Phase | 内容 | このフェーズで潰すもの |
|---|---|---|
| **1. レーン構築 + login-01** | `src/blocks/` 新設、§3-2 の 3 箇所拡張、§3-1 のマトリクス化、§3-3 のスキーマ新設。**login-01 の 1 件だけ**を端から端まで通す | 機構の設計ミス。1 件で見つければ修正コストは 1 件分 |
| **2. 残り 25 件** | 認証系 9 件 + sidebar 16 件。新規 npm 依存ゼロ | 1 件では出ない衝突（`app-sidebar.tsx` が 15 件で同名）、preview 54 枚とカテゴリ分類の運用コスト |
| **3a. dashboard-01（10 ファイル）** | 上流 dashboard-01 から `data-table.tsx` を除いた 10 ファイルを移植。`registry:file`（`data.json`）対応の実装を含む | **新規 npm 依存ゼロ**。`registry:file` を扱う経路 |
| **3b. `dashboard-table`（自作）** | `data-table` 相当を既存部品で自作した block を新設。設計 §1「移植のみ」の例外第 1 号 | 自作 block の来歴スキーマ分岐。§3-6 参照 |

### 実装体制

| Phase | worker 数 | 理由 |
|---|---|---|
| 1 | 1 | `add-component.mjs` / `check-completeness.mjs` / `provenance.json` スキーマは互いに噛み合っていないと意味がなく、分割不能 |
| 2 | 1（直列） | §5-2 参照 |
| 3 | 1 | 依存追加の判断を含むため独立 |

委任仕様には literal 実行前提の記述、「指示と実態が矛盾したら止めて報告せよ」、レビューサイクルの実施者（委譲先で完結）と上限ラウンド数を明記する。

### 3-6. Phase 3 の分割と自作 block の新設（2026-08-21 決定）

#### 依存 6 件は 1 ファイルに隔離されている（実測）

当初 Phase 3 は「dashboard-01 を移植し、npm 依存 6 件の採否を判断する」としていた。実測すると、その 6 件は **`data-table.tsx` 1 ファイルにすべて集中**している。

| ファイル | サイズ | 未導入の npm 依存 |
|---|---|---|
| `data-table.tsx` | 31KB | `@dnd-kit/core` / `@dnd-kit/modifiers` / `@dnd-kit/sortable` / `@dnd-kit/utilities` / `@tanstack/react-table` / `zod` |
| `chart-area-interactive.tsx` | 11KB | `recharts`（導入済み） |
| 他 8 ファイル + `data.json` | 1〜12KB | なし |

`data-table.tsx` を import するのは `page.tsx` のみで、page は §1 の決定により配布しない。**除外しても他ファイルは壊れない。**

よって「6 依存を受け入れるか、dashboard-01 を諦めるか」の二択ではなく、3a（依存ゼロで移植）と 3b（自作で同等機能）に分割する。

#### 3a — `data-table.tsx` を配布対象から除外する

`registry:page` と同じ扱いで、来歴には `dropped: true` として記録する。落とした理由が「Next 規約だから」ではなく「npm 依存 6 件を持ち込むから」なので、`modified` にその旨を書き分ける。

#### 3b — `data-table` 相当を既存部品で自作する

上流 `data-table.tsx` の機能内訳を実測した。

| 機能 | 上流での箇所数 | 自作での実装 |
|---|---|---|
| drawer（行の詳細パネル） | 24 | `@elchika/drawer` |
| **DnD（行の並べ替え）** | 11 | **実装しない**（2026-08-21 ユーザー判断） |
| zod スキーマ | 8 | TypeScript の型 |
| chart（詳細パネル内） | 7 | `@elchika/chart` |
| フィルタ | 3 | React state + `Array.filter` |
| ソート / 列の表示切替 / 行選択 | 各 2 | React state + `@elchika/dropdown-menu` / `@elchika/checkbox` |

上流が使う `@/components/ui/*` は 12 件（badge / button / chart / checkbox / drawer / dropdown-menu / input / label / select / separator / table / tabs）で、**すべて当リポジトリの registry に存在する**（不足 0 件を実測）。

`@tanstack/react-table` が担っているのはソート 2・フィルタ 3・列切替 2・行選択 2 箇所で、React state と `Array.sort` / `Array.filter` で書ける薄さである。汎用テーブルライブラリの機能のごく一部しか使っていない。

**DnD だけは自前実装が重い。** キーボード操作・タッチ・スクリーンリーダー対応を恒常的に保守することになり、「自前実装は最後の手段」に反する。行の並べ替えが実際に必要になった時点で `@dnd-kit` の採否を再判断する（YAGNI）。

#### item 名は上流と別にする

自作版を `dashboard-01` の名前で配ると、上流の dashboard-01 を見た利用者が `data-table` を期待して導入し、中身が違って混乱する。§1 の「item 名は上流と同名」の根拠（上流のドキュメントから名前で辿れる）が、この場合は逆に働く。

- `dashboard-01` — 上流由来の 10 ファイル（`data-table` を含まない）
- **`dashboard-table`** — 自作の data-table block（上流に対応物を持たない）

#### 自作 block は §1 の例外である — 来歴スキーマの分岐が要る

§1 は「上流 shadcn base-nova からの移植（自作しない）」を決定しており、その根拠は「`provenance.json` の既存スキーマが移植品前提で作られており、自作はスキーマ分岐という恒常コストを生む」ことだった。**3b はこの決定の例外第 1 号であり、そのコストを払う判断である。**

実測すると、現行の `BLOCK_PROVENANCE_SPEC` は自作 block を通さない。

| 必須キー | 自作品での状態 |
|---|---|
| `registryUrl` | 上流 URL が存在しない |
| `registryContentSha256` | 上流配信物が存在しない |
| `files[].upstreamPathSha` | 上流 commit が存在しない |

`origin` を分岐の軸として、移植品（`shadcn/ui registry`）と自作品（例: `elchika-inc original`）で要求キーを変える。自作品には `generatedContentSha256`・`license`・`modified`・`files[].path` を要求し、上流由来のキーは要求しない。**逆に、自作品に上流由来のキーがあれば fail-closed で弾く**（移植品を誤って自作として記録することを防ぐ）。

これは「1 件では動くが別種で壊れる」型の 3 例目にあたる（1 件目→2 件目、単一ファイル→複数ファイル、移植品→自作品）。検査スキーマの分岐を先に実装し、fixture で RED/GREEN を確認してから block を作る。

## 5. 検討して採らなかった案

### 5-1. `src/components/ui/` へ既存コンポーネントと同列に配置する

**不採用。物理的に成立しない。** 上流から受け取る 103 ファイルのうち、ファイル名 26 種の **16 種が衝突**する（実測 §6-3）。`page.tsx` は 27 件全部が同名、`login-form.tsx` は login-01〜05 が同名。

`page.tsx` を配布しない決定（§1）は**この衝突を解消しない**。page を除いても `app-sidebar.tsx` が 15 件、`nav-main.tsx` と `nav-user.tsx` が各 7 件で衝突するため、per-block ディレクトリは配布分 76 ファイルだけを見ても依然として必須である。

プレフィックスで回避しても `login-01-login-form.tsx` のような名前が 61 件の部品リストに 27 件混ざり、`component-categories.mjs` の分類も破綻する。

### 5-2. Phase 2 を 2 worker で並列化する

**不採用。書き込み先が独立していない。** 25 件は互いに完全独立だが、`registry.json` / `provenance.json` / `component-categories.mjs` の 3 ファイルはいずれも単一の台帳であり、worktree で隔離してもマージ時に 3 ファイル全部が衝突する。25 件分の JSON 差分を手で解決するのは直列より高くつく。

registry を per-item ファイルへ分割すれば並列化できるが、今回 1 回のために台帳の構造を変えるのは割に合わない（YAGNI）。

### 5-3. `src/blocks/` へ置くがゲートは拡張しない

**不採用。** 最も安いが、ゲートの掛からないレーンができる。当リポジトリは `check-all.mjs` が 7 検査を fail-closed で並べ、`add-component.mjs` は分類不能なパスを見たら「復元せず停止」する設計思想を持つ。そこへ未検査の 27 件・配布 76 ファイルを足すのは思想への逆行であり、この機構拡張こそが block 導入コストの本体である。

## 6. 実測

すべて 2026-08-17 に実施。取得物は scratchpad に保存。

### 6-1. base-nova の block 実在確認

`https://ui.shadcn.com/r/styles/base-nova/<name>.json` を取得し、`type === "registry:block"` を確認した。

- 実在: login-01〜05、signup-01〜05、sidebar-01〜16、dashboard-01 の **27 件**
- 不在（404）: login-06、otp-01/02、forgot-password-01、authentication-01、dashboard-02/03、sidebar-17
- 公開 index（`https://ui.shadcn.com/r/index.json`）には `registry:ui` 63 件のみが載り、block は含まれない。個別 URL でのみ取得できる

### 6-2. 依存の充足

27 件の `registryDependencies` を既存 registry item と突き合わせた結果、**宣言の不足は 0 件**。

**訂正（2026-08-18）— この節は当初「既存 61 コンポーネントで全 block をまかなえる」と結論していたが、それは成立しない。**

測ったのは `registryDependencies` の**宣言**だけで、配布ファイルの**中身**を読んでいなかった。実測すると **18 件の block** が registry に存在しない `@/app/(create)/components/icon-placeholder` を import する。

対象: dashboard-01 / login-05 / signup-05 / sidebar-01〜13 / sidebar-15 / sidebar-16。

素通しで移植できるのは **8 件**（login-02, login-03, login-04, signup-01〜04, sidebar-14）に限られる。`icon-placeholder` の扱い（自前で用意する / 上流の実体を移植する / 該当 18 件を対象から外す）は Phase 2 の着手前に決める。

この誤りは Task 5 の実装中に worker が検出した。司令塔側の 1 回目の追試は検査パターンを `@/registry/base-nova/ui/` に限定していたため 0 件と出たが、実際の import パスは `@/app/(create)/components/` で、範囲を広げて測り直すと 18 件で一致した。

npm 依存の不足は **dashboard-01 のみ**で 6 件（`@dnd-kit/core` / `@dnd-kit/modifiers` / `@dnd-kit/sortable` / `@dnd-kit/utilities` / `@tanstack/react-table` / `zod`）。他 26 件は新規依存ゼロ。

### 6-3. ファイル名の衝突

上流から受け取るファイル総数 **103 個**（うち配布するのは `page.tsx` 27 個を除いた **76 個**）、ファイル名 26 種のうち **16 種が衝突**。

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

### 6-5. サンプル文言の `Acme Inc.`

27 件のうち **14 件**（dashboard-01 / login-02〜05 / signup-02,03,05 / sidebar-07,08,09,10,15,16）が、サンプルデータに `Acme Inc.` `Acme Inc` `Acme Corp.` を含む。

**そのまま残す。** AGENTS.md の禁止は elchika 自身の名乗りに `inc.` を用いないことであり（法人化までの暫定措置）、架空の第三者名を示すサンプル文言はこれに当たらない。UI 文言は上流の英語のままとする決定（§1）とも整合する。

リポジトリ内に `inc.` を検出する機械 probe は存在しないため（実測）、CI が偽陽性で赤くなることもない。

### 6-6. login-01 の page.tsx の中身

配布しない判断の影響範囲を測るため中身を確認した。レイアウト枠のみで、308 文字。

```tsx
<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
  <div className="w-full max-w-sm"><LoginForm /></div>
</div>
```

この枠は preview 側へ移設することで見た目を再現できる（§3-4）。

## 7. DoneCriteria

1. `npm run check:all` の 7 検査すべてが exit 0 であること。加えて、**拡張した各ゲートについて 1 つずつ意図的な違反を仕込み、対応する検査が赤くなることを確認する**（緑であることは検査が働いている証拠にならない）。

   | 仕込む違反 | 赤くなるべき検査 |
   |---|---|
   | block の tsx に生の色指定を 1 箇所入れる | standards |
   | block の preview astro を 1 枚消す | completeness |
   | block の preview tsx で存在しない export を import する | **`npm run typecheck`**（訂正: 当初 preview render と書いていたが、実測で preview render・completeness とも exit 0。型解決の誤りは検査スクリプトでは捕まらない） |
   | block の provenance から `files[]` の 1 エントリを消す | completeness |

2. `provenance.json` の `blocks` に 27 件分の来歴があり、**上流から受け取った 103 ファイルすべて**が `files[]` に載っていること。配布する 76 件は `generatedContentSha256` を持ち、配布しない 27 件の `page.tsx` は `dropped: true` と `upstreamPathSha` を持つ（§3-3）
3. 全 block の preview が light / dark の 2 ページで存在し、dark 側ルート要素が `class="dark"` を持つこと
4. **リポジトリ外の別プロジェクトへ実際に `shadcn add` して描画されること** — React + Vite の scratch アプリで `@elchika/login-01` を導入し、ビルドと描画まで到達する
5. 配布 registry item に法務ファイル（`LICENSE` / `THIRD_PARTY_LICENSES` / トークン 3 ファイル）が同梱され、`check-distribution` を通ること

DoneCriteria 4 は、block がリポジトリ内の検査では測れない失敗モード（同名ファイルの落下先、複数 block を同時導入したときの衝突）を持つため必須とする。
