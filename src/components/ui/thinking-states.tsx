import { Spinner } from "@/components/ui/spinner";
import { TextSwap } from "@/components/ui/text-swap";
import { cn } from "@/lib/utils";

export type ThinkingStatesProps = React.ComponentProps<"span"> & {
  states: string[];
  active?: number;
};

function ThinkingStates({ states, active = 0, className, ...props }: ThinkingStatesProps) {
  return (
    <span
      data-slot="thinking-states"
      role="status"
      className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}
      {...props}
    >
      <Spinner className="size-3.5 text-current" />
      <TextSwap value={states[active] ?? ""} />
    </span>
  );
}

export { ThinkingStates };
