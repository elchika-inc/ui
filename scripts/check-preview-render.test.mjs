import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

const checkerPath = new URL("./check-preview-render.mjs", import.meta.url);

test("selector 宣言が無いコンポーネントを検出する", async () => {
  assert.ok(existsSync(checkerPath), "check-preview-render.mjs がまだ無い");
  const { checkPreviewRender } = await import(checkerPath);

  assert.deepEqual(checkPreviewRender(["button", "dialog"], { button: "[data-slot=button]" }), {
    problems: ["dialog: preview selector の宣言が無い"],
  });
});

test("空または文字列でない selector を検出する", async () => {
  assert.ok(existsSync(checkerPath), "check-preview-render.mjs がまだ無い");
  const { checkPreviewRender } = await import(checkerPath);

  assert.deepEqual(
    checkPreviewRender(["button", "dialog"], { button: "  ", dialog: ["[role=dialog]"] }),
    {
      problems: ["button: preview selector が空", "dialog: preview selector は文字列で宣言する"],
    },
  );
});

test("全コンポーネントに selector があれば問題なし", async () => {
  assert.ok(existsSync(checkerPath), "check-preview-render.mjs がまだ無い");
  const { checkPreviewRender } = await import(checkerPath);

  assert.deepEqual(
    checkPreviewRender(["button", "dialog"], {
      button: '[data-slot="button"]',
      dialog: '[data-slot="dialog-content"]',
    }),
    { problems: [] },
  );
});

test("catalog 2 route も selector の必須対象に含める", async () => {
  assert.ok(existsSync(checkerPath), "check-preview-render.mjs がまだ無い");
  const { requiredPreviewNames } = await import(checkerPath);

  assert.deepEqual(requiredPreviewNames(["badge", "button"]), [
    "badge",
    "button",
    "catalog",
    "catalog-dark",
  ]);
});
