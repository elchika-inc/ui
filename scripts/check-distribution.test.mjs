import assert from "node:assert/strict";
import { test } from "node:test";
import * as distribution from "./check-distribution.mjs";

const { checkDistribution } = distribution;

const ORIGIN = {
  "src/styles/global.css": "alias CSS",
  "src/styles/design-system/tokens.css": "生成 token",
  LICENSE: "MIT 本文",
  THIRD_PARTY_LICENSES: "上流の連結",
};
const entry = (path, target, content) => ({
  path,
  type: "registry:file",
  target,
  content,
});
const validFiles = () => [
  entry("src/styles/global.css", "~/elchika-ui/tokens.css", "alias CSS"),
  entry(
    "src/styles/design-system/tokens.css",
    "~/elchika-ui/design-system/tokens.css",
    "生成 token",
  ),
  entry("LICENSE", "~/elchika-ui/LICENSE", "MIT 本文"),
  entry("THIRD_PARTY_LICENSES", "~/elchika-ui/THIRD_PARTY_LICENSES", "上流の連結"),
];

test("files に token と法務ファイルが無ければ検出する", () => {
  const { problems } = checkDistribution(
    { files: [{ path: "b.tsx", type: "registry:ui" }] },
    ORIGIN,
  );
  assert.deepEqual(problems, [
    "alias CSS: registry item の files に無い（install されない）",
    "design-system token: registry item の files に無い（install されない）",
    "LICENSE: registry item の files に無い（install されない）",
    "THIRD_PARTY_LICENSES: registry item の files に無い（install されない）",
  ]);
});

test("content が空なら同梱扱いにしない", () => {
  const item = {
    files: validFiles().map((file) =>
      file.target === "~/elchika-ui/design-system/tokens.css" ? { ...file, content: "" } : file,
    ),
  };
  const { problems } = checkDistribution(item, ORIGIN);
  assert.deepEqual(problems, ["design-system token: content が空"]);
});

test("原本と内容が違えば検出する", () => {
  const item = {
    files: validFiles().map((file) =>
      file.target === "~/elchika-ui/design-system/tokens.css"
        ? { ...file, content: "改ざん" }
        : file,
    ),
  };
  const { problems } = checkDistribution(item, ORIGIN);
  assert.deepEqual(problems, ["design-system token: 原本と内容が一致しない"]);
});

test("type が registry:file でなければ検出する", () => {
  const item = {
    files: validFiles().map((file) =>
      file.target === "~/elchika-ui/design-system/tokens.css"
        ? { ...file, type: "registry:ui" }
        : file,
    ),
  };
  const { problems } = checkDistribution(item, ORIGIN);
  assert.deepEqual(problems, ["design-system token: type が registry:file でない"]);
});

test("揃っていて原本と一致すれば問題なし", () => {
  const item = {
    files: [
      { path: "src/components/ui/button.tsx", type: "registry:ui", content: "..." },
      ...validFiles(),
    ],
  };
  assert.deepEqual(checkDistribution(item, ORIGIN).problems, []);
});

test("Button以外を含む全registry itemのtokenと法務ファイルを検査する", () => {
  assert.equal(
    typeof distribution.checkDistributionItems,
    "function",
    "全registry itemを検査する関数が無い",
  );
  const valid = { files: validFiles() };
  const invalid = {
    files: validFiles().filter(({ target }) => target !== "~/elchika-ui/design-system/tokens.css"),
  };
  assert.deepEqual(
    distribution.checkDistributionItems(
      [
        { name: "button", item: valid },
        { name: "calendar", item: invalid },
      ],
      ORIGIN,
    ).problems,
    ["calendar: design-system token: registry item の files に無い（install されない）"],
  );
});
