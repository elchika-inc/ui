import { cn } from "@/lib/utils";

export type TextRevealProps = React.ComponentProps<"span"> & {
  text: string;
  by?: "word" | "char";
};

function TextReveal({ text, by = "word", className, ...props }: TextRevealProps) {
  const segments =
    typeof Intl.Segmenter === "function"
      ? Array.from(
          new Intl.Segmenter(undefined, {
            granularity: by === "word" ? "word" : "grapheme",
          }).segment(text),
          ({ segment }) => segment,
        )
      : by === "word"
        ? text.split(/(\s+)/)
        : Array.from(text);
  let index = 0;
  let offset = 0;

  return (
    <span
      key={text}
      data-slot="text-reveal"
      role="img"
      aria-label={text}
      className={cn("whitespace-pre-wrap", className)}
      {...props}
    >
      {segments.map((segment) => {
        const key = offset;
        offset += segment.length;
        if (!segment) return null;
        const whitespace = /^\s+$/.test(segment);
        const delayIndex = index;
        if (!whitespace) index += 1;
        return (
          <span
            key={key}
            data-slot="text-reveal-unit"
            aria-hidden="true"
            className={
              whitespace
                ? "inline"
                : "inline-block transition-[opacity,translate] duration-emphasis ease-entrance starting:translate-y-(--motion-distance-sm) starting:opacity-0"
            }
            style={
              whitespace
                ? undefined
                : { transitionDelay: `calc(var(--duration-stagger) * ${delayIndex})` }
            }
          >
            {segment}
          </span>
        );
      })}
    </span>
  );
}

export { TextReveal };
