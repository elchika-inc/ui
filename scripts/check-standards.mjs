// DESIGN.md §5 の 2 規定を機械検知する。
// 1. フォーカスリングに透明度合成を使わない（WCAG 1.4.11 の 3:1 を割るため）
// 2. 値系ユーティリティの arbitrary value を使わない。
//    例外は ring-[3px] と @custom-variant dark のみ。
//    variant 構文（data-[...] / aria-[...] / [&_svg]:...）は AUDIT.md の
//    規定どおり対象外。
// AUDIT.md は components/ui/ を検査対象外としているが、それは shadcn から
// コピーして所有するだけのプロジェクト向けの規定。本リポジトリは
// components/ui/ そのものを standards へ正規化して配布する側なので、
// ここは意図的に対象へ含める。
import { globSync, readFileSync } from "node:fs";
import { posix } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

// 同じクラストークン内に focus / invalid の状態語があるリングだけを対象にする。
// variant の前後や arbitrary variant の内外には依存しない。無条件の
// ring-foreground/10 のような装飾リングは WCAG 1.4.11 の状態表示ではない。
// 色名は [a-z0-9-]+（[a-z-]+ だと ring-red-500/50 を見逃す）。
// 不透明度の指定は Tailwind v4 が 4 形式を受けるため全部拾う（実測で確認）:
//   /50  /12.5  /[50%]  /[.5]  /(--ring-alpha)
// \d+ だけだと角括弧・丸括弧の形式を見逃し、透明度禁止を迂回できる。
// arbitrary 検査にも掛からないので、ここが唯一の検出経路になる。
// 色側も v4 の変数短縮 ring-(--brand) と任意値 ring-[#f00] を拾う。
// 色側を [a-z0-9-]+ だけにすると ring-(--brand)/50 を見逃す（実測）。
const STATEFUL_RING = /(?:focus|invalid)/;
const RING_OPACITY =
  /ring-(?:ring|[a-z0-9-]+|\([^)]+\)|\[[^\]]+\])\/(?:\d+(?:\.\d+)?%?|\[[^\]]+\]|\([^)]+\))/g;
const STRING_LITERAL = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g;

// 値系ユーティリティだけを対象にする。プレフィックスの列挙は AUDIT.md の
// arbitrary value 検査コマンドから逐語で写した。
// has-data-[...] / in-data-[...] / not-aria-[...] / [&_svg]:... は
// 正当な variant 構文であり、この列挙に含まれないので自然に除外される。
const ARBITRARY =
  /\b(?:w|h|size|p[trblxy]?|m[trblxy]?|text|gap|z|top|left|right|bottom|inset|rounded|duration|leading|tracking|ring|border|shadow|bg|fill|stroke)-\[[^\]]+\]/g;
const ALLOWED_ARBITRARY = new Set(["ring-[3px]"]);
const BOOLEAN_DATA_INSET = /data-inset=\{inset\}/g;
const SCRIPT_PATH = /\.(?:[cm]?[jt]sx?)$/;
const SOURCE_GLOB = "src/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts,css}";

const blankComment = (comment) => comment.replace(/[^\r\n]/g, " ");

function sourceWithoutScriptComments(path, source) {
  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKindForPath(path),
  );
  const commentRanges = new Map();
  const addCommentRanges = (ranges) => {
    for (const range of ranges ?? []) {
      commentRanges.set(`${range.pos}:${range.end}`, range);
    }
  };
  const collectCommentRanges = (node) => {
    addCommentRanges(ts.getLeadingCommentRanges(source, node.getFullStart()));
    addCommentRanges(ts.getTrailingCommentRanges(source, node.getEnd()));
    for (const child of node.getChildren(sourceFile)) collectCommentRanges(child);
  };
  collectCommentRanges(sourceFile);

  const chunks = [];
  let cursor = 0;
  for (const { pos: start, end } of [...commentRanges.values()].sort((a, b) => a.pos - b.pos)) {
    if (start < cursor) continue;
    chunks.push(source.slice(cursor, start), blankComment(source.slice(start, end)));
    cursor = end;
  }
  chunks.push(source.slice(cursor));
  return chunks.join("");
}

function endOfQuotedCss(characters, start) {
  const quote = characters[start];
  for (let index = start + 1; index < characters.length; index++) {
    if (characters[index] === "\\") index++;
    else if (characters[index] === quote) return index;
  }
  return characters.length - 1;
}

function blankCssComment(characters, start) {
  for (let index = start; index < characters.length; index++) {
    const isEnd = characters[index] === "*" && characters[index + 1] === "/";
    if (characters[index] !== "\n" && characters[index] !== "\r") {
      characters[index] = " ";
    }
    if (isEnd) {
      characters[index + 1] = " ";
      return index + 1;
    }
  }
  return characters.length - 1;
}

function sourceWithoutCssComments(source) {
  const characters = [...source];
  for (let index = 0; index < characters.length; index++) {
    if (characters[index] === '"' || characters[index] === "'") {
      index = endOfQuotedCss(characters, index);
    } else if (characters[index] === "/" && characters[index + 1] === "*") {
      index = blankCssComment(characters, index);
    }
  }
  return characters.join("");
}

function sourceWithoutComments(path, source) {
  if (path.endsWith(".css")) return sourceWithoutCssComments(source);
  if (SCRIPT_PATH.test(path)) return sourceWithoutScriptComments(path, source);
  return source;
}

function scriptKindForPath(path) {
  if (path.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (path.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (/\.(?:[cm]?ts)$/.test(path)) return ts.ScriptKind.TS;
  return ts.ScriptKind.JS;
}

function createClassAnalysis(sources) {
  const virtualRoot = "/__elchika_check__";
  const sourceEntries = new Map();
  for (const [path, source] of sources) {
    if (!SCRIPT_PATH.test(path)) continue;
    const normalizedPath = path.replace(/^\.\//, "");
    const isAttributeFragment = path.endsWith(".tsx") && /^\s*className\s*=/.test(source);
    const prefix = isAttributeFragment ? "<div " : "";
    const parsedSource = isAttributeFragment ? `${prefix}${source} />` : source;
    const virtualPath = posix.join(virtualRoot, normalizedPath);
    sourceEntries.set(virtualPath, { path, prefix, source, parsedSource });
  }
  const compilerOptions = {
    allowJs: true,
    baseUrl: virtualRoot,
    jsx: ts.JsxEmit.Preserve,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noLib: true,
    paths: { "@/*": ["src/*"] },
    target: ts.ScriptTarget.Latest,
  };
  const sourceFiles = new Map();
  const getSourceFile = (fileName) => {
    if (sourceFiles.has(fileName)) return sourceFiles.get(fileName);
    const entry = sourceEntries.get(fileName);
    if (!entry) return undefined;
    const sourceFile = ts.createSourceFile(
      fileName,
      entry.parsedSource,
      ts.ScriptTarget.Latest,
      true,
      scriptKindForPath(fileName),
    );
    sourceFiles.set(fileName, sourceFile);
    return sourceFile;
  };
  const directoryExists = (directory) =>
    [...sourceEntries.keys()].some((fileName) => fileName.startsWith(`${directory}/`));
  const resolutionHost = {
    directoryExists,
    fileExists: (fileName) => sourceEntries.has(fileName),
    getCurrentDirectory: () => "/",
    getDirectories: () => [],
    readFile: (fileName) => sourceEntries.get(fileName)?.parsedSource,
  };
  const resolveModule = (moduleName, containingFile) =>
    ts.resolveModuleName(moduleName, containingFile, compilerOptions, resolutionHost)
      .resolvedModule;
  const host = {
    fileExists: (fileName) => sourceEntries.has(fileName),
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => "/",
    getDefaultLibFileName: () => "",
    getDirectories: () => [],
    getNewLine: () => "\n",
    getSourceFile,
    readFile: (fileName) => sourceEntries.get(fileName)?.parsedSource,
    resolveModuleNames: (moduleNames, containingFile) =>
      moduleNames.map((moduleName) => resolveModule(moduleName, containingFile)),
    useCaseSensitiveFileNames: () => true,
    writeFile: () => {},
  };
  const program = ts.createProgram([...sourceEntries.keys()], compilerOptions, host);
  return {
    checker: program.getTypeChecker(),
    entryForPath: (path) => {
      const virtualPath = posix.join(virtualRoot, path.replace(/^\.\//, ""));
      const entry = sourceEntries.get(virtualPath);
      return entry ? { ...entry, sourceFile: program.getSourceFile(virtualPath) } : undefined;
    },
  };
}

function classNameExpressions(path, analysis) {
  if (!path.endsWith(".tsx")) return [];
  const entry = analysis.entryForPath(path);
  if (!entry?.sourceFile) return [];
  const { checker } = analysis;
  const { prefix, sourceFile } = entry;
  const expressions = [];
  const symbolKeys = new WeakMap();
  let nextSymbolKey = 1;
  const canonicalSymbol = (symbol) => {
    if (!(symbol.flags & ts.SymbolFlags.Alias)) return symbol;
    return checker.getAliasedSymbol(symbol);
  };
  const symbolKey = (symbol) => {
    const canonical = canonicalSymbol(symbol);
    if (!symbolKeys.has(canonical)) symbolKeys.set(canonical, nextSymbolKey++);
    return symbolKeys.get(canonical);
  };
  const elementPropertyName = (argument) => {
    if (ts.isStringLiteral(argument) || ts.isNumericLiteral(argument)) {
      return argument.text;
    }
    const type = checker.getTypeAtLocation(argument);
    if (type.flags & ts.TypeFlags.StringLiteral) return type.value;
    if (type.flags & ts.TypeFlags.NumberLiteral) return `${type.value}`;
    return undefined;
  };
  const propertySymbol = (expression) => {
    if (ts.isPropertyAccessExpression(expression)) {
      return checker.getSymbolAtLocation(expression.name);
    }
    if (ts.isElementAccessExpression(expression) && expression.argumentExpression) {
      const propertyName = elementPropertyName(expression.argumentExpression);
      return propertyName
        ? checker.getTypeAtLocation(expression.expression).getProperty(propertyName)
        : undefined;
    }
    return undefined;
  };
  const simpleReference = (expression) => {
    let current = expression;
    while (
      ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isNonNullExpression(current)
    ) {
      current = current.expression;
    }
    return ts.isIdentifier(current) ||
      ts.isPropertyAccessExpression(current) ||
      ts.isElementAccessExpression(current)
      ? current
      : undefined;
  };
  const immutableAliasInitializer = (symbol) => {
    for (const declaration of canonicalSymbol(symbol).declarations ?? []) {
      if (
        ts.isVariableDeclaration(declaration) &&
        ts.isVariableDeclarationList(declaration.parent) &&
        declaration.parent.flags & ts.NodeFlags.Const &&
        declaration.initializer
      ) {
        const reference = simpleReference(declaration.initializer);
        if (reference) return reference;
      }
    }
    return undefined;
  };
  const accessIdentity = (expression, resolving) => {
    if (!ts.isPropertyAccessExpression(expression) && !ts.isElementAccessExpression(expression)) {
      return undefined;
    }
    const receiver = referenceIdentity(expression.expression, resolving);
    const property = propertySymbol(expression);
    const name = ts.isPropertyAccessExpression(expression)
      ? expression.name.text
      : expression.argumentExpression?.getText(expression.getSourceFile());
    return `property:${receiver}:${property ? `symbol:${symbolKey(property)}` : name}`;
  };
  const symbolIdentity = (expression, resolving) => {
    const symbol = checker.getSymbolAtLocation(expression);
    if (!symbol) return undefined;
    const canonical = canonicalSymbol(symbol);
    if (!resolving.has(canonical)) {
      const alias = immutableAliasInitializer(canonical);
      if (alias) return referenceIdentity(alias, new Set(resolving).add(canonical));
    }
    return `symbol:${symbolKey(canonical)}`;
  };
  const referenceIdentity = (expression, resolving = new Set()) => {
    const current = simpleReference(expression) ?? expression;
    if (current.kind === ts.SyntaxKind.ThisKeyword) return "this";
    const access = accessIdentity(current, resolving);
    if (access) return access;
    const identity = symbolIdentity(current, resolving);
    if (identity) return identity;
    return `expression:${current.getSourceFile().fileName}:${current.getStart()}:${current.getText()}`;
  };
  const literalIdentity = (expression) => {
    if (
      ts.isStringLiteral(expression) ||
      ts.isNumericLiteral(expression) ||
      ts.isNoSubstitutionTemplateLiteral(expression) ||
      expression.kind === ts.SyntaxKind.TrueKeyword ||
      expression.kind === ts.SyntaxKind.FalseKeyword ||
      expression.kind === ts.SyntaxKind.NullKeyword
    ) {
      return expression.getText(expression.getSourceFile());
    }
    return undefined;
  };
  const unwrapBooleanOperand = (expression, truthy) => {
    let current = expression;
    let required = truthy;
    while (ts.isParenthesizedExpression(current)) current = current.expression;
    while (
      ts.isPrefixUnaryExpression(current) &&
      current.operator === ts.SyntaxKind.ExclamationToken
    ) {
      required = !required;
      current = current.operand;
      while (ts.isParenthesizedExpression(current)) current = current.expression;
    }
    return { current, required };
  };
  const equalityKind = (operator) => {
    if (
      operator === ts.SyntaxKind.EqualsEqualsToken ||
      operator === ts.SyntaxKind.EqualsEqualsEqualsToken
    ) {
      return "equal";
    }
    if (
      operator === ts.SyntaxKind.ExclamationEqualsToken ||
      operator === ts.SyntaxKind.ExclamationEqualsEqualsToken
    ) {
      return "not-equal";
    }
    return undefined;
  };
  const equalityRequirement = (expression, required) => {
    if (!ts.isBinaryExpression(expression)) return undefined;
    const kind = equalityKind(expression.operatorToken.kind);
    if (!kind) return undefined;
    const leftLiteral = literalIdentity(expression.left);
    const rightLiteral = literalIdentity(expression.right);
    if ((leftLiteral === undefined) === (rightLiteral === undefined)) return undefined;
    const literal = leftLiteral ?? rightLiteral;
    const reference = leftLiteral === undefined ? expression.left : expression.right;
    const identity = referenceIdentity(reference);
    const isEqual = kind === "not-equal" ? !required : required;
    const requirements = [{ key: `equality:${identity}:${literal}`, required: isEqual }];
    if (isEqual) {
      requirements.push({ key: `equality-value:${identity}`, required: literal });
    }
    return requirements;
  };
  const unwrapCondition = (expression, truthy) => {
    const { current, required } = unwrapBooleanOperand(expression, truthy);
    const equality = equalityRequirement(current, required);
    if (equality) return equality;
    return [{ key: referenceIdentity(current), required }];
  };

  const withRequirement = (candidates, requirementsToAdd) =>
    candidates.flatMap((candidate) => {
      const requirements = new Map(candidate.requirements);
      for (const requirement of requirementsToAdd) {
        const existing = requirements.get(requirement.key);
        if (existing !== undefined && existing !== requirement.required) return [];
        requirements.set(requirement.key, requirement.required);
      }
      return [{ ...candidate, requirements }];
    });

  const mergeCandidates = (left, right) => {
    const requirements = new Map(left.requirements);
    for (const [key, required] of right.requirements) {
      const existing = requirements.get(key);
      if (existing !== undefined && existing !== required) return undefined;
      requirements.set(key, required);
    }
    return { nodes: [...left.nodes, ...right.nodes], requirements };
  };

  const combineCandidateSets = (sets) =>
    sets.reduce(
      (combined, candidates) =>
        combined.flatMap((left) =>
          candidates.flatMap((right) => {
            const merged = mergeCandidates(left, right);
            return merged ? [merged] : [];
          }),
        ),
      [{ nodes: [], requirements: new Map() }],
    );

  const symbolForExpression = (expression) => {
    const symbol = propertySymbol(expression) ?? checker.getSymbolAtLocation(expression);
    return symbol ? canonicalSymbol(symbol) : undefined;
  };

  const declarationInitializersForSymbol = (symbol, seen = new Set()) => {
    const canonical = canonicalSymbol(symbol);
    if (seen.has(canonical)) return [];
    const nextSeen = new Set(seen).add(canonical);
    return (canonical.declarations ?? []).flatMap((declaration) => {
      if (ts.isShorthandPropertyAssignment(declaration)) {
        const valueSymbol = checker.getShorthandAssignmentValueSymbol(declaration);
        return valueSymbol ? declarationInitializersForSymbol(valueSymbol, nextSeen) : [];
      }
      if (
        (ts.isVariableDeclaration(declaration) ||
          ts.isParameter(declaration) ||
          ts.isBindingElement(declaration) ||
          ts.isPropertyAssignment(declaration) ||
          ts.isPropertyDeclaration(declaration)) &&
        declaration.initializer
      ) {
        return [declaration.initializer];
      }
      return [];
    });
  };

  const declarationInitializers = (expression) => {
    const symbol = symbolForExpression(expression);
    if (!symbol) return {};
    return { symbol, initializers: declarationInitializersForSymbol(symbol) };
  };

  const directReturnExpressions = (body) => {
    if (!ts.isBlock(body)) return [body];
    const returns = [];
    const visit = (node) => {
      if (node !== body && ts.isFunctionLike(node)) return;
      if (ts.isReturnStatement(node) && node.expression) {
        returns.push(node.expression);
        return;
      }
      ts.forEachChild(node, visit);
    };
    visit(body);
    return returns;
  };

  const functionBody = (declaration) => {
    if (
      (ts.isFunctionDeclaration(declaration) || ts.isMethodDeclaration(declaration)) &&
      declaration.body
    ) {
      return declaration.body;
    }
    if (
      (ts.isVariableDeclaration(declaration) ||
        ts.isPropertyAssignment(declaration) ||
        ts.isPropertyDeclaration(declaration)) &&
      declaration.initializer &&
      (ts.isArrowFunction(declaration.initializer) ||
        ts.isFunctionExpression(declaration.initializer))
    ) {
      return declaration.initializer.body;
    }
    return undefined;
  };

  const staticReturnExpressions = (expression) => {
    const symbol = symbolForExpression(expression);
    if (!symbol) return {};
    const returns = (symbol.declarations ?? []).flatMap((declaration) => {
      const body = functionBody(declaration);
      return body ? directReturnExpressions(body) : [];
    });
    return { symbol, returns };
  };

  const emptyCandidate = () => ({ nodes: [], requirements: new Map() });
  const nodeCandidate = (node) => ({ nodes: [node], requirements: new Map() });

  const candidatesForBinaryExpression = (expression, resolving) => {
    const operator = expression.operatorToken.kind;
    if (operator === ts.SyntaxKind.AmpersandAmpersandToken) {
      return [
        ...withRequirement([emptyCandidate()], unwrapCondition(expression.left, false)),
        ...withRequirement(
          candidatesForExpression(expression.right, resolving),
          unwrapCondition(expression.left, true),
        ),
      ];
    }
    if (operator === ts.SyntaxKind.BarBarToken) {
      return [
        ...withRequirement(
          candidatesForExpression(expression.left, resolving),
          unwrapCondition(expression.left, true),
        ),
        ...withRequirement(
          candidatesForExpression(expression.right, resolving),
          unwrapCondition(expression.left, false),
        ),
      ];
    }
    if (operator === ts.SyntaxKind.QuestionQuestionToken) {
      return [
        ...candidatesForExpression(expression.left, resolving),
        ...candidatesForExpression(expression.right, resolving),
      ];
    }
    if (operator === ts.SyntaxKind.PlusToken || operator === ts.SyntaxKind.CommaToken) {
      return combineCandidateSets([
        candidatesForExpression(expression.left, resolving),
        candidatesForExpression(expression.right, resolving),
      ]);
    }
    return undefined;
  };

  const candidatesForCallExpression = (expression, resolving) => {
    if (
      ts.isPropertyAccessExpression(expression.expression) &&
      expression.expression.name.text === "join" &&
      ts.isArrayLiteralExpression(expression.expression.expression)
    ) {
      return candidatesForExpression(expression.expression.expression, resolving);
    }
    const argumentCandidates = combineCandidateSets(
      expression.arguments.map((argument) => candidatesForExpression(argument, resolving)),
    );
    const { symbol, returns = [] } = staticReturnExpressions(expression.expression);
    if (symbol && returns.length && !resolving.has(symbol)) {
      const nextResolving = new Set(resolving).add(symbol);
      const returnCandidates = returns.flatMap((returned) =>
        candidatesForExpression(returned, nextResolving),
      );
      return [...returnCandidates, ...argumentCandidates];
    }
    return argumentCandidates;
  };

  const candidatesForTemplateExpression = (expression, resolving) =>
    combineCandidateSets([
      [nodeCandidate(expression.head)],
      ...expression.templateSpans.flatMap((span) => [
        candidatesForExpression(span.expression, resolving),
        [nodeCandidate(span.literal)],
      ]),
    ]);

  const transparentExpression = (expression) => {
    if (ts.isParenthesizedExpression(expression)) return expression.expression;
    if (ts.isAsExpression(expression)) return expression.expression;
    if (ts.isSatisfiesExpression(expression)) return expression.expression;
    if (ts.isNonNullExpression(expression)) return expression.expression;
    return undefined;
  };

  const isResolvableReference = (expression) =>
    ts.isIdentifier(expression) ||
    ts.isPropertyAccessExpression(expression) ||
    ts.isElementAccessExpression(expression);

  const candidatesForConditionalExpression = (expression, resolving) => [
    ...withRequirement(
      candidatesForExpression(expression.whenTrue, resolving),
      unwrapCondition(expression.condition, true),
    ),
    ...withRequirement(
      candidatesForExpression(expression.whenFalse, resolving),
      unwrapCondition(expression.condition, false),
    ),
  ];

  const candidatesForArrayExpression = (expression, resolving) =>
    combineCandidateSets(
      expression.elements.map((element) => candidatesForExpression(element, resolving)),
    );

  const candidatesForReferenceExpression = (expression, resolving) => {
    const { symbol, initializers = [] } = declarationInitializers(expression);
    if (!symbol || !initializers.length || resolving.has(symbol)) return undefined;
    const nextResolving = new Set(resolving).add(symbol);
    return initializers.flatMap((initializer) =>
      candidatesForExpression(initializer, nextResolving),
    );
  };

  const expressionCandidateHandlers = [
    [ts.isConditionalExpression, candidatesForConditionalExpression],
    [ts.isBinaryExpression, candidatesForBinaryExpression],
    [ts.isCallExpression, candidatesForCallExpression],
    [ts.isArrayLiteralExpression, candidatesForArrayExpression],
    [ts.isTemplateExpression, candidatesForTemplateExpression],
    [isResolvableReference, candidatesForReferenceExpression],
  ];

  const candidatesForKnownExpression = (expression, resolving) => {
    for (const [matches, resolve] of expressionCandidateHandlers) {
      if (!matches(expression)) continue;
      const candidates = resolve(expression, resolving);
      if (candidates) return candidates;
    }
    return undefined;
  };

  const candidatesForExpression = (expression, resolving = new Set()) => {
    const transparent = transparentExpression(expression);
    if (transparent) return candidatesForExpression(transparent, resolving);
    const candidates = candidatesForKnownExpression(expression, resolving);
    if (candidates) return candidates;
    return [nodeCandidate(expression)];
  };

  const expressionFragments = (expression) => {
    const candidates = candidatesForExpression(expression);
    return candidates.map((candidate) => {
      const fragments = new Map();
      for (const node of candidate.nodes) {
        const nodeSourceFile = node.getSourceFile();
        const sameSource = nodeSourceFile === sourceFile;
        const key = `${nodeSourceFile.fileName}:${node.getStart()}:${node.getEnd()}`;
        fragments.set(key, {
          text: node.getText(nodeSourceFile),
          offset: sameSource
            ? Math.max(0, node.getStart() - prefix.length)
            : Math.max(0, expression.getStart() - prefix.length),
        });
      }
      return [...fragments.values()];
    });
  };
  const visit = (node) => {
    if (ts.isJsxAttribute(node) && node.name.getText() === "className" && node.initializer) {
      const value = ts.isJsxExpression(node.initializer)
        ? node.initializer.expression
        : node.initializer;
      if (value) {
        expressions.push(...expressionFragments(value));
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return expressions;
}

function statefulRingFragmentViolations(fragments, source) {
  const literals = fragments.flatMap((fragment) => {
    const literalMatches = [...fragment.text.matchAll(STRING_LITERAL)];
    return literalMatches.length
      ? literalMatches.map((match) => ({
          text: match[0].slice(1, -1),
          offset: fragment.offset + (match.index ?? 0) + 1,
        }))
      : [{ text: fragment.text, offset: fragment.offset }];
  });
  const tokens = literals.flatMap((literal) => literal.text.split(/\s+/));
  if (!tokens.some((token) => STATEFUL_RING.test(token) && token.includes("ring-"))) {
    return [];
  }
  return literals.flatMap((literal) =>
    [...literal.text.matchAll(RING_OPACITY)].map((match) => ({
      rule: "focus-ring-opacity",
      line: source.slice(0, literal.offset + (match.index ?? 0)).split("\n").length,
      text: match[0],
    })),
  );
}

function statefulRingViolations(text, source, offset) {
  return statefulRingFragmentViolations([{ text, offset }], source);
}

function checkFileWithAnalysis(path, source, analysis) {
  const violations = [];
  const executableSource = sourceWithoutComments(path, source);
  let lineOffset = 0;
  executableSource.split("\n").forEach((line, i) => {
    const currentLineOffset = lineOffset;
    lineOffset += line.length + 1;
    if (line.includes("@custom-variant dark")) return;
    violations.push(...statefulRingViolations(line, source, currentLineOffset));
    for (const m of line.matchAll(ARBITRARY)) {
      if (ALLOWED_ARBITRARY.has(m[0])) continue;
      violations.push({ rule: "arbitrary-value", line: i + 1, text: m[0] });
    }
    for (const m of line.matchAll(BOOLEAN_DATA_INSET)) {
      violations.push({ rule: "boolean-data-inset", line: i + 1, text: m[0] });
    }
  });
  for (const fragments of classNameExpressions(path, analysis)) {
    violations.push(...statefulRingFragmentViolations(fragments, source));
  }
  const unique = new Map(
    violations.map((violation) => [
      `${violation.rule}:${violation.line}:${violation.text}`,
      violation,
    ]),
  );
  return { violations: [...unique.values()] };
}

export function checkFiles(sources) {
  const sourceMap = sources instanceof Map ? sources : new Map(sources);
  const analysis = createClassAnalysis(sourceMap);
  return new Map(
    [...sourceMap].map(([path, source]) => [path, checkFileWithAnalysis(path, source, analysis)]),
  );
}

export function checkFile(path, source) {
  return checkFiles(new Map([[path, source]])).get(path);
}

// pathToFileURL を使う。`file://${process.argv[1]}` の素朴な連結は
// パスに特殊文字を含む環境で一致しない。
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = globSync(SOURCE_GLOB);
  if (files.length === 0) {
    console.error("走査対象が 0 件（glob が壊れている）");
    process.exit(1);
  }
  const analysisFiles = new Map(files.map((file) => [file, readFileSync(file, "utf8")]));
  const results = checkFiles(analysisFiles);
  let total = 0;
  for (const f of files) {
    const { violations } = results.get(f);
    for (const v of violations) {
      console.error(`${f}:${v.line}  ${v.rule}  ${v.text}`);
      total++;
    }
  }
  if (total) {
    console.error(`\n${total} 件の standards 違反`);
    process.exit(1);
  }
  console.log(`standards 適合（${files.length} ファイルを検査）`);
}
