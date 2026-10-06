"use client";

import { Button } from "@/components/ui/Button";

export interface ToastPagoProps {
  texto: string;
  onDeshacer: () => void;
  onCerrar: () => void;
}

/** Aviso flotante (sobre la barra inferior) tras declarar un pago, con "Deshacer" por unos segundos. */
export function ToastPago({ texto, onDeshacer, onCerrar }: ToastPagoProps) {
  return (
    <div data-component="ToastPago" role="status" data-testid="toast-pago" className="fixed inset-x-0 bottom-20 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center gap-2 rounded-2xl border-[2.5px] border-border bg-card p-3 shadow-lg">
      <p className="min-w-0 flex-1 text-sm font-semibold">{texto}</p>
      <Button size="sm" variant="outline" data-testid="toast-deshacer" onClick={onDeshacer}>
        Deshacer
      </Button>
      <button type="button" aria-label="Cerrar aviso" data-testid="toast-cerrar" onClick={onCerrar} className="min-h-11 min-w-11 text-muted-foreground">
        ✕
      </button>
    </div>
  );
}
