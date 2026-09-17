import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const globalCss = readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8");
const tokensCss = readFileSync(
  new URL("../src/styles/design-system/tokens.css", import.meta.url),
  "utf8",
);

// spec §1.1 のサイズ別行間。正本のサイズ値とは別の、utility への割り当てを固定する。
const lineHeights = {
  "3xs": "1.5",
  "2xs": "1.5",
  xs: "1.5",
  sm: "1.5",
  base: "1.75",
  lg: "1.9",
  xl: "1.35",
  "2xl": "1.35",
  "3xl": "1.35",
  "4xl": "1.35",
  "5xl": "1.35",
  "6xl": "1.35",
};

function declarations(block) {
  const values = new Map();
  for (const [, name, value] of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    if (!values.has(name)) values.set(name, value.trim());
  }
  return values;
}

function typographyTheme(css) {
  const blocks = [...css.matchAll(/@theme\s*\{([^}]+)\}/g)];
  assert.equal(blocks.length, 1, "非 inline の @theme は1ブロックであること");
  return blocks[0][1];
}

function typographyValues(block) {
  return new Map(
    [...declarations(block)].filter(
      ([name]) => /^(text|leading|tracking)-/.test(name) && !name.endsWith("--line-height"),
    ),
  );
}

function assertMatchesTokens(css) {
  const root = tokensCss.match(/:root\s*\{([^}]+)\}/);
  assert.ok(root, "tokens.css の :root が存在すること");
  const expected = typographyValues(root[1]);
  const actual = typographyValues(typographyTheme(css));
  assert.deepEqual([...actual.keys()].sort(), [...expected.keys()].sort());
  for (const [name, value] of expected) {
    assert.equal(actual.get(name), value, `--${name} は tokens.css の最初の定義と一致すること`);
  }
}

test("組版トークンは tokens.css の :root の全定義と文字列一致する", () => {
  assertMatchesTokens(globalCss);
});

test("サイズ別行間は spec §1.1 の割り当てと一致する", () => {
  const actual = [...declarations(typographyTheme(globalCss))].filter(([name]) =>
    name.endsWith("--line-height"),
  );
  const expected = Object.entries(lineHeights).map(([size, value]) => [
    `text-${size}--line-height`,
    value,
  ]);
  assert.deepEqual(actual, expected);
});

test("サイズと行間の既定値を解除し、移行中の字間 utility は残す", () => {
  const theme = typographyTheme(globalCss);
  assert.match(theme, /--text-\*:\s*initial;/);
  assert.match(theme, /--leading-\*:\s*initial;/);
  assert.doesNotMatch(theme, /--tracking-\*:/);
  assert.doesNotMatch(globalCss, /--text-(?:[7-9]|\d{2,})xl\b|--leading-loose\b/);
});

test("font-heading は palt を有効にする", () => {
  assert.match(
    globalCss,
    /--font-heading:\s*var\(--font-display\);\s*(?:\/\*[\s\S]*?\*\/\s*)?--font-heading--font-feature-settings:\s*"palt" 1;/,
  );
});

test("陽性対照: leading-normal を Tailwind 既定値へ戻すと突合が失敗する", () => {
  const mutated = globalCss.replace("--leading-normal: 1.75;", "--leading-normal: 1.5;");
  assert.notEqual(mutated, globalCss, "陽性対照の置換が実行されたこと");
  assert.throws(() => assertMatchesTokens(mutated), /--leading-normal/);
});

test("陽性対照: 組版トークンが欠落すると突合が失敗する", () => {
  const mutated = globalCss.replace("--text-3xs: 0.6875rem;", "");
  assert.notEqual(mutated, globalCss, "陽性対照の削除が実行されたこと");
  assert.throws(() => assertMatchesTokens(mutated), { code: "ERR_ASSERTION" });
});
