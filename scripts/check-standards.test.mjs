import assert from "node:assert/strict";
import { test } from "node:test";
import { checkFile } from "./check-standards.mjs";

test("透明度を合成したフォーカスリングを検出する", () => {
  const { violations } = checkFile(
    "a.tsx",
    `className="focus-visible:ring-3 focus-visible:ring-ring/50"`,
  );
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, "focus-ring-opacity");
});

test("色名に数字を含むリングも検出する", () => {
  const { violations } = checkFile("a.tsx", `className="focus-visible:ring-red-500/50"`);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, "focus-ring-opacity");
});

test("角括弧・丸括弧の不透明度指定も検出する", () => {
  for (const cls of ["ring-red-500/[50%]", "ring-red-500/[.5]", "ring-ring/(--ring-alpha)"]) {
    const { violations } = checkFile("a.tsx", `className="focus-visible:${cls}"`);
    assert.equal(violations.length, 1, cls);
    assert.equal(violations[0].rule, "focus-ring-opacity", cls);
  }
});

test("許可済み例外の ring-[3px] は違反にしない", () => {
  const { violations } = checkFile(
    "a.tsx",
    `className="focus-visible:ring-[3px] focus-visible:ring-ring"`,
  );
  assert.deepEqual(violations, []);
});

test("値系ユーティリティの arbitrary value を検出する", () => {
  const { violations } = checkFile("a.tsx", `className="rounded-[min(var(--radius-md),10px)]"`);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, "arbitrary-value");
});

test("値系ユーティリティなら bg と text も検出する", () => {
  const src = `className="bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] text-[0.8rem]"`;
  const { violations } = checkFile("a.tsx", src);
  assert.equal(violations.length, 2);
});

// ここから 4 件は「正当な Tailwind の variant 構文」であり違反ではない。
// AUDIT.md の arbitrary value 検査は「値系ユーティリティのみ対象。
// data-[...] / aria-[...] 等の variant 構文は正当なので除外」と定めている。
// 素朴な /\b[a-z-]+-\[[^\]]+\]/ はこれらを誤検知し、実行者が
// Base UI の状態スタイルを推測で削る誤実装へ誘導する。
test("has-data- の variant 構文は違反にしない", () => {
  const { violations } = checkFile("a.tsx", `className="has-data-[icon=inline-end]:pr-1.5"`);
  assert.deepEqual(violations, []);
});

test("in-data- の variant 構文は違反にしない", () => {
  const { violations } = checkFile("a.tsx", `className="in-data-[slot=button-group]:rounded-lg"`);
  assert.deepEqual(violations, []);
});

test("not-aria- の variant 構文は違反にしない", () => {
  const { violations } = checkFile(
    "a.tsx",
    `className="active:not-aria-[haspopup]:translate-y-px"`,
  );
  assert.deepEqual(violations, []);
});

test("任意セレクタの variant 構文は違反にしない", () => {
  const { violations } = checkFile("a.tsx", `className="[&_svg]:pointer-events-none"`);
  assert.deepEqual(violations, []);
});

test("dark variant の宣言は違反にしない", () => {
  const { violations } = checkFile("a.css", `@custom-variant dark (&:is(.dark *));`);
  assert.deepEqual(violations, []);
});
