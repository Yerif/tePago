"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatoMXN, parsearMonto } from "@/lib/splits/formato";

export interface HojaPagoProps {
  titulo: string;
  /** Líneas de desglose (por grupo, o a quién se lo pasa quien recibe). */
  detalle: string[];
  totalCentavos: number;
  /** Con `false` el monto es fijo (pagos de "pagar menos veces"). */
  editable?: boolean;
  onCerrar: () => void;
  onConfirmar: (centavos: number) => void;
}

/** Hoja inferior para pagar: monto editable (menos del total = abono) y "Ya le pagué". Dos toques desde la fila (CLAUDE.md §7). El monto se muestra como en la fila ("$1,291.67") y no abre el teclado solo: el caso común es pagar todo. */
export function HojaPago({ titulo, detalle, totalCentavos, editable = true, onCerrar, onConfirmar }: HojaPagoProps) {
  const [texto, setTexto] = useState(formatoMXN(totalCentavos));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  function confirmar() {
    const centavos = parsearMonto(texto);
    if (centavos === null || centavos <= 0) return setError("Escribe un monto válido, por ejemplo 150 o 150.50");
    if (centavos > totalCentavos) return setError(`Solo puedes pagar ${formatoMXN(totalCentavos)}: no pagues de más 🙂`);
    onConfirmar(centavos);
  }

  return (
    <div data-component="HojaPago" className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hoja-pago-titulo"
        data-testid="hoja-pago"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-3 rounded-t-3xl border-[2.5px] border-b-0 border-border bg-card p-5 pb-8"
      >
        <h2 id="hoja-pago-titulo" className="font-display text-xl font-bold">
          {titulo}
        </h2>
        <label htmlFor="hoja-monto" className="text-sm text-muted-foreground">
          {editable ? "Monto (menos del total es un abono)" : "Monto"}
        </label>
        <input
          id="hoja-monto"
          data-testid="hoja-monto"
          inputMode="decimal"
          autoComplete="off"
          onFocus={(e) => e.currentTarget.select()}
          readOnly={!editable}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-invalid={error !== null}
          className="min-h-14 w-full rounded-2xl border-[2.5px] border-border bg-background px-4 font-display text-3xl font-bold"
        />
        {error && (
          <p role="alert" data-testid="hoja-error" className="text-rose-text">
            {error}
          </p>
        )}
        {detalle.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
            {detalle.map((linea) => (
              <li key={linea}>{linea}</li>
            ))}
          </ul>
        )}
        <p className="text-sm text-muted-foreground">Avisamos a quien recibe para que confirme. Hasta entonces tu deuda sigue igual.</p>
        <Button size="lg" data-testid="hoja-confirmar" onClick={confirmar}>
          Ya le pagué
        </Button>
        <Button variant="ghost" size="md" data-testid="hoja-cerrar" onClick={onCerrar}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
