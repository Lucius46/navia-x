import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-neutral-700 bg-[rgba(38,38,38,0.95)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}
