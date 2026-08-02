# ブランドトークン移行 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ブランド token を light / dark、実 consumer、registry 配布、strict contrast sensor、SHA 固定の実ブラウザ証跡まで一貫して移行する。

**Architecture:** `global.css` を token の唯一の正本とし、registry は既存同期 script で導出する。contrast は declarative consumer case と source utility coverage を分離し、gamma-encoded sRGB 合成で評価する。component 固有証跡の hard gate は維持し、shared token だけを一意な aggregate report で cover する。

**Tech Stack:** Node.js 22.12+、Astro 7、React 19、Base UI 1.6、Tailwind CSS v4、Biome 2、Node test runner、shadcn CLI 4.16、Chrome DevTools Protocol。

## Global Constraints

- `standards` リポジトリは読み取り専用。書き込み、commit、push をしない。
- 作業 branch は `feat/brand-tokens`。`main` へ直接 commit / push / merge しない。
- この計画 SHA を Claude が確認するまで、Task 1 以降を実行しない。
- 指示、実装、実測のいずれかが矛盾したら推測で補わず Claude へ報告し、影響範囲を止める。
- コミットメッセージ、PR 本文、文書、コメントは日本語で書く。
- repo 内の text file は `apply_patch` で編集する。生成 command による mechanical rewrite は許可する。
- stage は task 所有 path を明示する。`git add -A` と `git add .` を使わない。
- Task 4 以降は commit 前に `npm run format` と `npm run lint` を実行し、lint が exit 0 でなければ commit しない。
- 検証 command に pipe を挟まない。出力解析が必要なら一度 file へ保存し、元 command の exit code を保持する。
- 変動する件数を Expected に固定しない。空走 guard は「0件でないこと」のみ許可する。
- RED の負の検査、uncommitted 差分、`test -s`、`git ls-files`、fresh install、light / dark の動的検証を省略しない。
- 既存 evidence を編集・削除・rename しない。再検証は `.docs/reviews/brand-token-migration/` へ新規 file として追加する。
- `verified_impl_sha` は画像を取得した実装 commit を指す。evidence commit 自身を自己参照させない。
- review cycle は correctness / security / 明示要件の flag と optional を分離し、flag 0 または `ACCEPTED_RISKS` 明示受容まで反復する。
- chart token は変更しない。overlay は両 theme とも `oklch(0 0 0 / 10%)` を維持する。

---

## File Structure

| path | 責務 |
|---|---|
| `scripts/check-evidence.mjs` | 全履歴の形式・immutability、component hard gate、shared aggregate coverage、stale 要約 |
| `scripts/check-evidence.test.mjs` | coverage の祖先関係、uncommitted 差分、fail-closed、stale 要約の回帰 |
| `scripts/contrast.mjs` | token parser、alias 解決、OKLCH/sRGB 変換、alpha 合成、gate 評価、CLI |
| `scripts/contrast-cases.mjs` | consumer と source utility の declarative contract |
| `scripts/contrast.test.mjs` | gamma 合成、parser、gate、source coverage、accepted-risk bridge の回帰 |
| `src/styles/global.css` | light / dark token の唯一の正本 |
| `src/components/ui/*.tsx` | alpha 配色と overlay の consumer 正規化 |
| `src/previews/button.tsx` | primary / destructive の通常面と muted 最悪面の可視化 |
| `src/previews/select.tsx` | Select placeholder と他 form control の dark background 比較 |
| `provenance.json` | 上流との差分である consumer 正規化の記録 |
| `.docs/risk-registry.md` | warning mitigation と chart palette 先送り |
| `.docs/PROJECT_GOAL.md` / `README.md` | 初期 token 同一性からブランド token の継続契約へ更新 |
| `registry.json` / `public/r` | `global.css` と component source から生成する配布物 |
| `package.json` / `scripts/check-all.mjs` / `.github/workflows/ci.yml` | strict contrast の常設 gate |
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
- Consumes: `src/styles/global.css`、`.docs/risk-registry.md`、`src/components/ui/*.tsx`。
- Produces: `parseThemes(css)`、`resolveToken(themes, theme, name)`、`composite(fg, bg)`、`contrastRatio(fg, bg)`、`evaluateCase(case, themes)`、`checkContrastInRepo(root)`、`CONSUMER_CASES`。

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

- `:root` と `.dark` が両方必須。
- `oklch(L C H / 10%)` の intrinsic alpha を読む。
- `var(--card)` の multi-hop alias を解決する。
- missing alias と cycle を problem にする。
- `text-aa` は 4.5 未満、`nontext-ui` は 3 未満で problem。
- `disabled-exempt` と `decorative` は ratio を出すが AA problem にしない。
- 全 case は空でない `reason` を必須にする。
- source に存在する semantic slash alpha utility が case から漏れたら problem。
- case の `sourceClasses` が source から消えたら problem。
- accepted `RISK-006` は現行 warning FAIL だけを受容し、PASS 後も accepted なら stale risk problem。

- [ ] **Step 3: test が未実装で落ちることを確認する**

Run: `node --test scripts/contrast.test.mjs`

Expected: module / export が存在しない理由で FAIL。

- [ ] **Step 4: parser と色計算を実装する**

`scripts/contrast.mjs` は CLI branch を `pathToFileURL(process.argv[1])` で分離し、test import 時に process を終了しない。色は次の shape へ正規化する。

```js
// gamma-encoded sRGB channel と alpha
{ rgb: [number, number, number], alpha: number }
```

class slash alpha は token intrinsic alpha と乗算する。foreground alpha は最終 background 上へ、background alpha は underlay 上へ合成する。

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

scanner は次の utility family を対象にする。

```js
const ALPHA_UTILITY = /(?:^|\s)((?:[^\s"']+:)*(?:bg|text|border|ring|stroke|fill)-[a-z][a-z0-9-]*\/[0-9]+)(?=\s|["'])/g;
```

`src/components/ui/*.tsx` の unique `path + exact utility` と case の `source + sourceClasses` を双方向比較する。`bg-black/10` は semantic 違反として Task 5 で消すまで explicit legacy case に入れ、移行後は legacy case を削除する。

- [ ] **Step 7: 現行 repository で sensor が欠陥を検出することを確認する**

Run:

```bash
node --test scripts/contrast.test.mjs
node scripts/contrast.mjs
```

Expected: unit test は exit 0。CLI は exit 1 で、出力に Tabs inactive、primary `/80` hover、destructive subtle / alpha text の FAIL label が含まれる。`RISK-006` は accepted risk として明示表示される。他の未知 FAIL が出たら Task 4 へ進まず報告する。

- [ ] **Step 8: strict sensor を gate へ未接続のまま commit する**

```bash
npm run format
npm run lint
git add scripts/contrast.mjs scripts/contrast-cases.mjs scripts/contrast.test.mjs
git commit -m "test: 実利用配色のコントラスト検査を追加する"
```

`package.json`、`check-all.mjs`、CI はまだ変更しない。CLI が RED の間に permanent gate へ接続しない。

---

### Task 4: ブランド token と risk registry を更新する

**Files:**
- Modify: `src/styles/global.css`
- Modify: `.docs/risk-registry.md`
- Modify: `.docs/PROJECT_GOAL.md`
- Modify: `README.md`
- Modify generated: `registry.json`

**Interfaces:**
- Consumes: Task 3 の parser / cases。Task 5 の consumer が参照する token 名。
- Produces: `--primary-hover`、`--destructive-subtle-foreground`、確定 light / dark token、sidebar alias、mitigated RISK-006、accepted RISK-013。

- [ ] **Step 1: `@theme inline` に新 token mapping を追加する**

```css
--color-primary-hover: var(--primary-hover);
--color-destructive-subtle-foreground: var(--destructive-subtle-foreground);
```

- [ ] **Step 2: `:root` の color token を exact block へ置換する**

font、radius、layout token、media query は変更しない。chart は現行値を維持する。

```css
--background: oklch(0.9734 0.0013 286.38);
--foreground: oklch(0.2265 0.0102 268.23);
--overlay: oklch(0 0 0 / 10%);
--card: oklch(1 0 0);
--card-foreground: oklch(0.2265 0.0102 268.23);
--popover: oklch(1 0 0);
--popover-foreground: oklch(0.2265 0.0102 268.23);
--primary: oklch(0.5204 0.1841 263.88);
--primary-hover: oklch(0.3834 0.1448 265.84);
--primary-foreground: oklch(1 0 0);
--secondary: oklch(0.9489 0.0029 264.54);
--secondary-foreground: oklch(0.2265 0.0102 268.23);
--muted: oklch(0.9489 0.0029 264.54);
--muted-foreground: oklch(0.5131 0.0135 264.45);
--accent: oklch(0.9368 0.0242 267.93);
--accent-foreground: oklch(0.3834 0.1448 265.84);
--destructive: oklch(0.5650 0.1774 22.67);
--destructive-foreground: oklch(1 0 0);
--destructive-subtle-foreground: oklch(0.4621 0.1633 24.39);
--success: oklch(0.5481 0.1131 162.54);
--success-foreground: oklch(1 0 0);
--warning: oklch(0.8340 0.1584 88.96);
--warning-foreground: oklch(0.2265 0.0102 268.23);
--border: oklch(0.9060 0.0046 258.33);
--input: oklch(0.8381 0.0077 260.73);
--ring: oklch(0.5204 0.1841 263.88);
```

- [ ] **Step 3: `.dark` の color token を exact block へ置換する**

```css
--background: oklch(0.2047 0.0104 268.17);
--foreground: oklch(0.9734 0.0013 286.38);
--overlay: oklch(0 0 0 / 10%);
--card: oklch(0.2393 0.0142 266.97);
--card-foreground: oklch(0.9734 0.0013 286.38);
--popover: oklch(0.2393 0.0142 266.97);
--popover-foreground: oklch(0.9734 0.0013 286.38);
--primary: oklch(0.6775 0.1440 266.26);
--primary-hover: oklch(0.7513 0.1107 267.16);
--primary-foreground: oklch(0.2047 0.0104 268.17);
--secondary: oklch(0.2849 0.0175 266.34);
--secondary-foreground: oklch(0.9734 0.0013 286.38);
--muted: oklch(0.2849 0.0175 266.34);
--muted-foreground: oklch(0.7047 0.0188 264.45);
--accent: oklch(0.2849 0.0175 266.34);
--accent-foreground: oklch(0.7513 0.1107 267.16);
--destructive: oklch(0.7081 0.1528 19.78);
--destructive-foreground: oklch(0.2047 0.0104 268.17);
--destructive-subtle-foreground: oklch(0.8218 0.1004 16.40);
--success: oklch(0.7212 0.1420 162.45);
--success-foreground: oklch(0.2047 0.0104 268.17);
--warning: oklch(0.8687 0.1321 90.37);
--warning-foreground: oklch(0.2047 0.0104 268.17);
--border: oklch(0.3597 0.0202 266.00);
--input: oklch(0.4312 0.0244 267.00);
--ring: oklch(0.6775 0.1440 266.26);
```

- [ ] **Step 4: sidebar を両 theme で alias 化する**

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

- [ ] **Step 5: RISK-006 を mitigated にし RISK-013 を追加する**

RISK-006 は status を `mitigated` にし、reason に warning foreground のブランド token 置換で 4.5:1 以上へ是正したこと、anchor に `scripts/contrast.mjs` の strict case と本計画を記録する。

追加 entry は次の内容を使う。

```markdown
## RISK-013: chart palette を旧無彩色のまま維持する
- date: 2026-08-02
- confidence: high
- location: `src/styles/global.css` の `--chart-1` から `--chart-5`
- status: accepted
- reason: ブランド2色から5色を機械導出すると、系列間の識別性と色覚多様性を検証できない。今回の token 移行では現行無彩色を保持し、chart palette を独立した設計作業へ送る。
- anchor: `scripts/contrast.mjs` が text / UI token の実 consumer を検査し、`.docs/reviews/brand-token-migration/report.md` が Chart の light / dark 表示を現行 palette のまま記録する。palette 設計時は本 entry を mitigated に変更する。
```

- [ ] **Step 6: PROJECT_GOAL と README の token 契約を更新する**

`.docs/PROJECT_GOAL.md` の DoneCriteria 3 を次へ置換する。

```markdown
3. `src/styles/global.css` が standards 準拠の semantic token 構造と elchika ブランド値の正本であり、和文フォールバック・`--success`・`prefers-reduced-motion` を含む。実 consumer の text / non-text contrast は `scripts/contrast.mjs` で検査され、registry へ同じ token が配布される。
```

README の Features は次へ置換する。

```markdown
- standards 準拠の semantic token 構造と elchika ブランド値を同梱（light / dark 対応）
```

Architecture の `src/styles/` コメントも次へ更新する。

```text
styles/          # standards 準拠の semantic token と elchika ブランド値
```

- [ ] **Step 7: registry token を正本から同期する**

Run: `npm run registry:tokens`

Expected: exit 0。出力件数を Expected に転記しない。

- [ ] **Step 8: parser、risk bridge、format、lint を確認する**

Run:

```bash
node --test scripts/contrast.test.mjs
node scripts/contrast.mjs
npm run format
npm run lint
```

Expected: unit test、format、lint は exit 0。CLI は consumer source が未修正なので primary hover、Tabs、destructive の既知 FAIL だけで exit 1。warning は PASS し、RISK-006 stale accepted problem は出ない。

- [ ] **Step 9: token commit を consumer commit と分ける**

```bash
git add src/styles/global.css .docs/risk-registry.md .docs/PROJECT_GOAL.md README.md registry.json
git commit -m "feat: ブランドトークンを導入する"
```

この commit を `GLOBAL_TOKEN_SHA` とする。Task 6 の最終実装 SHA はこの strict descendant でなければならない。

---

### Task 5: consumer、preview、provenance を正規化する

**Files:**
- Modify: `src/components/ui/attachment.tsx`
- Modify: `src/components/ui/alert.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/bubble.tsx`
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/drawer.tsx`
- Modify: `src/components/ui/menubar.tsx`
- Modify: `src/components/ui/select.tsx`
- Modify: `src/components/ui/tabs.tsx`
- Modify: `src/previews/button.tsx`
- Modify: `src/previews/select.tsx`
- Modify: `scripts/contrast-cases.mjs`
- Modify: `provenance.json`
- Modify generated: `registry.json`, `public/r/*.json`

**Interfaces:**
- Consumes: Task 4 の `primary-hover`、`destructive-subtle-foreground`、opaque input。
- Produces: contrast CLI が exit 0 になる actual consumer contract と最新 registry source。

- [ ] **Step 1: exact class 置換を適用する**

| file | before | after |
|---|---|---|
| `button.tsx` | `hover:bg-primary/80` | `hover:bg-primary-hover` |
| `badge.tsx` | `[a]:hover:bg-primary/80` | `[a]:hover:bg-primary-hover` |
| `bubble.tsx` default | `hover:bg-primary/80` | `hover:bg-primary-hover` |
| `button.tsx` destructive | `text-destructive` | `text-destructive-subtle-foreground` |
| `badge.tsx` destructive | `text-destructive` | `text-destructive-subtle-foreground` |
| `bubble.tsx` destructive | `text-destructive` | `text-destructive-subtle-foreground` |
| `attachment.tsx` error preview | `text-destructive` | `text-destructive-subtle-foreground` |
| `attachment.tsx` error description | `text-destructive/80` | `text-destructive-subtle-foreground` |
| `alert.tsx` description | `text-destructive/90` | `text-destructive-subtle-foreground` |
| `menubar.tsx` destructive text / focus / icon | `text-destructive` | `text-destructive-subtle-foreground` |
| `tabs.tsx` inactive | `text-foreground/60 ... dark:text-muted-foreground` | `text-muted-foreground`。dark duplicate を削除 |
| `select.tsx` trigger | `dark:bg-input` | `dark:bg-input/30` |
| `dialog.tsx` overlay | `bg-black/10` | `bg-overlay` |
| `drawer.tsx` overlay | `bg-black/10` | `bg-overlay` |

destructive の background `/10`、`/20`、`/30` は変更しない。ContextMenu / DropdownMenu の solid destructive pair は変更しない。

- [ ] **Step 2: Button preview に muted 最悪面を追加する**

既存 variant 群を維持し、次を追加する。

```tsx
<div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted p-3">
  <Button>muted 上の保存</Button>
  <Button variant="destructive">muted 上の削除</Button>
</div>
```

- [ ] **Step 3: Select preview に form control comparison を追加する**

`Input` を import し、既存 defaultOpen Select を維持したまま次を追加する。

```tsx
<div data-slot="select-input-comparison" className="grid max-w-sm gap-2">
  <Input aria-label="比較用入力" placeholder="入力してください" />
  <Select>
    <SelectTrigger aria-label="比較用選択">
      <SelectValue placeholder="選択してください" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="standard">Standard（標準）</SelectItem>
    </SelectContent>
  </Select>
</div>
```

catalog mode では追加 Select も閉じたままにする。

- [ ] **Step 4: provenance.modified を実差分へ更新する**

既存 wording を削除せず、対象 entry の `modified` に次を反映する。

| component | 追加する実差分 |
|---|---|
| attachment | destructive subtle foreground への正規化 |
| alert | destructive description の opaque subtle foreground 化 |
| badge | opaque primary hover と destructive subtle foreground |
| button | opaque primary hover と destructive subtle foreground |
| bubble | opaque primary hover と destructive subtle foreground |
| dialog | hardcoded black overlay の semantic token 化 |
| drawer | hardcoded black overlay の semantic token 化 |
| menubar | destructive subtle foreground |
| select | dark input surface を他 form control と `/30` へ統一 |
| tabs | inactive foreground alpha を opaque muted foreground へ変更 |

`sourceUrl`、upstream SHA、取得日、hash は変更しない。

- [ ] **Step 5: contrast case の source contract を after class へ更新する**

Task 3 の legacy `bg-black/10` case を削除し、Dialog / Drawer を `bg-overlay` case へ含める。primary hover、destructive subtle、Tabs、Select の `sourceClasses` を Step 1 の after 値へ変更する。

- [ ] **Step 6: strict contrast が GREEN になることを確認する**

Run:

```bash
node --test scripts/contrast.test.mjs
node scripts/contrast.mjs
```

Expected: 両方 exit 0。CLI の全 `text-aa` / `nontext-ui` case は PASS、disabled / decorative は gate 名と reason を表示する。FAIL または未分類 utility があれば先へ進まない。

- [ ] **Step 7: registry 配布物を再生成する**

Run:

```bash
npm run registry:build
npm run registry:legal
node scripts/check-distribution.mjs
```

Expected: すべて exit 0。`public/r/button.json` に `bg-primary-hover` と `text-destructive-subtle-foreground`、`public/r/select.json` に `dark:bg-input/30`、両 item の token file に新 token が含まれる。

- [ ] **Step 8: format / lint / source diff を確認して commit する**

```bash
npm run format
npm run lint
git diff --check
git add src/components/ui/attachment.tsx src/components/ui/alert.tsx src/components/ui/badge.tsx src/components/ui/button.tsx src/components/ui/bubble.tsx src/components/ui/dialog.tsx src/components/ui/drawer.tsx src/components/ui/menubar.tsx src/components/ui/select.tsx src/components/ui/tabs.tsx src/previews/button.tsx src/previews/select.tsx scripts/contrast-cases.mjs provenance.json registry.json
git add public/r/*.json public/r/LICENSE public/r/THIRD_PARTY_LICENSES
git commit -m "fix: alpha 配色の実利用契約を是正する"
```

Expected: commit SHA は `GLOBAL_TOKEN_SHA` の strict descendant。

---

### Task 6: strict contrast を local / CI の permanent gate にする

**Files:**
- Modify: `package.json`
- Modify: `scripts/check-all.mjs`
- Modify: `scripts/check-all.test.mjs`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Task 5 で GREEN になった `node scripts/contrast.mjs`。
- Produces: `npm run check:contrast`、`check:pre` / `check:all` / CI の named Token contrast step。

- [ ] **Step 1: check-all の RED test を更新する**

期待する順序を exact list にする。

```js
[
  "check-standards.mjs",
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

Expected: `contrast.mjs` が未登録の理由で FAIL。

- [ ] **Step 3: package と check-all を実装する**

`package.json`:

```json
"check:contrast": "node scripts/contrast.mjs"
```

`scripts/check-all.mjs` の standards 直後へ追加する。

```js
{ name: "contrast", command: process.execPath, args: ["scripts/contrast.mjs"] }
```

- [ ] **Step 4: CI に独立 step を追加する**

Unit tests の後、Standards check の前に置く。

```yaml
- name: Token contrast
  run: npm run check:contrast
```

- [ ] **Step 5: GREEN と偽 green の負の検査を確認する**

Run:

```bash
node --test scripts/check-all.test.mjs
npm run check:contrast
npm run check:pre
```

Expected: 全て exit 0。test の mock runner は contrast が失敗した場合に後続を実行せず throw する assertion を持つ。

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
npm run check:pre
npm run build
npm run check:props
```

Expected: 全 command exit 0。test 出力に tests が1以上あり fail 0。

- [ ] **Step 2: `parallel-review-cycle` の scope filter で review する**

review scope:

- correctness: parser、alias、alpha 合成、case coverage、ancestor 判定、source class replacement、registry sync
- security: path traversal、symlink、Git pathspec、CLI injection、temp probe cleanup
- requirements: A〜E、Select、4 gate、overlay、chart defer、evidence immutability、fresh install

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
- Create: `.docs/reviews/brand-token-migration/2026-08-02-{attachment,alert,badge,button,bubble,dialog,drawer,menubar,select,tabs}-preview.md`
- Create: 対応する `*-light.jpg` / `*-dark.jpg`
- Create: `.docs/reviews/brand-token-migration/catalog-light.jpg`
- Create: `.docs/reviews/brand-token-migration/catalog-dark.jpg`
- Create: `.docs/reviews/brand-token-migration/alert-dialog-{light,dark}.jpg`
- Create: `.docs/reviews/brand-token-migration/sheet-{light,dark}.jpg`
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

- attachment、alert、badge、button、bubble、dialog、drawer、menubar、select、tabs
- alert-dialog、sheet
- input、textarea、native-select、input-group
- catalog

各 component で DOM、computed color / background、hover / focus / open state、console error、horizontal overflow を確認する。interactive state は実 pointer / keyboard event で作る。

- [ ] **Step 3: exact visual contract を確認する**

- Button / Badge / Bubble: primary hover が opaque `primary-hover`、destructive default / hover が subtle foreground で 4.5:1 以上。
- Attachment / Alert / Menubar: destructive text が alpha なしの subtle foreground。
- Tabs: inactive light / dark が opaque muted foreground、active は foreground。
- Select comparison: dark placeholder Select と Input の computed background が一致する。before report の solid Selectとの差を記録する。
- disabled controls: disabled state が描画され、AA exempt だが文字消失、背景欠落、cursor / disabled semantics の回帰がない。
- AlertDialog / Dialog / Drawer / Sheet: overlay の computed color が black 10%、backdrop blur が有効、open content の focus / close が既存契約を維持する。
- catalog: light / dark で全 preview、console error なし、horizontal overflow なし。

- [ ] **Step 4: JPEG を新規保存する**

component ごとの light / dark、catalog、AlertDialog、Sheet、disabled controls を `Page.captureScreenshot format: jpeg` で保存する。既存画像を上書きしない。

- [ ] **Step 5: component report を新規作成する**

各 report の先頭へ次を置く。

```markdown
verified_impl_sha: VERIFIED_IMPL_SHAの40桁実値
```

本文には route、theme、state、computed style、contrast、keyboard / pointer、console、画像 path、見た範囲 / 見ていない範囲を記録する。画像取得方法と `.jpg` 実体の一致を1行入れる。

- [ ] **Step 6: shared aggregate report を作成する**

`.docs/reviews/brand-token-migration/report.md` の先頭を exact field にする。

```markdown
verified_impl_sha: VERIFIED_IMPL_SHAの40桁実値
evidence_scope: shared-token-migration
targeted_dynamic_sha: VERIFIED_IMPL_SHAの40桁実値
```

本文に text-aa / nontext-ui / disabled-exempt / decorative の case 別結果、sidebar-border の DESIGN.md §8 根拠、chart palette defer、before / after Select、registry build、全 targeted route を記録する。

- [ ] **Step 7: evidence の magic / coverage / component hard gate を確認する**

Run:

```bash
node scripts/check-evidence.mjs
npm run check:all
git diff --quiet "$VERIFIED_IMPL_SHA" -- src/components/ui src/previews src/styles
```

Expected: 全て exit 0。`global.css` stale は valid aggregate で covered、changed component の最新 evidence は新 report、component source は verified SHA 以降の committed / staged / unstaged 差分がない。

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
test -s elchika-ui/LICENSE
test -s elchika-ui/THIRD_PARTY_LICENSES
rg -n "bg-primary-hover|text-destructive-subtle-foreground" src/components/ui/button.tsx
rg -n "dark:bg-input/30" src/components/ui/select.tsx
```

Expected: 全 command exit 0。source class は実出力に存在する。

- [ ] **Step 4: installed tokens と host の正本を比較する**

Node script で `:root` と `.dark` の `--name: value;` map を両 file から読み、key set と value を比較する。少なくとも次を個別 assertion する。

```js
for (const name of [
  "primary-hover",
  "destructive-subtle-foreground",
  "muted-foreground",
  "sidebar",
  "sidebar-border",
]) {
  if (got.light[name] !== want.light[name] || got.dark[name] !== want.dark[name]) {
    throw new Error(`${name}: 配布 token が正本と一致しない`);
  }
}
```

Expected: key set と全 value が一致し exit 0。

- [ ] **Step 5: consumer CSS import と build を確認する**

probe の `src/index.css` の既存 import 後へ次を `apply_patch` で追加する。

```css
@import "../elchika-ui/tokens.css";
```

Run: `npm run build`

Expected: exit 0。build output CSS に primary-hover と destructive-subtle-foreground の実値が含まれる。

- [ ] **Step 6: probe 結果を新規 report へ記録する**

`.docs/reviews/brand-token-migration/fresh-install.md`:

```markdown
# ブランドトークン fresh install 検証

verified_impl_sha: VERIFIED_IMPL_SHAの40桁実値

- registry URL: 実際の URL
- shadcn exact version: 実値
- source 到達: Button / Select の実測
- token key / value 一致: 実測
- legal file: test -s の実測
- consumer build: command と exit code
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
- source へ未分類 alpha utility を未commitで追加すると contrast checker exit 1。原状復帰後 exit 0。
- verified component source を未commitで変更すると evidence checker exit 1。原状復帰後 exit 0。
- `global.css` を未commitで変更すると shared coverage が不成立になる。原状復帰後 exit 0。
- aggregate report の `targeted_dynamic_sha` 欄を temp repo test で欠落させると fail-closed。
- registry item から token file を temp copy 上で外すと distribution checker exit 1。

repo file を直接壊す場合は exact path の backup と restore を行い、最後に `git status --short` が空であることを確認する。

- [ ] **Step 3: final review clean round を行う**

`origin/main...HEAD` を correctness / security / requirements で再 review する。Task 7 後の evidence と probe も scope に含める。flag が出たら修正し、source に触れた場合は Task 7、8、9 を順にやり直す。

- [ ] **Step 4: push して PR を作成する**

```bash
git push -u origin feat/brand-tokens
gh pr create --base main --head feat/brand-tokens --title "feat: ブランドトークンと配色契約を導入する" --body-file /tmp/ui-brand-token-pr.md
```

PR body は次を含む。

- token 変更と A〜E の要約
- shared coverage と strict contrast sensor
- text-aa / nontext-ui / disabled-exempt / decorative の分類
- Select before / after、4 overlay、catalog、fresh install の evidence permalink
- RISK-006 mitigated と RISK-013 accepted
- 実行した command と exit code
- review cycle flag 0
- npm publish / deploy / chart palette が scope 外であること

- [ ] **Step 5: final head に束縛した CI を確認する**

```bash
export FINAL_HEAD=$(git rev-parse HEAD)
gh pr checks --watch
gh run list --branch feat/brand-tokens --workflow ci.yml --limit 10 --json databaseId,headSha,conclusion
```

`headSha == FINAL_HEAD` の run だけを選び、全 step の name / conclusion を API で読み戻す。Token contrast step が実在して success であることを個別確認する。

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
- RISK-006 / RISK-013
- chart palette、deploy、merge を実施していないこと

人間が merge するまで `main` を変更しない。

---

## Self-Review

### Spec coverage

- shared coverage: Task 2、Task 8、Task 10 の uncommitted negative test。
- contrast actual consumer / alpha: Task 3、Task 5、Task 6。
- A〜E: Task 4 と Task 5。
- Select dark input: Task 1 before、Task 5 source、Task 8 after。
- disabled gate: Task 3 case、Task 8 browser。
- overlay 4件: Task 5 と Task 8。
- sidebar alias / decorative rationale: Task 4、Task 8 aggregate。
- chart defer: Task 4 RISK-013。
- registry / fresh install: Task 4、Task 5、Task 9。
- provenance.modified: Task 5。
- review flag 0 / PR: Task 7、Task 10。

未カバーの裁定はない。

### Placeholder scan

未確定記号や後続任せの抽象表現は使っていない。`BASELINE_SHA`、`VERIFIED_IMPL_SHA`、`GLOBAL_TOKEN_SHA` は実行時に Git から取得して report へ40桁実値を入れる変数名であり、成果物へ placeholder のまま残さないことを各 Task に明記した。

### Interface consistency

- evidence: `parseSingleField`、`latestByAddition`、`inspectSharedTokenCoverage`、`summarizeStale` を Task 2 内で定義・利用する。
- contrast: `parseThemes`、`resolveToken`、`composite`、`contrastRatio`、`evaluateCase`、`checkContrastInRepo` を Task 3 で定義し、Task 5 / 6 が同じ CLI を使う。
- gate 名は `text-aa` / `nontext-ui` / `disabled-exempt` / `decorative` の4種類で全 Task 一致する。
- 新 token は `primary-hover` / `destructive-subtle-foreground` で CSS、Tailwind、consumer、registry、probe の名前が一致する。
- `.docs/PROJECT_GOAL.md` と README は、standards の semantic 構造を維持しつつブランド固有値へ移る実態と一致する。
- evidence structured field は `evidence_scope: shared-token-migration` / `targeted_dynamic_sha` で設計と Task 2 / 8 が一致する。

## Known Risks During Execution

- Base UI / Tailwind の computed color 表記が変わった場合、文字列表記を正規化せず sRGB channel の実値で比較する。
- `npx serve` は port 占有時に別 port へ fallback するため、候補を事前確認し実 URL と一致しなければ停止する。
- shadcn CLI の latest は使わず `.shadcn-cli-version` の exact version を使う。
- `public/r` は生成物だが task 所有であり、consumer source または token を変更した後は必ず再生成する。
- coverage report の SHA を evidence commit 自身へ更新しない。自己参照の固定点は存在しない。
- browser evidence 後に source を変更した場合、画像の一部流用をせず Task 7 からやり直す。
