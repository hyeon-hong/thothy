"use client";

import { forwardRef } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";
import { Button, ButtonProps } from "../button";
import { cn } from "../../../lib/utils";

export type TooltipIconButtonProps = ButtonProps & {
  tooltip: string | React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  /**
   * @default 700
   */
  delayduration?: number;
};

export const TooltipIconButton = forwardRef<
  HTMLButtonElement,
  TooltipIconButtonProps
>(
  (
    { children, tooltip, side = "bottom", className, delayduration, ...rest },
    ref
  ) => {
    return (
      <TooltipProvider>
        <Tooltip delayduration={delayduration ?? 700}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              {...rest}
              className={cn("size-6 p-1", className)}
              ref={ref}
            >
              {children}
              <span className="sr-only">{tooltip}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side={side}>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

TooltipIconButton.displayName = "TooltipIconButton";
