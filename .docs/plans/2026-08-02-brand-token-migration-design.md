# ブランドトークン移行と alpha 配色契約の旧検討記録

> **Status: superseded.** この文書は v1.8 採用前の検討履歴であり、以下の token 値、consumer interface、chart 方針、evidence coverage、DoneCriteria は現行契約ではない。現行の正本は `.docs/plans/2026-08-02-brand-token-migration-plan.md` の Global Constraints、Interface consistency、Task 4〜10 と `src/styles/design-system/README.md` である。既存の `RISK-013` は Clipboard API の受容だけを指し、chart 用 risk として再利用しない。

- **作成日**: 2026-08-02
- **対象**: `elchika-inc/ui` の token、実 consumer、registry 配布、contrast sensor、実ブラウザ証跡
- **基点**: `main` の `3eaf9b73b2a93a8ec9371e410638e0757f1ed307`

## 1. 目的

利用者が提示したブランド色を既存の shadcn / Base UI semantic token 語彙へ移し、リポジトリ内の表示、registry 利用者へ届く token、実 consumer のコントラスト契約を同時に更新する。

この作業で検出した未達は、新しい token 値だけが原因ではない。現行実装にも次の構造的欠陥がある。

- solid 前提の `--primary` を `bg-primary/80` にすると、`--primary-foreground` との比が両 theme で 4.5:1 を割る。
- `text-destructive/80` / `/90` は、solid の `--destructive` が持つコントラストを前景 alpha で失う。
- `bg-destructive/10` / `/20` / `/30` の上に同じ `--destructive` を文字として置くと、背景を濃くする hover ほど文字が読みにくくなる。
- light Tabs の `text-foreground/60` は現行 token でも `bg-muted` 上 4.2692:1、`bg-background` 上 4.3779:1 で未達である。
- `--input` を dark で intrinsic alpha から opaque 色へ移すと、Select だけが `dark:bg-input`、他 control が `dark:bg-input/30` という既存不整合が顕在化する。

根本原因は、solid 用に決めた semantic token へ consumer 側で alpha を掛け、別の配色契約として再利用していることにある。値を極端に動かして帳尻を合わせず、solid、hover、subtle foreground を明示的な契約へ分離する。

## 2. スコープ

### 2.1 含めるもの

- light / dark のブランド token 置換
- `--primary-hover` と `--destructive-subtle-foreground` の新設
- `--muted-foreground` の実 consumer 最悪面に対する調整
- sidebar token の既存 semantic token への alias 化
- chart palette を変更しない判断の risk 記録
- primary / destructive / Tabs / Select / overlay の consumer 正規化
- `dialog` / `drawer` の `bg-black/10` から `bg-overlay` への統一
- gamma-encoded sRGB alpha 合成を含む strict contrast sensor
- consumer ごとの `text-aa` / `nontext-ui` / `disabled-exempt` / `decorative` gate
- shared token 変更で全履歴を列挙し続けない evidence coverage
- `registry.json`、`public/r`、外部 fresh install probe までの配布検証
- catalog、対象 component、overlay、disabled control の実ブラウザ証跡
- `.docs/PROJECT_GOAL.md` と README の token 契約をブランド移行後の実態へ更新

### 2.2 含めないもの

- chart palette のブランド化
- `--overlay` の色または alpha の変更
- 新しい UI component の追加
- npm publish またはデプロイ
- standards リポジトリの変更
- disabled text を WCAG 1.4.3 の text AA 成功条件へ含めること

## 3. token 契約

### 3.1 新規 token

| token | light | dark | 契約 |
|---|---|---|---|
| `--primary-hover` | `oklch(0.3834 0.1448 265.84)` | `oklch(0.7513 0.1107 267.16)` | solid primary の interactive hover。利用者の元案 `blue-700` / `rgb(143,172,245)` を写像する |
| `--destructive-subtle-foreground` | `oklch(0.4621 0.1633 24.39)` | `oklch(0.8218 0.1004 16.40)` | `bg-destructive/10` / `/20` / `/30` 上と、淡い destructive text 用の opaque foreground |

`--destructive-foreground` は solid destructive 背景上の文字専用のまま維持する。`--destructive-subtle-foreground` は subtle surface 上の文字専用であり、両者を alias にしない。

### 3.2 調整する token

| token | light | dark | 根拠 |
|---|---|---|---|
| `--muted-foreground` | `oklch(0.5131 0.0135 264.45)` = `rgb(99,103,111)` | `oklch(0.7047 0.0188 264.45)` = `rgb(154,160,172)` | `input/30`、`primary/5` / `/10`、`muted/50` の active text 最悪面で 4.5:1 を超え、foreground との差を残す |
| `--destructive` | `oklch(0.5650 0.1774 22.67)` | `oklch(0.7081 0.1528 19.78)` | light は白文字を 4.5:1 以上に保てる `rgb(201,60,66)`、dark は利用者案 `rgb(241,117,121)` |
| `--input` | `oklch(0.8381 0.0077 260.73)` | `oklch(0.4312 0.0244 267.00)` | opaque strong input 色を slash alpha で surface 化する。dark の intrinsic 15% alpha は維持しない |

`--muted-foreground` の検算で採用した最悪値は次のとおり。

| theme | consumer | contrast |
|---|---|---:|
| light | `muted-foreground` on `primary/5` over muted | 4.5759 |
| light | `muted-foreground` on muted | 4.8874 |
| light | `muted-foreground` on `input/30` over card | 4.9354 |
| dark | `muted-foreground` on `input/30` over muted | 4.6495 |
| dark | `muted-foreground` on `primary/10` over muted | 4.7017 |
| dark | `muted-foreground` on muted | 5.4720 |

`bg-input/50` / `/80` は Input、Textarea、NativeSelect、InputGroup の disabled state で使う。WCAG 2.2 1.4.3 の text AA 対象外だが、source contract と実ブラウザ証跡は残す。Button / NativeSelect の active `dark:hover:bg-input/50` に載る文字は `foreground` であり、Switch の `dark:data-unchecked:bg-input/80` には文字がない。

### 3.3 置換する既存 token

`background`、`foreground`、`card`、`popover`、`primary`、`secondary`、`muted`、`accent`、`success`、`warning`、`border`、`ring` は利用者の色意図を既存語彙へ写像した候補値を採る。正確な値は実装計画の token 表を正本とし、`src/styles/global.css` から `registry.json` へ機械同期する。

`--overlay` は両 theme とも `oklch(0 0 0 / 10%)` を維持する。dark で foreground alpha を使うと白い veil になるため採用しない。

standards の semantic token 語彙、light / dark 構造、a11y 契約は維持するが、token 値は `elchika-inc` のブランド値へ移行する。そのため `.docs/PROJECT_GOAL.md` の「`templates/design-tokens.css` と同一」という初期基盤の完了条件は、ブランド token の正本、strict contrast sensor、registry 到達を要求する継続運用の条件へ置き換える。README も「standards のデザイントークン」と値まで同一に読める表現を避け、「standards 準拠の semantic token 構造と elchika ブランド値」と説明する。

### 3.4 sidebar alias

sidebar は値を複製せず、次の alias にする。

```css
--sidebar: var(--card);
--sidebar-foreground: var(--card-foreground);
--sidebar-primary: var(--primary);
--sidebar-primary-foreground: var(--primary-foreground);
--sidebar-accent: var(--muted);
--sidebar-accent-foreground: var(--secondary-foreground);
--sidebar-border: var(--border);
--sidebar-ring: var(--ring);
```

`sidebar-border` と `card` の比は light 1.323:1、dark 1.515:1 で 3:1 未達だが、standards `DESIGN.md` §8 が `--border` / `--input` を装飾境界として明示的に除外しているため許容する。証跡に gate と根拠を記録する。

### 3.5 chart palette

`--chart-1` から `--chart-5` は現行無彩色を維持する。ブランド2色から5色を機械導出すると識別性と色覚多様性を検証できないため、別 palette 設計まで `RISK-013` として先送りする。

## 4. consumer 正規化

### A. destructive subtle foreground

次の consumer は背景 alpha を維持し、文字を `text-destructive-subtle-foreground` へ変更する。

- `attachment.tsx`: error preview、error description
- `badge.tsx`: destructive variant
- `button.tsx`: destructive variant
- `bubble.tsx`: destructive variant
- `menubar.tsx`: destructive item と icon
- `alert.tsx`: destructive description

`text-destructive/80` / `/90` は廃止する。階調を alpha で作らず、opaque な subtle foreground を使う。

### B. primary solid hover

`badge.tsx`、`button.tsx`、`bubble.tsx` の `bg-primary/80` を `bg-primary-hover` へ変更する。`primary-foreground` は維持する。

### C. muted text on tinted surfaces

`--muted-foreground` を §3.2 の値へ寄せる。Select の `dark:bg-input` は `dark:bg-input/30` へ変更し、Input、Textarea、Combobox、NativeSelect、Checkbox、RadioGroup、InputOTP と統一する。

Select の変更は上流との差分であり、`provenance.modified` に記録する。実ブラウザ証跡には修正前後を残し、Select placeholder と他 form control の computed background が一致することを確認する。

### D. alpha foreground

Tabs の light `text-foreground/60` を opaque `text-muted-foreground` へ変更する。dark は既に同じ token を使うため、theme 別 override を削除して単一契約にする。

### E. 合格済み alpha pattern

次は変更せず、contrast sensor の permanent case にする。

- tooltip 内 Kbd の `text-background` + `bg-background/20` / `/10`
- secondary foreground + `bg-secondary/80`
- foreground + tinted primary `/10` / `/20` / `/30`
- foreground または muted foreground + `bg-muted/50`
- `text-sidebar-foreground/70` + sidebar

### overlay

`dialog.tsx` と `drawer.tsx` の `bg-black/10` を `bg-overlay` へ変更する。既に semantic token を使う AlertDialog、Sheet と合わせ、4 component で実背景との合成、backdrop blur、open state を検証する。

## 5. contrast sensor

### 5.1 計算モデル

`scripts/contrast.mjs` は `src/styles/global.css` の `:root` と `.dark` を直接読む。手写しした定数を計算しない。

1. `oklch()` を linear sRGB へ変換する。
2. sRGB transfer function で gamma-encoded sRGB へ変換する。
3. CSS alpha と utility slash alpha を乗算し、gamma-encoded sRGB 上で foreground-over-background 合成する。
4. 合成後の各色を linear sRGB へ戻して相対輝度を求める。
5. `(L1 + 0.05) / (L2 + 0.05)` を計算する。

alias は再帰解決し、missing token、cycle、解釈不能値は fail-closed にする。`:root` だけでなく `.dark` を必須とする。

### 5.2 consumer case

各 case は次の構造を持つ。

```js
{
  id: "button-primary-hover-light",
  theme: "light",
  gate: "text-aa",
  reason: "通常サイズの Button label",
  source: "src/components/ui/button.tsx",
  sourceClasses: ["hover:bg-primary-hover", "text-primary-foreground"],
  foreground: { token: "primary-foreground" },
  background: { token: "primary-hover" },
  underlays: ["background", "card", "muted"],
}
```

gate は次の4種類だけを許可する。

| gate | 成功条件 | 根拠の必須内容 |
|---|---|---|
| `text-aa` | 全 underlay で 4.5:1 以上 | 通常 text または icon label として読ませる内容 |
| `nontext-ui` | 全 underlay で 3:1 以上 | focus ring、状態、境界など識別に必要な UI 情報 |
| `disabled-exempt` | AA 比で落とさない。source contract と browser evidence は必須 | disabled / inactive state と判定した具体的 selector |
| `decorative` | AA 比で落とさない。token 値と source contract は必須 | DESIGN.md §8 または情報を担わない装飾である理由 |

prefix だけを見て gate を自動分類しない。同じ class 列に `hover:` と `disabled:` が併記されるため、case ごとに gate と理由を明示する。

source scanner は `src/components/ui/*.tsx` の semantic slash alpha utility を抽出し、全 utility が case の `sourceClasses` に現れることを検査する。新しい alpha consumer を追加して case を足し忘れた場合は fail-closed にする。case 側に書いた class が source から消えた場合も stale case として落とす。

### 5.3 RISK-006 の移行

strict sensor を token 変更前に作る。現行 light warning 3.9190:1 は `RISK-006` が `status: accepted` の間だけ明示的に受容する。sensor は次を区別する。

- FAIL + 対応する accepted risk が実在する: `ACCEPTED RISK` として通す。
- FAIL + accepted risk がない: exit 1。
- PASS + risk が accepted のまま: stale risk として exit 1。
- PASS + risk が mitigated: 通す。

ブランド token 適用後は warning pair が PASS するため、`RISK-006` を `mitigated` に変更する。

## 6. evidence coverage

### 6.1 保持する hard gate

`scripts/check-evidence.mjs` は全履歴に対して次を継続する。

- `verified_impl_sha` の形式、存在、HEAD 祖先性
- 初回 SHA の immutability
- 画像 magic bytes と拡張子一致
- component 固有 path の最新証跡以降の変更検知
- component evidence の削除・rename 検知
- symlink と repo 外 path の拒否

component 固有 path の hard gate は aggregate evidence で解除しない。

### 6.2 shared token coverage

token 移行の aggregate report は次の構造化欄を持つ。

```markdown
verified_impl_sha: <40桁の実装SHA>
evidence_scope: shared-token-migration
targeted_dynamic_sha: <40桁の動的検証SHA>
```

`src/styles/global.css` の stale を covered とする条件はすべて必須とする。

1. `evidence_scope: shared-token-migration` を持つ最新 report が一意に決まる。最新性は `verified_impl_sha` ではなく report 自身の追加 commit の祖先関係で判定する。staged / untracked report は working tree 上の最新候補とし、複数あれば coverage 不成立にする。
2. report の `verified_impl_sha` と `targeted_dynamic_sha` が実在し、HEAD の祖先である。
3. `global.css` の最終変更 commit が `verified_impl_sha` の厳密な祖先である。同じ SHA は「変更後」とみなさない。
4. `verified_impl_sha` が `targeted_dynamic_sha` と同一または祖先である。
5. `targeted_dynamic_sha` 以降に `global.css` が変更されていない。
6. report と同じ追加 commit、または commit 前なら同じ staged / untracked 追加集合に catalog、対象 component、targeted route の画像が存在し、magic bytes が拡張子と一致する。

判定不能、複数の incomparable report、field 欠落は coverage 不成立として stale を残す。`src/layouts/main.astro` と `src/lib/utils.ts` はこの token aggregate の coverage 対象にしない。

### 6.3 human output

全履歴は検査するが、shared stale の出力は次へ畳む。

- component ごとの最新証跡
- index / catalog scope ごとの最新 aggregate 証跡
- 過去履歴の stale は件数要約1行

有効な shared token coverage がある場合、`global.css` だけを理由とする historical stale は一覧から除く。他の shared path または aggregate path の stale は残す。

## 7. registry と provenance

`scripts/sync-registry-tokens.mjs` が `global.css` の light / dark token を全 registry item の `cssVars` へ同期する。`tokens.css` は各 item の `registry:file` として利用者へ届く。`registry.json` と `public/r` を手編集しない。

consumer source を変更する component は `provenance.json` の `modified` を実差分へ更新する。対象は Attachment、Alert、Badge、Button、Bubble、Dialog、Drawer、Menubar、Select、Tabs である。上流取得時の hash と commit は書き換えない。

外部 probe はローカル配信 URL から Button と Select を fresh Vite project へ追加し、次を実体確認する。

- component source に `bg-primary-hover`、`text-destructive-subtle-foreground`、`dark:bg-input/30` が届く。
- `elchika-ui/tokens.css` が届き、host の `global.css` と token 名・値が一致する。
- 新 token と sidebar alias が consumer CSS へ届く。
- probe の build が成功する。

## 8. 実ブラウザ証跡

token 変更前に Select と他 form control の dark 背景差を画像と computed style で記録する。変更後は同じ viewport と route で比較する。

変更後の component 固有 evidence は、変更した全 component について light / dark の画像と report を新規追加する。既存 evidence を編集しない。

targeted 検証では次を確認する。

- primary default / hover と destructive default / hover の computed color と contrast
- destructive subtle text を使う Attachment、Alert、Badge、Button、Bubble、Menubar
- Tabs の inactive / active text
- Select placeholder と Input / Textarea の dark background の一致
- Input、Textarea、NativeSelect、InputGroup の disabled state
- AlertDialog、Dialog、Drawer、Sheet の overlay、alpha 合成、backdrop blur
- catalog light / dark の全体崩れ、console error、horizontal overflow

画像は Chrome DevTools Protocol `Page.captureScreenshot` の JPEG で取得し `.jpg` として保存する。report に取得方法と形式の対応を1行記録する。

## 9. 実行順序

1. token 変更前の Select / form control baseline を固定する。
2. evidence checker の shared coverage を RED / GREEN で実装する。
3. contrast sensor を RED / GREEN で実装し、現行欠陥を実際に検出する。
4. token と risk registry を更新し registry token を同期する。
5. consumer、preview、provenance を正規化し contrast を GREEN にする。
6. contrast を `check:pre` / `check:all` / CI の permanent gate にする。
7. review cycle を flag 0 まで回し、最終実装 SHA を固定する。
8. component 固有 evidence と shared aggregate evidence を新規追加する。
9. fresh install probe と最終 gate を通し、PR を作成する。

## 10. DoneCriteria

1. `src/styles/global.css` が §3 の light / dark token、新 token、sidebar alias、現行 chart palette を持つ。
2. `npm run check:contrast` が light / dark、solid、前景 alpha、背景 alpha、alias、4 gate を実計算し exit 0 になる。
3. alpha utility を追加して case を足さない負の検査と、4.0193:1 の gamma sRGB probe が通る。
4. primary / destructive / Tabs / Select / overlay の source class が §4 と一致する。
5. `RISK-006` が mitigated、chart palette が `RISK-013` accepted として記録される。
6. `npm run registry:build` 後の `registry.json` と `public/r` が `global.css` の token と一致する。
7. fresh install probe へ source、token、法務ファイルが届き、consumer build が成功する。
8. 変更 component の最新 evidence が最終実装 SHA を指し、component 固有 hard gate が通る。
9. shared aggregate coverage が `global.css` stale を安全に cover し、全履歴の形式・immutability 検査は維持される。
10. catalog、targeted route、4 overlay、disabled state の light / dark 実ブラウザ検証に flag がない。
11. format、lint、unit test、typecheck、props、build、distribution、preview、evidence の全 gate が通る。
12. review cycle が flag 0 で終了し、PR の最終 head に対する CI が成功する。

## 11. 既知のリスク

- chart palette はブランド化しない。`RISK-013` として別設計へ送る。
- border / input の decorative contrast は standards `DESIGN.md` §8 に従い 3:1 を保証しない。active text と focus ring は別 gate で検査する。
- disabled text は WCAG 1.4.3 の対象外だが、見た目と source contract を検証しない理由にはしない。
- registry の既存 CSS variable は shadcn の `overwriteCssVars: false` により自動上書きされない。`tokens.css` を最後に import する利用契約は維持する。
- shared aggregate coverage は `global.css` だけを cover する。component 固有変更や他 shared path を誤って green にしない。
