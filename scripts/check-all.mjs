// ローカルで全checkerを1コマンド実行する。CIは失敗箇所を特定できるよう個別stepを保つ。
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const CHECKS = [
  { name: "standards", command: process.execPath, args: ["scripts/check-standards.mjs"] },
  { name: "completeness", command: process.execPath, args: ["scripts/check-completeness.mjs"] },
  { name: "distribution", command: process.execPath, args: ["scripts/check-distribution.mjs"] },
  { name: "preview render", command: process.execPath, args: ["scripts/check-preview-render.mjs"] },
  { name: "evidence", command: process.execPath, args: ["scripts/check-evidence.mjs"] },
];

export function runChecks(checks = CHECKS, runner = spawnSync) {
  for (const check of checks) {
    console.log(`[check:all] ${check.name}`);
    const result = runner(check.command, check.args, { stdio: "inherit" });
    if (result.status !== 0) {
      throw new Error(`${check.name}: exit ${result.status ?? "unknown"}`);
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runChecks();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
