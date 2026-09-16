import * as React from "react";

import { cn } from "@/lib/utils";

export type TextSwapProps = React.ComponentProps<"span"> & { value: string };

function TextSwap({ value, className, ...props }: TextSwapProps) {
  const [values, setValues] = React.useState<{ current: string; leaving: string | null }>({
    current: value,
    leaving: null,
  });

  if (values.current !== value) {
    setValues({ current: value, leaving: values.current });
  }

  return (
    <span
      data-slot="text-swap"
      className={cn("relative inline-grid [&>*]:col-start-1 [&>*]:row-start-1", className)}
      {...props}
    >
      {/* 同じ key の要素を残し、表示済みの状態から退場させる。 */}
      {[values.leaving, values.current].map((item) => {
        if (item === null) return null;
        const leaving = item !== values.current;
        return (
          <span
            key={item}
            data-slot={leaving ? "text-swap-leaving" : "text-swap-value"}
            aria-hidden={leaving || undefined}
            className={
              leaving
                ? "-translate-y-(--motion-distance-sm) opacity-0 transition-[opacity,translate] duration-fast ease-standard"
                : "transition-[opacity,translate] duration-fast ease-standard starting:translate-y-(--motion-distance-sm) starting:opacity-0"
            }
            onTransitionEnd={
              leaving
                ? (event) => {
                    if (event.target !== event.currentTarget) return;
                    setValues((previous) =>
                      previous.leaving === item ? { ...previous, leaving: null } : previous,
                    );
                  }
                : undefined
            }
          >
            {item}
          </span>
        );
      })}
    </span>
  );
}

export { TextSwap };
