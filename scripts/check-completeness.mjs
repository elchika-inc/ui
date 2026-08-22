// src/components/ui/*.tsx を正本として、各コンポーネントが
// 消費側の 5 経路すべてに載っていることを検査する。
// Button 固定の検査を一般化したもので、#2 で 50 件足すときの安全網になる。
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { listBlockFiles, scanBlockNames } from "./block-scan.mjs";
import {
  dependencyName,
  externalPackageFromImport,
  importedModuleSpecifiers,
} from "./import-analysis.mjs";
import { assertPathWithoutSymlinks } from "./path-safety.mjs";
import { SHARED_DEPENDENCIES, SHARED_REGISTRY_FILES } from "./registry-policy.mjs";

const sha256 = (content) => createHash("sha256").update(content, "utf8").digest("hex");

const exportDeclarations = (source, fileName) => {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  return sourceFile.statements.filter(ts.isExportDeclaration);
};

const exportedNames = (dts, typeOnly) =>
  exportDeclarations(dts, "lib/index.d.ts").flatMap((declaration) => {
    if (!declaration.exportClause || !ts.isNamedExports(declaration.exportClause)) return [];
    return declaration.exportClause.elements
      .filter((element) => (declaration.isTypeOnly || element.isTypeOnly) === typeOnly)
      .map((element) => element.name.text);
  });

const isComponentValueName = (name) =>
  /^[A-Z]/.test(name) && !name.endsWith("Props") && !/^[A-Z][A-Z0-9_]+$/.test(name);

const exportedModulePaths = (source) =>
  new Set(
    exportDeclarations(source, "src/index.ts")
      .filter(
        (declaration) =>
          !declaration.isTypeOnly &&
          declaration.exportClause &&
          ts.isNamedExports(declaration.exportClause) &&
          declaration.exportClause.elements.some(
            (element) => !element.isTypeOnly && isComponentValueName(element.name.text),
          ),
      )
      .map((declaration) => declaration.moduleSpecifier)
      .filter((specifier) => specifier && ts.isStringLiteralLike(specifier))
      .map((specifier) => specifier.text),
  );

// registry / preview / provenance は配布ファイル単位だが、design-sync は .d.ts の
// PascalCase value export を独立した component として扱う。そのため Props だけは
// export 単位で検査し、各 public value に同名の <Name>Props を要求する。
const dtsContractProblems = (dts) => {
  const typeExports = new Set(exportedNames(dts, true));
  const componentExports = exportedNames(dts, false).filter(isComponentValueName);
  if (componentExports.length === 0) {
    return ["lib/index.d.ts の PascalCase value export が 0 件（走査が空走している）"];
  }
  return componentExports
    .filter((name) => !typeExports.has(`${name}Props`))
    .map((name) => `${name}: lib/index.d.ts に ${name}Props が無い`);
};

// design §8 DoneCriteria 8 が要求する来歴の全項目。Task 2 Step 5 は button 固定
// なので 2 件目以降を担保しない。ここが唯一の一般化されたゲートになる。
//
// **存在（truthy）だけを見ない。** 全キーに "x" を入れれば通ってしまい、
// 形式の要求（40 桁 commit SHA・64 桁ハッシュ・HTTPS URL・exact semver・
// YYYY-MM-DD）が 2 件目以降で fail-open になる。キーごとに形式を持たせる。
const PROVENANCE_SPEC = {
  sourceUrl: /^https:\/\/\S+$/,
  upstreamPath: /^\S+\.tsx$/,
  upstreamPathSha: /^[0-9a-f]{40}$/,
  registry: /^https:\/\/\S+$/,
  registryUrl: /^https:\/\/\S+$/,
  registryContentSha256: /^[0-9a-f]{64}$/,
  generatedContentSha256: /^[0-9a-f]{64}$/,
  addTarget: /^@[\w-]+\/[\w-]+$/,
  // SemVer 2.0.0 の公式正規表現（semver.org 掲載）。自前で簡略化すると必ずずれる
  // — 実測で `-[\w.]+` 版は 4.16.0-alpha-beta と 4.16.0+build-meta を誤って拒否し、
  // 4.16.0+bad_meta と 4.16.0-.. を誤って許した（`\w` は `_` を含み `-` を含まない）。
  shadcnCliVersion:
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
  fetchedAt: /^\d{4}-\d{2}-\d{2}$/,
  license: /^\S+$/,
  modified: /\S/,
};

// block の来歴。component と違い配布ファイルが複数あるため、共通メタと files[] を分けて検査する。
// 単一ファイル前提の PROVENANCE_SPEC を流用すると、dashboard-01 の data.json が
// upstreamPath の `\.tsx$` に一致せず、正しい来歴を誤って弾く。
const BLOCK_PROVENANCE_SPEC = {
  registryUrl: /^https:\/\/\S+$/,
  registryContentSha256: /^[0-9a-f]{64}$/,
  addTarget: /^@[\w-]+\/[\w-]+$/,
  shadcnCliVersion: PROVENANCE_SPEC.shadcnCliVersion,
  fetchedAt: /^\d{4}-\d{2}-\d{2}$/,
  license: /^\S+$/,
  modified: /\S/,
};

const ORIGINAL_BLOCK_PROVENANCE_SPEC = {
  license: /^\S+$/,
  modified: /\S/,
};

// origin は来歴スキーマの分岐キー。完全一致で判定し、未知の出所は fail-closed にする。
// 自作品で上流由来キーを禁止するのは、移植品を自作と誤分類して来歴を失うのを防ぐため。
const BLOCK_ORIGINS = {
  "shadcn/ui registry": {
    spec: BLOCK_PROVENANCE_SPEC,
    forbidden: [],
    fileRequired: ["upstreamPath", "upstreamPathSha"],
    fileForbidden: [],
    requiresDropped: true,
  },
  "elchika original": {
    spec: ORIGINAL_BLOCK_PROVENANCE_SPEC,
    forbidden: [
      "registryUrl",
      "registryContentSha256",
      "addTarget",
      "shadcnCliVersion",
      "fetchedAt",
    ],
    fileRequired: [],
    fileForbidden: ["upstreamPath", "upstreamPathSha", "dropped"],
    requiresDropped: false,
  },
};

// 全 item へ同梱する共有ファイルだけを block 所有集合から除く。
// target の有無だけで分けると、target が必須の block 所有 registry:file まで除外される。
// path または target の片方だけを借りた file は共有扱いにしない。
const SHARED_REGISTRY_FILE_KEYS = new Set(
  [
    ["src/styles/global.css", "~/elchika-ui/tokens.css"],
    ["src/styles/design-system/tokens.css", "~/elchika-ui/design-system/tokens.css"],
    ["src/styles/design-system/brands.css", "~/elchika-ui/design-system/brands.css"],
    ["LICENSE", "~/elchika-ui/LICENSE"],
    ["THIRD_PARTY_LICENSES", "~/elchika-ui/THIRD_PARTY_LICENSES"],
  ].map(([path, target]) => `${path}\0${target}`),
);

function blockOwnedRegistryFiles(item) {
  return (item.files ?? []).filter(
    (file) => !SHARED_REGISTRY_FILE_KEYS.has(`${file.path}\0${file.target}`),
  );
}

// 移植品で配布しない上流 file も来歴には残す。dropped を「記録しない」で表現すると、
// 上流に file が無かったのか意図的に落としたのかを後から区別できない。
function originalBlockFileProblems(name, file, index, origin) {
  const label = `${name}: files[${index}]`;
  const problems = [];
  for (const key of origin.fileForbidden) {
    if (Object.hasOwn(file, key)) {
      problems.push(`${label} は自作 block なので ${key} を持たない`);
    }
  }
  if (!String(file.path ?? "").startsWith(`src/blocks/${name}/`)) {
    problems.push(`${label} の path が src/blocks/${name}/ 配下でない`);
  }
  if (!/^[0-9a-f]{64}$/.test(String(file.generatedContentSha256 ?? ""))) {
    problems.push(`${label} の generatedContentSha256 が64桁の小文字ハッシュでない`);
  }
  return problems;
}

function migratedBlockFileProblems(name, file, index) {
  const label = `${name}: files[${index}]`;
  const problems = [];
  if (!/^\S+$/.test(String(file.upstreamPath ?? ""))) {
    problems.push(`${label} の upstreamPath が無い`);
  }
  if (!/^[0-9a-f]{40}$/.test(String(file.upstreamPathSha ?? ""))) {
    problems.push(`${label} の upstreamPathSha が40桁の小文字SHAでない`);
  }
  if (file.dropped === true) {
    if (file.path !== undefined) {
      problems.push(`${label} は dropped なので path を持たない`);
    }
    if (file.generatedContentSha256 !== undefined) {
      problems.push(`${label} は dropped なので generatedContentSha256 を持たない`);
    }
    return problems;
  }
  if (!String(file.path ?? "").startsWith(`src/blocks/${name}/`)) {
    problems.push(`${label} の path が src/blocks/${name}/ 配下でない`);
  }
  if (!/^[0-9a-f]{64}$/.test(String(file.generatedContentSha256 ?? ""))) {
    problems.push(`${label} の generatedContentSha256 が64桁の小文字ハッシュでない`);
  }
  return problems;
}

function blockFileProblems(name, file, index, origin) {
  if (origin.fileRequired.length === 0) {
    return originalBlockFileProblems(name, file, index, origin);
  }
  return migratedBlockFileProblems(name, file, index);
}

function duplicateBlockFileProblems(name, files, origin) {
  const keyNames = origin.fileRequired.length === 0 ? ["path"] : ["upstreamPath", "path"];
  return keyNames.flatMap((keyName) => {
    const counts = new Map();
    for (const file of files) {
      const key = file[keyName];
      if (typeof key !== "string" || key.length === 0) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts]
      .filter(([, count]) => count > 1)
      .map(([key]) => `${name}: provenance の files に ${keyName} の重複がある: ${key}`);
  });
}

// block は barrel export と <Name>Props を要求しない。registry 経由で copy-and-edit
// する雛形であり、ライブラリの公開 API ではないため（設計 §3-1 の要件マトリクス）。
function blockProblems(name, registry, previewFiles, previewSources, provenance, onDisk, sources) {
  const problems = [];
  const registryItem = registry.items.find((item) => item.name === name);
  if (!registryItem) {
    problems.push(`${name}: registry.json に item が無い`);
  } else if (registryItem.type !== "registry:block") {
    problems.push(`${name}: registry item の type が registry:block でない`);
  }
  if (!previewSources.includes(`${name}.tsx`)) {
    problems.push(`${name}: src/previews/${name}.tsx が無い`);
  }
  for (const suffix of ["", "-dark"]) {
    if (!previewFiles.includes(`${name}${suffix}.astro`)) {
      problems.push(`${name}: プレビュー ${name}${suffix}.astro が無い`);
    }
  }
  const p = provenance.blocks?.[name];
  if (!p) {
    problems.push(`${name}: provenance.json に来歴が無い`);
    return problems;
  }
  if (!p.origin) {
    problems.push(`${name}: provenance の origin が無い`);
    return problems;
  }
  const origin = BLOCK_ORIGINS[p.origin];
  if (!origin) {
    problems.push(`${name}: provenance の origin が未対応: ${p.origin}`);
    return problems;
  }
  problems.push(...provenanceMetaProblems(name, p, origin.spec));
  for (const key of origin.forbidden) {
    if (Object.hasOwn(p, key)) {
      problems.push(`${name}: 自作 block は ${key} を持たない`);
    }
  }
  if (!Array.isArray(p.files) || p.files.length === 0) {
    problems.push(`${name}: provenance の files が 0 件`);
    return problems;
  }
  return [
    ...problems,
    ...duplicateBlockFileProblems(name, p.files, origin),
    ...p.files.flatMap((file, index) => blockFileProblems(name, file, index, origin)),
    ...blockFileSetProblems(name, registry, p.files, onDisk, sources, origin.requiresDropped),
  ];
}

function registryDependencyProblems(registry) {
  const problems = [];
  const itemCounts = new Map();
  for (const item of registry.items) {
    itemCounts.set(item.name, (itemCounts.get(item.name) ?? 0) + 1);
  }
  for (const item of registry.items) {
    for (const dependency of item.registryDependencies ?? []) {
      if (dependency.startsWith("@") && !dependency.startsWith("@elchika/")) continue;
      const name = dependency.replace(/^@elchika\//, "");
      if ((itemCounts.get(name) ?? 0) === 0) {
        problems.push(
          `${item.name}: registryDependencies の ${dependency} に対応する registry item が存在しない`,
        );
      }
    }
  }
  return problems;
}

const SHARED_DEPENDENCY_FILE = SHARED_REGISTRY_FILES.find(
  (file) => file.path === "src/styles/global.css",
);

function sharedDependencyProblems(registry) {
  const problems = [];
  for (const item of registry.items) {
    const distributesSharedCss = (item.files ?? []).some(
      (file) =>
        file.path === SHARED_DEPENDENCY_FILE.path && file.target === SHARED_DEPENDENCY_FILE.target,
    );
    if (!distributesSharedCss) continue;
    const declared = new Set((item.dependencies ?? []).map(dependencyName));
    for (const dependency of SHARED_DEPENDENCIES) {
      if (!declared.has(dependency)) {
        problems.push(`${item.name}: 共有配布物が要求する ${dependency} が dependencies に無い`);
      }
    }
  }
  return problems;
}

// files[] の「形」だけを見ると、エントリを 1 件消しても残りが正しい限り緑になる。
// 実際に mutation で緑のまま通り抜けた。期待される集合と突き合わせる。
//
// 突合は 3 集合で行う。台帳 2 つ（registry item / provenance）の間だけで閉じると、
// registry.json と provenance.json は add-component が同じ target.files から同時に書くため
// 「両方に載っていないファイル」＝ディスクにだけ在るファイルが永久に緑になる。
// このとき配布物には import 先を欠いた tsx が入り、壊れているのは配布物だけなので
// 手元の typecheck も build も通ってしまう（実測で確認済みの失敗モード）。
// 配布ファイルの中身から確かめられること 2 つ。sources を渡さない呼び出しは飛ばす。
//
// 1. 内部依存: 配布ファイルが import する @/components/ui/<X> は、利用者側で <X> が
//    install されなければ解決できない。上流の registryDependencies 宣言をそのまま
//    転記しているだけなので、宣言が漏れると壊れた配布物が出る（実測: @elchika/field を
//    落としても全ゲート緑のまま、field を install しない配布物が生成された）。
//    npm 依存については add 側で import から拾い直す安全網があるが、内部依存には無かった。
// 2. 来歴のハッシュ: generatedContentSha256 は「記録時点の手元のファイル」の錨で、
//    形式（64 桁）しか見ないと正規化後にずれたまま緑になる。
// specifier の抽出は add-component と同じ AST parser で行う。正規表現でやると偽陽性
// （コメント内の例示）を
// 消すために行頭へ限定 → 折り返し import（biome の lineWidth 100 が作る正準形）を
// 全部取りこぼす、という交換になる。実測では実ファイルの
// `import {\n  Sheet,\n} from "@/components/ui/sheet"` を取りこぼし、
// 依存を落として整形するだけで全ゲートが緑になった。非 literal dynamic import も
// add 時と同じく fail-closed にし、--resync で生成時保証を迂回できないようにする。

// @/ alias は tsconfig の paths が "@/*": ["./src/*"] の 1 本なので、src 配下すべてが
// この形で参照されうる。ui だけを見ると hooks の宣言漏れが素通りする（実測）。
// 未知のサブディレクトリは fail-closed で止める——新しい alias が増えたときに
// 黙って穴が開くのを防ぐ。
const REGISTRY_ITEM_ALIASES = { "components/ui": true, hooks: true };
// registry item を持たない共有物。shadcn init が consumer 側へ必ず作るので宣言不要。
const ALIAS_EXEMPT = new Set(["lib/utils", "lib/cn"]);

function internalDependency(specifier) {
  if (!specifier.startsWith("@/")) return undefined;
  const rest = specifier.slice(2);
  if (ALIAS_EXEMPT.has(rest)) return undefined;
  for (const prefix of Object.keys(REGISTRY_ITEM_ALIASES)) {
    if (rest.startsWith(`${prefix}/`)) {
      const name = rest.slice(prefix.length + 1).split("/")[0];
      return { name };
    }
  }
  return { unknown: rest };
}

function blockSpecifierProblems({
  name,
  filePath,
  specifier,
  declared,
  declaredExternal,
  ownFiles,
}) {
  const dependency = internalDependency(specifier);
  if (dependency === undefined) {
    const external = externalPackageFromImport(specifier);
    return external && !declaredExternal.has(external)
      ? [`${name}: ${filePath} が import する ${external} が dependencies に無い`]
      : [];
  }
  if (dependency.unknown !== undefined) {
    return [`${name}: ${filePath} が import する ${specifier} を registry item へ対応付けられない`];
  }
  // 自 item が配るファイルなら宣言は要らない。
  // 現状 block の配布ファイルは src/blocks/ 配下のみなので発火しないが、
  // SUPPORTED_BLOCK_FILE_TYPES を広げたときにここが効く。
  if (ownFiles.has(`src/components/ui/${dependency.name}.tsx`)) return [];
  if (ownFiles.has(`src/hooks/${dependency.name}.ts`)) return [];
  return !declared.has(dependency.name)
    ? [`${name}: ${filePath} が import する ${specifier} が registryDependencies に無い`]
    : [];
}

function blockSourceProblems(name, item, files, sources) {
  if (sources === undefined) return [];
  const problems = [];
  const declared = new Set(
    (item.registryDependencies ?? []).map((dependency) => dependency.replace(/^@elchika\//, "")),
  );
  const declaredExternal = new Set((item.dependencies ?? []).map(dependencyName));
  const ownFiles = new Set(blockOwnedRegistryFiles(item).map((file) => file.path));

  for (const file of files.filter((entry) => entry.dropped !== true)) {
    const source = sources[file.path];
    if (source === undefined) continue;
    if (sha256(source) !== file.generatedContentSha256) {
      problems.push(`${name}: ${file.path} の generatedContentSha256 が実体と一致しない`);
    }
    let specifiers;
    try {
      specifiers = importedModuleSpecifiers(source, file.path);
    } catch (error) {
      problems.push(`${name}: ${error.message}`);
      continue;
    }
    for (const specifier of specifiers) {
      problems.push(
        ...blockSpecifierProblems({
          name,
          filePath: file.path,
          specifier,
          declared,
          declaredExternal,
          ownFiles,
        }),
      );
    }
  }
  return problems;
}

function blockFileSetProblems(name, registry, files, onDisk, sources, requiresDropped) {
  const problems = [];
  const item = registry.items.find((i) => i.name === name);
  // item が無いことは別途 problem 済み。ここで二重に鳴らさない。
  if (!item) return problems;

  // 配布分の正解は registry item。全 item へ共通で足される既知の共有ファイルだけを
  // path/target pair で除外し、target を持つ block 固有 asset は所有集合へ残す。
  const ownedFiles = blockOwnedRegistryFiles(item);
  const distributed = ownedFiles.map((file) => file.path).sort();
  for (const file of ownedFiles) {
    // block の実装コードは registry:component でなければ CLI の配置契約が変わる。
    // 一方 data.json のような block 固有 asset は registry:file が正しいため、
    // 全ファイルを一律に registry:component へ固定しない。
    const isCode = /\.[cm]?[jt]sx?$/.test(file.path ?? "");
    const expectedType = isCode ? "registry:component" : "registry:file";
    if (file.type !== expectedType) {
      problems.push(
        `${name}: registry item の ${file.path ?? "path不明"} の type が ${expectedType} でない`,
      );
    }
  }
  const recorded = files
    .filter((file) => !requiresDropped || file.dropped !== true)
    .map((file) => file.path)
    .sort();

  // 配布ファイルが 0 件の block は「何も配布しない item」であり、
  // 両方向のループが空回りして緑になる。dropped 側と対称に塞ぐ。
  if (distributed.length === 0) {
    problems.push(`${name}: registry item に配布ファイルが 1 件も無い`);
  }
  for (const path of distributed) {
    if (!recorded.includes(path)) {
      problems.push(`${name}: registry item の ${path} が provenance の files に無い`);
    }
  }
  for (const path of recorded) {
    if (!distributed.includes(path)) {
      problems.push(`${name}: provenance の files の ${path} が registry item に無い`);
    }
  }

  // 3 本目の足。onDisk を渡さない呼び出し（既存のテスト等）はここを飛ばす。
  if (onDisk !== undefined) {
    for (const path of onDisk) {
      if (!distributed.includes(path)) {
        problems.push(`${name}: ${path} が registry item に無い（配布されない）`);
      }
    }
    for (const path of distributed) {
      if (!onDisk.includes(path)) {
        problems.push(`${name}: registry item の ${path} が src/blocks/ に無い`);
      }
    }
  }

  problems.push(...blockSourceProblems(name, item, files, sources));

  // 移植品で落とした分はローカル実体と突合できないため、1 件以上の dropped を要求する。
  // 自作品には上流 file 自体が無く、dropped は禁止キーなのでこの要件を適用しない。
  if (requiresDropped && !files.some((file) => file.dropped === true)) {
    problems.push(`${name}: 配布しない registry:page の来歴（dropped: true）が無い`);
  }
  return problems;
}

// 共通メタの形式検査。component と block で spec が違うだけで手順は同じなので、
// 2 箇所に同じループを置かない（片方だけ直して乖離するのを防ぐ）。
function provenanceMetaProblems(name, entry, spec) {
  const problems = [];
  for (const [k, re] of Object.entries(spec)) {
    if (!entry[k]) {
      problems.push(`${name}: provenance の ${k} が無い`);
      continue;
    }
    if (!re.test(String(entry[k]))) {
      problems.push(`${name}: provenance の ${k} が形式に合わない: ${entry[k]}`);
    }
  }
  return problems;
}

function componentProblems(name, barrelPaths, registry, previewFiles, previewSources, provenance) {
  const problems = [];
  if (!barrelPaths.has(`./components/ui/${name}`)) {
    problems.push(`${name}: src/index.ts から export されていない`);
  }
  const registryItems = registry.items.filter((item) => item.name === name);
  if (registryItems.length === 0) {
    problems.push(`${name}: registry.json に item が無い`);
  } else if (registryItems.length === 1 && registryItems[0].type !== "registry:ui") {
    problems.push(`${name}: registry item の type が registry:ui でない`);
  }
  // ルート（.astro）だけでなく中身（src/previews/<name>.tsx）も見る。
  // ルートだけ在って中身が無いと、誤った import でもビルドが通りうる。
  if (!previewSources.includes(`${name}.tsx`)) {
    problems.push(`${name}: src/previews/${name}.tsx が無い`);
  }
  for (const suffix of ["", "-dark"]) {
    if (!previewFiles.includes(`${name}${suffix}.astro`)) {
      problems.push(`${name}: プレビュー ${name}${suffix}.astro が無い`);
    }
  }
  // CONTRIBUTING が挙げる 5 項目の 1 つ。DoneCriteria 8 もコンポーネントごとの
  // 来歴を要求するため、ここを見ないと 2 件目以降の欠落を CI が見逃す。
  const p = provenance.components?.[name];
  if (!p) {
    problems.push(`${name}: provenance.json に来歴が無い`);
    return problems;
  }
  return [...problems, ...provenanceMetaProblems(name, p, PROVENANCE_SPEC)];
}

export function checkCompleteness({
  components,
  blocks = [],
  // block ごとのディスク実体（{ "login-01": ["src/blocks/login-01/..."] }）。
  // 省略した block はディスク突合を行わない（既存の呼び出しを壊さないため）。
  blockFiles = {},
  // block ごとの配布ファイルの中身（{ "src/blocks/login-01/...": "..." }）。
  // 省略した block は内容検査（内部依存の突合・ハッシュの実体照合）を行わない。
  blockSources = {},
  barrel,
  dts,
  registry,
  previewFiles,
  previewSources,
  provenance,
}) {
  const problems = dtsContractProblems(dts);
  const componentNames = new Set(components);
  const provenanceComponentNames = new Set(Object.keys(provenance.components ?? {}));
  const laneConflicts = new Set(
    blocks.filter((name) => componentNames.has(name) || provenanceComponentNames.has(name)),
  );
  for (const name of Object.keys(provenance.blocks ?? {})) {
    if (provenanceComponentNames.has(name)) laneConflicts.add(name);
  }
  for (const name of [...laneConflicts].sort()) {
    problems.push(`${name}: component と block の両方に同名が存在する`);
  }
  const registryCounts = new Map();
  for (const item of registry.items) {
    registryCounts.set(item.name, (registryCounts.get(item.name) ?? 0) + 1);
  }
  for (const [name, count] of [...registryCounts].sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    if (count > 1) problems.push(`${name}: registry.json に同名 item が ${count} 件ある`);
  }
  problems.push(...registryDependencyProblems(registry));
  problems.push(...sharedDependencyProblems(registry));
  const barrelPaths = exportedModulePaths(barrel);
  for (const name of components) {
    problems.push(
      ...componentProblems(name, barrelPaths, registry, previewFiles, previewSources, provenance),
    );
  }
  for (const name of blocks) {
    problems.push(
      ...blockProblems(
        name,
        registry,
        previewFiles,
        previewSources,
        provenance,
        blockFiles[name]?.slice().sort(),
        blockSources[name],
      ),
    );
  }
  return { problems };
}

export function readBlockSources(root, blockFiles) {
  return Object.fromEntries(
    Object.entries(blockFiles).map(([name, paths]) => [
      name,
      Object.fromEntries(
        paths
          .map((path) => {
            const safePath = assertPathWithoutSymlinks(
              root,
              `${name}: completeness の block file`,
              path,
            );
            return [
              safePath,
              existsSync(join(root, safePath)) ? readFileSync(join(root, safePath), "utf8") : null,
            ];
          })
          .filter(([, source]) => source !== null),
      ),
    ]),
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const components = readdirSync("src/components/ui")
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => f.replace(/\.tsx$/, ""));
  if (components.length === 0) {
    console.error("コンポーネントが 0 件（走査対象が壊れている）");
    process.exit(1);
  }
  if (!existsSync("lib/index.d.ts")) {
    console.error("lib/index.d.ts が無い（build:lib を先に実行する）");
    process.exit(1);
  }
  const provenance = JSON.parse(readFileSync("provenance.json", "utf8"));
  const registry = JSON.parse(readFileSync("registry.json", "utf8"));
  // block レーンは後から生えるので、ディレクトリが無い状態を正常として扱う
  // （scanBlockNames は 3 つの走査根がすべて空なら空配列を返す）。
  const blocks = scanBlockNames("src/blocks", provenance, registry);
  const blockFiles = Object.fromEntries(blocks.map((name) => [name, listBlockFiles(".", name)]));
  const blockSources = readBlockSources(".", blockFiles);
  const { problems } = checkCompleteness({
    components,
    blocks,
    blockFiles,
    blockSources,
    barrel: readFileSync("src/index.ts", "utf8"),
    dts: readFileSync("lib/index.d.ts", "utf8"),
    registry,
    previewFiles: readdirSync("src/pages/preview"),
    previewSources: readdirSync("src/previews"),
    provenance,
  });
  if (problems.length) {
    console.error(`欠落:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  console.log(
    `${components.length} 件のコンポーネントと ${blocks.length} 件の block が全経路に載っている`,
  );
}
