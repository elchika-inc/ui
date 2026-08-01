import { Checkbox } from "@/components/ui/checkbox";

export function CheckboxPreview() {
  return (
    <section
      data-slot="checkbox-preview"
      className="max-w-sm space-y-5 p-6"
      aria-labelledby="checkbox-preview-title"
    >
      <div className="space-y-1">
        <h1 id="checkbox-preview-title" className="text-base font-medium text-foreground">
          選択項目
        </h1>
        <p className="text-sm text-muted-foreground">
          チェックボックスの各状態と操作を確認できます。
        </p>
      </div>
      <div className="grid gap-4 text-sm">
        <label className="flex w-fit items-center gap-3" htmlFor="checkbox-unchecked">
          <Checkbox id="checkbox-unchecked" data-preview-checkbox="unchecked" />
          未選択
        </label>
        <label className="flex w-fit items-center gap-3" htmlFor="checkbox-checked">
          <Checkbox id="checkbox-checked" data-preview-checkbox="checked" defaultChecked />
          選択済み
        </label>
        <label className="flex w-fit items-center gap-3" htmlFor="checkbox-indeterminate">
          <Checkbox
            id="checkbox-indeterminate"
            data-preview-checkbox="indeterminate"
            indeterminate
          />
          一部選択
        </label>
        <label
          className="flex w-fit items-center gap-3 text-muted-foreground"
          htmlFor="checkbox-disabled"
        >
          <Checkbox
            id="checkbox-disabled"
            data-preview-checkbox="disabled"
            defaultChecked
            disabled
          />
          無効
        </label>
      </div>
    </section>
  );
}
