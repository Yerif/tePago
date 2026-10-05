"use client";

import { ErrorPantalla } from "@/components/features/ErrorPantalla";
import "./globals.css";

/** Último recurso: reemplaza el layout raíz, así que trae su propio <html>. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es-MX" className="dark">
      <body>
        <ErrorPantalla error={error} reintentar={reset} />
      </body>
    </html>
  );
}
