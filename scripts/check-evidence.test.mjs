import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const checkerUrl = new URL("./check-evidence.mjs", import.meta.url);
const migrationUrl = new URL("./migrate-evidence-sha.mjs", import.meta.url);
const png = Buffer.from("89504e470d0a1a0a", "hex");
const jpeg = Buffer.from("ffd8ff", "hex");

const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });

const loadModule = async () => {
  assert.ok(existsSync(checkerUrl), "check-evidence.mjs がまだ無い");
  return import(checkerUrl);
};

const loadMigration = async () => {
  assert.ok(existsSync(migrationUrl), "migrate-evidence-sha.mjs がまだ無い");
  return import(migrationUrl);
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
    `verified_impl_sha: ${verifiedSha}\n`,
  );
  writeFileSync(
    join(root, ".docs/reviews/2026-08-01-input-preview.md"),
    `verified_impl_sha: ${verifiedSha}\n`,
  );
  writeFileSync(
    join(root, ".docs/reviews/2026-08-01-index-page.md"),
    `verified_impl_sha: ${verifiedSha}\n`,
  );
  writeFileSync(
    join(root, ".docs/reviews/2026-08-01-verification-catalog.md"),
    `verified_impl_sha: ${verifiedSha}\n`,
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

test("verified_impl_shaを一意な構造化欄として読む", async () => {
  const { parseVerificationSha } = await loadModule();
  const sha = "0123456789abcdef0123456789abcdef01234567";
  assert.deepEqual(parseVerificationSha(`verified_impl_sha: ${sha}\n`), { sha });
  assert.deepEqual(parseVerificationSha(`検証した commit: \`${sha}\`\n`), {
    problem: "verified_impl_sha が無い",
  });
  assert.deepEqual(parseVerificationSha(`verified_impl_sha: ${sha}\nverified_impl_sha: ${sha}\n`), {
    problem: "verified_impl_sha が複数ある",
  });
});

test("verified_impl_shaの欠落・重複・存在しないcommitをfail-closedにする", async (t) => {
  const { root, verifiedSha } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  const evidence = join(root, ".docs/reviews/2026-08-01-button-preview.md");

  writeFileSync(evidence, `検証した commit: \`${verifiedSha}\`\n`);
  assert.ok(
    checkEvidenceInRepo(root).problems.includes(
      "2026-08-01-button-preview.md: verified_impl_sha が無い",
    ),
  );

  writeFileSync(evidence, `verified_impl_sha: ${verifiedSha}\nverified_impl_sha: ${verifiedSha}\n`);
  assert.ok(
    checkEvidenceInRepo(root).problems.includes(
      "2026-08-01-button-preview.md: verified_impl_sha が複数ある",
    ),
  );

  const missingCommit = "f".repeat(40);
  writeFileSync(evidence, `verified_impl_sha: ${missingCommit}\n`);
  assert.ok(
    checkEvidenceInRepo(root).problems.includes(
      `2026-08-01-button-preview.md: 検証 SHA ${missingCommit} が commit として存在しない`,
    ),
  );
});

test("verified_impl_shaがHEADの祖先でなければfail-closedにする", async (t) => {
  const { root, verifiedSha } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  const currentBranch = git(root, ["branch", "--show-current"]).trim();
  git(root, ["switch", "-c", "sibling", verifiedSha]);
  writeFileSync(join(root, "sibling.txt"), "sibling\n");
  git(root, ["add", "sibling.txt"]);
  git(root, ["commit", "-m", "sibling"]);
  const siblingSha = git(root, ["rev-parse", "HEAD"]).trim();
  git(root, ["switch", currentBranch]);
  writeFileSync(
    join(root, ".docs/reviews/2026-08-01-button-preview.md"),
    `verified_impl_sha: ${siblingSha}\n`,
  );

  assert.ok(
    checkEvidenceInRepo(root).problems.includes(
      `2026-08-01-button-preview.md: 検証 SHA ${siblingSha} が現在のHEADの祖先ではない`,
    ),
  );
});

test("移行は旧位置依存ロジックの値を構造化欄へ等価に写し冪等である", async () => {
  const { legacyVerificationSha, migrateMarkdown, structuredVerificationSha } =
    await loadMigration();
  const first = "0123456789abcdef0123456789abcdef01234567";
  const later = "fedcba9876543210fedcba9876543210fedcba98";
  const before = `# 証跡\n\n初回: \`${first}\`\n最終: \`${later}\`\n`;
  const after = migrateMarkdown(before);

  assert.equal(legacyVerificationSha(before), first);
  assert.equal(structuredVerificationSha(after), first);
  assert.equal(legacyVerificationSha(after), first);
  assert.equal(migrateMarkdown(after), after);
});

test("移行は祖先symlink経由でrepo外の証跡を書き換えない", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "elchika-evidence-migration-root-"));
  const outside = mkdtempSync(join(tmpdir(), "elchika-evidence-migration-outside-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  mkdirSync(join(outside, "reviews"));
  const report = join(outside, "reviews/report.md");
  const sha = "0123456789abcdef0123456789abcdef01234567";
  writeFileSync(report, `# 証跡\n\ncommit: ${sha}\n`);
  symlinkSync(outside, join(root, ".docs"));
  const { migrateEvidence } = await loadMigration();

  assert.throws(
    () => migrateEvidence(join(root, ".docs/reviews"), { write: true, repositoryRoot: root }),
    /repo 内の通常ディレクトリ/,
  );
  assert.equal(readFileSync(report, "utf8"), `# 証跡\n\ncommit: ${sha}\n`);
});

test("移行はreviews配下のsymlink証跡を黙って除外しない", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "elchika-evidence-migration-nested-"));
  const outside = mkdtempSync(join(tmpdir(), "elchika-evidence-migration-target-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  mkdirSync(join(root, ".docs/reviews"), { recursive: true });
  const sha = "0123456789abcdef0123456789abcdef01234567";
  writeFileSync(join(root, ".docs/reviews/report.md"), `# 証跡\n\ncommit: ${sha}\n`);
  writeFileSync(join(outside, "linked.md"), `# 外部証跡\n\ncommit: ${sha}\n`);
  symlinkSync(join(outside, "linked.md"), join(root, ".docs/reviews/linked.md"));
  const { migrateEvidence } = await loadMigration();

  assert.throws(
    () => migrateEvidence(join(root, ".docs/reviews"), { write: true, repositoryRoot: root }),
    /通常ファイルではない/,
  );
  assert.equal(readFileSync(join(outside, "linked.md"), "utf8"), `# 外部証跡\n\ncommit: ${sha}\n`);
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
  ]);
  assert.deepEqual(result.stale, ["2026-08-01-verification-catalog.md: src/components/ui"]);
  assert.ok(
    !result.problems.some((problem) => problem.includes("input-preview")),
    "別componentの変更で input 証跡を落としてはならない",
  );
});

test("同じcomponentの古い証跡を残し、最新証跡だけを鮮度判定する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  writeFileSync(join(root, "src/components/ui/button.tsx"), "button reverified\n");
  git(root, ["add", "src/components/ui/button.tsx"]);
  git(root, ["commit", "-m", "change button before reverification"]);
  const latestVerifiedSha = git(root, ["rev-parse", "HEAD"]).trim();
  writeFileSync(
    join(root, ".docs/reviews/2026-08-02-button-preview.md"),
    `verified_impl_sha: ${latestVerifiedSha}\n`,
  );
  git(root, ["add", ".docs/reviews/2026-08-02-button-preview.md"]);
  git(root, ["commit", "-m", "add latest button evidence"]);

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, []);
});

test("同じcomponentの最新証跡より後の変更は hard failure にする", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  writeFileSync(join(root, "src/components/ui/button.tsx"), "button reverified\n");
  git(root, ["add", "src/components/ui/button.tsx"]);
  git(root, ["commit", "-m", "change button before reverification"]);
  const latestVerifiedSha = git(root, ["rev-parse", "HEAD"]).trim();
  writeFileSync(
    join(root, ".docs/reviews/2026-08-02-button-preview.md"),
    `verified_impl_sha: ${latestVerifiedSha}\n`,
  );
  git(root, ["add", ".docs/reviews/2026-08-02-button-preview.md"]);
  git(root, ["commit", "-m", "add latest button evidence"]);
  writeFileSync(join(root, "src/previews/button.tsx"), "button changed after evidence\n");

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, [
    "2026-08-02-button-preview.md: 検証 SHA 以降に component 固有 path が変更されている",
  ]);
});

test("同じcomponentの古い証跡もSHA構造検査の対象に残す", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  writeFileSync(join(root, "src/components/ui/button.tsx"), "button reverified\n");
  git(root, ["add", "src/components/ui/button.tsx"]);
  git(root, ["commit", "-m", "change button before reverification"]);
  const latestVerifiedSha = git(root, ["rev-parse", "HEAD"]).trim();
  writeFileSync(
    join(root, ".docs/reviews/2026-08-02-button-preview.md"),
    `verified_impl_sha: ${latestVerifiedSha}\n`,
  );
  git(root, ["add", ".docs/reviews/2026-08-02-button-preview.md"]);
  git(root, ["commit", "-m", "add latest button evidence"]);
  const missingCommit = "f".repeat(40);
  writeFileSync(
    join(root, ".docs/reviews/2026-08-01-button-preview.md"),
    `verified_impl_sha: ${missingCommit}\n`,
  );

  const result = checkEvidenceInRepo(root);

  assert.ok(
    result.problems.includes(
      `2026-08-01-button-preview.md: 検証 SHA ${missingCommit} が commit として存在しない`,
    ),
  );
});

test("検証済みcomponentの未コミット変更も hard failure にする", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  writeFileSync(join(root, "src/components/ui/button.tsx"), "button changed but uncommitted\n");

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, [
    "2026-08-01-button-preview.md: 検証 SHA 以降に component 固有 path が変更されている",
  ]);
  assert.deepEqual(result.stale, ["2026-08-01-verification-catalog.md: src/components/ui"]);
});

test("検証SHAに存在しないcomponent固有pathの未追跡追加も hard failure にする", async (t) => {
  const { root, verifiedSha } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  writeFileSync(
    join(root, ".docs/reviews/2026-08-01-new-widget-preview.md"),
    `verified_impl_sha: ${verifiedSha}\n`,
  );
  git(root, ["add", ".docs/reviews/2026-08-01-new-widget-preview.md"]);
  git(root, ["commit", "-m", "add new widget evidence"]);
  writeFileSync(join(root, "src/components/ui/new-widget.tsx"), "untracked component\n");
  writeFileSync(join(root, "src/previews/new-widget.tsx"), "untracked preview\n");
  writeFileSync(join(root, "src/pages/preview/new-widget.astro"), "untracked light\n");
  writeFileSync(join(root, "src/pages/preview/new-widget-dark.astro"), "untracked dark\n");

  assert.ok(
    checkEvidenceInRepo(root).problems.includes(
      "2026-08-01-new-widget-preview.md: 検証 SHA 以降に component 固有 path が変更されている",
    ),
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

test("index と catalog の集約 path が変わると陳腐化一覧へ出す", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  writeFileSync(join(root, "src/pages/index.astro"), "index changed\n");
  writeFileSync(join(root, "src/catalog/verification-catalog.tsx"), "catalog changed\n");
  git(root, ["add", "src/pages/index.astro", "src/catalog/verification-catalog.tsx"]);
  git(root, ["commit", "-m", "change index and catalog"]);

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.stale, [
    "2026-08-01-index-page.md: src/pages/index.astro",
    "2026-08-01-verification-catalog.md: src/catalog/verification-catalog.tsx",
  ]);
});

test("日付とscopeを持つcatalog証跡も実装変更を陳腐化一覧へ出す", async (t) => {
  const { root, verifiedSha } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  const batchCatalogEvidence = "2026-08-01-batch-static-2-catalog.md";
  writeFileSync(
    join(root, ".docs/reviews", batchCatalogEvidence),
    `verified_impl_sha: ${verifiedSha}\n`,
  );
  git(root, ["add", `.docs/reviews/${batchCatalogEvidence}`]);
  git(root, ["commit", "-m", "add batch catalog evidence"]);
  writeFileSync(join(root, "src/catalog/verification-catalog.tsx"), "catalog changed\n");
  writeFileSync(join(root, "src/previews/new-component.tsx"), "new preview\n");
  git(root, ["add", "src/catalog/verification-catalog.tsx", "src/previews/new-component.tsx"]);
  git(root, ["commit", "-m", "change catalog inputs"]);

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, []);
  assert.ok(
    result.stale.includes(
      `${batchCatalogEvidence}: src/catalog/verification-catalog.tsx, src/previews`,
    ),
    result.stale.join("\n"),
  );
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

test("reviews 配下の入れ子にある index 集約レポートも陳腐化一覧へ出す", async (t) => {
  const { root, verifiedSha } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  const reportDirectory = join(root, ".docs/reviews/catalog-index-r2");
  mkdirSync(reportDirectory, { recursive: true });
  writeFileSync(join(reportDirectory, "report.md"), `verified_impl_sha: ${verifiedSha}\n`);
  git(root, ["add", ".docs/reviews/catalog-index-r2/report.md"]);
  git(root, ["commit", "-m", "add deep verification report"]);
  writeFileSync(join(root, "src/pages/index.astro"), "index changed\n");
  git(root, ["add", "src/pages/index.astro"]);
  git(root, ["commit", "-m", "change index"]);

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.stale, [
    "2026-08-01-index-page.md: src/pages/index.astro",
    "catalog-index-r2/report.md: src/pages/index.astro",
  ]);
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

test("入れ子の catalog 集約 Markdown も陳腐化一覧へ出す", async (t) => {
  const { root, verifiedSha } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  const nestedDirectory = join(root, ".docs/reviews/deep");
  mkdirSync(nestedDirectory, { recursive: true });
  writeFileSync(
    join(nestedDirectory, "2026-08-01-verification-catalog.md"),
    `verified_impl_sha: ${verifiedSha}\n`,
  );
  git(root, ["add", ".docs/reviews/deep/2026-08-01-verification-catalog.md"]);
  git(root, ["commit", "-m", "add nested catalog evidence"]);
  writeFileSync(join(root, "src/catalog/verification-catalog.tsx"), "catalog changed\n");
  git(root, ["add", "src/catalog/verification-catalog.tsx"]);
  git(root, ["commit", "-m", "change catalog"]);

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.stale, [
    "2026-08-01-verification-catalog.md: src/catalog/verification-catalog.tsx",
    "deep/2026-08-01-verification-catalog.md: src/catalog/verification-catalog.tsx",
  ]);
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
