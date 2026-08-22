// CLI エントリ（import.meta.url === argv[1] の内側）は spawn しないと到達できず、
// 純関数へ切り出しただけでは配線が守られない。実測では blocks を [] へ、
// blockFiles の受け渡しを外しても全テストが緑のままだった（ゲートが丸ごと死ぬ）。
// fixture を組んで実際に走らせ、exit code とメッセージを固定する。
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const scriptsRoot = dirname(fileURLToPath(import.meta.url));

const writeFile = (root, path, content) => {
  mkdirSync(join(root, dirname(path)), { recursive: true });
  writeFileSync(join(root, path), content);
};

const writeJson = (root, path, value) =>
  writeFile(root, path, `${JSON.stringify(value, null, 2)}\n`);

const blockProvenance = (sha) => ({
  origin: "shadcn/ui registry",
  registryUrl: "https://ui.shadcn.com/r/styles/base-nova/login-01.json",
  registryContentSha256: "c".repeat(64),
  addTarget: "@shadcn/login-01",
  shadcnCliVersion: "4.16.0",
  fetchedAt: "2026-08-18",
  license: "MIT",
  modified: "registry:page を配布から除外",
  files: [
    {
      path: "src/blocks/login-01/components/login-form.tsx",
      upstreamPath: "apps/v4/registry/bases/base/blocks/login-01/components/login-form.tsx",
      upstreamPathSha: "0".repeat(40),
      generatedContentSha256: sha,
    },
    {
      dropped: true,
      upstreamPath: "apps/v4/registry/bases/base/blocks/login-01/page.tsx",
      upstreamPathSha: "0".repeat(40),
    },
  ],
});

// login-form.tsx の中身は 1 箇所で決め、ハッシュもそこから採る。
// 期待値を別々に書くと、どちらかを直したときに片方だけずれる。
const LOGIN_FORM =
  'import { Button } from "@/components/ui/button";\nexport const LoginForm = Button;\n';
const LOGIN_FORM_SHA = execFileSync(
  process.execPath,
  [
    "-e",
    `process.stdout.write(require("node:crypto").createHash("sha256").update(process.argv[1],"utf8").digest("hex"))`,
    LOGIN_FORM,
  ],
  { encoding: "utf8" },
);

const createFixture = () => {
  const root = mkdtempSync(join(tmpdir(), "elchika-cli-smoke-"));
  execFileSync("git", ["init", "-q"], { cwd: root });

  writeFile(root, "src/components/ui/button.tsx", "export const Button = () => null;\n");
  writeFile(root, "src/blocks/login-01/components/login-form.tsx", LOGIN_FORM);
  writeFile(root, "src/index.ts", 'export { Button } from "./components/ui/button";\n');
  writeFile(
    root,
    "lib/index.d.ts",
    [
      'export type { ButtonProps } from "./components/ui/button";',
      'export { Button } from "./components/ui/button";',
      "",
    ].join("\n"),
  );
  writeFile(root, "src/previews/button.tsx", "export const ButtonPreview = () => null;\n");
  writeFile(root, "src/previews/login-01.tsx", "export const LoginZeroOnePreview = () => null;\n");
  for (const name of ["button", "button-dark", "login-01", "login-01-dark"]) {
    writeFile(root, `src/pages/preview/${name}.astro`, "<html></html>\n");
  }
  writeJson(root, "registry.json", {
    items: [
      { name: "button", type: "registry:ui" },
      {
        name: "login-01",
        type: "registry:block",
        files: [
          { path: "src/blocks/login-01/components/login-form.tsx", type: "registry:component" },
          { path: "LICENSE", type: "registry:file", target: "~/elchika-ui/LICENSE" },
        ],
        registryDependencies: ["@elchika/button"],
      },
    ],
  });
  writeJson(root, "provenance.json", {
    components: {
      button: {
        sourceUrl: "https://example.com/button.tsx",
        upstreamPath: "apps/v4/registry/bases/base/ui/button.tsx",
        upstreamPathSha: "0".repeat(40),
        registry: "https://ui.shadcn.com",
        registryUrl: "https://ui.shadcn.com/r/styles/base-nova/button.json",
        registryContentSha256: "a".repeat(64),
        generatedContentSha256: "b".repeat(64),
        addTarget: "@shadcn/button",
        shadcnCliVersion: "4.16.0",
        fetchedAt: "2026-08-18",
        license: "MIT",
        modified: "focus ring を修正",
      },
    },
    blocks: { "login-01": blockProvenance(LOGIN_FORM_SHA) },
  });
  writeJson(root, "preview-selectors.json", {
    button: '[data-slot="button"]',
    "login-01": '[data-slot="login-01-preview"]',
    catalog: '[data-slot="catalog"]',
    "catalog-dark": '[data-slot="catalog"]',
  });
  return root;
};

// registry.json にだけ block item を置く。既存 fixture は同じ block を
// ディスク・来歴・registry の 3 箇所すべてに置いているため、走査根から
// registry を外しても残り 2 つが名前を供給して緑のままになる（実測）。
// 配布物 public/r/<name>.json を生むのは registry.json なので、この経路が
// 素通りすると来歴も preview も証跡も無い block が配布される。
const createRegistryOnlyFixture = () => {
  const root = createFixture();
  const registry = JSON.parse(
    execFileSync("cat", [join(root, "registry.json")], {
      encoding: "utf8",
    }),
  );
  registry.items.push({ name: "ghost-01", type: "registry:block", files: [] });
  writeJson(root, "registry.json", registry);
  return root;
};

const runChecker = (root, script) =>
  spawnSync(process.execPath, [join(scriptsRoot, script)], { cwd: root, encoding: "utf8" });

test("check-completeness の CLI は block を走査して緑になる", (t) => {
  const root = createFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runChecker(root, "check-completeness.mjs");
  assert.equal(result.status, 0, result.stderr);
  // 件数まで見る。走査根が黙って縮む変異は「0 件」という出力にしか現れない。
  assert.match(result.stdout, /1 件のコンポーネントと 1 件の block が全経路に載っている/);
});

test("check-completeness の CLI は台帳に載らないファイルを検出する", (t) => {
  const root = createFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFile(root, "src/blocks/login-01/components/orphan.tsx", "export {}\n");
  const result = runChecker(root, "check-completeness.mjs");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /orphan\.tsx が registry item に無い（配布されない）/);
});

test("check-completeness の CLI は来歴のハッシュのずれを検出する", (t) => {
  const root = createFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeJson(root, "provenance.json", {
    ...JSON.parse(execFileSync("cat", [join(root, "provenance.json")], { encoding: "utf8" })),
    blocks: { "login-01": blockProvenance("0".repeat(64)) },
  });
  const result = runChecker(root, "check-completeness.mjs");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /generatedContentSha256 が実体と一致しない/);
});

test("check-preview-render の CLI は block の selector 宣言を要求する", (t) => {
  const root = createFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeJson(root, "preview-selectors.json", {
    button: '[data-slot="button"]',
    catalog: '[data-slot="catalog"]',
    "catalog-dark": '[data-slot="catalog"]',
  });
  const result = runChecker(root, "check-preview-render.mjs");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /login-01: preview selector の宣言が無い/);
});

test("check-preview-render の CLI は宣言が揃っていれば緑になる", (t) => {
  const root = createFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runChecker(root, "check-preview-render.mjs");
  assert.equal(result.status, 0, result.stderr);
});

test("check-completeness の CLI は registry にだけ在る block を検出する", (t) => {
  const root = createRegistryOnlyFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runChecker(root, "check-completeness.mjs");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ghost-01: provenance\.json に来歴が無い/);
});

test("check-preview-render の CLI は registry にだけ在る block を検出する", (t) => {
  const root = createRegistryOnlyFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runChecker(root, "check-preview-render.mjs");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ghost-01: preview selector の宣言が無い/);
});
