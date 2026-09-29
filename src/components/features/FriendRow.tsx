import { Avatar, ETIQUETA_ESTADO } from "@/components/cozy/Avatar";
import { Pill } from "@/components/cozy/Pill";
import { BADGES_DEMO } from "@/lib/mock/datos";
import type { MiembroDemo } from "@/lib/mock/tipos";
import { formatoMXN } from "@/lib/splits/formato";
import { cn } from "@/lib/utils";

const VARIANT_ESTADO = { clean: "grass", mild: "lemon", rekt: "rose" } as const;

export interface FriendRowProps {
  miembro: MiembroDemo;
  /** Saldo neto en centavos: positivo = le deben, negativo = debe. */
  balanceCentavos: number;
  esYo?: boolean;
}

export function FriendRow({ miembro, balanceCentavos, esYo = false }: FriendRowProps) {
  const alCorriente = balanceCentavos === 0;
  return (
    <li data-component="FriendRow" data-testid={`friend-${miembro.id}`} className="flex items-center gap-3 py-3">
      <Avatar emoji={miembro.emoji} estado={miembro.estado} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">
          {miembro.nombre}
          {esYo ? " (tú)" : ""}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          <Pill variant={VARIANT_ESTADO[miembro.estado]} data-testid="friend-estado">
            {ETIQUETA_ESTADO[miembro.estado]}
          </Pill>
          {miembro.badges.map((slug) => {
            const badge = BADGES_DEMO[slug];
            return badge ? (
              <Pill key={slug} variant={badge.variant}>
                {badge.nombre}
              </Pill>
            ) : null;
          })}
        </div>
      </div>
      <div className="text-right">
        <p
          data-testid="friend-balance"
          className={cn(
            "font-display text-lg font-bold",
            alCorriente ? "text-muted-foreground" : balanceCentavos > 0 ? "text-grass-text" : "text-rose-text",
          )}
        >
          {alCorriente ? "Al corriente ✨" : formatoMXN(Math.abs(balanceCentavos))}
        </p>
        {!alCorriente && <p className="text-xs text-muted-foreground">{balanceCentavos > 0 ? "le deben" : "debe"}</p>}
      </div>
    </li>
  );
}
