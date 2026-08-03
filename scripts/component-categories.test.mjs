import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { test } from "node:test";

import {
  categorizePreviewItems,
  checkComponentCategories,
  componentCategories,
} from "../src/catalog/component-categories.mjs";

const previewNames = readdirSync(new URL("../src/previews", import.meta.url))
  .filter((name) => name.endsWith(".tsx"))
  .map((name) => name.replace(/\.tsx$/, ""))
  .sort();

test("実在する preview が一つのカテゴリへ漏れなく分類される", () => {
  assert.ok(previewNames.length > 0, "preview が0件なら分類を検証できない");
  assert.deepEqual(checkComponentCategories(previewNames), []);
});

test("未分類の preview があれば停止する", () => {
  assert.deepEqual(
    checkComponentCategories(["button", "input"], [{ name: "アクション", items: ["button"] }]),
    ["未分類: input"],
  );
});

test("同じ preview が複数カテゴリにあれば停止する", () => {
  assert.deepEqual(
    checkComponentCategories(
      ["button"],
      [
        { name: "アクション", items: ["button"] },
        { name: "フォーム", items: ["button"] },
      ],
    ),
    ["重複分類: button (アクション, フォーム)"],
  );
});

test("実在しない preview を分類していれば停止する", () => {
  assert.deepEqual(
    checkComponentCategories(["button"], [{ name: "アクション", items: ["button", "unknown"] }]),
    ["存在しない preview: unknown"],
  );
});

test("preview item をカテゴリ順へまとめる", () => {
  const previewItems = [
    { name: "input", title: "Input" },
    { name: "button", title: "Button" },
  ];
  const categories = [
    { name: "アクション", items: ["button"] },
    { name: "フォーム", items: ["input"] },
  ];

  assert.deepEqual(categorizePreviewItems(previewItems, categories), [
    { name: "アクション", items: [{ name: "button", title: "Button" }] },
    { name: "フォーム", items: [{ name: "input", title: "Input" }] },
  ]);
});

test("分類と preview item の集合が違えばまとめず停止する", () => {
  assert.throws(
    () => categorizePreviewItems([{ name: "button" }], componentCategories.slice(0, 1)),
    /component category が不正/,
  );
});
