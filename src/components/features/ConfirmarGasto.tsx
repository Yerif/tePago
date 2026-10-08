"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/cozy/Avatar";
import { Pill } from "@/components/cozy/Pill";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { textoProblema } from "@/lib/ai/avisos";
import type { EstadoAvatar } from "@/lib/game/avatar";
import { calcularBorrador, type BorradorGasto, type RenglonBorrador } from "@/lib/splits/borrador";
import { formatoMXN, parsearMonto, parsearPorcentaje } from "@/lib/splits/formato";
import type { Ajuste } from "@/lib/splits/itemizado";
import { cn } from "@/lib/utils";

export interface MiembroConfirmar {
  id: string;
  nombre: string;
  base: string;
  estado: EstadoAvatar;
}

export interface ConfirmarGastoProps {
  miembros: MiembroConfirmar[];
  quienEscribeId: string;
  /** Lo que la persona escribió, para que vea qué se entendió. */
  textoOriginal: string;
  borradorInicial: BorradorGasto;
  /** Avisos ya redactados (`avisosDeB1`). */
  avisos: string[];
}

const NUMERO = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 });

function textoDeAjuste(a: Ajuste | null): string {
  if (a === null) return "";
  return a.tipo === "porcentaje" ? `${NUMERO.format(a.puntosBase / 100)}%` : formatoMXN(a.centavos);
}

/** "10", "10%" → porcentaje; "$200" → monto; vacío → ninguno; null si no se entiende. */
function ajusteDeTexto(texto: string): Ajuste | null | "invalido" {
  const t = texto.trim();
  if (t === "") return null;
  if (t.startsWith("$")) {
    const centavos = parsearMonto(t);
    return centavos === null ? "invalido" : { tipo: "monto", centavos };
  }
  const puntosBase = parsearPorcentaje(t);
  return puntosBase === null ? "invalido" : { tipo: "porcentaje", puntosBase };
}

const alternar = <T,>(lista: readonly T[], valor: T): T[] => (lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor]);

/** Confirmación/corrección de un borrador de gasto. Todo local en la demo: guardar es un ticket con backend. */
export function ConfirmarGasto({ miembros, quienEscribeId, textoOriginal, borradorInicial, avisos }: ConfirmarGastoProps) {
  const [descripcion, setDescripcion] = useState(borradorInicial.descripcion);
  const [totalTexto, setTotalTexto] = useState(borradorInicial.totalCentavos === null ? "" : formatoMXN(borradorInicial.totalCentavos).replace("$", ""));
  const [pagadorId, setPagadorId] = useState(borradorInicial.pagadorId);
  const [restoEntre, setRestoEntre] = useState<string[] | null>(borradorInicial.restoEntre);
  const [renglones, setRenglones] = useState<RenglonBorrador[]>(borradorInicial.renglones);
  const [propinaTexto, setPropinaTexto] = useState(textoDeAjuste(borradorInicial.propina));
  const [guardado, setGuardado] = useState<string | null>(null);

  const total = totalTexto.trim() === "" ? null : parsearMonto(totalTexto);
  const totalInvalido = totalTexto.trim() !== "" && total === null;
  const propina = ajusteDeTexto(propinaTexto);
  const propinaInvalida = propina === "invalido";

  const borrador: BorradorGasto = useMemo(
    () => ({
      ...borradorInicial,
      descripcion,
      totalCentavos: total,
      pagadorId,
      restoEntre,
      renglones,
      propina: propina === "invalido" ? null : propina,
    }),
    [borradorInicial, descripcion, total, pagadorId, restoEntre, renglones, propina],
  );
  const calculo = useMemo(() => calcularBorrador(borrador, quienEscribeId), [borrador, quienEscribeId]);
  const nombreDe = (id: string) => miembros.find((m) => m.id === id)?.nombre ?? id;

  function alternarEnRenglon(indice: number, userId: string) {
    setRenglones((prev) =>
      prev.map((r, i) => {
        if (i !== indice) return r;
        const ya = r.reparto.some((x) => x.userId === userId);
        return { ...r, reparto: ya ? r.reparto.filter((x) => x.userId !== userId) : [...r.reparto, { userId, partes: 1 }] };
      }),
    );
  }

  function confirmar() {
    if (!calculo.resultado) return;
    setGuardado(`¡Listo! ${descripcion.trim() || "Gasto"} por ${formatoMXN(calculo.resultado.totalCentavos)} · +10 XP 🌻`);
  }

  const chip = (activo: boolean) =>
    cn(
      "flex min-h-11 items-center gap-2 rounded-full border-2 py-1 pr-3 pl-1 text-sm font-semibold",
      activo ? "border-grass bg-grass-soft text-grass-text" : "border-border bg-card text-muted-foreground line-through",
    );

  return (
    <section data-component="ConfirmarGasto" className="flex flex-col gap-4">
      <Card size="sm">
        <p className="text-sm text-muted-foreground">Escribiste</p>
        <p className="mt-1 italic" data-testid="ia-original">
          “{textoOriginal}”
        </p>
      </Card>

      <h2 className="font-display text-2xl font-bold">Entendí esto 🌻</h2>

      {avisos.length > 0 && (
        <ul className="flex flex-col items-start gap-2" data-testid="ia-avisos">
          {avisos.map((a) => (
            <li key={a}>
              <Pill variant="lemon" data-testid="ia-aviso">
                {a}
              </Pill>
            </li>
          ))}
        </ul>
      )}

      <Card className="flex flex-col gap-4">
        <div>
          <label htmlFor="ia-descripcion" className="mb-1 block text-sm text-muted-foreground">
            ¿De qué fue?
          </label>
          <input id="ia-descripcion" data-testid="ia-descripcion" maxLength={60} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full rounded-2xl border-[2.5px] border-border bg-background px-4 py-2 min-h-11" />
        </div>

        <div>
          <label htmlFor="ia-total" className="mb-1 block text-sm text-muted-foreground">
            Total de la cuenta
          </label>
          <input id="ia-total" data-testid="ia-total" inputMode="decimal" autoComplete="off" value={totalTexto} onChange={(e) => setTotalTexto(e.target.value)} aria-invalid={totalInvalido} className="w-full rounded-2xl border-[2.5px] border-border bg-background px-4 py-2 font-display text-2xl font-bold" />
          {totalInvalido && <p className="mt-1 text-sm text-rose-text">Escribe un monto como 850 o 1240.50</p>}
        </div>

        <div>
          <label htmlFor="ia-pagador" className="mb-1 block text-sm text-muted-foreground">
            Pagó {calculo.pagadorPropuesto && <span>(lo puse a tu nombre, cámbialo si no fue así)</span>}
          </label>
          <select id="ia-pagador" data-testid="ia-pagador" value={calculo.pagadorId} onChange={(e) => setPagadorId(e.target.value)} className="w-full rounded-2xl border-[2.5px] border-border bg-background px-4 py-2 min-h-11">
            {miembros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id === quienEscribeId ? `${m.nombre} (yo)` : m.nombre}
              </option>
            ))}
          </select>
        </div>

        {renglones.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Renglones (toca para quitar o agregar a alguien)</p>
            {renglones.map((r, i) => (
              <div key={i} className="rounded-2xl border-2 border-border p-3" data-testid={`ia-renglon-${i}`}>
                <p className="font-semibold">
                  {r.cantidad > 1 ? `${r.cantidad} × ` : ""}
                  {r.nombre}{" "}
                  <span className="font-normal text-muted-foreground">
                    {r.importeCentavos !== null ? formatoMXN(r.importeCentavos) : r.precioUnitarioCentavos !== null ? `${formatoMXN(r.precioUnitarioCentavos)} c/u` : "sin monto"}
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {miembros.map((m) => {
                    const dentro = r.reparto.some((x) => x.userId === m.id);
                    return (
                      <button key={m.id} type="button" aria-pressed={dentro} data-testid={`ia-renglon-${i}-${m.id}`} onClick={() => alternarEnRenglon(i, m.id)} className={chip(dentro)}>
                        <Avatar base={m.base} estado={m.estado} size="sm" compacto neutro className="size-8" />
                        {m.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <fieldset>
          <legend className="mb-2 text-sm text-muted-foreground">
            {renglones.length > 0 ? "El resto de la cuenta, entre quiénes" : "Entre quiénes (toca para quitar)"}
          </legend>
          <div className="flex flex-wrap gap-2">
            {miembros.map((m) => {
              const dentro = (restoEntre ?? []).includes(m.id);
              return (
                <button key={m.id} type="button" aria-pressed={dentro} data-testid={`ia-resto-${m.id}`} onClick={() => setRestoEntre((prev) => alternar(prev ?? [], m.id))} className={chip(dentro)}>
                  <Avatar base={m.base} estado={m.estado} size="sm" compacto neutro className="size-8" />
                  {m.nombre}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="ia-propina" className="mb-1 block text-sm text-muted-foreground">
            Propina (opcional)
          </label>
          <input id="ia-propina" data-testid="ia-propina" autoComplete="off" placeholder="10% o $200" value={propinaTexto} onChange={(e) => setPropinaTexto(e.target.value)} aria-invalid={propinaInvalida} className="w-full rounded-2xl border-[2.5px] border-border bg-background px-4 py-2 min-h-11" />
          {propinaInvalida && <p className="mt-1 text-sm text-rose-text">Escríbela como 10% o $200</p>}
        </div>
      </Card>

      <Card size="sm" data-testid="ia-resultado" aria-live="polite">
        {calculo.problemas.length > 0 && (
          <ul className="mb-2 flex flex-col gap-1">
            {calculo.problemas.map((p, i) => (
              <li key={`${p.codigo}-${i}`} data-testid={`ia-problema-${p.codigo}`} className={p.bloqueante ? "text-rose-text" : "text-lemon-text"}>
                {textoProblema(p)}
              </li>
            ))}
          </ul>
        )}
        {calculo.resultado ? (
          <ul className="flex flex-col gap-2">
            {Object.entries(calculo.resultado.porPersona).map(([id, p]) => (
              <li key={id} className="flex items-center justify-between" data-testid={`ia-parte-${id}`}>
                <span>{nombreDe(id)}</span>
                <span className="font-display font-bold">{formatoMXN(p.totalCentavos)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between border-t-2 border-border pt-2 text-muted-foreground">
              <span>Total</span>
              <span className="font-display font-bold" data-testid="ia-total-calculado">
                {formatoMXN(calculo.resultado.totalCentavos)}
              </span>
            </li>
          </ul>
        ) : (
          <p className="text-muted-foreground">Completa lo que falta y te muestro cuánto le toca a cada quien.</p>
        )}
      </Card>

      <Button size="lg" disabled={!calculo.resultado} onClick={confirmar} data-testid="ia-confirmar">
        Confirmar gasto
      </Button>
      {guardado && (
        <Pill variant="grass" data-testid="ia-guardado" className="self-start">
          {guardado}
        </Pill>
      )}
    </section>
  );
}
