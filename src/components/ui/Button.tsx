import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Sombra sólida del color del borde; al presionar el botón se hunde (CLAUDE.md §10). */
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold",
    "border-[2.5px] border-[color:var(--edge)] shadow-[0_4px_0_var(--edge)]",
    "transition-[transform,box-shadow] duration-100",
    "active:translate-y-1 active:shadow-none",
    // Deshabilitado: colores sólidos y legibles (AA), no un botón "fantasma" al 60 %.
    "disabled:pointer-events-none disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none",
  ],
  {
    variants: {
      variant: {
        grass: "bg-grass text-on-accent [--edge:color-mix(in_oklab,var(--grass)_55%,black)]",
        peach: "bg-peach text-on-accent [--edge:color-mix(in_oklab,var(--peach)_55%,black)]",
        rose: "bg-rose text-on-accent [--edge:color-mix(in_oklab,var(--rose)_55%,black)]",
        outline: "bg-card text-foreground [--edge:var(--border)]",
        ghost:
          "border-transparent bg-transparent text-foreground shadow-none hover:bg-muted active:translate-y-0",
      },
      size: {
        sm: "h-11 rounded-2xl px-4 text-sm",
        md: "h-11 rounded-2xl px-5 text-base",
        lg: "h-14 rounded-3xl px-7 text-lg",
      },
    },
    defaultVariants: { variant: "grass", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/** Para que un enlace se vea como botón: `<Link className={buttonVariants({ variant: "peach" })}>`. */
export function Button({ className, variant, size, type, ...props }: ButtonProps) {
  return <button type={type ?? "button"} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
