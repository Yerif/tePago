import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cuentas Conmigo",
  description: "Divide gastos con tu banda y sube de nivel pagando a tiempo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
