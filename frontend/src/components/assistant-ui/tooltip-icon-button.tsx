"use client";

import { ButtonHTMLAttributes, FC } from "react";
import { cn } from "@/lib/utils";

interface TooltipIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip?: string;
}

export const TooltipIconButton: FC<TooltipIconButtonProps> = ({
  tooltip,
  className,
  children,
  ...props
}) => {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-6 w-6",
        className
      )}
      title={tooltip}
      {...props}
    >
      {children}
    </button>
  );
};
