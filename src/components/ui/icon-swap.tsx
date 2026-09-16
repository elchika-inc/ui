import { cn } from "@/lib/utils";

export type IconSwapProps = React.ComponentProps<"span"> & { swapped?: boolean };
export type IconSwapFromProps = React.ComponentProps<"span">;
export type IconSwapToProps = React.ComponentProps<"span">;

function IconSwap({ swapped, className, ...props }: IconSwapProps) {
  return (
    <span
      data-slot="icon-swap"
      data-swapped={swapped ? "" : undefined}
      className={cn(
        "group/icon-swap relative inline-grid size-4 place-items-center [&>*]:col-start-1 [&>*]:row-start-1",
        className,
      )}
      {...props}
    />
  );
}

function IconSwapFrom({ className, ...props }: IconSwapFromProps) {
  return (
    <span
      data-slot="icon-swap-from"
      className={cn(
        "transition-[opacity,scale] duration-slow ease-entrance group-data-swapped/icon-swap:scale-(--motion-scale-md) group-data-swapped/icon-swap:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function IconSwapTo({ className, ...props }: IconSwapToProps) {
  return (
    <span
      data-slot="icon-swap-to"
      className={cn(
        "scale-(--motion-scale-md) opacity-0 transition-[opacity,scale] duration-slow ease-entrance group-data-swapped/icon-swap:scale-100 group-data-swapped/icon-swap:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

export { IconSwap, IconSwapFrom, IconSwapTo };
