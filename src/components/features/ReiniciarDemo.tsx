"use client";

import { Button } from "@/components/ui/Button";
import { usePagosDemo } from "./usePagosDemo";
import { usePerfilesDemo } from "./usePerfilesDemo";

/** Borra los pagos y los perfiles editados del demo (viven en `localStorage`) para volver a empezar una prueba. */
export function ReiniciarDemo() {
  const { registros, reiniciar } = usePagosDemo();
  const { perfiles, reiniciar: reiniciarPerfiles } = usePerfilesDemo();
  const nada = registros.length === 0 && Object.keys(perfiles).length === 0;
  return (
    <div data-component="ReiniciarDemo" className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" data-testid="reiniciar-demo" onClick={() => (reiniciar(), reiniciarPerfiles())} disabled={nada}>
        Reiniciar pagos y perfiles del demo
      </Button>
      <span className="text-sm text-muted-foreground">{registros.length} pagos y {Object.keys(perfiles).length} perfiles editados en este navegador</span>
    </div>
  );
}
