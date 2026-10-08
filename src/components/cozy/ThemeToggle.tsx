"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/Button";

/** Los íconos se alternan con CSS (`dark:`), así no hay desajuste de hidratación. */
export function ThemeToggle({ conTexto = false }: { conTexto?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="outline"
      size="md"
      aria-label="Cambiar entre tema claro y oscuro"
      data-testid="theme-toggle"
      className="h-auto min-h-11 max-w-full whitespace-normal py-2"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <span aria-hidden className="dark:hidden">
        🌙
      </span>
      <span aria-hidden className="hidden dark:inline">
        ☀️
      </span>
      {conTexto && (
        <>
          <span className="dark:hidden">Pasar a tema oscuro</span>
          <span className="hidden dark:inline">Pasar a tema claro</span>
        </>
      )}
    </Button>
  );
}
