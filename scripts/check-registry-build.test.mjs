import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { findMissingRegistryItems } from "./check-registry-build.mjs";

const scriptPath = fileURLToPath(new URL("./check-registry-build.mjs", import.meta.url));

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

test("CLI は生成物の充足を exit code と実 item 名で通知する", (t) => {
  const root = mkdtempSync(join(tmpdir(), "elchika-registry-build-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "public/r"), { recursive: true });
  writeFileSync(
    join(root, "registry.json"),
    `${JSON.stringify({ items: [{ name: "button" }, { name: "dashboard-01" }] })}\n`,
  );
  writeFileSync(join(root, "public/r/button.json"), "{}\n");
  writeFileSync(join(root, "public/r/dashboard-01.json"), "{}\n");
  writeFileSync(join(root, "public/r/index.json"), "{}\n");

  const complete = spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: "utf8" });
  assert.equal(complete.status, 0, complete.stderr);
  assert.match(complete.stdout, /全 item が public\/r に生成されている/);

  rmSync(join(root, "public/r/dashboard-01.json"));
  const missing = spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: "utf8" });
  assert.equal(missing.status, 1);
  assert.match(missing.stdout, /未生成: dashboard-01/);
});
