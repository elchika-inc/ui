import { CheckIcon, CopyIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { IconSwap, IconSwapFrom, IconSwapTo } from "@/components/ui/icon-swap";

export function IconSwapPreview() {
  const [swapped, setSwapped] = React.useState(false);
  return (
    <section data-slot="icon-swap-preview" className="max-w-xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-base font-medium text-foreground">アイコンの切り替え</h1>
        <p className="text-sm text-muted-foreground">
          状態の変化を、重ねたアイコンの入れ替えで伝えます。
        </p>
      </div>
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          aria-pressed={swapped}
          onClick={() => setSwapped(!swapped)}
        >
          <IconSwap swapped={swapped} aria-hidden="true">
            <IconSwapFrom>
              <CopyIcon className="size-4" />
            </IconSwapFrom>
            <IconSwapTo>
              <CheckIcon className="size-4" />
            </IconSwapTo>
          </IconSwap>
          {swapped ? "コピー済み" : "コピーする"}
        </Button>
      </div>
    </section>
  );
}
