"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type DashboardTableRow = {
  id: number;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
};

export type DashboardTableProps = {
  data: readonly DashboardTableRow[];
  className?: string;
};

type OptionalColumn = "type" | "status" | "target" | "limit" | "reviewer";
type SortKey = "header" | "status" | "target" | "reviewer";
type SortState = { key: SortKey; direction: "ascending" | "descending" };
type TableView = "all" | "review";

const OPTIONAL_COLUMNS = [
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "target", label: "Target" },
  { key: "limit", label: "Limit" },
  { key: "reviewer", label: "Reviewer" },
] as const;

const INITIAL_COLUMNS: Record<OptionalColumn, boolean> = {
  type: true,
  status: true,
  target: true,
  limit: true,
  reviewer: true,
};

const DETAIL_CHART_CONFIG = {};

export function dashboardTableSelectionState(
  rows: readonly Pick<DashboardTableRow, "id">[],
  selectedIds: ReadonlySet<number>,
) {
  return {
    allSelected: rows.length > 0 && rows.every((row) => selectedIds.has(row.id)),
    someSelected: rows.some((row) => selectedIds.has(row.id)),
  };
}

export function reconcileDashboardTableState(
  selectedIds: ReadonlySet<number>,
  activeRowId: number | null,
  data: readonly DashboardTableRow[],
) {
  const dataIds = new Set(data.map((row) => row.id));
  const nextActiveRowId = activeRowId !== null && dataIds.has(activeRowId) ? activeRowId : null;
  return {
    selectedIds: new Set([...selectedIds].filter((id) => dataIds.has(id))),
    activeRowId: nextActiveRowId,
    activeRow: data.find((row) => row.id === nextActiveRowId) ?? null,
  };
}

function dashboardMetricNumber(value: string) {
  const normalized = value.trim();
  if (normalized.length === 0) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function compareRows(left: DashboardTableRow, right: DashboardTableRow, key: SortKey) {
  if (key === "target") {
    const leftTarget = dashboardMetricNumber(left.target);
    const rightTarget = dashboardMetricNumber(right.target);
    const leftIsNumeric = leftTarget !== null;
    const rightIsNumeric = rightTarget !== null;
    if (leftIsNumeric && rightIsNumeric) {
      return leftTarget - rightTarget;
    }
    if (leftIsNumeric !== rightIsNumeric) return leftIsNumeric ? -1 : 1;
  }
  return left[key].localeCompare(right[key]);
}

export function dashboardMetricValues(row: Pick<DashboardTableRow, "target" | "limit">) {
  const target = dashboardMetricNumber(row.target);
  const limit = dashboardMetricNumber(row.limit);
  if (target === null || limit === null) return null;
  const values = [limit, target, (limit + target) / 2, Math.max(limit, target), target];
  return { values, maximum: Math.max(...values, 1) };
}

function SortButton({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
}) {
  const active = sort.key === sortKey;
  const indicator = active ? (sort.direction === "ascending" ? "↑" : "↓") : "↕";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2"
      aria-label={`${label} で並べ替える`}
      onClick={() => onSort(sortKey)}
    >
      {label}
      <span aria-hidden="true">{indicator}</span>
    </Button>
  );
}

function DashboardTableDataRow({
  row,
  visibleColumns,
  selected,
  onSelect,
  onOpen,
}: {
  row: DashboardTableRow;
  visibleColumns: Record<OptionalColumn, boolean>;
  selected: boolean;
  onSelect: (id: number, selected: boolean) => void;
  onOpen: (row: DashboardTableRow) => void;
}) {
  return (
    <TableRow data-row-id={row.id} data-state={selected ? "selected" : undefined}>
      <TableCell>
        <Checkbox
          aria-label={`${row.header} を選択`}
          checked={selected}
          onCheckedChange={(checked) => onSelect(row.id, checked)}
        />
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 font-medium"
          aria-label={`${row.header} の詳細を開く`}
          onClick={() => onOpen(row)}
        >
          {row.header}
        </Button>
      </TableCell>
      {visibleColumns.type ? <TableCell>{row.type}</TableCell> : null}
      {visibleColumns.status ? (
        <TableCell>
          <Badge variant={row.status === "Done" ? "secondary" : "outline"}>{row.status}</Badge>
        </TableCell>
      ) : null}
      {visibleColumns.target ? (
        <TableCell className="font-mono tabular-nums">{row.target}</TableCell>
      ) : null}
      {visibleColumns.limit ? (
        <TableCell className="font-mono tabular-nums">{row.limit}</TableCell>
      ) : null}
      {visibleColumns.reviewer ? <TableCell>{row.reviewer}</TableCell> : null}
    </TableRow>
  );
}

function DashboardDataTable({
  rows,
  visibleColumns,
  selectedIds,
  sort,
  onSort,
  onSelect,
  onSelectAll,
  onOpen,
}: {
  rows: readonly DashboardTableRow[];
  visibleColumns: Record<OptionalColumn, boolean>;
  selectedIds: ReadonlySet<number>;
  sort: SortState;
  onSort: (key: SortKey) => void;
  onSelect: (id: number, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onOpen: (row: DashboardTableRow) => void;
}) {
  const { allSelected, someSelected } = dashboardTableSelectionState(rows, selectedIds);
  const columnCount = 2 + OPTIONAL_COLUMNS.filter(({ key }) => visibleColumns[key]).length;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table className="min-w-4xl">
        <caption className="sr-only">Dashboard documents</caption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                aria-label="表示中の行をすべて選択"
                checked={allSelected}
                indeterminate={someSelected && !allSelected}
                onCheckedChange={(checked) => onSelectAll(checked)}
              />
            </TableHead>
            <TableHead aria-sort={sort.key === "header" ? sort.direction : "none"}>
              <SortButton label="Document" sortKey="header" sort={sort} onSort={onSort} />
            </TableHead>
            {visibleColumns.type ? <TableHead>Type</TableHead> : null}
            {visibleColumns.status ? (
              <TableHead aria-sort={sort.key === "status" ? sort.direction : "none"}>
                <SortButton label="Status" sortKey="status" sort={sort} onSort={onSort} />
              </TableHead>
            ) : null}
            {visibleColumns.target ? (
              <TableHead aria-sort={sort.key === "target" ? sort.direction : "none"}>
                <SortButton label="Target" sortKey="target" sort={sort} onSort={onSort} />
              </TableHead>
            ) : null}
            {visibleColumns.limit ? <TableHead>Limit</TableHead> : null}
            {visibleColumns.reviewer ? (
              <TableHead aria-sort={sort.key === "reviewer" ? sort.direction : "none"}>
                <SortButton label="Reviewer" sortKey="reviewer" sort={sort} onSort={onSort} />
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                条件に一致するドキュメントはありません。
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <DashboardTableDataRow
                key={row.id}
                row={row}
                visibleColumns={visibleColumns}
                selected={selectedIds.has(row.id)}
                onSelect={onSelect}
                onOpen={onOpen}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function DetailChart({ row }: { row: DashboardTableRow }) {
  const metrics = dashboardMetricValues(row);
  if (!metrics) {
    return (
      <div
        role="status"
        className="flex min-h-48 items-center justify-center rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground"
      >
        数値データがないためチャートを表示できません。
      </div>
    );
  }
  const { values, maximum } = metrics;
  const points = values
    .map((value, index) => `${24 + index * 68},${136 - (value / maximum) * 104}`)
    .join(" ");

  return (
    <ChartContainer
      role="group"
      aria-label={`${row.header} の進捗チャート`}
      config={DETAIL_CHART_CONFIG}
      className="relative h-48 w-full text-primary"
      initialDimension={{ width: 320, height: 160 }}
    >
      <svg
        role="img"
        aria-label="Target と limit の推移"
        className="absolute inset-0 h-full w-full"
        width="100%"
        height="100%"
        viewBox="0 0 320 160"
      >
        <line x1="24" y1="136" x2="296" y2="136" stroke="currentColor" opacity="0.2" />
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.split(" ").map((point) => {
          const [cx, cy] = point.split(",");
          return <circle key={point} cx={cx} cy={cy} r="4" fill="currentColor" />;
        })}
      </svg>
    </ChartContainer>
  );
}

export function DashboardTable({ data, className }: DashboardTableProps) {
  const [view, setView] = React.useState<TableView>("all");
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortState>({
    key: "header",
    direction: "ascending",
  });
  const [visibleColumns, setVisibleColumns] =
    React.useState<Record<OptionalColumn, boolean>>(INITIAL_COLUMNS);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(() => new Set());
  const [activeRowId, setActiveRowId] = React.useState<number | null>(null);

  const reconciledState = React.useMemo(
    () => reconcileDashboardTableState(selectedIds, activeRowId, data),
    [activeRowId, data, selectedIds],
  );
  const selectedIdsInData = reconciledState.selectedIds;
  const activeRow = reconciledState.activeRow;

  React.useEffect(() => {
    if (selectedIdsInData.size !== selectedIds.size) {
      setSelectedIds(selectedIdsInData);
    }
    if (activeRowId !== reconciledState.activeRowId) {
      setActiveRowId(null);
    }
  }, [activeRowId, reconciledState.activeRowId, selectedIds, selectedIdsInData]);

  const rows = React.useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filtered = data.filter((row) => {
      const inView = view === "all" || row.status === "In Process";
      if (!inView) return false;
      if (!normalizedQuery) return true;
      return [row.header, row.type, row.status, row.reviewer].some((value) =>
        value.toLocaleLowerCase().includes(normalizedQuery),
      );
    });
    return [...filtered].sort((left, right) => {
      const comparison = compareRows(left, right, sort.key);
      return sort.direction === "ascending" ? comparison : -comparison;
    });
  }, [data, query, sort, view]);

  const toggleSort = (key: SortKey) => {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "ascending" ? "descending" : "ascending",
    }));
  };

  const toggleSelection = (id: number, selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAll = (selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const row of rows) {
        if (selected) next.add(row.id);
        else next.delete(row.id);
      }
      return next;
    });
  };

  const table = (
    <DashboardDataTable
      rows={rows}
      visibleColumns={visibleColumns}
      selectedIds={selectedIdsInData}
      sort={sort}
      onSort={toggleSort}
      onSelect={toggleSelection}
      onSelectAll={toggleAll}
      onOpen={(row) => setActiveRowId(row.id)}
    />
  );

  return (
    <section
      data-slot="dashboard-table"
      data-visible-rows={rows.length}
      data-selected-rows={selectedIdsInData.size}
      className={cn("grid min-w-0 gap-4", className)}
    >
      <Tabs value={view} onValueChange={(value) => setView(value as TableView)} className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList aria-label="ドキュメント表示">
            <TabsTrigger value="all">All documents</TabsTrigger>
            <TabsTrigger value="review">In review</TabsTrigger>
          </TabsList>
          <div className="flex flex-1 flex-col gap-2 sm:max-w-xl sm:flex-row sm:justify-end">
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              aria-label="ドキュメントを絞り込む"
              placeholder="Filter documents..."
              className="sm:max-w-xs"
            />
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button type="button" variant="outline" />}>
                Columns
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
                  {OPTIONAL_COLUMNS.map(({ key, label }) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={visibleColumns[key]}
                      onCheckedChange={(checked) =>
                        setVisibleColumns((current) => ({ ...current, [key]: checked }))
                      }
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value="all" className="min-w-0">
          {view === "all" ? table : null}
        </TabsContent>
        <TabsContent value="review" className="min-w-0">
          {view === "review" ? table : null}
        </TabsContent>
      </Tabs>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {rows.length} 件を表示・{selectedIdsInData.size} 件を選択
      </p>

      <Drawer
        open={activeRow !== null}
        showSwipeHandle
        onOpenChange={(open) => !open && setActiveRowId(null)}
      >
        {activeRow ? (
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{activeRow.header}</DrawerTitle>
              <DrawerDescription>
                {activeRow.type}・{activeRow.status}・担当 {activeRow.reviewer}
              </DrawerDescription>
            </DrawerHeader>
            <div className="grid gap-4 overflow-y-auto p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="font-mono text-xl font-semibold tabular-nums">{activeRow.target}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Limit</p>
                  <p className="font-mono text-xl font-semibold tabular-nums">{activeRow.limit}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Reviewer</p>
                  <p className="truncate font-medium">{activeRow.reviewer}</p>
                </div>
              </div>
              <DetailChart row={activeRow} />
            </div>
            <DrawerFooter>
              <DrawerClose render={<Button type="button" variant="outline" />}>閉じる</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        ) : null}
      </Drawer>
    </section>
  );
}
