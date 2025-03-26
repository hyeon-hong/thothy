"use client";

import { forwardRef } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Separate tooltip-specific props from button props
type TooltipProps = {
  tooltip: string;
  side?: "top" | "bottom" | "left" | "right";
  delayduration?: number;
};

// Add a whitelist of props we want to pass to Button
type SafeButtonProps = Omit<ButtonProps, 
  | 'delayduration' 
  | 'skipDelayDuration'
  | 'tooltip'
  | 'side'
>;

export type TooltipIconButtonProps = SafeButtonProps & TooltipProps;

export const TooltipIconButton = forwardRef<
  HTMLButtonElement,
  TooltipIconButtonProps
>(({ children, tooltip, side = "bottom", className, delayduration, ...rest }, ref) => {
  // Create a clean set of props to pass to Button, explicitly removing tooltip props
  const buttonProps: SafeButtonProps = { ...rest };
  
  return (
    <TooltipProvider delayduration={delayduration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-6 p-1", className)}
            ref={ref}
            {...buttonProps}
          >
            {children}
            <span className="sr-only">{tooltip}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side={side}>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

TooltipIconButton.displayName = "TooltipIconButton";
