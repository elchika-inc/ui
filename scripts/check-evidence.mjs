// 実ブラウザ証跡の形式と、検証後に component 固有 path が変わっていないことを検査する。
// 共有面の変更は全証跡を一律に失敗させず、陳腐化の可能性として一覧化する。
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
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

export function verificationSha(markdown) {
  return markdown.match(/(?:^|[^0-9a-f])([0-9a-f]{40})(?![0-9a-f])/)?.[1];
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
  if (/^\d{4}-\d{2}-\d{2}-index-page\.md$/.test(file)) {
    return [
      "src/pages/index.astro",
      "src/catalog/preview-manifest.mjs",
      "src/catalog/previews.ts",
      "src/previews",
    ];
  }
  if (/^\d{4}-\d{2}-\d{2}-verification-catalog\.md$/.test(file)) {
    return [
      "src/pages/catalog.astro",
      "src/pages/catalog-dark.astro",
      "src/catalog/preview-manifest.mjs",
      "src/catalog/previews.ts",
      "src/catalog/verification-catalog.tsx",
      "src/previews",
    ];
  }
  return [];
}

function commitExists(root, sha) {
  return (
    spawnSync("git", ["cat-file", "-e", `${sha}^{commit}`], {
      cwd: root,
      stdio: "ignore",
    }).status === 0
  );
}

function pathsChanged(root, sha, paths) {
  const result = spawnSync("git", ["diff", "--quiet", sha, "HEAD", "--", ...paths], {
    cwd: root,
    stdio: "ignore",
  });
  if (result.status === 0) return false;
  if (result.status === 1) return true;
  throw new Error(`git diff に失敗: ${sha} -- ${paths.join(" ")}`);
}

function inspectMarkdown(repositoryRoot, reviewsRoot, file) {
  const problems = [];
  const stale = [];
  const sha = verificationSha(readFileSync(join(reviewsRoot, file), "utf8"));
  if (!sha) {
    return { problems: [`${file}: 40 桁の検証 SHA が無い`], stale };
  }
  if (!commitExists(repositoryRoot, sha)) {
    return { problems: [`${file}: 検証 SHA ${sha} が commit として存在しない`], stale };
  }

  const component = componentFromEvidence(file);
  if (component && pathsChanged(repositoryRoot, sha, componentPaths(component))) {
    problems.push(`${file}: 検証 SHA 以降に component 固有 path が変更されている`);
  }
  const specificPaths = evidencePaths(file);
  if (specificPaths.length && pathsChanged(repositoryRoot, sha, specificPaths)) {
    problems.push(`${file}: 検証 SHA 以降に証跡固有 path が変更されている`);
  }
  const changedShared = SHARED_EVIDENCE_PATHS.filter((path) =>
    pathsChanged(repositoryRoot, sha, [path]),
  );
  if (changedShared.length) stale.push(`${file}: ${changedShared.join(", ")}`);
  return { problems, stale };
}

export function checkEvidenceInRepo(root) {
  const repositoryRoot = git(root, ["rev-parse", "--show-toplevel"]).trim();
  const reviewsRoot = join(repositoryRoot, ".docs/reviews");
  if (!existsSync(reviewsRoot)) {
    return { problems: [".docs/reviews が無い"], stale: [] };
  }

  const files = readdirSync(reviewsRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  const imageFiles = files.filter((file) => [".png", ".jpg", ".jpeg"].includes(extname(file)));
  const markdownFiles = files.filter((file) => extname(file) === ".md");
  const problems = [];
  const stale = [];

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
  }

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
