import * as React from "react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { Button } from "@/components/ui/button";

export function AnimatedNumberPreview() {
  const [value, setValue] = React.useState(12000);
  return (
    <section
      data-slot="animated-number-preview"
      className="max-w-xl space-y-6 p-6"
      aria-labelledby="animated-number-title"
    >
      <div className="space-y-1">
        <h1 id="animated-number-title" className="text-base font-medium text-foreground">
          数値の変化
        </h1>
        <p className="text-sm text-muted-foreground">
          数値の増減をなめらかに表示します。動きを減らす設定では、すぐに更新します。
        </p>
      </div>
      <div className="space-y-4 rounded-lg border p-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">合計ポイント</p>
          <AnimatedNumber value={value} className="text-3xl font-semibold" />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">小数を含む表示</p>
          <AnimatedNumber
            value={value / 100}
            locale="en-US"
            format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
            className="text-xl font-medium"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setValue((current) => current + 10000)}>10,000 増やす</Button>
        <Button variant="outline" onClick={() => setValue((current) => current - 10000)}>
          10,000 減らす
        </Button>
        <Button variant="ghost" onClick={() => setValue(12000)}>
          リセット
        </Button>
      </div>
    </section>
  );
}
