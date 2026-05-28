import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[96px] w-full rounded-md border border-violet-400/45 bg-black/45 px-3 py-2 text-base font-semibold text-white shadow-[inset_0_0_18px_rgba(0,0,0,0.4)] placeholder:text-violet-200/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff184f] disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
