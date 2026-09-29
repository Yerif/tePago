import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const cardVariants = cva(
  [
    "border-[2.5px] border-border bg-card text-card-foreground",
    "shadow-[0_4px_0_var(--border),0_10px_24px_-10px_rgb(0_0_0/0.35)]",
  ],
  {
    variants: {
      size: {
        md: "rounded-card p-5",
        sm: "rounded-card-sm p-4",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, size, ...props }: CardProps) {
  return <div className={cn(cardVariants({ size }), className)} {...props} />;
}
