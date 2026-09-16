import * as React from "react";

import { Button } from "@/components/ui/button";
import { TextReveal } from "@/components/ui/text-reveal";

export function TextRevealPreview() {
  const [alternate, setAlternate] = React.useState(false);
  const text = alternate ? "新しい 一歩を 踏み出す" : "今日も ひとつずつ 進める";
  return (
    <section data-slot="text-reveal-preview" className="max-w-xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-base font-medium text-foreground">テキストの出現</h1>
        <p className="text-sm text-muted-foreground">
          単語と文字の単位で、空白を保ちながら順に表示します。
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">単語ごと</p>
          <TextReveal text={text} className="text-lg" />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">文字ごと</p>
          <TextReveal text={text} by="char" className="text-lg" />
        </div>
        <Button type="button" variant="outline" onClick={() => setAlternate(!alternate)}>
          テキストを切り替える
        </Button>
      </div>
    </section>
  );
}
