import * as React from "react";

import { cn } from "@/lib/utils";

export type StreamingTextProps = React.ComponentProps<"span"> & {
  text: string;
  streaming?: boolean;
};

function StreamingText({ text, streaming, className, ...props }: StreamingTextProps) {
  const [state, setState] = React.useState({ text, committed: text });
  if (state.text !== text) {
    // 次の追記で直前の差分を確定し、transitionend が来ない場合にも本文を進める。
    const committed = text.startsWith(state.committed)
      ? text.startsWith(state.text)
        ? state.text
        : state.committed
      : text;
    setState({ text, committed });
  }
  const chunk = text.slice(state.committed.length);

  return (
    <span
      {...props}
      data-slot="streaming-text"
      aria-busy={streaming || undefined}
      className={cn(className)}
    >
      {state.committed}
      {chunk && (
        <span
          key={text}
          data-slot="streaming-text-chunk"
          className="transition-opacity duration-fast ease-standard starting:opacity-0"
          onTransitionEnd={(event) => {
            if (event.target !== event.currentTarget || event.propertyName !== "opacity") return;
            setState((current) => (current.text === text ? { text, committed: text } : current));
          }}
        >
          {chunk}
        </span>
      )}
      {streaming && (
        <span
          data-slot="streaming-text-caret"
          aria-hidden
          className="ml-px inline-block h-4 w-px animate-caret-blink bg-current align-text-bottom"
        />
      )}
    </span>
  );
}

export { StreamingText };
