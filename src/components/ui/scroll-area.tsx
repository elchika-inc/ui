import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import { cn } from "@/lib/utils";

export type ScrollAreaProps = ScrollAreaPrimitive.Root.Props;
export type ScrollAreaViewportProps = ScrollAreaPrimitive.Viewport.Props;
export type ScrollAreaContentProps = ScrollAreaPrimitive.Content.Props;
export type ScrollAreaScrollbarProps = ScrollAreaPrimitive.Scrollbar.Props;
export type ScrollAreaThumbProps = ScrollAreaPrimitive.Thumb.Props;
export type ScrollAreaCornerProps = ScrollAreaPrimitive.Corner.Props;

function ScrollArea({ className, ...props }: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative flex min-h-0 min-w-0 overflow-hidden", className)}
      {...props}
    />
  );
}

function ScrollAreaViewport({ className, ...props }: ScrollAreaViewportProps) {
  return (
    <ScrollAreaPrimitive.Viewport
      data-slot="scroll-area-viewport"
      className={cn(
        "size-full overflow-auto rounded-lg border border-border bg-background text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}

function ScrollAreaContent({ className, ...props }: ScrollAreaContentProps) {
  return (
    <ScrollAreaPrimitive.Content
      data-slot="scroll-area-content"
      className={cn("min-w-max", className)}
      {...props}
    />
  );
}

function ScrollAreaScrollbar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaScrollbarProps) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "m-px flex touch-none select-none bg-muted transition-colors data-horizontal:h-2.5 data-horizontal:flex-col data-vertical:w-2.5",
        className,
      )}
      {...props}
    />
  );
}

function ScrollAreaThumb({ className, ...props }: ScrollAreaThumbProps) {
  return (
    <ScrollAreaPrimitive.Thumb
      data-slot="scroll-area-thumb"
      className={cn("relative flex-1 rounded-full bg-primary", className)}
      {...props}
    />
  );
}

function ScrollAreaCorner({ className, ...props }: ScrollAreaCornerProps) {
  return (
    <ScrollAreaPrimitive.Corner
      data-slot="scroll-area-corner"
      className={cn("bg-muted", className)}
      {...props}
    />
  );
}

export {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
};
