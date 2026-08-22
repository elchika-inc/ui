// 実ブラウザ証跡の形式と、検証後に component 固有 path が変わっていないことを検査する。
// 集約証跡と共有面の変更は全証跡を一律に失敗させず、陳腐化の可能性として一覧化する。
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { basename, extname, isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { scanBlockNames } from "./block-scan.mjs";

// preview 全体へ影響しうる共有面はここだけを育てる。
export const SHARED_EVIDENCE_PATHS = [
  "src/styles/global.css",
  "src/styles/design-system/tokens.css",
  "src/layouts/main.astro",
  "src/lib/utils.ts",
];

const SHARED_TOKEN_SCOPE = "shared-token-migration";
const REPORT_IMMUTABILITY_ENFORCEMENT_V1 = "REPORT_IMMUTABILITY_ENFORCEMENT_V1";
const VERIFICATION_SHA_FIELD_ENFORCEMENT_V1 = "VERIFICATION_SHA_FIELD_ENFORCEMENT_V1";
const SHARED_TOKEN_PATHS = ["src/styles/global.css", "src/styles/design-system/tokens.css"];
const SHARED_TOKEN_IMAGE_SUBJECTS = [
  "disabled-controls",
  "alert-dialog",
  "attachment",
  "catalog",
  "menubar",
  "select",
  "button",
  "bubble",
  "dialog",
  "drawer",
  "badge",
  "alert",
  "sheet",
  "tabs",
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

export function parseSingleField(markdown, field) {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const fields = markdown.match(new RegExp(`^${escaped}:.*$`, "gm")) ?? [];
  if (fields.length === 0) return { problem: `${field} が無い` };
  if (fields.length > 1) return { problem: `${field} が複数ある` };
  const value = fields[0].slice(fields[0].indexOf(":") + 1).trim();
  return value ? { value } : { problem: `${field} が空` };
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
      // catalog は registry item の type で block（iframe 埋め込み）と component（直接描画）を
      // 分けるため、registry.json の type 変更だけでも見た目が変わる。block の iframe は
      // src/pages/preview/<name>[-dark].astro を読み込むので、その route 実体にも依存する。
      "src/catalog/registry-kinds.ts",
      "src/catalog/verification-catalog.tsx",
      "registry.json",
      "src/components/ui",
      "src/pages/preview",
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

const strictAncestor = (root, ancestor, descendant) =>
  ancestor !== descendant && commitIsAncestor(root, ancestor, descendant);

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

function pathsChanged(root, sha, paths) {
  const comparisons = [
    ["committed", ["diff", "--quiet", sha, "HEAD", "--", ...paths]],
    ["staged", ["diff", "--cached", "--quiet", "HEAD", "--", ...paths]],
    ["unstaged", ["diff", "--quiet", "--", ...paths]],
  ];
  for (const [layer, args] of comparisons) {
    const result = spawnSync("git", ["--literal-pathspecs", ...args], {
      cwd: root,
      stdio: "ignore",
    });
    if (result.status === 1) return true;
    if (result.status !== 0) {
      throw new Error(`git diff (${layer}) に失敗: ${sha} -- ${paths.join(" ")}`);
    }
  }

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
  const markdown = readFileSync(join(reviewsRoot, file), "utf8");
  const parsed = parseVerificationSha(markdown);
  if (parsed.problem) {
    const additionCommit = evidenceAddition(repositoryRoot, file).commit;
    const enforcement = verificationShaFieldEnforcement(repositoryRoot);
    const isHistoricalWithoutVerificationSha =
      parsed.problem === "verified_impl_sha が無い" &&
      additionCommit &&
      enforcement &&
      strictAncestor(repositoryRoot, additionCommit, enforcement);
    return {
      problems: isHistoricalWithoutVerificationSha ? problems : [`${file}: ${parsed.problem}`],
      stale,
    };
  }
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
  return {
    problems,
    stale,
    report: { file, markdown, sha },
    verification: component ? { component, file, sha } : undefined,
  };
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
    "--literal-pathspecs",
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

function immutablePathBaseline(repositoryRoot, path) {
  const additionCommit = git(repositoryRoot, [
    "--literal-pathspecs",
    "log",
    "--reverse",
    "--diff-filter=A",
    "--format=%H",
    "--",
    path,
  ])
    .trim()
    .split("\n")
    .find(Boolean);
  if (!additionCommit) return undefined;
  const reportEnforcement = reportImmutabilityEnforcement(repositoryRoot);
  if (reportEnforcement) {
    return strictAncestor(repositoryRoot, additionCommit, reportEnforcement)
      ? enforcementParent(repositoryRoot, reportEnforcement)
      : additionCommit;
  }
  const sensorBaseline = evidenceImmutabilityBaseline(repositoryRoot);
  return sensorBaseline && strictAncestor(repositoryRoot, additionCommit, sensorBaseline)
    ? sensorBaseline
    : additionCommit;
}

function reportImmutabilityEnforcement(repositoryRoot) {
  return git(repositoryRoot, [
    "log",
    "--reverse",
    `-S${REPORT_IMMUTABILITY_ENFORCEMENT_V1}`,
    "--format=%H",
    "--",
    "scripts/check-evidence.mjs",
  ])
    .trim()
    .split("\n")
    .find(Boolean);
}

function verificationShaFieldEnforcement(repositoryRoot) {
  return git(repositoryRoot, [
    "log",
    "--reverse",
    `-S${VERIFICATION_SHA_FIELD_ENFORCEMENT_V1}`,
    "--format=%H",
    "--",
    "scripts/check-evidence.mjs",
  ])
    .trim()
    .split("\n")
    .find(Boolean);
}

function enforcementParent(repositoryRoot, enforcement) {
  const result = spawnSync("git", ["rev-parse", `${enforcement}^`], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout.trim() : enforcement;
}

function reportBaselineCommit(repositoryRoot, reportPath) {
  const additionCommit = git(repositoryRoot, [
    "--literal-pathspecs",
    "log",
    "--reverse",
    "--diff-filter=A",
    "--format=%H",
    "--",
    reportPath,
  ])
    .trim()
    .split("\n")
    .find(Boolean);
  if (!additionCommit) return undefined;

  const enforcement = reportImmutabilityEnforcement(repositoryRoot);
  if (!enforcement) return undefined;
  return strictAncestor(repositoryRoot, additionCommit, enforcement)
    ? enforcementParent(repositoryRoot, enforcement)
    : additionCommit;
}

function protectedEvidencePaths(repositoryRoot, enforcement) {
  const baseline = enforcementParent(repositoryRoot, enforcement);
  const atEnforcement = git(repositoryRoot, [
    "ls-tree",
    "-r",
    "--name-only",
    baseline,
    "--",
    ".docs/reviews",
  ])
    .trim()
    .split("\n");
  const addedAfterEnforcement = git(repositoryRoot, [
    "log",
    "--no-renames",
    "--diff-filter=A",
    "--name-only",
    "--format=",
    `${baseline}..HEAD`,
    "--",
    ".docs/reviews",
  ])
    .trim()
    .split("\n");
  return [...new Set([...atEnforcement, ...addedAfterEnforcement].filter(Boolean))];
}

function evidencePathChangedAfterBaseline(repositoryRoot, baseline, path) {
  const committed = git(repositoryRoot, [
    "--literal-pathspecs",
    "log",
    "-1",
    "--format=%H",
    `${baseline}..HEAD`,
    "--",
    path,
  ]).trim();
  return Boolean(committed) || pathsChanged(repositoryRoot, "HEAD", [path]);
}

function inspectEvidenceImmutability(repositoryRoot, currentFiles) {
  const enforcement = reportImmutabilityEnforcement(repositoryRoot);
  if (!enforcement) return [];
  const current = new Set(currentFiles);
  const problems = protectedEvidencePaths(repositoryRoot, enforcement)
    .filter((path) => !current.has(path))
    .map((path) => `${path.replace(/^\.docs\/reviews\//, "")}: 施行後の証跡は削除・renameできない`);

  for (const path of currentFiles) {
    const baseline = reportBaselineCommit(repositoryRoot, path);
    if (baseline && evidencePathChangedAfterBaseline(repositoryRoot, baseline, path)) {
      problems.push(
        `${path.replace(/^\.docs\/reviews\//, "")}: 証跡が施行後の履歴または作業ツリーでbaselineから変更されている`,
      );
    }
  }
  return problems;
}

const emptyCoverage = (problems = []) => ({
  coveredPaths: new Set(),
  problems,
});

function sharedImageSubjectAndTheme(path) {
  const extension = extname(path).toLowerCase();
  if (!IMAGE_SIGNATURES.some(({ extensions }) => extensions.includes(extension))) return {};
  const stem = basename(path, extension).replace(/^\d{4}-\d{2}-\d{2}-/, "");
  for (const subject of SHARED_TOKEN_IMAGE_SUBJECTS) {
    for (const theme of ["light", "dark"]) {
      const endings = [`${subject}-${theme}`, `${subject}-preview-${theme}`];
      if (endings.some((ending) => stem === ending || stem.endsWith(`-${ending}`))) {
        return { subject, theme };
      }
    }
  }
  return {};
}

function sharedTokenImageProblems(repositoryRoot, report) {
  const addedImages = new Map();
  for (const path of report.additionFiles.filter((candidate) =>
    candidate.startsWith(".docs/reviews/"),
  )) {
    const { subject, theme } = sharedImageSubjectAndTheme(path);
    if (subject && theme) addedImages.set(`${subject}-${theme}`, path);
  }
  return SHARED_TOKEN_IMAGE_SUBJECTS.flatMap((subject) =>
    ["light", "dark"]
      .map((theme) => `${subject}-${theme}`)
      .flatMap((key) => {
        const path = addedImages.get(key);
        if (!path) return [`${report.file}: 同時追加画像 ${key} が無い`];
        const status = lstatSync(join(repositoryRoot, path), { throwIfNoEntry: false });
        if (!status?.isFile()) return [`${report.file}: 現在の画像 ${key} が無い`];
        if (report.additionCommit && pathsChanged(repositoryRoot, report.additionCommit, [path])) {
          return [`${report.file}: 現在の画像 ${key} が追加時から変更されている`];
        }
        const imageProblem = checkImage(path, readFileSync(join(repositoryRoot, path)));
        return imageProblem ? [`${report.file}: 現在の画像 ${key}: ${imageProblem}`] : [];
      }),
  );
}

function sharedTokenReportProblems(repositoryRoot, report) {
  const targeted = parseSingleField(report.markdown, "targeted_dynamic_sha");
  if (targeted.problem) return [`${report.file}: ${targeted.problem}`];
  if (!/^[0-9a-f]{40}$/.test(targeted.value)) {
    return [`${report.file}: targeted_dynamic_sha は40桁の小文字SHAでなければならない`];
  }
  if (!commitExists(repositoryRoot, targeted.value)) {
    return [`${report.file}: targeted_dynamic_sha ${targeted.value} が commit として存在しない`];
  }
  if (!commitIsAncestor(repositoryRoot, targeted.value)) {
    return [`${report.file}: targeted_dynamic_sha ${targeted.value} が現在のHEADの祖先ではない`];
  }

  const changedTokenPaths = SHARED_TOKEN_PATHS.filter((path) =>
    pathsChanged(repositoryRoot, targeted.value, [path]),
  );
  if (changedTokenPaths.length > 0) {
    return [`${report.file}: 動的検証 SHA 以降に ${changedTokenPaths.join(", ")} が変更されている`];
  }

  for (const tokenPath of SHARED_TOKEN_PATHS) {
    const tokenSha = git(repositoryRoot, ["log", "-1", "--format=%H", "--", tokenPath]).trim();
    if (!tokenSha || !strictAncestor(repositoryRoot, tokenSha, report.sha)) {
      return [
        `${report.file}: ${tokenPath} の最終変更 commit は verified_impl_sha の厳密な祖先でなければならない`,
      ];
    }
  }
  if (!commitIsAncestor(repositoryRoot, report.sha, targeted.value)) {
    return [`${report.file}: verified_impl_sha が動的検証 SHA の祖先ではない`];
  }
  return sharedTokenImageProblems(repositoryRoot, report);
}

export function inspectSharedTokenCoverage(repositoryRoot, reports) {
  const problems = [];
  const candidates = [];
  for (const report of reports) {
    if (!/^evidence_scope:/m.test(report.markdown)) continue;
    const scope = parseSingleField(report.markdown, "evidence_scope");
    if (scope.problem) {
      problems.push(`${report.file}: ${scope.problem}`);
      continue;
    }
    if (scope.value !== SHARED_TOKEN_SCOPE) continue;
    const addition = evidenceAddition(repositoryRoot, report.file);
    candidates.push({ ...report, additionCommit: addition.commit, additionFiles: addition.files });
  }
  if (problems.length > 0) return emptyCoverage(problems);
  if (candidates.length === 0) return emptyCoverage();

  const latest = latestByAddition(repositoryRoot, candidates);
  if (latest.length !== 1) {
    return emptyCoverage([
      `shared-token-migration: 最新証跡が一意に決まらない (${latest
        .map(({ file }) => file)
        .join(", ")})`,
    ]);
  }
  const [report] = latest;
  const reportProblems = sharedTokenReportProblems(repositoryRoot, report);
  if (reportProblems.length > 0) return emptyCoverage(reportProblems);

  return {
    coveredPaths: new Set(SHARED_TOKEN_PATHS),
    problems: [],
    report: report.file,
  };
}

function introducedReportMarkdown(repositoryRoot, report) {
  const reportPath = `.docs/reviews/${report}`;
  const reportBaseline = reportBaselineCommit(repositoryRoot, reportPath);
  if (reportBaseline) return git(repositoryRoot, ["show", `${reportBaseline}:${reportPath}`]);

  const additionCommit = git(repositoryRoot, [
    "--literal-pathspecs",
    "log",
    "--reverse",
    "--diff-filter=A",
    "--format=%H",
    "--",
    reportPath,
  ])
    .trim()
    .split("\n")
    .find(Boolean);
  if (!additionCommit) return undefined;
  const immutabilityBaseline = evidenceImmutabilityBaseline(repositoryRoot);
  const introductionCommit =
    immutabilityBaseline && strictAncestor(repositoryRoot, additionCommit, immutabilityBaseline)
      ? git(repositoryRoot, [
          "--literal-pathspecs",
          "log",
          "--reverse",
          "-Sverified_impl_sha:",
          "--format=%H",
          "--",
          reportPath,
        ])
          .trim()
          .split("\n")
          .find(Boolean)
      : additionCommit;
  if (!introductionCommit) return undefined;
  return git(repositoryRoot, ["show", `${introductionCommit}:${reportPath}`]);
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

function structuredFieldHistoryProblems(report, introducedMarkdown) {
  const problems = [];
  if (!/^evidence_scope:/m.test(introducedMarkdown) && !/^evidence_scope:/m.test(report.markdown)) {
    return problems;
  }
  for (const field of ["evidence_scope", "targeted_dynamic_sha"]) {
    const fieldPattern = new RegExp(`^${field}:`, "m");
    const existedInitially = fieldPattern.test(introducedMarkdown);
    const existsCurrently = fieldPattern.test(report.markdown);
    if (!existedInitially && !existsCurrently) continue;
    const initial = parseSingleField(introducedMarkdown, field);
    const current = parseSingleField(report.markdown, field);
    if (initial.problem) {
      problems.push(`${report.file}: 初回記録の ${initial.problem}`);
    } else if (current.problem) {
      problems.push(`${report.file}: ${current.problem}`);
    } else if (initial.value !== current.value) {
      problems.push(`${report.file}: ${field} が初回記録から変更されている`);
    }
  }
  return problems;
}

function reportHistoryProblems(repositoryRoot, report) {
  const introducedMarkdown = introducedReportMarkdown(repositoryRoot, report.file);
  if (introducedMarkdown === undefined) return [];
  const problems = [];
  const introduced = parseVerificationSha(introducedMarkdown);
  if (introduced.problem) {
    problems.push(`${report.file}: 初回記録の ${introduced.problem}`);
  } else if (introduced.sha !== report.sha) {
    problems.push(`${report.file}: verified_impl_sha が初回記録から変更されている`);
  }
  problems.push(...structuredFieldHistoryProblems(report, introducedMarkdown));
  return problems;
}

function inspectVerificationHistory(repositoryRoot, verifications) {
  return verifications.flatMap((report) => reportHistoryProblems(repositoryRoot, report));
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
  if (reportImmutabilityEnforcement(repositoryRoot)) return [];
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
    .filter((path) => !lstatSync(join(repositoryRoot, path), { throwIfNoEntry: false })?.isFile())
    .map((path) => path.replace(/^\.docs\/reviews\//, ""))
    .filter(
      (path) => componentFromEvidence(path) || imageComponentAndTheme(path, components).component,
    );
}

function componentImageProblems(repositoryRoot, reportFile, addedImages) {
  return ["light", "dark"].flatMap((theme) => {
    const image = addedImages.find((candidate) => candidate.theme === theme);
    if (!image) return [`${reportFile}: 対応する ${theme} 証跡画像が無い`];
    const imagePath = `.docs/reviews/${image.path}`;
    const imageBaseline = immutablePathBaseline(repositoryRoot, imagePath);
    return imageBaseline && pathsChanged(repositoryRoot, imageBaseline, [imagePath])
      ? [`${reportFile}: 対応する ${theme} 証跡画像が追加時から変更されている`]
      : [];
  });
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
      .map((path) => ({ path, ...imageComponentAndTheme(path, components) }))
      .filter((image) => image.component === component);
    problems.push(...componentImageProblems(repositoryRoot, report.file, addedImages));
  }
  return problems;
}

function aggregateEvidenceScope(file) {
  if (
    /^\d{4}-\d{2}-\d{2}-index-page\.md$/.test(basename(file)) ||
    file === "catalog-index-r2/report.md"
  ) {
    return "index";
  }
  if (/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*-catalog\.md$/.test(basename(file))) {
    return "catalog";
  }
  return undefined;
}

function latestByVerificationSha(repositoryRoot, reports) {
  return reports.filter(
    (candidate) =>
      !reports.some(
        (other) =>
          candidate.file !== other.file &&
          candidate.sha !== other.sha &&
          commitIsAncestor(repositoryRoot, candidate.sha, other.sha),
      ),
  );
}

export function summarizeStale(repositoryRoot, stale, reports, coverage) {
  const coveredPaths = coverage?.coveredPaths ?? new Set();
  const filtered = stale.flatMap((entry) => {
    const separator = entry.indexOf(": ");
    if (separator < 0) return [{ entry, file: entry, paths: [] }];
    const file = entry.slice(0, separator);
    const paths = entry
      .slice(separator + 2)
      .split(", ")
      .filter((path) => !coveredPaths.has(path));
    return paths.length > 0 ? [{ entry: `${file}: ${paths.join(", ")}`, file, paths }] : [];
  });

  const detailedFiles = new Set();
  for (const componentReports of Map.groupBy(
    reports.filter(({ file }) => componentFromEvidence(file)),
    ({ file }) => componentFromEvidence(file),
  ).values()) {
    const latest = latestByVerificationSha(repositoryRoot, componentReports);
    if (latest.length === 1) detailedFiles.add(latest[0].file);
  }

  const aggregateReports = reports
    .map((report) => ({ ...report, scope: aggregateEvidenceScope(report.file) }))
    .filter(({ scope }) => scope);
  for (const scopedReports of Map.groupBy(aggregateReports, ({ scope }) => scope).values()) {
    const withAddition = scopedReports.map((report) => ({
      ...report,
      additionCommit: evidenceAddition(repositoryRoot, report.file).commit,
    }));
    const latest = latestByAddition(repositoryRoot, withAddition);
    if (latest.length === 1) detailedFiles.add(latest[0].file);
  }

  const detailed = filtered.filter(({ file }) => detailedFiles.has(file)).map(({ entry }) => entry);
  const historicalCount = filtered.length - detailed.length;
  if (historicalCount > 0) {
    detailed.push(
      `過去履歴の shared stale: ${historicalCount} 件（形式・immutability は全件検査済み）`,
    );
  }
  return detailed;
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
    const coverage = emptyCoverage();
    return { problems, stale: [], displayStale: [], coverage };
  }
  const reviewsRelativePath = relative(repositoryRoot, realpathSync(reviewsRoot));
  if (
    !reviewsStatus.isDirectory() ||
    reviewsRelativePath.startsWith("..") ||
    isAbsolute(reviewsRelativePath)
  ) {
    problems.push(".docs/reviews は repo 内の通常ディレクトリでなければならない");
    const coverage = emptyCoverage();
    return { problems, stale: [], displayStale: [], coverage };
  }

  const entries = reviewEntries(reviewsRoot).sort((left, right) =>
    left.path.localeCompare(right.path),
  );
  const files = entries.filter((entry) => entry.isFile).map((entry) => entry.path);
  problems.push(
    ...inspectEvidenceImmutability(
      repositoryRoot,
      files.map((file) => `.docs/reviews/${file}`),
    ),
  );
  const imageFiles = files.filter((file) => [".png", ".jpg", ".jpeg"].includes(extname(file)));
  const markdownFiles = files.filter((file) => extname(file) === ".md");
  const stale = [];
  const componentVerifications = [];
  const reports = [];
  const componentsRoot = join(repositoryRoot, "src/components/ui");
  // block も証跡のカバレッジ強制の対象に含める。走査根が src/components/ui 固定のままだと
  // 「block ごとの証跡 Markdown が無い」が検出されず、証跡を撮り忘れても緑になる。
  // stale 検知は componentPaths が registry item から実パスを引くので既に block を見ている。
  const provenancePath = join(repositoryRoot, "provenance.json");
  const provenance = existsSync(provenancePath)
    ? JSON.parse(readFileSync(provenancePath, "utf8"))
    : {};
  const registryPathForBlocks = join(repositoryRoot, "registry.json");
  const registryForBlocks = existsSync(registryPathForBlocks)
    ? JSON.parse(readFileSync(registryPathForBlocks, "utf8"))
    : {};
  const components = [
    ...(existsSync(componentsRoot)
      ? readdirSync(componentsRoot)
          .filter((file) => file.endsWith(".tsx"))
          .map((file) => file.replace(/\.tsx$/, ""))
      : []),
    ...scanBlockNames(join(repositoryRoot, "src/blocks"), provenance, registryForBlocks),
  ];

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
    if (inspected.report) reports.push(inspected.report);
    if (inspected.verification) componentVerifications.push(inspected.verification);
  }
  problems.push(...inspectVerificationHistory(repositoryRoot, reports));
  problems.push(...inspectLatestComponentEvidence(repositoryRoot, componentVerifications));
  problems.push(
    ...inspectComponentEvidenceCoverage(
      repositoryRoot,
      components,
      componentVerifications,
      imageFiles,
    ),
  );

  const coverage = inspectSharedTokenCoverage(repositoryRoot, reports);
  problems.push(...coverage.problems);
  const displayStale = summarizeStale(repositoryRoot, stale, reports, coverage);

  return { problems, stale, displayStale, coverage };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { problems, displayStale: stale } = checkEvidenceInRepo(process.cwd());
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
