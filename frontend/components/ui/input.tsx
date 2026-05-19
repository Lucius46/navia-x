import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-2xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-neutral-400 focus:ring-4 focus:ring-white/10",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";
