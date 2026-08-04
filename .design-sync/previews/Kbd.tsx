import {
  Kbd,
  KbdGroup,
} from "ui-scaffold";

export function Overview() {
  return (
    <section data-slot="kbd-preview" className="space-y-4 p-6" aria-labelledby="kbd-preview-title">
      <div className="flex items-center gap-3">
        <p id="kbd-preview-title" className="text-sm text-muted-foreground">
          単独ショートカット
        </p>
        <Kbd>Esc</Kbd>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">コマンドパレット</p>
        <KbdGroup aria-label="コマンドパレットのショートカット">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </div>
    </section>
  );
}
