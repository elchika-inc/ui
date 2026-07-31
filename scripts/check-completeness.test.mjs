import assert from "node:assert/strict";
import { test } from "node:test";
import { checkCompleteness } from "./check-completeness.mjs";

const complete = {
  components: ["button"],
  barrel: 'export { Button } from "./components/ui/button"',
  dts: "export type ButtonProps = unknown",
  registry: { items: [{ name: "button" }] },
  previewFiles: ["button.astro", "button-dark.astro"],
};

test("barrel export の欠落を検出する", () => {
  const { problems } = checkCompleteness({ ...complete, barrel: "" });
  assert.deepEqual(problems, ["button: src/index.ts から export されていない"]);
});

test("Props 型の欠落を検出する", () => {
  const { problems } = checkCompleteness({ ...complete, dts: "" });
  assert.deepEqual(problems, ["button: lib/index.d.ts に ButtonProps が無い"]);
});

test("registry item の欠落を検出する", () => {
  const { problems } = checkCompleteness({ ...complete, registry: { items: [] } });
  assert.deepEqual(problems, ["button: registry.json に item が無い"]);
});

test("プレビューの欠落を検出する", () => {
  const { problems } = checkCompleteness({ ...complete, previewFiles: ["button.astro"] });
  assert.deepEqual(problems, ["button: プレビュー button-dark.astro が無い"]);
});

test("4 経路が揃っていれば問題なし", () => {
  assert.deepEqual(checkCompleteness(complete).problems, []);
});
