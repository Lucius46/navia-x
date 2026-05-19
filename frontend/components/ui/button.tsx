import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-neutral-100 text-neutral-950 shadow-[0_12px_30px_rgba(0,0,0,0.24)] hover:bg-white disabled:bg-neutral-500 disabled:text-neutral-200",
  secondary:
    "border border-neutral-600 bg-neutral-800 text-neutral-100 hover:border-neutral-500 hover:bg-neutral-700",
  ghost: "bg-transparent text-neutral-300 hover:bg-neutral-800"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
