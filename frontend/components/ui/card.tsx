import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-line bg-white/95 p-6 shadow-panel backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}
