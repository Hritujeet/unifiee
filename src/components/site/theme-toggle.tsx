"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!mounted) setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="size-8" />;
  }

  const cycles: Record<string, string> = {
    light: "dark",
    dark: "system",
    system: "light",
  };

  const next = cycles[theme ?? "system"] ?? "light";

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
