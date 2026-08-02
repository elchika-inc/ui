import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { checkFile, checkFiles } from "./check-standards.mjs";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("透明度を合成したフォーカスリングを検出する", () => {
  const { violations } = checkFile(
    "a.tsx",
    `className="focus-visible:ring-3 focus-visible:ring-ring/50"`,
  );
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, "focus-ring-opacity");
});

test("色名に数字を含むリングも検出する", () => {
  const { violations } = checkFile("a.tsx", `className="focus-visible:ring-red-500/50"`);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, "focus-ring-opacity");
});

test("角括弧・丸括弧の不透明度指定も検出する", () => {
  for (const cls of [
    "ring-red-500/[50%]",
    "ring-red-500/[.5]",
    "ring-ring/(--ring-alpha)",
    // 色側の変数短縮・任意値。色を [a-z0-9-]+ だけにすると見逃す
    "ring-(--brand)/50",
    "ring-[#f00]/50",
  ]) {
    const { violations } = checkFile("a.tsx", `className="focus-visible:${cls}"`);
    // **件数で判定しない。** `ring-[#f00]/50` のように 2 つの規定へ同時に
    // 違反するクラスがあり、そのとき 2 件出るのが正しい（任意値であり、かつ
    // 透明度合成でもある）。ここで見たいのは「focus-ring-opacity として
    // 検出されること」なので、rule の有無で判定する。
    assert.ok(
      violations.some((v) => v.rule === "focus-ring-opacity"),
      `${cls}: focus-ring-opacity として検出されない`,
    );
  }
});

test("テーマ修飾付きと focus-within の状態リングを検出する", () => {
  for (const cls of [
    "dark:focus-visible:ring-destructive/40",
    "focus-visible:dark:ring-destructive/40",
    "focus-within:ring-ring/50",
  ]) {
    const { violations } = checkFile("a.tsx", `className="${cls}"`);
    assert.ok(
      violations.some((v) => v.rule === "focus-ring-opacity"),
      `${cls}: focus-ring-opacity として検出されない`,
    );
  }
});

test("arbitrary variant 内の focus-visible でも透明リングを検出する", () => {
  const { violations } = checkFile(
    "a.tsx",
    `className="has-[[data-slot=x]:focus-visible]:ring-ring/50"`,
  );
  assert.ok(
    violations.some((v) => v.rule === "focus-ring-opacity"),
    "variant 内の focus-visible を含む透明リングが検出されない",
  );
});

test("無条件の装飾リングはフォーカスリング違反にしない", () => {
  for (const cls of ["ring-foreground/10", "ring-border/20", "ring-[3px]"]) {
    const { violations } = checkFile("a.tsx", `className="${cls}"`);
    assert.deepEqual(violations, [], cls);
  }
});

test("別の文字列引数にある装飾リングを状態リングと誤認しない", () => {
  const { violations } = checkFile(
    "a.tsx",
    `className={cn("focus-visible:outline-none","ring-foreground/10")}`,
  );
  assert.deepEqual(violations, []);
});

test("同じliteralの状態ring幅と透明ring色を関連付ける", () => {
  const { violations } = checkFile("a.tsx", `className="focus-visible:ring-[3px] ring-ring/50"`);
  assert.ok(
    violations.some((violation) => violation.rule === "focus-ring-opacity"),
    "同じliteralの透明なfocus ringが検出されない",
  );
});

test("別cn引数の状態ring幅と透明ring色を関連付ける", () => {
  const { violations } = checkFile(
    "a.tsx",
    `className={cn("focus-visible:ring-[3px]", "ring-ring/50")}`,
  );
  assert.ok(
    violations.some((violation) => violation.rule === "focus-ring-opacity"),
    "別cn引数の透明なfocus ringが検出されない",
  );
});

test("改行したcn引数の状態ring幅と透明ring色を関連付ける", () => {
  const { violations } = checkFile(
    "a.tsx",
    `className={cn(
      "focus-visible:ring-[3px]",
      "ring-ring/50",
    )}`,
  );
  assert.ok(
    violations.some((violation) => violation.rule === "focus-ring-opacity"),
    "改行したcn引数の透明なfocus ringが検出されない",
  );
});

test("配列joinで結合する状態ring幅と透明ring色を関連付ける", () => {
  const { violations } = checkFile(
    "a.tsx",
    `className={[
      "focus-visible:ring-[3px]",
      "ring-ring/50",
    ].join(" ")}`,
  );
  assert.ok(
    violations.some((violation) => violation.rule === "focus-ring-opacity"),
    "配列joinで結合する透明なfocus ringが検出されない",
  );
});

test("変数へ抽出したclass合成の状態ring幅と透明ring色を関連付ける", () => {
  for (const initializer of [
    `cn(
      "focus-visible:ring-[3px]",
      "ring-ring/50",
    )`,
    `[
      "focus-visible:ring-[3px]",
      "ring-ring/50",
    ].join(" ")`,
  ]) {
    const { violations } = checkFile(
      "a.tsx",
      `const classes = ${initializer};
      const View = () => <div className={classes} />;`,
    );
    assert.ok(
      violations.some((violation) => violation.rule === "focus-ring-opacity"),
      `変数へ抽出した透明なfocus ringが検出されない: ${initializer}`,
    );
  }
});

test("別scopeの同名変数があってもclassNameの最近傍initializerを解決する", () => {
  const { violations } = checkFile(
    "a.tsx",
    `function InvalidView() {
      const classes = cn(
        "focus-visible:ring-[3px]",
        "ring-ring/50",
      );
      return <div className={classes} />;
    }
    function ValidView() {
      const classes = "text-sm";
      return <div className={classes} />;
    }`,
  );
  assert.ok(
    violations.some((violation) => violation.rule === "focus-ring-opacity"),
    "別scopeの同名変数で透明なfocus ringが隠れている",
  );
});

test("className合成式の子identifierもinitializerまで解決する", () => {
  const { violations } = checkFile(
    "a.tsx",
    `const focusClasses = cn(
      "focus-visible:ring-[3px]",
      "ring-ring/50",
    );
    const View = () => <div className={cn("text-sm", focusClasses)} />;`,
  );
  assert.ok(
    violations.some((violation) => violation.rule === "focus-ring-opacity"),
    "className合成式の子identifierで透明なfocus ringが隠れている",
  );
});

test("関数から参照する後置module変数もlexical bindingとして解決する", () => {
  const { violations } = checkFile(
    "a.tsx",
    `function View() {
      return <div className={classes} />;
    }
    const classes = cn(
      "focus-visible:ring-[3px]",
      "ring-ring/50",
    );`,
  );
  assert.ok(
    violations.some((violation) => violation.rule === "focus-ring-opacity"),
    "後置module変数で透明なfocus ringが隠れている",
  );
});

test("property名を同名のmodule変数へ誤解しない", () => {
  const { violations } = checkFile(
    "a.tsx",
    `const ring = cn(
      "focus-visible:ring-[3px]",
      "ring-ring/50",
    );
    const styles = { ring: "text-sm" };
    const classes = styles.ring;
    const View = () => <div className={classes} />;`,
  );
  assert.deepEqual(violations, []);
});

test("parameter shadowingをmodule変数へ誤解しない", () => {
  const { violations } = checkFile(
    "a.tsx",
    `const classes = cn(
      "focus-visible:ring-[3px]",
      "ring-ring/50",
    );
    function View(classes: string) {
      return <div className={classes} />;
    }`,
  );
  assert.deepEqual(violations, []);
});

test("destructured parameterのdefault initializerを解決する", () => {
  const { violations } = checkFile(
    "a.tsx",
    `function View({
      classes = cn(
        "focus-visible:ring-[3px]",
        "ring-ring/50",
      ),
    }: { classes?: string }) {
      return <div className={classes} />;
    }`,
  );
  assert.ok(
    violations.some((violation) => violation.rule === "focus-ring-opacity"),
    "destructured parameterのdefaultで透明なfocus ringが隠れている",
  );
});

test("block内varをfunction scopeのbindingとして解決する", () => {
  const { violations } = checkFile(
    "a.tsx",
    `function View() {
      if (true) {
        var classes = cn(
          "focus-visible:ring-[3px]",
          "ring-ring/50",
        );
      }
      return <div className={classes} />;
    }`,
  );
  assert.ok(
    violations.some((violation) => violation.rule === "focus-ring-opacity"),
    "block内varのfunction scopeで透明なfocus ringが隠れている",
  );
});

test("ternaryの相互排他branchを同時適用と誤認しない", () => {
  const { violations } = checkFile(
    "a.tsx",
    `const View = ({ active }: { active: boolean }) => (
      <div
        className={
          active
            ? "focus-visible:ring-[3px]"
            : "ring-ring/50"
        }
      />
    );`,
  );
  assert.deepEqual(violations, []);
});

test("相反するboolean条件のclassを同時適用と誤認しない", () => {
  const { violations } = checkFile(
    "a.tsx",
    `const View = ({ active }: { active: boolean }) => (
      <div
        className={cn(
          active && "focus-visible:ring-[3px]",
          !active && "ring-ring/50",
        )}
      />
    );`,
  );
  assert.deepEqual(violations, []);
});

test("別receiverの同名property条件を相反条件と誤認しない", () => {
  const { violations } = checkFile(
    "a.tsx",
    `type State = { active: boolean };
    const View = ({ a, b }: { a: State; b: State }) => (
      <div
        className={cn(
          a.active && "focus-visible:ring-[3px]",
          !b.active && "ring-ring/50",
        )}
      />
    );`,
  );
  assert.ok(
    violations.some((violation) => violation.rule === "focus-ring-opacity"),
    "別receiverで同時成立できる透明なfocus ringが隠れている",
  );
});

test("literalとの比較を相反条件として正規化する", () => {
  for (const [name, type, condition, inverse] of [
    ["active", "boolean", "active === true", "active !== true"],
    ["mode", '"focus" | "rest"', 'mode === "focus"', 'mode !== "focus"'],
  ]) {
    const { violations } = checkFile(
      "a.tsx",
      `const View = ({ ${name} }: { ${name}: ${type} }) => (
        <div
          className={cn(
            ${condition} && "focus-visible:ring-[3px]",
            ${inverse} && "ring-ring/50",
          )}
        />
      );`,
    );
    assert.deepEqual(violations, [], `${condition} / ${inverse}`);
  }
});

test("element accessとshorthand propertyのinitializerを解決する", () => {
  for (const classExpression of ['styles["ring"]', "styles.ring"]) {
    const { violations } = checkFile(
      "a.tsx",
      `const ring = cn(
        "focus-visible:ring-[3px]",
        "ring-ring/50",
      );
      const styles = { ring };
      const View = () => <div className={${classExpression}} />;`,
    );
    assert.ok(
      violations.some((violation) => violation.rule === "focus-ring-opacity"),
      `${classExpression} で透明なfocus ringが隠れている`,
    );
  }
});

test("論理fallbackとtemplate interpolationの候補を解析する", () => {
  const templateInterpolation = ["`", "$", "{classes}", "`"].join("");
  for (const classExpression of ['classes || ""', 'classes ?? ""', templateInterpolation]) {
    const { violations } = checkFile(
      "a.tsx",
      `const classes = cn(
        "focus-visible:ring-[3px]",
        "ring-ring/50",
      );
      const View = () => <div className={${classExpression}} />;`,
    );
    assert.ok(
      violations.some((violation) => violation.rule === "focus-ring-opacity"),
      `${classExpression} で透明なfocus ringが隠れている`,
    );
  }
});

test("引数なしlocal helperの静的returnを解析する", () => {
  for (const helper of [
    `function unsafeClasses() {
      return cn(
        "focus-visible:ring-[3px]",
        "ring-ring/50",
      );
    }`,
    `const unsafeClasses = () => cn(
      "focus-visible:ring-[3px]",
      "ring-ring/50",
    );`,
  ]) {
    const { violations } = checkFile(
      "a.tsx",
      `${helper}
      const View = () => <div className={unsafeClasses()} />;`,
    );
    assert.ok(
      violations.some((violation) => violation.rule === "focus-ring-opacity"),
      "local helperのreturnで透明なfocus ringが隠れている",
    );
  }
});

test("別fileからimportしたclass initializerを解決する", () => {
  const results = checkFiles(
    new Map([
      [
        "src/shared.tsx",
        `export const invalidSharedClasses = cn(
          "focus-visible:ring-[3px]",
          "ring-ring/50",
        );`,
      ],
      [
        "src/view.tsx",
        `import { invalidSharedClasses } from "./shared";
        export const View = () => <div className={invalidSharedClasses} />;`,
      ],
    ]),
  );
  assert.ok(
    results
      .get("src/view.tsx")
      .violations.some((violation) => violation.rule === "focus-ring-opacity"),
    "importしたinitializerで透明なfocus ringが隠れている",
  );
});

test("2 規定へ同時に違反するクラスは 2 診断とも出す", () => {
  // ring-[#f00]/50 は任意値であり、かつ透明度合成でもある。
  // focus-ring-opacity だけを assert すると、ARBITRARY 側が
  // ring-[#f00] を検出しなくなる回帰を素通りさせる。両方を固定する。
  const { violations } = checkFile("a.tsx", `className="focus-visible:ring-[#f00]/50"`);
  const rules = new Set(violations.map((v) => v.rule));
  assert.ok(rules.has("focus-ring-opacity"), "focus-ring-opacity が無い");
  assert.ok(rules.has("arbitrary-value"), "arbitrary-value が無い");
});

test("許可済み例外の ring-[3px] は違反にしない", () => {
  const { violations } = checkFile(
    "a.tsx",
    `className="focus-visible:ring-[3px] focus-visible:ring-ring"`,
  );
  assert.deepEqual(violations, []);
});

test("値系ユーティリティの arbitrary value を検出する", () => {
  const { violations } = checkFile("a.tsx", `className="rounded-[min(var(--radius-md),10px)]"`);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, "arbitrary-value");
});

test("値系ユーティリティなら bg と text も検出する", () => {
  const src = `className="bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] text-[0.8rem]"`;
  const { violations } = checkFile("a.tsx", src);
  assert.equal(violations.length, 2);
});

// ここから 4 件は「正当な Tailwind の variant 構文」であり違反ではない。
// AUDIT.md の arbitrary value 検査は「値系ユーティリティのみ対象。
// data-[...] / aria-[...] 等の variant 構文は正当なので除外」と定めている。
// 素朴な /\b[a-z-]+-\[[^\]]+\]/ はこれらを誤検知し、実行者が
// Base UI の状態スタイルを推測で削る誤実装へ誘導する。
test("has-data- の variant 構文は違反にしない", () => {
  const { violations } = checkFile("a.tsx", `className="has-data-[icon=inline-end]:pr-1.5"`);
  assert.deepEqual(violations, []);
});

test("in-data- の variant 構文は違反にしない", () => {
  const { violations } = checkFile("a.tsx", `className="in-data-[slot=button-group]:rounded-lg"`);
  assert.deepEqual(violations, []);
});

test("not-aria- の variant 構文は違反にしない", () => {
  const { violations } = checkFile(
    "a.tsx",
    `className="active:not-aria-[haspopup]:translate-y-px"`,
  );
  assert.deepEqual(violations, []);
});

test("任意セレクタの variant 構文は違反にしない", () => {
  const { violations } = checkFile("a.tsx", `className="[&_svg]:pointer-events-none"`);
  assert.deepEqual(violations, []);
});

test("dark variant の宣言は違反にしない", () => {
  const { violations } = checkFile("a.css", `@custom-variant dark (&:is(.dark *));`);
  assert.deepEqual(violations, []);
});

test("真のときだけ存在させる data-inset に boolean を直接渡す実装を検出する", () => {
  const { violations } = checkFile("a.tsx", `data-inset={inset}`);
  assert.deepEqual(violations, [
    { rule: "boolean-data-inset", line: 1, text: "data-inset={inset}" },
  ]);
});

test("data-inset の false と undefined を属性なしへ正規化する実装を受理する", () => {
  const { violations } = checkFile("a.tsx", `data-inset={inset ? "" : undefined}`);
  assert.deepEqual(violations, []);
});

test("Context Menu preview のtriggerはkeyboard focusとcontextmenu keyを受けられる", () => {
  const source = readSource("src/previews/context-menu.tsx");
  assert.match(source, /<ContextMenuTrigger[\s\S]*?render=\{<button type="button" \/>\}/);
  assert.match(source, /onKeyDown=\{handleContextMenuKey\}/);
  assert.match(source, /event\.key === "ContextMenu"/);
  assert.match(source, /event\.shiftKey && event\.key === "F10"/);
  assert.match(source, /new MouseEvent\("contextmenu"/);
  assert.match(source, /<ContextMenuTrigger[\s\S]*?focus-visible:ring-3 focus-visible:ring-ring/);
});

test("Navigation Menu contentは子linkのfocus ringを打ち消さない", () => {
  const source = readSource("src/components/ui/navigation-menu.tsx");
  assert.doesNotMatch(source, /\*\*:data-\[slot=navigation-menu-link\]:focus:ring-0/);
  assert.doesNotMatch(source, /\*\*:data-\[slot=navigation-menu-link\]:focus:outline-none/);
});

test("Select itemはkeyboard focusを不透明3px ringで示す", () => {
  const source = readSource("src/components/ui/select.tsx");
  const start = source.indexOf("function SelectItem(");
  const end = source.indexOf("function SelectScrollUpButton(");
  assert.notEqual(start, -1, "SelectItemが存在しない");
  assert.notEqual(end, -1, "SelectItemの終端が見つからない");
  const selectItem = source.slice(start, end);
  assert.match(selectItem, /focus-visible:ring-3 focus-visible:ring-ring/);
});

test("Alert Dialog actionはClose primitiveを経由する", () => {
  const source = readSource("src/components/ui/alert-dialog.tsx");
  const start = source.indexOf("function AlertDialogAction(");
  const end = source.indexOf("function AlertDialogCancel(");
  assert.notEqual(start, -1, "AlertDialogActionが存在しない");
  assert.notEqual(end, -1, "AlertDialogActionの終端が見つからない");
  const action = source.slice(start, end);
  assert.match(action, /<AlertDialogPrimitive\.Close/);
  assert.match(action, /render=\{<Button/);
});

test("Sheet overlayはsemantic tokenを使う", () => {
  const source = readSource("src/components/ui/sheet.tsx");
  const start = source.indexOf("function SheetOverlay(");
  const end = source.indexOf("type SheetContentProps");
  assert.notEqual(start, -1, "SheetOverlayが存在しない");
  assert.notEqual(end, -1, "SheetOverlayの終端が見つからない");
  const overlay = source.slice(start, end);
  assert.match(overlay, /bg-overlay/);
  assert.doesNotMatch(overlay, /bg-black\/10/);
});

test("mobile Sidebarは公開div propsを表示DOMへ渡す", () => {
  const source = readSource("src/components/ui/sidebar.tsx");
  const start = source.indexOf("if (isMobile)");
  const end = source.indexOf('className="group peer hidden');
  assert.notEqual(start, -1, "mobile分岐が存在しない");
  assert.notEqual(end, -1, "desktop分岐が見つからない");
  const mobile = source.slice(start, end);
  const sheetRoot = mobile.match(/<Sheet\b[^>]*>/)?.[0];
  assert.ok(sheetRoot, "Sheet Rootの開始タグが見つからない");
  assert.doesNotMatch(sheetRoot, /\.\.\.props/);
  assert.match(mobile, /<SheetContent[\s\S]*?className=\{cn\([\s\S]*?className/);
  assert.match(mobile, /style=\{[\s\S]*?\.\.\.style[\s\S]*?\}/);
  assert.match(mobile, /<SheetContent[\s\S]*?\{\.\.\.props\}/);
});

test("ToggleGroupは公開styleとspacingのgap変数を両方保持する", () => {
  const source = readSource("src/components/ui/toggle-group.tsx");
  const start = source.indexOf("function ToggleGroup<");
  const end = source.indexOf("export type ToggleGroupItemProps");
  assert.notEqual(start, -1, "ToggleGroupが存在しない");
  assert.notEqual(end, -1, "ToggleGroupの終端が見つからない");
  const group = source.slice(start, end);
  assert.match(group, /children,\s+style,\s+\.\.\.props/);
  assert.match(group, /style=\{[\s\S]*?\.\.\.style,[\s\S]*?"--toggle-group-gap"/);
  const preview = readSource("src/previews/toggle-group.tsx");
  assert.match(preview, /spacing=\{0\}[\s\S]*?style=\{\{ touchAction: "manipulation" \}\}/);
});

test("Sidebarはdirを全表示経路のDOMへ渡す", () => {
  const source = readSource("src/components/ui/sidebar.tsx");
  const start = source.indexOf("function Sidebar({");
  const mobileStart = source.indexOf("if (isMobile)", start);
  const desktopStart = source.indexOf('className="group peer hidden', mobileStart);
  const end = source.indexOf("type SidebarTriggerProps", desktopStart);
  assert.notEqual(start, -1, "Sidebarが存在しない");
  assert.notEqual(mobileStart, -1, "mobile分岐が存在しない");
  assert.notEqual(desktopStart, -1, "desktop分岐が存在しない");
  assert.notEqual(end, -1, "Sidebarの終端が見つからない");
  assert.match(source.slice(start, mobileStart), /<div[\s\S]*?dir=\{dir\}/);
  assert.match(source.slice(mobileStart, desktopStart), /<SheetContent[\s\S]*?dir=\{dir\}/);
  assert.match(source.slice(desktopStart, end), /data-slot="sidebar-container"[\s\S]*?dir=\{dir\}/);
  const preview = readSource("src/previews/sidebar.tsx");
  assert.match(preview, /data-preview-props="forwarded"[\s\S]*?dir="ltr"/);
});

test("ChartStyleはcustom idを引用済みCSS文字列としてselectorへ埋め込む", () => {
  const source = readSource("src/components/ui/chart.tsx");
  assert.match(source, /function escapeCssString\(/);
  assert.match(source, /\[data-chart="\$\{escapeCssString\(id\)\}"\]/);
  assert.doesNotMatch(source, /\[data-chart=\$\{id\}\]/);
});

test("InputGroup addonはinputとtextarea共通のcontrolをfocusする", () => {
  const source = readSource("src/components/ui/input-group.tsx");
  const start = source.indexOf("function InputGroupAddon(");
  const end = source.indexOf("const inputGroupButtonVariants", start);
  assert.notEqual(start, -1, "InputGroupAddonが存在しない");
  assert.notEqual(end, -1, "InputGroupAddonの終端が見つからない");
  const addon = source.slice(start, end);
  assert.match(addon, /querySelector<HTMLElement>\("\[data-slot=input-group-control\]"\)/);
  assert.doesNotMatch(addon, /querySelector\("input"\)/);
});

test("SidebarMenuSkeletonはSSRとhydrationで同じ幅を使う", () => {
  const source = readSource("src/components/ui/sidebar.tsx");
  const start = source.indexOf("function SidebarMenuSkeleton(");
  const end = source.indexOf("type SidebarMenuSubProps", start);
  assert.notEqual(start, -1, "SidebarMenuSkeletonが存在しない");
  assert.notEqual(end, -1, "SidebarMenuSkeletonの終端が見つからない");
  const skeleton = source.slice(start, end);
  assert.doesNotMatch(skeleton, /Math\.random/);
  assert.match(skeleton, /const width = "70%"/);
});

test("レビュー修正を実ブラウザで到達できるpreview probeがある", () => {
  const chart = readSource("src/previews/chart.tsx");
  const inputGroup = readSource("src/previews/input-group.tsx");
  const sidebar = readSource("src/previews/sidebar.tsx");
  assert.match(chart, /id="利用者:2026"/);
  assert.match(inputGroup, /InputGroupTextarea/);
  assert.match(inputGroup, /data-input-group-textarea-addon/);
  assert.match(sidebar, /<SidebarMenuSkeleton showIcon/);
});
