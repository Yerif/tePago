"use client";

import { useState } from "react";
import { Avatar, ETIQUETA_ESTADO } from "@/components/cozy/Avatar";
import { Pill } from "@/components/cozy/Pill";
import { XPBar } from "@/components/cozy/XPBar";
import { SkinSelector, type SkinOpcion } from "@/components/features/SkinSelector";
import { usePerfilesDemo } from "@/components/features/usePerfilesDemo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BASE_SLUGS, BASES, type BaseSlug } from "@/lib/game/apariencia";
import type { EstadoAvatar } from "@/lib/game/avatar";
import { validarNombre } from "@/lib/game/perfil";
import { cn } from "@/lib/utils";

export interface PerfilYoProps {
  id: string;
  nombre: string;
  base: BaseSlug;
  estado: EstadoAvatar;
  nivel: number;
  xp: number;
  xpSiguiente: number;
  skinActiva: string;
  skins: SkinOpcion[];
  badges: { slug: string; nombre: string; variant: "lemon" | "mint" | "rose" | "grass" | "lavender" | "neutral" }[];
}

/**
 * La pestaña Yo: nombre y personaje editables (se ven en todas las pantallas y para los demás), skins, nivel y badges.
 * Cambiar de personaje no pierde nivel, XP, badges ni skins (CLAUDE.md §7, "Perfil editable").
 */
export function PerfilYo({ id, nombre, base, estado, nivel, xp, xpSiguiente, skinActiva, skins, badges }: PerfilYoProps) {
  const { perfiles, cambiar } = usePerfilesDemo();
  const nombreActual = perfiles[id]?.nombre ?? nombre;
  const baseActual = perfiles[id]?.base ?? base;
  const [texto, setTexto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState<string | null>(null);

  function guardarNombre(e: React.FormEvent) {
    e.preventDefault();
    const r = validarNombre(texto ?? nombreActual);
    if (!r.ok) {
      setGuardado(null);
      return setError(r.error);
    }
    setError(null);
    cambiar(id, { nombre: r.nombre });
    setTexto(null);
    setGuardado(`¡Listo! Ahora te ven como «${r.nombre}» 🌻`);
  }

  function elegirBase(b: BaseSlug) {
    cambiar(id, { base: b });
    setGuardado(`¡Listo! Ahora eres ${BASES[b].nombre} ${BASES[b].emoji}`);
    setError(null);
  }

  return (
    <div data-component="PerfilYo" className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Avatar base={baseActual} estado={estado} size="md" compacto />
        <div className="min-w-0">
          <h2 data-testid="perfil-nombre-actual" className="truncate font-display text-2xl font-bold">
            {nombreActual}
          </h2>
          <Pill variant={estado === "clean" ? "grass" : estado === "mild" ? "lemon" : "rose"}>{ETIQUETA_ESTADO[estado]}</Pill>
        </div>
      </header>

      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-bold">Mi perfil</h2>
        <form onSubmit={guardarNombre} className="flex flex-col gap-2" noValidate>
          <label htmlFor="perfil-nombre" className="text-sm text-muted-foreground">
            Tu nombre
          </label>
          <div className="flex gap-2">
            <input
              id="perfil-nombre"
              data-testid="perfil-nombre"
              autoComplete="nickname"
              maxLength={40}
              value={texto ?? nombreActual}
              onChange={(e) => setTexto(e.target.value)}
              aria-invalid={error !== null}
              className="min-h-11 min-w-0 flex-1 rounded-2xl border-[2.5px] border-border bg-background px-4"
            />
            <Button type="submit" size="md" data-testid="perfil-guardar">
              Guardar
            </Button>
          </div>
          {error && (
            <p role="alert" data-testid="perfil-error" className="text-rose-text">
              {error}
            </p>
          )}
        </form>

        <fieldset>
          <legend className="mb-2 text-sm text-muted-foreground">Tu personaje (no pierdes nivel, badges ni skins)</legend>
          <ul className="grid grid-cols-3 gap-2">
            {BASE_SLUGS.map((b) => (
              <li key={b}>
                <button
                  type="button"
                  aria-pressed={b === baseActual}
                  data-testid={`perfil-base-${b}`}
                  onClick={() => elegirBase(b)}
                  className={cn(
                    "flex min-h-11 w-full flex-col items-center gap-1 rounded-2xl border-2 p-2 text-sm font-semibold",
                    b === baseActual ? "border-grass bg-grass-soft text-grass-text" : "border-border bg-card text-muted-foreground",
                  )}
                >
                  <Avatar base={b} estado={estado} size="md" compacto />
                  {BASES[b].nombre}
                </button>
              </li>
            ))}
          </ul>
        </fieldset>
        {guardado && (
          <Pill variant="grass" className="self-start" role="status" data-testid="perfil-guardado">
            {guardado}
          </Pill>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-xl font-bold">Skins</h2>
        <SkinSelector key={id} base={baseActual} nivel={nivel} estado={estado} activaInicial={skinActiva} skins={skins} />
      </Card>

      <Card className="flex flex-col gap-4">
        <XPBar nivel={nivel} xp={xp} xpSiguiente={xpSiguiente} />
        <div className="flex flex-wrap gap-2" data-testid="mis-badges">
          {badges.length === 0 ? <span className="text-muted-foreground">Aún sin badges 🌱</span> : null}
          {badges.map((b) => (
            <Pill key={b.slug} variant={b.variant}>
              {b.nombre}
            </Pill>
          ))}
        </div>
      </Card>
    </div>
  );
}
