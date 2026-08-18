import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

const checkerUrl = new URL("./check-evidence.mjs", import.meta.url);
const migrationUrl = new URL("./migrate-evidence-sha.mjs", import.meta.url);
const png = Buffer.from("89504e470d0a1a0a", "hex");
const jpeg = Buffer.from("ffd8ff", "hex");
const sharedTokenPaths = ["src/styles/global.css", "src/styles/design-system/tokens.css"];
const sharedTokenImageSubjects = [
  "attachment",
  "alert",
  "badge",
  "button",
  "bubble",
  "dialog",
  "drawer",
  "menubar",
  "select",
  "tabs",
  "catalog",
  "alert-dialog",
  "sheet",
  "disabled-controls",
];

const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });

const loadModule = async () => {
  assert.ok(existsSync(checkerUrl), "check-evidence.mjs がまだ無い");
  return import(checkerUrl);
};

const loadMigration = async () => {
  assert.ok(existsSync(migrationUrl), "migrate-evidence-sha.mjs がまだ無い");
  return import(migrationUrl);
};

const addComponentEvidence = (root, report, verifiedSha) => {
  const stem = report.replace(/\.md$/, "");
  writeFileSync(
    join(root, ".docs/reviews", report),
    `verified_impl_sha: ${verifiedSha}\n${stem}-light.jpg\n${stem}-dark.jpg\n`,
  );
  writeFileSync(join(root, ".docs/reviews", `${stem}-light.jpg`), jpeg);
  writeFileSync(join(root, ".docs/reviews", `${stem}-dark.jpg`), jpeg);
  git(root, [
    "add",
    `.docs/reviews/${report}`,
    `.docs/reviews/${stem}-light.jpg`,
    `.docs/reviews/${stem}-dark.jpg`,
  ]);
};

const introduceReportImmutabilitySensor = (root) => {
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(
    join(root, "scripts/check-evidence.mjs"),
    "const REPORT_IMMUTABILITY_ENFORCEMENT_V1 = true;\n",
  );
  git(root, ["add", "scripts/check-evidence.mjs"]);
  git(root, ["commit", "-m", "introduce report immutability sensor"]);
  return git(root, ["rev-parse", "HEAD"]).trim();
};

const introduceVerificationShaFieldSensor = (root) => {
  const script = join(root, "scripts/check-evidence.mjs");
  appendFileSync(script, "const VERIFICATION_SHA_FIELD_ENFORCEMENT_V1 = true;\n");
  git(root, ["add", "scripts/check-evidence.mjs"]);
  git(root, ["commit", "-m", "introduce verification sha field sensor"]);
  return git(root, ["rev-parse", "HEAD"]).trim();
};

const introduceLegacyComponentSensor = (root) => {
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(
    join(root, "scripts/check-evidence.mjs"),
    "const introducedVerificationSha = true;\n",
  );
  git(root, ["add", "scripts/check-evidence.mjs"]);
  git(root, ["commit", "-m", "introduce legacy component sensor"]);
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
  mkdirSync(join(root, "src/styles/design-system"), { recursive: true });
  mkdirSync(join(root, "src/catalog"), { recursive: true });
  mkdirSync(join(root, "src/layouts"), { recursive: true });
  mkdirSync(join(root, "src/lib"), { recursive: true });
  mkdirSync(join(root, "src/pages"), { recursive: true });
  mkdirSync(join(root, ".docs/reviews"), { recursive: true });
  writeFileSync(join(root, "src/styles/global.css"), "tokens\n");
  writeFileSync(join(root, "src/styles/design-system/tokens.css"), "generated tokens\n");
  writeFileSync(join(root, "src/catalog/preview-manifest.mjs"), "manifest\n");
  writeFileSync(join(root, "src/catalog/previews.ts"), "previews\n");
  writeFileSync(join(root, "src/catalog/verification-catalog.tsx"), "catalog\n");
  writeFileSync(join(root, "src/layouts/main.astro"), "layout\n");
  writeFileSync(join(root, "src/lib/utils.ts"), "utils\n");
  writeFileSync(join(root, "src/pages/catalog.astro"), "catalog light\n");
  writeFileSync(join(root, "src/pages/catalog-dark.astro"), "catalog dark\n");
  writeFileSync(join(root, "src/pages/index.astro"), "index\n");
  writeFileSync(join(root, ".docs/reviews/button.png"), png);
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "source"]);
  const verifiedSha = git(root, ["rev-parse", "HEAD"]).trim();
  for (const name of ["button", "input"]) {
    writeFileSync(join(root, `.docs/reviews/${name}-preview-light.jpg`), jpeg);
    writeFileSync(join(root, `.docs/reviews/${name}-preview-dark.jpg`), jpeg);
  }
  writeFileSync(
    join(root, ".docs/reviews/2026-08-01-button-preview.md"),
    `verified_impl_sha: ${verifiedSha}\nbutton-preview-light.jpg\nbutton-preview-dark.jpg\n`,
  );
  writeFileSync(
    join(root, ".docs/reviews/2026-08-01-input-preview.md"),
    `verified_impl_sha: ${verifiedSha}\ninput-preview-light.jpg\ninput-preview-dark.jpg\n`,
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

const commitSharedTokenChange = (root) => {
  writeFileSync(join(root, "src/styles/global.css"), "brand tokens\n");
  writeFileSync(join(root, "src/styles/design-system/tokens.css"), "generated brand tokens\n");
  git(root, ["add", ...sharedTokenPaths]);
  git(root, ["commit", "-m", "change shared tokens"]);
  const globalTokenSha = git(root, ["rev-parse", "HEAD"]).trim();
  writeFileSync(join(root, "implementation.txt"), "implementation after tokens\n");
  git(root, ["add", "implementation.txt"]);
  git(root, ["commit", "-m", "implementation after tokens"]);
  const implementationSha = git(root, ["rev-parse", "HEAD"]).trim();
  return { globalTokenSha, implementationSha };
};

const addSharedTokenEvidence = (
  root,
  {
    report = "brand-token-migration/report.md",
    verifiedSha,
    targetedSha = verifiedSha,
    prefix = "after",
    omitField,
    omitSubject,
    stage = true,
    commit = false,
  },
) => {
  const reviewsRoot = join(root, ".docs/reviews");
  const reportPath = join(reviewsRoot, report);
  const reportDirectory = dirname(reportPath);
  mkdirSync(reportDirectory, { recursive: true });
  const lines = [`verified_impl_sha: ${verifiedSha}`];
  if (omitField !== "evidence_scope") lines.push("evidence_scope: shared-token-migration");
  if (omitField !== "targeted_dynamic_sha") lines.push(`targeted_dynamic_sha: ${targetedSha}`);
  writeFileSync(reportPath, `${lines.join("\n")}\n`);
  for (const subject of sharedTokenImageSubjects) {
    if (subject === omitSubject) continue;
    for (const theme of ["light", "dark"]) {
      writeFileSync(join(reportDirectory, `${prefix}-${subject}-${theme}.jpg`), jpeg);
    }
  }
  if (stage) git(root, ["add", `.docs/reviews/${report.split("/")[0]}`]);
  if (!commit) return undefined;
  git(root, ["commit", "-m", `add ${prefix} shared token evidence`]);
  return git(root, ["rev-parse", "HEAD"]).trim();
};

test("component固有Markdownの欠落を検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  rmSync(join(root, ".docs/reviews/2026-08-01-input-preview.md"));

  assert.ok(
    checkEvidenceInRepo(root).problems.includes("input: component 固有の証跡 Markdown が無い"),
  );
});

test("component固有light画像の欠落を検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  rmSync(join(root, ".docs/reviews/button-preview-light.jpg"));

  assert.ok(
    checkEvidenceInRepo(root).problems.includes(
      "2026-08-01-button-preview.md: 対応する light 証跡画像が無い",
    ),
  );
});

for (const state of ["committed", "staged", "unstaged"]) {
  test(`component固有画像を後から${state}置換すると検出する`, async (t) => {
    const { root } = createEvidenceRepo();
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const image = ".docs/reviews/button-preview-light.jpg";
    writeFileSync(join(root, image), Buffer.from("ffd8ff01", "hex"));
    if (state !== "unstaged") git(root, ["add", image]);
    if (state === "committed") git(root, ["commit", "-m", "replace component image"]);

    const result = (await loadModule()).checkEvidenceInRepo(root);

    assert.ok(
      result.problems.includes(
        "2026-08-01-button-preview.md: 対応する light 証跡画像が追加時から変更されている",
      ),
    );
  });
}

test("immutability sensor導入前のcomponent画像置換はbaseline時のblobを固定する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const image = ".docs/reviews/button-preview-light.jpg";
  writeFileSync(join(root, image), Buffer.from("ffd8ff01", "hex"));
  git(root, ["add", image]);
  git(root, ["commit", "-m", "replace component image before sensor"]);
  mkdirSync(join(root, "scripts"));
  writeFileSync(
    join(root, "scripts/check-evidence.mjs"),
    "const introducedVerificationSha = true;\n",
  );
  git(root, ["add", "scripts/check-evidence.mjs"]);
  git(root, ["commit", "-m", "introduce evidence immutability sensor"]);

  const result = (await loadModule()).checkEvidenceInRepo(root);

  assert.equal(
    result.problems.some((problem) => problem.includes("証跡画像が追加時から変更")),
    false,
  );
});

test("旧component sensor後かつ全証跡sensor前の画像更新は施行時baselineへ取り込む", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  introduceLegacyComponentSensor(root);
  const image = ".docs/reviews/button-preview-light.jpg";
  writeFileSync(join(root, image), Buffer.from("ffd8ff01", "hex"));
  git(root, ["add", image]);
  git(root, ["commit", "-m", "replace component image before all evidence sensor"]);
  introduceReportImmutabilitySensor(root);

  const result = (await loadModule()).checkEvidenceInRepo(root);

  assert.equal(
    result.problems.some(
      (problem) =>
        problem.includes("2026-08-01-button-preview.md") && problem.includes("追加時から変更"),
    ),
    false,
  );
});

test("verified_impl_shaだけを新HEADへ書き換えた旧画像流用を検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  writeFileSync(join(root, "src/components/ui/button.tsx"), "button changed without capture\n");
  git(root, ["add", "src/components/ui/button.tsx"]);
  git(root, ["commit", "-m", "change button without capture"]);
  const unverifiedSha = git(root, ["rev-parse", "HEAD"]).trim();
  writeFileSync(
    join(root, ".docs/reviews/2026-08-01-button-preview.md"),
    `verified_impl_sha: ${unverifiedSha}\nbutton-preview-light.jpg\nbutton-preview-dark.jpg\n`,
  );

  assert.ok(
    checkEvidenceInRepo(root).problems.includes(
      "2026-08-01-button-preview.md: verified_impl_sha が初回記録から変更されている",
    ),
  );
});

test("component外reportのverified_impl_sha書き換えを検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const originalSha = git(root, ["rev-parse", "HEAD"]).trim();
  const report = join(root, ".docs/reviews/2026-08-01-index-page.md");
  writeFileSync(report, `verified_impl_sha: ${originalSha}\n`);

  const result = (await loadModule()).checkEvidenceInRepo(root);

  assert.ok(
    result.problems.includes(
      "2026-08-01-index-page.md: verified_impl_sha が初回記録から変更されている",
    ),
  );
});

test("shared reportの構造化field書き換えを検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { implementationSha } = commitSharedTokenChange(root);
  addSharedTokenEvidence(root, { verifiedSha: implementationSha, commit: true });
  const report = join(root, ".docs/reviews/brand-token-migration/report.md");
  const replacementSha = git(root, ["rev-parse", "HEAD"]).trim();
  writeFileSync(
    report,
    `verified_impl_sha: ${implementationSha}\nevidence_scope: shared-token-migration\ntargeted_dynamic_sha: ${replacementSha}\n`,
  );

  const result = (await loadModule()).checkEvidenceInRepo(root);

  assert.ok(
    result.problems.includes(
      "brand-token-migration/report.md: targeted_dynamic_sha が初回記録から変更されている",
    ),
  );
});

test("初回記録のverified_impl_shaが不正なら後から有効値へ直しても検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  for (const path of [
    "src/components/ui/new-widget.tsx",
    "src/previews/new-widget.tsx",
    "src/pages/preview/new-widget.astro",
    "src/pages/preview/new-widget-dark.astro",
  ]) {
    writeFileSync(join(root, path), `${path}\n`);
  }
  git(root, ["add", "src"]);
  git(root, ["commit", "-m", "add new widget"]);
  const verifiedSha = git(root, ["rev-parse", "HEAD"]).trim();
  addComponentEvidence(root, "2026-08-02-new-widget-preview.md", "invalid");
  git(root, ["commit", "-m", "add invalid new widget evidence"]);
  writeFileSync(
    join(root, ".docs/reviews/2026-08-02-new-widget-preview.md"),
    `verified_impl_sha: ${verifiedSha}\n2026-08-02-new-widget-preview-light.jpg\n2026-08-02-new-widget-preview-dark.jpg\n`,
  );

  assert.ok(
    checkEvidenceInRepo(root).problems.includes(
      "2026-08-02-new-widget-preview.md: 初回記録の verified_impl_sha は40桁の小文字SHAでなければならない",
    ),
  );
});

test("report追加時にverified_impl_shaが無ければ後から全fieldを足しても検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  introduceReportImmutabilitySensor(root);
  introduceVerificationShaFieldSensor(root);
  const report = join(root, ".docs/reviews/2026-08-03-summary.md");
  writeFileSync(report, "# 初回は構造化fieldなし\n");
  git(root, ["add", ".docs/reviews/2026-08-03-summary.md"]);
  git(root, ["commit", "-m", "add report without verification fields"]);
  const verifiedSha = git(root, ["rev-parse", "HEAD"]).trim();
  writeFileSync(
    report,
    `verified_impl_sha: ${verifiedSha}\nevidence_scope: component\ntargeted_dynamic_sha: ${verifiedSha}\n`,
  );
  git(root, ["add", ".docs/reviews/2026-08-03-summary.md"]);
  git(root, ["commit", "-m", "add verification fields later"]);

  const result = (await loadModule()).checkEvidenceInRepo(root);

  assert.ok(result.problems.includes("2026-08-03-summary.md: 初回記録の verified_impl_sha が無い"));
});

test("全report sensor施行前から欄が無い歴史的文書は不遡及で受理する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  introduceReportImmutabilitySensor(root);
  const relativeReport = ".docs/reviews/implementation-review.md";
  writeFileSync(join(root, relativeReport), "# 実装レビュー\n\nflag: 0\n");
  git(root, ["add", relativeReport]);
  git(root, ["commit", "-m", "add historical implementation review"]);
  introduceVerificationShaFieldSensor(root);

  const result = (await loadModule()).checkEvidenceInRepo(root);

  assert.equal(
    result.problems.some((problem) => problem.includes("implementation-review.md")),
    false,
  );
});

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

test("immutability sensor導入前のlegacy reportは正式移行時をbaselineにする", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const relativeReport = ".docs/reviews/2026-07-30-legacy-summary.md";
  const report = join(root, relativeReport);
  writeFileSync(report, "# legacy report\n");
  git(root, ["add", relativeReport]);
  git(root, ["commit", "-m", "add legacy report before sensor"]);
  mkdirSync(join(root, "scripts"));
  writeFileSync(
    join(root, "scripts/check-evidence.mjs"),
    "const introducedVerificationSha = true;\n",
  );
  git(root, ["add", "scripts/check-evidence.mjs"]);
  git(root, ["commit", "-m", "introduce evidence immutability sensor"]);
  const verifiedSha = git(root, ["rev-parse", "HEAD"]).trim();
  writeFileSync(report, `verified_impl_sha: ${verifiedSha}\n`);
  git(root, ["add", relativeReport]);
  git(root, ["commit", "-m", "migrate legacy report"]);

  const result = (await loadModule()).checkEvidenceInRepo(root);

  assert.equal(
    result.problems.some((problem) => problem.includes("2026-07-30-legacy-summary.md")),
    false,
  );
});

test("全report sensor施行前の正当な複数更新は施行直前blobをbaselineにする", async (t) => {
  const { root, verifiedSha } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const relativeReport = ".docs/reviews/2026-08-02-batch-final-review.md";
  const report = join(root, relativeReport);
  writeFileSync(report, `verified_impl_sha: ${verifiedSha}\n初回レビュー\n`);
  git(root, ["add", relativeReport]);
  git(root, ["commit", "-m", "add final review"]);
  for (const message of ["CI修正後レビュー", "配布型修正後レビュー"]) {
    const implementationSha = git(root, ["rev-parse", "HEAD"]).trim();
    writeFileSync(report, `verified_impl_sha: ${implementationSha}\n${message}\n`);
    git(root, ["add", relativeReport]);
    git(root, ["commit", "-m", message]);
  }
  introduceReportImmutabilitySensor(root);

  const result = (await loadModule()).checkEvidenceInRepo(root);

  assert.equal(
    result.problems.some((problem) => problem.includes("2026-08-02-batch-final-review.md")),
    false,
  );
});

test("全report sensor施行後のverified_impl_sha書き換えを検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sensorSha = introduceReportImmutabilitySensor(root);
  const report = join(root, ".docs/reviews/2026-08-01-index-page.md");
  writeFileSync(report, `verified_impl_sha: ${sensorSha}\n`);
  git(root, ["add", ".docs/reviews/2026-08-01-index-page.md"]);
  git(root, ["commit", "-m", "rewrite verified sha after sensor"]);
  writeFileSync(join(root, "unrelated.txt"), "baselineを動かさない後続変更\n");
  git(root, ["add", "unrelated.txt"]);
  git(root, ["commit", "-m", "add unrelated follow-up"]);

  const result = (await loadModule()).checkEvidenceInRepo(root);

  assert.ok(
    result.problems.some(
      (problem) =>
        problem.includes("2026-08-01-index-page.md") && problem.includes("baselineから変更"),
    ),
  );
});

for (const state of ["committed", "staged", "unstaged"]) {
  test(`全report sensor施行後の本文${state}変更を検出する`, async (t) => {
    const { root } = createEvidenceRepo();
    t.after(() => rmSync(root, { recursive: true, force: true }));
    introduceReportImmutabilitySensor(root);
    const relativeReport = ".docs/reviews/2026-08-01-index-page.md";
    const report = join(root, relativeReport);
    const original = readFileSync(report, "utf8");
    writeFileSync(report, `${original}本文を変更\n`);
    if (state !== "unstaged") git(root, ["add", relativeReport]);
    if (state === "committed") git(root, ["commit", "-m", "rewrite report body"]);

    const result = (await loadModule()).checkEvidenceInRepo(root);

    assert.ok(
      result.problems.some(
        (problem) =>
          problem.includes("2026-08-01-index-page.md") && problem.includes("baselineから変更"),
      ),
    );
  });
}

test("全report sensor施行後のrenameと同時書き換えを検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sensorSha = introduceReportImmutabilitySensor(root);
  const oldPath = ".docs/reviews/2026-08-01-index-page.md";
  const newPath = ".docs/reviews/2026-08-03-renamed-index-page.md";
  git(root, ["mv", oldPath, newPath]);
  writeFileSync(join(root, newPath), `verified_impl_sha: ${sensorSha}\nrename後に変更\n`);
  git(root, ["add", newPath]);
  git(root, ["commit", "-m", "rename and rewrite report"]);

  const result = (await loadModule()).checkEvidenceInRepo(root);

  assert.ok(
    result.problems.some(
      (problem) => problem.includes("2026-08-01-index-page.md") && problem.includes("削除・rename"),
    ),
  );
});

test("pathspec magicを含むreportの施行後変更をliteral pathで検出する", async (t) => {
  const { root, verifiedSha } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  introduceReportImmutabilitySensor(root);
  const relativeReport = ".docs/reviews/[batch]/report.md";
  mkdirSync(dirname(join(root, relativeReport)), { recursive: true });
  writeFileSync(join(root, relativeReport), `verified_impl_sha: ${verifiedSha}\n初回\n`);
  git(root, ["--literal-pathspecs", "add", relativeReport]);
  git(root, ["commit", "-m", "add pathspec report"]);
  writeFileSync(join(root, relativeReport), `verified_impl_sha: ${verifiedSha}\n変更後\n`);
  git(root, ["--literal-pathspecs", "add", relativeReport]);
  git(root, ["commit", "-m", "rewrite pathspec report"]);

  const result = (await loadModule()).checkEvidenceInRepo(root);

  assert.ok(
    result.problems.some(
      (problem) => problem.includes("[batch]/report.md") && problem.includes("baselineから変更"),
    ),
  );
});

test("pathspec reportのstaged改変をworking tree復元で相殺できない", async (t) => {
  const { root, verifiedSha } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  introduceReportImmutabilitySensor(root);
  const report = ".docs/reviews/[batch]/report.md";
  mkdirSync(dirname(join(root, report)), { recursive: true });
  const original = `verified_impl_sha: ${verifiedSha}\n初回\n`;
  writeFileSync(join(root, report), original);
  git(root, ["--literal-pathspecs", "add", report]);
  git(root, ["commit", "-m", "add pathspec report"]);
  writeFileSync(join(root, report), `${original}staged改変\n`);
  git(root, ["--literal-pathspecs", "add", report]);
  writeFileSync(join(root, report), original);

  const result = (await loadModule()).checkEvidenceInRepo(root);

  assert.ok(
    result.problems.some(
      (problem) => problem.includes("[batch]/report.md") && problem.includes("baselineから変更"),
    ),
  );
});

test("component sourceのstaged改変をworking tree復元で相殺できない", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = "src/components/ui/button.tsx";
  const original = readFileSync(join(root, source));
  writeFileSync(join(root, source), "staged component改変\n");
  git(root, ["add", source]);
  writeFileSync(join(root, source), original);

  const result = (await loadModule()).checkEvidenceInRepo(root);

  assert.ok(
    result.problems.includes(
      "2026-08-01-button-preview.md: 検証 SHA 以降に component 固有 path が変更されている",
    ),
  );
});

test("pathspec magicを含む画像の施行後置換をliteral pathで検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  introduceReportImmutabilitySensor(root);
  const image = ".docs/reviews/[batch]/capture*.jpg";
  mkdirSync(dirname(join(root, image)), { recursive: true });
  writeFileSync(join(root, image), jpeg);
  git(root, ["--literal-pathspecs", "add", image]);
  git(root, ["commit", "-m", "add pathspec image"]);
  writeFileSync(join(root, image), Buffer.from("ffd8ff01", "hex"));
  git(root, ["--literal-pathspecs", "add", image]);
  git(root, ["commit", "-m", "replace pathspec image"]);

  const result = (await loadModule()).checkEvidenceInRepo(root);

  assert.ok(
    result.problems.some(
      (problem) => problem.includes("[batch]/capture*.jpg") && problem.includes("baselineから変更"),
    ),
  );
});

test("施行後の文書変更を元bytesへ戻しても履歴変更として検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  introduceReportImmutabilitySensor(root);
  const report = ".docs/reviews/2026-08-01-index-page.md";
  const original = readFileSync(join(root, report));
  writeFileSync(
    join(root, report),
    "verified_impl_sha: 0000000000000000000000000000000000000000\n",
  );
  git(root, ["add", report]);
  git(root, ["commit", "-m", "rewrite report after enforcement"]);
  writeFileSync(join(root, report), original);
  git(root, ["add", report]);
  git(root, ["commit", "-m", "restore report bytes"]);

  const result = (await loadModule()).checkEvidenceInRepo(root);

  assert.ok(
    result.problems.some(
      (problem) => problem.includes("2026-08-01-index-page.md") && problem.includes("施行後の履歴"),
    ),
  );
});

test("施行後に画像を削除して同じbytesで復元しても履歴変更として検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  introduceReportImmutabilitySensor(root);
  const image = ".docs/reviews/button-preview-light.jpg";
  const original = readFileSync(join(root, image));
  rmSync(join(root, image));
  git(root, ["add", image]);
  git(root, ["commit", "-m", "delete image after enforcement"]);
  writeFileSync(join(root, image), original);
  git(root, ["add", image]);
  git(root, ["commit", "-m", "restore image bytes"]);

  const result = (await loadModule()).checkEvidenceInRepo(root);

  assert.ok(
    result.problems.some(
      (problem) => problem.includes("button-preview-light.jpg") && problem.includes("施行後の履歴"),
    ),
  );
});

test("施行後に文書をrenameして元pathへ戻しても履歴変更として検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  introduceReportImmutabilitySensor(root);
  const report = ".docs/reviews/2026-08-01-index-page.md";
  const moved = ".docs/reviews/temporary-index-page.md";
  git(root, ["mv", report, moved]);
  git(root, ["commit", "-m", "rename report after enforcement"]);
  git(root, ["mv", moved, report]);
  git(root, ["commit", "-m", "restore report path"]);

  const result = (await loadModule()).checkEvidenceInRepo(root);

  assert.ok(
    result.problems.some(
      (problem) => problem.includes("2026-08-01-index-page.md") && problem.includes("施行後の履歴"),
    ),
  );
});

test("有効な shared token report は runtime token 2層の historical stale を cover する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { implementationSha } = commitSharedTokenChange(root);
  addSharedTokenEvidence(root, { verifiedSha: implementationSha, commit: true });
  const { checkEvidenceInRepo } = await loadModule();

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, []);
  assert.deepEqual([...result.coverage.coveredPaths], sharedTokenPaths);
  assert.deepEqual(result.displayStale, []);
});

test("verified_impl_sha が global.css 変更 commit と同一なら cover しない", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { globalTokenSha } = commitSharedTokenChange(root);
  addSharedTokenEvidence(root, { verifiedSha: globalTokenSha, commit: true });
  const { checkEvidenceInRepo } = await loadModule();

  const result = checkEvidenceInRepo(root);

  assert.deepEqual([...result.coverage.coveredPaths], []);
  assert.ok(result.problems.some((problem) => problem.includes("厳密な祖先")));
  assert.ok(result.displayStale.some((entry) => entry.includes("src/styles/global.css")));
});

test("targeted_dynamic_sha が欠落した report は fail-closed にする", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { implementationSha } = commitSharedTokenChange(root);
  addSharedTokenEvidence(root, {
    verifiedSha: implementationSha,
    omitField: "targeted_dynamic_sha",
    commit: true,
  });
  const { checkEvidenceInRepo } = await loadModule();

  const result = checkEvidenceInRepo(root);

  assert.deepEqual([...result.coverage.coveredPaths], []);
  assert.ok(result.problems.some((problem) => problem.includes("targeted_dynamic_sha が無い")));
});

test("targeted_dynamic_sha が存在しない commit なら fail-closed にする", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { implementationSha } = commitSharedTokenChange(root);
  const missingCommit = "f".repeat(40);
  addSharedTokenEvidence(root, {
    verifiedSha: implementationSha,
    targetedSha: missingCommit,
    commit: true,
  });
  const { checkEvidenceInRepo } = await loadModule();

  const result = checkEvidenceInRepo(root);

  assert.deepEqual([...result.coverage.coveredPaths], []);
  assert.ok(
    result.problems.some((problem) =>
      problem.includes(`targeted_dynamic_sha ${missingCommit} が commit として存在しない`),
    ),
  );
});

test("verified_impl_sha が targeted_dynamic_sha の祖先でなければ cover しない", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { globalTokenSha, implementationSha } = commitSharedTokenChange(root);
  addSharedTokenEvidence(root, {
    verifiedSha: implementationSha,
    targetedSha: globalTokenSha,
    commit: true,
  });
  const { checkEvidenceInRepo } = await loadModule();

  const result = checkEvidenceInRepo(root);

  assert.deepEqual([...result.coverage.coveredPaths], []);
  assert.ok(result.problems.some((problem) => problem.includes("動的検証 SHA の祖先ではない")));
});

for (const tokenPath of sharedTokenPaths) {
  for (const state of ["committed", "staged", "unstaged"]) {
    test(`targeted SHA 後の ${state} ${tokenPath} 変更は coverage を失わせる`, async (t) => {
      const { root } = createEvidenceRepo();
      t.after(() => rmSync(root, { recursive: true, force: true }));
      const { implementationSha } = commitSharedTokenChange(root);
      addSharedTokenEvidence(root, { verifiedSha: implementationSha, commit: true });
      writeFileSync(join(root, tokenPath), `${state} change after dynamic verification\n`);
      if (state !== "unstaged") git(root, ["add", tokenPath]);
      if (state === "committed") {
        git(root, ["commit", "-m", `change ${tokenPath} after dynamic verification`]);
      }
      const { checkEvidenceInRepo } = await loadModule();

      const result = checkEvidenceInRepo(root);

      assert.deepEqual([...result.coverage.coveredPaths], []);
      assert.ok(
        result.problems.some(
          (problem) => problem.includes("動的検証 SHA 以降") && problem.includes(tokenPath),
        ),
      );
    });
  }
}

test("shared coverage は component 固有 path の hard failure を解除しない", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { implementationSha } = commitSharedTokenChange(root);
  addSharedTokenEvidence(root, { verifiedSha: implementationSha, commit: true });
  writeFileSync(join(root, "src/components/ui/button.tsx"), "uncommitted component change\n");
  const { checkEvidenceInRepo } = await loadModule();

  const result = checkEvidenceInRepo(root);

  assert.ok(
    result.problems.includes(
      "2026-08-01-button-preview.md: 検証 SHA 以降に component 固有 path が変更されている",
    ),
  );
  assert.deepEqual([...result.coverage.coveredPaths], sharedTokenPaths);
});

test("untracked の単一 shared report と画像を commit 前でも検査する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { implementationSha } = commitSharedTokenChange(root);
  addSharedTokenEvidence(root, {
    verifiedSha: implementationSha,
    stage: false,
  });
  const { checkEvidenceInRepo } = await loadModule();

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, []);
  assert.deepEqual([...result.coverage.coveredPaths], sharedTokenPaths);
});

test("shared report と同時追加する画像が欠ければ cover しない", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { implementationSha } = commitSharedTokenChange(root);
  addSharedTokenEvidence(root, {
    verifiedSha: implementationSha,
    omitSubject: "disabled-controls",
    commit: true,
  });
  const { checkEvidenceInRepo } = await loadModule();

  const result = checkEvidenceInRepo(root);

  assert.deepEqual([...result.coverage.coveredPaths], []);
  assert.ok(result.problems.some((problem) => problem.includes("disabled-controls-light")));
  assert.ok(result.problems.some((problem) => problem.includes("disabled-controls-dark")));
});

for (const state of ["committed", "staged", "unstaged"]) {
  test(`shared reportの画像を後から${state}削除するとcoverしない`, async (t) => {
    const { root } = createEvidenceRepo();
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const { implementationSha } = commitSharedTokenChange(root);
    addSharedTokenEvidence(root, { verifiedSha: implementationSha, commit: true });
    const image = ".docs/reviews/brand-token-migration/after-disabled-controls-light.jpg";
    rmSync(join(root, image));
    if (state !== "unstaged") git(root, ["add", image]);
    if (state === "committed") git(root, ["commit", "-m", "delete shared image"]);

    const result = (await loadModule()).checkEvidenceInRepo(root);

    assert.deepEqual([...result.coverage.coveredPaths], []);
    assert.ok(
      result.problems.some(
        (problem) => problem.includes("disabled-controls-light") && problem.includes("現在"),
      ),
    );
  });
}

for (const state of ["committed", "staged", "unstaged"]) {
  test(`shared reportの画像を後から${state}置換するとcoverしない`, async (t) => {
    const { root } = createEvidenceRepo();
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const { implementationSha } = commitSharedTokenChange(root);
    addSharedTokenEvidence(root, { verifiedSha: implementationSha, commit: true });
    const image = ".docs/reviews/brand-token-migration/after-disabled-controls-light.jpg";
    writeFileSync(join(root, image), Buffer.from("ffd8ff01", "hex"));
    if (state !== "unstaged") git(root, ["add", image]);
    if (state === "committed") git(root, ["commit", "-m", "replace shared image"]);

    const result = (await loadModule()).checkEvidenceInRepo(root);

    assert.deepEqual([...result.coverage.coveredPaths], []);
    assert.ok(
      result.problems.some(
        (problem) =>
          problem.includes("disabled-controls-light") && problem.includes("追加時から変更"),
      ),
    );
  });
}

test("同じ verified_impl_sha の shared report は追加 commit が新しい方を採用する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { implementationSha } = commitSharedTokenChange(root);
  addSharedTokenEvidence(root, {
    report: "brand-token-migration/report-old.md",
    verifiedSha: implementationSha,
    prefix: "2026-08-02",
    omitField: "targeted_dynamic_sha",
    commit: true,
  });
  addSharedTokenEvidence(root, {
    report: "brand-token-migration/report.md",
    verifiedSha: implementationSha,
    prefix: "2026-08-03",
    commit: true,
  });
  const { checkEvidenceInRepo } = await loadModule();

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, []);
  assert.deepEqual([...result.coverage.coveredPaths], sharedTokenPaths);
  assert.equal(result.coverage.report, "brand-token-migration/report.md");
});

test("staged の単一 shared report と画像を commit 前でも検査する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { implementationSha } = commitSharedTokenChange(root);
  addSharedTokenEvidence(root, { verifiedSha: implementationSha });
  const { checkEvidenceInRepo } = await loadModule();

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, []);
  assert.deepEqual([...result.coverage.coveredPaths], sharedTokenPaths);
});

test("working tree の shared report が複数あれば fail-closed にする", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { implementationSha } = commitSharedTokenChange(root);
  addSharedTokenEvidence(root, {
    report: "brand-token-a/report.md",
    verifiedSha: implementationSha,
    prefix: "2026-08-02",
    stage: false,
  });
  addSharedTokenEvidence(root, {
    report: "brand-token-b/report.md",
    verifiedSha: implementationSha,
    prefix: "2026-08-03",
    stage: false,
  });
  const { checkEvidenceInRepo } = await loadModule();

  const result = checkEvidenceInRepo(root);

  assert.deepEqual([...result.coverage.coveredPaths], []);
  assert.ok(result.problems.some((problem) => problem.includes("最新証跡が一意に決まらない")));
});

test("追加 commit が分岐した shared report は fail-closed にする", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { implementationSha } = commitSharedTokenChange(root);
  const trunk = git(root, ["branch", "--show-current"]).trim();

  git(root, ["switch", "-c", "shared-a"]);
  addSharedTokenEvidence(root, {
    report: "brand-token-a/report.md",
    verifiedSha: implementationSha,
    prefix: "2026-08-02",
    commit: true,
  });

  git(root, ["switch", "-c", "shared-b", implementationSha]);
  addSharedTokenEvidence(root, {
    report: "brand-token-b/report.md",
    verifiedSha: implementationSha,
    prefix: "2026-08-03",
    commit: true,
  });

  git(root, ["switch", trunk]);
  git(root, ["merge", "--no-ff", "shared-a", "-m", "merge shared a"]);
  git(root, ["merge", "--no-ff", "shared-b", "-m", "merge shared b"]);
  const { checkEvidenceInRepo } = await loadModule();

  const result = checkEvidenceInRepo(root);

  assert.deepEqual([...result.coverage.coveredPaths], []);
  assert.ok(result.problems.some((problem) => problem.includes("最新証跡が一意に決まらない")));
});

test("targeted_dynamic_sha が HEAD の祖先でなければ fail-closed にする", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { implementationSha } = commitSharedTokenChange(root);
  const trunk = git(root, ["branch", "--show-current"]).trim();
  git(root, ["switch", "-c", "dynamic-sibling", implementationSha]);
  writeFileSync(join(root, "dynamic-sibling.txt"), "sibling verification\n");
  git(root, ["add", "dynamic-sibling.txt"]);
  git(root, ["commit", "-m", "dynamic sibling"]);
  const siblingSha = git(root, ["rev-parse", "HEAD"]).trim();
  git(root, ["switch", trunk]);
  addSharedTokenEvidence(root, {
    verifiedSha: implementationSha,
    targetedSha: siblingSha,
    commit: true,
  });
  const { checkEvidenceInRepo } = await loadModule();

  const result = checkEvidenceInRepo(root);

  assert.deepEqual([...result.coverage.coveredPaths], []);
  assert.ok(result.problems.some((problem) => problem.includes("現在のHEADの祖先ではない")));
});

test("human stale は最新 component と最新 aggregate を残し過去履歴を要約する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "src/components/ui/button.tsx"), "button reverified\n");
  git(root, ["add", "src/components/ui/button.tsx"]);
  git(root, ["commit", "-m", "change button before reverification"]);
  const latestVerifiedSha = git(root, ["rev-parse", "HEAD"]).trim();
  addComponentEvidence(root, "2026-08-02-button-preview.md", latestVerifiedSha);
  git(root, ["commit", "-m", "add latest button evidence"]);
  for (const report of ["2026-08-02-index-page.md", "2026-08-02-batch-new-catalog.md"]) {
    writeFileSync(join(root, ".docs/reviews", report), `verified_impl_sha: ${latestVerifiedSha}\n`);
    git(root, ["add", `.docs/reviews/${report}`]);
    git(root, ["commit", "-m", `add ${report}`]);
  }
  writeFileSync(join(root, "src/styles/global.css"), "shared token changed after evidence\n");
  git(root, ["add", "src/styles/global.css"]);
  git(root, ["commit", "-m", "change shared token after all evidence"]);
  const { checkEvidenceInRepo } = await loadModule();

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, []);
  assert.ok(result.displayStale.includes("2026-08-02-button-preview.md: src/styles/global.css"));
  assert.ok(result.displayStale.includes("2026-08-01-input-preview.md: src/styles/global.css"));
  assert.ok(result.displayStale.includes("2026-08-02-index-page.md: src/styles/global.css"));
  assert.ok(result.displayStale.includes("2026-08-02-batch-new-catalog.md: src/styles/global.css"));
  assert.ok(
    result.displayStale.includes(
      "過去履歴の shared stale: 3 件（形式・immutability は全件検査済み）",
    ),
  );
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

test("registry itemが所有する補助sourceの変更もcomponent固有pathとして扱う", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  writeFileSync(
    join(root, "registry.json"),
    `${JSON.stringify(
      {
        items: [
          {
            name: "button",
            files: [
              { path: "src/components/ui/button.tsx", type: "registry:ui" },
              { path: "src/components/ui/button-style.ts", type: "registry:ui" },
              { path: "src/styles/global.css", type: "registry:file" },
            ],
          },
        ],
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(join(root, "src/components/ui/button-style.ts"), "button helper\n");
  git(root, ["add", "registry.json", "src/components/ui/button-style.ts"]);
  git(root, ["commit", "-m", "add button helper after evidence"]);

  assert.ok(
    checkEvidenceInRepo(root).problems.includes(
      "2026-08-01-button-preview.md: 検証 SHA 以降に component 固有 path が変更されている",
    ),
  );
});

test("registry pathのGit pathspec magicでcomponent固有pathを除外できない", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  writeFileSync(
    join(root, "registry.json"),
    `${JSON.stringify(
      {
        items: [
          {
            name: "button",
            files: [
              {
                path: ":(exclude)src/components/ui/button.tsx",
                type: "registry:ui",
              },
            ],
          },
        ],
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(join(root, "src/components/ui/button.tsx"), "button changed\n");

  const result = checkEvidenceInRepo(root);

  assert.ok(
    result.problems.includes(
      "button: registry path :(exclude)src/components/ui/button.tsx はrepo内の通常相対pathでなければならない",
    ),
  );
  assert.ok(
    result.problems.includes(
      "2026-08-01-button-preview.md: 検証 SHA 以降に component 固有 path が変更されている",
    ),
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
  addComponentEvidence(root, "2026-08-02-button-preview.md", latestVerifiedSha);
  git(root, ["commit", "-m", "add latest button evidence"]);

  const result = checkEvidenceInRepo(root);

  assert.deepEqual(result.problems, []);
});

test("同じcomponentの古い証跡でもverified_impl_shaの改変を検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  const replacementSha = git(root, ["rev-parse", "HEAD"]).trim();
  writeFileSync(join(root, "src/components/ui/button.tsx"), "button reverified\n");
  git(root, ["add", "src/components/ui/button.tsx"]);
  git(root, ["commit", "-m", "change button before reverification"]);
  const latestVerifiedSha = git(root, ["rev-parse", "HEAD"]).trim();
  addComponentEvidence(root, "2026-08-02-button-preview.md", latestVerifiedSha);
  git(root, ["commit", "-m", "add latest button evidence"]);
  writeFileSync(
    join(root, ".docs/reviews/2026-08-01-button-preview.md"),
    `verified_impl_sha: ${replacementSha}\nbutton-preview-light.jpg\nbutton-preview-dark.jpg\n`,
  );

  assert.ok(
    checkEvidenceInRepo(root).problems.includes(
      "2026-08-01-button-preview.md: verified_impl_sha が初回記録から変更されている",
    ),
  );
});

test("既存component証跡をrenameしてSHAを書き換えても削除として検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  writeFileSync(join(root, "src/components/ui/button.tsx"), "button changed without capture\n");
  git(root, ["add", "src/components/ui/button.tsx"]);
  git(root, ["commit", "-m", "change button without capture"]);
  const unverifiedSha = git(root, ["rev-parse", "HEAD"]).trim();
  git(root, [
    "mv",
    ".docs/reviews/2026-08-01-button-preview.md",
    ".docs/reviews/2026-08-02-button-preview.md",
  ]);
  git(root, [
    "mv",
    ".docs/reviews/button-preview-light.jpg",
    ".docs/reviews/2026-08-02-button-preview-light.jpg",
  ]);
  git(root, [
    "mv",
    ".docs/reviews/button-preview-dark.jpg",
    ".docs/reviews/2026-08-02-button-preview-dark.jpg",
  ]);
  writeFileSync(
    join(root, ".docs/reviews/2026-08-02-button-preview.md"),
    `verified_impl_sha: ${unverifiedSha}\n2026-08-02-button-preview-light.jpg\n2026-08-02-button-preview-dark.jpg\n`,
  );
  git(root, ["add", ".docs/reviews"]);
  git(root, ["commit", "-m", "rename evidence and rewrite sha"]);

  assert.ok(
    checkEvidenceInRepo(root).problems.includes(
      "2026-08-01-button-preview.md: 過去のcomponent証跡は削除・renameできない",
    ),
  );
});

test("既存component証跡fileを同名directoryへ置換しても削除として検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  writeFileSync(join(root, "src/components/ui/button.tsx"), "button reverified\n");
  git(root, ["add", "src/components/ui/button.tsx"]);
  git(root, ["commit", "-m", "change button before reverification"]);
  const latestVerifiedSha = git(root, ["rev-parse", "HEAD"]).trim();
  addComponentEvidence(root, "2026-08-02-button-preview.md", latestVerifiedSha);
  git(root, ["commit", "-m", "add latest button evidence"]);
  git(root, ["rm", ".docs/reviews/2026-08-01-button-preview.md"]);
  mkdirSync(join(root, ".docs/reviews/2026-08-01-button-preview.md"));
  writeFileSync(
    join(root, ".docs/reviews/2026-08-01-button-preview.md/note.txt"),
    "旧証跡を置換\n",
  );
  git(root, ["add", ".docs/reviews/2026-08-01-button-preview.md/note.txt"]);
  git(root, ["commit", "-m", "replace old evidence file with directory"]);

  assert.ok(
    checkEvidenceInRepo(root).problems.includes(
      "2026-08-01-button-preview.md: 過去のcomponent証跡は削除・renameできない",
    ),
  );
});

test("分岐した証跡SHAが複数あればcommit件数にかかわらずfail-closedにする", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  const trunk = git(root, ["branch", "--show-current"]).trim();
  const forkBase = git(root, ["rev-parse", "HEAD"]).trim();

  git(root, ["switch", "-c", "candidate-a"]);
  writeFileSync(join(root, "candidate-a-prelude.txt"), "prelude\n");
  git(root, ["add", "candidate-a-prelude.txt"]);
  git(root, ["commit", "-m", "candidate a prelude"]);
  writeFileSync(join(root, "src/components/ui/button.tsx"), "button candidate a\n");
  git(root, ["add", "src/components/ui/button.tsx"]);
  git(root, ["commit", "-m", "candidate a implementation"]);
  const candidateA = git(root, ["rev-parse", "HEAD"]).trim();
  addComponentEvidence(root, "2026-08-02-button-preview.md", candidateA);
  git(root, ["commit", "-m", "candidate a evidence"]);

  git(root, ["switch", "-c", "candidate-b", forkBase]);
  writeFileSync(join(root, "candidate-b.txt"), "candidate b\n");
  git(root, ["add", "candidate-b.txt"]);
  git(root, ["commit", "-m", "candidate b implementation"]);
  const candidateB = git(root, ["rev-parse", "HEAD"]).trim();
  addComponentEvidence(root, "2026-08-03-button-preview.md", candidateB);
  git(root, ["commit", "-m", "candidate b evidence"]);

  git(root, ["switch", trunk]);
  git(root, ["merge", "--no-ff", "candidate-a", "-m", "merge candidate a"]);
  git(root, ["merge", "--no-ff", "candidate-b", "-m", "merge candidate b"]);

  const result = checkEvidenceInRepo(root);

  assert.ok(
    result.problems.includes(
      "button: 最新証跡が一意に決まらない (2026-08-02-button-preview.md, 2026-08-03-button-preview.md)",
    ),
  );
});

test("同じcomponentの最新証跡より後の変更は hard failure にする", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await loadModule();
  writeFileSync(join(root, "src/components/ui/button.tsx"), "button reverified\n");
  git(root, ["add", "src/components/ui/button.tsx"]);
  git(root, ["commit", "-m", "change button before reverification"]);
  const latestVerifiedSha = git(root, ["rev-parse", "HEAD"]).trim();
  addComponentEvidence(root, "2026-08-02-button-preview.md", latestVerifiedSha);
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
  addComponentEvidence(root, "2026-08-02-button-preview.md", latestVerifiedSha);
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

// block の証跡カバレッジ強制。走査根が src/components/ui 固定だった間は、
// block の証跡を 1 枚も撮らなくても緑で通った（hunk を戻すと 84 pass / 0 fail のまま）。
const addBlockToRepo = (root, { withProvenance = true, withRegistryItem = false } = {}) => {
  mkdirSync(join(root, "src/blocks/login-01/components"), { recursive: true });
  writeFileSync(join(root, "src/blocks/login-01/components/login-form.tsx"), "login form\n");
  if (withProvenance) {
    writeFileSync(
      join(root, "provenance.json"),
      `${JSON.stringify({ components: {}, blocks: { "login-01": { license: "MIT" } } }, null, 2)}\n`,
    );
  }
  if (withRegistryItem) {
    writeFileSync(
      join(root, "registry.json"),
      `${JSON.stringify({ items: [{ name: "login-01", type: "registry:block" }] }, null, 2)}\n`,
    );
  }
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "add block"]);
};

test("block の証跡 Markdown が無ければ検出する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await import("./check-evidence.mjs");
  addBlockToRepo(root);

  const { problems } = checkEvidenceInRepo(root);
  assert.ok(
    problems.includes("login-01: component 固有の証跡 Markdown が無い"),
    problems.join("\n"),
  );
});

// ディスクに実体が無く来歴にだけ載っている block も対象になる（走査根の和集合）。
test("来歴にだけ載っている block も証跡を要求する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await import("./check-evidence.mjs");
  writeFileSync(
    join(root, "provenance.json"),
    `${JSON.stringify({ components: {}, blocks: { "ghost-01": { license: "MIT" } } }, null, 2)}\n`,
  );
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "ledger only block"]);

  const { problems } = checkEvidenceInRepo(root);
  assert.ok(
    problems.includes("ghost-01: component 固有の証跡 Markdown が無い"),
    problems.join("\n"),
  );
});

// 配布物を生むのは registry.json なので、そこにだけ在る block も対象にする。
test("registry にだけ載っている block も証跡を要求する", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await import("./check-evidence.mjs");
  writeFileSync(
    join(root, "registry.json"),
    `${JSON.stringify({ items: [{ name: "login-02", type: "registry:block" }] }, null, 2)}\n`,
  );
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "registry only block"]);

  const { problems } = checkEvidenceInRepo(root);
  assert.ok(
    problems.includes("login-02: component 固有の証跡 Markdown が無い"),
    problems.join("\n"),
  );
});

test("block が無ければ block 由来の problem を出さない", async (t) => {
  const { root } = createEvidenceRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { checkEvidenceInRepo } = await import("./check-evidence.mjs");

  const { problems } = checkEvidenceInRepo(root);
  assert.deepEqual(
    problems.filter((problem) => problem.includes("login-01") || problem.includes("ghost-01")),
    [],
  );
});
