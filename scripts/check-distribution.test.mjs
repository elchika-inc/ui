import assert from "node:assert/strict";
import { test } from "node:test";
import * as distribution from "./check-distribution.mjs";

const { checkDistribution } = distribution;

const ORIGIN = { LICENSE: "MIT 本文", THIRD_PARTY_LICENSES: "上流の連結" };
const entry = (target, content) => ({
  path: target.split("/").pop(),
  type: "registry:file",
  target,
  content,
});

test("files に法務ファイルが無ければ検出する", () => {
  const { problems } = checkDistribution(
    { files: [{ path: "b.tsx", type: "registry:ui" }] },
    ORIGIN,
  );
  assert.deepEqual(problems, [
    "LICENSE: registry item の files に無い（install されない）",
    "THIRD_PARTY_LICENSES: registry item の files に無い（install されない）",
  ]);
});

test("content が空なら同梱扱いにしない", () => {
  const item = {
    files: [
      entry("elchika-ui/LICENSE", ""),
      entry("elchika-ui/THIRD_PARTY_LICENSES", "上流の連結"),
    ],
  };
  const { problems } = checkDistribution(item, ORIGIN);
  assert.deepEqual(problems, ["LICENSE: content が空"]);
});

test("原本と内容が違えば検出する", () => {
  const item = {
    files: [
      entry("elchika-ui/LICENSE", "MIT 本文"),
      entry("elchika-ui/THIRD_PARTY_LICENSES", "改ざん"),
    ],
  };
  const { problems } = checkDistribution(item, ORIGIN);
  assert.deepEqual(problems, ["THIRD_PARTY_LICENSES: 原本と内容が一致しない"]);
});

test("type が registry:file でなければ検出する", () => {
  const bad = { ...entry("elchika-ui/LICENSE", "MIT 本文"), type: "registry:ui" };
  const item = {
    files: [bad, entry("elchika-ui/THIRD_PARTY_LICENSES", "上流の連結")],
  };
  const { problems } = checkDistribution(item, ORIGIN);
  assert.deepEqual(problems, ["LICENSE: type が registry:file でない"]);
});

test("揃っていて原本と一致すれば問題なし", () => {
  const item = {
    files: [
      { path: "src/components/ui/button.tsx", type: "registry:ui", content: "..." },
      entry("elchika-ui/LICENSE", "MIT 本文"),
      entry("elchika-ui/THIRD_PARTY_LICENSES", "上流の連結"),
    ],
  };
  assert.deepEqual(checkDistribution(item, ORIGIN).problems, []);
});

test("Button以外を含む全registry itemの法務ファイルを検査する", () => {
  assert.equal(
    typeof distribution.checkDistributionItems,
    "function",
    "全registry itemを検査する関数が無い",
  );
  const valid = {
    files: [
      entry("elchika-ui/LICENSE", "MIT 本文"),
      entry("elchika-ui/THIRD_PARTY_LICENSES", "上流の連結"),
    ],
  };
  const invalid = {
    files: [entry("elchika-ui/LICENSE", "MIT 本文")],
  };
  assert.deepEqual(
    distribution.checkDistributionItems(
      [
        { name: "button", item: valid },
        { name: "calendar", item: invalid },
      ],
      ORIGIN,
    ).problems,
    ["calendar: THIRD_PARTY_LICENSES: registry item の files に無い（install されない）"],
  );
});
