import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap border-4 border-black text-sm font-black uppercase tracking-normal shadow-[5px_5px_0_#111] transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd500] disabled:pointer-events-none disabled:opacity-45 active:translate-x-1 active:translate-y-1 active:shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#ffd500] text-black hover:bg-[#ffe45c]",
        secondary: "bg-white text-black hover:bg-neutral-100",
        ghost: "border-transparent bg-transparent text-black shadow-none hover:bg-[#ffd500]",
        danger: "bg-[#e60012] text-white hover:bg-[#ff2635]",
        outline: "bg-[#0057b8] text-white hover:bg-[#0b6fe8]",
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
