import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full rounded-md border border-violet-400/45 bg-black/45 px-3 py-2 text-base font-semibold text-white shadow-[inset_0_0_18px_rgba(0,0,0,0.4)] file:border-0 file:bg-transparent file:text-sm file:font-black placeholder:text-violet-200/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff184f] disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
