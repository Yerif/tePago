"use client";

import { Avatar } from "@/components/cozy/Avatar";
import { Pill } from "@/components/cozy/Pill";
import { Button } from "@/components/ui/Button";
import { completarPorcentajes, type ModoDividir, type SalidaModo } from "@/lib/splits/entradaModo";
import { formatoMXN } from "@/lib/splits/formato";

export interface PersonaLite {
  id: string;
  nombre: string;
  base: string;
  estado: "clean" | "mild" | "rekt";
}

const AYUDA: Record<Exclude<ModoDividir, "igual">, { pista: string; placeholder: string; inputMode: "decimal" | "numeric" | "text"; sufijo: string }> = {
  montos: { pista: "Escribe cuánto debe cada quien. Lo que no asignes se queda contigo.", placeholder: "0.00", inputMode: "decimal", sufijo: "$" },
  porcentajes: { pista: "Los porcentajes deben sumar 100 %.", placeholder: "0", inputMode: "decimal", sufijo: "%" },
  partes: { pista: "Cada quien lleva N partes (una pareja puede llevar 2). Vacío = 1.", placeholder: "1", inputMode: "numeric", sufijo: "partes" },
  ajustes: { pista: "Parejo, pero a alguien le sumas o restas: +60 o -30.", placeholder: "+0", inputMode: "text", sufijo: "±$" },
};

export interface ModoPorPersonaProps {
  modo: Exclude<ModoDividir, "igual">;
  personas: PersonaLite[];
  valores: Record<string, string>;
  salida: SalidaModo;
  onCambio: (id: string, texto: string) => void;
}

/** Un campo por persona para montos, porcentajes, partes o ajustes, con el estado en vivo ("Faltan $X"). */
export function ModoPorPersona({ modo, personas, valores, salida, onCambio }: ModoPorPersonaProps) {
  const ayuda = AYUDA[modo];
  const vacio = personas.find((p) => (valores[p.id] ?? "").trim() === "");

  let estado: { texto: string; variante: "grass" | "peach" | "rose" } | null = null;
  if (modo === "montos" && salida.sobran > 0) estado = { texto: `Te pasaste ${formatoMXN(salida.sobran)}`, variante: "rose" };
  else if (modo === "montos" && salida.faltan > 0) estado = { texto: `Faltan ${formatoMXN(salida.faltan)} · se quedan sin asignar`, variante: "peach" };
  else if (modo === "montos") estado = { texto: "Todo asignado ✓", variante: "grass" };
  else if (modo === "porcentajes" && salida.sobran > 0) estado = { texto: `Te pasaste ${salida.sobran / 100} %`, variante: "rose" };
  else if (modo === "porcentajes" && salida.faltan > 0) estado = { texto: `Llevan ${(10_000 - salida.faltan) / 100} % · faltan ${salida.faltan / 100} %`, variante: "peach" };
  else if (modo === "porcentajes") estado = { texto: "Suma 100 % ✓", variante: "grass" };

  return (
    <fieldset data-component="ModoPorPersona" className="flex flex-col gap-2">
      <legend className="mb-1 text-sm text-muted-foreground">{ayuda.pista}</legend>
      {personas.map((p) => (
        <div key={p.id} className="flex items-center gap-2">
          <Avatar base={p.base} estado={p.estado} size="sm" compacto className="size-9" />
          <label htmlFor={`valor-${p.id}`} className="min-w-0 flex-1 truncate text-sm font-semibold">
            {p.nombre}
          </label>
          <input
            id={`valor-${p.id}`}
            data-testid={`valor-${p.id}`}
            inputMode={ayuda.inputMode}
            autoComplete="off"
            placeholder={ayuda.placeholder}
            value={valores[p.id] ?? ""}
            onChange={(e) => onCambio(p.id, e.target.value)}
            className="min-h-11 w-28 rounded-2xl border-[2.5px] border-border bg-background px-3 py-2 text-right font-display font-bold"
          />
          <span aria-hidden className="w-10 text-xs text-muted-foreground">
            {ayuda.sufijo}
          </span>
        </div>
      ))}
      {modo === "porcentajes" && vacio && salida.faltan > 0 && (
        <Button
          variant="outline"
          size="sm"
          data-testid="completar-porcentaje"
          className="self-start"
          onClick={() => {
            const resto = completarPorcentajes(personas.map((x) => x.id), valores, vacio.id);
            if (resto !== null) onCambio(vacio.id, resto);
          }}
        >
          Repartir lo que falta a {vacio.nombre}
        </Button>
      )}
      {(estado || salida.mensaje) && (
        <div aria-live="polite" className="flex flex-wrap gap-2">
          {estado && (
            <Pill variant={estado.variante} data-testid="dividir-estado">
              {estado.texto}
            </Pill>
          )}
          {salida.mensaje && (
            <Pill variant="rose" data-testid="dividir-mensaje">
              {salida.mensaje}
            </Pill>
          )}
        </div>
      )}
    </fieldset>
  );
}
