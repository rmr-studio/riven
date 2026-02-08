"use client";

import * as React from "react";
import { useTheme } from "next-themes";

const themes = ["light", "dark", "amber"] as const;
type Theme = (typeof themes)[number];

const themeLabels: Record<Theme, string> = {
  light: "LIGHT",
  dark: "DARK",
  amber: "AMBER",
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
      <button
        disabled
        className="inline-flex items-center gap-2.5 rounded-full border border-border/50 bg-muted/50 px-3 py-1.5 font-mono text-[11px] tracking-widest text-muted-foreground"
      >
        <span>&mdash;</span>
        <span className="flex gap-1">
          {themes.map((t) => (
            <span
              key={t}
              className="block h-1.5 w-1.5 rounded-full border border-muted-foreground/40"
            />
          ))}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={cycle}
      className="inline-flex items-center gap-2.5 rounded-full border border-border/50 bg-muted/50 px-3 py-1.5 font-mono text-[11px] tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
    >
      <span>{themeLabels[activeTheme] ?? "LIGHT"}</span>
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
    </button>
  );
}
