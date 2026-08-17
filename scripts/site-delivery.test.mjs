import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

test("Workers Assetsがdistの静的ページをfallback無しで配信する", () => {
  const configPath = join(root, "wrangler.jsonc");
  assert.ok(existsSync(configPath), "wrangler.jsoncがまだ無い");
  const config = JSON.parse(readFileSync(configPath, "utf8"));

  assert.equal(config.assets?.directory, "./dist");
  assert.equal(config.assets?.not_found_handling, "none");
  assert.equal(config.main, undefined, "静的配信だけなのでWorker scriptを置かない");
  assert.equal(config.site, undefined, "legacy site設定を使わない");
});

test("deploy workflowがmain pushと手動実行で型検査・テスト・build後にWranglerを実行する", () => {
  const workflowPath = join(root, ".github/workflows/deploy.yml");
  assert.ok(existsSync(workflowPath), "deploy.ymlがまだ無い");
  const workflow = readFileSync(workflowPath, "utf8");

  assert.match(workflow, /push:\s*\n\s+branches:\s*\[main\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /CLOUDFLARE_ACCOUNT_ID:\s*\$\{\{ secrets\.CLOUDFLARE_ACCOUNT_ID \}\}/);
  assert.match(workflow, /CLOUDFLARE_API_TOKEN:\s*\$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}/);
  // DOCS_OPS §6 のジョブ構成（main push = 型検査 → ユニットテスト → build → deploy）を
  // 順序ごと検査する。ステップの存在だけを見ると、型検査が build の後ろへ回った状態を
  // 検出できない（§6 は型検査を build より前に置くことを MUST としている）。
  assert.match(
    workflow,
    /run: npm ci[\s\S]*run: npm run typecheck[\s\S]*node --test "scripts\/\*\.test\.mjs"[\s\S]*run: npm run build[\s\S]*run: npx wrangler deploy/,
  );
});

test("Wranglerのローカル状態をversion管理へ入れない", () => {
  assert.equal(
    execFileSync("git", ["check-ignore", ".wrangler/"], { cwd: root, encoding: "utf8" }).trim(),
    ".wrangler/",
  );
});
