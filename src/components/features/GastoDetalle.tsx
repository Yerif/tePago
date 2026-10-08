import { Pill } from "@/components/cozy/Pill";
import { EMOJI_CATEGORIA } from "@/lib/categorias";
import type { GastoDemo } from "@/lib/mock/tipos";
import { formatoMXN } from "@/lib/splits/formato";
import { tiempoRelativo } from "@/lib/tiempo";
import { Chevron } from "@/components/ui/Chevron";

export interface GastoDetalleProps {
  gasto: GastoDemo;
  /** id → nombre visible, para todos los miembros del grupo. */
  nombres: Record<string, string>;
  ahora: Date;
  /** userId → centavos que aún faltan por pagar de su parte (con abonos aplicados). Sin esto se usa `saldado`. */
  pendientes?: Record<string, number>;
}

/** Un gasto que se despliega para ver cuánto le toca a cada quien y quién ya saldó. */
export function GastoDetalle({ gasto, nombres, ahora, pendientes }: GastoDetalleProps) {
  const nombre = (id: string) => nombres[id] ?? id;
  return (
    <details data-component="GastoDetalle" data-testid={`gasto-${gasto.id}`} className="group rounded-card-sm border-[2.5px] border-border bg-card p-4">
      <summary className="flex cursor-pointer list-none items-center gap-3">
        <span aria-hidden className="text-3xl">
          {EMOJI_CATEGORIA[gasto.categoria]}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 break-words font-semibold">{gasto.descripcion}</span>
          <span className="block text-sm text-muted-foreground">
            Pagó {nombre(gasto.pagadoPor)} · {tiempoRelativo(gasto.fecha, ahora)}
          </span>
        </span>
        {/* El total y la flechita van apilados: la flechita no le quita ancho al título. */}
        <span className="flex flex-col items-end">
          <span className="font-display text-xl font-bold" data-testid="gasto-total">
            {formatoMXN(gasto.totalCentavos)}
          </span>
          <Chevron className="ml-0 pl-0 text-base" />
        </span>
      </summary>
      <ul className="mt-3 flex flex-col gap-2 border-t-2 border-border pt-3">
        {gasto.partes.map((p) => (
          <li key={p.userId} className="flex flex-wrap items-center justify-between gap-2" data-testid={`parte-${gasto.id}-${p.userId}`}>
            <span>{nombre(p.userId)}</span>
            <span className="flex items-center gap-2">
              <span className="font-display font-bold">{formatoMXN(p.centavos)}</span>
              {p.userId === gasto.pagadoPor ? (
                <Pill variant="water">Pagó</Pill>
              ) : (pendientes?.[p.userId] ?? (p.saldado ? 0 : p.centavos)) === 0 ? (
                <Pill variant="grass">Saldado ✔</Pill>
              ) : (pendientes?.[p.userId] ?? p.centavos) < p.centavos ? (
                <Pill variant="lemon">Faltan {formatoMXN(pendientes?.[p.userId] ?? p.centavos)}</Pill>
              ) : (
                <Pill variant="rose">Debe</Pill>
              )}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
