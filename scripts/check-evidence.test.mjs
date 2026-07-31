import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const checkerUrl = new URL("./check-evidence.mjs", import.meta.url);
const png = Buffer.from("89504e470d0a1a0a", "hex");
const jpeg = Buffer.from("ffd8ff", "hex");

const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });

const loadModule = async () => {
  assert.ok(existsSync(checkerUrl), "check-evidence.mjs がまだ無い");
  return import(checkerUrl);
};

const createEvidenceRepo = () => {
  const root = mkdtempSync(join(tmpdir(), "elchika-evidence-test-"));
  git(root, ["init"]);
  git(root, ["config", "user.email", "test@example.com"]);
  git(root, ["config", "user.name", "Test"]);
  for (const name of ["button", "input"]) {
    mkdirSync(join(root, "src/components/ui"), { recursive: true });
    mkdirSync(join(root, "src/previews"), { recursive: true });
    mkdirSync(join(root, "src/pages/preview"), { recursive: true });
    writeFileSync(join(root, `src/components/ui/${name}.tsx`), `${name} component\n`);
    writeFileSync(join(root, `src/previews/${name}.tsx`), `${name} preview\n`);
    writeFileSync(join(root, `src/pages/preview/${name}.astro`), `${name} light\n`);
    writeFileSync(join(root, `src/pages/preview/${name}-dark.astro`), `${name} dark\n`);
  }
  mkdirSync(join(root, "src/styles"), { recursive: true });
  mkdirSync(join(root, "src/catalog"), { recursive: true });
  mkdirSync(join(root, "src/layouts"), { recursive: true });
  mkdirSync(join(root, "src/lib"), { recursive: true });
  mkdirSync(join(root, "src/pages"), { recursive: true });
  mkdirSync(join(root, ".docs/reviews"), { recursive: true });
  writeFileSync(join(root, "src/styles/global.css"), "tokens\n");
  writeFileSync(join(root, "src/catalog/preview-manifest.mjs"), "manifest\n");
  writeFileSync(join(root, "src/catalog/previews.ts"), "previews\n");
  writeFileSync(join(root, "src/catalog/verification-catalog.tsx"), "catalog\n");
  writeFileSync(join(root, "src/layouts/main.astro"), "layout\n");
  writeFileSync(join(root, "src/lib/utils.ts"), "utils\n");
  writeFileSync(join(root, "src/pages/catalog.astro"), "catalog light\n");
  writeFileSync(join(root, "src/pages/catalog-dark.astro"), "catalog dark\n");
  writeFileSync(join(root, "src/pages/index.astro"), "index\n");
  writeFileSync(join(root, ".docs/reviews/button.png"), png);
  writeFileSync(join(root, ".docs/reviews/input.jpg"), jpeg);
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "source"]);
  const verifiedSha = git(root, ["rev-parse", "HEAD"]).trim();
  writeFileSync(
    join(root, ".docs/reviews/2026-08-01-button-preview.md"),
    `検証した commit: \`${verifiedSha}\`\n`,
  );
  writeFileSync(
    join(root, ".docs/reviews/2026-08-01-input-preview.md"),
    `検証した commit: \`${verifiedSha}\`\n`,
  );
  writeFileSync(
    join(root, ".docs/reviews/2026-08-01-index-page.md"),
    `検証した commit: \`${verifiedSha}\`\n`,
  );
  writeFileSync(
    join(root, ".docs/reviews/2026-08-01-verification-catalog.md"),
    `検証した commit: \`${verifiedSha}\`\n`,
  );
  git(root, ["add", ".docs/reviews"]);
  git(root, ["commit", "-m", "evidence"]);
  return { root, verifiedSha };
};

test("PNG/JPEG の拡張子と magic bytes の不一致を検出する", async () => {
  const { checkImage } = await loadModule();
  assert.equal(checkImage("light.png", png), undefined);
  assert.equal(checkImage("dark.jpg", jpeg), undefined);
  assert.match(checkImage("wrong.png", jpeg), /拡張子 png.*JPEG/);
  assert.match(checkImage("wrong.jpg", png), /拡張子 jpg.*PNG/);
});

test("証跡 Markdown に40桁SHAが無ければ検出する", async () => {
  const { verificationSha } = await loadModule();
  assert.equal(verificationSha("検証した commit: abc123"), undefined);
  assert.equal(
    verificationSha("検証した commit: 0123456789abcdef0123456789abcdef01234567"),
    "0123456789abcdef0123456789abcdef01234567",
  );
});

test("検証済みcomponentだけを変更すると落ち、別componentは落とさない", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  writeFileSync(join(root, "src/components/ui/button.tsx"), "button changed\n");
  git(root, ["add", "src/components/ui/button.tsx"]);
  git(root, ["commit", "-m", "change button"]);

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, [
    "2026-08-01-button-preview.md: 検証 SHA 以降に component 固有 path が変更されている",
    "2026-08-01-verification-catalog.md: 検証 SHA 以降に証跡固有 path が変更されている",
  ]);
  assert.deepEqual(result.stale, []);
  assert.ok(
    !result.problems.some((problem) => problem.includes("input-preview")),
    "別componentの変更で input 証跡を落としてはならない",
  );
});

test("共有面の変更は落とさず陳腐化一覧へ出す", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  writeFileSync(join(root, "src/styles/global.css"), "tokens changed\n");
  git(root, ["add", "src/styles/global.css"]);
  git(root, ["commit", "-m", "change shared tokens"]);

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.stale, [
    "2026-08-01-button-preview.md: src/styles/global.css",
    "2026-08-01-index-page.md: src/styles/global.css",
    "2026-08-01-input-preview.md: src/styles/global.css",
    "2026-08-01-verification-catalog.md: src/styles/global.css",
  ]);
});

test("index と catalog の固有 path が検証 SHA 以降に変わると検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  writeFileSync(join(root, "src/pages/index.astro"), "index changed\n");
  writeFileSync(join(root, "src/catalog/verification-catalog.tsx"), "catalog changed\n");
  git(root, ["add", "src/pages/index.astro", "src/catalog/verification-catalog.tsx"]);
  git(root, ["commit", "-m", "change index and catalog"]);

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, [
    "2026-08-01-index-page.md: 検証 SHA 以降に証跡固有 path が変更されている",
    "2026-08-01-verification-catalog.md: 検証 SHA 以降に証跡固有 path が変更されている",
  ]);
  assert.deepEqual(result.stale, []);
});

test("reviews 配下の入れ子にある画像も magic bytes を検査する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  const evidenceDirectory = join(root, ".docs/reviews/catalog-index-r2/evidence");
  mkdirSync(evidenceDirectory, { recursive: true });
  writeFileSync(join(evidenceDirectory, "wrong.png"), jpeg);

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, [
    "catalog-index-r2/evidence/wrong.png: 拡張子 png だが実体は JPEG",
  ]);
  assert.deepEqual(result.stale, []);
});

test("reviews 配下の入れ子にある index 検証レポートの鮮度も検査する", async (t) => {
  const { root, verifiedSha } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  const reportDirectory = join(root, ".docs/reviews/catalog-index-r2");
  mkdirSync(reportDirectory, { recursive: true });
  writeFileSync(join(reportDirectory, "report.md"), `検証した commit: \`${verifiedSha}\`\n`);
  git(root, ["add", ".docs/reviews/catalog-index-r2/report.md"]);
  git(root, ["commit", "-m", "add deep verification report"]);
  writeFileSync(join(root, "src/pages/index.astro"), "index changed\n");
  git(root, ["add", "src/pages/index.astro"]);
  git(root, ["commit", "-m", "change index"]);

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, [
    "2026-08-01-index-page.md: 検証 SHA 以降に証跡固有 path が変更されている",
    "catalog-index-r2/report.md: 検証 SHA 以降に証跡固有 path が変更されている",
  ]);
  assert.deepEqual(result.stale, []);
});

test("独自の verifications 証跡レイヤーを検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  const legacyDirectory = join(root, ".docs/verifications");
  mkdirSync(legacyDirectory, { recursive: true });
  writeFileSync(join(legacyDirectory, "result.md"), "checker を迂回する証跡\n");

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, [
    ".docs/verifications は証跡の正規レイヤーではない。.docs/reviews 配下へ移動する",
  ]);
  assert.deepEqual(result.stale, []);
});

test("reviews 配下の symlink 証跡を黙って除外しない", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  symlinkSync("button.png", join(root, ".docs/reviews/linked.png"));

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, ["linked.png: 通常ファイルではないため証跡として検査できない"]);
  assert.deepEqual(result.stale, []);
});

test("dangling verifications symlink も独自証跡レイヤーとして検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  symlinkSync("missing-verifications", join(root, ".docs/verifications"));

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, [
    ".docs/verifications は証跡の正規レイヤーではない。.docs/reviews 配下へ移動する",
  ]);
  assert.deepEqual(result.stale, []);
});

test("入れ子の catalog 検証 Markdown も固有 path の鮮度を検査する", async (t) => {
  const { root, verifiedSha } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  const nestedDirectory = join(root, ".docs/reviews/deep");
  mkdirSync(nestedDirectory, { recursive: true });
  writeFileSync(
    join(nestedDirectory, "2026-08-01-verification-catalog.md"),
    `検証した commit: \`${verifiedSha}\`\n`,
  );
  git(root, ["add", ".docs/reviews/deep/2026-08-01-verification-catalog.md"]);
  git(root, ["commit", "-m", "add nested catalog evidence"]);
  writeFileSync(join(root, "src/catalog/verification-catalog.tsx"), "catalog changed\n");
  git(root, ["add", "src/catalog/verification-catalog.tsx"]);
  git(root, ["commit", "-m", "change catalog"]);

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, [
    "2026-08-01-verification-catalog.md: 検証 SHA 以降に証跡固有 path が変更されている",
    "deep/2026-08-01-verification-catalog.md: 検証 SHA 以降に証跡固有 path が変更されている",
  ]);
  assert.deepEqual(result.stale, []);
});

test("reviews root 自体の symlink で repo 外を走査しない", async (t) => {
  const { root } = createEvidenceRepo();
  const externalReviews = mkdtempSync(join(tmpdir(), "elchika-external-reviews-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  t.after(() => rmSync(externalReviews, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  rmSync(join(root, ".docs/reviews"), { recursive: true, force: true });
  symlinkSync(externalReviews, join(root, ".docs/reviews"));

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, [
    ".docs/reviews は repo 内の通常ディレクトリでなければならない",
  ]);
  assert.deepEqual(result.stale, []);
});

test("reviews の祖先 symlink で repo 外を走査しない", async (t) => {
  const { root } = createEvidenceRepo();
  const externalDocs = mkdtempSync(join(tmpdir(), "elchika-external-docs-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  t.after(() => rmSync(externalDocs, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  rmSync(join(root, ".docs"), { recursive: true, force: true });
  mkdirSync(join(externalDocs, "reviews"));
  symlinkSync(externalDocs, join(root, ".docs"));

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, [
    ".docs/reviews は repo 内の通常ディレクトリでなければならない",
  ]);
  assert.deepEqual(result.stale, []);
});
