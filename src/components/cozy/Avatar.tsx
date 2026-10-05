import { cva, type VariantProps } from "class-variance-authority";
import Image from "next/image";
import { rutaMiniatura } from "@/lib/game/apariencia";
import type { EstadoAvatar } from "@/lib/game/avatar";
import { cn } from "@/lib/utils";

export const ETIQUETA_ESTADO: Record<EstadoAvatar, string> = {
  clean: "Radiante",
  mild: "Apagado",
  rekt: "Deteriorado",
};

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
  className?: string;
}

export function Avatar({ base, emoji, accesorio, estado, size, compacto = false, className }: AvatarProps) {
  return (
    <span className={cn(avatarVariants({ estado, size }), className)} data-testid="avatar" role="img" aria-label={`Personaje ${ETIQUETA_ESTADO[estado].toLowerCase()}`}>
      {base ? (
        <Image src={rutaMiniatura(base, estado)} alt="" width={128} height={128} unoptimized className="size-full scale-[1.3] object-contain" />
      ) : (
        <span aria-hidden>{emoji}</span>
      )}
      {accesorio && !base ? (
        <span aria-hidden data-testid="avatar-accesorio" className="absolute -top-[0.3em] left-1/2 -translate-x-1/2 text-[0.5em] leading-none">
          {accesorio}
        </span>
      ) : null}
      {compacto ? null : (
        <span aria-hidden className="absolute -right-1 -bottom-1 text-base leading-none">
          {STICKER[estado]}
        </span>
      )}
    </span>
  );
}
