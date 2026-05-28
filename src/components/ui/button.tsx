import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-black uppercase tracking-normal transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff184f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090512] disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "border-[#ff184f] bg-[#ff184f] text-white shadow-[0_0_24px_rgba(255,24,79,0.42)] hover:bg-[#ff3d68] hover:shadow-[0_0_34px_rgba(255,24,79,0.7)]",
        secondary: "border-violet-500/40 bg-violet-950/60 text-violet-50 hover:border-fuchsia-400 hover:bg-violet-900/80",
        ghost: "border-transparent bg-transparent text-violet-100 hover:border-fuchsia-500/40 hover:bg-fuchsia-500/10 hover:text-white",
        danger: "border-red-500 bg-red-700 text-white shadow-[0_0_22px_rgba(220,38,38,0.45)] hover:bg-red-600",
        outline: "border-fuchsia-400/70 bg-transparent text-fuchsia-100 shadow-[inset_0_0_18px_rgba(217,70,239,0.15)] hover:bg-fuchsia-500/15 hover:text-white",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-13 px-5 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button };
