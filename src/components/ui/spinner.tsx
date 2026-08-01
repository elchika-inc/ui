import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SpinnerProps = React.ComponentProps<"svg">;

function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin text-primary", className)}
      {...props}
    />
  );
}

export { Spinner };
