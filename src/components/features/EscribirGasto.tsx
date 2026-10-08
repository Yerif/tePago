export interface EscribirGastoProps {
  /** Persona que está probando el demo (se conserva al abrir la pantalla de confirmación). */
  yo: string;
}

/**
 * "Cuéntalo con tus palabras" (Smart Split, texto primero). Es un formulario GET plano: no suma toques al flujo normal
 * de monto → confirmar y, sin llamadas reales todavía, abre la pantalla de revisión con el ejemplo más parecido.
 */
export function EscribirGasto({ yo }: EscribirGastoProps) {
  return (
    <form data-component="EscribirGasto" action="/dev/demo/ia" method="get" className="flex flex-col gap-2 rounded-3xl border-[2.5px] border-dashed border-border p-4">
      <input type="hidden" name="u" value={yo} />
      <label htmlFor="frase-gasto" className="text-sm text-muted-foreground">
        O cuéntalo con tus palabras
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="frase-gasto"
          name="t"
          data-testid="frase-gasto"
          maxLength={280}
          autoComplete="off"
          placeholder="Cena 840, pagué yo, somos 4"
          className="min-h-11 min-w-32 flex-1 rounded-2xl border-[2.5px] border-border bg-background px-4"
        />
        <button
          type="submit"
          data-testid="frase-gasto-enviar"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border-[2.5px] border-border bg-card px-4 font-semibold"
        >
          Entender
        </button>
      </div>
    </form>
  );
}
