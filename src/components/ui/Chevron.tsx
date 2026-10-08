import { cn } from "@/lib/utils";

/**
 * La flechita de un plegable: "▾" cerrado y "▴" abierto (gira sola con `details[open]`, ver globals.css). Va al final de
 * un `<summary>` para que se note que se puede tocar (UX2-08).
 */
export function Chevron({ className }: { className?: string }) {
  return (
    <span aria-hidden data-testid="chevron" className={cn("chevron-plegable ml-auto shrink-0 pl-3 text-xl leading-none text-muted-foreground", className)}>
      ▾
    </span>
  );
}
