import { useState } from "react";

import { PreviewSentinel } from "@/catalog/preview-sentinel";
import type { PreviewProps } from "@/catalog/preview-types";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const labels: Record<string, string> = {
  compact: "コンパクト",
  comfortable: "ゆったり",
  spacious: "広々",
};

export function SelectPreview({ mode = "isolated" }: PreviewProps) {
  const [selectedValue, setSelectedValue] = useState("comfortable");

  return (
    <section data-slot="select-preview" className="flex max-w-xl flex-col gap-3 p-6">
      <PreviewSentinel mode={mode} position="before" />
      <label htmlFor="density-select" className="text-sm font-medium">
        表示密度
      </label>
      <Select
        defaultOpen={mode === "isolated"}
        defaultValue="comfortable"
        modal={false}
        onValueChange={(value) => setSelectedValue(String(value))}
      >
        <SelectTrigger id="density-select" aria-label="表示密度" className="min-w-40">
          <SelectValue>{(value) => labels[String(value)] ?? "選択してください"}</SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-48">
          <SelectGroup>
            <SelectLabel>利用可能</SelectLabel>
            <SelectItem value="compact">コンパクト</SelectItem>
            <SelectItem value="comfortable">ゆったり</SelectItem>
            <SelectItem value="spacious">広々</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>準備中</SelectLabel>
            <SelectItem value="automatic" disabled>
              自動（準備中）
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <output data-slot="select-selected-value" className="text-sm text-muted-foreground">
        選択値: {labels[selectedValue]}
      </output>
      <PreviewSentinel mode={mode} position="after" />
    </section>
  );
}
