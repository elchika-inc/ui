import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  directInstallCommand,
  MCP_INIT_COMMAND,
  NAMESPACE_REGISTRY_CONFIG,
  namespaceInstallCommand,
} from "../src/site/installation.mjs";

test("直接URLのinstall commandを生成する", () => {
  assert.equal(
    directInstallCommand("button"),
    "npx shadcn@latest add https://ui.elchika.dev/r/button.json",
  );
});

test("名前空間の設定とinstall commandを生成する", () => {
  assert.deepEqual(JSON.parse(NAMESPACE_REGISTRY_CONFIG), {
    registries: {
      "@elchika": "https://ui.elchika.dev/r/{name}.json",
    },
  });
  assert.equal(namespaceInstallCommand("button"), "npx shadcn@latest add @elchika/button");
});

test("shadcn同梱MCPの初期化commandを公開する", () => {
  assert.equal(MCP_INIT_COMMAND, "npx shadcn@latest mcp init --client claude");
});

test("component名にpathを混入できない", () => {
  assert.throws(() => directInstallCommand("../button"), /component名が不正/);
  assert.throws(() => namespaceInstallCommand("button.json"), /component名が不正/);
});

test("READMEが3経路とtoken alias再削除を案内する", () => {
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

  assert.match(readme, /npx shadcn@latest add https:\/\/ui\.elchika\.dev\/r\/button\.json/);
  assert.match(readme, /npx shadcn@latest add @elchika\/button/);
  assert.match(readme, /npx shadcn@latest mcp init --client claude/);
  assert.match(readme, /add のたびに[\s\S]*再削除/);
});

test("Phase B手順が秘密登録・deploy・domain・実体検証を分離する", () => {
  const instructions = readFileSync(
    new URL("../.docs/actions/manual-subproject-3-domain.md", import.meta.url),
    "utf8",
  );

  for (const required of [
    "CLOUDFLARE_API_TOKEN",
    "CLOUDFLARE_ACCOUNT_ID",
    "workflow_dispatch",
    "Settings > Domains & Routes > Add > Custom Domain",
    "https://ui.elchika.dev/r/index.json",
    "application/json",
    "jq -e",
  ]) {
    assert.match(instructions, new RegExp(required.replaceAll(".", "\\.")), required);
  }
});
