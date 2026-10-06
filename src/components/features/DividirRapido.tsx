"use client";

import { useState } from "react";
import { Avatar } from "@/components/cozy/Avatar";
import { Pill } from "@/components/cozy/Pill";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useGruposConPerfiles } from "@/components/features/usePerfilesDemo";
import { ModoPorPersona } from "@/components/features/ModoPorPersona";
import { ModoProducto, type RenglonProducto } from "@/components/features/ModoProducto";
import { calcularBorrador } from "@/lib/splits/borrador";
import { calcularModo, type ModoDividir } from "@/lib/splits/entradaModo";
import { formatoMXN, parsearMonto } from "@/lib/splits/formato";
import { repartirIgual } from "@/lib/splits/igual";
import { cn } from "@/lib/utils";

interface MiembroLite {
  id: string;
  nombre: string;
  base: string;
  estado: "clean" | "mild" | "rekt";
}
interface GrupoLite {
  id: string;
  nombre: string;
  icono: string;
  miembros: MiembroLite[];
}
interface GuardadoDemo {
  id: number;
  descripcion: string;
  grupo: string;
  totalCentavos: number;
  partes: { id: string; nombre: string; centavos: number }[];
  /** Lo que "Montos" no asignó: se queda con el pagador hasta que decida (CLAUDE.md §7). */
  sinAsignarCentavos: number;
  pagadorNombre: string;
  resolucion: "absorbido" | "mio" | null;
}

type Modo = ModoDividir | "producto";
const MODOS: { id: Modo; etiqueta: string }[] = [
  { id: "igual", etiqueta: "⚖️ Igual" },
  { id: "montos", etiqueta: "💵 Montos" },
  { id: "porcentajes", etiqueta: "％ Porcentajes" },
  { id: "partes", etiqueta: "🍰 Partes" },
  { id: "ajustes", etiqueta: "➕ Igual + ajustes" },
  { id: "producto", etiqueta: "🧾 Por producto" },
];

export interface DividirRapidoProps {
  grupos: GrupoLite[];
  yo: string;
  grupoInicial: string;
}

/** Modo rápido: abrir → monto → confirmar (≤ 3 interacciones). Todo local, sin backend. */
export function DividirRapido({ grupos: gruposBase, yo, grupoInicial }: DividirRapidoProps) {
  const grupos = useGruposConPerfiles(gruposBase);
  const [grupoId, setGrupoId] = useState(grupoInicial);
  const [excluidos, setExcluidos] = useState<string[]>([]);
  const [pagador, setPagador] = useState(yo);
  const [texto, setTexto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardados, setGuardados] = useState<GuardadoDemo[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>("igual");
  const [otrasFormas, setOtrasFormas] = useState(false);
  // Lo capturado por modo: al cambiar de modo y volver no se pierde nada.
  const [valores, setValores] = useState<Partial<Record<ModoDividir, Record<string, string>>>>({});
  const [renglones, setRenglones] = useState<RenglonProducto[]>([]);

  const grupo = grupos.find((g) => g.id === grupoId) ?? grupos[0];
  if (!grupo) return null;

  const centavos = parsearMonto(texto);
  const participantes = grupo.miembros.filter((m) => !excluidos.includes(m.id));
  const idsParticipantes = participantes.map((m) => m.id);
  const hayMonto = centavos !== null && centavos > 0 && participantes.length > 0;
  let partes: Record<string, number> | null = null;
  let sinAsignar = 0;
  let salida = null as ReturnType<typeof calcularModo> | null;
  if (hayMonto && modo === "igual") partes = repartirIgual(centavos, idsParticipantes, pagador);
  else if (hayMonto && modo === "producto") {
    // Los productos restan del total; lo demás se divide entre todos. Sin renglones es como "igual".
    const calculo = calcularBorrador(
      {
        descripcion: "",
        categoria: "otros",
        moneda: "MXN",
        totalCentavos: centavos,
        pagadorId: pagador,
        renglones: renglones.map((r) => ({
          nombre: r.nombre,
          cantidad: 1,
          precioUnitarioCentavos: r.centavos,
          importeCentavos: r.centavos,
          reparto: r.quienes.filter((q) => idsParticipantes.includes(q)).map((userId) => ({ userId, partes: 1 })),
        })),
        restoEntre: idsParticipantes,
        propina: null,
        impuestos: null,
      },
      pagador,
    );
    if (calculo.resultado) partes = Object.fromEntries(Object.entries(calculo.resultado.porPersona).map(([id, d]) => [id, d.totalCentavos]));
  } else if (hayMonto && modo !== "producto") {
    salida = calcularModo({ modo, totalCentavos: centavos, participantes: idsParticipantes, pagadorId: pagador, valores: valores[modo] ?? {} });
    partes = salida.puedeGuardar ? salida.partes : null;
    sinAsignar = salida.sinAsignarCentavos;
  }
  const textoInvalido = texto.trim() !== "" && centavos === null;
  const nombreDe = (id: string) => grupo.miembros.find((m) => m.id === id)?.nombre ?? id;

  function cambiarGrupo(id: string) {
    setGrupoId(id);
    setExcluidos([]);
    setPagador(yo);
    setAviso(null);
  }

  function alternar(id: string) {
    setExcluidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function confirmar() {
    if (!partes || centavos === null || !grupo) return;
    setGuardados((prev) => [
      {
        id: prev.length + 1,
        descripcion: descripcion.trim() || "Gasto",
        grupo: grupo.nombre,
        totalCentavos: centavos,
        partes: Object.entries(partes).map(([id, c]) => ({ id, nombre: nombreDe(id), centavos: c })),
        sinAsignarCentavos: sinAsignar,
        pagadorNombre: nombreDe(pagador),
        resolucion: null,
      },
      ...prev,
    ]);
    setAviso(`¡Listo! Guardado en ${grupo.nombre} · +10 XP 🌻 (demo)`);
    setTexto("");
    setDescripcion("");
    setValores({});
    setRenglones([]);
  }

  function resolver(id: number, resolucion: "absorbido" | "mio") {
    setGuardados((prev) => prev.map((g) => (g.id === id ? { ...g, resolucion } : g)));
  }

  return (
    <section data-component="DividirRapido" className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <div>
          <label htmlFor="monto" className="mb-1 block text-sm text-muted-foreground">
            ¿Cuánto fue?
          </label>
          <input
            id="monto"
            data-testid="dividir-monto"
            autoFocus
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            aria-invalid={textoInvalido}
            aria-describedby={textoInvalido ? "monto-ayuda" : undefined}
            className="w-full rounded-2xl border-[2.5px] border-border bg-background px-4 py-3 font-display text-3xl font-bold"
          />
          {textoInvalido && (
            <p id="monto-ayuda" className="mt-1 text-sm text-rose-text">
              Escribe un monto como 850 o 1240.50
            </p>
          )}
        </div>

        <div>
          <label htmlFor="descripcion" className="mb-1 block text-sm text-muted-foreground">
            ¿De qué? (opcional)
          </label>
          <input
            id="descripcion"
            data-testid="dividir-descripcion"
            maxLength={60}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Tacos, Uber, súper…"
            className="w-full rounded-2xl border-[2.5px] border-border bg-background px-4 py-2 min-h-11"
          />
        </div>

        <div>
          <label htmlFor="grupo" className="mb-1 block text-sm text-muted-foreground">
            Grupo
          </label>
          <select
            id="grupo"
            data-testid="dividir-grupo"
            value={grupo.id}
            onChange={(e) => cambiarGrupo(e.target.value)}
            className="min-h-11 w-full rounded-2xl border-[2.5px] border-border bg-background px-4 py-2"
          >
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.icono} {g.nombre}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm text-muted-foreground">Entre quiénes (toca para quitar)</legend>
          <div className="flex flex-wrap gap-2">
            {grupo.miembros.map((m) => {
              const dentro = !excluidos.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={dentro}
                  data-testid={`miembro-${m.id}`}
                  onClick={() => alternar(m.id)}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-full border-2 py-1 pr-3 pl-1 text-sm font-semibold",
                    dentro ? "border-grass bg-grass-soft text-grass-text" : "border-border bg-card text-muted-foreground line-through",
                  )}
                >
                  <Avatar base={m.base} estado={m.estado} size="sm" compacto className="size-9" />
                  {m.nombre}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <Button variant="ghost" size="md" aria-expanded={otrasFormas || modo !== "igual"} data-testid="otras-formas" onClick={() => setOtrasFormas((v) => !v)} className="-ml-4">
            {otrasFormas || modo !== "igual" ? "Otras formas de dividir ▴" : "Otras formas de dividir ▾"}
          </Button>
          {(otrasFormas || modo !== "igual") && (
            <fieldset className="mt-2">
              <legend className="sr-only">¿Cómo lo dividimos?</legend>
              <div className="flex flex-wrap gap-2">
                {MODOS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={m.id === modo}
                    data-testid={`modo-${m.id}`}
                    onClick={() => setModo(m.id)}
                    className={cn(
                      "min-h-11 rounded-full border-2 px-4 py-1 text-sm font-semibold",
                      m.id === modo ? "border-grass bg-grass-soft text-grass-text" : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {m.etiqueta}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>

        {modo !== "igual" && modo !== "producto" && (
          <ModoPorPersona
            modo={modo}
            personas={participantes}
            valores={valores[modo] ?? {}}
            salida={salida ?? { partes: null, sinAsignarCentavos: 0, faltan: 0, sobran: 0, puedeGuardar: false, mensaje: null }}
            onCambio={(id, t) => setValores((prev) => ({ ...prev, [modo]: { ...prev[modo], [id]: t } }))}
          />
        )}
        {modo === "producto" && <ModoProducto personas={participantes} renglones={renglones} onCambio={setRenglones} />}

        <div>
          <label htmlFor="pagador" className="mb-1 block text-sm text-muted-foreground">
            Pagó
          </label>
          <select
            id="pagador"
            data-testid="dividir-pagador"
            value={pagador}
            onChange={(e) => setPagador(e.target.value)}
            className="w-full rounded-2xl border-[2.5px] border-border bg-background px-4 py-2 min-h-11"
          >
            {grupo.miembros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id === yo ? `${m.nombre} (yo)` : m.nombre}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card size="sm" data-testid="dividir-resultado" aria-live="polite">
        {partes ? (
          <ul className="flex flex-col gap-2">
            {Object.entries(partes).map(([id, c]) => (
              <li key={id} className="flex items-center justify-between" data-testid={`parte-${id}`}>
                <span>{nombreDe(id)}</span>
                <span className="font-display font-bold">{formatoMXN(c)}</span>
              </li>
            ))}
            {sinAsignar > 0 && (
              <li className="flex items-center justify-between text-peach-text" data-testid="dividir-sin-asignar">
                <span>Sin asignar (se queda con {nombreDe(pagador)})</span>
                <span className="font-display font-bold">{formatoMXN(sinAsignar)}</span>
              </li>
            )}
            <li className="flex items-center justify-between border-t-2 border-border pt-2 text-muted-foreground">
              <span>Total</span>
              <span data-testid="dividir-total" className="font-display font-bold">
                {formatoMXN(centavos ?? 0)}
              </span>
            </li>
          </ul>
        ) : (
          <p className="text-muted-foreground">
            {participantes.length === 0 ? "Elige al menos a una persona." : "Escribe un monto y te muestro cuánto le toca a cada quien."}
          </p>
        )}
      </Card>

      <div className="sticky bottom-20 z-30 -mx-2 bg-background/90 px-2 py-2 backdrop-blur">
        <Button size="lg" className="w-full" disabled={!partes} onClick={confirmar} data-testid="dividir-confirmar">
          Confirmar gasto
        </Button>
      </div>

      {aviso && (
        <Pill variant="grass" data-testid="dividir-aviso" className="self-start">
          {aviso}
        </Pill>
      )}

      {guardados.length > 0 && (
        <div className="flex flex-col gap-3" data-testid="dividir-guardados">
          <h2 className="font-display text-xl font-bold">Guardados en esta sesión</h2>
          {guardados.map((g) => (
            <Card size="sm" key={g.id}>
              <div className="flex items-baseline justify-between">
                <p className="font-semibold">
                  {g.descripcion} <span className="text-sm font-normal text-muted-foreground">· {g.grupo}</span>
                </p>
                <p className="font-display font-bold">{formatoMXN(g.totalCentavos)}</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {g.partes.map((p) => `${p.nombre} ${formatoMXN(p.centavos)}`).join(" · ")}
              </p>
              {g.sinAsignarCentavos > 0 && (
                <div className="mt-2 flex flex-col gap-2" data-testid={`sin-asignar-${g.id}`}>
                  <p className="text-sm text-peach-text">
                    {g.resolucion === "absorbido"
                      ? `${g.pagadorNombre} absorbió ${formatoMXN(g.sinAsignarCentavos)} 🌻`
                      : g.resolucion === "mio"
                        ? `${formatoMXN(g.sinAsignarCentavos)} marcados como de ${g.pagadorNombre}`
                        : `${formatoMXN(g.sinAsignarCentavos)} sin asignar: nadie los debe todavía.`}
                  </p>
                  {g.resolucion === null && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" data-testid={`sin-asignar-absorber-${g.id}`} onClick={() => resolver(g.id, "absorbido")}>
                        Lo absorbo
                      </Button>
                      <Button size="sm" variant="outline" data-testid={`sin-asignar-mio-${g.id}`} onClick={() => resolver(g.id, "mio")}>
                        Es mío
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
