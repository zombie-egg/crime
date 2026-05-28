import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-7 w-7 shrink-0 rounded-sm border border-fuchsia-300/60 bg-black/45 text-white shadow-[0_0_18px_rgba(217,70,239,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff184f] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[#ff184f] data-[state=checked]:bg-[#ff184f]",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Check className="h-5 w-5 stroke-[4]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
