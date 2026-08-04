import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "ui-scaffold";

export function Overview() {
  const mode = "isolated";
  return (
    <section data-slot="resizable-preview" className="flex max-w-xl flex-col gap-3 p-6">      <div className="h-56">
        <ResizablePanelGroup
          id="resizable-preview-group"
          orientation="horizontal"
          className="rounded-lg border border-border bg-card"
        >
          <ResizablePanel id="resizable-preview-left" defaultSize="50" minSize="25">
            <div className="flex size-full items-center justify-center p-4 text-center text-card-foreground">
              左のパネル
            </div>
          </ResizablePanel>
          <ResizableHandle id="resizable-preview-handle" withHandle />
          <ResizablePanel id="resizable-preview-right" defaultSize="50" minSize="25">
            <div className="flex size-full items-center justify-center p-4 text-center text-card-foreground">
              右のパネル
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>    </section>
  );
}
