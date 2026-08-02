import type { PreviewProps } from "@/catalog/preview-types";
import { DirectionProvider, useDirection } from "@/components/ui/direction";

type DirectionConsumerProps = {
  label: string;
};

function DirectionConsumer({ label }: DirectionConsumerProps) {
  const direction = useDirection();

  return (
    <div
      data-slot="direction-consumer"
      data-direction={direction}
      className="grid gap-4 rounded-md border border-border bg-card p-5 text-card-foreground"
    >
      <div className="space-y-1">
        <h2 className="font-medium">{label}</h2>
        <p className="text-sm text-muted-foreground">hook 解決値: {direction}</p>
      </div>
      <div
        data-slot="direction-logical-row"
        className="flex justify-between rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
      >
        <span data-edge="start">開始</span>
        <span data-edge="end">終了</span>
      </div>
    </div>
  );
}

export function DirectionPreview({ mode = "isolated" }: PreviewProps) {
  return (
    <section
      data-slot="direction-preview"
      data-preview-mode={mode}
      className="grid max-w-2xl gap-6 p-6"
      aria-labelledby="direction-preview-title"
    >
      <div className="space-y-1">
        <h1 id="direction-preview-title" className="text-base font-medium text-foreground">
          文字方向
        </h1>
        <p className="text-sm text-muted-foreground">
          DOM の文字方向と DirectionProvider の解決値を比較します。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div data-slot="direction-region" data-direction="ltr" dir="ltr">
          <DirectionProvider direction="ltr">
            <DirectionConsumer label="左から右" />
          </DirectionProvider>
        </div>
        <div data-slot="direction-region" data-direction="rtl" dir="rtl">
          <DirectionProvider direction="rtl">
            <DirectionConsumer label="右から左" />
          </DirectionProvider>
        </div>
      </div>
    </section>
  );
}
