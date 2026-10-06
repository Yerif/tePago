"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ETIQUETA_ESTADO } from "@/components/cozy/Avatar";
import { Pill } from "@/components/cozy/Pill";
import { XPBar } from "@/components/cozy/XPBar";
import { FilaCuenta } from "@/components/features/FilaCuenta";
import { FriendRow } from "@/components/features/FriendRow";
import { GastoDetalle } from "@/components/features/GastoDetalle";
import { HojaPago } from "@/components/features/HojaPago";
import { ToastPago } from "@/components/features/ToastPago";
import { usePagarPersona } from "@/components/features/usePagarPersona";
import { useGruposConPerfiles } from "@/components/features/usePerfilesDemo";
import { Personaje } from "@/components/personaje/Personaje";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apariencia } from "@/lib/game/apariencia";
import { estadoAvatar, situacionEnGrupo } from "@/lib/game/avatar";
import { progresoNivel, xpAcumuladaParaNivel } from "@/lib/game/levels";
import { declararPagoPlan } from "@/lib/game/pagarPlan";
import type { GrupoDemo } from "@/lib/mock/tipos";
import { balancesNetos } from "@/lib/splits/balances";
import { avisosParaPagador, centavosEnDisputa, centavosPendientes, paresConfirmados, paresVigentes, xpPorPagosConfirmados } from "@/lib/splits/confirmacion";
import { deudasEntrePersonas } from "@/lib/splits/deudas";
import { formatoMXN } from "@/lib/splits/formato";
import { aplicarPagos, type Pago } from "@/lib/splits/pagos";
import { planDePagos } from "@/lib/splits/plan";
import { reservaDeCuenta, resumenPorPersona } from "@/lib/splits/resumen";

export interface DetalleGrupoInteractivoProps {
  grupos: GrupoDemo[];
  grupoId: string;
  yo: string;
  /** Instante de la página (ISO): las edades de las deudas se miden contra él. */
  ahoraIso: string;
}

interface PlanElegido {
  personaId: string;
  centavos: number;
  pares: Pago[];
}

/**
 * Detalle del grupo. Orden: mis cuentas (lo que pago y lo que me pagan) → pagar menos veces (opcional) → cómo va la
 * banda → gastos → todas las deudas del grupo (plegado). Pagar deja el pago pendiente hasta que quien recibe lo confirma
 * (CLAUDE.md §7).
 */
export function DetalleGrupoInteractivo({ grupos: gruposBase, grupoId, yo, ahoraIso }: DetalleGrupoInteractivoProps) {
  const ahora = new Date(ahoraIso);
  const grupos = useGruposConPerfiles(gruposBase);
  const miembrosTodos = new Map(grupos.flatMap((g) => g.miembros.map((m) => [m.id, m] as const)));
  const nombres = Object.fromEntries([...miembrosTodos].map(([id, m]) => [id, m.nombre]));
  const { registros, toast, error, pagar, pagarPlan, deshacer, cancelarA, cerrarToast } = usePagarPersona(grupos, yo, nombres);
  const [hoja, setHoja] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanElegido | null>(null);
  const [festejos, setFestejos] = useState(0);
  const [errorPlan, setErrorPlan] = useState<string | null>(null);

  // Solo los pagos CONFIRMADOS saldan deudas, cambian balances y personaje.
  const vista = grupos.map((g) => ({ ...g, gastos: aplicarPagos(g.gastos, paresConfirmados(registros, g.id)) }));
  const estadoDe = (id: string) => estadoAvatar(vista.filter((g) => g.miembros.some((m) => m.id === id)).map((g) => situacionEnGrupo(g.gastos, id, ahora)));
  const hayConfirmacionSinVer = avisosParaPagador(registros, yo).some((r) => r.estado === "confirmado" && r.xp > 0 && r.grupoId === grupoId);

  // Si alguien confirmó un pago tuyo y aún no lo has visto en el inicio, el personaje festeja al entrar.
  useEffect(() => {
    if (hayConfirmacionSinVer) setFestejos((n) => (n === 0 ? 1 : n));
  }, [hayConfirmacionSinVer]);

  const grupo = grupos.find((g) => g.id === grupoId);
  const yoBase = grupo?.miembros.find((m) => m.id === yo);
  const grupoVista = vista.find((g) => g.id === grupoId);
  if (!grupo || !yoBase || !grupoVista) return null;

  const balances = balancesNetos(grupoVista.gastos);
  const deudas = deudasEntrePersonas(grupoVista.gastos);
  const resumen = resumenPorPersona([grupoVista], yo, ahora);
  const planRutas = planDePagos(balances).filter((t) => t.deId === yo);
  const gastos = [...grupo.gastos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const pendientesDe = (gastoId: string) =>
    Object.fromEntries(grupoVista.gastos.find((g) => g.id === gastoId)?.partes.map((p) => [p.userId, p.saldado ? 0 : p.centavos]) ?? []);

  const progreso = progresoNivel(xpAcumuladaParaNivel(yoBase.nivel) + yoBase.xp + xpPorPagosConfirmados(registros, yo));
  const estadoYo = estadoDe(yo);

  const miembro = (id: string) => grupo.miembros.find((m) => m.id === id);
  const cuentaHoja = hoja ? resumen.debes.find((c) => c.personaId === hoja) : undefined;
  const reservaHoja = cuentaHoja ? reservaDeCuenta(cuentaHoja, registros, yo) : null;

  const frase = (deudor: string, acreedor: string, monto: string) => {
    if (deudor === yo) return `Le debes ${monto} a ${nombres[acreedor]} 😬`;
    if (acreedor === yo) return `${nombres[deudor]} te debe ${monto}`;
    return `${nombres[deudor]} le debe ${monto} a ${nombres[acreedor]}`;
  };

  /** "Pagar menos veces": ¿se puede? y por quién pasa el dinero. */
  function elegirPlan(personaId: string, centavos: number) {
    const r = declararPagoPlan(grupo!.gastos, paresVigentes(registros, grupoId), yo, personaId, centavos);
    if (!r.ok) return setErrorPlan("Este pago todavía no se puede hacer así. Paga la deuda directa.");
    setErrorPlan(null);
    setPlan({ personaId, centavos, pares: r.pares });
  }
  const viaDelPlan = (pares: Pago[]) =>
    pares
      .filter((p) => p.deudorId !== yo)
      .map((p) => `${nombres[p.deudorId]} se lo pasará a ${nombres[p.acreedorId]} (${formatoMXN(p.centavos)})`);

  return (
    <main data-component="DetalleGrupoInteractivo" className="mx-auto flex max-w-md flex-col gap-5 p-6">
      <Link href={`/dev/demo/g/${grupo.id}`} className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline">
        ← {grupo.icono} {grupo.nombre}
      </Link>
      <h1 className="font-display text-3xl font-bold">Detalle</h1>

      <Card size="sm" className="flex items-center gap-4" data-testid="mi-personaje">
        <Personaje
          celebrar={festejos}
          className="h-28 w-28 shrink-0"
          apariencia={apariencia({ base: yoBase.base, estado: estadoYo, skin: yoBase.skinActivo, nivel: progreso.nivel })}
          estado={estadoYo}
        />
        <div className="min-w-0 flex-1">
          <Pill variant={estadoYo === "clean" ? "grass" : estadoYo === "mild" ? "lemon" : "rose"} data-testid="mi-estado">
            {ETIQUETA_ESTADO[estadoYo]}
          </Pill>
          <XPBar className="mt-2" nivel={progreso.nivel} xp={progreso.xpEnNivel} xpSiguiente={progreso.xpSiguiente} />
        </div>
      </Card>

      {error ? (
        <p role="alert" data-testid="pagar-error" className="text-rose-text">
          {error}
        </p>
      ) : null}

      <section data-testid="mis-cuentas" className="flex flex-col gap-2">
        <h2 className="font-display text-xl font-bold">Mis cuentas</h2>
        {resumen.debes.length === 0 && resumen.teDeben.length === 0 ? (
          <p data-testid="sin-deudas" className="text-muted-foreground">
            ¡Todo en orden en este grupo! 🌻
          </p>
        ) : null}
        {resumen.debes.length > 0 && (
          <ul className="flex flex-col gap-2" data-testid="deudas">
            {resumen.debes.map((c) => (
              <FilaCuenta
                key={c.personaId}
                cuenta={c}
                nombre={nombres[c.personaId] ?? c.personaId}
                base={miembro(c.personaId)?.base ?? "persona-sol"}
                estado={estadoDe(c.personaId)}
                reserva={reservaDeCuenta(c, registros, yo)}
                ocultarDesglose
                onPagar={() => setHoja(c.personaId)}
                onCancelar={() => cancelarA(c.personaId)}
              />
            ))}
          </ul>
        )}
        {resumen.teDeben.length > 0 && (
          <>
            <h3 className="mt-2 font-semibold text-muted-foreground">Te van a pagar</h3>
            <ul className="flex flex-col gap-2">
              {resumen.teDeben.map((c) => (
                <FilaCuenta
                  key={c.personaId}
                  cuenta={c}
                  nombre={nombres[c.personaId] ?? c.personaId}
                  base={miembro(c.personaId)?.base ?? "persona-sol"}
                  estado={estadoDe(c.personaId)}
                  reserva={null}
                  ocultarDesglose
                />
              ))}
            </ul>
          </>
        )}
      </section>

      {planRutas.length > 0 && (
        <details id="como-pagarse" data-testid="como-pagarse" className="rounded-3xl border-[2.5px] border-border bg-card p-4">
          <summary className="flex min-h-11 cursor-pointer items-center font-display text-lg font-bold">Pagar menos veces 🪄</summary>
          <div className="mt-2 flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Si te sirve, puedes saldar todo con menos pagos: el dinero pasa por otras personas y <strong>todas deben confirmarlo</strong>. Ojo: la cifra puede ser distinta a lo que le debes a cada quien.
            </p>
            <ul className="flex flex-col gap-3">
              {planRutas.map((t) => {
                const pendiente = centavosPendientes(registros, grupoId, yo, t.aId) + centavosEnDisputa(registros, grupoId, yo, t.aId);
                const restante = t.centavos - pendiente;
                return (
                  <li key={`${t.deId}>${t.aId}`} data-testid={`plan-${t.deId}-${t.aId}`} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        Págale a {nombres[t.aId]} <strong>{formatoMXN(t.centavos)}</strong>
                      </span>
                      {pendiente > 0 && (
                        <Pill variant="lemon" data-testid={`plan-pendiente-${t.deId}-${t.aId}`}>
                          ⏳ por confirmar
                        </Pill>
                      )}
                      {restante > 0 && (
                        <Button size="sm" data-testid={`plan-pagar-${t.deId}-${t.aId}`} onClick={() => elegirPlan(t.aId, restante)}>
                          Pagar así
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {errorPlan && (
              <p role="alert" className="text-rose-text">
                {errorPlan}
              </p>
            )}
          </div>
        </details>
      )}

      <section>
        <h2 className="font-display text-xl font-bold">Cómo va la banda</h2>
        <Card size="sm" className="mt-2">
          <ul className="divide-y-2 divide-border">
            {grupo.miembros.map((m) => (
              <FriendRow key={m.id} miembro={{ ...m, estado: m.id === yo ? estadoYo : estadoDe(m.id) }} balanceCentavos={balances[m.id] ?? 0} esYo={m.id === yo} />
            ))}
          </ul>
        </Card>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Gastos</h2>
        <div className="mt-2 flex flex-col gap-3">
          {gastos.map((g) => (
            <GastoDetalle key={g.id} gasto={g} nombres={nombres} ahora={ahora} pendientes={pendientesDe(g.id)} />
          ))}
        </div>
      </section>

      <details data-testid="todas-las-deudas" className="rounded-3xl border-[2.5px] border-border bg-card p-4">
        <summary className="flex min-h-11 cursor-pointer items-center font-display text-lg font-bold">Todas las deudas del grupo</summary>
        {deudas.length === 0 ? (
          <p className="mt-2 text-muted-foreground">Nadie le debe a nadie 🌻</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2" data-testid="deudas-todas">
            {deudas.map((d) => (
              <li key={`${d.deudorId}-${d.acreedorId}`} data-testid={`deuda-${d.deudorId}-${d.acreedorId}`}>
                {frase(d.deudorId, d.acreedorId, formatoMXN(d.centavos))}
              </li>
            ))}
          </ul>
        )}
      </details>

      {cuentaHoja && reservaHoja && reservaHoja.disponibleCentavos > 0 && (
        <HojaPago
          titulo={`Pagarle a ${nombres[cuentaHoja.personaId]}`}
          detalle={[]}
          totalCentavos={reservaHoja.disponibleCentavos}
          onCerrar={() => setHoja(null)}
          onConfirmar={(centavos) => {
            if (pagar(cuentaHoja.personaId, reservaHoja.disponibles, centavos)) setHoja(null);
          }}
        />
      )}
      {plan && (
        <HojaPago
          titulo={`Pagarle a ${nombres[plan.personaId]} (pagar menos veces)`}
          detalle={viaDelPlan(plan.pares)}
          totalCentavos={plan.centavos}
          editable={false}
          onCerrar={() => setPlan(null)}
          onConfirmar={() => {
            pagarPlan(grupoId, plan.personaId, plan.centavos, plan.pares);
            setPlan(null);
          }}
        />
      )}
      {toast && <ToastPago texto={toast.texto} onDeshacer={deshacer} onCerrar={cerrarToast} />}
    </main>
  );
}
