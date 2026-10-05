"use client";

import Link from "next/link";
import { useState } from "react";
import { ETIQUETA_ESTADO } from "@/components/cozy/Avatar";
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
import { xpPorPago } from "@/lib/game/xp";
import type { GrupoDemo } from "@/lib/mock/tipos";
import { balancesNetos } from "@/lib/splits/balances";
import { deudasEntrePersonas } from "@/lib/splits/deudas";
import { formatoMXN, parsearMonto } from "@/lib/splits/formato";
import { aplicarPagos, partesQueSeSaldan, type Pago } from "@/lib/splits/pagos";
import { cn } from "@/lib/utils";

type PagoDemo = Pago & { grupoId: string };

interface Reaccion {
  texto: string;
  xp: number;
  subioNivel: boolean;
  estado: "clean" | "mild" | "rekt";
}

export interface DetalleGrupoInteractivoProps {
  grupos: GrupoDemo[];
  grupoId: string;
  yo: string;
  /** Instante de la página (ISO): las edades de las deudas se miden contra él. */
  ahoraIso: string;
}

/** Detalle del grupo con "Pagar": abonos y pagos totales en memoria, con XP, nivel y personaje reaccionando. */
export function DetalleGrupoInteractivo({ grupos, grupoId, yo, ahoraIso }: DetalleGrupoInteractivoProps) {
  const ahora = new Date(ahoraIso);
  const [pagos, setPagos] = useState<PagoDemo[]>([]);
  const [xpGanada, setXpGanada] = useState(0);
  const [reaccion, setReaccion] = useState<Reaccion | null>(null);
  const [montos, setMontos] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const grupo = grupos.find((g) => g.id === grupoId);
  const yoBase = grupo?.miembros.find((m) => m.id === yo);
  if (!grupo || !yoBase) return null;

  const pagosDe = (id: string, extra: readonly PagoDemo[] = pagos) => extra.filter((p) => p.grupoId === id);
  const vista = (extra: readonly PagoDemo[] = pagos) => grupos.map((g) => ({ ...g, gastos: aplicarPagos(g.gastos, pagosDe(g.id, extra)) }));
  const estadoDe = (id: string, extra: readonly PagoDemo[] = pagos) =>
    estadoAvatar(vista(extra).filter((g) => g.miembros.some((m) => m.id === id)).map((g) => situacionEnGrupo(g.gastos, id, ahora)));

  const grupoVista = vista().find((g) => g.id === grupoId);
  if (!grupoVista) return null;
  const nombres = Object.fromEntries(grupo.miembros.map((m) => [m.id, m.nombre]));
  const balances = balancesNetos(grupoVista.gastos);
  const deudas = deudasEntrePersonas(grupoVista.gastos);
  const gastos = [...grupo.gastos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const pendientesDe = (gastoId: string) =>
    Object.fromEntries(grupoVista.gastos.find((g) => g.id === gastoId)?.partes.map((p) => [p.userId, p.saldado ? 0 : p.centavos]) ?? []);

  const progreso = progresoNivel(xpAcumuladaParaNivel(yoBase.nivel) + yoBase.xp + xpGanada);
  const estadoYo = estadoDe(yo);

  const frase = (deudor: string, acreedor: string, monto: string) => {
    if (deudor === yo) return `Le debes ${monto} a ${nombres[acreedor]} 😬`;
    if (acreedor === yo) return `${nombres[deudor]} te debe ${monto}`;
    return `${nombres[deudor]} le debe ${monto} a ${nombres[acreedor]}`;
  };

  function pagar(acreedorId: string, deudaCentavos: number, centavos: number | null) {
    if (centavos === null || centavos <= 0) return setError("Escribe un monto válido, por ejemplo 150 o 150.50");
    if (centavos > deudaCentavos) return setError(`Solo debes ${formatoMXN(deudaCentavos)}: no pagues de más 🙂`);
    setError(null);
    const pago: Pago = { deudorId: yo, acreedorId, centavos };
    const saldadas = partesQueSeSaldan(grupo!.gastos, pagosDe(grupoId), pago);
    const xp = xpPorPago(saldadas, ahora);
    const siguientes = [...pagos, { ...pago, grupoId }];
    const nivelAntes = progreso.nivel;
    const nivelDespues = progresoNivel(xpAcumuladaParaNivel(yoBase!.nivel) + yoBase!.xp + xpGanada + xp).nivel;
    const quedaDeuda = deudaCentavos - centavos > 0;
    setPagos(siguientes);
    setXpGanada((x) => x + xp);
    setMontos((m) => ({ ...m, [acreedorId]: "" }));
    setReaccion({
      texto: quedaDeuda
        ? `Abonaste ${formatoMXN(centavos)} a ${nombres[acreedorId]}. Te faltan ${formatoMXN(deudaCentavos - centavos)} 🌱`
        : `¡Saldaste con ${nombres[acreedorId]}! 🎉`,
      xp,
      subioNivel: nivelDespues > nivelAntes,
      estado: estadoDe(yo, siguientes),
    });
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
              {m.emoji} {m.nombre}
            </Pill>
          </Link>
        ))}
      </nav>

      <Card size="sm" className="flex items-center gap-4" data-testid="mi-personaje">
        <Personaje className="h-28 w-28 shrink-0" apariencia={apariencia({ base: yoBase.base, estado: estadoYo, skin: yoBase.skinActivo, nivel: progreso.nivel })} estado={estadoYo} />
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
          {reaccion.xp > 0 ? (
            <p data-testid="reaccion-xp" className="text-grass-text">
              +{reaccion.xp} XP ⚡
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">El XP llega cuando una deuda queda saldada por completo.</p>
          )}
          {reaccion.subioNivel ? <p data-testid="reaccion-nivel">¡Subiste de nivel! 🎊</p> : null}
          <p className="text-sm text-muted-foreground">Tu personaje: {ETIQUETA_ESTADO[reaccion.estado].toLowerCase()}</p>
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
                return (
                  <li key={llave} data-testid={`deuda-${llave}`} className="flex flex-col gap-2">
                    <span className={cn(mia && "font-semibold text-rose-text", d.acreedorId === yo && "font-semibold text-grass-text")}>
                      {frase(d.deudorId, d.acreedorId, formatoMXN(d.centavos))}
                    </span>
                    {mia ? (
                      <form
                        className="flex flex-wrap items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          pagar(d.acreedorId, d.centavos, parsearMonto(montos[d.acreedorId] ?? ""));
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
                        <Button type="button" size="md" variant="grass" data-testid={`pagar-todo-${llave}`} onClick={() => pagar(d.acreedorId, d.centavos, d.centavos)}>
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

      <section>
        <h2 className="font-display text-xl font-bold">Balances</h2>
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
    </main>
  );
}
