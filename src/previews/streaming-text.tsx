import * as React from "react";

import { Button } from "@/components/ui/button";
import { StreamingText } from "@/components/ui/streaming-text";

const initialText = "生成した文章を";
const chunks = ["少しずつ", "受け取り、", "表示します。"];

export function StreamingTextPreview() {
  const [text, setText] = React.useState(initialText);
  const [count, setCount] = React.useState(0);
  const [streaming, setStreaming] = React.useState(true);
  return (
    <section
      data-slot="streaming-text-preview"
      className="max-w-xl space-y-6 p-6"
      aria-labelledby="streaming-text-title"
    >
      <div className="space-y-1">
        <h1 id="streaming-text-title" className="text-base font-medium text-foreground">
          文章のストリーミング表示
        </h1>
        <p className="text-sm text-muted-foreground">
          届いた文章を末尾へ追加し、受信中はカーソルを表示します。
        </p>
      </div>
      <div className="rounded-lg border p-6 text-base">
        <StreamingText text={text} streaming={streaming} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={count >= chunks.length}
          onClick={() => {
            setText((current) => current + (chunks[count] ?? ""));
            setCount((current) => current + 1);
            setStreaming(true);
          }}
        >
          チャンクを追加
        </Button>
        <Button variant="outline" onClick={() => setStreaming(false)}>
          完了
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setText("新しい文章へ置き換えました。");
            setStreaming(false);
          }}
        >
          全文を置換
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setText(initialText);
            setCount(0);
            setStreaming(true);
          }}
        >
          リセット
        </Button>
      </div>
    </section>
  );
}
