import { useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

const frameworks = ["Astro", "React", "Svelte", "Vue"];

export function ComboboxPreview() {
  const [value, setValue] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <section
      data-slot="combobox-preview"
      className="grid max-w-md gap-6 p-6"
      aria-labelledby="combobox-preview-title"
    >
      <div className="space-y-1">
        <h1 id="combobox-preview-title" className="text-base font-medium text-foreground">
          フレームワーク選択
        </h1>
        <p className="text-sm text-muted-foreground">
          入力による絞り込みとキーボード選択を確認できます。
        </p>
      </div>

      <Combobox
        items={frameworks}
        value={value}
        onValueChange={setValue}
        open={open}
        onOpenChange={setOpen}
      >
        <ComboboxInput
          aria-label="フレームワーク"
          placeholder="選択または検索"
          showClear={value !== null}
        />
        <ComboboxContent>
          <ComboboxEmpty>該当する項目はありません</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      <output data-slot="combobox-status" data-open={open} aria-live="polite">
        選択: {value ?? "なし"} / {open ? "開いています" : "閉じています"}
      </output>

      <button type="button" data-slot="combobox-after" className="w-fit underline">
        次の操作
      </button>
    </section>
  );
}
