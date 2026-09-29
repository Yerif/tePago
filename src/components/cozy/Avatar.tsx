import { cva, type VariantProps } from "class-variance-authority";
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
  emoji: string;
  estado: EstadoAvatar;
  className?: string;
}

export function Avatar({ emoji, estado, size, className }: AvatarProps) {
  return (
    <span className={cn(avatarVariants({ estado, size }), className)} data-testid="avatar" role="img" aria-label={`Personaje ${ETIQUETA_ESTADO[estado].toLowerCase()}`}>
      <span aria-hidden>{emoji}</span>
      <span aria-hidden className="absolute -right-1 -bottom-1 text-base leading-none">
        {STICKER[estado]}
      </span>
    </span>
  );
}
