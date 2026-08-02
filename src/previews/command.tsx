import { useState } from "react";
import type { PreviewProps } from "@/catalog/preview-types";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

const commands = [
  { label: "プロフィールを開く", shortcut: "⌘P" },
  { label: "請求情報を開く", shortcut: "⌘B" },
  { label: "設定を開く", shortcut: "⌘S" },
] as const;

type CommandMenuProps = {
  inputLabel: string;
  selection: string | null;
  onSelect: (value: string) => void;
};

function CommandMenu({ inputLabel, selection, onSelect }: CommandMenuProps) {
  return (
    <Command className="h-56 border">
      <CommandInput aria-label={inputLabel} placeholder="コマンドを検索" />
      <CommandList>
        <CommandEmpty>該当するコマンドはありません</CommandEmpty>
        <CommandGroup heading="操作">
          {commands.map(({ label, shortcut }) => (
            <CommandItem
              key={label}
              value={label}
              data-checked={selection === label ? "true" : undefined}
              onSelect={() => onSelect(label)}
            >
              {label}
              <CommandShortcut>{shortcut}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export function CommandPreview({ mode = "isolated" }: PreviewProps) {
  const [inlineSelection, setInlineSelection] = useState<string | null>(null);
  const [dialogSelection, setDialogSelection] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const selectDialogCommand = (value: string) => {
    setDialogSelection(value);
    setDialogOpen(false);
  };

  return (
    <section data-slot="command-preview" className="grid gap-6 p-6">
      <div className="grid gap-2">
        <h2 className="text-sm font-medium">インラインコマンド</h2>
        <CommandMenu
          inputLabel="インラインコマンドを検索"
          selection={inlineSelection}
          onSelect={setInlineSelection}
        />
        <output data-slot="command-inline-status" className="text-sm text-muted-foreground">
          選択: {inlineSelection ?? "なし"}
        </output>
      </div>

      {mode === "isolated" && (
        <div className="flex items-center gap-4">
          <Button data-slot="command-dialog-trigger" onClick={() => setDialogOpen(true)}>
            コマンドパレットを開く
          </Button>
          <output data-slot="command-dialog-status" className="text-sm text-muted-foreground">
            選択: {dialogSelection ?? "なし"}
          </output>
        </div>
      )}

      <CommandDialog open={dialogOpen} onOpenChange={setDialogOpen} showCloseButton>
        <CommandMenu
          inputLabel="ダイアログコマンドを検索"
          selection={dialogSelection}
          onSelect={selectDialogCommand}
        />
      </CommandDialog>
    </section>
  );
}
