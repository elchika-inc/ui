import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "ui-scaffold";

export function Overview() {
  const mode = "isolated";
  return (
    <section data-slot="popover-preview" className="flex max-w-xl flex-col gap-3 p-6">      <Popover defaultOpen={mode === "isolated"} modal={false}>
        <PopoverTrigger className="w-fit rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring">
          設定を開く
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>通知設定</PopoverTitle>
            <PopoverDescription>通知方法を確認して変更できます。</PopoverDescription>
          </PopoverHeader>
          <button
            type="button"
            className="w-fit rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
          >
            通知を管理
          </button>
        </PopoverContent>
      </Popover>    </section>
  );
}
