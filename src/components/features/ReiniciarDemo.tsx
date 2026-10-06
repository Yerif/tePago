"use client";

import { Button } from "@/components/ui/Button";
import { usePagosDemo } from "./usePagosDemo";

/** Borra los pagos del demo (viven en `localStorage`) para volver a empezar una prueba. */
export function ReiniciarDemo() {
  const { registros, reiniciar } = usePagosDemo();
  return (
    <div data-component="ReiniciarDemo" className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" data-testid="reiniciar-demo" onClick={reiniciar} disabled={registros.length === 0}>
        Reiniciar pagos del demo
      </Button>
      <span className="text-sm text-muted-foreground">{registros.length} pagos guardados en este navegador</span>
    </div>
  );
}
