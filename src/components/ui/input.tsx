import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full border-4 border-black bg-white px-3 py-2 text-base font-semibold text-black shadow-[5px_5px_0_#111] file:border-0 file:bg-transparent file:text-sm file:font-black placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd500] disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
