import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        accent: "border-transparent bg-accent text-accent-foreground hover:bg-accent/80",
        success: "border-emerald-500/30 bg-emerald-500/20 text-emerald-400",
        warning: "border-amber-500/30 bg-amber-500/20 text-amber-400",
        online:
          "border-transparent bg-emerald-500/20 text-emerald-400 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-400 before:mr-1",
        busy: "border-transparent bg-amber-500/20 text-amber-400 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-amber-400 before:mr-1",
        offline:
          "border-transparent bg-muted text-muted-foreground before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-muted-foreground before:mr-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
