import { Avatar, ETIQUETA_ESTADO } from "@/components/cozy/Avatar";
import { Pill } from "@/components/cozy/Pill";
import { senalesPublicas } from "@/lib/game/reputacion";
import { SKIN_SLUGS, SKINS, type SkinSlug } from "@/lib/game/skins";
import { BADGES_DEMO } from "@/lib/mock/datos";
import type { MiembroDemo } from "@/lib/mock/tipos";
import { formatoMXN } from "@/lib/splits/formato";
import { cn } from "@/lib/utils";

const skinSlug = (slug: string): SkinSlug => SKIN_SLUGS.find((x) => x === slug) ?? "clasico";
const VARIANT_ESTADO = { clean: "grass", mild: "lemon", rekt: "rose" } as const;

export interface FriendRowProps {
  miembro: MiembroDemo;
  /** Saldo neto en centavos: positivo = le deben, negativo = debe. */
  balanceCentavos: number;
  esYo?: boolean;
}

export function FriendRow({ miembro, balanceCentavos, esYo = false }: FriendRowProps) {
  const alCorriente = balanceCentavos === 0;
  const senales = senalesPublicas({ estado: miembro.estado, badges: miembro.badges, balanceCentavos, esYo });
  return (
    <li data-component="FriendRow" data-testid={`friend-${miembro.id}`} className="flex items-center gap-3 py-3">
      <Avatar base={miembro.base} estado={miembro.estado} accesorio={SKINS[skinSlug(miembro.skinActivo)].accesorio} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">
          {miembro.nombre}
          {esYo ? " (tú)" : ""}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {senales.mostrarEstado && (
            <Pill variant={VARIANT_ESTADO[miembro.estado]} data-testid="friend-estado">
              {ETIQUETA_ESTADO[miembro.estado]}
            </Pill>
          )}
          {senales.badges.map((slug) => {
            const badge = BADGES_DEMO[slug];
            return badge ? (
              <Pill key={slug} variant={badge.variant} data-testid={`friend-badge-${slug}`}>
                {badge.nombre}
              </Pill>
            ) : null;
          })}
        </div>
        {senales.negativa === "fantasma" && (
          <p data-testid="friend-fantasma-hint" className="mt-1 text-sm text-muted-foreground">
            Se esfuma al pagar 🌬️
          </p>
        )}
      </div>
      <div className="text-right">
        <p
          data-testid="friend-balance"
          className={cn(
            "font-display text-lg font-bold",
            alCorriente || senales.colorMonto === "neutro" ? "text-foreground" : senales.colorMonto === "favor" ? "text-grass-text" : "text-rose-text",
            alCorriente && "text-muted-foreground",
          )}
        >
          {alCorriente ? "Al corriente ✨" : formatoMXN(Math.abs(balanceCentavos))}
        </p>
        {!alCorriente && <p className="text-sm text-muted-foreground">{balanceCentavos > 0 ? "le deben" : "debe"}</p>}
      </div>
    </li>
  );
}
