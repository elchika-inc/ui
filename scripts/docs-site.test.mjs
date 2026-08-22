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

test("READMEのblock手順はregistry dependencies用のnamespace設定を前提にする", () => {
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
  const blockSection = readme.slice(readme.indexOf("### block"));
  const firstAddCommand = blockSection.indexOf("npx shadcn@4.16.0 add");
  const prerequisite = blockSection.slice(0, firstAddCommand);

  assert.ok(firstAddCommand > 0, "block add command がある");
  assert.match(prerequisite, /registryDependencies/);
  assert.match(prerequisite, /components\.json/);
  assert.match(prerequisite, /registries/);
  assert.match(prerequisite, /@elchika 名前空間/);
  assert.match(prerequisite, /先に/);
});

test("Phase B手順が秘密登録・deploy・domain・実体検証を分離する", () => {
  const instructions = readFileSync(
    new URL("../.docs/actions/done/2026-08-15-manual-subproject-3-domain.md", import.meta.url),
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

test("Phase 3 の DoneCriteria は変動件数でなく完全性述語を要求する", () => {
  const design = readFileSync(
    new URL("../.docs/plans/2026-08-17-registry-blocks-design.md", import.meta.url),
    "utf8",
  );
  const doneCriteria = design.slice(design.indexOf("## 7. DoneCriteria"));
  const provenanceCriterion = doneCriteria.slice(
    doneCriteria.indexOf("2. "),
    doneCriteria.indexOf("3. "),
  );

  assert.doesNotMatch(provenanceCriterion, /76 件|27 件|103 ファイル/);
  assert.match(provenanceCriterion, /上流から受け取った全 file/);
  assert.match(provenanceCriterion, /`files\[\]` に一度だけ/);
  assert.match(provenanceCriterion, /generatedContentSha256/);
  assert.match(provenanceCriterion, /dropped: true/);
});

test("dashboard-table の実ブラウザ基準は明示ボタンと DnD 不在を実測する", () => {
  const plan = readFileSync(
    new URL("../.docs/plans/2026-08-17-registry-blocks-plan.md", import.meta.url),
    "utf8",
  );
  const task8 = plan.slice(plan.indexOf("## Task 8:"), plan.indexOf("## Task 9:"));
  const step9 = task8.slice(task8.indexOf("- [ ] **Step 9:"), task8.indexOf("- [ ] **Step 10:"));

  assert.doesNotMatch(step9, /行クリック/);
  assert.match(step9, /accessible name/);
  assert.match(step9, /Document button/);
  assert.match(step9, /行自体は操作対象にしない/);
  assert.match(step9, /依存・import/);
  assert.match(step9, /handler/);
  assert.match(step9, /affordance/);
  assert.match(step9, /実ブラウザ/);
});

test("Task 7 は依存ゼロの3境界と registry:file 所有衝突を区別する", () => {
  const plan = readFileSync(
    new URL("../.docs/plans/2026-08-17-registry-blocks-plan.md", import.meta.url),
    "utf8",
  );
  const task7 = plan.slice(plan.indexOf("## Task 7:"), plan.indexOf("## Task 8:"));

  assert.match(task7, /repo dependency delta/);
  assert.match(task7, /配布 item の npm `dependencies`/);
  assert.match(task7, /配布 item の `registryDependencies`/);
  assert.match(task7, /明示的な追加除外/);
  assert.match(task7, /local registry graph/);
  assert.match(task7, /解決不能.*fail-closed/);
  assert.match(task7, /exact `\(path, target\)` pair/);
  assert.match(task7, /共有 file の target.*衝突.*fail-closed/);
});

test("dashboard-table の sort 基準は数値と非数値の全順序を定義する", () => {
  const plan = readFileSync(
    new URL("../.docs/plans/2026-08-17-registry-blocks-plan.md", import.meta.url),
    "utf8",
  );
  const task8 = plan.slice(plan.indexOf("## Task 8:"), plan.indexOf("## Task 9:"));
  const step9 = task8.slice(task8.indexOf("- [ ] **Step 9:"));

  assert.match(step9, /有限数値文字列/);
  assert.match(step9, /固定 bucket/);
  assert.match(step9, /非数値.*localeCompare/);
  assert.match(step9, /全 permutation/);
  assert.match(step9, /昇順・降順/);
});
