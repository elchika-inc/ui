import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const readSource = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const loadTsxLogic = (path, names) => {
  const output = ts.transpileModule(readSource(path), {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const executable = output
    .replace(/import[\s\S]*?from ["'][^"']+["'];\n/g, "")
    .replaceAll("export ", "");
  return Function(`${executable}\nreturn { ${names.join(", ")} };`)();
};

test("dashboard navigation は受け取った URL を link として描画する", () => {
  const source = readSource("src/blocks/dashboard-01/components/nav-main.tsx");
  assert.match(source, /render={<a href={item\.url} \/>}/);
});

test("dashboard chart は UTC の両端を含む 7/30/90 日を返す", () => {
  const { chartData, filterChartDataByDays } = loadTsxLogic(
    "src/blocks/dashboard-01/components/chart-area-interactive.tsx",
    ["chartData", "filterChartDataByDays"],
  );

  for (const [days, firstDate] of [
    [7, "2024-06-24"],
    [30, "2024-06-01"],
    [90, "2024-04-02"],
  ]) {
    const filtered = filterChartDataByDays(chartData, days, "2024-06-30");
    assert.equal(filtered.length, days);
    assert.equal(filtered[0].date, firstDate);
    assert.equal(filtered.at(-1).date, "2024-06-30");
  }
});

test("dashboard table は部分選択を mixed state として計算する", () => {
  const source = readSource("src/blocks/dashboard-table/components/dashboard-table.tsx");
  const { dashboardTableSelectionState } = loadTsxLogic(
    "src/blocks/dashboard-table/components/dashboard-table.tsx",
    ["dashboardTableSelectionState"],
  );
  const rows = [{ id: 1 }, { id: 2 }];

  assert.deepEqual(dashboardTableSelectionState(rows, new Set()), {
    allSelected: false,
    someSelected: false,
  });
  assert.deepEqual(dashboardTableSelectionState(rows, new Set([1])), {
    allSelected: false,
    someSelected: true,
  });
  assert.deepEqual(dashboardTableSelectionState(rows, new Set([1, 2])), {
    allSelected: true,
    someSelected: true,
  });
  assert.doesNotMatch(source, /<TableRow[^>]*[\s\S]*?tabIndex={0}/);
  assert.ok(source.includes(`aria-label={\`\${row.header} の詳細を開く\`}`));
});

test("dashboard table は data 更新時に選択 ID と active row を現在データへ束縛する", () => {
  const { reconcileDashboardTableState } = loadTsxLogic(
    "src/blocks/dashboard-table/components/dashboard-table.tsx",
    ["reconcileDashboardTableState"],
  );

  const sameIdsWithNewValues = [
    { id: 1, header: "更新後" },
    { id: 2, header: "別行" },
  ];
  const retained = reconcileDashboardTableState(new Set([1, 3]), 1, sameIdsWithNewValues);
  assert.deepEqual([...retained.selectedIds], [1]);
  assert.equal(retained.activeRowId, 1);
  assert.equal(retained.activeRow.header, "更新後");

  const removed = reconcileDashboardTableState(new Set([1, 3]), 3, sameIdsWithNewValues);
  assert.deepEqual([...removed.selectedIds], [1]);
  assert.equal(removed.activeRowId, null);
  assert.equal(removed.activeRow, null);
});

test("dashboard table は DnD による行順変更を実装しない", () => {
  const source = readSource("src/blocks/dashboard-table/components/dashboard-table.tsx");

  assert.doesNotMatch(source, /@dnd-kit|sortable/i);
  assert.doesNotMatch(source, /\bdraggable\b|onDrag(?:Start|End|Over)|drag handle/i);
  assert.doesNotMatch(source, /GripVertical|並べ替えハンドル/);
});

test("dashboard table は非数値 metric を安定して扱う", () => {
  const { compareRows, dashboardMetricValues } = loadTsxLogic(
    "src/blocks/dashboard-table/components/dashboard-table.tsx",
    ["compareRows", "dashboardMetricValues"],
  );
  const base = {
    id: 1,
    header: "Document",
    type: "Narrative",
    status: "Done",
    limit: "5",
    reviewer: "Reviewer",
  };
  const unavailable = { ...base, target: "N/A" };
  const numeric = { ...base, id: 2, target: "10" };

  assert.equal(dashboardMetricValues(unavailable), null);
  assert.ok(Number.isFinite(compareRows(unavailable, numeric, "target")));
  assert.deepEqual(dashboardMetricValues(numeric), {
    values: [5, 10, 7.5, 10, 10],
    maximum: 10,
  });
});
