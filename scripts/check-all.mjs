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
export const PRE_FLIGHT_CHECKS = CHECKS.filter((check) => check.name !== "evidence");

export function selectChecksForArgv(argv) {
  if (argv.includes("--pre")) {
    return { checks: PRE_FLIGHT_CHECKS, prefix: "check:pre" };
  }
  return { checks: CHECKS, prefix: "check:all" };
}

export function runChecks(checks = CHECKS, runner = spawnSync, prefix = "check:all") {
  for (const check of checks) {
    console.log(`[${prefix}] ${check.name}`);
    const result = runner(check.command, check.args, { stdio: "inherit" });
    if (result.status !== 0) {
      throw new Error(`${check.name}: exit ${result.status ?? "unknown"}`);
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { checks, prefix } = selectChecksForArgv(process.argv.slice(2));
    runChecks(checks, spawnSync, prefix);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
