import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-black uppercase transition-colors", {
  variants: {
    variant: {
      default: "border-[#ff184f] bg-[#ff184f]/20 text-red-100 shadow-[0_0_16px_rgba(255,24,79,0.25)]",
      secondary: "border-violet-400/35 bg-violet-950/60 text-violet-100",
      outline: "border-fuchsia-300/60 bg-fuchsia-500/10 text-fuchsia-100",
      danger: "border-red-500 bg-red-600/35 text-red-50",
      cyan: "border-cyan-300/60 bg-cyan-400/10 text-cyan-100",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
