import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export type TabsProps = TabsPrimitive.Root.Props;
export type TabsListProps = TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>;
export type TabsTriggerProps = TabsPrimitive.Tab.Props;
export type TabsContentProps = TabsPrimitive.Panel.Props;
export type TabsIndicatorProps = TabsPrimitive.Indicator.Props;

function Tabs({ className, orientation = "horizontal", ...props }: TabsProps) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn("group/tabs flex gap-2 data-horizontal:flex-col", className)}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list relative isolate inline-flex w-fit items-center justify-center rounded-lg p-0.75 text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({ className, variant = "default", ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-tabs-trigger flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-state group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-disabled has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-disabled dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-card data-active:text-foreground dark:data-active:border-input dark:data-active:text-foreground",
        "group-has-data-[slot=tabs-indicator]/tabs-list:data-active:bg-transparent group-has-data-[slot=tabs-indicator]/tabs-list:data-active:shadow-none! dark:group-has-data-[slot=tabs-indicator]/tabs-list:data-active:border-transparent group-has-data-[slot=tabs-indicator]/tabs-list:after:hidden",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:-bottom-1.25 group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function TabsIndicator({ className, ...props }: TabsIndicatorProps) {
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      renderBeforeHydration
      className={cn(
        "absolute -z-10 transition-[left,top,width,height] duration-slow ease-entrance",
        "group-data-[variant=default]/tabs-list:top-(--active-tab-top) group-data-[variant=default]/tabs-list:left-(--active-tab-left) group-data-[variant=default]/tabs-list:h-(--active-tab-height) group-data-[variant=default]/tabs-list:w-(--active-tab-width) group-data-[variant=default]/tabs-list:rounded-md group-data-[variant=default]/tabs-list:bg-card group-data-[variant=default]/tabs-list:shadow-sm dark:group-data-[variant=default]/tabs-list:border dark:group-data-[variant=default]/tabs-list:border-input",
        "group-data-[variant=line]/tabs-list:bg-foreground group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:left-(--active-tab-left) group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:w-(--active-tab-width) group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:-bottom-0.5 group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:h-0.5 group-data-[variant=line]/tabs-list:group-data-vertical/tabs:top-(--active-tab-top) group-data-[variant=line]/tabs-list:group-data-vertical/tabs:h-(--active-tab-height) group-data-[variant=line]/tabs-list:group-data-vertical/tabs:-right-0.25 group-data-[variant=line]/tabs-list:group-data-vertical/tabs:w-0.5",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger, tabsListVariants };
