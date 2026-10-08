import { cva, type VariantProps } from "class-variance-authority";
import Image from "next/image";
import { rutaMiniatura } from "@/lib/game/apariencia";
import { ETIQUETA_ESTADO, type EstadoAvatar } from "@/lib/game/avatar";
import { cn } from "@/lib/utils";

export { ETIQUETA_ESTADO };

const STICKER: Record<EstadoAvatar, string> = { clean: "✨", mild: "😓", rekt: "🌧️" };

/** El deterioro visual se aplica sobre el personaje sin importar su skin (CLAUDE.md §7). */
export const avatarVariants = cva("relative inline-flex shrink-0 select-none items-center justify-center rounded-full border-[2.5px]", {
  variants: {
    estado: {
      clean: "border-grass bg-grass-soft",
      mild: "border-lemon bg-lemon-soft saturate-75",
      rekt: "border-rose bg-rose-soft grayscale-[60%]",
    },
    size: {
      sm: "size-11 text-2xl",
      md: "size-14 text-3xl",
      lg: "size-24 text-6xl",
    },
  },
  defaultVariants: { estado: "clean", size: "md" },
});

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  /** Base del personaje: se dibuja su miniatura (generada desde el modelo 3D). Sin base se usa el emoji. */
  base?: string;
  emoji?: string;
  /** Accesorio de la skin activa (emoji); se coloca sobre la cabeza. */
  accesorio?: string;
  estado: EstadoAvatar;
  /** Sin el sticker de estado: para chips y filas muy chicas. */
  compacto?: boolean;
  /** Sin aro ni dibujo de estado (siempre la figura radiante): donde no se habla de reputación (Dividir, selector…). */
  neutro?: boolean;
  className?: string;
}

export function Avatar({ base, emoji, accesorio, estado, size, compacto = false, neutro = false, className }: AvatarProps) {
  const mostrado: EstadoAvatar = neutro ? "clean" : estado;
  return (
    <span
      className={cn(avatarVariants({ estado: mostrado, size }), neutro && "border-border bg-muted", className)}
      data-testid="avatar"
      role="img"
      aria-label={neutro ? "Personaje" : `Personaje ${ETIQUETA_ESTADO[estado].toLowerCase()}`}
    >
      {base ? (
        <Image src={rutaMiniatura(base, mostrado)} alt="" width={128} height={128} unoptimized className="size-full scale-[1.4] object-contain" />
      ) : (
        <span aria-hidden>{emoji}</span>
      )}
      {accesorio && !base ? (
        <span aria-hidden data-testid="avatar-accesorio" className="absolute -top-[0.3em] left-1/2 -translate-x-1/2 text-[0.5em] leading-none">
          {accesorio}
        </span>
      ) : null}
      {accesorio && base ? (
        // La skin ganada se ve también en las miniaturas (overlay 2D del accesorio): "mi skin" la ve el grupo.
        <span aria-hidden data-testid="avatar-skin" className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-border bg-card text-[0.7rem] leading-none">
          {accesorio}
        </span>
      ) : null}
      {compacto || neutro ? null : (
        <span aria-hidden className="absolute -right-1 -bottom-1 text-base leading-none">
          {STICKER[estado]}
        </span>
      )}
    </span>
  );
}
