// shadcn component の追加を、来歴・registry 更新・副作用検査まで含む1コマンドにまとめる。

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  constants as fsConstants,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

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

// registry item の description に出る名詞。配布物 public/r/*.json へ入り利用者へ届くので、
// block を "component" と呼ばない。
const ITEM_NOUN = {
  "registry:hook": "hook",
  "registry:block": "block",
};

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

const SHARED_CLI_OUTPUT_PATHS = new Set(SHARED_REGISTRY_FILES.map(({ target }) => target.slice(2)));

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
  let resync = false;
  for (let index = 0; index < options.length; index++) {
    const option = options[index];
    // 正規化（biome 整形・standards 適合）を行った後に来歴のハッシュだけを取り直す。
    // --force は CLI を再実行するので正規化済みファイルを生成物で上書きしてしまい、
    // lint を直すと今度は sha がずれる——正規化と来歴を同時に満たす経路が無くなる。
    if (option === "--resync") {
      if (resync) {
        throw new Error("--resync は1回だけ指定すること");
      }
      resync = true;
      continue;
    }
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
  // --resync は既存の来歴を保ったままハッシュだけ取り直す経路なので --modified は任意。
  // 必須にすると、手順書の例文をそのまま打った人が「上流から何を変えたか」の
  // 唯一の記録（移設・page 除外・a11y 適合の 3 つ）を 1 行へ潰してしまう。
  if (!resync && !modified?.trim()) {
    throw new Error('--modified "実際に行った変更" を必ず指定すること');
  }

  if (resync && force) {
    throw new Error("--resync と --force は同時に指定できない");
  }

  return { name, modified: modified?.trim(), force, resync };
}

export function shadcnCommand(version, itemPath) {
  if (!exactSemver.test(version)) {
    throw new Error(`.shadcn-cli-version が exact semver でない: ${version}`);
  }
  if (!isAbsolute(itemPath) || extname(itemPath) !== ".json") {
    throw new Error(`shadcn の入力は絶対 path の JSON であること: ${itemPath}`);
  }
  return {
    command: "npx",
    args: [`shadcn@${version}`, "add", "--overwrite", itemPath],
  };
}

function pinnedRegistryItem(name, upstreamText) {
  const directory = mkdtempSync(join(tmpdir(), "elchika-shadcn-item-"));
  const path = join(directory, `${name}.json`);
  writeFileSync(path, upstreamText, { flag: "wx" });
  return {
    path,
    remove: () => rmSync(directory, { recursive: true, force: true }),
  };
}

function hasExplicitCliExclusions(target) {
  return target.droppedFiles?.some((file) => file.excludeFromCli === true) ?? false;
}

function dependenciesForDistributedFiles(upstreamItem, target) {
  if (!hasExplicitCliExclusions(target)) return upstreamItem.dependencies ?? [];
  const distributedPaths = new Set(target.files.map((file) => file.registryPath));
  const imported = new Set(
    (upstreamItem.files ?? [])
      .filter((file) => distributedPaths.has(file.path) && typeof file.content === "string")
      .flatMap((file) => [...externalImports(file.content)]),
  );
  return (upstreamItem.dependencies ?? []).filter((dependency) =>
    imported.has(dependencyName(dependency)),
  );
}

function registryDependencyName(dependency) {
  const normalized = normalizeRegistryDependencies([dependency])[0];
  return normalized.startsWith("@elchika/") ? normalized.slice("@elchika/".length) : normalized;
}

function registryDependencyClosure(directDependencies, registryItems) {
  const itemsByName = new Map();
  for (const item of registryItems) {
    const candidates = itemsByName.get(item.name) ?? [];
    candidates.push(item);
    itemsByName.set(item.name, candidates);
  }
  const closure = new Set();
  const pending = [...directDependencies];
  while (pending.length > 0) {
    const name = pending.shift();
    if (closure.has(name)) continue;
    const candidates = itemsByName.get(name) ?? [];
    if (candidates.length === 0) {
      throw new Error(`registry dependency ${name} に対応する registry item が存在しない`);
    }
    if (candidates.length > 1) {
      throw new Error(`registry dependency ${name} に対応する registry item が重複している`);
    }
    closure.add(name);
    for (const dependency of candidates[0].registryDependencies ?? []) {
      pending.push(registryDependencyName(dependency));
    }
  }
  return closure;
}

function registryDependenciesForDistributedFiles(upstreamItem, target, registryItems) {
  if (!hasExplicitCliExclusions(target)) return upstreamItem.registryDependencies ?? [];
  const distributedPaths = new Set(target.files.map((file) => file.registryPath));
  const directDependencies = new Set(
    (upstreamItem.files ?? [])
      .filter((file) => distributedPaths.has(file.path) && typeof file.content === "string")
      .flatMap((file) => registryItemImports(file.content).map(({ name }) => name)),
  );
  const closure = registryDependencyClosure(directDependencies, registryItems);
  return (upstreamItem.registryDependencies ?? []).filter((dependency) =>
    closure.has(registryDependencyName(dependency)),
  );
}

function droppedManifestDependencies(upstreamItem, target, registryItems) {
  if (!hasExplicitCliExclusions(target)) {
    return { dependencies: [], registryDependencies: [] };
  }
  const dependencies = new Set(dependenciesForDistributedFiles(upstreamItem, target));
  const registryDependencies = new Set(
    registryDependenciesForDistributedFiles(upstreamItem, target, registryItems).map(
      registryDependencyName,
    ),
  );
  return {
    dependencies: (upstreamItem.dependencies ?? [])
      .filter((dependency) => !dependencies.has(dependency))
      .sort(),
    registryDependencies: (upstreamItem.registryDependencies ?? [])
      .filter((dependency) => !registryDependencies.has(registryDependencyName(dependency)))
      .map(registryDependencyName)
      .sort(),
  };
}

function modifiedWithDroppedDependencies(modified, upstreamItem, target, registryItems) {
  const dropped = droppedManifestDependencies(upstreamItem, target, registryItems);
  const notes = [];
  if (dropped.dependencies.length > 0) {
    notes.push(`上流 manifest から除外した dependencies: ${dropped.dependencies.join(", ")}`);
  }
  if (dropped.registryDependencies.length > 0) {
    notes.push(
      `上流 manifest から除外した registryDependencies: ${dropped.registryDependencies.join(", ")}`,
    );
  }
  if (notes.length === 0) return modified;
  return [modified.replace(/。+$/, ""), ...notes].join("。");
}

// provenance の hash は生の upstreamText に固定しつつ、CLI 入力から明示除外ファイルと
// そのファイルだけが要求する npm 依存を落とす。
function registryTextForCli(upstreamText, upstreamItem, target, registryItems) {
  if (!hasExplicitCliExclusions(target)) return upstreamText;
  const excluded = new Set(
    target.droppedFiles
      .filter((file) => file.excludeFromCli === true)
      .map((file) => file.registryPath),
  );
  return JSON.stringify({
    ...JSON.parse(upstreamText),
    files: (upstreamItem.files ?? []).filter((file) => !excluded.has(file.path)),
    dependencies: dependenciesForDistributedFiles(upstreamItem, target),
    registryDependencies: registryDependenciesForDistributedFiles(
      upstreamItem,
      target,
      registryItems,
    ),
  });
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
    const from = file.cliOutputPath ?? `src/components/${base}`;
    // CLI がフラット化する以上、同一 block 内で basename が衝突すると移設先を一意に決められない。
    // 実測では衝突しないが、上流の将来変更で静かに取り違えるより止める。
    if (seen.has(from)) {
      throw new Error(`${file.targetPath}: 移設元の basename が重複: ${base}`);
    }
    seen.add(from);
    return { from, to: file.targetPath };
  });
}

const MODULE_SPECIFIER = /(from\s*|import\s+)(["'])([^"']+)\2/g;

export function rewriteBlockSiblingImports(source, targetPath, targetFiles) {
  const replacements = new Map();
  for (const file of targetFiles) {
    const base = basename(file.targetPath);
    const extension = extname(base);
    const stem = extension ? base.slice(0, -extension.length) : base;
    let destination = relative(dirname(targetPath), file.targetPath).split(sep).join("/");
    if (extension) destination = destination.slice(0, -extension.length);
    if (!destination.startsWith(".")) destination = `./${destination}`;
    replacements.set(`@/components/${stem}`, destination);
    replacements.set(`@/components/${base}`, destination);
  }
  const rewritten = [];
  const content = source.replace(MODULE_SPECIFIER, (match, prefix, quote, specifier) => {
    const replacement = replacements.get(specifier);
    if (!replacement) return match;
    rewritten.push({ from: specifier, to: replacement });
    return `${prefix}${quote}${replacement}${quote}`;
  });
  return { content, rewritten };
}

function ensureBlockRelocationSources(root, plan, registryFileSources) {
  // 全件を移設前に確認する。途中まで copy してから不足へ気付くと、同じ失敗でも
  // worktree の残り方が file 順に依存し、再開時の復元範囲が不安定になる。
  for (const { from } of plan) {
    assertPathWithoutSymlinks(root, "block の CLI 生成先", from);
    if (existsSync(join(root, from))) continue;
    const label = registryFileSources.has(from)
      ? "registry:file の CLI 生成先"
      : "block の CLI 生成先";
    throw new Error(`${label}が存在しない: ${from}`);
  }
}

function removeObsoleteBlockFiles(root, plannedTargets, overwriteTargets, log) {
  // --force で上流から消えたファイルは、前回来歴に記録された path だけを削除する。
  // 新しい生成元を全件確認した後に行い、CLI の生成不足で旧 block が部分欠損しないようにする。
  for (const path of overwriteTargets) {
    if (plannedTargets.has(path) || !existsSync(join(root, path))) continue;
    assertPathWithoutSymlinks(root, "上流から消えた block file", path);
    rmSync(join(root, path));
    log(`上流から消えた block file を削除: ${path}`);
  }
}

function copyBlockFile(root, from, to, overwriteTargets) {
  assertPathWithoutSymlinks(root, "block の移設元", from);
  assertPathWithoutSymlinks(root, "block の移設先", to);
  const fromPath = join(root, from);
  const toPath = join(root, to);
  mkdirSync(dirname(toPath), { recursive: true });
  assertPathWithoutSymlinks(root, "block の移設先", to);
  // rename は POSIX では既存の移設先を上書きする。副作用前の検査に加え、
  // 新規 path は COPYFILE_EXCL で競合を止める。--force でも上書きできるのは
  // 前回来歴に記録された同じ block の path だけに限定する。
  if (existsSync(toPath)) {
    if (!overwriteTargets.has(to)) {
      throw new Error(`block の移設先に想定外の競合が生じた: ${to}`);
    }
    copyFileSync(fromPath, toPath);
  } else {
    copyFileSync(fromPath, toPath, fsConstants.COPYFILE_EXCL);
  }
  rmSync(fromPath);
}

// reconcile より前に呼ぶ。移設を後にすると src/components/<basename> が
// 変更パスとして残り、どのルールにも一致せず fail-closed で止まる。
function relocateBlockFiles(root, target, log, overwriteTargets = new Set()) {
  const plan = blockRelocationPlan(target);
  const plannedTargets = new Set(plan.map(({ to }) => to));
  const registryFileSources = new Set(
    target.files.map((file) => file.cliOutputPath).filter(Boolean),
  );
  ensureBlockRelocationSources(root, plan, registryFileSources);
  removeObsoleteBlockFiles(root, plannedTargets, overwriteTargets, log);
  for (const { from, to } of plan) {
    copyBlockFile(root, from, to, overwriteTargets);
    log(`移設: ${from} -> ${to}`);
  }
  for (const { to } of plan) {
    const path = join(root, to);
    if (!existsSync(path)) continue;
    assertPathWithoutSymlinks(root, "block の import 書換先", to);
    const source = readFileSync(path, "utf8");
    const { content, rewritten } = rewriteBlockSiblingImports(source, to, target.files);
    if (rewritten.length === 0) continue;
    writeFileSync(path, content);
    for (const entry of rewritten) {
      log(`内部 import: ${to} ${entry.from} -> ${entry.to}`);
    }
  }
}

function blockOverwriteTargets(provenance, name, force) {
  if (!force || !provenance.blocks?.[name]) return new Set();
  const block = provenance.blocks[name];
  if (block.origin !== "shadcn/ui registry") {
    throw new Error(
      `${name}: --force は origin が shadcn/ui registry の既存 block だけに使用できる`,
    );
  }
  const files = block.files;
  if (!Array.isArray(files)) {
    throw new Error(`${name}: --force には既存 block の files 来歴が必要`);
  }
  const prefix = `src/blocks/${name}/`;
  return new Set(
    files
      .filter((file) => file.dropped !== true)
      .map((file) => {
        const path = assertContainedPath(`${name}: 既存 block 来歴の path`, file.path);
        if (!path.startsWith(prefix)) {
          throw new Error(`${name}: 既存 block 来歴の path が block 配下でない: ${path}`);
        }
        return path;
      }),
  );
}

// CLI は --overwrite で動くため、registry:file の実生成先と最終移設先を副作用前に検査する。
// 実移設時にも新規 path には COPYFILE_EXCL を使い、検査後の競合を上書きしない。
function prepareBlockRelocation(root, target, overwriteTargets = new Set()) {
  const registryFileSources = new Set(
    target.files.map((file) => file.cliOutputPath).filter(Boolean),
  );
  for (const { from, to } of blockRelocationPlan(target)) {
    const sourceLabel = registryFileSources.has(from)
      ? "registry:file の CLI 生成先"
      : "block の CLI 生成先";
    assertPathWithoutSymlinks(root, sourceLabel, from);
    if (existsSync(join(root, from))) {
      throw new Error(`${sourceLabel}が実行前から存在する: ${from}`);
    }
    assertPathWithoutSymlinks(root, "block の移設先", to);
    if (existsSync(join(root, to)) && !overwriteTargets.has(to)) {
      throw new Error(`block の移設先が実行前から存在する: ${to}`);
    }
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

function importedModuleSpecifiers(source, fileName) {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  if (sourceFile.parseDiagnostics.length > 0) {
    throw new Error(`${fileName}: import を解析できない`);
  }
  const specifiers = new Set();
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      specifiers.add(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      if (node.arguments.length !== 1 || !ts.isStringLiteralLike(node.arguments[0])) {
        throw new Error(`${fileName}: 動的 import の指定が文字列リテラルでない`);
      }
      specifiers.add(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
}

function externalImports(source, fileName = "registry item") {
  const packages = new Set();
  for (const specifier of importedModuleSpecifiers(source, fileName)) {
    const name = packageFromImport(specifier);
    if (name && !["react", "react-dom"].includes(name)) packages.add(name);
  }
  return packages;
}

function registryItemImports(source, fileName = "registry item") {
  const dependencies = new Map();
  const pattern = /^@\/(components\/ui|registry\/base-nova\/ui|hooks)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;
  for (const specifier of importedModuleSpecifiers(source, fileName)) {
    const match = specifier.match(pattern);
    if (!match) continue;
    const prefix = match[1];
    const name = match[2];
    const expectedType = prefix === "hooks" ? "registry:hook" : "registry:ui";
    dependencies.set(`${expectedType}:${name}`, {
      name,
      expectedType,
      specifier: `@/${prefix}/${name}`,
    });
  }
  return [...dependencies.values()];
}

function assertNoSharedRegistryTargetCollisions(name, itemFiles) {
  const sharedTargets = new Set(SHARED_REGISTRY_FILES.map((file) => file.target));
  const collision = itemFiles.find(
    (file) => file.type === "registry:file" && sharedTargets.has(file.target),
  );
  if (collision) {
    throw new Error(`${name}: registry:file の target が共有配布 file と衝突: ${collision.target}`);
  }
}

export function completeBlockRegistryDependencies(
  name,
  upstreamDependencies,
  generatedSource,
  registryItems,
) {
  const dependencies = new Set(normalizeRegistryDependencies(upstreamDependencies));
  for (const { name: dependency, expectedType, specifier } of registryItemImports(
    generatedSource,
  )) {
    const candidates = registryItems.filter((candidate) => candidate.name === dependency);
    const dependencyItem = candidates.find((candidate) => candidate.type === expectedType);
    if (!dependencyItem && candidates.length === 0) {
      throw new Error(
        `${name}: ${specifier} に対応する registry item が存在しない（期待 type: ${expectedType}）`,
      );
    }
    if (!dependencyItem) {
      throw new Error(`${name}: ${dependency} の type が ${expectedType} でない`);
    }
    dependencies.add(`@elchika/${dependency}`);
  }
  return [...dependencies];
}

const UPSTREAM_PREFIX = "apps/v4/registry/bases/base/";
const REGISTRY_PREFIX = "registry/base-nova/";

// 上流 registry の応答に含まれる path は、そのまま join() → mkdirSync / copyFileSync /
// rmSync へ流れる値。prefix の検査だけでは prefix より後ろの `..` が通り、repo 外へ
// 書き込める。副作用より前で止めないと、fail-closed のゲートが後ろにあっても手遅れになる。
function assertContainedPath(label, path) {
  const normalized = relative(".", resolve(".", path));
  if (
    isAbsolute(path) ||
    !normalized ||
    normalized === ".." ||
    normalized.startsWith(`..${sep}`) ||
    normalized !== path
  ) {
    throw new Error(`${label}: repo 内の通常相対 path でない: ${path}`);
  }
  return path;
}

function assertPathWithoutSymlinks(root, label, path) {
  const canonicalRoot = realpathSync(root);
  let current = canonicalRoot;
  for (const segment of path.split("/")) {
    current = join(current, segment);
    const status = lstatSync(current, { throwIfNoEntry: false });
    if (status?.isSymbolicLink()) {
      throw new Error(`${label} に symlink を含められない: ${path}`);
    }
  }
  return path;
}

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
//
// registry:component は components alias 直下、registry:file は上流 target から
// CLI 4.16.0 の実生成先を解決できる。この 2 種だけを許可する。
const SUPPORTED_BLOCK_FILE_TYPES = new Set(["registry:component", "registry:file"]);

// dashboard-01 固有の採用判断。別 block の同名ファイルを巻き込まないよう、
// block 名と上流 registry path の完全一致で指定する。
const BLOCK_FILE_EXCLUSIONS = new Map([
  ["dashboard-01", new Set(["registry/base-nova/blocks/dashboard-01/components/data-table.tsx"])],
]);

function cliOutputPathForRegistryFile(name, upstreamTargetPath) {
  // 2026-08-22 に shadcn CLI 4.16.0 で実測した規則。target が `~/` で始まる場合は
  // `~/` を除いて repo root 相対へ、それ以外は先頭の `src/` を一度除いてから source root の
  // `src/` を前置して生成する。これにより `src/` 始まりの target も二重化しない。
  // registry item へ残す upstreamTargetPath とは別概念であり、配布 target 自体は変更しない。
  const sourceRootRelativePath = upstreamTargetPath.startsWith("src/")
    ? upstreamTargetPath.slice("src/".length)
    : upstreamTargetPath;
  const cliOutputPath = upstreamTargetPath.startsWith("~/")
    ? upstreamTargetPath.slice(2)
    : `src/${sourceRootRelativePath}`;
  if (!cliOutputPath.startsWith("src/") && !SHARED_CLI_OUTPUT_PATHS.has(cliOutputPath)) {
    throw new Error(`${name}: registry:file の CLI 生成先が許可領域外: ${cliOutputPath}`);
  }
  return assertContainedPath(`${name}: registry:file の CLI 生成先`, cliOutputPath);
}

function resolveDistributedBlockFile(name, file, registryPath, blockPrefix) {
  if (!SUPPORTED_BLOCK_FILE_TYPES.has(file.type)) {
    throw new Error(
      `${name}: block の file type が未対応: ${file.type ?? "なし"} (${registryPath})`,
    );
  }
  if (file.type === "registry:component" && file.target !== undefined) {
    throw new Error(`${name}: registry:component に target は指定できない: ${file.target}`);
  }
  let upstreamTargetPath;
  let cliOutputPath;
  if (file.type === "registry:file") {
    if (typeof file.target !== "string" || !file.target) {
      throw new Error(`${name}: registry:file に target が無い: ${registryPath}`);
    }
    upstreamTargetPath = assertContainedPath(`${name}: registry:file の target`, file.target);
    cliOutputPath = cliOutputPathForRegistryFile(name, upstreamTargetPath);
  }
  return {
    registryPath,
    targetPath: assertContainedPath(
      `${name}: block の targetPath`,
      `src/blocks/${name}/${registryPath.slice(blockPrefix.length)}`,
    ),
    upstreamPath: upstreamPathOf(registryPath),
    fileType: file.type,
    ...(upstreamTargetPath ? { upstreamTargetPath, cliOutputPath } : {}),
  };
}

// block は「利用者が 1 つ選んでコピーする雛形」なので、page.tsx は 27 件すべてが同名で衝突する。
// standards が Next.js を標準スタック外としているため target: app/<name>/page.tsx も配れない。
// 配布から外すが、来歴には dropped として残す。
function resolveBlockTarget(name, upstreamItem) {
  const files = [];
  const droppedFiles = [];
  const blockPrefix = `${REGISTRY_PREFIX}blocks/${name}/`;
  for (const file of upstreamItem.files ?? []) {
    const registryPath = file.path;
    if (typeof registryPath !== "string" || !registryPath.startsWith(blockPrefix)) {
      throw new Error(`${name}: block の file path が想定外: ${registryPath ?? "なし"}`);
    }
    assertContainedPath(`${name}: block の registry path`, registryPath);
    if (BLOCK_FILE_EXCLUSIONS.get(name)?.has(registryPath)) {
      droppedFiles.push({
        registryPath,
        upstreamPath: upstreamPathOf(registryPath),
        excludeFromCli: true,
      });
      continue;
    }
    if (file.type === "registry:page") {
      droppedFiles.push({
        registryPath,
        upstreamPath: upstreamPathOf(registryPath),
        target: file.target,
      });
      continue;
    }
    files.push(resolveDistributedBlockFile(name, file, registryPath, blockPrefix));
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

export function buildRegistryItem(name, upstreamItem, generatedSource, target, registryItems = []) {
  const dependenciesByName = new Map();
  for (const dependency of dependenciesForDistributedFiles(upstreamItem, target)) {
    dependenciesByName.set(dependencyName(dependency), dependency);
  }
  for (const dependency of externalImports(generatedSource, `${name}: 生成物`)) {
    if (!dependenciesByName.has(dependency)) dependenciesByName.set(dependency, dependency);
  }
  for (const dependency of SHARED_DEPENDENCIES) {
    if (!dependenciesByName.has(dependency)) dependenciesByName.set(dependency, dependency);
  }

  // block は配布ファイルが複数あり、上流の type（registry:component 等）をそのまま使う。
  // registry:page は resolveRegistryTarget が droppedFiles へ振り分け済みなのでここには来ない。
  const itemFiles =
    target.itemType === "registry:block"
      ? target.files.map(({ targetPath, fileType, upstreamTargetPath }) => ({
          path: targetPath,
          type: fileType,
          // registry:file の target は利用者プロジェクトでの配置先なので上流値を保つ。
          // 当リポジトリへ取り込む際の CLI 生成先（cliOutputPath）とは別概念である。
          ...(fileType === "registry:file" ? { target: upstreamTargetPath } : {}),
        }))
      : [{ path: target.targetPath, type: target.itemType }];

  assertNoSharedRegistryTargetCollisions(name, itemFiles);

  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name,
    type: target.itemType,
    title: name
      .split("-")
      .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
      .join(" "),
    description: `${name} ${ITEM_NOUN[target.itemType] ?? "component"}.`,
    files: [...itemFiles, ...SHARED_REGISTRY_FILES],
  };
  if (dependenciesByName.size) {
    item.dependencies = [...dependenciesByName.values()].sort();
  }
  const registryDependencies =
    target.itemType === "registry:block"
      ? completeBlockRegistryDependencies(
          name,
          registryDependenciesForDistributedFiles(upstreamItem, target, registryItems),
          generatedSource,
          registryItems,
        )
      : normalizeRegistryDependencies(upstreamItem.registryDependencies);
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

function provenanceEntry({
  root,
  name,
  modified,
  cliVersion,
  generatedSource,
  upstreamItem,
  target,
  registryUrl,
  upstreamPathSha,
}) {
  const upstreamRepo = "shadcn-ui/ui";
  const upstreamPath = target.upstreamPath;

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

function blockProvenanceEntry({
  root,
  name,
  modified,
  cliVersion,
  upstreamText,
  target,
  registryUrl,
  upstreamPathSha,
}) {
  const upstreamRepo = "shadcn-ui/ui";

  const files = target.files.map((file) => ({
    path: file.targetPath,
    upstreamPath: file.upstreamPath,
    upstreamPathSha,
    generatedContentSha256: sha256(readFileSync(join(root, file.targetPath), "utf8")),
  }));
  // 配布しない page も残す。記録しないと、上流に page が無かったのか
  // 意図的に落としたのかを後から区別できない。
  for (const file of target.droppedFiles) {
    files.push({
      dropped: true,
      upstreamPath: file.upstreamPath,
      upstreamPathSha,
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
      "registryContentSha256 は受け取った配信物 JSON 全体の錨である。component の同名キーは一次ファイルの content を指すため、意味が異なる。" +
      "files[].generatedContentSha256 は記録時点の手元のファイルのハッシュである。add 直後に記録した値は CLI 生成物のもので、その後 standards 正規化（biome 整形・a11y 適合）を行った場合は --resync で取り直す（--force は CLI を再実行して正規化を上書きするため使わない）。check-completeness がディスク実体と突合するため、ずれたままにはできない。" +
      "upstreamPathSha は block ディレクトリを最後に変更した commit を指す。未認証の GitHub API が 60 req/h であり、ファイル単位で引くと 27 件の移植で必ず超えるため、block 単位へ畳んでいる。" +
      "dropped: true の file は配布しない上流 file を表し、理由は modified に記録する。" +
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
function prepareDroppedPages(root, target) {
  const droppedTargets = [];
  for (const file of target.droppedFiles ?? []) {
    const droppedTarget = file.target;
    if (!droppedTarget) continue;
    // target は上流 registry の応答に含まれる文字列で、rmSync へ直接流す値。
    // 封じ込めを検査してから消す（check-evidence の registry path 検査と同じ形）。
    // reconcile の fail-closed ゲートより前に走るので、ここが最後の砦になる。
    const normalized = relative(root, resolve(root, droppedTarget));
    if (
      isAbsolute(droppedTarget) ||
      !normalized ||
      normalized === ".." ||
      normalized.startsWith(`..${sep}`) ||
      normalized !== droppedTarget
    ) {
      throw new Error(`registry:page の target が repo 内の通常相対 path でない: ${droppedTarget}`);
    }
    if (!droppedTarget.startsWith("app/") || !droppedTarget.endsWith("/page.tsx")) {
      throw new Error(`registry:page の target が許可した page path でない: ${droppedTarget}`);
    }
    assertPathWithoutSymlinks(root, "registry:page の target", droppedTarget);
    if (existsSync(join(root, droppedTarget))) {
      throw new Error(`registry:page の target が実行前から存在する: ${droppedTarget}`);
    }
    droppedTargets.push(droppedTarget);
  }
  return droppedTargets;
}

function removeDroppedPages(root, droppedTargets, log) {
  for (const droppedTarget of droppedTargets) {
    if (!existsSync(join(root, droppedTarget))) continue;
    assertPathWithoutSymlinks(root, "registry:page の target", droppedTarget);
    rmSync(join(root, droppedTarget));
    log(`配布しない page を削除: ${droppedTarget}`);
  }
}

function createProvenanceEntry({ isBlock, upstreamText, ...rest }) {
  if (isBlock) {
    const { generatedSource: _generatedSource, upstreamItem: _upstreamItem, ...blockArgs } = rest;
    return blockProvenanceEntry({ ...blockArgs, upstreamText });
  }
  return provenanceEntry(rest);
}

async function fetchProvenanceMetadata({ isBlock, name, target, fetchImpl }) {
  const upstreamRepo = "shadcn-ui/ui";
  if (isBlock) {
    // block ディレクトリ単位で 1 コールに畳む。ファイルごとに叩くと未認証の GitHub API
    // （60 req/h）を 27 件 × 平均 4 ファイルで確実に超える。CLI の副作用より前に固定し、
    // API 失敗で既存 block が部分更新されないようにする。
    const blockUpstreamDir = `${UPSTREAM_PREFIX}blocks/${name}`;
    return {
      upstreamPathSha: await upstreamCommitSha(upstreamRepo, blockUpstreamDir, fetchImpl, name),
    };
  }

  await fetchJson(
    `https://api.github.com/repos/${upstreamRepo}/contents/${target.upstreamPath}`,
    fetchImpl,
  );
  return {
    upstreamPathSha: await upstreamCommitSha(upstreamRepo, target.upstreamPath, fetchImpl, name),
  };
}

// 正規化後にハッシュだけを取り直す。CLI も通信も行わない。
// ensureClean を求めないのは、正規化した変更が作業ツリーに載っている状態で
// 呼ぶための経路だから（求めると、この関数を使う唯一の場面で必ず弾かれる）。
export function resyncBlockHashes({ root, name, modified, provenance, log = console.log }) {
  const entry = provenance.blocks?.[name];
  if (!entry) {
    throw new Error(`${name}: provenance.blocks に来歴が無い（先に add を実行する）`);
  }
  const updated = [];
  for (const file of entry.files) {
    if (file.dropped === true) continue;
    const absolute = join(root, assertContainedPath(`${name}: 来歴の path`, file.path));
    if (!existsSync(absolute)) {
      throw new Error(`${name}: 来歴にある ${file.path} が存在しない`);
    }
    const actual = sha256(readFileSync(absolute, "utf8"));
    if (actual !== file.generatedContentSha256) {
      updated.push({ path: file.path, before: file.generatedContentSha256, after: actual });
      file.generatedContentSha256 = actual;
    }
  }
  // 渡されたときだけ上書きする。省略時は既存の記録を保つ。
  if (modified) entry.modified = modified;
  writeJson(root, "provenance.json", provenance);
  for (const { path, before, after } of updated) {
    log(`ハッシュを更新: ${path} ${before.slice(0, 8)} -> ${after.slice(0, 8)}`);
  }
  if (updated.length === 0) log(`${name}: 来歴のハッシュは実体と一致していた（更新なし）`);
  return { skipped: false, resynced: true, updated };
}

export async function runAddComponent({
  argv = process.argv.slice(2),
  root = process.cwd(),
  fetchImpl = fetch,
  runCommand = execFileSync,
  log = console.log,
} = {}) {
  const { name, modified, force, resync } = parseArgs(argv);
  const repositoryRoot = git(root, ["rev-parse", "--show-toplevel"]).trim();
  if (!resync) ensureClean(repositoryRoot);

  const provenance = readJson(repositoryRoot, "provenance.json");
  if (resync) return resyncBlockHashes({ root: repositoryRoot, name, modified, provenance, log });

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
  if (!isBlock) {
    assertPathWithoutSymlinks(repositoryRoot, `${name}: CLI 生成先`, target.targetPath);
  }

  // lane の衝突を provenance だけで判断すると、台帳の部分欠損時に同名の
  // registry item や disk 実体を上書きできてしまう。CLI の副作用より前に、
  // 独立した 3 根（provenance / registry / disk）をすべて照合する。
  const registryBefore = readJson(repositoryRoot, "registry.json");
  const existingRegistryItems = registryBefore.items.filter((item) => item.name === name);
  if (existingRegistryItems.length > 1) {
    throw new Error(`${name}: registry item が重複している（${existingRegistryItems.length} 件）`);
  }
  const existingRegistryItem = existingRegistryItems[0];
  const oppositeDiskPath = isBlock
    ? join(repositoryRoot, "src/components/ui", `${name}.tsx`)
    : join(repositoryRoot, "src/blocks", name);

  const otherLane = isBlock ? provenance.components?.[name] : provenance.blocks?.[name];
  const registryLaneConflict = existingRegistryItem
    ? isBlock
      ? existingRegistryItem.type !== "registry:block"
      : existingRegistryItem.type === "registry:block"
    : false;
  if (otherLane || registryLaneConflict || existsSync(oppositeDiskPath)) {
    throw new Error(`${name}: component と block の同名衝突がある`);
  }

  if (shouldSkipRecorded(provenance, name, force, isBlock ? "block" : "component")) {
    log(`${name}: 既に記録済み（--force で上書き可能）`);
    return { skipped: true };
  }

  const overwriteTargets = isBlock ? blockOverwriteTargets(provenance, name, force) : new Set();
  if (isBlock) prepareBlockRelocation(repositoryRoot, target, overwriteTargets);

  // 外部 registry が指定する削除対象は CLI の副作用より前に検証する。
  // 実行前から存在する path は CLI が上書きする可能性もあるため、先に停止する。
  const droppedTargets = prepareDroppedPages(repositoryRoot, target);

  // 来歴に必要な外部メタデータは、CLI・移設・削除より前に全件取得する。
  // 後段に外部通信を残すと、API の一過性失敗だけで既存 block が部分更新される。
  const provenanceMetadata = await fetchProvenanceMetadata({
    isBlock,
    name,
    target,
    fetchImpl,
  });

  // 検証・来歴hash・CLI実行を同じresponse bytesへ束縛する。
  // @shadcn/<name>を渡すとCLIがremoteを再取得し、preflight後に内容が変わる
  // TOCTOUが生じるため、shadcn公式のlocal item入力を使う。
  const pinnedItem = pinnedRegistryItem(
    name,
    registryTextForCli(upstreamText, upstreamItem, target, registryBefore.items),
  );
  try {
    const command = shadcnCommand(cliVersion, pinnedItem.path);
    runCommand(command.command, command.args, { cwd: repositoryRoot, stdio: "inherit" });
  } finally {
    pinnedItem.remove();
  }

  if (isBlock) relocateBlockFiles(repositoryRoot, target, log, overwriteTargets);
  // reconcile より前に呼ぶ。後にすると、CLI が作った app/<name>/page.tsx が
  // どの分類ルールにも一致せず reconcile が先に停止し、この防御へ到達しない。
  removeDroppedPages(repositoryRoot, droppedTargets, log);

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
  const entry = createProvenanceEntry({
    root: repositoryRoot,
    isBlock,
    name,
    modified: modifiedWithDroppedDependencies(modified, upstreamItem, target, registryBefore.items),
    cliVersion,
    generatedSource,
    upstreamItem,
    upstreamText,
    target,
    registryUrl,
    ...provenanceMetadata,
  });

  if (isBlock) {
    provenance.blocks ??= {};
    provenance.blocks[name] = entry;
  } else {
    provenance.components ??= {};
    provenance.components[name] = entry;
  }
  const registry = registryBefore;
  const registryItem = buildRegistryItem(
    name,
    upstreamItem,
    generatedSource,
    target,
    registry.items,
  );
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
