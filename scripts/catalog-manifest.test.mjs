import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

const manifestUrl = new URL("../src/catalog/preview-manifest.mjs", import.meta.url);

const loadManifest = async () => {
  assert.ok(existsSync(manifestUrl), "preview-manifest.mjs がまだ無い");
  return import(manifestUrl);
};

test("preview module を path 順の catalog item へ変換する", async () => {
  const { createPreviewManifest } = await loadManifest();
  const BadgePreview = () => null;
  const InputOtpPreview = () => null;

  const result = createPreviewManifest({
    "../previews/input-otp.tsx": { InputOtpPreview },
    "../previews/badge.tsx": { BadgePreview },
  });

  assert.deepEqual(result, [
    { name: "badge", title: "Badge", Preview: BadgePreview },
    { name: "input-otp", title: "Input Otp", Preview: InputOtpPreview },
  ]);
});

test("Preview export が無い module は停止する", async () => {
  const { createPreviewManifest } = await loadManifest();

  assert.throws(
    () => createPreviewManifest({ "../previews/button.tsx": { helper: () => null } }),
    /button.*Preview export が無い/,
  );
});

test("Preview export が複数ある module は停止する", async () => {
  const { createPreviewManifest } = await loadManifest();

  assert.throws(
    () =>
      createPreviewManifest({
        "../previews/button.tsx": {
          ButtonPreview: () => null,
          OtherPreview: () => null,
        },
      }),
    /button.*Preview export が複数/,
  );
});
