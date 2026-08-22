import assert from "node:assert/strict";
import { test } from "node:test";
import { findMissingRegistryItems } from "./check-registry-build.mjs";

test("registry item がすべて生成済みなら余分な JSON があっても問題なし", () => {
  const registry = {
    items: [{ name: "button" }, { name: "login-01" }],
  };

  assert.deepEqual(
    findMissingRegistryItems(registry, ["button.json", "login-01.json", "index.json"]),
    [],
  );
});

test("registry item に対応する生成物が無ければ item 名を返す", () => {
  const registry = {
    items: [{ name: "button" }, { name: "dashboard-01" }, { name: "dashboard-table" }],
  };

  assert.deepEqual(findMissingRegistryItems(registry, ["button.json", "dashboard-table.json"]), [
    "dashboard-01",
  ]);
});
