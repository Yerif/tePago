"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { xpAlConfirmar } from "@/lib/game/pagarPlan";
import type { GrupoDemo } from "@/lib/mock/tipos";
import { avisosParaPagador, paresConfirmados, porConfirmar, porRevisar, type PagoRegistrado, type Respuesta } from "@/lib/splits/confirmacion";
import { formatoMXN } from "@/lib/splits/formato";
import { useGruposConPerfiles } from "./usePerfilesDemo";
import { usePagosDemo } from "./usePagosDemo";
import { Chevron } from "@/components/ui/Chevron";

export interface BandejaPagosProps {
  grupos: GrupoDemo[];
  /** Quién está mirando. */
  yo: string;
}

/** Agrupa los pagos de un mismo gesto (lote) conservando el orden. */
function porLote(registros: readonly PagoRegistrado[]): PagoRegistrado[][] {
  const lotes = new Map<string, PagoRegistrado[]>();
  for (const r of registros) lotes.set(r.loteId, [...(lotes.get(r.loteId) ?? []), r]);
  return [...lotes.values()];
}

/**
 * Lo primero que ve la persona cuando hay algo por resolver con un pago (CLAUDE.md §7, "Confirmación de pagos"):
 * - si alguien dice que le pagó (o pagó a otra persona a cuenta de lo que le debes), confirmar o no;
 * - pagos que rechazó y puede aprobar más tarde;
 * - si ella pagó, el resultado (confirmado o rechazado).
 */
export function BandejaPagos({ grupos: gruposBase, yo }: BandejaPagosProps) {
  const grupos = useGruposConPerfiles(gruposBase);
  const { registros, responder, cancelar, avisado } = usePagosDemo();
  const nombres = Object.fromEntries(grupos.flatMap((g) => g.miembros.map((m) => [m.id, m.nombre])));
  const nombreGrupo = (id: string) => grupos.find((g) => g.id === id)?.nombre ?? id;
  const nombre = (id: string) => nombres[id] ?? id;

  const porResponder = porLote(porConfirmar(registros, yo));
  const porAprobar = porLote(porRevisar(registros, yo));
  const avisos = porLote(avisosParaPagador(registros, yo));
  if (porResponder.length === 0 && porAprobar.length === 0 && avisos.length === 0) return null;

  /** Responde todo el lote; al confirmar, el XP de cada pago se calcula con las deudas de su grupo. */
  function resolverLote(lote: PagoRegistrado[], decision: Respuesta) {
    const items = lote.map((r) => {
      const grupo = grupos.find((g) => g.id === r.grupoId);
      return { id: r.id, xp: decision === "confirmado" && grupo ? xpAlConfirmar(grupo.gastos, paresConfirmados(registros, grupo.id), r) : 0 };
    });
    responder(items, yo, decision);
  }

  /** Lo que `yo` recibe en el lote y la frase para describirlo. */
  function describir(lote: PagoRegistrado[]) {
    const quien = nombre(lote[0]?.deId ?? "");
    const recibido = lote.flatMap((r) => r.pares.filter((p) => p.acreedorId === yo)).reduce((s, p) => s + p.centavos, 0);
    const directo = lote.some((r) => r.aId === yo);
    if (directo) return `${quien} dice que ya te pagó ${formatoMXN(recibido)} 💸`;
    const intermedio = lote[0]?.aId ?? "";
    return `${quien} le pagó a ${nombre(intermedio)} y con eso se salda lo que ${nombre(intermedio)} te debía (${formatoMXN(recibido)}) 🔁`;
  }
  const gruposDe = (lote: PagoRegistrado[]) => lote.map((r) => nombreGrupo(r.grupoId)).join(" · ");

  /** Una tarjeta compacta por evento: lo que pasó (con su XP en la misma línea) y, si hace falta, qué hacer. */
  function aviso(lote: PagoRegistrado[]) {
    const id = lote[0]?.loteId ?? "";
    const confirmado = lote.every((r) => r.estado === "confirmado");
    const xp = lote.reduce((s, r) => s + r.xp, 0);
    const total = formatoMXN(lote.reduce((s, r) => s + r.centavos, 0));
    const ids = lote.map((r) => r.id);
    const quien = nombre(lote[0]?.aId ?? "");
    return (
      <li key={id}>
        <Card size="sm" role="status" className="flex flex-col gap-2" data-testid={`aviso-${id}`}>
          {confirmado ? (
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">
                ¡{quien} confirmó tu pago de {total}! 🎉
                {xp > 0 ? (
                  <span className="ml-1 whitespace-nowrap text-grass-text" data-testid={`aviso-xp-${id}`}>
                    +{xp} XP ⚡
                  </span>
                ) : null}
                {xp === 0 ? <span className="block text-sm font-normal text-muted-foreground">El XP llega cuando una deuda queda saldada por completo.</span> : null}
              </p>
              <Button size="sm" variant="outline" className="shrink-0" data-testid={`aviso-ok-${id}`} onClick={() => avisado(ids)}>
                Entendido
              </Button>
            </div>
          ) : (
            <>
              <p className="font-semibold">
                {quien} dice que no le ha llegado tu pago de {total}.
              </p>
              <p className="text-sm text-muted-foreground">Tu deuda sigue igual y ese monto queda reservado: {quien} puede aprobarlo más tarde, o puedes cancelarlo.</p>
              <div className="flex flex-wrap gap-2">
                <Button size="md" variant="outline" data-testid={`aviso-cancelar-${id}`} onClick={() => (cancelar(ids, yo), avisado(ids))}>
                  Cancelar pago
                </Button>
                <Button size="md" variant="outline" data-testid={`aviso-ok-${id}`} onClick={() => avisado(ids)}>
                  Entendido
                </Button>
              </div>
            </>
          )}
        </Card>
      </li>
    );
  }

  return (
    <section data-component="BandejaPagos" aria-label="Pagos por resolver" className="flex flex-col gap-3">
      {porResponder.length > 0 && (
        <ul data-testid="por-confirmar" className="flex flex-col gap-2">
          {porResponder.map((lote) => (
            <li key={lote[0]?.loteId}>
              <Card size="sm" className="flex flex-col gap-3" data-testid={`por-confirmar-${lote[0]?.loteId}`}>
                <p className="font-semibold">{describir(lote)}</p>
                <p className="text-sm text-muted-foreground">{gruposDe(lote)} · ¿Te llegó?</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="md" data-testid={`confirmar-${lote[0]?.loteId}`} onClick={() => resolverLote(lote, "confirmado")}>
                    Sí, me llegó
                  </Button>
                  <Button size="md" variant="outline" data-testid={`rechazar-${lote[0]?.loteId}`} onClick={() => resolverLote(lote, "rechazado")}>
                    No me llegó
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {porAprobar.length > 0 && (
        <ul data-testid="por-revisar" className="flex flex-col gap-2">
          {porAprobar.map((lote) => (
            <li key={lote[0]?.loteId}>
              <Card size="sm" className="flex flex-col gap-2" data-testid={`por-revisar-${lote[0]?.loteId}`}>
                <p className="font-semibold">Rechazaste el pago de {nombre(lote[0]?.deId ?? "")} por {formatoMXN(lote.reduce((s, r) => s + r.centavos, 0))}</p>
                <p className="text-sm text-muted-foreground">Si ya te llegó, puedes aprobarlo ahora.</p>
                <Button size="md" variant="outline" className="self-start" data-testid={`aprobar-${lote[0]?.loteId}`} onClick={() => resolverLote(lote, "confirmado")}>
                  Sí, ya me llegó
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {avisos.length > 0 && (
        <div className="flex flex-col gap-2">
          <ul data-testid="avisos-pago" className="flex flex-col gap-2">
            {avisos.slice(0, 1).map(aviso)}
          </ul>
          {/* Un solo aviso a la vista: el resto espera plegado para no empujar "Pagar" fuera de la pantalla. */}
          {avisos.length > 1 && (
            <details data-testid="avisos-mas">
              <summary className="flex min-h-11 cursor-pointer items-center font-semibold">
                Ver {avisos.length - 1} {avisos.length - 1 === 1 ? "aviso más" : "avisos más"}
                <Chevron />
              </summary>
              <ul className="mt-2 flex flex-col gap-2">{avisos.slice(1).map(aviso)}</ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
