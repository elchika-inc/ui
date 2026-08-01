import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { checkFile } from "./check-standards.mjs";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

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
  for (const cls of [
    "ring-red-500/[50%]",
    "ring-red-500/[.5]",
    "ring-ring/(--ring-alpha)",
    // 色側の変数短縮・任意値。色を [a-z0-9-]+ だけにすると見逃す
    "ring-(--brand)/50",
    "ring-[#f00]/50",
  ]) {
    const { violations } = checkFile("a.tsx", `className="focus-visible:${cls}"`);
    // **件数で判定しない。** `ring-[#f00]/50` のように 2 つの規定へ同時に
    // 違反するクラスがあり、そのとき 2 件出るのが正しい（任意値であり、かつ
    // 透明度合成でもある）。ここで見たいのは「focus-ring-opacity として
    // 検出されること」なので、rule の有無で判定する。
    assert.ok(
      violations.some((v) => v.rule === "focus-ring-opacity"),
      `${cls}: focus-ring-opacity として検出されない`,
    );
  }
});

test("テーマ修飾付きと focus-within の状態リングを検出する", () => {
  for (const cls of [
    "dark:focus-visible:ring-destructive/40",
    "focus-visible:dark:ring-destructive/40",
    "focus-within:ring-ring/50",
  ]) {
    const { violations } = checkFile("a.tsx", `className="${cls}"`);
    assert.ok(
      violations.some((v) => v.rule === "focus-ring-opacity"),
      `${cls}: focus-ring-opacity として検出されない`,
    );
  }
});

test("無条件の装飾リングはフォーカスリング違反にしない", () => {
  for (const cls of ["ring-foreground/10", "ring-border/20", "ring-[3px]"]) {
    const { violations } = checkFile("a.tsx", `className="${cls}"`);
    assert.deepEqual(violations, [], cls);
  }
});

test("2 規定へ同時に違反するクラスは 2 診断とも出す", () => {
  // ring-[#f00]/50 は任意値であり、かつ透明度合成でもある。
  // focus-ring-opacity だけを assert すると、ARBITRARY 側が
  // ring-[#f00] を検出しなくなる回帰を素通りさせる。両方を固定する。
  const { violations } = checkFile("a.tsx", `className="focus-visible:ring-[#f00]/50"`);
  const rules = new Set(violations.map((v) => v.rule));
  assert.ok(rules.has("focus-ring-opacity"), "focus-ring-opacity が無い");
  assert.ok(rules.has("arbitrary-value"), "arbitrary-value が無い");
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

test("真のときだけ存在させる data-inset に boolean を直接渡す実装を検出する", () => {
  const { violations } = checkFile("a.tsx", `data-inset={inset}`);
  assert.deepEqual(violations, [
    { rule: "boolean-data-inset", line: 1, text: "data-inset={inset}" },
  ]);
});

test("data-inset の false と undefined を属性なしへ正規化する実装を受理する", () => {
  const { violations } = checkFile("a.tsx", `data-inset={inset ? "" : undefined}`);
  assert.deepEqual(violations, []);
});

test("Context Menu preview のtriggerはkeyboard focusとcontextmenu keyを受けられる", () => {
  const source = readSource("src/previews/context-menu.tsx");
  assert.match(source, /<ContextMenuTrigger[\s\S]*?render=\{<button type="button" \/>\}/);
  assert.match(source, /<ContextMenuTrigger[\s\S]*?focus-visible:ring-3 focus-visible:ring-ring/);
});

test("Navigation Menu contentは子linkのfocus ringを打ち消さない", () => {
  const source = readSource("src/components/ui/navigation-menu.tsx");
  assert.doesNotMatch(source, /\*\*:data-\[slot=navigation-menu-link\]:focus:ring-0/);
  assert.doesNotMatch(source, /\*\*:data-\[slot=navigation-menu-link\]:focus:outline-none/);
});

test("Select itemはkeyboard focusを不透明3px ringで示す", () => {
  const source = readSource("src/components/ui/select.tsx");
  const start = source.indexOf("function SelectItem(");
  const end = source.indexOf("function SelectScrollUpButton(");
  assert.notEqual(start, -1, "SelectItemが存在しない");
  assert.notEqual(end, -1, "SelectItemの終端が見つからない");
  const selectItem = source.slice(start, end);
  assert.match(selectItem, /focus-visible:ring-3 focus-visible:ring-ring/);
});
