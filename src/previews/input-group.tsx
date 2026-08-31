import { Check, Copy, Search } from "lucide-react";
import { useState } from "react";
import type { PreviewProps } from "@/catalog/preview-types";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";

export function InputGroupPreview(_props: PreviewProps) {
  const [copied, setCopied] = useState(false);

  return (
    <div data-slot="input-group-preview" className="mx-auto grid max-w-xl gap-6 p-6">
      <InputGroup>
        <InputGroupAddon>
          <Search aria-hidden="true" />
          <InputGroupText>検索</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="サイト内検索" placeholder="キーワードを入力" />
      </InputGroup>

      <InputGroup>
        <InputGroupInput
          aria-label="共有 URL"
          defaultValue="https://elchika.example/share"
          readOnly
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="URLをコピー" onClick={() => setCopied(true)}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      <InputGroup>
        <InputGroupAddon align="block-start" data-input-group-textarea-addon>
          <InputGroupText>メモ</InputGroupText>
        </InputGroupAddon>
        <InputGroupTextarea aria-label="共有メモ" defaultValue="共有内容を確認してください" />
      </InputGroup>

      <InputGroup data-preview-state="disabled">
        <InputGroupAddon>
          <InputGroupText>無効</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="無効な入力" defaultValue="編集できません" disabled />
      </InputGroup>

      <p role="status" className="text-sm text-muted-foreground">
        {copied ? "コピーしました" : "コピー操作を確認できます"}
      </p>
    </div>
  );
}
