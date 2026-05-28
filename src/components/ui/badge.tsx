import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center border-4 border-black px-2.5 py-0.5 text-xs font-black uppercase transition-colors", {
  variants: {
    variant: {
      default: "bg-[#ffd500] text-black",
      secondary: "bg-white text-black",
      outline: "bg-[#0057b8] text-white",
      danger: "bg-[#e60012] text-white",
      cyan: "bg-[#0057b8] text-white",
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
