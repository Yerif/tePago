"use client";

import { Button } from "@/components/ui/Button";
import { usePagosDemo } from "./usePagosDemo";
import { usePerfilesDemo } from "./usePerfilesDemo";
import { useBienvenidaDemo } from "./useBienvenidaDemo";
import { useVistoDemo } from "./useVistoDemo";
import { useGastosDemo } from "./useGastosDemo";

/** Borra los pagos, los gastos guardados y los perfiles editados del demo (viven en `localStorage`) para volver a empezar una prueba. */
export function ReiniciarDemo() {
  const { registros, reiniciar } = usePagosDemo();
  const { perfiles, reiniciar: reiniciarPerfiles } = usePerfilesDemo();
  const { visto, reiniciar: reiniciarVisto } = useVistoDemo();
  const { vista: bienvenida, reiniciar: reiniciarBienvenida } = useBienvenidaDemo();
  const { guardados, reiniciar: reiniciarGastos } = useGastosDemo();
  const nada = registros.length === 0 && guardados.length === 0 && Object.keys(perfiles).length === 0 && Object.keys(visto).length === 0 && Object.keys(bienvenida).length === 0;
  return (
    <div data-component="ReiniciarDemo" className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" data-testid="reiniciar-demo" onClick={() => (reiniciar(), reiniciarPerfiles(), reiniciarVisto(), reiniciarBienvenida(), reiniciarGastos())} disabled={nada}>
        Reiniciar pagos y perfiles del demo
      </Button>
      <span className="text-sm text-muted-foreground">{registros.length} pagos y {Object.keys(perfiles).length} perfiles editados en este navegador</span>
    </div>
  );
}
