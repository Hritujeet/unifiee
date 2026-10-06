"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycles = {
    light: "dark",
    dark: "system",
    system: "light",
  } as const;

  const next = cycles[theme];

  return (
    <button
      id="theme-toggle"
      onClick={() => setTheme(next)}
      className="size-8 flex items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
      aria-label={`Switch to ${next} theme`}
    >
      {theme === "light" && <Sun className="size-4" />}
      {theme === "dark" && <Moon className="size-4" />}
      {theme === "system" && <Monitor className="size-4" />}
    </button>
  );
}
