"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

// Add a helper function to filter tooltip-specific props
const filterTooltipProps = (props: Record<string, any>) => {
  const { delayduration, skipDelayDuration, ...rest } = props
  return rest
}

type TooltipProviderProps = Omit<React.ComponentProps<typeof TooltipPrimitive.Provider>, 'delayDuration'> & {
  delayduration?: number;
  children: React.ReactNode;
}

function TooltipProvider({
  delayduration = 0,
  children,
  ...props
}: TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayduration}
      {...filterTooltipProps(props)}
    >
      {children}
    </TooltipPrimitive.Provider>
  )
}

type TooltipProps = React.ComponentProps<typeof TooltipPrimitive.Root> & {
  delayduration?: number;
}

function Tooltip({
  children,
  delayduration,
  ...props
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root {...filterTooltipProps(props)}>
      {children}
    </TooltipPrimitive.Root>
  )
}

type TooltipTriggerProps = React.ComponentProps<typeof TooltipPrimitive.Trigger>

function TooltipTrigger({
  children,
  ...props
}: TooltipTriggerProps) {
  // Make sure we remove ALL tooltip-related props that could leak down
  return (
    <TooltipPrimitive.Trigger 
      data-slot="tooltip-trigger" 
      {...filterTooltipProps(props)}
    >
      {children}
    </TooltipPrimitive.Trigger>
  )
}

type TooltipContentProps = React.ComponentProps<typeof TooltipPrimitive.Content> & {
  className?: string
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit rounded-md px-3 py-1.5 text-xs text-balance",
          className
        )}
        {...filterTooltipProps(props)}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
export type { TooltipProps, TooltipTriggerProps, TooltipContentProps, TooltipProviderProps }
