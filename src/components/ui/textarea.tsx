import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[96px] w-full border-4 border-black bg-white px-3 py-2 text-base font-semibold text-black shadow-[5px_5px_0_#111] placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd500] disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
