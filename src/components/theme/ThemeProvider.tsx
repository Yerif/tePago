"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Dark por default (CLAUDE.md §10); sin sistema, para que la preferencia sea siempre explícita. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="cc-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
