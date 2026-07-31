import assert from "node:assert/strict";
import { test } from "node:test";
import { checkCompleteness } from "./check-completeness.mjs";

const complete = {
  components: ["button"],
  barrel: 'export { Button } from "./components/ui/button"',
  dts: "export type ButtonProps = unknown",
  registry: { items: [{ name: "button" }] },
  previewFiles: ["button.astro", "button-dark.astro"],
  previewSources: ["button.tsx"],
  provenance: {
    components: {
      button: {
        sourceUrl: "https://example.com/button.tsx",
        upstreamPath: "apps/v4/registry/bases/base/ui/button.tsx",
        upstreamPathSha: "0123456789abcdef0123456789abcdef01234567",
        registry: "https://ui.shadcn.com",
        registryUrl: "https://ui.shadcn.com/r/styles/base-nova/button.json",
        registryContentSha256: "a".repeat(64),
        normalizedContentSha256: "b".repeat(64),
        shadcnCliVersion: "4.16.0",
        fetchedAt: "2026-07-31",
        license: "MIT",
      },
    },
  },
};

test("barrel export の欠落を検出する", () => {
  const { problems } = checkCompleteness({ ...complete, barrel: "" });
  assert.deepEqual(problems, ["button: src/index.ts から export されていない"]);
});

test("Props 型の欠落を検出する", () => {
  const { problems } = checkCompleteness({ ...complete, dts: "" });
  assert.deepEqual(problems, ["button: lib/index.d.ts に ButtonProps が無い"]);
});

test("registry item の欠落を検出する", () => {
  const { problems } = checkCompleteness({ ...complete, registry: { items: [] } });
  assert.deepEqual(problems, ["button: registry.json に item が無い"]);
});

test("プレビューの欠落を検出する", () => {
  const { problems } = checkCompleteness({ ...complete, previewFiles: ["button.astro"] });
  assert.deepEqual(problems, ["button: プレビュー button-dark.astro が無い"]);
});

test("プレビュー実装の欠落を検出する", () => {
  const { problems } = checkCompleteness({ ...complete, previewSources: [] });
  assert.deepEqual(problems, ["button: src/previews/button.tsx が無い"]);
});

test("来歴の欠落を検出する", () => {
  const { problems } = checkCompleteness({ ...complete, provenance: { components: {} } });
  assert.deepEqual(problems, ["button: provenance.json に来歴が無い"]);
});

test("来歴の必須キーが空なら検出する", () => {
  for (const key of [
    "sourceUrl",
    "upstreamPath",
    "upstreamPathSha",
    "registry",
    "registryUrl",
    "registryContentSha256",
    "normalizedContentSha256",
    "shadcnCliVersion",
    "fetchedAt",
    "license",
  ]) {
    const provenance = structuredClone(complete.provenance);
    provenance.components.button[key] = "";
    const { problems } = checkCompleteness({ ...complete, provenance });
    assert.deepEqual(problems, [`button: provenance の ${key} が無い`]);
  }
});

test("来歴の全キーが x なら形式違反を検出する", () => {
  const provenance = structuredClone(complete.provenance);
  for (const key of Object.keys(provenance.components.button)) {
    provenance.components.button[key] = "x";
  }
  const { problems } = checkCompleteness({ ...complete, provenance });
  assert.notDeepEqual(problems, []);
});

test("shadcn CLI の版は SemVer 2.0.0 の境界に従う", () => {
  const valid = [
    "4.16.0",
    "4.16.0-beta.1",
    "4.16.0-alpha-beta",
    "4.16.0+build-meta",
    "1.0.0-rc.1+exp.sha.5114f85",
  ];
  const invalid = ["4.16.0garbage", "4.16.0+bad_meta", "4.16.0-..", "4.16", "^4.16.0", "x"];
  for (const version of valid) {
    const provenance = structuredClone(complete.provenance);
    provenance.components.button.shadcnCliVersion = version;
    assert.deepEqual(checkCompleteness({ ...complete, provenance }).problems, [], version);
  }
  for (const version of invalid) {
    const provenance = structuredClone(complete.provenance);
    provenance.components.button.shadcnCliVersion = version;
    const { problems } = checkCompleteness({ ...complete, provenance });
    assert.ok(
      problems.some((problem) => problem.includes("shadcnCliVersion")),
      version,
    );
  }
});

test("5 経路が揃っていれば問題なし", () => {
  assert.deepEqual(checkCompleteness(complete).problems, []);
});
