/** Todos los `data-testid` que usan los E2E, en un solo lugar (CLAUDE.md §11). */
export const ids = {
  inicio: { dividir: "ir-dividir", grupo: (id: string) => `demo-grupo-${id}` },
  dividir: { monto: "dividir-monto", confirmar: "dividir-confirmar", aviso: "dividir-aviso", guardados: "dividir-guardados" },
  confirmar: { total: "ia-total", confirmar: "ia-confirmar", guardado: "ia-guardado", resultado: "ia-resultado" },
  personaje: { raiz: "personaje", canvas: "personaje-canvas", respaldo: "personaje-respaldo", estado: (e: string) => `estado-${e}`, base: (b: string) => `base-${b}`, skin: (s: string) => `skin-${s}`, nivel: "nivel", festejar: "festejar", celebraciones: "data-celebraciones" },
  saldar: {
    monto: (deudor: string, acreedor: string) => `pagar-monto-${deudor}-${acreedor}`,
    abonar: (deudor: string, acreedor: string) => `pagar-abonar-${deudor}-${acreedor}`,
    todo: (deudor: string, acreedor: string) => `pagar-todo-${deudor}-${acreedor}`,
    reaccion: "reaccion",
    xp: "reaccion-xp",
    error: "pagar-error",
    estado: "mi-estado",
  },
} as const;
