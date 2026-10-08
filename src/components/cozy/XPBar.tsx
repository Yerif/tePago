import { cn } from "@/lib/utils";

export interface XPBarProps {
  nivel: number;
  /** XP acumulada dentro del nivel actual. */
  xp: number;
  /** XP que pide el nivel actual para subir al siguiente. */
  xpSiguiente: number;
  className?: string;
}

export function XPBar({ nivel, xp, xpSiguiente, className }: XPBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round((xp / xpSiguiente) * 100)));
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-display font-bold" data-testid="xp-nivel">
          Nivel {nivel}
        </span>
        <span className="text-muted-foreground" data-testid="xp-valor">
          {xp} / {xpSiguiente} XP
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`Progreso al nivel ${nivel + 1}`}
        aria-valuemin={0}
        aria-valuemax={xpSiguiente}
        aria-valuenow={xp}
        className="h-4 overflow-hidden rounded-full border-2 border-border bg-muted"
      >
        <div className="h-full rounded-full bg-grass-text" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
