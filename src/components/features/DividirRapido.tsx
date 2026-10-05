"use client";

import { useState } from "react";
import { Avatar } from "@/components/cozy/Avatar";
import { Pill } from "@/components/cozy/Pill";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatoMXN, parsearMonto } from "@/lib/splits/formato";
import { repartirIgual } from "@/lib/splits/igual";
import { cn } from "@/lib/utils";

interface MiembroLite {
  id: string;
  nombre: string;
  emoji: string;
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
}

export interface DividirRapidoProps {
  grupos: GrupoLite[];
  yo: string;
  grupoInicial: string;
}

/** Modo rápido: abrir → monto → confirmar (≤ 3 interacciones). Todo local, sin backend. */
export function DividirRapido({ grupos, yo, grupoInicial }: DividirRapidoProps) {
  const [grupoId, setGrupoId] = useState(grupoInicial);
  const [excluidos, setExcluidos] = useState<string[]>([]);
  const [pagador, setPagador] = useState(yo);
  const [texto, setTexto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardados, setGuardados] = useState<GuardadoDemo[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);

  const grupo = grupos.find((g) => g.id === grupoId) ?? grupos[0];
  if (!grupo) return null;

  const centavos = parsearMonto(texto);
  const participantes = grupo.miembros.filter((m) => !excluidos.includes(m.id));
  const partes =
    centavos !== null && centavos > 0 && participantes.length > 0
      ? repartirIgual(centavos, participantes.map((m) => m.id), pagador)
      : null;
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
      },
      ...prev,
    ]);
    setAviso(`¡Listo! Guardado en ${grupo.nombre} · +10 XP 🌻 (demo)`);
    setTexto("");
    setDescripcion("");
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

        <fieldset>
          <legend className="mb-2 text-sm text-muted-foreground">Grupo</legend>
          <div className="flex flex-wrap gap-2">
            {grupos.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={g.id === grupo.id}
                data-testid={`grupo-${g.id}`}
                onClick={() => cambiarGrupo(g.id)}
                className={cn(
                  "min-h-11 rounded-full border-2 px-4 py-1 text-sm font-semibold",
                  g.id === grupo.id ? "border-grass bg-grass-soft text-grass-text" : "border-border bg-card text-muted-foreground",
                )}
              >
                {g.icono} {g.nombre}
              </button>
            ))}
          </div>
        </fieldset>

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
                  <Avatar emoji={m.emoji} estado={m.estado} size="sm" className="size-8 text-lg" />
                  {m.nombre}
                </button>
              );
            })}
          </div>
        </fieldset>

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

      <Button size="lg" disabled={!partes} onClick={confirmar} data-testid="dividir-confirmar">
        Confirmar gasto
      </Button>

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
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
