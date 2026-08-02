import { useState } from "react";

import { PreviewSentinel } from "@/catalog/preview-sentinel";
import type { PreviewProps } from "@/catalog/preview-types";
import { Input } from "@/components/ui/input";
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
  compact: "Compact（コンパクト）",
  comfortable: "Relaxed（ゆったり）",
  editorial: "Editorial（編集向け）",
  presentation: "Presentation（プレゼン向け）",
  standard: "Standard（標準）",
  spacious: "Wide（広々）",
};

export function SelectPreview({ mode = "isolated" }: PreviewProps) {
  const [selectedValue, setSelectedValue] = useState("comfortable");

  return (
    <section data-slot="select-preview" className="flex max-w-xl flex-col gap-3 p-6">
      <PreviewSentinel mode={mode} position="before" />
      <label htmlFor="density-select" className="text-sm font-medium">
        表示密度
      </label>
      <div data-slot="select-input-comparison" className="grid gap-3 sm:grid-cols-2">
        <Input aria-label="表示密度の比較入力" placeholder="Input の placeholder" />
        <Select
          defaultOpen={mode === "isolated"}
          defaultValue="comfortable"
          onValueChange={(value) => setSelectedValue(String(value))}
        >
          <SelectTrigger id="density-select" aria-label="表示密度" className="w-full min-w-40">
            <SelectValue>{(value) => labels[String(value)] ?? "選択してください"}</SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-32">
            <SelectGroup>
              <SelectLabel>利用可能</SelectLabel>
              <SelectItem value="compact">Compact（コンパクト）</SelectItem>
              <SelectItem value="comfortable">Relaxed（ゆったり）</SelectItem>
              <SelectItem value="standard">Standard（標準）</SelectItem>
              <SelectItem value="spacious">Wide（広々）</SelectItem>
              <SelectItem value="editorial">Editorial（編集向け）</SelectItem>
              <SelectItem value="presentation">Presentation（プレゼン向け）</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>準備中</SelectLabel>
              <SelectItem value="automatic" disabled>
                Automatic（自動・準備中）
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <output data-slot="select-selected-value" className="text-sm text-muted-foreground">
        選択値: {labels[selectedValue]}
      </output>
      <PreviewSentinel mode={mode} position="after" />
    </section>
  );
}
