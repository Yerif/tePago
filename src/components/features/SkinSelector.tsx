"use client";

import { Pill } from "@/components/cozy/Pill";
import { Button } from "@/components/ui/Button";
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
  skins: SkinOpcion[];
  activa: string;
  /** Skin bloqueada que se está probando (vista previa de unos segundos), si hay. */
  probando: string | null;
  onElegir: (slug: string) => void;
  /** Probar una skin bloqueada sobre tu personaje: solo vista previa, no se activa ni se guarda. */
  onProbar: (slug: string) => void;
}

/**
 * Las skins como tarjetas: se elige la activa y las bloqueadas se pueden PROBAR unos segundos sobre el héroe (no cambia la
 * regla de que se ganan). El personaje vive en el héroe de la pantalla (un solo canvas 3D), no aquí.
 */
export function SkinSelector({ skins, activa, probando, onElegir, onProbar }: SkinSelectorProps) {
  return (
    <section data-component="SkinSelector" className="flex flex-col gap-3">
      <ul className="grid w-full grid-cols-2 gap-3">
        {skins.map((s) => (
          <li key={s.slug} className="flex flex-col gap-2">
            <button
              type="button"
              data-testid={`skin-${s.slug}`}
              aria-pressed={s.slug === activa}
              disabled={!s.desbloqueada}
              onClick={() => onElegir(s.slug)}
              className={cn(
                "flex min-h-11 w-full flex-1 flex-col items-center gap-1 rounded-card-sm border-[2.5px] p-3 text-center",
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
            {!s.desbloqueada && (
              <Button size="sm" variant="outline" data-testid={`skin-probar-${s.slug}`} aria-pressed={probando === s.slug} onClick={() => onProbar(s.slug)}>
                {probando === s.slug ? "Probando…" : "Probar 3 s"}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
