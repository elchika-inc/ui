# elchika-inc/ui — 基盤設計（サブプロジェクト #1）

- **作成日**: 2026-07-31
- **対象**: `elchika-inc/ui`（新規・未作成）のリポジトリ骨格
- **発端**: Claude Design（claude.ai/design）へ実部品を投入したい。standards はドキュメント専用リポジトリでコンポーネントを持たないため、トークンのみの同期に留まっていた（2026-07-31 実施済み）。

この文書はサブプロジェクト #1 のみを対象とする。#2 以降の spec は `elchika-inc/ui` 作成後、そのリポジトリ側に置く（DOCS_OPS §3 の二重保存先禁止に従い、標準側へ複製しない）。

## 1. 決定事項

| 項目 | 決定 | 根拠 |
|---|---|---|
| リポジトリ | `elchika-inc/ui`（public・新規作成） | 利用者は両 org のプロダクト（elchika-inc/manako 等、naoto24kawa/tools 等） |
| 基底層 | Base UI `@base-ui/react`（MIT） | 実測 §7-1 |
| コンポーネント生成 | shadcn CLI v4 の `--base base` | 実測 §7-2 |
| 配布 | **shadcn custom registry 単独**（静的 JSON）。npm publish しない | DESIGN.md §2 のコピー所有モデルと整合。PRODUCT_PLAYBOOK §15 の「公開は取り消せない」制約を負わない |
| ビルド | **`npm run build` 一発で `exports` が指すものがすべて揃う**（publish はしない）| 実測 §7-4。ビルドがないと design-sync が synth-entry モードになり props 契約が失われる。design-sync は `exports['.']` を解決してから無ければ `<pm> run build` を試し、それでも無ければ人間に build コマンドを尋ねて止まるため、**標準の `build` が `lib/` を作らないと fresh checkout から自動で辿れない** |
| docs サイト | Astro → Cloudflare。カタログ・ルールページ・隔離プレビュー・**registry ホストを兼ねる** | PRODUCT_PLAYBOOK §2-3（静的化優先）、ARCHITECTURE.md（Cloudflare ファースト）。デプロイ先が 1 つで済む |
| 描画確認 | docs サイトの隔離プレビュー。**Storybook を置かない** | DESIGN.md §7 の SHOULD からの逸脱。**#1 の時点で** risk-registry に記録する（#6 へ延期すると #1 完了時点で受容記録が存在しない状態になる）|
| Claude Design 連携 | design-sync を package shape で実行 | 実測 §7-3 |

参考にした先行実装は `interactive-inc/jobantenna-ui`（public）。Base UI + shadcn registry + 自前の隔離プレビューという構成が本設計と同型であり、実測の検体としても使用した。

## 2. スコープ

### #1 が完成させること

Button 1 件で経路を端から端まで通す。骨格だけ作って未検証のまま #2 の量産に入ると、50 件書いた後にツールチェーンの不備が露見するため、1 件で実証してから量産へ進む。

生成 → トークン適用 → Astro での描画 → ビルド（dist + `.d.ts`）→ registry JSON 出力 → 法務ファイル同梱 → CI。

### #1 がやらないこと

- 約 50 件のコンポーネント実装（#2）
- docs サイトの本格構築（#3。カタログ・ルールページ・ナビゲーション。**隔離プレビューの仕組み自体は #1 で作る**）
- registry の公開デプロイと利用側検証（#4）
- Claude Design への同期（#5）
- standards 側のルール更新（#6）
- 既存 `@tools/ui` の移行（#7）

## 3. 全体の分割と順序

| # | サブプロジェクト | 依存 |
|---|---|---|
| 1 | リポジトリ骨格（本書） | — |
| 2 | コンポーネント実装（約 50 件）。**各コンポーネントは #1 が作った隔離プレビューの仕組みを使い、1 件ごとに `src/previews/<name>.tsx` と light / dark のルートを追加して実ブラウザで検証してからマージする** | 1 |
| 3 | docs サイト（カタログ・ルールページ・ナビゲーション・配信ドメイン確定）。隔離プレビューは #1 で作り #2 で各件に広げているため、#3 はその上のカタログ層 | 2 |
| 4 | registry 公開（`shadcn build` ＋ Cloudflare デプロイ ＋ 利用側での実 install 検証） | 2, 3 |
| 5 | Claude Design 同期 | 3 |
| 6 | standards 側ルール更新 | 2 |
| 7 | 既存 `@tools/ui` の移行 | 4 |

#1 を最初に置く理由は PRODUCT_PLAYBOOK §15 にある。来歴の記録は「混入した時点で手遅れ」であり後付けが効かない。コンポーネントを 1 つでも書く前に、来歴を申告する仕組み（PR テンプレート）と法務ファイルを用意する必要がある。

**この制約は #1 の内部順序も縛る。** scaffold（`shadcn init`）はそれ自体が `button.tsx` を生成するため、法務ファイルと来歴の仕組みは **scaffold より前**に置く。scaffold を先に走らせて後から来歴を足すと、最初のコンポーネントが来歴なしでコミットされる。

## 4. アーキテクチャ

### 4.1 リポジトリ構成

単一パッケージとする。トークンを別パッケージに分割しない（`@tools/ui` と `@tools/design-tokens` の 2 分割は、利用側に 2 つ導入させる手間に見合わない）。

構成は `shadcn init --template astro` が生成する形をそのまま使う（実測 §7-6）。Astro サイトはリポジトリのルートに置かれ、`docs/` サブディレクトリには入らない。

```
elchika-inc/ui/
├── src/
│   ├── components/ui/      # shadcn CLI が生成する部品
│   ├── lib/utils.ts        # cn() 等
│   ├── previews/           # 隔離プレビューの中身
│   ├── pages/              # Astro のルート（カタログ・隔離プレビュー）
│   ├── layouts/
│   └── styles/global.css   # トークン（standards からの取り込み）
├── public/r/               # shadcn build の出力＝registry 配信元
├── scripts/                # standards 適合検知・ライセンス取得・来歴生成
├── registry.json           # registry の定義
├── components.json         # shadcn の設定
├── dist/                   # Astro の出力（既定値。触らない）
└── lib/                    # ライブラリビルドの出力（design-sync 用。publish しない）
```

**出力先を 2 つに分ける。** Astro の `outDir` 既定値が `dist/` であるため、ライブラリビルドの出力先は `lib/` とする。両者が同じディレクトリを奪い合うと、どちらかのビルドが他方の成果物を消す。

### 4.2 配布経路

利用側プロダクトは `components.json` に次を書き、`npx shadcn add @elchika/button` でソースを自リポジトリへコピーする。

```json
{ "registries": { "@elchika": "https://<docs-domain>/r/{name}.json" } }
```

コピーされたコードは利用側の所有物であり自由に改変できる。これが DESIGN.md §2 のコピー所有モデルと整合する点である。更新は再度 `add` する形で、自動追随はしない。

### 4.3 トークンの取り込み

standards の `templates/design-tokens.css` を正本とし、**`src/styles/global.css`**（§4.1 の構成。scaffold が生成する既定の位置）へコピーして取り込む。standards は npm パッケージではないため依存にできない。また standards は private リポジトリのため `raw.githubusercontent.com` からは取得できない。ローカル clone から取る。取り込み元の `standards_version` を `AGENTS.md` に記録し、更新時に追随できるようにする。

ブランドノブ（`--primary` / `--radius` / `--font-heading`）を上書きする場合は、DESIGN.md §3 の規定に従い `--primary` × `--primary-foreground` のコントラスト 4.5:1 を実計算で確認する。

### 4.4 ビルド

design-sync が正確な props 契約を読めるようにするためにビルドを持つ。publish はしないため、`package.json` は `private: true` のままでよい。出力先は `lib/`（§4.1 の理由により `dist/` は Astro が使う）。

**`npm run build` は複合スクリプトにする。** `exports['.']` が `./lib/index.js` を指す以上、標準のビルドがそれを作らないと `exports` マップが壊れた状態で配布される。design-sync も fresh checkout で `exports` を解決できず、`<pm> run build` を試し、それでも無ければ人間へ build コマンドを尋ねて停止する。`build` が「ライブラリ → registry → サイト」を順に実行すれば、fresh checkout から `npm ci && npm run build` だけで一貫した成果物が揃う。個別に走らせたいときのために `build:lib` / `build:site` / `registry:build` も残す（CI は失敗箇所を特定するため個別ステップで実行する）。

**props 型を明示的に export する。** 部品が `ButtonPrimitive.Props & VariantProps<typeof buttonVariants>` のようにインライン型で props を受けている場合、ビルドしても名前付きの props 型が出力に現れない。design-sync が読むのは `<Name>Props` であるため、各部品は `export type <Name>Props` を明示的に持つ。

出力は ESM のみとする。CJS を出さない理由は、PRODUCT_PLAYBOOK §15 が「ESM / CJS の両方を公開している場合は両方の経路を叩く。`exports` マップの誤りは片方でしか壊れないことが多い」と警告している失敗面を、最初から作らないため。利用先は React 19 前提であり ESM で足りる。

## 5. PRODUCT_PLAYBOOK §15 への準拠

registry 配布は npm レジストリへの公開ではないため §15 の「取り消せない公開」に関する制約は負わない。ただし**上流コードの再配布**である以上、帰属と来歴の要件は残る。

- `LICENSE`（MIT）
- `THIRD_PARTY_LICENSES` — **上流の実ファイルを取得して機械的にコピーする**。§15 は「法的逐語文は LLM に書かせない（生成させると数語が書き換わり、エラーが出ないため検出できない）」と規定している。対象は実際に混入したもののみ（shadcn/ui、Base UI、sonner 等。いずれも MIT）
- **来歴**: コンポーネントごとの出典を機械可読な形で `provenance.json` に残す。記録するのは、実際に生成器として動いた CLI の exact version・配信元 URL・受け取った内容の SHA-256・元テンプレートのパスと commit・取得日・ライセンス。**生成スクリプトのヘッダに実値を固定しない** — 値は実行時に解決するものであり、ヘッダへ書くと実態とずれても検出できない（§15 が「生成スクリプトを介する場合はヘッダに上流コミットを固定する」としているのは、スクリプトが上流を固定的に参照する形式の場合。本計画は registry を実行時に叩くため、記録先を機械可読ファイルにする）
- **PR テンプレートに来歴チェック欄を新設する**。§15 の「申告欄を事前に埋めない」に従い**空欄で用意**し、「自作（他プロジェクトからのコピーではない）」と「AI が生成」が同時に真になりうることを複数選択可で表現する
- `CONTRIBUTING.md` / `SECURITY.md` / Issue テンプレートの `config.yml`（脆弱性を公開 Issue に書かせない導線）

standards の `templates/.github/` と `templates/SECURITY.md` を基に具体化する。ただし `templates/.github/PULL_REQUEST_TEMPLATE.md` の「エージェント実装の来歴」欄は実装計画と担当識別子を問うものであり、§15 が要求する移植コードの出典・AI 生成の申告とは別物である。この欠落は standards 側にも存在するため #6 で差し戻す。

## 6. CI とブランチ運用

ブランチ運用は DOCS_OPS §5 を正本とする。public リポジトリのため branch protection / ruleset が利用できる（standards が private plan で利用できず MUST 運用で代替しているのとは異なる）。

CI で回すもの:

- biome check（standards の `templates/biome.json` を基にする）
- 型検査
- テスト
- Astro サイトのビルド
- **配布物の中身の検証** — 法務ファイルの同梱漏れを機械検知に落とす

最後の項目は、advisory なルールではなく sensor として持つ。

## 7. 実測記録

本設計が前提とする事実は、記憶や文書引用ではなく 2026-07-31 に実際に実行して確認した。

1. **ライブラリのバージョンとライセンス**（`npm view`）: `@base-ui/react` 1.6.0 / MIT、`shadcn` 4.16.0 / MIT、`sonner` 2.0.7 / MIT。
2. **shadcn CLI のフラグ**（`npx shadcn@latest init --help`）: `-b, --base <base>` の受け付け値は `base` / `radix` / `aria` であり、Base UI は **`--base base`**。`-t, --template <template>` は `next, start, vite, react-router, laravel, astro` を受け付け、**Astro は公式サポート**。`-p, --preset` の受け付け値は §7-7 に記載する（`--help` の記述から `base-nova` のような複合名を推測したが、実測では拒否された）。
3. **design-sync が本構成を扱えること**: `interactive-inc/jobantenna-ui`（Base UI + registry + `private: true` + dist なし）に対し `package-build.mjs` を実行し **exit 0**。`src/components/ui/` の 60 ファイルから **329 コンポーネント**を検出し、プレビューカード 329 件と検証アンカーを生成した。
4. **ビルドが無い場合の代償**: 同実行は `.pkg-entry.mjs` を生成（synth-entry モード）し、生成された `Button.d.ts` は `interface ButtonProps { [key: string]: unknown }` となった。**props 契約が失われる**。design-sync の skill は `.d.ts` を「design agent がコードを書く相手の API 契約」と定義しており、誤った `.d.ts` は API の誤用を全体へ波及させる。§1 でビルドを持つと決めたのはこの実測による。
5. **Tailwind v4 系 DS の共通問題**: 上記検体でも standards でも、`_ds_bundle.css` に残る npm ベア指定子の `@import`（`tailwindcss` 等）が `[CSS_IMPORT_MISSING]` で検証を落とす。ブラウザがベア指定子を解決できないため。standards 側で作成した「ベア指定子の `@import` 行のみを機械的にコメント化する」導出処理を本リポジトリにも持ち込む。

6. **scaffold の実出力**: `npx shadcn@latest init --template astro --base base --preset nova -y --no-monorepo` を実行し、Astro 7 / React 19 / `@astrojs/react` の構成が**リポジトリのルートに**生成されることを確認した。同時に `src/components/ui/button.tsx`・`src/lib/utils.ts`・`src/styles/global.css`・`components.json`（`style: "base-nova"`）が作られる。`engines.node` は `>=22.12.0`。
7. **プリセット名**: `--preset` の受け付け値は `nova` / `vega` / `maia` / `lyra` / `mira` / `luma` / `sera` / `rhea`（`base-nova` は不正値として拒否された）。**Nova は Lucide / Geist** であり、DESIGN.md §2 のフォント規定と §5 のアイコン規定の双方に一致する。
8. **生成物が standards 非準拠であること**: 生成された `button.tsx` は `focus-visible:ring-ring/50` を使う。DESIGN.md §5 が「`/50` 等の透明度合成は light 背景で非テキストコントラスト 3:1（WCAG 1.4.11）を割るため使わない」と明示的に禁じているパターンである。加えて `rounded-[min(var(--radius-md),10px)]` という arbitrary value を含む（§5 の許可済み例外は `ring-[3px]` と dark variant 宣言のみ）。**生成した部品はそのままでは standards に適合しない**ため、生成後の適合修正と、その機械検知が必要になる。
9. **scaffold のツーリングが standards と衝突すること**: scaffold は eslint + prettier を導入する。standards は `templates/biome.json` を配っており、lint を二重に持たないため差し替えが必要。

## 8. DoneCriteria

すべて観測可能な条件として記述する。判定は実行結果で行う。

1. `npx shadcn@latest init --template astro --base base --preset nova` が成功し `components.json` の `style` が `base-nova` になる
2. `src/components/ui/button.tsx` が `@base-ui/react` を import し、生成直後に検出された standards 違反（`ring-ring/50` と arbitrary value）が **0 件**になっている
3. `src/styles/global.css` の `:root` が、取り込み元である standards の `templates/design-tokens.css` の `:root` と**同一**である（トークン名の集合と値が一致する）。件数を固定条件にしない — standards が正当にトークンを増減したとき、正しくコピーした実装が落ちるうえ、名前を差し替えて総数を保った誤実装は通ってしまう。加えて和文フォールバック（`Hiragino Sans`）・`--success`・`prefers-reduced-motion` を含む
4. ライブラリビルドの出力に `lib/index.d.ts` があり、**`ButtonProps` という名前の型が export され、その定義に `variant` が含まれる**（実測 §7-4 の props 消失を回避できたことの証明。`buttonVariants` の存在では代替できない）
5. `shadcn build` の出力に対し、**ローカルで配信した URL** から `npx shadcn add` が成功し、リポジトリ外に作った別プロジェクトへ Button のソースがコピーされ、そのコピーが standards 適合済みである
6. Astro のビルド出力に Button の隔離プレビューが light 用と dark 用の**2 つの静的ページ**として存在し、dark 側のルート要素に `class="dark"` が含まれる
7. `THIRD_PARTY_LICENSES` に shadcn / Base UI の**上流実ファイルの内容**が含まれ（生成物でないこと）、かつ **registry の配布物に同梱**されている
8. コンポーネントごとの来歴が機械可読な形で記録されている。**§5 が要求する項目をすべて含む**こと（実行した CLI の exact version・配信元 URL・受け取った内容の SHA-256・元テンプレートのパスと commit・取得日・ライセンス）。一部だけでは §15 の追跡目的を満たさない
9. PR テンプレートに §15 準拠の来歴チェック欄があり、**選択肢が空欄で**用意されている
10. `.docs/` が **DOCS_OPS §3 の 4 層**（`PROJECT_GOAL.md` / `actions/` / `plans/` / `risk-registry.md`）を備え、**Git の追跡対象として**存在する。ディレクトリの存在では代替しない（Git は空ディレクトリを記録しないため、clone した人には存在しない）。受容エントリは §3 の書式（`status: accepted` + `reason` + `anchor`）に従う
11. `AGENTS.md` の `branch_policy` が **`protected`** で、GitHub 側の ruleset が実際に有効になっている
12. CI が緑で、その CI が lint・型検査・standards 適合検知・**テスト**・両ビルド・registry 出力・**法務ファイルの同梱検査**を実行している

## 9. リスクと未解決事項

- **Storybook を置かない逸脱**: DESIGN.md §7 は Storybook を SHOULD としている。docs サイトの隔離プレビューで代替するため、**#1 の時点で** `.docs/risk-registry.md` に理由を記録する。design-sync は storybook shape（実レンダリングとのスクリーンショット照合）ではなく package shape（自前プレビュー＋絶対評価）になり、検証の強さは一段下がる。
- **Base UI 採用は DESIGN.md §2 の表からの乗り換え**: 現行表は shadcn/ui を Radix UI ベースとして記載している。DESIGN.md:42 の規定に従い、**#1 の時点で** `.docs/risk-registry.md` に理由を残す。
- **コンポーネント数の見積もり**: 検体では 60 ファイルから 329 エクスポートが検出された。「約 50 件」はファイル単位の数であり、design-sync 上のカード数はその数倍になる。#5 の同期作業量はこの前提で見積もる。
- **法務の同梱範囲（確定・2026-07-31）**: `THIRD_PARTY_LICENSES` に入れるのは**移植元だけ**（shadcn/ui・Base UI）。runtime dependency（`class-variance-authority` / `clsx` / `tailwind-merge` 等）は列挙しない。判断根拠は、**本リポジトリを第三者へ再配布する意図が無い**こと（オーナー確認済み）と、registry 配布が「利用側がソースをコピーして所有し、依存は自分で install する」方式であること。PRODUCT_PLAYBOOK §15 が「配布物そのものに同梱する」と求めているのは移植・派生コードの**帰属**であり、依存ツリー全体のライセンス列挙ではない。ただしリポジトリは public であり、意図と無関係に第三者が取得できる状態にはある。そのため `LICENSE`（MIT・`elchika-inc` 名義）と移植元の `THIRD_PARTY_LICENSES` を置くこと自体は必須で、これは #1 で行う。**この範囲を広げるのは、npm publish するか第三者への再配布を始めるときに再評価する。**

- **registry のホスト先ドメイン未定**: docs サイトのドメインが registry の配信 URL になるため、#3 で確定する。利用側の `components.json` に書かれる値であり、後から変更すると利用側すべての修正が必要になる。**したがって #1 では利用者向けの registry URL を一切公開しない** — README に暫定 URL を書かず、`public/r/` の生成物もリポジトリへコミットしない（gitignore する）。public リポジトリへ生成物を置いて README で案内すると、公開境界が実質 #1 になり、#3 のドメイン確定時に移行負債を負う。#1 の DoneCriteria 5 が要求する利用側検証は**ローカル配信**に対して行う。
- **standards の PR テンプレートが §15 に追いついていない**: rev.46 で §15 が追加されたが `templates/.github/PULL_REQUEST_TEMPLATE.md` に来歴欄がない。#6 で差し戻す。
