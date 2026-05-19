import { forwardRef, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[160px] w-full rounded-[24px] border border-neutral-600 bg-neutral-800 px-4 py-4 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-neutral-400 focus:ring-4 focus:ring-white/10",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
