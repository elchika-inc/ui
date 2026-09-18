import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { type SiteTheme, ThemeToggle } from "@/site/theme-toggle";

type SiteMastheadProps = {
  className?: string;
  leadingAction?: ReactNode;
  headerAction?: ReactNode;
  theme?: SiteTheme;
  onThemeChange?: (theme: SiteTheme) => void;
};

export function SiteMasthead({
  className,
  leadingAction,
  headerAction,
  theme,
  onThemeChange,
}: SiteMastheadProps) {
  return (
    <header
      data-site-masthead
      className={cn(
        "sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/88 py-4 backdrop-blur-md",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {leadingAction}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <a
            href="/"
            className="rounded-sm font-heading text-base font-semibold tracking-heading whitespace-nowrap focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
          >
            elchika-inc<span className="text-primary">/ui</span>
          </a>
          <span
            data-site-version
            className="font-mono text-3xs tracking-label text-muted-foreground uppercase"
          >
            registry
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
        {headerAction}
      </div>
    </header>
  );
}
