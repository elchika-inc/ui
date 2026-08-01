import { useState } from "react";

import { Textarea } from "@/components/ui/textarea";

const INITIAL_VALUE = "確認事項を入力してください。";

export function TextareaPreview() {
  const [value, setValue] = useState(INITIAL_VALUE);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [focused, setFocused] = useState(false);

  const updateSelection = (textarea: HTMLTextAreaElement) => {
    setSelection({ start: textarea.selectionStart, end: textarea.selectionEnd });
  };

  return (
    <section
      data-slot="textarea-preview"
      className="grid max-w-sm gap-5 p-6"
      aria-labelledby="textarea-preview-title"
    >
      <h1 id="textarea-preview-title" className="text-base font-medium text-foreground">
        メモ
      </h1>

      <div className="grid gap-2 text-sm">
        <label htmlFor="textarea-editable">編集可能</label>
        <Textarea
          id="textarea-editable"
          data-preview-textarea="editable"
          value={value}
          aria-describedby="textarea-status"
          onChange={(event) => {
            setValue(event.currentTarget.value);
            updateSelection(event.currentTarget);
          }}
          onSelect={(event) => updateSelection(event.currentTarget)}
          onFocus={(event) => {
            setFocused(true);
            updateSelection(event.currentTarget);
          }}
          onBlur={(event) => {
            setFocused(false);
            updateSelection(event.currentTarget);
          }}
        />
        <output
          id="textarea-status"
          data-slot="textarea-status"
          data-value={value}
          data-selection-start={selection.start}
          data-selection-end={selection.end}
          data-focused={focused}
          aria-live="polite"
          className="text-muted-foreground"
        >
          入力値: {value} / 選択: {selection.start}-{selection.end} / フォーカス:{" "}
          {focused ? "あり" : "なし"}
        </output>
      </div>

      <div className="grid gap-2 text-sm text-muted-foreground">
        <label htmlFor="textarea-disabled">無効</label>
        <Textarea
          id="textarea-disabled"
          data-preview-textarea="disabled"
          defaultValue="管理者によって編集が無効です。"
          disabled
        />
      </div>

      <div className="grid gap-2 text-sm">
        <label htmlFor="textarea-readonly">読み取り専用</label>
        <Textarea
          id="textarea-readonly"
          data-preview-textarea="readonly"
          defaultValue="確認済みの内容です。"
          readOnly
        />
      </div>
    </section>
  );
}
