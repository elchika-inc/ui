import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { listBlockFiles, scanBlockNames } from "./block-scan.mjs";

const createBlocksRoot = () => mkdtempSync(join(tmpdir(), "elchika-block-scan-test-"));

test("block ディレクトリが無ければ空配列を返す", () => {
  const root = createBlocksRoot();
  assert.deepEqual(scanBlockNames(join(root, "src/blocks")), []);
});

test("ディスクのディレクトリを block 名として返す", (t) => {
  const root = createBlocksRoot();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "login-01"), { recursive: true });
  mkdirSync(join(root, "signup-01"), { recursive: true });
  assert.deepEqual(scanBlockNames(root), ["login-01", "signup-01"]);
});

test("ディレクトリ直下のファイルを block として数えない", (t) => {
  const root = createBlocksRoot();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "login-01"), { recursive: true });
  writeFileSync(join(root, "README.md"), "not a block\n");
  assert.deepEqual(scanBlockNames(root), ["login-01"]);
});

// ディスク単独にすると、台帳に載っているのに実体が消えた block が走査対象から
// 黙って外れ、「0 件の block が全経路に載っている」と実態より強い主張が残る。
test("ディスクに実体が無くても来歴に載っていれば走査対象に含める", (t) => {
  const root = createBlocksRoot();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(scanBlockNames(root, { blocks: { "login-01": {} } }), ["login-01"]);
});

test("ディスクと来歴の和集合を重複なく返す", (t) => {
  const root = createBlocksRoot();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "login-01"), { recursive: true });
  mkdirSync(join(root, "signup-01"), { recursive: true });
  assert.deepEqual(scanBlockNames(root, { blocks: { "login-01": {}, "sidebar-01": {} } }), [
    "login-01",
    "sidebar-01",
    "signup-01",
  ]);
});

test("block レーン導入前は両方の走査根が空でも壊れない", (t) => {
  const root = createBlocksRoot();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(scanBlockNames(join(root, "missing"), { components: {} }), []);
});

test("block 配下の実ファイルを再帰列挙する", (t) => {
  const root = createBlocksRoot();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "login-01/components"), { recursive: true });
  writeFileSync(join(root, "login-01/components/login-form.tsx"), "export {}\n");
  writeFileSync(join(root, "login-01/data.json"), "{}\n");
  assert.deepEqual(listBlockFiles(root, "login-01"), [
    "src/blocks/login-01/components/login-form.tsx",
    "src/blocks/login-01/data.json",
  ]);
});

test("実体の無い block の列挙は空配列を返す", (t) => {
  const root = createBlocksRoot();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(listBlockFiles(root, "login-01"), []);
});
