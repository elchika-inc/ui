import { cn } from "@/lib/utils";

export type SuccessCheckProps = React.ComponentProps<"svg"> & { checked?: boolean };

function SuccessCheck({ checked, className, ...props }: SuccessCheckProps) {
  return (
    <svg
      data-slot="success-check"
      data-checked={checked ? "" : undefined}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("size-4 text-current", className)}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        pathLength={1}
        strokeDasharray={1}
        className="transition-[stroke-dashoffset] duration-emphasis ease-entrance"
        style={{ strokeDashoffset: checked ? 0 : 1 }}
      />
      <path
        d="M8 12.5l2.5 2.5L16 9.5"
        pathLength={1}
        strokeDasharray={1}
        className="transition-[stroke-dashoffset] duration-emphasis ease-entrance"
        style={{ strokeDashoffset: checked ? 0 : 1, transitionDelay: "var(--duration-fast)" }}
      />
    </svg>
  );
}

export { SuccessCheck };
