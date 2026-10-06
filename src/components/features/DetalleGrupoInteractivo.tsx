"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { nuevoId, usePagosDemo } from "@/components/features/usePagosDemo";
import { Avatar, ETIQUETA_ESTADO } from "@/components/cozy/Avatar";
import { Pill } from "@/components/cozy/Pill";
import { XPBar } from "@/components/cozy/XPBar";
import { FriendRow } from "@/components/features/FriendRow";
import { GastoDetalle } from "@/components/features/GastoDetalle";
import { Personaje } from "@/components/personaje/Personaje";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apariencia } from "@/lib/game/apariencia";
import { estadoAvatar, situacionEnGrupo } from "@/lib/game/avatar";
import { progresoNivel, xpAcumuladaParaNivel } from "@/lib/game/levels";
import { declararPagoPlan } from "@/lib/game/pagarPlan";
import type { GrupoDemo } from "@/lib/mock/tipos";
import { balancesNetos } from "@/lib/splits/balances";
import { deudasEntrePersonas } from "@/lib/splits/deudas";
import { formatoMXN, parsearMonto } from "@/lib/splits/formato";
import { planDePagos } from "@/lib/splits/plan";
import { avisosParaPagador, centavosPendientes, paresConfirmados, paresVigentes, xpPorPagosConfirmados } from "@/lib/splits/confirmacion";
import { aplicarPagos, type Pago } from "@/lib/splits/pagos";
import { cn } from "@/lib/utils";

interface Reaccion {
  texto: string;
  estado: "clean" | "mild" | "rekt";
}

export interface DetalleGrupoInteractivoProps {
  grupos: GrupoDemo[];
  grupoId: string;
  yo: string;
  /** Instante de la página (ISO): las edades de las deudas se miden contra él. */
  ahoraIso: string;
}

/** Detalle del grupo: pagar (abonos o todo) deja el pago pendiente hasta que quien recibe lo confirma (CLAUDE.md §7). */
export function DetalleGrupoInteractivo({ grupos, grupoId, yo, ahoraIso }: DetalleGrupoInteractivoProps) {
  const ahora = new Date(ahoraIso);
  const { registros, declarar } = usePagosDemo();
  const [reaccion, setReaccion] = useState<Reaccion | null>(null);
  const [festejos, setFestejos] = useState(0);
  const [montos, setMontos] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Solo los pagos CONFIRMADOS saldan deudas, cambian balances y personaje.
  const vista = grupos.map((g) => ({ ...g, gastos: aplicarPagos(g.gastos, paresConfirmados(registros, g.id)) }));
  const estadoDe = (id: string) =>
    estadoAvatar(vista.filter((g) => g.miembros.some((m) => m.id === id)).map((g) => situacionEnGrupo(g.gastos, id, ahora)));
  const hayConfirmacionSinVer = avisosParaPagador(registros, yo).some((r) => r.estado === "confirmado" && r.xp > 0 && r.grupoId === grupoId);

  // Si alguien confirmó un pago tuyo y aún no lo has visto en el inicio, el personaje festeja al entrar.
  useEffect(() => {
    if (hayConfirmacionSinVer) setFestejos((n) => (n === 0 ? 1 : n));
  }, [hayConfirmacionSinVer]);

  const grupo = grupos.find((g) => g.id === grupoId);
  const yoBase = grupo?.miembros.find((m) => m.id === yo);
  const grupoVista = vista.find((g) => g.id === grupoId);
  if (!grupo || !yoBase || !grupoVista) return null;

  const nombres = Object.fromEntries(grupo.miembros.map((m) => [m.id, m.nombre]));
  const balances = balancesNetos(grupoVista.gastos);
  const deudas = deudasEntrePersonas(grupoVista.gastos);
  const plan = planDePagos(balances);
  const gastos = [...grupo.gastos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const pendientesDe = (gastoId: string) =>
    Object.fromEntries(grupoVista.gastos.find((g) => g.id === gastoId)?.partes.map((p) => [p.userId, p.saldado ? 0 : p.centavos]) ?? []);
  const pendienteA = (aId: string) => centavosPendientes(registros, grupoId, yo, aId);

  const progreso = progresoNivel(xpAcumuladaParaNivel(yoBase.nivel) + yoBase.xp + xpPorPagosConfirmados(registros, yo));
  const estadoYo = estadoDe(yo);

  const frase = (deudor: string, acreedor: string, monto: string) => {
    if (deudor === yo) return `Le debes ${monto} a ${nombres[acreedor]} 😬`;
    if (acreedor === yo) return `${nombres[deudor]} te debe ${monto}`;
    return `${nombres[deudor]} le debe ${monto} a ${nombres[acreedor]}`;
  };

  function avisar(acreedorId: string, centavos: number, pares: Pago[]) {
    declarar({ id: nuevoId(), grupoId, deId: yo, aId: acreedorId, centavos, pares, creadoIso: new Date().toISOString() });
    setReaccion({ texto: `Avisamos a ${nombres[acreedorId]} para que confirme tu pago de ${formatoMXN(centavos)} ⏳`, estado: estadoYo });
  }

  function pagar(acreedorId: string, disponibleCentavos: number, centavos: number | null) {
    if (centavos === null || centavos <= 0) return setError("Escribe un monto válido, por ejemplo 150 o 150.50");
    if (centavos > disponibleCentavos)
      return setError(`Solo puedes pagar ${formatoMXN(disponibleCentavos)} (lo demás ya está por confirmar): no pagues de más 🙂`);
    setError(null);
    setMontos((m) => ({ ...m, [acreedorId]: "" }));
    avisar(acreedorId, centavos, [{ deudorId: yo, acreedorId, centavos }]);
  }

  /** Paga una transferencia del plan: se convierte en pagos por pares (si hay cadena A→B→C, A paga a B y B a C). */
  function pagarDelPlan(acreedorId: string, centavos: number) {
    const r = declararPagoPlan(grupo!.gastos, paresVigentes(registros, grupoId), yo, acreedorId, centavos);
    if (!r.ok) return setError("Este pago todavía no se puede hacer desde aquí. Paga la deuda directa.");
    setError(null);
    avisar(acreedorId, centavos, r.pares);
  }

  return (
    <main data-component="DetalleGrupoInteractivo" className="mx-auto flex max-w-md flex-col gap-5 p-6">
      <Link href={`/dev/demo/g/${grupo.id}`} className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline">
        ← {grupo.icono} {grupo.nombre}
      </Link>
      <h1 className="font-display text-3xl font-bold">Detalle</h1>
      <Pill variant="lemon" className="self-start">
        Datos de ejemplo · sin Supabase · nada se guarda
      </Pill>

      <nav aria-label="Probar como" className="flex flex-wrap gap-2">
        {grupo.miembros.map((m) => (
          <Link
            key={m.id}
            href={`/dev/demo/g/${grupo.id}/detalle?u=${m.id}`}
            aria-current={m.id === yo ? "page" : undefined}
            data-testid={`probar-${m.id}`}
            className="inline-flex min-h-11 items-center"
          >
            <Pill variant={m.id === yo ? "grass" : "neutral"}>
              <Avatar base={m.base} estado={estadoDe(m.id)} size="sm" compacto className="size-8 border-0 bg-transparent" /> {m.nombre}
            </Pill>
          </Link>
        ))}
      </nav>

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

      {reaccion ? (
        <Card size="sm" data-testid="reaccion" role="status" className="flex flex-col gap-1">
          <p className="font-semibold">{reaccion.texto}</p>
          <p className="text-sm text-muted-foreground">Tu deuda sigue igual hasta que lo confirme; el XP llega cuando lo haga.</p>
        </Card>
      ) : null}

      <section>
        <h2 className="font-display text-xl font-bold">¿Quién le debe a quién?</h2>
        <Card size="sm" className="mt-2">
          {deudas.length === 0 ? (
            <p data-testid="sin-deudas">¡Todo en orden! 🌻</p>
          ) : (
            <ul className="flex flex-col gap-4" data-testid="deudas">
              {deudas.map((d) => {
                const llave = `${d.deudorId}-${d.acreedorId}`;
                const mia = d.deudorId === yo;
                const pendiente = mia ? pendienteA(d.acreedorId) : 0;
                const disponible = d.centavos - pendiente;
                return (
                  <li key={llave} data-testid={`deuda-${llave}`} className="flex flex-col gap-2">
                    <span className={cn(mia && "font-semibold text-rose-text", d.acreedorId === yo && "font-semibold text-grass-text")}>
                      {frase(d.deudorId, d.acreedorId, formatoMXN(d.centavos))}
                    </span>
                    {pendiente > 0 ? (
                      <Pill variant="lemon" className="self-start" data-testid={`pendiente-${llave}`}>
                        ⏳ {formatoMXN(pendiente)} por confirmar por {nombres[d.acreedorId]}
                      </Pill>
                    ) : null}
                    {mia && disponible > 0 ? (
                      <form
                        className="flex flex-wrap items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          pagar(d.acreedorId, disponible, parsearMonto(montos[d.acreedorId] ?? ""));
                        }}
                      >
                        <label className="sr-only" htmlFor={`monto-${llave}`}>
                          Monto a abonar
                        </label>
                        <input
                          id={`monto-${llave}`}
                          data-testid={`pagar-monto-${llave}`}
                          inputMode="decimal"
                          placeholder="Abonar $"
                          value={montos[d.acreedorId] ?? ""}
                          onChange={(e) => setMontos((m) => ({ ...m, [d.acreedorId]: e.target.value }))}
                          className="h-11 w-28 rounded-2xl border-[2.5px] border-border bg-card px-3"
                        />
                        <Button type="submit" size="md" variant="outline" data-testid={`pagar-abonar-${llave}`}>
                          Abonar
                        </Button>
                        <Button
                          type="button"
                          size="md"
                          variant="grass"
                          data-testid={`pagar-todo-${llave}`}
                          onClick={() => pagar(d.acreedorId, disponible, disponible)}
                        >
                          Pagar todo
                        </Button>
                      </form>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          {error ? (
            <p role="alert" data-testid="pagar-error" className="mt-3 text-rose-text">
              {error}
            </p>
          ) : null}
        </Card>
      </section>

      <section id="como-pagarse" data-testid="como-pagarse">
        <h2 className="font-display text-xl font-bold">Cómo pagarse 🪄</h2>
        <Card size="sm" className="mt-2">
          {plan.length === 0 ? (
            <p className="text-muted-foreground">Nadie tiene que pagarle a nadie. ¡Todo en orden! 🌻</p>
          ) : (
            <>
              <p className="mb-2 text-sm text-muted-foreground">
                La forma más sencilla de dejar todo en cero: {plan.length === 1 ? "1 pago" : `${plan.length} pagos`} en total.
              </p>
              <ul className="flex flex-col gap-2">
                {plan.map((t) => {
                  const pendiente = t.deId === yo ? pendienteA(t.aId) : 0;
                  const restante = t.centavos - pendiente;
                  return (
                    <li key={`${t.deId}>${t.aId}`} className="flex items-center justify-between" data-testid={`plan-${t.deId}-${t.aId}`}>
                      <span>
                        {nombres[t.deId] ?? t.deId} → {nombres[t.aId] ?? t.aId}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-display font-bold">{formatoMXN(t.centavos)}</span>
                        {pendiente > 0 && (
                          <Pill variant="lemon" data-testid={`plan-pendiente-${t.deId}-${t.aId}`}>
                            ⏳ por confirmar
                          </Pill>
                        )}
                        {t.deId === yo && restante > 0 && (
                          <Button size="sm" data-testid={`plan-pagar-${t.deId}-${t.aId}`} onClick={() => pagarDelPlan(t.aId, restante)}>
                            Pagar
                          </Button>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Card>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Balances</h2>
        <Card size="sm" className="mt-2">
          <ul className="divide-y-2 divide-border">
            {grupo.miembros.map((m) => (
              <FriendRow
                key={m.id}
                miembro={{ ...m, estado: m.id === yo ? estadoYo : estadoDe(m.id) }}
                balanceCentavos={balances[m.id] ?? 0}
                esYo={m.id === yo}
              />
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
    </main>
  );
}
