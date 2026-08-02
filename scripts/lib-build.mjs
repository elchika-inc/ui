import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const ALIAS_PREFIX = "@/";

const isInside = (root, target) => {
  const relative = path.relative(root, target);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};

const isModuleSpecifier = (node) => {
  const parent = node.parent;
  if (
    (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) &&
    parent.moduleSpecifier === node
  ) {
    return true;
  }
  if (ts.isExternalModuleReference(parent) && parent.expression === node) {
    return true;
  }
  return (
    ts.isLiteralTypeNode(parent) &&
    ts.isImportTypeNode(parent.parent) &&
    parent.parent.argument === parent
  );
};

const collectAliasSpecifiers = (sourceFile) => {
  const specifiers = [];
  const visit = (node) => {
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      node.text.startsWith(ALIAS_PREFIX) &&
      isModuleSpecifier(node)
    ) {
      specifiers.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
};

const parseDeclaration = (declarationPath, source) => {
  const sourceFile = ts.createSourceFile(
    declarationPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  if (sourceFile.parseDiagnostics.length > 0) {
    throw new Error(`${declarationPath}: declarationのparseに失敗した`);
  }
  return sourceFile;
};

const toRelativeSpecifier = ({ alias, declarationPath, libDir }) => {
  const aliasPath = alias.slice(ALIAS_PREFIX.length);
  const target = path.resolve(libDir, aliasPath);
  if (!isInside(libDir, target)) {
    throw new Error(`${declarationPath}: aliasがlib外を参照している: ${alias}`);
  }

  let relative = path.relative(path.dirname(declarationPath), target).split(path.sep).join("/");
  if (!relative.startsWith(".")) {
    relative = `./${relative}`;
  }
  if (!path.posix.extname(relative)) {
    relative = `${relative}.js`;
  }
  return relative;
};

export function rewriteDeclarationSource({ declarationPath, libDir, source }) {
  const sourceFile = parseDeclaration(declarationPath, source);
  const replacements = collectAliasSpecifiers(sourceFile).map((specifier) => ({
    end: specifier.getEnd() - 1,
    start: specifier.getStart(sourceFile) + 1,
    text: toRelativeSpecifier({ alias: specifier.text, declarationPath, libDir }),
  }));

  let rewritten = source;
  for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
    rewritten = `${rewritten.slice(0, replacement.start)}${replacement.text}${rewritten.slice(replacement.end)}`;
  }

  const remaining = collectAliasSpecifiers(parseDeclaration(declarationPath, rewritten));
  if (remaining.length > 0) {
    throw new Error(`${declarationPath}: alias module specifierが残っている`);
  }
  return rewritten;
}

const listDeclarations = async (directory) => {
  const declarations = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`${entryPath}: lib内のsymlinkは処理しない`);
    }
    if (entry.isDirectory()) {
      declarations.push(...(await listDeclarations(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith(".d.ts")) {
      declarations.push(entryPath);
    }
  }
  return declarations;
};

export async function rewriteDeclarationTree(libDir) {
  const declarations = await listDeclarations(libDir);
  if (declarations.length === 0) {
    throw new Error(`${libDir}: declarationが見つからない`);
  }

  for (const declarationPath of declarations) {
    const source = await readFile(declarationPath, "utf8");
    const rewritten = rewriteDeclarationSource({ declarationPath, libDir, source });
    if (rewritten !== source) {
      await writeFile(declarationPath, rewritten);
    }
  }
}

export async function cleanLib(libDir) {
  await rm(libDir, { force: true, recursive: true });
}

const main = async () => {
  const command = process.argv[2];
  const libDir = path.resolve("lib");
  if (command === "clean") {
    await cleanLib(libDir);
    console.log("lib をcleanした");
    return;
  }
  if (command === "rewrite") {
    await rewriteDeclarationTree(libDir);
    console.log("declaration aliasを相対pathへ書き換えた");
    return;
  }
  throw new Error("usage: node scripts/lib-build.mjs <clean|rewrite>");
};

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
