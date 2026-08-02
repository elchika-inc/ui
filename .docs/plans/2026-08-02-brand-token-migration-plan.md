# ブランドトークン移行 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** デザインシステム v1.8 を生成正本から取り込み、shadcn alias、light / dark、実 consumer、registry 配布、strict contrast sensor、SHA 固定の実ブラウザ証跡まで一貫して移行する。

**Architecture:** `src/styles/design-system/design-tokens.html` を token 値の唯一の正本、生成 `tokens.css` を Layer 0 / 1、`global.css` を既存 shadcn 語彙への alias 層とする。v1.8 の generator が token 層と生成物同一性、consumer contrast sensor が実 class の合成結果を担当する。registry は alias CSS と生成 token を別 path で配り、component 固有証跡の hard gate は維持し、shared token だけを一意な aggregate report で cover する。

**Tech Stack:** Node.js 22.12+、Astro 7、React 19、Base UI 1.6、Tailwind CSS v4、Biome 2、Node test runner、shadcn CLI 4.16、Chrome DevTools Protocol。

## Global Constraints

- `standards` リポジトリは読み取り専用。書き込み、commit、push をしない。
- 作業 branch は `feat/brand-tokens`。`main` へ直接 commit / push / merge しない。
- この更新計画 SHA を Claude が確認するまで、Task 3 以降を実行しない。Task 1 / 2 は commit 済みで再実行しない。
- 指示、実装、実測のいずれかが矛盾したら推測で補わず Claude へ報告し、影響範囲を止める。
- コミットメッセージ、PR 本文、文書、コメントは日本語で書く。
- repo 内の text file は `apply_patch` で編集する。生成 command による mechanical rewrite は許可する。
- stage は task 所有 path を明示する。`git add -A` と `git add .` を使わない。
- Task 3 以降は commit 前に `npm run format` と `npm run lint` を実行し、lint が exit 0 でなければ commit しない。
- 検証 command に pipe を挟まない。出力解析が必要なら一度 file へ保存し、元 command の exit code を保持する。
- 変動する件数を Expected に固定しない。空走 guard は「0件でないこと」のみ許可する。
- RED の負の検査、uncommitted 差分、`test -s`、`git ls-files`、fresh install、light / dark の動的検証を省略しない。
- 既存 evidence を編集・削除・rename しない。再検証は `.docs/reviews/brand-token-migration/` へ新規 file として追加する。
- `verified_impl_sha` は画像を取得した実装 commit を指す。evidence commit 自身を自己参照させない。
- review cycle は correctness / security / 明示要件の flag と optional を分離し、flag 0 または `ACCEPTED_RISKS` 明示受容まで反復する。
- v1.8 の `--color-*` は alias 層から再定義しない。製品が上書きできるのは `--brand-*` だけとする。
- `.dark` と `[data-theme="dark"]` は同じ theme を表す。preview の forced theme を含め、片方だけを切り替えない。
- `brands.css` は生成・同一性検査の対象だが runtime import / registry 配布はしない。density / language variant は今回 consumer へ接続しない。
- chart palette は v1.8 の5系列を既存 `--chart-1` から `--chart-5` へ alias して採用する。overlay は両 theme とも現行 black 10% を維持する。

---

## File Structure

| path | 責務 |
|---|---|
| `scripts/check-evidence.mjs` | 全履歴の形式・immutability、component hard gate、shared aggregate coverage、stale 要約 |
| `scripts/check-evidence.test.mjs` | coverage の祖先関係、uncommitted 差分、fail-closed、stale 要約の回帰 |
| `scripts/contrast.mjs` | RGB triplet / alias / alpha parser、gamma sRGB 合成、gate 評価、CLI |
| `scripts/contrast-cases.mjs` | consumer と TypeScript AST 由来 utility の declarative contract |
| `scripts/contrast.test.mjs` | gamma 合成、parser fail-closed、gate、AST source coverage の回帰 |
| `src/styles/design-system/` | v1.8 の HTML 正本、generator、生成物、設計 README、参照 Tailwind mapping |
| `src/styles/global.css` | v1.8 を shadcn / Tailwind v4 語彙へ繋ぐ alias 層 |
| `src/components/ui/*.tsx` | alpha 配色と overlay の consumer 正規化 |
| `src/layouts/main.astro` / `src/previews/preview-theme.ts` | `.dark` と `data-theme` の同期 |
| `src/previews/button.tsx` | primary / destructive の通常面と muted 最悪面の可視化 |
| `src/previews/select.tsx` | Select placeholder と他 form control の dark background 比較 |
| `provenance.json` | 上流との差分である consumer 正規化の記録 |
| `.docs/risk-registry.md` | warning mitigation と v1.8 取り込み判断 |
| `.docs/PROJECT_GOAL.md` / `README.md` | 初期 token 同一性からブランド token の継続契約へ更新 |
| `registry.json` / `public/r` | alias CSS、生成 token、component source の配布物 |
| `package.json` / `scripts/check-all.mjs` / `.github/workflows/ci.yml` | v1.8 build と strict consumer contrast の常設 gate |
| `.docs/reviews/brand-token-migration/` | before / after 画像、component report、shared aggregate、fresh install 記録 |

---

### Task 1: Select と form control の移行前 baseline を固定する

**Files:**
- Create: `.docs/reviews/brand-token-migration/before-select-dark.jpg`
- Create: `.docs/reviews/brand-token-migration/before-input-dark.jpg`
- Create: `.docs/reviews/brand-token-migration/before-catalog-light.jpg`
- Create: `.docs/reviews/brand-token-migration/before-catalog-dark.jpg`
- Create: `.docs/reviews/brand-token-migration/before-report.md`

**Interfaces:**
- Consumes: 計画 commit の source。product code は未変更。
- Produces: `BASELINE_SHA` と before の computed style / JPEG。Task 8 が同じ viewport と selector で比較する。

- [ ] **Step 1: 計画承認後の clean state を確認する**

Run:

```bash
git status --short --branch
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
```

Expected: branch は `feat/brand-tokens`、tracked / untracked 差分なし。`BASELINE_SHA=$(git rev-parse HEAD)` として記録する。

- [ ] **Step 2: build して空き port を固定する**

```bash
npm run build
for p in 4313 4323 4333 4343; do
  if ! lsof -nP -iTCP:$p -sTCP:LISTEN >/dev/null 2>&1; then
    export PREVIEW_PORT=$p
    break
  fi
done
test -n "$PREVIEW_PORT"
npx astro preview --host 127.0.0.1 --port "$PREVIEW_PORT"
```

Expected: build exit 0。候補 port が全て使用中なら停止する。preview は指定 port 以外へ fallback させない。

- [ ] **Step 3: browser で before を取得する**

`browser:control-in-app-browser` を使い、CSS viewport 1512 × 828 で次を開く。

- `/preview/select-dark/`
- `/preview/input-dark/`
- `/catalog/`
- `/catalog-dark/`

Select trigger、Input、Textarea、NativeSelect の `backgroundColor`、`color`、border、placeholder state を記録する。Select の dark trigger が solid `--input`、Input が `--input/30` で異なることを実体で確認する。

Chrome DevTools Protocol `Page.captureScreenshot` の `format: jpeg` で画像を取得し、上記 `.jpg` path へ保存する。PNG bytes を `.jpg` へ置かない。

- [ ] **Step 4: baseline report を新規作成する**

`.docs/reviews/brand-token-migration/before-report.md` を次の構造で作る。

```markdown
# ブランドトークン移行前 baseline

verified_impl_sha: BASELINE_SHAの40桁SHA

- 検証 URL: 実際に使った4 URL
- viewport: 1512 × 828
- Select trigger の computed background: 実測値
- Input の computed background: 実測値
- 差があること: 実測値を並記
- console error / warning: 実測結果
- 画像は Chrome DevTools Protocol Page.captureScreenshot の JPEG で取得し、拡張子 .jpg と実体を一致させた。
```

`BASELINE_SHA` という文字列を残さず、実値へ置換する。

- [ ] **Step 5: evidence checker と magic bytes を確認する**

Run:

```bash
node scripts/check-evidence.mjs
file .docs/reviews/brand-token-migration/before-select-dark.jpg
file .docs/reviews/brand-token-migration/before-input-dark.jpg
file .docs/reviews/brand-token-migration/before-catalog-light.jpg
file .docs/reviews/brand-token-migration/before-catalog-dark.jpg
```

Expected: checker exit 0。各 `file` 出力に JPEG が含まれる。

- [ ] **Step 6: preview を停止し baseline だけを commit する**

```bash
git add .docs/reviews/brand-token-migration/before-select-dark.jpg .docs/reviews/brand-token-migration/before-input-dark.jpg .docs/reviews/brand-token-migration/before-catalog-light.jpg .docs/reviews/brand-token-migration/before-catalog-dark.jpg .docs/reviews/brand-token-migration/before-report.md
git commit -m "docs: ブランドトークン移行前の表示を記録する"
```

Expected: product source の差分を含まない新規 evidence commit。

---

### Task 2: shared evidence coverage を fail-closed にする

**Files:**
- Modify: `scripts/check-evidence.mjs`
- Modify: `scripts/check-evidence.test.mjs`

**Interfaces:**
- Consumes: 既存 `parseVerificationSha(markdown)`、`commitIsAncestor(root, a, b)`、`pathsChanged(root, sha, paths)`。
- Produces: `parseSingleField(markdown, field)`、`latestByAddition(root, reports)`、`inspectSharedTokenCoverage(root, reports)`、`summarizeStale(root, inspected, coverage)`。

- [ ] **Step 1: aggregate field parser の RED test を書く**

```js
test("shared token report の構造化 field を一意に読む", async () => {
  const { parseSingleField } = await loadModule();
  assert.deepEqual(parseSingleField("evidence_scope: shared-token-migration\n", "evidence_scope"), {
    value: "shared-token-migration",
  });
  assert.match(
    parseSingleField("targeted_dynamic_sha: a\ntargeted_dynamic_sha: b\n", "targeted_dynamic_sha")
      .problem,
    /複数/,
  );
});
```

- [ ] **Step 2: coverage の ancestor / dirty state RED test を書く**

temp repo へ `global.css` 変更 commit、後続 implementation commit、aggregate report 追加 commit を作る。次を別 test にする。

- valid report は historical `global.css` stale を cover する。
- `verified_impl_sha` が `global.css` 変更 commit と同一なら cover しない。
- `targeted_dynamic_sha` が欠落、非 commit、非祖先なら cover しない。
- targeted SHA 後の committed `global.css` 変更で cover を失う。
- targeted SHA 後の uncommitted `global.css` 変更で cover を失う。
- incomparable な latest coverage report は problem にする。
- 同じ `verified_impl_sha` の report を後から追加した場合、report の追加 commit が新しい方を採用する。
- staged / untracked の report と画像は working tree の最新追加集合として検査し、単一候補なら commit 前でも coverage を成立させる。
- staged / untracked の shared report が複数あれば coverage を成立させない。
- report と同じ追加 commit または追加集合に catalog / component / targeted route の画像が欠ければ cover しない。
- component source の変更は coverage があっても hard failure のまま。

valid report は次の fixture を使う。

```markdown
verified_impl_sha: IMPLEMENTATION_SHA
evidence_scope: shared-token-migration
targeted_dynamic_sha: IMPLEMENTATION_SHA
```

- [ ] **Step 3: test が未実装で落ちることを確認する**

Run: `node --test scripts/check-evidence.test.mjs`

Expected: `parseSingleField` または coverage API が存在しない理由で FAIL。

- [ ] **Step 4: field parser と strict ancestor 判定を実装する**

`scripts/check-evidence.mjs` へ次の interface を追加する。

```js
export function parseSingleField(markdown, field) {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const fields = markdown.match(new RegExp(`^${escaped}:.*$`, "gm")) ?? [];
  if (fields.length === 0) return { problem: `${field} が無い` };
  if (fields.length > 1) return { problem: `${field} が複数ある` };
  const value = fields[0].slice(fields[0].indexOf(":") + 1).trim();
  return value ? { value } : { problem: `${field} が空` };
}

const strictAncestor = (root, ancestor, descendant) =>
  ancestor !== descendant && commitIsAncestor(root, ancestor, descendant);
```

`targeted_dynamic_sha` は `^[0-9a-f]{40}$` を必須にし、commit existence と HEAD 祖先性を既存 helper で検査する。

- [ ] **Step 5: latest report と coverage を実装する**

```js
export function latestByAddition(root, reports) {
  const workingTreeReports = reports.filter((report) => report.additionCommit === undefined);
  if (workingTreeReports.length > 0) return workingTreeReports;
  return reports.filter(
    (candidate) =>
      !reports.some(
        (other) =>
          candidate.file !== other.file &&
          candidate.additionCommit !== other.additionCommit &&
          commitIsAncestor(root, candidate.additionCommit, other.additionCommit),
      ),
  );
}
```

`inspectSharedTokenCoverage` は `evidence_scope` が `shared-token-migration` の report だけを対象にし、既存 `evidenceAddition()` から `additionCommit` と同時追加 file を得て design §6.2 の条件を全て検査する。有効時は `{ coveredPaths: new Set(["src/styles/global.css"]), problems: [] }`、無効時は空 set と具体的 problem / stale reason を返す。

- [ ] **Step 6: stale の human output を要約する**

内部では全 markdown を検査する。表示用 `stale` は component ごとの latest、index / catalog scope ごとの latest、historical summary に畳む。有効 coverage がある場合は各 stale entry から `src/styles/global.css` だけを除き、path が残らなければ表示しない。

historical summary は件数を検査条件にせず、実走査結果から次の形式で出す。

```text
過去履歴の shared stale: <実数> 件（形式・immutability は全件検査済み）
```

- [ ] **Step 7: GREEN と負の検査を確認する**

Run:

```bash
node --test scripts/check-evidence.test.mjs
node scripts/check-evidence.mjs
```

Expected: test と checker が exit 0。既存 repository の stale は要約される。

temp test 内で uncommitted `global.css` を作った case が coverage 不成立になることを test 名と assertion で確認する。

- [ ] **Step 8: format / lint 後に commit する**

```bash
npm run format
npm run lint
git add scripts/check-evidence.mjs scripts/check-evidence.test.mjs
git commit -m "fix: 共有証跡の鮮度判定を集約する"
```

---

### Task 3: actual consumer contrast sensor を RED まで作る

**Files:**
- Create: `scripts/contrast-cases.mjs`
- Create: `scripts/contrast.test.mjs`
- Modify: `scripts/contrast.mjs`

**Interfaces:**
- Consumes: `src/styles/global.css`、将来追加する `src/styles/design-system/tokens.css`、`.docs/risk-registry.md`、`src/components/ui/*.tsx`。
- Produces: `parseThemes(css)`、`resolveToken(themes, theme, name)`、`extractClassTokens(source, path)`、`composite(fg, bg)`、`contrastRatio(fg, bg)`、`evaluateCase(case, themes)`、`checkContrastInRepo(root)`、`CONSUMER_CASES`。

- [ ] **Step 1: gamma sRGB 合成の RED test を書く**

```js
test("destructive/10 の gamma-encoded sRGB 合成を実測値で固定する", async () => {
  const { parseColor, composite, contrastRatio } = await loadModule();
  const destructive = parseColor("oklch(0.5650 0.1774 22.67)");
  const background = parseColor("oklch(0.9734 0.0013 286.38)");
  const surface = composite({ ...destructive, alpha: 0.1 }, background);
  assert.ok(Math.abs(contrastRatio(destructive, surface) - 4.0193) < 0.001);
});
```

linear sRGB 上で直接 alpha 合成する誤実装ではこの fixture が一致しない。

- [ ] **Step 2: parser / alias / gate の RED test を書く**

次を独立 test にする。

- `:root` と `.dark` または `[data-theme="dark"]` が必須。
- `[data-theme="dark"]` を `.dark` と同じ dark override として読み、両方がある場合に同名 token の値が違えば problem。
- `oklch(L C H / 10%)` の intrinsic alpha を読む。
- `R G B` triplet、`rgb(var(--token))`、`rgb(var(--token) / alpha)`、alpha の multi-hop alias を読む。
- `var(--card)` の multi-hop alias を解決する。
- missing alias、cycle、未知の値形式、範囲外 channel / alpha を problem にして fail-closed にする。
- `text-aa` は 4.5 未満、`nontext-ui` は 3 未満で problem。
- `disabled-exempt` と `decorative` は ratio を出すが AA problem にしない。
- 全 case は空でない `reason` を必須にする。
- TypeScript AST が string / no-substitution template literal から取り出した semantic slash alpha utility が case から漏れたら problem。
- case の `sourceClasses` が source から消えたら problem。
- accepted `RISK-006` は現行 warning FAIL だけを受容し、PASS 後も accepted なら stale risk problem。
- opening quote 直後の `bg-destructive/10` を抽出し、arbitrary variant 内の quote から class 断片を偽抽出しない。

- [ ] **Step 3: test が未実装で落ちることを確認する**

Run: `node --test scripts/contrast.test.mjs`

Expected: module / export が存在しない理由で FAIL。

- [ ] **Step 4: parser と色計算を実装する**

`scripts/contrast.mjs` は CLI branch を `pathToFileURL(process.argv[1])` で分離し、test import 時に process を終了しない。色は次の shape へ正規化する。

```js
// gamma-encoded sRGB channel と alpha
{ rgb: [number, number, number], alpha: number }
```

class slash alpha は token intrinsic alpha と乗算する。foreground alpha は最終 background 上へ、background alpha は underlay 上へ合成する。Task 4 後は `tokens.css` の生成 token を先、`global.css` の alias を後に selector 単位で merge する。解析対象として参照された値を読めなければ case を省略せず problem にする。

- [ ] **Step 5: consumer case を gate と根拠つきで列挙する**

`scripts/contrast-cases.mjs` へ次の group をすべて入れる。

| source | source class / state | foreground | background | gate |
|---|---|---|---|---|
| `kbd.tsx` | `in-data-[slot=tooltip-content]:bg-background/20`, dark `/10`, `text-background` | background | background alpha over foreground | text-aa |
| `badge.tsx`, `button.tsx`, `bubble.tsx` | `bg-primary` + `text-primary-foreground` | primary-foreground | primary | text-aa |
| 同上 | current `bg-primary/80` hover、移行後 `bg-primary-hover` | primary-foreground | primary hover | text-aa |
| `badge.tsx`, `button.tsx` | `bg-secondary/80` hover | secondary-foreground | secondary/80 | text-aa |
| `bubble.tsx` | tinted primary `/10`,`/20`,`/30` | foreground | primary alpha | text-aa |
| `field.tsx` | primary `/5`,`/10` checked surface | muted-foreground | primary alpha | text-aa |
| Table、Attachment、Badge、Dialog、Bubble、Item、Card、AlertDialog、NavigationMenu | muted `/50` | 実装上の foreground または muted-foreground | muted/50 | text-aa |
| Input、Textarea、InputGroup、Combobox、Command、Select | active input `/30` | foreground / muted-foreground | input/30 | text-aa |
| Button、NativeSelect | active input `/50` hover | foreground | input/50 | text-aa |
| Input、Textarea、NativeSelect、InputGroup | disabled input `/50`,`/80` | 実装上の text | input alpha | disabled-exempt |
| Switch | unchecked input、dark `/80` | thumb color | input surface | decorative。位置でも state を伝え、`--input` は DESIGN.md §8 の装飾 token |
| Tabs | inactive text | muted-foreground | muted と background | text-aa |
| Sidebar | `text-sidebar-foreground/70` | sidebar-foreground/70 | sidebar | text-aa |
| Attachment、Alert | destructive alpha text の現行状態と移行後 subtle foreground | destructive subtle foreground | card / muted surface | text-aa |
| Attachment、Badge、Button、Bubble、Menubar | destructive `/10`,`/20`,`/30` | destructive subtle foreground | destructive alpha | text-aa |
| ContextMenu、DropdownMenu | solid destructive focus | destructive-foreground | destructive | text-aa |
| focus ring | `ring-ring` / `outline-ring` | ring | background / card / muted | nontext-ui |
| container ring | `ring-foreground/10` | foreground/10 | component surface | decorative。container outline で focus 情報ではない |
| chart / error / field border | border `/20`,`/30`,`/50`、stroke `/50` | 対象 token | adjacent surface | decorative。DESIGN.md §8 または補助 cue |
| overlay | `bg-overlay` | black 10% | background / card | decorative。alpha と blur の visual contract |

`sourceClasses` は Task 3 実行時点の exact utility を入れる。Task 5 の置換で同じ case の exact utility を新 class へ更新する。

- [ ] **Step 6: source alpha coverage を実装する**

TypeScript compiler API で TSX を parse し、string literal と no-substitution template literal の値だけを取り出して whitespace split する。各 class token の最終 utility segment が `bg|text|border|ring|stroke|fill` の semantic slash alpha なら採用する。raw source regex は使わない。

`src/components/ui/*.tsx` の unique `path + exact utility` と case の `source + sourceClasses` を双方向比較する。`bg-black/10` は semantic 違反として Task 5 で消すまで explicit legacy case に入れ、移行後は legacy case を削除する。手順書に「CSS class coverage は raw source regex でなく AST + whitespace split を既定とする」と1行残す。

- [ ] **Step 7: 現行 repository で sensor が欠陥を検出することを確認する**

Run:

```bash
node --test scripts/contrast.test.mjs
node scripts/contrast.mjs
```

Expected: unit test は exit 0。CLI は exit 1 で、現行 token の FAIL は `Attachment destructive text /80 (dark)`、`destructive subtle /20 (light)`、`destructive subtle /30 (dark)` だけになる。primary `/80` hover と Tabs inactive は PASS する。`RISK-006` は accepted risk として明示表示される。他の未知 FAIL が出たら Task 4 へ進まず報告する。

- [ ] **Step 8: strict sensor を gate へ未接続のまま commit する**

```bash
npm run format
npm run lint
git add scripts/contrast.mjs scripts/contrast-cases.mjs scripts/contrast.test.mjs
git commit -m "test: 実利用配色のコントラスト検査を追加する"
```

`package.json`、`check-all.mjs`、CI はまだ変更しない。CLI が RED の間に permanent gate へ接続しない。

---

### Task 4: デザインシステム v1.8 と alias 層を取り込む

**Files:**
- Create from approved source: `src/styles/design-system/{README.md,design-tokens.html,build-tokens.mjs,tokens.css,brands.css,tailwind.config.js}`
- Create: `scripts/design-tokens.test.mjs`
- Modify: `src/styles/design-system/build-tokens.mjs`
- Modify: `src/styles/global.css`
- Modify: `biome.json`
- Modify: `src/layouts/main.astro`
- Modify: `src/pages/preview/*.astro`
- Modify: `src/previews/preview-theme.ts`
- Modify: `scripts/preview-theme.test.mjs`
- Modify: `scripts/check-evidence.mjs`, `scripts/check-evidence.test.mjs`
- Modify: `.docs/risk-registry.md`
- Modify: `.docs/PROJECT_GOAL.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: Claude が修正した v1.8 source 一式、Task 3 parser / cases。
- Produces: HTML 正本、disk 生成物同一性 gate、`--color-*` を再定義しない shadcn alias、同期した `.dark` / `data-theme`、mitigated RISK-006、v1.8 chart alias。

- [ ] **Step 1: 承認済み v1.8 source を byte 一致で取り込む**

scratchpad の `dt/` から `.bak` を除く6 file を `src/styles/design-system/` へ mechanical copy する。copy 前後の SHA-256 を比較し、すべて一致しなければ停止する。`brands.css` は generator の完全性を保つため保存するが、runtime import と registry 配布はしない。

- [ ] **Step 2: stale 生成物を拒否できない RED test を書く**

temp directory へ6 file を copy し、`tokens.css` だけへ古い内容を追加して `node build-tokens.mjs --check` を実行する test を追加する。Expected は non-zero と生成物不一致 message。未修正 script が exit 0 を返すため test 自体が FAIL することを確認する。

- [ ] **Step 3: generator の `--check` を exact artifact comparison にする**

`--check` 時はメモリ上の `tokensCss` / `brandsCss` と disk の `tokens.css` / `brands.css` を byte 比較し、欠落または不一致を problem にする。通常 build は従来どおり両 file を生成してから同じ検査を通す。次を確認する。

```bash
node --test scripts/design-tokens.test.mjs
node src/styles/design-system/build-tokens.mjs --check
```

Expected: test と実 source の check が exit 0。temp 上で生成物を壊す負の検査は non-zero、通常 build 後は再び exit 0。

- [ ] **Step 4: v1.8 を layer 付き import し Tailwind v4 alias を定義する**

`global.css` の先頭、Tailwind import より前へ次を追加する。`design-system` layer を最初に確立して Tailwind の `theme / base / components / utilities` より低優先度にし、v1.8 の変数は使いつつ、今回 scope 外の body / focus base rule が既存 component contract を上書きしないようにする。

```css
@import "./design-system/tokens.css" layer(design-system);
```

`@theme inline` へ `primary-hover`、`destructive-subtle`、`destructive-subtle-foreground`、`state-hover`、`state-press`、`state-selected` を追加する。既存 shadcn token は両 theme で値を copy せず次へ alias する。

| shadcn alias | v1.8 source |
|---|---|
| background | `rgb(var(--color-bg-canvas))` |
| foreground / card-foreground / popover-foreground | `rgb(var(--color-text-primary))` |
| card / popover | `rgb(var(--color-bg-surface))` |
| primary | `rgb(var(--color-brand-primary))` |
| primary-hover | `rgb(var(--color-brand-primary-hover))` |
| primary-foreground | `rgb(var(--color-bg-surface))` |
| secondary / muted | `rgb(var(--color-bg-surface-raised))` |
| secondary-foreground | `rgb(var(--color-text-primary))` |
| muted-foreground | `rgb(var(--color-text-muted))` |
| accent | `rgb(var(--color-brand-subtle))` |
| accent-foreground | `rgb(var(--color-brand-primary-hover))` |
| destructive / destructive-foreground | `rgb(var(--color-status-danger-text))` / `rgb(var(--color-bg-surface))` |
| destructive-subtle / destructive-subtle-foreground | `rgb(var(--color-status-danger-bg))` / `rgb(var(--color-status-danger-text))` |
| success / success-foreground | `rgb(var(--color-status-success-bg))` / `rgb(var(--color-status-success-text))` |
| warning / warning-foreground | `rgb(var(--color-status-warning-bg))` / `rgb(var(--color-status-warning-text))` |
| border / input / ring | `rgb(var(--color-border-default))` / `rgb(var(--color-border-control))` / `rgb(var(--color-brand-primary))` |
| chart-1..5 | `rgb(var(--chart-series-1..5))` |
| sidebar family | card / foreground / primary / muted / border / ring alias |
| overlay | 現行 `oklch(0 0 0 / 10%)` |

`:root` と `.dark` は同じ alias 式を持ち、違いは v1.8 側の `[data-theme="dark"]` が解決する値と `color-scheme` だけにする。`--color-*` を `global.css` で定義しない。

- [ ] **Step 5: `.dark` と `data-theme` を同期する RED→GREEN test を追加する**

`main.astro` は light で `data-theme="light"`、dark で `class="dark" data-theme="dark"` を出す。isolated preview は61件の dark route を含む全 route が Layout を経由せず `<html>` を直書きしているため、全 light route へ `data-theme="light"`、全 dark route へ `data-theme="dark"` を機械追加する。`watchPreviewTheme` は class と data attribute の両方を監視し、不一致を callback の成功値として扱わず例外へ surface する。`preview-theme.test.mjs` に light / dark 一致、class のみ、data-theme のみ、未知値と、全 `.astro` source の class / data-theme 同期 test を追加し、先に RED を確認してから実装する。

ブラウザから forced theme を切り替える手順は、必ず class と data attribute を同じ `evaluate` 内で更新する。片方だけの更新は禁止する。Task 8 では source test と別に、ビルド済み DOM の `html.dark` と `data-theme="dark"` の一致 assert を維持する。

- [ ] **Step 5b: shared evidence coverage を生成 token まで拡張する**

`SHARED_TOKEN_PATH` を `SHARED_TOKEN_PATHS = ["src/styles/global.css", "src/styles/design-system/tokens.css"]` へ拡張する。どちらか一方の committed / staged / unstaged 変更で aggregate coverage を失い、有効な最新 aggregate は両方の historical stale を cover する RED test を先に追加する。HTML 正本と生成 CSS の同一性は token build gate が担当し、visual stale は runtime に届く2 CSS file を対象にする。

- [ ] **Step 6: RISK-006 と文書契約を v1.8 へ更新する**

RISK-006 は `mitigated` とし、`--warning` / `--warning-foreground` が v1.8 の検査済み warning bg / text pair を alias すること、token build と consumer sensor の二重 anchor を記録する。chart defer の RISK-013 は追加せず、5系列を v1.8 から採用した判断を report に残す。

PROJECT_GOAL DoneCriteria 3、README Features / Architecture は、HTML 正本 → generated Layer 0 / 1 → shadcn alias → registry の契約、token build と consumer contrast の分担へ更新する。

- [ ] **Step 6b: vendored 正本を Biome から除外する**

`src/styles/design-system/` は承認済み外部正本の byte 一致を優先し、Biome の `files.includes` で directory 単位に force-ignore する。lint は自分たちのコードだけへ適用する。README には `build-tokens.mjs` の取り込み時 SHA と exact artifact comparison の承認済み差分を記録する。`design-tokens.html` で検出した a11y error と Clipboard API の reject を空 handler で握りつぶす挙動は配布 CSS へ影響しないため今回は変更せず、Task 8 の最終レポートへ v1.8 側の改善候補として記録する。

- [ ] **Step 7: token 層と consumer RED を確認する**

```bash
node --test scripts/design-tokens.test.mjs scripts/preview-theme.test.mjs scripts/contrast.test.mjs
node src/styles/design-system/build-tokens.mjs --check
node scripts/contrast.mjs
npm run format
npm run lint
```

Expected: tests、token check、format、lint は exit 0。consumer CLI は Task 5 前なので exit 1 になるが、FAIL の exact set は v1.8 適用後の実測結果を正本としてこの Step で再判定する。warning は PASS し、RISK-006 stale accepted problem は出ない。未宣言 utility、解析不能、coverage 欠落があれば停止して報告する。

- [ ] **Step 8: token commit を consumer commit と分ける**

対象 path を明示 stage して `feat: デザインシステム v1.8 を導入する` で commit する。この commit を `GLOBAL_TOKEN_SHA` とし、Task 6 の最終実装 SHA は strict descendant とする。`registry.json` は配布 file 構造を更新する Task 5 まで変更しない。

---

### Task 5: consumer、registry、provenance を v1.8 state contract へ正規化する

**Files:**
- Modify: semantic alpha / theme class を持つ `src/components/ui/*.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/previews/button.tsx`, `src/previews/select.tsx`
- Modify: `scripts/contrast-cases.mjs`
- Modify: `scripts/add-component.mjs`, `scripts/add-component.test.mjs`
- Modify: `scripts/check-distribution.mjs`, `scripts/check-distribution.test.mjs`
- Modify: `provenance.json`
- Modify generated: `registry.json`, `public/r/*.json`

**Interfaces:**
- Consumes: Task 4 の primary hover、status subtle pair、state tint / selected surface、opaque control surface、generated design-system token。
- Produces: contrast CLI が exit 0 になる consumer contract と、alias CSS + generated token が必ず届く registry。

- [ ] **Step 1: A〜E を v1.8 前提で確定する**

| 旧裁定 | v1.8 での裁定 |
|---|---|
| A destructive subtle foreground 新設 | v1.8 の `status-danger-bg` / `status-danger-text` を `destructive-subtle` pair へ alias し、独自色は作らない |
| B primary `/80` hover | solid primary は `primary-hover`、secondary / subtle surface の hover は state tint にする |
| C muted foreground 調整 | v1.8 の検査済み `color-text-muted` をそのまま alias する |
| D Tabs light alpha | light / dark とも opaque `text-muted-foreground` にする |
| E passing pattern 維持 | 装飾 alpha だけを維持し、状態を表す alpha は `state-*`、control surface は card / muted へ正規化する |
| F solid destructive の light AA | component の solid class は維持し、`destructive` alias を v1.8 の solid / text 用 `color-status-danger-text` へ変更する。`color-status-danger` は subtle / indicator 経由で使用を継続する |

solid / subtle surface を保ったまま tint を重ねる箇所は、`background-image: linear-gradient(var(--state-hover-bg), var(--state-hover-bg))` の共通 `state-hover-overlay` utility を `global.css` に1つ定義する。component 別 hover token は作らない。focus ring と競合する `box-shadow` overlay は使わない。

正規化順序は `destructive` alias の変更を先、alpha class の置換を後に固定する。`global.css` には、solid AA のため `color-status-danger-text` を使い、`color-status-danger` は subtle / indicator で維持する理由を1行コメントする。alias 変更で濃くなる `border-destructive` / `ring-destructive` は nontext sensor の対象に含める。

- [ ] **Step 2: semantic state alpha を exact class へ置換する**

- Button / Badge / Bubble の solid primary hover: `bg-primary/80` → `bg-primary-hover`。
- Button / Badge / Bubble / Attachment / Alert / Menubar の destructive: alpha background / text を `bg-destructive-subtle`、`text-destructive-subtle-foreground`、必要な hover は `state-hover-overlay` へ置換する。
- Bubble / Field の selected primary alpha: `bg-state-selected` と opaque foreground / border へ置換する。
- muted `/50` を hover / open / active state として使う class: `bg-state-hover` または base surface + `state-hover-overlay` へ置換する。
- Input / Textarea / NativeSelect / Select / InputGroup / Combobox / Command の control surface: light / dark とも `bg-card border-input`。disabled は `bg-muted opacity-disabled`、invalid border は alpha を外して `border-destructive`。
- secondary `/80` hover: base secondary を保ち `state-hover-overlay` を使う。
- Tabs inactive と Sidebar `/70`: opaque muted / sidebar foreground へ置換する。
- Dialog / Drawer の `bg-black/10`: `bg-overlay` へ置換する。
- ContextMenu / DropdownMenu の solid destructive、Kbd の tooltip 内 alpha、decorative ring / chart stroke / seam は維持し、Task 3 case に reason を残す。

置換後に AST scanner が返す全 `path + exact utility` を出力し、case 側との双方向差分が空であることを確認する。対象外 component を見た目目的で変更しない。

- [ ] **Step 3: Button / Select preview を拡張する**

Button は muted 最悪面へ primary / destructive を追加する。Select は Input comparison を追加し、両方が `bg-card border-input` へ解決されることを観測できるようにする。catalog mode では追加 Select を閉じたままにする。

- [ ] **Step 4: provenance.modified を全実差分へ更新する**

変更した component entry だけへ state token 正規化の実差分を追記する。`sourceUrl`、upstream SHA、取得日、hash は変更しない。実際に変更していない component へ記載を足さない。

solid destructive alias は共有 token の差分であり、component code を変更しない ContextMenu / DropdownMenu の `provenance.modified` は変更しない。判断理由と `color-status-danger` の使用継続は Task 8 の shared report へ記録する。

- [ ] **Step 5: registry の2層 token 配布を RED→GREEN にする**

先に test を追加し、全 registry item が次の両 file を持たない現状で RED を確認する。

```text
src/styles/global.css -> ~/elchika-ui/tokens.css
src/styles/design-system/tokens.css -> ~/elchika-ui/design-system/tokens.css
```

`add-component.mjs` の shared files、既存 `registry.json` の全 item、`check-distribution.mjs` の REQUIRED を更新する。distribution checker は design-system token の存在、`registry:file`、non-empty、原本 byte 一致を法務 file と同じ fail-closed で検査する。出力へ変動件数を書かない。

- [ ] **Step 6: contrast と distribution を GREEN にする**

```bash
node --test scripts/contrast.test.mjs scripts/add-component.test.mjs scripts/check-distribution.test.mjs
node scripts/contrast.mjs
npm run registry:build
npm run registry:legal
node scripts/check-distribution.mjs
```

Expected: 全 command exit 0。CLI の全 `text-aa` / `nontext-ui` case は PASS、disabled / decorative は gate 名と non-empty reason を表示する。`public/r/button.json` は alias CSS と design-system token の両方、primary hover と destructive subtle pair を含む。`public/r/select.json` は opaque control surface を含む。FAIL、未分類 utility、配布 token 欠落があれば先へ進まない。

- [ ] **Step 7: format / lint / source diff を確認して commit する**

`npm run format`、`npm run lint`、`git diff --check` を通し、実差分 path を明示 stage して `fix: 配色の実利用契約を v1.8 へ揃える` で commit する。`public/r` は `registry:build` の生成物であり `.gitignore` どおり stage しない。生成物の正しさは `check-distribution` と Task 9 の fresh install probe で担保する。commit SHA は `GLOBAL_TOKEN_SHA` の strict descendant とする。

---

### Task 6: token build と strict contrast を local / CI の permanent gate にする

**Files:**
- Modify: `package.json`
- Modify: `scripts/check-all.mjs`
- Modify: `scripts/check-all.test.mjs`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Task 4 の exact artifact check と Task 5 で GREEN になった consumer contrast。
- Produces: `npm run check:design-tokens`、`npm run check:contrast`、`check:pre` / `check:all` / CI の独立 named steps。

- [ ] **Step 1: check-all の RED test を更新する**

期待する順序を exact list にする。

```js
[
  "check-standards.mjs",
  "build-tokens.mjs",
  "contrast.mjs",
  "check-completeness.mjs",
  "check-distribution.mjs",
  "check-preview-render.mjs",
  "check-evidence.mjs",
]
```

pre-flight は `evidence` だけを除き、contrast を実行する。CLI argv test も full / `--pre` の両方で同じ配列を参照する。

- [ ] **Step 2: test が CHECKS 不一致で落ちることを確認する**

Run: `node --test scripts/check-all.test.mjs`

Expected: design token check と `contrast.mjs` が未登録の理由で FAIL。

- [ ] **Step 3: package と check-all を実装する**

`package.json`:

```json
"check:design-tokens": "node src/styles/design-system/build-tokens.mjs --check",
"check:contrast": "node scripts/contrast.mjs"
```

`scripts/check-all.mjs` の standards 直後へ token build、その直後へ contrast を追加する。

```js
{
  name: "design tokens",
  command: process.execPath,
  args: ["src/styles/design-system/build-tokens.mjs", "--check"],
},
{ name: "contrast", command: process.execPath, args: ["scripts/contrast.mjs"] }
```

- [ ] **Step 4: CI に独立 step を追加する**

Unit tests の後、Standards check の前に置く。

```yaml
- name: Design token build
  run: npm run check:design-tokens
- name: Token contrast
  run: npm run check:contrast
```

- [ ] **Step 5: GREEN と偽 green の負の検査を確認する**

Run:

```bash
node --test scripts/check-all.test.mjs
npm run check:design-tokens
npm run check:contrast
npm run check:pre
```

Expected: 全て exit 0。test の mock runner は token build または contrast が失敗した場合に後続を実行せず throw する assertion を持つ。temp copy の `tokens.css` を古くした負の検査では design token check が non-zero になる。

- [ ] **Step 6: format / lint 後に commit する**

```bash
npm run format
npm run lint
git add package.json scripts/check-all.mjs scripts/check-all.test.mjs .github/workflows/ci.yml
git commit -m "ci: トークンコントラストを常設検査にする"
```

この commit 以降の review fix で source が変わらなければ、この SHA を `VERIFIED_IMPL_SHA` 候補にする。

---

### Task 7: review cycle を flag 0 まで回して実装 SHA を固定する

**Files:**
- Create: `.docs/reviews/brand-token-migration/implementation-review.md`
- Modify: flag 修正に必要な Task 所有 file のみ

**Interfaces:**
- Consumes: `origin/main...HEAD` の実装差分。
- Produces: flag 0 の clean round と、browser evidence が束縛する `VERIFIED_IMPL_SHA`。

- [ ] **Step 1: static gate を一度通す**

Run:

```bash
npm run format
npm run lint
npm run typecheck
node --test "scripts/*.test.mjs"
npm run check:design-tokens
npm run check:pre
npm run build
npm run check:props
```

Expected: 全 command exit 0。test 出力に tests が1以上あり fail 0。

- [ ] **Step 2: `parallel-review-cycle` の scope filter で review する**

review scope:

- correctness: generator artifact identity、RGB / alias parser、alpha 合成、AST class coverage、theme selector 同期、ancestor 判定、source class replacement、2層 registry sync
- security: path traversal、symlink、Git pathspec、CLI injection、temp probe cleanup
- requirements: v1.8 Invariants、A〜E、Select、4 gate、overlay、chart 5系列採用、brands 非配布、evidence immutability、fresh install

flag は correctness / security / 明示要件へ影響し確信度80%以上だけとし、optional を終了条件に数えない。

- [ ] **Step 3: flag を修正し clean round を得る**

flag があれば対象 test の RED を追加し、最小修正、targeted test、full gate、再 review の順に反復する。同一 flag が堂々巡りした場合だけ `.docs/risk-registry.md` へ accepted reason / anchor を記録する。

source / token / checker を修正した場合は `npm run registry:build` と Task 6 Step 5 を再実行し、commit する。

- [ ] **Step 4: review report を新規作成する**

```markdown
# ブランドトークン実装レビュー

- diff: origin/main...FINAL_IMPLEMENTATION_SHA
- flag: 0
- optional: 実際の内容または「なし」
- ACCEPTED_RISKS: 実際の内容または「なし」
- 実行した gate: command と exit code
- 見た範囲: parser / consumer / registry / evidence / CI
- 見ていない範囲: 実際に未確認の次元
```

- [ ] **Step 5: review report を commit し SHA を固定する**

```bash
git add .docs/reviews/brand-token-migration/implementation-review.md
git commit -m "docs: ブランドトークン実装のレビュー結果を記録する"
export VERIFIED_IMPL_SHA=$(git rev-parse HEAD)
git merge-base --is-ancestor "$GLOBAL_TOKEN_SHA" "$VERIFIED_IMPL_SHA"
test "$GLOBAL_TOKEN_SHA" != "$VERIFIED_IMPL_SHA"
```

Expected: ancestor check exit 0、SHA は異なる。

---

### Task 8: component 固有 evidence と shared aggregate を追加する

**Files:**
- Create: `GLOBAL_TOKEN_SHA..VERIFIED_IMPL_SHA` で変更された全 component の `.docs/reviews/brand-token-migration/2026-08-02-<name>-preview.md`
- Create: 変更された全 component に対応する `*-light.jpg` / `*-dark.jpg`
- Create: `.docs/reviews/brand-token-migration/catalog-light.jpg`
- Create: `.docs/reviews/brand-token-migration/catalog-dark.jpg`
- Create: `.docs/reviews/brand-token-migration/alert-dialog-{light,dark}.jpg`
- Create: `.docs/reviews/brand-token-migration/sheet-{light,dark}.jpg`
- Create: `.docs/reviews/brand-token-migration/chart-{light,dark}.jpg`
- Create: `.docs/reviews/brand-token-migration/disabled-controls-{light,dark}.jpg`
- Create: `.docs/reviews/brand-token-migration/report.md`

**Interfaces:**
- Consumes: Task 7 の immutable `VERIFIED_IMPL_SHA`。
- Produces: latest component evidence、`evidence_scope: shared-token-migration`、`targeted_dynamic_sha`。

- [ ] **Step 1: fixed implementation SHA から build する**

Run:

```bash
test "$(git rev-parse HEAD)" = "$VERIFIED_IMPL_SHA"
npm run build
for p in 4314 4324 4334 4344; do
  if ! lsof -nP -iTCP:$p -sTCP:LISTEN >/dev/null 2>&1; then
    export PREVIEW_PORT=$p
    break
  fi
done
test -n "$PREVIEW_PORT"
npx astro preview --host 127.0.0.1 --port "$PREVIEW_PORT"
```

Expected: 指定 port で preview が起動する。fallback したら停止する。

- [ ] **Step 2: changed component を両 theme で検証する**

次の route を light / dark で開く。

- `git diff --name-only "$GLOBAL_TOKEN_SHA".."$VERIFIED_IMPL_SHA" -- src/components/ui` から導出した全 changed component route。0件なら空走として停止する。
- alert-dialog、sheet
- input、textarea、native-select、input-group
- chart
- catalog

各 component で DOM、computed color / background、hover / focus / open state、console error、horizontal overflow を確認する。interactive state は実 pointer / keyboard event で作る。forced theme は同じ evaluate 内で `.dark` と `data-theme="dark"` を同時に切り替え、各 route で両者が一致することを assert する。

- [ ] **Step 3: exact visual contract を確認する**

- Button / Badge / Bubble: primary hover が opaque `primary-hover`、destructive default / hover が v1.8 subtle pair + state tint で 4.5:1 以上。
- Attachment / Alert / Menubar: destructive text が alpha なしの subtle foreground。
- destructive 系は少なくとも1件、ブラウザで取得した foreground / background の computed color から算出した contrast と sensor の同一 case の比率を照合し、gamma-encoded sRGB 合成の実経路が一致することを確認する。
- ContextMenu / DropdownMenu の solid destructive focus は class を維持し、light / dark とも computed contrast が 4.5:1 以上であることを確認する。shared report へ solid AA のため `destructive` alias を `color-status-danger-text` にしたことと、`color-status-danger` は subtle / indicator で使用を継続することを記録する。
- `aria-invalid` の `border-destructive` / `ring-destructive` は light / dark とも 3:1 の nontext sensor と browser computed color で確認する。
- Tabs: inactive light / dark が opaque muted foreground、active は foreground。
- Select comparison: light / dark の placeholder Select と Input が同じ opaque surface / control border へ解決される。before report の solid Select / alpha Input との差を記録する。
- disabled controls: disabled state が描画され、AA exempt だが文字消失、背景欠落、cursor / disabled semantics の回帰がない。
- disabled Select: pointer hover 前後で `background-image` が `none` のまま、NativeSelect は wrapper opacity 1 / control opacity `--opacity-disabled`、InputGroup は wrapper opacity `--opacity-disabled` / control opacity 1 で、状態 opacity が二重に合成されない。
- AlertDialog / Dialog / Drawer / Sheet: overlay の computed color が black 10%、backdrop blur が有効、open content の focus / close が既存契約を維持する。
- Chart: `--chart-1` から `--chart-5` が v1.8 `--chart-series-*` へ解決され、light / dark で5系列と dash pattern が識別できる。
- catalog: light / dark で全 preview、console error なし、horizontal overflow なし。

- [ ] **Step 4: JPEG を新規保存する**

component ごとの light / dark、catalog、AlertDialog、Sheet、disabled controls を `Page.captureScreenshot format: jpeg` で保存する。既存画像を上書きしない。

- [ ] **Step 5: component report を新規作成する**

各 report の先頭へ次を置く。

```markdown
verified_impl_sha: VERIFIED_IMPL_SHAの40桁実値
```

本文には route、theme、state、computed style、contrast、keyboard / pointer、console、画像 path、見た範囲 / 見ていない範囲を記録する。画像取得方法と `.jpg` 実体の一致を1行入れる。

最終 report には、vendored `design-tokens.html` の spec page で Biome が検出した type 無し button と noninteractive `div[tabindex]` などの a11y error、および Clipboard API の reject を空 handler で握りつぶす挙動を、配布 CSS へ影響しない v1.8 側の改善候補として1行記録する。

- [ ] **Step 6: shared aggregate report を作成する**

`.docs/reviews/brand-token-migration/report.md` の先頭を exact field にする。

```markdown
verified_impl_sha: VERIFIED_IMPL_SHAの40桁実値
evidence_scope: shared-token-migration
targeted_dynamic_sha: VERIFIED_IMPL_SHAの40桁実値
```

本文に token build の Run 行すべて、text-aa / nontext-ui / disabled-exempt / decorative の case 別結果、sidebar-border の DESIGN.md §8 根拠、chart 5系列採用、theme 属性同期、before / after Select、registry build、全 targeted route を記録する。

- [ ] **Step 7: evidence の magic / coverage / component hard gate を確認する**

Run:

```bash
node scripts/check-evidence.mjs
npm run check:all
git diff --quiet "$VERIFIED_IMPL_SHA" -- src/components/ui src/previews src/styles src/layouts scripts/preview-theme.test.mjs
```

Expected: 全て exit 0。`global.css` と design-system token の stale は valid aggregate で covered、changed component の最新 evidence は新 report、implementation source は verified SHA 以降の committed / staged / unstaged 差分がない。

- [ ] **Step 8: evidence を commit する**

```bash
git add .docs/reviews/brand-token-migration
git commit -m "docs: ブランドトークンの実ブラウザ証跡を追加する"
```

画像または report の取得後に source を直した場合、この commit を作らず Task 7 へ戻る。

---

### Task 9: fresh install で source と token 到達を実証する

**Files:**
- Create: `.docs/reviews/brand-token-migration/fresh-install.md`

**Interfaces:**
- Consumes: Task 8 と同じ `VERIFIED_IMPL_SHA` の `public/r`。
- Produces: repository 外 consumer への source / token / legal / build 到達記録。

- [ ] **Step 1: registry を build し空き port を固定する**

```bash
export UI_DIR=$(pwd)
npm run registry:build
npm run registry:legal
for p in 3013 3023 3033 3043; do
  if ! lsof -nP -iTCP:$p -sTCP:LISTEN >/dev/null 2>&1; then
    export UI_PORT=$p
    break
  fi
done
test -n "$UI_PORT"
npx serve public -l "$UI_PORT"
```

- [ ] **Step 2: `mktemp` の fresh Vite project へ install する**

```bash
export PROBE_ROOT=$(mktemp -d /tmp/elchika-brand-probe.XXXXXX)
export SHADCN_VERSION=$(tr -d '\n' < .shadcn-cli-version)
cd "$PROBE_ROOT"
npx "shadcn@$SHADCN_VERSION" init --template vite --base base --preset nova -y --no-monorepo --name probe
cd probe
npx "shadcn@$SHADCN_VERSION" add --overwrite "http://127.0.0.1:$UI_PORT/r/button.json" "http://127.0.0.1:$UI_PORT/r/select.json"
```

Expected: install exit 0。別 port へ fallback した場合は停止する。

- [ ] **Step 3: source contract と法務ファイルの実体を確認する**

Run:

```bash
test -s src/components/ui/button.tsx
test -s src/components/ui/select.tsx
test -s elchika-ui/tokens.css
test -s elchika-ui/design-system/tokens.css
test -s elchika-ui/LICENSE
test -s elchika-ui/THIRD_PARTY_LICENSES
rg -n "bg-primary-hover|destructive-subtle|state-hover" src/components/ui/button.tsx
rg -n "bg-card|border-input" src/components/ui/select.tsx
```

Expected: 全 command exit 0。source class は実出力に存在する。

- [ ] **Step 4: installed alias / generated tokens と host の正本を比較する**

Node script で `elchika-ui/tokens.css` と host `src/styles/global.css`、`elchika-ui/design-system/tokens.css` と host generated token をそれぞれ byte 比較する。さらに alias map を読み、少なくとも次を個別 assertion する。

```js
for (const name of [
  "primary-hover",
  "destructive-subtle",
  "destructive-subtle-foreground",
  "muted-foreground",
  "sidebar",
  "sidebar-border",
  "chart-1",
]) {
  if (got.light[name] !== want.light[name] || got.dark[name] !== want.dark[name])
    throw new Error(`${name}: 配布 alias が正本と一致しない`);
}
```

Expected: 2 file の bytes、alias key set と全 valueが一致し exit 0。global alias の relative import が `./design-system/tokens.css` であり、自己 import でないことも assert する。

- [ ] **Step 5: consumer CSS import と build を確認する**

probe の `src/index.css` の既存 import 後へ次を `apply_patch` で追加する。

```css
@import "../elchika-ui/tokens.css";
```

Run: `npm run build`

Expected: exit 0。build output CSS に `--color-bg-canvas`、`--state-hover-bg`、`--primary-hover` が含まれ、import 解決 error がない。

build 後に候補 `4315 / 4325 / 4335 / 4345` から空き port を `PROBE_PORT` に固定して `npm run preview -- --host 127.0.0.1 --port "$PROBE_PORT"` を起動する。別 port へ fallback したら停止する。実ブラウザで同一 root と `background: var(--background)` の fixture を使い、次を同じ evaluate 内で順に実測する。

- light: `.dark` なし、`data-theme="light"`
- class only: `.dark` あり、`data-theme="light"`
- data only: `.dark` なし、`data-theme="dark"`
- synchronized dark: `.dark` あり、`data-theme="dark"`

class only は `color-scheme` だけ dark、data only は generated token だけ dark になる不一致を確認し、synchronized dark では fixture の computed background が light と異なり `color-scheme: dark` になることを assertion する。確認後に probe preview を停止する。

- [ ] **Step 6: probe 結果を新規 report へ記録する**

`.docs/reviews/brand-token-migration/fresh-install.md`:

```markdown
# ブランドトークン fresh install 検証

verified_impl_sha: VERIFIED_IMPL_SHAの40桁実値

- registry URL: 実際の URL
- shadcn exact version: 実値
- source 到達: Button / Select の実測
- alias / generated token の byte 一致と relative import 解決: 実測
- legal file: test -s の実測
- consumer build: command と exit code
- theme selector: class only / data only の不一致と、同期した dark の computed background / color-scheme
```

- [ ] **Step 7: 元 repoへ戻って probe を片付ける**

```bash
cd "$UI_DIR"
test "$PROBE_ROOT" != "/tmp"
test -n "$PROBE_ROOT"
rm -rf "$PROBE_ROOT"
```

serve を停止し、port の LISTEN と HTTP 接続が消えたことを確認する。

- [ ] **Step 8: report を commit する**

```bash
node scripts/check-evidence.mjs
git add .docs/reviews/brand-token-migration/fresh-install.md
git commit -m "docs: ブランドトークンの外部導入結果を記録する"
```

---

### Task 10: 最終 gate、PR、Claude 報告を完了する

**Files:**
- Modify only if review flag: task 所有 file
- Create: PR body（GitHub 上）

**Interfaces:**
- Consumes: 全 implementation / evidence / probe commit。
- Produces: flag 0、clean worktree、PR、最終 head に束縛した CI evidence。

- [ ] **Step 1: repository 全体の backstop を実行する**

Run:

```bash
npm run format
npm run lint
npm run typecheck
node --test "scripts/*.test.mjs"
npm run check:design-tokens
npm run check:all
npm run build
npm run check:props
node scripts/check-distribution.mjs
git diff --check
git status --short
```

Expected: 全 command exit 0、tests は1以上、fail 0、worktree clean。format が変更を作った場合は対象 path を明示 commit し、Task 8 以降の鮮度を再判定する。

- [ ] **Step 2: 負の検査を最終状態で再実行する**

- contrast fixture を 4.5 未満へ変えた temp CSS は `checkContrastInRepo` problem を返す。
- temp copy の generated `tokens.css` を古くすると design token check exit 1、通常生成後は exit 0。
- source へ未分類 alpha utility を未commitで追加すると contrast checker exit 1。原状復帰後 exit 0。
- opening quote 直後の alpha utility を AST scanner が拾い、arbitrary variant 内 quote の class 断片を拾わない。
- `html.dark` と `data-theme=dark` の片方だけを temp fixture で変更すると theme sync test が fail-closed。
- verified component source を未commitで変更すると evidence checker exit 1。原状復帰後 exit 0。
- `global.css` または design-system `tokens.css` を未commitで変更すると shared coverage が不成立になる。原状復帰後 exit 0。
- aggregate report の `targeted_dynamic_sha` 欄を temp repo test で欠落させると fail-closed。
- registry item から alias token または design-system token を temp copy 上で外すと distribution checker exit 1。

repo file を直接壊す場合は exact path の backup と restore を行い、最後に `git status --short` が空であることを確認する。

- [ ] **Step 3: final review clean round を行う**

`origin/main...HEAD` を correctness / security / requirements で再 review する。Task 7 後の evidence と probe も scope に含める。flag が出たら修正し、source に触れた場合は Task 7、8、9 を順にやり直す。

- [ ] **Step 4: push して PR を作成する**

```bash
git push -u origin feat/brand-tokens
gh pr create --base main --head feat/brand-tokens --title "feat: ブランドトークンと配色契約を導入する" --body-file /tmp/ui-brand-token-pr.md
```

PR body は次を含む。

- v1.8 HTML 正本 / generated token / shadcn alias と A〜E の要約
- shared coverage と strict contrast sensor
- generator の exact artifact comparison と AST class coverage
- text-aa / nontext-ui / disabled-exempt / decorative の分類
- Select before / after、4 overlay、catalog、fresh install の evidence permalink
- `.dark` / `data-theme` 同期、RISK-006 mitigated、chart 5系列採用
- 実行した command と exit code
- review cycle flag 0
- npm publish / deploy / brands runtime 配布が scope 外であること

- [ ] **Step 5: final head に束縛した CI を確認する**

```bash
export FINAL_HEAD=$(git rev-parse HEAD)
gh pr checks --watch
gh run list --branch feat/brand-tokens --workflow ci.yml --limit 10 --json databaseId,headSha,conclusion
```

`headSha == FINAL_HEAD` の run だけを選び、全 step の name / conclusion を API で読み戻す。Design token build と Token contrast の両 step が実在して success であることを個別確認する。

- [ ] **Step 6: PR 本文を読み戻し Claude へ最終報告する**

Run:

```bash
gh pr view --json number,url,headRefOid,body
git status --short --branch
```

Claude へ agmsg で次を送る。

- PR URL / number / final SHA
- review flag 0
- final CI run ID / head SHA
- contrast / evidence / fresh install / browser の実測結果
- RISK-006 mitigated、chart 5系列採用、brands 非配布
- deploy、merge を実施していないこと

人間が merge するまで `main` を変更しない。

---

## Self-Review

### Spec coverage

- shared coverage: Task 2、Task 8、Task 10 の uncommitted negative test。
- v1.8 HTML 正本 / generated artifact identity: Task 4、Task 6、Task 10。
- contrast actual consumer / alpha: Task 3、Task 5、Task 6。
- AST class coverage と fail-closed parser: Task 3、Task 10。
- A〜E: Task 4 と Task 5。
- Select dark input: Task 1 before、Task 5 source、Task 8 after。
- `.dark` / `data-theme` 同期: Task 4 unit、Task 8 browser、Task 10 negative test。
- disabled gate: Task 3 case、Task 8 browser。
- overlay 4件: Task 5 と Task 8。
- sidebar alias / decorative rationale: Task 4、Task 8 aggregate。
- chart 5系列採用: Task 4 alias、Task 8 browser、Task 9 配布比較。
- alias / generated token の2層 registry と fresh install: Task 5、Task 9。
- provenance.modified: Task 5。
- review flag 0 / PR: Task 7、Task 10。

未カバーの裁定はない。

### Placeholder scan

未確定記号や後続任せの抽象表現は使っていない。`BASELINE_SHA`、`VERIFIED_IMPL_SHA`、`GLOBAL_TOKEN_SHA` は実行時に Git から取得して report へ40桁実値を入れる変数名であり、成果物へ placeholder のまま残さないことを各 Task に明記した。

### Interface consistency

- evidence: `parseSingleField`、`latestByAddition`、`inspectSharedTokenCoverage`、`summarizeStale` を Task 2 で定義し、Task 4 で runtime token 2 path へ拡張する。
- contrast: `parseThemes`、`resolveToken`、`extractClassTokens`、`composite`、`contrastRatio`、`evaluateCase`、`checkContrastInRepo` を Task 3 で定義し、Task 5 / 6 が同じ CLI を使う。
- gate 名は `text-aa` / `nontext-ui` / `disabled-exempt` / `decorative` の4種類で全 Task 一致する。
- alias は `primary-hover` / `destructive-subtle` / `destructive-subtle-foreground` / `state-*` で CSS、Tailwind、consumer、registry、probe の名前が一致する。
- `.docs/PROJECT_GOAL.md` と README は、v1.8 HTML 正本 → generated token → shadcn alias → registry の実態と一致する。
- evidence structured field は `evidence_scope: shared-token-migration` / `targeted_dynamic_sha` で設計と Task 2 / 8 が一致する。

## Known Risks During Execution

- Base UI / Tailwind の computed color 表記が変わった場合、文字列表記を正規化せず sRGB channel の実値で比較する。
- `npx serve` は port 占有時に別 port へ fallback するため、候補を事前確認し実 URL と一致しなければ停止する。
- shadcn CLI の latest は使わず `.shadcn-cli-version` の exact version を使う。
- `public/r` は生成物だが task 所有であり、consumer source または token を変更した後は必ず再生成する。
- `tokens.css` という basename は alias 配布物と v1.8 生成物で重なるため、生成物の `design-system/` directory を平坦化しない。
- `.dark` と `data-theme` の一方だけを操作すると部分 theme になるため、forced theme も含め常に同時更新する。
- v1.8 `tokens.css` は layer import し、今回 scope 外の base typography / focus rule が既存 UI を上書きしていないことを browser で確認する。
- coverage report の SHA を evidence commit 自身へ更新しない。自己参照の固定点は存在しない。
- browser evidence 後に source を変更した場合、画像の一部流用をせず Task 7 からやり直す。
