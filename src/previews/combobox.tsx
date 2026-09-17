import { useState } from "react";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";

const frameworks = ["Astro", "React", "Svelte", "Vue"];

export function ComboboxPreview() {
  const [value, setValue] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const anchor = useComboboxAnchor();

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

      <div className="grid gap-2">
        <label htmlFor="combobox-multiple" className="text-sm font-medium">
          複数のフレームワーク
        </label>
        <Combobox multiple items={frameworks} defaultValue={["Astro", "React"]}>
          <ComboboxChips ref={anchor}>
            <ComboboxValue>
              {(values: string[]) =>
                values.map((item) => (
                  <ComboboxChip key={item} aria-label={item}>
                    {item}
                  </ComboboxChip>
                ))
              }
            </ComboboxValue>
            <ComboboxChipsInput id="combobox-multiple" placeholder="追加する" />
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>該当する項目はありません</ComboboxEmpty>
            <ComboboxList>
              <ComboboxGroup>
                <ComboboxLabel>フレームワーク</ComboboxLabel>
                <ComboboxCollection>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      <button type="button" data-slot="combobox-after" className="w-fit underline">
        次の操作
      </button>
    </section>
  );
}
