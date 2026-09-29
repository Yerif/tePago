import type { Metadata } from "next";
import { Suspense } from "react";
import { DebugPanel } from "@/components/dev/DebugPanel";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { esEntornoDev } from "@/lib/entorno";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cuentas Conmigo",
  description: "Divide gastos con tu banda y sube de nivel pagando a tiempo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `dark` inicial: aunque el JS tarde, el default es oscuro y no hay parpadeo.
    <html lang="es-MX" className="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
          {/* useSearchParams exige Suspense; el panel solo existe en dev y previews. */}
          <Suspense fallback={null}>
            <DebugPanel habilitado={esEntornoDev()} />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
