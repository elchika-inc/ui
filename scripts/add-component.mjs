// shadcn component の追加を、来歴・registry 更新・副作用検査まで含む1コマンドにまとめる。

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DEPENDENCY_SECTIONS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

// add 後の変更分類はここだけを育てる。どのルールにも一致しないパスは fail-closed。
export const CHANGE_CLASSIFICATION_RULES = [
  { kind: "target", matcher: "target-component" },
  { kind: "other-component", matcher: "tracked-component" },
  { kind: "dependency-manifest", paths: ["package.json", "package-lock.json"] },
];

const SHARED_REGISTRY_FILES = [
  {
    path: "src/styles/global.css",
    type: "registry:file",
    target: "~/elchika-ui/tokens.css",
  },
  { path: "LICENSE", type: "registry:file", target: "~/elchika-ui/LICENSE" },
  {
    path: "THIRD_PARTY_LICENSES",
    type: "registry:file",
    target: "~/elchika-ui/THIRD_PARTY_LICENSES",
  },
];

const exactSemver =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });

const readJson = (root, path) => JSON.parse(readFileSync(join(root, path), "utf8"));

const writeJson = (root, path, value) =>
  writeFileSync(join(root, path), `${JSON.stringify(value, null, 2)}\n`);

const sha256 = (content) => createHash("sha256").update(content, "utf8").digest("hex");

export function parseArgs(argv) {
  const [name, ...options] = argv;
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error("component 名を kebab-case で渡すこと");
  }

  let modified;
  let force = false;
  for (let index = 0; index < options.length; index++) {
    const option = options[index];
    if (option === "--force") {
      force = true;
      continue;
    }
    if (option === "--modified") {
      modified = options[index + 1];
      index++;
      continue;
    }
    throw new Error(`未対応の引数: ${option}`);
  }
  if (!modified?.trim()) {
    throw new Error('--modified "実際に行った変更" を必ず指定すること');
  }

  return { name, modified: modified.trim(), force };
}

export function shadcnCommand(version, name) {
  if (!exactSemver.test(version)) {
    throw new Error(`.shadcn-cli-version が exact semver でない: ${version}`);
  }
  return {
    command: "npx",
    args: [`shadcn@${version}`, "add", "--overwrite", `@shadcn/${name}`],
  };
}

export function trackedFiles(root) {
  return new Set(git(root, ["ls-files", "-z"]).split("\0").filter(Boolean));
}

function changedPaths(root) {
  const tracked = git(root, ["diff", "HEAD", "--name-only", "-z", "--"])
    .split("\0")
    .filter(Boolean);
  const untracked = git(root, ["ls-files", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])].sort();
}

function classifyPath(path, name, trackedBefore) {
  const target = `src/components/ui/${name}.tsx`;
  for (const rule of CHANGE_CLASSIFICATION_RULES) {
    if (rule.matcher === "target-component" && path === target) return rule.kind;
    if (
      rule.matcher === "tracked-component" &&
      path.startsWith("src/components/ui/") &&
      path.endsWith(".tsx") &&
      trackedBefore.has(path)
    ) {
      return rule.kind;
    }
    if (rule.paths?.includes(path)) return rule.kind;
  }
  return "unknown";
}

function dependencyMap(pkg) {
  const result = new Map();
  for (const section of DEPENDENCY_SECTIONS) {
    for (const [name, version] of Object.entries(pkg[section] ?? {})) {
      result.set(name, { section, version });
    }
  }
  return result;
}

function compareDependencies(before, after) {
  const previous = dependencyMap(before);
  const current = dependencyMap(after);
  const added = [];
  const changed = [];

  for (const [name, value] of current) {
    const old = previous.get(name);
    if (!old) {
      added.push(`${value.section}: ${name}@${value.version}`);
      continue;
    }
    if (old.section !== value.section || old.version !== value.version) {
      changed.push(`${name}: ${old.section}@${old.version} -> ${value.section}@${value.version}`);
    }
  }
  for (const [name, old] of previous) {
    if (!current.has(name)) {
      changed.push(`${name}: ${old.section}@${old.version} -> 削除`);
    }
  }

  return { added: added.sort(), changed: changed.sort() };
}

export function reconcileAddChanges({ root, name, packageBefore, trackedBefore }) {
  const paths = changedPaths(root);
  const classified = paths.map((path) => ({
    path,
    kind: classifyPath(path, name, trackedBefore),
  }));
  const unknown = classified.filter(({ kind }) => kind === "unknown").map(({ path }) => path);
  if (unknown.length) {
    throw new Error(`想定外パスの変更を検出（復元せず停止）:\n  ${unknown.join("\n  ")}`);
  }

  const packageAfter = readJson(root, "package.json");
  const dependencies = compareDependencies(packageBefore, packageAfter);
  if (dependencies.changed.length) {
    throw new Error(`既存依存の版または区分が変化:\n  ${dependencies.changed.join("\n  ")}`);
  }

  const restored = classified
    .filter(({ kind }) => kind === "other-component")
    .map(({ path }) => path);
  if (restored.length) {
    git(root, ["checkout", "HEAD", "--", ...restored]);
  }

  return {
    restored,
    addedDependencies: dependencies.added,
    keptManifests: classified
      .filter(({ kind }) => kind === "dependency-manifest")
      .map(({ path }) => path),
  };
}

export function normalizeRegistryDependencies(dependencies = []) {
  return dependencies.map((dependency) => {
    if (dependency.startsWith("@") || dependency.includes("://")) return dependency;
    return `@elchika/${dependency}`;
  });
}

export function shouldSkipRecorded(provenance, name, force) {
  return Boolean(provenance.components?.[name]) && !force;
}

function dependencyName(specifier) {
  if (specifier.startsWith("@")) {
    const [scope, packagePart] = specifier.split("/");
    return packagePart ? `${scope}/${packagePart.split("@")[0]}` : specifier;
  }
  return specifier.split("@")[0];
}

function packageFromImport(specifier) {
  if (specifier.startsWith("@/")) return undefined;
  if (specifier.startsWith(".") || specifier.startsWith("node:")) return undefined;
  if (specifier.startsWith("@")) return specifier.split("/").slice(0, 2).join("/");
  return specifier.split("/")[0];
}

function externalImports(source) {
  const packages = new Set();
  const pattern = /(?:from\s*|import\s*)["']([^"']+)["']/g;
  for (const match of source.matchAll(pattern)) {
    const name = packageFromImport(match[1]);
    if (name && !["react", "react-dom"].includes(name)) packages.add(name);
  }
  return packages;
}

export function buildRegistryItem(name, upstreamItem, generatedSource) {
  const dependenciesByName = new Map();
  for (const dependency of upstreamItem.dependencies ?? []) {
    dependenciesByName.set(dependencyName(dependency), dependency);
  }
  for (const dependency of externalImports(generatedSource)) {
    if (!dependenciesByName.has(dependency)) dependenciesByName.set(dependency, dependency);
  }

  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name,
    type: "registry:ui",
    title: name
      .split("-")
      .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
      .join(" "),
    description: `${name} component.`,
    files: [
      { path: `src/components/ui/${name}.tsx`, type: "registry:ui" },
      ...SHARED_REGISTRY_FILES,
    ],
  };
  if (dependenciesByName.size) {
    item.dependencies = [...dependenciesByName.values()].sort();
  }
  const registryDependencies = normalizeRegistryDependencies(upstreamItem.registryDependencies);
  if (registryDependencies.length) item.registryDependencies = registryDependencies;
  return item;
}

function ensureClean(root) {
  const status = git(root, ["status", "--porcelain", "--untracked-files=all"]);
  if (status) throw new Error(`実行前の worktree が汚れている:\n${status}`);
}

async function fetchJson(url, fetchImpl) {
  const response = await fetchImpl(url, {
    headers: { accept: "application/vnd.github+json" },
  });
  if (!response.ok) throw new Error(`取得に失敗: ${url} (${response.status})`);
  return response.json();
}

async function provenanceEntry({
  root,
  name,
  modified,
  cliVersion,
  generatedSource,
  upstreamItem,
  registryUrl,
  fetchImpl,
}) {
  const upstreamRepo = "shadcn-ui/ui";
  const upstreamPath = `apps/v4/registry/bases/base/ui/${name}.tsx`;
  await fetchJson(
    `https://api.github.com/repos/${upstreamRepo}/contents/${upstreamPath}`,
    fetchImpl,
  );
  const commits = await fetchJson(
    `https://api.github.com/repos/${upstreamRepo}/commits?path=${encodeURIComponent(upstreamPath)}&per_page=1`,
    fetchImpl,
  );
  const upstreamPathSha = commits?.[0]?.sha;
  if (!/^[0-9a-f]{40}$/.test(upstreamPathSha ?? "")) {
    throw new Error(`${name}: 元テンプレートの commit SHA を特定できない`);
  }

  const servedFile = upstreamItem.files?.find(
    (file) => file.type === "registry:ui" && file.path?.endsWith(`/${name}.tsx`),
  );
  if (!servedFile?.content) throw new Error(`${name}: registry 応答に component content が無い`);
  const pkg = readJson(root, "package.json");
  const shadcnRange = pkg.dependencies?.shadcn ?? pkg.devDependencies?.shadcn;
  if (!shadcnRange) throw new Error("package.json に shadcn の版が無い");
  const installedVersion = readJson(root, "node_modules/shadcn/package.json").version;

  return {
    origin: "shadcn/ui registry",
    sourceUrl: `https://github.com/${upstreamRepo}`,
    registry: "https://ui.shadcn.com",
    registryUrl,
    registryPath: servedFile.path,
    registryContentSha256: sha256(servedFile.content),
    generatedContentSha256: sha256(generatedSource),
    addTarget: `@shadcn/${name}`,
    upstreamRepo,
    upstreamPath,
    upstreamPathSha,
    style: "base-nova",
    shadcnCliVersion: cliVersion,
    shadcnVersion: installedVersion,
    shadcnRange,
    fetchedAt:
      process.env.PROVENANCE_DATE ??
      new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date()),
    license: "MIT",
    modified,
    notes:
      "registry 配信物と CLI 生成物は byte 等価でない。registryContentSha256 は受け取った配信物、generatedContentSha256 は CLI 生成直後の手元の生成物の錨である。" +
      "upstreamPathSha は元テンプレートを最後に変更した commit を指す。standards 正規化後は生成直後 hash と一致しない。",
  };
}

export async function runAddComponent({
  argv = process.argv.slice(2),
  root = process.cwd(),
  fetchImpl = fetch,
  runCommand = execFileSync,
  log = console.log,
} = {}) {
  const { name, modified, force } = parseArgs(argv);
  const repositoryRoot = git(root, ["rev-parse", "--show-toplevel"]).trim();
  ensureClean(repositoryRoot);

  const provenance = readJson(repositoryRoot, "provenance.json");
  if (shouldSkipRecorded(provenance, name, force)) {
    log(`${name}: 既に記録済み（--force で上書き可能）`);
    return { skipped: true };
  }

  const packageBefore = readJson(repositoryRoot, "package.json");
  const trackedBefore = trackedFiles(repositoryRoot);
  const cliVersion = readFileSync(join(repositoryRoot, ".shadcn-cli-version"), "utf8").trim();
  const command = shadcnCommand(cliVersion, name);
  runCommand(command.command, command.args, { cwd: repositoryRoot, stdio: "inherit" });

  const reconciled = reconcileAddChanges({
    root: repositoryRoot,
    name,
    packageBefore,
    trackedBefore,
  });
  for (const path of reconciled.restored) log(`復元: ${path}`);
  for (const dependency of reconciled.addedDependencies) log(`追加依存: ${dependency}`);
  for (const path of reconciled.keptManifests) log(`依存 manifest を保持: ${path}`);

  const targetPath = `src/components/ui/${name}.tsx`;
  if (!existsSync(join(repositoryRoot, targetPath))) {
    throw new Error(`${targetPath} が生成されなかった`);
  }
  const generatedSource = readFileSync(join(repositoryRoot, targetPath), "utf8");
  const registryUrl = `https://ui.shadcn.com/r/styles/base-nova/${name}.json`;
  const upstreamItem = await fetchJson(registryUrl, fetchImpl);
  const entry = await provenanceEntry({
    root: repositoryRoot,
    name,
    modified,
    cliVersion,
    generatedSource,
    upstreamItem,
    registryUrl,
    fetchImpl,
  });

  provenance.components ??= {};
  provenance.components[name] = entry;
  const registry = readJson(repositoryRoot, "registry.json");
  const registryItem = buildRegistryItem(name, upstreamItem, generatedSource);
  const existingIndex = registry.items.findIndex((item) => item.name === name);
  if (existingIndex === -1) registry.items.push(registryItem);
  else registry.items[existingIndex] = registryItem;
  registry.items.sort((a, b) => a.name.localeCompare(b.name));

  writeJson(repositoryRoot, "provenance.json", provenance);
  writeJson(repositoryRoot, "registry.json", registry);
  log(`生成直後 SHA-256: ${entry.generatedContentSha256}`);
  log(`registry SHA-256: ${entry.registryContentSha256}`);
  return { skipped: false, entry, registryItem, reconciled };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runAddComponent();
}
