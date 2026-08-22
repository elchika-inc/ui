import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const readSource = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("dashboard navigation は受け取った URL を link として描画する", () => {
  const source = readSource("src/blocks/dashboard-01/components/nav-main.tsx");
  assert.match(source, /render={<a href={item\.url} \/>}/);
});

test("dashboard chart は日付の比較と表示を UTC へ統一し選択期間を説明する", () => {
  const source = readSource("src/blocks/dashboard-01/components/chart-area-interactive.tsx");
  assert.match(source, /T00:00:00Z/);
  assert.match(source, /setUTCDate/);
  assert.equal([...source.matchAll(/timeZone: "UTC"/g)].length, 1);
  assert.match(source, /TIME_RANGES\[timeRange\]/);
  assert.match(source, /selectedRange\.description/);
});

test("dashboard table は明示的な詳細 button と選択の mixed state を持つ", () => {
  const source = readSource("src/blocks/dashboard-table/components/dashboard-table.tsx");
  assert.doesNotMatch(source, /<TableRow[^>]*[\s\S]*?tabIndex={0}/);
  assert.ok(source.includes(`aria-label={\`\${row.header} の詳細を開く\`}`));
  assert.match(source, /indeterminate={someSelected && !allSelected}/);
});

test("dashboard table は data 更新時に選択 ID と active row を現在データへ束縛する", () => {
  const source = readSource("src/blocks/dashboard-table/components/dashboard-table.tsx");
  assert.match(source, /const \[activeRowId, setActiveRowId\]/);
  assert.match(source, /dataIds\.has\(id\)/);
  assert.match(source, /data\.find\(\(row\) => row\.id === activeRowId\)/);
  assert.match(source, /setSelectedIds\(selectedIdsInData\)/);
  assert.match(source, /setActiveRowId\(null\)/);
});
