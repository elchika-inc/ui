# registry:block 導入 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 上流 shadcn base-nova の block 27 件を、既存 61 コンポーネントと同水準の検査・来歴・プレビュー・法務同梱の下に置き、registry から配布可能にする。

**Architecture:** block は barrel（`src/index.ts`）に載せない registry 専用の別レーンとして扱う。`src/blocks/<name>/` の per-block ディレクトリに配置し、`check-completeness` を kind 別要件マトリクスへ、`check-preview-render` を走査根拡張へ、`add-component.mjs` を block 対応へ拡張する。上流の `registry:page` は配布せず、来歴には `dropped: true` として記録する。

**Tech Stack:** Node.js（`node:test` + `node:assert/strict`）、shadcn CLI 4.16.0、Astro 7、React 19、Biome。

**Spec:** `.docs/plans/2026-08-17-registry-blocks-design.md`

## Global Constraints

- shadcn CLI は `.shadcn-cli-version` の exact version（**4.16.0**）を使う。版を上げない。
- 上流 style は **`base-nova`**。取得元は `https://ui.shadcn.com/r/styles/base-nova/<name>.json`。
- block の item 名は上流と同名（`login-01` 等）。接頭辞を付けない。
- **UI 文言は上流の英語のまま**。翻訳しない。`Acme Inc.` 等のサンプル社名もそのまま残す。
- **`registry:page` は配布しない。** `page.tsx` はローカルへ置かず、来歴に `dropped: true` で記録する。
- block を `src/index.ts` へ export しない。`<Name>Props` 型も作らない。
- 生の色指定と値系 arbitrary value を使わない。フォーカスリングに透明度合成を使わない（standards §3・§5）。
- コミットメッセージ・コメント・ドキュメントは日本語（技術用語と識別子は原語のまま）。
- `main` へ直接コミットしない。PR は squash ではなく **merge commit** でマージする。

---

## File Structure

| ファイル | 変更 | 責務 |
|---|---|---|
| `scripts/check-completeness.mjs` | 修正 | `blocks` の要件検査を追加。component と block で要件を分ける |
| `scripts/check-completeness.test.mjs` | 修正 | block 要件のテストを追加 |
| `scripts/check-preview-render.mjs` | 修正 | 走査根に `src/blocks/` を追加 |
| `scripts/check-preview-render.test.mjs` | 修正 | block の selector 要求のテストを追加 |
| `scripts/add-component.mjs` | 修正 | `registry:block` の解決・複数ファイル許容・`src/blocks/` の変更分類 |
| `scripts/add-component.test.mjs` | 修正 | 上記3点のテストを追加 |
| `src/blocks/<name>/**` | 作成 | block 本体（配布物） |
| `src/previews/<name>.tsx` | 作成 | block の隔離プレビュー |
| `src/pages/preview/<name>.astro` / `<name>-dark.astro` | 作成 | プレビューのルート |
| `preview-selectors.json` | 修正 | block の preview selector 宣言 |
| `src/catalog/component-categories.mjs` | 修正 | 「認証」「アプリシェル」カテゴリを追加 |
| `registry.json` | 修正 | block の registry item |
| `provenance.json` | 修正 | `blocks` セクション |

---

## Task 1: `check-completeness` を kind 別要件マトリクスへ拡張

**Files:**
- Modify: `scripts/check-completeness.mjs`
- Test: `scripts/check-completeness.test.mjs`

**Interfaces:**
- Consumes: 既存の `checkCompleteness({components, barrel, dts, registry, previewFiles, previewSources, provenance})`
- Produces: `checkCompleteness({..., blocks})` — `blocks` は block 名の配列（例 `["login-01"]`）。省略時は `[]` として扱い、既存の呼び出しを壊さない。block は registry item / preview tsx / preview astro ×2 / `provenance.blocks[name]` の 4 経路を要求し、barrel export と `<Name>Props` は**要求しない**。

- [ ] **Step 1: block 要件の失敗テストを書く**

`scripts/check-completeness.test.mjs` の末尾に追加する。既存の `complete` fixture はそのまま使い、block 用の fixture を足す。

```js
const completeBlock = {
  ...complete,
  blocks: ["login-01"],
  registry: { items: [{ name: "button" }, { name: "login-01" }] },
  previewFiles: ["button.astro", "button-dark.astro", "login-01.astro", "login-01-dark.astro"],
  previewSources: ["button.tsx", "login-01.tsx"],
  provenance: {
    ...complete.provenance,
    blocks: {
      "login-01": {
        registryUrl: "https://ui.shadcn.com/r/styles/base-nova/login-01.json",
        registryContentSha256: "c".repeat(64),
        addTarget: "@shadcn/login-01",
        shadcnCliVersion: "4.16.0",
        fetchedAt: "2026-08-17",
        license: "MIT",
        modified: "registry:page を配布から除外した",
        files: [
          {
            path: "src/blocks/login-01/components/login-form.tsx",
            upstreamPath: "apps/v4/registry/bases/base/blocks/login-01/components/login-form.tsx",
            upstreamPathSha: "0123456789abcdef0123456789abcdef01234567",
            generatedContentSha256: "d".repeat(64),
          },
          {
            dropped: true,
            upstreamPath: "apps/v4/registry/bases/base/blocks/login-01/page.tsx",
            upstreamPathSha: "89abcdef0123456789abcdef0123456789abcdef",
          },
        ],
      },
    },
  },
};

test("block が全経路に載っていれば問題を返さない", () => {
  const { problems } = checkCompleteness(completeBlock);
  assert.deepEqual(problems, []);
});

test("block の registry item 欠落を検出する", () => {
  const { problems } = checkCompleteness({
    ...completeBlock,
    registry: { items: [{ name: "button" }] },
  });
  assert.deepEqual(problems, ["login-01: registry.json に item が無い"]);
});

test("block の dark プレビュー欠落を検出する", () => {
  const { problems } = checkCompleteness({
    ...completeBlock,
    previewFiles: ["button.astro", "button-dark.astro", "login-01.astro"],
  });
  assert.deepEqual(problems, ["login-01: プレビュー login-01-dark.astro が無い"]);
});

test("block に barrel export と Props 型を要求しない", () => {
  const { problems } = checkCompleteness({
    ...completeBlock,
    barrel: 'export { Button } from "./components/ui/button"',
  });
  assert.deepEqual(problems, []);
});

test("block の来歴欠落を検出する", () => {
  const { problems } = checkCompleteness({
    ...completeBlock,
    provenance: { ...completeBlock.provenance, blocks: {} },
  });
  assert.deepEqual(problems, ["login-01: provenance.json に来歴が無い"]);
});

test("block の files が空なら検出する", () => {
  const provenance = structuredClone(completeBlock.provenance);
  provenance.blocks["login-01"].files = [];
  const { problems } = checkCompleteness({ ...completeBlock, provenance });
  assert.deepEqual(problems, ["login-01: provenance の files が 0 件"]);
});

test("配布ファイルの generatedContentSha256 欠落を検出する", () => {
  const provenance = structuredClone(completeBlock.provenance);
  provenance.blocks["login-01"].files[0].generatedContentSha256 = undefined;
  const { problems } = checkCompleteness({ ...completeBlock, provenance });
  assert.deepEqual(problems, [
    "login-01: files[0] の generatedContentSha256 が64桁の小文字ハッシュでない",
  ]);
});

test("dropped なファイルに generatedContentSha256 があれば検出する", () => {
  const provenance = structuredClone(completeBlock.provenance);
  provenance.blocks["login-01"].files[1].generatedContentSha256 = "e".repeat(64);
  const { problems } = checkCompleteness({ ...completeBlock, provenance });
  assert.deepEqual(problems, [
    "login-01: files[1] は dropped なので generatedContentSha256 を持たない",
  ]);
});

test("配布ファイルの path が src/blocks/<name>/ 配下でなければ検出する", () => {
  const provenance = structuredClone(completeBlock.provenance);
  provenance.blocks["login-01"].files[0].path = "src/components/ui/login-form.tsx";
  const { problems } = checkCompleteness({ ...completeBlock, provenance });
  assert.deepEqual(problems, [
    "login-01: files[0] の path が src/blocks/login-01/ 配下でない",
  ]);
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `node --test scripts/check-completeness.test.mjs`
Expected: FAIL。`blocks` を読まないため「block が全経路に載っていれば問題を返さない」以外の block テストが期待どおりの problems を返さない。

- [ ] **Step 3: `check-completeness.mjs` に block 検査を実装する**

`PROVENANCE_SPEC` の直後に追加する。

```js
// block の来歴。component と違い配布ファイルが複数あるため、共通メタと files[] を分けて検査する。
// 単一ファイル前提の PROVENANCE_SPEC を流用すると、dashboard-01 の data.json が
// upstreamPath の `\.tsx$` に一致せず、正しい来歴を誤って弾く。
const BLOCK_PROVENANCE_SPEC = {
  registryUrl: /^https:\/\/\S+$/,
  registryContentSha256: /^[0-9a-f]{64}$/,
  addTarget: /^@[\w-]+\/[\w-]+$/,
  shadcnCliVersion: PROVENANCE_SPEC.shadcnCliVersion,
  fetchedAt: /^\d{4}-\d{2}-\d{2}$/,
  license: /^\S+$/,
  modified: /\S/,
};

// 配布しない registry:page も来歴には残す。dropped を「記録しない」で表現すると、
// 上流に page が無かったのか意図的に落としたのかを後から区別できない。
function blockFileProblems(name, file, index) {
  const label = `${name}: files[${index}]`;
  const problems = [];
  if (!/^\S+$/.test(String(file.upstreamPath ?? ""))) {
    problems.push(`${label} の upstreamPath が無い`);
  }
  if (!/^[0-9a-f]{40}$/.test(String(file.upstreamPathSha ?? ""))) {
    problems.push(`${label} の upstreamPathSha が40桁の小文字SHAでない`);
  }
  if (file.dropped === true) {
    if (file.path !== undefined) {
      problems.push(`${label} は dropped なので path を持たない`);
    }
    if (file.generatedContentSha256 !== undefined) {
      problems.push(`${label} は dropped なので generatedContentSha256 を持たない`);
    }
    return problems;
  }
  if (!String(file.path ?? "").startsWith(`src/blocks/${name}/`)) {
    problems.push(`${label} の path が src/blocks/${name}/ 配下でない`);
  }
  if (!/^[0-9a-f]{64}$/.test(String(file.generatedContentSha256 ?? ""))) {
    problems.push(`${label} の generatedContentSha256 が64桁の小文字ハッシュでない`);
  }
  return problems;
}

function blockProblems(name, registry, previewFiles, previewSources, provenance) {
  const problems = [];
  if (!registry.items.some((i) => i.name === name)) {
    problems.push(`${name}: registry.json に item が無い`);
  }
  if (!previewSources.includes(`${name}.tsx`)) {
    problems.push(`${name}: src/previews/${name}.tsx が無い`);
  }
  for (const suffix of ["", "-dark"]) {
    if (!previewFiles.includes(`${name}${suffix}.astro`)) {
      problems.push(`${name}: プレビュー ${name}${suffix}.astro が無い`);
    }
  }
  const p = provenance.blocks?.[name];
  if (!p) {
    problems.push(`${name}: provenance.json に来歴が無い`);
    return problems;
  }
  for (const [k, re] of Object.entries(BLOCK_PROVENANCE_SPEC)) {
    if (!p[k]) {
      problems.push(`${name}: provenance の ${k} が無い`);
      continue;
    }
    if (!re.test(String(p[k]))) {
      problems.push(`${name}: provenance の ${k} が形式に合わない: ${p[k]}`);
    }
  }
  if (!Array.isArray(p.files) || p.files.length === 0) {
    problems.push(`${name}: provenance の files が 0 件`);
    return problems;
  }
  return [...problems, ...p.files.flatMap((file, index) => blockFileProblems(name, file, index))];
}
```

`checkCompleteness` の引数に `blocks = []` を足し、component ループの後に block ループを追加する。

```js
export function checkCompleteness({
  components,
  blocks = [],
  barrel,
  dts,
  registry,
  previewFiles,
  previewSources,
  provenance,
}) {
```

component の `for` ループ直後、`return { problems }` の直前に追加する。

```js
  for (const name of blocks) {
    problems.push(...blockProblems(name, registry, previewFiles, previewSources, provenance));
  }
```

- [ ] **Step 4: テストを実行して通ることを確認する**

Run: `node --test scripts/check-completeness.test.mjs`
Expected: PASS（既存テストを含めて全件）

- [ ] **Step 5: CLI エントリで `src/blocks/` を走査する**

`check-completeness.mjs` 末尾の CLI ブロックを変更する。`components` の走査直後に追加する。

```js
  const blocks = existsSync("src/blocks")
    ? readdirSync("src/blocks", { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    : [];
```

`checkCompleteness({...})` の呼び出しに `blocks,` を足し、最後の成功メッセージを差し替える。

```js
  console.log(
    `${components.length} 件のコンポーネントと ${blocks.length} 件の block が全経路に載っている`,
  );
```

- [ ] **Step 6: 実リポジトリで実行し、現状（block 0 件）で通ることを確認する**

Run: `npm run build:lib && node scripts/check-completeness.mjs`
Expected: exit 0。`61 件のコンポーネントと 0 件の block が全経路に載っている`

- [ ] **Step 7: コミット**

```bash
git add scripts/check-completeness.mjs scripts/check-completeness.test.mjs
git commit -m "feat: check-completeness を kind 別要件マトリクスへ拡張

block は registry item / preview / provenance の 4 経路を要求し、
barrel export と Props 型は要求しない。来歴は配布ファイルの
generatedContentSha256 と、配布しない page の dropped を区別する。"
```

---

## Task 2: `check-preview-render` の走査根に block を追加

**Files:**
- Modify: `scripts/check-preview-render.mjs`
- Test: `scripts/check-preview-render.test.mjs`

**Interfaces:**
- Consumes: 既存の `checkPreviewRender(names, selectors)` と `requiredPreviewNames(components)`
- Produces: `requiredPreviewNames(components, blocks = [])` — component 名・block 名・カタログ名を連結した配列を返す。`checkPreviewRender` のシグネチャは変えない（既に名前の配列を受け取るため）。

- [ ] **Step 1: 失敗テストを書く**

`scripts/check-preview-render.test.mjs` の末尾に追加する。

```js
test("requiredPreviewNames は block を含める", () => {
  assert.deepEqual(requiredPreviewNames(["button"], ["login-01"]), [
    "button",
    "login-01",
    "catalog",
    "catalog-dark",
  ]);
});

test("requiredPreviewNames は block 省略時に既存の並びを保つ", () => {
  assert.deepEqual(requiredPreviewNames(["button"]), ["button", "catalog", "catalog-dark"]);
});

test("block の selector 宣言欠落を検出する", () => {
  const { problems } = checkPreviewRender(requiredPreviewNames(["button"], ["login-01"]), {
    button: '[data-slot="button"]',
    catalog: '[data-slot="catalog"]',
    "catalog-dark": '[data-slot="catalog"]',
  });
  assert.deepEqual(problems, ["login-01: preview selector の宣言が無い"]);
});
```

ファイル冒頭の import に `requiredPreviewNames` が無ければ追加する。

```js
import { checkPreviewRender, requiredPreviewNames } from "./check-preview-render.mjs";
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `node --test scripts/check-preview-render.test.mjs`
Expected: FAIL。`requiredPreviewNames` が第2引数を無視するため block が配列に入らない。

- [ ] **Step 3: 実装する**

`scripts/check-preview-render.mjs:8` を差し替える。

```js
export const requiredPreviewNames = (components, blocks = []) => [
  ...components,
  ...blocks,
  ...CATALOG_PREVIEW_NAMES,
];
```

- [ ] **Step 4: テストを実行して通ることを確認する**

Run: `node --test scripts/check-preview-render.test.mjs`
Expected: PASS

- [ ] **Step 5: CLI エントリで `src/blocks/` を走査する**

`check-preview-render.mjs` の CLI ブロックで、`components` の走査直後に追加する。

```js
  const blocks = existsSync("src/blocks")
    ? readdirSync("src/blocks", { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    : [];
```

`checkPreviewRender` の呼び出しを差し替える。

```js
  const { problems } = checkPreviewRender(requiredPreviewNames(components, blocks), selectors);
```

- [ ] **Step 6: 実リポジトリで実行し、現状で通ることを確認する**

Run: `node scripts/check-preview-render.mjs`
Expected: exit 0、`preview selector 宣言 OK`

- [ ] **Step 7: コミット**

```bash
git add scripts/check-preview-render.mjs scripts/check-preview-render.test.mjs
git commit -m "feat: check-preview-render の走査根に src/blocks/ を追加

走査根が src/components/ui 固定のままだと block の preview selector が
未宣言でも緑になり、ゲートを掛けたつもりで掛かっていない状態になる。"
```

---

## Task 3: `add-component.mjs` を `registry:block` へ対応させる

**Files:**
- Modify: `scripts/add-component.mjs`
- Test: `scripts/add-component.test.mjs`

**Interfaces:**
- Consumes: 既存の `resolveRegistryTarget(name, upstreamItem)`、`buildRegistryItem(name, upstreamItem, generatedSource, target)`、`CHANGE_CLASSIFICATION_RULES`
- Produces:
  - `resolveRegistryTarget` が `registry:block` に対し `{itemType: "registry:block", files: [{registryPath, targetPath, upstreamPath, fileType}], droppedFiles: [{registryPath, upstreamPath}]}` を返す。`registry:page` は `droppedFiles` へ振り分ける。既存の `registry:ui` / `registry:hook` は従来どおり `{itemType, registryPath, targetPath, upstreamPath}` を返す（後方互換）。
  - `classifyPath` が `src/blocks/<name>/**` を `target` として分類する。

- [ ] **Step 1: 失敗テストを書く**

`scripts/add-component.test.mjs` の末尾に追加する。

```js
const loginUpstream = {
  name: "login-01",
  type: "registry:block",
  files: [
    {
      path: "registry/base-nova/blocks/login-01/page.tsx",
      type: "registry:page",
      target: "app/login/page.tsx",
    },
    {
      path: "registry/base-nova/blocks/login-01/components/login-form.tsx",
      type: "registry:component",
    },
  ],
  registryDependencies: ["button", "card", "input", "label", "field"],
};

test("registry:block の配布ファイルを src/blocks/<name>/ へ解決する", () => {
  const target = resolveRegistryTarget("login-01", loginUpstream);
  assert.equal(target.itemType, "registry:block");
  assert.deepEqual(target.files, [
    {
      registryPath: "registry/base-nova/blocks/login-01/components/login-form.tsx",
      targetPath: "src/blocks/login-01/components/login-form.tsx",
      upstreamPath: "apps/v4/registry/bases/base/blocks/login-01/components/login-form.tsx",
      fileType: "registry:component",
    },
  ]);
});

test("registry:page を配布対象から外し droppedFiles へ振り分ける", () => {
  const target = resolveRegistryTarget("login-01", loginUpstream);
  assert.deepEqual(target.droppedFiles, [
    {
      registryPath: "registry/base-nova/blocks/login-01/page.tsx",
      upstreamPath: "apps/v4/registry/bases/base/blocks/login-01/page.tsx",
    },
  ]);
});

test("registry:block の配布ファイルが 0 件なら停止する", () => {
  assert.throws(
    () =>
      resolveRegistryTarget("login-01", {
        ...loginUpstream,
        files: [loginUpstream.files[0]],
      }),
    /配布対象のファイルが 0 件/,
  );
});

test("registry:ui の戻り値は従来どおり単一ファイルの形を保つ", () => {
  const target = resolveRegistryTarget("badge", {
    name: "badge",
    type: "registry:ui",
    files: [{ path: "registry/base-nova/ui/badge.tsx", type: "registry:ui" }],
  });
  assert.equal(target.targetPath, "src/components/ui/badge.tsx");
  assert.equal(target.files, undefined);
});

test("src/blocks/ 配下の変更を target として分類する", () => {
  assert.equal(
    classifyPath("src/blocks/login-01/components/login-form.tsx", "src/blocks/login-01", new Set()),
    "target",
  );
});
```

`classifyPath` が未 export なら `add-component.mjs` で `export` を付ける。冒頭の import も合わせる。

```js
import { CHANGE_CLASSIFICATION_RULES, classifyPath, resolveRegistryTarget } from "./add-component.mjs";
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `node --test scripts/add-component.test.mjs`
Expected: FAIL。`resolveRegistryTarget` が `未対応の registry item type: registry:block` を throw する。

- [ ] **Step 3: `resolveRegistryTarget` を block 対応にする**

`scripts/add-component.mjs` の `resolveRegistryTarget` を差し替える。既存の単一ファイル系はそのまま返し、block だけ新しい形を返す。

```js
const UPSTREAM_PREFIX = "apps/v4/registry/bases/base/";

const upstreamPathOf = (registryPath) =>
  `${UPSTREAM_PREFIX}${registryPath.replace("registry/base-nova/", "")}`;

// block は「利用者が 1 つ選んでコピーする雛形」なので、page.tsx は 27 件すべてが同名で衝突する。
// standards が Next.js を標準スタック外としているため target: app/<name>/page.tsx も配れない。
// 配布から外すが、来歴には dropped として残す。
function resolveBlockTarget(name, upstreamItem) {
  const files = [];
  const droppedFiles = [];
  for (const file of upstreamItem.files ?? []) {
    const registryPath = file.path;
    if (file.type === "registry:page") {
      droppedFiles.push({ registryPath, upstreamPath: upstreamPathOf(registryPath) });
      continue;
    }
    const relative = registryPath.replace(`registry/base-nova/blocks/${name}/`, "");
    if (relative === registryPath) {
      throw new Error(`${name}: block の file path が想定外: ${registryPath}`);
    }
    files.push({
      registryPath,
      targetPath: `src/blocks/${name}/${relative}`,
      upstreamPath: upstreamPathOf(registryPath),
      fileType: file.type,
    });
  }
  if (files.length === 0) {
    throw new Error(`${name}: 配布対象のファイルが 0 件`);
  }
  return { itemType: "registry:block", files, droppedFiles };
}

export function resolveRegistryTarget(name, upstreamItem) {
  if (upstreamItem.type === "registry:block") {
    return resolveBlockTarget(name, upstreamItem);
  }
  const definitions = {
    "registry:ui": {
      registryPath: `registry/base-nova/ui/${name}.tsx`,
      targetPath: `src/components/ui/${name}.tsx`,
    },
    "registry:hook": {
      registryPath: `registry/base-nova/hooks/${name}.ts`,
      targetPath: `src/hooks/${name}.ts`,
    },
  };
  const definition = definitions[upstreamItem.type];
  if (!definition) {
    throw new Error(`${name}: 未対応の registry item type: ${upstreamItem.type ?? "なし"}`);
  }
  const primaryFiles = (upstreamItem.files ?? []).filter((file) => file.type === upstreamItem.type);
  if (primaryFiles.length !== 1 || primaryFiles[0].path !== definition.registryPath) {
    throw new Error(
      `${name}: ${upstreamItem.type} の一次 file path が想定外: ${primaryFiles.map(({ path }) => path).join(", ") || "なし"}`,
    );
  }
  return {
    itemType: upstreamItem.type,
    registryPath: definition.registryPath,
    targetPath: definition.targetPath,
    upstreamPath: upstreamPathOf(definition.registryPath),
  };
}
```

- [ ] **Step 4: `CHANGE_CLASSIFICATION_RULES` に block の matcher を足す**

`CHANGE_CLASSIFICATION_RULES` に 1 行追加する（`target-item` の直後）。

```js
  { kind: "target", matcher: "target-block-dir" },
```

`classifyPath` の先頭ループへ分岐を追加する。

```js
    if (
      rule.matcher === "target-block-dir" &&
      targetPath.startsWith("src/blocks/") &&
      path.startsWith(`${targetPath}/`)
    ) {
      return rule.kind;
    }
```

`classifyPath` に `export` を付ける。

```js
export function classifyPath(path, targetPath, trackedBefore) {
```

- [ ] **Step 5: `buildRegistryItem` を block 対応にする**

`buildRegistryItem` の `files` 生成を差し替える。block は複数ファイル、それ以外は従来どおり。

```js
  const itemFiles =
    target.itemType === "registry:block"
      ? target.files.map(({ targetPath, fileType }) => ({ path: targetPath, type: fileType }))
      : [{ path: target.targetPath, type: target.itemType }];

  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name,
    type: target.itemType,
    title: name
      .split("-")
      .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
      .join(" "),
    description: `${name} ${target.itemType === "registry:hook" ? "hook" : "component"}.`,
    files: [...itemFiles, ...SHARED_REGISTRY_FILES],
  };
```

- [ ] **Step 6: テストを実行して通ることを確認する**

Run: `node --test scripts/add-component.test.mjs`
Expected: PASS（既存テストを含めて全件）

- [ ] **Step 7: コミット**

```bash
git add scripts/add-component.mjs scripts/add-component.test.mjs
git commit -m "feat: add-component の純関数を registry:block へ対応させる

block の複数ファイルを src/blocks/<name>/ へ解決し、registry:page は
配布対象から外して droppedFiles へ振り分ける。src/blocks/ 配下の変更を
分類できないと、add 後の reconcile が想定外パスとして停止する。"
```

---

## Task 4: `runAddComponent` の実行経路を block 対応にする

Task 3 は純関数だけを直した。実行経路 `runAddComponent` は**単一ファイル前提の箇所を 4 つ**持っており、そのままでは block で落ちる。

| 箇所（`add-component.mjs`） | 現状 | block での挙動 |
|---|---|---|
| `reconcileAddChanges({targetPath: target.targetPath})` | 単一ファイルのパス | `undefined` が渡り、`src/blocks/` の変更が `unknown` に分類され停止する |
| `if (!existsSync(join(repositoryRoot, targetPath)))` | 単一ファイルの生成確認 | `undefined` を join して例外 |
| `provenanceEntry({...})` | `target.upstreamPath` / `target.registryPath` 前提 | `undefined` で GitHub API を叩き失敗 |
| `provenance.components[name] = entry` | component へ書く | block が `components` に混ざる |

**Files:**
- Modify: `scripts/add-component.mjs`
- Test: `scripts/add-component.test.mjs`

**Interfaces:**
- Consumes: Task 3 の `resolveRegistryTarget`（block では `{itemType, files, droppedFiles}` を返す）
- Produces:
  - `blockProvenanceEntry({root, name, modified, cliVersion, upstreamItem, upstreamText, target, registryUrl, fetchImpl})` → Task 1 の `BLOCK_PROVENANCE_SPEC` を満たすオブジェクト。`files[]` は配布ファイル（`path` / `upstreamPath` / `upstreamPathSha` / `generatedContentSha256`）と落とした page（`dropped: true` / `upstreamPath` / `upstreamPathSha`）を含む。
  - `shouldSkipRecorded(provenance, name, force, kind)` → `kind` が `"block"` のとき `provenance.blocks?.[name]` を見る。省略時は従来どおり `components`。

- [ ] **Step 1: `shouldSkipRecorded` の失敗テストを書く**

`scripts/add-component.test.mjs` に追加する。

```js
test("block の記録済み判定は provenance.blocks を見る", () => {
  const provenance = { components: {}, blocks: { "login-01": { license: "MIT" } } };
  assert.equal(shouldSkipRecorded(provenance, "login-01", false, "block"), true);
  assert.equal(shouldSkipRecorded(provenance, "login-02", false, "block"), false);
});

test("component の記録済み判定は従来どおり provenance.components を見る", () => {
  const provenance = { components: { badge: { license: "MIT" } }, blocks: {} };
  assert.equal(shouldSkipRecorded(provenance, "badge", false), true);
  assert.equal(shouldSkipRecorded(provenance, "badge", true), false);
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `node --test scripts/add-component.test.mjs`
Expected: FAIL。`shouldSkipRecorded` が第4引数を無視し、block の判定が `components` を見て `false` を返す。

- [ ] **Step 3: `shouldSkipRecorded` を実装する**

```js
export function shouldSkipRecorded(provenance, name, force, kind = "component") {
  const section = kind === "block" ? provenance.blocks : provenance.components;
  return Boolean(section?.[name]) && !force;
}
```

- [ ] **Step 4: テストを実行して通ることを確認する**

Run: `node --test scripts/add-component.test.mjs`
Expected: PASS

- [ ] **Step 5: 上流 JSON の生テキストを保持する**

`registryContentSha256` は受け取った配信物のハッシュである。`JSON.parse` して `JSON.stringify` し直すとキー順や空白で値が変わるため、**生テキストのまま** ハッシュを取る。

`fetchJson` の隣に追加する。

```js
// registryContentSha256 は「受け取った配信物」の錨なので、パース済みオブジェクトから
// 再シリアライズしたテキストでは値がずれる。生テキストを保持して両方返す。
async function fetchJsonWithText(url, fetchImpl) {
  const response = await fetchImpl(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`取得に失敗: ${url} (${response.status})`);
  const text = await response.text();
  return { json: JSON.parse(text), text };
}
```

- [ ] **Step 6: `blockProvenanceEntry` を実装する**

`provenanceEntry` の直後に追加する。

```js
async function upstreamCommitSha(upstreamRepo, upstreamPath, fetchImpl, name) {
  const commits = await fetchJson(
    `https://api.github.com/repos/${upstreamRepo}/commits?path=${encodeURIComponent(upstreamPath)}&per_page=1`,
    fetchImpl,
  );
  const sha = commits?.[0]?.sha;
  if (!/^[0-9a-f]{40}$/.test(sha ?? "")) {
    throw new Error(`${name}: ${upstreamPath} の commit SHA を特定できない`);
  }
  return sha;
}

async function blockProvenanceEntry({
  root,
  name,
  modified,
  cliVersion,
  upstreamItem,
  upstreamText,
  target,
  registryUrl,
  fetchImpl,
}) {
  const upstreamRepo = "shadcn-ui/ui";
  const files = [];

  for (const file of target.files) {
    files.push({
      path: file.targetPath,
      upstreamPath: file.upstreamPath,
      upstreamPathSha: await upstreamCommitSha(upstreamRepo, file.upstreamPath, fetchImpl, name),
      generatedContentSha256: sha256(readFileSync(join(root, file.targetPath), "utf8")),
    });
  }
  // 配布しない page も残す。記録しないと、上流に page が無かったのか
  // 意図的に落としたのかを後から区別できない。
  for (const file of target.droppedFiles) {
    files.push({
      dropped: true,
      upstreamPath: file.upstreamPath,
      upstreamPathSha: await upstreamCommitSha(upstreamRepo, file.upstreamPath, fetchImpl, name),
    });
  }

  const pkg = readJson(root, "package.json");
  const shadcnRange = pkg.dependencies?.shadcn ?? pkg.devDependencies?.shadcn;
  if (!shadcnRange) throw new Error("package.json に shadcn の版が無い");

  return {
    origin: "shadcn/ui registry",
    sourceUrl: `https://github.com/${upstreamRepo}`,
    registry: "https://ui.shadcn.com",
    registryUrl,
    registryContentSha256: sha256(upstreamText),
    addTarget: `@shadcn/${name}`,
    upstreamRepo,
    style: "base-nova",
    shadcnCliVersion: cliVersion,
    shadcnVersion: readJson(root, "node_modules/shadcn/package.json").version,
    shadcnRange,
    fetchedAt:
      process.env.PROVENANCE_DATE ??
      new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date()),
    license: "MIT",
    modified,
    files,
    notes:
      "registryContentSha256 は受け取った配信物 JSON 全体の錨である。files[].generatedContentSha256 は standards 正規化を適用したあとの現行ファイルのハッシュであり、CLI 生成直後の値とは一致しない。" +
      "dropped: true の file は registry:page であり、standards が Next.js を標準スタック外とするため配布しない。",
  };
}
```

- [ ] **Step 7: `runAddComponent` を分岐させる**

`runAddComponent` を次のとおり書き換える。変更点は 5 箇所で、それ以外は既存のまま残す。

```js
  const { name, modified, force } = parseArgs(argv);
  const repositoryRoot = git(root, ["rev-parse", "--show-toplevel"]).trim();
  ensureClean(repositoryRoot);

  const packageBefore = readJson(repositoryRoot, "package.json");
  const trackedBefore = trackedFiles(repositoryRoot);
  const cliVersion = readFileSync(join(repositoryRoot, ".shadcn-cli-version"), "utf8").trim();
  const registryUrl = `https://ui.shadcn.com/r/styles/base-nova/${name}.json`;
  const { json: upstreamItem, text: upstreamText } = await fetchJsonWithText(
    registryUrl,
    fetchImpl,
  );
  const target = resolveRegistryTarget(name, upstreamItem);
  const isBlock = target.itemType === "registry:block";

  // 記録済み判定は target の種別が確定してから行う。先に判定すると
  // component と block で同名のときに誤って skip する。
  const provenance = readJson(repositoryRoot, "provenance.json");
  if (shouldSkipRecorded(provenance, name, force, isBlock ? "block" : "component")) {
    log(`${name}: 既に記録済み（--force で上書き可能）`);
    return { skipped: true };
  }

  const command = shadcnCommand(cliVersion, name);
  runCommand(command.command, command.args, { cwd: repositoryRoot, stdio: "inherit" });

  const reconciled = reconcileAddChanges({
    root: repositoryRoot,
    name,
    targetPath: isBlock ? `src/blocks/${name}` : target.targetPath,
    packageBefore,
    trackedBefore,
  });
  for (const path of reconciled.restored) log(`復元: ${path}`);
  for (const dependency of reconciled.addedDependencies) log(`追加依存: ${dependency}`);
  for (const path of reconciled.keptManifests) log(`依存 manifest を保持: ${path}`);

  const expectedPaths = isBlock
    ? target.files.map(({ targetPath }) => targetPath)
    : [target.targetPath];
  for (const path of expectedPaths) {
    if (!existsSync(join(repositoryRoot, path))) {
      throw new Error(`${path} が生成されなかった`);
    }
  }

  // 配布しない page が誤って落ちていないか確かめる。CLI は target を見て
  // app/<name>/page.tsx を作るため、放置すると未追跡ファイルが残る。
  for (const file of target.droppedFiles ?? []) {
    const droppedTarget = upstreamItem.files.find((f) => f.path === file.registryPath)?.target;
    if (droppedTarget && existsSync(join(repositoryRoot, droppedTarget))) {
      rmSync(join(repositoryRoot, droppedTarget));
      log(`配布しない page を削除: ${droppedTarget}`);
    }
  }

  const entry = isBlock
    ? await blockProvenanceEntry({
        root: repositoryRoot,
        name,
        modified,
        cliVersion,
        upstreamItem,
        upstreamText,
        target,
        registryUrl,
        fetchImpl,
      })
    : await provenanceEntry({
        root: repositoryRoot,
        name,
        modified,
        cliVersion,
        generatedSource: readFileSync(join(repositoryRoot, target.targetPath), "utf8"),
        upstreamItem,
        target,
        registryUrl,
        fetchImpl,
      });

  if (isBlock) {
    provenance.blocks ??= {};
    provenance.blocks[name] = entry;
  } else {
    provenance.components ??= {};
    provenance.components[name] = entry;
  }

  const registry = readJson(repositoryRoot, "registry.json");
  const registryItem = buildRegistryItem(
    name,
    upstreamItem,
    isBlock ? "" : readFileSync(join(repositoryRoot, target.targetPath), "utf8"),
    target,
  );
```

以降（`existingIndex` の探索から `return` まで）は既存のまま残す。末尾の 2 行の log は block では `entry.generatedContentSha256` が無いため差し替える。

```js
  writeJson(repositoryRoot, "provenance.json", provenance);
  writeJson(repositoryRoot, "registry.json", registry);
  if (isBlock) {
    log(`配布ファイル: ${entry.files.filter((f) => !f.dropped).length} 件`);
    log(`配布しない page: ${entry.files.filter((f) => f.dropped).length} 件`);
  } else {
    log(`生成直後 SHA-256: ${entry.generatedContentSha256}`);
  }
  log(`registry SHA-256: ${entry.registryContentSha256}`);
  return { skipped: false, entry, registryItem, reconciled };
```

ファイル冒頭の import に `rmSync` を足す。

```js
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
```

- [ ] **Step 8: block の外部依存を注入したテストを書く**

実際の HTTP と CLI を叩かずに `runAddComponent` の分岐を検査する。`fetchImpl` と `runCommand` を差し替える。

**一時リポジトリは既存の `createRepo()` ヘルパ（`scripts/add-component.test.mjs:15`）を使う。** `runAddComponent` を注入テストする既存パターン（同ファイル 269 行以降）に倣うこと。新しいヘルパを書かない。

```js
test("block を add すると provenance.blocks へ書き、components を汚さない", async () => {
  const root = createRepo();
  const { runAddComponent } = await loadModule();
  const result = await runAddComponent({
    argv: ["login-01", "--modified", "page を除外"],
    root,
    fetchImpl: fakeFetch,
    runCommand: () => {
      mkdirSync(join(root, "src/blocks/login-01/components"), { recursive: true });
      writeFileSync(join(root, "src/blocks/login-01/components/login-form.tsx"), "export {}\n");
    },
    log: () => {},
  });
  const provenance = JSON.parse(readFileSync(join(root, "provenance.json"), "utf8"));
  assert.ok(provenance.blocks["login-01"]);
  assert.equal(provenance.components["login-01"], undefined);
  assert.equal(provenance.blocks["login-01"].files.filter((f) => f.dropped).length, 1);
});
```

`fakeFetch` は registry JSON と GitHub API の 2 種類の URL に応答する必要がある。既存テストの fetch スタブに倣い、`https://ui.shadcn.com/r/styles/base-nova/login-01.json` には Task 3 の `loginUpstream` を（`content` 付きで）、`https://api.github.com/repos/shadcn-ui/ui/commits?...` には `[{ sha: "0".repeat(40) }]` を返す。

- [ ] **Step 9: テストを実行して通ることを確認する**

Run: `node --test scripts/add-component.test.mjs`
Expected: PASS

- [ ] **Step 10: コミット**

```bash
git add scripts/add-component.mjs scripts/add-component.test.mjs
git commit -m "feat: add-component の実行経路を block 対応にする

reconcile の targetPath・生成確認・来歴の書き先を block で分岐させた。
registryContentSha256 は再シリアライズで値がずれるため生テキストから取る。
CLI が作る app/<name>/page.tsx は配布しないので削除する。"
```

---

## Task 5: login-01 を移植して経路を端から端まで通す

**Files:**
- Create: `src/blocks/login-01/components/login-form.tsx`
- Create: `src/previews/login-01.tsx`
- Create: `src/pages/preview/login-01.astro`, `src/pages/preview/login-01-dark.astro`
- Modify: `registry.json`, `provenance.json`, `preview-selectors.json`, `src/catalog/component-categories.mjs`

**Interfaces:**
- Consumes: Task 1〜4 の拡張済み検査と `add-component.mjs`
- Produces: `src/blocks/login-01/components/login-form.tsx` が `LoginForm` を named export する（`React.ComponentProps<"div">` を受ける）。preview は `LoginZeroOnePreview` を named export し、`PreviewProps` を受ける。

- [ ] **Step 1: 既存 preview のルートを 1 組読んで書式を写す**

Run: `cat src/pages/preview/field.astro src/pages/preview/field-dark.astro`
これを `login-01` 用の雛形にする。ファイル名以外の構造を変えない。

- [ ] **Step 2: block を取得して配置する**

Run: `node scripts/add-component.mjs login-01 --modified "registry:page を配布から除外し、standards §5 適合のため値系 arbitrary value と focus ring の透明度合成を除去"`

Expected: `src/blocks/login-01/components/login-form.tsx` が生成され、`registry.json` に item が入り、`provenance.json` に来歴が入る。

停止した場合はメッセージのパスを確認する。`想定外パスの変更を検出` が出たら Task 3 Step 4 の matcher が効いていない。

- [ ] **Step 3: 配置されたファイルの import を確認する**

Run: `head -20 src/blocks/login-01/components/login-form.tsx`
Expected: `@/components/ui/button` `@/components/ui/card` `@/components/ui/field` `@/components/ui/input` と `@/lib/utils` を import している（CLI が `@/registry/base-nova/...` から書き換える）。書き換わっていなければ手で直し、`modified` に追記する。

- [ ] **Step 4: preview を書く**

Create: `src/previews/login-01.tsx`

上流 `page.tsx` のレイアウト枠を、配布せずここで再現する。

```tsx
import { LoginForm } from "@/blocks/login-01/components/login-form";
import type { PreviewProps } from "@/catalog/preview-types";

export function LoginZeroOnePreview(_props: PreviewProps) {
  return (
    <div
      data-slot="login-01-preview"
      className="flex min-h-svh w-full items-center justify-center p-6 md:p-10"
    >
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
```

`@/blocks/*` の alias が未設定なら `tsconfig.json` の `paths` と `astro.config.mjs` の alias に追加する。

- [ ] **Step 5: preview のルートを 2 枚作る**

Step 1 で写した書式に従い、`src/pages/preview/login-01.astro` と `src/pages/preview/login-01-dark.astro` を作る。dark 側はルート要素が `class="dark"` を持つこと。

- [ ] **Step 6: selector とカテゴリを宣言する**

`preview-selectors.json` に追加する。

```json
  "login-01": "[data-slot=\"login-01-preview\"]",
```

`src/catalog/component-categories.mjs` の配列末尾に追加する。

```js
  {
    name: "認証",
    items: ["login-01"],
  },
```

- [ ] **Step 7: 検査を全部走らせる**

Run: `npm run check:pre`
Expected: exit 0。落ちたら該当検査のメッセージに従って直す。

- [ ] **Step 8: ゲートが本当に効いているかを mutation で確かめる**

4 つの違反を **1 つずつ** 仕込み、対応する検査だけが赤くなることを確認する。確認したら必ず元へ戻す。

```bash
# 1. standards — block の tsx に生の色指定を入れる
sed -i '' 's/className={cn("flex flex-col gap-6"/className={cn("flex flex-col gap-6 text-[#ff0000]"/' src/blocks/login-01/components/login-form.tsx
# 置換が実際に入ったことを先に確認する。sed は不一致でも exit 0 で 0 件置換するため、
# ここを飛ばすと「違反を仕込んでいないのに緑」を「検査が通った」と誤読する。
grep -c 'text-\[#ff0000\]' src/blocks/login-01/components/login-form.tsx   # 期待: 1 以上
node scripts/check-standards.mjs   # 期待: exit 1
git checkout -- src/blocks/login-01/components/login-form.tsx

# 2. completeness — dark プレビューを消す
mv src/pages/preview/login-01-dark.astro /tmp/login-01-dark.astro
node scripts/check-completeness.mjs   # 期待: exit 1「login-01: プレビュー login-01-dark.astro が無い」
mv /tmp/login-01-dark.astro src/pages/preview/login-01-dark.astro

# 3. preview render — selector 宣言を消す
node -e "const f='preview-selectors.json';const j=JSON.parse(require('fs').readFileSync(f,'utf8'));delete j['login-01'];require('fs').writeFileSync(f,JSON.stringify(j,null,2)+'\n')"
node scripts/check-preview-render.mjs   # 期待: exit 1「login-01: preview selector の宣言が無い」
git checkout -- preview-selectors.json

# 4. completeness — 来歴の files を 1 件消す
node -e "const f='provenance.json';const j=JSON.parse(require('fs').readFileSync(f,'utf8'));j.blocks['login-01'].files.pop();require('fs').writeFileSync(f,JSON.stringify(j,null,2)+'\n')"
node scripts/check-completeness.mjs   # 期待: exit 1
git checkout -- provenance.json
```

各コマンドは `&&` や `;` で連結せず 1 本ずつ実行する（連結すると exit code が最後のものになり、個々の失敗が消える）。

4 つとも期待どおり赤くなり、戻した後に `npm run check:pre` が緑になることを確認する。

- [ ] **Step 9: 実ブラウザで描画を確認する**

Run: `npm run dev`
`http://localhost:4321/preview/login-01/` と `http://localhost:4321/preview/login-01-dark/` を開き、light / dark の証跡を撮って `.docs/reviews/` へ追加する。既存の report 書式（`verified_impl_sha` を含む）に合わせる。

- [ ] **Step 10: リポジトリ外の別プロジェクトへ実際に導入する（DoneCriteria 4）**

```bash
npm run build
npx serve public/r -l 5555
```

別ターミナルで scratch アプリを作る。

```bash
cd $(mktemp -d)
npm create vite@latest consumer -- --template react-ts
cd consumer
npm install
npx shadcn@4.16.0 init
npx shadcn@4.16.0 add http://localhost:5555/login-01.json
npm run build
```

**この Step の検証対象は 3 つあり、切り分けて判定する。**

1. `src/blocks/login-01/components/login-form.tsx` 相当が配置される
2. `app/login/page.tsx` が**作られない**
3. README の導入手順（トークンの `@import` 一本化、shadcn が生成した色 alias declaration の削除）を通した後に `npm run build` が exit 0

**1 と 2 が通って 3 で落ちる場合、原因は block ではなく consumer 側の Tailwind / alias 配線を疑う。** `npx shadcn init` は Tailwind 設定と `components.json` を対話で要求し、elchika registry は `~/elchika-ui/` 配下へトークンと法務ファイルを落とすため、初回は README の手順を踏まないとビルドが通らない。ここを切り分けずに「block が壊れている」と判断すると、健全な配布物を直しに行くことになる。

3 まで通ったら `src/App.tsx` で `LoginForm` を描画し `npm run dev` で表示を確認する。結果を `.docs/reviews/` の report に、1・2・3 のどこまで到達したかを明記して追記する。

- [ ] **Step 11: コミット**

```bash
git add src/blocks src/previews/login-01.tsx src/pages/preview/login-01*.astro
git add registry.json provenance.json preview-selectors.json src/catalog/component-categories.mjs .docs/reviews
git commit -m "feat: login-01 を registry:block として移植

block レーンを端から端まで通した最初の 1 件。registry:page は配布せず
来歴に dropped として記録し、レイアウト枠は preview 側で再現した。
4 つのゲートに意図的な違反を仕込んで赤くなることを確認済み。"
```

---

## Task 6: 残り 25 件をバッチ移植する

**Files:**
- Create: `src/blocks/<name>/**`（25 件）
- Create: `src/previews/<name>.tsx`、`src/pages/preview/<name>.astro`、`<name>-dark.astro`（各 25 件）
- Modify: `registry.json`, `provenance.json`, `preview-selectors.json`, `src/catalog/component-categories.mjs`

**Interfaces:**
- Consumes: Task 5 で実証済みの手順
- Produces: 26 件が `check:all` を通る状態

対象は login-02〜05、signup-01〜05、sidebar-01〜16 の 25 件。**dashboard-01 は含めない**（Task 7）。

- [ ] **Step 1: 1 件ずつ add する**

25 件を **1 件ずつ順に**実行する。並列にしない（`registry.json` / `provenance.json` / `component-categories.mjs` が単一の台帳で衝突するため）。

```bash
node scripts/add-component.mjs login-02 --modified "registry:page を配布から除外し、standards §5 適合のため値系 arbitrary value と focus ring の透明度合成を除去"
```

以降 `login-03` `login-04` `login-05` `signup-01`〜`signup-05` `sidebar-01`〜`sidebar-16` を同じ形式で実行する。1 件終えるごとに `node scripts/check-standards.mjs` を実行し、standards 違反があればその場で直す（25 件溜めてから直すと、どの block 由来か切り分けられなくなる）。

- [ ] **Step 1-2: `IconPlaceholder` を lucide へ展開する**

18 件（login-05 / signup-05 / sidebar-01〜13 / sidebar-15 / sidebar-16）が `@/app/(create)/components/icon-placeholder` を import する。add 直後、preview を書く前に展開する（設計 §3-4-2）。

展開は **fail-closed** で書くこと。`lucide` 属性を持たない `<IconPlaceholder>` を 1 つでも見つけたら、そのファイルを書き換えずに停止して報告する。実測では欠損 0 件だが、上流が将来 lucide を落としたときに黙って壊れた JSX を生成させないための防御である。

展開後、必ず次を確認する。

```
grep -rn "IconPlaceholder" src/blocks/
```
期待: **ヒット 0 件**（exit 1 が正しい結果）

```
npm run typecheck
```
期待: exit 0。展開したアイコン名が `lucide-react` に実在しない場合はここで落ちる（設計 §7 の訂正どおり、型解決の誤りは check スクリプトでは捕まらない）。

展開したことを各 block の `modified` へ記録する。

- [ ] **Step 2: preview を 25 件書く**

Task 5 Step 4 の形式に従う。上流 `page.tsx` のレイアウト枠は block ごとに異なるため、**各 block の `page.tsx` の content を上流 JSON から読んで写す**。

**「レイアウト枠」はルート要素の div だけでなく、`page.tsx` が持つ JSX 構造の全体を指す。** sidebar 系 16 件は `SidebarProvider` / `SidebarInset` / `SidebarTrigger` のラップと、`Breadcrumb` `Separator` を使った header を **`page.tsx` 側が持っている**（実測: sidebar-01 と sidebar-07 で確認）。div だけ写して Provider を落とすと context が無いまま描画されて壊れる。

このため **registry item の `registryDependencies` は上流のまま残す**。`page.tsx` を配布しないと `breadcrumb` や `separator` を使うコードが配布物から消えるが、利用側は page 相当を自分で書く時にまさにその依存を必要とする。上流の依存表は「この block を成立させるのに要る部品」の宣言であって、「配布ファイルが import している部品」の一覧ではない。

```bash
curl -s https://ui.shadcn.com/r/styles/base-nova/sidebar-07.json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log(j.files.find(f=>f.type==='registry:page').content)})"
```

`data-slot` は `<name>-preview` の形で統一する（selector 宣言と対応させるため）。

- [ ] **Step 3: preview のルートを 50 枚作る**

各 block について light / dark の 2 枚。dark 側はルート要素が `class="dark"` を持つこと。

- [ ] **Step 4: selector とカテゴリを宣言する**

`preview-selectors.json` に 25 件追加する。`component-categories.mjs` の既存「認証」へ login-02〜05 と signup-01〜05 を、**新設する「アプリシェル」へ sidebar-01〜16** を入れる（設計 §3-4-3）。「ダッシュボード」は作らない — dashboard-01 も Task 7 で「アプリシェル」へ入れる。

- [ ] **Step 5: 検査を全部走らせる**

Run: `npm run check:pre`
Expected: exit 0

- [ ] **Step 6: 証跡を撮る**

25 件 × light/dark = 50 枚。`.docs/reviews/` へ report と共に追加する。

- [ ] **Step 7: コミット**

```bash
git add -A
git commit -m "feat: 認証系と sidebar 系の block 25 件を移植

login-02〜05・signup-01〜05・sidebar-01〜16。新規 npm 依存は無い。
registry.json / provenance.json / component-categories.mjs が単一の
台帳のため、並列化せず 1 件ずつ直列で追加した。"
```

---

## Task 7: dashboard-01 を移植する

**Files:**
- Create: `src/blocks/dashboard-01/**`（10 ファイル）
- Modify: `package.json`, `THIRD_PARTY_LICENSES`, `registry.json`, `provenance.json`, `preview-selectors.json`, `src/catalog/component-categories.mjs`, `.docs/risk-registry.md`

**Interfaces:**
- Consumes: Task 6 までの全機構
- Produces: 27 件すべてが `check:all` を通る状態

- [ ] **Step 1: 依存追加の判断を記録する**

`.docs/plans/2026-08-17-registry-blocks-design.md` に追記するのではなく、`.docs/risk-registry.md` へ記録する。dashboard-01 は次の 6 件を新規に持ち込む。

`@dnd-kit/core` / `@dnd-kit/modifiers` / `@dnd-kit/sortable` / `@dnd-kit/utilities` / `@tanstack/react-table` / `zod`

CLAUDE.md のライブラリ選定基準（メンテが活発・採用実績が十分・推移的依存が少ない・公式やデファクトを優先）に照らした判断と、`data-table.tsx` が 32KB あることを書く。**この判断で「配布しない」を選ぶこともありうる** — その場合は Task 7 を中止し、設計書の §1 を更新する。

- [ ] **Step 2: add する**

```bash
node scripts/add-component.mjs dashboard-01 --modified "registry:page を配布から除外し、standards §5 適合のため値系 arbitrary value と focus ring の透明度合成を除去"
```

**`data.json` は現状の実装では落ちない。** `add-component.mjs` は block 内の `registry:file` を未対応として CLI 実行前に停止する（`SUPPORTED_BLOCK_FILE_TYPES` は `registry:component` のみ）。この Task は `registry:file` 対応の実装から始まる。

実装要件:

- CLI は上流 item の target（`app/dashboard/data.json`）へ書くため、その実体を `src/blocks/dashboard-01/data.json` へ移設する
- 既存ファイル衝突・path traversal・TOCTOU・`reconcileAddChanges` の許可集合を **fail-closed** で扱う
- ローカル registry item では **block 所有の `registry:file`** として記録し、共有法務ファイル（`target` 付きの `registry:file`）と混同しない
- fixture 先行で実装・コミットしてから、clean worktree で add する（未コミットのまま add すると `ensureClean` に止められる）

- [ ] **Step 3: 法務ファイルを再取得する**

Run: `node scripts/fetch-third-party-licenses.mjs`
Expected: `THIRD_PARTY_LICENSES` に 6 件の新規依存のライセンスが追加される。差分を確認する。

- [ ] **Step 4: preview とルートと宣言を作る**

Task 5 Step 4〜6 と同じ手順。`component-categories.mjs` の**「アプリシェル」**に `dashboard-01` と `dashboard-table` を追加する（設計 §3-4-3。「ダッシュボード」カテゴリは作らない — 設計書を Phase 2 で統一した際にこの行を直し忘れていた）。

- [ ] **Step 5: 検査を全部走らせる**

Run: `npm run check:all`
Expected: exit 0

- [ ] **Step 6: 証跡を撮る**

light / dark の 2 枚。

- [ ] **Step 7: コミット**

```bash
git add -A
git commit -m "feat: dashboard-01 を移植

新規 npm 依存 6 件（@dnd-kit 系 4 件・@tanstack/react-table・zod）を
伴うため他 26 件と分けた。判断は risk-registry に記録した。
THIRD_PARTY_LICENSES を再取得済み。"
```

---

## Task 8: 利用者向けドキュメントを更新する

**Files:**
- Modify: `README.md`, `AGENTS.md`

**Interfaces:**
- Consumes: Task 7 までの成果物

- [ ] **Step 1: README に block の導入手順を書く**

既存の component 導入手順の節の後に、block の節を追加する。次を必ず含める。

- `npx shadcn@4.16.0 add https://ui.elchika.dev/r/login-01.json` の形
- **`page.tsx` は配布されない**こと、ルーティングは利用側で書くこと
- 上流 `page.tsx` のレイアウト枠は `/preview/<name>/` で確認できること
- 複数の login block を同時に導入すると `login-form.tsx` が衝突するため、**1 つ選んで使う**こと

- [ ] **Step 2: AGENTS.md の Architecture 表に `src/blocks/` を足す**

```markdown
| `src/blocks/*/` | block 本体（registry 専用。barrel には載せない） |
```

- [ ] **Step 3: 最終確認**

Run: `npm run check:all`
Expected: exit 0

Run: `npm run build`
Expected: exit 0。`public/r/` に 27 件の block JSON が生成される。

Run: `ls public/r/*.json | wc -l`
Expected: 89（既存 62 + block 27）

- [ ] **Step 4: コミット**

```bash
git add README.md AGENTS.md
git commit -m "docs: block の導入手順と src/blocks/ の責務を追記

page.tsx を配布しないこと、複数 login block の同時導入で
login-form.tsx が衝突することを利用者向けに明記した。"
```
