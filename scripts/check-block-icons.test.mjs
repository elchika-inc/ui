import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

const checkerPath = new URL("./check-block-icons.mjs", import.meta.url);

async function loadChecker() {
  assert.ok(existsSync(checkerPath), "check-block-icons.mjs がまだ無い");
  return import(checkerPath);
}

const upstreamItem = (...files) => ({
  files: files.map(([path, content]) => ({ path, type: "registry:component", content })),
});

test("上流 JSON から件数に依存せず lucide の期待集合を導出する", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const result = inspectUpstreamBlocks([
    {
      name: "login-04",
      item: upstreamItem([
        "registry/base-nova/blocks/login-04/components/login-form.tsx",
        "export function LoginForm() { return <form /> }",
      ]),
    },
    {
      name: "login-05",
      item: upstreamItem([
        "registry/base-nova/blocks/login-05/components/login-form.tsx",
        `
          export function LoginForm() {
            return <>
              <IconPlaceholder lucide="GalleryVerticalEndIcon" className="size-6" />
              <IconPlaceholder
                tabler="IconLayoutRows"
                lucide="GalleryVerticalEndIcon"
              />
              <IconPlaceholder lucide="BadgeIcon" />
            </>
          }
        `,
      ]),
    },
  ]);

  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.expectedByTarget, {
    blocks: {
      "login-05": {
        BadgeIcon: 1,
        GalleryVerticalEndIcon: 2,
      },
    },
    previews: {},
  });
  assert.deepEqual(result.stats, {
    jsonCount: 2,
    blocksWithPlaceholders: 1,
    placeholderCount: 3,
    uniqueIconCount: 2,
    missingLucideCount: 0,
  });
});

test("lucide 属性が無い IconPlaceholder は fail-closed で問題にする", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const result = inspectUpstreamBlocks([
    {
      name: "sidebar-01",
      item: upstreamItem([
        "registry/base-nova/blocks/sidebar-01/components/app-sidebar.tsx",
        `export const AppSidebar = () => <IconPlaceholder tabler="IconHome" />`,
      ]),
    },
  ]);

  assert.deepEqual(result.expectedByTarget, { blocks: {}, previews: {} });
  assert.deepEqual(result.problems, [
    "sidebar-01: registry/base-nova/blocks/sidebar-01/components/app-sidebar.tsx の IconPlaceholder #1 に lucide 属性が無い",
  ]);
  assert.equal(result.stats.missingLucideCount, 1);
});

test("registry:page の lucide 期待集合は preview 側へ分離する", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const result = inspectUpstreamBlocks([
    {
      name: "login-02",
      item: {
        files: [
          {
            path: "registry/base-nova/blocks/login-02/page.tsx",
            type: "registry:page",
            content: '<IconPlaceholder lucide="GalleryVerticalEndIcon" />',
          },
          {
            path: "registry/base-nova/blocks/login-02/components/login-form.tsx",
            type: "registry:component",
            content: '<IconPlaceholder lucide="BadgeIcon" />',
          },
        ],
      },
    },
  ]);

  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.expectedByTarget, {
    blocks: { "login-02": { BadgeIcon: 1 } },
    previews: { "login-02": { GalleryVerticalEndIcon: 1 } },
  });
});

test("上流 lucide 値が import alias と必要回数の JSX 使用へ展開されていれば通る", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    {
      "login-05": {
        BadgeIcon: 1,
        GalleryVerticalEndIcon: 2,
      },
    },
    {
      "login-05": [
        {
          path: "src/blocks/login-05/components/login-form.tsx",
          source: `
            import {
              BadgeIcon,
              GalleryVerticalEndIcon as BrandIcon,
            } from "lucide-react"
            export const LoginForm = () => (
              <><BrandIcon /><BrandIcon /><BadgeIcon /></>
            )
          `,
        },
      ],
    },
  );

  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.stats, {
    blocksChecked: 1,
    expectedOccurrences: 3,
    matchedOccurrences: 3,
  });
});

test("実アイコンの named import が無ければ検出する", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    { "login-05": { GalleryVerticalEndIcon: 1 } },
    {
      "login-05": [
        {
          path: "src/blocks/login-05/components/login-form.tsx",
          source: "export const LoginForm = () => <GalleryVerticalEndIcon />",
        },
      ],
    },
  );

  assert.deepEqual(result.problems, [
    "login-05: GalleryVerticalEndIcon が lucide-react から named import されていない",
  ]);
  assert.equal(result.stats.matchedOccurrences, 0);
});

test("実アイコンの JSX 使用回数が上流の期待回数より少なければ検出する", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    { "sidebar-01": { SearchIcon: 2 } },
    {
      "sidebar-01": [
        {
          path: "src/blocks/sidebar-01/components/search-form.tsx",
          source: `
            import { SearchIcon } from "lucide-react"
            export const SearchForm = () => <SearchIcon />
          `,
        },
      ],
    },
  );

  assert.deepEqual(result.problems, [
    "sidebar-01: SearchIcon の JSX 使用が不足している（期待 2 / 実測 1）",
  ]);
  assert.equal(result.stats.matchedOccurrences, 1);
});

test("期待対象 block の生成物が無ければ空走せず検出する", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons({ "sidebar-02": { HomeIcon: 1 } }, {});

  assert.deepEqual(result.problems, ["sidebar-02: 生成物が無い"]);
  assert.equal(result.stats.blocksChecked, 1);
});
