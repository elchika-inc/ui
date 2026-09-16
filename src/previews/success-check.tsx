import * as React from "react";

import { Button } from "@/components/ui/button";
import { SuccessCheck } from "@/components/ui/success-check";

export function SuccessCheckPreview() {
  const [checked, setChecked] = React.useState(false);
  return (
    <section data-slot="success-check-preview" className="max-w-xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-base font-medium text-foreground">完了のチェック</h1>
        <p className="text-sm text-muted-foreground">
          円とチェックを順に描き、処理の完了を伝えます。
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3" role="status">
          <SuccessCheck checked={checked} className="size-8" />
          <span>{checked ? "保存しました" : "保存を待っています"}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          aria-pressed={checked}
          onClick={() => setChecked(!checked)}
        >
          完了状態を切り替える
        </Button>
      </div>
    </section>
  );
}
