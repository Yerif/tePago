"use client";

import { Avatar } from "@/components/cozy/Avatar";
import { Pill } from "@/components/cozy/Pill";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { EstadoAvatar } from "@/lib/game/avatar";
import { formatoMXN } from "@/lib/splits/formato";
import type { CuentaConPersona, ReservaDeCuenta } from "@/lib/splits/resumen";
import { tiempoDesdeHoras } from "@/lib/tiempo";
import { Chevron } from "@/components/ui/Chevron";

export interface FilaCuentaProps {
  cuenta: CuentaConPersona;
  nombre: string;
  base: string;
  estado: EstadoAvatar;
  /** Accesorio de la skin activa de la persona (se ve como sello sobre su miniatura). */
  accesorio?: string;
  /** `null` en filas de "te deben": no hay nada que pagar. */
  reserva: ReservaDeCuenta | null;
  onPagar?: () => void;
  onCancelar?: () => void;
  /** Etiqueta del grupo cuando solo hay uno (en el detalle del grupo no hace falta). */
  ocultarDesglose?: boolean;
}

/** Una persona con quien tienes cuentas: cuánto, desde cuándo, desglose por grupo y, si debes, Pagar. */
export function FilaCuenta({ cuenta, nombre, base, estado, accesorio, reserva, onPagar, onCancelar, ocultarDesglose = false }: FilaCuentaProps) {
  const id = cuenta.personaId;
  return (
    <li data-testid={`cuenta-${id}`}>
      <Card size="sm" className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Avatar base={base} estado={estado} accesorio={accesorio} size="sm" compacto />
          <div className="min-w-0 flex-1">
            <p className="break-words font-semibold">{nombre}</p>
            <p className="text-sm text-muted-foreground">
              {tiempoDesdeHoras(cuenta.masViejaHoras)} · {cuenta.porGrupo.length === 1 ? cuenta.porGrupo[0]?.nombre : `${cuenta.porGrupo.length} grupos`}
            </p>
          </div>
          <p data-testid={`cuenta-monto-${id}`} className={reserva ? "font-display text-lg font-bold text-rose-text" : "font-display text-lg font-bold text-grass-text"}>
            {formatoMXN(cuenta.centavos)}
          </p>
        </div>

        {reserva && reserva.pendienteCentavos > 0 && (
          <Pill variant="lemon" className="self-start" data-testid={`cuenta-pendiente-${id}`}>
            ⏳ {formatoMXN(reserva.pendienteCentavos)} por confirmar
          </Pill>
        )}
        {reserva && reserva.disputaCentavos > 0 && (
          <Pill variant="rose" className="self-start" data-testid={`cuenta-disputa-${id}`}>
            ⚠️ {nombre} dice que no le llegó {formatoMXN(reserva.disputaCentavos)}
          </Pill>
        )}

        {reserva && (
          <div className="flex flex-wrap items-center gap-2">
            {reserva.disponibleCentavos > 0 && (
              <Button size="md" data-testid={`cuenta-pagar-${id}`} onClick={onPagar}>
                Pagar {formatoMXN(reserva.disponibleCentavos)}
              </Button>
            )}
            {reserva.pendienteCentavos + reserva.disputaCentavos > 0 && (
              <Button size="md" variant="outline" data-testid={`cuenta-cancelar-${id}`} onClick={onCancelar}>
                Cancelar pago
              </Button>
            )}
          </div>
        )}

        {!ocultarDesglose && cuenta.porGrupo.length > 1 && (
          <details className="text-sm">
            <summary className="flex min-h-11 cursor-pointer items-center text-muted-foreground">
              <span className="underline">Ver desglose</span>
              <Chevron className="ml-1 pl-0 text-base" />
            </summary>
            <ul className="flex flex-col gap-1 pb-1">
              {cuenta.porGrupo.map((g) => (
                <li key={g.grupoId} className="flex justify-between">
                  <span>
                    {g.icono} {g.nombre}
                  </span>
                  <span className="font-semibold">{formatoMXN(g.centavos)}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Card>
    </li>
  );
}
