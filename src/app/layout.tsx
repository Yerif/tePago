import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
