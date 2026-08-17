import assert from "node:assert/strict";
import { test } from "node:test";
import { checkCompleteness } from "./check-completeness.mjs";

const complete = {
  components: ["button"],
  barrel: 'export { Button } from "./components/ui/button"',
  dts: [
    'export type { ButtonProps } from "./components/ui/button";',
    'export { Button, buttonVariants } from "./components/ui/button";',
  ].join("\n"),
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
        generatedContentSha256: "b".repeat(64),
        addTarget: "@shadcn/button",
        shadcnCliVersion: "4.16.0",
        fetchedAt: "2026-07-31",
        license: "MIT",
        modified: "focus ring を修正",
      },
    },
  },
};

test("barrel export の欠落を検出する", () => {
  const { problems } = checkCompleteness({ ...complete, barrel: "" });
  assert.deepEqual(problems, ["button: src/index.ts から export されていない"]);
});

test("名前が前方一致する別componentをbarrel exportとして誤認しない", () => {
  const { problems } = checkCompleteness({
    ...complete,
    barrel: 'export { ButtonGroup } from "./components/ui/button-group"',
  });
  assert.deepEqual(problems, ["button: src/index.ts から export されていない"]);
});

test("コメント内のbarrel exportを実exportとして誤認しない", () => {
  const { problems } = checkCompleteness({
    ...complete,
    barrel: '// export { Button } from "./components/ui/button"',
  });
  assert.deepEqual(problems, ["button: src/index.ts から export されていない"]);
});

test("type-onlyのbarrel exportをvalue exportとして誤認しない", () => {
  const dts = [
    'export type { DialogProps } from "./components/ui/dialog";',
    'export { Dialog } from "./components/ui/dialog";',
  ].join("\n");
  const { problems } = checkCompleteness({
    ...complete,
    barrel: 'export type { ButtonProps } from "./components/ui/button"',
    dts,
  });
  assert.deepEqual(problems, ["button: src/index.ts から export されていない"]);
});

test("lowercase helperだけのbarrel exportをcomponent valueとして誤認しない", () => {
  const dts = [
    'export type { DialogProps } from "./components/ui/dialog";',
    'export { Dialog } from "./components/ui/dialog";',
  ].join("\n");
  const { problems } = checkCompleteness({
    ...complete,
    barrel: 'export { buttonVariants } from "./components/ui/button"',
    dts,
  });
  assert.deepEqual(problems, ["button: src/index.ts から export されていない"]);
});

test("ALL_CAPS helperだけのbarrel exportをcomponent valueとして誤認しない", () => {
  const dts = [
    'export type { DialogProps } from "./components/ui/dialog";',
    'export { Dialog, BUTTON_VARIANTS } from "./components/ui/dialog";',
  ].join("\n");
  const { problems } = checkCompleteness({
    ...complete,
    barrel: 'export { BUTTON_VARIANTS } from "./components/ui/button"',
    dts,
  });
  assert.deepEqual(problems, ["button: src/index.ts から export されていない"]);
});

test("Props 型の欠落を検出する", () => {
  const { problems } = checkCompleteness({
    ...complete,
    dts: 'export { Button } from "./components/ui/button";',
  });
  assert.deepEqual(problems, ["Button: lib/index.d.ts に ButtonProps が無い"]);
});

test("各 PascalCase value export に対応する Props 型を要求する", () => {
  const dts = [
    'export type { DialogProps } from "./components/ui/dialog";',
    'export { Dialog, DialogTrigger } from "./components/ui/dialog";',
  ].join("\n");
  const { problems } = checkCompleteness({ ...complete, dts });
  assert.deepEqual(problems, ["DialogTrigger: lib/index.d.ts に DialogTriggerProps が無い"]);
});

test("re-export の alias 後の公開名で Props 型を照合する", () => {
  const dts = [
    'export type { RootProps as DialogProps } from "./components/ui/dialog";',
    'export { Root as Dialog } from "./components/ui/dialog";',
  ].join("\n");
  assert.deepEqual(checkCompleteness({ ...complete, dts }).problems, []);
});

test("export type の名前を value export と誤認しない", () => {
  const dts = 'export type { Dialog } from "./components/ui/dialog";';
  const { problems } = checkCompleteness({ ...complete, dts });
  assert.deepEqual(problems, [
    "lib/index.d.ts の PascalCase value export が 0 件（走査が空走している）",
  ]);
});

test("コメント内のd.ts exportを公開契約として誤認しない", () => {
  const dts = [
    '// export type { ButtonProps } from "./components/ui/button";',
    '// export { Button } from "./components/ui/button";',
  ].join("\n");
  const { problems } = checkCompleteness({ ...complete, dts });
  assert.deepEqual(problems, [
    "lib/index.d.ts の PascalCase value export が 0 件（走査が空走している）",
  ]);
});

test("PascalCase value export が 0 件なら空走を検出する", () => {
  const dts = 'export { buttonVariants } from "./components/ui/button";';
  const { problems } = checkCompleteness({ ...complete, dts });
  assert.deepEqual(problems, [
    "lib/index.d.ts の PascalCase value export が 0 件（走査が空走している）",
  ]);
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
    "generatedContentSha256",
    "addTarget",
    "shadcnCliVersion",
    "fetchedAt",
    "license",
    "modified",
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

test("add target は registry namespace と component 名の組を要求する", () => {
  for (const addTarget of ["shadcn/button", "@shadcn", "@shadcn/button/extra", "@shadcn/"]) {
    const provenance = structuredClone(complete.provenance);
    provenance.components.button.addTarget = addTarget;
    const { problems } = checkCompleteness({ ...complete, provenance });
    assert.ok(
      problems.some((problem) => problem.includes("addTarget")),
      addTarget,
    );
  }
});

test("生成物の SHA-256 は 64 桁の小文字 16 進を要求する", () => {
  const provenance = structuredClone(complete.provenance);
  provenance.components.button.generatedContentSha256 = "A".repeat(64);
  const { problems } = checkCompleteness({ ...complete, provenance });
  assert.ok(problems.some((problem) => problem.includes("generatedContentSha256")));
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

const blockRegistryItem = {
  name: "login-01",
  files: [
    { path: "src/blocks/login-01/components/login-form.tsx", type: "registry:component" },
    { path: "LICENSE", type: "registry:file", target: "~/elchika-ui/LICENSE" },
  ],
};

const completeBlock = {
  ...complete,
  blocks: ["login-01"],
  registry: { items: [{ name: "button" }, blockRegistryItem] },
  previewFiles: ["button.astro", "button-dark.astro", "login-01.astro", "login-01-dark.astro"],
  previewSources: ["button.tsx", "login-01.tsx"],
  provenance: {
    ...complete.provenance,
    blocks: {
      "login-01": {
        registryUrl: "https://ui.shadcn.com/r/styles/base-nova/login-01.json",
        registryContentSha256: "c".repeat(64),
        addTarget: "@shadcn/login-01",
        shadcnCliVersion: "4.16.0",
        fetchedAt: "2026-08-17",
        license: "MIT",
        modified: "registry:page を配布から除外した",
        files: [
          {
            path: "src/blocks/login-01/components/login-form.tsx",
            upstreamPath: "apps/v4/registry/bases/base/blocks/login-01/components/login-form.tsx",
            upstreamPathSha: "0123456789abcdef0123456789abcdef01234567",
            generatedContentSha256: "d".repeat(64),
          },
          {
            dropped: true,
            upstreamPath: "apps/v4/registry/bases/base/blocks/login-01/page.tsx",
            upstreamPathSha: "89abcdef0123456789abcdef0123456789abcdef",
          },
        ],
      },
    },
  },
};

test("block が全経路に載っていれば問題を返さない", () => {
  const { problems } = checkCompleteness(completeBlock);
  assert.deepEqual(problems, []);
});

test("block の registry item 欠落を検出する", () => {
  const { problems } = checkCompleteness({
    ...completeBlock,
    registry: { items: [{ name: "button" }] },
  });
  assert.deepEqual(problems, ["login-01: registry.json に item が無い"]);
});

test("block の preview 実装欠落を検出する", () => {
  const { problems } = checkCompleteness({
    ...completeBlock,
    previewSources: ["button.tsx"],
  });
  assert.deepEqual(problems, ["login-01: src/previews/login-01.tsx が無い"]);
});

test("block の dark プレビュー欠落を検出する", () => {
  const { problems } = checkCompleteness({
    ...completeBlock,
    previewFiles: ["button.astro", "button-dark.astro", "login-01.astro"],
  });
  assert.deepEqual(problems, ["login-01: プレビュー login-01-dark.astro が無い"]);
});

test("block に barrel export と Props 型を要求しない", () => {
  const { problems } = checkCompleteness({
    ...completeBlock,
    barrel: 'export { Button } from "./components/ui/button"',
  });
  assert.deepEqual(problems, []);
});

test("block の来歴欠落を検出する", () => {
  const { problems } = checkCompleteness({
    ...completeBlock,
    provenance: { ...completeBlock.provenance, blocks: {} },
  });
  assert.deepEqual(problems, ["login-01: provenance.json に来歴が無い"]);
});

test("block の来歴の必須キーが空なら検出する", () => {
  for (const key of Object.keys(completeBlock.provenance.blocks["login-01"])) {
    if (key === "files") continue;
    const provenance = structuredClone(completeBlock.provenance);
    provenance.blocks["login-01"][key] = "";
    const { problems } = checkCompleteness({ ...completeBlock, provenance });
    assert.deepEqual(problems, [`login-01: provenance の ${key} が無い`], key);
  }
});

test("block の来歴の全キーが x なら形式違反を検出する", () => {
  const provenance = structuredClone(completeBlock.provenance);
  for (const key of Object.keys(provenance.blocks["login-01"])) {
    if (key === "files") continue;
    provenance.blocks["login-01"][key] = "x";
  }
  const { problems } = checkCompleteness({ ...completeBlock, provenance });
  assert.notDeepEqual(problems, []);
});

test("block の files が空なら検出する", () => {
  const provenance = structuredClone(completeBlock.provenance);
  provenance.blocks["login-01"].files = [];
  const { problems } = checkCompleteness({ ...completeBlock, provenance });
  assert.deepEqual(problems, ["login-01: provenance の files が 0 件"]);
});

test("配布ファイルの generatedContentSha256 欠落を検出する", () => {
  const provenance = structuredClone(completeBlock.provenance);
  provenance.blocks["login-01"].files[0].generatedContentSha256 = undefined;
  const { problems } = checkCompleteness({ ...completeBlock, provenance });
  assert.deepEqual(problems, [
    "login-01: files[0] の generatedContentSha256 が64桁の小文字ハッシュでない",
  ]);
});

test("dropped なファイルに generatedContentSha256 があれば検出する", () => {
  const provenance = structuredClone(completeBlock.provenance);
  provenance.blocks["login-01"].files[1].generatedContentSha256 = "e".repeat(64);
  const { problems } = checkCompleteness({ ...completeBlock, provenance });
  assert.deepEqual(problems, [
    "login-01: files[1] は dropped なので generatedContentSha256 を持たない",
  ]);
});

test("dropped なファイルに path があれば検出する", () => {
  const provenance = structuredClone(completeBlock.provenance);
  provenance.blocks["login-01"].files[1].path = "src/blocks/login-01/page.tsx";
  const { problems } = checkCompleteness({ ...completeBlock, provenance });
  assert.deepEqual(problems, ["login-01: files[1] は dropped なので path を持たない"]);
});

test("配布ファイルの path が src/blocks/<name>/ 配下でなければ検出する", () => {
  const provenance = structuredClone(completeBlock.provenance);
  provenance.blocks["login-01"].files[0].path = "src/components/ui/login-form.tsx";
  const { problems } = checkCompleteness({ ...completeBlock, provenance });
  // path の形と registry item との集合差は独立した検出器なので、同じ違反で両方鳴る。
  assert.deepEqual(problems, [
    "login-01: files[0] の path が src/blocks/login-01/ 配下でない",
    "login-01: registry item の src/blocks/login-01/components/login-form.tsx が provenance の files に無い",
    "login-01: provenance の files の src/components/ui/login-form.tsx が registry item に無い",
  ]);
});

test("来歴の upstreamPathSha が 40 桁の小文字 SHA でなければ検出する", () => {
  const provenance = structuredClone(completeBlock.provenance);
  provenance.blocks["login-01"].files[0].upstreamPathSha = "A".repeat(40);
  const { problems } = checkCompleteness({ ...completeBlock, provenance });
  assert.deepEqual(problems, ["login-01: files[0] の upstreamPathSha が40桁の小文字SHAでない"]);
});

test("blocks を渡さなければ既存の呼び出しを壊さない", () => {
  assert.deepEqual(checkCompleteness(complete).problems, []);
});

// mutation test で「files[] のエントリを 1 件消しても緑のまま」が実際に起きた。
// 形の検査だけでは集合の欠落を捕まえられないため、期待される集合との突合を固定する。
test("配布しない page の来歴を消したら検出する", () => {
  const provenance = structuredClone(completeBlock.provenance);
  provenance.blocks["login-01"].files = provenance.blocks["login-01"].files.filter(
    (file) => !file.dropped,
  );
  const { problems } = checkCompleteness({ ...completeBlock, provenance });
  assert.deepEqual(problems, ["login-01: 配布しない registry:page の来歴（dropped: true）が無い"]);
});

test("配布ファイルの来歴を消したら registry item との差として検出する", () => {
  const provenance = structuredClone(completeBlock.provenance);
  provenance.blocks["login-01"].files = provenance.blocks["login-01"].files.filter(
    (file) => file.dropped,
  );
  const { problems } = checkCompleteness({ ...completeBlock, provenance });
  assert.deepEqual(problems, [
    "login-01: registry item の src/blocks/login-01/components/login-form.tsx が provenance の files に無い",
  ]);
});

test("registry item に無い配布ファイルが来歴にあれば検出する", () => {
  const provenance = structuredClone(completeBlock.provenance);
  provenance.blocks["login-01"].files.push({
    path: "src/blocks/login-01/components/extra.tsx",
    upstreamPath: "apps/v4/registry/bases/base/blocks/login-01/components/extra.tsx",
    upstreamPathSha: "0123456789abcdef0123456789abcdef01234567",
    generatedContentSha256: "f".repeat(64),
  });
  const { problems } = checkCompleteness({ ...completeBlock, provenance });
  assert.deepEqual(problems, [
    "login-01: provenance の files の src/blocks/login-01/components/extra.tsx が registry item に無い",
  ]);
});

test("法務ファイルは配布分の突合対象に含めない", () => {
  const registry = structuredClone(completeBlock.registry);
  registry.items[1].files.push({
    path: "THIRD_PARTY_LICENSES",
    type: "registry:file",
    target: "~/elchika-ui/THIRD_PARTY_LICENSES",
  });
  assert.deepEqual(checkCompleteness({ ...completeBlock, registry }).problems, []);
});
