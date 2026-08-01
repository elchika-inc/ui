import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { cn } from "@/lib/utils";

export type CollapsibleProps = CollapsiblePrimitive.Root.Props;
export type CollapsibleTriggerProps = CollapsiblePrimitive.Trigger.Props;
export type CollapsibleContentProps = CollapsiblePrimitive.Panel.Props;

function Collapsible({ className, ...props }: CollapsibleProps) {
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

function CollapsibleTrigger({ className, ...props }: CollapsibleTriggerProps) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn(
        "flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-left text-sm font-medium text-card-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function CollapsibleContent({ className, ...props }: CollapsibleContentProps) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      className={cn(
        "overflow-hidden text-sm data-open:animate-accordion-down data-closed:animate-accordion-up",
        className,
      )}
      {...props}
    />
  );
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
