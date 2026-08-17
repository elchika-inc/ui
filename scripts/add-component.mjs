// shadcn component の追加を、来歴・registry 更新・副作用検査まで含む1コマンドにまとめる。

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const DEPENDENCY_SECTIONS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

// add 後の変更分類はここだけを育てる。どのルールにも一致しないパスは fail-closed。
export const CHANGE_CLASSIFICATION_RULES = [
  { kind: "target", matcher: "target-item" },
  { kind: "target", matcher: "target-block-dir" },
  { kind: "other-registry-item", matcher: "tracked-component" },
  { kind: "other-registry-item", matcher: "tracked-hook" },
  { kind: "dependency-manifest", paths: ["package.json", "package-lock.json"] },
];

// 配布した tokens.css が @import する npm パッケージ。これが consumer の package.json に
// 入らないと `@tailwindcss/cli` が "Can't resolve" で落ちる（実測）。
const SHARED_DEPENDENCIES = ["tw-animate-css", "shadcn"];

const SHARED_REGISTRY_FILES = [
  {
    path: "src/styles/global.css",
    type: "registry:file",
    target: "~/elchika-ui/tokens.css",
  },
  {
    path: "src/styles/design-system/tokens.css",
    type: "registry:file",
    target: "~/elchika-ui/design-system/tokens.css",
  },
  {
    path: "src/styles/design-system/brands.css",
    type: "registry:file",
    target: "~/elchika-ui/design-system/brands.css",
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
      if (force) {
        throw new Error("--force は1回だけ指定すること");
      }
      force = true;
      continue;
    }
    if (option === "--modified") {
      if (modified !== undefined) {
        throw new Error("--modified は1回だけ指定すること");
      }
      const value = options[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error('--modified "実際に行った変更" を必ず指定すること');
      }
      modified = value;
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

export function classifyPath(path, targetPath, trackedBefore) {
  for (const rule of CHANGE_CLASSIFICATION_RULES) {
    if (rule.matcher === "target-item" && path === targetPath) return rule.kind;
    // block は複数ファイルなので targetPath をディレクトリとして受ける。
    // 別 block のディレクトリは掴まないよう、targetPath 直下に限定する。
    if (
      rule.matcher === "target-block-dir" &&
      targetPath.startsWith("src/blocks/") &&
      path.startsWith(`${targetPath}/`)
    ) {
      return rule.kind;
    }
    if (
      rule.matcher === "tracked-component" &&
      path.startsWith("src/components/ui/") &&
      path.endsWith(".tsx") &&
      trackedBefore.has(path)
    ) {
      return rule.kind;
    }
    if (
      rule.matcher === "tracked-hook" &&
      path.startsWith("src/hooks/") &&
      path.endsWith(".ts") &&
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

export function reconcileAddChanges({
  root,
  name,
  targetPath = `src/components/ui/${name}.tsx`,
  packageBefore,
  trackedBefore,
}) {
  const paths = changedPaths(root);
  const classified = paths.map((path) => ({
    path,
    kind: classifyPath(path, targetPath, trackedBefore),
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
    .filter(({ kind }) => kind === "other-registry-item")
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

export function shouldSkipRecorded(provenance, name, force, kind = "component") {
  const section = kind === "block" ? provenance.blocks : provenance.components;
  return Boolean(section?.[name]) && !force;
}

// shadcn CLI は上流 registry の path ではなく components.json の aliases で配置先を決める。
// 実測（CLI 4.16.0）では registry:block の registry:component は aliases.components 直下へ
// フラットに落ちる（src/components/login-form.tsx）。src/blocks/<name>/ 配下へ置く経路は
// alias に無い（4.16.0 の aliases スキーマは components / utils / ui / lib / hooks のみ）ため、
// add 後に移設する。写像は名前の推測ではなく target.files の registryPath から決定的に作る。
export function blockRelocationPlan(target) {
  const seen = new Set();
  return target.files.map((file) => {
    const base = basename(file.registryPath);
    // CLI がフラット化する以上、同一 block 内で basename が衝突すると移設先を一意に決められない。
    // 実測では衝突しないが、上流の将来変更で静かに取り違えるより止める。
    if (seen.has(base)) {
      throw new Error(`${file.targetPath}: 移設元の basename が重複: ${base}`);
    }
    seen.add(base);
    return { from: `src/components/${base}`, to: file.targetPath };
  });
}

// reconcile より前に呼ぶ。移設を後にすると src/components/<basename> が
// 変更パスとして残り、どのルールにも一致せず fail-closed で止まる。
function relocateBlockFiles(root, target, log) {
  for (const { from, to } of blockRelocationPlan(target)) {
    const fromPath = join(root, from);
    // 生成されなかった場合はここで止めず、後段の生成確認に一本化する。
    if (!existsSync(fromPath)) continue;
    mkdirSync(dirname(join(root, to)), { recursive: true });
    renameSync(fromPath, join(root, to));
    log(`移設: ${from} -> ${to}`);
  }
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

const UPSTREAM_PREFIX = "apps/v4/registry/bases/base/";
const REGISTRY_PREFIX = "registry/base-nova/";

// 文字列引数の replace は先頭アンカーを持たず「最初に現れた出現位置」を消すため、
// prefix が先頭以外にあるパス（vendor/registry/base-nova/...）を黙って別物へ変換する。
// 前方一致を検査してから slice する。
const upstreamPathOf = (registryPath) => {
  if (!registryPath.startsWith(REGISTRY_PREFIX)) {
    throw new Error(`registry path が想定外: ${registryPath}`);
  }
  return `${UPSTREAM_PREFIX}${registryPath.slice(REGISTRY_PREFIX.length)}`;
};

// 上流 block が持ちうる file type のうち、この機構が正しく扱えると実証済みのもの。
// 「registry:page 以外は全部配布」にすると未知の type を黙って配布側へ流す。
// registry:file（dashboard-01 の data.json）は CLI が item の target へ書くため
// components alias 直下からの移設が成立せず、registry item も target を要求する。
// 扱えるようになるまで fail-closed で止める。
const SUPPORTED_BLOCK_FILE_TYPES = new Set(["registry:component", "registry:ui", "registry:hook"]);

// block は「利用者が 1 つ選んでコピーする雛形」なので、page.tsx は 27 件すべてが同名で衝突する。
// standards が Next.js を標準スタック外としているため target: app/<name>/page.tsx も配れない。
// 配布から外すが、来歴には dropped として残す。
function resolveBlockTarget(name, upstreamItem) {
  const files = [];
  const droppedFiles = [];
  const blockPrefix = `${REGISTRY_PREFIX}blocks/${name}/`;
  for (const file of upstreamItem.files ?? []) {
    const registryPath = file.path;
    if (file.type === "registry:page") {
      droppedFiles.push({ registryPath, upstreamPath: upstreamPathOf(registryPath) });
      continue;
    }
    if (!SUPPORTED_BLOCK_FILE_TYPES.has(file.type)) {
      throw new Error(
        `${name}: block の file type が未対応: ${file.type ?? "なし"} (${registryPath})`,
      );
    }
    if (!registryPath.startsWith(blockPrefix)) {
      throw new Error(`${name}: block の file path が想定外: ${registryPath}`);
    }
    files.push({
      registryPath,
      targetPath: `src/blocks/${name}/${registryPath.slice(blockPrefix.length)}`,
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

export function buildRegistryItem(name, upstreamItem, generatedSource, target) {
  const dependenciesByName = new Map();
  for (const dependency of upstreamItem.dependencies ?? []) {
    dependenciesByName.set(dependencyName(dependency), dependency);
  }
  for (const dependency of externalImports(generatedSource)) {
    if (!dependenciesByName.has(dependency)) dependenciesByName.set(dependency, dependency);
  }
  for (const dependency of SHARED_DEPENDENCIES) {
    if (!dependenciesByName.has(dependency)) dependenciesByName.set(dependency, dependency);
  }

  // block は配布ファイルが複数あり、上流の type（registry:component 等）をそのまま使う。
  // registry:page は resolveRegistryTarget が droppedFiles へ振り分け済みなのでここには来ない。
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

// registryContentSha256 は「受け取った配信物」の錨なので、パース済みオブジェクトから
// 再シリアライズしたテキストでは値がずれる。生テキストを保持して両方返す。
async function fetchJsonWithText(url, fetchImpl) {
  const response = await fetchImpl(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`取得に失敗: ${url} (${response.status})`);
  const text = await response.text();
  return { json: JSON.parse(text), text };
}

async function provenanceEntry({
  root,
  name,
  modified,
  cliVersion,
  generatedSource,
  upstreamItem,
  target,
  registryUrl,
  fetchImpl,
}) {
  const upstreamRepo = "shadcn-ui/ui";
  const upstreamPath = target.upstreamPath;
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

  const servedFile = upstreamItem.files?.find((file) => file.path === target.registryPath);
  if (!servedFile?.content) throw new Error(`${name}: registry 応答に primary content が無い`);
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
      "registryContentSha256 は受け取った配信物 JSON 全体の錨である。component の同名キーは一次ファイルの content を指すため、意味が異なる。files[].generatedContentSha256 は standards 正規化を適用したあとの現行ファイルのハッシュであり、CLI 生成直後の値とは一致しない。" +
      "dropped: true の file は registry:page であり、standards が Next.js を標準スタック外とするため配布しない。" +
      "CLI は block の配布ファイルを components alias 直下へフラットに落とすため、add 後に src/blocks/<name>/ へ移設している。",
  };
}

// 生成確認は block / component で対象の数が違うだけで、失敗の意味は同じ。
// メッセージの発生源を 1 箇所に保つため分岐せず配列で受ける。
function ensureGenerated(root, target, isBlock) {
  const expectedPaths = isBlock
    ? target.files.map(({ targetPath }) => targetPath)
    : [target.targetPath];
  for (const path of expectedPaths) {
    if (!existsSync(join(root, path))) {
      throw new Error(`${path} が生成されなかった`);
    }
  }
}

// 配布しない page が落ちていたら消す。実測（rsc: false）では CLI は作らないが、
// 設定や CLI 版が変われば作りうるので防御として残す。
// ここが発火しないことを「page を配布していない証拠」として扱わない。
// 配布していないことは registry item の files と作業ツリーの実体で確かめる。
function removeDroppedPages(root, target, upstreamItem, log) {
  for (const file of target.droppedFiles ?? []) {
    const droppedTarget = upstreamItem.files.find((f) => f.path === file.registryPath)?.target;
    if (droppedTarget && existsSync(join(root, droppedTarget))) {
      rmSync(join(root, droppedTarget));
      log(`配布しない page を削除: ${droppedTarget}`);
    }
  }
}

function createProvenanceEntry({ isBlock, upstreamText, ...rest }) {
  if (isBlock) {
    const { generatedSource: _generatedSource, upstreamItem: _upstreamItem, ...blockArgs } = rest;
    return blockProvenanceEntry({ ...blockArgs, upstreamText });
  }
  return provenanceEntry(rest);
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
  // component の記録済み判定は fetch より前に置く。記録済みの再実行で通信しないことを
  // 既存 61 件が保証として持っている。block は種別が target 確定まで分からないので後段で見る。
  if (shouldSkipRecorded(provenance, name, force)) {
    log(`${name}: 既に記録済み（--force で上書き可能）`);
    return { skipped: true };
  }

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

  if (isBlock && shouldSkipRecorded(provenance, name, force, "block")) {
    log(`${name}: 既に記録済み（--force で上書き可能）`);
    return { skipped: true };
  }

  const command = shadcnCommand(cliVersion, name);
  runCommand(command.command, command.args, { cwd: repositoryRoot, stdio: "inherit" });

  if (isBlock) relocateBlockFiles(repositoryRoot, target, log);
  // reconcile より前に呼ぶ。後にすると、CLI が作った app/<name>/page.tsx が
  // どの分類ルールにも一致せず reconcile が先に停止し、この防御へ到達しない。
  removeDroppedPages(repositoryRoot, target, upstreamItem, log);

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

  ensureGenerated(repositoryRoot, target, isBlock);

  // block でも配布ファイルの実体を読んで渡す。空文字にすると buildRegistryItem の
  // externalImports が空走し、「上流 item の dependencies 宣言漏れを生成物の import から
  // 拾い直す」安全網が block レーンだけ黙って無効になる（上流 dashboard-01 は実際に
  // recharts / sonner の宣言を欠く）。generatedContentSha256 は block では
  // blockProvenanceEntry が files ごとに個別計算するので、この連結値は来歴へ入らない。
  const generatedSource = isBlock
    ? target.files
        .map(({ targetPath }) => readFileSync(join(repositoryRoot, targetPath), "utf8"))
        .join("\n")
    : readFileSync(join(repositoryRoot, target.targetPath), "utf8");
  const entry = await createProvenanceEntry({
    root: repositoryRoot,
    isBlock,
    name,
    modified,
    cliVersion,
    generatedSource,
    upstreamItem,
    upstreamText,
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
  const registryItem = buildRegistryItem(name, upstreamItem, generatedSource, target);
  const existingIndex = registry.items.findIndex((item) => item.name === name);
  if (existingIndex === -1) registry.items.push(registryItem);
  else registry.items[existingIndex] = registryItem;
  registry.items.sort((a, b) => a.name.localeCompare(b.name));

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
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runAddComponent();
}
