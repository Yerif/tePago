"use client";

import Link from "next/link";
import { useState } from "react";
import { BandejaPagos } from "@/components/features/BandejaPagos";
import { nuevoId, usePagosDemo } from "@/components/features/usePagosDemo";
import { Pill } from "@/components/cozy/Pill";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { declararPagoPlan } from "@/lib/game/pagarPlan";
import type { GrupoDemo } from "@/lib/mock/tipos";
import { formatoMXN } from "@/lib/splits/formato";
import { centavosPendientes, paresConfirmados, paresVigentes } from "@/lib/splits/confirmacion";
import { aplicarPagos } from "@/lib/splits/pagos";
import { resumenPersona } from "@/lib/splits/resumen";

export interface ResumenInicioProps {
  grupos: GrupoDemo[];
  /** Quién está mirando. */
  yo: string;
  /** Ruta de un grupo: `${base}/${id}/detalle`. */
  base: string;
}

/** Lo primero que se ve: cuánto debes, cuánto te deben y el pago más sencillo de cada grupo, a un toque de pagar. */
export function ResumenInicio({ grupos, yo, base }: ResumenInicioProps) {
  const { registros, declarar } = usePagosDemo();
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Solo los pagos CONFIRMADOS saldan deudas; los pendientes se marcan aparte.
  const resumen = resumenPersona(
    grupos.map((g) => ({ ...g, gastos: aplicarPagos(g.gastos, paresConfirmados(registros, g.id)) })),
    yo,
  );

  const nombres = Object.fromEntries(grupos.flatMap((g) => g.miembros.map((m) => [m.id, m.nombre])));
  const enOrden = resumen.porGrupo.length === 0;
  const liga = (grupoId: string) => `${base}/${grupoId}/detalle?u=${yo}#como-pagarse`;

  function pagar(grupoId: string, acreedorId: string, centavos: number) {
    const grupo = grupos.find((g) => g.id === grupoId);
    if (!grupo) return;
    const r = declararPagoPlan(grupo.gastos, paresVigentes(registros, grupoId), yo, acreedorId, centavos);
    if (!r.ok) return setError("Este pago no se puede hacer desde aquí: entra al grupo y paga la deuda directa.");
    setError(null);
    declarar({ id: nuevoId(), grupoId, deId: yo, aId: acreedorId, centavos, pares: r.pares, creadoIso: new Date().toISOString() });
    setAviso(`Avisamos a ${nombres[acreedorId] ?? acreedorId} para que confirme tu pago de ${formatoMXN(centavos)} ⏳`);
  }

  return (
    <section data-component="ResumenInicio" aria-label="Tus cuentas" className="flex flex-col gap-3">
      <BandejaPagos grupos={grupos} yo={yo} />
      <div className="grid grid-cols-2 gap-3">
        <Card size="sm" className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Debes</p>
          <p data-testid="inicio-debes" className="font-display text-2xl font-bold text-rose-text">
            {formatoMXN(resumen.debesCentavos)}
          </p>
        </Card>
        <Card size="sm" className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Te deben</p>
          <p data-testid="inicio-te-deben" className="font-display text-2xl font-bold text-grass-text">
            {formatoMXN(resumen.teDebenCentavos)}
          </p>
        </Card>
      </div>

      {aviso && (
        <Card size="sm" role="status" data-testid="inicio-aviso" className="flex flex-col gap-1">
          <p className="font-semibold">{aviso}</p>
        </Card>
      )}
      {error && (
        <p role="alert" className="text-rose-text">
          {error}
        </p>
      )}

      {enOrden ? (
        <Pill variant="grass" className="self-start" data-testid="inicio-en-orden">
          ¡Todo en orden! 🌻
        </Pill>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">La forma más sencilla de quedar a mano en cada grupo:</p>
          <ul className="flex flex-col gap-2">
            {resumen.porGrupo.flatMap((g) => [
              ...g.debes.map((t) => {
                const pendiente = centavosPendientes(registros, g.grupoId, yo, t.aId);
                const restante = t.centavos - pendiente;
                return (
                  <li key={`d-${g.grupoId}-${t.aId}`}>
                    <Card size="sm" className="flex items-center gap-3">
                      <span aria-hidden className="text-2xl">
                        {g.icono}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">Págale a {nombres[t.aId] ?? t.aId} 😬</p>
                        <Link href={liga(g.grupoId)} className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline">
                          {g.nombre}
                        </Link>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="font-display font-bold text-rose-text">{formatoMXN(t.centavos)}</p>
                        {pendiente > 0 && (
                          <Pill variant="lemon" data-testid={`inicio-pendiente-${g.grupoId}-${t.aId}`}>
                            ⏳ {formatoMXN(pendiente)} por confirmar
                          </Pill>
                        )}
                        {restante > 0 && (
                          <Button size="sm" data-testid={`inicio-pagar-${g.grupoId}-${t.aId}`} onClick={() => pagar(g.grupoId, t.aId, restante)}>
                            Pagar
                          </Button>
                        )}
                      </div>
                    </Card>
                  </li>
                );
              }),
              ...g.teDeben.map((t) => (
                <li key={`c-${g.grupoId}-${t.deId}`}>
                  <Link href={liga(g.grupoId)} data-testid={`inicio-cobro-${g.grupoId}-${t.deId}`} className="block rounded-card-sm">
                    <Card size="sm" className="flex items-center gap-3">
                      <span aria-hidden className="text-2xl">
                        {g.icono}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{nombres[t.deId] ?? t.deId} te paga</p>
                        <p className="text-sm text-muted-foreground">{g.nombre}</p>
                      </div>
                      <p className="font-display font-bold text-grass-text">{formatoMXN(t.centavos)}</p>
                    </Card>
                  </Link>
                </li>
              )),
            ])}
          </ul>
        </>
      )}
    </section>
  );
}
