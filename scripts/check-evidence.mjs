// 実ブラウザ証跡の形式と、検証後に component 固有 path が変わっていないことを検査する。
// 集約証跡と共有面の変更は全証跡を一律に失敗させず、陳腐化の可能性として一覧化する。
import { execFileSync, spawnSync } from "node:child_process";
import { lstatSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { basename, extname, isAbsolute, join, relative } from "node:path";
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

function componentPaths(name) {
  return [
    `src/components/ui/${name}.tsx`,
    `src/previews/${name}.tsx`,
    `src/pages/preview/${name}.astro`,
    `src/pages/preview/${name}-dark.astro`,
  ];
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

function commitIsAncestor(root, sha) {
  const result = spawnSync("git", ["merge-base", "--is-ancestor", sha, "HEAD"], {
    cwd: root,
    stdio: "ignore",
  });
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  throw new Error(`git merge-base に失敗: ${sha} HEAD`);
}

function pathsChanged(root, sha, paths) {
  const result = spawnSync("git", ["diff", "--quiet", sha, "--", ...paths], {
    cwd: root,
    stdio: "ignore",
  });
  if (result.status === 1) return true;
  if (result.status !== 0) throw new Error(`git diff に失敗: ${sha} -- ${paths.join(" ")}`);

  const untracked = spawnSync(
    "git",
    ["ls-files", "--others", "--exclude-standard", "--", ...paths],
    { cwd: root, encoding: "utf8" },
  );
  if (untracked.status !== 0) {
    throw new Error(`git ls-files に失敗: ${paths.join(" ")}`);
  }
  return untracked.stdout.trim().length > 0;
}

function commitsSinceVerification(root, sha) {
  const count = git(root, ["rev-list", "--count", `${sha}..HEAD`]).trim();
  if (!/^\d+$/.test(count)) throw new Error(`git rev-list の件数が不正: ${sha}..HEAD`);
  return Number(count);
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
    const withDistance = candidates.map((candidate) => ({
      ...candidate,
      distance: commitsSinceVerification(repositoryRoot, candidate.sha),
    }));
    const nearestDistance = Math.min(...withDistance.map(({ distance }) => distance));
    const latest = withDistance.filter(({ distance }) => distance === nearestDistance);
    if (latest.length !== 1) {
      problems.push(
        `${component}: 最新証跡が一意に決まらない (${latest.map(({ file }) => file).join(", ")})`,
      );
      continue;
    }
    const [{ file, sha }] = latest;
    if (pathsChanged(repositoryRoot, sha, componentPaths(component))) {
      problems.push(`${file}: 検証 SHA 以降に component 固有 path が変更されている`);
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

  for (const entry of entries.filter((candidate) => !candidate.isFile)) {
    problems.push(`${entry.path}: 通常ファイルではないため証跡として検査できない`);
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
  problems.push(...inspectLatestComponentEvidence(repositoryRoot, componentVerifications));

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
