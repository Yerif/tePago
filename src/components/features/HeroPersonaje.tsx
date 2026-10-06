"use client";

import { ETIQUETA_ESTADO } from "@/components/cozy/Avatar";
import { Pill } from "@/components/cozy/Pill";
import { XPBar } from "@/components/cozy/XPBar";
import { Personaje } from "@/components/personaje/Personaje";
import type { Apariencia } from "@/lib/game/apariencia";
import type { EstadoAvatar } from "@/lib/game/avatar";

export interface HeroPersonajeProps {
  nombre: string;
  apariencia: Apariencia;
  estado: EstadoAvatar;
  nivel: number;
  xp: number;
  xpSiguiente: number;
  /** Sube cuando hay algo que festejar. */
  celebrar: number;
  /** Lo que "dice" el personaje (frase por estado o reacción a lo último que hiciste). */
  frase: string;
  /** Líneas de "si pagas a X pasas a Y". */
  camino: string[];
}

const VARIANTE = { clean: "grass", mild: "lemon", rekt: "rose" } as const;

/**
 * El héroe del Inicio (PX-03): tu personaje a 128 px junto a tu nombre, estado y nivel, con un globo de una frase y el vínculo
 * "si pagas a X pasas a Y". Es el único canvas 3D de la pantalla; llega como miniatura PNG y se cambia por el 3D.
 */
export function HeroPersonaje({ nombre, apariencia, estado, nivel, xp, xpSiguiente, celebrar, frase, camino }: HeroPersonajeProps) {
  return (
    <section data-component="HeroPersonaje" data-testid="inicio-hero" aria-label="Tu personaje" className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Personaje className="h-32 w-32 shrink-0" apariencia={apariencia} estado={estado} celebrar={celebrar} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-bold">Hola, {nombre} 👋</h1>
          <Pill variant={VARIANTE[estado]} data-testid="inicio-estado">
            {ETIQUETA_ESTADO[estado]}
          </Pill>
          <XPBar className="mt-2" nivel={nivel} xp={xp} xpSiguiente={xpSiguiente} />
        </div>
      </div>
      <p data-testid="inicio-globo" aria-live="polite" className="relative rounded-2xl border-2 border-border bg-card px-3 py-2 text-sm">
        <span aria-hidden className="absolute -top-2 left-10 size-3 rotate-45 border-t-2 border-l-2 border-border bg-card" />
        {frase}
      </p>
      {camino.map((linea) => (
        <p key={linea} data-testid="inicio-camino" className="text-sm text-muted-foreground">
          {linea}
        </p>
      ))}
    </section>
  );
}
