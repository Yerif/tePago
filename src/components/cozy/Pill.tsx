import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Pastilla para badges y estados. En dark el texto usa el color vivo del acento. */
export const pillVariants = cva(
  "inline-flex items-center gap-1 rounded-full border-2 px-3 py-0.5 text-sm font-semibold",
  {
    variants: {
      variant: {
        neutral: "border-border bg-muted text-muted-foreground",
        grass: "border-grass bg-grass-soft text-grass-text",
        peach: "border-peach bg-peach-soft text-peach-text",
        rose: "border-rose bg-rose-soft text-rose-text",
        lemon: "border-lemon bg-lemon-soft text-lemon-text",
        mint: "border-mint bg-mint-soft text-mint-text",
        lavender: "border-lavender bg-lavender-soft text-lavender-text",
        water: "border-water bg-water-soft text-water-text",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface PillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {}

export function Pill({ className, variant, ...props }: PillProps) {
  return <span className={cn(pillVariants({ variant }), className)} {...props} />;
}
