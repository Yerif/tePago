"use client";

import Link from "next/link";
import { useState } from "react";
import { Pill } from "@/components/cozy/Pill";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { pagarDelPlan } from "@/lib/game/pagarPlan";
import type { GrupoDemo } from "@/lib/mock/tipos";
import { formatoMXN } from "@/lib/splits/formato";
import { aplicarPagos, type Pago } from "@/lib/splits/pagos";
import { resumenPersona } from "@/lib/splits/resumen";

export interface ResumenInicioProps {
  grupos: GrupoDemo[];
  /** Quién está mirando. */
  yo: string;
  /** Ruta de un grupo: `${base}/${id}/detalle`. */
  base: string;
  /** Instante de la página (ISO): la antigüedad de las deudas (y el XP) se miden contra él. */
  ahoraIso: string;
}

type PagoDemo = Pago & { grupoId: string };

/** Lo primero que se ve: cuánto debes, cuánto te deben y el pago más sencillo de cada grupo, a un toque de pagar. */
export function ResumenInicio({ grupos, yo, base, ahoraIso }: ResumenInicioProps) {
  const [pagos, setPagos] = useState<PagoDemo[]>([]);
  const [aviso, setAviso] = useState<{ texto: string; xp: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resumen = resumenPersona(
    grupos.map((g) => ({ ...g, gastos: aplicarPagos(g.gastos, pagos.filter((p) => p.grupoId === g.id)) })),
    yo,
  );

  function pagar(grupoId: string, acreedorId: string, centavos: number) {
    const grupo = grupos.find((g) => g.id === grupoId);
    if (!grupo) return;
    const r = pagarDelPlan(grupo.gastos, pagos.filter((p) => p.grupoId === grupoId), yo, acreedorId, centavos, new Date(ahoraIso));
    if (!r.ok) return setError("Este pago no se puede hacer desde aquí: entra al grupo y paga la deuda directa.");
    setError(null);
    setPagos((prev) => [...prev, ...r.pagos.map((p) => ({ ...p, grupoId }))]);
    setAviso({ texto: `Pagaste ${formatoMXN(centavos)} a ${nombres[acreedorId] ?? acreedorId} 🎉`, xp: r.xp });
  }

  const nombres = Object.fromEntries(grupos.flatMap((g) => g.miembros.map((m) => [m.id, m.nombre])));
  const enOrden = resumen.porGrupo.length === 0;
  const liga = (grupoId: string) => `${base}/${grupoId}/detalle?u=${yo}#como-pagarse`;

  return (
    <section data-component="ResumenInicio" aria-label="Tus cuentas" className="flex flex-col gap-3">
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
          <p className="font-semibold">{aviso.texto}</p>
          {aviso.xp > 0 ? <p className="text-grass-text">+{aviso.xp} XP ⚡</p> : null}
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
              ...g.debes.map((t) => (
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
                      <Button size="sm" data-testid={`inicio-pagar-${g.grupoId}-${t.aId}`} onClick={() => pagar(g.grupoId, t.aId, t.centavos)}>
                        Pagar
                      </Button>
                    </div>
                  </Card>
                </li>
              )),
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
