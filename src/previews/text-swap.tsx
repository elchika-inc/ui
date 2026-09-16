import * as React from "react";

import { Button } from "@/components/ui/button";
import { TextSwap } from "@/components/ui/text-swap";

export function TextSwapPreview() {
  const [index, setIndex] = React.useState(0);
  const states = ["下書き", "確認中", "公開しました"];
  return (
    <section data-slot="text-swap-preview" className="max-w-xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-base font-medium text-foreground">テキストの切り替え</h1>
        <p className="text-sm text-muted-foreground">
          直前の文字列を退場させながら、次の状態を表示します。
        </p>
      </div>
      <div className="space-y-4">
        <div className="text-lg" role="status">
          <TextSwap value={states[index] ?? ""} />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIndex((previous) => (previous + 1) % states.length)}
        >
          次のテキストへ
        </Button>
      </div>
    </section>
  );
}
