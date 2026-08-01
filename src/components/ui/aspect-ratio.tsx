import { cn } from "@/lib/utils";

type AspectRatioProps = React.ComponentProps<"div"> & { ratio: number };

function AspectRatio({ ratio, className, ...props }: AspectRatioProps) {
  return (
    <div
      data-slot="aspect-ratio"
      style={
        {
          "--ratio": ratio,
        } as React.CSSProperties
      }
      className={cn("relative aspect-(--ratio)", className)}
      {...props}
    />
  );
}

export type { AspectRatioProps };
export { AspectRatio };
