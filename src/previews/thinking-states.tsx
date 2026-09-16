import * as React from "react";

import { Button } from "@/components/ui/button";
import { ThinkingStates } from "@/components/ui/thinking-states";

export function ThinkingStatesPreview() {
  const [active, setActive] = React.useState(0);
  const states = ["内容を確認しています", "関連する情報を整理しています", "回答をまとめています"];
  return (
    <section data-slot="thinking-states-preview" className="max-w-xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-base font-medium text-foreground">処理状況の表示</h1>
        <p className="text-sm text-muted-foreground">
          進行中の作業を、スピナーと切り替わるテキストで伝えます。
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <ThinkingStates states={states} active={active} />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setActive((previous) => (previous + 1) % states.length)}
        >
          次の処理へ
        </Button>
      </div>
    </section>
  );
}
