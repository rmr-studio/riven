"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "./button";

const themes = ["light", "dark", "amber"] as const;
type Theme = (typeof themes)[number];

const themeLabels: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  amber: "Amber",
};

export function ThemeToggle() {
  const { setTheme, resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = (theme === "system" ? resolvedTheme : theme) as Theme;

  const cycle = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        const currentIndex = themes.indexOf(activeTheme);
        const next = themes[(currentIndex + 1) % themes.length];
        setTheme(next);
      });
      return;
    }

    const currentIndex = themes.indexOf(activeTheme);
    const next = themes[(currentIndex + 1) % themes.length];
    setTheme(next);
  };

  if (!mounted) {
    return (
      <Button
        disabled
        className="inline-flex items-center gap-2.5 rounded-full border border-border/50 bg-muted/50 px-3 py-1.5 font-mono tracking-widest text-muted-foreground"
      >
        <span className="flex gap-1">
          {themes.map((t) => (
            <span
              key={t}
              className="block h-1.5 w-1.5 rounded-full border border-muted-foreground/40"
            />
          ))}
        </span>
      </Button>
    );
  }

  return (
    <Button
      onClick={cycle}
      className="flex items-center gap-2.5 rounded-full border border-border/50 bg-muted/50 px-3 py-1.5 text-sm font-mono tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
    >
      <span>{themeLabels[activeTheme] ?? "Light"}</span>
      <span className="flex gap-1">
        {themes.map((t) => (
          <span
            key={t}
            className={`block h-1.5 w-1.5 rounded-full transition-colors ${
              t === activeTheme
                ? "bg-foreground"
                : "border border-muted-foreground/40"
            }`}
          />
        ))}
      </span>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
