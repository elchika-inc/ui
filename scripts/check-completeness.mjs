// src/components/ui/*.tsx を正本として、各コンポーネントが
// 消費側の 5 経路すべてに載っていることを検査する。
// Button 固定の検査を一般化したもので、#2 で 50 件足すときの安全網になる。
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import ts from "typescript";

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

export function checkCompleteness({
  components,
  barrel,
  dts,
  registry,
  previewFiles,
  previewSources,
  provenance,
}) {
  const problems = dtsContractProblems(dts);
  const barrelPaths = exportedModulePaths(barrel);
  for (const name of components) {
    if (!barrelPaths.has(`./components/ui/${name}`)) {
      problems.push(`${name}: src/index.ts から export されていない`);
    }
    if (!registry.items.some((i) => i.name === name)) {
      problems.push(`${name}: registry.json に item が無い`);
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
      continue;
    }
    for (const [k, re] of Object.entries(PROVENANCE_SPEC)) {
      if (!p[k]) {
        problems.push(`${name}: provenance の ${k} が無い`);
        continue;
      }
      if (!re.test(String(p[k]))) {
        problems.push(`${name}: provenance の ${k} が形式に合わない: ${p[k]}`);
      }
    }
  }
  return { problems };
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
  const { problems } = checkCompleteness({
    components,
    barrel: readFileSync("src/index.ts", "utf8"),
    dts: readFileSync("lib/index.d.ts", "utf8"),
    registry: JSON.parse(readFileSync("registry.json", "utf8")),
    previewFiles: readdirSync("src/pages/preview"),
    previewSources: readdirSync("src/previews"),
    provenance: JSON.parse(readFileSync("provenance.json", "utf8")),
  });
  if (problems.length) {
    console.error(`欠落:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`${components.length} 件のコンポーネントが 5 経路すべてに載っている`);
}
