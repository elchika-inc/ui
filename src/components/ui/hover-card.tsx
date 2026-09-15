import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";

import { cn } from "@/lib/utils";

export type HoverCardProps = PreviewCardPrimitive.Root.Props;
export type HoverCardTriggerProps = PreviewCardPrimitive.Trigger.Props;
export type HoverCardContentProps = PreviewCardPrimitive.Popup.Props &
  Pick<PreviewCardPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">;

function HoverCard(props: HoverCardProps) {
  return <PreviewCardPrimitive.Root data-slot="hover-card" {...props} />;
}

function HoverCardTrigger(props: HoverCardTriggerProps) {
  return <PreviewCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />;
}

function HoverCardContent({
  className,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 4,
  ...props
}: HoverCardContentProps) {
  return (
    <PreviewCardPrimitive.Portal data-slot="hover-card-portal">
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn(
            "z-50 w-64 origin-(--transform-origin) transition-[opacity,scale] duration-slow ease-entrance data-starting-style:opacity-0 data-starting-style:scale-(--motion-scale-md) data-ending-style:opacity-0 data-ending-style:scale-(--motion-scale-sm) data-ending-style:duration-fast data-instant:transition-none rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-border outline-none",
            className,
          )}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardContent, HoverCardTrigger };
