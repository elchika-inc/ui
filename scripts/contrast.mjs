import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

import { CONSUMER_CASES } from "./contrast-cases.mjs";

const GATES = new Map([
  ["text-aa", 4.5],
  ["nontext-ui", 3],
  ["disabled-exempt", null],
  ["decorative", null],
]);

const REQUIRED_CONSUMER_CASE_DIGESTS = new Map([
  [
    "Kbd tooltip light alpha surface",
    "0807a8a6e5b3c0d3a98063028a2a48083c67d8c6c1408fd88d9021a3c33ce32a",
  ],
  [
    "Kbd tooltip dark alpha surface",
    "a24f2bdb3e4fbc0737299eb5775d601f0d0ef8e3adb846eef04086224595a38b",
  ],
  ["primary solid", "aba53adab6e0b2eedd5eb4176b38ea399469c489ec5ae7b42c9f623a8fb380d9"],
  ["primary hover", "e498d64a08888ca11902d2870fdbecfe486035fe9f0e7d3ddb147a73bd713d59"],
  ["secondary state hover", "2748a2b6fc8dd0e6c9d62285b0ca11265b47bf6cc2921fb2790ac35c28a71334"],
  ["selected surface", "ecb5d448dab2db08ffadf2d6c3201b296868462ae872277c38320be45259ab1c"],
  ["selected surface hover", "5c7048e8a4f1bbc0734525e741a8e3005e4233719050093ed32677ed6674e4a3"],
  ["state hover surface", "ed3147c790f9a19f41ae2ac9c5215944495c02ecdaf9afc2dd5d0c80eaa4a4d2"],
  ["opaque muted surface", "cff27519ffbef099ad536200f584ab902a2698ba24043e5d3200c3b843ab892e"],
  [
    "opaque control placeholder",
    "ac06366cb37c2113fbcef79d3daf491483392431619b85140a9c54af84829a55",
  ],
  ["control state hover", "7fce72b6531b3df164dab4f26b65f3b69d4c0c88e258a3558423699c3f5856bc"],
  ["disabled input surface", "bcbc7738ce221a567a64cdc651269ae89ebb29a6e1f5b78aa4b55d51c12c4e18"],
  ["Switch unchecked surface", "921c97bedf834f4343216832aaa170f2ceb329a35a5f97a00ed2c713de6ee946"],
  ["Tabs inactive on muted", "dff7f58da6ce5de358807fe28877a361b95206766c3e1dd1f085d02800b32fb8"],
  [
    "Tabs inactive on background",
    "92365e00aae3d2db8ba5c77b4106aa1ec9ee1aea043ad9d58a021330aaf7c534",
  ],
  ["Sidebar foreground", "9b3f128936b4768ababacec1f78bf9f23a679ec1fcd9608e9fbccf6fdd2af610"],
  [
    "Attachment destructive text",
    "c721ddedfc41591cfb9e274c7d296f22d049d0bb13b5680ab044eeeaa0b2ddb3",
  ],
  ["Alert destructive text", "91c7a6e8e85ee312b6cedc9d2794568db72b92c8a137149d48a5ad68e81c8f12"],
  ["destructive subtle", "44c27e99777c2298f3614b6177955384fb606b33359357aece078cd9d3c3d40a"],
  ["destructive subtle hover", "b5f22a51e807fcdbc476d4a1d4e9a6379ffd1e95c75f4f26412f347e46c7690e"],
  [
    "solid destructive menu focus",
    "c3ed13e050b1af18d2f9b5e3840e7c7b02942b4d74c7b6349b9efa07ce84ab1c",
  ],
  ["focus ring on background", "cf9c4bcb708e37788bda1c436e66c8340d9f6d37fa68f141b61c3df358be49e2"],
  [
    "foreground /10 container ring",
    "dfcf4dd912bf06fbe8122f4a7fd30886700e7204184d4f7dba6639e7ae1ceb53",
  ],
  [
    "input /30 decorative border",
    "14463eab833ba0e52b102d528903337878f724297443675f1753ce2d6c4a2ff1",
  ],
  ["invalid control boundary", "a609e1de6550fa5c3045d189a1908d0d3f413748c759f622a87f0428d89ac3fd"],
  [
    "Attachment destructive /30 border",
    "8acd78168fa00dd4675c334c77580a49fc8c1b3364e3e94aa871ca914a3b77d9",
  ],
  ["Field selected boundary", "4cfae05884dc9092c6eca8575af07540ed1339bbac502379dd414bba6c3fcc40"],
  ["Chart /50 grid stroke", "021303c4c0bb21c212ba2518762a33f77c67e21f16d6af4a06eb6f8856685174"],
  ["overlay token", "be420d6384f059778b9b18979b7ee19b55050ad45824a874ec32193413c35281"],
  ["warning pair", "92365e00aae3d2db8ba5c77b4106aa1ec9ee1aea043ad9d58a021330aaf7c534"],
]);

const consumerCaseContractDigest = ({ gate, themes, sourceClasses }) => {
  const contract = {
    gate,
    themes: [...(themes ?? ["light", "dark"])].sort(),
    sourceClasses: [...(sourceClasses ?? [])]
      .map(({ source, classes }) => ({ source, classes: [...classes].sort() }))
      .sort((left, right) => left.source.localeCompare(right.source)),
  };
  return createHash("sha256").update(JSON.stringify(contract)).digest("hex");
};

export function inspectRequiredConsumerCases(consumerCases) {
  return [...REQUIRED_CONSUMER_CASE_DIGESTS].flatMap(([label, expectedDigest]) => {
    const consumerCase = consumerCases.find((candidate) => candidate.label === label);
    if (!consumerCase) return [`${label}: 必須 consumer case が無い`];
    return consumerCaseContractDigest(consumerCase) === expectedDigest
      ? []
      : [`${label}: 必須 gate / theme / source class 契約が一致しない`];
  });
}

const clamp = (value) => Math.min(Math.max(value, 0), 1);

const parseAlpha = (raw) => {
  const value = raw.trim();
  const percentage = value.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))%$/);
  const number = percentage ? Number(percentage[1]) / 100 : Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 1) {
    throw new Error(`alpha が範囲外: ${raw}`);
  }
  return number;
};

const linearToGamma = (value) =>
  value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;

const gammaToLinear = (value) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

const oklchToGammaSrgb = (lightness, chroma, hue) => {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = lPrime ** 3;
  const m = mPrime ** 3;
  const s = sPrime ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return linear.map((channel) => clamp(linearToGamma(clamp(channel))));
};

export function parseColor(raw) {
  const value = raw.trim();
  const oklch = value.match(
    /^oklch\(\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:\s*\/\s*([^)]+))?\s*\)$/,
  );
  if (oklch) {
    const [, lightnessRaw, chromaRaw, hueRaw, alphaRaw] = oklch;
    const lightness = Number(lightnessRaw);
    const chroma = Number(chromaRaw);
    const hue = Number(hueRaw);
    if (
      !Number.isFinite(lightness) ||
      !Number.isFinite(chroma) ||
      !Number.isFinite(hue) ||
      lightness < 0 ||
      lightness > 1 ||
      chroma < 0
    ) {
      throw new Error(`OKLCH が範囲外: ${raw}`);
    }
    return {
      rgb: oklchToGammaSrgb(lightness, chroma, hue),
      alpha: alphaRaw === undefined ? 1 : parseAlpha(alphaRaw),
    };
  }

  const triplet = value.match(
    /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/,
  );
  if (triplet) {
    const channels = triplet.slice(1).map(Number);
    if (channels.some((channel) => channel < 0 || channel > 255)) {
      throw new Error(`RGB channel が範囲外: ${raw}`);
    }
    return { rgb: channels.map((channel) => channel / 255), alpha: 1 };
  }

  const rgb = value.match(
    /^rgb\(\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:\s*\/\s*([^)]+))?\s*\)$/,
  );
  if (rgb) {
    const channels = rgb.slice(1, 4).map(Number);
    if (channels.some((channel) => channel < 0 || channel > 255)) {
      throw new Error(`RGB channel が範囲外: ${raw}`);
    }
    return {
      rgb: channels.map((channel) => channel / 255),
      alpha: rgb[4] === undefined ? 1 : parseAlpha(rgb[4]),
    };
  }

  throw new Error(`色の値を解釈できない: ${raw}`);
}

const declarations = (body) =>
  new Map(
    [...body.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)].map((match) => [
      match[1],
      match[2].trim(),
    ]),
  );

const blocks = (css, selector) =>
  [...css.matchAll(new RegExp(`${selector}\\s*\\{([^{}]*)\\}`, "g"))].map((match) =>
    declarations(match[1]),
  );

const mergeBlocks = (target, sources) => {
  for (const source of sources) {
    for (const [name, value] of source) target.set(name, value);
  }
};

export function parseThemes(css) {
  const problems = [];
  const rootBlocks = blocks(css, ":root");
  const classDarkBlocks = blocks(css, "\\.dark");
  const dataDarkBlocks = blocks(css, '\\[data-theme\\s*=\\s*["\\\x27]?dark["\\\x27]?\\]');
  if (rootBlocks.length === 0) problems.push(":root block が無い");
  if (classDarkBlocks.length === 0 && dataDarkBlocks.length === 0) {
    problems.push("dark selector（.dark または [data-theme=dark]）が無い");
  }

  const light = new Map();
  const classDark = new Map();
  const dataDark = new Map();
  mergeBlocks(light, rootBlocks);
  mergeBlocks(classDark, classDarkBlocks);
  mergeBlocks(dataDark, dataDarkBlocks);
  for (const [name, classValue] of classDark) {
    const dataValue = dataDark.get(name);
    if (dataValue !== undefined && dataValue !== classValue) {
      problems.push(`--${name}: .dark と data-theme dark の値が一致しない`);
    }
  }
  const dark = new Map(light);
  mergeBlocks(dark, classDarkBlocks);
  mergeBlocks(dark, dataDarkBlocks);
  return { light, dark, problems };
}

export function inspectThemeAliasParity(css) {
  const rootBlocks = blocks(css, ":root");
  const darkBlocks = blocks(css, "\\.dark");
  const root = new Map();
  const dark = new Map();
  mergeBlocks(root, rootBlocks);
  mergeBlocks(dark, darkBlocks);
  const problems = [];
  if (rootBlocks.length === 0) problems.push("global.css: :root alias block が無い");
  if (darkBlocks.length === 0) problems.push("global.css: .dark alias block が無い");
  for (const name of new Set([...root.keys(), ...dark.keys()])) {
    if (!root.has(name)) {
      problems.push(`--${name}: :root alias が無い`);
    } else if (!dark.has(name)) {
      problems.push(`--${name}: .dark alias が無い`);
    } else if (root.get(name) !== dark.get(name)) {
      problems.push(`--${name}: :root と .dark の値が一致しない`);
    }
  }
  return problems;
}

const tokenName = (name) => name.replace(/^--/, "");

const rawToken = (themes, theme, name) => themes[theme]?.get(tokenName(name));

const resolveScalar = (themes, theme, name, seen) => {
  const normalized = tokenName(name);
  if (seen.has(`scalar:${normalized}`)) {
    return { problem: `--${normalized}: alias が循環している` };
  }
  const raw = rawToken(themes, theme, normalized);
  if (raw === undefined) return { problem: `--${normalized}: token が無い` };
  const nextSeen = new Set(seen).add(`scalar:${normalized}`);
  const alias = raw.match(/^var\(\s*(--[a-z0-9-]+)\s*\)$/i);
  if (alias) return resolveScalar(themes, theme, alias[1], nextSeen);
  try {
    return { value: parseAlpha(raw) };
  } catch (error) {
    return { problem: `--${normalized}: ${error.message}` };
  }
};

export function resolveToken(themes, theme, name, seen = new Set()) {
  const normalized = tokenName(name);
  if (!themes?.[theme]) return { problem: `theme が不正: ${theme}` };
  if (seen.has(normalized)) return { problem: `--${normalized}: alias が循環している` };
  const raw = rawToken(themes, theme, normalized);
  if (raw === undefined) return { problem: `--${normalized}: token が無い` };
  const nextSeen = new Set(seen).add(normalized);

  const alias = raw.match(/^var\(\s*(--[a-z0-9-]+)\s*\)$/i);
  if (alias) return resolveToken(themes, theme, alias[1], nextSeen);

  const rgbAlias = raw.match(
    /^rgb\(\s*var\(\s*(--[a-z0-9-]+)\s*\)(?:\s*\/\s*(var\(\s*(--[a-z0-9-]+)\s*\)|[^)]+))?\s*\)$/i,
  );
  if (rgbAlias) {
    const base = resolveToken(themes, theme, rgbAlias[1], nextSeen);
    if (base.problem) return base;
    let alpha = 1;
    if (rgbAlias[2]) {
      if (rgbAlias[3]) {
        const scalar = resolveScalar(themes, theme, rgbAlias[3], new Set());
        if (scalar.problem) return scalar;
        alpha = scalar.value;
      } else {
        try {
          alpha = parseAlpha(rgbAlias[2]);
        } catch (error) {
          return { problem: `--${normalized}: ${error.message}` };
        }
      }
    }
    return { rgb: base.rgb, alpha: base.alpha * alpha };
  }

  try {
    return parseColor(raw);
  } catch (error) {
    return { problem: `--${normalized}: ${error.message}` };
  }
}

export function composite(foreground, background) {
  const foregroundAlpha = foreground.alpha ?? 1;
  const backgroundAlpha = background.alpha ?? 1;
  const alpha = foregroundAlpha + backgroundAlpha * (1 - foregroundAlpha);
  if (alpha === 0) return { rgb: [0, 0, 0], alpha: 0 };
  return {
    rgb: foreground.rgb.map(
      (channel, index) =>
        (channel * foregroundAlpha +
          background.rgb[index] * backgroundAlpha * (1 - foregroundAlpha)) /
        alpha,
    ),
    alpha,
  };
}

const relativeLuminance = (color) =>
  color.rgb
    .map(gammaToLinear)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);

export function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

const resolvePaint = (specification, themes, theme, fallbackUnderlay) => {
  if (!specification?.token) return { problem: "paint token が無い" };
  const resolved = resolveToken(themes, theme, specification.token);
  if (resolved.problem) return resolved;
  const color = {
    ...resolved,
    alpha: resolved.alpha * (specification.alpha ?? 1),
  };
  if (color.alpha >= 1) return color;
  const underlaySpecification = specification.underlay ?? fallbackUnderlay;
  if (!underlaySpecification) {
    return { problem: `${specification.token}: alpha 合成先が無い` };
  }
  const underlay = resolvePaint(
    typeof underlaySpecification === "string"
      ? { token: underlaySpecification }
      : underlaySpecification,
    themes,
    theme,
  );
  if (underlay.problem) return underlay;
  return composite(color, underlay);
};

export function evaluateCase(consumerCase, themes) {
  const problemDetails = [];
  const results = [];
  if (!consumerCase?.label) {
    problemDetails.push({ kind: "structure", message: "case label が空" });
  }
  if (!consumerCase?.reason?.trim()) {
    problemDetails.push({ kind: "structure", message: `${consumerCase?.label}: reason が空` });
  }
  if (!GATES.has(consumerCase?.gate)) {
    problemDetails.push({
      kind: "structure",
      message: `${consumerCase?.label}: gate が不正: ${consumerCase?.gate}`,
    });
  }
  const selectedThemes = consumerCase?.themes ?? ["light", "dark"];
  for (const theme of selectedThemes) {
    const background = resolvePaint(
      consumerCase.background,
      themes,
      theme,
      consumerCase.background?.underlay,
    );
    if (background.problem) {
      problemDetails.push({
        kind: "resolve",
        message: `${consumerCase.label} (${theme}): background ${background.problem}`,
      });
      continue;
    }
    const foreground = resolvePaint(
      consumerCase.foreground,
      themes,
      theme,
      consumerCase.background?.token,
    );
    if (foreground.problem) {
      problemDetails.push({
        kind: "resolve",
        message: `${consumerCase.label} (${theme}): foreground ${foreground.problem}`,
      });
      continue;
    }
    const ratio = contrastRatio(foreground, background);
    const threshold = GATES.get(consumerCase.gate);
    const passed = threshold === null || ratio >= threshold;
    const result = {
      label: consumerCase.label,
      theme,
      gate: consumerCase.gate,
      reason: consumerCase.reason,
      ratio,
      passed,
      risk: consumerCase.risk,
    };
    results.push(result);
    if (!passed) {
      problemDetails.push({
        kind: "threshold",
        risk: consumerCase.risk,
        message: `${consumerCase.label} (${theme}): ${ratio.toFixed(4)} < ${threshold}`,
      });
    }
  }
  return {
    results,
    problemDetails,
    problems: problemDetails.map((detail) => detail.message),
  };
}

export function extractClassTokens(source, path = "source.tsx") {
  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const tokens = new Set();
  const collect = (text) => {
    for (const token of text.split(/\s+/)) {
      if (token) tokens.add(token);
    }
  };
  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      collect(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return tokens;
}

const isSemanticAlphaUtility = (token) =>
  /(?:^|:)(?:bg|text|border|ring|stroke|fill)-[a-z][a-z0-9-]*\/[0-9]+$/.test(token);

export async function inspectSourceCoverage(root, consumerCases) {
  const problems = [];
  const componentRoot = join(root, "src/components/ui");
  let names;
  try {
    names = (await readdir(componentRoot)).filter((name) => name.endsWith(".tsx")).sort();
  } catch (error) {
    return { problems: [`component source を読めない: ${error.message}`] };
  }
  if (names.length === 0) return { problems: ["component source が 0 件"] };

  const tokensByPath = new Map();
  const actualAlpha = new Set();
  for (const name of names) {
    const path = `src/components/ui/${name}`;
    const tokens = extractClassTokens(await readFile(join(root, path), "utf8"), path);
    tokensByPath.set(path, tokens);
    for (const token of tokens) {
      if (isSemanticAlphaUtility(token)) actualAlpha.add(`${path}\0${token}`);
    }
  }

  const expected = new Set();
  for (const consumerCase of consumerCases) {
    for (const entry of consumerCase.sourceClasses ?? []) {
      const sourceTokens = tokensByPath.get(entry.source);
      if (!sourceTokens) {
        problems.push(`${consumerCase.label}: ${entry.source} が存在しない`);
        continue;
      }
      for (const className of entry.classes) {
        expected.add(`${entry.source}\0${className}`);
        if (!sourceTokens.has(className)) {
          problems.push(`${consumerCase.label}: ${entry.source} の ${className} が存在しない`);
        }
      }
    }
  }
  for (const actual of actualAlpha) {
    if (!expected.has(actual)) {
      const [path, className] = actual.split("\0");
      problems.push(`${path}: ${className} が consumer case で未分類`);
    }
  }
  return { problems, actualAlpha, expected };
}

const riskStatus = (markdown, risk) => {
  const escaped = risk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const heading = new RegExp(`^## ${escaped}:.*$`, "m").exec(markdown);
  if (!heading) return undefined;
  const afterHeading = markdown.slice(heading.index + heading[0].length);
  const nextHeading = afterHeading.search(/^## /m);
  const section = nextHeading === -1 ? afterHeading : afterHeading.slice(0, nextHeading);
  return section?.match(/^- status:\s*(\S+)\s*$/m)?.[1];
};

export function evaluateAcceptedRisks(results, markdown) {
  const problems = [];
  const accepted = [];
  const acceptedRiskIds = new Set();
  const grouped = new Map();
  for (const result of results) {
    if (!result.risk) continue;
    const entries = grouped.get(result.risk) ?? [];
    entries.push(result);
    grouped.set(result.risk, entries);
  }
  for (const [risk, entries] of grouped) {
    if (riskStatus(markdown, risk) !== "accepted") continue;
    if (entries.some((entry) => !entry.passed)) {
      acceptedRiskIds.add(risk);
      accepted.push(`${risk}: 現行 FAIL を accepted risk として受容`);
    } else {
      problems.push(`${risk}: PASS 後も accepted のままで stale`);
    }
  }
  return { problems, accepted, acceptedRiskIds };
}

export async function checkContrastInRepo(root, consumerCases = CONSUMER_CASES) {
  const problems = [];
  const cssPaths = ["src/styles/design-system/tokens.css", "src/styles/global.css"];
  const cssSources = [];
  let globalCss = "";
  for (const path of cssPaths) {
    const absolute = join(root, path);
    if (path.includes("design-system") && !existsSync(absolute)) continue;
    try {
      const source = await readFile(absolute, "utf8");
      cssSources.push(source);
      if (path === "src/styles/global.css") globalCss = source;
    } catch (error) {
      problems.push(`${path} を読めない: ${error.message}`);
    }
  }
  const themes = parseThemes(cssSources.join("\n"));
  problems.push(...themes.problems);
  if (globalCss) problems.push(...inspectThemeAliasParity(globalCss));

  problems.push(...inspectRequiredConsumerCases(consumerCases));
  const inspectedCases = consumerCases.map((consumerCase) => ({
    consumerCase,
    inspected: evaluateCase(consumerCase, themes),
  }));
  const results = inspectedCases.flatMap(({ inspected }) => inspected.results);
  let riskMarkdown = "";
  try {
    riskMarkdown = await readFile(join(root, ".docs/risk-registry.md"), "utf8");
  } catch (error) {
    problems.push(`risk registry を読めない: ${error.message}`);
  }
  const risks = evaluateAcceptedRisks(results, riskMarkdown);
  problems.push(...risks.problems);
  for (const { inspected } of inspectedCases) {
    for (const detail of inspected.problemDetails) {
      if (detail.kind === "threshold" && detail.risk && risks.acceptedRiskIds.has(detail.risk)) {
        continue;
      }
      problems.push(detail.message);
    }
  }
  const coverage = await inspectSourceCoverage(root, consumerCases);
  problems.push(...coverage.problems);
  return { problems, results, accepted: risks.accepted };
}

const runCli = async () => {
  const root = process.cwd();
  const inspected = await checkContrastInRepo(root);
  const acceptedLabels = new Set(inspected.accepted.map((entry) => entry.split(":")[0]));
  for (const result of inspected.results) {
    const status = result.passed
      ? "PASS"
      : result.risk && acceptedLabels.has(result.risk)
        ? "ACCEPTED"
        : "FAIL";
    console.log(
      `${status}\t${result.gate}\t${result.label} (${result.theme})\t${result.ratio.toFixed(4)}\t${result.reason}`,
    );
  }
  for (const entry of inspected.accepted) console.log(`ACCEPTED RISK\t${entry}`);
  if (inspected.problems.length) {
    console.error(`contrast 検査に失敗:\n  ${inspected.problems.join("\n  ")}`);
    process.exitCode = 1;
  } else {
    console.log("実利用配色 OK");
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
