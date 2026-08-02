import { useState } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ToggleGroupPreview() {
  const [singleValue, setSingleValue] = useState<string[]>(["center"]);
  const [multipleValue, setMultipleValue] = useState<string[]>(["bold"]);

  return (
    <section
      data-slot="toggle-group-preview"
      className="grid max-w-md gap-8 p-6"
      aria-labelledby="toggle-group-preview-title"
    >
      <div className="space-y-1">
        <h1 id="toggle-group-preview-title" className="text-base font-medium text-foreground">
          表示形式
        </h1>
        <p className="text-sm text-muted-foreground">
          単一選択と複数選択、それぞれの方向キー移動を確認できます。
        </p>
      </div>

      <div className="grid gap-3 text-sm">
        <h2 className="font-medium text-foreground">単一選択</h2>
        <ToggleGroup
          aria-label="文字揃え"
          data-preview-group="single"
          value={singleValue}
          onValueChange={setSingleValue}
          variant="outline"
          spacing={0}
          style={{ touchAction: "manipulation" }}
        >
          <ToggleGroupItem value="left">左揃え</ToggleGroupItem>
          <ToggleGroupItem value="center">中央揃え</ToggleGroupItem>
          <ToggleGroupItem value="right">右揃え</ToggleGroupItem>
        </ToggleGroup>
        <output data-slot="toggle-group-single-status" aria-live="polite">
          選択: {singleValue[0] ?? "なし"}
        </output>
      </div>

      <div className="grid gap-3 text-sm">
        <h2 className="font-medium text-foreground">複数選択</h2>
        <ToggleGroup
          aria-label="文字装飾"
          data-preview-group="multiple"
          value={multipleValue}
          onValueChange={setMultipleValue}
          multiple
          orientation="vertical"
          className="items-start"
        >
          <ToggleGroupItem value="bold">太字</ToggleGroupItem>
          <ToggleGroupItem value="italic">斜体</ToggleGroupItem>
          <ToggleGroupItem value="underline">下線</ToggleGroupItem>
        </ToggleGroup>
        <output data-slot="toggle-group-multiple-status" aria-live="polite">
          選択: {multipleValue.length > 0 ? multipleValue.join(", ") : "なし"}
        </output>
      </div>
    </section>
  );
}
