import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { DebugPanel } from "@/components/dev/DebugPanel";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { esEntornoDev } from "@/lib/entorno";
import "./globals.css";

const DESCRIPCION = "Divide gastos con tu grupo y sube de nivel pagando a tiempo.";

export const metadata: Metadata = {
  // Base de las URLs absolutas (imagen para compartir). En Vercel sale del dominio del despliegue.
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  title: "Cuentas Conmigo",
  description: DESCRIPCION,
  applicationName: "Cuentas Conmigo",
  appleWebApp: { capable: true, title: "Cuentas Conmigo" },
  openGraph: { title: "Cuentas Conmigo", description: DESCRIPCION, locale: "es_MX", type: "website", siteName: "Cuentas Conmigo" },
};

/** El tema oscuro es el default, así que la barra del navegador también. */
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1A1F2E" };

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
