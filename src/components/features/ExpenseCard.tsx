import { Card } from "@/components/ui/Card";
import { EMOJI_CATEGORIA } from "@/lib/categorias";
import type { GastoDemo } from "@/lib/mock/tipos";
import { formatoMXN } from "@/lib/splits/formato";
import { tiempoRelativo } from "@/lib/tiempo";

export interface ExpenseCardProps {
  gasto: GastoDemo;
  /** Nombre de quien pagó, ya resuelto por la pantalla. */
  pagador: string;
  ahora: Date;
}

export function ExpenseCard({ gasto, pagador, ahora }: ExpenseCardProps) {
  return (
    <Card size="sm" data-component="ExpenseCard" data-testid={`expense-${gasto.id}`} className="flex items-center gap-3">
      <span aria-hidden className="text-3xl">
        {EMOJI_CATEGORIA[gasto.categoria]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 break-words font-semibold">{gasto.descripcion}</p>
        <p className="text-sm text-muted-foreground">
          Pagó {pagador} · {tiempoRelativo(gasto.fecha, ahora)}
        </p>
      </div>
      <p data-testid="expense-amount" className="font-display text-xl font-bold">
        {formatoMXN(gasto.totalCentavos)}
      </p>
    </Card>
  );
}
