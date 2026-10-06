"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { xpAlConfirmar } from "@/lib/game/pagarPlan";
import type { GrupoDemo } from "@/lib/mock/tipos";
import { avisosParaPagador, paresConfirmados, porConfirmar } from "@/lib/splits/confirmacion";
import { formatoMXN } from "@/lib/splits/formato";
import { usePagosDemo } from "./usePagosDemo";

export interface BandejaPagosProps {
  grupos: GrupoDemo[];
  /** Quién está mirando. */
  yo: string;
}

/**
 * Lo primero que ve la persona cuando hay algo por resolver con un pago: si alguien dice que ya le pagó, debe
 * confirmar (o no); si ella pagó, aquí se entera de que se confirmó o se rechazó (CLAUDE.md §7, "Confirmación de pagos").
 */
export function BandejaPagos({ grupos, yo }: BandejaPagosProps) {
  const { registros, resolver, avisado } = usePagosDemo();
  const nombres = Object.fromEntries(grupos.flatMap((g) => g.miembros.map((m) => [m.id, m.nombre])));
  const nombreGrupo = (id: string) => grupos.find((g) => g.id === id)?.nombre ?? id;
  const porResponder = porConfirmar(registros, yo);
  const avisos = avisosParaPagador(registros, yo);
  if (porResponder.length === 0 && avisos.length === 0) return null;

  function confirmar(id: string) {
    const pago = registros.find((r) => r.id === id);
    const grupo = grupos.find((g) => g.id === pago?.grupoId);
    if (!pago || !grupo) return;
    resolver(id, yo, "confirmar", xpAlConfirmar(grupo.gastos, paresConfirmados(registros, grupo.id), pago));
  }

  return (
    <section data-component="BandejaPagos" aria-label="Pagos por confirmar" className="flex flex-col gap-3">
      {porResponder.length > 0 && (
        <ul data-testid="por-confirmar" className="flex flex-col gap-2">
          {porResponder.map((r) => (
            <li key={r.id}>
              <Card size="sm" className="flex flex-col gap-3" data-testid={`por-confirmar-${r.id}`}>
                <p className="font-semibold">
                  {nombres[r.deId] ?? r.deId} dice que ya te pagó {formatoMXN(r.centavos)} 💸
                </p>
                <p className="text-sm text-muted-foreground">{nombreGrupo(r.grupoId)} · ¿Te llegó?</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="md" data-testid={`confirmar-${r.id}`} onClick={() => confirmar(r.id)}>
                    Sí, me llegó
                  </Button>
                  <Button size="md" variant="outline" data-testid={`rechazar-${r.id}`} onClick={() => resolver(r.id, yo, "rechazar", 0)}>
                    No me llegó
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {avisos.length > 0 && (
        <ul data-testid="avisos-pago" className="flex flex-col gap-2">
          {avisos.map((r) => (
            <li key={r.id}>
              <Card size="sm" role="status" className="flex flex-col gap-2" data-testid={`aviso-${r.id}`}>
                {r.estado === "confirmado" ? (
                  <>
                    <p className="font-semibold">
                      ¡{nombres[r.aId] ?? r.aId} confirmó tu pago de {formatoMXN(r.centavos)}! 🎉
                    </p>
                    {r.xp > 0 ? (
                      <p className="text-grass-text" data-testid={`aviso-xp-${r.id}`}>
                        +{r.xp} XP ⚡
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">El XP llega cuando una deuda queda saldada por completo.</p>
                    )}
                  </>
                ) : (
                  <p className="font-semibold">
                    {nombres[r.aId] ?? r.aId} dice que no le ha llegado tu pago de {formatoMXN(r.centavos)}. Tu deuda sigue igual; puedes volver a intentarlo 🙂
                  </p>
                )}
                <Button size="sm" variant="outline" className="self-start" data-testid={`aviso-ok-${r.id}`} onClick={() => avisado([r.id])}>
                  Entendido
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
