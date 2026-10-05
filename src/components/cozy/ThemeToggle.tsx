"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/Button";

/** Los íconos se alternan con CSS (`dark:`), así no hay desajuste de hidratación. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="outline"
      size="md"
      aria-label="Cambiar entre tema claro y oscuro"
      data-testid="theme-toggle"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <span aria-hidden className="dark:hidden">
        🌙
      </span>
      <span aria-hidden className="hidden dark:inline">
        ☀️
      </span>
    </Button>
  );
}
