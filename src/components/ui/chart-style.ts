const CHART_KEY = /^[a-z0-9_-]+$/i;
const HEX_COLOR = /^#[0-9a-f]{3}(?:[0-9a-f]{1}|[0-9a-f]{3}|[0-9a-f]{5})?$/i;
const COLOR_KEYWORD = /^[a-z][a-z-]*$/i;
const COLOR_FUNCTIONS = new Set([
  "color",
  "color-mix",
  "device-cmyk",
  "hsl",
  "hsla",
  "hwb",
  "lab",
  "lch",
  "light-dark",
  "oklab",
  "oklch",
  "rgb",
  "rgba",
  "var",
]);
const COLOR_CHARACTERS = /^[a-z0-9_#(),.%+*/\s-]+$/i;
const UNSAFE_COLOR_SYNTAX = /[;{}\\'"@]|\burl\s*\(/i;

function hasControlCharacter(value: string) {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f);
  });
}

function hasBalancedParentheses(value: string) {
  let depth = 0;
  for (const character of value) {
    if (character === "(") depth++;
    if (character === ")") depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function isCssColor(value: string) {
  if (HEX_COLOR.test(value) || COLOR_KEYWORD.test(value)) return true;
  const functionName = value.match(/^([a-z][a-z-]*)\(/i)?.[1]?.toLowerCase();
  return Boolean(
    functionName &&
      COLOR_FUNCTIONS.has(functionName) &&
      value.endsWith(")") &&
      COLOR_CHARACTERS.test(value) &&
      hasBalancedParentheses(value),
  );
}

export function serializeChartVariable(key: string, color: string) {
  if (!CHART_KEY.test(key)) {
    throw new Error("ChartConfigのkeyがCSS custom property名として不正です");
  }
  const normalizedColor = color.trim();
  if (
    hasControlCharacter(normalizedColor) ||
    UNSAFE_COLOR_SYNTAX.test(normalizedColor) ||
    !isCssColor(normalizedColor)
  ) {
    throw new Error("ChartConfigのcolorがCSS colorとして不正です");
  }
  return `  --color-${key}: ${normalizedColor};`;
}
