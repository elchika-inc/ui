// 実ブラウザ証跡の形式と、検証後に component 固有 path が変わっていないことを検査する。
// 集約証跡と共有面の変更は全証跡を一律に失敗させず、陳腐化の可能性として一覧化する。
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { basename, extname, isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// preview 全体へ影響しうる共有面はここだけを育てる。
export const SHARED_EVIDENCE_PATHS = [
  "src/styles/global.css",
  "src/layouts/main.astro",
  "src/lib/utils.ts",
];

const IMAGE_SIGNATURES = [
  { type: "PNG", extensions: [".png"], magic: Buffer.from("89504e470d0a1a0a", "hex") },
  { type: "JPEG", extensions: [".jpg", ".jpeg"], magic: Buffer.from("ffd8ff", "hex") },
];

const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });

export function checkImage(path, bytes) {
  const extension = extname(path).toLowerCase();
  const expected = IMAGE_SIGNATURES.find(({ extensions }) => extensions.includes(extension));
  const actual = IMAGE_SIGNATURES.find(({ magic }) =>
    bytes.subarray(0, magic.length).equals(magic),
  );
  if (!expected) return `${path}: 対応していない画像拡張子 ${extension || "なし"}`;
  if (!actual) return `${path}: 実体が PNG / JPEG のどちらでもない`;
  if (actual.type !== expected.type) {
    return `${path}: 拡張子 ${extension.slice(1)} だが実体は ${actual.type}`;
  }
  return undefined;
}

export function parseVerificationSha(markdown) {
  const fields = markdown.match(/^verified_impl_sha:.*$/gm) ?? [];
  if (fields.length === 0) return { problem: "verified_impl_sha が無い" };
  if (fields.length > 1) return { problem: "verified_impl_sha が複数ある" };
  const matched = fields[0].match(/^verified_impl_sha:\s*([0-9a-f]{40})\s*$/);
  if (!matched) return { problem: "verified_impl_sha は40桁の小文字SHAでなければならない" };
  return { sha: matched[1] };
}

function componentFromEvidence(path) {
  return basename(path).match(/^\d{4}-\d{2}-\d{2}-(.+)-preview\.md$/)?.[1];
}

function componentPaths(repositoryRoot, name) {
  const paths = [
    `src/components/ui/${name}.tsx`,
    `src/previews/${name}.tsx`,
    `src/pages/preview/${name}.astro`,
    `src/pages/preview/${name}-dark.astro`,
  ];
  const problems = [];
  const registryPath = join(repositoryRoot, "registry.json");
  if (!existsSync(registryPath)) return { paths, problems };
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  const item = registry.items?.find((candidate) => candidate.name === name);
  for (const file of item?.files ?? []) {
    if (
      typeof file.path === "string" &&
      file.type !== "registry:file" &&
      !SHARED_EVIDENCE_PATHS.includes(file.path)
    ) {
      const normalized = relative(repositoryRoot, resolve(repositoryRoot, file.path));
      if (
        file.path.startsWith(":") ||
        isAbsolute(file.path) ||
        !normalized ||
        normalized === ".." ||
        normalized.startsWith("../") ||
        isAbsolute(normalized) ||
        normalized !== file.path
      ) {
        problems.push(
          `${name}: registry path ${file.path} はrepo内の通常相対pathでなければならない`,
        );
        continue;
      }
      paths.push(normalized);
    }
  }
  return { paths: [...new Set(paths)], problems };
}

function evidencePaths(file) {
  if (
    /^\d{4}-\d{2}-\d{2}-index-page\.md$/.test(basename(file)) ||
    file === "catalog-index-r2/report.md"
  ) {
    return [
      "src/pages/index.astro",
      "src/catalog/preview-manifest.mjs",
      "src/catalog/previews.ts",
      "src/previews",
    ];
  }
  if (/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*-catalog\.md$/.test(basename(file))) {
    return [
      "src/pages/catalog.astro",
      "src/pages/catalog-dark.astro",
      "src/catalog/preview-manifest.mjs",
      "src/catalog/previews.ts",
      "src/catalog/verification-catalog.tsx",
      "src/components/ui",
      "src/previews",
    ];
  }
  return [];
}

function reviewEntries(reviewsRoot, directory = "") {
  return readdirSync(join(reviewsRoot, directory), { withFileTypes: true }).flatMap((entry) => {
    const relativePath = join(directory, entry.name);
    if (entry.isDirectory()) return reviewEntries(reviewsRoot, relativePath);
    return [{ path: relativePath, isFile: entry.isFile() }];
  });
}

function commitExists(root, sha) {
  return (
    spawnSync("git", ["cat-file", "-e", `${sha}^{commit}`], {
      cwd: root,
      stdio: "ignore",
    }).status === 0
  );
}

function commitIsAncestor(root, ancestor, descendant = "HEAD") {
  const result = spawnSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
    cwd: root,
    stdio: "ignore",
  });
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  throw new Error(`git merge-base に失敗: ${ancestor} ${descendant}`);
}

function pathsChanged(root, sha, paths) {
  const result = spawnSync("git", ["--literal-pathspecs", "diff", "--quiet", sha, "--", ...paths], {
    cwd: root,
    stdio: "ignore",
  });
  if (result.status === 1) return true;
  if (result.status !== 0) throw new Error(`git diff に失敗: ${sha} -- ${paths.join(" ")}`);

  const untracked = spawnSync(
    "git",
    ["--literal-pathspecs", "ls-files", "--others", "--exclude-standard", "--", ...paths],
    { cwd: root, encoding: "utf8" },
  );
  if (untracked.status !== 0) {
    throw new Error(`git ls-files に失敗: ${paths.join(" ")}`);
  }
  return untracked.stdout.trim().length > 0;
}

function inspectMarkdown(repositoryRoot, reviewsRoot, file) {
  const problems = [];
  const stale = [];
  const parsed = parseVerificationSha(readFileSync(join(reviewsRoot, file), "utf8"));
  if (parsed.problem) return { problems: [`${file}: ${parsed.problem}`], stale };
  const sha = parsed.sha;
  if (!commitExists(repositoryRoot, sha)) {
    return { problems: [`${file}: 検証 SHA ${sha} が commit として存在しない`], stale };
  }
  if (!commitIsAncestor(repositoryRoot, sha)) {
    return {
      problems: [`${file}: 検証 SHA ${sha} が現在のHEADの祖先ではない`],
      stale,
    };
  }

  const component = componentFromEvidence(file);
  const changedAggregate = evidencePaths(file).filter((path) =>
    pathsChanged(repositoryRoot, sha, [path]),
  );
  const changedShared = SHARED_EVIDENCE_PATHS.filter((path) =>
    pathsChanged(repositoryRoot, sha, [path]),
  );
  const changedAdvisory = [...new Set([...changedAggregate, ...changedShared])];
  if (changedAdvisory.length) stale.push(`${file}: ${changedAdvisory.join(", ")}`);
  return { problems, stale, verification: component ? { component, file, sha } : undefined };
}

function inspectLatestComponentEvidence(repositoryRoot, verifications) {
  const problems = [];
  const byComponent = Map.groupBy(verifications, ({ component }) => component);

  for (const [component, candidates] of byComponent) {
    const componentPathResult = componentPaths(repositoryRoot, component);
    problems.push(...componentPathResult.problems);
    const latest = candidates.filter(
      (candidate) =>
        !candidates.some(
          (other) =>
            candidate.file !== other.file &&
            candidate.sha !== other.sha &&
            commitIsAncestor(repositoryRoot, candidate.sha, other.sha),
        ),
    );
    if (latest.length !== 1) {
      problems.push(
        `${component}: 最新証跡が一意に決まらない (${latest.map(({ file }) => file).join(", ")})`,
      );
      continue;
    }
    const [{ file, sha }] = latest;
    if (pathsChanged(repositoryRoot, sha, componentPathResult.paths)) {
      problems.push(`${file}: 検証 SHA 以降に component 固有 path が変更されている`);
    }
  }

  return problems;
}

function evidenceAddition(repositoryRoot, report) {
  const reportPath = `.docs/reviews/${report}`;
  const additionCommit = git(repositoryRoot, [
    "log",
    "--diff-filter=A",
    "--format=%H",
    "--",
    reportPath,
  ])
    .trim()
    .split("\n")
    .find(Boolean);
  if (additionCommit) {
    return {
      commit: additionCommit,
      files: git(repositoryRoot, [
        "diff-tree",
        "--no-commit-id",
        "--name-only",
        "--diff-filter=A",
        "-r",
        additionCommit,
      ])
        .trim()
        .split("\n")
        .filter(Boolean),
    };
  }
  const staged = git(repositoryRoot, [
    "diff",
    "--cached",
    "--name-only",
    "--diff-filter=A",
    "--",
    ".docs/reviews",
  ])
    .trim()
    .split("\n");
  const untracked = git(repositoryRoot, [
    "ls-files",
    "--others",
    "--exclude-standard",
    "--",
    ".docs/reviews",
  ])
    .trim()
    .split("\n");
  return { commit: undefined, files: [...new Set([...staged, ...untracked].filter(Boolean))] };
}

function introducedVerification(repositoryRoot, report) {
  const reportPath = `.docs/reviews/${report}`;
  const introductionCommit = git(repositoryRoot, [
    "log",
    "--reverse",
    "-Sverified_impl_sha:",
    "--format=%H",
    "--",
    reportPath,
  ])
    .trim()
    .split("\n")
    .find(Boolean);
  if (!introductionCommit) return undefined;
  return parseVerificationSha(git(repositoryRoot, ["show", `${introductionCommit}:${reportPath}`]));
}

function imageComponentAndTheme(path, components) {
  const stem = basename(path, extname(path)).replace(/^\d{4}-\d{2}-\d{2}-/, "");
  const component = components
    .toSorted((left, right) => right.length - left.length)
    .find((candidate) => stem === candidate || stem.startsWith(`${candidate}-`));
  if (!component) return {};
  const theme = stem
    .slice(component.length)
    .split("-")
    .find((part) => part === "light" || part === "dark");
  return { component, theme };
}

function inspectVerificationHistory(repositoryRoot, verifications) {
  const problems = [];
  for (const report of verifications) {
    const introduced = introducedVerification(repositoryRoot, report.file);
    if (introduced?.problem) {
      problems.push(`${report.file}: 初回記録の ${introduced.problem}`);
    } else if (introduced?.sha && introduced.sha !== report.sha) {
      problems.push(`${report.file}: verified_impl_sha が初回記録から変更されている`);
    }
  }
  return problems;
}

function evidenceImmutabilityBaseline(repositoryRoot) {
  const introduction = git(repositoryRoot, [
    "log",
    "--reverse",
    "-SintroducedVerificationSha",
    "--format=%H",
    "--",
    "scripts/check-evidence.mjs",
  ])
    .trim()
    .split("\n")
    .find(Boolean);
  if (introduction) return introduction;
  return git(repositoryRoot, ["rev-list", "--max-parents=0", "HEAD"])
    .trim()
    .split("\n")
    .find(Boolean);
}

function deletedComponentEvidence(repositoryRoot, components) {
  const baseline = evidenceImmutabilityBaseline(repositoryRoot);
  if (!baseline) return [];
  const committed = git(repositoryRoot, [
    "log",
    "--no-renames",
    "--diff-filter=D",
    "--name-only",
    "--format=",
    `${baseline}..HEAD`,
    "--",
    ".docs/reviews",
  ])
    .trim()
    .split("\n");
  const uncommitted = git(repositoryRoot, [
    "diff",
    "--no-renames",
    "--name-only",
    "--diff-filter=D",
    "HEAD",
    "--",
    ".docs/reviews",
  ])
    .trim()
    .split("\n");
  return [...new Set([...committed, ...uncommitted].filter(Boolean))]
    .filter((path) => !existsSync(join(repositoryRoot, path)))
    .map((path) => path.replace(/^\.docs\/reviews\//, ""))
    .filter(
      (path) => componentFromEvidence(path) || imageComponentAndTheme(path, components).component,
    );
}

function inspectComponentEvidenceCoverage(repositoryRoot, components, verifications, imageFiles) {
  const problems = [];
  const byComponent = Map.groupBy(verifications, ({ component }) => component);
  for (const component of components) {
    const candidates = byComponent.get(component) ?? [];
    if (candidates.length === 0) {
      problems.push(`${component}: component 固有の証跡 Markdown が無い`);
      continue;
    }
    const latest = candidates.filter(
      (candidate) =>
        !candidates.some(
          (other) =>
            candidate.file !== other.file &&
            candidate.sha !== other.sha &&
            commitIsAncestor(repositoryRoot, candidate.sha, other.sha),
        ),
    );
    if (latest.length !== 1) continue;
    const [report] = latest;
    const addition = evidenceAddition(repositoryRoot, report.file);
    const addedImageStems = new Set(
      addition.files
        .filter((path) => path.startsWith(".docs/reviews/"))
        .map((path) => path.slice(".docs/reviews/".length))
        .filter((path) =>
          IMAGE_SIGNATURES.some(({ extensions }) => extensions.includes(extname(path))),
        )
        .map((path) => path.slice(0, -extname(path).length)),
    );
    const addedImages = imageFiles
      .filter((path) => addedImageStems.has(path.slice(0, -extname(path).length)))
      .map((path) => imageComponentAndTheme(path, components))
      .filter((image) => image.component === component);
    for (const theme of ["light", "dark"]) {
      if (!addedImages.some((image) => image.theme === theme)) {
        problems.push(`${report.file}: 対応する ${theme} 証跡画像が無い`);
      }
    }
  }
  return problems;
}

export function checkEvidenceInRepo(root) {
  const repositoryRoot = git(root, ["rev-parse", "--show-toplevel"]).trim();
  const reviewsRoot = join(repositoryRoot, ".docs/reviews");
  const problems = [];
  if (lstatSync(join(repositoryRoot, ".docs/verifications"), { throwIfNoEntry: false })) {
    problems.push(".docs/verifications は証跡の正規レイヤーではない。.docs/reviews 配下へ移動する");
  }
  const reviewsStatus = lstatSync(reviewsRoot, { throwIfNoEntry: false });
  if (!reviewsStatus) {
    problems.push(".docs/reviews が無い");
    return { problems, stale: [] };
  }
  const reviewsRelativePath = relative(repositoryRoot, realpathSync(reviewsRoot));
  if (
    !reviewsStatus.isDirectory() ||
    reviewsRelativePath.startsWith("..") ||
    isAbsolute(reviewsRelativePath)
  ) {
    problems.push(".docs/reviews は repo 内の通常ディレクトリでなければならない");
    return { problems, stale: [] };
  }

  const entries = reviewEntries(reviewsRoot).sort((left, right) =>
    left.path.localeCompare(right.path),
  );
  const files = entries.filter((entry) => entry.isFile).map((entry) => entry.path);
  const imageFiles = files.filter((file) => [".png", ".jpg", ".jpeg"].includes(extname(file)));
  const markdownFiles = files.filter((file) => extname(file) === ".md");
  const stale = [];
  const componentVerifications = [];
  const componentsRoot = join(repositoryRoot, "src/components/ui");
  const components = existsSync(componentsRoot)
    ? readdirSync(componentsRoot)
        .filter((file) => file.endsWith(".tsx"))
        .map((file) => file.replace(/\.tsx$/, ""))
    : [];

  for (const entry of entries.filter((candidate) => !candidate.isFile)) {
    problems.push(`${entry.path}: 通常ファイルではないため証跡として検査できない`);
  }

  for (const file of deletedComponentEvidence(repositoryRoot, components)) {
    problems.push(`${file}: 過去のcomponent証跡は削除・renameできない`);
  }

  if (imageFiles.length === 0) problems.push("証跡画像が 0 件（走査が空走している）");
  if (markdownFiles.length === 0) problems.push("証跡 Markdown が 0 件（走査が空走している）");

  for (const file of imageFiles) {
    const problem = checkImage(file, readFileSync(join(reviewsRoot, file)));
    if (problem) problems.push(problem);
  }

  for (const file of markdownFiles) {
    const inspected = inspectMarkdown(repositoryRoot, reviewsRoot, file);
    problems.push(...inspected.problems);
    stale.push(...inspected.stale);
    if (inspected.verification) componentVerifications.push(inspected.verification);
  }
  problems.push(...inspectVerificationHistory(repositoryRoot, componentVerifications));
  problems.push(...inspectLatestComponentEvidence(repositoryRoot, componentVerifications));
  problems.push(
    ...inspectComponentEvidenceCoverage(
      repositoryRoot,
      components,
      componentVerifications,
      imageFiles,
    ),
  );

  return { problems, stale };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { problems, stale } = checkEvidenceInRepo(process.cwd());
  if (stale.length) {
    console.warn(`${stale.length} 件の証跡が共有面の変更より古い:\n  ${stale.join("\n  ")}`);
  } else {
    console.log("共有面の変更より古い証跡なし");
  }
  if (problems.length) {
    console.error(`証跡の検査に失敗:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  console.log("証跡形式 OK");
}
