// src/components/ui/*.tsx を正本として、各コンポーネントが
// 消費側の 5 経路すべてに載っていることを検査する。
// Button 固定の検査を一般化したもので、#2 で 50 件足すときの安全網になる。
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { listBlockFiles, scanBlockNames } from "./block-scan.mjs";

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

// 配布しない registry:page も来歴には残す。dropped を「記録しない」で表現すると、
// 上流に page が無かったのか意図的に落としたのかを後から区別できない。
function blockFileProblems(name, file, index) {
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

// block は barrel export と <Name>Props を要求しない。registry 経由で copy-and-edit
// する雛形であり、ライブラリの公開 API ではないため（設計 §3-1 の要件マトリクス）。
function blockProblems(name, registry, previewFiles, previewSources, provenance, onDisk) {
  const problems = [];
  if (!registry.items.some((i) => i.name === name)) {
    problems.push(`${name}: registry.json に item が無い`);
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
  problems.push(...provenanceMetaProblems(name, p, BLOCK_PROVENANCE_SPEC));
  if (!Array.isArray(p.files) || p.files.length === 0) {
    problems.push(`${name}: provenance の files が 0 件`);
    return problems;
  }
  return [
    ...problems,
    ...p.files.flatMap((file, index) => blockFileProblems(name, file, index)),
    ...blockFileSetProblems(name, registry, p.files, onDisk),
  ];
}

// files[] の「形」だけを見ると、エントリを 1 件消しても残りが正しい限り緑になる。
// 実際に mutation で緑のまま通り抜けた。期待される集合と突き合わせる。
//
// 突合は 3 集合で行う。台帳 2 つ（registry item / provenance）の間だけで閉じると、
// registry.json と provenance.json は add-component が同じ target.files から同時に書くため
// 「両方に載っていないファイル」＝ディスクにだけ在るファイルが永久に緑になる。
// このとき配布物には import 先を欠いた tsx が入り、壊れているのは配布物だけなので
// 手元の typecheck も build も通ってしまう（実測で確認済みの失敗モード）。
function blockFileSetProblems(name, registry, files, onDisk) {
  const problems = [];
  const item = registry.items.find((i) => i.name === name);
  // item が無いことは別途 problem 済み。ここで二重に鳴らさない。
  if (!item) return problems;

  // 配布分の正解は registry item。法務ファイルは全 item へ共通で足されるもので、
  // block 自身のファイルではないので除く。type ではなく target の有無で判定する
  // ——type で切ると block 自身の registry:file まで巻き込み、正しい来歴を赤くする。
  const distributed = (item.files ?? [])
    .filter((file) => file.target === undefined)
    .map((file) => file.path)
    .sort();
  const recorded = files
    .filter((file) => file.dropped !== true)
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

  // 落とした分はローカルに実体が無いため、実体との突合ができない。
  // 上流 block は必ず registry:page を持ち、それを配布しないのが設計 §1 の決定なので、
  // 「1 件以上の dropped がある」ことを要求する。上流が page を持たない block を
  // 出してきたら赤くなるが、その時は決定の見直しが要るので止まる方が正しい。
  if (!files.some((file) => file.dropped === true)) {
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
      ),
    );
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
  const provenance = JSON.parse(readFileSync("provenance.json", "utf8"));
  // block レーンは後から生えるので、ディレクトリが無い状態を正常として扱う
  // （scanBlockNames が両方の走査根が空なら空配列を返す）。
  const blocks = scanBlockNames("src/blocks", provenance);
  const blockFiles = Object.fromEntries(
    blocks.map((name) => [name, listBlockFiles("src/blocks", name)]),
  );
  const { problems } = checkCompleteness({
    components,
    blocks,
    blockFiles,
    barrel: readFileSync("src/index.ts", "utf8"),
    dts: readFileSync("lib/index.d.ts", "utf8"),
    registry: JSON.parse(readFileSync("registry.json", "utf8")),
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
