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

test("object の selector 宣言を受理する", async () => {
  assert.ok(existsSync(checkerPath), "check-preview-render.mjs がまだ無い");
  const { checkPreviewRender } = await import(checkerPath);

  assert.deepEqual(
    checkPreviewRender(["context-menu"], {
      "context-menu": {
        selector: '[data-slot="context-menu-content"]',
        setup: {
          action: "contextmenu",
          target: '[data-slot="context-menu-trigger"]',
          position: "center",
        },
      },
    }),
    { problems: [] },
  );
});

test("空または selector が無い object を検出する", async () => {
  assert.ok(existsSync(checkerPath), "check-preview-render.mjs がまだ無い");
  const { checkPreviewRender } = await import(checkerPath);

  assert.deepEqual(
    checkPreviewRender(["button", "dialog"], { button: { selector: "  " }, dialog: {} }),
    {
      problems: ["button: preview selector が空", "dialog: preview selector が無い"],
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

test("requiredPreviewNames は block を含める", async () => {
  assert.ok(existsSync(checkerPath), "check-preview-render.mjs がまだ無い");
  const { requiredPreviewNames } = await import(checkerPath);

  assert.deepEqual(requiredPreviewNames(["button"], ["login-01"]), [
    "button",
    "login-01",
    "catalog",
    "catalog-dark",
  ]);
});

test("requiredPreviewNames は block 省略時に既存の並びを保つ", async () => {
  assert.ok(existsSync(checkerPath), "check-preview-render.mjs がまだ無い");
  const { requiredPreviewNames } = await import(checkerPath);

  assert.deepEqual(requiredPreviewNames(["button"]), ["button", "catalog", "catalog-dark"]);
});

test("block の selector 宣言欠落を検出する", async () => {
  assert.ok(existsSync(checkerPath), "check-preview-render.mjs がまだ無い");
  const { checkPreviewRender, requiredPreviewNames } = await import(checkerPath);

  const { problems } = checkPreviewRender(requiredPreviewNames(["button"], ["login-01"]), {
    button: '[data-slot="button"]',
    catalog: '[data-slot="catalog"]',
    "catalog-dark": '[data-slot="catalog"]',
  });
  assert.deepEqual(problems, ["login-01: preview selector の宣言が無い"]);
});
