"use client";

import { useState } from "react";
import { Pill } from "@/components/cozy/Pill";
import { Personaje } from "@/components/personaje/Personaje";
import { apariencia } from "@/lib/game/apariencia";
import type { EstadoAvatar } from "@/lib/game/avatar";
import { SKIN_SLUGS, type SkinSlug } from "@/lib/game/skins";
import { cn } from "@/lib/utils";

export interface SkinOpcion {
  slug: string;
  nombre: string;
  accesorio: string;
  desbloqueada: boolean;
  /** Cómo se consigue (texto ya redactado por `requisitoSkin`). */
  requisito: string;
}

export interface SkinSelectorProps {
  base: string;
  nivel: number;
  estado: EstadoAvatar;
  skins: SkinOpcion[];
  activaInicial: string;
}

const skinSlug = (slug: string): SkinSlug => SKIN_SLUGS.find((s) => s === slug) ?? "clasico";

/** Elige la skin activa. En la demo solo cambia el estado local: guardar la elección es un ticket con backend. */
export function SkinSelector({ base, nivel, estado, skins, activaInicial }: SkinSelectorProps) {
  const [activa, setActiva] = useState(activaInicial);
  const actual = skins.find((s) => s.slug === activa);

  return (
    <section data-component="SkinSelector" className="flex flex-col items-center gap-4">
      <Personaje apariencia={apariencia({ base, estado, skin: skinSlug(activa), nivel })} estado={estado} />
      <p data-testid="skin-activa" className="font-display text-lg font-bold">
        {actual?.nombre ?? "Clásico"}
      </p>
      <ul className="grid w-full grid-cols-2 gap-3">
        {skins.map((s) => (
          <li key={s.slug}>
            <button
              type="button"
              data-testid={`skin-${s.slug}`}
              aria-pressed={s.slug === activa}
              disabled={!s.desbloqueada}
              onClick={() => setActiva(s.slug)}
              className={cn(
                "flex h-full w-full flex-col items-center gap-1 rounded-card-sm border-[2.5px] p-3 text-center",
                s.slug === activa ? "border-grass bg-grass-soft" : "border-border bg-card",
                !s.desbloqueada && "opacity-70",
              )}
            >
              <span aria-hidden className="text-3xl">
                {s.desbloqueada ? s.accesorio || "🙂" : "🔒"}
              </span>
              <span className="font-semibold">{s.nombre}</span>
              <span className="text-xs text-muted-foreground">{s.requisito}</span>
              {!s.desbloqueada && <Pill variant="neutral">Bloqueada</Pill>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
