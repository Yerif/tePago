"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { armarReporte } from "@/lib/reporte";

export interface ErrorPantallaProps {
  error: Error & { digest?: string };
  reintentar: () => void;
}

/** Pantalla de error cálida con "copiar reporte": funciona también en producción y no lleva datos personales. */
export function ErrorPantalla({ error, reintentar }: ErrorPantallaProps) {
  const ruta = usePathname();
  const [copiado, setCopiado] = useState<"si" | "no" | null>(null);

  async function copiar() {
    const texto = armarReporte({ ruta, mensaje: error.message, digest: error.digest, ahora: new Date(), agente: navigator.userAgent });
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado("si");
    } catch {
      setCopiado("no");
    }
  }

  return (
    <main data-component="ErrorPantalla" className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <Card className="flex flex-col gap-3" role="alert">
        <p aria-hidden className="text-5xl">
          🥲
        </p>
        <h1 className="font-display text-2xl font-bold">Algo se nos cayó</h1>
        <p className="text-muted-foreground">No fue tu culpa. Intenta de nuevo y, si sigue, copia el reporte y mándaselo a Yerif.</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="grass" data-testid="error-reintentar" onClick={reintentar}>
            Intentar de nuevo
          </Button>
          <Button variant="outline" data-testid="error-copiar" onClick={copiar}>
            Copiar reporte
          </Button>
        </div>
        {copiado === "si" ? (
          <p role="status" data-testid="error-copiado" className="text-grass-text">
            ¡Copiado! Pégalo en el chat 🌻
          </p>
        ) : null}
        {copiado === "no" ? (
          <p role="status" data-testid="error-copiado" className="text-rose-text">
            No pude copiarlo; toma captura de esta pantalla.
          </p>
        ) : null}
      </Card>
    </main>
  );
}
