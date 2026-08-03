import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export type SiteTheme = "light" | "dark";

const readTheme = (): SiteTheme =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

const applyTheme = (theme: SiteTheme) => {
  const dark = theme === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("elchika-ui-theme", theme);
};

export function useSiteTheme() {
  const [theme, setTheme] = useState<SiteTheme>("light");

  useEffect(() => setTheme(readTheme()), []);

  const updateTheme = (nextTheme: SiteTheme) => {
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  return [theme, updateTheme] as const;
}

type ThemeToggleProps = {
  theme?: SiteTheme;
  onThemeChange?: (theme: SiteTheme) => void;
};

export function ThemeToggle({ theme: controlledTheme, onThemeChange }: ThemeToggleProps) {
  const [localTheme, setLocalTheme] = useSiteTheme();
  const theme = controlledTheme ?? localTheme;
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = `${nextTheme === "dark" ? "ダーク" : "ライト"}テーマに切り替える`;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => (onThemeChange ? onThemeChange(nextTheme) : setLocalTheme(nextTheme))}
    >
      {theme === "dark" ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
    </Button>
  );
}
