import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "ui-scaffold";

export function Overview() {
  const mode = "isolated";
  return (
    <div data-slot="collapsible-preview" className="flex max-w-xl flex-col gap-3 p-6">      <Collapsible
        defaultOpen={mode === "isolated"}
        className="rounded-lg border border-border p-4"
      >
        <CollapsibleTrigger>詳細を表示</CollapsibleTrigger>
        <CollapsibleContent>
          <p className="h-(--collapsible-panel-height) pt-3 text-muted-foreground">
            追加の設定と関連情報を確認できます。
          </p>
        </CollapsibleContent>
      </Collapsible>    </div>
  );
}
